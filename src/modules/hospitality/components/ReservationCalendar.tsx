import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  BedDouble, 
  Clock, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  Flame, 
  RefreshCw,
  Eye,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { API_BASE_URL } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Room {
  id: string;
  roomNumber: string;
  category?: { name: string };
  status: string;
  housekeeping: string;
  bukhariActive?: boolean;
}

interface Reservation {
  id: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  roomType: string;
  status: string;
  assignedRoomNumber?: string;
  mealPlan: string;
  totalAmount: number;
  hotelDues: number;
}

interface ReservationCalendarProps {
  onSelectReservation?: (reservationId: string) => void;
  onRefreshNeeded?: () => void;
}

export const ReservationCalendar: React.FC<ReservationCalendarProps> = ({
  onSelectReservation,
  onRefreshNeeded
}) => {
  const { token } = useAuth();
  const [startDate, setStartDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [rooms, setRooms] = useState<Room[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [daysCount, setDaysCount] = useState<number>(7); // 7 days or 14 days view

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const authToken = token || localStorage.getItem('auth_token') || '';
      
      const [roomsRes, resRes] = await Promise.all([
        fetch(`${API_BASE_URL}/hotels/operations/rooms`, {
          headers: { Authorization: `Bearer ${authToken}` }
        }),
        fetch(`${API_BASE_URL}/hotel-reservations`, {
          headers: { Authorization: `Bearer ${authToken}` }
        })
      ]);

      if (roomsRes.ok) {
        const roomsData = await roomsRes.json();
        setRooms(roomsData);
      }

      if (resRes.ok) {
        const resData = await resRes.json();
        setReservations(resData);
      }
    } catch (err) {
      console.error('Failed to load calendar data:', err);
      toast.error('Could not load reservation calendar');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // Generate date array
  const dateRange = Array.from({ length: daysCount }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    return d;
  });

  const handlePrev = () => {
    const d = new Date(startDate);
    d.setDate(d.getDate() - daysCount);
    setStartDate(d);
  };

  const handleNext = () => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + daysCount);
    setStartDate(d);
  };

  const handleToday = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    setStartDate(d);
  };

  // Find bookings for a given room on a given day
  const getBookingForRoomAndDate = (roomNumber: string, date: Date) => {
    const dayTimestamp = date.getTime();
    return reservations.find(r => {
      // Must match assigned room number or room type
      const isAssigned = r.assignedRoomNumber === roomNumber;
      if (!isAssigned) return false;

      const checkIn = new Date(r.checkIn);
      checkIn.setHours(0, 0, 0, 0);
      const checkOut = new Date(r.checkOut);
      checkOut.setHours(0, 0, 0, 0);

      return dayTimestamp >= checkIn.getTime() && dayTimestamp < checkOut.getTime();
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Checked-In':
        return 'bg-blue-600 text-white border-blue-700';
      case 'Confirmed':
        return 'bg-emerald-600 text-white border-emerald-700';
      case 'Hold':
        return 'bg-amber-500 text-slate-950 border-amber-600';
      case 'Pending':
        return 'bg-purple-600 text-white border-purple-700';
      case 'Checked-Out':
        return 'bg-slate-600 text-white border-slate-700';
      default:
        return 'bg-muted text-foreground border-border';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 rounded-3xl border border-border/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-2xl border border-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrev}
              className="h-8 w-8 p-0 rounded-xl"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToday}
              className="h-8 px-3 rounded-xl text-xs font-bold"
            >
              Today
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNext}
              className="h-8 w-8 p-0 rounded-xl"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <span className="text-sm font-bold text-foreground font-mono">
            {startDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
            {' — '}
            {dateRange[dateRange.length - 1]?.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-muted/60 p-1 rounded-xl text-xs font-bold border border-border">
            <button
              onClick={() => setDaysCount(7)}
              className={`px-3 py-1 rounded-lg transition-all ${daysCount === 7 ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}
            >
              7 Days
            </button>
            <button
              onClick={() => setDaysCount(14)}
              className={`px-3 py-1 rounded-lg transition-all ${daysCount === 14 ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}
            >
              14 Days
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={isLoading}
            className="rounded-xl text-xs gap-1.5 h-9"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 text-xs font-semibold px-2">
        <span className="text-muted-foreground">Legend:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-blue-600" />
          <span>Checked-In (In-House)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-emerald-600" />
          <span>Confirmed Voucher</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-amber-500" />
          <span>24h Hold</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-purple-600" />
          <span>Pending Request</span>
        </div>
      </div>

      {/* Rack Timeline Matrix */}
      <Card className="rounded-3xl border border-border bg-card shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="p-3 text-left font-black uppercase tracking-wider text-muted-foreground w-48 sticky left-0 bg-muted/80 backdrop-blur-md z-10 border-r border-border">
                  Room & Category
                </th>
                {dateRange.map((d, i) => {
                  const isToday = d.toDateString() === new Date().toDateString();
                  return (
                    <th
                      key={i}
                      className={`p-2.5 text-center font-bold min-w-[100px] border-r border-border/60 ${
                        isToday ? 'bg-amber-500/15 text-amber-900 dark:text-amber-300' : 'text-foreground'
                      }`}
                    >
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">
                        {d.toLocaleDateString('en-IN', { weekday: 'short' })}
                      </p>
                      <p className="text-sm font-mono font-black mt-0.5">
                        {d.getDate()}
                      </p>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {rooms.length === 0 ? (
                <tr>
                  <td colSpan={daysCount + 1} className="p-8 text-center text-muted-foreground">
                    No physical rooms found. Register your suites in the "Room Categories & Grid" tab.
                  </td>
                </tr>
              ) : (
                rooms.map((room) => (
                  <tr key={room.id} className="hover:bg-muted/10 transition-colors">
                    {/* Room Header Info */}
                    <td className="p-3 font-semibold text-foreground sticky left-0 bg-card border-r border-border z-10">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-sm text-foreground">
                              #{room.roomNumber}
                            </span>
                            {room.bukhariActive && (
                              <Flame className="w-3.5 h-3.5 text-amber-500" title="Bukhari Active" />
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                            {room.category?.name || 'Deluxe Suite'}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-[9px] uppercase px-1.5 py-0 ${
                            room.housekeeping === 'CLEAN'
                              ? 'border-emerald-500/40 text-emerald-600'
                              : room.housekeeping === 'DIRTY'
                              ? 'border-rose-500/40 text-rose-600'
                              : 'border-blue-500/40 text-blue-600'
                          }`}
                        >
                          {room.housekeeping}
                        </Badge>
                      </div>
                    </td>

                    {/* Timeline Day Cells */}
                    {dateRange.map((date, dayIdx) => {
                      const booking = getBookingForRoomAndDate(room.roomNumber, date);
                      const isToday = date.toDateString() === new Date().toDateString();

                      if (booking) {
                        const checkInDate = new Date(booking.checkIn);
                        const isFirstDay = checkInDate.toDateString() === date.toDateString();

                        return (
                          <td
                            key={dayIdx}
                            className={`p-1 border-r border-border/40 ${isToday ? 'bg-amber-500/5' : ''}`}
                          >
                            <div
                              onClick={() => onSelectReservation && onSelectReservation(booking.id)}
                              className={`p-1.5 rounded-lg border text-[11px] font-bold cursor-pointer transition-transform hover:scale-[1.02] shadow-sm truncate ${getStatusColor(
                                booking.status
                              )}`}
                              title={`${booking.guestName} (${booking.status}) • Meal: ${booking.mealPlan}`}
                            >
                              {isFirstDay ? (
                                <div className="leading-tight">
                                  <p className="truncate font-black">{booking.guestName}</p>
                                  <p className="text-[9px] opacity-80">{booking.mealPlan}</p>
                                </div>
                              ) : (
                                <span className="opacity-90 truncate block text-[10px]">
                                  {booking.guestName}
                                </span>
                              )}
                            </div>
                          </td>
                        );
                      }

                      return (
                        <td
                          key={dayIdx}
                          className={`p-2 border-r border-border/40 text-center ${
                            isToday ? 'bg-amber-500/5' : ''
                          }`}
                        >
                          <span className="text-[10px] text-muted-foreground/30 font-mono">
                            —
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default ReservationCalendar;
