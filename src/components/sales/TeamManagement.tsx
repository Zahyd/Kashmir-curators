import React, { useEffect, useState } from 'react';
import {
  Shield,
  Phone,
  Mail,
  UserPlus,
  RefreshCw,
  Pencil,
  Trash2,
  Loader2
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { salesApi, TeamMemberItem } from '@/lib/salesApi';
import { ROLE_DISPLAY_NAMES, ROLE_BADGE_STYLES, normalizeSalesRole, isDirector } from '@/lib/rbac';

interface TeamManagementProps {
  currentEmployee: {
    code: string;
    name: string;
    role: string;
  };
  onTeamChanged?: () => void;
}

export const TeamManagement: React.FC<TeamManagementProps> = ({ currentEmployee, onTeamChanged }) => {
  const [members, setMembers] = useState<TeamMemberItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMemberItem | null>(null);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('sales');
  const [employeeCode, setEmployeeCode] = useState('');
  const [leadCapacity, setLeadCapacity] = useState('8');

  const canModifyTeam = isDirector(currentEmployee.role);

  const fetchTeam = async () => {
    try {
      const data = await salesApi.getTeamRoster();
      setMembers(data);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load team roster');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
    const interval = setInterval(fetchTeam, 30000);
    return () => clearInterval(interval);
  }, []);

  const openCreateModal = () => {
    setEditingMember(null);
    setName('');
    setEmail('');
    setPhone('');
    setRole('sales');
    setEmployeeCode('');
    setLeadCapacity('8');
    setModalOpen(true);
  };

  const openEditModal = (m: TeamMemberItem) => {
    setEditingMember(m);
    setName(m.name || '');
    setEmail(m.email || '');
    setPhone(m.phone || '');
    setRole((m.role || 'sales').toLowerCase());
    setEmployeeCode(m.employeeCode || '');
    setLeadCapacity(String(m.leadCapacity ?? 5));
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }
    setSaving(true);
    try {
      if (editingMember) {
        await salesApi.updateTeamMember(editingMember.id, {
          name: name.trim(),
          phone: phone.trim() || undefined,
          role,
          leadCapacity: parseInt(leadCapacity, 10) || 5
        });
        toast.success(`Updated ${name}`);
      } else {
        if (!email.trim() || !employeeCode.trim()) {
          toast.error('Email and Employee Code are required');
          setSaving(false);
          return;
        }
        await salesApi.createTeamMember({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          role,
          employeeCode: employeeCode.trim().toUpperCase(),
          leadCapacity: parseInt(leadCapacity, 10) || 5
        });
        toast.success(`Created team concierge ${employeeCode.toUpperCase()}`);
      }
      setModalOpen(false);
      await fetchTeam();
      onTeamChanged?.();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save team member');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (m: TeamMemberItem) => {
    if ((m.employeeCode || '').toUpperCase() === (currentEmployee.code || '').toUpperCase()) {
      toast.error('You cannot remove your own active account');
      return;
    }
    if (!window.confirm(`Permanently remove "${m.name}" (${m.employeeCode || m.email}) from the roster?`)) return;
    try {
      await salesApi.deleteTeamMember(m.id);
      toast.success('Team member removed');
      await fetchTeam();
      onTeamChanged?.();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to remove team member');
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#0F141C]/90 p-5 rounded-xl border border-white/10 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold text-white tracking-wide">
              Team Roster &amp; RBAC Management
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Live concierge capacity, role assignments, and online availability across Kashmir Curators Sales OS.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canModifyTeam && (
            <Button
              size="sm"
              onClick={openCreateModal}
              className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs h-9 px-3.5"
            >
              <UserPlus className="w-3.5 h-3.5 mr-1.5" />
              Add Concierge
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => { setLoading(true); fetchTeam(); }}
            className="border-white/10 text-slate-300 hover:text-white h-9 px-3"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Permissions Matrix Ribbon */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="bg-[#0F141C]/80 border border-amber-500/30 p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-1.5">
            <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px]">DIRECTOR</Badge>
            <span className="text-xs font-semibold text-white">Full OS &amp; Roster Control</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Create/edit staff, reassign any deal, hard-delete archived inquiries, and view global fiscal telemetry.
          </p>
        </Card>

        <Card className="bg-[#0F141C]/80 border border-blue-500/30 p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-1.5">
            <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px]">SALES_MANAGER</Badge>
            <span className="text-xs font-semibold text-white">Pipeline &amp; Team Oversight</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Monitor team attendance, view company-wide deals, reassign leads, and manage SLA escalations.
          </p>
        </Card>

        <Card className="bg-[#0F141C]/80 border border-emerald-500/30 p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-1.5">
            <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px]">SALES_EXECUTIVE</Badge>
            <span className="text-xs font-semibold text-white">Private Client Concierge</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Claim live leads, build itineraries, upload vault docs, record notes/reminders, and log payments.
          </p>
        </Card>
      </div>

      {/* Team Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map((member) => {
          const normRole = normalizeSalesRole(member.role);
          const badgeStyle = ROLE_BADGE_STYLES[normRole] || 'bg-slate-800 text-slate-300';
          const roleLabel = ROLE_DISPLAY_NAMES[normRole] || member.role;
          const cap = member.leadCapacity || 5;
          const activeCount = member.activeLeadCount || 0;

          return (
            <Card
              key={member.id}
              className="bg-[#0F141C]/90 border border-white/10 hover:border-amber-500/30 p-4 rounded-xl shadow-lg transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center font-bold text-amber-400 text-xs shrink-0">
                      {member.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-white flex items-center gap-1.5 truncate">
                        <span className="truncate">{member.name}</span>
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${member.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}
                          title={member.isOnline ? 'Online' : 'Away'}
                        />
                      </h3>
                      <span className="text-[11px] font-mono text-slate-400">
                        {member.employeeCode || member.id.slice(0, 8)}
                      </span>
                    </div>
                  </div>
                  <Badge className={`${badgeStyle} text-[9px] px-2 py-0.5 font-bold shrink-0`}>
                    {normRole}
                  </Badge>
                </div>

                <div className="space-y-1.5 text-xs text-slate-300 bg-[#07090E] p-3 rounded-lg border border-white/5 mb-3">
                  <div className="flex items-center gap-2 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{member.email}</span>
                  </div>
                  {member.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{member.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[11px]">
                    <span className="text-slate-400">Active Pipeline Load:</span>
                    <span className="font-mono text-amber-300 font-bold">{activeCount} / {cap} leads</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <span className="text-amber-400/90 font-medium truncate">{roleLabel}</span>
                {canModifyTeam && (
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => openEditModal(member)}
                      className="w-7 h-7 text-slate-300 hover:text-white hover:bg-white/10"
                      title="Edit concierge"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(member)}
                      className="w-7 h-7 text-slate-400 hover:text-rose-400 hover:bg-rose-500/15"
                      title="Remove concierge"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Add / Edit Concierge Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-[#0B0F17] border border-white/10 text-white max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white">
              {editingMember ? `Edit Concierge: ${editingMember.name}` : 'Add Team Concierge'}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              {editingMember
                ? 'Update role, phone number, or round-robin lead capacity.'
                : 'Create a staff account with OTP access to the Sales Portal.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-3 pt-2">
            <div>
              <label className="text-[11px] uppercase text-slate-400 font-semibold">Full Name *</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 bg-[#07090E] border-white/10 text-white h-9 text-xs" />
            </div>

            {!editingMember && (
              <>
                <div>
                  <label className="text-[11px] uppercase text-slate-400 font-semibold">Email *</label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 bg-[#07090E] border-white/10 text-white h-9 text-xs" />
                </div>
                <div>
                  <label className="text-[11px] uppercase text-slate-400 font-semibold">Employee Code *</label>
                  <Input value={employeeCode} onChange={(e) => setEmployeeCode(e.target.value)} placeholder="e.g. SALES002" className="mt-1 bg-[#07090E] border-white/10 text-white h-9 text-xs font-mono uppercase" />
                </div>
              </>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] uppercase text-slate-400 font-semibold">Phone</label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 bg-[#07090E] border-white/10 text-white h-9 text-xs" />
              </div>
              <div>
                <label className="text-[11px] uppercase text-slate-400 font-semibold">Lead Capacity</label>
                <Input type="number" min={1} max={50} value={leadCapacity} onChange={(e) => setLeadCapacity(e.target.value)} className="mt-1 bg-[#07090E] border-white/10 text-white h-9 text-xs" />
              </div>
            </div>

            <div>
              <label className="text-[11px] uppercase text-slate-400 font-semibold">Portal Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="mt-1 w-full bg-[#07090E] border border-white/10 text-white h-9 rounded-md px-2.5 text-xs"
              >
                <option value="sales">Sales Executive (Concierge)</option>
                <option value="operations">Sales Operations Manager</option>
                <option value="admin">Director (Super Admin)</option>
                <option value="finance">Finance Controller</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)} className="border-white/10 text-slate-300 h-9 text-xs">
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="bg-amber-500 hover:bg-amber-400 text-black font-bold h-9 text-xs px-4">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
                {editingMember ? 'Save Changes' : 'Create Concierge'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
