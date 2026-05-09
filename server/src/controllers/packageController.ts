import { Request, Response } from 'express';
import prisma from '../lib/prisma';

const parsePkg = (pkg: any) => ({
  ...pkg,
  highlights: typeof pkg.highlights === 'string' ? JSON.parse(pkg.highlights) : pkg.highlights,
  inclusions: typeof pkg.inclusions === 'string' ? JSON.parse(pkg.inclusions) : pkg.inclusions,
  exclusions: typeof pkg.exclusions === 'string' ? JSON.parse(pkg.exclusions) : pkg.exclusions,
  itinerary: typeof pkg.itinerary === 'string' ? JSON.parse(pkg.itinerary) : pkg.itinerary
});

const stringifyPkg = (data: any) => {
  const result = { ...data };
  if (result.highlights && typeof result.highlights !== 'string') result.highlights = JSON.stringify(result.highlights);
  if (result.inclusions && typeof result.inclusions !== 'string') result.inclusions = JSON.stringify(result.inclusions);
  if (result.exclusions && typeof result.exclusions !== 'string') result.exclusions = JSON.stringify(result.exclusions);
  if (result.itinerary && typeof result.itinerary !== 'string') result.itinerary = JSON.stringify(result.itinerary);
  return result;
};

export const getPackages = async (req: Request, res: Response) => {
  try {
    const { all } = req.query;
    const packages = await prisma.package.findMany({
      where: all === 'true' ? {} : { isActive: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(packages.map(parsePkg));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch packages' });
  }
};

export const getPackageById = async (req: Request, res: Response) => {
  try {
    const pkg = await prisma.package.findUnique({ where: { id: req.params.id as string } });
    if (!pkg) return res.status(404).json({ error: 'Package not found' });
    res.json(parsePkg(pkg));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch package' });
  }
};

export const createPackage = async (req: any, res: Response) => {
  try {
    const { name, destination, duration, price, originalPrice, rating, reviewCount, imageUrl, highlights, inclusions, exclusions, itinerary, bestSeason, difficulty, isActive, isFeatured } = req.body;
    
    const data = {
      name: String(name),
      destination: String(destination || 'Kashmir'),
      duration: String(duration),
      price: Number(price),
      originalPrice: Number(originalPrice || price),
      rating: Number(rating || 4.8),
      reviewCount: Number(reviewCount || 0),
      image: imageUrl || '',
      highlights: JSON.stringify(Array.isArray(highlights) ? highlights : []),
      inclusions: JSON.stringify(Array.isArray(inclusions) ? inclusions : []),
      exclusions: JSON.stringify(Array.isArray(exclusions) ? exclusions : []),
      itinerary: JSON.stringify(Array.isArray(itinerary) ? itinerary : []),
      bestSeason: String(bestSeason || 'All Season'),
      difficulty: String(difficulty || 'Easy'),
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      isFeatured: isFeatured !== undefined ? Boolean(isFeatured) : false
    };

    const pkg = await prisma.package.create({ data });
    
    if (req.io) {
      req.io.to('admin-room').emit('new-system-event', {
        type: 'CREATE',
        message: `New package: ${pkg.name}`,
        booking: { ...pkg, entityType: 'package' }
      });
    }
    
    res.status(201).json(pkg);
  } catch (error) {
    console.error('Package creation error:', error);
    res.status(500).json({ error: (error as any).message || 'Failed to create package' });
  }
};

export const updatePackage = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const updateData: any = {};
    
    if (req.body.name !== undefined) updateData.name = String(req.body.name);
    if (req.body.destination !== undefined) updateData.destination = String(req.body.destination);
    if (req.body.duration !== undefined) updateData.duration = String(req.body.duration);
    if (req.body.price !== undefined) updateData.price = Number(req.body.price);
    if (req.body.originalPrice !== undefined) updateData.originalPrice = Number(req.body.originalPrice);
    if (req.body.rating !== undefined) updateData.rating = Number(req.body.rating);
    if (req.body.reviewCount !== undefined) updateData.reviewCount = Number(req.body.reviewCount);
    if (req.body.imageUrl !== undefined) updateData.image = req.body.imageUrl || '';
    if (req.body.highlights !== undefined) updateData.highlights = JSON.stringify(Array.isArray(req.body.highlights) ? req.body.highlights : []);
    if (req.body.inclusions !== undefined) updateData.inclusions = JSON.stringify(Array.isArray(req.body.inclusions) ? req.body.inclusions : []);
    if (req.body.exclusions !== undefined) updateData.exclusions = JSON.stringify(Array.isArray(req.body.exclusions) ? req.body.exclusions : []);
    if (req.body.itinerary !== undefined) updateData.itinerary = JSON.stringify(Array.isArray(req.body.itinerary) ? req.body.itinerary : []);
    if (req.body.bestSeason !== undefined) updateData.bestSeason = String(req.body.bestSeason);
    if (req.body.difficulty !== undefined) updateData.difficulty = String(req.body.difficulty);
    if (req.body.isActive !== undefined) updateData.isActive = Boolean(req.body.isActive);
    if (req.body.isFeatured !== undefined) updateData.isFeatured = Boolean(req.body.isFeatured);
    
    const pkg = await prisma.package.update({
      where: { id },
      data: updateData
    });
    
    if (req.io) {
      req.io.to('admin-room').emit('new-system-event', {
        type: 'UPDATE',
        message: `Package ${pkg.name} updated`,
        booking: { ...pkg, entityType: 'package' }
      });
    }
    
    res.json(pkg);
  } catch (error) {
    console.error('Package update error:', error);
    res.status(500).json({ error: (error as any).message || 'Failed to update package' });
  }
};

export const deletePackage = async (req: any, res: Response) => {
  try {
    await prisma.package.delete({ where: { id: req.params.id } });
    
    if (req.io) {
      req.io.to('admin-room').emit('new-system-event', {
        type: 'DELETE',
        message: `Package deleted`,
        booking: { id: req.params.id, entityType: 'package' }
      });
    }
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete package' });
  }
};
