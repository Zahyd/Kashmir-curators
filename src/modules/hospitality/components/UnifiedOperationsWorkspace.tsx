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
  SendHorizontal
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

  // Filtered reservations in memory if instant search
  const displayedReservations = useMemo(() => {
    return reservations.filter(r => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        r.guestName?.toLowerCase().includes(q) ||
        r.bookingReference?.toLowerCase().includes(q) ||
        r.hotelConfirmationNumber?.toLowerCase().includes(q) ||
        r.hotel?.name?.toLowerCase().includes(q) ||
        r.guestPhone?.includes(q) ||
        r.guestEmail?.toLowerCase().includes(q) ||
        r.destination?.toLowerCase().includes(q)
      );
    });
  }, [reservations, searchQuery]);

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery('');
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

  return (
    <div className="space-y-6">
      {/* 1. OPERATIONAL KPI METRICS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {/* Total Reservations */}
        <Card 
          onClick={() => setFilterStage('ALL')}
          className={`cursor-pointer transition-all border rounded-2xl p-3.5 hover:border-amber-500/50 shadow-sm ${
            filterStage === 'ALL' ? 'bg-amber-500/10 border-amber-500/40 ring-1 ring-amber-500/20' : 'bg-card border-border/70'
          }`}
        >
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
            <span>Total Bookings</span>
            <Layers className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-foreground mt-1">
            {kpisLoading ? '—' : kpis.totalReservations}
          </div>
          <span className="text-[10px] text-muted-foreground">Portfolio Volume</span>
        </Card>

        {/* Pending Hotel Responses */}
        <Card 
          onClick={() => setFilterStage('Pending')}
          className={`cursor-pointer transition-all border rounded-2xl p-3.5 hover:border-amber-500/50 shadow-sm ${
            filterStage === 'Pending' ? 'bg-amber-500/10 border-amber-500/40 ring-1 ring-amber-500/20' : 'bg-card border-border/70'
          }`}
        >
          <div className="text-[10px] font-bold uppercase tracking-wider text-amber-500 flex items-center justify-between">
            <span>Pending Response</span>
            <Clock className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-500 mt-1">
            {kpisLoading ? '—' : kpis.pendingHotelResponses}
          </div>
          <span className="text-[10px] text-muted-foreground">Front Desk Queue</span>
        </Card>

        {/* Availability Verified */}
        <Card 
          onClick={() => setFilterStage('AVAILABILITY_CONFIRMED')}
          className={`cursor-pointer transition-all border rounded-2xl p-3.5 hover:border-blue-500/50 shadow-sm ${
            filterStage === 'AVAILABILITY_CONFIRMED' ? 'bg-blue-500/10 border-blue-500/40 ring-1 ring-blue-500/20' : 'bg-card border-border/70'
          }`}
        >
          <div className="text-[10px] font-bold uppercase tracking-wider text-blue-500 flex items-center justify-between">
            <span>Avail. Verified</span>
            <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-500 mt-1">
            {kpisLoading ? '—' : kpis.availabilityVerified}
          </div>
          <span className="text-[10px] text-muted-foreground">Inventory Blocked</span>
        </Card>

        {/* Alternative Offered */}
        <Card 
          onClick={() => setFilterStage('ALTERNATIVE_OFFERED')}
          className={`cursor-pointer transition-all border rounded-2xl p-3.5 hover:border-purple-500/50 shadow-sm ${
            filterStage === 'ALTERNATIVE_OFFERED' ? 'bg-purple-500/10 border-purple-500/40 ring-1 ring-purple-500/20' : 'bg-card border-border/70'
          }`}
        >
          <div className="text-[10px] font-bold uppercase tracking-wider text-purple-400 flex items-center justify-between">
            <span>Alt. Offered</span>
            <RotateCcw className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400 mt-1">
            {kpisLoading ? '—' : kpis.alternativeOffered}
          </div>
          <span className="text-[10px] text-muted-foreground">Requires Review</span>
        </Card>

        {/* Hotel Confirmed */}
        <Card 
          onClick={() => setFilterStage('Confirmed')}
          className={`cursor-pointer transition-all border rounded-2xl p-3.5 hover:border-emerald-500/50 shadow-sm ${
            filterStage === 'Confirmed' ? 'bg-emerald-500/10 border-emerald-500/40 ring-1 ring-emerald-500/20' : 'bg-card border-border/70'
          }`}
        >
          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 flex items-center justify-between">
            <span>Hotel Confirmed</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-500 mt-1">
            {kpisLoading ? '—' : kpis.hotelConfirmed}
          </div>
          <span className="text-[10px] text-muted-foreground">Guaranteed CRS</span>
        </Card>

        {/* Voucher Dispatched */}
        <Card 
          onClick={() => setFilterStage('VOUCHER_SENT')}
          className="bg-card border-border/70 rounded-2xl p-3.5 hover:border-amber-500/50 shadow-sm transition-all"
        >
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
            <span>Voucher Dispatched</span>
            <FileCheck className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-foreground mt-1">
            {kpisLoading ? '—' : kpis.guestVoucherDispatched}
          </div>
          <span className="text-[10px] text-muted-foreground">Guest Issued</span>
        </Card>

        {/* Guest Checked-In */}
        <Card 
          onClick={() => setFilterStage('Checked-In')}
          className={`cursor-pointer transition-all border rounded-2xl p-3.5 hover:border-emerald-500/50 shadow-sm ${
            filterStage === 'Checked-In' ? 'bg-emerald-500/10 border-emerald-500/40 ring-1 ring-emerald-500/20' : 'bg-card border-border/70'
          }`}
        >
          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
            <span>Checked-In</span>
            <LogIn className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {kpisLoading ? '—' : kpis.guestCheckedIn}
          </div>
          <span className="text-[10px] text-muted-foreground">In-House Stays</span>
        </Card>

        {/* Cancelled */}
        <Card 
          onClick={() => setFilterStage('Cancelled')}
          className={`cursor-pointer transition-all border rounded-2xl p-3.5 hover:border-rose-500/50 shadow-sm ${
            filterStage === 'Cancelled' ? 'bg-rose-500/10 border-rose-500/40 ring-1 ring-rose-500/20' : 'bg-card border-border/70'
          }`}
        >
          <div className="text-[10px] font-bold uppercase tracking-wider text-rose-500 flex items-center justify-between">
            <span>Cancelled</span>
            <XCircle className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-500 mt-1">
            {kpisLoading ? '—' : kpis.cancelledReservations}
          </div>
          <span className="text-[10px] text-muted-foreground">Released Rooms</span>
        </Card>

        {/* Upcoming Check-Ins (48h) */}
        <Card className="bg-card border-border/70 rounded-2xl p-3.5 hover:border-amber-500/50 shadow-sm transition-all">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
            <span>Upcoming (48h)</span>
            <Calendar className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-foreground mt-1">
            {kpisLoading ? '—' : kpis.upcomingCheckIns}
          </div>
          <span className="text-[10px] text-muted-foreground">Arrivals Alert</span>
        </Card>

        {/* Today's Check-Outs */}
        <Card className="bg-card border-border/70 rounded-2xl p-3.5 hover:border-amber-500/50 shadow-sm transition-all">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
            <span>Today's Check-Out</span>
            <LogOut className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-foreground mt-1">
            {kpisLoading ? '—' : kpis.todayCheckOuts}
          </div>
          <span className="text-[10px] text-muted-foreground">Departures</span>
        </Card>

        {/* Total Revenue */}
        <Card className="bg-card border-border/70 rounded-2xl p-3.5 hover:border-amber-500/50 shadow-sm transition-all col-span-2 sm:col-span-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
            <span>Booking Revenue</span>
            <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-xl font-black text-emerald-500 mt-1 truncate">
            ₹{kpisLoading ? '—' : (kpis.totalRevenue >= 100000 ? `${(kpis.totalRevenue / 100000).toFixed(1)}L` : kpis.totalRevenue.toLocaleString('en-IN'))}
          </div>
          <span className="text-[10px] text-muted-foreground">Gross Portfolio</span>
        </Card>

        {/* Outstanding Hotel Payments */}
        <Card className="bg-card border-border/70 rounded-2xl p-3.5 hover:border-amber-500/50 shadow-sm transition-all col-span-2 sm:col-span-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
            <span>Supplier Dues</span>
            <DollarSign className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-xl font-black text-amber-500 mt-1 truncate">
            ₹{kpisLoading ? '—' : (kpis.outstandingHotelPayments >= 100000 ? `${(kpis.outstandingHotelPayments / 100000).toFixed(1)}L` : kpis.outstandingHotelPayments.toLocaleString('en-IN'))}
          </div>
          <span className="text-[10px] text-muted-foreground">Payable Ledger</span>
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
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/50 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-muted-foreground uppercase mr-1 flex items-center gap-1">
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
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  filterStage === pill.id
                    ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Destination Selector */}
            <Select value={filterDestination} onValueChange={setFilterDestination}>
              <SelectTrigger className="h-8 rounded-xl text-xs w-36 bg-background">
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
              <SelectTrigger className="h-8 rounded-xl text-xs w-32 bg-background">
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

      {/* 3. COMPREHENSIVE RESERVATION MANAGEMENT TABLE */}
      <Card className="rounded-3xl border border-border/80 bg-card overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 border-b border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarCheck2 className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-black text-foreground">
              Centralized Reservation Operations Desk
            </h2>
            <Badge variant="outline" className="font-mono text-xs text-muted-foreground ml-2">
              {displayedReservations.length} records
            </Badge>
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
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow className="border-border/60 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  <TableHead className="w-36">Reference</TableHead>
                  <TableHead>Primary Guest</TableHead>
                  <TableHead>Hotel & Location</TableHead>
                  <TableHead>Stay Dates</TableHead>
                  <TableHead>Room & Meal</TableHead>
                  <TableHead>Financials</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Voucher</TableHead>
                  <TableHead className="text-right">Operations Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-xs">
                {displayedReservations.map((res) => {
                  const nights = Math.max(1, Math.ceil((new Date(res.checkOut).getTime() - new Date(res.checkIn).getTime()) / (1000 * 60 * 60 * 24)));
                  const isPending = res.status === 'Pending' || res.confirmationStage === 'PENDING_RESPONSE';
                  const isConfirmed = res.status === 'Confirmed' || res.confirmationStage === 'HOTEL_CONFIRMED';
                  const isCheckedIn = res.status === 'Checked-In';

                  return (
                    <TableRow key={res.id} className="border-border/40 hover:bg-muted/30 transition-colors">
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
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          {nights} {nights === 1 ? 'night' : 'nights'} • {res.roomsCount || 1} room(s)
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
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Detail Drawer */}
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
                            className="h-8 px-2 text-xs font-bold rounded-lg text-foreground hover:bg-muted"
                            title="View Full Dossier & AI Agent"
                          >
                            <Eye className="w-3.5 h-3.5 text-amber-500 mr-1" />
                            <span>Details</span>
                          </Button>

                          {/* Quick AI Smart Nudge */}
                          {isPending && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isNudging}
                              onClick={() => handleTriggerSmartNudge(res.id)}
                              className="h-8 px-2 rounded-lg text-xs font-bold text-amber-500 border-amber-500/30 hover:bg-amber-500/10"
                              title="Send Escalating AI Follow-Up Reminder to Hotel"
                            >
                              <Sparkles className="w-3.5 h-3.5 mr-1" />
                              <span>Nudge</span>
                            </Button>
                          )}

                          {/* Quick Confirm */}
                          {isPending && (
                            <Button
                              size="sm"
                              onClick={() => handleQuickConfirm(res.id, res.guestName)}
                              className="h-8 px-2.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white"
                              title="Confirm booking"
                            >
                              <Check className="w-3.5 h-3.5 mr-1" />
                              <span>Confirm</span>
                            </Button>
                          )}

                          {/* Check-In Action */}
                          {isConfirmed && !isCheckedIn && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedRes(res);
                                setCheckInRoomNumber(res.assignedRoomNumber || '');
                                setCheckInModalOpen(true);
                              }}
                              className="h-8 px-2 rounded-lg text-xs font-bold text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
                            >
                              <LogIn className="w-3.5 h-3.5 mr-1" />
                              <span>Check-In</span>
                            </Button>
                          )}

                          {/* Dispatch Guest Voucher */}
                          {isConfirmed && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedRes(res);
                                setTargetEmail(res.guestEmail || '');
                                setVoucherModalOpen(true);
                              }}
                              className="h-8 px-2 text-xs rounded-lg text-amber-500 border-amber-500/30 hover:bg-amber-500/10"
                              title="Send Guest Voucher"
                            >
                              <FileCheck className="w-3.5 h-3.5 mr-1" />
                              <span>Voucher</span>
                            </Button>
                          )}

                          {/* Resend Email */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedRes(res);
                              setTargetEmail(res.receptionEmail || res.hotel?.contactEmail || '');
                              setEmailTemplateType('CONFIRMATION_REQUEST');
                              setResendEmailModalOpen(true);
                            }}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground rounded-lg"
                            title="Resend Tracked Email"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </Button>
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
                onClick={() => setFormStep(step.id as any)}
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
                    <label className="font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                      Guest WhatsApp / Phone *
                    </label>
                    <Input
                      required
                      placeholder="+91 98201 XXXXX"
                      value={dispGuestPhone}
                      onChange={(e) => setDispGuestPhone(e.target.value)}
                      className="rounded-xl h-10 text-xs"
                    />
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
                  <Button type="button" onClick={() => setFormStep('HOTEL')} className="rounded-xl text-xs font-bold bg-amber-500 text-slate-950">
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
                      <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Reception Phone</label>
                      <Input
                        value={dispReceptionPhone}
                        onChange={(e) => setDispReceptionPhone(e.target.value)}
                        placeholder="+91 94190 XXXXX"
                        className="rounded-xl h-9 text-xs bg-background"
                      />
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

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="autoDispatch"
                    checked={dispAutoDispatchEmail}
                    onChange={(e) => setDispAutoDispatchEmail(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-amber-500 w-4 h-4"
                  />
                  <label htmlFor="autoDispatch" className="text-xs font-bold text-foreground cursor-pointer">
                    Automatically dispatch reservation email to hotel reception immediately
                  </label>
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
    </div>
  );
};

export default UnifiedOperationsWorkspace;