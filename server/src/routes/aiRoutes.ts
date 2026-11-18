import { Router, Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import prisma from '../lib/prisma';
import { aiGatewayService } from '../services/aiGatewayService';
import { AICopilotService } from '../services/aiCopilotService';
import { WeatherService } from '../services/weatherService';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();
const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
const geminiClient = geminiKey ? new GoogleGenAI({ apiKey: geminiKey }) : null;

// Public / Agent Itinerary Generator
router.post('/curate', async (req: Request, res: Response) => {
  try {
    const { duration, travelers, theme, season, budgetTier, customNotes } = req.body;
    
    const itinerary = await aiGatewayService.generateItinerary({
      duration: duration || '5 Days / 4 Nights',
      travelers: travelers || '2 Guests',
      theme: theme || 'HONEYMOON',
      season: season || 'Winter',
      budgetTier: budgetTier || 'PREMIUM',
      customNotes
    });

    res.json(itinerary);
  } catch (error: any) {
    console.error('AI Curate error:', error);
    res.status(500).json({ error: 'Failed to generate AI itinerary' });
  }
});

// AI Copilot: Comprehensive Lead Analysis & Explainable Scoring
router.post('/copilot/analyze-lead', authenticateToken, async (req: Request, res: Response) => {
  const { inquiryId } = req.body;
  if (!inquiryId) return res.status(400).json({ error: 'inquiryId is required' });

  try {
    const analysis = await AICopilotService.analyzeInquiry(inquiryId);
    res.json(analysis);
  } catch (error: any) {
    console.error('AI Copilot analyze error:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze lead' });
  }
});

// AI Copilot: Contextual Sales Reply Generator (Human-in-the-Loop)
router.post('/copilot/suggest-reply', authenticateToken, async (req: Request, res: Response) => {
  const { inquiryId, channel = 'WHATSAPP', goal = 'GREETING_INQUIRY', customNotes } = req.body;
  if (!inquiryId) return res.status(400).json({ error: 'inquiryId is required' });

  try {
    const reply = await AICopilotService.generateSalesResponse(inquiryId, channel, goal, customNotes);
    res.json(reply);
  } catch (error: any) {
    console.error('AI Copilot reply error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate contextual reply' });
  }
});

// AI Copilot: Inventory Suggestions from authorized Hotels & Cabs
router.post('/copilot/recommend-inventory', authenticateToken, async (req: Request, res: Response) => {
  const { inquiryId } = req.body;
  if (!inquiryId) return res.status(400).json({ error: 'inquiryId is required' });

  try {
    const suggestions = await AICopilotService.suggestAuthorizedInventory(inquiryId);
    res.json(suggestions);
  } catch (error: any) {
    console.error('AI Copilot inventory error:', error);
    res.status(500).json({ error: error.message || 'Failed to recommend inventory' });
  }
});

// AI Copilot: Lead Conversation & Notes Summary
router.post('/copilot/summarize-lead', authenticateToken, async (req: Request, res: Response) => {
  const { inquiryId } = req.body;
  if (!inquiryId) return res.status(400).json({ error: 'inquiryId is required' });

  try {
    const summary = await AICopilotService.summarizeLead(inquiryId);
    res.json(summary);
  } catch (error: any) {
    console.error('AI Copilot summarize error:', error);
    res.status(500).json({ error: error.message || 'Failed to summarize lead' });
  }
});

