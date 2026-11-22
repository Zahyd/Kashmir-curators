import prisma from '../lib/prisma';
import { CRMService } from './crmService';
import { WhatsAppWorkflowEngine } from './whatsappService';
import { broadcastSalesEvent } from '../routes/salesRoutes';
import { notificationService } from './notificationService';
import { io } from '../index';

export interface MetaLeadFieldData {
  name: string;
  values: string[];
}

export interface MetaLeadPayload {
  leadgen_id?: string;
  form_id?: string;
  ad_id?: string;
  page_id?: string;
  created_time?: string | number;
  fullName?: string;
  phone?: string;
  email?: string;
  destination?: string;
  duration?: string;
  travelers?: string;
  budgetTier?: string;
  hotelPreference?: string;
}

export class MetaLeadAutomationService {
  /**
   * 1. Auto-pricing engine for Meta Inbound Leads
   * Calculates real wholesale base costs + customized agency margin in seconds.
   */
  public static calculateInstantQuote(durationStr: string, hotelTier: string, travelerCountStr: string): {
    calculatedPrice: number;
    hotelDesc: string;
    vehicleDesc: string;
    durationDays: number;
  } {
    // Extract number of days/nights
    const daysMatch = (durationStr || '5').match(/\d+/);
    const days = daysMatch ? Math.min(14, Math.max(3, parseInt(daysMatch[0], 10))) : 5;
    const nights = days - 1;

    // Hotel rates per night
    const hotelTierUpper = (hotelTier || '4_STAR').toUpperCase();
    let perNightHotel = 7500; // 4-Star default
    let hotelDesc = '4-Star Mountain Boutique Resorts & Pine Chalets';

    if (hotelTierUpper.includes('5') || hotelTierUpper.includes('LUXURY') || hotelTierUpper.includes('ELITE')) {
      perNightHotel = 16500;
      hotelDesc = '5-Star Luxury Mountain Resort (Gulmarg) & Cedar Houseboat';
    } else if (hotelTierUpper.includes('3') || hotelTierUpper.includes('DELUXE') || hotelTierUpper.includes('STANDARD')) {
      perNightHotel = 4200;
      hotelDesc = '3-Star Premium Deluxe Hotels & Houseboat';
    }

    // Cab rates (Dedicated Commercial Innova Crysta / 4x4)
    const perDayCab = 3850;
    const vehicleDesc = 'Dedicated Private Toyota Innova Crysta (Police Verified Chauffeur)';

    // Inclusions: Houseboat stay + Shikara crossing
    const houseboatAddon = 6500;

    const baseCost = (nights * perNightHotel) + (days * perDayCab) + houseboatAddon;
    // 18% agency profit margin
    const margin = Math.round(baseCost * 0.18);
    const finalPrice = Math.round((baseCost + margin) / 500) * 500; // Round to nearest ₹500

    return {
      calculatedPrice: finalPrice,
      hotelDesc,
      vehicleDesc,
      durationDays: days
    };
  }

