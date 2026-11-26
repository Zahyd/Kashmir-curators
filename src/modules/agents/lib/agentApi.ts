import { API_BASE_URL } from '@/lib/api';
import type { LeadItem } from '../components/LeadKanbanBoard';

export interface AgentBranding {
  agencyName: string;
  agencyTagline: string;
  logoUrl: string;
  primaryColor: string;
  phone: string;
  website: string;
}

export interface AgentSeat {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'CONCIERGE' | 'OPS_COORDINATOR' | 'SALES_MANAGER';
  code: string;
  isOnline: boolean;
  assignedLeadsCount: number;
  joinedAt: string;
}

export interface AgentDomainStatus {
  domain: string;
  status: 'NOT_CONFIGURED' | 'PENDING' | 'VERIFIED' | 'FAILED';
  cnameTarget: string;
  lastCheckedAt: string | null;
  lastError: string | null;
}

export interface AgentSupplyItem {
  id: string;
  sourceType: 'HOTEL' | 'CAB' | 'PACKAGE';
  category: 'HOTEL' | 'HOUSEBOAT' | 'CAB' | 'PACKAGE';
  title: string;
  location: string;
  netRate: number;
  retailRate: number;
  unit: string;
  rating: number;
  features: string[];
  cancellationPolicy: string;
}

export interface AgentSupplyHold {
  id: string;
  itemId: string;
  title: string;
  netRate: number;
  expiresAt: string;
}

export interface AgentProfileDTO {
  id: string;
  companyName?: string;
  licenseNumber?: string;
  agentCode?: string;
  commissionPct?: number;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'NOT_APPLIED';
  plan?: string;
  billingCycle?: string;
  website?: string;
  organizationId?: string | null;
}

export interface AgentOrganizationDTO {
  id: string;
  name: string;
  slug?: string;
  domain?: string | null;
  tier?: string;
}

export interface AgentStatsResponse {
  inquiriesCount: number;
  monthlyLeadsUsed: number;
  leadsLimit: number | null;
  bookingsCount: number;
  confirmedCount: number;
  totalRevenue: number;
  confirmedRevenue: number;
  commissionPct: number;
  commissionEarned: number;
  profile: AgentProfileDTO | null;
  organization: AgentOrganizationDTO | null;
  plan?: string;
  branding?: AgentBranding;
  customDomain?: AgentDomainStatus;
  apiKey?: string | null;
  teamSeatsCount?: number;
}

export interface AgentCreditLedgerData {
  plan: string;
  creditLimit: number;
  utilizedCredit: number;
  availableCredit: number;
  settledAmount: number;
  confirmedRevenue: number;
  commissionPct: number;
  commissionEarned: number;
  entries: Array<{
    id: string;
    date: string;
    description: string;
    guestName: string;
    amount: number;
    type: string;
    status: string;
  }>;
}

export interface CRMBIMetricsData {
  totalInquiries: number;
  totalPipelineValue: number;
  confirmedRevenue: number;
  confirmedCount: number;
  overallConversionRate: number;
  stageCounts: Record<string, number>;
  destinationStats: Record<string, number>;
  agentPerformance: Array<{
    agent: string;
    total: number;
    confirmed: number;
    revenue: number;
    conversionRate: number;
  }>;
}

export function getErrMsg(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

function getAgentAuthToken(explicitToken?: string | null): string {
  return (
    explicitToken ||
    localStorage.getItem('auth_token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('teamToken') ||
    localStorage.getItem('team_auth_token') ||
    ''
  );
}

async function agentRequest<T>(path: string, options: RequestInit = {}, explicitToken?: string | null): Promise<T> {
  const token = getAgentAuthToken(explicitToken);
  const headers: Record<string, string> = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers as Record<string, string> | undefined),
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers
  });

  const text = await res.text();
  let parsed: Record<string, unknown> | unknown = null;
  try {
    parsed = text ? JSON.parse(text) : {};
  } catch {
    parsed = { error: text };
  }

  if (!res.ok) {
    const errObj = parsed as { error?: string; message?: string } | null;
    throw new Error(errObj?.error || errObj?.message || `Request failed (${res.status})`);
  }
  return parsed as T;
}

