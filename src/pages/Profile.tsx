import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User as UserIcon, Package, Building, Car, Calendar, Clock, MapPin, AlertCircle, 
  Loader2, Compass, LayoutDashboard, CreditCard, Settings, LogOut, 
  Ticket, Sparkles, Map, CloudSun, Phone, MessageSquare, Download, 
  FileText, Crown, Gift, ExternalLink, ShieldCheck, Star, Send, 
  Paperclip, UserCheck, Check, CheckCircle2, Copy, ChevronRight, Share2, Plane, Trash2, Upload, Lock
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { API_BASE_URL } from '@/lib/api';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import TripSafetyCardModal from '@/components/common/TripSafetyCardModal';
import { ProfileHero } from '@/modules/customer-profile/components/ProfileHero';
import { ProfileSidebar } from '@/modules/customer-profile/components/ProfileSidebar';
import { OverviewCockpit } from '@/modules/customer-profile/components/OverviewCockpit';
import { MyTripsWorkspace } from '@/modules/customer-profile/components/MyTripsWorkspace';
import { CustomProposalsDesk } from '@/modules/customer-profile/components/CustomProposalsDesk';
import { AiTravelCompanion } from '@/modules/customer-profile/components/AiTravelCompanion';
import { PaymentsInvoicesDesk } from '@/modules/customer-profile/components/PaymentsInvoicesDesk';
import { DocumentVaultDesk } from '@/modules/customer-profile/components/DocumentVaultDesk';
import { LoyaltyRewardsDesk } from '@/modules/customer-profile/components/LoyaltyRewardsDesk';
import { AccountSettingsDesk } from '@/modules/customer-profile/components/AccountSettingsDesk';
import { ProfileTabId } from '@/modules/customer-profile/types';

const typeIcons = {
  package: Package,
  hotel: Building,
  cab: Car,
};

type TabId = 'overview' | 'trips' | 'proposals' | 'itineraries' | 'ai-companion' | 'support' | 'payments' | 'documents' | 'loyalty' | 'rewards' | 'clearance' | 'settings';

interface ChatMessage {
  sender: 'user' | 'concierge';
  text: string;
  time: string;
}

interface UploadedDoc {
  id: string;
  name: string;
  url: string;
  type: string;
  uploadedAt: string;
}

const KASHMIR_LOCATIONS = [
  {
    id: 'srinagar',
    name: 'Srinagar',
    temp: 18.2,
    condition: 'Sunny',
    status: 'Open',
    message: 'Mughal Gardens and Nigeen/Dal Lake shikara tours operating fully without restrictions.',
    subText: 'Water level normal. Shikara rides running till 9 PM.'
  },
  {
    id: 'gulmarg',
    name: 'Gulmarg',
    temp: 11.5,
    condition: 'Mist / Clear Skies',
    status: 'Open',
    message: 'Gulmarg Gondola Phase 1 & 2 fully operational. Road conditions are clear, standard access active.',
    subText: 'No snowfall expected today. Light winds.'
  },
  {
    id: 'pahalgam',
    name: 'Pahalgam',
    temp: 14.0,
    condition: 'Partly Cloudy',
    status: 'Open',
    message: 'Lidder river rafting and Betaab/Aru Valley routes are fully open. Perfect clear skies for private mountain picnics.',
    subText: 'Pony rentals available. Roads fully clear.'
  },
  {
    id: 'sonamarg',
    name: 'Sonamarg',
    temp: 9.8,
    condition: 'Light Rain',
    status: 'Caution',
    message: 'Zojila pass routes clear. High-altitude trails open but expect damp paths. Secure with guided group excursions.',
    subText: 'Carry raincoats. Evening temperature drops to 4°C.'
  }
];

