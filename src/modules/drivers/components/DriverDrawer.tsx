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
  Check,
  ChevronLeft,
  AlertCircle,
  Building2,
  UploadCloud,
  FileCheck2,
  Clock,
  Lock
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

  // Pipeline Step State (1: Specs, 2: Union Details, 3: Documents & Submit)
  const [pipelineStep, setPipelineStep] = useState<1 | 2 | 3>(1);
  const [newVehicle, setNewVehicle] = useState({
    model: 'Toyota Innova Crysta',
    plateNumber: '',
    capacity: 6,
    luggageCapacity: 4,
    snowChains: true,
    fourWheelDrive: true,
    skiRack: false,
    multiDayAvailable: true,
    // Tourist Taxi Union & RTO compliance
    unionName: 'Srinagar Airport Tourist Taxi Union',
    unionBadgeNumber: '',
    touristPermitNo: '',
    permitExpiry: '31-12-2026',
    commercialRcNumber: '',
    psvBadgeNo: '',
    fitnessExpiry: '31-10-2026',
    rcDocName: 'RC_Commercial_JK_Front.pdf',
    unionCardName: 'Tourist_Union_Badge_Card.jpg',
    permitDocName: 'All_Valley_Tourist_Permit_2026.pdf',
    declarationAccepted: true
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
      alert('Barah-e-karam Gaadi ka Registration Number Plate darj karein.');
      setPipelineStep(1);
      return;
    }
    if (!newVehicle.unionBadgeNumber.trim()) {
      alert('Tourist Taxi Union Badge / Card Number likhna lazmi hai.');
      setPipelineStep(2);
      return;
    }
    if (!newVehicle.declarationAccepted) {
      alert('Barah-e-karam Union & RTO compliance declaration accept karein.');
      return;
    }

    setIsSubmittingVehicle(true);
    try {
      await onRegisterVehicle({
        model: newVehicle.model,
        plateNumber: newVehicle.plateNumber.toUpperCase().trim(),
        capacity: newVehicle.capacity,
        luggageCapacity: newVehicle.luggageCapacity,
        snowChains: newVehicle.snowChains,
        fourWheelDrive: newVehicle.fourWheelDrive,
        skiRack: newVehicle.skiRack,
        multiDayAvailable: newVehicle.multiDayAvailable,
        unionName: newVehicle.unionName,
        unionBadgeNumber: newVehicle.unionBadgeNumber.toUpperCase().trim(),
        touristPermitNo: newVehicle.touristPermitNo || `JK-TP-${Date.now().toString().slice(-4)}`,
        permitExpiry: newVehicle.permitExpiry,
        commercialRcNumber: newVehicle.commercialRcNumber || newVehicle.plateNumber,
        psvBadgeNo: newVehicle.psvBadgeNo || 'PSV-JK-4412',
        fitnessExpiry: newVehicle.fitnessExpiry,
        verificationStatus: 'PENDING_APPROVAL',
        unionVerified: false,
        rcVerified: false,
        permitVerified: false,
        documents: {
          rcDocUrl: newVehicle.rcDocName,
          unionCardUrl: newVehicle.unionCardName,
          permitDocUrl: newVehicle.permitDocName
        }
      });
      setShowRegisterModal(false);
      setPipelineStep(1);
      setNewVehicle({
        model: 'Toyota Innova Crysta',
        plateNumber: '',
        capacity: 6,
        luggageCapacity: 4,
        snowChains: true,
        fourWheelDrive: true,
        skiRack: false,
        multiDayAvailable: true,
        unionName: 'Srinagar Airport Tourist Taxi Union',
        unionBadgeNumber: '',
        touristPermitNo: '',
        permitExpiry: '31-12-2026',
        commercialRcNumber: '',
        psvBadgeNo: '',
        fitnessExpiry: '31-10-2026',
        rcDocName: 'RC_Commercial_JK_Front.pdf',
        unionCardName: 'Tourist_Union_Badge_Card.jpg',
        permitDocName: 'All_Valley_Tourist_Permit_2026.pdf',
        declarationAccepted: true
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
                  const isApproved = v.verificationStatus === 'APPROVED';
                  const isPending = v.verificationStatus === 'PENDING_APPROVAL';
                  const isRejected = v.verificationStatus === 'REJECTED';

                  return (
                    <div
                      key={v.id}
                      onClick={() => onSelectVehicle(v.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2.5 ${
                        isSelected
                          ? 'bg-[#0F141C] border-amber-500/80 shadow-lg shadow-amber-500/15'
                          : 'bg-white/[0.02] hover:bg-white/[0.05] border-white/5'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            isApproved ? 'bg-emerald-500/15 text-emerald-400' : isPending ? 'bg-amber-500/15 text-amber-400' : 'bg-rose-500/15 text-rose-400'
                          }`}>
                            <Car className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-extrabold text-xs text-white truncate">{v.model}</span>
                              {isSelected && (
                                <Badge className="bg-amber-500 text-slate-950 font-black text-[8px] px-1 py-0">
                                  SELECTED
                                </Badge>
                              )}
                            </div>
                            <span className="font-mono text-[11px] font-bold text-amber-300 block">{v.plateNumber}</span>
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <span className="text-[11px] font-mono text-white/70 block">{v.capacity} Sawari</span>
                          <span className="text-[10px] text-white/40 block">{v.luggageCapacity} Bags</span>
                        </div>
                      </div>

                      {/* Verification Status Pill Bar */}
                      <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-white/5">
                        {isApproved ? (
                          <span className="flex items-center gap-1 text-emerald-400 font-bold">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Union Verified • {v.unionName ? v.unionName.split(' ')[0] : 'Airport'}</span>
                          </span>
                        ) : isPending ? (
                          <span className="flex items-center gap-1 text-amber-400 font-bold animate-pulse">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Pipeline Active: Admin Review Pending</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-rose-400 font-bold">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>Verification Rejected: Check Documents</span>
                          </span>
                        )}

                        <div className="flex items-center gap-1">
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
      {/* 3-Step Tourist Union Verification Pipeline Modal                       */}
      {/* ---------------------------------------------------------------------- */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-[#0F141C] border border-amber-500/40 p-6 shadow-2xl text-white space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">Tourist Union Cab Verification Pipeline</h3>
                  <p className="text-[10px] text-white/50">Kashmir Tourist Taxi Union & RTO Authentication</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowRegisterModal(false);
                  setPipelineStep(1);
                }}
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 3-Step Pipeline Visual Progress Bar */}
            <div className="grid grid-cols-3 gap-2 py-1">
              {[
                { step: 1, label: '1. Gaadi Details', desc: 'Car & Specs' },
                { step: 2, label: '2. Union & Permit', desc: 'Badge & RTO' },
                { step: 3, label: '3. Verification', desc: 'KYC & Admin' }
              ].map(s => {
                const isCurrent = pipelineStep === s.step;
                const isDone = pipelineStep > s.step;
                return (
                  <div
                    key={s.step}
                    onClick={() => {
                      if (s.step < pipelineStep) setPipelineStep(s.step as 1 | 2 | 3);
                    }}
                    className={`p-2 rounded-xl border text-center transition-all ${
                      isCurrent
                        ? 'bg-amber-500/15 border-amber-500 text-amber-300'
                        : isDone
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 cursor-pointer'
                        : 'bg-white/[0.02] border-white/5 text-white/30'
                    }`}
                  >
                    <span className="text-[10px] font-black uppercase tracking-wider block">{s.label}</span>
                    <span className="text-[9px] text-white/50 block">{s.desc}</span>
                  </div>
                );
              })}
            </div>

            {/* STEP 1: VEHICLE SPECIFICATIONS */}
            {pipelineStep === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-white/60 uppercase">Gaadi Ka Model</label>
                    <select
                      value={newVehicle.model}
                      onChange={(e) => setNewVehicle(prev => ({ ...prev, model: e.target.value }))}
                      className="w-full h-11 rounded-xl bg-black/60 border border-white/10 px-3 text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="Toyota Innova Crysta">Toyota Innova Crysta (Commercial)</option>
                      <option value="Toyota Fortuner 4x4">Toyota Fortuner 4x4 Mountain</option>
                      <option value="Mahindra Scorpio-N 4x4">Mahindra Scorpio-N 4x4</option>
                      <option value="Force Urbania Luxury (10 Pax)">Force Urbania Luxury Van (10 Pax)</option>
                      <option value="Toyota Etios Sedan">Toyota Etios Sedan (Tourist)</option>
                      <option value="Maruti Dzire Tour">Maruti Dzire Tour (Commercial)</option>
                      <option value="Tempo Traveller 13 Seater">Force Tempo Traveller (13 Pax)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-white/60 uppercase">Number Plate (Yellow Plate)</label>
                    <Input
                      placeholder="e.g. JK-01-AX-9942"
                      value={newVehicle.plateNumber}
                      onChange={(e) => setNewVehicle(prev => ({ ...prev, plateNumber: e.target.value.toUpperCase() }))}
                      className="h-11 rounded-xl bg-black/60 border-white/10 text-xs font-mono tracking-wider font-bold text-amber-300 uppercase"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-white/60 uppercase">Kitne Mehman (Seats / Pax)</label>
                    <Input
                      type="number"
                      min="2"
                      max="17"
                      value={newVehicle.capacity}
                      onChange={(e) => setNewVehicle(prev => ({ ...prev, capacity: Number(e.target.value) }))}
                      className="h-11 rounded-xl bg-black/60 border-white/10 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-white/60 uppercase">Kitne Bags (Luggage Capacity)</label>
                    <Input
                      type="number"
                      min="1"
                      max="14"
                      value={newVehicle.luggageCapacity}
                      onChange={(e) => setNewVehicle(prev => ({ ...prev, luggageCapacity: Number(e.target.value) }))}
                      className="h-11 rounded-xl bg-black/60 border-white/10 text-xs"
                    />
                  </div>
                </div>

                {/* Kashmir Mountain Equipment */}
                <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-2 text-xs">
                  <span className="text-[10px] font-black uppercase text-amber-400 block tracking-wider">
                    Kashmir Mountain Winter Equipment
                  </span>

                  <label className="flex items-center justify-between cursor-pointer p-1.5 rounded-xl hover:bg-white/5">
                    <div className="flex items-center gap-2">
                      <Snowflake className="w-4 h-4 text-sky-400" />
                      <span className="text-white/80 font-medium">Snow Chains Available (Tangmarg Checkpost)</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={newVehicle.snowChains}
                      onChange={(e) => setNewVehicle(prev => ({ ...prev, snowChains: e.target.checked }))}
                      className="rounded accent-amber-500 w-4 h-4 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer p-1.5 rounded-xl hover:bg-white/5">
                    <div className="flex items-center gap-2">
                      <Compass className="w-4 h-4 text-emerald-400" />
                      <span className="text-white/80 font-medium">4x4 / AWD Mountain Low-Gear System</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={newVehicle.fourWheelDrive}
                      onChange={(e) => setNewVehicle(prev => ({ ...prev, fourWheelDrive: e.target.checked }))}
                      className="rounded accent-amber-500 w-4 h-4 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer p-1.5 rounded-xl hover:bg-white/5">
                    <div className="flex items-center gap-2">
                      <Car className="w-4 h-4 text-amber-400" />
                      <span className="text-white/80 font-medium">Roof Ski / Luggage Rack Installed</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={newVehicle.skiRack}
                      onChange={(e) => setNewVehicle(prev => ({ ...prev, skiRack: e.target.checked }))}
                      className="rounded accent-amber-500 w-4 h-4 cursor-pointer"
                    />
                  </label>
                </div>

                <Button
                  type="button"
                  onClick={() => {
                    if (!newVehicle.plateNumber.trim()) {
                      alert('Barah-e-karam Gaadi ka Registration Number Plate darj karein.');
                      return;
                    }
                    setPipelineStep(2);
                  }}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider gap-2 shadow-lg shadow-amber-500/20"
                >
                  <span>Agla Qadam: Tourist Union & RTO Details</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* STEP 2: TOURIST TAXI UNION & RTO DETAILS */}
            {pipelineStep === 2 && (
              <div className="space-y-4">
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-200 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-300">
                    <Building2 className="w-4 h-4" /> Kashmir Tourist Taxi Union Authentication
                  </div>
                  <p className="text-[11px] text-white/70">
                    Kashmir Curators sirf registered Tourist Taxi Union stands se affiliated cabs allow karta hai.
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-white/60 uppercase">
                      Tourist Taxi Union Stand (यूनियन स्टैंड)
                    </label>
                    <select
                      value={newVehicle.unionName}
                      onChange={(e) => setNewVehicle(prev => ({ ...prev, unionName: e.target.value }))}
                      className="w-full h-11 rounded-xl bg-black/60 border border-white/10 px-3 text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="Srinagar Airport Tourist Taxi Union">✈️ Srinagar Airport Taxi Union (Sheikh-ul-Alam SXR)</option>
                      <option value="TRC Tourist Taxi Stand Union (Srinagar)">🏢 TRC Tourist Taxi Stand Union (Tourist Reception Centre)</option>
                      <option value="Tangmarg–Gulmarg Taxi Operators Union">❄️ Tangmarg / Gulmarg Taxi Operators Union</option>
                      <option value="Pahalgam Tourist Taxi Stand Union">🌲 Pahalgam Tourist Taxi Stand Union</option>
                      <option value="Sonamarg Taxi Operators Union">🏔️ Sonamarg Taxi Operators Union</option>
                      <option value="Nowgam Railway Station Tourist Taxi Stand">🚆 Nowgam Railway Station Tourist Taxi Stand</option>
                      <option value="Dal Lake Ghat Taxi Stand Union">⛵ Dal Lake / Boulevard Tourist Taxi Union</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-white/60 uppercase">
                        Union Card / Badge No. (बैज नंबर) *
                      </label>
                      <Input
                        placeholder="e.g. KT-UNION-4921"
                        value={newVehicle.unionBadgeNumber}
                        onChange={(e) => setNewVehicle(prev => ({ ...prev, unionBadgeNumber: e.target.value.toUpperCase() }))}
                        className="h-11 rounded-xl bg-black/60 border-white/10 text-xs font-mono font-bold text-amber-300 uppercase"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-white/60 uppercase">
                        All Valley Permit No. (परमिट)
                      </label>
                      <Input
                        placeholder="e.g. JK-TP-2026-901"
                        value={newVehicle.touristPermitNo}
                        onChange={(e) => setNewVehicle(prev => ({ ...prev, touristPermitNo: e.target.value.toUpperCase() }))}
                        className="h-11 rounded-xl bg-black/60 border-white/10 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-white/60 uppercase">
                        Commercial RC Number (आरसी)
                      </label>
                      <Input
                        placeholder="e.g. JK01AX9942"
                        value={newVehicle.commercialRcNumber || newVehicle.plateNumber}
                        onChange={(e) => setNewVehicle(prev => ({ ...prev, commercialRcNumber: e.target.value.toUpperCase() }))}
                        className="h-11 rounded-xl bg-black/60 border-white/10 text-xs font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-white/60 uppercase">
                        Driver PSV Badge No. (लाइसेंस बैज)
                      </label>
                      <Input
                        placeholder="e.g. PSV-JK-4412"
                        value={newVehicle.psvBadgeNo}
                        onChange={(e) => setNewVehicle(prev => ({ ...prev, psvBadgeNo: e.target.value.toUpperCase() }))}
                        className="h-11 rounded-xl bg-black/60 border-white/10 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setPipelineStep(1)}
                    className="flex-1 h-12 rounded-xl bg-white/5 border-white/10 text-white text-xs gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Peeche</span>
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      if (!newVehicle.unionBadgeNumber.trim()) {
                        alert('Tourist Taxi Union Badge / Card Number likhna zaroori hai.');
                        return;
                      }
                      setPipelineStep(3);
                    }}
                    className="flex-[2] h-12 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider gap-2 shadow-lg shadow-amber-500/20"
                  >
                    <span>Agla: Dastavezaat & Pipeline</span>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 3: DOCUMENTS ATTACHMENT & ADMIN PIPELINE SUBMIT */}
            {pipelineStep === 3 && (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-2.5 text-xs">
                  <span className="text-[10px] font-black uppercase text-amber-400 block tracking-wider">
                    Attached Verification Documents (दस्तावेज़)
                  </span>

                  <div className="space-y-2">
                    <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileCheck2 className="w-4 h-4 text-emerald-400" />
                        <div>
                          <p className="text-[11px] font-bold text-white">Commercial RC (Front & Back)</p>
                          <span className="text-[9px] text-white/40 font-mono">{newVehicle.rcDocName}</span>
                        </div>
                      </div>
                      <Badge className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 text-[9px]">
                        Attached
                      </Badge>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileCheck2 className="w-4 h-4 text-amber-400" />
                        <div>
                          <p className="text-[11px] font-bold text-white">Tourist Taxi Union Card</p>
                          <span className="text-[9px] text-white/40 font-mono">{newVehicle.unionCardName} • Badge: {newVehicle.unionBadgeNumber}</span>
                        </div>
                      </div>
                      <Badge className="bg-amber-500/15 text-amber-300 border border-amber-500/25 text-[9px]">
                        Attached
                      </Badge>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileCheck2 className="w-4 h-4 text-sky-400" />
                        <div>
                          <p className="text-[11px] font-bold text-white">J&K All Valley Tourist Permit</p>
                          <span className="text-[9px] text-white/40 font-mono">{newVehicle.permitDocName}</span>
                        </div>
                      </div>
                      <Badge className="bg-sky-500/15 text-sky-300 border border-sky-500/25 text-[9px]">
                        Attached
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Admin Pipeline Notice */}
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-amber-300">
                    <ShieldCheck className="w-4 h-4" /> Admin & Union Authentication Pipeline
                  </div>
                  <p className="text-[11px] text-white/70 leading-relaxed">
                    Gaadi submit karne ke baad yeh seedhe hamare Transport Admin Desk aur Tourist Taxi Union verification pipeline me jayegi. Admin ke tasdeeq (approval) ke baad hi yeh gaadi live radar pe tourist bookings ke liye active hogi.
                  </p>
                </div>

                {/* Declaration Checkbox */}
                <label className="flex items-start gap-2.5 p-2 rounded-xl bg-white/[0.02] border border-white/5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newVehicle.declarationAccepted}
                    onChange={(e) => setNewVehicle(prev => ({ ...prev, declarationAccepted: e.target.checked }))}
                    className="rounded accent-amber-500 w-4 h-4 mt-0.5 cursor-pointer shrink-0"
                  />
                  <span className="text-[11px] text-white/80 leading-snug">
                    Main tasdeeq karta hoon ki meri gaadi valid Commercial Tourist Permit aur Kashmir Tourist Taxi Union se registered hai.
                  </span>
                </label>

                <div className="flex gap-2.5 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setPipelineStep(2)}
                    className="flex-1 h-12 rounded-xl bg-white/5 border-white/10 text-white text-xs gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Peeche</span>
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmittingVehicle || !newVehicle.declarationAccepted}
                    className="flex-[2] h-12 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-slate-950 font-black text-xs uppercase tracking-wider shadow-xl shadow-amber-500/30"
                  >
                    {isSubmittingVehicle ? 'Pipeline Me Submit Ho Rahi Hai...' : 'Verification Pipeline Me Bhejein ➔'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
