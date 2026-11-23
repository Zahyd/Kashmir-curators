import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import prisma from '../lib/prisma';
import { io } from '../index';

/**
 * POST /api/agents/apply
 * Dedicated Multi-Step Agency Onboarding Application Submission (Public)
 */
export const submitAgencyApplication = async (req: Request, res: Response): Promise<any> => {
  const {
    agencyName,
    authorizedPerson,
    email,
    phone,
    location,
    websiteOrSocial,
    businessCategory = 'TOUR_OPERATOR',
    tourismLicenseNo,
    gstin,
    documentUrl,
    selectedPlan = 'STARTER',
    billingCycle = 'MONTHLY',
    userId
  } = req.body;

  if (!agencyName || !authorizedPerson || !email || !phone || !location) {
    return res.status(400).json({ error: 'Agency name, contact person, email, phone, and location are required.' });
  }

  try {
    const year = new Date().getFullYear();
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const applicationRef = `KCB2B-${year}-${randomCode}`;

    const application = await prisma.agencyApplication.create({
      data: {
        applicationRef,
        agencyName: agencyName.trim(),
        authorizedPerson: authorizedPerson.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        location: location.trim(),
        websiteOrSocial: websiteOrSocial?.trim() || null,
        businessCategory,
        tourismLicenseNo: tourismLicenseNo?.trim() || null,
        gstin: gstin?.trim() || null,
        documentUrl: documentUrl || null,
        selectedPlan,
        billingCycle,
        userId: userId || null,
        status: 'SUBMITTED'
      }
    });

    // Notify Operations / Admin room via WebSockets
    if (io) {
      io.to('admin-room').emit('new-system-event', {
        type: 'AGENCY_APPLICATION_SUBMITTED',
        application,
        message: `New Agency Application received: ${agencyName} (${location}) by ${authorizedPerson}`
      });
    }

    res.status(201).json({
      success: true,
      message: 'Agency application submitted successfully. Verification review is underway.',
      applicationRef,
      application
    });
  } catch (error: any) {
    console.error('submitAgencyApplication error:', error);
    res.status(500).json({ error: 'Failed to submit agency application. Please try again.' });
  }
};

/**
 * GET /api/agents/application-status/:query
 * Check real-time application status by reference number or email (Public)
 */
export const getApplicationStatus = async (req: Request, res: Response): Promise<any> => {
  const { query } = req.params;

  if (!query) {
    return res.status(400).json({ error: 'Application reference or email is required' });
  }

  try {
    const cleanQuery = decodeURIComponent(query as string).trim();

    const application = await prisma.agencyApplication.findFirst({
      where: {
        OR: [
          { applicationRef: { equals: cleanQuery, mode: 'insensitive' } },
          { email: { equals: cleanQuery.toLowerCase(), mode: 'insensitive' } },
          { phone: { contains: cleanQuery.replace(/[^0-9]/g, '').slice(-10) } }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!application) {
      return res.status(404).json({ error: 'No agency application found matching those details.' });
    }

    res.json(application);
  } catch (error) {
    console.error('getApplicationStatus error:', error);
    res.status(500).json({ error: 'Failed to look up application status' });
  }
};

/**
 * GET /api/agents/applications
 * Admin review: list all submitted agency applications
 */
export const getApplications = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { status } = req.query;
    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status as string;
    }

    const applications = await prisma.agencyApplication.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    res.json(applications);
  } catch (error) {
    console.error('getApplications error:', error);
    res.status(500).json({ error: 'Failed to list applications' });
  }
};

/**
 * PATCH /api/agents/applications/:id/review
 * Admin review: approve, reject, or request documents
 */
