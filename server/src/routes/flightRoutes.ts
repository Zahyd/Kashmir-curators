import { Router } from 'express';
import { flightController } from '../controllers/flightController';

const router = Router();

// GET /api/flights/search
router.get('/search', flightController.searchFlights);

export default router;
