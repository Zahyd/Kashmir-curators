import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import prisma from '../lib/prisma';
import { io } from '../index';
import { realtimeBus } from '../lib/realtimeBus';
import { LeadScoringService } from '../services/leadScoringService';
import {
  DEFAULT_TENANT_ID,
  withStrictTenantScope,
  canAccessTenantRecord,
  resolveWriteTenantId,
  buildTenantNotificationUserId
} from '../lib/tenant';

// Helper: Normalize phone to 10 digits for duplicate matching
function normalizePhone(phone: string): string {
  const digits = (phone || '').replace(/[^0-9]/g, '');
  return digits.length > 10 ? digits.slice(-10) : digits;
}

function getLeadValueINR(inq: { netPrice?: number | null; budget?: string | number | null }): number {
  if (inq.netPrice && Number(inq.netPrice) > 0) return Number(inq.netPrice);
  const digits = String(inq.budget || '').replace(/[^0-9]/g, '');
  if (!digits) return 0;
  const parsed = parseInt(digits, 10);
  return isNaN(parsed) || parsed < 500 ? 0 : parsed;
}

function buildCrmRoleWhere(req: AuthRequest, assignedToFilter?: unknown): Record<string, any> {
  const role = String(req.user?.role || '').toLowerCase();
  const userEmail = req.user?.email;
  const employeeCode = req.user?.employeeCode || (req.user as any)?.code;

  if (role === 'admin' || role === 'operations' || role === 'finance' || role === 'marketing') {
    if (assignedToFilter && assignedToFilter !== 'ALL') {
      return { assignedTo: String(assignedToFilter) };
    }
    return {};
  }

  if (role === 'agent') {
    const orClauses: any[] = [];
    if (req.user?.id) orClauses.push({ agentId: req.user.id }, { userId: req.user.id });
    if (userEmail) orClauses.push({ assignedTo: userEmail });
    if (employeeCode) orClauses.push({ assignedTo: employeeCode });
    return orClauses.length > 0 ? { OR: orClauses } : { id: '__no_matching_agent__' };
  }

  const orClauses: any[] = [];
  if (userEmail) {
    orClauses.push({ assignedTo: userEmail }, { email: userEmail });
  }
  if (employeeCode) {
    orClauses.push({ assignedTo: employeeCode });
  }
  return orClauses.length > 0 ? { OR: orClauses } : { id: '__no_matching_assignee__' };
}

function canAgentAccessLead(req: AuthRequest, lead: any): boolean {
  if (!canAccessTenantRecord(req, lead?.organizationId)) {
    return false;
  }
  const role = String(req.user?.role || '').toLowerCase();
  if (role !== 'agent') {
    return true;
  }
  const userId = String(req.user?.id || '');
  const userEmail = String(req.user?.email || '').toLowerCase();
  const empCode = String(req.user?.employeeCode || (req.user as any)?.code || '').toLowerCase();
  const assignedTo = String(lead?.assignedTo || '').toLowerCase();
  const orgId = (req.user as any)?.organizationId;

  if (userId && (lead?.agentId === userId || lead?.userId === userId)) return true;
  if (userEmail && assignedTo === userEmail) return true;
  if (empCode && assignedTo === empCode) return true;
  if (orgId && orgId !== DEFAULT_TENANT_ID && lead?.organizationId === orgId) return true;
  return false;
}

function collectLeadTargetUserIds(lead: any, extraIds: Array<string | null | undefined> = []): string[] | undefined {
  const unique = new Set<string>();
  for (const id of [lead?.agentId, lead?.userId, ...extraIds]) {
    if (id && typeof id === 'string') {
      unique.add(id);
    }
  }
  return unique.size > 0 ? Array.from(unique) : undefined;
}

/**
 * GET /api/crm/leads
 * Comprehensive lead retrieval with multi-dimensional filtering, search, and optional pagination
 */
