import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Car, MapPin, Calendar, Clock, Users, Plane, MapIcon, Navigation, 
  Loader2, CheckCircle, Shield, AlertCircle, ArrowRight, Smartphone, Sparkles, Send, IndianRupee, Sliders,
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
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
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
  const { isAuthenticated, addBooking } = useAuth();
  const { data: dbCabs = [], isLoading: isLoadingCabs } = useCabs();
  
  const [selectedCab, setSelectedCab] = useState<any>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutMethod, setCheckoutMethod] = useState<'upi' | 'cash'>('upi');
  const [checkoutStatus, setCheckoutStatus] = useState<'idle' | 'processing' | 'success'>('idle');
  const [bookingRefNo, setBookingRefNo] = useState('');

  // Uber Bidding States
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [driverOffers, setDriverOffers] = useState<any[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [isNegotiatingMap, setIsNegotiatingMap] = useState<Record<string, boolean>>({});
  const [counterValues, setCounterValues] = useState<Record<string, string>>({});
  const [isDriverResponding, setIsDriverResponding] = useState<Record<string, boolean>>({});
  const [finalAgreedFare, setFinalAgreedFare] = useState<number>(0);
  const [allocatedDriver, setAllocatedDriver] = useState<any>(null);
  
  // Tracking timeline console state
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
      setLeafletLoaded(true);
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
    if (window.google && window.google.maps) {
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

    const autocompletePickup = new window.google.maps.places.Autocomplete(pickupInputRef.current, options);
    const autocompleteDrop = new window.google.maps.places.Autocomplete(dropInputRef.current, options);

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
    const distance = routeStats.distance;
    let baseFare = cab.basePrice;
    let distanceCost = distance * cab.pricePerKm;
    let total = baseFare + distanceCost;
    
    if (tripType === 'outstation' && returnDate) {
      total *= 1.8; // roundtrip factor
    }
    return Math.round(total);
  };

  // Merge database items with standard UI categories
  const resolvedVehicles = dbCabs.length > 0 ? dbCabs.map(db => {
    // If it is cab-fortuner or includes "fortuner", map it to Urbania!
    const isFortuner = db.name.toLowerCase().includes("fortuner") || db.id === "cab-fortuner";
    
    const displayName = isFortuner ? "Force Urbania Luxury" : db.name;
    const displayType = isFortuner ? "Luxury Cruiser" : db.type;
    const displayCapacity = isFortuner ? 10 : db.capacity;
    
    const standard = standardVehicles.find(s => 
      (isFortuner && s.id === "standard-urbania") ||
      db.name.toLowerCase().includes(s.name.split(' ')[0].toLowerCase()) || 
      db.type.toLowerCase() === s.type.toLowerCase()
    ) || {
      features: [],
      capacity: displayCapacity,
      luggage: 4,
      availability: "Available"
    };

    let imagePath = "";
    if (isFortuner) {
      imagePath = "/images/tourist_urbania.png";
    } else if (db.name.toLowerCase().includes("sedan") || db.name.toLowerCase().includes("etios") || db.name.toLowerCase().includes("dzire")) {
      imagePath = "/images/tourist_sedan.png";
    } else if (db.name.toLowerCase().includes("ertiga")) {
      imagePath = "/images/tourist_ertiga.png";
    } else if (db.name.toLowerCase().includes("crysta") || (db.name.toLowerCase().includes("innova") && db.name.toLowerCase().includes("luxury"))) {
      imagePath = "/images/tourist_innova.png";
    } else if (db.name.toLowerCase().includes("traveller") || db.name.toLowerCase().includes("tempo")) {
      imagePath = "/images/tourist_tempo.png";
    } else {
      imagePath = "/images/tourist_innova.png"; // default fallback
    }

    return {
      id: db.id,
      name: displayName,
      type: displayType,
      capacity: displayCapacity,
      pricePerKm: db.pricePerKm,
      basePrice: db.basePrice,
      image: imagePath,
      features: isFortuner ? ["Luxury Captain Seats", "Climate Control AC", "Ample Luggage Space", "Premium Audio System"] : (Array.isArray(db.features) ? db.features : (standard.features || [])),
      luggage: isFortuner ? 6 : (standard.luggage || 4),
      availability: standard.availability || "Available"
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

  // Start Uber-style Broadcast and matching simulation
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

    setIsBroadcasting(true);
    setDriverOffers([]);
    setSelectedOffer(null);
    setTrackingStep(0);

    // Simulate bids arriving in real-time for the selected cab type
    const timers = [
      setTimeout(() => {
        const fare = calculateFare(selectedCab);
        setDriverOffers(prev => [...prev, {
          id: 'driver-offer-1',
          driverName: 'Verified Chauffeur #104',
          driverPhone: '+919906771122',
          driverRating: 4.85,
          driverTours: 124,
          vehicleName: selectedCab.name,
          vehicleType: selectedCab.type,
          vehicleImage: selectedCab.image,
          capacity: selectedCab.capacity,
          luggage: selectedCab.luggage,
          features: selectedCab.features,
          initialBid: Math.round(fare * 0.95),
          currentBid: Math.round(fare * 0.95),
          status: 'received',
          registrationNo: 'JK-01-AB-7700',
          cabObject: selectedCab
        }]);
      }, 1200),

      setTimeout(() => {
        const fare = calculateFare(selectedCab);
        setDriverOffers(prev => [...prev, {
          id: 'driver-offer-2',
          driverName: 'Verified Chauffeur #208',
          driverPhone: '+919906334455',
          driverRating: 4.92,
          driverTours: 215,
          vehicleName: selectedCab.name,
          vehicleType: selectedCab.type,
          vehicleImage: selectedCab.image,
          capacity: selectedCab.capacity,
          luggage: selectedCab.luggage,
          features: selectedCab.features,
          initialBid: Math.round(fare * 1.05),
          currentBid: Math.round(fare * 1.05),
          status: 'received',
          registrationNo: 'JK-01-AB-1122',
          cabObject: selectedCab
        }]);
      }, 2800),

      setTimeout(() => {
        const fare = calculateFare(selectedCab);
        setDriverOffers(prev => [...prev, {
          id: 'driver-offer-3',
          driverName: 'Verified Chauffeur #312',
          driverPhone: '+919906112233',
          driverRating: 4.78,
          driverTours: 98,
          vehicleName: selectedCab.name,
          vehicleType: selectedCab.type,
          vehicleImage: selectedCab.image,
          capacity: selectedCab.capacity,
          luggage: selectedCab.luggage,
          features: selectedCab.features,
          initialBid: Math.round(fare * 1.0),
          currentBid: Math.round(fare * 1.0),
          status: 'received',
          registrationNo: 'JK-01-AB-8899',
          cabObject: selectedCab
        }]);
      }, 4400)
    ];

    return () => timers.forEach(t => clearTimeout(t));
  };

  const handleNegotiatePrice = (offerId: string) => {
    setIsNegotiatingMap(prev => ({ ...prev, [offerId]: true }));
    const offer = driverOffers.find(o => o.id === offerId);
    if (offer) {
      setCounterValues(prev => ({ ...prev, [offerId]: Math.round(offer.currentBid * 0.9).toString() }));
    }
  };

  const handleSendCounter = (offerId: string) => {
    const counterVal = parseInt(counterValues[offerId]);
    const offer = driverOffers.find(o => o.id === offerId);
    if (!offer || isNaN(counterVal)) return;

    setIsDriverResponding(prev => ({ ...prev, [offerId]: true }));

    setTimeout(() => {
      setIsDriverResponding(prev => ({ ...prev, [offerId]: false }));

      const initialBid = offer.initialBid;
      const currentBid = offer.currentBid;
      const ratio = counterVal / currentBid;

      setDriverOffers(prev => prev.map(o => {
        if (o.id !== offerId) return o;

        let status: any = o.status;
        let bid = o.currentBid;
        let msg = '';

        if (ratio >= 0.85) {
          status = 'accepted';
          bid = counterVal;
          msg = `Deal! I accept ₹${counterVal.toLocaleString()}. Let's proceed!`;
          toast.success(`${o.driverName} accepted your offer of ₹${counterVal.toLocaleString()}!`);
        } else if (ratio >= 0.7) {
          status = 'countered';
          const midpoint = Math.round((currentBid + counterVal) / 2);
          bid = midpoint;
          msg = `I can compromise at ₹${midpoint.toLocaleString()}. Fuel costs are high, but this is the best I can do.`;
        } else {
          status = 'rejected';
          msg = `Sorry, ₹${counterVal.toLocaleString()} is too low for this route. Chauffeur won't be able to cover toll and fuel expenses. Best offer is ₹${Math.round(initialBid * 0.95).toLocaleString()}.`;
        }

        return {
          ...o,
          status,
          currentBid: bid,
          driverMessage: msg
        };
      }));
    }, 2000);
  };

  const handleAcceptOffer = (offer: any) => {
    setSelectedOffer(offer);
    setSelectedCab(offer.cabObject);
    setFinalAgreedFare(offer.currentBid);
    setAllocatedDriver({
      driverName: offer.driverName,
      driverPhone: offer.driverPhone,
      registrationNo: offer.registrationNo,
      driverRating: offer.driverRating,
      driverTours: offer.driverTours,
      currentBid: offer.currentBid,
    });
    setCheckoutStatus('idle');
    setShowCheckout(true);
  };

  // Simulate Timeline Dispatch Stepper
  useEffect(() => {
    if (!isTracking) return;
    
    const timers = [
      setTimeout(() => setTrackingStep(1), 5000),  // Driver assigned
      setTimeout(() => setTrackingStep(2), 12000), // Dispatched
      setTimeout(() => setTrackingStep(3), 20000), // Arrived
    ];

    return () => timers.forEach(t => clearTimeout(t));
  }, [isTracking]);

  // Confirm booking & payment (Negotiated Fare Flow)
  const handleConfirmPayment = async () => {
    if (!selectedCab || !allocatedDriver) return;
    setCheckoutStatus('processing');
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const ref = `KC-CAB-${Math.floor(100000 + Math.random() * 900000)}`;
    setBookingRefNo(ref);

    const tripLabel = tripType === 'airport' 
      ? `Airport transfer: ${pickupInput || 'Srinagar Airport'} ➔ ${dropInput || 'Srinagar Airport'}`
      : `Sightseeing Route: ${pickupInput} ➔ ${dropInput}${returnDate ? ' (Roundtrip)' : ''}`;

    const totalFare = finalAgreedFare;

    const bookingDetails = {
      pickupLocation: tripType === 'airport' && airportDirection === 'arrival' ? 'Srinagar Airport (SXR)' : pickupInput,
      dropLocation: tripType === 'airport' && airportDirection === 'departure' ? 'Srinagar Airport (SXR)' : dropInput,
      pickupDateTime: `${bookingDate}T${bookingTime}`,
      dropDateTime: returnDate ? `${returnDate}T18:00` : `${bookingDate}T18:00`,
      tripType,
      estimatedDistance: routeStats.distance,
      paymentMethod: 'negotiated-bidding',
      bookingRef: ref,
      specialNotes,
      cabAllocation: {
        cabId: selectedCab.id,
        cabName: selectedCab.name,
        cabType: selectedCab.type,
        ownership: 'company',
        registrationNo: allocatedDriver.registrationNo,
        driverName: allocatedDriver.driverName,
        driverPhone: allocatedDriver.driverPhone,
        pickupDateTime: `${bookingDate}T${bookingTime}`,
        dropDateTime: returnDate ? `${returnDate}T18:00` : `${bookingDate}T18:00`,
        pickupLocation: pickupInput,
        dropLocation: dropInput,
        allocatedDates: [bookingDate],
        pricing: {
          pricePerKm: selectedCab.pricePerKm,
          estimatedKm: routeStats.distance,
          baseCost: selectedCab.basePrice,
          driverAllowance: 1500,
          fuelExpenses: 3000,
          tollsExpenses: 350,
          vendorPayout: 0,
          otherExpenses: 0,
          totalCost: totalFare,
          margin: 0,
          marginPercent: 0
        },
        voucherGenerated: false,
        whatsappSent: false
      }
    };

    try {
      await addBooking({
        booking_type: 'cab',
        item_name: tripLabel,
        booking_date: new Date(`${bookingDate}T${bookingTime}`),
        status: 'confirmed', // immediately active since negotiated!
        total_amount: totalFare,
        details: bookingDetails,
      });

      // Quiet log
      const token = localStorage.getItem('auth_token');
      await fetch(`${API_BASE_URL}/cabs/operations/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          message: `Customer ride negotiation finalized at ₹${totalFare.toLocaleString()} with ${allocatedDriver.driverName} (${selectedCab.name}).`
        })
      });

      setCheckoutStatus('success');
      toast.success('Ride Booked Successfully!');
    } catch (err) {
      toast.error('Booking failed. Please try again.');
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
    <div className="min-h-screen bg-[#05080a] text-white selection:bg-kashmir-gold/30">
      <Navbar />

      {!isTracking ? (
        <>
          {/* Hero Banner Section */}
          <div className="relative pt-36 pb-24 lg:pt-48 lg:pb-36 overflow-hidden">
            <div className="absolute inset-0 bg-cover bg-center transition-all duration-1000 scale-105" style={{ backgroundImage: `url("${heroImage}")` }}>
              <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#05080a] via-transparent to-black/30" />
            </div>
            
            <div className="container mx-auto px-6 relative z-10 text-center space-y-6">
              <Badge className="bg-kashmir-gold/10 text-kashmir-gold border-kashmir-gold/25 font-black px-5 py-1.5 rounded-full text-[10px] uppercase tracking-[0.25em] mx-auto w-fit">
                VIP Chauffeur & Logistics Engine
              </Badge>
              <h1 className="font-display text-5xl md:text-7xl font-black text-white leading-tight tracking-tight max-w-4xl mx-auto">
                {heroTitle}
              </h1>
              <p className="text-white/60 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
                {heroSubtitle}
              </p>
            </div>
          </div>

          <div className="container mx-auto px-6 pb-24">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              
              {/* Form Input Side */}
              <div className="lg:col-span-8 space-y-12">
                
                {/* Search Configuration */}
                <div className="bg-[#0a0f12]/60 border border-white/5 rounded-[3rem] p-8 md:p-10 backdrop-blur-3xl relative overflow-hidden shadow-2xl">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-kashmir-gold/[0.01] blur-[80px] -mr-32 -mt-32" />
                  
                  <Tabs value={tripType} onValueChange={(val) => { setTripType(val); setPickupInput(''); setDropInput(''); }}>
                    <TabsList className="grid grid-cols-1 sm:grid-cols-3 mb-10 bg-white/5 p-1 rounded-2xl h-auto border border-white/5 gap-1 sm:gap-0">
                      <TabsTrigger value="airport" className="gap-2.5 py-4 rounded-xl data-[state=active]:bg-kashmir-gold data-[state=active]:text-black transition-all text-[9px] sm:text-[10px] font-black uppercase tracking-widest">
                        <Plane className="h-4 w-4" />
                        <span>Airport Transfer</span>
                      </TabsTrigger>
                      <TabsTrigger value="local" className="gap-2.5 py-4 rounded-xl data-[state=active]:bg-kashmir-gold data-[state=active]:text-black transition-all text-[9px] sm:text-[10px] font-black uppercase tracking-widest">
                        <MapIcon className="h-4 w-4" />
                        <span>Local Sightseeing</span>
                      </TabsTrigger>
                      <TabsTrigger value="outstation" className="gap-2.5 py-4 rounded-xl data-[state=active]:bg-kashmir-gold data-[state=active]:text-black transition-all text-[9px] sm:text-[10px] font-black uppercase tracking-widest">
                        <Navigation className="h-4 w-4" />
                        <span>Outstation Ride</span>
                      </TabsTrigger>
                    </TabsList>

                    <div className="space-y-8 animate-in fade-in duration-500">
                      
                      {/* Pick / Drop Inputs Wrapper */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* Pickup Input */}
                        <div className="space-y-2 relative">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 ml-4 flex items-center gap-2">
                            <MapPin className="h-3 w-3 text-emerald-500" /> Pickup Location
                          </label>
                          {tripType === 'airport' && airportDirection === 'arrival' ? (
                            <div className="w-full h-14 bg-white/5 border border-white/5 rounded-2xl flex items-center px-6 font-bold text-white/50 text-sm">
                              Srinagar Airport (SXR)
                            </div>
                          ) : (
                            <>
                              <div className="relative">
                                <Input
                                  ref={pickupInputRef}
                                  className="h-14 bg-white/[0.03] border border-white/5 rounded-2xl text-white pl-6 pr-12 font-bold focus:border-kashmir-gold/45 text-sm"
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
                                  className="absolute right-3 top-[50%] -translate-y-[50%] p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-kashmir-gold transition-all"
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
                                <div className="absolute top-[100%] left-0 right-0 z-50 bg-[#0d1216]/95 border border-white/10 rounded-2xl mt-2 max-h-60 overflow-y-auto shadow-2xl p-2 space-y-1 backdrop-blur-md">
                                  {pickupSuggestions.map((loc, i) => (
                                    <button
                                      key={i}
                                      type="button"
                                      onClick={() => {
                                        setPickupInput(loc.name);
                                        setPickupCoords({ lat: loc.lat, lon: loc.lon, name: loc.name });
                                        setShowPickupSuggestions(false);
                                      }}
                                      className="w-full text-left px-4 py-3 hover:bg-white/5 rounded-xl text-xs font-bold text-white/80 transition-colors flex items-center gap-2"
                                    >
                                      <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                                      <div className="flex flex-col min-w-0 text-left">
                                        <span className="truncate font-bold">{loc.name}</span>
                                        <span className="text-[8px] text-white/30 truncate font-normal">{loc.fullName}</span>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              )}
                              {showPickupSuggestions && searchingPickup && (
                                <div className="absolute top-[100%] left-0 right-0 z-50 bg-[#0d1216]/95 border border-white/10 rounded-2xl mt-2 p-4 shadow-2xl flex items-center justify-center gap-2 backdrop-blur-md">
                                  <Loader2 className="w-4 h-4 text-kashmir-gold animate-spin" />
                                  <span className="text-[10px] uppercase font-black tracking-wider text-white/40">Searching...</span>
                                </div>
                              )}
                            </>
                          )}
                        </div>

                        {/* Drop Input */}
                        <div className="space-y-2 relative">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 ml-4 flex items-center gap-2">
                            <MapPin className="h-3 w-3 text-red-500" /> Drop Location
                          </label>
                          {tripType === 'airport' && airportDirection === 'departure' ? (
                            <div className="w-full h-14 bg-white/5 border border-white/5 rounded-2xl flex items-center px-6 font-bold text-white/50 text-sm">
                              Srinagar Airport (SXR)
                            </div>
                          ) : (
                            <>
                              <Input
                                ref={dropInputRef}
                                className="h-14 bg-white/[0.03] border-white/5 rounded-2xl text-white px-6 font-bold focus:border-kashmir-gold/45 text-sm"
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
                                <div className="absolute top-[100%] left-0 right-0 z-50 bg-[#0d1216]/95 border border-white/10 rounded-2xl mt-2 max-h-60 overflow-y-auto shadow-2xl p-2 space-y-1 backdrop-blur-md">
                                  {dropSuggestions.map((loc, i) => (
                                    <button
                                      key={i}
                                      type="button"
                                      onClick={() => {
                                        setDropInput(loc.name);
                                        setDropCoords({ lat: loc.lat, lon: loc.lon, name: loc.name });
                                        setShowDropSuggestions(false);
                                      }}
                                      className="w-full text-left px-4 py-3 hover:bg-white/5 rounded-xl text-xs font-bold text-white/80 transition-colors flex items-center gap-2"
                                    >
                                      <MapPin className="w-3.5 h-3.5 text-red-500" />
                                      <div className="flex flex-col min-w-0 text-left">
                                        <span className="truncate font-bold">{loc.name}</span>
                                        <span className="text-[8px] text-white/30 truncate font-normal">{loc.fullName}</span>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              )}
                              {showDropSuggestions && searchingDrop && (
                                <div className="absolute top-[100%] left-0 right-0 z-50 bg-[#0d1216]/95 border border-white/10 rounded-2xl mt-2 p-4 shadow-2xl flex items-center justify-center gap-2 backdrop-blur-md">
                                  <Loader2 className="w-4 h-4 text-kashmir-gold animate-spin" />
                                  <span className="text-[10px] uppercase font-black tracking-wider text-white/40">Searching...</span>
                                </div>
                              )}
                            </>
                          )}
                        </div>

                      </div>

                      {/* Direction Selection for Airport */}
                      {tripType === 'airport' && (
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 ml-4 flex items-center gap-2">
                            <Sliders className="h-3 w-3 text-kashmir-gold" /> Transfer Direction
                          </label>
                          <select
                            value={airportDirection}
                            onChange={(e) => {
                              setAirportDirection(e.target.value);
                              setPickupInput('');
                              setDropInput('');
                            }}
                            className="w-full h-14 bg-white/[0.03] border border-white/5 rounded-2xl text-white px-6 font-bold focus:outline-none focus:border-kashmir-gold/45 text-sm"
                          >
                            <option value="arrival" className="bg-[#0a0f12]">Arrival: Airport ➔ Hotel / Destination</option>
                            <option value="departure" className="bg-[#0a0f12]">Departure: Hotel / Origin ➔ Airport</option>
                          </select>
                        </div>
                      )}

                      {/* Dates / Timing Selection */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-white/5">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 ml-4 flex items-center gap-2">
                            <Calendar className="h-3 w-3 text-kashmir-gold" /> Trip Date
                          </label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full h-14 bg-white/[0.03] border-white/5 rounded-2xl text-left font-bold text-white px-6 justify-between hover:bg-white/[0.08] hover:text-white transition-all",
                                  !bookingDate && "text-white/40"
                                )}
                              >
                                <span>{formatDisplayDate(bookingDate)}</span>
                                <Calendar className="h-4 w-4 text-white/40" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 bg-[#0a0f12]/95 border-white/10 backdrop-blur-md rounded-2xl shadow-2xl" align="start">
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
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 ml-4 flex items-center gap-2">
                            <Clock className="h-3 w-3" /> Pickup Time
                          </label>
                          <Input
                            type="time"
                            value={bookingTime}
                            onChange={(e) => setBookingTime(e.target.value)}
                            className="h-14 bg-white/[0.03] border border-white/5 rounded-2xl text-white px-6 font-bold focus:border-kashmir-gold/45"
                          />
                        </div>
                        {tripType === 'outstation' && (
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 ml-4 flex items-center gap-2">
                              <Calendar className="h-3 w-3 text-purple-400" /> Return Date (Optional)
                            </label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full h-14 bg-white/[0.03] border-white/5 rounded-2xl text-left font-bold text-white px-6 justify-between hover:bg-white/[0.08] hover:text-white transition-all",
                                    !returnDate && "text-white/40"
                                  )}
                                >
                                  <span>{formatDisplayDate(returnDate)}</span>
                                  <Calendar className="h-4 w-4 text-white/40" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0 bg-[#0a0f12]/95 border-white/10 backdrop-blur-md rounded-2xl shadow-2xl" align="start">
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
                      <div className="relative w-full h-80 rounded-[2rem] overflow-hidden border border-white/5 bg-[#0a0f12]/30 shadow-inner group mt-4">
                        {/* Leaflet Map Div */}
                        <div ref={mapRef} className="w-full h-full z-10" />
                        
                        {!leafletLoaded && (
                          <div className="absolute inset-0 bg-[#0a0f12]/95 flex flex-col items-center justify-center gap-3 z-20">
                            <Loader2 className="w-8 h-8 text-kashmir-gold animate-spin" />
                            <p className="text-[10px] uppercase tracking-[0.25em] font-black text-white/30">Initializing Secure GPS Mapping...</p>
                          </div>
                        )}
                        
                        {leafletLoaded && !pickupCoords && !dropCoords && (
                          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6 bg-black/50 backdrop-blur-[1px] z-20 transition-all duration-500">
                            <div className="bg-[#0a0f12]/95 border border-white/5 p-6 rounded-3xl flex flex-col items-center gap-2.5 max-w-xs text-center shadow-2xl pointer-events-auto">
                              <MapPin className="w-6 h-6 text-kashmir-gold animate-bounce" />
                              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">Interactive GPS Routing</span>
                              <span className="text-[9px] font-bold text-white/40 leading-relaxed">Enter locations or use the GPS button to plot your chauffeur route.</span>
                            </div>
                          </div>
                        )}
                      </div>

                    </div>
                  </Tabs>
                </div>

                {/* Uber-Style Live Bids Dashboard or Standard Fleet */}
                {!isBroadcasting ? (
                  <div className="space-y-8 animate-in fade-in duration-500">
                    <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-white/30">
                      <div className="w-8 h-[1px] bg-white/10" />
                      <span>Select Chauffeur Class Fleet</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {resolvedVehicles.map((cab) => {
                        const estimatedFare = calculateFare(cab);
                        return (
                          <div
                            key={cab.id}
                            onClick={() => setSelectedCab(cab)}
                            className={cn(
                              "bg-white/[0.01] border rounded-[2.5rem] p-6 cursor-pointer transition-all duration-500 group relative overflow-hidden flex flex-col justify-between",
                              selectedCab?.id === cab.id 
                                ? "border-kashmir-gold/50 bg-kashmir-gold/[0.02] shadow-[0_0_50px_-12px_rgba(212,175,55,0.08)]" 
                                : "border-white/5 hover:border-white/10 hover:bg-white/[0.02]"
                            )}
                          >
                            <div className="space-y-5">
                              {/* Card Image with custom backdrop glow */}
                              <div className="relative h-44 overflow-hidden rounded-2xl border border-white/5 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.12)_0%,transparent_75%)] flex items-center justify-center p-2">
                                {/* Floor shadow ellipse */}
                                <div className="absolute bottom-4 w-4/5 h-6 bg-black/60 blur-[14px] rounded-[100%]" />
                                <img
                                  src={cab.image || ''}
                                  alt={cab.name}
                                  className="relative max-w-full max-h-full object-contain transition-all duration-[750ms] group-hover:scale-105 group-hover:-translate-y-2 drop-shadow-[0_15px_20px_rgba(0,0,0,0.5)] group-hover:drop-shadow-[0_20px_25px_rgba(212,175,55,0.15)]"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none" />
                                <Badge className="absolute top-4 right-4 bg-black/60 text-white border-none font-bold uppercase text-[8px] tracking-widest px-2.5 py-1 backdrop-blur-md">
                                  {cab.type}
                                </Badge>
                                {/* Stock status indicator */}
                                <Badge className={cn(
                                  "absolute bottom-4 left-4 border-none font-bold uppercase text-[8px] tracking-widest px-2.5 py-1 backdrop-blur-md",
                                  cab.availability === "Available" ? "bg-emerald-500/20 text-emerald-400" :
                                  cab.availability === "Low Stock" ? "bg-amber-500/20 text-amber-400" : "bg-red-500/20 text-red-400"
                                )}>
                                  {cab.availability}
                                </Badge>
                              </div>

                              {/* Details header */}
                              <div>
                                <div className="flex justify-between items-start gap-2">
                                  <h4 className="font-display text-2xl font-black text-white group-hover:text-kashmir-gold transition-colors truncate">{cab.name}</h4>
                                  {selectedCab?.id === cab.id && (
                                    <div className="w-6 h-6 rounded-full bg-kashmir-gold flex items-center justify-center shadow-lg shadow-kashmir-gold/20 shrink-0">
                                      <Check className="h-3.5 w-3.5 text-black stroke-[3px]" />
                                    </div>
                                  )}
                                </div>

                                {/* Specs */}
                                <div className="flex items-center gap-4 mt-3">
                                  <p className="text-[9px] font-black uppercase tracking-widest text-white/40 flex items-center gap-1.5">
                                    <Users className="h-3.5 w-3.5 text-kashmir-gold" /> 
                                    <span>{cab.capacity} Seats</span>
                                  </p>
                                  <p className="text-[9px] font-black uppercase tracking-widest text-white/40 flex items-center gap-1.5">
                                    <Sliders className="h-3.5 w-3.5 text-kashmir-gold" />
                                    <span>{cab.luggage} Bags</span>
                                  </p>
                                </div>

                                {/* Amenities list */}
                                <div className="flex flex-wrap gap-1.5 mt-4">
                                  {cab.features.map((feature: string) => (
                                    <span key={feature} className="text-[8px] font-black uppercase tracking-widest px-2.5 py-1 bg-white/5 rounded-md text-white/40 border border-white/5">
                                      {feature}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Choose Button */}
                            <div className="pt-6 border-t border-white/5 flex justify-between items-center mt-6">
                              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5" />
                                Best Fare Rate Guaranteed
                              </span>
                              <Button 
                                size="sm"
                                className={cn(
                                  "h-10 rounded-xl font-black text-[9px] uppercase tracking-widest px-4 transition-all duration-300",
                                  selectedCab?.id === cab.id 
                                    ? "bg-kashmir-gold text-black hover:bg-amber-500" 
                                    : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10"
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
                    <div className="flex items-center justify-between border-b border-white/5 pb-6">
                      <div>
                        <Badge className="bg-kashmir-gold/10 text-kashmir-gold border-kashmir-gold/25 font-black px-4 py-1.5 rounded-full text-[9px] uppercase tracking-[0.2em] mb-2 animate-pulse">
                          Live Dispatch Radar
                        </Badge>
                        <h3 className="text-2xl font-display font-black text-white">Incoming Driver Offers</h3>
                        <p className="text-xs text-white/40 mt-1 font-semibold">We found active chauffeur guides near your pickup location.</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        onClick={() => setIsBroadcasting(false)}
                        className="text-white/40 hover:text-white text-xs font-black uppercase tracking-wider h-10 px-4 rounded-xl border border-white/5 bg-white/5"
                      >
                        Reset Search
                      </Button>
                    </div>

                    {driverOffers.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 bg-white/[0.01] border border-white/5 rounded-[2.5rem] space-y-6">
                        <div className="relative w-24 h-24 flex items-center justify-center">
                          <div className="absolute inset-0 rounded-full border border-kashmir-gold/20 animate-ping" />
                          <div className="absolute w-16 h-16 rounded-full border border-kashmir-gold/40 animate-pulse" />
                          <div className="w-8 h-8 rounded-full bg-kashmir-gold/20 flex items-center justify-center border border-kashmir-gold/40">
                            <Car className="w-4 h-4 text-kashmir-gold animate-bounce" />
                          </div>
                        </div>
                        <div className="text-center space-y-2">
                          <p className="text-xs font-black uppercase tracking-[0.2em] text-white/70">Pinging Chauffeur Grid...</p>
                          <p className="text-[10px] text-white/30 max-w-xs leading-normal font-semibold">Broadcasting your route details to verified local drivers within 5km.</p>
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
                                "p-8 rounded-[2.5rem] bg-gradient-to-br from-[#0c1215]/90 to-[#070b0d]/90 border transition-all duration-500 flex flex-col justify-between gap-6 relative overflow-hidden backdrop-blur-3xl shadow-2xl",
                                offer.status === 'accepted' ? "border-emerald-500/25 bg-emerald-500/[0.02]" : "border-white/5 hover:border-kashmir-gold/25"
                              )}
                            >
                              <div className="absolute top-0 right-0 w-64 h-64 bg-kashmir-gold/[0.01] blur-[80px] -mr-32 -mt-32 pointer-events-none" />

                              <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center relative z-10">
                                <div className="flex items-center gap-5">
                                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-kashmir-gold/10 to-amber-600/10 border border-kashmir-gold/20 flex items-center justify-center font-display font-black text-kashmir-gold shrink-0 text-xl shadow-inner relative">
                                    <Shield className="w-6 h-6 text-kashmir-gold" />
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#05080a] rounded-full flex items-center justify-center">
                                      <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full relative flex items-center justify-center">
                                        <div className="absolute w-4 h-4 rounded-full bg-emerald-500/30 animate-ping" />
                                      </div>
                                    </div>
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2.5">
                                      <h4 className="font-display font-black text-white text-lg tracking-tight">{offer.driverName}</h4>
                                      <span className="flex items-center gap-1 text-[9px] font-bold text-kashmir-gold bg-kashmir-gold/5 px-2 py-0.5 rounded-full border border-kashmir-gold/10">
                                        ★ {offer.driverRating}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-3 mt-1.5 text-xs text-white/40 font-medium">
                                      <span>{offer.driverTours} rides completed</span>
                                      <div className="w-1 h-1 rounded-full bg-white/20" />
                                      <span className="text-[10px] font-black uppercase tracking-wider text-kashmir-gold">{offer.registrationNo}</span>
                                    </div>
                                    <p className="text-[9px] font-black uppercase tracking-[0.15em] text-white/30 mt-2">Vehicle: {offer.vehicleName} ({offer.vehicleType})</p>
                                  </div>
                                </div>

                                <div className="relative w-44 h-24 rounded-2xl bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.1)_0%,transparent_75%)] flex items-center justify-center p-3 border border-white/5 shrink-0 self-center md:self-auto shadow-inner">
                                  {/* Floor shadow ellipse */}
                                  <div className="absolute bottom-2 w-4/5 h-4 bg-black/60 blur-[10px] rounded-[100%]" />
                                  <img 
                                    src={offer.vehicleImage} 
                                    alt={offer.vehicleName} 
                                    className="relative max-w-full max-h-full object-contain drop-shadow-[0_10px_15px_rgba(0,0,0,0.5)]"
                                  />
                                </div>

                                <div className="text-right self-stretch md:self-auto flex md:flex-col justify-between md:justify-center items-center md:items-end border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
                                  <div>
                                    <span className="text-[8px] font-black uppercase tracking-widest text-white/30 block mb-0.5">Estimated Fare</span>
                                    <span className={cn(
                                      "text-3xl font-black tracking-tighter block",
                                      offer.status === 'accepted' ? "text-emerald-400" : "text-white"
                                    )}>
                                      ₹{offer.currentBid.toLocaleString()}
                                    </span>
                                  </div>
                                  {offer.status === 'countered' && (
                                    <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 mt-2 rounded-md">
                                      Counter Offer
                                    </Badge>
                                  )}
                                  {offer.status === 'accepted' && (
                                    <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 mt-2 rounded-md">
                                      Fare Confirmed
                                    </Badge>
                                  )}
                                  {offer.status === 'rejected' && (
                                    <Badge className="bg-red-500/10 text-red-400 border border-red-500/20 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 mt-2 rounded-md">
                                      Fare Rejected
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              {offer.driverMessage && (
                                <div className={cn(
                                  "p-4 rounded-2xl text-xs font-semibold leading-relaxed relative z-10",
                                  offer.status === 'accepted' ? "bg-emerald-500/5 text-emerald-400 border border-emerald-500/10" :
                                  offer.status === 'rejected' ? "bg-red-500/5 text-red-400 border border-red-500/10" :
                                  "bg-white/5 text-amber-400 border border-white/5"
                                )}>
                                  {offer.driverMessage}
                                </div>
                              )}

                              <div className="flex gap-4 border-t border-white/5 pt-4 relative z-10">
                                {offer.status !== 'accepted' && (
                                  <>
                                    <Button
                                      onClick={() => handleAcceptOffer(offer)}
                                      disabled={isResponding}
                                      className="flex-1 h-14 rounded-2xl bg-white text-black hover:bg-kashmir-gold hover:text-black font-black text-[10px] uppercase tracking-widest transition-all duration-300 shadow-lg"
                                    >
                                      Accept Ride (₹{offer.currentBid})
                                    </Button>
                                    <Button
                                      onClick={() => handleNegotiatePrice(offer.id)}
                                      disabled={isResponding || isNegotiating}
                                      variant="outline"
                                      className="flex-1 h-14 rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10 font-black text-[10px] uppercase tracking-widest transition-all"
                                    >
                                      Negotiate Fare
                                    </Button>
                                  </>
                                )}
                                {offer.status === 'accepted' && (
                                  <Button
                                    onClick={() => handleAcceptOffer(offer)}
                                    className="w-full h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-black font-black text-[10px] uppercase tracking-widest transition-all duration-300 shadow-lg shadow-emerald-500/10 animate-bounce"
                                  >
                                    Confirm booking at negotiated price
                                  </Button>
                                )}
                              </div>

                              {isNegotiating && offer.status !== 'accepted' && (
                                <div className="mt-4 p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4 animate-in slide-in-from-top-3 duration-300">
                                  <div className="flex items-center justify-between">
                                    <label className="text-[9px] font-black uppercase tracking-wider text-white/40">Enter Counter Offer (₹)</label>
                                    <span className="text-[9px] font-bold text-white/30">Recommended counter: ₹{Math.round(offer.currentBid * 0.9)}</span>
                                  </div>
                                  <div className="flex gap-3">
                                    <Input
                                      type="number"
                                      value={counterValues[offer.id] || ''}
                                      onChange={(e) => setCounterValues(prev => ({ ...prev, [offer.id]: e.target.value }))}
                                      className="h-12 bg-white/5 border-white/10 rounded-xl text-white font-bold px-4 focus:ring-kashmir-gold/20"
                                      disabled={isResponding}
                                    />
                                    <Button
                                      onClick={() => handleSendCounter(offer.id)}
                                      disabled={isResponding || !counterValues[offer.id]}
                                      className="h-12 rounded-xl bg-kashmir-gold text-black hover:bg-amber-500 font-black text-[9px] uppercase tracking-widest px-6"
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
                <div className="bg-[#0a0f12]/60 border border-white/5 rounded-[3rem] p-8 md:p-10 backdrop-blur-3xl sticky top-32 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-32 h-32 bg-kashmir-gold/[0.01] blur-3xl rounded-full" />
                  
                  <h3 className="font-display text-xl font-black text-white uppercase tracking-wider mb-8 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-kashmir-gold" />
                    Trip Manifest
                  </h3>

                  {!isBroadcasting ? (
                    pickupInput || dropInput ? (
                      <div className="space-y-8 animate-in fade-in duration-500">
                        {/* Route specs */}
                        <div className="space-y-6">
                          <div className="flex items-start gap-4">
                            <MapPin className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-0.5">Pickup Location</p>
                              <p className="font-bold text-white capitalize text-xs">
                                {tripType === 'airport' && airportDirection === 'arrival' ? 'Srinagar Airport (SXR)' : (pickupInput || 'Not specified')}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-4">
                            <MapPin className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-0.5">Drop Destination</p>
                              <p className="font-bold text-white capitalize text-xs">
                                {tripType === 'airport' && airportDirection === 'departure' ? 'Srinagar Airport (SXR)' : (dropInput || 'Not specified')}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-4">
                            <Calendar className="h-5 w-5 text-kashmir-gold mt-0.5 shrink-0" />
                            <div>
                              <p className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-0.5">Departure Schedule</p>
                              <p className="font-bold text-white text-xs">
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
                        <div className="border-t border-white/5 pt-6 space-y-4">
                          <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                            <span className="text-white/20">Estimated Distance</span>
                            <span className="text-white/60">{routeStats.distance} KM</span>
                          </div>
                          <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                            <span className="text-white/20">Estimated Duration</span>
                            <span className="text-white/60">~ {Math.floor(routeStats.duration / 60)}h {routeStats.duration % 60}m</span>
                          </div>
                          <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                            <span className="text-white/20">Tolls & Fuel</span>
                            <span className="text-emerald-400">Included in Quote</span>
                          </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-kashmir-gold/5 border border-kashmir-gold/10 flex gap-3 items-start text-left">
                          <Sparkles className="w-5 h-5 text-kashmir-gold shrink-0 mt-0.5" />
                          <div>
                            <h5 className="text-[10px] font-black text-white uppercase tracking-wider mb-1">Uber-style Booking</h5>
                            <p className="text-[9px] text-white/50 leading-relaxed font-semibold">
                              Broadcast your request to active chauffeur guides in Srinagar. You can negotiate and agree on the fare before locking it in.
                            </p>
                          </div>
                        </div>

                        <Button
                          onClick={handleStartBroadcast}
                          className="w-full h-16 rounded-2xl bg-kashmir-gold text-black hover:bg-amber-500 font-black text-[10px] uppercase tracking-[0.25em] shadow-xl transition-all duration-300 active:scale-95 flex items-center justify-center gap-2"
                        >
                          <span>Broadcast Ride Request</span>
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-20 opacity-30">
                        <Car className="w-12 h-12 mx-auto text-white mb-4 animate-pulse" />
                        <p className="text-[9px] font-black uppercase tracking-[0.2em]">Enter route to search available cabs</p>
                      </div>
                    )
                  ) : (
                    /* Broadcasting Sidebar State */
                    <div className="space-y-8 animate-in fade-in duration-500">
                      <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-12 h-12 rounded-full border-2 border-kashmir-gold border-t-transparent animate-spin flex items-center justify-center" />
                        <div>
                          <p className="text-xs font-black uppercase tracking-wider text-kashmir-gold animate-pulse">Broadcast Active</p>
                          <p className="text-[10px] text-white/40 mt-1">Review driver offers on the dashboard.</p>
                        </div>
                      </div>

                      <div className="space-y-4 text-xs">
                        <div className="flex justify-between border-b border-white/5 pb-2">
                          <span className="text-white/30">Route</span>
                          <span className="font-bold text-white capitalize">{pickupInput.split(',')[0]} ➔ {dropInput.split(',')[0]}</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-2">
                          <span className="text-white/30">Distance</span>
                          <span className="font-bold text-white">{routeStats.distance} KM</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-2">
                          <span className="text-white/30">Schedule</span>
                          <span className="font-bold text-white">{bookingDate} @ {bookingTime}</span>
                        </div>
                      </div>

                      <p className="text-[10px] text-white/40 leading-relaxed font-semibold">
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
        /* Uber-style Real-time Live Tracking Panel */
        <div className="container mx-auto px-6 pt-36 pb-24 max-w-4xl space-y-10 animate-in fade-in zoom-in-95 duration-500">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/5 pb-6">
            <div>
              <Badge className="bg-kashmir-gold/10 text-kashmir-gold border-kashmir-gold/25 font-black px-4 py-1.5 rounded-full text-[9px] uppercase tracking-[0.2em]">
                Live Dispatch Console
              </Badge>
              <h1 className="text-4xl font-display font-black text-white mt-3">Tracking Chauffeur Dispatch</h1>
              <p className="text-white/40 text-xs mt-1">Ref code: <span className="font-mono text-kashmir-gold font-bold">{bookingRefNo}</span></p>
            </div>
            
            <div className="flex gap-4">
              <Button 
                onClick={() => setIsTracking(false)} 
                variant="outline" 
                className="rounded-xl border-white/10 bg-white/5 text-[9px] font-black uppercase tracking-widest px-5 h-12"
              >
                New Booking
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
            
            {/* Tracking Map Visual */}
            <Card className="md:col-span-8 bg-[#0a0f12]/60 border border-white/5 p-8 rounded-[3rem] space-y-8 relative overflow-hidden shadow-2xl flex flex-col justify-between min-h-[450px]">
              {/* Decorative radial gradients to look futuristic/luxurious */}
              <div className="absolute -top-12 -left-12 w-48 h-48 bg-emerald-500/10 blur-[80px] rounded-full" />
              <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-kashmir-gold/10 blur-[80px] rounded-full" />

              {/* Heading */}
              <div className="flex justify-between items-center z-10">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/30 flex items-center gap-2">
                  <Map className="w-4 h-4 text-kashmir-gold" /> Dispatch Route
                </span>
                <Badge className="bg-emerald-500/15 text-emerald-400 border-none px-3 py-1 font-bold text-[9px] uppercase tracking-wider">
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
                    strokeDashoffset={400 - (trackingStep * 133)} 
                    className="transition-all duration-[4000ms] ease-in-out"
                  />

                  {/* Pickup Point */}
                  <circle cx="50" cy="75" r="7" fill="#10b981" />
                  <circle cx="50" cy="75" r="14" fill="#10b981" fillOpacity="0.15" className="animate-ping" />
                  <text x="50" y="105" fontFamily="sans-serif" fontSize="10" fontWeight="bold" fill="#ffffff" textAnchor="middle" opacity="0.8">
                    {pickupInput.split(',')[0]}
                  </text>

                  {/* Drop Point */}
                  <circle cx="350" cy="75" r="7" fill="#ef4444" />
                  <text x="350" y="105" fontFamily="sans-serif" fontSize="10" fontWeight="bold" fill="#ffffff" textAnchor="middle" opacity="0.8">
                    {dropInput.split(',')[0]}
                  </text>

                  {/* Active Vehicle Dot/Car */}
                  <g transform={`translate(${50 + (trackingStep * 100)}, ${75 - (trackingStep > 0 ? (trackingStep === 1 ? 40 : 25) : 0)})`} className="transition-all duration-[4000ms] ease-in-out">
                    <circle cx="0" cy="0" r="10" fill="#f59e0b" className="shadow-lg" />
                    <Car className="w-3.5 h-3.5 text-black absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 shrink-0 transform -translate-y-[7px] -translate-x-[7px]" />
                  </g>
                </svg>
              </div>

              {/* Footer info */}
              <div className="flex justify-between items-center text-xs border-t border-white/5 pt-6 z-10">
                <div className="text-left">
                  <p className="text-[8px] font-black uppercase tracking-wider text-white/20">Estimated Route</p>
                  <p className="font-bold text-white mt-0.5">{routeStats.distance} km • ~ {Math.floor(routeStats.duration / 60)}h {routeStats.duration % 60}m</p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] font-black uppercase tracking-wider text-white/20">Ride status</p>
                  <p className="font-bold text-kashmir-gold mt-0.5">
                    {trackingStep === 0 && 'Awaiting allocation...'}
                    {trackingStep === 1 && 'Chauffeur allocated!'}
                    {trackingStep === 2 && 'Chauffeur dispatched (On route)'}
                    {trackingStep === 3 && 'Driver arrived at pickup!'}
                  </p>
                </div>
              </div>

            </Card>

            {/* Stepper Timeline Panel & Driver Info */}
            <div className="md:col-span-4 space-y-8">
              
              {/* Stepper progress */}
              <Card className="bg-[#0a0f12]/60 border border-white/5 p-6 rounded-[2.5rem] space-y-6 shadow-2xl">
                <h3 className="text-xs font-black uppercase tracking-widest text-white/40">Trip Progress</h3>
                
                <div className="space-y-6 relative pl-6 before:absolute before:left-[10px] before:top-2 before:bottom-2 before:w-[2px] before:bg-white/5">
                  {/* Step 1 */}
                  <div className="relative flex gap-4">
                    <div className="absolute -left-[22px] w-4.5 h-4.5 rounded-full bg-emerald-500 border border-black flex items-center justify-center shadow-lg">
                      <Check className="w-3 h-3 text-black stroke-[3px]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Booking Confirmed</p>
                      <p className="text-[9px] text-white/40 mt-0.5">Ref generated: {bookingRefNo}</p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="relative flex gap-4">
                    <div className={cn(
                      "absolute -left-[22px] w-4.5 h-4.5 rounded-full border border-black flex items-center justify-center shadow-lg transition-colors duration-500",
                      trackingStep >= 1 ? "bg-emerald-500" : "bg-white/5"
                    )}>
                      {trackingStep >= 1 ? <Check className="w-3 h-3 text-black stroke-[3px]" /> : <div className="w-1.5 h-1.5 rounded-full bg-white/20" />}
                    </div>
                    <div>
                      <p className={cn("text-xs font-bold transition-colors duration-500", trackingStep >= 1 ? "text-white" : "text-white/30")}>Chauffeur Assigned</p>
                      <p className="text-[9px] text-white/40 mt-0.5">{trackingStep >= 1 ? `${allocatedDriver?.driverName || 'Shabir Ahmad'} assigned` : 'Locating nearest driver...'}</p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="relative flex gap-4">
                    <div className={cn(
                      "absolute -left-[22px] w-4.5 h-4.5 rounded-full border border-black flex items-center justify-center shadow-lg transition-colors duration-500",
                      trackingStep >= 2 ? "bg-emerald-500" : "bg-white/5"
                    )}>
                      {trackingStep >= 2 ? <Check className="w-3 h-3 text-black stroke-[3px]" /> : <div className="w-1.5 h-1.5 rounded-full bg-white/20" />}
                    </div>
                    <div>
                      <p className={cn("text-xs font-bold transition-colors duration-500", trackingStep >= 2 ? "text-white" : "text-white/30")}>Driver Dispatched</p>
                      <p className="text-[9px] text-white/40 mt-0.5">{trackingStep >= 2 ? 'En route to your location' : 'Awaiting dispatch schedule'}</p>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="relative flex gap-4">
                    <div className={cn(
                      "absolute -left-[22px] w-4.5 h-4.5 rounded-full border border-black flex items-center justify-center shadow-lg transition-colors duration-500",
                      trackingStep >= 3 ? "bg-emerald-500" : "bg-white/5"
                    )}>
                      {trackingStep >= 3 ? <Check className="w-3 h-3 text-black stroke-[3px]" /> : <div className="w-1.5 h-1.5 rounded-full bg-white/20" />}
                    </div>
                    <div>
                      <p className={cn("text-xs font-bold transition-colors duration-500", trackingStep >= 3 ? "text-white" : "text-white/30")}>Arrived at Pickup</p>
                      <p className="text-[9px] text-white/40 mt-0.5">{trackingStep >= 3 ? 'Chauffeur waiting outside' : 'Waiting for chauffeur arrival'}</p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Chauffeur Card */}
              {trackingStep >= 1 ? (
                <Card className="bg-[#0a0f12]/60 border border-white/5 p-6 rounded-[2.5rem] space-y-6 shadow-2xl animate-in slide-in-from-bottom-5 duration-500">
                  <h3 className="text-xs font-black uppercase tracking-widest text-white/40">Allocated Chauffeur</h3>
                  
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 shrink-0 font-bold text-lg">
                      {(allocatedDriver?.driverName || 'Shabir Ahmad').split(' ').map((n: string) => n[0]).join('')}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-base">{allocatedDriver?.driverName || 'Shabir Ahmad'}</h4>
                      <p className="text-[9px] font-black uppercase tracking-widest text-white/40 flex items-center gap-1.5 mt-1">
                        <Star className="h-3 w-3 text-kashmir-gold fill-kashmir-gold" />
                        <span>{allocatedDriver?.driverRating || 4.8} Rating ({allocatedDriver?.driverTours || 89} Tours)</span>
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-white/5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-white/40">Vehicle Model</span>
                      <span className="font-bold text-white">{selectedCab?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/40">License Plate</span>
                      <span className="font-mono font-bold text-kashmir-gold uppercase">{allocatedDriver?.registrationNo || 'JK-01-AB-7700'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/40">Driver Phone</span>
                      <span className="font-bold text-white">{allocatedDriver?.driverPhone || '+91 9906 771122'}</span>
                    </div>
                    <div className="flex justify-between border-t border-white/5 pt-3">
                      <span className="text-white/40 font-bold">Negotiated Fare</span>
                      <span className="font-bold text-emerald-400">₹{(finalAgreedFare || 0).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5 flex gap-3">
                    <a 
                      href={`https://wa.me/${(allocatedDriver?.driverPhone || '+919906771122').replace(/[^0-9]/g, '')}?text=Hi%20${encodeURIComponent(allocatedDriver?.driverName || 'Shabir')},%20I%20am%20the%20guest%20for%20the%20booking%20${bookingRefNo}.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 h-12 rounded-xl bg-[#25D366] hover:bg-[#128C7E] text-white font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg transition-all"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>WhatsApp Chauffeur</span>
                    </a>
                  </div>
                </Card>
              ) : (
                <Card className="bg-[#0a0f12]/60 border border-white/5 p-6 rounded-[2.5rem] text-center py-12 opacity-40">
                  <Loader2 className="w-8 h-8 mx-auto text-kashmir-gold animate-spin mb-3" />
                  <p className="text-[9px] font-black uppercase tracking-wider">Locating chauffeur close to you...</p>
                </Card>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Checkout Gateway Dialog */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="max-w-md bg-[#0a0f12] border-white/10 text-white rounded-[2rem] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-kashmir-gold/5 via-transparent to-transparent pointer-events-none" />
          
          <DialogHeader className="p-8 pb-0">
            <DialogTitle className="text-2xl font-display font-black tracking-tight text-white uppercase flex items-center gap-2">
              <Shield className="w-6 h-6 text-kashmir-gold" />
              Confirm Negotiated Ride
            </DialogTitle>
            <p className="text-white/40 text-[10px] uppercase font-black tracking-wider mt-1">Review finalized ride and driver details</p>
          </DialogHeader>

          {checkoutStatus === 'processing' && (
            <div className="p-8 py-20 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="w-16 h-16 text-kashmir-gold animate-spin" />
              <p className="text-xs font-black uppercase tracking-widest text-white/30 animate-pulse">Confirming ride with chauffeur...</p>
            </div>
          )}

          {checkoutStatus === 'success' && (
            <div className="p-8 text-center space-y-6 animate-in fade-in duration-500">
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-lg">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Ride Booked Successfully!</h3>
                <p className="text-xs text-white/40 font-medium">Your chauffeur is confirmed at the negotiated price.</p>
                <div className="mt-4 p-4 bg-white/5 border border-white/5 rounded-2xl">
                  <span className="text-[8px] font-black uppercase tracking-widest text-white/30">Confirmation code</span>
                  <p className="font-mono text-sm font-black text-kashmir-gold mt-1">{bookingRefNo}</p>
                </div>
              </div>
              <Button 
                onClick={() => { setShowCheckout(false); setIsTracking(true); }}
                className="w-full h-14 bg-white text-black hover:bg-kashmir-gold hover:text-black font-black rounded-xl text-[10px] uppercase tracking-widest transition-all duration-300"
              >
                Track Live Status
              </Button>
            </div>
          )}

          {checkoutStatus === 'idle' && (
            <div className="p-8 space-y-6">
              
              {/* Checkout details */}
              <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl flex justify-between items-center">
                <div className="min-w-0">
                  <span className="text-[8px] font-black uppercase tracking-widest text-white/30 block">Chauffeur Guide</span>
                  <span className="font-bold text-sm text-white block truncate">{allocatedDriver?.driverName}</span>
                  <span className="text-[9px] text-white/40 block mt-0.5">{selectedCab?.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-[8px] font-black uppercase tracking-widest text-white/30 block">Agreed Fare</span>
                  <span className="font-black text-xl text-kashmir-gold block mt-0.5">₹{(finalAgreedFare || 0).toLocaleString()}</span>
                </div>
              </div>

              {/* Special notes textarea */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 block ml-1">Special Curation Notes (Optional)</label>
                <textarea 
                  value={specialNotes}
                  onChange={(e) => setSpecialNotes(e.target.value)}
                  placeholder="e.g. child seats, excess luggage, custom itinerary stops..."
                  className="w-full h-24 p-4 bg-white/[0.03] border border-white/5 rounded-2xl text-xs text-white placeholder-white/20 focus:outline-none focus:border-kashmir-gold/20 resize-none font-bold"
                />
              </div>

              <div className="space-y-6">
                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex gap-3 text-white/60">
                  <AlertCircle className="w-5 h-5 text-kashmir-gold shrink-0 mt-0.5" />
                  <p className="text-xs leading-normal">
                    This booking has been pre-negotiated and will be confirmed immediately at ₹{(finalAgreedFare || 0).toLocaleString()} total cost.
                  </p>
                </div>

                <Button 
                  onClick={handleConfirmPayment}
                  className="w-full h-14 bg-kashmir-gold text-black hover:bg-amber-500 font-black rounded-xl text-[10px] uppercase tracking-widest"
                >
                  Confirm & Book Chauffeur
                </Button>
              </div>

            </div>
          )}

        </DialogContent>
      </Dialog>

      <Footer />
      <FloatingActions />
    </div>
  );
}
