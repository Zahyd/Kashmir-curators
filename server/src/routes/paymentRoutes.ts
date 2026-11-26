import { Router } from 'express';
import { 
  handleRazorpayWebhook, 
  sendWhatsAppPaymentRequest, 
  getPaymentRequestDetails,
  getInquiryPayments,
  getPaymentLedger,
  verifyManualPayment,
  createStripeCheckoutSession,
  createRazorpayPaymentLink,
  createSubscriptionOrder,
  verifySubscriptionPayment
} from '../controllers/paymentController';
import { authenticateToken } from '../middleware/authMiddleware';
import { authorizeRoles } from '../middleware/roleMiddleware';

const router = Router();

router.post('/webhook', handleRazorpayWebhook);
router.get('/ledger', authenticateToken, authorizeRoles('admin', 'operations', 'sales', 'finance'), getPaymentLedger);
router.post('/send-whatsapp-scanner', authenticateToken, authorizeRoles('admin', 'operations', 'sales'), sendWhatsAppPaymentRequest);
router.get('/inquiry/:inquiryId', authenticateToken, authorizeRoles('admin', 'operations', 'sales', 'finance'), getInquiryPayments);
router.post('/inquiry/:inquiryId/verify-manual', authenticateToken, authorizeRoles('admin', 'operations', 'sales', 'finance'), verifyManualPayment);
router.get('/request/:paymentId', getPaymentRequestDetails);
router.post('/stripe/create-checkout-session', authenticateToken, createStripeCheckoutSession);
router.post('/razorpay/create-payment-link', authenticateToken, createRazorpayPaymentLink);
router.post('/razorpay/create-subscription-order', authenticateToken, createSubscriptionOrder);
router.post('/razorpay/verify-subscription', authenticateToken, verifySubscriptionPayment);

export default router;
