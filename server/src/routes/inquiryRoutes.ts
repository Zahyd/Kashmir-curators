import { Router } from 'express';
import { getInquiries, createInquiry, updateInquiry } from '../controllers/inquiryController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authenticateToken, getInquiries);
router.patch('/:id', authenticateToken, updateInquiry);

/**
 * @swagger
 * /api/inquiries:
 *   post:
 *     summary: Submit a new trip inquiry
 *     tags: [Inquiries]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [customerName, email, destination]
 *             properties:
 *               customerName: { type: string }
 *               email: { type: string }
 *               phone: { type: string }
 *               destination: { type: string }
 *               duration: { type: string }
 *               travelers: { type: string }
 *               budget: { type: string }
 *               accommodation: { type: string }
 *     responses:
 *       201:
 *         description: Inquiry submitted successfully
 */
router.post('/', createInquiry);

export default router;
