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
    const { question, answer, category, sortOrder, isActive } = req.body;
    
    const data = {
      question: String(question),
      answer: String(answer),
      category: String(category || 'General'),
      sortOrder: Number(sortOrder || 0),
      isActive: isActive !== undefined ? Boolean(isActive) : true
    };

    const faq = await prisma.fAQ.create({ data });
    
    if (req.io) {
      req.io.to('admin-room').emit('new-system-event', {
        type: 'CREATE',
        message: `New FAQ added: ${faq.question.slice(0, 30)}...`,
        booking: { ...faq, entityType: 'faq' }
      });
    }
    
    res.status(201).json(faq);
  } catch (error) {
    console.error('FAQ creation error:', error);
    res.status(500).json({ error: (error as any).message || 'Failed to create FAQ' });
  }
};

export const updateFAQ = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const updateData: any = {};
    
    if (req.body.question !== undefined) updateData.question = String(req.body.question);
    if (req.body.answer !== undefined) updateData.answer = String(req.body.answer);
    if (req.body.category !== undefined) updateData.category = String(req.body.category);
    if (req.body.sortOrder !== undefined) updateData.sortOrder = Number(req.body.sortOrder);
    if (req.body.isActive !== undefined) updateData.isActive = Boolean(req.body.isActive);
    
    const faq = await prisma.fAQ.update({
      where: { id },
      data: updateData
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
    console.error('FAQ update error:', error);
    res.status(500).json({ error: (error as any).message || 'Failed to update FAQ' });
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
