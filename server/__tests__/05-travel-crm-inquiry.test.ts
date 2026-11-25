import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import {
  startTestServer,
  resetTestState,
  inMemoryPrisma,
  queuedSearchNudges,
  TestServerHandle,
} from './helpers/testHarness';

function makeToken(role: string, id: string, extra: Record<string, any> = {}) {
  return jwt.sign({ id, email: `${id}@kashmircurators.com`, role, name: id, ...extra }, process.env.JWT_SECRET!);
}

describe('Travel CRM Inquiry Capture, Lead Scoring, Kanban Pipeline, Notes, Reminders & Deduplication', () => {
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

  it('captures quick leads, categorizes & scores them, auto-routes via Round-Robin, and supports progressive enrichment', async () => {
    // Seed 2 online sales agents with unequal workloads
    const busyAgent = await inMemoryPrisma.user.create({
      data: { email: 'busy@sales.kc', name: 'Busy Agent', role: 'sales', isOnline: true, leadCapacity: 10 },
    });
    const freeAgent = await inMemoryPrisma.user.create({
      data: { email: 'free@sales.kc', name: 'Free Agent', role: 'sales', isOnline: true, leadCapacity: 5 },
    });
    await inMemoryPrisma.inquiry.create({
      data: {
        customerName: 'Existing Client',
        email: 'existing@client.com',
        phone: '+919900112233',
        destination: 'Srinagar',
        duration: '4 Days',
        travelers: '2',
        budget: '50k',
        accommodation: '4-Star',
        assignedTo: busyAgent.email,
        status: 'Pending Curation',
      },
    });

    // Missing phone and email rejected
    const invalidQuick = await srv.request('POST', '/api/inquiries/quick-capture', {
      body: { customerName: 'No Contact' },
    });
    assert.equal(invalidQuick.status, 400);

    // Valid quick capture -> routes to freeAgent (0 active leads < 1 active lead)
    const soonDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const quickRes = await srv.request('POST', '/api/inquiries/quick-capture', {
      body: {
        customerName: 'Riya & Arjun',
        phone: '+919876543210',
        email: 'riya.arjun@example.com',
        destination: 'Gulmarg',
        intentQuery: 'Luxury Kashmir honeymoon escape',
        travelStartDate: soonDate,
        sourceCta: 'PLAN_MY_TRIP',
      },
    });
    assert.equal(quickRes.status, 201);
    assert.equal(quickRes.body.success, true);
    assert.match(quickRes.body.leadId, /^KC-\d{4}-\d{4}$/);
    assert.equal(quickRes.body.lead.leadCategory, 'HONEYMOON_LUXURY');
    assert.equal(quickRes.body.lead.assignedTo, freeAgent.email);
    assert.equal(queuedSearchNudges.length, 1);

    // Progressive enrichment raises completeness to 100% and recalculates score/category
    const enrichRes = await srv.request('PATCH', `/api/inquiries/${quickRes.body.leadId}/enrich`, {
      body: {
        adultsCount: 2,
        childrenCount: 0,
        arrivalCity: 'Srinagar (SXR)',
        nightsCount: 6,
        budgetRange: 'Luxury VIP 75k+',
        preferredAccommodation: '5-Star Khyber',
        transportPreference: 'Innova Crysta',
        travelStyle: 'Offbeat Explorer',
        wantOffbeat: 'Yes',
        destination: 'Gurez & Gulmarg',
      },
    });
    assert.equal(enrichRes.status, 200);
    assert.equal(enrichRes.body.lead.profileCompleteness, 100);
    assert.equal(enrichRes.body.lead.sentiment, 'Hot');
    assert.equal(enrichRes.body.lead.priority, 'High');
    assert.ok(enrichRes.body.lead.leadScore >= 75);
  });

  it('enforces role-based CRM lead visibility and atomic Kanban stage transitions', async () => {
    const adminToken = makeToken('admin', 'crm-admin');
    const sales1 = await inMemoryPrisma.user.create({
      data: { email: 'sales1@kashmircurators.com', name: 'Sales One', role: 'sales', employeeCode: 'SALES01' },
    });
    const sales1Token = jwt.sign(
      { id: sales1.id, email: sales1.email, role: 'sales', employeeCode: 'SALES01', name: 'Sales One' },
      process.env.JWT_SECRET!
    );

    const leadA = await inMemoryPrisma.inquiry.create({
      data: {
        leadId: 'KC-2026-1001',
        customerName: 'Lead Alpha',
        email: 'alpha@guest.com',
        phone: '9911001100',
        destination: 'Srinagar',
        duration: '5D',
        travelers: '2',
        budget: '60000',
        accommodation: '4-Star',
        assignedTo: sales1.email,
        leadStage: 'NEW_LEAD',
        netPrice: 60000,
      },
    });
    await inMemoryPrisma.inquiry.create({
      data: {
        leadId: 'KC-2026-1002',
        customerName: 'Lead Beta',
        email: 'beta@guest.com',
        phone: '9922002200',
        destination: 'Pahalgam',
        duration: '4D',
        travelers: '4',
        budget: '80000',
        accommodation: '5-Star',
        assignedTo: 'sales2@kashmircurators.com',
        leadStage: 'CONFIRMED',
        netPrice: 80000,
      },
    });

    // Admin sees both leads
    const adminLeads = await srv.request('GET', '/api/crm/leads', { token: adminToken });
    assert.equal(adminLeads.status, 200);
    assert.equal(adminLeads.body.length, 2);

    // Sales1 sees only assigned leadA
    const salesLeads = await srv.request('GET', '/api/crm/leads', { token: sales1Token });
    assert.equal(salesLeads.status, 200);
    assert.equal(salesLeads.body.length, 1);
    assert.equal(salesLeads.body[0].id, leadA.id);

    // Kanban stage transition atomically updates leadStage, status, LeadActivity, and AuditLog
    const stageRes = await srv.request('PATCH', `/api/crm/leads/${leadA.id}/stage`, {
      token: sales1Token,
      body: { leadStage: 'CONFIRMED', priority: 'High' },
    });
    assert.equal(stageRes.status, 200);
    assert.equal(stageRes.body.leadStage, 'CONFIRMED');
    assert.equal(stageRes.body.status, 'Booked');

    const activities = await inMemoryPrisma.leadActivity.findMany({ where: { inquiryId: leadA.id } });
    assert.equal(activities.length, 1);
    assert.equal(activities[0].type, 'STAGE_CHANGE');

    const audits = await inMemoryPrisma.auditLog.findMany({ where: { action: 'UPDATE_LEAD_STAGE' } });
    assert.equal(audits.length, 1);

    // BI metrics reflect confirmed revenue and conversion rate
    const biRes = await srv.request('GET', '/api/crm/bi/metrics', { token: adminToken });
    assert.equal(biRes.status, 200);
    assert.equal(biRes.body.totalInquiries, 2);
    assert.equal(biRes.body.confirmedCount, 2);
    assert.equal(biRes.body.confirmedRevenue, 140000);
    assert.equal(biRes.body.overallConversionRate, 100);
  });

  it('manages team notes with author authorization, follow-up reminders, and duplicate lead merge', async () => {
    const authorToken = makeToken('sales', 'author-1');
    const otherSalesToken = makeToken('sales', 'other-sales-2');
    const adminToken = makeToken('admin', 'crm-admin-1');

    const master = await inMemoryPrisma.inquiry.create({
      data: {
        leadId: 'KC-2026-2001',
        customerName: 'Zainab Dar',
        email: 'zainab@example.com',
        phone: '+91 9876543210',
        destination: 'Sonamarg',
        duration: '5D',
        travelers: '2',
        budget: '50k',
        accommodation: 'Boutique',
      },
    });
    const duplicate = await inMemoryPrisma.inquiry.create({
      data: {
        leadId: 'KC-2026-2002',
        customerName: 'Zainab D.',
        email: 'zainab.alt@example.com',
        phone: '9876543210', // Matches last 10 digits!
        destination: 'Sonamarg',
        duration: '5D',
        travelers: '2',
        budget: '50k',
        accommodation: 'Boutique',
      },
    });

    // Add note on duplicate lead by author
    const noteRes = await srv.request('POST', `/api/crm/leads/${duplicate.id}/notes`, {
      token: authorToken,
      body: { content: 'Prefers Dal Lake houseboat for night 1' },
    });
    assert.equal(noteRes.status, 201);

    // Non-author non-admin cannot delete note (403)
    const forbidDel = await srv.request('DELETE', `/api/crm/notes/${noteRes.body.id}`, {
      token: otherSalesToken,
    });
    assert.equal(forbidDel.status, 403);

    // Create overdue reminder on duplicate lead
    const pastDue = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const remRes = await srv.request('POST', `/api/crm/leads/${duplicate.id}/reminders`, {
      token: authorToken,
      body: { title: 'Send revised Sonamarg quote', dueDate: pastDue, priority: 'HIGH' },
    });
    assert.equal(remRes.status, 201);

    const pendingRes = await srv.request('GET', '/api/crm/reminders/pending', { token: adminToken });
    assert.equal(pendingRes.status, 200);
    assert.equal(pendingRes.body.length, 1);
    assert.equal(pendingRes.body[0].isOverdue, true);

    // Complete reminder
    const completeRem = await srv.request('PATCH', `/api/crm/reminders/${remRes.body.id}`, {
      token: authorToken,
      body: { status: 'COMPLETED' },
    });
    assert.equal(completeRem.status, 200);
    assert.equal(completeRem.body.status, 'COMPLETED');

    // Duplicate detection finds normalized 10-digit phone match
    const dupCheck = await srv.request('GET', `/api/crm/leads/${master.id}/duplicates`, {
      token: adminToken,
    });
    assert.equal(dupCheck.status, 200);
    assert.equal(dupCheck.body.hasDuplicates, true);
    assert.equal(dupCheck.body.duplicates[0].id, duplicate.id);

    // Merge duplicate into master -> re-links notes & reminders, cancels duplicate
    const mergeRes = await srv.request('POST', `/api/crm/leads/${master.id}/merge`, {
      token: adminToken,
      body: { duplicateLeadId: duplicate.id },
    });
    assert.equal(mergeRes.status, 200);
    assert.equal(mergeRes.body.success, true);

    const masterNotes = await inMemoryPrisma.leadNote.findMany({ where: { inquiryId: master.id } });
    const masterReminders = await inMemoryPrisma.followUpReminder.findMany({ where: { inquiryId: master.id } });
    const mergedDup = await inMemoryPrisma.inquiry.findUnique({ where: { id: duplicate.id } });

    assert.equal(masterNotes.length, 1);
    assert.equal(masterReminders.length, 1);
    assert.equal(mergedDup.leadStage, 'CANCELLED');
    assert.equal(mergedDup.duplicateOfId, master.id);
  });
});