export const getCRMLeads = async (req: AuthRequest, res: Response) => {
  try {
    const {
      stage,
      category,
      priority,
      sentiment,
      search,
      assignedTo,
      startDate,
      endDate,
      paginated,
      page,
      limit
    } = req.query;

    const where: any = buildCrmRoleWhere(req, assignedTo);

    if (stage && stage !== 'ALL') {
      where.leadStage = stage as string;
    }

    if (category && category !== 'ALL') {
      where.leadCategory = category as string;
    }

    if (priority && priority !== 'ALL') {
      where.priority = priority as string;
    }

    if (sentiment && sentiment !== 'ALL') {
      where.sentiment = sentiment as string;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    if (search) {
      const q = String(search).trim();
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { customerName: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
            { phone: { contains: q } },
            { destination: { contains: q, mode: 'insensitive' } },
            { leadId: { contains: q, mode: 'insensitive' } }
          ]
        }
      ];
    }

    const scopedWhere = withStrictTenantScope(where, req.tenantId);

    const includeSpec = {
      _count: {
        select: {
          internalNotes: true,
          reminders: {
            where: { status: 'PENDING' }
          },
          whatsappMessages: true,
          activities: true
        }
      }
    };

    if (String(paginated || '').toLowerCase() === 'true') {
      const parsedPage = Math.max(1, parseInt(String(page || '1'), 10) || 1);
      const parsedLimit = Math.min(100, Math.max(1, parseInt(String(limit || '25'), 10) || 25));
      const [total, inquiries] = await Promise.all([
        prisma.inquiry.count({ where: scopedWhere }),
        prisma.inquiry.findMany({
          where: scopedWhere,
          include: includeSpec,
          orderBy: { updatedAt: 'desc' },
          skip: (parsedPage - 1) * parsedLimit,
          take: parsedLimit
        })
      ]);
      return res.json({
        items: inquiries,
        total,
        page: parsedPage,
        limit: parsedLimit,
        totalPages: Math.max(1, Math.ceil(total / parsedLimit))
      });
    }

    const inquiries = await prisma.inquiry.findMany({
      where: scopedWhere,
      include: includeSpec,
      orderBy: { updatedAt: 'desc' }
    });

    res.json(inquiries);
  } catch (error) {
    console.error('getCRMLeads error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/crm/leads/:id
 * Retrieve comprehensive lead detail including traveler profile, timeline, notes & reminders
 */
export const getLeadDetail = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const lead = await prisma.inquiry.findUnique({
      where: { id: id as string },
      include: {
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 50
        },
        internalNotes: {
          orderBy: { createdAt: 'desc' }
        },
        reminders: {
          orderBy: { dueDate: 'asc' }
        },
        whatsappMessages: {
          orderBy: { createdAt: 'desc' },
          take: 30
        },
        hotelReservations: {
          include: { hotel: true }
        },
        cabReservations: {
          include: { cab: true }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      }
    });

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    if (!canAgentAccessLead(req, lead)) {
      return res.status(403).json({ error: 'Forbidden: Cross-tenant lead access denied' });
    }

    res.json(lead);
  } catch (error) {
    console.error('getLeadDetail error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * POST /api/crm/leads
 * Creates a persisted traveler inquiry directly from the CRM or B2B Agent Desk
 * and broadcasts scoped real-time creation events immediately.
 */
export const createCRMLead = async (req: AuthRequest, res: Response) => {
  try {
    const {
      customerName,
      email,
      phone,
      destination,
      duration,
      travelers,
      adultsCount,
      childrenCount,
      budget,
      netPrice,
      accommodation,
      priority,
      assignedTo,
      notes,
      sourceCta,
      leadStage
    } = req.body || {};

    if (!customerName || !String(customerName).trim()) {
      return res.status(400).json({ error: 'Customer name is required' });
    }

    const p = prisma as any;
    const role = String(req.user?.role || '').toLowerCase();
    const isAgentUser = role === 'agent';
    const adults = Math.max(1, parseInt(String(adultsCount || '2'), 10) || 2);
    const children = Math.max(0, parseInt(String(childrenCount || '0'), 10) || 0);
    const parsedNetPrice = netPrice !== undefined && !isNaN(Number(netPrice)) ? Number(netPrice) : 0;

    const leadId = await LeadScoringService.generateLeadId();
    const scoreResult = LeadScoringService.calculateScore({
      destination: destination || 'Kashmir',
      budgetRange: budget ? String(budget) : undefined,
      preferredAccommodation: accommodation || undefined,
      adultsCount: adults,
      childrenCount: children,
      sourceCta: sourceCta || (isAgentUser ? 'B2B_AGENT_DESK' : 'CRM_DESK'),
      profileCompleteness: 70
    });

    const organizationId = resolveWriteTenantId(req);
    const normalizedStage = String(leadStage || 'NEW_LEAD').trim().toUpperCase();
    const statusMap: Record<string, string> = {
      NEW_LEAD: 'New',
      CLAIMED: 'Pending Curation',
      FOLLOW_UP: 'Pending Curation',
      QUOTE_SENT: 'Ready for Review',
      NEGOTIATION: 'Ready for Review',
      PAYMENT_PENDING: 'Ready for Review',
      CONFIRMED: 'Booked',
      COMPLETED: 'Booked',
      CANCELLED: 'Lost',
      LOST: 'Lost'
    };

    const assignee =
      assignedTo !== undefined && assignedTo !== null
        ? String(assignedTo).trim() || null
        : isAgentUser
          ? (req.user?.employeeCode || req.user?.email || null)
          : null;

    const created = await p.inquiry.create({
      data: {
        leadId,
        agentId: isAgentUser ? String(req.user?.id) : req.body?.agentId ? String(req.body.agentId) : null,
        organizationId,
        customerName: String(customerName).trim(),
        email: email && String(email).trim() ? String(email).trim() : `${leadId.toLowerCase()}@guest.kashmirconnect.com`,
        phone: phone && String(phone).trim() ? String(phone).trim() : 'Not Provided',
        destination: destination && String(destination).trim() ? String(destination).trim() : 'Kashmir',
        duration: duration && String(duration).trim() ? String(duration).trim() : '6 Days',
        travelers: travelers ? String(travelers) : `${adults} Adults${children > 0 ? `, ${children} Kids` : ''}`,
        adultsCount: adults,
        childrenCount: children,
        budget: budget ? String(budget) : parsedNetPrice > 0 ? `₹${parsedNetPrice.toLocaleString('en-IN')}` : 'Luxury',
        netPrice: parsedNetPrice,
        accommodation: accommodation || '4-Star Boutique',
        preferredAccommodation: accommodation || '4-Star Boutique',
        status: statusMap[normalizedStage] || 'New',
        leadStage: normalizedStage,
        leadScore: scoreResult.totalScore,
        leadCategory: scoreResult.category,
        sentiment: scoreResult.sentiment,
        priority: priority || scoreResult.priority,
        assignedTo: assignee,
        notes: notes ? String(notes).trim() : null,
        sourceCta: sourceCta || (isAgentUser ? 'B2B_AGENT_DESK' : 'CRM_DESK'),
        scoringBreakdown: JSON.stringify(scoreResult.scoringBreakdown),
        profileCompleteness: 70
      }
    });

    const performer = req.user?.name || req.user?.email || 'Partner Agent';
    const activity = await p.leadActivity.create({
      data: {
        inquiryId: created.id,
        type: 'LEAD_CREATED',
        title: `Lead registered by ${performer}`,
        description: `Created itinerary lead for ${created.destination} (${created.duration})`,
        performedBy: performer
      }
    });

    const notification = await p.notification
      .create({
        data: {
          userId: created.agentId || buildTenantNotificationUserId(organizationId),
          title: 'New Travel Inquiry',
          message: `${created.customerName} (${created.destination}) added to pipeline`,
          type: 'inquiry',
          priority: 'medium',
          link: isAgentUser ? '/agent' : `/sales/portal?tab=live-leads&inquiryId=${created.id}`,
          read: false
        }
      })
      .catch(() => null);

    const ioRef = (req as any).io || io;
    const targetUserIds = collectLeadTargetUserIds(created);

    realtimeBus.publish('NEW_INQUIRY', created, { io: ioRef, tenantId: organizationId, userIds: targetUserIds });
    realtimeBus.publish(
      'lead-updated',
      {
        inquiryId: created.id,
        customerName: created.customerName,
        newStage: created.leadStage,
        updatedLead: created,
        organizationId
      },
      { io: ioRef, tenantId: organizationId, userIds: targetUserIds }
    );
    realtimeBus.publish('ACTIVITY_LOGGED', { ...activity, inquiry: created }, {
      io: ioRef,
      tenantId: organizationId,
      userIds: targetUserIds
    });
    realtimeBus.publish(
      'new-system-event',
      {
        type: 'CREATE',
        message: `New Lead: ${created.customerName} interested in ${created.destination}`,
        booking: { ...created, entityType: 'inquiry' },
        inquiry: created,
        notification,
        timestamp: new Date().toISOString()
      },
      { io: ioRef, tenantId: organizationId, userIds: targetUserIds }
    );

    res.status(201).json(created);
  } catch (error) {
    console.error('createCRMLead error:', error);
    res.status(500).json({ error: 'Failed to create CRM lead' });
  }
};

/**
 * PATCH /api/crm/leads/:id/stage
 * Drag & Drop or manual Kanban stage update with atomic activity logging & Socket broadcast
 */
export const updateLeadStage = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { leadStage, priority, assignedTo, budget, destination, duration, sentiment, netPrice } = req.body;

  try {
    const inquiry = await prisma.inquiry.findUnique({ where: { id: id as string } });
    if (!inquiry) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    if (!canAgentAccessLead(req, inquiry)) {
      return res.status(403).json({ error: 'Forbidden: Cross-tenant lead update denied' });
    }

    // Map leadStage to legacy status value for cross-compatibility
    let status = inquiry.status;
    if (leadStage) {
      switch (leadStage) {
        case 'NEW_LEAD': status = 'New'; break;
        case 'CLAIMED':
        case 'FOLLOW_UP': status = 'Pending Curation'; break;
        case 'QUOTE_SENT':
        case 'NEGOTIATION':
        case 'PAYMENT_PENDING': status = 'Ready for Review'; break;
        case 'CONFIRMED':
        case 'COMPLETED': status = 'Booked'; break;
        case 'LOST':
        case 'CANCELLED': status = 'Lost'; break;
        default: status = inquiry.status;
      }
    }

    const previousStage = inquiry.leadStage;

    // Use transaction to ensure inquiry update, activity log, and audit log commit together
    const [updated, activity] = await prisma.$transaction([
      prisma.inquiry.update({
        where: { id: id as string },
        data: {
          leadStage: leadStage || undefined,
          status,
          priority: priority || undefined,
          assignedTo: assignedTo || undefined,
          budget: budget || undefined,
          netPrice: netPrice !== undefined && !isNaN(Number(netPrice)) ? Number(netPrice) : undefined,
          destination: destination || undefined,
          duration: duration || undefined,
          sentiment: sentiment || undefined,
          lastContactedAt: new Date()
        }
      }),
      prisma.leadActivity.create({
        data: {
          inquiryId: id as string,
          type: 'STAGE_CHANGE',
          title: `Stage changed to ${leadStage?.replace(/_/g, ' ') || 'Updated'}`,
          description: `Stage moved from ${previousStage} to ${leadStage}`,
          performedBy: req.user?.name || req.user?.email || 'Sales Agent',
          metadata: JSON.stringify({
            previousStage,
            newStage: leadStage,
            updatedAt: new Date().toISOString()
          })
        }
      }),
      prisma.auditLog.create({
        data: {
          userId: (req.user?.id as string) || 'system',
          action: 'UPDATE_LEAD_STAGE',
          details: JSON.stringify({
            inquiryId: id,
            oldStage: previousStage,
            newStage: leadStage,
            oldStatus: inquiry.status,
            newStatus: status
          })
        }
      })
    ]);

    // Real-time synchronization via tenant/agent-scoped RealtimeBus (no global PII leaks)
    const ioRef = (req as any).io || io;
    const tenantId = (updated as any).organizationId || (req.user as any)?.organizationId || null;
    const targetUserIds = collectLeadTargetUserIds(updated);
    const leadPayload = {
      inquiryId: id,
      customerName: updated.customerName,
      newStage: leadStage || updated.leadStage,
      updatedLead: updated,
      organizationId: tenantId
    };

    realtimeBus.publish('lead-updated', leadPayload, { io: ioRef, tenantId, userIds: targetUserIds });
    realtimeBus.publish('STAGE_UPDATED', { leadId: id, stage: leadStage || updated.leadStage, lead: updated }, { io: ioRef, tenantId, userIds: targetUserIds });
    realtimeBus.publish('ACTIVITY_LOGGED', { ...activity, inquiry: updated }, { io: ioRef, tenantId, userIds: targetUserIds });
    realtimeBus.publish('new-system-event', {
      type: 'LEAD_STAGE_UPDATED',
      inquiry: updated,
      booking: { ...updated, entityType: 'inquiry' },
      message: `${updated.customerName} transitioned to ${(leadStage || updated.leadStage)?.replace(/_/g, ' ')}`,
      timestamp: new Date().toISOString()
    }, { io: ioRef, tenantId, userIds: targetUserIds });

    res.json(updated);
  } catch (error) {
    console.error('updateLeadStage error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * POST /api/crm/leads/:id/notes
 * Add internal team note
 */
export const addLeadNote = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { content, isInternal = true } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Note content is required' });
  }

  try {
    const inquiry = await prisma.inquiry.findUnique({
      where: { id: id as string },
      select: { id: true, organizationId: true, customerName: true, agentId: true, userId: true, assignedTo: true }
    });
    if (!inquiry) return res.status(404).json({ error: 'Lead not found' });
    if (!canAgentAccessLead(req, inquiry)) {
      return res.status(403).json({ error: 'Forbidden: Cross-tenant lead note access denied' });
    }

    const authorName = req.user?.name || req.user?.email || 'Team Member';
    const authorId = req.user?.id || null;

    const [note, activity] = await prisma.$transaction([
      prisma.leadNote.create({
        data: {
          inquiryId: id as string,
          authorId,
          authorName,
          content: content.trim(),
          isInternal
        }
      }),
      prisma.leadActivity.create({
        data: {
          inquiryId: id as string,
          type: 'NOTE_ADDED',
          title: `Note added by ${authorName}`,
          description: content.trim().slice(0, 150) + (content.length > 150 ? '...' : ''),
          performedBy: authorName
        }
      })
    ]);

    const ioRef = (req as any).io || io;
    const targetUserIds = collectLeadTargetUserIds(inquiry);
    realtimeBus.publish('lead-note-added', { inquiryId: id, note, organizationId: inquiry.organizationId }, {
      io: ioRef,
      tenantId: inquiry.organizationId,
      userIds: targetUserIds
    });
    realtimeBus.publish('ACTIVITY_LOGGED', { ...activity, inquiry }, {
      io: ioRef,
      tenantId: inquiry.organizationId,
      userIds: targetUserIds
    });

    res.status(201).json(note);
  } catch (error) {
    console.error('addLeadNote error:', error);
    res.status(500).json({ error: 'Failed to create note' });
  }
};

/**
 * GET /api/crm/leads/:id/notes
 */
export const getLeadNotes = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const inquiry = await prisma.inquiry.findUnique({
      where: { id: id as string },
      select: { id: true, organizationId: true, agentId: true, userId: true, assignedTo: true }
    });
    if (!inquiry) return res.status(404).json({ error: 'Lead not found' });
    if (!canAgentAccessLead(req, inquiry)) {
      return res.status(403).json({ error: 'Forbidden: Cross-tenant lead notes access denied' });
    }

    const notes = await prisma.leadNote.findMany({
      where: { inquiryId: id as string },
      orderBy: { createdAt: 'desc' }
    });
    res.json(notes);
  } catch (error) {
    console.error('getLeadNotes error:', error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
};

/**
 * DELETE /api/crm/notes/:noteId
 */
export const deleteLeadNote = async (req: AuthRequest, res: Response) => {
  const { noteId } = req.params;

  try {
    const note = await prisma.leadNote.findUnique({ where: { id: noteId as string } });
    if (!note) return res.status(404).json({ error: 'Note not found' });

    const inquiry = await prisma.inquiry.findUnique({
      where: { id: note.inquiryId },
      select: { organizationId: true }
    });
    if (inquiry && !canAccessTenantRecord(req, inquiry.organizationId)) {
      return res.status(403).json({ error: 'Forbidden: Cross-tenant note deletion denied' });
    }

    // Allow author, admin, or operations
    if (note.authorId && note.authorId !== req.user?.id && req.user?.role !== 'admin' && req.user?.role !== 'operations') {
      return res.status(403).json({ error: 'Not authorized to delete this note' });
    }

    await prisma.leadNote.delete({ where: { id: noteId as string } });
    res.json({ success: true, message: 'Note deleted' });
  } catch (error) {
    console.error('deleteLeadNote error:', error);
    res.status(500).json({ error: 'Failed to delete note' });
  }
};

/**
 * GET /api/crm/leads/:id/reminders
 */
export const getLeadReminders = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const inquiry = await prisma.inquiry.findUnique({
      where: { id: id as string },
      select: { id: true, organizationId: true, agentId: true, userId: true, assignedTo: true }
    });
    if (!inquiry) return res.status(404).json({ error: 'Lead not found' });
    if (!canAgentAccessLead(req, inquiry)) {
      return res.status(403).json({ error: 'Forbidden: Cross-tenant lead reminders access denied' });
    }

    const reminders = await prisma.followUpReminder.findMany({
      where: { inquiryId: id as string },
      orderBy: { dueDate: 'asc' }
    });
    res.json(reminders);
  } catch (error) {
    console.error('getLeadReminders error:', error);
    res.status(500).json({ error: 'Failed to fetch reminders' });
  }
};

/**
 * POST /api/crm/leads/:id/reminders
 * Schedule follow-up with due date and priority
 */
export const createReminder = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { title, dueDate, priority = 'MEDIUM', notes } = req.body;

  if (!title || !dueDate) {
    return res.status(400).json({ error: 'Title and dueDate are required' });
  }

  try {
    const inquiry = await prisma.inquiry.findUnique({
      where: { id: id as string },
      select: { id: true, organizationId: true, customerName: true, agentId: true, userId: true, assignedTo: true }
    });
    if (!inquiry) return res.status(404).json({ error: 'Lead not found' });
    if (!canAgentAccessLead(req, inquiry)) {
      return res.status(403).json({ error: 'Forbidden: Cross-tenant lead reminder access denied' });
    }

    const parsedDueDate = new Date(dueDate);
    if (isNaN(parsedDueDate.getTime())) {
      return res.status(400).json({ error: 'Valid dueDate is required' });
    }
    const assignedTo = req.user?.email || req.user?.employeeCode || (req.user as any)?.code || null;

    const [reminder, , activity] = await prisma.$transaction([
      prisma.followUpReminder.create({
        data: {
          inquiryId: id as string,
          assignedTo,
          title: title.trim(),
          dueDate: parsedDueDate,
          priority,
          notes: notes?.trim() || null,
          status: 'PENDING'
        }
      }),
      prisma.inquiry.update({
        where: { id: id as string },
        data: { nextFollowUpDate: parsedDueDate }
      }),
      prisma.leadActivity.create({
        data: {
          inquiryId: id as string,
          type: 'REMINDER_SCHEDULED',
          title: `Follow-up scheduled: ${title}`,
          description: `Due on ${parsedDueDate.toLocaleDateString()} (${priority} priority)`,
          performedBy: req.user?.name || req.user?.email || 'Agent'
        }
      })
    ]);

    const ioRef = (req as any).io || io;
    const targetUserIds = collectLeadTargetUserIds(inquiry);
    realtimeBus.publish('reminder-scheduled', { inquiryId: id, reminder, organizationId: inquiry.organizationId }, {
      io: ioRef,
      tenantId: inquiry.organizationId,
      userIds: targetUserIds
    });
    realtimeBus.publish('ACTIVITY_LOGGED', { ...activity, inquiry }, {
      io: ioRef,
      tenantId: inquiry.organizationId,
      userIds: targetUserIds
    });

    res.status(201).json(reminder);
  } catch (error) {
    console.error('createReminder error:', error);
    res.status(500).json({ error: 'Failed to schedule reminder' });
  }
};

