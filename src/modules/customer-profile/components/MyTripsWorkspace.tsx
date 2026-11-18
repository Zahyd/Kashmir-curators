import React, { useState } from 'react';
import { 
  Package, 
  Building, 
  Car, 
  Calendar, 
  CreditCard, 
  Ticket, 
  Sparkles, 
  ShieldCheck, 
  AlertCircle, 
  Loader2, 
  Filter, 
  Download, 
  ChevronRight,
  MapPin,
  Clock,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { CustomerBooking } from '../types';
import { TripWorkspaceModal } from './TripWorkspaceModal';

interface MyTripsWorkspaceProps {
  bookings: CustomerBooking[];
  onCancelBooking: (id: string) => Promise<void>;
  cancellingId: string | null;
  onShowSlip: (slip: { type: 'hotel' | 'flight' | 'cab'; booking: any }) => void;
  onShowSafetyCard: (bookingId?: string) => void;
  onOpenDriverTracking?: () => void;
}

export const MyTripsWorkspace: React.FC<MyTripsWorkspaceProps> = ({
  bookings,
  onCancelBooking,
  cancellingId,
  onShowSlip,
  onShowSafetyCard,
  onOpenDriverTracking
}) => {
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [cancelModalBooking, setCancelModalBooking] = useState<CustomerBooking | null>(null);
  const [selectedTripModal, setSelectedTripModal] = useState<CustomerBooking | null>(null);

  const filteredBookings = bookings.filter(b => {
    // Status filter
    if (filterStatus === 'ACTIVE' && b.status !== 'confirmed' && b.status !== 'pending') return false;
    if (filterStatus === 'COMPLETED' && b.status !== 'completed') return false;
    if (filterStatus === 'CANCELLED' && b.status !== 'cancelled') return false;
    
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = b.itemName.toLowerCase().includes(q);
      const matchId = b.id.toLowerCase().includes(q);
      return matchName || matchId;
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px] font-black uppercase">Confirmed</Badge>;
      case 'pending':
        return <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px] font-black uppercase animate-pulse">Pending</Badge>;
      case 'completed':
        return <Badge className="bg-slate-500/20 text-slate-300 border-slate-500/30 text-[10px] font-bold uppercase">Completed</Badge>;
      case 'cancelled':
        return <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/30 text-[10px] font-bold uppercase">Cancelled</Badge>;
      default:
        return <Badge className="bg-slate-500/20 text-slate-300 border-slate-500/30 text-[10px] font-bold">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'hotel':
        return <Building className="w-6 h-6 text-amber-400" />;
      case 'cab':
        return <Car className="w-6 h-6 text-amber-400" />;
      default:
        return <Package className="w-6 h-6 text-amber-400" />;
    }
  };

  return (
    <div className="space-y-6 text-left animate-fade-in">
      
      {/* Header & Filter Controls */}
      <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-black text-white">My Trips & Bookings</h2>
            <p className="text-xs text-white/50">Manage your active itineraries, access verified hotel vouchers, and review past Kashmir stays.</p>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
            <Input 
              placeholder="Search reference or stay..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 rounded-2xl bg-black/40 border-white/10 text-xs text-white placeholder:text-white/30"
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-t border-white/10 pt-3">
          {[
            { id: 'ALL', label: `All Trips (${bookings.length})` },
            { id: 'ACTIVE', label: `Active & Upcoming (${bookings.filter(b => b.status === 'confirmed' || b.status === 'pending').length})` },
            { id: 'COMPLETED', label: `Past Stays (${bookings.filter(b => b.status === 'completed').length})` },
            { id: 'CANCELLED', label: `Cancelled (${bookings.filter(b => b.status === 'cancelled').length})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all ${
                filterStatus === tab.id
                  ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                  : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 border border-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="bg-slate-900/60 border border-dashed border-white/15 p-12 rounded-3xl text-center space-y-3">
          <Ticket className="w-12 h-12 text-white/20 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Bookings Found</h3>
          <p className="text-xs text-white/50 max-w-sm mx-auto">
            {searchQuery 
              ? `No bookings match "${searchQuery}". Try clearing search.`
              : 'You have no reservations matching this filter. Explore curated Kashmir packages or use the AI planner.'}
          </p>
          <Button 
            onClick={() => window.location.href = '/packages'}
            className="rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 mt-2"
          >
            Explore Packages
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map(booking => {
            const isConfirmed = booking.status === 'confirmed';
            const isPending = booking.status === 'pending';
            const isCompleted = booking.status === 'completed';

            return (
              <div 
                key={booking.id}
                className="bg-slate-900/80 border border-white/10 hover:border-amber-500/40 rounded-3xl overflow-hidden transition-all shadow-md group flex flex-col md:flex-row"
              >
                {/* Left Side: Type Icon + Status */}
                <div className="bg-black/30 md:w-44 p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-dashed border-white/10 shrink-0">
                  <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mb-3">
                    {getTypeIcon(booking.type)}
                  </div>
                  {getStatusBadge(booking.status)}
                </div>

                {/* Center: Details & Milestones */}
                <div className="flex-1 p-5 sm:p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-amber-400 uppercase font-bold bg-amber-500/10 px-2 py-0.5 rounded">
                          REF: #{booking.id.toUpperCase().slice(0, 8)}
                        </span>
                        <span className="text-xs text-white/40">
                          {booking.type === 'package' ? 'Tour Package' : booking.type === 'hotel' ? 'Estate Stay' : 'Chauffeur Transit'}
                        </span>
                      </div>
                      <h3 className="font-display text-xl font-bold text-white mt-1.5">{booking.itemName}</h3>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-white/40 block">Total Payout</span>
                      <span className="font-mono text-base font-black text-emerald-400">
                        ₹{booking.totalAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Summary Chips */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-white/70">
                    <span className="flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-xl border border-white/5">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      <span>{new Date(booking.bookingDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </span>

                    <span className="flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-xl border border-white/5">
                      <MapPin className="w-3.5 h-3.5 text-amber-400" />
                      <span>Kashmir Valley</span>
                    </span>
                  </div>

                  {/* Trip Stepper for Confirmed Packages */}
                  {isConfirmed && booking.type === 'package' && (
                    <div className="pt-2 border-t border-white/5 space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-white/80 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                          <span>Curator Milestones</span>
                        </span>
                        <span className="text-emerald-400 font-bold">100% Locked</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                        <div className="bg-white/[0.02] border border-white/5 p-2 rounded-xl text-center">
                          <span className="text-emerald-400 font-bold block">✓ Curator</span>
                          <span className="text-white/50">Assigned</span>
                        </div>
                        <div className="bg-white/[0.02] border border-white/5 p-2 rounded-xl text-center">
                          <span className="text-emerald-400 font-bold block">✓ Air Pass</span>
                          <span className="text-white/50">Secured</span>
                        </div>
                        <div className="bg-white/[0.02] border border-white/5 p-2 rounded-xl text-center">
                          <span className="text-emerald-400 font-bold block">✓ Lodging</span>
                          <span className="text-white/50">Confirmed</span>
                        </div>
                        <div className="bg-white/[0.02] border border-amber-500/20 p-2 rounded-xl text-center bg-amber-500/5">
                          <span className="text-amber-400 font-bold block">✓ Chauffeur</span>
                          <span className="text-white/50">Mapped</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons Row */}
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    <Button
                      size="sm"
                      onClick={() => setSelectedTripModal(booking)}
                      className="h-8 px-3 rounded-xl text-xs font-black bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 gap-1.5 shadow-md shadow-amber-500/20"
                    >
                      <Sparkles className="w-3 h-3 text-slate-950 animate-pulse" />
                      <span>Trip Companion</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onShowSlip({ type: 'hotel', booking })}
                      className="h-8 px-3 rounded-xl text-xs font-bold bg-slate-900/80 border-white/15 hover:bg-white/10 text-white hover:text-white gap-1.5"
                    >
                      <Building className="w-3 h-3 text-amber-400" />
                      <span>Stay Voucher</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onShowSlip({ type: 'flight', booking })}
                      className="h-8 px-3 rounded-xl text-xs font-bold bg-slate-900/80 border-white/15 hover:bg-white/10 text-white hover:text-white gap-1.5"
                    >
                      <Ticket className="w-3 h-3 text-amber-400" />
                      <span>Flight Pass</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onShowSlip({ type: 'cab', booking })}
                      className="h-8 px-3 rounded-xl text-xs font-bold bg-slate-900/80 border-white/15 hover:bg-white/10 text-white hover:text-white gap-1.5"
                    >
                      <Car className="w-3 h-3 text-amber-400" />
                      <span>Chauffeur Details</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onShowSafetyCard(booking.id)}
                      className="h-8 px-3 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20 gap-1.5"
                    >
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      <span>Safety Pass</span>
                    </Button>

                    {(isConfirmed || isPending) && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setCancelModalBooking(booking)}
                        className="h-8 px-2.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl ml-auto"
                      >
                        Cancel Booking
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Comprehensive 360 Trip Companion Workspace Modal */}
      <TripWorkspaceModal
        booking={selectedTripModal}
        open={!!selectedTripModal}
        onOpenChange={(open) => !open && setSelectedTripModal(null)}
        onShowSlip={onShowSlip}
        onShowSafetyCard={onShowSafetyCard}
        onOpenDriverTracking={onOpenDriverTracking}
      />

      {/* Cancel Booking Dialog Guard */}
      <Dialog open={!!cancelModalBooking} onOpenChange={(open) => !open && setCancelModalBooking(null)}>
        {cancelModalBooking && (
          <DialogContent className="rounded-3xl bg-slate-950 text-white border-white/10 shadow-2xl p-6 max-w-md">
            <DialogHeader className="text-left">
              <DialogTitle className="font-display text-xl text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-400" />
                <span>Cancel Reservation</span>
              </DialogTitle>
            </DialogHeader>

            <div className="py-4 space-y-4 text-left text-xs">
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-300 leading-relaxed">
                Are you sure you want to cancel this booking? This initiates hotel inventory release and triggers standard refund settlement per our Kashmir cancellation policy.
              </div>

              <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-1">
                <p className="font-bold text-white text-sm">{cancelModalBooking.itemName}</p>
                <p className="text-white/50">Ref: #{cancelModalBooking.id.toUpperCase().slice(0, 10)}</p>
                <p className="text-emerald-400 font-mono font-bold">Total: ₹{cancelModalBooking.totalAmount.toLocaleString('en-IN')}</p>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button 
                variant="outline" 
                onClick={() => setCancelModalBooking(null)}
                className="rounded-xl bg-slate-900/80 border-white/15 text-white hover:bg-white/10 hover:text-white"
              >
                Keep Booking
              </Button>
              <Button
                variant="destructive"
                disabled={cancellingId === cancelModalBooking.id}
                onClick={async () => {
                  await onCancelBooking(cancelModalBooking.id);
                  setCancelModalBooking(null);
                }}
                className="rounded-xl font-bold"
              >
                {cancellingId === cancelModalBooking.id ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    Cancelling...
                  </>
                ) : (
                  'Confirm Cancellation'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

    </div>
  );
};

export default MyTripsWorkspace;
