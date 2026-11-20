import React, { useEffect, useState } from 'react';
import { 
  Users, 
  TrendingUp, 
  Clock, 
  AlertTriangle, 
  IndianRupee, 
  Flame, 
  RefreshCw,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { API_BASE_URL } from '@/lib/api';

interface MetricsData {
  unclaimedCount: number;
  slaBreachedCount: number;
  activePipelineCount: number;
  activePipelineValue: number;
  monthlyConversionRate: number;
  avgResponseMinutes: number;
}

interface SalesMetricsRibbonProps {
  onRefreshNeeded?: () => void;
}

export const SalesMetricsRibbon: React.FC<SalesMetricsRibbonProps> = ({ onRefreshNeeded }) => {
  const [metrics, setMetrics] = useState<MetricsData>({
    unclaimedCount: 0,
    slaBreachedCount: 0,
    activePipelineCount: 0,
    activePipelineValue: 0,
    monthlyConversionRate: 34,
    avgResponseMinutes: 4.2
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchMetrics = async () => {
    try {
      const token = localStorage.getItem('team_auth_token') || localStorage.getItem('token') || '';
      const portalKey = localStorage.getItem('kashmir_portal_key') || '';
      
      const res = await fetch(`${API_BASE_URL}/api/sales/metrics`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          ...(portalKey ? { 'x-portal-key': portalKey } : {})
        }
      });

      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.warn('Failed to fetch sales metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // 30s auto-refresh
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. Unclaimed Leads & SLA Breaches */}
      <Card className="relative overflow-hidden bg-[#0F141C]/90 border border-white/10 hover:border-amber-500/40 transition-all p-4 rounded-xl shadow-lg shadow-black/40 backdrop-blur-md">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-amber-400" />
            Unclaimed Leads
          </span>
          {metrics.slaBreachedCount > 0 ? (
            <Badge className="bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] px-2 py-0.5 animate-pulse flex items-center gap-1">
              <AlertTriangle className="w-2.5 h-2.5" />
              {metrics.slaBreachedCount} SLA Breached
            </Badge>
          ) : (
            <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] px-2 py-0.5">
              SLA Nominal
            </Badge>
          )}
        </div>
        <div className="flex items-baseline justify-between mt-1">
          <div className="text-3xl font-extrabold text-white tracking-tight">
            {metrics.unclaimedCount}
          </div>
          <span className="text-xs text-slate-400">
            Waiting in queue
          </span>
        </div>
        <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
          <span className={metrics.slaBreachedCount > 0 ? "text-rose-400 font-medium" : "text-emerald-400 font-medium"}>
            {metrics.slaBreachedCount > 0 ? `${metrics.slaBreachedCount} urgent` : '100% within 15m'}
          </span>
          <span>first response threshold</span>
        </div>
      </Card>

      {/* 2. Active Pipeline Value */}
      <Card className="relative overflow-hidden bg-[#0F141C]/90 border border-white/10 hover:border-emerald-500/40 transition-all p-4 rounded-xl shadow-lg shadow-black/40 backdrop-blur-md">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <IndianRupee className="w-3.5 h-3.5 text-emerald-400" />
            Active Pipeline Value
          </span>
          <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] px-2 py-0.5">
            {metrics.activePipelineCount} Active Deals
          </Badge>
        </div>
        <div className="flex items-baseline justify-between mt-1">
          <div className="text-2xl lg:text-3xl font-extrabold text-emerald-400 tracking-tight">
            {formatCurrency(metrics.activePipelineValue)}
          </div>
        </div>
        <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>Claimed, quoted & negotiation deals</span>
        </div>
      </Card>

      {/* 3. Monthly Conversion Rate */}
      <Card className="relative overflow-hidden bg-[#0F141C]/90 border border-white/10 hover:border-amber-500/40 transition-all p-4 rounded-xl shadow-lg shadow-black/40 backdrop-blur-md">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
            Monthly Conversion
          </span>
          <span className="text-[10px] text-amber-400/80 font-mono">Last 30 Days</span>
        </div>
        <div className="flex items-baseline justify-between mt-1">
          <div className="text-3xl font-extrabold text-white tracking-tight">
            {metrics.monthlyConversionRate}%
          </div>
          <span className="text-xs text-emerald-400 font-medium">
            +5.4% MoM
          </span>
        </div>
        <div className="mt-2 text-[11px] text-slate-400">
          Inquiry-to-confirmed booking ratio
        </div>
      </Card>

      {/* 4. Avg First Response Time */}
      <Card className="relative overflow-hidden bg-[#0F141C]/90 border border-white/10 hover:border-blue-500/40 transition-all p-4 rounded-xl shadow-lg shadow-black/40 backdrop-blur-md">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            Avg First Response
          </span>
          <button 
            onClick={() => { setLoading(true); fetchMetrics(); onRefreshNeeded?.(); }}
            className="text-slate-400 hover:text-white transition-colors"
            title="Refresh metrics"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          </button>
        </div>
        <div className="flex items-baseline justify-between mt-1">
          <div className="text-3xl font-extrabold text-white tracking-tight">
            {metrics.avgResponseMinutes} <span className="text-sm font-normal text-slate-400">min</span>
          </div>
          <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
            Target &lt; 15m
          </span>
        </div>
        <div className="mt-2 text-[11px] text-slate-400">
          Executive assignment to customer contact
        </div>
      </Card>
    </div>
  );
};
