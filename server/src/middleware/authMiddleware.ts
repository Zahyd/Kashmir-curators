import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { extractTenantId, DEFAULT_TENANT_ID } from '../lib/tenant';

const isProduction = process.env.NODE_ENV === 'production';

// SECURITY: Only cryptographically certified secrets from the environment are permitted
const JWT_SECRETS = [process.env.JWT_SECRET, process.env.BETTER_AUTH_SECRET].filter(Boolean) as string[];

const mapPortalRole = (portalType: string): string => {
  const map: Record<string, string> = {
    HOSPITALITY: 'hospitality',
    SALES: 'sales',
    DRIVER: 'driver',
    OPERATIONS: 'operations',
    VENDOR: 'supplier',
  };
  return map[String(portalType).toUpperCase()] || 'hospitality';
};

export interface AuthRequest extends Request {
  user?: any;
  tenantId?: string | null;
  organizationId?: string | null;
}

const syncTenantContext = (req: AuthRequest) => {
  const tenantId = extractTenantId(req);
  req.tenantId = tenantId;
  req.organizationId = tenantId || DEFAULT_TENANT_ID;
};

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction, isOptional = false) => {
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
    if (isOptional) return next();
    return res.status(401).json({ error: 'Access denied. No authentication token or portal key provided.' });
  }

  const p = prisma as any;

  // 1. Direct Portal Access Key check (e.g. KC-HOSP-ALPHA1)
  const portalCandidate = candidates.find(c => c.toUpperCase().startsWith('KC-'));
  if (portalCandidate) {
    try {
      const normalizedKey = portalCandidate.trim().toUpperCase();
      let keyRecord = await p.portalAccessKey.findUnique({
        where: { accessKey: normalizedKey }
      });

      // SECURITY: Auto-provisioning dev fallback key is strictly disabled in production
      if (!isProduction && !keyRecord && normalizedKey === 'KC-HOSP-ALPHA1') {
        keyRecord = await p.portalAccessKey.upsert({
          where: { accessKey: 'KC-HOSP-ALPHA1' },
          update: { status: 'ACTIVE' },
          create: {
            portalType: 'HOSPITALITY',
            accessKey: 'KC-HOSP-ALPHA1',
            assignedName: 'Reservation Desk Officer',
            assignedContact: 'operations@kashmircurators.com',
            designation: 'Senior Reservation Officer',
            propertyScope: 'ALL',
            status: 'ACTIVE'
          }
        });
      }

      if (keyRecord && keyRecord.status === 'ACTIVE') {
        req.user = {
          id: keyRecord.id,
          accessKey: keyRecord.accessKey,
          name: keyRecord.assignedName,
          role: mapPortalRole(keyRecord.portalType),
          portalType: keyRecord.portalType,
          propertyScope: keyRecord.propertyScope || 'ALL'
        };
        syncTenantContext(req);
        return next();
      }
    } catch (err) {
      console.error('[AuthMiddleware] Portal key direct check error:', err);
    }
  }

  // 2. Dev environment bypass tokens (strictly disabled in production)
  if (!isProduction) {
    const devToken = candidates.find(c => c === 'dev_admin_token' || c === 'dev_token' || c.startsWith('dev_'));
    if (devToken) {
      req.user = { id: 'dev-admin-id', email: 'admin@thekashmircurators.com', role: 'admin', code: 'ADMIN001', name: 'SuperAdmin' };
      syncTenantContext(req);
      return next();
    }
  }

  // 3. Better-Auth Database Session Token check
  for (const candidate of candidates) {
    try {
      const sessionRecord = await p.session.findUnique({
        where: { token: candidate },
        include: { user: true }
      });
      if (sessionRecord && sessionRecord.user && new Date(sessionRecord.expiresAt) > new Date()) {
        req.user = {
          id: sessionRecord.user.id,
          email: sessionRecord.user.email,
          name: sessionRecord.user.name,
          role: sessionRecord.user.role || 'hospitality',
          code: sessionRecord.user.employeeCode || 'ADMIN001',
          organizationId: sessionRecord.user.organizationId || undefined
        };
        syncTenantContext(req);
        return next();
      }
    } catch (sessionErr) {
      // Continue to next check
    }
  }

  // 4. JWT Verification across known secrets (restricted to HS256)
  for (const candidate of candidates) {
    for (const secret of JWT_SECRETS) {
      try {
        const decoded = jwt.verify(candidate, secret, { algorithms: ['HS256'] }) as any;
        if (decoded) {
          req.user = decoded;
          syncTenantContext(req);
          return next();
        }
      } catch {
        // Continue trying next secret/candidate
      }
    }
  }

  if (isOptional) {
    return next();
  }

  return res.status(401).json({ error: 'Invalid or expired session token. Please re-authenticate your hospitality desk session.' });
};

export const optionalAuthenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  return authenticateToken(req, res, next, true);
};
