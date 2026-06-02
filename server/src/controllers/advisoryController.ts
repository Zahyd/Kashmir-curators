import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getAdvisories = async (req: Request, res: Response) => {
  try {
    const advisories = await prisma.travelAdvisory.findMany({
      orderBy: { location: 'asc' }
    });
    res.json(advisories);
  } catch (error: any) {
    console.error('Advisories fetch error:', error.message);
    res.status(500).json({ error: 'Failed to fetch travel advisories' });
  }
};

export const updateAdvisory = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { status, message } = req.body;

    const advisory = await prisma.travelAdvisory.update({
      where: { id: String(id) },
      data: {
        status: String(status),
        message: String(message),
        lastUpdated: new Date()
      }
    });

    if (req.io) {
      req.io.emit('advisory-updated', advisory);
    }

    res.json(advisory);
  } catch (error: any) {
    console.error('Advisory update error:', error.message);
    res.status(500).json({ error: 'Failed to update travel advisory' });
  }
};
