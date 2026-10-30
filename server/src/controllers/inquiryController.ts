import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { notificationService } from '../services/notificationService';
import { googleSheetsService } from '../services/googleSheetsService';
import { PricingService } from '../services/pricingService';
import { CRMService } from '../services/crmService';
import { bookingAutomationService } from '../services/bookingAutomationService';
import { LeadScoringService } from '../services/leadScoringService';


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
  const { customerName, email, phone, destination, duration, travelers, budget, accommodation, userId, flightDetails, sourceCta } = req.body;
  
  try {
    const p = prisma as any;
    const leadId = await LeadScoringService.generateLeadId();
    const scoreResult = LeadScoringService.calculateScore({
      destination: destination || 'Kashmir',
      budgetRange: budget,
      preferredAccommodation: accommodation,
      sourceCta: sourceCta || 'DIRECT_INQUIRY',
      profileCompleteness: 40
    });

    const inquiry = await p.inquiry.create({
      data: {
        leadId,
        userId: userId || null,
        customerName: customerName || 'Valued Guest',
        email: email || `${leadId.toLowerCase()}@guest.kashmirconnect.com`,
        phone: phone || 'Not Provided',
        destination: destination || 'Kashmir',
        duration: duration || '6 Days',
        travelers: travelers ? String(travelers) : '2',
        budget: budget || 'Flexible',
        accommodation: accommodation || 'Premium Hotel',
        flightDetails: flightDetails || null,
        status: 'New',
        leadStage: 'NEW_LEAD',
        leadScore: scoreResult.totalScore,
        leadCategory: scoreResult.category,
        sentiment: scoreResult.sentiment,
        priority: scoreResult.priority,
        sourceCta: sourceCta || 'DIRECT_INQUIRY',
        scoringBreakdown: JSON.stringify(scoreResult.scoringBreakdown),
        profileCompleteness: 40
      }
    });

    // Trigger automatic automation (Email + Socket)
    await notificationService.triggerInquiryReceived((req as any).io, inquiry);

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

    if ((req as any).io) {
      (req as any).io.emit('new-live-curation', {
        id: finalInquiry.id,
        leadId: finalInquiry.leadId,
        message: `${finalInquiry.customerName} just requested a custom itinerary`,
        details: `${finalInquiry.destination} • Score: ${finalInquiry.leadScore}/100`,
        createdAt: new Date().toISOString()
      });
      (req as any).io.to('admin-room').emit('new-system-event', {
        type: 'LEAD_CAPTURED',
        leadId: finalInquiry.leadId,
        inquiry: finalInquiry,
        message: `New Lead: ${finalInquiry.leadId} (${finalInquiry.customerName}) [${finalInquiry.leadCategory}]`
      });
    }

    res.status(201).json(finalInquiry);
  } catch (error) {
    console.error('Inquiry submission error:', error);
    res.status(500).json({ error: 'Failed to submit inquiry' });
  }
};

/**
 * Step 1 of Progressive Profiling: Quick Frictionless Lead Capture
 * Instantly registers lead with unique leadId, assigns score, and auto-routes to agent.
 */
