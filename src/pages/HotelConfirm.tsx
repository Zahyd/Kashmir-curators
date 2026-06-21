import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Building, 
  Calendar, 
  User, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Loader2,
  Lock,
  MessageSquare
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { API_BASE_URL } from '@/lib/api';
import { toast } from 'sonner';

interface PublicReservation {
  id: string;
  hotelName: string;
  hotelLocation: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  roomType: string;
  roomsCount: number;
  mealPlan: string;
  specialRequests?: string | null;
  status: string;
}

export default function HotelConfirm() {
  const { reservationId } = useParams<{ reservationId: string }>();
  const [reservation, setReservation] = useState<PublicReservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [action, setAction] = useState<'confirm' | 'decline' | null>(null);
  const [confirmRef, setConfirmRef] = useState('');
  const [declineReason, setDeclineReason] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (reservationId) {
      fetchReservationDetails();
    }
  }, [reservationId]);

  const fetchReservationDetails = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/reservations/public/${reservationId}`);
      if (!response.ok) throw new Error('Reservation details not found');
      const data = await response.json();
      setReservation(data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load reservation details');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/reservations/public/${reservationId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingReference: confirmRef })
      });
      if (!response.ok) throw new Error('Failed to submit confirmation');
      setSuccessMsg('confirmed');
      toast.success('Reservation successfully confirmed!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit confirmation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!declineReason.trim()) {
      toast.error('Please specify a reason for declining the reservation.');
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/reservations/public/${reservationId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: declineReason })
      });
      if (!response.ok) throw new Error('Failed to submit decline request');
      setSuccessMsg('declined');
      toast.success('Reservation decline successfully recorded');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit decline request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b0d] flex items-center justify-center text-white">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-kashmir-gold mx-auto" />
          <p className="text-xs uppercase tracking-widest font-black text-white/40">Loading Booking Intel...</p>
        </div>
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="min-h-screen bg-[#070b0d] flex items-center justify-center text-white p-6">
        <Card className="max-w-md w-full bg-white/[0.02] border-white/5 rounded-[2.5rem] p-10 text-center space-y-6 backdrop-blur-xl">
          <AlertCircle className="w-16 h-16 text-rose-500 mx-auto" />
          <h2 className="text-2xl font-display font-bold">Invalid Link</h2>
          <p className="text-sm text-white/50 leading-relaxed">
            This reservation link is invalid, expired, or has been revoked. Please check the email request or contact Kashmir Curators Operations.
          </p>
        </Card>
      </div>
    );
  }

  if (successMsg === 'confirmed' || reservation.status === 'Confirmed') {
    return (
      <div className="min-h-screen bg-[#070b0d] flex items-center justify-center text-white p-6">
        <Card className="max-w-md w-full bg-white/[0.02] border-emerald-500/20 rounded-[2.5rem] p-10 text-center space-y-6 backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />
          <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto" />
          <h2 className="text-3xl font-display font-black text-white">Reservation Confirmed</h2>
          <p className="text-sm text-white/60 leading-relaxed">
            Thank you! The booking for <strong className="text-white">{reservation.guestName}</strong> at <strong className="text-white">{reservation.hotelName}</strong> has been successfully confirmed.
          </p>
          {confirmRef && (
            <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 inline-block">
              <span className="text-[10px] text-emerald-400 uppercase font-black block tracking-wider mb-1">Confirmation Code</span>
              <strong className="text-lg font-mono text-white">{confirmRef}</strong>
            </div>
          )}
          <p className="text-xs text-white/30">
            A confirmation notification has been dispatched to the Kashmir Curators operations desk. No further action is required.
          </p>
        </Card>
      </div>
    );
  }

  if (successMsg === 'declined' || reservation.status === 'Rejected') {
    return (
      <div className="min-h-screen bg-[#070b0d] flex items-center justify-center text-white p-6">
        <Card className="max-w-md w-full bg-white/[0.02] border-rose-500/20 rounded-[2.5rem] p-10 text-center space-y-6 backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-rose-500" />
          <XCircle className="w-16 h-16 text-rose-400 mx-auto" />
          <h2 className="text-3xl font-display font-black text-white">Request Declined</h2>
          <p className="text-sm text-white/60 leading-relaxed">
            This reservation request has been marked as declined/rejected. 
          </p>
          <p className="text-xs text-white/30">
            The Kashmir Curators operations team has been notified to re-route the guest booking details.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b0d] text-white flex items-center justify-center p-6 py-12">
      <div className="max-w-2xl w-full space-y-8">
        
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-display font-black tracking-widest text-kashmir-gold">KASHMIR CURATORS</h1>
          <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-widest text-white/40 font-bold">
            <Lock className="w-3.5 h-3.5" />
            <span>Secure Hotel Acknowledgment Portal</span>
          </div>
        </div>

        {/* Reservation Details Card */}
        <Card className="bg-white/[0.02] border-white/5 rounded-[2.5rem] p-8 md:p-10 backdrop-blur-xl shadow-2xl space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-kashmir-gold/5 blur-[50px] -mr-24 -mt-24" />
          
          <div className="border-b border-white/5 pb-6">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-kashmir-gold mb-2 block">Property details</span>
            <h2 className="text-2xl font-display font-bold flex items-center gap-3">
              <Building className="w-6 h-6 text-white/40" />
              {reservation.hotelName}
            </h2>
            <p className="text-sm text-white/40 mt-1">{reservation.hotelLocation}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 text-sm">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-white/30 tracking-wider">Lead Guest Name</span>
              <p className="font-bold text-white flex items-center gap-2"><User className="w-4 h-4 text-white/20" /> {reservation.guestName}</p>
            </div>
            
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-white/30 tracking-wider">Meal Plan Included</span>
              <p className="font-bold text-kashmir-gold">{reservation.mealPlan}</p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-white/30 tracking-wider">Stay Duration</span>
              <p className="font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-white/20" />
                {new Date(reservation.checkIn).toLocaleDateString(undefined, { dateStyle: 'medium' })} — {new Date(reservation.checkOut).toLocaleDateString(undefined, { dateStyle: 'medium' })}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-white/30 tracking-wider">Rooms & Room Type</span>
              <p className="font-bold text-white">{reservation.roomsCount}x {reservation.roomType}</p>
            </div>
          </div>

          {reservation.specialRequests && (
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
              <span className="text-[10px] font-black uppercase text-white/30 tracking-wider flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5 text-kashmir-gold" /> Special Requests
              </span>
              <p className="text-xs text-white/80 italic font-medium leading-relaxed">
                "{reservation.specialRequests}"
              </p>
            </div>
          )}

          {/* Action Choice UI */}
          {action === null ? (
            <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={() => setAction('confirm')}
                className="flex-1 rounded-2xl h-14 bg-emerald-500 hover:bg-emerald-600 text-black font-black uppercase tracking-widest text-xs border-none"
              >
                Accept & Confirm Booking
              </Button>
              <Button 
                onClick={() => setAction('decline')}
                variant="outline"
                className="flex-1 rounded-2xl h-14 bg-white/5 border-white/5 text-rose-500 hover:text-white hover:bg-rose-600 font-black uppercase tracking-widest text-xs"
              >
                Decline Request
              </Button>
            </div>
          ) : action === 'confirm' ? (
            <form onSubmit={handleConfirm} className="pt-6 border-t border-white/5 space-y-6">
              <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-widest">Confirming Reservation</h3>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-white/40 block">Hotel Booking Reference / Confirmation Number (Optional)</label>
                <Input 
                  placeholder="e.g. KC-REF-98721"
                  value={confirmRef}
                  onChange={(e) => setConfirmRef(e.target.value)}
                  className="bg-white/5 border-white/5 rounded-2xl h-12 text-sm focus:ring-emerald-500/20"
                />
              </div>

              <div className="flex gap-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setAction(null)}
                  disabled={submitting}
                  className="flex-1 rounded-xl h-12 text-[10px] font-black uppercase tracking-widest bg-white/5 border-white/5 text-white"
                >
                  Back
                </Button>
                <Button 
                  type="submit" 
                  disabled={submitting}
                  className="flex-1 rounded-xl h-12 text-[10px] font-black uppercase tracking-widest bg-emerald-500 hover:bg-emerald-600 text-black border-none"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Submit Confirmation'}
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleDecline} className="pt-6 border-t border-white/5 space-y-6">
              <h3 className="text-sm font-bold text-rose-500 uppercase tracking-widest">Declining Reservation</h3>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-white/40 block">Reason for Decline / Notes</label>
                <Textarea 
                  required
                  placeholder="e.g. Fully Booked / Sold Out for requested dates."
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  className="bg-white/5 border-white/5 rounded-2xl min-h-[100px] text-sm focus:ring-rose-500/20"
                />
              </div>

              <div className="flex gap-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setAction(null)}
                  disabled={submitting}
                  className="flex-1 rounded-xl h-12 text-[10px] font-black uppercase tracking-widest bg-white/5 border-white/5 text-white"
                >
                  Back
                </Button>
                <Button 
                  type="submit" 
                  disabled={submitting}
                  className="flex-1 rounded-xl h-12 text-[10px] font-black uppercase tracking-widest bg-rose-600 hover:bg-rose-700 text-white border-none"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Confirm Decline'}
                </Button>
              </div>
            </form>
          )}

        </Card>

      </div>
    </div>
  );
}
