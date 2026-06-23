import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import prisma from '../lib/prisma';

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

    const totalRevenue = bookings.reduce((sum, b) => sum + b.totalAmount, 0);
    
    res.json({
      inquiriesCount: inquiries.length,
      bookingsCount: bookings.length,
      totalRevenue,
      commissionEarned: totalRevenue * 0.10 // 10% standard margin mock
    });
  } catch (error) {
    console.error('getAgentStats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
