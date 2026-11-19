import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
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
  ChevronDown,
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
  Lock,
  Mountain,
  Trees,
  Waves
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DriverVehicle, DriverEarnings, DriverRateCard } from '../types/driver';

// Vehicle Model Options for Luxury Dropdown
interface VehicleModelOption {
  value: string;
  label: string;
  shortName: string;
  subtitle: string;
  capacity: number;
  luggage: number;
  fourWheelDrive: boolean;
  badge: string;
  badgeColor: 'emerald' | 'amber' | 'purple' | 'sky';
}

const VEHICLE_MODEL_OPTIONS: VehicleModelOption[] = [
  {
    value: 'Toyota Innova Crysta',
    label: 'Toyota Innova Crysta (Commercial)',
    shortName: 'Toyota Innova Crysta',
    subtitle: '6 Seats • 4 Luggage Bags • Commercial MUV',
    capacity: 6,
    luggage: 4,
    fourWheelDrive: false,
    badge: 'Most Popular',
    badgeColor: 'amber'
  },
  {
    value: 'Toyota Fortuner 4x4',
    label: 'Toyota Fortuner 4x4 Mountain',
    shortName: 'Toyota Fortuner 4x4',
    subtitle: '6 Seats • 4 Luggage Bags • High Altitude SUV',
    capacity: 6,
    luggage: 4,
    fourWheelDrive: true,
    badge: '4x4 Snow King',
    badgeColor: 'emerald'
  },
  {
    value: 'Mahindra Scorpio-N 4x4',
    label: 'Mahindra Scorpio-N 4x4',
    shortName: 'Mahindra Scorpio-N 4x4',
    subtitle: '6 Seats • 3 Luggage Bags • Alpine 4WD',
    capacity: 6,
    luggage: 3,
    fourWheelDrive: true,
    badge: '4x4 Mountain',
    badgeColor: 'emerald'
  },
  {
    value: 'Force Urbania Luxury (10 Pax)',
    label: 'Force Urbania Luxury Van (10 Pax)',
    shortName: 'Force Urbania Luxury Van',
    subtitle: '10 Seats • 8 Luggage Bags • VIP Recliner Van',
    capacity: 10,
    luggage: 8,
    fourWheelDrive: false,
    badge: 'Luxury VIP',
    badgeColor: 'purple'
  },
  {
    value: 'Toyota Etios Sedan',
    label: 'Toyota Etios Sedan (Tourist)',
    shortName: 'Toyota Etios Sedan',
    subtitle: '4 Seats • 2 Luggage Bags • Tourist Sedan',
    capacity: 4,
    luggage: 2,
    fourWheelDrive: false,
    badge: 'Tourist Sedan',
    badgeColor: 'sky'
  },
  {
    value: 'Maruti Dzire Tour',
    label: 'Maruti Dzire Tour (Commercial)',
    shortName: 'Maruti Dzire Tour',
    subtitle: '4 Seats • 2 Luggage Bags • City & Airport Express',
    capacity: 4,
    luggage: 2,
    fourWheelDrive: false,
    badge: 'Commercial',
    badgeColor: 'sky'
  },
  {
    value: 'Tempo Traveller 13 Seater',
    label: 'Force Tempo Traveller (13 Pax)',
    shortName: 'Force Tempo Traveller',
    subtitle: '13 Seats • 10 Luggage Bags • Large Group Coach',
    capacity: 13,
    luggage: 10,
    fourWheelDrive: false,
    badge: 'Group Coach',
    badgeColor: 'amber'
  }
];

// Tourist Taxi Union Stand Options for Luxury Dropdown
interface TaxiUnionOption {
  value: string;
  label: string;
  standLocation: string;
  badge: string;
}

