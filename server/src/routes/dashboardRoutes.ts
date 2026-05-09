import { Router } from 'express';
import { getAdminStats, getSalesStats } from '../controllers/dashboardController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.get('/admin', authenticateToken, getAdminStats);
router.get('/sales', authenticateToken, getSalesStats);

export default router;
