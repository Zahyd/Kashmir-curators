import React from 'react';
import { 
  Zap, 
  Crown, 
  Sparkles, 
  ArrowUpRight, 
  CheckCircle2, 
  Clock 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { SaaSPlanId } from './SubscriptionPlanModal';

interface UsageQuotaMeterProps {
  plan: SaaSPlanId;
  leadsUsed: number;
  leadsLimit: number;
  onOpenUpgradeModal: () => void;
}

export const UsageQuotaMeter: React.FC<UsageQuotaMeterProps> = ({
  plan = 'STARTER',
  leadsUsed = 8,
  leadsLimit = 15,
  onOpenUpgradeModal
}) => {
  const isPro = plan === 'PRO_DMC' || plan === 'ENTERPRISE';
  const pct = isPro ? 100 : Math.min(100, Math.round((leadsUsed / leadsLimit) * 100));

  return (
    <div className="bg-card border border-border/70 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
      {/* Left: Plan badge & Quota status */}
      <div className="space-y-1.5 flex-1">
        <div className="flex items-center gap-2">
          {isPro ? (
            <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white font-black text-xs gap-1 shadow-sm">
              <Crown className="w-3.5 h-3.5" />
              {plan === 'ENTERPRISE' ? 'Enterprise Fleet Partner' : 'Pro DMC Active'}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs font-semibold">
              Starter Free Plan
            </Badge>
          )}

          <span className="text-xs text-muted-foreground">
            {isPro ? 'Unlimited Monthly Inquiries' : `${leadsUsed} of ${leadsLimit} Leads Used`}
          </span>
        </div>

        {/* Meter bar */}
        {!isPro ? (
          <div className="space-y-1">
            <Progress value={pct} className="h-2 rounded-full" />
            <p className="text-[11px] text-muted-foreground">
              {leadsLimit - leadsUsed} leads remaining in your monthly free quota.
            </p>
          </div>
        ) : (
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            White-Label & Unlimited Quotations Unlocked
          </p>
        )}
      </div>

      {/* Right: Upgrade / Manage Plan CTA */}
      <div className="shrink-0 flex items-center gap-2">
        {!isPro ? (
          <Button
            size="sm"
            onClick={onOpenUpgradeModal}
            className="rounded-xl text-xs font-bold gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-md shadow-amber-500/20"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Upgrade for Unlimited Leads</span>
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={onOpenUpgradeModal}
            className="rounded-xl text-xs font-semibold gap-1.5"
          >
            <Crown className="w-3.5 h-3.5 text-amber-500" />
            <span>Manage Subscription</span>
          </Button>
        )}
      </div>
    </div>
  );
};

export default UsageQuotaMeter;
