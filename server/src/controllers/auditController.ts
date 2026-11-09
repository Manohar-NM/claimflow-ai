import { Response } from 'express';
import { AuditLog } from '../models/AuditLog.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { Types } from 'mongoose';

export class AuditController {
  public static async getLogsByClaim(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { claimId } = req.params;

      if (!claimId || !Types.ObjectId.isValid(claimId)) {
        res.status(400).json({ success: false, message: 'Valid claimId is required' });
        return;
      }

      const logs = await AuditLog.find({ claimId: new Types.ObjectId(claimId) })
        .populate('performedBy', 'name email role organization')
        .sort({ timestamp: -1 })
        .lean();

      res.status(200).json({ success: true, data: logs });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve audit logs',
        error: (error as Error).message,
      });
    }
  }

  public static async getRecentActivity(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { limit = '20' } = req.query;
      const limitNum = parseInt(limit as string, 10) || 20;

      const logs = await AuditLog.find()
        .populate('performedBy', 'name email role organization')
        .populate('claimId', 'claimId patientDetails.name tpaProvider status')
        .sort({ timestamp: -1 })
        .limit(limitNum)
        .lean();

      res.status(200).json({ success: true, data: logs });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve recent activity',
        error: (error as Error).message,
      });
    }
  }
}

