import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import prisma from '../lib/prisma';
import { io } from '../index';
import { withStrictTenantScope, canAccessTenantRecord } from '../lib/tenant';

// Helper: Normalize phone to 10 digits for duplicate matching
function normalizePhone(phone: string): string {
  const digits = (phone || '').replace(/[^0-9]/g, '');
  return digits.length > 10 ? digits.slice(-10) : digits;
}

/**
 * GET /api/crm/leads
 * Comprehensive lead retrieval with multi-dimensional filtering and search
 */
export const getCRMLeads = async (req: AuthRequest, res: Response) => {
  try {
    const role = req.user?.role;
    const userEmail = req.user?.email;
    const employeeCode = req.user?.employeeCode;

    const { 
      stage, 
      category, 
      priority, 
      sentiment, 
      search, 
      assignedTo,
      startDate,
      endDate
    } = req.query;

    const where: any = {};

    // Role-based visibility
    if (role === 'admin' || role === 'operations' || role === 'finance') {
      if (assignedTo && assignedTo !== 'ALL') {
        where.assignedTo = assignedTo as string;
      }
    } else if (role === 'agent') {
      // B2B agent sees their own agency inquiries + assigned leads
      where.OR = [
        { agentId: req.user.id },
        { assignedTo: userEmail },
        { assignedTo: employeeCode || undefined }
      ];
    } else {
      // Standard sales agent
      where.OR = [
        { assignedTo: userEmail },
        { assignedTo: employeeCode || undefined },
        { email: userEmail }
      ];
    }

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

    const inquiries = await prisma.inquiry.findMany({
      where: withStrictTenantScope(where, req.tenantId),
      include: {
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
      },
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
    if (!canAccessTenantRecord(req, lead.organizationId)) {
      return res.status(403).json({ error: 'Forbidden: Cross-tenant lead access denied' });
    }

    res.json(lead);
  } catch (error) {
    console.error('getLeadDetail error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * PATCH /api/crm/leads/:id/stage
 * Drag & Drop or manual Kanban stage update with atomic activity logging & Socket broadcast
 */
export const updateLeadStage = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { leadStage, priority, assignedTo, budget, destination, duration, sentiment } = req.body;

  try {
    const inquiry = await prisma.inquiry.findUnique({ where: { id: id as string } });
    if (!inquiry) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    if (!canAccessTenantRecord(req, inquiry.organizationId)) {
      return res.status(403).json({ error: 'Forbidden: Cross-tenant lead update denied' });
    }

    // Map leadStage to legacy status value for cross-compatibility
    let status = inquiry.status;
    if (leadStage) {
      switch (leadStage) {
        case 'NEW_LEAD': status = 'New'; break;
        case 'FOLLOW_UP': status = 'Pending Curation'; break;
        case 'QUOTE_SENT': status = 'Ready for Review'; break;
        case 'NEGOTIATION': status = 'Ready for Review'; break;
        case 'CONFIRMED': status = 'Booked'; break;
        case 'CANCELLED': status = 'Lost'; break;
        default: status = inquiry.status;
      }
    }

    const previousStage = inquiry.leadStage;

    // Use transaction to ensure inquiry update, activity log, and audit log commit together
    const [updated] = await prisma.$transaction([
      prisma.inquiry.update({
        where: { id: id as string },
        data: {
          leadStage: leadStage || undefined,
          status,
          priority: priority || undefined,
          assignedTo: assignedTo || undefined,
          budget: budget || undefined,
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

    // Real-time synchronization across Admin Room, Tenant Desks & Global Network
    if (io) {
      const leadPayload = {
        inquiryId: id,
        customerName: updated.customerName,
        newStage: leadStage,
        updatedLead: updated
      };

      io.emit('lead-updated', leadPayload);
      io.to('admin-room').emit('new-system-event', {
        type: 'LEAD_STAGE_UPDATED',
        inquiry: updated,
        message: `${updated.customerName} transitioned to ${leadStage?.replace(/_/g, ' ')}`
      });

      const tenantId = (updated as any).organizationId || (req.user as any)?.organizationId;
      if (tenantId) {
        io.to(`tenant-${tenantId}`).emit('lead-updated', leadPayload);
        io.to(`tenant-${tenantId}`).emit('new-system-event', {
          type: 'LEAD_STAGE_UPDATED',
          inquiry: updated,
          message: `${updated.customerName} transitioned to ${leadStage?.replace(/_/g, ' ')}`
        });
      }
    }

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
    const authorName = req.user?.name || req.user?.email || 'Team Member';
    const authorId = req.user?.id || null;

    const [note] = await prisma.$transaction([
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

    if (io) {
      io.emit('lead-note-added', { inquiryId: id, note });
    }

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

    // Allow author or admin
    if (note.authorId && note.authorId !== req.user?.id && req.user?.role !== 'admin') {
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
    const parsedDueDate = new Date(dueDate);
    const assignedTo = req.user?.email || req.user?.employeeCode || null;

    const [reminder] = await prisma.$transaction([
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

    if (io) {
      io.emit('reminder-scheduled', { inquiryId: id, reminder });
    }

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

    res.json(updated);
  } catch (error) {
    console.error('updateReminder error:', error);
    res.status(500).json({ error: 'Failed to update reminder' });
  }
};

/**
 * GET /api/crm/reminders/pending
 * Retrieve agent's pending & overdue follow-ups
 */
export const getPendingReminders = async (req: AuthRequest, res: Response) => {
  try {
    const userEmail = req.user?.email;
    const employeeCode = req.user?.employeeCode;
    const role = req.user?.role;

    const where: any = {
      status: 'PENDING'
    };

    if (role !== 'admin' && role !== 'operations') {
      where.OR = [
        { assignedTo: userEmail },
        { assignedTo: employeeCode || undefined }
      ];
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
            leadScore: true
          }
        }
      },
      orderBy: { dueDate: 'asc' }
    });

    const now = new Date();
    const categorized = reminders.map(r => ({
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
 * Intelligent duplicate lead detection
 */
export const checkDuplicateLeads = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const current = await prisma.inquiry.findUnique({ where: { id: id as string } });
    if (!current) return res.status(404).json({ error: 'Lead not found' });

    const normalizedPhone = normalizePhone(current.phone);

    // Look for matching phone (last 10 digits) or matching email, excluding self
    const potentialDuplicates = await prisma.inquiry.findMany({
      where: {
        id: { not: current.id },
        OR: [
          ...(normalizedPhone.length >= 10 ? [{ phone: { contains: normalizedPhone } }] : []),
          ...(current.email && current.email.includes('@') ? [{ email: { equals: current.email, mode: 'insensitive' as const } }] : [])
        ]
      },
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
    })
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

    const previousAgent = inquiry.assignedTo || 'Unassigned';

    const [updated] = await prisma.$transaction([
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

    if (io) {
      io.emit('lead-assigned', {
        inquiryId: id,
        assignedTo: agentEmail,
        customerName: inquiry.customerName,
        destination: inquiry.destination
      });
    }

    res.json(updated);
  } catch (error) {
    console.error('assignLead error:', error);
    res.status(500).json({ error: 'Failed to assign lead' });
  }
};

/**
 * GET /api/crm/bi/metrics
 * Executive Business Intelligence & Sales Pipeline Analytics
 */
export const getCRMBIMetrics = async (req: AuthRequest, res: Response) => {
  try {
    const allInquiries = await prisma.inquiry.findMany({
      where: withStrictTenantScope({}, req.tenantId),
      select: {
        id: true,
        leadStage: true,
        netPrice: true,
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
      FOLLOW_UP: 0,
      QUOTE_SENT: 0,
      NEGOTIATION: 0,
      PAYMENT_PENDING: 0,
      CONFIRMED: 0,
      COMPLETED: 0,
      CANCELLED: 0
    };
    const destinationStats: Record<string, number> = {};
    const agentStats: Record<string, { total: number; confirmed: number; revenue: number }> = {};

    allInquiries.forEach(inq => {
      const stage = inq.leadStage || 'NEW_LEAD';
      stageCounts[stage] = (stageCounts[stage] || 0) + 1;

      const price = inq.netPrice || 0;
      if (stage === 'CONFIRMED' || stage === 'COMPLETED') {
        confirmedRevenue += price;
      } else if (stage !== 'CANCELLED') {
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
