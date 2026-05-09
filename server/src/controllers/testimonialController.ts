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
    const { name, location, content, image, rating, isActive, packageName } = req.body;
    
    const data = {
      name: String(name),
      location: String(location || 'Traveler'),
      content: String(content),
      avatar: image || '',
      rating: Number(rating || 5),
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      packageName: packageName || null
    };

    const testimonial = await prisma.testimonial.create({ data });
    
    if (req.io) {
      req.io.to('admin-room').emit('new-system-event', {
        type: 'CREATE',
        message: `New testimonial added by ${testimonial.name}`,
        booking: { entityType: 'testimonial', ...testimonial }
      });
    }
    
    res.status(201).json(testimonial);
  } catch (error) {
    console.error('Testimonial creation error:', error);
    res.status(500).json({ error: (error as any).message || 'Failed to create testimonial' });
  }
};

export const updateTestimonial = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const updateData: any = {};
    
    if (req.body.name !== undefined) updateData.name = String(req.body.name);
    if (req.body.location !== undefined) updateData.location = String(req.body.location);
    if (req.body.content !== undefined) updateData.content = String(req.body.content);
    if (req.body.image !== undefined) updateData.avatar = req.body.image || '';
    if (req.body.rating !== undefined) updateData.rating = Number(req.body.rating);
    if (req.body.isActive !== undefined) updateData.isActive = Boolean(req.body.isActive);
    if (req.body.packageName !== undefined) updateData.packageName = req.body.packageName;
    
    const testimonial = await prisma.testimonial.update({
      where: { id },
      data: updateData
    });
    
    if (req.io) {
      req.io.to('admin-room').emit('new-system-event', {
        type: 'UPDATE',
        message: `Testimonial by ${testimonial.name} updated`,
        booking: { entityType: 'testimonial', ...testimonial }
      });
    }
    
    res.json(testimonial);
  } catch (error) {
    console.error('Testimonial update error:', error);
    res.status(500).json({ error: (error as any).message || 'Failed to update testimonial' });
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
