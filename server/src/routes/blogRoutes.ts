import { Router } from 'express';
import { blogController } from '../controllers/blogController';

const router = Router();

router.get('/posts', blogController.getPosts);
router.get('/posts/:slug', blogController.getPostBySlug);
router.get('/campaigns', blogController.getCampaigns);

export default router;
