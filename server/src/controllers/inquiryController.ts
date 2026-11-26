import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { notificationService } from '../services/notificationService';
import { googleSheetsService } from '../services/googleSheetsService';
import { PricingService } from '../services/pricingService';
import { CRMService } from '../services/crmService';
import { bookingAutomationService } from '../services/bookingAutomationService';
import { LeadScoringService } from '../services/leadScoringService';
import { emailQueueService } from '../services/emailQueueService';
import { withStrictTenantScope, resolveWriteTenantId, canAccessTenantRecord } from '../lib/tenant';
import { realtimeBus } from '../lib/realtimeBus';


export const getInquiries = async (req: any, res: Response) => {
  try {
    const p = prisma as any;
    const {
      assignedTo,
      status,
      stage,
      stageGroup,
      priority,
      search,
      unclaimedOnly,
      paginated,
      page,
      limit
    } = req.query;
    const where: any = {};
    if (assignedTo && assignedTo !== 'ALL') where.assignedTo = assignedTo as string;
    if (status && status !== 'ALL') where.status = status as string;
    if (stage && stage !== 'ALL') {
      where.leadStage = String(stage).toUpperCase();
    } else if (String(stageGroup || '').toUpperCase() === 'ACTIVE') {
      where.leadStage = {
        in: ['NEW_LEAD', 'CLAIMED', 'FOLLOW_UP', 'QUOTE_SENT', 'QUOTED', 'NEGOTIATION', 'PAYMENT_PENDING']
      };
    }
    if (priority && priority !== 'ALL') where.priority = String(priority);

    if (String(unclaimedOnly || '').toLowerCase() === 'true') {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { assignedTo: null },
            { assignedTo: '' },
            { assignedTo: 'Unassigned' }
          ]
        }
      ];
    }

    if (search && String(search).trim()) {
      const q = String(search).trim();
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { customerName: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
            { phone: { contains: q } },
            { destination: { contains: q, mode: 'insensitive' } },
            { leadId: { contains: q, mode: 'insensitive' } }
          ]
        }
      ];
    }

    const scopedWhere = withStrictTenantScope(where, req.tenantId);

    if (String(paginated || '').toLowerCase() === 'true') {
      const parsedPage = Math.max(1, parseInt(String(page || '1'), 10) || 1);
      const parsedLimit = Math.min(100, Math.max(1, parseInt(String(limit || '25'), 10) || 25));
      const [total, items] = await Promise.all([
        p.inquiry.count({ where: scopedWhere }),
        p.inquiry.findMany({
          where: scopedWhere,
          orderBy: { createdAt: 'desc' },
          skip: (parsedPage - 1) * parsedLimit,
          take: parsedLimit
        })
      ]);
      return res.json({
        items,
        total,
        page: parsedPage,
        limit: parsedLimit,
        totalPages: Math.max(1, Math.ceil(total / parsedLimit))
      });
    }

    const inquiries = await p.inquiry.findMany({
      where: scopedWhere,
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
  const { customerName, email, phone, destination, duration, travelers, budget, accommodation, userId, agentId, flightDetails, sourceCta } = req.body;
  
  try {
    const p = prisma as any;
    const reqUser = (req as any).user;
    const resolvedAgentId = agentId || (reqUser?.role === 'agent' ? reqUser.id : null);
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
        agentId: resolvedAgentId || null,
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
        profileCompleteness: 40,
        organizationId: resolveWriteTenantId(req)
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

    const inquiryTenantId = finalInquiry.organizationId || resolveWriteTenantId(req) || null;
    if ((req as any).io) {
      (req as any).io.emit('new-live-curation', {
        id: finalInquiry.id,
        leadId: finalInquiry.leadId,
        message: `A traveler just requested a custom itinerary`,
        details: `${finalInquiry.destination} • Score: ${finalInquiry.leadScore}/100`,
        createdAt: new Date().toISOString()
      });
    }
    const inquiryTargetUserIds = [finalInquiry.agentId, finalInquiry.userId]
      .filter((v): v is string => Boolean(v && typeof v === 'string'));
    realtimeBus.publish('NEW_INQUIRY', finalInquiry, {
      io: (req as any).io,
      tenantId: inquiryTenantId,
      userIds: inquiryTargetUserIds.length > 0 ? inquiryTargetUserIds : undefined
    });
    realtimeBus.publish(
      'new-system-event',
      {
        type: 'LEAD_CAPTURED',
        leadId: finalInquiry.leadId,
        inquiry: finalInquiry,
        message: `New Lead: ${finalInquiry.leadId} (${finalInquiry.customerName}) [${finalInquiry.leadCategory}]`
      },
      {
        io: (req as any).io,
        tenantId: inquiryTenantId,
        userIds: inquiryTargetUserIds.length > 0 ? inquiryTargetUserIds : undefined
      }
    );

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
        notes: notes || null,
        organizationId: resolveWriteTenantId(req)
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

    const quickTenantId = finalInquiry.organizationId || resolveWriteTenantId(req) || null;
    if ((req as any).io) {
      (req as any).io.emit('new-live-curation', {
        id: finalInquiry.id,
        leadId: finalInquiry.leadId,
        message: `A traveler just planned an itinerary`,
        details: `${finalInquiry.destination} • Score: ${finalInquiry.leadScore}/100`,
        createdAt: new Date().toISOString()
      });
    }
    realtimeBus.publish('NEW_INQUIRY', finalInquiry, { io: (req as any).io, tenantId: quickTenantId });
    realtimeBus.publish(
      'new-system-event',
      {
        type: 'NEW_LEAD_CAPTURED',
        leadId: finalInquiry.leadId,
        inquiry: finalInquiry,
        message: `New Lead: ${finalInquiry.leadId} (${finalInquiry.customerName}) [${finalInquiry.leadCategory}]`
      },
      { io: (req as any).io, tenantId: quickTenantId }
    );

    // Schedule an automated AI remarketing follow-up nudge if the lead drops off
    try {
      await emailQueueService.enqueueSearchNudge({
        customerName: finalInquiry.customerName,
        customerPhone: finalInquiry.phone && finalInquiry.phone !== 'Not Provided' ? finalInquiry.phone : undefined,
        customerEmail: finalInquiry.email,
        destination: finalInquiry.destination,
        searchedEntity: finalInquiry.intentQuery || finalInquiry.destination,
        checkIn: finalInquiry.travelStartDate || undefined,
        delaySeconds: 1800, // 30 minutes
        io: (req as any).io
      });
    } catch (nudgeErr: any) {
      console.warn('Failed to enqueue abandoned lead nudge:', nudgeErr.message);
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

    const enrichedTenantId = updated.organizationId || resolveWriteTenantId(req) || null;
    realtimeBus.publish('LEAD_UPDATED', updated, { io: (req as any).io, tenantId: enrichedTenantId });
    realtimeBus.publish(
      'new-system-event',
      {
        type: 'LEAD_ENRICHED',
        leadId: updated.leadId,
        inquiry: updated,
        message: `Lead ${updated.leadId} enriched! New Score: ${updated.leadScore}/100 (${updated.sentiment})`
      },
      { io: (req as any).io, tenantId: enrichedTenantId }
    );

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

    const callbackTenantId = resolveWriteTenantId(req);
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
        profileCompleteness: 60,
        organizationId: callbackTenantId
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

    const cbTenant = finalInquiry.organizationId || callbackTenantId || null;
    if ((req as any).io) {
      (req as any).io.emit('new-live-curation', {
        id: finalInquiry.id,
        leadId: finalInquiry.leadId,
        message: `VIP Guest requested immediate consultation callback`,
        details: `Dial window: ${preferredTime || 'Immediate'}`,
        createdAt: new Date().toISOString()
      });
    }
    realtimeBus.publish('NEW_INQUIRY', finalInquiry, { io: (req as any).io, tenantId: cbTenant });
    realtimeBus.publish(
      'new-system-event',
      {
        type: 'URGENT_CALLBACK',
        leadId: finalInquiry.leadId,
        inquiry: finalInquiry,
        message: `🔥 URGENT CALLBACK: ${finalInquiry.customerName} (${finalInquiry.phone}) requested a call!`
      },
      { io: (req as any).io, tenantId: cbTenant }
    );

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
      netPrice,
      adultsCount,
      childrenCount,
      arrivalCity,
      transportPreference,
      notes,
      leadStage
    } = req.body;

    const existing = await p.inquiry.findUnique({
      where: { id: req.params.id }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }
    if (!canAccessTenantRecord(req as any, existing.organizationId)) {
      return res.status(403).json({ error: 'Forbidden: Cross-tenant inquiry update denied' });
    }

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
    const resolvedPrice = netPrice !== undefined ? netPrice : (req.body.customPrice !== undefined ? req.body.customPrice : req.body.estimatedBudget);
    if (resolvedPrice !== undefined && !isNaN(Number(resolvedPrice)) && Number(resolvedPrice) >= 0) {
      data.netPrice = Number(resolvedPrice);
    }
    if (adultsCount !== undefined && !isNaN(Number(adultsCount))) data.adultsCount = Number(adultsCount);
    if (childrenCount !== undefined && !isNaN(Number(childrenCount))) data.childrenCount = Number(childrenCount);
    if (arrivalCity !== undefined) data.arrivalCity = arrivalCity ? String(arrivalCity) : null;
    if (transportPreference !== undefined) data.transportPreference = transportPreference ? String(transportPreference) : null;
    if (notes !== undefined) data.notes = notes ? String(notes) : null;

    const inquiry = await p.inquiry.update({
      where: { id: req.params.id },
      data
    });

    const activity = await p.leadActivity.create({
      data: {
        inquiryId: inquiry.id,
        type: 'PROFILE_UPDATED',
        title: 'Lead profile updated',
        description: `Updated by ${(req as any).user?.name || (req as any).user?.employeeCode || 'Staff'}`,
        performedBy: (req as any).user?.employeeCode || (req as any).user?.name || 'System'
      }
    }).catch(() => null);

    const tenantId = inquiry.organizationId || (req as any).tenantId || null;
    realtimeBus.publish('LEAD_UPDATED', { leadId: inquiry.id, lead: inquiry, organizationId: tenantId }, {
      io: (req as any).io,
      tenantId
    });
    if (activity) {
      realtimeBus.publish('ACTIVITY_LOGGED', { ...activity, inquiry }, { io: (req as any).io, tenantId });
    }
    realtimeBus.publish('new-system-event', {
      type: 'UPDATE',
      message: `Inquiry ${inquiry.customerName || inquiry.id} updated by ${(req as any).user?.name || 'System'}`,
      booking: { ...inquiry, entityType: 'inquiry' },
      timestamp: new Date().toISOString()
    }, { io: (req as any).io, tenantId });

    res.json(inquiry);
  } catch (error: any) {
    if (error?.code === 'P2025' || error?.message?.includes('P2025') || (error?.message && error.message.includes('Record to update not found'))) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }
    console.error('Inquiry update error:', (error as any).message);
    res.status(500).json({ error: 'Failed to update inquiry' });
  }
};

export const sendProposal = async (req: Request, res: Response) => {
  try {
    const p = prisma as any;
    const existing = await p.inquiry.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }
    if (!canAccessTenantRecord(req as any, existing.organizationId)) {
      return res.status(403).json({ error: 'Forbidden: Cross-tenant proposal dispatch denied' });
    }
    
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

    const existing = await p.inquiry.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }
    if (!canAccessTenantRecord(req as any, existing.organizationId)) {
      return res.status(403).json({ error: 'Forbidden: Cross-tenant inquiry deletion denied' });
    }

    // Delete any linked hotel reservations, then delete the inquiry
    await p.$transaction([
      p.hotelReservation.deleteMany({
        where: { inquiryId: id }
      }),
      p.inquiry.delete({
        where: { id }
      })
    ]);

    const tenantId = existing.organizationId || (req as any).tenantId || null;
    realtimeBus.publish('LEAD_DELETED', { id, organizationId: tenantId }, { io: (req as any).io, tenantId });
    realtimeBus.publish('new-system-event', {
      type: 'DELETE',
      message: `Inquiry ${existing.customerName || id} permanently deleted from database`,
      booking: { id, entityType: 'inquiry' },
      timestamp: new Date().toISOString()
    }, { io: (req as any).io, tenantId });

    res.json({ success: true, message: 'Inquiry permanently deleted' });
  } catch (error: any) {
    console.error('Delete inquiry error:', error.message);
    res.status(500).json({ error: 'Failed to delete inquiry' });
  }
};

