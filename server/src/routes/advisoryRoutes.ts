import { Router } from 'express';
import {
  getAdvisories,
  createAdvisory,
  updateAdvisory,
  deleteAdvisory,
  toggleEmergencyMode
} from '../controllers/advisoryController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.get('/', getAdvisories);
router.post('/', authenticateToken, createAdvisory);
router.patch('/:id', authenticateToken, updateAdvisory);
router.delete('/:id', authenticateToken, deleteAdvisory);
router.post('/emergency-mode', authenticateToken, toggleEmergencyMode);

export default router;
