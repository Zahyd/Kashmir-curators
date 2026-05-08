import { Router } from 'express';
import { createBooking, getMyBookings, updateBookingStatus } from '../controllers/bookingController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.post('/', authenticateToken, createBooking);
router.get('/my', authenticateToken, getMyBookings);
router.patch('/:id', authenticateToken, updateBookingStatus);

export default router;
