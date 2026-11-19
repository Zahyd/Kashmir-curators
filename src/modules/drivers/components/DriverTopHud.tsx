import React, { useState } from 'react';
import { toast } from 'sonner';
import { 
  Menu, 
  Car, 
  DollarSign, 
  ShieldAlert, 
  Snowflake, 
  ChevronDown, 
  Share2, 
  PhoneCall, 
  AlertTriangle,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  X
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DriverVehicle, DriverEarnings, HighwayAdvisory } from '../types/driver';

interface DriverTopHudProps {
  onOpenDrawer: () => void;
  activeVehicle: DriverVehicle | null;
  earnings: DriverEarnings;
  advisory: HighwayAdvisory;
  onRequestPayout: () => void;
  isPayoutProcessing?: boolean;
}

export const DriverTopHud: React.FC<DriverTopHudProps> = ({
  onOpenDrawer,
  activeVehicle,
  earnings,
  advisory,
  onRequestPayout,
  isPayoutProcessing = false,
}) => {
  const [showEarningsModal, setShowEarningsModal] = useState(false);
  const [showSosModal, setShowSosModal] = useState(false);
  const [showAdvisoryModal, setShowAdvisoryModal] = useState(false);

  return (
    <>
      {/* Top Floating Glassmorphic HUD Bar */}
      <div className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between gap-2 pointer-events-none">
        {/* Left: Menu Burger Trigger & Vehicle Pill */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={onOpenDrawer}
            title="Open Driver Menu"
            className="w-12 h-12 rounded-2xl bg-[#0F141C]/90 hover:bg-[#1A2230] border border-white/10 text-white flex items-center justify-center shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl active:scale-95 transition-all"
          >
            <Menu className="w-5 h-5 stroke-[2.2]" />
          </button>

          {activeVehicle && (
            <div className="hidden sm:flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-[#0F141C]/90 border border-white/10 shadow-xl backdrop-blur-xl">
              <Car className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="text-left">
                <div className="text-xs font-bold text-white leading-tight flex items-center gap-1.5">
                  <span>{activeVehicle.model}</span>
                  <span className="font-mono text-[10px] text-white/50">{activeVehicle.plateNumber}</span>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  {activeVehicle.fourWheelDrive && (
                    <span className="text-[8px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1 py-0 rounded">
                      4x4
                    </span>
                  )}
                  {activeVehicle.snowChains && (
                    <span className="text-[8px] font-extrabold uppercase bg-sky-500/20 text-sky-300 border border-sky-500/30 px-1 py-0 rounded flex items-center gap-0.5">
                      <Snowflake className="w-2.5 h-2.5" /> Chains
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Center: Live Expandable Earnings Pill */}
        <div className="pointer-events-auto">
          <button
            type="button"
            onClick={() => setShowEarningsModal(true)}
            className="group flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-gradient-to-r from-[#0F141C]/95 via-[#161F2E]/95 to-[#0F141C]/95 border border-amber-500/30 hover:border-amber-400 text-white shadow-[0_8px_32px_rgba(0,0,0,0.6)] backdrop-blur-2xl transition-all active:scale-95"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
            </span>
            <div className="text-left">
              <span className="text-[9px] font-black uppercase tracking-wider text-amber-400/90 block leading-none">
                Today's Take
              </span>
              <span className="font-mono text-sm sm:text-base font-extrabold text-white tracking-tight leading-tight">
                ₹{earnings.todayTotal.toLocaleString('en-IN')}.00
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-white/40 group-hover:text-amber-400 transition-colors ml-0.5" />
          </button>
        </div>

        {/* Right: Safety Shield & Highway Advisory Ticker */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Tangmarg Snow Chain Advisory Ticker */}
          <button
            type="button"
            onClick={() => setShowAdvisoryModal(true)}
            className="hidden md:flex items-center gap-2 px-3 py-2 rounded-2xl bg-sky-950/70 hover:bg-sky-900/80 border border-sky-500/40 text-sky-200 text-xs font-bold shadow-xl backdrop-blur-xl transition-all"
          >
            <Snowflake className="w-4 h-4 text-sky-400 animate-spin duration-[10000ms]" />
            <span className="truncate max-w-[160px] text-[11px]">Tangmarg: Chains Mandatory</span>
          </button>

          {/* Uber SOS Safety Shield */}
          <button
            type="button"
            onClick={() => setShowSosModal(true)}
            title="Emergency Safety Shield"
            className="w-12 h-12 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/50 text-rose-300 flex items-center justify-center shadow-[0_8px_32px_rgba(244,63,94,0.3)] backdrop-blur-xl active:scale-95 transition-all"
          >
            <ShieldAlert className="w-5 h-5 stroke-[2.2]" />
          </button>
        </div>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* 1. Expandable Earnings & Payout Popover Modal */}
      {/* ---------------------------------------------------------------------- */}
      {showEarningsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-[#0F141C] border border-amber-500/30 p-6 shadow-2xl text-white space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">Chauffeur Earnings Desk</h3>
                  <p className="text-[10px] text-white/50">Real-time Neon Ledger & Instant Payouts</p>
                </div>
              </div>
              <button 
                onClick={() => setShowEarningsModal(false)}
                className="p-1 rounded-lg text-white/40 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Total Balance Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/15 via-slate-900 to-black/80 border border-amber-500/30 text-center space-y-1">
              <span className="text-[10px] uppercase font-black tracking-widest text-amber-400">Available For Instant Settlement</span>
              <div className="text-3xl font-black font-mono text-white">
                ₹{earnings.todayTotal.toLocaleString('en-IN')}.00
              </div>
              <span className="text-[10px] text-white/50 block">Registered UPI: {earnings.upiId}</span>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                <span className="text-[9px] font-bold text-white/40 uppercase block mb-1">Trips Today</span>
                <span className="font-extrabold text-white text-base">{earnings.tripsCount}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                <span className="text-[9px] font-bold text-white/40 uppercase block mb-1">Online Time</span>
                <span className="font-extrabold text-white text-base">{earnings.onlineHours}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                <span className="text-[9px] font-bold text-white/40 uppercase block mb-1">Acceptance</span>
                <span className="font-extrabold text-emerald-400 text-base">{earnings.acceptanceRate}%</span>
              </div>
            </div>

            {/* Instant Payout Action */}
            <Button
              disabled={isPayoutProcessing || earnings.todayTotal <= 0}
              onClick={() => {
                onRequestPayout();
                setShowEarningsModal(false);
              }}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 gap-2"
            >
              <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
              {isPayoutProcessing ? 'Transmitting UPI Payout...' : 'Request Instant UPI Settlement'}
            </Button>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* 2. Safety Shield & SOS Emergency Trigger Modal */}
      {/* ---------------------------------------------------------------------- */}
      {showSosModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-[#0F141C] border border-rose-500/40 p-6 shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">Chauffeur SOS Emergency</h3>
                  <p className="text-[10px] text-white/50">24x7 Kashmir Alpine Operations Support</p>
                </div>
              </div>
              <button 
                onClick={() => setShowSosModal(false)}
                className="p-1 rounded-lg text-white/40 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-200 leading-relaxed">
              Activating emergency protocols transmits your live GPS coordinates, vehicle registration, and passenger manifest to the Srinagar Operations Command Desk and Kashmir Traffic Police.
            </div>

            <div className="space-y-2">
              <a
                href="tel:112"
                className="w-full h-11 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30"
              >
                <PhoneCall className="w-4 h-4" /> Call J&K Police Emergency (112)
              </a>

              <a
                href="tel:919906688123"
                className="w-full h-11 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <PhoneCall className="w-4 h-4 text-emerald-400" /> Srinagar Ground Operations Desk
              </a>

              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard?.writeText('https://kashmir-curators.vercel.app/driver?track=LIVE-GPS-JK01AX9942');
                  toast.success('Live GPS Link Copied!', { 
                    description: 'Tourist GPS tracking link clipboard me copy ho gaya hai.',
                    icon: '📍'
                  });
                }}
                className="w-full h-10 rounded-xl bg-white/5 border-white/10 text-white text-xs gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5 text-amber-400" /> Copy Live GPS Tracking Link
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* 3. Tangmarg Snow-Chain Highway Advisory Modal */}
      {/* ---------------------------------------------------------------------- */}
      {showAdvisoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-[#0F141C] border border-sky-500/30 p-6 shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
                  <Snowflake className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">Tangmarg Highway Clearance</h3>
                  <p className="text-[10px] text-white/50">Official Gulmarg Traffic Advisory</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAdvisoryModal(false)}
                className="p-1 rounded-lg text-white/40 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-sky-500/10 border border-sky-500/25 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-sky-300">Sector: {advisory.location}</span>
                <Badge className="bg-sky-500/20 text-sky-300 border-none text-[8px] uppercase">
                  {advisory.status}
                </Badge>
              </div>
              <p className="text-xs text-white/80 leading-relaxed">
                {advisory.message}
              </p>
            </div>

            <div className="text-[11px] text-white/60 space-y-1">
              <p>• 4x4 vehicles with chained drive wheels cleared for uphill ascent.</p>
              <p>• 2WD commercial sedans without chains restricted at Tangmarg Checkpost.</p>
              <p>• Uphill traffic window: 09:00 AM – 01:00 PM.</p>
            </div>

            <Button
              onClick={() => setShowAdvisoryModal(false)}
              className="w-full h-11 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs uppercase"
            >
              Acknowledged
            </Button>
          </div>
        </div>
      )}
    </>
  );
};
