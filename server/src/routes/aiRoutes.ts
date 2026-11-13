import { Router, Request, Response } from 'express';
import { aiGatewayService } from '../services/aiGatewayService';

const router = Router();

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

router.get('/status', (req: Request, res: Response) => {
  const isNeonConfigured = Boolean(process.env.NEON_AI_GATEWAY_URL && process.env.NEON_AI_KEY);
  res.json({
    status: 'ONLINE',
    provider: isNeonConfigured ? 'NEON_AI_GATEWAY' : 'KASHMIR_CURATOR_EXPERT_CORE',
    neonGatewayActive: isNeonConfigured,
    cachedQueriesSupported: true
  });
});

export default router;
