import React, { useState, useRef, useEffect } from 'react';
import { 
  Navigation, 
  MapPin, 
  Plane, 
  Train, 
  Flame, 
  Snowflake, 
  Compass, 
  ZoomIn, 
  ZoomOut, 
  Crosshair, 
  Layers, 
  Eye, 
  EyeOff,
  ShieldAlert,
  Gauge
} from 'lucide-react';
import { DriverTrip, DriverDutyState } from '../types/driver';

interface DriverMapCockpitProps {
  dutyState: DriverDutyState;
  activeTrip: DriverTrip | null;
  snowChainsActive?: boolean;
  sector?: string;
  onSelectSector?: (sector: string) => void;
}

const KASHMIR_HUBS = [
  'Srinagar SXR Airport',
  'Dal Lake / Boulevard',
  'Tangmarg Checkpost',
  'Gulmarg Gondola Bowl',
  'Pahalgam Lidder Stand',
  'Nowgam Railway Terminal',
];

export const DriverMapCockpit: React.FC<DriverMapCockpitProps> = ({
  dutyState,
  activeTrip,
  snowChainsActive = true,
  sector = 'Srinagar SXR Airport',
  onSelectSector,
}) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showSurge, setShowSurge] = useState(true);
  const [speed, setSpeed] = useState(48);

  const containerRef = useRef<HTMLDivElement>(null);

  // Dynamic driver position based on trip stage
  const getDriverCoords = () => {
    if (!activeTrip || dutyState === 'OFFLINE' || dutyState === 'ONLINE_SEARCHING') {
      return { x: 620, y: 520, heading: 315 }; // Srinagar City Center standby
    }

    if (activeTrip.stage === 'ACCEPTED') {
      return { x: 650, y: 540, heading: 290 };
    }

    if (activeTrip.stage === 'ARRIVED_AT_PICKUP') {
      if (activeTrip.arrivalTelemetry.type === 'FLIGHT') return { x: 680, y: 580, heading: 270 }; // At Airport
      if (activeTrip.arrivalTelemetry.type === 'TRAIN') return { x: 740, y: 640, heading: 320 }; // At Railway
      return { x: 720, y: 440, heading: 260 }; // At Houseboat
    }

    if (activeTrip.stage === 'STARTED_IN_TRANSIT') {
      return { x: 390, y: 410, heading: 295 }; // Climbing towards Tangmarg
    }

    return { x: 200, y: 330, heading: 320 }; // Arrived at Gulmarg
  };

  const driverPos = getDriverCoords();

  // Speed jitter simulation when driving
  useEffect(() => {
    if (activeTrip?.stage === 'STARTED_IN_TRANSIT') {
      const interval = setInterval(() => {
        setSpeed(prev => Math.min(65, Math.max(38, prev + (Math.random() * 6 - 3))));
      }, 2000);
      return () => clearInterval(interval);
    } else {
      setSpeed(0);
    }
  }, [activeTrip?.stage]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches?.[0];
    if (!touch) return;
    setIsDragging(true);
    setDragStart({ x: touch.clientX - pan.x, y: touch.clientY - pan.y });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches?.[0];
    if (!touch) return;
    setPan({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y,
    });
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Determine polyline start based on pickup type
  const pickupPoint = activeTrip?.arrivalTelemetry.type === 'TRAIN'
    ? { x: 740, y: 640 }
    : activeTrip?.arrivalTelemetry.type === 'HOTEL'
    ? { x: 720, y: 440 }
    : { x: 680, y: 580 }; // Default Airport SXR

  return (
    <div 
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleMouseUp}
      onTouchCancel={handleMouseUp}
      className="absolute inset-0 w-full h-full bg-[#07090E] select-none touch-none cursor-grab active:cursor-grabbing overflow-hidden"
    >
      {/* Tactical Canvas Map SVG */}
      <svg
        viewBox="0 0 1000 800"
        className="w-full h-full transition-transform duration-200 ease-out"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '50% 50%',
        }}
      >
        <defs>
          {/* Obsidian Map Dark Grid Pattern */}
          <pattern id="tacticalGrid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="1" />
          </pattern>

          {/* Surge Gradient Ring */}
          <radialGradient id="surgeAirport" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.45" />
            <stop offset="60%" stopColor="#F59E0B" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
          </radialGradient>

          <radialGradient id="surgeTrain" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.40" />
            <stop offset="60%" stopColor="#10B981" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
          </radialGradient>

          <radialGradient id="surgeDalLake" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.35" />
            <stop offset="70%" stopColor="#38BDF8" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
          </radialGradient>

          {/* Glowing Route Filter */}
          <filter id="routeGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. Tactical Grid & Terrain Background */}
        <rect width="1000" height="800" fill="#07090E" />
        <rect width="1000" height="800" fill="url(#tacticalGrid)" />

        {/* 2. Alpine Mountain Topography Contours (Pir Panjal & Gulmarg Range) */}
        <g opacity="0.45">
          <path
            d="M 50 150 Q 150 120 280 200 T 450 320 T 220 480 T 50 600 Z"
            fill="none"
            stroke="#1E293B"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          <path
            d="M 20 220 Q 120 180 220 260 T 360 380 T 180 520 Z"
            fill="none"
            stroke="#1E293B"
            strokeWidth="1.5"
          />
          <path
            d="M 80 80 Q 200 40 320 120 T 480 240"
            fill="none"
            stroke="#334155"
            strokeWidth="1"
          />
          {/* Alpine Peak Markers */}
          <text x="140" y="220" fill="rgba(255,255,255,0.25)" fontSize="11" fontWeight="bold">▲ APHARWAT PEAK (13,780 FT)</text>
          <text x="70" y="380" fill="rgba(255,255,255,0.2)" fontSize="10">▲ PIR PANJAL ALPINE RANGE</text>
        </g>

        {/* 3. Waterbodies (Dal Lake & Jhelum River) */}
        <g>
          {/* Jhelum River meandering through Valley */}
          <path
            d="M 880 750 Q 820 620 760 560 T 680 480 T 580 420 T 490 350"
            fill="none"
            stroke="#0284C7"
            strokeWidth="3.5"
            strokeOpacity="0.4"
          />
          {/* Dal Lake Water Surface */}
          <path
            d="M 720 370 Q 770 360 810 390 T 830 460 T 770 480 T 710 440 Z"
            fill="#0369A1"
            fillOpacity="0.25"
            stroke="#38BDF8"
            strokeWidth="1.5"
            strokeOpacity="0.5"
          />
          <text x="745" y="425" fill="#38BDF8" fontSize="11" fontWeight="bold" opacity="0.8">DAL LAKE</text>
        </g>

        {/* 4. Tourist Demand Surge Zones */}
        {showSurge && (
          <g>
            {/* SXR Airport Surge Zone */}
            <circle cx="680" cy="580" r="85" fill="url(#surgeAirport)" className="animate-pulse" />
            <circle cx="680" cy="580" r="45" fill="none" stroke="#F59E0B" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
            <g transform="translate(640, 520)">
              <rect width="80" height="20" rx="10" fill="#0F141C" stroke="#F59E0B" strokeWidth="1" />
              <text x="40" y="14" fill="#F59E0B" fontSize="9" fontWeight="900" textAnchor="middle">
                1.8x SURGE
              </text>
            </g>

            {/* Nowgam Railway Station Surge Zone */}
            <circle cx="740" cy="640" r="75" fill="url(#surgeTrain)" className="animate-pulse" />
            <g transform="translate(705, 590)">
              <rect width="76" height="18" rx="9" fill="#0F141C" stroke="#10B981" strokeWidth="1" />
              <text x="38" y="13" fill="#10B981" fontSize="9" fontWeight="900" textAnchor="middle">
                1.5x SURGE
              </text>
            </g>

            {/* Dal Lake Ghats Surge */}
            <circle cx="760" cy="420" r="60" fill="url(#surgeDalLake)" />
            <g transform="translate(730, 365)">
              <rect width="70" height="18" rx="9" fill="#0F141C" stroke="#38BDF8" strokeWidth="1" />
              <text x="35" y="13" fill="#38BDF8" fontSize="9" fontWeight="900" textAnchor="middle">
                1.4x SURGE
              </text>
            </g>
          </g>
        )}

        {/* 5. Main Highways & Road Network */}
        <g>
          {/* NH1A Srinagar–Gulmarg Highway Base Road */}
          <path
            d="M 740 640 L 680 580 L 600 510 L 490 450 L 350 390 L 260 350 L 190 320"
            fill="none"
            stroke="#1E293B"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <path
            d="M 740 640 L 680 580 L 600 510 L 490 450 L 350 390 L 260 350 L 190 320"
            fill="none"
            stroke="#334155"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          {/* City Feeder Roads */}
          <path d="M 600 510 L 720 440" fill="none" stroke="#1E293B" strokeWidth="3" />
          <path d="M 680 580 L 600 680" fill="none" stroke="#1E293B" strokeWidth="2.5" />
          <path d="M 490 450 L 520 330" fill="none" stroke="#1E293B" strokeWidth="2" strokeDasharray="3 3" />
        </g>

        {/* 6. Dynamic Active Route Polyline (When trip is assigned or active) */}
        {activeTrip && (
          <g filter="url(#routeGlow)">
            {/* Base Glow Line */}
            <path
              d={`M ${pickupPoint.x} ${pickupPoint.y} L 600 510 L 490 450 L 350 390 L 260 350 L 190 320`}
              fill="none"
              stroke="#10B981"
              strokeWidth="5"
              strokeOpacity="0.4"
              strokeLinecap="round"
            />
            {/* Animated Directional Dash Line */}
            <path
              d={`M ${pickupPoint.x} ${pickupPoint.y} L 600 510 L 490 450 L 350 390 L 260 350 L 190 320`}
              fill="none"
              stroke="#10B981"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="8 8"
              className="animate-[dash_1.5s_linear_infinite]"
              style={{
                strokeDashoffset: 16,
              }}
            />
          </g>
        )}

        {/* 7. Key Geographic Milestones & Landmarks */}
        <g>
          {/* Milestone 1: Srinagar International Airport (SXR) */}
          <g transform="translate(680, 580)">
            <circle cx="0" cy="0" r="14" fill="#0F141C" stroke="#F59E0B" strokeWidth="2" />
            <Plane className="w-4 h-4 text-amber-400 -translate-x-2 -translate-y-2" />
            <text x="18" y="4" fill="#F8FAFC" fontSize="11" fontWeight="bold">Srinagar Airport (SXR)</text>
            <text x="18" y="16" fill="#94A3B8" fontSize="9">Terminal Gate 2 • Flight Arrivals</text>
          </g>

          {/* Milestone 2: Srinagar Railway Station (Nowgam Rail Link) */}
          <g transform="translate(740, 640)">
            <circle cx="0" cy="0" r="14" fill="#0F141C" stroke="#10B981" strokeWidth="2" />
            <Train className="w-4 h-4 text-emerald-400 -translate-x-2 -translate-y-2" />
            <text x="18" y="4" fill="#F8FAFC" fontSize="11" fontWeight="bold">Srinagar Railway Station (Nowgam)</text>
            <text x="18" y="16" fill="#94A3B8" fontSize="9">Kashmir Rail Terminal • Platforms 1-3</text>
          </g>

          {/* Milestone 3: Narbal / Magam Junction */}
          <g transform="translate(490, 450)">
            <circle cx="0" cy="0" r="6" fill="#334155" stroke="#94A3B8" strokeWidth="1.5" />
            <text x="-10" y="-12" fill="#94A3B8" fontSize="9" fontWeight="bold">Narbal Junction</text>
          </g>

          {/* Milestone 4: Tangmarg Snow Chain Checkpoint */}
          <g transform="translate(350, 390)">
            <rect x="-16" y="-14" width="32" height="28" rx="8" fill="#0F141C" stroke="#38BDF8" strokeWidth="2" />
            <Snowflake className="w-4 h-4 text-sky-400 -translate-x-2 -translate-y-2 animate-spin duration-[12000ms]" />
            <g transform="translate(20, -10)">
              <rect width="168" height="28" rx="6" fill="#0B131E" stroke="#38BDF8" strokeWidth="1" />
              <text x="8" y="12" fill="#38BDF8" fontSize="9" fontWeight="extrabold">TANGMARG CHECKPOINT</text>
              <text x="8" y="22" fill="#E2E8F0" fontSize="8">Snow Chains Mandatory Ahead</text>
            </g>
          </g>

          {/* Milestone 5: Gulmarg Highlands / Gondola Base */}
          <g transform="translate(190, 320)">
            <circle cx="0" cy="0" r="14" fill="#0F141C" stroke="#F59E0B" strokeWidth="2" />
            <MapPin className="w-4 h-4 text-amber-400 -translate-x-2 -translate-y-2" />
            <g transform="translate(-170, -28)">
              <rect width="160" height="28" rx="6" fill="#0F141C" stroke="#F59E0B" strokeWidth="1" />
              <text x="8" y="12" fill="#F59E0B" fontSize="9" fontWeight="extrabold">GULMARG HIGHLANDS</text>
              <text x="8" y="22" fill="#F8FAFC" fontSize="8">The Highland Chalet • Gondola Rd</text>
            </g>
          </g>
        </g>

        {/* 8. Pulsing Driver GPS Directional Puck */}
        <g transform={`translate(${driverPos.x}, ${driverPos.y})`}>
          {/* Radar Wave Ping */}
          <circle cx="0" cy="0" r="28" fill="#10B981" fillOpacity="0.2" className="animate-ping" />
          <circle cx="0" cy="0" r="16" fill="#10B981" fillOpacity="0.3" />

          {/* Heading Directional Cone */}
          <path
            d="M 0 -36 L 14 0 L -14 0 Z"
            fill="#10B981"
            fillOpacity="0.35"
            transform={`rotate(${driverPos.heading})`}
          />

          {/* Driver Core Puck */}
          <circle cx="0" cy="0" r="9" fill="#07090E" stroke="#10B981" strokeWidth="3" />
          <circle cx="0" cy="0" r="4" fill="#10B981" />

          {/* Driver Telemetry Tag */}
          <g transform="translate(16, -14)">
            <rect width="92" height="22" rx="6" fill="#07090E" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
            <text x="8" y="14" fill="#F8FAFC" fontSize="9" fontWeight="bold">
              YOU • {dutyState === 'ACTIVE_TRIP' ? `${Math.round(speed)} km/h` : dutyState === 'OFFLINE' ? 'STANDBY' : 'ONLINE'}
            </text>
          </g>
        </g>
      </svg>

      {/* Active Sector Staging Selector (Top-Left below HUD) */}
      {onSelectSector && (
        <div className="absolute left-3 sm:left-4 top-20 z-20 pointer-events-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0F141C]/90 border border-white/10 backdrop-blur-xl shadow-lg text-xs">
            <Compass className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <select
              aria-label="Staging Sector"
              value={sector}
              onChange={(e) => onSelectSector(e.target.value)}
              className="bg-transparent text-white/90 text-[11px] font-bold focus:outline-none cursor-pointer pr-1"
            >
              {KASHMIR_HUBS.map((hub) => (
                <option key={hub} value={hub} className="bg-[#0F141C] text-white">
                  {hub}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Floating Tactical Map Controls (Right Side) */}
      <div className="absolute right-4 top-24 z-20 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setZoom(prev => Math.min(2.2, prev + 0.2))}
          title="Zoom In"
          className="w-10 h-10 rounded-xl bg-[#0F141C]/90 hover:bg-[#1E293B] border border-white/10 text-white flex items-center justify-center shadow-xl backdrop-blur-md transition-all active:scale-95"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => setZoom(prev => Math.max(0.7, prev - 0.2))}
          title="Zoom Out"
          className="w-10 h-10 rounded-xl bg-[#0F141C]/90 hover:bg-[#1E293B] border border-white/10 text-white flex items-center justify-center shadow-xl backdrop-blur-md transition-all active:scale-95"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={resetView}
          title="Re-center Driver GPS"
          className="w-10 h-10 rounded-xl bg-[#0F141C]/90 hover:bg-[#1E293B] border border-white/10 text-emerald-400 flex items-center justify-center shadow-xl backdrop-blur-md transition-all active:scale-95"
        >
          <Crosshair className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => setShowSurge(!showSurge)}
          title="Toggle Surge Demand Heatmap"
          className={`w-10 h-10 rounded-xl border flex items-center justify-center shadow-xl backdrop-blur-md transition-all active:scale-95 ${
            showSurge 
              ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' 
              : 'bg-[#0F141C]/90 border-white/10 text-white/50'
          }`}
        >
          <Flame className="w-4 h-4" />
        </button>
      </div>

      {/* Floating Telemetry Speedometer Strip (Bottom-Right) */}
      {dutyState === 'ACTIVE_TRIP' && (
        <div className="absolute right-4 bottom-72 z-20 bg-[#0F141C]/90 backdrop-blur-xl border border-white/10 px-3.5 py-2 rounded-2xl flex items-center gap-3 shadow-2xl">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Gauge className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-black text-white font-mono tracking-tight leading-none">
              {Math.round(speed)} <span className="text-[10px] text-white/50 font-normal">KM/H</span>
            </div>
            <span className="text-[9px] text-emerald-400 font-bold tracking-wider uppercase">Tangmarg NH1A</span>
          </div>
        </div>
      )}
    </div>
  );
};
