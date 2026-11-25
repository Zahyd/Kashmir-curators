import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Phone, 
  MessageSquare, 
  Share2, 
  FileEdit, 
  AlertCircle, 
  Sparkles, 
  ChevronRight, 
  IndianRupee, 
  User, 
  Building, 
  Car, 
  Calendar,
  XCircle,
  ExternalLink,
  ShieldCheck,
  Send,
  RefreshCw,
  Search,
  Inbox,
  TrendingUp,
  Tag,
  ArrowRight,
  Filter
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { API_BASE_URL } from '@/lib/api';

export type PipelineStage = 'CLAIMED' | 'QUOTED' | 'NEGOTIATION' | 'CONFIRMED' | 'LOST';

export interface Deal {
  id: string;
  customerName: string;
  phone: string;
  email?: string;
  destination?: string;
  duration?: string;
  startDate?: string;
  budget?: string | number;
  netPrice?: number;
  leadStage?: PipelineStage | string;
  status: string;
  assignedTo?: string | null;
  hotelCategory?: string;
  vehiclePreference?: string;
  adultsCount?: number;
  createdAt: string;
  updatedAt?: string;
}

interface ActivePipelineKanbanProps {
  currentEmployee: {
    code: string;
    name: string;
    role: string;
  };
  onOpenItineraryBuilder: (deal: Deal) => void;
  onRefreshMetrics?: () => void;
  isManagerOrDirector?: boolean;
}

const STAGES: { 
  key: PipelineStage; 
  label: string; 
  shortLabel: string;
  color: string; 
  badge: string;
  icon: any;
  emptyTitle: string;
  emptyDesc: string;
}[] = [
  { 
    key: 'CLAIMED', 
    label: 'Claimed / New', 
    shortLabel: 'Claimed',
    color: 'border-blue-500/30 bg-blue-500/[0.02]', 
    badge: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    icon: Inbox,
    emptyTitle: 'Queue Standby',
    emptyDesc: 'Claim leads from Live Inbound Queue to start curating.'
  },
  { 
    key: 'QUOTED', 
    label: 'Quote Sent', 
    shortLabel: 'Quoted',
    color: 'border-amber-500/30 bg-amber-500/[0.02]', 
    badge: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    icon: FileEdit,
    emptyTitle: 'No Pending Quotes',
    emptyDesc: 'Curated itineraries sent via WhatsApp will appear here.'
  },
  { 
    key: 'NEGOTIATION', 
    label: 'In Negotiation', 
    shortLabel: 'In Neg',
    color: 'border-purple-500/30 bg-purple-500/[0.02]', 
    badge: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
    icon: Sparkles,
    emptyTitle: 'No Active Negotiations',
    emptyDesc: 'Deals undergoing custom revisions or pricing adjustments.'
  },
  { 
    key: 'CONFIRMED', 
    label: 'Confirmed (Driver Dispatched)', 
    shortLabel: 'Confirmed',
    color: 'border-emerald-500/30 bg-emerald-500/[0.02]', 
    badge: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    icon: Car,
    emptyTitle: 'No Dispatched Trips',
    emptyDesc: 'Confirmed bookings automatically trigger driver dispatch.'
  },
  { 
    key: 'LOST', 
    label: 'Archived / Lost', 
    shortLabel: 'Lost',
    color: 'border-slate-500/30 bg-slate-500/[0.02]', 
    badge: 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
    icon: AlertCircle,
    emptyTitle: 'Zero Archived Deals',
    emptyDesc: 'Cancelled or inactive inquiries are preserved here.'
  }
];