/**
 * Track customer search and optionally enqueue an automated AI remarketing nudge
 */
export const trackCustomerSearchIntent = async (req: Request, res: Response) => {
  try {
    const p = prisma as any;
    const {
      customerName,
      customerPhone,
      customerEmail,
      searchType = 'HOTEL',
      destination,
      checkIn,
      checkOut,
      guestsCount = 2,
      roomsCount = 1,
      budgetTier,
      searchedEntity,
      metadata,
      delaySeconds = 1800 // 30 mins
    } = req.body;

    const userId = (req as any).user?.id || null;

    const searchIntent = await p.customerSearchIntent.create({
      data: {
        userId,
        customerName: customerName || null,
        customerPhone: customerPhone || null,
        customerEmail: customerEmail || null,
        searchType,
        destination: destination || null,
        checkIn: checkIn ? new Date(checkIn) : null,
        checkOut: checkOut ? new Date(checkOut) : null,
        guestsCount: Number(guestsCount) || 2,
        roomsCount: Number(roomsCount) || 1,
        budgetTier: budgetTier || null,
        searchedEntity: searchedEntity || null,
        metadata: metadata ? JSON.stringify(metadata) : null,
        status: (customerPhone || customerEmail) ? 'NUDGE_ENQUEUED' : 'SEARCHED'
      }
    });

    // If contact is provided, schedule automated AI remarketing follow-up
    let jobResult: any = null;
    if (customerPhone || customerEmail) {
      jobResult = await emailQueueService.enqueueSearchNudge({
        searchIntentId: searchIntent.id,
        customerName,
        customerPhone,
        customerEmail,
        searchType,
        searchedEntity,
        destination,
        checkIn,
        checkOut,
        budgetTier,
        guestsCount,
        delaySeconds: Number(delaySeconds) || 1800,
        io: (req as any).io
      });
    }

    res.status(201).json({
      success: true,
      searchIntentId: searchIntent.id,
      enqueued: Boolean(jobResult?.enqueued),
      message: 'Search intent logged. AI nudge scheduled if customer abandons.'
    });
  } catch (error: any) {
    console.error('Track search intent error:', error.message);
    res.status(500).json({ error: 'Failed to track search intent' });
  }
};

