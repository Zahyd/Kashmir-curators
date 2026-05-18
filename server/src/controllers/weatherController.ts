import { Request, Response } from 'express';
import { WeatherService } from '../services/weatherService';

/**
 * GET /api/weather/alerts
 * Exposes live high-converting weather and snowfall promotions
 */
export const getWeatherAlerts = (req: Request, res: Response) => {
  try {
    const alerts = WeatherService.getPromoAlerts();
    res.json(alerts);
  } catch (error: any) {
    console.error('[WeatherController] Error fetching weather alerts:', error.message);
    res.status(500).json({ error: 'Failed to retrieve weather alerts' });
  }
};
