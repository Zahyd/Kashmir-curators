import { Router } from 'express';
import { getMyWallet, applyWalletCredits } from '../controllers/walletController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.get('/my', authenticateToken, getMyWallet);
router.post('/apply', authenticateToken, applyWalletCredits);

export default router;
