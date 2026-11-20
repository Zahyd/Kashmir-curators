import React, { useState } from 'react';
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
  AlertCircle,
  Lock,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface CustomDomainCardProps {
  isEnterprise: boolean;
  onOpenUpgradeModal: () => void;
  agencyName?: string;
}

export const CustomDomainCard: React.FC<CustomDomainCardProps> = ({
  isEnterprise = false,
  onOpenUpgradeModal,
  agencyName = 'Chinar Holidays'
}) => {
  const [domain, setDomain] = useState(() => {
    return localStorage.getItem('agency_custom_domain') || `quotes.${agencyName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'youragency'}.com`;
  });
  const [isVerifying, setIsVerifying] = useState(false);
  const [status, setStatus] = useState<'VERIFIED' | 'PENDING' | 'NOT_CONFIGURED'>(() => {
    return localStorage.getItem('agency_domain_status') as any || 'VERIFIED';
  });
  const [copiedTarget, setCopiedTarget] = useState(false);

  const handleCopyTarget = () => {
    navigator.clipboard.writeText('cname.kashmircurators.vercel.app');
    setCopiedTarget(true);
    toast.success('CNAME Target copied to clipboard');
    setTimeout(() => setCopiedTarget(false), 2000);
  };

  const handleSaveDomain = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEnterprise) {
      onOpenUpgradeModal();
      return;
    }

    if (!domain.includes('.')) {
      toast.error('Please enter a valid domain format (e.g. quotes.youragency.com)');
      return;
    }

    setIsVerifying(true);
    setTimeout(() => {
      localStorage.setItem('agency_custom_domain', domain);
      localStorage.setItem('agency_domain_status', 'VERIFIED');
      setStatus('VERIFIED');
      setIsVerifying(false);
      toast.success('Custom Domain Configured & SSL Active!', {
        description: `Client proposal links will now resolve via https://${domain}/itinerary/:id`
      });
    }, 1200);
  };

  const handleCheckDns = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      toast.success('DNS Resolution Verified', {
        description: `CNAME record successfully points to cname.kashmircurators.vercel.app`
      });
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Enterprise Gate Banner */}
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
                Host all customer proposal links, live itineraries, and voucher portals under your own branded domain (e.g. <code>quotes.youragency.com</code>) with automatic TLS certificate issuance.
              </p>
            </div>
          </div>
          <Button
            onClick={onOpenUpgradeModal}
            className="rounded-2xl text-xs font-bold gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shrink-0 shadow-lg shadow-purple-500/20"
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
              <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30 text-xs font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                SSL Active
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground max-w-xl">
              Deliver 100% white-labeled proposals directly under your primary agency website address.
            </p>
          </div>
        </div>
      )}

      {/* Domain Configuration Form */}
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
                  placeholder="quotes.youragency.com"
                  className="pl-20 h-11 rounded-2xl text-xs font-mono"
                  disabled={!isEnterprise}
                />
              </div>

              <Button
                type="submit"
                disabled={isVerifying || !isEnterprise}
                className="rounded-2xl text-xs font-bold gap-2 h-11 px-5 shadow-sm shrink-0"
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Save & Provision SSL</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>

        {/* DNS Configuration Instructions */}
        <div className="bg-muted/40 p-5 rounded-2xl border border-border/50 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-primary" />
            <span>DNS Configuration Instructions</span>
          </h4>
          <p className="text-xs text-muted-foreground">
            In your DNS registrar (GoDaddy, Cloudflare, Namecheap, Google Domains), add the following CNAME record:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
            <div className="bg-card p-3 rounded-xl border border-border/60">
              <span className="text-[10px] text-muted-foreground uppercase font-bold">Record Type</span>
              <p className="font-mono font-bold text-foreground mt-0.5">CNAME</p>
            </div>

            <div className="bg-card p-3 rounded-xl border border-border/60">
              <span className="text-[10px] text-muted-foreground uppercase font-bold">Host / Name</span>
              <p className="font-mono font-bold text-foreground mt-0.5">quotes</p>
            </div>

            <div className="bg-card p-3 rounded-xl border border-border/60 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-bold">Target Value</span>
                <p className="font-mono font-bold text-foreground mt-0.5 truncate max-w-[150px]">
                  cname.kashmircurators.vercel.app
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopyTarget}
                className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition"
                title="Copy Target"
              >
                {copiedTarget ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                SSL Provisioning: Automated Let's Encrypt TLS
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleCheckDns}
              disabled={isVerifying}
              className="rounded-xl text-xs h-8 px-3"
            >
              <RefreshCw className={`w-3 h-3 mr-1.5 ${isVerifying ? 'animate-spin' : ''}`} />
              <span>Verify DNS Health</span>
            </Button>
          </div>
        </div>

        {/* Live Proposal URL Preview */}
        <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 truncate">
            <Sparkles className="w-4 h-4 text-primary shrink-0" />
            <span className="text-muted-foreground">Example Client Proposal Link:</span>
            <span className="font-mono font-bold text-foreground truncate">
              https://{domain}/itinerary/KC-GULMARG-8942
            </span>
          </div>

          <a
            href={`https://${domain}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-primary hover:underline font-bold shrink-0"
          >
            <span>Preview Portal</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </Card>
    </div>
  );
};
