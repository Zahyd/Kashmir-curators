import { API_BASE_URL } from '@/lib/api';

export function getSalesAuthToken(): string {
  return (
    localStorage.getItem('teamToken') ||
    localStorage.getItem('team_auth_token') ||
    localStorage.getItem('auth_token') ||
    localStorage.getItem('token') ||
    ''
  );
}

export function getSalesAuthHeaders(isMultipart = false): Record<string, string> {
  const token = getSalesAuthToken();
  const portalKey = localStorage.getItem('kashmir_portal_key') || '';
  const headers: Record<string, string> = {};
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (portalKey) {
    headers['x-portal-key'] = portalKey;
  }
  return headers;
}

export function getErrorMessage(err: unknown, fallback = 'Request failed'): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === 'string' && err.trim()) return err;
  return fallback;
}

async function apiJson<T = unknown>(path: string, init: RequestInit = {}, isMultipart = false): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...getSalesAuthHeaders(isMultipart),
      ...(init.headers as Record<string, string> | undefined)
    }
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || data?.message || `Request failed (${res.status})`);
  }
  return data as T;
}

export interface SalesInquiry {
  id: string;
  leadId?: string | null;
  customerName: string;
  phone: string;
  email?: string | null;
  destination?: string | null;
  duration?: string | null;
  travelers?: string | null;
  adultsCount?: number;
  childrenCount?: number;
  budget?: string | number | null;
  netPrice?: number;
  accommodation?: string | null;
  preferredAccommodation?: string | null;
  transportPreference?: string | null;
  arrivalCity?: string | null;
  leadStage?: string | null;
  status: string;
  priority?: string | null;
  sentiment?: string | null;
  leadScore?: number;
  leadCategory?: string | null;
  assignedTo?: string | null;
  quoteData?: string | null;
  proposalUrl?: string | null;
  sourceCta?: string | null;
  notes?: string | null;
  specialNotes?: string | null;
  hotelCategory?: string | null;
  roomPreference?: string | null;
  flightDetails?: string | null;
  travelStartDate?: string | null;
  intentQuery?: string | null;
  lastContactedAt?: string | null;
  nextFollowUpDate?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface SalesLeadDetail extends SalesInquiry {
  activities?: LeadActivityItem[];
  leadNotes?: LeadNoteItem[];
  reminders?: LeadReminderItem[];
  whatsappMessages?: Array<{
    id: string;
    direction?: string;
    content: string;
    createdAt: string;
    senderName?: string | null;
  }>;
  documents?: InquiryDocumentItem[];
}

export interface LivePresenceMember {
  id: string;
  employeeCode: string;
  employeeName: string;
  role: string;
  portalType?: string;
  loginAt?: string;
  lastActivityAt?: string;
  isOnBreak: boolean;
  breakMinutes?: number;
  assignedDesk?: string | null;
  totalWorkMinutes?: number;
  status?: string;
  activeReservationsCount?: number;
}

export interface AttendanceHistoryEntry {
  id: string;
  employeeCode?: string;
  employeeName?: string;
  role?: string;
  date: string;
  firstLoginAt: string;
  lastLogoutAt?: string | null;
  totalWorkMinutes: number;
  totalBreakMinutes: number;
  status: string;
  shiftName: string;
}

export interface MetaLeadItem extends SalesInquiry {
  source?: string | null;
  metaFormName?: string | null;
  metaCampaignId?: string | null;
  originCountry?: string | null;
  geo: {
    origin: 'DOMESTIC' | 'INTERNATIONAL';
    countryCode: string;
    countryName: string;
    flag: string;
    currency: string;
    currencySymbol: string;
    localTimeFormatted: string;
    isCallSafe: boolean;
  };
  valINR: number;
  convertedVal: number;
  convertedDisplay: string;
}

export interface SalesNotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  link?: string | null;
  read: boolean;
  createdAt: string;
}

export interface LeadActivityItem {
  id: string;
  inquiryId: string;
  type: string;
  title: string;
  description: string;
  performedBy?: string | null;
  createdAt: string;
}

