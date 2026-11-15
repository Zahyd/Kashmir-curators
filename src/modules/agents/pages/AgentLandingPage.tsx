import React, { useState } from 'react';
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
  ChevronRight,
  Send,
  Sliders,
  DollarSign,
  Check,
  Snowflake,
  ExternalLink,
  MessageSquare,
  HelpCircle,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export const AgentLandingPage: React.FC = () => {
  const [activeProductTab, setActiveProductTab] = useState<'kanban' | 'copilot' | 'quotes' | 'radar'>('kanban');
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

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
          {/* High-Contrast Dual Mode Overlay */}
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

          {/* Headline - Deep Slate in Daylight, Crisp White in Dark Mode */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-display font-black text-slate-950 dark:text-white tracking-tight max-w-5xl mx-auto leading-[1.15]">
            Empower Your Travel Agency with <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-600 dark:from-amber-300 dark:via-amber-400 dark:to-yellow-500 bg-clip-text text-transparent">
              Direct Kashmir Wholesale Tariffs & AI CRM
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-base sm:text-xl text-slate-700 dark:text-slate-300 max-w-3xl mx-auto mt-6 leading-relaxed font-medium">
            Gain direct contracted B2B rates for 5-star Gulmarg ski resorts, heritage Nigeen houseboats, and 1,200+ commercial 4x4 cabs. Build white-label client quotes in 60 seconds with zero middleman markups.
          </p>

          {/* CTAs - Apply routes to Onboarding, Sign in routes to Auth */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8 sm:mt-10">
            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto h-14 px-8 text-base font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-2xl shadow-xl shadow-amber-500/25 transition-all group"
            >
              <Link to="/agent/apply">
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

            <Button
              asChild
              variant="ghost"
              size="lg"
              className="w-full sm:w-auto h-14 px-6 text-sm font-bold text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 rounded-2xl"
            >
              <Link to="/agent/status">
                <span>Track Application Status →</span>
              </Link>
            </Button>
          </div>

          {/* Trust Metric Badges */}
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

      {/* Interactive Product Showcase & Live Dashboard Preview */}
      <section className="py-20 bg-muted/30 border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <Badge variant="outline" className="text-amber-600 dark:text-amber-400 border-amber-500/40 uppercase tracking-widest text-[11px] font-bold px-3 py-1">
              Interactive Platform Preview
            </Badge>
            <h2 className="text-2xl sm:text-4xl font-display font-bold text-foreground mt-3 tracking-tight">
              An All-in-One Operating System for Kashmir Tour Sales
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground mt-3">
              Experience the tools built specifically to solve the chaos of seasonal Kashmir booking operations.
            </p>
          </div>

          {/* Feature Showcase Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-8">
            {[
              { id: 'kanban', label: '8-Stage Sales Kanban', icon: Layers },
              { id: 'copilot', label: 'AI Sales Copilot', icon: Sparkles },
              { id: 'quotes', label: '60s White-Label Quotes', icon: FileSpreadsheet },
              { id: 'radar', label: 'Live Weather & Road Radar', icon: Compass }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeProductTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveProductTab(tab.id as any)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 scale-105'
                      : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content Display Preview Box */}
          <div className="rounded-3xl border border-border bg-card shadow-2xl p-6 sm:p-8 overflow-hidden min-h-[420px] transition-all">
            {activeProductTab === 'kanban' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/70">
                  <div>
                    <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                      <span>Travel Sales Pipeline Kanban</span>
                      <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-[10px] uppercase font-black">
                        Real-Time Sync
                      </Badge>
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Drag-and-drop leads across 8 travel stages from Fresh Inquiry to Post-Trip Review.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                    <span>Active Pipeline Value:</span>
                    <strong className="text-foreground text-sm font-bold">₹14,80,000</strong>
                  </div>
                </div>

                {/* Simulated Columns */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Column 1 */}
                  <div className="bg-muted/40 p-4 rounded-2xl border border-border/80 space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-foreground">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        Fresh Inquiries
                      </span>
                      <Badge variant="secondary" className="text-[10px]">3</Badge>
                    </div>

                    <div className="p-3.5 rounded-xl bg-card border border-border shadow-sm space-y-2 hover:border-amber-500/40 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-foreground">Sharma Family</span>
                        <Badge className="bg-rose-500/15 text-rose-600 dark:text-rose-400 text-[9px] font-black uppercase">
                          🔥 Hot Lead
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground">Gulmarg Ski + Dal Houseboat (5N/6D) • 4 Guests</p>
                      <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[11px]">
                        <span className="font-bold font-mono text-amber-600 dark:text-amber-400">₹1,85,000</span>
                        <span className="text-[10px] text-muted-foreground">Dec 24-29</span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-card border border-border shadow-sm space-y-2 opacity-80">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-foreground">Ananya & Rahul</span>
                        <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[9px] font-black uppercase">
                          Warm
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground">Luxury Honeymoon with Gondola Phase 2</p>
                      <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[11px]">
                        <span className="font-bold font-mono text-amber-600 dark:text-amber-400">₹1,24,000</span>
                        <span className="text-[10px] text-muted-foreground">Jan 10-15</span>
                      </div>
                    </div>
                  </div>

                  {/* Column 2 */}
                  <div className="bg-muted/40 p-4 rounded-2xl border border-border/80 space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-foreground">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-purple-500" />
                        Quote Dispatched
                      </span>
                      <Badge variant="secondary" className="text-[10px]">2</Badge>
                    </div>

                    <div className="p-3.5 rounded-xl bg-card border border-border shadow-sm space-y-2 hover:border-amber-500/40 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-foreground">Dr. Vikram Mehta</span>
                        <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[9px] font-black uppercase">
                          Quote Sent
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground">Pahalgam Aru Retreat + Innova Crysta 4x4</p>
                      <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[11px]">
                        <span className="font-bold font-mono text-amber-600 dark:text-amber-400">₹2,40,000</span>
                        <span className="text-[10px] text-muted-foreground">WhatsApp View</span>
                      </div>
                    </div>
                  </div>

                  {/* Column 3 */}
                  <div className="bg-muted/40 p-4 rounded-2xl border border-border/80 space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-foreground">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        Negotiation & Revisions
                      </span>
                      <Badge variant="secondary" className="text-[10px]">1</Badge>
                    </div>

                    <div className="p-3.5 rounded-xl bg-card border border-border shadow-sm space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-foreground">Rajeshwari Group</span>
                        <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 text-[9px] font-black uppercase">
                          Room Upgrade
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground">Requested 2 Deluxe Houseboat Cedar Suites</p>
                      <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[11px]">
                        <span className="font-bold font-mono text-amber-600 dark:text-amber-400">₹3,95,000</span>
                        <span className="text-[10px] text-muted-foreground">Follow-Up 2h</span>
                      </div>
                    </div>
                  </div>

                  {/* Column 4 */}
                  <div className="bg-muted/40 p-4 rounded-2xl border border-border/80 space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-foreground">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        Confirmed & Booked
                      </span>
                      <Badge variant="secondary" className="text-[10px]">4</Badge>
                    </div>

                    <div className="p-3.5 rounded-xl bg-card border border-emerald-500/30 shadow-sm space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-foreground">Kapoor Corporate Offsite</span>
                        <Badge className="bg-emerald-500 text-white text-[9px] font-black uppercase">
                          Paid 50%
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground">14 Guests • Khyber Gulmarg + 3 Urbanias</p>
                      <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[11px]">
                        <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">₹6,40,000</span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Vouchers Out</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeProductTab === 'copilot' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-between pb-4 border-b border-border/70">
                  <div>
                    <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                      <span>AI Sales Copilot & Dynamic Itinerary Engine</span>
                      <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 text-[10px] uppercase font-black">
                        Instant Generation
                      </Badge>
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Parses raw client WhatsApp messages, checks real hotel room inventory, and drafts sales proposals with margin controls.
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 items-start">
                  {/* Left: Input Inquiry */}
                  <div className="p-5 rounded-2xl bg-muted/40 border border-border/80 space-y-3">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                      Client WhatsApp Query Received
                    </span>
                    <div className="p-4 rounded-xl bg-card border border-border text-xs text-foreground leading-relaxed italic">
                      "Hi! We are a couple planning a 5 nights honeymoon in Kashmir around Dec 20. We want snow in Gulmarg with Gondola tickets, a romantic heated houseboat on Dal Lake, and a private cab throughout. What is the best luxury plan?"
                    </div>

                    <div className="pt-2 flex flex-wrap gap-2 text-[10px] font-semibold">
                      <Badge variant="outline">Couple / Honeymoon</Badge>
                      <Badge variant="outline">Dec 20-25 (Peak Snow)</Badge>
                      <Badge variant="outline">Gulmarg + Dal Lake</Badge>
                      <Badge variant="outline">Gondola Phase 2 required</Badge>
                    </div>
                  </div>

                  {/* Right: AI Output */}
                  <div className="p-5 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        AI Copilot Recommendation
                      </span>
                      <span className="text-[10px] font-mono font-bold text-muted-foreground">Confidence: 98%</span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-card border border-border">
                        <strong>Day 1-2:</strong> Srinagar arrival & Heritage Nigeen Houseboat Cedar Suite (Bukhari heating + Shikara sunset).
                      </div>
                      <div className="p-2.5 rounded-xl bg-card border border-border">
                        <strong>Day 3-4:</strong> Gulmarg 5-Star Ski Chalet + Pre-booked Gondola Phase 1 & 2 morning slot.
                      </div>
                      <div className="p-2.5 rounded-xl bg-card border border-border">
                        <strong>Dedicated Fleet:</strong> Commercial Innova Crysta 4x4 with snow chains and Tangmarg winter driver.
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-card border border-border flex items-center justify-between text-xs">
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Wholesale Net Cost:</span>
                        <span className="font-bold font-mono">₹78,400</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Recommended Client Price (20% margin):</span>
                        <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">₹98,000 (Earn ₹19,600)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeProductTab === 'quotes' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-between pb-4 border-b border-border/70">
                  <div>
                    <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                      <span>60-Second White-Label Quote Builder</span>
                      <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 text-[10px] uppercase font-black">
                        Zero Curators Watermark
                      </Badge>
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Export luxury PDF proposals branded with your agency logo, custom color palette, and direct booking terms.
                    </p>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-muted/30 border border-border flex flex-col md:flex-row items-center justify-between gap-6">
                  {/* Visual Document Mockup */}
                  <div className="w-full md:w-80 p-5 rounded-2xl bg-card border-2 border-border shadow-xl space-y-3 relative">
                    <div className="flex items-center justify-between border-b border-border/60 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-black text-xs">
                          YT
                        </div>
                        <div>
                          <p className="font-bold text-xs text-foreground">Your Agency Name</p>
                          <p className="text-[9px] text-muted-foreground">Certified Tour Operator</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[8px] uppercase">Quotation #841</Badge>
                    </div>

                    <div className="space-y-1.5 py-1">
                      <p className="font-bold text-xs text-foreground">6 Days Magical Kashmir Winter Expedition</p>
                      <p className="text-[10px] text-muted-foreground">Client: Mr. Rajesh & Family • 4 Pax</p>
                    </div>

                    <div className="space-y-1 text-[9px] text-muted-foreground">
                      <p>✓ 2N Srinagar Luxury Houseboat + Breakfast & Dinner</p>
                      <p>✓ 2N Gulmarg Ski Chalet + Gondola Tickets</p>
                      <p>✓ 1N Pahalgam Pine Lodge</p>
                      <p>✓ All Transfers in 4x4 Innova Crysta</p>
                    </div>

                    <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-muted-foreground">Package Total:</span>
                      <span className="text-xs font-black font-mono text-emerald-600 dark:text-emerald-400">₹1,42,000 All-Inclusive</span>
                    </div>
                  </div>

                  {/* Benefit points */}
                  <div className="space-y-4 max-w-md">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-sm text-foreground">Custom Logo & Brand Palette</h4>
                        <p className="text-xs text-muted-foreground">Clients see only your travel company identity. Complete brand ownership.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-sm text-foreground">Automated Net Margin Calculation</h4>
                        <p className="text-xs text-muted-foreground">Set markup by percentage or fixed amount. The quote builder handles taxes and vouchers.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-sm text-foreground">Instant WhatsApp Share Link</h4>
                        <p className="text-xs text-muted-foreground">Dispatches a clean interactive web itinerary and downloadable PDF directly to your client.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeProductTab === 'radar' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-between pb-4 border-b border-border/70">
                  <div>
                    <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                      <span>Live Kashmir Corridor Weather & Road Radar</span>
                      <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-[10px] uppercase font-black">
                        Updated 12m ago
                      </Badge>
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Direct feeds from Traffic Police Jammu & Kashmir, Sinthan Top post, and Gulmarg Gondola authorities.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-card border border-border space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-muted-foreground">NH44 Highway</span>
                      <Badge className="bg-emerald-500 text-white text-[9px] font-black uppercase">Open</Badge>
                    </div>
                    <p className="text-base font-bold text-foreground">Jammu ⇄ Srinagar</p>
                    <p className="text-xs text-muted-foreground">Two-way traffic flowing normally. No major shooting stone delays at Ramban.</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-card border border-border space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-muted-foreground">Gulmarg Road</span>
                      <Badge className="bg-blue-500 text-white text-[9px] font-black uppercase">Chains Req</Badge>
                    </div>
                    <p className="text-base font-bold text-foreground">Tangmarg to Gulmarg</p>
                    <p className="text-xs text-muted-foreground">Snow on road between km 8 and 12. 4x4 vehicles only with anti-skid chains.</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-card border border-border space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-muted-foreground">Gondola Cable Car</span>
                      <Badge className="bg-emerald-500 text-white text-[9px] font-black uppercase">Phase 1 & 2 Clear</Badge>
                    </div>
                    <p className="text-base font-bold text-foreground">Kongdoori & Apharwat</p>
                    <p className="text-xs text-muted-foreground">Wind speed 14 km/h. Both phases operating smoothly. Clear visibility.</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-card border border-border space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-muted-foreground">Sinthan & Mughal Pass</span>
                      <Badge className="bg-amber-500 text-slate-950 text-[9px] font-black uppercase">One-Way</Badge>
                    </div>
                    <p className="text-base font-bold text-foreground">Kishtwar / Rajouri Route</p>
                    <p className="text-xs text-muted-foreground">Subject to morning frost clearance. Scheduled convoy movements.</p>
                  </div>
                </div>
              </div>
            )}
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
              <span>Up to 15-20% net margins</span>
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
              Generate PDF customer itineraries branded with your agency logo, primary brand colors, and direct contact info in under 60 seconds.
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

      {/* Trusted Kashmir Supply Network Showcase */}
      <section className="py-20 bg-muted/20 border-y border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <Badge variant="outline" className="text-primary border-primary/40 uppercase tracking-widest text-[11px] font-bold px-3 py-1">
              Direct Supply Network
            </Badge>
            <h2 className="text-2xl sm:text-4xl font-display font-bold text-foreground mt-3 tracking-tight">
              Exclusive Access to Kashmir’s Premier Inventory
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground mt-3">
              We eliminate brokers by holding direct, locked annual allocations across the valley’s most sought-after properties and fleets.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Supply Item 1 */}
            <div className="rounded-3xl bg-card border border-border/80 overflow-hidden shadow-lg group hover:border-amber-500/40 transition-all">
              <div className="h-48 bg-slate-800 relative overflow-hidden">
                <img 
                  src="/images/hotels/hotel_1.png" 
                  alt="Gulmarg 5-Star Ski Chalets" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e: any) => { e.target.src = '/images/planner_hero.png'; }}
                />
                <div className="absolute top-3 left-3">
                  <Badge className="bg-slate-950/80 backdrop-blur-md text-white text-[10px] uppercase font-bold">
                    Gulmarg Snow Corridor
                  </Badge>
                </div>
              </div>
              <div className="p-6 space-y-3">
                <h3 className="font-bold text-lg text-foreground">5-Star Ski Chalets & Mountain Lodges</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Locked room blocks at prime Gulmarg ski properties, heated cottages, and slopeside retreats. Guaranteed bookings even during high-peak December & January.
                </p>
                <div className="pt-2 flex items-center justify-between text-xs font-semibold text-amber-600 dark:text-amber-400">
                  <span>Direct Contracted Net B2B Rates</span>
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Supply Item 2 */}
            <div className="rounded-3xl bg-card border border-border/80 overflow-hidden shadow-lg group hover:border-amber-500/40 transition-all">
              <div className="h-48 bg-slate-800 relative overflow-hidden">
                <img 
                  src="/images/hotels/hotel_2.png" 
                  alt="Heritage Nigeen Houseboats" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e: any) => { e.target.src = '/images/planner_hero.png'; }}
                />
                <div className="absolute top-3 left-3">
                  <Badge className="bg-slate-950/80 backdrop-blur-md text-white text-[10px] uppercase font-bold">
                    Dal & Nigeen Waters
                  </Badge>
                </div>
              </div>
              <div className="p-6 space-y-3">
                <h3 className="font-bold text-lg text-foreground">Heritage Dal & Nigeen Houseboats</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Authentic hand-carved cedarwood floating suites with central heating/Bukhari stoves, traditional Kashmiri Wazwan dining, and private Shikara transfers.
                </p>
                <div className="pt-2 flex items-center justify-between text-xs font-semibold text-amber-600 dark:text-amber-400">
                  <span>Exclusive Family & Honeymoon Wings</span>
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Supply Item 3 */}
            <div className="rounded-3xl bg-card border border-border/80 overflow-hidden shadow-lg group hover:border-amber-500/40 transition-all">
              <div className="h-48 bg-slate-800 relative overflow-hidden">
                <img 
                  src="/images/cabs/cab_innova.png" 
                  alt="Commercial 4x4 Fleet" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e: any) => { e.target.src = '/images/planner_hero.png'; }}
                />
                <div className="absolute top-3 left-3">
                  <Badge className="bg-slate-950/80 backdrop-blur-md text-white text-[10px] uppercase font-bold">
                    All-Weather Fleet
                  </Badge>
                </div>
              </div>
              <div className="p-6 space-y-3">
                <h3 className="font-bold text-lg text-foreground">1,200+ Commercial 4x4 Cab Fleet</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Innova Crysta, Fortuner, and Force Urbania vehicles with yellow commercial plates, snow chains, valid tourist route permits, and vetted Kashmiri drivers.
                </p>
                <div className="pt-2 flex items-center justify-between text-xs font-semibold text-amber-600 dark:text-amber-400">
                  <span>Zero-Cancellation Replacement Guarantee</span>
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works (4 Steps) */}
      <section className="py-20 border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="outline" className="text-primary border-primary/40 uppercase tracking-widest text-[11px] font-bold px-3 py-1">
              Agency Journey
            </Badge>
            <h2 className="text-2xl sm:text-4xl font-display font-bold text-foreground mt-3 tracking-tight">
              Start Booking Kashmir in 4 Simple Steps
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              From application submission to closing high-margin client bookings.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            <div className="p-6 rounded-3xl bg-card border border-border/80 relative space-y-3 shadow-sm">
              <span className="w-10 h-10 rounded-2xl bg-primary text-primary-foreground font-black flex items-center justify-center text-base shadow-sm">
                1
              </span>
              <h3 className="text-lg font-bold text-foreground">Submit Agency Profile</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Fill in your agency details, representative contact, and chosen plan. Zero immediate payment required.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-card border border-border/80 relative space-y-3 shadow-sm">
              <span className="w-10 h-10 rounded-2xl bg-primary text-primary-foreground font-black flex items-center justify-center text-base shadow-sm">
                2
              </span>
              <h3 className="text-lg font-bold text-foreground">Desk Verification</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Our Srinagar team verifies your credentials (J&K Tourism or state GSTIN) within 24 to 48 hours.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-card border border-border/80 relative space-y-3 shadow-sm">
              <span className="w-10 h-10 rounded-2xl bg-primary text-primary-foreground font-black flex items-center justify-center text-base shadow-sm">
                3
              </span>
              <h3 className="text-lg font-bold text-foreground">Unlock Wholesale Rates</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Access contracted net tariffs across Gulmarg, Dal Lake, Pahalgam, and 1,200+ guaranteed commercial cabs.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-card border border-border/80 relative space-y-3 shadow-sm">
              <span className="w-10 h-10 rounded-2xl bg-primary text-primary-foreground font-black flex items-center justify-center text-base shadow-sm">
                4
              </span>
              <h3 className="text-lg font-bold text-foreground">Dispatch & Earn</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Send branded white-label PDF itineraries to your clients and collect payment with zero commission clawbacks.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Transparent Membership Plans Section */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <Badge variant="outline" className="text-amber-600 dark:text-amber-400 border-amber-500/40 uppercase tracking-widest text-[11px] font-bold px-3 py-1">
            Membership Plans
          </Badge>
          <h2 className="text-2xl sm:text-4xl font-display font-bold text-foreground mt-3 tracking-tight">
            Transparent Travel Technology Plans
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground mt-3">
            Every plan includes our 60s quote builder. Upgrade for AI Copilot, custom white-labeling, and contracted net rates.
          </p>

          {/* Toggle */}
          <div className="mt-8 inline-flex items-center p-1.5 rounded-2xl bg-muted/70 border border-border/80 shadow-inner">
            <button
              onClick={() => setBillingCycle('MONTHLY')}
              className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                billingCycle === 'MONTHLY'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('ANNUAL')}
              className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
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

        <div className="grid md:grid-cols-3 gap-8 items-stretch mb-10">
          {/* Starter Plan */}
          <div className="rounded-3xl p-8 border border-border/80 bg-card/60 shadow-lg flex flex-col justify-between space-y-6">
            <div>
              <h3 className="text-2xl font-display font-extrabold text-foreground">Starter Partner</h3>
              <p className="text-xs text-muted-foreground mt-1">For independent travel advisors and solo planners</p>
              <div className="mt-6 pb-6 border-b border-border/60">
                <span className="text-4xl font-mono font-black text-foreground">₹0</span>
                <span className="text-xs font-semibold text-muted-foreground ml-1">Free Forever</span>
              </div>
              <ul className="mt-6 space-y-2.5 text-xs text-foreground">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0" /> Up to 10 CRM leads / month</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0" /> Standard PDF quote export</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0" /> Public tariff availability view</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0" /> Road radar advisory alerts</li>
              </ul>
            </div>
            <Button asChild variant="outline" className="w-full h-12 rounded-xl font-bold text-xs border-border">
              <Link to="/agent/apply?plan=starter">Apply with Starter</Link>
            </Button>
          </div>

          {/* Professional Plan */}
          <div className="rounded-3xl p-8 border-2 border-amber-500 bg-card shadow-2xl shadow-amber-500/10 flex flex-col justify-between space-y-6 relative scale-100 md:scale-105 z-10">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-md">
              Most Popular
            </div>
            <div>
              <h3 className="text-2xl font-display font-extrabold text-foreground">Professional DMC</h3>
              <p className="text-xs text-muted-foreground mt-1">For established agencies scaling high-margin volume</p>
              <div className="mt-6 pb-6 border-b border-border/60">
                <span className="text-4xl font-mono font-black text-foreground">
                  {billingCycle === 'ANNUAL' ? '₹2,399' : '₹2,999'}
                </span>
                <span className="text-xs font-semibold text-muted-foreground ml-1">/ month</span>
                {billingCycle === 'ANNUAL' && (
                  <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1">₹28,790 / year (save 20%)</p>
                )}
              </div>
              <ul className="mt-6 space-y-2.5 text-xs text-foreground">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0" /> Unlimited CRM leads & 8-stage Kanban</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0" /> AI Sales Copilot & 60s auto-pricing</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0" /> Full White-Label (agency logo, zero watermark)</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0" /> Direct wholesale net rates (5-star hotels & cabs)*</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0" /> 3 Team Agent Seats included</li>
              </ul>
            </div>
            <Button asChild className="w-full h-12 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20">
              <Link to="/agent/apply?plan=professional">Apply with Professional</Link>
            </Button>
          </div>

          {/* Enterprise Plan */}
          <div className="rounded-3xl p-8 border border-border/80 bg-card/60 shadow-lg flex flex-col justify-between space-y-6">
            <div>
              <h3 className="text-2xl font-display font-extrabold text-foreground">Enterprise Network</h3>
              <p className="text-xs text-muted-foreground mt-1">For multi-branch companies and large tour consolidators</p>
              <div className="mt-6 pb-6 border-b border-border/60">
                <span className="text-4xl font-mono font-black text-foreground">
                  {billingCycle === 'ANNUAL' ? '₹6,399' : '₹7,999'}
                </span>
                <span className="text-xs font-semibold text-muted-foreground ml-1">/ month</span>
                {billingCycle === 'ANNUAL' && (
                  <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1">₹76,790 / year (save 20%)</p>
                )}
              </div>
              <ul className="mt-6 space-y-2.5 text-xs text-foreground">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0" /> Unlimited team seats & granular RBAC</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0" /> Dedicated Srinagar Key Account Manager</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0" /> Net 15-day supplier credit terms*</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0" /> Custom domain client portal (quotes.agency.com)</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0" /> Direct XML/REST inventory API feed</li>
              </ul>
            </div>
            <Button asChild variant="outline" className="w-full h-12 rounded-xl font-bold text-xs border-border">
              <Link to="/agent/apply?plan=enterprise">Apply with Enterprise</Link>
            </Button>
          </div>
        </div>

        <div className="text-center">
          <Link to="/agent/pricing" className="inline-flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline">
            <span>View detailed side-by-side feature comparison table</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
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
            <Link to="/agent/apply">
              Apply Now
            </Link>
          </Button>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section className="py-20 bg-muted/20 border-t border-border/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge variant="outline" className="text-primary border-primary/40 uppercase tracking-widest text-[11px] font-bold px-3 py-1">
              B2B FAQs
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground mt-3 tracking-tight">
              Got Questions? We Have Answers.
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "Do I have to pay anything immediately when clicking Apply?",
                a: "No. Clicking 'Apply for B2B Agency Access' guides you through business registration and credential verification with zero immediate charge. Billing is reviewed and confirmed only once your account is verified by our Srinagar Operations Desk."
              },
              {
                q: "How long does agency verification take?",
                a: "Our compliance team reviews applications within 24 to 48 business hours. You will receive an official notification via WhatsApp and email once verified."
              },
              {
                q: "Can out-of-state agencies (Delhi, Mumbai, Gujarat, Bangalore) register?",
                a: "Yes! Over 60% of our active B2B partners are based outside Jammu & Kashmir. You can register using your state GSTIN and business trade license."
              },
              {
                q: "How do white-label quotations work?",
                a: "In the Professional and Enterprise plans, exported client itineraries feature your agency logo, primary brand color, and phone number. Kashmir Curators branding is completely removed so you maintain 100% brand ownership."
              },
              {
                q: "What happens if snow closes the Gulmarg road or Gondola?",
                a: "Our Srinagar Ground Desk monitors the Live Road Radar 24/7. In case of road closures, our local fleet of commercial 4x4 vehicles with snow chains takes over automatically, and our operations concierge assists with date or itinerary adjustments."
              }
            ].map((faq, idx) => (
              <div 
                key={idx}
                className="rounded-2xl border border-border bg-card overflow-hidden transition-all"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-5 text-left font-bold text-sm text-foreground flex items-center justify-between hover:bg-muted/30 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${openFaq === idx ? 'rotate-90' : ''}`} />
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t border-border/40">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
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
              <Link to="/agent/apply">
                Apply for B2B Agency Access
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
            <Button
              asChild
              variant="ghost"
              size="lg"
              className="w-full sm:w-auto h-14 px-6 text-sm font-bold text-slate-300 hover:text-white rounded-2xl"
            >
              <Link to="/agent/status">
                Track Application
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
