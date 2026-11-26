import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { withStrictTenantScope, resolveWriteTenantId, canAccessTenantRecord } from '../lib/tenant';

const isPrivilegedTeamManager = (user: any): boolean =>
  ['admin', 'director'].includes(String(user?.role || '').toLowerCase());

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      where: withStrictTenantScope({}, (req as any).tenantId),
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        employeeCode: true,
        isOnline: true,
        leadCapacity: true,
        uploadedDocuments: true,
        createdAt: true,
        bookings: {
          select: {
            id: true,
            type: true,
            itemName: true,
            bookingDate: true,
            status: true,
            stage: true,
            totalAmount: true,
            details: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' }
        },
        inquiries: {
          select: {
            id: true,
            destination: true,
            duration: true,
            travelers: true,
            budget: true,
            status: true,
            leadStage: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' }
        },
        agentProfile: true,
        driverProfile: true,
        _count: {
          select: {
            bookings: true,
            inquiries: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(users);
  } catch (error) {
    console.error('Failed to fetch users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

export const getUserStats = async (req: Request, res: Response) => {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const tenantScope = withStrictTenantScope({}, (req as any).tenantId);
    const [totalUsers, activeTravelers, newThisMonth] = await Promise.all([
      prisma.user.count({ where: tenantScope }),
      prisma.user.count({
        where: {
          ...tenantScope,
          bookings: {
            some: {}
          }
        }
      }),
      prisma.user.count({
        where: {
          ...tenantScope,
          createdAt: { gte: startOfMonth }
        }
      })
    ]);

    const pct = totalUsers > 0 ? Math.round((activeTravelers / totalUsers) * 100) : 0;

    res.json({
      totalUsers,
      activeTravelers,
      newThisMonth,
      conversionRate: `${pct}%`
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user stats' });
  }
};

export const createTeamMember = async (req: Request, res: Response) => {
  const adminUser = (req as any).user;
  if (!isPrivilegedTeamManager(adminUser)) {
    return res.status(403).json({ error: 'Forbidden. Only administrators can create team members.' });
  }

  const { name, email, phone, role, employeeCode, leadCapacity } = req.body;

  if (!name || !email || !role || !employeeCode) {
    return res.status(400).json({ error: 'Name, email, role, and employee code are required' });
  }

  try {
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({ error: 'A user with this email address already exists' });
    }

    const existingCode = await prisma.user.findUnique({ where: { employeeCode: employeeCode.toUpperCase() } });
    if (existingCode) {
      return res.status(400).json({ error: 'A team member with this Employee Code already exists' });
    }

    const organizationId = resolveWriteTenantId(req as any);
    const newTeamMember = await (prisma.user as any).create({
      data: {
        name,
        email,
        phone: phone || null,
        role: role.toLowerCase(),
        employeeCode: employeeCode.toUpperCase(),
        leadCapacity: leadCapacity ? parseInt(leadCapacity) : 5,
        emailVerified: true,
        organizationId
      }
    });

    res.status(201).json(newTeamMember);
  } catch (error: any) {
    console.error('Failed to create team member:', error);
    res.status(500).json({ error: error.message || 'Failed to create team member' });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  const adminUser = (req as any).user;
  if (!isPrivilegedTeamManager(adminUser)) {
    return res.status(403).json({ error: 'Forbidden. Only administrators can remove profiles.' });
  }

  const { id } = req.params;

  if (adminUser.id && String(adminUser.id) === String(id)) {
    return res.status(400).json({ error: 'You cannot delete your own active administrator account.' });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { id: id as string } });
    if (!existing) {
      return res.status(404).json({ error: 'User profile not found' });
    }
    if (!canAccessTenantRecord(req as any, (existing as any).organizationId)) {
      return res.status(403).json({ error: 'Cross-tenant access denied' });
    }

    await prisma.user.delete({
      where: { id: id as string }
    });
    res.json({ success: true, message: 'Profile successfully removed' });
  } catch (error: any) {
    console.error('Failed to delete user:', error);
    res.status(500).json({ error: error.message || 'Failed to remove profile' });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  const adminUser = (req as any).user;
  if (!isPrivilegedTeamManager(adminUser)) {
    return res.status(403).json({ error: 'Forbidden. Only administrators can update profiles.' });
  }

  const { id } = req.params;
  const { name, phone, role, leadCapacity } = req.body;

  try {
    const existing = await prisma.user.findUnique({ where: { id: id as string } });
    if (!existing) {
      return res.status(404).json({ error: 'User profile not found' });
    }
    if (!canAccessTenantRecord(req as any, (existing as any).organizationId)) {
      return res.status(403).json({ error: 'Cross-tenant access denied' });
    }

    const updated = await prisma.user.update({
      where: { id: id as string },
      data: {
        ...(name && { name }),
        ...(phone !== undefined && { phone }),
        ...(role && { role: role.toLowerCase() }),
        ...(leadCapacity !== undefined && { leadCapacity: parseInt(leadCapacity) })
      }
    });
    res.json(updated);
  } catch (error: any) {
    console.error('Failed to update user profile:', error);
    res.status(500).json({ error: error.message || 'Failed to update user profile' });
  }
};
