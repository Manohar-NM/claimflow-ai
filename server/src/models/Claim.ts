import mongoose, { Document as MongooseDoc, Schema, Types } from 'mongoose';
import {
  AdmissionDetails,
  ClaimStatus,
  FinancialDetails,
  InsuranceDetails,
  PatientDetails,
} from '../types/index.js';

export interface IClaim extends MongooseDoc {
  claimId: string;
  patientDetails: PatientDetails;
  insuranceDetails: InsuranceDetails;
  admissionDetails: AdmissionDetails;
  financialDetails: FinancialDetails;
  tpaProvider: string;
  status: ClaimStatus;
  rejectionReason?: string;
  createdBy: Types.ObjectId;
  assignedTo?: Types.ObjectId;
  submittedAt?: Date;
  approvedAt?: Date;
  sanctionedAt?: Date;
  settledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PatientDetailsSchema = new Schema<PatientDetails>(
  {
    name: { type: String, required: true, trim: true },
    age: { type: Number, required: true, min: 0, max: 130 },
    gender: { type: String, enum: ['MALE', 'FEMALE', 'OTHER'], required: true },
    patientId: { type: String, required: true, trim: true },
    contactNumber: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const InsuranceDetailsSchema = new Schema<InsuranceDetails>(
  {
    insuranceCompany: { type: String, required: true, trim: true },
    tpaProvider: { type: String, required: true, trim: true },
    policyNumber: { type: String, required: true, trim: true },
    policyCoverageLimit: { type: Number, required: true, min: 0 },
    policyExpiryDate: { type: Date, required: true },
  },
  { _id: false }
);

const AdmissionDetailsSchema = new Schema<AdmissionDetails>(
  {
    admissionNumber: { type: String, required: true, trim: true },
    admissionDate: { type: Date, required: true },
    dischargeDate: { type: Date },
    diagnosis: { type: String, required: true, trim: true },
    primaryICD10: { type: String, trim: true },
    secondaryICD10: [{ type: String, trim: true }],
    cptCodes: [{ type: String, trim: true }],
    treatingDepartment: { type: String, required: true, trim: true },
    doctorName: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const FinancialDetailsSchema = new Schema<FinancialDetails>(
  {
    estimatedCost: { type: Number, required: true, min: 0 },
    roomCharges: { type: Number, required: true, min: 0 },
    procedureCharges: { type: Number, required: true, min: 0 },
    medicineCharges: { type: Number, required: true, min: 0 },
    investigationCharges: { type: Number, required: true, min: 0 },
    otherCharges: { type: Number, required: true, min: 0 },
    totalClaimedAmount: { type: Number, required: true, min: 0 },
    approvedAmount: { type: Number, min: 0 },
    sanctionedAmount: { type: Number, min: 0 },
    currency: { type: String, enum: ['INR'], default: 'INR' },
    remarks: { type: String, trim: true },
  },
  { _id: false }
);

const ClaimSchema = new Schema<IClaim>(
  {
    claimId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    patientDetails: { type: PatientDetailsSchema, required: true },
    insuranceDetails: { type: InsuranceDetailsSchema, required: true },
    admissionDetails: { type: AdmissionDetailsSchema, required: true },
    financialDetails: { type: FinancialDetailsSchema, required: true },
    tpaProvider: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    status: {
      type: String,
      enum: [
        'DRAFT',
        'SUBMITTED',
        'TPA_REVIEW',
        'QUERY_RAISED',
        'APPROVED',
        'SANCTIONED',
        'SETTLED',
        'REJECTED',
      ],
      default: 'DRAFT',
      index: true,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    submittedAt: { type: Date },
    approvedAt: { type: Date },
    sanctionedAt: { type: Date },
    settledAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for performant workspace queries
ClaimSchema.index({ status: 1, tpaProvider: 1, createdAt: -1 });
ClaimSchema.index({ 'patientDetails.name': 'text', claimId: 'text', 'insuranceDetails.policyNumber': 'text' });

export const Claim = mongoose.model<IClaim>('Claim', ClaimSchema);