export const captureQuickLead = async (req: Request, res: Response) => {
  try {
    const p = prisma as any;
    const { 
      customerName, 
      phone, 
      email, 
      intentQuery, 
      destination, 
      travelStartDate, 
      travelMonth,
      sourceCta,
      notes
    } = req.body;

    if (!phone && !email) {
      return res.status(400).json({ error: 'Phone number or email is required to capture lead.' });
    }

    const leadId = await LeadScoringService.generateLeadId();
    const scoreResult = LeadScoringService.calculateScore({
      intentQuery: intentQuery || destination || 'Bespoke Kashmir Tour',
      destination: destination || 'Kashmir Valley',
      travelStartDate: travelStartDate ? new Date(travelStartDate) : null,
      travelMonth,
      sourceCta: sourceCta || 'PLAN_MY_TRIP',
      profileCompleteness: 35
    });

    const inquiry = await p.inquiry.create({
      data: {
        leadId,
        customerName: customerName || 'Valued Traveler',
        phone: phone || 'Not Provided',
        email: email || `${leadId.toLowerCase()}@guest.kashmirconnect.com`,
        destination: destination || 'Kashmir Valley',
        duration: '5 Nights',
        travelers: '2 Adults',
        budget: 'Flexible',
        accommodation: 'Premium Hotel',
        leadStage: 'NEW_LEAD',
        status: 'New',
        leadScore: scoreResult.totalScore,
        leadCategory: scoreResult.category,
        sentiment: scoreResult.sentiment,
        priority: scoreResult.priority,
        intentQuery: intentQuery || null,
        sourceCta: sourceCta || 'PLAN_MY_TRIP',
        travelStartDate: travelStartDate ? new Date(travelStartDate) : null,
        scoringBreakdown: JSON.stringify(scoreResult.scoringBreakdown),
        profileCompleteness: 35,
        notes: notes || null
      }
    });

    let finalInquiry = inquiry;
    try {
      const assignedAgent = await CRMService.assignLeadRoundRobin(inquiry.id);
      if (assignedAgent) {
        finalInquiry = await p.inquiry.findUnique({ where: { id: inquiry.id } }) || inquiry;
      }
    } catch (routeErr: any) {
      console.error('[crmService] Round-Robin assignment error:', routeErr.message);
    }

    try {
      await notificationService.triggerInquiryReceived((req as any).io, finalInquiry);
      googleSheetsService.appendLeadToSheet(finalInquiry);
    } catch (notifErr: any) {
      console.warn('Non-blocking notification/sheet error:', notifErr.message);
    }

    if ((req as any).io) {
      (req as any).io.emit('new-live-curation', {
        id: finalInquiry.id,
        leadId: finalInquiry.leadId,
        message: `${finalInquiry.customerName} just planned an itinerary`,
        details: `${finalInquiry.destination} • Score: ${finalInquiry.leadScore}/100`,
        createdAt: new Date().toISOString()
      });
      (req as any).io.to('admin-room').emit('new-system-event', {
        type: 'NEW_LEAD_CAPTURED',
        leadId: finalInquiry.leadId,
        inquiry: finalInquiry,
        message: `New Lead: ${finalInquiry.leadId} (${finalInquiry.customerName}) [${finalInquiry.leadCategory}]`
      });
    }

    res.status(201).json({
      success: true,
      leadId: finalInquiry.leadId,
      inquiryId: finalInquiry.id,
      lead: finalInquiry
    });
  } catch (error: any) {
    console.error('Quick lead capture error:', error);
    res.status(500).json({ error: 'Failed to capture trip inquiry' });
  }
};

/**
 * Step 2 & 3 of Progressive Profiling: Conversational Lead Enrichment
 * Updates preferences conversationally and recalculates lead score in real time.
 */
