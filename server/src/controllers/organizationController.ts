import { Response } from 'express';
import prisma from '../lib/prisma';
import { TenantRequest } from '../middleware/tenantMiddleware';
import { DEFAULT_TENANT, ensureDefaultOrganization } from '../lib/tenant';

/**
 * GET /api/organizations
 * List organizations with type and status filtering
 */
export const getOrganizations = async (req: TenantRequest, res: Response): Promise<any> => {
  try {
    const { type, status, search } = req.query;
    const where: any = {};

    if (type && type !== 'ALL') {
      where.type = String(type).toUpperCase();
    }
    if (status && status !== 'ALL') {
      where.status = String(status).toUpperCase();
    }
    if (search) {
      where.OR = [
        { name: { contains: String(search), mode: 'insensitive' } },
        { slug: { contains: String(search), mode: 'insensitive' } },
        { city: { contains: String(search), mode: 'insensitive' } },
        { email: { contains: String(search), mode: 'insensitive' } }
      ];
    }

    const organizations = await prisma.organization.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            users: true,
            hotels: true,
            cabs: true,
            inquiries: true,
            bookings: true
          }
        }
      }
    });

    res.json({ organizations });
  } catch (error: any) {
    console.warn('getOrganizations fallback notice:', error.message);
    res.json({ organizations: [DEFAULT_TENANT] });
  }
};

/**
 * GET /api/organizations/current
 * Resolves current active organization context
 */
export const getCurrentOrganization = async (req: TenantRequest, res: Response): Promise<any> => {
  try {
    const tenantId = req.tenantId || req.user?.organizationId;

    if (!tenantId) {
      const defaultOrg = await ensureDefaultOrganization();
      return res.json({ organization: defaultOrg });
    }

    const org = await prisma.organization.findUnique({
      where: { id: tenantId },
      include: {
        _count: {
          select: {
            users: true,
            hotels: true,
            cabs: true,
            inquiries: true,
            bookings: true
          }
        }
      }
    });

    if (!org) {
      const defaultOrg = await ensureDefaultOrganization();
      return res.json({ organization: defaultOrg });
    }

    res.json({ organization: org });
  } catch (error: any) {
    console.error('getCurrentOrganization error:', error.message);
    res.json({ organization: DEFAULT_TENANT });
  }
};

/**
 * GET /api/organizations/:id
 * Retrieve details of a specific organization
 */
export const getOrganizationById = async (req: TenantRequest, res: Response): Promise<any> => {
  try {
    const id = String(req.params.id);

    const org = await prisma.organization.findUnique({
      where: { id },
      include: {
        users: {
          select: { id: true, name: true, email: true, role: true, isOnline: true },
          take: 20
        },
        hotels: {
          select: { id: true, name: true, location: true, starRating: true, isActive: true },
          take: 20
        },
        cabs: {
          select: { id: true, name: true, type: true, capacity: true, isActive: true },
          take: 20
        },
        _count: {
          select: {
            users: true,
            hotels: true,
            cabs: true,
            inquiries: true,
            bookings: true,
            hotelReservations: true
          }
        }
      }
    });

    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    res.json({ organization: org });
  } catch (error: any) {
    console.error('getOrganizationById error:', error.message);
    res.status(500).json({ error: 'Failed to retrieve organization' });
  }
};

/**
 * POST /api/organizations
 * Create a new tenant organization (Agency, Hotel Operator, Fleet Provider)
 */