export interface LeadNoteItem {
  id: string;
  inquiryId: string;
  authorId?: string | null;
  authorName: string;
  content: string;
  isInternal: boolean;
  createdAt: string;
}

export interface LeadReminderItem {
  id: string;
  inquiryId: string;
  assignedTo?: string | null;
  title: string;
  dueDate: string;
  priority: string;
  status: string;
  notes?: string | null;
  isOverdue?: boolean;
  inquiry?: {
    id: string;
    customerName: string;
    phone: string;
    destination?: string;
    leadStage?: string;
    priority?: string;
    leadScore?: number;
  };
}

export interface InquiryDocumentItem {
  id: string;
  inquiryId: string;
  name: string;
  category: string;
  url: string;
  publicId?: string | null;
  mimeType?: string | null;
  sizeBytes: number;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED' | string;
  uploadedBy?: string | null;
  verifiedBy?: string | null;
  createdAt: string;
}

export interface TeamMemberItem {
  id: string;
  name: string;
  email: string;
  role: string;
  employeeCode?: string | null;
  isOnline?: boolean;
  leadCapacity?: number;
  activeLeadCount?: number;
  phone?: string | null;
  createdAt?: string;
}

export interface PaymentLedgerItem {
  id: string;
  bookingId: string;
  amount: number;
  type: string;
  paymentId: string;
  orderId: string;
  description?: string | null;
  createdAt: string;
}

export interface AttendanceStatusResponse {
  attendance: {
    id: string;
    employeeCode: string;
    employeeName: string;
    role: string;
    date: string;
    firstLoginAt: string;
    lastLogoutAt?: string | null;
    totalWorkMinutes: number;
    totalBreakMinutes: number;
    status: string;
    shiftName: string;
  } | null;
  session: {
    id: string;
    employeeCode: string;
    loginAt: string;
    lastActivityAt: string;
    isActive: boolean;
    isOnBreak: boolean;
    breakMinutes: number;
    assignedDesk?: string | null;
  } | null;
  history: Array<{
    id: string;
    date: string;
    firstLoginAt: string;
    lastLogoutAt?: string | null;
    totalWorkMinutes: number;
    totalBreakMinutes: number;
    status: string;
    shiftName: string;
  }>;
}

export const PIPELINE_STAGES = [
  { key: 'CLAIMED', label: 'Claimed', shortLabel: 'Claimed' },
  { key: 'FOLLOW_UP', label: 'Follow-Up', shortLabel: 'Follow-Up' },
  { key: 'QUOTE_SENT', label: 'Quote Sent', shortLabel: 'Quoted' },
  { key: 'NEGOTIATION', label: 'Negotiation', shortLabel: 'In Neg' },
  { key: 'PAYMENT_PENDING', label: 'Payment Pending', shortLabel: 'Payment' },
  { key: 'CONFIRMED', label: 'Confirmed', shortLabel: 'Confirmed' },
  { key: 'LOST', label: 'Lost / Archived', shortLabel: 'Lost' }
] as const;

export function normalizeStageKey(stage?: string | null, status?: string | null): string {
  const s = (stage || '').toUpperCase();
  if (s === 'QUOTED') return 'QUOTE_SENT';
  if (s === 'CANCELLED') return 'LOST';
  if (s) return s;
  if (status === 'Booked') return 'CONFIRMED';
  if (status === 'Lost') return 'LOST';
  if (status === 'Ready for Review') return 'QUOTE_SENT';
  if (status === 'Pending Curation') return 'CLAIMED';
  return 'NEW_LEAD';
}

export function getInquiryValueINR(inq: Partial<SalesInquiry>): number {
  if (inq.netPrice && inq.netPrice > 0) return inq.netPrice;
  const parsed = parseInt(String(inq.budget || '0').replace(/[^0-9]/g, ''), 10);
  return isNaN(parsed) ? 0 : parsed;
}

