import { Router } from 'express';
import { registerAgent, getAgents, verifyAgent, getAgentStats } from '../controllers/agentController';
import { authenticateToken } from '../middleware/authMiddleware';
import { authorizeRoles } from '../middleware/roleMiddleware';

const router = Router();

router.post('/register', authenticateToken, registerAgent);
router.get('/stats', authenticateToken, getAgentStats);
router.get('/', authenticateToken, authorizeRoles('admin'), getAgents);
router.patch('/:id/verify', authenticateToken, authorizeRoles('admin'), verifyAgent);

export default router;
