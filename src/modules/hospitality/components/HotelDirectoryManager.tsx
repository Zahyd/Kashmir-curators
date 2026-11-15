import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Plus, 
  Search, 
  MapPin, 
  Star, 
  Phone, 
  Mail, 
  Edit3, 
  Trash2, 
  CalendarCheck2, 
  BedDouble, 
  Check, 
  Sparkles, 
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Flame,
  Zap,
  Wifi
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

export interface Hotel {
  id: string;
  name: string;
  location: string;
  starRating: number;
  rating?: number;
  reviewCount?: number;
  pricePerNight: number;
  image?: string;
  description?: string;
  amenities?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  isActive?: boolean;
}

interface HotelDirectoryManagerProps {
  onSelectHotelToManage?: (hotelId: string) => void;
  onSendBookingForHotel?: (hotelId: string) => void;
}

const PRESET_IMAGES = [
  { label: 'Heritage Palace', url: '/images/hotels/hotel_1.png' },
  { label: 'Lake Houseboat', url: '/images/hotels/hotel_2.png' },
  { label: 'Alpine Resort', url: '/images/hotels/hotel_1.png' }
];

const PRESET_AMENITIES = [
  'Central Heating',
  'Wood Bukhari',
  '24/7 Power Backup',
  'Electric Bed Warmers',
  'Dal / Lake View',
  'Shikara Ghat Access',
  'Gondola Slopeside',
  'Free Wi-Fi',
  'Wazwan Restaurant',
  'Hot Water Boilers'
];

