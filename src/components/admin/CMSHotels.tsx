import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Eye, EyeOff, Star, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useTeamAuth } from '@/contexts/TeamAuthContext';
import MediaPicker from './MediaPicker';

interface RoomType {
  id: string;
  name: string;
  price: number;
}

interface Hotel {
  id: string;
  name: string;
  location: string;
  starRating: number;
  pricePerNight: number;
  description: string | null;
  imageUrl: string | null;
  amenities: string[];
  roomTypes: RoomType[];
  rating: number;
  reviewCount: number;
  isActive: boolean;
}

const defaultHotel: Omit<Hotel, 'id'> = {
  name: '',
  location: '',
  starRating: 4,
  pricePerNight: 0,
  description: '',
  imageUrl: '',
  amenities: [],
  roomTypes: [],
  rating: 4.5,
  reviewCount: 0,
  isActive: true,
};

export default function CMSHotels() {
  const { systemEvents } = useTeamAuth();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingHotel, setEditingHotel] = useState<Hotel | null>(null);
  const [formData, setFormData] = useState(defaultHotel);
  const [amenitiesInput, setAmenitiesInput] = useState('');
  const [roomTypesInput, setRoomTypesInput] = useState('');

  useEffect(() => {
    fetchHotels();
  }, []);

  // Real-time refresh
  useEffect(() => {
    const latestEvent = systemEvents[0];
    if (latestEvent && latestEvent.booking && latestEvent.booking.entityType === 'hotel') {
      fetchHotels();
    }
  }, [systemEvents]);

  const fetchHotels = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/hotels?all=true');
      const data = await response.json();
      if (Array.isArray(data)) {
        setHotels(data);
      } else {
        console.error('Expected array of hotels, but received:', data);
        setHotels([]);
      }
    } catch (error) {
      toast.error('Failed to load hotels');
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingHotel(null);
    setFormData(defaultHotel);
    setAmenitiesInput('');
    setRoomTypesInput('');
    setDialogOpen(true);
  };

  const openEditDialog = (hotel: Hotel) => {
    setEditingHotel(hotel);
    setFormData(hotel);
    setAmenitiesInput(hotel.amenities?.join('\n') || '');
    setRoomTypesInput(
      hotel.roomTypes?.map((r) => `${r.name}:${r.price}`).join('\n') || ''
    );
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.location) {
      toast.error('Please fill required fields');
      return;
    }

    setSaving(true);
    const token = localStorage.getItem('teamToken');
    const method = editingHotel ? 'PATCH' : 'POST';
    const url = editingHotel 
      ? `http://localhost:5000/api/hotels/${editingHotel.id}` 
      : 'http://localhost:5000/api/hotels';

    const roomTypes = roomTypesInput
      .split('\n')
      .filter(Boolean)
      .map((line, idx) => {
        const [name, price] = line.split(':');
        return { id: `room-${idx}`, name: name.trim(), price: Number(price) || 0 };
      });

    const dataToSave = {
      ...formData,
      amenities: amenitiesInput.split('\n').filter(Boolean),
      roomTypes: roomTypes,
    };

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(dataToSave)
      });

      if (response.ok) {
        toast.success(editingHotel ? 'Hotel updated' : 'Hotel created');
        setDialogOpen(false);
        fetchHotels();
      } else {
        toast.error('Failed to save hotel');
      }
    } catch (error) {
      toast.error('Error saving hotel');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this hotel?')) return;
    const token = localStorage.getItem('teamToken');
    
    try {
      const response = await fetch(`http://localhost:5000/api/hotels/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('Hotel deleted');
        fetchHotels();
      } else {
        toast.error('Failed to delete hotel');
      }
    } catch (error) {
      toast.error('Error deleting hotel');
    }
  };

  const toggleActive = async (hotel: Hotel) => {
    const token = localStorage.getItem('teamToken');
    await fetch(`http://localhost:5000/api/hotels/${hotel.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ isActive: !hotel.isActive })
    });
    fetchHotels();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Hotels ({hotels.length})</h2>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" /> Add Hotel
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Stars</TableHead>
              <TableHead>Price/Night</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {hotels.map((hotel) => (
              <TableRow key={hotel.id}>
                <TableCell>
                  {hotel.imageUrl ? (
                    <img src={hotel.imageUrl} alt={hotel.name} className="w-16 h-12 object-cover rounded" />
                  ) : (
                    <div className="w-16 h-12 bg-muted rounded flex items-center justify-center text-xs">No image</div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{hotel.name}</TableCell>
                <TableCell>{hotel.location}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-0.5">
                    {[...Array(hotel.starRating)].map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-kashmir-gold text-kashmir-gold" />
                    ))}
                  </div>
                </TableCell>
                <TableCell>₹{hotel.pricePerNight.toLocaleString()}</TableCell>
                <TableCell>
                  <Badge variant={hotel.isActive ? 'default' : 'secondary'}>
                    {hotel.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => toggleActive(hotel)}>
                      {hotel.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(hotel)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(hotel.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {hotels.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No hotels yet. Click "Add Hotel" to create one.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingHotel ? 'Edit Hotel' : 'Create Hotel'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Location *</label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Star Rating</label>
                <Select
                  value={formData.starRating.toString()}
                  onValueChange={(v) => setFormData({ ...formData, starRating: Number(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <SelectItem key={n} value={n.toString()}>
                        {n} Star
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Price/Night (₹)</label>
                <Input
                  type="number"
                  value={formData.pricePerNight}
                  onChange={(e) => setFormData({ ...formData, pricePerNight: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Rating</label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={formData.rating}
                  onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Description</label>
              <Textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Image</label>
              <MediaPicker
                value={formData.imageUrl || ''}
                onChange={(url) => setFormData({ ...formData, imageUrl: url })}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Amenities (one per line)</label>
              <Textarea
                value={amenitiesInput}
                onChange={(e) => setAmenitiesInput(e.target.value)}
                placeholder="WiFi&#10;Restaurant&#10;Spa&#10;Gym"
                rows={3}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Room Types (format: Name:Price)</label>
              <Textarea
                value={roomTypesInput}
                onChange={(e) => setRoomTypesInput(e.target.value)}
                placeholder="Deluxe Room:5000&#10;Suite:8000&#10;Presidential Suite:15000"
                rows={3}
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <label className="text-sm">Active</label>
            </div>

            <Button onClick={handleSave} className="w-full" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingHotel ? 'Update Hotel' : 'Create Hotel'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
