import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';
import { io, Socket } from 'socket.io-client';

import { API_BASE_URL, SOCKET_URL } from '@/lib/api';

const API_URL = API_BASE_URL;

interface Booking {
  id: string;
  type: 'package' | 'hotel' | 'cab';
  itemName: string;
  bookingDate: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  totalAmount: number;
  details: Record<string, any>;
  createdAt: string;
}

interface Profile {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
}

interface Inquiry {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  destination: string;
  duration: string;
  travelers: string;
  budget: string;
  accommodation: string;
  status: string;
  assignedTo?: string;
  priority?: string;
  sentiment?: string;
  quoteData?: string;
  proposalUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: Profile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  bookings: Booking[];
  inquiries: Inquiry[];
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  sendOtp: (phone: string) => Promise<{ success: boolean; error?: string }>;
  verifyOtp: (phone: string, otp: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  addBooking: (booking: any) => Promise<void>;
  cancelBooking: (bookingId: string) => Promise<void>;
  refreshBookings: () => Promise<void>;
  refreshInquiries: () => Promise<void>;
  sendSupportRequest: (message: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);

  // Initialize socket when user changes
  useEffect(() => {
    if (user && !socket) {
      const newSocket = io(SOCKET_URL);
      setSocket(newSocket);

      newSocket.on('connect', () => {
        console.log('Connected to WebSocket');
        newSocket.emit('join-user', user.id);
      });

      newSocket.on('booking-updated', (data) => {
        console.log('Real-time booking update received:', data);
        refreshBookings();
        toast.info(`Booking updated: ${data.booking.itemName}`, {
          description: `Status changed to ${data.booking.status}`,
          icon: '🚀'
        });
      });

      newSocket.on('new-system-event', (data) => {
        if (data.booking?.entityType === 'inquiry' && data.booking.email === user.email) {
          console.log('Real-time inquiry update received:', data);
          fetchInquiries(token || localStorage.getItem('auth_token') || '');
          toast.success(`Proposal Status Update`, {
            description: data.message,
            icon: '✨'
          });
        }
      });

      return () => {
        newSocket.disconnect();
        setSocket(null);
      };
    } else if (!user && socket) {
      socket.disconnect();
      setSocket(null);
    }
  }, [user]);

  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token');
    if (savedToken) {
      setToken(savedToken);
      fetchUserProfile(savedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUserProfile = async (authToken: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        fetchBookings(authToken);
        fetchInquiries(authToken);
      } else {
        logout();
      }
    } catch (error) {
      console.error('Failed to fetch profile', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBookings = async (authToken: string) => {
    try {
      const response = await fetch(`${API_URL}/bookings/my`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        setBookings(data);
      }
    } catch (error) {
      console.error('Failed to fetch bookings', error);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      if (response.ok) {
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('auth_token', data.token);
        fetchBookings(data.token);
        fetchInquiries(data.token);
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      
      const data = await response.json();
      if (response.ok) {
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('auth_token', data.token);
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  const sendOtp = async (phone: string) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (phone.length < 10) return { success: false, error: 'Invalid phone' };
    return { success: true };
  };

  const verifyOtp = async (phone: string, otp: string) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (otp !== '123456') return { success: false, error: 'Invalid OTP' };
    
    // Mock user for OTP
    const mockUser = {
      id: 'mock-id-phone',
      name: `User ${phone.slice(-4)}`,
      email: `${phone}@mock.com`,
      role: 'user'
    };
    
    setUser(mockUser);
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setBookings([]);
    setInquiries([]);
    localStorage.removeItem('auth_token');
  };

  const addBooking = async (booking: any) => {
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/bookings`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: booking.booking_type,
          itemName: booking.item_name,
          bookingDate: booking.booking_date,
          totalAmount: booking.total_amount,
          details: booking.details
        })
      });
      
      if (response.ok) {
        fetchBookings(token);
      } else {
        toast.error('Failed to save booking');
      }
    } catch (error) {
      toast.error('Network error saving booking');
    }
  };

  const cancelBooking = async (bookingId: string) => {
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'cancelled' })
      });
      
      if (response.ok) {
        fetchBookings(token);
      } else {
        toast.error('Failed to cancel booking');
      }
    } catch (error) {
      toast.error('Network error cancelling booking');
    }
  };

  const refreshBookings = async () => {
    const currentToken = token || localStorage.getItem('auth_token');
    if (currentToken) fetchBookings(currentToken);
  };

  const fetchInquiries = async (authToken: string) => {
    try {
      const response = await fetch(`${API_URL}/inquiries`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        // Filter by current user email since schema doesn't have userId
        const userEmail = user?.email || (await fetch(`${API_URL}/auth/me`, { headers: { 'Authorization': `Bearer ${authToken}` } }).then(r => r.json())).email;
        setInquiries(data.filter((i: any) => i.email === userEmail));
      }
    } catch (error) {
      console.error('Failed to fetch inquiries', error);
    }
  };

  const refreshInquiries = async () => {
    const currentToken = token || localStorage.getItem('auth_token');
    if (currentToken) fetchInquiries(currentToken);
  };

  const sendSupportRequest = (message: string) => {
    if (socket && user) {
      socket.emit('new-system-event', {
        type: 'SUPPORT',
        message: `Concierge Request from ${user.name}: ${message}`,
        booking: { customerName: user.name, email: user.email, entityType: 'support' }
      });
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: !!user,
      isLoading,
      isAdmin: user?.role === 'admin',
      bookings,
      inquiries,
      login,
      signup,
      sendOtp,
      verifyOtp,
      logout,
      addBooking,
      cancelBooking,
      refreshBookings,
      refreshInquiries,
      sendSupportRequest,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
