import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Car, MapPin, Calendar, Clock, Users, Plane, MapIcon, Navigation, 
  Loader2, CheckCircle, CheckCircle2, Shield, AlertCircle, ArrowRight, Smartphone, Sparkles, Send, IndianRupee, Sliders,
  MessageSquare, Star, User, Phone, Check, ShieldCheck, Map
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import FloatingActions from '@/components/layout/FloatingActions';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as UICalendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useCabs } from '@/hooks/useCMSData';
import { useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { API_BASE_URL, SOCKET_URL, DEFAULT_SOCKET_OPTIONS } from '@/lib/api';
import {
  AutoCabPopupCards,
  LiveCabMatch,
  LiveDispatchOffer,
} from '@/components/cabs/AutoCabPopupCards';

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

// Custom suggestions for fallback autocomplete
const popularLocations = [
  { name: "Srinagar Airport (SXR)", type: "airport" },
  { name: "Dal Lake Ghats, Srinagar", type: "sightseeing" },
  { name: "Lal Chowk, Srinagar", type: "city" },
  { name: "Nishat Mughal Gardens, Srinagar", type: "sightseeing" },
  { name: "Shalimar Mughal Gardens, Srinagar", type: "sightseeing" },
  { name: "Gulmarg Gondola Resort, Gulmarg", type: "sightseeing" },
  { name: "The Khyber Resort, Gulmarg", type: "hotel" },
  { name: "Pahalgam Main Market, Pahalgam", type: "city" },
  { name: "Betaab Valley, Pahalgam", type: "sightseeing" },
  { name: "Aru Valley, Pahalgam", type: "sightseeing" },
  { name: "Thajiwas Glacier, Sonamarg", type: "sightseeing" },
  { name: "Doodhpathri Meadows", type: "sightseeing" },
  { name: "Yousmarg Alpine Valley", type: "sightseeing" }
];

// Predefined route lookup matrix (Distance in KM, Duration in minutes)
const routeLookup: Record<string, { distance: number; duration: number }> = {
  "srinagar airport (sxr)-srinagar hotel": { distance: 15, duration: 35 },
  "srinagar hotel-srinagar airport (sxr)": { distance: 15, duration: 35 },
  "srinagar airport (sxr)-dal lake ghats, srinagar": { distance: 18, duration: 40 },
  "srinagar airport (sxr)-gulmarg gondola resort, gulmarg": { distance: 56, duration: 105 },
  "srinagar airport (sxr)-the khyber resort, gulmarg": { distance: 58, duration: 110 },
  "srinagar airport (sxr)-pahalgam main market, pahalgam": { distance: 92, duration: 135 },
  "srinagar airport (sxr)-betaab valley, pahalgam": { distance: 98, duration: 150 },
  "srinagar airport (sxr)-thajiwas glacier, sonamarg": { distance: 82, duration: 150 },
  "srinagar airport (sxr)-doodhpathri meadows": { distance: 45, duration: 80 },
  
  "dal lake ghats, srinagar-gulmarg gondola resort, gulmarg": { distance: 52, duration: 90 },
  "dal lake ghats, srinagar-the khyber resort, gulmarg": { distance: 54, duration: 95 },
  "dal lake ghats, srinagar-pahalgam main market, pahalgam": { distance: 88, duration: 120 },
  "dal lake ghats, srinagar-thajiwas glacier, sonamarg": { distance: 80, duration: 135 },
  "dal lake ghats, srinagar-doodhpathri meadows": { distance: 48, duration: 85 },
  
  "lal chowk, srinagar-gulmarg gondola resort, gulmarg": { distance: 50, duration: 85 },
  "lal chowk, srinagar-pahalgam main market, pahalgam": { distance: 86, duration: 115 },
  "lal chowk, srinagar-thajiwas glacier, sonamarg": { distance: 79, duration: 130 },
  
  "gulmarg gondola resort, gulmarg-pahalgam main market, pahalgam": { distance: 140, duration: 210 },
  "the khyber resort, gulmarg-pahalgam main market, pahalgam": { distance: 142, duration: 215 },
  "gulmarg gondola resort, gulmarg-srinagar airport (sxr)": { distance: 56, duration: 105 },
  "the khyber resort, gulmarg-srinagar airport (sxr)": { distance: 58, duration: 110 },
  
  "pahalgam main market, pahalgam-srinagar airport (sxr)": { distance: 92, duration: 135 },
  "betaab valley, pahalgam-srinagar airport (sxr)": { distance: 98, duration: 150 },
  "aru valley, pahalgam-srinagar airport (sxr)": { distance: 104, duration: 165 },
  
  "thajiwas glacier, sonamarg-srinagar airport (sxr)": { distance: 82, duration: 150 }
};

// Premium fallback vehicle definitions
const standardVehicles = [
  {
    id: "standard-sedan",
    name: "Luxury Sedan (Etios/Dzire)",
    type: "Premium Sedan",
    capacity: 4,
    luggage: 2,
    pricePerKm: 14,
    basePrice: 1500,
    image: "/images/tourist_sedan.png",
    features: ["Climate Control AC", "Leather Seats", "Complimentary Water", "Charging Ports"],
    availability: "Available"
  },
  {
    id: "standard-ertiga",
    name: "Ertiga Cruiser (SUV)",
    type: "SUV Comfort",
    capacity: 6,
    luggage: 3,
    pricePerKm: 16,
    basePrice: 2200,
    image: "/images/tourist_ertiga.png",
    features: ["AC vents in all rows", "Ample Legroom", "Spacious Boot", "Bluetooth Audio"],
    availability: "Available"
  },
  {
    id: "standard-innova",
    name: "Innova Classic (SUV)",
    type: "SUV Premium",
    capacity: 6,
    luggage: 4,
    pricePerKm: 20,
    basePrice: 2800,
    image: "/images/tourist_innova.png",
    features: ["Plush Captain Chairs", "Soft Suspension", "Driver Guide", "Bottled Water"],
    availability: "Low Stock"
  },
  {
    id: "standard-crysta",
    name: "Innova Crysta VIP",
    type: "Luxury VIP SUV",
    capacity: 7,
    luggage: 5,
    pricePerKm: 25,
    basePrice: 3500,
    image: "/images/tourist_innova.png",
    features: ["Premium Leather Interior", "High-speed Wi-Fi", "Snack Hamper", "Dual Zone AC", "Plush Headrests"],
    availability: "High Demand"
  },
  {
    id: "standard-urbania",
    name: "Force Urbania Luxury",
    type: "Premium Cruiser",
    capacity: 10,
    luggage: 6,
    pricePerKm: 30,
    basePrice: 4000,
    image: "/images/tourist_urbania.png",
    features: ["Reclining VIP Seats", "Individual AC vents", "USB charging ports", "Complimentary Refreshments", "Wide Panoramic Windows"],
    availability: "Available"
  },
  {
    id: "standard-tempo",
    name: "Tempo Traveller Executive",
    type: "Luxury Van",
    capacity: 12,
    luggage: 8,
    pricePerKm: 35,
    basePrice: 4500,
    image: "/images/tourist_tempo.png",
    features: ["Reclining Pushback Seats", "Roof Carrier for Luggage", "LED TV & Music", "Bottled Water", "Wi-Fi"],
    availability: "Available"
  }
];

export default function Cabs() {
  const navigate = useNavigate();
  const { isAuthenticated, user, token, refreshBookings } = useAuth();
  const queryClient = useQueryClient();
  const { data: dbCabs = [], isLoading: isLoadingCabs } = useCabs();

  const [selectedCab, setSelectedCab] = useState<any>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutMethod, setCheckoutMethod] = useState<'upi' | 'cash'>('upi');
  const [checkoutStatus, setCheckoutStatus] = useState<'idle' | 'processing' | 'success'>('idle');
  const [bookingRefNo, setBookingRefNo] = useState('');
  const [boardingPin, setBoardingPin] = useState('');

  // Real-Time PostgreSQL Dispatch & Auto Pop-Up States
  const [liveMatches, setLiveMatches] = useState<LiveCabMatch[]>([]);
  const [onlineDriversCount, setOnlineDriversCount] = useState(0);
  const [liveEstimatedKm, setLiveEstimatedKm] = useState(28);
  const [corridorAdvisory, setCorridorAdvisory] = useState<{
    title?: string;
    message?: string;
    location?: string;
  } | null>(null);
  const [showAutoPopup, setShowAutoPopup] = useState(false);
  const [popupDismissedManually, setPopupDismissedManually] = useState(false);

  const [activeReservationId, setActiveReservationId] = useState<string | null>(null);
  const [activeReservationStatus, setActiveReservationStatus] = useState<string | null>(null);
  const [liveDispatchOffers, setLiveDispatchOffers] = useState<LiveDispatchOffer[]>([]);

  // Broadcast & Negotiation States (mapped cleanly from real CabDispatchOffer[])
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [driverOffers, setDriverOffers] = useState<any[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [isNegotiatingMap, setIsNegotiatingMap] = useState<Record<string, boolean>>({});
  const [counterValues, setCounterValues] = useState<Record<string, string>>({});
  const [isDriverResponding, setIsDriverResponding] = useState<Record<string, boolean>>({});
  const [finalAgreedFare, setFinalAgreedFare] = useState<number>(0);
  const [allocatedDriver, setAllocatedDriver] = useState<any>(null);

  // Tracking timeline console state (synced from real DB status)
  const [isTracking, setIsTracking] = useState(false);
  const [trackingStep, setTrackingStep] = useState(0);

  // Form states
  const [tripType, setTripType] = useState('airport');
  const [airportDirection, setAirportDirection] = useState('arrival'); // arrival = airport to hotel, departure = hotel to airport
  
  // Location Autocomplete states
  const [pickupInput, setPickupInput] = useState('');
  const [dropInput, setDropInput] = useState('');
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [showDropSuggestions, setShowDropSuggestions] = useState(false);
  
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('09:00');
  const [returnDate, setReturnDate] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pickup = params.get('pickup');
    const drop = params.get('drop');
    const date = params.get('date');
    if (pickup) {
      setPickupInput(pickup);
      setPickupCoords({ lat: 0, lon: 0, name: pickup }); // Fallback coords for static queries
    }
    if (drop) {
      setDropInput(drop);
      setDropCoords({ lat: 0, lon: 0, name: drop });
    }
    if (date) {
      setBookingDate(date);
    }
  }, []);

  const mapOfferToUiCard = (
    offer: LiveDispatchOffer,
    matchedCab?: {
      id: string;
      name: string;
      type: string;
      capacity: number;
      pricePerKm: number;
      basePrice: number;
      image: string | null;
      features: string[];
    }
  ) => {
    const statusMap: Record<string, string> = {
      OFFERED: 'received',
      DRIVER_ACCEPTED: 'accepted',
      COUNTERED_BY_DRIVER: 'countered',
      COUNTERED_BY_TOURIST: 'countered',
      ACCEPTED: 'accepted',
      DECLINED: 'rejected',
      CLOSED: 'rejected',
      EXPIRED: 'rejected',
    };
    return {
      id: offer.id,
      driverName: offer.driverName,
      driverPhone: offer.driverPhone || null,
      driverRating: offer.driverRating,
      driverTours: offer.driverTrips,
      vehicleName: offer.vehicleName,
      vehicleType: offer.vehicleType,
      vehicleImage: offer.vehicleImage || matchedCab?.image || '/images/tourist_innova.png',
      capacity: offer.capacity,
      luggage: offer.luggageCapacity,
      features: matchedCab?.features || [
        ...(offer.snowChains ? ['Snow Chains Equipped'] : []),
        ...(offer.fourWheelDrive ? ['4x4 Winter Drivetrain'] : []),
        ...(offer.unionVerified ? ['Taxi Union Verified'] : []),
      ],
      initialBid: offer.initialFare,
      currentBid: offer.driverFare,
      touristCounter: offer.touristCounter,
      status: statusMap[offer.status] || 'received',
      rawStatus: offer.status,
      driverMessage: offer.driverMessage,
      registrationNo: offer.vehicleRegNo,
      etaMinutes: offer.etaMinutes,
      cabObject: matchedCab || {
        id: offer.cabId,
        name: offer.vehicleName,
        type: offer.vehicleType,
        capacity: offer.capacity,
        pricePerKm: 22,
        basePrice: offer.initialFare,
        image: offer.vehicleImage || '/images/tourist_innova.png',
        features: ['Snow Chains Equipped'],
      },
    };
  };

  const fetchLiveMatches = async () => {
    try {
      const effectivePickup =
        tripType === 'airport' && airportDirection === 'arrival'
          ? 'Srinagar Airport (SXR)'
          : pickupInput || 'Srinagar Airport (SXR)';
      const effectiveDrop =
        tripType === 'airport' && airportDirection === 'departure'
          ? 'Srinagar Airport (SXR)'
          : dropInput || 'Dal Lake Ghats, Srinagar';

      const qs = new URLSearchParams({
        pickup: effectivePickup,
        drop: effectiveDrop,
        tripType,
      });
      const res = await fetch(`${API_BASE_URL}/cabs/live-matches?${qs.toString()}`);
      if (!res.ok) return;
      const data = await res.json();
      setLiveMatches(Array.isArray(data.matches) ? data.matches : []);
      setOnlineDriversCount(Number(data.onlineDriversCount || 0));
      setLiveEstimatedKm(Number(data.estimatedKm || 28));
      setCorridorAdvisory(data.corridorAdvisory || null);
    } catch {
      // Non-fatal; fallback to fleet cards
    }
  };

  const syncActiveReservation = async (resId: string) => {
    const authJwt = token || localStorage.getItem('auth_token');
    if (!authJwt || !resId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/cabs/ride-requests/${resId}`, {
        headers: { Authorization: `Bearer ${authJwt}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setActiveReservationStatus(data.status || null);
      if (data.securityPin) setBoardingPin(data.securityPin);
      if (data.voucherReference) setBookingRefNo(data.voucherReference);

      const offers: LiveDispatchOffer[] = Array.isArray(data.offers) ? data.offers : [];
      setLiveDispatchOffers(offers);
      setDriverOffers(offers.map((o) => mapOfferToUiCard(o)));

      const upperStatus = String(data.status || '').toUpperCase();
      if (upperStatus === 'DISPATCHED') setTrackingStep(1);
      else if (upperStatus === 'AT_PICKUP') setTrackingStep(2);
      else if (upperStatus === 'ON_TRIP') setTrackingStep(3);
      else if (upperStatus === 'COMPLETED') setTrackingStep(4);

      if (['DISPATCHED', 'AT_PICKUP', 'ON_TRIP', 'COMPLETED'].includes(upperStatus) && data.driverName) {
        setAllocatedDriver({
          driverName: data.driverName,
          driverPhone: data.driverPhone || null,
          registrationNo: data.vehicleRegNo || 'JK01-CAB',
          driverRating: 4.9,
          driverTours: 120,
          currentBid: data.agreedFare || data.totalCost || finalAgreedFare,
        });
      }
    } catch {
      // Ignore transient poll errors
    }
  };

  const fetchLiveMatchesRef = useRef(fetchLiveMatches);
  fetchLiveMatchesRef.current = fetchLiveMatches;
  const syncActiveReservationRef = useRef(syncActiveReservation);
  syncActiveReservationRef.current = syncActiveReservation;
  const activeReservationIdRef = useRef(activeReservationId);
  activeReservationIdRef.current = activeReservationId;
  const popupDismissedRef = useRef(popupDismissedManually);
  popupDismissedRef.current = popupDismissedManually;

  useEffect(() => {
    void fetchLiveMatchesRef.current();
  }, [tripType, airportDirection, pickupInput, dropInput]);

  // Automatically surface Auto Pop-Up Cab UI Cards when tourist lands and matches exist
  useEffect(() => {
    if (popupDismissedManually || isTracking) return;
    if (liveMatches.length > 0 && !showAutoPopup) {
      const timer = setTimeout(() => setShowAutoPopup(true), 600);
      return () => clearTimeout(timer);
    }
  }, [liveMatches.length, popupDismissedManually, showAutoPopup, isTracking]);

  // Poll active reservation while searching / tracking for resilience
  useEffect(() => {
    if (!activeReservationId) return;
    const interval = setInterval(() => {
      void syncActiveReservationRef.current(activeReservationId);
    }, 4000);
    return () => clearInterval(interval);
  }, [activeReservationId, token]);

  // Real-time synchronization with Fleet, Live Drivers & Ride Dispatch
  useEffect(() => {
    const authJwt = token || localStorage.getItem('auth_token');
    const socket = io(SOCKET_URL, {
      ...DEFAULT_SOCKET_OPTIONS,
      ...(authJwt ? { auth: { token: authJwt } } : {}),
    });

    const refreshCabs = () => {
      queryClient.invalidateQueries({ queryKey: ['cms-cabs'] });
      void fetchLiveMatchesRef.current();
    };

    socket.on('connect', () => {
      socket.emit('join-room', 'cabs-public');
      if (user?.id) socket.emit('join-user', user.id);
    });

    socket.on('cabs-updated', refreshCabs);
    socket.on('fleet-updated', refreshCabs);
    socket.on('live-drivers-updated', refreshCabs);

    socket.on('driver-offer-accepted', (payload: { reservationId?: string; driverFare?: number }) => {
      toast.success('Chauffeur Accepted Your Ride Request!', {
        description: `Confirmed rate ₹${Number(payload?.driverFare || 0).toLocaleString('en-IN')}. Tap Confirm to lock & view Boarding PIN.`,
      });
      if (!popupDismissedRef.current) setShowAutoPopup(true);
      const nextId = payload?.reservationId || activeReservationIdRef.current;
      if (nextId) void syncActiveReservationRef.current(nextId);
    });

    socket.on('driver-counter-offer', (payload: { reservationId?: string; driverFare?: number; proposedFare?: number; driverName?: string }) => {
      toast.info('Driver Sent Live Counter-Offer', {
        description: `${payload?.driverName || 'Pilot'} proposed ₹${Number(payload?.driverFare || payload?.proposedFare || 0).toLocaleString('en-IN')}`,
      });
      if (!popupDismissedRef.current) setShowAutoPopup(true);
      const nextId = payload?.reservationId || activeReservationIdRef.current;
      if (nextId) void syncActiveReservationRef.current(nextId);
    });

    socket.on('cab-reservation-updated', (payload: { status?: string; reservation?: { id?: string; status?: string } }) => {
      const nextId = payload?.reservation?.id || activeReservationIdRef.current;
      if (nextId) void syncActiveReservationRef.current(nextId);
    });

    socket.on('trip-transitioned', (payload: { reservationId?: string; status?: string }) => {
      const nextId = payload?.reservationId || activeReservationIdRef.current;
      if (nextId) void syncActiveReservationRef.current(nextId);
    });

    socket.on('site-content-updated', (data: any) => {
      if (!data || !data.sectionKey || data.sectionKey === 'cabs') {
        refreshCabs();
      }
    });
    socket.on('new-system-event', (data: any) => {
      if (
        data?.booking?.entityType === 'cab' ||
        data?.message?.toLowerCase().includes('cab') ||
        data?.message?.toLowerCase().includes('fleet') ||
        data?.message?.toLowerCase().includes('vehicle')
      ) {
        refreshCabs();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [queryClient, token, user?.id]);

  const parseDateString = (dateStr: string) => {
    if (!dateStr) return undefined;
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const formatDateToString = (date: Date | undefined) => {
    if (!date) return '';
    return format(date, "yyyy-MM-dd");
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return "Select Date";
    const date = parseDateString(dateStr);
    return date ? format(date, "dd MMM yyyy") : "Select Date";
  };

  // Script loading
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const [specialNotes, setSpecialNotes] = useState('');
  const pickupInputRef = useRef<HTMLInputElement>(null);
  const dropInputRef = useRef<HTMLInputElement>(null);

  // Leaflet map and geocoding states
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lon: number; name: string } | null>(null);
  const [dropCoords, setDropCoords] = useState<{ lat: number; lon: number; name: string } | null>(null);
  const [pickupSuggestions, setPickupSuggestions] = useState<any[]>([]);
  const [dropSuggestions, setDropSuggestions] = useState<any[]>([]);
  const [searchingPickup, setSearchingPickup] = useState(false);
  const [searchingDrop, setSearchingDrop] = useState(false);
  const [detectingGps, setDetectingGps] = useState(false);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const pickupMarkerRef = useRef<any>(null);
  const dropMarkerRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);

  // Dynamic Leaflet CSS and JS Script loader
  useEffect(() => {
    if ((window as any).L) {
      setLeafletLoaded(true);
      return;
    }

    const cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(cssLink);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    script.onload = () => {
      const leafletApi = (window as unknown as { L?: { map?: unknown } }).L;
      if (leafletApi && typeof leafletApi.map === 'function') {
        setLeafletLoaded(true);
      }
    };
    document.head.appendChild(script);
  }, []);

  // Helper functions for GPS distance calculation
  const deg2rad = (deg: number) => deg * (Math.PI / 180);
  const getHaversineDistance = (c1: { lat: number; lon: number }, c2: { lat: number; lon: number }) => {
    const R = 6371; // Earth radius in km
    const dLat = deg2rad(c2.lat - c1.lat);
    const dLon = deg2rad(c2.lon - c1.lon);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(c1.lat)) * Math.cos(deg2rad(c2.lat)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Search autocomplete handler for Nominatim OpenStreetMap API
  const searchLocations = async (query: string, type: 'pickup' | 'drop') => {
    if (!query || query.length < 3) {
      if (type === 'pickup') setPickupSuggestions([]);
      else setDropSuggestions([]);
      return;
    }

    if (type === 'pickup') setSearchingPickup(true);
    else setSearchingDrop(true);

    try {
      // Bounding box constraint for J&K: [minLon, minLat, maxLon, maxLat]
      const viewbox = '73.5,32.0,76.5,35.0';
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ', Jammu and Kashmir')}&format=json&addressdetails=1&limit=5&viewbox=${viewbox}&bounded=1`;
      
      const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
      if (res.ok) {
        const data = await res.json();
        const formatted = data.map((item: any) => {
          // Extract a shorter and cleaner display name
          const parts = item.display_name.split(',');
          const name = parts.slice(0, 3).join(',').trim();
          return {
            name,
            fullName: item.display_name,
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon)
          };
        });
        
        if (type === 'pickup') setPickupSuggestions(formatted);
        else setDropSuggestions(formatted);
      }
    } catch (err) {
      console.error('Nominatim search error:', err);
    } finally {
      if (type === 'pickup') setSearchingPickup(false);
      else setSearchingDrop(false);
    }
  };

  // Debounce effect for real-time geocoding search
  useEffect(() => {
    if (pickupInput && pickupInput !== (pickupCoords?.name || '')) {
      const delay = setTimeout(() => searchLocations(pickupInput, 'pickup'), 450);
      return () => {
        clearTimeout(delay);
      };
    } else {
      setPickupSuggestions([]);
    }
  }, [pickupInput]);

  useEffect(() => {
    if (dropInput && dropInput !== (dropCoords?.name || '')) {
      const delay = setTimeout(() => searchLocations(dropInput, 'drop'), 450);
      return () => {
        clearTimeout(delay);
      };
    } else {
      setDropSuggestions([]);
    }
  }, [dropInput]);

  // Geolocation detector
  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      toast.error('GPS Geolocation is not supported by your browser.');
      return;
    }

    setDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`);
          if (res.ok) {
            const data = await res.json();
            const addressParts = data.display_name.split(',');
            const cleanName = addressParts.slice(0, 3).join(',').trim();
            setPickupInput(cleanName);
            setPickupCoords({ lat, lon, name: cleanName });
            toast.success('Current location detected via GPS');
          } else {
            setPickupInput(`GPS Coordinate (${lat.toFixed(4)}, ${lon.toFixed(4)})`);
            setPickupCoords({ lat, lon, name: 'Current Location' });
          }
        } catch {
          setPickupInput(`GPS Coordinate (${lat.toFixed(4)}, ${lon.toFixed(4)})`);
          setPickupCoords({ lat, lon, name: 'Current Location' });
        } finally {
          setDetectingGps(false);
        }
      },
      () => {
        toast.error('Unable to fetch GPS location. Please enter manually.');
        setDetectingGps(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // VPA Config
  const [upiConfig, setUpiConfig] = useState({
    vpa: 'thekashmircurators@okaxis',
    name: 'The Kashmir Curators'
  });

  // Hero section settings loaded dynamically
  const [heroTitle, setHeroTitle] = useState('Premium Transport');
  const [heroSubtitle, setHeroSubtitle] = useState('Reliable cab services for airport transfers, local sightseeing, and outstation trips.');
  const [heroImage, setHeroImage] = useState('https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=1600');

  // Load Google Maps script dynamically
  useEffect(() => {
    if ((window as any).google && (window as any).google.maps) {
      setGoogleMapsLoaded(true);
      return;
    }
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
    if (!apiKey) return;

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setGoogleMapsLoaded(true);
    document.head.appendChild(script);
  }, []);

  // Bind Google Maps Autocomplete if script is loaded successfully
  useEffect(() => {
    if (!googleMapsLoaded || !pickupInputRef.current || !dropInputRef.current) return;

    const options = {
      componentRestrictions: { country: 'in' },
      fields: ['address_components', 'geometry', 'formatted_address', 'name'],
    };

    const autocompletePickup = new (window as any).google.maps.places.Autocomplete(pickupInputRef.current, options);
    const autocompleteDrop = new (window as any).google.maps.places.Autocomplete(dropInputRef.current, options);

    autocompletePickup.addListener('place_changed', () => {
      const place = autocompletePickup.getPlace();
      setPickupInput(place.formatted_address || place.name || '');
    });

    autocompleteDrop.addListener('place_changed', () => {
      const place = autocompleteDrop.getPlace();
      setDropInput(place.formatted_address || place.name || '');
    });
  }, [googleMapsLoaded, tripType]);

  // Initialize Leaflet map
  useEffect(() => {
    if (!leafletLoaded || !mapRef.current || mapInstanceRef.current) return;

    const L = (window as any).L;
    if (!L || typeof L.map !== 'function') return;
    const map = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView([34.0837, 74.7973], 12); // Centered on Srinagar

    // Premium dark-themed tile layer matching brand aesthetic
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 20
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [leafletLoaded]);

  // Update Leaflet map markers and polyline route
  useEffect(() => {
    if (!leafletLoaded || !mapInstanceRef.current) return;

    const L = (window as any).L;
    if (!L || typeof L.divIcon !== 'function') return;
    const map = mapInstanceRef.current;

    // Remove existing layers
    if (pickupMarkerRef.current) {
      map.removeLayer(pickupMarkerRef.current);
      pickupMarkerRef.current = null;
    }
    if (dropMarkerRef.current) {
      map.removeLayer(dropMarkerRef.current);
      dropMarkerRef.current = null;
    }
    if (polylineRef.current) {
      map.removeLayer(polylineRef.current);
      polylineRef.current = null;
    }

    const markers: any[] = [];

    // Add Pickup Pin
    if (pickupCoords) {
      const pickupIcon = L.divIcon({
        html: `<div class="w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shadow-lg"><div class="w-2 h-2 rounded-full bg-white animate-pulse"></div></div>`,
        className: 'custom-pin-pickup',
        iconSize: [24, 24]
      });

      pickupMarkerRef.current = L.marker([pickupCoords.lat, pickupCoords.lon], { icon: pickupIcon })
        .addTo(map)
        .bindPopup(`<b>Pickup Location:</b><br/>${pickupCoords.name}`)
        .openPopup();

      markers.push([pickupCoords.lat, pickupCoords.lon]);
    }

    // Add Drop Pin
    if (dropCoords) {
      const dropIcon = L.divIcon({
        html: `<div class="w-6 h-6 rounded-full bg-red-500 border-2 border-white flex items-center justify-center shadow-lg"><div class="w-2 h-2 rounded-full bg-white"></div></div>`,
        className: 'custom-pin-drop',
        iconSize: [24, 24]
      });

      dropMarkerRef.current = L.marker([dropCoords.lat, dropCoords.lon], { icon: dropIcon })
        .addTo(map)
        .bindPopup(`<b>Drop Destination:</b><br/>${dropCoords.name}`);

      markers.push([dropCoords.lat, dropCoords.lon]);
    }

    // Paint Route Polyline
    if (markers.length === 2) {
      polylineRef.current = L.polyline(markers, {
        color: '#d4af37', // Kashmir Gold
        weight: 4,
        opacity: 0.8,
        dashArray: '10, 10'
      }).addTo(map);

      map.fitBounds(L.latLngBounds(markers), { padding: [50, 50] });
    } else if (markers.length === 1) {
      map.setView(markers[0], 14);
    }
  }, [leafletLoaded, pickupCoords, dropCoords]);

  // Fetch Page Configurations
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/site-content`);
        if (res.ok) {
          const data = await res.json();
          if (data.fleetHero) {
            setHeroTitle(data.fleetHero.title || 'Premium Transport');
            setHeroSubtitle(data.fleetHero.subtitle || 'Reliable cab services for airport transfers, local sightseeing, and outstation trips.');
            setHeroImage(data.fleetHero.image_url || 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=1600');
          }
          if (data.paymentSettings?.content?.methods) {
            const methods = data.paymentSettings.content.methods;
            const primaryUPI = methods.find((m: any) => m.type === 'upi' && m.isActive && m.isPrimary);
            if (primaryUPI) {
              setUpiConfig({
                vpa: primaryUPI.identifier,
                name: primaryUPI.name || primaryUPI.provider || 'The Kashmir Curators'
              });
            }
          }
        }
      } catch (err) {
        console.error('Failed to load fleet configurations:', err);
      }
    };
    fetchSettings();
  }, []);

  // Airport coords auto-setter
  useEffect(() => {
    const airportCoords = { lat: 33.9930, lon: 74.7744, name: 'Srinagar Airport (SXR)' };
    if (tripType === 'airport') {
      if (airportDirection === 'arrival') {
        setPickupCoords(airportCoords);
        setPickupInput('Srinagar Airport (SXR)');
      } else {
        setDropCoords(airportCoords);
        setDropInput('Srinagar Airport (SXR)');
      }
    }
  }, [tripType, airportDirection]);

  // Predefined or dynamic distance calculation
  const getRouteStats = () => {
    // If we have dynamic geocoded coordinates, calculate actual distance via Haversine
    if (pickupCoords && dropCoords) {
      const geodeticDist = getHaversineDistance(pickupCoords, dropCoords);
      // Average 1.35x driving/route factor for actual winding road distance in J&K
      const drivingDist = Math.round(geodeticDist * 1.35);
      const drivingDuration = Math.round(drivingDist * 2.2); // ~2.2 mins per km on average
      return { 
        distance: Math.max(5, drivingDist), 
        duration: Math.max(10, drivingDuration) 
      };
    }

    const pLoc = (tripType === 'airport' && airportDirection === 'arrival' ? 'Srinagar Airport (SXR)' : pickupInput).trim().toLowerCase();
    const dLoc = (tripType === 'airport' && airportDirection === 'departure' ? 'Srinagar Airport (SXR)' : dropInput).trim().toLowerCase();
    
    if (!pLoc || !dLoc) return { distance: 15, duration: 35 }; // Default base values

    // Find in local matrix
    const key1 = `${pLoc}-${dLoc}`;
    const key2 = `${dLoc}-${pLoc}`;

    let match = Object.keys(routeLookup).find(k => k.toLowerCase() === key1 || k.toLowerCase() === key2);
    if (match) {
      return routeLookup[match];
    }

    // Rough approximations if custom location is typed
    if (dLoc.includes('gulmarg') || pLoc.includes('gulmarg')) return { distance: 54, duration: 95 };
    if (dLoc.includes('pahalgam') || pLoc.includes('pahalgam')) return { distance: 90, duration: 130 };
    if (dLoc.includes('sonamarg') || pLoc.includes('sonamarg')) return { distance: 80, duration: 140 };
    if (dLoc.includes('doodhpathri') || pLoc.includes('doodhpathri')) return { distance: 45, duration: 80 };
    if (dLoc.includes('airport') || pLoc.includes('airport')) return { distance: 15, duration: 35 };

    return { distance: 25, duration: 50 }; // standard custom path
  };

  const routeStats = getRouteStats();

  // Dynamic Fare calculation
  const calculateFare = (cab: any) => {
    if (!cab) return 0;
    const distance = Number(routeStats.distance) || 0;
    const baseFare = Number(cab.basePrice) || 0;
    const distanceCost = distance * (Number(cab.pricePerKm) || 0);
    let total = baseFare + distanceCost;
    
    if (tripType === 'outstation' && returnDate) {
      total *= 1.8; // roundtrip factor
    }
    return Math.round(total);
  };

  // Merge database items with standard UI categories
  const resolvedVehicles = dbCabs.length > 0 ? dbCabs.map(db => {
    // Determine intelligent fallback image ONLY if db.image is missing or empty
    let fallbackImagePath = "/images/tourist_innova.png";
    if (db.name?.toLowerCase().includes("sedan") || db.name?.toLowerCase().includes("etios") || db.name?.toLowerCase().includes("dzire")) {
      fallbackImagePath = "/images/tourist_sedan.png";
    } else if (db.name?.toLowerCase().includes("ertiga")) {
      fallbackImagePath = "/images/tourist_ertiga.png";
    } else if (db.name?.toLowerCase().includes("crysta") || (db.name?.toLowerCase().includes("innova") && db.name?.toLowerCase().includes("luxury"))) {
      fallbackImagePath = "/images/tourist_innova.png";
    } else if (db.name?.toLowerCase().includes("traveller") || db.name?.toLowerCase().includes("tempo") || db.name?.toLowerCase().includes("urbania")) {
      fallbackImagePath = "/images/tourist_tempo.png";
    }

    const standard = standardVehicles.find(s => 
      db.name?.toLowerCase().includes(s.name.split(' ')[0].toLowerCase()) || 
      db.type?.toLowerCase() === s.type.toLowerCase()
    ) || {
      name: db.name,
      type: db.type,
      pricePerKm: db.pricePerKm,
      basePrice: db.basePrice,
      features: [],
      capacity: db.capacity || 4,
      luggage: 4,
      availability: "Available"
    };

    // Prioritize actual image URL uploaded/set in CMS
    const finalImage = (db.image && typeof db.image === 'string' && db.image.trim() !== '') 
      ? db.image.trim() 
      : fallbackImagePath;

    let parsedFeatures: string[] = [];
    if (Array.isArray(db.features)) {
      parsedFeatures = db.features;
    } else if (typeof db.features === 'string') {
      try {
        const parsed = JSON.parse(db.features);
        if (Array.isArray(parsed)) parsedFeatures = parsed;
      } catch {
        parsedFeatures = standard.features || [];
      }
    } else {
      parsedFeatures = standard.features || [];
    }

    return {
      id: db.id,
      name: db.name || standard.name,
      type: db.type || standard.type,
      capacity: db.capacity || standard.capacity,
      pricePerKm: db.pricePerKm !== undefined ? db.pricePerKm : standard.pricePerKm,
      basePrice: db.basePrice !== undefined ? db.basePrice : standard.basePrice,
      image: finalImage,
      features: parsedFeatures.length > 0 ? parsedFeatures : ["Climate Control AC", "Local Certified Chauffeur", "24/7 Valley Support"],
      luggage: db.capacity >= 7 ? 5 : (db.capacity >= 6 ? 4 : (db.capacity <= 2 ? 2 : 3)),
      availability: db.isActive !== false ? (standard.availability || "Available") : "Maintenance"
    };
  }) : standardVehicles.map(s => {
    // If fallback to standardVehicles is used
    let imagePath = s.image;
    if (s.id === "standard-sedan") imagePath = "/images/tourist_sedan.png";
    else if (s.id === "standard-ertiga") imagePath = "/images/tourist_ertiga.png";
    else if (s.id === "standard-innova") imagePath = "/images/tourist_innova.png";
    else if (s.id === "standard-crysta") imagePath = "/images/tourist_innova.png";
    else if (s.id === "standard-urbania") imagePath = "/images/tourist_urbania.png";
    else if (s.id === "standard-tempo") imagePath = "/images/tourist_tempo.png";
    return { ...s, image: imagePath };
  });

  // Keep selectedCab synced in real-time when resolvedVehicles refreshes
  useEffect(() => {
    if (selectedCab && resolvedVehicles.length > 0) {
      const live = resolvedVehicles.find(v => v.id === selectedCab.id);
      if (live && (live.image !== selectedCab.image || live.name !== selectedCab.name || live.pricePerKm !== selectedCab.pricePerKm || live.basePrice !== selectedCab.basePrice)) {
        setSelectedCab(live);
      }
    }
  }, [resolvedVehicles, selectedCab]);

  // Submit real PostgreSQL ride request -> notifies live online drivers via Socket.IO & SSE
  const createLiveRideRequest = async (opts?: {
    preferredCab?: {
      id?: string;
      cabId?: string;
      type?: string;
      driverProfileId?: string | null;
      pricePerKm?: number;
      basePrice?: number;
      estimatedFare?: number;
    };
    preferredDriverProfileId?: string | null;
    customFare?: number;
    overridePickup?: string;
    overrideDrop?: string;
    overrideTripType?: string;
  }) => {
    if (!isAuthenticated) {
      toast.error('Please sign in to dispatch your live cab request');
      navigate('/auth?redirect=/cabs');
      return;
    }

    const effectivePickup =
      opts?.overridePickup ||
      (tripType === 'airport' && airportDirection === 'arrival'
        ? 'Srinagar Airport (SXR)'
        : pickupInput || 'Srinagar Airport (SXR)');
    const effectiveDrop =
      opts?.overrideDrop ||
      (tripType === 'airport' && airportDirection === 'departure'
        ? 'Srinagar Airport (SXR)'
        : dropInput || 'Dal Lake Ghats, Srinagar');

    const chosenCab = opts?.preferredCab || selectedCab || resolvedVehicles[0];
    const startIso = bookingDate ? `${bookingDate}T${bookingTime || '09:00'}` : new Date().toISOString();

    setIsBroadcasting(true);
    setDriverOffers([]);
    setLiveDispatchOffers([]);
    setSelectedOffer(null);
    setTrackingStep(0);

    try {
      const authJwt = token || localStorage.getItem('auth_token') || '';
      const computedFare =
        chosenCab && 'basePrice' in chosenCab && typeof chosenCab.basePrice === 'number'
          ? calculateFare(chosenCab)
          : undefined;
      const fareEstimate =
        opts?.customFare ||
        opts?.preferredCab?.estimatedFare ||
        (computedFare && Number.isFinite(computedFare) ? computedFare : undefined) ||
        liveMatches[0]?.estimatedFare ||
        1800;

      const res = await fetch(`${API_BASE_URL}/cabs/ride-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authJwt}`,
        },
        body: JSON.stringify({
          pickupLocation: effectivePickup,
          dropLocation: effectiveDrop,
          pickupLat: pickupCoords?.lat || undefined,
          pickupLng: pickupCoords?.lon || undefined,
          dropLat: dropCoords?.lat || undefined,
          dropLng: dropCoords?.lon || undefined,
          startDate: startIso,
          endDate: returnDate ? `${returnDate}T18:00` : undefined,
          tripType: opts?.overrideTripType || tripType,
          requestedCabType: chosenCab?.type,
          preferredCabId: chosenCab?.cabId || chosenCab?.id,
          preferredDriverProfileId: opts?.preferredDriverProfileId || chosenCab?.driverProfileId || undefined,
          offeredFare: fareEstimate,
          estimatedDistanceKm: routeStats.distance || liveEstimatedKm,
          specialNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to dispatch cab request');
        return;
      }

      const reservation = data.rideRequest;
      const offers: LiveDispatchOffer[] = Array.isArray(data.offers) ? data.offers : [];

      setActiveReservationId(reservation.id);
      setActiveReservationStatus(reservation.status);
      setBookingRefNo(reservation.voucherReference || '');
      setLiveDispatchOffers(offers);
      setDriverOffers(
        offers.map((o) => mapOfferToUiCard(o, resolvedVehicles.find((v) => v.id === o.cabId)))
      );

      if (offers.length > 0) {
        toast.success(
          `Request Sent to ${offers.length} Live Chauffeur${offers.length > 1 ? 's' : ''}!`,
          { description: 'Live driver responses & counter-offers appear automatically below.' }
        );
      } else {
        toast.info('Ride Request Queued in Kashmir Dispatch Radar', {
          description: 'Searching nearest Union-verified chauffeur coming online.',
        });
      }
    } catch {
      toast.error('Network error dispatching live ride request');
    }
  };

  const handleStartBroadcast = () => {
    if (!isAuthenticated) {
      toast.error('Please login to request a ride');
      navigate('/auth?redirect=/cabs');
      return;
    }
    if (!selectedCab) {
      toast.error('Please select a vehicle class from the fleet first');
      return;
    }
    if (tripType === 'airport' && airportDirection === 'arrival' && !dropInput) {
      toast.error('Please input Hotel / Drop-off location');
      return;
    }
    if (tripType === 'airport' && airportDirection === 'departure' && !pickupInput) {
      toast.error('Please input Hotel / Pickup location');
      return;
    }
    if (tripType !== 'airport' && (!pickupInput || !dropInput)) {
      toast.error('Please input pickup and drop destinations');
      return;
    }
    if (!bookingDate) {
      toast.error('Please select date');
      return;
    }

    void createLiveRideRequest({ preferredCab: selectedCab });
  };

  const handleNegotiatePrice = (offerId: string) => {
    setIsNegotiatingMap((prev) => ({ ...prev, [offerId]: true }));
    const offer = driverOffers.find((o) => o.id === offerId);
    if (offer) {
      setCounterValues((prev) => ({ ...prev, [offerId]: Math.round(offer.currentBid * 0.9).toString() }));
    }
  };

  const sendTouristCounterToApi = async (offerId: string, counterVal: number) => {
    if (!activeReservationId || isNaN(counterVal) || counterVal < 400) return;
    setIsDriverResponding((prev) => ({ ...prev, [offerId]: true }));
    try {
      const authJwt = token || localStorage.getItem('auth_token') || '';
      const res = await fetch(
        `${API_BASE_URL}/cabs/ride-requests/${activeReservationId}/offers/${offerId}/counter`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authJwt}`,
          },
          body: JSON.stringify({ counterFare: counterVal }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to transmit counter-offer');
        return;
      }
      toast.success(`Counter-offer ₹${counterVal.toLocaleString('en-IN')} sent to chauffeur`, {
        description: 'Driver can accept or reply with a live revised fare.',
      });
      setIsNegotiatingMap((prev) => ({ ...prev, [offerId]: false }));
      await syncActiveReservation(activeReservationId);
    } finally {
      setIsDriverResponding((prev) => ({ ...prev, [offerId]: false }));
    }
  };

  const handleSendCounter = (offerId: string) => {
    const counterVal = parseInt(counterValues[offerId], 10);
    void sendTouristCounterToApi(offerId, counterVal);
  };

  const handleAcceptOffer = (offer: any) => {
    if (offer.rawStatus === 'COUNTERED_BY_TOURIST') {
      toast.info('Waiting for chauffeur to accept your counter-offer first.');
      return;
    }
    setSelectedOffer(offer);
    setSelectedCab(offer.cabObject || selectedCab);
    setFinalAgreedFare(offer.currentBid ?? offer.driverFare);
    setAllocatedDriver({
      driverName: offer.driverName,
      driverPhone: offer.driverPhone || null,
      registrationNo: offer.registrationNo || offer.vehicleRegNo,
      driverRating: offer.driverRating,
      driverTours: offer.driverTours ?? offer.driverTrips ?? 80,
      currentBid: offer.currentBid ?? offer.driverFare,
    });
    setCheckoutStatus('idle');
    setShowCheckout(true);
  };

  // Atomic Confirm Ride & Create Booking on PostgreSQL
  const confirmOfferOnBackend = async (offerId: string) => {
    if (!activeReservationId) return null;
    const authJwt = token || localStorage.getItem('auth_token') || '';
    const res = await fetch(
      `${API_BASE_URL}/cabs/ride-requests/${activeReservationId}/offers/${offerId}/confirm`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authJwt}`,
        },
        body: JSON.stringify({ specialNotes }),
      }
    );
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to confirm chauffeur dispatch');
    }
    return data;
  };

  // Confirm booking & lock chauffeur atomically
  const handleConfirmPayment = async () => {
    if (!selectedOffer || !activeReservationId) return;
    setCheckoutStatus('processing');

    try {
      const result = await confirmOfferOnBackend(selectedOffer.id);
      if (!result) throw new Error('Confirmation response empty');

      setBookingRefNo(result.reservation?.voucherReference || `KC-CAB-${result.booking?.id?.slice(0, 6).toUpperCase()}`);
      if (result.reservation?.securityPin) setBoardingPin(result.reservation.securityPin);
      if (result.confirmedOffer) {
        setAllocatedDriver({
          driverName: result.confirmedOffer.driverName,
          driverPhone: result.confirmedOffer.driverPhone,
          registrationNo: result.confirmedOffer.vehicleRegNo,
          driverRating: result.confirmedOffer.driverRating,
          driverTours: result.confirmedOffer.driverTrips,
          currentBid: result.booking?.totalAmount || finalAgreedFare,
        });
      }

      setTrackingStep(1);
      setCheckoutStatus('success');
      toast.success('Chauffeur Locked & Booking Confirmed!');
      await refreshBookings();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Booking confirmation failed. Please try again.';
      toast.error(msg);
      setCheckoutStatus('idle');
    }
  };

  const getUPILink = () => {
    if (!selectedCab) return '';
    const fare = calculateFare(selectedCab);
    const note = `Cab Book ${selectedCab.name.slice(0, 10)}`;
    return `upi://pay?pa=${upiConfig.vpa}&pn=${encodeURIComponent(upiConfig.name)}&am=${fare}&cu=INR&tn=${encodeURIComponent(note)}`;
  };

  const getQRImageSrc = () => {
    const link = getUPILink();
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(link)}`;
  };

  return (
    <div className="min-h-screen bg-[#F8F8F9] dark:bg-[#05080a] text-slate-900 dark:text-white transition-colors duration-300 font-sans selection:bg-amber-400/30">
      <Navbar />

      {!isTracking ? (
        <>
          {/* Dynamic Luxury Hero Banner */}
          <div className="relative pt-36 pb-20 md:pt-44 md:pb-28 overflow-hidden border-b border-slate-200/80 dark:border-white/5">
            <div className="absolute inset-0 z-0">
              <img 
                src={heroImage} 
                alt="Kashmir 4x4 & Luxury Cabs" 
                className="w-full h-full object-cover object-center opacity-30 dark:opacity-25 filter contrast-125 scale-105 transition-transform duration-[10000ms]"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-[#05080a]/90 via-[#05080a]/70 to-[#05080a] dark:block hidden" />
              <div className="absolute inset-0 bg-gradient-to-b from-white/95 via-white/80 to-[#F8F8F9] dark:hidden block" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px] bg-amber-400/10 blur-[130px] rounded-full pointer-events-none" />
            </div>

            <div className="container mx-auto px-6 relative z-10 text-center max-w-4xl">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 dark:bg-white/5 border border-amber-500/20 dark:border-white/10 mb-8 backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 animate-spin-slow" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-800 dark:text-white/80">
                  VIP Chauffeurs & 4x4 Winter Fleet
                </span>
              </div>
              
              <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-black tracking-tight mb-6 leading-[1.05]">
                {heroTitle.split(' ').map((word, i) => (
                  <span 
                    key={i} 
                    className={i % 2 === 1 
                      ? "bg-clip-text text-transparent bg-gradient-to-r from-amber-600 dark:from-amber-400 via-amber-500 dark:via-amber-200 to-slate-900 dark:to-white" 
                      : "text-slate-900 dark:text-white"
                    }
                  >
                    {word}{' '}
                  </span>
                ))}
              </h1>
              
              <p className="text-slate-600 dark:text-white/60 text-base md:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
                {heroSubtitle}
              </p>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-700 dark:text-white/70">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-500" /> Snow-Chained 4x4 (Innova Crysta / Urbania)
                </span>
                <span className="text-slate-300 dark:text-white/20">•</span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Verified Mountain Chauffeurs
                </span>
                <span className="text-slate-300 dark:text-white/20">•</span>
                <span className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" /> Airport VIP Meet & Greet
                </span>
              </div>
            </div>
          </div>

          <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              
              {/* Form Input Side */}
              <div className="lg:col-span-8 space-y-10">
                
                {/* Search Configuration Card */}
                <div className="bg-white dark:bg-[#0a0f12]/60 border border-slate-200/80 dark:border-white/5 rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-6 md:p-10 backdrop-blur-xl shadow-xl shadow-slate-200/40 dark:shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/[0.03] blur-[80px] -mr-32 -mt-32 pointer-events-none" />
                  
                  <Tabs value={tripType} onValueChange={(val) => { setTripType(val); setPickupInput(''); setDropInput(''); }}>
                    <TabsList className="grid grid-cols-1 sm:grid-cols-3 mb-8 bg-slate-100 dark:bg-white/5 p-1 rounded-2xl h-auto border border-slate-200/80 dark:border-white/5 gap-1 sm:gap-0">
                      <TabsTrigger value="airport" className="gap-2.5 py-3.5 rounded-xl text-slate-600 dark:text-white/60 data-[state=active]:bg-amber-500 data-[state=active]:text-slate-950 font-black transition-all text-[10px] uppercase tracking-wider">
                        <Plane className="h-4 w-4" />
                        <span>Airport Transfer</span>
                      </TabsTrigger>
                      <TabsTrigger value="local" className="gap-2.5 py-3.5 rounded-xl text-slate-600 dark:text-white/60 data-[state=active]:bg-amber-500 data-[state=active]:text-slate-950 font-black transition-all text-[10px] uppercase tracking-wider">
                        <MapIcon className="h-4 w-4" />
                        <span>Local Sightseeing</span>
                      </TabsTrigger>
                      <TabsTrigger value="outstation" className="gap-2.5 py-3.5 rounded-xl text-slate-600 dark:text-white/60 data-[state=active]:bg-amber-500 data-[state=active]:text-slate-950 font-black transition-all text-[10px] uppercase tracking-wider">
                        <Navigation className="h-4 w-4" />
                        <span>Outstation Ride</span>
                      </TabsTrigger>
                    </TabsList>

                    <div className="space-y-6 animate-in fade-in duration-500">
                      
                      {/* Pick / Drop Inputs Wrapper */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        
                        {/* Pickup Input */}
                        <div className="space-y-2 relative">
                          <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-white/40 ml-2 flex items-center gap-1.5">
                            <MapPin className="h-3 w-3 text-emerald-500" /> Pickup Location
                          </label>
                          {tripType === 'airport' && airportDirection === 'arrival' ? (
                            <div className="w-full h-14 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-2xl flex items-center px-6 font-bold text-slate-800 dark:text-white/80 text-sm">
                              Srinagar Airport (SXR)
                            </div>
                          ) : (
                            <>
                              <div className="relative">
                                <Input
                                  ref={pickupInputRef}
                                  className="h-14 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white pl-6 pr-12 font-bold focus:border-amber-500 text-sm"
                                  value={pickupInput}
                                  onChange={(e) => {
                                    setPickupInput(e.target.value);
                                    setShowPickupSuggestions(true);
                                  }}
                                  onFocus={() => setShowPickupSuggestions(true)}
                                  onBlur={() => setTimeout(() => setShowPickupSuggestions(false), 250)}
                                  placeholder="Type pickup location / hotel..."
                                />
                                <button
                                  type="button"
                                  onClick={handleDetectGps}
                                  className="absolute right-3 top-[50%] -translate-y-[50%] p-2 rounded-xl bg-slate-200/80 dark:bg-white/5 border border-slate-300 dark:border-white/10 hover:bg-slate-300 dark:hover:bg-white/10 text-amber-600 dark:text-amber-400 transition-all"
                                  title="Detect GPS Location"
                                >
                                  {detectingGps ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Navigation className="w-4 h-4 rotate-45" />
                                  )}
                                </button>
                              </div>
                              {showPickupSuggestions && pickupSuggestions.length > 0 && (
                                <div className="absolute top-[100%] left-0 right-0 z-50 bg-white dark:bg-[#0d1216]/95 border border-slate-200 dark:border-white/10 rounded-2xl mt-2 max-h-60 overflow-y-auto shadow-2xl p-2 space-y-1 backdrop-blur-md">
                                  {pickupSuggestions.map((loc, i) => (
                                    <button
                                      key={i}
                                      type="button"
                                      onClick={() => {
                                        setPickupInput(loc.name);
                                        setPickupCoords({ lat: loc.lat, lon: loc.lon, name: loc.name });
                                        setShowPickupSuggestions(false);
                                      }}
                                      className="w-full text-left px-4 py-3 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl text-xs font-bold text-slate-800 dark:text-white/80 transition-colors flex items-center gap-2"
                                    >
                                      <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                                      <div className="flex flex-col min-w-0 text-left">
                                        <span className="truncate font-bold">{loc.name}</span>
                                        <span className="text-[9px] text-slate-400 dark:text-white/30 truncate font-normal">{loc.fullName}</span>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              )}
                              {showPickupSuggestions && searchingPickup && (
                                <div className="absolute top-[100%] left-0 right-0 z-50 bg-white dark:bg-[#0d1216]/95 border border-slate-200 dark:border-white/10 rounded-2xl mt-2 p-4 shadow-2xl flex items-center justify-center gap-2 backdrop-blur-md">
                                  <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
                                  <span className="text-[10px] uppercase font-black tracking-wider text-slate-500 dark:text-white/40">Searching...</span>
                                </div>
                              )}
                            </>
                          )}
                        </div>

                        {/* Drop Input */}
                        <div className="space-y-2 relative">
                          <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-white/40 ml-2 flex items-center gap-1.5">
                            <MapPin className="h-3 w-3 text-red-500" /> Drop Destination
                          </label>
                          {tripType === 'airport' && airportDirection === 'departure' ? (
                            <div className="w-full h-14 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-2xl flex items-center px-6 font-bold text-slate-800 dark:text-white/80 text-sm">
                              Srinagar Airport (SXR)
                            </div>
                          ) : (
                            <>
                              <Input
                                ref={dropInputRef}
                                className="h-14 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white px-6 font-bold focus:border-amber-500 text-sm"
                                value={dropInput}
                                onChange={(e) => {
                                  setDropInput(e.target.value);
                                  setShowDropSuggestions(true);
                                }}
                                onFocus={() => setShowDropSuggestions(true)}
                                onBlur={() => setTimeout(() => setShowDropSuggestions(false), 250)}
                                placeholder="Type drop-off location / hotel..."
                              />
                              {showDropSuggestions && dropSuggestions.length > 0 && (
                                <div className="absolute top-[100%] left-0 right-0 z-50 bg-white dark:bg-[#0d1216]/95 border border-slate-200 dark:border-white/10 rounded-2xl mt-2 max-h-60 overflow-y-auto shadow-2xl p-2 space-y-1 backdrop-blur-md">
                                  {dropSuggestions.map((loc, i) => (
                                    <button
                                      key={i}
                                      type="button"
                                      onClick={() => {
                                        setDropInput(loc.name);
                                        setDropCoords({ lat: loc.lat, lon: loc.lon, name: loc.name });
                                        setShowDropSuggestions(false);
                                      }}
                                      className="w-full text-left px-4 py-3 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl text-xs font-bold text-slate-800 dark:text-white/80 transition-colors flex items-center gap-2"
                                    >
                                      <MapPin className="w-3.5 h-3.5 text-red-500" />
                                      <div className="flex flex-col min-w-0 text-left">
                                        <span className="truncate font-bold">{loc.name}</span>
                                        <span className="text-[9px] text-slate-400 dark:text-white/30 truncate font-normal">{loc.fullName}</span>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              )}
                              {showDropSuggestions && searchingDrop && (
                                <div className="absolute top-[100%] left-0 right-0 z-50 bg-white dark:bg-[#0d1216]/95 border border-slate-200 dark:border-white/10 rounded-2xl mt-2 p-4 shadow-2xl flex items-center justify-center gap-2 backdrop-blur-md">
                                  <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
                                  <span className="text-[10px] uppercase font-black tracking-wider text-slate-500 dark:text-white/40">Searching...</span>
                                </div>
                              )}
                            </>
                          )}
                        </div>

                      </div>

                      {/* Direction Selection for Airport */}
                      {tripType === 'airport' && (
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-white/40 ml-2 flex items-center gap-1.5">
                            <Sliders className="h-3 w-3 text-amber-500" /> Transfer Direction
                          </label>
                          <select
                            value={airportDirection}
                            onChange={(e) => {
                              setAirportDirection(e.target.value);
                              setPickupInput('');
                              setDropInput('');
                            }}
                            className="w-full h-14 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white px-6 font-bold focus:outline-none focus:border-amber-500 text-sm"
                          >
                            <option value="arrival" className="bg-white dark:bg-[#0a0f12] text-slate-900 dark:text-white">Arrival: Airport ➔ Hotel / Destination</option>
                            <option value="departure" className="bg-white dark:bg-[#0a0f12] text-slate-900 dark:text-white">Departure: Hotel / Origin ➔ Airport</option>
                          </select>
                        </div>
                      )}

                      {/* Dates / Timing Selection */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-3 border-t border-slate-200 dark:border-white/5">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-white/40 ml-2 flex items-center gap-1.5">
                            <Calendar className="h-3 w-3 text-amber-500" /> Trip Date
                          </label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full h-14 bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/10 rounded-2xl text-left font-bold text-slate-900 dark:text-white px-6 justify-between hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-all",
                                  !bookingDate && "text-slate-400 dark:text-white/40"
                                )}
                              >
                                <span>{formatDisplayDate(bookingDate)}</span>
                                <Calendar className="h-4 w-4 text-amber-500" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 bg-white dark:bg-[#0a0f12]/95 border-slate-200 dark:border-white/10 backdrop-blur-md rounded-2xl shadow-2xl" align="start">
                              <UICalendar
                                mode="single"
                                selected={parseDateString(bookingDate)}
                                onSelect={(date) => {
                                  const dateStr = formatDateToString(date);
                                  setBookingDate(dateStr);
                                  const retDate = parseDateString(returnDate);
                                  if (retDate && date && retDate < date) {
                                    setReturnDate('');
                                  }
                                }}
                                disabled={(date) => {
                                  const today = new Date();
                                  today.setHours(0, 0, 0, 0);
                                  return date < today;
                                }}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-white/40 ml-2 flex items-center gap-1.5">
                            <Clock className="h-3 w-3 text-amber-500" /> Pickup Time
                          </label>
                          <Input
                            type="time"
                            value={bookingTime}
                            onChange={(e) => setBookingTime(e.target.value)}
                            className="h-14 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white px-6 font-bold focus:border-amber-500"
                          />
                        </div>
                        {tripType === 'outstation' && (
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-white/40 ml-2 flex items-center gap-1.5">
                              <Calendar className="h-3 w-3 text-purple-500" /> Return Date (Optional)
                            </label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full h-14 bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/10 rounded-2xl text-left font-bold text-slate-900 dark:text-white px-6 justify-between hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-all",
                                    !returnDate && "text-slate-400 dark:text-white/40"
                                  )}
                                >
                                  <span>{formatDisplayDate(returnDate)}</span>
                                  <Calendar className="h-4 w-4 text-purple-500" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0 bg-white dark:bg-[#0a0f12]/95 border-slate-200 dark:border-white/10 backdrop-blur-md rounded-2xl shadow-2xl" align="start">
                                <UICalendar
                                  mode="single"
                                  selected={parseDateString(returnDate)}
                                  onSelect={(date) => setReturnDate(formatDateToString(date))}
                                  disabled={(date) => {
                                    const bookingD = bookingDate ? parseDateString(bookingDate) : undefined;
                                    const minDate = bookingD || new Date();
                                    minDate.setHours(0, 0, 0, 0);
                                    return date < minDate;
                                  }}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                        )}
                      </div>

                      {/* Interactive Map */}
                      <div className="relative w-full h-64 sm:h-80 rounded-2xl sm:rounded-[2rem] overflow-hidden border border-slate-200 dark:border-white/5 bg-slate-100 dark:bg-[#0a0f12]/30 shadow-inner group mt-4">
                        {/* Leaflet Map Div */}
                        <div ref={mapRef} className="w-full h-full z-10" />
                        
                        {!leafletLoaded && (
                          <div className="absolute inset-0 bg-white/95 dark:bg-[#0a0f12]/95 flex flex-col items-center justify-center gap-3 z-20">
                            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                            <p className="text-[10px] uppercase tracking-[0.25em] font-black text-slate-500 dark:text-white/30">Initializing Secure GPS Mapping...</p>
                          </div>
                        )}
                        
                        {leafletLoaded && !pickupCoords && !dropCoords && (
                          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6 bg-slate-950/20 dark:bg-black/50 backdrop-blur-[1px] z-20 transition-all duration-500">
                            <div className="bg-white/95 dark:bg-[#0a0f12]/95 border border-slate-200 dark:border-white/5 p-6 rounded-3xl flex flex-col items-center gap-2.5 max-w-xs text-center shadow-2xl pointer-events-auto">
                              <MapPin className="w-6 h-6 text-amber-500 animate-bounce" />
                              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white/80">Interactive GPS Routing</span>
                              <span className="text-[10px] font-bold text-slate-500 dark:text-white/40 leading-relaxed">Enter locations or use the GPS button to plot your chauffeur route.</span>
                            </div>
                          </div>
                        )}
                      </div>

                    </div>
                  </Tabs>
                </div>

                {/* Uber-Style Live Bids Dashboard or Standard Fleet */}
                {!isBroadcasting ? (
                  <div className="space-y-6 animate-in fade-in duration-500">
                    <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 dark:text-white/40">
                      <div className="w-8 h-[1px] bg-slate-300 dark:bg-white/10" />
                      <span>Select Chauffeur Class Fleet</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                      {resolvedVehicles.map((cab) => {
                        const estimatedFare = calculateFare(cab);
                        return (
                          <div
                            key={cab.id}
                            onClick={() => setSelectedCab(cab)}
                            className={cn(
                              "rounded-[2.5rem] p-6 cursor-pointer transition-all duration-500 group relative overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-xl hover:-translate-y-1",
                              selectedCab?.id === cab.id 
                                ? "border-2 border-amber-500 dark:border-amber-400 bg-amber-500/5 dark:bg-amber-400/5 shadow-amber-500/10" 
                                : "bg-white dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 hover:border-amber-400/40"
                            )}
                          >
                            <div className="space-y-5">
                              {/* Card Image with custom backdrop glow */}
                              <div className="relative h-44 overflow-hidden rounded-2xl border border-slate-200/60 dark:border-white/5 bg-slate-100 dark:bg-slate-900/60 flex items-center justify-center p-2">
                                {/* Floor shadow ellipse */}
                                <div className="absolute bottom-4 w-4/5 h-6 bg-slate-950/30 dark:bg-black/60 blur-[14px] rounded-[100%]" />
                                <img
                                  src={cab.image || ''}
                                  alt={cab.name}
                                  className="relative max-w-full max-h-full object-contain transition-all duration-[750ms] group-hover:scale-105 group-hover:-translate-y-1 drop-shadow-md"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 dark:from-black/80 via-transparent to-transparent pointer-events-none" />
                                <Badge className="absolute top-4 right-4 bg-slate-950/70 text-white border-none font-bold uppercase text-[8px] tracking-widest px-2.5 py-1 backdrop-blur-md">
                                  {cab.type}
                                </Badge>
                                {/* Stock status indicator */}
                                <Badge className={cn(
                                  "absolute bottom-4 left-4 border-none font-bold uppercase text-[8px] tracking-widest px-2.5 py-1 backdrop-blur-md",
                                  cab.availability === "Available" ? "bg-emerald-500/90 text-white" :
                                  cab.availability === "Low Stock" ? "bg-amber-500/90 text-white" : "bg-red-500/90 text-white"
                                )}>
                                  {cab.availability}
                                </Badge>
                              </div>

                              {/* Details header */}
                              <div>
                                <div className="flex justify-between items-start gap-2">
                                  <h4 className="font-display text-2xl font-black text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate">
                                    {cab.name}
                                  </h4>
                                  {selectedCab?.id === cab.id && (
                                    <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
                                      <Check className="h-3.5 w-3.5 text-slate-950 stroke-[3px]" />
                                    </div>
                                  )}
                                </div>

                                {/* Specs */}
                                <div className="flex items-center gap-4 mt-3">
                                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40 flex items-center gap-1.5">
                                    <Users className="h-3.5 w-3.5 text-amber-500" /> 
                                    <span>{cab.capacity} Seats</span>
                                  </p>
                                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40 flex items-center gap-1.5">
                                    <Sliders className="h-3.5 w-3.5 text-amber-500" />
                                    <span>{cab.luggage} Bags</span>
                                  </p>
                                </div>

                                {/* Amenities list */}
                                <div className="flex flex-wrap gap-1.5 mt-4">
                                  {cab.features.map((feature: string) => (
                                    <span key={feature} className="text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 bg-slate-100 dark:bg-white/5 rounded-xl text-slate-700 dark:text-white/60 border border-slate-200/80 dark:border-white/5">
                                      {feature}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Choose Button */}
                            <div className="pt-5 border-t border-slate-100 dark:border-white/5 flex justify-between items-center mt-6">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5" />
                                Guaranteed Rate
                              </span>
                              <Button 
                                size="sm"
                                className={cn(
                                  "h-10 rounded-xl font-black text-[10px] uppercase tracking-wider px-4 transition-all duration-300",
                                  selectedCab?.id === cab.id 
                                    ? "bg-amber-500 text-slate-950 hover:bg-amber-600 shadow-md shadow-amber-500/20" 
                                    : "bg-slate-100 dark:bg-white/5 text-slate-800 dark:text-white/70 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10"
                                )}
                              >
                                {selectedCab?.id === cab.id ? 'Selected' : 'Choose Vehicle'}
                              </Button>
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8 animate-in fade-in duration-500">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/5 pb-6">
                      <div>
                        <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25 font-black px-4 py-1.5 rounded-full text-[9px] uppercase tracking-[0.2em] mb-2 animate-pulse">
                          Live Dispatch Radar
                        </Badge>
                        <h3 className="text-2xl font-display font-black text-slate-900 dark:text-white">Incoming Driver Offers</h3>
                        <p className="text-xs text-slate-500 dark:text-white/40 mt-1 font-semibold">We found active chauffeur guides near your pickup location.</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        onClick={() => setIsBroadcasting(false)}
                        className="text-slate-600 dark:text-white/40 hover:text-slate-900 dark:hover:text-white text-xs font-black uppercase tracking-wider h-10 px-4 rounded-xl border border-slate-200 dark:border-white/5 bg-slate-100 dark:bg-white/5"
                      >
                        Reset Search
                      </Button>
                    </div>

                    {driverOffers.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-white/[0.01] border border-slate-200 dark:border-white/5 rounded-[2.5rem] space-y-6">
                        <div className="relative w-24 h-24 flex items-center justify-center">
                          <div className="absolute inset-0 rounded-full border border-amber-500/20 animate-ping" />
                          <div className="absolute w-16 h-16 rounded-full border border-amber-500/40 animate-pulse" />
                          <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/40">
                            <Car className="w-4 h-4 text-amber-500 animate-bounce" />
                          </div>
                        </div>
                        <div className="text-center space-y-2">
                          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white/70">Pinging Chauffeur Grid...</p>
                          <p className="text-[11px] text-slate-500 dark:text-white/40 max-w-xs leading-normal font-semibold">Broadcasting your route details to verified local drivers within 5km.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-6">
                        {driverOffers.map((offer) => {
                          const isNegotiating = isNegotiatingMap[offer.id];
                          const isResponding = isDriverResponding[offer.id];
                          
                          return (
                            <div 
                              key={offer.id}
                              className={cn(
                                "p-6 sm:p-8 rounded-[2.5rem] bg-white dark:bg-gradient-to-br dark:from-[#0c1215]/90 dark:to-[#070b0d]/90 border transition-all duration-500 flex flex-col justify-between gap-6 relative overflow-hidden backdrop-blur-3xl shadow-xl",
                                offer.status === 'accepted' ? "border-emerald-500/50 bg-emerald-500/5" : "border-slate-200 dark:border-white/5 hover:border-amber-500/30"
                              )}
                            >
                              <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center relative z-10">
                                <div className="flex items-center gap-5">
                                  <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0 text-xl shadow-inner relative">
                                    <Shield className="w-6 h-6 text-amber-500" />
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white dark:bg-[#05080a] rounded-full flex items-center justify-center">
                                      <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full relative flex items-center justify-center">
                                        <div className="absolute w-4 h-4 rounded-full bg-emerald-500/30 animate-ping" />
                                      </div>
                                    </div>
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2.5">
                                      <h4 className="font-display font-black text-slate-900 dark:text-white text-lg tracking-tight">{offer.driverName}</h4>
                                      <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                                        ★ {offer.driverRating}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500 dark:text-white/40 font-medium">
                                      <span>{offer.driverTours} rides completed</span>
                                      <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-white/20" />
                                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">{offer.registrationNo}</span>
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-white/30 mt-2">Vehicle: {offer.vehicleName} ({offer.vehicleType})</p>
                                  </div>
                                </div>

                                <div className="relative w-44 h-24 rounded-2xl bg-slate-100 dark:bg-slate-900/60 flex items-center justify-center p-3 border border-slate-200 dark:border-white/5 shrink-0 self-center md:self-auto shadow-inner">
                                  <img 
                                    src={offer.vehicleImage} 
                                    alt={offer.vehicleName} 
                                    className="relative max-w-full max-h-full object-contain drop-shadow-md"
                                  />
                                </div>

                                <div className="text-right self-stretch md:self-auto flex md:flex-col justify-between md:justify-center items-center md:items-end border-t md:border-t-0 border-slate-200 dark:border-white/5 pt-4 md:pt-0">
                                  <div>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30 block mb-0.5">Estimated Fare</span>
                                    <span className={cn(
                                      "text-3xl font-black tracking-tighter block",
                                      offer.status === 'accepted' ? "text-emerald-500" : "text-slate-900 dark:text-white"
                                    )}>
                                      ₹{offer.currentBid.toLocaleString()}
                                    </span>
                                  </div>
                                  {offer.status === 'countered' && (
                                    <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 mt-2 rounded-md">
                                      Counter Offer
                                    </Badge>
                                  )}
                                  {offer.status === 'accepted' && (
                                    <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 mt-2 rounded-md">
                                      Fare Confirmed
                                    </Badge>
                                  )}
                                  {offer.status === 'rejected' && (
                                    <Badge className="bg-red-500/10 text-red-500 border border-red-500/20 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 mt-2 rounded-md">
                                      Fare Rejected
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              {offer.driverMessage && (
                                <div className={cn(
                                  "p-4 rounded-2xl text-xs font-semibold leading-relaxed relative z-10",
                                  offer.status === 'accepted' ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" :
                                  offer.status === 'rejected' ? "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20" :
                                  "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20"
                                )}>
                                  {offer.driverMessage}
                                </div>
                              )}

                              <div className="flex gap-4 border-t border-slate-200 dark:border-white/5 pt-4 relative z-10">
                                {offer.status !== 'accepted' && (
                                  <>
                                    <Button
                                      onClick={() => handleAcceptOffer(offer)}
                                      disabled={isResponding}
                                      className="flex-1 h-14 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[10px] uppercase tracking-widest transition-all duration-300 shadow-lg"
                                    >
                                      Accept Ride (₹{offer.currentBid})
                                    </Button>
                                    <Button
                                      onClick={() => handleNegotiatePrice(offer.id)}
                                      disabled={isResponding || isNegotiating}
                                      variant="outline"
                                      className="flex-1 h-14 rounded-2xl border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-white/10 font-black text-[10px] uppercase tracking-widest transition-all"
                                    >
                                      Negotiate Fare
                                    </Button>
                                  </>
                                )}
                                {offer.status === 'accepted' && (
                                  <Button
                                    onClick={() => handleAcceptOffer(offer)}
                                    className="w-full h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[10px] uppercase tracking-widest transition-all duration-300 shadow-lg shadow-emerald-500/10"
                                  >
                                    Confirm booking at negotiated price
                                  </Button>
                                )}
                              </div>

                              {isNegotiating && offer.status !== 'accepted' && (
                                <div className="mt-4 p-5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 space-y-4 animate-in slide-in-from-top-3 duration-300">
                                  <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-white/40">Enter Counter Offer (₹)</label>
                                    <span className="text-[10px] font-bold text-slate-400 dark:text-white/30">Recommended counter: ₹{Math.round(offer.currentBid * 0.9)}</span>
                                  </div>
                                  <div className="flex gap-3">
                                    <Input
                                      type="number"
                                      value={counterValues[offer.id] || ''}
                                      onChange={(e) => setCounterValues(prev => ({ ...prev, [offer.id]: e.target.value }))}
                                      className="h-12 bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white font-bold px-4 focus:ring-amber-500/20"
                                      disabled={isResponding}
                                    />
                                    <Button
                                      onClick={() => handleSendCounter(offer.id)}
                                      disabled={isResponding || !counterValues[offer.id]}
                                      className="h-12 rounded-xl bg-amber-500 text-slate-950 hover:bg-amber-600 font-black text-[9px] uppercase tracking-widest px-6"
                                    >
                                      {isResponding ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        'Send Counter'
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Live Summary Sidebar */}
              <div className="lg:col-span-4">
                <div className="bg-white dark:bg-[#0a0f12]/60 border border-slate-200/80 dark:border-white/5 rounded-[2.5rem] p-6 md:p-8 backdrop-blur-xl sticky top-28 shadow-xl shadow-slate-200/40 dark:shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-32 h-32 bg-amber-400/[0.03] blur-3xl rounded-full pointer-events-none" />
                  
                  <h3 className="font-display text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    Trip Manifest
                  </h3>

                  {!isBroadcasting ? (
                    pickupInput || dropInput ? (
                      <div className="space-y-6 animate-in fade-in duration-500">
                        {/* Route specs */}
                        <div className="space-y-5">
                          <div className="flex items-start gap-4">
                            <MapPin className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30 mb-0.5">Pickup Location</p>
                              <p className="font-bold text-slate-900 dark:text-white capitalize text-xs">
                                {tripType === 'airport' && airportDirection === 'arrival' ? 'Srinagar Airport (SXR)' : (pickupInput || 'Not specified')}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-4">
                            <MapPin className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30 mb-0.5">Drop Destination</p>
                              <p className="font-bold text-slate-900 dark:text-white capitalize text-xs">
                                {tripType === 'airport' && airportDirection === 'departure' ? 'Srinagar Airport (SXR)' : (dropInput || 'Not specified')}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-4">
                            <Calendar className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30 mb-0.5">Departure Schedule</p>
                              <p className="font-bold text-slate-900 dark:text-white text-xs">
                                {bookingDate ? new Date(bookingDate).toLocaleDateString('en-IN', { 
                                  day: 'numeric', 
                                  month: 'short', 
                                  year: 'numeric' 
                                }) : 'Select Date'}
                                {bookingTime && ` at ${bookingTime}`}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Route Stats */}
                        <div className="border-t border-slate-200 dark:border-white/5 pt-5 space-y-3">
                          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                            <span className="text-slate-400 dark:text-white/40">Estimated Distance</span>
                            <span className="text-slate-900 dark:text-white">{routeStats.distance} KM</span>
                          </div>
                          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                            <span className="text-slate-400 dark:text-white/40">Estimated Duration</span>
                            <span className="text-slate-900 dark:text-white">~ {Math.floor(routeStats.duration / 60)}h {routeStats.duration % 60}m</span>
                          </div>
                          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                            <span className="text-slate-400 dark:text-white/40">Tolls & Fuel</span>
                            <span className="text-emerald-600 dark:text-emerald-400">Included in Quote</span>
                          </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-400/5 border border-amber-500/20 dark:border-amber-400/10 flex gap-3 items-start text-left">
                          <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                          <div>
                            <h5 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-wider mb-1">Direct Driver Dispatch</h5>
                            <p className="text-[10px] text-slate-600 dark:text-white/50 leading-relaxed font-semibold">
                              Broadcast your request to active chauffeur guides in Srinagar. You can negotiate and agree on the fare before locking it in.
                            </p>
                          </div>
                        </div>

                        <Button
                          onClick={handleStartBroadcast}
                          className="w-full h-14 rounded-2xl bg-amber-500 text-slate-950 hover:bg-amber-600 font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-amber-500/20 transition-all duration-300 active:scale-95 flex items-center justify-center gap-2"
                        >
                          <span>Broadcast Ride Request</span>
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-16 opacity-40">
                        <Car className="w-12 h-12 mx-auto text-slate-600 dark:text-white mb-3 animate-pulse" />
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 dark:text-white">Enter route to search available cabs</p>
                      </div>
                    )
                  ) : (
                    /* Broadcasting Sidebar State */
                    <div className="space-y-6 animate-in fade-in duration-500">
                      <div className="p-6 rounded-3xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-12 h-12 rounded-full border-2 border-amber-500 border-t-transparent animate-spin flex items-center justify-center" />
                        <div>
                          <p className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 animate-pulse">Broadcast Active</p>
                          <p className="text-[10px] text-slate-500 dark:text-white/40 mt-1">Review driver offers on the dashboard.</p>
                        </div>
                      </div>

                      <div className="space-y-3 text-xs">
                        <div className="flex justify-between border-b border-slate-200 dark:border-white/5 pb-2">
                          <span className="text-slate-400 dark:text-white/40">Route</span>
                          <span className="font-bold text-slate-900 dark:text-white capitalize">{pickupInput.split(',')[0]} ➔ {dropInput.split(',')[0]}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200 dark:border-white/5 pb-2">
                          <span className="text-slate-400 dark:text-white/40">Distance</span>
                          <span className="font-bold text-slate-900 dark:text-white">{routeStats.distance} KM</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200 dark:border-white/5 pb-2">
                          <span className="text-slate-400 dark:text-white/40">Schedule</span>
                          <span className="font-bold text-slate-900 dark:text-white">{bookingDate} @ {bookingTime}</span>
                        </div>
                      </div>

                      <p className="text-[10px] text-slate-500 dark:text-white/40 leading-relaxed font-semibold">
                        Driver offers will appear in real-time. You can select your preferred chauffeur guides and accept their offers, or choose "Negotiate" to counter-propose a different rate.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Real-time Live Tracking Panel */
        <div className="container mx-auto px-6 pt-36 pb-24 max-w-4xl space-y-10 animate-in fade-in zoom-in-95 duration-500">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-200 dark:border-white/5 pb-6">
            <div>
              <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25 font-black px-4 py-1.5 rounded-full text-[9px] uppercase tracking-[0.2em]">
                Live Dispatch Console
              </Badge>
              <h1 className="text-3xl sm:text-4xl font-display font-black text-slate-900 dark:text-white mt-3">Tracking Chauffeur Dispatch</h1>
              <p className="text-slate-500 dark:text-white/40 text-xs mt-1">Ref code: <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">{bookingRefNo}</span></p>
            </div>
            
            <div className="flex gap-4">
              <Button 
                onClick={() => setIsTracking(false)} 
                variant="outline" 
                className="rounded-xl border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-800 dark:text-white text-[10px] font-black uppercase tracking-wider px-5 h-12"
              >
                New Booking
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            
            {/* Tracking Map Visual */}
            <Card className="md:col-span-8 bg-white dark:bg-[#0a0f12]/60 border border-slate-200/80 dark:border-white/5 p-6 sm:p-8 rounded-[2.5rem] space-y-8 relative overflow-hidden shadow-xl flex flex-col justify-between min-h-[450px]">
              {/* Heading */}
              <div className="flex justify-between items-center z-10">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/30 flex items-center gap-2">
                  <Map className="w-4 h-4 text-amber-500" /> Dispatch Route
                </span>
                <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-none px-3 py-1 font-bold text-[9px] uppercase tracking-wider">
                  GPS Active
                </Badge>
              </div>

              {/* Animated Map Trace Visual */}
              <div className="relative flex-1 flex items-center justify-center py-12 z-10">
                <svg viewBox="0 0 400 150" className="w-full max-w-lg overflow-visible">
                  <defs>
                    <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="50%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#ef4444" />
                    </linearGradient>
                  </defs>

                  {/* Route Dash line */}
                  <path 
                    d="M 50 75 Q 200 10 350 75" 
                    fill="none" 
                    stroke="url(#routeGrad)" 
                    strokeWidth="3" 
                    strokeDasharray="8 6" 
                    opacity="0.3" 
                  />

                  {/* Dynamic Filled Line */}
                  <path 
                    d="M 50 75 Q 200 10 350 75" 
                    fill="none" 
                    stroke="url(#routeGrad)" 
                    strokeWidth="4.5" 
                    strokeLinecap="round"
                    strokeDasharray="400"
                    strokeDashoffset={Math.max(0, 400 - Math.min(trackingStep, 4) * 100)}
                    className="transition-all duration-[4000ms] ease-in-out"
                  />

                  {/* Pickup Point */}
                  <circle cx="50" cy="75" r="7" fill="#10b981" />
                  <circle cx="50" cy="75" r="14" fill="#10b981" fillOpacity="0.15" className="animate-ping" />
                  <text x="50" y="105" fontFamily="sans-serif" fontSize="10" fontWeight="bold" fill="#0284c7" textAnchor="middle">
                    {pickupInput.split(',')[0]}
                  </text>

                  {/* Drop Point */}
                  <circle cx="350" cy="75" r="7" fill="#ef4444" />
                  <text x="350" y="105" fontFamily="sans-serif" fontSize="10" fontWeight="bold" fill="#ef4444" textAnchor="middle">
                    {dropInput.split(',')[0]}
                  </text>

                  {/* Active Vehicle Dot/Car */}
                  <g transform={`translate(${50 + Math.min(trackingStep, 4) * 75}, ${75 - (trackingStep > 0 && trackingStep < 4 ? (trackingStep === 2 ? 40 : 25) : 0)})`} className="transition-all duration-[4000ms] ease-in-out">
                    <circle cx="0" cy="0" r="10" fill="#f59e0b" className="shadow-lg" />
                    <Car className="w-3.5 h-3.5 text-black absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 shrink-0 transform -translate-y-[7px] -translate-x-[7px]" />
                  </g>
                </svg>
              </div>

              {/* Footer info */}
              <div className="flex justify-between items-center text-xs border-t border-slate-200 dark:border-white/5 pt-6 z-10">
                <div className="text-left">
                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-white/20">Estimated Route</p>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5">{routeStats.distance} km • ~ {Math.floor(routeStats.duration / 60)}h {routeStats.duration % 60}m</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-white/20">Ride status</p>
                  <p className="font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                    {trackingStep === 0 && 'Awaiting allocation...'}
                    {trackingStep === 1 && 'Chauffeur allocated & en route!'}
                    {trackingStep === 2 && 'Chauffeur arrived at pickup!'}
                    {trackingStep === 3 && 'On trip — heading to destination'}
                    {trackingStep >= 4 && 'Trip completed safely!'}
                  </p>
                </div>
              </div>

            </Card>

            {/* Stepper Timeline Panel & Driver Info */}
            <div className="md:col-span-4 space-y-6">
              
              {/* Stepper progress */}
              <Card className="bg-white dark:bg-[#0a0f12]/60 border border-slate-200/80 dark:border-white/5 p-6 rounded-[2.5rem] space-y-6 shadow-xl">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-white/40">Trip Progress</h3>
                
                <div className="space-y-6 relative pl-6 before:absolute before:left-[10px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200 dark:before:bg-white/5">
                  {/* Step 1 */}
                  <div className="relative flex gap-4">
                    <div className="absolute -left-[22px] w-4.5 h-4.5 rounded-full bg-emerald-500 border border-white dark:border-black flex items-center justify-center shadow-lg">
                      <Check className="w-3 h-3 text-white stroke-[3px]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">Booking Confirmed</p>
                      <p className="text-[9px] text-slate-500 dark:text-white/40 mt-0.5">Ref generated: {bookingRefNo}</p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="relative flex gap-4">
                    <div className={cn(
                      "absolute -left-[22px] w-4.5 h-4.5 rounded-full border border-white dark:border-black flex items-center justify-center shadow-lg transition-colors duration-500",
                      trackingStep >= 1 ? "bg-emerald-500" : "bg-slate-200 dark:bg-white/5"
                    )}>
                      {trackingStep >= 1 ? <Check className="w-3 h-3 text-white stroke-[3px]" /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-white/20" />}
                    </div>
                    <div>
                      <p className={cn("text-xs font-bold transition-colors duration-500", trackingStep >= 1 ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-white/30")}>Chauffeur Assigned & En Route</p>
                      <p className="text-[9px] text-slate-500 dark:text-white/40 mt-0.5">{trackingStep >= 1 ? `${allocatedDriver?.driverName || 'Assigned Chauffeur'} dispatched` : 'Locating nearest driver...'}</p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="relative flex gap-4">
                    <div className={cn(
                      "absolute -left-[22px] w-4.5 h-4.5 rounded-full border border-white dark:border-black flex items-center justify-center shadow-lg transition-colors duration-500",
                      trackingStep >= 2 ? "bg-emerald-500" : "bg-slate-200 dark:bg-white/5"
                    )}>
                      {trackingStep >= 2 ? <Check className="w-3 h-3 text-white stroke-[3px]" /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-white/20" />}
                    </div>
                    <div>
                      <p className={cn("text-xs font-bold transition-colors duration-500", trackingStep >= 2 ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-white/30")}>Arrived at Pickup Point</p>
                      <p className="text-[9px] text-slate-500 dark:text-white/40 mt-0.5">{trackingStep >= 2 ? 'Chauffeur waiting at pickup' : 'En route to your pickup hub'}</p>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="relative flex gap-4">
                    <div className={cn(
                      "absolute -left-[22px] w-4.5 h-4.5 rounded-full border border-white dark:border-black flex items-center justify-center shadow-lg transition-colors duration-500",
                      trackingStep >= 3 ? "bg-emerald-500" : "bg-slate-200 dark:bg-white/5"
                    )}>
                      {trackingStep >= 3 ? <Check className="w-3 h-3 text-white stroke-[3px]" /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-white/20" />}
                    </div>
                    <div>
                      <p className={cn("text-xs font-bold transition-colors duration-500", trackingStep >= 3 ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-white/30")}>
                        {trackingStep >= 4 ? 'Trip Completed' : 'Journey In Progress'}
                      </p>
                      <p className="text-[9px] text-slate-500 dark:text-white/40 mt-0.5">
                        {trackingStep >= 4 ? 'Reached destination safely' : trackingStep >= 3 ? 'Passenger onboard — heading to drop-off' : 'Pending Boarding PIN check'}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Chauffeur Card */}
              {trackingStep >= 1 ? (
                <Card className="bg-white dark:bg-[#0a0f12]/60 border border-slate-200/80 dark:border-white/5 p-6 rounded-[2.5rem] space-y-6 shadow-xl animate-in slide-in-from-bottom-5 duration-500">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-white/40">Allocated Chauffeur</h3>
                  
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 font-bold text-lg">
                      {(allocatedDriver?.driverName || 'Shabir Ahmad').split(' ').map((n: string) => n[0]).join('')}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-base">{allocatedDriver?.driverName || 'Shabir Ahmad'}</h4>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40 flex items-center gap-1.5 mt-1">
                        <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                        <span>{allocatedDriver?.driverRating || 4.8} Rating ({allocatedDriver?.driverTours || 89} Tours)</span>
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-white/5 text-xs">
                    {boardingPin && (
                      <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-300">
                          Boarding Security PIN
                        </span>
                        <span
                          data-testid="tourist-boarding-pin"
                          className="font-mono font-black text-lg text-amber-600 dark:text-amber-300 tracking-widest"
                        >
                          {boardingPin}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-white/40">Vehicle Model</span>
                      <span className="font-bold text-slate-900 dark:text-white">{selectedCab?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-white/40">License Plate</span>
                      <span className="font-mono font-bold text-amber-600 dark:text-amber-400 uppercase">{allocatedDriver?.registrationNo || 'JK01-CAB'}</span>
                    </div>
                    {allocatedDriver?.driverPhone && (
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-white/40">Driver Phone</span>
                        <span className="font-bold text-slate-900 dark:text-white">{allocatedDriver.driverPhone}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-slate-200 dark:border-white/5 pt-3">
                      <span className="text-slate-500 dark:text-white/40 font-bold">Confirmed Fare</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">₹{(finalAgreedFare || 0).toLocaleString()}</span>
                    </div>
                  </div>

                  {allocatedDriver?.driverPhone && (
                    <div className="pt-2">
                      <a 
                        href={`https://wa.me/${allocatedDriver.driverPhone.replace(/[^0-9]/g, '')}?text=Hi%20${encodeURIComponent(allocatedDriver.driverName || 'Pilot')},%20I%20am%20your%20guest%20for%20booking%20${bookingRefNo}.`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full h-12 rounded-xl bg-[#25D366] hover:bg-[#128C7E] text-white font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>WhatsApp Chauffeur</span>
                      </a>
                    </div>
                  )}
                </Card>
              ) : (
                <Card className="bg-white dark:bg-[#0a0f12]/60 border border-slate-200 dark:border-white/5 p-6 rounded-[2.5rem] text-center py-12 opacity-50">
                  <Loader2 className="w-8 h-8 mx-auto text-amber-500 animate-spin mb-3" />
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-white">Locating chauffeur close to you...</p>
                </Card>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Checkout Gateway Dialog */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="max-w-md bg-white dark:bg-[#070b0e] border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-[2.5rem] overflow-hidden p-6 sm:p-8">
          <DialogHeader className="mb-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-wider w-fit mb-2">
              <Shield className="w-3.5 h-3.5 text-amber-500" /> Confirmed Chauffeur Ride
            </div>
            <DialogTitle className="text-2xl font-display font-black text-slate-900 dark:text-white uppercase leading-tight">
              Confirm Negotiated Ride
            </DialogTitle>
            <p className="text-slate-500 dark:text-white/50 text-xs">Review finalized ride details before locking in the dispatch.</p>
          </DialogHeader>

          {checkoutStatus === 'processing' && (
            <div className="py-16 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="w-14 h-14 text-amber-500 animate-spin" />
              <p className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-white/40 animate-pulse">Confirming ride with chauffeur...</p>
            </div>
          )}

          {checkoutStatus === 'success' && (
            <div className="text-center space-y-6 py-6 animate-in fade-in duration-500">
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/25 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Ride Booked Successfully!</h3>
                <p className="text-xs text-slate-500 dark:text-white/50 font-medium">Your chauffeur is confirmed at the negotiated price.</p>
                <div className="mt-4 p-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-2xl space-y-2">
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-white/40">Confirmation code</span>
                    <p className="font-mono text-sm font-black text-amber-600 dark:text-amber-400 mt-0.5">{bookingRefNo}</p>
                  </div>
                  {boardingPin && (
                    <div className="pt-2 border-t border-slate-200 dark:border-white/10">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-white/40">
                        4-Digit Boarding Security PIN
                      </span>
                      <p className="font-mono text-xl font-black text-emerald-500 mt-0.5 tracking-widest">{boardingPin}</p>
                    </div>
                  )}
                </div>
              </div>
              <Button 
                onClick={() => { setShowCheckout(false); setIsTracking(true); }}
                className="w-full h-14 bg-amber-500 text-slate-950 hover:bg-amber-600 font-black rounded-2xl text-[10px] uppercase tracking-widest transition-all duration-300 shadow-xl shadow-amber-500/20"
              >
                Track Live Status
              </Button>
            </div>
          )}

          {checkoutStatus === 'idle' && (
            <div className="space-y-5">
              
              {/* Checkout details */}
              <div className="p-4 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl flex justify-between items-center">
                <div className="min-w-0">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-white/40 block">Chauffeur Guide</span>
                  <span className="font-bold text-sm text-slate-900 dark:text-white block truncate">{allocatedDriver?.driverName}</span>
                  <span className="text-[10px] text-slate-500 dark:text-white/40 block mt-0.5">{selectedCab?.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-white/40 block">Agreed Fare</span>
                  <span className="font-black text-xl text-amber-600 dark:text-amber-400 block mt-0.5">₹{(finalAgreedFare || 0).toLocaleString()}</span>
                </div>
              </div>

              {/* Special notes textarea */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-white/40 block ml-1">Special Notes (Optional)</label>
                <textarea 
                  value={specialNotes}
                  onChange={(e) => setSpecialNotes(e.target.value)}
                  placeholder="e.g. child seats, excess luggage, custom stops..."
                  className="w-full h-20 p-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder-white/20 focus:outline-none focus:border-amber-500 resize-none font-bold"
                />
              </div>

              <div className="space-y-4 pt-2">
                <div className="p-3.5 bg-amber-500/10 dark:bg-amber-400/5 border border-amber-500/20 dark:border-amber-400/10 rounded-2xl flex gap-2.5 text-slate-700 dark:text-white/70">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-normal font-medium">
                    This booking has been pre-negotiated and will be confirmed immediately at ₹{(finalAgreedFare || 0).toLocaleString()} total cost.
                  </p>
                </div>

                <Button 
                  onClick={handleConfirmPayment}
                  className="w-full h-14 bg-amber-500 text-slate-950 hover:bg-amber-600 font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-xl shadow-amber-500/20"
                >
                  Confirm & Book Chauffeur
                </Button>
              </div>

            </div>
          )}

        </DialogContent>
      </Dialog>

      <AutoCabPopupCards
        open={showAutoPopup && !isTracking}
        onDismiss={() => {
          setShowAutoPopup(false);
          setPopupDismissedManually(true);
        }}
        onReopen={() => {
          setPopupDismissedManually(false);
          setShowAutoPopup(true);
          void fetchLiveMatches();
        }}
        matches={liveMatches}
        onlineDriversCount={onlineDriversCount}
        estimatedKm={liveEstimatedKm}
        pickupLabel={
          tripType === 'airport' && airportDirection === 'arrival'
            ? 'Srinagar Airport (SXR)'
            : pickupInput || 'Srinagar Airport (SXR)'
        }
        dropLabel={
          tripType === 'airport' && airportDirection === 'departure'
            ? 'Srinagar Airport (SXR)'
            : dropInput || 'Dal Lake / Gulmarg'
        }
        corridorAdvisory={corridorAdvisory}
        activeReservationId={activeReservationId}
        activeReservationStatus={activeReservationStatus}
        liveOffers={liveDispatchOffers}
        onSelectCorridor={(corridor) => {
          setTripType(corridor.tripType);
          setPickupInput(corridor.pickup);
          setDropInput(corridor.drop);
          if (!bookingDate) {
            setBookingDate(new Date().toISOString().slice(0, 10));
          }
        }}
        onRequestCab={async (match, customFare) => {
          if (!bookingDate) {
            setBookingDate(new Date().toISOString().slice(0, 10));
          }
          const matchedUiCab = resolvedVehicles.find((v) => v.id === match.cabId);
          if (matchedUiCab) setSelectedCab(matchedUiCab);
          await createLiveRideRequest({
            preferredCab: match,
            preferredDriverProfileId: match.driverProfileId,
            customFare,
          });
        }}
        onCounterOffer={async (offerId, counterFare) => {
          await sendTouristCounterToApi(offerId, counterFare);
        }}
        onConfirmOffer={async (offer) => {
          const uiOffer = mapOfferToUiCard(offer, resolvedVehicles.find((v) => v.id === offer.cabId));
          handleAcceptOffer(uiOffer);
        }}
      />

      <Footer />
      <FloatingActions />
    </div>
  );
}
