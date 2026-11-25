import React, { useEffect, useState } from 'react';
import {
  Clock,
  Timer,
  Coffee,
  LogOut,
  Play,
  RefreshCw,
  Users,
  Calendar,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { salesApi, AttendanceStatusResponse } from '@/lib/salesApi';
import { useTeamAuth } from '@/contexts/TeamAuthContext';
import { canManageTeam } from '@/lib/rbac';

function formatDurationMinutes(totalMinutes: number): string {
  const mins = Math.max(0, Math.round(totalMinutes || 0));
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return `${hrs}h ${rem}m`;
}

export default function WorkLog() {
  const { teamUser } = useTeamAuth();
  const isManager = canManageTeam(teamUser?.role);

  const [data, setData] = useState<AttendanceStatusResponse | null>(null);
  const [liveTeam, setLiveTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionBusy, setActionBusy] = useState(false);

  const loadAttendance = async () => {
    try {
      const [myData, presence] = await Promise.all([
        salesApi.getMyAttendance(),
        isManager ? salesApi.getLivePresence().catch(() => null) : Promise.resolve(null)
      ]);
      setData(myData);
      if (presence?.presenceList) {
        setLiveTeam(presence.presenceList);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load work log telemetry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, [isManager]);

  // Real 60-second heartbeat pulse while clocked in and not on break
  useEffect(() => {
    if (!data?.session?.isActive) return;
    const interval = setInterval(() => {
      salesApi.sendPulse().catch(() => {});
    }, 60000);
    return () => clearInterval(interval);
  }, [data?.session?.isActive]);

  const handleClockIn = async () => {
    setActionBusy(true);
    try {
      await salesApi.clockIn('Sales Command Desk');
      toast.success('Shift started & attendance recorded');
      await loadAttendance();
    } catch (err: any) {
      toast.error(err?.message || 'Clock-in failed');
    } finally {
      setActionBusy(false);
    }
  };

  const handleToggleBreak = async () => {
    setActionBusy(true);
    try {
      const res = await salesApi.toggleBreak();
      toast.success(res.message || (res.isOnBreak ? 'Break started' : 'Shift resumed'));
      await loadAttendance();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update break status');
    } finally {
      setActionBusy(false);
    }
  };

  const handleClockOut = async () => {
    setActionBusy(true);
    try {
      const res = await salesApi.clockOut();
      toast.success(res.message || 'Clocked out cleanly');
      await loadAttendance();
    } catch (err: any) {
      toast.error(err?.message || 'Clock-out failed');
    } finally {
      setActionBusy(false);
    }
  };

  const history = data?.history || [];
  const activeSession = data?.session;
  const todayAttendance = data?.attendance;

  // Compute weekly totals from real last 7 records
  const last7 = history.slice(0, 7);
  const weeklyWorkMinutes = last7.reduce((sum, r) => sum + (r.totalWorkMinutes || 0), 0);
  const weeklyWorkHours = Number((weeklyWorkMinutes / 60).toFixed(1));
  const weeklyTargetProgress = Math.min(100, Math.round((weeklyWorkHours / 45) * 100));

  const avgCheckInTime = (() => {
    if (last7.length === 0) return '—';
    const avgMinutes = Math.round(
      last7.reduce((sum, r) => {
        const d = new Date(r.firstLoginAt);
        return sum + d.getHours() * 60 + d.getMinutes();
      }, 0) / last7.length
    );
    const h = Math.floor(avgMinutes / 60);
    const m = avgMinutes % 60;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 || 12;
    return `${displayH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
  })();

  const chartDays = [...last7].reverse();
  const maxDayHours = Math.max(8, ...chartDays.map((d) => Number(((d.totalWorkMinutes || 0) / 60).toFixed(1))));

  const shiftBadge = activeSession?.isActive
    ? activeSession.isOnBreak
      ? { label: 'ON BREAK', style: 'bg-amber-500/20 text-amber-300 border-amber-500/30' }
      : { label: 'SHIFT ACTIVE', style: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' }
    : { label: todayAttendance?.status || 'CLOCKED OUT', style: 'bg-slate-700/40 text-slate-300 border-white/10' };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Header & Live Shift Controls */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-[#0F141C]/90 border border-white/10 p-5 rounded-xl shadow-lg">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-[10px] font-mono font-bold uppercase tracking-wider mb-1">
            <Timer className="w-3.5 h-3.5" />
            <span>Attendance & Shift Telemetry</span>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-bold text-white tracking-tight">Concierge Work Log</h1>
            <Badge className={cn('text-[10px] font-mono border', shiftBadge.style)}>{shiftBadge.label}</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Synced directly with EmployeeAttendance &amp; EmployeeSession tables in Neon DB.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!activeSession?.isActive ? (
            <Button
              onClick={handleClockIn}
              disabled={actionBusy}
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs h-9 px-4 rounded-lg"
            >
              {actionBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Play className="w-3.5 h-3.5 mr-1.5" />}
              Clock In Shift
            </Button>
          ) : (
            <>
              <Button
                onClick={handleToggleBreak}
                disabled={actionBusy}
                variant="outline"
                className="border-amber-500/30 text-amber-300 hover:bg-amber-500/15 text-xs font-bold h-9 px-3.5 rounded-lg"
              >
                <Coffee className="w-3.5 h-3.5 mr-1.5" />
                {activeSession.isOnBreak ? 'Resume Work' : 'Take Break'}
              </Button>
              <Button
                onClick={handleClockOut}
                disabled={actionBusy}
                variant="outline"
                className="border-rose-500/30 text-rose-400 hover:bg-rose-500/15 text-xs font-bold h-9 px-3.5 rounded-lg"
              >
                <LogOut className="w-3.5 h-3.5 mr-1.5" />
                Clock Out
              </Button>
            </>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={loadAttendance}
            className="border-white/10 text-slate-300 hover:text-white h-9 px-2.5"
            title="Refresh work log"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin text-amber-400')} />
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-[#0F141C]/90 border border-white/10 p-5 rounded-xl">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Logged Hours (Last 7 Shifts)</p>
          <div className="flex items-baseline justify-between mt-2 mb-2">
            <h3 className="text-2xl font-extrabold text-white">{weeklyWorkHours} hrs</h3>
            <span className="text-xs font-mono text-amber-400">{weeklyTargetProgress}% of 45h</span>
          </div>
          <Progress value={weeklyTargetProgress} className="h-1.5 bg-white/5" />
        </Card>

        <Card className="bg-[#0F141C]/90 border border-white/10 p-5 rounded-xl">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Today Logged Work / Break</p>
          <div className="flex items-baseline justify-between mt-2">
            <h3 className="text-2xl font-extrabold text-emerald-400">
              {todayAttendance ? formatDurationMinutes(todayAttendance.totalWorkMinutes) : '0h 0m'}
            </h3>
            <span className="text-xs text-slate-400">
              Break: {todayAttendance ? formatDurationMinutes(todayAttendance.totalBreakMinutes) : '0h 0m'}
            </span>
          </div>
        </Card>

        <Card className="bg-[#0F141C]/90 border border-white/10 p-5 rounded-xl">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Average Check-In (IST)</p>
          <div className="flex items-baseline justify-between mt-2">
            <h3 className="text-2xl font-extrabold text-white">{avgCheckInTime}</h3>
            <span className="text-xs text-slate-400">{last7.length} shifts recorded</span>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Real Daily Work Chart */}
        <Card className="lg:col-span-2 bg-[#0F141C]/90 border border-white/10 p-5 rounded-xl">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400" />
              Recent Shift Hours
            </h4>
            <span className="text-[11px] text-slate-400">Asia/Kolkata</span>
          </div>

          {chartDays.length === 0 ? (
            <div className="h-44 flex items-center justify-center text-xs text-slate-500 border border-dashed border-white/10 rounded-lg">
              Clock in to start tracking daily shift hours.
            </div>
          ) : (
            <div className="flex items-end justify-between gap-3 h-44 px-2">
              {chartDays.map((day) => {
                const hrs = Number(((day.totalWorkMinutes || 0) / 60).toFixed(1));
                const heightPct = Math.max(8, Math.round((hrs / maxDayHours) * 100));
                return (
                  <div key={day.id} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    <span className="text-[10px] font-mono text-slate-400">{hrs}h</span>
                    <div className="w-full max-w-[44px] bg-white/5 rounded-t-lg flex items-end h-32 overflow-hidden">
                      <div
                        className={cn(
                          'w-full rounded-t-lg transition-all duration-500',
                          day.status === 'PRESENT' ? 'bg-emerald-500/80' : 'bg-amber-500/80'
                        )}
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">{day.date.slice(5)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Live Team Presence (for Managers/Directors) or Today Summary */}
        <Card className="bg-[#0F141C]/90 border border-white/10 p-5 rounded-xl">
          <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-emerald-400" />
            {isManager ? `Live Team Presence (${liveTeam.length})` : 'Current Session'}
          </h4>
          {isManager ? (
            liveTeam.length === 0 ? (
              <p className="text-xs text-slate-500 py-8 text-center">No staff members currently clocked in.</p>
            ) : (
              <div className="space-y-2.5 max-h-48 overflow-y-auto custom-scrollbar">
                {liveTeam.map((m) => (
                  <div key={m.id} className="p-2.5 rounded-lg bg-[#07090E] border border-white/10 flex items-center justify-between text-xs">
                    <div className="min-w-0">
                      <p className="font-bold text-white truncate">{m.employeeName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{m.employeeCode} • {m.assignedDesk}</p>
                    </div>
                    <Badge className={m.isOnBreak ? 'bg-amber-500/20 text-amber-300 text-[9px]' : 'bg-emerald-500/20 text-emerald-300 text-[9px]'}>
                      {m.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-[#07090E] border border-white/10">
                <p className="text-[10px] uppercase text-slate-400 font-bold">Desk</p>
                <p className="text-white font-semibold mt-0.5">{activeSession?.assignedDesk || 'Sales Command Desk'}</p>
              </div>
              <div className="p-3 rounded-lg bg-[#07090E] border border-white/10">
                <p className="text-[10px] uppercase text-slate-400 font-bold">First Login Today</p>
                <p className="text-white font-semibold mt-0.5">
                  {todayAttendance?.firstLoginAt ? new Date(todayAttendance.firstLoginAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Not clocked in yet'}
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Attendance Ledger */}
      <Card className="bg-[#0F141C]/90 border border-white/10 rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h4 className="text-sm font-bold text-white">Attendance History Ledger</h4>
          <Badge className="bg-white/5 text-slate-300 border border-white/10 text-[10px]">Last 14 Days</Badge>
        </div>
        {loading ? (
          <div className="p-10 text-center text-xs text-slate-400">Loading attendance logs...</div>
        ) : history.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-500">No attendance entries recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-[#07090E]/60 text-[10px] uppercase tracking-wider text-slate-400">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Check-In</th>
                  <th className="px-4 py-3">Check-Out</th>
                  <th className="px-4 py-3">Work Time</th>
                  <th className="px-4 py-3">Break</th>
                  <th className="px-4 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {history.map((row) => (
                  <tr key={row.id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-mono font-semibold text-white">{row.date}</td>
                    <td className="px-4 py-3 text-slate-300">
                      {new Date(row.firstLoginAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {row.lastLogoutAt ? new Date(row.lastLogoutAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Active'}
                    </td>
                    <td className="px-4 py-3 font-mono text-emerald-400">{formatDurationMinutes(row.totalWorkMinutes)}</td>
                    <td className="px-4 py-3 font-mono text-slate-400">{formatDurationMinutes(row.totalBreakMinutes)}</td>
                    <td className="px-4 py-3 text-right">
                      <Badge className="bg-white/5 text-slate-300 border-white/10 text-[10px]">{row.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
