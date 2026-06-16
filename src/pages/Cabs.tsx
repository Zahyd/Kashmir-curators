import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Car, MapPin, Calendar, Clock, Users, Plane, MapIcon, Navigation, 
  Loader2, CheckCircle, Shield, AlertCircle, ArrowRight, Smartphone, Sparkles, Send, IndianRupee, Sliders
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import FloatingActions from '@/components/layout/FloatingActions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
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

// Simulated active dispatch stories
const dispatchStories = [
  "Innova Crysta booked for Pahalgam sightseeing by Guest from Chennai • 4m ago",
  "Luxury 4x4 SUV booked by Guest from Delhi • 10m ago",
  "Chauffeur Shabir Ahmad dispatched for Airport Transfer to Srinagar • 22m ago",
  "Premium Sedan locked in for Gulmarg Meadow Day Tour • 12m ago",
  "Outstation Round Trip scheduled for Guest from Mumbai • 1h ago",
  "Private chauffeur & VIP Crysta allocated for 3 days • Family from Bengaluru • 38m ago"
];

export default function Cabs() {
  const navigate = useNavigate();
  const { isAuthenticated, addBooking } = useAuth();
  const { data: cabOptions = [], isLoading: isLoadingCabs } = useCabs();
  
  const [selectedCab, setSelectedCab] = useState<Cab | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutMethod, setCheckoutMethod] = useState<'upi' | 'cash'>('upi');
  const [checkoutStatus, setCheckoutStatus] = useState<'idle' | 'processing' | 'success'>('idle');
  const [bookingRefNo, setBookingRefNo] = useState('');

  // Form states
  const [tripType, setTripType] = useState('airport');
  const [airportDirection, setAirportDirection] = useState('arrival'); // arrival = airport to hotel, departure = hotel to airport
  const [hotelAddress, setHotelAddress] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropLocation, setDropLocation] = useState('');
  const [sightseeingTour, setSightseeingTour] = useState('gulmarg');
  const [localDuration, setLocalDuration] = useState('8'); // 8 = 8h/80km, 12 = 12h/120km
  
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('09:00');
  const [returnDate, setReturnDate] = useState('');

  // Live Activity Ticker State
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);

  // VPA details fetched from server
  const [upiConfig, setUpiConfig] = useState({
    vpa: 'thekashmircurators@okaxis',
    name: 'The Kashmir Curators'
  });

  // Fleet Hero copy states
  const [heroTitle, setHeroTitle] = useState('Premium Transport');
  const [heroSubtitle, setHeroSubtitle] = useState('Reliable cab services for airport transfers, local sightseeing, and outstation trips.');
  const [heroImage, setHeroImage] = useState('https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=1600');

  // Rotate dispatch stories
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStoryIndex(prev => (prev + 1) % dispatchStories.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Hero & Payment VPA settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/site-content`);
        if (res.ok) {
          const data = await res.json();
          // Hero
          if (data.fleetHero) {
            setHeroTitle(data.fleetHero.title || 'Premium Transport');
            setHeroSubtitle(data.fleetHero.subtitle || 'Reliable cab services for airport transfers, local sightseeing, and outstation trips.');
            setHeroImage(data.fleetHero.image_url || 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=1600');
          }
          // UPI Gateway
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

  // Resolve locations dynamically
  const getPickupName = () => {
    if (tripType === 'airport') {
      return airportDirection === 'arrival' ? 'Srinagar Airport (SXR)' : hotelAddress || 'Srinagar Hotel';
    }
    if (tripType === 'local') {
      return pickupLocation || 'Srinagar Hotel';
    }
    return pickupLocation || 'Srinagar';
  };

  const getDropName = () => {
    if (tripType === 'airport') {
      return airportDirection === 'arrival' ? hotelAddress || 'Srinagar Hotel' : 'Srinagar Airport (SXR)';
    }
    if (tripType === 'local') {
      const tourLabels: Record<string, string> = {
        gulmarg: 'Gulmarg Meadow Tour',
        pahalgam: 'Pahalgam Valley Tour',
        sonamarg: 'Sonamarg Glacier Tour',
        srinagar: 'Srinagar Mughal Gardens Tour',
        doodhpathri: 'Doodhpathri Valley Exploration'
      };
      return tourLabels[sightseeingTour] || 'Kashmir Local Sightseeing';
    }
    return dropLocation || 'Gulmarg';
  };

  const getEstimatedDistance = () => {
    if (tripType === 'local') {
      return localDuration === '12' ? 120 : 80;
    }
    
    // Simple lookup based on keywords
    const destination = getDropName().toLowerCase();
    const origin = getPickupName().toLowerCase();
    
    const isGulmarg = destination.includes('gulmarg') || origin.includes('gulmarg');
    const isPahalgam = destination.includes('pahalgam') || origin.includes('pahalgam');
    const isSonamarg = destination.includes('sonamarg') || origin.includes('sonamarg');
    const isDoodhpathri = destination.includes('doodhpathri') || origin.includes('doodhpathri');
    const isSrinagar = destination.includes('srinagar') || origin.includes('srinagar');

    if (isGulmarg) return 55;
    if (isPahalgam) return 95;
    if (isSonamarg) return 80;
    if (isDoodhpathri) return 45;
    if (isSrinagar) return 15;
    return 60; // fallback standard
  };

  const calculateFare = (cab: Cab | null) => {
    if (!cab) return 0;
    const distance = getEstimatedDistance();
    let fare = cab.basePrice + (distance * cab.pricePerKm);
    
    if (tripType === 'outstation' && returnDate) {
      fare *= 1.8; // roundtrip discount factor
    }
    
    return Math.round(fare);
  };

  const handleInitiateCheckout = () => {
    if (!isAuthenticated) {
      toast.error('Please login to place cab bookings');
      navigate('/auth?redirect=/cabs');
      return;
    }

    if (tripType === 'airport' && !hotelAddress) {
      toast.error('Please input Hotel / Transfer Address');
      return;
    }
    if (tripType === 'local' && !pickupLocation) {
      toast.error('Please input Chauffeur Pickup location');
      return;
    }
    if (tripType === 'outstation' && (!pickupLocation || !dropLocation)) {
      toast.error('Please input pickup and drop destinations');
      return;
    }
    if (!bookingDate) {
      toast.error('Please select booking date');
      return;
    }
    if (!selectedCab) {
      toast.error('Please choose your luxury vehicle node');
      return;
    }

    setCheckoutStatus('idle');
    setShowCheckout(true);
  };

  const handleConfirmPayment = async () => {
    if (!selectedCab) return;
    setCheckoutStatus('processing');
    
    // Simulate payment transaction verify time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const ref = `KC-CAB-${Math.floor(100000 + Math.random() * 900000)}`;
    setBookingRefNo(ref);

    const tripLabel = tripType === 'airport' 
      ? `Airport transfer: ${getPickupName()} ➔ ${getDropName()}`
      : tripType === 'local'
        ? `Sightseeing: ${getDropName()} (${localDuration} Hours)`
        : `Outstation Route: ${getPickupName()} ➔ ${getDropName()}${returnDate ? ' (Roundtrip)' : ''}`;

    const bookingDetails = {
      pickupLocation: getPickupName(),
      dropLocation: getDropName(),
      pickupDateTime: `${bookingDate}T${bookingTime}`,
      dropDateTime: returnDate ? `${returnDate}T18:00` : `${bookingDate}T18:00`,
      tripType,
      estimatedDistance: getEstimatedDistance(),
      paymentMethod: checkoutMethod,
      bookingRef: ref,
      cabAllocation: {
        cabId: selectedCab.id,
        cabName: selectedCab.name,
        cabType: selectedCab.type,
        ownership: 'company',
        registrationNo: '', // Will be assigned by ops
        driverName: '',     // Will be assigned by ops
        driverPhone: '',    // Will be assigned by ops
        pickupDateTime: `${bookingDate}T${bookingTime}`,
        dropDateTime: returnDate ? `${returnDate}T18:00` : `${bookingDate}T18:00`,
        pickupLocation: getPickupName(),
        dropLocation: getDropName(),
        allocatedDates: [bookingDate],
        pricing: {
          pricePerKm: selectedCab.pricePerKm,
          estimatedKm: getEstimatedDistance(),
          baseCost: selectedCab.basePrice,
          driverAllowance: 1500,
          fuelExpenses: 3000,
          tollsExpenses: 500,
          vendorPayout: 0,
          otherExpenses: 0,
          totalCost: 5000,
          margin: calculateFare(selectedCab) - 5000,
          marginPercent: ((calculateFare(selectedCab) - 5000) / calculateFare(selectedCab)) * 100
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
        status: checkoutMethod === 'upi' ? 'confirmed' : 'pending', // Pending status if cash on arrival
        total_amount: calculateFare(selectedCab),
        details: bookingDetails,
      });

      // Log dispatch action inside Operations feed quietly
      const token = localStorage.getItem('auth_token');
      await fetch(`${API_BASE_URL}/cabs/operations/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          message: `Customer booking created: ${tripLabel} (Fare: ₹${calculateFare(selectedCab).toLocaleString()}).`
        })
      });

      setCheckoutStatus('success');
      toast.success('Cab Booking Confirmed!');
    } catch (err) {
      toast.error('Booking failed. Please try again.');
      setCheckoutStatus('idle');
    }
  };

  // Generate UPI pay links
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

      {/* Hero Banner Section */}
      <div className="relative pt-36 pb-24 lg:pt-48 lg:pb-36 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center transition-all duration-1000 scale-105" style={{ backgroundImage: `url("${heroImage}")` }}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[4px]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#05080a] via-transparent to-black/30" />
        </div>
        
        <div className="container mx-auto px-6 relative z-10 text-center space-y-6">
          <Badge className="bg-kashmir-gold/10 text-kashmir-gold border-kashmir-gold/25 font-black px-5 py-1.5 rounded-full text-[10px] uppercase tracking-[0.25em] mx-auto w-fit animate-fade-up">
            Kashmir Chauffeur Protocol
          </Badge>
          <h1 className="font-display text-5xl md:text-7xl font-black text-white leading-tight tracking-tight max-w-4xl mx-auto animate-fade-up" style={{ animationDelay: '100ms' }}>
            {heroTitle}
          </h1>
          <p className="text-white/60 text-base md:text-lg max-w-2xl mx-auto leading-relaxed animate-fade-up" style={{ animationDelay: '200ms' }}>
            {heroSubtitle}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Booking Inputs & Vehicles Selector */}
          <div className="lg:col-span-8 space-y-12">
            
            {/* Booking settings Form */}
            <div className="bg-white/[0.01] border border-white/5 rounded-[3rem] p-8 md:p-10 backdrop-blur-2xl relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-kashmir-gold/[0.01] blur-[80px] -mr-32 -mt-32" />
              
              <Tabs value={tripType} onValueChange={setTripType}>
                <TabsList className="grid grid-cols-3 mb-10 bg-white/5 p-1 rounded-2xl h-auto border border-white/5">
                  <TabsTrigger value="airport" className="gap-2.5 py-4 rounded-xl data-[state=active]:bg-kashmir-gold data-[state=active]:text-black transition-all text-[9px] sm:text-[10px] font-black uppercase tracking-widest">
                    <Plane className="h-4 w-4" />
                    <span>Airport</span>
                  </TabsTrigger>
                  <TabsTrigger value="local" className="gap-2.5 py-4 rounded-xl data-[state=active]:bg-kashmir-gold data-[state=active]:text-black transition-all text-[9px] sm:text-[10px] font-black uppercase tracking-widest">
                    <MapIcon className="h-4 w-4" />
                    <span>Local Tour</span>
                  </TabsTrigger>
                  <TabsTrigger value="outstation" className="gap-2.5 py-4 rounded-xl data-[state=active]:bg-kashmir-gold data-[state=active]:text-black transition-all text-[9px] sm:text-[10px] font-black uppercase tracking-widest">
                    <Navigation className="h-4 w-4" />
                    <span>Outstation</span>
                  </TabsTrigger>
                </TabsList>

                <div className="space-y-8 animate-in fade-in duration-500">
                  {/* AIRPORT TRANSFERS */}
                  {tripType === 'airport' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 ml-4 flex items-center gap-2">
                            <Sliders className="h-3 w-3 text-kashmir-gold" /> Transfer Protocol
                          </label>
                          <select
                            value={airportDirection}
                            onChange={(e) => setAirportDirection(e.target.value)}
                            className="w-full h-14 bg-white/[0.03] border border-white/5 rounded-2xl text-white px-6 font-bold focus:outline-none focus:border-kashmir-gold/45 text-sm"
                          >
                            <option value="arrival" className="bg-[#0a0f12]">Arrival: Airport ➔ Hotel</option>
                            <option value="departure" className="bg-[#0a0f12]">Departure: Hotel ➔ Airport</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 ml-4 flex items-center gap-2">
                            <MapPin className="h-3 w-3 text-green-500" /> Hotel / Destination Address
                          </label>
                          <Input
                            className="h-14 bg-white/[0.03] border-white/5 rounded-2xl text-white px-6 font-bold focus:border-kashmir-gold/45"
                            value={hotelAddress}
                            onChange={(e) => setHotelAddress(e.target.value)}
                            placeholder="e.g. Radisson Collection Srinagar, Gulmarg Hotel"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* LOCAL Sightseeing */}
                  {tripType === 'local' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 ml-4 flex items-center gap-2">
                            <MapPin className="h-3 w-3 text-green-500" /> Pickup Hotel Location
                          </label>
                          <Input
                            className="h-14 bg-white/[0.03] border-white/5 rounded-2xl text-white px-6 font-bold focus:border-kashmir-gold/45"
                            value={pickupLocation}
                            onChange={(e) => setPickupLocation(e.target.value)}
                            placeholder="Input Srinagar Hotel address..."
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 ml-4 flex items-center gap-2">
                            <MapIcon className="h-3 w-3 text-kashmir-gold" /> Choose Sightseeing Itinerary
                          </label>
                          <select
                            value={sightseeingTour}
                            onChange={(e) => setSightseeingTour(e.target.value)}
                            className="w-full h-14 bg-white/[0.03] border border-white/5 rounded-2xl text-white px-6 font-bold focus:outline-none focus:border-kashmir-gold/45 text-sm"
                          >
                            <option value="gulmarg" className="bg-[#0a0f12]">Gulmarg Meadow Tour (Betaab Valley)</option>
                            <option value="pahalgam" className="bg-[#0a0f12]">Pahalgam Valley Day Tour</option>
                            <option value="sonamarg" className="bg-[#0a0f12]">Sonamarg Glacier Meadow Tour</option>
                            <option value="srinagar" className="bg-[#0a0f12]">Srinagar City Mughal Gardens Tour</option>
                            <option value="doodhpathri" className="bg-[#0a0f12]">Doodhpathri Valley Tour</option>
                          </select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 ml-4 flex items-center gap-2">
                          <Clock className="h-3 w-3" /> Tour Duration package
                        </label>
                        <select
                          value={localDuration}
                          onChange={(e) => setLocalDuration(e.target.value)}
                          className="w-full h-14 bg-white/[0.03] border border-white/5 rounded-2xl text-white px-6 font-bold focus:outline-none focus:border-kashmir-gold/45 text-sm"
                        >
                          <option value="8" className="bg-[#0a0f12]">Standard Day tour (8 Hours / 80 KM limit)</option>
                          <option value="12" className="bg-[#0a0f12]">Extended Day tour (12 Hours / 120 KM limit)</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* OUTSTATION / CUSTOM */}
                  {tripType === 'outstation' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 ml-4 flex items-center gap-2">
                            <MapPin className="h-3 w-3 text-green-500" /> Pickup Location
                          </label>
                          <Input
                            className="h-14 bg-white/[0.03] border-white/5 rounded-2xl text-white px-6 font-bold focus:border-kashmir-gold/45"
                            value={pickupLocation}
                            onChange={(e) => setPickupLocation(e.target.value)}
                            placeholder="e.g. Srinagar Hotel, Airport"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 ml-4 flex items-center gap-2">
                            <MapPin className="h-3 w-3 text-red-500" /> Drop Destination
                          </label>
                          <Input
                            className="h-14 bg-white/[0.03] border-white/5 rounded-2xl text-white px-6 font-bold focus:border-kashmir-gold/45"
                            value={dropLocation}
                            onChange={(e) => setDropLocation(e.target.value)}
                            placeholder="e.g. Pahalgam Resort, Gulmarg"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Shared Dates & Timings */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-white/5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 ml-4 flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-kashmir-gold" /> Deployment Date
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

            {/* Vehicles registry cards selector */}
            <div className="space-y-8">
              <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-white/30">
                <div className="w-8 h-[1px] bg-white/10" />
                <span>Select Chauffeur Vehicle Asset</span>
              </div>
              
              {isLoadingCabs ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white/[0.01] border border-white/5 rounded-[2.5rem] p-8 space-y-6">
                      <Skeleton className="h-44 w-full rounded-2xl bg-white/5" />
                      <Skeleton className="h-6 w-3/4 bg-white/5" />
                      <Skeleton className="h-4 w-1/2 bg-white/5" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {cabOptions.filter(c => c.isActive).map((cab) => (
                    <div
                      key={cab.id}
                      onClick={() => setSelectedCab(cab)}
                      className={cn(
                        "bg-white/[0.01] border rounded-[2.5rem] p-6 md:p-8 cursor-pointer transition-all duration-500 group relative overflow-hidden",
                        selectedCab?.id === cab.id 
                          ? "border-kashmir-gold/50 bg-kashmir-gold/[0.02] shadow-[0_0_50px_-12px_rgba(212,175,55,0.08)]" 
                          : "border-white/5 hover:border-white/10 hover:bg-white/[0.02]"
                      )}
                    >
                      <div className="flex flex-col gap-6">
                        <div className="relative h-44 overflow-hidden rounded-2xl border border-white/5">
                          {cab.image ? (
                            <img
                              src={cab.image}
                              alt={cab.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            />
                          ) : (
                            <div className="w-full h-full bg-white/5 flex items-center justify-center">
                              <Car className="w-10 h-10 text-white/10" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          <Badge className="absolute top-4 right-4 bg-black/60 text-white border-none font-bold uppercase text-[8px] tracking-widest px-2.5 py-1 backdrop-blur-md">
                            {cab.type}
                          </Badge>
                        </div>
                        
                        <div>
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-display text-2xl font-black text-white group-hover:text-kashmir-gold transition-colors">{cab.name}</h4>
                              <p className="text-[9px] font-black uppercase tracking-widest text-white/40 flex items-center gap-1.5 mt-2">
                                <Users className="h-3.5 w-3.5 text-kashmir-gold" /> 
                                <span>{cab.capacity} Principal Seats</span>
                              </p>
                            </div>
                            {selectedCab?.id === cab.id && (
                              <div className="w-8 h-8 rounded-full bg-kashmir-gold flex items-center justify-center shadow-lg shadow-kashmir-gold/20 shrink-0">
                                <CheckCircle className="h-4.5 w-4.5 text-black" />
                              </div>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap gap-2 mt-4">
                            {cab.features && cab.features.slice(0, 3).map((feature) => (
                              <span key={feature} className="text-[8px] font-black uppercase tracking-widest px-2.5 py-1 bg-white/5 rounded-md text-white/40 border border-white/5">
                                {feature}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="pt-6 border-t border-white/5 flex justify-between items-center mt-2">
                          <div className="flex flex-col">
                            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/20">Protocol Rate</span>
                            <span className="text-xs font-bold text-white/40">₹{cab.pricePerKm}/km</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/20">Estimated Fare</span>
                            <div className="text-2xl font-black text-white">₹{calculateFare(cab).toLocaleString()}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Checkout sidebar manifest summary */}
          <div className="lg:col-span-4">
            <div className="bg-white/[0.01] border border-white/5 rounded-[3rem] p-8 md:p-10 backdrop-blur-2xl sticky top-32 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-32 h-32 bg-kashmir-gold/[0.01] blur-3xl rounded-full" />
              
              <h3 className="font-display text-xl font-black text-white uppercase tracking-wider mb-8 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-kashmir-gold" />
                Trip Manifest
              </h3>

              {selectedCab ? (
                <div className="space-y-8 animate-in fade-in duration-500">
                  <div className="flex items-center gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <div className="w-12 h-12 rounded-xl bg-kashmir-gold/10 flex items-center justify-center border border-kashmir-gold/20 shrink-0">
                      <Car className="h-6 w-6 text-kashmir-gold" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-white text-base truncate">{selectedCab.name}</p>
                      <p className="text-[9px] font-black uppercase tracking-widest text-white/40">{selectedCab.capacity} PRINCIPALS</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <MapPin className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-0.5">Pickup Address</p>
                        <p className="font-bold text-white capitalize text-xs">{getPickupName()}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <MapPin className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-0.5">Drop Address</p>
                        <p className="font-bold text-white capitalize text-xs">{getDropName()}</p>
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
                    
                    {tripType === 'outstation' && returnDate && (
                      <div className="flex items-start gap-4">
                        <Calendar className="h-5 w-5 text-purple-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-0.5">Return Schedule</p>
                          <p className="font-bold text-white text-xs">
                            {new Date(returnDate).toLocaleDateString('en-IN', { 
                              day: 'numeric', 
                              month: 'short', 
                              year: 'numeric' 
                            })}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-white/5 pt-6 space-y-4">
                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                      <span className="text-white/20">Calculated Distance</span>
                      <span className="text-white/60">{getEstimatedDistance()} KM</span>
                    </div>
                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                      <span className="text-white/20">Vehicle Base Rate</span>
                      <span className="text-white/60">₹{selectedCab.basePrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                      <span className="text-white/20">Distance fare</span>
                      <span className="text-white/60">₹{(getEstimatedDistance() * selectedCab.pricePerKm).toLocaleString()}</span>
                    </div>
                    {tripType === 'outstation' && returnDate && (
                      <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-kashmir-gold">
                        <span>Roundtrip Adjustment</span>
                        <span>x1.8</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-6 border-t border-white/5">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Total Fare</span>
                      <span className="text-3xl font-black text-kashmir-gold">₹{calculateFare(selectedCab).toLocaleString()}</span>
                    </div>
                  </div>

                  <Button
                    onClick={handleInitiateCheckout}
                    className="w-full h-16 rounded-2xl bg-white text-black hover:bg-kashmir-gold hover:text-black font-black text-[10px] uppercase tracking-[0.25em] shadow-xl transition-all duration-300 active:scale-95 flex items-center justify-center gap-2"
                  >
                    <span>Request Booking</span>
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

      {/* Dynamic UPI Payment & Checkout Gateway Modal */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="max-w-md bg-[#0a0f12] border-white/10 text-white rounded-[2rem] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-kashmir-gold/5 via-transparent to-transparent pointer-events-none" />
          
          <DialogHeader className="p-8 pb-0">
            <DialogTitle className="text-2xl font-display font-black tracking-tight text-white uppercase flex items-center gap-2">
              <Shield className="w-6 h-6 text-kashmir-gold animate-pulse" />
              Secure Checkout
            </DialogTitle>
            <p className="text-white/40 text-[10px] uppercase font-black tracking-wider mt-1">Select payment mode to confirm booking</p>
          </DialogHeader>

          {checkoutStatus === 'processing' && (
            <div className="p-8 py-20 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="w-16 h-16 text-kashmir-gold animate-spin" />
              <p className="text-xs font-black uppercase tracking-widest text-white/30 animate-pulse">Verifying UPI Ledger...</p>
            </div>
          )}

          {checkoutStatus === 'success' && (
            <div className="p-8 text-center space-y-6 animate-in fade-in duration-500">
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-lg">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Booking Confirmed!</h3>
                <p className="text-xs text-white/40 font-medium">Your chauffeur transfer has been successfully booked.</p>
                <div className="mt-4 p-4 bg-white/5 border border-white/5 rounded-2xl">
                  <span className="text-[8px] font-black uppercase tracking-widest text-white/30">Confirmation code</span>
                  <p className="font-mono text-sm font-black text-kashmir-gold mt-1">{bookingRefNo}</p>
                </div>
              </div>
              <Button 
                onClick={() => { setShowCheckout(false); navigate('/profile'); }}
                className="w-full h-12 bg-white text-black hover:bg-kashmir-gold hover:text-black font-black rounded-xl text-[10px] uppercase tracking-widest"
              >
                Go to Profile
              </Button>
            </div>
          )}

          {checkoutStatus === 'idle' && (
            <div className="p-8 space-y-6">
              {/* Fare Summary */}
              <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl flex justify-between items-center">
                <div className="min-w-0">
                  <span className="text-[8px] font-black uppercase tracking-widest text-white/30 block">Luxury Asset</span>
                  <span className="font-bold text-sm text-white block truncate">{selectedCab?.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-[8px] font-black uppercase tracking-widest text-white/30 block">Booking amount</span>
                  <span className="font-black text-xl text-kashmir-gold">₹{calculateFare(selectedCab).toLocaleString()}</span>
                </div>
              </div>

              {/* Checkout Method Tabs */}
              <div className="grid grid-cols-2 gap-4 p-1 bg-white/5 rounded-xl border border-white/5">
                <button
                  onClick={() => setCheckoutMethod('upi')}
                  className={cn(
                    "py-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-1.5",
                    checkoutMethod === 'upi' ? "bg-kashmir-gold text-black shadow-md" : "text-white/40 hover:text-white"
                  )}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  UPI / GPay
                </button>
                <button
                  onClick={() => setCheckoutMethod('cash')}
                  className={cn(
                    "py-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-1.5",
                    checkoutMethod === 'cash' ? "bg-kashmir-gold text-black shadow-md" : "text-white/40 hover:text-white"
                  )}
                >
                  <IndianRupee className="w-3.5 h-3.5" />
                  Cash on arrival
                </button>
              </div>

              {checkoutMethod === 'upi' ? (
                <div className="space-y-6 text-center animate-in fade-in duration-300">
                  {/* Dynamic QR Code */}
                  <div className="w-48 h-48 bg-white p-2 rounded-2xl mx-auto border border-white/10 flex items-center justify-center shadow-lg">
                    <img 
                      src={getQRImageSrc()} 
                      alt="UPI Booking QR Code" 
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40">
                      Scan QR Code with any UPI App to Pay
                    </p>
                    <p className="text-[9px] font-mono text-white/20">
                      Merchant VPA: {upiConfig.vpa}
                    </p>
                  </div>

                  {/* Mobile Deep link */}
                  <div className="block md:hidden">
                    <a 
                      href={getUPILink()}
                      className="w-full h-12 rounded-xl bg-green-600 hover:bg-green-700 text-white font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg"
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>Open in GPay / UPI App</span>
                    </a>
                  </div>

                  <Button 
                    onClick={handleConfirmPayment}
                    className="w-full h-14 bg-kashmir-gold text-black hover:bg-amber-500 font-black rounded-xl text-[10px] uppercase tracking-widest mt-4"
                  >
                    I Have Transferred Amount
                  </Button>
                </div>
              ) : (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex gap-3 text-white/60">
                    <AlertCircle className="w-5 h-5 text-kashmir-gold shrink-0 mt-0.5" />
                    <p className="text-xs leading-normal">
                      No advanced deposit is required. You can pay the total fare of <span className="text-kashmir-gold font-bold">₹{calculateFare(selectedCab).toLocaleString()}</span> directly to the Chauffeur upon arrival in Srinagar.
                    </p>
                  </div>

                  <Button 
                    onClick={handleConfirmPayment}
                    className="w-full h-14 bg-kashmir-gold text-black hover:bg-amber-500 font-black rounded-xl text-[10px] uppercase tracking-widest"
                  >
                    Confirm Dispatch Booking
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Floating Live Activity Ticker */}
      <div className="fixed bottom-6 left-6 z-[60] animate-in slide-in-from-bottom-4 duration-500 pointer-events-none">
        <div className="bg-[#0a0f12]/90 backdrop-blur-2xl border border-kashmir-gold/10 p-4 rounded-2xl flex items-center gap-3.5 shadow-2xl shadow-black max-w-sm pointer-events-auto">
          <div className="w-8 h-8 rounded-lg bg-kashmir-gold/10 border border-kashmir-gold/20 flex items-center justify-center shrink-0">
            <Car className="w-4.5 h-4.5 text-kashmir-gold animate-bounce" />
          </div>
          <div className="min-w-0">
            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-kashmir-gold block">Live Curation Protocol</span>
            <p className="text-[10px] text-white/80 font-bold leading-normal truncate mt-0.5">
              {dispatchStories[activeStoryIndex]}
            </p>
          </div>
        </div>
      </div>

      <Footer />
      <FloatingActions />
    </div>
  );
}
