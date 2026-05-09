import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';

const SOCKET_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:5000'
  : 'https://kashmir-curators-api.onrender.com';

export type TeamRole = 'admin' | 'operations' | 'sales' | 'marketing';

export interface TeamUser {
  code: string;
  name: string;
  role: TeamRole;
  loginTime: string;
}

export interface SystemEvent {
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  message: string;
  booking?: any;
  timestamp: string;
}

// Permission map: what each role can access
const ROLE_PERMISSIONS: Record<TeamRole, string[]> = {
  admin: [
    'dashboard', 'inquiries', 'packages', 'hotels', 'cabs',
    'reviews', 'faqs', 'media', 'content', 'assign_leads',
    'view_financials', 'sales_portal'
  ],
  operations: [
    'dashboard', 'inquiries', 'assign_leads'
  ],
  sales: [
    'sales_portal', 'builder', 'payments', 'vault', 'work_log', 'performance'
  ],
  marketing: [
    'dashboard', 'reviews', 'media', 'content'
  ],
};

// Which sidebar items each role can see in the admin portal
export const ADMIN_SIDEBAR_ITEMS: Record<TeamRole, string[]> = {
  admin: ['dashboard', 'inquiries', 'packages', 'hotels', 'cabs', 'reviews', 'faqs', 'media', 'content'],
  operations: ['dashboard', 'inquiries'],
  sales: [],
  marketing: ['dashboard', 'reviews', 'media', 'content'],
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
};

// Role colors for badges
export const ROLE_COLORS: Record<TeamRole, string> = {
  admin: 'bg-kashmir-gold text-black',
  operations: 'bg-blue-500/20 text-blue-400',
  sales: 'bg-emerald-500/20 text-emerald-400',
  marketing: 'bg-purple-500/20 text-purple-400',
};

interface TeamAuthContextType {
  teamUser: TeamUser | null;
  isTeamAuthenticated: boolean;
  isTeamLoading: boolean;
  systemEvents: SystemEvent[];
  teamLogin: (code: string) => Promise<{ success: boolean; error?: string }>;
  teamLogout: () => void;
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
  return null;
}

function generateName(code: string, role: TeamRole): string {
  const suffix = code.slice(-3);
  switch (role) {
    case 'admin': return `Director ${suffix}`;
    case 'operations': return `Ops Manager ${suffix}`;
    case 'sales': return `Executive ${suffix}`;
    case 'marketing': return `Marketing Lead ${suffix}`;
  }
}

export function TeamAuthProvider({ children }: { children: ReactNode }) {
  const [teamUser, setTeamUser] = useState<TeamUser | null>(null);
  const [isTeamLoading, setIsTeamLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [systemEvents, setSystemEvents] = useState<SystemEvent[]>([]);

  // Initialize socket when team user changes
  useEffect(() => {
    if (teamUser && !socket) {
      const newSocket = io(SOCKET_URL);
      setSocket(newSocket);

      newSocket.on('connect', () => {
        console.log('Team connected to Admin WebSocket');
        newSocket.emit('join-admin');
      });

      newSocket.on('new-system-event', (data) => {
        const event: SystemEvent = {
          ...data,
          timestamp: new Date().toISOString()
        };
        setSystemEvents(prev => [event, ...prev].slice(0, 50));
        
        toast.info(event.message, {
          description: "System intelligence update received.",
          icon: '📊'
        });
      });

      return () => {
        newSocket.disconnect();
        setSocket(null);
      };
    }
  }, [teamUser]);

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
    try {
      const response = await fetch(`${SOCKET_URL}/api/auth/team-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Login failed' };
      }

      const { user, token } = await response.json();
      
      setTeamUser(user);
      localStorage.setItem('team_user', JSON.stringify(user));
      localStorage.setItem('teamToken', token);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Network error. Is the server running?' };
    }
  };

  const teamLogout = () => {
    setTeamUser(null);
    if (socket) socket.disconnect();
    localStorage.removeItem('team_user');
    localStorage.removeItem('sales_user');
    localStorage.removeItem('teamToken');
  };

  const hasPermission = (permission: string): boolean => {
    if (!teamUser) return false;
    return ROLE_PERMISSIONS[teamUser.role].includes(permission);
  };

  const canAccessAdmin = teamUser
    ? ['admin', 'operations', 'marketing'].includes(teamUser.role)
    : false;

  const canAccessSales = teamUser
    ? teamUser.role === 'sales' || teamUser.role === 'admin'
    : false;

  return (
    <TeamAuthContext.Provider value={{
      teamUser,
      isTeamAuthenticated: !!teamUser,
      isTeamLoading,
      systemEvents,
      teamLogin,
      teamLogout,
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
