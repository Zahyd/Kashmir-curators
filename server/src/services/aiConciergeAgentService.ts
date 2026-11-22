import { GoogleGenAI } from '@google/genai';
import prisma from '../lib/prisma';
import { detectLeadOrigin } from '../routes/metaLeadRoutes';
import { notificationService } from './notificationService';

export interface ConciergeReplyResult {
  replyText: string;
  intent: 'TOURIST_VACATION_INQUIRY' | 'B2B_TRAVEL_AGENT' | 'CAB_DRIVER_FLEET' | 'HOTELIER_SUPPLIER' | 'GENERAL_FAQ' | 'HUMAN_HANDOFF';
  extractedData?: {
    customerName?: string;
    destination?: string;
    duration?: string;
    travelers?: string;
    budget?: string;
    travelStartDate?: string;
  };
  inquiryId?: string;
  proposalUrl?: string;
}

const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
const ai = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://kashmir-curators.vercel.app';

/**
 * Knowledge Base for Kashmir Curators & Travel Operating System
 */
const KASHMIR_KNOWLEDGE_BASE = `
You are "Mehak", Senior AI Travel Concierge at Kashmir Curators (Kashmir Connect) — Jammu & Kashmir's premier Travel Operating System and luxury DMC based in Srinagar.
Phone/WhatsApp: +91 9103798448. Website: ${FRONTEND_URL}

YOUR PERSONALITY:
- Warm, elegant, highly knowledgeable, hospitable (authentic Kashmiri hospitality — "Mehraz" / esteemed guest).
- Always use tasteful emojis (🏔️, ✨, ❄️, ☕, 🎿, 🚖).
- Speak fluent English or Hinglish/Hindi depending on the language the user messages in.
- Be crisp, direct, and never spammy or overly pushy.

CORE INVENTORY & PRICING TIERS:
1. 4★ Deluxe Comfort:
   - ₹24,999 - ₹32,000 per couple (4N/5D).
   - Premium 4-star heated hotels in Srinagar (Heevan / Grand Mumtaz), Gulmarg, Pahalgam + Private heated Innova.
2. 5★ Luxury Bliss:
   - ₹48,000 - ₹75,000 per couple (5N/6D).
   - Heritage Cedar Houseboat on Nigeen Lake (Sukoon style) + The Khyber Gulmarg / Kolahoi Green Pahalgam + Private chauffeur.
3. Ultra-Luxury & Honeymoon:
   - ₹95,000 - ₹1,80,000 per couple (6N/7D).
   - The Lalit Grand Palace Srinagar + The Khyber Himalayan Resort & Spa Gulmarg (slopeside) + 4x4 Luxury SUV + Candlelight dinner + Shikara ride + Gondola Phase 2 coordination.

SPECIALIZED STAKEHOLDER ROUTING:
- If a user mentions they are a TRAVEL AGENT / TOUR OPERATOR:
  Explain: "We offer contracted B2B wholesale net tariffs and an AI Travel CRM with 60-second white-label quote generation for partner agencies across India and UAE."
  Link to B2B Onboarding: ${FRONTEND_URL}/agent/apply or ${FRONTEND_URL}/agent/landing
- If a user mentions they are a CAB DRIVER / FLEET OWNER (owns Innova Crysta, 4x4, Tempo):
  Explain: "We provide guaranteed seasonal tourist duties, digital passenger clearance cards, and weekly on-time payouts."
  Link to Driver Registration: ${FRONTEND_URL}/driver
- If a user mentions they own a HOTEL / HOUSEBOAT:
  Explain: "We contract seasonal wholesale allotments with 1-click front-desk voucher confirmation."
  Link: ${FRONTEND_URL}/hospitality

CRITICAL TRAVEL ADVICE:
- Gulmarg Gondola Phase 1 & 2 tickets sell out 3-4 weeks in advance on the official portal. We assist all confirmed guests with ticket coordination.
- Winter heating (central heating, electric bed warmers, traditional wood Bukhari) is guaranteed across all our partner properties.
`;

