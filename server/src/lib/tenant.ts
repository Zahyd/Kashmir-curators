import { Request } from 'express';
import prisma from './prisma';

export type TenantType = 'AGENCY' | 'HOTEL_OPERATOR' | 'FLEET_PROVIDER' | 'DMC_PLATFORM';

export interface TenantContext {
  id: string;
  name: string;
  slug: string;
  type: TenantType;
  status: string;
  tier: string;
}

export const DEFAULT_TENANT_ID = 'kc-primary-dmc';
export const DEFAULT_TENANT_SLUG = 'kashmir-curators';
export const DEFAULT_TENANT_NAME = 'Kashmir Curators Core Operating System';

export const DEFAULT_TENANT: TenantContext = {
  id: DEFAULT_TENANT_ID,
  name: DEFAULT_TENANT_NAME,
  slug: DEFAULT_TENANT_SLUG,
  type: 'DMC_PLATFORM',
  status: 'ACTIVE',
  tier: 'ENTERPRISE'
};

/**
 * Ensures the primary default organization exists in the database.
 * Non-blocking, completely safe fallback for existing systems.
 */
export async function ensureDefaultOrganization(): Promise<TenantContext> {
  try {
    const existing = await prisma.organization.findUnique({
      where: { slug: DEFAULT_TENANT_SLUG }
    });

    if (existing) {
      return {
        id: existing.id,
        name: existing.name,
        slug: existing.slug,
        type: existing.type as TenantType,
        status: existing.status,
        tier: existing.tier
      };
    }

    const created = await prisma.organization.upsert({
      where: { slug: DEFAULT_TENANT_SLUG },
      update: {},
      create: {
        id: DEFAULT_TENANT_ID,
        name: DEFAULT_TENANT_NAME,
        slug: DEFAULT_TENANT_SLUG,
        type: 'DMC_PLATFORM',
        status: 'ACTIVE',
        tier: 'ENTERPRISE',
        email: 'operations@kashmircurators.com',
        phone: '+91 99066 88123',
        city: 'Srinagar',
        state: 'Jammu & Kashmir',
        settings: JSON.stringify({
          features: {
            b2bNetwork: true,
            hotelCrs: true,
            fleetDispatch: true,
            instantSettlement: true
          }
        })
      }
    });

    return {
      id: created.id,
      name: created.name,
      slug: created.slug,
      type: created.type as TenantType,
      status: created.status,
      tier: created.tier
    };
  } catch (err: any) {
    // If table doesn't have migration yet or offline, gracefully return in-memory default
    console.warn('[TenantLayer] Using in-memory default organization fallback:', err.message);
    return DEFAULT_TENANT;
  }
}

/**
 * Extracts and normalizes tenant context from incoming requests.
 * SECURITY:
 * - Platform privileged roles (admin, operations) may inspect a specific tenant via headers or view all (null).
 * - Authenticated users bound to an organizationId are locked to their own organizationId (headers cannot override).
 * - Public / unbound requests may specify a storefront tenant header or default to DEFAULT_TENANT_ID.
 */
export function extractTenantId(req: Request & { user?: any }): string | null {
  const rawHeader = (
    (req.headers['x-tenant-id'] as string) ||
    (req.headers['x-organization-id'] as string) ||
    ''
  ).trim();

  const headerTenant = rawHeader && rawHeader !== 'null' && rawHeader !== 'undefined' ? rawHeader : null;
  const userRole = (req.user?.role || '').toLowerCase();
  const isPlatformPrivileged = userRole === 'admin' || userRole === 'operations';

  if (isPlatformPrivileged) {
    if (headerTenant) return headerTenant;
    return req.user?.organizationId || null;
  }

  // Tenant-bound non-admin users CANNOT spoof cross-tenant headers
  if (req.user?.organizationId) {
    return req.user.organizationId;
  }

  if (headerTenant) {
    return headerTenant;
  }

  return DEFAULT_TENANT_ID;
}

/**
 * Helper to compose a tenant condition onto an existing Prisma `where` object via `AND`
 * so existing `where.OR` search/role filters are NEVER overwritten.
 */
function appendAndFilter<T extends Record<string, any>>(where: T, condition: Record<string, any>): T {
  const existingAnd = Array.isArray(where.AND)
    ? where.AND
    : where.AND
      ? [where.AND]
      : [];

  return {
    ...where,
    AND: [...existingAnd, condition]
  };
}

/**
 * Builds a safe Prisma WHERE clause modifier for shared catalog tables (e.g. hotels, cabs)
 * preserving visibility of core legacy catalog items (organizationId: null).
 * If tenantId is null (platform admin/operations), no tenant filter is imposed.
 */
export function withTenantScope<T extends Record<string, any>>(where: T, tenantId: string | null | undefined): T {
  if (!tenantId) {
    return where;
  }

  return appendAndFilter(where, {
    OR: [
      { organizationId: tenantId },
      { organizationId: null }
    ]
  });
}

/**
 * Strict tenant scoping for private operational & PII tables (bookings, inquiries, reservations, CRM).
 * Non-default tenants ONLY see rows explicitly owned by their organizationId (zero legacy null leak).
 * Primary platform tenant (DEFAULT_TENANT_ID) sees its own rows plus unmigrated legacy null rows.
 */
export function withStrictTenantScope<T extends Record<string, any>>(where: T, tenantId: string | null | undefined): T {
  if (!tenantId) {
    return where;
  }

  if (tenantId !== DEFAULT_TENANT_ID) {
    return appendAndFilter(where, { organizationId: tenantId });
  }

  return appendAndFilter(where, {
    OR: [
      { organizationId: DEFAULT_TENANT_ID },
      { organizationId: null }
    ]
  });
}

/**
 * Verifies whether the current request is permitted to access/mutate a record belonging to `recordOrgId`.
 */
export function canAccessTenantRecord(
  req: Request & { user?: any; tenantId?: string | null },
  recordOrgId: string | null | undefined
): boolean {
  const userRole = String(req.user?.role || '').toLowerCase();
  const effectiveTenantId = req.tenantId !== undefined ? req.tenantId : extractTenantId(req);

  // Platform admin/ops with no tenant header override has cross-tenant access
  if ((userRole === 'admin' || userRole === 'operations') && !effectiveTenantId) {
    return true;
  }

  if (!recordOrgId) {
    // Legacy null-org record: accessible only to platform admin/ops or primary DEFAULT_TENANT_ID
    return !effectiveTenantId || effectiveTenantId === DEFAULT_TENANT_ID;
  }

  return recordOrgId === effectiveTenantId;
}

/**
 * Resolves organizationId to stamp on newly created records.
 */
export function resolveWriteTenantId(
  req: Request & { user?: any; tenantId?: string | null; body?: any }
): string | null {
  const userRole = String(req.user?.role || '').toLowerCase();
  const isPlatformPrivileged = userRole === 'admin' || userRole === 'operations';

  if (isPlatformPrivileged && req.body?.organizationId) {
    return String(req.body.organizationId);
  }
  if (req.user?.organizationId) {
    return String(req.user.organizationId);
  }
  if (req.tenantId) {
    return String(req.tenantId);
  }
  return isPlatformPrivileged ? null : DEFAULT_TENANT_ID;
}
