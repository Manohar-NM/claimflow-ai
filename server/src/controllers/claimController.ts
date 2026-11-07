import { Response } from 'express';
import { Types } from 'mongoose';
import { Claim, IClaim } from '../models/Claim.js';
import { Document } from '../models/Document.js';
import { AIExtraction } from '../models/AIExtraction.js';
import { TPAQuery } from '../models/TPAQuery.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { AuditService } from '../services/auditService.js';
import { FinancialService } from '../services/financialService.js';
import { StateMachineService } from '../services/stateMachineService.js';
import { ClaimStatus } from '../types/index.js';

export class ClaimController {
  /**
   * Helper to generate unique hospital claim IDs: CF-YYYYMM-XXXX
   */
  private static generateClaimId(): string {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const randomHex = Math.floor(1000 + Math.random() * 9000);
    return `CF-${yearMonth}-${randomHex}`;
  }

  /**
   * Get paginated, searchable, filterable list of claims.
   */
  public static async getClaims(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const {
        status,
        tpaProvider,
        search,
        startDate,
        endDate,
        page = '1',
        limit = '50',
      } = req.query;

      const filter: Record<string, any> = {};

      if (status && status !== 'ALL') {
        filter.status = status;
      }

      if (tpaProvider && tpaProvider !== 'ALL') {
        filter.tpaProvider = tpaProvider;
      }

      if (startDate || endDate) {
        filter['admissionDetails.admissionDate'] = {};
        if (startDate) {
          filter['admissionDetails.admissionDate'].$gte = new Date(startDate as string);
        }
        if (endDate) {
          filter['admissionDetails.admissionDate'].$lte = new Date(endDate as string);
        }
      }

      if (search) {
        const searchRegex = new RegExp(String(search).trim(), 'i');
        filter.$or = [
          { claimId: searchRegex },
          { 'patientDetails.name': searchRegex },
          { 'insuranceDetails.policyNumber': searchRegex },
          { 'patientDetails.patientId': searchRegex },
        ];
      }

      const pageNum = parseInt(page as string, 10) || 1;
      const limitNum = parseInt(limit as string, 10) || 50;
      const skip = (pageNum - 1) * limitNum;

      const [claims, totalCount] = await Promise.all([
        Claim.find(filter)
          .sort({ updatedAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .populate('createdBy', 'name email role')
          .lean(),
        Claim.countDocuments(filter),
      ]);

      res.status(200).json({
        success: true,
        data: claims,
        pagination: {
          total: totalCount,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(totalCount / limitNum),
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve claims',
        error: (error as Error).message,
      });
    }
  }

  /**
   * Get single claim by ID with full relational context.
   */
  public static async getClaimById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const claim = await Claim.findOne({
        $or: [{ _id: Types.ObjectId.isValid(id) ? new Types.ObjectId(id) : null }, { claimId: id }],
      })
        .populate('createdBy', 'name email role organization')
        .populate('assignedTo', 'name email role organization');

      if (!claim) {
        res.status(404).json({ success: false, message: 'Claim record not found' });
        return;
      }

      const [documents, aiExtractions, queries, auditLogs] = await Promise.all([
        Document.find({ claimId: claim._id }).sort({ uploadedAt: -1 }).lean(),
        AIExtraction.find({ claimId: claim._id }).sort({ createdAt: -1 }).lean(),
        TPAQuery.find({ claimId: claim._id })
          .populate('raisedBy', 'name email role')
          .populate('respondedBy', 'name email role')
          .populate('supportingDocuments')
          .sort({ createdAt: -1 })
          .lean(),
        AuditService.getLogsByClaim(claim._id.toString()),
      ]);

      const financialValidation = FinancialService.validateFinancials(
        claim.financialDetails,
        claim.insuranceDetails
      );

      res.status(200).json({
        success: true,
        data: {
          claim,
          documents,
          aiExtractions,
          queries,
          auditLogs,
          financialValidation,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch claim details',
        error: (error as Error).message,
      });
    }
  }

  /**
   * Create a new draft claim (Hospital Staff only).
   */
  public static async createClaim(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const {
        patientDetails,
        insuranceDetails,
        admissionDetails,
        financialDetails,
        tpaProvider,
      } = req.body;

      const claimId = ClaimController.generateClaimId();

      const claim = new Claim({
        claimId,
        patientDetails,
        insuranceDetails,
        admissionDetails,
        financialDetails,
        tpaProvider,
        status: 'DRAFT',
        createdBy: new Types.ObjectId(req.user.userId),
      });

      const savedClaim = await claim.save();

      await AuditService.log({
        claimId: savedClaim._id,
        action: 'CLAIM_CREATED',
        entityType: 'CLAIM',
        performedBy: req.user.userId,
        performedByRole: req.user.role,
        newValue: {
          claimId: savedClaim.claimId,
          patientName: savedClaim.patientDetails.name,
          claimedAmount: savedClaim.financialDetails.totalClaimedAmount,
          tpaProvider: savedClaim.tpaProvider,
        },
        details: { message: 'Initial draft claim record initialized by hospital billing staff.' },
      });

      res.status(201).json({
        success: true,
        message: 'Draft claim created successfully',
        data: savedClaim,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to create claim',
        error: (error as Error).message,
      });
    }
  }

