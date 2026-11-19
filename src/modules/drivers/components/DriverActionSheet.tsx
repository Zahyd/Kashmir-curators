import React, { useState, useEffect, useRef } from 'react';
import { 
  Navigation, 
  MapPin, 
  Phone, 
  MessageSquare, 
  Plane, 
  Train, 
  Hotel, 
  ShieldCheck, 
  Luggage, 
  Users, 
  Clock, 
  ChevronRight, 
  CheckCircle2, 
  X, 
  AlertCircle,
  Radio,
  Flame,
  KeyRound,
  Snowflake,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DriverDutyState, DriverTrip, TripStage } from '../types/driver';

interface DriverActionSheetProps {
  dutyState: DriverDutyState;
  onGoOnline: () => void;
  onGoOffline: () => void;
  activeTrip: DriverTrip | null;
  onAcceptOffer: () => void;
  onDeclineOffer: () => void;
  offerCountdownSeconds: number;
  onSlideStageTransition: (stage: TripStage) => void;
  onVerifySecurityPin: (enteredPin: string) => Promise<boolean>;
}

export const DriverActionSheet: React.FC<DriverActionSheetProps> = ({
  dutyState,
  onGoOnline,
  onGoOffline,
  activeTrip,
  onAcceptOffer,
  onDeclineOffer,
  offerCountdownSeconds,
  onSlideStageTransition,
  onVerifySecurityPin,
}) => {
  // Slider state for Slide-to-Confirm bar
  const [sliderProgress, setSliderProgress] = useState(0); // 0 to 100%
  const [isSliding, setIsSliding] = useState(false);
  const sliderTrackRef = useRef<HTMLDivElement>(null);

  // Security PIN input state
  const [pinInput, setPinInput] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinError, setPinError] = useState('');
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);

  // Reset slider progress when trip stage changes
  useEffect(() => {
    setSliderProgress(0);
    setIsSliding(false);
  }, [activeTrip?.stage]);

  // Touch and Mouse handlers for Uber Slide-to-Confirm
  const handleSliderMove = (clientX: number) => {
    if (!sliderTrackRef.current) return;
    const rect = sliderTrackRef.current.getBoundingClientRect();
    const handleWidth = 56;
    const maxDrag = rect.width - handleWidth;
    const currentX = Math.max(0, Math.min(clientX - rect.left - handleWidth / 2, maxDrag));
    const percentage = Math.round((currentX / maxDrag) * 100);
    setSliderProgress(percentage);

    // If dragged >= 92%, trigger stage transition
    if (percentage >= 92) {
      triggerSlideAction();
    }
  };

  const triggerSlideAction = () => {
    if (!activeTrip) return;
    setIsSliding(false);
    setSliderProgress(100);

    if (activeTrip.stage === 'ACCEPTED') {
      onSlideStageTransition('ARRIVED_AT_PICKUP');
    } else if (activeTrip.stage === 'ARRIVED_AT_PICKUP') {
      // Require PIN before starting trip
      setShowPinModal(true);
    } else if (activeTrip.stage === 'STARTED_IN_TRANSIT') {
      onSlideStageTransition('COMPLETED');
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSliding) return;
    handleSliderMove(e.touches[0].clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isSliding) return;
    handleSliderMove(e.clientX);
  };

  const handleSliderEnd = () => {
    if (sliderProgress < 92) {
      setSliderProgress(0); // Snap back if not completed
    }
    setIsSliding(false);
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput.trim()) return;

    setIsVerifyingPin(true);
    setPinError('');
    try {
      const valid = await onVerifySecurityPin(pinInput.trim().toUpperCase());
      if (valid) {
        setShowPinModal(false);
        setPinInput('');
        onSlideStageTransition('STARTED_IN_TRANSIT');
      } else {
        setPinError('Invalid tourist PIN. Check passenger voucher.');
      }
    } finally {
      setIsVerifyingPin(false);
    }
  };

  return (
    <>
      {/* Floating Bottom Container */}
      <div className="absolute bottom-4 left-4 right-4 z-30 max-w-lg mx-auto pointer-events-auto">
        {/* ================================================================== */}
        {/* STATE 1: OFFLINE (Iconic Pulsing Centered GO Button)               */}
        {/* ================================================================== */}
        {dutyState === 'OFFLINE' && (
          <div className="p-6 rounded-3xl bg-[#0F141C]/95 backdrop-blur-2xl border border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.85)] text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-200">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40 block">Chauffeur Status</span>
              <h3 className="text-base font-extrabold text-white">You Are Currently Offline</h3>
              <p className="text-xs text-white/50 max-w-xs mx-auto">
                Tap GO to broadcast cab readiness for Srinagar Airport flights, Nowgam train arrivals, & Gulmarg ski transfers.
              </p>
            </div>

            {/* Massive Uber Style Pulsing GO Button */}
            <div className="py-2 flex justify-center">
              <button
                type="button"
                onClick={onGoOnline}
                className="group relative w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 text-slate-950 font-black text-2xl uppercase tracking-wider shadow-[0_0_50px_rgba(16,185,129,0.5)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center border-4 border-[#07090E]"
              >
                <span className="relative z-10 font-mono tracking-widest">GO</span>
                <span className="absolute inset-0 rounded-full border-2 border-emerald-300 animate-ping opacity-60" />
              </button>
            </div>

            {/* Vehicle Readiness Indicator */}
            <div className="flex items-center justify-center gap-3 text-[11px] text-white/60">
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> 4x4 Engaged
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-sky-400">
                <Snowflake className="w-3.5 h-3.5" /> Snow Chains Ready
              </span>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* STATE 2: ONLINE SEARCHING (360° Radar Sweep Animation)              */}
        {/* ================================================================== */}
        {dutyState === 'ONLINE_SEARCHING' && (
          <div className="p-5 rounded-3xl bg-[#0F141C]/95 backdrop-blur-2xl border border-emerald-500/30 shadow-[0_24px_80px_rgba(0,0,0,0.85)] flex items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-4 duration-200">
            <div className="flex items-center gap-3.5">
              {/* Radar Circle */}
              <div className="relative w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 overflow-hidden">
                <Radio className="w-6 h-6 animate-pulse" />
                <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/30 to-transparent animate-[spin_3s_linear_infinite]" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-white">Finding Trips in Srinagar...</h4>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                </div>
                <p className="text-[11px] text-white/50 truncate max-w-[210px] sm:max-w-xs">
                  Broadcasting live to SXR Airport, Railway & Dal Lake
                </p>
              </div>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={onGoOffline}
              className="h-10 rounded-xl bg-white/5 hover:bg-rose-500/20 border-white/10 hover:border-rose-500/30 text-rose-300 text-xs font-bold shrink-0"
            >
              Go Offline
            </Button>
          </div>
        )}

        {/* ================================================================== */}
        {/* STATE 3: INCOMING RIDE OFFER (15s Shrinking Timer Bar)             */}
        {/* ================================================================== */}
        {dutyState === 'INCOMING_RIDE_OFFER' && activeTrip && (
          <div className="rounded-3xl bg-[#0F141C]/98 backdrop-blur-2xl border-2 border-amber-500/80 shadow-[0_24px_100px_rgba(245,158,11,0.4)] overflow-hidden animate-in zoom-in-95 duration-200 text-white">
            {/* 15-Second Shrinking Progress Bar */}
            <div className="h-2 w-full bg-black/60 relative">
              <div
                className="h-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 transition-all duration-1000 ease-linear"
                style={{ width: `${(offerCountdownSeconds / 15) * 100}%` }}
              />
            </div>

            <div className="p-5 space-y-4">
              {/* Fare & Countdown Header */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-amber-400 block">Upfront Guaranteed Fare</span>
                  <div className="text-3xl font-black font-mono text-white tracking-tight">
                    ₹{activeTrip.fareAmount.toLocaleString('en-IN')}.00
                  </div>
                </div>

                <div className="text-right">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-mono font-black text-amber-300 text-base shadow-inner">
                    {offerCountdownSeconds}s
                  </div>
                  <span className="text-[9px] text-white/40 block mt-1">Expires Soon</span>
                </div>
              </div>

              {/* Arrival Mode Badge */}
              <div className="p-2.5 rounded-xl bg-black/50 border border-white/10 flex items-center gap-2.5 text-xs">
                {activeTrip.arrivalTelemetry.type === 'FLIGHT' ? (
                  <>
                    <Plane className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="truncate">
                      <strong>Flight {activeTrip.arrivalTelemetry.flightNumber}</strong> ({activeTrip.arrivalTelemetry.airline}) • {activeTrip.arrivalTelemetry.status}
                    </span>
                  </>
                ) : activeTrip.arrivalTelemetry.type === 'TRAIN' ? (
                  <>
                    <Train className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="truncate">
                      <strong>Train {activeTrip.arrivalTelemetry.trainNumber}</strong> ({activeTrip.arrivalTelemetry.trainName}) • {activeTrip.arrivalTelemetry.status}
                    </span>
                  </>
                ) : (
                  <>
                    <Hotel className="w-4 h-4 text-sky-400 shrink-0" />
                    <span className="truncate">
                      <strong>City / Houseboat Pickup:</strong> {activeTrip.arrivalTelemetry.propertyName}
                    </span>
                  </>
                )}
              </div>

              {/* Route Summary */}
              <div className="space-y-2 text-xs">
                <div className="flex items-start gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 mt-1 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[10px] text-white/40 uppercase block">Pickup Location</span>
                    <p className="font-bold text-white truncate">{activeTrip.pickupLocation}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400 mt-1 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[10px] text-white/40 uppercase block">Dropoff Destination</span>
                    <p className="font-bold text-white truncate">{activeTrip.dropLocation}</p>
                  </div>
                </div>
              </div>

              {/* Specs Badge Strip */}
              <div className="flex items-center justify-between text-xs text-white/70 pt-2 border-t border-white/10">
                <span className="flex items-center gap-1 font-mono font-bold">
                  <Clock className="w-3.5 h-3.5 text-amber-400" /> {activeTrip.estimatedDuration} ({activeTrip.distanceKm} km)
                </span>
                <span className="flex items-center gap-2">
                  <span className="flex items-center gap-1 font-mono">
                    <Users className="w-3.5 h-3.5 text-white/50" /> {activeTrip.travelerCount} Pax
                  </span>
                  <span className="flex items-center gap-1 font-mono">
                    <Luggage className="w-3.5 h-3.5 text-white/50" /> {activeTrip.luggageCount} Bags
                  </span>
                </span>
              </div>

              {/* Accept / Decline Action Buttons */}
              <div className="flex gap-2.5 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onDeclineOffer}
                  className="w-28 h-12 rounded-2xl bg-white/5 hover:bg-white/10 border-white/10 text-white/60 hover:text-white font-bold text-xs uppercase"
                >
                  Decline
                </Button>
                <Button
                  type="button"
                  onClick={onAcceptOffer}
                  className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-slate-950 font-black text-sm uppercase tracking-wider shadow-xl shadow-amber-500/30"
                >
                  Accept Trip
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* STATE 4: ACTIVE TRIP (Turn-by-turn + Security PIN + Slide to Confirm) */}
        {/* ================================================================== */}
        {dutyState === 'ACTIVE_TRIP' && activeTrip && (
          <div className="rounded-3xl bg-[#0F141C]/95 backdrop-blur-2xl border border-white/15 shadow-[0_24px_80px_rgba(0,0,0,0.9)] overflow-hidden text-white space-y-3.5 p-4 animate-in slide-in-from-bottom-4 duration-200">
            {/* Top Navigation HUD Header */}
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0 shadow-md">
                  <Navigation className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] font-black uppercase text-emerald-400 block tracking-wider">
                    {activeTrip.stage === 'ACCEPTED' && 'Head to Pickup Point'}
                    {activeTrip.stage === 'ARRIVED_AT_PICKUP' && 'Waiting for Tourist Boarding'}
                    {activeTrip.stage === 'STARTED_IN_TRANSIT' && 'In Transit • Gulmarg Highway NH1A'}
                    {activeTrip.stage === 'COMPLETED' && 'Trip Completed'}
                  </span>
                  <p className="text-xs font-bold text-white truncate">
                    {activeTrip.nextTurnInstruction || 'Follow Tangmarg Alpine Highway'}
                  </p>
                </div>
              </div>

              {/* Security PIN Badge Handshake */}
              <div className="shrink-0 text-right">
                <span className="text-[8px] font-black uppercase tracking-wider text-white/40 block">Voucher PIN</span>
                <span className="px-2 py-0.5 rounded-lg bg-black/60 border border-amber-500/40 font-mono font-black text-amber-300 text-xs">
                  {activeTrip.securityPin}
                </span>
              </div>
            </div>

            {/* Passenger Manifest & Direct Contact Strip */}
            <div className="flex items-center justify-between gap-2 px-1">
              <div className="min-w-0">
                <h4 className="font-extrabold text-sm text-white truncate">{activeTrip.passengerName}</h4>
                <div className="flex items-center gap-2 text-[11px] text-white/50">
                  <span>{activeTrip.travelerCount} Guests</span>
                  <span>•</span>
                  <span>{activeTrip.luggageCount} Bags</span>
                  <span>•</span>
                  <span className="font-mono text-emerald-400 font-bold">₹{activeTrip.fareAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Call & WhatsApp actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                <a
                  href={`tel:${activeTrip.passengerPhone}`}
                  className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white"
                  title="Call Tourist"
                >
                  <Phone className="w-4 h-4 text-emerald-400" />
                </a>
                <a
                  href={`https://wa.me/${activeTrip.passengerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                    `Hello ${activeTrip.passengerName}, this is your Kashmir Curators chauffeur Zahid. I am staged with your vehicle.`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 flex items-center justify-center text-emerald-300"
                  title="WhatsApp Tourist"
                >
                  <MessageSquare className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Uber Touch / Mouse Slide-To-Confirm Bar */}
            <div
              ref={sliderTrackRef}
              onMouseDown={() => setIsSliding(true)}
              onMouseMove={handleMouseMove}
              onMouseUp={handleSliderEnd}
              onTouchStart={() => setIsSliding(true)}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleSliderEnd}
              className="relative w-full h-14 rounded-2xl bg-black/70 border border-white/10 overflow-hidden flex items-center px-1.5 select-none cursor-pointer"
            >
              {/* Filled Track Behind Handle */}
              <div
                className="absolute left-0 top-0 bottom-0 bg-emerald-500/25 transition-all duration-75"
                style={{ width: `${sliderProgress}%` }}
              />

              {/* Animated Text Label */}
              <div className="absolute inset-0 flex items-center justify-center text-center text-xs font-black uppercase tracking-wider text-white/80 pointer-events-none">
                {activeTrip.stage === 'ACCEPTED' && '>>> Slide to Arrive at Pickup >>>'}
                {activeTrip.stage === 'ARRIVED_AT_PICKUP' && '>>> Slide to Start Trip (PIN) >>>'}
                {activeTrip.stage === 'STARTED_IN_TRANSIT' && '>>> Slide to Complete Trip >>>'}
                {activeTrip.stage === 'COMPLETED' && 'Trip Finished'}
              </div>

              {/* Draggable Slider Puck */}
              <div
                className="relative z-10 w-12 h-11 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/30 cursor-grab active:cursor-grabbing transition-transform duration-75"
                style={{
                  transform: `translateX(${(sliderProgress / 100) * (sliderTrackRef.current ? sliderTrackRef.current.clientWidth - 56 : 300)}px)`,
                }}
              >
                <ArrowRight className="w-5 h-5 stroke-[3]" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Tourist Security PIN Authentication Modal                          */}
      {/* ------------------------------------------------------------------ */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-3xl bg-[#0F141C] border border-amber-500/40 p-6 shadow-2xl text-white space-y-4">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto mb-2">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-base text-white">Enter Tourist Security PIN</h3>
              <p className="text-xs text-white/50">
                Ask the guest for the 4-character PIN on their Kashmir Curators travel voucher.
              </p>
            </div>

            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div>
                <Input
                  autoFocus
                  maxLength={6}
                  placeholder="e.g. KC-77"
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value.toUpperCase());
                    setPinError('');
                  }}
                  className="h-14 rounded-2xl bg-black/60 border-amber-500/40 text-center font-mono font-black text-2xl tracking-widest text-amber-300 placeholder:text-white/20 uppercase"
                />
                {pinError && (
                  <p className="text-rose-400 text-xs text-center mt-2 flex items-center justify-center gap-1 font-semibold">
                    <AlertCircle className="w-3.5 h-3.5" /> {pinError}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPinModal(false)}
                  className="flex-1 h-11 rounded-xl bg-white/5 border-white/10 text-white text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isVerifyingPin || !pinInput.trim()}
                  className="flex-1 h-11 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider"
                >
                  {isVerifyingPin ? 'Verifying...' : 'Verify & Start'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
