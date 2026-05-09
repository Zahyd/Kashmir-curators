import { Router } from 'express';
import { 
  getCabs, 
  createCab, 
  updateCab, 
  deleteCab 
} from '../controllers/cabController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.get('/', getCabs);
router.post('/', authenticateToken, createCab);
router.patch('/:id', authenticateToken, updateCab);
router.delete('/:id', authenticateToken, deleteCab);

export default router;