/**
 * PATCH /api/crm/reminders/:reminderId
 * Complete, reschedule, or cancel a reminder
 */
export const updateReminder = async (req: AuthRequest, res: Response) => {
  const { reminderId } = req.params;
  const { status, dueDate, notes } = req.body;

  try {
    const existing = await prisma.followUpReminder.findUnique({
      where: { id: reminderId as string }
    });

    if (!existing) return res.status(404).json({ error: 'Reminder not found' });

    const inquiry = await prisma.inquiry.findUnique({
      where: { id: existing.inquiryId },
      select: { id: true, organizationId: true, agentId: true, userId: true, assignedTo: true }
    });
    if (inquiry && !canAgentAccessLead(req, inquiry)) {
      return res.status(403).json({ error: 'Forbidden: Cross-tenant reminder update denied' });
    }

    const updated = await prisma.followUpReminder.update({
      where: { id: reminderId as string },
      data: {
        status: status || undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        notes: notes || undefined,
        completedAt: status === 'COMPLETED' ? new Date() : undefined
      }
    });

    if (status === 'COMPLETED') {
      await prisma.leadActivity.create({
        data: {
          inquiryId: existing.inquiryId,
          type: 'REMINDER_COMPLETED',
          title: `Follow-up completed: ${existing.title}`,
          description: `Marked completed by ${req.user?.name || req.user?.email}`,
          performedBy: req.user?.name || req.user?.email
        }
      });
    }

    const ioRef = (req as any).io || io;
    const targetUserIds = collectLeadTargetUserIds(inquiry);
    realtimeBus.publish('reminder-updated', { inquiryId: existing.inquiryId, reminder: updated }, {
      io: ioRef,
      tenantId: inquiry?.organizationId || null,
      userIds: targetUserIds
    });

    res.json(updated);
  } catch (error) {
    console.error('updateReminder error:', error);
    res.status(500).json({ error: 'Failed to update reminder' });
  }
};

