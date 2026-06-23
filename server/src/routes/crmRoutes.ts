import { Router } from 'express';
import { getCRMLeads, updateLeadStage } from '../controllers/crmController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.get('/leads', authenticateToken, getCRMLeads);
router.patch('/leads/:id', authenticateToken, updateLeadStage);

export default router;
