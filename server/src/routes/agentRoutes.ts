import { Router } from 'express';
import multer from 'multer';
import {
  registerAgent,
  getAgents,
  verifyAgent,
  verifyAgentLicense,
  getAgentStats,
  submitAgencyApplication,
  getApplicationStatus,
  getApplications,
  reviewApplication,
  sseQueryTokenBridge,
  streamAgentEvents,
  getAgentRealtimeHealth,
  getAgentBranding,
  updateAgentBranding,
  getAgentTeamSeats,
  createAgentTeamSeat,
  deleteAgentTeamSeat,
  getAgentSupply,
  holdAgentSupplyRate,
  getAgentApiFeed,
  regenerateAgentApiKey,
  getAgentDomain,
  updateAgentDomain,
  verifyAgentDomain,
  getAgentCreditLedger
} from '../controllers/agentController';
import { createCRMLead } from '../controllers/crmController';
import { authenticateToken } from '../middleware/authMiddleware';
import { authorizeRoles } from '../middleware/roleMiddleware';

const router = Router();
const uploadLicense = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

const AGENT_WORKSPACE_ROLES = ['agent', 'admin', 'operations'] as const;

// Public Agency Onboarding & Application Status
router.post('/apply', submitAgencyApplication);
router.get('/application-status/:query', getApplicationStatus);

// Real-Time Agent SSE Stream & Diagnostics
router.get('/stream', sseQueryTokenBridge, authenticateToken, authorizeRoles(...AGENT_WORKSPACE_ROLES), streamAgentEvents);
router.get('/realtime/health', authenticateToken, authorizeRoles(...AGENT_WORKSPACE_ROLES), getAgentRealtimeHealth);

// Agent Profile, Stats & Accreditation
router.post('/register', authenticateToken, registerAgent);
router.get('/stats', authenticateToken, getAgentStats);
router.post(
  '/verify-license',
  authenticateToken,
  (req, res, next) => {
    if (req.is('multipart/form-data')) {
      return uploadLicense.single('licenseFile')(req, res, next);
    }
    next();
  },
  verifyAgentLicense
);

// Persisted B2B Agent Leads & Workspace Operations
router.post('/leads', authenticateToken, authorizeRoles('agent', 'admin', 'operations', 'sales', 'marketing'), createCRMLead);

router.get('/branding', authenticateToken, authorizeRoles(...AGENT_WORKSPACE_ROLES), getAgentBranding);
router.put('/branding', authenticateToken, authorizeRoles(...AGENT_WORKSPACE_ROLES), updateAgentBranding);

router.get('/team', authenticateToken, authorizeRoles(...AGENT_WORKSPACE_ROLES), getAgentTeamSeats);
router.post('/team', authenticateToken, authorizeRoles(...AGENT_WORKSPACE_ROLES), createAgentTeamSeat);
router.delete('/team/:memberId', authenticateToken, authorizeRoles(...AGENT_WORKSPACE_ROLES), deleteAgentTeamSeat);

router.get('/supply', authenticateToken, authorizeRoles(...AGENT_WORKSPACE_ROLES), getAgentSupply);
router.post('/supply/hold', authenticateToken, authorizeRoles(...AGENT_WORKSPACE_ROLES), holdAgentSupplyRate);

router.get('/api-feed', authenticateToken, authorizeRoles(...AGENT_WORKSPACE_ROLES), getAgentApiFeed);
router.post('/api-keys/regenerate', authenticateToken, authorizeRoles(...AGENT_WORKSPACE_ROLES), regenerateAgentApiKey);

router.get('/domain', authenticateToken, authorizeRoles(...AGENT_WORKSPACE_ROLES), getAgentDomain);
router.put('/domain', authenticateToken, authorizeRoles(...AGENT_WORKSPACE_ROLES), updateAgentDomain);
router.post('/domain/verify', authenticateToken, authorizeRoles(...AGENT_WORKSPACE_ROLES), verifyAgentDomain);

router.get('/credit', authenticateToken, authorizeRoles(...AGENT_WORKSPACE_ROLES), getAgentCreditLedger);

// Admin Review & Oversight
router.get('/applications', authenticateToken, authorizeRoles('admin', 'operations'), getApplications);
router.patch('/applications/:id/review', authenticateToken, authorizeRoles('admin'), reviewApplication);
router.get('/', authenticateToken, authorizeRoles('admin'), getAgents);
router.patch('/:id/verify', authenticateToken, authorizeRoles('admin'), verifyAgent);

export default router;