/**
 * GET /api/crm/reminders/pending
 * Retrieve agent's pending & overdue follow-ups scoped by tenant
 */
export const getPendingReminders = async (req: AuthRequest, res: Response) => {
  try {
    const userEmail = req.user?.email;
    const employeeCode = req.user?.employeeCode || (req.user as any)?.code;
    const role = req.user?.role;

    const where: any = {
      status: 'PENDING'
    };

    if (role !== 'admin' && role !== 'operations') {
      const orClauses: any[] = [];
      if (userEmail) orClauses.push({ assignedTo: userEmail });
      if (employeeCode) orClauses.push({ assignedTo: employeeCode });
      if (orClauses.length > 0) {
        where.OR = orClauses;
      } else {
        where.id = '__no_matching_assignee__';
      }
    }

    const reminders = await prisma.followUpReminder.findMany({
      where,
      include: {
        inquiry: {
          select: {
            id: true,
            customerName: true,
            phone: true,
            destination: true,
            leadStage: true,
            priority: true,
            leadScore: true,
            organizationId: true
          }
        }
      },
      orderBy: { dueDate: 'asc' }
    });

    const now = new Date();
    const scoped = reminders.filter((r: any) => !r.inquiry || canAccessTenantRecord(req, r.inquiry.organizationId));
    const categorized = scoped.map(r => ({
      ...r,
      isOverdue: new Date(r.dueDate) < now
    }));

    res.json(categorized);
  } catch (error) {
    console.error('getPendingReminders error:', error);
    res.status(500).json({ error: 'Failed to fetch pending reminders' });
  }
};

