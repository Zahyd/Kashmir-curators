import { Router } from 'express';
import { getAllUsers, getUserStats, createTeamMember, deleteUser } from '../controllers/userController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all users
 */
router.get('/', authenticateToken, getAllUsers);

/**
 * @swagger
 * /api/users/stats:
 *   get:
 *     summary: Get user statistics
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User statistics
 */
router.get('/stats', authenticateToken, getUserStats);

/**
 * @swagger
 * /api/users/team:
 *   post:
 *     summary: Create a team member (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.post('/team', authenticateToken, createTeamMember);

/**
 * @swagger
 * /api/users/:id:
 *   delete:
 *     summary: Delete a user or team member (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', authenticateToken, deleteUser);

export default router;
