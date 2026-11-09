import { Response } from 'express';
import { Types } from 'mongoose';
import { TPAQuery } from '../models/TPAQuery.js';
import { Claim } from '../models/Claim.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { AuditService } from '../services/auditService.js';
import { StateMachineService } from '../services/stateMachineService.js';

export class QueryController {
  /**
   * TPA Manager creates a formal clarification query.
   */
  public static async createQuery(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { claimId, queryText, deadline } = req.body;

      if (!claimId || !queryText || !deadline) {
        res.status(400).json({ success: false, message: 'claimId, queryText, and deadline are required' });
        return;
      }

      const claim = await Claim.findById(claimId);
      if (!claim) {
        res.status(404).json({ success: false, message: 'Claim not found' });
        return;
      }

      // Transition claim to QUERY_RAISED
      const transitionCheck = StateMachineService.canTransition(claim.status, 'QUERY_RAISED', req.user.role);
      if (!transitionCheck.allowed) {
        res.status(400).json({ success: false, message: transitionCheck.reason });
        return;
      }

      const query = new TPAQuery({
        claimId: claim._id,
        queryText,
        deadline: new Date(deadline),
        status: 'OPEN',
        raisedBy: new Types.ObjectId(req.user.userId),
        supportingDocuments: [],
      });

      const savedQuery = await query.save();

      const prevStatus = claim.status;
      claim.status = 'QUERY_RAISED';
      await claim.save();

      await AuditService.log({
        claimId: claim._id,
        action: 'QUERY_RAISED',
        entityType: 'QUERY',
        performedBy: req.user.userId,
        performedByRole: req.user.role,
        previousValue: { claimStatus: prevStatus },
        newValue: {
          queryId: savedQuery._id,
          queryText,
          deadline: savedQuery.deadline,
          claimStatus: 'QUERY_RAISED',
        },
        details: { message: `TPA raised query with deadline: ${new Date(deadline).toLocaleString()}` },
      });

      res.status(201).json({
        success: true,
        message: 'Query raised successfully',
        data: savedQuery,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to raise query',
        error: (error as Error).message,
      });
    }
  }

  /**
   * Hospital Staff responds to an open TPA query.
   */
  public static async respondToQuery(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const { responseText, supportingDocuments = [] } = req.body;

      if (!responseText || responseText.trim().length < 5) {
        res.status(400).json({ success: false, message: 'Response text must be at least 5 characters' });
        return;
      }

      const query = await TPAQuery.findById(id);
      if (!query) {
        res.status(404).json({ success: false, message: 'Query record not found' });
        return;
      }

      if (query.status !== 'OPEN' && query.status !== 'REOPENED') {
        res.status(400).json({
          success: false,
          message: `Cannot respond to a query in '${query.status}' state.`,
        });
        return;
      }

      const claim = await Claim.findById(query.claimId);
      if (!claim) {
        res.status(404).json({ success: false, message: 'Associated claim record not found' });
        return;
      }

      query.responseText = responseText;
      query.status = 'RESPONDED';
      query.respondedBy = new Types.ObjectId(req.user.userId);
      if (supportingDocuments.length > 0) {
        query.supportingDocuments = supportingDocuments.map((docId: string) => new Types.ObjectId(docId));
      }
      const savedQuery = await query.save();

      // Transition claim back to TPA_REVIEW
      claim.status = 'TPA_REVIEW';
      await claim.save();

      await AuditService.log({
        claimId: claim._id,
        action: 'HOSPITAL_RESPONDED',
        entityType: 'QUERY',
        performedBy: req.user.userId,
        performedByRole: req.user.role,
        previousValue: { queryStatus: 'OPEN' },
        newValue: { queryStatus: 'RESPONDED', responseText, claimStatus: 'TPA_REVIEW' },
        details: { message: 'Hospital staff submitted clinical clarification to TPA query.' },
      });

      res.status(200).json({
        success: true,
        message: 'Query response submitted successfully',
        data: savedQuery,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to respond to query',
        error: (error as Error).message,
      });
    }
  }

  /**
   * TPA Manager resolves query.
   */
  public static async resolveQuery(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const query = await TPAQuery.findById(id);

      if (!query) {
        res.status(404).json({ success: false, message: 'Query not found' });
        return;
      }

      query.status = 'RESOLVED';
      query.resolvedBy = new Types.ObjectId(req.user.userId);
      const savedQuery = await query.save();

      await AuditService.log({
        claimId: query.claimId,
        action: 'QUERY_RESOLVED',
        entityType: 'QUERY',
        performedBy: req.user.userId,
        performedByRole: req.user.role,
        newValue: { queryId: query._id, status: 'RESOLVED' },
        details: { message: 'TPA underwriter marked the query as resolved.' },
      });

      res.status(200).json({
        success: true,
        message: 'Query resolved successfully',
        data: savedQuery,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to resolve query',
        error: (error as Error).message,
      });
    }
  }

  /**
   * TPA Manager reopens query if hospital response is insufficient.
   */
  public static async reopenQuery(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const { newDeadline } = req.body;

      const query = await TPAQuery.findById(id);
      if (!query) {
        res.status(404).json({ success: false, message: 'Query not found' });
        return;
      }

      const claim = await Claim.findById(query.claimId);
      if (!claim) {
        res.status(404).json({ success: false, message: 'Claim not found' });
        return;
      }

      query.status = 'REOPENED';
      if (newDeadline) {
        query.deadline = new Date(newDeadline);
      }
      const savedQuery = await query.save();

      claim.status = 'QUERY_RAISED';
      await claim.save();

      await AuditService.log({
        claimId: claim._id,
        action: 'QUERY_REOPENED',
        entityType: 'QUERY',
        performedBy: req.user.userId,
        performedByRole: req.user.role,
        newValue: { queryId: query._id, status: 'REOPENED', claimStatus: 'QUERY_RAISED' },
        details: { message: 'TPA underwriter reopened the clarification query.' },
      });

      res.status(200).json({
        success: true,
        message: 'Query reopened successfully',
        data: savedQuery,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to reopen query',
        error: (error as Error).message,
      });
    }
  }
}

