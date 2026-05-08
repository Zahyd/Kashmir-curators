import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getFAQs = async (req: Request, res: Response) => {
  try {
    const faqs = await prisma.fAQ.findMany({
      where: { isActive: true }
    });
    res.json(faqs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch FAQs' });
  }
};
