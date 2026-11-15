import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Clock, 
  Coffee, 
  LogOut, 
  Download, 
  RefreshCw, 
  Search, 
  ShieldCheck, 
  Activity, 
  Radio, 
  UserCheck, 
  Building2, 
  Calendar,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { API_BASE_URL, SOCKET_URL } from '@/lib/api';
import { io } from 'socket.io-client';
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
  status: string;
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
  status: 'ONLINE' | 'ON_BREAK' | 'CLOCKED_OUT';
  activeReservationsCount?: number;
}

export default function CMSAttendance() {
  const [presenceList, setPresenceList] = useState<PresenceMember[]>([]);
  const [historyRecords, setHistoryRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const getHeaders = (): Record<string, string> => {
    let portalKey = '';
    try {
      portalKey = JSON.parse(localStorage.getItem('hospitality_session') || '{}').accessKey || '';
    } catch {}

    const token = 
      localStorage.getItem('teamToken') || 
      localStorage.getItem('hospitality_token') || 
      localStorage.getItem('token') || 
      localStorage.getItem('auth_token') || 
      portalKey || 
      '';

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token && token !== 'null' && token !== 'undefined') {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (portalKey && portalKey !== 'null' && portalKey !== 'undefined') {
      headers['x-portal-key'] = portalKey;
    }
    return headers;
  };

  const fetchAttendanceData = async () => {
    try {
      setIsLoading(true);
      const headers = getHeaders();

      const [presenceRes, reportsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/attendance/live-presence`, { headers }),
        fetch(`${API_BASE_URL}/attendance/reports`, { headers })
      ]);

      if (presenceRes.ok) {
        const pData = await presenceRes.json();
        setPresenceList(pData.presenceList || []);
      }

      if (reportsRes.ok) {
        const rData = await reportsRes.json();
        setHistoryRecords(Array.isArray(rData) ? rData : []);
      }
    } catch (err) {
      console.error('Failed to load attendance records:', err);
      toast.error('Unable to fetch live attendance telemetry');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceData();

    // Connect to live Socket.IO for instant presence alerts
    const socket = io(SOCKET_URL);
    socket.emit('join-admin');

    socket.on('employee-attendance-updated', (data: any) => {
      toast.info('Teammate Shift Event', {
        description: `${data.employeeName || data.employeeCode}: ${data.action} (${data.status})`,
        icon: '👤'
      });
      fetchAttendanceData();
    });

    socket.on('employee-presence-refresh', () => {
      fetchAttendanceData();
    });

    socket.on('employee-pulse', () => {
      // Refresh presence softly on heartbeats
      fetch(`${API_BASE_URL}/attendance/live-presence`, { headers: getHeaders() })
        .then(res => res.json())
        .then(pData => setPresenceList(pData.presenceList || []))
        .catch(() => {});
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const totalActiveOnline = presenceList.filter(p => !p.isOnBreak && p.status !== 'CLOCKED_OUT').length;
  const totalOnBreak = presenceList.filter(p => p.isOnBreak).length;
  const totalClockedIn = presenceList.length;
  const totalWorkHoursLogged = Math.round(
    historyRecords.reduce((acc, cur) => acc + (cur.totalWorkMinutes || 0), 0) / 60
  );

  const filteredPresence = presenceList.filter(p => {
    const matchesSearch = 
      p.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.employeeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.assignedDesk.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'ALL' || p.role.toLowerCase() === roleFilter.toLowerCase();
    const matchesStatus = 
      statusFilter === 'ALL' || 
      (statusFilter === 'ONLINE' && !p.isOnBreak) || 
      (statusFilter === 'BREAK' && p.isOnBreak);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const filteredHistory = historyRecords.filter(h => {
    const matchesSearch = 
      h.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.employeeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.shiftName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'ALL' || h.role.toLowerCase() === roleFilter.toLowerCase();
    const matchesStatus = statusFilter === 'ALL' || h.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleExportCSV = () => {
    if (historyRecords.length === 0) {
      toast.info('No attendance records to export');
      return;
    }

    const headers = ['Date', 'Employee Code', 'Employee Name', 'Role', 'Shift', 'First Login', 'Last Logout', 'Work Minutes', 'Break Minutes', 'Status'];
    const rows = historyRecords.map(r => [
      r.date,
      `"${r.employeeCode}"`,
      `"${r.employeeName}"`,
      r.role,
      `"${r.shiftName}"`,
      new Date(r.firstLoginAt).toLocaleTimeString(),
      r.lastLogoutAt ? new Date(r.lastLogoutAt).toLocaleTimeString() : 'Active Shift',
      r.totalWorkMinutes,
      r.totalBreakMinutes,
      r.status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Kashmir_Curators_Attendance_Registry_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Attendance telemetry report downloaded as CSV');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0a0f14]/80 p-6 rounded-2xl border border-white/10 backdrop-blur-xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
              Live Workforce Telemetry • Asia/Kolkata (IST)
            </span>
          </div>
          <h2 className="text-xl font-black text-white mt-1">
            Employee Attendance, Working Hours & Live Presence
          </h2>
          <p className="text-xs text-white/50 mt-0.5">
            Real-time biometric & shift presence radar for Kashmir Curators operations, hospitality, and desk staff.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={fetchAttendanceData}
            disabled={isLoading}
            className="rounded-xl border-white/10 bg-white/5 text-white hover:bg-white/10 text-xs font-bold gap-1.5 h-9"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
            <span>Sync Radar</span>
          </Button>

          <Button 
            size="sm"
            onClick={handleExportCSV}
            className="rounded-xl bg-amber-400 hover:bg-amber-500 text-black font-black text-xs gap-1.5 h-9 shadow-lg shadow-amber-400/20"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[#0a0f14]/80 border-white/10 p-5 rounded-2xl backdrop-blur-xl">
          <span className="text-[10px] font-black uppercase tracking-widest text-white/40 block">
            Clocked-In Today
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-black text-white">{totalClockedIn}</span>
            <Badge className="bg-blue-500/10 text-blue-400 border-none font-bold text-[10px]">
              Shifts
            </Badge>
          </div>
        </Card>

        <Card className="bg-[#0a0f14]/80 border-emerald-500/20 p-5 rounded-2xl backdrop-blur-xl">
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 block">
            Active Online Now
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-black text-emerald-400">{totalActiveOnline}</span>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live Desk</span>
            </div>
          </div>
        </Card>

        <Card className="bg-[#0a0f14]/80 border-amber-500/20 p-5 rounded-2xl backdrop-blur-xl">
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block">
            On Lunch / Tea Break
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-black text-amber-400">{totalOnBreak}</span>
            <Coffee className="w-4 h-4 text-amber-400" />
          </div>
        </Card>

        <Card className="bg-[#0a0f14]/80 border-white/10 p-5 rounded-2xl backdrop-blur-xl">
          <span className="text-[10px] font-black uppercase tracking-widest text-purple-400 block">
            Productive Hours Logged
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-black text-purple-400">{totalWorkHoursLogged}h</span>
            <Activity className="w-4 h-4 text-purple-400" />
          </div>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-[#0a0f14]/80 p-4 rounded-2xl border border-white/10">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <Input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search employee by name, code (e.g. KC-HOSP-01), or assigned desk..."
            className="w-full pl-9 bg-white/5 border-white/10 text-xs text-white rounded-xl placeholder:text-white/40 h-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="h-9 w-36 bg-white/5 border-white/10 text-xs text-white rounded-xl font-bold">
              <SelectValue placeholder="Filter Role" />
            </SelectTrigger>
            <SelectContent className="bg-[#0e141a] border-white/10 text-white">
              <SelectItem value="ALL">All Roles</SelectItem>
              <SelectItem value="hospitality">Hospitality</SelectItem>
              <SelectItem value="operations">Operations</SelectItem>
              <SelectItem value="admin">SuperAdmin</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-36 bg-white/5 border-white/10 text-xs text-white rounded-xl font-bold">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent className="bg-[#0e141a] border-white/10 text-white">
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="ONLINE">Online Active</SelectItem>
              <SelectItem value="BREAK">On Break</SelectItem>
              <SelectItem value="PRESENT">Present</SelectItem>
              <SelectItem value="CLOCKED_OUT">Clocked Out</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Live Presence Teammates Grid */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Active Operational Radar ({filteredPresence.length} Staff Online)</span>
          </h3>
          <span className="text-[10px] text-white/40 font-mono">Auto-refreshed via WebSockets</span>
        </div>

        {filteredPresence.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPresence.map((member) => {
              const isBreak = member.isOnBreak;
              const workHours = Math.floor(member.totalWorkMinutes / 60);
              const workMins = member.totalWorkMinutes % 60;

              return (
                <Card 
                  key={member.id} 
                  className={cn(
                    "p-5 rounded-2xl border transition-all duration-300",
                    isBreak 
                      ? "bg-amber-500/[0.04] border-amber-500/20" 
                      : "bg-[#0a0f14]/80 border-white/10 hover:border-emerald-500/40"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm",
                        isBreak 
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/30" 
                          : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                      )}>
                        {member.employeeName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white truncate max-w-[160px]">
                          {member.employeeName}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Badge variant="outline" className="font-mono text-[9px] border-white/10 text-white/60 px-1 py-0">
                            {member.employeeCode}
                          </Badge>
                          <span className="text-[10px] text-amber-400 font-bold capitalize">
                            {member.role}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Badge className={cn(
                      "text-[9px] font-black uppercase tracking-wider px-2 py-0.5",
                      isBreak 
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/30" 
                        : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                    )}>
                      {isBreak ? 'On Break' : 'Active'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-white/5 text-[11px]">
                    <div>
                      <span className="text-white/40 block text-[9px] uppercase font-bold">Assigned Desk</span>
                      <span className="font-bold text-white/90 truncate block">{member.assignedDesk}</span>
                    </div>
                    <div>
                      <span className="text-white/40 block text-[9px] uppercase font-bold">Shift Clock-In</span>
                      <span className="font-bold text-white/90">
                        {new Date(member.loginAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div>
                      <span className="text-white/40 block text-[9px] uppercase font-bold">Productive Time</span>
                      <span className="font-bold text-emerald-400">{workHours}h {workMins}m</span>
                    </div>
                    <div>
                      <span className="text-white/40 block text-[9px] uppercase font-bold">Break Logged</span>
                      <span className="font-bold text-amber-400">{member.breakMinutes || 0}m</span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center bg-[#0a0f14]/80 rounded-2xl border border-dashed border-white/10">
            <Users className="w-8 h-8 text-white/20 mx-auto mb-2" />
            <p className="text-xs font-bold text-white/40 uppercase tracking-widest">
              No staff members currently active online
            </p>
          </div>
        )}
      </div>

      {/* Master Shift Attendance History Table */}
      <Card className="bg-[#0a0f14]/80 border-white/10 rounded-2xl p-6 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-black text-white">Authoritative Attendance & Shift Registry</h3>
            <p className="text-xs text-white/40">Historical timestamps, daily work hours, and logout records.</p>
          </div>
          <Badge variant="outline" className="text-xs text-white/50 border-white/10">
            {filteredHistory.length} Records
          </Badge>
        </div>

        <div className="rounded-xl border border-white/5 overflow-hidden">
          <Table>
            <TableHeader className="bg-white/[0.02]">
              <TableRow className="border-white/5">
                <TableHead className="text-white/40 text-[10px] font-black uppercase">Date</TableHead>
                <TableHead className="text-white/40 text-[10px] font-black uppercase">Employee Code</TableHead>
                <TableHead className="text-white/40 text-[10px] font-black uppercase">Employee Name</TableHead>
                <TableHead className="text-white/40 text-[10px] font-black uppercase">Role</TableHead>
                <TableHead className="text-white/40 text-[10px] font-black uppercase">First Login</TableHead>
                <TableHead className="text-white/40 text-[10px] font-black uppercase">Last Logout</TableHead>
                <TableHead className="text-white/40 text-[10px] font-black uppercase">Productive Work</TableHead>
                <TableHead className="text-white/40 text-[10px] font-black uppercase">Break</TableHead>
                <TableHead className="text-white/40 text-[10px] font-black uppercase">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHistory.length > 0 ? (
                filteredHistory.map((rec) => {
                  const workHrs = Math.floor(rec.totalWorkMinutes / 60);
                  const workMins = rec.totalWorkMinutes % 60;

                  return (
                    <TableRow key={rec.id} className="border-white/5 hover:bg-white/[0.02]">
                      <TableCell className="font-mono text-xs text-white/90">{rec.date}</TableCell>
                      <TableCell className="font-mono text-xs text-amber-400 font-bold">{rec.employeeCode}</TableCell>
                      <TableCell className="text-xs font-bold text-white">{rec.employeeName}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] border-white/10 text-white/60 capitalize">
                          {rec.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-white/70">
                        {new Date(rec.firstLoginAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </TableCell>
                      <TableCell className="text-xs text-white/70">
                        {rec.lastLogoutAt ? (
                          new Date(rec.lastLogoutAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        ) : (
                          <span className="text-emerald-400 font-bold">Shift Active</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs font-bold text-emerald-400">
                        {workHrs}h {workMins}m
                      </TableCell>
                      <TableCell className="text-xs text-amber-400 font-bold">
                        {rec.totalBreakMinutes || 0}m
                      </TableCell>
                      <TableCell>
                        <Badge className={cn(
                          "text-[9px] font-bold uppercase",
                          rec.status === 'PRESENT' && "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
                          rec.status === 'ON_BREAK' && "bg-amber-500/10 text-amber-400 border border-amber-500/20",
                          rec.status === 'CLOCKED_OUT' && "bg-white/5 text-white/40 border border-white/10"
                        )}>
                          {rec.status.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="py-8 text-center text-white/30 text-xs">
                    No historical attendance logs recorded yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