export const reviewApplication = async (req: AuthRequest, res: Response): Promise<any> => {
  const { id } = req.params;
  const { status, adminRemarks, commissionPct = 10.0 } = req.body;

  try {
    const application = await prisma.agencyApplication.findUnique({ where: { id: id as string } });
    if (!application) return res.status(404).json({ error: 'Application not found' });

    const updated = await prisma.agencyApplication.update({
      where: { id: id as string },
      data: {
        status,
        adminRemarks: adminRemarks || undefined,
        reviewedAt: new Date()
      }
    });

    // If APPROVED and linked to a User, provision their AgentProfile & role
    if (status === 'APPROVED' && application.userId) {
      const agentCode = `AGT-${application.agencyName.toUpperCase().replace(/\s+/g, '-').slice(0, 8)}-${Math.floor(1000 + Math.random() * 9000)}`;

      await prisma.user.update({
        where: { id: application.userId },
        data: { role: 'agent' }
      });

      await prisma.agentProfile.upsert({
        where: { userId: application.userId },
        update: {
          companyName: application.agencyName,
          licenseNumber: application.tourismLicenseNo,
          commissionPct: parseFloat(String(commissionPct)) || 10.0,
          status: 'APPROVED',
          plan: application.selectedPlan,
          billingCycle: application.billingCycle,
          applicationRef: application.applicationRef
        },
        create: {
          userId: application.userId,
          companyName: application.agencyName,
          licenseNumber: application.tourismLicenseNo,
          agentCode,
          commissionPct: parseFloat(String(commissionPct)) || 10.0,
          status: 'APPROVED',
          plan: application.selectedPlan,
          billingCycle: application.billingCycle,
          applicationRef: application.applicationRef
        }
      });
    }

    res.json({ success: true, application: updated });
  } catch (error) {
    console.error('reviewApplication error:', error);
    res.status(500).json({ error: 'Failed to review application' });
  }
};

export const registerAgent = async (req: AuthRequest, res: Response) => {
  const { companyName, licenseNumber, commissionPct } = req.body;
  try {
    const userId = req.user.id;
    
    // Generate agent code
    const agentCode = `AGT-${companyName.toUpperCase().replace(/\s+/g, '-').slice(0, 8)}-${Math.floor(1000 + Math.random() * 9000)}`;

    const profile = await prisma.agentProfile.upsert({
      where: { userId },
      update: {
        companyName,
        licenseNumber,
        commissionPct: parseFloat(commissionPct) || 0.0,
      },
      create: {
        userId,
        companyName,
        licenseNumber,
        agentCode,
        commissionPct: parseFloat(commissionPct) || 0.0,
        status: 'PENDING'
      }
    });

    // Update user role to agent
    await prisma.user.update({
      where: { id: userId },
      data: { role: 'agent' }
    });

    res.status(201).json({ message: 'B2B Agent profile submitted and pending verification.', profile });
  } catch (error) {
    console.error('registerAgent error:', error);
    res.status(500).json({ error: 'Failed to submit agent profile.' });
  }
};

export const getAgents = async (req: AuthRequest, res: Response) => {
  try {
    const agents = await prisma.agentProfile.findMany({
      include: {
        user: {
          select: { name: true, email: true, phone: true }
        }
      }
    });
    res.json(agents);
  } catch (error) {
    console.error('getAgents error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const verifyAgent = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status, commissionPct } = req.body; // APPROVED, REJECTED
  try {
    const updated = await prisma.agentProfile.update({
      where: { id: id as string },
      data: {
        status,
        commissionPct: commissionPct !== undefined ? parseFloat(commissionPct) : undefined
      }
    });
    
    // Log verification action
    await prisma.auditLog.create({
      data: {
        userId: req.user.id as string,
        action: 'VERIFY_AGENT',
        details: JSON.stringify({ agentProfileId: id, status, commissionPct })
      }
    });

    res.json({ message: `Agent status updated to ${status}`, updated });
  } catch (error) {
    console.error('verifyAgent error:', error);
    res.status(500).json({ error: 'Failed to verify agent.' });
  }
};

export const getAgentStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;
    // Get agent inquiries
    const inquiries = await prisma.inquiry.findMany({
      where: { agentId: userId }
    });

    const bookings = await prisma.booking.findMany({
      where: { userId }
    });

    const profile = await prisma.agentProfile.findUnique({
      where: { userId }
    });

    const totalRevenue = bookings.reduce((sum, b) => sum + b.totalAmount, 0);
    
    res.json({
      inquiriesCount: inquiries.length,
      bookingsCount: bookings.length,
      totalRevenue,
      commissionEarned: totalRevenue * 0.10,
      profile
    });
  } catch (error) {
    console.error('getAgentStats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
