import React, { useEffect, useState, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  closestCorners
} from '@dnd-kit/core';
import {
  MapPin,
  Phone,
  FileEdit,
  AlertCircle,
  Sparkles,
  Car,
  ShieldCheck,
  Send,
  RefreshCw,
  Search,
  Inbox,
  Plus,
  FolderOpen,
  CreditCard,
  Clock,
  GripVertical
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  salesApi,
  SalesInquiry,
  normalizeStageKey,
  getInquiryValueINR
} from '@/lib/salesApi';
import { useTeamAuth } from '@/contexts/TeamAuthContext';

export type PipelineStage =
  | 'CLAIMED'
  | 'FOLLOW_UP'
  | 'QUOTE_SENT'
  | 'NEGOTIATION'
  | 'PAYMENT_PENDING'
  | 'CONFIRMED'
  | 'LOST';

interface ActivePipelineKanbanProps {
  currentEmployee: {
    code: string;
    name: string;
    role: string;
  };
  onOpenItineraryBuilder: (deal: SalesInquiry) => void;
  onInspectDeal?: (deal: SalesInquiry) => void;
  onCreateDeal?: () => void;
  onRefreshMetrics?: () => void;
  isManagerOrDirector?: boolean;
  refreshTrigger?: number;
}

const STAGES: {
  key: PipelineStage;
  label: string;
  shortLabel: string;
  color: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  emptyTitle: string;
  emptyDesc: string;
}[] = [
  {
    key: 'CLAIMED',
    label: 'Claimed',
    shortLabel: 'Claimed',
    color: 'border-blue-500/30 bg-blue-500/[0.02]',
    badge: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    icon: Inbox,
    emptyTitle: 'Queue Standby',
    emptyDesc: 'Claim leads from Live Queue or add a deal.'
  },
  {
    key: 'FOLLOW_UP',
    label: 'Follow-Up',
    shortLabel: 'Follow-Up',
    color: 'border-indigo-500/30 bg-indigo-500/[0.02]',
    badge: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
    icon: Clock,
    emptyTitle: 'No Follow-Ups',
    emptyDesc: 'Active discovery calls & follow-ups.'
  },
  {
    key: 'QUOTE_SENT',
    label: 'Quote Sent',
    shortLabel: 'Quoted',
    color: 'border-amber-500/30 bg-amber-500/[0.02]',
    badge: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    icon: FileEdit,
    emptyTitle: 'No Pending Quotes',
    emptyDesc: 'Curated itineraries dispatched to guests.'
  },
  {
    key: 'NEGOTIATION',
    label: 'Negotiation',
    shortLabel: 'In Neg',
    color: 'border-purple-500/30 bg-purple-500/[0.02]',
    badge: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
    icon: Sparkles,
    emptyTitle: 'No Negotiations',
    emptyDesc: 'Deals with custom rate/stay revisions.'
  },
  {
    key: 'PAYMENT_PENDING',
    label: 'Payment Pending',
    shortLabel: 'Payment',
    color: 'border-cyan-500/30 bg-cyan-500/[0.02]',
    badge: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
    icon: CreditCard,
    emptyTitle: 'No Pending Payments',
    emptyDesc: 'Awaiting deposit UTR or Razorpay settlement.'
  },
  {
    key: 'CONFIRMED',
    label: 'Confirmed',
    shortLabel: 'Confirmed',
    color: 'border-emerald-500/30 bg-emerald-500/[0.02]',
    badge: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    icon: Car,
    emptyTitle: 'No Confirmed Trips',
    emptyDesc: 'Confirmed bookings auto-dispatch to Driver OS.'
  },
  {
    key: 'LOST',
    label: 'Lost / Archived',
    shortLabel: 'Lost',
    color: 'border-slate-500/30 bg-slate-500/[0.02]',
    badge: 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
    icon: AlertCircle,
    emptyTitle: 'Zero Archived Deals',
    emptyDesc: 'Cancelled or archived inquiries.'
  }
];

interface DraggableDealCardProps {
  deal: SalesInquiry;
  stageKey: PipelineStage;
  isBusy: boolean;
  onInspectDeal?: (deal: SalesInquiry) => void;
  onOpenItineraryBuilder: (deal: SalesInquiry) => void;
  onStageChange: (dealId: string, newStage: PipelineStage) => void;
  onWhatsApp: (deal: SalesInquiry) => void;
}

