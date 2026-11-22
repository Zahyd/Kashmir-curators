import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Shield, 
  CheckCircle2, 
  Clock, 
  Phone, 
  Mail, 
  BadgeCheck, 
  Lock, 
  UserPlus, 
  RefreshCw,
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { API_BASE_URL } from '@/lib/api';
import { ROLE_DISPLAY_NAMES, ROLE_BADGE_STYLES, normalizeSalesRole } from '@/lib/rbac';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  employeeCode?: string;
  isOnline?: boolean;
  phone?: string;
  createdAt?: string;
}

interface TeamManagementProps {
  currentEmployee: {
    code: string;
    name: string;
    role: string;
  };
}

export const TeamManagement: React.FC<TeamManagementProps> = ({ currentEmployee }) => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTeam = async () => {
    try {
      const token = localStorage.getItem('team_auth_token') || localStorage.getItem('teamToken') || localStorage.getItem('token') || '';
      const portalKey = localStorage.getItem('kashmir_portal_key') || '';

      const res = await fetch(`${API_BASE_URL}/sales/team`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          ...(portalKey ? { 'x-portal-key': portalKey } : {})
        }
      });

      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      }
    } catch (err) {
      console.warn('Failed to fetch team members:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
    const interval = setInterval(fetchTeam, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#0F141C]/80 p-5 rounded-xl border border-white/10 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold text-white tracking-wide">
              Team Roster & Role-Based Access Control (RBAC)
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Director & Managerial oversight of Kashmir Curators sales concierges, permissions & live availability.
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => { setLoading(true); fetchTeam(); }}
          className="border-white/10 text-slate-300 hover:text-white h-9 px-3"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-2 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          <span>Refresh Roster</span>
        </Button>
      </div>

      {/* Permissions Matrix Ribbon */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-[#0F141C]/80 border border-amber-500/30 p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs">
              DIRECTOR
            </Badge>
            <span className="text-xs font-semibold text-white">Full OS Access</span>
          </div>
          <p className="text-xs text-slate-400">
            Full travel operating system control, team access key management, global revenue ledgers, and lead reassignments.
          </p>
        </Card>

        <Card className="bg-[#0F141C]/80 border border-blue-500/30 p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs">
              SALES_MANAGER
            </Badge>
            <span className="text-xs font-semibold text-white">Pipeline Oversight</span>
          </div>
          <p className="text-xs text-slate-400">
            Team-wide pipeline visibility, lead reassignment, SLA monitoring, and custom client discount approvals.
          </p>
        </Card>

        <Card className="bg-[#0F141C]/80 border border-emerald-500/30 p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs">
              SALES_EXECUTIVE
            </Badge>
            <span className="text-xs font-semibold text-white">Scoped Pipeline</span>
          </div>
          <p className="text-xs text-slate-400">
            Claiming unassigned leads from live queue, personal pipeline management, itinerary creation, and WhatsApp dispatch.
          </p>
        </Card>
      </div>

      {/* Team Members List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map((member) => {
          const normRole = normalizeSalesRole(member.role);
          const badgeStyle = ROLE_BADGE_STYLES[normRole] || 'bg-slate-800 text-slate-300';
          const roleLabel = ROLE_DISPLAY_NAMES[normRole] || member.role;

          return (
            <Card
              key={member.id}
              className="bg-[#0F141C]/90 border border-white/10 hover:border-amber-500/30 p-5 rounded-xl shadow-lg transition-all"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center font-bold text-amber-400">
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      {member.name}
                      {member.isOnline ? (
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Online" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-slate-500" title="Away" />
                      )}
                    </h3>
                    <span className="text-[11px] font-mono text-slate-400">
                      ID: {member.employeeCode || member.id.slice(0, 8)}
                    </span>
                  </div>
                </div>

                <Badge className={`${badgeStyle} text-[10px] px-2 py-0.5 font-bold`}>
                  {normRole}
                </Badge>
              </div>

              <div className="space-y-1.5 text-xs text-slate-300 bg-[#07090E] p-3 rounded-lg border border-white/5 mb-3">
                <div className="flex items-center gap-2 truncate">
                  <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="truncate">{member.email || 'concierge@kashmircurators.com'}</span>
                </div>
                {member.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{member.phone}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[11px]">
                  <span className="text-slate-400">Status:</span>
                  <span className={member.isOnline ? "text-emerald-400 font-semibold" : "text-slate-400"}>
                    {member.isOnline ? 'Active Online' : 'Away / Off-Duty'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Access Level:</span>
                <span className="text-amber-400/90 font-medium">{roleLabel}</span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
