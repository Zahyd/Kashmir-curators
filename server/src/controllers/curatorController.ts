import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getCurators = async (req: Request, res: Response) => {
  try {
    const curators = await prisma.curator.findMany({
      orderBy: { rating: 'desc' }
    });
    res.json(curators);
  } catch (error: any) {
    console.error('Curator fetch error:', error.message);
    res.status(500).json({ error: 'Failed to fetch curators' });
  }
};

export const getCuratorById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const curator = await prisma.curator.findUnique({
      where: { id }
    });
    if (!curator) return res.status(404).json({ error: 'Curator not found' });
    res.json(curator);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch curator detail' });
  }
};
