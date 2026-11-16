import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  CalendarCheck2, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  AlertTriangle, 
  HelpCircle, 
  Sparkles, 
  FileCheck, 
  FileText, 
  Upload, 
  RefreshCw, 
  Search, 
  ArrowRight, 
  ShieldCheck, 
  Utensils, 
  Flame, 
  User, 
  Phone, 
  Mail, 
  DollarSign, 
  Eye, 
  Share2, 
  Printer, 
  Check, 
  ExternalLink,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { getHospitalityHeaders } from '../utils/hospitalityAuth';

export interface ReceptionReservation {
  id: string;
  secureToken?: string;
  bookingReference?: string;
  hotelId: string;
  hotel?: { 
    id: string;
    name: string; 
    location: string; 
    contactPhone?: string;
    contactEmail?: string;
    contactName?: string;
    image?: string;
  };
  guestName: string;
  guestPhone?: string;
  guestEmail?: string;
  roomType: string;
  roomsCount: number;
  adults?: number;
  children?: number;
  checkIn: string;
  checkOut: string;
  mealPlan: 'EP' | 'CP' | 'MAP' | 'AP';
  specialRequests?: string;
  status: 'Pending' | 'Confirmed' | 'Checked-In' | 'Checked-Out' | 'Hold' | 'Rejected' | 'Cancelled';
  confirmationStage: 'PENDING_RESPONSE' | 'AVAILABILITY_CONFIRMED' | 'ALTERNATIVE_OFFERED' | 'HOTEL_CONFIRMED' | 'REJECTED_UNAVAILABLE' | 'EXPIRED' | 'CANCELLED';
  paymentStatus?: string;
  totalAmount: number;
  contractRate: number;
  hotelDues: number;
  tokenExpiresAt?: string;
  confirmationDeadline?: string;
  hotelConfirmationNumber?: string;
  confirmedRoomType?: string;
  confirmedRoomsCount?: number;
  confirmedTariff?: number;
  confirmedTaxes?: number;
  confirmedMealPlan?: string;
  confirmationVoucherUrl?: string;
  receptionNotes?: string;
  rejectionReason?: string;
  alternativeRoomType?: string;
  alternativeTariff?: number;
  alternativeDates?: string;
  alternativeNotes?: string;
  clarificationRequest?: string;
  clarificationResponse?: string;
  respondedAt?: string;
  respondedBy?: string;
  agentName?: string;
  auditLogs?: string;
  createdAt: string;
}

interface HotelReceptionPortalProps {
  selectedHotelId?: string;
  onSwitchProperty?: (hotelId: string) => void;
  isExternalPartnerMode?: boolean;
}

