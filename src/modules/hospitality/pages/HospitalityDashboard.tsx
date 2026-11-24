import React, { useState, useEffect, useCallback } from 'react';
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
  ExternalLink,
  LogOut,
  Command as CommandIcon,
  Search,
  Wifi,
  Sparkles,
  Layers,
  UserCheck,
  LayoutDashboard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  CommandDialog, 
  CommandInput, 
  CommandList, 
  CommandEmpty, 
  CommandGroup, 
  CommandItem, 
  CommandSeparator,
  CommandShortcut 
} from '@/components/ui/command';
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
  const { user, token, logout } = useAuth();
  const { teamUser, teamLogout } = useTeamAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Check if an external hotel partner is accessing via direct reservation link
  const queryToken = searchParams.get('token');
  const queryId = searchParams.get('id');
  const isExternalPartnerView = Boolean(queryToken || queryId);

  const initialTab = (searchParams.get('tab') as HospitalityTab) || (isExternalPartnerView ? 'reception' : 'overview');
  const [activeTab, setActiveTab] = useState<HospitalityTab>(initialTab);
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);

  // Collapsible sidebar state (persisted)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hospitality_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleSidebarCollapse = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('hospitality_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  // Sync tab changes with URL search params without page reload
  const handleTabChange = useCallback((newTab: HospitalityTab) => {
    setActiveTab(newTab);
    const params = new URLSearchParams(window.location.search);
    params.set('tab', newTab);
    setSearchParams(params, { replace: true });
  }, [setSearchParams]);

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

  const handleComprehensiveLogout = () => {
    localStorage.removeItem('hospitality_session');
    localStorage.removeItem('hospitality_token');
    setSession(null);
    if (teamLogout) teamLogout();
    if (logout) logout();
    toast.success('Signed out of Hospitality Desk successfully.');
    navigate('/login');
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

  // Keyboard Shortcuts: Cmd+K / Ctrl+K & Alt+1..8 Tab Hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle Command Palette with Cmd+K / Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(open => !open);
        return;
      }

      // Fast tab switching with Alt+1..8
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        const keyMap: Record<string, HospitalityTab> = {
          '1': 'overview',
          '2': 'reception',
          '3': 'dispatch',
          '4': 'attendance',
          '5': 'hotels',
          '6': 'accommodations',
          '7': 'tariffs',
          '8': 'settlement',
        };

        if (keyMap[e.key]) {
          e.preventDefault();
          handleTabChange(keyMap[e.key]);
          toast.info(`Switched to: ${keyMap[e.key].toUpperCase()}`, { duration: 1500 });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTabChange]);

  useEffect(() => {
    // Setup real-time websocket synchronization
    const socket = io(SOCKET_URL, DEFAULT_SOCKET_OPTIONS);

    socket.on('connect', () => {
      setSocketConnected(true);
      if (user?.id) socket.emit('join-user', user.id);
      socket.emit('join-room', 'admin-room');
      const orgId = (user as any)?.organizationId || (user as any)?.organization?.id;
      if (orgId) socket.emit('join-tenant', orgId);
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
    });

    socket.on('hotel-crs-inquiry', (data: any) => {
      toast.info('Direct Hotel CRS Inquiry Received!', {
        description: data.message || 'New reservation or rate inquiry.',
        icon: '🛎️'
      });
      fetchHotels();
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
          {/* Dedicated Collapsible Hospitality Sidebar */}
          <HospitalitySidebar
            activeTab={activeTab}
            onTabChange={handleTabChange}
            propertyName={selectedHotelId === 'ALL' ? 'All Kashmir Portfolio' : (currentHotel?.name || 'Kashmir Hotel Directory')}
            propertyType={selectedHotelId === 'ALL' ? 'Kashmir DMC Network' : (currentHotel?.location || 'Jammu & Kashmir')}
            isVerified={true}
            onOpenCommandPalette={() => setCommandPaletteOpen(true)}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={handleToggleSidebarCollapse}
          />

          {/* Main Workspace */}
          <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-[1700px] w-full mx-auto space-y-6 min-w-0 pb-24 lg:pb-8">
            {/* Top Operations Header Bar (Ultra-Modern Glassmorphic Surface) */}
            <div className="bg-card/75 border border-border/80 rounded-3xl p-4 sm:p-5 shadow-sm space-y-4 backdrop-blur-md">
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                
                {/* Left: Live Indicator & Page Title */}
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] tracking-wider uppercase">
                      <span className={`w-1.5 h-1.5 rounded-full ${socketConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                      {socketConnected ? 'Live Real-Time CRS' : 'Live Ops Desk'}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      Kashmir Curators Hotel Network • 24/7 Dispatch Matrix
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
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

                {/* Right: Operational Controls Group */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 w-full xl:w-auto justify-start xl:justify-end">
                  {/* Global Command Palette Trigger */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCommandPaletteOpen(true)}
                    className="h-9 px-3 bg-background/80 border-border/80 hover:border-amber-500/50 hover:bg-amber-500/10 rounded-2xl gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-all shadow-xs"
                    title="Open Command Palette (⌘K)"
                  >
                    <Search className="w-3.5 h-3.5 text-amber-500" />
                    <span className="hidden sm:inline">Search / Jump</span>
                    <kbd className="hidden md:inline px-1.5 py-0.2 rounded bg-muted border border-border text-[9px] font-mono">
                      ⌘K
                    </kbd>
                  </Button>

                  {/* Property Selector */}
                  {hotelsList.length > 0 && (
                    <div className="flex items-center gap-1.5 bg-background/90 border border-border/80 rounded-2xl px-2.5 py-1 shadow-sm hover:border-amber-500/40 transition-colors">
                      <Building2 className="w-4 h-4 text-amber-500 shrink-0" />
                      <Select value={selectedHotelId} onValueChange={(val) => setSelectedHotelId(val)}>
                        <SelectTrigger className="h-8 border-0 bg-transparent text-xs font-bold w-44 sm:w-56 focus:ring-0 p-0 text-foreground">
                          <SelectValue placeholder="Select Property..." />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border text-foreground">
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
                    <div className="flex items-center gap-2 bg-background/90 border border-border/80 rounded-2xl px-3 py-1 text-xs shadow-sm">
                      <div className="flex items-center gap-1.5 text-foreground font-bold">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="truncate max-w-[110px]">{session.assignedName}</span>
                        <Badge variant="outline" className="font-mono text-[9px] text-amber-500 border-amber-500/30 px-1 py-0">
                          {session.accessKey}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSignOutDesk}
                        className="h-6 px-1.5 text-[10px] text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-lg ml-0.5 font-bold"
                        title="Lock Desk Session"
                      >
                        Lock
                      </Button>
                    </div>
                  )}

                  {/* Live Notification Bell */}
                  <NotificationBell />

                  {/* Superadmin Quick Link to Keys Generator */}
                  {canBypass && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/admin?section=portal_keys')}
                      className="h-10 px-3 text-xs text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/10 rounded-2xl gap-1.5 font-bold shadow-sm"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Keys</span>
                    </Button>
                  )}

                  {/* Modern Logout Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleComprehensiveLogout}
                    className="h-10 px-3.5 text-xs text-rose-500 border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-600 rounded-2xl gap-1.5 font-bold shadow-sm transition-all"
                    title="Sign Out of Hospitality Operations"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Logout</span>
                  </Button>
                </div>

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
                    handleTabChange('reception');
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
                    handleTabChange('accommodations');
                  }}
                  onSendBookingForHotel={(id) => {
                    setSelectedHotelId(id);
                    handleTabChange('dispatch');
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
                    handleTabChange('dispatch');
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

      {/* Futuristic Command Palette Dialog (Cmd+K / Ctrl+K) */}
      <CommandDialog open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen}>
        <CommandInput placeholder="Type a command, hotel name, or operation..." />
        <CommandList>
          <CommandEmpty>No matching operations found.</CommandEmpty>
          
          <CommandGroup heading="Operations Desks">
            <CommandItem
              onSelect={() => {
                handleTabChange('overview');
                setCommandPaletteOpen(false);
              }}
              className="gap-2 cursor-pointer"
            >
              <LayoutDashboard className="w-4 h-4 text-amber-500" />
              <span>Operations Dashboard (Cockpit & Reservations)</span>
              <CommandShortcut>Alt+1</CommandShortcut>
            </CommandItem>

            <CommandItem
              onSelect={() => {
                handleTabChange('reception');
                setCommandPaletteOpen(false);
              }}
              className="gap-2 cursor-pointer"
            >
              <Building2 className="w-4 h-4 text-amber-500" />
              <span>Hotel Reception Confirmation Portal (Live Desk)</span>
              <CommandShortcut>Alt+2</CommandShortcut>
            </CommandItem>

            <CommandItem
              onSelect={() => {
                handleTabChange('dispatch');
                setCommandPaletteOpen(false);
              }}
              className="gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4 text-amber-500" />
              <span>Send Booking & Vouchers (Dispatch Desk)</span>
              <CommandShortcut>Alt+3</CommandShortcut>
            </CommandItem>

            <CommandItem
              onSelect={() => {
                handleTabChange('attendance');
                setCommandPaletteOpen(false);
              }}
              className="gap-2 cursor-pointer"
            >
              <UserCheck className="w-4 h-4 text-amber-500" />
              <span>Employee Attendance & Presence Radar</span>
              <CommandShortcut>Alt+4</CommandShortcut>
            </CommandItem>

            <CommandItem
              onSelect={() => {
                handleTabChange('hotels');
                setCommandPaletteOpen(false);
              }}
              className="gap-2 cursor-pointer"
            >
              <Layers className="w-4 h-4 text-amber-500" />
              <span>Hotels & Houseboats Directory (CRUD)</span>
              <CommandShortcut>Alt+5</CommandShortcut>
            </CommandItem>

            <CommandItem
              onSelect={() => {
                handleTabChange('accommodations');
                setCommandPaletteOpen(false);
              }}
              className="gap-2 cursor-pointer"
            >
              <BedDouble className="w-4 h-4 text-amber-500" />
              <span>Accommodations & Live Room Inventory</span>
              <CommandShortcut>Alt+6</CommandShortcut>
            </CommandItem>

            <CommandItem
              onSelect={() => {
                handleTabChange('tariffs');
                setCommandPaletteOpen(false);
              }}
              className="gap-2 cursor-pointer"
            >
              <SlidersHorizontal className="w-4 h-4 text-amber-500" />
              <span>Seasonal Tariffs & Rates Matrix</span>
              <CommandShortcut>Alt+7</CommandShortcut>
            </CommandItem>

            <CommandItem
              onSelect={() => {
                handleTabChange('settlement');
                setCommandPaletteOpen(false);
              }}
              className="gap-2 cursor-pointer"
            >
              <Receipt className="w-4 h-4 text-amber-500" />
              <span>Settlement Ledger & Supplier Bank Dues</span>
              <CommandShortcut>Alt+8</CommandShortcut>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Kashmir Partner Hotels">
            <CommandItem
              onSelect={() => {
                setSelectedHotelId('ALL');
                setCommandPaletteOpen(false);
                toast.success('Viewing All Kashmir Properties');
              }}
              className="gap-2 cursor-pointer font-bold text-amber-500"
            >
              <Building2 className="w-4 h-4" />
              <span>🌟 All Kashmir Properties (Full Network)</span>
            </CommandItem>
            {hotelsList.map((h) => (
              <CommandItem
                key={h.id}
                onSelect={() => {
                  setSelectedHotelId(h.id);
                  setCommandPaletteOpen(false);
                  toast.success(`Switched focus to: ${h.name}`);
                }}
                className="gap-2 cursor-pointer"
              >
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <span className="truncate">{h.name}</span>
                <span className="text-[10px] text-muted-foreground font-mono ml-auto">
                  {h.location.split(',')[0]}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      <HospitalityPayoutModal
        isOpen={payoutModalOpen}
        onClose={() => setPayoutModalOpen(false)}
      />

      <Footer />
    </div>
  );
};

export default HospitalityDashboard;
