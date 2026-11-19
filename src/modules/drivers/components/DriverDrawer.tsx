import React, { useState } from 'react';
import { 
  X, 
  Car, 
  PlusCircle, 
  ShieldCheck, 
  CreditCard, 
  Star, 
  Snowflake, 
  Compass, 
  CheckCircle2, 
  ExternalLink,
  ChevronRight,
  Plane,
  Train,
  FileText,
  BadgeCheck,
  User,
  ArrowUpRight,
  Tag,
  Flame,
  Moon,
  Save,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DriverVehicle, DriverEarnings, DriverRateCard } from '../types/driver';

interface DriverDrawerProps {
  open: boolean;
  onClose: () => void;
  vehicles: DriverVehicle[];
  activeVehicleId: string;
  onSelectVehicle: (id: string) => void;
  onRegisterVehicle: (vehicle: Partial<DriverVehicle>) => Promise<void>;
  earnings: DriverEarnings;
  onRequestPayout: () => void;
  isPayoutProcessing?: boolean;
  onSaveRateCard: (vehicleId: string, rateCard: DriverRateCard) => Promise<void>;
}

const DEFAULT_RATES: DriverRateCard = {
  airportTransfer: 1200,
  railwayTransfer: 1400,
  gulmargTransfer: 2800,
  pahalgamTransfer: 3400,
  sonamargTransfer: 3800,
  doodhpathriTransfer: 2400,
  localSightseeing: 2200,
  snowChainSurcharge: 1000,
  snowChainActive: true,
  heaterSurcharge: 300,
  heaterActive: true,
  nightSurcharge: 500
};

