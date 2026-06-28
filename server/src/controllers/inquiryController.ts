import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { notificationService } from '../services/notificationService';
import { googleSheetsService } from '../services/googleSheetsService';
import { PricingService } from '../services/pricingService';
import { CRMService } from '../services/crmService';


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
  const { customerName, email, phone, destination, duration, travelers, budget, accommodation, userId, flightDetails } = req.body;
  
  try {
    const p = prisma as any;
    const inquiry = await p.inquiry.create({
      data: {
        userId: userId || null,
        customerName: customerName || 'Valued Guest',
        email: email || 'notprovided@kashmirconnect.com',
        phone: phone || 'Not Provided',
        destination: destination || 'Kashmir',
        duration: duration || '6 Days',
        travelers: travelers ? String(travelers) : '2',
        budget: budget || 'Flexible',
        accommodation: accommodation || 'Premium Hotel',
        flightDetails: flightDetails || null,
        status: 'New'
      }
    });

    // Trigger automatic automation (Email + Socket)
    await notificationService.triggerInquiryReceived(req.io, inquiry);

    // Sync to Google Sheets (fail-safe and non-blocking in background)
    googleSheetsService.appendLeadToSheet(inquiry);

    // Auto-assign lead to active online sales agents using Round-Robin Routing
    let finalInquiry = inquiry;
    try {
      const assignedAgent = await CRMService.assignLeadRoundRobin(inquiry.id);
      if (assignedAgent) {
        finalInquiry = await p.inquiry.findUnique({ where: { id: inquiry.id } }) || inquiry;
      }
    } catch (routeErr: any) {
      console.error('[crmService] Round-Robin assignment failure:', routeErr.message);
    }

    res.status(201).json(finalInquiry);
  } catch (error) {
    console.error('Inquiry submission error:', error);
    res.status(500).json({ error: 'Failed to submit inquiry' });
  }
};

export const getDynamicQuote = async (req: Request, res: Response) => {
  const { destination, durationDays, travelers, hotelTier, hasCab, cabType } = req.body;
  
  try {
    const quote = PricingService.calculateQuote({
      destination: destination || 'Kashmir',
      durationDays: Number(durationDays) || 6,
      travelers: Number(travelers) || 2,
      hotelTier: hotelTier || 'STANDARD',
      hasCab: hasCab === undefined ? true : !!hasCab,
      cabType: cabType || 'SUV_COMFORT'
    });
    
    res.json(quote);
  } catch (error: any) {
    console.error('[PricingEngine] Failed to compute dynamic quote:', error.message);
    res.status(500).json({ error: 'Failed to calculate custom travel quote' });
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
      flightDetails,
      feedback,
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
    if (flightDetails !== undefined) data.flightDetails = flightDetails ? String(flightDetails) : null;
    if (feedback !== undefined) data.feedback = feedback ? String(feedback) : null;
    
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

export const sendProposal = async (req: Request, res: Response) => {
  try {
    const p = prisma as any;
    
    // 1. Update the status in DB
    const inquiry = await p.inquiry.update({
      where: { id: req.params.id },
      data: { status: 'Quote Sent' }
    });

    // 2. Trigger the manual automation (Email + Socket)
    await notificationService.triggerSendProposal(req.io, inquiry);

    res.json({ success: true, inquiry });
  } catch (error) {
    console.error('Send proposal error:', (error as any).message);
    res.status(500).json({ error: 'Failed to send proposal' });
  }
};

export const getPublicInquiryItinerary = async (req: Request, res: Response) => {
  try {
    const p = prisma as any;
    const { id } = req.params;
    const inquiry = await p.inquiry.findUnique({
      where: { id },
      select: {
        id: true,
        customerName: true,
        destination: true,
        duration: true,
        travelers: true,
        quoteData: true,
        proposalUrl: true,
        status: true,
        createdAt: true
      }
    });

    if (!inquiry) {
      return res.status(404).json({ error: 'Itinerary not found' });
    }

    res.json(inquiry);
  } catch (error: any) {
    console.error('Fetch public itinerary error:', error.message);
    res.status(500).json({ error: 'Failed to fetch itinerary' });
  }
};