  /**
   * Update draft claim details (Hospital Staff only).
   */
  public static async updateClaim(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const claim = await Claim.findById(id);

      if (!claim) {
        res.status(404).json({ success: false, message: 'Claim not found' });
        return;
      }

      if (claim.status !== 'DRAFT') {
        res.status(400).json({
          success: false,
          message: `Cannot edit claim in '${claim.status}' status. Only DRAFT claims may be modified directly.`,
        });
        return;
      }

      const previousSnapshot = claim.toObject();

      // Merge updates
      if (req.body.patientDetails) claim.patientDetails = { ...claim.patientDetails, ...req.body.patientDetails };
      if (req.body.insuranceDetails) claim.insuranceDetails = { ...claim.insuranceDetails, ...req.body.insuranceDetails };
      if (req.body.admissionDetails) claim.admissionDetails = { ...claim.admissionDetails, ...req.body.admissionDetails };
      if (req.body.financialDetails) claim.financialDetails = { ...claim.financialDetails, ...req.body.financialDetails };
      if (req.body.tpaProvider) claim.tpaProvider = req.body.tpaProvider;

      const updatedClaim = await claim.save();

      await AuditService.log({
        claimId: updatedClaim._id,
        action: 'CLAIM_UPDATED',
        entityType: 'CLAIM',
        performedBy: req.user.userId,
        performedByRole: req.user.role,
        previousValue: previousSnapshot,
        newValue: updatedClaim.toObject(),
        details: { message: 'Draft claim details updated by hospital staff.' },
      });

      res.status(200).json({
        success: true,
        message: 'Claim updated successfully',
        data: updatedClaim,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update claim',
        error: (error as Error).message,
      });
    }
  }

  /**
   * Submit claim for TPA Pre-authorization (DRAFT -> SUBMITTED).
   */
  public static async submitClaim(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const claim = await Claim.findById(id);

      if (!claim) {
        res.status(404).json({ success: false, message: 'Claim not found' });
        return;
      }

      // Check state transition authorization
      const transitionCheck = StateMachineService.canTransition(claim.status, 'SUBMITTED', req.user.role);
      if (!transitionCheck.allowed) {
        res.status(400).json({ success: false, message: transitionCheck.reason });
        return;
      }

      // Check whether there are unreviewed uncertain fields in AI extraction
      const latestExtraction = await AIExtraction.findOne({ claimId: claim._id }).sort({ createdAt: -1 });
      if (latestExtraction && latestExtraction.requiresManualReview) {
        res.status(400).json({
          success: false,
          message:
            'Cannot submit claim: AI extraction contains uncertain fields (<0.80 confidence) or missing mandatory codes that require human review and verification.',
          uncertainFields: latestExtraction.validationResults.uncertainFields,
        });
        return;
      }

      // Verify mandatory medical fields
      if (!claim.admissionDetails.diagnosis || !claim.admissionDetails.primaryICD10) {
        res.status(400).json({
          success: false,
          message: 'Cannot submit claim: Clinical diagnosis and Primary ICD-10 code are mandatory for pre-authorization.',
        });
        return;
      }

      const prevStatus = claim.status;
      claim.status = 'SUBMITTED';
      claim.submittedAt = new Date();
      const updatedClaim = await claim.save();

      await AuditService.log({
        claimId: updatedClaim._id,
        action: 'CLAIM_SUBMITTED',
        entityType: 'CLAIM',
        performedBy: req.user.userId,
        performedByRole: req.user.role,
        previousValue: { status: prevStatus },
        newValue: { status: 'SUBMITTED', submittedAt: updatedClaim.submittedAt },
        details: { message: 'Pre-authorization request formally submitted to TPA queue.' },
      });

      res.status(200).json({
        success: true,
        message: 'Claim submitted successfully to TPA queue',
        data: updatedClaim,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to submit claim',
        error: (error as Error).message,
      });
    }
  }

  /**
   * TPA Manager moves claim from SUBMITTED to TPA_REVIEW.
   */
  public static async startTPAReview(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const claim = await Claim.findById(id);

      if (!claim) {
        res.status(404).json({ success: false, message: 'Claim not found' });
        return;
      }

      const transitionCheck = StateMachineService.canTransition(claim.status, 'TPA_REVIEW', req.user.role);
      if (!transitionCheck.allowed) {
        res.status(400).json({ success: false, message: transitionCheck.reason });
        return;
      }

      const prevStatus = claim.status;
      claim.status = 'TPA_REVIEW';
      claim.assignedTo = new Types.ObjectId(req.user.userId);
      const updatedClaim = await claim.save();

      await AuditService.log({
        claimId: updatedClaim._id,
        action: 'TPA_REVIEW_STARTED',
        entityType: 'CLAIM',
        performedBy: req.user.userId,
        performedByRole: req.user.role,
        previousValue: { status: prevStatus },
        newValue: { status: 'TPA_REVIEW', assignedTo: req.user.name },
        details: { message: 'TPA underwriter has picked up the claim for adjudication.' },
      });

      res.status(200).json({
        success: true,
        message: 'Claim moved to TPA Review status',
        data: updatedClaim,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to initiate TPA review',
        error: (error as Error).message,
      });
    }
  }

  /**
   * TPA Manager Approves Claim.
   */
  public static async approveClaim(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const { authorizedAmount, remarks } = req.body;

      const claim = await Claim.findById(id);
      if (!claim) {
        res.status(404).json({ success: false, message: 'Claim not found' });
        return;
      }

      const transitionCheck = StateMachineService.canTransition(claim.status, 'APPROVED', req.user.role);
      if (!transitionCheck.allowed) {
        res.status(400).json({ success: false, message: transitionCheck.reason });
        return;
      }

      // Financial validation
      const validation = FinancialService.validateApprovedAmount(
        claim.financialDetails.totalClaimedAmount,
        authorizedAmount,
        claim.insuranceDetails.policyCoverageLimit
      );

      if (!validation.isValid) {
        res.status(400).json({ success: false, message: validation.message });
        return;
      }

      const prevStatus = claim.status;
      claim.status = 'APPROVED';
      claim.financialDetails.approvedAmount = authorizedAmount;
      if (remarks) claim.financialDetails.remarks = remarks;
      claim.approvedAt = new Date();
      const updatedClaim = await claim.save();

      await AuditService.log({
        claimId: updatedClaim._id,
        action: 'CLAIM_APPROVED',
        entityType: 'FINANCIAL',
        performedBy: req.user.userId,
        performedByRole: req.user.role,
        previousValue: { status: prevStatus, approvedAmount: 0 },
        newValue: { status: 'APPROVED', approvedAmount: authorizedAmount, remarks },
        details: {
          message: `Pre-authorization approved for ₹${authorizedAmount.toLocaleString('en-IN')}`,
        },
      });

      res.status(200).json({
        success: true,
        message: 'Claim successfully approved',
        data: updatedClaim,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to approve claim',
        error: (error as Error).message,
      });
    }
  }

  /**
   * TPA Manager issues formal Sanction (APPROVED -> SANCTIONED).
   */
  public static async sanctionClaim(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const { sanctionedAmount, remarks } = req.body;

      const claim = await Claim.findById(id);
      if (!claim) {
        res.status(404).json({ success: false, message: 'Claim not found' });
        return;
      }

      const transitionCheck = StateMachineService.canTransition(claim.status, 'SANCTIONED', req.user.role);
      if (!transitionCheck.allowed) {
        res.status(400).json({ success: false, message: transitionCheck.reason });
        return;
      }

      const prevStatus = claim.status;
      claim.status = 'SANCTIONED';
      claim.financialDetails.sanctionedAmount = sanctionedAmount;
      if (remarks) claim.financialDetails.remarks = remarks;
      claim.sanctionedAt = new Date();
      const updatedClaim = await claim.save();

      await AuditService.log({
        claimId: updatedClaim._id,
        action: 'CLAIM_SANCTIONED',
        entityType: 'FINANCIAL',
        performedBy: req.user.userId,
        performedByRole: req.user.role,
        previousValue: { status: prevStatus },
        newValue: { status: 'SANCTIONED', sanctionedAmount },
        details: { message: `Formal cashless sanction issued for ₹${sanctionedAmount.toLocaleString('en-IN')}` },
      });

      res.status(200).json({
        success: true,
        message: 'Claim sanctioned successfully',
        data: updatedClaim,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to sanction claim',
        error: (error as Error).message,
      });
    }
  }

  /**
   * TPA Manager Settles Claim (SANCTIONED -> SETTLED).
   */
  public static async settleClaim(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const claim = await Claim.findById(id);
      if (!claim) {
        res.status(404).json({ success: false, message: 'Claim not found' });
        return;
      }

      const transitionCheck = StateMachineService.canTransition(claim.status, 'SETTLED', req.user.role);
      if (!transitionCheck.allowed) {
        res.status(400).json({ success: false, message: transitionCheck.reason });
        return;
      }

      const prevStatus = claim.status;
      claim.status = 'SETTLED';
      claim.settledAt = new Date();
      const updatedClaim = await claim.save();

      await AuditService.log({
        claimId: updatedClaim._id,
        action: 'CLAIM_SETTLED',
        entityType: 'FINANCIAL',
        performedBy: req.user.userId,
        performedByRole: req.user.role,
        previousValue: { status: prevStatus },
        newValue: { status: 'SETTLED', settledAt: updatedClaim.settledAt },
        details: { message: 'Final cashless payment settlement recorded and closed.' },
      });

      res.status(200).json({
        success: true,
        message: 'Claim settled successfully',
        data: updatedClaim,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to settle claim',
        error: (error as Error).message,
      });
    }
  }

  /**
   * TPA Manager Rejects Claim (TPA_REVIEW -> REJECTED).
   */
  public static async rejectClaim(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const { rejectionReason } = req.body;

      if (!rejectionReason || rejectionReason.trim().length < 5) {
        res.status(400).json({
          success: false,
          message: 'Mandatory rejection reason must be provided (at least 5 characters).',
        });
        return;
      }

      const claim = await Claim.findById(id);
      if (!claim) {
        res.status(404).json({ success: false, message: 'Claim not found' });
        return;
      }

      const transitionCheck = StateMachineService.canTransition(claim.status, 'REJECTED', req.user.role);
      if (!transitionCheck.allowed) {
        res.status(400).json({ success: false, message: transitionCheck.reason });
        return;
      }

      const prevStatus = claim.status;
      claim.status = 'REJECTED';
      claim.rejectionReason = rejectionReason;
      const updatedClaim = await claim.save();

      await AuditService.log({
        claimId: updatedClaim._id,
        action: 'CLAIM_REJECTED',
        entityType: 'CLAIM',
        performedBy: req.user.userId,
        performedByRole: req.user.role,
        previousValue: { status: prevStatus },
        newValue: { status: 'REJECTED', rejectionReason },
        details: { message: `Claim rejected by TPA. Justification: ${rejectionReason}` },
      });

      res.status(200).json({
        success: true,
        message: 'Claim rejected with recorded justification',
        data: updatedClaim,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to reject claim',
        error: (error as Error).message,
      });
    }
  }
}
