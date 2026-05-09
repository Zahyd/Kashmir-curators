import { Router } from 'express';
import { 
  getHotels, 
  getHotelById, 
  createHotel, 
  updateHotel, 
  deleteHotel 
} from '../controllers/hotelController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.get('/', getHotels);
router.get('/:id', getHotelById);
router.post('/', authenticateToken, createHotel);
router.patch('/:id', authenticateToken, updateHotel);
router.delete('/:id', authenticateToken, deleteHotel);

export default router;
