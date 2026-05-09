import { Request, Response } from 'express';
import prisma from '../lib/prisma';

const safeParse = (str: any) => {
  if (!str || typeof str !== 'string') return str || [];
  try {
    return JSON.parse(str);
  } catch (e) {
    return [];
  }
};

export const getCabs = async (req: Request, res: Response) => {
  try {
    const { all } = req.query;
    const cabs = await prisma.cab.findMany({
      where: all === 'true' ? {} : { isActive: true },
      orderBy: { id: 'desc' }
    });
    
    const parsedCabs = cabs.map(cab => ({
      ...cab,
      features: safeParse(cab.features)
    }));

    res.json(parsedCabs);
  } catch (error) {
    console.error('Cabs fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch cabs' });
  }
};

export const createCab = async (req: any, res: Response) => {
  try {
    const { name, type, capacity, pricePerKm, basePrice, image, features, isActive } = req.body;
    
    // Ensure data types match schema
    const data = {
      name: String(name),
      type: String(type),
      capacity: Number(capacity),
      pricePerKm: Number(pricePerKm),
      basePrice: Number(basePrice),
      image: image || '', // Ensure string, not null
      features: JSON.stringify(Array.isArray(features) ? features : []),
      isActive: isActive !== undefined ? Boolean(isActive) : true
    };
    
    const cab = await prisma.cab.create({ data });
    
    if (req.io) {
      req.io.to('admin-room').emit('new-system-event', {
        type: 'CREATE',
        message: `New vehicle node deployed: ${cab.name}`,
        booking: { ...cab, entityType: 'cab' }
      });
    }
    
    res.status(201).json(cab);
  } catch (error) {
    console.error('Cab creation error:', error);
    res.status(500).json({ error: (error as any).message || 'Fleet deployment failed' });
  }
};

export const updateCab = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const updateData: any = {};
    
    // Selectively map fields if they exist in request
    if (req.body.name !== undefined) updateData.name = String(req.body.name);
    if (req.body.type !== undefined) updateData.type = String(req.body.type);
    if (req.body.capacity !== undefined) updateData.capacity = Number(req.body.capacity);
    if (req.body.pricePerKm !== undefined) updateData.pricePerKm = Number(req.body.pricePerKm);
    if (req.body.basePrice !== undefined) updateData.basePrice = Number(req.body.basePrice);
    if (req.body.image !== undefined) updateData.image = req.body.image || '';
    if (req.body.features !== undefined) {
      updateData.features = JSON.stringify(Array.isArray(req.body.features) ? req.body.features : []);
    }
    if (req.body.isActive !== undefined) updateData.isActive = Boolean(req.body.isActive);
    
    const cab = await prisma.cab.update({
      where: { id },
      data: updateData
    });
    
    if (req.io) {
      req.io.to('admin-room').emit('new-system-event', {
        type: 'UPDATE',
        message: `Logistics node ${cab.name} reconfigured`,
        booking: { ...cab, entityType: 'cab' }
      });
    }
    
    res.json(cab);
  } catch (error) {
    console.error('Cab update error:', error);
    res.status(500).json({ error: (error as any).message || 'Node reconfiguration failed' });
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
