import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getFAQs = async (req: Request, res: Response) => {
  try {
    const { all } = req.query;
    const faqs = await prisma.fAQ.findMany({
      where: all === 'true' ? {} : { isActive: true },
      orderBy: { sortOrder: 'asc' }
    });
    res.json(faqs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch FAQs' });
  }
};

export const createFAQ = async (req: any, res: Response) => {
  try {
    const faq = await prisma.fAQ.create({ data: req.body });
    
    if (req.io) {
      req.io.to('admin-room').emit('new-system-event', {
        type: 'CREATE',
        message: `New FAQ added: ${faq.question.slice(0, 30)}...`,
        booking: { ...faq, entityType: 'faq' }
      });
    }
    
    res.status(201).json(faq);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create FAQ' });
  }
};

export const updateFAQ = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const faq = await prisma.fAQ.update({
      where: { id },
      data: req.body
    });
    
    if (req.io) {
      req.io.to('admin-room').emit('new-system-event', {
        type: 'UPDATE',
        message: `FAQ updated`,
        booking: { ...faq, entityType: 'faq' }
      });
    }
    
    res.json(faq);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update FAQ' });
  }
};

export const deleteFAQ = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.fAQ.delete({ where: { id } });
    
    if (req.io) {
      req.io.to('admin-room').emit('new-system-event', {
        type: 'DELETE',
        message: `FAQ deleted`,
        booking: { id, entityType: 'faq' }
      });
    }
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete FAQ' });
  }
};
