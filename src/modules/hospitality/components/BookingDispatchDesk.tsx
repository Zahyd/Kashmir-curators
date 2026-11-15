import React, { useState, useEffect } from 'react';
import { 
  CalendarCheck2, 
  Plus, 
  Search, 
  RefreshCw, 
  Check, 
  X, 
  Clock, 
  Send, 
  MessageSquare, 
  Share2, 
  Building2, 
  User, 
  Phone, 
  Mail, 
  Utensils, 
  DollarSign, 
  Flame, 
  ShieldCheck, 
  Eye, 
  Download,
  AlertTriangle,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export interface BookingVoucher {
  id: string;
  bookingReference?: string;
  secureToken?: string;
  hotelId: string;
  hotel?: { name: string; location: string; contactPhone?: string; contactEmail?: string };
  guestName: string;
  guestPhone?: string;
  guestEmail?: string;
  roomType: string;
  roomsCount: number;
  checkIn: string;
  checkOut: string;
  mealPlan: 'EP' | 'CP' | 'MAP' | 'AP';
  status: 'Pending' | 'Confirmed' | 'Checked-In' | 'Checked-Out' | 'Hold' | 'Rejected' | 'Cancelled';
  confirmationStage?: 'PENDING_RESPONSE' | 'AVAILABILITY_CONFIRMED' | 'ALTERNATIVE_OFFERED' | 'HOTEL_CONFIRMED' | 'REJECTED_UNAVAILABLE' | 'EXPIRED' | 'CANCELLED';
  paymentStatus?: string;
  totalAmount: number;
  hotelDues: number;
  contractRate: number;
  specialRequests?: string;
  agentName?: string;
  assignedRoomNumber?: string;
  adults?: number;
  hotelConfirmationNumber?: string;
  confirmedRoomType?: string;
  confirmedTariff?: number;
  alternativeRoomType?: string;
  alternativeTariff?: number;
  alternativeDates?: string;
  alternativeNotes?: string;
  clarificationRequest?: string;
  receptionNotes?: string;
  tokenExpiresAt?: string;
  confirmationDeadline?: string;
  createdAt: string;
}

interface HotelOption {
  id: string;
  name: string;
  location: string;
  contactPhone?: string;
}

interface CategoryOption {
  id: string;
  hotelId: string;
  name: string;
  basePrice: number;
}

interface BookingDispatchDeskProps {
  initialHotelId?: string;
}

export const BookingDispatchDesk: React.FC<BookingDispatchDeskProps> = ({ initialHotelId }) => {
  const { token, user } = useAuth();
  const [vouchers, setVouchers] = useState<BookingVoucher[]>([]);
  const [hotels, setHotels] = useState<HotelOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // "Send Booking to Hotel" Modal State
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [selectedHotelId, setSelectedHotelId] = useState(initialHotelId || '');
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [roomType, setRoomType] = useState('');
  const [roomsCount, setRoomsCount] = useState('1');
  const [adultsCount, setAdultsCount] = useState('2');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [mealPlan, setNewMealPlan] = useState<'EP' | 'CP' | 'MAP' | 'AP'>('MAP');
  const [ratePerNight, setRatePerNight] = useState('14500');
  const [specialRequests, setSpecialRequests] = useState('');
  const [agentName, setAgentName] = useState(user?.name ? `${user.name} (B2B Agent)` : 'Kashmir Curators DMC Desk');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Fetch Hotels & Categories for Dropdowns
  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const [hotelsRes, catRes] = await Promise.all([
          fetch(`${API_BASE_URL}/hotels`),
          fetch(`${API_BASE_URL}/hotels/operations/categories`)
        ]);

        if (hotelsRes.ok) {
          const hotelList = await hotelsRes.json();
          setHotels(Array.isArray(hotelList) ? hotelList : []);
          if (hotelList.length > 0 && !selectedHotelId) {
            setSelectedHotelId(initialHotelId || hotelList[0].id);
          }
        }

        if (catRes.ok) {
          const catList = await catRes.json();
          setCategories(Array.isArray(catList) ? catList : []);
        }
      } catch (err) {
        console.error('Failed to load dispatch metadata:', err);
      }
    };
    loadMetadata();
  }, [initialHotelId]);

  // Update roomType when hotel changes
  useEffect(() => {
    if (selectedHotelId) {
      const hotelCats = categories.filter(c => c.hotelId === selectedHotelId);
      if (hotelCats.length > 0) {
        setRoomType(hotelCats[0].name);
        setRatePerNight(String(hotelCats[0].basePrice));
      }
    }
  }, [selectedHotelId, categories]);

  // 2. Fetch all Dispatched Vouchers & Bookings
  const fetchVouchers = async () => {
    try {
      setIsLoading(true);
      const authToken = token || localStorage.getItem('auth_token') || '';
      const res = await fetch(`${API_BASE_URL}/hospitality`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setVouchers(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to load vouchers:', err);
      toast.error('Could not load booking vouchers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, [token]);

  // Handle Dispatch Booking Submission
  const handleDispatchBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHotelId || !guestName.trim() || !checkIn || !checkOut) {
      toast.error('Please fill in hotel, guest name, and travel dates');
      return;
    }

    try {
      setIsSubmitting(true);
      const authToken = token || localStorage.getItem('auth_token') || '';
      const nights = Math.max(1, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)));
      const count = Number(roomsCount) || 1;
      const rate = Number(ratePerNight) || 12000;
      const grossTotal = rate * count * nights;

      const res = await fetch(`${API_BASE_URL}/hospitality`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          hotelId: selectedHotelId,
          guestName: guestName.trim(),
          guestPhone: guestPhone.trim(),
          guestEmail: guestEmail.trim(),
          roomType: roomType || 'Standard Suite',
          roomsCount: count,
          adults: Number(adultsCount) || 2,
          checkIn: new Date(checkIn).toISOString(),
          checkOut: new Date(checkOut).toISOString(),
          mealPlan,
          contractRate: rate,
          totalAmount: grossTotal,
          status: 'Pending',
          paymentStatus: 'Paid',
          specialRequests,
          agentName
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to dispatch booking');
      }

      toast.success(`Booking voucher dispatched to hotel!`, {
        description: `Guest ${guestName} (${nights} nights) sent for hotel confirmation.`,
        icon: '📨'
      });

      setDispatchModalOpen(false);
      setGuestName('');
      setGuestPhone('');
      setGuestEmail('');
      setSpecialRequests('');
      fetchVouchers();
    } catch (err: any) {
      toast.error(err.message || 'Error dispatching booking');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1-Click Status Transitions
  const handleConfirmVoucher = async (voucherId: string, guest: string) => {
    try {
      const authToken = token || localStorage.getItem('auth_token') || '';
      const res = await fetch(`${API_BASE_URL}/hospitality/${voucherId}/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        }
      });

      if (!res.ok) throw new Error('Failed to confirm voucher');

      toast.success(`Booking for ${guest} confirmed! Room guaranteed by hotel.`, {
        icon: '✅'
      });
      fetchVouchers();
    } catch (err: any) {
      toast.error(err.message || 'Error confirming voucher');
    }
  };

  const handleCancelVoucher = async (voucherId: string, guest: string) => {
    if (!window.confirm(`Cancel booking voucher for ${guest}? The room allocation will be released.`)) return;

    try {
      const authToken = token || localStorage.getItem('auth_token') || '';
      const res = await fetch(`${API_BASE_URL}/hospitality/${voucherId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ status: 'Cancelled' })
      });

      if (!res.ok) throw new Error('Failed to cancel voucher');

      toast.info(`Booking voucher for ${guest} cancelled.`);
      fetchVouchers();
    } catch (err: any) {
      toast.error(err.message || 'Error cancelling voucher');
    }
  };

  // Accept alternative proposed by hotel
  const handleAcceptAlternative = async (voucherId: string, guest: string) => {
    try {
      const authToken = token || localStorage.getItem('auth_token') || '';
      const res = await fetch(`${API_BASE_URL}/hospitality/${voucherId}/accept-alternative`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        }
      });

      if (!res.ok) throw new Error('Failed to accept alternative');

      toast.success(`Alternative accepted for ${guest}! Booking confirmed.`, {
        icon: '✅'
      });
      fetchVouchers();
    } catch (err: any) {
      toast.error(err.message || 'Error accepting alternative');
    }
  };

  // Regenerate expiring link and extend deadline
  const handleRegenerateLink = async (voucherId: string) => {
    try {
      const authToken = token || localStorage.getItem('auth_token') || '';
      const res = await fetch(`${API_BASE_URL}/hospitality/${voucherId}/regenerate-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ extendHours: 48 })
      });

      if (!res.ok) throw new Error('Failed to regenerate link');

      toast.success('Secure reception link regenerated with 48h validity!', {
        icon: '🔗'
      });
      fetchVouchers();
    } catch (err: any) {
      toast.error(err.message || 'Error regenerating link');
    }
  };

  // WhatsApp Voucher Formatter
  const handleShareWhatsAppVoucher = (v: BookingVoucher) => {
    const hotelPhone = v.hotel?.contactPhone?.replace(/\D/g, '') || '';
    const nights = Math.max(1, Math.ceil((new Date(v.checkOut).getTime() - new Date(v.checkIn).getTime()) / (1000 * 60 * 60 * 24)));
    const portalUrl = `${window.location.origin}/hospitality?tab=reception&token=${v.secureToken || v.id}`;
    
    const message = 
`*HOTEL BOOKING VOUCHER — KASHMIR CURATORS DMC*
Ref: *${v.bookingReference || v.id.slice(0, 8)}*
---------------------------------------
🏨 *Hotel:* ${v.hotel?.name || 'Partner Hotel'} (${v.hotel?.location || 'Kashmir'})
👤 *Guest Name:* ${v.guestName}
📞 *Guest Contact:* ${v.guestPhone || 'N/A'}
📅 *Check-In:* ${new Date(v.checkIn).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}
📅 *Check-Out:* ${new Date(v.checkOut).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })} (${nights} Nights)
🛏️ *Room Type:* ${v.roomType} (${v.roomsCount} Room(s))
🍽️ *Meal Plan:* ${v.mealPlan}
❄️ *Special Requests:* ${v.specialRequests || 'Standard winter heating required'}
---------------------------------------
💰 *Contract Net Payable:* ₹${v.hotelDues?.toLocaleString('en-IN') || v.totalAmount?.toLocaleString('en-IN')}
Status: *CONFIRMED BY KASHMIR CURATORS*

🔗 *Confirm & Upload Voucher Online:*
${portalUrl}

_Please click the portal link above to confirm room availability and assign your hotel CRS confirmation number. Thank you._`;

    const encoded = encodeURIComponent(message);
    const targetUrl = hotelPhone 
      ? `https://wa.me/${hotelPhone}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;

    window.open(targetUrl, '_blank');
  };

  // Filtered Vouchers
  const filteredVouchers = vouchers.filter(v => {
    const matchesSearch = v.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.bookingReference || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.hotel?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.guestPhone || '').includes(searchQuery);

    if (!matchesSearch) return false;

    if (statusFilter === 'PENDING') return v.status === 'Pending';
    if (statusFilter === 'CONFIRMED') return v.status === 'Confirmed';
    if (statusFilter === 'IN_HOUSE') return v.status === 'Checked-In';
    if (statusFilter === 'CANCELLED') return v.status === 'Cancelled' || v.status === 'Rejected';

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 sm:p-5 rounded-3xl border border-border/80 shadow-sm">
        <div>
          <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
            <span>Hotel Booking & Voucher Dispatch Desk</span>
            <Badge variant="outline" className="text-emerald-600 border-emerald-500/40 text-xs">
              Live Partner Network
            </Badge>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Dispatch confirmed guest booking vouchers directly to Kashmir hotels and houseboats.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search guest or ref #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 w-48 sm:w-60 text-xs rounded-xl"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchVouchers}
            disabled={isLoading}
            className="rounded-xl text-xs gap-1.5 h-10"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setDispatchModalOpen(true)}
            className="rounded-xl text-xs font-bold gap-1.5 h-10 bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 shrink-0"
          >
            <Send className="w-4 h-4" />
            <span>+ Send Booking to Hotel</span>
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: 'ALL', label: 'All Dispatched Vouchers' },
          { id: 'PENDING', label: 'Pending Hotel Confirmation' },
          { id: 'CONFIRMED', label: 'Confirmed by Hotel' },
          { id: 'IN_HOUSE', label: 'In-House (Checked-In)' },
          { id: 'CANCELLED', label: 'Cancelled / Released' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              statusFilter === tab.id
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-card border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Vouchers List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Card key={i} className="h-44 rounded-3xl bg-card border border-border/60 animate-pulse" />
            ))}
          </div>
        ) : filteredVouchers.length === 0 ? (
          <Card className="rounded-3xl border border-dashed border-border p-12 text-center bg-card/60">
            <CalendarCheck2 className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
            <h4 className="font-bold text-base text-foreground">No Booking Vouchers Found</h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
              {vouchers.length === 0 
                ? 'No bookings have been dispatched to partner hotels yet. Click "Send Booking to Hotel" to generate your first voucher.'
                : 'No vouchers match the selected filter.'}
            </p>
            <Button
              size="sm"
              onClick={() => setDispatchModalOpen(true)}
              className="rounded-xl text-xs font-bold gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950"
            >
              <Send className="w-4 h-4" />
              <span>Send First Booking</span>
            </Button>
          </Card>
        ) : (
          filteredVouchers.map((v) => {
            const checkInDate = new Date(v.checkIn);
            const checkOutDate = new Date(v.checkOut);
            const nights = Math.max(1, Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)));

            const isPending = v.status === 'Pending';
            const isConfirmed = v.status === 'Confirmed';
            const isCheckedIn = v.status === 'Checked-In';
            const isCancelled = v.status === 'Cancelled' || v.status === 'Rejected';

            return (
              <Card 
                key={v.id}
                className={`rounded-3xl border transition-all overflow-hidden shadow-sm ${
                  isPending ? 'border-amber-500/50 bg-amber-500/5' :
                  isConfirmed ? 'border-emerald-500/40 bg-card hover:border-emerald-500/70' :
                  isCheckedIn ? 'border-blue-500/40 bg-blue-500/5' : 'border-border/60 bg-muted/20 opacity-80'
                }`}
              >
                <div className="p-5 sm:p-6 space-y-4">
                  {/* Top Bar: Reference + Hotel + Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-muted/80 flex items-center justify-center font-bold text-sm text-foreground shrink-0 border border-border">
                        <Building2 className="w-5 h-5 text-amber-500" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-base text-foreground">
                            {v.hotel?.name || 'Partner Hotel'}
                          </h4>
                          <Badge variant="outline" className="font-mono text-xs font-bold">
                            {v.bookingReference || v.id.slice(0, 8)}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {v.hotel?.location || 'Kashmir'} • Dispatched by {v.agentName || 'B2B Desk'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge 
                        className={`text-xs font-bold px-3 py-1 ${
                          isPending ? 'bg-amber-500 text-slate-950 animate-pulse' :
                          isConfirmed ? 'bg-emerald-600 text-white' :
                          isCheckedIn ? 'bg-blue-600 text-white' : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {isPending && 'Pending Hotel Confirmation'}
                        {isConfirmed && 'Confirmed by Hotel'}
                        {isCheckedIn && 'Checked-In (In-House)'}
                        {isCancelled && 'Cancelled / Released'}
                      </Badge>
                    </div>
                  </div>

                  {/* Middle Grid: Guest, Dates, Room Type, Financials */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">Guest Name</span>
                      <strong className="text-foreground text-sm font-bold block truncate">{v.guestName}</strong>
                      <span className="text-[11px] text-muted-foreground font-mono">{v.guestPhone || 'No Phone'}</span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">Stay Dates</span>
                      <span className="font-semibold text-foreground block">
                        {checkInDate.toLocaleDateString([], { month: 'short', day: 'numeric' })} – {checkOutDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold">
                        {nights} Night{nights > 1 ? 's' : ''} • {v.roomsCount} Room(s)
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">Accommodation & Meal</span>
                      <span className="font-bold text-foreground block truncate">{v.roomType}</span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 mt-0.5 border-border">
                        Plan: {v.mealPlan} ({v.mealPlan === 'EP' ? 'Room Only' : v.mealPlan === 'CP' ? 'Bed & Breakfast' : v.mealPlan === 'MAP' ? 'Bkfst+Dinner' : 'All Meals'})
                      </Badge>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">Contract Net Payable</span>
                      <span className="font-mono text-base font-black text-emerald-600 dark:text-emerald-400 block">
                        ₹{(v.hotelDues || v.totalAmount).toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        Gross: ₹{v.totalAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Special Requests */}
                  {v.specialRequests && (
                    <div className="p-3 bg-muted/40 rounded-2xl text-xs flex items-center gap-2 text-muted-foreground border border-border/60">
                      <Flame className="w-4 h-4 text-amber-500 shrink-0" />
                      <span><strong>Kashmir Preferences:</strong> {v.specialRequests}</span>
                    </div>
                  )}

                  {/* Alternative Offered Banner */}
                  {v.confirmationStage === 'ALTERNATIVE_OFFERED' && (
                    <div className="p-3.5 bg-purple-500/10 rounded-2xl text-xs border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <strong className="text-purple-600 dark:text-purple-400 flex items-center gap-1.5 font-bold">
                          <Sparkles className="w-4 h-4" />
                          Hotel Proposed Alternative Modification:
                        </strong>
                        <p className="text-foreground">
                          Category: <strong>{v.alternativeRoomType || v.roomType}</strong> • Rate: <strong>₹{(v.alternativeTariff || v.contractRate).toLocaleString('en-IN')}/nt</strong> {v.alternativeDates && `• Dates: ${v.alternativeDates}`}
                        </p>
                        {v.alternativeNotes && <p className="text-muted-foreground italic">"{v.alternativeNotes}"</p>}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAcceptAlternative(v.id, v.guestName)}
                        className="rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shrink-0 shadow-sm"
                      >
                        Accept Proposal & Confirm
                      </Button>
                    </div>
                  )}

                  {/* Hotel Confirmation Reference Code */}
                  {v.hotelConfirmationNumber && (
                    <div className="p-3 bg-emerald-500/10 rounded-2xl text-xs border border-emerald-500/30 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                        <span className="text-foreground font-bold">
                          Hotel CRS Confirmation Code: <span className="font-mono text-sm text-emerald-600 dark:text-emerald-400">{v.hotelConfirmationNumber}</span>
                        </span>
                      </div>
                      {v.receptionNotes && (
                        <span className="text-muted-foreground italic truncate max-w-xs text-[11px]">"{v.receptionNotes}"</span>
                      )}
                    </div>
                  )}

                  {/* Action Buttons Row */}
                  <div className="pt-2 border-t border-border/50 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleShareWhatsAppVoucher(v)}
                        className="rounded-xl text-xs font-bold gap-1.5 h-9 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                        <span>WhatsApp Voucher & Link</span>
                      </Button>

                      {/* Open in Reception Portal */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          window.location.href = `/hospitality?tab=reception&id=${v.id}`;
                        }}
                        className="rounded-xl text-xs font-bold gap-1.5 h-9 text-foreground hover:bg-muted"
                      >
                        <Building2 className="w-3.5 h-3.5 text-amber-500" />
                        <span>Open Reception Desk</span>
                      </Button>

                      {/* Copy Link */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const url = `${window.location.origin}/hospitality?tab=reception&token=${v.secureToken || v.id}`;
                          navigator.clipboard.writeText(url);
                          toast.success('Reception portal link copied!');
                        }}
                        className="rounded-xl text-xs text-muted-foreground hover:text-foreground h-9 gap-1"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Copy Link</span>
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      {isPending && (
                        <Button
                          size="sm"
                          onClick={() => handleConfirmVoucher(v.id, v.guestName)}
                          className="rounded-xl text-xs font-bold gap-1.5 h-9 bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Quick Confirm</span>
                        </Button>
                      )}

                      {/* Regenerate Link */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRegenerateLink(v.id)}
                        className="rounded-xl text-xs text-muted-foreground hover:text-foreground h-9 gap-1"
                        title="Extend validity by 48 hours and regenerate link"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Extend 48h</span>
                      </Button>

                      {!isCancelled && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancelVoucher(v.id, v.guestName)}
                          className="rounded-xl text-xs text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 h-9"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Release</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Modal: Send Booking to Hotel */}
      <Dialog open={dispatchModalOpen} onOpenChange={setDispatchModalOpen}>
        <DialogContent className="rounded-3xl max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Send className="w-5 h-5 text-amber-500" />
              <span>Dispatch Booking Voucher to Hotel</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleDispatchBooking} className="space-y-4 py-2 text-xs">
            {/* Property Selection */}
            <div>
              <label className="font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Select Partner Hotel / Houseboat *
              </label>
              <Select value={selectedHotelId} onValueChange={setSelectedHotelId}>
                <SelectTrigger className="rounded-xl h-11 text-xs font-bold">
                  <SelectValue placeholder="Choose Hotel..." />
                </SelectTrigger>
                <SelectContent>
                  {hotels.map(h => (
                    <SelectItem key={h.id} value={h.id} className="text-xs">
                      {h.name} ({h.location.split(',')[0]})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Room Type */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                  Room Category / Tier *
                </label>
                {categories.filter(c => c.hotelId === selectedHotelId).length > 0 ? (
                  <Select 
                    value={roomType} 
                    onValueChange={(val) => {
                      setRoomType(val);
                      const cat = categories.find(c => c.hotelId === selectedHotelId && c.name === val);
                      if (cat) setRatePerNight(String(cat.basePrice));
                    }}
                  >
                    <SelectTrigger className="rounded-xl h-10 text-xs">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.filter(c => c.hotelId === selectedHotelId).map(c => (
                        <SelectItem key={c.id} value={c.name} className="text-xs">
                          {c.name} — ₹{c.basePrice.toLocaleString('en-IN')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    placeholder="e.g. Deluxe Palace Suite"
                    value={roomType}
                    onChange={(e) => setRoomType(e.target.value)}
                    className="rounded-xl h-10"
                    required
                  />
                )}
              </div>

              <div>
                <label className="font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                  Meal Plan
                </label>
                <Select value={mealPlan} onValueChange={(val: any) => setNewMealPlan(val)}>
                  <SelectTrigger className="rounded-xl h-10 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EP">EP (Room Only)</SelectItem>
                    <SelectItem value="CP">CP (Bed & Breakfast)</SelectItem>
                    <SelectItem value="MAP">MAP (Breakfast & Dinner)</SelectItem>
                    <SelectItem value="AP">AP (All Meals Included)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Guest Details */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                  Primary Guest Name *
                </label>
                <Input
                  placeholder="e.g. Dr. Rahul & Priya Sharma"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="rounded-xl h-10 font-medium"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                  Phone / WhatsApp *
                </label>
                <Input
                  placeholder="+91 98201..."
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  className="rounded-xl h-10"
                  required
                />
              </div>
            </div>

            {/* Travel Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                  Check-In Date *
                </label>
                <Input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="rounded-xl h-10"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                  Check-Out Date *
                </label>
                <Input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="rounded-xl h-10"
                  required
                />
              </div>
            </div>

            {/* Rooms Count & Pricing */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                  Rooms Count
                </label>
                <Input
                  type="number"
                  min="1"
                  value={roomsCount}
                  onChange={(e) => setRoomsCount(e.target.value)}
                  className="rounded-xl h-10"
                />
              </div>

              <div>
                <label className="font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                  Adults Count
                </label>
                <Input
                  type="number"
                  min="1"
                  value={adultsCount}
                  onChange={(e) => setAdultsCount(e.target.value)}
                  className="rounded-xl h-10"
                />
              </div>

              <div>
                <label className="font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                  Rate / Night (₹)
                </label>
                <Input
                  type="number"
                  value={ratePerNight}
                  onChange={(e) => setRatePerNight(e.target.value)}
                  className="rounded-xl h-10 font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Special Requests / Winter Preferences
              </label>
              <Input
                placeholder="e.g. Bukhari pre-lit before arrival, Shikara transfer Ghat 2, extra electric blanket..."
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                className="rounded-xl h-10"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDispatchModalOpen(false)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Dispatching...' : 'Dispatch Voucher to Hotel'}</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BookingDispatchDesk;
