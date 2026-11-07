import mongoose, { Schema, Types } from 'mongoose';
import { ExtractedFieldsPayload } from '../types/index.js';

export interface IAIExtraction {
  _id?: Types.ObjectId;
  claimId: Types.ObjectId;
  documentId?: Types.ObjectId;
  model: string;
  extractedFields: ExtractedFieldsPayload;
  validationResults: {
    isValid: boolean;
    hasLowConfidenceFields: boolean;
    uncertainFields: string[];
    missingMandatoryFields: string[];
  };
  warnings: string[];
  requiresManualReview: boolean;
  processingStatus: 'PENDING' | 'COMPLETED' | 'FAILED';
  errorMessage?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const AIExtractionSchema = new Schema<IAIExtraction>(
  {
    claimId: {
      type: Schema.Types.ObjectId,
      ref: 'Claim',
      required: true,
      index: true,
    },
    documentId: {
      type: Schema.Types.ObjectId,
      ref: 'Document',
      index: true,
    },
    model: {
      type: String,
      required: true,
    },
    extractedFields: {
      type: Schema.Types.Mixed,
      required: true,
    },
    validationResults: {
      isValid: { type: Boolean, default: true },
      hasLowConfidenceFields: { type: Boolean, default: false },
      uncertainFields: [{ type: String }],
      missingMandatoryFields: [{ type: String }],
    },
    warnings: [{ type: String }],
    requiresManualReview: {
      type: Boolean,
      default: false,
      index: true,
    },
    processingStatus: {
      type: String,
      enum: ['PENDING', 'COMPLETED', 'FAILED'],
      default: 'PENDING',
      index: true,
    },
    errorMessage: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const AIExtraction = mongoose.model<IAIExtraction>(
  'AIExtraction',
  AIExtractionSchema
);
