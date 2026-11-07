import mongoose, { Document as MongooseDoc, Schema, Types } from 'mongoose';
import { UserRole } from '../types/index.js';

export interface IAuditLog extends MongooseDoc {
  claimId: Types.ObjectId;
  action: string;
  entityType: string;
  performedBy: Types.ObjectId;
  performedByRole: UserRole;
  previousValue?: any;
  newValue?: any;
  details?: Record<string, any>;
  timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    claimId: {
      type: Schema.Types.ObjectId,
      ref: 'Claim',
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    entityType: {
      type: String,
      required: true,
    },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    performedByRole: {
      type: String,
      enum: ['HOSPITAL_STAFF', 'TPA_MANAGER'],
      required: true,
    },
    previousValue: {
      type: Schema.Types.Mixed,
    },
    newValue: {
      type: Schema.Types.Mixed,
    },
    details: {
      type: Schema.Types.Mixed,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

AuditLogSchema.index({ claimId: 1, timestamp: -1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
