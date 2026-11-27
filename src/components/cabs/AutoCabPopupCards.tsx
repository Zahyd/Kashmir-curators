import React, { useState } from 'react';
import {
  Car,
  Snowflake,
  ShieldCheck,
  Clock,
  Star,
  Sparkles,
  X,
  ArrowRight,
  Users,
  Luggage,
  IndianRupee,
  Loader2,
  CheckCircle2,
  MapPin,
  Radio,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

export interface LiveCabMatch {
  cabId: string;
  name: string;
  type: string;
  image: string;
  capacity: number;
  luggageCapacity: number;
  plateNumber: string;
  snowChains: boolean;
  fourWheelDrive: boolean;
  skiRack: boolean;
  multiDayAvailable: boolean;
  unionVerified: boolean;
  unionName: string;
  features: string[];
  estimatedKm: number;
  estimatedDurationMin: number;
  estimatedFare: number;
  requiresSnowChains: boolean;
  driverProfileId: string | null;
  isDriverOnline: boolean;
  driverStatus: string;
  driverDisplayName: string;
  driverRating: number;
  driverTripsCompleted: number;
  currentSector: string;
  etaMinutes: number;
}

export interface LiveDispatchOffer {
  id: string;
  reservationId: string;
  cabId: string;
  driverProfileId: string;
  driverName: string;
  driverPhone?: string | null;
  driverRating: number;
  driverTrips: number;
  vehicleName: string;
  vehicleType: string;
  vehicleImage?: string;
  vehicleRegNo: string;
  capacity: number;
  luggageCapacity: number;
  snowChains: boolean;
  fourWheelDrive: boolean;
  unionVerified: boolean;
  unionName?: string;
  initialFare: number;
  driverFare: number;
  touristCounter?: number | null;
  status: string;
  driverMessage?: string | null;
  etaMinutes: number;
}

interface QuickCorridor {
  label: string;
  pickup: string;
  drop: string;
  tripType: 'airport' | 'local' | 'outstation';
}

const QUICK_CORRIDORS: QuickCorridor[] = [
  {
    label: 'SXR Airport ➔ Dal Lake',
    pickup: 'Srinagar Airport (SXR)',
    drop: 'Dal Lake Ghats, Srinagar',
    tripType: 'airport',
  },
  {
    label: 'Srinagar ➔ Gulmarg (4x4)',
    pickup: 'Srinagar Airport (SXR)',
    drop: 'Gulmarg Gondola Resort, Gulmarg',
    tripType: 'outstation',
  },
  {
    label: 'Srinagar ➔ Pahalgam',
    pickup: 'Dal Lake Ghats, Srinagar',
    drop: 'Pahalgam Main Market, Pahalgam',
    tripType: 'outstation',
  },
  {
    label: 'Srinagar ➔ Sonamarg',
    pickup: 'Dal Lake Ghats, Srinagar',
    drop: 'Thajiwas Glacier, Sonamarg',
    tripType: 'outstation',
  },
];

interface AutoCabPopupCardsProps {
  open: boolean;
  onDismiss: () => void;
  onReopen: () => void;
  matches: LiveCabMatch[];
  onlineDriversCount: number;
  estimatedKm: number;
  pickupLabel: string;
  dropLabel: string;
  corridorAdvisory?: { title?: string; message?: string; location?: string } | null;
  activeReservationId?: string | null;
  activeReservationStatus?: string | null;
  liveOffers: LiveDispatchOffer[];
  isSubmittingRequest?: boolean;
  onSelectCorridor: (corridor: QuickCorridor) => void;
  onRequestCab: (match: LiveCabMatch, customOfferFare?: number) => Promise<void>;
  onCounterOffer: (offerId: string, counterFare: number) => Promise<void>;
  onConfirmOffer: (offer: LiveDispatchOffer) => Promise<void>;
}

export const AutoCabPopupCards: React.FC<AutoCabPopupCardsProps> = ({
  open,
  onDismiss,
  onReopen,
  matches,
  onlineDriversCount,
  estimatedKm,
  pickupLabel,
  dropLabel,
  corridorAdvisory,
  activeReservationId,
  activeReservationStatus,
  liveOffers,
  isSubmittingRequest = false,
  onSelectCorridor,
  onRequestCab,
  onCounterOffer,
  onConfirmOffer,
}) => {
  const [customFareMap, setCustomFareMap] = useState<Record<string, string>>({});
  const [counterMap, setCounterMap] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  if (!open) {
    return (
      <button
        type="button"
        onClick={onReopen}
        data-testid="reopen-cab-popup-btn"
        className="fixed bottom-24 right-4 sm:right-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-[#0B1017]/95 hover:bg-[#131B26] border border-amber-500/50 text-white shadow-[0_12px_40px_rgba(245,158,11,0.3)] backdrop-blur-xl transition-all active:scale-95"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
        </span>
        <Car className="w-4 h-4 text-amber-400" />
        <span className="text-xs font-black tracking-wide">
          {onlineDriversCount > 0 ? `${onlineDriversCount} Live Cabs Nearby` : `${matches.length} Verified Cabs`}
        </span>
      </button>
    );
  }

  return (
    <div
      data-testid="auto-cab-popup-cards"
      className="fixed inset-x-3 bottom-20 sm:inset-x-auto sm:right-6 sm:bottom-24 z-40 sm:w-[460px] max-h-[75vh] flex flex-col rounded-3xl bg-[#0A0F16]/96 backdrop-blur-2xl border border-amber-500/40 shadow-[0_24px_90px_rgba(0,0,0,0.85)] text-white overflow-hidden animate-in slide-in-from-bottom-6 duration-300"
    >
      {/* Header */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-[#111926] via-[#0D131D] to-[#0A0F16] border-b border-white/10 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-black uppercase tracking-wider gap-1">
              <Radio className="w-3 h-3 animate-pulse" />
              {onlineDriversCount > 0 ? `${onlineDriversCount} Chauffeurs Live` : 'Instant Match Grid'}
            </Badge>
            <span className="text-[10px] text-white/50 font-mono">~{estimatedKm} km</span>
          </div>
          <h3 className="text-sm sm:text-base font-black text-white leading-tight flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            Quick Cab Match for Kashmir
          </h3>
          <p className="text-[11px] text-white/60 truncate max-w-[330px] mt-0.5 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
            {pickupLabel || 'Srinagar Airport (SXR)'} <ArrowRight className="w-3 h-3 shrink-0" />{' '}
            {dropLabel || 'Dal Lake / Gulmarg'}
          </p>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          aria-label="Minimize cab cards"
          className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable Card Stack */}
      <div className="p-4 space-y-3 overflow-y-auto flex-1">
        {/* Instant Corridor Route Chips */}
        <div className="flex flex-wrap gap-1.5">
          {QUICK_CORRIDORS.map((c) => (
            <button
              key={c.label}
              type="button"
              onClick={() => onSelectCorridor(c)}
              className="px-2.5 py-1 rounded-full bg-white/[0.04] hover:bg-amber-500/20 border border-white/10 hover:border-amber-500/40 text-[10px] font-bold text-white/80 hover:text-amber-200 transition-colors"
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Winter Snow Chain Advisory Pill */}
        {corridorAdvisory && (
          <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center gap-2 text-[11px] text-sky-200">
            <Snowflake className="w-4 h-4 text-sky-400 shrink-0" />
            <span className="leading-snug">{corridorAdvisory.message || corridorAdvisory.title}</span>
          </div>
        )}

        {/* Active Live Driver Offer Responses (if Tourist sent a request) */}
        {activeReservationId && liveOffers.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                Live Dispatch Offers ({liveOffers.length})
              </span>
              <span className="text-[10px] text-white/50 font-mono">{activeReservationStatus}</span>
            </div>

            {liveOffers.map((offer) => {
              const canConfirm = ['OFFERED', 'DRIVER_ACCEPTED', 'COUNTERED_BY_DRIVER'].includes(
                offer.status
              );
              const waitingOnDriverCounter = offer.status === 'COUNTERED_BY_TOURIST';
              return (
                <div
                  key={offer.id}
                  data-testid={`popup-offer-card-${offer.id}`}
                  className="p-3.5 rounded-2xl bg-[#111926] border border-amber-500/40 space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-extrabold text-xs text-white">{offer.driverName}</span>
                        <span className="text-[10px] text-amber-300 flex items-center gap-0.5 font-bold">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {offer.driverRating.toFixed(1)}
                        </span>
                        <Badge className="bg-emerald-500/15 text-emerald-300 border-none text-[9px]">
                          {offer.status}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-white/60 mt-0.5 truncate">
                        {offer.vehicleName} • {offer.vehicleRegNo} • ~{offer.etaMinutes} min ETA
                      </p>
                      {offer.driverMessage && (
                        <p className="text-[11px] text-amber-200/90 mt-1 italic">"{offer.driverMessage}"</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono font-black text-lg text-emerald-400 block">
                        ₹{offer.driverFare.toLocaleString('en-IN')}
                      </span>
                      {offer.touristCounter && (
                        <span className="text-[9px] text-amber-300 block">
                          Your bid: ₹{offer.touristCounter.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                  </div>

                  {offer.status !== 'ACCEPTED' && (
                    <div className="flex flex-col gap-2 pt-1">
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder={`Counter ₹${Math.round(offer.driverFare * 0.9)}`}
                          value={counterMap[offer.id] ?? ''}
                          onChange={(e) =>
                            setCounterMap((prev) => ({ ...prev, [offer.id]: e.target.value }))
                          }
                          className="h-9 bg-black/50 border-white/15 text-white text-xs font-mono"
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={busyId === offer.id || !counterMap[offer.id]}
                          onClick={async () => {
                            const val = Number(counterMap[offer.id]);
                            if (!Number.isFinite(val) || val < 400) return;
                            setBusyId(offer.id);
                            try {
                              await onCounterOffer(offer.id, val);
                            } finally {
                              setBusyId(null);
                            }
                          }}
                          className="h-9 px-3 rounded-xl bg-white/5 border-white/15 text-white text-[11px] font-bold shrink-0"
                        >
                          Counter
                        </Button>
                      </div>

                      <Button
                        type="button"
                        disabled={!canConfirm || busyId === offer.id}
                        onClick={async () => {
                          setBusyId(offer.id);
                          try {
                            await onConfirmOffer(offer);
                          } finally {
                            setBusyId(null);
                          }
                        }}
                        className="w-full h-10 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider gap-1.5"
                      >
                        {busyId === offer.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        {waitingOnDriverCounter
                          ? 'Awaiting Driver Acceptance of Your Counter...'
                          : `Confirm Chauffeur at ₹${offer.driverFare.toLocaleString('en-IN')}`}
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Auto-Populated Live Cab Match Cards */}
        {matches.length === 0 ? (
          <div className="p-6 text-center rounded-2xl bg-white/[0.02] border border-white/10 text-xs text-white/50">
            Fetching approved vehicles from Kashmir Curators Fleet...
          </div>
        ) : (
          <div className="space-y-2.5">
            {matches.slice(0, 4).map((cab) => {
              const customVal = customFareMap[cab.cabId] ?? '';
              return (
                <div
                  key={cab.cabId}
                  data-testid={`popup-cab-card-${cab.cabId}`}
                  className="p-3.5 rounded-2xl bg-[#101722] hover:bg-[#141D2B] border border-white/10 hover:border-amber-500/40 transition-all space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <img
                        src={cab.image || '/images/tourist_innova.png'}
                        alt={cab.name}
                        className="w-16 h-12 rounded-xl object-cover bg-black/40 border border-white/10 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-extrabold text-xs text-white truncate">{cab.name}</h4>
                          {cab.isDriverOnline && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[9px] font-black uppercase">
                              LIVE • {cab.etaMinutes}m
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-white/60 mt-0.5 flex-wrap">
                          <span className="flex items-center gap-0.5">
                            <Users className="w-3 h-3" /> {cab.capacity}
                          </span>
                          <span className="flex items-center gap-0.5">
                            <Luggage className="w-3 h-3" /> {cab.luggageCapacity}
                          </span>
                          {cab.fourWheelDrive && (
                            <span className="text-emerald-300 font-bold">4x4</span>
                          )}
                          {cab.snowChains && (
                            <span className="text-sky-300 font-bold flex items-center gap-0.5">
                              <Snowflake className="w-2.5 h-2.5" /> Chains
                            </span>
                          )}
                          {cab.unionVerified && (
                            <span className="text-amber-300 flex items-center gap-0.5">
                              <ShieldCheck className="w-3 h-3" /> Union
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-white/40 truncate mt-0.5">
                          Pilot: {cab.driverDisplayName} (★{cab.driverRating.toFixed(1)}) • {cab.currentSector}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-mono font-black text-base text-amber-400 flex items-center justify-end">
                        <IndianRupee className="w-3.5 h-3.5" />
                        {cab.estimatedFare.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[9px] text-white/40 block">Est. Fare</span>
                    </div>
                  </div>

                  <div className="flex gap-2 items-center">
                    <Input
                      type="number"
                      placeholder={`Bid ₹${cab.estimatedFare}`}
                      value={customVal}
                      onChange={(e) =>
                        setCustomFareMap((prev) => ({ ...prev, [cab.cabId]: e.target.value }))
                      }
                      className="h-9 w-28 bg-black/50 border-white/10 text-white text-xs font-mono shrink-0"
                    />
                    <Button
                      type="button"
                      disabled={isSubmittingRequest || busyId === cab.cabId}
                      onClick={async () => {
                        setBusyId(cab.cabId);
                        try {
                          const parsed = Number(customVal);
                          await onRequestCab(
                            cab,
                            Number.isFinite(parsed) && parsed >= 400 ? parsed : undefined
                          );
                        } finally {
                          setBusyId(null);
                        }
                      }}
                      className="flex-1 h-9 rounded-xl bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-slate-950 font-black text-[11px] uppercase tracking-wider gap-1.5"
                    >
                      {busyId === cab.cabId ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          <span>Request Live Ride</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
