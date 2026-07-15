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
  createHotelReview
} from '../controllers/hotelController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// Dashboard Operations & KPIs
router.get('/operations/dashboard', authenticateToken, getHotelsDashboard);

// Room Categories
router.get('/operations/categories', authenticateToken, getRoomCategories);
router.post('/operations/categories', authenticateToken, createRoomCategory);
router.patch('/operations/categories/:id', authenticateToken, updateRoomCategory);
router.delete('/operations/categories/:id', authenticateToken, deleteRoomCategory);

// Physical Hotel Rooms & Housekeeping
router.get('/operations/rooms', authenticateToken, getHotelRooms);
router.post('/operations/rooms', authenticateToken, createHotelRoom);
router.patch('/operations/rooms/:id', authenticateToken, updateHotelRoom);
router.delete('/operations/rooms/:id', authenticateToken, deleteHotelRoom);

// Housekeeping / Maintenance Request logging
router.get('/operations/maintenance', authenticateToken, getMaintenanceRequests);
router.post('/operations/maintenance', authenticateToken, createMaintenanceRequest);
router.patch('/operations/maintenance/:id', authenticateToken, updateMaintenanceRequest);

// Settlements & Commissions
router.get('/operations/settlements', authenticateToken, getVendorSettlements);
router.post('/operations/settlements', authenticateToken, createVendorSettlement);

// Hotel Reviews
router.get('/operations/reviews', authenticateToken, getHotelReviews);
router.post('/operations/reviews', authenticateToken, createHotelReview);

// Base Hotel CRUD
router.get('/', getHotels);
router.get('/:id', getHotelById);
router.post('/', authenticateToken, createHotel);
router.patch('/:id', authenticateToken, updateHotel);
router.delete('/:id', authenticateToken, deleteHotel);

export default router;
