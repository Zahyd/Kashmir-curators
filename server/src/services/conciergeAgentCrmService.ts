import { GoogleGenAI } from '@google/genai';
import prisma from '../lib/prisma';

export interface ExtractedTravelerPreferences {
  destinations?: string[];
  dietary?: string;
  roomPreference?: string;
  travelParty?: string;
  budgetTier?: string;
  datesOrSeason?: string;
  duration?: string;
  discoveredPhone?: string;
}

export interface ExtractedActionTrigger {
  detected: boolean;
  type?: 'LATE_CHECKOUT' | 'EXCURSION' | 'TRANSPORT' | 'CUSTOM_QUOTE' | 'BOOKING_MODIFICATION' | 'URGENT_SUPPORT';
  title?: string;
  details?: string;
  urgency?: 'HIGH' | 'MEDIUM' | 'LOW';
  bookingRef?: string;
}

export interface ConciergeCrmSyncResult {
  capturedPreferences: string[];
  loggedAction: {
    id: string;
    type: string;
    title: string;
    status: string;
  } | null;
}

const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
const geminiClient = geminiKey ? new GoogleGenAI({ apiKey: geminiKey }) : null;

/**
 * Intelligent Heuristic / Rule-based parser for traveler signals and operational requests.
 * Used as a bulletproof fallback or validator.
 */
