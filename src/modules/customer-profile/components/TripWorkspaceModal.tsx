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
          {activeSubTab === 'stays' && (() => {
            const d = booking.details || {};
            const stayName = d.hotelName || d.propertyName || (booking.type === 'hotel' ? booking.itemName : '');
            const roomCat = d.roomType || d.roomCategory || 'Assigned by Hospitality Desk';
            const mealPlan = d.mealPlan || 'Per Package Inclusions';
            const location = d.location || d.destination || 'Kashmir Valley';
            const crsCode = d.confirmationCode || d.crsCode || `#KC-${booking.id.slice(-6).toUpperCase()}`;
            const nights = d.nights || d.duration || 'Scheduled Stay';

            return (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold uppercase text-white tracking-wider flex items-center gap-2">
                    <Building className="w-4 h-4 text-amber-400" />
                    <span>Reserved Accommodations & Stays</span>
                  </h3>
                  <span className={cn("text-xs font-bold", stayName ? "text-emerald-400" : "text-amber-400")}>
                    {stayName ? '✓ Linked to Booking Record' : 'Curator Assigning Property'}
                  </span>
                </div>

                {stayName ? (
                  <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-3">
                      <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[9px] font-black uppercase">
                        Verified Reservation
                      </Badge>
                      <span className="text-xs font-mono text-white/40">{nights}</span>
                    </div>

                    <h4 className="font-extrabold text-base text-white group-hover:text-amber-400 transition-colors">
                      {stayName}
                    </h4>
                    <p className="text-xs text-white/50 mt-1">{location}</p>

                    <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] text-white/40 block">Room Category</span>
                        <span className="font-bold text-white">{roomCat}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-white/40 block">Meal Plan</span>
                        <span className="font-bold text-amber-400">{mealPlan}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 flex items-center justify-between border-t border-white/5">
                      <span className="text-[10px] text-white/40 font-mono">Ref: {crsCode}</span>
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
                ) : (
                  <div className="bg-slate-900/60 border border-dashed border-white/15 rounded-2xl p-6 text-center space-y-3">
                    <Building className="w-8 h-8 text-amber-400/60 mx-auto" />
                    <div>
                      <h4 className="text-sm font-bold text-white">Hotel Allocation In Progress</h4>
                      <p className="text-xs text-white/50 max-w-md mx-auto mt-1">
                        Your stay block for <span className="text-white font-semibold">{booking.itemName}</span> is being finalized by our Hospitality Operations Desk. Once confirmed, your CRS code and room details will sync here automatically.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => onShowSlip({ type: 'hotel', booking })}
                      className="h-8 px-4 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 gap-1.5"
                    >
                      <Ticket className="w-3.5 h-3.5" />
                      <span>Open Booking Voucher</span>
                    </Button>
                  </div>
                )}
              </div>
            );
          })()}

          {/* 3. CHAUFFEUR & FLEET SUB-TAB */}
          {activeSubTab === 'chauffeur' && (() => {
            const d = booking.details || {};
            const driverName = d.driverName || d.chauffeurName || '';
            const driverPhone = d.driverPhone || d.chauffeurPhone || '';
            const vehicleModel = d.vehicleModel || d.cabType || (booking.type === 'cab' ? booking.itemName : '');
            const vehicleNumber = d.vehicleNumber || d.registrationNo || 'Assigned 24h Prior';
            const initials = driverName ? driverName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : 'KC';

            return (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold uppercase text-white tracking-wider flex items-center gap-2">
                    <Car className="w-4 h-4 text-amber-400" />
                    <span>Dedicated Chauffeur & Vehicle Allocation</span>
                  </h3>
                  <span className={cn("text-xs font-bold", driverName ? "text-emerald-400" : "text-amber-400")}>
                    {driverName ? '✓ Driver Assigned' : 'Dispatch Scheduled'}
                  </span>
                </div>

                {driverName || vehicleModel ? (
                  <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-5">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg">
                          {initials}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-extrabold text-white">{driverName || 'Fleet Operations Assigning'}</h4>
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[9px] uppercase font-black">
                              {driverName ? 'Verified Chauffeur' : 'Confirmed Vehicle'}
                            </Badge>
                          </div>
                          <p className="text-xs text-white/50 mt-0.5">
                            {driverPhone ? `Direct Contact: ${driverPhone}` : 'Chauffeur contact shared 24 hours prior to pickup'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {driverPhone && (
                          <a
                            href={`tel:${driverPhone}`}
                            className="inline-flex items-center justify-center h-10 px-4 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 gap-1.5 shadow-md shadow-amber-500/20"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>Call Driver</span>
                          </a>
                        )}

                        {onOpenDriverTracking && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={onOpenDriverTracking}
                            className="h-10 px-4 rounded-xl text-xs font-bold border-white/10 hover:border-amber-500/40 text-white bg-slate-900/80 gap-1.5"
                          >
                            <Navigation className="w-3.5 h-3.5 text-amber-400" />
                            <span>Live GPS Tracking</span>
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-5 text-xs">
                      <div>
                        <span className="text-[10px] text-white/40 block">Allocated Fleet</span>
                        <span className="font-bold text-white">{vehicleModel || 'Private Tour Vehicle'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-white/40 block">Vehicle Reg. No.</span>
                        <span className="font-mono font-bold text-amber-400">{vehicleNumber}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-white/40 block">Pickup Location</span>
                        <span className="font-bold text-white">{d.pickupLocation || 'Srinagar Airport / Stay'}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-900/60 border border-dashed border-white/15 rounded-2xl p-6 text-center space-y-3">
                    <Car className="w-8 h-8 text-amber-400/60 mx-auto" />
                    <div>
                      <h4 className="text-sm font-bold text-white">Chauffeur Dispatch Pending</h4>
                      <p className="text-xs text-white/50 max-w-md mx-auto mt-1">
                        Your dedicated mountain-trained chauffeur and vehicle registration number are mapped automatically 24 hours before arrival and transmitted via WhatsApp.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onShowSlip({ type: 'cab', booking })}
                      className="h-8 px-4 rounded-xl text-xs font-bold bg-slate-900/80 border-white/15 text-white hover:bg-white/10 gap-1.5"
                    >
                      <Car className="w-3.5 h-3.5 text-amber-400" />
                      <span>View Dispatch Slip</span>
                    </Button>
                  </div>
                )}
              </div>
            );
          })()}

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
                    className="mt-4 h-8 rounded-xl text-xs font-bold bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300"
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
                    className="mt-4 h-8 rounded-xl text-xs font-bold bg-slate-900/80 border-white/10 text-white hover:bg-white/10 hover:text-white"
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