export const HotelReceptionPortal: React.FC<HotelReceptionPortalProps> = ({ 
  selectedHotelId, 
  onSwitchProperty,
  isExternalPartnerMode = false
}) => {
  const { token, user } = useAuth();
  const [searchParams] = useSearchParams();
  const queryToken = searchParams.get('token');
  const queryId = searchParams.get('id');

  const [reservations, setReservations] = useState<ReceptionReservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('ALL');
  const [selectedRes, setSelectedRes] = useState<ReceptionReservation | null>(null);

  // Response Form States for Selected Reservation
  const [actionTab, setActionTab] = useState<'CONFIRM' | 'AVAILABILITY' | 'ALTERNATIVE' | 'REJECT' | 'CLARIFY'>('CONFIRM');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Confirm Form
  const [hotelConfirmationNumber, setHotelConfirmationNumber] = useState('');
  const [confirmedRoomType, setConfirmedRoomType] = useState('');
  const [confirmedTariff, setConfirmedTariff] = useState('');
  const [confirmedTaxes, setConfirmedTaxes] = useState('');
  const [confirmedMealPlan, setConfirmedMealPlan] = useState('MAP');
  const [confirmedRoomsCount, setConfirmedRoomsCount] = useState('1');
  const [receptionNotes, setReceptionNotes] = useState('');
  const [confirmationVoucherUrl, setConfirmationVoucherUrl] = useState('');
  const [responderName, setResponderName] = useState(user?.name || 'Hotel Front Desk Manager');

  // Alternative Form
  const [altRoomType, setAltRoomType] = useState('');
  const [altTariff, setAltTariff] = useState('');
  const [altDates, setAltDates] = useState('');
  const [altNotes, setAltNotes] = useState('');

  // Rejection Form
  const [rejectionReason, setRejectionReason] = useState('100% Sold Out / No Inventory');
  const [rejectionNotes, setRejectionNotes] = useState('');

  // Clarification Form
  const [clarificationQuestion, setClarificationQuestion] = useState('');

  // Voucher Print Preview Modal
  const [voucherPreviewRes, setVoucherPreviewRes] = useState<ReceptionReservation | null>(null);

  // Load Reservations (Supports both external partner public access and authenticated internal desk)
  const fetchReservations = async () => {
    try {
      setIsLoading(true);

      // If accessing via direct public secure token or booking id
      if (queryToken || queryId) {
        const publicLookup = queryToken || queryId;
        try {
          const pubRes = await fetch(`${API_BASE_URL}/hospitality/public/${publicLookup}`);
          if (pubRes.ok) {
            const pubData = await pubRes.json();
            const formattedItem: ReceptionReservation = {
              id: pubData.id,
              secureToken: pubData.secureToken,
              bookingReference: pubData.bookingReference,
              hotelId: pubData.hotelId || 'PARTNER_HOTEL',
              hotel: {
                id: pubData.hotelId || 'PARTNER_HOTEL',
                name: pubData.hotelName,
                location: pubData.hotelLocation,
                contactName: pubData.hotelContactName,
                contactEmail: pubData.hotelContactEmail,
                contactPhone: pubData.hotelContactPhone,
                image: pubData.hotelImage
              },
              guestName: pubData.guestName,
              guestPhone: pubData.guestPhone,
              guestEmail: pubData.guestEmail,
              roomType: pubData.roomType,
              roomsCount: pubData.roomsCount,
              adults: pubData.adults,
              children: pubData.children,
              checkIn: pubData.checkIn,
              checkOut: pubData.checkOut,
              mealPlan: pubData.mealPlan,
              specialRequests: pubData.specialRequests,
              status: pubData.status,
              confirmationStage: pubData.confirmationStage,
              paymentStatus: 'Direct Voucher',
              totalAmount: pubData.estimatedNetTotal || 0,
              contractRate: pubData.contractRate || 0,
              hotelDues: pubData.estimatedNetTotal || 0,
              tokenExpiresAt: pubData.tokenExpiresAt,
              confirmationDeadline: pubData.confirmationDeadline,
              hotelConfirmationNumber: pubData.hotelConfirmationNumber,
              confirmedRoomType: pubData.confirmedRoomType,
              confirmedRoomsCount: pubData.confirmedRoomsCount,
              confirmedTariff: pubData.confirmedTariff,
              confirmedTaxes: pubData.confirmedTaxes,
              confirmedMealPlan: pubData.confirmedMealPlan,
              confirmationVoucherUrl: pubData.confirmationVoucherUrl,
              receptionNotes: pubData.receptionNotes,
              rejectionReason: pubData.rejectionReason,
              alternativeRoomType: pubData.alternativeRoomType,
              alternativeTariff: pubData.alternativeTariff,
              alternativeDates: pubData.alternativeDates,
              alternativeNotes: pubData.alternativeNotes,
              clarificationRequest: pubData.clarificationRequest,
              clarificationResponse: pubData.clarificationResponse,
              respondedAt: pubData.respondedAt,
              respondedBy: pubData.respondedBy,
              agentName: pubData.agentName,
              createdAt: pubData.createdAt || new Date().toISOString()
            };

            setReservations([formattedItem]);
            initiateResponseModal(formattedItem);
            setIsLoading(false);
            return;
          }
        } catch (pubErr) {
          console.warn('Public token lookup failed, trying authenticated endpoint:', pubErr);
        }
      }

      const headers = getHospitalityHeaders(token);
      const url = `${API_BASE_URL}/hospitality${selectedHotelId && selectedHotelId !== 'ALL' ? `?hotelId=${selectedHotelId}` : ''}`;
      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        const list: ReceptionReservation[] = Array.isArray(data) ? data : [];
        setReservations(list);

        // Auto-select if query token or id matches
        if (queryToken || queryId) {
          const match = list.find(r => r.secureToken === queryToken || r.id === (queryToken || queryId));
          if (match) {
            initiateResponseModal(match);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load reception reservations:', err);
      toast.error('Unable to fetch reception requests');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, [selectedHotelId, token]);

  const initiateResponseModal = (resItem: ReceptionReservation) => {
    setSelectedRes(resItem);
    setHotelConfirmationNumber(resItem.hotelConfirmationNumber || resItem.bookingReference || `HTL-${Math.floor(10000 + Math.random() * 90000)}`);
    setConfirmedRoomType(resItem.confirmedRoomType || resItem.roomType);
    setConfirmedTariff(String(resItem.confirmedTariff || resItem.contractRate || 0));
    setConfirmedTaxes(String(resItem.confirmedTaxes || 0));
    setConfirmedMealPlan(resItem.confirmedMealPlan || resItem.mealPlan || 'MAP');
    setConfirmedRoomsCount(String(resItem.confirmedRoomsCount || resItem.roomsCount || 1));
    setReceptionNotes(resItem.receptionNotes || 'Confirmed. Winter Bukhari pre-heating requested.');
    setConfirmationVoucherUrl(resItem.confirmationVoucherUrl || '');
    setAltRoomType(resItem.alternativeRoomType || '');
    setAltTariff(String(resItem.alternativeTariff || ''));
    setAltDates(resItem.alternativeDates || '');
    setAltNotes(resItem.alternativeNotes || '');
    setClarificationQuestion('');
    setActionTab('CONFIRM');
  };

  // 1. Submit Final Guaranteed Booking Confirmation
  const handleSubmitConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRes) return;
    if (!hotelConfirmationNumber.trim()) {
      toast.error('Please enter the Hotel Booking Confirmation / CRS Reference number');
      return;
    }

    try {
      setIsSubmitting(true);
      const tokenOrId = selectedRes.secureToken || selectedRes.id;
      const res = await fetch(`${API_BASE_URL}/hospitality/public/${tokenOrId}/confirm-booking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotelConfirmationNumber: hotelConfirmationNumber.trim(),
          confirmedRoomType,
          confirmedRoomsCount: Number(confirmedRoomsCount) || 1,
          confirmedTariff: Number(confirmedTariff) || selectedRes.contractRate,
          confirmedTaxes: Number(confirmedTaxes) || 0,
          confirmedMealPlan,
          confirmationVoucherUrl: confirmationVoucherUrl.trim() || undefined,
          receptionNotes: receptionNotes.trim(),
          respondedBy: responderName.trim()
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to submit confirmation');
      }

      toast.success('Hotel Booking Confirmed & Guaranteed!', {
        description: `Booking Reference ${hotelConfirmationNumber} saved and synchronized with Kashmir Curators desk.`,
        icon: '✅'
      });

      setSelectedRes(null);
      fetchReservations();
    } catch (err: any) {
      toast.error(err.message || 'Error submitting booking confirmation');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Submit Availability Confirmation Only
  const handleSubmitConfirmAvailability = async () => {
    if (!selectedRes) return;
    try {
      setIsSubmitting(true);
      const tokenOrId = selectedRes.secureToken || selectedRes.id;
      const res = await fetch(`${API_BASE_URL}/hospitality/public/${tokenOrId}/confirm-availability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receptionistName: responderName.trim(),
          notes: receptionNotes.trim() || 'Rooms verified and blocked for guest.'
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to confirm availability');
      }

      toast.success('Availability Confirmed!', {
        description: `Rooms marked available for ${selectedRes.guestName}. Final CRS code can be added next.`,
        icon: '🏨'
      });

      setSelectedRes(null);
      fetchReservations();
    } catch (err: any) {
      toast.error(err.message || 'Error confirming availability');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Submit Alternative Proposal
  const handleSubmitAlternative = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRes) return;
    if (!altRoomType.trim() && !altTariff && !altDates.trim()) {
      toast.error('Please enter at least one alternative proposal (Room Type, Tariff, or Dates)');
      return;
    }

    try {
      setIsSubmitting(true);
      const tokenOrId = selectedRes.secureToken || selectedRes.id;
      const res = await fetch(`${API_BASE_URL}/hospitality/public/${tokenOrId}/propose-alternative`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alternativeRoomType: altRoomType.trim() || undefined,
          alternativeTariff: altTariff ? Number(altTariff) : undefined,
          alternativeDates: altDates.trim() || undefined,
          alternativeNotes: altNotes.trim() || undefined,
          respondedBy: responderName.trim()
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to submit alternative proposal');
      }

      toast.info('Alternative Proposal Transmitted', {
        description: `Kashmir Curators desk has been notified of your proposed category/rate modification.`,
        icon: '🔄'
      });

      setSelectedRes(null);
      fetchReservations();
    } catch (err: any) {
      toast.error(err.message || 'Error submitting alternative proposal');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Submit Rejection as Unavailable
  const handleSubmitRejection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRes) return;

    try {
      setIsSubmitting(true);
      const tokenOrId = selectedRes.secureToken || selectedRes.id;
      const res = await fetch(`${API_BASE_URL}/hospitality/public/${tokenOrId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: `${rejectionReason}${rejectionNotes ? ` — ${rejectionNotes.trim()}` : ''}`,
          respondedBy: responderName.trim()
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to submit rejection');
      }

      toast.warning('Reservation Declined as Unavailable', {
        description: `Decline recorded. Kashmir Curators operations desk alerted to reroute guest.`,
        icon: '❌'
      });

      setSelectedRes(null);
      fetchReservations();
    } catch (err: any) {
      toast.error(err.message || 'Error submitting rejection');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. Submit Clarification Request
  const handleSubmitClarification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRes) return;
    if (!clarificationQuestion.trim()) {
      toast.error('Please enter your question or inquiry');
      return;
    }

    try {
      setIsSubmitting(true);
      const tokenOrId = selectedRes.secureToken || selectedRes.id;
      const res = await fetch(`${API_BASE_URL}/hospitality/public/${tokenOrId}/clarification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: clarificationQuestion.trim(),
          respondedBy: responderName.trim()
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to send clarification question');
      }

      toast.success('Question Dispatched to DMC Desk', {
        description: `Kashmir Curators team will respond to your reception query promptly.`,
        icon: '💬'
      });

      setSelectedRes(null);
      fetchReservations();
    } catch (err: any) {
      toast.error(err.message || 'Error sending question');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter by selected hotel first (strict isolation)
  const isDirectLookup = Boolean(isExternalPartnerMode || queryToken || queryId);
  const propertyReservations = isDirectLookup
    ? reservations
    : reservations.filter(r => {
        if (selectedHotelId && selectedHotelId !== 'ALL' && r.hotelId !== selectedHotelId) {
          return false;
        }
        return true;
      });

  // Auto-initiate form if in direct lookup mode
  useEffect(() => {
    if (isDirectLookup && propertyReservations.length > 0 && !selectedRes) {
      initiateResponseModal(propertyReservations[0]);
    }
  }, [isDirectLookup, propertyReservations, selectedRes]);

  // KPI Calculations
  const totalCount = propertyReservations.length;
  const pendingCount = propertyReservations.filter(r => r.confirmationStage === 'PENDING_RESPONSE' || r.status === 'Pending').length;
  const availabilityCount = propertyReservations.filter(r => r.confirmationStage === 'AVAILABILITY_CONFIRMED').length;
  const alternativeCount = propertyReservations.filter(r => r.confirmationStage === 'ALTERNATIVE_OFFERED').length;
  const confirmedCount = propertyReservations.filter(r => r.confirmationStage === 'HOTEL_CONFIRMED' || r.status === 'Confirmed').length;
  const unavailableCount = propertyReservations.filter(r => r.confirmationStage === 'REJECTED_UNAVAILABLE' || r.status === 'Rejected').length;

  // Filter Logic
  const filteredReservations = propertyReservations.filter(r => {
    const matchesSearch = 
      r.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.bookingReference || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.hotelConfirmationNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.hotel?.name || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (stageFilter === 'PENDING') return r.confirmationStage === 'PENDING_RESPONSE' || r.status === 'Pending';
    if (stageFilter === 'AVAILABILITY') return r.confirmationStage === 'AVAILABILITY_CONFIRMED';
    if (stageFilter === 'ALTERNATIVE') return r.confirmationStage === 'ALTERNATIVE_OFFERED';
    if (stageFilter === 'CONFIRMED') return r.confirmationStage === 'HOTEL_CONFIRMED' || r.status === 'Confirmed';
    if (stageFilter === 'UNAVAILABLE') return r.confirmationStage === 'REJECTED_UNAVAILABLE' || r.status === 'Rejected';

    return true;
  });

  // Deadline calculation helper
  const getDeadlineInfo = (deadlineStr?: string, tokenExpiryStr?: string) => {
    const target = deadlineStr ? new Date(deadlineStr) : tokenExpiryStr ? new Date(tokenExpiryStr) : null;
    if (!target) return { label: '48h Window', isUrgent: false, isExpired: false };
    const diff = target.getTime() - Date.now();
    if (diff <= 0) return { label: 'Deadline Expired', isUrgent: true, isExpired: true };
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours < 4) return { label: `${hours}h ${mins}m remaining`, isUrgent: true, isExpired: false };
    return { label: `${hours}h ${mins}m left`, isUrgent: false, isExpired: false };
  };

  // Helper renderer for response form
  const renderResponseForm = (resItem: ReceptionReservation, isInline: boolean = false) => (
    <div className="space-y-6">
      {/* Action Tab Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-900/80 rounded-2xl border border-border/60">
        <button
          type="button"
          onClick={() => setActionTab('CONFIRM')}
          className={`py-2 px-2 text-xs font-bold rounded-xl transition-all ${
            actionTab === 'CONFIRM' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-foreground'
          }`}
        >
          1. Confirm Booking
        </button>
        <button
          type="button"
          onClick={() => setActionTab('AVAILABILITY')}
          className={`py-2 px-2 text-xs font-bold rounded-xl transition-all ${
            actionTab === 'AVAILABILITY' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-foreground'
          }`}
        >
          2. Availability
        </button>
        <button
          type="button"
          onClick={() => setActionTab('ALTERNATIVE')}
          className={`py-2 px-2 text-xs font-bold rounded-xl transition-all ${
            actionTab === 'ALTERNATIVE' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-foreground'
          }`}
        >
          3. Alternative
        </button>
        <button
          type="button"
          onClick={() => setActionTab('REJECT')}
          className={`py-2 px-2 text-xs font-bold rounded-xl transition-all ${
            actionTab === 'REJECT' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-foreground'
          }`}
        >
          4. Sold Out
        </button>
        <button
          type="button"
          onClick={() => setActionTab('CLARIFY')}
          className={`col-span-2 sm:col-span-1 py-2 px-2 text-xs font-bold rounded-xl transition-all ${
            actionTab === 'CLARIFY' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-foreground'
          }`}
        >
          5. Clarification
        </button>
      </div>

      {/* TAB 1: CONFIRM FINAL BOOKING */}
      {actionTab === 'CONFIRM' && (
        <form onSubmit={handleSubmitConfirmBooking} className="space-y-4">
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs space-y-1">
            <div className="flex items-center gap-2 font-bold text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Confirm Guaranteed Room Allocation</span>
            </div>
            <p className="text-muted-foreground">
              Enter your property's internal booking reference or CRS confirmation code. This guarantees the booking and notifies the Kashmir Curators team.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                Hotel Booking / CRS Ref # <span className="text-rose-500">*</span>
              </label>
              <Input
                required
                placeholder="e.g. LALIT-SXR-2026-981"
                value={hotelConfirmationNumber}
                onChange={(e) => setHotelConfirmationNumber(e.target.value)}
                className="rounded-xl text-xs font-mono font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Confirmed Room Category</label>
              <Input
                value={confirmedRoomType}
                onChange={(e) => setConfirmedRoomType(e.target.value)}
                placeholder="e.g. Deluxe Heritage Room"
                className="rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Confirmed Tariff / Nt (₹)</label>
              <Input
                type="number"
                value={confirmedTariff}
                onChange={(e) => setConfirmedTariff(e.target.value)}
                className="rounded-xl text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Applicable Taxes (₹)</label>
              <Input
                type="number"
                value={confirmedTaxes}
                onChange={(e) => setConfirmedTaxes(e.target.value)}
                placeholder="0"
                className="rounded-xl text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Confirmed Meal Plan</label>
              <Select value={confirmedMealPlan} onValueChange={setConfirmedMealPlan}>
                <SelectTrigger className="rounded-xl text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EP">EP (Room Only)</SelectItem>
                  <SelectItem value="CP">CP (Bed & Breakfast)</SelectItem>
                  <SelectItem value="MAP">MAP (Breakfast + Dinner)</SelectItem>
                  <SelectItem value="AP">AP (All Meals)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Special Check-in / Heating Instructions</label>
            <Textarea
              rows={2}
              value={receptionNotes}
              onChange={(e) => setReceptionNotes(e.target.value)}
              placeholder="e.g. Check-in 14:00. Electric blanket on bed. Bukhari fueled for evening."
              className="rounded-xl text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Confirmation Document / Voucher URL</label>
              <Input
                value={confirmationVoucherUrl}
                onChange={(e) => setConfirmationVoucherUrl(e.target.value)}
                placeholder="https://... (Optional voucher link)"
                className="rounded-xl text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Receptionist / Manager Name</label>
              <Input
                value={responderName}
                onChange={(e) => setResponderName(e.target.value)}
                placeholder="Your name / title"
                className="rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="pt-3 flex items-center justify-between gap-3">
            {!isInline && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedRes(null)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5 ml-auto shadow-sm"
            >
              {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>Submit Guaranteed Hotel Confirmation</span>
            </Button>
          </div>
        </form>
      )}

      {/* TAB 2: CONFIRM AVAILABILITY ONLY */}
      {actionTab === 'AVAILABILITY' && (
        <div className="space-y-4">
          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-2xl text-xs space-y-1">
            <div className="flex items-center gap-2 font-bold text-blue-600 dark:text-blue-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm Room Availability (Hold Stage)</span>
            </div>
            <p className="text-muted-foreground">
              Use this option to confirm that rooms are available and held on block, while final hotel CRS numbers are being processed.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Hold Notes / Remarks</label>
            <Textarea
              rows={3}
              value={receptionNotes}
              onChange={(e) => setReceptionNotes(e.target.value)}
              placeholder="e.g. 1x Deluxe Room held until 18:00 tomorrow. Final guest vouchers accepted."
              className="rounded-xl text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Receptionist / Duty Manager Name</label>
            <Input
              value={responderName}
              onChange={(e) => setResponderName(e.target.value)}
              placeholder="Your name / title"
              className="rounded-xl text-xs"
            />
          </div>

          <div className="pt-3 flex items-center justify-between gap-3">
            {!isInline && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedRes(null)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
            )}
            <Button
              type="button"
              onClick={handleSubmitConfirmAvailability}
              disabled={isSubmitting}
              className="rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white gap-1.5 ml-auto"
            >
              {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CalendarCheck2 className="w-3.5 h-3.5" />}
              <span>Verify & Hold Room Inventory</span>
            </Button>
          </div>
        </div>
      )}

      {/* TAB 3: PROPOSE ALTERNATIVE */}
      {actionTab === 'ALTERNATIVE' && (
        <form onSubmit={handleSubmitAlternative} className="space-y-4">
          <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-2xl text-xs space-y-1">
            <div className="flex items-center gap-2 font-bold text-purple-600 dark:text-purple-400">
              <Sparkles className="w-4 h-4" />
              <span>Propose Alternative Category, Rates, or Dates</span>
            </div>
            <p className="text-muted-foreground">
              If requested room is unavailable or rates differ, offer an alternative category or revised dates to keep the reservation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Proposed Alternative Category</label>
              <Input
                placeholder="e.g. Maharaja Suite / Executive Cottage"
                value={altRoomType}
                onChange={(e) => setAltRoomType(e.target.value)}
                className="rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Proposed Tariff / Nt (₹)</label>
              <Input
                type="number"
                placeholder="e.g. 18500"
                value={altTariff}
                onChange={(e) => setAltTariff(e.target.value)}
                className="rounded-xl text-xs font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Alternative Available Dates (Optional)</label>
            <Input
              placeholder="e.g. Nov 20 to Nov 23"
              value={altDates}
              onChange={(e) => setAltDates(e.target.value)}
              className="rounded-xl text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Remarks for Kashmir Curators Operations Desk</label>
            <Textarea
              rows={2}
              value={altNotes}
              onChange={(e) => setAltNotes(e.target.value)}
              placeholder="Explain upgrade benefits or reason for alternative proposal..."
              className="rounded-xl text-xs"
            />
          </div>

          <div className="pt-3 flex items-center justify-between gap-3">
            {!isInline && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedRes(null)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white gap-1.5 ml-auto"
            >
              {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>Submit Alternative Proposal</span>
            </Button>
          </div>
        </form>
      )}

      {/* TAB 4: DECLINE / 100% SOLD OUT */}
      {actionTab === 'REJECT' && (
        <form onSubmit={handleSubmitRejection} className="space-y-4">
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs space-y-1">
            <div className="flex items-center gap-2 font-bold text-rose-600 dark:text-rose-400">
              <XCircle className="w-4 h-4" />
              <span>Decline Reservation Request</span>
            </div>
            <p className="text-muted-foreground">
              Mark reservation as unavailable so Kashmir Curators operations desk can immediately reroute the guest to an alternative property.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Primary Reason for Unavailability</label>
            <Select value={rejectionReason} onValueChange={setRejectionReason}>
              <SelectTrigger className="rounded-xl text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="100% Sold Out / No Inventory">100% Sold Out / No Inventory</SelectItem>
                <SelectItem value="Property Under Annual Winter Maintenance">Property Under Annual Winter Maintenance</SelectItem>
                <SelectItem value="Full Buyout / VIP Government Protocol">Full Buyout / VIP Government Protocol</SelectItem>
                <SelectItem value="Requested Room Category Out of Order">Requested Room Category Out of Order</SelectItem>
                <SelectItem value="Blackout Dates / Rates Dispute">Blackout Dates / Rates Dispute</SelectItem>
                <SelectItem value="Other">Other Specific Reason</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Detailed Remarks / Reason</label>
            <Textarea
              rows={2}
              value={rejectionNotes}
              onChange={(e) => setRejectionNotes(e.target.value)}
              placeholder="e.g. Fully booked due to winter ski tournament..."
              className="rounded-xl text-xs"
            />
          </div>

          <div className="pt-3 flex items-center justify-between gap-3">
            {!isInline && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedRes(null)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white gap-1.5 ml-auto"
            >
              {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
              <span>Confirm Decline as Unavailable</span>
            </Button>
          </div>
        </form>
      )}

      {/* TAB 5: SEND CLARIFICATION QUESTION */}
      {actionTab === 'CLARIFY' && (
        <form onSubmit={handleSubmitClarification} className="space-y-4">
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs space-y-1">
            <div className="flex items-center gap-2 font-bold text-amber-600 dark:text-amber-400">
              <HelpCircle className="w-4 h-4" />
              <span>Inquire / Request Clarification</span>
            </div>
            <p className="text-muted-foreground">
              Send a direct query to Kashmir Curators operations desk regarding guest flight timing, bed preferences, meal plans, or payments.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Your Question or Inquiry</label>
            <Textarea
              rows={3}
              value={clarificationQuestion}
              onChange={(e) => setClarificationQuestion(e.target.value)}
              placeholder="e.g. Please confirm if guest requires extra bed or airport pickup vehicle..."
              className="rounded-xl text-xs"
            />
          </div>

          <div className="pt-3 flex items-center justify-between gap-3">
            {!isInline && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedRes(null)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 gap-1.5 ml-auto"
            >
              {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <HelpCircle className="w-3.5 h-3.5" />}
              <span>Send Question to Operations Desk</span>
            </Button>
          </div>
        </form>
      )}
    </div>
  );

  // -------------------------------------------------------------
  // EXTERNAL PARTNER DIRECT LOOKUP VIEW (Direct Hero Workspace)
  // -------------------------------------------------------------
  if (isDirectLookup) {
    if (isLoading) {
      return (
        <Card className="rounded-3xl border border-border/80 bg-card p-12 text-center animate-pulse space-y-4 max-w-3xl mx-auto">
          <RefreshCw className="w-10 h-10 text-amber-500 animate-spin mx-auto" />
          <h3 className="text-lg font-bold text-foreground">Loading Official Reservation Request...</h3>
          <p className="text-xs text-muted-foreground">Connecting securely with Kashmir Curators reservation network...</p>
        </Card>
      );
    }

    if (propertyReservations.length === 0) {
      return (
        <Card className="rounded-3xl border border-amber-500/30 bg-card p-8 sm:p-12 text-center shadow-sm max-w-xl mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-500">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-black text-foreground">Reservation Request Not Found</h3>
          <p className="text-sm text-muted-foreground">
            The reservation request <span className="font-mono text-amber-500 font-bold">{queryToken || queryId || 'specified'}</span> could not be located in our partner network. The reservation may have been processed, cancelled, or the link has expired.
          </p>
          <div className="p-4 bg-muted/40 rounded-2xl text-xs text-muted-foreground border border-border text-left space-y-1.5">
            <div className="font-bold text-foreground">Kashmir Curators Operations Concierge:</div>
            <div>• Urgent Front Desk Hotline: <strong className="text-foreground">+91 94190 88201</strong></div>
            <div>• WhatsApp Partner Desk: <strong className="text-foreground">+91 98201 54321</strong></div>
            <div>• Email: <strong className="text-foreground">operations@kashmircurators.com</strong></div>
          </div>
          <Button
            variant="outline"
            onClick={() => fetchReservations()}
            className="rounded-xl text-xs gap-1.5 font-bold mx-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Loading Request</span>
          </Button>
        </Card>
      );
    }

    const heroRes = propertyReservations[0];
    const checkInDate = new Date(heroRes.checkIn);
    const checkOutDate = new Date(heroRes.checkOut);
    const nights = Math.max(1, Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)));
    const deadline = getDeadlineInfo(heroRes.confirmationDeadline, heroRes.tokenExpiresAt);

    const isPending = heroRes.confirmationStage === 'PENDING_RESPONSE' || heroRes.status === 'Pending';
    const isAvail = heroRes.confirmationStage === 'AVAILABILITY_CONFIRMED';
    const isAlt = heroRes.confirmationStage === 'ALTERNATIVE_OFFERED';
    const isConfirmed = heroRes.confirmationStage === 'HOTEL_CONFIRMED' || heroRes.status === 'Confirmed';
    const isRejected = heroRes.confirmationStage === 'REJECTED_UNAVAILABLE' || heroRes.status === 'Rejected';

    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Main Dossier Card */}
        <Card className="rounded-3xl border border-border/80 bg-card overflow-hidden shadow-sm">
          <div className="p-6 sm:p-8 space-y-6">
            {/* Top Bar: Property Name + Reference + Stage Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-muted/80 flex items-center justify-center font-bold text-sm text-foreground shrink-0 border border-border">
                  <Building2 className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-xl text-foreground">
                      {heroRes.hotel?.name || 'Partner Hotel'}
                    </h3>
                    <Badge variant="outline" className="font-mono text-xs font-bold text-amber-500 border-amber-500/30">
                      #{heroRes.bookingReference || heroRes.id.slice(0, 8)}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {heroRes.hotel?.location || 'Kashmir'} • Dispatched by {heroRes.agentName || 'Kashmir Curators Operations Desk'}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {isPending && (
                  <Badge 
                    variant="outline" 
                    className={`text-xs font-bold gap-1 ${
                      deadline.isUrgent ? 'text-rose-500 border-rose-500/40 bg-rose-500/10 animate-pulse' : 'text-amber-500 border-amber-500/40'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>{deadline.label}</span>
                  </Badge>
                )}

                <Badge
                  className={`text-xs font-bold px-3 py-1.5 ${
                    isPending ? 'bg-amber-500 text-slate-950 animate-pulse' :
                    isAvail ? 'bg-blue-600 text-white' :
                    isAlt ? 'bg-purple-600 text-white' :
                    isConfirmed ? 'bg-emerald-600 text-white' :
                    'bg-muted text-muted-foreground'
                  }`}
                >
                  {isPending && 'Pending Reception Response'}
                  {isAvail && 'Room Availability Confirmed'}
                  {isAlt && 'Alternative Proposed'}
                  {isConfirmed && 'Hotel Booking Confirmed'}
                  {isRejected && 'Sold Out / Unavailable'}
                </Badge>
              </div>
            </div>

            {/* Stay Particulars Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-muted/20 rounded-2xl border border-border/60 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Lead Guest</span>
                <strong className="text-foreground text-sm font-bold block truncate">{heroRes.guestName}</strong>
                <span className="text-[11px] text-muted-foreground font-mono">{heroRes.guestPhone || 'Phone upon arrival'}</span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Dates of Stay</span>
                <span className="font-semibold text-foreground block">
                  {checkInDate.toLocaleDateString([], { month: 'short', day: 'numeric' })} – {checkOutDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold">
                  {nights} Night{nights > 1 ? 's' : ''} • {heroRes.roomsCount} Room(s) • {heroRes.adults || 2} Adults
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Requested Accommodation</span>
                <span className="font-bold text-foreground block truncate">{heroRes.roomType}</span>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 mt-0.5 border-border">
                  Plan: {heroRes.mealPlan} ({heroRes.mealPlan === 'EP' ? 'Room Only' : heroRes.mealPlan === 'CP' ? 'Bed & Breakfast' : heroRes.mealPlan === 'MAP' ? 'Bkfst+Dinner' : 'All Meals'})
                </Badge>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Contract Net Rate</span>
                <span className="font-mono text-base font-black text-emerald-600 dark:text-emerald-400 block">
                  ₹{(heroRes.contractRate || 0).toLocaleString('en-IN')}<span className="text-[10px] font-normal text-muted-foreground">/nt</span>
                </span>
                <span className="text-[10px] text-muted-foreground font-medium">
                  Est. Net: ₹{((heroRes.contractRate || 0) * (heroRes.roomsCount || 1) * nights).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Special Instructions & Bukhari */}
            {heroRes.specialRequests && (
              <div className="p-3.5 bg-amber-500/10 rounded-2xl text-xs flex items-center gap-2 text-foreground border border-amber-500/20">
                <Flame className="w-4 h-4 text-amber-500 shrink-0" />
                <span><strong>Special Requests & Heating:</strong> {heroRes.specialRequests}</span>
              </div>
            )}

            {/* Existing CRS Reference if Confirmed */}
            {isConfirmed && heroRes.hotelConfirmationNumber && (
              <div className="p-4 bg-emerald-500/10 rounded-2xl text-xs border border-emerald-500/30 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  <div>
                    <span className="text-emerald-700 dark:text-emerald-300 font-bold block">
                      Confirmed Hotel CRS Reference: <span className="font-mono text-sm">{heroRes.hotelConfirmationNumber}</span>
                    </span>
                    <span className="text-muted-foreground text-[11px]">
                      {heroRes.confirmedRoomType || heroRes.roomType} @ ₹{heroRes.confirmedTariff || heroRes.contractRate}/nt • {heroRes.confirmedMealPlan || heroRes.mealPlan}
                    </span>
                  </div>
                </div>

                <Button
                  size="sm"
                  onClick={() => setVoucherPreviewRes(heroRes)}
                  className="rounded-xl text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>View Printable Voucher</span>
                </Button>
              </div>
            )}

            {/* Interactive Response Form */}
            <div className="border-t border-border/60 pt-5">
              <h4 className="text-sm font-black text-foreground mb-3 flex items-center gap-2">
                <span>Reception Response & Confirmation Desk</span>
                <Badge variant="outline" className="text-[10px] font-mono text-amber-500 border-amber-500/30">
                  Select Action
                </Badge>
              </h4>
              {renderResponseForm(heroRes, true)}
            </div>
          </div>
        </Card>

        {/* OFFICIAL VOUCHER PRINT MODAL */}
        <Dialog open={!!voucherPreviewRes} onOpenChange={(open) => !open && setVoucherPreviewRes(null)}>
          <DialogContent className="max-w-xl bg-card border-border rounded-3xl p-6 sm:p-8">
            {voucherPreviewRes && (
              <div className="space-y-6">
                <div className="text-center border-b border-border pb-4 space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">
                    Official Hotel Booking Confirmation Voucher
                  </span>
                  <h3 className="text-xl font-black text-foreground">Kashmir Curators DMC</h3>
                  <p className="text-xs text-muted-foreground">
                    Partner Property: <strong>{voucherPreviewRes.hotel?.name || 'Partner Hotel'}</strong>
                  </p>
                </div>

                <div className="p-4 bg-muted/40 rounded-2xl border border-border space-y-3 text-xs">
                  <div className="flex justify-between items-center pb-2 border-b border-border/60">
                    <span className="text-muted-foreground">Hotel Confirmation / CRS Ref:</span>
                    <strong className="font-mono text-sm text-foreground">{voucherPreviewRes.hotelConfirmationNumber || voucherPreviewRes.bookingReference}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Lead Guest Name:</span>
                    <strong className="text-foreground">{voucherPreviewRes.guestName}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Check-In / Check-Out:</span>
                    <span className="font-semibold text-foreground">
                      {new Date(voucherPreviewRes.checkIn).toLocaleDateString()} to {new Date(voucherPreviewRes.checkOut).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Room Category & Count:</span>
                    <span className="font-bold text-foreground">{voucherPreviewRes.confirmedRoomsCount || voucherPreviewRes.roomsCount}x {voucherPreviewRes.confirmedRoomType || voucherPreviewRes.roomType}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Meal Plan:</span>
                    <span className="font-bold text-amber-500">{voucherPreviewRes.confirmedMealPlan || voucherPreviewRes.mealPlan}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-border/60">
                    <span className="text-muted-foreground font-bold">Confirmed Contract Rate:</span>
                    <span className="font-mono text-sm font-black text-emerald-600 dark:text-emerald-400">
                      ₹{(voucherPreviewRes.confirmedTariff || voucherPreviewRes.contractRate || 0).toLocaleString('en-IN')}/nt
                    </span>
                  </div>
                </div>

                {voucherPreviewRes.receptionNotes && (
                  <div className="p-3 bg-muted/30 rounded-xl text-xs text-muted-foreground border border-border/50">
                    <strong>Special Instructions:</strong> {voucherPreviewRes.receptionNotes}
                  </div>
                )}

                <DialogFooter className="flex justify-between items-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.print()}
                    className="rounded-xl text-xs font-bold gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Voucher</span>
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setVoucherPreviewRes(null)}
                    className="rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950"
                  >
                    Done
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // -------------------------------------------------------------
  // INTERNAL EMPLOYEE RECEPTION QUEUE VIEW
  // -------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* KPI Stats Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card className="rounded-3xl border border-border/80 bg-card p-4 shadow-sm hover:border-amber-500/50 transition-all cursor-pointer" onClick={() => setStageFilter('ALL')}>
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Total Requests</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-foreground">{totalCount}</span>
            <Badge variant="outline" className="text-xs font-semibold">All</Badge>
          </div>
        </Card>

        <Card 
          className={`rounded-3xl border p-4 shadow-sm transition-all cursor-pointer ${
            stageFilter === 'PENDING' ? 'border-amber-500 bg-amber-500/10' : 'border-amber-500/40 bg-card hover:border-amber-500'
          }`}
          onClick={() => setStageFilter('PENDING')}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 block">Pending Action</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-amber-500">{pendingCount}</span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
          </div>
        </Card>

        <Card 
          className={`rounded-3xl border p-4 shadow-sm transition-all cursor-pointer ${
            stageFilter === 'AVAILABILITY' ? 'border-blue-500 bg-blue-500/10' : 'border-blue-500/40 bg-card hover:border-blue-500'
          }`}
          onClick={() => setStageFilter('AVAILABILITY')}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500 block">Availability Verified</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-blue-500">{availabilityCount}</span>
            <Badge variant="outline" className="text-blue-500 border-blue-500/30 text-[10px]">Held</Badge>
          </div>
        </Card>

        <Card 
          className={`rounded-3xl border p-4 shadow-sm transition-all cursor-pointer ${
            stageFilter === 'ALTERNATIVE' ? 'border-purple-500 bg-purple-500/10' : 'border-purple-500/40 bg-card hover:border-purple-500'
          }`}
          onClick={() => setStageFilter('ALTERNATIVE')}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-500 block">Alternative Offered</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-purple-500">{alternativeCount}</span>
            <Badge variant="outline" className="text-purple-500 border-purple-500/30 text-[10px]">Review</Badge>
          </div>
        </Card>

        <Card 
          className={`rounded-3xl border p-4 shadow-sm transition-all cursor-pointer ${
            stageFilter === 'CONFIRMED' ? 'border-emerald-500 bg-emerald-500/10' : 'border-emerald-500/40 bg-card hover:border-emerald-500'
          }`}
          onClick={() => setStageFilter('CONFIRMED')}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 block">Hotel Confirmed</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-emerald-500">{confirmedCount}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
        </Card>
      </div>

      {/* Reception Action Header & Search */}
      <div className="bg-card p-4 sm:p-5 rounded-3xl border border-border/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
              <span>Hotel Reception Confirmation Portal</span>
              <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 text-xs">
                Live Front Desk Desk
              </Badge>
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Receive reservation requests from Kashmir Curators employees, confirm availability, assign hotel CRS numbers, or offer alternatives.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search guest or voucher ref..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs rounded-xl w-52 sm:w-64 bg-background border-border"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchReservations}
            className="rounded-xl text-xs gap-1.5 h-9"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none w-full">
        {[
          { id: 'ALL', label: `All Requests (${totalCount})` },
          { id: 'PENDING', label: `Pending Response (${pendingCount})` },
          { id: 'AVAILABILITY', label: `Availability Confirmed (${availabilityCount})` },
          { id: 'ALTERNATIVE', label: `Alternative Offered (${alternativeCount})` },
          { id: 'CONFIRMED', label: `Hotel Confirmed (${confirmedCount})` },
          { id: 'UNAVAILABLE', label: `Sold Out / Declined (${unavailableCount})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStageFilter(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all ${
              stageFilter === tab.id
                ? 'bg-amber-500 text-slate-950 font-black shadow-sm border border-amber-500'
                : 'bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white border border-slate-200/90 dark:border-slate-700/80 font-bold'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Card key={i} className="h-44 rounded-3xl bg-card border border-border/60 animate-pulse" />
            ))}
          </div>
        ) : filteredReservations.length === 0 ? (
          <Card className="rounded-3xl border border-dashed border-border p-12 text-center bg-card/60">
            <CalendarCheck2 className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
            <h4 className="font-bold text-base text-foreground">No Reception Requests Found</h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
              {stageFilter === 'ALL'
                ? 'No reservation requests have been dispatched to this property yet.'
                : 'No requests match the selected stage filter.'}
            </p>
          </Card>
        ) : (
          filteredReservations.map((resItem) => {
            const checkInDate = new Date(resItem.checkIn);
            const checkOutDate = new Date(resItem.checkOut);
            const nights = Math.max(1, Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)));
            const deadline = getDeadlineInfo(resItem.confirmationDeadline, resItem.tokenExpiresAt);

            const isPending = resItem.confirmationStage === 'PENDING_RESPONSE' || resItem.status === 'Pending';
            const isAvail = resItem.confirmationStage === 'AVAILABILITY_CONFIRMED';
            const isAlt = resItem.confirmationStage === 'ALTERNATIVE_OFFERED';
            const isConfirmed = resItem.confirmationStage === 'HOTEL_CONFIRMED' || resItem.status === 'Confirmed';
            const isRejected = resItem.confirmationStage === 'REJECTED_UNAVAILABLE' || resItem.status === 'Rejected';

            return (
              <Card
                key={resItem.id}
                className={`rounded-3xl border transition-all overflow-hidden shadow-sm ${
                  isPending ? 'border-amber-500/50 bg-amber-500/[0.03]' :
                  isAvail ? 'border-blue-500/40 bg-blue-500/[0.02]' :
                  isAlt ? 'border-purple-500/40 bg-purple-500/[0.02]' :
                  isConfirmed ? 'border-emerald-500/40 bg-card hover:border-emerald-500/70' :
                  'border-border/60 bg-muted/20 opacity-80'
                }`}
              >
                <div className="p-5 sm:p-6 space-y-4">
                  {/* Top Bar: Reference + Property + Stage Badge */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-muted/80 flex items-center justify-center font-bold text-sm text-foreground shrink-0 border border-border">
                        <Building2 className="w-5 h-5 text-amber-500" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-base text-foreground">
                            {resItem.hotel?.name || 'Partner Hotel'}
                          </h4>
                          <Badge variant="outline" className="font-mono text-xs font-bold">
                            {resItem.bookingReference || resItem.id.slice(0, 8)}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {resItem.hotel?.location || 'Kashmir'} • Dispatched by {resItem.agentName || 'Kashmir Curators Operations Desk'}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Deadline Countdown */}
                      {isPending && (
                        <Badge 
                          variant="outline" 
                          className={`text-xs font-bold gap-1 ${
                            deadline.isUrgent ? 'text-rose-500 border-rose-500/40 bg-rose-500/10 animate-pulse' : 'text-amber-500 border-amber-500/40'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>{deadline.label}</span>
                        </Badge>
                      )}

                      {/* Stage Badge */}
                      <Badge
                        className={`text-xs font-bold px-3 py-1 ${
                          isPending ? 'bg-amber-500 text-slate-950 animate-pulse' :
                          isAvail ? 'bg-blue-600 text-white' :
                          isAlt ? 'bg-purple-600 text-white' :
                          isConfirmed ? 'bg-emerald-600 text-white' :
                          'bg-muted text-muted-foreground'
                        }`}
                      >
                        {isPending && 'Pending Reception Response'}
                        {isAvail && 'Room Availability Confirmed'}
                        {isAlt && 'Alternative Proposed'}
                        {isConfirmed && 'Hotel Booking Confirmed'}
                        {isRejected && 'Sold Out / Unavailable'}
                      </Badge>
                    </div>
                  </div>

                  {/* Middle Details Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">Lead Guest</span>
                      <strong className="text-foreground text-sm font-bold block truncate">{resItem.guestName}</strong>
                      <span className="text-[11px] text-muted-foreground font-mono">{resItem.guestPhone || 'Phone via Voucher'}</span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">Stay Dates</span>
                      <span className="font-semibold text-foreground block">
                        {checkInDate.toLocaleDateString([], { month: 'short', day: 'numeric' })} – {checkOutDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold">
                        {nights} Night{nights > 1 ? 's' : ''} • {resItem.roomsCount} Room(s) • {resItem.adults || 2} Adults
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">Requested Accommodation</span>
                      <span className="font-bold text-foreground block truncate">{resItem.roomType}</span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 mt-0.5 border-border">
                        Plan: {resItem.mealPlan} ({resItem.mealPlan === 'EP' ? 'Room Only' : resItem.mealPlan === 'CP' ? 'Bed & Breakfast' : resItem.mealPlan === 'MAP' ? 'Bkfst+Dinner' : 'All Meals'})
                      </Badge>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">Offered Contract Tariff</span>
                      <span className="font-mono text-base font-black text-emerald-600 dark:text-emerald-400 block">
                        ₹{(resItem.contractRate || 0).toLocaleString('en-IN')}<span className="text-[10px] font-normal text-muted-foreground">/nt</span>
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        Est. Net: ₹{((resItem.contractRate || 0) * (resItem.roomsCount || 1) * nights).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Kashmir Preferences & Bukhari Heating */}
                  {resItem.specialRequests && (
                    <div className="p-3 bg-muted/40 rounded-2xl text-xs flex items-center gap-2 text-muted-foreground border border-border/60">
                      <Flame className="w-4 h-4 text-amber-500 shrink-0" />
                      <span><strong>Winter Heating & Special Requests:</strong> {resItem.specialRequests}</span>
                    </div>
                  )}

                  {/* Alternative Proposal Banner if Present */}
                  {isAlt && (
                    <div className="p-3.5 bg-purple-500/10 rounded-2xl text-xs border border-purple-500/30 space-y-1">
                      <div className="flex items-center justify-between font-bold text-purple-600 dark:text-purple-400">
                        <span className="flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4" />
                          Hotel Proposed Alternative:
                        </span>
                        <span>Responded by: {resItem.respondedBy || 'Hotel Reception'}</span>
                      </div>
                      <p className="text-foreground">
                        <strong>Category:</strong> {resItem.alternativeRoomType || 'Requested'} • <strong>Tariff:</strong> ₹{resItem.alternativeTariff?.toLocaleString('en-IN')}/nt • <strong>Dates:</strong> {resItem.alternativeDates || 'Same'}
                      </p>
                      {resItem.alternativeNotes && (
                        <p className="text-muted-foreground italic">"{resItem.alternativeNotes}"</p>
                      )}
                    </div>
                  )}

                  {/* Confirmed CRS Info if Present */}
                  {isConfirmed && resItem.hotelConfirmationNumber && (
                    <div className="p-3 bg-emerald-500/10 rounded-2xl text-xs border border-emerald-500/30 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                        <span className="text-emerald-700 dark:text-emerald-300 font-bold">
                          Hotel Confirmation Ref: <span className="font-mono text-sm">{resItem.hotelConfirmationNumber}</span>
                        </span>
                        <span className="text-muted-foreground">({resItem.confirmedRoomType || resItem.roomType} @ ₹{resItem.confirmedTariff || resItem.contractRate}/nt)</span>
                      </div>
                      {resItem.receptionNotes && (
                        <span className="text-[11px] text-muted-foreground italic truncate max-w-xs">"{resItem.receptionNotes}"</span>
                      )}
                    </div>
                  )}

                  {/* Action Buttons Row */}
                  <div className="pt-2 border-t border-border/50 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {/* Open Reception Desk Modal */}
                      <Button
                        size="sm"
                        onClick={() => initiateResponseModal(resItem)}
                        className="rounded-xl text-xs font-bold gap-1.5 h-9 bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm"
                      >
                        <Building2 className="w-3.5 h-3.5" />
                        <span>{isConfirmed ? 'Update Hotel Confirmation' : 'Open Reception Confirmation Desk'}</span>
                      </Button>

                      {/* View / Print Voucher */}
                      {isConfirmed && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setVoucherPreviewRes(resItem)}
                          className="rounded-xl text-xs font-bold gap-1.5 h-9 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
                        >
                          <Printer className="w-3.5 h-3.5 text-emerald-500" />
                          <span>View Official Voucher</span>
                        </Button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Copy Shareable Link for External Receptionists */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const tokenOrId = resItem.secureToken || resItem.id;
                          const url = `${window.location.origin}/hotel/confirm/${tokenOrId}`;
                          navigator.clipboard.writeText(url);
                          toast.success('Public reception link copied to clipboard!');
                        }}
                        className="text-xs text-muted-foreground hover:text-foreground h-9 gap-1"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Copy Link</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* RECEPTION CONFIRMATION DESK MODAL */}
      <Dialog open={!!selectedRes} onOpenChange={(open) => !open && setSelectedRes(null)}>
        <DialogContent className="max-w-2xl bg-card border-border rounded-3xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
          {selectedRes && (
            <div className="space-y-6">
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-amber-500" />
                    <DialogTitle className="text-xl font-black text-foreground">
                      Reception Desk: {selectedRes.hotel?.name || 'Partner Hotel'}
                    </DialogTitle>
                  </div>
                  <Badge variant="outline" className="font-mono text-xs">
                    Ref: {selectedRes.bookingReference || selectedRes.id.slice(0, 8)}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Guest: <strong>{selectedRes.guestName}</strong> ({selectedRes.roomsCount}x {selectedRes.roomType}, {selectedRes.mealPlan})
                </p>
              </DialogHeader>

              {/* Reusable Response Form */}
              {renderResponseForm(selectedRes, false)}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* OFFICIAL VOUCHER PRINT MODAL */}
      <Dialog open={!!voucherPreviewRes} onOpenChange={(open) => !open && setVoucherPreviewRes(null)}>
        <DialogContent className="max-w-xl bg-card border-border rounded-3xl p-6 sm:p-8">
          {voucherPreviewRes && (
            <div className="space-y-6">
              <div className="text-center border-b border-border pb-4 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">
                  Official Hotel Booking Confirmation Voucher
                </span>
                <h3 className="text-xl font-black text-foreground">Kashmir Curators DMC</h3>
                <p className="text-xs text-muted-foreground">
                  Partner Property: <strong>{voucherPreviewRes.hotel?.name || 'Partner Hotel'}</strong>
                </p>
              </div>

              <div className="p-4 bg-muted/40 rounded-2xl border border-border space-y-3 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-border/60">
                  <span className="text-muted-foreground">Hotel Confirmation / CRS Ref:</span>
                  <strong className="font-mono text-sm text-foreground">{voucherPreviewRes.hotelConfirmationNumber || voucherPreviewRes.bookingReference}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Lead Guest Name:</span>
                  <strong className="text-foreground">{voucherPreviewRes.guestName}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Check-In / Check-Out:</span>
                  <span className="font-semibold text-foreground">
                    {new Date(voucherPreviewRes.checkIn).toLocaleDateString()} to {new Date(voucherPreviewRes.checkOut).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Room Category & Count:</span>
                  <span className="font-bold text-foreground">{voucherPreviewRes.confirmedRoomsCount || voucherPreviewRes.roomsCount}x {voucherPreviewRes.confirmedRoomType || voucherPreviewRes.roomType}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Meal Plan:</span>
                  <span className="font-bold text-amber-500">{voucherPreviewRes.confirmedMealPlan || voucherPreviewRes.mealPlan}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-border/60">
                  <span className="text-muted-foreground font-bold">Confirmed Contract Rate:</span>
                  <span className="font-mono text-sm font-black text-emerald-600 dark:text-emerald-400">
                    ₹{(voucherPreviewRes.confirmedTariff || voucherPreviewRes.contractRate || 0).toLocaleString('en-IN')}/nt
                  </span>
                </div>
              </div>

              {voucherPreviewRes.receptionNotes && (
                <div className="p-3 bg-muted/30 rounded-xl text-xs text-muted-foreground border border-border/50">
                  <strong>Special Instructions:</strong> {voucherPreviewRes.receptionNotes}
                </div>
              )}

              <DialogFooter className="flex justify-between items-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                  className="rounded-xl text-xs font-bold gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Voucher</span>
                </Button>
                <Button
                  size="sm"
                  onClick={() => setVoucherPreviewRes(null)}
                  className="rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950"
                >
                  Done
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HotelReceptionPortal;