function heuristicExtract(userMessage: string): {
  preferences: ExtractedTravelerPreferences;
  action: ExtractedActionTrigger;
} {
  const text = userMessage.trim();
  const lower = text.toLowerCase();

  const preferences: ExtractedTravelerPreferences = {};
  let action: ExtractedActionTrigger = { detected: false };

  // 1. Phone extraction (10-digit Indian numbers, with or without +91 / 0)
  const phoneMatch = text.match(/(?:(?:\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5})/);
  if (phoneMatch && phoneMatch[0]) {
    preferences.discoveredPhone = phoneMatch[0].replace(/[\s-]/g, '');
  }

  // 2. Dietary preferences
  if (/(?:strict\s+)?vegetarian|pure\s+veg\b/i.test(lower)) {
    preferences.dietary = 'Strict Vegetarian';
  } else if (/jain\s+(?:food|meal|diet)/i.test(lower)) {
    preferences.dietary = 'Jain Vegetarian';
  } else if (/vegan/i.test(lower)) {
    preferences.dietary = 'Vegan';
  } else if (/halal/i.test(lower)) {
    preferences.dietary = 'Halal Certified';
  } else if (/non[-\s]?veg/i.test(lower)) {
    preferences.dietary = 'Non-Vegetarian';
  }

  // 3. Room & Stay preferences
  const roomSignals: string[] = [];
  if (/lake[-\s]?(?:facing|view)/i.test(lower)) roomSignals.push('Lake Facing View');
  if (/mountain[-\s]?(?:facing|view)|snow[-\s]?view/i.test(lower)) roomSignals.push('Snow Mountain View');
  if (/bukhari|central(?:ly)?\s+heat(?:ing|ed)|heater|electric\s+blanket/i.test(lower)) roomSignals.push('Bukhari / Central Heating');
  if (/ground\s+floor|low(?:er)?\s+floor|wheelchair|no\s+stairs/i.test(lower)) roomSignals.push('Ground Floor / Accessible (No Stairs)');
  if (/balcony|terrace/i.test(lower)) roomSignals.push('Private Balcony');
  if (/bathtub|jacuzzi/i.test(lower)) roomSignals.push('Bathtub / Jacuzzi');
  if (roomSignals.length > 0) {
    preferences.roomPreference = roomSignals.join(', ');
  }

  // 4. Destinations of interest
  const knownPlaces = [
    'Gulmarg', 'Pahalgam', 'Sonamarg', 'Srinagar', 'Doodhpathri',
    'Gurez', 'Yusmarg', 'Aru Valley', 'Betaab Valley', 'Sinthan Top',
    'Dal Lake', 'Nigeen Lake', 'Kokernag', 'Verinag'
  ];
  const matchedPlaces = knownPlaces.filter(p => new RegExp(`\\b${p}\\b`, 'i').test(text));
  if (matchedPlaces.length > 0) {
    preferences.destinations = matchedPlaces;
  }

  // 5. Travel Party
  if (/honeymoon|newlywed|anniversary|romantic/i.test(lower)) {
    preferences.travelParty = 'Couple / Honeymoon';
  } else if (/elderly|parents|senior\s+citizen/i.test(lower)) {
    preferences.travelParty = 'Family with Elderly Parents';
  } else if (/kid|children|baby|infant|toddler/i.test(lower)) {
    preferences.travelParty = 'Family with Kids';
  } else if (/family/i.test(lower)) {
    preferences.travelParty = 'Family';
  } else if (/solo/i.test(lower)) {
    preferences.travelParty = 'Solo Traveler';
  } else if (/friends|group|buddies|colleagues/i.test(lower)) {
    preferences.travelParty = 'Group of Friends';
  }

  // 6. Budget signals
  if (/luxury|5\s*star|five\s*star|presidential|chalet|high[-\s]?end|vip/i.test(lower)) {
    preferences.budgetTier = 'Luxury VIP';
  } else if (/budget|cheap|affordable|econom(?:y|ical)/i.test(lower)) {
    preferences.budgetTier = 'Standard / Budget';
  } else if (/premium|4\s*star|boutique/i.test(lower)) {
    preferences.budgetTier = 'Premium Boutique';
  }

  // 7. Duration / Days
  const daysMatch = lower.match(/(\d+)\s*(?:days?|nights?)/i);
  if (daysMatch) {
    preferences.duration = `${daysMatch[1]} Days`;
  }

  // 8. Dates / Season
  const seasonMatch = lower.match(/\b(winter|snow|december|january|february|spring|march|april|tulip|summer|may|june|july|autumn|october|november)\b/i);
  if (seasonMatch) {
    preferences.datesOrSeason = seasonMatch[0].charAt(0).toUpperCase() + seasonMatch[0].slice(1).toLowerCase();
  }

  // -------------------------------------------------------------------------
  // ACTION TRIGGERS (Operations Requests & Booking Modifications)
  // -------------------------------------------------------------------------

  // A. Late Checkout / Early Check-in
  if (/late\s+check[-\s]?out|check[-\s]?out\s+late|extend\s+(?:our\s+)?stay/i.test(lower)) {
    action = {
      detected: true,
      type: 'LATE_CHECKOUT',
      title: 'Late Checkout Request',
      details: `Guest requested late checkout: "${text.slice(0, 180)}"`,
      urgency: 'HIGH',
    };
  } else if (/early\s+check[-\s]?in|check[-\s]?in\s+early/i.test(lower)) {
    action = {
      detected: true,
      type: 'LATE_CHECKOUT',
      title: 'Early Check-in Request',
      details: `Guest requested early check-in: "${text.slice(0, 180)}"`,
      urgency: 'MEDIUM',
    };
  }
  // B. Excursions / Local Activities
  else if (/shikara|sunset\s+shikara|gondola(?:\s+ticket|\s+phase)?|skiing\s+lesson|snowmobile|pony\s+ride|sledging|paragliding/i.test(lower)) {
    action = {
      detected: true,
      type: 'EXCURSION',
      title: 'Excursion & Activity Coordination',
      details: `Guest requested local activity coordination: "${text.slice(0, 180)}"`,
      urgency: 'MEDIUM',
    };
  }
  // C. Dedicated Cab / Chauffeur / Snow Chains
  else if (/private\s+cab|taxi|chauffeur|innova|airport\s+pick|airport\s+drop|snow\s+chains?/i.test(lower)) {
    action = {
      detected: true,
      type: 'TRANSPORT',
      title: 'Chauffeur & Fleet Transport Request',
      details: `Guest requested vehicle dispatch/inquiry: "${text.slice(0, 180)}"`,
      urgency: 'MEDIUM',
    };
  }
  // D. Custom Trip Itinerary / New Quote
  else if (/plan\s+(?:my|a)\s+trip|custom\s+(?:quote|itinerary|package)|give\s+me\s+a\s+quote|book\s+a\s+trip/i.test(lower)) {
    action = {
      detected: true,
      type: 'CUSTOM_QUOTE',
      title: 'Custom Itinerary Quote Request',
      details: `Guest requested custom package quote: "${text.slice(0, 180)}"`,
      urgency: 'HIGH',
    };
  }
  // E. Booking Modification or Cancellation
  else if (/cancel\s+booking|modify\s+booking|change\s+dates|add\s+bed|extra\s+bed/i.test(lower)) {
    action = {
      detected: true,
      type: 'BOOKING_MODIFICATION',
      title: 'Booking Modification / Change Request',
      details: `Guest requested reservation alteration: "${text.slice(0, 180)}"`,
      urgency: 'HIGH',
    };
  }
  // F. Urgent Highway / Flight Disruption Assistance
  else if (/flight\s+(?:delay|cancel)|road\s+block|stranded|emergency|pass\s+closed/i.test(lower)) {
    action = {
      detected: true,
      type: 'URGENT_SUPPORT',
      title: 'Disruption & Emergency Ground Support',
      details: `Guest reported travel disruption: "${text.slice(0, 180)}"`,
      urgency: 'HIGH',
    };
  }

  return { preferences, action };
}

