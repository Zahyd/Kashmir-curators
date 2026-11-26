import { Router } from 'express';
import { getNotifications, markAsRead, markAllAsRead } from '../controllers/notificationController';
import { authenticateToken } from '../middleware/authMiddleware';
import { authorizeRoles } from '../middleware/roleMiddleware';

const router = Router();
const staffNotificationRoles = authorizeRoles('admin', 'operations', 'sales', 'marketing', 'finance', 'hospitality', 'agent', 'driver');

router.use(authenticateToken, staffNotificationRoles);

router.get('/', getNotifications);
router.patch('/:id/read', markAsRead);
router.post('/read-all', markAllAsRead);

export default router;