/**
 * GET /api/crm/leads/:id/duplicates
 * Intelligent duplicate lead detection (tenant-scoped)
 */
export const checkDuplicateLeads = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const current = await prisma.inquiry.findUnique({ where: { id: id as string } });
    if (!current) return res.status(404).json({ error: 'Lead not found' });
    if (!canAgentAccessLead(req, current)) {
      return res.status(403).json({ error: 'Forbidden: Cross-tenant duplicate check denied' });
    }

    const normalizedPhone = normalizePhone(current.phone);
    const matchConditions: any[] = [];
    if (normalizedPhone.length >= 10) matchConditions.push({ phone: { contains: normalizedPhone } });
    if (current.email && current.email.includes('@')) {
      matchConditions.push({ email: { equals: current.email, mode: 'insensitive' as const } });
    }

    if (matchConditions.length === 0) {
      return res.json({ count: 0, hasDuplicates: false, duplicates: [] });
    }

    // Look for matching phone (last 10 digits) or matching email within tenant & role scope, excluding self
    const roleFilter = buildCrmRoleWhere(req);
    const dupBaseWhere: any = {
      ...roleFilter,
      id: { not: current.id },
      AND: [
        ...(Array.isArray((roleFilter as any).AND) ? (roleFilter as any).AND : []),
        { OR: matchConditions }
      ]
    };
    const potentialDuplicates = await prisma.inquiry.findMany({
      where: withStrictTenantScope(dupBaseWhere, req.tenantId),
      select: {
        id: true,
        leadId: true,
        customerName: true,
        email: true,
        phone: true,
        destination: true,
        leadStage: true,
        createdAt: true,
        netPrice: true
      }
    });

    res.json({
      count: potentialDuplicates.length,
      hasDuplicates: potentialDuplicates.length > 0,
      duplicates: potentialDuplicates
    });
  } catch (error) {
    console.error('checkDuplicateLeads error:', error);
    res.status(500).json({ error: 'Failed to check duplicates' });
  }
};

