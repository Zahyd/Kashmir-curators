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
  HeartHandshake, 
  ChevronRight, 
  UserCheck, 
  Compass, 
  AlertCircle,
  Camera
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
  onNavigateTab: (tab: ProfileTabId) => void;
  onOpenSafetyCard?: (bookingId?: string) => void;
  onShowLatestVoucher?: () => void;
}

export const ProfileHero: React.FC<ProfileHeroProps> = ({
  user,
  bookings,
  loyaltyPoints = 0,
  totalSpent = 0,
  onNavigateTab,
  onOpenSafetyCard,
  onShowLatestVoucher
}) => {
  const [tierModalOpen, setTierModalOpen] = useState(false);

  // Compute membership tier
  const calculateTier = () => {
    if (totalSpent >= 250000 || loyaltyPoints >= 25000) return { name: 'Platinum Elite', next: 'Maxed', progress: 100, needed: 0, color: 'text-purple-400', border: 'border-purple-500/30', bg: 'bg-purple-500/10' };
    if (totalSpent >= 100000 || loyaltyPoints >= 10000) return { name: 'Gold Curator', next: 'Platinum Elite', progress: Math.min(100, ((totalSpent - 100000) / 150000) * 100), needed: 250000 - totalSpent, color: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-500/10' };
    if (totalSpent >= 40000 || loyaltyPoints >= 4000) return { name: 'Silver Traveler', next: 'Gold Curator', progress: Math.min(100, ((totalSpent - 40000) / 60000) * 100), needed: 100000 - totalSpent, color: 'text-slate-300', border: 'border-slate-400/30', bg: 'bg-slate-400/10' };
    return { name: 'Explorer Tier', next: 'Silver Traveler', progress: Math.min(100, (totalSpent / 40000) * 100), needed: 40000 - totalSpent, color: 'text-kashmir-gold', border: 'border-amber-500/30', bg: 'bg-amber-500/10' };
  };

  const tier = calculateTier();

  // Compute account completeness
  const completenessItems = [
    { label: 'Full Name', completed: !!user?.name },
    { label: 'Verified Email', completed: !!user?.email },
    { label: 'Mobile Number', completed: !!user?.phone },
    { label: 'Uploaded Documents', completed: !!user?.uploadedDocuments && user.uploadedDocuments !== '[]' },
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
      <div className="relative pt-28 pb-16 md:pt-36 md:pb-24 overflow-hidden border-b border-white/5">
        {/* Background Image Canvas with Gradient Mesh */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
          style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&q=80")' }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-[#05080a] via-[#05080a]/90 to-[#05080a]/60" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_35%,rgba(212,175,55,0.15),transparent_50%)]" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 relative z-10 space-y-8">
          
          {/* Main Hero Header Bar */}
          <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-8">
            
            {/* Customer Identity Group */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
              
              {/* Glowing Avatar Ring */}
              <div className="relative group shrink-0">
                <div className="absolute -inset-1.5 bg-gradient-to-r from-amber-400 via-kashmir-gold to-amber-600 rounded-full opacity-70 blur-md group-hover:opacity-100 transition-all duration-700 animate-pulse" />
                <div className="w-24 h-24 sm:w-28 sm:h-28 bg-[#0a0f12] rounded-full flex items-center justify-center text-4xl sm:text-5xl font-display font-black text-amber-400 border border-amber-500/40 shadow-2xl relative z-10 overflow-hidden">
                  {user?.image ? (
                    <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <span>{user?.name?.charAt(0).toUpperCase() || 'K'}</span>
                  )}
                </div>
                <button 
                  onClick={() => onNavigateTab('settings')}
                  title="Update Avatar"
                  className="absolute bottom-1 right-1 z-20 w-8 h-8 rounded-full bg-slate-900 border border-amber-500/50 flex items-center justify-center text-amber-400 hover:bg-amber-500 hover:text-slate-950 transition-all shadow-md"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              {/* Identity & Badges */}
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <button 
                    onClick={() => setTierModalOpen(true)}
                    className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider border transition-all hover:scale-105 shadow-sm ${tier.bg} ${tier.border} ${tier.color}`}
                  >
                    <Crown className="w-3.5 h-3.5" />
                    <span>{tier.name}</span>
                    <ChevronRight className="w-3 h-3 opacity-70" />
                  </button>

                  <Badge variant="outline" className="text-[10px] font-bold border-emerald-500/40 text-emerald-400 bg-emerald-500/10 gap-1 py-0.5">
                    <ShieldCheck className="w-3 h-3" /> Verified Traveler
                  </Badge>
                </div>

                <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
                  Welcome back, {user?.name?.split(' ')[0] || 'Traveler'}
                </h1>

                <div className="text-white/60 text-xs sm:text-sm flex flex-wrap items-center justify-center sm:justify-start gap-3">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-white/40" />
                    <span>{user?.email}</span>
                  </span>
                  {user?.phone ? (
                    <span className="flex items-center gap-1.5 text-white/80 font-mono">
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{user.phone}</span>
                    </span>
                  ) : (
                    <button 
                      onClick={() => onNavigateTab('settings')}
                      className="text-amber-400 hover:underline text-xs flex items-center gap-1"
                    >
                      <AlertCircle className="w-3 h-3 text-amber-400" />
                      <span>Add phone for WhatsApp trip updates</span>
                    </button>
                  )}
                </div>

                {/* Account Completeness Bar */}
                {completenessPercent < 100 && (
                  <div className="pt-1 max-w-sm">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-white/50 mb-1">
                      <span>Profile completion</span>
                      <span className="text-amber-400 font-bold">{completenessPercent}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-700"
                        style={{ width: `${completenessPercent}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Card: Next Trip Countdown or Loyalty Progress */}
            <div className="w-full lg:w-[26rem] shrink-0">
              {nextTrip ? (
                <div className="bg-slate-900/80 backdrop-blur-xl border border-amber-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
                  
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black uppercase text-amber-400 tracking-widest flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 animate-pulse" />
                      <span>Upcoming Kashmir Journey</span>
                    </span>
                    <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px] font-mono font-bold">
                      {daysToNextTrip === 0 ? 'Starts Today!' : daysToNextTrip === 1 ? 'Tomorrow!' : `In ${daysToNextTrip} Days`}
                    </Badge>
                  </div>

                  <h3 className="font-bold text-base sm:text-lg text-white truncate mb-1">
                    {nextTrip.itemName}
                  </h3>
                  <p className="text-xs text-white/60 flex items-center gap-2 mb-4">
                    <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Departure: {new Date(nextTrip.bookingDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </p>

                  <div className="flex items-center gap-2 pt-3 border-t border-white/10">
                    <Button 
                      size="sm"
                      onClick={() => onNavigateTab('trips')}
                      className="flex-1 h-9 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 gap-1.5"
                    >
                      <span>Trip Workspace</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                    {onShowLatestVoucher && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={onShowLatestVoucher}
                        className="h-9 px-3 rounded-xl text-xs font-bold border-white/20 hover:bg-white/10 text-white"
                        title="Download Stay Voucher"
                      >
                        <FileCheck2 className="w-4 h-4 text-emerald-400" />
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-black uppercase text-white/40 tracking-wider">Loyalty Tracker</span>
                    <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-widest">
                      {tier.next !== 'Maxed' ? `${tier.progress.toFixed(0)}% to ${tier.next}` : 'Max Tier'}
                    </span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full h-2.5 bg-black/50 rounded-full overflow-hidden mb-3.5 border border-white/5">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 rounded-full transition-all duration-1000 shadow-sm"
                      style={{ width: `${tier.progress}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-xs text-white/60 mb-4">
                    <span className="font-bold text-white">{loyaltyPoints.toLocaleString()} Points</span>
                    {tier.next !== 'Maxed' && (
                      <span>Spend ₹{tier.needed.toLocaleString()} to upgrade</span>
                    )}
                  </div>

                  <Button
                    size="sm"
                    onClick={() => onNavigateTab('proposals')}
                    className="w-full h-9 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 gap-1.5"
                  >
                    <Compass className="w-4 h-4" />
                    <span>Plan Next Kashmir Journey</span>
                  </Button>
                </div>
              )}
            </div>

          </div>

          {/* Quick Actions Row */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-white/10">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onNavigateTab('ai-companion')}
                className="h-9 px-3 rounded-xl text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30 gap-1.5 shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>AI Travel Concierge</span>
              </Button>

              {onOpenSafetyCard && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onOpenSafetyCard()}
                  className="h-9 px-3 rounded-xl text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30 gap-1.5 shadow-sm"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Offline Safety Card</span>
                </Button>
              )}

              <Button
                size="sm"
                variant="outline"
                onClick={() => onNavigateTab('documents')}
                className="h-9 px-3 rounded-xl text-xs font-bold bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-200 gap-1.5"
              >
                <FileCheck2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Document Vault</span>
              </Button>
            </div>

            <div className="flex items-center gap-2 text-xs text-white/50">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Kashmir Operations Active 24/7</span>
            </div>
          </div>

        </div>
      </div>

      {/* Tier Benefits Modal */}
      <Dialog open={tierModalOpen} onOpenChange={setTierModalOpen}>
        <DialogContent className="rounded-3xl bg-slate-950 text-white border-white/10 shadow-2xl p-6 sm:p-8 max-w-lg">
          <DialogHeader className="text-left border-b border-white/10 pb-4">
            <DialogTitle className="font-display text-2xl flex items-center gap-2 text-amber-400">
              <Crown className="w-6 h-6 text-amber-400" />
              <span>Membership Tiers & Elite Privileges</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-white/60">
              As a Kashmir Curators traveler, your journey spend unlocks bespoke privileges, complimentary upgrades, and direct local coordination.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-3.5 text-left text-xs">
            {[
              { name: 'Explorer Tier', spend: 'Entry Level', perks: ['Access to bespoke AI curation', 'Trip safety digital pass', 'Dedicated chauffeur mapping'] },
              { name: 'Silver Traveler', spend: '₹40,000+ Spent', perks: ['Complimentary Shikara hour on Dal Lake', 'Priority hotel room view assignment', 'Direct WhatsApp coordinator desk'] },
              { name: 'Gold Curator', spend: '₹1,00,000+ Spent', perks: ['Room category upgrade on availability', 'Zero cancellation fee up to 72 hours', 'Special Kashmiri Kehwa & wazwan greeting'] },
              { name: 'Platinum Elite', spend: '₹2,50,000+ Spent', perks: ['Private luxury SUV upgrade', 'Complimentary Gondola fast-track assistance', 'Personal 24/7 dedicated trip concierge'] }
            ].map(t => (
              <div 
                key={t.name}
                className={`p-3.5 rounded-2xl border transition-all ${
                  tier.name === t.name 
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 shadow-md' 
                    : 'bg-white/[0.02] border-white/5 text-white/70'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                    {t.name} {tier.name === t.name && <Badge className="bg-amber-500 text-slate-950 text-[9px] font-black py-0">Current</Badge>}
                  </h4>
                  <span className="font-mono text-[10px] text-amber-400/90 font-bold">{t.spend}</span>
                </div>
                <ul className="space-y-1 pl-4 list-disc text-[11px] text-white/60">
                  {t.perks.map((p, idx) => (
                    <li key={idx}>{p}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <Button 
            onClick={() => setTierModalOpen(false)}
            className="w-full rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
          >
            Close
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProfileHero;
