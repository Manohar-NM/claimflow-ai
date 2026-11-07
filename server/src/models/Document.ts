import mongoose, { Document as MongooseDoc, Schema, Types } from 'mongoose';
import { DocumentType } from '../types/index.js';

export interface IDocument extends MongooseDoc {
  claimId: Types.ObjectId;
  fileName: string;
  originalName: string;
  mimeType: string;
  storageKey: string;
  fileSize: number;
  uploadedBy: Types.ObjectId;
  documentType: DocumentType;
  version: number;
  extractedText?: string;
  uploadedAt: Date;
}

const DocumentSchema = new Schema<IDocument>(
  {
    claimId: {
      type: Schema.Types.ObjectId,
      ref: 'Claim',
      required: true,
      index: true,
    },
    fileName: {
      type: String,
      required: true,
      trim: true,
    },
    originalName: {
      type: String,
      required: true,
      trim: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    storageKey: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    documentType: {
      type: String,
      enum: [
        'ADMISSION_NOTE',
        'DISCHARGE_SUMMARY',
        'MEDICAL_BILL',
        'INVESTIGATION_REPORT',
        'SUPPORTING_QUERY_DOC',
      ],
      required: true,
    },
    version: {
      type: Number,
      default: 1,
    },
    extractedText: {
      type: String,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export const Document = mongoose.model<IDocument>('Document', DocumentSchema);
