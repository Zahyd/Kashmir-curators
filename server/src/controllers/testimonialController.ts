import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getTestimonials = async (req: Request, res: Response) => {
  try {
    const { all } = req.query;
    const testimonials = await prisma.testimonial.findMany({
      where: all === 'true' ? {} : { isActive: true },
      orderBy: { id: 'desc' }
    });
    res.json(testimonials);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch testimonials' });
  }
};

export const createTestimonial = async (req: any, res: Response) => {
  try {
    const testimonial = await prisma.testimonial.create({
      data: req.body
    });
    
    if (req.io) {
      req.io.to('admin-room').emit('new-system-event', {
        type: 'CREATE',
        message: `New testimonial added by ${testimonial.name}`,
        booking: { type: 'testimonial', ...testimonial }
      });
    }
    
    res.status(201).json(testimonial);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create testimonial' });
  }
};

export const updateTestimonial = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const testimonial = await prisma.testimonial.update({
      where: { id },
      data: req.body
    });
    
    if (req.io) {
      req.io.to('admin-room').emit('new-system-event', {
        type: 'UPDATE',
        message: `Testimonial by ${testimonial.name} updated`,
        booking: { type: 'testimonial', ...testimonial }
      });
    }
    
    res.json(testimonial);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update testimonial' });
  }
};

export const deleteTestimonial = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.testimonial.delete({
      where: { id }
    });
    
    if (req.io) {
      req.io.to('admin-room').emit('new-system-event', {
        type: 'DELETE',
        message: `Testimonial ${id} deleted`
      });
    }
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete testimonial' });
  }
};
