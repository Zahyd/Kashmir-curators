import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Eye, EyeOff, Star, Loader2, MapPin, BedDouble, Info, CheckCircle2, Save, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useTeamAuth } from '@/contexts/TeamAuthContext';
import MediaPicker from './MediaPicker';
import { API_BASE_URL } from '@/lib/api';


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
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // Hotels Hero config states
  const [heroTitle, setHeroTitle] = useState('Luxury Stays in Kashmir');
  const [heroSubtitle, setHeroSubtitle] = useState('From lakeside houseboats to cozy mountain retreats, find your perfect stay.');
  const [heroImage, setHeroImage] = useState('https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1600');
  const [savingHero, setSavingHero] = useState(false);
  const [loadingHero, setLoadingHero] = useState(true);

  const fetchHeroData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/site-content`);
      if (response.ok) {
        const data = await response.json();
        if (data.hotelsHero) {
          setHeroTitle(data.hotelsHero.title || 'Luxury Stays in Kashmir');
          setHeroSubtitle(data.hotelsHero.subtitle || 'From lakeside houseboats to cozy mountain retreats, find your perfect stay.');
          setHeroImage(data.hotelsHero.image_url || 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1600');
        }
      }
    } catch (error) {
      console.error('[CMSHotels] Error loading hero settings:', error);
    } finally {
      setLoadingHero(false);
    }
  };

  const handleSaveHero = async () => {
    setSavingHero(true);
    const token = localStorage.getItem('teamToken') || localStorage.getItem('token');
    try {
      const response = await fetch(`${API_BASE_URL}/site-content/hotelsHero`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          section_key: 'hotelsHero',
          title: heroTitle,
          subtitle: heroSubtitle,
          content: {},
          image_url: heroImage
        })
      });

      if (response.ok) {
        toast.success('Hotels page hero settings updated successfully in real-time!');
      } else {
        throw new Error('Failed to save to server');
      }
    } catch (error: any) {
      console.error('[CMSHotels] Error saving hero settings:', error);
      toast.error('Failed to save hero settings');
    } finally {
      setSavingHero(false);
    }
  };

  const fetchHotels = async () => {
    console.log('[CMSHotels] Initiating fetch for hospitality nodes...');
    try {
      const response = await fetch(`${API_BASE_URL}/hotels?all=true`);
      console.log(`[CMSHotels] Fetch response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[CMSHotels] Fetch failed:', errorText);
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      console.log('[CMSHotels] Hospitality nodes received:', data);
      
      if (Array.isArray(data)) {
        const sanitized = data.map((hotel: any) => ({
          ...hotel,
          amenities: typeof hotel.amenities === 'string' ? JSON.parse(hotel.amenities) : (Array.isArray(hotel.amenities) ? hotel.amenities : []),
          roomTypes: typeof hotel.roomTypes === 'string' ? JSON.parse(hotel.roomTypes) : (Array.isArray(hotel.roomTypes) ? hotel.roomTypes : [])
        }));
        setHotels(sanitized);
      } else {
        console.warn('[CMSHotels] Received data is not an array, defaulting to empty list');
        setHotels([]);
      }
    } catch (error: any) {
      console.error('[CMSHotels] Fatal error during fetch:', error);
      toast.error(`Failed to load hospitality nodes: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHotels();
    fetchHeroData();
  }, []);

  useEffect(() => {
    const latestEvent = systemEvents[0];
    if (latestEvent && latestEvent.booking && latestEvent.booking.entityType === 'hotel') {
      console.log('[CMSHotels] System event detected for hotel, refreshing...');
      fetchHotels();
    }
  }, [systemEvents]);

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
      toast.error('Identity and Location are mandatory');
      return;
    }

    setSaving(true);
    const token = localStorage.getItem('teamToken');
    const method = editingHotel ? 'PATCH' : 'POST';
    const url = editingHotel 
      ? `${API_BASE_URL}/hotels/${editingHotel.id}` 
      : `${API_BASE_URL}/hotels`;

    const roomTypes = roomTypesInput
      .split('\n')
      .filter(Boolean)
      .map((line, idx) => {
        const [name, price] = line.split(':');
        return { id: `room-${idx}`, name: (name || '').trim(), price: Number(price) || 0 };
      });

    const dataToSave = {
      ...formData,
      amenities: amenitiesInput.split('\n').filter(Boolean),
      roomTypes: roomTypes,
    };

    console.log(`[CMSHotels] Saving property via ${method} to ${url}`, dataToSave);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(dataToSave)
      });

      console.log(`[CMSHotels] Save response status: ${response.status}`);

      if (response.ok) {
        toast.success(editingHotel ? 'Property updated' : 'New property commissioned');
        setDialogOpen(false);
        fetchHotels();
      } else {
        const errData = await response.json().catch(() => ({}));
        console.error('[CMSHotels] Save failed:', errData);
        toast.error(errData.error || `Commissioning failed (Status: ${response.status})`);
      }
    } catch (error: any) {
      console.error('[CMSHotels] System connection error during save:', error);
      toast.error(`System connection error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const token = localStorage.getItem('teamToken');
    console.log(`[CMSHotels] Attempting to decommission node: ${id}`);
    
    try {
      const response = await fetch(`${API_BASE_URL}/hotels/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log(`[CMSHotels] Delete response status: ${response.status}`);

      if (response.ok) {
        toast.success('Property decommissioned');
        fetchHotels();
      } else {
        const errData = await response.json().catch(() => ({}));
        console.error('[CMSHotels] Decommission failed:', errData);
        toast.error(errData.error || 'Decommissioning failed');
      }
    } catch (error: any) {
      console.error('[CMSHotels] System connection error during delete:', error);
      toast.error(`System connection error: ${error.message}`);
    }
  };

  const toggleActive = async (hotel: Hotel) => {
    const token = localStorage.getItem('teamToken');
    console.log(`[CMSHotels] Toggling active status for node: ${hotel.id}, current: ${hotel.isActive}`);
    try {
      const response = await fetch(`${API_BASE_URL}/hotels/${hotel.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !hotel.isActive })
      });

      if (response.ok) {
        fetchHotels();
      } else {
        const errData = await response.json().catch(() => ({}));
        console.error('[CMSHotels] Toggle failed:', errData);
        toast.error('Failed to toggle status');
      }
    } catch (error: any) {
      console.error('[CMSHotels] Toggle connection error:', error);
      toast.error('Failed to toggle status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-12 w-12 animate-spin text-kashmir-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-display font-bold text-white tracking-tight">Hospitality Nodes</h2>
          <p className="text-white/40 text-sm mt-1 uppercase tracking-widest font-black">Managing {hotels.length} Luxury Properties</p>
        </div>
        <Button onClick={openCreateDialog} className="w-full md:w-auto bg-kashmir-gold text-black hover:bg-amber-500 font-black px-8 h-14 rounded-2xl shadow-xl shadow-kashmir-gold/10 transition-all">
          <Plus className="h-5 w-5 mr-2" /> 
          <span className="text-[10px] uppercase tracking-[0.2em]">Commission Property</span>
        </Button>
      </div>

      {/* Hotels Hero CMS Panel */}
      <Card className="bg-white/[0.01] border-white/5 rounded-[2.5rem] p-8 backdrop-blur-3xl relative overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-kashmir-gold/[0.02] to-transparent pointer-events-none" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h3 className="text-xl font-display font-black text-white uppercase tracking-tight flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-kashmir-gold" />
              Hotels Page Hero Configuration
            </h3>
            <p className="text-[10px] text-white/30 font-black uppercase tracking-widest mt-1">Configure the main background asset and hero copy for the public Hotels page</p>
          </div>
          <Button 
            onClick={handleSaveHero} 
            disabled={savingHero || loadingHero}
            className="w-full md:w-auto bg-white text-black hover:bg-kashmir-gold hover:text-black font-black px-6 h-12 rounded-xl transition-all duration-300 shadow-lg active:scale-95 flex items-center gap-2"
          >
            {savingHero ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span className="text-[9px] uppercase tracking-widest">{savingHero ? 'Saving...' : 'Save Configuration'}</span>
          </Button>
        </div>

        {loadingHero ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-kashmir-gold" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1 block">Hero Background Image</label>
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
                  <MediaPicker
                    value={heroImage}
                    onChange={(url) => setHeroImage(url)}
                  />
                  {heroImage && (
                    <div className="mt-4 relative aspect-[21/9] rounded-xl overflow-hidden border border-white/10">
                      <img src={heroImage} alt="Hero Background Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1 block">Hotels Page Headline</label>
                <Input
                  className="bg-white/5 border-white/10 rounded-xl h-12 text-white placeholder-white/20 focus:border-kashmir-gold/50 transition-all font-bold"
                  value={heroTitle}
                  onChange={(e) => setHeroTitle(e.target.value)}
                  placeholder="e.g., Luxury Stays in Kashmir"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1 block">Hotels Page Subheadline</label>
                <Textarea
                  className="bg-white/5 border-white/10 rounded-xl min-h-[96px] text-white placeholder-white/20 focus:border-kashmir-gold/50 transition-all resize-none font-medium leading-relaxed"
                  value={heroSubtitle}
                  onChange={(e) => setHeroSubtitle(e.target.value)}
                  placeholder="e.g., From lakeside houseboats to cozy mountain retreats, find your perfect stay."
                />
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Desktop View */}
      <div className="hidden lg:block bg-white/[0.01] border border-white/5 rounded-[2.5rem] overflow-hidden backdrop-blur-3xl shadow-inner relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-kashmir-gold/[0.02] to-transparent pointer-events-none" />
        <Table>
          <TableHeader className="bg-white/[0.02] border-b border-white/5">
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="text-white/20 uppercase text-[9px] font-black tracking-[0.4em] py-8 pl-10">Property Node</TableHead>
              <TableHead className="text-white/20 uppercase text-[9px] font-black tracking-[0.4em]">Location</TableHead>
              <TableHead className="text-white/20 uppercase text-[9px] font-black tracking-[0.4em]">Rating</TableHead>
              <TableHead className="text-white/20 uppercase text-[9px] font-black tracking-[0.4em]">Inventory</TableHead>
              <TableHead className="text-white/20 uppercase text-[9px] font-black tracking-[0.4em]">Status</TableHead>
              <TableHead className="text-white/20 uppercase text-[9px] font-black tracking-[0.4em] text-right pr-10">Controls</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-white/5">
            {hotels.map((hotel) => (
              <TableRow key={hotel.id} className="hover:bg-white/[0.02] transition-all duration-500 border-none group/row">
                <TableCell className="py-8 pl-10">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-16 rounded-[1.25rem] bg-white/5 overflow-hidden border border-white/10 flex items-center justify-center shadow-2xl relative group/img">
                      {hotel.imageUrl ? (
                        <img src={hotel.imageUrl} alt={hotel.name} className="w-full h-full object-cover" />
                      ) : (
                        <BedDouble className="w-6 h-6 text-kashmir-gold/40" />
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-white font-bold tracking-tight text-base group-hover/row:text-kashmir-gold transition-colors">{hotel.name}</span>
                      <div className="flex items-center gap-1">
                        {[...Array(hotel.starRating)].map((_, i) => (
                          <Star key={i} className="h-2.5 w-2.5 fill-kashmir-gold text-kashmir-gold" />
                        ))}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-white/20" />
                    <span className="text-white/60 text-sm font-medium">{hotel.location}</span>
                  </div>
                </TableCell>
                <TableCell>
                   <div className="flex flex-col">
                    <span className="text-white font-black text-base">{hotel.rating}</span>
                    <span className="text-[10px] text-white/20 font-bold uppercase tracking-widest">{hotel.reviewCount} Reviews</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-kashmir-gold font-black text-base">₹{hotel.pricePerNight.toLocaleString()}</span>
                    <span className="text-[10px] text-white/20 font-bold uppercase tracking-tighter">Starting/Night</span>
                  </div>
                </TableCell>
                <TableCell>
                  <button onClick={() => toggleActive(hotel)} className="group/toggle">
                    <Badge className={cn(
                      "rounded-xl border-none px-4 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-300",
                      hotel.isActive ? "bg-emerald-500/10 text-emerald-400 group-hover/toggle:bg-emerald-500/20" : "bg-red-500/10 text-red-400 group-hover/toggle:bg-red-500/20"
                    )}>
                      {hotel.isActive ? 'Available' : 'Deactivated'}
                    </Badge>
                  </button>
                </TableCell>
                <TableCell className="text-right pr-10">
                  <div className="flex justify-end gap-3 opacity-20 group-hover/row:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(hotel)} className="w-12 h-12 bg-white/5 border border-white/5 rounded-2xl text-white/40 hover:text-white hover:border-white/20 transition-all">
                      <Pencil className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(hotel.id)} className="w-12 h-12 bg-white/5 border border-white/5 rounded-2xl text-white/20 hover:text-red-400 hover:border-red-400/20 transition-all">
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile View */}
      <div className="lg:hidden space-y-6">
        {hotels.map((hotel) => (
          <Card key={hotel.id} className="bg-white/[0.02] border-white/5 p-8 rounded-[2.5rem] space-y-8 relative overflow-hidden group">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-[1.5rem] bg-white/5 overflow-hidden border border-white/10 shrink-0 shadow-2xl relative">
                {hotel.imageUrl ? (
                  <img src={hotel.imageUrl} alt={hotel.name} className="w-full h-full object-cover" />
                ) : (
                  <BedDouble className="w-8 h-8 text-kashmir-gold/40 m-6" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-white tracking-tight truncate leading-tight">{hotel.name}</h3>
                <div className="flex items-center gap-1 mt-2">
                  {[...Array(hotel.starRating)].map((_, i) => (
                    <Star key={i} className="h-2.5 w-2.5 fill-kashmir-gold text-kashmir-gold" />
                  ))}
                  <span className="ml-2 text-[10px] text-white/40 font-bold uppercase truncate">{hotel.location}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 py-6 border-t border-b border-white/5">
              <div className="space-y-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-white/20">Starting Price</p>
                <p className="text-2xl font-black text-kashmir-gold tracking-tighter">₹{hotel.pricePerNight.toLocaleString()}<span className="text-xs">/nt</span></p>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-white/20">System Status</p>
                <Badge className={cn(
                  "border-none rounded-lg px-3 py-1 text-[9px] font-black uppercase tracking-widest w-fit",
                  hotel.isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                )}>
                  {hotel.isActive ? 'Available' : 'Deactivated'}
                </Badge>
              </div>
            </div>

            <div className="flex gap-4">
              <Button onClick={() => openEditDialog(hotel)} className="flex-1 bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 h-14 rounded-2xl font-black transition-all">
                <Pencil className="w-4 h-4 mr-2" />
                <span className="text-[9px] uppercase tracking-widest">Reconfigure</span>
              </Button>
              <Button 
                onClick={() => {
                  setItemToDelete(hotel.id);
                  setDeleteConfirmOpen(true);
                }} 
                className="w-14 bg-red-500/5 border border-red-500/10 text-red-400/60 hover:text-red-400 hover:bg-red-500/10 h-14 rounded-2xl transition-all"
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl bg-[#0a0f12] border-white/10 text-white rounded-[2.5rem] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-kashmir-gold/5 via-transparent to-transparent pointer-events-none" />
          <DialogHeader className="p-10 pb-0">
            <DialogTitle className="text-3xl font-display font-black tracking-tight">{editingHotel ? 'Reconfigure Hospitality Node' : 'Commission New Property'}</DialogTitle>
          </DialogHeader>
          <div className="p-10 space-y-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Identity</label>
                <Input
                  className="bg-white/5 border-white/10 rounded-xl h-14 focus:border-kashmir-gold/50 transition-all text-base"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., The Grand Palace"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Geographic Location</label>
                <Input
                  className="bg-white/5 border-white/10 rounded-xl h-14 focus:border-kashmir-gold/50 transition-all text-base"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Srinagar, Dal Lake"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
               <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Asset Grade</label>
                <Select
                  value={formData.starRating.toString()}
                  onValueChange={(v) => setFormData({ ...formData, starRating: Number(v) })}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 h-14 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0f1416] border-white/10 text-white">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <SelectItem key={n} value={n.toString()}>{n} Star</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Price (₹/nt)</label>
                <Input
                  type="number"
                  className="bg-white/5 border-white/10 rounded-xl h-14"
                  value={formData.pricePerNight}
                  onChange={(e) => setFormData({ ...formData, pricePerNight: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">User Sentiment</label>
                <Input
                  type="number"
                  step="0.1"
                  className="bg-white/5 border-white/10 rounded-xl h-14"
                  value={formData.rating}
                  onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Asset Overview</label>
              <Textarea
                className="bg-white/5 border-white/10 rounded-2xl min-h-[100px] py-4 text-base resize-none"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the luxury experience..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Primary Asset Image</label>
              <MediaPicker
                value={formData.imageUrl || ''}
                onChange={(url) => setFormData({ ...formData, imageUrl: url })}
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
               <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Amenities (New Line)</label>
                <Textarea
                  className="bg-white/5 border-white/10 rounded-2xl min-h-[120px] text-xs resize-none"
                  value={amenitiesInput}
                  onChange={(e) => setAmenitiesInput(e.target.value)}
                  placeholder="WiFi&#10;Spa&#10;Butler"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Inventory (Name:Price)</label>
                <Textarea
                  className="bg-white/5 border-white/10 rounded-2xl min-h-[120px] text-xs resize-none"
                  value={roomTypesInput}
                  onChange={(e) => setRoomTypesInput(e.target.value)}
                  placeholder="Deluxe:5000&#10;Suite:9000"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-6 bg-white/5 rounded-2xl border border-white/5">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-white">System Availability</span>
                <span className="text-[9px] text-white/30 uppercase tracking-widest font-black">Active in Public Listing</span>
              </div>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>

            <Button onClick={handleSave} className="w-full h-16 bg-kashmir-gold text-black hover:bg-amber-500 font-black rounded-2xl transition-all shadow-xl shadow-kashmir-gold/20" disabled={saving}>
              {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : (editingHotel ? 'Confirm Reconfiguration' : 'Authorize Commissioning')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="bg-[#0a0f12] border-white/10 text-white rounded-[2.5rem]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black">Decommission Asset?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              Are you sure you want to decommission this hospitality node? This action will remove the property from active listings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white/60 hover:bg-white/10 rounded-xl h-12">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => itemToDelete && handleDelete(itemToDelete)}
              className="bg-red-500 hover:bg-red-600 text-white rounded-xl h-12 font-bold"
            >
              Confirm Decommission
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