function DraggableDealCard({
  deal,
  stageKey,
  isBusy,
  onInspectDeal,
  onOpenItineraryBuilder,
  onStageChange,
  onWhatsApp
}: DraggableDealCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: deal.id,
    data: { deal, stageKey }
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  const val = getInquiryValueINR(deal);
  const currentNormalized = normalizeStageKey(deal.leadStage, deal.status);

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        'bg-[#07090E]/95 border border-white/10 hover:border-amber-400/50 p-3.5 rounded-xl transition-all flex flex-col justify-between gap-2.5',
        isDragging && 'opacity-40 ring-2 ring-amber-400/60',
        isBusy && 'opacity-70'
      )}
    >
      <div>
        <div className="flex items-start justify-between gap-1.5 mb-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <button
              type="button"
              {...attributes}
              {...listeners}
              aria-label={`Drag ${deal.customerName}`}
              className="p-0.5 -ml-1 rounded text-slate-500 hover:text-amber-300 cursor-grab active:cursor-grabbing shrink-0 touch-none"
              title="Drag to move stage"
            >
              <GripVertical className="w-3.5 h-3.5" />
            </button>
            <h4 className="text-sm font-bold text-white truncate">{deal.customerName || 'Private Traveler'}</h4>
          </div>
          <span className="text-xs font-bold text-emerald-400 shrink-0 font-mono">
            {val > 0 ? `₹${val.toLocaleString('en-IN')}` : '₹0'}
          </span>
        </div>
        <p className="text-[11px] text-slate-300 flex items-center gap-1 truncate mb-2">
          <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
          <span className="truncate">{deal.destination || 'Kashmir Tour'}</span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400 shrink-0 font-mono">{deal.duration || '5N/6D'}</span>
        </p>
        <div className="flex items-center justify-between text-[11px] text-slate-400 bg-white/[0.03] px-2 py-1.5 rounded-lg border border-white/5">
          <a href={`tel:${deal.phone}`} className="hover:text-amber-400 flex items-center gap-1 truncate">
            <Phone className="w-3 h-3 text-slate-500 shrink-0" />
            <span className="truncate">{deal.phone}</span>
          </a>
          <button
            type="button"
            onClick={() => onWhatsApp(deal)}
            className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-bold shrink-0 ml-1"
          >
            <Send className="w-3 h-3" /> WA
          </button>
        </div>
      </div>

      <div className="space-y-1.5 pt-2 border-t border-white/10">
        <div className="grid grid-cols-2 gap-1.5">
          {onInspectDeal && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onInspectDeal(deal)}
              className="h-7 text-[11px] border-white/15 text-slate-200 hover:bg-white/10 px-2"
            >
              <FolderOpen className="w-3 h-3 mr-1" /> CRM
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => onOpenItineraryBuilder(deal)}
            className="h-7 text-[11px] border-amber-400/30 text-amber-300 hover:bg-amber-400/10 px-2"
          >
            <FileEdit className="w-3 h-3 mr-1" /> Studio
          </Button>
        </div>

        <select
          value={currentNormalized}
          disabled={isBusy}
          onChange={(e) => onStageChange(deal.id, e.target.value as PipelineStage)}
          className="w-full h-7 bg-[#0F141C] border border-white/10 rounded-md px-2 text-[11px] font-semibold text-slate-200 focus:border-amber-400 focus:outline-none"
        >
          {STAGES.map((opt) => (
            <option key={opt.key} value={opt.key}>
              Stage: {opt.label}
            </option>
          ))}
        </select>

        {stageKey === 'CONFIRMED' && (
          <div className="text-center text-[10px] text-emerald-400 font-bold flex items-center justify-center gap-1 py-1 bg-emerald-500/10 rounded border border-emerald-500/20">
            <ShieldCheck className="w-3 h-3" /> Driver Dispatched
          </div>
        )}
      </div>
    </Card>
  );
}

interface DroppableStageColumnProps {
  stage: (typeof STAGES)[number];
  columnDeals: SalesInquiry[];
  isVisibleOnMobile: boolean;
  transitioningId: string | null;
  onInspectDeal?: (deal: SalesInquiry) => void;
  onOpenItineraryBuilder: (deal: SalesInquiry) => void;
  onStageChange: (dealId: string, newStage: PipelineStage) => void;
  onWhatsApp: (deal: SalesInquiry) => void;
}

