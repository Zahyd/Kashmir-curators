import { Router } from 'express';
import { uploadMedia, getMedia, deleteMedia, upload } from '../controllers/mediaController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// Apply auth middleware to all media routes
router.use(authenticateToken);

router.post('/upload', upload.single('file'), uploadMedia);
router.get('/', getMedia);
router.delete('/:id', deleteMedia);

export default router;
