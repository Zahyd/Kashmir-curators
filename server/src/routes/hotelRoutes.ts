import { Router } from 'express';
import { 
  getHotels, 
  getHotelById, 
  createHotel, 
  updateHotel, 
  deleteHotel,
  getHotelsDashboard,
  getRoomCategories,
  createRoomCategory,
  updateRoomCategory,
  deleteRoomCategory,
  getHotelRooms,
  createHotelRoom,
  updateHotelRoom,
  deleteHotelRoom,
  getMaintenanceRequests,
  createMaintenanceRequest,
  updateMaintenanceRequest,
  getVendorSettlements,
  createVendorSettlement,
  getHotelReviews,
  createHotelReview,
  getHousekeepingTasks,
  createHousekeepingTask,
  updateHousekeepingTask,
  deleteHousekeepingTask,
  getWinterOpsStatus,
  updateWinterOpsStatus,
  getSettlementLedger,
  getSeasonalRates,
  updateSeasonalRate
} from '../controllers/hotelController';
import { authenticateToken, optionalAuthenticate } from '../middleware/authMiddleware';
import { authorizeRoles } from '../middleware/roleMiddleware';
import { cacheResponse, invalidateRouteCache } from '../lib/cache';

const router = Router();
const hospRoles = authorizeRoles('admin', 'operations', 'hospitality', 'supplier');
const adminOps = authorizeRoles('admin', 'operations');

// Dashboard Operations & KPIs
router.get('/operations/dashboard', authenticateToken, hospRoles, getHotelsDashboard);

// Room Categories
router.get('/operations/categories', optionalAuthenticate, getRoomCategories);
router.post('/operations/categories', authenticateToken, hospRoles, createRoomCategory);
router.patch('/operations/categories/:id', authenticateToken, hospRoles, updateRoomCategory);
router.delete('/operations/categories/:id', authenticateToken, hospRoles, deleteRoomCategory);

// Seasonal Tariffs & Dynamic Rates
router.get('/operations/tariffs', optionalAuthenticate, getSeasonalRates);
router.patch('/operations/tariffs/:id', authenticateToken, hospRoles, updateSeasonalRate);

// Physical Hotel Rooms & Housekeeping
router.get('/operations/rooms', optionalAuthenticate, getHotelRooms);
router.post('/operations/rooms', authenticateToken, hospRoles, createHotelRoom);
router.patch('/operations/rooms/:id', authenticateToken, hospRoles, updateHotelRoom);
router.delete('/operations/rooms/:id', authenticateToken, hospRoles, deleteHotelRoom);

// Housekeeping / Maintenance Request logging
router.get('/operations/maintenance', authenticateToken, hospRoles, getMaintenanceRequests);
router.post('/operations/maintenance', authenticateToken, hospRoles, createMaintenanceRequest);
router.patch('/operations/maintenance/:id', authenticateToken, hospRoles, updateMaintenanceRequest);

// Settlements & Commissions
router.get('/operations/settlements/ledger', authenticateToken, authorizeRoles('admin', 'operations', 'finance', 'hospitality'), getSettlementLedger);
router.get('/operations/settlements', authenticateToken, authorizeRoles('admin', 'operations', 'finance', 'hospitality'), getVendorSettlements);
router.post('/operations/settlements', authenticateToken, authorizeRoles('admin', 'operations', 'finance'), createVendorSettlement);

// Housekeeping Tasks
router.get('/operations/housekeeping', authenticateToken, hospRoles, getHousekeepingTasks);
router.post('/operations/housekeeping', authenticateToken, hospRoles, createHousekeepingTask);
router.patch('/operations/housekeeping/:id', authenticateToken, hospRoles, updateHousekeepingTask);
router.delete('/operations/housekeeping/:id', authenticateToken, hospRoles, deleteHousekeepingTask);

// Winter Operations & Heating
router.get('/operations/winter-ops', authenticateToken, hospRoles, getWinterOpsStatus);
router.post('/operations/winter-ops', authenticateToken, hospRoles, updateWinterOpsStatus);

// Hotel Reviews
router.get('/operations/reviews', authenticateToken, hospRoles, getHotelReviews);
router.post('/operations/reviews', authenticateToken, hospRoles, createHotelReview);

// Base Hotel CRUD
router.get('/', cacheResponse(300), getHotels);
router.get('/:id', cacheResponse(300), getHotelById);
router.post('/', authenticateToken, adminOps, (req, res, next) => {
  invalidateRouteCache('/hotels');
  next();
}, createHotel);
router.patch('/:id', authenticateToken, adminOps, (req, res, next) => {
  invalidateRouteCache('/hotels');
  next();
}, updateHotel);
router.delete('/:id', authenticateToken, adminOps, (req, res, next) => {
  invalidateRouteCache('/hotels');
  next();
}, deleteHotel);

export default router;
