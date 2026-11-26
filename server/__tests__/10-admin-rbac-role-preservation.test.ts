import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import express from 'express';
import jwt from 'jsonwebtoken';
import { resetTestState, inMemoryPrisma } from './helpers/testHarness';

const { tenantMiddleware } = require('../src/middleware/tenantMiddleware');
const authRoutes = require('../src/routes/authRoutes').default;
const agentRoutes = require('../src/routes/agentRoutes').default;
const paymentRoutes = require('../src/routes/paymentRoutes').default;
const vendorRoutes = require('../src/routes/vendorRoutes').default;
const dashboardRoutes = require('../src/routes/dashboardRoutes').default;

function makeToken(role: string, id: string, extra: Record<string, any> = {}) {
  return jwt.sign(
    { id, email: `${id}@thekashmircurators.com`, role, name: id, ...extra },
    process.env.JWT_SECRET!,
    { algorithm: 'HS256' }
  );
}

async function reqJson(baseUrl: string, method: string, urlPath: string, body?: any, token?: string) {
  const res = await fetch(`${baseUrl}${urlPath}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  let parsed: any = text;
  try {
    parsed = JSON.parse(text);
  } catch {
    // Plain text
  }
  return { status: res.status, body: parsed };
}

describe('Admin Login, Staff Role Preservation & RBAC Guarding', () => {
  let server: http.Server;
  let baseUrl = '';

  before(async () => {
    const app = express();
    app.use(express.json());
    app.use(tenantMiddleware);

    app.use('/api/auth', authRoutes);
    app.use('/api/agents', agentRoutes);
    app.use('/api/payments', paymentRoutes);
    app.use('/api/vendors', vendorRoutes);
    app.use('/api/dashboard', dashboardRoutes);

    server = http.createServer(app);
    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const addr = server.address() as any;
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  beforeEach(() => {
    resetTestState();
  });

  it('preserves existing staff/admin roles during agent onboarding, application approval, subscription upgrade, and vendor registration', async () => {
    const adminUser = await inMemoryPrisma.user.create({
      data: {
        id: 'u-admin-1',
        email: 'zahidreyaz44123@gmail.com',
        name: 'Zahid Riyaz (Director)',
        role: 'admin',
        employeeCode: 'ADMIN001',
      },
    });
    const travelerUser = await inMemoryPrisma.user.create({
      data: {
        id: 'u-traveler-1',
        email: 'traveler@example.com',
        name: 'Regular Traveler',
        role: 'user',
      },
    });

    const adminToken = makeToken('admin', adminUser.id, { code: 'ADMIN001' });
    const travelerToken = makeToken('user', travelerUser.id);

    // 1. Admin calls registerAgent -> keeps 'admin' role while getting AgentProfile
    const regAdminRes = await reqJson(
      baseUrl,
      'POST',
      '/api/agents/register',
      { companyName: 'Zahid Travels', licenseNumber: 'JK-REG-001', commissionPct: 10 },
      adminToken
    );
    assert.equal(regAdminRes.status, 201);
    const adminAfterReg = await inMemoryPrisma.user.findUnique({ where: { id: adminUser.id } });
    assert.equal(adminAfterReg.role, 'admin', 'registerAgent must preserve existing admin role');

    // 2. Admin approves an agency application tied to an operations staff account -> keeps 'operations'
    const opsUser = await inMemoryPrisma.user.create({
      data: {
        id: 'u-ops-1',
        email: 'ops001@kashmir.com',
        name: 'Ops Manager',
        role: 'operations',
        employeeCode: 'OPS001',
      },
    });
    const appForOps = await inMemoryPrisma.agencyApplication.create({
      data: {
        id: 'app-ops-1',
        applicationRef: 'APP-OPS-001',
        agencyName: 'Ops Partner Wing',
        authorizedPerson: 'Ops Manager',
        email: 'ops001@kashmir.com',
        phone: '+919900001111',
        location: 'Srinagar',
        selectedPlan: 'PRO_DMC',
        billingCycle: 'MONTHLY',
        userId: opsUser.id,
        status: 'SUBMITTED',
      },
    });
    const reviewOpsRes = await reqJson(
      baseUrl,
      'PATCH',
      `/api/agents/applications/${appForOps.id}/review`,
      { status: 'APPROVED', commissionPct: 12 },
      adminToken
    );
    assert.equal(reviewOpsRes.status, 200);
    const opsAfterReview = await inMemoryPrisma.user.findUnique({ where: { id: opsUser.id } });
    assert.equal(opsAfterReview.role, 'operations', 'reviewApplication must preserve existing operations role');

    // 3. Admin upgrades B2B subscription -> keeps 'admin' role
    const prevEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    try {
      const subAdminRes = await reqJson(
        baseUrl,
        'POST',
        '/api/payments/razorpay/verify-subscription',
        { planId: 'PRO_DMC', billingCycle: 'MONTHLY' },
        adminToken
      );
      assert.equal(subAdminRes.status, 200);
      const adminAfterSub = await inMemoryPrisma.user.findUnique({ where: { id: adminUser.id } });
      assert.equal(adminAfterSub.role, 'admin', 'verifySubscriptionPayment must preserve existing admin role');

      // 4. Regular 'user' still upgrades to 'agent' on verifySubscriptionPayment
      const subTravelerRes = await reqJson(
        baseUrl,
        'POST',
        '/api/payments/razorpay/verify-subscription',
        { planId: 'PRO_DMC', billingCycle: 'MONTHLY' },
        travelerToken
      );
      assert.equal(subTravelerRes.status, 200);
      const travelerAfterSub = await inMemoryPrisma.user.findUnique({ where: { id: travelerUser.id } });
      assert.equal(travelerAfterSub.role, 'agent', 'Non-staff user must still upgrade to agent role');
    } finally {
      process.env.NODE_ENV = prevEnv;
    }

    // 5. Admin registering vendor profile preserves 'admin' role
    const vendorRes = await reqJson(
      baseUrl,
      'POST',
      '/api/vendors/register',
      { companyName: 'Curator Heritage Stays', type: 'HOTEL', phone: '+919900002222' },
      adminToken
    );
    assert.equal(vendorRes.status, 201);
    const adminAfterVendor = await inMemoryPrisma.user.findUnique({ where: { id: adminUser.id } });
    assert.equal(adminAfterVendor.role, 'admin', 'registerVendor must preserve existing admin role');

    // 6. Admin user retains full access to /api/agents/stats and /api/dashboard/admin
    const agentStatsRes = await reqJson(baseUrl, 'GET', '/api/agents/stats', undefined, adminToken);
    assert.equal(agentStatsRes.status, 200);
    const adminDashRes = await reqJson(baseUrl, 'GET', '/api/dashboard/admin', undefined, adminToken);
    assert.equal(adminDashRes.status, 200);
  });

  it('blocks non-staff roles on Staff Command Terminal OTP endpoints and Admin/Sales dashboard APIs', async () => {
    await inMemoryPrisma.user.create({
      data: {
        id: 'u-agent-coded',
        email: 'partner@agency.test',
        name: 'External Agent',
        role: 'agent',
        employeeCode: 'AGT001',
      },
    });
    await inMemoryPrisma.verification.create({
      data: {
        id: 'verif-agent-1',
        identifier: 'AGT001',
        value: '654321',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    const sendRes = await reqJson(baseUrl, 'POST', '/api/auth/team-send-otp', { code: 'AGT001' });
    assert.equal(sendRes.status, 403);
    assert.match(String(sendRes.body.error || ''), /not authorized/i);

    const verifyRes = await reqJson(baseUrl, 'POST', '/api/auth/team-verify-otp', {
      code: 'AGT001',
      otp: '654321',
    });
    assert.equal(verifyRes.status, 403);
    assert.match(String(verifyRes.body.error || ''), /not authorized/i);

    const agentToken = makeToken('agent', 'u-agent-coded');
    const salesToken = makeToken('sales', 'u-sales-1');
    const financeToken = makeToken('finance', 'u-fin-1');

    assert.equal((await reqJson(baseUrl, 'GET', '/api/dashboard/admin', undefined, agentToken)).status, 403);
    assert.equal((await reqJson(baseUrl, 'GET', '/api/dashboard/admin', undefined, salesToken)).status, 403);
    assert.equal((await reqJson(baseUrl, 'GET', '/api/dashboard/admin', undefined, financeToken)).status, 200);
    assert.equal((await reqJson(baseUrl, 'GET', '/api/dashboard/sales', undefined, agentToken)).status, 403);
  });
});
