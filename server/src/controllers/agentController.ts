import crypto from 'crypto';
import dns from 'dns';
import { NextFunction, Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import prisma from '../lib/prisma';
import { realtimeBus } from '../lib/realtimeBus';
import { DEFAULT_TENANT_ID, withTenantScope } from '../lib/tenant';
import { resolvePreservedPartnerRole } from '../lib/roleUtils';

const CNAME_TARGET = 'cname.kashmircurators.vercel.app';

export interface AgencyBrandingConfig {
  agencyName: string;
  agencyTagline: string;
  logoUrl: string;
  primaryColor: string;
  phone: string;
  website: string;
}

export interface AgencySeatRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'CONCIERGE' | 'OPS_COORDINATOR' | 'SALES_MANAGER';
  code: string;
  isOnline: boolean;
  joinedAt: string;
}

export interface AgencyDomainConfig {
  domain: string;
  status: 'NOT_CONFIGURED' | 'PENDING' | 'VERIFIED' | 'FAILED';
  cnameTarget: string;
  lastCheckedAt: string | null;
  lastError: string | null;
}

interface ParsedOrgSettings {
  branding?: Partial<AgencyBrandingConfig>;
  teamSeats?: AgencySeatRecord[];
  apiKey?: string;
  apiKeyUpdatedAt?: string;
  customDomain?: Partial<AgencyDomainConfig>;
  creditLimit?: number;
  rateHolds?: Array<Record<string, any>>;
  [key: string]: any;
}

function normalizePlan(plan?: string | null): 'STARTER' | 'PRO_DMC' | 'ENTERPRISE' {
  const upper = String(plan || 'STARTER').trim().toUpperCase();
  if (upper === 'ENTERPRISE') return 'ENTERPRISE';
  if (upper === 'PRO_DMC' || upper === 'PROFESSIONAL') return 'PRO_DMC';
  return 'STARTER';
}

function parseOrgSettings(raw: string | null | undefined): ParsedOrgSettings {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function getSeatLimitForPlan(plan: 'STARTER' | 'PRO_DMC' | 'ENTERPRISE'): number | null {
  if (plan === 'ENTERPRISE') return null;
  if (plan === 'PRO_DMC') return 3;
  return 1;
}

function getLeadLimitForPlan(plan: 'STARTER' | 'PRO_DMC' | 'ENTERPRISE'): number | null {
  return plan === 'STARTER' ? 15 : null;
}

function escapeXml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function getInquiryValueINR(inq: { netPrice?: number | null; budget?: string | number | null }): number {
  if (inq.netPrice && Number(inq.netPrice) > 0) return Number(inq.netPrice);
  const digits = String(inq.budget || '').replace(/[^0-9]/g, '');
  if (!digits) return 0;
  const parsed = parseInt(digits, 10);
  return isNaN(parsed) || parsed < 500 ? 0 : parsed;
}

async function resolveAgentWorkspace(userId: string, createOrgIfMissing = false) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  let profile = await prisma.agentProfile.findUnique({ where: { userId } });
  const orgIdCandidates = [user.organizationId, profile?.organizationId].filter(
    (id): id is string => Boolean(id && id !== DEFAULT_TENANT_ID)
  );
  let org =
    orgIdCandidates.length > 0
      ? await prisma.organization.findUnique({ where: { id: orgIdCandidates[0] } })
      : null;

  if (!org && createOrgIfMissing) {
    const baseName = profile?.companyName || (user.name ? `${user.name} Travels` : 'Kashmir B2B Partner');
    const slugBase = baseName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'partner';
    const uniqueSlug = `${slugBase}-${crypto.randomBytes(2).toString('hex')}`;
    const plan = normalizePlan(profile?.plan);

    org = await prisma.organization.create({
      data: {
        name: baseName,
        slug: uniqueSlug,
        type: 'AGENCY',
        status: 'ACTIVE',
        tier: plan === 'PRO_DMC' ? 'PROFESSIONAL' : plan,
        email: user.email,
        phone: user.phone || null,
        city: profile?.city || null,
        state: profile?.state || null,
        settings: JSON.stringify({})
      }
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { organizationId: org.id }
    });

    if (profile) {
      profile = await prisma.agentProfile.update({
        where: { id: profile.id },
        data: { organizationId: org.id }
      });
    }
  }

  return { user, profile, org };
}

async function saveOrganizationSettings(orgId: string, updater: (prev: ParsedOrgSettings) => ParsedOrgSettings, extraOrgFields: Record<string, any> = {}) {
  const existing = await prisma.organization.findUnique({ where: { id: orgId } });
  const prevSettings = parseOrgSettings(existing?.settings);
  const nextSettings = updater(prevSettings);
  const updated = await prisma.organization.update({
    where: { id: orgId },
    data: {
      ...extraOrgFields,
      settings: JSON.stringify(nextSettings)
    }
  });
  return { organization: updated, settings: nextSettings };
}

function buildAgentInquiryFilter(user: { id: string; email?: string | null; employeeCode?: string | null }) {
  const orClauses: any[] = [{ agentId: user.id }, { userId: user.id }];
  if (user.email) orClauses.push({ assignedTo: user.email });
  if (user.employeeCode) orClauses.push({ assignedTo: user.employeeCode });
  return { OR: orClauses };
}

function publishWorkspaceUpdate(req: AuthRequest, userId: string, tenantId: string | null | undefined, section: string, data: Record<string, any>) {
  const ioRef = realtimeBus.getIo((req as any).io);
  realtimeBus.publish(
    'agent-workspace-updated',
    {
      userId,
      organizationId: tenantId || null,
      section,
      ...data,
      timestamp: new Date().toISOString()
    },
    { io: ioRef, tenantId: tenantId || null, userIds: [userId] }
  );
}

/**
 * Middleware: Bridges query-string JWT for browser EventSource SSE connections
 */
