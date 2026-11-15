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
  receptionConfirmAvailability,
  receptionConfirmBooking,
  receptionOfferAlternative,
  rejectPublicReservation,
  receptionRequestClarification,
  employeeAcceptAlternative,
  regenerateSecureToken,
  sendReceptionEmail,
  checkInGuest,
  checkOutGuest,
  assignRoom
} from '../controllers/hotelReservationController';
import { verifyPortalAccess } from '../controllers/portalAccessController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// Hospitality Authentication Gate & Key Verification
router.post('/verify-access', verifyPortalAccess);

// Public routes for Hotel Reception Confirmation Portal (no JWT required, secured by expiring token/id)
router.get(['/public/:tokenOrId', '/reservations/public/:tokenOrId'], getPublicReservation);
router.post(['/public/:tokenOrId/confirm-availability', '/reservations/public/:tokenOrId/confirm-availability'], receptionConfirmAvailability);
router.post(['/public/:tokenOrId/confirm-booking', '/reservations/public/:tokenOrId/confirm-booking'], receptionConfirmBooking);
router.post(['/public/:tokenOrId/confirm', '/reservations/public/:tokenOrId/confirm'], confirmPublicReservation);
router.post(['/public/:tokenOrId/propose-alternative', '/reservations/public/:tokenOrId/propose-alternative'], receptionOfferAlternative);
router.post(['/public/:tokenOrId/reject', '/reservations/public/:tokenOrId/reject'], rejectPublicReservation);
router.post(['/public/:tokenOrId/clarification', '/reservations/public/:tokenOrId/clarification'], receptionRequestClarification);

// Authenticated private operations routes for Kashmir Curators employees
router.get(['/', '/reservations'], authenticateToken, getReservations);
router.get(['/:id', '/reservations/:id'], authenticateToken, getReservationById);
router.post(['/', '/reservations'], authenticateToken, createReservation);
router.patch(['/:id', '/reservations/:id'], authenticateToken, updateReservation);
router.post(['/:id/confirm', '/reservations/:id/confirm'], authenticateToken, confirmReservation);
router.post(['/:id/check-in', '/reservations/:id/check-in'], authenticateToken, checkInGuest);
router.post(['/:id/check-out', '/reservations/:id/check-out'], authenticateToken, checkOutGuest);
router.post(['/:id/assign-room', '/reservations/:id/assign-room'], authenticateToken, assignRoom);
router.post(['/:id/send', '/reservations/:id/send'], authenticateToken, simulateSendQuote);
router.post(['/:id/send-reception-email', '/reservations/:id/send-reception-email'], authenticateToken, sendReceptionEmail);
router.post(['/:id/accept-alternative', '/reservations/:id/accept-alternative'], authenticateToken, employeeAcceptAlternative);
router.post(['/:id/regenerate-token', '/reservations/:id/regenerate-token'], authenticateToken, regenerateSecureToken);
router.delete(['/:id', '/reservations/:id'], authenticateToken, deleteReservation);

export default router;