/**
 * Run Gemini extraction with fallback to heuristic parser.
 */
async function extractSignals(userMessage: string, history: any[]): Promise<{
  preferences: ExtractedTravelerPreferences;
  action: ExtractedActionTrigger;
}> {
  // Always run heuristic parser first as baseline
  const heuristic = heuristicExtract(userMessage);

  if (!geminiClient) {
    return heuristic;
  }

  try {
    const recent = Array.isArray(history)
      ? history.slice(-4).map((h: any) => `${h.sender}: ${h.text}`).join('\n')
      : '';

    const extractionPrompt = `You are the Lead Intelligence Extractor for Kashmir Curators (luxury Kashmir travel CRM).
Analyze the traveler's message below and extract ANY traveler preferences and operational action triggers.

RULES:
1. ONLY extract signals explicitly mentioned or strongly implied by the traveler. NEVER invent details.
2. Return ONLY a single valid JSON object matching this schema with no markdown formatting:
{
  "dietary": string or null,
  "roomPreference": string or null,
  "destinations": string[] (e.g. ["Gulmarg", "Pahalgam"]),
  "travelParty": string or null (e.g. "Family with 2 kids", "Couple / Honeymoon"),
  "budgetTier": string or null (e.g. "Luxury VIP", "Premium", "Budget"),
  "duration": string or null (e.g. "5 Days"),
  "datesOrSeason": string or null (e.g. "December", "Winter", "Tulip season"),
  "discoveredPhone": string or null,
  "actionTrigger": {
    "detected": boolean,
    "type": "LATE_CHECKOUT" | "EXCURSION" | "TRANSPORT" | "CUSTOM_QUOTE" | "BOOKING_MODIFICATION" | "URGENT_SUPPORT" | null,
    "title": string or null,
    "details": string or null,
    "urgency": "HIGH" | "MEDIUM" | "LOW"
  }
}

CONVERSATION:
${recent ? `Prior Context:\n${recent}\n\n` : ''}Traveler Message: "${userMessage}"`;

    const aiRes = await geminiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: extractionPrompt,
    });

    const raw = aiRes.text?.trim() || '';
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    const parsed = JSON.parse(cleaned);

    const mergedPrefs: ExtractedTravelerPreferences = {
      destinations: (parsed.destinations && parsed.destinations.length > 0) ? parsed.destinations : heuristic.preferences.destinations,
      dietary: parsed.dietary || heuristic.preferences.dietary,
      roomPreference: parsed.roomPreference || heuristic.preferences.roomPreference,
      travelParty: parsed.travelParty || heuristic.preferences.travelParty,
      budgetTier: parsed.budgetTier || heuristic.preferences.budgetTier,
      duration: parsed.duration || heuristic.preferences.duration,
      datesOrSeason: parsed.datesOrSeason || heuristic.preferences.datesOrSeason,
      discoveredPhone: parsed.discoveredPhone || heuristic.preferences.discoveredPhone,
    };

    const action: ExtractedActionTrigger = (parsed.actionTrigger && parsed.actionTrigger.detected)
      ? {
          detected: true,
          type: parsed.actionTrigger.type || heuristic.action.type || 'CUSTOM_QUOTE',
          title: parsed.actionTrigger.title || heuristic.action.title || 'Traveler Operations Request',
          details: parsed.actionTrigger.details || heuristic.action.details || userMessage.slice(0, 180),
          urgency: parsed.actionTrigger.urgency || heuristic.action.urgency || 'MEDIUM',
        }
      : heuristic.action;

    return { preferences: mergedPrefs, action };
  } catch (err: any) {
    console.warn('[ConciergeAgentCRM] Gemini extraction fallback to heuristic:', err.message);
    return heuristic;
  }
}

