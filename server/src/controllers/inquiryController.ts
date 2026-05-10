import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getInquiries = async (req: Request, res: Response) => {
  try {
    const p = prisma as any;
    const { assignedTo, status } = req.query;
    const where: any = {};
    if (assignedTo) where.assignedTo = assignedTo as string;
    if (status) where.status = status as string;
 
    const inquiries = await p.inquiry.findMany({
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

export const createInquiry = async (req: Request, res: Response) => {
  const { customerName, email, phone, destination, duration, travelers, budget, accommodation, userId } = req.body;
  
  try {
    const p = prisma as any;
    const inquiry = await p.inquiry.create({
      data: {
        userId: userId || null,
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

export const updateInquiry = async (req: Request, res: Response) => {
  try {
    const p = prisma as any;
    const { 
      status, 
      assignedTo, 
      priority, 
      sentiment, 
      quoteData, 
      proposalUrl,
      customerName,
      email,
      phone,
      destination,
      duration,
      travelers,
      budget,
      accommodation
    } = req.body;

    const data: any = {};
    if (status !== undefined) data.status = String(status);
    if (assignedTo !== undefined) data.assignedTo = assignedTo ? String(assignedTo) : null;
    if (priority !== undefined) data.priority = priority ? String(priority) : null;
    if (sentiment !== undefined) data.sentiment = sentiment ? String(sentiment) : null;
    if (quoteData !== undefined) data.quoteData = quoteData ? (typeof quoteData === 'string' ? quoteData : JSON.stringify(quoteData)) : null;
    if (proposalUrl !== undefined) data.proposalUrl = proposalUrl ? String(proposalUrl) : null;
    
    // Also allow updating basic info if needed
    if (customerName !== undefined) data.customerName = String(customerName);
    if (email !== undefined) data.email = String(email);
    if (phone !== undefined) data.phone = String(phone);
    if (destination !== undefined) data.destination = String(destination);
    if (duration !== undefined) data.duration = String(duration);
    if (travelers !== undefined) data.travelers = String(travelers);
    if (budget !== undefined) data.budget = String(budget);
    if (accommodation !== undefined) data.accommodation = String(accommodation);

    const inquiry = await p.inquiry.update({
      where: { id: req.params.id },
      data
    });

    if (req.io) {
      req.io.to('admin-room').emit('new-system-event', {
        type: 'UPDATE',
        message: `Inquiry ${inquiry.id} updated by ${req.user?.name || 'System'}`,
        booking: { ...inquiry, entityType: 'inquiry' }
      });
    }

    res.json(inquiry);
  } catch (error) {
    console.error('Inquiry update error:', (error as any).message);
    res.status(500).json({ error: 'Failed to update inquiry' });
  }
};
