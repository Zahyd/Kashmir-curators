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

const router = Router();

router.get('/', getPackages);
router.get('/:id', getPackageById);
router.post('/', authenticateToken, createPackage);
router.patch('/:id', authenticateToken, updatePackage);
router.delete('/:id', authenticateToken, deletePackage);

router.get('/:id/reviews', getPackageReviews);
router.post('/:id/reviews', authenticateToken, createPackageReview);

export default router;
