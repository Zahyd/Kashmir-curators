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

const hasBlackoutOverlap = (checkIn: string, checkOut: string, blackoutRules: string[] | undefined) => {
  if (!checkIn || !checkOut || !blackoutRules || blackoutRules.length === 0) return false;
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  
  for (const rule of blackoutRules) {
    if (!rule) continue;
    if (rule.includes('_') || rule.includes('~')) {
      const separator = rule.includes('_') ? '_' : '~';
      const [rStartStr, rEndStr] = rule.split(separator);
      const rStart = new Date(rStartStr.trim());
      const rEnd = new Date(rEndStr.trim());
      if (start < rEnd && end > rStart) {
        return true;
      }
    } else {
      const bDate = new Date(rule.trim());
      if (start <= bDate && end > bDate) {
        return true;
      }
    }
  }
  return false;
};

const getAllotmentStatus = (
  reservations: any[],
  hotelId: string,
  roomTypeName: string,
  checkIn: string,
  checkOut: string,
  requestedRooms: number,
  allotmentLimit: number,
  currentReservationId?: string
) => {
  if (!hotelId || !roomTypeName || !checkIn || !checkOut) return { exceeded: false, bookedCount: 0, remaining: allotmentLimit };
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  
  const overlappingReservations = reservations.filter(res => {
    if (res.hotelId !== hotelId) return false;
    if (res.roomType !== roomTypeName) return false;
    if (res.status === 'Cancelled' || res.status === 'Rejected') return false;
    if (currentReservationId && res.id === currentReservationId) return false;
    
    const rStart = new Date(res.checkIn);
    const rEnd = new Date(res.checkOut);
    return rStart < end && rEnd > start;
  });
  
  const bookedCount = overlappingReservations.reduce((sum, res) => sum + (res.roomsCount || 1), 0);
  const totalWanted = bookedCount + requestedRooms;
  return {
    exceeded: totalWanted > allotmentLimit,
    bookedCount,
    remaining: Math.max(0, allotmentLimit - bookedCount)
  };
};

