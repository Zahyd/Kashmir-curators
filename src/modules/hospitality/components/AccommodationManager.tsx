import React, { useState, useEffect } from 'react';
import { 
  BedDouble, 
  Plus, 
  Trash2, 
  Edit3, 
  Flame, 
  Users, 
  Check, 
  Sparkles, 
  RefreshCw, 
  Building2,
  CalendarCheck2,
  Sliders,
  DollarSign,
  AlertCircle
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
import { getHospitalityToken, getHospitalityHeaders } from '../utils/hospitalityAuth';

interface RoomCategory {
  id: string;
  hotelId: string;
  name: string;
  basePrice: number;
  capacity: number;
  maxOccupancy: number;
  amenities?: string;
  imageUrl?: string;
}

interface PhysicalRoom {
  id: string;
  hotelId: string;
  categoryId: string;
  roomNumber: string;
  floor?: string;
  status: string;
  operationalStatus?: string;
  housekeeping: string;
  bukhariActive?: boolean;
  category?: { name: string; basePrice: number };
}

interface Hotel {
  id: string;
  name: string;
  location: string;
}

interface AccommodationManagerProps {
  selectedHotelId?: string;
  onHotelChange?: (hotelId: string) => void;
  onSendBooking?: (hotelId: string, categoryName?: string) => void;
}

export const AccommodationManager: React.FC<AccommodationManagerProps> = ({
  selectedHotelId,
  onHotelChange,
  onSendBooking
}) => {
  const { token } = useAuth();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [currentHotelId, setCurrentHotelId] = useState<string>(selectedHotelId || '');

  const [categories, setCategories] = useState<RoomCategory[]>([]);
  const [rooms, setRooms] = useState<PhysicalRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Category Modal State
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryPrice, setCategoryPrice] = useState('14500');
  const [categoryCapacity, setCategoryCapacity] = useState('2');
  const [categoryAmenities, setCategoryAmenities] = useState('King Bed, Bukhari Heating, Dal View Balcony, Heated Bathroom Floor');

  // Room Modal State
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [newRoomNumber, setNewRoomNumber] = useState('');
  const [newRoomFloor, setNewRoomFloor] = useState('1st Floor Heritage Wing');
  const [newRoomCategory, setNewRoomCategory] = useState('');

  // 1. Fetch available hotels
  useEffect(() => {
    const loadHotels = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/hotels`);
        if (res.ok) {
          const list = await res.json();
          setHotels(Array.isArray(list) ? list : []);
          if (list.length > 0 && !currentHotelId) {
            setCurrentHotelId(selectedHotelId || list[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load hotels:', err);
      }
    };
    loadHotels();
  }, [selectedHotelId]);

  // Keep in sync with parent prop
  useEffect(() => {
    if (selectedHotelId) {
      setCurrentHotelId(selectedHotelId);
    }
  }, [selectedHotelId]);

  // 2. Fetch categories and physical rooms for the selected hotel
  const fetchData = async () => {
    if (!currentHotelId) return;
    try {
      setIsLoading(true);
      const headers = getHospitalityHeaders(token);
      const hotelParam = `?hotelId=${encodeURIComponent(currentHotelId)}`;

      const [catRes, roomsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/hotels/operations/categories${hotelParam}`, { headers }),
        fetch(`${API_BASE_URL}/hotels/operations/rooms${hotelParam}`, { headers })
      ]);

      if (catRes.ok) {
        const catData = await catRes.json();
        const catList = Array.isArray(catData) ? catData : [];
        setCategories(catList);
        if (catList.length > 0 && !newRoomCategory) {
          setNewRoomCategory(catList[0].id);
        }
      } else {
        setCategories([]);
      }

      if (roomsRes.ok) {
        const roomsData = await roomsRes.json();
        setRooms(Array.isArray(roomsData) ? roomsData : []);
      } else {
        setRooms([]);
      }
    } catch (err) {
      console.error('Failed to load accommodations:', err);
      toast.error('Could not load accommodation inventory');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentHotelId, token]);

  const handleHotelSelect = (hotelId: string) => {
    setCurrentHotelId(hotelId);
    onHotelChange?.(hotelId);
  };

  // --- Category CRUD ---
  const handleOpenAddCategory = () => {
    setIsEditingCategory(false);
    setEditingCategoryId(null);
    setCategoryName('');
    setCategoryPrice('14500');
    setCategoryCapacity('2');
    setCategoryAmenities('King Bed, Bukhari Heating, Mountain / Lake View, Heated Bathroom Floor');
    setCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (cat: RoomCategory) => {
    setIsEditingCategory(true);
    setEditingCategoryId(cat.id);
    setCategoryName(cat.name);
    setCategoryPrice(String(cat.basePrice));
    setCategoryCapacity(String(cat.capacity || 2));
    let ams = '';
    try {
      const parsed = JSON.parse(cat.amenities || '[]');
      ams = Array.isArray(parsed) ? parsed.join(', ') : cat.amenities || '';
    } catch {
      ams = cat.amenities || '';
    }
    setCategoryAmenities(ams);
    setCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      toast.error('Please enter category name');
      return;
    }

    try {
      const authToken = getHospitalityToken(token);
      const url = isEditingCategory 
        ? `${API_BASE_URL}/hotels/operations/categories/${editingCategoryId}` 
        : `${API_BASE_URL}/hotels/operations/categories`;
      const method = isEditingCategory ? 'PATCH' : 'POST';

      const amenitiesArray = categoryAmenities.split(',').map(s => s.trim()).filter(Boolean);

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          hotelId: currentHotelId,
          name: categoryName.trim(),
          basePrice: Number(categoryPrice) || 12000,
          capacity: Number(categoryCapacity) || 2,
          maxOccupancy: (Number(categoryCapacity) || 2) + 1,
          amenities: amenitiesArray
        })
      });

      if (!res.ok) throw new Error('Failed to save room category');

      toast.success(isEditingCategory ? `Category ${categoryName} updated!` : `Category ${categoryName} created!`);
      setCategoryModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Error saving category');
    }
  };

  const handleDeleteCategory = async (cat: RoomCategory) => {
    if (!window.confirm(`Delete "${cat.name}" category? Associated rooms will also be deleted.`)) return;

    try {
      const authToken = getHospitalityToken(token);
      const res = await fetch(`${API_BASE_URL}/hotels/operations/categories/${cat.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (!res.ok) throw new Error('Failed to delete category');

      toast.success(`Category "${cat.name}" deleted`);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Error deleting category');
    }
  };

  // --- Physical Room CRUD ---
  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomNumber.trim()) {
      toast.error('Please enter room number');
      return;
    }

    try {
      const authToken = getHospitalityToken(token);
      const res = await fetch(`${API_BASE_URL}/hotels/operations/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          hotelId: currentHotelId,
          categoryId: newRoomCategory || (categories[0]?.id),
          roomNumber: newRoomNumber.trim(),
          floor: newRoomFloor,
          status: 'AVAILABLE',
          operationalStatus: 'AVAILABLE_CLEAN',
          housekeeping: 'CLEAN'
        })
      });

      if (!res.ok) throw new Error('Failed to create physical room');

      toast.success(`Suite #${newRoomNumber} registered!`);
      setRoomModalOpen(false);
      setNewRoomNumber('');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Error creating room');
    }
  };

  const toggleBukhari = async (room: PhysicalRoom) => {
    const nextVal = !room.bukhariActive;
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
      toast.success(`Room ${room.roomNumber} Bukhari heating ${nextVal ? 'Activated' : 'Off'}`);
    } catch {
      toast.error('Failed to toggle heating');
      fetchData();
    }
  };

  const toggleRoomAvailability = async (room: PhysicalRoom) => {
    const nextStatus = room.status === 'AVAILABLE' ? 'MAINTENANCE' : 'AVAILABLE';
    setRooms(prev => prev.map(r => r.id === room.id ? { ...r, status: nextStatus } : r));

    try {
      const authToken = getHospitalityToken(token);
      await fetch(`${API_BASE_URL}/hotels/operations/rooms/${room.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ 
          status: nextStatus,
          operationalStatus: nextStatus === 'AVAILABLE' ? 'AVAILABLE_CLEAN' : 'UNDER_MAINTENANCE'
        })
      });
      toast.success(`Room ${room.roomNumber} marked ${nextStatus === 'AVAILABLE' ? 'Available' : 'Blocked / Sold Out'}`);
    } catch {
      toast.error('Failed to update status');
      fetchData();
    }
  };

  const selectedHotel = hotels.find(h => h.id === currentHotelId);

  return (
    <div className="space-y-6">
      {/* Property Selector Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 sm:p-5 rounded-3xl border border-border/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Accommodation Inventory & Room Rack
            </span>
          </div>
          <h3 className="font-bold text-lg text-foreground mt-0.5">
            {selectedHotel?.name || 'Select Hotel Property'}
          </h3>
          <p className="text-xs text-muted-foreground">
            {selectedHotel?.location || 'Kashmir'} • {categories.length} Room Types • {rooms.length} Physical Suites
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {hotels.length > 0 && (
            <div className="flex items-center gap-1.5 bg-muted/40 border border-border/80 rounded-2xl px-2.5 py-1">
              <Building2 className="w-4 h-4 text-amber-500 shrink-0" />
              <Select value={currentHotelId} onValueChange={handleHotelSelect}>
                <SelectTrigger className="h-8 border-0 bg-transparent text-xs font-bold w-48 sm:w-56 focus:ring-0">
                  <SelectValue placeholder="Select Property..." />
                </SelectTrigger>
                <SelectContent>
                  {hotels.map(h => (
                    <SelectItem key={h.id} value={h.id} className="text-xs font-semibold">
                      {h.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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
            onClick={() => onSendBooking?.(currentHotelId)}
            className="rounded-xl text-xs font-bold gap-1.5 h-10 bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20"
          >
            <CalendarCheck2 className="w-4 h-4" />
            <span>Send Booking Here</span>
          </Button>
        </div>
      </div>

      {/* SECTION 1: ROOM CATEGORIES (ACCOMMODATIONS CRUD) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
              <BedDouble className="w-4 h-4 text-amber-500" />
              <span>Room Categories & Wholesale Tariffs</span>
            </h4>
            <p className="text-xs text-muted-foreground">
              Define the room tiers travel agents book for this property.
            </p>
          </div>

          <Button
            size="sm"
            onClick={handleOpenAddCategory}
            className="rounded-xl text-xs font-bold gap-1.5 h-9 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Room Type</span>
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="h-36 rounded-3xl bg-card border border-border/60 animate-pulse" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <Card className="rounded-3xl border border-dashed border-border p-8 text-center bg-card/50">
            <BedDouble className="w-10 h-10 mx-auto text-muted-foreground/40 mb-2" />
            <h5 className="font-bold text-sm text-foreground">No Room Categories Defined</h5>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
              Create room tiers like Deluxe Suite, Royal Cedar Suite, or Presidential Chalet.
            </p>
            <Button
              size="sm"
              onClick={handleOpenAddCategory}
              className="rounded-xl text-xs font-bold gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create First Category</span>
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => {
              let ams: string[] = [];
              try {
                const parsed = JSON.parse(cat.amenities || '[]');
                ams = Array.isArray(parsed) ? parsed : [];
              } catch {
                ams = cat.amenities ? cat.amenities.split(',').map(s => s.trim()) : [];
              }

              return (
                <Card key={cat.id} className="rounded-3xl border border-border/80 bg-card p-5 space-y-3 shadow-sm hover:border-amber-500/40 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-black text-sm text-foreground">{cat.name}</h5>
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Users className="w-3 h-3" />
                        <span>Up to {cat.capacity || 2} Adults ({cat.maxOccupancy || 3} Max)</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditCategory(cat)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                        title="Edit Category"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat)}
                        className="p-1.5 rounded-lg text-rose-500 hover:text-rose-400 hover:bg-rose-500/10"
                        title="Delete Category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="p-3 bg-muted/40 rounded-2xl flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-semibold">Contract Rate</span>
                    <span className="font-mono text-base font-black text-foreground">
                      ₹{cat.basePrice.toLocaleString('en-IN')}
                      <span className="text-[10px] text-muted-foreground font-normal"> / night (EP)</span>
                    </span>
                  </div>

                  {ams.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {ams.slice(0, 3).map((a, idx) => (
                        <span key={idx} className="text-[10px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                          {a}
                        </span>
                      ))}
                      {ams.length > 3 && (
                        <span className="text-[10px] text-muted-foreground px-1 self-center">
                          +{ams.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: PHYSICAL ROOMS & LIVE AVAILABILITY */}
      <div className="space-y-4 pt-4 border-t border-border/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <span>Physical Suite Numbers & Live Availability Status</span>
            </h4>
            <p className="text-xs text-muted-foreground">
              Monitor in-house occupancy, toggle Bukhari heating, or block rooms temporarily.
            </p>
          </div>

          <Button
            size="sm"
            onClick={() => setRoomModalOpen(true)}
            className="rounded-xl text-xs font-bold gap-1.5 h-9 bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Suite Number</span>
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="h-28 rounded-2xl bg-card border border-border/60 animate-pulse" />
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <Card className="rounded-3xl border border-dashed border-border p-8 text-center bg-card/50">
            <p className="text-xs text-muted-foreground">No physical suites registered for this property yet.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {rooms.map((room) => {
              const isAvail = room.status === 'AVAILABLE';
              const isOcc = room.status === 'OCCUPIED';

              return (
                <Card 
                  key={room.id}
                  className={`rounded-2xl border p-4 space-y-3 transition-colors ${
                    isAvail ? 'border-emerald-500/40 bg-card' :
                    isOcc ? 'border-blue-500/40 bg-blue-500/5' : 'border-rose-500/40 bg-rose-500/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-mono text-lg font-black text-foreground">
                        #{room.roomNumber}
                      </span>
                      <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">
                        {room.floor || 'Floor'}
                      </span>
                    </div>

                    <button
                      onClick={() => toggleRoomAvailability(room)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-colors ${
                        isAvail 
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' 
                          : isOcc 
                          ? 'bg-blue-600 text-white border-transparent'
                          : 'bg-rose-500/10 text-rose-600 border-rose-500/30'
                      }`}
                      title="Click to toggle availability"
                    >
                      {isAvail ? 'Available' : isOcc ? 'Occupied' : 'Blocked / Maint'}
                    </button>
                  </div>

                  <p className="text-xs font-semibold text-foreground truncate">
                    {room.category?.name || 'Deluxe Suite'}
                  </p>

                  <div className="pt-2 border-t border-border/50 flex items-center justify-between">
                    <button
                      onClick={() => toggleBukhari(room)}
                      className={`flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg transition-colors ${
                        room.bukhariActive 
                          ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30' 
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <Flame className="w-3 h-3" />
                      <span>{room.bukhariActive ? 'Bukhari Hot' : 'Heating Off'}</span>
                    </button>

                    <span className={`text-[10px] font-bold ${room.housekeeping === 'CLEAN' ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {room.housekeeping}
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Category Modal */}
      <Dialog open={categoryModalOpen} onOpenChange={setCategoryModalOpen}>
        <DialogContent className="rounded-3xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <BedDouble className="w-5 h-5 text-amber-500" />
              <span>{isEditingCategory ? 'Edit Room Category' : 'Add Room Category / Tier'}</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveCategory} className="space-y-4 py-2 text-xs">
            <div>
              <label className="font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Category Name *
              </label>
              <Input
                placeholder="e.g. Maharaja Heritage Suite or Lakeview Chalet"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="rounded-xl h-10 font-bold"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                  B2B Base Tariff (₹ / night)
                </label>
                <Input
                  type="number"
                  value={categoryPrice}
                  onChange={(e) => setCategoryPrice(e.target.value)}
                  className="rounded-xl h-10 font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                  Standard Capacity (Adults)
                </label>
                <Input
                  type="number"
                  min="1"
                  max="6"
                  value={categoryCapacity}
                  onChange={(e) => setCategoryCapacity(e.target.value)}
                  className="rounded-xl h-10"
                  required
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Amenities (comma separated)
              </label>
              <Input
                placeholder="King Bed, Bukhari Heating, Cedar Fireplace, Lake View"
                value={categoryAmenities}
                onChange={(e) => setCategoryAmenities(e.target.value)}
                className="rounded-xl h-10"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCategoryModalOpen(false)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md"
              >
                Save Category
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Physical Room Modal */}
      <Dialog open={roomModalOpen} onOpenChange={setRoomModalOpen}>
        <DialogContent className="rounded-3xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Plus className="w-5 h-5 text-amber-500" />
              <span>Register Physical Suite Number</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateRoom} className="space-y-4 py-2 text-xs">
            <div>
              <label className="font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Room Number / Identifier *
              </label>
              <Input
                placeholder="e.g. 101, 204, or Suite HB-01"
                value={newRoomNumber}
                onChange={(e) => setNewRoomNumber(e.target.value)}
                className="rounded-xl h-10 font-mono font-bold"
                required
              />
            </div>

            <div>
              <label className="font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Floor / Wing Location
              </label>
              <Input
                placeholder="e.g. 1st Floor Heritage Wing / Lake Deck"
                value={newRoomFloor}
                onChange={(e) => setNewRoomFloor(e.target.value)}
                className="rounded-xl h-10"
              />
            </div>

            {categories.length > 0 && (
              <div>
                <label className="font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                  Assign Category Tier
                </label>
                <Select value={newRoomCategory} onValueChange={setNewRoomCategory}>
                  <SelectTrigger className="rounded-xl h-10 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(c => (
                      <SelectItem key={c.id} value={c.id} className="text-xs">
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
                onClick={() => setRoomModalOpen(false)}
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

export default AccommodationManager;
