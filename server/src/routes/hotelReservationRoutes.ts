import { Router } from 'express';
import {
  getReservations,
  getReservationById,
  createReservation,
  updateReservation,
  confirmReservation,
  simulateSendQuote
} from '../controllers/hotelReservationController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authenticateToken, getReservations);
router.get('/:id', authenticateToken, getReservationById);
router.post('/', authenticateToken, createReservation);
router.patch('/:id', authenticateToken, updateReservation);
router.post('/:id/confirm', authenticateToken, confirmReservation);
router.post('/:id/send', authenticateToken, simulateSendQuote);

export default router;
