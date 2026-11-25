import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Clock, 
  MapPin, 
  Calendar, 
  ShieldAlert, 
  ArrowRight, 
  Sparkles, 
  Zap, 
  Search, 
  Filter, 
  AlertTriangle,
  RefreshCw,
  Building,
  UserCheck,
  CheckCircle2,
  Hotel,
  Car
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/lib/api';

interface Lead {
  id: string;
  customerName: string;
  phone: string;
  email?: string;
  destination?: string;
  duration?: string;
  startDate?: string;
  adultsCount?: number;
  childrenCount?: number;
  budget?: string | number;
  hotelCategory?: string;
  vehiclePreference?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | string;
  status: string;
  leadStage?: string;
  assignedTo?: string | null;
  sourceCta?: string;
  leadCategory?: string;
  createdAt: string;
  notes?: string;
}

interface LiveLeadQueueProps {
  currentEmployee: {
    code: string;
    name: string;
    role: string;
  };
  onClaimLead: (lead: Lead) => void;
  onRefreshMetrics?: () => void;
}

export const LiveLeadQueue: React.FC<LiveLeadQueueProps> = ({
  currentEmployee,
  onClaimLead,
  onRefreshMetrics
}) => {
  const [unclaimedLeads, setUnclaimedLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  const [conflictAlert, setConflictAlert] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  // 1. Fetch unclaimed inquiries from Neon API
  const fetchUnclaimedLeads = async () => {
    try {
      const token = localStorage.getItem('team_auth_token') || localStorage.getItem('teamToken') || localStorage.getItem('token') || '';
      const portalKey = localStorage.getItem('kashmir_portal_key') || '';

      const res = await fetch(`${API_BASE_URL}/inquiries`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          ...(portalKey ? { 'x-portal-key': portalKey } : {})
        }
      });

      if (res.ok) {
        const data = await res.json();
        // Filter for leads that are not yet claimed and not booked/lost
        const queue = (Array.isArray(data) ? data : data.inquiries || []).filter((item: Lead) => {
          const isUnclaimed = !item.assignedTo || item.assignedTo.trim() === '';
          const isActive = !['Booked', 'Lost', 'Cancelled'].includes(item.status) &&
                           !['CONFIRMED', 'COMPLETED', 'CANCELLED', 'LOST'].includes(item.leadStage || '');
          return isUnclaimed && isActive;
        });

        setUnclaimedLeads(queue);
      }
    } catch (err) {
      console.warn('Error fetching unclaimed queue:', err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Set up SSE Stream from /api/sales/stream
  useEffect(() => {
    fetchUnclaimedLeads();

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(`${API_BASE_URL}/sales/stream`);

      eventSource.addEventListener('LEAD_CLAIMED', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          // If claimed by someone else, remove it immediately from our queue
          setUnclaimedLeads(prev => prev.filter(l => l.id !== data.leadId));
          if (data.claimedBy !== currentEmployee.code) {
            toast.info(`Inquiry #${data.leadId.slice(0, 8)} claimed by ${data.claimedByName || data.claimedBy}`);
          }
          onRefreshMetrics?.();
        } catch (err) {
          console.error('SSE parse error:', err);
        }
      });

      eventSource.addEventListener('NEW_INQUIRY', () => {
        fetchUnclaimedLeads();
        onRefreshMetrics?.();
        toast.success('New inbound tourist inquiry arrived in the live queue!');
      });

      eventSource.onerror = () => {
        // Fallback polling will handle updates
      };
    } catch (err) {
      console.warn('SSE connection failed, relying on polling fallback:', err);
    }

    // 1-second interval for ticking SLA countdown clocks
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    // 25-second polling backup
    const poller = setInterval(fetchUnclaimedLeads, 25000);

    return () => {
      if (eventSource) eventSource.close();
      clearInterval(timer);
      clearInterval(poller);
    };
  }, [currentEmployee.code]);

  // 3. Atomic Claim Action calling POST /api/sales/leads/:id/claim
  const handleAtomicClaim = async (lead: Lead) => {
    setClaimingId(lead.id);
    setConflictAlert(null);

    try {
      const token = localStorage.getItem('team_auth_token') || localStorage.getItem('teamToken') || localStorage.getItem('token') || '';
      const portalKey = localStorage.getItem('kashmir_portal_key') || '';

      const res = await fetch(`${API_BASE_URL}/sales/leads/${lead.id}/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          ...(portalKey ? { 'x-portal-key': portalKey } : {})
        },
        body: JSON.stringify({
          employeeCode: currentEmployee.code,
          employeeName: currentEmployee.name
        })
      });

      const data = await res.json();

      if (res.status === 409 || data.code === 'RACE_CONDITION_BLOCKED') {
        // Race condition: another sales executive claimed it in the same split second
        setConflictAlert(`Collision Avoided: Inquiry #${lead.id.slice(0, 8)} was just claimed by another executive.`);
        // Remove from list
        setUnclaimedLeads(prev => prev.filter(l => l.id !== lead.id));
        onRefreshMetrics?.();
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to claim lead');
      }

      toast.success(`Inquiry claimed! Assigned to ${currentEmployee.name} (${currentEmployee.code})`);
      
      // Remove from unclaimed queue
      setUnclaimedLeads(prev => prev.filter(l => l.id !== lead.id));
      onRefreshMetrics?.();

      // Send to parent to route to Itinerary Builder / Active Pipeline
      onClaimLead(data.lead || { ...lead, assignedTo: currentEmployee.code, leadStage: 'CLAIMED' });
    } catch (err: any) {
      toast.error(err.message || 'Error executing atomic claim transaction');
    } finally {
      setClaimingId(null);
    }
  };

  // 4. Calculate SLA timer and auto-escalated priority
  const calculateSLA = (createdAt: string) => {
    const createdTime = new Date(createdAt).getTime();
    const elapsedSeconds = Math.floor((currentTime - createdTime) / 1000);
    const fifteenMinSeconds = 15 * 60;
    const remainingSeconds = fifteenMinSeconds - elapsedSeconds;

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

    if (remainingSeconds < 300) { // < 5 mins
      return {
        isBreached: false,
        remainingText,
        badgeColor: 'bg-orange-500/20 text-orange-400 border border-orange-500/40 animate-pulse',
        calculatedPriority: 'HIGH'
      };
    } else if (remainingSeconds < 600) { // < 10 mins
      return {
        isBreached: false,
        remainingText,
        badgeColor: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
        calculatedPriority: 'MEDIUM'
      };
    } else {
      return {
        isBreached: false,
        remainingText,
        badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
        calculatedPriority: 'LOW'
      };
    }
  };

  // 5. Filter and search
  const filteredLeads = unclaimedLeads.filter(lead => {
    const query = searchTerm.toLowerCase();
    const matchesSearch = 
      (lead.customerName || '').toLowerCase().includes(query) ||
      (lead.destination || '').toLowerCase().includes(query) ||
      (lead.phone || '').includes(query);

    if (!matchesSearch) return false;

    if (priorityFilter !== 'ALL') {
      const sla = calculateSLA(lead.createdAt);
      if (sla.calculatedPriority !== priorityFilter) return false;
    }

    return true;
  });

  return (
    <div className="space-y-4">
      {/* Collision Alert Banner */}
      {conflictAlert && (
        <div className="bg-rose-500/15 border border-rose-500/40 text-rose-200 px-4 py-3 rounded-xl flex items-center justify-between text-sm backdrop-blur-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{conflictAlert}</span>
          </div>
          <button 
            onClick={() => setConflictAlert(null)}
            className="text-rose-400 hover:text-white text-xs font-semibold uppercase px-2 py-1 rounded"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-[#0F141C]/80 p-4 rounded-xl border border-white/10 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
              Live Inbound Lead Queue
            </h2>
            <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs">
              {unclaimedLeads.length} Unclaimed
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time SSE inbound inquiries with 15-minute response SLA escalation.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search traveler, city, phone..."
              className="pl-8 bg-[#07090E] border-white/10 text-xs text-white placeholder:text-slate-500 h-9 rounded-lg focus:border-amber-400 w-full"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => { setLoading(true); fetchUnclaimedLeads(); }}
              className="border-white/10 text-slate-300 hover:text-white hover:bg-white/5 h-9 px-2.5 shrink-0"
              title="Refresh queue"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* Leads List / Cards */}
      {loading && unclaimedLeads.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-[#0F141C]/50 rounded-xl border border-white/5">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-400 mb-2" />
          <p className="text-sm">Connecting to live sales stream & fetching inquiries...</p>
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-[#0F141C]/50 rounded-xl border border-white/5">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
          <p className="text-sm font-medium text-white">All Clear! No unclaimed inquiries in queue.</p>
          <p className="text-xs text-slate-400 mt-1">
            New traveler inquiries from the booking engine will stream here immediately.
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
                className={`relative overflow-hidden bg-[#0F141C]/95 border transition-all duration-200 rounded-xl p-4 flex flex-col justify-between ${
                  sla.isBreached 
                    ? 'border-rose-500/40 hover:border-rose-500/70 shadow-lg shadow-rose-950/20' 
                    : 'border-white/10 hover:border-amber-500/40 shadow-lg shadow-black/40'
                }`}
              >
                {/* Top Strip: SLA Badge & Inbound Tag */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="text-[11px] font-mono text-slate-400">
                      #{lead.id.slice(0, 8)}
                    </span>
                    {(lead.sourceCta?.includes('META') || lead.leadCategory === 'META_AD_CONVERT') && (
                      <Badge className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-pink-300 border border-pink-500/30 text-[9px] font-bold px-1.5 py-0">
                        Meta Ad
                      </Badge>
                    )}
                    {lead.leadStage === 'QUOTE_SENT' && (
                      <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold px-1.5 py-0">
                        Auto-Quoted
                      </Badge>
                    )}
                  </div>
                  <Badge className={`${sla.badgeColor} text-[10px] font-mono font-bold px-2 py-0.5 flex items-center gap-1 shrink-0`}>
                    <Clock className="w-2.5 h-2.5" />
                    {sla.remainingText}
                  </Badge>
                </div>

                {/* Traveler Name and Budget */}
                <div className="mb-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-bold text-white tracking-wide truncate">
                      {lead.customerName || 'Anonymous Traveler'}
                    </h3>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-emerald-400">
                        {typeof lead.budget === 'number' 
                          ? `₹${lead.budget.toLocaleString('en-IN')}` 
                          : lead.budget || 'Flexible Budget'}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <span>{lead.phone}</span>
                    {lead.email && <span className="text-slate-600">• {lead.email}</span>}
                  </p>
                </div>

                {/* Itinerary Specs Grid */}
                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-[#07090E]/80 border border-white/5 mb-4 text-xs">
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
                    <span>{paxTotal} Guests ({lead.adultsCount || 2}A{lead.childrenCount ? ` + ${lead.childrenCount}C` : ''})</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-300 truncate">
                    <Hotel className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">{lead.hotelCategory || '4-Star Luxury'}</span>
                  </div>
                </div>

                {/* Action Button: Atomic CLAIM & BUILD */}
                <Button
                  onClick={() => handleAtomicClaim(lead)}
                  disabled={isClaiming}
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-xs h-10 rounded-lg shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                  {isClaiming ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Locking Transaction...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5 fill-black" />
                      <span>CLAIM & BUILD ITINERARY</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </Button>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