export const sseQueryTokenBridge = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.headers.authorization && typeof req.query.token === 'string' && req.query.token.trim()) {
    req.headers.authorization = `Bearer ${req.query.token.trim()}`;
  }
  next();
};

/**
 * GET /api/agents/stream
 * Authenticated SSE real-time stream strictly scoped to the agent's userId / agency organization
 */
export const streamAgentEvents = (req: AuthRequest, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  const clientId = `agent-sse-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  realtimeBus.addSseClient({
    id: clientId,
    res,
    userId: String(req.user?.id || ''),
    employeeCode: req.user?.employeeCode || req.user?.code,
    role: String(req.user?.role || 'agent'),
    tenantId: req.user?.organizationId || null
  });

  res.write(
    `event: connected\ndata: ${JSON.stringify({
      status: 'AGENT_STREAM_CONNECTED',
      clientId,
      userId: req.user?.id || null,
      tenantId: req.user?.organizationId || null,
      timestamp: new Date().toISOString()
    })}\n\n`
  );

  const heartbeat = setInterval(() => {
    try {
      res.write(`event: heartbeat\ndata: ${JSON.stringify({ ts: Date.now() })}\n\n`);
    } catch {
      clearInterval(heartbeat);
      realtimeBus.removeSseClient(clientId);
    }
  }, 20000);
  if (typeof heartbeat.unref === 'function') heartbeat.unref();

  req.on('close', () => {
    clearInterval(heartbeat);
    realtimeBus.removeSseClient(clientId);
  });
};

/**
 * GET /api/agents/realtime/health
 * Live transport telemetry for Agent Command Desk
 */
export const getAgentRealtimeHealth = (req: AuthRequest, res: Response) => {
  res.json({
    ...realtimeBus.getHealth(),
    userId: req.user?.id || null,
    organizationId: req.user?.organizationId || null,
    timestamp: new Date().toISOString()
  });
};

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

    const ioRef = realtimeBus.getIo((req as any).io);
    realtimeBus.publish(
      'new-system-event',
      {
        type: 'AGENCY_APPLICATION_SUBMITTED',
        application,
        message: `New Agency Application received: ${agencyName} (${location}) by ${authorizedPerson}`
      },
      { io: ioRef, userIds: userId ? [String(userId)] : undefined }
    );

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

    if (status === 'APPROVED' && application.userId) {
      const agentCode = `AGT-${application.agencyName.toUpperCase().replace(/\s+/g, '-').slice(0, 8)}-${Math.floor(1000 + Math.random() * 9000)}`;

      let agencyOrgId: string | null = null;
      try {
        const agencySlug = application.agencyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + `-${Math.floor(100 + Math.random() * 900)}`;
        const createdOrg = await prisma.organization.create({
          data: {
            name: application.agencyName,
            slug: agencySlug,
            type: 'AGENCY',
            tier: application.selectedPlan || 'STARTER',
            status: 'ACTIVE',
            email: application.email,
            phone: application.phone,
            city: application.location,
            settings: JSON.stringify({
              tourismLicenseNo: application.tourismLicenseNo,
              gstin: application.gstin,
              commissionPct: parseFloat(String(commissionPct)) || 10.0
            })
          }
        });
        agencyOrgId = createdOrg.id;
      } catch {
        const existingOrg = await prisma.organization.findFirst({ where: { name: application.agencyName } });
        agencyOrgId = existingOrg?.id || null;
      }

      const existingApplicant = await prisma.user.findUnique({
        where: { id: application.userId },
        select: { role: true }
      });

      await prisma.user.update({
        where: { id: application.userId },
        data: {
          role: resolvePreservedPartnerRole(existingApplicant?.role, 'agent'),
          organizationId: agencyOrgId || undefined
        }
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
          applicationRef: application.applicationRef,
          organizationId: agencyOrgId || undefined
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
          applicationRef: application.applicationRef,
          organizationId: agencyOrgId || undefined
        }
      });

      publishWorkspaceUpdate(req, application.userId, agencyOrgId, 'verification', { status: 'APPROVED' });
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
    const agentCode = `AGT-${String(companyName || 'PARTNER').toUpperCase().replace(/\s+/g, '-').slice(0, 8)}-${Math.floor(1000 + Math.random() * 9000)}`;

    const profile = await prisma.agentProfile.upsert({
      where: { userId },
      update: {
        companyName,
        licenseNumber,
        commissionPct: parseFloat(commissionPct) || 0.0
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

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    await prisma.user.update({
      where: { id: userId },
      data: { role: resolvePreservedPartnerRole(existingUser?.role, 'agent') }
    });

    res.status(201).json({ message: 'B2B Agent profile submitted and pending verification.', profile });
  } catch (error) {
    console.error('registerAgent error:', error);
    res.status(500).json({ error: 'Failed to submit agent profile.' });
  }
};

/**
 * POST /api/agents/verify-license
 * Persists J&K Tourism accreditation submission into AgentProfile + Organization + AuditLog
 */
export const verifyAgentLicense = async (req: AuthRequest, res: Response) => {
  const userId = String(req.user?.id || '');
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { companyName, licenseNumber, association, gstin, officeAddress } = req.body || {};
  if (!licenseNumber || !String(licenseNumber).trim()) {
    return res.status(400).json({ error: 'J&K Tourism License Number is required' });
  }

  try {
    const workspace = await resolveAgentWorkspace(userId, true);
    if (!workspace) return res.status(404).json({ error: 'User not found' });

    const resolvedCompany = String(companyName || workspace.profile?.companyName || workspace.user.name || 'Travel Partner').trim();
    const cleanLicense = String(licenseNumber).trim().toUpperCase();
    const agentCode =
      workspace.profile?.agentCode ||
      `AGT-${resolvedCompany.toUpperCase().replace(/\s+/g, '-').slice(0, 8)}-${Math.floor(1000 + Math.random() * 9000)}`;

    const fileMeta = (req as any).file
      ? {
          fileName: (req as any).file.originalname,
          mimeType: (req as any).file.mimetype,
          size: (req as any).file.size
        }
      : null;

    const profile = await prisma.agentProfile.upsert({
      where: { userId },
      update: {
        companyName: resolvedCompany,
        licenseNumber: cleanLicense,
        organizationId: workspace.org?.id || undefined,
        status: workspace.profile?.status === 'APPROVED' ? 'APPROVED' : 'PENDING'
      },
      create: {
        userId,
        companyName: resolvedCompany,
        licenseNumber: cleanLicense,
        agentCode,
        commissionPct: 10.0,
        status: 'PENDING',
        organizationId: workspace.org?.id || undefined
      }
    });

    if (workspace.org) {
      await saveOrganizationSettings(
        workspace.org.id,
        (prev) => ({
          ...prev,
          tourismLicenseNo: cleanLicense,
          association: association ? String(association).trim() : prev.association,
          gstin: gstin ? String(gstin).trim().toUpperCase() : prev.gstin,
          officeAddress: officeAddress ? String(officeAddress).trim() : prev.officeAddress,
          licenseDocumentMeta: fileMeta || prev.licenseDocumentMeta
        }),
        { name: resolvedCompany, address: officeAddress ? String(officeAddress).trim() : workspace.org.address }
      );
    }

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'AGENT_LICENSE_SUBMITTED',
        details: JSON.stringify({
          agentCode: profile.agentCode,
          licenseNumber: cleanLicense,
          association: association || null,
          gstin: gstin || null,
          hasDocument: Boolean(fileMeta)
        })
      }
    }).catch(() => null);

    publishWorkspaceUpdate(req, userId, workspace.org?.id, 'licensing', { profile });

    res.status(200).json({
      success: true,
      message: 'Accreditation details persisted for J&K Tourism verification.',
      profile
    });
  } catch (error) {
    console.error('verifyAgentLicense error:', error);
    res.status(500).json({ error: 'Failed to persist license verification details.' });
  }
};

export const getAgents = async (_req: AuthRequest, res: Response) => {
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
  const { status, commissionPct } = req.body;
  try {
    const updated = await prisma.agentProfile.update({
      where: { id: id as string },
      data: {
        status,
        commissionPct: commissionPct !== undefined ? parseFloat(commissionPct) : undefined
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id as string,
        action: 'VERIFY_AGENT',
        details: JSON.stringify({ agentProfileId: id, status, commissionPct })
      }
    });

    publishWorkspaceUpdate(req, updated.userId, updated.organizationId, 'verification', { status, profile: updated });
    res.json({ message: `Agent status updated to ${status}`, updated });
  } catch (error) {
    console.error('verifyAgent error:', error);
    res.status(500).json({ error: 'Failed to verify agent.' });
  }
};

/**
 * GET /api/agents/stats
 * Comprehensive live database stats for the Agent Command Desk
 */
export const getAgentStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = String(req.user.id);
    const workspace = await resolveAgentWorkspace(userId, false);
    if (!workspace) return res.status(404).json({ error: 'User not found' });

    const { user, profile, org } = workspace;
    const plan = normalizePlan(profile?.plan || org?.tier);
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [inquiries, bookings] = await Promise.all([
      prisma.inquiry.findMany({ where: buildAgentInquiryFilter(user) }),
      prisma.booking.findMany({ where: { userId } })
    ]);

    const monthlyLeadsUsed = inquiries.filter((inq) => new Date(inq.createdAt) >= monthStart).length;
    const confirmedInquiries = inquiries.filter((i) => i.leadStage === 'CONFIRMED' || i.leadStage === 'COMPLETED');
    const inquiryRevenue = confirmedInquiries.reduce((sum, i) => sum + getInquiryValueINR(i), 0);
    const bookingRevenue = bookings
      .filter((b) => String(b.status).toLowerCase() !== 'cancelled')
      .reduce((sum, b) => sum + Number(b.totalAmount || 0), 0);

    const totalRevenue = bookingRevenue + (bookings.length === 0 ? inquiryRevenue : 0);
    const commissionPct = Number(profile?.commissionPct || 10.0);
    const commissionEarned = Math.round((totalRevenue * commissionPct) / 100);
    const settings = parseOrgSettings(org?.settings);

    const defaultBranding: AgencyBrandingConfig = {
      agencyName: settings.branding?.agencyName || profile?.companyName || org?.name || (user.name ? `${user.name} Travels` : ''),
      agencyTagline: settings.branding?.agencyTagline || 'Verified Kashmir Tour Operator & B2B Partner',
      logoUrl: settings.branding?.logoUrl || org?.logo || '',
      primaryColor: settings.branding?.primaryColor || '#d97706',
      phone: settings.branding?.phone || user.phone || org?.phone || '',
      website: settings.branding?.website || profile?.website || ''
    };

    res.json({
      inquiriesCount: inquiries.length,
      monthlyLeadsUsed,
      leadsLimit: getLeadLimitForPlan(plan),
      bookingsCount: bookings.length,
      confirmedCount: confirmedInquiries.length,
      totalRevenue,
      confirmedRevenue: totalRevenue,
      commissionPct,
      commissionEarned,
      profile,
      organization: org,
      plan,
      branding: defaultBranding,
      customDomain: {
        domain: settings.customDomain?.domain || org?.domain || '',
        status: settings.customDomain?.status || (org?.domain ? 'PENDING' : 'NOT_CONFIGURED'),
        cnameTarget: CNAME_TARGET,
        lastCheckedAt: settings.customDomain?.lastCheckedAt || null,
        lastError: settings.customDomain?.lastError || null
      },
      apiKey: settings.apiKey || null,
      teamSeatsCount: Array.isArray(settings.teamSeats) && settings.teamSeats.length > 0 ? settings.teamSeats.length : 1
    });
  } catch (error) {
    console.error('getAgentStats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/agents/branding & PUT /api/agents/branding
 */
export const getAgentBranding = async (req: AuthRequest, res: Response) => {
  try {
    const workspace = await resolveAgentWorkspace(String(req.user.id), false);
    if (!workspace) return res.status(404).json({ error: 'User not found' });
    const settings = parseOrgSettings(workspace.org?.settings);

    res.json({
      branding: {
        agencyName: settings.branding?.agencyName || workspace.profile?.companyName || workspace.org?.name || `${workspace.user.name} Travels`,
        agencyTagline: settings.branding?.agencyTagline || 'Verified Kashmir Tour Operator & B2B Partner',
        logoUrl: settings.branding?.logoUrl || workspace.org?.logo || '',
        primaryColor: settings.branding?.primaryColor || '#d97706',
        phone: settings.branding?.phone || workspace.user.phone || '',
        website: settings.branding?.website || workspace.profile?.website || ''
      }
    });
  } catch (error) {
    console.error('getAgentBranding error:', error);
    res.status(500).json({ error: 'Failed to load agency branding' });
  }
};

export const updateAgentBranding = async (req: AuthRequest, res: Response) => {
  const userId = String(req.user?.id || '');
  const { agencyName, agencyTagline, logoUrl, primaryColor, phone, website } = req.body || {};

  if (!agencyName || !String(agencyName).trim()) {
    return res.status(400).json({ error: 'Agency name is required' });
  }

  try {
    const workspace = await resolveAgentWorkspace(userId, true);
    if (!workspace || !workspace.org) return res.status(404).json({ error: 'Workspace unavailable' });

    const cleanBranding: AgencyBrandingConfig = {
      agencyName: String(agencyName).trim(),
      agencyTagline: String(agencyTagline || 'Verified Kashmir Tour Operator & B2B Partner').trim(),
      logoUrl: String(logoUrl || '').trim(),
      primaryColor: /^#[0-9a-fA-F]{6}$/.test(String(primaryColor || '')) ? String(primaryColor) : '#d97706',
      phone: String(phone || '').trim(),
      website: String(website || '').trim()
    };

    await saveOrganizationSettings(
      workspace.org.id,
      (prev) => ({ ...prev, branding: cleanBranding }),
      { name: cleanBranding.agencyName, logo: cleanBranding.logoUrl || workspace.org.logo, phone: cleanBranding.phone || workspace.org.phone }
    );

    if (workspace.profile) {
      await prisma.agentProfile.update({
        where: { id: workspace.profile.id },
        data: { companyName: cleanBranding.agencyName, website: cleanBranding.website || undefined }
      });
    }

    publishWorkspaceUpdate(req, userId, workspace.org.id, 'branding', { branding: cleanBranding });
    res.json({ success: true, branding: cleanBranding });
  } catch (error) {
    console.error('updateAgentBranding error:', error);
    res.status(500).json({ error: 'Failed to save agency branding' });
  }
};

/**
 * GET / POST / DELETE /api/agents/team
 * Persists agency team seats in Organization.settings and computes real assigned lead counts from PostgreSQL
 */
export const getAgentTeamSeats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = String(req.user?.id || '');
    const workspace = await resolveAgentWorkspace(userId, false);
    if (!workspace) return res.status(404).json({ error: 'User not found' });

    const plan = normalizePlan(workspace.profile?.plan || workspace.org?.tier);
    const maxSeats = getSeatLimitForPlan(plan);
    const settings = parseOrgSettings(workspace.org?.settings);
    const agentCode = workspace.profile?.agentCode || `AGT-${userId.slice(0, 6).toUpperCase()}`;

    const primarySeat: AgencySeatRecord = {
      id: `owner-${workspace.user.id}`,
      name: workspace.user.name,
      email: workspace.user.email,
      phone: workspace.user.phone || 'Not set',
      role: 'SALES_MANAGER',
      code: agentCode,
      isOnline: Boolean(workspace.user.isOnline),
      joinedAt: new Date(workspace.user.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })
    };

    const storedSeats = Array.isArray(settings.teamSeats) && settings.teamSeats.length > 0
      ? settings.teamSeats
      : [primarySeat];

    const inquiries = await prisma.inquiry.findMany({
      where: buildAgentInquiryFilter(workspace.user),
      select: { id: true, assignedTo: true }
    });

    const enriched = storedSeats.map((seat) => {
      const seatEmail = String(seat.email || '').toLowerCase();
      const seatCode = String(seat.code || '').toLowerCase();
      const assignedLeadsCount = inquiries.filter((inq) => {
        const assignee = String(inq.assignedTo || '').toLowerCase();
        return (assignee && (assignee === seatEmail || assignee === seatCode)) || (seat.id === primarySeat.id && !inq.assignedTo);
      }).length;
      return { ...seat, assignedLeadsCount };
    });

    res.json({ seats: enriched, plan, maxSeats });
  } catch (error) {
    console.error('getAgentTeamSeats error:', error);
    res.status(500).json({ error: 'Failed to fetch team seats' });
  }
};

export const createAgentTeamSeat = async (req: AuthRequest, res: Response) => {
  const userId = String(req.user?.id || '');
  const { name, email, phone, role = 'CONCIERGE' } = req.body || {};

  if (!name || !String(name).trim() || !email || !String(email).trim()) {
    return res.status(400).json({ error: 'Staff name and email are required' });
  }

  try {
    const workspace = await resolveAgentWorkspace(userId, true);
    if (!workspace || !workspace.org) return res.status(404).json({ error: 'Workspace unavailable' });

    const plan = normalizePlan(workspace.profile?.plan || workspace.org.tier);
    const maxSeats = getSeatLimitForPlan(plan);
    const settings = parseOrgSettings(workspace.org.settings);
    const agentCode = workspace.profile?.agentCode || `AGT-${userId.slice(0, 6).toUpperCase()}`;

    const existingSeats: AgencySeatRecord[] = Array.isArray(settings.teamSeats) && settings.teamSeats.length > 0
      ? settings.teamSeats
      : [
          {
            id: `owner-${workspace.user.id}`,
            name: workspace.user.name,
            email: workspace.user.email,
            phone: workspace.user.phone || 'Not set',
            role: 'SALES_MANAGER',
            code: agentCode,
            isOnline: Boolean(workspace.user.isOnline),
            joinedAt: new Date(workspace.user.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })
          }
        ];

    if (maxSeats !== null && existingSeats.length >= maxSeats) {
      return res.status(403).json({
        error: `Seat limit (${maxSeats}) reached for ${plan} plan. Upgrade your subscription to add more seats.`
      });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    if (existingSeats.some((s) => s.email.toLowerCase() === cleanEmail)) {
      return res.status(409).json({ error: 'A team seat with this email already exists' });
    }

    const allowedRoles = new Set(['CONCIERGE', 'OPS_COORDINATOR', 'SALES_MANAGER']);
    const normalizedRole = allowedRoles.has(String(role).toUpperCase())
      ? (String(role).toUpperCase() as AgencySeatRecord['role'])
      : 'CONCIERGE';

    const newSeat: AgencySeatRecord = {
      id: `seat-${crypto.randomBytes(4).toString('hex')}`,
      name: String(name).trim(),
      email: cleanEmail,
      phone: String(phone || '').trim() || 'Not set',
      role: normalizedRole,
      code: `${agentCode.slice(0, 8)}-S${existingSeats.length + 1}`,
      isOnline: false,
      joinedAt: new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })
    };

    const updatedSeats = [...existingSeats, newSeat];
    await saveOrganizationSettings(workspace.org.id, (prev) => ({ ...prev, teamSeats: updatedSeats }));
    publishWorkspaceUpdate(req, userId, workspace.org.id, 'team', { seats: updatedSeats });

    res.status(201).json({ seat: { ...newSeat, assignedLeadsCount: 0 }, seats: updatedSeats });
  } catch (error) {
    console.error('createAgentTeamSeat error:', error);
    res.status(500).json({ error: 'Failed to provision team seat' });
  }
};

export const deleteAgentTeamSeat = async (req: AuthRequest, res: Response) => {
  const userId = String(req.user?.id || '');
  const memberId = String(req.params.memberId || '');
  if (!memberId) return res.status(400).json({ error: 'memberId is required' });
  if (memberId === `owner-${userId}`) {
    return res.status(400).json({ error: 'Cannot remove the primary agency owner seat' });
  }

  try {
    const workspace = await resolveAgentWorkspace(userId, false);
    if (!workspace || !workspace.org) return res.status(404).json({ error: 'Workspace unavailable' });

    const settings = parseOrgSettings(workspace.org.settings);
    const existingSeats: AgencySeatRecord[] = Array.isArray(settings.teamSeats) ? settings.teamSeats : [];
    const nextSeats = existingSeats.filter((s) => s.id !== memberId);
    if (nextSeats.length === existingSeats.length) {
      return res.status(404).json({ error: 'Team seat not found' });
    }

    await saveOrganizationSettings(workspace.org.id, (prev) => ({ ...prev, teamSeats: nextSeats }));
    publishWorkspaceUpdate(req, userId, workspace.org.id, 'team', { seats: nextSeats });
    res.json({ success: true, seats: nextSeats });
  } catch (error) {
    console.error('deleteAgentTeamSeat error:', error);
    res.status(500).json({ error: 'Failed to deactivate team seat' });
  }
};

/**
 * GET /api/agents/supply & POST /api/agents/supply/hold
 * Live wholesale B2B inventory queried directly from PostgreSQL Hotel, Cab & Package models
 */
export const getAgentSupply = async (req: AuthRequest, res: Response) => {
  try {
    const userId = String(req.user?.id || '');
    const workspace = await resolveAgentWorkspace(userId, false);
    const commissionPct = Math.max(5, Math.min(35, Number(workspace?.profile?.commissionPct || 12)));
    const discountFactor = 1 - commissionPct / 100;

    const category = String(req.query.category || 'ALL').toUpperCase();
    const search = String(req.query.search || '').trim().toLowerCase();

    const [hotels, cabs, packages] = await Promise.all([
      prisma.hotel.findMany({ where: withTenantScope({ isActive: true }, req.tenantId), take: 50 }),
      prisma.cab.findMany({ where: withTenantScope({ isActive: true }, req.tenantId), take: 50 }),
      prisma.package.findMany({ where: { isActive: true }, take: 50 }).catch(() => [])
    ]);

    const supplyItems: Array<Record<string, any>> = [];

    hotels.forEach((h: any) => {
      const retailRate = Number(h.pricePerNight || 0);
      const netRate = Math.round(retailRate * discountFactor);
      let features: string[] = [];
      try {
        const parsed = JSON.parse(h.amenities || '[]');
        if (Array.isArray(parsed)) features = parsed.slice(0, 4).map(String);
      } catch {
        // Ignore malformed JSON amenities
      }
      const isHouseboat = /houseboat|dal|nigeen/i.test(`${h.name} ${h.location}`);
      supplyItems.push({
        id: h.id,
        sourceType: 'HOTEL',
        category: isHouseboat ? 'HOUSEBOAT' : 'HOTEL',
        title: h.name,
        location: h.location,
        netRate,
        retailRate,
        unit: 'night / contracted room',
        rating: h.starRating || h.rating || 4,
        features,
        cancellationPolicy: h.cancellationPolicy || 'Standard J&K DMC Terms'
      });
    });

    cabs.forEach((c: any) => {
      const retailRate = Number(c.basePrice || c.pricePerKm * 120 || 0);
      const netRate = Math.round(retailRate * discountFactor);
      let features: string[] = [];
      try {
        const parsed = JSON.parse(c.features || '[]');
        if (Array.isArray(parsed)) features = parsed.slice(0, 4).map(String);
      } catch {
        // Ignore malformed JSON features
      }
      supplyItems.push({
        id: c.id,
        sourceType: 'CAB',
        category: 'CAB',
        title: `${c.name} (${c.type})`,
        location: `All-Kashmir Fleet • ${c.capacity} Seats`,
        netRate,
        retailRate,
        unit: 'day transfer tariff',
        rating: 5,
        features,
        cancellationPolicy: 'Free rescheduling 24h before arrival'
      });
    });

    packages.forEach((pkg: any) => {
      const retailRate = Number(pkg.price || 0);
      const netRate = Math.round(retailRate * discountFactor);
      supplyItems.push({
        id: pkg.id,
        sourceType: 'PACKAGE',
        category: 'PACKAGE',
        title: pkg.name,
        location: `${pkg.destination} • ${pkg.duration}`,
        netRate,
        retailRate,
        unit: 'per package departure',
        rating: 5,
        features: Array.isArray(pkg.highlights) ? pkg.highlights.slice(0, 3) : [],
        cancellationPolicy: 'B2B Partner Allotment'
      });
    });

    const filtered = supplyItems.filter((item) => {
      const catOk = category === 'ALL' || item.category === category;
      const searchOk =
        !search ||
        String(item.title).toLowerCase().includes(search) ||
        String(item.location).toLowerCase().includes(search);
      return catOk && searchOk;
    });

    const settings = parseOrgSettings(workspace?.org?.settings);
    const activeHolds = Array.isArray(settings.rateHolds)
      ? settings.rateHolds.filter((h: any) => new Date(h.expiresAt) > new Date())
      : [];

    res.json({
      items: filtered,
      commissionPct,
      activeHolds,
      total: filtered.length
    });
  } catch (error) {
    console.error('getAgentSupply error:', error);
    res.status(500).json({ error: 'Failed to load wholesale inventory from database' });
  }
};

export const holdAgentSupplyRate = async (req: AuthRequest, res: Response) => {
  const userId = String(req.user?.id || '');
  const { itemId, category, title, netRate, inquiryId } = req.body || {};

  if (!itemId || !title || netRate === undefined) {
    return res.status(400).json({ error: 'itemId, title, and netRate are required' });
  }

  try {
    const workspace = await resolveAgentWorkspace(userId, true);
    if (!workspace || !workspace.org) return res.status(404).json({ error: 'Workspace unavailable' });

    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    const holdRecord = {
      id: `HOLD-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
      itemId: String(itemId),
      category: String(category || 'HOTEL'),
      title: String(title),
      netRate: Number(netRate),
      createdAt: new Date().toISOString(),
      expiresAt
    };

    const { settings } = await saveOrganizationSettings(workspace.org.id, (prev) => {
      const existingHolds = Array.isArray(prev.rateHolds)
        ? prev.rateHolds.filter((h: any) => new Date(h.expiresAt) > new Date() && h.itemId !== holdRecord.itemId)
        : [];
      return { ...prev, rateHolds: [holdRecord, ...existingHolds].slice(0, 25) };
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'AGENT_B2B_RATE_HOLD',
        details: JSON.stringify(holdRecord)
      }
    }).catch(() => null);

    if (inquiryId) {
      await prisma.leadActivity.create({
        data: {
          inquiryId: String(inquiryId),
          type: 'QUOTE_DISPATCHED',
          title: `B2B Rate Locked: ${holdRecord.title}`,
          description: `48h contract rate held at ₹${holdRecord.netRate.toLocaleString('en-IN')}`,
          performedBy: workspace.user.name || workspace.user.email
        }
      }).catch(() => null);
    }

    publishWorkspaceUpdate(req, userId, workspace.org.id, 'supply-hold', {
      hold: holdRecord,
      activeHolds: settings.rateHolds
    });

    res.status(201).json({ success: true, hold: holdRecord, activeHolds: settings.rateHolds });
  } catch (error) {
    console.error('holdAgentSupplyRate error:', error);
    res.status(500).json({ error: 'Failed to lock wholesale rate' });
  }
};

