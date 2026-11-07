import { Types } from 'mongoose';
import { AuditLog, IAuditLog } from '../models/AuditLog.js';
import { UserRole } from '../types/index.js';

export interface CreateAuditLogParams {
  claimId: Types.ObjectId | string;
  action: string;
  entityType: string;
  performedBy: Types.ObjectId | string;
  performedByRole: UserRole;
  previousValue?: any;
  newValue?: any;
  details?: Record<string, any>;
}

export class AuditService {
  public static async log(params: CreateAuditLogParams): Promise<IAuditLog> {
    const log = new AuditLog({
      claimId: new Types.ObjectId(params.claimId),
      action: params.action,
      entityType: params.entityType,
      performedBy: new Types.ObjectId(params.performedBy),
      performedByRole: params.performedByRole,
      previousValue: params.previousValue,
      newValue: params.newValue,
      details: params.details || {},
      timestamp: new Date(),
    });

    return await log.save();
  }

  public static async getLogsByClaim(claimId: string): Promise<any[]> {
    return await AuditLog.find({ claimId: new Types.ObjectId(claimId) })
      .populate('performedBy', 'name email role organization')
      .sort({ timestamp: -1 })
      .lean();
  }
}
