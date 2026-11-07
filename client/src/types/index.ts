export type UserRole = 'HOSPITAL_STAFF' | 'TPA_MANAGER';

export type ClaimStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'TPA_REVIEW'
  | 'QUERY_RAISED'
  | 'APPROVED'
  | 'SANCTIONED'
  | 'SETTLED'
  | 'REJECTED';

export type DocumentType =
  | 'ADMISSION_NOTE'
  | 'DISCHARGE_SUMMARY'
  | 'MEDICAL_BILL'
  | 'INVESTIGATION_REPORT'
  | 'SUPPORTING_QUERY_DOC';

export type QueryStatus = 'OPEN' | 'RESPONDED' | 'RESOLVED' | 'REOPENED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organization: string;
  isActive?: boolean;
}

export interface PatientDetails {
  name: string;
  age: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  patientId: string;
  contactNumber: string;
}

export interface InsuranceDetails {
  insuranceCompany: string;
  tpaProvider: string;
  policyNumber: string;
  policyCoverageLimit: number;
  policyExpiryDate: string;
}

export interface AdmissionDetails {
  admissionNumber: string;
  admissionDate: string;
  dischargeDate?: string;
  diagnosis: string;
  primaryICD10?: string;
  secondaryICD10?: string[];
  cptCodes?: string[];
  treatingDepartment: string;
  doctorName: string;
}

export interface FinancialDetails {
  estimatedCost: number;
  roomCharges: number;
  procedureCharges: number;
  medicineCharges: number;
  investigationCharges: number;
  otherCharges: number;
  totalClaimedAmount: number;
  approvedAmount?: number;
  sanctionedAmount?: number;
  currency: 'INR';
  remarks?: string;
}

export interface Claim {
  _id: string;
  claimId: string;
  patientDetails: PatientDetails;
  insuranceDetails: InsuranceDetails;
  admissionDetails: AdmissionDetails;
  financialDetails: FinancialDetails;
  tpaProvider: string;
  status: ClaimStatus;
  rejectionReason?: string;
  createdBy: User | string;
  assignedTo?: User | string;
  submittedAt?: string;
  approvedAt?: string;
  sanctionedAt?: string;
  settledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentItem {
  _id: string;
  claimId: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  storageKey: string;
  fileSize: number;
  uploadedBy: string | User;
  documentType: DocumentType;
  version: number;
  extractedText?: string;
  uploadedAt: string;
}

export interface FieldExtraction<T = any> {
  value: T | null;
  confidence: number;
  sourceEvidence?: string;
  isVerified?: boolean;
  verifiedValue?: T | null;
  verifiedBy?: string;
  verifiedAt?: string;
  verificationReason?: string;
}

export interface ExtractedICDCode {
  code: string;
  description: string;
  confidence: number;
  isPrimary?: boolean;
}

export interface ExtractedCPTCode {
  code: string;
  description: string;
  confidence: number;
}

export interface BillItem {
  description: string;
  amount: number;
  category: 'ROOM' | 'PROCEDURE' | 'MEDICINE' | 'INVESTIGATION' | 'OTHER';
}

export interface ExtractedFieldsPayload {
  patientName?: FieldExtraction<string>;
  policyNumber?: FieldExtraction<string>;
  admissionDate?: FieldExtraction<string>;
  dischargeDate?: FieldExtraction<string>;
  diagnosis?: FieldExtraction<string>;
  icdCodes?: ExtractedICDCode[];
  cptCodes?: ExtractedCPTCode[];
  billComponents?: BillItem[];
  claimedAmount?: FieldExtraction<number>;
  policyLimit?: FieldExtraction<number>;
  missingFields: string[];
  warnings: string[];
}

export interface AIExtraction {
  _id: string;
  claimId: string;
  documentId?: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface TPAQuery {
  _id: string;
  claimId: string | Claim;
  queryText: string;
  responseText?: string;
  deadline: string;
  status: QueryStatus;
  raisedBy: User;
  respondedBy?: User;
  resolvedBy?: User;
  supportingDocuments?: DocumentItem[];
  createdAt: string;
  updatedAt: string;
}

export interface AuditLogItem {
  _id: string;
  claimId: string | Claim;
  action: string;
  entityType: string;
  performedBy: User;
  performedByRole: UserRole;
  previousValue?: any;
  newValue?: any;
  details?: Record<string, any>;
  timestamp: string;
}

export interface FinancialValidation {
  isValid: boolean;
  calculatedTotal: number;
  totalClaimedAmount: number;
  differenceWithBreakdown: number;
  policyLimit: number;
  exceedingCoverageAmount: number;
  remainingCoverage: number;
  approvedAmount?: number;
  deductionAmount?: number;
  warnings: string[];
  errors: string[];
}
