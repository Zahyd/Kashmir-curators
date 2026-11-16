import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, 
  CalendarCheck2, 
  BedDouble, 
  Send, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  AlertTriangle, 
  Search, 
  Download, 
  RefreshCw, 
  Plus, 
  Eye, 
  Share2, 
  Mail, 
  Phone, 
  Calendar, 
  DollarSign, 
  User, 
  FileText, 
  SlidersHorizontal, 
  Layers, 
  ShieldCheck, 
  MessageSquare, 
  Sparkles, 
  ChevronRight, 
  Check, 
  X, 
  ArrowUpDown, 
  Filter, 
  LogIn, 
  LogOut, 
  RotateCcw, 
  FileCheck,
  AlertCircle,
  ExternalLink,
  History,
  SendHorizontal,
  Trash2,
  Pencil,
  LayoutGrid,
  List
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useTeamAuth } from '@/contexts/TeamAuthContext';
import { getHospitalityHeaders, getHospitalityToken } from '../utils/hospitalityAuth';

export interface ReservationRecord {
  id: string;
  bookingReference?: string;
  inquiryId?: string;
  hotelId: string;
  hotel?: {
    id: string;
    name: string;
    location: string;
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
    receptionEmail?: string;
    whatsappNumber?: string;
    managerName?: string;
    starRating?: number;
    image?: string;
  };
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  receptionEmail?: string;
  receptionPhone?: string;
  checkIn: string;
  checkOut: string;
  roomType: string;
  roomsCount: number;
  mealPlan: 'EP' | 'CP' | 'MAP' | 'AP';
  adults?: number;
  children?: number;
  childrenAges?: string;
  specialRequests?: string;
  status: 'Pending' | 'Sent' | 'Confirmed' | 'Checked-In' | 'Checked-Out' | 'Hold' | 'Rejected' | 'Cancelled';
  confirmationStage: 'PENDING_RESPONSE' | 'AVAILABILITY_CONFIRMED' | 'ALTERNATIVE_OFFERED' | 'HOTEL_CONFIRMED' | 'REJECTED_UNAVAILABLE' | 'EXPIRED' | 'CANCELLED';
  lifecycleStatus?: string;
  paymentStatus?: 'Unpaid' | 'Partially Paid' | 'Paid';
  contractRate: number;
  seasonalPricing?: number;
  totalAmount: number;
  profitMargin?: number;
  hotelDues?: number;
  agentName?: string;
  assignedEmployeeName?: string;
  assignedEmployeeCode?: string;
  destination?: string;
  bookingSource?: string;
  bedConfiguration?: string;
  hotelConfirmationNumber?: string;
  confirmedRoomType?: string;
  confirmedRoomsCount?: number;
  confirmedTariff?: number;
  confirmedMealPlan?: string;
  receptionNotes?: string;
  rejectionReason?: string;
  alternativeRoomType?: string;
  alternativeTariff?: number;
  alternativeDates?: string;
  alternativeNotes?: string;
  guestVoucherDispatched?: boolean;
  guestVoucherDispatchedAt?: string;
  voucherApprovedBy?: string;
  voucherApprovedAt?: string;
  assignedRoomNumber?: string;
  secureToken?: string;
  tokenExpiresAt?: string;
  confirmationDeadline?: string;
  hasConflict?: boolean;
  auditLogs?: string;
  emailDispatches?: any[];
  createdAt: string;
  updatedAt: string;
}

interface OperationalKpis {
  totalReservations: number;
  pendingHotelResponses: number;
  availabilityVerified: number;
  alternativeOffered: number;
  hotelConfirmed: number;
  guestVoucherDispatched: number;
  guestCheckedIn: number;
  cancelledReservations: number;
  upcomingCheckIns: number;
  todayCheckOuts: number;
  totalRevenue: number;
  outstandingHotelPayments: number;
}

export const validatePhoneNumber = (phone: string): { isValid: boolean; message?: string } => {
  if (!phone || !phone.trim()) {
    return { isValid: false, message: 'Phone number is required' };
  }
  const trimmed = phone.trim();
  if (/[a-zA-Z]/.test(trimmed)) {
    return { isValid: false, message: 'Phone number cannot contain letters' };
  }
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length < 10) {
    return { isValid: false, message: `Phone number is incomplete (${digits.length}/10 digits minimum)` };
  }
  if (digits.length > 15) {
    return { isValid: false, message: `Phone number exceeds max length (${digits.length}/15 digits)` };
  }
  if (/^(\d)\1{9,}$/.test(digits)) {
    return { isValid: false, message: 'Invalid phone number format (repeated digits)' };
  }
  if (digits.length === 10) {
    if (!/^[6-9]\d{9}$/.test(digits)) {
      return { isValid: false, message: 'Indian mobile numbers must start with 6, 7, 8, or 9' };
    }
  } else if (digits.length === 12 && digits.startsWith('91')) {
    if (!/^91[6-9]\d{9}$/.test(digits)) {
      return { isValid: false, message: 'Indian mobile numbers must start with 6, 7, 8, or 9 after +91' };
    }
  } else if (digits.length === 11 && digits.startsWith('0')) {
    if (!/^0[6-9]\d{9}$/.test(digits)) {
      return { isValid: false, message: 'Mobile numbers must start with 6, 7, 8, or 9 after 0' };
    }
  }
  return { isValid: true };
};

interface UnifiedOperationsWorkspaceProps {
  selectedHotelId: string;
  onSelectHotel: (hotelId: string) => void;
  onOpenReceptionDesk?: (reservationId: string) => void;
}

