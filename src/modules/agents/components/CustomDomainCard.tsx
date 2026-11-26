import React, { useState, useEffect, useCallback } from 'react';
import {
  Globe,
  ShieldCheck,
  ExternalLink,
  Sparkles,
  Crown,
  CheckCircle2,
  Clock,
  RefreshCw,
  Copy,
  Check,
  AlertCircle
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { agentApi, AgentDomainStatus, getErrMsg } from '../lib/agentApi';

interface CustomDomainCardProps {
  isEnterprise: boolean;
  onOpenUpgradeModal: () => void;
  agencyName?: string;
  refreshTrigger?: number;
}

export const CustomDomainCard: React.FC<CustomDomainCardProps> = ({
  isEnterprise = false,
  onOpenUpgradeModal,
  refreshTrigger = 0
}) => {
  const { token } = useAuth();
  const [domain, setDomain] = useState('');
  const [statusData, setStatusData] = useState<AgentDomainStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [copiedTarget, setCopiedTarget] = useState(false);

  const loadDomain = useCallback(async () => {
    try {
      setLoading(true);
      const res = await agentApi.getDomain(token);
      setStatusData(res);
      if (res.domain) setDomain(res.domain);
    } catch {
      // Keep default state
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadDomain();
  }, [loadDomain, refreshTrigger]);

  const cnameTarget = statusData?.cnameTarget || 'cname.kashmircurators.vercel.app';
  const currentStatus = statusData?.status || 'NOT_CONFIGURED';

  const handleCopyTarget = () => {
    navigator.clipboard.writeText(cnameTarget);
    setCopiedTarget(true);
    toast.success('CNAME Target copied to clipboard');
    setTimeout(() => setCopiedTarget(false), 2000);
  };

  const handleSaveDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEnterprise) {
      onOpenUpgradeModal();
      return;
    }

    try {
      setIsSaving(true);
      const res = await agentApi.updateDomain(domain, token);
      setStatusData(res);
      setDomain(res.domain);
      toast.success('Custom domain saved in Organization database', {
        description: 'Add the CNAME record below, then click Verify DNS.'
      });
    } catch (err: unknown) {
      toast.error(getErrMsg(err, 'Failed to save custom domain'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCheckDns = async () => {
    if (!domain.trim()) {
      toast.error('Save a custom domain first');
      return;
    }
    try {
      setIsVerifying(true);
      const res = await agentApi.verifyDomain(domain, token);
      setStatusData(res);
      if (res.status === 'VERIFIED') {
        toast.success('DNS CNAME verified successfully!');
      } else {
        toast.info('DNS check complete', {
          description: res.lastError || `Waiting for CNAME -> ${cnameTarget}`
        });
      }
    } catch (err: unknown) {
      toast.error(getErrMsg(err, 'DNS verification failed'));
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-6">
      {!isEnterprise ? (
        <div className="bg-gradient-to-r from-purple-500/15 via-indigo-500/10 to-transparent p-6 rounded-3xl border border-purple-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-purple-500/20 text-purple-400 shrink-0">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-foreground">Custom Domain Client Portal</h3>
                <Badge className="bg-purple-500 text-white font-bold text-[10px]">Enterprise Only</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-xl">
                Host customer proposal links and itinerary portals under your own branded domain (e.g. <code>quotes.youragency.com</code>).
              </p>
            </div>
          </div>
          <Button
            onClick={onOpenUpgradeModal}
            className="rounded-2xl text-xs font-bold gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white shrink-0 shadow-lg shadow-purple-500/20"
          >
            <Crown className="w-4 h-4" />
            <span>Upgrade to Enterprise</span>
          </Button>
        </div>
      ) : (
        <div className="bg-card border border-border/70 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
                <Globe className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Custom Domain & Client Portal</h2>
              <Badge
                className={
                  currentStatus === 'VERIFIED'
                    ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30 text-xs font-bold flex items-center gap-1'
                    : 'bg-amber-500/15 text-amber-500 border-amber-500/30 text-xs font-bold flex items-center gap-1'
                }
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                {currentStatus}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground max-w-xl">
              Persisted in Organization settings with live DNS CNAME verification.
            </p>
          </div>
        </div>
      )}

      <Card className="rounded-3xl border border-border/70 p-6 bg-card space-y-5">
        <form onSubmit={handleSaveDomain} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Custom Portal Domain / Subdomain</Label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">
                  https://
                </span>
                <Input
                  value={domain}
                  onChange={(e) => setDomain(e.target.value.toLowerCase().trim())}
                  placeholder={loading ? 'Loading...' : 'quotes.youragency.com'}
                  className="pl-20 h-11 rounded-2xl text-xs font-mono"
                  disabled={!isEnterprise}
                />
              </div>

              <Button
                type="submit"
                disabled={isSaving || !isEnterprise}
                className="rounded-2xl text-xs font-bold gap-2 h-11 px-5 shadow-sm shrink-0"
              >
                {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>{isSaving ? 'Saving...' : 'Save Custom Domain'}</span>
              </Button>
            </div>
          </div>
        </form>

        <div className="bg-muted/40 p-5 rounded-2xl border border-border/50 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-primary" />
            <span>DNS Configuration</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
            <div className="bg-card p-3 rounded-xl border border-border/60">
              <span className="text-[10px] text-muted-foreground uppercase font-bold">Record Type</span>
              <p className="font-mono font-bold text-foreground mt-0.5">CNAME</p>
            </div>
            <div className="bg-card p-3 rounded-xl border border-border/60">
              <span className="text-[10px] text-muted-foreground uppercase font-bold">Host / Name</span>
              <p className="font-mono font-bold text-foreground mt-0.5">
                {domain.includes('.') ? domain.split('.')[0] : 'quotes'}
              </p>
            </div>
            <div className="bg-card p-3 rounded-xl border border-border/60 flex items-center justify-between">
              <div className="min-w-0">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">Target Value</span>
                <p className="font-mono font-bold text-foreground mt-0.5 truncate">{cnameTarget}</p>
              </div>
              <button
                type="button"
                onClick={handleCopyTarget}
                className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition shrink-0"
              >
                {copiedTarget ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {statusData?.lastError && (
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{statusData.lastError}</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {statusData?.lastCheckedAt
                ? `Last verified: ${new Date(statusData.lastCheckedAt).toLocaleString()}`
                : 'Not checked yet'}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCheckDns}
              disabled={isVerifying || !domain}
              className="rounded-xl text-xs h-8 px-3"
            >
              <RefreshCw className={`w-3 h-3 mr-1.5 ${isVerifying ? 'animate-spin' : ''}`} />
              <span>Verify DNS</span>
            </Button>
          </div>
        </div>

        {domain && (
          <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 truncate">
              <Sparkles className="w-4 h-4 text-primary shrink-0" />
              <span className="text-muted-foreground">Proposal URL:</span>
              <span className="font-mono font-bold text-foreground truncate">
                https://{domain}/itinerary/&lt;inquiryId&gt;
              </span>
            </div>
            <a
              href={`https://${domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-primary hover:underline font-bold shrink-0"
            >
              <span>Open Host</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </Card>
    </div>
  );
};
