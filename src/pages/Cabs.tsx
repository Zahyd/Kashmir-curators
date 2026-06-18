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
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
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

  // Script loading
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const [specialNotes, setSpecialNotes] = useState('');
  const pickupInputRef = useRef<HTMLInputElement>(null);
  const dropInputRef = useRef<HTMLInputElement>(null);

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

  // Predefined or dynamic distance calculation
  const getRouteStats = () => {
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

  // Handle Checkout Initial
  const handleInitiateCheckout = () => {
    if (!isAuthenticated) {
      toast.error('Please login to book a cab');
      navigate('/auth?redirect=/cabs');
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
    if (!selectedCab) {
      toast.error('Please choose a vehicle');
      return;
    }

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

  // Confirm booking & payment (Quote Enquiry Flow)
  const handleConfirmPayment = async () => {
    if (!selectedCab) return;
    setCheckoutStatus('processing');
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const ref = `KC-CAB-${Math.floor(100000 + Math.random() * 900000)}`;
    setBookingRefNo(ref);

    const tripLabel = tripType === 'airport' 
      ? `Airport transfer: ${pickupInput || 'Srinagar Airport'} ➔ ${dropInput || 'Srinagar Airport'}`
      : `Sightseeing Route: ${pickupInput} ➔ ${dropInput}${returnDate ? ' (Roundtrip)' : ''}`;

    const totalFare = calculateFare(selectedCab);

    const bookingDetails = {
      pickupLocation: tripType === 'airport' && airportDirection === 'arrival' ? 'Srinagar Airport (SXR)' : pickupInput,
      dropLocation: tripType === 'airport' && airportDirection === 'departure' ? 'Srinagar Airport (SXR)' : dropInput,
      pickupDateTime: `${bookingDate}T${bookingTime}`,
      dropDateTime: returnDate ? `${returnDate}T18:00` : `${bookingDate}T18:00`,
      tripType,
      estimatedDistance: routeStats.distance,
      paymentMethod: 'quote-inquiry',
      bookingRef: ref,
      specialNotes,
      cabAllocation: {
        cabId: selectedCab.id,
        cabName: selectedCab.name,
        cabType: selectedCab.type,
        ownership: 'company',
        registrationNo: 'JK-01-AB-7700',
        driverName: 'Shabir Ahmad',
        driverPhone: '+919906771122',
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
        status: 'pending',
        total_amount: 0, // Quote pending
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
          message: `Customer quote enquiry created: ${tripLabel} (${selectedCab.name}).`
        })
      });

      setCheckoutStatus('success');
      toast.success('Quote Request Submitted!');
    } catch (err) {
      toast.error('Submission failed. Please try again.');
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
                    <TabsList className="grid grid-cols-3 mb-10 bg-white/5 p-1 rounded-2xl h-auto border border-white/5">
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
                              <Input
                                ref={pickupInputRef}
                                className="h-14 bg-white/[0.03] border-white/5 rounded-2xl text-white px-6 font-bold focus:border-kashmir-gold/45 text-sm"
                                value={pickupInput}
                                onChange={(e) => {
                                  setPickupInput(e.target.value);
                                  setShowPickupSuggestions(true);
                                }}
                                onFocus={() => setShowPickupSuggestions(true)}
                                onBlur={() => setTimeout(() => setShowPickupSuggestions(false), 200)}
                                placeholder="Type pickup location / hotel..."
                              />
                              {showPickupSuggestions && !googleMapsLoaded && (
                                <div className="absolute top-[100%] left-0 right-0 z-50 bg-[#0d1216] border border-white/10 rounded-2xl mt-2 max-h-60 overflow-y-auto shadow-2xl p-2 space-y-1">
                                  {popularLocations.map((loc, i) => (
                                    <button
                                      key={i}
                                      onClick={() => {
                                        setPickupInput(loc.name);
                                        setShowPickupSuggestions(false);
                                      }}
                                      className="w-full text-left px-4 py-3 hover:bg-white/5 rounded-xl text-xs font-bold text-white/80 transition-colors flex items-center gap-2"
                                    >
                                      <MapPin className="w-3.5 h-3.5 text-kashmir-gold" />
                                      {loc.name}
                                    </button>
                                  ))}
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
                                onBlur={() => setTimeout(() => setShowDropSuggestions(false), 200)}
                                placeholder="Type drop-off location / hotel..."
                              />
                              {showDropSuggestions && !googleMapsLoaded && (
                                <div className="absolute top-[100%] left-0 right-0 z-50 bg-[#0d1216] border border-white/10 rounded-2xl mt-2 max-h-60 overflow-y-auto shadow-2xl p-2 space-y-1">
                                  {popularLocations.map((loc, i) => (
                                    <button
                                      key={i}
                                      onClick={() => {
                                        setDropInput(loc.name);
                                        setShowDropSuggestions(false);
                                      }}
                                      className="w-full text-left px-4 py-3 hover:bg-white/5 rounded-xl text-xs font-bold text-white/80 transition-colors flex items-center gap-2"
                                    >
                                      <MapPin className="w-3.5 h-3.5 text-kashmir-gold" />
                                      {loc.name}
                                    </button>
                                  ))}
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
                          <Input
                            type="date"
                            value={bookingDate}
                            onChange={(e) => setBookingDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="h-14 bg-white/[0.03] border border-white/5 rounded-2xl text-white px-6 font-bold focus:border-kashmir-gold/45"
                          />
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
                            <Input
                              type="date"
                              value={returnDate}
                              onChange={(e) => setReturnDate(e.target.value)}
                              min={bookingDate || new Date().toISOString().split('T')[0]}
                              className="h-14 bg-white/[0.03] border border-white/5 rounded-2xl text-white px-6 font-bold focus:border-kashmir-gold/45"
                            />
                          </div>
                        )}
                      </div>

                    </div>
                  </Tabs>
                </div>

                {/* Premium Vehicles Cards */}
                <div className="space-y-8">
                  <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-white/30">
                    <div className="w-8 h-[1px] bg-white/10" />
                    <span>Select Chauffeur Class</span>
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
                            {/* Card Image */}
                            <div className="relative h-44 overflow-hidden rounded-2xl border border-white/5">
                              <img
                                src={cab.image}
                                alt={cab.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[750ms]"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
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

              </div>

              {/* Live Summary Sidebar */}
              <div className="lg:col-span-4">
                <div className="bg-[#0a0f12]/60 border border-white/5 rounded-[3rem] p-8 md:p-10 backdrop-blur-3xl sticky top-32 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-32 h-32 bg-kashmir-gold/[0.01] blur-3xl rounded-full" />
                  
                  <h3 className="font-display text-xl font-black text-white uppercase tracking-wider mb-8 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-kashmir-gold" />
                    Trip Manifest
                  </h3>

                  {selectedCab ? (
                    <div className="space-y-8 animate-in fade-in duration-500">
                      
                      {/* Vehicle Card Header */}
                      <div className="flex items-center gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                        <div className="w-12 h-12 rounded-xl bg-kashmir-gold/10 flex items-center justify-center border border-kashmir-gold/20 shrink-0">
                          <Car className="h-6 w-6 text-kashmir-gold" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-white text-base truncate">{selectedCab.name}</p>
                          <p className="text-[9px] font-black uppercase tracking-widest text-white/40">{selectedCab.type}</p>
                        </div>
                      </div>

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

                      {/* Fare Breakdown */}
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
                          <span className="text-white/20">Curation Rate</span>
                          <span className="text-kashmir-gold font-bold">Get Best Quote</span>
                        </div>
                        <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                          <span className="text-white/20">Tolls & Fuel</span>
                          <span className="text-emerald-400">Included in Quote</span>
                        </div>
                        
                        <div className="flex justify-between items-center pt-6 border-t border-white/5">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Est. Total Cost</span>
                          <span className="text-xl font-black text-white uppercase tracking-widest">Quote Pending</span>
                        </div>
                      </div>

                      {/* ETA Display */}
                      <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center justify-between text-xs font-bold">
                        <span className="text-white/40 flex items-center gap-1.5"><Clock className="w-4 h-4 text-kashmir-gold" /> Estimated Travel Time</span>
                        <span className="text-white">~ {Math.floor(routeStats.duration / 60)} Hours</span>
                      </div>

                      <Button
                        onClick={handleInitiateCheckout}
                        className="w-full h-16 rounded-2xl bg-white text-black hover:bg-kashmir-gold hover:text-black font-black text-[10px] uppercase tracking-[0.25em] shadow-xl transition-all duration-300 active:scale-95 flex items-center justify-center gap-2"
                      >
                        <span>Request Custom Quote</span>
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-20 opacity-30">
                      <Car className="w-12 h-12 mx-auto text-white mb-4 animate-pulse" />
                      <p className="text-[9px] font-black uppercase tracking-[0.2em]">Select vehicle to compute manifest</p>
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
                      <p className="text-[9px] text-white/40 mt-0.5">{trackingStep >= 1 ? 'Shabir Ahmad assigned' : 'Locating nearest driver...'}</p>
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
                      SA
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-base">Shabir Ahmad</h4>
                      <p className="text-[9px] font-black uppercase tracking-widest text-white/40 flex items-center gap-1.5 mt-1">
                        <Star className="h-3 w-3 text-kashmir-gold fill-kashmir-gold" />
                        <span>4.9 Rating (124 Tours)</span>
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
                      <span className="font-mono font-bold text-kashmir-gold uppercase">JK-01-AB-7700</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/40">Driver Phone</span>
                      <span className="font-bold text-white">+91 9906 771122</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5 flex gap-3">
                    <a 
                      href={`https://wa.me/919906771122?text=Hi%20Shabir,%20I%20am%20the%20guest%20for%20the%20booking%20${bookingRefNo}.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 h-12 rounded-xl bg-[#25D366] hover:bg-[#128C7E] text-white font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg transition-all"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>WhatsApp Driver</span>
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
              Bespoke Quote Request
            </DialogTitle>
            <p className="text-white/40 text-[10px] uppercase font-black tracking-wider mt-1">Submit travel specs to receive custom rates</p>
          </DialogHeader>

          {checkoutStatus === 'processing' && (
            <div className="p-8 py-20 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="w-16 h-16 text-kashmir-gold animate-spin" />
              <p className="text-xs font-black uppercase tracking-widest text-white/30 animate-pulse">Routing quote to travel desk...</p>
            </div>
          )}

          {checkoutStatus === 'success' && (
            <div className="p-8 text-center space-y-6 animate-in fade-in duration-500">
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-lg">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Quote Request Submitted!</h3>
                <p className="text-xs text-white/40 font-medium">Our travel desk will contact you with custom rates shortly.</p>
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
                  <span className="text-[8px] font-black uppercase tracking-widest text-white/30 block">Chauffeur Class</span>
                  <span className="font-bold text-sm text-white block truncate">{selectedCab?.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-[8px] font-black uppercase tracking-widest text-white/30 block">Estimated Rate</span>
                  <span className="font-black text-sm text-kashmir-gold uppercase tracking-wider block mt-0.5">Awaiting Quote</span>
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
                    No advanced deposit is required. Our curators will review your route and dispatch a bespoke quotation directly to your dashboard.
                  </p>
                </div>

                <Button 
                  onClick={handleConfirmPayment}
                  className="w-full h-14 bg-kashmir-gold text-black hover:bg-amber-500 font-black rounded-xl text-[10px] uppercase tracking-widest"
                >
                  Submit Quote Request
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
