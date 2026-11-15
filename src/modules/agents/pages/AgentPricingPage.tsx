import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Check, 
  Sparkles, 
  Building2, 
  ShieldCheck, 
  Zap, 
  HelpCircle, 
  ArrowRight, 
  Car, 
  FileSpreadsheet, 
  Users, 
  Lock,
  Headphones,
  CheckCircle2,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export const AgentPricingPage: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY');

  const plans = [
    {
      id: 'starter',
      name: 'Starter Partner',
      tagline: 'Ideal for independent travel consultants and emerging Kashmir agents',
      monthlyPrice: '₹0',
      annualPrice: '₹0',
      periodText: 'Free Forever',
      badge: null,
      highlight: false,
      features: [
        'Up to 10 active CRM leads per month',
        'Standard PDF itinerary generator',
        'Retail tariff view & public availability',
        'Community cab booking requests',
        'Standard email & community support',
        'Basic travel advisory radar alerts'
      ],
      notIncluded: [
        'AI Sales Copilot & auto-pricing',
        'Custom white-label logo branding',
        'Direct wholesale B2B net rates',
        'Priority 4x4 snow-chain cab dispatch',
        'Multi-agent team seats'
      ],
      ctaText: 'Apply with Starter Plan',
      ctaLink: '/agent/apply?plan=starter'
    },
    {
      id: 'professional',
      name: 'Professional DMC',
      tagline: 'For established agencies scaling high-margin Kashmir holiday packages',
      monthlyPrice: '₹2,999',
      annualPrice: '₹2,399',
      annualBillingTotal: '₹28,790 / year (save 20%)',
      periodText: billingCycle === 'ANNUAL' ? '/ month, billed annually' : '/ month',
      badge: 'Most Popular',
      highlight: true,
      features: [
        'Unlimited CRM leads & 8-stage Kanban board',
        'AI Sales Copilot & 60s auto-pricing generator',
        'Full White-Label PDF quotes with agency logo & colors',
        'Contracted wholesale net rates (5-star Gulmarg, houseboats, Pahalgam)*',
        'Priority 1,200+ 4x4 commercial cab dispatch',
        '3 Team Agent seats with activity tracking',
        'WhatsApp click-to-chat client follow-ups',
        'Live Road Radar corridor alerts (NH44, Sinthan, Gondola)'
      ],
      notIncluded: [
        'Dedicated Key Account Manager',
        'Custom domain client portal',
        'Net 15 credit terms'
      ],
      ctaText: 'Apply with Professional Plan',
      ctaLink: '/agent/apply?plan=professional'
    },
    {
      id: 'enterprise',
      name: 'Enterprise Network',
      tagline: 'For multi-branch travel companies, consolidators, and large DMCs',
      monthlyPrice: '₹7,999',
      annualPrice: '₹6,399',
      annualBillingTotal: '₹76,790 / year (save 20%)',
      periodText: billingCycle === 'ANNUAL' ? '/ month, billed annually' : '/ month',
      badge: 'Full Scale',
      highlight: false,
      features: [
        'Everything in Professional Plan',
        'Unlimited team agent seats & granular RBAC permissions',
        'Dedicated Srinagar Key Account Operations Manager (24/7 direct phone)',
        'Net 15-day supplier credit terms (subject to J&K compliance audit)',
        'Custom domain client portal (e.g. quotes.youragency.com)',
        'Direct B2B XML/REST inventory API feed',
        'VIP on-ground airport escort & Gondola priority handling',
        'Quarterly business reviews & volume rebate incentives'
      ],
      notIncluded: [],
      ctaText: 'Apply with Enterprise Plan',
      ctaLink: '/agent/apply?plan=enterprise'
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-amber-500 selection:text-black">
      <Navbar />

      <main className="flex-1 pt-32 pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs font-bold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Transparent Travel Tech & Wholesale Access</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-display font-black tracking-tight text-foreground">
            Simple, High-ROI Plans for Modern Travel Agencies
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground mt-4 leading-relaxed font-medium">
            Choose the right tier to automate your Kashmir quoting, manage leads seamlessly, and access locked wholesale supplier allocations.
          </p>

          {/* Billing Cycle Toggle */}
          <div className="mt-8 inline-flex items-center p-1.5 rounded-2xl bg-muted/70 border border-border/80 shadow-inner">
            <button
              onClick={() => setBillingCycle('MONTHLY')}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                billingCycle === 'MONTHLY'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('ANNUAL')}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                billingCycle === 'ANNUAL'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>Annual Billing</span>
              <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-slate-950 text-white dark:bg-white dark:text-slate-950">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid md:grid-cols-3 gap-8 items-stretch mb-16">
          {plans.map((p) => {
            const displayPrice = billingCycle === 'ANNUAL' ? p.annualPrice : p.monthlyPrice;

            return (
              <div
                key={p.id}
                className={`rounded-3xl p-8 flex flex-col justify-between transition-all relative ${
                  p.highlight
                    ? 'border-2 border-amber-500 bg-card shadow-2xl shadow-amber-500/10 scale-100 md:scale-105 z-10'
                    : 'border border-border/80 bg-card/60 shadow-lg hover:border-amber-500/40'
                }`}
              >
                {p.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-md">
                    {p.badge}
                  </div>
                )}

                <div>
                  <div className="mb-6">
                    <h3 className="text-2xl font-display font-extrabold text-foreground">{p.name}</h3>
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed min-h-[36px]">{p.tagline}</p>
                  </div>

                  <div className="mb-8 pb-6 border-b border-border/60">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl sm:text-5xl font-mono font-black text-foreground">{displayPrice}</span>
                      <span className="text-xs font-semibold text-muted-foreground">{p.periodText}</span>
                    </div>
                    {billingCycle === 'ANNUAL' && p.annualBillingTotal && (
                      <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                        {p.annualBillingTotal}
                      </p>
                    )}
                  </div>

                  {/* Feature Checklist */}
                  <div className="space-y-3 mb-8">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">What's included</p>
                    {p.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs text-foreground leading-tight">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                    {p.notIncluded.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs text-muted-foreground/60 leading-tight">
                        <X className="w-4 h-4 text-muted-foreground/40 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Button
                    asChild
                    size="lg"
                    className={`w-full h-13 rounded-2xl font-bold text-sm shadow-md transition-all ${
                      p.highlight
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/25'
                        : 'bg-muted hover:bg-muted/80 text-foreground border border-border'
                    }`}
                  >
                    <Link to={p.ctaLink}>
                      <span>{p.ctaText}</span>
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                  <p className="text-[10px] text-center text-muted-foreground mt-2 font-medium">
                    Zero payment required during registration review.
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Regulatory & Commercial Separation Notice */}
        <div className="p-6 sm:p-8 rounded-3xl border border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10 mb-16 max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div className="space-y-1.5 text-center md:text-left">
            <h4 className="font-bold text-base text-foreground">
              Important: Separation of Software Subscription vs. Wholesale Tariffs Authorization
            </h4>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Your software membership unlocks the Travel CRM, AI Sales Copilot, and 60s White-Label Quote Generator. Direct contracted wholesale hotel, houseboat, and cab rates are regulated under the <strong>Jammu & Kashmir Registration of Tourist Trade Act</strong>. Access to confidential net B2B rates requires valid business verification (J&K Tourism certificate or state GSTIN).
            </p>
          </div>
        </div>

        {/* Detailed Comparative Feature Matrix */}
        <div className="mb-20">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h3 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
              Detailed Feature Comparison
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2">
              Explore capabilities across CRM tools, AI automation, and ground DMC wholesale access.
            </p>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-border/80 bg-card shadow-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="p-4 sm:p-5 font-black uppercase tracking-wider text-muted-foreground w-2/5">Platform Feature</th>
                  <th className="p-4 sm:p-5 font-black uppercase tracking-wider text-foreground text-center">Starter</th>
                  <th className="p-4 sm:p-5 font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 text-center bg-amber-500/5">
                    Professional
                  </th>
                  <th className="p-4 sm:p-5 font-black uppercase tracking-wider text-foreground text-center">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {/* Section: CRM & Sales */}
                <tr className="bg-muted/20 font-bold">
                  <td colSpan={4} className="p-3 text-muted-foreground uppercase tracking-widest text-[10px]">
                    Travel Sales CRM & Operations
                  </td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-foreground">Monthly Active Leads Limit</td>
                  <td className="p-4 text-center text-muted-foreground">10 Leads</td>
                  <td className="p-4 text-center font-bold text-foreground bg-amber-500/5">Unlimited</td>
                  <td className="p-4 text-center font-bold text-foreground">Unlimited</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-foreground">8-Stage Kanban Pipeline & Drag-and-Drop</td>
                  <td className="p-4 text-center text-muted-foreground">Basic 3-Stage</td>
                  <td className="p-4 text-center text-emerald-500 font-bold bg-amber-500/5">Full 8-Stage</td>
                  <td className="p-4 text-center text-emerald-500 font-bold">Full 8-Stage + Custom</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-foreground">Team Agent Seats</td>
                  <td className="p-4 text-center text-muted-foreground">1 Seat</td>
                  <td className="p-4 text-center font-bold text-foreground bg-amber-500/5">3 Seats</td>
                  <td className="p-4 text-center font-bold text-foreground">Unlimited Seats</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-foreground">Customer Activity Timeline & Notes</td>
                  <td className="p-4 text-center"><Check className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                  <td className="p-4 text-center bg-amber-500/5"><Check className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                  <td className="p-4 text-center"><Check className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                </tr>

                {/* Section: AI Copilot & Quotes */}
                <tr className="bg-muted/20 font-bold">
                  <td colSpan={4} className="p-3 text-muted-foreground uppercase tracking-widest text-[10px]">
                    AI Copilot & Itinerary Engine
                  </td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-foreground">AI Sales Copilot & Response Suggestions</td>
                  <td className="p-4 text-center"><X className="w-4 h-4 text-muted-foreground/40 mx-auto" /></td>
                  <td className="p-4 text-center bg-amber-500/5"><Check className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                  <td className="p-4 text-center"><Check className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-foreground">60-Second Auto-Pricing Itinerary Generator</td>
                  <td className="p-4 text-center text-muted-foreground">Manual Only</td>
                  <td className="p-4 text-center bg-amber-500/5 text-emerald-500 font-bold">Instant Auto-Pricing</td>
                  <td className="p-4 text-center text-emerald-500 font-bold">Instant Auto-Pricing</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-foreground">White-Label PDF Quotations (Zero Kashmir Curators watermark)</td>
                  <td className="p-4 text-center"><X className="w-4 h-4 text-muted-foreground/40 mx-auto" /></td>
                  <td className="p-4 text-center bg-amber-500/5"><Check className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                  <td className="p-4 text-center"><Check className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-foreground">Custom Agency Logo & Primary Brand Color</td>
                  <td className="p-4 text-center"><X className="w-4 h-4 text-muted-foreground/40 mx-auto" /></td>
                  <td className="p-4 text-center bg-amber-500/5"><Check className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                  <td className="p-4 text-center"><Check className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                </tr>

                {/* Section: Ground Wholesale & Inventory */}
                <tr className="bg-muted/20 font-bold">
                  <td colSpan={4} className="p-3 text-muted-foreground uppercase tracking-widest text-[10px]">
                    Ground DMC Wholesale Tariffs & Fleet
                  </td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-foreground">Contracted Wholesale Stays Net Pricing (Gulmarg, Dal, Pahalgam)</td>
                  <td className="p-4 text-center text-muted-foreground">Standard Retail</td>
                  <td className="p-4 text-center font-bold text-emerald-500 bg-amber-500/5">Wholesale Net Rates*</td>
                  <td className="p-4 text-center font-bold text-emerald-500">Wholesale Net Rates*</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-foreground">1,200+ 4x4 Cab Fleet Dispatch (Snow chains guaranteed)</td>
                  <td className="p-4 text-center text-muted-foreground">Standard Queue</td>
                  <td className="p-4 text-center font-bold text-foreground bg-amber-500/5">Priority Dispatch</td>
                  <td className="p-4 text-center font-bold text-foreground">Guaranteed VIP Dispatch</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-foreground">Corridor Weather & Highway Radar Alerts</td>
                  <td className="p-4 text-center text-muted-foreground">Daily Brief</td>
                  <td className="p-4 text-center bg-amber-500/5 text-emerald-500 font-bold">Real-time Push</td>
                  <td className="p-4 text-center text-emerald-500 font-bold">Real-time Push</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-foreground">Payment Terms / Supplier Credit</td>
                  <td className="p-4 text-center text-muted-foreground">100% Pre-payment</td>
                  <td className="p-4 text-center text-muted-foreground bg-amber-500/5">Advance Milestone</td>
                  <td className="p-4 text-center font-bold text-emerald-500">Net 15 Days (Audited)</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-foreground">Support SLA</td>
                  <td className="p-4 text-center text-muted-foreground">24-48 Hours</td>
                  <td className="p-4 text-center font-bold text-foreground bg-amber-500/5">4 Hours Priority Desk</td>
                  <td className="p-4 text-center font-bold text-emerald-500">Dedicated Account Mgr</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Pricing FAQs */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-display font-bold text-foreground">Frequently Asked Questions</h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">Common questions about billing, plans, and activation.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-6 rounded-2xl bg-card border border-border space-y-2">
              <h4 className="font-bold text-sm text-foreground">Will my card be charged when I apply?</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                No. You are never charged immediately upon application. Your application is first reviewed by our Srinagar Operations Desk. Subscription payment only begins when you confirm and activate your plan.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border space-y-2">
              <h4 className="font-bold text-sm text-foreground">Can I upgrade or downgrade later?</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Yes. You can switch between Starter, Professional, and Enterprise plans at any time directly inside your Agent Desk billing dashboard.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border space-y-2">
              <h4 className="font-bold text-sm text-foreground">Do you provide GST invoices?</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Yes. Complete 18% GST input credit tax invoices are generated automatically for every subscription charge and downloadable in your account.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border space-y-2">
              <h4 className="font-bold text-sm text-foreground">How do white-label quotations work?</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                In the Professional and Enterprise tiers, your exported PDF itineraries feature your own agency logo, branding color, contact information, and terms. Kashmir Curators branding is completely removed.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom CTA Banner */}
        <div className="p-10 rounded-3xl bg-slate-900 dark:bg-slate-950 text-white border border-border/40 text-center relative overflow-hidden">
          <div className="max-w-2xl mx-auto relative z-10 space-y-4">
            <h3 className="text-2xl sm:text-4xl font-display font-extrabold text-white">
              Ready to Upgrade Your Kashmir Agency Operations?
            </h3>
            <p className="text-sm text-slate-300">
              Join 500+ verified travel partners across India. Zero setup fees. Free verification review.
            </p>
            <div className="pt-2">
              <Button
                asChild
                size="lg"
                className="h-13 px-8 text-sm font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-2xl shadow-xl shadow-amber-500/20"
              >
                <Link to="/agent/apply">
                  <span>Apply for B2B Agency Access</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AgentPricingPage;