export class AIConciergeAgentService {
  /**
   * Generates a contextual, intelligent response to an inbound WhatsApp/Instagram message
   */
  public static async processInboundMessage(
    senderPhone: string,
    messageText: string,
    io?: any
  ): Promise<ConciergeReplyResult> {
    const cleanPhone = senderPhone.replace(/[^0-9+]/g, '');
    const geo = detectLeadOrigin(cleanPhone);
    const p = prisma as any;

    // 1. Fetch existing inquiry or recent messages for context
    let existingInquiry = await p.inquiry.findFirst({
      where: { phone: { contains: cleanPhone.slice(-10) } },
      orderBy: { createdAt: 'desc' }
    });

    const recentMessages = await p.whatsAppMessage.findMany({
      where: { customerPhone: { contains: cleanPhone.slice(-10) } },
      orderBy: { createdAt: 'desc' },
      take: 6
    });

    const historyPrompt = recentMessages
      .reverse()
      .map((m: any) => `${m.direction === 'INBOUND' ? 'Customer' : 'Mehak (AI Concierge)'}: ${m.content}`)
      .join('\n');

    let result: ConciergeReplyResult;

    if (ai) {
      result = await this.generateWithGemini(cleanPhone, messageText, historyPrompt, existingInquiry, geo);
    } else {
      result = this.generateWithRuleEngine(cleanPhone, messageText, existingInquiry, geo);
    }

    // 2. If traveler details were extracted, auto-create/update inquiry in database
    try {
      if (result.intent === 'TOURIST_VACATION_INQUIRY') {
        const extracted = result.extractedData || {};
        const dest = extracted.destination || existingInquiry?.destination || 'Kashmir Valley Circuit';
        const dur = extracted.duration || existingInquiry?.duration || '5 Nights / 6 Days';
        const pax = extracted.travelers || existingInquiry?.travelers || '2 Adults';
        const name = extracted.customerName || existingInquiry?.customerName || (geo.origin === 'INTERNATIONAL' ? `${geo.countryName} Guest` : 'Valued Traveler');

        if (!existingInquiry) {
          existingInquiry = await p.inquiry.create({
            data: {
              customerName: name,
              phone: cleanPhone,
              email: `${cleanPhone.slice(-10)}@whatsapp.kashmircurators.com`,
              destination: dest,
              duration: dur,
              travelers: pax,
              budget: extracted.budget || (geo.origin === 'INTERNATIONAL' ? `${geo.currencySymbol} 3,500` : '₹45,000'),
              accommodation: 'Luxury Stays & Heritage Houseboat',
              leadStage: 'CLAIMED',
              leadCategory: 'AI_WHATSAPP_CONCIERGE',
              sourceCta: 'WHATSAPP_AI_AGENT',
              assignedTo: 'AI Concierge Mehak',
              netPrice: 55000,
              notes: `Lead captured via WhatsApp AI Agent. Origin: ${geo.flag} ${geo.countryName}`
            }
          });

          if (io) {
            notificationService.emitSystemEvent(
              io,
              'CREATE',
              `AI Agent Captured Lead: ${name} (${geo.flag} ${geo.countryName}) - ${dest}`,
              { ...existingInquiry, entityType: 'inquiry' }
            );
          }
        } else {
          // Update existing inquiry with any newly learned fields
          const updateData: any = {};
          if (extracted.customerName && existingInquiry.customerName === 'Valued Traveler') updateData.customerName = extracted.customerName;
          if (extracted.destination) updateData.destination = extracted.destination;
          if (extracted.duration) updateData.duration = extracted.duration;
          if (extracted.travelers) updateData.travelers = extracted.travelers;
          if (extracted.budget) updateData.budget = extracted.budget;

          if (Object.keys(updateData).length > 0) {
            existingInquiry = await p.inquiry.update({
              where: { id: existingInquiry.id },
              data: updateData
            });
          }
        }

        result.inquiryId = existingInquiry.id;
        result.proposalUrl = `${FRONTEND_URL}/itinerary/${existingInquiry.id}`;

        // Append proposal link if sufficient info exists and link is not already in text
        if (!result.replyText.includes('/itinerary/') && result.proposalUrl) {
          result.replyText += `\n\n📄 *You can view your preliminary interactive trip plan here:* \n${result.proposalUrl}`;
        }
      }
    } catch (dbErr: any) {
      console.warn('[AI Concierge Service] DB persistence notice:', dbErr.message);
    }

    return result;
  }

