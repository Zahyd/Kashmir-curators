import { Router } from 'express';
import {
  getReservations,
  getReservationById,
  createReservation,
  updateReservation,
  confirmReservation,
  simulateSendQuote,
  deleteReservation,
  getPublicReservation,
  confirmPublicReservation,
  rejectPublicReservation,
  checkInGuest,
  checkOutGuest,
  assignRoom
} from '../controllers/hotelReservationController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// Public routes for hotel email response (no JWT required)
router.get('/public/:id', getPublicReservation);
router.post('/public/:id/confirm', confirmPublicReservation);
router.post('/public/:id/reject', rejectPublicReservation);

// Authenticated private operations routes
router.get('/', authenticateToken, getReservations);
router.get('/:id', authenticateToken, getReservationById);
router.post('/', authenticateToken, createReservation);
router.patch('/:id', authenticateToken, updateReservation);
router.post('/:id/confirm', authenticateToken, confirmReservation);
router.post('/:id/check-in', authenticateToken, checkInGuest);
router.post('/:id/check-out', authenticateToken, checkOutGuest);
router.post('/:id/assign-room', authenticateToken, assignRoom);
router.post('/:id/send', authenticateToken, simulateSendQuote);
router.delete('/:id', authenticateToken, deleteReservation);

export default router;