/**
 * POST /api/crm/leads/:id/merge
 * Merge duplicate lead into master lead
 */
export const mergeDuplicateLead = async (req: AuthRequest, res: Response) => {
  const { id } = req.params; // Master lead ID
  const { duplicateLeadId } = req.body;

  if (!duplicateLeadId) {
    return res.status(400).json({ error: 'duplicateLeadId is required' });
  }

  try {
    const master = await prisma.inquiry.findUnique({ where: { id: id as string } });
    const duplicate = await prisma.inquiry.findUnique({ where: { id: duplicateLeadId } });

    if (!master || !duplicate) {
      return res.status(404).json({ error: 'One or both leads not found' });
    }
    if (!canAgentAccessLead(req, master) || !canAgentAccessLead(req, duplicate)) {
      return res.status(403).json({ error: 'Forbidden: Cross-tenant lead merge denied' });
    }

    // Re-link notes, reminders, activities, and messages to master lead
    await prisma.$transaction([
      prisma.leadNote.updateMany({
        where: { inquiryId: duplicate.id },
        data: { inquiryId: master.id }
      }),
      prisma.followUpReminder.updateMany({
        where: { inquiryId: duplicate.id },
        data: { inquiryId: master.id }
      }),
      prisma.whatsAppMessage.updateMany({
        where: { inquiryId: duplicate.id },
        data: { inquiryId: master.id }
      }),
      prisma.inquiry.update({
        where: { id: duplicate.id },
        data: {
          status: 'Lost',
          leadStage: 'CANCELLED',
          duplicateOfId: master.id,
          notes: `[Merged into ${master.leadId || master.id}] ${duplicate.notes || ''}`
        }
      }),
      prisma.leadActivity.create({
        data: {
          inquiryId: master.id,
          type: 'LEAD_MERGED',
          title: `Merged duplicate lead ${duplicate.leadId || duplicate.id}`,
          description: `Combined customer interactions from duplicate inquiry created on ${new Date(duplicate.createdAt).toLocaleDateString()}`,
          performedBy: req.user?.name || req.user?.email || 'Agent'
        }
      })
    ]);

    res.json({ success: true, message: `Successfully merged lead ${duplicate.id} into ${master.id}` });
  } catch (error) {
    console.error('mergeDuplicateLead error:', error);
    res.status(500).json({ error: 'Failed to merge leads' });
  }
};

