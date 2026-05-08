import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getTestimonials = async (req: Request, res: Response) => {
  try {
    const testimonials = await prisma.testimonial.findMany({
      where: { isActive: true }
    });
    res.json(testimonials);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch testimonials' });
  }
};
