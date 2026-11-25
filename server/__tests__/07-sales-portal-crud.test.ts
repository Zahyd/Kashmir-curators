import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import express from 'express';
import jwt from 'jsonwebtoken';
import { resetTestState, inMemoryPrisma, ioSpy } from './helpers/testHarness';

const salesRoutes = require('../src/routes/salesRoutes').default;
const paymentRoutes = require('../src/routes/paymentRoutes').default;
const inquiryRoutes = require('../src/routes/inquiryRoutes').default;

function makeToken(role: string, id: string, extra: Record<string, any> = {}) {
  return jwt.sign(
    { id, email: `${id}@kashmircurators.com`, role, name: id, ...extra },
    process.env.JWT_SECRET!
  );
}

async function reqJson(baseUrl: string, method: string, path: string, body?: any, token?: string) {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {})
  });
  const text = await res.text();
  let parsed: any = text;
  try {
    parsed = JSON.parse(text);
  } catch {
    // Plain text fallback
  }
  return { status: res.status, body: parsed };
}

describe('Sales Portal End-to-End CRUD, Vault Documents & Manual Payment Ledger', () => {
  let server: http.Server;
  let baseUrl = '';

  before(async () => {
    const app = express();
    app.use(express.json());
    app.use((req: any, _res, next) => {
      req.io = ioSpy;
      next();
    });
    app.use('/api/sales', salesRoutes);
    app.use('/api/payments', paymentRoutes);
    app.use('/api/inquiries', inquiryRoutes);

    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address() as any;
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  beforeEach(() => {
    resetTestState();
  });

  it('creates leads, computes real metrics without fake fallbacks, and enforces RBAC on inquiry deletion', async () => {
    const salesToken = makeToken('sales', 'sales001', { employeeCode: 'SALES001' });
    const adminToken = makeToken('admin', 'admin001', { employeeCode: 'ADMIN001' });

    // Empty DB metrics must return zero / null, never hardcoded 34% or 4.2m
    const emptyMetrics = await reqJson(baseUrl, 'GET', '/api/sales/metrics', undefined, salesToken);
    assert.equal(emptyMetrics.status, 200);
    assert.equal(emptyMetrics.body.activePipelineCount, 0);
    assert.equal(emptyMetrics.body.activePipelineValue, 0);
    assert.equal(emptyMetrics.body.monthlyConversionRate, 0);
    assert.equal(emptyMetrics.body.avgResponseMinutes, null);

    // Create real sales lead via POST /api/sales/leads
    const created = await reqJson(
      baseUrl,
      'POST',
      '/api/sales/leads',
      {
        customerName: 'Zoya Khan',
        phone: '+919906112233',
        email: 'zoya@example.com',
        destination: 'Gulmarg & Pahalgam',
        duration: '5 Nights / 6 Days',
        netPrice: 72000
      },
      salesToken
    );
    assert.equal(created.status, 201);
    assert.equal(created.body.customerName, 'Zoya Khan');
    assert.equal(created.body.netPrice, 72000);

    // Claim & transition to QUOTE_SENT (normalized from QUOTED as well)
    const claimed = await reqJson(
      baseUrl,
      'POST',
      `/api/sales/leads/${created.body.id}/claim`,
      { employeeCode: 'SALES001', employeeName: 'Sales 001' },
      salesToken
    );
    assert.equal(claimed.status, 200);
    assert.equal(claimed.body.lead.assignedTo, 'SALES001');

    const transitioned = await reqJson(
      baseUrl,
      'PATCH',
      `/api/sales/leads/${created.body.id}/stage`,
      { stage: 'QUOTED', notes: 'Sent custom quote' },
      salesToken
    );
    assert.equal(transitioned.status, 200);
    assert.equal(transitioned.body.lead.leadStage, 'QUOTE_SENT');

    // Live metrics should include QUOTE_SENT lead (₹72,000) and real avgResponseMinutes
    const liveMetrics = await reqJson(baseUrl, 'GET', '/api/sales/metrics', undefined, salesToken);
    assert.equal(liveMetrics.status, 200);
    assert.equal(liveMetrics.body.activePipelineCount, 1);
    assert.equal(liveMetrics.body.activePipelineValue, 72000);
    assert.equal(typeof liveMetrics.body.avgResponseMinutes, 'number');

    // Sales Executive cannot hard-delete; Admin/Director can
    const execDel = await reqJson(baseUrl, 'DELETE', `/api/inquiries/${created.body.id}`, undefined, salesToken);
    assert.equal(execDel.status, 403);

    const adminDel = await reqJson(baseUrl, 'DELETE', `/api/inquiries/${created.body.id}`, undefined, adminToken);
    assert.equal(adminDel.status, 200);
    assert.equal(adminDel.body.success, true);
  });

  it('supports full InquiryDocument Vault CRUD and manual UTR Payment reconciliation', async () => {
    const salesToken = makeToken('sales', 'sales001', { employeeCode: 'SALES001' });

    const inquiry = await inMemoryPrisma.inquiry.create({
      data: {
        customerName: 'Bilal Mir',
        email: 'bilal@example.com',
        phone: '+919906998877',
        destination: 'Dal Lake & Sonamarg',
        duration: '4 Days',
        travelers: '2',
        budget: '₹55,000',
        netPrice: 55000,
        accommodation: '4-Star',
        status: 'Pending Curation',
        leadStage: 'CLAIMED'
      }
    });

    // Document CRUD: Create -> Read -> Verify -> Delete
    const docCreate = await reqJson(
      baseUrl,
      'POST',
      `/api/sales/leads/${inquiry.id}/documents`,
      {
        name: 'Passport_Scan.pdf',
        category: 'ID_PROOF',
        url: 'https://res.cloudinary.com/demo/raw/upload/passport.pdf',
        sizeBytes: 204800
      },
      salesToken
    );
    assert.equal(docCreate.status, 201);
    assert.equal(docCreate.body.status, 'PENDING');

    const docList = await reqJson(baseUrl, 'GET', `/api/sales/leads/${inquiry.id}/documents`, undefined, salesToken);
    assert.equal(docList.status, 200);
    assert.equal(docList.body.length, 1);

    const docVerify = await reqJson(
      baseUrl,
      'PATCH',
      `/api/sales/documents/${docCreate.body.id}`,
      { status: 'VERIFIED' },
      salesToken
    );
    assert.equal(docVerify.status, 200);
    assert.equal(docVerify.body.status, 'VERIFIED');

    const docDel = await reqJson(baseUrl, 'DELETE', `/api/sales/documents/${docCreate.body.id}`, undefined, salesToken);
    assert.equal(docDel.status, 200);

    // Manual UTR Payment Recording & Duplicate Protection
    const payRes = await reqJson(
      baseUrl,
      'POST',
      `/api/payments/inquiry/${inquiry.id}/verify-manual`,
      {
        amount: 20000,
        utrNumber: 'UTR9988776655',
        markConfirmed: true,
        notes: '30% Advance'
      },
      salesToken
    );
    assert.equal(payRes.status, 201);
    assert.equal(payRes.body.inquiry.leadStage, 'CONFIRMED');
    assert.equal(payRes.body.ledgerEntry.paymentId, 'UTR9988776655');

    const dupRes = await reqJson(
      baseUrl,
      'POST',
      `/api/payments/inquiry/${inquiry.id}/verify-manual`,
      {
        amount: 20000,
        utrNumber: 'UTR9988776655',
        markConfirmed: true
      },
      salesToken
    );
    assert.equal(dupRes.status, 409);

    const ledgerRes = await reqJson(baseUrl, 'GET', `/api/payments/inquiry/${inquiry.id}`, undefined, salesToken);
    assert.equal(ledgerRes.status, 200);
    assert.equal(ledgerRes.body.length, 1);
    assert.equal(ledgerRes.body[0].amount, 20000);
  });
});