function DroppableStageColumn({
  stage,
  columnDeals,
  isVisibleOnMobile,
  transitioningId,
  onInspectDeal,
  onOpenItineraryBuilder,
  onStageChange,
  onWhatsApp
}: DroppableStageColumnProps) {
  const { isOver, setNodeRef } = useDroppable({ id: stage.key });
  const StageIcon = stage.icon;
  const colTotalINR = columnDeals.reduce((sum, d) => sum + getInquiryValueINR(d), 0);

  return (
    <div
      ref={setNodeRef}
      data-stage-column={stage.key}
      className={cn(
        'flex flex-col rounded-xl border p-3 min-h-[420px] lg:w-[278px] lg:shrink-0 bg-[#0F141C]/80 shadow-lg transition-colors',
        stage.color,
        isOver && 'border-amber-400 bg-amber-500/[0.06] ring-1 ring-amber-400/50',
        !isVisibleOnMobile && 'hidden lg:flex'
      )}
    >
      <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-white/10 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-md bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 shrink-0">
            <StageIcon className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-bold text-white uppercase tracking-wider block truncate">{stage.label}</span>
            {colTotalINR > 0 && (
              <span className="text-[10px] font-mono text-emerald-400">
                ₹{colTotalINR.toLocaleString('en-IN')}
              </span>
            )}
          </div>
        </div>
        <Badge className={cn(stage.badge, 'text-[10px] px-2 py-0 rounded-full font-mono shrink-0')}>
          {columnDeals.length}
        </Badge>
      </div>

      <div className="flex-1 space-y-2.5 overflow-y-auto custom-scrollbar">
        {columnDeals.length === 0 ? (
          <div className="h-36 flex flex-col items-center justify-center text-center p-3 rounded-lg border border-dashed border-white/10 bg-[#07090E]/50">
            <p className="text-xs font-bold text-slate-400">{stage.emptyTitle}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">{stage.emptyDesc}</p>
          </div>
        ) : (
          columnDeals.map((deal) => (
            <DraggableDealCard
              key={deal.id}
              deal={deal}
              stageKey={stage.key}
              isBusy={transitioningId === deal.id}
              onInspectDeal={onInspectDeal}
              onOpenItineraryBuilder={onOpenItineraryBuilder}
              onStageChange={onStageChange}
              onWhatsApp={onWhatsApp}
            />
          ))
        )}
      </div>
    </div>
  );
}

