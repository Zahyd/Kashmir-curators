import { Router } from 'express';
import { getAllUsers, getUserStats, createTeamMember, deleteUser, updateUser } from '../controllers/userController';
import { authenticateToken } from '../middleware/authMiddleware';
import { authorizeRoles } from '../middleware/roleMiddleware';

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
router.get('/', authenticateToken, authorizeRoles('admin', 'operations'), getAllUsers);

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
router.get('/stats', authenticateToken, authorizeRoles('admin', 'operations', 'finance'), getUserStats);

/**
 * @swagger
 * /api/users/team:
 *   post:
 *     summary: Create a team member (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.post('/team', authenticateToken, authorizeRoles('admin'), createTeamMember);

/**
 * @swagger
 * /api/users/:id:
 *   patch:
 *     summary: Update a user profile (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/:id', authenticateToken, authorizeRoles('admin'), updateUser);

/**
 * @swagger
 * /api/users/:id:
 *   delete:
 *     summary: Delete a user or team member (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', authenticateToken, authorizeRoles('admin'), deleteUser);

export default router;
