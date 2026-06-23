import { Router } from 'express';
import { getFinanceTransactions, getFinanceOverview } from '../controllers/financeController';
import { authenticateToken } from '../middleware/authMiddleware';
import { authorizeRoles } from '../middleware/roleMiddleware';

const router = Router();

router.get('/transactions', authenticateToken, authorizeRoles('admin', 'finance'), getFinanceTransactions);
router.get('/overview', authenticateToken, authorizeRoles('admin', 'finance'), getFinanceOverview);

export default router;
