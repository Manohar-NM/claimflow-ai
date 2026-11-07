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

export interface FieldExtraction<T = any> {
  value: T | null;
  confidence: number;
  sourceEvidence?: string;
  isVerified?: boolean;
  verifiedValue?: T | null;
  verifiedBy?: string;
  verifiedAt?: string | Date;
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
  age?: FieldExtraction<number>;
  gender?: FieldExtraction<string>;
  policyNumber?: FieldExtraction<string>;
  tpaProvider?: FieldExtraction<string>;
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
  policyExpiryDate: string | Date;
}

export interface AdmissionDetails {
  admissionNumber: string;
  admissionDate: string | Date;
  dischargeDate?: string | Date;
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

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  organization: string;
  name: string;
}
