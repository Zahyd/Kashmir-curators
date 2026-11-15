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

const router = Router();

router.post('/clock-in', authenticateToken, clockIn);
router.post('/pulse', authenticateToken, recordPulse);
router.post('/break', authenticateToken, toggleBreak);
router.post('/clock-out', authenticateToken, clockOut);
router.get('/my', authenticateToken, getMyAttendance);
router.get('/live-presence', authenticateToken, getLivePresence);
router.get('/reports', authenticateToken, getAttendanceReports);

export default router;
