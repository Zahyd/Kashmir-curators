import { Router, Request, Response } from 'express';
import { aiGatewayService } from '../services/aiGatewayService';
import { AICopilotService } from '../services/aiCopilotService';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

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

router.get('/status', (req: Request, res: Response) => {
  const isNeonConfigured = Boolean(process.env.NEON_AI_GATEWAY_URL && process.env.NEON_AI_KEY);
  res.json({
    status: 'ONLINE',
    provider: isNeonConfigured ? 'NEON_AI_GATEWAY' : 'KASHMIR_CURATOR_EXPERT_CORE',
    neonGatewayActive: isNeonConfigured,
    cachedQueriesSupported: true,
    copilotFeatures: [
      'intent_analysis',
      'conversion_scoring',
      'contextual_replies',
      'inventory_recommendation',
      'lead_summarization'
    ]
  });
});

export default router;
