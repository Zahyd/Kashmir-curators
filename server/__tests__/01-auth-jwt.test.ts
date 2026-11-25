import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { startTestServer, resetTestState, inMemoryPrisma, TestServerHandle } from './helpers/testHarness';
import { authorizeRoles } from '../src/middleware/roleMiddleware';

describe('Authentication, JWT Validation, Portal Keys & RBAC', () => {
  let srv: TestServerHandle;

  before(async () => {
    srv = await startTestServer();
  });

  after(async () => {
    await srv.close();
  });

  beforeEach(() => {
    resetTestState();
  });

  it('registers a user with bcrypt password hashing, issues a valid JWT, and rejects duplicate email', async () => {
    const regRes = await srv.request('POST', '/api/auth/register', {
      body: {
        email: 'aamir@kashmircurators.com',
        password: 'StrongPassword#2026',
        name: 'Aamir Khan',
      },
    });

    assert.equal(regRes.status, 201);
    assert.equal(regRes.body.user.email, 'aamir@kashmircurators.com');
    assert.equal(regRes.body.user.role, 'user');
    assert.ok(regRes.body.token, 'JWT token should be issued on registration');

    // Verify password is stored as bcrypt hash, not plaintext
    const storedUser = await inMemoryPrisma.user.findUnique({ where: { email: 'aamir@kashmircurators.com' } });
    assert.ok(storedUser.password.startsWith('$2'));
    assert.notEqual(storedUser.password, 'StrongPassword#2026');
    assert.equal(await bcrypt.compare('StrongPassword#2026', storedUser.password), true);

    // Duplicate registration rejected
    const dupRes = await srv.request('POST', '/api/auth/register', {
      body: {
        email: 'aamir@kashmircurators.com',
        password: 'AnotherPassword#2026',
        name: 'Duplicate',
      },
    });
    assert.equal(dupRes.status, 400);
    assert.match(dupRes.body.error, /already exists/i);
  });

  it('authenticates user login and validates JWT on /api/auth/me', async () => {
    await srv.request('POST', '/api/auth/register', {
      body: { email: 'sana@kashmir.com', password: 'MySecretPassword!1', name: 'Sana Mir' },
    });

    const badPass = await srv.request('POST', '/api/auth/login', {
      body: { email: 'sana@kashmir.com', password: 'WrongPassword' },
    });
    assert.equal(badPass.status, 400);

    const loginRes = await srv.request('POST', '/api/auth/login', {
      body: { email: 'sana@kashmir.com', password: 'MySecretPassword!1' },
    });
    assert.equal(loginRes.status, 200);
    assert.ok(loginRes.body.token);

    const meRes = await srv.request('GET', '/api/auth/me', { token: loginRes.body.token });
    assert.equal(meRes.status, 200);
    assert.equal(meRes.body.email, 'sana@kashmir.com');
    assert.equal(meRes.body.name, 'Sana Mir');
  });

  it('rejects missing, null-literal, tampered, and expired JWT tokens with 401', async () => {
    const noToken = await srv.request('GET', '/api/auth/me');
    assert.equal(noToken.status, 401);

    const literalNull = await srv.request('GET', '/api/auth/me', {
      headers: { Authorization: 'Bearer null' },
    });
    assert.equal(literalNull.status, 401);

    const tamperedToken = jwt.sign(
      { id: 'u-1', email: 'attacker@evil.com', role: 'admin' },
      'wrong_signing_secret_xyz'
    );
    const badSig = await srv.request('GET', '/api/auth/me', { token: tamperedToken });
    assert.equal(badSig.status, 401);

    const expiredToken = jwt.sign(
      { id: 'u-1', email: 'old@kashmir.com', role: 'user' },
      process.env.JWT_SECRET!,
      { expiresIn: -10 }
    );
    const expiredRes = await srv.request('GET', '/api/auth/me', { token: expiredToken });
    assert.equal(expiredRes.status, 401);
  });

  it('supports team login role mapping and team OTP verification lifecycle', async () => {
    // Seed employee user
    await inMemoryPrisma.user.create({
      data: {
        id: 'emp-ops-1',
        email: 'ops01@thekashmircurators.com',
        name: 'Operations Lead',
        role: 'operations',
        employeeCode: 'OPS001',
      },
    });

    // Send OTP (stored in Verification table in DB) and NEVER leaked in HTTP response
    const sendRes = await srv.request('POST', '/api/auth/team-send-otp', {
      body: { code: 'ops001' },
    });
    assert.equal(sendRes.status, 200);
    assert.equal(sendRes.body.success, true);
    assert.equal(sendRes.body.otp, undefined, 'OTP must never be leaked in HTTP response body');

    const verificationRecord = await inMemoryPrisma.verification.findFirst({
      where: { identifier: 'OPS001' },
    });
    assert.ok(verificationRecord, 'Verification record must be persisted in DB');
    assert.match(verificationRecord.value, /^\d{6}$/, 'Generated OTP must be a 6-digit code');

    // Wrong OTP and old hardcoded master OTP 123456 rejected
    const badOtp = await srv.request('POST', '/api/auth/team-verify-otp', {
      body: { code: 'OPS001', otp: '000000' },
    });
    assert.equal(badOtp.status, 400);

    const masterOtp = await srv.request('POST', '/api/auth/team-verify-otp', {
      body: { code: 'OPS001', otp: '123456' },
    });
    assert.equal(masterOtp.status, 400, 'Hardcoded master OTP 123456 bypass must be rejected');

    // Valid OTP accepted and consumes Verification record
    const verifyRes = await srv.request('POST', '/api/auth/team-verify-otp', {
      body: { code: 'OPS001', otp: verificationRecord.value },
    });
    assert.equal(verifyRes.status, 200);
    assert.equal(verifyRes.body.user.role, 'operations');
    assert.ok(verifyRes.body.token);

    const remainingVerifications = await inMemoryPrisma.verification.count({
      where: { identifier: 'OPS001' },
    });
    assert.equal(remainingVerifications, 0, 'Verification record must be deleted after consumption');

    // Team-login prefix role detection
    const salesLogin = await srv.request('POST', '/api/auth/team-login', {
      body: { code: 'SALES102' },
    });
    assert.equal(salesLogin.status, 200);
    assert.equal(salesLogin.body.user.role, 'sales');

    const invalidCode = await srv.request('POST', '/api/auth/team-login', {
      body: { code: 'GUEST999' },
    });
    assert.equal(invalidCode.status, 400);
  });

  it('authenticates active DB session tokens and rejects expired DB sessions', async () => {
    const user = await inMemoryPrisma.user.create({
      data: { email: 'session-user@kashmir.com', name: 'Session User', role: 'agent' },
    });

    await inMemoryPrisma.session.create({
      data: {
        userId: user.id,
        token: 'active-better-auth-session-token',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });
    await inMemoryPrisma.session.create({
      data: {
        userId: user.id,
        token: 'expired-better-auth-session-token',
        expiresAt: new Date(Date.now() - 60 * 1000),
      },
    });

    const okRes = await srv.request('GET', '/api/auth/me', {
      token: 'active-better-auth-session-token',
    });
    assert.equal(okRes.status, 200);
    assert.equal(okRes.body.email, 'session-user@kashmir.com');

    const expRes = await srv.request('GET', '/api/auth/me', {
      token: 'expired-better-auth-session-token',
    });
    assert.equal(expRes.status, 401);
  });

  it('validates Portal Access Keys (active, revoked, expired, portalType mismatch) and x-portal-key header', async () => {
    // Auto-provisioned alpha key works for HOSPITALITY
    const alphaRes = await srv.request('POST', '/api/hospitality/verify-access', {
      body: { accessKey: 'kc-hosp-alpha1', portalType: 'HOSPITALITY' },
    });
    assert.equal(alphaRes.status, 200);
    assert.equal(alphaRes.body.success, true);
    assert.ok(alphaRes.body.token);
    assert.equal(alphaRes.body.session.accessKey, 'KC-HOSP-ALPHA1');

    const keyRecord = await inMemoryPrisma.portalAccessKey.findUnique({
      where: { accessKey: 'KC-HOSP-ALPHA1' },
    });
    assert.equal(keyRecord.usageCount, 1);

    // Mismatched portalType rejected with 403
    const mismatchRes = await srv.request('POST', '/api/hospitality/verify-access', {
      body: { accessKey: 'KC-HOSP-ALPHA1', portalType: 'DRIVER' },
    });
    assert.equal(mismatchRes.status, 403);

    // Revoked key rejected with 403
    await inMemoryPrisma.portalAccessKey.create({
      data: {
        portalType: 'HOSPITALITY',
        accessKey: 'KC-HOSP-REVOKED',
        assignedName: 'Old Staff',
        status: 'REVOKED',
      },
    });
    const revokedRes = await srv.request('POST', '/api/hospitality/verify-access', {
      body: { accessKey: 'KC-HOSP-REVOKED' },
    });
    assert.equal(revokedRes.status, 403);

    // x-portal-key header authenticates protected hospitality route
    const hospRes = await srv.request('GET', '/api/hospitality/operations/kpi-summary', {
      headers: { 'x-portal-key': 'KC-HOSP-ALPHA1' },
    });
    assert.equal(hospRes.status, 200);
    assert.equal(typeof hospRes.body.totalReservations, 'number');
  });

  it('enforces authorizeRoles RBAC middleware for allowed and disallowed roles', () => {
    const guard = authorizeRoles('admin', 'operations');

    // Unauthenticated -> 401
    let statusCode = 0;
    let payload: any = null;
    const makeRes = () =>
      ({
        status(code: number) {
          statusCode = code;
          return this;
        },
        json(body: any) {
          payload = body;
          return this;
        },
      } as any);

    let nextCalled = false;
    guard({} as any, makeRes(), () => {
      nextCalled = true;
    });
    assert.equal(statusCode, 401);
    assert.equal(nextCalled, false);

    // Disallowed role -> 403
    statusCode = 0;
    nextCalled = false;
    guard({ user: { id: 'u1', role: 'user' } } as any, makeRes(), () => {
      nextCalled = true;
    });
    assert.equal(statusCode, 403);
    assert.match(payload.error, /not authorized/i);
    assert.equal(nextCalled, false);

    // Allowed role -> next()
    statusCode = 0;
    nextCalled = false;
    guard({ user: { id: 'u2', role: 'admin' } } as any, makeRes(), () => {
      nextCalled = true;
    });
    assert.equal(nextCalled, true);
    assert.equal(statusCode, 0);
  });

  it('rejects unverified google-login and enforces route-level RBAC guards', async () => {
    const plainGoogle = await srv.request('POST', '/api/auth/google-login', {
      body: { email: 'admin@kashmircurators.com', name: 'Spoofed User' },
    });
    assert.equal(plainGoogle.status, 400, 'google-login must require verifiable Google token');

    const regularUserToken = jwt.sign(
      { id: 'reg-u-1', email: 'traveler@kashmir.com', role: 'user' },
      process.env.JWT_SECRET!
    );

    const keysForbidden = await srv.request('GET', '/api/portal-keys', { token: regularUserToken });
    assert.equal(keysForbidden.status, 403, 'Portal keys listing must reject non-admin role');

    const adminToken = jwt.sign(
      { id: 'adm-1', email: 'admin@kashmircurators.com', role: 'admin' },
      process.env.JWT_SECRET!
    );
    const keysAllowed = await srv.request('GET', '/api/portal-keys', { token: adminToken });
    assert.equal(keysAllowed.status, 200);
  });
});
