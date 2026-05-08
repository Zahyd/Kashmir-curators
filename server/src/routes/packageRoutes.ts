import { Router } from 'express';
import { getPackages, getPackageById } from '../controllers/packageController';

const router = Router();

router.get('/', getPackages);
router.get('/:id', getPackageById);

export default router;
