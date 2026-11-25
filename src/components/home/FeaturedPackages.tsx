import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Star, MapPin, ArrowRight, Sparkles, TrendingUp,
  Eye, CheckCircle2, ShieldCheck, MessageCircle, Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useFeaturedPackages } from '@/hooks/useCMSData';
import { useLandingPageContent } from '@/hooks/useLandingPageContent';
import { Badge } from '@/components/ui/badge';
import { useLeadCapture } from '@/contexts/LeadCaptureContext';
import { useCurrency, SUPPORTED_CURRENCIES, CurrencyCode } from '@/contexts/CurrencyContext';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
import srinagarImg from '@/assets/kashmir-hero-new.jpg';
import gulmargImg from '@/assets/gulmarg.jpg';
import pahalgamImg from '@/assets/pahalgam.jpg';

const FALLBACK_PACKAGES = [
  {
    id: 'signature-dal-gulmarg',
    name: 'Royal Dal Houseboat & Gulmarg Alpine Retreat',
    destination: 'Srinagar • Gulmarg',
    duration: '5 Nights / 6 Days',
    price: 28500,
    rating: 4.96,
    reviewCount: 48,
    image: srinagarImg,
  },
  {
    id: 'alpine-powder-expedition',
    name: 'Gulmarg Gondola Phase 2 & Pine Chalet Escape',
    destination: 'Gulmarg • Doodhpathri',
    duration: '4 Nights / 5 Days',
    price: 34000,
    rating: 4.98,
    reviewCount: 36,
    image: gulmargImg,
  },
  {
    id: 'lidder-shepherd-sanctuary',
    name: 'Pahalgam Lidder Riverside & Aru Valley Circuit',
    destination: 'Pahalgam • Srinagar',
    duration: '5 Nights / 6 Days',
    price: 26500,
    rating: 4.94,
    reviewCount: 52,
    image: pahalgamImg,
  },
  {
    id: 'grand-five-valleys',
    name: 'Grand 5-Valley Signature Kashmir Portfolio',
    destination: 'Srinagar • Gulmarg • Sonamarg • Doodhpathri',
    duration: '7 Nights / 8 Days',
    price: 46500,
    rating: 4.99,
    reviewCount: 64,
    image: 'https://images.unsplash.com/photo-1595932594611-6beec02f61aa?w=900',
  },
];