export const DriverDrawer: React.FC<DriverDrawerProps> = ({
  open,
  onClose,
  vehicles,
  activeVehicleId,
  onSelectVehicle,
  onRegisterVehicle,
  earnings,
  onRequestPayout,
  isPayoutProcessing = false,
  onSaveRateCard,
}) => {
  const [activeTab, setActiveTab] = useState<'fleet' | 'rateCard' | 'earnings'>('fleet');
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [isSubmittingVehicle, setIsSubmittingVehicle] = useState(false);
  const [isSavingRates, setIsSavingRates] = useState(false);

  const activeVehicle = vehicles.find(v => v.id === activeVehicleId) || vehicles[0];

  // Driver custom rate card state
  const [rateCard, setRateCard] = useState<DriverRateCard>(
    activeVehicle?.rateCard || DEFAULT_RATES
  );

  // New vehicle registration form state
  const [newVehicle, setNewVehicle] = useState({
    model: 'Toyota Innova Crysta',
    plateNumber: '',
    capacity: 6,
    luggageCapacity: 4,
    snowChains: true,
    fourWheelDrive: true,
    skiRack: false,
    multiDayAvailable: true,
  });

  if (!open) return null;

  const handleStepPrice = (key: keyof DriverRateCard, delta: number) => {
    setRateCard(prev => ({
      ...prev,
      [key]: Math.max(500, (Number(prev[key]) || 0) + delta)
    }));
  };

  const handleSaveRates = async () => {
    setIsSavingRates(true);
    try {
      await onSaveRateCard(activeVehicleId, rateCard);
    } finally {
      setIsSavingRates(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVehicle.plateNumber.trim()) {
      alert('Please enter vehicle registration plate number.');
      return;
    }

    setIsSubmittingVehicle(true);
    try {
      await onRegisterVehicle(newVehicle);
      setShowRegisterModal(false);
      setNewVehicle({
        model: 'Toyota Innova Crysta',
        plateNumber: '',
        capacity: 6,
        luggageCapacity: 4,
        snowChains: true,
        fourWheelDrive: true,
        skiRack: false,
        multiDayAvailable: true,
      });
    } finally {
      setIsSubmittingVehicle(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      />

      {/* Slide-out Drawer Panel */}
      <div className="relative w-full max-w-sm sm:max-w-md h-full bg-[#07090E] border-r border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.9)] flex flex-col z-10 animate-in slide-in-from-left duration-250 text-white">
        {/* Drawer Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-[#0F141C] to-[#07090E]">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-black text-lg shadow-lg">
                Z
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 border-2 border-[#07090E] rounded-full" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-sm text-white">Zahid Ahmad (Chauffeur)</h3>
                <BadgeCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              </div>
              <div className="flex items-center gap-2 text-[11px] text-white/50">
                <span className="flex items-center text-amber-400 font-bold">
                  <Star className="w-3 h-3 fill-amber-400 mr-0.5" /> 4.93
                </span>
                <span>• 148 Trips</span>
                <span>• JK Taxi Union #104</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Simple Tabs (Fleet | Mera Kiraya | Kamai) */}
        <div className="flex p-2 bg-[#0F141C] border-b border-white/10 gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('fleet')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
              activeTab === 'fleet'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            🚗 Meri Gaadi
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rateCard')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
              activeTab === 'rateCard'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            🏷️ Mera Kiraya
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('earnings')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
              activeTab === 'earnings'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            💰 Kamai & Bank
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin scrollbar-thumb-white/10">
          {/* ================================================================ */}
          {/* TAB 1: FLEET & ACTIVE VEHICLE                                    */}
          {/* ================================================================ */}
          {activeTab === 'fleet' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-white">Active Cab Selection</h4>
                  <p className="text-[10px] text-white/40">Select the cab you are driving right now</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowRegisterModal(true)}
                  className="h-8 rounded-xl bg-white/5 hover:bg-amber-500/15 border-white/10 hover:border-amber-500/30 text-amber-300 text-[10px] font-bold gap-1"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Nayi Gaadi Add Karein
                </Button>
              </div>

              <div className="space-y-2.5">
                {vehicles.map((v) => {
                  const isSelected = v.id === activeVehicleId;
                  return (
                    <div
                      key={v.id}
                      onClick={() => onSelectVehicle(v.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-[#0F141C] border-amber-500/80 shadow-lg shadow-amber-500/15'
                          : 'bg-white/[0.02] hover:bg-white/[0.05] border-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 text-white/40'
                        }`}>
                          <Car className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-xs text-white truncate">{v.model}</span>
                            {isSelected && (
                              <Badge className="bg-emerald-500 text-slate-950 font-black text-[8px] px-1 py-0">
                                ACTIVE
                              </Badge>
                            )}
                          </div>
                          <span className="font-mono text-[11px] font-bold text-amber-300 block">{v.plateNumber}</span>
                          <div className="flex items-center gap-1 mt-1">
                            {v.fourWheelDrive && (
                              <span className="text-[8px] font-black uppercase bg-emerald-500/15 text-emerald-300 border border-emerald-500/20 px-1 py-0 rounded">
                                4x4
                              </span>
                            )}
                            {v.snowChains && (
                              <span className="text-[8px] font-black uppercase bg-sky-500/15 text-sky-300 border border-sky-500/20 px-1 py-0 rounded">
                                Chains
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <span className="text-[11px] font-mono text-white/70 block">{v.capacity} Sawari</span>
                        <span className="text-[10px] text-white/40 block">{v.luggageCapacity} Bags</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Verified Kashmir Transport Guidelines */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2 text-xs text-white/70">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">
                  Tourist Pickup Stands
                </span>
                <p className="text-[11px] leading-relaxed">
                  ✈️ <strong>Hawai Adda (SXR Airport):</strong> Stage vehicle in Commercial Taxi Lane B at Terminal Gate 2.
                </p>
                <p className="text-[11px] leading-relaxed">
                  🚆 <strong>Railway Station (Nowgam):</strong> Stage at Main Parking Port 1 near Platform 1 exit.
                </p>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 2: MERA KIRAYA / RATE CARD (Custom Driver Tariffs)            */}
          {/* ================================================================ */}
          {activeTab === 'rateCard' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-1">
                <h4 className="font-extrabold text-amber-300 flex items-center gap-1.5">
                  <Tag className="w-4 h-4" /> Apna Kiraya Set Karein (Rate Card)
                </h4>
                <p className="text-[11px] text-white/70 leading-relaxed">
                  Yahan aap apne sector rates set kar sakte hain. Tourists ko yahi rates dikhenge aur aapko fair kamai milegi.
                </p>
              </div>

              {/* Standard Kashmir Sectors */}
              <div className="space-y-3">
                {/* 1. Airport SXR */}
                <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between gap-3">
                  <div>
                    <span className="font-bold text-xs text-white block">✈️ Srinagar Airport (SXR)</span>
                    <span className="text-[10px] text-white/40">Hawai Adda Transfer</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleStepPrice('airportTransfer', -100)}
                      className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white font-bold"
                    >
                      -
                    </button>
                    <span className="font-mono font-black text-amber-400 text-sm min-w-[60px] text-center">
                      ₹{rateCard.airportTransfer}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleStepPrice('airportTransfer', 100)}
                      className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* 2. Railway Station Nowgam */}
                <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between gap-3">
                  <div>
                    <span className="font-bold text-xs text-white block">🚆 Railway Station (Nowgam)</span>
                    <span className="text-[10px] text-white/40">Train Terminal Transfer</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleStepPrice('railwayTransfer', -100)}
                      className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white font-bold"
                    >
                      -
                    </button>
                    <span className="font-mono font-black text-emerald-400 text-sm min-w-[60px] text-center">
                      ₹{rateCard.railwayTransfer}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleStepPrice('railwayTransfer', 100)}
                      className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* 3. Gulmarg Trip */}
                <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between gap-3">
                  <div>
                    <span className="font-bold text-xs text-white block">🏔️ Gulmarg Gondola / Highlands</span>
                    <span className="text-[10px] text-white/40">52 km Alpine Ascent</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleStepPrice('gulmargTransfer', -100)}
                      className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white font-bold"
                    >
                      -
                    </button>
                    <span className="font-mono font-black text-amber-400 text-sm min-w-[60px] text-center">
                      ₹{rateCard.gulmargTransfer}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleStepPrice('gulmargTransfer', 100)}
                      className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* 4. Pahalgam Valley */}
                <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between gap-3">
                  <div>
                    <span className="font-bold text-xs text-white block">🌲 Pahalgam Valley (Betaab/Aru)</span>
                    <span className="text-[10px] text-white/40">88 km Scenic Route</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleStepPrice('pahalgamTransfer', -100)}
                      className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white font-bold"
                    >
                      -
                    </button>
                    <span className="font-mono font-black text-amber-400 text-sm min-w-[60px] text-center">
                      ₹{rateCard.pahalgamTransfer}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleStepPrice('pahalgamTransfer', 100)}
                      className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* 5. Sonamarg Glacier */}
                <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between gap-3">
                  <div>
                    <span className="font-bold text-xs text-white block">🌊 Sonamarg (Thajiwas Glacier)</span>
                    <span className="text-[10px] text-white/40">85 km Valley Route</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleStepPrice('sonamargTransfer', -100)}
                      className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white font-bold"
                    >
                      -
                    </button>
                    <span className="font-mono font-black text-amber-400 text-sm min-w-[60px] text-center">
                      ₹{rateCard.sonamargTransfer}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleStepPrice('sonamargTransfer', 100)}
                      className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Special Winter & Night Surcharges */}
              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
                <span className="text-[10px] font-black uppercase text-amber-400 block tracking-wider">
                  Mausam & Night Extra Charges
                </span>

                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="text-white font-bold block">❄️ Tangmarg Snow Chain Extra</span>
                    <span className="text-[10px] text-white/40">+₹{rateCard.snowChainSurcharge} when snow advisory active</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={rateCard.snowChainActive}
                    onChange={(e) => setRateCard(prev => ({ ...prev, snowChainActive: e.target.checked }))}
                    className="w-5 h-5 rounded accent-amber-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="text-white font-bold block">🔥 Vehicle Heater / Bukhari</span>
                    <span className="text-[10px] text-white/40">+₹{rateCard.heaterSurcharge} for warm cabin</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={rateCard.heaterActive}
                    onChange={(e) => setRateCard(prev => ({ ...prev, heaterActive: e.target.checked }))}
                    className="w-5 h-5 rounded accent-amber-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="text-white font-bold block">🌙 Raat Ka Safar (After 8 PM)</span>
                    <span className="text-[10px] text-white/40">+₹{rateCard.nightSurcharge} for late night trains/flights</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={Boolean(rateCard.nightSurcharge > 0)}
                    onChange={(e) => setRateCard(prev => ({ ...prev, nightSurcharge: e.target.checked ? 500 : 0 }))}
                    className="w-5 h-5 rounded accent-amber-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Save Rate Card Button */}
              <Button
                type="button"
                disabled={isSavingRates}
                onClick={handleSaveRates}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 gap-2"
              >
                <Save className="w-4 h-4 stroke-[2.5]" />
                {isSavingRates ? 'Rates Save Ho Rahe Hain...' : 'Mera Rate Card Save Karein'}
              </Button>
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 3: EARNINGS & BANK PAYOUT (Kamai)                            */}
          {/* ================================================================ */}
          {activeTab === 'earnings' && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/15 via-[#0F141C] to-black/90 border border-amber-500/30 text-center space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block">Aaj Ki Total Kamai</span>
                <div className="text-3xl font-black font-mono text-white">
                  ₹{earnings.todayTotal.toLocaleString('en-IN')}.00
                </div>
                <span className="text-[11px] text-white/60 block">Registered UPI: {earnings.upiId}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="text-[10px] text-white/40 uppercase block mb-1">Total Trips</span>
                  <span className="font-extrabold text-white text-lg">{earnings.tripsCount} Completed</span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="text-[10px] text-white/40 uppercase block mb-1">Duty Time</span>
                  <span className="font-extrabold text-white text-lg">{earnings.onlineHours}</span>
                </div>
              </div>

              <Button
                disabled={isPayoutProcessing || earnings.todayTotal <= 0}
                onClick={onRequestPayout}
                className="w-full h-12 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider gap-2 shadow-lg shadow-emerald-500/20"
              >
                <ArrowUpRight className="w-4 h-4 stroke-[3]" />
                {isPayoutProcessing ? 'Bank Me Bhej Rahe Hain...' : 'Apne Bank / UPI Me Paisa Bhejein'}
              </Button>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-white/10 bg-[#0F141C] text-center text-[10px] text-white/40">
          Kashmir Curators Chauffeur OS • Connected to Neon DB
        </div>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* Register New Cab Modal */}
      {/* ---------------------------------------------------------------------- */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl bg-[#0F141C] border border-amber-500/30 p-6 shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400">
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">Nayi Gaadi Add Karein</h3>
                  <p className="text-[10px] text-white/50">Apni cab registered karein</p>
                </div>
              </div>
              <button 
                onClick={() => setShowRegisterModal(false)}
                className="p-1 rounded-lg text-white/40 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-white/50 uppercase">Gaadi Ka Model</label>
                  <select
                    value={newVehicle.model}
                    onChange={(e) => setNewVehicle(prev => ({ ...prev, model: e.target.value }))}
                    className="w-full h-10 rounded-xl bg-black/50 border border-white/10 px-3 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Toyota Innova Crysta">Toyota Innova Crysta</option>
                    <option value="Toyota Fortuner 4x4">Toyota Fortuner 4x4</option>
                    <option value="Mahindra Scorpio-N 4x4">Mahindra Scorpio-N 4x4</option>
                    <option value="Force Urbania Luxury (10 Pax)">Force Urbania Luxury (10 Pax)</option>
                    <option value="Toyota Etios Sedan">Toyota Etios Sedan</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-white/50 uppercase">Number Plate</label>
                  <Input
                    placeholder="e.g. JK-01-AX-9942"
                    value={newVehicle.plateNumber}
                    onChange={(e) => setNewVehicle(prev => ({ ...prev, plateNumber: e.target.value.toUpperCase() }))}
                    className="h-10 rounded-xl bg-black/50 border-white/10 text-xs font-mono"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-white/50 uppercase">Kitne Mehman (Pax)</label>
                  <Input
                    type="number"
                    min="2"
                    max="14"
                    value={newVehicle.capacity}
                    onChange={(e) => setNewVehicle(prev => ({ ...prev, capacity: Number(e.target.value) }))}
                    className="h-10 rounded-xl bg-black/50 border-white/10 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-white/50 uppercase">Kitne Bags (Luggage)</label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={newVehicle.luggageCapacity}
                    onChange={(e) => setNewVehicle(prev => ({ ...prev, luggageCapacity: Number(e.target.value) }))}
                    className="h-10 rounded-xl bg-black/50 border-white/10 text-xs"
                  />
                </div>
              </div>

              {/* Alpine Feature Switches */}
              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 space-y-2 text-xs">
                <span className="text-[10px] font-black uppercase text-amber-400 block">Kashmir Winter Toggles</span>
                
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-white/80">Snow Chains Available</span>
                  <input
                    type="checkbox"
                    checked={newVehicle.snowChains}
                    onChange={(e) => setNewVehicle(prev => ({ ...prev, snowChains: e.target.checked }))}
                    className="rounded accent-amber-500 w-4 h-4"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-white/80">4x4 / AWD System</span>
                  <input
                    type="checkbox"
                    checked={newVehicle.fourWheelDrive}
                    onChange={(e) => setNewVehicle(prev => ({ ...prev, fourWheelDrive: e.target.checked }))}
                    className="rounded accent-amber-500 w-4 h-4"
                  />
                </label>
              </div>

              <Button
                type="submit"
                disabled={isSubmittingVehicle}
                className="w-full h-11 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider"
              >
                {isSubmittingVehicle ? 'Gaadi Add Ho Rahi Hai...' : 'Gaadi Fleet Me Add Karein'}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
