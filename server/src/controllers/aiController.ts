import { Response } from 'express';
import { Types } from 'mongoose';
import { Document } from '../models/Document.js';
import { Claim } from '../models/Claim.js';
import { AIExtraction } from '../models/AIExtraction.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { AIService } from '../services/aiService.js';
import { AuditService } from '../services/auditService.js';

export class AIController {
  /**
   * Run AI document extraction on an uploaded claim document.
   */
  public static async runExtraction(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { claimId, documentId } = req.body;

      if (!claimId || !documentId) {
        res.status(400).json({ success: false, message: 'claimId and documentId are required' });
        return;
      }

      const [claim, doc] = await Promise.all([
        Claim.findById(claimId),
        Document.findById(documentId),
      ]);

      if (!claim) {
        res.status(404).json({ success: false, message: 'Claim not found' });
        return;
      }

      if (!doc) {
        res.status(404).json({ success: false, message: 'Document not found' });
        return;
      }

      const documentText = doc.extractedText || `Document: ${doc.originalName} (${doc.documentType})`;

      // Invoke real AI service
      const aiResponse = await AIService.analyzeDocument(documentText, doc.documentType);

      // Create or update AIExtraction record
      const extraction = new AIExtraction({
        claimId: claim._id,
        documentId: doc._id,
        model: aiResponse.modelUsed,
        extractedFields: aiResponse.extractedFields || {},
        validationResults: {
          isValid: aiResponse.success,
          hasLowConfidenceFields: aiResponse.uncertainFields.length > 0,
          uncertainFields: aiResponse.uncertainFields,
          missingMandatoryFields: aiResponse.missingMandatoryFields,
        },
        warnings: aiResponse.warnings,
        requiresManualReview: aiResponse.requiresManualReview,
        processingStatus: aiResponse.status,
        errorMessage: aiResponse.errorMessage,
      });

      const savedExtraction = await extraction.save();

      await AuditService.log({
        claimId: claim._id,
        action: 'AI_ANALYSIS_COMPLETED',
        entityType: 'AI_EXTRACTION',
        performedBy: req.user.userId,
        performedByRole: req.user.role,
        newValue: {
          extractionId: savedExtraction._id,
          model: savedExtraction.model,
          status: savedExtraction.processingStatus,
          uncertainFields: savedExtraction.validationResults.uncertainFields,
          requiresManualReview: savedExtraction.requiresManualReview,
        },
        details: {
          message: `AI extraction processed with status: ${savedExtraction.processingStatus}. Uncertain fields: ${savedExtraction.validationResults.uncertainFields.length}`,
        },
      });

      res.status(200).json({
        success: aiResponse.success,
        data: savedExtraction,
        message: aiResponse.success
          ? 'AI document extraction completed successfully'
          : `AI Extraction notice: ${aiResponse.errorMessage || 'Review required'}`,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'AI document extraction failed',
        error: (error as Error).message,
      });
    }
  }

  /**
   * Human-in-the-loop manual correction of uncertain AI fields.
   */
  public static async manualOverride(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { extractionId, fieldName, correctedValue, correctionReason } = req.body;

      if (!extractionId || !fieldName || correctionReason === undefined) {
        res.status(400).json({
          success: false,
          message: 'extractionId, fieldName, and correctionReason are mandatory for audit compliance.',
        });
        return;
      }

      const extraction = await AIExtraction.findById(extractionId);
      if (!extraction) {
        res.status(404).json({ success: false, message: 'AI Extraction record not found' });
        return;
      }

      const claim = await Claim.findById(extraction.claimId);
      if (!claim) {
        res.status(404).json({ success: false, message: 'Associated claim record not found' });
        return;
      }

      const extractedFields = extraction.extractedFields as Record<string, any>;
      const originalFieldObj = extractedFields[fieldName] || {};
      const originalValue = originalFieldObj.value ?? null;

      // Update field with verified status and reason
      extractedFields[fieldName] = {
        ...originalFieldObj,
        value: correctedValue,
        isVerified: true,
        verifiedValue: correctedValue,
        verifiedBy: req.user.name,
        verifiedAt: new Date(),
        verificationReason: correctionReason,
        confidence: 1.0, // Human verified
      };

      // Remove from uncertainFields and missingMandatoryFields
      const uncertainList = extraction.validationResults.uncertainFields.filter((f) => f !== fieldName);
      const missingList = extraction.validationResults.missingMandatoryFields.filter((f) => f !== fieldName);

      extraction.validationResults.uncertainFields = uncertainList;
      extraction.validationResults.missingMandatoryFields = missingList;
      extraction.validationResults.hasLowConfidenceFields = uncertainList.length > 0;
      extraction.requiresManualReview = uncertainList.length > 0 || missingList.length > 0;
      extraction.markModified('extractedFields');
      extraction.markModified('validationResults');

      const savedExtraction = await extraction.save();

      // Sync verified value to claim record if it maps to standard claim fields
      let claimUpdated = false;
      if (fieldName === 'patientName' && typeof correctedValue === 'string') {
        claim.patientDetails.name = correctedValue;
        claimUpdated = true;
      } else if (fieldName === 'policyNumber' && typeof correctedValue === 'string') {
        claim.insuranceDetails.policyNumber = correctedValue;
        claimUpdated = true;
      } else if (fieldName === 'diagnosis' && typeof correctedValue === 'string') {
        claim.admissionDetails.diagnosis = correctedValue;
        claimUpdated = true;
      } else if (fieldName === 'primaryICD10' && typeof correctedValue === 'string') {
        claim.admissionDetails.primaryICD10 = correctedValue;
        claimUpdated = true;
      } else if (fieldName === 'icdCodes' && Array.isArray(correctedValue) && correctedValue.length > 0) {
        claim.admissionDetails.primaryICD10 = correctedValue[0]?.code || claim.admissionDetails.primaryICD10;
        claim.admissionDetails.secondaryICD10 = correctedValue.slice(1).map((c: any) => c.code);
        claimUpdated = true;
      } else if (fieldName === 'claimedAmount' && typeof correctedValue === 'number') {
        claim.financialDetails.totalClaimedAmount = correctedValue;
        claimUpdated = true;
      }

      if (claimUpdated) {
        await claim.save();
      }

      // Record immutable audit entry
      await AuditService.log({
        claimId: claim._id,
        action: 'AI_FIELD_CORRECTED',
        entityType: 'AI_EXTRACTION',
        performedBy: req.user.userId,
        performedByRole: req.user.role,
        previousValue: { fieldName, originalValue },
        newValue: { fieldName, correctedValue, verified: true },
        details: {
          correctionReason,
          remainingUncertainFields: uncertainList,
          requiresManualReview: extraction.requiresManualReview,
        },
      });

      res.status(200).json({
        success: true,
        message: `Field '${fieldName}' manually verified and updated`,
        data: {
          extraction: savedExtraction,
          claim,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to apply manual override',
        error: (error as Error).message,
      });
    }
  }
}
