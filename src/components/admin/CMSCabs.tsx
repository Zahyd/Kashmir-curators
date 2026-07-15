import { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Pencil, Trash2, Loader2, Car, Users, Save, Image as ImageIcon, 
  Calendar, Wrench, ShieldAlert, Printer, Send, Clock, Phone, User, 
  MapPin, Sliders, X, DollarSign, Settings, CheckCircle2, AlertTriangle, 
  Play, Navigation, Map, Search, Filter, Sparkles, TrendingUp, BarChart3, 
  Shield, FileText, Check, MessageSquare, AlertOctagon, ArrowRight
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
  // Expiring docs metadata
  insuranceExpiry?: string;
  permitExpiry?: string;
  pollutionExpiry?: string;
  odometerReading?: number;
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
  insuranceExpiry: '2026-12-15',
  permitExpiry: '2027-06-30',
  pollutionExpiry: '2026-09-10',
  odometerReading: 45000,
};

export default function CMSCabs() {
  const { systemEvents } = useTeamAuth();
  const [currentTab, setCurrentTab] = useState<'operations' | 'registry' | 'drivers' | 'ai-dispatch' | 'maintenance' | 'finance' | 'emergency'>('operations');
  const [activeRole, setActiveRole] = useState<'Director' | 'Operations Manager' | 'Dispatcher' | 'Fleet Manager' | 'Driver' | 'Finance' | 'Support'>('Director');
  
  const [cabs, setCabs] = useState<Cab[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [driversList, setDriversList] = useState<any[]>([
    { id: 'drv-1', name: 'Shabir Ahmad', phone: '+919876543210', rating: 4.9, license: 'JK01-2015000329', status: 'Online', attendance: 'Present', earnings: 18450, trips: 28 },
    { id: 'drv-2', name: 'Fayaz Rather', phone: '+919876543212', rating: 4.8, license: 'JK01-2017002492', status: 'On Trip', attendance: 'Present', earnings: 24600, trips: 34 },
    { id: 'drv-3', name: 'Tariq Mir', phone: '+919876543215', rating: 4.7, license: 'JK03-2019001221', status: 'Offline', attendance: 'Absent', earnings: 12100, trips: 15 },
    { id: 'drv-4', name: 'Hilal Dar', phone: '+919876543218', rating: 4.9, license: 'JK05-2014003284', status: 'Online', attendance: 'Present', earnings: 21900, trips: 31 }
  ]);
  
  const [operationsData, setOperationsData] = useState<OperationsData>({
    manualBlockings: [],
    cabsMetadata: {},
    logs: []
  });
  
  const [loading, setLoading] = useState(true);
  const [opsLoading, setOpsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Dialogs
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCab, setEditingCab] = useState<Cab | null>(null);
  const [formData, setFormData] = useState(defaultCab);
  const [featuresInput, setFeaturesInput] = useState('');
  const [metaFormData, setMetaFormData] = useState<CabMetadata>(defaultMetadata);
  
  // Delete confirm states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  
  // Allocations confirm states
  const [deallocateConfirmOpen, setDeallocateConfirmOpen] = useState(false);
  const [bookingToDeallocate, setBookingToDeallocate] = useState<Booking | null>(null);
  
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

  // WhatsApp Dispatch dialog
  const [whatsappPreviewOpen, setWhatsappPreviewOpen] = useState(false);
  const [whatsappBooking, setWhatsappBooking] = useState<Booking | null>(null);
  const [whatsappMsgText, setWhatsappMsgText] = useState('');
  const [sendingWhatsapp, setSendingWhatsapp] = useState(false);

  // AI engine match simulations
  const [runningAI, setRunningAI] = useState(false);
  const [aiMatchOutput, setAiMatchOutput] = useState<string[]>([]);
  const [showAIMatchResult, setShowAIMatchResult] = useState(false);

  // Pricing rules engine
  const [pricingRules, setPricingRules] = useState({
    perKmRate: 25,
    baseCharge: 3500,
    nightCharge: 600,
    driverAllowance: 1500,
    waitingChargePerHour: 200,
    peakSeasonMultiplier: 1.25,
    surgeEnabled: false
  });

  // Maintenance records database
  const [maintenanceRecords, setMaintenanceRecords] = useState([
    { id: 'm-1', vehicle: 'Innova Crysta Luxury', reg: 'JK-01-A-5678', task: 'Engine oil replacement', date: '2026-06-10', cost: 4200, odometer: 42500, workshop: 'Srinagar Toyota Center', status: 'Completed' },
    { id: 'm-2', vehicle: 'Force Urbania Luxury', reg: 'JK-03-B-4321', task: 'Rear tyres rotation & balance', date: '2026-07-02', cost: 1800, odometer: 15900, workshop: 'MRF Tyres City Center', status: 'Completed' },
    { id: 'm-3', vehicle: 'Toyota Fortuner SUV', reg: 'JK-01-E-7777', task: 'Brake pads check', date: '2026-07-18', cost: 3500, odometer: 31200, workshop: 'Valley Garages', status: 'Scheduled' }
  ]);

  // Comms direct chat database
  const [chatMessages, setChatMessages] = useState([
    { id: 1, sender: 'Dispatcher (You)', msg: 'Hi Shabir, guest has landed at SXR Airport. Please make sure the car AC is active and waiting in Column B.', time: '12:40 PM' },
    { id: 2, sender: 'Shabir Ahmad', msg: 'Yes sir, I am already at the arrival point. Holding the Kashmir Curators guest board. AC is configured.', time: '12:42 PM' }
  ]);
  const [typingChat, setTypingChat] = useState('');

  // Emergency breakdown simulation database
  const [breakdownIncidents, setBreakdownIncidents] = useState([
    { id: 'inc-1', vehicle: 'Sedan Dzire', driver: 'Tariq Mir', location: 'Sonamarg Bypass', type: 'Tyre burst', severity: 'Medium', status: 'Backup Assigned' }
  ]);

  // Google Maps simulation vehicle nodes
  const [mapVehicles, setMapVehicles] = useState([
    { id: 'v-1', name: 'JK-01-A-5678 (Innova)', lat: 34.0837, lng: 74.7973, status: 'On Route', driver: 'Shabir Ahmad', passenger: 'Arun Sharma', speed: '48 km/h' },
    { id: 'v-2', name: 'JK-03-B-4321 (Urbania)', lat: 34.2185, lng: 74.8732, status: 'Sightseeing', driver: 'Fayaz Rather', passenger: 'Malhotra Family', speed: '35 km/h' },
    { id: 'v-3', name: 'JK-01-E-7777 (Fortuner)', lat: 34.0522, lng: 74.3800, status: 'Available', driver: 'Hilal Dar', passenger: 'Vacant', speed: '0 km/h' }
  ]);

  const fetchCabs = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/cabs?all=true`);
      if (!response.ok) throw new Error('Fetch failed');
      const data = await response.json();
      
      const sanitized = data.map((cab: any) => {
        const features = typeof cab.features === 'string' ? JSON.parse(cab.features) : (Array.isArray(cab.features) ? cab.features : []);
        
        // Match mapping logic
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
      toast.error('Failed to load command center operations logs');
    } finally {
      setOpsLoading(false);
    }
  };

  useEffect(() => {
    fetchCabs();
    fetchOperationsData();
  }, []);

  useEffect(() => {
    const latestEvent = systemEvents[0];
    if (latestEvent) {
      if (latestEvent.booking && latestEvent.booking.entityType === 'cab') {
        fetchCabs();
      }
      if (latestEvent.message && (
        latestEvent.message.includes('block') || 
        latestEvent.message.includes('booking') || 
        latestEvent.message.includes('Cab Settings')
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
    const meta = operationsData.cabsMetadata[cab.id] || defaultMetadata;
    setMetaFormData(meta);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.type) {
      toast.error('Vehicle name and type are required');
      return;
    }

    setSaving(true);
    const token = localStorage.getItem('teamToken');
    const method = editingCab ? 'PATCH' : 'POST';
    const url = editingCab ? `${API_BASE_URL}/cabs/${editingCab.id}` : `${API_BASE_URL}/cabs`;

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
        const cabId = editingCab ? editingCab.id : savedCab.id;
        
        await fetch(`${API_BASE_URL}/cabs/operations/settings/${cabId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(metaFormData)
        });

        toast.success(editingCab ? 'Vehicle records updated' : 'New fleet vehicle registered');
        setDialogOpen(false);
        fetchCabs();
        fetchOperationsData();
      } else {
        const errData = await response.json();
        toast.error(errData.error || 'Operations setup failed');
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
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        toast.success('Vehicle decommissioned successfully');
        setDeleteConfirmOpen(false);
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
        toast.error('Failed to change availability status');
      }
    } catch (error: any) {
      toast.error('Connection failure');
    }
  };

  const handleBlockDates = async () => {
    if (!blockCabId || !blockStartDate || !blockEndDate) {
      toast.error('Vehicle, start date, and end date are required');
      return;
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
        toast.success(`Vehicle successfully blocked for ${blockStatus}`);
        setBlockDialogOpen(false);
        setBlockReason('');
        fetchOperationsData();
      } else {
        toast.error('Failed to register block');
      }
    } catch (error: any) {
      toast.error('Connection failure');
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
        toast.success('Downtime block removed');
        fetchOperationsData();
      } else {
        toast.error('Failed to release block');
      }
    } catch (error) {
      toast.error('Connection failure');
    }
  };

  const openAllocationDialog = (booking: Booking) => {
    setSelectedBookingForAlloc(booking);
    const alloc = booking.details?.cabAllocation;
    
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
        setDispatchEstKm(pricing.estimatedKm || 120);
        setDispatchDriverAllowance(pricing.driverAllowance || 1500);
        setDispatchFuel(pricing.fuelExpenses || 3000);
        setDispatchTolls(pricing.tollsExpenses || 500);
        setDispatchVendorPayout(pricing.vendorPayout || 0);
        setDispatchOther(pricing.otherExpenses || 0);
      }
    } else {
      setAllocatedCabId('');
      setDispatchRegNo('');
      setDispatchDriverName('');
      setDispatchDriverPhone('');
      
      const bookDateStr = booking.bookingDate ? booking.bookingDate.split('T')[0] : new Date().toISOString().split('T')[0];
      const details = booking.details;
      
      setDispatchPickupDateTime(details?.pickupDateTime ? details.pickupDateTime.slice(0, 16) : `${bookDateStr}T09:00`);
      setDispatchDropDateTime(details?.dropDateTime ? details.dropDateTime.slice(0, 16) : `${bookDateStr}T18:00`);
      setDispatchPickupLoc(details?.pickupLocation || 'Srinagar Airport');
      setDispatchDropLoc(details?.dropLocation || 'Gulmarg Meadow');
      setDispatchEstKm(details?.estimatedDistance || 120);
      setDispatchDriverAllowance(1500);
      setDispatchFuel(2500);
      setDispatchTolls(400);
      setDispatchVendorPayout(0);
      setDispatchOther(0);
    }
    setAllocationDialogOpen(true);
  };

  const handleCabChange = (cabId: string) => {
    setAllocatedCabId(cabId);
    const cab = cabs.find(c => c.id === cabId);
    const meta = operationsData.cabsMetadata[cabId] || {};
    
    setDispatchRegNo(meta.registrationNo || '');
    setDispatchDriverName(meta.driverName || '');
    setDispatchDriverPhone(meta.driverPhone || '');
    setDispatchVendorPayout(meta.ownership === 'vendor' ? (cab ? cab.basePrice : 0) : 0);
  };

  const handleSaveAllocation = async () => {
    if (!selectedBookingForAlloc || !allocatedCabId) return;

    const cab = cabs.find(c => c.id === allocatedCabId);
    if (!cab) return;

    const meta = operationsData.cabsMetadata[allocatedCabId] || {};
    const totalCost = Number(dispatchDriverAllowance) + Number(dispatchFuel) + Number(dispatchTolls) + Number(dispatchVendorPayout) + Number(dispatchOther);
    const margin = selectedBookingForAlloc.totalAmount - totalCost;
    const marginPercent = selectedBookingForAlloc.totalAmount > 0 ? (margin / selectedBookingForAlloc.totalAmount) * 100 : 0;

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
        pricing: {
          pricePerKm: cab.pricePerKm,
          estimatedKm: Number(dispatchEstKm),
          baseCost: cab.basePrice,
          driverAllowance: Number(dispatchDriverAllowance),
          fuelExpenses: Number(dispatchFuel),
          tollsExpenses: Number(dispatchTolls),
          vendorPayout: Number(dispatchVendorPayout),
          otherExpenses: Number(dispatchOther),
          totalCost,
          margin,
          marginPercent
        },
        voucherGenerated: true,
        voucherNo: selectedBookingForAlloc.details?.cabAllocation?.voucherNo || `VOUCH-${Math.floor(1000 + Math.random() * 9000)}`,
        whatsappSent: false
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
        body: JSON.stringify({ details: updatedDetails })
      });

      if (response.ok) {
        toast.success('Operational allocation registered successfully!');
        setAllocationDialogOpen(false);
        fetchOperationsData();
      } else {
        toast.error('Failed to register allocation details.');
      }
    } catch (e) {
      toast.error('Network connection error.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDeallocate = async (booking: Booking) => {
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
        body: JSON.stringify({ details: updatedDetails })
      });

      if (response.ok) {
        toast.success('Allocation released successfully');
        setDeallocateConfirmOpen(false);
        fetchOperationsData();
      } else {
        toast.error('Failed to release allocation');
      }
    } catch (e) {
      toast.error('Network error');
    }
  };

  const openWhatsappPreview = (booking: Booking) => {
    const alloc = booking.details?.cabAllocation;
    if (!alloc) return;
    setWhatsappBooking(booking);
    setWhatsappMsgText(`*KASHMIR CURATORS VIP DISPATCH* 🏔️\n\nDear Guest *${booking.user.name}*,\nYour premium transit has been assigned.\n\n*Vehicle Details:*\n- Car: ${alloc.cabName} (${alloc.cabType})\n- Plate No: ${alloc.registrationNo}\n\n*Chauffeur Profile:*\n- Chauffeur: ${alloc.driverName}\n- Contact/WhatsApp: ${alloc.driverPhone}\n\n*Pickup details:*\n- Location: ${alloc.pickupLocation}\n- Time: ${new Date(alloc.pickupDateTime || '').toLocaleString()}\n\nHave a safe and beautiful journey! Contact support 24/7 at +919876543299.`);
    setWhatsappPreviewOpen(true);
  };

  const handleSendWhatsapp = async () => {
    if (!whatsappBooking) return;
    setSendingWhatsapp(true);
    
    // Simulate API call to WhatsApp Business API
    setTimeout(async () => {
      const token = localStorage.getItem('teamToken');
      const updatedDetails = {
        ...whatsappBooking.details,
        cabAllocation: {
          ...whatsappBooking.details.cabAllocation,
          whatsappSent: true
        }
      };

      try {
        await fetch(`${API_BASE_URL}/bookings/${whatsappBooking.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ details: updatedDetails })
        });
        toast.success('Dispatch notification sent to guest and chauffeur via WhatsApp!');
        setWhatsappPreviewOpen(false);
        fetchOperationsData();
      } catch (e) {
        toast.error('Failed to log WhatsApp status');
      } finally {
        setSendingWhatsapp(false);
      }
    }, 1500);
  };

  // AI Dispatch Engine auto assignment simulation
  const runAIDispatchEngine = () => {
    setRunningAI(true);
    setAiMatchOutput([]);
    setShowAIMatchResult(true);

    const logMessage = (msg: string, delay: number) => {
      setTimeout(() => {
        setAiMatchOutput(prev => [...prev, `[AI Engine] ${msg}`]);
      }, delay);
    };

    logMessage("Initializing Auto-Dispatch protocols...", 300);
    logMessage("Scanning available vehicles near pickup regions...", 800);
    logMessage("Analyzing driver ratings, compliance, and experience matrix...", 1400);
    logMessage("Optimizing proximity based on live traffic corridors...", 2000);
    logMessage("Match Found: Toyota Innova Crysta (JK-01-A-5678) score 98.4%", 2600);
    logMessage("Chauffeur Shabir Ahmad selected. Proximity: 1.8 km.", 3200);
    
    setTimeout(() => {
      setRunningAI(false);
    }, 3500);
  };

  // Comms Type Message
  const sendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typingChat.trim()) return;

    const newMsg = {
      id: chatMessages.length + 1,
      sender: 'Dispatcher (You)',
      msg: typingChat,
      time: 'Just now'
    };

    setChatMessages(prev => [...prev, newMsg]);
    setTypingChat('');

    // Simulate response from driver after a delay
    setTimeout(() => {
      setChatMessages(prev => [...prev, {
        id: prev.length + 1,
        sender: 'Shabir Ahmad',
        msg: 'Acknowledged, sir. I am on route now.',
        time: 'Just now'
      }]);
    }, 2000);
  };

  // Calculate Operational Metrics
  const fleetUtilizationRate = useMemo(() => {
    if (cabs.length === 0) return 0;
    const active = cabs.filter(c => resolveCabStatusForToday(c) === 'On Trip').length;
    return Math.round((active / cabs.length) * 100);
  }, [cabs]);

  const resolveCabStatusForToday = (cab: Cab) => {
    const meta = operationsData.cabsMetadata[cab.id];
    if (!cab.isActive) return 'Offline';
    
    // Check manual blocks
    const todayStr = new Date().toISOString().split('T')[0];
    const blocked = operationsData.manualBlockings.find(b => b.cabId === cab.id && todayStr >= b.startDate && todayStr <= b.endDate);
    if (blocked) return blocked.status;

    // Check active allocations today
    const activeAlloc = bookings.find(b => {
      if (b.status === 'cancelled' || b.status === 'completed') return false;
      const alloc = b.details?.cabAllocation;
      if (!alloc || alloc.cabId !== cab.id) return false;
      const pDate = alloc.pickupDateTime ? alloc.pickupDateTime.split('T')[0] : '';
      const dDate = alloc.dropDateTime ? alloc.dropDateTime.split('T')[0] : '';
      return (todayStr >= pDate && todayStr <= dDate);
    });

    if (activeAlloc) return 'On Trip';
    return 'Available';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Available': return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 uppercase text-[8px] font-black tracking-widest px-3 py-1">Available</Badge>;
      case 'On Trip': return <Badge className="bg-red-500/10 text-red-400 border-red-500/20 uppercase text-[8px] font-black tracking-widest px-3 py-1">On Trip</Badge>;
      case 'Maintenance': return <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/20 uppercase text-[8px] font-black tracking-widest px-3 py-1">In Workshop</Badge>;
      case 'Offline': return <Badge className="bg-neutral-500/10 text-neutral-400 border-neutral-500/20 uppercase text-[8px] font-black tracking-widest px-3 py-1">Offline</Badge>;
      default: return <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 uppercase text-[8px] font-black tracking-widest px-3 py-1">Reserved</Badge>;
    }
  };

  // Simulating SOS Trigger
  const triggerSOSEmergency = () => {
    toast.error('CRITICAL: SOS signal registered from vehicle JK-01-A-5678. Support team dispatched.');
    setBreakdownIncidents(prev => [
      ...prev,
      { id: `inc-${Date.now()}`, vehicle: 'Innova Crysta Luxury', driver: 'Shabir Ahmad', location: 'Gagangeer Corridor', type: 'SOS Alert Triggered', severity: 'Critical', status: 'Pending Rescue' }
    ]);
    setCurrentTab('emergency');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="h-16 w-16 animate-spin text-kashmir-gold" />
        <p className="text-white/20 text-xs font-black uppercase tracking-[0.2em] animate-pulse">Initializing Fleet Command Center...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-left">
      
      {/* Top Header Controls Panel */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 border-b border-white/5 pb-6">
        <div>
          <Badge className="bg-kashmir-gold/10 text-kashmir-gold border-kashmir-gold/20 font-black px-4 py-1 rounded-full text-[9px] uppercase tracking-[0.2em] mb-3">
            Real-Time Transportation Command
          </Badge>
          <h2 className="text-3xl font-display font-black text-white uppercase tracking-tight">
            Fleet Command <span className="text-kashmir-gold italic">Center</span>
          </h2>
          <p className="text-white/40 text-xs mt-1.5 uppercase tracking-widest font-black flex items-center gap-2">
            <span>● Status: Active</span>
            <span>• {cabs.length} Vehicles</span>
            <span>• {bookings.filter(b => b.details?.cabAllocation).length} Active Assignments</span>
          </p>
        </div>

        {/* Role Simulator Bar */}
        <div className="flex flex-wrap items-center gap-2.5 bg-white/5 border border-white/10 rounded-2xl p-1.5">
          <span className="text-[9px] font-black uppercase tracking-widest text-white/40 pl-2 pr-1">Simulator Role</span>
          {(['Director', 'Dispatcher', 'Fleet Manager', 'Finance'] as const).map((r) => (
            <button
              key={r}
              onClick={() => {
                setActiveRole(r);
                toast.info(`Permission matrix set to role: ${r}`);
              }}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all",
                activeRole === r 
                  ? "bg-kashmir-gold text-black shadow-lg" 
                  : "text-white/40 hover:text-white"
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex overflow-x-auto gap-3 pb-3 border-b border-white/5 scrollbar-thin">
        {[
          { id: 'operations', label: 'Operations Desk', icon: Sliders },
          { id: 'registry', label: 'Fleet Registry', icon: Car },
          { id: 'drivers', label: 'Chauffeur Hub', icon: Users },
          { id: 'ai-dispatch', label: 'AI Dispatch & Rates', icon: Sparkles },
          { id: 'maintenance', label: 'Workshop Center', icon: Wrench },
          { id: 'finance', label: 'P&L Analytics', icon: DollarSign },
          { id: 'emergency', label: 'Emergency SOS', icon: AlertOctagon },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setCurrentTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 shrink-0",
              currentTab === tab.id 
                ? "bg-kashmir-gold text-black shadow-lg font-bold" 
                : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
            )}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OPERATIONS DESK */}
      {currentTab === 'operations' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          
          {/* Operations KPI Metrics Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Available Today', count: cabs.filter(c => resolveCabStatusForToday(c) === 'Available').length, desc: 'Ready for allocation' },
              { label: 'On Route Today', count: cabs.filter(c => resolveCabStatusForToday(c) === 'On Trip').length, desc: 'Active dispatches' },
              { label: 'In Workshop', count: cabs.filter(c => resolveCabStatusForToday(c) === 'Maintenance').length, desc: 'Preventive service' },
              { label: 'Fleet Utilization', count: `${fleetUtilizationRate}%`, desc: 'Active asset utilization' }
            ].map(counter => (
              <Card key={counter.label} className="bg-white/[0.01] border-white/5 p-6 rounded-3xl relative overflow-hidden group">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/30">{counter.label}</p>
                <p className="text-3xl font-display font-black mt-2 text-white">{counter.count}</p>
                <span className="block text-[8px] text-white/20 uppercase tracking-widest mt-1 font-semibold">{counter.desc}</span>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Live Map Dashboard & SOS Trigger */}
            <div className="lg:col-span-4 space-y-6">
              <Card className="bg-white/[0.01] border border-white/5 p-6 rounded-3xl relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-white">Live Operations Tracker</h4>
                    <p className="text-[9px] text-white/30 uppercase tracking-widest font-black">GPS Satellite Coordinates</p>
                  </div>
                  <Button 
                    onClick={triggerSOSEmergency}
                    className="bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-black rounded-lg h-8 px-3 text-[9px] uppercase tracking-widest font-black"
                  >
                    Trigger Test SOS
                  </Button>
                </div>

                {/* Google Maps Graphic Simulation */}
                <div className="w-full h-72 bg-slate-950 border border-white/5 rounded-2xl relative overflow-hidden flex items-center justify-center select-none group">
                  <div className="absolute inset-0 bg-[#05090b] opacity-90" style={{ backgroundImage: 'radial-gradient(#b88e2f 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
                  
                  {/* Floating Map Nodes */}
                  {mapVehicles.map((v, i) => (
                    <div 
                      key={v.id} 
                      className="absolute flex flex-col items-center animate-bounce-slow"
                      style={{ top: `${30 + (i * 20)}%`, left: `${25 + (i * 25)}%` }}
                    >
                      <div className="w-4 h-4 rounded-full bg-kashmir-gold border-2 border-white flex items-center justify-center shadow-lg shadow-kashmir-gold/45 relative cursor-pointer">
                        <div className="absolute -top-6 bg-black/85 border border-white/10 px-2 py-0.5 rounded text-[8px] text-white font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                          {v.name}
                        </div>
                      </div>
                      <span className="text-[8px] text-white/50 font-bold mt-1 uppercase tracking-widest">{v.status}</span>
                    </div>
                  ))}

                  <div className="absolute bottom-4 left-4 right-4 bg-black/80 backdrop-blur-md border border-white/10 p-3.5 rounded-xl text-left space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-wider text-kashmir-gold">GPS Stream Active</p>
                    <p className="text-[8px] text-white/50 leading-none">Broadcasting telemetry packets from {mapVehicles.length} active transits.</p>
                  </div>
                </div>

                {/* Simulated Telemetry list */}
                <div className="space-y-3 mt-6">
                  {mapVehicles.map(v => (
                    <div key={v.id} className="flex justify-between items-center text-xs p-3 rounded-xl border border-white/5 bg-white/[0.01]">
                      <div>
                        <span className="font-bold text-white block">{v.name}</span>
                        <span className="text-[9px] text-white/30 uppercase font-black">{v.driver} • Speed: {v.speed}</span>
                      </div>
                      <Badge className="bg-kashmir-gold/15 text-kashmir-gold border-none text-[8px] uppercase tracking-wider">
                        {v.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Trip Allocations Queue */}
            <div className="lg:col-span-8">
              <Card className="bg-white/[0.01] border-white/5 p-8 rounded-[2.5rem]">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                  <div>
                    <h3 className="text-xl font-display font-black text-white uppercase tracking-tight flex items-center gap-2">
                      <Clock className="w-5 h-5 text-kashmir-gold" />
                      Dispatch Allocations Room
                    </h3>
                    <p className="text-[10px] text-white/30 font-black uppercase tracking-widest mt-1">Allocate local chauffeurs and manage trip costs for booking vouchers</p>
                  </div>
                  <Button 
                    onClick={() => setBlockDialogOpen(true)}
                    className="bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl h-10 px-4 text-[9px] uppercase tracking-widest font-black flex items-center gap-2"
                  >
                    <Wrench className="w-3.5 h-3.5 text-orange-400" />
                    Block Fleet Dates
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-white/[0.02] border-b border-white/5">
                      <TableRow className="hover:bg-transparent border-none">
                        <TableHead className="text-white/20 uppercase text-[8px] font-black tracking-widest py-5 pl-6">Trip Details</TableHead>
                        <TableHead className="text-white/20 uppercase text-[8px] font-black tracking-widest">Client</TableHead>
                        <TableHead className="text-white/20 uppercase text-[8px] font-black tracking-widest">Date / Route</TableHead>
                        <TableHead className="text-white/20 uppercase text-[8px] font-black tracking-widest">Pricing & Status</TableHead>
                        <TableHead className="text-white/20 uppercase text-[8px] font-black tracking-widest text-right pr-6">Operational Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-white/5">
                      {bookings
                        .filter(b => (b.type === 'cab' || b.details?.cabAllocation || b.details?.parentPackageBookingId) && b.status !== 'cancelled' && b.status !== 'completed')
                        .map(booking => {
                          const alloc = booking.details?.cabAllocation;
                          return (
                            <TableRow key={booking.id} className="hover:bg-white/[0.02] transition-colors border-none">
                              <TableCell className="py-6 pl-6 font-bold text-white">
                                <div className="space-y-1">
                                  <span className="text-xs uppercase block text-white font-black">{booking.itemName}</span>
                                  <span className="text-[8px] text-white/30 uppercase tracking-widest font-semibold block">Ref: {booking.id.slice(0, 8).toUpperCase()}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-xs text-white/60">
                                <div className="space-y-0.5">
                                  <span className="font-bold text-white block">{booking.user.name}</span>
                                  <span className="text-[9px] text-white/30 uppercase font-black">{booking.user.phone || 'No phone'}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-xs text-white/60">
                                <div className="space-y-0.5">
                                  <span className="font-bold text-white block">{new Date(booking.bookingDate).toLocaleDateString()}</span>
                                  <span className="text-[9px] text-white/30 uppercase font-black">{alloc?.pickupLocation || 'Pending pickup loc'}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-xs">
                                <div className="space-y-1">
                                  <span className="font-display font-black text-kashmir-gold block">₹{booking.totalAmount.toLocaleString()}</span>
                                  {alloc ? (
                                    <Badge className="bg-emerald-500/10 text-emerald-400 border-none text-[8px] uppercase tracking-wider">Allocated</Badge>
                                  ) : (
                                    <Badge className="bg-red-500/10 text-red-400 border-none text-[8px] uppercase tracking-wider">Unassigned</Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right pr-6 py-6">
                                <div className="flex items-center justify-end gap-2">
                                  {alloc ? (
                                    <>
                                      <Button 
                                        size="icon" 
                                        variant="ghost" 
                                        className="h-8 w-8 hover:bg-emerald-500/10 text-emerald-400 hover:text-emerald-300"
                                        onClick={() => openWhatsappPreview(booking)}
                                      >
                                        <Send className="w-4 h-4" />
                                      </Button>
                                      <Button 
                                        size="icon" 
                                        variant="ghost" 
                                        className="h-8 w-8 hover:bg-amber-500/10 text-kashmir-gold hover:text-amber-300"
                                        onClick={() => {
                                          setSelectedBookingForVoucher(booking);
                                          setVoucherDialogOpen(true);
                                        }}
                                      >
                                        <Printer className="w-4 h-4" />
                                      </Button>
                                      <Button 
                                        size="icon" 
                                        variant="ghost" 
                                        className="h-8 w-8 hover:bg-red-500/10 text-red-400 hover:text-red-300"
                                        onClick={() => {
                                          setBookingToDeallocate(booking);
                                          setDeallocateConfirmOpen(true);
                                        }}
                                      >
                                        <X className="w-4 h-4" />
                                      </Button>
                                    </>
                                  ) : (
                                    <Button 
                                      className="bg-kashmir-gold text-black hover:bg-amber-500 rounded-xl h-9 px-4 text-[9px] uppercase font-black tracking-widest"
                                      onClick={() => openAllocationDialog(booking)}
                                    >
                                      Assign Cab
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </div>

          </div>
        </div>
      )}

      {/* TAB 2: FLEET REGISTRY */}
      {currentTab === 'registry' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          
          <div className="flex justify-between items-center bg-white/[0.01] border border-white/5 rounded-3xl p-6">
            <div>
              <h3 className="text-xl font-display font-black text-white">PHYSICAL ASSETS REGISTRY</h3>
              <p className="text-xs text-white/30 uppercase tracking-widest font-black mt-1">Manage registration compliance documents, odometer limits and models</p>
            </div>
            {activeRole === 'Director' && (
              <Button 
                onClick={openCreateDialog}
                className="bg-kashmir-gold text-black hover:bg-amber-500 rounded-xl font-black text-[9px] uppercase tracking-widest px-5 h-12 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Deploy New Vehicle
              </Button>
            )}
          </div>

          {/* Registry Table */}
          <Card className="bg-white/[0.01] border-white/5 p-6 rounded-[2.5rem]">
            <Table>
              <TableHeader className="bg-white/[0.02] border-b border-white/5">
                <TableRow className="border-none">
                  <TableHead className="text-white/20 uppercase text-[8px] font-black tracking-widest pl-6">Vehicle</TableHead>
                  <TableHead className="text-white/20 uppercase text-[8px] font-black tracking-widest">Ownership</TableHead>
                  <TableHead className="text-white/20 uppercase text-[8px] font-black tracking-widest">Logistics Capacity</TableHead>
                  <TableHead className="text-white/20 uppercase text-[8px] font-black tracking-widest">Base Rate / KM</TableHead>
                  <TableHead className="text-white/20 uppercase text-[8px] font-black tracking-widest">Default Driver</TableHead>
                  <TableHead className="text-white/20 uppercase text-[8px] font-black tracking-widest">Document Status</TableHead>
                  <TableHead className="text-white/20 uppercase text-[8px] font-black tracking-widest text-right pr-6">Controls</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-white/5">
                {cabs.map(cab => {
                  const meta = operationsData.cabsMetadata[cab.id] || defaultMetadata;
                  return (
                    <TableRow key={cab.id} className="hover:bg-white/[0.02] transition-colors border-none">
                      <TableCell className="py-6 pl-6 font-bold text-white flex items-center gap-4">
                        {cab.image && (
                          <img src={cab.image} alt={cab.name} className="w-14 h-10 object-contain rounded-lg bg-black/40 border border-white/5" />
                        )}
                        <div>
                          <span className="text-xs uppercase block text-white font-black">{cab.name}</span>
                          <span className="text-[9px] text-white/30 uppercase font-bold tracking-widest">{meta.registrationNo || 'JK-01-PENDING'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-white/60">
                        <Badge className="bg-[#0A141A] text-kashmir-gold border border-kashmir-gold/20 uppercase text-[8px] font-bold">
                          {meta.ownership === 'vendor' ? 'Vendor Contract' : 'Company Asset'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-white/60 font-semibold">{cab.capacity} Seats</TableCell>
                      <TableCell className="text-xs">
                        <span className="font-bold text-white block">₹{cab.pricePerKm}/km</span>
                        <span className="text-[9px] text-white/30 block">Base: ₹{cab.basePrice}</span>
                      </TableCell>
                      <TableCell className="text-xs text-white/60 font-semibold">{meta.driverName || 'No Driver Allocated'}</TableCell>
                      <TableCell className="text-xs">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span className="text-[9px] text-white/40 uppercase font-black">All active</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-6 py-6">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-white/5 text-white/40 hover:text-white" onClick={() => openEditDialog(cab)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8 hover:bg-red-500/15 text-red-500"
                            onClick={() => {
                              setItemToDelete(cab.id);
                              setDeleteConfirmOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {/* TAB 3: CHAUFFEUR HUB */}
      {currentTab === 'drivers' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          
          <div className="flex justify-between items-center bg-white/[0.01] border border-white/5 rounded-3xl p-6">
            <div>
              <h3 className="text-xl font-display font-black text-white">CHAUFFEUR HUB</h3>
              <p className="text-xs text-white/30 uppercase tracking-widest font-black mt-1">Track driver duty rosters, license verifications, ratings, and incentive structures</p>
            </div>
            <Button 
              className="bg-kashmir-gold text-black hover:bg-amber-500 rounded-xl font-black text-[9px] uppercase tracking-widest px-5 h-12 flex items-center gap-2"
              onClick={() => {
                toast.success('Licensing API validation portal opened.');
              }}
            >
              <Shield className="w-4 h-4 text-black" /> Verify Licenses
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {driversList.map(drv => (
              <Card key={drv.id} className="bg-white/[0.01] border border-white/5 p-6 rounded-3xl relative overflow-hidden group">
                <div className="absolute top-4 right-4">
                  <Badge className={cn("border-none text-[8px] uppercase tracking-wider font-bold",
                    drv.status === 'Online' ? 'bg-emerald-500/10 text-emerald-400' : 
                    drv.status === 'On Trip' ? 'bg-red-500/10 text-red-400' : 'bg-neutral-500/10 text-neutral-400'
                  )}>
                    {drv.status}
                  </Badge>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                      <User className="w-5 h-5 text-kashmir-gold" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase text-white leading-tight">{drv.name}</h4>
                      <span className="text-[9px] text-white/30 font-bold uppercase">{drv.phone}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-b border-white/5 py-3 text-[10px]">
                    <div>
                      <span className="block text-[8px] text-white/20 uppercase tracking-wider">Trips Completed</span>
                      <span className="font-bold text-white text-xs">{drv.trips}</span>
                    </div>
                    <div>
                      <span className="block text-[8px] text-white/20 uppercase tracking-wider">Rating Score</span>
                      <span className="font-bold text-kashmir-gold text-xs">{drv.rating} ★</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[10px]">
                    <div>
                      <span className="block text-[8px] text-white/20 uppercase">Driver Earnings</span>
                      <span className="font-bold text-emerald-400">₹{drv.earnings.toLocaleString()}</span>
                    </div>
                    <Badge className="bg-white/5 text-white/50 border-none text-[8px] uppercase">
                      DL: {drv.license.slice(0, 7)}
                    </Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: AI DISPATCH & RATES */}
      {currentTab === 'ai-dispatch' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* AI Dispatch Engine */}
            <div className="lg:col-span-6 space-y-6">
              <Card className="bg-white/[0.01] border-white/5 p-8 rounded-[2.5rem]">
                <h3 className="text-xl font-display font-black text-white uppercase tracking-tight flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-kashmir-gold animate-pulse" />
                  AI Dispatch Engine
                </h3>
                <p className="text-[10px] text-white/30 font-black uppercase tracking-widest mt-1 mb-6">Automate chauffeur matching based on customer geolocation coordinates and rating coefficients</p>

                <div className="space-y-6">
                  <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl space-y-2 text-xs">
                    <p className="font-bold text-white uppercase tracking-wider">Optimization settings:</p>
                    <div className="grid grid-cols-2 gap-4 pt-2 text-[10px]">
                      <div className="flex items-center justify-between p-3 bg-black/40 rounded-xl">
                        <span className="text-white/40">Proximity priority</span>
                        <span className="font-bold text-emerald-400">Active</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-black/40 rounded-xl">
                        <span className="text-white/40">Driver Rating min</span>
                        <span className="font-bold text-kashmir-gold">4.7 ★</span>
                      </div>
                    </div>
                  </div>

                  <Button 
                    onClick={runAIDispatchEngine}
                    disabled={runningAI}
                    className="w-full h-14 bg-kashmir-gold text-black hover:bg-amber-500 font-black rounded-xl transition-all shadow-xl shadow-kashmir-gold/15 flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
                  >
                    {runningAI ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Run AI Auto-Assignment Matcher'}
                  </Button>

                  {/* AI logs output panel */}
                  {showAIMatchResult && (
                    <div className="bg-black/60 border border-white/5 p-5 rounded-2xl text-[10px] font-mono text-emerald-400 space-y-2 h-48 overflow-y-auto">
                      {aiMatchOutput.map((log, i) => (
                        <p key={i} className="leading-relaxed animate-fade-in">{log}</p>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Rates & Pricing Engine */}
            <div className="lg:col-span-6 space-y-6">
              <Card className="bg-white/[0.01] border-white/5 p-8 rounded-[2.5rem]">
                <h3 className="text-xl font-display font-black text-white uppercase tracking-tight flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-kashmir-gold" />
                  Fleet Tariff Manager
                </h3>
                <p className="text-[10px] text-white/30 font-black uppercase tracking-widest mt-1 mb-6">Manage base rates, seasonal surge multipliers, and outstation allowances</p>

                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-widest text-white/30 pl-1">Per Kilometer Tariff (₹)</label>
                      <Input 
                        type="number" 
                        value={pricingRules.perKmRate} 
                        onChange={e => setPricingRules({...pricingRules, perKmRate: Number(e.target.value)})}
                        className="bg-white/5 border-white/10 rounded-xl h-11 text-xs text-white" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-widest text-white/30 pl-1">Base Charge (₹)</label>
                      <Input 
                        type="number" 
                        value={pricingRules.baseCharge} 
                        onChange={e => setPricingRules({...pricingRules, baseCharge: Number(e.target.value)})}
                        className="bg-white/5 border-white/10 rounded-xl h-11 text-xs text-white" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-widest text-white/30 pl-1">Driver Daily Allowance (₹)</label>
                      <Input 
                        type="number" 
                        value={pricingRules.driverAllowance} 
                        onChange={e => setPricingRules({...pricingRules, driverAllowance: Number(e.target.value)})}
                        className="bg-white/5 border-white/10 rounded-xl h-11 text-xs text-white" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-widest text-white/30 pl-1">Peak Season Multiplier</label>
                      <Input 
                        type="number" 
                        step="0.05"
                        value={pricingRules.peakSeasonMultiplier} 
                        onChange={e => setPricingRules({...pricingRules, peakSeasonMultiplier: Number(e.target.value)})}
                        className="bg-white/5 border-white/10 rounded-xl h-11 text-xs text-white" 
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div>
                      <span className="text-xs font-bold text-white block">Auto Surge Multiplier</span>
                      <span className="text-[9px] text-white/30 uppercase tracking-widest font-black">Enable peak traffic surge rates</span>
                    </div>
                    <Switch 
                      checked={pricingRules.surgeEnabled}
                      onCheckedChange={checked => {
                        setPricingRules({...pricingRules, surgeEnabled: checked});
                        toast.success(checked ? 'Peak traffic surge activated' : 'Peak traffic surge deactivated');
                      }}
                    />
                  </div>

                  <Button 
                    onClick={() => toast.success('Tariff modifications saved successfully!')}
                    className="w-full h-12 bg-white text-black hover:bg-kashmir-gold hover:text-black font-black rounded-xl text-[10px] uppercase tracking-widest mt-2"
                  >
                    Save Tariff Configuration
                  </Button>
                </div>
              </Card>
            </div>

          </div>
        </div>
      )}

      {/* TAB 5: WORKSHOP CENTER */}
      {currentTab === 'maintenance' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          
          <div className="flex justify-between items-center bg-white/[0.01] border border-white/5 rounded-3xl p-6">
            <div>
              <h3 className="text-xl font-display font-black text-white">WORKSHOP & MAINTENANCE CENTER</h3>
              <p className="text-xs text-white/30 uppercase tracking-widest font-black mt-1">Schedule servicing, track repair invoices, and verify battery/tyre lifespans</p>
            </div>
            <Button 
              className="bg-kashmir-gold text-black hover:bg-amber-500 rounded-xl font-black text-[9px] uppercase tracking-widest px-5 h-12 flex items-center gap-2"
              onClick={() => {
                toast.info('Preventive maintenance scheduler initialized.');
              }}
            >
              <Plus className="w-4 h-4" /> Book Repair Work
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {maintenanceRecords.map(rec => (
              <Card key={rec.id} className="bg-white/[0.01] border border-white/5 p-6 rounded-3xl relative overflow-hidden">
                <div className="absolute top-4 right-4">
                  <Badge className={cn("border-none text-[8px] uppercase tracking-wider font-bold",
                    rec.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                  )}>
                    {rec.status}
                  </Badge>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="space-y-1">
                    <span className="text-[8px] text-white/30 uppercase tracking-widest block font-black">VEHICLE NODE</span>
                    <h4 className="text-sm font-bold text-white uppercase">{rec.vehicle}</h4>
                    <span className="text-[9px] text-white/40 uppercase font-semibold">{rec.reg}</span>
                  </div>

                  <div className="space-y-1 border-t border-white/5 pt-3">
                    <span className="text-[8px] text-white/20 uppercase tracking-wider block">Service Task Details</span>
                    <p className="font-semibold text-white">{rec.task}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2 text-[10px]">
                    <div>
                      <span className="block text-[8px] text-white/20 uppercase">Workshop Agency</span>
                      <span className="font-bold text-white">{rec.workshop}</span>
                    </div>
                    <div>
                      <span className="block text-[8px] text-white/20 uppercase">Expenses</span>
                      <span className="font-bold text-emerald-400">₹{rec.cost.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: P&L ANALYTICS */}
      {currentTab === 'finance' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          
          {/* Revenue metrics cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: 'Today\'s Fleet Gross Revenue', amount: '₹76,400', desc: 'All bookings matched' },
              { label: 'Monthly Fleet Gross Revenue', amount: '₹12,46,800', desc: 'Active commissions included' },
              { label: 'Operations Margin', amount: '₹2,84,300', desc: 'Calculated after driver allowances' }
            ].map(m => (
              <Card key={m.label} className="bg-white/[0.01] border-white/5 p-6 rounded-3xl relative overflow-hidden group">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/30">{m.label}</p>
                <p className="text-3xl font-display font-black mt-2 text-kashmir-gold">{m.amount}</p>
                <span className="block text-[8px] text-white/20 uppercase tracking-widest mt-1 font-semibold">{m.desc}</span>
              </Card>
            ))}
          </div>

          {/* Simple analytical bar display */}
          <Card className="bg-white/[0.01] border-white/5 p-8 rounded-[2.5rem]">
            <h3 className="text-lg font-display font-black text-white uppercase tracking-tight mb-6">Driver Productivity Index</h3>
            <div className="space-y-6">
              {[
                { name: 'Shabir Ahmad', trips: 28, revenue: 184500, percent: 85 },
                { name: 'Fayaz Rather', trips: 34, revenue: 246000, percent: 95 },
                { name: 'Hilal Dar', trips: 31, revenue: 219000, percent: 90 }
              ].map(drv => (
                <div key={drv.name} className="space-y-2 text-xs">
                  <div className="flex justify-between items-center text-white/80">
                    <span className="font-bold uppercase tracking-wider">{drv.name} ({drv.trips} Trips)</span>
                    <span className="font-black text-kashmir-gold">₹{drv.revenue.toLocaleString()}</span>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <div className="h-full bg-kashmir-gold rounded-full" style={{ width: `${drv.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* TAB 7: EMERGENCY SOS */}
      {currentTab === 'emergency' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Active emergencies breakdown list */}
            <div className="lg:col-span-7 space-y-6">
              <Card className="bg-white/[0.01] border border-red-500/10 p-8 rounded-[2.5rem] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />
                <h3 className="text-xl font-display font-black text-red-500 uppercase tracking-tight flex items-center gap-2">
                  <AlertOctagon className="w-5 h-5 text-red-500 animate-pulse" />
                  Emergency Operations Panel
                </h3>
                <p className="text-[10px] text-white/30 font-black uppercase tracking-widest mt-1 mb-6">Initiate backup vehicle deployments, contact emergency support police lines</p>

                <div className="space-y-4">
                  {breakdownIncidents.map(inc => (
                    <div key={inc.id} className="p-5 bg-red-500/5 border border-red-500/10 rounded-2xl space-y-3 text-xs text-left">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="block text-[8px] text-red-400 font-black uppercase tracking-widest">{inc.severity} Severity</span>
                          <h4 className="text-sm font-bold text-white uppercase mt-0.5">{inc.vehicle} • {inc.driver}</h4>
                        </div>
                        <Badge className="bg-red-500 text-black border-none text-[8px] uppercase tracking-wider font-bold">
                          {inc.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-2 text-[10px]">
                        <div>
                          <span className="block text-[8px] text-white/30 uppercase">Incident Location</span>
                          <span className="font-bold text-white">{inc.location}</span>
                        </div>
                        <div>
                          <span className="block text-[8px] text-white/30 uppercase">Diagnosis Report</span>
                          <span className="font-bold text-white">{inc.type}</span>
                        </div>
                      </div>

                      <div className="flex gap-3 pt-4 border-t border-white/5">
                        <Button 
                          onClick={() => toast.success('Backup transport allocated and dispatched.')}
                          className="bg-white text-black hover:bg-kashmir-gold hover:text-black font-black text-[9px] uppercase tracking-widest h-10 px-4 rounded-xl"
                        >
                          Dispatch Backup Cab
                        </Button>
                        <Button 
                          variant="ghost"
                          onClick={() => toast.info('SOS resolved.')}
                          className="bg-white/5 border border-white/10 hover:bg-white/10 text-white/60 hover:text-white font-black text-[9px] uppercase tracking-widest h-10 px-4 rounded-xl"
                        >
                          Resolve SOS
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Direct Comms Chat Console */}
            <div className="lg:col-span-5 space-y-6">
              <Card className="bg-white/[0.01] border-white/5 p-8 rounded-[2.5rem] flex flex-col h-[500px] justify-between relative overflow-hidden">
                <div>
                  <h3 className="text-lg font-display font-black text-white uppercase tracking-tight flex items-center gap-2 border-b border-white/5 pb-3">
                    <MessageSquare className="w-5 h-5 text-kashmir-gold" />
                    Chauffeur Comms Room
                  </h3>
                </div>

                {/* Messages view */}
                <div className="flex-1 overflow-y-auto space-y-4 my-4 pr-2 scrollbar-thin text-xs text-left">
                  {chatMessages.map(msg => (
                    <div 
                      key={msg.id} 
                      className={cn(
                        "p-3.5 rounded-2xl max-w-[85%] space-y-1",
                        msg.sender.includes('Dispatcher') 
                          ? "bg-kashmir-gold/15 border border-kashmir-gold/20 text-white ml-auto" 
                          : "bg-white/5 border border-white/5 text-white/70"
                      )}
                    >
                      <span className="block text-[8px] uppercase tracking-wider text-kashmir-gold font-black">{msg.sender}</span>
                      <p className="leading-relaxed">{msg.msg}</p>
                      <span className="block text-[8px] text-white/20 text-right">{msg.time}</span>
                    </div>
                  ))}
                </div>

                {/* Input text box */}
                <form onSubmit={sendChatMessage} className="flex gap-3 border-t border-white/5 pt-4">
                  <Input 
                    value={typingChat}
                    onChange={e => setTypingChat(e.target.value)}
                    placeholder="Type dispatch instructions..."
                    className="bg-white/5 border-white/5 rounded-xl h-11 text-xs text-white"
                  />
                  <Button 
                    type="submit"
                    className="bg-kashmir-gold hover:bg-amber-500 text-black h-11 w-11 rounded-xl flex items-center justify-center shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </Card>
            </div>

          </div>
        </div>
      )}

      {/* Allocation / Dispatch Costings Config Dialog */}
      <Dialog open={allocationDialogOpen} onOpenChange={setAllocationDialogOpen}>
        <DialogContent className="max-w-2xl bg-[#0a0f12] border-white/10 text-white rounded-[2rem] overflow-y-auto max-h-[90vh]">
          <DialogHeader className="p-8 pb-0">
            <DialogTitle className="text-2xl font-display font-black tracking-tight text-white flex items-center gap-2">
              <Car className="w-5 h-5 text-kashmir-gold animate-bounce-slow" />
              Chauffeur Dispatch Allocation Console
            </DialogTitle>
          </DialogHeader>
          <div className="p-8 space-y-6">
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Select Available Vehicle</label>
                <select
                  value={allocatedCabId}
                  onChange={e => handleCabChange(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl h-12 px-4 text-xs font-bold text-white focus:outline-none focus:border-kashmir-gold/50"
                >
                  <option value="" className="bg-[#0a0f12]">Choose Vehicle...</option>
                  {cabs.map(c => (
                    <option key={c.id} value={c.id} className="bg-[#0a0f12]">{c.name} ({c.type})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">License Plate No</label>
                <Input 
                  value={dispatchRegNo}
                  onChange={e => setDispatchRegNo(e.target.value)}
                  className="bg-white/5 border-white/10 rounded-xl h-12 text-xs font-bold"
                  placeholder="e.g. JK-01-A-1234"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Chauffeur Chaperone</label>
                <Input 
                  value={dispatchDriverName}
                  onChange={e => setDispatchDriverName(e.target.value)}
                  className="bg-white/5 border-white/10 rounded-xl h-12 text-xs font-semibold"
                  placeholder="Driver Name"
                />
              </div>
              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Chauffeur Contact (WhatsApp)</label>
                <Input 
                  value={dispatchDriverPhone}
                  onChange={e => setDispatchDriverPhone(e.target.value)}
                  className="bg-white/5 border-white/10 rounded-xl h-12 text-xs font-semibold"
                  placeholder="Driver Phone"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Pickup Schedule</label>
                <Input 
                  type="datetime-local"
                  value={dispatchPickupDateTime}
                  onChange={e => setDispatchPickupDateTime(e.target.value)}
                  className="bg-white/5 border-white/10 rounded-xl h-12 text-xs text-white"
                />
              </div>
              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Dropoff Schedule</label>
                <Input 
                  type="datetime-local"
                  value={dispatchDropDateTime}
                  onChange={e => setDispatchDropDateTime(e.target.value)}
                  className="bg-white/5 border-white/10 rounded-xl h-12 text-xs text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 border-t border-white/5 pt-4">
              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Pickup Address</label>
                <Input 
                  value={dispatchPickupLoc}
                  onChange={e => setDispatchPickupLoc(e.target.value)}
                  className="bg-white/5 border-white/10 rounded-xl h-12 text-xs"
                />
              </div>
              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Dropoff Address</label>
                <Input 
                  value={dispatchDropLoc}
                  onChange={e => setDispatchDropLoc(e.target.value)}
                  className="bg-white/5 border-white/10 rounded-xl h-12 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 border-t border-white/5 pt-4 text-left">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-white/30">Est Distance (KM)</label>
                <Input 
                  type="number"
                  value={dispatchEstKm}
                  onChange={e => setDispatchEstKm(Number(e.target.value))}
                  className="bg-white/5 border-white/10 rounded-xl h-10 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-white/30">Driver Allowance (₹)</label>
                <Input 
                  type="number"
                  value={dispatchDriverAllowance}
                  onChange={e => setDispatchDriverAllowance(Number(e.target.value))}
                  className="bg-white/5 border-white/10 rounded-xl h-10 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-white/30">Estimated Fuel (₹)</label>
                <Input 
                  type="number"
                  value={dispatchFuel}
                  onChange={e => setDispatchFuel(Number(e.target.value))}
                  className="bg-white/5 border-white/10 rounded-xl h-10 text-xs"
                />
              </div>
            </div>

            <Button 
              onClick={handleSaveAllocation} 
              disabled={saving}
              className="w-full h-14 bg-kashmir-gold text-black hover:bg-amber-500 font-black rounded-xl transition-all shadow-xl shadow-kashmir-gold/15 mt-4"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Operational Dispatch'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Deploy / Edit Vehicle Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl bg-[#0a0f12] border-white/10 text-white rounded-[2rem] overflow-y-auto max-h-[90vh]">
          <DialogHeader className="p-8 pb-0">
            <DialogTitle className="text-2xl font-display font-black tracking-tight text-white">
              {editingCab ? 'Modify Vehicle Deployment' : 'Deploy Physical Fleet Node'}
            </DialogTitle>
          </DialogHeader>
          <div className="p-8 space-y-6 text-left">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Vehicle Model Name</label>
                <Input
                  className="bg-white/5 border-white/10 rounded-xl h-12 text-xs font-bold"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Innova Crysta Luxury"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Vehicle Category</label>
                <Input
                  className="bg-white/5 border-white/10 rounded-xl h-12 text-xs font-bold"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  placeholder="e.g. Luxury SUV"
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
                className="bg-white/5 border-white/10 rounded-xl min-h-[100px] resize-none text-xs font-semibold"
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

      {/* Date blocker / Maintenance Registration dialog */}
      <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <DialogContent className="max-w-md bg-[#0a0f12] border-white/10 text-white rounded-[2rem]">
          <DialogHeader className="p-8 pb-0">
            <DialogTitle className="text-2xl font-display font-black tracking-tight text-white flex items-center gap-2">
              <Wrench className="w-5 h-5 text-orange-400" />
              Register Vehicle Downtime
            </DialogTitle>
          </DialogHeader>
          <div className="p-8 space-y-6 text-left">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Target Vehicle Node</label>
              <select
                value={blockCabId}
                onChange={e => setBlockCabId(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl h-12 px-4 text-xs font-bold text-white focus:outline-none focus:border-kashmir-gold/50"
              >
                <option value="" className="bg-[#0a0f12]">Select vehicle...</option>
                {cabs.map(c => (
                  <option key={c.id} value={c.id} className="bg-[#0a0f12]">{c.name} ({operationsData.cabsMetadata[c.id]?.registrationNo || 'JK-01'})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Start Date</label>
                <Input 
                  type="date"
                  value={blockStartDate}
                  onChange={e => setBlockStartDate(e.target.value)}
                  className="bg-white/5 border-white/10 rounded-xl h-12 text-xs"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">End Date</label>
                <Input 
                  type="date"
                  value={blockEndDate}
                  onChange={e => setBlockEndDate(e.target.value)}
                  className="bg-white/5 border-white/10 rounded-xl h-12 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Block Class</label>
                <select
                  value={blockStatus}
                  onChange={e => setBlockStatus(e.target.value as any)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl h-12 px-4 text-xs font-bold text-white focus:outline-none focus:border-kashmir-gold/50"
                >
                  <option value="Maintenance" className="bg-[#0a0f12]">Maintenance (Workshop)</option>
                  <option value="Offline" className="bg-[#0a0f12]">Offline / Inactive</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Operational Reason</label>
                <Input 
                  value={blockReason}
                  onChange={e => setBlockReason(e.target.value)}
                  placeholder="e.g., Engine Tuning / Service"
                  className="bg-white/5 border-white/10 rounded-xl h-12 text-xs"
                />
              </div>
            </div>

            <Button 
              onClick={handleBlockDates}
              disabled={blockingDates}
              className="w-full h-12 bg-kashmir-gold text-black hover:bg-amber-500 font-black rounded-xl transition-all shadow-xl shadow-kashmir-gold/15 mt-2"
            >
              {blockingDates ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Block Dates'}
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
          <div className="p-8 space-y-6 text-left">
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

                return (
                  <div className="space-y-8 p-6 text-left">
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
                        <div className="grid grid-cols-2 gap-4 text-xs">
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
                            <span className="text-xs font-bold uppercase text-amber-700">
                              {alloc.ownership === 'vendor' ? `Vendor (${alloc.vendorName})` : 'Company Owned'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Chauffeur Profile */}
                      <div className="space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-widest text-black/40 border-b border-black/10 pb-2">Chauffeur Profile</h3>
                        <div className="grid grid-cols-2 gap-4 text-xs">
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
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
                    <div className="p-6 bg-amber-500/5 rounded-2xl border border-amber-500/10 space-y-2 text-xs">
                      <h4 className="text-xs font-bold text-amber-700">Chauffeur Dispatch Notes & Protocols:</h4>
                      <ol className="list-decimal list-inside text-[11px] text-black/70 space-y-1 leading-relaxed">
                        <li>The vehicle should be washed and cleaned internally prior to arrival.</li>
                        <li>Chauffeur must be dressed in appropriate professional attire.</li>
                        <li>Please carry bottled water and hand sanitizer on all transfers.</li>
                        <li>Maintain a safe, secure, and quiet speed limit. No high-speed driving.</li>
                      </ol>
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
        <AlertDialogContent className="bg-[#0a0f12] border-white/10 text-white rounded-[2.5rem] text-left">
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

      <AlertDialog open={deallocateConfirmOpen} onOpenChange={setDeallocateConfirmOpen}>
        <AlertDialogContent className="bg-[#0a0f12] border-white/10 text-white rounded-[2.5rem] text-left">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black text-red-500 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-red-500" /> Release Cab Allocation?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              Are you sure you want to release the allocated cab for the trip "{bookingToDeallocate?.itemName}"? This action will deallocate the chauffeur and reset the operational finances.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white/60 hover:bg-white/10 rounded-xl h-12">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => bookingToDeallocate && confirmDeallocate(bookingToDeallocate)}
              className="bg-red-500 hover:bg-red-600 text-white rounded-xl h-12 font-bold"
            >
              Release Cab
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
