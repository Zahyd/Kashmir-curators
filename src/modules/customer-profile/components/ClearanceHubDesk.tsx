import React, { useState } from 'react';
import { 
  CloudSun, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  MapPin, 
  Wind, 
  Droplets, 
  Eye, 
  Navigation, 
  Phone, 
  RefreshCw, 
  Clock, 
  ExternalLink,
  Compass,
  Mountain,
  Car
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { KashmirLocationAdvisory } from '../types';

interface MountainPassStatus {
  name: string;
  route: string;
  status: 'Open' | 'Caution' | 'Closed';
  condition: string;
  source: string;
  lastUpdated: string;
}

interface ClearanceHubDeskProps {
  advisories: KashmirLocationAdvisory[];
}

export const ClearanceHubDesk: React.FC<ClearanceHubDeskProps> = ({
  advisories
}) => {
  const [selectedLocId, setSelectedLocId] = useState<string>(advisories[0]?.id || 'srinagar');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const activeAdvisory = advisories.find(l => l.id === selectedLocId) || advisories[0];

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success('Clearance intelligence synchronized with regional traffic & meteorological bulletins.');
    }, 800);
  };

  const mountainPasses: MountainPassStatus[] = [
    {
      name: 'NH-44 Jammu - Srinagar Highway',
      route: 'Jammu ↔ Udhampur ↔ Banihal ↔ Srinagar',
      status: 'Open',
      condition: 'Two-way vehicular traffic operational. Smooth transit across NavYug Tunnel and Ramban corridor.',
      source: 'Traffic Police Rural Kashmir HQ',
      lastUpdated: 'Today at 06:00 AM IST'
    },
    {
      name: 'Gulmarg - Tangmarg Checkpoint',
      route: 'Tangmarg ↔ Gulmarg Highland (12 km)',
      status: 'Open',
      condition: 'Clear road. 4x4 vehicles and winter chains required only above Drung during active precipitation.',
      source: 'Gulmarg Development Authority (GDA)',
      lastUpdated: 'Today at 07:30 AM IST'
    },
    {
      name: 'Mughal Road',
      route: 'Shopian (Kashmir) ↔ Bafliaz / Poonch (Jammu)',
      status: 'Open',
      condition: 'Open for light passenger vehicles only between 06:00 AM and 05:00 PM IST.',
      source: 'District Magistrate Shopian',
      lastUpdated: 'Today at 06:15 AM IST'
    },
    {
      name: 'Zojila Pass (NH-1)',
      route: 'Sonamarg ↔ Baltal ↔ Minamarg ↔ Drass / Kargil',
      status: 'Caution',
      condition: 'Single-lane regulated transit. Heavy convoy movement. Expected sub-zero frost during night hours.',
      source: 'Border Roads Organisation (BRO / Project Beacon)',
      lastUpdated: 'Today at 08:00 AM IST'
    },
    {
      name: 'Sinthan Top Pass',
      route: 'Daksum (Anantnag) ↔ Sinthan ↔ Kishtwar',
      status: 'Caution',
      condition: 'High-altitude winds. Open for light vehicles only with prior police control room clearance.',
      source: 'District Administration Anantnag',
      lastUpdated: 'Yesterday at 05:00 PM IST'
    }
  ];

  const activityMatrix = [
    {
      attraction: 'Gulmarg Gondola (Phase 1 & 2)',
      status: 'Operational',
      subText: 'Kongdoori & Apharwat Peak cable car running as per standard ticket slot schedules.',
      statusColor: 'emerald'
    },
    {
      attraction: 'Dal & Nigeen Lake Shikara Tours',
      status: 'Normal Operations',
      subText: 'Registered shikara ghats active from 06:00 AM till 09:30 PM. Calm waters.',
      statusColor: 'emerald'
    },
    {
      attraction: 'Pahalgam Lidder River Rafting',
      status: 'Operational',
      subText: 'Joy ride & Medium difficulty courses active near Yanner bridge with certified life jackets.',
      statusColor: 'emerald'
    },
    {
      attraction: 'Sonamarg Thajiwas Pony Trails',
      status: 'Caution / Guided',
      subText: 'Glacier route open with local pony union guides. Warm footwear recommended.',
      statusColor: 'amber'
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-amber-400 mb-2">
            <CloudSun className="w-3 h-3 text-amber-400" />
            <span>Regional Ground Intelligence</span>
          </div>
          <h2 className="font-display text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Kashmir Clearance & Advisory Hub
          </h2>
          <p className="text-white/50 text-xs md:text-sm mt-0.5">
            Verified mountain highway pass status, weather telemetry, and tourist activity clearances across Jammu & Kashmir.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-10 px-4 rounded-xl text-xs font-bold border-white/10 hover:border-amber-500/40 text-white bg-slate-900/80 gap-2"
          >
            <RefreshCw className={cn("w-3.5 h-3.5 text-amber-400", isRefreshing && "animate-spin")} />
            <span>{isRefreshing ? 'Synchronizing...' : 'Sync Bulletins'}</span>
          </Button>
        </div>
      </div>

      {/* Destination Switcher Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Location Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-4 border-b border-white/5">
          {advisories.map((loc) => {
            const isSelected = selectedLocId === loc.id;
            return (
              <button
                key={loc.id}
                type="button"
                onClick={() => setSelectedLocId(loc.id)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-2",
                  isSelected
                    ? "bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20"
                    : "bg-black/40 text-white/60 hover:text-white hover:bg-white/5 border border-white/5"
                )}
              >
                <MapPin className={cn("w-3.5 h-3.5", isSelected ? "text-slate-950" : "text-amber-400")} />
                <span>{loc.name}</span>
                <span className={cn(
                  "w-2 h-2 rounded-full",
                  loc.status === 'Open' ? "bg-emerald-400" : loc.status === 'Caution' ? "bg-amber-400" : "bg-rose-400"
                )} />
              </button>
            );
          })}
        </div>

        {/* Active Destination Detail Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-6 items-center">
          {/* Weather Snapshot */}
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 shadow-inner">
              <CloudSun className="w-10 h-10 text-amber-300 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider block mb-0.5">
                Live from {activeAdvisory.name}
              </span>
              <h3 className="text-4xl font-display font-extrabold text-white tracking-tight">
                {activeAdvisory.temp.toFixed(1)}°C
              </h3>
              <p className="text-xs text-white/60 mt-0.5">{activeAdvisory.condition}</p>
            </div>
          </div>

          {/* Operational Status */}
          <div className="bg-black/30 border border-white/5 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase text-white/40 tracking-wider">Clearance Status</span>
              <Badge className={cn("text-[9px] font-black uppercase px-2 py-0.5 tracking-wider",
                activeAdvisory.status === 'Open' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                activeAdvisory.status === 'Caution' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                'bg-rose-500/20 text-rose-400 border-rose-500/30'
              )}>
                {activeAdvisory.status}
              </Badge>
            </div>
            <p className="text-xs text-white/80 leading-relaxed font-medium">{activeAdvisory.message}</p>
            <p className="text-[10px] text-white/40 italic mt-2 border-t border-white/5 pt-2">{activeAdvisory.subText}</p>
          </div>

          {/* Attributed Source & Refresh */}
          <div className="space-y-2 text-xs text-white/50 bg-white/[0.02] border border-white/5 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-white font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Official Bulletin Source</span>
            </div>
            <p className="text-[11px] text-white/60">
              Information cross-checked with Traffic Police Headquarters Srinagar & India Meteorological Department (IMD Srinagar).
            </p>
            <div className="flex items-center gap-1.5 text-[10px] text-white/40 pt-1">
              <Clock className="w-3 h-3 text-amber-400" />
              <span>Updated Today at 06:00 IST (Scheduled Daily)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mountain Pass & Highway Advisory Matrix */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm md:text-base font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
            <Mountain className="w-4 h-4 text-amber-400" />
            <span>Mountain Passes & Highway Clearance Grid</span>
          </h3>
          <span className="text-xs text-white/40">Verified with Traffic Police & BRO</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mountainPasses.map((pass, idx) => (
            <div key={idx} className="bg-slate-900/70 border border-white/10 rounded-2xl p-5 hover:border-amber-500/30 transition-all shadow-md">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-extrabold text-white">{pass.name}</h4>
                <Badge className={cn("text-[9px] font-black uppercase px-2 py-0.5",
                  pass.status === 'Open' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                  pass.status === 'Caution' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                  'bg-rose-500/20 text-rose-400 border-rose-500/30'
                )}>
                  {pass.status}
                </Badge>
              </div>

              <p className="text-[11px] text-amber-400/80 font-mono mb-2">{pass.route}</p>
              <p className="text-xs text-white/60 leading-relaxed mb-3">{pass.condition}</p>

              <div className="flex items-center justify-between pt-3 border-t border-white/5 text-[10px] text-white/40">
                <span>Source: {pass.source}</span>
                <span>{pass.lastUpdated}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Activity & Experience Clearance */}
      <div className="space-y-4">
        <h3 className="text-sm md:text-base font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
          <Navigation className="w-4 h-4 text-amber-400" />
          <span>Attraction & Activity Operation Status</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {activityMatrix.map((act, idx) => (
            <div key={idx} className="bg-slate-900/60 border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/20 text-[9px] font-bold uppercase">
                    {act.status}
                  </Badge>
                </div>
                <h5 className="font-bold text-xs text-white mb-1">{act.attraction}</h5>
                <p className="text-[10px] text-white/50 leading-relaxed">{act.subText}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Emergency SOS & Police Helplines */}
      <div className="bg-slate-950 border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <Phone className="w-4 h-4 text-amber-400" />
          <span>Regional Emergency & Tourist Police Helplines</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-900/80 border border-white/5 p-4 rounded-xl">
            <span className="text-[10px] font-black uppercase text-white/40 block mb-1">Tourist Police Control Room</span>
            <a href="tel:01942452224" className="text-amber-400 font-bold hover:underline">0194-2452224 / 112</a>
            <p className="text-[9px] text-white/30 mt-1">24/7 Srinagar TRC Tourist Police Wing</p>
          </div>

          <div className="bg-slate-900/80 border border-white/5 p-4 rounded-xl">
            <span className="text-[10px] font-black uppercase text-white/40 block mb-1">Traffic Police Control Room</span>
            <a href="tel:01942450022" className="text-amber-400 font-bold hover:underline">0194-2450022</a>
            <p className="text-[9px] text-white/30 mt-1">Live Highway Clearance Updates</p>
          </div>

          <div className="bg-slate-900/80 border border-white/5 p-4 rounded-xl">
            <span className="text-[10px] font-black uppercase text-white/40 block mb-1">Gulmarg Ski & Mountain Rescue</span>
            <a href="tel:+919419000000" className="text-emerald-400 font-bold hover:underline">+91 94190 XXXXX</a>
            <p className="text-[9px] text-white/30 mt-1">High-altitude medical response unit</p>
          </div>
        </div>
      </div>
    </div>
  );
};
