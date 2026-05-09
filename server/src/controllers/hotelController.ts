import { Request, Response } from 'express';
import prisma from '../lib/prisma';

const parseHotel = (hotel: any) => ({
  ...hotel,
  amenities: typeof hotel.amenities === 'string' ? JSON.parse(hotel.amenities) : hotel.amenities,
  roomTypes: typeof hotel.roomTypes === 'string' ? JSON.parse(hotel.roomTypes) : hotel.roomTypes
});

const stringifyHotel = (data: any) => {
  const result = { ...data };
  if (result.amenities && typeof result.amenities !== 'string') result.amenities = JSON.stringify(result.amenities);
  if (result.roomTypes && typeof result.roomTypes !== 'string') result.roomTypes = JSON.stringify(result.roomTypes);
  return result;
};

export const getHotels = async (req: Request, res: Response) => {
  try {
    const { all } = req.query;
    const hotels = await prisma.hotel.findMany({
      where: all === 'true' ? {} : { isActive: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(hotels.map(parseHotel));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch hotels' });
  }
};

export const getHotelById = async (req: Request, res: Response) => {
  try {
    const hotel = await prisma.hotel.findUnique({ where: { id: req.params.id as string } });
    if (!hotel) return res.status(404).json({ error: 'Hotel not found' });
    res.json(parseHotel(hotel));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch hotel' });
  }
};

export const createHotel = async (req: any, res: Response) => {
  try {
    const hotel = await prisma.hotel.create({ data: stringifyHotel(req.body) });
    
    if (req.io) {
      req.io.to('admin-room').emit('new-system-event', {
        type: 'CREATE',
        message: `New hotel added: ${hotel.name}`,
        booking: { ...hotel, entityType: 'hotel' }
      });
    }
    
    res.status(201).json(hotel);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create hotel' });
  }
};

export const updateHotel = async (req: any, res: Response) => {
  try {
    const hotel = await prisma.hotel.update({
      where: { id: req.params.id },
      data: stringifyHotel(req.body)
    });
    
    if (req.io) {
      req.io.to('admin-room').emit('new-system-event', {
        type: 'UPDATE',
        message: `Hotel ${hotel.name} updated`,
        booking: { ...hotel, entityType: 'hotel' }
      });
    }
    
    res.json(hotel);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update hotel' });
  }
};

export const deleteHotel = async (req: any, res: Response) => {
  try {
    await prisma.hotel.delete({ where: { id: req.params.id } });
    
    if (req.io) {
      req.io.to('admin-room').emit('new-system-event', {
        type: 'DELETE',
        message: `Hotel deleted`,
        booking: { id: req.params.id, entityType: 'hotel' }
      });
    }
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete hotel' });
  }
};
