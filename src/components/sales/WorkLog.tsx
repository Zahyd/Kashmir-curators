import React from 'react';
import {
  Clock,
  Calendar,
  Timer,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  Monitor,
  Smartphone,
  Coffee,
  LogOut,
  Zap
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

import { useTeamAuth } from '@/contexts/TeamAuthContext';

export default function WorkLog() {
  const { systemEvents, teamUser } = useTeamAuth();
  
  const currentSession = {
    start: '09:00 AM', // In a real app, this would come from a session start timestamp
    duration: 'Active',
    status: 'Active',
    device: 'Web Portal'
  };

  const weeklyStats = [
    { day: 'Mon', hours: 8.5, status: 'Complete' },
    { day: 'Tue', hours: 9.2, status: 'Complete' },
    { day: 'Wed', hours: 7.8, status: 'Complete' },
    { day: 'Thu', hours: 8.0, status: 'Complete' },
    { day: 'Fri', hours: 4.5, status: 'In Progress' },
  ];

  // Map system events to recent logs
  const recentLogs = systemEvents.slice(0, 10).map((event: any) => ({
    date: new Date(event.timestamp).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
    login: new Date(event.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    logout: event.type === 'Booking' ? 'Booking Recorded' : 'Action Logged',
    total: event.message,
    status: event.type
  }));

  if (recentLogs.length === 0) {
    recentLogs.push({ 
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }), 
      login: 'Now', 
      logout: 'Active', 
      total: 'System Ready', 
      status: 'Session' 
    });
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700 max-w-6xl mx-auto pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 text-kashmir-gold text-[10px] font-black uppercase tracking-[0.3em] mb-2">
            <Timer className="w-4 h-4" />
            <span>Attendance & Efficiency</span>
          </div>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight">Work Log Overview</h1>
        </div>
        <div className="px-6 py-4 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Zap className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Active Session</p>
            <p className="text-xl font-bold text-emerald-400">{currentSession.duration}</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="bg-white/[0.03] border-white/5 p-8 rounded-[2.5rem] backdrop-blur-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
            <Clock className="w-24 h-24" />
          </div>
          <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-6">Weekly Hours</p>
          <div className="flex items-end gap-3 mb-4">
            <h3 className="text-4xl font-display font-bold text-white">38.0</h3>
            <p className="text-sm font-bold text-emerald-400 mb-1">+12% vs last week</p>
          </div>
          <Progress value={85} className="h-2 bg-white/5" />
        </Card>

        <Card className="bg-white/[0.03] border-white/5 p-8 rounded-[2.5rem] backdrop-blur-xl group">
          <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-6">Average Login</p>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white tracking-tight">09:05 AM</h3>
              <p className="text-xs font-bold text-white/30 uppercase tracking-widest">Punctual Status</p>
            </div>
          </div>
        </Card>

        <Card className="bg-white/[0.03] border-white/5 p-8 rounded-[2.5rem] backdrop-blur-xl group">
          <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-6">Productivity Score</p>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-kashmir-gold/10 flex items-center justify-center text-kashmir-gold">
              <ArrowUpRight className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white tracking-tight">94%</h3>
              <p className="text-xs font-bold text-white/30 uppercase tracking-widest">Elite Efficiency</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Weekly Chart Area */}
        <Card className="lg:col-span-2 bg-[#0a0f12] border-white/5 p-10 rounded-[3rem] shadow-2xl">
          <div className="flex justify-between items-center mb-10">
            <h4 className="text-lg font-bold text-white">Daily Activity (Weekly)</h4>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-kashmir-gold" />
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Work Hours</span>
              </div>
            </div>
          </div>

          <div className="flex items-end justify-between gap-4 h-64 px-4">
            {weeklyStats.map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-4 group">
                <div className="relative w-full">
                  <div
                    className={cn(
                      "w-full rounded-t-xl transition-all duration-700 group-hover:opacity-80",
                      day.status === 'In Progress' ? "bg-emerald-500/40" : "bg-gradient-to-t from-kashmir-gold to-amber-400"
                    )}
                    style={{ height: `${(day.hours / 10) * 100}%` }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-black text-[9px] font-black px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      {day.hours}h
                    </div>
                  </div>
                </div>
                <p className="text-[10px] font-black text-white/20 uppercase tracking-widest italic">{day.day}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Session Info */}
        <Card className="bg-white/[0.03] border-white/5 p-8 rounded-[3rem] backdrop-blur-xl">
          <h4 className="text-xs font-black uppercase tracking-[0.3em] text-white/30 mb-8">Current Activity</h4>
          <div className="space-y-8">
            <div className="flex items-start gap-4 p-5 rounded-2xl bg-white/5 border border-white/5">
              <Monitor className="w-5 h-5 text-kashmir-gold" />
              <div>
                <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Primary Device</p>
                <p className="text-sm font-bold text-white mt-1">{currentSession.device}</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-5 rounded-2xl bg-white/5 border border-white/5">
              <Calendar className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Today's Start</p>
                <p className="text-sm font-bold text-white mt-1">{currentSession.start}</p>
              </div>
            </div>
            <div className="pt-6 border-t border-white/5">
              <button className="w-full py-4 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                <LogOut className="w-4 h-4" /> End Day & Logout
              </button>
            </div>
          </div>
        </Card>
      </div>

      {/* History Table */}
      <Card className="bg-[#0a0f12] border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <h4 className="text-lg font-bold text-white">Recent Attendance Logs</h4>
          <Badge className="bg-white/5 text-white/40 border-none font-bold text-[10px]">LATEST 30 DAYS</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.01]">
                <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-white/20">Date</th>
                <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-white/20">Login</th>
                <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-white/20">Logout</th>
                <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-white/20">Total Duration</th>
                <th className="px-10 py-5 text-right text-[10px] font-black uppercase tracking-widest text-white/20">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {recentLogs.map((log, i) => (
                <tr key={i} className="group hover:bg-white/[0.02] transition-colors">
                  <td className="px-10 py-6 text-sm font-bold text-white">{log.date}</td>
                  <td className="px-10 py-6 text-sm text-white/40">{log.login}</td>
                  <td className="px-10 py-6 text-sm text-white/40">
                    <span className={cn(log.logout === 'Still Active' ? 'text-emerald-400 font-bold italic' : '')}>{log.logout}</span>
                  </td>
                  <td className="px-10 py-6 text-sm font-mono text-white/60">{log.total}</td>
                  <td className="px-10 py-6 text-right">
                    <Badge className={cn(
                      "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border-none",
                      log.status === 'Active' ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-white/30"
                    )}>
                      {log.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
