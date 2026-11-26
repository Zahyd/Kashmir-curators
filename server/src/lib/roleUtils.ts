export const STAFF_ROLES = new Set([
  'admin',
  'director',
  'operations',
  'sales',
  'marketing',
  'finance',
  'sales_manager',
  'sales_executive',
]);

export const ADMIN_DASHBOARD_ROLES = [
  'admin',
  'director',
  'operations',
  'marketing',
  'finance',
] as const;

export const SALES_PORTAL_ROLES = [
  'admin',
  'director',
  'operations',
  'sales',
  'marketing',
  'finance',
  'sales_manager',
  'sales_executive',
] as const;

export function normalizeRole(role?: string | null): string {
  return String(role || '').trim().toLowerCase();
}

export function isStaffRole(role?: string | null): boolean {
  return STAFF_ROLES.has(normalizeRole(role));
}

export function isAdminDashboardRole(role?: string | null): boolean {
  return (ADMIN_DASHBOARD_ROLES as readonly string[]).includes(normalizeRole(role));
}

/**
 * Preserves existing internal staff/admin roles when activating B2B agent or
 * supplier partner capabilities so director/admin credentials never lose access.
 */
export function resolvePreservedPartnerRole(
  existingRole?: string | null,
  partnerRole: 'agent' | 'supplier' = 'agent'
): string {
  const normalized = normalizeRole(existingRole);
  if (STAFF_ROLES.has(normalized)) {
    return normalized;
  }
  return partnerRole;
}
