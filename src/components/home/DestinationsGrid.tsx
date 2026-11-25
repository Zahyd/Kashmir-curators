import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Sparkles, MapPin, Compass, Headphones,
  Mountain, Clock, Sun, CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLeadCapture } from '@/contexts/LeadCaptureContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useLandingPageContent, DEFAULT_DESTINATIONS, DestinationItem } from '@/hooks/useLandingPageContent';

const DESTINATION_ENRICHMENT: Record<
  string,
  { altitude: string; driveTime: string; bestSeason: string; startingPriceInr: number; highlights: string[] }
> = {
  srinagar: {
    altitude: '1,585m',
    driveTime: '20 min from SXR',
    bestSeason: 'Year-Round',
    startingPriceInr: 18500,
    highlights: ['Nigeen Cedar Houseboats', 'Private Sunset Shikara', 'Mughal Heritage Gardens'],
  },
  gulmarg: {
    altitude: '2,650m',
    driveTime: '1.5 hrs from SXR',
    bestSeason: 'Dec – May & Jul',
    startingPriceInr: 26500,
    highlights: ['Gondola Ph 1 & 2 Fast-Track', '4x4 Snow-Chain Fleet', 'Ski-In Boutique Chalets'],
  },
  pahalgam: {
    altitude: '2,130m',
    driveTime: '2.5 hrs from SXR',
    bestSeason: 'Mar – Nov',
    startingPriceInr: 22000,
    highlights: ['Aru & Betaab Valleys', 'Lidder Riverside Cottages', 'Pampore Saffron En-route'],
  },
  sonamarg: {
    altitude: '2,730m',
    driveTime: '2.5 hrs from SXR',
    bestSeason: 'Apr – Oct',
    startingPriceInr: 23500,
    highlights: ['Thajiwas Glacier Trail', 'Zero Point Zojila Corridor', 'Sindh Riverfront Camps'],
  },
  sonmarg: {
    altitude: '2,730m',
    driveTime: '2.5 hrs from SXR',
    bestSeason: 'Apr – Oct',
    startingPriceInr: 23500,
    highlights: ['Thajiwas Glacier Trail', 'Zero Point Zojila Corridor', 'Sindh Riverfront Camps'],
  },
  doodhpathri: {
    altitude: '2,730m',
    driveTime: '1.5 hrs from SXR',
    bestSeason: 'Apr – Nov',
    startingPriceInr: 19500,
    highlights: ['Shaliganga Stream Picnics', 'Diskhal Alpine Ridge', 'Zero-Crowd Pine Meadows'],
  },
};

