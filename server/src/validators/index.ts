import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export const patientDetailsSchema = z.object({
  name: z.string().min(2, 'Patient name must be at least 2 characters'),
  age: z.number().int().min(0).max(130, 'Age must be between 0 and 130'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  patientId: z.string().min(1, 'Patient ID is required'),
  contactNumber: z.string().min(10, 'Contact number must be at least 10 digits'),
});

export const insuranceDetailsSchema = z.object({
  insuranceCompany: z.string().min(2, 'Insurance company is required'),
  tpaProvider: z.string().min(2, 'TPA provider is required'),
  policyNumber: z.string().min(3, 'Policy number is required'),
  policyCoverageLimit: z.number().positive('Policy coverage limit must be greater than 0'),
  policyExpiryDate: z.string().or(z.date()),
});

export const admissionDetailsSchema = z.object({
  admissionNumber: z.string().min(1, 'Admission number is required'),
  admissionDate: z.string().or(z.date()),
  dischargeDate: z.string().or(z.date()).optional(),
  diagnosis: z.string().min(3, 'Diagnosis description is required'),
  primaryICD10: z.string().optional(),
  secondaryICD10: z.array(z.string()).optional(),
  cptCodes: z.array(z.string()).optional(),
  treatingDepartment: z.string().min(2, 'Treating department is required'),
  doctorName: z.string().min(2, 'Doctor name is required'),
});

export const financialDetailsSchema = z.object({
  estimatedCost: z.number().min(0, 'Estimated cost cannot be negative'),
  roomCharges: z.number().min(0, 'Room charges cannot be negative'),
  procedureCharges: z.number().min(0, 'Procedure charges cannot be negative'),
  medicineCharges: z.number().min(0, 'Medicine charges cannot be negative'),
  investigationCharges: z.number().min(0, 'Investigation charges cannot be negative'),
  otherCharges: z.number().min(0, 'Other charges cannot be negative'),
  totalClaimedAmount: z.number().min(0, 'Total claimed amount cannot be negative'),
  approvedAmount: z.number().min(0).optional(),
  sanctionedAmount: z.number().min(0).optional(),
  currency: z.literal('INR').default('INR'),
  remarks: z.string().optional(),
});

export const createClaimSchema = z.object({
  patientDetails: patientDetailsSchema,
  insuranceDetails: insuranceDetailsSchema,
  admissionDetails: admissionDetailsSchema,
  financialDetails: financialDetailsSchema,
  tpaProvider: z.string().min(2, 'TPA provider is required'),
});

export const updateClaimSchema = createClaimSchema.partial();

export const createQuerySchema = z.object({
  claimId: z.string().min(1, 'Claim ID is required'),
  queryText: z.string().min(5, 'Query text must be at least 5 characters'),
  deadline: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid deadline date format',
  }),
});

export const respondQuerySchema = z.object({
  responseText: z.string().min(5, 'Response text must be at least 5 characters'),
  supportingDocuments: z.array(z.string()).optional(),
});

export const approveClaimSchema = z.object({
  authorizedAmount: z.number().positive('Authorized amount must be positive'),
  remarks: z.string().optional(),
});

export const sanctionClaimSchema = z.object({
  sanctionedAmount: z.number().positive('Sanctioned amount must be positive'),
  remarks: z.string().optional(),
});

export const rejectClaimSchema = z.object({
  rejectionReason: z.string().min(5, 'Mandatory rejection reason must be at least 5 characters'),
});

export const manualAIOverrideSchema = z.object({
  extractionId: z.string().min(1, 'Extraction ID is required'),
  fieldName: z.string().min(1, 'Field name is required'),
  correctedValue: z.any(),
  correctionReason: z.string().min(3, 'Correction reason is required for compliance audit'),
});
