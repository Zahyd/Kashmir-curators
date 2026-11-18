import React, { useState } from 'react';
import { 
  Crown, 
  Gift, 
  Star, 
  Wallet, 
  Share2, 
  Copy, 
  Check, 
  Sparkles, 
  Users, 
  ArrowRight, 
  Award,
  ChevronRight,
  ShieldCheck,
  Percent
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface WalletHistoryItem {
  id: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT' | string;
  source?: string;
  description: string;
  createdAt: string;
}

interface LoyaltyRewardsDeskProps {
  user: any;
  loyaltyPoints: number;
  walletBalance: number;
  walletHistory?: WalletHistoryItem[];
  totalSpend: number;
  totalTrips: number;
  claimedVouchers: Record<string, string>;
  onClaimVoucher: (id: string, name: string) => void;
}

export const LoyaltyRewardsDesk: React.FC<LoyaltyRewardsDeskProps> = ({
  user,
  loyaltyPoints,
  walletBalance,
  walletHistory = [],
  totalSpend,
  totalTrips,
  claimedVouchers,
  onClaimVoucher
}) => {
  const [copiedLink, setCopiedLink] = useState(false);

  // Referral link computation
  const referralCode = user?.id ? user.id.slice(-6).toUpperCase() : 'KASHMIR-VIP';
  const referralLink = `${window.location.origin}/curate?ref=${referralCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    toast.success('Referral link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const membershipLevel = totalSpend >= 250000 ? 'Platinum Elite' :
    totalSpend >= 100000 ? 'Gold Curator' :
    totalSpend >= 40000 ? 'Silver Traveler' : 'Explorer';

  const vouchers = [
    {
      id: 'shikara',
      name: 'Complimentary Sunset Shikara',
      desc: 'Enjoy a 1-hour private sunset shikara ride on Dal Lake or Nigeen Lake during your stay.',
      requiredTrip: 1,
      unlocked: totalTrips >= 1,
      reqLabel: '1 Completed Trip Required',
      icon: Gift,
      accent: 'amber'
    },
    {
      id: 'upgrade',
      name: 'Luxury Heritage Suite Upgrade',
      desc: 'Complimentary room category upgrade on your next hotel reservation in Srinagar or Pahalgam.',
      requiredSpend: 200000,
      unlocked: totalSpend >= 200000,
      reqLabel: '₹2,00,000 Lifetime Spend Required',
      icon: Star,
      accent: 'amber'
    },
    {
      id: 'chauffeur',
      name: 'VIP Airport 4x4 Chauffeur Escort',
      desc: 'Complimentary luxury 4x4 SUV airport pickup with traditional Kashmiri saffron tea welcome.',
      requiredSpend: 100000,
      unlocked: totalSpend >= 100000,
      reqLabel: 'Gold Curator Tier Required',
      icon: Award,
      accent: 'gold'
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-amber-400 mb-2">
            <Crown className="w-3 h-3 text-amber-400 animate-pulse" />
            <span>Kashmir Curators Privilege Club</span>
          </div>
          <h2 className="font-display text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Loyalty, Rewards & Wallet
          </h2>
          <p className="text-white/50 text-xs md:text-sm mt-0.5">
            Exclusive privileges, travel wallet balance, and referral dividends for distinguished travelers.
          </p>
        </div>

        <div className="bg-slate-900/80 border border-amber-500/30 px-5 py-2.5 rounded-2xl flex items-center gap-3 shrink-0 shadow-lg">
          <Crown className="w-5 h-5 text-amber-400" />
          <div>
            <p className="text-[9px] font-black uppercase text-amber-400 tracking-wider">Current Standing</p>
            <p className="text-sm font-extrabold text-white">{membershipLevel}</p>
          </div>
        </div>
      </div>

      {/* Metrics Row: Wallet & Points */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Travel Wallet Balance */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/30 border border-amber-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">Available Travel Wallet</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-3xl font-display font-extrabold text-white mb-1">
            ₹{walletBalance.toLocaleString('en-IN')}
          </h3>
          <p className="text-[11px] text-white/50">Auto-applicable towards bookings & package balances.</p>
        </div>

        {/* Loyalty Points */}
        <div className="bg-slate-900/70 border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-white/40">Reward Points</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-3xl font-display font-extrabold text-white mb-1">
            {loyaltyPoints.toLocaleString('en-IN')} <span className="text-xs font-normal text-white/40">pts</span>
          </h3>
          <p className="text-[11px] text-white/50">100 points = ₹100 discount on direct bespoke packages.</p>
        </div>

        {/* Lifetime Spend */}
        <div className="bg-slate-900/70 border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-white/40">Lifetime Verified Spend</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-3xl font-display font-extrabold text-white mb-1">
            ₹{totalSpend.toLocaleString('en-IN')}
          </h3>
          <p className="text-[11px] text-white/50">{totalTrips} verified journeys across the valley.</p>
        </div>
      </div>

      {/* Referral Program Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-amber-500/30 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-amber-400">
              <Users className="w-3.5 h-3.5" />
              <span>Travel Referral Dividend</span>
            </div>
            <h3 className="text-xl md:text-2xl font-display font-extrabold text-white">
              Give ₹2,500, Get ₹2,500 Travel Credit
            </h3>
            <p className="text-white/60 text-xs md:text-sm leading-relaxed">
              Introduce fellow travelers to Kashmir Curators. When your invited friend books their first bespoke journey, they receive ₹2,500 off, and ₹2,500 credit is deposited directly into your Travel Wallet.
            </p>
          </div>

          <div className="w-full lg:w-auto bg-black/50 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 shadow-inner">
            <div className="flex-1 min-w-[220px]">
              <span className="text-[9px] font-black uppercase text-white/40 block mb-1">Your Exclusive Invite Link</span>
              <div className="font-mono text-xs text-amber-400 truncate bg-slate-900 px-3 py-2 rounded-xl border border-white/5">
                {referralLink}
              </div>
            </div>

            <div className="flex gap-2 shrink-0">
              <Button
                size="sm"
                variant="gold"
                onClick={handleCopyLink}
                className="h-9 px-4 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 gap-1.5 shadow-md shadow-amber-500/20"
              >
                {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
              </Button>

              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Plan your dream Kashmir trip with Kashmir Curators! Use my personal invitation link to receive ₹2,500 travel credit: ${referralLink}`)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center h-9 px-3.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 gap-1.5 shadow-md shadow-emerald-500/20"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Share</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Unlockable Luxury Vouchers */}
      <div className="space-y-4">
        <h3 className="text-sm md:text-base font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
          <Gift className="w-4 h-4 text-amber-400" />
          <span>Privilege Vouchers & Experiences</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {vouchers.map((voucher) => {
            const Icon = voucher.icon;
            const isClaimed = claimedVouchers[voucher.id];

            return (
              <div 
                key={voucher.id}
                className={cn(
                  "backdrop-blur-xl border p-6 rounded-3xl relative overflow-hidden transition-all duration-500 text-left flex flex-col justify-between min-h-[260px]",
                  voucher.unlocked
                    ? "bg-slate-900/80 border-amber-500/30 hover:border-amber-500/60 shadow-xl"
                    : "bg-white/[0.01] border-white/5 grayscale opacity-55"
                )}
              >
                <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                  <Icon className="w-24 h-24 text-amber-400" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Badge className={cn("font-bold text-[9px] uppercase px-2 py-0.5",
                      voucher.unlocked ? "bg-amber-500/20 text-amber-400 border-amber-500/30" : "bg-white/10 text-white/40"
                    )}>
                      {voucher.unlocked ? 'Privilege Unlocked' : voucher.reqLabel}
                    </Badge>
                  </div>

                  <h4 className="text-base font-display font-extrabold text-white mb-1.5">{voucher.name}</h4>
                  <p className="text-white/50 text-xs leading-relaxed">{voucher.desc}</p>
                </div>

                <div className="pt-4 border-t border-white/5 mt-4">
                  <Button
                    disabled={!voucher.unlocked}
                    onClick={() => onClaimVoucher(voucher.id, voucher.name)}
                    variant={isClaimed ? 'outline' : 'gold'}
                    className={cn(
                      "w-full rounded-xl text-xs font-bold h-10 shadow-md",
                      isClaimed 
                        ? "border-amber-500/40 text-amber-400 bg-transparent" 
                        : "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20"
                    )}
                  >
                    {isClaimed ? 'Show Voucher Code' : 'Claim Privilege'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Verified Travel Wallet Ledger */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm md:text-base font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
            <Wallet className="w-4 h-4 text-emerald-400" />
            <span>Travel Wallet Ledger</span>
          </h3>
          <span className="text-[11px] text-white/40 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Synced with Database</span>
          </span>
        </div>

        <div className="bg-slate-900/70 border border-white/10 rounded-3xl overflow-hidden shadow-xl">
          {walletHistory.length === 0 ? (
            <div className="p-8 text-center space-y-1.5">
              <p className="text-xs font-bold text-white/70">No wallet credit movements yet</p>
              <p className="text-[11px] text-white/40">
                Referral credits, promotional bonuses, and instant refund settlements will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {walletHistory.map((tx) => {
                const isCredit = tx.type === 'CREDIT';
                return (
                  <div key={tx.id} className="p-4 md:p-5 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors">
                    <div className="min-w-0">
                      <p className="text-xs md:text-sm font-bold text-white truncate">{tx.description}</p>
                      <p className="text-[10px] text-white/40 font-mono mt-0.5">
                        {new Date(tx.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        {tx.source ? ` • ${tx.source.replace(/_/g, ' ')}` : ''}
                      </p>
                    </div>
                    <span className={cn(
                      "text-xs md:text-sm font-black font-mono shrink-0",
                      isCredit ? "text-emerald-400" : "text-rose-400"
                    )}>
                      {isCredit ? '+' : '-'}₹{Number(tx.amount).toLocaleString('en-IN')}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
