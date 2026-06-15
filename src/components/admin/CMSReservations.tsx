import { useState, useEffect } from 'react';
import { 
  CalendarCheck, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Plus, 
  Search, 
  X, 
  ChevronRight, 
  Loader2, 
  Mail, 
  MessageSquare, 
  Download, 
  CheckCircle2, 
  Trash2, 
  User, 
  Clock, 
  AlertTriangle, 
  FileText,
  UserCheck,
  Percent,
  MapPin,
  Building,
  Phone,
  FileSpreadsheet
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useTeamAuth } from '@/contexts/TeamAuthContext';
import { API_BASE_URL } from '@/lib/api';
import { jsPDF } from 'jspdf';
import { cn } from '@/lib/utils';

interface Hotel {
  id: string;
  name: string;
  location: string;
  roomTypes: any[];
  pricePerNight: number;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  paymentTerms?: string | null;
  commissionStructure?: string | null;
  seasonalPricing?: string | null;
}

interface Inquiry {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  destination: string;
  duration: string;
  budget: string;
  accommodation: string;
  status: string;
}

interface HotelReservation {
  id: string;
  inquiryId?: string | null;
  inquiry?: Inquiry | null;
  hotelId: string;
  hotel: Hotel;
  guestName: string;
  guestEmail?: string | null;
  guestPhone?: string | null;
  checkIn: string;
  checkOut: string;
  roomType: string;
  roomsCount: number;
  mealPlan: string;
  specialRequests?: string | null;
  status: 'Pending' | 'Sent' | 'Confirmed' | 'Hold' | 'Rejected' | 'Cancelled';
  paymentStatus: 'Unpaid' | 'Partially Paid' | 'Paid';
  bookingReference?: string | null;
  contractRate: number;
  seasonalPricing?: number | null;
  commissionRate: number;
  totalAmount: number;
  profitMargin: number;
  hotelDues: number;
  holdUntil?: string | null;
  createdById?: string | null;
  auditLogs?: string | null;
  createdAt: string;
  updatedAt: string;
  hasConflict?: boolean;
}

