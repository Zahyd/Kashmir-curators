import { Router } from 'express';
import { 
  verifyWebhook, 
  receiveMessage, 
  getConversations, 
  getMessagesByPhone, 
  sendMessage, 
  sendTemplateMessage 
} from '../controllers/whatsappController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// Meta Webhook Endpoints
router.get('/', verifyWebhook);
router.post('/', receiveMessage);

// Team Inbox & Agent Messaging
router.get('/conversations', authenticateToken, getConversations);
router.get('/messages/:phone', authenticateToken, getMessagesByPhone);
router.post('/send', authenticateToken, sendMessage);
router.post('/send-template', authenticateToken, sendTemplateMessage);

export default router;
