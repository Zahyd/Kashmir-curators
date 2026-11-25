import { Router } from 'express';
import {
  verifyPortalAccess,
  listPortalKeys,
  generatePortalKey,
  toggleKeyStatus,
  deletePortalKey
} from '../controllers/portalAccessController';
import { authenticateToken } from '../middleware/authMiddleware';
import { authorizeRoles } from '../middleware/roleMiddleware';

const router = Router();

// Public verification endpoint
router.post('/verify', verifyPortalAccess);

// Superadmin-only key management endpoints
router.get('/', authenticateToken, authorizeRoles('admin'), listPortalKeys);
router.post('/', authenticateToken, authorizeRoles('admin'), generatePortalKey);
router.patch('/:id/toggle', authenticateToken, authorizeRoles('admin'), toggleKeyStatus);
router.delete('/:id', authenticateToken, authorizeRoles('admin'), deletePortalKey);

export default router;
