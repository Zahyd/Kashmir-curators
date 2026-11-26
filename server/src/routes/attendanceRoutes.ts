import { Router } from 'express';
import {
  clockIn,
  recordPulse,
  toggleBreak,
  clockOut,
  getMyAttendance,
  getLivePresence,
  getAttendanceReports
} from '../controllers/attendanceController';
import { authenticateToken } from '../middleware/authMiddleware';
import { authorizeRoles } from '../middleware/roleMiddleware';

const router = Router();
const staffRoles = authorizeRoles('admin', 'operations', 'sales', 'marketing', 'finance', 'hospitality');

router.post('/clock-in', authenticateToken, staffRoles, clockIn);
router.post('/pulse', authenticateToken, staffRoles, recordPulse);
router.post('/break', authenticateToken, staffRoles, toggleBreak);
router.post('/clock-out', authenticateToken, staffRoles, clockOut);
router.get('/my', authenticateToken, staffRoles, getMyAttendance);
router.get('/live-presence', authenticateToken, staffRoles, getLivePresence);
router.get('/reports', authenticateToken, staffRoles, getAttendanceReports);

export default router;
