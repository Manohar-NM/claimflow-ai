import { describe, expect, it } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app.js';
import { User } from '../src/models/User.js';
import { Claim } from '../src/models/Claim.js';
import { config } from '../src/config/index.js';
import { StateMachineService } from '../src/services/stateMachineService.js';

const app = createApp();

describe('Claims Lifecycle & Validation Tests', () => {
  it('should successfully create a valid draft claim by Hospital Staff', async () => {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('StaffPass123!', salt);

    const user = await User.create({
      name: 'Billing Staff',
      email: 'staff1@test.com',
      passwordHash,
      role: 'HOSPITAL_STAFF',
      organization: 'City Hospital',
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

    const payload = {
      patientDetails: {
        name: 'Rahul Bose',
        age: 38,
        gender: 'MALE',
        patientId: 'PT-99881',
        contactNumber: '9988776655',
      },
      insuranceDetails: {
        insuranceCompany: 'Star Health',
        tpaProvider: 'Star Health',
        policyNumber: 'STAR-99221',
        policyCoverageLimit: 400000,
        policyExpiryDate: '2026-12-31',
      },
      admissionDetails: {
        admissionNumber: 'ADM-8812',
        admissionDate: '2026-02-10',
        diagnosis: 'Acute Gastroenteritis',
        primaryICD10: 'A09',
        treatingDepartment: 'Internal Medicine',
        doctorName: 'Dr. Sen',
      },
      financialDetails: {
        estimatedCost: 35000,
        roomCharges: 8000,
        procedureCharges: 10000,
        medicineCharges: 12000,
        investigationCharges: 3000,
        otherCharges: 2000,
        totalClaimedAmount: 35000,
        currency: 'INR',
      },
      tpaProvider: 'Star Health',
    };

    const res = await request(app)
      .post('/api/claims')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.claimId).toBeDefined();
    expect(res.body.data.status).toBe('DRAFT');
  });

  it('should reject invalid / negative financial amounts with 400 Bad Request', async () => {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('StaffPass123!', salt);

    const user = await User.create({
      name: 'Billing Staff 2',
      email: 'staff2@test.com',
      passwordHash,
      role: 'HOSPITAL_STAFF',
      organization: 'City Hospital',
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

    const invalidPayload = {
      patientDetails: {
        name: 'Rahul Bose',
        age: 38,
        gender: 'MALE',
        patientId: 'PT-99881',
        contactNumber: '9988776655',
      },
      insuranceDetails: {
        insuranceCompany: 'Star Health',
        tpaProvider: 'Star Health',
        policyNumber: 'STAR-99221',
        policyCoverageLimit: 400000,
        policyExpiryDate: '2026-12-31',
      },
      admissionDetails: {
        admissionNumber: 'ADM-8812',
        admissionDate: '2026-02-10',
        diagnosis: 'Acute Gastroenteritis',
        treatingDepartment: 'Internal Medicine',
        doctorName: 'Dr. Sen',
      },
      financialDetails: {
        estimatedCost: -5000, // Invalid negative cost!
        roomCharges: 0,
        procedureCharges: 0,
        medicineCharges: 0,
        investigationCharges: 0,
        otherCharges: 0,
        totalClaimedAmount: -5000,
        currency: 'INR',
      },
      tpaProvider: 'Star Health',
    };

    const res = await request(app)
      .post('/api/claims')
      .set('Authorization', `Bearer ${token}`)
      .send(invalidPayload);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should enforce state machine transitions correctly', () => {
    // Valid: DRAFT -> SUBMITTED by HOSPITAL_STAFF
    const draftToSubmitted = StateMachineService.canTransition('DRAFT', 'SUBMITTED', 'HOSPITAL_STAFF');
    expect(draftToSubmitted.allowed).toBe(true);

    // Invalid: DRAFT -> APPROVED (illegal jump)
    const draftToApproved = StateMachineService.canTransition('DRAFT', 'APPROVED', 'TPA_MANAGER');
    expect(draftToApproved.allowed).toBe(false);

    // Invalid: SUBMITTED -> SETTLED (must go through review and sanction first)
    const submittedToSettled = StateMachineService.canTransition('SUBMITTED', 'SETTLED', 'TPA_MANAGER');
    expect(submittedToSettled.allowed).toBe(false);

    // Valid: TPA_REVIEW -> QUERY_RAISED by TPA_MANAGER
    const reviewToQuery = StateMachineService.canTransition('TPA_REVIEW', 'QUERY_RAISED', 'TPA_MANAGER');
    expect(reviewToQuery.allowed).toBe(true);
  });
});
