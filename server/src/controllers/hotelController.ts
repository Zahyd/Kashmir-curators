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
      image: imageUrl || req.body.image || '/images/hotels/hotel_1.png',
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
    if (req.body.imageUrl !== undefined || req.body.image !== undefined) updateData.image = req.body.imageUrl || req.body.image || '';
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

// --- Hospitality Operations Dashboard & KPIs ---
export const getHotelsDashboard = async (req: any, res: Response) => {
  try {
    const { hotelId } = req.query;
    
    // Target hotel or first available active hotel
    const targetHotel = hotelId 
      ? await prisma.hotel.findUnique({ where: { id: String(hotelId) } }) 
      : await prisma.hotel.findFirst({ where: { isActive: true } });

    const currentHotelId = targetHotel ? targetHotel.id : (hotelId ? String(hotelId) : undefined);
    const scopedFilter = currentHotelId ? { hotelId: currentHotelId } : {};

    const totalHotels = await prisma.hotel.count();
    const activeHotels = await prisma.hotel.count({ where: { isActive: true } });
    
    // Physical Room counts
    const totalRooms = await prisma.hotelRoom.count({ where: scopedFilter });
    const occupiedRooms = await prisma.hotelRoom.count({ 
      where: { ...scopedFilter, status: 'OCCUPIED' } 
    });
    const maintenanceRooms = await prisma.hotelRoom.count({ 
      where: { ...scopedFilter, status: 'MAINTENANCE' } 
    });
    const reservedRooms = await prisma.hotelRoom.count({
      where: { ...scopedFilter, operationalStatus: 'RESERVED' }
    });
    const availableRooms = Math.max(0, totalRooms - occupiedRooms - maintenanceRooms);
    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

    // Housekeeping status counts
    const cleanRooms = await prisma.hotelRoom.count({ where: { ...scopedFilter, housekeeping: 'CLEAN' } });
    const dirtyRooms = await prisma.hotelRoom.count({ where: { ...scopedFilter, housekeeping: 'DIRTY' } });
    const inspectedRooms = await prisma.hotelRoom.count({ where: { ...scopedFilter, housekeeping: 'INSPECTED' } });

    // Date bounds for arrivals and departures
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const todayCheckIns = await prisma.hotelReservation.count({
      where: {
        ...scopedFilter,
        checkIn: { gte: startOfToday, lt: endOfToday },
        status: { notIn: ['Cancelled', 'Rejected'] }
      }
    });

    const todayCheckOuts = await prisma.hotelReservation.count({
      where: {
        ...scopedFilter,
        checkOut: { gte: startOfToday, lt: endOfToday },
        status: { notIn: ['Cancelled', 'Rejected'] }
      }
    });

    const pendingConfirmations = await prisma.hotelReservation.count({
      where: { ...scopedFilter, status: 'Pending' }
    });

    // In-house active reservations today
    const inHouseReservations = await prisma.hotelReservation.findMany({
      where: {
        ...scopedFilter,
        status: { in: ['Confirmed', 'Checked-In', 'Hold'] },
        checkIn: { lte: now },
        checkOut: { gte: now }
      }
    });

    // Daily room revenue
    const revenueToday = inHouseReservations.reduce((acc, r) => {
      const nights = Math.max(1, Math.ceil((new Date(r.checkOut).getTime() - new Date(r.checkIn).getTime()) / (1000 * 60 * 60 * 24)));
      return acc + (r.totalAmount / nights);
    }, 0);

    // Monthly volume
    const monthlyReservations = await prisma.hotelReservation.findMany({
      where: {
        ...scopedFilter,
        status: { in: ['Confirmed', 'Checked-In', 'Checked-Out'] },
        checkIn: { gte: startOfMonth }
      }
    });

    const monthlyRevenue = monthlyReservations.reduce((sum, r) => sum + r.totalAmount, 0);
    const monthlyNetPayable = monthlyReservations.reduce((sum, r) => sum + r.hotelDues, 0);
    const commissionDue = monthlyReservations.reduce((sum, r) => sum + (r.totalAmount - r.hotelDues), 0);

    // Outstanding settlements
    const totalHotelDuesPayable = await prisma.hotelReservation.aggregate({
      where: {
        ...scopedFilter,
        status: { in: ['Confirmed', 'Checked-In', 'Checked-Out'] }
      },
      _sum: { hotelDues: true }
    });

    const totalSettledPayouts = await prisma.vendorSettlement.aggregate({
      where: {
        ...scopedFilter,
        status: 'COMPLETED'
      },
      _sum: { netPaid: true }
    });

    const outstandingSettlement = Math.max(
      0, 
      (totalHotelDuesPayable._sum.hotelDues || 0) - (totalSettledPayouts._sum.netPaid || 0)
    );

    // Winter operations log
    const latestWinterLog = currentHotelId ? await prisma.winterOpsLog.findFirst({
      where: { hotelId: currentHotelId },
      orderBy: { createdAt: 'desc' }
    }) : null;

    const maintenanceRequests = await prisma.maintenanceRequest.count({
      where: { ...scopedFilter, status: { in: ['PENDING', 'IN_PROGRESS'] } }
    });

    const alertsCount = dirtyRooms + maintenanceRequests;

    res.json({
      hotel: targetHotel ? { 
        id: targetHotel.id, 
        name: targetHotel.name, 
        location: targetHotel.location,
        starRating: targetHotel.starRating 
      } : null,
      totalHotels,
      activeHotels,
      totalRooms,
      availableRooms,
      occupiedRooms,
      reservedRooms,
      maintenanceRooms,
      occupancyRate,
      todayCheckIns,
      todayCheckOuts,
      pendingConfirmations,
      revenueToday: Math.round(revenueToday),
      monthlyRevenue: Math.round(monthlyRevenue),
      monthlyNetPayable: Math.round(monthlyNetPayable),
      commissionDue: Math.round(commissionDue),
      outstandingSettlement: Math.round(outstandingSettlement),
      housekeeping: {
        clean: cleanRooms,
        dirty: dirtyRooms,
        inspected: inspectedRooms
      },
      winterOps: latestWinterLog || null,
      maintenanceRequests,
      alertsCount
    });
  } catch (error: any) {
    console.error('Failed to get hospitality dashboard KPIs:', error);
    res.status(500).json({ error: error.message || 'Failed to aggregate dashboard KPIs' });
  }
};

