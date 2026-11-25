import { Router } from 'express';
import {
  getOrganizations,
  getCurrentOrganization,
  getOrganizationById,
  createOrganization,
  updateOrganization,
  getOrganizationStats
} from '../controllers/organizationController';
import { authenticateToken, optionalAuthenticate } from '../middleware/authMiddleware';
import { authorizeRoles } from '../middleware/roleMiddleware';
import { tenantMiddleware } from '../middleware/tenantMiddleware';

const router = Router();

// Authenticate optionally BEFORE tenant resolution so req.user is populated for extractTenantId
router.use(optionalAuthenticate, tenantMiddleware);

// Public / Authenticated read routes
router.get('/current', getCurrentOrganization);
router.get('/', getOrganizations);
router.get('/:id', getOrganizationById);
router.get('/:id/stats', getOrganizationStats);

// Protected mutation routes
router.post('/', authenticateToken, authorizeRoles('admin', 'operations', 'agent', 'hospitality', 'supplier'), createOrganization);
router.patch('/:id', authenticateToken, authorizeRoles('admin', 'operations', 'agent', 'hospitality', 'supplier'), updateOrganization);

export default router;
