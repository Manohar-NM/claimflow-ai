import { describe, expect, it } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app.js';
import { User } from '../src/models/User.js';
import { Claim } from '../src/models/Claim.js';
import { config } from '../src/config/index.js';

const app = createApp();

describe('Role-Based Access Control (RBAC) Tests', () => {
  it('should reject unauthenticated requests to protected endpoints with 401', async () => {
    const res = await request(app).get('/api/claims');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should prevent Hospital Staff from approving claims (403 Forbidden)', async () => {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('StaffPass123!', salt);

    const hospitalUser = await User.create({
      name: 'Billing Staff',
      email: 'billing@test.com',
      passwordHash,
      role: 'HOSPITAL_STAFF',
      organization: 'City Care Hospital',
      isActive: true,
    });

    const token = jwt.sign(
      {
        userId: hospitalUser._id.toString(),
        email: hospitalUser.email,
        role: hospitalUser.role,
        organization: hospitalUser.organization,
        name: hospitalUser.name,
      },
      config.jwtSecret,
      { expiresIn: '1h' }
    );

    const claim = await Claim.create({
      claimId: 'CF-TEST-1001',
      patientDetails: {
        name: 'Patient A',
        age: 45,
        gender: 'MALE',
        patientId: 'PT-01',
        contactNumber: '9876543210',
      },
      insuranceDetails: {
        insuranceCompany: 'Star Health',
        tpaProvider: 'Star Health',
        policyNumber: 'STAR-1234',
        policyCoverageLimit: 500000,
        policyExpiryDate: new Date('2026-12-31'),
      },
      admissionDetails: {
        admissionNumber: 'ADM-01',
        admissionDate: new Date(),
        diagnosis: 'Cholecystitis',
        primaryICD10: 'K80.00',
        treatingDepartment: 'Surgery',
        doctorName: 'Dr. Sen',
      },
      financialDetails: {
        estimatedCost: 80000,
        roomCharges: 10000,
        procedureCharges: 50000,
        medicineCharges: 12000,
        investigationCharges: 5000,
        otherCharges: 3000,
        totalClaimedAmount: 80000,
        currency: 'INR',
      },
      tpaProvider: 'Star Health',
      status: 'TPA_REVIEW',
      createdBy: hospitalUser._id,
    });

    // Attempt to approve as HOSPITAL_STAFF
    const res = await request(app)
      .post(`/api/claims/${claim._id}/approve`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        authorizedAmount: 75000,
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Forbidden');
  });

  it('should prevent TPA Manager from uploading original hospital medical documents (403 Forbidden)', async () => {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('TpaPass123!', salt);

    const tpaUser = await User.create({
      name: 'TPA Reviewer',
      email: 'tpareviewer@test.com',
      passwordHash,
      role: 'TPA_MANAGER',
      organization: 'HealthGuard TPA',
      isActive: true,
    });

    const token = jwt.sign(
      {
        userId: tpaUser._id.toString(),
        email: tpaUser.email,
        role: tpaUser.role,
        organization: tpaUser.organization,
        name: tpaUser.name,
      },
      config.jwtSecret,
      { expiresIn: '1h' }
    );

    const res = await request(app)
      .post('/api/documents/upload')
      .set('Authorization', `Bearer ${token}`)
      .send({
        claimId: 'anyId',
        documentType: 'MEDICAL_BILL',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Forbidden');
  });
});
