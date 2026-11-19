import React, { useState } from 'react';
import { 
  Zap, 
  Plane, 
  Train, 
  Hotel, 
  Snowflake, 
  RotateCcw, 
  ChevronUp, 
  ChevronDown,
  Sparkles,
  Terminal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DriverTrip, HighwayAdvisory } from '../types/driver';

interface DevDispatchSimulatorProps {
  onSimulateFlightTrip: () => void;
  onSimulateTrainTrip: () => void;
  onSimulateHotelTrip: () => void;
  onToggleBlizzardAdvisory: () => void;
  onResetOffline: () => void;
}

export const DevDispatchSimulator: React.FC<DevDispatchSimulatorProps> = ({
  onSimulateFlightTrip,
  onSimulateTrainTrip,
  onSimulateHotelTrip,
  onToggleBlizzardAdvisory,
  onResetOffline,
}) => {
  const [collapsed, setCollapsed] = useState(true);

  return (
    <div className="absolute bottom-4 left-4 z-40">
      {/* Collapsed Pill Trigger */}
      {collapsed ? (
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-[#0F141C]/90 hover:bg-[#1A2230] border border-amber-500/40 text-amber-300 text-xs font-bold shadow-2xl backdrop-blur-xl transition-all active:scale-95"
        >
          <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400 animate-pulse" />
          <span>Dev Dispatch Sim</span>
          <ChevronUp className="w-3.5 h-3.5 text-white/40" />
        </button>
      ) : (
        /* Expanded Dispatch Simulation Control Panel */
        <div className="w-72 rounded-3xl bg-[#0F141C]/98 border border-amber-500/40 p-4 shadow-2xl backdrop-blur-2xl text-white space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-400">
              <Terminal className="w-3.5 h-3.5" />
              <span>Dispatch Simulator (Vercel Test)</span>
            </div>
            <button
              onClick={() => setCollapsed(true)}
              className="p-1 rounded-lg text-white/40 hover:text-white"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1.5 text-xs">
            {/* 1. SXR Flight Arrival Transfer */}
            <button
              type="button"
              onClick={() => {
                onSimulateFlightTrip();
                setCollapsed(true);
              }}
              className="w-full p-2.5 rounded-xl bg-white/5 hover:bg-amber-500/15 border border-white/5 hover:border-amber-500/30 text-left transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Plane className="w-4 h-4 text-amber-400 shrink-0" />
                <div className="min-w-0">
                  <span className="font-bold text-white group-hover:text-amber-300 block text-[11px] truncate">
                    Flight 6E-502 Arrival
                  </span>
                  <span className="text-[9px] text-white/50 block">SXR Gate 2 ➔ Gulmarg (₹2,850)</span>
                </div>
              </div>
              <span className="text-[10px] text-amber-400 font-bold shrink-0">15s</span>
            </button>

            {/* 2. Train Arrival Transfer */}
            <button
              type="button"
              onClick={() => {
                onSimulateTrainTrip();
                setCollapsed(true);
              }}
              className="w-full p-2.5 rounded-xl bg-white/5 hover:bg-emerald-500/15 border border-white/5 hover:border-emerald-500/30 text-left transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Train className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="min-w-0">
                  <span className="font-bold text-white group-hover:text-emerald-300 block text-[11px] truncate">
                    Train 22439 Vande Bharat
                  </span>
                  <span className="text-[9px] text-white/50 block">Nowgam Rail ➔ Pahalgam (₹3,400)</span>
                </div>
              </div>
              <span className="text-[10px] text-emerald-400 font-bold shrink-0">15s</span>
            </button>

            {/* 3. Houseboat / City Transfer */}
            <button
              type="button"
              onClick={() => {
                onSimulateHotelTrip();
                setCollapsed(true);
              }}
              className="w-full p-2.5 rounded-xl bg-white/5 hover:bg-sky-500/15 border border-white/5 hover:border-sky-500/30 text-left transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Hotel className="w-4 h-4 text-sky-400 shrink-0" />
                <div className="min-w-0">
                  <span className="font-bold text-white group-hover:text-sky-300 block text-[11px] truncate">
                    Dal Lake Houseboat City Transfer
                  </span>
                  <span className="text-[9px] text-white/50 block">Boulevard Pier ➔ SXR (₹1,200)</span>
                </div>
              </div>
              <span className="text-[10px] text-sky-400 font-bold shrink-0">15s</span>
            </button>

            {/* 4. Blizzard Advisory Toggle */}
            <button
              type="button"
              onClick={onToggleBlizzardAdvisory}
              className="w-full p-2 rounded-xl bg-sky-950/40 hover:bg-sky-900/50 border border-sky-500/20 text-left transition-all flex items-center gap-2 text-sky-200 text-[11px]"
            >
              <Snowflake className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>Toggle Tangmarg Blizzard Advisory</span>
            </button>

            {/* 5. Reset to Offline */}
            <button
              type="button"
              onClick={() => {
                onResetOffline();
                setCollapsed(true);
              }}
              className="w-full p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-left transition-all flex items-center gap-2 text-rose-300 text-[11px]"
            >
              <RotateCcw className="w-3.5 h-3.5 shrink-0" />
              <span>Reset Cockpit to Offline</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
