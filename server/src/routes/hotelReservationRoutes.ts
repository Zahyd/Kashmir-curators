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
  assignRoom,
  getHospitalityKpis,
  dispatchGuestVoucher,
  resendReservationEmail,
  getReservationEmailLogs,
  managerOverrideStatus
} from '../controllers/hotelReservationController';
import {
  receiveInboundWebhook,
  parseRawHotelReply,
  getAiAgentLogs,
  triggerSmartFollowUp
} from '../controllers/inboundEmailController';
import { verifyPortalAccess } from '../controllers/portalAccessController';
import { authenticateToken } from '../middleware/authMiddleware';
import { authorizeRoles } from '../middleware/roleMiddleware';

const router = Router();
const hospStaff = authorizeRoles('admin', 'operations', 'hospitality', 'sales');
const hospAdmin = authorizeRoles('admin', 'operations', 'hospitality');

// Inbound Email Webhook (Publicly accessible for Resend / Cloudflare webhooks)
router.post('/webhooks/inbound-email', receiveInboundWebhook);

// AI Agent Manual Parsing & Smart Actions (Authenticated for Staff)
router.post('/ai/parse-reply', authenticateToken, hospStaff, parseRawHotelReply);
router.get('/ai/agent-logs', authenticateToken, hospStaff, getAiAgentLogs);
router.post('/ai/smart-followup/:reservationId', authenticateToken, hospStaff, triggerSmartFollowUp);

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

// Operational KPI Summary
router.get('/operations/kpi-summary', authenticateToken, hospStaff, getHospitalityKpis);

// Authenticated private operations routes for Kashmir Curators employees
router.get(['/', '/reservations'], authenticateToken, hospStaff, getReservations);
router.get(['/:id', '/reservations/:id'], authenticateToken, hospStaff, getReservationById);
router.get(['/:id/email-logs', '/reservations/:id/email-logs'], authenticateToken, hospStaff, getReservationEmailLogs);
router.post(['/', '/reservations'], authenticateToken, hospStaff, createReservation);
router.patch(['/:id', '/reservations/:id'], authenticateToken, hospStaff, updateReservation);
router.post(['/:id/confirm', '/reservations/:id/confirm'], authenticateToken, hospAdmin, confirmReservation);
router.post(['/:id/check-in', '/reservations/:id/check-in'], authenticateToken, hospAdmin, checkInGuest);
router.post(['/:id/check-out', '/reservations/:id/check-out'], authenticateToken, hospAdmin, checkOutGuest);
router.post(['/:id/assign-room', '/reservations/:id/assign-room'], authenticateToken, hospAdmin, assignRoom);
router.post(['/:id/send', '/reservations/:id/send'], authenticateToken, hospStaff, simulateSendQuote);
router.post(['/:id/send-reception-email', '/reservations/:id/send-reception-email'], authenticateToken, hospStaff, sendReceptionEmail);
router.post(['/:id/resend-email', '/reservations/:id/resend-email'], authenticateToken, hospStaff, resendReservationEmail);
router.post(['/:id/dispatch-guest-voucher', '/reservations/:id/dispatch-guest-voucher'], authenticateToken, hospStaff, dispatchGuestVoucher);
router.post(['/:id/override-status', '/reservations/:id/override-status'], authenticateToken, authorizeRoles('admin', 'operations'), managerOverrideStatus);
router.post(['/:id/accept-alternative', '/reservations/:id/accept-alternative'], authenticateToken, hospStaff, employeeAcceptAlternative);
router.post(['/:id/regenerate-token', '/reservations/:id/regenerate-token'], authenticateToken, hospAdmin, regenerateSecureToken);
router.delete(['/:id', '/reservations/:id'], authenticateToken, authorizeRoles('admin', 'operations'), deleteReservation);

export default router;
