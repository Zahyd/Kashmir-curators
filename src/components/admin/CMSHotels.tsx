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
import { supabase } from '@/integrations/supabase/client';
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
  star_rating: number;
  price_per_night: number;
  description: string | null;
  image_url: string | null;
  amenities: string[];
  room_types: RoomType[];
  rating: number;
  review_count: number;
  is_active: boolean;
}

const defaultHotel: Omit<Hotel, 'id'> = {
  name: '',
  location: '',
  star_rating: 4,
  price_per_night: 0,
  description: '',
  image_url: '',
  amenities: [],
  room_types: [],
  rating: 4.5,
  review_count: 0,
  is_active: true,
};

export default function CMSHotels() {
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

  const fetchHotels = async () => {
    const { data, error } = await supabase
      .from('cms_hotels')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load hotels');
    } else {
      const mapped = (data || []).map((h) => ({
        ...h,
        room_types: (h.room_types as unknown as RoomType[]) || [],
      }));
      setHotels(mapped);
    }
    setLoading(false);
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
      hotel.room_types?.map((r) => `${r.name}:${r.price}`).join('\n') || ''
    );
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.location) {
      toast.error('Please fill required fields');
      return;
    }

    setSaving(true);
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
      room_types: roomTypes,
    };

    if (editingHotel) {
      const { error } = await supabase.from('cms_hotels').update(dataToSave).eq('id', editingHotel.id);
      if (error) {
        toast.error('Failed to update hotel');
      } else {
        toast.success('Hotel updated');
        setDialogOpen(false);
        fetchHotels();
      }
    } else {
      const { error } = await supabase.from('cms_hotels').insert(dataToSave);
      if (error) {
        toast.error('Failed to create hotel');
      } else {
        toast.success('Hotel created');
        setDialogOpen(false);
        fetchHotels();
      }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this hotel?')) return;
    const { error } = await supabase.from('cms_hotels').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete hotel');
    } else {
      toast.success('Hotel deleted');
      fetchHotels();
    }
  };

  const toggleActive = async (hotel: Hotel) => {
    await supabase.from('cms_hotels').update({ is_active: !hotel.is_active }).eq('id', hotel.id);
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
                  {hotel.image_url ? (
                    <img src={hotel.image_url} alt={hotel.name} className="w-16 h-12 object-cover rounded" />
                  ) : (
                    <div className="w-16 h-12 bg-muted rounded flex items-center justify-center text-xs">No image</div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{hotel.name}</TableCell>
                <TableCell>{hotel.location}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-0.5">
                    {[...Array(hotel.star_rating)].map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-kashmir-gold text-kashmir-gold" />
                    ))}
                  </div>
                </TableCell>
                <TableCell>₹{hotel.price_per_night.toLocaleString()}</TableCell>
                <TableCell>
                  <Badge variant={hotel.is_active ? 'default' : 'secondary'}>
                    {hotel.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => toggleActive(hotel)}>
                      {hotel.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                  value={formData.star_rating.toString()}
                  onValueChange={(v) => setFormData({ ...formData, star_rating: Number(v) })}
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
                  value={formData.price_per_night}
                  onChange={(e) => setFormData({ ...formData, price_per_night: Number(e.target.value) })}
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
                value={formData.image_url || ''}
                onChange={(url) => setFormData({ ...formData, image_url: url })}
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
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
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
