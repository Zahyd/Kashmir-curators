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
  reviewDriverApplication,
  updateMaintenanceRecords,
  getLiveCabMatches,
  getMyRideRequests,
  createRideRequest,
  getRideRequestById,
  touristCounterOffer,
  confirmRideOffer,
  cancelRideRequest,
} from '../controllers/cabController';
import { authenticateToken, optionalAuthenticate } from '../middleware/authMiddleware';
import { authorizeRoles } from '../middleware/roleMiddleware';

const router = Router();
const adminOps = authorizeRoles('admin', 'operations');
const fleetOps = authorizeRoles('admin', 'operations', 'driver');

// Public live matching & real-time tourist dispatch endpoints (MUST stay above /:id)
router.get('/live-matches', optionalAuthenticate, getLiveCabMatches);
router.get('/ride-requests', authenticateToken, getMyRideRequests);
router.post('/ride-requests', authenticateToken, createRideRequest);
router.get('/ride-requests/:id', authenticateToken, getRideRequestById);
router.post('/ride-requests/:id/offers/:offerId/counter', authenticateToken, touristCounterOffer);
router.post('/ride-requests/:id/offers/:offerId/confirm', authenticateToken, confirmRideOffer);
router.post('/ride-requests/:id/cancel', authenticateToken, cancelRideRequest);

// Fleet Operations & Command Center
router.get('/operations/data', authenticateToken, fleetOps, getOperationsData);
router.patch('/operations/settings/:cabId', authenticateToken, adminOps, updateCabSettings);
router.post('/operations/block', authenticateToken, adminOps, blockCabDates);
router.delete('/operations/block/:blockId', authenticateToken, adminOps, unblockCabDates);
router.post('/operations/notify-driver', authenticateToken, adminOps, notifyDriver);
router.post('/operations/logs', authenticateToken, fleetOps, addOperationsLog);

// Maintenance management endpoint
router.patch('/operations/maintenance', authenticateToken, adminOps, updateMaintenanceRecords);

// Driver Management & KYC Review CRUD endpoints
router.post('/operations/drivers', authenticateToken, adminOps, createDriver);
router.post('/operations/drivers/:id/review', authenticateToken, adminOps, reviewDriverApplication);
router.patch('/operations/drivers/:id', authenticateToken, adminOps, updateDriver);
router.delete('/operations/drivers/:id', authenticateToken, adminOps, deleteDriver);

// Fleet registry
router.get('/', getCabs);
router.post('/', authenticateToken, adminOps, createCab);
router.patch('/:id', authenticateToken, adminOps, updateCab);
router.delete('/:id', authenticateToken, adminOps, deleteCab);

export default router;
