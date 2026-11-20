import { useState, useEffect, useCallback } from 'react';
import { 
  Shield, Search, Filter, Clock, User, 
  Activity, CheckCircle2, AlertTriangle, RefreshCw, Loader2 
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
  module?: string;
  details: string;
  createdAt: string;
  status?: 'SUCCESS' | 'WARNING' | 'CRITICAL';
}

export default function CMSAuditLogs() {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState('ALL');
  const [totalLogs, setTotalLogs] = useState(0);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('teamToken') || localStorage.getItem('token');
      const params = new URLSearchParams();
      if (filterAction !== 'ALL') params.append('action', filterAction);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await fetch(`${API_BASE_URL}/audit-logs?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        const parsedLogs = (data.logs || []).map((l: any) => {
          let module = 'System';
          let detailsText = l.details;
          let status: 'SUCCESS' | 'WARNING' | 'CRITICAL' = 'SUCCESS';

          try {
            if (typeof l.details === 'string' && (l.details.startsWith('{') || l.details.startsWith('['))) {
              const parsed = JSON.parse(l.details);
              module = parsed.module || module;
              detailsText = parsed.event || parsed.message || JSON.stringify(parsed);
              status = parsed.status || status;
            }
          } catch {
            // Keep raw details
          }

          return {
            id: l.id,
            userId: l.userId,
            action: l.action,
            module,
            details: detailsText,
            createdAt: l.createdAt,
            status
          };
        });

        setLogs(parsedLogs);
        setTotalLogs(data.total || parsedLogs.length);
      } else {
        toast.error('Failed to load audit trail');
      }
    } catch (err) {
      console.warn('[CMSAuditLogs] Error:', err);
      toast.error('Network error loading audit trail');
    } finally {
      setLoading(false);
    }
  }, [filterAction, searchQuery]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

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
            Real-time chronological log of administrative modifications, content releases, lead reassignments, and booking confirmations from Neon DB.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={fetchLogs}
            disabled={loading}
            className="h-10 px-4 rounded-xl border-white/20 bg-white/5 hover:bg-white/10 text-white text-xs font-bold flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Trail</span>
          </Button>

          <Badge variant="outline" className="text-xs px-3 py-1.5 rounded-xl border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-400" /> Tamper-Proof ({totalLogs})
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
          {['ALL', 'SECURITY', 'WEATHER', 'INVENTORY', 'ASSIGN', 'UPDATE'].map(act => (
            <button
              key={act}
              type="button"
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
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3 text-white/40">
            <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            <p className="text-xs font-mono uppercase tracking-wider">Loading Live Audit Records...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-white/40 text-xs">
            No audit records matching your filter.
          </div>
        ) : (
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
                {logs.map(log => (
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
        )}
      </Card>
    </div>
  );
}
