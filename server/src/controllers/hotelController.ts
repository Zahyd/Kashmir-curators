import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getHotels = async (req: Request, res: Response) => {
  try {
    const hotels = await prisma.hotel.findMany({
      where: { isActive: true }
    });
    
    const parsedHotels = hotels.map(hotel => ({
      ...hotel,
      amenities: JSON.parse(hotel.amenities),
      roomTypes: JSON.parse(hotel.roomTypes)
    }));

    res.json(parsedHotels);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch hotels' });
  }
};

export const getHotelById = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  try {
    const hotel = await prisma.hotel.findUnique({
      where: { id }
    });
    
    if (!hotel) {
      return res.status(404).json({ error: 'Hotel not found' });
    }

    const parsedHotel = {
      ...hotel,
      amenities: JSON.parse(hotel.amenities),
      roomTypes: JSON.parse(hotel.roomTypes)
    };

    res.json(parsedHotel);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch hotel' });
  }
};
