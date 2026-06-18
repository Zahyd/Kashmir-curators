import { useState, useEffect } from 'react';
import { 
  Plus, Pencil, Trash2, Loader2, Car, Users, Save, Image as ImageIcon, 
  Calendar, Wrench, ShieldAlert, Printer, Send, Clock, Phone, User, 
  MapPin, Sliders, X, DollarSign, Settings, CheckCircle2, AlertTriangle, Play
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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

interface Cab {
  id: string;
  name: string;
  type: string;
  capacity: number;
  pricePerKm: number;
  basePrice: number;
  image: string | null;
  features: string[];
  isActive: boolean;
}

interface CabMetadata {
  ownership?: 'company' | 'vendor';
  vendorName?: string;
  vendorPhone?: string;
  registrationNo?: string;
  driverName?: string;
  driverPhone?: string;
  notes?: string;
}

interface ManualBlocking {
  id: string;
  cabId: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'Maintenance' | 'Offline';
  createdAt: string;
}

interface OperationsLog {
  id: string;
  timestamp: string;
  message: string;
  user: string;
}

interface OperationsData {
  manualBlockings: ManualBlocking[];
  cabsMetadata: Record<string, CabMetadata>;
  logs: OperationsLog[];
}

interface Booking {
  id: string;
  userId: string;
  user: {
    name: string;
    email: string;
    phone: string | null;
  };
  type: string;
  itemName: string;
  bookingDate: string;
  status: string;
  totalAmount: number;
  details: {
    cabAllocation?: {
      cabId: string;
      cabName: string;
      cabType: string;
      ownership: 'company' | 'vendor';
      vendorName?: string;
      vendorPhone?: string;
      registrationNo?: string;
      driverName?: string;
      driverPhone?: string;
      pickupDateTime?: string;
      dropDateTime?: string;
      pickupLocation?: string;
      dropLocation?: string;
      allocatedDates?: string[];
      pricing?: {
        pricePerKm: number;
        estimatedKm: number;
        baseCost: number;
        driverAllowance: number;
        fuelExpenses: number;
        tollsExpenses: number;
        vendorPayout: number;
        otherExpenses: number;
        totalCost: number;
        margin: number;
        marginPercent: number;
      };
      voucherGenerated?: boolean;
      voucherNo?: string;
      whatsappSent?: boolean;
    };
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
}

const defaultCab: Omit<Cab, 'id'> = {
  name: '',
  type: '',
  capacity: 4,
  pricePerKm: 0,
  basePrice: 0,
  image: '',
  features: [],
  isActive: true,
};

const defaultMetadata: CabMetadata = {
  ownership: 'company',
  vendorName: '',
  vendorPhone: '',
  registrationNo: '',
  driverName: '',
  driverPhone: '',
  notes: '',
};

export default function CMSCabs() {
  const { systemEvents } = useTeamAuth();
  const [currentView, setCurrentView] = useState<'registry' | 'operations'>('operations');
  const [cabs, setCabs] = useState<Cab[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [operationsData, setOperationsData] = useState<OperationsData>({
    manualBlockings: [],
    cabsMetadata: {},
    logs: []
  });
  
  const [loading, setLoading] = useState(true);
  const [opsLoading, setOpsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCab, setEditingCab] = useState<Cab | null>(null);
  
  // Forms states
  const [formData, setFormData] = useState(defaultCab);
  const [featuresInput, setFeaturesInput] = useState('');
  const [metaFormData, setMetaFormData] = useState<CabMetadata>(defaultMetadata);
  
  // Decommission / Delete confirmations
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // Operations dialogs
  const [allocationDialogOpen, setAllocationDialogOpen] = useState(false);
  const [selectedBookingForAlloc, setSelectedBookingForAlloc] = useState<Booking | null>(null);
  const [allocatedCabId, setAllocatedCabId] = useState<string>('');
  
  // Dispatch details
  const [dispatchRegNo, setDispatchRegNo] = useState('');
  const [dispatchDriverName, setDispatchDriverName] = useState('');
  const [dispatchDriverPhone, setDispatchDriverPhone] = useState('');
  const [dispatchPickupDateTime, setDispatchPickupDateTime] = useState('');
  const [dispatchDropDateTime, setDispatchDropDateTime] = useState('');
  const [dispatchPickupLoc, setDispatchPickupLoc] = useState('');
  const [dispatchDropLoc, setDispatchDropLoc] = useState('');
  
  // Dispatch costings
  const [dispatchEstKm, setDispatchEstKm] = useState<number>(100);
  const [dispatchDriverAllowance, setDispatchDriverAllowance] = useState<number>(1500);
  const [dispatchFuel, setDispatchFuel] = useState<number>(3000);
  const [dispatchTolls, setDispatchTolls] = useState<number>(500);
  const [dispatchVendorPayout, setDispatchVendorPayout] = useState<number>(0);
  const [dispatchOther, setDispatchOther] = useState<number>(0);
  
  // Date blocker states
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [blockCabId, setBlockCabId] = useState('');
  const [blockStartDate, setBlockStartDate] = useState('');
  const [blockEndDate, setBlockEndDate] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [blockStatus, setBlockStatus] = useState<'Maintenance' | 'Offline'>('Maintenance');
  const [blockingDates, setBlockingDates] = useState(false);

  // Voucher preview dialog
  const [voucherDialogOpen, setVoucherDialogOpen] = useState(false);
  const [selectedBookingForVoucher, setSelectedBookingForVoucher] = useState<Booking | null>(null);

  // WhatsApp Preview Modal
  const [whatsappPreviewOpen, setWhatsappPreviewOpen] = useState(false);
  const [whatsappBooking, setWhatsappBooking] = useState<Booking | null>(null);
  const [whatsappMsgText, setWhatsappMsgText] = useState('');
  const [sendingWhatsapp, setSendingWhatsapp] = useState(false);

  // Fleet Hero settings
  const [heroTitle, setHeroTitle] = useState('Premium Transport');
  const [heroSubtitle, setHeroSubtitle] = useState('Reliable cab services for airport transfers, local sightseeing, and outstation trips.');
  const [heroImage, setHeroImage] = useState('https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=1600');
  const [savingHero, setSavingHero] = useState(false);
  const [loadingHero, setLoadingHero] = useState(true);

  // Calendar dates
  const next30Days = (() => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  })();

  const fetchHeroData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/site-content`);
      if (response.ok) {
        const data = await response.json();
        if (data.fleetHero) {
          setHeroTitle(data.fleetHero.title || 'Premium Transport');
          setHeroSubtitle(data.fleetHero.subtitle || 'Reliable cab services for airport transfers, local sightseeing, and outstation trips.');
          setHeroImage(data.fleetHero.image_url || 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=1600');
        }
      }
    } catch (error) {
      console.error('[CMSCabs] Error loading hero settings:', error);
    } finally {
      setLoadingHero(false);
    }
  };

  const handleSaveHero = async () => {
    setSavingHero(true);
    const token = localStorage.getItem('teamToken');
    try {
      const response = await fetch(`${API_BASE_URL}/site-content/fleetHero`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          section_key: 'fleetHero',
          title: heroTitle,
          subtitle: heroSubtitle,
          content: {},
          image_url: heroImage
        })
      });

      if (response.ok) {
        toast.success('Hero configuration saved successfully!');
      } else {
        throw new Error('Failed to save hero');
      }
    } catch (error: any) {
      console.error('[CMSCabs] Error saving hero settings:', error);
      toast.error('Failed to save hero settings');
    } finally {
      setSavingHero(false);
    }
  };

  const fetchCabs = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/cabs?all=true`);
      if (!response.ok) throw new Error('Fetch failed');
      const data = await response.json();
      
      const sanitized = data.map((cab: any) => {
        const features = typeof cab.features === 'string' ? JSON.parse(cab.features) : (Array.isArray(cab.features) ? cab.features : []);
        
        // Match mapping logic in Cabs.tsx
        const isFortuner = cab.name.toLowerCase().includes("fortuner") || cab.id === "cab-fortuner";
        const displayName = isFortuner ? "Force Urbania Luxury" : cab.name;
        const displayType = isFortuner ? "Luxury Cruiser" : cab.type;
        const displayCapacity = isFortuner ? 10 : cab.capacity;
        
        let imagePath = "";
        if (isFortuner) {
          imagePath = "/images/tourist_urbania.png";
        } else if (cab.name.toLowerCase().includes("sedan") || cab.name.toLowerCase().includes("etios") || cab.name.toLowerCase().includes("dzire")) {
          imagePath = "/images/tourist_sedan.png";
        } else if (cab.name.toLowerCase().includes("ertiga")) {
          imagePath = "/images/tourist_ertiga.png";
        } else if (cab.name.toLowerCase().includes("crysta") || (cab.name.toLowerCase().includes("innova") && cab.name.toLowerCase().includes("luxury"))) {
          imagePath = "/images/tourist_innova.png";
        } else if (cab.name.toLowerCase().includes("traveller") || cab.name.toLowerCase().includes("tempo")) {
          imagePath = "/images/tourist_tempo.png";
        } else {
          imagePath = cab.image || "/images/tourist_innova.png";
        }

        return {
          ...cab,
          name: displayName,
          type: displayType,
          capacity: displayCapacity,
          image: imagePath,
          features
        };
      });
      setCabs(sanitized);
    } catch (error: any) {
      console.error('[CMSCabs] Error fetching cabs:', error);
      toast.error('Failed to load cabs');
    } finally {
      setLoading(false);
    }
  };

  const fetchOperationsData = async () => {
    setOpsLoading(true);
    const token = localStorage.getItem('teamToken');
    try {
      const response = await fetch(`${API_BASE_URL}/cabs/operations/data`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Operations fetch failed');
      const data = await response.json();
      setOperationsData(data.operationsData);
      setBookings(data.bookings || []);
    } catch (error: any) {
      console.error('[CMSCabs] Error fetching operations data:', error);
      toast.error('Failed to load fleet command center data');
    } finally {
      setOpsLoading(false);
    }
  };

  useEffect(() => {
    fetchCabs();
    fetchHeroData();
    fetchOperationsData();
  }, []);

  // Sync real-time updates
  useEffect(() => {
    const latestEvent = systemEvents[0];
    if (latestEvent) {
      // Refresh registry if cab model changes
      if (latestEvent.booking && latestEvent.booking.entityType === 'cab') {
        fetchCabs();
      }
      // Refresh operations if bookings, metadata, or logs change
      if (latestEvent.message && (
        latestEvent.message.includes('block') || 
        latestEvent.message.includes('booking') || 
        latestEvent.message.includes('Cab Settings') ||
        latestEvent.message.includes('notification')
      )) {
        fetchOperationsData();
      }
    }
  }, [systemEvents]);

  const openCreateDialog = () => {
    setEditingCab(null);
    setFormData(defaultCab);
    setMetaFormData(defaultMetadata);
    setFeaturesInput('');
    setDialogOpen(true);
  };

  const openEditDialog = (cab: Cab) => {
    setEditingCab(cab);
    setFormData(cab);
    setFeaturesInput(cab.features?.join('\n') || '');
    
    // Load custom metadata if exists
    const meta = operationsData.cabsMetadata[cab.id] || defaultMetadata;
    setMetaFormData(meta);
    
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.type) {
      toast.error('Vehicle name and type are mandatory');
      return;
    }

    setSaving(true);
    const token = localStorage.getItem('teamToken');
    const method = editingCab ? 'PATCH' : 'POST';
    const url = editingCab 
      ? `${API_BASE_URL}/cabs/${editingCab.id}` 
      : `${API_BASE_URL}/cabs`;

    const dataToSave = {
      ...formData,
      features: featuresInput.split('\n').filter(Boolean),
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
        const savedCab = await response.json();
        
        // Save operational metadata overrides (ownership, registration, default driver)
        const cabId = editingCab ? editingCab.id : savedCab.id;
        await fetch(`${API_BASE_URL}/cabs/operations/settings/${cabId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(metaFormData)
        });

        toast.success(editingCab ? 'Vehicle node updated' : 'New vehicle deployed in fleet');
        setDialogOpen(false);
        fetchCabs();
        fetchOperationsData();
      } else {
        const errData = await response.json();
        toast.error(errData.error || 'Deployment failed');
      }
    } catch (error: any) {
      toast.error(`System error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const token = localStorage.getItem('teamToken');
    try {
      const response = await fetch(`${API_BASE_URL}/cabs/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('Vehicle decommissioned successfully');
        fetchCabs();
        fetchOperationsData();
      } else {
        toast.error('Decommissioning failed');
      }
    } catch (error: any) {
      toast.error('Decommissioning connection error');
    }
  };

  const toggleActive = async (cab: Cab) => {
    const token = localStorage.getItem('teamToken');
    try {
      const response = await fetch(`${API_BASE_URL}/cabs/${cab.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !cab.isActive })
      });

      if (response.ok) {
        fetchCabs();
        fetchOperationsData();
      } else {
        toast.error('Failed to change status');
      }
    } catch (error: any) {
      toast.error('Failed to change status');
    }
  };

  // Operations: Date blocking
  const handleBlockDates = async () => {
    if (!blockCabId || !blockStartDate || !blockEndDate) {
      toast.error('Cab, start date, and end date are required');
      return;
    }

    if (new Date(blockStartDate) > new Date(blockEndDate)) {
      toast.error('Start date cannot be after end date');
      return;
    }

    // Check conflict: does this cab have a booking reserved on these dates?
    const conflictBooking = bookings.find(b => {
      if (b.status === 'cancelled' || b.status === 'completed') return false;
      const alloc = b.details?.cabAllocation;
      if (!alloc || alloc.cabId !== blockCabId) return false;
      
      const pDate = alloc.pickupDateTime ? new Date(alloc.pickupDateTime).toISOString().split('T')[0] : '';
      const dDate = alloc.dropDateTime ? new Date(alloc.dropDateTime).toISOString().split('T')[0] : '';
      
      const bStart = new Date(blockStartDate);
      const bEnd = new Date(blockEndDate);
      const tStart = new Date(pDate);
      const tEnd = new Date(dDate);

      return (bStart <= tEnd && bEnd >= tStart);
    });

    if (conflictBooking) {
      toast.warning(`Warning: Booking conflict detected. ${conflictBooking.itemName} is already allocated to this vehicle on these dates.`);
    }

    setBlockingDates(true);
    const token = localStorage.getItem('teamToken');
    try {
      const response = await fetch(`${API_BASE_URL}/cabs/operations/block`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          cabId: blockCabId,
          startDate: blockStartDate,
          endDate: blockEndDate,
          reason: blockReason,
          status: blockStatus
        })
      });

      if (response.ok) {
        toast.success(`Cab dates successfully blocked for ${blockStatus}`);
        setBlockDialogOpen(false);
        setBlockReason('');
        fetchOperationsData();
      } else {
        toast.error('Failed to block dates');
      }
    } catch (error: any) {
      toast.error('Date block connection failure');
    } finally {
      setBlockingDates(false);
    }
  };

  const handleUnblockDates = async (blockId: string) => {
    const token = localStorage.getItem('teamToken');
    try {
      const response = await fetch(`${API_BASE_URL}/cabs/operations/block/${blockId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        toast.success('Block released successfully');
        fetchOperationsData();
      } else {
        toast.error('Failed to release block');
      }
    } catch (error) {
      toast.error('Connection failure');
    }
  };

  // Operations: Booking Allocation
  const openAllocationDialog = (booking: Booking) => {
    setSelectedBookingForAlloc(booking);
    const alloc = booking.details?.cabAllocation;
    
    // Fill default values
    if (alloc) {
      setAllocatedCabId(alloc.cabId);
      setDispatchRegNo(alloc.registrationNo || '');
      setDispatchDriverName(alloc.driverName || '');
      setDispatchDriverPhone(alloc.driverPhone || '');
      setDispatchPickupDateTime(alloc.pickupDateTime ? alloc.pickupDateTime.slice(0, 16) : '');
      setDispatchDropDateTime(alloc.dropDateTime ? alloc.dropDateTime.slice(0, 16) : '');
      setDispatchPickupLoc(alloc.pickupLocation || '');
      setDispatchDropLoc(alloc.dropLocation || '');
      
      const pricing = alloc.pricing;
      if (pricing) {
        setDispatchEstKm(pricing.estimatedKm || 100);
        setDispatchDriverAllowance(pricing.driverAllowance || 1500);
        setDispatchFuel(pricing.fuelExpenses || 3000);
        setDispatchTolls(pricing.tollsExpenses || 500);
        setDispatchVendorPayout(pricing.vendorPayout || 0);
        setDispatchOther(pricing.otherExpenses || 0);
      }
    } else {
      // Clean slate
      setAllocatedCabId('');
      setDispatchRegNo('');
      setDispatchDriverName('');
      setDispatchDriverPhone('');
      
      // Auto dates from booking
      const bookDateStr = booking.bookingDate ? booking.bookingDate.split('T')[0] : new Date().toISOString().split('T')[0];
      setDispatchPickupDateTime(`${bookDateStr}T09:00`);
      
      // Default drop +1 day
      const dropDate = new Date(bookDateStr);
      dropDate.setDate(dropDate.getDate() + 1);
      const dropDateStr = dropDate.toISOString().split('T')[0];
      setDispatchDropDateTime(`${dropDateStr}T18:00`);
      
      setDispatchPickupLoc('');
      setDispatchDropLoc('');
      setDispatchEstKm(100);
      setDispatchDriverAllowance(1500);
      setDispatchFuel(3000);
      setDispatchTolls(500);
      setDispatchVendorPayout(0);
      setDispatchOther(0);
    }
    setAllocationDialogOpen(true);
  };

  // Auto-populate when cab selected in dropdown
  const handleCabChange = (cabId: string) => {
    setAllocatedCabId(cabId);
    const cab = cabs.find(c => c.id === cabId);
    const meta = operationsData.cabsMetadata[cabId] || {};
    
    setDispatchRegNo(meta.registrationNo || '');
    setDispatchDriverName(meta.driverName || '');
    setDispatchDriverPhone(meta.driverPhone || '');
    
    // Auto populate vendor settings
    if (meta.ownership === 'vendor') {
      setDispatchVendorPayout(cab ? cab.basePrice : 0);
    } else {
      setDispatchVendorPayout(0);
    }
  };

  // Check conflicts for allocation
  const checkAllocationConflicts = () => {
    if (!allocatedCabId || !dispatchPickupDateTime || !dispatchDropDateTime || !selectedBookingForAlloc) return [];
    const conflicts = [];
    
    const pDate = new Date(dispatchPickupDateTime);
    const dDate = new Date(dispatchDropDateTime);
    
    // Check manual blocks
    const blocked = operationsData.manualBlockings.filter(b => {
      if (b.cabId !== allocatedCabId) return false;
      const bStart = new Date(b.startDate);
      const bEnd = new Date(b.endDate);
      return (pDate <= bEnd && dDate >= bStart);
    });
    
    blocked.forEach(b => {
      conflicts.push(`Vehicle is blocked for ${b.status} (${b.reason}) from ${b.startDate} to ${b.endDate}`);
    });
    
    // Check other bookings
    const booked = bookings.filter(b => {
      if (b.id === selectedBookingForAlloc.id) return false; // skip current
      if (b.status === 'cancelled' || b.status === 'completed') return false;
      const alloc = b.details?.cabAllocation;
      if (!alloc || alloc.cabId !== allocatedCabId) return false;
      
      const allocStart = new Date(alloc.pickupDateTime || '');
      const allocEnd = new Date(alloc.dropDateTime || '');
      return (pDate <= allocEnd && dDate >= allocStart);
    });
    
    booked.forEach(b => {
      conflicts.push(`Vehicle is already allocated to booking: "${b.itemName}" (${b.user.name}) from ${new Date(b.details?.cabAllocation?.pickupDateTime || '').toLocaleDateString()} to ${new Date(b.details?.cabAllocation?.dropDateTime || '').toLocaleDateString()}`);
    });
    
    return conflicts;
  };

  const handleSaveAllocation = async () => {
    if (!selectedBookingForAlloc) return;
    if (!allocatedCabId) {
      toast.error('Please select a vehicle');
      return;
    }

    // Perform validation
    const conflicts = checkAllocationConflicts();
    if (conflicts.length > 0) {
      toast.error(`Cannot allocate vehicle: ${conflicts[0]}`);
      return;
    }

    const cab = cabs.find(c => c.id === allocatedCabId);
    if (!cab) return;

    const meta = operationsData.cabsMetadata[allocatedCabId] || {};
    
    // Calculate finances
    const pKm = cab.pricePerKm || 0;
    const estKm = Number(dispatchEstKm) || 0;
    const baseCost = cab.basePrice || 0;
    
    // Revenue calculations: Cab cost = base + (km * rate)
    const cabRevenue = baseCost + (estKm * pKm);
    const customerFare = selectedBookingForAlloc.totalAmount > 0 
      ? selectedBookingForAlloc.totalAmount 
      : cabRevenue;
    
    // Total expenses
    const totalCost = Number(dispatchDriverAllowance) + 
                      Number(dispatchFuel) + 
                      Number(dispatchTolls) + 
                      Number(dispatchVendorPayout) + 
                      Number(dispatchOther);
                      
    // Profit Margin
    const margin = customerFare - totalCost;
    const marginPercent = customerFare > 0 ? (margin / customerFare) * 100 : 0;
    
    // Generate allocated dates array
    const allocDates: string[] = [];
    const startD = new Date(dispatchPickupDateTime);
    const endD = new Date(dispatchDropDateTime);
    const temp = new Date(startD);
    while (temp <= endD) {
      allocDates.push(temp.toISOString().split('T')[0]);
      temp.setDate(temp.getDate() + 1);
    }

    // Details update
    const updatedDetails = {
      ...selectedBookingForAlloc.details,
      cabAllocation: {
        cabId: allocatedCabId,
        cabName: cab.name,
        cabType: cab.type,
        ownership: meta.ownership || 'company',
        vendorName: meta.vendorName || '',
        vendorPhone: meta.vendorPhone || '',
        registrationNo: dispatchRegNo,
        driverName: dispatchDriverName,
        driverPhone: dispatchDriverPhone,
        pickupDateTime: dispatchPickupDateTime,
        dropDateTime: dispatchDropDateTime,
        pickupLocation: dispatchPickupLoc,
        dropLocation: dispatchDropLoc,
        allocatedDates: allocDates,
        pricing: {
          pricePerKm: pKm,
          estimatedKm: estKm,
          baseCost,
          driverAllowance: Number(dispatchDriverAllowance),
          fuelExpenses: Number(dispatchFuel),
          tollsExpenses: Number(dispatchTolls),
          vendorPayout: Number(dispatchVendorPayout),
          otherExpenses: Number(dispatchOther),
          totalCost,
          margin,
          marginPercent
        },
        voucherGenerated: selectedBookingForAlloc.details?.cabAllocation?.voucherGenerated || false,
        voucherNo: selectedBookingForAlloc.details?.cabAllocation?.voucherNo || `VOUCH-${Math.floor(1000 + Math.random() * 9000)}`,
        whatsappSent: selectedBookingForAlloc.details?.cabAllocation?.whatsappSent || false
      }
    };

    setSaving(true);
    const token = localStorage.getItem('teamToken');
    try {
      const response = await fetch(`${API_BASE_URL}/bookings/${selectedBookingForAlloc.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          details: updatedDetails,
          totalAmount: customerFare
        })
      });

      if (response.ok) {
        toast.success(`Vehicle allocated successfully to ${selectedBookingForAlloc.itemName}`);
        setAllocationDialogOpen(false);
        fetchOperationsData();
        
        // Push an operations log in backend
        await fetch(`${API_BASE_URL}/cabs/operations/logs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            message: `Allocated ${cab.name} (${dispatchRegNo}) to trip ${selectedBookingForAlloc.itemName} (Guest: ${selectedBookingForAlloc.user.name}).`
          })
        });
      } else {
        toast.error('Failed to update booking allocation');
      }
    } catch (err) {
      toast.error('Connection failure');
    } finally {
      setSaving(false);
    }
  };

  const handleDeallocate = async (booking: Booking) => {
    if (!window.confirm('Are you sure you want to release the allocated cab for this booking?')) return;
    
    // Details update: remove cabAllocation
    const updatedDetails = { ...booking.details };
    delete updatedDetails.cabAllocation;

    const token = localStorage.getItem('teamToken');
    try {
      const response = await fetch(`${API_BASE_URL}/bookings/${booking.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          details: updatedDetails
        })
      });

      if (response.ok) {
        toast.success('Vehicle allocation released');
        fetchOperationsData();
        
        // Push operations log
        await fetch(`${API_BASE_URL}/cabs/operations/logs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            message: `De-allocated vehicle from booking ${booking.itemName} (Guest: ${booking.user.name}).`
          })
        });
      } else {
        toast.error('Failed to release allocation');
      }
    } catch (err) {
      toast.error('Deallocation connection failure');
    }
  };

  // WhatsApp Message Dispatcher
  const openWhatsappPreview = (booking: Booking) => {
    const alloc = booking.details?.cabAllocation;
    if (!alloc) return;

    const text = `🏔️ *Kashmir Curators - Chauffeur Dispatch* 🏔️\n\n` +
                 `Hello *${alloc.driverName}*,\n\n` +
                 `You have been assigned to a luxury holiday chauffeur trip:\n` +
                 `• *Trip:* ${booking.itemName}\n` +
                 `• *Guest Name:* ${booking.user.name}\n` +
                 `• *Guest Phone:* ${booking.user.phone || 'N/A'}\n` +
                 `• *Vehicle:* ${alloc.cabName} (${alloc.registrationNo || 'No Reg'})\n` +
                 `• *Pickup Point:* ${alloc.pickupLocation || 'Airport'}\n` +
                 `• *Pickup Schedule:* ${new Date(alloc.pickupDateTime || '').toLocaleString()}\n` +
                 `• *Drop Point:* ${alloc.dropLocation || 'Hotel'}\n` +
                 `• *Drop Schedule:* ${new Date(alloc.dropDateTime || '').toLocaleString()}\n\n` +
                 `*Operational Protocols:*\n` +
                 `1. Clean vehicle interior daily.\n` +
                 `2. Keep loaded with Kashmir Curators amenities (water, fresh tissues).\n` +
                 `3. Arrive 15 minutes before the pickup schedule.\n\n` +
                 `Have a safe trip! ✨`;

    setWhatsappBooking(booking);
    setWhatsappMsgText(text);
    setWhatsappPreviewOpen(true);
  };

  const handleSendWhatsapp = async () => {
    if (!whatsappBooking || !whatsappMsgText) return;
    const alloc = whatsappBooking.details?.cabAllocation;
    if (!alloc || !alloc.driverPhone) {
      toast.error('Driver phone number is missing');
      return;
    }

    setSendingWhatsapp(true);
    const token = localStorage.getItem('teamToken');
    try {
      const response = await fetch(`${API_BASE_URL}/cabs/operations/notify-driver`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          driverPhone: alloc.driverPhone,
          messageText: whatsappMsgText
        })
      });

      if (response.ok) {
        toast.success(`Chauffeur ${alloc.driverName} notified via WhatsApp!`);
        setWhatsappPreviewOpen(false);
        
        // Mark whatsappSent as true in booking details
        const updatedDetails = {
          ...whatsappBooking.details,
          cabAllocation: {
            ...alloc,
            whatsappSent: true
          }
        };

        await fetch(`${API_BASE_URL}/bookings/${whatsappBooking.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ details: updatedDetails })
        });
        
        fetchOperationsData();
      } else {
        toast.error('WhatsApp meta dispatch failed');
      }
    } catch (e) {
      toast.error('WhatsApp gateway connection failed');
    } finally {
      setSendingWhatsapp(false);
    }
  };

  // Generate Voucher Mark
  const markVoucherGenerated = async (booking: Booking) => {
    if (booking.details?.cabAllocation?.voucherGenerated) return; // already marked
    
    const updatedDetails = {
      ...booking.details,
      cabAllocation: {
        ...booking.details.cabAllocation,
        voucherGenerated: true
      }
    };

    const token = localStorage.getItem('teamToken');
    try {
      await fetch(`${API_BASE_URL}/bookings/${booking.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ details: updatedDetails })
      });
      fetchOperationsData();
    } catch (e) {
      console.error(e);
    }
  };

  // Dynamic Status Resolver for Cabs
  const resolveCabStatusForToday = (cab: Cab) => {
    const todayStr = new Date().toISOString().split('T')[0];
    
    if (!cab.isActive) return 'Offline';
    
    // Check manual blocks
    const block = operationsData.manualBlockings.find(b => {
      if (b.cabId !== cab.id) return false;
      const start = b.startDate;
      const end = b.endDate;
      return (todayStr >= start && todayStr <= end);
    });
    if (block) return block.status; // 'Maintenance' or 'Offline'

    // Check bookings
    const booking = bookings.find(b => {
      if (b.status === 'cancelled' || b.status === 'completed') return false;
      const alloc = b.details?.cabAllocation;
      if (!alloc || alloc.cabId !== cab.id) return false;
      
      const start = alloc.pickupDateTime ? alloc.pickupDateTime.split('T')[0] : '';
      const end = alloc.dropDateTime ? alloc.dropDateTime.split('T')[0] : '';
      return (todayStr >= start && todayStr <= end);
    });

    if (booking) return 'On Trip';

    // Check future reservations
    const reserved = bookings.find(b => {
      if (b.status === 'cancelled' || b.status === 'completed') return false;
      const alloc = b.details?.cabAllocation;
      if (!alloc || alloc.cabId !== cab.id) return false;
      
      const start = alloc.pickupDateTime ? alloc.pickupDateTime.split('T')[0] : '';
      return (start > todayStr);
    });

    if (reserved) return 'Reserved';

    return 'Available';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Reserved': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'On Trip': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'Maintenance': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'Offline': return 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20';
      default: return 'bg-white/5 text-white/50 border-white/5';
    }
  };

  const getCabStatusForDate = (cab: Cab, dateStr: string, bookingsList: Booking[], manualBlockingsList: ManualBlocking[]) => {
    if (!cab.isActive) return 'Offline';

    const targetDate = new Date(dateStr);
    targetDate.setHours(0,0,0,0);

    const block = manualBlockingsList.find(b => {
      if (b.cabId !== cab.id) return false;
      const start = new Date(b.startDate);
      start.setHours(0,0,0,0);
      const end = new Date(b.endDate);
      end.setHours(0,0,0,0);
      return targetDate >= start && targetDate <= end;
    });

    if (block) return block.status;

    const booking = bookingsList.find(b => {
      if (b.status === 'cancelled' || b.status === 'completed') return false;
      const alloc = b.details?.cabAllocation;
      if (!alloc || alloc.cabId !== cab.id) return false;
      
      if (alloc.allocatedDates && Array.isArray(alloc.allocatedDates)) {
        return alloc.allocatedDates.includes(dateStr);
      }
      
      if (alloc.pickupDateTime && alloc.dropDateTime) {
        const start = new Date(alloc.pickupDateTime.split('T')[0]);
        const end = new Date(alloc.dropDateTime.split('T')[0]);
        return targetDate >= start && targetDate <= end;
      }
      return false;
    });

    if (booking) {
      const todayStr = new Date().toISOString().split('T')[0];
      if (dateStr === todayStr) {
        return 'On Trip';
      } else {
        return 'Reserved';
      }
    }

    return 'Available';
  };

  if (loading || opsLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="h-16 w-16 animate-spin text-kashmir-gold" />
        <p className="text-white/20 text-xs font-black uppercase tracking-[0.2em] animate-pulse">Initializing Operations Center...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Header operations controls */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div>
          <Badge className="bg-kashmir-gold/10 text-kashmir-gold border-kashmir-gold/20 font-black px-4 py-1 rounded-full text-[9px] uppercase tracking-[0.2em] mb-3">
            Travel Operations Command Center
          </Badge>
          <h2 className="text-4xl font-display font-black text-white tracking-tight">Fleet Command</h2>
          <p className="text-white/40 text-xs mt-1 uppercase tracking-widest font-black">
            System Synchronized • {cabs.length} Cabs • {bookings.filter(b => b.type === 'cab' || b.details?.cabAllocation).length} Active Assignments
          </p>
        </div>
        
        {/* Toggle Mode */}
        <div className="flex p-1 bg-white/5 border border-white/5 rounded-2xl w-full xl:w-auto">
          <button 
            onClick={() => setCurrentView('operations')}
            className={cn(
              "flex-1 xl:flex-none px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2",
              currentView === 'operations' ? "bg-kashmir-gold text-black shadow-lg" : "text-white/40 hover:text-white"
            )}
          >
            <Sliders className="w-3.5 h-3.5" />
            Operations Room
          </button>
          <button 
            onClick={() => setCurrentView('registry')}
            className={cn(
              "flex-1 xl:flex-none px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2",
              currentView === 'registry' ? "bg-kashmir-gold text-black shadow-lg" : "text-white/40 hover:text-white"
            )}
          >
            <Car className="w-3.5 h-3.5" />
            Fleet Registry
          </button>
        </div>
      </div>

      {currentView === 'operations' ? (
        // ----------------------------------------------------
        // OPERATIONS ROOM
        // ----------------------------------------------------
        <div className="space-y-10 animate-in fade-in duration-700">
          {/* Fleet Status Counters */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {[
              { label: 'Available Today', count: cabs.filter(c => resolveCabStatusForToday(c) === 'Available').length, color: 'text-emerald-400' },
              { label: 'On Trip Today', count: cabs.filter(c => resolveCabStatusForToday(c) === 'On Trip').length, color: 'text-red-400' },
              { label: 'Reserved / Future', count: cabs.filter(c => resolveCabStatusForToday(c) === 'Reserved').length, color: 'text-amber-400' },
              { label: 'Maintenance Mode', count: cabs.filter(c => resolveCabStatusForToday(c) === 'Maintenance').length, color: 'text-orange-400' },
              { label: 'Offline / Inactive', count: cabs.filter(c => resolveCabStatusForToday(c) === 'Offline').length, color: 'text-neutral-500' },
            ].map(counter => (
              <Card key={counter.label} className="bg-white/[0.01] border-white/5 p-6 rounded-3xl relative overflow-hidden group animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="absolute top-0 right-0 w-16 h-16 bg-white/[0.01] group-hover:bg-white/[0.02] transition-colors rounded-bl-full" />
                <p className="text-[10px] font-black uppercase tracking-widest text-white/30">{counter.label}</p>
                <p className={cn("text-3xl font-display font-black mt-2", counter.color)}>{counter.count}</p>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Live Dispatch & Allocations Queue */}
            <Card className="lg:col-span-8 bg-white/[0.01] border-white/5 p-8 rounded-[2.5rem] relative overflow-hidden">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                  <h3 className="text-xl font-display font-black text-white uppercase tracking-tight flex items-center gap-2">
                    <Clock className="w-5 h-5 text-kashmir-gold" />
                    Trip Allocations Board
                  </h3>
                  <p className="text-[10px] text-white/30 font-black uppercase tracking-widest mt-1">Manage driver dispatching and kilometer cost matrices per booking</p>
                </div>
                <Button 
                  onClick={() => setBlockDialogOpen(true)}
                  className="bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl h-10 px-4 text-[9px] uppercase tracking-widest font-black flex items-center gap-2"
                >
                  <Wrench className="w-3.5 h-3.5 text-orange-400" />
                  Block Dates
                </Button>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-white/[0.02] border-b border-white/5">
                    <TableRow className="hover:bg-transparent border-none">
                      <TableHead className="text-white/20 uppercase text-[8px] font-black tracking-widest py-5 pl-6">Trip Node</TableHead>
                      <TableHead className="text-white/20 uppercase text-[8px] font-black tracking-widest">Client profile</TableHead>
                      <TableHead className="text-white/20 uppercase text-[8px] font-black tracking-widest">Schedule</TableHead>
                      <TableHead className="text-white/20 uppercase text-[8px] font-black tracking-widest">Allocated Chauffeur</TableHead>
                      <TableHead className="text-white/20 uppercase text-[8px] font-black tracking-widest text-right pr-6">Operational Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-white/5">
                    {bookings
                      .filter((b) => b.type === 'cab' || b.details?.cabAllocation || b.details?.parentPackageBookingId)
                      .map((booking) => {
                        const alloc = booking.details?.cabAllocation;
                        const isAutoGenerated = booking.details?.tripType === 'package-automation' || !!booking.details?.parentPackageBookingId;
                        return (
                          <TableRow key={booking.id} className="hover:bg-white/[0.02] transition-colors border-none group/trip-row">
                            <TableCell className="py-6 pl-6 font-bold text-white">
                              <div className="flex flex-col items-start gap-1">
                                <span className="text-sm font-black text-white tracking-tight">{booking.itemName}</span>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[9px] text-white/20 uppercase tracking-widest font-bold">Ref: {booking.id.slice(0, 8)}</span>
                                  {isAutoGenerated && (
                                    <Badge className="bg-emerald-500/10 text-emerald-400 border-none rounded-md px-1.5 py-0.2 text-[8px] font-black uppercase tracking-wider">
                                      Package Auto
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-white/90">{booking.user.name}</span>
                                <span className="text-[9px] text-white/30 font-medium mt-0.5">{booking.user.phone || 'No phone'}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col text-xs text-white/70 font-semibold">
                                {alloc ? (
                                  <>
                                    <span>{new Date(alloc.pickupDateTime || '').toLocaleDateString()}</span>
                                    <span className="text-[9px] text-white/30 font-bold mt-0.5">➔ {new Date(alloc.dropDateTime || '').toLocaleDateString()}</span>
                                  </>
                                ) : (
                                  <span>{new Date(booking.bookingDate).toLocaleDateString()}</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {alloc ? (
                                <div className="flex flex-col">
                                  <span className={cn("text-xs font-bold flex items-center gap-1.5", alloc.driverName ? "text-kashmir-gold" : "text-white/40")}>
                                    <User className="w-3 h-3 text-white/30" />
                                    {alloc.driverName || 'Driver Pending'}
                                  </span>
                                  {alloc.driverPhone ? (
                                    <span className="text-[9px] text-white/40 mt-1 flex items-center gap-1">
                                      <Phone className="w-2.5 h-2.5 text-white/20" />
                                      {alloc.driverPhone}
                                    </span>
                                  ) : (
                                    <span className="text-[9px] text-white/20 mt-1 uppercase tracking-widest font-bold">Phone Pending</span>
                                  )}
                                </div>
                              ) : (
                                <Badge className="bg-red-500/10 text-red-400 border-none rounded-md px-2 py-0.5 text-[8px] font-black uppercase tracking-wider">Unallocated</Badge>
                              )}
                            </TableCell>
                          <TableCell className="text-right pr-6">
                            <div className="flex justify-end items-center gap-2">
                              {alloc ? (
                                <>
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    onClick={() => openWhatsappPreview(booking)}
                                    className={cn(
                                      "h-8 rounded-lg text-[9px] font-black uppercase tracking-widest px-3 flex items-center gap-1 border border-white/5",
                                      alloc.whatsappSent ? "bg-green-500/10 text-green-400 hover:bg-green-500/20" : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                                    )}
                                  >
                                    <Send className="w-3 h-3" />
                                    {alloc.whatsappSent ? 'Notified' : 'Notify'}
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    onClick={() => {
                                      setSelectedBookingForVoucher(booking);
                                      markVoucherGenerated(booking);
                                      setVoucherDialogOpen(true);
                                    }}
                                    className={cn(
                                      "h-8 rounded-lg text-[9px] font-black uppercase tracking-widest px-3 flex items-center gap-1 border border-white/5",
                                      alloc.voucherGenerated ? "bg-kashmir-gold/10 text-kashmir-gold hover:bg-kashmir-gold/20" : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                                    )}
                                  >
                                    <Printer className="w-3 h-3" />
                                    Voucher
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    onClick={() => openAllocationDialog(booking)}
                                    className="h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/5 text-[9px] font-black"
                                  >
                                    Edit
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    onClick={() => handleDeallocate(booking)}
                                    className="h-8 w-8 rounded-lg bg-red-500/5 hover:bg-red-500/10 text-red-400/80 hover:text-red-400 border border-red-500/10 flex items-center justify-center p-0"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </Button>
                                </>
                              ) : (
                                <Button 
                                  size="sm"
                                  onClick={() => openAllocationDialog(booking)}
                                  className="h-8 rounded-lg bg-kashmir-gold text-black hover:bg-amber-500 font-black text-[9px] uppercase tracking-widest px-4 shadow-md transition-all active:scale-95"
                                >
                                  Allocate Vehicle
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {bookings.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="py-12 text-center text-white/20 text-xs font-black uppercase tracking-widest">
                          No bookings requiring vehicle dispatch
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>

            {/* Real-Time operations logs timeline */}
            <Card className="lg:col-span-4 bg-[#0a0f12]/40 bg-white/[0.02] border-white/5 p-8 rounded-[2.5rem] flex flex-col relative overflow-hidden max-h-[500px]">
              <div className="absolute top-0 right-0 w-24 h-24 bg-kashmir-gold/5 blur-[40px] -mr-12 -mt-12" />
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-display font-black text-white uppercase tracking-tight">System Logs</h3>
                  <p className="text-[9px] text-kashmir-gold uppercase tracking-[0.2em] font-black">Chauffeur & Dispatch Events</p>
                </div>
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>

              <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {operationsData.logs && operationsData.logs.length > 0 ? (
                  operationsData.logs.map((log) => (
                    <div key={log.id} className="flex gap-4 group/log">
                      <div className="w-1.5 h-1.5 rounded-full bg-kashmir-gold/40 mt-1.5 shrink-0 group-hover/log:bg-kashmir-gold transition-colors" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white/80 font-bold leading-normal">{log.message}</p>
                        <p className="text-[9px] text-white/30 mt-1 font-black uppercase tracking-widest">
                          {new Date(log.timestamp).toLocaleTimeString()} • {log.user}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-full space-y-4 opacity-20">
                    <Clock className="w-10 h-10 text-white/50" />
                    <p className="text-[9px] uppercase tracking-[0.2em] font-black">Logs Awaiting Events...</p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Availability Calendar grid */}
          <Card className="bg-white/[0.01] border-white/5 p-8 rounded-[2.5rem] relative overflow-hidden">
            <div className="mb-8">
              <h3 className="text-xl font-display font-black text-white uppercase tracking-tight flex items-center gap-2">
                <Calendar className="w-5 h-5 text-kashmir-gold" />
                Fleet Availability Calendar
              </h3>
              <p className="text-[10px] text-white/30 font-black uppercase tracking-widest mt-1">Real-time schedule grid for the next 30 days. Click cells to block maintenance dates.</p>
            </div>

            <div className="overflow-x-auto max-w-full pb-4 custom-scrollbar">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.01]">
                    <th className="text-left text-white/20 uppercase text-[9px] font-black tracking-widest p-4 sticky left-0 bg-[#0a0f12] z-10 min-w-[200px]">Vehicle Node</th>
                    {next30Days.map(date => {
                      const d = new Date(date);
                      const isToday = date === new Date().toISOString().split('T')[0];
                      return (
                        <th key={date} className={cn(
                          "text-center p-3 text-[10px] font-black uppercase tracking-wider min-w-[50px] shrink-0 border-r border-white/[0.02]",
                          isToday ? "text-kashmir-gold bg-kashmir-gold/5" : "text-white/40"
                        )}>
                          <div>{d.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                          <div className="text-sm mt-1">{d.getDate()}</div>
                          <div className="text-[7px] opacity-40 font-bold">{d.toLocaleDateString('en-US', { month: 'short' })}</div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {cabs.map(cab => {
                    const meta = operationsData.cabsMetadata[cab.id] || {};
                    return (
                      <tr key={cab.id} className="hover:bg-white/[0.01] transition-colors border-none group/row">
                        <td className="p-4 sticky left-0 bg-[#0a0f12] z-10 flex items-center gap-3 border-r border-white/5 min-w-[200px]">
                          <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                            {cab.image ? (
                              <img src={cab.image} alt={cab.name} className="w-full h-full object-cover" />
                            ) : (
                              <Car className="w-4 h-4 text-kashmir-gold" />
                            )}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-black text-white truncate">{cab.name}</span>
                            <span className="text-[8px] text-white/30 uppercase font-black truncate">{meta.registrationNo || 'No Reg No'}</span>
                          </div>
                        </td>
                        
                        {next30Days.map(date => {
                          const status = getCabStatusForDate(cab, date, bookings, operationsData.manualBlockings);
                          const blockColor = getStatusColor(status);
                          
                          const manualBlockObj = operationsData.manualBlockings.find(b => 
                            b.cabId === cab.id && date >= b.startDate && date <= b.endDate
                          );
                          const tooltip = manualBlockObj 
                            ? `${manualBlockObj.status}: ${manualBlockObj.reason}` 
                            : status === 'On Trip' 
                              ? 'Trip in progress' 
                              : status === 'Reserved' 
                                ? 'Reserved' 
                                : 'Available';

                          return (
                            <td 
                              key={date} 
                              onClick={() => {
                                setBlockCabId(cab.id);
                                setBlockStartDate(date);
                                setBlockEndDate(date);
                                setBlockDialogOpen(true);
                              }}
                              title={tooltip}
                              className="p-2 border-r border-white/[0.02] cursor-pointer hover:bg-white/5 transition-all text-center relative"
                            >
                              <div className={cn(
                                "w-6 h-6 rounded-lg mx-auto flex items-center justify-center text-[8px] font-black border uppercase tracking-wider shadow-inner",
                                blockColor
                              )}>
                                {status.substring(0, 2)}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap gap-6 mt-6 justify-center bg-white/[0.02] p-4 rounded-2xl border border-white/5 w-fit mx-auto">
              {[
                { label: 'Available (AV)', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
                { label: 'Reserved (RE)', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
                { label: 'On Trip (ON)', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
                { label: 'Maintenance (MA)', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
                { label: 'Offline (OF)', color: 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20' },
              ].map(indicator => (
                <div key={indicator.label} className="flex items-center gap-2">
                  <div className={cn("w-5 h-5 rounded-md flex items-center justify-center text-[7px] font-black border", indicator.color)}>
                    {indicator.label.split(' ')[0].substring(0, 2).toUpperCase()}
                  </div>
                  <span className="text-[9px] uppercase tracking-widest font-black text-white/40">{indicator.label}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      ) : (
        // ----------------------------------------------------
        // FLEET REGISTRY
        // ----------------------------------------------------
        <div className="space-y-10 animate-in fade-in duration-700">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/[0.01] p-8 rounded-[2rem] border border-white/5">
            <div>
              <h3 className="text-xl font-display font-black text-white">Registry Management</h3>
              <p className="text-[10px] text-white/30 font-black uppercase tracking-widest mt-1">Deploy, reconfigure, or decommission physical transport assets in the registry</p>
            </div>
            <Button onClick={openCreateDialog} className="bg-kashmir-gold text-black hover:bg-amber-500 font-black px-8 h-12 rounded-xl shadow-xl shadow-kashmir-gold/10 flex items-center gap-2">
              <Plus className="h-4.5 w-4.5" /> 
              <span className="text-[9px] uppercase tracking-[0.2em]">Deploy Vehicle</span>
            </Button>
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block bg-white/[0.01] border border-white/5 rounded-[2.5rem] overflow-hidden backdrop-blur-3xl shadow-inner relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-kashmir-gold/[0.02] to-transparent pointer-events-none" />
            <Table>
              <TableHeader className="bg-white/[0.02] border-b border-white/5">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="text-white/20 uppercase text-[9px] font-black tracking-[0.4em] py-8 pl-10">Vehicle Node</TableHead>
                  <TableHead className="text-white/20 uppercase text-[9px] font-black tracking-[0.4em]">Ownership Model</TableHead>
                  <TableHead className="text-white/20 uppercase text-[9px] font-black tracking-[0.4em]">Logistics Specs</TableHead>
                  <TableHead className="text-white/20 uppercase text-[9px] font-black tracking-[0.4em]">Pricing Model</TableHead>
                  <TableHead className="text-white/20 uppercase text-[9px] font-black tracking-[0.4em]">Driver Default</TableHead>
                  <TableHead className="text-white/20 uppercase text-[9px] font-black tracking-[0.4em]">Status</TableHead>
                  <TableHead className="text-white/20 uppercase text-[9px] font-black tracking-[0.4em] text-right pr-10">Controls</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-white/5">
                {cabs.map((cab) => {
                  const meta = operationsData.cabsMetadata[cab.id] || {};
                  return (
                    <TableRow key={cab.id} className="hover:bg-white/[0.02] transition-all duration-500 border-none group/row">
                      <TableCell className="py-8 pl-10">
                        <div className="flex items-center gap-6">
                          <div className="w-16 h-16 rounded-[1.25rem] bg-white/5 overflow-hidden border border-white/10 flex items-center justify-center shadow-2xl relative group/img">
                            {cab.image ? (
                              <img src={cab.image} alt={cab.name} className="w-full h-full object-cover" />
                            ) : (
                              <Car className="w-6 h-6 text-kashmir-gold/40" />
                            )}
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-white font-bold tracking-tight text-base group-hover/row:text-kashmir-gold transition-colors">{cab.name}</span>
                            <span className="text-[10px] text-white/30 font-black uppercase tracking-widest">{cab.type}</span>
                            {meta.registrationNo && (
                              <span className="text-[9px] font-bold text-white/20 uppercase">{meta.registrationNo}</span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn(
                          "rounded-md border-none px-2 py-0.5 text-[8px] font-black uppercase tracking-wider",
                          meta.ownership === 'vendor' ? "bg-purple-500/10 text-purple-400" : "bg-blue-500/10 text-blue-400"
                        )}>
                          {meta.ownership === 'vendor' ? 'Vendor-Owned' : 'Company-Owned'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-white/20" />
                          <span className="text-white/80 text-sm font-bold">{cab.capacity} Seats</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-kashmir-gold font-black text-base">₹{cab.pricePerKm}/km</span>
                          <span className="text-[10px] text-white/20 font-bold uppercase tracking-tighter">Base: ₹{cab.basePrice}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {meta.driverName ? (
                          <div className="flex flex-col text-xs">
                            <span className="font-bold text-white/80">{meta.driverName}</span>
                            <span className="text-[9px] text-white/30 mt-0.5">{meta.driverPhone}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-white/20 italic">Not Assigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <button onClick={() => toggleActive(cab)} className="group/toggle">
                          <Badge className={cn(
                            "rounded-xl border-none px-4 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-300",
                            cab.isActive ? "bg-emerald-500/10 text-emerald-400 group-hover/toggle:bg-emerald-500/20" : "bg-red-500/10 text-red-400 group-hover/toggle:bg-red-500/20"
                          )}>
                            {cab.isActive ? 'Online' : 'Offline'}
                          </Badge>
                        </button>
                      </TableCell>
                      <TableCell className="text-right pr-10">
                        <div className="flex justify-end gap-3 opacity-20 group-hover/row:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(cab)} className="w-12 h-12 bg-white/5 border border-white/5 rounded-2xl text-white/40 hover:text-white hover:border-white/20 transition-all">
                            <Pencil className="w-5 h-5" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => { setItemToDelete(cab.id); setDeleteConfirmOpen(true); }} className="w-12 h-12 bg-white/5 border border-white/5 rounded-2xl text-white/20 hover:text-red-400 hover:border-red-400/20 transition-all">
                            <Trash2 className="w-5 h-5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards View */}
          <div className="lg:hidden space-y-6">
            {cabs.map((cab) => {
              const meta = operationsData.cabsMetadata[cab.id] || {};
              return (
                <Card key={cab.id} className="bg-white/[0.02] border-white/5 p-8 rounded-[2.5rem] space-y-6 relative overflow-hidden group">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-[1.5rem] bg-white/5 overflow-hidden border border-white/10 shrink-0 shadow-2xl relative">
                      {cab.image ? (
                        <img src={cab.image} alt={cab.name} className="w-full h-full object-cover" />
                      ) : (
                        <Car className="w-8 h-8 text-kashmir-gold/40 m-6" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-white tracking-tight truncate leading-tight">{cab.name}</h3>
                      <div className="flex items-center gap-2 mt-2">
                         <Badge variant="outline" className="border-white/10 text-white/30 text-[8px] font-black uppercase tracking-widest px-2 py-0.5">{cab.type}</Badge>
                         <div className="w-1 h-1 rounded-full bg-white/20" />
                         <span className="text-[10px] text-white/40 font-bold uppercase truncate">{cab.capacity} Seats</span>
                      </div>
                      <div className="mt-2 flex gap-2">
                        <Badge className={cn(
                          "rounded-md border-none px-2 py-0.5 text-[8px] font-black uppercase tracking-wider",
                          meta.ownership === 'vendor' ? "bg-purple-500/10 text-purple-400" : "bg-blue-500/10 text-blue-400"
                        )}>
                          {meta.ownership === 'vendor' ? 'Vendor-Owned' : 'Company-Owned'}
                        </Badge>
                        {meta.registrationNo && (
                          <span className="text-[9px] font-bold text-white/40 uppercase bg-white/5 px-2 py-0.5 rounded border border-white/5">{meta.registrationNo}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6 py-6 border-t border-b border-white/5">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black uppercase tracking-widest text-white/20">Pricing Model</p>
                      <p className="text-2xl font-black text-kashmir-gold tracking-tighter">₹{cab.pricePerKm}/<span className="text-xs">km</span></p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-black uppercase tracking-widest text-white/20">Driver Assigned</p>
                      <p className="text-xs font-bold text-white/70">{meta.driverName || 'None'}</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button onClick={() => openEditDialog(cab)} className="flex-1 bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 h-14 rounded-2xl font-black transition-all">
                      <Pencil className="w-4 h-4 mr-2" />
                      <span className="text-[9px] uppercase tracking-widest">Edit Node</span>
                    </Button>
                    <Button 
                      onClick={() => {
                        setItemToDelete(cab.id);
                        setDeleteConfirmOpen(true);
                      }} 
                      className="w-14 bg-red-500/5 border border-red-500/10 text-red-400/60 hover:text-red-400 hover:bg-red-500/10 h-14 rounded-2xl transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Fleet hero config section */}
          <Card className="bg-white/[0.01] border-white/5 rounded-[2.5rem] p-8 backdrop-blur-3xl relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-kashmir-gold/[0.02] to-transparent pointer-events-none" />
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div>
                <h3 className="text-xl font-display font-black text-white uppercase tracking-tight flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-kashmir-gold" />
                  Fleet Page Hero Configuration
                </h3>
                <p className="text-[10px] text-white/30 font-black uppercase tracking-widest mt-1">Configure the main background asset and hero copy for the public Fleet page</p>
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
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1 block">Fleet Page Headline</label>
                    <Input
                      className="bg-white/5 border-white/10 rounded-xl h-12 text-white placeholder-white/20 focus:border-kashmir-gold/50 transition-all font-bold"
                      value={heroTitle}
                      onChange={(e) => setHeroTitle(e.target.value)}
                      placeholder="e.g., Premium Transport"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1 block">Fleet Page Subheadline</label>
                    <Textarea
                      className="bg-white/5 border-white/10 rounded-xl min-h-[96px] text-white placeholder-white/20 focus:border-kashmir-gold/50 transition-all resize-none font-medium leading-relaxed"
                      value={heroSubtitle}
                      onChange={(e) => setHeroSubtitle(e.target.value)}
                      placeholder="e.g., Reliable cab services for airport transfers, local sightseeing, and outstation trips."
                    />
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ----------------------------------------------------
          MODALS & DIALOGS
          ---------------------------------------------------- */}

      {/* Date blocker dialog */}
      <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <DialogContent className="max-w-md bg-[#0a0f12] border-white/10 text-white rounded-[2rem] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-transparent pointer-events-none" />
          <DialogHeader className="p-8 pb-0">
            <DialogTitle className="text-2xl font-display font-black tracking-tight text-white flex items-center gap-2">
              <Wrench className="w-5 h-5 text-orange-400" />
              Schedule Maintenance Block
            </DialogTitle>
          </DialogHeader>
          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Select Vehicle</label>
              <select
                value={blockCabId}
                onChange={(e) => setBlockCabId(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl h-12 px-4 text-xs font-bold text-white focus:border-kashmir-gold/50 focus:outline-none"
              >
                <option value="" className="bg-[#0a0f12] text-white/40">Select Vehicle Node...</option>
                {cabs.map(c => {
                  const meta = operationsData.cabsMetadata[c.id] || {};
                  return (
                    <option key={c.id} value={c.id} className="bg-[#0a0f12]">
                      {c.name} ({meta.registrationNo || 'No Reg No'})
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Start Date</label>
                <Input
                  type="date"
                  className="bg-white/5 border-white/10 rounded-xl h-12 text-xs text-white"
                  value={blockStartDate}
                  onChange={(e) => setBlockStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">End Date</label>
                <Input
                  type="date"
                  className="bg-white/5 border-white/10 rounded-xl h-12 text-xs text-white"
                  value={blockEndDate}
                  onChange={(e) => setBlockEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 p-4 bg-white/5 rounded-2xl border border-white/5">
              <button 
                onClick={() => setBlockStatus('Maintenance')}
                className={cn(
                  "py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all duration-300",
                  blockStatus === 'Maintenance' ? "bg-orange-500/10 text-orange-400 border-orange-500/20" : "border-transparent text-white/40"
                )}
              >
                🛠️ Maintenance
              </button>
              <button 
                onClick={() => setBlockStatus('Offline')}
                className={cn(
                  "py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all duration-300",
                  blockStatus === 'Offline' ? "bg-neutral-500/10 text-neutral-400 border-neutral-500/20" : "border-transparent text-white/40"
                )}
              >
                💤 Offline
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Reason / Note</label>
              <Textarea
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                className="bg-white/5 border-white/10 rounded-xl min-h-[80px] resize-none text-xs"
                placeholder="Engine service, tire replacements, chauffeur sick leave, etc."
              />
            </div>

            <Button 
              onClick={handleBlockDates} 
              disabled={blockingDates}
              className="w-full h-14 bg-orange-500 text-white hover:bg-orange-600 font-black rounded-2xl transition-all shadow-xl shadow-orange-500/10 text-[10px] uppercase tracking-widest"
            >
              {blockingDates ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Apply Date Block'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Allocation Drawer/Modal */}
      <Dialog open={allocationDialogOpen} onOpenChange={setAllocationDialogOpen}>
        <DialogContent className="max-w-3xl bg-[#0a0f12] border-white/10 text-white rounded-[2rem] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-kashmir-gold/5 via-transparent to-transparent pointer-events-none" />
          <DialogHeader className="p-8 pb-0">
            <DialogTitle className="text-2xl font-display font-black tracking-tight">
              Vehicle Allocation Engine
            </DialogTitle>
            <p className="text-white/40 text-xs mt-1">Assign a vehicle, Chauffeur details, and calculate transport costs for "{selectedBookingForAlloc?.itemName}"</p>
          </DialogHeader>

          <div className="p-8 space-y-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
            {/* Allocation Conflicts Warnings */}
            {checkAllocationConflicts().length > 0 && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex gap-3 text-red-400 animate-pulse">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <div className="text-xs">
                  <p className="font-bold">Booking Conflict Detected:</p>
                  <ul className="list-disc list-inside mt-1 space-y-0.5">
                    {checkAllocationConflicts().map((conf, i) => (
                      <li key={i}>{conf}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: Logistics Info */}
              <div className="space-y-6">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-kashmir-gold border-b border-white/5 pb-2">Logistics Assignment</h4>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Select Chauffeur Node / Vehicle</label>
                  <select
                    value={allocatedCabId}
                    onChange={(e) => handleCabChange(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl h-12 px-4 text-xs font-bold text-white focus:border-kashmir-gold/50 focus:outline-none"
                  >
                    <option value="" className="bg-[#0a0f12] text-white/40">Select Vehicle Node...</option>
                    {cabs.map(c => {
                      const meta = operationsData.cabsMetadata[c.id] || {};
                      const status = resolveCabStatusForToday(c);
                      return (
                        <option key={c.id} value={c.id} className="bg-[#0a0f12]">
                          {c.name} ({meta.registrationNo || 'No Reg No'}) - {status}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Registration No</label>
                    <Input
                      className="bg-white/5 border-white/10 rounded-xl h-12 text-xs"
                      value={dispatchRegNo}
                      onChange={(e) => setDispatchRegNo(e.target.value)}
                      placeholder="e.g. JK-01-A-1234"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Driver Name</label>
                    <Input
                      className="bg-white/5 border-white/10 rounded-xl h-12 text-xs"
                      value={dispatchDriverName}
                      onChange={(e) => setDispatchDriverName(e.target.value)}
                      placeholder="e.g. Fayaz Ahmad"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Driver WhatsApp Contact</label>
                  <Input
                    className="bg-white/5 border-white/10 rounded-xl h-12 text-xs"
                    value={dispatchDriverPhone}
                    onChange={(e) => setDispatchDriverPhone(e.target.value)}
                    placeholder="e.g. +919876543210"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Pickup Date & Time</label>
                    <Input
                      type="datetime-local"
                      className="bg-white/5 border-white/10 rounded-xl h-12 text-xs text-white"
                      value={dispatchPickupDateTime}
                      onChange={(e) => setDispatchPickupDateTime(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Drop Date & Time</label>
                    <Input
                      type="datetime-local"
                      className="bg-white/5 border-white/10 rounded-xl h-12 text-xs text-white"
                      value={dispatchDropDateTime}
                      onChange={(e) => setDispatchDropDateTime(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Pickup Location</label>
                    <Input
                      className="bg-white/5 border-white/10 rounded-xl h-12 text-xs"
                      value={dispatchPickupLoc}
                      onChange={(e) => setDispatchPickupLoc(e.target.value)}
                      placeholder="e.g. Srinagar Airport"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Drop Location</label>
                    <Input
                      className="bg-white/5 border-white/10 rounded-xl h-12 text-xs"
                      value={dispatchDropLoc}
                      onChange={(e) => setDispatchDropLoc(e.target.value)}
                      placeholder="e.g. Gulmarg Hotel"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Financial Intelligence */}
              <div className="space-y-6">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-kashmir-gold border-b border-white/5 pb-2">Financial Calculator</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Estimated Distance (KM)</label>
                    <Input
                      type="number"
                      className="bg-white/5 border-white/10 rounded-xl h-12 text-xs"
                      value={dispatchEstKm}
                      onChange={(e) => setDispatchEstKm(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Driver Allowance (₹)</label>
                    <Input
                      type="number"
                      className="bg-white/5 border-white/10 rounded-xl h-12 text-xs"
                      value={dispatchDriverAllowance}
                      onChange={(e) => setDispatchDriverAllowance(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Fuel / Diesel Costs (₹)</label>
                    <Input
                      type="number"
                      className="bg-white/5 border-white/10 rounded-xl h-12 text-xs"
                      value={dispatchFuel}
                      onChange={(e) => setDispatchFuel(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Tolls & Parking (₹)</label>
                    <Input
                      type="number"
                      className="bg-white/5 border-white/10 rounded-xl h-12 text-xs"
                      value={dispatchTolls}
                      onChange={(e) => setDispatchTolls(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Vendor Payout (₹)</label>
                    <Input
                      type="number"
                      className="bg-white/5 border-white/10 rounded-xl h-12 text-xs font-bold text-purple-400"
                      value={dispatchVendorPayout}
                      onChange={(e) => setDispatchVendorPayout(Number(e.target.value))}
                      placeholder="Only if Vendor Owned"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Other / Miscellaneous (₹)</label>
                    <Input
                      type="number"
                      className="bg-white/5 border-white/10 rounded-xl h-12 text-xs"
                      value={dispatchOther}
                      onChange={(e) => setDispatchOther(Number(e.target.value))}
                    />
                  </div>
                </div>

                {/* Profit Margin Analysis Box */}
                {allocatedCabId && (
                  (() => {
                    const cab = cabs.find(c => c.id === allocatedCabId);
                    if (!cab) return null;
                    const pKm = cab.pricePerKm || 0;
                    const baseCost = cab.basePrice || 0;
                    const cabRevenue = baseCost + (dispatchEstKm * pKm);
                    const customerFare = selectedBookingForAlloc.totalAmount > 0 
                      ? selectedBookingForAlloc.totalAmount 
                      : cabRevenue;
                    const totalCost = dispatchDriverAllowance + dispatchFuel + dispatchTolls + dispatchVendorPayout + dispatchOther;
                    const profit = customerFare - totalCost;
                    const profitPercent = customerFare > 0 ? (profit / customerFare) * 100 : 0;
                    const isProfitable = profit >= 0;

                    return (
                      <div className={cn(
                        "p-6 rounded-2xl border backdrop-blur-md relative overflow-hidden space-y-4",
                        isProfitable ? "bg-emerald-500/5 border-emerald-500/10" : "bg-red-500/5 border-red-500/10"
                      )}>
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-white/40">
                            {selectedBookingForAlloc.totalAmount > 0 ? "NEGOTIATED FARE (REVENUE):" : "CALCULATED REVENUE:"}
                          </span>
                          <span className="font-black text-white">₹{customerFare.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs border-b border-white/5 pb-2">
                          <span className="font-bold text-white/40">OPERATIONAL EXPENSES:</span>
                          <span className="font-black text-white text-xs">₹{totalCost.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                          <div className="flex flex-col">
                            <span className="text-[9px] font-black uppercase tracking-widest text-white/30">Net Profit Margin</span>
                            <span className={cn("text-xl font-display font-black mt-1", isProfitable ? "text-emerald-400" : "text-red-400")}>
                              ₹{profit.toLocaleString()}
                            </span>
                          </div>
                          <Badge className={cn(
                            "border-none rounded-lg px-3 py-1 font-black text-[10px]",
                            isProfitable ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                          )}>
                            {profitPercent.toFixed(1)}%
                          </Badge>
                        </div>
                      </div>
                    );
                  })()
                )}
              </div>
            </div>

            <Button 
              onClick={handleSaveAllocation} 
              disabled={saving}
              className="w-full h-14 bg-kashmir-gold text-black hover:bg-amber-500 font-black rounded-2xl transition-all shadow-xl shadow-kashmir-gold/10 text-[10px] uppercase tracking-widest mt-4"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Chauffeur Allocation'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Deploy Cab Dialog (Modified to support operations settings overrides) */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl bg-[#0a0f12] border-white/10 text-white rounded-[2rem] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-kashmir-gold/5 via-transparent to-transparent pointer-events-none" />
          <DialogHeader className="p-8 pb-0">
            <DialogTitle className="text-2xl font-display font-black tracking-tight">{editingCab ? 'Reconfigure Fleet Node' : 'Deploy New Vehicle Node'}</DialogTitle>
          </DialogHeader>
          <div className="p-8 space-y-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
            
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-kashmir-gold border-b border-white/5 pb-2">Part 1: Public Specifications</h4>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Vehicle Name</label>
                <Input
                  className="bg-white/5 border-white/10 rounded-xl h-12 focus:border-kashmir-gold/50 transition-all font-bold"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Innova Crysta Luxury"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Vehicle Class / Category</label>
                <Input
                  className="bg-white/5 border-white/10 rounded-xl h-12 focus:border-kashmir-gold/50 transition-all font-bold"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  placeholder="e.g., Luxury SUV"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Seating Capacity</label>
                <Input
                  type="number"
                  className="bg-white/5 border-white/10 rounded-xl h-12 font-bold"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Price Per KM (₹)</label>
                <Input
                  type="number"
                  step="0.5"
                  className="bg-white/5 border-white/10 rounded-xl h-12 font-bold text-kashmir-gold"
                  value={formData.pricePerKm}
                  onChange={(e) => setFormData({ ...formData, pricePerKm: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Base Rental Price (₹)</label>
                <Input
                  type="number"
                  className="bg-white/5 border-white/10 rounded-xl h-12 font-bold"
                  value={formData.basePrice}
                  onChange={(e) => setFormData({ ...formData, basePrice: Number(e.target.value) })}
                />
              </div>
            </div>

            {/* Part 2: Operations Overrides */}
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-kashmir-gold border-b border-white/5 pb-2 pt-2">Part 2: Operational Dispatch Settings</h4>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Ownership Model</label>
                <select
                  value={metaFormData.ownership || 'company'}
                  onChange={(e) => setMetaFormData({ ...metaFormData, ownership: e.target.value as 'company' | 'vendor' })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl h-12 px-4 text-xs font-bold text-white focus:outline-none focus:border-kashmir-gold/50"
                >
                  <option value="company" className="bg-[#0a0f12]">Company Owned (Kashmir Curators)</option>
                  <option value="vendor" className="bg-[#0a0f12]">Vendor Owned (Contracted)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Vehicle License Plate (Registration No)</label>
                <Input
                  className="bg-white/5 border-white/10 rounded-xl h-12 text-xs font-bold uppercase"
                  value={metaFormData.registrationNo}
                  onChange={(e) => setMetaFormData({ ...metaFormData, registrationNo: e.target.value.toUpperCase() })}
                  placeholder="e.g. JK-01-A-1234"
                />
              </div>
            </div>

            {metaFormData.ownership === 'vendor' && (
              <div className="grid grid-cols-2 gap-6 p-4 bg-purple-500/5 border border-purple-500/10 rounded-2xl animate-in slide-in-from-top-2 duration-300">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Vendor Agency Name</label>
                  <Input
                    className="bg-white/5 border-white/10 rounded-xl h-12 text-xs"
                    value={metaFormData.vendorName}
                    onChange={(e) => setMetaFormData({ ...metaFormData, vendorName: e.target.value })}
                    placeholder="e.g., Mountain Cab Association"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Vendor Phone Contact</label>
                  <Input
                    className="bg-white/5 border-white/10 rounded-xl h-12 text-xs"
                    value={metaFormData.vendorPhone}
                    onChange={(e) => setMetaFormData({ ...metaFormData, vendorPhone: e.target.value })}
                    placeholder="e.g., +919876543211"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Default Driver Chauffeur</label>
                <Input
                  className="bg-white/5 border-white/10 rounded-xl h-12 text-xs"
                  value={metaFormData.driverName}
                  onChange={(e) => setMetaFormData({ ...metaFormData, driverName: e.target.value })}
                  placeholder="e.g. Shabir Ahmad"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Driver WhatsApp Contact</label>
                <Input
                  className="bg-white/5 border-white/10 rounded-xl h-12 text-xs"
                  value={metaFormData.driverPhone}
                  onChange={(e) => setMetaFormData({ ...metaFormData, driverPhone: e.target.value })}
                  placeholder="e.g. +919876543210"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Primary Asset Image</label>
              <MediaPicker
                value={formData.image || ''}
                onChange={(url) => setFormData({ ...formData, image: url })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Fleet Intelligence (Features)</label>
              <Textarea
                className="bg-white/5 border-white/10 rounded-xl min-h-[100px] resize-none"
                value={featuresInput}
                onChange={(e) => setFeaturesInput(e.target.value)}
                placeholder="Heated Seats&#10;Panoramic Roof&#10;Complimentary Wi-Fi"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white">System Visibility</span>
                <span className="text-[9px] text-white/30 uppercase tracking-widest font-black">Active in Public Fleet</span>
              </div>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>

            <Button onClick={handleSave} className="w-full h-14 bg-kashmir-gold text-black hover:bg-amber-500 font-black rounded-2xl transition-all shadow-xl shadow-kashmir-gold/10" disabled={saving}>
              {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : (editingCab ? 'Update Deployment' : 'Confirm Deployment')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Chauffeur WhatsApp Preview Modal */}
      <Dialog open={whatsappPreviewOpen} onOpenChange={setWhatsappPreviewOpen}>
        <DialogContent className="max-w-md bg-[#0a0f12] border-white/10 text-white rounded-[2rem] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-transparent pointer-events-none" />
          <DialogHeader className="p-8 pb-0">
            <DialogTitle className="text-2xl font-display font-black tracking-tight text-white flex items-center gap-2">
              <Send className="w-5 h-5 text-green-400" />
              Chauffeur Notification Dispatch
            </DialogTitle>
          </DialogHeader>
          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">WhatsApp message contents</label>
              <Textarea
                className="bg-white/5 border border-white/10 rounded-xl min-h-[260px] text-xs font-mono leading-relaxed"
                value={whatsappMsgText}
                onChange={(e) => setWhatsappMsgText(e.target.value)}
              />
            </div>
            
            <div className="flex gap-4">
              <Button 
                variant="ghost"
                onClick={() => setWhatsappPreviewOpen(false)}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white h-12 rounded-xl text-[10px] uppercase font-black tracking-widest"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSendWhatsapp}
                disabled={sendingWhatsapp}
                className="flex-1 bg-emerald-500 text-black hover:bg-emerald-600 font-black h-12 rounded-xl text-[10px] uppercase tracking-widest"
              >
                {sendingWhatsapp ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Dispatch Message'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Voucher Preview & Printable Dialog */}
      <Dialog open={voucherDialogOpen} onOpenChange={setVoucherDialogOpen}>
        <DialogContent className="max-w-4xl bg-white text-black p-0 rounded-3xl overflow-hidden border-none shadow-2xl">
          <div className="p-8 space-y-8 overflow-y-auto max-h-[80vh] print:p-0 printable-area">
            {selectedBookingForVoucher && (
              (() => {
                const b = selectedBookingForVoucher;
                const alloc = b.details?.cabAllocation;
                if (!alloc) return null;
                const pricing = alloc.pricing;

                return (
                  <div className="space-y-8 p-6">
                    {/* Header */}
                    <div className="flex justify-between items-start border-b-2 border-black/10 pb-6">
                      <div className="space-y-1">
                        <h1 className="text-2xl font-black tracking-tighter uppercase font-display text-amber-600">KASHMIR CURATORS</h1>
                        <p className="text-[9px] uppercase tracking-widest text-black/50 font-black">Bespoke Travel Atelier & Concierge</p>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-amber-600 text-white border-none font-bold uppercase text-[9px] tracking-widest">
                          CONFIRMED DISPATCH VOUCHER
                        </Badge>
                        <p className="text-[10px] font-black text-black/40 mt-2">Voucher No: {alloc.voucherNo}</p>
                      </div>
                    </div>

                    {/* Booking Details Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 bg-neutral-50 p-6 rounded-2xl border border-neutral-100">
                      <div className="space-y-1">
                        <p className="text-[8px] font-black uppercase tracking-widest text-black/30">CLIENT GUEST</p>
                        <p className="text-sm font-bold">{b.user.name}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[8px] font-black uppercase tracking-widest text-black/30">CLIENT CONTACT</p>
                        <p className="text-sm font-bold">{b.user.phone || 'N/A'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[8px] font-black uppercase tracking-widest text-black/30">BOOKING REFERENCE</p>
                        <p className="text-sm font-mono font-bold">{b.id.slice(0, 8).toUpperCase()}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[8px] font-black uppercase tracking-widest text-black/30">DEPARTURE DATE</p>
                        <p className="text-sm font-bold">{new Date(b.bookingDate).toLocaleDateString()}</p>
                      </div>
                    </div>

                    {/* Vehicle & Chauffeur Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Vehicle Spec */}
                      <div className="space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-widest text-black/40 border-b border-black/10 pb-2">Vehicle Specification</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-0.5">
                            <span className="text-[9px] font-black text-black/30 block">VEHICLE NODE</span>
                            <span className="text-sm font-bold">{alloc.cabName}</span>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[9px] font-black text-black/30 block">LICENSE PLATE NO</span>
                            <span className="text-sm font-bold uppercase">{alloc.registrationNo || 'No reg'}</span>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[9px] font-black text-black/30 block">VEHICLE CLASS</span>
                            <span className="text-xs font-bold uppercase">{alloc.cabType}</span>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[9px] font-black text-black/30 block">OWNERSHIP MODEL</span>
                            <span className="text-xs font-bold uppercase">
                              {alloc.ownership === 'vendor' ? `Vendor (${alloc.vendorName})` : 'Company Owned'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Chauffeur Profile */}
                      <div className="space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-widest text-black/40 border-b border-black/10 pb-2">Chauffeur Profile</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-0.5">
                            <span className="text-[9px] font-black text-black/30 block">CHAUFFEUR NAME</span>
                            <span className="text-sm font-bold">{alloc.driverName}</span>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[9px] font-black text-black/30 block">WHATSAPP CONTACT</span>
                            <span className="text-sm font-bold">{alloc.driverPhone}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Schedule Grid */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-black uppercase tracking-widest text-black/40 border-b border-black/10 pb-2">Pickup & Travel Schedule</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100 flex gap-4">
                          <MapPin className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <span className="text-[8px] font-black text-black/30 block uppercase tracking-widest">Pickup Schedule</span>
                            <p className="text-xs font-bold">{alloc.pickupLocation}</p>
                            <p className="text-[10px] text-black/50">{new Date(alloc.pickupDateTime || '').toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100 flex gap-4">
                          <MapPin className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <span className="text-[8px] font-black text-black/30 block uppercase tracking-widest">Drop Schedule</span>
                            <p className="text-xs font-bold">{alloc.dropLocation}</p>
                            <p className="text-[10px] text-black/50">{new Date(alloc.dropDateTime || '').toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Operational Protocols / Notes */}
                    <div className="p-6 bg-amber-500/5 rounded-2xl border border-amber-500/10 space-y-2">
                      <h4 className="text-xs font-bold text-amber-700">Chauffeur Dispatch Notes & Protocols:</h4>
                      <ol className="list-decimal list-inside text-[11px] text-black/70 space-y-1 leading-relaxed">
                        <li>The vehicle should be washed and cleaned internally prior to arrival.</li>
                        <li>Chauffeur must be dressed in appropriate professional attire.</li>
                        <li>Please carry bottled water and hand sanitizer on all transfers.</li>
                        <li>Maintain a safe, secure, and quiet speed limit. No high-speed driving.</li>
                      </ol>
                    </div>

                    {/* Signatures */}
                    <div className="flex justify-between items-end pt-12 text-center text-[10px] text-black/40">
                      <div className="space-y-4">
                        <div className="w-40 border-b border-black/20" />
                        <p>Authorized Dispatch Signature</p>
                      </div>
                      <div className="space-y-4">
                        <div className="w-40 border-b border-black/20" />
                        <p>Chauffeur Acknowledgement</p>
                      </div>
                    </div>
                  </div>
                );
              })()
            )}
          </div>
          <DialogFooter className="bg-neutral-50 p-6 border-t border-neutral-100 print:hidden flex gap-4 justify-end">
            <Button 
              variant="outline" 
              onClick={() => setVoucherDialogOpen(false)}
              className="border-neutral-200 text-neutral-600 font-bold rounded-xl h-12"
            >
              Close Preview
            </Button>
            <Button 
              onClick={() => window.print()}
              className="bg-kashmir-gold hover:bg-amber-500 text-black font-black px-6 h-12 rounded-xl shadow-lg flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Print Dispatch Voucher</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="bg-[#0a0f12] border-white/10 text-white rounded-[2.5rem]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black">Decommission Transport Node?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              Are you sure you want to decommission this vehicle from the fleet? This action will remove it from the booking engine.
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
