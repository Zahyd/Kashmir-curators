/**
 * Role-Based Access Control (RBAC) Architecture
 * Defines scoped roles, permissions, and guard functions for Kashmir Curators Travel OS.
 */

export type SalesRole = 'DIRECTOR' | 'SALES_MANAGER' | 'SALES_EXECUTIVE' | 'DRIVER' | 'admin' | 'sales' | 'operations' | 'marketing' | 'finance';

export interface UserRoleProfile {
  id?: string;
  name: string;
  employeeCode: string;
  role: SalesRole | string;
  email?: string;
  phone?: string;
  isOnline?: boolean;
}

export type NormalizedSalesRole = 'DIRECTOR' | 'SALES_MANAGER' | 'SALES_EXECUTIVE' | 'DRIVER' | 'UNAUTHORIZED';

export const ADMIN_DASHBOARD_ROLES = new Set(['admin', 'director', 'operations', 'marketing', 'finance']);

/**
 * Normalizes system roles to standard 4-tier sales hierarchy:
 * 1. DIRECTOR (admin, director, superadmin, owner)
 * 2. SALES_MANAGER (operations manager, sales supervisor)
 * 3. SALES_EXECUTIVE (sales, sales_executive, marketing, finance)
 * 4. DRIVER (chauffeur - strictly blocked from sales portal)
 * Non-staff roles (agent, traveler, user, hotel, supplier) map to UNAUTHORIZED.
 */
export function normalizeSalesRole(role?: string): NormalizedSalesRole {
  if (!role) return 'UNAUTHORIZED';
  const r = String(role).trim().toUpperCase();
  if (r === 'DIRECTOR' || r === 'ADMIN' || r === 'SUPERADMIN' || r === 'OWNER') {
    return 'DIRECTOR';
  }
  if (r === 'SALES_MANAGER' || r === 'MANAGER' || r === 'OPERATIONS' || r === 'OPS') {
    return 'SALES_MANAGER';
  }
  if (r === 'SALES' || r === 'SALES_EXECUTIVE' || r === 'MARKETING' || r === 'FINANCE') {
    return 'SALES_EXECUTIVE';
  }
  if (r === 'DRIVER' || r === 'CHAUFFEUR' || r === 'CAB_PARTNER') {
    return 'DRIVER';
  }
  return 'UNAUTHORIZED';
}

export const ROLE_DISPLAY_NAMES: Record<string, string> = {
  DIRECTOR: 'Director (Super Admin)',
  SALES_MANAGER: 'Sales Operations Manager',
  SALES_EXECUTIVE: 'Private Client Concierge',
  DRIVER: 'Verified Chauffeur',
  UNAUTHORIZED: 'Unauthorized Role'
};

export const ROLE_BADGE_STYLES: Record<string, string> = {
  DIRECTOR: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  SALES_MANAGER: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  SALES_EXECUTIVE: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  DRIVER: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
  UNAUTHORIZED: 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
};

export function canAccessAdminDashboard(role?: string): boolean {
  return ADMIN_DASHBOARD_ROLES.has(String(role || '').trim().toLowerCase());
}

export function isB2BAgentRole(role?: string): boolean {
  return String(role || '').trim().toLowerCase() === 'agent';
}

// Access Control Helpers
export function canAccessSalesPortal(role?: string): boolean {
  const normalized = normalizeSalesRole(role);
  return normalized === 'DIRECTOR' || normalized === 'SALES_MANAGER' || normalized === 'SALES_EXECUTIVE';
}

export function getPortalDestinationForRole(role?: string): string {
  const r = String(role || '').trim().toLowerCase();
  if (canAccessAdminDashboard(r)) return '/admin';
  if (canAccessSalesPortal(r)) return '/sales/portal';
  if (r === 'agent') return '/agent';
  if (r === 'driver' || r === 'chauffeur' || r === 'cab_partner') return '/driver';
  if (r === 'hotel' || r === 'hospitality') return '/hospitality';
  if (r === 'supplier' || r === 'vendor') return '/vendor/portal';
  return '/sales/auth';
}

export function isDirector(role?: string): boolean {
  return normalizeSalesRole(role) === 'DIRECTOR';
}

export function isSalesManager(role?: string): boolean {
  const norm = normalizeSalesRole(role);
  return norm === 'DIRECTOR' || norm === 'SALES_MANAGER';
}

export function isSalesExecutive(role?: string): boolean {
  return normalizeSalesRole(role) === 'SALES_EXECUTIVE';
}

export function isDriver(role?: string): boolean {
  return normalizeSalesRole(role) === 'DRIVER';
}

export function canManageTeam(role?: string): boolean {
  const norm = normalizeSalesRole(role);
  return norm === 'DIRECTOR' || norm === 'SALES_MANAGER';
}

export function canViewAllLeads(role?: string): boolean {
  const norm = normalizeSalesRole(role);
  return norm === 'DIRECTOR' || norm === 'SALES_MANAGER';
}

export function canReassignLeads(role?: string): boolean {
  const norm = normalizeSalesRole(role);
  return norm === 'DIRECTOR' || norm === 'SALES_MANAGER';
}

export function canApproveDiscounts(role?: string): boolean {
  const norm = normalizeSalesRole(role);
  return norm === 'DIRECTOR' || norm === 'SALES_MANAGER';
}

export function canClaimLeads(role?: string): boolean {
  const norm = normalizeSalesRole(role);
  // Executives and managers can claim unassigned leads
  return norm === 'SALES_EXECUTIVE' || norm === 'SALES_MANAGER' || norm === 'DIRECTOR';
}
