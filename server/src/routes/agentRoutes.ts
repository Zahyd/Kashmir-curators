import { Router } from 'express';
import { 
  registerAgent, 
  getAgents, 
  verifyAgent, 
  getAgentStats,
  submitAgencyApplication,
  getApplicationStatus,
  getApplications,
  reviewApplication
} from '../controllers/agentController';
import { authenticateToken } from '../middleware/authMiddleware';
import { authorizeRoles } from '../middleware/roleMiddleware';

const router = Router();

// Public Agency Onboarding & Application Status
router.post('/apply', submitAgencyApplication);
router.get('/application-status/:query', getApplicationStatus);

// Agent Profile & Workspace
router.post('/register', authenticateToken, registerAgent);
router.get('/stats', authenticateToken, getAgentStats);

// Admin Review & Oversight
router.get('/applications', authenticateToken, authorizeRoles('admin', 'operations'), getApplications);
router.patch('/applications/:id/review', authenticateToken, authorizeRoles('admin'), reviewApplication);
router.get('/', authenticateToken, authorizeRoles('admin'), getAgents);
router.patch('/:id/verify', authenticateToken, authorizeRoles('admin'), verifyAgent);

export default router;
