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
    const pkg = await prisma.package.create({ data: stringifyPkg(req.body) });
    
    if (req.io) {
      req.io.to('admin-room').emit('new-system-event', {
        type: 'CREATE',
        message: `New package: ${pkg.name}`,
        booking: { ...pkg, entityType: 'package' }
      });
    }
    
    res.status(201).json(pkg);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create package' });
  }
};

export const updatePackage = async (req: any, res: Response) => {
  try {
    const pkg = await prisma.package.update({
      where: { id: req.params.id },
      data: stringifyPkg(req.body)
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
    res.status(500).json({ error: 'Failed to update package' });
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
