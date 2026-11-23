import React, { useState } from 'react';
import { 
  Check, 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  Building2, 
  Crown, 
  CreditCard,
  ArrowRight,
  Flame,
  HelpCircle
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export type SaaSPlanId = 'STARTER' | 'PRO_DMC' | 'ENTERPRISE';

interface SubscriptionPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: SaaSPlanId;
  onUpgradePlan: (planId: SaaSPlanId, billingCycle: 'MONTHLY' | 'ANNUAL') => Promise<void>;
}

export const SubscriptionPlanModal: React.FC<SubscriptionPlanModalProps> = ({
  isOpen,
  onClose,
  currentPlan = 'STARTER',
  onUpgradePlan
}) => {
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY');
  const [selectedPlan, setSelectedPlan] = useState<SaaSPlanId>(currentPlan);
  const [isProcessing, setIsProcessing] = useState(false);

  const PLANS = [
    {
      id: 'STARTER' as SaaSPlanId,
      name: 'Starter Agent',
      badge: 'Free Tier',
      tagline: 'Ideal for independent curators and new agencies',
      monthlyPrice: 0,
      annualPrice: 0,
      features: [
        'Up to 15 CRM Leads per month',
        'Standard Kashmir Quote Generator',
        'Public Itinerary Links',
        'Kashmir Connect watermark',
        'Community email support'
      ],
      popular: false
    },
    {
      id: 'PRO_DMC' as SaaSPlanId,
      name: 'Pro DMC Operator',
      badge: 'Most Popular',
      tagline: 'For established travel operators scaling high-margin Kashmir tours',
      monthlyPrice: 1999,
      annualPrice: 15999, // ₹15,999/yr
      features: [
        'Unlimited Travel CRM Inquiries & Leads',
        '100% White-Label: Your Agency Logo & Colors on Itineraries',
        'Direct WhatsApp Automated Proposals',
        'Official "Kashmir Verified DMC" QR Seal',
        'Direct wholesale B2B net rates (0% platform markup)',
        'Live Srinagar Airport & Road advisory radar sync',
        'Priority Phone & Operations Concierge'
      ],
      popular: true
    },
    {
      id: 'ENTERPRISE' as SaaSPlanId,
      name: 'Fleet & Luxury Partner',
      badge: 'DMC Enterprise',
      tagline: 'Multi-seat team management with exclusive wholesale inventory locks',
      monthlyPrice: 4999,
      annualPrice: 39999, // ₹39,999/yr
      features: [
        'Everything in Pro DMC plan',
        'Up to 10 Agent & Staff Sub-accounts',
        'Automated Commission & Split-Settlement Ledgers',
        'Priority Gulmarg Gondola Phase 1 & 2 Allotment Desk',
        'Emergency Tourist Rerouting & Wallet Escrow',
        'Dedicated 24/7 Kashmir Ground Coordinator'
      ],
      popular: false
    }
  ];

  const handleConfirmUpgrade = async () => {
    if (selectedPlan === currentPlan) {
      toast.info('You are already subscribed to this tier.');
      onClose();
      return;
    }

    try {
      setIsProcessing(true);
      await onUpgradePlan(selectedPlan, billingCycle);
      toast.success(`Upgraded to ${selectedPlan.replace('_', ' ')}!`, {
        description: `Your account has been upgraded with active SaaS capabilities.`,
        icon: '🚀'
      });
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Payment simulation failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl rounded-3xl p-6 bg-card max-h-[92vh] overflow-y-auto">
        <DialogHeader className="text-center sm:text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Kashmir Connect SaaS Tiers
                </span>
              </div>
              <DialogTitle className="text-xl sm:text-2xl font-black text-foreground mt-1">
                Upgrade Your B2B Travel Agency OS
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Unlock white-labeled proposals, unlimited CRM leads, and zero-surcharge wholesale rates.
              </DialogDescription>
            </div>

            {/* Monthly / Annual Toggle */}
            <div className="flex items-center self-center sm:self-auto bg-muted/60 p-1 rounded-2xl border border-border/60">
              <button
                type="button"
                onClick={() => setBillingCycle('MONTHLY')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  billingCycle === 'MONTHLY'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('ANNUAL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                  billingCycle === 'ANNUAL'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span>Annual</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.2 rounded-md font-black">
                  SAVE 20%
                </span>
              </button>
            </div>
          </div>
        </DialogHeader>

        {/* 3 Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
          {PLANS.map((plan) => {
            const isSelected = selectedPlan === plan.id;
            const isCurrent = currentPlan === plan.id;
            const price = billingCycle === 'ANNUAL' ? plan.annualPrice : plan.monthlyPrice;

            return (
              <div
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`rounded-3xl p-5 border-2 transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
                    : 'border-border/70 bg-card hover:border-primary/50'
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-amber-600 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-xl shadow-sm">
                    {plan.badge}
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <h3 className="font-bold text-base text-foreground">{plan.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{plan.tagline}</p>
                  </div>

                  <div className="pt-2">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-foreground">
                        {price === 0 ? 'Free' : `₹${price.toLocaleString('en-IN')}`}
                      </span>
                      {price > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {billingCycle === 'ANNUAL' ? '/ year' : '/ month'}
                        </span>
                      )}
                    </div>
                    {billingCycle === 'ANNUAL' && price > 0 && (
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                        Billed annually (₹{price.toLocaleString('en-IN')}/yr)
                      </span>
                    )}
                  </div>

                  {/* Feature Checklist */}
                  <ul className="space-y-2 pt-3 border-t border-border/50 text-xs">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="text-muted-foreground leading-tight text-[11px]">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 mt-4 border-t border-border/40">
                  <Button
                    size="sm"
                    variant={isSelected ? 'default' : 'outline'}
                    className={`w-full rounded-xl text-xs font-bold ${
                      isSelected ? 'shadow-sm shadow-primary/20' : ''
                    }`}
                  >
                    {isCurrent 
                      ? 'Current Tier' 
                      : (plan.id === 'PRO_DMC' 
                          ? 'Upgrade to Pro DMC' 
                          : plan.id === 'ENTERPRISE' 
                            ? 'Upgrade to Enterprise' 
                            : isSelected ? 'Selected' : 'Select Plan')}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-border/50">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Cancel or change plans anytime. Instant activation.</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={onClose} className="rounded-xl text-xs flex-1 sm:flex-initial">
              Dismiss
            </Button>
            <Button
              onClick={handleConfirmUpgrade}
              disabled={isProcessing}
              className="rounded-xl text-xs font-bold gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 flex-1 sm:flex-initial"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>
                {isProcessing 
                  ? 'Processing Upgrade...' 
                  : (selectedPlan === 'PRO_DMC' 
                      ? 'Upgrade to Pro DMC' 
                      : selectedPlan === 'ENTERPRISE' 
                        ? 'Upgrade to Enterprise' 
                        : 'Activate Starter')}
              </span>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionPlanModal;
