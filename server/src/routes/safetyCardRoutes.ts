import { Router } from 'express';
import {
  getSafetyCardByToken,
  createOrGetSafetyCard,
  reportTravellerSos
} from '../controllers/safetyCardController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// Public route to view a shared safety card by token (offline/QR link)
router.get('/:token', getSafetyCardByToken);

// Create or get safety card for user's booking
router.post('/generate', authenticateToken, createOrGetSafetyCard);

// Public SOS trigger from card
router.post('/:token/sos', reportTravellerSos);

export default router;
