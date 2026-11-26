import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  UserPlus,
  Mail,
  Phone,
  Trash2,
  Crown,
  Sparkles,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { agentApi, AgentSeat, getErrMsg } from '../lib/agentApi';

interface AgencyTeamManagerProps {
  plan: 'STARTER' | 'PRO_DMC' | 'ENTERPRISE' | string;
  onOpenUpgradeModal: () => void;
  agencyName?: string;
  refreshTrigger?: number;
}

export const AgencyTeamManager: React.FC<AgencyTeamManagerProps> = ({
  plan = 'STARTER',
  onOpenUpgradeModal,
  agencyName = 'Your Agency',
  refreshTrigger = 0
}) => {
  const { token } = useAuth();
  const isEnterprise = plan === 'ENTERPRISE';
  const isPro = plan === 'PRO_DMC' || plan === 'PROFESSIONAL' || isEnterprise;
  const maxSeats = isEnterprise ? 999 : isPro ? 3 : 1;

  const [teamMembers, setTeamMembers] = useState<AgentSeat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<AgentSeat['role']>('CONCIERGE');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadSeats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await agentApi.getTeamSeats(token);
      setTeamMembers(data.seats || []);
    } catch (err: unknown) {
      setError(getErrMsg(err, 'Failed to load agency team seats'));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadSeats();
  }, [loadSeats, refreshTrigger]);

  const usedSeats = teamMembers.length;
  const canAddMore = isEnterprise || (isPro && usedSeats < maxSeats);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error('Name and email are required');
      return;
    }

    if (!canAddMore) {
      toast.error('Seat limit reached for your current plan.');
      onOpenUpgradeModal();
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await agentApi.createTeamSeat(
        { name: name.trim(), email: email.trim(), phone: phone.trim(), role },
        token
      );
      setTeamMembers(res.seats || []);
      toast.success(`Agent seat created for ${res.seat.name}`, {
        description: `Access code ${res.seat.code} persisted to database.`
      });
      setName('');
      setEmail('');
      setPhone('');
      setRole('CONCIERGE');
      setInviteModalOpen(false);
    } catch (err: unknown) {
      toast.error(getErrMsg(err, 'Failed to add seat'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (id: string, staffName: string) => {
    try {
      const res = await agentApi.deleteTeamSeat(id, token);
      setTeamMembers(res.seats || []);
      toast.info(`Seat for ${staffName} deactivated.`);
    } catch (err: unknown) {
      toast.error(getErrMsg(err, 'Could not remove team seat'));
    }
  };

  return (
    <div className="space-y-6">
      {/* Plan & Quota Header Card */}
      <div className="bg-card border border-border/70 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Users className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Agency Team & Staff Seats</h2>
            {isEnterprise ? (
              <Badge className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-black text-xs gap-1">
                <Crown className="w-3.5 h-3.5" />
                Unlimited Seats (Enterprise)
              </Badge>
            ) : isPro ? (
              <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white font-black text-xs gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                3 Seats Included (Pro DMC)
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs font-semibold text-muted-foreground">
                1 Owner Seat (Starter Tier)
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground max-w-xl">
            {isEnterprise
              ? 'Multi-branch agency access backed by your Organization workspace with live lead counts per advisor.'
              : isPro
                ? 'Manage up to 3 persisted team seats in your Organization workspace and track live CRM lead ownership.'
                : 'Starter plan includes the primary partner owner seat. Upgrade to Pro DMC for 3 team seats.'}
          </p>

          {isPro && !isEnterprise && (
            <div className="pt-2 max-w-md space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span>Seat Allocation</span>
                <span className="text-primary">{usedSeats} of {maxSeats} Seats Used</span>
              </div>
              <Progress value={Math.min(100, (usedSeats / maxSeats) * 100)} className="h-2 rounded-full" />
            </div>
          )}
        </div>

        <div className="shrink-0 flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={loadSeats} disabled={loading} className="rounded-xl h-9 w-9">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          {!isPro ? (
            <Button
              onClick={onOpenUpgradeModal}
              className="rounded-2xl text-xs font-bold gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/20"
            >
              <Sparkles className="w-4 h-4" />
              <span>Upgrade for 3 Seats</span>
            </Button>
          ) : (
            <Button
              onClick={() => {
                if (!canAddMore) {
                  toast.info('Seat quota reached. Upgrade to Enterprise for unlimited seats.');
                  onOpenUpgradeModal();
                } else {
                  setInviteModalOpen(true);
                }
              }}
              className="rounded-2xl text-xs font-bold gap-2 shadow-md shadow-primary/20"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Team Seat</span>
            </Button>
          )}
        </div>
      </div>

      {error && (
        <Card className="p-4 border-rose-500/30 bg-rose-500/5 rounded-2xl flex items-center justify-between">
          <span className="text-xs text-rose-500 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </span>
          <Button size="sm" variant="outline" onClick={loadSeats} className="rounded-xl text-xs">
            Retry
          </Button>
        </Card>
      )}

      {/* Staff Roster Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teamMembers.map((member) => {
          const isOwner = member.id.startsWith('owner-');
          return (
            <Card key={member.id} className="rounded-3xl border border-border/70 p-5 bg-card flex flex-col justify-between hover:border-primary/40 transition-all">
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary font-bold flex items-center justify-center text-sm border border-primary/20 shrink-0">
                      {member.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5 truncate">
                        <span className="truncate">{member.name}</span>
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            member.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground/40'
                          }`}
                          title={member.isOnline ? 'Online' : 'Offline'}
                        />
                      </h4>
                      <span className="text-[10px] font-mono text-muted-foreground">{member.code}</span>
                    </div>
                  </div>

                  <Badge variant="outline" className="text-[9px] uppercase font-bold tracking-wider shrink-0">
                    {member.role === 'SALES_MANAGER' ? 'Manager' : member.role === 'OPS_COORDINATOR' ? 'Operations' : 'Concierge'}
                  </Badge>
                </div>

                <div className="space-y-1.5 text-xs text-muted-foreground bg-muted/40 p-3 rounded-2xl border border-border/40 mb-3">
                  <div className="flex items-center gap-2 truncate">
                    <Mail className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate">{member.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                    <span>{member.phone}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-border/50 text-[11px]">
                    <span>Live CRM Leads:</span>
                    <span className="font-bold text-foreground">{member.assignedLeadsCount} Leads</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Joined: {member.joinedAt}</span>
                {!isOwner && (
                  <button
                    onClick={() => handleRemove(member.id, member.name)}
                    className="text-rose-500 hover:text-rose-600 text-xs font-medium flex items-center gap-1 transition"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Remove</span>
                  </button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Invite Modal */}
      <Dialog open={inviteModalOpen} onOpenChange={setInviteModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6 bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <UserPlus className="w-5 h-5 text-primary" />
              <span>Provision Agency Team Seat</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Saves a persisted staff seat under <strong>{agencyName}</strong> in PostgreSQL.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleInvite} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Full Name</Label>
              <Input
                placeholder="e.g. Asif Mir"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-10 rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Work Email</Label>
              <Input
                type="email"
                placeholder="asif@youragency.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-10 rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Phone / WhatsApp</Label>
              <Input
                placeholder="+91 99060 XXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-10 rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Role</Label>
              <Select value={role} onValueChange={(val) => setRole(val as AgentSeat['role'])}>
                <SelectTrigger className="h-10 rounded-xl text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="CONCIERGE">Travel Concierge (Itineraries & Quotes)</SelectItem>
                  <SelectItem value="OPS_COORDINATOR">Operations Coordinator (Hotels & Cabs)</SelectItem>
                  <SelectItem value="SALES_MANAGER">Sales Manager (All Leads & Quotas)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setInviteModalOpen(false)} className="rounded-xl text-xs">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="rounded-xl text-xs font-bold">
                {isSubmitting ? 'Saving...' : 'Save Team Seat'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
