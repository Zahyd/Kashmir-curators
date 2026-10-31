import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, ShieldCheck, Award, CheckCircle2, MapPin, 
  Phone, Mail, Compass, Star, Users, ArrowRight, Clock, Building2
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import FloatingActions from '@/components/layout/FloatingActions';
import { Button } from '@/components/ui/button';
import { useLeadCapture } from '@/contexts/LeadCaptureContext';
import SeoMeta from '@/components/SeoMeta';

export default function About() {
  const { openLeadModal, openCallbackModal } = useLeadCapture();

  return (
    <div className="min-h-screen bg-[#F8F8F9] dark:bg-[#05080a] text-slate-900 dark:text-white flex flex-col font-sans transition-colors duration-300">
      <SeoMeta 
        title="About The Kashmir Curators - Native Luxury Travel Atelier & Direct DMC"
        description="Learn about Kashmir Curators. Hand-crafting bespoke high-altitude luxury expeditions, heritage houseboat retreats on Nigeen Lake, and contracted B2B ground operations since 2012."
      />
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <div className="relative pt-36 pb-20 md:pt-44 md:pb-28 overflow-hidden border-b border-slate-200/80 dark:border-white/5 bg-gradient-to-b from-white via-slate-50 to-[#F8F8F9] dark:from-[#070b0e] dark:via-[#05080a] dark:to-[#05080a]">
          <div className="container mx-auto px-4 sm:px-6 relative z-10 text-center max-w-4xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 dark:bg-white/5 border border-amber-500/20 dark:border-white/10 mb-6 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-800 dark:text-white/80">
                Heritage • Authenticity • Excellence
              </span>
            </div>

            <h1 className="font-display text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight mb-6 leading-[1.08] sm:leading-[1.05] text-[#111439] dark:text-white uppercase">
              ABOUT THE <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 dark:from-amber-400 dark:via-yellow-300 dark:to-amber-500">KASHMIR CURATORS</span>
            </h1>

            <p className="text-slate-600 dark:text-white/60 text-base md:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
              We are a premier luxury travel atelier and direct ground destination management company based in Srinagar, curating transcendent journeys across Jammu & Kashmir since 2012.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs font-semibold text-slate-700 dark:text-white/70">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> J&K Tourism Approved
              </span>
              <span className="hidden sm:inline text-slate-300 dark:text-white/20">•</span>
              <span className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-500" /> IATO & TAAI Certified
              </span>
              <span className="hidden sm:inline text-slate-300 dark:text-white/20">•</span>
              <span className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" /> 4.95 Guest Satisfaction Index
              </span>
            </div>
          </div>
        </div>

        {/* Narrative & Pillars */}
        <div className="container mx-auto px-4 sm:px-6 py-16 md:py-24 max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-24">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-black uppercase tracking-widest">
                <Compass className="w-4 h-4" /> Native Custodians of the Valley
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-[#111439] dark:text-white leading-tight">
                Not Middlemen. <br />
                <span className="text-amber-600 dark:text-amber-400">Direct Valley Ground Execution.</span>
              </h2>
              <p className="text-slate-600 dark:text-white/70 text-sm md:text-base leading-relaxed">
                Most travel agencies outsource their guests to third-party sub-contractors once they arrive at Srinagar Airport. Kashmir Curators operates with dedicated ground assets: our own inspected heritage houseboats on Nigeen Lake, contracted alpine ski chalets in Gulmarg, and a private fleet of snow-chained 4x4 vehicles.
              </p>
              <p className="text-slate-600 dark:text-white/70 text-sm md:text-base leading-relaxed">
                When weather shifts, mountain passes freeze, or flights are rescheduled, our senior operations desk is physically present on-ground to reroute and protect every minute of your holiday.
              </p>

              <div className="pt-4 flex flex-wrap gap-4">
                <Button 
                  onClick={() => openLeadModal({ sourceCta: 'ABOUT_CURATE_TRIP' })}
                  className="rounded-full h-12 px-7 bg-[#111439] dark:bg-amber-400 text-white dark:text-black font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-lg"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-2" />
                  <span>Curate My Kashmir Trip</span>
                </Button>
                <Button
                  onClick={() => openCallbackModal({ sourceCta: 'ABOUT_EXPERT' })}
                  variant="outline"
                  className="rounded-full h-12 px-6 border-slate-300 dark:border-white/20 text-[#111439] dark:text-white font-bold text-xs uppercase tracking-wider"
                >
                  <span>Request Callback</span>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 rounded-3xl bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 shadow-sm space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold text-xl">
                  12+
                </div>
                <h3 className="font-bold text-[#111439] dark:text-white text-base">Years Experience</h3>
                <p className="text-xs text-slate-500 dark:text-white/50">Operating private Kashmir journeys since 2012.</p>
              </div>

              <div className="p-6 rounded-3xl bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 shadow-sm space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-xl">
                  100%
                </div>
                <h3 className="font-bold text-[#111439] dark:text-white text-base">Transparent Pricing</h3>
                <p className="text-xs text-slate-500 dark:text-white/50">Zero hidden union surcharges, permits, or tolls.</p>
              </div>

              <div className="p-6 rounded-3xl bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 shadow-sm space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xl">
                  24/7
                </div>
                <h3 className="font-bold text-[#111439] dark:text-white text-base">SOS Ground Team</h3>
                <p className="text-xs text-slate-500 dark:text-white/50">Direct concierge liaison on speed dial throughout.</p>
              </div>

              <div className="p-6 rounded-3xl bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 shadow-sm space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-xl">
                  400+
                </div>
                <h3 className="font-bold text-[#111439] dark:text-white text-base">B2B Partners</h3>
                <p className="text-xs text-slate-500 dark:text-white/50">Contracted wholesale ground provider for leading Indian travel agents.</p>
              </div>
            </div>
          </div>

          {/* HQ Liaison Section */}
          <div className="p-8 md:p-12 rounded-[2.5rem] bg-white dark:bg-[#0a0f12] border border-slate-200/90 dark:border-white/10 shadow-xl">
            <div className="max-w-2xl mb-8">
              <span className="text-[10px] font-mono tracking-widest text-amber-600 dark:text-amber-400 uppercase font-black">Valley Headquarters</span>
              <h3 className="text-2xl md:text-3xl font-black text-[#111439] dark:text-white mt-1">Official Ground Liaison</h3>
              <p className="text-xs md:text-sm text-slate-500 dark:text-white/60 mt-2">
                Our main administrative headquarters is established in Jammu & Kashmir, with operations units active at Srinagar Airport, Dal Lake, Gulmarg, and Pahalgam.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-start gap-4 p-5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                <MapPin className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-black uppercase text-[#111439] dark:text-white">Registered Office</h4>
                  <p className="text-xs text-slate-600 dark:text-white/60 mt-1 leading-relaxed">
                    Watergam, Rafiabad, Sopore,<br />Jammu & Kashmir 193303
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                <Phone className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-black uppercase text-[#111439] dark:text-white">Direct Concierge Helpline</h4>
                  <a href="tel:+919103798448" className="text-xs text-slate-600 dark:text-white/60 hover:text-amber-600 block mt-1 font-bold">
                    +91 91037 98448
                  </a>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block mt-0.5">Available 24 Hours / 7 Days</span>
                </div>
              </div>

              <div className="flex items-start gap-4 p-5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                <Mail className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-black uppercase text-[#111439] dark:text-white">Official Correspondence</h4>
                  <a href="mailto:Zahidreyaz44123@gmail.com" className="text-xs text-slate-600 dark:text-white/60 hover:text-amber-600 block mt-1 font-bold">
                    Zahidreyaz44123@gmail.com
                  </a>
                  <span className="text-[10px] text-slate-400 dark:text-white/40 block mt-0.5">Average response &lt; 30 mins</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <FloatingActions />
    </div>
  );
}
