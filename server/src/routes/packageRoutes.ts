import { Router } from 'express';
import { 
  getPackages, 
  getPackageById, 
  createPackage, 
  updatePackage, 
  deletePackage,
  getPackageReviews,
  createPackageReview
} from '../controllers/packageController';
import { authenticateToken } from '../middleware/authMiddleware';
import { authorizeRoles } from '../middleware/roleMiddleware';
import { cacheResponse, invalidateRouteCache } from '../lib/cache';

const router = Router();
const pkgAdminRoles = authorizeRoles('admin', 'operations', 'marketing');

router.get('/', cacheResponse(300), getPackages);
router.get('/:id', cacheResponse(300), getPackageById);
router.post('/', authenticateToken, pkgAdminRoles, (req, res, next) => {
  invalidateRouteCache('/packages');
  next();
}, createPackage);
router.patch('/:id', authenticateToken, pkgAdminRoles, (req, res, next) => {
  invalidateRouteCache('/packages');
  next();
}, updatePackage);
router.delete('/:id', authenticateToken, pkgAdminRoles, (req, res, next) => {
  invalidateRouteCache('/packages');
  next();
}, deletePackage);

router.get('/:id/reviews', getPackageReviews);
router.post('/:id/reviews', authenticateToken, (req, res, next) => {
  invalidateRouteCache('/packages');
  next();
}, createPackageReview);

export default router;
