import { Router } from 'express';
import { 
  getSiteContent, 
  saveSiteContentSection, 
  saveBatchSiteContent, 
  getRevisions, 
  revertRevision, 
  resetToDefaults 
} from '../controllers/siteContentController';
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
 * /api/site-content/revisions:
 *   get:
 *     summary: Get historical CMS revisions for rollback
 *     tags: [SiteContent]
 */
router.get('/revisions', authenticateToken, getRevisions);

/**
 * @swagger
 * /api/site-content/batch:
 *   post:
 *     summary: Save multiple site content sections simultaneously
 *     tags: [SiteContent]
 */
router.post('/batch', authenticateToken, saveBatchSiteContent);

/**
 * @swagger
 * /api/site-content/revert:
 *   post:
 *     summary: Revert a section to a previous revision
 *     tags: [SiteContent]
 */
router.post('/revert', authenticateToken, revertRevision);

/**
 * @swagger
 * /api/site-content/reset/{sectionKey}:
 *   post:
 *     summary: Reset a section to original default template
 *     tags: [SiteContent]
 */
router.post('/reset/:sectionKey', authenticateToken, resetToDefaults);

/**
 * @swagger
 * /api/site-content/{sectionKey}:
 *   post:
 *     summary: Save or update a site content section (Admin only)
 *     tags: [SiteContent]
 */
router.post('/:sectionKey', authenticateToken, saveSiteContentSection);

export default router;
