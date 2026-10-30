import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, ShieldAlert, Sparkles, FileText, CheckCircle2, 
  ArrowRight, ShieldCheck, Download, ExternalLink, Percent, 
  Car, BedDouble, Compass, Users2, Landmark, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function B2BPartnerSection() {
  const [previewMode, setPreviewMode] = useState<'agent' | 'client'>('agent');

  return (
    <section className="py-28 bg-[#030608] text-white relative overflow-hidden border-y border-white/5">
      {/* Background Ambience */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-amber-500/10 blur-[160px] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-emerald-500/10 blur-[180px] pointer-events-none rounded-full" />

      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 text-xs font-bold tracking-widest uppercase mb-5">
            <Building2 className="w-3.5 h-3.5" />
            <span>Kashmir Connect B2B Travel Operating System</span>
          </div>
          <h2 className="font-display text-4xl md:text-6xl font-black tracking-tight leading-tight mb-6">
            Powering 400+ Travel Agents <br className="hidden md:block" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-amber-200 to-emerald-400">
              With Direct Kashmir Ground Supply
            </span>
          </h2>
          <p className="text-white/60 text-lg md:text-xl font-medium leading-relaxed">
            Stop losing bookings to opaque cab unions and sudden road disruptions. Access contracted wholesale net rates, build white-label client proposals in 90 seconds, and deliver 24/7 on-ground execution.
          </p>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <div className="p-7 rounded-3xl bg-white/[0.03] border border-white/10 hover:border-amber-400/40 transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-400 mb-5">
              <Landmark className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Contracted B2B Net Rates</h3>
            <p className="text-sm text-white/50 leading-relaxed mb-4">
              Wholesale tariffs for Dal Lake houseboats, Gulmarg ski chalets, and private 4x4 snow fleets. Zero broker markups.
            </p>
            <span className="text-[11px] font-semibold text-amber-400/90 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" /> Locked seasonal pricing
            </span>
          </div>

          <div className="p-7 rounded-3xl bg-white/[0.03] border border-white/10 hover:border-emerald-400/40 transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl bg-emerald-400/15 border border-emerald-400/30 flex items-center justify-center text-emerald-400 mb-5">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">White-Label Quote Studio</h3>
            <p className="text-sm text-white/50 leading-relaxed mb-4">
              Create day-wise custom itineraries with your agency logo, phone, and custom markup in under 90 seconds.
            </p>
            <span className="text-[11px] font-semibold text-emerald-400/90 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" /> PDF & Web share link
            </span>
          </div>

          <div className="p-7 rounded-3xl bg-white/[0.03] border border-white/10 hover:border-cyan-400/40 transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl bg-cyan-400/15 border border-cyan-400/30 flex items-center justify-center text-cyan-400 mb-5">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Ground Disruption Shield</h3>
            <p className="text-sm text-white/50 leading-relaxed mb-4">
              Real-time Sonamarg/Zojila snowfall radar. 1-click alternative rerouting (Doodhpathri, Yusmarg) so clients never get stranded.
            </p>
            <span className="text-[11px] font-semibold text-cyan-400/90 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" /> 100% Flex trip protection
            </span>
          </div>

          <div className="p-7 rounded-3xl bg-white/[0.03] border border-white/10 hover:border-purple-400/40 transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl bg-purple-400/15 border border-purple-400/30 flex items-center justify-center text-purple-400 mb-5">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Instant Vouchers & Credit</h3>
            <p className="text-sm text-white/50 leading-relaxed mb-4">
              Automated hotel vouchers and cab duty slips with driver contact and vehicle numbers dispatched immediately upon booking.
            </p>
            <span className="text-[11px] font-semibold text-purple-400/90 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" /> GST invoice generator
            </span>
          </div>
        </div>

        {/* Interactive Workspace Live Preview Card */}
        <div className="max-w-4xl mx-auto rounded-3xl bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-white/15 p-6 md:p-8 shadow-2xl relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
            <div>
              <span className="text-[10px] font-mono tracking-widest text-amber-400 uppercase font-black">Live Feature Simulation</span>
              <h4 className="text-xl font-bold text-white mt-1">Interactive Proposal Generator</h4>
            </div>

            {/* Toggle Switch */}
            <div className="flex items-center gap-1 bg-black/60 p-1.5 rounded-2xl border border-white/10">
              <button
                type="button"
                onClick={() => setPreviewMode('agent')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  previewMode === 'agent'
                    ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                1. Agent Workspace (Net Cost)
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('client')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  previewMode === 'client'
                    ? 'bg-emerald-400 text-black shadow-lg shadow-emerald-400/20'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                2. Client View (White-Label)
              </button>
            </div>
          </div>

          {/* Dynamic Interactive Body */}
          <div className="py-6">
            {previewMode === 'agent' ? (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between bg-amber-400/10 border border-amber-400/20 px-4 py-3 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-amber-400 text-black font-black text-[10px]">INTERNAL DMC LEDGER</Badge>
                    <span className="text-xs text-amber-200">Wholesale ground pricing locked with local Kashmir suppliers</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-400">AGT-ID: 7701</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10">
                    <span className="text-white/40 text-[11px] uppercase font-bold block mb-1">Wholesale Ground Net</span>
                    <span className="text-2xl font-black text-white font-mono">₹38,500</span>
                    <span className="text-[11px] text-emerald-400 block mt-1">✓ 5N/6D Hotels, 4x4 Cab & Shikara</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10">
                    <span className="text-white/40 text-[11px] uppercase font-bold block mb-1">Your Agency Margin</span>
                    <span className="text-2xl font-black text-amber-400 font-mono">+ ₹8,000</span>
                    <span className="text-[11px] text-white/50 block mt-1">Configurable markup slider (15-25%)</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10">
                    <span className="text-white/40 text-[11px] uppercase font-bold block mb-1">Final Quoted To Client</span>
                    <span className="text-2xl font-black text-emerald-400 font-mono">₹46,500</span>
                    <span className="text-[11px] text-white/50 block mt-1">Gross retail price with GST invoice</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Car className="w-5 h-5 text-amber-400" />
                    <div>
                      <p className="text-xs font-bold text-white">Toyota Innova Crysta (All-Weather Snow Fleet)</p>
                      <p className="text-[11px] text-white/50">Airport pickup, Gulmarg snow chain clearance & Pahalgam Lidder valley</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-amber-400/40 text-amber-400 text-xs">Direct Driver Sync</Badge>
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between bg-emerald-400/10 border border-emerald-400/20 px-4 py-3 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-emerald-400 text-black font-black text-[10px]">WHITE-LABEL BRANDED</Badge>
                    <span className="text-xs text-emerald-200">Zero Kashmir Connect branding — Displays your travel agency brand</span>
                  </div>
                  <span className="text-xs font-semibold text-white/70">Agency: <strong>Royal Voyages, Mumbai</strong></span>
                </div>

                <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="text-base font-bold text-white">6D/5N Kashmir Winter Wonderland Expedition</h5>
                    <span className="text-xl font-black text-amber-400 font-mono">₹46,500 <span className="text-xs text-white/50 font-normal">/ Couple</span></span>
                  </div>
                  <p className="text-xs text-white/60">
                    Specially prepared for <strong>Dr. & Mrs. Malhotra</strong> • Verified luxury stay, private heated houseboat on Nigeen Lake, and chauffeur concierge.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <span className="text-[11px] bg-white/5 text-white/80 px-2.5 py-1 rounded-lg border border-white/10">Private Shikara Cruise</span>
                    <span className="text-[11px] bg-white/5 text-white/80 px-2.5 py-1 rounded-lg border border-white/10">Gulmarg Gondola Assistance</span>
                    <span className="text-[11px] bg-white/5 text-white/80 px-2.5 py-1 rounded-lg border border-white/10">24/7 Ground SOS Protection</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-1">
                  <span className="text-xs text-white/50 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Agency Contact: +91 98200 45678
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-white/50 text-center sm:text-left">
              Free onboarding for recognized travel agencies, tour operators & freelance planners.
            </span>
            <div className="flex items-center gap-3">
              <Button asChild className="bg-amber-400 hover:bg-amber-300 text-black font-black text-xs uppercase px-6 py-5 rounded-2xl shadow-lg shadow-amber-400/20">
                <Link to="/agent" className="flex items-center gap-2">
                  <span>Enter Agent Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
