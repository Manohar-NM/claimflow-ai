import { describe, expect, it } from 'vitest';
import { User } from '../src/models/User.js';
import { Claim } from '../src/models/Claim.js';
import { Document } from '../src/models/Document.js';
import { AIExtraction } from '../src/models/AIExtraction.js';
import { TPAQuery } from '../src/models/TPAQuery.js';
import { AuditLog } from '../src/models/AuditLog.js';
import { runSeed } from '../src/seed/seed.js';

describe('Database Seed Verification Test', () => {
  it('should seed 2 demo users and at least 10 realistic claims across multiple TPAs with documents, AI, and audit records', async () => {
    await runSeed();

    const users = await User.find();
    expect(users.length).toBe(2);
    const hospitalUser = users.find((u) => u.role === 'HOSPITAL_STAFF');
    const tpaUser = users.find((u) => u.role === 'TPA_MANAGER');
    expect(hospitalUser?.email).toBe('hospital@claimflow.demo');
    expect(tpaUser?.email).toBe('tpa@claimflow.demo');

    const claims = await Claim.find();
    expect(claims.length).toBeGreaterThanOrEqual(10);

    const statuses = new Set(claims.map((c) => c.status));
    expect(statuses.has('DRAFT')).toBe(true);
    expect(statuses.has('SUBMITTED')).toBe(true);
    expect(statuses.has('TPA_REVIEW')).toBe(true);
    expect(statuses.has('QUERY_RAISED')).toBe(true);
    expect(statuses.has('APPROVED')).toBe(true);
    expect(statuses.has('SANCTIONED')).toBe(true);
    expect(statuses.has('SETTLED')).toBe(true);
    expect(statuses.has('REJECTED')).toBe(true);

    const providers = new Set(claims.map((c) => c.tpaProvider));
    expect(providers.has('Star Health')).toBe(true);
    expect(providers.has('Medi Assist')).toBe(true);
    expect(providers.has('Niva Bupa')).toBe(true);
    expect(providers.has('HDFC ERGO')).toBe(true);
    expect(providers.has('ICICI Lombard')).toBe(true);

    const docs = await Document.find();
    expect(docs.length).toBeGreaterThan(0);

    const extractions = await AIExtraction.find();
    expect(extractions.length).toBeGreaterThan(0);

    const queries = await TPAQuery.find();
    expect(queries.length).toBeGreaterThan(0);

    const auditLogs = await AuditLog.find();
    expect(auditLogs.length).toBeGreaterThan(0);
  });
});

