import { Router } from 'express';
import { getCabs } from '../controllers/cabController';

const router = Router();

router.get('/', getCabs);

export default router;
