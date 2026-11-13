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
  PhoneCall
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
import SeasonalTariffManager from '../components/SeasonalTariffManager';
import HospitalityPayoutModal from '../components/HospitalityPayoutModal';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export const HospitalityDashboard: React.FC = () => {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState<HospitalityTab>('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);

  // Stats
  const [metrics, setMetrics] = useState({
    occupancyPct: 78,
    todayArrivals: 3,
    pendingVouchers: 2,
    monthlyPayoutDues: 184500
  });

  useEffect(() => {
    // Real-time socket connection for incoming reservations
    const socket = io(SOCKET_URL, DEFAULT_SOCKET_OPTIONS);
    
    socket.on('connect', () => {
      if (user?.id) socket.emit('join-user', user.id);
    });

    socket.on('booking-updated', (data: any) => {
      toast.info('New Guest Booking Event Received', {
        description: `${data.booking?.itemName || 'Room'} status: ${data.booking?.status}`,
        icon: '🏨'
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [user?.id]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Dedicated Hospitality Sidebar */}
        <HospitalitySidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          propertyName={user?.name || 'Nigeen Royal Cedar Houseboat & Chalets'}
          propertyType="Heritage Houseboat & Mountain Chalet Host"
          isVerified={true}
        />

        {/* Main Content Workspace */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Top Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Kashmir Hospitality Operations
                </span>
              </div>
              <h1 className="text-2xl font-black text-foreground tracking-tight mt-1">
                {activeTab === 'overview' && 'Front Desk Operations & Occupancy'}
                {activeTab === 'reservations' && 'Guest Booking Vouchers & Arrivals'}
                {activeTab === 'inventory' && 'Suites, Chalets & Room Categories'}
                {activeTab === 'tariffs' && 'Seasonal Rates & Meal Plans'}
                {activeTab === 'amenities' && 'Winter Heating & Power Systems'}
                {activeTab === 'payouts' && 'Bank Settlements & Platform Ledger'}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.success('Front desk synced with live booking engines!')}
                className="rounded-xl text-xs gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Grid</span>
              </Button>
            </div>
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="rounded-3xl border border-border/70 p-5 bg-card">
                  <span className="text-xs font-semibold text-muted-foreground">Live Occupancy</span>
                  <p className="text-3xl font-black text-foreground mt-2">{metrics.occupancyPct}%</p>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> High winter demand
                  </p>
                </Card>

                <Card className="rounded-3xl border border-border/70 p-5 bg-card">
                  <span className="text-xs font-semibold text-muted-foreground">Today's Check-Ins</span>
                  <p className="text-3xl font-black text-foreground mt-2">{metrics.todayArrivals} Guests</p>
                  <p className="text-[11px] text-muted-foreground mt-1">Shikara crossing notified</p>
                </Card>

                <Card className="rounded-3xl border border-border/70 p-5 bg-card">
                  <span className="text-xs font-semibold text-muted-foreground">Pending Voucher Confirmations</span>
                  <p className="text-3xl font-black text-amber-500 mt-2">{metrics.pendingVouchers}</p>
                  <button 
                    onClick={() => setActiveTab('reservations')}
                    className="text-[11px] text-primary hover:underline font-medium mt-1 block"
                  >
                    Review requests &rarr;
                  </button>
                </Card>

                <Card className="rounded-3xl border border-border/70 p-5 bg-card">
                  <span className="text-xs font-semibold text-muted-foreground">Net Payout Accrued</span>
                  <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
                    ₹{metrics.monthlyPayoutDues.toLocaleString('en-IN')}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">Direct NEFT weekly settlement</p>
                </Card>
              </div>

              {/* Live Room Occupancy Grid */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg text-foreground">Room & Suite Availability</h3>
                  <Badge variant="outline" className="text-xs text-emerald-600 dark:text-emerald-400">
                    Live Booking Engine Sync
                  </Badge>
                </div>
                <LiveOccupancyGrid />
              </div>

              {/* Quick Reservation Desk */}
              <div className="pt-4 border-t border-border/50">
                <ReservationApprovalDesk />
              </div>
            </div>
          )}

          {/* TAB 2: RESERVATIONS */}
          {activeTab === 'reservations' && (
            <ReservationApprovalDesk />
          )}

          {/* TAB 3: INVENTORY */}
          {activeTab === 'inventory' && (
            <div className="space-y-6">
              <LiveOccupancyGrid />
            </div>
          )}

          {/* TAB 4: TARIFFS */}
          {activeTab === 'tariffs' && (
            <SeasonalTariffManager />
          )}

          {/* TAB 5: AMENITIES & WINTER HEATING */}
          {activeTab === 'amenities' && (
            <div className="space-y-6">
              <Card className="rounded-3xl border border-border/70 p-6 bg-card space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <Flame className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-foreground">Kashmir Winter Heating & Power Standard</h3>
                    <p className="text-xs text-muted-foreground">
                      Guaranteed heating standards build five-star reviews on Kashmir Connect.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                  <div className="p-4 bg-muted/40 rounded-2xl border border-border/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-foreground">Bukhari Heating</span>
                      <Badge className="bg-emerald-500 text-white text-[10px]">Active</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Kiln-dried pine firewood stocked. 24/7 attendant on call for night heating refuels.
                    </p>
                  </div>

                  <div className="p-4 bg-muted/40 rounded-2xl border border-border/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-foreground">Electric Bed Warmers</span>
                      <Badge className="bg-emerald-500 text-white text-[10px]">Operational</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Dual temperature controller fitted in all Master Suites.
                    </p>
                  </div>

                  <div className="p-4 bg-muted/40 rounded-2xl border border-border/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-foreground">Silent Generator Backup</span>
                      <Badge className="bg-emerald-500 text-white text-[10px]">Full Tank</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Automatic transfer switch ensures zero blackout during winter snowfall.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* TAB 6: SETTLEMENTS */}
          {activeTab === 'payouts' && (
            <Card className="rounded-3xl border border-border/70 p-6 bg-card space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-lg text-foreground">Bank Settlements & Payouts</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Weekly automated direct-to-bank settlement for all completed guest departures.
                  </p>
                </div>
                <Button
                  onClick={() => setPayoutModalOpen(true)}
                  className="rounded-xl text-xs font-bold gap-2 shrink-0"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Configure Bank / UPI Account</span>
                </Button>
              </div>

              <div className="mt-4 p-6 border border-dashed rounded-2xl flex flex-col items-center justify-center text-center space-y-2">
                <Award className="w-10 h-10 text-emerald-500/40" />
                <p className="font-bold text-base text-foreground">
                  ₹{metrics.monthlyPayoutDues.toLocaleString('en-IN')} Scheduled for Friday
                </p>
                <p className="text-xs text-muted-foreground max-w-sm">
                  Beneficiary: Jammu & Kashmir Bank Ltd • Account ending in 8941
                </p>
              </div>
            </Card>
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