export const salesApi = {
  // Metrics & Inquiries
  getMetrics: () => apiJson<{
    unclaimedCount: number;
    slaBreachedCount: number;
    activePipelineCount: number;
    activePipelineValue: number;
    confirmedCount?: number;
    confirmedRevenue?: number;
    monthlyConversionRate: number;
    conversionDelta: number | null;
    avgResponseMinutes: number | null;
    onlineStaffCount?: number;
    unreadNotificationsCount?: number;
  }>('/sales/metrics'),
  listInquiries: async (): Promise<SalesInquiry[]> => {
    const data = await apiJson<SalesInquiry[] | { inquiries?: SalesInquiry[] }>('/inquiries');
    return Array.isArray(data) ? data : data?.inquiries || [];
  },
  createLead: (payload: Record<string, unknown>) =>
    apiJson<SalesInquiry>('/sales/leads', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  updateLead: (id: string, payload: Record<string, unknown>) =>
    apiJson<SalesInquiry>(`/inquiries/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    }),
  deleteLead: (id: string) =>
    apiJson<{ success: boolean }>(`/inquiries/${id}`, {
      method: 'DELETE'
    }),
  claimLead: (id: string, employeeCode: string, employeeName: string) =>
    apiJson<{ success: boolean; lead: SalesInquiry }>(`/sales/leads/${id}/claim`, {
      method: 'POST',
      body: JSON.stringify({ employeeCode, employeeName })
    }),
  transitionStage: (id: string, payload: { stage: string; notes?: string; netPrice?: number; budget?: string; priority?: string }) =>
    apiJson<{ success: boolean; lead: SalesInquiry }>(`/sales/leads/${id}/stage`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    }),

  // CRM Detail, Notes, Reminders, Assignment, Duplicates
  getLeadDetail: (id: string) => apiJson<SalesLeadDetail>(`/crm/leads/${id}`),
  assignLead: (id: string, agentEmail: string, agentName?: string) =>
    apiJson<SalesInquiry>(`/crm/leads/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify({ agentEmail, agentName })
    }),
  checkDuplicates: (id: string) =>
    apiJson<{ count: number; hasDuplicates: boolean; duplicates: SalesInquiry[] }>(`/crm/leads/${id}/duplicates`),
  mergeDuplicates: (id: string, duplicateLeadId: string) =>
    apiJson<{ success: boolean; message: string }>(`/crm/leads/${id}/merge`, {
      method: 'POST',
      body: JSON.stringify({ duplicateLeadId })
    }),
  addNote: (id: string, content: string) =>
    apiJson<LeadNoteItem>(`/crm/leads/${id}/notes`, {
      method: 'POST',
      body: JSON.stringify({ content, isInternal: true })
    }),
  deleteNote: (noteId: string) =>
    apiJson<{ success: boolean }>(`/crm/notes/${noteId}`, {
      method: 'DELETE'
    }),
  getPendingReminders: () => apiJson<LeadReminderItem[]>('/crm/reminders/pending'),
  createReminder: (id: string, payload: { title: string; dueDate: string; priority?: string; notes?: string }) =>
    apiJson<LeadReminderItem>(`/crm/leads/${id}/reminders`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  updateReminder: (reminderId: string, payload: { status?: string; dueDate?: string; notes?: string }) =>
    apiJson<LeadReminderItem>(`/crm/reminders/${reminderId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    }),

  // Vault Document CRUD
  listDocuments: (id: string) => apiJson<InquiryDocumentItem[]>(`/sales/leads/${id}/documents`),
  uploadMediaFile: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiJson<{ url: string; publicId?: string; size?: number; mimeType?: string; originalName?: string }>(
      '/media/upload',
      { method: 'POST', body: formData },
      true
    );
  },
  createDocument: (
    id: string,
    payload: { name: string; category: string; url: string; publicId?: string; mimeType?: string; sizeBytes?: number }
  ) =>
    apiJson<InquiryDocumentItem>(`/sales/leads/${id}/documents`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  updateDocument: (docId: string, payload: { status?: string; category?: string; name?: string }) =>
    apiJson<InquiryDocumentItem>(`/sales/documents/${docId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    }),
  deleteDocument: (docId: string) =>
    apiJson<{ success: boolean }>(`/sales/documents/${docId}`, {
      method: 'DELETE'
    }),

  // Payments
  getInquiryPayments: (inquiryId: string) => apiJson<PaymentLedgerItem[]>(`/payments/inquiry/${inquiryId}`),
  createRazorpayLink: (inquiryId: string, amount: number, customerEmail?: string | null) =>
    apiJson<{ sessionUrl: string }>('/payments/razorpay/create-payment-link', {
      method: 'POST',
      body: JSON.stringify({ inquiryId, amount, customerEmail })
    }),
  sendWhatsAppScanner: (inquiryId: string, phone: string, amount: number) =>
    apiJson<{ success: boolean; paymentId: string; checkoutUrl: string }>('/payments/send-whatsapp-scanner', {
      method: 'POST',
      body: JSON.stringify({ inquiryId, phone, amount })
    }),
  verifyManualPayment: (inquiryId: string, payload: { amount: number; utrNumber: string; markConfirmed?: boolean; notes?: string }) =>
    apiJson<{ success: boolean; ledgerEntry: PaymentLedgerItem; inquiry: SalesInquiry }>(
      `/payments/inquiry/${inquiryId}/verify-manual`,
      {
        method: 'POST',
        body: JSON.stringify(payload)
      }
    ),

  // Team & Availability
  getTeamRoster: () => apiJson<TeamMemberItem[]>('/sales/team'),
  createTeamMember: (payload: { name: string; email: string; phone?: string; role: string; employeeCode: string; leadCapacity?: number }) =>
    apiJson<TeamMemberItem>('/users/team', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  updateTeamMember: (id: string, payload: { name?: string; phone?: string; role?: string; leadCapacity?: number }) =>
    apiJson<TeamMemberItem>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    }),
  deleteTeamMember: (id: string) =>
    apiJson<{ success: boolean }>(`/users/${id}`, {
      method: 'DELETE'
    }),
  toggleAvailability: (isOnline: boolean) =>
    apiJson<{ success: boolean; isOnline: boolean }>('/sales/availability', {
      method: 'POST',
      body: JSON.stringify({ isOnline })
    }),

  // Attendance / Work Log
  clockIn: (assignedDesk = 'Sales Command Desk') =>
    apiJson('/attendance/clock-in', {
      method: 'POST',
      body: JSON.stringify({ assignedDesk })
    }),
  sendPulse: () => apiJson('/attendance/pulse', { method: 'POST', body: JSON.stringify({}) }),
  toggleBreak: () => apiJson<{ success: boolean; isOnBreak: boolean; message: string }>('/attendance/break', { method: 'POST', body: JSON.stringify({}) }),
  clockOut: () => apiJson<{ success: boolean; message: string }>('/attendance/clock-out', { method: 'POST', body: JSON.stringify({}) }),
  getMyAttendance: () => apiJson<AttendanceStatusResponse>('/attendance/my'),
  getLivePresence: () => apiJson<{ presenceList: LivePresenceMember[]; totalActive: number; totalOnBreak: number; totalOnline: number }>('/attendance/live-presence'),
  getAttendanceReports: () => apiJson<AttendanceHistoryEntry[]>('/attendance/reports'),

  // Sales Portal 2.0 Analytics, Global Vault, Ledger, Activity Timeline, Search & Notifications
  listInquiriesPaginated: (params: {
    page?: number;
    limit?: number;
    search?: string;
    stage?: string;
    stageGroup?: string;
    status?: string;
    priority?: string;
    assignedTo?: string;
    unclaimedOnly?: boolean;
  } = {}) => {
    const qs = new URLSearchParams({ paginated: 'true' });
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
    });
    return apiJson<{ items: SalesInquiry[]; total: number; page: number; limit: number; totalPages: number }>(
      `/inquiries?${qs.toString()}`
    );
  },

  getAnalytics: () =>
    apiJson<{
      summary: {
        totalLeads: number;
        confirmedCount: number;
        confirmedRevenueINR: number;
        activePipelineValueINR: number;
        totalCollectedINR: number;
        avgDealValueINR: number;
        conversionRatePct: number;
      };
      monthlySeries: Array<{ key: string; month: string; leads: number; confirmed: number; revenue: number; collected: number }>;
      stageDistribution: Array<{ stage: string; count: number; valueINR: number }>;
      topDestinations: Array<{ destination: string; count: number; valueINR: number }>;
      sourceBreakdown: Array<{ source: string; count: number }>;
      conciergeLeaderboard: Array<{ code: string; name: string; totalLeads: number; confirmed: number; revenueINR: number; isOnline: boolean; conversionRatePct: number }>;
    }>('/sales/analytics'),

  getActivities: (params: { page?: number; limit?: number; type?: string; inquiryId?: string } = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
    });
    return apiJson<{
      activities: Array<LeadActivityItem & { inquiry?: { id: string; leadId?: string; customerName: string; destination?: string; leadStage?: string } | null }>;
      pagination: { total: number; page: number; limit: number; totalPages: number };
    }>(`/sales/activities${qs.toString() ? `?${qs.toString()}` : ''}`);
  },

  globalSearch: (q: string) =>
    apiJson<{
      leads: SalesInquiry[];
      documents: Array<InquiryDocumentItem & { inquiry?: { id: string; customerName: string; leadId?: string } | null }>;
      payments: Array<PaymentLedgerItem & { inquiry?: { id: string; customerName: string; leadId?: string } | null }>;
    }>(`/sales/search?q=${encodeURIComponent(q)}`),

  listAllDocuments: (params: { page?: number; limit?: number; status?: string; category?: string; search?: string } = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
    });
    return apiJson<{
      documents: Array<InquiryDocumentItem & { inquiry?: { id: string; leadId?: string; customerName: string; destination?: string; leadStage?: string } | null }>;
      summary: { total: number; verified: number; pending: number; rejected: number; totalBytes: number };
      pagination: { total: number; page: number; limit: number; totalPages: number };
    }>(`/sales/documents${qs.toString() ? `?${qs.toString()}` : ''}`);
  },

  getPaymentLedger: (params: { page?: number; limit?: number; status?: string; search?: string } = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
    });
    return apiJson<{
      items: Array<
        PaymentLedgerItem & {
          derivedStatus: 'VERIFIED' | 'PENDING' | 'FAILED';
          inquiry?: SalesInquiry | null;
          booking?: { id: string; itemName: string; totalAmount: number; status: string } | null;
        }
      >;
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      summary: {
        totalCollected: number;
        totalPendingAmount: number;
        verifiedCount: number;
        pendingCount: number;
        totalTransactions: number;
      };
    }>(`/payments/ledger${qs.toString() ? `?${qs.toString()}` : ''}`);
  },

  getNotifications: (params: { unreadOnly?: boolean; priority?: string; search?: string; page?: number; limit?: number } = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
    });
    return apiJson<{
      notifications: Array<{ id: string; title: string; message: string; type: string; priority: string; link?: string | null; read: boolean; createdAt: string }>;
      unreadCount: number;
      pagination: { total: number; page: number; limit: number; totalPages: number };
    }>(`/notifications${qs.toString() ? `?${qs.toString()}` : ''}`);
  },

  markNotificationRead: (id: string) =>
    apiJson<{ success: boolean; notification: SalesNotificationItem }>(`/notifications/${id}/read`, { method: 'PATCH' }),

  markAllNotificationsRead: () =>
    apiJson<{ success: boolean }>('/notifications/read-all', { method: 'POST' }),

  listMetaLeads: (params: { origin?: string; search?: string; stage?: string; page?: number; limit?: number } = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
    });
    return apiJson<{
      success: boolean;
      total: number;
      domesticCount: number;
      internationalCount: number;
      totalPipelineINR: number;
      page: number;
      limit: number;
      totalPages: number;
      leads: MetaLeadItem[];
    }>(`/webhooks/meta-leads/leads${qs.toString() ? `?${qs.toString()}` : ''}`);
  },

  getMetaTelemetry: () => apiJson<Record<string, unknown>>('/webhooks/meta-leads/telemetry'),

  getRealtimeHealth: () =>
    apiJson<{ instanceId: string; pubsubMode: string; sseClients: number; connectedStaffUsers: number }>('/sales/realtime/health'),
};
