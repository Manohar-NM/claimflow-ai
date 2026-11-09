import mongoose, { Document as MongooseDoc, Schema, Types } from 'mongoose';
import { QueryStatus } from '../types/index.js';

export interface ITPAQuery extends MongooseDoc {
  claimId: Types.ObjectId;
  queryText: string;
  responseText?: string;
  deadline: Date;
  status: QueryStatus;
  raisedBy: Types.ObjectId;
  respondedBy?: Types.ObjectId;
  resolvedBy?: Types.ObjectId;
  supportingDocuments: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const TPAQuerySchema = new Schema<ITPAQuery>(
  {
    claimId: {
      type: Schema.Types.ObjectId,
      ref: 'Claim',
      required: true,
      index: true,
    },
    queryText: {
      type: String,
      required: true,
      trim: true,
    },
    responseText: {
      type: String,
      trim: true,
    },
    deadline: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['OPEN', 'RESPONDED', 'RESOLVED', 'REOPENED'],
      default: 'OPEN',
      index: true,
    },
    raisedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    respondedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    supportingDocuments: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Document',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Query index for claim query lookups and deadline tracking
TPAQuerySchema.index({ claimId: 1, status: 1 });
TPAQuerySchema.index({ status: 1, deadline: 1 });

export const TPAQuery = mongoose.model<ITPAQuery>('TPAQuery', TPAQuerySchema);