export default function DestinationsGrid() {
  const { openLeadModal, openCallbackModal } = useLeadCapture();
  const { formatPrice } = useCurrency();
  const { destinations: cmsDestinations } = useLandingPageContent();

  const rawItems: DestinationItem[] =
    cmsDestinations?.items && cmsDestinations.items.length > 0
      ? cmsDestinations.items.filter((d: DestinationItem) => d.isActive !== false)
      : DEFAULT_DESTINATIONS;

  // Ensure all 5 signature valleys (including Doodhpathri) are discoverable even if older CMS payload only had 4
  const items: DestinationItem[] = (() => {
    const names = new Set(rawItems.map((d) => d.name.toLowerCase()));
    const supplemented = [...rawItems];
    DEFAULT_DESTINATIONS.forEach((def) => {
      if (!names.has(def.name.toLowerCase()) && !(def.name === 'Sonamarg' && names.has('sonmarg'))) {
        supplemented.push(def);
      }
    });
    return supplemented.map((item) => {
      const meta = DESTINATION_ENRICHMENT[item.name.toLowerCase()];
      return {
        ...item,
        altitude: item.altitude || meta?.altitude || '2,100m',
        driveTime: item.driveTime || meta?.driveTime || '2 hrs from SXR',
        bestSeason: item.bestSeason || meta?.bestSeason || 'All Seasons',
        startingPriceInr: item.startingPriceInr || meta?.startingPriceInr || 22000,
        highlights: item.highlights && item.highlights.length > 0 ? item.highlights : meta?.highlights || ['Curated Luxury Stays', 'Private 4x4 Chauffeur'],
      };
    });
  })();

  const [activeValleyId, setActiveValleyId] = useState<string>(items[0]?.id || 'dest-1');
  const activeValley = items.find((d) => d.id === activeValleyId) || items[0];

  const badgeText = cmsDestinations?.badgeText || 'Destination Discovery';
  const title = cmsDestinations?.title || 'Signature Kashmir Valleys';
  const subtitle =
    cmsDestinations?.subtitle ||
    'Five distinct micro-climates — from Nigeen Lake heritage houseboats to Gulmarg’s 14,000 ft powder ridges and Doodhpathri’s untouched alpine meadows.';

  const getBentoGridSpan = (index: number, total: number) => {
    if (total === 5) {
      if (index === 0) return 'md:col-span-3 md:row-span-2 min-h-[340px] md:min-h-[540px]';
      if (index === 1 || index === 2) return 'md:col-span-3 md:row-span-1 min-h-[260px]';
      return 'md:col-span-3 md:row-span-1 min-h-[280px]';
    }
    if (index === 0) return 'md:col-span-3 md:row-span-2 min-h-[340px]';
    return 'md:col-span-3 md:row-span-1 min-h-[260px]';
  };

  return (
    <section className="py-16 md:py-28 bg-[#F8F8F9] dark:bg-[#05080a] relative overflow-hidden transition-colors">
      {/* Background Orbs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-400/10 blur-[140px] -mr-64 -mt-64 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-sky-400/10 blur-[140px] -ml-64 -mb-64 pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 relative z-10 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12 animate-fade-up">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm mb-5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#111439] dark:text-white">
                {badgeText}
              </span>
            </div>
            <h2 className="font-display text-3xl sm:text-5xl md:text-6xl font-black text-[#111439] dark:text-white leading-tight tracking-tight">
              {title.includes(' ') ? (
                <>
                  {title.split(' ').slice(0, -1).join(' ')}{' '}
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-600 via-amber-500 to-cyan-600 dark:from-amber-400 dark:via-yellow-200 dark:to-emerald-400">
                    {title.split(' ').slice(-1)[0]}
                  </span>
                </>
              ) : (
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-600 via-amber-500 to-cyan-600">
                  {title}
                </span>
              )}
            </h2>
          </div>
          <p className="text-[#4A5568] dark:text-white/60 text-sm sm:text-base max-w-md font-medium leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* Interactive Valley Selector & Live Telemetry Strip */}
        <div className="mb-10 p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#0a0f14] border border-slate-200/90 dark:border-white/10 shadow-lg shadow-slate-900/5">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-white/10">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar max-w-full pb-1 sm:pb-0">
              {items.map((dest) => {
                const isSelected = activeValley?.id === dest.id;
                return (
                  <button
                    key={dest.id}
                    type="button"
                    onClick={() => setActiveValleyId(dest.id)}
                    className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-2 ${
                      isSelected
                        ? 'bg-[#111439] text-white dark:bg-amber-400 dark:text-black shadow-md'
                        : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/70 hover:text-[#111439] dark:hover:text-white'
                    }`}
                  >
                    <MapPin className="w-3 h-3" />
                    <span>{dest.name}</span>
                  </button>
                );
              })}
            </div>

            {activeValley && (
              <div className="flex items-center gap-3 text-xs">
                <span className="text-slate-500 dark:text-white/50 font-medium">Curated Stays & Tours from</span>
                <span className="font-mono font-black text-base text-[#111439] dark:text-amber-400 tabular-nums">
                  {formatPrice(activeValley.startingPriceInr || 22000)}
                </span>
              </div>
            )}
          </div>

          {activeValley && (
            <div className="pt-4 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
              <div className="lg:col-span-5 space-y-1">
                <div className="flex items-center gap-2">
                  <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[9px] font-black uppercase tracking-widest">
                    {activeValley.tagline}
                  </Badge>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-white/70 font-medium">
                  {activeValley.desc}
                </p>
              </div>

              <div className="lg:col-span-4 grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-2xl bg-[#F8F8F9] dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/5">
                  <Mountain className="w-3.5 h-3.5 text-amber-500 mx-auto mb-1" />
                  <span className="block text-[9px] uppercase font-bold text-slate-400">Elevation</span>
                  <span className="text-xs font-mono font-black text-[#111439] dark:text-white">{activeValley.altitude}</span>
                </div>
                <div className="p-2.5 rounded-2xl bg-[#F8F8F9] dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/5">
                  <Clock className="w-3.5 h-3.5 text-sky-500 mx-auto mb-1" />
                  <span className="block text-[9px] uppercase font-bold text-slate-400">Transit</span>
                  <span className="text-xs font-mono font-black text-[#111439] dark:text-white">{activeValley.driveTime}</span>
                </div>
                <div className="p-2.5 rounded-2xl bg-[#F8F8F9] dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/5">
                  <Sun className="w-3.5 h-3.5 text-emerald-500 mx-auto mb-1" />
                  <span className="block text-[9px] uppercase font-bold text-slate-400">Prime Window</span>
                  <span className="text-xs font-mono font-black text-[#111439] dark:text-white">{activeValley.bestSeason}</span>
                </div>
              </div>

              <div className="lg:col-span-3 flex items-center justify-end gap-2">
                <Link to={`/packages?destination=${encodeURIComponent(activeValley.name)}`} className="flex-1 lg:flex-initial">
                  <Button className="w-full h-10 px-4 rounded-xl bg-[#111439] hover:bg-[#1c225a] dark:bg-amber-400 dark:hover:bg-amber-300 text-white dark:text-black font-black text-[11px] uppercase tracking-wider">
                    Explore {activeValley.name}
                  </Button>
                </Link>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    openLeadModal({
                      destination: activeValley.name,
                      sourceCta: 'DESTINATION_SPOTLIGHT',
                      intent: `${activeValley.name} Curated Experience`,
                    })
                  }
                  className="h-10 px-3.5 rounded-xl border-slate-200 dark:border-white/15 text-xs font-bold"
                >
                  Quote
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* 5-Valley Luxury Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-5">
          {items.map((dest, index) => (
            <Link
              key={dest.name || dest.id}
              to={`/packages?destination=${encodeURIComponent(dest.name)}`}
              onMouseEnter={() => setActiveValleyId(dest.id)}
              className={`group relative overflow-hidden rounded-[2rem] border border-slate-200/90 dark:border-white/10 shadow-xl shadow-slate-900/5 bg-[#0a0f12] ${getBentoGridSpan(
                index,
                items.length
              )} animate-fade-up transition-all duration-700 hover:border-amber-400/60 hover:shadow-2xl hover:scale-[1.008]`}
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-105"
                style={{ backgroundImage: `url(${dest.image})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/10 opacity-85 transition-opacity duration-500 group-hover:opacity-95" />

              {/* Top Metadata Pills */}
              <div className="absolute top-5 left-5 right-5 flex items-center justify-between gap-2">
                <div className="px-3 py-1 rounded-full bg-black/55 backdrop-blur-md border border-white/15 flex items-center gap-2 text-[10px] font-mono font-bold text-white">
                  <span>{dest.altitude}</span>
                  <span className="text-white/30">•</span>
                  <span className="text-amber-300">{dest.driveTime}</span>
                </div>
                <div className="px-3 py-1 rounded-full bg-black/55 backdrop-blur-md border border-white/15 text-[10px] font-mono font-black text-emerald-300 tabular-nums">
                  From {formatPrice(dest.startingPriceInr || 22000)}
                </div>
              </div>

              {/* Bottom Content */}
              <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8 flex flex-col justify-end">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-400">
                    {dest.tagline}
                  </span>
                </div>

                <h4 className="font-display text-2xl sm:text-3xl md:text-4xl font-black text-white mb-2">
                  {dest.name}
                </h4>

                <p className="text-white/75 text-xs sm:text-sm font-medium mb-4 max-w-md line-clamp-2">
                  {dest.desc}
                </p>

                {/* Highlight Tags */}
                {dest.highlights && dest.highlights.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {dest.highlights.slice(0, 3).map((hl) => (
                      <span
                        key={hl}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 backdrop-blur-md border border-white/10 text-[10px] font-semibold text-white/90"
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        {hl}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-white/70 group-hover:text-amber-300 transition-colors duration-300">
                  <span>Explore {dest.name} Collection</span>
                  <div className="w-8 h-[1px] bg-white/30 group-hover:w-12 group-hover:bg-amber-400 transition-all duration-500" />
                  <ArrowRight className="w-4 h-4 text-amber-400 transition-transform duration-300 group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Offbeat Destinations Lead Capture Banner */}
        <div className="mt-12 p-7 md:p-9 rounded-[2rem] bg-white dark:bg-white/[0.03] border border-slate-200/90 dark:border-white/10 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 animate-fade-up">
          <div className="space-y-1.5 text-center md:text-left">
            <div className="inline-flex items-center gap-2 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-widest">
              <Compass className="w-3.5 h-3.5" /> Untouched Borderlands & Permit Circuits
            </div>
            <h4 className="text-xl md:text-2xl font-black uppercase text-[#111439] dark:text-white tracking-tight">
              Craving Offbeat Kashmir?{' '}
              <span className="text-amber-600 dark:text-amber-400">Gurez, Bangus & Warwan</span>
            </h4>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-white/55 max-w-xl">
              Beyond the classic five valleys, our native guides secure frontier permits, satellite-backed logistics, and boutique wooden homestays.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
            <Button
              onClick={() =>
                openLeadModal({
                  sourceCta: 'DESTINATIONS_OFFBEAT',
                  intent: 'North Kashmir Offbeat Places (Gurez & Bangus)',
                })
              }
              className="h-12 px-7 rounded-full bg-[#111439] hover:bg-[#1c225a] dark:bg-amber-400 dark:hover:bg-amber-300 text-white dark:text-black font-black text-xs uppercase tracking-widest shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-400 dark:text-black" />
              <span>Plan My Kashmir Trip</span>
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                openCallbackModal({
                  sourceCta: 'DESTINATIONS_CALLBACK',
                  intent: 'Offbeat Kashmir Inquiry',
                })
              }
              className="h-12 px-6 rounded-full border-slate-300 dark:border-white/20 text-[#111439] dark:text-white font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
            >
              <Headphones className="w-4 h-4 text-amber-500" />
              <span>Talk to Specialist</span>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