export const HotelDirectoryManager: React.FC<HotelDirectoryManagerProps> = ({
  onSelectHotelToManage,
  onSendBookingForHotel
}) => {
  const { token } = useAuth();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('ALL');

  // Modal State for Add / Edit
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentHotelId, setCurrentHotelId] = useState<string | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    location: 'Srinagar, Kashmir',
    starRating: '5',
    pricePerNight: '14500',
    description: '',
    image: '/images/hotels/hotel_1.png',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    amenities: ['Central Heating', 'Wood Bukhari', '24/7 Power Backup', 'Free Wi-Fi']
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchHotels = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE_URL}/hotels`);
      if (res.ok) {
        const data = await res.json();
        setHotels(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to load hotels:', err);
      toast.error('Could not load hotels list from database');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHotels();
  }, []);

  const handleOpenAdd = () => {
    setIsEditing(false);
    setCurrentHotelId(null);
    setFormData({
      name: '',
      location: 'Srinagar, Kashmir',
      starRating: '5',
      pricePerNight: '14500',
      description: 'Luxury accommodation offering authentic Kashmiri hospitality, winter heating, and breathtaking valley views.',
      image: '/images/hotels/hotel_1.png',
      contactName: '',
      contactPhone: '',
      contactEmail: '',
      amenities: ['Central Heating', 'Wood Bukhari', '24/7 Power Backup', 'Free Wi-Fi']
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (hotel: Hotel) => {
    setIsEditing(true);
    setCurrentHotelId(hotel.id);
    let parsedAmenities: string[] = [];
    try {
      parsedAmenities = JSON.parse(hotel.amenities || '[]');
    } catch {
      parsedAmenities = [];
    }

    setFormData({
      name: hotel.name,
      location: hotel.location,
      starRating: String(hotel.starRating || 5),
      pricePerNight: String(hotel.pricePerNight || 12000),
      description: hotel.description || '',
      image: hotel.image || '/images/hotels/hotel_1.png',
      contactName: hotel.contactName || '',
      contactPhone: hotel.contactPhone || '',
      contactEmail: hotel.contactEmail || '',
      amenities: parsedAmenities
    });
    setModalOpen(true);
  };

  const handleToggleAmenity = (amenity: string) => {
    setFormData(prev => {
      const exists = prev.amenities.includes(amenity);
      return {
        ...prev,
        amenities: exists 
          ? prev.amenities.filter(a => a !== amenity)
          : [...prev.amenities, amenity]
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.location.trim()) {
      toast.error('Please enter property name and location');
      return;
    }

    try {
      setIsSubmitting(true);
      const authToken = token || localStorage.getItem('auth_token') || '';
      const url = isEditing 
        ? `${API_BASE_URL}/hotels/${currentHotelId}` 
        : `${API_BASE_URL}/hotels`;
      const method = isEditing ? 'PATCH' : 'POST';

      const payload = {
        name: formData.name.trim(),
        location: formData.location.trim(),
        starRating: Number(formData.starRating) || 5,
        pricePerNight: Number(formData.pricePerNight) || 12000,
        description: formData.description,
        image: formData.image,
        contactName: formData.contactName.trim() || undefined,
        contactPhone: formData.contactPhone.trim() || undefined,
        contactEmail: formData.contactEmail.trim() || undefined,
        amenities: formData.amenities
      };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save property');
      }

      toast.success(isEditing ? `Property ${formData.name} updated!` : `Property ${formData.name} registered!`, {
        description: 'Synchronized live with Neon PostgreSQL database.',
        icon: '🏨'
      });
      setModalOpen(false);
      fetchHotels();
    } catch (err: any) {
      toast.error(err.message || 'Error saving hotel');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (hotel: Hotel) => {
    if (!window.confirm(`Are you sure you want to remove "${hotel.name}"? This will delete associated rooms and records.`)) {
      return;
    }

    try {
      const authToken = token || localStorage.getItem('auth_token') || '';
      const res = await fetch(`${API_BASE_URL}/hotels/${hotel.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (!res.ok) throw new Error('Failed to delete property');

      toast.success(`Property "${hotel.name}" removed from database`);
      fetchHotels();
    } catch (err: any) {
      toast.error(err.message || 'Error deleting property');
    }
  };

  // Filtered hotels
  const filteredHotels = hotels.filter(h => {
    const matchesSearch = h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (h.contactPhone || '').includes(searchQuery);

    if (!matchesSearch) return false;

    if (locationFilter !== 'ALL') {
      return h.location.toLowerCase().includes(locationFilter.toLowerCase());
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 sm:p-5 rounded-3xl border border-border/80 shadow-sm">
        <div>
          <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
            <span>Partner Hotels & Heritage Houseboats</span>
            <Badge variant="outline" className="text-emerald-600 border-emerald-500/40 text-xs">
              Live Neon DB Directory
            </Badge>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage authorized Kashmir hotels, set wholesale B2B contract rates, and dispatch bookings.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search hotel or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 w-48 sm:w-60 text-xs rounded-xl"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchHotels}
            disabled={isLoading}
            className="rounded-xl text-xs gap-1.5 h-10"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </Button>

          <Button
            size="sm"
            onClick={handleOpenAdd}
            className="rounded-xl text-xs font-bold gap-1.5 h-10 bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Hotel / Stay</span>
          </Button>
        </div>
      </div>

      {/* Quick Location Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: 'ALL', label: 'All Destinations' },
          { id: 'srinagar', label: 'Srinagar & Dal Lake' },
          { id: 'gulmarg', label: 'Gulmarg Valley' },
          { id: 'pahalgam', label: 'Pahalgam Pines' },
          { id: 'sonmarg', label: 'Sonmarg Meadows' }
        ].map(loc => (
          <button
            key={loc.id}
            onClick={() => setLocationFilter(loc.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              locationFilter === loc.id
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-card border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {loc.label}
          </button>
        ))}
      </div>

      {/* Hotels Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map(i => (
            <Card key={i} className="rounded-3xl border border-border/60 bg-card p-5 h-80 animate-pulse" />
          ))}
        </div>
      ) : filteredHotels.length === 0 ? (
        <Card className="rounded-3xl border border-dashed border-border p-12 text-center bg-card/60">
          <Building2 className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
          <h4 className="font-bold text-base text-foreground">No Properties Found</h4>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
            {hotels.length === 0 
              ? 'No hotels have been registered in the database yet. Click below to add your first property.'
              : 'No hotels match the current search or destination filter.'}
          </p>
          <Button
            size="sm"
            onClick={handleOpenAdd}
            className="rounded-xl text-xs font-bold gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950"
          >
            <Plus className="w-4 h-4" />
            <span>Register First Property</span>
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredHotels.map((hotel) => {
            let amenitiesList: string[] = [];
            try {
              amenitiesList = JSON.parse(hotel.amenities || '[]');
            } catch {
              amenitiesList = [];
            }

            return (
              <Card 
                key={hotel.id}
                className="rounded-3xl border border-border/80 bg-card shadow-sm hover:border-amber-500/50 hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
              >
                <div>
                  {/* Image & Star Rating Header */}
                  <div className="relative h-44 bg-muted overflow-hidden">
                    <img 
                      src={hotel.image || '/images/hotels/hotel_1.png'} 
                      alt={hotel.name}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/hotels/hotel_1.png';
                      }}
                    />
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <Badge className="bg-slate-950/80 backdrop-blur-md text-amber-400 border-amber-500/30 text-[10px] font-bold flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{hotel.starRating}-Star Luxury</span>
                      </Badge>
                    </div>

                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(hotel)}
                        className="p-2 rounded-xl bg-slate-950/80 backdrop-blur-md text-white hover:text-amber-400 transition-colors"
                        title="Edit Hotel Details"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(hotel)}
                        className="p-2 rounded-xl bg-slate-950/80 backdrop-blur-md text-rose-400 hover:text-rose-300 transition-colors"
                        title="Delete Hotel"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white drop-shadow-md">
                      <span className="text-[11px] font-bold flex items-center gap-1 bg-black/50 px-2.5 py-1 rounded-lg backdrop-blur-sm">
                        <MapPin className="w-3.5 h-3.5 text-amber-400" />
                        <span className="truncate">{hotel.location}</span>
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-3">
                    <div>
                      <h4 className="font-black text-base text-foreground line-clamp-1">{hotel.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {hotel.description || 'Verified Kashmir hospitality partner with confirmed winter heating and 24/7 service.'}
                      </p>
                    </div>

                    {/* Wholesale Contract Tariff */}
                    <div className="p-3 bg-muted/40 rounded-2xl flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Wholesale B2B Rate</span>
                        <span className="font-mono text-base font-black text-foreground">
                          ₹{hotel.pricePerNight?.toLocaleString('en-IN') || '14,500'}
                          <span className="text-[10px] text-muted-foreground font-normal"> / night (EP)</span>
                        </span>
                      </div>
                      <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30">
                        Direct Contract
                      </Badge>
                    </div>

                    {/* Contact details */}
                    <div className="space-y-1 text-xs text-muted-foreground">
                      {hotel.contactPhone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span className="font-mono">{hotel.contactPhone}</span>
                          {hotel.contactName && <span className="text-[11px]">({hotel.contactName})</span>}
                        </div>
                      )}
                    </div>

                    {/* Amenities pills */}
                    {amenitiesList.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {amenitiesList.slice(0, 4).map((a, idx) => (
                          <span key={idx} className="text-[10px] font-medium px-2 py-0.5 rounded-lg bg-muted text-muted-foreground">
                            {a}
                          </span>
                        ))}
                        {amenitiesList.length > 4 && (
                          <span className="text-[10px] text-muted-foreground px-1 self-center">
                            +{amenitiesList.length - 4} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="p-5 pt-0 grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onSelectHotelToManage?.(hotel.id)}
                    className="rounded-xl text-xs font-bold gap-1.5 h-9"
                  >
                    <BedDouble className="w-3.5 h-3.5 text-amber-500" />
                    <span>Manage Rooms</span>
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => onSendBookingForHotel?.(hotel.id)}
                    className="rounded-xl text-xs font-bold gap-1.5 h-9 bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm"
                  >
                    <CalendarCheck2 className="w-3.5 h-3.5" />
                    <span>Send Booking</span>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add / Edit Hotel Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="rounded-3xl max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Building2 className="w-5 h-5 text-amber-500" />
              <span>{isEditing ? 'Edit Hotel Details' : 'Register New Hotel / Houseboat'}</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2 text-xs">
            <div>
              <label className="font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Property Name *
              </label>
              <Input
                placeholder="e.g. Pine Palace Resort or Sukoon Houseboat"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="rounded-xl h-10 font-bold"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                  Location / Destination *
                </label>
                <Input
                  placeholder="e.g. Gulmarg Alpine Valley"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="rounded-xl h-10"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                  Star Rating
                </label>
                <Select 
                  value={formData.starRating} 
                  onValueChange={(val) => setFormData(prev => ({ ...prev, starRating: val }))}
                >
                  <SelectTrigger className="rounded-xl h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5-Star Luxury Resort / Palace</SelectItem>
                    <SelectItem value="4">4-Star Premium Stay</SelectItem>
                    <SelectItem value="3">3-Star Deluxe Cottage</SelectItem>
                    <SelectItem value="2">Heritage Houseboat / Stays</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                  Base B2B Wholesale Rate (₹ / night)
                </label>
                <Input
                  type="number"
                  placeholder="14500"
                  value={formData.pricePerNight}
                  onChange={(e) => setFormData(prev => ({ ...prev, pricePerNight: e.target.value }))}
                  className="rounded-xl h-10 font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                  Cover Photo URL
                </label>
                <Input
                  placeholder="/images/hotels/hotel_1.png"
                  value={formData.image}
                  onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                  className="rounded-xl h-10 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                  Contact Person
                </label>
                <Input
                  placeholder="Duty Manager Name"
                  value={formData.contactName}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
                  className="rounded-xl h-10"
                />
              </div>

              <div>
                <label className="font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                  Phone / WhatsApp
                </label>
                <Input
                  placeholder="+91 94190..."
                  value={formData.contactPhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                  className="rounded-xl h-10"
                />
              </div>

              <div>
                <label className="font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="hotel@resort.com"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                  className="rounded-xl h-10"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Property Description
              </label>
              <Input
                placeholder="Brief summary of property, view, and winter heating facilities..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="rounded-xl h-10"
              />
            </div>

            {/* Amenities Toggle */}
            <div>
              <label className="font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                Property Amenities & Kashmir Standards
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PRESET_AMENITIES.map((amenity) => {
                  const isChecked = formData.amenities.includes(amenity);
                  return (
                    <button
                      type="button"
                      key={amenity}
                      onClick={() => handleToggleAmenity(amenity)}
                      className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold text-left flex items-center justify-between transition-colors ${
                        isChecked 
                          ? 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-400' 
                          : 'border-border text-muted-foreground hover:border-border/80'
                      }`}
                    >
                      <span className="truncate">{amenity}</span>
                      {isChecked && <Check className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 ml-1" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md"
              >
                {isSubmitting ? 'Saving...' : (isEditing ? 'Save Changes' : 'Register Property')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HotelDirectoryManager;
