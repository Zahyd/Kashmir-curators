import { Router } from 'express';
import { getCurators, getCuratorById } from '../controllers/curatorController';

const router = Router();

router.get('/', getCurators);
router.get('/:id', getCuratorById);

export default router;
