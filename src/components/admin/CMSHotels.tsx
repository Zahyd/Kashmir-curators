import { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Pencil, Trash2, Eye, EyeOff, Star, Loader2, MapPin, 
  BedDouble, Info, CheckCircle2, Save, Image as ImageIcon, 
  Sparkles, Wrench, Shield, Check, X, FileText, AlertTriangle, 
  AlertOctagon, TrendingUp, DollarSign, Calendar, Users, Landmark, Activity 
} from 'lucide-react';
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
  allotment?: number;
  blackoutDates?: string[];
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
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  paymentTerms?: string | null;
  commissionStructure?: string | null;
  seasonalPricing?: string | null;
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
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  paymentTerms: 'Prepayment',
  commissionStructure: '10%',
  seasonalPricing: '[]',
};

export default function CMSHotels() {
  const { systemEvents } = useTeamAuth();
  
  // Navigation & Role simulation states
  const [currentTab, setCurrentTab] = useState<'operations' | 'registry' | 'rooms' | 'housekeeping' | 'settlements' | 'analytics'>('operations');
  const [activeRole, setActiveRole] = useState<'Director' | 'Operations Manager' | 'Hotel Manager' | 'Hotel Partner' | 'Finance' | 'Support'>('Director');

  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);

  // Operations metrics KPIs
  const [kpi, setKpi] = useState({
    totalHotels: 0,
    activeHotels: 0,
    availableRooms: 28,
    occupiedRooms: 14,
    todayCheckIns: 4,
    todayCheckOuts: 2,
    pendingConfirmations: 0,
    occupancyRate: 68,
    revenueToday: 45000,
    monthlyRevenue: 840000,
    averageRating: 4.6,
    pendingPayments: 0,
    commissionDue: 84000,
    maintenanceRequests: 0,
    alertsCount: 0
  });
  const [kpiLoading, setKpiLoading] = useState(true);

  // Operational Lists
  const [roomCategories, setRoomCategories] = useState<any[]>([]);
  const [hotelRooms, setHotelRooms] = useState<any[]>([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState<any[]>([]);
  const [settlements, setSettlements] = useState<any[]>([]);
  const [selectedHotelId, setSelectedHotelId] = useState<string>('');

  // Dialog configurations
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    basePrice: 5500,
    capacity: 2,
    maxOccupancy: 3,
    amenities: '',
    imageUrl: ''
  });
  const [savingCategory, setSavingCategory] = useState(false);

  const [roomDialogOpen, setRoomDialogOpen] = useState(false);
  const [roomFormData, setRoomFormData] = useState({
    categoryId: '',
    roomNumber: '',
    floor: '1st Floor',
    status: 'AVAILABLE',
    housekeeping: 'CLEAN'
  });
  const [savingRoom, setSavingRoom] = useState(false);

  const [maintenanceDialogOpen, setMaintenanceDialogOpen] = useState(false);
  const [maintenanceFormData, setMaintenanceFormData] = useState({
    roomNumber: '',
    task: '',
    priority: 'MEDIUM',
    cost: 0
  });
  const [savingMaintenance, setSavingMaintenance] = useState(false);

  const [settlementDialogOpen, setSettlementDialogOpen] = useState(false);
  const [settlementFormData, setSettlementFormData] = useState({
    amount: 150000,
    commissionDues: 15000,
    netPaid: 135000,
    transactionRef: ''
  });
  const [savingSettlement, setSavingSettlement] = useState(false);

  const fetchDashboardKpi = async () => {
    setKpiLoading(true);
    const token = localStorage.getItem('teamToken');
    try {
      const response = await fetch(`${API_BASE_URL}/hotels/operations/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setKpi(data);
      }
    } catch (error) {
      console.error('[CMSHotels] Error loading dashboard KPIs:', error);
    } finally {
      setKpiLoading(false);
    }
  };

  const fetchOperationalData = async (hotelId: string) => {
    if (!hotelId) return;
    const token = localStorage.getItem('teamToken');
    try {
      const rcRes = await fetch(`${API_BASE_URL}/hotels/operations/categories?hotelId=${hotelId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (rcRes.ok) setRoomCategories(await rcRes.json());

      const prRes = await fetch(`${API_BASE_URL}/hotels/operations/rooms?hotelId=${hotelId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (prRes.ok) setHotelRooms(await prRes.json());

      const mlRes = await fetch(`${API_BASE_URL}/hotels/operations/maintenance?hotelId=${hotelId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (mlRes.ok) setMaintenanceLogs(await mlRes.json());

      const sRes = await fetch(`${API_BASE_URL}/hotels/operations/settlements?hotelId=${hotelId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (sRes.ok) setSettlements(await sRes.json());
    } catch (e) {
      console.error('[CMSHotels] Error fetching operational data:', e);
    }
  };
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingHotel, setEditingHotel] = useState<Hotel | null>(null);
  const [formData, setFormData] = useState(defaultHotel);
  const [amenitiesInput, setAmenitiesInput] = useState('');
  const [roomTypesInput, setRoomTypesInput] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [dialogTab, setDialogTab] = useState<'basic' | 'crm'>('basic');

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

  const handleSaveCategory = async () => {
    if (!categoryFormData.name || !categoryFormData.basePrice) {
      toast.error('Name and price are required');
      return;
    }
    setSavingCategory(true);
    const token = localStorage.getItem('teamToken');
    try {
      const response = await fetch(`${API_BASE_URL}/hotels/operations/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          hotelId: selectedHotelId,
          ...categoryFormData
        })
      });
      if (response.ok) {
        toast.success('Room category added successfully');
        setCategoryDialogOpen(false);
        fetchOperationalData(selectedHotelId);
      } else {
        toast.error('Failed to save category');
      }
    } catch (e) {
      toast.error('Network connection error');
    } finally {
      setSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (catId: string) => {
    if (!confirm('Are you sure you want to remove this category? All nested rooms will be deleted.')) return;
    const token = localStorage.getItem('teamToken');
    try {
      const response = await fetch(`${API_BASE_URL}/hotels/operations/categories/${catId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        toast.success('Room category deleted');
        fetchOperationalData(selectedHotelId);
      }
    } catch (e) {
      toast.error('Network error');
    }
  };

  const handleSaveRoom = async () => {
    if (!roomFormData.categoryId || !roomFormData.roomNumber) {
      toast.error('Room Category and room number are mandatory');
      return;
    }
    setSavingRoom(true);
    const token = localStorage.getItem('teamToken');
    try {
      const response = await fetch(`${API_BASE_URL}/hotels/operations/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          hotelId: selectedHotelId,
          ...roomFormData
        })
      });
      if (response.ok) {
        toast.success(`Room ${roomFormData.roomNumber} added to registry`);
        setRoomDialogOpen(false);
        fetchOperationalData(selectedHotelId);
      } else {
        toast.error('Failed to create room');
      }
    } catch (e) {
      toast.error('Network error');
    } finally {
      setSavingRoom(false);
    }
  };

  const handleUpdateRoomHousekeeping = async (roomId: string, housekeeping: string) => {
    const token = localStorage.getItem('teamToken');
    try {
      const response = await fetch(`${API_BASE_URL}/hotels/operations/rooms/${roomId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ housekeeping })
      });
      if (response.ok) {
        toast.success('Room cleanliness state updated');
        fetchOperationalData(selectedHotelId);
        fetchDashboardKpi();
      }
    } catch (e) {
      toast.error('Network error');
    }
  };

  const handleUpdateRoomStatus = async (roomId: string, status: string) => {
    const token = localStorage.getItem('teamToken');
    try {
      const response = await fetch(`${API_BASE_URL}/hotels/operations/rooms/${roomId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (response.ok) {
        toast.success('Room occupancy status updated');
        fetchOperationalData(selectedHotelId);
        fetchDashboardKpi();
      }
    } catch (e) {
      toast.error('Network error');
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!confirm('Are you sure you want to remove this room?')) return;
    const token = localStorage.getItem('teamToken');
    try {
      await fetch(`${API_BASE_URL}/hotels/operations/rooms/${roomId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      toast.success('Room removed');
      fetchOperationalData(selectedHotelId);
    } catch (e) {
      toast.error('Network error');
    }
  };

  const handleSaveMaintenance = async () => {
    if (!maintenanceFormData.roomNumber || !maintenanceFormData.task) {
      toast.error('Room number and description are required');
      return;
    }
    setSavingMaintenance(true);
    const token = localStorage.getItem('teamToken');
    try {
      const response = await fetch(`${API_BASE_URL}/hotels/operations/maintenance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          hotelId: selectedHotelId,
          ...maintenanceFormData
        })
      });
      if (response.ok) {
        toast.success('Maintenance ticket logged successfully');
        setMaintenanceDialogOpen(false);
        fetchOperationalData(selectedHotelId);
        fetchDashboardKpi();
      }
    } catch (e) {
      toast.error('Network error');
    } finally {
      setSavingMaintenance(false);
    }
  };

  const handleResolveMaintenance = async (id: string) => {
    const token = localStorage.getItem('teamToken');
    try {
      const response = await fetch(`${API_BASE_URL}/hotels/operations/maintenance/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'RESOLVED' })
      });
      if (response.ok) {
        toast.success('Issue resolved. Room set back to AVAILABLE.');
        fetchOperationalData(selectedHotelId);
        fetchDashboardKpi();
      }
    } catch (e) {
      toast.error('Network error');
    }
  };

  const handleSaveSettlement = async () => {
    setSavingSettlement(true);
    const token = localStorage.getItem('teamToken');
    try {
      const response = await fetch(`${API_BASE_URL}/hotels/operations/settlements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          hotelId: selectedHotelId,
          ...settlementFormData
        })
      });
      if (response.ok) {
        toast.success('Settlement record registered successfully');
        setSettlementDialogOpen(false);
        fetchOperationalData(selectedHotelId);
        fetchDashboardKpi();
      }
    } catch (e) {
      toast.error('Network error');
    } finally {
      setSavingSettlement(false);
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
    fetchDashboardKpi();
  }, []);

  useEffect(() => {
    if (hotels.length > 0 && !selectedHotelId) {
      setSelectedHotelId(hotels[0].id);
    }
  }, [hotels, selectedHotelId]);

  useEffect(() => {
    if (selectedHotelId) {
      fetchOperationalData(selectedHotelId);
    }
  }, [selectedHotelId]);

  useEffect(() => {
    const latestEvent = systemEvents[0];
    if (latestEvent) {
      if (latestEvent.booking && latestEvent.booking.entityType === 'hotel') {
        console.log('[CMSHotels] System event detected for hotel, refreshing...');
        fetchHotels();
        fetchDashboardKpi();
        if (selectedHotelId) fetchOperationalData(selectedHotelId);
      }
      if (latestEvent.message && (
        latestEvent.message.includes('room') || 
        latestEvent.message.includes('maintenance') || 
        latestEvent.message.includes('settlement')
      )) {
        fetchDashboardKpi();
        if (selectedHotelId) fetchOperationalData(selectedHotelId);
      }
    }
  }, [systemEvents, selectedHotelId]);

  const openCreateDialog = () => {
    setEditingHotel(null);
    setFormData(defaultHotel);
    setAmenitiesInput('');
    setRoomTypesInput('');
    setDialogTab('basic');
    setDialogOpen(true);
  };

  const openEditDialog = (hotel: Hotel) => {
    setEditingHotel(hotel);
    setFormData({
      ...hotel,
      contactName: hotel.contactName || '',
      contactEmail: hotel.contactEmail || '',
      contactPhone: hotel.contactPhone || '',
      paymentTerms: hotel.paymentTerms || 'Prepayment',
      commissionStructure: hotel.commissionStructure || '10%',
      seasonalPricing: hotel.seasonalPricing || '[]'
    });
    setAmenitiesInput(hotel.amenities?.join('\n') || '');
    setRoomTypesInput(
      hotel.roomTypes?.map((r) => {
        const parts = [r.name, r.price];
        if (r.allotment !== undefined) {
          parts.push(r.allotment);
          if (r.blackoutDates && r.blackoutDates.length > 0) {
            parts.push(r.blackoutDates.join(','));
          }
        }
        return parts.join(':');
      }).join('\n') || ''
    );
    setDialogTab('basic');
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
        const parts = line.split(':');
        const name = (parts[0] || '').trim();
        const price = Number(parts[1]) || 0;
        const allotment = parts[2] ? (parseInt(parts[2]) || 5) : 5;
        const blackoutStr = parts[3] || '';
        const blackoutDates = blackoutStr ? blackoutStr.split(',').map(d => d.trim()).filter(Boolean) : [];
        return { 
          id: `room-${idx}`, 
          name, 
          price,
          allotment,
          blackoutDates
        };
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
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Role Simulator bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white/[0.01] border border-white/5 rounded-3xl p-4">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-kashmir-gold" />
          <span className="text-[10px] font-black uppercase tracking-wider text-white/50">OPERATIONS SECURITY CONTROL</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-white/30 uppercase font-black mr-2">Simulate Access Permissions:</span>
          <div className="flex flex-wrap gap-1">
            {(['Director', 'Operations Manager', 'Hotel Partner', 'Finance', 'Support'] as const).map(role => (
              <Button
                key={role}
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 rounded-lg text-[9px] uppercase tracking-wider font-bold px-3 transition-all",
                  activeRole === role 
                    ? "bg-kashmir-gold text-black hover:bg-kashmir-gold hover:text-black font-black" 
                    : "text-white/40 hover:text-white hover:bg-white/5"
                )}
                onClick={() => setActiveRole(role)}
              >
                {role}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-display font-black text-white tracking-tight uppercase">Hospitality Nodes</h2>
          <p className="text-white/40 text-xs mt-1 uppercase tracking-widest font-bold">REAL-TIME HOSPITALITY COMMAND CENTER</p>
        </div>
        
        {/* Hotel selector */}
        {hotels.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-[9px] font-black text-white/30 uppercase tracking-widest shrink-0">SELECTED PROPERTY:</span>
            <Select value={selectedHotelId} onValueChange={setSelectedHotelId}>
              <SelectTrigger className="w-56 bg-white/5 border-white/10 text-white rounded-xl h-11 text-xs font-bold focus:border-kashmir-gold/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0a0f12] border-white/10 text-white">
                {hotels.map(h => (
                  <SelectItem key={h.id} value={h.id} className="text-xs">{h.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Main Command Tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-white/5 pb-2">
        {[
          { id: 'operations', label: 'Operations Desk', icon: Activity },
          { id: 'registry', label: 'Property Registry', icon: Landmark },
          { id: 'rooms', label: 'Room Manager', icon: BedDouble },
          { id: 'housekeeping', label: 'Housekeeping & Repairs', icon: Wrench },
          { id: 'settlements', label: 'Settlements & Payouts', icon: DollarSign },
          { id: 'analytics', label: 'Analytics Console', icon: TrendingUp }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                currentTab === tab.id 
                  ? "bg-kashmir-gold text-black font-black shadow-lg shadow-kashmir-gold/5"
                  : "text-white/40 hover:text-white hover:bg-white/5"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OPERATIONS DESK */}
      {currentTab === 'operations' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          
          {/* Operations KPI ribbon */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            {[
              { label: 'Occupancy Rate', value: `${kpi.occupancyRate}%`, color: 'text-kashmir-gold' },
              { label: 'Today Check-ins', value: kpi.todayCheckIns, color: 'text-white' },
              { label: 'Today Check-outs', value: kpi.todayCheckOuts, color: 'text-white' },
              { label: 'Pending Confirmations', value: kpi.pendingConfirmations, color: 'text-amber-400' },
              { label: 'Occupied Rooms', value: `${kpi.occupiedRooms} / ${kpi.availableRooms + kpi.occupiedRooms}`, color: 'text-emerald-400' },
              { label: 'Service Alerts', value: kpi.alertsCount, color: 'text-red-400' }
            ].map(card => (
              <Card key={card.label} className="bg-white/[0.01] border-white/5 p-4 rounded-2xl flex flex-col justify-between min-h-[100px]">
                <span className="text-[8px] font-black uppercase text-white/30 tracking-wider leading-tight">{card.label}</span>
                <span className={cn("text-2xl font-display font-black mt-2", card.color)}>{card.value}</span>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Live Room Grid */}
            <div className="lg:col-span-8 space-y-6">
              <Card className="bg-white/[0.01] border-white/5 p-8 rounded-[2.5rem]">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-xl font-display font-black text-white uppercase tracking-tight">Live Room Status Grid</h3>
                    <p className="text-[10px] text-white/30 font-black uppercase tracking-widest mt-1">Real-time check-in and housekeeping console</p>
                  </div>
                </div>

                {hotelRooms.length === 0 ? (
                  <div className="text-center py-12 text-white/20 text-xs font-bold uppercase tracking-wider">
                    No physical rooms registered for this hotel yet. Head to "Room Manager" to add rooms.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {hotelRooms.map(room => (
                      <Card key={room.id} className="bg-black/40 border-white/5 p-4 rounded-2xl space-y-3 relative overflow-hidden group">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-xs font-black text-white">{room.roomNumber}</span>
                            <span className="block text-[8px] text-white/30 uppercase mt-0.5">{room.floor || '1st Floor'}</span>
                          </div>
                          <Badge className={cn("border-none text-[8px] px-2 py-0.5",
                            room.status === 'AVAILABLE' ? 'bg-emerald-500/10 text-emerald-400' :
                            room.status === 'OCCUPIED' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'
                          )}>
                            {room.status}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center text-[9px] border-t border-white/5 pt-2">
                          <span className="text-white/40">Cleanliness:</span>
                          <span className={cn("font-bold uppercase",
                            room.housekeeping === 'CLEAN' ? 'text-emerald-400' :
                            room.housekeeping === 'INSPECTED' ? 'text-kashmir-gold' : 'text-red-400'
                          )}>
                            {room.housekeeping}
                          </span>
                        </div>
                        {activeRole === 'Director' && (
                          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-center items-center gap-2 p-3 z-10">
                            <span className="text-[8px] font-black uppercase text-white/50 tracking-wider">ROOM OPERATOR</span>
                            <div className="flex gap-1.5 w-full">
                              <Button size="sm" variant="outline" className="flex-1 text-[8px] h-7 bg-white/5 border-white/10" onClick={() => handleUpdateRoomStatus(room.id, room.status === 'AVAILABLE' ? 'OCCUPIED' : 'AVAILABLE')}>
                                Toggle Occ.
                              </Button>
                              <Button size="sm" variant="outline" className="flex-1 text-[8px] h-7 bg-white/5 border-white/10" onClick={() => handleUpdateRoomHousekeeping(room.id, room.housekeeping === 'CLEAN' ? 'DIRTY' : 'CLEAN')}>
                                Toggle House.
                              </Button>
                            </div>
                            <Button size="sm" variant="ghost" className="text-[8px] h-6 text-red-400 hover:bg-red-500/10" onClick={() => handleDeleteRoom(room.id)}>
                              Remove Room
                            </Button>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            {/* AI Room Allocator suggestions */}
            <div className="lg:col-span-4 space-y-6">
              <Card className="bg-white/[0.01] border-white/5 p-6 rounded-3xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-kashmir-gold/5 rounded-full blur-2xl pointer-events-none" />
                <h3 className="text-xs font-display font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-kashmir-gold animate-pulse" />
                  AI Room Allocation Engine
                </h3>
                <p className="text-[9px] text-white/30 uppercase mt-1">Intelligent allocation mapping coefficients</p>
                <div className="space-y-4 pt-6">
                  <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl space-y-3">
                    <span className="text-[9px] font-black uppercase text-kashmir-gold block">SUGGESTED FOR PENDING:</span>
                    <div className="text-[10px] space-y-1 text-white/70 font-semibold leading-relaxed">
                      <p>• Room 204 (Deluxe) fits Guest Shabir Ahmad (Couple stay, Honeymoon request)</p>
                      <p>• Room 108 (Standard) fits Tariq Mir (Single traveler, early check-in preference)</p>
                    </div>
                  </div>
                  <Button className="w-full bg-kashmir-gold text-black hover:bg-amber-500 text-[10px] font-black uppercase tracking-wider h-11 rounded-xl">
                    Deploy AI Recommendations
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PROPERTY REGISTRY */}
      {currentTab === 'registry' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          
          <div className="flex justify-between items-center bg-white/[0.01] border border-white/5 rounded-3xl p-6">
            <div>
              <h3 className="text-xl font-display font-black text-white uppercase tracking-tight">Property Registry</h3>
              <p className="text-xs text-white/30 uppercase tracking-widest font-black mt-1">Manage luxury properties, contacts, policy parameters, and page configurations</p>
            </div>
            {activeRole === 'Director' && (
              <Button onClick={openCreateDialog} className="bg-kashmir-gold text-black hover:bg-amber-500 rounded-xl font-black text-[9px] uppercase tracking-widest px-5 h-12 flex items-center gap-2">
                <Plus className="w-4 h-4" /> Commission Property
              </Button>
            )}
          </div>

          {/* Hotels Hero CMS Panel */}
          <Card className="bg-white/[0.01] border-white/5 rounded-[2.5rem] p-8 backdrop-blur-3xl relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-kashmir-gold/[0.02] to-transparent pointer-events-none" />
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div>
                <h3 className="text-lg font-display font-black text-white uppercase tracking-tight flex items-center gap-2">
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
                  <TableHead className="text-white/20 uppercase text-[9px] font-black tracking-[0.4em]">Price Starting</TableHead>
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
                        <Button variant="ghost" size="icon" onClick={() => { setItemToDelete(hotel.id); setDeleteConfirmOpen(true); }} className="w-12 h-12 bg-white/5 border border-white/5 rounded-2xl text-white/20 hover:text-red-400 hover:border-red-400/20 transition-all">
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* TAB 3: ROOM MANAGER */}
      {currentTab === 'rooms' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="flex justify-between items-center bg-white/[0.01] border border-white/5 rounded-3xl p-6">
            <div>
              <h3 className="text-xl font-display font-black text-white uppercase tracking-tight">Room Manager</h3>
              <p className="text-xs text-white/30 uppercase tracking-widest font-black mt-1">Configure room categories, pricing, seasonal rules, and block dates</p>
            </div>
            {activeRole === 'Director' && (
              <div className="flex gap-3">
                <Button onClick={() => setCategoryDialogOpen(true)} className="bg-white/5 border border-white/10 text-white hover:bg-white/10 rounded-xl font-black text-[9px] uppercase tracking-widest px-5 h-12">
                  <Plus className="w-4 h-4 mr-2" /> Add Category
                </Button>
                <Button onClick={() => setRoomDialogOpen(true)} className="bg-kashmir-gold text-black hover:bg-amber-500 rounded-xl font-black text-[9px] uppercase tracking-widest px-5 h-12">
                  <Plus className="w-4 h-4 mr-2" /> Add Physical Room
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {roomCategories.map(cat => (
              <Card key={cat.id} className="bg-white/[0.01] border border-white/5 p-6 rounded-3xl relative overflow-hidden group">
                <div className="absolute top-4 right-4">
                  <Badge className="bg-white/5 text-white/50 border-none text-[8px] uppercase tracking-widest font-bold">
                    Capacity: {cat.capacity} Guests
                  </Badge>
                </div>
                <div className="space-y-4 pt-4">
                  <h4 className="text-sm font-black text-white uppercase tracking-tight">{cat.name}</h4>
                  <div className="border-t border-b border-white/5 py-3 text-[10px]">
                    <span className="block text-[8px] text-white/20 uppercase tracking-wider">Base Rate</span>
                    <span className="font-bold text-kashmir-gold text-base">₹{cat.basePrice.toLocaleString()} / night</span>
                  </div>
                  <div className="text-[10px] space-y-1 text-white/50">
                    <span className="block text-[8px] text-white/20 uppercase">Inclusions & Amenities:</span>
                    <p>{JSON.parse(cat.amenities || '[]').join(', ') || 'Standard toiletries, WiFi'}</p>
                  </div>
                  {activeRole === 'Director' && (
                    <Button size="sm" variant="ghost" className="text-[8px] text-red-400 hover:bg-red-500/10 w-full uppercase" onClick={() => handleDeleteCategory(cat.id)}>
                      Remove Category
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: HOUSEKEEPING & REPAIRS */}
      {currentTab === 'housekeeping' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="flex justify-between items-center bg-white/[0.01] border border-white/5 rounded-3xl p-6">
            <div>
              <h3 className="text-xl font-display font-black text-white uppercase tracking-tight">Housekeeping & Repairs</h3>
              <p className="text-xs text-white/30 uppercase tracking-widest font-black mt-1">Track cleanliness audits, room servicing statuses, and maintenance logs</p>
            </div>
            {activeRole === 'Director' && (
              <Button onClick={() => setMaintenanceDialogOpen(true)} className="bg-kashmir-gold text-black hover:bg-amber-500 rounded-xl font-black text-[9px] uppercase tracking-widest px-5 h-12">
                <Plus className="w-4 h-4 mr-2" /> Log Maintenance Work
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {maintenanceLogs.map(log => (
              <Card key={log.id} className="bg-white/[0.01] border border-white/5 p-6 rounded-3xl relative overflow-hidden group">
                <div className="absolute top-4 right-4">
                  <Badge className={cn("border-none text-[8px] uppercase font-bold",
                    log.status === 'PENDING' ? 'bg-red-500/10 text-red-400' :
                    log.status === 'IN_PROGRESS' ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'
                  )}>
                    {log.status}
                  </Badge>
                </div>
                <div className="space-y-4 pt-4 text-xs">
                  <div>
                    <span className="text-[8px] text-white/20 uppercase tracking-widest block">VEHICLE/ROOM NODE</span>
                    <h4 className="text-sm font-bold text-white uppercase">Room {log.roomNumber}</h4>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[8px] text-white/20 uppercase block">Maintenance Issue</span>
                    <p className="font-semibold text-white leading-relaxed">{log.task}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-3 text-[10px]">
                    <div>
                      <span className="block text-[8px] text-white/20 uppercase">Repair Cost</span>
                      <span className="font-bold text-emerald-400">₹{log.cost.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="block text-[8px] text-white/20 uppercase">Priority</span>
                      <span className="font-bold text-white">{log.priority}</span>
                    </div>
                  </div>
                  {log.status !== 'RESOLVED' && activeRole === 'Director' && (
                    <Button size="sm" className="w-full bg-emerald-500 text-black hover:bg-emerald-600 text-[9px] uppercase font-black" onClick={() => handleResolveMaintenance(log.id)}>
                      Mark Resolved
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: SETTLEMENTS & PAYOUTS */}
      {currentTab === 'settlements' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="flex justify-between items-center bg-white/[0.01] border border-white/5 rounded-3xl p-6">
            <div>
              <h3 className="text-xl font-display font-black text-white uppercase tracking-tight">Settlements & Payouts</h3>
              <p className="text-xs text-white/30 uppercase tracking-widest font-black mt-1">Record hotel net settlements, payouts logs, and commission dues</p>
            </div>
            {activeRole === 'Director' && (
              <Button onClick={() => setSettlementDialogOpen(true)} className="bg-kashmir-gold text-black hover:bg-amber-500 rounded-xl font-black text-[9px] uppercase tracking-widest px-5 h-12">
                <Plus className="w-4 h-4 mr-2" /> Log Partner Settlement
              </Button>
            )}
          </div>

          <Card className="bg-white/[0.01] border-white/5 rounded-[2.5rem] overflow-hidden">
            <Table>
              <TableHeader className="bg-white/[0.02] border-b border-white/5">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="text-white/20 uppercase text-[9px] font-black tracking-widest pl-6">Settlement ID</TableHead>
                  <TableHead className="text-white/20 uppercase text-[9px] font-black tracking-widest">Gross Amount</TableHead>
                  <TableHead className="text-white/20 uppercase text-[9px] font-black tracking-widest">Commission Dues</TableHead>
                  <TableHead className="text-white/20 uppercase text-[9px] font-black tracking-widest">Net Paid</TableHead>
                  <TableHead className="text-white/20 uppercase text-[9px] font-black tracking-widest">Payout Date</TableHead>
                  <TableHead className="text-white/20 uppercase text-[9px] font-black tracking-widest pr-6">Transaction Ref</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-white/5">
                {settlements.map(set => (
                  <TableRow key={set.id} className="hover:bg-white/[0.02] transition-colors border-none">
                    <TableCell className="pl-6 text-xs text-white font-bold">{set.id.slice(0, 8)}</TableCell>
                    <TableCell className="text-xs text-white/70">₹{set.amount.toLocaleString()}</TableCell>
                    <TableCell className="text-xs text-red-400 font-semibold">₹{set.commissionDues.toLocaleString()}</TableCell>
                    <TableCell className="text-xs text-emerald-400 font-bold">₹{set.netPaid.toLocaleString()}</TableCell>
                    <TableCell className="text-xs text-white/40">{new Date(set.payoutDate).toLocaleDateString()}</TableCell>
                    <TableCell className="pr-6 text-xs font-mono text-white/30">{set.transactionRef || 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {/* TAB 6: ANALYTICS CONSOLE */}
      {currentTab === 'analytics' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: 'RevPAR (Revenue Per Room)', value: `₹${(kpi.revenueToday / (kpi.availableRooms || 1)).toFixed(0)}`, desc: 'Average based on occupied units' },
              { label: 'ADR (Average Daily Rate)', value: '₹5,800', desc: 'Average rate for active categories' },
              { label: 'Net Operations Margin', value: `₹${(kpi.monthlyRevenue - kpi.commissionDue).toLocaleString()}`, desc: 'Excluding service fees' }
            ].map(card => (
              <Card key={card.label} className="bg-white/[0.01] border-white/5 p-6 rounded-3xl relative overflow-hidden group">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/30">{card.label}</p>
                <p className="text-3xl font-display font-black mt-2 text-kashmir-gold">{card.value}</p>
                <span className="block text-[8px] text-white/20 uppercase tracking-widest mt-1 font-semibold">{card.desc}</span>
              </Card>
            ))}
          </div>

          <Card className="bg-white/[0.01] border-white/5 p-8 rounded-[2.5rem]">
            <h3 className="text-lg font-display font-black text-white uppercase mb-6">Hospitality Occupancy Trend</h3>
            <div className="h-64 w-full bg-white/[0.02] border border-white/5 rounded-2xl flex items-end p-6 gap-2">
              {[60, 68, 72, 70, 75, 80, 85, 78, 80, 92, 85, 88].map((percent, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full bg-kashmir-gold rounded-t" style={{ height: `${percent}%` }} />
                  <span className="text-[9px] text-white/30 uppercase font-black">M{idx + 1}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* COMMISSION NEW HOTEL DIALOG */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl bg-[#0a0f12] border-white/10 text-white rounded-[2.5rem] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-kashmir-gold/5 via-transparent to-transparent pointer-events-none" />
          <DialogHeader className="p-10 pb-0">
            <DialogTitle className="text-3xl font-display font-black tracking-tight">{editingHotel ? 'Reconfigure Hospitality Node' : 'Commission New Property'}</DialogTitle>
            
            {/* Tab Header */}
            <div className="flex gap-4 border-b border-white/5 mt-6 pb-2">
              <button 
                type="button"
                onClick={() => setDialogTab('basic')}
                className={cn(
                  "text-[10px] font-black uppercase tracking-widest pb-2 transition-all border-b-2",
                  dialogTab === 'basic' ? "text-kashmir-gold border-kashmir-gold" : "text-white/40 border-transparent hover:text-white"
                )}
              >
                Basic Details
              </button>
              <button 
                type="button"
                onClick={() => setDialogTab('crm')}
                className={cn(
                  "text-[10px] font-black uppercase tracking-widest pb-2 transition-all border-b-2",
                  dialogTab === 'crm' ? "text-kashmir-gold border-kashmir-gold" : "text-white/40 border-transparent hover:text-white"
                )}
              >
                B2B Partner CRM
              </button>
            </div>
          </DialogHeader>

          <div className="p-10 space-y-6 overflow-y-auto max-h-[60vh] custom-scrollbar">
            {dialogTab === 'basic' ? (
              <>
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
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Cover Image Source</label>
                  <Input
                    className="bg-white/5 border-white/10 rounded-xl h-14"
                    value={formData.imageUrl || ''}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="URL to cover image"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Editorial Description</label>
                  <Textarea
                    className="bg-white/5 border-white/10 rounded-2xl min-h-[100px] py-4"
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Detailed property introduction..."
                  />
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Official contact Name</label>
                    <Input
                      className="bg-white/5 border-white/10 rounded-xl h-14 text-base"
                      value={formData.contactName || ''}
                      onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                      placeholder="e.g. GM, Resident Manager"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Official contact Email</label>
                    <Input
                      className="bg-white/5 border-white/10 rounded-xl h-14 text-base"
                      value={formData.contactEmail || ''}
                      onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                      placeholder="e.g. operations@grandpalace.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Phone Contact</label>
                    <Input
                      className="bg-white/5 border-white/10 rounded-xl h-14 text-base"
                      value={formData.contactPhone || ''}
                      onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                      placeholder="e.g. +91 98765 43210"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Settlement terms</label>
                    <Select
                      value={formData.paymentTerms || 'Prepayment'}
                      onValueChange={(v) => setFormData({ ...formData, paymentTerms: v })}
                    >
                      <SelectTrigger className="bg-white/5 border-white/10 h-14 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0f1416] border-white/10 text-white">
                        <SelectItem value="Prepayment">Full Prepayment</SelectItem>
                        <SelectItem value="Credit 15 Days">Credit 15 Days</SelectItem>
                        <SelectItem value="Credit 30 Days">Credit 30 Days</SelectItem>
                        <SelectItem value="On Checkout">Dues on Checkout</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">B2B Commission Structure</label>
                  <Input
                    className="bg-white/5 border-white/10 rounded-xl h-14 focus:border-kashmir-gold/50 transition-all text-base"
                    value={formData.commissionStructure || ''}
                    onChange={(e) => setFormData({ ...formData, commissionStructure: e.target.value })}
                    placeholder="e.g., 15% on Gross Booking Rate"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Seasonal Markup/Pricing Rules (JSON)</label>
                  <Textarea
                    className="bg-white/5 border-white/10 rounded-2xl min-h-[120px] py-4 text-xs font-mono resize-none"
                    value={formData.seasonalPricing || ''}
                    onChange={(e) => setFormData({ ...formData, seasonalPricing: e.target.value })}
                    placeholder='[{"season": "Peak Summer", "start": "05-01", "end": "08-31", "markup": 1.25}]'
                  />
                </div>
              </>
            )}

            <Button onClick={handleSave} className="w-full h-16 bg-kashmir-gold text-black hover:bg-amber-500 font-black rounded-2xl transition-all shadow-xl shadow-kashmir-gold/20" disabled={saving}>
              {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : (editingHotel ? 'Confirm Reconfiguration' : 'Authorize Commissioning')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ADD ROOM CATEGORY DIALOG */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent className="max-w-md bg-[#0a0f12] border-white/10 text-white rounded-[2rem]">
          <DialogHeader className="p-8 pb-0">
            <DialogTitle className="text-xl font-display font-black tracking-tight text-white uppercase">Add Room Category</DialogTitle>
          </DialogHeader>
          <div className="p-8 space-y-4 text-left">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-white/30">Category Name</label>
              <Input className="bg-white/5 border-white/10 rounded-xl" value={categoryFormData.name} onChange={e => setCategoryFormData({ ...categoryFormData, name: e.target.value })} placeholder="e.g. Deluxe Suite" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-white/30">Base Price (₹)</label>
                <Input type="number" className="bg-white/5 border-white/10 rounded-xl" value={categoryFormData.basePrice} onChange={e => setCategoryFormData({ ...categoryFormData, basePrice: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-white/30">Capacity (Pax)</label>
                <Input type="number" className="bg-white/5 border-white/10 rounded-xl" value={categoryFormData.capacity} onChange={e => setCategoryFormData({ ...categoryFormData, capacity: Number(e.target.value) })} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-white/30">Amenities (comma-separated)</label>
              <Input className="bg-white/5 border-white/10 rounded-xl" value={categoryFormData.amenities} onChange={e => setCategoryFormData({ ...categoryFormData, amenities: e.target.value })} placeholder="Bathtub, Balcony, WiFi" />
            </div>
            <Button onClick={handleSaveCategory} className="w-full bg-kashmir-gold text-black hover:bg-amber-500 font-black h-12 rounded-xl mt-4" disabled={savingCategory}>
              Create Category
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ADD PHYSICAL ROOM DIALOG */}
      <Dialog open={roomDialogOpen} onOpenChange={setRoomDialogOpen}>
        <DialogContent className="max-w-md bg-[#0a0f12] border-white/10 text-white rounded-[2rem]">
          <DialogHeader className="p-8 pb-0">
            <DialogTitle className="text-xl font-display font-black tracking-tight text-white uppercase">Add Physical Room</DialogTitle>
          </DialogHeader>
          <div className="p-8 space-y-4 text-left">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-white/30">Room Category</label>
              <select
                value={roomFormData.categoryId}
                onChange={e => setRoomFormData({ ...roomFormData, categoryId: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl h-11 px-3 text-xs"
              >
                <option value="" className="bg-[#0a0f12]">Select Category...</option>
                {roomCategories.map(c => (
                  <option key={c.id} value={c.id} className="bg-[#0a0f12]">{c.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-white/30">Room Number</label>
                <Input className="bg-white/5 border-white/10 rounded-xl" value={roomFormData.roomNumber} onChange={e => setRoomFormData({ ...roomFormData, roomNumber: e.target.value })} placeholder="e.g. 302" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-white/30">Floor</label>
                <Input className="bg-white/5 border-white/10 rounded-xl" value={roomFormData.floor} onChange={e => setRoomFormData({ ...roomFormData, floor: e.target.value })} placeholder="e.g. 3rd Floor" />
              </div>
            </div>
            <Button onClick={handleSaveRoom} className="w-full bg-kashmir-gold text-black hover:bg-amber-500 font-black h-12 rounded-xl mt-4" disabled={savingRoom}>
              Register Room
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* LOG MAINTENANCE DIALOG */}
      <Dialog open={maintenanceDialogOpen} onOpenChange={setMaintenanceDialogOpen}>
        <DialogContent className="max-w-md bg-[#0a0f12] border-white/10 text-white rounded-[2rem]">
          <DialogHeader className="p-8 pb-0">
            <DialogTitle className="text-xl font-display font-black tracking-tight text-white uppercase">Log Maintenance request</DialogTitle>
          </DialogHeader>
          <div className="p-8 space-y-4 text-left">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-white/30">Select Room Number</label>
              <select
                value={maintenanceFormData.roomNumber}
                onChange={e => setMaintenanceFormData({ ...maintenanceFormData, roomNumber: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl h-11 px-3 text-xs"
              >
                <option value="" className="bg-[#0a0f12]">Choose room...</option>
                {hotelRooms.map(r => (
                  <option key={r.id} value={r.roomNumber} className="bg-[#0a0f12]">Room {r.roomNumber} ({r.category?.name})</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-white/30">Issue / Repairs Task</label>
              <Input className="bg-white/5 border-white/10 rounded-xl" value={maintenanceFormData.task} onChange={e => setMaintenanceFormData({ ...maintenanceFormData, task: e.target.value })} placeholder="e.g. Broken AC compressor, leak" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-white/30">Priority</label>
                <select
                  value={maintenanceFormData.priority}
                  onChange={e => setMaintenanceFormData({ ...maintenanceFormData, priority: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl h-11 px-3 text-xs"
                >
                  <option value="LOW" className="bg-[#0a0f12]">Low</option>
                  <option value="MEDIUM" className="bg-[#0a0f12]">Medium</option>
                  <option value="HIGH" className="bg-[#0a0f12]">High</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-white/30">Estimated Cost (₹)</label>
                <Input type="number" className="bg-white/5 border-white/10 rounded-xl" value={maintenanceFormData.cost || ''} onChange={e => setMaintenanceFormData({ ...maintenanceFormData, cost: Number(e.target.value) })} />
              </div>
            </div>
            <Button onClick={handleSaveMaintenance} className="w-full bg-kashmir-gold text-black hover:bg-amber-500 font-black h-12 rounded-xl mt-4" disabled={savingMaintenance}>
              Log Maintenance request
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* PARTNER SETTLEMENT DIALOG */}
      <Dialog open={settlementDialogOpen} onOpenChange={setSettlementDialogOpen}>
        <DialogContent className="max-w-md bg-[#0a0f12] border-white/10 text-white rounded-[2rem]">
          <DialogHeader className="p-8 pb-0">
            <DialogTitle className="text-xl font-display font-black tracking-tight text-white uppercase">Log Partner Settlement</DialogTitle>
          </DialogHeader>
          <div className="p-8 space-y-4 text-left">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-white/30">Gross Settlement Amount (₹)</label>
              <Input type="number" className="bg-white/5 border-white/10 rounded-xl" value={settlementFormData.amount} onChange={e => setSettlementFormData({ ...settlementFormData, amount: Number(e.target.value) })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-white/30">Commission Dues (₹)</label>
                <Input type="number" className="bg-white/5 border-white/10 rounded-xl" value={settlementFormData.commissionDues} onChange={e => setSettlementFormData({ ...settlementFormData, commissionDues: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-white/30">Net Disbursed Paid (₹)</label>
                <Input type="number" className="bg-white/5 border-white/10 rounded-xl" value={settlementFormData.netPaid} onChange={e => setSettlementFormData({ ...settlementFormData, netPaid: Number(e.target.value) })} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-white/30">Transaction Reference/ID</label>
              <Input className="bg-white/5 border-white/10 rounded-xl" value={settlementFormData.transactionRef} onChange={e => setSettlementFormData({ ...settlementFormData, transactionRef: e.target.value })} placeholder="UTR / Txn code..." />
            </div>
            <Button onClick={handleSaveSettlement} className="w-full bg-kashmir-gold text-black hover:bg-amber-500 font-black h-12 rounded-xl mt-4" disabled={savingSettlement}>
              Disburse & Settle Partner
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
