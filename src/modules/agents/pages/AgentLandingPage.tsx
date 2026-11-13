import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  FileSpreadsheet, 
  Car, 
  Compass, 
  TrendingUp, 
  Award, 
  Users, 
  Star, 
  Zap, 
  PhoneCall, 
  Lock,
  Layers,
  Clock,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export const AgentLandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-amber-500 selection:text-black">
      <Navbar />

      {/* Hero Section with Adaptive Daylight & Dark Alpine Background */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden border-b border-border/40">
        {/* Background Image & Contrast Filter */}
        <div 
          className="absolute inset-0 bg-cover bg-center -z-10 scale-105 transition-transform duration-1000"
          style={{ backgroundImage: "url('/images/planner_hero.png')" }}
        >
          {/* High-Contrast Dual Mode Overlay: Crisp frosted daylight in light mode, deep alpine twilight in dark mode */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/95 via-white/85 to-background dark:from-slate-950/90 dark:via-slate-950/95 dark:to-background backdrop-blur-[2px]" />
        </div>

        {/* Ambient Subtle Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[20rem] bg-amber-500/10 dark:bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          
          {/* Top Pill - High Contrast */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/15 dark:bg-amber-500/20 border border-amber-500/40 text-amber-900 dark:text-amber-300 text-xs sm:text-sm font-bold mb-6 animate-fade-in shadow-sm">
            <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Official Jammu & Kashmir B2B Destination Management Company (DMC)</span>
          </div>

          {/* Headline - Deep Navy/Slate in Daylight, Crisp White in Dark Mode */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-display font-black text-slate-950 dark:text-white tracking-tight max-w-5xl mx-auto leading-[1.15]">
            Empower Your Travel Agency with <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-600 dark:from-amber-300 dark:via-amber-400 dark:to-yellow-500 bg-clip-text text-transparent">
              Direct Kashmir Wholesale Tariffs
            </span>
          </h1>

          {/* Subheading - High Legibility in Both Modes */}
          <p className="text-base sm:text-xl text-slate-700 dark:text-slate-300 max-w-3xl mx-auto mt-6 leading-relaxed font-medium">
            Gain direct contracted B2B rates for 5-star Gulmarg ski resorts, heritage Nigeen houseboats, and 1,200+ commercial 4x4 cabs. Build white-label client quotes in 60 seconds with zero middleman markups.
          </p>

          {/* Dual Action CTAs - High Contrast in Daylight & Dark */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8 sm:mt-10">
            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto h-14 px-8 text-base font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-2xl shadow-xl shadow-amber-500/25 transition-all group"
            >
              <Link to="/auth?mode=signup&redirect=/agent">
                <span>Apply for B2B Agency Access</span>
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full sm:w-auto h-14 px-8 text-base font-bold border-slate-300 dark:border-white/20 bg-white/95 dark:bg-white/10 hover:bg-slate-100 dark:hover:bg-white/20 text-slate-900 dark:text-white rounded-2xl shadow-md backdrop-blur-md transition-all"
            >
              <Link to="/auth?mode=login&redirect=/agent">
                <span>Partner Agent Sign In</span>
              </Link>
            </Button>
          </div>

          {/* Trust Metric Badges - High Contrast in Daylight */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mt-14 pt-8 border-t border-slate-200/80 dark:border-white/10 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-semibold">
            <div className="flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>J&K Tourism Registered</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>60s Branded Quotations</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Car className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>1,200+ Guaranteed 4x4 Cabs</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Lock className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
              <span>Secured by Neon Better Auth</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Core Wholesale Value Pillars */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="outline" className="text-amber-600 dark:text-amber-400 border-amber-500/40 uppercase tracking-widest text-[11px] font-bold px-3 py-1">
            B2B Advantage
          </Badge>
          <h2 className="text-2xl sm:text-4xl font-display font-bold text-foreground mt-3 tracking-tight">
            Built Exclusively for Ambitious Travel Agents & DMCs
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground mt-3">
            Say goodbye to unreliable local brokers and slow quoting processes. Run your entire Kashmir operation through a unified digital command desk.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div className="p-6 rounded-3xl border border-border/80 bg-card hover:border-amber-500/50 hover:shadow-xl transition-all space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-foreground">Direct Wholesale Stays</h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Contracted wholesale allocations in Gulmarg ski chalets, Dal Lake luxury houseboats, and Pahalgam riverfront resorts. Net tariffs with zero commission clawbacks.
            </p>
            <div className="pt-2 text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <span>Up to 15% net margins</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-3xl border border-border/80 bg-card hover:border-emerald-500/50 hover:shadow-xl transition-all space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-foreground">White-Label Quote Builder</h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Generate PDF customer itineraries branded with your agency logo, primary brand colors, and direct contact info in under a minute.
            </p>
            <div className="pt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <span>Professional PDF export</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-3xl border border-border/80 bg-card hover:border-blue-500/50 hover:shadow-xl transition-all space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Car className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-foreground">Verified Transport Fleet</h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              1,200+ commercial 4x4 Fortuners, Innova Crystas, and Urbania coaches with verified background-checked drivers, valid permits, and snow chains.
            </p>
            <div className="pt-2 text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
              <span>Zero cancellation guarantee</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 4 */}
          <div className="p-6 rounded-3xl border border-border/80 bg-card hover:border-purple-500/50 hover:shadow-xl transition-all space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-foreground">Corridor Weather Radar</h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Real-time road status for NH44 Jammu-Srinagar Highway, Sinthan Top, Mughal Road, and Gulmarg Gondola phase clearance sent straight to your CRM.
            </p>
            <div className="pt-2 text-xs font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1">
              <span>24/7 ground coordination</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works (3 Steps) */}
      <section className="py-20 bg-muted/40 border-y border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="outline" className="text-primary border-primary/40 uppercase tracking-widest text-[11px] font-bold px-3 py-1">
              Workflow
            </Badge>
            <h2 className="text-2xl sm:text-4xl font-display font-bold text-foreground mt-3 tracking-tight">
              Start Booking Kashmir in 3 Simple Steps
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-card border border-border/80 relative space-y-4 shadow-sm">
              <span className="w-10 h-10 rounded-2xl bg-primary text-primary-foreground font-black flex items-center justify-center text-lg shadow-sm">
                1
              </span>
              <h3 className="text-xl font-bold text-foreground">Create Agency Profile</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Sign up with your business email. Upload your J&K Tourism registration or GST certificate to unlock wholesale tier pricing.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-card border border-border/80 relative space-y-4 shadow-sm">
              <span className="w-10 h-10 rounded-2xl bg-primary text-primary-foreground font-black flex items-center justify-center text-lg shadow-sm">
                2
              </span>
              <h3 className="text-xl font-bold text-foreground">Browse Locked Tariffs</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Access real-time room allotments and locked seasonal cab pricing across Srinagar, Gulmarg, Pahalgam, and Sonamarg.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-card border border-border/80 relative space-y-4 shadow-sm">
              <span className="w-10 h-10 rounded-2xl bg-primary text-primary-foreground font-black flex items-center justify-center text-lg shadow-sm">
                3
              </span>
              <h3 className="text-xl font-bold text-foreground">Dispatch & Earn</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Send branded white-label PDF itineraries to your clients and collect payment. We manage flawless on-ground delivery.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* J&K Tourism Compliance Callout */}
      <section className="py-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="p-8 sm:p-10 rounded-3xl border border-amber-500/30 bg-amber-500/10 dark:bg-amber-500/5 flex flex-col md:flex-row items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 text-amber-600 dark:text-amber-400">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div className="space-y-2 text-center md:text-left flex-1">
            <h3 className="text-xl font-bold text-foreground">Official J&K Tourism Regulatory Compliance</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              All B2B partners on Kashmir Curators operate in full accordance with the Jammu & Kashmir Registration of Tourist Trade Act. Unlicensed entities must submit valid accreditation documents within 30 days of registration.
            </p>
          </div>
          <Button
            asChild
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 h-12 rounded-xl shrink-0 shadow-md shadow-amber-500/20"
          >
            <Link to="/auth?mode=signup&redirect=/agent">
              Apply Now
            </Link>
          </Button>
        </div>
      </section>

      {/* Closing Call to Action */}
      <section className="py-20 bg-slate-900 dark:bg-slate-950 text-white border-t border-border/40 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 relative z-10 space-y-6">
          <h2 className="text-3xl sm:text-5xl font-display font-extrabold tracking-tight text-white">
            Ready to Scale Your Kashmir Tour Business?
          </h2>
          <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto font-medium">
            Join 500+ travel operators who trust Kashmir Curators for wholesale ground handling and automated quoting.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto h-14 px-8 text-base font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-2xl shadow-xl shadow-amber-500/20"
            >
              <Link to="/auth?mode=signup&redirect=/agent">
                Create Free B2B Account
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full sm:w-auto h-14 px-8 text-base font-bold border-white/30 bg-white/10 hover:bg-white/20 text-white rounded-2xl"
            >
              <Link to="/auth?mode=login&redirect=/agent">
                Partner Sign In
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AgentLandingPage;
