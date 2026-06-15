import { Router } from 'express';
import { 
  handleRazorpayWebhook, 
  sendWhatsAppPaymentRequest, 
  getPaymentRequestDetails 
} from '../controllers/paymentController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

/**
 * @swagger
 * /api/payments/webhook:
 *   post:
 *     summary: Handle incoming Razorpay Webhook payments
 *     tags: [Payments]
 */
router.post('/webhook', handleRazorpayWebhook);

/**
 * @swagger
 * /api/payments/send-whatsapp-scanner:
 *   post:
 *     summary: Generate payment QR and send request via WhatsApp
 *     tags: [Payments]
 */
router.post('/send-whatsapp-scanner', authenticateToken, sendWhatsAppPaymentRequest);

/**
 * @swagger
 * /api/payments/request/{paymentId}:
 *   get:
 *     summary: Fetch specific payment request details
 *     tags: [Payments]
 */
router.get('/request/:paymentId', getPaymentRequestDetails);

export default router;
