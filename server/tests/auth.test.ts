import { describe, expect, it } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { createApp } from '../src/app.js';
import { User } from '../src/models/User.js';

const app = createApp();

describe('Authentication Module Tests', () => {
  it('should authenticate valid user credentials and return a signed JWT token', async () => {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('ValidPassword123!', salt);

    await User.create({
      name: 'Dr. Test User',
      email: 'doctor@test.com',
      passwordHash,
      role: 'HOSPITAL_STAFF',
      organization: 'Test Hospital',
      isActive: true,
    });

    const res = await request(app).post('/api/auth/login').send({
      email: 'doctor@test.com',
      password: 'ValidPassword123!',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe('doctor@test.com');
    expect(res.body.data.user.role).toBe('HOSPITAL_STAFF');
  });

  it('should reject invalid password with 401 Unauthorized', async () => {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('CorrectPassword123!', salt);

    await User.create({
      name: 'Staff Member',
      email: 'staff@test.com',
      passwordHash,
      role: 'HOSPITAL_STAFF',
      organization: 'Test Hospital',
      isActive: true,
    });

    const res = await request(app).post('/api/auth/login').send({
      email: 'staff@test.com',
      password: 'WrongPassword456!',
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Invalid email or password');
  });

  it('should securely hash passwords and not store raw text in the database', async () => {
    const rawPassword = 'SuperSecretPassword!';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(rawPassword, salt);

    const user = await User.create({
      name: 'Security User',
      email: 'security@test.com',
      passwordHash,
      role: 'TPA_MANAGER',
      organization: 'Security TPA',
      isActive: true,
    });

    expect(user.passwordHash).not.toBe(rawPassword);
    expect(user.passwordHash.startsWith('$2')).toBe(true); // standard bcrypt prefix
    const isMatch = await bcrypt.compare(rawPassword, user.passwordHash);
    expect(isMatch).toBe(true);
  });

  it('should prohibit login for deactivated / inactive accounts', async () => {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('InactiveUserPassword!', salt);

    await User.create({
      name: 'Inactive User',
      email: 'inactive@test.com',
      passwordHash,
      role: 'HOSPITAL_STAFF',
      organization: 'Test Hospital',
      isActive: false, // Inactive
    });

    const res = await request(app).post('/api/auth/login').send({
      email: 'inactive@test.com',
      password: 'InactiveUserPassword!',
    });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('deactivated');
  });
});
