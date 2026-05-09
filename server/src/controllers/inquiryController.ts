import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getInquiries = async (req: Request, res: Response) => {
  try {
    const { assignedTo, status } = req.query;
    const where: any = {};
    if (assignedTo) where.assignedTo = assignedTo as string;
    if (status) where.status = status as string;

    const inquiries = await prisma.inquiry.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
    res.json(inquiries);
  } catch (error) {
    console.error('Inquiry fetch error:', (error as any).message);
    // Return empty array so the frontend doesn't crash
    res.json([]);
  }
};

export const createInquiry = async (req: any, res: Response) => {
  const { customerName, email, phone, destination, duration, travelers, budget, accommodation } = req.body;
  
  try {
    const inquiry = await prisma.inquiry.create({
      data: {
        customerName,
        email,
        phone,
        destination,
        duration,
        travelers,
        budget,
        accommodation,
        status: 'New'
      }
    });

    if (req.io) {
      req.io.to('admin-room').emit('new-system-event', {
        type: 'CREATE',
        message: `New Lead: ${customerName} interested in ${destination}`,
        booking: { ...inquiry, entityType: 'inquiry' }
      });
    }

    res.status(201).json(inquiry);
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit inquiry' });
  }
};

export const updateInquiry = async (req: any, res: Response) => {
  try {
    const inquiry = await prisma.inquiry.update({
      where: { id: req.params.id },
      data: req.body
    });

    if (req.io) {
      req.io.to('admin-room').emit('new-system-event', {
        type: 'UPDATE',
        message: `Inquiry ${inquiry.id} updated`,
        booking: { ...inquiry, entityType: 'inquiry' }
      });
    }

    res.json(inquiry);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update inquiry' });
  }
};
