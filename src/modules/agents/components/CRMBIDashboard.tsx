import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Award, 
  Clock, 
  AlertCircle, 
  Compass, 
  BarChart3, 
  CheckCircle2, 
  Sparkles,
  ArrowUpRight,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { API_BASE_URL } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export const CRMBIDashboard: React.FC = () => {
  const { token } = useAuth();
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchMetrics = async () => {
    try {
      setIsLoading(true);
      const authToken = token || localStorage.getItem('auth_token') || '';
      const res = await fetch(`${API_BASE_URL}/crm/bi/metrics`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      }
    } catch (err) {
      console.error('Failed to fetch CRM BI metrics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  if (!metrics && isLoading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-500" />
        <p className="text-xs">Computing real-time pipeline analytics...</p>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="space-y-6">
      {/* 4 Primary KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Pipeline Inquiries */}
        <Card className="rounded-2xl border-border/60 bg-card shadow-sm hover:border-amber-500/30 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Inquiries
            </CardTitle>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Users className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-foreground">{metrics.totalInquiries || 0}</div>
            <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
              <span className="text-emerald-500 font-semibold flex items-center">
                <ArrowUpRight className="w-3 h-3" /> Live
              </span>
              <span>Across all 8 sales stages</span>
            </p>
          </CardContent>
        </Card>

        {/* Active Pipeline Value */}
        <Card className="rounded-2xl border-border/60 bg-card shadow-sm hover:border-amber-500/30 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Active Pipeline Value
            </CardTitle>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
              <TrendingUp className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-foreground font-mono">
              ₹{((metrics.totalPipelineValue || 0) / 100000).toFixed(2)}L
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Quotes & negotiation stage value
            </p>
          </CardContent>
        </Card>

        {/* Confirmed Revenue */}
        <Card className="rounded-2xl border-border/60 bg-card shadow-sm hover:border-amber-500/30 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Confirmed Revenue
            </CardTitle>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <DollarSign className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              ₹{((metrics.confirmedRevenue || 0) / 100000).toFixed(2)}L
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {metrics.confirmedCount || 0} bookings secured
            </p>
          </CardContent>
        </Card>

        {/* Conversion Rate */}
        <Card className="rounded-2xl border-border/60 bg-card shadow-sm hover:border-amber-500/30 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Conversion Rate
            </CardTitle>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Award className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-amber-500 font-mono">
              {metrics.overallConversionRate}%
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Inquiry to booking ratio
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Stage Distribution & Destination Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Stage Progression Funnel */}
        <Card className="rounded-2xl border-border/60 bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-amber-500" />
              <span>Pipeline Stage Distribution</span>
            </h3>
            <span className="text-[10px] text-muted-foreground font-mono font-bold">8 Funnel Stages</span>
          </div>

          <div className="space-y-2.5">
            {[
              { stage: 'NEW_LEAD', label: 'Fresh Inquiries', color: 'bg-blue-500' },
              { stage: 'FOLLOW_UP', label: 'Follow Up', color: 'bg-indigo-500' },
              { stage: 'QUOTE_SENT', label: 'Quote Dispatched', color: 'bg-purple-500' },
              { stage: 'NEGOTIATION', label: 'Under Negotiation', color: 'bg-pink-500' },
              { stage: 'PAYMENT_PENDING', label: 'Payment Pending', color: 'bg-amber-500' },
              { stage: 'CONFIRMED', label: 'Confirmed & Booked', color: 'bg-emerald-500' }
            ].map(item => {
              const count = metrics.stageCounts?.[item.stage] || 0;
              const pct = metrics.totalInquiries > 0 ? Math.round((count / metrics.totalInquiries) * 100) : 0;
              return (
                <div key={item.stage} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">{item.label}</span>
                    <span className="font-mono text-muted-foreground">{count} ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                    <div 
                      className={`h-full ${item.color} transition-all duration-500`}
                      style={{ width: `${Math.max(4, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Destination Analytics */}
        <Card className="rounded-2xl border-border/60 bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
              <Compass className="w-4 h-4 text-amber-500" />
              <span>Top Kashmir Destinations Requested</span>
            </h3>
            <span className="text-[10px] text-muted-foreground font-semibold">Live Demand</span>
          </div>

          <div className="space-y-3">
            {Object.entries(metrics.destinationStats || {}).length === 0 ? (
              <p className="text-xs text-muted-foreground">No destination trends available yet.</p>
            ) : (
              Object.entries(metrics.destinationStats || {})
                .sort((a: any, b: any) => b[1] - a[1])
                .slice(0, 5)
                .map(([dest, count]: any) => (
                  <div key={dest} className="p-3 rounded-xl bg-muted/30 border border-border/50 flex items-center justify-between text-xs">
                    <span className="font-bold text-foreground truncate">{dest}</span>
                    <Badge variant="outline" className="font-mono text-xs">
                      {count} inquiries
                    </Badge>
                  </div>
                ))
            )}
          </div>
        </Card>
      </div>

      {/* Sales Agent Performance Breakdown */}
      {metrics.agentPerformance?.length > 0 && (
        <Card className="rounded-2xl border-border/60 bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <span>Sales Agent Ownership & Performance</span>
            </h3>
            <Button size="sm" variant="ghost" onClick={fetchMetrics} className="h-7 text-xs gap-1">
              <RefreshCw className="w-3 h-3" /> Refresh
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/40 text-muted-foreground uppercase font-bold text-[10px] border-b border-border/50">
                <tr>
                  <th className="p-2.5">Agent Email / Code</th>
                  <th className="p-2.5">Total Leads</th>
                  <th className="p-2.5">Confirmed</th>
                  <th className="p-2.5">Conversion %</th>
                  <th className="p-2.5 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {metrics.agentPerformance.map((a: any) => (
                  <tr key={a.agent} className="hover:bg-muted/20 transition-colors">
                    <td className="p-2.5 font-semibold text-foreground">{a.agent}</td>
                    <td className="p-2.5 font-mono">{a.total}</td>
                    <td className="p-2.5 font-mono text-emerald-500 font-bold">{a.confirmed}</td>
                    <td className="p-2.5 font-mono">{a.conversionRate}%</td>
                    <td className="p-2.5 font-mono font-bold text-right text-foreground">
                      ₹{a.revenue?.toLocaleString() || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default CRMBIDashboard;