/**
 * GET /api/agents/api-feed & POST /api/agents/api-keys/regenerate
 * Real PostgreSQL JSON/XML feed backed by Hotel, Cab, and Package tables
 */
export const getAgentApiFeed = async (req: AuthRequest, res: Response) => {
  try {
    const userId = String(req.user?.id || '');
    const workspace = await resolveAgentWorkspace(userId, false);
    if (!workspace) return res.status(404).json({ error: 'User not found' });

    const category = String(req.query.category || 'hotels').toLowerCase();
    const format = String(req.query.format || 'json').toLowerCase();
    const plan = normalizePlan(workspace.profile?.plan || workspace.org?.tier);
    const agentCode = workspace.profile?.agentCode || `AGT-${userId.slice(0, 6).toUpperCase()}`;
    const settings = parseOrgSettings(workspace.org?.settings);
    const apiKey = settings.apiKey || null;
    const discountFactor = 1 - Math.max(5, Math.min(35, Number(workspace.profile?.commissionPct || 12))) / 100;

    let payload: any;
    if (category === 'cabs') {
      const cabs = await prisma.cab.findMany({ where: withTenantScope({ isActive: true }, req.tenantId), take: 25 });
      payload = {
        status: 'success',
        timestamp: new Date().toISOString(),
        agencyCode: agentCode,
        plan,
        category: 'cabs',
        count: cabs.length,
        items: cabs.map((c: any) => ({
          id: c.id,
          name: c.name,
          type: c.type,
          capacity: c.capacity,
          b2bNetRate: Math.round(Number(c.basePrice || c.pricePerKm * 120 || 0) * discountFactor),
          retailMrp: Number(c.basePrice || c.pricePerKm * 120 || 0),
          isActive: Boolean(c.isActive)
        }))
      };
    } else if (category === 'packages') {
      const packages = await prisma.package.findMany({ where: { isActive: true }, take: 25 }).catch(() => []);
      payload = {
        status: 'success',
        timestamp: new Date().toISOString(),
        agencyCode: agentCode,
        plan,
        category: 'packages',
        count: packages.length,
        items: packages.map((p: any) => ({
          id: p.id,
          name: p.name,
          destination: p.destination,
          duration: p.duration,
          b2bNetRate: Math.round(Number(p.price || 0) * discountFactor),
          retailMrp: Number(p.price || 0),
          isActive: Boolean(p.isActive)
        }))
      };
    } else {
      const hotels = await prisma.hotel.findMany({ where: withTenantScope({ isActive: true }, req.tenantId), take: 25 });
      payload = {
        status: 'success',
        timestamp: new Date().toISOString(),
        agencyCode: agentCode,
        plan,
        category: 'hotels',
        count: hotels.length,
        items: hotels.map((h: any) => ({
          id: h.id,
          name: h.name,
          location: h.location,
          starRating: h.starRating,
          b2bNetRate: Math.round(Number(h.pricePerNight || 0) * discountFactor),
          retailMrp: Number(h.pricePerNight || 0),
          isActive: Boolean(h.isActive)
        }))
      };
    }

    if (format === 'xml') {
      const xmlItems = (payload.items || [])
        .map(
          (item: any) =>
            `    <Item id="${escapeXml(item.id)}" name="${escapeXml(item.name)}" location="${escapeXml(item.location || item.destination || item.type || '')}">\n` +
            `      <NetRate currency="INR">${escapeXml(item.b2bNetRate)}</NetRate>\n` +
            `      <RetailMrp currency="INR">${escapeXml(item.retailMrp)}</RetailMrp>\n` +
            `    </Item>`
        )
        .join('\n');

      const xmlPayload =
        `<?xml version="1.0" encoding="UTF-8"?>\n` +
        `<KashmirCuratorsB2BFeed version="2.0" timestamp="${escapeXml(payload.timestamp)}">\n` +
        `  <Header>\n` +
        `    <AgencyCode>${escapeXml(agentCode)}</AgencyCode>\n` +
        `    <Category>${escapeXml(category.toUpperCase())}</Category>\n` +
        `    <Count>${escapeXml(payload.count)}</Count>\n` +
        `  </Header>\n` +
        `  <Inventory>\n${xmlItems}\n  </Inventory>\n` +
        `</KashmirCuratorsB2BFeed>`;

      return res.json({ apiKey, plan, agencyCode: agentCode, format: 'XML', xml: xmlPayload, json: payload });
    }

    res.json({ apiKey, plan, agencyCode: agentCode, format: 'JSON', json: payload });
  } catch (error) {
    console.error('getAgentApiFeed error:', error);
    res.status(500).json({ error: 'Failed to generate live B2B API feed' });
  }
};

