import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  CalendarCheck2, 
  BedDouble, 
  SlidersHorizontal, 
  Receipt, 
  RefreshCw,
  Send,
  Plus,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  KeyRound,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { io } from 'socket.io-client';
import { useAuth } from '@/contexts/AuthContext';
import { useTeamAuth } from '@/contexts/TeamAuthContext';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { API_BASE_URL, SOCKET_URL, DEFAULT_SOCKET_OPTIONS } from '@/lib/api';

import HospitalitySidebar, { HospitalityTab } from '../components/HospitalitySidebar';
import { UnifiedOperationsWorkspace } from '../components/UnifiedOperationsWorkspace';
import HotelReceptionPortal from '../components/HotelReceptionPortal';
import HospitalityAuthGate, { HospitalitySession } from '../components/HospitalityAuthGate';
import BookingDispatchDesk from '../components/BookingDispatchDesk';
import HotelDirectoryManager from '../components/HotelDirectoryManager';
import AccommodationManager from '../components/AccommodationManager';
import SeasonalTariffManager from '../components/SeasonalTariffManager';
import SettlementLedgerView from '../components/SettlementLedgerView';
import HospitalityPayoutModal from '../components/HospitalityPayoutModal';
import { EmployeeAttendanceDesk } from '../components/EmployeeAttendanceDesk';
import NotificationBell from '@/components/admin/NotificationBell';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

interface HotelItem {
  id: string;
  name: string;
  location: string;
  starRating?: number;
}

