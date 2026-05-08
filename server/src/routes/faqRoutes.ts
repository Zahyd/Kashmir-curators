import { Router } from 'express';
import { getFAQs } from '../controllers/faqController';

const router = Router();

router.get('/', getFAQs);

export default router;
