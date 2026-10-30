import { Router } from 'express';
import { 
  getInquiries, 
  createInquiry, 
  updateInquiry, 
  sendProposal, 
  getDynamicQuote, 
  getPublicInquiryItinerary, 
  deleteInquiry,
  captureQuickLead,
  enrichLeadProfile,
  requestInstantCallback
} from '../controllers/inquiryController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// Public Lead Capture Engine Routes (Frictionless, No Auth Wall)
router.post('/quick-capture', captureQuickLead);
router.patch('/:id/enrich', enrichLeadProfile);
router.post('/callback-request', requestInstantCallback);

router.get('/public/:id', getPublicInquiryItinerary);
router.get('/', authenticateToken, getInquiries);
router.patch('/:id', authenticateToken, updateInquiry);
router.delete('/:id', authenticateToken, deleteInquiry);
router.post('/:id/send-proposal', authenticateToken, sendProposal);
router.post('/quote', getDynamicQuote);

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