export default function CMSReservations() {
  const { systemEvents } = useTeamAuth();
  
  // Data lists
  const [reservations, setReservations] = useState<HotelReservation[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingChannel, setSendingChannel] = useState<{ id: string; channel: 'email' | 'whatsapp' } | null>(null);
  
  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [hotelFilter, setHotelFilter] = useState('all');
  const [checkInStart, setCheckInStart] = useState('');
  const [checkInEnd, setCheckInEnd] = useState('');

  // Modals
  const [formOpen, setFormOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [activeReservation, setActiveReservation] = useState<HotelReservation | null>(null);
  const [confirmRefCode, setConfirmRefCode] = useState('');
  const [timelineOpen, setTimelineOpen] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    inquiryId: '',
    hotelId: '',
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    checkIn: '',
    checkOut: '',
    roomType: '',
    roomsCount: 1,
    mealPlan: 'CP',
    specialRequests: '',
    status: 'Pending',
    paymentStatus: 'Unpaid',
    contractRate: 0,
    seasonalPricing: 0,
    commissionRate: 0,
    totalAmount: 0,
    holdUntil: ''
  });

  // Clock for countdown refresh
  const [clock, setClock] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setClock(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchReservations = async () => {
    try {
      const token = localStorage.getItem('teamToken');
      
      // Build filters query parameters
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (hotelFilter !== 'all') params.append('hotelId', hotelFilter);
      if (checkInStart) params.append('checkInStart', checkInStart);
      if (checkInEnd) params.append('checkInEnd', checkInEnd);
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`${API_BASE_URL}/reservations?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch reservations');
      const data = await response.json();
      setReservations(data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load reservations list');
    } finally {
      setLoading(false);
    }
  };

  const fetchMeta = async () => {
    try {
      const token = localStorage.getItem('teamToken');
      // Fetch hotels
      const hRes = await fetch(`${API_BASE_URL}/hotels?all=true`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (hRes.ok) {
        const hData = await hRes.json();
        if (Array.isArray(hData)) {
          setHotels(hData.map(h => ({
            ...h,
            roomTypes: typeof h.roomTypes === 'string' ? JSON.parse(h.roomTypes) : (Array.isArray(h.roomTypes) ? h.roomTypes : [])
          })));
        }
      }

      // Fetch inquiries
      const iRes = await fetch(`${API_BASE_URL}/inquiries`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (iRes.ok) {
        const iData = await iRes.json();
        if (Array.isArray(iData)) {
          setInquiries(iData);
        }
      }
    } catch (e) {
      console.error('Failed to load meta resources:', e);
    }
  };

  useEffect(() => {
    fetchReservations();
    fetchMeta();
  }, [statusFilter, hotelFilter, checkInStart, checkInEnd]);

  // Handle Search Debounce/Instant Trigger on Enter
  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      fetchReservations();
    }
  };

  // Real-time updates trigger
  useEffect(() => {
    const latestEvent = systemEvents[0];
    if (latestEvent && latestEvent.booking && latestEvent.booking.entityType === 'reservation') {
      fetchReservations();
    }
  }, [systemEvents]);

  // Form Calculations (mirroring backend logic)
  const calculateFormFields = () => {
    if (!formData.checkIn || !formData.checkOut) return { profit: 0, dues: 0, nights: 1 };
    
    const checkInDate = new Date(formData.checkIn);
    const checkOutDate = new Date(formData.checkOut);
    const diffTime = checkOutDate.getTime() - checkInDate.getTime();
    const nights = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    
    const rooms = Number(formData.roomsCount) || 1;
    const cRate = Number(formData.contractRate) || 0;
    const sPrice = Number(formData.seasonalPricing) || 0;
    const commRate = Number(formData.commissionRate) || 0;
    const grossTotal = Number(formData.totalAmount) || 0;

    const netCost = (cRate + sPrice) * rooms * nights;
    let profit = grossTotal - netCost;
    if (commRate > 0) {
      profit = grossTotal * (commRate / 100);
    }
    
    return {
      profit: Math.round(profit),
      dues: Math.round(netCost),
      nights
    };
  };

  const handleInquiryChange = (inqId: string) => {
    const inquiry = inquiries.find(i => i.id === inqId);
    if (inquiry) {
      setFormData(prev => ({
        ...prev,
        inquiryId: inqId,
        guestName: inquiry.customerName,
        guestEmail: inquiry.email,
        guestPhone: inquiry.phone
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        inquiryId: ''
      }));
    }
  };

  const handleHotelChange = (hId: string) => {
    const hotel = hotels.find(h => h.id === hId);
    if (hotel) {
      // Decode commission if possible
      let defaultComm = 0;
      if (hotel.commissionStructure) {
        const parsedComm = parseFloat(hotel.commissionStructure);
        if (!isNaN(parsedComm)) defaultComm = parsedComm;
      }
      
      const defaultRoomType = hotel.roomTypes?.[0]?.name || '';
      const defaultPrice = hotel.roomTypes?.[0]?.price || hotel.pricePerNight || 0;

      setFormData(prev => ({
        ...prev,
        hotelId: hId,
        roomType: defaultRoomType,
        contractRate: defaultPrice,
        commissionRate: defaultComm,
        totalAmount: Math.round(defaultPrice * prev.roomsCount * 1.2) // default gross recommendation
      }));
    }
  };

  const openCreateDialog = () => {
    setActiveReservation(null);
    setFormData({
      inquiryId: '',
      hotelId: hotels[0]?.id || '',
      guestName: '',
      guestEmail: '',
      guestPhone: '',
      checkIn: new Date().toISOString().split('T')[0],
      checkOut: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      roomType: '',
      roomsCount: 1,
      mealPlan: 'CP',
      specialRequests: '',
      status: 'Pending',
      paymentStatus: 'Unpaid',
      contractRate: 0,
      seasonalPricing: 0,
      commissionRate: 10,
      totalAmount: 0,
      holdUntil: ''
    });
    
    // Trigger defaults if hotels available
    if (hotels.length > 0) {
      const hotel = hotels[0];
      let defaultComm = 10;
      if (hotel.commissionStructure) {
        const parsedComm = parseFloat(hotel.commissionStructure);
        if (!isNaN(parsedComm)) defaultComm = parsedComm;
      }
      setFormData(prev => ({
        ...prev,
        hotelId: hotel.id,
        roomType: hotel.roomTypes?.[0]?.name || '',
        contractRate: hotel.roomTypes?.[0]?.price || hotel.pricePerNight || 0,
        commissionRate: defaultComm,
        totalAmount: Math.round((hotel.roomTypes?.[0]?.price || hotel.pricePerNight || 0) * 1.25)
      }));
    }

    setFormOpen(true);
  };

  const openEditDialog = (resItem: HotelReservation) => {
    setActiveReservation(resItem);
    setFormData({
      inquiryId: resItem.inquiryId || '',
      hotelId: resItem.hotelId,
      guestName: resItem.guestName,
      guestEmail: resItem.guestEmail || '',
      guestPhone: resItem.guestPhone || '',
      checkIn: new Date(resItem.checkIn).toISOString().split('T')[0],
      checkOut: new Date(resItem.checkOut).toISOString().split('T')[0],
      roomType: resItem.roomType,
      roomsCount: resItem.roomsCount,
      mealPlan: resItem.mealPlan,
      specialRequests: resItem.specialRequests || '',
      status: resItem.status,
      paymentStatus: resItem.paymentStatus,
      contractRate: resItem.contractRate,
      seasonalPricing: Number(resItem.seasonalPricing) || 0,
      commissionRate: resItem.commissionRate,
      totalAmount: resItem.totalAmount,
      holdUntil: resItem.holdUntil ? new Date(resItem.holdUntil).toISOString().substring(0, 16) : ''
    });
    setFormOpen(true);
  };

  const handleSaveReservation = async () => {
    if (!formData.hotelId || !formData.guestName || !formData.checkIn || !formData.checkOut || !formData.roomType) {
      toast.error('Required fields: Hotel, Guest Name, Room Type, and Check-In/Out dates.');
      return;
    }

    setSaving(true);
    const token = localStorage.getItem('teamToken');
    const method = activeReservation ? 'PATCH' : 'POST';
    const url = activeReservation 
      ? `${API_BASE_URL}/reservations/${activeReservation.id}` 
      : `${API_BASE_URL}/reservations`;

    // Convert holdUntil to ISO string if provided
    const payload = {
      ...formData,
      holdUntil: formData.holdUntil ? new Date(formData.holdUntil).toISOString() : null
    };

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save reservation');
      }

      toast.success(activeReservation ? 'Reservation updated successfully' : 'B2B Reservation successfully initialized');
      setFormOpen(false);
      fetchReservations();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const handleSimulateQuoteSend = async (id: string, channel: 'email' | 'whatsapp') => {
    setSendingChannel({ id, channel });
    const token = localStorage.getItem('teamToken');
    
    try {
      const response = await fetch(`${API_BASE_URL}/reservations/${id}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ channel })
      });

      if (!response.ok) throw new Error('Simulated transmission failed');
      
      toast.success(`Quote successfully sent via ${channel.toUpperCase()}!`, {
        description: `Simulated transmission logged in Partner CRM Audit Trail.`,
        icon: channel === 'whatsapp' ? '💬' : '✉️'
      });
      fetchReservations();
    } catch (e: any) {
      toast.error(e.message || 'Failed to transmit quote');
    } finally {
      setSendingChannel(null);
    }
  };

  const openConfirmationDialog = (resItem: HotelReservation) => {
    setActiveReservation(resItem);
    setConfirmRefCode(resItem.bookingReference || '');
    setConfirmOpen(true);
  };

  const handleConfirmReservation = async () => {
    if (!activeReservation) return;
    const token = localStorage.getItem('teamToken');

    try {
      const response = await fetch(`${API_BASE_URL}/reservations/${activeReservation.id}/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ bookingReference: confirmRefCode })
      });

      if (!response.ok) throw new Error('Confirmation update failed');
      toast.success('Hotel Booking Confirmed!', {
        description: 'Reservation marked as Confirmed and dues finalized.'
      });
      setConfirmOpen(false);
      fetchReservations();
    } catch (e: any) {
      toast.error(e.message || 'Failed to confirm reservation');
    }
  };

  const formatCountdown = (holdUntilStr?: string | null) => {
    if (!holdUntilStr) return 'N/A';
    const diff = new Date(holdUntilStr).getTime() - clock;
    if (diff <= 0) return 'Expired';
    const hrs = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Confirmed': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'Hold': return 'bg-amber-500/20 text-amber-400 border-amber-500/30 animate-pulse';
      case 'Sent': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'Pending': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'Rejected': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'Cancelled': return 'bg-white/10 text-white/50 border-white/20';
      default: return 'bg-white/10 text-white border-white/10';
    }
  };

  // KPI Calculations
  const pendingCount = reservations.filter(r => r.status === 'Pending' || r.status === 'Sent').length;
  const activeHolds = reservations.filter(r => {
    if (r.status !== 'Hold') return false;
    if (!r.holdUntil) return true;
    return new Date(r.holdUntil).getTime() > clock;
  }).length;
  
  const todayStr = new Date().toISOString().split('T')[0];
  const checkinsToday = reservations.filter(r => new Date(r.checkIn).toISOString().split('T')[0] === todayStr).length;
  const totalDuesVal = reservations.reduce((sum, r) => sum + r.hotelDues, 0);
  const totalMarginVal = reservations.reduce((sum, r) => sum + r.profitMargin, 0);

  // PDF Exporter using jsPDF (highly polished, single-page, dual-brand receipt)
  const handleExportVoucherPDF = (resItem: HotelReservation) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    
    // Core Layout Metrics
    const primaryColor = '#d4af37'; // Kashmir Gold
    const darkBg = '#0a0f12';
    const lightText = '#64748b';
    const darkText = '#0f172a';
    
    // Header Banner
    doc.setFillColor(10, 15, 18); // #0a0f12
    doc.rect(0, 0, 210, 45, 'F');
    
    // Title Branding
    doc.setTextColor(212, 175, 55); // Kashmir Gold
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('KASHMIR CURATORS', 20, 20);
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('Helvetica', 'normal');
    doc.text('B2B TRAVEL OPERATIONS & HOTEL RESERVATION MODULE', 20, 28);
    
    // Voucher Code / Status
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(212, 175, 55);
    const refCode = resItem.bookingReference ? `REF: ${resItem.bookingReference}` : `STATUS: ${resItem.status.toUpperCase()}`;
    doc.text(refCode, 190, 20, { align: 'right' });
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 190, 28, { align: 'right' });

    // Section 1: Reservation Details
    doc.setTextColor(darkText);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('HOTEL CONFIRMATION VOUCHER', 20, 60);
    
    // Divider line
    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(0.5);
    doc.line(20, 64, 190, 64);
    
    // Left Grid
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(lightText);
    doc.text('Guest Name:', 20, 75);
    doc.text('Guest Email:', 20, 83);
    doc.text('Guest Phone:', 20, 91);
    doc.text('Check-In Date:', 20, 99);
    doc.text('Check-Out Date:', 20, 107);
    
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(darkText);
    doc.text(resItem.guestName, 55, 75);
    doc.text(resItem.guestEmail || 'N/A', 55, 83);
    doc.text(resItem.guestPhone || 'N/A', 55, 91);
    doc.text(new Date(resItem.checkIn).toLocaleDateString('en-US', { dateStyle: 'long' }), 55, 99);
    doc.text(new Date(resItem.checkOut).toLocaleDateString('en-US', { dateStyle: 'long' }), 55, 107);

    // Right Grid
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(lightText);
    doc.text('Hotel Name:', 110, 75);
    doc.text('Hotel Location:', 110, 83);
    doc.text('Room Type:', 110, 91);
    doc.text('Rooms Count:', 110, 99);
    doc.text('Meal Plan:', 110, 107);
    
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(darkText);
    doc.text(resItem.hotel.name, 145, 75);
    doc.text(resItem.hotel.location, 145, 83);
    doc.text(resItem.roomType, 145, 91);
    doc.text(`${resItem.roomsCount} Room(s)`, 145, 99);
    doc.text(resItem.mealPlan, 145, 107);

    // Section 2: Special Instructions
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('SPECIAL REQUESTS & NOTES', 20, 122);
    
    doc.setDrawColor(226, 232, 240);
    doc.line(20, 125, 190, 125);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(darkText);
    const splitRequests = doc.splitTextToSize(resItem.specialRequests || 'No special requests submitted.', 170);
    doc.text(splitRequests, 20, 133);

    // Section 3: Billing & Dues (B2B Partner Intel)
    const billingY = 160;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('BILLING OVERVIEW (B2B PORTAL INTEL)', 20, billingY);
    doc.line(20, billingY + 3, 190, billingY + 3);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(lightText);
    doc.text('Contract Nightly Rate:', 20, billingY + 12);
    doc.text('Seasonal Pricing Markup:', 20, billingY + 20);
    doc.text('Gross Total Amount:', 20, billingY + 28);
    doc.text('Commission Rate:', 110, billingY + 12);
    doc.text('Hotel Net Dues:', 110, billingY + 20);
    doc.text('Earned Margin Profit:', 110, billingY + 28);

    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(darkText);
    doc.text(`INR ${resItem.contractRate.toLocaleString()}`, 65, billingY + 12);
    doc.text(`INR ${(resItem.seasonalPricing || 0).toLocaleString()}`, 65, billingY + 20);
    doc.text(`INR ${resItem.totalAmount.toLocaleString()}`, 65, billingY + 28);
    doc.text(`${resItem.commissionRate}%`, 150, billingY + 12);
    doc.setTextColor(190, 24, 74); // Crimson for Dues
    doc.text(`INR ${resItem.hotelDues.toLocaleString()}`, 150, billingY + 20);
    doc.setTextColor(16, 185, 129); // Emerald for Profit
    doc.text(`INR ${resItem.profitMargin.toLocaleString()}`, 150, billingY + 28);

    // Section 4: Terms & Footer
    const termsY = 210;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(darkText);
    doc.text('TERMS & CONDITIONS', 20, termsY);
    doc.line(20, termsY + 3, 190, termsY + 3);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(lightText);
    const terms = [
      '1. This confirmation is subject to hotel Net Terms and contract commission overrides.',
      '2. Cancelation or modifications must be processed through the Kashmir Curators operations desk.',
      '3. Hotel partner is requested to acknowledge guest arrival and confirm matching room particulars.',
      '4. Outstanding B2B net dues will be cleared as per the contract Net Terms (e.g., Net 30/Net 15).'
    ];
    terms.forEach((term, idx) => {
      doc.text(term, 20, termsY + 10 + (idx * 6));
    });

    // Signature Area
    const signY = 250;
    doc.setDrawColor(200, 200, 200);
    doc.line(130, signY, 185, signY);
    doc.setFontSize(8);
    doc.text('Operations Coordinator', 130, signY + 4);
    doc.text('Kashmir Curators Desk', 130, signY + 8);
    
    // Stamp overlay
    doc.setDrawColor(212, 175, 55);
    doc.setFillColor(254, 252, 232);
    doc.rect(132, signY - 22, 45, 14);
    doc.setTextColor(212, 175, 55);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('SYSTEM VERIFIED', 137, signY - 16);
    doc.setFontSize(7);
    doc.text('KASHMIR CONNECT B2B', 135, signY - 11);

    doc.save(`Voucher_HotelConfirmation_${resItem.guestName.replace(/\s+/g, '_')}.pdf`);
    toast.success('Hotel voucher generated as PDF!', {
      description: 'Downloaded file containing guest particulars and contract pricing.'
    });
  };

  const calculatedForm = calculateFormFields();

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* Title Header */}
      <div className="relative overflow-hidden p-10 rounded-[3rem] bg-gradient-to-br from-kashmir-gold/10 via-transparent to-transparent border border-white/5 shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-kashmir-gold/5 blur-[80px] -mr-32 -mt-32" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="space-y-2">
            <Badge className="bg-kashmir-gold text-black hover:bg-kashmir-gold border-none font-black px-4 py-1 rounded-full text-[10px] uppercase tracking-[0.2em] mb-4">
              Operations Control
            </Badge>
            <h1 className="text-4xl font-display font-black text-white leading-tight">Hotel Reservations</h1>
            <p className="text-white/40 text-sm max-w-xl font-medium leading-relaxed">
              Create, confirm, and audit reservations for partner hotels. Live sync of contract rates, seasonal pricing adjustments, and hold timers.
            </p>
          </div>
          <Button 
            onClick={openCreateDialog} 
            className="rounded-2xl bg-kashmir-gold text-black hover:bg-amber-500 font-bold uppercase tracking-widest px-6 h-14 shrink-0 transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" /> Create B2B Booking
          </Button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <Card className="bg-[#0a0f12]/40 bg-white/[0.02] border-white/5 p-6 rounded-3xl backdrop-blur-xl relative overflow-hidden transition-all duration-300 hover:border-kashmir-gold/20">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <CalendarCheck className="h-6 w-6 text-purple-400" />
            </div>
            <Badge className="bg-purple-500/20 text-purple-400 border-none font-black text-[9px] uppercase tracking-wider">Pending/Sent</Badge>
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">Confirmation Queue</p>
          <div className="text-3xl font-display font-black text-white">{pendingCount} <span className="text-xs text-white/30 font-medium">B2B requests</span></div>
        </Card>

        <Card className="bg-[#0a0f12]/40 bg-white/[0.02] border-white/5 p-6 rounded-3xl backdrop-blur-xl relative overflow-hidden transition-all duration-300 hover:border-kashmir-gold/20">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Clock className="h-6 w-6 text-amber-400" />
            </div>
            <Badge className="bg-amber-500/20 text-amber-400 border-none font-black text-[9px] uppercase tracking-wider">Active</Badge>
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">Temporary Holds</p>
          <div className="text-3xl font-display font-black text-white">{activeHolds} <span className="text-xs text-white/30 font-medium">running timers</span></div>
        </Card>

        <Card className="bg-[#0a0f12]/40 bg-white/[0.02] border-white/5 p-6 rounded-3xl backdrop-blur-xl relative overflow-hidden transition-all duration-300 hover:border-kashmir-gold/20">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Calendar className="h-6 w-6 text-blue-400" />
            </div>
            <Badge className="bg-blue-500/20 text-blue-400 border-none font-black text-[9px] uppercase tracking-wider">Check-in</Badge>
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">Arrivals Today</p>
          <div className="text-3xl font-display font-black text-white">{checkinsToday} <span className="text-xs text-white/30 font-medium">guests</span></div>
        </Card>

        <Card className="bg-[#0a0f12]/40 bg-white/[0.02] border-white/5 p-6 rounded-3xl backdrop-blur-xl relative overflow-hidden transition-all duration-300 hover:border-kashmir-gold/20">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-emerald-400" />
            </div>
            <Badge className="bg-emerald-500/20 text-emerald-400 border-none font-black text-[9px] uppercase tracking-wider">Pipeline</Badge>
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">Est. Gross Profits</p>
          <div className="text-3xl font-display font-black text-white">₹{totalMarginVal.toLocaleString()} <span className="text-xs text-white/30 font-medium">/ ₹{totalDuesVal.toLocaleString()} dues</span></div>
        </Card>
      </div>

      {/* Toolbar / Filters */}
      <Card className="bg-white/[0.02] border-white/5 p-6 rounded-[2rem] backdrop-blur-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative">
            <Input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearchKeyPress}
              placeholder="Search guest or ref..."
              className="bg-[#0a0f12]/60 border-white/5 rounded-xl pl-10 focus:border-kashmir-gold/30 h-12"
            />
            <Search className="w-4 h-4 text-white/20 absolute left-3.5 top-1/2 -translate-y-1/2" />
          </div>
          
          <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val)}>
            <SelectTrigger className="bg-[#0a0f12]/60 border-white/5 rounded-xl h-12 text-white/60">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent className="bg-[#0a0f12]/95 border-white/10 text-white rounded-xl">
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Sent">Sent</SelectItem>
              <SelectItem value="Confirmed">Confirmed</SelectItem>
              <SelectItem value="Hold">Hold</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Select value={hotelFilter} onValueChange={(val) => setHotelFilter(val)}>
            <SelectTrigger className="bg-[#0a0f12]/60 border-white/5 rounded-xl h-12 text-white/60">
              <SelectValue placeholder="Filter by hotel" />
            </SelectTrigger>
            <SelectContent className="bg-[#0a0f12]/95 border-white/10 text-white rounded-xl">
              <SelectItem value="all">All Hotels</SelectItem>
              {hotels.map(h => (
                <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div>
            <Input 
              type="date"
              value={checkInStart}
              onChange={(e) => setCheckInStart(e.target.value)}
              placeholder="Check-In Start"
              className="bg-[#0a0f12]/60 border-white/5 rounded-xl text-white/60 h-12"
            />
          </div>

          <div className="flex gap-2">
            <Input 
              type="date"
              value={checkInEnd}
              onChange={(e) => setCheckInEnd(e.target.value)}
              placeholder="Check-In End"
              className="bg-[#0a0f12]/60 border-white/5 rounded-xl text-white/60 h-12 flex-1"
            />
            <Button 
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setHotelFilter('all');
                setCheckInStart('');
                setCheckInEnd('');
              }}
              variant="outline" 
              className="border-white/5 hover:bg-white/10 rounded-xl px-3 shrink-0 h-12 text-white/40 hover:text-white"
            >
              Reset
            </Button>
          </div>
        </div>
      </Card>

      {/* Main Data Table */}
      <Card className="bg-[#0a0f12]/40 bg-white/[0.02] border-white/5 rounded-[2.5rem] overflow-hidden backdrop-blur-xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-8 h-8 text-kashmir-gold animate-spin" />
            <p className="text-white/20 text-xs font-black uppercase tracking-widest">Compiling operations data...</p>
          </div>
        ) : reservations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <CalendarCheck className="w-12 h-12 text-white/10" />
            <p className="text-white/20 text-xs font-black uppercase tracking-widest">No reservations found matching filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-white/[0.02] border-b border-white/5">
                <TableRow className="hover:bg-transparent border-white/5">
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-white/30 h-14 pl-6">Guest / Inquiry</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-white/30 h-14">Hotel particulars</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-white/30 h-14">Check-in / out</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-white/30 h-14">Hold countdown</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-white/30 h-14">Financial grid</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-white/30 h-14">Status</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-white/30 h-14 text-right pr-6">Quick actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservations.map((item) => (
                  <TableRow 
                    key={item.id} 
                    className="border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer group"
                    onClick={() => openEditDialog(item)}
                  >
                    {/* Guest Name & Inquiry Link */}
                    <TableCell className="pl-6 py-5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white group-hover:text-kashmir-gold transition-colors">{item.guestName}</span>
                          {item.hasConflict && (
                            <Badge className="bg-red-500/20 text-red-400 border-none font-bold text-[9px] flex items-center gap-1 py-0.5 px-1.5 animate-pulse" title="Overlapping booking conflict detected!">
                              <AlertTriangle className="w-3 h-3 text-red-400" /> Conflict
                            </Badge>
                          )}
                        </div>
                        <p className="text-[10px] text-white/30 font-semibold uppercase tracking-tighter">
                          {item.inquiryId ? `Lead: KC-${item.inquiryId.substring(0, 5).toUpperCase()}` : 'Manual Entry'}
                        </p>
                      </div>
                    </TableCell>

                    {/* Hotel Particulars */}
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-bold text-white/80">{item.hotel.name}</p>
                        <p className="text-[10px] text-kashmir-gold/60 font-bold uppercase">
                          {item.roomType} • {item.roomsCount} Room(s) • {item.mealPlan}
                        </p>
                      </div>
                    </TableCell>

                    {/* Check-In / Out Dates */}
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-xs text-white/80 font-bold">{`${new Date(item.checkIn).toLocaleDateString()} → ${new Date(item.checkOut).toLocaleDateString()}`}</p>
                        <p className="text-[10px] text-white/30 uppercase tracking-widest font-black">
                          {Math.max(1, Math.ceil((new Date(item.checkOut).getTime() - new Date(item.checkIn).getTime()) / (1000 * 60 * 60 * 24)))} Nights
                        </p>
                      </div>
                    </TableCell>

                    {/* Hold Countdown */}
                    <TableCell>
                      {item.status === 'Hold' ? (
                        <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-black">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          <span>{formatCountdown(item.holdUntil)}</span>
                        </div>
                      ) : (
                        <span className="text-white/20 text-xs">-</span>
                      )}
                    </TableCell>

                    {/* Financial Grid */}
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-white/80 font-bold" title="Gross amount paid by client">₹{item.totalAmount.toLocaleString()}</span>
                          <span className="text-[9px] text-emerald-400 font-bold" title="Operational profit margin">(+₹{item.profitMargin.toLocaleString()})</span>
                        </div>
                        <p className="text-[10px] text-red-400/60 font-semibold uppercase tracking-tighter" title="Outstanding dues to hotel">
                          Dues: ₹{item.hotelDues.toLocaleString()}
                        </p>
                      </div>
                    </TableCell>

                    {/* Status Badge */}
                    <TableCell>
                      <Badge className={cn("border bg-transparent px-3 py-1 text-[9px] font-black uppercase tracking-widest", getStatusBadgeColor(item.status))}>
                        {item.status}
                      </Badge>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="pr-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end items-center gap-2">
                        {item.status === 'Pending' && (
                          <>
                            <Button
                              onClick={() => handleSimulateQuoteSend(item.id, 'email')}
                              disabled={sendingChannel !== null}
                              size="icon"
                              variant="outline"
                              className="w-9 h-9 rounded-xl border-white/5 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white"
                              title="Simulate Send Email Quote"
                            >
                              {sendingChannel?.id === item.id && sendingChannel?.channel === 'email' ? (
                                <Loader2 className="w-4 h-4 text-white animate-spin" />
                              ) : (
                                <Mail className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              onClick={() => handleSimulateQuoteSend(item.id, 'whatsapp')}
                              disabled={sendingChannel !== null}
                              size="icon"
                              variant="outline"
                              className="w-9 h-9 rounded-xl border-white/5 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white"
                              title="Simulate Send WhatsApp Quote"
                            >
                              {sendingChannel?.id === item.id && sendingChannel?.channel === 'whatsapp' ? (
                                <Loader2 className="w-4 h-4 text-white animate-spin" />
                              ) : (
                                <MessageSquare className="w-4 h-4" />
                              )}
                            </Button>
                          </>
                        )}
                        {item.status !== 'Confirmed' && item.status !== 'Cancelled' && item.status !== 'Rejected' && (
                          <Button
                            onClick={() => openConfirmationDialog(item)}
                            className="bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-black font-bold text-[9px] uppercase tracking-wider h-9 px-3 rounded-xl border border-emerald-500/20"
                          >
                            Confirm
                          </Button>
                        )}
                        <Button
                          onClick={() => handleExportVoucherPDF(item)}
                          size="icon"
                          variant="outline"
                          className="w-9 h-9 rounded-xl border-white/5 bg-white/5 hover:bg-white/10 text-kashmir-gold"
                          title="Download PDF confirmation slip / voucher"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Audit timeline button */}
      {reservations.length > 0 && (
        <div className="flex justify-end pr-2">
          <Button 
            onClick={() => setTimelineOpen(true)}
            variant="ghost" 
            className="rounded-xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest px-6 h-12 hover:text-kashmir-gold"
          >
            Open Audit logs feed <ChevronRight className="w-3 h-3 ml-2" />
          </Button>
        </div>
      )}

      {/* Creation / Editing Modal Form */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-4xl bg-[#0a0f12]/95 border-white/10 text-white rounded-[2.5rem] backdrop-blur-3xl overflow-y-auto max-h-[90vh] custom-scrollbar p-10">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-display font-bold text-white flex items-center gap-3">
              <CalendarCheck className="w-6 h-6 text-kashmir-gold" />
              {activeReservation ? 'Manage B2B Reservation' : 'Initialize B2B Hotel Reservation'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
            {/* Left Column: Basic Details */}
            <div className="space-y-6">
              <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl space-y-4">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-kashmir-gold/60 mb-2">Guest & Lead parameters</h3>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Link Trip Inquiry (Optional)</label>
                  <Select value={formData.inquiryId} onValueChange={handleInquiryChange}>
                    <SelectTrigger className="bg-[#0a0f12]/80 border-white/10 rounded-xl h-11 text-white">
                      <SelectValue placeholder="Select Inquiry to Link" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0a0f12]/95 border-white/10 text-white rounded-xl max-h-56">
                      <SelectItem value="none">No Linked Inquiry</SelectItem>
                      {inquiries.map(inq => (
                        <SelectItem key={inq.id} value={inq.id}>{inq.customerName} ({inq.destination})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Guest Full Name</label>
                  <Input 
                    value={formData.guestName}
                    onChange={(e) => setFormData({...formData, guestName: e.target.value})}
                    placeholder="E.g. Rajesh Kumar"
                    className="bg-[#0a0f12]/80 border-white/10 rounded-xl h-11 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Guest Email</label>
                    <Input 
                      value={formData.guestEmail}
                      onChange={(e) => setFormData({...formData, guestEmail: e.target.value})}
                      placeholder="rajesh@example.com"
                      className="bg-[#0a0f12]/80 border-white/10 rounded-xl h-11 text-white text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Guest Phone</label>
                    <Input 
                      value={formData.guestPhone}
                      onChange={(e) => setFormData({...formData, guestPhone: e.target.value})}
                      placeholder="+91 9876543210"
                      className="bg-[#0a0f12]/80 border-white/10 rounded-xl h-11 text-white text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl space-y-4">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-400 mb-2">Dates & Accommodations</h3>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Select Hotel Partner</label>
                  <Select value={formData.hotelId} onValueChange={handleHotelChange}>
                    <SelectTrigger className="bg-[#0a0f12]/80 border-white/10 rounded-xl h-11 text-white">
                      <SelectValue placeholder="Select Hotel" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0a0f12]/95 border-white/10 text-white rounded-xl">
                      {hotels.map(h => (
                        <SelectItem key={h.id} value={h.id}>{h.name} ({h.location})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Check-in Date</label>
                    <Input 
                      type="date"
                      value={formData.checkIn}
                      onChange={(e) => setFormData({...formData, checkIn: e.target.value})}
                      className="bg-[#0a0f12]/80 border-white/10 rounded-xl h-11 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Check-out Date</label>
                    <Input 
                      type="date"
                      value={formData.checkOut}
                      onChange={(e) => setFormData({...formData, checkOut: e.target.value})}
                      className="bg-[#0a0f12]/80 border-white/10 rounded-xl h-11 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Room Type</label>
                    {/* Pre-filled from hotel room types if available */}
                    {hotels.find(h => h.id === formData.hotelId)?.roomTypes?.length ? (
                      <Select 
                        value={formData.roomType} 
                        onValueChange={(val) => {
                          const h = hotels.find(ht => ht.id === formData.hotelId);
                          const rType = h?.roomTypes?.find((r: any) => r.name === val);
                          setFormData(prev => ({
                            ...prev,
                            roomType: val,
                            contractRate: rType ? rType.price : prev.contractRate
                          }));
                        }}
                      >
                        <SelectTrigger className="bg-[#0a0f12]/80 border-white/10 rounded-xl h-11 text-white text-xs">
                          <SelectValue placeholder="Select Room Type" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0a0f12]/95 border-white/10 text-white rounded-xl">
                          {hotels.find(h => h.id === formData.hotelId)?.roomTypes?.map((r: any) => (
                            <SelectItem key={r.id || r.name} value={r.name}>{r.name} (₹{r.price.toLocaleString()})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input 
                        value={formData.roomType}
                        onChange={(e) => setFormData({...formData, roomType: e.target.value})}
                        placeholder="Luxury Room"
                        className="bg-[#0a0f12]/80 border-white/10 rounded-xl h-11 text-white"
                      />
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Meal Plan</label>
                    <Select value={formData.mealPlan} onValueChange={(val) => setFormData({...formData, mealPlan: val})}>
                      <SelectTrigger className="bg-[#0a0f12]/80 border-white/10 rounded-xl h-11 text-white">
                        <SelectValue placeholder="Meal Plan" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0a0f12]/95 border-white/10 text-white rounded-xl">
                        <SelectItem value="EP">EP (Room Only)</SelectItem>
                        <SelectItem value="CP">CP (Room + Breakfast)</SelectItem>
                        <SelectItem value="MAP">MAP (Room + Breakfast + Dinner)</SelectItem>
                        <SelectItem value="AP">AP (Room + All Meals)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Rooms Count</label>
                    <Input 
                      type="number"
                      value={formData.roomsCount}
                      onChange={(e) => setFormData({...formData, roomsCount: parseInt(e.target.value) || 1})}
                      className="bg-[#0a0f12]/80 border-white/10 rounded-xl h-11 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Reservation Status</label>
                    <Select value={formData.status} onValueChange={(val) => setFormData({...formData, status: val})}>
                      <SelectTrigger className="bg-[#0a0f12]/80 border-white/10 rounded-xl h-11 text-white">
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0a0f12]/95 border-white/10 text-white rounded-xl">
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Sent">Sent</SelectItem>
                        <SelectItem value="Confirmed">Confirmed</SelectItem>
                        <SelectItem value="Hold">Hold</SelectItem>
                        <SelectItem value="Rejected">Rejected</SelectItem>
                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {formData.status === 'Hold' && (
                  <div className="space-y-2 animate-in fade-in duration-300">
                    <label className="text-[10px] font-black uppercase tracking-widest text-amber-400 ml-1">Hold Until Timer</label>
                    <Input 
                      type="datetime-local"
                      value={formData.holdUntil}
                      onChange={(e) => setFormData({...formData, holdUntil: e.target.value})}
                      className="bg-[#0a0f12]/80 border-amber-500/20 focus:border-amber-400 rounded-xl h-11 text-amber-300"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Financial Breakdown & Timeline */}
            <div className="space-y-6">
              <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl space-y-4">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-400 mb-2">B2B Financial parameters</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Contract rate / night</label>
                    <div className="relative group/input">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 text-xs font-bold">₹</div>
                      <Input 
                        type="number"
                        value={formData.contractRate === 0 ? '' : formData.contractRate}
                        onChange={(e) => setFormData({...formData, contractRate: parseFloat(e.target.value) || 0})}
                        className="bg-[#0a0f12]/80 border-white/10 rounded-xl h-11 text-white pl-8"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Seasonal pricing markup</label>
                    <div className="relative group/input">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 text-xs font-bold">₹</div>
                      <Input 
                        type="number"
                        value={formData.seasonalPricing === 0 ? '' : formData.seasonalPricing}
                        onChange={(e) => setFormData({...formData, seasonalPricing: parseFloat(e.target.value) || 0})}
                        className="bg-[#0a0f12]/80 border-white/10 rounded-xl h-11 text-white pl-8"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Gross Total Amount</label>
                    <div className="relative group/input">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 text-xs font-bold">₹</div>
                      <Input 
                        type="number"
                        value={formData.totalAmount === 0 ? '' : formData.totalAmount}
                        onChange={(e) => setFormData({...formData, totalAmount: parseFloat(e.target.value) || 0})}
                        className="bg-[#0a0f12]/80 border-white/10 rounded-xl h-11 text-white pl-8 font-bold"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Commission rate (%)</label>
                    <div className="relative group/input">
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 text-xs font-bold">%</div>
                      <Input 
                        type="number"
                        value={formData.commissionRate === 0 ? '' : formData.commissionRate}
                        onChange={(e) => setFormData({...formData, commissionRate: parseFloat(e.target.value) || 0})}
                        className="bg-[#0a0f12]/80 border-white/10 rounded-xl h-11 text-white pr-8"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Payment Status</label>
                  <Select value={formData.paymentStatus} onValueChange={(val) => setFormData({...formData, paymentStatus: val})}>
                    <SelectTrigger className="bg-[#0a0f12]/80 border-white/10 rounded-xl h-11 text-white">
                      <SelectValue placeholder="Payment status" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0a0f12]/95 border-white/10 text-white rounded-xl">
                      <SelectItem value="Unpaid">Unpaid</SelectItem>
                      <SelectItem value="Partially Paid">Partially Paid</SelectItem>
                      <SelectItem value="Paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Auto summary calculation card */}
                <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl space-y-2 mt-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/40">Duration Nights:</span>
                    <span className="font-bold text-white">{calculatedForm.nights} Nights</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/40">Hotel Net Dues:</span>
                    <span className="font-bold text-rose-400">₹{calculatedForm.dues.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs pt-2 border-t border-white/5">
                    <span className="text-emerald-400 font-bold uppercase tracking-widest text-[9px]">Operational Profit Margin:</span>
                    <span className="font-bold text-emerald-400">₹{calculatedForm.profit.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl space-y-4">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/40 ml-1">Special requests & notes</h3>
                <Textarea 
                  value={formData.specialRequests}
                  onChange={(e) => setFormData({...formData, specialRequests: e.target.value})}
                  placeholder="E.g., Honey moon decor, extra bed request, vegetarian meals only."
                  className="bg-[#0a0f12]/80 border-white/10 rounded-xl min-h-[90px] text-xs text-white/70"
                />
              </div>
            </div>
          </div>

          {/* Historical timeline logs (Only show when editing) */}
          {activeReservation && activeReservation.auditLogs && (
            <div className="mt-8 pt-8 border-t border-white/5 space-y-4">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white/30 pl-1">Lifecycle Audit logs trail</h3>
              <div className="space-y-4 pl-4 border-l border-white/5 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                {JSON.parse(activeReservation.auditLogs || '[]').map((log: any, idx: number) => (
                  <div key={idx} className="relative text-xs">
                    <div className="absolute left-[-21px] top-1.5 w-2.5 h-2.5 rounded-full bg-kashmir-gold border border-[#0a0f12]" />
                    <p className="font-bold text-white/80">{log.action}</p>
                    <p className="text-[10px] text-white/40 mt-0.5">
                      {new Date(log.timestamp).toLocaleString()} • Operator: {log.user}
                    </p>
                    {log.details && <p className="text-[10px] text-white/30 mt-1 italic">{log.details}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter className="mt-8 gap-3 border-t border-white/5 pt-6">
            <Button variant="ghost" onClick={() => setFormOpen(false)} className="rounded-xl border border-white/5 h-12 text-white/40 hover:text-white hover:bg-white/5">
              Cancel
            </Button>
            <Button 
              onClick={handleSaveReservation} 
              disabled={saving}
              className="bg-kashmir-gold hover:bg-amber-500 text-black font-bold uppercase tracking-widest px-6 h-12 rounded-xl transition-all flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : 'Save Reservation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Modal */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md bg-[#0a0f12]/95 border-white/10 text-white rounded-3xl p-8 backdrop-blur-3xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-bold flex items-center gap-3">
              <UserCheck className="w-5 h-5 text-emerald-400" />
              Confirm Hotel Booking
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <p className="text-xs text-white/60 leading-relaxed">
              Confirming this booking will lock contract rates, clear hold timers, and finalize dues. Please enter the hotel booking confirmation reference code.
            </p>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Confirmation reference code</label>
              <Input 
                value={confirmRefCode}
                onChange={(e) => setConfirmRefCode(e.target.value)}
                placeholder="E.g., KC/2026/A4918"
                className="bg-[#0a0f12]/80 border-white/10 rounded-xl h-11 text-white font-mono"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setConfirmOpen(false)} className="rounded-xl border border-white/5 text-white/40 hover:text-white hover:bg-white/5">
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmReservation}
              className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold uppercase tracking-widest px-5 h-11 rounded-xl"
            >
              Confirm Reservation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Audit timeline full dialog */}
      <Dialog open={timelineOpen} onOpenChange={setTimelineOpen}>
        <DialogContent className="max-w-2xl bg-[#0a0f12]/95 border-white/10 text-white rounded-3xl p-8 backdrop-blur-3xl overflow-y-auto max-h-[80vh] custom-scrollbar">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-xl font-bold flex items-center gap-3">
              <FileSpreadsheet className="w-5 h-5 text-kashmir-gold" />
              Global Audit Timeline
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-8 pl-4 border-l border-white/5 py-4">
            {reservations.flatMap(r => {
              try {
                return JSON.parse(r.auditLogs || '[]').map((log: any) => ({
                  ...log,
                  guestName: r.guestName,
                  hotelName: r.hotel.name,
                  resId: r.id
                }));
              } catch (e) {
                return [];
              }
            })
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 30)
            .map((log: any, idx: number) => (
              <div key={idx} className="relative text-xs">
                <div className="absolute left-[-21px] top-1.5 w-2.5 h-2.5 rounded-full bg-kashmir-gold border border-[#0a0f12]" />
                <p className="font-bold text-white/95">
                  {log.action} <span className="text-white/30 font-normal">for</span> {log.guestName} <span className="text-white/30 font-normal">@</span> {log.hotelName}
                </p>
                <p className="text-[9px] text-white/40 mt-0.5">
                  {new Date(log.timestamp).toLocaleString()} • Operator: {log.user}
                </p>
                {log.details && <p className="text-[10px] text-white/30 mt-1 italic">{log.details}</p>}
              </div>
            ))}
            {reservations.length === 0 && (
              <p className="text-xs text-white/30 text-center py-8">No historical trail recorded.</p>
            )}
          </div>

          <DialogFooter className="pt-4 border-t border-white/5">
            <Button variant="ghost" onClick={() => setTimelineOpen(false)} className="rounded-xl border border-white/5 text-white/40 hover:text-white hover:bg-white/5">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