/**
 * POST /api/crm/leads/:id/assign
 * Assign or reassign lead to sales agent or B2B partner
 */
export const assignLead = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { agentEmail, agentName } = req.body;

  if (!agentEmail) {
    return res.status(400).json({ error: 'agentEmail is required' });
  }

  try {
    const inquiry = await prisma.inquiry.findUnique({ where: { id: id as string } });
    if (!inquiry) return res.status(404).json({ error: 'Lead not found' });
    if (!canAgentAccessLead(req, inquiry)) {
      return res.status(403).json({ error: 'Forbidden: Cross-tenant lead assignment denied' });
    }

    const previousAgent = inquiry.assignedTo || 'Unassigned';

    const [updated, activity] = await prisma.$transaction([
      prisma.inquiry.update({
        where: { id: id as string },
        data: { assignedTo: agentEmail }
      }),
      prisma.leadActivity.create({
        data: {
          inquiryId: id as string,
          type: 'AGENT_ASSIGNED',
          title: `Lead assigned to ${agentName || agentEmail}`,
          description: `Reassigned from ${previousAgent} to ${agentName || agentEmail}`,
          performedBy: req.user?.name || req.user?.email || 'Manager'
        }
      })
    ]);

    const notification = await prisma.notification
      .create({
        data: {
          userId: buildTenantNotificationUserId((inquiry as any).organizationId || (req as any).tenantId || null),
          title: 'Lead Reassigned',
          message: `${inquiry.customerName} assigned to ${agentName || agentEmail}`,
          type: 'inquiry',
          priority: 'medium',
          link: `/sales/portal?tab=active-pipeline&inquiryId=${id}`,
          read: false
        }
      })
      .catch(() => null);

    const ioRef = (req as any).io || io;
    const tenantId = (inquiry as any).organizationId || (req.user as any)?.organizationId || null;
    const targetUserIds = collectLeadTargetUserIds(updated);
    realtimeBus.publish('lead-assigned', {
      inquiryId: id,
      assignedTo: agentEmail,
      assignedName: agentName || agentEmail,
      customerName: inquiry.customerName,
      destination: inquiry.destination,
      lead: updated,
      organizationId: tenantId
    }, { io: ioRef, tenantId, userIds: targetUserIds });

    realtimeBus.publish('ACTIVITY_LOGGED', { ...activity, inquiry: updated }, { io: ioRef, tenantId, userIds: targetUserIds });
    realtimeBus.publish('new-system-event', {
      type: 'LEAD_ASSIGNED',
      message: `${inquiry.customerName} assigned to ${agentName || agentEmail}`,
      booking: { ...updated, entityType: 'inquiry' },
      notification,
      timestamp: new Date().toISOString()
    }, { io: ioRef, tenantId, userIds: targetUserIds });

    res.json(updated);
  } catch (error) {
    console.error('assignLead error:', error);
    res.status(500).json({ error: 'Failed to assign lead' });
  }
};

