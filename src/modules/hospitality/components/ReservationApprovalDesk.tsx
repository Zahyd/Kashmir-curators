import React, { useState, useEffect } from 'react';
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
  Share2,
  RefreshCw,
  Search,
  BedDouble,
  ShieldCheck,
  Building2,
  PhoneCall,
  Eye,
  LogOut,
  LogIn
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { API_BASE_URL } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface HotelReservationItem {
  id: string;
  bookingReference?: string;
  guestName: string;
  guestPhone?: string;
  guestEmail?: string;
  roomType: string;
  roomsCount: number;
  checkIn: string;
  checkOut: string;
  mealPlan: 'EP' | 'CP' | 'MAP' | 'AP';
  status: 'Pending' | 'Confirmed' | 'Checked-In' | 'Checked-Out' | 'Hold' | 'Rejected' | 'Cancelled';
  paymentStatus?: string;
  totalAmount: number;
  hotelDues: number;
  contractRate: number;
  specialRequests?: string;
  agentName?: string;
  assignedRoomNumber?: string;
  guestIdType?: string;
  guestIdNumber?: string;
  auditLogs?: string;
}

interface Room {
  id: string;
  roomNumber: string;
  category?: { name: string };
  status: string;
  housekeeping: string;
}

interface ReservationApprovalDeskProps {
  selectedHotelId?: string;
}

