import { Router } from 'express';
import { createBooking, getMyBookings, updateBookingStatus, getAllBookings, deleteBooking } from '../controllers/bookingController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

/**
 * @swagger
 * /api/bookings:
 *   post:
 *     summary: Create a new booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type, itemName, bookingDate, totalAmount, details]
 *             properties:
 *               type: { type: string, enum: [hotel, package, cab] }
 *               itemName: { type: string }
 *               bookingDate: { type: string, format: date-time }
 *               totalAmount: { type: number }
 *               details: { type: object }
 *     responses:
 *       201:
 *         description: Booking created successfully
 */
router.post('/', authenticateToken, createBooking);

/**
 * @swagger
 * /api/bookings:
 *   get:
 *     summary: Get all bookings (Admin only)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all bookings
 */
router.get('/', authenticateToken, getAllBookings);

/**
 * @swagger
 * /api/bookings/my:
 *   get:
 *     summary: Get current user's bookings
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of bookings retrieved
 */
router.get('/my', authenticateToken, getMyBookings);

/**
 * @swagger
 * /api/bookings/{id}:
 *   patch:
 *     summary: Update booking status
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [pending, confirmed, cancelled, completed] }
 *     responses:
 *       200:
 *         description: Booking status updated
 */
router.patch('/:id', authenticateToken, updateBookingStatus);
router.delete('/:id', authenticateToken, deleteBooking);

export default router;