export const ActivePipelineKanban: React.FC<ActivePipelineKanbanProps> = ({
  currentEmployee,
  onOpenItineraryBuilder,
  onInspectDeal,
  onCreateDeal,
  onRefreshMetrics,
  isManagerOrDirector = false,
  refreshTrigger = 0
}) => {
  const { subscribeSalesEvent, teamUser } = useTeamAuth();
  const [deals, setDeals] = useState<SalesInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterScope, setFilterScope] = useState<'my' | 'all'>(isManagerOrDirector ? 'all' : 'my');
  const [mobileStageFilter, setMobileStageFilter] = useState<'ALL' | PipelineStage>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [transitioningId, setTransitioningId] = useState<string | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor)
  );

  const fetchDeals = useCallback(async () => {
    setError(null);
    try {
      const list = await salesApi.listInquiries();
      setDeals(list);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error loading pipeline deals');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals, refreshTrigger]);

  useEffect(() => {
    const unsub = subscribeSalesEvent((eventName, payload) => {
      if ((eventName === 'STAGE_UPDATED' || eventName === 'LEAD_STAGE_UPDATED' || eventName === 'BOOKING_STATUS_UPDATED') && payload?.lead?.id) {
        setDeals((prev) => {
          const exists = prev.some((d) => d.id === payload.lead.id);
          return exists ? prev.map((d) => (d.id === payload.lead.id ? payload.lead : d)) : [payload.lead, ...prev];
        });
      } else if (
        eventName === 'LEAD_CLAIMED' ||
        eventName === 'LEAD_CREATED' ||
        eventName === 'NEW_INQUIRY' ||
        eventName === 'LEAD_UPDATED' ||
        eventName === 'LEAD_DELETED' ||
        eventName === 'PAYMENT_CONFIRMED' ||
        eventName === 'lead-updated' ||
        eventName === 'lead-assigned'
      ) {
        fetchDeals();
      }
    });
    const interval = window.setInterval(fetchDeals, 45000);
    return () => {
      unsub();
      window.clearInterval(interval);
    };
  }, [subscribeSalesEvent, fetchDeals]);

  const handleStageChange = async (dealId: string, newStage: PipelineStage) => {
    const previousDeal = deals.find((d) => d.id === dealId);
    const currentStage = previousDeal ? normalizeStageKey(previousDeal.leadStage, previousDeal.status) : null;
    if (currentStage === newStage) return;

    // Optimistic update for snappy drag-and-drop
    setTransitioningId(dealId);
    setDeals((prev) =>
      prev.map((d) => (d.id === dealId ? { ...d, leadStage: newStage } : d))
    );

    try {
      const res = await salesApi.transitionStage(dealId, {
        stage: newStage,
        notes: `Moved to ${newStage} by ${currentEmployee.name} (${currentEmployee.code})`
      });

      setDeals((prev) => prev.map((d) => (d.id === dealId ? res.lead : d)));
      onRefreshMetrics?.();

      if (newStage === 'CONFIRMED') {
        toast.success('Deal Confirmed! Chauffeur dispatch broadcasted to Driver Cockpit.');
      } else {
        toast.success(`Deal moved to ${newStage.replace(/_/g, ' ')}`);
      }
    } catch (err: unknown) {
      // Rollback optimistic update on failure
      if (previousDeal) {
        setDeals((prev) => prev.map((d) => (d.id === dealId ? previousDeal : d)));
      }
      toast.error(err instanceof Error ? err.message : 'Error updating deal stage');
    } finally {
      setTransitioningId(null);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);
    if (!over) return;
    const dealId = String(active.id);
    const overStage = String(over.id) as PipelineStage;
    if (STAGES.some((s) => s.key === overStage)) {
      handleStageChange(dealId, overStage);
    }
  };

  const sendWhatsAppQuote = (deal: SalesInquiry) => {
    const phone = (deal.phone || '').replace(/[^0-9]/g, '');
    if (!phone) {
      toast.error('Deal has no phone number');
      return;
    }
    const recipient = phone.startsWith('91') ? phone : `91${phone}`;
    const quoteUrl = `${window.location.origin}/itinerary/${deal.id}`;
    const message = encodeURIComponent(
      `Salaam ${deal.customerName},\n\nHere is your bespoke Kashmir itinerary crafted by The Kashmir Curators:\n` +
        `Route: ${deal.destination || 'Kashmir Circuit'}\nDuration: ${deal.duration || '5N/6D'}\n\n` +
        `View interactive quote & confirm online:\n${quoteUrl}\n\nWarm regards,\n${currentEmployee.name}`
    );
    window.open(`https://wa.me/${recipient}?text=${message}`, '_blank');
  };

  const isMyDeal = (deal: SalesInquiry) => {
    const assignee = String(deal.assignedTo || '').trim();
    if (!assignee) return false;
    const codeUpper = (currentEmployee.code || '').toUpperCase();
    const emailLower = (teamUser?.email || '').toLowerCase();
    return (
      (Boolean(codeUpper) && assignee.toUpperCase() === codeUpper) ||
      (Boolean(emailLower) && assignee.toLowerCase() === emailLower)
    );
  };

  const visibleDeals = deals.filter((deal) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matches =
        (deal.customerName || '').toLowerCase().includes(q) ||
        (deal.destination || '').toLowerCase().includes(q) ||
        (deal.phone || '').includes(q) ||
        (deal.leadId || '').toLowerCase().includes(q) ||
        (deal.id || '').toLowerCase().includes(q);
      if (!matches) return false;
    }

    if (filterScope === 'my') {
      return isMyDeal(deal);
    }

    return true;
  });

  const activePipelineDeals = visibleDeals.filter((d) => {
    const st = normalizeStageKey(d.leadStage, d.status);
    return !['CONFIRMED', 'COMPLETED', 'LOST'].includes(st);
  });

  const totalPipelineINR = activePipelineDeals.reduce((sum, d) => sum + getInquiryValueINR(d), 0);

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="bg-[#0F141C]/90 p-4 sm:p-5 rounded-xl border border-white/10 shadow-lg flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide">
              Active Concierge Pipeline
            </h2>
            <Badge className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono px-2 py-0.5">
              ₹{totalPipelineINR.toLocaleString('en-IN')} Active Value
            </Badge>
          </div>
          <p className="text-xs text-slate-400">
            {filterScope === 'my'
              ? `Filtered to ${currentEmployee.name} (${currentEmployee.code})`
              : 'Displaying all company pipeline inquiries synced with Neon DB'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
          <div className="relative flex-1 sm:w-52">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search deal or lead ID..."
              className="pl-8 bg-[#07090E] border-white/10 text-xs text-white h-9 rounded-lg w-full"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {isManagerOrDirector && (
              <div className="flex bg-[#07090E] p-1 rounded-lg border border-white/10 text-xs">
                <button
                  onClick={() => setFilterScope('my')}
                  className={cn(
                    'px-2.5 py-1 rounded text-[11px] font-semibold transition',
                    filterScope === 'my' ? 'bg-amber-500 text-black font-bold' : 'text-slate-400 hover:text-white'
                  )}
                >
                  My Deals
                </button>
                <button
                  onClick={() => setFilterScope('all')}
                  className={cn(
                    'px-2.5 py-1 rounded text-[11px] font-semibold transition',
                    filterScope === 'all' ? 'bg-amber-500 text-black font-bold' : 'text-slate-400 hover:text-white'
                  )}
                >
                  All Team
                </button>
              </div>
            )}

            {onCreateDeal && (
              <Button size="sm" onClick={onCreateDeal} className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs h-9 px-3">
                <Plus className="w-3.5 h-3.5 mr-1" /> New Deal
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={() => { setLoading(true); fetchDeals(); }}
              className="border-white/10 text-slate-300 hover:text-white h-9 px-2.5"
              title="Refresh pipeline"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin text-amber-400')} />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Stage Filter Pills */}
      <div className="flex lg:hidden items-center gap-1.5 overflow-x-auto pb-1">
        <button
          onClick={() => setMobileStageFilter('ALL')}
          className={cn(
            'px-3 py-1.5 rounded-lg text-xs font-bold shrink-0',
            mobileStageFilter === 'ALL' ? 'bg-amber-500 text-black' : 'bg-[#0F141C] text-slate-400 border border-white/10'
          )}
        >
          All ({visibleDeals.length})
        </button>
        {STAGES.map((s) => {
          const count = visibleDeals.filter((d) => {
            const st = normalizeStageKey(d.leadStage, d.status);
            if (s.key === 'CLAIMED') return st === 'CLAIMED' || st === 'NEW_LEAD';
            return st === s.key;
          }).length;

          return (
            <button
              key={s.key}
              onClick={() => setMobileStageFilter(s.key)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 flex items-center gap-1.5',
                mobileStageFilter === s.key ? 'bg-amber-500 text-black' : 'bg-[#0F141C] text-slate-400 border border-white/10'
              )}
            >
              <span>{s.shortLabel}</span>
              <span className="font-mono text-[10px] opacity-80">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between text-xs text-rose-300">
          <span className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </span>
          <Button size="sm" variant="outline" onClick={fetchDeals} className="border-rose-500/30 text-rose-200 text-xs">
            Retry
          </Button>
        </div>
      )}

      {/* Horizontal Scrollable Drag-and-Drop Kanban */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-col lg:flex-row gap-3.5 lg:overflow-x-auto pb-4 custom-scrollbar">
          {STAGES.map((stage) => {
            const columnDeals = visibleDeals.filter((d) => {
              const st = normalizeStageKey(d.leadStage, d.status);
              if (stage.key === 'CLAIMED') return st === 'CLAIMED' || st === 'NEW_LEAD';
              return st === stage.key;
            });

            const isVisibleOnMobile = mobileStageFilter === 'ALL' || mobileStageFilter === stage.key;

            return (
              <DroppableStageColumn
                key={stage.key}
                stage={stage}
                columnDeals={columnDeals}
                isVisibleOnMobile={isVisibleOnMobile}
                transitioningId={transitioningId}
                onInspectDeal={onInspectDeal}
                onOpenItineraryBuilder={onOpenItineraryBuilder}
                onStageChange={handleStageChange}
                onWhatsApp={sendWhatsAppQuote}
              />
            );
          })}
        </div>

        <DragOverlay>
          {activeDragId ? (() => {
            const dragged = deals.find((d) => d.id === activeDragId);
            if (!dragged) return null;
            return (
              <Card className="bg-[#0F141C] border-2 border-amber-400 p-3.5 rounded-xl shadow-2xl w-[260px] rotate-1 opacity-95">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-white truncate">{dragged.customerName}</span>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    ₹{getInquiryValueINR(dragged).toLocaleString('en-IN')}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-1 truncate">
                  {dragged.destination || 'Kashmir Tour'} • Drop on target stage
                </p>
              </Card>
            );
          })() : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};
