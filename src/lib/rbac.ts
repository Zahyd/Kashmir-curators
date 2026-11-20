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

/**
 * Normalizes system roles to standard 4-tier sales hierarchy:
 * 1. DIRECTOR (admin, director, superadmin)
 * 2. SALES_MANAGER (operations manager, sales supervisor)
 * 3. SALES_EXECUTIVE (sales consultant, concierge)
 * 4. DRIVER (chauffeur - strictly blocked from sales portal)
 */
export function normalizeSalesRole(role?: string): 'DIRECTOR' | 'SALES_MANAGER' | 'SALES_EXECUTIVE' | 'DRIVER' {
  if (!role) return 'SALES_EXECUTIVE';
  const r = role.toUpperCase();
  if (r === 'DIRECTOR' || r === 'ADMIN' || r === 'SUPERADMIN' || r === 'OWNER') {
    return 'DIRECTOR';
  }
  if (r === 'SALES_MANAGER' || r === 'MANAGER' || r === 'OPERATIONS' || r === 'OPS') {
    return 'SALES_MANAGER';
  }
  if (r === 'DRIVER' || r === 'CHAUFFEUR' || r === 'CAB_PARTNER') {
    return 'DRIVER';
  }
  return 'SALES_EXECUTIVE';
}

export const ROLE_DISPLAY_NAMES: Record<string, string> = {
  DIRECTOR: 'Director (Super Admin)',
  SALES_MANAGER: 'Sales Operations Manager',
  SALES_EXECUTIVE: 'Private Client Concierge',
  DRIVER: 'Verified Chauffeur'
};

export const ROLE_BADGE_STYLES: Record<string, string> = {
  DIRECTOR: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  SALES_MANAGER: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  SALES_EXECUTIVE: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  DRIVER: 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
};

// Access Control Helpers
export function canAccessSalesPortal(role?: string): boolean {
  const normalized = normalizeSalesRole(role);
  // DRIVER is strictly blocked from /sales/*
  return normalized !== 'DRIVER';
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
