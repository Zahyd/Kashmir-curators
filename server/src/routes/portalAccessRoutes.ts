import { Router } from 'express';
import {
  verifyPortalAccess,
  listPortalKeys,
  generatePortalKey,
  toggleKeyStatus,
  deletePortalKey
} from '../controllers/portalAccessController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// Public verification endpoint
router.post('/verify', verifyPortalAccess);

// Superadmin-only key management endpoints
router.get('/', authenticateToken, listPortalKeys);
router.post('/', authenticateToken, generatePortalKey);
router.patch('/:id/toggle', authenticateToken, toggleKeyStatus);
router.delete('/:id', authenticateToken, deletePortalKey);

export default router;
