import React, { useState, useEffect } from 'react';
import { 
  Car, 
  MapPin, 
  Calendar, 
  ShieldCheck, 
  DollarSign, 
  TrendingUp, 
  Star, 
  AlertTriangle,
  RefreshCw,
  Clock,
  Compass,
  PhoneCall,
  CheckCircle2,
  Snowflake
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { io } from 'socket.io-client';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE_URL, SOCKET_URL, DEFAULT_SOCKET_OPTIONS } from '@/lib/api';

import DriverHeader, { DriverDutyStatus } from '../components/DriverHeader';
import ActivePassengerCard, { ActiveTrip } from '../components/ActivePassengerCard';
import VehicleComplianceVault from '../components/VehicleComplianceVault';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const SAMPLE_INITIAL_TRIP: ActiveTrip = {
  id: 'trip-908',
  passengerName: 'Anand & Sunita Verma',
  passengerPhone: '+91 98111 22334',
  travelerCount: 2,
  luggageCount: 3,
  pickupLocation: 'Srinagar Airport (Arrival Terminal Gate 2)',
  dropLocation: 'The Highland Chalet, Gulmarg Gondola Road',
  flightNumber: '6E-502',
  flightStatus: 'Landed at 10:25 AM',
  eta: '11:45 AM',
  securityCode: 'KC-77',
  status: 'ASSIGNED'
};

