import { Request, Response } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import prisma from '../lib/prisma';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer with Cloudinary Storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'kashmir-connect',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
  } as any,
});

export const upload = multer({ storage: storage });

export const uploadMedia = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.file as any;
    
    // Save to database
    const media = await prisma.media.create({
      data: {
        filename: file.filename,
        originalName: file.originalname,
        url: file.path,
        size: file.size,
        mimeType: file.mimetype,
        publicId: file.filename, // Multer-storage-cloudinary uses filename as public_id by default
      },
    });

    console.log('[MediaController] Uploaded and saved:', media.id);
    res.status(201).json(media);
  } catch (error) {
    console.error('[MediaController] Upload error:', error);
    res.status(500).json({ error: 'Failed to upload media' });
  }
};

export const getMedia = async (req: Request, res: Response) => {
  try {
    const media = await prisma.media.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json(media);
  } catch (error) {
    console.error('[MediaController] Fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch media' });
  }
};

export const deleteMedia = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const media = await prisma.media.findUnique({ where: { id } });
    if (!media) {
      return res.status(404).json({ error: 'Media not found' });
    }

    // Delete from Cloudinary
    if (media.publicId) {
      await cloudinary.uploader.destroy(media.publicId);
    }

    // Delete from database
    await prisma.media.delete({ where: { id } });

    res.status(204).send();
  } catch (error) {
    console.error('[MediaController] Delete error:', error);
    res.status(500).json({ error: 'Failed to delete media' });
  }
};
