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
  deleteDriver
} from '../controllers/cabController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// Fleet Operations & Command Center
router.get('/operations/data', authenticateToken, getOperationsData);
router.patch('/operations/settings/:cabId', authenticateToken, updateCabSettings);
router.post('/operations/block', authenticateToken, blockCabDates);
router.delete('/operations/block/:blockId', authenticateToken, unblockCabDates);
router.post('/operations/notify-driver', authenticateToken, notifyDriver);
router.post('/operations/logs', authenticateToken, addOperationsLog);

// Driver Management CRUD endpoints
router.post('/operations/drivers', authenticateToken, createDriver);
router.patch('/operations/drivers/:id', authenticateToken, updateDriver);
router.delete('/operations/drivers/:id', authenticateToken, deleteDriver);

// Fleet registry
router.get('/', getCabs);
router.post('/', authenticateToken, createCab);
router.patch('/:id', authenticateToken, updateCab);
router.delete('/:id', authenticateToken, deleteCab);

export default router;