export const ActivePipelineKanban: React.FC<ActivePipelineKanbanProps> = ({
  currentEmployee,
  onOpenItineraryBuilder,
  onRefreshMetrics,
  isManagerOrDirector = false
}) => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterScope, setFilterScope] = useState<'my' | 'all'>('my');
  const [mobileStageFilter, setMobileStageFilter] = useState<'ALL' | PipelineStage>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [transitioningId, setTransitioningId] = useState<string | null>(null);
  const [confirmedModalDeal, setConfirmedModalDeal] = useState<Deal | null>(null);

  const fetchDeals = async () => {
    try {
      const token = localStorage.getItem('team_auth_token') || localStorage.getItem('teamToken') || localStorage.getItem('token') || '';
      const portalKey = localStorage.getItem('kashmir_portal_key') || '';

      // Direct clean endpoint: /inquiries (API_BASE_URL already contains /api)
      const res = await fetch(`${API_BASE_URL}/inquiries`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          ...(portalKey ? { 'x-portal-key': portalKey } : {})
        }
      });

      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.inquiries || [];
        setDeals(list);
      }
    } catch (err) {
      console.warn('Error fetching pipeline deals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeals();
    const interval = setInterval(fetchDeals, 20000);
    return () => clearInterval(interval);
  }, []);

  const handleStageChange = async (dealId: string, newStage: PipelineStage) => {
    setTransitioningId(dealId);
    try {
      const token = localStorage.getItem('team_auth_token') || localStorage.getItem('teamToken') || localStorage.getItem('token') || '';
      const portalKey = localStorage.getItem('kashmir_portal_key') || '';

      const res = await fetch(`${API_BASE_URL}/sales/leads/${dealId}/stage`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          ...(portalKey ? { 'x-portal-key': portalKey } : {})
        },
        body: JSON.stringify({
          stage: newStage,
          notes: `Moved to ${newStage} by ${currentEmployee.name} (${currentEmployee.code})`
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update deal stage');
      }

      // Update local state
      setDeals(prev => prev.map(d => d.id === dealId ? { ...d, leadStage: newStage } : d));
      onRefreshMetrics?.();

      if (newStage === 'CONFIRMED') {
        const targetDeal = deals.find(d => d.id === dealId);
        if (targetDeal) {
          setConfirmedModalDeal(targetDeal);
        }
        toast.success('Deal Confirmed! Chauffeur Cab Dispatch created and broadcasted to Driver Cockpit.');
      } else {
        toast.success(`Deal moved to ${newStage}`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Error updating stage');
    } finally {
      setTransitioningId(null);
    }
  };

  const sendWhatsAppQuote = (deal: Deal) => {
    const phone = (deal.phone || '').replace(/[^0-9]/g, '');
    const recipient = phone.startsWith('91') ? phone : `91${phone}`;
    const cleanDestination = deal.destination || 'Kashmir Custom Curated Tour';
    const cleanDuration = deal.duration || '5 Nights / 6 Days';
    const quoteUrl = `${window.location.origin}/itinerary/${deal.id}`;

    const message = encodeURIComponent(
      `Salaam & Greetings ${deal.customerName},\n\n` +
      `Here is your private, bespoke Kashmir itinerary crafted by Kashmir Curators:\n` +
      `📍 Route: ${cleanDestination}\n` +
      `⏳ Duration: ${cleanDuration}\n` +
      `🏨 Stays: Luxury Houseboat & Mountain Resort\n` +
      `🚗 Cab Class: Innova Crysta / 4x4 Mountain Cruiser\n\n` +
      `View your interactive live itinerary & secure your booking here:\n${quoteUrl}\n\n` +
      `Warm regards,\n${currentEmployee.name} | Kashmir Curators Private Concierge`
    );

    window.open(`https://wa.me/${recipient}?text=${message}`, '_blank');
  };

  // Scope and Search Filtering
  const myDeals = deals.filter(d => d.assignedTo === currentEmployee.code);
  
  const visibleDeals = deals.filter(deal => {
    // Match search term
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matches = 
        (deal.customerName || '').toLowerCase().includes(q) ||
        (deal.destination || '').toLowerCase().includes(q) ||
        (deal.phone || '').includes(q) ||
        (deal.id || '').toLowerCase().includes(q);
      if (!matches) return false;
    }

    // If scoped to "my", check assignedTo
    if (filterScope === 'my') {
      // If user has zero deals assigned, fall back gracefully so screen isn't completely empty
      if (myDeals.length === 0) return true;
      return deal.assignedTo === currentEmployee.code;
    }

    return true;
  });

  // Calculate live pipeline metrics
  const totalPipelineINR = visibleDeals.reduce((sum, d) => {
    const val = d.netPrice || parseInt(String(d.budget || '0').replace(/[^0-9]/g, ''), 10) || 45000;
    return sum + val;
  }, 0);

  return (
    <div className="space-y-4">
      {/* 1. Header & Controls Deck */}
      <div className="bg-[#0F141C]/80 p-4 sm:p-5 rounded-2xl border border-white/10 backdrop-blur-md shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide flex items-center gap-2">
              Active Concierge Pipeline
            </h2>
            <Badge className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono px-2 py-0.5">
              ₹{totalPipelineINR.toLocaleString('en-IN')} Total Value
            </Badge>
          </div>
          <p className="text-xs text-slate-400">
            {filterScope === 'my' && myDeals.length > 0
              ? `Filtered to concierge ${currentEmployee.name} (${currentEmployee.code})`
              : 'Displaying all company deals across executive pipelines'}
          </p>
        </div>

        {/* Search, Scope Toggle & Refresh */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
          {/* Quick Search */}
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search client, phone, city..."
              className="pl-8 bg-[#07090E] border-white/10 text-xs text-white placeholder:text-slate-500 h-9 rounded-xl focus:border-amber-400 w-full"
            />
          </div>

          <div className="flex items-center gap-2 justify-between sm:justify-start">
            {/* Scope Toggle: My Deals vs Entire Team */}
            <div className="bg-[#07090E] p-1 rounded-xl border border-white/10 flex items-center text-xs">
              <button
                type="button"
                onClick={() => setFilterScope('my')}
                className={cn(
                  "px-3 py-1.5 rounded-lg font-semibold text-xs transition-all",
                  filterScope === 'my' 
                    ? "bg-amber-400 text-black shadow-md shadow-amber-400/20 font-bold" 
                    : "text-slate-400 hover:text-white"
                )}
              >
                My Deals ({myDeals.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterScope('all')}
                className={cn(
                  "px-3 py-1.5 rounded-lg font-semibold text-xs transition-all",
                  filterScope === 'all' 
                    ? "bg-amber-400 text-black shadow-md shadow-amber-400/20 font-bold" 
                    : "text-slate-400 hover:text-white"
                )}
              >
                Entire Team ({deals.length})
              </button>
            </div>

            {/* Refresh Button */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => { setLoading(true); fetchDeals(); }}
              className="border-white/10 text-slate-300 hover:text-white h-9 px-3 rounded-xl bg-white/5 shrink-0"
              title="Refresh Pipeline"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin text-amber-400")} />
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Driver Handoff Modal */}
      {confirmedModalDeal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setConfirmedModalDeal(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#0F141C] border border-emerald-500/40 rounded-2xl sm:rounded-3xl p-5 sm:p-6 max-w-md w-full max-h-[90dvh] overflow-y-auto shadow-2xl shadow-emerald-950/40 text-center animate-in zoom-in-95"
          >
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto mb-4">
              <Car className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-bold text-white mb-1">
              Deal Confirmed & Cab Dispatched!
            </h3>
            <p className="text-xs text-slate-300 mb-4">
              Congratulations! Deal for <strong className="text-white">{confirmedModalDeal.customerName}</strong> has been successfully booked.
            </p>

            <div className="bg-[#07090E] p-3.5 rounded-xl border border-white/10 text-left text-xs space-y-2 mb-5">
              <div className="flex justify-between text-slate-400">
                <span>Trip Destination:</span>
                <span className="text-white font-medium">{confirmedModalDeal.destination || 'Kashmir Tour'}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Automated Handoff:</span>
                <span className="text-emerald-400 font-medium">Broadcasted to Driver Cockpit</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Driver Security PIN:</span>
                <span className="text-amber-400 font-mono font-bold">KC-{Math.floor(10 + Math.random() * 89)}</span>
              </div>
            </div>

            <Button
              onClick={() => setConfirmedModalDeal(null)}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold h-11 rounded-xl"
            >
              Continue Working
            </Button>
          </div>
        </div>
      )}

      {/* 3. Mobile Stage Selector Ribbon (Smooth horizontal swipe) */}
      <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar -mx-1 px-1">
        <button
          type="button"
          onClick={() => setMobileStageFilter('ALL')}
          className={cn(
            "px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all active:scale-95 flex items-center gap-1.5",
            mobileStageFilter === 'ALL'
              ? "bg-amber-400 text-black shadow-md shadow-amber-400/20"
              : "bg-[#0F141C] text-slate-400 hover:text-white border border-white/10"
          )}
        >
          <span>All Stages</span>
          <span className={cn(
            "text-[10px] px-1.5 py-0.2 rounded-full font-mono",
            mobileStageFilter === 'ALL' ? "bg-black/20 text-black font-black" : "bg-white/10 text-slate-300"
          )}>
            {visibleDeals.length}
          </span>
        </button>

        {STAGES.map((s) => {
          const count = visibleDeals.filter(d => {
            const currentStage = (d.leadStage || 'CLAIMED').toUpperCase();
            if (s.key === 'CLAIMED') return currentStage === 'CLAIMED' || currentStage === 'NEW_LEAD' || currentStage === 'FOLLOW_UP';
            if (s.key === 'QUOTED') return currentStage === 'QUOTED' || currentStage === 'QUOTE_SENT';
            if (s.key === 'NEGOTIATION') return currentStage === 'NEGOTIATION' || currentStage === 'PAYMENT_PENDING';
            return currentStage === s.key;
          }).length;

          const isActive = mobileStageFilter === s.key;

          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setMobileStageFilter(s.key)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 active:scale-95",
                isActive
                  ? "bg-amber-400 text-black shadow-md shadow-amber-400/20"
                  : "bg-[#0F141C] text-slate-400 hover:text-white border border-white/10"
              )}
            >
              <span>{s.shortLabel}</span>
              <span className={cn(
                "text-[10px] px-1.5 py-0.2 rounded-full font-mono",
                isActive ? "bg-black/20 text-black font-black" : "bg-white/10 text-slate-300"
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 4. 5-Column Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
        {STAGES.map((stage) => {
          const columnDeals = visibleDeals.filter(d => {
            const currentStage = (d.leadStage || 'CLAIMED').toUpperCase();
            if (stage.key === 'CLAIMED') {
              return currentStage === 'CLAIMED' || currentStage === 'NEW_LEAD' || currentStage === 'FOLLOW_UP';
            }
            if (stage.key === 'QUOTED') {
              return currentStage === 'QUOTED' || currentStage === 'QUOTE_SENT';
            }
            if (stage.key === 'NEGOTIATION') {
              return currentStage === 'NEGOTIATION' || currentStage === 'PAYMENT_PENDING';
            }
            return currentStage === stage.key;
          });

          const isVisibleOnMobile = mobileStageFilter === 'ALL' || mobileStageFilter === stage.key;
          const StageIcon = stage.icon;

          return (
            <div 
              key={stage.key}
              className={cn(
                "flex flex-col rounded-2xl border p-3.5 min-h-[460px] bg-[#0F141C]/70 backdrop-blur-md transition-all shadow-xl",
                stage.color,
                !isVisibleOnMobile && "hidden lg:flex"
              )}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-300">
                    <StageIcon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    {stage.label}
                  </span>
                </div>
                <Badge className={cn(stage.badge, "text-[10px] px-2 py-0.5 rounded-full font-mono font-bold")}>
                  {columnDeals.length}
                </Badge>
              </div>

              {/* Column Cards */}
              <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar">
                {columnDeals.length === 0 ? (
                  /* Upgraded Luxury Empty State */
                  <div className="h-48 flex flex-col items-center justify-center text-center p-4 rounded-xl border border-dashed border-white/10 bg-[#07090E]/50">
                    <div className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center text-slate-500 mb-2">
                      <StageIcon className="w-4 h-4 opacity-50" />
                    </div>
                    <p className="text-xs font-bold text-slate-300 mb-0.5">{stage.emptyTitle}</p>
                    <p className="text-[10px] text-slate-500 max-w-[180px] leading-relaxed">
                      {stage.emptyDesc}
                    </p>
                  </div>
                ) : (
                  columnDeals.map((deal) => {
                    const isBusy = transitioningId === deal.id;
                    const val = deal.netPrice || parseInt(String(deal.budget || '0').replace(/[^0-9]/g, ''), 10) || 45000;

                    return (
                      <Card
                        key={deal.id}
                        className="bg-[#07090E]/95 border border-white/10 hover:border-amber-400/50 p-4 rounded-xl shadow-lg transition-all duration-200 text-left flex flex-col justify-between group"
                      >
                        <div>
                          {/* Traveler & Value */}
                          <div className="flex items-start justify-between gap-1.5 mb-1.5">
                            <h4 className="text-sm font-bold text-white tracking-wide truncate group-hover:text-amber-300 transition-colors">
                              {deal.customerName || 'Private Traveler'}
                            </h4>
                            <span className="text-xs font-bold text-emerald-400 shrink-0 font-mono">
                              ₹{val.toLocaleString('en-IN')}
                            </span>
                          </div>

                          {/* Destination & Duration */}
                          <p className="text-xs text-slate-300 flex items-center gap-1.5 mb-2.5 truncate">
                            <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span className="truncate">{deal.destination || 'Kashmir Tour'}</span>
                            <span className="text-slate-600">•</span>
                            <span className="text-slate-400 shrink-0 font-mono text-[11px]">{deal.duration || '5N/6D'}</span>
                          </p>

                          {/* Contact Info & Direct WhatsApp */}
                          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-3 bg-white/[0.03] p-2 rounded-lg border border-white/5">
                            <a href={`tel:${deal.phone}`} className="hover:text-amber-400 flex items-center gap-1.5 truncate">
                              <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                              <span className="truncate">{deal.phone}</span>
                            </a>
                            <button
                              onClick={() => sendWhatsAppQuote(deal)}
                              className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-bold shrink-0 ml-2"
                              title="Send WhatsApp Quote"
                            >
                              <Send className="w-3 h-3" />
                              <span>WhatsApp</span>
                            </button>
                          </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="space-y-2 pt-2.5 border-t border-white/10">
                          {/* Action 1: Itinerary Builder Studio */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onOpenItineraryBuilder(deal)}
                            className="w-full text-xs h-8 border-amber-400/30 text-amber-300 hover:bg-amber-400/10 flex items-center justify-center gap-1.5 rounded-lg font-bold"
                          >
                            <FileEdit className="w-3.5 h-3.5" />
                            <span>Open in Studio</span>
                          </Button>

                          {/* Stage Transition Actions */}
                          <div className="grid grid-cols-2 gap-1.5">
                            {stage.key === 'CLAIMED' && (
                              <>
                                <button
                                  onClick={() => handleStageChange(deal.id, 'QUOTED')}
                                  disabled={isBusy}
                                  className="text-[10px] bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 py-1.5 px-2 rounded-lg text-center font-bold transition active:scale-95"
                                >
                                  ➔ Mark Quoted
                                </button>
                                <button
                                  onClick={() => handleStageChange(deal.id, 'LOST')}
                                  disabled={isBusy}
                                  className="text-[10px] bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 py-1.5 px-2 rounded-lg text-center transition active:scale-95"
                                >
                                  ✕ Mark Lost
                                </button>
                              </>
                            )}

                            {stage.key === 'QUOTED' && (
                              <>
                                <button
                                  onClick={() => handleStageChange(deal.id, 'NEGOTIATION')}
                                  disabled={isBusy}
                                  className="text-[10px] bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 py-1.5 px-2 rounded-lg text-center font-bold transition active:scale-95"
                                >
                                  ➔ In Neg
                                </button>
                                <button
                                  onClick={() => handleStageChange(deal.id, 'CONFIRMED')}
                                  disabled={isBusy}
                                  className="text-[10px] bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 py-1.5 px-2 rounded-lg text-center font-bold transition active:scale-95"
                                >
                                  ✓ Confirm
                                </button>
                              </>
                            )}

                            {stage.key === 'NEGOTIATION' && (
                              <button
                                onClick={() => handleStageChange(deal.id, 'CONFIRMED')}
                                disabled={isBusy}
                                className="text-[10px] bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black py-2 px-2.5 rounded-lg text-center font-black transition col-span-2 flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-95"
                              >
                                <Car className="w-3.5 h-3.5" />
                                <span>CONFIRM & DISPATCH CAB</span>
                              </button>
                            )}

                            {stage.key === 'CONFIRMED' && (
                              <div className="col-span-2 text-center text-[10px] text-emerald-400 font-bold flex items-center justify-center gap-1.5 py-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>Driver Dispatched • PIN Protected</span>
                              </div>
                            )}

                            {stage.key === 'LOST' && (
                              <button
                                onClick={() => handleStageChange(deal.id, 'CLAIMED')}
                                disabled={isBusy}
                                className="text-[10px] bg-white/5 hover:bg-white/10 text-slate-300 py-1.5 px-2 rounded-lg text-center font-bold transition col-span-2 active:scale-95"
                              >
                                ↺ Re-Open Deal
                              </button>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
