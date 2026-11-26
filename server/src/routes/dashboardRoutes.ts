import { Router } from 'express';
import { getAdminStats, getSalesStats } from '../controllers/dashboardController';
import { authenticateToken } from '../middleware/authMiddleware';
import { authorizeRoles } from '../middleware/roleMiddleware';
import { ADMIN_DASHBOARD_ROLES, SALES_PORTAL_ROLES } from '../lib/roleUtils';

const router = Router();

router.get('/admin', authenticateToken, authorizeRoles(...ADMIN_DASHBOARD_ROLES), getAdminStats);
router.get('/sales', authenticateToken, authorizeRoles(...SALES_PORTAL_ROLES), getSalesStats);

export default router;
