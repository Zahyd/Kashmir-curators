import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { startTestServer, resetTestState, inMemoryPrisma, ioEvents, TestServerHandle } from './helpers/testHarness';
import {
  extractTenantId,
  withTenantScope,
  withStrictTenantScope,
  ensureDefaultOrganization,
  DEFAULT_TENANT_ID,
} from '../src/lib/tenant';

function makeToken(role: string, id: string, extra: Record<string, any> = {}) {
  return jwt.sign({ id, email: `${id}@kashmircurators.com`, role, name: id, ...extra }, process.env.JWT_SECRET!);
}

describe('Multi-Tenant Organization Isolation, Scoping & Real-Time Tenant Routing', () => {
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

  it('extracts tenant context accurately across headers, user session, admin bypass, and default platform fallback', async () => {
    // 1. x-tenant-id header takes precedence
    assert.equal(
      extractTenantId({ headers: { 'x-tenant-id': 'org-agency-1' }, user: { role: 'admin', organizationId: 'other' } } as any),
      'org-agency-1'
    );

    // 2. x-organization-id fallback header
    assert.equal(
      extractTenantId({ headers: { 'x-organization-id': 'org-hotel-2' }, user: { role: 'user' } } as any),
      'org-hotel-2'
    );

    // 3. Literal 'null' / 'undefined' header ignored -> falls back to user.organizationId
    assert.equal(
      extractTenantId({ headers: { 'x-tenant-id': 'null' }, user: { role: 'agent', organizationId: 'org-user-3' } } as any),
      'org-user-3'
    );

    // 4. Admin/Operations without header or orgId gets unrestricted null scope
    assert.equal(extractTenantId({ headers: {}, user: { role: 'admin' } } as any), null);
    assert.equal(extractTenantId({ headers: {}, user: { role: 'operations' } } as any), null);

    // 5. Standard user without header/orgId defaults to primary DMC tenant
    assert.equal(extractTenantId({ headers: {}, user: { role: 'user' } } as any), DEFAULT_TENANT_ID);

    // 6. ensureDefaultOrganization provisions primary DMC tenant idempotently
    const defOrg = await ensureDefaultOrganization();
    assert.equal(defOrg.id, DEFAULT_TENANT_ID);
    assert.equal(defOrg.type, 'DMC_PLATFORM');
    assert.equal(defOrg.status, 'ACTIVE');
  });

  it('enforces withTenantScope data isolation while preserving legacy null-tenant records', async () => {
    const orgA = await inMemoryPrisma.organization.create({
      data: { name: 'Alpine Travels', slug: 'alpine-travels', type: 'AGENCY' },
    });
    const orgB = await inMemoryPrisma.organization.create({
      data: { name: 'Saffron Tours', slug: 'saffron-tours', type: 'AGENCY' },
    });

    await inMemoryPrisma.hotel.create({
      data: { name: 'Org A Resort', location: 'Gulmarg', starRating: 5, pricePerNight: 15000, image: '/a.png', description: 'A', amenities: '[]', roomTypes: '[]', organizationId: orgA.id },
    });
    await inMemoryPrisma.hotel.create({
      data: { name: 'Org B Resort', location: 'Pahalgam', starRating: 5, pricePerNight: 16000, image: '/b.png', description: 'B', amenities: '[]', roomTypes: '[]', organizationId: orgB.id },
    });
    await inMemoryPrisma.hotel.create({
      data: { name: 'Legacy Core Hotel', location: 'Srinagar', starRating: 4, pricePerNight: 9000, image: '/legacy.png', description: 'Legacy', amenities: '[]', roomTypes: '[]', organizationId: null },
    });

    // Query scoped to Org A: sees Org A + Legacy null, NEVER Org B
    const orgAResults = await inMemoryPrisma.hotel.findMany({
      where: withTenantScope({ isActive: true }, orgA.id),
    });
    const orgANames = orgAResults.map((h: any) => h.name);
    assert.ok(orgANames.includes('Org A Resort'));
    assert.ok(orgANames.includes('Legacy Core Hotel'));
    assert.equal(orgANames.includes('Org B Resort'), false, 'Cross-tenant leak: Org B data must not be visible to Org A');

    // Unscoped platform admin (null tenantId): sees all 3
    const adminResults = await inMemoryPrisma.hotel.findMany({
      where: withTenantScope({ isActive: true }, null),
    });
    assert.equal(adminResults.length, 3);
  });

  it('provisions organizations, auto-links creator, filters by type/search, and computes org-scoped stats', async () => {
    const creator = await inMemoryPrisma.user.create({
      data: { email: 'founder@gulmargtours.in', name: 'Tariq Founder', role: 'agent' },
    });
    const creatorToken = makeToken('agent', creator.id);

    // Create Agency Organization
    const createRes = await srv.request('POST', '/api/organizations', {
      token: creatorToken,
      body: {
        name: 'Gulmarg Alpine Expeditions',
        type: 'AGENCY',
        tier: 'PROFESSIONAL',
        city: 'Gulmarg',
        email: 'desk@gulmargtours.in',
      },
    });
    assert.equal(createRes.status, 201);
    const orgId = createRes.body.organization.id;
    assert.equal(createRes.body.organization.type, 'AGENCY');
    assert.equal(createRes.body.organization.tier, 'PROFESSIONAL');

    // Creator without organizationId should be auto-linked to newly created org
    const updatedCreator = await inMemoryPrisma.user.findUnique({ where: { id: creator.id } });
    assert.equal(updatedCreator.organizationId, orgId);

    // Create a second Hotel Operator org
    await srv.request('POST', '/api/organizations', {
      token: makeToken('admin', 'platform-admin'),
      body: { name: 'Dal Lake Houseboats', type: 'HOTEL_OPERATOR', city: 'Srinagar' },
    });

    // Filter organizations by type & search
    const filteredRes = await srv.request('GET', '/api/organizations?type=AGENCY&search=Gulmarg');
    assert.equal(filteredRes.status, 200);
    assert.equal(filteredRes.body.organizations.length, 1);
    assert.equal(filteredRes.body.organizations[0].id, orgId);

    // Resolve current organization via x-tenant-id header
    const currentRes = await srv.request('GET', '/api/organizations/current', {
      headers: { 'x-tenant-id': orgId },
    });
    assert.equal(currentRes.status, 200);
    assert.equal(currentRes.body.organization.id, orgId);

    // Seed org-scoped records and check /api/organizations/:id/stats isolation
    const otherOrg = await inMemoryPrisma.organization.create({
      data: { name: 'Other Org', slug: 'other-org', type: 'AGENCY' },
    });
    await inMemoryPrisma.inquiry.create({
      data: { customerName: 'G1', email: 'g1@test.com', phone: '111', destination: 'Gulmarg', duration: '3D', travelers: '2', budget: '30k', accommodation: '3*', organizationId: orgId },
    });
    await inMemoryPrisma.inquiry.create({
      data: { customerName: 'G2', email: 'g2@test.com', phone: '222', destination: 'Srinagar', duration: '3D', travelers: '2', budget: '30k', accommodation: '3*', organizationId: otherOrg.id },
    });
    await inMemoryPrisma.booking.create({
      data: { userId: creator.id, type: 'hotel', itemName: 'Stay', bookingDate: new Date(), status: 'confirmed', totalAmount: 25000, details: '{}', organizationId: orgId },
    });

    const statsRes = await srv.request('GET', `/api/organizations/${orgId}/stats`);
    assert.equal(statsRes.status, 200);
    assert.equal(statsRes.body.stats.inquiriesCount, 1);
    assert.equal(statsRes.body.stats.activeBookingsCount, 1);

    // Patch organization tier & status
    const patchRes = await srv.request('PATCH', `/api/organizations/${orgId}`, {
      token: creatorToken,
      body: { tier: 'enterprise', status: 'active' },
    });
    assert.equal(patchRes.status, 200);
    assert.equal(patchRes.body.organization.tier, 'ENTERPRISE');

    // Booking update with x-tenant-id routes Socket.IO event to tenant-<orgId> room
    const booking = await inMemoryPrisma.booking.findFirst({ where: { organizationId: orgId } });
    await srv.request('PATCH', `/api/bookings/${booking.id}`, {
      token: creatorToken,
      headers: { 'x-tenant-id': orgId },
      body: { status: 'confirmed' },
    });
    assert.ok(ioEvents.some((e) => e.room === `tenant-${orgId}` && e.event === 'booking-updated'));
  });

  it('blocks x-tenant-id header spoofing by tenant-bound users and isolates operational PII queries', async () => {
    const orgA = await inMemoryPrisma.organization.create({
      data: { name: 'Alpha Tours', slug: 'alpha-tours', type: 'AGENCY', email: 'secret@alpha.com', phone: '9999999999' },
    });
    const orgB = await inMemoryPrisma.organization.create({
      data: { name: 'Beta Travels', slug: 'beta-travels', type: 'AGENCY' },
    });

    // Tenant-bound agent in orgA attempting to spoof x-tenant-id: orgB gets locked to orgA
    assert.equal(
      extractTenantId({ headers: { 'x-tenant-id': orgB.id }, user: { role: 'agent', organizationId: orgA.id } } as any),
      orgA.id
    );

    // Strict PII scoping excludes legacy null-tenant rows for third-party tenants
    await inMemoryPrisma.inquiry.create({
      data: { customerName: 'Org A Lead', email: 'a@test.com', phone: '111', destination: 'Gulmarg', duration: '3D', travelers: '2', budget: '30k', accommodation: '4*', organizationId: orgA.id },
    });
    await inMemoryPrisma.inquiry.create({
      data: { customerName: 'Org B Lead', email: 'b@test.com', phone: '222', destination: 'Pahalgam', duration: '3D', travelers: '2', budget: '30k', accommodation: '4*', organizationId: orgB.id },
    });
    await inMemoryPrisma.inquiry.create({
      data: { customerName: 'Platform Legacy Lead', email: 'legacy@test.com', phone: '333', destination: 'Srinagar', duration: '3D', travelers: '2', budget: '30k', accommodation: '4*', organizationId: null },
    });

    const strictOrgARows = await inMemoryPrisma.inquiry.findMany({
      where: withStrictTenantScope({}, orgA.id),
    });
    assert.equal(strictOrgARows.length, 1);
    assert.equal(strictOrgARows[0].customerName, 'Org A Lead');

    // End-to-end API: orgA sales user cannot fetch or mutate orgB lead even with spoofed header
    const salesAToken = makeToken('sales', 'sales-org-a', { organizationId: orgA.id, email: 'salesA@alpha.com' });
    const orgBLead = await inMemoryPrisma.inquiry.findFirst({ where: { organizationId: orgB.id } });
    const crossRead = await srv.request('GET', `/api/crm/leads/${orgBLead.id}`, {
      token: salesAToken,
      headers: { 'x-tenant-id': orgB.id },
    });
    assert.equal(crossRead.status, 403);

    // Unauthenticated GET /api/organizations/:id redacts email & phone
    const pubOrg = await srv.request('GET', `/api/organizations/${orgA.id}`);
    assert.equal(pubOrg.status, 200);
    assert.equal(pubOrg.body.organization.email, undefined);
    assert.equal(pubOrg.body.organization.phone, undefined);
  });
});
