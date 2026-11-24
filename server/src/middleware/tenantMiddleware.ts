import { Request, Response, NextFunction } from 'express';
import { extractTenantId, DEFAULT_TENANT_ID } from '../lib/tenant';

export interface TenantRequest extends Request {
  tenantId?: string | null;
  organizationId?: string | null;
  user?: any;
}

/**
 * Tenant resolution middleware: identifies tenant scope from headers/session
 * and attaches tenantId to request without interrupting requests with missing headers.
 */
export const tenantMiddleware = (req: TenantRequest, res: Response, next: NextFunction) => {
  const tenantId = extractTenantId(req);
  req.tenantId = tenantId;
  req.organizationId = tenantId || DEFAULT_TENANT_ID;
  next();
};
