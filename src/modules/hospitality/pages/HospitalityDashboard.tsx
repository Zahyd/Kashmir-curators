import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  CalendarCheck2, 
  BedDouble, 
  Flame, 
  TrendingUp, 
  DollarSign, 
  RefreshCw,
  Users,
  Award,
  Sparkles,
  Zap,
  PhoneCall,
  Calendar,
  Wrench,
  Receipt,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Droplet,
  Fuel,
  Car
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { io } from 'socket.io-client';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE_URL, SOCKET_URL, DEFAULT_SOCKET_OPTIONS } from '@/lib/api';

import HospitalitySidebar, { HospitalityTab } from '../components/HospitalitySidebar';
import LiveOccupancyGrid from '../components/LiveOccupancyGrid';
import ReservationApprovalDesk from '../components/ReservationApprovalDesk';
import ReservationCalendar from '../components/ReservationCalendar';
import HousekeepingBoard from '../components/HousekeepingBoard';
import MaintenanceDesk from '../components/MaintenanceDesk';
import WinterOpsCockpit from '../components/WinterOpsCockpit';
import SettlementLedgerView from '../components/SettlementLedgerView';
import SeasonalTariffManager from '../components/SeasonalTariffManager';
import HospitalityPayoutModal from '../components/HospitalityPayoutModal';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export const HospitalityDashboard: React.FC = () => {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState<HospitalityTab>('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);

  // Authoritative database-driven KPI state
  const [metrics, setMetrics] = useState<any>({
    hotel: { name: 'Chinar Heritage Estate & Houseboats', location: 'Nigeen Lake, Srinagar' },
    totalRooms: 12,
    availableRooms: 6,
    occupiedRooms: 5,
    reservedRooms: 1,
    maintenanceRooms: 0,
    occupancyRate: 75,
    todayCheckIns: 3,
    todayCheckOuts: 2,
    pendingConfirmations: 2,
    revenueToday: 54500,
    monthlyRevenue: 980000,
    monthlyNetPayable: 812000,
    outstandingSettlement: 184500,
    housekeeping: { clean: 8, dirty: 3, inspected: 1 },
    winterOps: {
      bukhariStatus: 'OPERATIONAL',
      firewoodStockDays: 14,
      generatorStatus: 'STANDBY',
      generatorFuelPct: 90,
      gridPowerStatus: 'LIVE',
      boilerHotWater: 'ACTIVE',
      snowRoadClearance: 'CLEAR',
      shikaraGhatStatus: 'OPEN'
    },
    alertsCount: 3
  });

  const fetchDashboardKPIs = async () => {
    try {
      setIsLoading(true);
      const authToken = token || localStorage.getItem('auth_token') || '';
      const res = await fetch(`${API_BASE_URL}/hotels/operations/dashboard`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      }
    } catch (err) {
      console.error('Failed to load dashboard KPIs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardKPIs();

    // Setup real-time websocket synchronization
    const socket = io(SOCKET_URL, DEFAULT_SOCKET_OPTIONS);
    socket.on('connect', () => {
      if (user?.id) socket.emit('join-user', user.id);
      socket.emit('join-room', 'admin-room');
    });

    socket.on('new-system-event', (data: any) => {
      if (data.type === 'GUEST_CHECKED_IN' || data.type === 'GUEST_CHECKED_OUT' || data.type === 'HOUSEKEEPING_TASK_UPDATED') {
        toast.info(data.message || 'Front desk event received', { icon: '🏨' });
        fetchDashboardKPIs();
      }
    });

    socket.on('booking-updated', (data: any) => {
      toast.info('Guest Booking Event', {
        description: `${data.booking?.itemName || 'Suite'} status: ${data.booking?.status}`,
        icon: '🏨'
      });
      fetchDashboardKPIs();
    });

    return () => {
      socket.disconnect();
    };
  }, [user?.id, token]);

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-amber-500 selection:text-black">
      <Navbar />

      <div className="flex-1 flex flex-col lg:flex-row pt-20">
        {/* Dedicated Hospitality Sidebar */}
        <HospitalitySidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          propertyName={metrics.hotel?.name || user?.name || 'Chinar Heritage Estate & Houseboats'}
          propertyType={metrics.hotel?.location || 'Nigeen Lake, Srinagar'}
          isVerified={true}
        />

        {/* Main Workspace */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Top Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Kashmir Curators PMS & Operations
                </span>
              </div>
              <h1 className="text-2xl font-black text-foreground tracking-tight mt-1">
                {activeTab === 'overview' && 'Front Desk Command & Live Occupancy'}
                {activeTab === 'calendar' && 'Room Rack & Reservation Calendar'}
                {activeTab === 'reservations' && 'Guest Reservations & Voucher Approvals'}
                {activeTab === 'inventory' && 'Physical Suites & Room Categories'}
                {activeTab === 'housekeeping' && 'Housekeeping & Turnover Readiness'}
                {activeTab === 'maintenance' && 'Maintenance Tickets & Room Blocking'}
                {activeTab === 'tariffs' && 'Seasonal Tariffs & Meal Plan Add-ons'}
                {activeTab === 'amenities' && 'Heating, Power & Winter Road Ops'}
                {activeTab === 'payouts' && 'Settlement Ledger & Bank Payouts'}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchDashboardKPIs}
                disabled={isLoading}
                className="rounded-xl text-xs gap-1.5 h-9"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Sync KPIs</span>
              </Button>
            </div>
          </div>

          {/* TAB 1: FRONT DESK OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in">
              {/* 4 Primary Operational KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="rounded-3xl border border-border/70 p-5 bg-card">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">Live Occupancy</span>
                    <Badge variant="outline" className="text-[10px] font-bold border-emerald-500/30 text-emerald-600">
                      {metrics.availableRooms} Available
                    </Badge>
                  </div>
                  <p className="text-3xl font-black text-foreground mt-2 font-mono">
                    {metrics.occupancyRate}%
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                    <span>{metrics.occupiedRooms} Occupied</span>
                    <span>•</span>
                    <span>{metrics.totalRooms} Registered Suites</span>
                  </p>
                </Card>

                <Card className="rounded-3xl border border-border/70 p-5 bg-card">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">Today's Front Desk</span>
                    <Badge className="bg-blue-600 text-white text-[10px] font-bold">
                      In-House
                    </Badge>
                  </div>
                  <div className="flex items-baseline gap-3 mt-2">
                    <p className="text-3xl font-black text-foreground font-mono">
                      {metrics.todayCheckIns}
                    </p>
                    <span className="text-xs font-bold text-muted-foreground">Arrivals</span>
                    <span className="text-xs text-muted-foreground">/</span>
                    <p className="text-xl font-black text-muted-foreground font-mono">
                      {metrics.todayCheckOuts}
                    </p>
                    <span className="text-xs text-muted-foreground">Departures</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">Check-in due & room keys staged</p>
                </Card>

                <Card className="rounded-3xl border border-amber-500/40 p-5 bg-amber-500/5 dark:bg-amber-500/10">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-400">Pending Vouchers</span>
                    <Clock className="w-4 h-4 text-amber-500" />
                  </div>
                  <p className="text-3xl font-black text-amber-600 dark:text-amber-400 mt-2 font-mono">
                    {metrics.pendingConfirmations}
                  </p>
                  <button 
                    onClick={() => setActiveTab('reservations')}
                    className="text-[11px] text-primary hover:underline font-bold mt-1 flex items-center gap-1"
                  >
                    <span>Confirm reservation requests</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </Card>

                <Card className="rounded-3xl border border-emerald-500/30 p-5 bg-emerald-500/5 dark:bg-emerald-500/10">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Outstanding Settlement</span>
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-2">
                    ₹{(metrics.outstandingSettlement || 0).toLocaleString('en-IN')}
                  </p>
                  <button
                    onClick={() => setActiveTab('payouts')}
                    className="text-[11px] text-emerald-700 dark:text-emerald-400 hover:underline font-bold mt-1 block"
                  >
                    Scheduled weekly NEFT payout &rarr;
                  </button>
                </Card>
              </div>

              {/* Operations Highlights: Housekeeping + Winter Telemetry */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Housekeeping Readiness */}
                <Card className="p-6 rounded-3xl border border-border bg-card space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-500" />
                      <span>Housekeeping & Room Readiness</span>
                    </h4>
                    <button
                      onClick={() => setActiveTab('housekeeping')}
                      className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline"
                    >
                      Open Task Board &rarr;
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                      <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 block">Clean</span>
                      <p className="text-xl font-black font-mono text-emerald-600 mt-0.5">{metrics.housekeeping?.clean || 0}</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                      <span className="text-[10px] uppercase font-bold text-rose-700 dark:text-rose-400 block">Needs Clean</span>
                      <p className="text-xl font-black font-mono text-rose-600 mt-0.5">{metrics.housekeeping?.dirty || 0}</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                      <span className="text-[10px] uppercase font-bold text-blue-700 dark:text-blue-400 block">Inspected</span>
                      <p className="text-xl font-black font-mono text-blue-600 mt-0.5">{metrics.housekeeping?.inspected || 0}</p>
                    </div>
                  </div>
                </Card>

                {/* Sub-Zero Heating Readiness */}
                <Card className="p-6 rounded-3xl border border-border bg-card space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                      <Flame className="w-4 h-4 text-amber-500" />
                      <span>Winter Heating & Power Standard</span>
                    </h4>
                    <button
                      onClick={() => setActiveTab('amenities')}
                      className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline"
                    >
                      Telemetry Cockpit &rarr;
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 rounded-2xl bg-muted/40 border border-border/60">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">Bukhari</span>
                      <p className="text-sm font-black text-amber-600 dark:text-amber-400 mt-1">
                        {metrics.winterOps?.bukhariStatus || 'ACTIVE'}
                      </p>
                    </div>
                    <div className="p-3 rounded-2xl bg-muted/40 border border-border/60">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">Generator Fuel</span>
                      <p className="text-sm font-black font-mono text-foreground mt-1">
                        {metrics.winterOps?.generatorFuelPct || 90}%
                      </p>
                    </div>
                    <div className="p-3 rounded-2xl bg-muted/40 border border-border/60">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">Road Access</span>
                      <p className="text-sm font-black text-foreground mt-1 truncate">
                        {metrics.winterOps?.snowRoadClearance || 'CLEAR'}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Physical Room Grid Overview */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg text-foreground">Room & Suite Availability</h3>
                  <button
                    onClick={() => setActiveTab('calendar')}
                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    <span>View Drag-and-Drop Calendar Rack</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <LiveOccupancyGrid />
              </div>

              {/* Quick Reservation Desk */}
              <div className="pt-4 border-t border-border/50">
                <ReservationApprovalDesk />
              </div>
            </div>
          )}

          {/* TAB 2: RESERVATION RACK CALENDAR */}
          {activeTab === 'calendar' && (
            <div className="space-y-6 animate-fade-in">
              <ReservationCalendar onSelectReservation={() => setActiveTab('reservations')} />
            </div>
          )}

          {/* TAB 3: RESERVATIONS & VOUCHERS */}
          {activeTab === 'reservations' && (
            <div className="space-y-6 animate-fade-in">
              <ReservationApprovalDesk />
            </div>
          )}

          {/* TAB 4: ROOM INVENTORY & CATEGORIES */}
          {activeTab === 'inventory' && (
            <div className="space-y-6 animate-fade-in">
              <LiveOccupancyGrid />
            </div>
          )}

          {/* TAB 5: HOUSEKEEPING CMS */}
          {activeTab === 'housekeeping' && (
            <div className="space-y-6 animate-fade-in">
              <HousekeepingBoard />
            </div>
          )}

          {/* TAB 6: MAINTENANCE DESK */}
          {activeTab === 'maintenance' && (
            <div className="space-y-6 animate-fade-in">
              <MaintenanceDesk />
            </div>
          )}

          {/* TAB 7: TARIFFS & MEALS */}
          {activeTab === 'tariffs' && (
            <div className="space-y-6 animate-fade-in">
              <SeasonalTariffManager />
            </div>
          )}

          {/* TAB 8: WINTER HEATING & POWER OPS */}
          {activeTab === 'amenities' && (
            <div className="space-y-6 animate-fade-in">
              <WinterOpsCockpit />
            </div>
          )}

          {/* TAB 9: SETTLEMENT & BANK DUES */}
          {activeTab === 'payouts' && (
            <div className="space-y-6 animate-fade-in">
              <SettlementLedgerView onOpenPayoutModal={() => setPayoutModalOpen(true)} />
            </div>
          )}
        </main>
      </div>

      <HospitalityPayoutModal
        isOpen={payoutModalOpen}
        onClose={() => setPayoutModalOpen(false)}
      />

      <Footer />
    </div>
  );
};

export default HospitalityDashboard;
