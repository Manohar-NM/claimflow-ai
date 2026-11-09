import { describe, expect, it } from 'vitest';
import { AIService } from '../src/services/aiService.js';
import { AIExtraction } from '../src/models/AIExtraction.js';
import { Claim } from '../src/models/Claim.js';
import { User } from '../src/models/User.js';
import { AuditLog } from '../src/models/AuditLog.js';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app.js';
import { config } from '../src/config/index.js';

const app = createApp();

describe('AI Extraction & Uncertainty Handling Tests', () => {
  it('should deterministically calculate high confidence when value is grounded in document text and matches format', () => {
    const rawDocText = 'Patient Ramesh Kumar with Policy POL-STAR-9900 was admitted for Acute Appendicitis K35.8';
    
    // Exact grounded policy number
    const policyConfidence = AIService.calculateConfidence(
      'policyNumber',
      'POL-STAR-9900',
      'Policy section',
      rawDocText
    );
    expect(policyConfidence).toBeGreaterThanOrEqual(0.80);

    // Exact grounded ICD-10 code
    const icdConfidence = AIService.calculateConfidence(
      'primaryICD10',
      'K35.8',
      'Diagnosis text',
      rawDocText
    );
    expect(icdConfidence).toBeGreaterThanOrEqual(0.80);
  });

  it('should detect low-confidence fields (<0.80) when value is absent or poorly grounded', () => {
    const rawDocText = 'General discharge sheet without clear diagnosis or valid codes.';
    
    const ungroundedConfidence = AIService.calculateConfidence(
      'primaryICD10',
      'Z99.999', // Not in document text
      'Uncertain note',
      rawDocText
    );
    expect(ungroundedConfidence).toBeLessThan(0.80);
  });

  it('should flag mandatory human review when confidence is below 0.80 or mandatory codes are missing', () => {
    const samplePayload = {
      patientName: { value: 'Suresh Raina', confidence: 0.95 },
      policyNumber: { value: 'POL-1122', confidence: 0.90 },
      diagnosis: { value: 'Abdominal pain', confidence: 0.65 }, // Below 0.80!
      icdCodes: [], // Missing mandatory ICD-10 code!
      claimedAmount: { value: 45000, confidence: 0.88 },
      missingFields: [],
      warnings: [],
    };

    const evaluation = AIService.evaluateUncertainty(
      samplePayload,
      'Suresh Raina with Policy POL-1122 claimed amount 45000'
    );

    expect(evaluation.requiresManualReview).toBe(true);
    expect(evaluation.uncertainFields).toContain('diagnosis');
    expect(evaluation.uncertainFields).toContain('icdCodes');
    expect(evaluation.missingMandatoryFields).toContain('icdCodes');
  });

  it('should gracefully handle unconfigured AI provider without fabricating fake responses', async () => {
    // When no API key is provided, returns UNAVAILABLE status
    const result = await AIService.analyzeDocument('Sample clinical report', 'ADMISSION_NOTE');
    
    if (!config.geminiApiKey && !config.openaiApiKey) {
      expect(result.status).toBe('UNAVAILABLE');
      expect(result.requiresManualReview).toBe(true);
      expect(result.errorMessage).toContain('API key missing');
    }
  });

  it('should record manual corrections to audit log and update verified status without deleting original AI record', async () => {
    const user = await User.create({
      name: 'Dr. Reviewer',
      email: 'reviewer@test.com',
      passwordHash: 'hashed123',
      role: 'HOSPITAL_STAFF',
      organization: 'City Care Hospital',
      isActive: true,
    });

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        organization: user.organization,
        name: user.name,
      },
      config.jwtSecret,
      { expiresIn: '1h' }
    );

    const claim = await Claim.create({
      claimId: 'CF-AI-TEST-1',
      patientDetails: {
        name: 'Unverified Name',
        age: 40,
        gender: 'MALE',
        patientId: 'PT-AI-1',
        contactNumber: '9988776655',
      },
      insuranceDetails: {
        insuranceCompany: 'Star Health',
        tpaProvider: 'Star Health',
        policyNumber: 'STAR-01',
        policyCoverageLimit: 500000,
        policyExpiryDate: new Date(),
      },
      admissionDetails: {
        admissionNumber: 'ADM-AI-1',
        admissionDate: new Date(),
        diagnosis: 'Suspected Angina',
        treatingDepartment: 'Cardiology',
        doctorName: 'Dr. Sen',
      },
      financialDetails: {
        estimatedCost: 50000,
        roomCharges: 10000,
        procedureCharges: 25000,
        medicineCharges: 10000,
        investigationCharges: 3000,
        otherCharges: 2000,
        totalClaimedAmount: 50000,
        currency: 'INR',
      },
      tpaProvider: 'Star Health',
      status: 'DRAFT',
      createdBy: user._id,
    });

    const extraction = await AIExtraction.create({
      claimId: claim._id,
      model: 'gemini-2.5-flash',
      extractedFields: {
        patientName: {
          value: 'Unverified Name',
          confidence: 0.65, // Uncertain!
          sourceEvidence: 'Header text',
          isVerified: false,
        },
        missingFields: [],
        warnings: ['Low confidence patient name'],
      },
      validationResults: {
        isValid: true,
        hasLowConfidenceFields: true,
        uncertainFields: ['patientName'],
        missingMandatoryFields: [],
      },
      warnings: ['Low confidence patient name'],
      requiresManualReview: true,
      processingStatus: 'COMPLETED',
    });

    // Execute manual override
    const res = await request(app)
      .post('/api/ai/override')
      .set('Authorization', `Bearer ${token}`)
      .send({
        extractionId: extraction._id.toString(),
        fieldName: 'patientName',
        correctedValue: 'Verified Ramesh Kumar',
        correctionReason: 'Verified against government Aadhaar ID card',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify extraction state
    const updatedExtraction = await AIExtraction.findById(extraction._id);
    const fields = updatedExtraction?.extractedFields as any;
    expect(fields.patientName.isVerified).toBe(true);
    expect(fields.patientName.value).toBe('Verified Ramesh Kumar');
    expect(fields.patientName.verificationReason).toContain('Aadhaar ID');

    // Verify claim record was updated
    const updatedClaim = await Claim.findById(claim._id);
    expect(updatedClaim?.patientDetails.name).toBe('Verified Ramesh Kumar');

    // Verify Audit Log entry exists
    const auditLogs = await AuditLog.find({ claimId: claim._id, action: 'AI_FIELD_CORRECTED' });
    expect(auditLogs.length).toBe(1);
    expect(auditLogs[0].newValue.correctedValue).toBe('Verified Ramesh Kumar');
  });
});

