import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2, ShieldAlert, Sparkles, FileText, CheckCircle2,
  ArrowRight, ShieldCheck, Car, BedDouble, Compass, Users2,
  Landmark, Check, Briefcase, SlidersHorizontal, TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { useLandingPageContent } from '@/hooks/useLandingPageContent';
import { useCurrency } from '@/contexts/CurrencyContext';

const ICON_MAP: Record<string, any> = {
  Landmark,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  FileText,
  Users2,
  Building2,
  Compass,
  Car,
};

type StakeholderTab = 'agencies' | 'hotels' | 'fleet';

export default function B2BPartnerSection() {
  const [stakeholderTab, setStakeholderTab] = useState<StakeholderTab>('agencies');
  const [previewMode, setPreviewMode] = useState<'agent' | 'client'>('agent');
  const [markupPct, setMarkupPct] = useState<number>(20);
  const { b2bSection } = useLandingPageContent();
  const { formatPrice } = useCurrency();

  const badgeText = b2bSection?.badgeText || 'Kashmir Curators B2B Travel Operating System';
  const title = b2bSection?.title || 'Powering 400+ Travel Agents, Hotels & Fleets';
  const subtitle =
    b2bSection?.subtitle ||
    'Stop losing bookings to opaque cab unions and fragmented spreadsheets. Access contracted wholesale net rates, real-time hotel CRS sync, and 4x4 dispatch telemetry in one unified OS.';
  const pillars = b2bSection?.pillars || [];

  const wholesaleNetInr = 38500;
  const agencyMarginInr = Math.round((wholesaleNetInr * markupPct) / 100);
  const clientGrossInr = wholesaleNetInr + agencyMarginInr;

  return (
    <section className="py-16 md:py-28 bg-[#030608] text-white relative overflow-hidden border-y border-white/10">
      {/* Background Ambience */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-amber-500/10 blur-[160px] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-emerald-500/10 blur-[180px] pointer-events-none rounded-full" />

      <div className="container mx-auto px-4 sm:px-6 relative z-10 max-w-7xl">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-14">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 text-[10px] font-black tracking-[0.22em] uppercase mb-5">
            <Building2 className="w-3.5 h-3.5" />
            <span>{badgeText}</span>
          </div>
          <h2 className="font-display text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight mb-5">
            {title} <br className="hidden md:block" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-amber-200 to-emerald-400">
              On One Direct Ground OS
            </span>
          </h2>
          <p className="text-white/60 text-sm sm:text-lg font-medium leading-relaxed">{subtitle}</p>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-14">
          {pillars.map((pillar: any, index: number) => {
            const IconComponent = ICON_MAP[pillar.icon] || Landmark;
            const colors = [
              { border: 'hover:border-amber-400/40', bg: 'bg-amber-400/15', text: 'text-amber-400', badgeText: 'text-amber-400/90' },
              { border: 'hover:border-emerald-400/40', bg: 'bg-emerald-400/15', text: 'text-emerald-400', badgeText: 'text-emerald-400/90' },
              { border: 'hover:border-cyan-400/40', bg: 'bg-cyan-400/15', text: 'text-cyan-400', badgeText: 'text-cyan-400/90' },
              { border: 'hover:border-purple-400/40', bg: 'bg-purple-400/15', text: 'text-purple-400', badgeText: 'text-purple-400/90' },
            ];
            const color = colors[index % colors.length];

            return (
              <div
                key={pillar.title}
                className={`p-6 sm:p-7 rounded-3xl bg-white/[0.03] border border-white/10 ${color.border} transition-all duration-300`}
              >
                <div
                  className={`w-12 h-12 rounded-2xl ${color.bg} border border-white/15 flex items-center justify-center ${color.text} mb-5`}
                >
                  <IconComponent className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{pillar.title}</h3>
                <p className="text-xs sm:text-sm text-white/55 leading-relaxed mb-4">{pillar.desc}</p>
                <span className={`text-[11px] font-semibold ${color.badgeText} flex items-center gap-1.5`}>
                  <Check className="w-3.5 h-3.5" /> {pillar.highlight}
                </span>
              </div>
            );
          })}
        </div>

        {/* Interactive Stakeholder Workspace Preview */}
        <div className="max-w-5xl mx-auto rounded-[2rem] bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-white/15 p-5 sm:p-8 shadow-2xl relative">
          {/* Stakeholder Persona Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/10">
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: 'agencies', label: 'Travel Agencies OS', icon: Briefcase },
                { id: 'hotels', label: 'Hoteliers & Houseboats CRS', icon: BedDouble },
                { id: 'fleet', label: 'Cab Fleet & Chauffeurs', icon: Car },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = stakeholderTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setStakeholderTab(tab.id as StakeholderTab)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                      active
                        ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20'
                        : 'bg-white/5 text-white/65 hover:text-white border border-white/10'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {stakeholderTab === 'agencies' && (
              <div className="flex items-center gap-1 bg-black/60 p-1 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setPreviewMode('agent')}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                    previewMode === 'agent'
                      ? 'bg-amber-400 text-black'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  Net Cost Ledger
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode('client')}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                    previewMode === 'client'
                      ? 'bg-emerald-400 text-black'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  White-Label Client PDF
                </button>
              </div>
            )}
          </div>

          {/* Body by Stakeholder */}
          <div className="py-6">
            {stakeholderTab === 'agencies' && (
              <>
                {previewMode === 'agent' ? (
                  <div className="space-y-5 animate-fade-in">
                    <div className="flex flex-wrap items-center justify-between gap-2 bg-amber-400/10 border border-amber-400/20 px-4 py-3 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <Badge className="bg-amber-400 text-black font-black text-[10px]">INTERNAL DMC LEDGER</Badge>
                        <span className="text-xs text-amber-200">
                          Contracted wholesale ground rates locked with verified Kashmir properties & fleets
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-amber-400">AGT-ID: 7701</span>
                    </div>

                    {/* Interactive Margin Slider */}
                    <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-2.5">
                        <SlidersHorizontal className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-bold text-white">Simulate Your Agency Markup:</span>
                        <Badge className="bg-amber-400/20 text-amber-300 border-amber-400/30 font-mono">
                          +{markupPct}%
                        </Badge>
                      </div>
                      <div className="w-full sm:w-64">
                        <Slider
                          value={[markupPct]}
                          min={10}
                          max={35}
                          step={1}
                          onValueChange={(vals) => setMarkupPct(vals[0] ?? 20)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10">
                        <span className="text-white/45 text-[11px] uppercase font-bold block mb-1">
                          Wholesale Ground Net
                        </span>
                        <span className="text-2xl sm:text-3xl font-black text-white font-mono tabular-nums">
                          {formatPrice(wholesaleNetInr)}
                        </span>
                        <span className="text-[11px] text-emerald-400 block mt-1.5">
                          ✓ 5N/6D Hotels, 4x4 Cab & Shikara
                        </span>
                      </div>
                      <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10">
                        <span className="text-white/45 text-[11px] uppercase font-bold block mb-1">
                          Your Agency Margin ({markupPct}%)
                        </span>
                        <span className="text-2xl sm:text-3xl font-black text-amber-400 font-mono tabular-nums">
                          + {formatPrice(agencyMarginInr)}
                        </span>
                        <span className="text-[11px] text-white/50 block mt-1.5">
                          Auto-injected into white-label quote
                        </span>
                      </div>
                      <div className="p-5 rounded-2xl bg-white/[0.04] border border-emerald-400/25">
                        <span className="text-white/45 text-[11px] uppercase font-bold block mb-1">
                          Final Quoted To Client
                        </span>
                        <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono tabular-nums">
                          {formatPrice(clientGrossInr)}
                        </span>
                        <span className="text-[11px] text-white/50 block mt-1.5">
                          Instant Razorpay / PDF link ready
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 animate-fade-in">
                    <div className="flex flex-wrap items-center justify-between gap-2 bg-emerald-400/10 border border-emerald-400/20 px-4 py-3 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <Badge className="bg-emerald-400 text-black font-black text-[10px]">WHITE-LABEL BRANDED</Badge>
                        <span className="text-xs text-emerald-200">
                          Zero Kashmir Curators branding — Displays your travel agency logo & phone
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-white/75">
                        Agency: <strong>Royal Voyages, Mumbai</strong>
                      </span>
                    </div>

                    <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h5 className="text-base font-bold text-white">
                          6D/5N Kashmir Alpine & Dal Lake Sanctuary
                        </h5>
                        <span className="text-xl font-black text-amber-400 font-mono tabular-nums">
                          {formatPrice(clientGrossInr)}{' '}
                          <span className="text-xs text-white/50 font-normal">/ Couple</span>
                        </span>
                      </div>
                      <p className="text-xs text-white/65">
                        Specially curated for <strong>Dr. & Mrs. Malhotra</strong> • Heated heritage Nigeen Lake houseboat, Gulmarg ski chalet, and 24/7 private 4x4 chauffeur concierge.
                      </p>
                      <div className="flex flex-wrap gap-2 pt-2">
                        <span className="text-[11px] bg-white/5 text-white/80 px-2.5 py-1 rounded-lg border border-white/10">
                          Private Shikara Cruise
                        </span>
                        <span className="text-[11px] bg-white/5 text-white/80 px-2.5 py-1 rounded-lg border border-white/10">
                          Gulmarg Gondola Assistance
                        </span>
                        <span className="text-[11px] bg-white/5 text-white/80 px-2.5 py-1 rounded-lg border border-white/10">
                          24/7 Ground SOS Protection
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {stakeholderTab === 'hotels' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex flex-wrap items-center justify-between gap-2 bg-emerald-400/10 border border-emerald-400/20 px-4 py-3 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-emerald-400 text-black font-black text-[10px]">HOSPITALITY CRS & RECEPTION</Badge>
                    <span className="text-xs text-emerald-200">
                      Real-time occupancy grid, seasonal tariff automation & direct B2B voucher settlements
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400">180+ Estates Synced</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10">
                    <span className="text-white/45 text-[11px] uppercase font-bold block mb-1">
                      Live Room Inventory
                    </span>
                    <span className="text-2xl font-black text-white font-mono">Instant CRS Lock</span>
                    <p className="text-[11px] text-white/60 mt-1.5">
                      Prevent double-bookings across Dal Lake houseboats, Gulmarg & Pahalgam resorts.
                    </p>
                  </div>
                  <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10">
                    <span className="text-white/45 text-[11px] uppercase font-bold block mb-1">
                      Seasonal Tariff Rules
                    </span>
                    <span className="text-2xl font-black text-amber-400 font-mono">Dynamic Rates</span>
                    <p className="text-[11px] text-white/60 mt-1.5">
                      Set Winter Snow, Tulip Spring & Peak Summer net slabs in one click.
                    </p>
                  </div>
                  <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10">
                    <span className="text-white/45 text-[11px] uppercase font-bold block mb-1">
                      Reception & Settlement
                    </span>
                    <span className="text-2xl font-black text-emerald-400 font-mono">T+1 Payouts</span>
                    <p className="text-[11px] text-white/60 mt-1.5">
                      One-click voucher confirmation links & automated GST settlement ledger.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {stakeholderTab === 'fleet' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex flex-wrap items-center justify-between gap-2 bg-sky-400/10 border border-sky-400/20 px-4 py-3 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-sky-400 text-black font-black text-[10px] font-mono">CHAUFFEUR & FLEET OS</Badge>
                    <span className="text-xs text-sky-200">
                      Direct route dispatches, snow-chain compliance vault & zero middleman union friction
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-sky-400">650+ Active 4x4 Units</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10">
                    <span className="text-white/45 text-[11px] uppercase font-bold block mb-1">
                      Live Dispatch Cockpit
                    </span>
                    <span className="text-2xl font-black text-white font-mono">SXR & Valley Sync</span>
                    <p className="text-[11px] text-white/60 mt-1.5">
                      Receive instant airport pickups, Gulmarg snow transfers & multi-day itinerary sheets.
                    </p>
                  </div>
                  <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10">
                    <span className="text-white/45 text-[11px] uppercase font-bold block mb-1">
                      Compliance & Safety
                    </span>
                    <span className="text-2xl font-black text-amber-400 font-mono">4x4 Snow Vault</span>
                    <p className="text-[11px] text-white/60 mt-1.5">
                      Digital permit storage, police verification badges & SOS corridor routing.
                    </p>
                  </div>
                  <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10">
                    <span className="text-white/45 text-[11px] uppercase font-bold block mb-1">
                      Guaranteed Earnings
                    </span>
                    <span className="text-2xl font-black text-emerald-400 font-mono">Zero Leakage</span>
                    <p className="text-[11px] text-white/60 mt-1.5">
                      Transparent per-km & day tariffs with direct bank settlements on trip completion.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-white/55 text-center sm:text-left flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
              Free onboarding for recognized travel agencies, heritage hotels, houseboats & 4x4 fleet operators.
            </span>
            <div className="flex flex-wrap items-center gap-2.5">
              {stakeholderTab === 'agencies' && (
                <Button asChild className="bg-amber-400 hover:bg-amber-300 text-black font-black text-xs uppercase px-6 h-11 rounded-xl shadow-lg shadow-amber-400/20">
                  <Link to="/agent" className="flex items-center gap-2">
                    <span>Enter Agency Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              )}
              {stakeholderTab === 'hotels' && (
                <Button asChild className="bg-emerald-400 hover:bg-emerald-300 text-black font-black text-xs uppercase px-6 h-11 rounded-xl shadow-lg shadow-emerald-400/20">
                  <Link to="/hospitality" className="flex items-center gap-2">
                    <span>Open Hotelier CRS Desk</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              )}
              {stakeholderTab === 'fleet' && (
                <Button asChild className="bg-sky-400 hover:bg-sky-300 text-black font-black text-xs uppercase px-6 h-11 rounded-xl shadow-lg shadow-sky-400/20">
                  <Link to="/driver" className="flex items-center gap-2">
                    <span>Open Fleet Cockpit</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              )}
              <Button asChild variant="outline" className="border-white/20 hover:bg-white/10 text-white font-bold text-xs h-11 px-5 rounded-xl">
                <Link to="/vendor">Partner Onboarding</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