const TAXI_UNION_OPTIONS: TaxiUnionOption[] = [
  {
    value: 'Srinagar Airport Tourist Taxi Union',
    label: 'Srinagar Airport Taxi Union',
    standLocation: 'Sheikh-ul-Alam SXR Terminal Gate 2',
    badge: 'Airport Hub'
  },
  {
    value: 'TRC Tourist Taxi Stand Union (Srinagar)',
    label: 'TRC Tourist Taxi Stand Union',
    standLocation: 'Tourist Reception Centre, Residency Road',
    badge: 'Central Srinagar'
  },
  {
    value: 'Tangmarg–Gulmarg Taxi Operators Union',
    label: 'Tangmarg / Gulmarg Taxi Operators Union',
    standLocation: 'Tangmarg Snow Chain Checkpoint & Gulmarg Base',
    badge: 'Gulmarg Sector'
  },
  {
    value: 'Pahalgam Tourist Taxi Stand Union',
    label: 'Pahalgam Tourist Taxi Stand Union',
    standLocation: 'Lidder Valley Main Stand & Aru Road',
    badge: 'Pahalgam Sector'
  },
  {
    value: 'Sonamarg Taxi Operators Union',
    label: 'Sonamarg Taxi Operators Union',
    standLocation: 'Sonamarg Main Market & Baltal Route',
    badge: 'Sonamarg Sector'
  },
  {
    value: 'Nowgam Railway Station Tourist Taxi Stand',
    label: 'Nowgam Railway Station Tourist Taxi Stand',
    standLocation: 'Srinagar Rail Link Main Portico Gate 1',
    badge: 'Railway Hub'
  },
  {
    value: 'Dal Lake Ghat Taxi Stand Union',
    label: 'Dal Lake / Boulevard Tourist Taxi Union',
    standLocation: 'Boulevard Road Ghats 1-12 & Nigeen Pier',
    badge: 'Lakefront Hub'
  }
];

// Luxury Obsidian Dark-Themed Checkbox Component
interface LuxuryCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
  className?: string;
  ariaLabel?: string;
}

const LuxuryCheckbox: React.FC<LuxuryCheckboxProps> = ({ 
  checked, 
  onChange, 
  id, 
  className = '',
  ariaLabel
}) => {
  return (
    <button
      type="button"
      id={id}
      role="checkbox"
      aria-label={ariaLabel}
      aria-checked={checked}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      className={`relative w-5 h-5 rounded-md flex items-center justify-center transition-all duration-200 shrink-0 select-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400/40 ${
        checked
          ? 'bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 border border-amber-300 text-slate-950 shadow-[0_0_10px_rgba(245,158,11,0.4)]'
          : 'bg-black/60 border border-white/20 hover:border-amber-400/50 hover:bg-white/[0.04] text-transparent'
      } ${className}`}
    >
      <Check 
        className={`w-3.5 h-3.5 stroke-[3.5] transition-all duration-150 ${
          checked ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
        }`} 
      />
    </button>
  );
};

// Luxury Animated iOS / Uber Driver-Style Toggle Switch
interface LuxuryToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
  ariaLabel?: string;
}