export const enrichLeadProfile = async (req: Request, res: Response) => {
  try {
    const p = prisma as any;
    const { id } = req.params;
    const {
      adultsCount,
      childrenCount,
      arrivalCity,
      nightsCount,
      budgetRange,
      preferredAccommodation,
      transportPreference,
      placesVisited,
      travelStyle,
      wantOffbeat,
      interests,
      destination
    } = req.body;

    const existing = await p.inquiry.findFirst({
      where: {
        OR: [
          { id: id },
          { leadId: id }
        ]
      }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Lead profile not found' });
    }

    const mergedInput = {
      travelStartDate: existing.travelStartDate,
      budgetRange: budgetRange || existing.budgetRange,
      preferredAccommodation: preferredAccommodation || existing.preferredAccommodation,
      adultsCount: adultsCount !== undefined ? Number(adultsCount) : existing.adultsCount,
      childrenCount: childrenCount !== undefined ? Number(childrenCount) : existing.childrenCount,
      arrivalCity: arrivalCity || existing.arrivalCity,
      transportPreference: transportPreference || existing.transportPreference,
      placesVisited: placesVisited || existing.placesVisited,
      travelStyle: travelStyle || existing.travelStyle,
      wantOffbeat: wantOffbeat || existing.wantOffbeat,
      intentQuery: existing.intentQuery,
      sourceCta: existing.sourceCta,
      profileCompleteness: 100,
      destination: destination || existing.destination,
      interests: interests || existing.flightDetails
    };

    const newScore = LeadScoringService.calculateScore(mergedInput);

    const updated = await p.inquiry.update({
      where: { id: existing.id },
      data: {
        adultsCount: mergedInput.adultsCount,
        childrenCount: mergedInput.childrenCount,
        travelers: `${mergedInput.adultsCount} Adults${mergedInput.childrenCount ? `, ${mergedInput.childrenCount} Kids` : ''}`,
        arrivalCity: mergedInput.arrivalCity,
        nightsCount: nightsCount ? Number(nightsCount) : existing.nightsCount,
        duration: nightsCount ? `${nightsCount} Nights` : existing.duration,
        budgetRange: mergedInput.budgetRange,
        budget: mergedInput.budgetRange || existing.budget,
        preferredAccommodation: mergedInput.preferredAccommodation,
        accommodation: mergedInput.preferredAccommodation || existing.accommodation,
        transportPreference: mergedInput.transportPreference,
        placesVisited: mergedInput.placesVisited,
        travelStyle: mergedInput.travelStyle,
        wantOffbeat: mergedInput.wantOffbeat,
        destination: mergedInput.destination,
        leadCategory: newScore.category,
        leadScore: newScore.totalScore,
        sentiment: newScore.sentiment,
        priority: newScore.priority,
        scoringBreakdown: JSON.stringify(newScore.scoringBreakdown),
        profileCompleteness: 100
      }
    });

    if ((req as any).io) {
      (req as any).io.to('admin-room').emit('new-system-event', {
        type: 'LEAD_ENRICHED',
        leadId: updated.leadId,
        inquiry: updated,
        message: `Lead ${updated.leadId} enriched! New Score: ${updated.leadScore}/100 (${updated.sentiment})`
      });
    }

    res.json({
      success: true,
      lead: updated
    });
  } catch (error: any) {
    console.error('Lead enrichment error:', error);
    res.status(500).json({ error: 'Failed to enrich lead profile' });
  }
};

/**
 * Direct Instant Callback Request (Hot Lead)
 */
export const requestInstantCallback = async (req: Request, res: Response) => {
  try {
    const p = prisma as any;
    const { customerName, phone, email, preferredTime, intentQuery, notes } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required for an instant callback.' });
    }

    const leadId = await LeadScoringService.generateLeadId();
    const scoreResult = LeadScoringService.calculateScore({
      intentQuery: intentQuery || 'Requested Instant Callback',
      sourceCta: 'CALLBACK_MODAL',
      profileCompleteness: 50
    });

    const inquiry = await p.inquiry.create({
      data: {
        leadId,
        customerName: customerName || 'VIP Callback Requester',
        phone,
        email: email || `${leadId.toLowerCase()}@callback.kashmirconnect.com`,
        destination: 'Kashmir Consultation',
        duration: 'Flexible',
        travelers: '2',
        budget: 'Flexible',
        accommodation: 'Preferred on Call',
        status: 'New',
        leadStage: 'NEW_LEAD',
        leadCategory: 'DIRECT_CALLBACK',
        leadScore: Math.max(88, scoreResult.totalScore),
        sentiment: 'Hot',
        priority: 'High',
        sourceCta: 'CALLBACK_MODAL',
        intentQuery: intentQuery || 'Immediate phone consultation requested',
        notes: `Preferred Callback Window: ${preferredTime || 'As soon as possible'}. ${notes ? `Client Note: ${notes}` : ''}`,
        scoringBreakdown: JSON.stringify(scoreResult.scoringBreakdown),
        profileCompleteness: 60
      }
    });

    let finalInquiry = inquiry;
    try {
      const assignedAgent = await CRMService.assignLeadRoundRobin(inquiry.id);
      if (assignedAgent) {
        finalInquiry = await p.inquiry.findUnique({ where: { id: inquiry.id } }) || inquiry;
      }
    } catch (routeErr: any) {
      console.error('[crmService] Round-Robin assignment error:', routeErr.message);
    }

    if ((req as any).io) {
      (req as any).io.to('admin-room').emit('new-system-event', {
        type: 'URGENT_CALLBACK',
        leadId: finalInquiry.leadId,
        inquiry: finalInquiry,
        message: `🔥 URGENT CALLBACK: ${finalInquiry.customerName} (${finalInquiry.phone}) requested a call!`
      });
      (req as any).io.emit('new-live-curation', {
        id: finalInquiry.id,
        leadId: finalInquiry.leadId,
        message: `VIP Guest requested immediate consultation callback`,
        details: `Dial window: ${preferredTime || 'Immediate'}`,
        createdAt: new Date().toISOString()
      });
    }

    res.status(201).json({
      success: true,
      leadId: finalInquiry.leadId,
      lead: finalInquiry,
      message: 'Callback request dispatched! An expert curator will connect with you.'
    });
  } catch (error: any) {
    console.error('Instant callback error:', error);
    res.status(500).json({ error: 'Failed to register callback request' });
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
      accommodation,
      leadStage
    } = req.body;

    // Handle lead stage transitions through the automation engine
    if (leadStage !== undefined) {
      const transitioned = await bookingAutomationService.handleStageTransition(req.params.id as string, String(leadStage), (req as any).io);
      return res.json(transitioned);
    }

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
        leadStage: true,
        netPrice: true,
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

export const deleteInquiry = async (req: Request, res: Response) => {
  try {
    const p = prisma as any;
    const { id } = req.params;

    // Delete any linked hotel reservations, then delete the inquiry
    await p.$transaction([
      p.hotelReservation.deleteMany({
        where: { inquiryId: id }
      }),
      p.inquiry.delete({
        where: { id }
      })
    ]);

    if (req.io) {
      req.io.to('admin-room').emit('new-system-event', {
        type: 'DELETE',
        message: `Inquiry ${id} permanently deleted from database`,
        booking: { id, entityType: 'inquiry' }
      });
    }

    res.json({ success: true, message: 'Inquiry permanently deleted' });
  } catch (error: any) {
    console.error('Delete inquiry error:', error.message);
    res.status(500).json({ error: 'Failed to delete inquiry' });
  }
};
