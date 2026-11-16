import { GoogleGenAI } from '@google/genai';
import prisma from '../lib/prisma';

export interface InboundParsedResult {
  intent: 'CONFIRM_BOOKING' | 'CONFIRM_AVAILABILITY' | 'OFFER_ALTERNATIVE' | 'REJECT_SOLD_OUT' | 'CLARIFICATION' | 'OTHER';
  hotelConfirmationNumber?: string | null;
  confirmedRoomType?: string | null;
  confirmedRoomsCount?: number | null;
  confirmedTariff?: number | null;
  confirmedMealPlan?: string | null;
  alternativeOffer?: {
    roomType?: string;
    tariff?: number;
    dates?: string;
    notes?: string;
  } | null;
  rejectionReason?: string | null;
  bukhariHeatingConfirmed?: boolean | null;
  notes: string;
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'URGENT' | 'DISPUTE';
  confidence: number;
  summary: string;
}

const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
const ai = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;

/**
 * Intelligent Rule-based fallback parser if Gemini API Key is not configured
 */
function heuristicFallbackParse(rawText: string, context?: any): InboundParsedResult {
  const lower = rawText.toLowerCase();

  // 1. Detect Confirmation Number / CRS
  let confirmationNumber: string | null = null;
  const crsMatch = rawText.match(/(?:confirmation|crs|booking|ref|reference)\s*(?:#|no\.?|number|id|code)?[:\s-]*([A-Za-z0-9-_]{3,20})/i);
  if (crsMatch && crsMatch[1]) {
    confirmationNumber = crsMatch[1].trim();
  }

  // 2. Detect Tariff
  let tariff: number | null = null;
  const tariffMatch = rawText.match(/(?:tariff|rate|price|amount|rs\.?|inr|₹)\s*[:\s]*([0-9]+(?:,[0-9]+)?)/i);
  if (tariffMatch && tariffMatch[1]) {
    tariff = parseFloat(tariffMatch[1].replace(/,/g, ''));
  }

  // 3. Detect Heating / Bukhari
  const bukhariConfirmed = lower.includes('bukhari') || lower.includes('heating') || lower.includes('heater') || lower.includes('electric blanket');

  // 4. Detect Intent
  let intent: InboundParsedResult['intent'] = 'OTHER';
  let summary = 'Hotel reply received via email.';
  let confidence = 0.75;

  if (lower.includes('sold out') || lower.includes('no inventory') || lower.includes('no rooms') || lower.includes('fully booked') || lower.includes('regret to inform')) {
    intent = 'REJECT_SOLD_OUT';
    summary = 'Hotel declared property sold out / unavailable.';
  } else if (lower.includes('alternative') || lower.includes('instead') || lower.includes('upgrade') || lower.includes('different category') || lower.includes('other dates')) {
    intent = 'OFFER_ALTERNATIVE';
    summary = 'Hotel proposed an alternative room category or revised dates.';
  } else if (confirmationNumber || lower.includes('confirmed') || lower.includes('guaranteed') || lower.includes('reservation is confirmed')) {
    intent = 'CONFIRM_BOOKING';
    summary = `Hotel confirmed guaranteed reservation with reference ${confirmationNumber || 'on file'}.`;
    confidence = 0.88;
  } else if (lower.includes('available') || lower.includes('blocked') || lower.includes('held') || lower.includes('can accommodate')) {
    intent = 'CONFIRM_AVAILABILITY';
    summary = 'Hotel verified availability and held room inventory.';
  } else if (lower.includes('?') || lower.includes('please clarify') || lower.includes('arrival time') || lower.includes('flight')) {
    intent = 'CLARIFICATION';
    summary = 'Hotel front desk requested clarification on guest schedule/preferences.';
  }

  return {
    intent,
    hotelConfirmationNumber: confirmationNumber,
    confirmedRoomType: context?.roomType || null,
    confirmedRoomsCount: context?.roomsCount || 1,
    confirmedTariff: tariff || context?.contractRate || null,
    confirmedMealPlan: context?.mealPlan || 'MAP',
    alternativeOffer: intent === 'OFFER_ALTERNATIVE' ? { notes: rawText.slice(0, 200) } : null,
    rejectionReason: intent === 'REJECT_SOLD_OUT' ? 'Sold Out / Fully Booked' : null,
    bukhariHeatingConfirmed: bukhariConfirmed,
    notes: rawText.slice(0, 300),
    sentiment: intent === 'REJECT_SOLD_OUT' ? 'DISPUTE' : intent === 'CONFIRM_BOOKING' ? 'POSITIVE' : 'NEUTRAL',
    confidence,
    summary
  };
}

export const aiAgentService = {
  /**
   * Parse an inbound hotel email reply using Google Gemini 2.5 Flash
   */
  async parseInboundHotelReply(params: {
    rawText: string;
    fromEmail: string;
    subject: string;
    reservationContext?: {
      guestName?: string;
      hotelName?: string;
      roomType?: string;
      roomsCount?: number;
      contractRate?: number;
      checkIn?: string;
      checkOut?: string;
      mealPlan?: string;
    };
  }): Promise<InboundParsedResult> {
    const { rawText, fromEmail, subject, reservationContext } = params;

    // Use heuristic fallback if AI client is not configured
    if (!ai) {
      console.log('[AiAgentService] Gemini API key not set in environment, using heuristic analysis.');
      return heuristicFallbackParse(rawText, reservationContext);
    }

    try {
      const prompt = `You are an expert luxury travel operations AI Agent for Kashmir Curators DMC (Kashmir, India).
Analyze this incoming email from a hotel partner reception responding to a guest reservation request.

RESERVATION CONTEXT:
- Lead Guest: ${reservationContext?.guestName || 'Unknown'}
- Property: ${reservationContext?.hotelName || 'Kashmir Partner Hotel'}
- Requested Room: ${reservationContext?.roomType || 'Standard'} (${reservationContext?.roomsCount || 1} Rooms)
- Contract Net Tariff: ₹${reservationContext?.contractRate || 0}/night
- Stay Dates: ${reservationContext?.checkIn || 'TBD'} to ${reservationContext?.checkOut || 'TBD'}
- Requested Meal Plan: ${reservationContext?.mealPlan || 'MAP'}

HOTEL INBOUND EMAIL:
Sender: ${fromEmail}
Subject: ${subject}
Message Body:
"""
${rawText}
"""

EXTRACT THE FOLLOWING IN STRICT JSON FORMAT:
1. "intent": One of ["CONFIRM_BOOKING", "CONFIRM_AVAILABILITY", "OFFER_ALTERNATIVE", "REJECT_SOLD_OUT", "CLARIFICATION", "OTHER"]
2. "hotelConfirmationNumber": The hotel's internal CRS or booking reference code (string or null)
3. "confirmedRoomType": The exact room category confirmed by reception (string or null)
4. "confirmedRoomsCount": Number of rooms confirmed (integer or null)
5. "confirmedTariff": Agreed net rate per night in INR (number or null)
6. "confirmedMealPlan": EP, CP, MAP, AP (string or null)
7. "alternativeOffer": null, or object {"roomType": string, "tariff": number, "dates": string, "notes": string}
8. "rejectionReason": Reason why hotel declined, if applicable (string or null)
9. "bukhariHeatingConfirmed": Boolean whether winter heating/Bukhari/electric blankets were acknowledged (boolean or null)
10. "notes": Clean summary of reception instructions or special remarks (string)
11. "sentiment": One of ["POSITIVE", "NEUTRAL", "URGENT", "DISPUTE"]
12. "confidence": Confidence score from 0.0 to 1.0 (number)
13. "summary": A crisp, professional 1-sentence operational summary of what happened.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const responseText = response.text?.trim() || '';
      const parsed = JSON.parse(responseText);

      return {
        intent: parsed.intent || 'OTHER',
        hotelConfirmationNumber: parsed.hotelConfirmationNumber || null,
        confirmedRoomType: parsed.confirmedRoomType || reservationContext?.roomType || null,
        confirmedRoomsCount: parsed.confirmedRoomsCount || reservationContext?.roomsCount || 1,
        confirmedTariff: parsed.confirmedTariff || reservationContext?.contractRate || null,
        confirmedMealPlan: parsed.confirmedMealPlan || reservationContext?.mealPlan || 'MAP',
        alternativeOffer: parsed.alternativeOffer || null,
        rejectionReason: parsed.rejectionReason || null,
        bukhariHeatingConfirmed: parsed.bukhariHeatingConfirmed ?? null,
        notes: parsed.notes || 'Analyzed by Kashmir Curators AI Operations Agent.',
        sentiment: parsed.sentiment || 'NEUTRAL',
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.95,
        summary: parsed.summary || 'Hotel reply parsed by AI Agent.'
      };
    } catch (err: any) {
      console.warn('[AiAgentService] Gemini invocation failed, falling back to heuristic:', err.message);
      return heuristicFallbackParse(rawText, reservationContext);
    }
  },

  /**
   * Apply AI-extracted data automatically to a reservation record
   */
  async applyAiExtractionToReservation(reservationId: string, result: InboundParsedResult, rawText: string) {
    const p = prisma as any;
    const reservation = await p.hotelReservation.findUnique({
      where: { id: reservationId },
      include: { hotel: true }
    });

    if (!reservation) {
      throw new Error(`Reservation ${reservationId} not found`);
    }

    const updates: any = {};
    let actionTitle = 'Hotel Reply Analyzed';
    let actionDesc = result.summary;

    if (result.intent === 'CONFIRM_BOOKING') {
      updates.status = 'Confirmed';
      updates.confirmationStage = 'HOTEL_CONFIRMED';
      updates.lifecycleStatus = 'HOTEL_CONFIRMED';
      if (result.hotelConfirmationNumber) updates.hotelConfirmationNumber = result.hotelConfirmationNumber;
      if (result.confirmedRoomType) updates.confirmedRoomType = result.confirmedRoomType;
      if (result.confirmedTariff) updates.confirmedTariff = result.confirmedTariff;
      if (result.confirmedMealPlan) updates.confirmedMealPlan = result.confirmedMealPlan;
      if (result.notes) updates.receptionNotes = result.notes;
      updates.respondedAt = new Date();
      updates.respondedBy = 'Hotel Reception (AI Parsed)';

      actionTitle = 'Booking Confirmed by AI Agent';
      actionDesc = `Auto-applied CRS code ${result.hotelConfirmationNumber || 'Guaranteed'} and locked reservation.`;
    } else if (result.intent === 'CONFIRM_AVAILABILITY') {
      updates.confirmationStage = 'AVAILABILITY_CONFIRMED';
      updates.lifecycleStatus = 'AVAILABILITY_CONFIRMED';
      if (result.notes) updates.receptionNotes = result.notes;
      updates.respondedAt = new Date();
      updates.respondedBy = 'Hotel Reception (AI Parsed)';

      actionTitle = 'Availability Verified by AI Agent';
      actionDesc = 'Room held on block. Awaiting final hotel CRS number.';
    } else if (result.intent === 'OFFER_ALTERNATIVE') {
      updates.confirmationStage = 'ALTERNATIVE_OFFERED';
      updates.lifecycleStatus = 'ALTERNATIVE_OFFERED';
      if (result.alternativeOffer?.roomType) updates.alternativeRoomType = result.alternativeOffer.roomType;
      if (result.alternativeOffer?.tariff) updates.alternativeTariff = result.alternativeOffer.tariff;
      if (result.alternativeOffer?.dates) updates.alternativeDates = result.alternativeOffer.dates;
      if (result.alternativeOffer?.notes) updates.alternativeNotes = result.alternativeOffer.notes;
      updates.respondedAt = new Date();

      actionTitle = 'Alternative Offer Detected by AI Agent';
      actionDesc = `Proposed ${result.alternativeOffer?.roomType || 'Category'} @ ₹${result.alternativeOffer?.tariff || 'Agreed'}/nt.`;
    } else if (result.intent === 'REJECT_SOLD_OUT') {
      updates.status = 'Rejected';
      updates.confirmationStage = 'REJECTED_UNAVAILABLE';
      updates.lifecycleStatus = 'SOLD_OUT';
      updates.rejectionReason = result.rejectionReason || '100% Sold Out / No Inventory';
      updates.respondedAt = new Date();

      actionTitle = 'Property Sold Out (AI Detected)';
      actionDesc = `Marked sold out. Rerouting alert sent to Kashmir Curators operations desk.`;
    }

    // Save reservation updates
    await p.hotelReservation.update({
      where: { id: reservationId },
      data: updates
    });

    // Record AI Action Log
    await p.aiAgentActionLog.create({
      data: {
        reservationId,
        actionType: result.intent,
        title: actionTitle,
        description: actionDesc,
        confidence: result.confidence,
        metadata: JSON.stringify({
          extracted: result,
          rawExcerpt: rawText.slice(0, 300)
        }),
        triggeredBy: 'AI_AGENT'
      }
    });

    return { reservationId, updates, actionTitle, actionDesc };
  },

  /**
   * Generate an intelligent follow-up reminder email using AI
   */
  async generateSmartFollowUp(params: {
    reservation: any;
    attemptCount: number;
  }): Promise<{ subject: string; html: string; urgencyLevel: string }> {
    const { reservation, attemptCount } = params;
    const hotelName = reservation.hotel?.name || 'Partner Hotel';
    const guestName = reservation.guestName;
    const checkInDate = new Date(reservation.checkIn).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    const bookingRef = reservation.bookingReference || reservation.id.slice(0, 8);

    let urgencyLevel = attemptCount === 1 ? 'NORMAL' : attemptCount === 2 ? 'ELEVATED' : 'CRITICAL_URGENT';

    let subject = attemptCount === 1
      ? `Follow-Up: Room Availability for ${guestName} (${bookingRef}) – Kashmir Curators`
      : attemptCount === 2
      ? `PRIORITY: Awaiting Hotel Confirmation for ${guestName} [${checkInDate}] – #${bookingRef}`
      : `URGENT ACTION REQUIRED: Arrival ${checkInDate} for ${guestName} – Kashmir Curators Reservation Desk`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; color: #f1f5f9; padding: 20px; }
    .card { background-color: #111827; border: 1px solid #374151; border-radius: 16px; max-width: 600px; margin: 0 auto; padding: 32px; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: bold; background-color: ${attemptCount > 1 ? '#ef4444' : '#f59e0b'}; color: #000; text-transform: uppercase; margin-bottom: 16px; }
    .title { font-size: 20px; font-weight: 900; margin: 0 0 8px 0; color: #f8fafc; }
    .desc { font-size: 14px; color: #94a3b8; line-height: 1.6; }
    .grid { background-color: #1f2937; border-radius: 12px; padding: 16px; margin: 20px 0; font-size: 13px; }
    .grid-row { display: flex; justify-content: space-between; margin-bottom: 8px; border-bottom: 1px solid #374151; padding-bottom: 8px; }
    .btn { display: inline-block; background-color: #f59e0b; color: #0f172a; font-weight: bold; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-size: 14px; margin-top: 16px; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">${urgencyLevel.replace('_', ' ')} NOTICE • ATTEMPT #${attemptCount}</div>
    <h2 class="title">Reservation Follow-Up Reminder</h2>
    <p class="desc">
      Dear Front Desk & Reservations Team at <strong>${hotelName}</strong>,<br><br>
      This is an automated operational follow-up regarding our reservation request dispatched for <strong>${guestName}</strong>. 
      ${attemptCount > 1 
        ? 'As the arrival date is approaching, we kindly request your prompt response so we can issue the guaranteed voucher and finalize airport transfers.'
        : 'Please verify room availability and confirm with your hotel CRS code or propose an alternative.'}
    </p>

    <div class="grid">
      <div class="grid-row"><span>Booking Reference:</span><strong style="color: #f59e0b; font-family: monospace;">#${bookingRef}</strong></div>
      <div class="grid-row"><span>Lead Guest:</span><strong>${guestName}</strong></div>
      <div class="grid-row"><span>Check-In Date:</span><strong>${checkInDate}</strong></div>
      <div class="grid-row"><span>Accommodation:</span><strong>${reservation.roomsCount}x ${reservation.roomType} (${reservation.mealPlan})</strong></div>
      <div class="grid-row" style="border: none; margin: 0; padding: 0;"><span>Agreed Net Rate:</span><strong style="color: #10b981;">₹${(reservation.contractRate || 0).toLocaleString('en-IN')}/nt</strong></div>
    </div>

    <p class="desc" style="font-size: 13px;">
      You can simply <strong>reply to this email</strong> directly (our AI Assistant will automatically extract your confirmation number and tariff), or click below to access the secure partner desk:
    </p>

    <a href="https://kashmir-curators.vercel.app/hospitality?tab=reception&id=${reservation.id}" class="btn">
      Confirm or Propose Alternative Online &rarr;
    </a>

    <p style="font-size: 11px; color: #64748b; margin-top: 24px; border-top: 1px solid #374151; padding-top: 12px;">
      Kashmir Curators Destination Management • 24/7 Operations Desk: +91 94190 88201 • reservations@kashmircurators.com
    </p>
  </div>
</body>
</html>`;

    return { subject, html, urgencyLevel };
  },

  /**
   * 3. AI-Powered Customer Search & Abandoned-Browse Nudge Generator
   * Generates tailored WhatsApp message and luxury HTML email for drop-off remarketing
   */
  async generateCustomerSearchNudge(params: {
    customerName?: string;
    searchType?: string;
    destination?: string;
    searchedEntity?: string;
    checkIn?: string | Date;
    checkOut?: string | Date;
    budgetTier?: string;
    guestsCount?: number;
  }): Promise<{
    whatsappText: string;
    emailSubject: string;
    emailHtml: string;
    curatorName: string;
  }> {
    const name = params.customerName && params.customerName !== 'Valued Traveler' ? params.customerName.split(' ')[0] : 'there';
    const entity = params.searchedEntity || params.destination || 'Kashmir Valley';
    const destination = params.destination || 'Kashmir';
    const guests = params.guestsCount || 2;
    const datesStr = params.checkIn 
      ? `around ${new Date(params.checkIn).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}` 
      : 'the upcoming season';

    const curatorName = 'Zahoor Ahmad (Senior Kashmir Travel Curator)';

    // Fallback WhatsApp message
    let whatsappText = `Salam & Hello ${name}! 🏔️\n\nI noticed you were exploring stays at *${entity}* for ${datesStr}. Winter suites with Bukhari heating and snow views are filling up quickly for those dates.\n\nAs your local Kashmir curator, I can hold an exclusive wholesale rate or customize a private 4x4 snow transit package for you.\n\nWould you like me to share room availability and our secret rates? Just reply to this message! ✨\n\n— *Kashmir Curators Concierge*`;

    // Fallback Email Subject & Body
    let emailSubject = `Special Inquiry Hold: Your ${entity} Stays in Kashmir (${datesStr})`;
    let emailHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #0b0f19; color: #f8fafc; margin: 0; padding: 24px; }
    .card { background-color: #111827; border: 1px solid #374151; border-radius: 16px; max-width: 600px; margin: 0 auto; padding: 32px; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: bold; background-color: #f59e0b; color: #000; text-transform: uppercase; margin-bottom: 16px; }
    .title { font-size: 22px; font-weight: 900; margin: 0 0 10px 0; color: #f8fafc; }
    .desc { font-size: 14px; color: #94a3b8; line-height: 1.6; }
    .highlight-box { background: linear-gradient(135deg, rgba(245,158,11,0.1), rgba(16,185,129,0.05)); border: 1px solid rgba(245,158,11,0.25); border-radius: 12px; padding: 18px; margin: 20px 0; }
    .btn { display: inline-block; background-color: #f59e0b; color: #0f172a; font-weight: bold; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-size: 14px; margin-top: 18px; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">PRIVATE CONCIERGE HOLD • KASHMIR CURATORS</div>
    <h2 class="title">Still Planning Your Kashmir Trip, ${name}?</h2>
    <p class="desc">
      We noticed you were browsing <strong>${entity}</strong> in <strong>${destination}</strong> for ${datesStr}. 
      Because prime boutique properties in Kashmir have limited winter inventory with certified Bukhari central heating and scenic views, our team wanted to offer our assistance.
    </p>

    <div class="highlight-box">
      <div style="font-size: 13px; font-weight: bold; color: #f59e0b; margin-bottom: 6px;">Exclusive Perks When Booking with Kashmir Curators:</div>
      <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #cbd5e1; line-height: 1.6;">
        <li>Guaranteed 24-Hour Room Hold at Verified Wholesale Rates</li>
        <li>Bukhari Central Heating Guarantee & Electric Blankets Included</li>
        <li>Complimentary Srinagar Airport Pick-up in Heated 4x4 Mountain SUV</li>
        <li>Dedicated 24/7 Local Concierge in Srinagar & Gulmarg</li>
      </ul>
    </div>

    <p class="desc">
      Click below to resume your booking, or simply reply to this email with your preferred dates. Our local concierge will send you a personalized dossier within 15 minutes:
    </p>

    <div style="text-align: center;">
      <a href="https://kashmir-curators.vercel.app/hotels?search=${encodeURIComponent(entity)}" class="btn">
        View Available Suites & Reserve &rarr;
      </a>
    </div>

    <p style="font-size: 11px; color: #64748b; margin-top: 28px; border-top: 1px solid #374151; padding-top: 14px; text-align: center;">
      Kashmir Curators • Luxury Destination Management • Srinagar, Kashmir • WhatsApp: +91 91037 98448
    </p>
  </div>
</body>
</html>`;

    // Try AI Enhancement if Gemini is active
    if (ai) {
      try {
        const prompt = `You are the lead travel curator at Kashmir Curators, a luxury travel and hospitality brand in Srinagar.
A traveler named "${name}" searched our platform for "${entity}" in "${destination}" for dates "${datesStr}" for ${guests} guests, but dropped off before booking.

Write a high-converting, warm, hospitable, and polite follow-up nudge:
1. Short WhatsApp Message (max 75 words) with emojis (🏔️, ✨, ☕), mentioning winter Bukhari heating, personalized assistance, and inviting them to reply.
2. Email Subject Line (luxury, enticing, mentioning their destination).

Return pure JSON matching this schema:
{
  "whatsappText": "...",
  "emailSubject": "..."
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: { responseMimeType: 'application/json' }
        });

        if (response.text) {
          const parsed = JSON.parse(response.text);
          if (parsed.whatsappText) whatsappText = parsed.whatsappText;
          if (parsed.emailSubject) emailSubject = parsed.emailSubject;
        }
      } catch (err: any) {
        console.warn('[aiAgentService] Gemini customer nudge generation fallback:', err.message);
      }
    }

    return { whatsappText, emailSubject, emailHtml, curatorName };
  }
};