// Real-Time Authenticated Customer AI Concierge (Grounded in Live Neon DB)
router.post('/concierge-chat', authenticateToken, async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;
    const { message, history = [] } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const trimmedMsg = message.trim();

    // 1. Fetch live authenticated customer context + catalog + advisories from Neon PostgreSQL
    const [userRecord, bookings, wallet, advisories, packages, hotels] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, phone: true }
      }),
      prisma.booking.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, type: true, itemName: true, bookingDate: true, status: true, totalAmount: true, details: true }
      }),
      prisma.wallet.findUnique({
        where: { userId },
        select: { balance: true, currency: true }
      }),
      prisma.travelAdvisory.findMany({
        orderBy: [{ emergencyModeActive: 'desc' }, { lastUpdated: 'desc' }],
        take: 8,
        select: { location: true, status: true, message: true, severity: true, recommendedAction: true, source: true }
      }),
      prisma.package.findMany({
        orderBy: { rating: 'desc' },
        take: 6,
        select: { name: true, destination: true, duration: true, price: true, bestSeason: true }
      }),
      prisma.hotel.findMany({
        where: { isActive: true },
        orderBy: { starRating: 'desc' },
        take: 6,
        select: { name: true, location: true, starRating: true, pricePerNight: true }
      })
    ]);

    const inquiries = userRecord?.email
      ? await prisma.inquiry.findMany({
          where: { email: userRecord.email },
          orderBy: { createdAt: 'desc' },
          take: 6,
          select: { id: true, destination: true, duration: true, travelers: true, budget: true, status: true }
        })
      : [];

    const weatherAlerts = WeatherService.getPromoAlerts();

    const liveContext = {
      customer: {
        name: userRecord?.name || 'Traveler',
        phoneLinked: Boolean(userRecord?.phone),
      },
      walletBalanceINR: wallet?.balance || 0,
      bookings: bookings.map((b) => ({
        ref: `#${b.id.slice(-6).toUpperCase()}`,
        itemName: b.itemName,
        type: b.type,
        status: b.status,
        bookingDate: b.bookingDate,
        totalAmountINR: b.totalAmount,
      })),
      customProposals: inquiries.map((i) => ({
        ref: `#${i.id.slice(-6).toUpperCase()}`,
        destination: i.destination,
        duration: i.duration,
        travelers: i.travelers,
        status: i.status,
      })),
      liveTravelAdvisories: advisories,
      seasonalWeather: weatherAlerts.map((w) => ({
        destination: w.destination,
        temperatureC: w.temperature,
        condition: w.condition,
      })),
      availablePackages: packages,
      featuredStays: hotels,
    };

    const systemPrompt = `You are "Kashmir Curators AI", the real-time personal travel assistant for Kashmir Curators (an enterprise luxury Kashmir travel platform).
RULES:
1. Be concise, warm, accurate, and grounded strictly in the LIVE DATABASE CONTEXT below.
2. NEVER invent fake booking confirmations, fake driver names, fake phone numbers, or pretend to be a human named "Faheem".
3. Clearly distinguish confirmed account facts from travel suggestions.
4. For booking modifications, cancellations, or late checkout approvals, draft the exact request details and explain that our Kashmir Operations team confirms final approvals.
5. Keep replies scannable with short paragraphs or crisp bullet points (under 180 words unless the user asks for a full day-by-day itinerary).

LIVE DATABASE CONTEXT (Neon PostgreSQL):
${JSON.stringify(liveContext, null, 2)}`;

    let replyText = '';
    let provider = 'NEON_GROUNDED_ENGINE';

    // 2. Try Google Gemini 2.5 Flash first
    if (geminiClient) {
      try {
        const recentHistory = Array.isArray(history)
          ? history.slice(-6).map((h: any) => `${h.sender === 'user' ? 'Traveler' : 'Kashmir Curators AI'}: ${h.text}`).join('\n')
          : '';

        const response = await geminiClient.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `${systemPrompt}\n\n${recentHistory ? `RECENT CONVERSATION:\n${recentHistory}\n\n` : ''}Traveler: ${trimmedMsg}\nKashmir Curators AI:`,
        });

        const text = response.text?.trim();
        if (text) {
          replyText = text;
          provider = 'GEMINI_2_5_FLASH';
        }
      } catch (err: any) {
        console.warn('[AI Concierge] Gemini call failed, checking secondary provider:', err.message);
      }
    }

    // 3. Try Neon AI Gateway / OpenAI if configured and Gemini wasn't used
    if (!replyText) {
      const neonGatewayUrl = process.env.NEON_AI_GATEWAY_URL || process.env.AI_GATEWAY_ENDPOINT;
      const apiKey = process.env.NEON_AI_KEY || process.env.OPENAI_API_KEY;
      if (neonGatewayUrl && apiKey) {
        try {
          const gwRes = await fetch(`${neonGatewayUrl}/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [
                { role: 'system', content: systemPrompt },
                ...(Array.isArray(history) ? history.slice(-6).map((h: any) => ({
                  role: h.sender === 'user' ? 'user' : 'assistant',
                  content: String(h.text || '')
                })) : []),
                { role: 'user', content: trimmedMsg }
              ],
              temperature: 0.6,
            }),
          });
          if (gwRes.ok) {
            const data: any = await gwRes.json();
            const content = data?.choices?.[0]?.message?.content?.trim();
            if (content) {
              replyText = content;
              provider = 'NEON_AI_GATEWAY';
            }
          }
        } catch (err: any) {
          console.warn('[AI Concierge] Neon AI Gateway failed:', err.message);
        }
      }
    }

    // 4. Real-Time Live-Database Grounded Responder (Zero mock/fake data)
    if (!replyText) {
      const q = trimmedMsg.toLowerCase();
      const firstName = (userRecord?.name || 'Traveler').split(' ')[0];

      if (q.includes('booking') || q.includes('trip') || q.includes('wallet') || q.includes('status') || q.includes('account')) {
        const activeList = bookings.filter((b) => b.status === 'confirmed' || b.status === 'pending');
        const bookingLines = activeList.length > 0
          ? activeList.map((b) => `• ${b.itemName} (#${b.id.slice(-6).toUpperCase()}) — ${b.status.toUpperCase()} • ₹${b.totalAmount.toLocaleString('en-IN')}`).join('\n')
          : '• You have no active confirmed bookings yet.';
        const proposalLine = inquiries.length > 0
          ? `\nCustom Proposals (${inquiries.length}): ${inquiries.map((i) => `${i.destination} (${i.status})`).join(', ')}.`
          : '\nCustom Proposals: None submitted yet.';
        replyText = `Here is your live account snapshot, ${firstName}:\n\n${bookingLines}${proposalLine}\n\nTravel Wallet Balance: ₹${(wallet?.balance || 0).toLocaleString('en-IN')}.`;
      } else if (q.includes('weather') || q.includes('road') || q.includes('highway') || q.includes('advisory') || q.includes('clearance')) {
        const weatherLines = weatherAlerts
          .map((w) => `• ${w.destination}: ${w.temperature}°C (${w.condition})`)
          .join('\n');
        const advLines = advisories.length > 0
          ? '\n\nLive Operations Advisories:\n' + advisories.slice(0, 3).map((a) => `• ${a.location} [${a.status}]: ${a.message}`).join('\n')
          : '\n\nLive Advisories: No active disruption alerts recorded in the database.';
        replyText = `Live Kashmir Conditions:\n${weatherLines}${advLines}`;
      } else if (q.includes('itinerary') || q.includes('package') || q.includes('plan') || q.includes('5-day') || q.includes('5 day') || q.includes('recommend')) {
        const daysMatch = q.match(/(\d+)\s*-?\s*day/);
        const durationLabel = daysMatch ? `${daysMatch[1]} Days` : '5 Days / 4 Nights';
        const generated = await aiGatewayService.generateItinerary({
          duration: durationLabel,
          travelers: '2 Guests',
          theme: q.includes('honeymoon') ? 'HONEYMOON' : q.includes('ski') || q.includes('snow') ? 'ADVENTURE_SKI' : 'FAMILY',
          budgetTier: q.includes('luxury') ? 'LUXURY' : 'PREMIUM',
          customNotes: trimmedMsg
        });
        const dayPreview = generated.days
          .slice(0, 5)
          .map((d) => `• Day ${d.day} (${d.location}): ${d.title}`)
          .join('\n');
        const dbPkgHint = packages.length > 0
          ? `\n\nLive Catalog Options:\n` + packages.slice(0, 2).map((p) => `• ${p.name} (${p.duration}) — ₹${p.price.toLocaleString('en-IN')}`).join('\n')
          : '';
        replyText = `Suggested ${generated.packageName} (${durationLabel}):\n${dayPreview}${dbPkgHint}\n\nWant to customize dates or stays? Open the Bespoke Planner to lock your quote.`;
      } else if (q.includes('hotel') || q.includes('houseboat') || q.includes('stay')) {
        const stayLines = hotels.length > 0
          ? hotels.slice(0, 4).map((h) => `• ${h.name} (${h.location}, ${h.starRating}★) — from ₹${h.pricePerNight.toLocaleString('en-IN')}/night`).join('\n')
          : '• Explore our verified Kashmir estates & houseboats in the Stays directory.';
        replyText = `Verified Active Stays in our Kashmir Catalog:\n${stayLines}`;
      } else if (q.includes('pack') || q.includes('gulmarg') || q.includes('gondola')) {
        const gulmargWeather = weatherAlerts.find((w) => w.destination.toLowerCase() === 'gulmarg');
        const tempStr = gulmargWeather ? `${gulmargWeather.temperature}°C (${gulmargWeather.condition})` : 'cool alpine weather';
        replyText = `Gulmarg Packing & Gondola Guide (Current: ${tempStr}):\n• Thermal base layers + windproof insulated jacket (Phase 2 Apharwat Peak at ~13,000 ft is 8–10°C colder than the base).\n• Waterproof snow/trekking boots with grip + woolen gloves & sunglasses.\n• Carry original Government ID (Aadhaar/Passport) for Gondola boarding.\n• Book Gondola Phase 1 & 2 slots early as high winds can pause Phase 2 operations.`;
      } else if (q.includes('checkout') || q.includes('cancel') || q.includes('modify') || q.includes('chauffeur') || q.includes('shikara')) {
        const activeRef = bookings[0] ? `#${bookings[0].id.slice(-6).toUpperCase()} (${bookings[0].itemName})` : 'your account';
        replyText = `I've drafted your request for ${activeRef}: "${trimmedMsg}".\n\nBecause booking changes, checkout extensions, and private excursions require direct confirmation with the property/dispatch desk, click "WhatsApp Human Ops" below to transmit this directly to our Srinagar Operations Desk.`;
      } else {
        replyText = `Hi ${firstName}! I am connected to your live Kashmir Curators account (${bookings.length} bookings, ${inquiries.length} proposals, ₹${(wallet?.balance || 0).toLocaleString('en-IN')} wallet).\n\nAsk me to:\n• Build a custom 5-day Kashmir itinerary\n• Check live weather & road advisories\n• Compare verified hotels & houseboats from our catalog\n• Review your active bookings, proposals, or packing list`;
      }
    }

    res.json({
      reply: replyText,
      provider,
      contextSummary: {
        activeBookings: bookings.filter((b) => b.status === 'confirmed' || b.status === 'pending').length,
        proposals: inquiries.length,
        walletBalance: wallet?.balance || 0,
        liveAdvisories: advisories.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[AI Concierge Chat] Error:', error.message);
    res.status(500).json({ error: 'Unable to reach Kashmir Curators AI right now.' });
  }
});

// Real-Time Superadmin / Director Executive AI Copilot (Grounded in Live Neon Ops DB)
router.post('/director-copilot', authenticateToken, async (req: any, res: Response) => {
  try {
    const role = String(req.user?.role || '').toLowerCase();
    if (!['admin', 'operations', 'finance', 'marketing', 'sales', 'hospitality'].includes(role)) {
      return res.status(403).json({ error: 'Director / Operations authorization required' });
    }

    const { message, history = [] } = req.body;
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const trimmedMsg = message.trim();
    const p = prisma as any;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [
      totalBookings,
      confirmedRevenue,
      unassignedLeads,
      pendingReservations,
      todayCheckIns,
      todayCheckOuts,
      hotelDuesAgg,
      profitAgg,
      totalCabs,
      activeCabs,
      pendingAgents,
      walletsAgg,
      advisories
    ] = await Promise.all([
      p.booking.count().catch(() => 0),
      p.booking.aggregate({ _sum: { totalAmount: true }, where: { status: { in: ['confirmed', 'completed'] } } }).catch(() => ({ _sum: { totalAmount: 0 } })),
      p.inquiry.findMany({
        where: { OR: [{ assignedTo: null }, { assignedTo: '' }], status: { not: 'Lost' } },
        take: 6,
        orderBy: { createdAt: 'desc' },
        select: { id: true, customerName: true, destination: true, duration: true, budget: true, createdAt: true }
      }).catch(() => []),
      p.hotelReservation.count({ where: { status: { in: ['Pending', 'Sent'] } } }).catch(() => 0),
      p.hotelReservation.count({ where: { checkIn: { gte: todayStart, lte: todayEnd } } }).catch(() => 0),
      p.hotelReservation.count({ where: { checkOut: { gte: todayStart, lte: todayEnd } } }).catch(() => 0),
      p.hotelReservation.aggregate({ _sum: { hotelDues: true } }).catch(() => ({ _sum: { hotelDues: 0 } })),
      p.hotelReservation.aggregate({ _sum: { profitMargin: true } }).catch(() => ({ _sum: { profitMargin: 0 } })),
      p.cab.count().catch(() => 0),
      p.cab.count({ where: { isActive: true } }).catch(() => 0),
      p.agentProfile.count({ where: { status: { in: ['PENDING', 'UNDER_REVIEW'] } } }).catch(() => 0),
      p.wallet.aggregate({ _sum: { balance: true } }).catch(() => ({ _sum: { balance: 0 } })),
      p.travelAdvisory.findMany({
        take: 5,
        orderBy: [{ emergencyModeActive: 'desc' }, { lastUpdated: 'desc' }],
        select: { location: true, status: true, severity: true, emergencyModeActive: true, message: true }
      }).catch(() => [])
    ]);

    const opsSnapshot = {
      totalBookings,
      confirmedRevenueINR: Number(confirmedRevenue?._sum?.totalAmount || 0),
      profitMarginINR: Number(profitAgg?._sum?.profitMargin || 0),
      unpaidHotelDuesINR: Number(hotelDuesAgg?._sum?.hotelDues || 0),
      todayCheckIns,
      todayCheckOuts,
      pendingHotelReservations: pendingReservations,
      fleet: { activeCabs, totalCabs },
      pendingB2BAgentApprovals: pendingAgents,
      customerWalletLiabilityINR: Number(walletsAgg?._sum?.balance || 0),
      unassignedLeadsCount: unassignedLeads.length,
      unassignedLeads,
      liveTravelAdvisories: advisories,
    };

    const sysPrompt = `You are "Kashmir Ops AI", the Superadmin Executive Copilot for Kashmir Curators Command HQ.
RULES:
1. Answer strictly using the LIVE NEON DATABASE SNAPSHOT below.
2. Be crisp, analytical, executive-ready, with clear INR figures and bullet points (max 160 words).
3. Never invent numbers or records not present in the snapshot.

LIVE NEON OPS SNAPSHOT:
${JSON.stringify(opsSnapshot, null, 2)}`;

    let replyText = '';
    let provider = 'NEON_OPS_ENGINE';

    if (geminiClient) {
      try {
        const recentHistory = Array.isArray(history)
          ? history.slice(-6).map((h: any) => `${h.sender === 'user' ? 'Director' : 'Kashmir Ops AI'}: ${h.text}`).join('\n')
          : '';
        const response = await geminiClient.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `${sysPrompt}\n\n${recentHistory ? `HISTORY:\n${recentHistory}\n\n` : ''}Director: ${trimmedMsg}\nKashmir Ops AI:`,
        });
        const text = response.text?.trim();
        if (text) {
          replyText = text;
          provider = 'GEMINI_2_5_FLASH';
        }
      } catch (err: any) {
        console.warn('[Director AI Copilot] Gemini fallback:', err.message);
      }
    }

    if (!replyText) {
      const q = trimmedMsg.toLowerCase();
      if (q.includes('lead') || q.includes('unassigned') || q.includes('inquir')) {
        replyText = unassignedLeads.length > 0
          ? `Unassigned Leads Requiring Dispatch (${unassignedLeads.length}):\n` +
            unassignedLeads.map((l: any) => `• ${l.customerName} — ${l.destination} (${l.duration}d, ${l.budget})`).join('\n')
          : 'All active trip inquiries are currently assigned. Zero unassigned leads in the queue.';
      } else if (q.includes('due') || q.includes('hotel') || q.includes('check') || q.includes('revenue') || q.includes('finance') || q.includes('wallet')) {
        replyText = `Live Fiscal & Hospitality Snapshot:\n• Confirmed Revenue: ₹${opsSnapshot.confirmedRevenueINR.toLocaleString('en-IN')}\n• Net Profit Margin: ₹${opsSnapshot.profitMarginINR.toLocaleString('en-IN')}\n• Unpaid Hotel Dues: ₹${opsSnapshot.unpaidHotelDuesINR.toLocaleString('en-IN')}\n• Today's Movement: ${todayCheckIns} Check-ins / ${todayCheckOuts} Check-outs (${pendingReservations} pending CRS)\n• Customer Wallet Liability: ₹${opsSnapshot.customerWalletLiabilityINR.toLocaleString('en-IN')}`;
      } else if (q.includes('disruption') || q.includes('road') || q.includes('advisory') || q.includes('safety')) {
        replyText = advisories.length > 0
          ? `Active Neon Travel Advisories (${advisories.length}):\n` +
            advisories.map((a: any) => `• ${a.location} [${a.status}${a.emergencyModeActive ? ' • EMERGENCY' : ''}]: ${a.message}`).join('\n')
          : 'No active road disruptions or emergency alerts logged in Neon DB.';
      } else {
        replyText = `Executive Ops Pulse:\n• Bookings: ${totalBookings} | Confirmed Rev: ₹${opsSnapshot.confirmedRevenueINR.toLocaleString('en-IN')}\n• Unassigned Leads: ${unassignedLeads.length} | Pending Hotel CRS: ${pendingReservations}\n• Fleet: ${activeCabs}/${totalCabs} active | Pending B2B Agents: ${pendingAgents}\n• Unpaid Hotel Dues: ₹${opsSnapshot.unpaidHotelDuesINR.toLocaleString('en-IN')}\n• Active Advisories: ${advisories.length}`;
      }
    }

    res.json({ reply: replyText, provider, snapshot: opsSnapshot, timestamp: new Date().toISOString() });
  } catch (error: any) {
    console.error('[Director AI Copilot] Error:', error.message);
    res.status(500).json({ error: 'Failed to run Director AI Copilot' });
  }
});

router.get('/status', (req: Request, res: Response) => {
  const isGeminiConfigured = Boolean(geminiClient);
  const isNeonConfigured = Boolean(process.env.NEON_AI_GATEWAY_URL && process.env.NEON_AI_KEY);
  res.json({
    status: 'ONLINE',
    provider: isGeminiConfigured ? 'GEMINI_2_5_FLASH' : isNeonConfigured ? 'NEON_AI_GATEWAY' : 'NEON_GROUNDED_ENGINE',
    neonGatewayActive: isNeonConfigured,
    cachedQueriesSupported: true,
    copilotFeatures: [
      'customer_concierge_chat',
      'intent_analysis',
      'conversion_scoring',
      'contextual_replies',
      'inventory_recommendation',
      'lead_summarization'
    ]
  });
});

export default router;