  /**
   * 2. Process, Ingest, Auto-Quote, and Handshake an incoming Meta Lead
   */
  public static async processInboundMetaLead(rawLead: MetaLeadPayload): Promise<any> {
    console.log(`[MetaLeadAutomation] Ingesting new inbound lead from Meta Graph...`);

    const customerName = rawLead.fullName || 'Valued Traveler';
    const rawPhone = rawLead.phone || '';
    const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
    const email = rawLead.email || 'traveler@instagram-inquiry.com';
    const destination = rawLead.destination || 'Srinagar, Gulmarg & Pahalgam';
    const duration = rawLead.duration || '5 Nights / 6 Days';
    const travelers = rawLead.travelers || '2 Adults';
    const hotelPreference = rawLead.hotelPreference || '4-Star Mountain Boutique';

    // 1. Calculate Instant Auto-Quote
    const quote = this.calculateInstantQuote(duration, hotelPreference, travelers);

    // 2. Persist to Neon DB
    const p = prisma as any;
    const inquiry = await p.inquiry.create({
      data: {
        customerName,
        phone: cleanPhone || '+919906000000',
        email,
        destination,
        duration,
        travelers,
        budget: `₹${quote.calculatedPrice.toLocaleString('en-IN')}`,
        netPrice: quote.calculatedPrice,
        accommodation: quote.hotelDesc,
        preferredAccommodation: quote.hotelDesc,
        transportPreference: quote.vehicleDesc,
        status: 'Pending Curation',
        leadStage: 'QUOTE_SENT',
        priority: 'HIGH',
        leadScore: 88,
        leadCategory: 'META_AD_CONVERT',
        sourceCta: 'META_INSTAGRAM_AD',
        notes: `Auto-quoted instantly via Meta Lead Automation. Package value: ₹${quote.calculatedPrice.toLocaleString('en-IN')}. Awaiting traveler response.`
      }
    });

    console.log(`[MetaLeadAutomation] Lead #${inquiry.id.slice(0, 8)} created in DB.`);

    // 3. Automated Round-Robin Routing to an active online concierge
    let assignedStaff: any = null;
    try {
      assignedStaff = await CRMService.assignLeadRoundRobin(inquiry.id);
    } catch (err: any) {
      console.warn('[MetaLeadAutomation] Round-robin warning:', err.message);
    }

    const conciergeName = assignedStaff?.name || 'Zahid Ahmad';
    const conciergePhone = assignedStaff?.phone || '+91 99060 12345';
    const conciergeCode = assignedStaff?.employeeCode || assignedStaff?.code || 'SALES001';

    // 4. Generate Interactive Public Web Proposal Link
    const baseUrl = process.env.PUBLIC_APP_URL || 'https://kashmir-curators.vercel.app';
    const proposalUrl = `${baseUrl}/itinerary/${inquiry.id}`;

    // 5. Build Luxury WhatsApp Proposal Message
    const whatsAppMessage = 
      `🏔️ *SALAAM & GREETINGS FROM THE KASHMIR CURATORS* 🏔️\n\n` +
      `Dear *${customerName}*,\n` +
      `We have instantly received your holiday inquiry from Instagram! Here is your bespoke Kashmir travel blueprint:\n\n` +
      `📍 *Curated Circuit*: ${destination}\n` +
      `⏳ *Duration*: ${duration} (Private Customized Tour)\n` +
      `🏨 *Stays*: ${quote.hotelDesc}\n` +
      `🚗 *Chauffeur Transport*: ${quote.vehicleDesc}\n` +
      `✨ *Special Experience*: Luxury Nigeen Lake Cedar Houseboat with Shikara transfers\n\n` +
      `💰 *Estimated Package Price*: *₹${quote.calculatedPrice.toLocaleString('en-IN')}* (All-inclusive stays, private cab & breakfast)\n\n` +
      `👉 *View Complete Interactive Itinerary, Hotel Photos & Day-by-Day Route*:\n${proposalUrl}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `👤 *Your Dedicated Srinagar Concierge*:\n` +
      `*${conciergeName}* (${conciergeCode}) has been personally assigned to curate your dates and manage your arrival.\n\n` +
      `Reply *'CALL'* or *'CHAT'* to connect with ${conciergeName} on this chat right now to adjust dates or lock your seasonal discount! ✨`;

    // 6. Dispatch Instant WhatsApp Outbound Message
    if (cleanPhone) {
      try {
        await WhatsAppWorkflowEngine.executeWhatsAppSenderNode(cleanPhone, whatsAppMessage);
        console.log(`[MetaLeadAutomation] Instant WhatsApp quote dispatched to ${cleanPhone}.`);
      } catch (waErr: any) {
        console.warn(`[MetaLeadAutomation] WhatsApp dispatch notice:`, waErr.message);
      }
    }

    // 7. Real-Time Broadcast to SalesPro Dashboard (SSE Stream)
    try {
      broadcastSalesEvent('NEW_INQUIRY', {
        ...inquiry,
        assignedTo: conciergeCode,
        assignedToName: conciergeName,
        source: 'META_INSTAGRAM_AD',
        quoteAmount: quote.calculatedPrice
      });

      broadcastSalesEvent('LEAD_AUTO_QUOTED', {
        leadId: inquiry.id,
        customerName,
        phone: cleanPhone,
        price: quote.calculatedPrice,
        concierge: conciergeName
      });
    } catch (sseErr: any) {
      console.warn('[MetaLeadAutomation] SSE broadcast notice:', sseErr.message);
    }

    // 8. Push System Event to Admin WebSockets
    if (io) {
      notificationService.emitSystemEvent(
        io,
        'CREATE',
        `🚀 Live Meta Ad Lead: ${customerName} auto-quoted ₹${quote.calculatedPrice.toLocaleString('en-IN')} on WhatsApp!`,
        { ...inquiry, entityType: 'inquiry' }
      );
    }

    return {
      success: true,
      inquiryId: inquiry.id,
      customerName,
      assignedTo: conciergeName,
      quoteAmount: quote.calculatedPrice,
      proposalUrl
    };
  }
}