// --- Room Category Management ---
export const getRoomCategories = async (req: Request, res: Response) => {
  const { hotelId } = req.query;
  try {
    const categories = await prisma.roomCategory.findMany({
      where: hotelId ? { hotelId: String(hotelId) } : {},
      orderBy: { createdAt: 'desc' }
    });
    res.json(categories);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createRoomCategory = async (req: any, res: Response) => {
  const { hotelId, name, basePrice, capacity, maxOccupancy, amenities, imageUrl } = req.body;
  try {
    const category = await prisma.roomCategory.create({
      data: {
        hotelId,
        name,
        basePrice: Number(basePrice),
        capacity: Number(capacity || 2),
        maxOccupancy: Number(maxOccupancy || 3),
        amenities: JSON.stringify(Array.isArray(amenities) ? amenities : []),
        imageUrl
      }
    });

    if (req.io) {
      req.io.to('admin-room').emit('new-system-event', {
        type: 'CREATE',
        message: `New room category added: ${name}`
      });
    }

    res.status(201).json(category);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateRoomCategory = async (req: any, res: Response) => {
  const { id } = req.params;
  const { name, basePrice, capacity, maxOccupancy, amenities, imageUrl } = req.body;
  try {
    const category = await prisma.roomCategory.update({
      where: { id },
      data: {
        name,
        basePrice: basePrice !== undefined ? Number(basePrice) : undefined,
        capacity: capacity !== undefined ? Number(capacity) : undefined,
        maxOccupancy: maxOccupancy !== undefined ? Number(maxOccupancy) : undefined,
        amenities: amenities !== undefined ? JSON.stringify(Array.isArray(amenities) ? amenities : []) : undefined,
        imageUrl
      }
    });

    if (req.io) {
      req.io.to('admin-room').emit('new-system-event', {
        type: 'UPDATE',
        message: `Room category updated: ${name}`
      });
    }

    res.json(category);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteRoomCategory = async (req: any, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.roomCategory.delete({ where: { id } });
    if (req.io) {
      req.io.to('admin-room').emit('new-system-event', {
        type: 'DELETE',
        message: 'Room category removed'
      });
    }
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// --- Seasonal Tariffs & Dynamic Rates ---
export const getSeasonalRates = async (req: Request, res: Response) => {
  const { hotelId, categoryId } = req.query;
  try {
    const where: any = {};
    if (categoryId) {
      where.categoryId = String(categoryId);
    } else if (hotelId) {
      where.category = { hotelId: String(hotelId) };
    }
    const rates = await prisma.seasonalRate.findMany({
      where,
      include: { category: true },
      orderBy: { startDate: 'asc' }
    });
    res.json(rates);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateSeasonalRate = async (req: any, res: Response) => {
  const { id } = req.params;
  const { multiplier, flatRate, seasonName, startDate, endDate } = req.body;
  try {
    const rate = await prisma.seasonalRate.update({
      where: { id },
      data: {
        multiplier: multiplier !== undefined ? Number(multiplier) : undefined,
        flatRate: flatRate !== undefined ? Number(flatRate) : undefined,
        seasonName: seasonName || undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined
      },
      include: { category: true }
    });

    if (req.io) {
      req.io.to('admin-room').emit('new-system-event', {
        type: 'UPDATE',
        message: `Seasonal tariff updated: ${rate.seasonName} (${rate.multiplier}x)`
      });
    }

    res.json(rate);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// --- Hotel Room Management ---
export const getHotelRooms = async (req: Request, res: Response) => {
  const { hotelId } = req.query;
  try {
    const rooms = await prisma.hotelRoom.findMany({
      where: hotelId ? { hotelId: String(hotelId) } : {},
      include: { category: true },
      orderBy: { roomNumber: 'asc' }
    });
    res.json(rooms);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createHotelRoom = async (req: any, res: Response) => {
  const { 
    hotelId, 
    categoryId, 
    roomNumber, 
    floor, 
    status, 
    operationalStatus,
    housekeeping,
    bukhariActive,
    electricWarmerActive,
    assignedHousekeeper,
    housekeepingPriority
  } = req.body;
  try {
    const room = await prisma.hotelRoom.create({
      data: {
        hotelId,
        categoryId,
        roomNumber,
        floor,
        status: status || 'AVAILABLE',
        operationalStatus: operationalStatus || 'AVAILABLE_CLEAN',
        housekeeping: housekeeping || 'CLEAN',
        bukhariActive: Boolean(bukhariActive),
        electricWarmerActive: Boolean(electricWarmerActive),
        assignedHousekeeper,
        housekeepingPriority: housekeepingPriority || 'NORMAL'
      }
    });

    if (req.io) {
      req.io.to('admin-room').emit('new-system-event', {
        type: 'CREATE',
        message: `Physical room ${roomNumber} registered`
      });
    }

    res.status(201).json(room);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateHotelRoom = async (req: any, res: Response) => {
  const { id } = req.params;
  const { 
    status, 
    operationalStatus,
    housekeeping, 
    roomNumber, 
    floor,
    bukhariActive,
    electricWarmerActive,
    assignedHousekeeper,
    housekeepingPriority,
    maintenanceNotes
  } = req.body;

  try {
    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (operationalStatus !== undefined) updateData.operationalStatus = operationalStatus;
    if (housekeeping !== undefined) updateData.housekeeping = housekeeping;
    if (roomNumber !== undefined) updateData.roomNumber = roomNumber;
    if (floor !== undefined) updateData.floor = floor;
    if (bukhariActive !== undefined) updateData.bukhariActive = Boolean(bukhariActive);
    if (electricWarmerActive !== undefined) updateData.electricWarmerActive = Boolean(electricWarmerActive);
    if (assignedHousekeeper !== undefined) updateData.assignedHousekeeper = assignedHousekeeper;
    if (housekeepingPriority !== undefined) updateData.housekeepingPriority = housekeepingPriority;
    if (maintenanceNotes !== undefined) updateData.maintenanceNotes = maintenanceNotes;

    const room = await prisma.hotelRoom.update({
      where: { id },
      data: updateData,
      include: { category: true }
    });

    if (req.io) {
      req.io.to('admin-room').emit('new-system-event', {
        type: 'UPDATE',
        message: `Room ${room.roomNumber} updated`
      });
    }

    res.json(room);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteHotelRoom = async (req: any, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.hotelRoom.delete({ where: { id } });
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// --- Housekeeping & Maintenance Request ---
export const getMaintenanceRequests = async (req: Request, res: Response) => {
  const { hotelId } = req.query;
  try {
    const logs = await prisma.maintenanceRequest.findMany({
      where: hotelId ? { hotelId: String(hotelId) } : {},
      orderBy: { createdAt: 'desc' }
    });
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createMaintenanceRequest = async (req: any, res: Response) => {
  const { hotelId, roomNumber, task, priority, status, cost } = req.body;
  try {
    const request = await prisma.maintenanceRequest.create({
      data: {
        hotelId,
        roomNumber,
        task,
        priority: priority || 'MEDIUM',
        status: status || 'PENDING',
        cost: Number(cost || 0),
        loggedBy: req.user?.name || 'Operator'
      }
    });

    if (status === 'IN_PROGRESS' || status === 'PENDING') {
      const room = await prisma.hotelRoom.findFirst({
        where: { hotelId, roomNumber }
      });
      if (room) {
        await prisma.hotelRoom.update({
          where: { id: room.id },
          data: { status: 'MAINTENANCE' }
        });
      }
    }

    if (req.io) {
      req.io.to('admin-room').emit('new-system-event', {
        type: 'CREATE',
        message: `Maintenance request logged for room ${roomNumber}`
      });
    }

    res.status(201).json(request);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateMaintenanceRequest = async (req: any, res: Response) => {
  const { id } = req.params;
  const { status, cost } = req.body;
  try {
    const request = await prisma.maintenanceRequest.update({
      where: { id },
      data: { status, cost: cost !== undefined ? Number(cost) : undefined }
    });

    if (status === 'RESOLVED') {
      const room = await prisma.hotelRoom.findFirst({
        where: { hotelId: request.hotelId, roomNumber: request.roomNumber }
      });
      if (room) {
        await prisma.hotelRoom.update({
          where: { id: room.id },
          data: { status: 'AVAILABLE' }
        });
      }
    }

    if (req.io) {
      req.io.to('admin-room').emit('new-system-event', {
        type: 'UPDATE',
        message: `Maintenance request for room ${request.roomNumber} marked as ${status}`
      });
    }

    res.json(request);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// --- Vendor Settlements ---
export const getVendorSettlements = async (req: Request, res: Response) => {
  const { hotelId } = req.query;
  try {
    const settlements = await prisma.vendorSettlement.findMany({
      where: hotelId ? { hotelId: String(hotelId) } : {},
      orderBy: { payoutDate: 'desc' }
    });
    res.json(settlements);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createVendorSettlement = async (req: any, res: Response) => {
  const { hotelId, amount, commissionDues, netPaid, transactionRef, status } = req.body;
  try {
    const settlement = await prisma.vendorSettlement.create({
      data: {
        hotelId,
        amount: Number(amount),
        commissionDues: Number(commissionDues),
        netPaid: Number(netPaid),
        transactionRef,
        status: status || 'COMPLETED'
      }
    });

    res.status(201).json(settlement);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// --- Hotel Reviews ---
export const getHotelReviews = async (req: Request, res: Response) => {
  const { hotelId } = req.query;
  try {
    const reviews = await prisma.hotelReview.findMany({
      where: hotelId ? { hotelId: String(hotelId) } : {},
      orderBy: { createdAt: 'desc' }
    });
    res.json(reviews);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createHotelReview = async (req: any, res: Response) => {
  const { hotelId, guestName, rating, comment } = req.body;
  try {
    const review = await prisma.hotelReview.create({
      data: {
        hotelId,
        guestName,
        rating: Number(rating),
        comment,
        sentiment: Number(rating) >= 4 ? 'POSITIVE' : (Number(rating) <= 2 ? 'NEGATIVE' : 'NEUTRAL')
      }
    });

    const reviews = await prisma.hotelReview.findMany({ where: { hotelId } });
    const count = reviews.length;
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / count;

    await prisma.hotel.update({
      where: { id: hotelId },
      data: {
        rating: parseFloat(avgRating.toFixed(1)),
        reviewCount: count
      }
    });

    res.status(201).json(review);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// --- Housekeeping CMS ---
export const getHousekeepingTasks = async (req: Request, res: Response) => {
  const { hotelId, status, priority } = req.query;
  try {
    const where: any = {};
    if (hotelId) where.hotelId = String(hotelId);
    if (status) where.status = String(status);
    if (priority) where.priority = String(priority);

    const tasks = await prisma.housekeepingTask.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
    res.json(tasks);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createHousekeepingTask = async (req: any, res: Response) => {
  const { hotelId, roomNumber, taskType, priority, assignedTo, notes } = req.body;
  try {
    const task = await prisma.housekeepingTask.create({
      data: {
        hotelId,
        roomNumber,
        taskType: taskType || 'TURNOVER',
        priority: priority || 'NORMAL',
        status: 'DIRTY',
        assignedTo,
        notes
      }
    });

    const room = await prisma.hotelRoom.findFirst({
      where: { hotelId, roomNumber }
    });
    if (room) {
      await prisma.hotelRoom.update({
        where: { id: room.id },
        data: {
          housekeeping: 'DIRTY',
          operationalStatus: room.status === 'OCCUPIED' ? 'OCCUPIED' : 'AVAILABLE_DIRTY',
          assignedHousekeeper: assignedTo,
          housekeepingPriority: priority || 'NORMAL'
        }
      });
    }

    if (req.io) {
      req.io.to('admin-room').emit('new-system-event', {
        type: 'HOUSEKEEPING_TASK_CREATED',
        message: `Housekeeping task logged for room ${roomNumber}`
      });
    }

    res.status(201).json(task);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateHousekeepingTask = async (req: any, res: Response) => {
  const { id } = req.params;
  const { status, assignedTo, notes, linenChanged, inspectedBy } = req.body;
  try {
    const updateData: any = {};
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'CLEAN' || status === 'INSPECTED') {
        updateData.completedAt = new Date();
      }
    }
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
    if (notes !== undefined) updateData.notes = notes;
    if (linenChanged !== undefined) updateData.linenChanged = Boolean(linenChanged);
    if (inspectedBy !== undefined) updateData.inspectedBy = inspectedBy;

    const task = await prisma.housekeepingTask.update({
      where: { id },
      data: updateData
    });

    // Synchronize room housekeeping status
    const room = await prisma.hotelRoom.findFirst({
      where: { hotelId: task.hotelId, roomNumber: task.roomNumber }
    });

    if (room) {
      let roomHk = 'DIRTY';
      let operationalStatus = room.operationalStatus;

      if (task.status === 'CLEAN') {
        roomHk = 'CLEAN';
        if (room.status === 'AVAILABLE') operationalStatus = 'AVAILABLE_CLEAN';
      } else if (task.status === 'INSPECTED') {
        roomHk = 'INSPECTED';
        if (room.status === 'AVAILABLE') operationalStatus = 'AVAILABLE_CLEAN';
      } else if (task.status === 'IN_PROGRESS') {
        roomHk = 'DIRTY';
      }

      await prisma.hotelRoom.update({
        where: { id: room.id },
        data: {
          housekeeping: roomHk,
          operationalStatus,
          assignedHousekeeper: task.assignedTo
        }
      });
    }

    if (req.io) {
      req.io.to('admin-room').emit('new-system-event', {
        type: 'HOUSEKEEPING_TASK_UPDATED',
        message: `Room ${task.roomNumber} housekeeping is now ${task.status}`
      });
    }

    res.json(task);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteHousekeepingTask = async (req: any, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.housekeepingTask.delete({ where: { id } });
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// --- Winter Operations & Heating Readiness ---
export const getWinterOpsStatus = async (req: Request, res: Response) => {
  const { hotelId } = req.query;
  try {
    const log = await prisma.winterOpsLog.findFirst({
      where: hotelId ? { hotelId: String(hotelId) } : {},
      orderBy: { createdAt: 'desc' }
    });

    if (!log) {
      return res.json(null);
    }
    res.json(log);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateWinterOpsStatus = async (req: any, res: Response) => {
  const {
    hotelId,
    bukhariStatus,
    firewoodStockDays,
    generatorStatus,
    generatorFuelPct,
    generatorRuntimeHrs,
    gridPowerStatus,
    boilerHotWater,
    snowRoadClearance,
    shikaraGhatStatus,
    notes
  } = req.body;

  try {
    const log = await prisma.winterOpsLog.create({
      data: {
        hotelId,
        bukhariStatus: bukhariStatus || 'OPERATIONAL',
        firewoodStockDays: Number(firewoodStockDays || 7),
        generatorStatus: generatorStatus || 'STANDBY',
        generatorFuelPct: Number(generatorFuelPct || 85),
        generatorRuntimeHrs: Number(generatorRuntimeHrs || 0),
        gridPowerStatus: gridPowerStatus || 'LIVE',
        boilerHotWater: boilerHotWater || 'ACTIVE',
        snowRoadClearance: snowRoadClearance || 'CLEAR',
        shikaraGhatStatus: shikaraGhatStatus || 'OPEN',
        notes,
        updatedBy: req.user?.name || 'Hotel Duty Manager'
      }
    });

    if (req.io) {
      req.io.to('admin-room').emit('new-system-event', {
        type: 'WINTER_OPS_UPDATED',
        message: `Winter operations status updated`
      });
    }

    res.status(201).json(log);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// --- Settlement Ledger & Financial Breakdown ---
export const getSettlementLedger = async (req: Request, res: Response) => {
  const { hotelId } = req.query;
  try {
    const scopedFilter = hotelId ? { hotelId: String(hotelId) } : {};

    const reservations = await prisma.hotelReservation.findMany({
      where: {
        ...scopedFilter,
        status: { in: ['Confirmed', 'Checked-In', 'Checked-Out'] }
      },
      orderBy: { checkOut: 'desc' }
    });

    const settlements = await prisma.vendorSettlement.findMany({
      where: scopedFilter,
      orderBy: { payoutDate: 'desc' }
    });

    const totalGrossRevenue = reservations.reduce((s, r) => s + r.totalAmount, 0);
    const totalCommissions = reservations.reduce((s, r) => s + (r.totalAmount - r.hotelDues), 0);
    const totalHotelDues = reservations.reduce((s, r) => s + r.hotelDues, 0);
    const totalSettled = settlements.filter(s => s.status === 'COMPLETED').reduce((s, p) => s + p.netPaid, 0);
    const outstandingDues = Math.max(0, totalHotelDues - totalSettled);

    res.json({
      summary: {
        totalGrossRevenue,
        totalCommissions,
        totalHotelDues,
        totalSettled,
        outstandingDues,
        nextSettlementDate: 'Every Friday (Weekly NEFT)'
      },
      reservations: reservations.map(r => ({
        id: r.id,
        bookingRef: r.bookingReference || `KCH-${r.id.slice(0, 6).toUpperCase()}`,
        guestName: r.guestName,
        checkIn: r.checkIn,
        checkOut: r.checkOut,
        roomType: r.roomType,
        grossAmount: r.totalAmount,
        commissionRate: r.commissionRate,
        netPayable: r.hotelDues,
        status: r.status,
        paymentStatus: r.paymentStatus
      })),
      settlements
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