/**
 * Fetch recent search intents for operations visibility
 */
export const getCustomerSearchIntents = async (req: Request, res: Response) => {
  try {
    const p = prisma as any;
    const { status, limit = 50 } = req.query;
    const where: any = {};
    if (status) where.status = String(status);

    const intents = await p.customerSearchIntent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Number(limit) || 50,
      include: { inquiry: true }
    });

    res.json(intents);
  } catch (error: any) {
    console.error('Fetch search intents error:', error.message);
    res.status(500).json({ error: 'Failed to fetch search intents' });
  }
};

/**
 * Manually trigger direct search nudge for a specific logged search intent
 */
export const triggerDirectSearchNudge = async (req: Request, res: Response) => {
  try {
    const p = prisma as any;
    const id = String(req.params.id);

    const intent = await p.customerSearchIntent.findUnique({
      where: { id }
    });

    if (!intent) {
      return res.status(404).json({ error: 'Search intent record not found' });
    }

    const result = await emailQueueService.processCustomerSearchNudge({
      searchIntentId: intent.id,
      customerName: intent.customerName,
      customerPhone: intent.customerPhone,
      customerEmail: intent.customerEmail,
      searchType: intent.searchType,
      searchedEntity: intent.searchedEntity,
      destination: intent.destination,
      checkIn: intent.checkIn,
      checkOut: intent.checkOut,
      budgetTier: intent.budgetTier,
      guestsCount: intent.guestsCount,
      io: (req as any).io
    });

    res.json({
      success: true,
      message: 'Direct AI Customer Nudge dispatched successfully!',
      result
    });
  } catch (error: any) {
    console.error('Direct search nudge error:', error.message);
    res.status(500).json({ error: 'Failed to trigger customer nudge' });
  }
};
