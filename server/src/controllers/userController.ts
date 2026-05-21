import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            bookings: true,
            inquiries: true, // TS cache refresh
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
    const totalUsers = await prisma.user.count();
    const activeTravelers = await prisma.user.count({
      where: {
        bookings: {
          some: {}
        }
      }
    });

    res.json({
      totalUsers,
      activeTravelers,
      newThisMonth: 12, // Mock for now or calculate from dates
      conversionRate: '24%' // Mock for now
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user stats' });
  }
};

export const createTeamMember = async (req: Request, res: Response) => {
  const adminUser = (req as any).user;
  if (!adminUser || adminUser.role !== 'admin') {
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

    const newTeamMember = await prisma.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        role: role.toLowerCase(),
        employeeCode: employeeCode.toUpperCase(),
        leadCapacity: leadCapacity ? parseInt(leadCapacity) : 5,
        emailVerified: true
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
  if (!adminUser || adminUser.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden. Only administrators can remove profiles.' });
  }

  const { id } = req.params;

  try {
    await prisma.user.delete({
      where: { id: id as string }
    });
    res.json({ success: true, message: 'Profile successfully removed' });
  } catch (error: any) {
    console.error('Failed to delete user:', error);
    res.status(500).json({ error: error.message || 'Failed to remove profile' });
  }
};
