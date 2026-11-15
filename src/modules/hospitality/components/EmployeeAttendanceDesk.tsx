import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  UserCheck, 
  Coffee, 
  LogOut, 
  Play, 
  Pause, 
  Users, 
  Download, 
  Calendar, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw,
  Building2,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/lib/api';
import { getHospitalityHeaders, getHospitalityToken } from '../utils/hospitalityAuth';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface AttendanceRecord {
  id: string;
  employeeCode: string;
  employeeName: string;
  role: string;
  date: string;
  firstLoginAt: string;
  lastLogoutAt?: string | null;
  totalWorkMinutes: number;
  totalBreakMinutes: number;
  status: 'PRESENT' | 'HALF_DAY' | 'OVERTIME' | 'ON_BREAK' | 'CLOCKED_OUT';
  shiftName: string;
}

interface PresenceMember {
  id: string;
  employeeCode: string;
  employeeName: string;
  role: string;
  portalType: string;
  loginAt: string;
  lastActivityAt: string;
  isOnBreak: boolean;
  breakMinutes: number;
  assignedDesk: string;
  totalWorkMinutes: number;
  status: 'ONLINE' | 'ON_BREAK';
  activeReservationsCount: number;
}

export const EmployeeAttendanceDesk: React.FC = () => {
  const { token, user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // My State
  const [myAttendance, setMyAttendance] = useState<AttendanceRecord | null>(null);
  const [mySession, setMySession] = useState<any | null>(null);
  const [myHistory, setMyHistory] = useState<AttendanceRecord[]>([]);

  // Presence State
  const [presenceList, setPresenceList] = useState<PresenceMember[]>([]);
  const [presenceStats, setPresenceStats] = useState({ totalActive: 0, totalOnline: 0, totalOnBreak: 0 });

  // Clock
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Attendance Data
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const authToken = getHospitalityToken(token);
      const headers = getHospitalityHeaders(authToken);

      const [myRes, presenceRes] = await Promise.all([
        fetch(`${API_BASE_URL}/attendance/my`, { headers }),
        fetch(`${API_BASE_URL}/attendance/live-presence`, { headers })
      ]);

      if (myRes.ok) {
        const myData = await myRes.json();
        setMyAttendance(myData.attendance || null);
        setMySession(myData.session || null);
        setMyHistory(myData.history || []);
      }

      if (presenceRes.ok) {
        const pData = await presenceRes.json();
        setPresenceList(pData.presenceList || []);
        setPresenceStats({
          totalActive: pData.totalActive || 0,
          totalOnline: pData.totalOnline || 0,
          totalOnBreak: pData.totalOnBreak || 0
        });
      }
    } catch (err) {
      console.error('Failed to load attendance data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Heartbeat every 2 minutes
    const heartbeat = setInterval(() => {
      const authToken = getHospitalityToken(token);
      fetch(`${API_BASE_URL}/attendance/pulse`, {
        method: 'POST',
        headers: getHospitalityHeaders(authToken)
      }).catch(() => {});
    }, 120000);

    return () => clearInterval(heartbeat);
  }, [token]);

  // Handle Clock In
  const handleClockIn = async () => {
    try {
      setActionLoading(true);
      const authToken = getHospitalityToken(token);
      const res = await fetch(`${API_BASE_URL}/attendance/clock-in`, {
        method: 'POST',
        headers: getHospitalityHeaders(authToken),
        body: JSON.stringify({ assignedDesk: 'Kashmir Hospitality Central Desk' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to clock in');

      toast.success(data.message || 'Clocked in successfully!', { icon: '🟢' });
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Clock-in failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Toggle Break
  const handleToggleBreak = async () => {
    try {
      setActionLoading(true);
      const authToken = getHospitalityToken(token);
      const res = await fetch(`${API_BASE_URL}/attendance/break`, {
        method: 'POST',
        headers: getHospitalityHeaders(authToken)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to toggle break');

      toast.info(data.message, { icon: data.isOnBreak ? '☕' : '💼' });
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Break action failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Clock Out
  const handleClockOut = async () => {
    if (!confirm('Are you sure you want to end your shift and clock out for today?')) return;

    try {
      setActionLoading(true);
      const authToken = getHospitalityToken(token);
      const res = await fetch(`${API_BASE_URL}/attendance/clock-out`, {
        method: 'POST',
        headers: getHospitalityHeaders(authToken)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to clock out');

      toast.success(data.message || 'Shift completed. Good job today!', { icon: '🚪' });
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Clock-out failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (myHistory.length === 0) {
      toast.error('No attendance records to export');
      return;
    }

    const headers = ['Date', 'Employee Code', 'Employee Name', 'Shift', 'First Login', 'Last Logout', 'Work Minutes', 'Break Minutes', 'Status'];
    const rows = myHistory.map(h => [
      h.date,
      h.employeeCode,
      h.employeeName,
      `"${h.shiftName}"`,
      new Date(h.firstLoginAt).toLocaleTimeString(),
      h.lastLogoutAt ? new Date(h.lastLogoutAt).toLocaleTimeString() : 'Active',
      h.totalWorkMinutes,
      h.totalBreakMinutes,
      h.status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Kashmir_Curators_Attendance_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Attendance records exported to CSV');
  };

  const isClockedIn = !!mySession?.isActive;
  const isOnBreak = !!mySession?.isOnBreak;
  const workMinutesToday = myAttendance?.totalWorkMinutes || 0;
  const workHours = (workMinutesToday / 60).toFixed(1);
  const targetMinutes = 480; // 8 hours standard target
  const progressPct = Math.min(100, Math.round((workMinutesToday / targetMinutes) * 100));

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Personal Punch Deck */}
      <div className="bg-gradient-to-r from-[#0b1015] via-[#0d141c] to-[#0b1015] border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge className="bg-amber-500/10 text-amber-300 border-amber-500/30 text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5">
                Authoritative Biometric & Session Radar
              </Badge>
              <Badge className="bg-emerald-500/10 text-emerald-300 border-emerald-500/30 text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5">
                Asia/Kolkata (IST) Active
              </Badge>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <UserCheck className="w-7 h-7 text-amber-400" />
              Employee Operations, Working Hours & Live Presence
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Track authenticated shifts, productive hours, lunch/tea breaks, and live teammate availability across the Kashmir Curators Hospitality & Reservations network.
            </p>
          </div>

          {/* Action Punch Console */}
          <div className="flex items-center gap-3 bg-black/40 border border-white/10 rounded-2xl p-2">
            {!isClockedIn ? (
              <Button
                onClick={handleClockIn}
                disabled={actionLoading}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold gap-2 h-11 px-6 rounded-xl shadow-lg shadow-emerald-600/20"
              >
                <Play className="w-4 h-4 fill-white" />
                Clock In Shift
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={handleToggleBreak}
                  disabled={actionLoading}
                  className={cn(
                    "h-11 px-4 rounded-xl gap-2 font-bold text-xs border transition-all",
                    isOnBreak
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse"
                      : "bg-white/[0.04] text-slate-300 border-white/10 hover:bg-white/10"
                  )}
                >
                  <Coffee className="w-4 h-4 text-amber-400" />
                  {isOnBreak ? 'Resume Work' : 'Take Break'}
                </Button>

                <Button
                  variant="outline"
                  onClick={handleClockOut}
                  disabled={actionLoading}
                  className="h-11 px-4 rounded-xl gap-2 font-bold text-xs border border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
                >
                  <LogOut className="w-4 h-4" />
                  Clock Out
                </Button>
              </>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={fetchData}
              disabled={isLoading}
              className="h-11 w-11 rounded-xl text-slate-400 hover:text-white"
            >
              <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
            </Button>
          </div>

        </div>

        {/* Live Daily Progress Bar */}
        <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          <div className="md:col-span-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Shift Target: 8.0 Hours Standard
              </span>
              <span className="text-white font-mono font-bold">
                {workHours}h logged ({progressPct}%)
              </span>
            </div>
            <Progress value={progressPct} className="h-2.5 bg-white/10" />
          </div>

          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-3 flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Current Status</div>
              <div className="text-sm font-bold font-mono mt-0.5 text-white flex items-center gap-1.5">
                <span className={cn(
                  "w-2 h-2 rounded-full",
                  isOnBreak ? "bg-amber-400 animate-pulse" : isClockedIn ? "bg-emerald-400" : "bg-slate-500"
                )} />
                {isOnBreak ? 'On Break' : isClockedIn ? 'Productive / Duty' : 'Off Duty'}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase font-bold text-slate-400">Current Time</div>
              <div className="text-sm font-bold font-mono text-amber-300 mt-0.5">
                {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Live Presence Team Radar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-400" />
              Live Presence & Reservations Desk Radar ({presenceStats.totalActive} Active)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time radar of executives actively clocked into the Kashmir Curators Operations platform.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs">
              {presenceStats.totalOnline} Online Duty
            </Badge>
            <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-xs">
              {presenceStats.totalOnBreak} Break
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {presenceList.length === 0 ? (
            <div className="col-span-4 p-8 text-center bg-[#0b1015]/60 border border-white/10 rounded-2xl text-slate-400">
              <Users className="w-8 h-8 mx-auto text-slate-600 mb-2" />
              <p className="text-sm font-semibold">No other team members clocked in right now</p>
              <p className="text-xs text-slate-500 mt-1">Clock in above to start your shift and register on the live radar.</p>
            </div>
          ) : (
            presenceList.map((member) => (
              <Card key={member.id} className="bg-[#0b1015]/90 border-white/10 backdrop-blur-md overflow-hidden">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-white text-xs flex items-center gap-1.5">
                        <span className={cn(
                          "w-2 h-2 rounded-full shrink-0",
                          member.isOnBreak ? "bg-amber-400 animate-pulse" : "bg-emerald-400"
                        )} />
                        <span className="truncate max-w-[140px]">{member.employeeName}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                        {member.employeeCode}
                      </div>
                    </div>

                    <Badge className={cn(
                      "text-[9px] uppercase font-bold",
                      member.isOnBreak 
                        ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                        : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                    )}>
                      {member.isOnBreak ? 'Break' : 'Active'}
                    </Badge>
                  </div>

                  <div className="pt-2 border-t border-white/5 grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <div className="text-[9px] uppercase font-bold text-slate-500">Working Today</div>
                      <div className="font-mono font-bold text-amber-300">
                        {Math.floor(member.totalWorkMinutes / 60)}h {member.totalWorkMinutes % 60}m
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] uppercase font-bold text-slate-500">Active Bookings</div>
                      <div className="font-mono font-bold text-sky-400">
                        {member.activeReservationsCount} Assigned
                      </div>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-500 flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-slate-600" />
                    <span className="truncate">{member.assignedDesk}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Attendance History Table */}
      <Card className="bg-[#0b1015]/90 border-white/10 shadow-2xl overflow-hidden">
        <CardHeader className="p-4 border-b border-white/10 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400" />
              My Biometric Attendance History (Past 14 Days)
            </CardTitle>
            <p className="text-[11px] text-slate-400 mt-0.5">Authoritative server-side records for payroll, shift targets, and compliance.</p>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={handleExportCSV}
            className="border-white/10 bg-white/[0.02] hover:bg-white/10 text-xs gap-1.5 h-8 text-slate-200"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </Button>
        </CardHeader>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-white/[0.02] border-b border-white/10">
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-slate-400 text-xs font-bold uppercase">Date</TableHead>
                <TableHead className="text-slate-400 text-xs font-bold uppercase">Shift Schedule</TableHead>
                <TableHead className="text-slate-400 text-xs font-bold uppercase">First Clock-In</TableHead>
                <TableHead className="text-slate-400 text-xs font-bold uppercase">Last Clock-Out</TableHead>
                <TableHead className="text-slate-400 text-xs font-bold uppercase">Work Time</TableHead>
                <TableHead className="text-slate-400 text-xs font-bold uppercase">Breaks</TableHead>
                <TableHead className="text-slate-400 text-xs font-bold uppercase text-right">Attendance Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {myHistory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-slate-500 text-xs">
                    No historical attendance logs recorded yet for this identity.
                  </TableCell>
                </TableRow>
              ) : (
                myHistory.map((h) => {
                  const hours = Math.floor(h.totalWorkMinutes / 60);
                  const mins = h.totalWorkMinutes % 60;

                  return (
                    <TableRow key={h.id} className="border-b border-white/5 hover:bg-white/[0.02] text-xs">
                      <TableCell className="font-mono font-bold text-white">
                        {h.date}
                      </TableCell>
                      <TableCell className="text-slate-400 text-[11px]">
                        {h.shiftName}
                      </TableCell>
                      <TableCell className="font-mono text-slate-300">
                        {new Date(h.firstLoginAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </TableCell>
                      <TableCell className="font-mono text-slate-400">
                        {h.lastLogoutAt 
                          ? new Date(h.lastLogoutAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : 'In Progress'}
                      </TableCell>
                      <TableCell className="font-mono font-bold text-amber-300">
                        {hours}h {mins}m
                      </TableCell>
                      <TableCell className="font-mono text-slate-400">
                        {h.totalBreakMinutes} mins
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge className={cn(
                          "text-[10px] font-bold uppercase",
                          h.status === 'PRESENT' && "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
                          h.status === 'ON_BREAK' && "bg-amber-500/15 text-amber-300 border-amber-500/30",
                          h.status === 'CLOCKED_OUT' && "bg-slate-700/50 text-slate-400 border-slate-600",
                          h.status === 'HALF_DAY' && "bg-blue-500/15 text-blue-300 border-blue-500/30",
                          h.status === 'OVERTIME' && "bg-purple-500/15 text-purple-300 border-purple-500/30"
                        )}>
                          {h.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

    </div>
  );
};
