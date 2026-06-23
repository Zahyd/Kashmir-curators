import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import prisma from '../lib/prisma';

export const getCRMLeads = async (req: AuthRequest, res: Response) => {
  try {
    const role = req.user.role;
    const email = req.user.email;

    let inquiries;
    if (role === 'admin' || role === 'operations' || role === 'finance') {
      inquiries = await prisma.inquiry.findMany({
        orderBy: { updatedAt: 'desc' },
      });
    } else {
      // Sales user or customer
      inquiries = await prisma.inquiry.findMany({
        where: {
          OR: [
            { assignedTo: (req.user.employeeCode as string) || undefined },
            { email: email }
          ]
        },
        orderBy: { updatedAt: 'desc' },
      });
    }

    res.json(inquiries);
  } catch (error) {
    console.error('getCRMLeads error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateLeadStage = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { leadStage, priority, assignedTo, budget, destination, duration } = req.body;

  try {
    const inquiry = await prisma.inquiry.findUnique({ where: { id: id as string } });
    if (!inquiry) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    // Map leadStage to legacy status value to sync dashboards
    let status = inquiry.status;
    if (leadStage) {
      switch (leadStage) {
        case 'NEW_LEAD':
          status = 'New';
          break;
        case 'FOLLOW_UP':
          status = 'Pending Curation';
          break;
        case 'QUOTE_SENT':
          status = 'Ready for Review';
          break;
        case 'CONFIRMED':
          status = 'Booked';
          break;
        case 'CANCELLED':
          status = 'Lost';
          break;
        default:
          status = inquiry.status;
      }
    }

    const updated = await prisma.inquiry.update({
      where: { id: id as string },
      data: {
        leadStage: leadStage || undefined,
        status,
        priority: priority || undefined,
        assignedTo: assignedTo || undefined,
        budget: budget || undefined,
        destination: destination || undefined,
        duration: duration || undefined
      }
    });

    // Write to AuditLog
    await prisma.auditLog.create({
      data: {
        userId: (req.user.id as string) || 'system',
        action: 'UPDATE_LEAD_STAGE',
        details: JSON.stringify({
          inquiryId: id,
          oldStage: inquiry.leadStage,
          newStage: leadStage,
          oldStatus: inquiry.status,
          newStatus: status
        })
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('updateLeadStage error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
