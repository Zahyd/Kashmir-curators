import React, { useState, useEffect, useCallback } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import { TrendingUp, BarChart3, Award, MapPin, RefreshCw, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { salesApi } from '@/lib/salesApi';
import { useTeamAuth } from '@/contexts/TeamAuthContext';

export default function SalesAnalyticsPanel() {
  const { subscribeSalesEvent, onlineStaffCodes } = useTeamAuth();
  const [data, setData] = useState<Awaited<ReturnType<typeof salesApi.getAnalytics>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await salesApi.getAnalytics();
      setData(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to compute sales analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  useEffect(() => {
    const unsub = subscribeSalesEvent((eventName) => {
      if (
        eventName === 'LEAD_CREATED' ||
        eventName === 'NEW_INQUIRY' ||
        eventName === 'LEAD_CLAIMED' ||
        eventName === 'STAGE_UPDATED' ||
        eventName === 'PAYMENT_CONFIRMED'
      ) {
        loadAnalytics();
      }
    });
    return unsub;
  }, [subscribeSalesEvent, loadAnalytics]);

  if (loading && !data) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <Card key={i} className="bg-[#0B0F17] border-white/10 rounded-3xl p-6 h-72 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error && !data) {
    return (
      <Card className="bg-[#0B0F17] border-red-500/25 rounded-3xl p-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-red-300">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
        <Button size="sm" variant="outline" onClick={loadAnalytics} className="border-red-500/30 text-red-300">
          Retry
        </Button>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-amber-400" />
            <span>Revenue & Conversion Telemetry</span>
          </h3>
          <p className="text-[11px] text-white/45 mt-0.5">
            Real-time database aggregation • Avg Deal Size ₹{data.summary.avgDealValueINR.toLocaleString('en-IN')} • Verified Cash Collected ₹
            {data.summary.totalCollectedINR.toLocaleString('en-IN')}
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={loadAnalytics}
          className="h-8 px-3 rounded-xl bg-white/5 border-white/10 text-white/75 text-[11px]"
        >
          <RefreshCw className={`w-3 h-3 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Sync
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* Monthly Revenue & Cash Collections Chart */}
        <Card className="xl:col-span-7 bg-[#0B0F17] border-white/10 rounded-3xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white">6-Month Confirmed Revenue vs Cash Collected (₹)</span>
            </div>
            <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30 text-[10px]">
              {data.summary.conversionRatePct}% Win Rate
            </Badge>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.monthlySeries} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.45)" fontSize={11} />
                <YAxis stroke="rgba(255,255,255,0.45)" fontSize={11} tickFormatter={(v) => `₹${Math.round(v / 1000)}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0B0F17',
                    borderColor: 'rgba(255,255,255,0.15)',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#fff'
                  }}
                  formatter={(value: number | string) => `₹${Number(value || 0).toLocaleString('en-IN')}`}
                />
                <Area type="monotone" dataKey="revenue" name="Booked Value" stroke="#F59E0B" fill="url(#revGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="collected" name="Cash Collected" stroke="#10B981" fill="url(#colGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Stage Distribution Funnel */}
        <Card className="xl:col-span-5 bg-[#0B0F17] border-white/10 rounded-3xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white">Pipeline Stage Funnel</span>
            <span className="text-[10px] text-white/45 font-mono">{data.summary.totalLeads} Total Deals</span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.stageDistribution} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="stage" stroke="rgba(255,255,255,0.45)" fontSize={10} interval={0} angle={-18} textAnchor="end" height={45} />
                <YAxis stroke="rgba(255,255,255,0.45)" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0B0F17',
                    borderColor: 'rgba(255,255,255,0.15)',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#fff'
                  }}
                />
                <Bar dataKey="count" name="Deals" fill="#F59E0B" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Bottom Row: Top Destinations & Concierge Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-[#0B0F17] border-white/10 rounded-3xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-white">Top Kashmir Circuits by Volume</span>
          </div>
          {data.topDestinations.length === 0 ? (
            <p className="text-xs text-white/40 py-4 text-center">No destination volume yet.</p>
          ) : (
            <div className="space-y-2">
              {data.topDestinations.map((dest) => (
                <div
                  key={dest.destination}
                  className="p-3 rounded-2xl bg-[#0F141C] border border-white/5 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="text-xs font-bold text-white">{dest.destination}</div>
                    <div className="text-[10px] text-white/45">{dest.count} inquiries</div>
                  </div>
                  <div className="text-xs font-black text-amber-300">
                    ₹{dest.valueINR.toLocaleString('en-IN')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="bg-[#0B0F17] border-white/10 rounded-3xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-white">Concierge Performance Leaderboard</span>
          </div>
          {data.conciergeLeaderboard.length === 0 ? (
            <p className="text-xs text-white/40 py-4 text-center">No assigned concierge deals recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {data.conciergeLeaderboard.slice(0, 5).map((rep) => {
                const liveOnline = rep.isOnline || onlineStaffCodes.includes(rep.code);
                return (
                  <div
                    key={rep.code}
                    className="p-3 rounded-2xl bg-[#0F141C] border border-white/5 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          liveOnline ? 'bg-emerald-400' : 'bg-white/25'
                        }`}
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">{rep.name}</div>
                        <div className="text-[10px] text-white/45 font-mono">
                          {rep.code} • {rep.confirmed}/{rep.totalLeads} won ({rep.conversionRatePct}%)
                        </div>
                      </div>
                    </div>
                    <div className="text-xs font-black text-emerald-300 shrink-0">
                      ₹{rep.revenueINR.toLocaleString('en-IN')}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
