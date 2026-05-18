import { Router } from 'express';
import { handleRazorpayWebhook } from '../controllers/paymentController';

const router = Router();

/**
 * @swagger
 * /api/payments/webhook:
 *   post:
 *     summary: Handle incoming Razorpay Webhook payments
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook event parsed and processed successfully
 */
router.post('/webhook', handleRazorpayWebhook);

export default router;
