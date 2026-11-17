import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Building, 
  Car, 
  Calendar, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  ShieldCheck, 
  FileText, 
  Phone, 
  Sparkles, 
  Navigation, 
  Ticket, 
  ExternalLink,
  ChevronRight,
  Info,
  Compass,
  CreditCard,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CustomerBooking } from '../types';

interface TripWorkspaceModalProps {
  booking: CustomerBooking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShowSlip: (slip: { type: 'hotel' | 'flight' | 'cab'; booking: any }) => void;
  onShowSafetyCard: (bookingId?: string) => void;
  onOpenDriverTracking?: () => void;
  onNavigateToConcierge?: (contextMsg?: string) => void;
}

export const TripWorkspaceModal: React.FC<TripWorkspaceModalProps> = ({
  booking,
  open,
  onOpenChange,
  onShowSlip,
  onShowSafetyCard,
  onOpenDriverTracking,
  onNavigateToConcierge
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'timeline' | 'stays' | 'chauffeur' | 'itinerary' | 'documents'>('timeline');

  if (!booking) return null;

  const isConfirmed = booking.status === 'confirmed';
  const isCompleted = booking.status === 'completed';
  const isPending = booking.status === 'pending';

  // Extract or synthesize itinerary timeline
  const itinerarySteps = [
    {
      day: 1,
      title: 'Arrival in Srinagar & Dal Lake Houseboat Check-in',
      desc: 'Private airport greeting by your dedicated chauffeur. Transfer to premium luxury houseboat with welcome kahwa and sunset shikara cruise.',
      status: isCompleted ? 'completed' : 'current'
    },
    {
      day: 2,
      title: 'Mughal Heritage Gardens & Old City Artisan Walk',
      desc: 'Exploration of Nishat Bagh, Shalimar Bagh, Pari Mahal, and historic Downtown Srinagar pashmina weaving ateliers.',
      status: isCompleted ? 'completed' : 'upcoming'
    },
    {
      day: 3,
      title: 'Scenic Highlands of Gulmarg & Gondola Excursion',
      desc: 'Drive through Tangmarg pine forests to Gulmarg. Phase 1 & Phase 2 Gondola ride up to Apharwat Peak at 14,000 ft.',
      status: isCompleted ? 'completed' : 'upcoming'
    },
    {
      day: 4,
      title: 'Lidder Valley of Pahalgam & Betaab Meadows',
      desc: 'En-route Saffron fields of Pampore and Awantipora ruins. Check-in to riverside mountain lodge in Pahalgam.',
      status: isCompleted ? 'completed' : 'upcoming'
    },
    {
      day: 5,
      title: 'Aru Valley Exploration & Departure Escort',
      desc: 'Morning pony trail to Baisaran mini-Switzerland followed by luxury chauffeur transfer to Srinagar International Airport.',
      status: isCompleted ? 'completed' : 'upcoming'
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto bg-slate-950 text-white border border-white/10 rounded-3xl p-0 shadow-2xl scrollbar-thin scrollbar-thumb-white/10">
        {/* Hero Header Banner */}
        <div className="relative pt-8 pb-6 px-6 md:px-8 bg-gradient-to-br from-slate-900 via-slate-900/90 to-amber-950/20 border-b border-white/10 overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge className={cn("text-[9px] font-black uppercase px-2.5 py-0.5 tracking-wider",
                  isConfirmed ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                  isCompleted ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                  isPending ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                  'bg-red-500/20 text-red-400 border-red-500/30'
                )}>
                  {booking.status}
                </Badge>
                <span className="font-mono text-xs text-white/50">
                  Ref: #{booking.id.slice(-6).toUpperCase()}
                </span>
                <span className="text-[10px] text-white/40">• Booked {new Date(booking.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              </div>

              <h2 className="text-xl md:text-2xl font-display font-black text-white tracking-tight">
                {booking.itemName}
              </h2>

              <p className="text-white/60 text-xs md:text-sm mt-1 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>Valley of Kashmir • Dedicated Curator: Faheem (Ground Lead)</span>
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="gold"
                onClick={() => onShowSafetyCard(booking.id)}
                className="h-9 px-3.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 gap-1.5 shadow-md shadow-emerald-500/20"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Offline Safety Pass</span>
              </Button>
            </div>
          </div>

          {/* Sub Navigation Bar inside Modal */}
          <div className="flex items-center gap-2 mt-6 overflow-x-auto scrollbar-none border-t border-white/5 pt-4">
            {[
              { id: 'timeline', label: 'Journey Timeline', icon: Compass },
              { id: 'stays', label: 'Resorts & Stays', icon: Building },
              { id: 'chauffeur', label: 'Chauffeur & Fleet', icon: Car },
              { id: 'itinerary', label: 'Day-by-Day Route', icon: Calendar },
              { id: 'documents', label: 'Vouchers & Passes', icon: FileText }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveSubTab(tab.id as any)}
                  className={cn(
                    "flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0",
                    isActive
                      ? "bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20"
                      : "bg-slate-900/60 text-slate-300 hover:text-white hover:bg-white/5 border border-white/5"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 md:p-8 space-y-6 text-left">
          {/* 1. TIMELINE SUB-TAB */}
          {activeSubTab === 'timeline' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold uppercase text-white tracking-wider flex items-center gap-2">
                  <Compass className="w-4 h-4 text-amber-400" />
                  <span>Chronological Journey Progression</span>
                </h3>
                <span className="text-xs text-white/40">5 Days • 4 Destinations</span>
              </div>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-white/10">
                {itinerarySteps.map((step) => {
                  const isCurrent = step.status === 'current';
                  const isDone = step.status === 'completed';

                  return (
                    <div key={step.day} className="relative group">
                      <div className={cn(
                        "absolute -left-6 top-1 w-5 h-5 rounded-full flex items-center justify-center border-2",
                        isDone ? "bg-emerald-500 border-emerald-400 text-slate-950" :
                        isCurrent ? "bg-amber-500 border-amber-400 text-slate-950 animate-pulse" :
                        "bg-slate-900 border-white/20 text-white/40"
                      )}>
                        {isDone ? <CheckCircle2 className="w-3 h-3" /> : <span className="text-[9px] font-black">{step.day}</span>}
                      </div>

                      <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-4 group-hover:border-amber-500/30 transition-all shadow-md">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">
                            Day {step.day} Milestone
                          </span>
                          <Badge className={cn("text-[9px] font-bold uppercase px-2 py-0",
                            isDone ? "bg-emerald-500/20 text-emerald-400" :
                            isCurrent ? "bg-amber-500/20 text-amber-400" : "bg-white/5 text-white/40"
                          )}>
                            {isDone ? 'Completed' : isCurrent ? 'Active Leg' : 'Upcoming'}
                          </Badge>
                        </div>
                        <h4 className="text-sm font-bold text-white mb-1">{step.title}</h4>
                        <p className="text-xs text-white/50 leading-relaxed">{step.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. STAYS & ACCOMMODATIONS SUB-TAB */}
          {activeSubTab === 'stays' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold uppercase text-white tracking-wider flex items-center gap-2">
                  <Building className="w-4 h-4 text-amber-400" />
                  <span>Reserved Accommodations & Stays</span>
                </h3>
                <span className="text-xs text-emerald-400 font-bold">✓ Hotel CRS Confirmed</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
                  <div className="flex items-center justify-between mb-3">
                    <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[9px] font-black uppercase">
                      Heritage Houseboat
                    </Badge>
                    <span className="text-xs font-mono text-white/40">2 Nights</span>
                  </div>

                  <h4 className="font-extrabold text-base text-white group-hover:text-amber-400 transition-colors">
                    Sukoon Luxury Houseboat
                  </h4>
                  <p className="text-xs text-white/50 mt-1">Nigeen Lake, West Bank, Srinagar</p>

                  <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-white/40 block">Room Category</span>
                      <span className="font-bold text-white">Cedar Wood Suite</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-white/40 block">Meal Plan</span>
                      <span className="font-bold text-amber-400">MAP (Breakfast & Dinner)</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 flex items-center justify-between border-t border-white/5">
                    <span className="text-[10px] text-white/40">CRS Code: #SUK-8921</span>
                    <Button
                      size="sm"
                      onClick={() => onShowSlip({ type: 'hotel', booking })}
                      className="h-8 px-3 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 gap-1.5"
                    >
                      <Ticket className="w-3.5 h-3.5" />
                      <span>View Voucher</span>
                    </Button>
                  </div>
                </div>

                <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
                  <div className="flex items-center justify-between mb-3">
                    <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[9px] font-black uppercase">
                      Mountain Luxury Resort
                    </Badge>
                    <span className="text-xs font-mono text-white/40">2 Nights</span>
                  </div>

                  <h4 className="font-extrabold text-base text-white group-hover:text-amber-400 transition-colors">
                    The Khyber Himalayan Resort & Spa
                  </h4>
                  <p className="text-xs text-white/50 mt-1">Gulmarg Highlands, Near Gondola Terminal</p>

                  <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-white/40 block">Room Category</span>
                      <span className="font-bold text-white">Premier Pine View Room</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-white/40 block">Meal Plan</span>
                      <span className="font-bold text-amber-400">CP (Royal Breakfast)</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 flex items-center justify-between border-t border-white/5">
                    <span className="text-[10px] text-white/40">CRS Code: #KHY-4410</span>
                    <Button
                      size="sm"
                      onClick={() => onShowSlip({ type: 'hotel', booking })}
                      className="h-8 px-3 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 gap-1.5"
                    >
                      <Ticket className="w-3.5 h-3.5" />
                      <span>View Voucher</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. CHAUFFEUR & FLEET SUB-TAB */}
          {activeSubTab === 'chauffeur' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold uppercase text-white tracking-wider flex items-center gap-2">
                  <Car className="w-4 h-4 text-amber-400" />
                  <span>Dedicated Chauffeur & Vehicle Allocation</span>
                </h3>
                <span className="text-xs text-emerald-400 font-bold">✓ Driver Assigned</span>
              </div>

              <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-5">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg">
                      TA
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-extrabold text-white">Tariq Ahmed</h4>
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[9px] uppercase font-black">Verified Chauffeur</Badge>
                      </div>
                      <p className="text-xs text-white/50 mt-0.5">12+ Years High-Altitude Mountain Driving Experience</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href="tel:+919876543210"
                      className="inline-flex items-center justify-center h-10 px-4 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 gap-1.5 shadow-md shadow-amber-500/20"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call Driver</span>
                    </a>

                    {onOpenDriverTracking && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={onOpenDriverTracking}
                        className="h-10 px-4 rounded-xl text-xs font-bold border-white/10 hover:border-amber-500/40 text-white bg-white/5 gap-1.5"
                      >
                        <Navigation className="w-3.5 h-3.5 text-amber-400" />
                        <span>Live GPS Tracking</span>
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-5 text-xs">
                  <div>
                    <span className="text-[10px] text-white/40 block">Allocated Fleet</span>
                    <span className="font-bold text-white">Toyota Innova Crysta ZX</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-white/40 block">Vehicle Reg. No.</span>
                    <span className="font-mono font-bold text-amber-400">JK01-BD-8921</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-white/40 block">Winter Readiness</span>
                    <span className="font-bold text-emerald-400">Snow Chains Equipped</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-white/40 block">Comfort Tier</span>
                    <span className="font-bold text-white">Heated Seats / Wi-Fi</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. DAY-BY-DAY ROUTE SUB-TAB */}
          {activeSubTab === 'itinerary' && (
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold uppercase text-white tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400" />
                <span>Curated Day-by-Day Activity Schedule</span>
              </h3>

              <div className="space-y-3">
                {itinerarySteps.map((step) => (
                  <div key={step.day} className="bg-slate-900/60 border border-white/10 rounded-2xl p-4 hover:border-amber-500/30 transition-all">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold text-xs">
                        D{step.day}
                      </span>
                      <h4 className="text-xs md:text-sm font-bold text-white">{step.title}</h4>
                    </div>
                    <p className="text-xs text-white/50 pl-8 leading-relaxed">{step.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. VOUCHERS & DOCUMENTS SUB-TAB */}
          {activeSubTab === 'documents' && (
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold uppercase text-white tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <span>Authorized Travel Vouchers & Safety Passes</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3">
                      <Building className="w-5 h-5" />
                    </div>
                    <h5 className="font-bold text-xs text-white mb-1">Resort Stay Voucher</h5>
                    <p className="text-[10px] text-white/40">Authoritative hotel check-in confirmation with guest credentials.</p>
                  </div>
                  <Button
                    size="sm"
                    variant="gold"
                    onClick={() => onShowSlip({ type: 'hotel', booking })}
                    className="mt-4 h-8 rounded-xl text-xs font-bold bg-amber-500 text-slate-950"
                  >
                    View Voucher
                  </Button>
                </div>

                <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <h5 className="font-bold text-xs text-white mb-1">Offline Safety Pass</h5>
                    <p className="text-[10px] text-white/40">Digital safety badge with QR code for low-network mountain travel.</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onShowSafetyCard(booking.id)}
                    className="mt-4 h-8 rounded-xl text-xs font-bold border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                  >
                    Launch Pass
                  </Button>
                </div>

                <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-3">
                      <Car className="w-5 h-5" />
                    </div>
                    <h5 className="font-bold text-xs text-white mb-1">Cab Dispatch Slip</h5>
                    <p className="text-[10px] text-white/40">Official chauffeur duty pass with vehicle registration & contact.</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onShowSlip({ type: 'cab', booking })}
                    className="mt-4 h-8 rounded-xl text-xs font-bold border-white/10 text-white hover:bg-white/5"
                  >
                    View Dispatch
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