export const createOrganization = async (req: TenantRequest, res: Response): Promise<any> => {
  try {
    const {
      name,
      slug,
      type = 'AGENCY',
      tier = 'STARTER',
      email,
      phone,
      address,
      city,
      state,
      logo,
      domain,
      settings
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Organization name is required' });
    }

    const generatedSlug = (slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')) +
      `-${Math.floor(100 + Math.random() * 900)}`;

    const newOrg = await prisma.organization.create({
      data: {
        name: name.trim(),
        slug: generatedSlug,
        type: String(type).toUpperCase(),
        tier: String(tier).toUpperCase(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        address: address?.trim() || null,
        city: city?.trim() || 'Srinagar',
        state: state?.trim() || 'Jammu & Kashmir',
        logo: logo || null,
        domain: domain?.trim() || null,
        settings: settings ? (typeof settings === 'string' ? settings : JSON.stringify(settings)) : null,
        status: 'ACTIVE'
      }
    });

    // If caller is an authenticated user without an organization, link them
    if (req.user?.id && !req.user?.organizationId) {
      await prisma.user.update({
        where: { id: req.user.id },
        data: { organizationId: newOrg.id }
      }).catch(() => null);
    }

    res.status(201).json({
      success: true,
      message: 'Organization registered successfully',
      organization: newOrg
    });
  } catch (error: any) {
    console.error('createOrganization error:', error.message);
    res.status(500).json({ error: error.message || 'Failed to create organization' });
  }
};

/**
 * PATCH /api/organizations/:id
 * Update organization settings or profile
 */
export const updateOrganization = async (req: TenantRequest, res: Response): Promise<any> => {
  try {
    const id = String(req.params.id);
    const {
      name,
      type,
      status,
      tier,
      email,
      phone,
      address,
      city,
      state,
      logo,
      domain,
      settings
    } = req.body;

    const existing = await prisma.organization.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    const userRole = String(req.user?.role || '').toLowerCase();
    const isPlatformAdmin = ['admin', 'operations'].includes(userRole);
    if (!isPlatformAdmin && req.user?.id) {
      const dbUser = await prisma.user.findUnique({ where: { id: req.user.id }, select: { organizationId: true } });
      if (dbUser?.organizationId !== id) {
        return res.status(403).json({ error: 'Forbidden: You can only update your own organization' });
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (type !== undefined) updateData.type = String(type).toUpperCase();
    if (status !== undefined) updateData.status = String(status).toUpperCase();
    if (tier !== undefined) updateData.tier = String(tier).toUpperCase();
    if (email !== undefined) updateData.email = email?.trim() || null;
    if (phone !== undefined) updateData.phone = phone?.trim() || null;
    if (address !== undefined) updateData.address = address?.trim() || null;
    if (city !== undefined) updateData.city = city?.trim() || null;
    if (state !== undefined) updateData.state = state?.trim() || null;
    if (logo !== undefined) updateData.logo = logo;
    if (domain !== undefined) updateData.domain = domain?.trim() || null;
    if (settings !== undefined) {
      updateData.settings = typeof settings === 'string' ? settings : JSON.stringify(settings);
    }

    const updated = await prisma.organization.update({
      where: { id },
      data: updateData
    });

    res.json({
      success: true,
      message: 'Organization updated successfully',
      organization: updated
    });
  } catch (error: any) {
    console.error('updateOrganization error:', error.message);
    res.status(500).json({ error: 'Failed to update organization' });
  }
};

/**
 * GET /api/organizations/:id/stats
 * Organization-scoped operational metrics
 */
export const getOrganizationStats = async (req: TenantRequest, res: Response): Promise<any> => {
  try {
    const id = String(req.params.id);

    const [inquiriesCount, activeBookingsCount, hotelsCount, cabsCount] = await Promise.all([
      prisma.inquiry.count({ where: { organizationId: id } }),
      prisma.booking.count({ where: { organizationId: id, status: 'confirmed' } }),
      prisma.hotel.count({ where: { organizationId: id, isActive: true } }),
      prisma.cab.count({ where: { organizationId: id, isActive: true } })
    ]);

    res.json({
      stats: {
        organizationId: id,
        inquiriesCount,
        activeBookingsCount,
        hotelsCount,
        cabsCount
      }
    });
  } catch (error: any) {
    console.error('getOrganizationStats error:', error.message);
    res.status(500).json({ error: 'Failed to fetch organization statistics' });
  }
};
