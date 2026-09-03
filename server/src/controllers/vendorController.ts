import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const registerVendor = async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;
    const {
      companyName,
      type, // HOTEL, HOMESTAY, CAB, GUIDE, ACTIVITY, RESTAURANT
      contactPerson,
      phone,
      email,
      kycDetails
    } = req.body;

    if (!companyName || !type || !phone) {
      return res.status(400).json({ error: 'companyName, type, and phone are required' });
    }

    // Update user role to vendor/supplier
    if (userId) {
      await prisma.user.update({
        where: { id: userId },
        data: { role: 'supplier' }
      });
    }

    // Check or create Supplier profile
    let supplier = await prisma.supplier.findFirst({
      where: { OR: [{ userId }, { email: email || '' }] }
    });

    if (!supplier) {
      supplier = await prisma.supplier.create({
        data: {
          companyName,
          type,
          contactPerson: contactPerson || companyName,
          email: email || `${phone}@vendor.kashmirconnect.in`,
          phone,
          userId: userId || null
        }
      });
    }

    // Also create initial listing placeholder or store KYC
    res.status(201).json({
      success: true,
      message: 'Vendor application registered successfully. Pending verification.',
      supplier
    });
  } catch (error: any) {
    console.error('registerVendor error:', error.message);
    res.status(500).json({ error: 'Failed to register vendor: ' + error.message });
  }
};

export const getMyListings = async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const listings = await prisma.vendorListing.findMany({
      where: { vendorId: userId },
      orderBy: { createdAt: 'desc' }
    });

    res.json(listings);
  } catch (error: any) {
    console.error('getMyListings error:', error.message);
    res.status(500).json({ error: 'Failed to fetch vendor listings' });
  }
};

export const getAllListings = async (req: Request, res: Response) => {
  try {
    const { category, location, minPrice, maxPrice, search } = req.query;

    const listings = await prisma.vendorListing.findMany({
      where: {
        isActive: true,
        verificationStatus: 'VERIFIED',
        ...(category ? { category: String(category).toUpperCase() } : {}),
        ...(location ? { location: { contains: String(location), mode: 'insensitive' } } : {}),
        ...(minPrice || maxPrice ? {
          basePrice: {
            ...(minPrice ? { gte: parseFloat(String(minPrice)) } : {}),
            ...(maxPrice ? { lte: parseFloat(String(maxPrice)) } : {})
          }
        } : {}),
        ...(search ? {
          OR: [
            { title: { contains: String(search), mode: 'insensitive' } },
            { description: { contains: String(search), mode: 'insensitive' } }
          ]
        } : {})
      },
      orderBy: { rating: 'desc' }
    });

    res.json(listings);
  } catch (error: any) {
    console.error('getAllListings error:', error.message);
    res.status(500).json({ error: 'Failed to fetch marketplace listings' });
  }
};

export const createListing = async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;
    const {
      title,
      category,
      location,
      description,
      basePrice,
      images = [],
      amenitiesOrFeatures = [],
      inventoryCount = 1,
      contactPhone,
      contactEmail,
      payoutUpiOrBank
    } = req.body;

    if (!title || !category || !location || basePrice === undefined) {
      return res.status(400).json({ error: 'title, category, location, and basePrice are required' });
    }

    const listing = await prisma.vendorListing.create({
      data: {
        vendorId: userId || 'vendor-direct',
        title,
        category: category.toUpperCase(),
        location,
        description: description || '',
        basePrice: parseFloat(basePrice),
        images: typeof images === 'string' ? images : JSON.stringify(images),
        amenitiesOrFeatures: typeof amenitiesOrFeatures === 'string' ? amenitiesOrFeatures : JSON.stringify(amenitiesOrFeatures),
        inventoryCount: parseInt(inventoryCount) || 1,
        verificationStatus: 'VERIFIED', // Default verified for demo/seed, can be PENDING in production
        contactPhone,
        contactEmail,
        payoutUpiOrBank: typeof payoutUpiOrBank === 'string' ? payoutUpiOrBank : JSON.stringify(payoutUpiOrBank || {})
      }
    });

    res.status(201).json(listing);
  } catch (error: any) {
    console.error('createListing error:', error.message);
    res.status(500).json({ error: 'Failed to create listing: ' + error.message });
  }
};

export const updateListing = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      basePrice,
      inventoryCount,
      blackoutDates,
      isActive,
      verificationStatus
    } = req.body;

    const listing = await prisma.vendorListing.update({
      where: { id: String(id) },
      data: {
        ...(title !== undefined ? { title: String(title) } : {}),
        ...(description !== undefined ? { description: String(description) } : {}),
        ...(basePrice !== undefined ? { basePrice: parseFloat(basePrice) } : {}),
        ...(inventoryCount !== undefined ? { inventoryCount: parseInt(inventoryCount) } : {}),
        ...(blackoutDates !== undefined ? {
          blackoutDates: typeof blackoutDates === 'string' ? blackoutDates : JSON.stringify(blackoutDates)
        } : {}),
        ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
        ...(verificationStatus !== undefined ? { verificationStatus: String(verificationStatus) } : {})
      }
    });

    res.json(listing);
  } catch (error: any) {
    console.error('updateListing error:', error.message);
    res.status(500).json({ error: 'Failed to update listing: ' + error.message });
  }
};

export const getVendorDashboardStats = async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;
    const listingsCount = await prisma.vendorListing.count({
      where: userId ? { vendorId: userId } : undefined
    });

    const settlements = await prisma.vendorSettlement.findMany({
      take: 10,
      orderBy: { payoutDate: 'desc' }
    });

    res.json({
      activeListings: listingsCount,
      totalPayoutsCompleted: settlements.filter(s => s.status === 'COMPLETED').reduce((sum, s) => sum + s.amount, 0),
      pendingSettlements: settlements.filter(s => s.status === 'PENDING').length,
      settlements
    });
  } catch (error: any) {
    console.error('getVendorDashboardStats error:', error.message);
    res.status(500).json({ error: 'Failed to fetch vendor dashboard stats' });
  }
};