export const agentApi = {
  getStats: (token?: string | null) =>
    agentRequest<AgentStatsResponse>('/agents/stats', {}, token),

  getRealtimeHealth: (token?: string | null) =>
    agentRequest<{
      instanceId: string;
      pubsubMode: string;
      sseClients: number;
      connectedStaffUsers: number;
      timestamp: string;
    }>('/agents/realtime/health', {}, token),

  getCRMLeads: (token?: string | null) =>
    agentRequest<LeadItem[]>('/crm/leads', {}, token),

  createCRMLead: (
    payload: {
      customerName: string;
      email?: string;
      phone?: string;
      destination?: string;
      duration?: string;
      adultsCount?: number;
      childrenCount?: number;
      budget?: string;
      netPrice?: number;
      accommodation?: string;
      leadStage?: string;
      notes?: string;
    },
    token?: string | null
  ) =>
    agentRequest<LeadItem>(
      '/agents/leads',
      { method: 'POST', body: JSON.stringify(payload) },
      token
    ),

  updateLeadStage: (leadId: string, payload: Record<string, unknown>, token?: string | null) =>
    agentRequest<LeadItem>(
      `/crm/leads/${leadId}/stage`,
      { method: 'PATCH', body: JSON.stringify(payload) },
      token
    ),

  getCRMBIMetrics: (token?: string | null) =>
    agentRequest<CRMBIMetricsData>('/crm/bi/metrics', {}, token),

  verifyLicense: (
    data: {
      companyName?: string;
      licenseNumber: string;
      association?: string;
      gstin?: string;
      officeAddress?: string;
      file?: File | null;
    },
    token?: string | null
  ) => {
    if (data.file) {
      const fd = new FormData();
      fd.append('licenseNumber', data.licenseNumber);
      if (data.companyName) fd.append('companyName', data.companyName);
      if (data.association) fd.append('association', data.association);
      if (data.gstin) fd.append('gstin', data.gstin);
      if (data.officeAddress) fd.append('officeAddress', data.officeAddress);
      fd.append('licenseFile', data.file);
      return agentRequest<{ success: boolean; profile: AgentProfileDTO }>(
        '/agents/verify-license',
        { method: 'POST', body: fd },
        token
      );
    }
    return agentRequest<{ success: boolean; profile: AgentProfileDTO }>(
      '/agents/verify-license',
      { method: 'POST', body: JSON.stringify(data) },
      token
    );
  },

  getBranding: (token?: string | null) =>
    agentRequest<{ branding: AgentBranding }>('/agents/branding', {}, token),

  updateBranding: (branding: AgentBranding, token?: string | null) =>
    agentRequest<{ success: boolean; branding: AgentBranding }>(
      '/agents/branding',
      { method: 'PUT', body: JSON.stringify(branding) },
      token
    ),

  getTeamSeats: (token?: string | null) =>
    agentRequest<{ seats: AgentSeat[]; plan: string; maxSeats: number | null }>('/agents/team', {}, token),

  createTeamSeat: (
    payload: { name: string; email: string; phone?: string; role: AgentSeat['role'] },
    token?: string | null
  ) =>
    agentRequest<{ seat: AgentSeat; seats: AgentSeat[] }>(
      '/agents/team',
      { method: 'POST', body: JSON.stringify(payload) },
      token
    ),

  deleteTeamSeat: (memberId: string, token?: string | null) =>
    agentRequest<{ success: boolean; seats: AgentSeat[] }>(
      `/agents/team/${memberId}`,
      { method: 'DELETE' },
      token
    ),

  getSupply: (params: { category?: string; search?: string } = {}, token?: string | null) => {
    const qs = new URLSearchParams();
    if (params.category) qs.set('category', params.category);
    if (params.search) qs.set('search', params.search);
    return agentRequest<{
      items: AgentSupplyItem[];
      commissionPct: number;
      activeHolds: AgentSupplyHold[];
      total: number;
    }>(`/agents/supply?${qs.toString()}`, {}, token);
  },

  holdSupplyRate: (
    payload: { itemId: string; category: string; title: string; netRate: number; inquiryId?: string },
    token?: string | null
  ) =>
    agentRequest<{ success: boolean; hold: AgentSupplyHold; activeHolds: AgentSupplyHold[] }>(
      '/agents/supply/hold',
      { method: 'POST', body: JSON.stringify(payload) },
      token
    ),

  getApiFeed: (params: { category: 'hotels' | 'cabs' | 'packages'; format: 'json' | 'xml' }, token?: string | null) =>
    agentRequest<{
      apiKey: string | null;
      plan: string;
      agencyCode: string;
      format: 'JSON' | 'XML';
      json: Record<string, unknown>;
      xml?: string;
    }>(`/agents/api-feed?category=${params.category}&format=${params.format}`, {}, token),

  regenerateApiKey: (token?: string | null) =>
    agentRequest<{ success: boolean; apiKey: string }>('/agents/api-keys/regenerate', { method: 'POST' }, token),

  getDomain: (token?: string | null) =>
    agentRequest<AgentDomainStatus>('/agents/domain', {}, token),

  updateDomain: (domain: string, token?: string | null) =>
    agentRequest<{ success: boolean } & AgentDomainStatus>(
      '/agents/domain',
      { method: 'PUT', body: JSON.stringify({ domain }) },
      token
    ),

  verifyDomain: (domain?: string, token?: string | null) =>
    agentRequest<{ success: boolean } & AgentDomainStatus>(
      '/agents/domain/verify',
      { method: 'POST', body: JSON.stringify({ domain }) },
      token
    ),

  getCreditLedger: (token?: string | null) =>
    agentRequest<AgentCreditLedgerData>('/agents/credit', {}, token),

  buildStreamUrl: (token?: string | null): string => {
    const authToken = getAgentAuthToken(token);
    return `${API_BASE_URL}/agents/stream?token=${encodeURIComponent(authToken)}`;
  }
};
