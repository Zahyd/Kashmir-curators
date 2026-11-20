import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Mail, 
  Phone, 
  Trash2, 
  Crown, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  MoreVertical,
  Key,
  Shield
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

export interface AgencyStaff {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'CONCIERGE' | 'OPS_COORDINATOR' | 'SALES_MANAGER';
  code: string;
  isOnline: boolean;
  assignedLeadsCount: number;
  joinedAt: string;
}

interface AgencyTeamManagerProps {
  plan: 'STARTER' | 'PRO_DMC' | 'ENTERPRISE' | string;
  onOpenUpgradeModal: () => void;
  agencyName?: string;
}

export const AgencyTeamManager: React.FC<AgencyTeamManagerProps> = ({
  plan = 'STARTER',
  onOpenUpgradeModal,
  agencyName = 'Your Agency'
}) => {
  const isEnterprise = plan === 'ENTERPRISE';
  const isPro = plan === 'PRO_DMC' || plan === 'PROFESSIONAL' || isEnterprise;
  const maxSeats = isEnterprise ? 999 : isPro ? 3 : 0;

  // Local state initialized with saved seats or defaults
  const [teamMembers, setTeamMembers] = useState<AgencyStaff[]>(() => {
    try {
      const saved = localStorage.getItem('agency_team_seats');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'staff-primary',
        name: 'Primary Partner Admin',
        email: 'admin@' + (agencyName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'agency') + '.com',
        phone: '+91 99060 12345',
        role: 'SALES_MANAGER',
        code: 'KC-SEAT-01',
        isOnline: true,
        assignedLeadsCount: 12,
        joinedAt: 'Founding Member'
      }
    ];
  });

  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'CONCIERGE' | 'OPS_COORDINATOR' | 'SALES_MANAGER'>('CONCIERGE');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('agency_team_seats', JSON.stringify(teamMembers));
    } catch {}
  }, [teamMembers]);

  const usedSeats = teamMembers.length;
  const canAddMore = isEnterprise || usedSeats < maxSeats;

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      toast.error('Name and email are required');
      return;
    }

    if (!canAddMore) {
      toast.error('Seat limit reached for your current plan.');
      onOpenUpgradeModal();
      return;
    }

    setIsSubmitting(true);
    const newStaff: AgencyStaff = {
      id: `staff-${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim() || '+91 98765 00000',
      role,
      code: `KC-SEAT-0${usedSeats + 1}`,
      isOnline: false,
      assignedLeadsCount: 0,
      joinedAt: new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })
    };

    setTeamMembers(prev => [...prev, newStaff]);
    toast.success(`Agent Seat Created for ${name}`, {
      description: `Access code ${newStaff.code} generated. Ready to assign CRM inquiries.`
    });

    setName('');
    setEmail('');
    setPhone('');
    setRole('CONCIERGE');
    setIsSubmitting(false);
    setInviteModalOpen(false);
  };

  const handleRemove = (id: string, staffName: string) => {
    if (id === 'staff-primary') {
      toast.error('Cannot remove Primary Agency Owner account.');
      return;
    }
    setTeamMembers(prev => prev.filter(m => m.id !== id));
    toast.info(`Seat for ${staffName} deactivated.`);
  };

  return (
    <div className="space-y-6">
      {/* Plan & Quota Header Card */}
      <div className="bg-card border border-border/70 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Users className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-foreground">
              Agency Team & Staff Seats
            </h2>
            {isEnterprise ? (
              <Badge className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-black text-xs gap-1">
                <Crown className="w-3.5 h-3.5" />
                Unlimited Seats (Enterprise)
              </Badge>
            ) : isPro ? (
              <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white font-black text-xs gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                3 Seats Included (Professional)
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs font-semibold text-muted-foreground">
                0 Seats (Starter Tier)
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground max-w-xl">
            {isEnterprise 
              ? 'Multi-branch agency access with unlimited team seats and granular CRM permissions.' 
              : isPro 
                ? 'Assign your team members individual logins to claim customer inquiries, generate white-labeled quotes, and track conversions.' 
                : 'Starter Partner plan is single-user. Upgrade to Professional DMC to unlock 3 agent seats with individual lead quotas.'}
          </p>

          {/* Utilization progress bar for Pro */}
          {isPro && !isEnterprise && (
            <div className="pt-2 max-w-md space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span>Seat Allocation</span>
                <span className="text-primary">{usedSeats} of {maxSeats} Seats Used</span>
              </div>
              <Progress value={(usedSeats / maxSeats) * 100} className="h-2 rounded-full" />
            </div>
          )}
        </div>

        <div className="shrink-0 flex items-center gap-3">
          {!isPro ? (
            <Button
              onClick={onOpenUpgradeModal}
              className="rounded-2xl text-xs font-bold gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-md shadow-amber-500/20"
            >
              <Sparkles className="w-4 h-4" />
              <span>Upgrade to Add Staff (3 Seats)</span>
            </Button>
          ) : (
            <Button
              onClick={() => {
                if (!canAddMore) {
                  toast.info('Maximum 3 seats used. Upgrade to Enterprise for unlimited seats.');
                  onOpenUpgradeModal();
                } else {
                  setInviteModalOpen(true);
                }
              }}
              className="rounded-2xl text-xs font-bold gap-2 shadow-md shadow-primary/20"
            >
              <UserPlus className="w-4 h-4" />
              <span>Invite New Agent</span>
            </Button>
          )}
        </div>
      </div>

      {/* Staff Roster Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teamMembers.map((member) => (
          <Card key={member.id} className="rounded-3xl border border-border/70 p-5 bg-card flex flex-col justify-between hover:border-primary/40 transition-all">
            <div>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary font-bold flex items-center justify-center text-sm border border-primary/20">
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                      {member.name}
                      {member.isOnline ? (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Online" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-muted-foreground/40" title="Offline" />
                      )}
                    </h4>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {member.code}
                    </span>
                  </div>
                </div>

                <Badge variant="outline" className="text-[9px] uppercase font-bold tracking-wider">
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
                  <span>Active CRM Leads:</span>
                  <span className="font-bold text-foreground">{member.assignedLeadsCount} Leads</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Joined: {member.joinedAt}</span>
              {member.id !== 'staff-primary' && (
                <button
                  onClick={() => handleRemove(member.id, member.name)}
                  className="text-rose-500 hover:text-rose-600 text-xs font-medium flex items-center gap-1 transition"
                  title="Remove seat"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Remove</span>
                </button>
              )}
            </div>
          </Card>
        ))}

        {/* Empty Seat placeholder for Pro */}
        {isPro && !isEnterprise && usedSeats < maxSeats && (
          <div 
            onClick={() => setInviteModalOpen(true)}
            className="rounded-3xl border-2 border-dashed border-border hover:border-primary/50 p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-muted/20 min-h-[180px] group"
          >
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <UserPlus className="w-5 h-5" />
            </div>
            <p className="font-bold text-sm text-foreground">Available Agent Seat</p>
            <p className="text-xs text-muted-foreground mt-1">
              Click to invite another agency colleague ({maxSeats - usedSeats} remaining).
            </p>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      <Dialog open={inviteModalOpen} onOpenChange={setInviteModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6 bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <UserPlus className="w-5 h-5 text-primary" />
              <span>Invite Agency Staff Member</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Provisions a dedicated staff seat under <strong>{agencyName}</strong>. They will be able to access the Travel CRM and issue quotes.
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
              <Label className="text-xs font-semibold">Permission Role</Label>
              <Select value={role} onValueChange={(val: any) => setRole(val)}>
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
                {isSubmitting ? 'Provisioning...' : 'Confirm & Provision Seat'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