export const regenerateAgentApiKey = async (req: AuthRequest, res: Response) => {
  const userId = String(req.user?.id || '');
  try {
    const workspace = await resolveAgentWorkspace(userId, true);
    if (!workspace || !workspace.org) return res.status(404).json({ error: 'Workspace unavailable' });

    const plan = normalizePlan(workspace.profile?.plan || workspace.org.tier);
    if (plan !== 'ENTERPRISE') {
      return res.status(403).json({ error: 'Enterprise plan required to provision live B2B API keys' });
    }

    const agentCode = workspace.profile?.agentCode || `AGT-${userId.slice(0, 6).toUpperCase()}`;
    const newKey = `kcb2b_live_${agentCode.toLowerCase().replace(/[^a-z0-9]/g, '')}_${crypto.randomBytes(8).toString('hex')}`;

    await saveOrganizationSettings(workspace.org.id, (prev) => ({
      ...prev,
      apiKey: newKey,
      apiKeyUpdatedAt: new Date().toISOString()
    }));

    publishWorkspaceUpdate(req, userId, workspace.org.id, 'api-key', { hasApiKey: true });
    res.json({ success: true, apiKey: newKey });
  } catch (error) {
    console.error('regenerateAgentApiKey error:', error);
    res.status(500).json({ error: 'Failed to regenerate B2B API key' });
  }
};

