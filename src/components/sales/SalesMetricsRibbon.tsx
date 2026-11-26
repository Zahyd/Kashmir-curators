import React, { useEffect, useState, useCallback } from 'react';
import { 
  Users, 
  TrendingUp, 
  Clock, 
  AlertTriangle, 
  IndianRupee, 
  RefreshCw,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { salesApi, getErrorMessage } from '@/lib/salesApi';
import { useTeamAuth } from '@/contexts/TeamAuthContext';

interface MetricsData {
  unclaimedCount: number;
  slaBreachedCount: number;
  activePipelineCount: number;
  activePipelineValue: number;
  confirmedCount?: number;
  confirmedRevenue?: number;
  confirmedValue?: number;
  monthlyConversionRate: number;
  conversionDelta: number | null;
  avgResponseMinutes: number | null;
  onlineStaffCount?: number;
}

interface SalesMetricsRibbonProps {
  refreshSignal?: number;
  onRefreshNeeded?: () => void;
}

export const SalesMetricsRibbon: React.FC<SalesMetricsRibbonProps> = ({ refreshSignal = 0, onRefreshNeeded }) => {
  const { subscribeSalesEvent, onlineStaffCodes } = useTeamAuth();
  const [metrics, setMetrics] = useState<MetricsData>({
    unclaimedCount: 0,
    slaBreachedCount: 0,
    activePipelineCount: 0,
    activePipelineValue: 0,
    confirmedCount: 0,
    confirmedRevenue: 0,
    monthlyConversionRate: 0,
    conversionDelta: null,
    avgResponseMinutes: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      const data = await salesApi.getMetrics();
      setMetrics(data);
      setError(null);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Metrics unavailable'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics, refreshSignal]);

  useEffect(() => {
    const unsub = subscribeSalesEvent((eventName) => {
      if (
        eventName === 'NEW_INQUIRY' ||
        eventName === 'LEAD_CREATED' ||
        eventName === 'LEAD_CLAIMED' ||
        eventName === 'LEAD_UPDATED' ||
        eventName === 'LEAD_DELETED' ||
        eventName === 'STAGE_UPDATED' ||
        eventName === 'PAYMENT_CONFIRMED'
      ) {
        fetchMetrics();
      }
    });
    const interval = window.setInterval(fetchMetrics, 45000);
    return () => {
      unsub();
      window.clearInterval(interval);
    };
  }, [subscribeSalesEvent, fetchMetrics]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-6">
      {/* 1. Unclaimed Leads & SLA Breaches */}
      <Card className="relative overflow-hidden bg-[#0F141C]/90 border border-white/10 hover:border-amber-500/40 transition-all p-3 sm:p-4 rounded-xl shadow-lg shadow-black/40 backdrop-blur-md flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-1.5 sm:mb-2 flex-wrap gap-1">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">Unclaimed</span>
            </span>
            {metrics.slaBreachedCount > 0 ? (
              <Badge className="bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[9px] sm:text-[10px] px-1.5 py-0.5 animate-pulse flex items-center gap-1">
                <AlertTriangle className="w-2.5 h-2.5" />
                {metrics.slaBreachedCount} Urg
              </Badge>
            ) : (
              <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] sm:text-[10px] px-1.5 py-0.5">
                SLA OK
              </Badge>
            )}
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {metrics.unclaimedCount}
            </div>
            <span className="text-[10px] sm:text-xs text-slate-400">
              in queue
            </span>
          </div>
        </div>
        <div className="mt-2 text-[10px] sm:text-[11px] text-slate-400 flex items-center gap-1 truncate">
          <span className={metrics.slaBreachedCount > 0 ? "text-rose-400 font-medium truncate" : "text-emerald-400 font-medium truncate"}>
            {metrics.slaBreachedCount > 0 ? `${metrics.slaBreachedCount} urgent` : '100% within 15m'}
          </span>
          <span className="hidden sm:inline">first response threshold</span>
        </div>
      </Card>

      {/* 2. Active Pipeline Value */}
      <Card className="relative overflow-hidden bg-[#0F141C]/90 border border-white/10 hover:border-emerald-500/40 transition-all p-3 sm:p-4 rounded-xl shadow-lg shadow-black/40 backdrop-blur-md flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-1.5 sm:mb-2 flex-wrap gap-1">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <IndianRupee className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">Pipeline</span>
            </span>
            <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] sm:text-[10px] px-1.5 py-0.5">
              {metrics.activePipelineCount} Active
            </Badge>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-emerald-400 tracking-tight truncate">
              {formatCurrency(metrics.activePipelineValue)}
            </div>
          </div>
        </div>
        <div className="mt-2 text-[10px] sm:text-[11px] text-slate-400 flex items-center justify-between gap-1 truncate">
          <span className="flex items-center gap-1 truncate">
            <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
            <span className="truncate">
              {(metrics.confirmedRevenue ?? metrics.confirmedValue)
                ? `₹${Number(metrics.confirmedRevenue ?? metrics.confirmedValue).toLocaleString('en-IN')} booked`
                : 'Active deals'}
            </span>
          </span>
          {error && (
            <button onClick={fetchMetrics} className="text-rose-400 underline text-[10px] shrink-0">
              Retry
            </button>
          )}
        </div>
      </Card>

      {/* 3. Monthly Conversion Rate */}
      <Card className="relative overflow-hidden bg-[#0F141C]/90 border border-white/10 hover:border-amber-500/40 transition-all p-3 sm:p-4 rounded-xl shadow-lg shadow-black/40 backdrop-blur-md flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-1.5 sm:mb-2 flex-wrap gap-1">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">Conversion</span>
            </span>
            <span className="text-[9px] sm:text-[10px] text-amber-400/80 font-mono">30D</span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {metrics.monthlyConversionRate}%
            </div>
            {metrics.conversionDelta !== null ? (
              <span className={`text-[10px] sm:text-xs font-medium ${metrics.conversionDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {metrics.conversionDelta >= 0 ? `+${metrics.conversionDelta}%` : `${metrics.conversionDelta}%`}
              </span>
            ) : (
              <span className="text-[10px] text-slate-500 font-medium">
                No prior 30d
              </span>
            )}
          </div>
        </div>
        <div className="mt-2 text-[10px] sm:text-[11px] text-slate-400 truncate">
          Inquiry-to-booking
        </div>
      </Card>

      {/* 4. Avg First Response Time */}
      <Card className="relative overflow-hidden bg-[#0F141C]/90 border border-white/10 hover:border-blue-500/40 transition-all p-3 sm:p-4 rounded-xl shadow-lg shadow-black/40 backdrop-blur-md flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-1.5 sm:mb-2 flex-wrap gap-1">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="truncate">First Resp</span>
            </span>
            <button 
              onClick={() => { setLoading(true); fetchMetrics(); onRefreshNeeded?.(); }}
              className="text-slate-400 hover:text-white transition-colors p-0.5"
              title="Refresh metrics"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin text-amber-400' : ''}`} />
            </button>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {metrics.avgResponseMinutes !== null ? (
                <>
                  {metrics.avgResponseMinutes} <span className="text-xs sm:text-sm font-normal text-slate-400">min</span>
                </>
              ) : (
                <span className="text-slate-400">—</span>
              )}
            </div>
            {metrics.avgResponseMinutes !== null ? (
              <span className={`text-[9px] sm:text-[10px] px-1 py-0.5 rounded border font-mono ${
                metrics.avgResponseMinutes <= 15
                  ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                  : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
              }`}>
                {metrics.avgResponseMinutes <= 15 ? '<15m' : '>15m'}
              </span>
            ) : (
              <span className="text-[9px] sm:text-[10px] text-slate-400 bg-white/5 px-1.5 py-0.5 rounded border border-white/10 font-mono">
                No data
              </span>
            )}
          </div>
        </div>
        <div className="mt-2 text-[10px] sm:text-[11px] text-slate-400 truncate">
          Lead-to-contact SLA
        </div>
      </Card>
    </div>
  );
};
