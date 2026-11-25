import { Router } from 'express';
import { 
  handleRazorpayWebhook, 
  sendWhatsAppPaymentRequest, 
  getPaymentRequestDetails,
  createStripeCheckoutSession,
  createRazorpayPaymentLink,
  createSubscriptionOrder,
  verifySubscriptionPayment
} from '../controllers/paymentController';
import { authenticateToken } from '../middleware/authMiddleware';
import { authorizeRoles } from '../middleware/roleMiddleware';

const router = Router();

router.post('/webhook', handleRazorpayWebhook);
router.post('/send-whatsapp-scanner', authenticateToken, authorizeRoles('admin', 'operations', 'sales'), sendWhatsAppPaymentRequest);
router.get('/request/:paymentId', getPaymentRequestDetails);
router.post('/stripe/create-checkout-session', authenticateToken, createStripeCheckoutSession);
router.post('/razorpay/create-payment-link', authenticateToken, createRazorpayPaymentLink);
router.post('/razorpay/create-subscription-order', authenticateToken, createSubscriptionOrder);
router.post('/razorpay/verify-subscription', authenticateToken, verifySubscriptionPayment);

export default router;
