import React, { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';

import { SOCKET_URL, DEFAULT_SOCKET_OPTIONS, isSearchBot } from '@/lib/api';
import { SalesInquiry, SalesNotificationItem } from '@/lib/salesApi';

export type TeamRole = 'admin' | 'operations' | 'sales' | 'marketing' | 'finance';

export interface TeamUser {
  id?: string;
  code: string;
  name: string;
  role: TeamRole;
  loginTime: string;
  email?: string;
  phone?: string;
  image?: string;
  organizationId?: string | null;
}

export interface SystemEvent {
  type: 'CREATE' | 'UPDATE' | 'DELETE' | string;
  message: string;
  booking?: { id?: string; [key: string]: unknown } | null;
  notification?: SalesNotificationItem | null;
  timestamp: string;
}

export interface StaffPresenceState {
  code: string;
  name?: string;
  role?: string;
  status: 'ONLINE' | 'ON_BREAK' | 'BUSY' | 'OFFLINE' | string;
  lastSeenAt?: string;
}

export interface SalesEventPayload {
  id?: string;
  type?: string;
  title?: string;
  description?: string;
  performedBy?: string | null;
  createdAt?: string;
  message?: string;
  leadId?: string;
  inquiryId?: string;
  lead?: SalesInquiry;
  inquiry?: { id?: string; [key: string]: unknown } | null;
  booking?: { id?: string; [key: string]: unknown } | null;
  notification?: SalesNotificationItem | null;
  notificationId?: string;
  markAll?: boolean;
  all?: boolean;
  claimedBy?: string;
  claimedByName?: string;
  employeeCode?: string;
  code?: string;
  employeeName?: string;
  name?: string;
  role?: string;
  status?: string;
  isOnline?: boolean;
  timestamp?: string;
  [key: string]: unknown;
}

export type SalesEventHandler = (eventName: string, payload?: SalesEventPayload) => void;

const REALTIME_EVENTS = [
  'new-system-event',
  'NEW_INQUIRY',
  'LEAD_CREATED',
  'LEAD_CLAIMED',
  'LEAD_UPDATED',
  'LEAD_DELETED',
  'STAGE_UPDATED',
  'LEAD_STAGE_UPDATED',
  'BOOKING_STATUS_UPDATED',
  'lead-updated',
  'lead-assigned',
  'lead-note-added',
  'reminder-scheduled',
  'PAYMENT_CONFIRMED',
  'PAYMENT_LINK_CREATED',
  'PAYMENT_FAILED',
  'ACTIVITY_LOGGED',
  'DOCUMENT_UPLOADED',
  'DOCUMENT_STATUS_UPDATED',
  'EMPLOYEE_STATUS_CHANGED',
  'employee-attendance-updated',
  'employee-presence-refresh',
  'presence:roster',
  'notification:acked'
] as const;

// Permission map: what each role can access
const ROLE_PERMISSIONS: Record<TeamRole, string[]> = {
  admin: [
    'dashboard', 'attendance', 'page_builder', 'destinations', 'packages', 'itinerary_builder', 
    'hotels', 'cabs', 'activities', 'reviews', 'faqs', 'media', 'inquiries', 
    'customers', 'bookings', 'reservations', 'disruptions', 'payments', 'coupons', 
    'seo', 'reports', 'users', 'portal_keys', 'audit_logs', 'settings', 'revenue', 'content', 'planner',
    'assign_leads', 'view_financials', 'sales_portal'
  ],
  operations: [
    'dashboard', 'attendance', 'disruptions', 'inquiries', 'reservations', 'bookings', 'hotels', 'cabs', 
    'assign_leads', 'portal_keys', 'audit_logs'
  ],
  sales: [
    'sales_portal', 'builder', 'payments', 'vault', 'work_log', 'performance'
  ],
  marketing: [
    'dashboard', 'page_builder', 'destinations', 'packages', 'itinerary_builder', 
    'activities', 'reviews', 'faqs', 'media', 'seo', 'coupons', 'content'
  ],
  finance: [
    'dashboard', 'revenue', 'payments', 'coupons', 'reports', 'audit_logs'
  ]
};

// Which sidebar items each role can see in the admin portal
export const ADMIN_SIDEBAR_ITEMS: Record<TeamRole, string[]> = {
  admin: [
    'dashboard', 'attendance', 'page_builder', 'destinations', 'packages', 'itinerary_builder', 
    'hotels', 'cabs', 'activities', 'reviews', 'faqs', 'media', 'inquiries', 
    'bookings', 'reservations', 'disruptions', 'payments', 'coupons', 
    'seo', 'reports', 'users', 'portal_keys', 'audit_logs', 'settings', 'revenue', 'content', 'planner'
  ],
  operations: ['dashboard', 'attendance', 'disruptions', 'inquiries', 'reservations', 'bookings', 'hotels', 'cabs', 'portal_keys', 'audit_logs'],
  sales: [],
  marketing: ['dashboard', 'page_builder', 'destinations', 'packages', 'itinerary_builder', 'activities', 'reviews', 'faqs', 'media', 'seo', 'coupons'],
  finance: ['dashboard', 'revenue', 'payments', 'coupons', 'reports', 'audit_logs'],
};

// Available sales agents for assignment
export const SALES_AGENTS = [
  { code: 'SALES001', name: 'Executive 001' },
  { code: 'SALES002', name: 'Executive 002' },
  { code: 'SALES003', name: 'Executive 003' },
];

// Role display names
export const ROLE_LABELS: Record<TeamRole, string> = {
  admin: 'Director',
  operations: 'Ops Manager',
  sales: 'Sales Executive',
  marketing: 'Marketing Lead',
  finance: 'Finance Director',
};

// Role colors for badges
export const ROLE_COLORS: Record<TeamRole, string> = {
  admin: 'bg-kashmir-gold text-black',
  operations: 'bg-blue-500/20 text-blue-400',
  sales: 'bg-emerald-500/20 text-emerald-400',
  marketing: 'bg-purple-500/20 text-purple-400',
  finance: 'bg-cyan-500/20 text-cyan-400',
};

interface TeamAuthContextType {
  teamUser: TeamUser | null;
  isTeamAuthenticated: boolean;
  isTeamLoading: boolean;
  systemEvents: SystemEvent[];
  eventCounter: number;
  connectionStatus: 'connected' | 'reconnecting' | 'disconnected';
  latencyMs: number | null;
  onlineStaffCodes: string[];
  staffPresenceMap: Record<string, StaffPresenceState>;
  subscribeSalesEvent: (handler: SalesEventHandler) => () => void;
  acknowledgeNotification: (notificationId: string) => void;
  acknowledgeAllNotifications: () => void;
  emitPresence: (status: 'ONLINE' | 'ON_BREAK' | 'BUSY' | 'OFFLINE') => void;
  teamLogin: (code: string) => Promise<{ success: boolean; error?: string }>;
  teamSendOtp: (code: string, phone?: string) => Promise<{ success: boolean; simulated?: boolean; otp?: string; phone?: string; error?: string }>;
  teamVerifyOtp: (code: string, otp: string) => Promise<{ success: boolean; error?: string }>;
  teamLogout: () => void;
  updateTeamProfile: (data: Record<string, unknown>) => Promise<{ success: boolean; error?: string }>;
  hasPermission: (permission: string) => boolean;
  canAccessAdmin: boolean;
  canAccessSales: boolean;
}

const TeamAuthContext = createContext<TeamAuthContextType | undefined>(undefined);

function detectRole(code: string): TeamRole | null {
  const upper = code.toUpperCase();
  if (upper.startsWith('ADMIN')) return 'admin';
  if (upper.startsWith('OPS')) return 'operations';
  if (upper.startsWith('SALES') || upper.startsWith('KC')) return 'sales';
  if (upper.startsWith('MKT')) return 'marketing';
  if (upper.startsWith('FIN')) return 'finance';
  return null;
}

function generateName(code: string, role: TeamRole): string {
  const suffix = code.slice(-3);
  switch (role) {
    case 'admin': return `Director ${suffix}`;
    case 'operations': return `Ops Manager ${suffix}`;
    case 'sales': return `Executive ${suffix}`;
    case 'marketing': return `Marketing Lead ${suffix}`;
    case 'finance': return `Finance Director ${suffix}`;
    default: return `Officer ${suffix}`;
  }
}

export function TeamAuthProvider({ children }: { children: ReactNode }) {
  const [teamUser, setTeamUser] = useState<TeamUser | null>(null);
  const [isTeamLoading, setIsTeamLoading] = useState(true);
  const [systemEvents, setSystemEvents] = useState<SystemEvent[]>([]);
  const [eventCounter, setEventCounter] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'reconnecting' | 'disconnected'>('disconnected');
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [staffPresenceMap, setStaffPresenceMap] = useState<Record<string, StaffPresenceState>>({});

  const socketRef = useRef<Socket | null>(null);
  const listenersRef = useRef<Set<SalesEventHandler>>(new Set());

  const subscribeSalesEvent = useCallback((handler: SalesEventHandler) => {
    listenersRef.current.add(handler);
    return () => {
      listenersRef.current.delete(handler);
    };
  }, []);

  const acknowledgeNotification = useCallback((notificationId: string) => {
    if (socketRef.current?.connected && notificationId) {
      socketRef.current.emit('notification:ack', { notificationId });
    }
  }, []);

  const acknowledgeAllNotifications = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('notification:ack', { markAll: true });
    }
  }, []);

  const emitPresence = useCallback((status: 'ONLINE' | 'ON_BREAK' | 'BUSY' | 'OFFLINE') => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('sales:presence', { isOnline: status === 'ONLINE' });
    }
  }, []);

  // Stable Socket.IO connection tied to authenticated team member code/role (survives profile refreshes & reconnects)
  const userKey = teamUser ? `${teamUser.code}:${teamUser.role}:${teamUser.organizationId || 'default'}` : '';
  const userOrgId = teamUser?.organizationId || null;

  useEffect(() => {
    if (!userKey || isSearchBot) {
      setConnectionStatus('disconnected');
      setLatencyMs(null);
      return;
    }

    setConnectionStatus('reconnecting');

    const newSocket = io(SOCKET_URL, {
      ...DEFAULT_SOCKET_OPTIONS,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 15000,
    });
    socketRef.current = newSocket;

    const sendHeartbeat = () => {
      if (!newSocket.connected) return;
      const sentAt = Date.now();
      newSocket.emit('heartbeat:ping', sentAt, (res?: { clientTs?: number }) => {
        if (res && typeof res.clientTs === 'number') {
          setLatencyMs(Math.max(1, Date.now() - res.clientTs));
        }
      });
    };

    const joinChannels = () => {
      setConnectionStatus('connected');
      newSocket.emit('join-admin');
      newSocket.emit('join-sales', (res?: { presence?: Array<{ employeeCode?: string; userId?: string; name?: string; role?: string; lastSeenAt?: string }> }) => {
        if (Array.isArray(res?.presence)) {
          const nextMap: Record<string, StaffPresenceState> = {};
          res.presence.forEach((p) => {
            const c = p.employeeCode || p.userId;
            if (c) {
              nextMap[String(c)] = {
                code: String(c),
                name: p.name,
                role: p.role,
                status: 'ONLINE',
                lastSeenAt: p.lastSeenAt,
              };
            }
          });
          setStaffPresenceMap((prev) => ({ ...prev, ...nextMap }));
        }
      });
      if (userOrgId) {
        newSocket.emit('join-tenant', userOrgId);
      }
      newSocket.emit('sales:presence', { isOnline: true });
      sendHeartbeat();
    };

    newSocket.on('connect', joinChannels);
    newSocket.io.on('reconnect_attempt', () => setConnectionStatus('reconnecting'));
    newSocket.on('disconnect', () => setConnectionStatus('disconnected'));
    newSocket.on('connect_error', () => setConnectionStatus('reconnecting'));
    newSocket.on('heartbeat:pong', (res?: { clientTs?: number }) => {
      if (res && typeof res.clientTs === 'number') {
        setLatencyMs(Math.max(1, Date.now() - res.clientTs));
      }
    });

    const handleRealtimeEvent = (eventName: string, data?: SalesEventPayload) => {
      setEventCounter((c) => c + 1);

      if (eventName === 'new-system-event' && data) {
        const event: SystemEvent = {
          type: String(data.type || 'UPDATE'),
          message: String(data.message || ''),
          booking: data.booking,
          notification: data.notification,
          timestamp: data.timestamp || new Date().toISOString()
        };
        setSystemEvents((prev) => [event, ...prev].slice(0, 50));

        if (data.message) {
          toast.info(data.message, {
            description: 'Live Sales Command update received.',
            icon: '⚡'
          });
        }
      }

      if (eventName === 'EMPLOYEE_STATUS_CHANGED' || eventName === 'employee-attendance-updated' || eventName === 'employee-presence-refresh') {
        const code = data?.employeeCode || data?.code;
        if (code) {
          const derivedStatus =
            data?.status || (data?.isOnline === false ? 'OFFLINE' : data?.isOnline === true ? 'ONLINE' : 'ONLINE');
          setStaffPresenceMap((prev) => ({
            ...prev,
            [String(code)]: {
              code: String(code),
              name: data?.employeeName || data?.name || prev[String(code)]?.name,
              role: data?.role || prev[String(code)]?.role,
              status: derivedStatus,
              lastSeenAt: data?.timestamp || new Date().toISOString(),
            },
          }));
        }
      }

      listenersRef.current.forEach((handler) => {
        try {
          handler(eventName, data);
        } catch {
          // Isolate listener errors
        }
      });
    };

    REALTIME_EVENTS.forEach((evt) => {
      newSocket.on(evt, (payload?: SalesEventPayload) => handleRealtimeEvent(evt, payload));
    });

    const hbTimer = window.setInterval(sendHeartbeat, 20000);

    return () => {
      window.clearInterval(hbTimer);
      newSocket.disconnect();
      if (socketRef.current === newSocket) {
        socketRef.current = null;
      }
      setConnectionStatus('disconnected');
    };
  }, [userKey, userOrgId]);

  // Restore session on mount
  useEffect(() => {
    const stored = localStorage.getItem('team_user');
    if (stored) {
      try {
        setTeamUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem('team_user');
      }
    }
    setIsTeamLoading(false);
  }, []);

  const teamLogin = async (code: string): Promise<{ success: boolean; error?: string }> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      const response = await fetch(`${SOCKET_URL}/api/auth/team-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Login failed' };
      }

      const { user, token } = await response.json();
      
      setTeamUser(user);
      localStorage.setItem('team_user', JSON.stringify(user));
      localStorage.setItem('teamToken', token);
      
      return { success: true };
    } catch (error: unknown) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        return { success: false, error: 'Login request timed out. Please try again.' };
      }
      return { success: false, error: 'Network error. Is the server running?' };
    }
  };

  const teamSendOtp = async (code: string, phone?: string): Promise<{ success: boolean; simulated?: boolean; otp?: string; phone?: string; error?: string }> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      const response = await fetch(`${SOCKET_URL}/api/auth/team-send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, phone }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to send OTP' };
      }

      return {
        success: true,
        simulated: data.simulated,
        otp: data.otp,
        phone: data.phone
      };
    } catch (error: unknown) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        return { success: false, error: 'OTP request timed out. Please check your network connection.' };
      }
      return { success: false, error: 'Network error sending OTP. Is the server running?' };
    }
  };

  const teamVerifyOtp = async (code: string, otp: string): Promise<{ success: boolean; error?: string }> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      const response = await fetch(`${SOCKET_URL}/api/auth/team-verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, otp }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Verification failed' };
      }

      const { user, token } = await response.json();
      
      setTeamUser(user);
      localStorage.setItem('team_user', JSON.stringify(user));
      localStorage.setItem('teamToken', token);
      
      return { success: true };
    } catch (error: unknown) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        return { success: false, error: 'Verification request timed out. Please try again.' };
      }
      return { success: false, error: 'Network error verifying OTP.' };
    }
  };

  const teamLogout = () => {
    if (socketRef.current) {
      socketRef.current.emit('sales:presence', { isOnline: false });
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setTeamUser(null);
    setConnectionStatus('disconnected');
    setLatencyMs(null);
    localStorage.removeItem('team_user');
    localStorage.removeItem('sales_user');
    localStorage.removeItem('teamToken');
  };

  const updateTeamProfile = async (data: Record<string, unknown>): Promise<{ success: boolean; error?: string }> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      const token = localStorage.getItem('teamToken');
      const response = await fetch(`${SOCKET_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(data),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const resData = await response.json();
      if (!response.ok) {
        return { success: false, error: resData.error || 'Failed to update profile' };
      }

      setTeamUser(resData.user);
      localStorage.setItem('team_user', JSON.stringify(resData.user));
      return { success: true };
    } catch (error: unknown) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        return { success: false, error: 'Profile update timed out. Please try again.' };
      }
      return { success: false, error: 'Network error updating profile.' };
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!teamUser) return false;
    const roleKey = String(teamUser.role || '').toLowerCase() as TeamRole;
    return (ROLE_PERMISSIONS[roleKey] || []).includes(permission);
  };

  const canAccessAdmin = teamUser
    ? ['admin', 'operations', 'marketing'].includes(teamUser.role)
    : false;

  const canAccessSales = teamUser
    ? teamUser.role === 'sales' || teamUser.role === 'admin'
    : false;

  const onlineStaffCodes = Object.values(staffPresenceMap)
    .filter((s) => s.status === 'ONLINE' || s.status === 'ON_BREAK')
    .map((s) => s.code);

  return (
    <TeamAuthContext.Provider value={{
      teamUser,
      isTeamAuthenticated: !!teamUser,
      isTeamLoading,
      systemEvents,
      eventCounter,
      connectionStatus,
      latencyMs,
      onlineStaffCodes,
      staffPresenceMap,
      subscribeSalesEvent,
      acknowledgeNotification,
      acknowledgeAllNotifications,
      emitPresence,
      teamLogin,
      teamSendOtp,
      teamVerifyOtp,
      teamLogout,
      updateTeamProfile,
      hasPermission,
      canAccessAdmin,
      canAccessSales,
    }}>
      {children}
    </TeamAuthContext.Provider>
  );
}

export function useTeamAuth() {
  const context = useContext(TeamAuthContext);
  if (context === undefined) {
    throw new Error('useTeamAuth must be used within a TeamAuthProvider');
  }
  return context;
}
