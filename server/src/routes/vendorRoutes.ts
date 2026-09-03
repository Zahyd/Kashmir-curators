import { Router } from 'express';
import {
  registerVendor,
  getMyListings,
  getAllListings,
  createListing,
  updateListing,
  getVendorDashboardStats
} from '../controllers/vendorController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.get('/listings', getAllListings);
router.post('/register', authenticateToken, registerVendor);
router.get('/my-listings', authenticateToken, getMyListings);
router.post('/listings', authenticateToken, createListing);
router.patch('/listings/:id', authenticateToken, updateListing);
router.get('/stats', authenticateToken, getVendorDashboardStats);

export default router;
