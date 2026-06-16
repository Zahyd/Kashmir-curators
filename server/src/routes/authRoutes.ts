import { Router } from 'express';
import { register, login, getMe, teamLogin, teamSendOtp, teamVerifyOtp, updateProfile, googleLogin, googleRealtimeLogin } from '../controllers/authController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, name]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *               name: { type: string }
 *     responses:
 *       201:
 *         description: User registered successfully
 */
router.post('/register', register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post('/login', login);

/**
 * @swagger
 * /api/auth/google-login:
 *   post:
 *     summary: Google OAuth backend sign in / signup bypass
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, name]
 *             properties:
 *               email: { type: string }
 *               name: { type: string }
 *               image: { type: string }
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post('/google-login', googleLogin);

/**
 * @swagger
 * /api/auth/google-realtime:
 *   post:
 *     summary: Live Google OAuth identity token verification
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [credentialToken]
 *             properties:
 *               credentialToken: { type: string }
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post('/google-realtime', googleRealtimeLogin);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved
 */
router.get('/me', authenticateToken, getMe);
router.put('/profile', authenticateToken, updateProfile);
router.post('/team-login', teamLogin);
router.post('/team-send-otp', teamSendOtp);
router.post('/team-verify-otp', teamVerifyOtp);

export default router;