const LuxuryToggleSwitch: React.FC<LuxuryToggleSwitchProps> = ({ 
  checked, 
  onChange, 
  id, 
  ariaLabel 
}) => {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-400/50 ${
        checked 
          ? 'bg-gradient-to-r from-amber-400 to-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.5)]' 
          : 'bg-white/10 border border-white/15'
      }`}
    >
      <span
        className={`pointer-events-none inline-flex h-6 w-6 transform rounded-full shadow-md transition duration-200 ease-in-out items-center justify-center ${
          checked 
            ? 'translate-x-5 bg-slate-950 text-amber-400' 
            : 'translate-x-0 bg-white/85 text-black/30'
        }`}
      >
        {checked ? (
          <Check className="w-3.5 h-3.5 stroke-[3.5]" />
        ) : (
          <span className="w-1.5 h-1.5 rounded-full bg-black/40" />
        )}
      </span>
    </button>
  );
};

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
  const [formError, setFormError] = useState<string | null>(null);
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

  // Modern Luxury Dropdown States
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isUnionDropdownOpen, setIsUnionDropdownOpen] = useState(false);
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const unionDropdownRef = useRef<HTMLDivElement>(null);

  // Click outside listener for luxury dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
        setIsModelDropdownOpen(false);
      }
      if (unionDropdownRef.current && !unionDropdownRef.current.contains(event.target as Node)) {
        setIsUnionDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsModelDropdownOpen(false);
        setIsUnionDropdownOpen(false);
      }
    };

    if (isModelDropdownOpen || isUnionDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isModelDropdownOpen, isUnionDropdownOpen]);

  const selectedModelOpt = VEHICLE_MODEL_OPTIONS.find(o => o.value === newVehicle.model) || VEHICLE_MODEL_OPTIONS[0];
  const selectedUnionOpt = TAXI_UNION_OPTIONS.find(u => u.value === newVehicle.unionName) || TAXI_UNION_OPTIONS[0];

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
      toast.success('Rate Card Updated', {
        description: 'Your custom fares and seasonal surcharges have been saved.'
      });
    } finally {
      setIsSavingRates(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVehicle.plateNumber.trim()) {
      setFormError('Please enter the vehicle registration number plate (e.g. JK-01-AX-9942).');
      toast.warning('Registration Plate Required', {
        description: 'A commercial yellow registration plate number is required.'
      });
      setPipelineStep(1);
      return;
    }
    if (!newVehicle.unionBadgeNumber.trim()) {
      setFormError('Tourist Taxi Union Badge / ID is required (e.g. SXR-STAND-092).');
      toast.warning('Union Badge Required', {
        description: 'Please enter your affiliated Taxi Union badge number.'
      });
      setPipelineStep(2);
      return;
    }
    if (!newVehicle.declarationAccepted) {
      setFormError('Please accept the Union & RTO compliance declaration.');
      toast.warning('Declaration Required', {
        description: 'Please review and accept the compliance declaration.'
      });
      return;
    }

    setFormError(null);
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
      toast.success('Submitted for Union Verification', {
        description: 'Transport Admin and Taxi Union Desk will review and authorize your vehicle.'
      });
      setShowRegisterModal(false);
      setPipelineStep(1);
      setIsModelDropdownOpen(false);
      setIsUnionDropdownOpen(false);
      setFormError(null);
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

        {/* 3 Simple Tabs (Fleet | Rate Card | Earnings) */}
        <div className="flex p-2 bg-[#0F141C] border-b border-white/10 gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('fleet')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'fleet'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            <Car className="w-4 h-4 stroke-[2.2]" />
            <span>My Fleet</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rateCard')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'rateCard'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            <Tag className="w-4 h-4 stroke-[2.2]" />
            <span>Rate Card</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('earnings')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'earnings'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            <CreditCard className="w-4 h-4 stroke-[2.2]" />
            <span>Earnings & Payout</span>
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
                  className="h-8 rounded-xl bg-white/5 hover:bg-amber-500/15 border-white/10 hover:border-amber-500/30 text-amber-300 text-[10px] font-bold gap-1.5"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Register Vehicle
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
                          <span className="text-[11px] font-mono text-white/70 block">{v.capacity} Seats</span>
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
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2.5 text-xs text-white/70">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">
                  Tourist Pickup Stands
                </span>
                <div className="space-y-2 text-[11px] leading-relaxed">
                  <div className="flex items-start gap-2">
                    <Plane className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white">Srinagar International Airport (SXR):</strong> Stage vehicle in Commercial Taxi Lane B at Terminal Gate 2.
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Train className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white">Srinagar Railway Station (Nowgam):</strong> Stage at Main Parking Port 1 near Platform 1 exit.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 2: RATE CARD & SURCHARGES (Custom Driver Tariffs)             */}
          {/* ================================================================ */}
          {activeTab === 'rateCard' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-1">
                <h4 className="font-extrabold text-amber-300 flex items-center gap-1.5">
                  <Tag className="w-4 h-4" /> Driver Fare Matrix & Surcharges
                </h4>
                <p className="text-[11px] text-white/70 leading-relaxed">
                  Configure your standard sector fares and seasonal surcharges. Tourists booking your vehicle pay these rates directly.
                </p>
              </div>

              {/* Standard Kashmir Sectors */}
              <div className="space-y-3">
                {/* 1. Airport SXR */}
                <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Plane className="w-4 h-4 text-sky-400 shrink-0" />
                      <span className="font-bold text-xs text-white">Srinagar Airport (SXR)</span>
                    </div>
                    <span className="text-[10px] text-white/40 block">Airport Terminal Transfer</span>
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
                    <div className="flex items-center gap-2">
                      <Train className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="font-bold text-xs text-white">Railway Station (Nowgam)</span>
                    </div>
                    <span className="text-[10px] text-white/40 block">Kashmir Rail Terminal Transfer</span>
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
                    <div className="flex items-center gap-2">
                      <Mountain className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="font-bold text-xs text-white">Gulmarg Gondola & Highlands</span>
                    </div>
                    <span className="text-[10px] text-white/40 block">52 km Alpine Ascent Route</span>
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
                    <div className="flex items-center gap-2">
                      <Trees className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="font-bold text-xs text-white">Pahalgam Valley (Betaab / Aru)</span>
                    </div>
                    <span className="text-[10px] text-white/40 block">88 km South Kashmir Route</span>
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
                    <div className="flex items-center gap-2">
                      <Waves className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span className="font-bold text-xs text-white">Sonamarg (Thajiwas Glacier)</span>
                    </div>
                    <span className="text-[10px] text-white/40 block">85 km Sindh River Valley Route</span>
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
                  Weather & Night Surcharges
                </span>

                <div 
                  onClick={() => setRateCard(prev => ({ ...prev, snowChainActive: !prev.snowChainActive }))}
                  className={`flex items-center justify-between text-xs p-3 rounded-2xl border transition-all cursor-pointer select-none ${
                    rateCard.snowChainActive ? 'bg-amber-500/[0.08] border-amber-500/40' : 'bg-white/[0.02] border-white/5 hover:border-white/15'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Snowflake className="w-3.5 h-3.5 text-sky-400" />
                      <span className="text-white font-bold block">Tangmarg Snow Chain Surcharge</span>
                    </div>
                    <span className="text-[10px] text-white/50 block">+₹{rateCard.snowChainSurcharge} when snow advisory is active</span>
                  </div>
                  <LuxuryToggleSwitch
                    checked={rateCard.snowChainActive}
                    onChange={(checked) => setRateCard(prev => ({ ...prev, snowChainActive: checked }))}
                    ariaLabel="Toggle snow chain surcharge"
                  />
                </div>

                <div 
                  onClick={() => setRateCard(prev => ({ ...prev, heaterActive: !prev.heaterActive }))}
                  className={`flex items-center justify-between text-xs p-3 rounded-2xl border transition-all cursor-pointer select-none ${
                    rateCard.heaterActive ? 'bg-amber-500/[0.08] border-amber-500/40' : 'bg-white/[0.02] border-white/5 hover:border-white/15'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-white font-bold block">Cabin Climate Heater</span>
                    </div>
                    <span className="text-[10px] text-white/50 block">+₹{rateCard.heaterSurcharge} for warm cabin comfort</span>
                  </div>
                  <LuxuryToggleSwitch
                    checked={rateCard.heaterActive}
                    onChange={(checked) => setRateCard(prev => ({ ...prev, heaterActive: checked }))}
                    ariaLabel="Toggle vehicle heater surcharge"
                  />
                </div>

                <div 
                  onClick={() => setRateCard(prev => ({ ...prev, nightSurcharge: prev.nightSurcharge > 0 ? 0 : 500 }))}
                  className={`flex items-center justify-between text-xs p-3 rounded-2xl border transition-all cursor-pointer select-none ${
                    rateCard.nightSurcharge > 0 ? 'bg-amber-500/[0.08] border-amber-500/40' : 'bg-white/[0.02] border-white/5 hover:border-white/15'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Moon className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="text-white font-bold block">Late Night Departure (After 8 PM)</span>
                    </div>
                    <span className="text-[10px] text-white/50 block">+₹{rateCard.nightSurcharge || 500} for late night arrivals</span>
                  </div>
                  <LuxuryToggleSwitch
                    checked={Boolean(rateCard.nightSurcharge > 0)}
                    onChange={(checked) => setRateCard(prev => ({ ...prev, nightSurcharge: checked ? 500 : 0 }))}
                    ariaLabel="Toggle night surcharge"
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
                {isSavingRates ? 'Saving Rates...' : 'Save Rate Card'}
              </Button>
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 3: EARNINGS & BANK PAYOUT                                   */}
          {/* ================================================================ */}
          {activeTab === 'earnings' && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/15 via-[#0F141C] to-black/90 border border-amber-500/30 text-center space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block">Today's Gross Earnings</span>
                <div className="text-3xl font-black font-mono text-white">
                  ₹{earnings.todayTotal.toLocaleString('en-IN')}.00
                </div>
                <span className="text-[11px] text-white/60 block">Registered Payout UPI: {earnings.upiId}</span>
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
                {isPayoutProcessing ? 'Processing Transfer...' : 'Withdraw to Bank / UPI'}
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
                  setIsModelDropdownOpen(false);
                  setIsUnionDropdownOpen(false);
                  setFormError(null);
                }}
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 3-Step Pipeline Visual Progress Bar */}
            <div className="grid grid-cols-3 gap-2 py-1">
              {[
                { step: 1, label: '1. Vehicle Specs', desc: 'Model & Capacity' },
                { step: 2, label: '2. Union & Permits', desc: 'Badge & RTO' },
                { step: 3, label: '3. Verification', desc: 'KYC & Review' }
              ].map(s => {
                const isCurrent = pipelineStep === s.step;
                const isDone = pipelineStep > s.step;
                return (
                  <div
                    key={s.step}
                    onClick={() => {
                      if (s.step < pipelineStep) {
                        setPipelineStep(s.step as 1 | 2 | 3);
                        setFormError(null);
                      }
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

            {/* Internal Alert / Validation Banner */}
            {formError && (
              <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-bold block text-rose-300">Verification Notice</span>
                  <p className="text-[11px] text-rose-100/90 mt-0.5">{formError}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormError(null)}
                  className="text-rose-400 hover:text-white p-0.5 rounded transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* STEP 1: VEHICLE SPECIFICATIONS */}
            {pipelineStep === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1 relative" ref={modelDropdownRef}>
                    <label className="text-[10px] font-bold text-white/60 uppercase">Vehicle Model</label>
                    <button
                      type="button"
                      onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                      className={`w-full h-11 rounded-xl bg-black/60 border px-3 text-xs text-white flex items-center justify-between transition-all select-none cursor-pointer ${
                        isModelDropdownOpen
                          ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                          : 'border-white/10 hover:border-amber-400/50 hover:bg-black/70'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-1">
                        <div className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                          <Car className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-bold text-white truncate text-xs">
                          {selectedModelOpt?.shortName || newVehicle.model}
                        </span>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-amber-400 shrink-0 transition-transform duration-200 ${isModelDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isModelDropdownOpen && (
                      <div className="absolute top-full left-0 mt-1.5 w-[190%] sm:w-[460px] max-w-[460px] rounded-2xl bg-[#0B0F17]/98 backdrop-blur-2xl border border-amber-500/40 p-2 shadow-[0_20px_60px_rgba(0,0,0,0.95)] z-50 space-y-1 animate-in fade-in zoom-in-95 duration-150 max-h-72 overflow-y-auto">
                        <div className="px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-amber-400/80 border-b border-white/5 pb-1.5 flex items-center justify-between">
                          <span>Select Commercial Vehicle Model</span>
                          <span className="text-white/40">7 Fleet Options</span>
                        </div>

                        {VEHICLE_MODEL_OPTIONS.map((opt) => {
                          const isSelected = newVehicle.model === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => {
                                setNewVehicle(prev => ({
                                  ...prev,
                                  model: opt.value,
                                  capacity: opt.capacity,
                                  luggageCapacity: opt.luggage,
                                  fourWheelDrive: opt.fourWheelDrive ? true : prev.fourWheelDrive
                                }));
                                setIsModelDropdownOpen(false);
                              }}
                              className={`w-full p-2.5 rounded-xl flex items-center justify-between gap-3 text-left transition-all duration-150 cursor-pointer ${
                                isSelected
                                  ? 'bg-amber-500/15 border border-amber-500/40 text-white shadow-sm'
                                  : 'bg-white/[0.02] hover:bg-amber-500/10 hover:border-amber-500/25 border border-transparent text-white/80 hover:text-white'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                  isSelected ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-white/5 border border-white/10 text-amber-400'
                                }`}>
                                  <Car className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-extrabold text-xs text-white truncate block">
                                      {opt.label}
                                    </span>
                                    <span className={`text-[8px] font-black uppercase px-1.5 py-0.2 rounded border ${
                                      opt.badgeColor === 'emerald'
                                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                        : opt.badgeColor === 'purple'
                                        ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                                        : opt.badgeColor === 'sky'
                                        ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                                        : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                    }`}>
                                      {opt.badge}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-white/50 block mt-0.5 font-mono">
                                    {opt.subtitle}
                                  </span>
                                </div>
                              </div>

                              <div className="shrink-0 flex items-center gap-1.5 pl-2">
                                {isSelected && (
                                  <div className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-300 shadow-sm">
                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                  </div>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-white/60 uppercase">Yellow Commercial Number Plate</label>
                    <Input
                      placeholder="e.g. JK-01-AX-9942"
                      value={newVehicle.plateNumber}
                      onChange={(e) => setNewVehicle(prev => ({ ...prev, plateNumber: e.target.value.toUpperCase() }))}
                      className="h-11 rounded-xl bg-black/60 border-white/10 text-xs font-mono tracking-wider font-bold text-amber-300 uppercase"
                      required
                    />
                  </div>

                  {/* Non-Sticky Numeric Stepper: Passenger Capacity */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-white/60 uppercase flex items-center justify-between">
                      <span>Passenger Capacity (Seats)</span>
                      <span className="text-[10px] text-amber-400 font-mono font-bold">{newVehicle.capacity || 6} Seats</span>
                    </label>
                    <div className="flex items-center gap-1.5 h-11 rounded-xl bg-black/60 border border-white/10 px-1.5 focus-within:border-amber-500/60 transition-colors">
                      <button
                        type="button"
                        onClick={() => setNewVehicle(prev => ({ ...prev, capacity: Math.max(1, (prev.capacity || 6) - 1) }))}
                        className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 text-white/80 hover:text-white font-bold flex items-center justify-center transition-all active:scale-95 text-sm select-none"
                      >
                        -
                      </button>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={newVehicle.capacity === 0 ? '' : newVehicle.capacity}
                        placeholder="6"
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => {
                          const clean = e.target.value.replace(/[^0-9]/g, '');
                          setNewVehicle(prev => ({ ...prev, capacity: clean === '' ? 0 : Math.min(26, parseInt(clean, 10)) }));
                        }}
                        onBlur={() => {
                          if (!newVehicle.capacity || newVehicle.capacity < 1) {
                            setNewVehicle(prev => ({ ...prev, capacity: 6 }));
                          }
                        }}
                        className="w-full text-center bg-transparent font-bold text-amber-300 text-xs focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setNewVehicle(prev => ({ ...prev, capacity: Math.min(26, (prev.capacity || 6) + 1) }))}
                        className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 text-white/80 hover:text-white font-bold flex items-center justify-center transition-all active:scale-95 text-sm select-none"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Non-Sticky Numeric Stepper: Luggage Capacity */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-white/60 uppercase flex items-center justify-between">
                      <span>Luggage Capacity (Bags)</span>
                      <span className="text-[10px] text-amber-400 font-mono font-bold">{newVehicle.luggageCapacity || 4} Bags</span>
                    </label>
                    <div className="flex items-center gap-1.5 h-11 rounded-xl bg-black/60 border border-white/10 px-1.5 focus-within:border-amber-500/60 transition-colors">
                      <button
                        type="button"
                        onClick={() => setNewVehicle(prev => ({ ...prev, luggageCapacity: Math.max(0, (prev.luggageCapacity ?? 4) - 1) }))}
                        className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 text-white/80 hover:text-white font-bold flex items-center justify-center transition-all active:scale-95 text-sm select-none"
                      >
                        -
                      </button>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={newVehicle.luggageCapacity === 0 ? '' : newVehicle.luggageCapacity}
                        placeholder="4"
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => {
                          const clean = e.target.value.replace(/[^0-9]/g, '');
                          setNewVehicle(prev => ({ ...prev, luggageCapacity: clean === '' ? 0 : Math.min(20, parseInt(clean, 10)) }));
                        }}
                        onBlur={() => {
                          if (newVehicle.luggageCapacity === undefined || newVehicle.luggageCapacity === null || newVehicle.luggageCapacity === 0) {
                            setNewVehicle(prev => ({ ...prev, luggageCapacity: 4 }));
                          }
                        }}
                        className="w-full text-center bg-transparent font-bold text-amber-300 text-xs focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setNewVehicle(prev => ({ ...prev, luggageCapacity: Math.min(20, (prev.luggageCapacity || 0) + 1) }))}
                        className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 text-white/80 hover:text-white font-bold flex items-center justify-center transition-all active:scale-95 text-sm select-none"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Kashmir Mountain Equipment (Interactive Luxury Toggle Switches) */}
                <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between pb-0.5">
                    <span className="text-[10px] font-black uppercase text-amber-400 block tracking-wider">
                      Kashmir Mountain Winter Equipment
                    </span>
                    <span className="text-[10px] text-white/40 font-mono">Uber Driver Spec</span>
                  </div>

                  {/* Snow Chains */}
                  <div 
                    onClick={() => setNewVehicle(prev => ({ ...prev, snowChains: !prev.snowChains }))}
                    className={`flex items-center justify-between cursor-pointer p-3 rounded-2xl border transition-all duration-200 select-none ${
                      newVehicle.snowChains 
                        ? 'bg-amber-500/[0.08] border-amber-500/40 shadow-sm' 
                        : 'bg-white/[0.02] border-white/5 hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        newVehicle.snowChains ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' : 'bg-white/5 text-white/40'
                      }`}>
                        <Snowflake className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-bold text-xs">Snow Chains Available</span>
                          {newVehicle.snowChains && (
                            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              Active
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-white/50 block">Tangmarg Checkpost Gulmarg pass</span>
                      </div>
                    </div>
                    <LuxuryToggleSwitch
                      checked={newVehicle.snowChains}
                      onChange={(checked) => setNewVehicle(prev => ({ ...prev, snowChains: checked }))}
                      ariaLabel="Snow Chains Available"
                    />
                  </div>

                  {/* 4x4 / AWD */}
                  <div 
                    onClick={() => setNewVehicle(prev => ({ ...prev, fourWheelDrive: !prev.fourWheelDrive }))}
                    className={`flex items-center justify-between cursor-pointer p-3 rounded-2xl border transition-all duration-200 select-none ${
                      newVehicle.fourWheelDrive 
                        ? 'bg-amber-500/[0.08] border-amber-500/40 shadow-sm' 
                        : 'bg-white/[0.02] border-white/5 hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        newVehicle.fourWheelDrive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-white/5 text-white/40'
                      }`}>
                        <Compass className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-bold text-xs">4x4 / AWD Mountain Low-Gear</span>
                          {newVehicle.fourWheelDrive && (
                            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              Active
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-white/50 block">High-traction drivetrain for snow</span>
                      </div>
                    </div>
                    <LuxuryToggleSwitch
                      checked={newVehicle.fourWheelDrive}
                      onChange={(checked) => setNewVehicle(prev => ({ ...prev, fourWheelDrive: checked }))}
                      ariaLabel="4x4 AWD System"
                    />
                  </div>

                  {/* Roof Ski Rack */}
                  <div 
                    onClick={() => setNewVehicle(prev => ({ ...prev, skiRack: !prev.skiRack }))}
                    className={`flex items-center justify-between cursor-pointer p-3 rounded-2xl border transition-all duration-200 select-none ${
                      newVehicle.skiRack 
                        ? 'bg-amber-500/[0.08] border-amber-500/40 shadow-sm' 
                        : 'bg-white/[0.02] border-white/5 hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        newVehicle.skiRack ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-white/5 text-white/40'
                      }`}>
                        <Car className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-bold text-xs">Roof Ski / Luggage Rack</span>
                          {newVehicle.skiRack && (
                            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              Active
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-white/50 block">Rooftop carrier for skis & tourist luggage</span>
                      </div>
                    </div>
                    <LuxuryToggleSwitch
                      checked={newVehicle.skiRack}
                      onChange={(checked) => setNewVehicle(prev => ({ ...prev, skiRack: checked }))}
                      ariaLabel="Roof Ski Rack"
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={() => {
                    if (!newVehicle.plateNumber.trim()) {
                      setFormError('Please enter the vehicle registration number plate (e.g. JK-01-AX-9942).');
                      toast.warning('Registration Plate Required', {
                        description: 'A commercial yellow registration plate number is required.'
                      });
                      return;
                    }
                    setFormError(null);
                    setPipelineStep(2);
                  }}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider gap-2 shadow-lg shadow-amber-500/20"
                >
                  <span>Next: Union & RTO Compliance</span>
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
                    Kashmir Curators only authorizes commercial tourist vehicles registered with an affiliated Tourist Taxi Union.
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="space-y-1 relative" ref={unionDropdownRef}>
                    <label className="text-[10px] font-bold text-white/60 uppercase">
                      Affiliated Tourist Taxi Union Stand
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsUnionDropdownOpen(!isUnionDropdownOpen)}
                      className={`w-full h-11 rounded-xl bg-black/60 border px-3 text-xs text-white flex items-center justify-between transition-all select-none cursor-pointer ${
                        isUnionDropdownOpen
                          ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                          : 'border-white/10 hover:border-amber-400/50 hover:bg-black/70'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-1">
                        <div className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                          <Building2 className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-bold text-white truncate text-xs">
                          {selectedUnionOpt?.label || newVehicle.unionName}
                        </span>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-amber-400 shrink-0 transition-transform duration-200 ${isUnionDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isUnionDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1.5 rounded-2xl bg-[#0B0F17]/98 backdrop-blur-2xl border border-amber-500/40 p-2 shadow-[0_20px_60px_rgba(0,0,0,0.95)] z-50 space-y-1 animate-in fade-in zoom-in-95 duration-150 max-h-64 overflow-y-auto">
                        <div className="px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-amber-400/80 border-b border-white/5 pb-1.5 flex items-center justify-between">
                          <span>Authorized Kashmir Taxi Unions</span>
                          <span className="text-white/40">7 Recognized Stands</span>
                        </div>

                        {TAXI_UNION_OPTIONS.map((u) => {
                          const isSelected = newVehicle.unionName === u.value;
                          return (
                            <button
                              key={u.value}
                              type="button"
                              onClick={() => {
                                setNewVehicle(prev => ({ ...prev, unionName: u.value }));
                                setIsUnionDropdownOpen(false);
                              }}
                              className={`w-full p-2.5 rounded-xl flex items-center justify-between gap-3 text-left transition-all duration-150 cursor-pointer ${
                                isSelected
                                  ? 'bg-amber-500/15 border border-amber-500/40 text-white shadow-sm'
                                  : 'bg-white/[0.02] hover:bg-amber-500/10 hover:border-amber-500/25 border border-transparent text-white/80 hover:text-white'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                  isSelected ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-white/5 border border-white/10 text-amber-400'
                                }`}>
                                  <Building2 className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-extrabold text-xs text-white truncate block">
                                      {u.label}
                                    </span>
                                    <span className="text-[8px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                      {u.badge}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-white/50 block mt-0.5">
                                    {u.standLocation}
                                  </span>
                                </div>
                              </div>

                              <div className="shrink-0 flex items-center gap-1.5 pl-2">
                                {isSelected && (
                                  <div className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-300 shadow-sm">
                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                  </div>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-white/60 uppercase">
                        Union Card / Badge ID *
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
                        J&K All-Valley Tourist Permit No.
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
                        Commercial RC Number
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
                        Commercial Driver PSV Badge ID
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
                    onClick={() => {
                      setPipelineStep(1);
                      setFormError(null);
                    }}
                    className="flex-1 h-12 rounded-xl bg-white/5 border-white/10 text-white text-xs gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Back</span>
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      if (!newVehicle.unionBadgeNumber.trim()) {
                        setFormError('Tourist Taxi Union Badge / ID is required (e.g. SXR-STAND-092).');
                        toast.warning('Union Badge Required', {
                          description: 'Please enter your affiliated Taxi Union badge number.'
                        });
                        return;
                      }
                      setFormError(null);
                      setPipelineStep(3);
                    }}
                    className="flex-[2] h-12 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider gap-2 shadow-lg shadow-amber-500/20"
                  >
                    <span>Next: KYC Documents & Review</span>
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
                    Attached Verification Documents
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
                    Upon submission, your vehicle dossier is transmitted directly to our Transport Desk and Tourist Taxi Union verification pipeline. Once verified, this vehicle is immediately authorized to receive live radar dispatches.
                  </p>
                </div>

                {/* Declaration Toggle Card */}
                <div 
                  onClick={() => setNewVehicle(prev => ({ ...prev, declarationAccepted: !prev.declarationAccepted }))}
                  className={`flex items-center justify-between gap-3 p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer select-none ${
                    newVehicle.declarationAccepted
                      ? 'bg-amber-500/[0.08] border-amber-500/40 shadow-sm'
                      : 'bg-white/[0.02] border-white/5 hover:border-white/15'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      newVehicle.declarationAccepted ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-white/5 text-white/40'
                    }`}>
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-white font-bold text-xs block">Union & RTO Legal Declaration</span>
                      <span className="text-[10px] text-white/60 leading-snug block">
                        I certify that this vehicle holds a valid Commercial Yellow Plate, J&K Tourist Permit, and is registered with the designated Tourist Taxi Union.
                      </span>
                    </div>
                  </div>
                  <LuxuryToggleSwitch
                    checked={newVehicle.declarationAccepted}
                    onChange={(checked) => setNewVehicle(prev => ({ ...prev, declarationAccepted: checked }))}
                    ariaLabel="Accept union and RTO declaration"
                  />
                </div>

                <div className="flex gap-2.5 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setPipelineStep(2);
                      setFormError(null);
                    }}
                    className="flex-1 h-12 rounded-xl bg-white/5 border-white/10 text-white text-xs gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Back</span>
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmittingVehicle || !newVehicle.declarationAccepted}
                    className="flex-[2] h-12 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-slate-950 font-black text-xs uppercase tracking-wider shadow-xl shadow-amber-500/30"
                  >
                    {isSubmittingVehicle ? 'Submitting Application...' : 'Submit for Union Verification ➔'}
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