export const conciergeAgentCrmService = {
  /**
   * Processes a live customer concierge interaction:
   * 1. Extracts intelligence (preferences, room specs, party, dates, phone)
   * 2. Detects operational action triggers (late checkout, shikara, cab, custom quote)
   * 3. Persists preferences to User.uploadedDocuments dossier in Neon DB
   * 4. Syncs with active Inquiry (LeadActivity & LeadNote) or creates a new Inquiry
   * 5. Emits real-time notification to Superadmin & Operations desk via Socket.io
   */
  async processConciergeInteraction(params: {
    user: {
      id: string;
      name: string;
      email: string;
      phone: string | null;
      uploadedDocuments?: string | null;
    };
    userMessage: string;
    history?: any[];
    reply?: string;
    io?: any;
  }): Promise<ConciergeCrmSyncResult> {
    const { user, userMessage, history = [], reply = '', io } = params;
    const capturedPreferences: string[] = [];
    let loggedAction: ConciergeCrmSyncResult['loggedAction'] = null;

    try {
      // 1. Extract Intelligence & Action Triggers
      const { preferences, action } = await extractSignals(userMessage, history);

      // Collect human-readable badges for newly captured preferences
      if (preferences.dietary) capturedPreferences.push(`Diet: ${preferences.dietary}`);
      if (preferences.roomPreference) capturedPreferences.push(`Stay: ${preferences.roomPreference}`);
      if (preferences.travelParty) capturedPreferences.push(`Party: ${preferences.travelParty}`);
      if (preferences.destinations && preferences.destinations.length > 0) {
        capturedPreferences.push(`Destinations: ${preferences.destinations.slice(0, 3).join(', ')}`);
      }
      if (preferences.budgetTier) capturedPreferences.push(`Budget: ${preferences.budgetTier}`);
      if (preferences.datesOrSeason) capturedPreferences.push(`Season: ${preferences.datesOrSeason}`);
      if (preferences.discoveredPhone && !user.phone) {
        capturedPreferences.push(`Phone Verified: ${preferences.discoveredPhone}`);
      }

      const hasNewPreferences = capturedPreferences.length > 0;
      const hasAction = action.detected;

      // If nothing new was signaled, return quickly
      if (!hasNewPreferences && !hasAction) {
        return { capturedPreferences: [], loggedAction: null };
      }

      // 2. Neon DB: Update User Phone if discovered
      if (preferences.discoveredPhone && !user.phone) {
        await prisma.user.update({
          where: { id: user.id },
          data: { phone: preferences.discoveredPhone },
        }).catch((err) => console.warn('[ConciergeAgentCRM] Failed to update phone:', err.message));
      }

      // 3. Neon DB: Update User Dossier (User.uploadedDocuments)
      let currentDocVault: any = {};
      try {
        if (user.uploadedDocuments) {
          currentDocVault = JSON.parse(user.uploadedDocuments);
        }
      } catch {
        currentDocVault = {};
      }

      const existingPreferences = currentDocVault.conciergePreferences || {};
      const updatedConciergePreferences = {
        ...existingPreferences,
        ...(preferences.dietary ? { dietary: preferences.dietary } : {}),
        ...(preferences.roomPreference ? { roomPreference: preferences.roomPreference } : {}),
        ...(preferences.travelParty ? { travelParty: preferences.travelParty } : {}),
        ...(preferences.budgetTier ? { budgetTier: preferences.budgetTier } : {}),
        ...(preferences.datesOrSeason ? { datesOrSeason: preferences.datesOrSeason } : {}),
        ...(preferences.duration ? { duration: preferences.duration } : {}),
        destinations: Array.from(new Set([
          ...(existingPreferences.destinations || []),
          ...(preferences.destinations || []),
        ])),
        lastUpdated: new Date().toISOString(),
        verifiedByGuest: true,
      };

      // Append Action Request to Dossier History if detected
      let actionReqId: string | null = null;
      if (hasAction && action.title) {
        actionReqId = `REQ-${Math.floor(1000 + Math.random() * 9000)}`;
        const existingRequests = Array.isArray(currentDocVault.conciergeRequests) ? currentDocVault.conciergeRequests : [];
        const newRequest = {
          id: actionReqId,
          type: action.type,
          title: action.title,
          details: action.details,
          urgency: action.urgency || 'MEDIUM',
          status: 'LOGGED_WITH_OPS',
          timestamp: new Date().toISOString(),
        };
        currentDocVault.conciergeRequests = [...existingRequests.slice(-9), newRequest];

        loggedAction = {
          id: actionReqId,
          type: action.type || 'OPERATIONS_REQUEST',
          title: action.title,
          status: 'Logged with Srinagar Operations Desk',
        };
      }

      currentDocVault.conciergePreferences = updatedConciergePreferences;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          uploadedDocuments: JSON.stringify(currentDocVault),
        },
      }).catch((err) => console.warn('[ConciergeAgentCRM] Failed to persist user dossier:', err.message));

      // 4. Neon DB: Sync with Lead CRM (Inquiry, LeadActivity, LeadNote)
      const existingInquiry = await prisma.inquiry.findFirst({
        where: {
          OR: [
            { userId: user.id },
            { email: user.email },
          ],
        },
        orderBy: { createdAt: 'desc' },
      });

      const prefSummary = capturedPreferences.join(' • ');

      if (existingInquiry) {
        // A. Log Lead Activity
        await prisma.leadActivity.create({
          data: {
            inquiryId: existingInquiry.id,
            type: hasAction ? 'AI_SERVICE_REQUEST' : 'AI_RECOMMENDATION',
            title: hasAction ? `Concierge Alert: ${action.title}` : 'AI Concierge: Guest Preferences Captured',
            description: hasAction
              ? `${action.details || userMessage} (Tags: ${prefSummary || 'None'})`
              : `Guest stated preferences in AI Concierge: ${prefSummary}`,
            metadata: JSON.stringify({ preferences, action }),
            performedBy: 'KASHMIR_AI_CONCIERGE',
          },
        }).catch(() => null);

        // B. If an action trigger was detected, log an internal Lead Note
        if (hasAction && action.title) {
          await prisma.leadNote.create({
            data: {
              inquiryId: existingInquiry.id,
              authorName: 'Kashmir Curators AI Concierge',
              content: `[OPERATIONAL ACTION ITEM - ${actionReqId}] ${action.title}: ${action.details || userMessage}\nUrgency: ${action.urgency || 'MEDIUM'}`,
              isInternal: true,
            },
          }).catch(() => null);
        }

        // C. Update Inquiry basic attributes if not set
        const updateData: any = {};
        if (preferences.destinations && preferences.destinations.length > 0 && (!existingInquiry.destination || existingInquiry.destination === 'Kashmir')) {
          updateData.destination = preferences.destinations.join(' & ');
        }
        if (preferences.travelParty && (!existingInquiry.travelers || existingInquiry.travelers === '2')) {
          updateData.travelers = preferences.travelParty;
        }
        if (preferences.budgetTier && (!existingInquiry.budget || existingInquiry.budget === 'Premium')) {
          updateData.budget = preferences.budgetTier;
        }
        if (Object.keys(updateData).length > 0) {
          await prisma.inquiry.update({
            where: { id: existingInquiry.id },
            data: updateData,
          }).catch(() => null);
        }
      } else if (hasAction && action.type === 'CUSTOM_QUOTE') {
        // Automatically create a new Inquiry if the guest asked for a custom quote and has no existing lead
        try {
          const newLead = await prisma.inquiry.create({
            data: {
              userId: user.id,
              customerName: user.name,
              email: user.email,
              phone: user.phone || preferences.discoveredPhone || 'Pending verification',
              destination: preferences.destinations?.[0] || 'Kashmir Complete Itinerary',
              duration: preferences.duration || '6 Days / 5 Nights',
              travelers: preferences.travelParty || '2 Adults',
              budget: preferences.budgetTier || 'Premium',
              accommodation: preferences.roomPreference || 'Standard / Luxury Hotel',
              status: 'New',
              leadStage: 'NEW_LEAD',
              sourceCta: 'AI_CONCIERGE_CHAT',
              sentiment: 'Hot',
              notes: `Auto-captured via Kashmir Curators AI Concierge.\nGuest Request: ${action.details || userMessage}\nPreferences: ${prefSummary}`,
            },
          });

          await prisma.leadActivity.create({
            data: {
              inquiryId: newLead.id,
              type: 'AI_CONCIERGE_INTERACTION',
              title: 'Lead Generated via AI Concierge Chat',
              description: `Guest initiated bespoke itinerary conversation: "${userMessage}"`,
              performedBy: 'KASHMIR_AI_CONCIERGE',
            },
          }).catch(() => null);
        } catch (err: any) {
          console.warn('[ConciergeAgentCRM] Failed to auto-create lead:', err.message);
        }
      }

      // 5. Operations & Superadmin Alert (Prisma Notification + Socket.io)
      if (hasAction && action.title) {
        const notifTitle = `⚡ AI Concierge: ${action.title}`;
        const notifMessage = `Guest ${user.name} (${user.email}): ${action.details || userMessage}`;

        const createdNotif = await prisma.notification.create({
          data: {
            userId: null, // Broadcast to all Admins & Operations Coordinators
            title: notifTitle,
            message: notifMessage,
            type: 'inquiry',
            priority: action.urgency === 'HIGH' ? 'high' : 'medium',
            link: '/admin',
          },
        }).catch(() => null);

        if (io) {
          try {
            io.emit('notification', createdNotif || {
              title: notifTitle,
              message: notifMessage,
              type: 'inquiry',
              createdAt: new Date(),
            });
            io.emit('crm:lead-updated', {
              source: 'AI_CONCIERGE',
              userId: user.id,
              reqId: actionReqId,
            });
          } catch (sockErr: any) {
            console.warn('[ConciergeAgentCRM] Socket broadcast error:', sockErr.message);
          }
        }
      }

      return {
        capturedPreferences,
        loggedAction,
      };
    } catch (err: any) {
      console.error('[ConciergeAgentCRM] Interaction error:', err.message);
      return { capturedPreferences: [], loggedAction: null };
    }
  },
};
