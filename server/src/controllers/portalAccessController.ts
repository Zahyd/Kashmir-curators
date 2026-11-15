import { Request, Response } from 'express';
import crypto from 'crypto';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/authMiddleware';

// Format unique key by portal prefix
const generateKeyCode = (portalType: string): string => {
  const prefixMap: Record<string, string> = {
    HOSPITALITY: 'KC-HOSP',
    SALES: 'KC-SALE',
    DRIVER: 'KC-DRV',
    VENDOR: 'KC-VND',
    OPERATIONS: 'KC-OPS'
  };
  const prefix = prefixMap[portalType.toUpperCase()] || 'KC-PORTAL';
  const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase(); // 6 chars hex
  return `${prefix}-${randomSuffix}`;
};

// 1. Verify Access Key (Public endpoint for teammates logging into a portal)
export const verifyPortalAccess = async (req: Request, res: Response) => {
  try {
    const p = prisma as any;
    const { accessKey, portalType } = req.body;

    if (!accessKey) {
      return res.status(400).json({ error: 'Please enter your unique Portal Access Key' });
    }

    const trimmedKey = accessKey.trim().toUpperCase();

    const keyRecord = await p.portalAccessKey.findUnique({
      where: { accessKey: trimmedKey }
    });

    if (!keyRecord) {
      return res.status(404).json({ 
        error: 'Invalid Portal Access Key. Please check the code provided by Superadmin or request a new key.' 
      });
    }

    if (keyRecord.status === 'REVOKED') {
      return res.status(403).json({ 
        error: 'This Portal Access Key has been revoked by the Superadmin. Access denied.' 
      });
    }

    if (keyRecord.expiresAt && new Date() > new Date(keyRecord.expiresAt)) {
      await p.portalAccessKey.update({
        where: { id: keyRecord.id },
        data: { status: 'EXPIRED' }
      });
      return res.status(403).json({ 
        error: 'This Portal Access Key has expired. Please ask the Superadmin to extend validity.' 
      });
    }

    if (portalType && keyRecord.portalType.toUpperCase() !== portalType.toUpperCase()) {
      return res.status(403).json({ 
        error: `This key is authorized for ${keyRecord.portalType} portal only, not for ${portalType}.` 
      });
    }

    // Record login usage
    const updated = await p.portalAccessKey.update({
      where: { id: keyRecord.id },
      data: {
        lastUsedAt: new Date(),
        usageCount: { increment: 1 }
      }
    });

    res.json({
      success: true,
      message: `Access granted to ${keyRecord.portalType} portal.`,
      session: {
        id: updated.id,
        accessKey: updated.accessKey,
        assignedName: updated.assignedName,
        assignedContact: updated.assignedContact,
        designation: updated.designation,
        portalType: updated.portalType,
        propertyScope: updated.propertyScope || 'ALL',
        loginTime: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('[PortalAccessController] Verify error:', error);
    res.status(500).json({ error: 'Failed to verify portal access key' });
  }
};

// 2. List All Portal Access Keys (Superadmin)
export const listPortalKeys = async (req: AuthRequest, res: Response) => {
  try {
    const p = prisma as any;
    const { portalType, status, search } = req.query;

    const where: any = {};
    if (portalType && portalType !== 'ALL') {
      where.portalType = portalType as string;
    }
    if (status && status !== 'ALL') {
      where.status = status as string;
    }
    if (search) {
      where.OR = [
        { accessKey: { contains: search as string, mode: 'insensitive' } },
        { assignedName: { contains: search as string, mode: 'insensitive' } },
        { assignedContact: { contains: search as string, mode: 'insensitive' } },
        { designation: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const keys = await p.portalAccessKey.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    res.json(keys);
  } catch (error: any) {
    console.error('[PortalAccessController] List error:', error);
    res.status(500).json({ error: 'Failed to fetch portal access keys' });
  }
};

// 3. Generate New Portal Access Key(s) (Superadmin)
export const generatePortalKey = async (req: AuthRequest, res: Response) => {
  try {
    const p = prisma as any;
    const {
      portalType = 'HOSPITALITY',
      assignedName,
      assignedContact,
      designation,
      propertyScope = 'ALL',
      expiryDays,
      count = 1,
      notes
    } = req.body;

    if (!assignedName && Number(count) <= 1) {
      return res.status(400).json({ error: 'Teammate / Assignee name is required' });
    }

    const numCount = Math.min(Math.max(1, Number(count) || 1), 20); // between 1 and 20
    const expiryDate = expiryDays && Number(expiryDays) > 0
      ? new Date(Date.now() + Number(expiryDays) * 24 * 60 * 60 * 1000)
      : null;

    const createdKeys = [];

    for (let i = 0; i < numCount; i++) {
      let uniqueKey = generateKeyCode(portalType);
      
      // Ensure collision safety
      let exists = await p.portalAccessKey.findUnique({ where: { accessKey: uniqueKey } });
      while (exists) {
        uniqueKey = generateKeyCode(portalType);
        exists = await p.portalAccessKey.findUnique({ where: { accessKey: uniqueKey } });
      }

      const labelName = numCount > 1 
        ? `${assignedName || 'Desk Teammate'} #${i + 1}`
        : (assignedName || 'Reservation Desk Officer');

      const keyRecord = await p.portalAccessKey.create({
        data: {
          portalType: portalType.toUpperCase(),
          accessKey: uniqueKey,
          assignedName: labelName,
          assignedContact: assignedContact || null,
          designation: designation || (portalType === 'HOSPITALITY' ? 'Reservation Officer' : 'Portal Operator'),
          propertyScope: propertyScope || 'ALL',
          status: 'ACTIVE',
          expiresAt: expiryDate,
          createdByName: req.user?.name || req.user?.email || 'SuperAdmin',
          notes: notes || null
        }
      });

      createdKeys.push(keyRecord);
    }

    res.status(201).json({
      success: true,
      message: `Successfully generated ${createdKeys.length} access key(s) for ${portalType} portal.`,
      keys: createdKeys
    });
  } catch (error: any) {
    console.error('[PortalAccessController] Generate error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate portal access key' });
  }
};

// 4. Toggle Key Status (Active <-> Revoked)
export const toggleKeyStatus = async (req: AuthRequest, res: Response) => {
  try {
    const p = prisma as any;
    const { id } = req.params;

    const existing = await p.portalAccessKey.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Key not found' });

    const newStatus = existing.status === 'ACTIVE' ? 'REVOKED' : 'ACTIVE';

    const updated = await p.portalAccessKey.update({
      where: { id },
      data: { status: newStatus }
    });

    res.json({
      success: true,
      message: `Key ${updated.accessKey} is now ${newStatus}.`,
      key: updated
    });
  } catch (error: any) {
    console.error('[PortalAccessController] Toggle error:', error);
    res.status(500).json({ error: 'Failed to update key status' });
  }
};

// 5. Delete Portal Key
export const deletePortalKey = async (req: AuthRequest, res: Response) => {
  try {
    const p = prisma as any;
    const { id } = req.params;

    await p.portalAccessKey.delete({ where: { id } });

    res.json({ success: true, message: 'Portal access key deleted permanently' });
  } catch (error: any) {
    console.error('[PortalAccessController] Delete error:', error);
    res.status(500).json({ error: 'Failed to delete access key' });
  }
};
