import { Router } from 'express';
import { getSiteContent, saveSiteContentSection } from '../controllers/siteContentController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

/**
 * @swagger
 * /api/site-content:
 *   get:
 *     summary: Fetch all site content sections
 *     tags: [SiteContent]
 */
router.get('/', getSiteContent);

/**
 * @swagger
 * /api/site-content/{sectionKey}:
 *   post:
 *     summary: Save or update a site content section (Admin only)
 *     tags: [SiteContent]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:sectionKey', authenticateToken, saveSiteContentSection);

export default router;