export const HospitalityDashboard: React.FC = () => {
  const { user, token } = useAuth();
  const { teamUser } = useTeamAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Check if an external hotel partner is accessing via direct reservation link
  const queryToken = searchParams.get('token');
  const queryId = searchParams.get('id');
  const isExternalPartnerView = Boolean(queryToken || queryId);

  const initialTab = (searchParams.get('tab') as HospitalityTab) || (isExternalPartnerView ? 'reception' : 'overview');
  const [activeTab, setActiveTab] = useState<HospitalityTab>(initialTab);
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);

  // Hospitality Desk Access Key Session State
  const [session, setSession] = useState<HospitalitySession | null>(() => {
    try {
      const saved = localStorage.getItem('hospitality_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const canBypass = 
    teamUser?.role === 'admin' || 
    teamUser?.role === 'operations' || 
    user?.role === 'admin';

  const isUnlocked = isExternalPartnerView || canBypass || !!session;

  const handleSignOutDesk = () => {
    localStorage.removeItem('hospitality_session');
    localStorage.removeItem('hospitality_token');
    setSession(null);
    toast.info('Hospitality Desk session closed. Portal locked.');
  };

  // Property list & Selected Property
  const [hotelsList, setHotelsList] = useState<HotelItem[]>([]);
  const [selectedHotelId, setSelectedHotelId] = useState<string>('ALL');

  // Fetch properties list from backend
  const fetchHotels = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/hotels`);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        setHotelsList(list);
      }
    } catch (err) {
      console.error('Failed to load hotels list:', err);
    }
  };

  useEffect(() => {
    fetchHotels();
  }, []);

  useEffect(() => {
    // Setup real-time websocket synchronization
    const socket = io(SOCKET_URL, DEFAULT_SOCKET_OPTIONS);
    socket.on('connect', () => {
      if (user?.id) socket.emit('join-user', user.id);
      socket.emit('join-room', 'admin-room');
    });

    socket.on('new-system-event', (data: any) => {
      if (data.type === 'CREATE' || data.type === 'UPDATE' || data.type === 'DELETE') {
        toast.info(data.message || 'Hotel event received', { icon: '🏨' });
        fetchHotels();
      }
    });

    socket.on('booking-updated', (data: any) => {
      toast.info('Guest Booking Event', {
        description: `${data.booking?.itemName || 'Hotel'} status: ${data.booking?.status}`,
        icon: '🏨'
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [user?.id, token]);

  const currentHotel = hotelsList.find(h => h.id === selectedHotelId);

  // -------------------------------------------------------------
  // EXTERNAL HOTEL PARTNER VIEW (Dedicated, Secure, Zero Data Leak)
  // -------------------------------------------------------------
  if (isExternalPartnerView) {
    return (
      <div className="min-h-screen bg-background flex flex-col selection:bg-amber-500 selection:text-black">
        <Navbar />

        <div className="flex-1 pt-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full py-8 space-y-6">
          {/* Top Bar for External Reception Partner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/70 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Kashmir Curators Hotel Partner Network
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight mt-1">
                Hotel Reception Confirmation Portal
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Official external partner desk to verify room availability, confirm reservations, assign hotel CRS numbers, or offer alternatives.
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/hospitality?tab=overview')}
              className="text-xs border-amber-500/30 text-amber-500 hover:text-amber-400 hover:bg-amber-500/10 self-start sm:self-auto gap-1.5 rounded-xl font-bold"
            >
              <span>Employee Operations Desk</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>

          <HotelReceptionPortal 
            selectedHotelId="ALL" 
            onSwitchProperty={setSelectedHotelId}
            isExternalPartnerMode={true}
          />
        </div>

        <Footer />
      </div>
    );
  }

  // -------------------------------------------------------------
  // INTERNAL EMPLOYEE OPERATIONS DASHBOARD (Unified Workspace)
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-amber-500 selection:text-black">
      <Navbar />

      {!isUnlocked ? (
        <div className="flex-1 pt-20">
          <HospitalityAuthGate onAuthenticated={(sess) => setSession(sess)} />
        </div>
      ) : (
        <div className="flex-1 flex flex-col lg:flex-row pt-20">
          {/* Dedicated Hospitality Sidebar */}
          <HospitalitySidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            propertyName={selectedHotelId === 'ALL' ? 'All Kashmir Portfolio' : (currentHotel?.name || 'Kashmir Hotel Directory')}
            propertyType={selectedHotelId === 'ALL' ? 'Kashmir DMC Network' : (currentHotel?.location || 'Jammu & Kashmir')}
            isVerified={true}
          />

          {/* Main Workspace */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
            {/* Top Bar with Property Selector and Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Kashmir Curators Hotel Network & Dispatch Desk
                  </span>
                </div>
                <h1 className="text-2xl font-black text-foreground tracking-tight mt-1">
                  {activeTab === 'overview' && 'Unified Hotel Operations & Reservation Dashboard'}
                  {activeTab === 'reception' && 'Hotel Reception Confirmation Portal (Live Front Desk)'}
                  {activeTab === 'dispatch' && 'Live Hotel Booking & Voucher Dispatch Desk'}
                  {activeTab === 'attendance' && 'Employee Operations, Working Hours & Live Presence'}
                  {activeTab === 'hotels' && 'Partner Hotels & Houseboats (Directory & CRUD)'}
                  {activeTab === 'accommodations' && 'Accommodations & Live Inventory Matrix'}
                  {activeTab === 'tariffs' && 'Seasonal Tariffs & Contract Multipliers'}
                  {activeTab === 'settlement' && 'Settlement Ledger & Supplier Bank Dues'}
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {hotelsList.length > 0 && (
                  <div className="flex items-center gap-1.5 bg-card border border-border/80 rounded-2xl px-2 py-1 shadow-sm">
                    <Building2 className="w-4 h-4 text-amber-500 shrink-0" />
                    <Select value={selectedHotelId} onValueChange={(val) => setSelectedHotelId(val)}>
                      <SelectTrigger className="h-8 border-0 bg-transparent text-xs font-bold w-48 sm:w-64 focus:ring-0">
                        <SelectValue placeholder="Select Property..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL" className="text-xs font-bold text-amber-500">
                          🌟 All Kashmir Properties (Full Portfolio)
                        </SelectItem>
                        {hotelsList.map((h) => (
                          <SelectItem key={h.id} value={h.id} className="text-xs font-semibold">
                            {h.name} ({h.location.split(',')[0]})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Active Officer Session Chip */}
                {session && (
                  <div className="flex items-center gap-2 bg-card border border-border/80 rounded-2xl px-3 py-1 text-xs shadow-sm">
                    <div className="flex items-center gap-1.5 text-foreground font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="truncate max-w-[120px]">{session.assignedName}</span>
                      <Badge variant="outline" className="font-mono text-[10px] text-amber-500 border-amber-500/30">
                        {session.accessKey}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSignOutDesk}
                      className="h-6 px-2 text-[10px] text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-lg ml-1 font-bold"
                    >
                      Lock Desk
                    </Button>
                  </div>
                )}

                {/* Live In-App Notification Center */}
                <div className="flex items-center">
                  <NotificationBell />
                </div>

                {/* Superadmin Quick Link to Keys Generator */}
                {canBypass && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/admin?section=portal_keys')}
                    className="h-8 px-3 text-xs text-amber-500 border-amber-500/30 hover:bg-amber-500/10 rounded-2xl gap-1.5 font-bold shadow-sm"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Manage Portal Keys</span>
                  </Button>
                )}
              </div>
            </div>

            {/* TAB 0: UNIFIED OPERATIONS DASHBOARD (OVERVIEW) */}
            {activeTab === 'overview' && (
              <div className="space-y-6 animate-fade-in">
                <UnifiedOperationsWorkspace
                  selectedHotelId={selectedHotelId}
                  onSelectHotel={setSelectedHotelId}
                  onOpenReceptionDesk={() => {
                    setSelectedHotelId('ALL');
                    setActiveTab('reception');
                  }}
                />
              </div>
            )}

            {/* TAB 1: HOTEL RECEPTION CONFIRMATION PORTAL */}
            {activeTab === 'reception' && (
              <div className="space-y-6 animate-fade-in">
                <HotelReceptionPortal 
                  selectedHotelId={selectedHotelId} 
                  onSwitchProperty={setSelectedHotelId}
                  isExternalPartnerMode={false}
                />
              </div>
            )}

            {/* TAB 2: SEND BOOKING & VOUCHERS */}
            {activeTab === 'dispatch' && (
              <div className="space-y-6 animate-fade-in">
                <BookingDispatchDesk initialHotelId={selectedHotelId} />
              </div>
            )}

            {/* TAB 3: EMPLOYEE ATTENDANCE & LIVE RADAR */}
            {activeTab === 'attendance' && (
              <div className="space-y-6 animate-fade-in">
                <EmployeeAttendanceDesk />
              </div>
            )}

            {/* TAB 4: HOTELS & HOUSEBOATS CRUD DIRECTORY */}
            {activeTab === 'hotels' && (
              <div className="space-y-6 animate-fade-in">
                <HotelDirectoryManager 
                  onSelectHotelToManage={(id) => {
                    setSelectedHotelId(id);
                    setActiveTab('accommodations');
                  }}
                  onSendBookingForHotel={(id) => {
                    setSelectedHotelId(id);
                    setActiveTab('dispatch');
                  }}
                />
              </div>
            )}

            {/* TAB 5: ACCOMMODATIONS & ROOM INVENTORY */}
            {activeTab === 'accommodations' && (
              <div className="space-y-6 animate-fade-in">
                <AccommodationManager 
                  selectedHotelId={selectedHotelId}
                  onHotelChange={setSelectedHotelId}
                  onSendBooking={(id) => {
                    setSelectedHotelId(id);
                    setActiveTab('dispatch');
                  }}
                />
              </div>
            )}

            {/* TAB 6: SEASONAL TARIFFS */}
            {activeTab === 'tariffs' && (
              <div className="space-y-6 animate-fade-in">
                <SeasonalTariffManager selectedHotelId={selectedHotelId} />
              </div>
            )}

            {/* TAB 7: SETTLEMENT & BANK DUES */}
            {activeTab === 'settlement' && (
              <div className="space-y-6 animate-fade-in">
                <SettlementLedgerView 
                  selectedHotelId={selectedHotelId}
                  onOpenPayoutModal={() => setPayoutModalOpen(true)} 
                />
              </div>
            )}
          </main>
        </div>
      )}

      <HospitalityPayoutModal
        isOpen={payoutModalOpen}
        onClose={() => setPayoutModalOpen(false)}
      />

      <Footer />
    </div>
  );
};

export default HospitalityDashboard;

