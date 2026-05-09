import { Router } from 'express';
import { 
  getTestimonials, 
  createTestimonial, 
  updateTestimonial, 
  deleteTestimonial 
} from '../controllers/testimonialController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.get('/', getTestimonials);
router.post('/', authenticateToken, createTestimonial);
router.patch('/:id', authenticateToken, updateTestimonial);
router.delete('/:id', authenticateToken, deleteTestimonial);

export default router;
