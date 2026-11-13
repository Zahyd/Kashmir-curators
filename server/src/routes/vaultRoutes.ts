import { Router, Request, Response } from 'express';
import multer from 'multer';
import { vaultStorageService } from '../services/vaultStorageService';
import { authenticateToken } from '../middleware/authMiddleware';

const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const router = Router();

router.post('/upload', authenticateToken, upload.single('file'), async (req: any, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file attached' });
    }

    const category = req.body.category || 'AGENT_LICENSE';
    const result = await vaultStorageService.saveDocument(
      category,
      req.file.originalname,
      req.file.buffer,
      req.file.mimetype
    );

    res.json({
      success: true,
      message: 'Document stored in secure vault',
      document: result
    });
  } catch (error: any) {
    console.error('Vault upload error:', error);
    res.status(500).json({ error: 'Failed to upload document to vault' });
  }
});

router.get('/status', (req: Request, res: Response) => {
  const isNeonStorageActive = Boolean(
    process.env.NEON_STORAGE_ENDPOINT &&
    process.env.NEON_STORAGE_ACCESS_KEY
  );

  res.json({
    status: 'ONLINE',
    provider: isNeonStorageActive ? 'NEON_OBJECT_STORAGE' : 'LOCAL_SECURE_VAULT',
    bucket: process.env.NEON_STORAGE_BUCKET || 'kashmir-connect-vault',
    s3Compatible: true
  });
});

export default router;
