import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key';

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = (req.headers['authorization'] || '').trim();
  const portalKeyHeader = ((req.headers['x-portal-key'] as string) || '').trim();
  
  let bearerToken = '';
  if (authHeader) {
    if (authHeader.toLowerCase().startsWith('bearer ')) {
      bearerToken = authHeader.slice(7).trim();
    } else {
      bearerToken = authHeader;
    }
  }

  if (bearerToken === 'null' || bearerToken === 'undefined') {
    bearerToken = '';
  }

  const cleanPortalKey = (portalKeyHeader === 'null' || portalKeyHeader === 'undefined') ? '' : portalKeyHeader;

  // Collect viable credential candidates (portal key, bearer token)
  const candidates = [cleanPortalKey, bearerToken].filter(Boolean);

  if (candidates.length === 0) {
    return res.status(401).json({ error: 'Access denied. No authentication token or portal key provided.' });
  }

  // 1. Direct Portal Access Key check (e.g. KC-HOSP-ALPHA1)
  const portalCandidate = candidates.find(c => c.toUpperCase().startsWith('KC-'));
  if (portalCandidate) {
    try {
      const p = prisma as any;
      const keyRecord = await p.portalAccessKey.findUnique({
        where: { accessKey: portalCandidate.trim().toUpperCase() }
      });
      if (keyRecord && keyRecord.status === 'ACTIVE') {
        req.user = {
          id: keyRecord.id,
          accessKey: keyRecord.accessKey,
          name: keyRecord.assignedName,
          role: 'hospitality',
          portalType: keyRecord.portalType,
          propertyScope: keyRecord.propertyScope || 'ALL'
        };
        return next();
      }
    } catch (err) {
      console.error('[AuthMiddleware] Portal key direct check error:', err);
    }
  }

  // 2. Dev environment bypass tokens
  const devToken = candidates.find(c => c === 'dev_admin_token' || c === 'dev_token' || c.startsWith('dev_'));
  if (devToken) {
    req.user = { id: 'dev-admin-id', email: 'admin@thekashmircurators.com', role: 'admin', code: 'ADMIN001', name: 'SuperAdmin' };
    return next();
  }

  // 3. JWT Verification
  for (const candidate of candidates) {
    try {
      const decoded = jwt.verify(candidate, JWT_SECRET);
      req.user = decoded;
      return next();
    } catch {
      // Continue to next candidate
    }
  }

  return res.status(401).json({ error: 'Invalid or expired session token.' });
};