export default function FeaturedPackages() {
  const navigate = useNavigate();
  const { data: cmsPackages = [], isLoading } = useFeaturedPackages();
  const { content, featuredPackagesSection } = useLandingPageContent();
  const { openLeadModal, openWhatsAppLead } = useLeadCapture();
  const { currency, setCurrency, formatPrice } = useCurrency();
  const [quickPeekPackage, setQuickPeekPackage] = useState<any>(null);

  const meta = (content as any)?.featuredPackagesSection || {};
  const badgeText = meta.badge || featuredPackagesSection?.badgeText || 'Seasonal Selections';
  const headingText = meta.heading || featuredPackagesSection?.title || 'Private Collections';
  const descriptionText =
    meta.description ||
    featuredPackagesSection?.subtitle ||
    'Exclusive itineraries engineered for transparent pricing, audited stays, and perfection across every mountain mile.';

  const featuredPackages =
    Array.isArray(cmsPackages) && cmsPackages.length > 0 ? cmsPackages : FALLBACK_PACKAGES;

  return (
    <section className="py-16 md:py-28 bg-[#F8F8F9] dark:bg-[#05080a] relative overflow-hidden transition-colors border-t border-slate-200/60 dark:border-white/5">
      <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-amber-400/10 blur-[140px] -ml-64 -translate-y-1/2 pointer-events-none" />
      <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-purple-400/10 blur-[140px] -mr-64 -translate-y-1/2 pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 relative z-10 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-14 animate-fade-up">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm mb-5">
              <TrendingUp className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#111439] dark:text-white">
                {badgeText}
              </span>
            </div>
            <h2 className="font-display text-3xl sm:text-5xl md:text-6xl font-black text-[#111439] dark:text-white leading-tight tracking-tight">
              {headingText.includes(' ') ? (
                <>
                  {headingText.split(' ').slice(0, -1).join(' ')}{' '}
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-600 via-amber-500 to-cyan-600 dark:from-amber-400 dark:via-yellow-200 dark:to-emerald-400">
                    {headingText.split(' ').slice(-1).join(' ')}
                  </span>
                </>
              ) : (
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-600 via-amber-500 to-cyan-600">
                  {headingText}
                </span>
              )}
            </h2>
          </div>

          <div className="flex flex-col sm:items-end gap-3">
            <p className="text-[#4A5568] dark:text-white/60 text-sm sm:text-base max-w-md font-medium leading-relaxed lg:text-right">
              {descriptionText}
            </p>
            {/* Inline Live Currency Preview Toggle */}
            <div className="inline-flex items-center gap-1.5 p-1 rounded-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm self-start sm:self-end">
              <Globe className="w-3.5 h-3.5 text-amber-500 ml-2" />
              {(Object.keys(SUPPORTED_CURRENCIES) as CurrencyCode[]).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setCurrency(code)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold transition-all ${
                    currency === code
                      ? 'bg-[#111439] text-white dark:bg-amber-400 dark:text-black shadow-sm'
                      : 'text-slate-500 dark:text-white/50 hover:text-[#111439] dark:hover:text-white'
                  }`}
                >
                  {code}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Packages Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-7">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-[#0a0f12] border border-slate-200 dark:border-white/10 rounded-[2rem] p-6 space-y-4 shadow-sm">
                <Skeleton className="h-60 w-full rounded-[1.5rem] bg-slate-100 dark:bg-white/5" />
                <Skeleton className="h-7 w-3/4 bg-slate-100 dark:bg-white/5" />
                <Skeleton className="h-4 w-1/2 bg-slate-100 dark:bg-white/5" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-7">
            {featuredPackages.map((pkg: any, index: number) => {
              const displayPrice = pkg.price ? Number(pkg.price) : 24500;
              return (
                <div
                  key={pkg.id}
                  className="group animate-fade-up flex flex-col justify-between h-full bg-white dark:bg-[#0a0f14] border border-slate-200/90 dark:border-white/10 rounded-[2rem] overflow-hidden transition-all duration-500 hover:border-amber-400/50 hover:shadow-2xl hover:shadow-amber-500/5 hover:-translate-y-1 shadow-md shadow-slate-900/5"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Clickable Image Hub */}
                  <div
                    onClick={() => setQuickPeekPackage(pkg)}
                    className="relative h-56 sm:h-64 overflow-hidden m-3 rounded-2xl cursor-pointer"
                  >
                    <img
                      src={pkg.image}
                      alt={pkg.name}
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

                    <div className="absolute top-3.5 left-3.5 px-3 py-1 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-white">CURATED</span>
                    </div>

                    <div className="absolute top-3.5 right-3.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="px-3 py-1 bg-amber-400 text-black text-[10px] font-black uppercase tracking-wider rounded-xl shadow-lg flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        <span>Quick Peek</span>
                      </div>
                    </div>

                    <div className="absolute bottom-3.5 left-3.5 right-3.5 flex justify-between items-end gap-2">
                      <div className="flex items-center gap-1.5 text-white drop-shadow-md min-w-0">
                        <MapPin className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                        <span className="text-[10px] font-black uppercase tracking-wider truncate">
                          {pkg.destination}
                        </span>
                      </div>
                      <Badge variant="outline" className="bg-black/60 border-white/20 text-[10px] text-white font-bold backdrop-blur-md shrink-0">
                        {pkg.duration}
                      </Badge>
                    </div>
                  </div>

                  {/* Content Hub */}
                  <div className="p-5 pt-2 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${
                              i < Math.floor(pkg.rating || 5)
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-200 dark:text-white/20'
                            }`}
                          />
                        ))}
                        <span className="text-[10px] font-bold text-slate-500 dark:text-white/40 ml-1.5">
                          {pkg.rating || 4.9} ({pkg.reviewCount || 12} Reviews)
                        </span>
                      </div>

                      <h3
                        onClick={() => setQuickPeekPackage(pkg)}
                        className="font-display text-lg font-black text-[#111439] dark:text-white mb-3 hover:text-amber-500 cursor-pointer transition-colors line-clamp-2 leading-snug"
                      >
                        {pkg.name}
                      </h3>

                      <div className="flex flex-wrap gap-1.5 mb-4">
                        <span className="text-[10px] font-semibold bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white/70 px-2 py-0.5 rounded-md border border-slate-200 dark:border-white/5">
                          ✦ Heated Stay
                        </span>
                        <span className="text-[10px] font-semibold bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white/70 px-2 py-0.5 rounded-md border border-slate-200 dark:border-white/5">
                          ✦ 4x4 Chauffeur
                        </span>
                        <span className="text-[10px] font-semibold bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white/70 px-2 py-0.5 rounded-md border border-slate-200 dark:border-white/5">
                          ✦ Shikara Cruise
                        </span>
                      </div>
                    </div>

                    {/* Bottom Pricing & Actions */}
                    <div className="border-t border-slate-100 dark:border-white/10 pt-4">
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-white/40 mb-0.5">
                            Starting From
                          </p>
                          <div className="flex items-baseline gap-1">
                            <span className="text-xl font-black text-[#111439] dark:text-amber-400 font-mono tabular-nums">
                              {formatPrice(displayPrice)}
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-white/40">/ couple</span>
                          </div>
                        </div>

                        <Button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            openLeadModal({
                              packageTitle: pkg.name,
                              destination: pkg.destination,
                              sourceCta: 'PACKAGE_CARD_CUSTOM',
                            });
                          }}
                          className="h-10 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-[10px] uppercase tracking-wider shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Quick Quote</span>
                        </Button>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-white/40 pt-1">
                        <span>MAP Meals Included</span>
                        <button
                          type="button"
                          onClick={() => setQuickPeekPackage(pkg)}
                          className="text-amber-600 dark:text-amber-400 hover:underline font-bold flex items-center gap-1"
                        >
                          <span>Quick Peek</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Global CTA Strip */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-16">
          <Button
            onClick={() => openLeadModal({ sourceCta: 'FEATURED_PORTFOLIO_PLAN' })}
            size="lg"
            className="h-auto py-4 px-9 rounded-full bg-[#111439] hover:bg-[#1c225a] dark:bg-amber-400 dark:hover:bg-amber-300 text-white dark:text-black font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
          >
            <Sparkles className="w-4 h-4 text-amber-400 dark:text-black" />
            <span>Plan My Kashmir Trip</span>
          </Button>

          <Link to="/packages">
            <Button
              size="lg"
              variant="outline"
              className="h-auto py-4 px-9 rounded-full border-slate-300 dark:border-white/20 text-[#111439] dark:text-white font-black text-xs uppercase tracking-[0.2em] hover:bg-white dark:hover:bg-white/10 transition-all hover:scale-105 active:scale-95 group"
            >
              Explore Entire Portfolio
              <ArrowRight className="w-4 h-4 ml-3 transition-transform group-hover:translate-x-1.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* QUICK PEEK SLIDE-OVER DRAWER */}
      <Sheet open={!!quickPeekPackage} onOpenChange={(open) => !open && setQuickPeekPackage(null)}>
        <SheetContent side="right" className="w-full sm:max-w-xl bg-[#0a0f14] text-white border-l border-white/10 p-0 overflow-y-auto">
          {quickPeekPackage && (
            <div className="flex flex-col min-h-full">
              <div className="relative h-64 sm:h-72 w-full">
                <img
                  src={quickPeekPackage.image}
                  alt={quickPeekPackage.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f14] via-black/30 to-transparent" />

                <div className="absolute top-4 left-4 flex gap-2">
                  <Badge className="bg-amber-400 text-black font-black text-[10px] uppercase">
                    {quickPeekPackage.destination}
                  </Badge>
                  <Badge variant="outline" className="bg-black/60 border-white/20 text-white text-[10px] font-bold">
                    {quickPeekPackage.duration}
                  </Badge>
                </div>

                <div className="absolute bottom-4 left-6 right-6">
                  <div className="flex items-center gap-1 mb-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    ))}
                    <span className="text-xs font-bold text-white/70 ml-2">
                      {quickPeekPackage.rating || 4.9} ({quickPeekPackage.reviewCount || 12} Curated Reviews)
                    </span>
                  </div>
                  <h3 className="font-display text-2xl md:text-3xl font-black text-white leading-tight">
                    {quickPeekPackage.name}
                  </h3>
                </div>
              </div>

              <div className="p-6 md:p-8 space-y-6 flex-1">
                {/* Transparent Pricing Card */}
                <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-mono tracking-widest uppercase text-amber-400 block font-bold">
                      All-Inclusive Transparent Tariff ({currency})
                    </span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-3xl font-black text-white font-mono tabular-nums">
                        {formatPrice(quickPeekPackage.price || 24500)}
                      </span>
                      <span className="text-xs text-white/50">/ couple</span>
                    </div>
                    <span className="text-[11px] text-emerald-400 block mt-1">
                      ✓ Heated Stay, Shikara & 4x4 Chauffeur Included
                    </span>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs py-1 px-3">
                      Instant Lock
                    </Badge>
                    <div className="flex items-center gap-1">
                      {(['INR', 'USD', 'EUR', 'GBP'] as CurrencyCode[]).map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setCurrency(c)}
                          className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${
                            currency === c ? 'bg-amber-400 text-black' : 'bg-white/10 text-white/60 hover:text-white'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Seasonal Rates Guide */}
                <div>
                  <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-white/50 mb-3">
                    Seasonal Price Guide ({currency})
                  </h4>
                  <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                      <span className="text-[10px] text-white/50 block">❄️ Winter Snow</span>
                      <span className="font-bold text-white font-mono mt-1 block tabular-nums">
                        {formatPrice(quickPeekPackage.price || 24500)}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                      <span className="text-[10px] text-white/50 block">🌷 Tulip Spring</span>
                      <span className="font-bold text-amber-400 font-mono mt-1 block tabular-nums">
                        {formatPrice(Math.round((quickPeekPackage.price || 24500) * 1.15))}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                      <span className="text-[10px] text-white/50 block">☀️ Summer Valley</span>
                      <span className="font-bold text-emerald-400 font-mono mt-1 block tabular-nums">
                        {formatPrice(Math.round((quickPeekPackage.price || 24500) * 0.95))}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Key Curated Inclusions */}
                <div>
                  <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-white/50 mb-3">
                    What Is Included
                  </h4>
                  <div className="space-y-2.5">
                    <div className="flex items-start gap-3 text-xs text-white/80">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Dedicated Toyota Innova Crysta / 4x4 vehicle with snow chains and police-verified chauffeur.</span>
                    </div>
                    <div className="flex items-start gap-3 text-xs text-white/80">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Private heated Shikara sunset cruise on Nigeen or Dal Lake with hot Kashmiri Kahwa.</span>
                    </div>
                    <div className="flex items-start gap-3 text-xs text-white/80">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Daily morning breakfast and authentic multi-course Kashmiri Wazwan dinners (MAP plan).</span>
                    </div>
                    <div className="flex items-start gap-3 text-xs text-white/80">
                      <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>24/7 Kashmir Corridor Disruption Shield — instant alternative rerouting if roads get blocked.</span>
                    </div>
                  </div>
                </div>

                {/* Day-by-Day Summary */}
                <div>
                  <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-white/50 mb-3">
                    Itinerary Route Preview
                  </h4>
                  <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-3 text-xs">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-white/10 text-white font-mono text-[10px]">Day 1</Badge>
                      <span className="text-white/80 font-medium">Srinagar Arrival, Houseboat Check-in & Shikara Sunset</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className="bg-white/10 text-white font-mono text-[10px]">Day 2</Badge>
                      <span className="text-white/80 font-medium">Gulmarg Alpine Meadows, Snow Slopes & Gondola Phase 2</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className="bg-white/10 text-white font-mono text-[10px]">Day 3</Badge>
                      <span className="text-white/80 font-medium">Pahalgam Valley of Shepherds, Betaab & Aru Valleys</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className="bg-white/10 text-white font-mono text-[10px]">Day 4</Badge>
                      <span className="text-white/80 font-medium">Doodhpathri Pine Meadows / Old Srinagar Craft Walk</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Drawer Footer Actions */}
              <div className="p-6 bg-black/70 border-t border-white/10 space-y-3 sticky bottom-0 backdrop-blur-xl">
                <Button
                  onClick={() => {
                    const selected = quickPeekPackage;
                    setQuickPeekPackage(null);
                    openLeadModal({
                      packageTitle: selected.name,
                      destination: selected.destination,
                      sourceCta: 'QUICK_PEEK_CUSTOMIZE',
                    });
                  }}
                  className="w-full h-12 bg-amber-400 hover:bg-amber-300 text-black font-black uppercase text-xs rounded-xl shadow-lg shadow-amber-400/20"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  <span>Personalize This Itinerary (Free Quote)</span>
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const selected = quickPeekPackage;
                      setQuickPeekPackage(null);
                      openWhatsAppLead({
                        packageTitle: selected.name,
                        destination: selected.destination,
                      });
                    }}
                    className="flex-1 h-11 border-white/20 text-white hover:bg-white/10 text-xs rounded-xl"
                  >
                    <MessageCircle className="w-4 h-4 mr-1.5 text-emerald-400" />
                    <span>WhatsApp Curator</span>
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={() => {
                      const targetId = quickPeekPackage.id;
                      setQuickPeekPackage(null);
                      navigate(`/packages/${targetId}`);
                    }}
                    className="flex-1 h-11 text-white/70 hover:text-white text-xs rounded-xl"
                  >
                    <span>Full Details</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </section>
  );
}