export const DriverDashboard: React.FC = () => {
  const { user, token } = useAuth();
  const [dutyStatus, setDutyStatus] = useState<DriverDutyStatus>('AVAILABLE');
  const [activeTrip, setActiveTrip] = useState<ActiveTrip | null>(SAMPLE_INITIAL_TRIP);
  const [activeTab, setActiveTab] = useState<'cockpit' | 'earnings' | 'compliance'>('cockpit');

  const [stats, setStats] = useState({
    todayEarnings: 4200,
    tripsCompleted: 148,
    rating: 4.9,
    tipsReceived: 650
  });

  useEffect(() => {
    // Setup real-time driver channel
    const socket = io(SOCKET_URL, DEFAULT_SOCKET_OPTIONS);

    socket.on('connect', () => {
      if (user?.id) socket.emit('join-user', user.id);
    });

    socket.on('driver-trip-dispatched', (data: any) => {
      toast.success('New Trip Assignment Dispatched!', {
        description: `Pickup: ${data.pickupLocation} for ${data.passengerName}`,
        icon: '🚖'
      });
      setActiveTrip(data);
      setDutyStatus('ON_TRIP');
    });

    socket.on('disruption-alert', (data: any) => {
      toast.warning('Highway / Weather Advisory Update', {
        description: data.message || 'Snow chains required beyond Tangmarg.',
        icon: '❄️'
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [user?.id]);

  const handleToggleDutyStatus = (status: DriverDutyStatus) => {
    setDutyStatus(status);
    if (status === 'AVAILABLE') {
      toast.success('You are now Online & Available for trip dispatches.');
    } else if (status === 'OFFLINE') {
      toast.info('You are now Offline. No new trips will be sent.');
    }
  };

  const handleUpdateTripStatus = (newStatus: ActiveTrip['status']) => {
    if (!activeTrip) return;
    
    if (newStatus === 'COMPLETED') {
      toast.success(`Trip Completed! ₹2,800 added to your today's ledger.`, { icon: '🎉' });
      setStats(prev => ({
        ...prev,
        todayEarnings: prev.todayEarnings + 2800,
        tripsCompleted: prev.tripsCompleted + 1
      }));
      setActiveTrip(null);
      setDutyStatus('AVAILABLE');
    } else {
      setActiveTrip({ ...activeTrip, status: newStatus });
      toast.info(`Trip status updated: ${newStatus.replace(/_/g, ' ')}`);
    }
  };

  const handleTriggerSos = () => {
    toast.error('EMERGENCY SOS DISPATCHED', {
      description: 'Your GPS coordinates and alert broadcasted to 24/7 Kashmir Control Center and Traffic Police.',
      duration: 10000
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      {/* Driver Cockpit Header */}
      <DriverHeader
        driverName={user?.name || 'Tariq Ahmad Dar'}
        driverCode="DRV-SXR-8942"
        vehicleRegNo="JK-01-AJ-8899"
        vehicleType="Toyota Innova Crysta (4x4 Snow Chains)"
        rating={stats.rating}
        dutyStatus={dutyStatus}
        policeVerification="Verified"
        onToggleStatus={handleToggleDutyStatus}
        onTriggerSos={handleTriggerSos}
      />

      <main className="flex-1 p-4 sm:p-6 max-w-4xl mx-auto w-full space-y-5">
        {/* Real-time Highway / Weather Alert Banner */}
        <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Snowflake className="w-4 h-4 text-blue-500 shrink-0" />
            <span className="font-semibold text-foreground">
              Gulmarg Highway Advisory: Snow chains mandatory above Tangmarg Checkpost.
            </span>
          </div>
          <Badge className="bg-blue-500/20 text-blue-600 dark:text-blue-400 border-none shrink-0 font-bold">
            Live
          </Badge>
        </div>

        {/* View Switcher Tabs (Cockpit / Earnings / Compliance) */}
        <div className="grid grid-cols-3 gap-2 bg-muted/40 p-1 rounded-2xl border border-border/50 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('cockpit')}
            className={`py-2 rounded-xl transition-all ${
              activeTab === 'cockpit' ? 'bg-card text-foreground shadow-sm font-bold' : 'text-muted-foreground'
            }`}
          >
            Live Duty Cockpit
          </button>
          <button
            onClick={() => setActiveTab('earnings')}
            className={`py-2 rounded-xl transition-all ${
              activeTab === 'earnings' ? 'bg-card text-foreground shadow-sm font-bold' : 'text-muted-foreground'
            }`}
          >
            Earnings & Rides
          </button>
          <button
            onClick={() => setActiveTab('compliance')}
            className={`py-2 rounded-xl transition-all ${
              activeTab === 'compliance' ? 'bg-card text-foreground shadow-sm font-bold' : 'text-muted-foreground'
            }`}
          >
            Vehicle Docs
          </button>
        </div>

        {/* TAB 1: COCKPIT */}
        {activeTab === 'cockpit' && (
          <div className="space-y-4">
            <ActivePassengerCard
              trip={activeTrip}
              onUpdateTripStatus={handleUpdateTripStatus}
            />

            {!activeTrip && (
              <div className="text-center pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setActiveTrip(SAMPLE_INITIAL_TRIP);
                    setDutyStatus('ON_TRIP');
                    toast.success('Airport Pickup Dispatch Received!', {
                      description: 'Flight 6E-502 from Delhi landed at Srinagar Airport.',
                      icon: '✈️'
                    });
                  }}
                  className="rounded-xl text-xs font-semibold border-primary/30 text-primary hover:bg-primary/10"
                >
                  Simulate Incoming Airport Dispatch (Test Mode)
                </Button>
              </div>
            )}

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card className="rounded-2xl border border-border/70 p-3 bg-card">
                <span className="text-[11px] text-muted-foreground font-medium">Today's Earnings</span>
                <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                  ₹{stats.todayEarnings.toLocaleString('en-IN')}
                </p>
              </Card>

              <Card className="rounded-2xl border border-border/70 p-3 bg-card">
                <span className="text-[11px] text-muted-foreground font-medium">Completed Tours</span>
                <p className="text-xl font-black text-foreground mt-0.5">
                  {stats.tripsCompleted}
                </p>
              </Card>

              <Card className="rounded-2xl border border-border/70 p-3 bg-card">
                <span className="text-[11px] text-muted-foreground font-medium">Driver Rating</span>
                <p className="text-xl font-black text-amber-500 mt-0.5 flex items-center gap-1">
                  <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                  {stats.rating}
                </p>
              </Card>

              <Card className="rounded-2xl border border-border/70 p-3 bg-card">
                <span className="text-[11px] text-muted-foreground font-medium">Guest Tips</span>
                <p className="text-xl font-black text-primary mt-0.5">
                  ₹{stats.tipsReceived}
                </p>
              </Card>
            </div>
          </div>
        )}

        {/* TAB 2: EARNINGS & RIDES */}
        {activeTab === 'earnings' && (
          <div className="space-y-4">
            <Card className="rounded-3xl border border-border/70 p-5 bg-card space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-muted-foreground font-semibold">Total Net Balance</span>
                  <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                    ₹{(stats.todayEarnings + 24500).toLocaleString('en-IN')}
                  </p>
                </div>
                <Button 
                  onClick={() => toast.success('Instant UPI Payout initiated to J&K Bank!')}
                  className="rounded-xl text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Withdraw to UPI
                </Button>
              </div>

              <div className="pt-3 border-t border-border/50 space-y-2">
                <span className="text-xs font-bold text-foreground">Recent Completed Trips</span>
                
                <div className="p-3 bg-muted/30 rounded-2xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-foreground">Srinagar Airport &rarr; Dal Lake Houseboat</span>
                    <p className="text-muted-foreground text-[11px]">Today, 08:30 AM • Innova Crysta</p>
                  </div>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">+₹1,400</span>
                </div>

                <div className="p-3 bg-muted/30 rounded-2xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-foreground">Srinagar &rarr; Gulmarg Full Day Excursion</span>
                    <p className="text-muted-foreground text-[11px]">Yesterday • Innova Crysta + Snow Chains</p>
                  </div>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">+₹2,800</span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* TAB 3: VEHICLE & COMPLIANCE */}
        {activeTab === 'compliance' && (
          <VehicleComplianceVault
            licenseNumber="JK-01-2016-0038491"
            vehicleRegNo="JK-01-AJ-8899"
            licenseExpiry="2028-09-30"
            policeVerification="Verified"
            experienceYears={8}
          />
        )}
      </main>

      <Footer />
    </div>
  );
};

export default DriverDashboard;