  /**
   * Gemini 2.5 Flash Conversational Generation
   */
  private static async generateWithGemini(
    phone: string,
    message: string,
    history: string,
    inquiry: any,
    geo: any
  ): Promise<ConciergeReplyResult> {
    try {
      const prompt = `${KASHMIR_KNOWLEDGE_BASE}

CUSTOMER CONTEXT:
- Phone Number: ${phone}
- Location Origin: ${geo.flag} ${geo.countryName} (${geo.origin})
- Local Currency: ${geo.currency} (${geo.currencySymbol})
- Existing Profile: ${inquiry ? `${inquiry.customerName}, Destination: ${inquiry.destination}, Pax: ${inquiry.travelers}` : 'New Inbound Contact'}

CONVERSATION HISTORY:
${history || 'No previous messages.'}

CURRENT INCOMING MESSAGE:
"${message}"

YOUR TASK:
1. Determine the user's intent:
   - "TOURIST_VACATION_INQUIRY": Wants to plan or book a trip, asking for costs, itineraries, hotels, snow, weather, dates, etc.
   - "B2B_TRAVEL_AGENT": Wants B2B rates, travel agent CRM access, agency tie-up.
   - "CAB_DRIVER_FLEET": Owns a vehicle, wants driver duties.
   - "HOTELIER_SUPPLIER": Hotel or houseboat owner.
   - "HUMAN_HANDOFF": Asking for human call or urgent customized negotiation.
   - "GENERAL_FAQ": General query.

2. Extract any newly provided information:
   - "customerName": Full name if mentioned
   - "destination": Destinations mentioned (Srinagar, Gulmarg, Pahalgam, Sonamarg)
   - "duration": Duration mentioned (e.g. 5 days, 6N/7D)
   - "travelers": Number of adults/kids/couples
   - "budget": Budget tier mentioned

3. Formulate a warm, authentic, helpful response:
   - Answer their specific question directly with pricing estimates or travel advice.
   - If they are a tourist and you don't know their dates or traveler count, naturally ask for them.
   - Keep the reply concise for WhatsApp (under 120 words).
   - Use WhatsApp markdown (*bold* for highlights).

RETURN STRICT JSON ONLY:
{
  "replyText": "your crafted response",
  "intent": "TOURIST_VACATION_INQUIRY",
  "extractedData": {
    "customerName": "...",
    "destination": "...",
    "duration": "...",
    "travelers": "...",
    "budget": "..."
  }
}`;

      const response = await ai!.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const parsed = JSON.parse(response.text?.trim() || '{}');
      return {
        replyText: parsed.replyText || 'Salam! Welcome to Kashmir Curators. How can I assist you with your Kashmir vacation today?',
        intent: parsed.intent || 'TOURIST_VACATION_INQUIRY',
        extractedData: parsed.extractedData
      };
    } catch (err: any) {
      console.error('[AI Concierge Service] Gemini generation error, falling back to rule engine:', err.message);
      return this.generateWithRuleEngine(phone, message, inquiry, geo);
    }
  }

