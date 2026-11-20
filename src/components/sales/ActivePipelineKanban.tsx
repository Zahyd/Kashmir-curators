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
  RefreshCw
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/lib/api';

export type PipelineStage = 'CLAIMED' | 'QUOTED' | 'NEGOTIATION' | 'CONFIRMED' | 'LOST';

interface Deal {
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

const STAGES: { key: PipelineStage; label: string; color: string; badge: string }[] = [
  { key: 'CLAIMED', label: 'Claimed / New', color: 'border-blue-500/30 bg-blue-500/5', badge: 'bg-blue-500/20 text-blue-400' },
  { key: 'QUOTED', label: 'Quote Sent', color: 'border-amber-500/30 bg-amber-500/5', badge: 'bg-amber-500/20 text-amber-400' },
  { key: 'NEGOTIATION', label: 'In Negotiation', color: 'border-purple-500/30 bg-purple-500/5', badge: 'bg-purple-500/20 text-purple-400' },
  { key: 'CONFIRMED', label: 'Confirmed (Driver Dispatched)', color: 'border-emerald-500/30 bg-emerald-500/5', badge: 'bg-emerald-500/20 text-emerald-400' },
  { key: 'LOST', label: 'Archived / Lost', color: 'border-slate-500/30 bg-slate-500/5', badge: 'bg-slate-500/20 text-slate-400' }
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
  const [transitioningId, setTransitioningId] = useState<string | null>(null);
  const [confirmedModalDeal, setConfirmedModalDeal] = useState<Deal | null>(null);

  const fetchDeals = async () => {
    try {
      const token = localStorage.getItem('team_auth_token') || localStorage.getItem('token') || '';
      const portalKey = localStorage.getItem('kashmir_portal_key') || '';

      const res = await fetch(`${API_BASE_URL}/api/inquiries`, {
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
      const token = localStorage.getItem('team_auth_token') || localStorage.getItem('token') || '';
      const portalKey = localStorage.getItem('kashmir_portal_key') || '';

      const res = await fetch(`${API_BASE_URL}/api/sales/leads/${dealId}/stage`, {
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
        const err = await res.json();
        throw new Error(err.error || 'Failed to update deal stage');
      }

      const updated = await res.json();

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

  // Scope filter: Sales Executive sees only their own, Managers can toggle
  const visibleDeals = deals.filter(deal => {
    // Stage must be one of our stages or have assignedTo
    if (!deal.assignedTo && !deal.leadStage) return false;

    if (!isManagerOrDirector || filterScope === 'my') {
      return deal.assignedTo === currentEmployee.code;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Scope toggle for Director/Managers */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#0F141C]/80 p-4 rounded-xl border border-white/10 backdrop-blur-md">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            Active Pipeline Kanban
          </h2>
          <p className="text-xs text-slate-400">
            {isManagerOrDirector && filterScope === 'all' 
              ? 'Displaying all company deals across executive pipelines' 
              : `Scoped exclusively to concierge: ${currentEmployee.name} (${currentEmployee.code})`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isManagerOrDirector && (
            <div className="bg-[#07090E] p-1 rounded-lg border border-white/10 flex items-center text-xs">
              <button
                onClick={() => setFilterScope('my')}
                className={`px-3 py-1 rounded font-medium transition-all ${
                  filterScope === 'my' 
                    ? 'bg-amber-500 text-black shadow' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                My Deals ({deals.filter(d => d.assignedTo === currentEmployee.code).length})
              </button>
              <button
                onClick={() => setFilterScope('all')}
                className={`px-3 py-1 rounded font-medium transition-all ${
                  filterScope === 'all' 
                    ? 'bg-amber-500 text-black shadow' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Entire Team ({deals.length})
              </button>
            </div>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={() => { setLoading(true); fetchDeals(); }}
            className="border-white/10 text-slate-300 hover:text-white h-8 px-2.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Cross-Module Driver Handoff Modal */}
      {confirmedModalDeal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F141C] border border-emerald-500/40 rounded-2xl p-6 max-w-md w-full shadow-2xl shadow-emerald-950/40 text-center animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto mb-4">
              <Car className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-bold text-white mb-1">
              Deal Confirmed & Cab Dispatched!
            </h3>
            <p className="text-xs text-slate-300 mb-4">
              Congratulations! Deal for <strong className="text-white">{confirmedModalDeal.customerName}</strong> has been marked <span className="text-emerald-400 font-bold">CONFIRMED</span>.
            </p>

            <div className="bg-[#07090E] p-3 rounded-xl border border-white/10 text-left text-xs space-y-2 mb-5">
              <div className="flex justify-between text-slate-400">
                <span>Trip Destination:</span>
                <span className="text-white font-medium">{confirmedModalDeal.destination || 'Gulmarg Mountain Resort'}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Automated Handoff:</span>
                <span className="text-emerald-400 font-medium">Broadcasted to /driver Cockpit</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Driver Security PIN:</span>
                <span className="text-amber-400 font-mono font-bold">KC-{Math.floor(10 + Math.random() * 89)}</span>
              </div>
            </div>

            <Button
              onClick={() => setConfirmedModalDeal(null)}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold h-10 rounded-xl"
            >
              Continue Working
            </Button>
          </div>
        </div>
      )}

      {/* 5-Column Kanban Board */}
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

          return (
            <div 
              key={stage.key}
              className={`flex flex-col rounded-xl border ${stage.color} p-3 min-h-[500px] bg-[#0F141C]/60 backdrop-blur-md`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/5">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  {stage.label}
                </span>
                <Badge className={`${stage.badge} text-[10px] px-2 py-0.5 rounded-full font-mono`}>
                  {columnDeals.length}
                </Badge>
              </div>

              {/* Column Cards */}
              <div className="flex-1 space-y-3 overflow-y-auto">
                {columnDeals.length === 0 ? (
                  <div className="h-32 flex items-center justify-center text-slate-500 text-xs italic">
                    No deals in {stage.label}
                  </div>
                ) : (
                  columnDeals.map((deal) => {
                    const isBusy = transitioningId === deal.id;
                    const val = deal.netPrice || parseInt(String(deal.budget || '0').replace(/[^0-9]/g, ''), 10) || 45000;

                    return (
                      <Card
                        key={deal.id}
                        className="bg-[#07090E]/90 border border-white/10 hover:border-amber-500/40 p-3.5 rounded-xl shadow-md transition-all text-left flex flex-col justify-between"
                      >
                        <div>
                          {/* Traveler & Value */}
                          <div className="flex items-start justify-between gap-1 mb-1.5">
                            <h4 className="text-sm font-bold text-white tracking-wide truncate">
                              {deal.customerName || 'Private Traveler'}
                            </h4>
                            <span className="text-xs font-bold text-emerald-400 shrink-0">
                              ₹{val.toLocaleString('en-IN')}
                            </span>
                          </div>

                          {/* Destination & Duration */}
                          <p className="text-xs text-slate-300 flex items-center gap-1.5 mb-2 truncate">
                            <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                            <span className="truncate">{deal.destination || 'Kashmir Tour'}</span>
                            <span className="text-slate-500">•</span>
                            <span className="text-slate-400 shrink-0">{deal.duration || '5N/6D'}</span>
                          </p>

                          {/* Contact Info */}
                          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-3 bg-white/[0.02] p-1.5 rounded border border-white/5">
                            <a href={`tel:${deal.phone}`} className="hover:text-amber-400 flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{deal.phone}</span>
                            </a>
                            <button
                              onClick={() => sendWhatsAppQuote(deal)}
                              className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium"
                              title="Send WhatsApp Quote"
                            >
                              <Send className="w-3 h-3" />
                              <span>WhatsApp</span>
                            </button>
                          </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="space-y-2 pt-2 border-t border-white/5">
                          {/* Action 1: Itinerary Builder */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onOpenItineraryBuilder(deal)}
                            className="w-full text-xs h-7 border-amber-500/30 text-amber-300 hover:bg-amber-500/10 flex items-center justify-center gap-1.5"
                          >
                            <FileEdit className="w-3 h-3" />
                            <span>Itinerary Builder</span>
                          </Button>

                          {/* Stage Transition Buttons */}
                          <div className="grid grid-cols-2 gap-1.5">
                            {stage.key === 'CLAIMED' && (
                              <>
                                <button
                                  onClick={() => handleStageChange(deal.id, 'QUOTED')}
                                  disabled={isBusy}
                                  className="text-[10px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 py-1 px-1.5 rounded text-center font-medium transition"
                                >
                                  ➔ Mark Quoted
                                </button>
                                <button
                                  onClick={() => handleStageChange(deal.id, 'LOST')}
                                  disabled={isBusy}
                                  className="text-[10px] bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 py-1 px-1.5 rounded text-center transition"
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
                                  className="text-[10px] bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 py-1 px-1.5 rounded text-center font-medium transition"
                                >
                                  ➔ In Negotiation
                                </button>
                                <button
                                  onClick={() => handleStageChange(deal.id, 'CONFIRMED')}
                                  disabled={isBusy}
                                  className="text-[10px] bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 py-1 px-1.5 rounded text-center font-bold transition"
                                >
                                  ✓ Confirm Deal
                                </button>
                              </>
                            )}

                            {stage.key === 'NEGOTIATION' && (
                              <>
                                <button
                                  onClick={() => handleStageChange(deal.id, 'CONFIRMED')}
                                  disabled={isBusy}
                                  className="text-[10px] bg-emerald-500/30 hover:bg-emerald-500/40 text-emerald-300 py-1.5 px-2 rounded text-center font-bold transition col-span-2 flex items-center justify-center gap-1"
                                >
                                  <Car className="w-3 h-3 text-emerald-400" />
                                  <span>CONFIRM & DISPATCH CAB</span>
                                </button>
                              </>
                            )}

                            {stage.key === 'CONFIRMED' && (
                              <div className="col-span-2 text-center text-[10px] text-emerald-400/90 font-medium flex items-center justify-center gap-1 py-1">
                                <ShieldCheck className="w-3 h-3" />
                                <span>Driver Dispatched</span>
                              </div>
                            )}

                            {stage.key === 'LOST' && (
                              <button
                                onClick={() => handleStageChange(deal.id, 'CLAIMED')}
                                disabled={isBusy}
                                className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 py-1 px-2 rounded text-center font-medium transition col-span-2"
                              >
                                Re-Open Deal
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
