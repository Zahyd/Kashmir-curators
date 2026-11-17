import React, { useState } from 'react';
import { 
  Crown, 
  Sparkles, 
  ShieldCheck, 
  Phone, 
  Mail, 
  Calendar, 
  MapPin, 
  Clock, 
  ArrowRight, 
  FileCheck2, 
  ChevronRight, 
  Compass, 
  AlertCircle,
  Camera,
  Wallet,
  Bot,
  Search,
  CheckCircle2,
  Share2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { CustomerBooking, ProfileTabId } from '../types';

interface ProfileHeroProps {
  user: any;
  bookings: CustomerBooking[];
  loyaltyPoints?: number;
  totalSpent?: number;
  walletBalance?: number;
  onNavigateTab: (tab: ProfileTabId) => void;
  onOpenSafetyCard?: (bookingId?: string) => void;
  onShowLatestVoucher?: () => void;
  onOpenCommandPalette?: () => void;
}

export const ProfileHero: React.FC<ProfileHeroProps> = ({
  user,
  bookings,
  loyaltyPoints = 0,
  totalSpent = 0,
  walletBalance = 0,
  onNavigateTab,
  onOpenSafetyCard,
  onShowLatestVoucher,
  onOpenCommandPalette
}) => {
  const [tierModalOpen, setTierModalOpen] = useState(false);
  const [completenessModalOpen, setCompletenessModalOpen] = useState(false);

  // Compute membership tier
  const calculateTier = () => {
    if (totalSpent >= 250000 || loyaltyPoints >= 25000) {
      return { 
        name: 'Platinum Elite', 
        next: 'Max Tier', 
        progress: 100, 
        needed: 0, 
        badgeBg: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
        perks: ['VIP 4x4 Chauffeur Transfers', 'Unlimited Suite Upgrades', '24/7 Dedicated Senior Curator', 'Private Airport Escort']
      };
    }
    if (totalSpent >= 100000 || loyaltyPoints >= 10000) {
      return { 
        name: 'Gold Curator', 
        next: 'Platinum Elite', 
        progress: Math.min(100, ((totalSpent - 100000) / 150000) * 100), 
        needed: 250000 - totalSpent, 
        badgeBg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        perks: ['Complimentary Sunset Shikara', 'Priority Gondola Booking Assistance', 'Complimentary Room Upgrades']
      };
    }
    if (totalSpent >= 40000 || loyaltyPoints >= 4000) {
      return { 
        name: 'Silver Traveler', 
        next: 'Gold Curator', 
        progress: Math.min(100, ((totalSpent - 40000) / 60000) * 100), 
        needed: 100000 - totalSpent, 
        badgeBg: 'bg-slate-400/15 text-slate-200 border-slate-400/30',
        perks: ['Early Check-in Privileges', 'Welcome Kashmiri Wazwan Tasting', '10% Travel Credit on Reviews']
      };
    }
    return { 
      name: 'Explorer Tier', 
      next: 'Silver Traveler', 
      progress: Math.min(100, (totalSpent / 40000) * 100), 
      needed: 40000 - totalSpent, 
      badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
      perks: ['Bespoke Itinerary Planning', 'Verified Chauffeur Dispatch', 'Digital Safety Card Access']
    };
  };

  const tier = calculateTier();

  // Compute account completeness
  const completenessItems = [
    { label: 'Full Legal Name', completed: !!user?.name },
    { label: 'Verified Email ID', completed: !!user?.email },
    { label: 'Mobile / WhatsApp Phone', completed: !!user?.phone },
    { label: 'Uploaded Travel Passes', completed: !!user?.uploadedDocuments && user.uploadedDocuments !== '[]' },
  ];
  const completedCount = completenessItems.filter(i => i.completed).length;
  const completenessPercent = Math.round((completedCount / completenessItems.length) * 100);

  // Find nearest upcoming trip
  const now = new Date().getTime();
  const upcomingBookings = bookings
    .filter(b => b.status === 'confirmed' && new Date(b.bookingDate).getTime() >= now - 86400000)
    .sort((a, b) => new Date(a.bookingDate).getTime() - new Date(b.bookingDate).getTime());

  const nextTrip = upcomingBookings[0];
  const daysToNextTrip = nextTrip 
    ? Math.max(0, Math.ceil((new Date(nextTrip.bookingDate).getTime() - now) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <>
      {/* Sleek Modern Enterprise Command Header */}
      <div className="relative pt-24 pb-8 md:pt-28 md:pb-10 bg-[#05080a] border-b border-white/[0.08] overflow-hidden">
        {/* Subtle ambient lighting mesh */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[300px] bg-gradient-to-r from-amber-500/10 via-amber-600/5 to-transparent rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-0 right-10 w-[400px] h-[300px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff05_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

        <div className="container mx-auto px-4 sm:px-6 relative z-10 space-y-6">
          
          {/* Top Identity & Status Command Strip */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            
            {/* Left: Traveler Identity Capsule */}
            <div className="flex items-center gap-4 sm:gap-5">
              {/* Modern Squircle Avatar with Status Ring */}
              <div className="relative group shrink-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-slate-900 via-[#0d141b] to-slate-900 border border-amber-500/30 flex items-center justify-center font-display font-black text-2xl sm:text-3xl text-amber-400 shadow-xl overflow-hidden relative">
                  {user?.image ? (
                    <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <span>{user?.name?.charAt(0).toUpperCase() || 'K'}</span>
                  )}
                  {/* Subtle inner gold sheen */}
                  <div className="absolute inset-0 bg-gradient-to-t from-amber-500/10 to-transparent pointer-events-none" />
                </div>
                
                <button 
                  onClick={() => onNavigateTab('settings')}
                  title="Update Avatar"
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-slate-900 border border-amber-500/50 flex items-center justify-center text-amber-400 hover:bg-amber-500 hover:text-slate-950 transition-all shadow-md"
                >
                  <Camera className="w-3 h-3" />
                </button>
              </div>

              {/* Identity & VIP Badges */}
              <div className="space-y-1.5 text-left">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">
                    {user?.name || 'Valued Guest'}
                  </h1>

                  <button 
                    onClick={() => setTierModalOpen(true)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all hover:scale-105 shadow-sm ${tier.badgeBg}`}
                  >
                    <Crown className="w-3 h-3" />
                    <span>{tier.name}</span>
                    <ChevronRight className="w-3 h-3 opacity-60" />
                  </button>

                  <Badge variant="outline" className="text-[10px] font-bold border-emerald-500/30 text-emerald-400 bg-emerald-500/10 gap-1 py-0.5 hidden sm:inline-flex">
                    <ShieldCheck className="w-3 h-3" /> Verified Traveler
                  </Badge>
                </div>

                <div className="text-white/50 text-xs flex flex-wrap items-center gap-3">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-white/40" />
                    <span>{user?.email}</span>
                  </span>
                  
                  {user?.phone ? (
                    <span className="flex items-center gap-1.5 text-white/70 font-mono">
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{user.phone}</span>
                    </span>
                  ) : (
                    <button 
                      onClick={() => onNavigateTab('settings')}
                      className="text-amber-400 hover:underline text-[11px] font-medium flex items-center gap-1"
                    >
                      <AlertCircle className="w-3 h-3 text-amber-400" />
                      <span>Add Phone</span>
                    </button>
                  )}

                  {/* Profile completeness chip */}
                  {completenessPercent < 100 && (
                    <button
                      onClick={() => setCompletenessModalOpen(true)}
                      className="text-[10px] text-amber-400/90 hover:text-amber-300 font-bold bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full flex items-center gap-1"
                    >
                      <span>{completenessPercent}% Complete</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Quick Action Controls */}
            <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
              {onOpenCommandPalette && (
                <button
                  type="button"
                  onClick={onOpenCommandPalette}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/10 hover:border-amber-500/30 text-xs text-white/70 hover:text-white transition-all shadow-sm"
                >
                  <Search className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-medium">Quick Command</span>
                  <kbd className="font-mono text-[10px] bg-white/10 px-1.5 py-0.2 rounded text-white/40">⌘K</kbd>
                </button>
              )}

              <Button
                size="sm"
                variant="outline"
                onClick={() => onNavigateTab('ai-companion')}
                className="h-9 px-3.5 rounded-xl text-xs font-bold border-amber-500/30 text-amber-400 hover:bg-amber-500/10 gap-1.5"
              >
                <Bot className="w-3.5 h-3.5" />
                <span>AI Concierge</span>
              </Button>

              {onOpenSafetyCard && (
                <Button
                  size="sm"
                  variant="gold"
                  onClick={() => onOpenSafetyCard(nextTrip?.id || bookings[0]?.id || '')}
                  className="h-9 px-3.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 gap-1.5 shadow-md shadow-amber-500/20"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Safety Pass</span>
                </Button>
              )}
            </div>
          </div>

          {/* Integrated Telemetry Live Ribbon */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
            
            {/* Live Card 1: Nearest Journey */}
            <div 
              onClick={() => onNavigateTab('trips')}
              className="bg-slate-900/60 hover:bg-slate-900/90 border border-white/[0.08] hover:border-amber-500/40 rounded-2xl p-3.5 transition-all cursor-pointer text-left group shadow-lg"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400/90 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>Next Journey</span>
                </span>
                {daysToNextTrip !== null && (
                  <span className="text-[9px] font-bold font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">
                    {daysToNextTrip === 0 ? 'Today!' : daysToNextTrip === 1 ? 'Tomorrow' : `${daysToNextTrip}d away`}
                  </span>
                )}
              </div>
              <p className="text-xs font-bold text-white truncate group-hover:text-amber-400 transition-colors">
                {nextTrip ? nextTrip.itemName : 'No Active Booking'}
              </p>
              <p className="text-[10px] text-white/40 mt-0.5">
                {nextTrip ? `Ref: #${nextTrip.id.slice(-6).toUpperCase()}` : 'Plan your Kashmir escape →'}
              </p>
            </div>

            {/* Live Card 2: Travel Wallet */}
            <div 
              onClick={() => onNavigateTab('loyalty')}
              className="bg-slate-900/60 hover:bg-slate-900/90 border border-white/[0.08] hover:border-emerald-500/40 rounded-2xl p-3.5 transition-all cursor-pointer text-left group shadow-lg"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400/90 flex items-center gap-1">
                  <Wallet className="w-3 h-3" />
                  <span>Travel Wallet</span>
                </span>
                <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                  Live
                </span>
              </div>
              <p className="text-xs font-bold text-emerald-400 font-mono tracking-tight">
                ₹{walletBalance.toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-white/40 mt-0.5">
                100% applicable on stays
              </p>
            </div>

            {/* Live Card 3: Loyalty & Tier */}
            <div 
              onClick={() => onNavigateTab('loyalty')}
              className="bg-slate-900/60 hover:bg-slate-900/90 border border-white/[0.08] hover:border-purple-500/40 rounded-2xl p-3.5 transition-all cursor-pointer text-left group shadow-lg"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-400/90 flex items-center gap-1">
                  <Crown className="w-3 h-3" />
                  <span>Curator Points</span>
                </span>
                <span className="text-[9px] font-bold text-purple-300 font-mono">
                  {tier.progress.toFixed(0)}%
                </span>
              </div>
              <p className="text-xs font-bold text-white truncate">
                {loyaltyPoints.toLocaleString('en-IN')} <span className="text-[10px] text-white/40 font-normal">pts</span>
              </p>
              <p className="text-[10px] text-white/40 mt-0.5">
                {tier.next !== 'Max Tier' ? `₹${tier.needed.toLocaleString()} to ${tier.next}` : 'Top Tier Achieved'}
              </p>
            </div>

            {/* Live Card 4: Curator & Safety Status */}
            <div 
              onClick={() => onNavigateTab('clearance')}
              className="bg-slate-900/60 hover:bg-slate-900/90 border border-white/[0.08] hover:border-sky-500/40 rounded-2xl p-3.5 transition-all cursor-pointer text-left group shadow-lg"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-sky-400/90 flex items-center gap-1">
                  <Compass className="w-3 h-3" />
                  <span>Valley Clearance</span>
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <p className="text-xs font-bold text-white truncate group-hover:text-sky-400 transition-colors">
                Highways Operational
              </p>
              <p className="text-[10px] text-white/40 mt-0.5">
                Srinagar • Gulmarg • Pahalgam
              </p>
            </div>

          </div>
        </div>
      </div>

      {/* VIP Tier Privileges Modal */}
      <Dialog open={tierModalOpen} onOpenChange={setTierModalOpen}>
        <DialogContent className="max-w-md bg-slate-950 text-white border border-white/10 rounded-3xl p-6 shadow-2xl text-left">
          <DialogHeader className="border-b border-white/5 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <Crown className="w-5 h-5 text-amber-400" />
              <DialogTitle className="text-lg font-black font-display text-white">
                {tier.name} Privileges
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-white/50">
              Your tier is determined by verified travel spending and completed journeys in Kashmir.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div>
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="text-white/60">Tier Progression</span>
                <span className="font-bold text-amber-400">{tier.progress.toFixed(0)}%</span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-700"
                  style={{ width: `${tier.progress}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-white/40 block">
                Exclusive Member Privileges
              </span>
              {tier.perks.map((perk, i) => (
                <div key={i} className="flex items-center gap-2.5 text-xs text-white/80 p-2.5 bg-slate-900/80 border border-white/5 rounded-xl">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{perk}</span>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Completeness Checklist Modal */}
      <Dialog open={completenessModalOpen} onOpenChange={setCompletenessModalOpen}>
        <DialogContent className="max-w-md bg-slate-950 text-white border border-white/10 rounded-3xl p-6 shadow-2xl text-left">
          <DialogHeader className="border-b border-white/5 pb-4">
            <DialogTitle className="text-lg font-black font-display text-white">
              Profile Verification Checklist
            </DialogTitle>
            <DialogDescription className="text-xs text-white/50">
              Complete these steps to unlock fast-track check-in at luxury partner resorts.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-3">
            {completenessItems.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-900/80 border border-white/5 rounded-xl text-xs">
                <span className={item.completed ? "text-white font-medium" : "text-white/50"}>{item.label}</span>
                {item.completed ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                  </span>
                ) : (
                  <button 
                    onClick={() => {
                      setCompletenessModalOpen(false);
                      onNavigateTab('settings');
                    }}
                    className="text-amber-400 font-bold hover:underline"
                  >
                    Add Now &rarr;
                  </button>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
