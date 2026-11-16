import React, { useState, useEffect } from 'react';
import { 
  BedDouble, 
  Flame, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Sliders, 
  Zap, 
  Droplet,
  Users,
  RefreshCw,
  Search,
  Wrench,
  ShieldCheck,
  Check
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { API_BASE_URL } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { getHospitalityToken, getHospitalityHeaders } from '../utils/hospitalityAuth';
import { toast } from 'sonner';

interface RoomCategory {
  id: string;
  name: string;
  basePrice: number;
}

interface Room {
  id: string;
  roomNumber: string;
  floor?: string;
  status: string;
  operationalStatus?: string;
  housekeeping: string;
  bukhariActive?: boolean;
  electricWarmerActive?: boolean;
  assignedHousekeeper?: string;
  categoryId?: string;
  category?: { name: string; basePrice: number };
  guestName?: string;
}

interface LiveOccupancyGridProps {
  selectedHotelId?: string;
}

export const LiveOccupancyGrid: React.FC<LiveOccupancyGridProps> = ({ selectedHotelId }) => {
  const { token } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [categories, setCategories] = useState<RoomCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // New room state
  const [newRoomNumber, setNewRoomNumber] = useState('');
  const [newRoomFloor, setNewRoomFloor] = useState('1st Floor');
  const [newRoomCategory, setNewRoomCategory] = useState('');

  const fetchRoomsAndCategories = async () => {
    try {
      setIsLoading(true);
      const headers = getHospitalityHeaders(token);
      const hotelParam = selectedHotelId ? `?hotelId=${encodeURIComponent(selectedHotelId)}` : '';

      const [roomsRes, catRes] = await Promise.all([
        fetch(`${API_BASE_URL}/hotels/operations/rooms${hotelParam}`, { headers }),
        fetch(`${API_BASE_URL}/hotels/operations/categories${hotelParam}`, { headers })
      ]);

      if (roomsRes.ok) {
        const roomsData = await roomsRes.json();
        setRooms(Array.isArray(roomsData) ? roomsData : []);
      } else {
        setRooms([]);
      }

      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(Array.isArray(catData) ? catData : []);
        if (catData.length > 0 && !newRoomCategory) {
          setNewRoomCategory(catData[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
      setRooms([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoomsAndCategories();
  }, [token, selectedHotelId]);

  const toggleBukhari = async (room: Room) => {
    const nextVal = !room.bukhariActive;
    // Optimistic UI update
    setRooms(prev => prev.map(r => r.id === room.id ? { ...r, bukhariActive: nextVal } : r));

    try {
      const authToken = getHospitalityToken(token);
      await fetch(`${API_BASE_URL}/hotels/operations/rooms/${room.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ bukhariActive: nextVal })
      });
      toast.success(`Room ${room.roomNumber} Bukhari Heating ${nextVal ? 'Activated' : 'Extinguished'}`);
    } catch (err) {
      toast.error('Failed to update heating status');
      fetchRoomsAndCategories();
    }
  };

  const handleUpdateHousekeeping = async (roomId: string, newHk: string) => {
    setRooms(prev => prev.map(r => r.id === roomId ? { ...r, housekeeping: newHk } : r));

    try {
      const authToken = getHospitalityToken(token);
      await fetch(`${API_BASE_URL}/hotels/operations/rooms/${roomId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          housekeeping: newHk,
          operationalStatus: newHk === 'CLEAN' ? 'AVAILABLE_CLEAN' : 'AVAILABLE_DIRTY'
        })
      });
      toast.success(`Room housekeeping updated to ${newHk}`);
    } catch (err) {
      toast.error('Failed to update housekeeping');
      fetchRoomsAndCategories();
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomNumber.trim()) {
      toast.error('Please enter a room number');
      return;
    }

    try {
      const authToken = getHospitalityToken(token);
      const selectedCat = categories.find(c => c.id === newRoomCategory);
      const hotelId = selectedHotelId || (selectedCat as any)?.hotelId || undefined;

      const res = await fetch(`${API_BASE_URL}/hotels/operations/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          hotelId,
          categoryId: newRoomCategory || undefined,
          roomNumber: newRoomNumber.trim(),
          floor: newRoomFloor,
          status: 'AVAILABLE',
          operationalStatus: 'AVAILABLE_CLEAN',
          housekeeping: 'CLEAN'
        })
      });

      if (!res.ok) throw new Error('Failed to create room');

      toast.success(`Physical Room ${newRoomNumber} registered!`);
      setCreateModalOpen(false);
      setNewRoomNumber('');
      fetchRoomsAndCategories();
    } catch (err: any) {
      toast.error(err.message || 'Error registering room');
    }
  };

  const availableCount = rooms.filter(r => r.status === 'AVAILABLE').length;
  const occupiedCount = rooms.filter(r => r.status === 'OCCUPIED').length;
  const maintenanceCount = rooms.filter(r => r.status === 'MAINTENANCE').length;
  const occupancyPct = rooms.length > 0 ? Math.round((occupiedCount / rooms.length) * 100) : 0;

  // Filtered rooms
  const filteredRooms = rooms.filter(r => {
    const matchesSearch = r.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.category?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.guestName || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'AVAILABLE') return r.status === 'AVAILABLE';
    if (statusFilter === 'OCCUPIED') return r.status === 'OCCUPIED';
    if (statusFilter === 'DIRTY') return r.housekeeping === 'DIRTY';
    if (statusFilter === 'MAINTENANCE') return r.status === 'MAINTENANCE';

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Overview Status Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-card p-4 rounded-3xl border border-border/70 shadow-sm">
        <div className="p-3 bg-muted/30 rounded-2xl">
          <span className="text-xs text-muted-foreground">Total Capacity</span>
          <p className="text-2xl font-black text-foreground mt-0.5">{rooms.length} Suites</p>
        </div>
        <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Available Rooms</span>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{availableCount}</p>
        </div>
        <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
          <span className="text-xs text-primary font-semibold">Occupied Today</span>
          <p className="text-2xl font-black text-primary mt-0.5">{occupiedCount}</p>
        </div>
        <div className="p-3 bg-muted/30 rounded-2xl">
          <span className="text-xs text-muted-foreground">Live Occupancy</span>
          <p className="text-2xl font-black text-foreground mt-0.5">{occupancyPct}%</p>
        </div>
      </div>

      {/* Kashmir Winter Readiness Highlights */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-foreground">Winter Heating & Power Systems Live</h4>
            <p className="text-xs text-muted-foreground">
              Central wood Bukhari stoves & 24/7 silent diesel generator operating normally.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs shrink-0 font-medium">
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
            <Zap className="w-3.5 h-3.5" /> 220V Grid Online
          </span>
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
            <Droplet className="w-3.5 h-3.5" /> Hot Water Boilers Active
          </span>
        </div>
      </div>

      {/* Search, Filter & Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {['ALL', 'AVAILABLE', 'OCCUPIED', 'DIRTY', 'MAINTENANCE'].map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === filter
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {filter === 'ALL' && 'All Suites'}
              {filter === 'AVAILABLE' && 'Available Clean'}
              {filter === 'OCCUPIED' && 'Occupied'}
              {filter === 'DIRTY' && 'Needs Cleaning'}
              {filter === 'MAINTENANCE' && 'Maintenance'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search room # or guest..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 w-48 text-xs rounded-xl"
            />
          </div>

          <Button
            size="sm"
            onClick={() => setCreateModalOpen(true)}
            className="rounded-xl text-xs font-bold gap-1.5 h-9 bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Suite</span>
          </Button>
        </div>
      </div>

      {/* Room Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Card key={i} className="rounded-3xl border border-border/60 p-5 animate-pulse bg-card">
              <div className="h-6 w-20 bg-muted rounded-lg mb-3" />
              <div className="h-4 w-32 bg-muted rounded mb-2" />
              <div className="h-3 w-24 bg-muted rounded mb-4" />
              <div className="h-8 bg-muted rounded-xl" />
            </Card>
          ))}
        </div>
      ) : filteredRooms.length === 0 ? (
        <Card className="rounded-3xl border border-dashed border-border/80 p-10 text-center bg-card/50">
          <BedDouble className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <h4 className="font-bold text-base text-foreground">No Physical Rooms Found</h4>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
            {rooms.length === 0 
              ? 'No rooms or suites have been registered for this property yet. Register your physical room numbers to enable live occupancy tracking.'
              : 'No rooms match the selected filter criteria. Try choosing another status.'}
          </p>
          <Button
            size="sm"
            onClick={() => setCreateModalOpen(true)}
            className="rounded-xl text-xs font-bold gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950"
          >
            <Plus className="w-4 h-4" />
            <span>Register First Suite</span>
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredRooms.map((room) => {
          const isAvail = room.status === 'AVAILABLE';
          const isOcc = room.status === 'OCCUPIED';
          const isRes = room.status === 'RESERVED';
          const isMaint = room.status === 'MAINTENANCE';

          return (
            <Card 
              key={room.id}
              className={`rounded-3xl border transition-all overflow-hidden ${
                isAvail ? 'border-emerald-500/30 bg-card hover:border-emerald-500/60' :
                isOcc ? 'border-blue-500/40 bg-blue-500/5' :
                isRes ? 'border-purple-500/30 bg-purple-500/5' : 
                'border-rose-500/30 bg-rose-500/5'
              }`}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-lg text-foreground">
                      #{room.roomNumber}
                    </span>
                    {room.floor && (
                      <Badge variant="outline" className="text-[9px] uppercase px-1.5 py-0">
                        {room.floor}
                      </Badge>
                    )}
                  </div>
                  <Badge 
                    className={`text-[10px] font-bold ${
                      isAvail ? 'bg-emerald-600 text-white' :
                      isOcc ? 'bg-blue-600 text-white' :
                      isRes ? 'bg-purple-600 text-white' : 'bg-rose-600 text-white'
                    }`}
                  >
                    {room.status}
                  </Badge>
                </div>

                <div>
                  <h5 className="font-semibold text-xs text-foreground line-clamp-1">
                    {room.category?.name || 'Deluxe Suite'}
                  </h5>
                  {room.guestName ? (
                    <p className="text-[11px] text-blue-600 dark:text-blue-400 font-bold mt-0.5 line-clamp-1">
                      Guest: {room.guestName}
                    </p>
                  ) : (
                    <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1.5">
                      <span>Housekeeping:</span>
                      <strong className={room.housekeeping === 'CLEAN' ? 'text-emerald-500' : 'text-rose-500'}>
                        {room.housekeeping}
                      </strong>
                    </p>
                  )}
                </div>

                {/* Bukhari Heating Toggle & Housekeeping Selector */}
                <div className="pt-2 border-t border-border/50 flex items-center justify-between gap-2">
                  <button
                    onClick={() => toggleBukhari(room)}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-xl transition-colors ${
                      room.bukhariActive 
                        ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30' 
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    <Flame className="w-3.5 h-3.5" />
                    <span>{room.bukhariActive ? 'Bukhari Hot' : 'Heating Off'}</span>
                  </button>

                  <Select
                    value={room.housekeeping}
                    onValueChange={(val) => handleUpdateHousekeeping(room.id, val)}
                  >
                    <SelectTrigger className="h-7 text-[10px] w-24 rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CLEAN">Clean</SelectItem>
                      <SelectItem value="DIRTY">Dirty</SelectItem>
                      <SelectItem value="INSPECTED">Inspected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          );
        })}
        </div>
      )}

      {/* Add Suite Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="rounded-3xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <BedDouble className="w-5 h-5 text-amber-500" />
              <span>Register Physical Suite / Room</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateRoom} className="space-y-4 py-2">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Room Number
              </label>
              <Input
                placeholder="e.g. 105 or Suite 3"
                value={newRoomNumber}
                onChange={(e) => setNewRoomNumber(e.target.value)}
                className="rounded-xl h-11 font-mono font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Floor / Wing
              </label>
              <Input
                placeholder="e.g. 1st Floor / Cedar Wing"
                value={newRoomFloor}
                onChange={(e) => setNewRoomFloor(e.target.value)}
                className="rounded-xl h-11"
              />
            </div>

            {categories.length > 0 && (
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                  Room Category
                </label>
                <Select value={newRoomCategory} onValueChange={setNewRoomCategory}>
                  <SelectTrigger className="rounded-xl h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} — ₹{c.basePrice.toLocaleString('en-IN')}/night
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateModalOpen(false)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md"
              >
                Register Suite
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LiveOccupancyGrid;
