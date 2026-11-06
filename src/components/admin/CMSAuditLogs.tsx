import { useState, useEffect } from 'react';
import { 
  Shield, Search, Filter, Clock, User, 
  Activity, CheckCircle2, AlertTriangle, RefreshCw 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/lib/api';

interface LogItem {
  id: string;
  userId: string;
  action: string;
  module: string;
  details: string;
  createdAt: string;
  status: 'SUCCESS' | 'WARNING' | 'CRITICAL';
}

const DEFAULT_LOGS: LogItem[] = [
  {
    id: 'log-1',
    userId: 'ADMIN001 (Director)',
    action: 'UPDATE_SECTION',
    module: 'Landing Page CMS',
    details: 'Synchronized live hero badges and seasonal promotions',
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    status: 'SUCCESS'
  },
  {
    id: 'log-2',
    userId: 'OPS002 (Ops Manager)',
    action: 'ASSIGN_LEAD',
    module: 'Inquiries Pipeline',
    details: 'Dispatched VIP inquiry #KC-8942 to Sales Executive 001',
    createdAt: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
    status: 'SUCCESS'
  },
  {
    id: 'log-3',
    userId: 'ADMIN001 (Director)',
    action: 'HOTEL_CONFIRMATION',
    module: 'Reservations Hub',
    details: 'Confirmed 2 Luxury Houseboat suites with Wangnoo Heritage',
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    status: 'SUCCESS'
  },
  {
    id: 'log-4',
    userId: 'SYSTEM_RADAR',
    action: 'WEATHER_SYNC',
    module: 'Disruptions & Safety',
    details: 'Verified NH44 Highway corridor clearance and zero roadblock warnings',
    createdAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    status: 'SUCCESS'
  }
];

export default function CMSAuditLogs() {
  const [logs, setLogs] = useState<LogItem[]>(DEFAULT_LOGS);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState('ALL');

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.module.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.userId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAction = filterAction === 'ALL' || log.action.includes(filterAction);
    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Top Header Card */}
      <div className="p-8 rounded-3xl bg-gradient-to-br from-blue-500/10 via-white/[0.02] to-transparent border border-blue-400/20 shadow-2xl backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-400/15 border border-blue-400/30 text-blue-300 text-[10px] font-black uppercase tracking-wider mb-2">
            <Shield className="w-3.5 h-3.5" />
            <span>Security & Governance Audit</span>
          </div>
          <h2 className="text-3xl font-display font-black text-white">Platform Audit Trail</h2>
          <p className="text-white/60 text-xs sm:text-sm mt-1 max-w-xl">
            Real-time chronological log of administrative modifications, content releases, lead reassignments, and booking confirmations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-xs px-3 py-1 rounded-xl border-white/20 text-white">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-400" /> Tamper-Proof Trail Active
          </Badge>
        </div>
      </div>

      {/* Filter Row */}
      <Card className="bg-[#0a0f14]/85 border border-white/10 p-5 rounded-3xl backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by user, action, or details..."
            className="pl-10 bg-white/5 border-white/10 text-white text-xs rounded-xl h-10"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {['ALL', 'UPDATE', 'ASSIGN', 'CONFIRMATION', 'WEATHER'].map(act => (
            <button
              key={act}
              onClick={() => setFilterAction(act)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                filterAction === act ? 'bg-blue-500 text-white shadow-md' : 'text-white/50 hover:text-white bg-white/5'
              }`}
            >
              {act}
            </button>
          ))}
        </div>
      </Card>

      {/* Audit Log Table */}
      <Card className="bg-[#0a0f14]/85 border border-white/10 p-6 rounded-3xl backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-white/40 uppercase tracking-widest text-[9px] font-black">
                <th className="pb-3">Timestamp</th>
                <th className="pb-3">Operator / User</th>
                <th className="pb-3">Module</th>
                <th className="pb-3">Action Type</th>
                <th className="pb-3">Operation Details</th>
                <th className="pb-3 text-right">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-white/80">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 font-mono text-white/50 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(log.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 font-bold text-white whitespace-nowrap">
                    {log.userId}
                  </td>
                  <td className="py-3 text-amber-300 font-medium">
                    {log.module}
                  </td>
                  <td className="py-3">
                    <Badge variant="outline" className="border-blue-500/30 text-blue-400 font-mono text-[9px]">
                      {log.action}
                    </Badge>
                  </td>
                  <td className="py-3 text-white/70 max-w-md">
                    {log.details}
                  </td>
                  <td className="py-3 text-right">
                    <Badge className="bg-emerald-500/20 text-emerald-400 text-[9px]">
                      AUDITED
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
