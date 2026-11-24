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
 * Honors headers: 'x-tenant-id', 'x-organization-id', authenticated user's organizationId,
 * or defaults to safe primary platform tenant.
 */
export function extractTenantId(req: Request & { user?: any }): string | null {
  const headerTenant = (
    (req.headers['x-tenant-id'] as string) ||
    (req.headers['x-organization-id'] as string) ||
    ''
  ).trim();

  if (headerTenant && headerTenant !== 'null' && headerTenant !== 'undefined') {
    return headerTenant;
  }

  if (req.user?.organizationId) {
    return req.user.organizationId;
  }

  // SuperAdmins and Operations can query without tenant restrictions by default
  const userRole = (req.user?.role || '').toLowerCase();
  if (userRole === 'admin' || userRole === 'operations') {
    return null;
  }

  return DEFAULT_TENANT_ID;
}

/**
 * Builds a safe Prisma WHERE clause modifier that maintains backwards compatibility.
 * If tenantId is null (e.g. platform admin or legacy query), no tenant filter is imposed.
 */
export function withTenantScope<T extends Record<string, any>>(where: T, tenantId: string | null | undefined): T {
  if (!tenantId) {
    return where;
  }

  return {
    ...where,
    OR: [
      { organizationId: tenantId },
      { organizationId: null } // Guarantee existing legacy rows with null organizationId remain visible
    ]
  };
}