export const UnifiedOperationsWorkspace: React.FC<UnifiedOperationsWorkspaceProps> = ({
  selectedHotelId,
  onSelectHotel,
  onOpenReceptionDesk
}) => {
  const { token, user } = useAuth();
  const { teamUser } = useTeamAuth();

  const [reservations, setReservations] = useState<ReservationRecord[]>([]);
  const [hotelsList, setHotelsList] = useState<{ id: string; name: string; location: string; contactEmail?: string; contactPhone?: string; receptionEmail?: string; whatsappNumber?: string }[]>([]);
  const [categoriesList, setCategoriesList] = useState<{ id: string; hotelId: string; name: string; basePrice: number }[]>([]);
  const [kpis, setKpis] = useState<OperationalKpis>({
    totalReservations: 0,
    pendingHotelResponses: 0,
    availabilityVerified: 0,
    alternativeOffered: 0,
    hotelConfirmed: 0,
    guestVoucherDispatched: 0,
    guestCheckedIn: 0,
    cancelledReservations: 0,
    upcomingCheckIns: 0,
    todayCheckOuts: 0,
    totalRevenue: 0,
    outstandingHotelPayments: 0
  });

  const [isLoading, setIsLoading] = useState(true);
  const [kpisLoading, setKpisLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStage, setFilterStage] = useState<string>('ALL');
  const [filterDestination, setFilterDestination] = useState<string>('ALL');
  const [filterPayment, setFilterPayment] = useState<string>('ALL');
  const [filterSource, setFilterSource] = useState<string>('ALL');

  // Modals & Drawers
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [selectedRes, setSelectedRes] = useState<ReservationRecord | null>(null);

  const [resendEmailModalOpen, setResendEmailModalOpen] = useState(false);
  const [voucherModalOpen, setVoucherModalOpen] = useState(false);
  const [checkInModalOpen, setCheckInModalOpen] = useState(false);
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);

  // View Mode: Table List vs Interactive Kanban Pipeline
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [quickDateFilter, setQuickDateFilter] = useState<'ALL' | 'TODAY' | 'NEXT_48H' | 'IN_HOUSE' | 'HIGH_VALUE'>('ALL');

  // Delete & Bulk Action States
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [resToDelete, setResToDelete] = useState<ReservationRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Edit / Amend Booking States
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editRes, setEditRes] = useState<ReservationRecord | null>(null);
  const [editGuestName, setEditGuestName] = useState('');
  const [editGuestPhone, setEditGuestPhone] = useState('');
  const [editGuestEmail, setEditGuestEmail] = useState('');
  const [editCheckIn, setEditCheckIn] = useState('');
  const [editCheckOut, setEditCheckOut] = useState('');
  const [editRoomsCount, setEditRoomsCount] = useState('1');
  const [editRoomType, setEditRoomType] = useState('');
  const [editMealPlan, setEditMealPlan] = useState('MAP');
  const [editContractRate, setEditContractRate] = useState('');
  const [editTotalAmount, setEditTotalAmount] = useState('');
  const [editStatus, setEditStatus] = useState('Pending');
  const [editSpecialRequests, setEditSpecialRequests] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Action Form States
  const [targetEmail, setTargetEmail] = useState('');
  const [emailTemplateType, setEmailTemplateType] = useState('CONFIRMATION_REQUEST');
  const [voucherNotes, setVoucherNotes] = useState('');
  const [checkInRoomNumber, setCheckInRoomNumber] = useState('');
  const [checkInIdType, setCheckInIdType] = useState('Aadhaar Card');
  const [checkInIdNumber, setCheckInIdNumber] = useState('');
  const [overrideStatus, setOverrideStatus] = useState('Confirmed');
  const [overrideLifecycle, setOverrideLifecycle] = useState('HOTEL_CONFIRMED');
  const [overrideReason, setOverrideReason] = useState('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // AI Agent States
  const [rawAiInput, setRawAiInput] = useState('');
  const [isParsingAi, setIsParsingAi] = useState(false);
  const [aiParsedResult, setAiParsedResult] = useState<any>(null);
  const [isNudging, setIsNudging] = useState(false);
  const [aiAgentLogs, setAiAgentLogs] = useState<any[]>([]);

  // Multi-Section Dispatch Form State
  const [formStep, setFormStep] = useState<'GUEST' | 'HOTEL' | 'FINANCIAL' | 'DISPATCH'>('GUEST');
  const [dispGuestName, setDispGuestName] = useState('');
  const [dispGuestPhone, setDispGuestPhone] = useState('');
  const [dispGuestEmail, setDispGuestEmail] = useState('');
  const [dispAdults, setDispAdults] = useState('2');
  const [dispChildren, setDispChildren] = useState('0');
  const [dispChildrenAges, setDispChildrenAges] = useState('');
  const [dispRoomsCount, setDispRoomsCount] = useState('1');
  const [dispCheckIn, setDispCheckIn] = useState('');
  const [dispCheckOut, setDispCheckOut] = useState('');
  const [dispDestination, setDispDestination] = useState('Srinagar');
  const [dispBookingSource, setDispBookingSource] = useState('B2B_PORTAL');
  const [dispSpecialRequests, setDispSpecialRequests] = useState('');

  const [dispHotelId, setDispHotelId] = useState('');
  const [dispRoomType, setDispRoomType] = useState('');
  const [dispBedConfig, setDispBedConfig] = useState('King Bed');
  const [dispMealPlan, setDispMealPlan] = useState<'EP' | 'CP' | 'MAP' | 'AP'>('MAP');
  const [dispReceptionEmail, setDispReceptionEmail] = useState('');
  const [dispReceptionPhone, setDispReceptionPhone] = useState('');

  const [dispRatePerNight, setDispRatePerNight] = useState('12000');
  const [dispExtraCharges, setDispExtraCharges] = useState('0');
  const [dispSellingPrice, setDispSellingPrice] = useState('15000');
  const [dispAdvanceReceived, setDispAdvanceReceived] = useState('5000');
  const [dispAutoDispatchEmail, setDispAutoDispatchEmail] = useState(true);
  const [dispPhoneTouched, setDispPhoneTouched] = useState(false);
  const [editPhoneTouched, setEditPhoneTouched] = useState(false);

  const dispPhoneValidation = useMemo(() => {
    if (!dispGuestPhone && !dispPhoneTouched) return { isValid: true, message: '' };
    return validatePhoneNumber(dispGuestPhone);
  }, [dispGuestPhone, dispPhoneTouched]);

  const editPhoneValidation = useMemo(() => {
    if (!editGuestPhone && !editPhoneTouched) return { isValid: true, message: '' };
    return validatePhoneNumber(editGuestPhone);
  }, [editGuestPhone, editPhoneTouched]);

  // Auto-fill Hotel Reception details when hotel changes in dispatch form
  useEffect(() => {
    if (dispHotelId) {
      const h = hotelsList.find(item => item.id === dispHotelId);
      if (h) {
        setDispReceptionEmail(h.receptionEmail || h.contactEmail || '');
        setDispReceptionPhone(h.whatsappNumber || h.contactPhone || '');
        setDispDestination(h.location?.split(',')[0]?.trim() || 'Kashmir');
      }
    }
  }, [dispHotelId, hotelsList]);

  // Fetch KPI data
  const fetchKpis = async () => {
    try {
      setKpisLoading(true);
      const headers = getHospitalityHeaders(token);
      const hotelParam = selectedHotelId && selectedHotelId !== 'ALL' ? `?hotelId=${selectedHotelId}` : '';
      const res = await fetch(`${API_BASE_URL}/hospitality/operations/kpi-summary${hotelParam}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setKpis(data);
      }
    } catch (err) {
      console.error('Failed to load KPIs:', err);
    } finally {
      setKpisLoading(false);
    }
  };

  // Fetch Reservations list
  const fetchReservations = async () => {
    try {
      setIsLoading(true);
      const headers = getHospitalityHeaders(token);
      const params = new URLSearchParams();
      if (selectedHotelId && selectedHotelId !== 'ALL') params.append('hotelId', selectedHotelId);
      if (filterStage && filterStage !== 'ALL') {
        if (['Pending', 'Sent', 'Confirmed', 'Checked-In', 'Checked-Out', 'Cancelled'].includes(filterStage)) {
          params.append('status', filterStage);
        } else {
          params.append('confirmationStage', filterStage);
        }
      }
      if (filterDestination && filterDestination !== 'ALL') params.append('destination', filterDestination);
      if (filterPayment && filterPayment !== 'ALL') params.append('paymentStatus', filterPayment);
      if (filterSource && filterSource !== 'ALL') params.append('source', filterSource);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await fetch(`${API_BASE_URL}/hospitality?${params.toString()}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setReservations(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to load reservations:', err);
      toast.error('Unable to fetch live reservation records');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch hotels & categories for selectors
  const fetchMetadata = async () => {
    try {
      const [hRes, cRes] = await Promise.all([
        fetch(`${API_BASE_URL}/hotels`),
        fetch(`${API_BASE_URL}/hotels/operations/categories`, { headers: getHospitalityHeaders(token) })
      ]);
      if (hRes.ok) {
        const data = await hRes.json();
        setHotelsList(Array.isArray(data) ? data : []);
        if (data.length > 0 && !dispHotelId) {
          setDispHotelId(data[0].id);
        }
      }
      if (cRes.ok) {
        const cData = await cRes.json();
        setCategoriesList(Array.isArray(cData) ? cData : []);
      }
    } catch (err) {
      console.error('Failed to load metadata:', err);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchKpis();
    fetchReservations();
  }, [selectedHotelId, filterStage, filterDestination, filterPayment, filterSource]);

  // Handle Search Debounce or trigger
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReservations();
  };

  // Filtered reservations in memory if instant search & quick presets
  const displayedReservations = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    return reservations.filter(r => {
      // 1. Text Search Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches = 
          r.guestName?.toLowerCase().includes(q) ||
          r.bookingReference?.toLowerCase().includes(q) ||
          r.hotelConfirmationNumber?.toLowerCase().includes(q) ||
          r.hotel?.name?.toLowerCase().includes(q) ||
          r.guestPhone?.includes(q) ||
          r.guestEmail?.toLowerCase().includes(q) ||
          r.destination?.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // 2. Quick Presets Filter
      if (quickDateFilter === 'TODAY') {
        const checkInStr = (r.checkIn || '').split('T')[0];
        const checkOutStr = (r.checkOut || '').split('T')[0];
        if (checkInStr !== todayStr && checkOutStr !== todayStr) return false;
      } else if (quickDateFilter === 'NEXT_48H') {
        const checkInDate = new Date(r.checkIn);
        if (checkInDate < now || checkInDate > in48h) return false;
      } else if (quickDateFilter === 'IN_HOUSE') {
        if (r.status !== 'Checked-In') return false;
      } else if (quickDateFilter === 'HIGH_VALUE') {
        if ((r.totalAmount || 0) < 40000) return false;
      }

      return true;
    });
  }, [reservations, searchQuery, quickDateFilter]);

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setQuickDateFilter('ALL');
    setFilterStage('ALL');
    setFilterDestination('ALL');
    setFilterPayment('ALL');
    setFilterSource('ALL');
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (displayedReservations.length === 0) {
      toast.info('No reservations available to export');
      return;
    }

    const headers = [
      'Booking Reference',
      'Guest Name',
      'Phone',
      'Email',
      'Hotel',
      'Destination',
      'Check-In',
      'Check-Out',
      'Rooms',
      'Room Type',
      'Meal Plan',
      'Gross Selling Price',
      'Hotel Net Dues',
      'Status',
      'Hotel Confirmation Stage',
      'Hotel CRS Ref',
      'Payment Status',
      'Voucher Dispatched',
      'Assigned Employee',
      'Created Date'
    ];

    const rows = displayedReservations.map(r => [
      `"${r.bookingReference || r.id}"`,
      `"${r.guestName}"`,
      `"${r.guestPhone || ''}"`,
      `"${r.guestEmail || ''}"`,
      `"${r.hotel?.name || ''}"`,
      `"${r.destination || r.hotel?.location || ''}"`,
      `"${new Date(r.checkIn).toLocaleDateString('en-IN')}"`,
      `"${new Date(r.checkOut).toLocaleDateString('en-IN')}"`,
      r.roomsCount || 1,
      `"${r.roomType}"`,
      `"${r.mealPlan}"`,
      r.totalAmount || 0,
      r.hotelDues || 0,
      `"${r.status}"`,
      `"${r.confirmationStage}"`,
      `"${r.hotelConfirmationNumber || ''}"`,
      `"${r.paymentStatus || 'Unpaid'}"`,
      r.guestVoucherDispatched ? 'Yes' : 'No',
      `"${r.assignedEmployeeName || r.agentName || ''}"`,
      `"${new Date(r.createdAt).toLocaleDateString('en-IN')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `kashmir_curators_reservations_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${displayedReservations.length} reservations to CSV.`);
  };

  // Submit Multi-Section Dispatch Form
  const handleDispatchSubmit = async (e?: React.FormEvent, dispatchMode?: 'WHATSAPP' | 'EMAIL') => {
    if (e) e.preventDefault();
    setDispPhoneTouched(true);

    const phoneVal = validatePhoneNumber(dispGuestPhone);
    if (!phoneVal.isValid) {
      toast.error(`Incorrect Guest Phone Number: ${phoneVal.message || 'Please provide a valid 10-digit mobile or international number.'}`);
      setFormStep('GUEST');
      return;
    }

    if (dispReceptionPhone.trim()) {
      const recVal = validatePhoneNumber(dispReceptionPhone);
      if (!recVal.isValid) {
        toast.error(`Incorrect Reception Phone: ${recVal.message}`);
        setFormStep('HOTEL');
        return;
      }
    }

    if (!dispHotelId || !dispGuestName.trim() || !dispCheckIn || !dispCheckOut) {
      toast.error('Please complete mandatory guest name, hotel, and travel dates.');
      return;
    }

    try {
      setIsSubmittingAction(true);
      const authToken = getHospitalityToken(token);
      const headers = getHospitalityHeaders(authToken);

      const nights = Math.max(1, Math.ceil((new Date(dispCheckOut).getTime() - new Date(dispCheckIn).getTime()) / (1000 * 60 * 60 * 24)));
      const count = Number(dispRoomsCount) || 1;
      const rate = Number(dispRatePerNight) || 12000;
      const extra = Number(dispExtraCharges) || 0;
      const grossSelling = Number(dispSellingPrice) || (rate * count * nights);
      const idempotencyKey = `DISP-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const res = await fetch(`${API_BASE_URL}/hospitality`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify({
          hotelId: dispHotelId,
          guestName: dispGuestName.trim(),
          guestPhone: dispGuestPhone.trim() || undefined,
          guestEmail: dispGuestEmail.trim() || undefined,
          receptionEmail: dispReceptionEmail.trim() || undefined,
          receptionPhone: dispReceptionPhone.trim() || undefined,
          checkIn: new Date(dispCheckIn).toISOString(),
          checkOut: new Date(dispCheckOut).toISOString(),
          roomsCount: count,
          roomType: dispRoomType || 'Deluxe Room',
          mealPlan: dispMealPlan,
          adults: Number(dispAdults) || 2,
          children: Number(dispChildren) || 0,
          childrenAges: dispChildrenAges.trim() || undefined,
          destination: dispDestination,
          bookingSource: dispBookingSource,
          bedConfiguration: dispBedConfig,
          requestedTariff: rate,
          agreedWholesaleRate: rate,
          contractRate: rate,
          totalAmount: grossSelling + extra,
          advanceReceived: Number(dispAdvanceReceived) || 0,
          outstandingAmount: Math.max(0, grossSelling + extra - (Number(dispAdvanceReceived) || 0)),
          specialRequests: dispSpecialRequests.trim() || undefined,
          idempotencyKey,
          dispatchEmailImmediately: dispAutoDispatchEmail || dispatchMode === 'EMAIL'
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to dispatch booking reservation.');
      }

      const createdData = await res.json();
      const bookingRef = createdData.bookingReference || `KC-HTL-${createdData.id?.slice(0, 8).toUpperCase()}`;
      const secureToken = createdData.secureToken || createdData.id;
      const portalUrl = `${window.location.origin}/hospitality?tab=reception&token=${secureToken}`;
      
      const hotel = hotelsList.find(item => item.id === dispHotelId);
      const hotelName = hotel?.name || createdData.hotel?.name || 'Partner Hotel';
      const hotelLocation = hotel?.location || createdData.hotel?.location || 'Kashmir';
      const checkInFormatted = new Date(dispCheckIn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      const checkOutFormatted = new Date(dispCheckOut).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

      if (dispatchMode === 'WHATSAPP') {
        const rawPhone = dispReceptionPhone.trim() || hotel?.contactPhone || hotel?.whatsappNumber || '';
        const cleanDigits = rawPhone.replace(/\D/g, '');
        const waNumber = cleanDigits.length === 10 ? `91${cleanDigits}` : cleanDigits;

        const whatsappMsg = 
`*HOTEL BOOKING RESERVATION VOUCHER — KASHMIR CURATORS DMC*
Ref: *#${bookingRef}*
--------------------------------------------------
🏨 *Hotel / Property:* ${hotelName} (${hotelLocation})
👤 *Lead Guest:* ${dispGuestName.trim()} (${dispAdults} Adults)
📞 *Guest Contact:* ${dispGuestPhone.trim() || 'On File'}
✉️ *Guest Email:* ${dispGuestEmail.trim() || 'On File'}
📅 *Check-In:* ${checkInFormatted}
📅 *Check-Out:* ${checkOutFormatted} (${nights} Night${nights > 1 ? 's' : ''})
🛏️ *Accommodation:* ${count}x ${dispRoomType || 'Deluxe Room'}
🍽️ *Meal Plan:* ${dispMealPlan}
💰 *Agreed Tariff:* ₹${rate.toLocaleString('en-IN')}/night (Total: ₹${(grossSelling + extra).toLocaleString('en-IN')})
❄️ *Winter / Special Requests:* ${dispSpecialRequests.trim() || 'Standard Bukhari heating / VIP arrival setup'}
--------------------------------------------------
⚡ *1-Click Instant Reception Confirmation Link:*
${portalUrl}

_Please click the portal link above to confirm room availability and assign your hotel confirmation number._
— Kashmir Curators DMC Reservation Desk`;

        const waUrl = waNumber 
          ? `https://wa.me/${waNumber}?text=${encodeURIComponent(whatsappMsg)}`
          : `https://wa.me/?text=${encodeURIComponent(whatsappMsg)}`;

        window.open(waUrl, '_blank');

        toast.success('Reservation saved & WhatsApp voucher opened!', {
          description: `Voucher #${bookingRef} opened for ${hotelName}.`,
          icon: '💬'
        });
      } else if (dispatchMode === 'EMAIL') {
        const targetEmail = dispReceptionEmail.trim() || hotel?.contactEmail || hotel?.receptionEmail || '';
        const emailSubject = `[Reservation Voucher #${bookingRef}] Booking Confirmation - ${dispGuestName.trim()} - ${hotelName} (${checkInFormatted} to ${checkOutFormatted})`;

        const emailBody = 
`Attn: Front Desk / Reservations Department - ${hotelName}

Greetings from Kashmir Curators DMC Central Reservations Desk.

Please find below the official booking reservation voucher details for guaranteed guest arrival:

====================================================
KASHMIR CURATORS • OFFICIAL HOTEL RESERVATION VOUCHER
====================================================
Booking Reference: #${bookingRef}
Property: ${hotelName} (${hotelLocation})
Lead Guest: ${dispGuestName.trim()}
Guest Contact: ${dispGuestPhone.trim() || 'On File'}
Guest Email: ${dispGuestEmail.trim() || 'On File'}

STAY DETAILS:
Check-In Date: ${checkInFormatted}
Check-Out Date: ${checkOutFormatted} (${nights} Night${nights > 1 ? 's' : ''})
Room Category: ${count}x ${dispRoomType || 'Deluxe Room'}
Occupancy: ${dispAdults} Adult(s)
Meal Plan: ${dispMealPlan}

FINANCIAL LEDGER & BILLING:
Contracted Net Rate: ₹${rate.toLocaleString('en-IN')} per night
Total Payable Amount: ₹${(grossSelling + extra).toLocaleString('en-IN')}
Billing Status: Guaranteed Payment by Kashmir Curators DMC Operations Desk

SPECIAL REQUESTS & WINTER PREFERENCES:
${dispSpecialRequests.trim() || 'Central Bukhari heating confirmed / Standard VIP arrival.'}

====================================================
1-CLICK RECEPTION CONFIRMATION PORTAL:
${portalUrl}

Kindly open the secure portal link above to verify room availability and enter your hotel confirmation / folio number.

Warm regards,
Kashmir Curators DMC Central Reservations Desk
Hotline: +91 91038 95888 | operations@kashmircurators.com
https://kashmir-curators.vercel.app`;

        const mailtoLink = `mailto:${encodeURIComponent(targetEmail)}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
        window.location.href = mailtoLink;

        toast.success('Reservation saved & redirecting to Email!', {
          description: `Email client opened for ${targetEmail} with prefilled voucher #${bookingRef}.`,
          icon: '📨'
        });
      } else {
        toast.success('Reservation Request Successfully Dispatched!', {
          description: `Reference created and notification transmitted to hotel reception.`,
          icon: '📨'
        });
      }

      setDispatchModalOpen(false);
      // Reset form
      setDispGuestName('');
      setDispGuestPhone('');
      setDispGuestEmail('');
      setDispSpecialRequests('');
      setDispPhoneTouched(false);
      setFormStep('GUEST');

      fetchKpis();
      fetchReservations();
    } catch (err: any) {
      toast.error(err.message || 'Error creating reservation');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Quick Confirm Voucher
  const handleQuickConfirm = async (id: string, guestName: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/hospitality/${id}/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getHospitalityHeaders(token)
        }
      });
      if (!res.ok) throw new Error('Failed to confirm reservation.');
      toast.success(`Booking for ${guestName} confirmed!`, { icon: '✅' });
      fetchKpis();
      fetchReservations();
    } catch (err: any) {
      toast.error(err.message || 'Confirmation failed');
    }
  };

  // -------------------------------------------------------------
  // DELETE & BULK DELETE ACTIONS
  // -------------------------------------------------------------
  const handleDeleteReservation = async () => {
    if (!resToDelete) return;
    try {
      setIsDeleting(true);
      const authToken = getHospitalityToken(token);
      const headers = getHospitalityHeaders(authToken);
      const res = await fetch(`${API_BASE_URL}/hospitality/${resToDelete.id}`, {
        method: 'DELETE',
        headers
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete reservation');
      }

      setReservations(prev => prev.filter(r => r.id !== resToDelete.id));
      setSelectedIds(prev => prev.filter(id => id !== resToDelete.id));
      toast.success(`Reservation #${resToDelete.bookingReference || resToDelete.id.slice(0, 8)} permanently deleted`, {
        icon: '🗑️'
      });
      setDeleteModalOpen(false);
      setResToDelete(null);
      fetchKpis();
    } catch (err: any) {
      toast.error(err.message || 'Error deleting reservation');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    try {
      setIsBulkDeleting(true);
      const authToken = getHospitalityToken(token);
      const headers = getHospitalityHeaders(authToken);
      
      const results = await Promise.all(
        selectedIds.map(id => 
          fetch(`${API_BASE_URL}/hospitality/${id}`, { method: 'DELETE', headers })
            .then(res => res.ok)
            .catch(() => false)
        )
      );

      const deletedCount = results.filter(Boolean).length;
      setReservations(prev => prev.filter(r => !selectedIds.includes(r.id)));
      toast.success(`Successfully purged ${deletedCount} reservation records`, { icon: '🗑️' });
      setSelectedIds([]);
      setBulkDeleteModalOpen(false);
      fetchKpis();
    } catch (err: any) {
      toast.error(err.message || 'Error in bulk deletion');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleToggleSelectAll = () => {
    const authToken = getHospitalityToken(token);
    if (!authToken) {
      toast.error('Authentication required to select reservations.');
      return;
    }
    if (selectedIds.length === displayedReservations.length && displayedReservations.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(displayedReservations.map(r => r.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    const authToken = getHospitalityToken(token);
    if (!authToken) {
      toast.error('Authentication required to manage reservation selection.');
      return;
    }
    setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  // -------------------------------------------------------------
  // EDIT / AMEND BOOKING ACTIONS
  // -------------------------------------------------------------
  const handleOpenEdit = (res: ReservationRecord) => {
    setEditRes(res);
    setEditGuestName(res.guestName || '');
    setEditGuestPhone(res.guestPhone || '');
    setEditGuestEmail(res.guestEmail || '');
    setEditCheckIn(res.checkIn ? new Date(res.checkIn).toISOString().slice(0, 10) : '');
    setEditCheckOut(res.checkOut ? new Date(res.checkOut).toISOString().slice(0, 10) : '');
    setEditRoomsCount(String(res.roomsCount || 1));
    setEditRoomType(res.roomType || 'Deluxe Room');
    setEditMealPlan(res.mealPlan || 'MAP');
    setEditContractRate(String(res.contractRate || 0));
    setEditTotalAmount(String(res.totalAmount || 0));
    setEditStatus(res.status || 'Pending');
    setEditSpecialRequests(res.specialRequests || '');
    setEditPhoneTouched(false);
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRes) return;

    if (editGuestPhone.trim()) {
      setEditPhoneTouched(true);
      const phoneVal = validatePhoneNumber(editGuestPhone);
      if (!phoneVal.isValid) {
        toast.error(`Incorrect Guest Phone: ${phoneVal.message || 'Please provide a valid 10-digit mobile or international number.'}`);
        return;
      }
    }

    try {
      setIsSavingEdit(true);
      const authToken = getHospitalityToken(token);
      const headers = getHospitalityHeaders(authToken);

      const count = Number(editRoomsCount) || 1;
      const rate = Number(editContractRate) || 0;
      const total = Number(editTotalAmount) || 0;

      const res = await fetch(`${API_BASE_URL}/hospitality/${editRes.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify({
          guestName: editGuestName.trim(),
          guestPhone: editGuestPhone.trim() || undefined,
          guestEmail: editGuestEmail.trim() || undefined,
          checkIn: editCheckIn ? new Date(editCheckIn).toISOString() : undefined,
          checkOut: editCheckOut ? new Date(editCheckOut).toISOString() : undefined,
          roomsCount: count,
          roomType: editRoomType,
          mealPlan: editMealPlan,
          contractRate: rate,
          totalAmount: total,
          status: editStatus,
          specialRequests: editSpecialRequests.trim() || undefined
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update reservation');
      }

      const updatedData = await res.json();
      setReservations(prev => prev.map(r => r.id === editRes.id ? { ...r, ...updatedData } : r));
      toast.success(`Reservation #${editRes.bookingReference || editRes.id.slice(0, 8)} updated successfully!`, {
        icon: '✅'
      });
      setEditModalOpen(false);
      setEditRes(null);
      fetchKpis();
    } catch (err: any) {
      toast.error(err.message || 'Error updating reservation');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Fetch AI Agent Logs
  const fetchAiLogs = async (resId?: string) => {
    try {
      const headers = getHospitalityHeaders(token);
      const url = resId 
        ? `${API_BASE_URL}/hospitality/ai/agent-logs?reservationId=${resId}`
        : `${API_BASE_URL}/hospitality/ai/agent-logs`;
      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        setAiAgentLogs(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch AI agent logs:', err);
    }
  };

  // AI Parse Hotel Reply
  const handleAiParseReply = async (reservationId: string) => {
    if (!rawAiInput.trim()) {
      toast.error('Please enter the hotel response text or email snippet.');
      return;
    }
    try {
      setIsParsingAi(true);
      const headers = getHospitalityHeaders(token);
      const res = await fetch(`${API_BASE_URL}/hospitality/ai/parse-reply`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: rawAiInput,
          reservationId
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to process with AI');
      }
      setAiParsedResult(data.parsed);
      toast.success(`AI Processed: ${data.message || 'Hotel reply applied!'}`);
      fetchReservations();
      fetchKpis();
      fetchAiLogs(reservationId);
      if (data.reservation) {
        setSelectedRes(data.reservation);
      }
    } catch (err: any) {
      toast.error(err.message || 'AI parsing failed');
    } finally {
      setIsParsingAi(false);
    }
  };

  // Trigger AI Smart Nudge
  const handleTriggerSmartNudge = async (reservationId: string, count = 1) => {
    try {
      setIsNudging(true);
      const headers = getHospitalityHeaders(token);
      const res = await fetch(`${API_BASE_URL}/hospitality/ai/smart-followup/${reservationId}`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptCount: count })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch smart nudge');
      }
      toast.success('AI Smart Follow-Up dispatched to hotel partner!');
      fetchReservations();
      fetchAiLogs(reservationId);
    } catch (err: any) {
      toast.error(err.message || 'Smart nudge dispatch failed');
    } finally {
      setIsNudging(false);
    }
  };

  // Dispatch Guest Voucher
  const handleDispatchGuestVoucherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRes) return;
    if (!targetEmail.trim()) {
      toast.error('Please enter the recipient guest email.');
      return;
    }

    try {
      setIsSubmittingAction(true);
      const res = await fetch(`${API_BASE_URL}/hospitality/${selectedRes.id}/dispatch-guest-voucher`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getHospitalityHeaders(token)
        },
        body: JSON.stringify({
          recipientEmail: targetEmail.trim(),
          customNotes: voucherNotes.trim()
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to dispatch voucher');
      }

      toast.success(`Official Booking Voucher Dispatched!`, {
        description: `Emailed to ${targetEmail}.`,
        icon: '🎟️'
      });

      setVoucherModalOpen(false);
      setVoucherNotes('');
      fetchKpis();
      fetchReservations();
      if (detailDrawerOpen && selectedRes) {
        setSelectedRes({ ...selectedRes, guestVoucherDispatched: true, guestEmail: targetEmail });
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to dispatch voucher');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Resend Tracked Email
  const handleResendEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRes) return;
    if (!targetEmail.trim()) {
      toast.error('Recipient email address is required.');
      return;
    }

    try {
      setIsSubmittingAction(true);
      const res = await fetch(`${API_BASE_URL}/hospitality/${selectedRes.id}/resend-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getHospitalityHeaders(token)
        },
        body: JSON.stringify({
          emailType: emailTemplateType,
          recipientEmail: targetEmail.trim()
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to dispatch email.');
      }

      toast.success(`Tracked Email Dispatched!`, {
        description: `Sent to ${targetEmail} via verified provider.`,
        icon: '📧'
      });

      setResendEmailModalOpen(false);
      fetchReservations();
    } catch (err: any) {
      toast.error(err.message || 'Email dispatch failed');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Complete Check-In
  const handleCheckInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRes) return;

    try {
      setIsSubmittingAction(true);
      const res = await fetch(`${API_BASE_URL}/hospitality/${selectedRes.id}/check-in`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getHospitalityHeaders(token)
        },
        body: JSON.stringify({
          assignedRoomNumber: checkInRoomNumber.trim() || undefined,
          guestIdType: checkInIdType,
          guestIdNumber: checkInIdNumber.trim() || undefined
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Check-in failed');
      }

      toast.success(`Guest ${selectedRes.guestName} Checked-In!`, {
        description: `Room ${checkInRoomNumber || 'Allocated'} marked OCCUPIED.`,
        icon: '🏨'
      });

      setCheckInModalOpen(false);
      fetchKpis();
      fetchReservations();
    } catch (err: any) {
      toast.error(err.message || 'Check-in failed');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Manager Override
  const handleOverrideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRes) return;
    if (!overrideReason.trim()) {
      toast.error('A mandatory justification reason is required for status overrides.');
      return;
    }

    try {
      setIsSubmittingAction(true);
      const res = await fetch(`${API_BASE_URL}/hospitality/${selectedRes.id}/override-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getHospitalityHeaders(token)
        },
        body: JSON.stringify({
          newStatus: overrideStatus,
          newLifecycleStatus: overrideLifecycle,
          reason: overrideReason.trim()
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to apply managerial override.');
      }

      toast.success('Managerial Override Applied and Audit Logged!', { icon: '🛡️' });
      setOverrideModalOpen(false);
      setOverrideReason('');
      fetchKpis();
      fetchReservations();
      if (detailDrawerOpen) setDetailDrawerOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Override failed');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Helper Badge Renderers
  const renderStatusBadge = (res: ReservationRecord) => {
    if (res.status === 'Checked-In') {
      return <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-bold">Checked-In</Badge>;
    }
    if (res.status === 'Checked-Out') {
      return <Badge className="bg-slate-500/15 text-slate-400 border-slate-500/30">Checked-Out</Badge>;
    }
    if (res.status === 'Confirmed') {
      return <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30 font-bold">Hotel Confirmed</Badge>;
    }
    if (res.confirmationStage === 'AVAILABILITY_CONFIRMED') {
      return <Badge className="bg-blue-500/15 text-blue-500 border-blue-500/30 font-bold">Avail. Verified</Badge>;
    }
    if (res.confirmationStage === 'ALTERNATIVE_OFFERED') {
      return <Badge className="bg-purple-500/15 text-purple-400 border-purple-500/30 font-bold">Alt. Offered</Badge>;
    }
    if (res.status === 'Cancelled' || res.status === 'Rejected') {
      return <Badge className="bg-rose-500/15 text-rose-500 border-rose-500/30">Cancelled</Badge>;
    }
    return <Badge className="bg-amber-500/15 text-amber-500 border-amber-500/30 font-bold">Pending Response</Badge>;
  };

  // Stay Countdown Indicator (SaaS Modern Real-Icon Badges, No Emojis, High Dark-Mode Contrast)
  const getStayCountdownBadge = (checkIn: string, checkOut: string, status: string) => {
    if (status === 'Checked-In') {
      return (
        <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-500/40 text-[10px] font-black flex items-center gap-1 shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <LogIn className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
          <span>In-House</span>
        </Badge>
      );
    }
    if (status === 'Checked-Out') {
      return (
        <Badge className="bg-slate-500/20 text-slate-600 dark:text-slate-300 border-slate-500/40 text-[10px] font-bold flex items-center gap-1">
          <LogOut className="w-3 h-3 text-slate-500 dark:text-slate-400" />
          <span>Departed</span>
        </Badge>
      );
    }
    if (status === 'Cancelled' || status === 'Rejected') {
      return null;
    }

    const now = new Date();
    const start = new Date(checkIn);
    const diffDays = Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return (
        <Badge className="bg-rose-500/20 text-rose-600 dark:text-rose-300 border-rose-500/40 text-[10px] font-black flex items-center gap-1 animate-pulse shadow-2xs">
          <AlertCircle className="w-3 h-3 text-rose-500 dark:text-rose-400" />
          <span>Arriving Today</span>
        </Badge>
      );
    }
    if (diffDays === 1) {
      return (
        <Badge className="bg-amber-500/20 text-amber-600 dark:text-amber-300 border-amber-500/40 text-[10px] font-black flex items-center gap-1 shadow-2xs">
          <Clock className="w-3 h-3 text-amber-500 dark:text-amber-400" />
          <span>Arriving Tomorrow</span>
        </Badge>
      );
    }
    if (diffDays > 1 && diffDays <= 7) {
      return (
        <Badge variant="outline" className="bg-sky-500/15 text-sky-600 dark:text-sky-300 border-sky-500/35 text-[10px] font-mono font-bold flex items-center gap-1">
          <Calendar className="w-3 h-3 text-sky-500 dark:text-sky-400" />
          <span>In {diffDays} days</span>
        </Badge>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* 1. EXECUTIVE 4-CARD OPERATIONAL METRIC COCKPIT */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Stays & In-House Occupancy */}
        <Card 
          onClick={() => setFilterStage('ALL')}
          className={`cursor-pointer transition-all border rounded-3xl p-4 sm:p-5 shadow-sm hover:shadow-md relative overflow-hidden group ${
            filterStage === 'ALL' ? 'bg-card border-amber-500/50 ring-1 ring-amber-500/20' : 'bg-card border-border/80 hover:border-amber-500/40'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-amber-500" />
              <span>Active Portfolio</span>
            </span>
            <Badge variant="outline" className="text-[10px] font-mono text-amber-500 border-amber-500/30">
              {kpisLoading ? '...' : `${kpis.totalReservations} Stays`}
            </Badge>
          </div>
          <div className="text-3xl font-black text-foreground tracking-tight">
            {kpisLoading ? '—' : kpis.totalReservations}
          </div>
          <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between text-[11px]">
            <span className="text-emerald-500 font-bold flex items-center gap-1">
              <LogIn className="w-3 h-3" /> {kpis.guestCheckedIn} In-House
            </span>
            <span className="text-muted-foreground">
              {kpis.upcomingCheckIns} Upcoming
            </span>
            <span className="text-muted-foreground">
              {kpis.todayCheckOuts} Depart
            </span>
          </div>
        </Card>

        {/* Card 2: Priority Action Queue */}
        <Card 
          onClick={() => setFilterStage('Pending')}
          className={`cursor-pointer transition-all border rounded-3xl p-4 sm:p-5 shadow-sm hover:shadow-md relative overflow-hidden group ${
            filterStage === 'Pending' ? 'bg-amber-500/10 border-amber-500/50 ring-1 ring-amber-500/20' : 'bg-card border-border/80 hover:border-amber-500/40'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Front Desk Queue</span>
            </span>
            {kpis.pendingHotelResponses > 0 && (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
            )}
          </div>
          <div className="text-3xl font-black text-amber-500 tracking-tight">
            {kpisLoading ? '—' : kpis.pendingHotelResponses}
          </div>
          <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">
              {kpis.alternativeOffered} Alt. Offered
            </span>
            <span className="text-emerald-500 font-bold">
              {kpis.hotelConfirmed} Confirmed
            </span>
            <span className="text-rose-500 font-medium">
              {kpis.cancelledReservations} Cancelled
            </span>
          </div>
        </Card>

        {/* Card 3: Financial Performance & Ledger */}
        <Card className="bg-card border-border/80 rounded-3xl p-4 sm:p-5 shadow-sm hover:shadow-md hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-500 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              <span>Booking Revenue</span>
            </span>
            <Badge variant="outline" className="text-[10px] font-mono text-emerald-500 border-emerald-500/30">
              Gross Ledger
            </Badge>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-500 tracking-tight truncate">
            ₹{kpisLoading ? '—' : (kpis.totalRevenue >= 100000 ? `${(kpis.totalRevenue / 100000).toFixed(1)}L` : kpis.totalRevenue.toLocaleString('en-IN'))}
          </div>
          <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">
              Dues: <strong className="text-foreground">₹{kpisLoading ? '—' : (kpis.outstandingHotelPayments >= 100000 ? `${(kpis.outstandingHotelPayments / 100000).toFixed(1)}L` : kpis.outstandingHotelPayments.toLocaleString('en-IN'))}</strong>
            </span>
            <span className="text-emerald-500 font-bold">
              Margin: ₹{kpisLoading ? '—' : Math.max(0, kpis.totalRevenue - kpis.outstandingHotelPayments).toLocaleString('en-IN')}
            </span>
          </div>
        </Card>

        {/* Card 4: Dispatch Matrix & Direct Channels */}
        <Card className="bg-card border-border/80 rounded-3xl p-4 sm:p-5 shadow-sm hover:shadow-md hover:border-sky-500/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-sky-500 flex items-center gap-1.5">
              <SendHorizontal className="w-4 h-4 text-sky-500" />
              <span>Vouchers & Dispatch</span>
            </span>
            <Badge variant="outline" className="text-[10px] font-bold text-sky-500 border-sky-500/30">
              {kpis.guestVoucherDispatched} Issued
            </Badge>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl font-black text-foreground">Multi-Channel</span>
          </div>
          <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between text-[11px]">
            <span className="text-emerald-500 font-bold flex items-center gap-1">
              <MessageSquare className="w-3 h-3" /> WhatsApp Live
            </span>
            <span className="text-amber-500 font-bold flex items-center gap-1">
              <Mail className="w-3 h-3" /> Email Redirect
            </span>
          </div>
        </Card>
      </div>

      {/* 2. OPERATIONAL ACTION BAR & MULTI-FILTERS */}
      <Card className="rounded-3xl border border-border/80 bg-card p-4 sm:p-5 shadow-sm space-y-4">
        {/* Upper Action Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-lg">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search reference, guest name, contact, hotel, or destination..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 rounded-2xl text-xs bg-background/80 border-border"
            />
          </form>

          {/* Quick Actions Button Group */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                fetchKpis();
                fetchReservations();
                toast.success('Synchronized with live reservation database.');
              }}
              className="h-9 px-3 rounded-xl text-xs font-bold gap-1.5 border-border hover:bg-muted"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Sync</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="h-9 px-3 rounded-xl text-xs font-bold gap-1.5 border-border hover:bg-muted"
            >
              <Download className="w-3.5 h-3.5 text-amber-500" />
              <span>Export CSV</span>
            </Button>

            <Button
              size="sm"
              onClick={() => {
                setFormStep('GUEST');
                setDispatchModalOpen(true);
              }}
              className="h-9 px-4 rounded-xl text-xs font-black uppercase tracking-wider bg-amber-500 hover:bg-amber-400 text-slate-950 gap-1.5 shadow-md shadow-amber-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Dispatch New Reservation</span>
            </Button>
          </div>
        </div>

        {/* Filter Pills & Selectors */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-3 border-t border-border/50 text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none w-full md:w-auto">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mr-1 flex items-center gap-1 shrink-0">
              <Filter className="w-3 h-3" /> Filter:
            </span>
            {[
              { id: 'ALL', label: 'All Bookings' },
              { id: 'Pending', label: 'Pending Response' },
              { id: 'AVAILABILITY_CONFIRMED', label: 'Avail. Verified' },
              { id: 'ALTERNATIVE_OFFERED', label: 'Alt. Offered' },
              { id: 'Confirmed', label: 'Hotel Confirmed' },
              { id: 'Checked-In', label: 'In-House' },
              { id: 'Cancelled', label: 'Cancelled' }
            ].map(pill => (
              <button
                key={pill.id}
                onClick={() => setFilterStage(pill.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all ${
                  filterStage === pill.id
                    ? 'bg-amber-500 text-slate-950 font-black shadow-sm border border-amber-500'
                    : 'bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white border border-slate-200/90 dark:border-slate-700/80 font-bold'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Destination Selector */}
            <Select value={filterDestination} onValueChange={setFilterDestination}>
              <SelectTrigger className="h-8 rounded-xl text-xs flex-1 sm:w-36 bg-background dark:bg-slate-900 border-border text-foreground">
                <SelectValue placeholder="Destination" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Destinations</SelectItem>
                <SelectItem value="Srinagar">Srinagar</SelectItem>
                <SelectItem value="Gulmarg">Gulmarg</SelectItem>
                <SelectItem value="Pahalgam">Pahalgam</SelectItem>
                <SelectItem value="Sonamarg">Sonamarg</SelectItem>
              </SelectContent>
            </Select>

            {/* Payment Filter */}
            <Select value={filterPayment} onValueChange={setFilterPayment}>
              <SelectTrigger className="h-8 rounded-xl text-xs flex-1 sm:w-32 bg-background dark:bg-slate-900 border-border text-foreground">
                <SelectValue placeholder="Payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Payments</SelectItem>
                <SelectItem value="Paid">Paid</SelectItem>
                <SelectItem value="Partially Paid">Partial</SelectItem>
                <SelectItem value="Unpaid">Unpaid</SelectItem>
              </SelectContent>
            </Select>

            {(searchQuery || filterStage !== 'ALL' || filterDestination !== 'ALL' || filterPayment !== 'ALL') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-8 px-2 text-[11px] text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-xl font-bold"
              >
                Reset
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* 3. COMPREHENSIVE RESERVATION MANAGEMENT DESK */}
      <Card className="rounded-3xl border border-border/80 bg-card overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 border-b border-border/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <CalendarCheck2 className="w-5 h-5 text-amber-500 shrink-0" />
            <h2 className="text-base font-black text-foreground">
              Centralized Reservation Operations Desk
            </h2>
            <Badge variant="outline" className="font-mono text-xs text-muted-foreground ml-1">
              {displayedReservations.length} records
            </Badge>

            {/* Quick Presets Filter Pills: visible and scrollable on all screen sizes */}
            <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0 scrollbar-none sm:ml-3 sm:pl-3 sm:border-l sm:border-border/60">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase shrink-0">Presets:</span>
              {[
                { id: 'ALL', label: 'All' },
                { id: 'TODAY', label: "Today's Moves" },
                { id: 'NEXT_48H', label: 'Next 48H' },
                { id: 'IN_HOUSE', label: 'In-House' },
                { id: 'HIGH_VALUE', label: 'VIP (₹40k+)' }
              ].map(p => (
                <button
                  key={p.id}
                  onClick={() => setQuickDateFilter(p.id as any)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap shrink-0 transition-all ${
                    quickDateFilter === p.id 
                      ? 'bg-amber-500 text-slate-950 font-black shadow-xs border border-amber-500' 
                      : 'bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white border border-slate-200/90 dark:border-slate-700/80 font-bold'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Switcher: Table List vs Pipeline Kanban */}
            <div className="flex items-center gap-1 bg-muted/60 dark:bg-slate-900/80 p-1 rounded-2xl border border-border/60">
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className={`h-7 px-2.5 text-xs font-bold rounded-xl gap-1.5 transition-all ${
                  viewMode === 'table' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-foreground'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Table</span>
              </Button>
              <Button
                variant={viewMode === 'kanban' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('kanban')}
                className={`h-7 px-2.5 text-xs font-bold rounded-xl gap-1.5 transition-all ${
                  viewMode === 'kanban' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-foreground'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Pipeline</span>
              </Button>
            </div>

            {/* Bulk Selection Notification Bar */}
            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 px-3 py-1 rounded-2xl text-xs font-bold animate-fade-in">
                <span>{selectedIds.length} selected</span>
                <Button
                  size="sm"
                  onClick={() => setBulkDeleteModalOpen(true)}
                  className="h-7 px-2.5 text-[11px] font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl gap-1 shadow-sm"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete</span>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedIds([])}
                  className="h-7 px-2 text-[11px] font-bold text-muted-foreground hover:text-foreground rounded-xl"
                >
                  Deselect
                </Button>
              </div>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-amber-500 mx-auto" />
            <p className="text-xs uppercase font-bold tracking-widest text-muted-foreground">
              Synchronizing Hotel Operations Matrix...
            </p>
          </div>
        ) : displayedReservations.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <BedDouble className="w-12 h-12 text-muted-foreground/40 mx-auto" />
            <h3 className="text-base font-bold text-foreground">No reservations found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              No reservation records match your selected filters. Click "Dispatch New Reservation" to create an inquiry.
            </p>
            <Button
              size="sm"
              onClick={() => setDispatchModalOpen(true)}
              className="rounded-xl text-xs font-bold bg-amber-500 text-slate-950 mt-2"
            >
              + Dispatch Reservation
            </Button>
          </div>
        ) : viewMode === 'kanban' ? (
          <div className="p-3 sm:p-5">
            {/* Mobile Stage Quick Switcher Tabs (for fast navigation on phones & tablets) */}
            <div className="flex xl:hidden overflow-x-auto gap-2 pb-2.5 mb-3 scrollbar-none border-b border-border/50">
              {[
                { id: 'QUEUE', title: 'Queue', dot: 'bg-amber-500', filter: (r: ReservationRecord) => r.status === 'Pending' || r.confirmationStage === 'PENDING_RESPONSE' },
                { id: 'AVAIL_VERIFIED', title: 'Avail. Verified', dot: 'bg-blue-500', filter: (r: ReservationRecord) => r.confirmationStage === 'AVAILABILITY_CONFIRMED' },
                { id: 'CONFIRMED', title: 'Hotel Confirmed', dot: 'bg-emerald-500', filter: (r: ReservationRecord) => r.status === 'Confirmed' || r.confirmationStage === 'HOTEL_CONFIRMED' },
                { id: 'IN_HOUSE', title: 'In-House', dot: 'bg-emerald-600', filter: (r: ReservationRecord) => r.status === 'Checked-In' },
                { id: 'EXCEPTIONS', title: 'Departed / Release', dot: 'bg-slate-400', filter: (r: ReservationRecord) => r.status === 'Checked-Out' || r.status === 'Cancelled' || r.status === 'Rejected' || r.confirmationStage === 'ALTERNATIVE_OFFERED' }
              ].map(stg => (
                <button
                  key={stg.id}
                  onClick={() => {
                    const el = document.getElementById(`kanban-stage-${stg.id}`);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 hover:border-amber-500/50"
                >
                  <span className={`w-2 h-2 rounded-full ${stg.dot}`} />
                  <span>{stg.title}</span>
                  <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-black">
                    {displayedReservations.filter(stg.filter).length}
                  </span>
                </button>
              ))}
            </div>

            {/* Responsive Pipeline Column Grid (Horizontal snap-scroll on phones/tablets, 5-col on desktop) */}
            <div className="flex xl:grid xl:grid-cols-5 gap-3.5 sm:gap-4 overflow-x-auto snap-x snap-mandatory pb-4 scrollbar-thin">
              {[
                {
                  id: 'QUEUE',
                  title: '1. Front Desk Queue',
                  dot: 'bg-amber-500',
                  badge: 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border-amber-500/40',
                  filter: (r: ReservationRecord) => r.status === 'Pending' || r.confirmationStage === 'PENDING_RESPONSE'
                },
                {
                  id: 'AVAIL_VERIFIED',
                  title: '2. Avail. Verified',
                  dot: 'bg-blue-500',
                  badge: 'bg-blue-500/20 text-blue-600 dark:text-blue-300 border-blue-500/40',
                  filter: (r: ReservationRecord) => r.confirmationStage === 'AVAILABILITY_CONFIRMED'
                },
                {
                  id: 'CONFIRMED',
                  title: '3. Hotel CRS Confirmed',
                  dot: 'bg-emerald-500',
                  badge: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-500/40',
                  filter: (r: ReservationRecord) => r.status === 'Confirmed' || r.confirmationStage === 'HOTEL_CONFIRMED'
                },
                {
                  id: 'IN_HOUSE',
                  title: '4. In-House Stays',
                  dot: 'bg-emerald-600',
                  badge: 'bg-emerald-600/20 text-emerald-600 dark:text-emerald-300 border-emerald-600/40',
                  filter: (r: ReservationRecord) => r.status === 'Checked-In'
                },
                {
                  id: 'EXCEPTIONS',
                  title: '5. Departed / Release',
                  dot: 'bg-slate-400',
                  badge: 'bg-slate-500/20 text-slate-600 dark:text-slate-300 border-slate-500/40',
                  filter: (r: ReservationRecord) => r.status === 'Checked-Out' || r.status === 'Cancelled' || r.status === 'Rejected' || r.confirmationStage === 'ALTERNATIVE_OFFERED'
                }
              ].map(col => {
                const colItems = displayedReservations.filter(col.filter);
                return (
                  <div 
                    key={col.id} 
                    id={`kanban-stage-${col.id}`}
                    className="w-[86vw] sm:w-[330px] xl:w-auto shrink-0 snap-start bg-slate-100/60 dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800/90 rounded-3xl p-3.5 flex flex-col gap-3 min-h-[520px]"
                  >
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                        <span className="font-extrabold text-xs text-foreground tracking-tight">{col.title}</span>
                      </div>
                      <Badge variant="outline" className={`font-mono text-[10px] font-black ${col.badge}`}>
                        {colItems.length}
                      </Badge>
                    </div>

                    <div className="space-y-3 overflow-y-auto max-h-[620px] pr-0.5">
                      {colItems.length === 0 ? (
                        <div className="py-16 text-center text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-950/40 border border-dashed border-slate-200 dark:border-slate-800/80 rounded-2xl">
                          No bookings in stage
                        </div>
                      ) : (
                        colItems.map(res => {
                          const nights = Math.max(1, Math.ceil((new Date(res.checkOut).getTime() - new Date(res.checkIn).getTime()) / (1000 * 60 * 60 * 24)));
                          const isPending = res.status === 'Pending' || res.confirmationStage === 'PENDING_RESPONSE';
                          const isConfirmed = res.status === 'Confirmed' || res.confirmationStage === 'HOTEL_CONFIRMED';
                          const isCheckedIn = res.status === 'Checked-In';

                          return (
                            <div 
                              key={res.id} 
                              className="bg-card dark:bg-slate-900 border border-border/80 dark:border-slate-800 hover:border-amber-500/50 rounded-2xl p-3.5 shadow-xs hover:shadow-md transition-all space-y-2.5 text-xs group"
                            >
                              <div className="flex items-start justify-between gap-2 border-b border-border/50 dark:border-slate-800/80 pb-2">
                                <div className="min-w-0">
                                  <h4 className="font-bold text-foreground text-xs truncate">
                                    {res.hotel?.name || 'Partner Hotel'}
                                  </h4>
                                  <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate block">
                                    {res.destination || res.hotel?.location?.split(',')[0] || 'Kashmir'}
                                  </span>
                                </div>
                                <Badge variant="outline" className="font-mono text-[9px] text-amber-500 border-amber-500/30 shrink-0">
                                  {res.bookingReference || res.id.slice(0, 6)}
                                </Badge>
                              </div>

                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <strong className="text-foreground text-xs font-black truncate">{res.guestName}</strong>
                                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">{res.adults || 2} Adults</span>
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">{res.guestPhone || 'No Phone'}</div>
                              </div>

                              <div className="bg-slate-100/70 dark:bg-slate-950/80 rounded-xl p-2.5 text-[11px] space-y-1.5 border border-slate-200/80 dark:border-slate-800/90">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="text-slate-500 dark:text-slate-400 font-medium">Stay:</span>
                                  <div className="flex flex-wrap items-center justify-end gap-1">
                                    <span className="font-bold text-foreground">
                                      {new Date(res.checkIn).toLocaleDateString([], { month: 'short', day: 'numeric' })} - {new Date(res.checkOut).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                    </span>
                                    {getStayCountdownBadge(res.checkIn, res.checkOut, res.status)}
                                  </div>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-500 dark:text-slate-400 font-medium">Plan:</span>
                                  <span className="font-black text-amber-600 dark:text-amber-300">{res.roomsCount}x {res.roomType} ({res.mealPlan})</span>
                                </div>
                                <div className="flex items-center justify-between pt-1 border-t border-border/40 dark:border-slate-800 font-mono">
                                  <span className="text-slate-500 dark:text-slate-400 font-sans">Net Dues:</span>
                                  <span className="font-black text-emerald-600 dark:text-emerald-400">₹{(res.hotelDues || res.totalAmount).toLocaleString('en-IN')}</span>
                                </div>
                              </div>

                              {/* Card Action Row */}
                              <div className="flex items-center justify-between pt-1 border-t border-border/40 dark:border-slate-800 gap-1">
                                <div className="flex items-center gap-1">
                                  {/* WhatsApp */}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      const hotelPhone = (res.hotel?.whatsappNumber || res.hotel?.contactPhone || res.guestPhone || '').replace(/[^0-9]/g, '');
                                      const checkInFormatted = new Date(res.checkIn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                                      const checkOutFormatted = new Date(res.checkOut).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                                      const portalUrl = `${window.location.origin}/hospitality?tab=reception&token=${res.secureToken || res.id}`;
                                      const msg = `*KASHMIR CURATORS DMC — RESERVATION VOUCHER*\nRef: #${res.bookingReference || res.id.slice(0, 8)}\nHotel: ${res.hotel?.name || 'Hotel'}\nGuest: ${res.guestName}\nDates: ${checkInFormatted} to ${checkOutFormatted} (${nights} Nights)\nRoom: ${res.roomsCount}x ${res.roomType} (${res.mealPlan})\nContract: ₹${(res.totalAmount || 0).toLocaleString('en-IN')}\nPortal Link: ${portalUrl}`;
                                      const waNum = hotelPhone.length === 10 ? `91${hotelPhone}` : hotelPhone;
                                      window.open(waNum ? `https://wa.me/${waNum}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                                    }}
                                    className="h-7 w-7 p-0 text-emerald-600 hover:bg-emerald-500/10 rounded-lg"
                                    title="WhatsApp Voucher"
                                  >
                                    <MessageSquare className="w-3 h-3" />
                                  </Button>

                                  {/* Edit */}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleOpenEdit(res)}
                                    className="h-7 w-7 p-0 text-slate-500 dark:text-slate-400 hover:text-foreground rounded-lg"
                                    title="Edit Booking"
                                  >
                                    <Pencil className="w-3 h-3 text-blue-500" />
                                  </Button>

                                  {/* Details */}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedRes(res);
                                      setTargetEmail(res.guestEmail || res.receptionEmail || '');
                                      fetchAiLogs(res.id);
                                      setDetailDrawerOpen(true);
                                    }}
                                    className="h-7 w-7 p-0 text-slate-500 dark:text-slate-400 hover:text-foreground rounded-lg"
                                    title="View Dossier"
                                  >
                                    <Eye className="w-3 h-3 text-amber-500" />
                                  </Button>

                                  {/* Delete */}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setResToDelete(res);
                                      setDeleteModalOpen(true);
                                    }}
                                    className="h-7 w-7 p-0 text-rose-500 hover:bg-rose-500/10 rounded-lg"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>

                                {/* Contextual action button */}
                                {isPending && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleQuickConfirm(res.id, res.guestName)}
                                    className="h-6 px-2 text-[10px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg"
                                  >
                                    Confirm
                                  </Button>
                                )}
                                {isConfirmed && !isCheckedIn && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedRes(res);
                                      setCheckInRoomNumber(res.assignedRoomNumber || '');
                                      setCheckInModalOpen(true);
                                    }}
                                    className="h-6 px-2 text-[10px] font-bold text-emerald-600 border-emerald-500/30 rounded-lg"
                                  >
                                    Check-In
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto w-full scrollbar-thin">
            <Table>
              <TableHeader className="bg-slate-100/70 dark:bg-slate-900/90">
                <TableRow className="border-border/60 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  <TableHead className="w-10">
                    <input
                      ref={(el) => {
                        if (el) {
                          el.indeterminate = selectedIds.length > 0 && selectedIds.length < displayedReservations.length;
                        }
                      }}
                      type="checkbox"
                      checked={selectedIds.length === displayedReservations.length && displayedReservations.length > 0}
                      onChange={handleToggleSelectAll}
                      aria-label="Select all reservations"
                      className="w-4 h-4 rounded border-border/80 text-amber-500 focus:ring-amber-500/40 accent-amber-500 cursor-pointer transition-all"
                    />
                  </TableHead>
                  <TableHead className="w-36">Reference</TableHead>
                  <TableHead>Primary Guest</TableHead>
                  <TableHead>Hotel & Location</TableHead>
                  <TableHead>Stay Dates</TableHead>
                  <TableHead>Room & Meal</TableHead>
                  <TableHead>Financials</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Voucher</TableHead>
                  <TableHead className="text-right min-w-[240px]">Operations Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-xs">
                {displayedReservations.map((res) => {
                  const nights = Math.max(1, Math.ceil((new Date(res.checkOut).getTime() - new Date(res.checkIn).getTime()) / (1000 * 60 * 60 * 24)));
                  const isPending = res.status === 'Pending' || res.confirmationStage === 'PENDING_RESPONSE';
                  const isConfirmed = res.status === 'Confirmed' || res.confirmationStage === 'HOTEL_CONFIRMED';
                  const isCheckedIn = res.status === 'Checked-In';
                  const isSelected = selectedIds.includes(res.id);

                  return (
                    <TableRow 
                      key={res.id} 
                      className={`border-border/40 dark:border-slate-800 transition-colors ${
                        isSelected ? 'bg-amber-500/10 hover:bg-amber-500/15' : 'hover:bg-slate-100/60 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      {/* Checkbox */}
                      <TableCell className="w-10">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(res.id)}
                          aria-label={`Select reservation ${res.bookingReference || res.id}`}
                          className="w-4 h-4 rounded border-border/80 text-amber-500 focus:ring-amber-500/40 accent-amber-500 cursor-pointer transition-all"
                        />
                      </TableCell>

                      {/* Booking Reference */}
                      <TableCell className="font-mono font-bold text-amber-500">
                        <div>{res.bookingReference || res.id.slice(0, 8)}</div>
                        {res.hotelConfirmationNumber && (
                          <div className="text-[10px] text-emerald-500 font-sans font-semibold">
                            CRS: {res.hotelConfirmationNumber}
                          </div>
                        )}
                        {res.hasConflict && (
                          <Badge variant="outline" className="text-[9px] text-rose-500 border-rose-500/30 px-1 py-0 mt-0.5">
                            Duplicate Warning
                          </Badge>
                        )}
                      </TableCell>

                      {/* Guest Details */}
                      <TableCell>
                        <div className="font-bold text-foreground text-xs">{res.guestName}</div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                          {res.guestPhone ? (
                            <a 
                              href={`https://wa.me/${res.guestPhone.replace(/[^0-9]/g, '')}`} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-emerald-500 hover:underline flex items-center gap-0.5"
                            >
                              <MessageSquare className="w-2.5 h-2.5" />
                              {res.guestPhone}
                            </a>
                          ) : (
                            <span>No phone</span>
                          )}
                          <span>•</span>
                          <span>{res.adults || 2}A{res.children ? ` + ${res.children}C` : ''}</span>
                        </div>
                      </TableCell>

                      {/* Hotel & Location */}
                      <TableCell>
                        <div className="font-bold text-foreground line-clamp-1">
                          {res.hotel?.name || 'Hotel Partner'}
                        </div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Building2 className="w-2.5 h-2.5 text-amber-500" />
                          <span>{res.destination || res.hotel?.location || 'Kashmir'}</span>
                        </div>
                      </TableCell>

                      {/* Dates & Nights */}
                      <TableCell>
                        <div className="font-medium text-foreground">
                          {new Date(res.checkIn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} — {new Date(res.checkOut).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-muted-foreground">
                            {nights} {nights === 1 ? 'night' : 'nights'} • {res.roomsCount || 1} room(s)
                          </span>
                          {getStayCountdownBadge(res.checkIn, res.checkOut, res.status)}
                        </div>
                      </TableCell>

                      {/* Room & Meal Plan */}
                      <TableCell>
                        <div className="font-semibold text-foreground truncate max-w-[140px]">
                          {res.confirmedRoomType || res.roomType}
                        </div>
                        <Badge variant="outline" className="font-bold text-[10px] text-amber-500 border-amber-500/30 px-1.5 py-0 mt-0.5">
                          {res.confirmedMealPlan || res.mealPlan}
                        </Badge>
                      </TableCell>

                      {/* Financials */}
                      <TableCell>
                        <div className="font-bold text-foreground">
                          ₹{(res.totalAmount || 0).toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          Net: ₹{(res.hotelDues || 0).toLocaleString('en-IN')}
                        </div>
                      </TableCell>

                      {/* Confirmation Status */}
                      <TableCell>
                        {renderStatusBadge(res)}
                      </TableCell>

                      {/* Voucher Dispatched Status */}
                      <TableCell>
                        {res.guestVoucherDispatched ? (
                          <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 text-[10px] font-bold">
                            Dispatched
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground border-border text-[10px]">
                            Pending
                          </Badge>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* 1. Quick WhatsApp Voucher */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const hotelPhone = res.hotel?.contactPhone?.replace(/\D/g, '') || res.receptionPhone?.replace(/\D/g, '') || '';
                              const portalUrl = `${window.location.origin}/hospitality?tab=reception&token=${res.secureToken || res.id}`;
                              const checkInFormatted = new Date(res.checkIn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                              const checkOutFormatted = new Date(res.checkOut).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                              const msg = 
`*HOTEL BOOKING RESERVATION VOUCHER — KASHMIR CURATORS DMC*
Ref: *#${res.bookingReference || res.id.slice(0, 8)}*
--------------------------------------------------
🏨 *Hotel:* ${res.hotel?.name || 'Partner Hotel'} (${res.destination || 'Kashmir'})
👤 *Guest:* ${res.guestName} (${res.adults || 2} Adults)
📞 *Contact:* ${res.guestPhone || 'On File'}
📅 *Check-In:* ${checkInFormatted}
📅 *Check-Out:* ${checkOutFormatted} (${nights} Nights)
🛏️ *Room:* ${res.roomsCount || 1}x ${res.roomType} (${res.mealPlan})
💰 *Contract Total:* ₹${(res.totalAmount || 0).toLocaleString('en-IN')}
--------------------------------------------------
⚡ *1-Click Reception Portal:*
${portalUrl}

— Kashmir Curators DMC Reservation Desk`;
                              const waNum = hotelPhone.length === 10 ? `91${hotelPhone}` : hotelPhone;
                              const waUrl = waNum ? `https://wa.me/${waNum}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`;
                              window.open(waUrl, '_blank');
                            }}
                            className="h-8 w-8 p-0 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 rounded-xl"
                            title="Send WhatsApp Voucher"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </Button>

                          {/* 2. Direct Email Redirect */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const targetEmail = res.receptionEmail || res.hotel?.contactEmail || '';
                              const checkInFormatted = new Date(res.checkIn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                              const checkOutFormatted = new Date(res.checkOut).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                              const portalUrl = `${window.location.origin}/hospitality?tab=reception&token=${res.secureToken || res.id}`;
                              const subject = `[Reservation Voucher #${res.bookingReference || res.id.slice(0, 8)}] ${res.guestName} - ${res.hotel?.name || 'Hotel'} (${checkInFormatted} to ${checkOutFormatted})`;
                              const body = 
`Attn: Front Desk / Reservations - ${res.hotel?.name || 'Hotel'}

Greetings from Kashmir Curators DMC Operations Desk.

Booking Reference: #${res.bookingReference || res.id.slice(0, 8)}
Guest: ${res.guestName} (${res.adults || 2} Adults)
Stay Dates: ${checkInFormatted} to ${checkOutFormatted} (${nights} Nights)
Room: ${res.roomsCount || 1}x ${res.roomType} (${res.mealPlan})
Agreed Contract Amount: ₹${(res.totalAmount || 0).toLocaleString('en-IN')}

1-Click Online Confirmation Link:
${portalUrl}

Warm regards,
Kashmir Curators DMC Central Reservations`;
                              window.location.href = `mailto:${encodeURIComponent(targetEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                            }}
                            className="h-8 w-8 p-0 text-amber-500 border-amber-500/30 hover:bg-amber-500/10 rounded-xl"
                            title="Direct Email Redirect"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </Button>

                          {/* 3. Edit / Amend Booking */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(res)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl"
                            title="Edit / Amend Booking"
                          >
                            <Pencil className="w-3.5 h-3.5 text-blue-500" />
                          </Button>

                          {/* 4. Details Drawer */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedRes(res);
                              setTargetEmail(res.guestEmail || res.receptionEmail || '');
                              setRawAiInput('');
                              setAiParsedResult(null);
                              fetchAiLogs(res.id);
                              setDetailDrawerOpen(true);
                            }}
                            className="h-8 px-2 text-xs font-bold rounded-xl text-foreground hover:bg-muted"
                            title="View Full Dossier & AI Agent"
                          >
                            <Eye className="w-3.5 h-3.5 text-amber-500 mr-1" />
                            <span>Details</span>
                          </Button>

                          {/* 5. DELETE RESERVATION BUTTON */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setResToDelete(res);
                              setDeleteModalOpen(true);
                            }}
                            className="h-8 w-8 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-500/15 rounded-xl transition-colors"
                            title="Delete Reservation Permanently"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>

                          {/* Contextual Action: Quick Confirm */}
                          {isPending && (
                            <Button
                              size="sm"
                              onClick={() => handleQuickConfirm(res.id, res.guestName)}
                              className="h-8 px-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white"
                              title="Confirm booking"
                            >
                              <Check className="w-3.5 h-3.5 mr-1" />
                              <span>Confirm</span>
                            </Button>
                          )}

                          {/* Contextual Action: Check-In */}
                          {isConfirmed && !isCheckedIn && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedRes(res);
                                setCheckInRoomNumber(res.assignedRoomNumber || '');
                                setCheckInModalOpen(true);
                              }}
                              className="h-8 px-2 rounded-xl text-xs font-bold text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
                            >
                              <LogIn className="w-3.5 h-3.5 mr-1" />
                              <span>Check-In</span>
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
        )}
      </Card>

      {/* 4. MULTI-SECTION DISPATCH RESERVATION MODAL */}
      <Dialog open={dispatchModalOpen} onOpenChange={setDispatchModalOpen}>
        <DialogContent className="rounded-3xl max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-black flex items-center gap-2">
              <Send className="w-5 h-5 text-amber-500" />
              <span>Multi-Section Hotel Reservation Dispatch Form</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Configure guest particulars, select verified partner accommodation, verify tariffs, and dispatch official requests.
            </DialogDescription>
          </DialogHeader>

          {/* Stepper Tabs */}
          <div className="flex items-center justify-between border-b border-border/60 pb-3 text-xs">
            {[
              { id: 'GUEST', label: '1. Guest & Dates' },
              { id: 'HOTEL', label: '2. Hotel & Rooms' },
              { id: 'FINANCIAL', label: '3. Tariffs & Margins' },
              { id: 'DISPATCH', label: '4. Dispatch & Send' }
            ].map(step => (
              <button
                key={step.id}
                type="button"
                onClick={() => {
                  if (step.id !== 'GUEST') {
                    setDispPhoneTouched(true);
                    const val = validatePhoneNumber(dispGuestPhone);
                    if (!val.isValid) {
                      toast.error(`Incorrect Phone Number: ${val.message || 'Please enter a valid 10-digit mobile or international number.'}`);
                      return;
                    }
                    if (!dispGuestName.trim()) {
                      toast.error('Please enter the Primary Guest Name.');
                      return;
                    }
                    if (!dispCheckIn || !dispCheckOut) {
                      toast.error('Please select both Check-In and Check-Out dates.');
                      return;
                    }
                  }
                  setFormStep(step.id as any);
                }}
                className={`font-bold transition-all ${
                  formStep === step.id ? 'text-amber-500 border-b-2 border-amber-500 pb-1 font-black' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {step.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleDispatchSubmit} className="space-y-4 py-2 text-xs">
            {/* STEP 1: GUEST & BOOKING INFORMATION */}
            {formStep === 'GUEST' && (
              <div className="space-y-3.5 animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                      Primary Guest Name *
                    </label>
                    <Input
                      required
                      placeholder="e.g. Dr. Rahul & Priya Sharma"
                      value={dispGuestName}
                      onChange={(e) => setDispGuestName(e.target.value)}
                      className="rounded-xl h-10 text-xs"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold uppercase tracking-wider text-muted-foreground block text-[11px]">
                        Guest WhatsApp / Phone *
                      </label>
                      {dispPhoneTouched && (
                        dispPhoneValidation.isValid ? (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            Verified Contact
                          </span>
                        ) : (
                          <span className="text-[10px] text-red-500 font-bold flex items-center gap-1 animate-pulse">
                            <AlertCircle className="w-3 h-3 text-red-500" />
                            Incorrect Phone
                          </span>
                        )
                      )}
                    </div>
                    <Input
                      required
                      type="tel"
                      placeholder="+91 98201 XXXXX"
                      value={dispGuestPhone}
                      onChange={(e) => {
                        setDispGuestPhone(e.target.value);
                        if (!dispPhoneTouched) setDispPhoneTouched(true);
                      }}
                      onBlur={() => setDispPhoneTouched(true)}
                      className={`rounded-xl h-10 text-xs transition-all ${
                        dispPhoneTouched && !dispPhoneValidation.isValid
                          ? 'border-red-500 bg-red-500/5 focus-visible:ring-red-500 text-red-600 dark:text-red-400 font-medium'
                          : dispPhoneTouched && dispPhoneValidation.isValid
                          ? 'border-emerald-500/60 bg-emerald-500/5'
                          : ''
                      }`}
                    />
                    {dispPhoneTouched && !dispPhoneValidation.isValid && (
                      <p className="text-[11px] text-red-500 font-semibold mt-1 flex items-center gap-1 animate-fade-in">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{dispPhoneValidation.message || 'Please enter a valid 10-digit mobile or international number.'}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                      Guest Email Address
                    </label>
                    <Input
                      type="email"
                      placeholder="guest@domain.com"
                      value={dispGuestEmail}
                      onChange={(e) => setDispGuestEmail(e.target.value)}
                      className="rounded-xl h-10 text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                      Destination
                    </label>
                    <Select value={dispDestination} onValueChange={setDispDestination}>
                      <SelectTrigger className="rounded-xl h-10 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Srinagar">Srinagar (Dal Lake & City)</SelectItem>
                        <SelectItem value="Gulmarg">Gulmarg (Ski & Gondola)</SelectItem>
                        <SelectItem value="Pahalgam">Pahalgam (Betaab & Aru)</SelectItem>
                        <SelectItem value="Sonamarg">Sonamarg (Thajiwas Glacier)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="font-bold uppercase tracking-wider text-muted-foreground block mb-1">Check-In *</label>
                    <Input
                      type="date"
                      required
                      value={dispCheckIn}
                      onChange={(e) => setDispCheckIn(e.target.value)}
                      className="rounded-xl h-10 text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-bold uppercase tracking-wider text-muted-foreground block mb-1">Check-Out *</label>
                    <Input
                      type="date"
                      required
                      value={dispCheckOut}
                      onChange={(e) => setDispCheckOut(e.target.value)}
                      className="rounded-xl h-10 text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-bold uppercase tracking-wider text-muted-foreground block mb-1">Adults</label>
                    <Input
                      type="number"
                      min="1"
                      value={dispAdults}
                      onChange={(e) => setDispAdults(e.target.value)}
                      className="rounded-xl h-10 text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-bold uppercase tracking-wider text-muted-foreground block mb-1">Children</label>
                    <Input
                      type="number"
                      min="0"
                      value={dispChildren}
                      onChange={(e) => setDispChildren(e.target.value)}
                      className="rounded-xl h-10 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold uppercase tracking-wider text-muted-foreground block mb-1">Children Ages</label>
                    <Input
                      placeholder="e.g. 5, 9 years"
                      value={dispChildrenAges}
                      onChange={(e) => setDispChildrenAges(e.target.value)}
                      className="rounded-xl h-10 text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-bold uppercase tracking-wider text-muted-foreground block mb-1">Booking Source</label>
                    <Select value={dispBookingSource} onValueChange={setDispBookingSource}>
                      <SelectTrigger className="rounded-xl h-10 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="B2B_PORTAL">B2B Partner Desk</SelectItem>
                        <SelectItem value="DIRECT_WEBSITE">Direct Website</SelectItem>
                        <SelectItem value="CONCIERGE">VIP Concierge</SelectItem>
                        <SelectItem value="WHATSAPP">WhatsApp Desk</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="font-bold uppercase tracking-wider text-muted-foreground block mb-1">Special Guest Requests</label>
                  <Textarea
                    placeholder="e.g. Bukhari pre-heating at 24C, Kashmiri Kahwa welcome drink, high floor mountain view..."
                    value={dispSpecialRequests}
                    onChange={(e) => setDispSpecialRequests(e.target.value)}
                    className="rounded-xl text-xs h-18 resize-none"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <Button 
                    type="button" 
                    onClick={() => {
                      setDispPhoneTouched(true);
                      const val = validatePhoneNumber(dispGuestPhone);
                      if (!val.isValid) {
                        toast.error(`Incorrect Phone Number: ${val.message || 'Please enter a valid 10-digit mobile or international number.'}`);
                        return;
                      }
                      if (!dispGuestName.trim()) {
                        toast.error('Please enter the Primary Guest Name.');
                        return;
                      }
                      if (!dispCheckIn || !dispCheckOut) {
                        toast.error('Please select both Check-In and Check-Out dates.');
                        return;
                      }
                      setFormStep('HOTEL');
                    }} 
                    className="rounded-xl text-xs font-bold bg-amber-500 text-slate-950"
                  >
                    Next: Hotel & Rooms &rarr;
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 2: HOTEL & ROOM SELECTION */}
            {formStep === 'HOTEL' && (
              <div className="space-y-3.5 animate-fade-in">
                <div>
                  <label className="font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                    Select Verified Hotel / Houseboat *
                  </label>
                  <Select value={dispHotelId} onValueChange={setDispHotelId}>
                    <SelectTrigger className="rounded-xl h-10 text-xs font-bold">
                      <SelectValue placeholder="Choose Hotel..." />
                    </SelectTrigger>
                    <SelectContent>
                      {hotelsList.map(h => (
                        <SelectItem key={h.id} value={h.id} className="text-xs">
                          {h.name} ({h.location?.split(',')[0]})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Reception Contacts */}
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-3 space-y-2">
                  <div className="flex items-center justify-between text-amber-500 font-bold text-xs">
                    <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> Reception Contacts (Auto-Populated)</span>
                    {dispReceptionEmail && <Badge className="bg-emerald-500/10 text-emerald-500 text-[10px]">Verified Email</Badge>}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Reception Email *</label>
                      <Input
                        type="email"
                        required
                        value={dispReceptionEmail}
                        onChange={(e) => setDispReceptionEmail(e.target.value)}
                        placeholder="reception@hotel.com"
                        className="rounded-xl h-9 text-xs bg-background"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground block">Reception Phone</label>
                        {dispReceptionPhone.trim() && (
                          validatePhoneNumber(dispReceptionPhone).isValid ? (
                            <span className="text-[9px] text-emerald-500 font-bold flex items-center gap-0.5">
                              <CheckCircle2 className="w-2.5 h-2.5" /> Valid
                            </span>
                          ) : (
                            <span className="text-[9px] text-red-500 font-bold flex items-center gap-0.5">
                              <AlertCircle className="w-2.5 h-2.5" /> Incorrect
                            </span>
                          )
                        )}
                      </div>
                      <Input
                        type="tel"
                        value={dispReceptionPhone}
                        onChange={(e) => setDispReceptionPhone(e.target.value)}
                        placeholder="+91 94190 XXXXX"
                        className={`rounded-xl h-9 text-xs bg-background transition-all ${
                          dispReceptionPhone.trim() && !validatePhoneNumber(dispReceptionPhone).isValid
                            ? 'border-red-500 bg-red-500/5 text-red-600 focus-visible:ring-red-500'
                            : ''
                        }`}
                      />
                      {dispReceptionPhone.trim() && !validatePhoneNumber(dispReceptionPhone).isValid && (
                        <p className="text-[10px] text-red-500 mt-0.5">
                          {validatePhoneNumber(dispReceptionPhone).message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="font-bold uppercase tracking-wider text-muted-foreground block mb-1">Rooms Count</label>
                    <Input
                      type="number"
                      min="1"
                      value={dispRoomsCount}
                      onChange={(e) => setDispRoomsCount(e.target.value)}
                      className="rounded-xl h-10 text-xs"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="font-bold uppercase tracking-wider text-muted-foreground block mb-1">Room Category *</label>
                    <Input
                      placeholder="e.g. Deluxe Palace Suite"
                      value={dispRoomType}
                      onChange={(e) => setDispRoomType(e.target.value)}
                      className="rounded-xl h-10 text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-bold uppercase tracking-wider text-muted-foreground block mb-1">Meal Plan</label>
                    <Select value={dispMealPlan} onValueChange={(val: any) => setDispMealPlan(val)}>
                      <SelectTrigger className="rounded-xl h-10 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EP">EP (Room Only)</SelectItem>
                        <SelectItem value="CP">CP (Breakfast)</SelectItem>
                        <SelectItem value="MAP">MAP (Breakfast & Dinner)</SelectItem>
                        <SelectItem value="AP">AP (All Meals)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="font-bold uppercase tracking-wider text-muted-foreground block mb-1">Bed Configuration</label>
                  <Select value={dispBedConfig} onValueChange={setDispBedConfig}>
                    <SelectTrigger className="rounded-xl h-10 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="King Bed">King Bed</SelectItem>
                      <SelectItem value="Twin Beds">Twin Beds</SelectItem>
                      <SelectItem value="King + Extra Bed">King Bed + Extra Bed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="pt-2 flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setFormStep('GUEST')} className="rounded-xl text-xs">
                    &larr; Back
                  </Button>
                  <Button type="button" onClick={() => setFormStep('FINANCIAL')} className="rounded-xl text-xs font-bold bg-amber-500 text-slate-950">
                    Next: Tariffs & Margins &rarr;
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 3: FINANCIAL & MARGIN INFORMATION */}
            {formStep === 'FINANCIAL' && (
              <div className="space-y-3.5 animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                      Agreed Wholesale Tariff / Night (INR) *
                    </label>
                    <Input
                      type="number"
                      required
                      value={dispRatePerNight}
                      onChange={(e) => setDispRatePerNight(e.target.value)}
                      className="rounded-xl h-10 text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                      Client Selling Price (Total INR) *
                    </label>
                    <Input
                      type="number"
                      required
                      value={dispSellingPrice}
                      onChange={(e) => setDispSellingPrice(e.target.value)}
                      className="rounded-xl h-10 text-xs font-mono font-bold text-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                      Advance Received from Guest (INR)
                    </label>
                    <Input
                      type="number"
                      value={dispAdvanceReceived}
                      onChange={(e) => setDispAdvanceReceived(e.target.value)}
                      className="rounded-xl h-10 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                      Additional Charges (Heating / Gala)
                    </label>
                    <Input
                      type="number"
                      value={dispExtraCharges}
                      onChange={(e) => setDispExtraCharges(e.target.value)}
                      className="rounded-xl h-10 text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Computed Ledger Preview */}
                <div className="bg-muted/40 rounded-2xl p-4 border border-border/70 space-y-2 text-xs">
                  <div className="font-bold text-foreground uppercase tracking-wider text-[11px] mb-1">
                    Profit & Dues Calculation Preview:
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Estimated Hotel Net Cost:</span>
                    <span className="font-mono font-bold text-foreground">
                      ₹{((Number(dispRatePerNight) || 0) * (Number(dispRoomsCount) || 1) * Math.max(1, Math.ceil((new Date(dispCheckOut || new Date()).getTime() - new Date(dispCheckIn || new Date()).getTime()) / (1000 * 60 * 60 * 24)))).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between text-emerald-500 font-bold">
                    <span>Gross Agency Margin:</span>
                    <span className="font-mono">
                      ₹{Math.max(0, (Number(dispSellingPrice) || 0) - ((Number(dispRatePerNight) || 0) * (Number(dispRoomsCount) || 1) * Math.max(1, Math.ceil((new Date(dispCheckOut || new Date()).getTime() - new Date(dispCheckIn || new Date()).getTime()) / (1000 * 60 * 60 * 24))))).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setFormStep('HOTEL')} className="rounded-xl text-xs">
                    &larr; Back
                  </Button>
                  <Button type="button" onClick={() => setFormStep('DISPATCH')} className="rounded-xl text-xs font-bold bg-amber-500 text-slate-950">
                    Next: Dispatch Options &rarr;
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 4: DISPATCH & CONFIRMATION */}
            {formStep === 'DISPATCH' && (
              <div className="space-y-4 animate-fade-in">
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 space-y-2 text-xs">
                  <div className="font-bold text-amber-500 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" /> Ready for Automated Dispatch
                  </div>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    Upon clicking Submit, an official reservation voucher request will be dispatched to <strong>{dispReceptionEmail || 'Hotel Reception'}</strong> with an account-free, expiring 48-hour secure confirmation link.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-muted/40 rounded-xl border border-border/60">
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      id="autoDispatch"
                      checked={dispAutoDispatchEmail}
                      onChange={(e) => {
                        const authToken = getHospitalityToken(token);
                        if (!authToken) {
                          toast.error('Authentication required to configure automated dispatch.');
                          return;
                        }
                        if (e.target.checked && !dispReceptionEmail.trim()) {
                          toast.error('Verified reception email required to enable automated email dispatch.');
                          return;
                        }
                        setDispAutoDispatchEmail(e.target.checked);
                      }}
                      className="w-4 h-4 rounded border-border/80 text-amber-500 focus:ring-amber-500/40 accent-amber-500 cursor-pointer transition-all"
                    />
                    <label htmlFor="autoDispatch" className="text-xs font-bold text-foreground cursor-pointer select-none">
                      Automatically dispatch reservation email to hotel reception immediately
                    </label>
                  </div>
                  {dispReceptionEmail.trim() ? (
                    <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold w-fit">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Email Verified
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] text-amber-600 dark:text-amber-400 border-amber-500/30 w-fit">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Reception Email Required
                    </Badge>
                  )}
                </div>

                <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-2.5">
                  <Button type="button" variant="outline" onClick={() => setFormStep('FINANCIAL')} className="rounded-xl text-xs w-full sm:w-auto">
                    &larr; Back
                  </Button>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                    <Button
                      type="button"
                      disabled={isSubmittingAction}
                      onClick={() => handleDispatchSubmit(undefined, 'WHATSAPP')}
                      className="w-full sm:w-auto rounded-xl text-xs font-bold bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-md shadow-emerald-500/20 gap-2 h-10 px-4"
                    >
                      <MessageSquare className="w-3.5 h-3.5 fill-white/20" />
                      <span>{isSubmittingAction ? 'Opening...' : 'Dispatch via WhatsApp'}</span>
                    </Button>

                    <Button
                      type="button"
                      disabled={isSubmittingAction}
                      onClick={() => handleDispatchSubmit(undefined, 'EMAIL')}
                      className="w-full sm:w-auto rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 gap-2 h-10 px-4"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>{isSubmittingAction ? 'Opening...' : 'Dispatch via Email'}</span>
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </form>
        </DialogContent>
      </Dialog>

      {/* 5. RESERVATION DETAIL & AUDIT DOSSIER DRAWER */}
      <Sheet open={detailDrawerOpen} onOpenChange={setDetailDrawerOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl p-0 overflow-y-auto">
          {selectedRes && (
            <div className="p-6 space-y-6">
              <SheetHeader className="text-left border-b border-border/60 pb-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-amber-500">
                    Ref: {selectedRes.bookingReference || selectedRes.id}
                  </span>
                  {renderStatusBadge(selectedRes)}
                </div>
                <SheetTitle className="text-xl font-black text-foreground">
                  {selectedRes.guestName}
                </SheetTitle>
                <SheetDescription className="text-xs text-muted-foreground">
                  {selectedRes.hotel?.name} • {selectedRes.destination || selectedRes.hotel?.location}
                </SheetDescription>
              </SheetHeader>

              {/* Dossier Tabs */}
              <Tabs defaultValue="overview" className="w-full text-xs">
                <TabsList className="grid grid-cols-4 rounded-2xl bg-muted/60 p-1">
                  <TabsTrigger value="overview" className="rounded-xl text-xs font-bold">Particulars</TabsTrigger>
                  <TabsTrigger value="ai" className="rounded-xl text-xs font-bold flex items-center justify-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>AI Agent</span>
                  </TabsTrigger>
                  <TabsTrigger value="timeline" className="rounded-xl text-xs font-bold">Audit</TabsTrigger>
                  <TabsTrigger value="emails" className="rounded-xl text-xs font-bold">Emails</TabsTrigger>
                </TabsList>

                {/* TAB 1: OVERVIEW */}
                <TabsContent value="overview" className="space-y-4 pt-3">
                  <div className="bg-muted/30 border border-border/70 rounded-2xl p-4 space-y-2">
                    <div className="font-bold uppercase tracking-wider text-muted-foreground text-[10px]">
                      Stay Particulars
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><span className="text-muted-foreground">Check-In:</span> <strong>{new Date(selectedRes.checkIn).toLocaleDateString('en-IN')}</strong></div>
                      <div><span className="text-muted-foreground">Check-Out:</span> <strong>{new Date(selectedRes.checkOut).toLocaleDateString('en-IN')}</strong></div>
                      <div><span className="text-muted-foreground">Room:</span> <strong>{selectedRes.roomType} ({selectedRes.roomsCount} R)</strong></div>
                      <div><span className="text-muted-foreground">Meal Plan:</span> <strong className="text-amber-500">{selectedRes.mealPlan}</strong></div>
                      <div><span className="text-muted-foreground">Guests:</span> <strong>{selectedRes.adults || 2} Adults, {selectedRes.children || 0} Children</strong></div>
                      <div><span className="text-muted-foreground">Assigned Room:</span> <strong className="text-emerald-500">{selectedRes.assignedRoomNumber || 'Not Allocated'}</strong></div>
                    </div>
                  </div>

                  {/* Financial Breakdown */}
                  <div className="bg-muted/30 border border-border/70 rounded-2xl p-4 space-y-2">
                    <div className="font-bold uppercase tracking-wider text-muted-foreground text-[10px]">
                      Financial Ledger
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Client Selling Total:</span>
                        <span className="font-mono font-bold text-foreground">₹{selectedRes.totalAmount?.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Contracted Hotel Dues:</span>
                        <span className="font-mono text-muted-foreground">₹{selectedRes.hotelDues?.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-emerald-500 font-bold border-t border-border/50 pt-1">
                        <span>Agency Gross Profit:</span>
                        <span className="font-mono">₹{selectedRes.profitMargin?.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Reception Details */}
                  {selectedRes.receptionNotes && (
                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 space-y-1">
                      <div className="text-[10px] uppercase font-bold text-amber-500">Reception Remarks</div>
                      <p className="text-xs italic text-foreground">"{selectedRes.receptionNotes}"</p>
                    </div>
                  )}

                  {/* Quick Actions inside Drawer */}
                  <div className="pt-2 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        const url = `${window.location.origin}/hospitality?tab=reception&token=${selectedRes.secureToken || selectedRes.id}`;
                        navigator.clipboard.writeText(url);
                        toast.success('Reception link copied to clipboard!');
                      }}
                      className="rounded-xl text-xs font-bold border-border"
                      variant="outline"
                    >
                      <Share2 className="w-3.5 h-3.5 mr-1 text-amber-500" />
                      <span>Copy Reception Link</span>
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => setOverrideModalOpen(true)}
                      variant="outline"
                      className="rounded-xl text-xs font-bold text-amber-500 border-amber-500/30"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                      <span>Manager Override</span>
                    </Button>
                  </div>
                </TabsContent>

                {/* TAB: AI AGENT COPILOT */}
                <TabsContent value="ai" className="space-y-4 pt-3">
                  {/* AI Smart Nudge Banner */}
                  <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-500">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-foreground">Autonomous Reservation Agent</h4>
                          <p className="text-[10px] text-muted-foreground">Powered by Gemini 2.5 Flash & Neon PostgreSQL Queue</p>
                        </div>
                      </div>
                      <Badge className="bg-emerald-500/15 text-emerald-500 text-[10px] border-emerald-500/30">Active • 24/7 Monitoring</Badge>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        size="sm"
                        disabled={isNudging}
                        onClick={() => handleTriggerSmartNudge(selectedRes.id)}
                        className="rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 flex-1"
                      >
                        {isNudging ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
                            <span>Sending Smart Nudge...</span>
                          </>
                        ) : (
                          <>
                            <SendHorizontal className="w-3.5 h-3.5 mr-1.5" />
                            <span>Send Escalating Smart Follow-Up</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Inbound Reply AI Parser */}
                  <div className="bg-muted/30 border border-border/70 rounded-2xl p-4 space-y-3">
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
                        <span>Parse Raw Hotel Reply (WhatsApp / Email snippet)</span>
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        Paste the hotel's message. AI will extract CRS #, room type, confirmed tariff, Bukhari heating, and update the reservation record automatically.
                      </p>
                    </div>

                    <Textarea
                      value={rawAiInput}
                      onChange={(e) => setRawAiInput(e.target.value)}
                      placeholder="e.g. Booking confirmed for Tariq Hameed under CRS# DLX-8820 at Rs 18000 MAP plan with Bukhari central heating."
                      className="rounded-xl text-xs h-20 resize-none bg-background font-mono"
                    />

                    <div className="flex items-center justify-between">
                      <Button
                        size="sm"
                        disabled={isParsingAi || !rawAiInput.trim()}
                        onClick={() => handleAiParseReply(selectedRes.id)}
                        className="rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white"
                      >
                        {isParsingAi ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
                            <span>Extracting with Gemini...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                            <span>Auto-Parse & Apply Changes</span>
                          </>
                        )}
                      </Button>
                      {rawAiInput && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => { setRawAiInput(''); setAiParsedResult(null); }}
                          className="text-[10px] text-muted-foreground hover:text-foreground"
                        >
                          Clear
                        </Button>
                      )}
                    </div>

                    {/* Parsed Result Display */}
                    {aiParsedResult && (
                      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-xs space-y-1.5 animate-fade-in">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-emerald-500 text-[11px] uppercase tracking-wider">
                            Detected: {aiParsedResult.intent}
                          </span>
                          <Badge className="bg-emerald-500/20 text-emerald-400 text-[9px]">
                            {Math.round((aiParsedResult.confidence || 0.95) * 100)}% Confidence
                          </Badge>
                        </div>
                        <p className="text-foreground text-[11px]">{aiParsedResult.summary || aiParsedResult.notes}</p>
                        <div className="grid grid-cols-2 gap-1.5 text-[10px] text-muted-foreground pt-1 border-t border-emerald-500/20">
                          {aiParsedResult.hotelConfirmationNumber && (
                            <div>CRS Number: <strong className="text-foreground">{aiParsedResult.hotelConfirmationNumber}</strong></div>
                          )}
                          {aiParsedResult.confirmedTariff && (
                            <div>Agreed Tariff: <strong className="text-foreground">₹{aiParsedResult.confirmedTariff.toLocaleString('en-IN')}</strong></div>
                          )}
                          {aiParsedResult.confirmedRoomType && (
                            <div>Room: <strong className="text-foreground">{aiParsedResult.confirmedRoomType}</strong></div>
                          )}
                          {aiParsedResult.bukhariHeatingConfirmed !== undefined && (
                            <div>Bukhari Heating: <strong className={aiParsedResult.bukhariHeatingConfirmed ? 'text-emerald-400' : 'text-amber-400'}>{aiParsedResult.bukhariHeatingConfirmed ? 'Confirmed' : 'Unspecified'}</strong></div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Autonomous Agent Action History */}
                  <div className="space-y-2">
                    <div className="font-bold uppercase tracking-wider text-muted-foreground text-[10px] flex items-center justify-between">
                      <span>AI Autonomous Action Stream</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => fetchAiLogs(selectedRes.id)}
                        className="h-6 px-1.5 text-[10px] text-muted-foreground hover:text-foreground"
                      >
                        <RefreshCw className="w-2.5 h-2.5 mr-1" /> Refresh Logs
                      </Button>
                    </div>

                    {aiAgentLogs.length === 0 ? (
                      <div className="text-center py-4 bg-muted/20 border border-border/50 rounded-xl">
                        <Sparkles className="w-6 h-6 text-muted-foreground/30 mx-auto mb-1" />
                        <p className="text-muted-foreground text-xs">No automated actions logged for this reservation yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {aiAgentLogs.map((log: any) => (
                          <div key={log.id} className="bg-muted/30 border border-border/60 rounded-xl p-2.5 text-xs space-y-1">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="font-bold text-amber-500">{log.title}</span>
                              <span className="text-muted-foreground">{new Date(log.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p className="text-[11px] text-foreground">{log.description}</p>
                            <div className="flex items-center justify-between text-[9px] text-muted-foreground pt-0.5">
                              <span>Trigger: {log.triggeredBy}</span>
                              {log.confidence && <span>Confidence: {Math.round(log.confidence * 100)}%</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* TAB 2: AUDIT TIMELINE */}
                <TabsContent value="timeline" className="space-y-3 pt-3">
                  {(() => {
                    let logs = [];
                    try { logs = JSON.parse(selectedRes.auditLogs || '[]'); } catch (e) { logs = []; }
                    if (logs.length === 0) {
                      return <p className="text-muted-foreground text-xs py-4 text-center">No audit logs recorded yet.</p>;
                    }
                    return (
                      <div className="space-y-2.5">
                        {logs.map((log: any, idx: number) => (
                          <div key={idx} className="bg-muted/30 border border-border/60 rounded-xl p-3 text-xs space-y-1">
                            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                              <span className="font-bold text-amber-500">{log.action}</span>
                              <span>{new Date(log.timestamp).toLocaleString('en-IN')}</span>
                            </div>
                            <p className="text-foreground text-[11px]">{log.details}</p>
                            <span className="text-[10px] text-muted-foreground block">By: {log.user}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </TabsContent>

                {/* TAB 3: EMAIL LOGS */}
                <TabsContent value="emails" className="space-y-3 pt-3">
                  {selectedRes.emailDispatches && selectedRes.emailDispatches.length > 0 ? (
                    <div className="space-y-2.5">
                      {selectedRes.emailDispatches.map((disp: any) => (
                        <div key={disp.id} className="bg-muted/30 border border-border/60 rounded-xl p-3 text-xs space-y-1">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-bold text-foreground">{disp.emailType}</span>
                            <Badge className={disp.status === 'SENT' ? 'bg-emerald-500/15 text-emerald-500 text-[9px]' : 'bg-rose-500/15 text-rose-500 text-[9px]'}>
                              {disp.status}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground text-[11px]">To: {disp.recipientEmail}</p>
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
                            <span>Provider: {disp.provider}</span>
                            <span>{new Date(disp.createdAt).toLocaleDateString('en-IN')}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-6 text-center space-y-2">
                      <Mail className="w-8 h-8 text-muted-foreground/30 mx-auto" />
                      <p className="text-muted-foreground text-xs">No email dispatches recorded for this reservation yet.</p>
                      <Button
                        size="sm"
                        onClick={() => {
                          setTargetEmail(selectedRes.receptionEmail || selectedRes.hotel?.contactEmail || '');
                          setResendEmailModalOpen(true);
                        }}
                        className="rounded-xl text-xs font-bold bg-amber-500 text-slate-950 mt-2"
                      >
                        Dispatch Email Now
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* 6. DISPATCH GUEST VOUCHER MODAL */}
      <Dialog open={voucherModalOpen} onOpenChange={setVoucherModalOpen}>
        <DialogContent className="rounded-3xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-black flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-amber-500" />
              <span>Approve & Dispatch Guest Voucher</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Review and transmit the official branded booking voucher directly to the primary guest.
            </DialogDescription>
          </DialogHeader>

          {selectedRes && (
            <form onSubmit={handleDispatchGuestVoucherSubmit} className="space-y-4 py-2 text-xs">
              <div className="bg-muted/40 p-3 rounded-2xl border border-border/70 space-y-1">
                <div className="font-bold text-foreground">{selectedRes.guestName}</div>
                <div className="text-muted-foreground">{selectedRes.hotel?.name} • {selectedRes.roomType}</div>
                <div className="text-amber-500 font-mono text-[11px]">CRS Ref: {selectedRes.hotelConfirmationNumber || 'GUARANTEED'}</div>
              </div>

              <div>
                <label className="font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Recipient Guest Email *
                </label>
                <Input
                  type="email"
                  required
                  placeholder="guest@domain.com"
                  value={targetEmail}
                  onChange={(e) => setTargetEmail(e.target.value)}
                  className="rounded-xl h-10 text-xs"
                />
              </div>

              <div>
                <label className="font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Concierge Remarks / Arrival Instructions
                </label>
                <Textarea
                  placeholder="e.g. Airport driver will meet you with a Kashmir Curators placard at Srinagar Airport Exit Gate..."
                  value={voucherNotes}
                  onChange={(e) => setVoucherNotes(e.target.value)}
                  className="rounded-xl text-xs h-16 resize-none"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setVoucherModalOpen(false)} className="rounded-xl text-xs">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingAction}
                  className="rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-400 text-slate-950 px-4"
                >
                  {isSubmittingAction ? 'Sending...' : 'Approve & Dispatch Voucher'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* 7. RESEND EMAIL MODAL */}
      <Dialog open={resendEmailModalOpen} onOpenChange={setResendEmailModalOpen}>
        <DialogContent className="rounded-3xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-black flex items-center gap-2">
              <SendHorizontal className="w-5 h-5 text-amber-500" />
              <span>Dispatch Tracked Operational Email</span>
            </DialogTitle>
          </DialogHeader>

          {selectedRes && (
            <form onSubmit={handleResendEmailSubmit} className="space-y-4 py-2 text-xs">
              <div>
                <label className="font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Select Email Template *
                </label>
                <Select value={emailTemplateType} onValueChange={setEmailTemplateType}>
                  <SelectTrigger className="rounded-xl h-10 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CONFIRMATION_REQUEST">1. Reservation Confirmation Request (Hotel)</SelectItem>
                    <SelectItem value="AVAILABILITY_REQUEST">2. Room Availability Check (Hotel)</SelectItem>
                    <SelectItem value="BOOKING_CONFIRMATION">3. Hotel Booking Confirmation (Partner)</SelectItem>
                    <SelectItem value="GUEST_VOUCHER">4. Official Guest Booking Voucher</SelectItem>
                    <SelectItem value="REMINDER">5. Hotel Response Reminder</SelectItem>
                    <SelectItem value="CANCELLATION">6. Booking Cancellation Notice</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Recipient Email Address *
                </label>
                <Input
                  type="email"
                  required
                  value={targetEmail}
                  onChange={(e) => setTargetEmail(e.target.value)}
                  className="rounded-xl h-10 text-xs"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setResendEmailModalOpen(false)} className="rounded-xl text-xs">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingAction}
                  className="rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-400 text-slate-950 px-4"
                >
                  {isSubmittingAction ? 'Dispatching...' : 'Dispatch Email'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* 8. CHECK-IN MODAL */}
      <Dialog open={checkInModalOpen} onOpenChange={setCheckInModalOpen}>
        <DialogContent className="rounded-3xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-black flex items-center gap-2">
              <LogIn className="w-5 h-5 text-emerald-500" />
              <span>Front Desk Guest Check-In</span>
            </DialogTitle>
          </DialogHeader>

          {selectedRes && (
            <form onSubmit={handleCheckInSubmit} className="space-y-4 py-2 text-xs">
              <div className="bg-emerald-500/5 p-3 rounded-2xl border border-emerald-500/20 text-xs space-y-1">
                <div className="font-bold text-foreground">{selectedRes.guestName}</div>
                <div className="text-muted-foreground">{selectedRes.hotel?.name} • {selectedRes.roomType}</div>
              </div>

              <div>
                <label className="font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Assign Room Number *
                </label>
                <Input
                  required
                  placeholder="e.g. 101 or Palace Suite 3"
                  value={checkInRoomNumber}
                  onChange={(e) => setCheckInRoomNumber(e.target.value)}
                  className="rounded-xl h-10 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                    ID Document Type
                  </label>
                  <Select value={checkInIdType} onValueChange={setCheckInIdType}>
                    <SelectTrigger className="rounded-xl h-10 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Aadhaar Card">Aadhaar Card</SelectItem>
                      <SelectItem value="Passport">Passport</SelectItem>
                      <SelectItem value="Voter ID">Voter ID</SelectItem>
                      <SelectItem value="Driving License">Driving License</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                    ID Number
                  </label>
                  <Input
                    placeholder="XXXX-XXXX-XXXX"
                    value={checkInIdNumber}
                    onChange={(e) => setCheckInIdNumber(e.target.value)}
                    className="rounded-xl h-10 text-xs"
                  />
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setCheckInModalOpen(false)} className="rounded-xl text-xs">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingAction}
                  className="rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-4"
                >
                  {isSubmittingAction ? 'Processing...' : 'Complete Check-In'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* 9. MANAGERIAL STATUS OVERRIDE MODAL */}
      <Dialog open={overrideModalOpen} onOpenChange={setOverrideModalOpen}>
        <DialogContent className="rounded-3xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-black flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-500" />
              <span>Managerial State Machine Override</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Authorized managers can force lifecycle state changes. A mandatory justification reason is required for audit logs.
            </DialogDescription>
          </DialogHeader>

          {selectedRes && (
            <form onSubmit={handleOverrideSubmit} className="space-y-4 py-2 text-xs">
              <div>
                <label className="font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Target Reservation Status *
                </label>
                <Select value={overrideStatus} onValueChange={setOverrideStatus}>
                  <SelectTrigger className="rounded-xl h-10 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Confirmed">Confirmed</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Checked-In">Checked-In</SelectItem>
                    <SelectItem value="Checked-Out">Checked-Out</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Target Lifecycle State *
                </label>
                <Select value={overrideLifecycle} onValueChange={setOverrideLifecycle}>
                  <SelectTrigger className="rounded-xl h-10 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HOTEL_CONFIRMED">HOTEL_CONFIRMED</SelectItem>
                    <SelectItem value="AVAILABILITY_CONFIRMED">AVAILABILITY_CONFIRMED</SelectItem>
                    <SelectItem value="SENT_TO_HOTEL">SENT_TO_HOTEL</SelectItem>
                    <SelectItem value="VOUCHER_SENT">VOUCHER_SENT</SelectItem>
                    <SelectItem value="GUEST_CHECKED_IN">GUEST_CHECKED_IN</SelectItem>
                    <SelectItem value="COMPLETED">COMPLETED</SelectItem>
                    <SelectItem value="CANCELLED">CANCELLED</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Mandatory Override Justification Reason *
                </label>
                <Textarea
                  required
                  placeholder="e.g. Hotel confirmed room verbally over phone with GM Bashir Ahmed due to local network outage..."
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="rounded-xl text-xs h-20 resize-none"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setOverrideModalOpen(false)} className="rounded-xl text-xs">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingAction}
                  className="rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-400 text-slate-950 px-4"
                >
                  {isSubmittingAction ? 'Applying...' : 'Apply & Audit Log'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* 10. SINGLE DELETE CONFIRMATION MODAL */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="rounded-3xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-rose-500 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-rose-500" />
              <span>Delete Reservation Voucher</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1.5">
              Permanently purge this reservation record from the central database.
            </DialogDescription>
          </DialogHeader>

          {resToDelete && (
            <div className="space-y-4 py-2 text-xs">
              <div className="bg-rose-500/10 border border-rose-500/20 p-3.5 rounded-2xl space-y-1.5">
                <div className="font-bold text-foreground text-sm">
                  {resToDelete.guestName}
                </div>
                <div className="text-muted-foreground">
                  {resToDelete.hotel?.name} • {resToDelete.roomType} ({resToDelete.roomsCount || 1} room)
                </div>
                <div className="font-mono text-amber-500 text-[11px]">
                  Ref: #{resToDelete.bookingReference || resToDelete.id.slice(0, 8)}
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Are you sure you want to delete this reservation? This action is <strong>irreversible</strong> and will automatically free up any assigned hotel rooms and erase all voucher audit history.
              </p>

              <DialogFooter className="pt-2 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDeleteModalOpen(false)}
                  disabled={isDeleting}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleDeleteReservation}
                  disabled={isDeleting}
                  className="rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white gap-1.5 shadow-md shadow-rose-600/20 px-4"
                >
                  {isDeleting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  <span>{isDeleting ? 'Deleting...' : 'Delete Permanently'}</span>
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 11. BULK DELETE CONFIRMATION MODAL */}
      <Dialog open={bulkDeleteModalOpen} onOpenChange={setBulkDeleteModalOpen}>
        <DialogContent className="rounded-3xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-rose-500 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-rose-500" />
              <span>Bulk Purge {selectedIds.length} Reservations</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1.5">
              Warning: You are about to permanently delete multiple bookings simultaneously.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="bg-rose-500/10 border border-rose-500/20 p-3.5 rounded-2xl text-rose-600 dark:text-rose-400 font-bold">
              {selectedIds.length} records selected for permanent removal
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed">
              This action will completely purge all selected vouchers and update live KPIs. Are you sure you wish to proceed?
            </p>

            <DialogFooter className="pt-2 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setBulkDeleteModalOpen(false)}
                disabled={isBulkDeleting}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleBulkDelete}
                disabled={isBulkDeleting}
                className="rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white gap-1.5 shadow-md shadow-rose-600/20 px-4"
              >
                {isBulkDeleting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>{isBulkDeleting ? 'Purging...' : `Purge ${selectedIds.length} Bookings`}</span>
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* 12. EDIT / AMEND BOOKING MODAL */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="rounded-3xl max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Pencil className="w-4 h-4 text-amber-500" />
              <span>Edit / Amend Booking #{editRes?.bookingReference || editRes?.id.slice(0, 8)}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Update guest details, travel dates, room type, tariff rates, or reservation status.
            </DialogDescription>
          </DialogHeader>

          {editRes && (
            <form onSubmit={handleSaveEdit} className="space-y-4 py-2 text-xs">
              <div className="bg-muted/40 p-3 rounded-2xl border border-border/70 flex items-center justify-between">
                <div>
                  <div className="font-bold text-foreground">{editRes.hotel?.name || 'Partner Hotel'}</div>
                  <div className="text-muted-foreground text-[11px]">{editRes.destination || 'Kashmir'}</div>
                </div>
                <Badge variant="outline" className="font-mono text-xs text-amber-500 border-amber-500/30">
                  Ref: #{editRes.bookingReference || editRes.id.slice(0, 8)}
                </Badge>
              </div>

              {/* Guest Information */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                    Primary Guest Name *
                  </label>
                  <Input
                    required
                    value={editGuestName}
                    onChange={(e) => setEditGuestName(e.target.value)}
                    className="rounded-xl h-9 text-xs"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold uppercase tracking-wider text-muted-foreground block text-[10px]">
                      Guest Phone / WhatsApp
                    </label>
                    {editPhoneTouched && editGuestPhone.trim() && (
                      editPhoneValidation.isValid ? (
                        <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                          Valid
                        </span>
                      ) : (
                        <span className="text-[9px] text-red-500 font-bold flex items-center gap-0.5">
                          <AlertCircle className="w-2.5 h-2.5 text-red-500" />
                          Incorrect
                        </span>
                      )
                    )}
                  </div>
                  <Input
                    type="tel"
                    value={editGuestPhone}
                    onChange={(e) => {
                      setEditGuestPhone(e.target.value);
                      if (!editPhoneTouched) setEditPhoneTouched(true);
                    }}
                    onBlur={() => setEditPhoneTouched(true)}
                    className={`rounded-xl h-9 text-xs transition-all ${
                      editPhoneTouched && editGuestPhone.trim() && !editPhoneValidation.isValid
                        ? 'border-red-500 bg-red-500/5 focus-visible:ring-red-500 text-red-600'
                        : ''
                    }`}
                  />
                  {editPhoneTouched && editGuestPhone.trim() && !editPhoneValidation.isValid && (
                    <p className="text-[10px] text-red-500 font-semibold mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{editPhoneValidation.message}</span>
                    </p>
                  )}
                </div>
                <div>
                  <label className="font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                    Guest Email
                  </label>
                  <Input
                    type="email"
                    value={editGuestEmail}
                    onChange={(e) => setEditGuestEmail(e.target.value)}
                    className="rounded-xl h-9 text-xs"
                  />
                </div>
              </div>

              {/* Travel Dates */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                    Check-In Date *
                  </label>
                  <Input
                    type="date"
                    required
                    value={editCheckIn}
                    onChange={(e) => setEditCheckIn(e.target.value)}
                    className="rounded-xl h-9 text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                    Check-Out Date *
                  </label>
                  <Input
                    type="date"
                    required
                    value={editCheckOut}
                    onChange={(e) => setEditCheckOut(e.target.value)}
                    className="rounded-xl h-9 text-xs"
                  />
                </div>
              </div>

              {/* Room, Meal & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                    Room Category
                  </label>
                  <Input
                    value={editRoomType}
                    onChange={(e) => setEditRoomType(e.target.value)}
                    className="rounded-xl h-9 text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                    Meal Plan
                  </label>
                  <Select value={editMealPlan} onValueChange={setEditMealPlan}>
                    <SelectTrigger className="rounded-xl h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EP">EP (Room Only)</SelectItem>
                      <SelectItem value="CP">CP (Breakfast)</SelectItem>
                      <SelectItem value="MAP">MAP (Breakfast & Dinner)</SelectItem>
                      <SelectItem value="AP">AP (All Meals)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                    Reservation Status
                  </label>
                  <Select value={editStatus} onValueChange={setEditStatus}>
                    <SelectTrigger className="rounded-xl h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Confirmed">Confirmed</SelectItem>
                      <SelectItem value="Checked-In">Checked-In</SelectItem>
                      <SelectItem value="Checked-Out">Checked-Out</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Tariffs */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                    Contract Rate / Night (₹)
                  </label>
                  <Input
                    type="number"
                    value={editContractRate}
                    onChange={(e) => setEditContractRate(e.target.value)}
                    className="rounded-xl h-9 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                    Total Amount (₹)
                  </label>
                  <Input
                    type="number"
                    value={editTotalAmount}
                    onChange={(e) => setEditTotalAmount(e.target.value)}
                    className="rounded-xl h-9 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              {/* Special Requests */}
              <div>
                <label className="font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Special Requests / Winter Preferences
                </label>
                <Textarea
                  value={editSpecialRequests}
                  onChange={(e) => setEditSpecialRequests(e.target.value)}
                  className="rounded-xl text-xs h-16 resize-none"
                  placeholder="e.g. Bukhari heating pre-lit, Shikara Ghat 2 pickup..."
                />
              </div>

              <DialogFooter className="pt-2 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditModalOpen(false)}
                  disabled={isSavingEdit}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSavingEdit}
                  className="rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 px-5 shadow-md shadow-amber-500/20"
                >
                  {isSavingEdit ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UnifiedOperationsWorkspace;