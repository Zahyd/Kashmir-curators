import { Router } from 'express';
import {
  getOrganizations,
  getCurrentOrganization,
  getOrganizationById,
  createOrganization,
  updateOrganization,
  getOrganizationStats
} from '../controllers/organizationController';
import { authenticateToken } from '../middleware/authMiddleware';
import { tenantMiddleware } from '../middleware/tenantMiddleware';

const router = Router();

// Apply tenant context resolution
router.use(tenantMiddleware);

// Public / Authenticated read routes
router.get('/current', getCurrentOrganization);
router.get('/', getOrganizations);
router.get('/:id', getOrganizationById);
router.get('/:id/stats', getOrganizationStats);

// Protected mutation routes
router.post('/', authenticateToken, createOrganization);
router.patch('/:id', authenticateToken, updateOrganization);

export default router;