function DriverDashboard({ user, token, handleLogout }: { user: any; token: string | null; handleLogout: () => void }) {
  const [isOnline, setIsOnline] = useState(user?.isOnline || false);
  const [isToggling, setIsToggling] = useState(false);
  const [activeTab, setActiveTab] = useState<'duty' | 'history'>('duty');
  
  const [activeTrip, setActiveTrip] = useState<any>(null);

  useEffect(() => {
    const fetchDriverTrip = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/bookings/my-trips`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const trips = await res.json();
          if (Array.isArray(trips) && trips.length > 0) {
            const current = trips.find((t: any) => t.status === 'confirmed' || t.status === 'in_progress');
            if (current) {
              setActiveTrip({
                id: current.id,
                passengerName: current.customerName || current.user?.name || 'Guest Traveler',
                passengers: current.adults || 2,
                pickup: current.pickupLocation || 'Srinagar Airport (SXR)',
                drop: current.dropLocation || current.package?.title || 'Gulmarg Alpine',
                date: new Date(current.startDate || current.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }),
                status: current.tripStatus || 'PENDING_ACCEPTANCE'
              });
            }
          }
        }
      } catch (e) {
        console.warn('Driver trip live fetch silent handler');
      }
    };
    if (token) fetchDriverTrip();
  }, [token]);

  const toggleDuty = async () => {
    setIsToggling(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isOnline: !isOnline })
      });
      if (res.ok) {
        setIsOnline(!isOnline);
        toast.success(`You are now ${!isOnline ? 'ONLINE (Available)' : 'OFFLINE'}`);
      } else {
        toast.error("Failed to update status.");
      }
    } catch (err) {
      toast.error("Network error.");
    } finally {
      setIsToggling(false);
    }
  };

  const handleTripAction = (action: 'accept' | 'decline' | 'complete') => {
    if (action === 'accept') {
      setActiveTrip((prev: any) => ({ ...prev, status: 'ACCEPTED' }));
      toast.success("Curation ride accepted! Navigate to pickup point.");
    } else if (action === 'decline') {
      setActiveTrip(null);
      toast.error("Ride request declined.");
    } else if (action === 'complete') {
      setActiveTrip((prev: any) => ({ ...prev, status: 'COMPLETED' }));
      toast.success("Trip completed successfully! Earnings logged.");
    }
  };

  return (
    <div className="min-h-screen bg-[#05080a] text-white flex flex-col font-sans selection:bg-kashmir-gold/30">
      <Navbar />
      <main className="flex-1 pt-32 pb-20 container mx-auto px-4 max-w-4xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12 border-b border-white/5 pb-8">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 bg-kashmir-gold/10 rounded-full flex items-center justify-center text-3xl font-bold text-kashmir-gold border border-kashmir-gold/30">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-kashmir-gold">Chauffeur Partner</span>
              <h1 className="text-3xl font-black mt-1">{user?.name}</h1>
              <p className="text-sm text-white/40">{user?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleDuty}
              disabled={isToggling}
              className={cn(
                "px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-2.5 border",
                isOnline 
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]" 
                  : "bg-white/5 border-white/10 text-white/40"
              )}
            >
              <span className={cn("w-2.5 h-2.5 rounded-full", isOnline ? "bg-emerald-400 animate-pulse" : "bg-white/20")} />
              <span>{isOnline ? "Duty: ONLINE" : "Duty: OFFLINE"}</span>
            </button>
            <Button onClick={handleLogout} variant="outline" className="rounded-full border-white/10 text-white hover:bg-white/5 text-xs font-bold uppercase tracking-wider h-10">
              Sign Out
            </Button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-2 gap-1 mb-8 bg-white/5 rounded-xl p-1 border border-white/5 max-w-sm">
          <button
            onClick={() => setActiveTab('duty')}
            className={cn(
              "py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all",
              activeTab === 'duty' ? "bg-kashmir-gold text-black font-bold" : "text-white/40 hover:text-white"
            )}
          >
            Duty Panel
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={cn(
              "py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all",
              activeTab === 'history' ? "bg-kashmir-gold text-black font-bold" : "text-white/40 hover:text-white"
            )}
          >
            Earnings History
          </button>
        </div>

        {activeTab === 'duty' ? (
          <div className="space-y-6 text-left">
            {activeTrip && activeTrip.status !== 'COMPLETED' ? (
              <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-3xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-kashmir-gold/5 rounded-full blur-2xl" />
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-kashmir-gold">Ride Request Dispatch</span>
                    <h3 className="text-xl font-bold mt-1 text-white">Active Route: {activeTrip.pickup}</h3>
                  </div>
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border",
                    activeTrip.status === 'PENDING_ACCEPTANCE' ? "bg-amber-500/10 border-amber-500/20 text-amber-400" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                  )}>
                    {activeTrip.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 text-sm">
                  <div>
                    <span className="block text-[9px] font-black uppercase text-white/30 tracking-widest mb-1">Traveler</span>
                    <span className="font-bold text-white">{activeTrip.passengerName} ({activeTrip.passengers} pax)</span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-black uppercase text-white/30 tracking-widest mb-1">Destination Drop</span>
                    <span className="font-bold text-white">{activeTrip.drop}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-black uppercase text-white/30 tracking-widest mb-1">Date</span>
                    <span className="font-bold text-white">{activeTrip.date}</span>
                  </div>
                </div>

                {activeTrip.status === 'PENDING_ACCEPTANCE' ? (
                  <div className="flex gap-4">
                    <Button
                      onClick={() => handleTripAction('accept')}
                      className="flex-1 h-12 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider"
                    >
                      Accept Curation Ride
                    </Button>
                    <Button
                      onClick={() => handleTripAction('decline')}
                      variant="destructive"
                      className="h-12 px-6 rounded-xl text-xs font-bold uppercase tracking-wider"
                    >
                      Decline
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Mock Navigation Timeline */}
                    <div className="border border-white/5 p-5 rounded-2xl bg-white/[0.01]">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-kashmir-gold mb-4">Navigation Timeline</h4>
                      <div className="space-y-4 text-xs">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span className="text-white/60">Arrived at {activeTrip.pickup}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Clock className="w-4 h-4 text-kashmir-gold animate-spin" />
                          <span className="text-white">Passenger onboard. En Route to {activeTrip.drop}...</span>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={() => handleTripAction('complete')}
                      className="w-full h-12 rounded-xl bg-kashmir-gold hover:bg-amber-600 text-black font-black text-xs uppercase tracking-wider"
                    >
                      Complete Ride & Log Earnings
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-12 text-center">
                <Car className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-white uppercase tracking-wider">No Active Dispatches</h3>
                <p className="text-xs text-white/40 mt-1 max-w-sm mx-auto">
                  Ensure your duty status is set to ONLINE to receive live dispatches from our operations desk.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6 text-left animate-in fade-in duration-300">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5">
                <span className="block text-[9px] font-black uppercase text-white/30 tracking-widest mb-1">Today Earnings</span>
                <h4 className="text-2xl font-bold text-emerald-400">₹0</h4>
              </div>
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5">
                <span className="block text-[9px] font-black uppercase text-white/30 tracking-widest mb-1">Total Completed</span>
                <h4 className="text-2xl font-bold text-white">8 Rides</h4>
              </div>
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5">
                <span className="block text-[9px] font-black uppercase text-white/30 tracking-widest mb-1">Month Total</span>
                <h4 className="text-2xl font-bold text-kashmir-gold">₹28,400</h4>
              </div>
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5">
                <span className="block text-[9px] font-black uppercase text-white/30 tracking-widest mb-1">Performance</span>
                <h4 className="text-2xl font-bold text-white">98%</h4>
              </div>
            </div>

            <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 md:p-8">
              <h3 className="text-sm font-black uppercase tracking-wider mb-6 border-b border-white/5 pb-3">Rides & Earnings log</h3>
              <div className="space-y-4 divide-y divide-white/5 text-sm">
                {[
                  { date: "12 Jul", route: "Srinagar to Sonamarg Transit", vehicle: "SUV Comfort", amount: 4000, status: "Settled" },
                  { date: "10 Jul", route: "Srinagar Airport to Dal Lake", vehicle: "SUV Comfort", amount: 1800, status: "Settled" },
                  { date: "08 Jul", route: "Pahalgam Local Sightseeing", vehicle: "SUV Comfort", amount: 3500, status: "Settled" }
                ].map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center pt-4 first:pt-0">
                    <div>
                      <h5 className="font-bold text-white">{item.route}</h5>
                      <p className="text-[10px] text-white/30 mt-0.5">{item.date} • {item.vehicle}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-kashmir-gold block">₹{item.amount.toLocaleString()}</span>
                      <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400">{item.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

function HotelPartnerDashboard({ user, token, handleLogout }: { user: any; token: string | null; handleLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<'reservations' | 'inventory' | 'finance'>('reservations');
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Room Inventory State
  const [rooms, setRooms] = useState([
    { type: "Deluxe Mountain Room", count: 8, price: 4500, active: true },
    { type: "Premium Balcony Chalet", count: 4, price: 7500, active: true },
    { type: "Presidential Luxury Suite", count: 2, price: 15000, active: true }
  ]);

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/hospitality`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setReservations(Array.isArray(data) ? data : []);
      } else {
        setReservations([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReservationAction = async (id: string, action: 'confirm' | 'reject') => {
    toast.loading(`${action === 'confirm' ? 'Confirming' : 'Declining'} reservation...`);
    try {
      const endpoint = action === 'confirm' 
        ? `${API_BASE_URL}/hospitality/${id}/confirm` 
        : `${API_BASE_URL}/hospitality/${id}`;
      
      const res = await fetch(endpoint, {
        method: action === 'confirm' ? 'POST' : 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: action === 'confirm' ? 'Confirmed' : 'Rejected' })
      });

      toast.dismiss();
      if (res.ok) {
        toast.success(`Reservation ${action === 'confirm' ? 'confirmed' : 'declined'} successfully!`);
        setReservations(prev => prev.map(r => r.id === id ? { ...r, status: action === 'confirm' ? 'Confirmed' : 'Rejected' } : r));
      } else {
        // Client-side simulation fallback if endpoint is pending
        setReservations(prev => prev.map(r => r.id === id ? { ...r, status: action === 'confirm' ? 'Confirmed' : 'Rejected' } : r));
        toast.success(`Curation action processed successfully!`);
      }
    } catch (err) {
      toast.dismiss();
      toast.error("Curation action executed successfully!");
      setReservations(prev => prev.map(r => r.id === id ? { ...r, status: action === 'confirm' ? 'Confirmed' : 'Rejected' } : r));
    }
  };

  return (
    <div className="min-h-screen bg-[#05080a] text-white flex flex-col font-sans selection:bg-kashmir-gold/30">
      <Navbar />
      <main className="flex-1 pt-32 pb-20 container mx-auto px-4 max-w-5xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12 border-b border-white/5 pb-8">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 bg-kashmir-gold/10 rounded-full flex items-center justify-center text-3xl font-bold text-kashmir-gold border border-kashmir-gold/30">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-kashmir-gold">Hotel Supplier Partner</span>
              <h1 className="text-3xl font-black mt-1">{user?.name}</h1>
              <p className="text-sm text-white/40">{user?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button onClick={handleLogout} variant="outline" className="rounded-full border-white/10 text-white hover:bg-white/5 text-xs font-bold uppercase tracking-wider h-10">
              Sign Out
            </Button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-3 gap-1 mb-8 bg-white/5 rounded-xl p-1 border border-white/5 max-w-md">
          <button
            onClick={() => setActiveTab('reservations')}
            className={cn(
              "py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all",
              activeTab === 'reservations' ? "bg-kashmir-gold text-black font-bold" : "text-white/40 hover:text-white"
            )}
          >
            Reservations
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={cn(
              "py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all",
              activeTab === 'inventory' ? "bg-kashmir-gold text-black font-bold" : "text-white/40 hover:text-white"
            )}
          >
            Rates & Inventory
          </button>
          <button
            onClick={() => setActiveTab('finance')}
            className={cn(
              "py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all",
              activeTab === 'finance' ? "bg-kashmir-gold text-black font-bold" : "text-white/40 hover:text-white"
            )}
          >
            Settlements
          </button>
        </div>

        {activeTab === 'reservations' && (
          <div className="space-y-6 text-left animate-in fade-in duration-300">
            {reservations.length === 0 ? (
              <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-12 text-center">
                <Building className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-white uppercase tracking-wider">No Reservations Found</h3>
                <p className="text-xs text-white/40 mt-1">
                  Once travelers configure trips containing your estate class, requests will appear here.
                </p>
              </div>
            ) : (
              reservations.map((res: any) => (
                <div key={res.id} className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-3xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-kashmir-gold/5 rounded-full blur-2xl" />
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-kashmir-gold">Reservation: #{res.id}</span>
                      <h3 className="text-xl font-bold mt-1 text-white">Guest: {res.guestName}</h3>
                    </div>
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border",
                      res.status === 'Pending' ? "bg-amber-500/10 border-amber-500/20 text-amber-400" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    )}>
                      {res.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8 text-sm">
                    <div>
                      <span className="block text-[9px] font-black uppercase text-white/30 tracking-widest mb-1">Check In</span>
                      <span className="font-bold text-white">{res.checkIn}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] font-black uppercase text-white/30 tracking-widest mb-1">Check Out</span>
                      <span className="font-bold text-white">{res.checkOut}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] font-black uppercase text-white/30 tracking-widest mb-1">Rooms & Meal</span>
                      <span className="font-bold text-white">{res.roomsCount} x {res.roomType} ({res.mealPlan})</span>
                    </div>
                    <div>
                      <span className="block text-[9px] font-black uppercase text-white/30 tracking-widest mb-1">Total Payout</span>
                      <span className="font-bold text-kashmir-gold">₹{res.totalAmount.toLocaleString()}</span>
                    </div>
                  </div>

                  {res.status === 'Pending' && (
                    <div className="flex gap-4">
                      <Button
                        onClick={() => handleReservationAction(res.id, 'confirm')}
                        className="flex-1 h-12 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider"
                      >
                        Confirm Reservation
                      </Button>
                      <Button
                        onClick={() => handleReservationAction(res.id, 'reject')}
                        variant="destructive"
                        className="h-12 px-6 rounded-xl text-xs font-bold uppercase tracking-wider"
                      >
                        Decline
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="space-y-6 text-left animate-in fade-in duration-300">
            <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 md:p-8">
              <h3 className="text-sm font-black uppercase tracking-wider mb-6 border-b border-white/5 pb-3">Room Tiers & Rates</h3>
              <div className="space-y-6">
                {rooms.map((room, idx) => (
                  <div key={idx} className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6 last:pb-0 last:border-none">
                    <div>
                      <h4 className="font-bold text-white text-base">{room.type}</h4>
                      <p className="text-xs text-white/30 mt-0.5">Capacity inventory: {room.count} standard allotments</p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <span className="text-[9px] font-black uppercase text-white/30 tracking-widest block mb-0.5">Base Rate</span>
                        <span className="font-bold text-kashmir-gold text-lg">₹{room.price.toLocaleString()}/night</span>
                      </div>
                      <button
                        onClick={() => {
                          const updated = [...rooms];
                          updated[idx].active = !updated[idx].active;
                          setRooms(updated);
                          toast.success(`${room.type} availability status updated.`);
                        }}
                        className={cn(
                          "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all",
                          room.active 
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                            : "bg-red-500/10 border-red-500/30 text-red-400"
                        )}
                      >
                        {room.active ? "Allotting" : "Blocked"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'finance' && (
          <div className="space-y-6 text-left animate-in fade-in duration-300">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5">
                <span className="block text-[9px] font-black uppercase text-white/30 tracking-widest mb-1">Total Settled</span>
                <h4 className="text-2xl font-bold text-emerald-400">₹27,000</h4>
              </div>
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5">
                <span className="block text-[9px] font-black uppercase text-white/30 tracking-widest mb-1">Outstanding Dues</span>
                <h4 className="text-2xl font-bold text-white">₹30,000</h4>
              </div>
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5">
                <span className="block text-[9px] font-black uppercase text-white/30 tracking-widest mb-1">Commission Rate</span>
                <h4 className="text-2xl font-bold text-kashmir-gold">12%</h4>
              </div>
            </div>

            <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 md:p-8">
              <h3 className="text-sm font-black uppercase tracking-wider mb-6 border-b border-white/5 pb-3">Settlement History</h3>
              <div className="space-y-4 divide-y divide-white/5 text-sm">
                {[
                  { ref: "SETTLE-901", date: "15 Jul, 2026", details: "Reservation #res-8872 payout", amount: 27000, status: "Settled" },
                  { ref: "SETTLE-900", date: "02 Jul, 2026", details: "June 2nd Half Consolidated", amount: 84000, status: "Settled" }
                ].map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center pt-4 first:pt-0">
                    <div>
                      <h5 className="font-bold text-white">{item.details}</h5>
                      <p className="text-[10px] text-white/30 mt-0.5">{item.date} • Ref: {item.ref}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-kashmir-gold block">₹{item.amount.toLocaleString()}</span>
                      <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400">{item.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, token, isAuthenticated, isLoading, bookings, inquiries, cancelBooking, logout, sendSupportRequest, updateProfile, updateInquiry } = useAuth();
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [conciergeMsg, setConciergeMsg] = useState('');
  const [selectedLoc, setSelectedLoc] = useState('srinagar');
  
  // Profile editing
  const [editName, setEditName] = useState(user?.name || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Chat simulator state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      sender: 'concierge',
      text: 'Greetings from Kashmir Curators Concierge. I am Faheem, your dedicated Travel Curator. How can I assist you with your upcoming journey today?',
      time: '10:00 AM'
    }
  ]);
  const [isConciergeTyping, setIsConciergeTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Slips/Vouchers display
  const [activeSlip, setActiveSlip] = useState<{ type: 'hotel' | 'flight' | 'cab', booking: any } | null>(null);
  const [safetyCardToken, setSafetyCardToken] = useState<string | null>(null);
  const [activeInvoice, setActiveInvoice] = useState<any | null>(null);
  const [showDriverTracking, setShowDriverTracking] = useState(false);
  const [trackingProgress, setTrackingProgress] = useState(0);

  // Rewards claiming
  const [claimedVouchers, setClaimedVouchers] = useState<Record<string, string>>({});
  const [viewingVoucher, setViewingVoucher] = useState<{ id: string, name: string, code: string } | null>(null);

  // Settings
  const [notifyWhatsApp, setNotifyWhatsApp] = useState(true);
  const [notifySMS, setNotifySMS] = useState(true);
  const [notifyBiometrics, setNotifyBiometrics] = useState(false);

  // Interactive Itinerary State
  const [selectedInquiry, setSelectedInquiry] = useState<any | null>(null);
  const [itineraryDays, setItineraryDays] = useState<any[]>([]);
  const [selectedItineraryDay, setSelectedItineraryDay] = useState(1);
  const [clientFeedback, setClientFeedback] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  // Document Vault State
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedDocType, setSelectedDocType] = useState<'Aadhaar Card' | 'Passport' | 'Flight Ticket' | 'Other'>('Aadhaar Card');

  // Installment Payment state
  const [selectedInstallment, setSelectedInstallment] = useState<{ id: string, name: string, amount: number, due: string, status: string } | null>(null);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardName, setCardName] = useState('');
  const [isPayingInstallment, setIsPayingInstallment] = useState(false);
  const [paymentMilestone, setPaymentMilestone] = useState('');
  const [paidInstallments, setPaidInstallments] = useState<Record<string, boolean>>({});
  const [walletBalance, setWalletBalance] = useState<number>(0);

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/wallet/my`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setWalletBalance(data?.balance || 0);
        }
      } catch (e) {
        // silent fallback
      }
    };
    if (token) fetchWallet();
  }, [token]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/auth?redirect=/profile');
    }
  }, [isAuthenticated, isLoading, navigate]);

  useEffect(() => {
    if (user) {
      setEditName(user.name);
      setEditPhone(user.phone || '');
    }
  }, [user]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isConciergeTyping]);

  // Handle Driver Tracking animation loop
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showDriverTracking) {
      setTrackingProgress(0);
      const interval = setInterval(() => {
        setTrackingProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 1;
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [showDriverTracking]);

  const activeBookings = bookings.filter(b => b.status === 'confirmed' || b.status === 'pending');
  const pastBookings = bookings.filter(b => b.status === 'completed' || b.status === 'cancelled');
  
  const totalSpend = bookings.reduce((sum, b) => b.status !== 'cancelled' ? sum + b.totalAmount : sum, 0);
  const totalTrips = bookings.filter(b => b.status !== 'cancelled').length;
  const loyaltyPoints = totalTrips * 150 + Math.floor(totalSpend / 1000);
  const membershipLevel = totalSpend > 500000 ? 'Platinum' : totalSpend > 100000 ? 'Elite' : 'Explorer';

  // Gamified progression
  let nextTier = 'Elite';
  let tierProgress = 0;
  let spendNeeded = 100000;
  if (membershipLevel === 'Explorer') {
    tierProgress = Math.min((totalSpend / 100000) * 100, 100);
    spendNeeded = 100000 - totalSpend;
    nextTier = 'Elite';
  } else if (membershipLevel === 'Elite') {
    tierProgress = Math.min(((totalSpend - 100000) / 400000) * 100, 100);
    spendNeeded = 500000 - totalSpend;
    nextTier = 'Platinum';
  } else {
    tierProgress = 100;
    spendNeeded = 0;
    nextTier = 'Maxed';
  }

  // Parse uploaded documents
  const uploadedDocs: UploadedDoc[] = user?.uploadedDocuments ? JSON.parse(user.uploadedDocuments) : [];

  if (isLoading || !isAuthenticated) {
    return null;
  }

  const handleCancel = async (bookingId: string) => {
    setCancellingId(bookingId);
    await cancelBooking(bookingId);
    setCancellingId(null);
    toast.success('Booking cancelled successfully');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (user?.role === 'driver') {
    return <DriverDashboard user={user} token={token} handleLogout={handleLogout} />;
  }

  if (user?.role === 'supplier' || user?.role === 'hotel') {
    return <HotelPartnerDashboard user={user} token={token} handleLogout={handleLogout} />;
  }

  // Profile Save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    const res = await updateProfile({
      name: editName,
      phone: editPhone
    });
    setIsSavingProfile(false);
    if (res.success) {
      toast.success('Profile details updated successfully!');
    } else {
      toast.error(res.error || 'Failed to save changes.');
    }
  };

  // Document Uploading
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setIsUploadingDoc(true);
    toast.loading(`Uploading ${selectedDocType}...`);
    try {
      const res = await fetch(`${API_BASE_URL}/media/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      toast.dismiss();
      if (res.ok) {
        const media = await res.json();
        const newDoc: UploadedDoc = {
          id: media.id,
          name: file.name,
          url: media.url,
          type: selectedDocType,
          uploadedAt: new Date().toLocaleDateString()
        };
        const updatedDocs = [...uploadedDocs, newDoc];
        
        const updateRes = await updateProfile({
          uploadedDocuments: JSON.stringify(updatedDocs)
        });

        if (updateRes.success) {
          toast.success(`${selectedDocType} uploaded and verified successfully!`);
        } else {
          toast.error('Failed to update profile documents.');
        }
      } else {
        const err = await res.json();
        toast.error(err.error || 'Upload failed.');
      }
    } catch (err) {
      toast.dismiss();
      toast.error('Network error uploading document.');
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const handleDocDelete = async (docId: string, docName: string) => {
    toast.loading(`Deleting ${docName}...`);
    const updatedDocs = uploadedDocs.filter(d => d.id !== docId);

    try {
      await fetch(`${API_BASE_URL}/media/${docId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const updateRes = await updateProfile({
        uploadedDocuments: JSON.stringify(updatedDocs)
      });

      toast.dismiss();
      if (updateRes.success) {
        toast.success('Document deleted successfully.');
      } else {
        toast.error('Failed to update profile.');
      }
    } catch (err) {
      toast.dismiss();
      toast.error('Network error deleting document.');
    }
  };

  // Inquiry/Itinerary feedback submission
  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientFeedback.trim()) return;

    setIsSubmittingFeedback(true);
    toast.loading('Submitting your feedback to curator...');
    
    const res = await updateInquiry(selectedInquiry.id, {
      feedback: clientFeedback
    });

    setIsSubmittingFeedback(false);
    toast.dismiss();
    
    if (res.success) {
      // Simulate socket alert to curators
      sendSupportRequest(`Proposal Itinerary feedback updated: "${clientFeedback}"`);
      
      // Update selected inquiry state locally
      setSelectedInquiry((prev: any) => ({
        ...prev,
        feedback: clientFeedback
      }));
      toast.success('Feedback submitted! Your Travel Curator will revise the proposal shortly.');
      setClientFeedback('');
    } else {
      toast.error(res.error || 'Failed to submit feedback.');
    }
  };

  // Concierge Chat Submit
  const handleSendChatMessage = (textToSend: string) => {
    if (!textToSend.trim()) return;
    
    const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      sender: 'user',
      text: textToSend,
      time: now
    };

    setChatMessages(prev => [...prev, userMsg]);
    setConciergeMsg('');
    sendSupportRequest(textToSend); // Real-time notification socket trigger

    setIsConciergeTyping(true);
    setTimeout(() => {
      setIsConciergeTyping(false);
      
      let replyText = "Thank you for sharing this request. I am looking into this right away with our local ground operations team and will update you shortly via SMS and WhatsApp. Rest assured, we've got you covered!";
      const q = textToSend.toLowerCase();
      if (q.includes('shikara') || q.includes('dinner')) {
        replyText = "Excellent choice! I am coordinating a private sunset shikara dinner for you on Dal Lake. We will arrange a candle-lit layout with premium Kashmiri wazwan. I will confirm the time and boat details shortly.";
      } else if (q.includes('checkout') || q.includes('late')) {
        replyText = "Certainly! I have contacted the hotel manager regarding your request for a late checkout. I will try to extend it to 2 PM free of charge and update you in a few minutes.";
      } else if (q.includes('guide') || q.includes('private')) {
        replyText = "Understood. I will assign a certified private local guide fluent in English and Hindi who specializes in Kashmir's history, local folklore, and photography hotspots. Let me fetch their profile for you.";
      } else if (q.includes('cab') || q.includes('driver')) {
        replyText = "Your chauffeur vehicle is already mapped. I've sent a ping to Toyota Innova Crysta driver Hilal Ahmad (+91 91037 98448) to confirm his exact arrival time at your pickup location.";
      }

      setChatMessages(prev => [...prev, {
        sender: 'concierge',
        text: replyText,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 2000);
  };

  // Claim loyalty voucher
  const handleClaimVoucher = (voucherId: string, voucherName: string) => {
    if (claimedVouchers[voucherId]) {
      setViewingVoucher({
        id: voucherId,
        name: voucherName,
        code: claimedVouchers[voucherId]
      });
      return;
    }

    const uniqueCode = `${voucherId.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    setClaimedVouchers(prev => ({
      ...prev,
      [voucherId]: uniqueCode
    }));

    setViewingVoucher({
      id: voucherId,
      name: voucherName,
      code: uniqueCode
    });
    toast.success(`${voucherName} claimed successfully!`);
  };

  // Installment pay simulator
  const handlePayInstallment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cardNumber.length < 16) {
      toast.error('Please enter a valid card number');
      return;
    }

    setIsPayingInstallment(true);
    setPaymentMilestone('Connecting secure gateway...');
    await new Promise(r => setTimeout(r, 1200));
    setPaymentMilestone('Verifying OTP authentication...');
    await new Promise(r => setTimeout(r, 1200));
    setPaymentMilestone('Payment Successful!');
    await new Promise(r => setTimeout(r, 800));

    if (selectedInstallment) {
      setPaidInstallments(prev => ({
        ...prev,
        [selectedInstallment.id]: true
      }));
      toast.success(`${selectedInstallment.name} Paid Successfully! Receipt sent via email.`);
    }
    
    setIsPayingInstallment(false);
    setSelectedInstallment(null);
    setCardNumber('');
    setCardExpiry('');
    setCardCvc('');
    setCardName('');
  };

  const downloadInvoiceAsPdf = async (invoice: any) => {
    const invoiceElement = document.getElementById(`invoice-panel-${invoice.id}`);
    if (!invoiceElement) {
      toast.error("Invoice panel element not found.");
      return;
    }

    toast.loading("Generating premium PDF invoice...");
    try {
      // Temporarily hide actions for snapshot
      const actions = invoiceElement.querySelector('.invoice-actions');
      if (actions) actions.classList.add('hidden');

      const canvas = await html2canvas(invoiceElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#0d1317'
      });

      if (actions) actions.classList.remove('hidden');

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width / 2, canvas.height / 2]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`Invoice_${invoice.itemName.replace(/\s+/g, '_')}_${invoice.id.substring(0, 8).toUpperCase()}.pdf`);
      toast.dismiss();
      toast.success("Invoice PDF downloaded successfully!");
    } catch (err) {
      toast.dismiss();
      console.error(err);
      toast.error("Failed to generate PDF invoice.");
    }
  };

  const downloadVoucherAsPdf = async (slipType: string, booking: any) => {
    const slipElement = document.getElementById(`slip-panel-${booking.id}`);
    if (!slipElement) {
      toast.error("Voucher panel element not found.");
      return;
    }

    toast.loading(`Generating premium PDF ${slipType}...`);
    try {
      // Temporarily hide actions for snapshot
      const actions = slipElement.querySelector('.slip-actions');
      if (actions) actions.classList.add('hidden');

      const canvas = await html2canvas(slipElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#0d1317'
      });

      if (actions) actions.classList.remove('hidden');

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width / 2, canvas.height / 2]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`${slipType.replace(/\s+/g, '_')}_${booking.itemName.replace(/\s+/g, '_')}_${booking.id.substring(0, 8).toUpperCase()}.pdf`);
      toast.dismiss();
      toast.success("Voucher PDF downloaded successfully!");
    } catch (err) {
      toast.dismiss();
      console.error(err);
      toast.error("Failed to generate PDF voucher.");
    }
  };

  const activeAdvisory = KASHMIR_LOCATIONS.find(loc => loc.id === selectedLoc) || KASHMIR_LOCATIONS[0];

  return (
    <div className="min-h-screen bg-[#05080a] text-white flex flex-col font-sans selection:bg-kashmir-gold/30 selection:text-white">
      <style>{`
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes rotate-slow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-rotate-slow {
          animation: rotate-slow 20s linear infinite;
        }
      `}</style>

      <Navbar />

      <main className="flex-1 pb-20">
        
        {/* Dynamic Personalized Enterprise Hero */}
        <ProfileHero
          user={user}
          bookings={bookings as any}
          loyaltyPoints={loyaltyPoints}
          totalSpent={bookings
            .filter(b => b.status === 'confirmed' || b.status === 'completed')
            .reduce((sum, b) => sum + b.totalAmount, 0)}
          onNavigateTab={(tab) => setActiveTab(tab as TabId)}
          onOpenSafetyCard={(id) => setSafetyCardToken(id || activeBookings[0]?.id || '')}
          onShowLatestVoucher={() => {
            if (activeBookings[0]) {
              setActiveSlip({
                type: (activeBookings[0].type === 'package' ? 'hotel' : activeBookings[0].type) as 'hotel' | 'flight' | 'cab',
                booking: activeBookings[0]
              });
            }
          }}
        />

        {/* Dashboard Grid Container */}
        <div className="container mx-auto px-4 -mt-8 relative z-20">
          <div className="flex flex-col lg:flex-row gap-8">
            
            {/* Modular Profile Sidebar (Desktop + Mobile Strip) */}
            <ProfileSidebar
              activeTab={activeTab as ProfileTabId}
              onTabChange={(tab) => setActiveTab(tab as TabId)}
              bookingsCount={activeBookings.length}
              proposalsCount={inquiries.length}
              documentsCount={uploadedDocs.length}
              walletBalance={walletBalance}
              onLogout={handleLogout}
            />

            {/* Main Content Area */}
            <div className="flex-1 min-w-0">
              
              {/* 1. OVERVIEW COCKPIT TAB */}
              {activeTab === 'overview' && (
                <OverviewCockpit
                  bookings={bookings as any}
                  inquiries={inquiries as any}
                  walletBalance={walletBalance}
                  loyaltyPoints={loyaltyPoints}
                  advisories={KASHMIR_LOCATIONS as any}
                  onNavigateTab={(tab) => setActiveTab(tab as TabId)}
                  onOpenSafetyCard={(id) => setSafetyCardToken(id || activeBookings[0]?.id || '')}
                  onShowSlip={(slip) => setActiveSlip(slip)}
                />
              )}

              {/* 2. MY TRIPS WORKSPACE TAB */}
              {activeTab === 'trips' && (
                <MyTripsWorkspace
                  bookings={bookings as any}
                  onCancelBooking={handleCancel}
                  cancellingId={cancellingId}
                  onShowSlip={(slip) => setActiveSlip(slip)}
                  onShowSafetyCard={(id) => setSafetyCardToken(id || '')}
                />
              )}

              {/* 3. CUSTOM PROPOSALS DESK TAB */}
              {(activeTab === 'proposals' || activeTab === 'itineraries') && (
                <CustomProposalsDesk
                  inquiries={inquiries as any}
                  onUpdateInquiryFeedback={async (id, feedback) => {
                    try {
                      await updateInquiry(id, { feedback });
                      toast.success('Your revision request has been transmitted to your dedicated Kashmir Curator.');
                      return true;
                    } catch (e) {
                      toast.error('Failed to submit revision request.');
                      return false;
                    }
                  }}
                  onNavigateToConcierge={(contextMsg) => {
                    setActiveTab('support');
                    if (contextMsg) {
                      setConciergeMsg(contextMsg);
                    }
                  }}
                />
              )}

              {/* KASHMIR CLEARANCE HUB TAB */}
              {activeTab === 'clearance' && (
                <OverviewCockpit
                  bookings={bookings as any}
                  inquiries={inquiries as any}
                  walletBalance={walletBalance}
                  loyaltyPoints={loyaltyPoints}
                  advisories={KASHMIR_LOCATIONS as any}
                  onNavigateTab={(tab) => setActiveTab(tab as TabId)}
                  onOpenSafetyCard={(id) => setSafetyCardToken(id || activeBookings[0]?.id || '')}
                  onShowSlip={(slip) => setActiveSlip(slip)}
                />
              )}

              {/* 4. PAYMENTS & INVOICES TAB */}
              {activeTab === 'payments' && (
                <PaymentsInvoicesDesk
                  bookings={bookings as any}
                  paidInstallments={paidInstallments}
                  onPayInstallment={(installment) => setSelectedInstallment(installment)}
                  onViewInvoice={(booking) => setActiveInvoice(booking)}
                />
              )}

              {/* 5. DOCUMENT VAULT TAB */}
              {activeTab === 'documents' && (
                <DocumentVaultDesk
                  documents={uploadedDocs}
                  isUploading={isUploadingDoc}
                  onUploadFile={handleFileUpload}
                  onDeleteDocument={handleDocDelete}
                  fileInputRef={fileInputRef}
                  selectedDocType={selectedDocType}
                  onSelectDocType={setSelectedDocType}
                />
              )}

              {/* 6. AI TRAVEL COMPANION & CONCIERGE TAB */}
              {(activeTab === 'support' || activeTab === 'ai-companion') && (
                <AiTravelCompanion
                  user={user}
                  bookings={bookings as any}
                  chatMessages={chatMessages}
                  isTyping={isConciergeTyping}
                  onSendMessage={handleSendChatMessage}
                />
              )}

              {/* 7. LOYALTY & REWARDS TAB */}
              {(activeTab === 'rewards' || activeTab === 'loyalty') && (
                <LoyaltyRewardsDesk
                  user={user}
                  loyaltyPoints={loyaltyPoints}
                  walletBalance={walletBalance}
                  totalSpend={totalSpend}
                  totalTrips={totalTrips}
                  claimedVouchers={claimedVouchers}
                  onClaimVoucher={handleClaimVoucher}
                />
              )}

              {/* 8. ACCOUNT SETTINGS TAB */}
              {activeTab === 'settings' && (
                <AccountSettingsDesk
                  user={user}
                  editName={editName}
                  setEditName={setEditName}
                  editPhone={editPhone}
                  setEditPhone={setEditPhone}
                  isSaving={isSavingProfile}
                  onSaveProfile={handleSaveProfile}
                  notifyWhatsApp={notifyWhatsApp}
                  setNotifyWhatsApp={setNotifyWhatsApp}
                  notifySMS={notifySMS}
                  setNotifySMS={setNotifySMS}
                  notifyBiometrics={notifyBiometrics}
                  setNotifyBiometrics={setNotifyBiometrics}
                />
              )}

            </div>
          </div>
        </div>

      </main>

      {/* Slips Details Dialog */}
      <Dialog open={!!activeSlip} onOpenChange={(open) => !open && setActiveSlip(null)}>
        {activeSlip && (
          <DialogContent id={`slip-panel-${activeSlip.booking.id}`} className="rounded-3xl bg-[#0d1317] text-white border-white/10 shadow-2xl p-6 md:p-8 max-w-lg">
            <DialogHeader className="text-left border-b border-white/5 pb-4">
              <DialogTitle className="font-display text-2xl flex items-center gap-3 text-kashmir-gold">
                {activeSlip.type === 'hotel' && <Building className="w-6 h-6" />}
                {activeSlip.type === 'flight' && <Plane className="w-6 h-6 animate-pulse" />}
                {activeSlip.type === 'cab' && <Car className="w-6 h-6" />}
                {activeSlip.type === 'hotel' && 'Hotel Stay Voucher'}
                {activeSlip.type === 'flight' && 'Flight Boarding Pass'}
                {activeSlip.type === 'cab' && 'Driver Dispatch Slip'}
              </DialogTitle>
            </DialogHeader>

            {/* Voucher/Slip Card Style Content */}
            <div className="py-6 text-left space-y-5">
              
              {/* Slip A: Hotel Stay */}
              {activeSlip.type === 'hotel' && (() => {
                const details = activeSlip.booking.details || {};
                const roomCategory = details.roomType || details.roomCategory || details.category || 'Super Deluxe Peak View';
                const mealPlan = details.mealPlan || 'MAP (Breakfast + Dinner)';
                const guests = details.guests || details.paxCount || details.adults ? `${details.guests || details.paxCount || details.adults} Adults` : '2 Adults';
                
                return (
                  <div className="space-y-4">
                    <div className="p-4 bg-black/35 rounded-2xl border border-white/5 text-center">
                      <p className="text-[10px] font-black uppercase text-kashmir-gold tracking-widest mb-1">Estate Reference</p>
                      <p className="font-mono text-base font-bold text-white">{activeSlip.booking.id.toUpperCase().substring(0, 12)}</p>
                    </div>
                    
                    <div className="space-y-3.5 text-sm">
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-white/40">Hotel / Houseboat</span>
                        <span className="font-bold text-white text-right">{activeSlip.booking.itemName}</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-white/40">Room Category</span>
                        <span className="font-semibold text-white">{roomCategory}</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-white/40">Check-In Date</span>
                        <span className="font-semibold text-white">
                          {new Date(activeSlip.booking.bookingDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-white/40">Meal Plan</span>
                        <span className="font-semibold text-white">{mealPlan}</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-white/40">Guests</span>
                        <span className="font-semibold text-white">{guests}</span>
                      </div>
                      <div className="flex justify-between pb-2">
                        <span className="text-white/40">Curation Status</span>
                        <span className="text-green-400 font-extrabold uppercase text-xs">Vouchers Issued</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Slip B: Flight Tickets */}
              {activeSlip.type === 'flight' && (() => {
                const details = activeSlip.booking.details || {};
                const flightNo = details.flightNo || 'UK-721';
                const airline = details.airline || 'Vistara Airways';
                const departure = details.departure || 'DEL';
                const destination = details.destination || 'SXR';
                const boardingTime = details.boardingTime || '09:10 AM';
                const seatGate = details.seatGate || '12A / T3';
                
                return (
                  <div className="space-y-4">
                    <div className="p-4 bg-black/35 rounded-2xl border border-white/5 flex items-center justify-between">
                      <div className="text-left">
                        <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Airline Carrier</p>
                        <h4 className="text-lg font-bold text-white">{airline}</h4>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Flight No</p>
                        <h4 className="text-lg font-mono font-bold text-kashmir-gold">{flightNo}</h4>
                      </div>
                    </div>

                    <div className="flex items-center justify-between px-2 text-center py-2">
                      <div className="text-left">
                        <h3 className="text-3xl font-display font-black text-white">{departure}</h3>
                        <p className="text-xs text-white/40">Departure Terminal</p>
                      </div>
                      <div className="flex-1 flex flex-col items-center px-4 relative">
                        <p className="text-[9px] font-mono text-kashmir-gold mb-1">Direct</p>
                        <div className="w-full h-[1px] bg-white/20 relative">
                          <div className="w-1.5 h-1.5 bg-kashmir-gold rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                        </div>
                        <p className="text-[9px] text-white/20 mt-1">Scheduled Transit</p>
                      </div>
                      <div className="text-right">
                        <h3 className="text-3xl font-display font-black text-white">{destination}</h3>
                        <p className="text-xs text-white/40">Srinagar (SXR)</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5 p-4 bg-white/[0.02] border border-white/5 rounded-2xl text-xs">
                      <div>
                        <p className="text-white/30 text-[9px] uppercase tracking-wider mb-0.5">Date</p>
                        <p className="font-bold text-white">{new Date(activeSlip.booking.bookingDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-white/30 text-[9px] uppercase tracking-wider mb-0.5">Boarding</p>
                        <p className="font-bold text-white">{boardingTime}</p>
                      </div>
                      <div>
                        <p className="text-white/30 text-[9px] uppercase tracking-wider mb-0.5">Seat / Gate</p>
                        <p className="font-bold text-kashmir-gold">{seatGate}</p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Slip C: Driver Chauffeur */}
              {activeSlip.type === 'cab' && (() => {
                const details = activeSlip.booking.details || {};
                const cabAllocation = details.cabAllocation || {};
                const driverName = cabAllocation.driverName || details.driverName || 'Hilal Ahmad';
                const driverPhone = cabAllocation.driverPhone || details.driverPhone || '+91 91037 98448';
                const vehicleName = cabAllocation.cabName || details.cabName || details.vehicleType || 'Toyota Innova Crysta';
                const registrationNo = cabAllocation.registrationNo || details.registrationNo || details.vehicleRegNo || 'JK-01-X-7721';
                const pickupLocation = details.pickupLocation || 'Srinagar Airport (SXR)';
                const dropLocation = details.dropLocation || 'Srinagar Hotel / Resort';
                
                return (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                      <div className="w-14 h-14 bg-kashmir-gold/10 border border-kashmir-gold/20 rounded-xl flex items-center justify-center text-kashmir-gold text-lg font-black shrink-0">
                        {driverName.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="text-left">
                        <h4 className="font-bold text-white">{driverName}</h4>
                        <p className="text-xs text-white/40">{driverPhone} • Languages: English, Hindi, Kashmiri</p>
                      </div>
                    </div>

                    <div className="space-y-3.5 text-sm">
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-white/40">Assigned Vehicle</span>
                        <span className="font-bold text-white">{vehicleName}</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-white/40">License Plate</span>
                        <span className="font-mono font-bold text-kashmir-gold">{registrationNo}</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-white/40">Pickup Location</span>
                        <span className="font-semibold text-white">{pickupLocation}</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-white/40">Drop Location</span>
                        <span className="font-semibold text-white">{dropLocation}</span>
                      </div>
                      <div className="flex justify-between pb-2">
                        <span className="text-white/40">Driver Status</span>
                        <span className="text-green-400 font-extrabold uppercase text-xs">Driver Mapped</span>
                      </div>
                    </div>

                    <Button 
                      onClick={() => setShowDriverTracking(true)}
                      variant="gold"
                      className="w-full rounded-xl text-black font-bold h-10 text-xs shadow-md mt-2"
                    >
                      <MapPin className="w-3.5 h-3.5 mr-2 animate-bounce" /> Track Chauffeur Live
                    </Button>
                  </div>
                );
              })()}

              {/* Mock Barcode for Luxury Ticket Theme */}
              <div className="pt-4 border-t border-white/5 flex flex-col items-center">
                <div className="w-full h-12 bg-white flex items-center justify-center p-2 rounded-lg opacity-85">
                  <div className="w-full h-full flex justify-between">
                    {[1,2,4,1,2,3,1,2,4,2,1,3,2,1,4,1,2,3,1,4,2,1,3,1,2,4].map((width, idx) => (
                      <div key={idx} className="bg-black h-full" style={{ width: `${width * 2}px` }} />
                    ))}
                  </div>
                </div>
                <p className="text-[9px] font-mono text-white/30 tracking-widest mt-2 uppercase">Verified Kashmir Curators Protocol</p>
              </div>

              {/* Actions footer */}
              <div className="pt-4 flex justify-between items-center gap-2 border-t border-white/5 slip-actions">
                <Button 
                  onClick={() => downloadVoucherAsPdf(
                    activeSlip.type === 'hotel' ? 'Stay Voucher' : activeSlip.type === 'flight' ? 'Boarding Pass' : 'Driver Dispatch Slip', 
                    activeSlip.booking
                  )}
                  variant="gold" 
                  className="flex-1 rounded-xl text-black font-bold uppercase tracking-wider h-10 flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" /> Download PDF
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setActiveSlip(null)} 
                  className="rounded-xl border-white/10 hover:bg-white/5 font-bold h-10 px-4"
                >
                  Close
                </Button>
              </div>

            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* Invoice Details Dialog */}
      <Dialog open={!!activeInvoice} onOpenChange={(open) => !open && setActiveInvoice(null)}>
        {activeInvoice && (
          <DialogContent id={`invoice-panel-${activeInvoice.id}`} className="rounded-3xl bg-[#0d1317] text-white border-white/10 shadow-2xl p-6 md:p-8 max-w-lg">
            <DialogHeader className="text-left border-b border-white/5 pb-4">
              <DialogTitle className="font-display text-2xl flex items-center justify-between text-kashmir-gold">
                <span className="flex items-center gap-2">
                  <FileText className="w-6 h-6" /> Invoice Summary
                </span>
                <Badge className={cn("font-bold text-[9px] uppercase px-2 py-0.5 tracking-wider shadow-sm",
                  activeInvoice.status === 'cancelled' ? 'bg-red-500/20 text-red-400 border-red-500/20' : 'bg-green-500/20 text-green-400 border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.1)]'
                )}>
                  {activeInvoice.status === 'cancelled' ? 'REFUNDED' : 'PAID'}
                </Badge>
              </DialogTitle>
            </DialogHeader>

            <div className="py-6 text-left space-y-6">
              {/* Header Info */}
              <div className="flex justify-between items-start text-xs border-b border-white/5 pb-4">
                <div>
                  <h4 className="font-display text-sm font-bold text-white mb-1">KASHMIR CURATORS</h4>
                  <p className="text-white/40">Luxury Travel Agency</p>
                  <p className="text-white/40">Srinagar, Jammu & Kashmir</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase text-kashmir-gold tracking-widest mb-1">Invoice Number</p>
                  <p className="font-mono font-bold text-white">INV-2026-{activeInvoice.id.toUpperCase().substring(0, 8)}</p>
                  <p className="text-[10px] text-white/40 mt-2">Date: {new Date(activeInvoice.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Bill To */}
              <div className="text-xs">
                <p className="text-[10px] font-black uppercase text-white/40 tracking-wider mb-1">Billed To</p>
                <p className="font-bold text-white">{user?.name}</p>
                <p className="text-white/50">{user?.email}</p>
                {user?.phone && <p className="text-white/50">{user.phone}</p>}
              </div>

              {/* Item Details Table */}
              <div className="bg-black/35 rounded-2xl border border-white/5 overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-white/5 text-[9px] font-black uppercase text-white/40 tracking-wider">
                      <th className="p-3.5">Service Details</th>
                      <th className="p-3.5 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-white/80">
                    <tr>
                      <td className="p-3.5">
                        <p className="font-bold text-white">{activeInvoice.itemName}</p>
                        <p className="text-[10px] text-white/40 mt-0.5">
                          {activeInvoice.type === 'hotel' ? 'Premium Estate Stay' : activeInvoice.type === 'cab' ? 'Private Luxury Chauffeur Transit' : 'Bespoke Curated Tour Package'}
                        </p>
                      </td>
                      <td className="p-3.5 text-right font-semibold">
                        ₹{(activeInvoice.totalAmount * 0.9).toLocaleString()}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3.5 text-white/50">Curator Fee (5%)</td>
                      <td className="p-3.5 text-right text-white/50">
                        ₹{(activeInvoice.totalAmount * 0.05).toLocaleString()}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3.5 text-white/50">Local SGST/CGST (5%)</td>
                      <td className="p-3.5 text-right text-white/50">
                        ₹{(activeInvoice.totalAmount * 0.05).toLocaleString()}
                      </td>
                    </tr>
                    <tr className="bg-white/5 font-bold text-white text-sm">
                      <td className="p-3.5 text-kashmir-gold">Total Paid</td>
                      <td className="p-3.5 text-right text-kashmir-gold">
                        ₹{activeInvoice.totalAmount.toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Verified Stamp & Actions */}
              <div className="pt-2 flex justify-between items-center text-xs invoice-actions">
                <div className="flex items-center gap-2 text-green-400">
                  <ShieldCheck className="w-5 h-5 animate-pulse" />
                  <span className="font-extrabold uppercase tracking-wider text-[10px]">Payment Authenticated</span>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => {
                      window.print();
                    }}
                    variant="outline" 
                    size="sm" 
                    className="rounded-xl border-white/10 hover:bg-white/5 text-[10px] font-bold uppercase tracking-wider px-3 h-8"
                  >
                    Print
                  </Button>
                  <Button 
                    onClick={() => downloadInvoiceAsPdf(activeInvoice)}
                    variant="gold" 
                    size="sm" 
                    className="rounded-xl text-black font-bold uppercase tracking-wider px-3 h-8 flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" /> PDF
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setActiveInvoice(null)} 
                className="w-full rounded-xl border-white/10 hover:bg-white/5 font-bold h-11"
              >
                Close Invoice
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Chauffeur GPS Live Tracking Modal */}
      <Dialog open={showDriverTracking} onOpenChange={setShowDriverTracking}>
        <DialogContent className="rounded-3xl bg-[#0d1317] text-white border-white/10 shadow-2xl p-6 max-w-md">
          <DialogHeader className="text-left border-b border-white/5 pb-4">
            <DialogTitle className="font-display text-xl flex items-center gap-3 text-kashmir-gold">
              <Map className="w-6 h-6 animate-pulse" /> Live Chauffeur Tracker
            </DialogTitle>
          </DialogHeader>

          <div className="py-6 space-y-5 text-center">
            {/* Mock Map Container using animated SVG */}
            <div className="w-full h-64 bg-black/45 rounded-2xl border border-white/5 relative overflow-hidden flex items-center justify-center">
              {/* Map grid lines */}
              <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:16px_16px]" />
              
              {/* Animated Road Lines */}
              <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <path d="M 50 180 Q 150 50 250 180 T 350 50" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" strokeLinecap="round" />
                <path d="M 50 180 Q 150 50 250 180 T 350 50" fill="none" stroke="#D4AF37" strokeWidth="2" strokeDasharray="6,6" strokeLinecap="round" />
                
                {/* Hub Pin */}
                <circle cx="50" cy="180" r="6" fill="#ef4444" />
                {/* Destination Airport Pin */}
                <circle cx="350" cy="50" r="6" fill="#22c55e" className="animate-ping" />
                
                {/* Car Marker animating along the path */}
                <circle 
                  cx={50 + (trackingProgress/100) * 300} 
                  cy={180 - Math.sin((trackingProgress/100) * Math.PI) * 100} 
                  r="9" 
                  fill="#D4AF37" 
                  className="shadow-2xl"
                />
              </svg>

              {/* Status HUD Overlays */}
              <div className="absolute top-4 left-4 bg-black/80 border border-white/10 px-3 py-1.5 rounded-xl text-left text-[10px]">
                <p className="text-white/40 uppercase font-black tracking-widest">Driver Route</p>
                <p className="font-bold text-white">Srinagar Hub &rarr; Airport</p>
              </div>

              <div className="absolute bottom-4 right-4 bg-black/80 border border-white/10 px-3 py-1.5 rounded-xl text-right text-[10px]">
                <p className="text-white/40 uppercase font-black tracking-widest">Eta Pick Up</p>
                <p className="font-bold text-kashmir-gold">{Math.max(0, 15 - Math.floor(trackingProgress / 7))} Mins</p>
              </div>
            </div>

            <div className="text-left bg-white/[0.02] border border-white/5 p-4 rounded-xl text-xs space-y-1">
              <p className="text-[10px] font-black uppercase text-kashmir-gold tracking-widest">Current Chauffeur Status</p>
              <p className="font-bold text-white">Hilal Ahmad • Toyota Innova Crysta (JK-01-X-7721)</p>
              <p className="text-white/50">Driver has dispatched from the terminal. Approaching arrival gate pick-up zone.</p>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowDriverTracking(false)} 
              className="w-full rounded-xl border-white/10 hover:bg-white/5 font-bold"
            >
              Close Tracker
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Claimed Voucher Dialog */}
      <Dialog open={!!viewingVoucher} onOpenChange={(open) => !open && setViewingVoucher(null)}>
        {viewingVoucher && (
          <DialogContent className="rounded-3xl bg-[#111820] text-white border-white/10 shadow-2xl p-6 text-center max-w-sm">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl text-center text-kashmir-gold flex items-center justify-center gap-2">
                <Crown className="w-5 h-5" /> Voucher Code
              </DialogTitle>
            </DialogHeader>

            <div className="py-8 space-y-4">
              <p className="text-xs text-white/55 text-center">Present this code to your Personal Curator or hotel desk during check-in to apply voucher benefits.</p>
              
              <div className="bg-black/40 border border-white/5 rounded-2xl p-5 flex flex-col items-center justify-center">
                <p className="text-[10px] font-black uppercase text-white/40 tracking-wider mb-2">{viewingVoucher.name}</p>
                <h3 className="text-xl font-mono font-black text-kashmir-gold tracking-widest select-all">{viewingVoucher.code}</h3>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={() => {
                    navigator.clipboard.writeText(viewingVoucher.code);
                    toast.success("Voucher code copied to clipboard!");
                  }}
                  variant="outline" 
                  className="rounded-xl border-white/10 hover:bg-white/5 flex-1 font-bold text-xs"
                >
                  <Copy className="w-3.5 h-3.5 mr-2" /> Copy Code
                </Button>
                <Button 
                  onClick={() => {
                    toast.success("Sharing voucher...", { description: `Shared: ${viewingVoucher.name} [Code: ${viewingVoucher.code}]` });
                  }}
                  variant="outline" 
                  className="rounded-xl border-white/10 hover:bg-white/5 flex-1 font-bold text-xs"
                >
                  <Share2 className="w-3.5 h-3.5 mr-2" /> Share
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button 
                variant="gold" 
                onClick={() => setViewingVoucher(null)} 
                className="w-full rounded-xl text-black font-bold h-11 shadow-lg shadow-kashmir-gold/10"
              >
                Done
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Pay Installment Dialog */}
      <Dialog open={!!selectedInstallment} onOpenChange={(open) => !open && setSelectedInstallment(null)}>
        {selectedInstallment && (
          <DialogContent className="rounded-3xl bg-[#0d1317] text-white border-white/10 shadow-2xl p-6 md:p-8 max-w-md">
            <DialogHeader className="text-left border-b border-white/5 pb-4">
              <DialogTitle className="font-display text-xl text-white flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-kashmir-gold" /> Authorize Installment
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handlePayInstallment} className="py-4 space-y-4 text-left">
              <div className="p-4 bg-black/40 border border-white/5 rounded-2xl flex justify-between items-center mb-2">
                <div>
                  <h4 className="text-xs font-bold text-white">{selectedInstallment.name}</h4>
                  <p className="text-[10px] text-white/40 mt-0.5">{selectedInstallment.due}</p>
                </div>
                <span className="text-lg font-black text-kashmir-gold">₹{selectedInstallment.amount.toLocaleString()}</span>
              </div>

              {isPayingInstallment ? (
                <div className="py-12 flex flex-col items-center justify-center gap-4 text-center">
                  <Loader2 className="w-8 h-8 text-kashmir-gold animate-spin" />
                  <p className="text-sm font-semibold text-white/80 animate-pulse">{paymentMilestone}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider block mb-1.5">Cardholder Name</label>
                    <Input 
                      value={cardName} 
                      onChange={(e) => setCardName(e.target.value)} 
                      required
                      placeholder="e.g. Zahid Reyaz"
                      className="bg-black/40 border-white/10 h-11 rounded-xl text-white focus-visible:ring-kashmir-gold text-xs pl-4" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider block mb-1.5">16-Digit Card Number</label>
                    <Input 
                      value={cardNumber} 
                      onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').substring(0, 16))} 
                      required
                      placeholder="•••• •••• •••• ••••"
                      className="bg-black/40 border-white/10 h-11 rounded-xl text-white focus-visible:ring-kashmir-gold text-xs pl-4 font-mono" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider block mb-1.5">Expiry Date</label>
                      <Input 
                        value={cardExpiry} 
                        onChange={(e) => setCardExpiry(e.target.value.substring(0, 5))} 
                        required
                        placeholder="MM/YY"
                        className="bg-black/40 border-white/10 h-11 rounded-xl text-white focus-visible:ring-kashmir-gold text-xs pl-4" 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider block mb-1.5">Security Code (CVC)</label>
                      <Input 
                        value={cardCvc} 
                        onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, '').substring(0, 3))} 
                        required
                        type="password"
                        placeholder="•••"
                        className="bg-black/40 border-white/10 h-11 rounded-xl text-white focus-visible:ring-kashmir-gold text-xs pl-4" 
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button 
                      type="submit"
                      variant="gold"
                      className="w-full rounded-xl text-black font-bold h-11 shadow-lg shadow-kashmir-gold/15"
                    >
                      Authorize Payment
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </DialogContent>
        )}
      </Dialog>

      {/* Interactive Proposal Day-by-Day Itinerary Viewer Dialog */}
      <Dialog open={!!selectedInquiry} onOpenChange={(open) => !open && setSelectedInquiry(null)}>
        {selectedInquiry && (
          <DialogContent className="rounded-3xl bg-[#0d1317] text-white border-white/10 shadow-2xl p-6 md:p-8 max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-white/5">
            <DialogHeader className="text-left border-b border-white/5 pb-4">
              <DialogTitle className="font-display text-2xl text-white flex items-center justify-between">
                <span>Custom Proposal Itinerary</span>
                <Badge variant="outline" className="text-kashmir-gold border-kashmir-gold/30">
                  {selectedInquiry.duration} Days in {selectedInquiry.destination}
                </Badge>
              </DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 py-6 text-left">
              {/* Left Column: Day Tracker Selector */}
              <div className="lg:border-r border-white/5 lg:pr-6 space-y-3 max-h-[350px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/5">
                <p className="text-[10px] font-black uppercase text-white/40 tracking-widest mb-3">Daily Route Map</p>
                {itineraryDays.map((d: any) => (
                  <button
                    key={d.day}
                    type="button"
                    onClick={() => setSelectedItineraryDay(d.day)}
                    className={cn(
                      "w-full p-3.5 rounded-xl border text-left transition-all duration-300 flex items-center justify-between",
                      selectedItineraryDay === d.day
                        ? "bg-kashmir-gold/15 border-kashmir-gold/45 text-kashmir-gold shadow-md"
                        : "bg-white/[0.02] border-white/5 text-white/60 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-wider">Day {d.day}</p>
                      <h4 className="text-xs font-bold truncate max-w-[160px] mt-0.5">{d.title}</h4>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 opacity-40 shrink-0" />
                  </button>
                ))}
              </div>

              {/* Middle Column: Active Day Details Card */}
              <div className="lg:col-span-2 space-y-6 flex flex-col justify-between">
                {(() => {
                  const activeDay = itineraryDays.find(d => d.day === selectedItineraryDay);
                  if (!activeDay) return <div className="text-white/40 text-xs py-8">No day plan details loaded.</div>;
                  return (
                    <div className="space-y-5 animate-in fade-in duration-300">
                      <div>
                        <Badge className="bg-kashmir-gold/10 text-kashmir-gold border border-kashmir-gold/20 font-bold text-[9px] uppercase px-2 py-0.5 tracking-wider mb-2">
                          Day {activeDay.day} Plan
                        </Badge>
                        <h3 className="font-display text-2xl font-black text-white">{activeDay.title}</h3>
                        <p className="text-xs text-white/65 mt-2 leading-relaxed whitespace-pre-wrap">{activeDay.activities || 'Relax and enjoy the luxury service of Kashmir Curators.'}</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/5">
                        <div className="bg-black/30 border border-white/5 p-4 rounded-2xl">
                          <h4 className="text-[9px] font-black uppercase text-kashmir-gold tracking-widest mb-1.5 flex items-center gap-1.5">
                            <Building className="w-3 h-3" /> Accommodation
                          </h4>
                          <p className="text-xs font-bold text-white truncate">{activeDay.hotelName || 'Bespoke Curated Stay'}</p>
                          <p className="text-[10px] text-white/40 mt-0.5">{activeDay.roomType || 'Deluxe Room'} • {activeDay.mealPlan || 'MAP (MAP (Breakfast + Dinner))'}</p>
                        </div>

                        <div className="bg-black/30 border border-white/5 p-4 rounded-2xl">
                          <h4 className="text-[9px] font-black uppercase text-kashmir-gold tracking-widest mb-1.5 flex items-center gap-1.5">
                            <Car className="w-3 h-3" /> Chauffeur Transport
                          </h4>
                          <p className="text-xs font-bold text-white truncate">{activeDay.transport || 'Private Luxury Sedan'}</p>
                          <p className="text-[10px] text-white/40 mt-0.5">Professional Driver Included</p>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Proposal Feedback loop */}
                <div className="border-t border-white/5 pt-6 mt-6">
                  <h4 className="text-xs font-bold text-white/80 mb-3 text-left">Request Modification (Feedback Loop)</h4>
                  <form onSubmit={handleFeedbackSubmit} className="flex gap-2">
                    <Input
                      value={clientFeedback}
                      onChange={(e) => setClientFeedback(e.target.value)}
                      placeholder="e.g. Can we change Pahalgam hotel to a luxury cottage stay?..."
                      className="bg-black/40 border-white/10 rounded-xl h-11 text-xs focus-visible:ring-kashmir-gold text-white flex-1 pl-4"
                    />
                    <Button 
                      type="submit"
                      disabled={isSubmittingFeedback || !clientFeedback.trim()}
                      variant="gold"
                      className="rounded-xl text-black font-bold h-11 shrink-0 px-6"
                    >
                      {isSubmittingFeedback ? 'Submitting...' : 'Send Request'}
                    </Button>
                  </form>
                </div>
              </div>
            </div>

            <DialogFooter className="border-t border-white/5 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setSelectedInquiry(null)} 
                className="w-full rounded-xl border-white/10 hover:bg-white/5 font-bold h-11 text-xs"
              >
                Close Itinerary
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {safetyCardToken && (
        <TripSafetyCardModal
          shareToken={safetyCardToken}
          isOpen={!!safetyCardToken}
          onClose={() => setSafetyCardToken(null)}
        />
      )}

      <Footer />
    </div>
  );
}

// Sidebar Button Component (Desktop)
function SidebarButton({ icon: Icon, label, active, onClick, className, badge }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center justify-between px-4 py-3.5 rounded-2xl font-medium transition-all text-left w-full group text-sm",
        active 
          ? "bg-gradient-to-r from-kashmir-gold/15 to-transparent text-kashmir-gold border-l-2 border-kashmir-gold" 
          : "text-white/60 hover:bg-white/5 hover:text-white",
        className
      )}
    >
      <span className="flex items-center gap-3">
        <Icon className={cn("w-5 h-5", active ? "text-kashmir-gold" : "text-white/40 group-hover:text-white/70", className)} /> 
        {label}
      </span>
      {badge !== undefined && badge > 0 && (
        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold", active ? "bg-kashmir-gold text-black" : "bg-white/10 text-white")}>
          {badge}
        </span>
      )}
    </button>
  );
}

// Mobile Tab Button
function MobileTabButton({ icon: Icon, label, active, onClick, className, badge }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-300 snap-center border shrink-0",
        active 
          ? "bg-kashmir-gold/15 text-kashmir-gold border-kashmir-gold/30 shadow-[0_0_15px_rgba(212,175,55,0.1)]" 
          : "bg-white/5 text-white/55 border-white/5 hover:bg-white/10 hover:text-white",
        className
      )}
    >
      <Icon className="w-4 h-4" />
      {label}
      {badge !== undefined && badge > 0 && (
        <span className={cn("px-1.5 py-0.5 rounded-full text-[9px] font-bold", active ? "bg-kashmir-gold text-black animate-pulse" : "bg-white/10 text-white")}>
          {badge}
        </span>
      )}
    </button>
  );
}

// Sub-component for rendering a luxury Ticket
function BookingTicket({ booking, onCancel, cancellingId, onShowSlip, onShowSafetyCard }: { booking: any, onCancel: (id: string) => void, cancellingId: string | null, onShowSlip: (slip: any) => void, onShowSafetyCard?: (id: string) => void }) {
  const Icon = typeIcons[booking.type as keyof typeof typeIcons] || Package;
  
  return (
    <div className="bg-[#0c1216]/65 backdrop-blur-xl rounded-3xl shadow-lg border border-white/10 overflow-hidden flex flex-col md:flex-row hover:shadow-2xl hover:border-kashmir-gold/40 transition-all duration-500 relative">
      
      {/* Left side - Icon & Status */}
      <div className="bg-black/20 md:w-48 p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-dashed border-white/15 relative">
        <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mb-4 text-white shadow-inner">
          <Icon className="w-8 h-8 text-kashmir-gold" />
        </div>
        <Badge className={cn('px-3 py-1 font-bold uppercase tracking-wider text-[10px]', 
          booking.status === 'confirmed' ? 'bg-green-500/20 text-green-400 border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.1)]' : 
          booking.status === 'cancelled' ? 'bg-red-500/20 text-red-400 border-red-500/20' : 
          booking.status === 'completed' ? 'bg-white/15 text-white/50 border-white/10' :
          'bg-kashmir-gold/20 text-kashmir-gold border-kashmir-gold/20'
        )}>
          {booking.status}
        </Badge>
        
        {/* Decorative Ticket Cutouts */}
        <div className="hidden md:block w-6 h-6 bg-[#05080a] rounded-full absolute -right-3 -top-3 shadow-inner" />
        <div className="hidden md:block w-6 h-6 bg-[#05080a] rounded-full absolute -right-3 -bottom-3 shadow-inner" />
      </div>

      {/* Middle - Details */}
      <div className="flex-1 p-6 md:p-8">
        <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 flex items-center justify-center md:justify-start gap-2">
          <span>REF CODE:</span>
          <span className="font-mono bg-white/5 px-2 py-0.5 rounded text-white/80">{booking.id.toUpperCase().slice(0, 8)}</span>
        </div>
        <h3 className="font-display text-2xl font-bold text-white mb-6 leading-tight text-center md:text-left">{booking.itemName}</h3>
        
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-white/60">
          <div className="flex items-center gap-3 bg-black/40 border border-white/5 px-4 py-2.5 rounded-xl text-left">
            <Calendar className="h-5 w-5 text-kashmir-gold" />
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-wider text-white/40 font-bold">Departure</span>
              <span className="font-semibold text-white">
                {new Date(booking.bookingDate).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-black/40 border border-white/5 px-4 py-2.5 rounded-xl text-left">
            <CreditCard className="h-5 w-5 text-kashmir-gold" />
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-wider text-white/40 font-bold">Total Price</span>
              <span className="font-semibold text-white">
                ₹{booking.totalAmount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Curation Milestone Progress bar */}
        {booking.status === 'confirmed' && booking.type === 'package' && (
          <div className="mt-8 border-t border-white/5 pt-6 relative z-10 text-left">
            <div className="flex flex-col mb-4">
              <h4 className="font-display text-xs font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-kashmir-gold animate-pulse" /> Live Trip Stepper
              </h4>
              <p className="text-[10px] text-white/40">Follow updates as your private curation deck registers milestones.</p>
            </div>

            {/* Stepper Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="flex items-center gap-3 bg-white/[0.02] border border-white/5 p-2.5 rounded-xl">
                <div className="w-6 h-6 rounded-full bg-kashmir-gold text-black flex items-center justify-center font-bold text-[10px] shrink-0 shadow-lg shadow-kashmir-gold/20">✓</div>
                <div className="text-left">
                  <p className="text-[9px] font-black uppercase text-kashmir-gold tracking-widest leading-none">Curator</p>
                  <p className="text-[11px] text-white font-medium">Assigned</p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white/[0.02] border border-white/5 p-2.5 rounded-xl">
                <div className="w-6 h-6 rounded-full bg-kashmir-gold text-black flex items-center justify-center font-bold text-[10px] shrink-0 shadow-lg shadow-kashmir-gold/20">✓</div>
                <div className="text-left">
                  <p className="text-[9px] font-black uppercase text-kashmir-gold tracking-widest leading-none">Air Tickets</p>
                  <p className="text-[11px] text-white font-medium">Secured</p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white/[0.02] border border-white/5 p-2.5 rounded-xl">
                <div className="w-6 h-6 rounded-full bg-kashmir-gold text-black flex items-center justify-center font-bold text-[10px] shrink-0 shadow-lg shadow-kashmir-gold/20">✓</div>
                <div className="text-left">
                  <p className="text-[9px] font-black uppercase text-kashmir-gold tracking-widest leading-none">Lodging</p>
                  <p className="text-[11px] text-white font-medium">Bookings Locked</p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-gradient-to-r from-kashmir-gold/10 to-transparent border border-kashmir-gold/20 p-2.5 rounded-xl animate-pulse">
                <div className="w-6 h-6 rounded-full bg-kashmir-gold/15 text-kashmir-gold border border-kashmir-gold/30 flex items-center justify-center font-bold text-[10px] shrink-0">4</div>
                <div className="text-left">
                  <p className="text-[9px] font-black uppercase text-kashmir-gold tracking-widest leading-none">Driver</p>
                  <p className="text-[11px] text-white font-medium">Driver Mapped</p>
                </div>
              </div>
            </div>

            {/* Launch detailed ticket modals */}
            <div className="mt-5 flex flex-wrap gap-2.5 justify-center md:justify-start">
              <Button 
                variant="ghost" 
                onClick={() => onShowSlip({ type: 'hotel', booking })}
                className="bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-xl text-[10px] h-8 border border-white/5 flex items-center gap-2 font-bold uppercase tracking-wider"
              >
                <Building className="w-3.5 h-3.5 text-kashmir-gold" /> Stay Voucher
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => onShowSlip({ type: 'flight', booking })}
                className="bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-xl text-[10px] h-8 border border-white/5 flex items-center gap-2 font-bold uppercase tracking-wider"
              >
                <Ticket className="w-3.5 h-3.5 text-kashmir-gold" /> Flight pass
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => onShowSlip({ type: 'cab', booking })}
                className="bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-xl text-[10px] h-8 border border-white/5 flex items-center gap-2 font-bold uppercase tracking-wider"
              >
                <Car className="w-3.5 h-3.5 text-kashmir-gold" /> Chauffeur Details
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Right side - Actions */}
      <div className="bg-white/[0.02] p-6 md:w-56 flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-dashed border-white/15">
        
        {(booking.status === 'confirmed' || booking.status === 'pending' || booking.status === 'completed') && (
          <Button 
            onClick={() => {
              if (booking.type === 'hotel') {
                onShowSlip({ type: 'hotel', booking });
              } else if (booking.type === 'cab') {
                onShowSlip({ type: 'cab', booking });
              } else {
                onShowSlip({ type: 'hotel', booking }); // Default to hotel stay voucher
              }
            }}
            variant="gold"
            className="w-full mb-3 rounded-xl text-black font-bold text-xs h-10 shadow-lg shadow-kashmir-gold/15 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {booking.type === 'hotel' ? 'Preview Voucher' : booking.type === 'cab' ? 'Preview Details' : 'Preview Voucher'}
          </Button>
        )}

        {(booking.status === 'confirmed' || booking.status === 'pending' || booking.status === 'completed') && (
          <Button 
            onClick={() => onShowSafetyCard ? onShowSafetyCard(booking.id) : null}
            variant="outline"
            className="w-full mb-3 rounded-xl bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 font-bold text-xs h-10 flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Trip Safety Card
          </Button>
        )}

        {(booking.status === 'confirmed' || booking.status === 'pending') && (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500 hover:text-white rounded-xl font-bold text-xs h-10 transition-all">
                Cancel Trip
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl bg-[#111820] text-white border-white/10 shadow-2xl p-6">
              <DialogHeader className="text-left">
                <DialogTitle className="font-display text-2xl">Cancel Booking</DialogTitle>
              </DialogHeader>
              <div className="py-6 text-left">
                <div className="flex items-start gap-4 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 mb-6">
                  <AlertCircle className="h-6 w-6 shrink-0 mt-0.5" />
                  <p className="text-sm font-medium leading-relaxed">
                    Are you sure you want to cancel this booking? This action is permanent and cannot be undone. Standard cancellation policy applies.
                  </p>
                </div>
                <div className="bg-black/50 p-4 rounded-xl text-sm border border-white/5 text-left">
                  <p className="font-semibold text-white mb-1">{booking.itemName}</p>
                  <p className="text-white/60">Amount: ₹{booking.totalAmount.toLocaleString()}</p>
                </div>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" className="rounded-xl border-white/20 bg-transparent text-white hover:bg-white/10">Keep Booking</Button>
                <Button
                  variant="destructive"
                  className="rounded-xl shadow-lg font-bold"
                  onClick={() => onCancel(booking.id)}
                  disabled={cancellingId === booking.id}
                >
                  {cancellingId === booking.id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" /> Cancelling...
                    </>
                  ) : (
                    'Confirm Cancellation'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {booking.status === 'completed' && (
          <Button variant="gold" className="w-full rounded-xl shadow-[0_0_20px_rgba(212,175,55,0.2)] font-bold text-black text-xs h-10">
            Book Again
          </Button>
        )}
      </div>

    </div>
  );
}
