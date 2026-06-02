import { Router } from 'express';
import { getAdvisories, updateAdvisory } from '../controllers/advisoryController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.get('/', getAdvisories);
router.patch('/:id', authenticateToken, updateAdvisory);

export default router;
