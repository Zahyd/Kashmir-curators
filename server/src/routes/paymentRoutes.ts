import { Router } from 'express';
import { 
  handleRazorpayWebhook, 
  sendWhatsAppPaymentRequest, 
  getPaymentRequestDetails,
  createStripeCheckoutSession
} from '../controllers/paymentController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.post('/webhook', handleRazorpayWebhook);
router.post('/send-whatsapp-scanner', authenticateToken, sendWhatsAppPaymentRequest);
router.get('/request/:paymentId', getPaymentRequestDetails);
router.post('/stripe/create-checkout-session', authenticateToken, createStripeCheckoutSession);

export default router;
