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

const parseHotel = (hotel: any) => ({
  ...hotel,
  amenities: safeParse(hotel.amenities),
  roomTypes: safeParse(hotel.roomTypes)
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
    console.error('Hotels fetch error:', error);
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
    const { name, location, starRating, pricePerNight, description, imageUrl, amenities, roomTypes, rating, reviewCount, isActive, contactName, contactEmail, contactPhone, paymentTerms, commissionStructure, seasonalPricing } = req.body;
    
    const data = {
      name: String(name),
      location: String(location),
      starRating: Number(starRating),
      pricePerNight: Number(pricePerNight),
      description: description || '',
      image: imageUrl || '',
      amenities: JSON.stringify(Array.isArray(amenities) ? amenities : []),
      roomTypes: JSON.stringify(Array.isArray(roomTypes) ? roomTypes : []),
      rating: Number(rating || 4.5),
      reviewCount: Number(reviewCount || 0),
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      contactName: contactName ? String(contactName) : null,
      contactEmail: contactEmail ? String(contactEmail) : null,
      contactPhone: contactPhone ? String(contactPhone) : null,
      paymentTerms: paymentTerms ? String(paymentTerms) : null,
      commissionStructure: commissionStructure ? String(commissionStructure) : null,
      seasonalPricing: seasonalPricing ? String(seasonalPricing) : null
    };

    const hotel = await prisma.hotel.create({ data });
    
    if (req.io) {
      req.io.to('admin-room').emit('new-system-event', {
        type: 'CREATE',
        message: `New hotel added: ${hotel.name}`,
        booking: { ...hotel, entityType: 'hotel' }
      });
    }
    
    res.status(201).json(hotel);
  } catch (error) {
    console.error('Hotel creation error:', error);
    res.status(500).json({ error: (error as any).message || 'Failed to create hotel' });
  }
};

export const updateHotel = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const updateData: any = {};
    
    if (req.body.name !== undefined) updateData.name = String(req.body.name);
    if (req.body.location !== undefined) updateData.location = String(req.body.location);
    if (req.body.starRating !== undefined) updateData.starRating = Number(req.body.starRating);
    if (req.body.pricePerNight !== undefined) updateData.pricePerNight = Number(req.body.pricePerNight);
    if (req.body.description !== undefined) updateData.description = req.body.description || '';
    if (req.body.imageUrl !== undefined) updateData.image = req.body.imageUrl || '';
    if (req.body.amenities !== undefined) {
      updateData.amenities = JSON.stringify(Array.isArray(req.body.amenities) ? req.body.amenities : []);
    }
    if (req.body.roomTypes !== undefined) {
      updateData.roomTypes = JSON.stringify(Array.isArray(req.body.roomTypes) ? req.body.roomTypes : []);
    }
    if (req.body.rating !== undefined) updateData.rating = Number(req.body.rating);
    if (req.body.reviewCount !== undefined) updateData.reviewCount = Number(req.body.reviewCount);
    if (req.body.isActive !== undefined) updateData.isActive = Boolean(req.body.isActive);
    if (req.body.contactName !== undefined) updateData.contactName = req.body.contactName ? String(req.body.contactName) : null;
    if (req.body.contactEmail !== undefined) updateData.contactEmail = req.body.contactEmail ? String(req.body.contactEmail) : null;
    if (req.body.contactPhone !== undefined) updateData.contactPhone = req.body.contactPhone ? String(req.body.contactPhone) : null;
    if (req.body.paymentTerms !== undefined) updateData.paymentTerms = req.body.paymentTerms ? String(req.body.paymentTerms) : null;
    if (req.body.commissionStructure !== undefined) updateData.commissionStructure = req.body.commissionStructure ? String(req.body.commissionStructure) : null;
    if (req.body.seasonalPricing !== undefined) updateData.seasonalPricing = req.body.seasonalPricing ? String(req.body.seasonalPricing) : null;
    
    const hotel = await prisma.hotel.update({
      where: { id },
      data: updateData
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
    console.error('Hotel update error:', error);
    res.status(500).json({ error: (error as any).message || 'Failed to update hotel' });
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
