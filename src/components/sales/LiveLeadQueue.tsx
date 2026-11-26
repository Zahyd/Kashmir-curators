import React, { useEffect, useState, useCallback } from 'react';
import {
  Users,
  Clock,
  MapPin,
  Calendar,
  ArrowRight,
  Zap,
  Search,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  Hotel,
  Plus,
  FolderOpen,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { salesApi, SalesInquiry } from '@/lib/salesApi';
import { useTeamAuth } from '@/contexts/TeamAuthContext';

interface LiveLeadQueueProps {
  currentEmployee: {
    code: string;
    name: string;
    role: string;
  };
  onClaimLead: (lead: SalesInquiry) => void;
  onInspectLead?: (lead: SalesInquiry) => void;
  onCreateLead?: () => void;
  onRefreshMetrics?: () => void;
  canManage?: boolean;
  refreshTrigger?: number;
}

export const LiveLeadQueue: React.FC<LiveLeadQueueProps> = ({
  currentEmployee,
  onClaimLead,
  onInspectLead,
  onCreateLead,
  onRefreshMetrics,
  canManage = false,
  refreshTrigger = 0
}) => {
  const { subscribeSalesEvent } = useTeamAuth();
  const [unclaimedLeads, setUnclaimedLeads] = useState<SalesInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  const [conflictAlert, setConflictAlert] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  const fetchUnclaimedLeads = useCallback(async () => {
    setError(null);
    try {
      const data = await salesApi.listInquiriesPaginated({
        unclaimedOnly: true,
        search: searchTerm.trim() || undefined,
        page: 1,
        limit: 50
      });
      const unclaimed = (data.items || []).filter(
        (inq) =>
          (!inq.assignedTo || inq.assignedTo.trim() === '' || inq.assignedTo === 'Unassigned') &&
          !['Booked', 'Lost', 'Cancelled'].includes(inq.status) &&
          !['CONFIRMED', 'COMPLETED', 'CANCELLED', 'LOST'].includes(inq.leadStage || '')
      );
      setUnclaimedLeads(unclaimed);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch live leads');
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      fetchUnclaimedLeads();
    }, 150);
    return () => window.clearTimeout(t);
  }, [fetchUnclaimedLeads, refreshTrigger]);

  useEffect(() => {
    const unsub = subscribeSalesEvent((eventName, data) => {
      if (eventName === 'LEAD_CLAIMED') {
        setUnclaimedLeads((prev) => prev.filter((l) => l.id !== data?.leadId));
        if (data?.claimedBy && data.claimedBy !== currentEmployee.code) {
          toast.info(`Inquiry #${String(data.leadId).slice(0, 8)} claimed by ${data.claimedByName || data.claimedBy}`);
        }
        onRefreshMetrics?.();
      } else if (eventName === 'NEW_INQUIRY' || eventName === 'LEAD_CREATED' || eventName === 'LEAD_DELETED' || eventName === 'LEAD_UPDATED') {
        fetchUnclaimedLeads();
        onRefreshMetrics?.();
      }
    });

    const timer = window.setInterval(() => setCurrentTime(Date.now()), 1000);
    const poller = window.setInterval(fetchUnclaimedLeads, 45000);

    return () => {
      unsub();
      window.clearInterval(timer);
      window.clearInterval(poller);
    };
  }, [subscribeSalesEvent, currentEmployee.code, fetchUnclaimedLeads, onRefreshMetrics]);

  const handleAtomicClaim = async (lead: SalesInquiry) => {
    setClaimingId(lead.id);
    setConflictAlert(null);
    try {
      const data = await salesApi.claimLead(lead.id, currentEmployee.code, currentEmployee.name);
      toast.success(`Inquiry claimed by ${currentEmployee.name} (${currentEmployee.code})`);
      setUnclaimedLeads((prev) => prev.filter((l) => l.id !== lead.id));
      onRefreshMetrics?.();
      onClaimLead(data.lead || { ...lead, assignedTo: currentEmployee.code, leadStage: 'CLAIMED' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to claim lead';
      if (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('conflict')) {
        setConflictAlert(`Collision Avoided: Inquiry #${lead.id.slice(0, 8)} was claimed by another executive.`);
        setUnclaimedLeads((prev) => prev.filter((l) => l.id !== lead.id));
        onRefreshMetrics?.();
      } else {
        toast.error(msg);
      }
    } finally {
      setClaimingId(null);
    }
  };

  const handleDismissLead = async (lead: SalesInquiry) => {
    const label = canManage ? 'permanently delete' : 'mark as Lost/Spam';
    if (!window.confirm(`Are you sure you want to ${label} "${lead.customerName}"?`)) return;
    setClaimingId(lead.id);
    try {
      if (canManage) {
        await salesApi.deleteLead(lead.id);
        toast.success('Inquiry removed');
      } else {
        await salesApi.transitionStage(lead.id, { stage: 'LOST', notes: 'Dismissed from Live Queue' });
        toast.success('Inquiry marked Lost');
      }
      setUnclaimedLeads((prev) => prev.filter((l) => l.id !== lead.id));
      onRefreshMetrics?.();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setClaimingId(null);
    }
  };

  const calculateSLA = (createdAt: string) => {
    const elapsedSeconds = Math.floor((currentTime - new Date(createdAt).getTime()) / 1000);
    const remainingSeconds = 15 * 60 - elapsedSeconds;

    if (remainingSeconds <= 0) {
      const breachedMinutes = Math.abs(Math.floor(remainingSeconds / 60));
      return {
        isBreached: true,
        remainingText: `SLA BREACHED (+${breachedMinutes}m)`,
        badgeColor: 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse',
        calculatedPriority: 'URGENT'
      };
    }

    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    const remainingText = `${pad(minutes)}:${pad(seconds)} SLA`;

    if (remainingSeconds < 300) {
      return { isBreached: false, remainingText, badgeColor: 'bg-orange-500/20 text-orange-400 border border-orange-500/40', calculatedPriority: 'HIGH' };
    }
    if (remainingSeconds < 600) {
      return { isBreached: false, remainingText, badgeColor: 'bg-amber-500/20 text-amber-400 border border-amber-500/30', calculatedPriority: 'MEDIUM' };
    }
    return { isBreached: false, remainingText, badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30', calculatedPriority: 'LOW' };
  };

  const filteredLeads = unclaimedLeads.filter((lead) => {
    const query = searchTerm.toLowerCase();
    const matchesSearch =
      (lead.customerName || '').toLowerCase().includes(query) ||
      (lead.destination || '').toLowerCase().includes(query) ||
      (lead.phone || '').includes(query) ||
      (lead.leadId || '').toLowerCase().includes(query);
    if (!matchesSearch) return false;
    if (priorityFilter !== 'ALL') {
      return calculateSLA(lead.createdAt).calculatedPriority === priorityFilter;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {conflictAlert && (
        <div className="bg-rose-500/15 border border-rose-500/40 text-rose-200 px-4 py-3 rounded-xl flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{conflictAlert}</span>
          </div>
          <button onClick={() => setConflictAlert(null)} className="text-rose-400 hover:text-white text-xs font-semibold">
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-[#0F141C]/90 p-4 rounded-xl border border-white/10 shadow-lg">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <h2 className="text-lg font-bold text-white tracking-wide">Live Inbound Lead Queue</h2>
            <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs">
              {unclaimedLeads.length} Unclaimed
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time SSE inbound inquiries with 15-minute response SLA tracking.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search traveler, city, phone..."
              className="pl-8 bg-[#07090E] border-white/10 text-xs text-white h-9 rounded-lg w-full"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as 'ALL' | 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW')}
              className="h-9 bg-[#07090E] border border-white/10 rounded-lg px-2.5 text-xs text-slate-200"
            >
              <option value="ALL">All SLA</option>
              <option value="URGENT">SLA Breached</option>
              <option value="HIGH">&lt;5m Left</option>
              <option value="MEDIUM">&lt;10m Left</option>
              <option value="LOW">Fresh</option>
            </select>

            {onCreateLead && (
              <Button size="sm" onClick={onCreateLead} className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs h-9 px-3 shrink-0">
                <Plus className="w-3.5 h-3.5 mr-1" /> New Lead
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={() => { setLoading(true); fetchUnclaimedLeads(); }}
              className="border-white/10 text-slate-300 hover:text-white h-9 px-2.5 shrink-0"
              title="Refresh queue"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* Queue List */}
      {error && unclaimedLeads.length === 0 ? (
        <div className="p-8 text-center text-rose-300 bg-rose-500/10 rounded-xl border border-rose-500/30 space-y-2">
          <AlertCircle className="w-7 h-7 mx-auto text-rose-400" />
          <p className="text-sm font-semibold">{error}</p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setLoading(true);
              fetchUnclaimedLeads();
            }}
            className="border-rose-400/40 text-rose-200 hover:bg-rose-500/20 text-xs"
          >
            Retry Sync
          </Button>
        </div>
      ) : loading && unclaimedLeads.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-[#0F141C]/60 rounded-xl border border-white/10">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-400 mb-2" />
          <p className="text-xs">Connecting to live sales stream...</p>
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-[#0F141C]/60 rounded-xl border border-white/10">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
          <p className="text-sm font-medium text-white">All Clear! No unclaimed inquiries in queue.</p>
          <p className="text-xs text-slate-400 mt-1">
            Inbound traveler requests and Meta webhook leads will appear here immediately.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredLeads.map((lead) => {
            const sla = calculateSLA(lead.createdAt);
            const paxTotal = (lead.adultsCount || 2) + (lead.childrenCount || 0);
            const isClaiming = claimingId === lead.id;

            return (
              <Card
                key={lead.id}
                className={`bg-[#0F141C]/95 border rounded-xl p-4 flex flex-col justify-between transition-all ${
                  sla.isBreached ? 'border-rose-500/40' : 'border-white/10 hover:border-amber-500/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-mono text-amber-400">
                        {lead.leadId || `#${lead.id.slice(0, 8)}`}
                      </span>
                      {(lead.sourceCta?.includes('META') || lead.leadCategory === 'META_AD_CONVERT') && (
                        <Badge className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[9px]">
                          Meta Ad
                        </Badge>
                      )}
                    </div>
                    <Badge className={`${sla.badgeColor} text-[10px] font-mono font-bold px-2 py-0.5 flex items-center gap-1`}>
                      <Clock className="w-2.5 h-2.5" /> {sla.remainingText}
                    </Badge>
                  </div>

                  <div className="mb-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base font-bold text-white truncate">{lead.customerName || 'Anonymous Traveler'}</h3>
                      <span className="text-xs font-bold text-emerald-400 shrink-0 font-mono">
                        {typeof lead.budget === 'number' ? `₹${lead.budget.toLocaleString('en-IN')}` : lead.budget || 'Flexible'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">
                      {lead.phone} {lead.email ? `• ${lead.email}` : ''}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-[#07090E]/80 border border-white/5 mb-3 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-300 truncate">
                      <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate">{lead.destination || 'Kashmir Circuit'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Calendar className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>{lead.duration || '5N / 6D'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Users className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span>{paxTotal} Guests</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-300 truncate">
                      <Hotel className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">{lead.preferredAccommodation || lead.accommodation || '4-Star'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={() => handleAtomicClaim(lead)}
                    disabled={isClaiming}
                    className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs h-9 rounded-lg flex items-center justify-center gap-1.5"
                  >
                    {isClaiming ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Claiming...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5 fill-black" />
                        <span>CLAIM &amp; BUILD</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </Button>

                  <div className="grid grid-cols-2 gap-1.5">
                    {onInspectLead && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onInspectLead(lead)}
                        className="h-8 text-[11px] border-white/10 text-slate-200 hover:bg-white/10"
                      >
                        <FolderOpen className="w-3 h-3 mr-1" /> Inspect CRM
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isClaiming}
                      onClick={() => handleDismissLead(lead)}
                      className={cn(
                        'h-8 text-[11px] border-white/10 text-slate-400 hover:text-rose-400 hover:border-rose-500/30',
                        !onInspectLead && 'col-span-2'
                      )}
                    >
                      <XCircle className="w-3 h-3 mr-1" /> {canManage ? 'Delete' : 'Dismiss'}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
