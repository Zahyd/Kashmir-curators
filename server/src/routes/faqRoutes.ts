import { Router } from 'express';
import { 
  getFAQs, 
  createFAQ, 
  updateFAQ, 
  deleteFAQ 
} from '../controllers/faqController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.get('/', getFAQs);
router.post('/', authenticateToken, createFAQ);
router.patch('/:id', authenticateToken, updateFAQ);
router.delete('/:id', authenticateToken, deleteFAQ);

export default router;
