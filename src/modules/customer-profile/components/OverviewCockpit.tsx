import React, { useState } from 'react';
import { 
  Package, 
  Compass, 
  Wallet, 
  Crown, 
  Calendar, 
  MapPin, 
  CloudSun, 
  ShieldCheck, 
  Sparkles, 
  Map, 
  Building, 
  Car, 
  ArrowRight, 
  FileCheck2, 
  Ticket,
  ChevronRight,
  Clock,
  LogIn
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { CustomerBooking, CustomerInquiry, KashmirLocationAdvisory, ProfileTabId } from '../types';

interface OverviewCockpitProps {
  bookings: CustomerBooking[];
  inquiries: CustomerInquiry[];
  walletBalance?: number;
  loyaltyPoints?: number;
  advisories: KashmirLocationAdvisory[];
  onNavigateTab: (tab: ProfileTabId) => void;
  onOpenSafetyCard: (bookingId?: string) => void;
  onShowSlip: (slip: { type: 'hotel' | 'flight' | 'cab'; booking: any }) => void;
}

export const OverviewCockpit: React.FC<OverviewCockpitProps> = ({
  bookings,
  inquiries,
  walletBalance = 0,
  loyaltyPoints = 0,
  advisories,
  onNavigateTab,
  onOpenSafetyCard,
  onShowSlip
}) => {
  const [selectedLocId, setSelectedLocId] = useState(advisories[0]?.id || 'srinagar');
  const activeAdvisory = advisories.find(l => l.id === selectedLocId) || advisories[0];

  const activeBookings = bookings.filter(b => b.status === 'confirmed' || b.status === 'pending');
  const pendingProposals = inquiries.filter(i => i.status !== 'Booked' && i.status !== 'Lost');
  const latestBooking = activeBookings[0] || bookings[0];

  return (
    <div className="space-y-8 animate-fade-in text-left">
      
      {/* 1. EXECUTIVE 4-METRIC COCKPIT */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Bookings & Active Journeys */}
        <Card 
          onClick={() => onNavigateTab('trips')}
          className="bg-slate-900/80 border-white/10 hover:border-amber-500/40 rounded-3xl p-5 shadow-lg cursor-pointer transition-all hover:scale-[1.02] group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-white/50 flex items-center gap-1.5">
              <Package className="w-4 h-4 text-amber-400" />
              <span>Active Bookings</span>
            </span>
            <Badge variant="outline" className="font-mono text-[10px] text-amber-400 border-amber-500/30">
              Live Trips
            </Badge>
          </div>
          <div className="text-3xl font-black text-white tracking-tight">
            {activeBookings.length}
          </div>
          <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-white/50">
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <LogIn className="w-3 h-3" /> {bookings.filter(b => b.status === 'confirmed').length} Confirmed
            </span>
            <span>{bookings.filter(b => b.status === 'completed').length} Past</span>
          </div>
        </Card>

        {/* Metric 2: Custom Proposals */}
        <Card 
          onClick={() => onNavigateTab('proposals')}
          className="bg-slate-900/80 border-white/10 hover:border-sky-500/40 rounded-3xl p-5 shadow-lg cursor-pointer transition-all hover:scale-[1.02] group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-sky-400" />
              <span>Custom Proposals</span>
            </span>
            {pendingProposals.length > 0 && (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
              </span>
            )}
          </div>
          <div className="text-3xl font-black text-white tracking-tight">
            {pendingProposals.length}
          </div>
          <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-white/50">
            <span>In Curation</span>
            <span className="text-sky-400 font-bold">Review Route &rarr;</span>
          </div>
        </Card>

        {/* Metric 3: Travel Wallet & Credits */}
        <Card 
          onClick={() => onNavigateTab('loyalty')}
          className="bg-slate-900/80 border-white/10 hover:border-emerald-500/40 rounded-3xl p-5 shadow-lg cursor-pointer transition-all hover:scale-[1.02] group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-emerald-400" />
              <span>Travel Wallet</span>
            </span>
            <Badge variant="outline" className="font-mono text-[10px] text-emerald-400 border-emerald-500/30">
              Credits
            </Badge>
          </div>
          <div className="text-3xl font-black text-emerald-400 tracking-tight font-mono">
            ₹{walletBalance.toLocaleString('en-IN')}
          </div>
          <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-white/50">
            <span>Applicable to bookings</span>
            <span className="text-emerald-400 font-bold">100% Redeemable</span>
          </div>
        </Card>

        {/* Metric 4: Loyalty Points */}
        <Card 
          onClick={() => onNavigateTab('loyalty')}
          className="bg-slate-900/80 border-white/10 hover:border-purple-500/40 rounded-3xl p-5 shadow-lg cursor-pointer transition-all hover:scale-[1.02] group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
              <Crown className="w-4 h-4 text-purple-400" />
              <span>Loyalty Points</span>
            </span>
            <Badge variant="outline" className="font-mono text-[10px] text-purple-400 border-purple-500/30">
              Rewards
            </Badge>
          </div>
          <div className="text-3xl font-black text-purple-300 tracking-tight font-mono">
            {loyaltyPoints.toLocaleString('en-IN')}
          </div>
          <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-white/50">
            <span>Points Balance</span>
            <span className="text-purple-400 font-bold">Redeem Perks &rarr;</span>
          </div>
        </Card>

      </div>

      {/* 2. LIVE KASHMIR CLEARANCE HUB & ADVISORY DESK */}
      {activeAdvisory && (
        <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-white/10 rounded-3xl p-6 md:p-8 flex flex-col lg:flex-row items-stretch justify-between gap-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-amber-500/10 transition-all duration-700" />
          
          {/* Left: Weather Display & Location Selector */}
          <div className="flex flex-col gap-6 lg:border-r border-white/10 lg:pr-8 lg:w-80 shrink-0">
            <div>
              <p className="text-[10px] font-black uppercase text-amber-400 tracking-widest mb-3 flex items-center gap-1.5">
                <CloudSun className="w-3.5 h-3.5" />
                <span>Live Destination Intelligence</span>
              </p>
              
              {/* Selector Tabs */}
              <div className="grid grid-cols-4 gap-1.5 p-1 bg-black/40 rounded-xl border border-white/5 mb-4">
                {advisories.map(loc => (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => setSelectedLocId(loc.id)}
                    className={`py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all duration-300 ${
                      selectedLocId === loc.id
                        ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {loc.name.substring(0, 4)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-5 mt-1">
              <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md shrink-0 shadow-inner">
                <CloudSun className="w-8 h-8 text-amber-400 animate-pulse" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-white/40 tracking-wider mb-0.5">Live from {activeAdvisory.name}</p>
                <h3 className="text-3xl font-display font-black text-white tracking-tight">{activeAdvisory.temp.toFixed(1)}°C</h3>
                <p className="text-xs text-white/60 mt-0.5">{activeAdvisory.condition}</p>
              </div>
            </div>
          </div>

          {/* Right: Dynamic Advisories Desk */}
          <div className="flex-1 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-amber-400">
                <ShieldCheck className="w-5 h-5 animate-pulse text-emerald-400" />
                <span className="text-[10px] font-black uppercase tracking-wider text-white/80">Ground Operations Clearance</span>
              </div>
              <Badge className={`font-bold text-[10px] uppercase px-2.5 py-0.5 tracking-wider shadow-sm ${
                activeAdvisory.status === 'Open' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                activeAdvisory.status === 'Caution' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                'bg-rose-500/20 text-rose-300 border-rose-500/30'
              }`}>
                {activeAdvisory.status}
              </Badge>
            </div>
            
            <div className="bg-black/40 border border-white/10 rounded-2xl p-5 text-left flex-1 flex flex-col justify-center">
              <h4 className="text-sm font-bold text-white mb-2">{activeAdvisory.name} Clearance Notice</h4>
              <p className="text-xs text-white/80 leading-relaxed">{activeAdvisory.message}</p>
              <p className="text-[10px] text-white/40 font-medium italic mt-2.5 border-t border-white/10 pt-2">{activeAdvisory.subText}</p>
            </div>
          </div>
        </div>
      )}

      {/* 3. ACTIVE TRIP HIGHLIGHT & SAFETY CARD */}
      {latestBooking && (
        <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <span className="text-[10px] font-black uppercase text-amber-400 tracking-widest flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Featured Journey</span>
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white mt-1">{latestBooking.itemName}</h3>
              <p className="text-xs text-white/50">Reference: #{latestBooking.id.toUpperCase().slice(0, 10)}</p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onOpenSafetyCard(latestBooking.id)}
                className="h-9 px-3 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20 gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Safety Pass</span>
              </Button>

              <Button
                size="sm"
                onClick={() => onShowSlip({ type: (latestBooking.type === 'package' ? 'hotel' : latestBooking.type) as 'hotel' | 'flight' | 'cab', booking: latestBooking })}
                className="h-9 px-4 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 gap-1.5 shadow-md"
              >
                <Ticket className="w-3.5 h-3.5" />
                <span>View Voucher</span>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
              <span className="text-[10px] uppercase font-bold text-white/40 block mb-1">Departure Date</span>
              <span className="text-sm font-bold text-white">
                {new Date(latestBooking.bookingDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
              <span className="text-[10px] uppercase font-bold text-white/40 block mb-1">Booking Value</span>
              <span className="text-sm font-bold text-emerald-400 font-mono">
                ₹{latestBooking.totalAmount.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
              <span className="text-[10px] uppercase font-bold text-white/40 block mb-1">Status</span>
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px] font-bold">
                {latestBooking.status.toUpperCase()}
              </Badge>
            </div>
          </div>
        </div>
      )}

      {/* 4. EXPLORE & BOOK BESPOKE EXPERIENCES */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
            <span>Explore Kashmir Services</span>
          </h2>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onNavigateTab('proposals')}
            className="text-xs text-amber-400 hover:text-amber-300 font-bold"
          >
            Custom Quote &rarr;
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div 
            onClick={() => window.location.href = '/planner'}
            className="bg-slate-900/80 border border-amber-500/30 hover:border-amber-500 p-6 rounded-3xl cursor-pointer hover:shadow-xl transition-all group relative overflow-hidden"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-white text-base mb-1 group-hover:text-amber-400 transition-colors">Bespoke Planner</h3>
            <p className="text-xs text-white/50">Architect custom Kashmir luxury itineraries with AI assistance.</p>
          </div>

          <div 
            onClick={() => window.location.href = '/packages'}
            className="bg-slate-900/80 border border-white/10 hover:border-white/30 p-6 rounded-3xl cursor-pointer hover:shadow-xl transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 text-white/80 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Map className="w-6 h-6 text-amber-400" />
            </div>
            <h3 className="font-bold text-white text-base mb-1 group-hover:text-amber-400 transition-colors">Curated Packages</h3>
            <p className="text-xs text-white/50">Handcrafted seasonal escapes across Gulmarg, Pahalgam, and Sonamarg.</p>
          </div>

          <div 
            onClick={() => window.location.href = '/hotels'}
            className="bg-slate-900/80 border border-white/10 hover:border-white/30 p-6 rounded-3xl cursor-pointer hover:shadow-xl transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 text-white/80 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Building className="w-6 h-6 text-amber-400" />
            </div>
            <h3 className="font-bold text-white text-base mb-1 group-hover:text-amber-400 transition-colors">Estates & Houseboats</h3>
            <p className="text-xs text-white/50">Verified 5-star alpine chalets and heritage Dal Lake cedar houseboats.</p>
          </div>

          <div 
            onClick={() => window.location.href = '/cabs'}
            className="bg-slate-900/80 border border-white/10 hover:border-white/30 p-6 rounded-3xl cursor-pointer hover:shadow-xl transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 text-white/80 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Car className="w-6 h-6 text-amber-400" />
            </div>
            <h3 className="font-bold text-white text-base mb-1 group-hover:text-amber-400 transition-colors">Chauffeur & 4x4 Fleet</h3>
            <p className="text-xs text-white/50">Toyota Innova Crysta, Fortuners, and licensed local mountain drivers.</p>
          </div>

        </div>
      </div>

    </div>
  );
};

export default OverviewCockpit;