export default function CMSReservations() {
  const { systemEvents } = useTeamAuth();
  
  // Data lists
  const [reservations, setReservations] = useState<HotelReservation[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  
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
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<HotelReservation | null>(null);
  interface HotelStay {
    hotelId: string;
    hotelSearchQuery: string;
    showSuggestions: boolean;
    checkIn: string;
    checkOut: string;
    roomType: string;
    roomsCount: number;
    mealPlan: string;
    status: string;
    contractRate: number;
    seasonalPricing: number;
    commissionRate: number;
    totalAmount: number;
    holdUntil: string;
  }

  const [hotelStays, setHotelStays] = useState<HotelStay[]>([]);
  const [createdReservations, setCreatedReservations] = useState<any[]>([]);
  const [showShareScreen, setShowShareScreen] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    inquiryId: '',
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    specialRequests: '',
    paymentStatus: 'Unpaid'
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

      // Fetch packages
      const pRes = await fetch(`${API_BASE_URL}/packages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (pRes.ok) {
        const pData = await pRes.json();
        if (Array.isArray(pData)) {
          setPackages(pData);
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
    let totalNights = 0;
    let totalDues = 0;
    let totalProfit = 0;

    hotelStays.forEach(stay => {
      if (!stay.checkIn || !stay.checkOut) return;

      const checkInDate = new Date(stay.checkIn);
      const checkOutDate = new Date(stay.checkOut);
      const diffTime = checkOutDate.getTime() - checkInDate.getTime();
      const nights = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

      const rooms = Number(stay.roomsCount) || 1;
      const cRate = Number(stay.contractRate) || 0;
      const sPrice = Number(stay.seasonalPricing) || 0;
      const commRate = Number(stay.commissionRate) || 0;
      const grossTotal = Number(stay.totalAmount) || 0;

      const netCost = (cRate + sPrice) * rooms * nights;
      let profit = grossTotal - netCost;
      if (commRate > 0) {
        profit = grossTotal * (commRate / 100);
      }

      totalNights += nights;
      totalDues += netCost;
      totalProfit += profit;
    });

    return {
      nights: totalNights || 1,
      dues: Math.round(totalDues),
      profit: Math.round(totalProfit)
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

      // Parse quoteData to generate stays dynamically
      let parsedStays: HotelStay[] = [];
      let quoteDataStr = inquiry.quoteData;

      // Local storage draft recovery: if database is null/empty, check if a draft exists in this browser's local storage
      if (!quoteDataStr) {
        const localDraft = localStorage.getItem(`KC_DRAFT_ITINERARY_${inqId}`);
        if (localDraft) {
          quoteDataStr = localDraft;
          toast.info(`Recovered active itinerary draft for ${inquiry.customerName} from your browser storage.`);
        }
      }

      // Fallback: If no custom quoteData or local draft exists, look up a matching standard package template
      if (!quoteDataStr && packages.length > 0) {
        const matchedPkg = packages.find(p => 
          inquiry.destination.toLowerCase().includes(p.name.toLowerCase()) ||
          p.name.toLowerCase().includes(inquiry.destination.toLowerCase())
        );
        if (matchedPkg && matchedPkg.itinerary) {
          quoteDataStr = matchedPkg.itinerary;
        }
      }

      if (quoteDataStr) {
        try {
          const days = JSON.parse(quoteDataStr);
          if (Array.isArray(days) && days.length > 0) {
            // Find base trip start date (first day with a date, or default to today)
            let baseDate = new Date();
            const firstDatedDay = days.find(d => d.date);
            if (firstDatedDay && firstDatedDay.date) {
              baseDate = new Date(firstDatedDay.date);
            }
            
            // Helper to match hotel name or description text to registered hotel partners
            const detectHotelFromItinerary = (day: any) => {
              if (day.hotelId && day.hotelId.trim() !== '') {
                const h = hotels.find(x => x.id === day.hotelId);
                if (h) return h;
              }

              const textToSearch = [
                day.title || '',
                day.description || '',
                day.hotelName || '',
                ...(Array.isArray(day.activities) ? day.activities : [day.activities || ''])
              ].join(' ').toLowerCase();

              for (const h of hotels) {
                const name = h.name.toLowerCase();
                // 1. Direct substring match
                if (textToSearch.includes(name)) return h;

                // 2. Main unique keywords matching
                const keywords = name
                  .split(/\s+/)
                  .filter(w => !['the', 'hotel', 'resort', 'palace', 'houseboat', 'stay', 'inn', 'villa', 'club', '&', 'and', 'spa', 'luxury', 'premium', 'srinagar', 'gulmarg', 'pahalgam', 'sonamarg'].includes(w) && w.length > 2);
                
                if (keywords.length > 0) {
                  const primaryKeyword = keywords[0];
                  if (textToSearch.includes(primaryKeyword)) {
                    return h;
                  }
                }
              }
              return null;
            };

            // Map days with dates sequentially
            const daysWithDates = days.map((day, idx) => {
              const d = new Date(baseDate);
              d.setDate(baseDate.getDate() + idx);
              const dateStr = d.toISOString().split('T')[0];
              return {
                ...day,
                resolvedDate: day.date || dateStr
              };
            });

            // Group consecutive days at the same hotel with the same room type
            let currentStay: HotelStay | null = null;

            daysWithDates.forEach((day) => {
              const matchedHotel = detectHotelFromItinerary(day);
              
              if (matchedHotel) {
                const nextDayDate = new Date(day.resolvedDate);
                nextDayDate.setDate(nextDayDate.getDate() + 1);
                const nextDayDateStr = nextDayDate.toISOString().split('T')[0];

                let defaultComm = 10;
                if (matchedHotel.commissionStructure) {
                  const parsedComm = parseFloat(matchedHotel.commissionStructure);
                  if (!isNaN(parsedComm)) defaultComm = parsedComm;
                }

                const roomType = day.roomType || matchedHotel.roomTypes?.[0]?.name || 'Deluxe Room';
                const defaultPrice = matchedHotel.roomTypes?.[0]?.price || matchedHotel.pricePerNight || 0;
                const contractRate = day.hotelNetCost || day.hotelPrice || defaultPrice;
                const totalAmount = day.hotelPrice || defaultPrice;

                if (!currentStay) {
                  // Initialize first stay
                  currentStay = {
                    hotelId: matchedHotel.id,
                    hotelSearchQuery: matchedHotel.name,
                    showSuggestions: false,
                    checkIn: day.resolvedDate,
                    checkOut: nextDayDateStr,
                    roomType,
                    roomsCount: 1,
                    mealPlan: day.mealPlan || 'CP',
                    status: 'Pending',
                    contractRate,
                    seasonalPricing: 0,
                    commissionRate: defaultComm,
                    totalAmount,
                    holdUntil: ''
                  };
                } else if (currentStay.hotelId === matchedHotel.id && currentStay.roomType === roomType) {
                  // Merge consecutive stay at the same hotel with the same room type
                  currentStay.checkOut = nextDayDateStr;
                  currentStay.totalAmount += totalAmount;
                } else {
                  // Complete previous stay and start a new one
                  parsedStays.push(currentStay);
                  currentStay = {
                    hotelId: matchedHotel.id,
                    hotelSearchQuery: matchedHotel.name,
                    showSuggestions: false,
                    checkIn: day.resolvedDate,
                    checkOut: nextDayDateStr,
                    roomType,
                    roomsCount: 1,
                    mealPlan: day.mealPlan || 'CP',
                    status: 'Pending',
                    contractRate,
                    seasonalPricing: 0,
                    commissionRate: defaultComm,
                    totalAmount,
                    holdUntil: ''
                  };
                }
              }
            });

            if (currentStay) {
              parsedStays.push(currentStay);
            }
          }
        } catch (e) {
          console.error("Error parsing quoteData to generate stays:", e);
        }
      }

      if (parsedStays.length > 0) {
        setHotelStays(parsedStays);
      } else {
        // Fallback to default single stay
        if (hotels.length > 0) {
          const hotel = hotels[0];
          let defaultComm = 10;
          if (hotel.commissionStructure) {
            const parsedComm = parseFloat(hotel.commissionStructure);
            if (!isNaN(parsedComm)) defaultComm = parsedComm;
          }
          
          // Calculate default nights based on inquiry duration (e.g. "5 Days" -> 4 nights)
          const durationDays = parseInt(inquiry.duration) || 2;
          const nights = durationDays > 1 ? durationDays - 1 : 1;
          const checkoutMs = Date.now() + nights * 24 * 60 * 60 * 1000;
          
          const defaultPrice = hotel.roomTypes?.[0]?.price || hotel.pricePerNight || 0;
          setHotelStays([
            {
              hotelId: hotel.id,
              hotelSearchQuery: hotel.name,
              showSuggestions: false,
              checkIn: new Date().toISOString().split('T')[0],
              checkOut: new Date(checkoutMs).toISOString().split('T')[0],
              roomType: hotel.roomTypes?.[0]?.name || '',
              roomsCount: 1,
              mealPlan: 'CP',
              status: 'Pending',
              contractRate: defaultPrice,
              seasonalPricing: 0,
              commissionRate: defaultComm,
              totalAmount: Math.round(defaultPrice * nights * 1.25),
              holdUntil: ''
            }
          ]);
        }
      }
    } else {
      setFormData(prev => ({
        ...prev,
        inquiryId: ''
      }));
    }
  };

  const handleHotelChange = (hId: string, index: number) => {
    const hotel = hotels.find(h => h.id === hId);
    if (hotel) {
      let defaultComm = 10;
      if (hotel.commissionStructure) {
        const parsedComm = parseFloat(hotel.commissionStructure);
        if (!isNaN(parsedComm)) defaultComm = parsedComm;
      }
      
      const defaultRoomType = hotel.roomTypes?.[0]?.name || '';
      const defaultPrice = hotel.roomTypes?.[0]?.price || hotel.pricePerNight || 0;

      setHotelStays(prev => prev.map((stay, idx) => idx === index ? {
        ...stay,
        hotelId: hId,
        hotelSearchQuery: hotel.name,
        roomType: defaultRoomType,
        contractRate: defaultPrice,
        commissionRate: defaultComm,
        totalAmount: Math.round(defaultPrice * stay.roomsCount * 1.25)
      } : stay));
    }
  };

  const openCreateDialog = () => {
    setActiveReservation(null);
    setCreatedReservations([]);
    setShowShareScreen(false);
    
    setFormData({
      inquiryId: '',
      guestName: '',
      guestEmail: '',
      guestPhone: '',
      specialRequests: '',
      paymentStatus: 'Unpaid'
    });
    
    if (hotels.length > 0) {
      const hotel = hotels[0];
      let defaultComm = 10;
      if (hotel.commissionStructure) {
        const parsedComm = parseFloat(hotel.commissionStructure);
        if (!isNaN(parsedComm)) defaultComm = parsedComm;
      }
      
      const defaultPrice = hotel.roomTypes?.[0]?.price || hotel.pricePerNight || 0;
      setHotelStays([
        {
          hotelId: hotel.id,
          hotelSearchQuery: hotel.name,
          showSuggestions: false,
          checkIn: new Date().toISOString().split('T')[0],
          checkOut: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          roomType: hotel.roomTypes?.[0]?.name || '',
          roomsCount: 1,
          mealPlan: 'CP',
          status: 'Pending',
          contractRate: defaultPrice,
          seasonalPricing: 0,
          commissionRate: defaultComm,
          totalAmount: Math.round(defaultPrice * 1.25),
          holdUntil: ''
        }
      ]);
    } else {
      setHotelStays([
        {
          hotelId: '',
          hotelSearchQuery: '',
          showSuggestions: false,
          checkIn: new Date().toISOString().split('T')[0],
          checkOut: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          roomType: '',
          roomsCount: 1,
          mealPlan: 'CP',
          status: 'Pending',
          contractRate: 0,
          seasonalPricing: 0,
          commissionRate: 10,
          totalAmount: 0,
          holdUntil: ''
        }
      ]);
    }

    setFormOpen(true);
  };

  const openEditDialog = (resItem: HotelReservation) => {
    setActiveReservation(resItem);
    setCreatedReservations([]);
    setShowShareScreen(false);
    const hotel = hotels.find(h => h.id === resItem.hotelId);
    
    setFormData({
      inquiryId: resItem.inquiryId || '',
      guestName: resItem.guestName,
      guestEmail: resItem.guestEmail || '',
      guestPhone: resItem.guestPhone || '',
      specialRequests: resItem.specialRequests || '',
      paymentStatus: resItem.paymentStatus
    });
    
    setHotelStays([
      {
        hotelId: resItem.hotelId,
        hotelSearchQuery: hotel ? hotel.name : '',
        showSuggestions: false,
        checkIn: new Date(resItem.checkIn).toISOString().split('T')[0],
        checkOut: new Date(resItem.checkOut).toISOString().split('T')[0],
        roomType: resItem.roomType,
        roomsCount: resItem.roomsCount,
        mealPlan: resItem.mealPlan,
        status: resItem.status,
        contractRate: resItem.contractRate,
        seasonalPricing: Number(resItem.seasonalPricing) || 0,
        commissionRate: resItem.commissionRate,
        totalAmount: resItem.totalAmount,
        holdUntil: resItem.holdUntil ? new Date(resItem.holdUntil).toISOString().substring(0, 16) : ''
      }
    ]);
    
    setFormOpen(true);
  };

  const handleSaveReservation = async () => {
    if (!formData.guestName) {
      toast.error('Required field: Guest Name.');
      return;
    }
    
    const isInvalid = hotelStays.some(stay => !stay.hotelId || !stay.checkIn || !stay.checkOut || !stay.roomType);
    if (isInvalid) {
      toast.error('Required fields for each stay: Hotel, Room Type, and Check-In/Out dates.');
      return;
    }
    
    // Validate allotments and blackout dates
    for (let i = 0; i < hotelStays.length; i++) {
      const stay = hotelStays[i];
      const hotel = hotels.find(h => h.id === stay.hotelId);
      const roomTypeObj = hotel?.roomTypes?.find((r: any) => r.name === stay.roomType);
      if (roomTypeObj) {
        const isBlackedOut = hasBlackoutOverlap(stay.checkIn, stay.checkOut, roomTypeObj.blackoutDates);
        if (isBlackedOut) {
          toast.error(`Stay #${i + 1}: Selected dates fall into a blackout period for ${stay.roomType}.`);
          return;
        }
        
        const allotmentLimit = roomTypeObj.allotment !== undefined ? roomTypeObj.allotment : 5;
        const allotmentInfo = getAllotmentStatus(
          reservations,
          stay.hotelId,
          stay.roomType,
          stay.checkIn,
          stay.checkOut,
          stay.roomsCount,
          allotmentLimit,
          activeReservation?.id
        );
        if (allotmentInfo.exceeded) {
          toast.error(`Stay #${i + 1}: Allotment limit exceeded for ${stay.roomType}. Max available: ${allotmentInfo.remaining} rooms.`);
          return;
        }
      }
    }

    setSaving(true);
    const token = localStorage.getItem('teamToken');

    try {
      if (activeReservation) {
        // Edit mode (PATCH single reservation)
        const stay = hotelStays[0];
        const payload = {
          inquiryId: formData.inquiryId || null,
          guestName: formData.guestName,
          guestEmail: formData.guestEmail || null,
          guestPhone: formData.guestPhone || null,
          specialRequests: formData.specialRequests || null,
          paymentStatus: formData.paymentStatus,
          
          hotelId: stay.hotelId,
          checkIn: new Date(stay.checkIn).toISOString(),
          checkOut: new Date(stay.checkOut).toISOString(),
          roomType: stay.roomType,
          roomsCount: Number(stay.roomsCount),
          mealPlan: stay.mealPlan,
          status: stay.status,
          contractRate: Number(stay.contractRate),
          seasonalPricing: Number(stay.seasonalPricing),
          commissionRate: Number(stay.commissionRate),
          totalAmount: Number(stay.totalAmount),
          holdUntil: stay.holdUntil ? new Date(stay.holdUntil).toISOString() : null
        };
        
        const response = await fetch(`${API_BASE_URL}/reservations/${activeReservation.id}`, {
          method: 'PATCH',
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

        toast.success('Reservation updated successfully');
        setFormOpen(false);
        fetchReservations();
      } else {
        // Create mode (POST one or more reservations)
        const createdList: any[] = [];
        
        for (const stay of hotelStays) {
          const payload = {
            inquiryId: formData.inquiryId || null,
            guestName: formData.guestName,
            guestEmail: formData.guestEmail || null,
            guestPhone: formData.guestPhone || null,
            specialRequests: formData.specialRequests || null,
            paymentStatus: formData.paymentStatus,
            
            hotelId: stay.hotelId,
            checkIn: new Date(stay.checkIn).toISOString(),
            checkOut: new Date(stay.checkOut).toISOString(),
            roomType: stay.roomType,
            roomsCount: Number(stay.roomsCount),
            mealPlan: stay.mealPlan,
            status: stay.status,
            contractRate: Number(stay.contractRate),
            seasonalPricing: Number(stay.seasonalPricing),
            commissionRate: Number(stay.commissionRate),
            totalAmount: Number(stay.totalAmount),
            holdUntil: stay.holdUntil ? new Date(stay.holdUntil).toISOString() : null
          };
          
          const response = await fetch(`${API_BASE_URL}/reservations`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create reservation');
          }
          
          const resObj = await response.json();
          createdList.push(resObj);
        }
        
        toast.success(`Initialized ${createdList.length} B2B reservation(s) successfully`);
        setCreatedReservations(createdList);
        setShowShareScreen(true);
        fetchReservations();
      }
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

  const openDeleteDialog = (resItem: HotelReservation) => {
    setItemToDelete(resItem);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteReservation = async () => {
    if (!itemToDelete) return;
    const token = localStorage.getItem('teamToken');

    try {
      const response = await fetch(`${API_BASE_URL}/reservations/${itemToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete reservation');
      toast.success('Reservation deleted successfully');
      setDeleteConfirmOpen(false);
      fetchReservations();
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete reservation');
    }
  };

  const createCustomHotel = async (name: string, index: number) => {
    try {
      const token = localStorage.getItem('teamToken');
      const response = await fetch(`${API_BASE_URL}/hotels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          location: 'Kashmir',
          starRating: 4,
          pricePerNight: 5000,
          description: 'Custom B2B partner hotel registered in real-time.',
          roomTypes: [{ id: 'room-0', name: 'Deluxe Room', price: 5000 }]
        })
      });
      
      if (!response.ok) throw new Error('Failed to create hotel partner');
      const newHotel = await response.json();
      
      toast.success(`Hotel "${name}" successfully registered in database!`);
      
      // Update hotels list state locally so it's instantly available
      const parsedNewHotel = {
        ...newHotel,
        roomTypes: [{ id: 'room-0', name: 'Deluxe Room', price: 5000 }]
      };
      setHotels(prev => [parsedNewHotel, ...prev]);
      
      // Set the selection for the correct stay index
      setHotelStays(prev => prev.map((stay, idx) => idx === index ? {
        ...stay,
        hotelId: newHotel.id,
        hotelSearchQuery: name,
        roomType: 'Deluxe Room',
        contractRate: 5000,
        commissionRate: 10,
        totalAmount: 6250
      } : stay));
    } catch (err: any) {
      toast.error(err.message || 'Failed to register new hotel');
    }
  };

  const updateStay = (index: number, fields: Partial<HotelStay>) => {
    setHotelStays(prev => prev.map((stay, idx) => {
      if (idx !== index) return stay;
      
      const updated = { ...stay, ...fields };
      const hotel = hotels.find(h => h.id === updated.hotelId);
      
      // Auto recalculate contract rate and seasonal pricing when dates, roomType, or hotelId changes
      if (hotel && updated.roomType && updated.checkIn) {
        // Find room type
        const roomType = hotel.roomTypes?.find((r: any) => r.name === updated.roomType);
        const basePrice = roomType ? roomType.price : hotel.pricePerNight || 0;
        let seasonalPrice = 0;
        
        // Parse seasonalPricing rules from hotel
        if (hotel.seasonalPricing) {
          try {
            const rules = typeof hotel.seasonalPricing === 'string'
              ? JSON.parse(hotel.seasonalPricing)
              : hotel.seasonalPricing;
            if (Array.isArray(rules)) {
              const checkDate = new Date(updated.checkIn);
              const mmdd = `${(checkDate.getMonth() + 1).toString().padStart(2, '0')}-${checkDate.getDate().toString().padStart(2, '0')}`;
              for (const rule of rules) {
                if (rule.start && rule.end && rule.markup) {
                  if (mmdd >= rule.start && mmdd <= rule.end) {
                    const markup = parseFloat(rule.markup) || 1.0;
                    seasonalPrice = Math.round(basePrice * (markup - 1.0));
                    break;
                  }
                }
              }
            }
          } catch (e) {
            console.error('Failed parsing seasonal pricing:', e);
          }
        }
        
        // Only update pricing if the field wasn't explicitly overridden in the input
        if (fields.contractRate === undefined) {
          updated.contractRate = basePrice;
        }
        if (fields.seasonalPricing === undefined) {
          updated.seasonalPricing = seasonalPrice;
        }
        
        // Recalculate gross total amount if totalAmount wasn't explicitly changed
        if (fields.totalAmount === undefined) {
          const checkInDate = new Date(updated.checkIn);
          const checkOutDate = new Date(updated.checkOut);
          const nights = Math.max(1, Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))) || 1;
          const subtotal = (updated.contractRate + updated.seasonalPricing) * updated.roomsCount * nights;
          updated.totalAmount = Math.round(subtotal * 1.25);
        }
      }
      
      return updated;
    }));
  };

  const addStay = () => {
    const defaultHotel = hotels[0];
    let defaultComm = 10;
    if (defaultHotel?.commissionStructure) {
      const parsedComm = parseFloat(defaultHotel.commissionStructure);
      if (!isNaN(parsedComm)) defaultComm = parsedComm;
    }
    const defaultPrice = defaultHotel?.roomTypes?.[0]?.price || defaultHotel?.pricePerNight || 0;
    
    setHotelStays(prev => [
      ...prev,
      {
        hotelId: defaultHotel?.id || '',
        hotelSearchQuery: defaultHotel?.name || '',
        showSuggestions: false,
        checkIn: new Date().toISOString().split('T')[0],
        checkOut: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        roomType: defaultHotel?.roomTypes?.[0]?.name || '',
        roomsCount: 1,
        mealPlan: 'CP',
        status: 'Pending',
        contractRate: defaultPrice,
        seasonalPricing: 0,
        commissionRate: defaultComm,
        totalAmount: Math.round(defaultPrice * 1.25),
        holdUntil: ''
      }
    ]);
  };

  const removeStay = (index: number) => {
    if (hotelStays.length > 1) {
      setHotelStays(prev => prev.filter((_, idx) => idx !== index));
    }
  };

  const formatWhatsAppMessage = (res: any, hotelName: string) => {
    const checkInStr = new Date(res.checkIn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const checkOutStr = new Date(res.checkOut).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const publicLink = `${window.location.origin}/hotel/confirm/${res.id}`;
    
    return `*KASHMIR CURATORS - B2B RESERVATION REQUEST*

Dear Reservations Team at *${hotelName}*,

We would like to request confirmation for the following B2B stay:
• *Guest Name*: ${res.guestName}
• *Check-in*: ${checkInStr}
• *Check-out*: ${checkOutStr}
• *Room Type*: ${res.roomType}
• *Rooms Count*: ${res.roomsCount}
• *Meal Plan*: ${res.mealPlan}
${res.specialRequests ? `• *Special Requests*: ${res.specialRequests}\n` : ''}
Please click the secure link below to confirm or decline this booking instantly:
${publicLink}

Thank you,
Operations Desk
Kashmir Curators`;
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

  const handleExportServiceVoucherPDF = (resItem: HotelReservation) => {
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
    doc.text('LUXURY TRAVELS & BESPOKE CURATIONS', 20, 28);
    
    // Voucher Code / Status
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(212, 175, 55);
    const refCode = resItem.bookingReference ? `VOUCHER: ${resItem.bookingReference}` : `STATUS: ${resItem.status.toUpperCase()}`;
    doc.text(refCode, 190, 20, { align: 'right' });
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text(`Issued: ${new Date().toLocaleDateString()}`, 190, 28, { align: 'right' });

    // Section 1: Service Details
    doc.setTextColor(darkText);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('HOTEL SERVICE VOUCHER', 20, 60);
    
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
    const hotelName = resItem.hotel?.name || 'Hotel';
    const hotelLocation = resItem.hotel?.location || 'Kashmir';
    doc.text(hotelName, 145, 75);
    doc.text(hotelLocation, 145, 83);
    doc.text(resItem.roomType, 145, 91);
    doc.text(`${resItem.roomsCount} Room(s)`, 145, 99);
    doc.text(resItem.mealPlan, 145, 107);

    // Section 2: Special Instructions
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('SPECIAL INSTRUCTIONS & REQUESTS', 20, 122);
    doc.line(20, 125, 190, 125);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(darkText);
    const splitRequests = doc.splitTextToSize(resItem.specialRequests || 'No special requests submitted.', 170);
    doc.text(splitRequests, 20, 133);

    // Section 3: Terms & Info
    const termsY = 160;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(darkText);
    doc.text('IMPORTANT CONDITIONS FOR CHECK-IN', 20, termsY);
    doc.line(20, termsY + 3, 190, termsY + 3);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(lightText);
    const terms = [
      '1. This is a digital service voucher. Please present this voucher along with a valid photo ID upon arrival.',
      '2. Standard check-in time is 14:00 hrs and check-out time is 11:00 hrs. Early check-in/late check-out is subject to availability.',
      '3. Room allocation is at the sole discretion of the hotel management.',
      '4. Personal expenses such as telephone calls, laundry, room service, and mini-bar are not included and must be paid directly.',
      '5. For any urgent operational assistance, please contact Kashmir Curators Concierge desk or your dedicated agent.'
    ];
    terms.forEach((term, idx) => {
      doc.text(term, 20, termsY + 10 + (idx * 6));
    });

    // Signature Area
    const sigY = 210;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(darkText);
    doc.text('Authorized Signatory', 190, sigY, { align: 'right' });
    doc.text('Kashmir Curators Operations Desk', 190, sigY + 5, { align: 'right' });
    
    doc.setDrawColor(200, 200, 200);
    doc.line(140, sigY - 2, 190, sigY - 2);

    doc.save(`Kashmir-Curators-Service-Voucher-${resItem.guestName.replace(/\s+/g, '-')}.pdf`);
    toast.success('Service voucher generated as PDF!', {
      description: 'Downloaded client/hotel ready voucher with hidden financial rates.'
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
                              onClick={async () => {
                                const hotel = hotels.find(h => h.id === item.hotelId);
                                const message = formatWhatsAppMessage(item, hotel?.name || 'Hotel');
                                await handleSimulateQuoteSend(item.id, 'whatsapp');
                                const whatsappUrl = `https://api.whatsapp.com/send?phone=${hotel?.contactPhone || ''}&text=${encodeURIComponent(message)}`;
                                window.open(whatsappUrl, '_blank');
                              }}
                              disabled={sendingChannel !== null}
                              size="icon"
                              variant="outline"
                              className="w-9 h-9 rounded-xl border-white/5 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white"
                              title="Send WhatsApp Quote"
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
                          title="Download B2B PDF Confirmation Slip (Internal)"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleExportServiceVoucherPDF(item)}
                          size="icon"
                          variant="outline"
                          className="w-9 h-9 rounded-xl border-white/5 bg-white/5 hover:bg-white/10 text-emerald-400"
                          title="Download Client/Hotel Service Voucher (No B2B pricing)"
                        >
                          <FileText className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => openDeleteDialog(item)}
                          size="icon"
                          variant="outline"
                          className="w-9 h-9 rounded-xl border-white/5 bg-white/5 hover:bg-red-500/10 text-red-400"
                          title="Delete Reservation"
                        >
                          <Trash2 className="w-4 h-4" />
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

          {showShareScreen ? (
            <div className="space-y-6 py-6 text-center">
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-2xl font-display font-black text-white">Booking Request Created Successfully!</h3>
              <p className="text-white/50 text-sm max-w-lg mx-auto leading-relaxed">
                We have created the reservations in the Kashmir Curators database. You can now share confirmation vouchers or booking links directly with the respective hotel reservation desks.
              </p>

              <div className="space-y-4 max-h-[40vh] overflow-y-auto custom-scrollbar pr-2 mt-8">
                {createdReservations.map((res: any, idx: number) => {
                  const hotel = hotels.find(h => h.id === res.hotelId);
                  const hotelName = hotel ? hotel.name : res.hotel?.name || 'Hotel Stay';
                  const contactPhone = hotel ? hotel.contactPhone : '';
                  const checkInStr = new Date(res.checkIn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                  const checkOutStr = new Date(res.checkOut).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

                  return (
                    <div key={res.id || idx} className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left">
                      <div>
                        <h4 className="font-bold text-white text-base">{hotelName}</h4>
                        <p className="text-xs text-kashmir-gold/60 mt-1 uppercase font-bold">
                          {res.roomType} • {res.roomsCount} Room(s) • {res.mealPlan}
                        </p>
                        <p className="text-xs text-white/40 mt-1 font-medium">
                          {checkInStr} → {checkOutStr} • Guest: {res.guestName}
                        </p>
                      </div>
                      <div className="flex gap-2 w-full md:w-auto">
                        <Button
                          onClick={async () => {
                            const message = formatWhatsAppMessage(res, hotelName);
                            await handleSimulateQuoteSend(res.id, 'whatsapp');
                            const whatsappUrl = `https://api.whatsapp.com/send?phone=${contactPhone || ''}&text=${encodeURIComponent(message)}`;
                            window.open(whatsappUrl, '_blank');
                          }}
                          className="flex-1 md:flex-none rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-bold uppercase tracking-wider text-[10px] h-10 px-4 flex items-center justify-center gap-2 border-none"
                        >
                          <MessageSquare className="w-4 h-4" /> Share WhatsApp
                        </Button>
                        <Button
                          onClick={() => handleSimulateQuoteSend(res.id, 'email')}
                          className="flex-1 md:flex-none rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold uppercase tracking-wider text-[10px] h-10 px-4 flex items-center justify-center gap-2 border-none"
                        >
                          <Mail className="w-4 h-4" /> Send Email
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-8 border-t border-white/5 mt-8 flex justify-end">
                <Button
                  onClick={() => {
                    setFormOpen(false);
                    setShowShareScreen(false);
                  }}
                  className="rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 font-bold uppercase tracking-wider text-xs px-6 h-12"
                >
                  Done & Close
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
                {/* Left Column: Basic Details */}
                <div className="space-y-6">
                  <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-kashmir-gold/60 mb-2">Guest & Lead parameters</h3>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Link Trip Inquiry (Optional)</label>
                      <Select 
                        value={formData.inquiryId || "none"} 
                        onValueChange={(val) => handleInquiryChange(val === "none" ? "" : val)}
                      >
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
                </div>

                {/* Right Column: Financial Breakdown & Timeline */}
                <div className="space-y-6">
                  <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-400 mb-2">Consolidated Calculations</h3>

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

              {/* Repeating Stays List */}
              <div className="mt-8 space-y-8 border-t border-white/5 pt-8">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
                    <Building className="w-5 h-5 text-kashmir-gold" />
                    Configure Hotel Stay(s)
                  </h3>
                  {!activeReservation && (
                    <Button 
                      type="button"
                      onClick={addStay}
                      className="bg-white/5 hover:bg-white/10 text-kashmir-gold border border-white/10 rounded-xl h-10 px-4 text-xs font-bold"
                    >
                      <Plus className="w-4 h-4 mr-2" /> Add Another Hotel Stay
                    </Button>
                  )}
                </div>

                {hotelStays.map((stay, index) => {
                  const selectedHotel = hotels.find(h => h.id === stay.hotelId);
                  const roomTypes = selectedHotel?.roomTypes || [];

                  return (
                    <Card key={index} className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl space-y-6 relative">
                      <div className="flex justify-between items-center pb-4 border-b border-white/5">
                        <span className="text-xs font-black uppercase tracking-[0.2em] text-kashmir-gold">
                          Stay #{index + 1} details
                        </span>
                        {hotelStays.length > 1 && !activeReservation && (
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => removeStay(index)}
                            className="text-red-400 hover:text-red-300 h-8 px-2 flex items-center gap-1.5"
                          >
                            <Trash2 className="w-4 h-4" /> Remove Stay
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left: Hotel & Room Particulars */}
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Select Hotel Partner</label>
                            <div className="relative">
                              <Input 
                                value={stay.hotelSearchQuery}
                                onChange={(e) => {
                                  updateStay(index, { hotelSearchQuery: e.target.value, showSuggestions: true });
                                }}
                                onFocus={() => updateStay(index, { showSuggestions: true })}
                                placeholder="Search or type hotel name..."
                                className="bg-[#0a0f12]/80 border-white/10 rounded-xl h-11 text-white pr-10 focus:border-kashmir-gold/30"
                              />
                              <Building className="w-4 h-4 text-white/20 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                              
                              {stay.showSuggestions && (
                                <>
                                  <div 
                                    className="fixed inset-0 z-40" 
                                    onClick={() => updateStay(index, { showSuggestions: false })} 
                                  />
                                  <Card className="absolute left-0 right-0 mt-2 z-50 bg-[#0a0f12]/95 border border-white/10 rounded-2xl shadow-2xl max-h-60 overflow-y-auto custom-scrollbar backdrop-blur-xl">
                                    <div className="p-2 space-y-1">
                                      {hotels
                                        .filter(h => h.name.toLowerCase().includes(stay.hotelSearchQuery.toLowerCase()))
                                        .map((h) => (
                                          <button
                                            key={h.id}
                                            type="button"
                                            onClick={() => {
                                              handleHotelChange(h.id, index);
                                              updateStay(index, { showSuggestions: false });
                                            }}
                                            className={cn(
                                              "w-full text-left px-4 py-2.5 text-xs rounded-xl transition-colors flex justify-between items-center",
                                              stay.hotelId === h.id 
                                                ? "bg-kashmir-gold/10 text-kashmir-gold font-bold" 
                                                : "text-white/80 hover:bg-white/5"
                                            )}
                                          >
                                            <span>{h.name}</span>
                                            <span className="text-[10px] text-white/30">{h.location}</span>
                                          </button>
                                        ))}
                                      
                                      {stay.hotelSearchQuery.trim() !== '' && !hotels.some(h => h.name.toLowerCase() === stay.hotelSearchQuery.trim().toLowerCase()) && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            createCustomHotel(stay.hotelSearchQuery.trim(), index);
                                            updateStay(index, { showSuggestions: false });
                                          }}
                                          className="w-full text-left px-4 py-2.5 text-xs rounded-xl text-kashmir-gold hover:bg-kashmir-gold/10 transition-colors font-bold flex items-center gap-2 border border-dashed border-kashmir-gold/20"
                                        >
                                          <Plus className="w-4 h-4" /> Create new hotel partner "{stay.hotelSearchQuery.trim()}"
                                        </button>
                                      )}
                                    </div>
                                  </Card>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Check-in Date</label>
                              <Input 
                                type="date"
                                value={stay.checkIn}
                                onChange={(e) => updateStay(index, { checkIn: e.target.value })}
                                className="bg-[#0a0f12]/80 border-white/10 rounded-xl h-11 text-white"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Check-out Date</label>
                              <Input 
                                type="date"
                                value={stay.checkOut}
                                onChange={(e) => updateStay(index, { checkOut: e.target.value })}
                                className="bg-[#0a0f12]/80 border-white/10 rounded-xl h-11 text-white"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Room Type</label>
                              {roomTypes.length > 0 ? (
                                <Select 
                                  value={stay.roomType} 
                                  onValueChange={(val) => {
                                    const rType = roomTypes.find((r: any) => r.name === val);
                                    updateStay(index, {
                                      roomType: val,
                                      contractRate: rType ? rType.price : stay.contractRate,
                                      totalAmount: rType ? Math.round(rType.price * stay.roomsCount * 1.25) : stay.totalAmount
                                    });
                                  }}
                                >
                                  <SelectTrigger className="bg-[#0a0f12]/80 border-white/10 rounded-xl h-11 text-white text-xs">
                                    <SelectValue placeholder="Select Room Type" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-[#0a0f12]/95 border-white/10 text-white rounded-xl">
                                    {roomTypes.map((r: any) => (
                                      <SelectItem key={r.id || r.name} value={r.name}>{r.name} (₹{r.price.toLocaleString()})</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : (
                                <Input 
                                  value={stay.roomType}
                                  onChange={(e) => updateStay(index, { roomType: e.target.value })}
                                  placeholder="Luxury Room"
                                  className="bg-[#0a0f12]/80 border-white/10 rounded-xl h-11 text-white"
                                />
                              )}
                            </div>

                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Meal Plan</label>
                              <Select value={stay.mealPlan} onValueChange={(val) => updateStay(index, { mealPlan: val })}>
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
                                value={stay.roomsCount}
                                onChange={(e) => {
                                  const count = parseInt(e.target.value) || 1;
                                  updateStay(index, {
                                    roomsCount: count,
                                    totalAmount: Math.round(stay.contractRate * count * 1.25)
                                  });
                                }}
                                className="bg-[#0a0f12]/80 border-white/10 rounded-xl h-11 text-white"
                              />
                            </div>

                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Stay Status</label>
                              <Select value={stay.status} onValueChange={(val) => updateStay(index, { status: val })}>
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

                          {stay.status === 'Hold' && (
                            <div className="space-y-2 animate-in fade-in duration-300">
                              <label className="text-[10px] font-black uppercase tracking-widest text-amber-400 ml-1">Hold Until Timer</label>
                              <Input 
                                type="datetime-local"
                                value={stay.holdUntil}
                                onChange={(e) => updateStay(index, { holdUntil: e.target.value })}
                                className="bg-[#0a0f12]/80 border-amber-500/20 focus:border-amber-400 rounded-xl h-11 text-amber-300"
                              />
                            </div>
                          )}
                        </div>

                        {/* Right: Stay Financial Parameters */}
                        <div className="space-y-4">
                          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">Stay Financial parameters</h4>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Contract rate / night</label>
                              <div className="relative">
                                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 text-xs font-bold">₹</div>
                                <Input 
                                  type="number"
                                  value={stay.contractRate === 0 ? '' : stay.contractRate}
                                  onChange={(e) => updateStay(index, { contractRate: parseFloat(e.target.value) || 0 })}
                                  className="bg-[#0a0f12]/80 border-white/10 rounded-xl h-11 text-white pl-8"
                                />
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Seasonal markup</label>
                              <div className="relative">
                                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 text-xs font-bold">₹</div>
                                <Input 
                                  type="number"
                                  value={stay.seasonalPricing === 0 ? '' : stay.seasonalPricing}
                                  onChange={(e) => updateStay(index, { seasonalPricing: parseFloat(e.target.value) || 0 })}
                                  className="bg-[#0a0f12]/80 border-white/10 rounded-xl h-11 text-white pl-8"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Gross Total Amount</label>
                              <div className="relative">
                                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 text-xs font-bold">₹</div>
                                <Input 
                                  type="number"
                                  value={stay.totalAmount === 0 ? '' : stay.totalAmount}
                                  onChange={(e) => updateStay(index, { totalAmount: parseFloat(e.target.value) || 0 })}
                                  className="bg-[#0a0f12]/80 border-white/10 rounded-xl h-11 text-white pl-8 font-bold"
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Commission rate (%)</label>
                              <div className="relative">
                                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 text-xs font-bold">%</div>
                                <Input 
                                  type="number"
                                  value={stay.commissionRate === 0 ? '' : stay.commissionRate}
                                  onChange={(e) => updateStay(index, { commissionRate: parseFloat(e.target.value) || 0 })}
                                  className="bg-[#0a0f12]/80 border-white/10 rounded-xl h-11 text-white pr-8"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Warnings Section */}
                        {(() => {
                          const roomTypeObj = roomTypes.find((r: any) => r.name === stay.roomType);
                          if (!roomTypeObj) return null;
                          const isBlackedOut = hasBlackoutOverlap(stay.checkIn, stay.checkOut, roomTypeObj.blackoutDates);
                          const allotmentLimit = roomTypeObj.allotment !== undefined ? roomTypeObj.allotment : 5;
                          const allotmentInfo = getAllotmentStatus(
                            reservations,
                            stay.hotelId,
                            stay.roomType,
                            stay.checkIn,
                            stay.checkOut,
                            stay.roomsCount,
                            allotmentLimit,
                            activeReservation?.id
                          );
                          
                          if (!isBlackedOut && !allotmentInfo.exceeded) return null;
                          
                          return (
                            <div className="col-span-full mt-4 p-4 rounded-2xl bg-red-950/20 border border-red-500/20 text-red-200 text-xs space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                              {isBlackedOut && (
                                <div className="flex items-start gap-2">
                                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                                  <div>
                                    <p className="font-bold text-red-400">Blackout Period Conflict</p>
                                    <p className="text-red-300/80">The selected stay dates overlap with the hotel's registered blackout dates for this room category.</p>
                                  </div>
                                </div>
                              )}
                              {allotmentInfo.exceeded && (
                                <div className="flex items-start gap-2">
                                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                                  <div>
                                    <p className="font-bold text-amber-400">Allotment Cap Exceeded</p>
                                    <p className="text-red-300/80">Requested {stay.roomsCount} rooms, but only {allotmentInfo.remaining} rooms are available (Allotment limit: {allotmentLimit}, already booked: {allotmentInfo.bookedCount}).</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </Card>
                  );
                })}
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
                {activeReservation && (
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setFormOpen(false);
                      openDeleteDialog(activeReservation);
                    }}
                    className="bg-red-500/20 hover:bg-red-500 border border-red-500/30 text-red-400 hover:text-black font-bold uppercase tracking-widest px-6 h-12 rounded-xl transition-all mr-auto"
                  >
                    Delete
                  </Button>
                )}
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
            </>
          )}
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

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-md bg-[#0a0f12]/95 border-white/10 text-white rounded-3xl p-8 backdrop-blur-3xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-bold flex items-center gap-3 text-red-400">
              <Trash2 className="w-5 h-5 text-red-400" />
              Decommission Reservation
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <p className="text-xs text-white/60 leading-relaxed">
              Are you sure you want to delete the B2B hotel reservation for <span className="text-white font-bold">{itemToDelete?.guestName}</span> at <span className="text-white font-bold">{itemToDelete?.hotel?.name}</span>? This action is permanent and cannot be undone.
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setDeleteConfirmOpen(false)} className="rounded-xl border border-white/5 text-white/40 hover:text-white hover:bg-white/5">
              Cancel
            </Button>
            <Button 
              onClick={handleDeleteReservation}
              className="bg-red-500 hover:bg-red-600 text-white font-bold uppercase tracking-widest px-5 h-11 rounded-xl"
            >
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
