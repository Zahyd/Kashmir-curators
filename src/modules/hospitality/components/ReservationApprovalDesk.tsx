import React, { useState } from 'react';
import { 
  CalendarCheck2, 
  Check, 
  X, 
  Clock, 
  Utensils, 
  User, 
  Phone, 
  FileText, 
  CheckCircle2, 
  AlertTriangle,
  Download,
  Share2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export interface HotelReservationItem {
  id: string;
  guestName: string;
  guestPhone?: string;
  roomType: string;
  roomsCount: number;
  checkIn: string;
  checkOut: string;
  mealPlan: 'EP' | 'CP' | 'MAP' | 'AP';
  status: 'Pending' | 'Confirmed' | 'Hold' | 'Rejected';
  contractRate: number;
  specialRequests?: string;
  agentName?: string;
}

const SAMPLE_RESERVATIONS: HotelReservationItem[] = [
  {
    id: 'res-101',
    guestName: 'Vikram & Pooja Malhotra',
    guestPhone: '+91 98200 11223',
    roomType: 'Royal Cedar Houseboat Suite (Heated)',
    roomsCount: 1,
    checkIn: '2026-11-20',
    checkOut: '2026-11-23',
    mealPlan: 'MAP',
    status: 'Pending',
    contractRate: 19500,
    specialRequests: 'Honeymoon candle-light dinner on houseboat deck & Shikara pickup from Ghat 7',
    agentName: 'Chinar Luxury DMC'
  },
  {
    id: 'res-102',
    guestName: 'Faisal Al-Otaibi & Family',
    guestPhone: '+966 50 123 4567',
    roomType: 'Alpine Presidential Chalet',
    roomsCount: 2,
    checkIn: '2026-12-05',
    checkOut: '2026-12-10',
    mealPlan: 'CP',
    status: 'Confirmed',
    contractRate: 92500,
    specialRequests: 'Halal dining, baby crib, central heating 24/7',
    agentName: 'Direct Luxury Partner'
  },
  {
    id: 'res-103',
    guestName: 'Rohan Deshmukh',
    guestPhone: '+91 98765 43210',
    roomType: 'Deluxe Lake View Suite',
    roomsCount: 1,
    checkIn: '2026-11-28',
    checkOut: '2026-11-30',
    mealPlan: 'EP',
    status: 'Hold',
    contractRate: 13000,
    specialRequests: 'Late night arrival from Srinagar airport',
    agentName: 'Himalayan Escapes'
  }
];

export const ReservationApprovalDesk: React.FC = () => {
  const [reservations, setReservations] = useState<HotelReservationItem[]>(SAMPLE_RESERVATIONS);

  const handleAction = (id: string, action: 'Confirmed' | 'Hold' | 'Rejected') => {
    setReservations(prev => prev.map(r => {
      if (r.id === id) {
        if (action === 'Confirmed') {
          toast.success(`Booking Confirmed for ${r.guestName}! Voucher dispatched.`, { icon: '✅' });
        } else if (action === 'Hold') {
          toast.info(`Booking placed on 24-hour hold for ${r.guestName}`, { icon: '⏳' });
        } else {
          toast.error(`Reservation declined for ${r.guestName}`);
        }
        return { ...r, status: action };
      }
      return r;
    }));
  };

  const getMealPlanLabel = (mp: string) => {
    switch(mp) {
      case 'EP': return 'Room Only (EP)';
      case 'CP': return 'Breakfast Included (CP)';
      case 'MAP': return 'Breakfast + Dinner (MAP)';
      case 'AP': return 'All Meals (AP)';
      default: return mp;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-lg text-foreground">Guest Bookings & Voucher Confirmations</h3>
          <p className="text-xs text-muted-foreground">Approve incoming agent vouchers and hold allocations.</p>
        </div>
      </div>

      <div className="space-y-3">
        {reservations.map((res) => {
          const isPending = res.status === 'Pending';
          const isConfirmed = res.status === 'Confirmed';
          const isHold = res.status === 'Hold';

          return (
            <Card key={res.id} className="rounded-3xl border border-border/70 overflow-hidden bg-card hover:shadow-sm transition-all">
              <CardContent className="p-5 space-y-4">
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                      {res.id}
                    </span>
                    <h4 className="font-bold text-base text-foreground">{res.guestName}</h4>
                    {res.agentName && (
                      <span className="text-[11px] text-muted-foreground">via {res.agentName}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge 
                      className={`text-xs font-bold ${
                        isConfirmed ? 'bg-emerald-500 text-white' :
                        isPending ? 'bg-amber-500 text-white animate-pulse' :
                        isHold ? 'bg-purple-500 text-white' : 'bg-rose-500 text-white'
                      }`}
                    >
                      {res.status}
                    </Badge>
                    <span className="text-xs font-bold text-primary">₹{res.contractRate.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-muted/30 p-3.5 rounded-2xl text-xs">
                  <div>
                    <span className="text-muted-foreground">Room Category:</span>
                    <p className="font-semibold text-foreground mt-0.5">{res.roomType} ({res.roomsCount} Unit)</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Check-In / Out:</span>
                    <p className="font-semibold text-foreground mt-0.5">{res.checkIn} &rarr; {res.checkOut}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Meal Plan:</span>
                    <p className="font-semibold text-foreground mt-0.5 flex items-center gap-1">
                      <Utensils className="w-3 h-3 text-primary" />
                      {getMealPlanLabel(res.mealPlan)}
                    </p>
                  </div>
                </div>

                {/* Special Requests */}
                {res.specialRequests && (
                  <p className="text-xs text-muted-foreground italic bg-amber-500/5 p-2.5 rounded-xl border border-amber-500/10">
                    <span className="font-semibold text-foreground not-italic">Guest Request: </span>
                    "{res.specialRequests}"
                  </p>
                )}

                {/* Action buttons */}
                <div className="flex items-center justify-end gap-2 pt-1">
                  {isPending && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAction(res.id, 'Rejected')}
                        className="rounded-xl text-xs text-rose-600 hover:bg-rose-50"
                      >
                        <X className="w-3.5 h-3.5 mr-1" />
                        Decline
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAction(res.id, 'Hold')}
                        className="rounded-xl text-xs border-purple-500/30 text-purple-600 hover:bg-purple-50"
                      >
                        <Clock className="w-3.5 h-3.5 mr-1" />
                        24h Hold
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleAction(res.id, 'Confirmed')}
                        className="rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Confirm Booking Voucher
                      </Button>
                    </>
                  )}

                  {isConfirmed && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toast.success(`Check-In voucher downloaded for ${res.guestName}`)}
                      className="rounded-xl text-xs gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5 text-primary" />
                      Download Guest Voucher Slip
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ReservationApprovalDesk;
