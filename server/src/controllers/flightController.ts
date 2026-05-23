import { Request, Response } from 'express';
import { FlightService } from '../services/flightService';

export const flightController = {
  /**
   * Search for flights between any two airports
   * GET /api/flights/search?origin=DEL&destination=SXR&date=2026-10-15&adults=2&cabinClass=economy
   */
  async searchFlights(req: Request, res: Response): Promise<void> {
    try {
      const { origin, destination, date, adults, cabinClass } = req.query;

      if (!origin || !date) {
        res.status(400).json({ success: false, message: 'Origin and date are required.' });
        return;
      }

      const parsedAdults = adults ? parseInt(adults as string, 10) : 1;
      const originCode = (origin as string).toUpperCase();
      const destCode = destination ? (destination as string).toUpperCase() : 'SXR';
      const dateString = date as string;
      const cabin = (cabinClass as string) || 'economy';

      const result = await FlightService.searchFlights(originCode, destCode, dateString, parsedAdults, cabin);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(503).json(result);
      }
    } catch (error) {
      console.error('Flight controller error:', error);
      res.status(500).json({ success: false, message: 'Internal server error fetching flights.' });
    }
  }
};
