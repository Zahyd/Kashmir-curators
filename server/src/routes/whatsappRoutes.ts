import { Router } from 'express';
import { verifyWebhook, receiveMessage } from '../controllers/whatsappController';

const router = Router();

router.get('/', verifyWebhook);
router.post('/', receiveMessage);

export default router;
