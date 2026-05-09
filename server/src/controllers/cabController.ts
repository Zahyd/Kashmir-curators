import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getCabs = async (req: Request, res: Response) => {
  try {
    const { all } = req.query;
    const cabs = await prisma.cab.findMany({
      where: all === 'true' ? {} : { isActive: true },
      orderBy: { id: 'desc' }
    });
    
    const parsedCabs = cabs.map(cab => ({
      ...cab,
      features: typeof cab.features === 'string' ? JSON.parse(cab.features) : cab.features
    }));

    res.json(parsedCabs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch cabs' });
  }
};

export const createCab = async (req: any, res: Response) => {
  try {
    const data = { ...req.body };
    if (data.features) data.features = JSON.stringify(data.features);
    
    const cab = await prisma.cab.create({ data });
    
    if (req.io) {
      req.io.to('admin-room').emit('new-system-event', {
        type: 'CREATE',
        message: `New cab added: ${cab.name}`,
        booking: { ...cab, entityType: 'cab' }
      });
    }
    
    res.status(201).json(cab);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create cab' });
  }
};

export const updateCab = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const data = { ...req.body };
    if (data.features && typeof data.features !== 'string') {
      data.features = JSON.stringify(data.features);
    }
    
    const cab = await prisma.cab.update({
      where: { id },
      data
    });
    
    if (req.io) {
      req.io.to('admin-room').emit('new-system-event', {
        type: 'UPDATE',
        message: `Cab ${cab.name} updated`,
        booking: { ...cab, entityType: 'cab' }
      });
    }
    
    res.json(cab);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update cab' });
  }
};

export const deleteCab = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.cab.delete({
      where: { id }
    });
    
    if (req.io) {
      req.io.to('admin-room').emit('new-system-event', {
        type: 'DELETE',
        message: `Cab ${id} deleted`
      });
    }
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete cab' });
  }
};
