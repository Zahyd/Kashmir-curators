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
  LogIn,
  CheckCircle2,
  Navigation,
  Phone,
  MessageSquare,
  Bot,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const [selectedHotspot, setSelectedHotspot] = useState(advisories[0]?.id || 'srinagar');
  const activeAdvisory = advisories.find(l => l.id === selectedHotspot) || advisories[0];

  const activeBookings = bookings.filter(b => b.status === 'confirmed' || b.status === 'pending');
  const pendingProposals = inquiries.filter(i => i.status !== 'Booked' && i.status !== 'Lost');
  const featuredBooking = activeBookings[0] || bookings[0];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
      
      {/* 1. FEATURED JOURNEY COMMAND CENTER (Primary Hero Card) */}
      {featuredBooking ? (
        <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-[#0c141d] border border-amber-500/30 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden group">
          {/* Ambient lighting glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-amber-500/15 transition-all duration-700" />
          
          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 border-b border-white/[0.08] pb-6">
            <div className="space-y-2 max-w-xl">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5">
                  Confirmed Journey
                </Badge>
                <span className="font-mono text-xs text-white/50">
                  Ref: #{featuredBooking.id.slice(-6).toUpperCase()}
                </span>
                <span className="text-[11px] text-white/40">
                  • Booked {new Date(featuredBooking.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>

              <h2 className="text-xl md:text-3xl font-display font-black text-white tracking-tight">
                {featuredBooking.itemName}
              </h2>

              <p className="text-xs md:text-sm text-white/60 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Valley of Kashmir • Dedicated Operations Coordinator: Faheem</span>
              </p>
            </div>

            {/* Quick Actions for this Journey */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <Button
                size="sm"
                variant="gold"
                onClick={() => onNavigateTab('trips')}
                className="h-10 px-4 rounded-xl text-xs font-black bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 gap-2 shadow-lg shadow-amber-500/20"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Trip Companion 360°</span>
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => onShowSlip({ 
                  type: (featuredBooking.type === 'package' ? 'hotel' : featuredBooking.type) as 'hotel' | 'flight' | 'cab', 
                  booking: featuredBooking 
                })}
                className="h-10 px-3.5 rounded-xl text-xs font-bold border-white/10 hover:border-amber-500/40 text-white bg-slate-900/80 gap-1.5"
              >
                <Ticket className="w-3.5 h-3.5 text-amber-400" />
                <span>Stay Voucher</span>
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => onOpenSafetyCard(featuredBooking.id)}
                className="h-10 px-3.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20 gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Safety Pass</span>
              </Button>
            </div>
          </div>

          {/* Journey Telemetry Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 text-xs relative z-10">
            <div className="bg-black/30 border border-white/5 p-4 rounded-2xl">
              <span className="text-[10px] font-black uppercase text-white/40 block mb-1">Accommodation</span>
              <p className="font-bold text-white truncate">Luxury Heritage Suites</p>
              <span className="text-[10px] text-amber-400 mt-0.5 block">MAP Plan (Bkf + Din)</span>
            </div>

            <div className="bg-black/30 border border-white/5 p-4 rounded-2xl">
              <span className="text-[10px] font-black uppercase text-white/40 block mb-1">Chauffeur Transport</span>
              <p className="font-bold text-white truncate">Toyota Innova Crysta ZX</p>
              <span className="text-[10px] text-emerald-400 mt-0.5 block">Chauffeur Assigned</span>
            </div>

            <div className="bg-black/30 border border-white/5 p-4 rounded-2xl">
              <span className="text-[10px] font-black uppercase text-white/40 block mb-1">Total Valuation</span>
              <p className="font-mono font-black text-amber-400 text-sm">₹{featuredBooking.totalAmount.toLocaleString('en-IN')}</p>
              <span className="text-[10px] text-emerald-400 mt-0.5 block">Verified & Cleared</span>
            </div>

            <div className="bg-black/30 border border-white/5 p-4 rounded-2xl">
              <span className="text-[10px] font-black uppercase text-white/40 block mb-1">Concierge Lead</span>
              <p className="font-bold text-white truncate">Faheem • Online</p>
              <button 
                onClick={() => onNavigateTab('ai-companion')}
                className="text-[10px] text-sky-400 hover:underline mt-0.5 flex items-center gap-1"
              >
                <span>Live Chat &rarr;</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State: AI Voyage Architect Card */
        <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-[#0c141d] border border-amber-500/30 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-amber-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Bespoke Voyage Architect</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-display font-black text-white">
                Architect Your Bespoke Kashmir Journey
              </h2>
              <p className="text-white/60 text-xs md:text-sm leading-relaxed">
                Submit your private dates and preferences. Our senior destination curators will architect an exclusive itinerary with luxury houseboats, ski lodges, and dedicated 4x4 chauffeur escorts.
              </p>
            </div>

            <Button
              size="lg"
              variant="gold"
              onClick={() => navigate('/planner')}
              className="h-12 px-6 rounded-2xl text-xs font-black bg-amber-500 hover:bg-amber-400 text-slate-950 gap-2 shadow-lg shadow-amber-500/20 shrink-0"
            >
              <Compass className="w-4 h-4" />
              <span>Start Planning Now</span>
            </Button>
          </div>
        </div>
      )}

      {/* 2. LIVE KASHMIR HOTSPOT RADAR RIBBON */}
      <div className="bg-slate-900/70 border border-white/[0.08] rounded-3xl p-5 md:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs md:text-sm font-extrabold uppercase text-white tracking-wider flex items-center gap-2">
              <CloudSun className="w-4 h-4 text-amber-400" />
              <span>Live Kashmir Hotspot Intelligence</span>
            </h3>
            <p className="text-[11px] text-white/40">Verified temperatures, weather conditions, and operational clearance.</p>
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => onNavigateTab('clearance')}
            className="text-xs text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 rounded-xl h-8 px-3 gap-1"
          >
            <span>Full Clearance Hub</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Hotspots Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {advisories.map((loc) => {
            const isSelected = selectedHotspot === loc.id;
            return (
              <div
                key={loc.id}
                onClick={() => setSelectedHotspot(loc.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  isSelected 
                    ? 'bg-black/50 border-amber-500/50 shadow-md' 
                    : 'bg-black/25 border-white/5 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-xs text-white">{loc.name}</span>
                  <span className={`w-2 h-2 rounded-full ${
                    loc.status === 'Open' ? 'bg-emerald-400' : loc.status === 'Caution' ? 'bg-amber-400' : 'bg-rose-400'
                  }`} />
                </div>
                <div className="text-xl font-display font-extrabold text-white">
                  {loc.temp.toFixed(1)}°C
                </div>
                <p className="text-[10px] text-white/50 truncate mt-0.5">{loc.condition}</p>
                <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[9px]">
                  <span className="text-white/40 uppercase font-mono">{loc.status}</span>
                  <span className="text-amber-400 font-bold">Clear</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Active Hotspot Ground Advisory Capsule */}
        {activeAdvisory && (
          <div className="bg-black/40 border border-white/5 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">
                {activeAdvisory.name} Operations Advisory
              </span>
              <p className="text-white/80 leading-relaxed">{activeAdvisory.message}</p>
            </div>
            <Badge className={`text-[9px] font-black uppercase px-2 py-0.5 shrink-0 ${
              activeAdvisory.status === 'Open' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
              activeAdvisory.status === 'Caution' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
              'bg-rose-500/20 text-rose-400 border-rose-500/30'
            }`}>
              {activeAdvisory.status}
            </Badge>
          </div>
        )}
      </div>

      {/* 3. EXECUTIVE QUICK LAUNCH DOCK */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Dock Item 1: Bespoke Planner */}
        <div 
          onClick={() => navigate('/planner')}
          className="bg-slate-900/60 hover:bg-slate-900/90 border border-white/[0.08] hover:border-amber-500/40 p-5 rounded-3xl cursor-pointer transition-all hover:scale-[1.02] group shadow-lg flex flex-col justify-between min-h-[140px]"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
              <Compass className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-amber-400 transition-colors" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-white group-hover:text-amber-400 transition-colors">Bespoke Planner</h4>
            <p className="text-[11px] text-white/50 mt-0.5">Design a custom private Kashmir itinerary</p>
          </div>
        </div>

        {/* Dock Item 2: Curated Retreats */}
        <div 
          onClick={() => navigate('/packages')}
          className="bg-slate-900/60 hover:bg-slate-900/90 border border-white/[0.08] hover:border-sky-500/40 p-5 rounded-3xl cursor-pointer transition-all hover:scale-[1.02] group shadow-lg flex flex-col justify-between min-h-[140px]"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-400 group-hover:scale-105 transition-transform">
              <Map className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-sky-400 transition-colors" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-white group-hover:text-sky-400 transition-colors">Curated Retreats</h4>
            <p className="text-[11px] text-white/50 mt-0.5">Explore premium seasonal packages</p>
          </div>
        </div>

        {/* Dock Item 3: Luxury Houseboats & Estates */}
        <div 
          onClick={() => navigate('/hotels')}
          className="bg-slate-900/60 hover:bg-slate-900/90 border border-white/[0.08] hover:border-emerald-500/40 p-5 rounded-3xl cursor-pointer transition-all hover:scale-[1.02] group shadow-lg flex flex-col justify-between min-h-[140px]"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
              <Building className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-emerald-400 transition-colors" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-white group-hover:text-emerald-400 transition-colors">Estates & Houseboats</h4>
            <p className="text-[11px] text-white/50 mt-0.5">Direct reservations at verified 5-star properties</p>
          </div>
        </div>

        {/* Dock Item 4: 4x4 Chauffeur Fleet */}
        <div 
          onClick={() => navigate('/cabs')}
          className="bg-slate-900/60 hover:bg-slate-900/90 border border-white/[0.08] hover:border-purple-500/40 p-5 rounded-3xl cursor-pointer transition-all hover:scale-[1.02] group shadow-lg flex flex-col justify-between min-h-[140px]"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
              <Car className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-purple-400 transition-colors" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-white group-hover:text-purple-400 transition-colors">Chauffeur & 4x4 Fleet</h4>
            <p className="text-[11px] text-white/50 mt-0.5">Luxury SUVs with mountain-trained drivers</p>
          </div>
        </div>

      </div>

    </div>
  );
};
