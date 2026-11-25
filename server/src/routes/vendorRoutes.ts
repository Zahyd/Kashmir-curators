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
import { authorizeRoles } from '../middleware/roleMiddleware';

const router = Router();

// Public marketplace and onboarding routes
router.get('/listings', getAllListings);
router.post('/onboard', onboardVendor);

// Authenticated vendor operations
router.post('/register', authenticateToken, registerVendor);
router.get('/my-listings', authenticateToken, authorizeRoles('admin', 'operations', 'supplier'), getMyListings);
router.post('/listings', authenticateToken, authorizeRoles('admin', 'operations', 'supplier'), createListing);
router.patch('/listings/:id', authenticateToken, authorizeRoles('admin', 'operations', 'supplier'), updateListing);
router.delete('/listings/:id', authenticateToken, authorizeRoles('admin', 'operations', 'supplier'), deleteListing);
router.get('/bookings', authenticateToken, authorizeRoles('admin', 'operations', 'supplier'), getVendorBookings);
router.post('/payout-request', authenticateToken, authorizeRoles('admin', 'operations', 'supplier'), requestVendorPayout);
router.post('/report-disruption', authenticateToken, authorizeRoles('admin', 'operations', 'supplier'), reportGroundDisruption);
router.get('/stats', authenticateToken, authorizeRoles('admin', 'operations', 'supplier'), getVendorDashboardStats);

export default router;
