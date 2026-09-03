import { Router } from 'express';
import {
  getDisruptionStatus,
  getAffectedBookings,
  triggerDisruptionEvaluation,
  resolveDisruption,
  getKashmirFlexPolicies
} from '../controllers/disruptionController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.get('/status', getDisruptionStatus);
router.get('/policies', getKashmirFlexPolicies);
router.get('/affected-bookings', authenticateToken, getAffectedBookings);
router.post('/evaluate', authenticateToken, triggerDisruptionEvaluation);
router.post('/resolve', authenticateToken, resolveDisruption);

export default router;