/**
 * GET /api/crm/bi/metrics
 * Executive Business Intelligence & Sales Pipeline Analytics
 * Strictly scoped by tenant AND agent ownership when caller role is 'agent'.
 */
export const getCRMBIMetrics = async (req: AuthRequest, res: Response) => {
  try {
    const roleWhere = buildCrmRoleWhere(req);
    const allInquiries = await prisma.inquiry.findMany({
      where: withStrictTenantScope(roleWhere, req.tenantId),
      select: {
        id: true,
        leadStage: true,
        netPrice: true,
        budget: true,
        destination: true,
        leadScore: true,
        sentiment: true,
        priority: true,
        assignedTo: true,
        createdAt: true,
        updatedAt: true
      }
    });

    const totalInquiries = allInquiries.length;
    let totalPipelineValue = 0;
    let confirmedRevenue = 0;
    const stageCounts: Record<string, number> = {
      NEW_LEAD: 0,
      CLAIMED: 0,
      FOLLOW_UP: 0,
      QUOTE_SENT: 0,
      NEGOTIATION: 0,
      PAYMENT_PENDING: 0,
      CONFIRMED: 0,
      COMPLETED: 0,
      CANCELLED: 0,
      LOST: 0
    };
    const destinationStats: Record<string, number> = {};
    const agentStats: Record<string, { total: number; confirmed: number; revenue: number }> = {};

    allInquiries.forEach(inq => {
      const rawStage = String(inq.leadStage || 'NEW_LEAD').trim().toUpperCase();
      const stage = rawStage === 'QUOTED' ? 'QUOTE_SENT' : rawStage;
      stageCounts[stage] = (stageCounts[stage] || 0) + 1;

      const price = getLeadValueINR(inq);
      if (stage === 'CONFIRMED' || stage === 'COMPLETED') {
        confirmedRevenue += price;
      } else if (stage !== 'CANCELLED' && stage !== 'LOST') {
        totalPipelineValue += price;
      }

      // Destination grouping
      const dest = inq.destination?.split(',')[0]?.trim() || 'Kashmir';
      destinationStats[dest] = (destinationStats[dest] || 0) + 1;

      // Agent breakdown
      const agent = inq.assignedTo || 'Unassigned';
      if (!agentStats[agent]) {
        agentStats[agent] = { total: 0, confirmed: 0, revenue: 0 };
      }
      agentStats[agent].total += 1;
      if (stage === 'CONFIRMED' || stage === 'COMPLETED') {
        agentStats[agent].confirmed += 1;
        agentStats[agent].revenue += price;
      }
    });

    const confirmedCount = (stageCounts.CONFIRMED || 0) + (stageCounts.COMPLETED || 0);
    const overallConversionRate = totalInquiries > 0 
      ? Number(((confirmedCount / totalInquiries) * 100).toFixed(1)) 
      : 0;

    res.json({
      totalInquiries,
      totalPipelineValue,
      confirmedRevenue,
      confirmedCount,
      overallConversionRate,
      stageCounts,
      destinationStats,
      agentPerformance: Object.entries(agentStats).map(([agent, data]) => ({
        agent,
        ...data,
        conversionRate: data.total > 0 ? Number(((data.confirmed / data.total) * 100).toFixed(1)) : 0
      }))
    });
  } catch (error) {
    console.error('getCRMBIMetrics error:', error);
    res.status(500).json({ error: 'Failed to calculate CRM metrics' });
  }
};
