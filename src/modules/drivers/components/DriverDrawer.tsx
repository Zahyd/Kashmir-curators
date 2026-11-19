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
  ArrowUpRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DriverVehicle, DriverEarnings } from '../types/driver';

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
}

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
}) => {
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [isSubmittingVehicle, setIsSubmittingVehicle] = useState(false);

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
                <h3 className="font-extrabold text-sm text-white">Zahid Ahmad</h3>
                <BadgeCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              </div>
              <div className="flex items-center gap-2 text-[11px] text-white/50">
                <span className="flex items-center text-amber-400 font-bold">
                  <Star className="w-3 h-3 fill-amber-400 mr-0.5" /> 4.93
                </span>
                <span>• 148 Trips</span>
                <span>• Chauffeur ID #KC-DRV-09</span>
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

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin scrollbar-thumb-white/10">
          {/* Earnings Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/15 via-[#0F141C] to-black/90 border border-amber-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400/90 block">Today's Earnings</span>
                <span className="text-2xl font-black font-mono text-white">₹{earnings.todayTotal.toLocaleString('en-IN')}.00</span>
              </div>
              <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30 text-[9px] font-extrabold uppercase px-2 py-0.5">
                Active Duty
              </Badge>
            </div>

            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
              <span className="text-white/50">Settlement Account</span>
              <span className="font-mono text-white/80">{earnings.upiId}</span>
            </div>

            <Button
              disabled={isPayoutProcessing || earnings.todayTotal <= 0}
              onClick={onRequestPayout}
              className="w-full h-10 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider gap-1.5 shadow-md shadow-amber-500/20"
            >
              <ArrowUpRight className="w-4 h-4" />
              {isPayoutProcessing ? 'Processing...' : 'Instant UPI Payout'}
            </Button>
          </div>

          {/* Vehicle Fleet Management */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-white">Vehicle Fleet</h4>
                <p className="text-[10px] text-white/40">Select active cab or onboard new vehicle</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowRegisterModal(true)}
                className="h-8 rounded-xl bg-white/5 hover:bg-amber-500/15 border-white/10 hover:border-amber-500/30 text-amber-300 text-[10px] font-bold gap-1"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Add Cab
              </Button>
            </div>

            <div className="space-y-2">
              {vehicles.map((v) => {
                const isSelected = v.id === activeVehicleId;
                return (
                  <div
                    key={v.id}
                    onClick={() => onSelectVehicle(v.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-[#0F141C] border-amber-500/60 shadow-lg shadow-amber-500/10'
                        : 'bg-white/[0.02] hover:bg-white/[0.05] border-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 text-white/40'
                      }`}>
                        <Car className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-xs text-white truncate">{v.model}</span>
                          {isSelected && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                          )}
                        </div>
                        <span className="font-mono text-[10px] text-white/50 block">{v.plateNumber}</span>
                        <div className="flex items-center gap-1 mt-1">
                          {v.fourWheelDrive && (
                            <span className="text-[8px] font-extrabold uppercase bg-emerald-500/15 text-emerald-300 border border-emerald-500/20 px-1 py-0 rounded">
                              4x4
                            </span>
                          )}
                          {v.snowChains && (
                            <span className="text-[8px] font-extrabold uppercase bg-sky-500/15 text-sky-300 border border-sky-500/20 px-1 py-0 rounded">
                              Chains
                            </span>
                          )}
                          {v.skiRack && (
                            <span className="text-[8px] font-extrabold uppercase bg-purple-500/15 text-purple-300 border border-purple-500/20 px-1 py-0 rounded">
                              Ski Rack
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <span className="text-[10px] font-mono text-white/40 block">{v.capacity} Pax</span>
                      {isSelected ? (
                        <span className="text-[9px] font-extrabold text-emerald-400">ACTIVE</span>
                      ) : (
                        <span className="text-[9px] text-white/30">Select</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tourist Arrival Protocols Note */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2.5 text-xs text-white/70">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400/90 block">
              Kashmir Arrival Protocols
            </span>
            <div className="flex items-start gap-2">
              <Plane className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                <strong className="text-white">Flight Pickups (SXR Airport):</strong> Stage vehicle at Commercial Lane B. Meet tourist at Arrival Terminal Gate 2.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <Train className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                <strong className="text-white">Train Pickups (Srinagar Nowgam Station):</strong> Stage cab at Main Parking Port 1. Verify Vande Bharat / Express arrival platform.
              </p>
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-white/10 bg-[#0F141C] text-center text-[10px] text-white/40">
          Kashmir Curators Driver OS • Version 3.4.0 (Live Telemetry)
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
                  <h3 className="font-extrabold text-sm text-white">Register New Fleet Cab</h3>
                  <p className="text-[10px] text-white/50">Onboard vehicle to Kashmir Curators Storefront</p>
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
                  <label className="text-[10px] font-bold text-white/50 uppercase">Model</label>
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
                  <label className="text-[10px] font-bold text-white/50 uppercase">Plate Number</label>
                  <Input
                    placeholder="e.g. JK-01-AX-9942"
                    value={newVehicle.plateNumber}
                    onChange={(e) => setNewVehicle(prev => ({ ...prev, plateNumber: e.target.value.toUpperCase() }))}
                    className="h-10 rounded-xl bg-black/50 border-white/10 text-xs font-mono"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-white/50 uppercase">Pax Capacity</label>
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
                  <label className="text-[10px] font-bold text-white/50 uppercase">Luggage Bags</label>
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
                <span className="text-[10px] font-black uppercase text-amber-400 block">Alpine Winter Gear Toggles</span>
                
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-white/80">Snow Chains Mounted & Certified</span>
                  <input
                    type="checkbox"
                    checked={newVehicle.snowChains}
                    onChange={(e) => setNewVehicle(prev => ({ ...prev, snowChains: e.target.checked }))}
                    className="rounded accent-amber-500 w-4 h-4"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-white/80">4x4 / AWD All-Wheel Drive</span>
                  <input
                    type="checkbox"
                    checked={newVehicle.fourWheelDrive}
                    onChange={(e) => setNewVehicle(prev => ({ ...prev, fourWheelDrive: e.target.checked }))}
                    className="rounded accent-amber-500 w-4 h-4"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-white/80">Ski & Snowboard Roof Rack</span>
                  <input
                    type="checkbox"
                    checked={newVehicle.skiRack}
                    onChange={(e) => setNewVehicle(prev => ({ ...prev, skiRack: e.target.checked }))}
                    className="rounded accent-amber-500 w-4 h-4"
                  />
                </label>
              </div>

              {/* KYC Document Compliance Notice */}
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Auto-verified via J&K Commercial Transport Registry (RC, Permit & Insurance active).</span>
              </div>

              <Button
                type="submit"
                disabled={isSubmittingVehicle}
                className="w-full h-11 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider"
              >
                {isSubmittingVehicle ? 'Onboarding Cab...' : 'Add Vehicle to Active Fleet'}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