/**
 * GET / PUT /api/agents/domain & POST /api/agents/domain/verify
 */
export const getAgentDomain = async (req: AuthRequest, res: Response) => {
  try {
    const workspace = await resolveAgentWorkspace(String(req.user.id), false);
    if (!workspace) return res.status(404).json({ error: 'User not found' });

    const settings = parseOrgSettings(workspace.org?.settings);
    res.json({
      domain: settings.customDomain?.domain || workspace.org?.domain || '',
      status: settings.customDomain?.status || (workspace.org?.domain ? 'PENDING' : 'NOT_CONFIGURED'),
      cnameTarget: CNAME_TARGET,
      lastCheckedAt: settings.customDomain?.lastCheckedAt || null,
      lastError: settings.customDomain?.lastError || null
    });
  } catch (error) {
    console.error('getAgentDomain error:', error);
    res.status(500).json({ error: 'Failed to load custom domain configuration' });
  }
};

export const updateAgentDomain = async (req: AuthRequest, res: Response) => {
  const userId = String(req.user?.id || '');
  const rawDomain = String(req.body?.domain || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  if (!rawDomain || !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(rawDomain)) {
    return res.status(400).json({ error: 'Enter a valid hostname (e.g. quotes.youragency.com)' });
  }

  try {
    const workspace = await resolveAgentWorkspace(userId, true);
    if (!workspace || !workspace.org) return res.status(404).json({ error: 'Workspace unavailable' });

    const domainCfg: AgencyDomainConfig = {
      domain: rawDomain,
      status: 'PENDING',
      cnameTarget: CNAME_TARGET,
      lastCheckedAt: null,
      lastError: null
    };

    await saveOrganizationSettings(
      workspace.org.id,
      (prev) => ({ ...prev, customDomain: domainCfg }),
      { domain: rawDomain }
    );
    publishWorkspaceUpdate(req, userId, workspace.org.id, 'domain', { domainConfig: domainCfg });
    res.json({ success: true, ...domainCfg });
  } catch (error) {
    console.error('updateAgentDomain error:', error);
    res.status(500).json({ error: 'Failed to save custom domain' });
  }
};

export const verifyAgentDomain = async (req: AuthRequest, res: Response) => {
  const userId = String(req.user?.id || '');
  try {
    const workspace = await resolveAgentWorkspace(userId, false);
    if (!workspace || !workspace.org) return res.status(404).json({ error: 'Custom domain not configured yet' });

    const settings = parseOrgSettings(workspace.org.settings);
    const domain = String(req.body?.domain || settings.customDomain?.domain || workspace.org.domain || '').trim().toLowerCase();
    if (!domain) {
      return res.status(400).json({ error: 'Configure and save a domain before verifying DNS' });
    }

    let status: AgencyDomainConfig['status'] = 'PENDING';
    let lastError: string | null = null;

    try {
      const records = await dns.promises.resolveCname(domain);
      const matched = records.some((r) => r.toLowerCase().replace(/\.$/, '') === CNAME_TARGET);
      if (matched) {
        status = 'VERIFIED';
      } else {
        status = 'FAILED';
        lastError = `Found CNAME [${records.join(', ')}], expected ${CNAME_TARGET}`;
      }
    } catch (dnsErr: any) {
      status = 'PENDING';
      lastError = dnsErr?.code ? `DNS lookup status: ${dnsErr.code}` : 'CNAME record not yet propagating';
    }

    const domainCfg: AgencyDomainConfig = {
      domain,
      status,
      cnameTarget: CNAME_TARGET,
      lastCheckedAt: new Date().toISOString(),
      lastError
    };

    await saveOrganizationSettings(workspace.org.id, (prev) => ({ ...prev, customDomain: domainCfg }));
    publishWorkspaceUpdate(req, userId, workspace.org.id, 'domain', { domainConfig: domainCfg });
    res.json({ success: status === 'VERIFIED', ...domainCfg });
  } catch (error) {
    console.error('verifyAgentDomain error:', error);
    res.status(500).json({ error: 'Failed to verify DNS configuration' });
  }
};

/**
 * GET /api/agents/credit
 * Real PostgreSQL B2B credit facility & settlement ledger (zero hardcoded sample transactions)
 */
export const getAgentCreditLedger = async (req: AuthRequest, res: Response) => {
  try {
    const userId = String(req.user?.id || '');
    const workspace = await resolveAgentWorkspace(userId, false);
    if (!workspace) return res.status(404).json({ error: 'User not found' });

    const { user, profile, org } = workspace;
    const plan = normalizePlan(profile?.plan || org?.tier);
    const settings = parseOrgSettings(org?.settings);
    const creditLimit = plan === 'ENTERPRISE' ? Number(settings.creditLimit || 250000) : 0;

    const [inquiries, bookings] = await Promise.all([
      prisma.inquiry.findMany({ where: buildAgentInquiryFilter(user), orderBy: { updatedAt: 'desc' } }),
      prisma.booking.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } })
    ]);

    const refIds = [
      ...bookings.map((b) => b.id),
      ...inquiries.map((i) => i.id),
      ...(profile?.id ? [profile.id] : [])
    ];

    const ledgerRows = refIds.length > 0
      ? await (prisma as any).transactionLedger.findMany({
          where: { bookingId: { in: refIds } },
          orderBy: { createdAt: 'desc' }
        })
      : [];

    const activeExposure = inquiries
      .filter((i) => i.leadStage === 'PAYMENT_PENDING' || i.leadStage === 'NEGOTIATION')
      .reduce((sum, i) => sum + getInquiryValueINR(i), 0);

    const settledAmount = ledgerRows
      .filter((tx: any) => String(tx.type).toUpperCase() === 'CREDIT')
      .reduce((sum: number, tx: any) => sum + Number(tx.amount || 0), 0);

    const commissionPct = Number(profile?.commissionPct || 10.0);
    const confirmedInquiries = inquiries.filter((i) => i.leadStage === 'CONFIRMED' || i.leadStage === 'COMPLETED');
    const confirmedRevenue = bookings.reduce((s, b) => s + Number(b.totalAmount || 0), 0) ||
      confirmedInquiries.reduce((s, i) => s + getInquiryValueINR(i), 0);

    const inquiryById = new Map(inquiries.map((i) => [i.id, i]));
    const bookingById = new Map(bookings.map((b) => [b.id, b]));

    const entries = ledgerRows.map((tx: any) => {
      const inq = inquiryById.get(tx.bookingId);
      const bk = bookingById.get(tx.bookingId);
      return {
        id: tx.paymentId || tx.id,
        date: tx.createdAt,
        description: tx.description || (bk ? bk.itemName : inq ? `${inq.destination} (${inq.duration})` : 'Platform Settlement'),
        guestName: inq?.customerName || user.name,
        amount: Number(tx.amount || 0),
        type: tx.type,
        status: String(tx.type).toUpperCase() === 'CREDIT' ? 'SETTLED' : 'ACTIVE_CREDIT'
      };
    });

    res.json({
      plan,
      creditLimit,
      utilizedCredit: Math.min(creditLimit, activeExposure),
      availableCredit: Math.max(0, creditLimit - activeExposure),
      settledAmount,
      confirmedRevenue,
      commissionPct,
      commissionEarned: Math.round((confirmedRevenue * commissionPct) / 100),
      entries
    });
  } catch (error) {
    console.error('getAgentCreditLedger error:', error);
    res.status(500).json({ error: 'Failed to load agency financial ledger' });
  }
};
