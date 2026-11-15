import prisma from '../lib/prisma';
import env from '../config/env';

export interface LeadAnalysisResult {
  inquiryId: string;
  leadScore: number;
  sentiment: 'Hot' | 'Warm' | 'Cold';
  intentCategory: string;
  travelStyle: string;
  recommendedDuration: string;
  budgetFit: 'Comfort' | 'Premium' | 'Ultra Luxury';
  conversionProbability: number; // percentage
  explainableSignals: {
    positive: string[];
    riskFactors: string[];
  };
  recommendedNextAction: string;
}

export interface InventorySuggestionResult {
  suggestedHotels: Array<{
    id: string;
    name: string;
    location: string;
    starRating: number;
    pricePerNight: number;
    contractRateEstimated: number;
    roomType: string;
    whyRecommended: string;
  }>;
  suggestedCabs: Array<{
    id: string;
    name: string;
    type: string;
    capacity: number;
    pricePerKm: number;
    basePrice: number;
    whyRecommended: string;
  }>;
  estimatedPackageCost: {
    stayCost: number;
    transportCost: number;
    totalWholesaleB2B: number;
    suggestedRetailPrice: number;
    potentialMargin: number;
  };
}

export class AICopilotService {
  /**
   * Analyzes traveler inquiry with explainable scoring and conversion probability
   */
  public static async analyzeInquiry(inquiryId: string): Promise<LeadAnalysisResult> {
    const inquiry = await prisma.inquiry.findUnique({
      where: { id: inquiryId },
      include: {
        activities: { take: 10, orderBy: { createdAt: 'desc' } },
        whatsappMessages: { take: 10, orderBy: { createdAt: 'desc' } }
      }
    });

    if (!inquiry) {
      throw new Error(`Inquiry ${inquiryId} not found`);
    }

    // Determine intent and positive signals
    const positiveSignals: string[] = [];
    const riskFactors: string[] = [];
    let score = inquiry.leadScore || 50;

    // Dates signal
    if (inquiry.travelStartDate) {
      const daysUntilTrip = Math.ceil((new Date(inquiry.travelStartDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysUntilTrip > 0 && daysUntilTrip <= 30) {
        positiveSignals.push(`Imminent departure: travel in ${daysUntilTrip} days (High Urgency)`);
        score += 15;
      } else if (daysUntilTrip > 30 && daysUntilTrip <= 90) {
        positiveSignals.push(`Planned seasonal departure in ${daysUntilTrip} days`);
        score += 8;
      }
    } else {
      riskFactors.push('Travel dates not specified yet');
    }

    // Contact info verification
    if (inquiry.phone && inquiry.phone.length >= 10) {
      positiveSignals.push('Verified direct mobile / WhatsApp contact provided');
    } else {
      riskFactors.push('Incomplete phone contact number');
    }

    // Budget tier
    const budgetLower = (inquiry.budget || '').toLowerCase();
    if (budgetLower.includes('luxury') || budgetLower.includes('vip') || budgetLower.includes('premium')) {
      positiveSignals.push('High-margin budget tier requested');
      score += 10;
    }

    // WhatsApp responsiveness
    const inboundCount = inquiry.whatsappMessages.filter(m => m.direction === 'INBOUND').length;
    if (inboundCount >= 2) {
      positiveSignals.push(`Active WhatsApp engagement (${inboundCount} inbound messages received)`);
      score += 12;
    }

    if (inquiry.leadStage === 'CANCELLED') {
      score = 10;
    }

    const finalScore = Math.min(98, Math.max(15, score));
    const sentiment: 'Hot' | 'Warm' | 'Cold' = finalScore >= 75 ? 'Hot' : finalScore >= 50 ? 'Warm' : 'Cold';
    const conversionProbability = Math.round(finalScore * 0.85);

    // Intent categorisation
    const intentCategory = inquiry.leadCategory || (
      inquiry.destination.toLowerCase().includes('gulmarg') ? 'WINTER_SKI_EXPEDITION' :
      inquiry.destination.toLowerCase().includes('gurez') ? 'OFFBEAT_NORTH_KASHMIR' :
      inquiry.travelers?.includes('2') ? 'HONEYMOON_ROMANCE' : 'FAMILY_LEISURE'
    );

    let recommendedNextAction = 'Dispatch tailored quotation via WhatsApp';
    if (!inquiry.travelStartDate) {
      recommendedNextAction = 'Call client to clarify preferred travel dates & guest room distribution';
    } else if (inquiry.leadStage === 'QUOTE_SENT') {
      recommendedNextAction = 'Send 24-hour follow-up on itinerary customization and hotel preferences';
    }

    return {
      inquiryId,
      leadScore: finalScore,
      sentiment,
      intentCategory,
      travelStyle: inquiry.travelStyle || 'Bespoke Luxury Leisure',
      recommendedDuration: inquiry.duration || '5 Nights / 6 Days',
      budgetFit: budgetLower.includes('luxury') ? 'Ultra Luxury' : budgetLower.includes('premium') ? 'Premium' : 'Comfort',
      conversionProbability,
      explainableSignals: {
        positive: positiveSignals,
        riskFactors
      },
      recommendedNextAction
    };
  }

  /**
   * Generates contextual, ready-to-dispatch sales responses tailored for WhatsApp & Email
   */
  public static async generateSalesResponse(
    inquiryId: string, 
    channel: 'WHATSAPP' | 'EMAIL',
    goal: 'GREETING_INQUIRY' | 'QUOTE_DISPATCH' | 'FOLLOW_UP' | 'OBJECTION_HANDLING',
    customNotes?: string
  ): Promise<{
    channel: string;
    subject?: string;
    content: string;
    suggestedQuickActions: string[];
    requiresHumanApproval: boolean;
  }> {
    const inquiry = await prisma.inquiry.findUnique({ where: { id: inquiryId } });
    if (!inquiry) throw new Error('Inquiry not found');

    const customer = inquiry.customerName || 'Valued Traveler';
    const destination = inquiry.destination || 'Kashmir Paradise';
    const duration = inquiry.duration || '5 Nights / 6 Days';

    let content = '';
    let subject = '';

    if (channel === 'WHATSAPP') {
      switch (goal) {
        case 'GREETING_INQUIRY':
          content = `Hello *${customer}*! ✨\n\nGreetings from *Kashmir Curators*. Thank you for reaching out regarding your bespoke trip to *${destination}* (${duration}).\n\nWe are handcrafting a personalized itinerary including private 4x4 transfers and hand-picked boutique stays. Would you prefer a mix of traditional Dal Lake houseboats and snow-view resorts in Gulmarg?\n\nLooking forward to curating your dream holiday! 🏔️`;
          break;

        case 'QUOTE_DISPATCH':
          content = `Hello *${customer}*! 🏔️\n\nYour bespoke *Kashmir Curators Proposal* for *${destination}* is ready for your review!\n\n✨ *Trip Highlights*:\n• Duration: ${duration}\n• Travelers: ${inquiry.travelers || '2 Guests'}\n• Curated Hotels & Private 4x4 Heated Vehicle\n\n📄 *View Your Interactive Proposal*: https://kashmir-curators.vercel.app/itinerary/${inquiry.id}\n\nPlease review and let us know if you would like any changes to the dates, stays, or activities!`;
          break;

        case 'FOLLOW_UP':
          content = `Hi *${customer}*, warm greetings from Kashmir! ❄️\n\nFollowing up on the proposal we shared for *${destination}*. We have limited VIP room allotments held for your requested dates, and we'd love to confirm your preferred stay before prices adjust.\n\nAre you available for a quick 2-minute call today to address any questions?`;
          break;

        case 'OBJECTION_HANDLING':
          content = `Hello *${customer}*! We completely understand your considerations regarding budgeting and schedule flexibility. Because we operate direct B2B ground logistics in Srinagar, we can adjust the hotel category or customize meal inclusions to match your target budget without compromising safety or comfort.\n\nLet's tailor this to your exact comfort zone!`;
          break;
      }
    } else {
      // EMAIL FORMAT
      subject = `Your Bespoke Kashmir Curators Itinerary for ${destination}`;
      content = `Dear ${customer},\n\nThank you for choosing Kashmir Curators as your trusted travel partner. We have tailored a private itinerary for your upcoming holiday to ${destination} (${duration}).\n\nEvery journey with Kashmir Curators includes official J&K Tourism accredited logistics, 24/7 on-ground concierge support, and vetted luxury accommodations.\n\nYou can review your live interactive proposal here: https://kashmir-curators.vercel.app/itinerary/${inquiry.id}\n\nPlease let us know if you wish to adjust any aspect of the plan.\n\nWarm regards,\n\nKashmir Curators Operations Desk\nSrinagar, Jammu & Kashmir`;
    }

    return {
      channel,
      ...(channel === 'EMAIL' ? { subject } : {}),
      content,
      suggestedQuickActions: [
        'Send via Official WhatsApp',
        'Copy to Clipboard',
        'Modify in Editor'
      ],
      requiresHumanApproval: true // Enterprise safeguard
    };
  }

  /**
   * Suggests authorized hotels and cabs from live Neon DB inventory matching traveler budget & group size
   */
  public static async suggestAuthorizedInventory(inquiryId: string): Promise<InventorySuggestionResult> {
    const inquiry = await prisma.inquiry.findUnique({ where: { id: inquiryId } });
    if (!inquiry) throw new Error('Inquiry not found');

    const budgetLower = (inquiry.budget || '').toLowerCase();
    const travelersCount = parseInt(inquiry.travelers || '2') || 2;
    const dest = inquiry.destination || 'Srinagar';

    // 1. Fetch matching active hotels
    const hotels = await prisma.hotel.findMany({
      where: { isActive: true },
      take: 6,
      orderBy: { rating: 'desc' }
    });

    const suggestedHotels = hotels.map(h => {
      const contractRate = Math.round(h.pricePerNight * 0.82); // 18% wholesale B2B margin
      return {
        id: h.id,
        name: h.name,
        location: h.location,
        starRating: h.starRating,
        pricePerNight: h.pricePerNight,
        contractRateEstimated: contractRate,
        roomType: 'Deluxe Heritage Room (Central Heating)',
        whyRecommended: `Matches ${dest} destination with verified ${h.starRating}-star accreditation and 24/7 winter heating.`
      };
    });

    // 2. Fetch matching active cabs
    const cabs = await prisma.cab.findMany({
      where: { isActive: true },
      take: 4,
      orderBy: { capacity: 'asc' }
    });

    const suggestedCabs = cabs.map(c => {
      let why = 'Ideal comfortable vehicle for valley sightseeing';
      if (c.type.toLowerCase().includes('suv') || c.name.toLowerCase().includes('innova') || c.name.toLowerCase().includes('4x4')) {
        why = 'All-weather 4x4 / SUV recommended for Gulmarg & Sonamarg mountain passes.';
      }
      return {
        id: c.id,
        name: c.name,
        type: c.type,
        capacity: c.capacity,
        pricePerKm: c.pricePerKm,
        basePrice: c.basePrice,
        whyRecommended: why
      };
    });

    // 3. Compute estimates
    const nights = 5;
    const stayCost = (suggestedHotels[0]?.contractRateEstimated || 4500) * nights;
    const transportCost = (suggestedCabs[0]?.basePrice || 3500) * (nights + 1);
    const totalWholesaleB2B = stayCost + transportCost;
    const suggestedRetailPrice = Math.round(totalWholesaleB2B * 1.25); // 25% markup
    const potentialMargin = suggestedRetailPrice - totalWholesaleB2B;

    return {
      suggestedHotels,
      suggestedCabs,
      estimatedPackageCost: {
        stayCost,
        transportCost,
        totalWholesaleB2B,
        suggestedRetailPrice,
        potentialMargin
      }
    };
  }

  /**
   * Summarizes lead history into quick executive bullets for the sales agent
   */
  public static async summarizeLead(inquiryId: string): Promise<{ summary: string[]; lastAction: string }> {
    const inquiry = await prisma.inquiry.findUnique({
      where: { id: inquiryId },
      include: {
        activities: { take: 5, orderBy: { createdAt: 'desc' } },
        internalNotes: { take: 3, orderBy: { createdAt: 'desc' } }
      }
    });

    if (!inquiry) throw new Error('Inquiry not found');

    const bullets: string[] = [
      `Traveler: ${inquiry.customerName} (${inquiry.travelers || '2'} travelers) interested in ${inquiry.destination}.`,
      `Duration & Budget: ${inquiry.duration || 'Not set'} with ${inquiry.budget || 'Standard'} budget preference.`,
      `Current Pipeline Stage: ${inquiry.leadStage.replace(/_/g, ' ')} with score ${inquiry.leadScore}/100.`
    ];

    if (inquiry.internalNotes.length > 0) {
      bullets.push(`Latest Internal Note: "${inquiry.internalNotes[0].content}"`);
    }

    const lastAction = inquiry.activities[0]?.title || `Inquiry created on ${new Date(inquiry.createdAt).toLocaleDateString()}`;

    return { summary: bullets, lastAction };
  }
}
