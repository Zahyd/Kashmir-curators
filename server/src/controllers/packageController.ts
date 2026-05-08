import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getPackages = async (req: Request, res: Response) => {
  try {
    const packages = await prisma.package.findMany({
      where: { isActive: true }
    });
    
    // Parse JSON strings back to objects
    const parsedPackages = packages.map(pkg => ({
      ...pkg,
      highlights: JSON.parse(pkg.highlights),
      inclusions: JSON.parse(pkg.inclusions),
      exclusions: JSON.parse(pkg.exclusions),
      itinerary: JSON.parse(pkg.itinerary)
    }));

    res.json(parsedPackages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch packages' });
  }
};

export const getPackageById = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  try {
    const pkg = await prisma.package.findUnique({
      where: { id }
    });
    
    if (!pkg) {
      return res.status(404).json({ error: 'Package not found' });
    }

    const parsedPackage = {
      ...pkg,
      highlights: JSON.parse(pkg.highlights),
      inclusions: JSON.parse(pkg.inclusions),
      exclusions: JSON.parse(pkg.exclusions),
      itinerary: JSON.parse(pkg.itinerary)
    };

    res.json(parsedPackage);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch package' });
  }
};
