import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getCabs = async (req: Request, res: Response) => {
  try {
    const cabs = await prisma.cab.findMany({
      where: { isActive: true }
    });
    
    const parsedCabs = cabs.map(cab => ({
      ...cab,
      features: JSON.parse(cab.features)
    }));

    res.json(parsedCabs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch cabs' });
  }
};
