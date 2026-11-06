import { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Eye, 
  Star, 
  Loader2, 
  MapPin, 
  BedDouble, 
  CheckCircle2, 
  Save, 
  Image as ImageIcon, 
  Sparkles, 
  Wrench, 
  Shield, 
  Check, 
  X, 
  FileText, 
  AlertTriangle, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Landmark, 
  Activity,
  Phone,
  Mail,
  MessageSquare,
  PhoneCall,
  Search,
  Filter,
  Download,
  LayoutGrid,
  List,
  RefreshCw,
  Building,
  Calendar,
  CheckSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
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
  rating: 4.6,
  reviewCount: 18,
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
  
  // Navigation & Role simulation
  const [currentTab, setCurrentTab] = useState<'operations' | 'registry' | 'rooms' | 'housekeeping' | 'settlements' | 'analytics'>('operations');
  const [activeRole, setActiveRole] = useState<'Director' | 'Operations Manager' | 'Hotel Partner' | 'Finance' | 'Support'>('Director');

  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  // Operational Lists
  const [roomCategories, setRoomCategories] = useState<any[]>([]);
  const [hotelRooms, setHotelRooms] = useState<any[]>([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState<any[]>([]);
  const [settlements, setSettlements] = useState<any[]>([]);
  const [selectedHotelId, setSelectedHotelId] = useState<string>('');

  // Registry Search & Filter States
  const [registryViewMode, setRegistryViewMode] = useState<'grid' | 'table'>('grid');
  const [registrySearch, setRegistrySearch] = useState('');
  const [registryLocationFilter, setRegistryLocationFilter] = useState('all');
  const [registryStarFilter, setRegistryStarFilter] = useState('all');

  // Selected Hotel for Dossier
  const [dossierHotel, setDossierHotel] = useState<Hotel | null>(null);

  // Commission Hotel Dialog configurations
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTab, setDialogTab] = useState<'basic' | 'crm'>('basic');
  const [editingHotel, setEditingHotel] = useState<Hotel | null>(null);
  const [formData, setFormData] = useState(defaultHotel);
  const [amenitiesInput, setAmenitiesInput] = useState('');
  const [roomTypesInput, setRoomTypesInput] = useState('');
  const [saving, setSaving] = useState(false);

  // Sub-dialogs
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

  // Delete Alert
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // Hotels Hero config states & modal
  const [heroDialogOpen, setHeroDialogOpen] = useState(false);
  const [heroTitle, setHeroTitle] = useState('Luxury Stays in Kashmir');
  const [heroSubtitle, setHeroSubtitle] = useState('From lakeside houseboats to cozy mountain retreats, find your perfect stay.');
  const [heroImage, setHeroImage] = useState('https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1600');
  const [savingHero, setSavingHero] = useState(false);

  useEffect(() => {
    fetchAllData();
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

  // Real-time system event listener
  useEffect(() => {
    const latestEvent = systemEvents[0];
    if (latestEvent) {
      if (latestEvent.booking && latestEvent.booking.entityType === 'hotel') {
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

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([fetchHotels(), fetchDashboardKpi(), fetchHeroData()]);
    setLoading(false);
  };

  const handleSyncAll = async () => {
    setRefreshing(true);
    await Promise.all([fetchHotels(), fetchDashboardKpi()]);
    if (selectedHotelId) await fetchOperationalData(selectedHotelId);
    setRefreshing(false);
    toast.success('Hospitality desk synchronized');
  };

  const fetchDashboardKpi = async () => {
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
      console.error('[CMSHotels] KPI error:', error);
    }
  };

  const fetchOperationalData = async (hotelId: string) => {
    if (!hotelId) return;
    const token = localStorage.getItem('teamToken');
    try {
      const [rcRes, prRes, mlRes, sRes] = await Promise.all([
        fetch(`${API_BASE_URL}/hotels/operations/categories?hotelId=${hotelId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/hotels/operations/rooms?hotelId=${hotelId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/hotels/operations/maintenance?hotelId=${hotelId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/hotels/operations/settlements?hotelId=${hotelId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (rcRes.ok) setRoomCategories(await rcRes.json());
      if (prRes.ok) setHotelRooms(await prRes.json());
      if (mlRes.ok) setMaintenanceLogs(await mlRes.json());
      if (sRes.ok) setSettlements(await sRes.json());
    } catch (e) {
      console.error('[CMSHotels] Operational data error:', e);
    }
  };

  const fetchHotels = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/hotels?all=true`);
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        const sanitized = data.map((hotel: any) => ({
          ...hotel,
          amenities: typeof hotel.amenities === 'string' ? JSON.parse(hotel.amenities) : (Array.isArray(hotel.amenities) ? hotel.amenities : []),
          roomTypes: typeof hotel.roomTypes === 'string' ? JSON.parse(hotel.roomTypes) : (Array.isArray(hotel.roomTypes) ? hotel.roomTypes : [])
        }));
        setHotels(sanitized);
      } else {
        setHotels([]);
      }
    } catch (error: any) {
      console.error('[CMSHotels] Fetch hotels error:', error);
      toast.error(`Failed to load hotels: ${error.message || 'Unknown error'}`);
    }
  };

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
      console.error('[CMSHotels] Hero error:', error);
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
        toast.success('Hotels hero banner updated in real-time!');
        setHeroDialogOpen(false);
      } else {
        throw new Error('Failed to save to server');
      }
    } catch (error: any) {
      toast.error('Failed to save hero settings');
    } finally {
      setSavingHero(false);
    }
  };

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
      amenities: amenitiesInput.split('\n').map(s => s.trim()).filter(Boolean),
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
        toast.success(editingHotel ? 'Property updated' : 'New property commissioned');
        setDialogOpen(false);
        fetchHotels();
      } else {
        const errData = await response.json().catch(() => ({}));
        toast.error(errData.error || `Commissioning failed (${response.status})`);
      }
    } catch (error: any) {
      toast.error(`System connection error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const token = localStorage.getItem('teamToken');
    try {
      const response = await fetch(`${API_BASE_URL}/hotels/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        toast.success('Property decommissioned');
        setDeleteConfirmOpen(false);
        setItemToDelete(null);
        if (dossierHotel?.id === id) setDossierHotel(null);
        fetchHotels();
      } else {
        toast.error('Decommissioning failed');
      }
    } catch (error: any) {
      toast.error(`System connection error: ${error.message}`);
    }
  };

  const toggleActive = async (hotel: Hotel) => {
    const token = localStorage.getItem('teamToken');
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
        toast.success(`${hotel.name} is now ${!hotel.isActive ? 'Active' : 'Offline'}`);
        fetchHotels();
      } else {
        toast.error('Failed to toggle status');
      }
    } catch (error: any) {
      toast.error('Failed to toggle status');
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

  // Filtered Hotels in Registry
  const filteredHotels = useMemo(() => {
    return hotels.filter(h => {
      const matchSearch = 
        h.name.toLowerCase().includes(registrySearch.toLowerCase()) ||
        h.location.toLowerCase().includes(registrySearch.toLowerCase()) ||
        (h.contactName && h.contactName.toLowerCase().includes(registrySearch.toLowerCase())) ||
        (h.contactPhone && h.contactPhone.includes(registrySearch));

      if (!matchSearch) return false;

      if (registryLocationFilter !== 'all' && !h.location.toLowerCase().includes(registryLocationFilter.toLowerCase())) {
        return false;
      }

      if (registryStarFilter !== 'all' && h.starRating.toString() !== registryStarFilter) {
        return false;
      }

      return true;
    });
  }, [hotels, registrySearch, registryLocationFilter, registryStarFilter]);

  // Export Hotels to CSV
  const exportHotelsCSV = () => {
    const headers = ['Hotel Name', 'Location', 'Star Rating', 'Price / Night (INR)', 'Rating', 'Contact Name', 'Contact Email', 'Contact Phone', 'Payment Terms', 'Commission', 'Status'];
    const rows = filteredHotels.map(h => [
      `"${h.name}"`,
      `"${h.location}"`,
      h.starRating,
      h.pricePerNight,
      h.rating,
      `"${h.contactName || ''}"`,
      `"${h.contactEmail || ''}"`,
      `"${h.contactPhone || ''}"`,
      `"${h.paymentTerms || ''}"`,
      `"${h.commissionStructure || ''}"`,
      h.isActive ? 'Active' : 'Offline'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `kashmir_curators_hotels_registry_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Hotel Registry exported to CSV');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Top Header Command Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-gradient-to-r from-amber-500/[0.04] via-transparent to-transparent p-6 rounded-3xl border border-white/5 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-[10px] font-black uppercase tracking-[0.25em] mb-1">
            <Building className="w-3.5 h-3.5" />
            <span>Hospitality CRM & Accommodation Management</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-display font-bold text-white tracking-tight">
            Hotels & Resorts CMS
          </h1>
          <p className="text-xs text-white/50 mt-1">
            Luxury houseboats, alpine ski chalets, boutique properties & live room inventory operations.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {/* Hotel selector */}
          {hotels.length > 0 && (
            <div className="flex items-center bg-black/40 border border-white/10 rounded-xl px-3 h-10">
              <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest mr-2 shrink-0">Property:</span>
              <select
                value={selectedHotelId}
                onChange={(e) => setSelectedHotelId(e.target.value)}
                className="bg-transparent text-white text-xs font-bold focus:outline-none max-w-[160px] truncate"
              >
                {hotels.map(h => (
                  <option key={h.id} value={h.id} className="bg-[#090e13]">{h.name}</option>
                ))}
              </select>
            </div>
          )}

          <Button
            onClick={handleSyncAll}
            variant="outline"
            disabled={refreshing}
            className="h-10 px-3.5 rounded-xl bg-white/5 hover:bg-white/10 border-white/10 text-white/80 text-xs font-bold gap-2"
            title="Synchronize Hospitality Data"
          >
            <RefreshCw className={cn("w-3.5 h-3.5 text-amber-400", refreshing && "animate-spin")} />
            <span className="hidden sm:inline">Sync</span>
          </Button>

          <Button
            onClick={() => setHeroDialogOpen(true)}
            variant="outline"
            className="h-10 px-3.5 rounded-xl bg-white/5 hover:bg-white/10 border-white/10 text-white/80 text-xs font-bold gap-2"
            title="Configure Public Hotels Hero Banner"
          >
            <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Hero Banner</span>
          </Button>

          <Button
            onClick={exportHotelsCSV}
            variant="outline"
            className="h-10 px-3.5 rounded-xl bg-white/5 hover:bg-white/10 border-white/10 text-white/80 text-xs font-bold gap-2"
            title="Export CSV Registry"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>

          <Button 
            onClick={openCreateDialog}
            className="h-10 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-wider text-[11px] px-5 shadow-lg shadow-amber-500/15 gap-2"
          >
            <Plus className="w-3.5 h-3.5" /> 
            <span>Commission Property</span>
          </Button>
        </div>
      </div>

      {/* Modern Executive Telemetry Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3.5">
        {[
          { label: 'Occupancy Rate', value: `${kpi.occupancyRate}%`, color: 'text-amber-400', desc: 'Active rooms booked' },
          { label: "Today's Check-Ins", value: kpi.todayCheckIns, color: 'text-white', desc: 'Arriving guests' },
          { label: "Today's Check-Outs", value: kpi.todayCheckOuts, color: 'text-white/80', desc: 'Departing guests' },
          { label: 'Room Inventory', value: `${kpi.occupiedRooms} / ${kpi.availableRooms + kpi.occupiedRooms}`, color: 'text-emerald-400', desc: 'Occupied vs Total' },
          { label: 'Monthly Revenue', value: `₹${(kpi.monthlyRevenue || 0).toLocaleString()}`, color: 'text-amber-300', desc: 'Hospitality volume' },
          { label: 'Service Alerts', value: kpi.alertsCount || 0, color: (kpi.alertsCount > 0 ? 'text-rose-400' : 'text-white/40'), desc: 'Maintenance tickets' }
        ].map(card => (
          <div key={card.label} className="p-4 rounded-2xl bg-[#090e13]/90 border border-white/5 hover:border-white/10 transition-all flex flex-col justify-between shadow-lg">
            <span className="text-[8px] font-black uppercase text-white/40 tracking-wider block">{card.label}</span>
            <span className={cn("text-xl lg:text-2xl font-display font-bold mt-1.5", card.color)}>{card.value}</span>
            <span className="text-[9px] text-white/30 block mt-1">{card.desc}</span>
          </div>
        ))}
      </div>

      {/* Main Command Tabs Switcher */}
      <div className="flex bg-[#090e13]/90 border border-white/5 p-1 rounded-2xl overflow-x-auto custom-scrollbar shadow-lg">
        {[
          { id: 'operations', label: 'Operations Desk', icon: Activity },
          { id: 'registry', label: `Property Registry (${hotels.length})`, icon: Landmark },
          { id: 'rooms', label: 'Room Inventory', icon: BedDouble },
          { id: 'housekeeping', label: `Housekeeping (${maintenanceLogs.length})`, icon: Wrench },
          { id: 'settlements', label: 'Settlements & Payouts', icon: DollarSign },
          { id: 'analytics', label: 'Analytics Console', icon: TrendingUp }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 shrink-0",
                currentTab === tab.id 
                  ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20 font-black"
                  : "text-white/50 hover:text-white"
              )}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OPERATIONS DESK */}
      {currentTab === 'operations' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Live Room Status Grid */}
            <div className="lg:col-span-8 bg-[#090e13]/90 border border-white/5 rounded-3xl p-6 shadow-xl space-y-5">
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <div>
                  <h3 className="text-xl font-display font-bold text-white tracking-tight">Live Room Status Grid</h3>
                  <p className="text-xs text-white/40 mt-0.5">Real-time room occupancy, floor map, and housekeeping audit</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] uppercase font-bold text-white/50">Live Floor Sensor</span>
                </div>
              </div>

              {hotelRooms.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
                  <BedDouble className="w-10 h-10 text-white/20 mx-auto mb-2" />
                  <p className="text-white/40 text-xs font-bold uppercase tracking-wider">
                    No physical rooms registered for this property yet.
                  </p>
                  <Button onClick={() => setRoomDialogOpen(true)} className="mt-3 bg-amber-500 text-black text-xs font-bold h-9 rounded-xl">
                    + Add First Room
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
                  {hotelRooms.map(room => (
                    <div 
                      key={room.id} 
                      className="bg-black/40 border border-white/10 hover:border-amber-500/30 p-4 rounded-2xl space-y-2.5 relative overflow-hidden group transition-all"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-sm font-bold text-white font-mono">{room.roomNumber}</span>
                          <span className="block text-[9px] text-white/40 uppercase font-bold">{room.floor || '1st Floor'}</span>
                        </div>
                        <Badge className={cn("border-none text-[8px] px-2 py-0.5 font-bold uppercase",
                          room.status === 'AVAILABLE' ? 'bg-emerald-500/15 text-emerald-400' :
                          room.status === 'OCCUPIED' ? 'bg-rose-500/15 text-rose-400' : 'bg-amber-500/15 text-amber-400'
                        )}>
                          {room.status}
                        </Badge>
                      </div>

                      <div className="flex justify-between items-center text-[10px] border-t border-white/5 pt-2">
                        <span className="text-white/40">Cleanliness:</span>
                        <span className={cn("font-bold uppercase",
                          room.housekeeping === 'CLEAN' ? 'text-emerald-400' :
                          room.housekeeping === 'INSPECTED' ? 'text-amber-400' : 'text-rose-400'
                        )}>
                          {room.housekeeping}
                        </span>
                      </div>

                      {/* Interactive Hover Operator Actions */}
                      <div className="absolute inset-0 bg-[#090e13]/95 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-center items-center gap-1.5 p-3 z-10">
                        <span className="text-[9px] font-black uppercase text-amber-400 tracking-wider">Room {room.roomNumber}</span>
                        <div className="flex gap-1.5 w-full">
                          <Button size="sm" variant="outline" className="flex-1 text-[8px] h-7 bg-white/5 border-white/10 text-white" onClick={() => handleUpdateRoomStatus(room.id, room.status === 'AVAILABLE' ? 'OCCUPIED' : 'AVAILABLE')}>
                            {room.status === 'AVAILABLE' ? 'Check-In' : 'Check-Out'}
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1 text-[8px] h-7 bg-white/5 border-white/10 text-white" onClick={() => handleUpdateRoomHousekeeping(room.id, room.housekeeping === 'CLEAN' ? 'DIRTY' : 'CLEAN')}>
                            {room.housekeeping === 'CLEAN' ? 'Mark Dirty' : 'Mark Clean'}
                          </Button>
                        </div>
                        <button className="text-[9px] text-rose-400 hover:text-rose-300 font-bold" onClick={() => handleDeleteRoom(room.id)}>
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AI Room Allocator suggestions & Quick Actions */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-[#090e13]/90 border border-white/5 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                <div className="flex items-center gap-2 mb-2 text-amber-400">
                  <Sparkles className="w-4 h-4 animate-pulse" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                    Smart Allocator Suggestions
                  </h3>
                </div>
                <p className="text-xs text-white/40 mb-4">
                  Match pending guest reservations with optimal room inventories.
                </p>

                <div className="space-y-3">
                  <div className="p-3.5 bg-white/[0.02] border border-white/5 rounded-xl space-y-2 text-xs">
                    <span className="text-[9px] font-black uppercase text-amber-400 block tracking-wider">
                      Recommended Matches:
                    </span>
                    <p className="text-white/80 leading-relaxed text-[11px]">
                      • Room 204 (Deluxe Chalet) matches Guest Shabir Ahmad (Couple, Honeymoon request)
                    </p>
                    <p className="text-white/80 leading-relaxed text-[11px]">
                      • Room 108 (Heritage Suite) matches Tariq Mir (Single traveler, early check-in)
                    </p>
                  </div>

                  <Button className="w-full bg-amber-500 hover:bg-amber-400 text-black text-xs font-black uppercase tracking-wider h-11 rounded-xl shadow-lg">
                    Auto-Allocate Recommended Rooms
                  </Button>
                </div>
              </div>

              {/* Operations Quick Actions */}
              <div className="bg-[#090e13]/90 border border-white/5 rounded-3xl p-6 shadow-xl space-y-3">
                <h4 className="text-xs font-black uppercase tracking-widest text-white/40">Quick Operations</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={() => setRoomDialogOpen(true)} variant="outline" className="h-10 bg-white/5 border-white/10 text-white text-xs rounded-xl">
                    + Add Room
                  </Button>
                  <Button onClick={() => setMaintenanceDialogOpen(true)} variant="outline" className="h-10 bg-white/5 border-white/10 text-white text-xs rounded-xl">
                    + Log Repair
                  </Button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 2: PROPERTY REGISTRY */}
      {currentTab === 'registry' && (
        <div className="space-y-6">
          
          {/* Registry Controls */}
          <div className="bg-[#090e13]/90 border border-white/5 rounded-3xl p-5 shadow-xl space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              {/* Search */}
              <div className="md:col-span-5 relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <Input
                  placeholder="Search by hotel name, location, contact..."
                  value={registrySearch}
                  onChange={(e) => setRegistrySearch(e.target.value)}
                  className="pl-10 pr-9 bg-white/5 border-white/10 rounded-xl h-11 text-xs text-white placeholder:text-white/30 focus:border-amber-400"
                />
                {registrySearch && (
                  <button onClick={() => setRegistrySearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Location Filter */}
              <div className="md:col-span-3">
                <select
                  value={registryLocationFilter}
                  onChange={(e) => setRegistryLocationFilter(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl h-11 px-3 text-xs text-white/80 focus:border-amber-400 focus:outline-none"
                >
                  <option value="all" className="bg-[#090e13]">All Locations</option>
                  <option value="srinagar" className="bg-[#090e13]">Srinagar</option>
                  <option value="dal lake" className="bg-[#090e13]">Dal Lake (Houseboats)</option>
                  <option value="gulmarg" className="bg-[#090e13]">Gulmarg</option>
                  <option value="pahalgam" className="bg-[#090e13]">Pahalgam</option>
                  <option value="sonmarg" className="bg-[#090e13]">Sonmarg</option>
                </select>
              </div>

              {/* Star Rating Filter */}
              <div className="md:col-span-2">
                <select
                  value={registryStarFilter}
                  onChange={(e) => setRegistryStarFilter(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl h-11 px-3 text-xs text-white/80 focus:border-amber-400 focus:outline-none"
                >
                  <option value="all" className="bg-[#090e13]">All Grades</option>
                  <option value="5" className="bg-[#090e13]">5-Star Luxury</option>
                  <option value="4" className="bg-[#090e13]">4-Star Premium</option>
                  <option value="3" className="bg-[#090e13]">3-Star Comfort</option>
                </select>
              </div>

              {/* View Switcher */}
              <div className="md:col-span-2 flex justify-end">
                <div className="flex items-center bg-black/40 border border-white/10 p-1 rounded-xl">
                  <button
                    onClick={() => setRegistryViewMode('grid')}
                    className={cn(
                      "p-2 rounded-lg text-xs transition-colors",
                      registryViewMode === 'grid' ? "bg-amber-500/20 text-amber-400" : "text-white/40 hover:text-white"
                    )}
                    title="Grid Cards"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setRegistryViewMode('table')}
                    className={cn(
                      "p-2 rounded-lg text-xs transition-colors",
                      registryViewMode === 'table' ? "bg-amber-500/20 text-amber-400" : "text-white/40 hover:text-white"
                    )}
                    title="Dense Table"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Hotels Grid or Table */}
          {filteredHotels.length === 0 ? (
            <div className="py-20 text-center border border-dashed border-white/10 rounded-3xl bg-white/[0.01]">
              <Building className="w-10 h-10 text-white/20 mx-auto mb-3" />
              <p className="text-white/40 text-xs font-bold uppercase tracking-wider">
                No hotels found matching your search criteria.
              </p>
            </div>
          ) : registryViewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredHotels.map(hotel => (
                <div
                  key={hotel.id}
                  className="rounded-2xl bg-[#090e13]/90 border border-white/5 hover:border-amber-500/30 transition-all duration-300 group flex flex-col justify-between overflow-hidden shadow-xl"
                >
                  <div>
                    {/* Image Banner */}
                    <div className="relative aspect-[16/10] overflow-hidden bg-white/5">
                      {hotel.imageUrl ? (
                        <img src={hotel.imageUrl} alt={hotel.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-500/10 to-transparent">
                          <BedDouble className="w-12 h-12 text-amber-400/40" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                      {/* Grade stars overlay */}
                      <div className="absolute top-3 left-3 flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-lg border border-white/10">
                        {[...Array(hotel.starRating || 4)].map((_, i) => (
                          <Star key={i} className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                        ))}
                      </div>

                      {/* Status toggle */}
                      <div className="absolute top-3 right-3">
                        <button onClick={() => toggleActive(hotel)}>
                          <Badge className={cn(
                            "text-[8px] font-black uppercase tracking-wider px-2 py-0.5 border cursor-pointer",
                            hotel.isActive ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-rose-500/20 text-rose-400 border-rose-500/30"
                          )}>
                            {hotel.isActive ? 'Active' : 'Offline'}
                          </Badge>
                        </button>
                      </div>

                      {/* Location & Rating */}
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1 text-white/90 font-bold bg-black/40 backdrop-blur-md px-2 py-1 rounded-md">
                          <MapPin className="w-3 h-3 text-amber-400" />
                          {hotel.location}
                        </span>
                        <span className="flex items-center gap-1 text-amber-300 font-bold bg-black/40 backdrop-blur-md px-2 py-1 rounded-md text-[10px]">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          {hotel.rating} ({hotel.reviewCount})
                        </span>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="p-5 space-y-3">
                      <div>
                        <h3 className="font-bold text-white text-base group-hover:text-amber-400 transition-colors line-clamp-1">
                          {hotel.name}
                        </h3>
                        {hotel.description && (
                          <p className="text-xs text-white/50 line-clamp-2 mt-1">
                            {hotel.description}
                          </p>
                        )}
                      </div>

                      {/* Contact Info Strip */}
                      <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-white/60 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="truncate flex items-center gap-1.5">
                            <Users className="w-3 h-3 text-amber-400 shrink-0" />
                            {hotel.contactName || 'Manager N/A'}
                          </span>
                          {hotel.contactPhone && (
                            <div className="flex items-center gap-1 shrink-0">
                              <a
                                href={`https://wa.me/${hotel.contactPhone.replace(/[^0-9]/g, '')}?text=Hello%20from%20Kashmir%20Curators%20HQ.`}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 text-[10px] font-bold flex items-center gap-1 border border-emerald-500/20"
                              >
                                <MessageSquare className="w-2.5 h-2.5" /> WhatsApp
                              </a>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Pricing */}
                      <div className="flex items-baseline justify-between pt-2 border-t border-white/5">
                        <div>
                          <span className="text-[8px] font-black uppercase tracking-wider text-white/40 block">Starting Tariff</span>
                          <span className="text-xl font-mono font-bold text-amber-400">₹{hotel.pricePerNight.toLocaleString()}</span>
                          <span className="text-[9px] text-white/30 ml-1">/ night</span>
                        </div>
                        <Badge variant="outline" className="border-white/10 text-white/60 text-[9px]">
                          {hotel.roomTypes?.length || 0} Room Types
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-5 pt-0 flex items-center gap-2">
                    <Button
                      onClick={() => setDossierHotel(hotel)}
                      variant="outline"
                      className="flex-1 h-9 rounded-xl bg-white/5 hover:bg-white/10 border-white/10 text-white/90 text-[10px] font-black uppercase tracking-wider gap-1.5"
                    >
                      <Eye className="w-3 h-3 text-amber-400" />
                      <span>Property Dossier</span>
                    </Button>
                    <Button
                      onClick={() => openEditDialog(hotel)}
                      variant="outline"
                      className="h-9 px-3 rounded-xl bg-white/5 hover:bg-white/10 border-white/10 text-white/80"
                      title="Edit Property"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <button
                      onClick={() => {
                        setItemToDelete(hotel.id);
                        setDeleteConfirmOpen(true);
                      }}
                      className="w-9 h-9 rounded-xl bg-rose-500/10 hover:bg-rose-500 hover:text-white border border-rose-500/20 flex items-center justify-center text-rose-400 transition-all shrink-0"
                      title="Decommission Property"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Dense Table View */
            <div className="bg-[#090e13]/90 border border-white/5 rounded-3xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto custom-scrollbar">
                <Table>
                  <TableHeader className="bg-white/[0.02] border-b border-white/5">
                    <TableRow className="border-none text-[9px] font-black uppercase tracking-widest text-white/40">
                      <TableHead className="py-4 px-6 text-white/40">Property Node</TableHead>
                      <TableHead className="py-4 px-4 text-white/40">Location</TableHead>
                      <TableHead className="py-4 px-4 text-white/40">Star Grade</TableHead>
                      <TableHead className="py-4 px-4 text-white/40 text-right">Tariff / Night</TableHead>
                      <TableHead className="py-4 px-4 text-white/40">Contact / Supplier</TableHead>
                      <TableHead className="py-4 px-4 text-white/40 text-center">Status</TableHead>
                      <TableHead className="py-4 px-6 text-white/40 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-white/5">
                    {filteredHotels.map(h => (
                      <TableRow key={h.id} className="hover:bg-white/[0.02] transition-colors cursor-pointer border-none" onClick={() => setDossierHotel(h)}>
                        <TableCell className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-white/5 overflow-hidden border border-white/10 shrink-0">
                              {h.imageUrl ? (
                                <img src={h.imageUrl} alt={h.name} className="w-full h-full object-cover" />
                              ) : (
                                <BedDouble className="w-5 h-5 text-amber-400 m-3" />
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-white text-sm">{h.name}</p>
                              <p className="text-[10px] text-white/40 font-mono">REF: #{h.id.slice(0, 8)}</p>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="py-4 px-4">
                          <span className="flex items-center gap-1.5 text-xs text-white/80">
                            <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                            {h.location}
                          </span>
                        </TableCell>

                        <TableCell className="py-4 px-4">
                          <div className="flex items-center gap-0.5">
                            {[...Array(h.starRating || 4)].map((_, i) => (
                              <Star key={i} className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                            ))}
                          </div>
                        </TableCell>

                        <TableCell className="py-4 px-4 text-right font-mono font-bold text-amber-400">
                          ₹{h.pricePerNight.toLocaleString()}
                        </TableCell>

                        <TableCell className="py-4 px-4 text-xs text-white/60">
                          <p className="font-bold text-white/80">{h.contactName || 'Manager N/A'}</p>
                          <p className="text-[10px] text-white/40">{h.contactPhone || 'No Phone'}</p>
                        </TableCell>

                        <TableCell className="py-4 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => toggleActive(h)}>
                            <Badge className={cn("text-[8px] font-black uppercase tracking-wider px-2 py-0.5 border cursor-pointer",
                              h.isActive ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : "bg-rose-500/15 text-rose-400 border-rose-500/30"
                            )}>
                              {h.isActive ? 'Active' : 'Offline'}
                            </Badge>
                          </button>
                        </TableCell>

                        <TableCell className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button onClick={() => setDossierHotel(h)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white" title="View Dossier">
                              <Eye className="w-3.5 h-3.5 text-amber-400" />
                            </button>
                            <button onClick={() => openEditDialog(h)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white" title="Edit">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => { setItemToDelete(h.id); setDeleteConfirmOpen(true); }} className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-400" title="Delete">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ROOM MANAGER */}
      {currentTab === 'rooms' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#090e13]/90 border border-white/5 rounded-3xl p-6 shadow-xl">
            <div>
              <h3 className="text-xl font-display font-bold text-white tracking-tight">Room Inventory & Categories</h3>
              <p className="text-xs text-white/40 mt-0.5">Manage room tiers, base rates, seasonal capacity & physical room keys</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setCategoryDialogOpen(true)} variant="outline" className="h-10 bg-white/5 border-white/10 text-white text-xs rounded-xl font-bold">
                <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Category
              </Button>
              <Button onClick={() => setRoomDialogOpen(true)} className="h-10 bg-amber-500 hover:bg-amber-400 text-black text-xs font-black uppercase tracking-wider rounded-xl">
                <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Physical Room
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {roomCategories.map(cat => (
              <div key={cat.id} className="p-5 rounded-2xl bg-[#090e13]/90 border border-white/5 shadow-xl space-y-3 relative group">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-white text-sm">{cat.name}</h4>
                  <Badge variant="outline" className="border-white/10 text-white/60 text-[9px]">
                    Max {cat.capacity || 2} Pax
                  </Badge>
                </div>
                <div className="border-t border-b border-white/5 py-2.5">
                  <span className="text-[8px] font-black uppercase tracking-wider text-white/40 block">Base Nightly Rate</span>
                  <span className="text-lg font-mono font-bold text-amber-400">₹{cat.basePrice.toLocaleString()}</span>
                </div>
                <p className="text-xs text-white/50 line-clamp-2">
                  {JSON.parse(cat.amenities || '[]').join(', ') || 'Standard room amenities'}
                </p>
                <button
                  onClick={() => handleDeleteCategory(cat.id)}
                  className="w-full text-center text-[10px] text-rose-400 hover:text-rose-300 font-bold uppercase tracking-wider pt-2 border-t border-white/5"
                >
                  Remove Category
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: HOUSEKEEPING & REPAIRS */}
      {currentTab === 'housekeeping' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-[#090e13]/90 border border-white/5 rounded-3xl p-6 shadow-xl">
            <div>
              <h3 className="text-xl font-display font-bold text-white tracking-tight">Housekeeping & Maintenance</h3>
              <p className="text-xs text-white/40 mt-0.5">Track repair tickets, room cleanliness audits & service logs</p>
            </div>
            <Button onClick={() => setMaintenanceDialogOpen(true)} className="h-10 bg-amber-500 hover:bg-amber-400 text-black text-xs font-black uppercase tracking-wider rounded-xl">
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Log Repair Ticket
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {maintenanceLogs.map(log => (
              <div key={log.id} className="p-5 rounded-2xl bg-[#090e13]/90 border border-white/5 shadow-xl space-y-3 relative group">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/30 block">Room Node</span>
                    <h4 className="font-bold text-white text-base">Room {log.roomNumber}</h4>
                  </div>
                  <Badge className={cn("border-none text-[8px] uppercase font-bold",
                    log.status === 'PENDING' ? 'bg-rose-500/15 text-rose-400' :
                    log.status === 'IN_PROGRESS' ? 'bg-amber-500/15 text-amber-400' : 'bg-emerald-500/15 text-emerald-400'
                  )}>
                    {log.status}
                  </Badge>
                </div>
                <p className="text-xs text-white/80 font-medium">{log.task}</p>
                <div className="flex justify-between items-center border-t border-white/5 pt-2 text-xs">
                  <span className="text-white/40">Cost: <strong className="text-emerald-400 font-mono">₹{log.cost.toLocaleString()}</strong></span>
                  <span className="text-white/40">Priority: <strong className="text-white">{log.priority}</strong></span>
                </div>
                {log.status !== 'RESOLVED' && (
                  <Button size="sm" onClick={() => handleResolveMaintenance(log.id)} className="w-full bg-emerald-500 hover:bg-emerald-600 text-black text-xs font-bold h-9 rounded-xl">
                    Mark Issue Resolved
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: SETTLEMENTS & PAYOUTS */}
      {currentTab === 'settlements' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-[#090e13]/90 border border-white/5 rounded-3xl p-6 shadow-xl">
            <div>
              <h3 className="text-xl font-display font-bold text-white tracking-tight">Settlements & Payouts</h3>
              <p className="text-xs text-white/40 mt-0.5">Manage partner net disbursements, transaction IDs & commission dues</p>
            </div>
            <Button onClick={() => setSettlementDialogOpen(true)} className="h-10 bg-amber-500 hover:bg-amber-400 text-black text-xs font-black uppercase tracking-wider rounded-xl">
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Log Partner Settlement
            </Button>
          </div>

          <div className="bg-[#090e13]/90 border border-white/5 rounded-3xl overflow-hidden shadow-xl">
            <Table>
              <TableHeader className="bg-white/[0.02] border-b border-white/5">
                <TableRow className="border-none text-[9px] font-black uppercase tracking-widest text-white/40">
                  <TableHead className="py-4 px-6 text-white/40">Settlement ID</TableHead>
                  <TableHead className="py-4 px-4 text-white/40">Gross Amount</TableHead>
                  <TableHead className="py-4 px-4 text-white/40">Commission Dues</TableHead>
                  <TableHead className="py-4 px-4 text-white/40">Net Disbursed</TableHead>
                  <TableHead className="py-4 px-4 text-white/40">Payout Date</TableHead>
                  <TableHead className="py-4 px-6 text-white/40 text-right">Transaction Ref</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-white/5">
                {settlements.map(set => (
                  <TableRow key={set.id} className="hover:bg-white/[0.02] transition-colors border-none text-xs">
                    <TableCell className="py-4 px-6 font-mono font-bold text-white">{set.id.slice(0, 8)}</TableCell>
                    <TableCell className="py-4 px-4 text-white/70">₹{set.amount.toLocaleString()}</TableCell>
                    <TableCell className="py-4 px-4 text-rose-400 font-semibold">₹{set.commissionDues.toLocaleString()}</TableCell>
                    <TableCell className="py-4 px-4 text-emerald-400 font-mono font-bold">₹{set.netPaid.toLocaleString()}</TableCell>
                    <TableCell className="py-4 px-4 text-white/40">{new Date(set.payoutDate).toLocaleDateString()}</TableCell>
                    <TableCell className="py-4 px-6 text-right font-mono text-white/40">{set.transactionRef || 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* TAB 6: ANALYTICS CONSOLE */}
      {currentTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { label: 'RevPAR (Revenue Per Room)', value: `₹${(kpi.revenueToday / (kpi.availableRooms || 1)).toFixed(0)}`, desc: 'Average based on occupied units' },
              { label: 'ADR (Average Daily Rate)', value: '₹5,800', desc: 'Average rate for active room categories' },
              { label: 'Net Operations Margin', value: `₹${(kpi.monthlyRevenue - kpi.commissionDue).toLocaleString()}`, desc: 'Excluding agency commissions' }
            ].map(card => (
              <div key={card.label} className="p-6 rounded-2xl bg-[#090e13]/90 border border-white/5 shadow-xl">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/40">{card.label}</p>
                <p className="text-3xl font-display font-bold mt-2 text-amber-400">{card.value}</p>
                <span className="text-[10px] text-white/30 block mt-1">{card.desc}</span>
              </div>
            ))}
          </div>

          <div className="p-6 rounded-3xl bg-[#090e13]/90 border border-white/5 shadow-xl">
            <h3 className="text-lg font-display font-bold text-white mb-6">Hospitality Occupancy Trend (12 Months)</h3>
            <div className="h-56 w-full bg-white/[0.02] border border-white/5 rounded-2xl flex items-end p-6 gap-2">
              {[60, 68, 72, 70, 75, 80, 85, 78, 80, 92, 85, 88].map((percent, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full bg-amber-500 rounded-t" style={{ height: `${percent}%` }} />
                  <span className="text-[9px] text-white/30 uppercase font-bold">M{idx + 1}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* HOTEL DOSSIER MODAL */}
      {dossierHotel && (
        <Dialog open={!!dossierHotel} onOpenChange={() => setDossierHotel(null)}>
          <DialogContent className="max-w-2xl bg-[#090e13]/98 border border-white/10 text-white rounded-3xl p-8 max-h-[90vh] overflow-y-auto custom-scrollbar backdrop-blur-2xl">
            <div className="relative aspect-[21/9] rounded-2xl overflow-hidden mb-6 border border-white/10">
              {dossierHotel.imageUrl ? (
                <img src={dossierHotel.imageUrl} alt={dossierHotel.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-white/5">
                  <BedDouble className="w-12 h-12 text-amber-400/40" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    {[...Array(dossierHotel.starRating || 4)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <h2 className="text-2xl font-display font-bold text-white">{dossierHotel.name}</h2>
                  <p className="text-xs text-white/60 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-amber-400" />
                    {dossierHotel.location}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-black uppercase text-white/40 block">Starting Tariff</span>
                  <span className="text-xl font-mono font-bold text-amber-400">₹{dossierHotel.pricePerNight.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="space-y-5 text-left text-xs">
              {dossierHotel.description && (
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Property Introduction</h4>
                  <p className="text-white/80 leading-relaxed">{dossierHotel.description}</p>
                </div>
              )}

              {/* Contact Manager Strip */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-400">B2B Partner Contact</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-white/40 text-[10px] block">Resident Manager</span>
                    <span className="font-bold text-white">{dossierHotel.contactName || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-white/40 text-[10px] block">Direct Phone</span>
                    <span className="font-bold text-white">{dossierHotel.contactPhone || 'N/A'}</span>
                  </div>
                </div>
                {dossierHotel.contactPhone && (
                  <div className="flex gap-2 pt-2">
                    <a
                      href={`https://wa.me/${dossierHotel.contactPhone.replace(/[^0-9]/g, '')}?text=Greetings%20from%20Kashmir%20Curators.`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 text-xs font-bold flex items-center gap-1 border border-emerald-500/20"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                    </a>
                    <a
                      href={`tel:${dossierHotel.contactPhone}`}
                      className="px-3 py-1.5 rounded-lg bg-white/5 text-white/80 text-xs font-bold flex items-center gap-1 border border-white/10"
                    >
                      <PhoneCall className="w-3.5 h-3.5" /> Call Partner
                    </a>
                  </div>
                )}
              </div>

              {/* Amenities */}
              {dossierHotel.amenities && dossierHotel.amenities.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Amenities & Features</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {dossierHotel.amenities.map((am, i) => (
                      <span key={i} className="text-[10px] bg-white/5 border border-white/5 px-2.5 py-1 rounded-lg text-white/80">
                        {am}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="pt-6 border-t border-white/5 flex gap-2">
              <Button variant="outline" onClick={() => setDossierHotel(null)} className="flex-1 bg-white/5 border-white/10 text-white text-xs h-11 rounded-xl">
                Close Dossier
              </Button>
              <Button onClick={() => { const h = dossierHotel; setDossierHotel(null); openEditDialog(h); }} className="flex-1 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold h-11 rounded-xl">
                Edit Property
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* COMMISSION NEW PROPERTY DIALOG */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl bg-[#090e13]/98 border border-white/10 text-white rounded-3xl p-8 max-h-[90vh] overflow-y-auto custom-scrollbar backdrop-blur-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display font-bold">
              {editingHotel ? 'Reconfigure Hospitality Node' : 'Commission New Property'}
            </DialogTitle>
            <p className="text-xs text-white/40">Configure hotel credentials, star grading, room allotments & B2B partner terms.</p>
          </DialogHeader>

          <div className="flex bg-black/40 p-1 rounded-xl border border-white/5 my-3">
            <button
              type="button"
              onClick={() => setDialogTab('basic')}
              className={cn("flex-1 py-1.5 rounded-lg text-xs font-bold transition-all", dialogTab === 'basic' ? "bg-amber-500 text-black shadow" : "text-white/50 hover:text-white")}
            >
              1. Basic Information
            </button>
            <button
              type="button"
              onClick={() => setDialogTab('crm')}
              className={cn("flex-1 py-1.5 rounded-lg text-xs font-bold transition-all", dialogTab === 'crm' ? "bg-amber-500 text-black shadow" : "text-white/50 hover:text-white")}
            >
              2. B2B Partner Contract & CRM
            </button>
          </div>

          <div className="space-y-4 py-2 text-left">
            {dialogTab === 'basic' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-1">Property Name *</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. The Grand Palace"
                      className="bg-white/5 border-white/10 rounded-xl h-11 text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-1">Geographic Location *</label>
                    <Input
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g. Srinagar, Dal Lake"
                      className="bg-white/5 border-white/10 rounded-xl h-11 text-xs"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-1">Star Grading</label>
                    <select
                      value={formData.starRating.toString()}
                      onChange={(e) => setFormData({ ...formData, starRating: Number(e.target.value) })}
                      className="w-full bg-black/40 border border-white/10 rounded-xl h-11 px-3 text-xs text-white"
                    >
                      {[1, 2, 3, 4, 5].map(n => (
                        <option key={n} value={n} className="bg-[#090e13]">{n} Star</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-1">Price / Night (₹)</label>
                    <Input
                      type="number"
                      value={formData.pricePerNight}
                      onChange={(e) => setFormData({ ...formData, pricePerNight: Number(e.target.value) })}
                      className="bg-white/5 border-white/10 rounded-xl h-11 text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-1">User Rating</label>
                    <Input
                      type="number"
                      step="0.1"
                      min="1"
                      max="5"
                      value={formData.rating}
                      onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                      className="bg-white/5 border-white/10 rounded-xl h-11 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-1">Cover Image</label>
                  <MediaPicker
                    value={formData.imageUrl || ''}
                    onChange={(url) => setFormData({ ...formData, imageUrl: url })}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-1">Editorial Description</label>
                  <Textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Provide a luxurious description of the property..."
                    rows={3}
                    className="bg-white/5 border-white/10 rounded-xl text-xs resize-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-1">Amenities (One per line)</label>
                  <Textarea
                    value={amenitiesInput}
                    onChange={(e) => setAmenitiesInput(e.target.value)}
                    placeholder="WiFi&#10;Heated Rooms&#10;Spa & Wellness&#10;Lake View"
                    rows={3}
                    className="bg-white/5 border-white/10 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-1">Official Contact Person</label>
                    <Input
                      value={formData.contactName || ''}
                      onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                      placeholder="e.g. GM, Resident Manager"
                      className="bg-white/5 border-white/10 rounded-xl h-11 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-1">Official Contact Email</label>
                    <Input
                      value={formData.contactEmail || ''}
                      onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                      placeholder="e.g. operations@grandpalace.com"
                      className="bg-white/5 border-white/10 rounded-xl h-11 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-1">Phone Contact</label>
                    <Input
                      value={formData.contactPhone || ''}
                      onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                      placeholder="e.g. +91 98765 43210"
                      className="bg-white/5 border-white/10 rounded-xl h-11 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-1">Settlement Terms</label>
                    <select
                      value={formData.paymentTerms || 'Prepayment'}
                      onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-xl h-11 px-3 text-xs text-white"
                    >
                      <option value="Prepayment" className="bg-[#090e13]">Full Prepayment</option>
                      <option value="Credit 15 Days" className="bg-[#090e13]">Credit 15 Days</option>
                      <option value="Credit 30 Days" className="bg-[#090e13]">Credit 30 Days</option>
                      <option value="On Checkout" className="bg-[#090e13]">Dues on Checkout</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-1">B2B Commission Structure</label>
                  <Input
                    value={formData.commissionStructure || ''}
                    onChange={(e) => setFormData({ ...formData, commissionStructure: e.target.value })}
                    placeholder="e.g. 15% on Gross Booking Rate"
                    className="bg-white/5 border-white/10 rounded-xl h-11 text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="pt-4 border-t border-white/5 flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="flex-1 bg-transparent border-white/10 text-white text-xs h-11 rounded-xl"
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-wider text-xs h-11 rounded-xl shadow-lg"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {editingHotel ? 'Confirm Reconfiguration' : 'Authorize Commissioning'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ADD ROOM CATEGORY DIALOG */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent className="max-w-md bg-[#090e13]/98 border border-white/10 text-white rounded-3xl p-8 backdrop-blur-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-display font-bold">Add Room Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-3 text-left">
            <div>
              <label className="text-[10px] font-black uppercase text-white/40 block mb-1">Category Name</label>
              <Input className="bg-white/5 border-white/10 rounded-xl h-11 text-xs" value={categoryFormData.name} onChange={e => setCategoryFormData({ ...categoryFormData, name: e.target.value })} placeholder="e.g. Deluxe Suite" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black uppercase text-white/40 block mb-1">Base Price (₹)</label>
                <Input type="number" className="bg-white/5 border-white/10 rounded-xl h-11 text-xs font-mono font-bold" value={categoryFormData.basePrice} onChange={e => setCategoryFormData({ ...categoryFormData, basePrice: Number(e.target.value) })} />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-white/40 block mb-1">Capacity (Pax)</label>
                <Input type="number" className="bg-white/5 border-white/10 rounded-xl h-11 text-xs" value={categoryFormData.capacity} onChange={e => setCategoryFormData({ ...categoryFormData, capacity: Number(e.target.value) })} />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-white/40 block mb-1">Amenities (comma-separated)</label>
              <Input className="bg-white/5 border-white/10 rounded-xl h-11 text-xs" value={categoryFormData.amenities} onChange={e => setCategoryFormData({ ...categoryFormData, amenities: e.target.value })} placeholder="Bathtub, Balcony, WiFi" />
            </div>
          </div>
          <DialogFooter className="pt-3 border-t border-white/5">
            <Button onClick={handleSaveCategory} className="w-full bg-amber-500 hover:bg-amber-400 text-black font-black uppercase text-xs h-11 rounded-xl" disabled={savingCategory}>
              Create Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ADD PHYSICAL ROOM DIALOG */}
      <Dialog open={roomDialogOpen} onOpenChange={setRoomDialogOpen}>
        <DialogContent className="max-w-md bg-[#090e13]/98 border border-white/10 text-white rounded-3xl p-8 backdrop-blur-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-display font-bold">Register Physical Room</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-3 text-left">
            <div>
              <label className="text-[10px] font-black uppercase text-white/40 block mb-1">Room Category</label>
              <select
                value={roomFormData.categoryId}
                onChange={e => setRoomFormData({ ...roomFormData, categoryId: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-xl h-11 px-3 text-xs text-white"
              >
                <option value="" className="bg-[#090e13]">Select Category...</option>
                {roomCategories.map(c => (
                  <option key={c.id} value={c.id} className="bg-[#090e13]">{c.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black uppercase text-white/40 block mb-1">Room Number</label>
                <Input className="bg-white/5 border-white/10 rounded-xl h-11 text-xs font-mono font-bold" value={roomFormData.roomNumber} onChange={e => setRoomFormData({ ...roomFormData, roomNumber: e.target.value })} placeholder="e.g. 302" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-white/40 block mb-1">Floor</label>
                <Input className="bg-white/5 border-white/10 rounded-xl h-11 text-xs" value={roomFormData.floor} onChange={e => setRoomFormData({ ...roomFormData, floor: e.target.value })} placeholder="e.g. 3rd Floor" />
              </div>
            </div>
          </div>
          <DialogFooter className="pt-3 border-t border-white/5">
            <Button onClick={handleSaveRoom} className="w-full bg-amber-500 hover:bg-amber-400 text-black font-black uppercase text-xs h-11 rounded-xl" disabled={savingRoom}>
              Register Room
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* LOG MAINTENANCE DIALOG */}
      <Dialog open={maintenanceDialogOpen} onOpenChange={setMaintenanceDialogOpen}>
        <DialogContent className="max-w-md bg-[#090e13]/98 border border-white/10 text-white rounded-3xl p-8 backdrop-blur-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-display font-bold">Log Maintenance Ticket</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-3 text-left">
            <div>
              <label className="text-[10px] font-black uppercase text-white/40 block mb-1">Select Room Number</label>
              <select
                value={maintenanceFormData.roomNumber}
                onChange={e => setMaintenanceFormData({ ...maintenanceFormData, roomNumber: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-xl h-11 px-3 text-xs text-white"
              >
                <option value="" className="bg-[#090e13]">Choose room...</option>
                {hotelRooms.map(r => (
                  <option key={r.id} value={r.roomNumber} className="bg-[#090e13]">Room {r.roomNumber}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-white/40 block mb-1">Issue / Repairs Task</label>
              <Input className="bg-white/5 border-white/10 rounded-xl h-11 text-xs" value={maintenanceFormData.task} onChange={e => setMaintenanceFormData({ ...maintenanceFormData, task: e.target.value })} placeholder="e.g. AC cooling issue" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black uppercase text-white/40 block mb-1">Priority</label>
                <select
                  value={maintenanceFormData.priority}
                  onChange={e => setMaintenanceFormData({ ...maintenanceFormData, priority: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl h-11 px-3 text-xs text-white"
                >
                  <option value="LOW" className="bg-[#090e13]">Low</option>
                  <option value="MEDIUM" className="bg-[#090e13]">Medium</option>
                  <option value="HIGH" className="bg-[#090e13]">High</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-white/40 block mb-1">Estimated Cost (₹)</label>
                <Input type="number" className="bg-white/5 border-white/10 rounded-xl h-11 text-xs font-mono" value={maintenanceFormData.cost || ''} onChange={e => setMaintenanceFormData({ ...maintenanceFormData, cost: Number(e.target.value) })} />
              </div>
            </div>
          </div>
          <DialogFooter className="pt-3 border-t border-white/5">
            <Button onClick={handleSaveMaintenance} className="w-full bg-amber-500 hover:bg-amber-400 text-black font-black uppercase text-xs h-11 rounded-xl" disabled={savingMaintenance}>
              Log Maintenance Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PARTNER SETTLEMENT DIALOG */}
      <Dialog open={settlementDialogOpen} onOpenChange={setSettlementDialogOpen}>
        <DialogContent className="max-w-md bg-[#090e13]/98 border border-white/10 text-white rounded-3xl p-8 backdrop-blur-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-display font-bold">Log Partner Settlement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-3 text-left">
            <div>
              <label className="text-[10px] font-black uppercase text-white/40 block mb-1">Gross Settlement Amount (₹)</label>
              <Input type="number" className="bg-white/5 border-white/10 rounded-xl h-11 text-xs font-mono font-bold" value={settlementFormData.amount} onChange={e => setSettlementFormData({ ...settlementFormData, amount: Number(e.target.value) })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black uppercase text-white/40 block mb-1">Commission Dues (₹)</label>
                <Input type="number" className="bg-white/5 border-white/10 rounded-xl h-11 text-xs font-mono text-rose-400" value={settlementFormData.commissionDues} onChange={e => setSettlementFormData({ ...settlementFormData, commissionDues: Number(e.target.value) })} />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-white/40 block mb-1">Net Paid (₹)</label>
                <Input type="number" className="bg-white/5 border-white/10 rounded-xl h-11 text-xs font-mono text-emerald-400 font-bold" value={settlementFormData.netPaid} onChange={e => setSettlementFormData({ ...settlementFormData, netPaid: Number(e.target.value) })} />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-white/40 block mb-1">Transaction Ref / ID</label>
              <Input className="bg-white/5 border-white/10 rounded-xl h-11 text-xs font-mono" value={settlementFormData.transactionRef} onChange={e => setSettlementFormData({ ...settlementFormData, transactionRef: e.target.value })} placeholder="UTR / Txn code..." />
            </div>
          </div>
          <DialogFooter className="pt-3 border-t border-white/5">
            <Button onClick={handleSaveSettlement} className="w-full bg-amber-500 hover:bg-amber-400 text-black font-black uppercase text-xs h-11 rounded-xl" disabled={savingSettlement}>
              Disburse & Settle Partner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* HOTELS HERO CONFIGURATION MODAL */}
      <Dialog open={heroDialogOpen} onOpenChange={setHeroDialogOpen}>
        <DialogContent className="max-w-xl bg-[#090e13]/98 border border-white/10 text-white rounded-3xl p-8 backdrop-blur-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2 text-amber-400 text-[10px] font-black uppercase tracking-[0.25em] mb-1">
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Landing Page Hero Configuration</span>
            </div>
            <DialogTitle className="text-2xl font-display font-bold">Public Hotels Banner</DialogTitle>
            <p className="text-xs text-white/40">Configure the top cover image and headlines for `/hotels`.</p>
          </DialogHeader>

          <div className="space-y-4 py-4 text-left">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-1">Hero Background Image</label>
              <MediaPicker
                value={heroImage}
                onChange={(url) => setHeroImage(url)}
              />
              {heroImage && (
                <div className="mt-3 relative aspect-[21/9] rounded-xl overflow-hidden border border-white/10">
                  <img src={heroImage} alt="Hero Banner Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40" />
                </div>
              )}
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-1">Hero Headline</label>
              <Input
                value={heroTitle}
                onChange={(e) => setHeroTitle(e.target.value)}
                placeholder="e.g. Luxury Stays in Kashmir"
                className="bg-white/5 border-white/10 rounded-xl h-11 text-xs font-bold"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-1">Hero Subheadline</label>
              <Textarea
                value={heroSubtitle}
                onChange={(e) => setHeroSubtitle(e.target.value)}
                placeholder="e.g. From lakeside houseboats to cozy mountain retreats, find your perfect stay."
                rows={3}
                className="bg-white/5 border-white/10 rounded-xl text-xs resize-none"
              />
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-white/5 flex gap-2">
            <Button
              variant="outline"
              onClick={() => setHeroDialogOpen(false)}
              className="flex-1 bg-transparent border-white/10 text-white text-xs h-11 rounded-xl"
              disabled={savingHero}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveHero}
              disabled={savingHero}
              className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-wider text-xs h-11 rounded-xl shadow-lg"
            >
              {savingHero ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DECOMMISSION ALERT */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="bg-[#090e13]/98 border border-rose-500/20 text-white rounded-3xl p-8 backdrop-blur-2xl">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-5 mx-auto text-rose-400">
            <Trash2 className="w-6 h-6" />
          </div>
          <AlertDialogHeader className="text-center">
            <AlertDialogTitle className="text-2xl font-display font-bold text-center">Decommission Property?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-white/50 text-center mt-2">
              Are you sure you want to permanently decommission this property node from active hospitality listings?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-6 border-t border-white/5 flex gap-3">
            <AlertDialogCancel className="flex-1 bg-transparent border-white/10 text-white text-xs h-11 rounded-xl">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => itemToDelete && handleDelete(itemToDelete)}
              className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs h-11 rounded-xl shadow-lg shadow-rose-500/20"
            >
              Confirm Decommission
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