  /**
   * Rule-Based Intelligent Fallback
   */
  private static generateWithRuleEngine(
    phone: string,
    message: string,
    inquiry: any,
    geo: any
  ): ConciergeReplyResult {
    const lower = message.toLowerCase();

    // 1. Detect B2B Travel Agent
    if (lower.includes('agent') || lower.includes('b2b') || lower.includes('dmc') || lower.includes('wholesale') || lower.includes('markup')) {
      return {
        intent: 'B2B_TRAVEL_AGENT',
        replyText: `💼 *Salam Partner! Welcome to Kashmir Curators B2B DMC.* 🏔️\n\nWe provide contracted wholesale net tariffs for 5-star Gulmarg ski resorts, heritage Nigeen houseboats, and 1,200+ commercial 4x4 cabs, along with our AI Travel CRM.\n\n👉 *Access B2B Agency Rates & Onboarding here:* \n${FRONTEND_URL}/agent/apply\n\nOur trade desk manager will verify your agency credentials within 2 business hours! ✨`
      };
    }

    // 2. Detect Cab Driver
    if (lower.includes('driver') || lower.includes('cab') || lower.includes('taxi') || lower.includes('innova') || lower.includes('car') || lower.includes('vehicle')) {
      return {
        intent: 'CAB_DRIVER_FLEET',
        replyText: `🚖 *Salam Driver Partner!* 🏔️\n\nKashmir Curators operates a verified tourist transport network with guaranteed daily duties, digital passenger clearance passes, and direct weekly payouts with zero delays.\n\n👉 *Register your vehicle with our fleet operations here:* \n${FRONTEND_URL}/driver\n\nOur Srinagar transport desk will reach out once your RC and commercial permit are reviewed!`
      };
    }

    // 3. Detect Hotelier
    if (lower.includes('hotel') && (lower.includes('tieup') || lower.includes('list') || lower.includes('property') || lower.includes('owner'))) {
      return {
        intent: 'HOTELIER_SUPPLIER',
        replyText: `🏨 *Salam Hotelier Partner!* 🏔️\n\nWe partner with premier boutique hotels, heritage houseboats on Nigeen Lake, and alpine cottages across Srinagar, Gulmarg, and Pahalgam for guaranteed winter occupancy.\n\n👉 *Review our Hospitality Operations Portal:* \n${FRONTEND_URL}/hospitality`
      };
    }

    // 4. Tourist Vacation Inquiry
    const isCost = lower.includes('rate') || lower.includes('cost') || lower.includes('price') || lower.includes('package') || lower.includes('budget') || lower.includes('how much');
    const isSnow = lower.includes('snow') || lower.includes('gulmarg') || lower.includes('gondola') || lower.includes('ski');
    const isHoneymoon = lower.includes('honeymoon') || lower.includes('couple') || lower.includes('anniversary');

    let reply = `Salam! 🏔️✨ Welcome to *Kashmir Curators*. I am *Mehak*, your Senior Travel Concierge.\n\n`;

    if (isHoneymoon) {
      reply += `Our signature *Honeymoon Paradise (5N/6D)* covers Srinagar, Gulmarg, and Pahalgam with candlelit Shikara rides on Nigeen Lake, flower bed decor, and private heated 4x4 transfers. Packages typically range between ₹28,500 and ₹65,000 per couple depending on whether you choose Deluxe 4★ or 5★ Palatial properties.\n\n`;
    } else if (isSnow) {
      reply += `Gulmarg is in prime condition! Gondola Phase 2 takes you up to 13,780 ft with deep snow and ski slopes. We provide snow-chain equipped 4x4 Innova Crystas and assist with Gondola slot coordination.\n\n`;
    } else if (isCost) {
      reply += `Our curated luxury packages start from ₹24,999/person for Deluxe 4★, and ₹48,000 - ₹75,000 for 5★ Luxury Palace & Houseboat retreats with dedicated private chauffeurs.\n\n`;
    } else {
      reply += `We design bespoke, stress-free Kashmir holidays with hand-picked 5-star properties, private chauffeurs, and 24/7 on-ground assistance.\n\n`;
    }

    reply += `To customize your exact day-by-day plan & quote, could you share:\n1. 🗓️ Estimated travel dates:\n2. 👥 Number of travelers (Adults + Kids):\n3. 🏨 Preferred stay style (Deluxe 4★ / 5★ Palace / Heritage Houseboat)?`;

    return {
      intent: 'TOURIST_VACATION_INQUIRY',
      replyText: reply,
      extractedData: {
        destination: isSnow ? 'Gulmarg & Srinagar' : isHoneymoon ? 'Srinagar, Gulmarg & Pahalgam' : 'Kashmir Valley',
        duration: isHoneymoon ? '5 Nights / 6 Days' : '4 Nights / 5 Days',
        travelers: isHoneymoon ? '2 Adults (Honeymoon)' : '2 Adults'
      }
    };
  }
}
