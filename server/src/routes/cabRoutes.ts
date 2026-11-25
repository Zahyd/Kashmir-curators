import { Router } from 'express';
import { 
  getCabs, 
  createCab, 
  updateCab, 
  deleteCab,
  getOperationsData,
  updateCabSettings,
  blockCabDates,
  unblockCabDates,
  notifyDriver,
  addOperationsLog,
  createDriver,
  updateDriver,
  deleteDriver,
  updateMaintenanceRecords
} from '../controllers/cabController';
import { authenticateToken } from '../middleware/authMiddleware';
import { authorizeRoles } from '../middleware/roleMiddleware';

const router = Router();
const adminOps = authorizeRoles('admin', 'operations');
const fleetOps = authorizeRoles('admin', 'operations', 'driver');

// Fleet Operations & Command Center
router.get('/operations/data', authenticateToken, fleetOps, getOperationsData);
router.patch('/operations/settings/:cabId', authenticateToken, adminOps, updateCabSettings);
router.post('/operations/block', authenticateToken, adminOps, blockCabDates);
router.delete('/operations/block/:blockId', authenticateToken, adminOps, unblockCabDates);
router.post('/operations/notify-driver', authenticateToken, adminOps, notifyDriver);
router.post('/operations/logs', authenticateToken, fleetOps, addOperationsLog);

// Maintenance management endpoint
router.patch('/operations/maintenance', authenticateToken, adminOps, updateMaintenanceRecords);

// Driver Management CRUD endpoints
router.post('/operations/drivers', authenticateToken, adminOps, createDriver);
router.patch('/operations/drivers/:id', authenticateToken, adminOps, updateDriver);
router.delete('/operations/drivers/:id', authenticateToken, adminOps, deleteDriver);

// Fleet registry
router.get('/', getCabs);
router.post('/', authenticateToken, adminOps, createCab);
router.patch('/:id', authenticateToken, adminOps, updateCab);
router.delete('/:id', authenticateToken, adminOps, deleteCab);

export default router;
