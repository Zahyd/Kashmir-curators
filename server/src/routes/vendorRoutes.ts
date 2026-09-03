import { Router } from 'express';
import {
  onboardVendor,
  registerVendor,
  getMyListings,
  getAllListings,
  createListing,
  updateListing,
  deleteListing,
  getVendorBookings,
  requestVendorPayout,
  reportGroundDisruption,
  getVendorDashboardStats
} from '../controllers/vendorController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// Public marketplace and onboarding routes
router.get('/listings', getAllListings);
router.post('/onboard', onboardVendor);

// Authenticated vendor operations
router.post('/register', authenticateToken, registerVendor);
router.get('/my-listings', authenticateToken, getMyListings);
router.post('/listings', authenticateToken, createListing);
router.patch('/listings/:id', authenticateToken, updateListing);
router.delete('/listings/:id', authenticateToken, deleteListing);
router.get('/bookings', authenticateToken, getVendorBookings);
router.post('/payout-request', authenticateToken, requestVendorPayout);
router.post('/report-disruption', authenticateToken, reportGroundDisruption);
router.get('/stats', authenticateToken, getVendorDashboardStats);

export default router;
