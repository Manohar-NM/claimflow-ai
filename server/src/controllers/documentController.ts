import { Response } from 'express';
import path from 'path';
import fs from 'fs';
import { Types } from 'mongoose';
import { Document } from '../models/Document.js';
import { Claim } from '../models/Claim.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { DocumentService } from '../services/documentService.js';
import { AuditService } from '../services/auditService.js';
import { config } from '../config/index.js';

export class DocumentController {
  /**
   * Upload and process a clinical or billing document.
   */
  public static async uploadDocument(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      if (!req.file) {
        res.status(400).json({ success: false, message: 'No document file uploaded' });
        return;
      }

      const { claimId, documentType } = req.body;

      if (!claimId || !Types.ObjectId.isValid(claimId)) {
        DocumentService.deleteFile(req.file.path);
        res.status(400).json({ success: false, message: 'A valid claimId is required' });
        return;
      }

      const claim = await Claim.findById(claimId);
      if (!claim) {
        DocumentService.deleteFile(req.file.path);
        res.status(404).json({ success: false, message: 'Associated claim record not found' });
        return;
      }

      // Check permissions: TPA users cannot upload or modify hospital medical documents
      if (req.user.role === 'TPA_MANAGER') {
        DocumentService.deleteFile(req.file.path);
        res.status(403).json({
          success: false,
          message: 'TPA users are not permitted to upload or modify original hospital medical documents.',
        });
        return;
      }

      // Extract text content deterministically (e.g. from PDF)
      const extractedText = await DocumentService.extractDocumentText(
        req.file.path,
        req.file.mimetype
      );

      const document = new Document({
        claimId: claim._id,
        fileName: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        storageKey: req.file.path,
        fileSize: req.file.size,
        uploadedBy: new Types.ObjectId(req.user.userId),
        documentType: documentType || 'MEDICAL_BILL',
        extractedText,
      });

      const savedDoc = await document.save();

      await AuditService.log({
        claimId: claim._id,
        action: 'DOCUMENT_UPLOADED',
        entityType: 'DOCUMENT',
        performedBy: req.user.userId,
        performedByRole: req.user.role,
        newValue: {
          documentId: savedDoc._id,
          fileName: savedDoc.originalName,
          documentType: savedDoc.documentType,
          fileSize: savedDoc.fileSize,
        },
        details: { message: `Uploaded ${savedDoc.documentType}: ${savedDoc.originalName}` },
      });

      res.status(201).json({
        success: true,
        message: 'Document uploaded and indexed successfully',
        data: savedDoc,
      });
    } catch (error) {
      if (req.file) {
        DocumentService.deleteFile(req.file.path);
      }
      res.status(500).json({
        success: false,
        message: 'Failed to upload document',
        error: (error as Error).message,
      });
    }
  }

  /**
   * Stream or download stored document file.
   */
  public static async getDocumentFile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const doc = await Document.findById(id);
      if (!doc) {
        res.status(404).json({ success: false, message: 'Document record not found' });
        return;
      }

      const filePath = path.resolve(doc.storageKey);
      if (!fs.existsSync(filePath)) {
        res.status(404).json({ success: false, message: 'File not found on storage server' });
        return;
      }

      res.setHeader('Content-Type', doc.mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${doc.originalName}"`);
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error streaming document',
        error: (error as Error).message,
      });
    }
  }

  /**
   * Delete document (Hospital staff only, only during draft stage).
   */
  public static async deleteDocument(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const doc = await Document.findById(id);
      if (!doc) {
        res.status(404).json({ success: false, message: 'Document not found' });
        return;
      }

      const claim = await Claim.findById(doc.claimId);
      if (!claim || claim.status !== 'DRAFT') {
        res.status(400).json({
          success: false,
          message: 'Documents can only be removed while claim is in DRAFT status.',
        });
        return;
      }

      DocumentService.deleteFile(doc.storageKey);
      await Document.findByIdAndDelete(id);

      await AuditService.log({
        claimId: claim._id,
        action: 'DOCUMENT_DELETED',
        entityType: 'DOCUMENT',
        performedBy: req.user.userId,
        performedByRole: req.user.role,
        previousValue: { fileName: doc.originalName },
        details: { message: `Removed document: ${doc.originalName}` },
      });

      res.status(200).json({ success: true, message: 'Document deleted successfully' });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to delete document',
        error: (error as Error).message,
      });
    }
  }
}