export const ReservationApprovalDesk: React.FC<ReservationApprovalDeskProps> = ({ selectedHotelId }) => {
  const { token, user } = useAuth();
  const [reservations, setReservations] = useState<HotelReservationItem[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; basePrice: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected reservation for detail dialog
  const [selectedRes, setSelectedRes] = useState<HotelReservationItem | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Check-In dialog
  const [checkInModalOpen, setCheckInModalOpen] = useState(false);
  const [checkInRes, setCheckInRes] = useState<HotelReservationItem | null>(null);
  const [assignedRoom, setAssignedRoom] = useState('');
  const [idType, setIdType] = useState('Aadhaar Card');
  const [idNumber, setIdNumber] = useState('');

  // Direct Booking Modal
  const [createBookingModalOpen, setCreateBookingModalOpen] = useState(false);
  const [newGuestName, setNewGuestName] = useState('');
  const [newGuestPhone, setNewGuestPhone] = useState('');
  const [newGuestEmail, setNewGuestEmail] = useState('');
  const [newRoomType, setNewRoomType] = useState('');
  const [newRoomsCount, setNewRoomsCount] = useState('1');
  const [newCheckIn, setNewCheckIn] = useState('');
  const [newCheckOut, setNewCheckOut] = useState('');
  const [newMealPlan, setNewMealPlan] = useState<'EP' | 'CP' | 'MAP' | 'AP'>('CP');
  const [newContractRate, setNewContractRate] = useState('14500');
  const [newSpecialRequests, setNewSpecialRequests] = useState('');
  const [newAgentName, setNewAgentName] = useState('Direct Walk-In / Front Desk');
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const authToken = token || localStorage.getItem('auth_token') || '';
      const hotelParam = selectedHotelId ? `?hotelId=${encodeURIComponent(selectedHotelId)}` : '';

      const [resRes, roomsRes, catRes] = await Promise.all([
        fetch(`${API_BASE_URL}/hotel-reservations${hotelParam}`, {
          headers: { Authorization: `Bearer ${authToken}` }
        }),
        fetch(`${API_BASE_URL}/hotels/operations/rooms${hotelParam}`, {
          headers: { Authorization: `Bearer ${authToken}` }
        }),
        fetch(`${API_BASE_URL}/hotels/operations/categories${hotelParam}`, {
          headers: { Authorization: `Bearer ${authToken}` }
        })
      ]);

      if (resRes.ok) {
        const data = await resRes.json();
        setReservations(Array.isArray(data) ? data : []);
      } else {
        setReservations([]);
      }

      if (roomsRes.ok) {
        const roomsData = await roomsRes.json();
        setRooms(Array.isArray(roomsData) ? roomsData : []);
      }

      if (catRes.ok) {
        const catData = await catRes.json();
        const cats = Array.isArray(catData) ? catData : [];
        setCategories(cats);
        if (cats.length > 0 && !newRoomType) {
          setNewRoomType(cats[0].name);
          setNewContractRate(String(cats[0].basePrice || 14500));
        }
      }
    } catch (err) {
      console.error('Failed to load reservations:', err);
      setReservations([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token, selectedHotelId]);

  const handleCreateDirectBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGuestName.trim() || !newCheckIn || !newCheckOut) {
      toast.error('Please enter guest name, check-in, and check-out dates');
      return;
    }

    try {
      setIsSubmittingBooking(true);
      const authToken = token || localStorage.getItem('auth_token') || '';
      const nights = Math.max(1, Math.ceil((new Date(newCheckOut).getTime() - new Date(newCheckIn).getTime()) / (1000 * 60 * 60 * 24)));
      const count = Number(newRoomsCount) || 1;
      const rate = Number(newContractRate) || 0;
      const total = rate * count * nights;

      const res = await fetch(`${API_BASE_URL}/hotel-reservations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          hotelId: selectedHotelId,
          guestName: newGuestName.trim(),
          guestPhone: newGuestPhone.trim(),
          guestEmail: newGuestEmail.trim(),
          roomType: newRoomType || 'Deluxe Suite',
          roomsCount: count,
          checkIn: new Date(newCheckIn).toISOString(),
          checkOut: new Date(newCheckOut).toISOString(),
          mealPlan: newMealPlan,
          contractRate: rate,
          totalAmount: total,
          status: 'Confirmed',
          paymentStatus: 'Paid',
          specialRequests: newSpecialRequests,
          agentName: newAgentName
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create reservation');
      }

      toast.success(`Direct reservation for ${newGuestName} confirmed!`, {
        description: `Total ${nights} nights booking created in Neon DB.`,
        icon: '🏨'
      });
      setCreateBookingModalOpen(false);
      setNewGuestName('');
      setNewGuestPhone('');
      setNewGuestEmail('');
      setNewSpecialRequests('');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Error creating reservation');
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  // Handle Status Transitions (Confirm / Hold / Reject)
  const handleAction = async (id: string, action: 'Confirmed' | 'Hold' | 'Rejected') => {
    try {
      const authToken = token || localStorage.getItem('auth_token') || '';
      const endpoint = action === 'Confirmed' 
        ? `${API_BASE_URL}/hotel-reservations/${id}/confirm`
        : `${API_BASE_URL}/hotel-reservations/${id}`;

      const res = await fetch(endpoint, {
        method: action === 'Confirmed' ? 'POST' : 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          status: action,
          holdUntil: action === 'Hold' ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null
        })
      });

      if (!res.ok) throw new Error(`Failed to update status to ${action}`);

      if (action === 'Confirmed') {
        toast.success(`Booking Confirmed! Official Voucher dispatched.`, { icon: '✅' });
      } else if (action === 'Hold') {
        toast.info(`Booking placed on 24-hour hold.`, { icon: '⏳' });
      } else {
        toast.error(`Reservation declined.`);
      }

      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Error updating status');
    }
  };

  // Check-In Guest Handler
  const handleOpenCheckIn = (resItem: HotelReservationItem) => {
    setCheckInRes(resItem);
    setAssignedRoom(resItem.assignedRoomNumber || (rooms[0]?.roomNumber || ''));
    setIdType(resItem.guestIdType || 'Aadhaar Card');
    setIdNumber(resItem.guestIdNumber || '');
    setCheckInModalOpen(true);
  };

  const handleConfirmCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkInRes) return;

    try {
      const authToken = token || localStorage.getItem('auth_token') || '';
      const res = await fetch(`${API_BASE_URL}/hotel-reservations/${checkInRes.id}/check-in`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          assignedRoomNumber: assignedRoom,
          guestIdType: idType,
          guestIdNumber: idNumber
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Check-in failed');
      }

      toast.success(`${checkInRes.guestName} successfully checked in to Room ${assignedRoom}!`, {
        icon: '🏨'
      });
      setCheckInModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to complete check-in');
    }
  };

  // Check-Out Guest Handler
  const handleCheckOut = async (resItem: HotelReservationItem) => {
    if (!window.confirm(`Confirm check-out for ${resItem.guestName}? Room will be scheduled for turnover cleaning.`)) {
      return;
    }

    try {
      const authToken = token || localStorage.getItem('auth_token') || '';
      const res = await fetch(`${API_BASE_URL}/hotel-reservations/${resItem.id}/check-out`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        }
      });

      if (!res.ok) throw new Error('Check-out failed');

      toast.success(`${resItem.guestName} checked out. Room marked dirty & turnover task generated!`, {
        icon: '🧹'
      });
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Error checking out guest');
    }
  };

  const getMealPlanLabel = (mp: string) => {
    switch (mp) {
      case 'EP': return 'European Plan (Room Only)';
      case 'CP': return 'Continental Plan (Bed & Breakfast)';
      case 'MAP': return 'Modified American Plan (Breakfast + Dinner)';
      case 'AP': return 'American Plan (All Meals Included)';
      default: return mp;
    }
  };

  // Filtered reservations
  const filtered = reservations.filter(r => {
    const matchesSearch = r.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.guestPhone || '').includes(searchQuery) ||
      (r.bookingReference || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.roomType || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'PENDING') return r.status === 'Pending';
    if (statusFilter === 'CONFIRMED') return r.status === 'Confirmed';
    if (statusFilter === 'IN_HOUSE') return r.status === 'Checked-In';
    if (statusFilter === 'CHECKED_OUT') return r.status === 'Checked-Out';
    if (statusFilter === 'HOLD') return r.status === 'Hold';

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 sm:p-5 rounded-3xl border border-border/80 shadow-sm">
        <div>
          <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
            <span>Guest Reservations & Voucher Desk</span>
            <Badge variant="outline" className="text-emerald-600 border-emerald-500/40 text-xs">
              Live B2B Sync
            </Badge>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Review incoming booking vouchers, allocate rooms, verify guest IDs, and manage departures.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search guest or ref..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 w-52 text-xs rounded-xl"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={isLoading}
            className="rounded-xl text-xs gap-1.5 h-10"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setCreateBookingModalOpen(true)}
            className="rounded-xl text-xs font-bold gap-1.5 h-10 bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 shrink-0"
          >
            <CalendarCheck2 className="w-4 h-4" />
            <span>+ Direct Booking</span>
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: 'ALL', label: 'All Bookings' },
          { id: 'PENDING', label: 'Pending Confirmations' },
          { id: 'CONFIRMED', label: 'Confirmed Vouchers' },
          { id: 'IN_HOUSE', label: 'In-House (Checked-In)' },
          { id: 'CHECKED_OUT', label: 'Departed' },
          { id: 'HOLD', label: 'On Hold' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              statusFilter === tab.id
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-card border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Reservation Cards List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="rounded-3xl border border-border/60 p-6 animate-pulse bg-card">
                <div className="flex justify-between items-center mb-4">
                  <div className="h-6 w-48 bg-muted rounded-lg" />
                  <div className="h-6 w-20 bg-muted rounded-full" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="h-10 bg-muted rounded-xl" />
                  <div className="h-10 bg-muted rounded-xl" />
                  <div className="h-10 bg-muted rounded-xl" />
                  <div className="h-10 bg-muted rounded-xl" />
                </div>
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="rounded-3xl border border-dashed border-border p-12 text-center bg-card/60">
            <CalendarCheck2 className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
            <h4 className="font-bold text-base text-foreground">No Reservations Found</h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
              {reservations.length === 0 
                ? 'No guest reservations have been created or received for this property yet. Create a direct front-desk booking or wait for B2B partner agency vouchers.'
                : 'No bookings match your current search or status filter.'}
            </p>
            <Button
              size="sm"
              onClick={() => setCreateBookingModalOpen(true)}
              className="rounded-xl text-xs font-bold gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950"
            >
              <CalendarCheck2 className="w-4 h-4" />
              <span>Create Direct Booking</span>
            </Button>
          </Card>
        ) : (
          filtered.map((r) => {
            const checkInDate = new Date(r.checkIn);
            const checkOutDate = new Date(r.checkOut);
            const nights = Math.max(1, Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)));

            return (
              <Card 
                key={r.id} 
                className={`rounded-3xl border transition-all overflow-hidden ${
                  r.status === 'Pending' ? 'border-amber-500/50 bg-amber-500/5' :
                  r.status === 'Checked-In' ? 'border-blue-500/40 bg-blue-500/5' :
                  r.status === 'Confirmed' ? 'border-emerald-500/40 bg-card' : 'border-border bg-card'
                }`}
              >
                <div className="p-5 sm:p-6 space-y-4">
                  {/* Top Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-muted/80 flex items-center justify-center font-bold text-sm text-foreground shrink-0 border border-border">
                        <User className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-base text-foreground">{r.guestName}</h4>
                          <Badge variant="outline" className="font-mono text-[10px] uppercase font-bold">
                            {r.bookingReference || `KCH-${r.id.slice(0, 6).toUpperCase()}`}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                          {r.guestPhone && <span>{r.guestPhone}</span>}
                          {r.agentName && (
                            <>
                              <span>•</span>
                              <span>Agent: <strong className="text-foreground">{r.agentName}</strong></span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <Badge 
                        className={`text-xs font-black uppercase px-3 py-1 ${
                          r.status === 'Confirmed' ? 'bg-emerald-600 text-white' :
                          r.status === 'Checked-In' ? 'bg-blue-600 text-white' :
                          r.status === 'Pending' ? 'bg-amber-500 text-slate-950' :
                          r.status === 'Hold' ? 'bg-purple-600 text-white' :
                          r.status === 'Checked-Out' ? 'bg-slate-600 text-white' : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {r.status}
                      </Badge>

                      {r.paymentStatus && (
                        <Badge variant="outline" className="text-xs font-bold">
                          {r.paymentStatus}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Booking Details Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div className="p-3 bg-muted/40 rounded-2xl space-y-1">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                        Dates & Duration
                      </span>
                      <p className="font-bold text-foreground">
                        {checkInDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                        {' — '}
                        {checkOutDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                      </p>
                      <p className="text-[11px] text-muted-foreground">{nights} Nights • {r.roomsCount} Suite</p>
                    </div>

                    <div className="p-3 bg-muted/40 rounded-2xl space-y-1">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                        Room & Meal Plan
                      </span>
                      <p className="font-bold text-foreground truncate">{r.roomType}</p>
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">{r.mealPlan} Plan</p>
                    </div>

                    <div className="p-3 bg-muted/40 rounded-2xl space-y-1">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                        Assigned Suite #
                      </span>
                      <p className="font-mono font-black text-sm text-foreground">
                        {r.assignedRoomNumber ? `Suite #${r.assignedRoomNumber}` : 'Not Allocated Yet'}
                      </p>
                      {r.guestIdVerified && (
                        <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> ID Verified
                        </p>
                      )}
                    </div>

                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl space-y-1">
                      <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 block">
                        Hotel Net Payable
                      </span>
                      <p className="font-mono font-black text-base text-emerald-600 dark:text-emerald-400">
                        ₹{(r.hotelDues || r.totalAmount || 0).toLocaleString('en-IN')}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Gross: ₹{r.totalAmount?.toLocaleString('en-IN')}</p>
                    </div>
                  </div>

                  {/* Special Requests Banner */}
                  {r.specialRequests && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs text-foreground flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                      <span><strong>Special Guest Request:</strong> {r.specialRequests}</span>
                    </div>
                  )}

                  {/* Action Buttons Bar */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-border/50">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedRes(r);
                        setDetailModalOpen(true);
                      }}
                      className="text-xs font-bold text-muted-foreground hover:text-foreground h-9"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1.5" />
                      View Audit Details
                    </Button>

                    <div className="flex items-center gap-2">
                      {/* PENDING ACTIONS */}
                      {r.status === 'Pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAction(r.id, 'Hold')}
                            className="text-xs font-bold rounded-xl h-9 border-amber-500/40 text-amber-700 dark:text-amber-400"
                          >
                            Place 24h Hold
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAction(r.id, 'Rejected')}
                            className="text-xs font-bold rounded-xl h-9 text-rose-600 border-rose-500/30"
                          >
                            Decline
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleAction(r.id, 'Confirmed')}
                            className="text-xs font-bold rounded-xl h-9 bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                          >
                            <Check className="w-3.5 h-3.5 mr-1" />
                            Confirm Voucher
                          </Button>
                        </>
                      )}

                      {/* CONFIRMED ACTIONS (Ready to check-in) */}
                      {r.status === 'Confirmed' && (
                        <Button
                          size="sm"
                          onClick={() => handleOpenCheckIn(r)}
                          className="text-xs font-bold rounded-xl h-9 bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20"
                        >
                          <LogIn className="w-3.5 h-3.5 mr-1.5" />
                          Check-In Guest
                        </Button>
                      )}

                      {/* IN-HOUSE ACTIONS (Ready to check-out) */}
                      {r.status === 'Checked-In' && (
                        <Button
                          size="sm"
                          onClick={() => handleCheckOut(r)}
                          className="text-xs font-bold rounded-xl h-9 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-950"
                        >
                          <LogOut className="w-3.5 h-3.5 mr-1.5" />
                          Check-Out & Turnover
                        </Button>
                      )}

                      {/* Direct WhatsApp contact */}
                      {r.guestPhone && (
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="text-xs font-bold rounded-xl h-9 text-emerald-600 border-emerald-500/30"
                        >
                          <a
                            href={`https://wa.me/${r.guestPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Greetings from Kashmir Curators! Regarding your booking ${r.bookingReference || ''} for ${r.roomType}: looking forward to welcoming you!`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <PhoneCall className="w-3.5 h-3.5 mr-1" />
                            WhatsApp
                          </a>
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

      {/* Check-In Modal with Room Allocation & ID Verification */}
      <Dialog open={checkInModalOpen} onOpenChange={setCheckInModalOpen}>
        <DialogContent className="rounded-3xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <LogIn className="w-5 h-5 text-blue-600" />
              <span>Guest Check-In & Room Allocation</span>
            </DialogTitle>
          </DialogHeader>

          {checkInRes && (
            <form onSubmit={handleConfirmCheckIn} className="space-y-4 py-2 text-xs">
              <div className="p-3 bg-muted/40 rounded-2xl">
                <p className="font-bold text-sm text-foreground">{checkInRes.guestName}</p>
                <p className="text-muted-foreground">{checkInRes.roomType} • {checkInRes.roomsCount} Suite</p>
              </div>

              <div>
                <label className="font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                  Assign Suite / Room Number
                </label>
                <Select value={assignedRoom} onValueChange={setAssignedRoom}>
                  <SelectTrigger className="rounded-xl h-11 text-xs">
                    <SelectValue placeholder="Select available clean room" />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms.map(room => (
                      <SelectItem 
                        key={room.id} 
                        value={room.roomNumber}
                        disabled={room.status === 'MAINTENANCE' || room.housekeeping === 'DIRTY'}
                      >
                        Suite #{room.roomNumber} ({room.category?.name || 'Deluxe'}) — {room.status} [{room.housekeeping}]
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                    Govt ID Proof Type
                  </label>
                  <Select value={idType} onValueChange={setIdType}>
                    <SelectTrigger className="rounded-xl h-11 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Aadhaar Card">Aadhaar Card</SelectItem>
                      <SelectItem value="Passport">Passport</SelectItem>
                      <SelectItem value="Voter ID">Voter ID</SelectItem>
                      <SelectItem value="Driving License">Driving License</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                    ID Document Number
                  </label>
                  <Input
                    placeholder="e.g. 8492-XXXX-XXXX"
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    className="rounded-xl h-11 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="text-emerald-950 dark:text-emerald-200 text-[11px]">
                  Room readiness check passed. Central heating and Bukhari verified active.
                </span>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCheckInModalOpen(false)}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20"
                >
                  Confirm Check-In
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Reservation Details & Audit Dialog */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="rounded-3xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-500" />
              <span>Reservation Audit & Details</span>
            </DialogTitle>
          </DialogHeader>

          {selectedRes && (
            <div className="space-y-4 py-2 text-xs">
              <div className="grid grid-cols-2 gap-3 p-4 bg-muted/40 rounded-2xl">
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">Guest</span>
                  <span className="font-bold text-foreground text-sm">{selectedRes.guestName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">Reference</span>
                  <span className="font-mono font-bold text-foreground">{selectedRes.bookingReference || selectedRes.id}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">Check-In</span>
                  <span className="font-medium text-foreground">{new Date(selectedRes.checkIn).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">Check-Out</span>
                  <span className="font-medium text-foreground">{new Date(selectedRes.checkOut).toLocaleString()}</span>
                </div>
              </div>

              <div>
                <h5 className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-2">
                  Action Audit History
                </h5>
                <div className="p-3 rounded-2xl border border-border bg-card space-y-2 max-h-48 overflow-y-auto">
                  {selectedRes.auditLogs ? (
                    (() => {
                      try {
                        const logs = JSON.parse(selectedRes.auditLogs);
                        return logs.map((log: any, idx: number) => (
                          <div key={idx} className="p-2 rounded-xl bg-muted/30 text-[11px] space-y-0.5">
                            <div className="flex items-center justify-between text-muted-foreground text-[10px]">
                              <strong>{log.action}</strong>
                              <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p className="text-foreground">{log.details}</p>
                            <span className="text-[10px] text-muted-foreground">User: {log.user}</span>
                          </div>
                        ));
                      } catch {
                        return <p className="text-muted-foreground italic">No formatted logs.</p>;
                      }
                    })()
                  ) : (
                    <p className="text-muted-foreground italic">Reservation initialized in system.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Direct Reservation / Walk-In Modal */}
      <Dialog open={createBookingModalOpen} onOpenChange={setCreateBookingModalOpen}>
        <DialogContent className="rounded-3xl max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <CalendarCheck2 className="w-5 h-5 text-amber-500" />
              <span>Create Direct Booking / Walk-In</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateDirectBooking} className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                  Primary Guest Name *
                </label>
                <Input
                  placeholder="e.g. Tariq Ahmad & Family"
                  value={newGuestName}
                  onChange={(e) => setNewGuestName(e.target.value)}
                  className="rounded-xl h-10 text-xs font-medium"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                  Phone / WhatsApp
                </label>
                <Input
                  placeholder="+91 98765 43210"
                  value={newGuestPhone}
                  onChange={(e) => setNewGuestPhone(e.target.value)}
                  className="rounded-xl h-10 text-xs font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                  Email Address
                </label>
                <Input
                  type="email"
                  placeholder="guest@example.com"
                  value={newGuestEmail}
                  onChange={(e) => setNewGuestEmail(e.target.value)}
                  className="rounded-xl h-10 text-xs font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                  Agent / Channel Source
                </label>
                <Input
                  value={newAgentName}
                  onChange={(e) => setNewAgentName(e.target.value)}
                  className="rounded-xl h-10 text-xs font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                  Check-In Date *
                </label>
                <Input
                  type="date"
                  value={newCheckIn}
                  onChange={(e) => setNewCheckIn(e.target.value)}
                  className="rounded-xl h-10 text-xs font-medium"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                  Check-Out Date *
                </label>
                <Input
                  type="date"
                  value={newCheckOut}
                  onChange={(e) => setNewCheckOut(e.target.value)}
                  className="rounded-xl h-10 text-xs font-medium"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                  Room Category
                </label>
                {categories.length > 0 ? (
                  <Select value={newRoomType} onValueChange={(val) => {
                    setNewRoomType(val);
                    const cat = categories.find(c => c.name === val);
                    if (cat) setNewContractRate(String(cat.basePrice));
                  }}>
                    <SelectTrigger className="rounded-xl h-10 text-xs">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(c => (
                        <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={newRoomType}
                    onChange={(e) => setNewRoomType(e.target.value)}
                    placeholder="e.g. Deluxe Palace Suite"
                    className="rounded-xl h-10 text-xs"
                  />
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                  Rooms Count
                </label>
                <Input
                  type="number"
                  min="1"
                  value={newRoomsCount}
                  onChange={(e) => setNewRoomsCount(e.target.value)}
                  className="rounded-xl h-10 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                  Meal Plan
                </label>
                <Select value={newMealPlan} onValueChange={(val: any) => setNewMealPlan(val)}>
                  <SelectTrigger className="rounded-xl h-10 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EP">EP (Room Only)</SelectItem>
                    <SelectItem value="CP">CP (Breakfast)</SelectItem>
                    <SelectItem value="MAP">MAP (Bfast+Dinner)</SelectItem>
                    <SelectItem value="AP">AP (All Meals)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Rate Per Night (₹)
              </label>
              <Input
                type="number"
                value={newContractRate}
                onChange={(e) => setNewContractRate(e.target.value)}
                className="rounded-xl h-10 text-xs font-mono font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Special Requests / Winter Preferences
              </label>
              <Input
                placeholder="e.g. Electric blanket, Bukhari heating pre-lit, late Shikara arrival..."
                value={newSpecialRequests}
                onChange={(e) => setNewSpecialRequests(e.target.value)}
                className="rounded-xl h-10 text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateBookingModalOpen(false)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingBooking}
                className="rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md"
              >
                {isSubmittingBooking ? 'Saving...' : 'Confirm & Save Booking'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReservationApprovalDesk;
