import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Star, MapPin, Search, Wifi, UtensilsCrossed, Dumbbell, Sparkles, 
  Calendar as CalendarIcon, Users, Filter, X, ArrowRight, ShieldCheck, 
  CheckCircle2, Phone, MessageCircle, Eye, Bed, Waves, Mountain, Trees, 
  RefreshCw, ChevronRight, SlidersHorizontal, Info, Compass, Check
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import FloatingActions from '@/components/layout/FloatingActions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useHotels, useLocations, CMSHotel } from '@/hooks/useCMSData';
import { useAuth } from '@/contexts/AuthContext';
import { useLeadCapture } from '@/contexts/LeadCaptureContext';
import { cn } from '@/lib/utils';
import { io } from 'socket.io-client';
import { API_BASE_URL, SOCKET_URL } from '@/lib/api';

const amenityIcons: Record<string, any> = {
  WiFi: Wifi,
  Restaurant: UtensilsCrossed,
  Gym: Dumbbell,
  Spa: Sparkles,
  Houseboat: Waves,
  Mountain: Mountain,
  Heating: Sparkles,
};

const getHotelCategory = (hotel: CMSHotel) => {
  const text = `${hotel.name} ${hotel.description || ''} ${hotel.location || ''}`.toLowerCase();
  if (text.includes('houseboat') || text.includes('lake') || text.includes('nigeen') || text.includes('dal')) {
    return { label: 'Cedar Houseboat', icon: '🌊', type: 'houseboat' };
  }
  if (text.includes('ski') || text.includes('gulmarg') || text.includes('gondola') || text.includes('snow') || text.includes('chalet')) {
    return { label: 'Alpine Ski Chalet', icon: '🏔️', type: 'chalet' };
  }
  if (text.includes('cottage') || text.includes('pine') || text.includes('pahalgam') || text.includes('lidder')) {
    return { label: 'Pine River Cottage', icon: '🌲', type: 'cottage' };
  }
  if (hotel.starRating >= 5) {
    return { label: 'Palatial 5-Star', icon: '👑', type: 'palatial' };
  }
  return { label: 'Boutique Estate', icon: '🏡', type: 'boutique' };
};

export default function Hotels() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated, addBooking } = useAuth();
  const { openLeadModal, openCallbackModal, openWhatsAppLead } = useLeadCapture();
  const { data: hotels = [], isLoading } = useHotels();
  const { data: locations = [] } = useLocations();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [previewHotel, setPreviewHotel] = useState<CMSHotel | null>(null);
  const [bookingHotel, setBookingHotel] = useState<CMSHotel | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const [filters, setFilters] = useState({
    location: searchParams.get('destination') || searchParams.get('location') || '',
    search: '',
    priceRange: [0, 100000] as [number, number],
    starRating: '',
    sortBy: 'recommended',
  });

  const [bookingData, setBookingData] = useState({
    checkIn: '',
    checkOut: '',
    guests: '2',
    roomType: '',
    specialRequests: '',
  });

  useEffect(() => {
    const loc = searchParams.get('destination') || searchParams.get('location');
    const guests = searchParams.get('guests');
    if (loc) {
      setFilters(prev => ({ ...prev, location: loc }));
    }
    if (guests) {
      setBookingData(prev => ({ ...prev, guests }));
    }
  }, [searchParams]);

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

  // Dynamic Hotels Hero states
  const [heroTitle, setHeroTitle] = useState('HERITAGE RETREATS & PRIVATE ESTATES');
  const [heroSubtitle, setHeroSubtitle] = useState('Handcrafted cedar houseboats on Nigeen Lake, high-altitude alpine ski chalets in Gulmarg, and pine-scented luxury villas in Pahalgam.');
  const [heroImage, setHeroImage] = useState('https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1600');

  useEffect(() => {
    const fetchHeroContent = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/site-content`);
        if (res.ok) {
          const data = await res.json();
          if (data.hotelsHero) {
            if (data.hotelsHero.title) setHeroTitle(data.hotelsHero.title);
            if (data.hotelsHero.subtitle) setHeroSubtitle(data.hotelsHero.subtitle);
            if (data.hotelsHero.image_url) setHeroImage(data.hotelsHero.image_url);
          }
        }
      } catch (err) {
        console.error('Failed to load real-time hotels hero data:', err);
      }
    };
    fetchHeroContent();

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling']
    });
    socket.on('site-content-updated', (payload) => {
      if (payload.sectionKey === 'hotelsHero' && payload.data) {
        if (payload.data.title) setHeroTitle(payload.data.title);
        if (payload.data.subtitle) setHeroSubtitle(payload.data.subtitle);
        if (payload.data.image_url) setHeroImage(payload.data.image_url);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const filteredHotels = useMemo(() => {
    if (!hotels) return [];

    return hotels.filter(hotel => {
      if (filters.location && filters.location !== 'all' && !hotel.location.toLowerCase().includes(filters.location.toLowerCase()) && !hotel.name.toLowerCase().includes(filters.location.toLowerCase())) return false;
      if (filters.search && !hotel.name.toLowerCase().includes(filters.search.toLowerCase()) && !hotel.location.toLowerCase().includes(filters.search.toLowerCase())) return false;
      
      const price = hotel.pricePerNight || 0;
      if (price > 0 && (price < filters.priceRange[0] || price > filters.priceRange[1])) return false;
      
      if (filters.starRating && filters.starRating !== 'any' && hotel.starRating < parseInt(filters.starRating)) return false;

      if (selectedCategory !== 'all') {
        const cat = getHotelCategory(hotel);
        if (cat.type !== selectedCategory) return false;
      }

      return true;
    }).sort((a, b) => {
      if (filters.sortBy === 'price-low') return (a.pricePerNight || 0) - (b.pricePerNight || 0);
      if (filters.sortBy === 'price-high') return (b.pricePerNight || 0) - (a.pricePerNight || 0);
      if (filters.sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      return (b.starRating || 0) - (a.starRating || 0);
    });
  }, [hotels, filters, selectedCategory]);

  const clearFilters = () => {
    setFilters({
      location: '',
      search: '',
      priceRange: [0, 100000],
      starRating: '',
      sortBy: 'recommended',
    });
    setSelectedCategory('all');
    setSearchParams({});
  };

  const calculateNights = () => {
    if (!bookingData.checkIn || !bookingData.checkOut) return 0;
    const start = new Date(bookingData.checkIn);
    const end = new Date(bookingData.checkOut);
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  const calculateTotal = () => {
    if (!bookingHotel) return 0;
    const nights = calculateNights();
    if (nights <= 0) return 0;
    const room = bookingHotel.roomTypes?.find(r => r.id === bookingData.roomType);
    const rate = room?.price || bookingHotel.pricePerNight || 6500;
    return rate * nights;
  };

  const handleBooking = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to confirm your estate reservation enquiry');
      navigate('/auth?redirect=/hotels');
      return;
    }

    if (!bookingData.checkIn || !bookingData.checkOut) {
      toast.error('Please select both Check-in and Check-out dates');
      return;
    }

    try {
      const nights = calculateNights();
      const totalAmount = calculateTotal();
      const selectedRoom = bookingHotel?.roomTypes?.find(r => r.id === bookingData.roomType)?.name || 'Executive Sanctuary Suite';

      await addBooking({
        booking_type: 'hotel',
        item_name: bookingHotel?.name || 'Kashmir Luxury Stay',
        booking_date: bookingData.checkIn,
        status: 'pending',
        total_amount: totalAmount,
        details: {
          ...bookingData,
          roomTypeName: selectedRoom,
          nights,
          totalAmount,
          location: bookingHotel?.location,
        },
      });

      setBookingHotel(null);
      toast.success('Your reservation enquiry has been submitted. Our concierge desk will contact you within 15 minutes.');
      navigate('/profile');
    } catch (err) {
      toast.error('Failed to submit reservation. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F8F9] dark:bg-[#05080a] text-slate-900 dark:text-white flex flex-col font-sans selection:bg-amber-400/30 transition-colors duration-300">
      <Navbar />

      {/* Dynamic Luxury Hero Banner */}
      <div className="relative pt-36 pb-20 md:pt-44 md:pb-28 overflow-hidden border-b border-slate-200/80 dark:border-white/5">
        <div className="absolute inset-0 z-0">
          <img 
            src={heroImage} 
            alt="Kashmir Luxury Stays & Houseboats" 
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
              Sanctuary Registry • Verified Stays
            </span>
          </div>

          <h1 className="font-display text-3xl sm:text-5xl md:text-7xl font-black tracking-tight mb-6 leading-[1.08] sm:leading-[1.05]">
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

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-4 text-xs font-semibold text-slate-700 dark:text-white/70">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-500" /> Inspected Heritage Houseboats
            </span>
            <span className="text-slate-300 dark:text-white/20">•</span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Complimentary Shikara Transfers
            </span>
            <span className="text-slate-300 dark:text-white/20">•</span>
            <span className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" /> 4.8+ Guest Rated Stays
            </span>
          </div>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 flex-1">
        {/* Mobile Filter Toggle Header */}
        <div className="lg:hidden flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-[#0a0f12] border border-slate-200 dark:border-white/10 mb-6 shadow-sm">
          <button 
            type="button"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>{showMobileFilters ? "Hide Filters" : "Filter & Search Stays"}</span>
          </button>
          <button
            type="button"
            onClick={clearFilters}
            className="text-[11px] font-bold text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            Reset
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-10">
          
          {/* Left Column: Filter Sidebar */}
          <div className={cn("lg:col-span-1", !showMobileFilters && "hidden lg:block")}>
            <div className="sticky top-28 p-6 md:p-8 rounded-[2.5rem] bg-white dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 shadow-xl shadow-slate-200/40 dark:shadow-none backdrop-blur-xl space-y-7">
              <div className="flex items-center justify-between pb-5 border-b border-slate-200 dark:border-white/5">
                <span className="text-xs font-black uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400 flex items-center gap-2">
                  <SlidersHorizontal className="w-3.5 h-3.5" /> Filter Stays
                </span>
                <button 
                  onClick={clearFilters} 
                  className="text-[11px] font-bold text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Reset All
                </button>
              </div>

              {/* Search by Name */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-white/40 flex items-center gap-1.5">
                  <Search className="w-3 h-3 text-amber-500" /> Search Property
                </label>
                <div className="relative">
                  <Input
                    placeholder="Search houseboat, chalet, villa..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="h-12 bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/20 font-medium text-sm focus-visible:ring-amber-500/50"
                  />
                  {filters.search && (
                    <button 
                      onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Territory / Region */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-white/40 flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-amber-500" /> Region / Valley
                </label>
                <Select 
                  value={filters.location || "all"} 
                  onValueChange={(val) => setFilters(prev => ({ ...prev, location: val === "all" ? "" : val }))}
                >
                  <SelectTrigger className="h-12 bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white font-medium text-sm">
                    <SelectValue placeholder="All Kashmir Regions" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-[#0a0f12] border-slate-200 dark:border-white/10 text-slate-900 dark:text-white">
                    <SelectItem value="all">All Kashmir Regions</SelectItem>
                    {locations?.map((loc) => (
                      <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Star Classification */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-white/40 flex items-center gap-1.5">
                  <Star className="w-3 h-3 text-amber-500" /> Classification
                </label>
                <Select 
                  value={filters.starRating || "any"} 
                  onValueChange={(val) => setFilters(prev => ({ ...prev, starRating: val === "any" ? "" : val }))}
                >
                  <SelectTrigger className="h-12 bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white font-medium text-sm">
                    <SelectValue placeholder="All Star Ratings" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-[#0a0f12] border-slate-200 dark:border-white/10 text-slate-900 dark:text-white">
                    <SelectItem value="any">All Star Ratings</SelectItem>
                    <SelectItem value="5">⭐⭐⭐⭐⭐ Palatial (5 Star)</SelectItem>
                    <SelectItem value="4">⭐⭐⭐⭐ Grand Heritage (4+ Star)</SelectItem>
                    <SelectItem value="3">⭐⭐⭐ Boutique Comfort (3+ Star)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Price Range Slider */}
              <div className="space-y-4 pt-2">
                <div className="flex justify-between items-end">
                  <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-white/40">Nightly Budget</label>
                  <span className="text-xs font-black text-amber-600 dark:text-amber-400">
                    Up to ₹{filters.priceRange[1].toLocaleString()}
                  </span>
                </div>
                <Slider
                  value={filters.priceRange}
                  onValueChange={(val) => setFilters(prev => ({ ...prev, priceRange: val as [number, number] }))}
                  min={0}
                  max={100000}
                  step={2000}
                  className="py-1"
                />
                <div className="flex justify-between text-[10px] text-slate-400 dark:text-white/30 font-semibold">
                  <span>₹0</span>
                  <span>₹50,000</span>
                  <span>₹100,000+</span>
                </div>
              </div>

              {/* Sort By */}
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-white/5">
                <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-white/40">
                  Sort Properties
                </label>
                <Select 
                  value={filters.sortBy} 
                  onValueChange={(val) => setFilters(prev => ({ ...prev, sortBy: val }))}
                >
                  <SelectTrigger className="h-12 bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white font-medium text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-[#0a0f12] border-slate-200 dark:border-white/10 text-slate-900 dark:text-white">
                    <SelectItem value="recommended">Curator Recommended</SelectItem>
                    <SelectItem value="rating">Highest Guest Rating</SelectItem>
                    <SelectItem value="price-low">Nightly Rate: Low to High</SelectItem>
                    <SelectItem value="price-high">Nightly Rate: High to Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Concierge Assistance Card */}
              <div className="pt-4 border-t border-slate-200 dark:border-white/5">
                <div className="p-5 rounded-2xl bg-amber-500/10 dark:bg-amber-400/5 border border-amber-500/20 dark:border-amber-400/10 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950">
                      <Phone className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Bespoke Curation?</p>
                      <p className="text-[10px] text-slate-500 dark:text-white/50">24/7 Srinagar Concierge Desk</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-white/60 leading-relaxed">
                    Looking for a private houseboat wing or an entire ski chalet for family? We provide direct estate access with complimentary Shikara rides.
                  </p>
                  <div className="pt-1 flex flex-col gap-2">
                    <Button 
                      onClick={() => openCallbackModal({ destination: filters.location || 'Kashmir', sourceCta: 'Hotels Sidebar' })}
                      className="w-full h-10 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-100 font-black text-xs uppercase tracking-wider"
                    >
                      Request Callback
                    </Button>
                    <button 
                      onClick={() => openWhatsAppLead({ destination: filters.location || 'Kashmir', packageTitle: 'Hotels Curation' })}
                      className="text-[11px] font-bold text-amber-700 dark:text-amber-400 hover:underline flex items-center justify-center gap-1.5 py-1"
                    >
                      <MessageCircle className="w-3.5 h-3.5" /> Chat via WhatsApp
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Right Column: Properties Workspace */}
          <div className="lg:col-span-3 space-y-8">
            
            {/* Category Quick Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {[
                { id: 'all', label: 'All Stays', icon: '✦' },
                { id: 'houseboat', label: 'Cedar Houseboats', icon: '🌊' },
                { id: 'chalet', label: 'Alpine Ski Chalets', icon: '🏔️' },
                { id: 'cottage', label: 'Pine Cottages', icon: '🌲' },
                { id: 'palatial', label: 'Palatial 5-Star', icon: '👑' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCategory(tab.id)}
                  className={cn(
                    "px-4 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-300 flex items-center gap-2 border",
                    selectedCategory === tab.id
                      ? "bg-slate-900 dark:bg-white text-white dark:text-slate-950 border-slate-900 dark:border-white shadow-md"
                      : "bg-white dark:bg-white/[0.03] text-slate-600 dark:text-white/60 border-slate-200 dark:border-white/5 hover:border-amber-500/40 hover:text-slate-900 dark:hover:text-white"
                  )}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Results Count Bar */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/5 text-xs font-bold">
              <span className="text-slate-500 dark:text-white/40 tracking-wider uppercase">
                {isLoading ? 'Scanning Sanctuaries...' : `${filteredHotels.length} Verified Properties Ready`}
              </span>
              {(filters.location || filters.search || filters.starRating || selectedCategory !== 'all') && (
                <button
                  onClick={clearFilters}
                  className="text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Clear Active Filters
                </button>
              )}
            </div>

            {/* Loading Skeleton */}
            {isLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-5 space-y-5">
                    <Skeleton className="h-64 w-full rounded-3xl bg-slate-200 dark:bg-white/5" />
                    <div className="space-y-3">
                      <Skeleton className="h-7 w-3/4 bg-slate-200 dark:bg-white/5" />
                      <Skeleton className="h-4 w-1/2 bg-slate-200 dark:bg-white/5" />
                      <div className="flex gap-2 pt-2">
                        <Skeleton className="h-8 w-20 bg-slate-200 dark:bg-white/5 rounded-xl" />
                        <Skeleton className="h-8 w-20 bg-slate-200 dark:bg-white/5 rounded-xl" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isLoading && filteredHotels.length === 0 && (
              <div className="text-center py-24 px-6 rounded-[3rem] bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 space-y-5">
                <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center">
                  <Compass className="w-8 h-8" />
                </div>
                <h3 className="font-display text-2xl font-black text-slate-900 dark:text-white">No Stays Found</h3>
                <p className="text-sm text-slate-500 dark:text-white/50 max-w-md mx-auto">
                  No properties matched your current filter criteria. Try adjusting your price range or selecting another region.
                </p>
                <Button 
                  onClick={clearFilters}
                  className="rounded-xl bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider px-6"
                >
                  Reset Filters
                </Button>
              </div>
            )}

            {/* Hotel Cards Grid */}
            {!isLoading && filteredHotels.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {filteredHotels.map((hotel, index) => {
                  const category = getHotelCategory(hotel);
                  const startingPrice = hotel.pricePerNight || (hotel.roomTypes?.[0]?.price) || 6500;

                  return (
                    <div
                      key={hotel.id}
                      className="bg-white dark:bg-white/[0.02] border border-slate-200/90 dark:border-white/5 rounded-[2.5rem] overflow-hidden hover:border-amber-400/50 dark:hover:border-amber-400/30 hover:shadow-2xl hover:shadow-slate-200/50 dark:hover:shadow-black/50 transition-all duration-500 hover:-translate-y-1.5 flex flex-col justify-between group p-4"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {/* Image Box */}
                      <div>
                        <div className="relative h-64 sm:h-72 rounded-[2rem] overflow-hidden bg-slate-100 dark:bg-slate-900">
                          <img
                            src={hotel.image}
                            alt={hotel.name}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                          
                          {/* Category Badge */}
                          <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-slate-950/70 backdrop-blur-md border border-white/10 text-[10px] font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                            <span>{category.icon}</span>
                            <span>{category.label}</span>
                          </div>

                          {/* Star Rating Badge */}
                          <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-slate-950/70 backdrop-blur-md border border-white/10 flex items-center gap-1">
                            {[...Array(hotel.starRating || 4)].map((_, i) => (
                              <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                            ))}
                          </div>

                          {/* Location Tag */}
                          <div className="absolute bottom-4 left-4 flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 text-white">
                              <MapPin className="h-4 w-4 text-amber-400" />
                            </div>
                            <span className="text-xs font-black text-white uppercase tracking-wider drop-shadow-md">
                              {hotel.location}
                            </span>
                          </div>

                          {/* Verified Pill */}
                          <div className="absolute bottom-4 right-4">
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/90 text-white text-[10px] font-black tracking-wider uppercase backdrop-blur-md flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3" /> Verified
                            </span>
                          </div>
                        </div>

                        {/* Card Content */}
                        <div className="p-4 sm:p-5">
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <h3 className="font-display text-2xl font-black text-slate-900 dark:text-white leading-snug group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-1">
                              {hotel.name}
                            </h3>
                          </div>

                          <p className="text-xs text-slate-600 dark:text-white/60 line-clamp-2 leading-relaxed mb-4">
                            {hotel.description || "An exclusive luxury retreat offering authentic Kashmiri hospitality, bespoke dining, and panoramic vistas."}
                          </p>

                          {/* Amenities Badges */}
                          <div className="flex flex-wrap gap-1.5 mb-6">
                            {(hotel.amenities || ['WiFi', 'Restaurant', 'Heating', 'Houseboat']).slice(0, 3).map((amenity) => {
                              const Icon = amenityIcons[amenity] || Sparkles;
                              return (
                                <div 
                                  key={amenity} 
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/5 text-[10px] font-bold text-slate-700 dark:text-white/70"
                                >
                                  <Icon className="h-3 w-3 text-amber-500" />
                                  <span>{amenity}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Card Footer */}
                      <div className="p-4 sm:p-5 pt-0 border-t border-slate-100 dark:border-white/5 mt-auto">
                        <div className="flex items-center justify-between py-4">
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-white/40 block">
                              Starting from
                            </span>
                            <div className="flex items-baseline gap-1">
                              <span className="text-xl font-black text-slate-900 dark:text-white">
                                ₹{startingPrice.toLocaleString()}
                              </span>
                              <span className="text-[11px] font-semibold text-slate-500 dark:text-white/50">/ night</span>
                            </div>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">
                              ✓ Breakfast Included
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <div className="flex items-center gap-1 justify-end">
                                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                                <span className="text-xs font-black text-slate-900 dark:text-white">{hotel.rating || 4.8}</span>
                              </div>
                              <span className="text-[10px] text-slate-400 dark:text-white/30 font-bold block">
                                {hotel.reviewCount || 18} reviews
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Dual Action Buttons */}
                        <div className="grid grid-cols-2 gap-3 pt-2">
                          <Button
                            variant="outline"
                            onClick={() => setPreviewHotel(hotel)}
                            className="h-12 rounded-xl border-slate-300 dark:border-white/10 text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5 text-amber-500" /> Quick Peek
                          </Button>

                          <Button
                            onClick={() => {
                              setBookingHotel(hotel);
                              setBookingData(prev => ({
                                ...prev,
                                roomType: hotel.roomTypes?.[0]?.id || 'std',
                              }));
                            }}
                            className="h-12 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[11px] uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5"
                          >
                            Reserve Stay <ArrowRight className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Quick Peek Drawer (Sheet) */}
      <Sheet open={!!previewHotel} onOpenChange={(open) => !open && setPreviewHotel(null)}>
        <SheetContent className="w-full sm:max-w-xl bg-white dark:bg-[#070b0e] border-slate-200 dark:border-white/10 text-slate-900 dark:text-white p-0 overflow-y-auto">
          {previewHotel && (
            <div className="p-6 md:p-8 space-y-6">
              <div className="relative h-64 rounded-3xl overflow-hidden">
                <img 
                  src={previewHotel.image} 
                  alt={previewHotel.name} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 text-white">
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block mb-1">
                    {previewHotel.location}
                  </span>
                  <h3 className="font-display text-2xl font-black">{previewHotel.name}</h3>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/5">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      {[...Array(previewHotel.starRating || 4)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-slate-600 dark:text-white/60">
                      ({previewHotel.rating || 4.8} / 5 based on {previewHotel.reviewCount || 20} verified stays)
                    </span>
                  </div>
                  <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-bold">
                    Official Partner Stay
                  </Badge>
                </div>

                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-white/40 mb-2">
                    Sanctuary Description
                  </h4>
                  <p className="text-sm text-slate-700 dark:text-white/70 leading-relaxed">
                    {previewHotel.description || "A premier Kashmiri estate designed for discerning travelers. Immerse yourself in authentic cedar architecture, panoramic views of snow-clad peaks, and personalized hospitality."}
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-white/40 mb-2">
                    Featured Amenities & Inclusions
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {(previewHotel.amenities || ['WiFi', 'Restaurant', 'Heating', 'Shikara Dock']).map((amenity) => (
                      <div key={amenity} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5 text-xs font-bold text-slate-800 dark:text-white/80">
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{amenity}</span>
                      </div>
                    ))}
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5 text-xs font-bold text-slate-800 dark:text-white/80">
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Complimentary Shikara</span>
                    </div>
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5 text-xs font-bold text-slate-800 dark:text-white/80">
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>24/7 Power Backup</span>
                    </div>
                  </div>
                </div>

                {/* Room Types Overview */}
                {previewHotel.roomTypes && previewHotel.roomTypes.length > 0 && (
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-white/40 mb-3">
                      Available Chamber Categories
                    </h4>
                    <div className="space-y-2">
                      {previewHotel.roomTypes.map(room => (
                        <div key={room.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5">
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white">{room.name}</p>
                            <p className="text-[10px] text-slate-500 dark:text-white/40">Max Capacity: {room.capacity || 2} Adults</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black text-amber-600 dark:text-amber-400">₹{room.price ? room.price.toLocaleString() : (previewHotel.pricePerNight || 6500).toLocaleString()}</p>
                            <span className="text-[10px] text-slate-400 dark:text-white/30">per night</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Peek Action */}
                <div className="pt-4 flex flex-col gap-3">
                  <Button
                    onClick={() => {
                      const h = previewHotel;
                      setPreviewHotel(null);
                      setBookingHotel(h);
                      setBookingData(prev => ({
                        ...prev,
                        roomType: h.roomTypes?.[0]?.id || 'std',
                      }));
                    }}
                    className="w-full h-14 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider shadow-xl shadow-amber-500/20"
                  >
                    Proceed to Reserve This Sanctuary
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      openWhatsAppLead({ 
                        destination: previewHotel.location, 
                        packageTitle: previewHotel.name 
                      });
                    }}
                    className="w-full h-12 rounded-2xl border-slate-300 dark:border-white/10 text-slate-800 dark:text-white font-bold text-xs"
                  >
                    <MessageCircle className="w-4 h-4 mr-2 text-emerald-500" /> Inquire via WhatsApp Concierge
                  </Button>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Reservation & Quote Dialog */}
      <Dialog open={!!bookingHotel} onOpenChange={(open) => !open && setBookingHotel(null)}>
        <DialogContent className="max-w-xl bg-white dark:bg-[#070b0e] border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-[2.5rem] p-6 sm:p-8">
          <DialogHeader className="mb-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-wider w-fit mb-2">
              <Sparkles className="w-3 h-3" /> Guaranteed Estate Reservation
            </div>
            <DialogTitle className="font-display text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight">
              RESERVE <span className="text-amber-600 dark:text-amber-400">{bookingHotel?.name}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-white/50">
              Select your travel dates and room preference to secure your booking quote.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {/* Check-in / Check-out Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-white/40 ml-1">
                  Check-in Date
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full h-12 bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/10 rounded-2xl text-left font-bold text-slate-900 dark:text-white px-4 justify-between hover:bg-slate-100 dark:hover:bg-white/[0.08]",
                        !bookingData.checkIn && "text-slate-400 dark:text-white/40"
                      )}
                    >
                      <span className="text-xs">{formatDisplayDate(bookingData.checkIn)}</span>
                      <CalendarIcon className="h-4 w-4 text-amber-500" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-white dark:bg-[#0a0f12] border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl" align="start">
                    <Calendar
                      mode="single"
                      selected={parseDateString(bookingData.checkIn)}
                      onSelect={(date) => {
                        const dateStr = formatDateToString(date);
                        setBookingData(prev => {
                          const updated = { ...prev, checkIn: dateStr };
                          const checkOutDate = parseDateString(prev.checkOut);
                          if (checkOutDate && date && checkOutDate <= date) {
                            updated.checkOut = '';
                          }
                          return updated;
                        });
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

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-white/40 ml-1">
                  Check-out Date
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full h-12 bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/10 rounded-2xl text-left font-bold text-slate-900 dark:text-white px-4 justify-between hover:bg-slate-100 dark:hover:bg-white/[0.08]",
                        !bookingData.checkOut && "text-slate-400 dark:text-white/40"
                      )}
                    >
                      <span className="text-xs">{formatDisplayDate(bookingData.checkOut)}</span>
                      <CalendarIcon className="h-4 w-4 text-amber-500" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-white dark:bg-[#0a0f12] border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl" align="start">
                    <Calendar
                      mode="single"
                      selected={parseDateString(bookingData.checkOut)}
                      onSelect={(date) => setBookingData(prev => ({ ...prev, checkOut: formatDateToString(date) }))}
                      disabled={(date) => {
                        const checkInDate = bookingData.checkIn ? parseDateString(bookingData.checkIn) : undefined;
                        const minDate = checkInDate || new Date();
                        minDate.setHours(0, 0, 0, 0);
                        return date <= minDate;
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Guests & Chamber Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-white/40 ml-1">
                  Guest Count
                </label>
                <Select 
                  value={bookingData.guests} 
                  onValueChange={(val) => setBookingData(prev => ({ ...prev, guests: val }))}
                >
                  <SelectTrigger className="h-12 bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white px-4 font-bold text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-[#0a0f12] border-slate-200 dark:border-white/10 text-slate-900 dark:text-white">
                    {[1, 2, 3, 4, 5, 6].map(n => (
                      <SelectItem key={n} value={n.toString()}>{n} Guest{n > 1 ? 's' : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-white/40 ml-1">
                  Chamber Category
                </label>
                <Select 
                  value={bookingData.roomType} 
                  onValueChange={(val) => setBookingData(prev => ({ ...prev, roomType: val }))}
                >
                  <SelectTrigger className="h-12 bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white px-4 font-bold text-xs">
                    <SelectValue placeholder="Select Chamber" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-[#0a0f12] border-slate-200 dark:border-white/10 text-slate-900 dark:text-white">
                    {bookingHotel?.roomTypes && bookingHotel.roomTypes.length > 0 ? (
                      bookingHotel.roomTypes.map(room => (
                        <SelectItem key={room.id} value={room.id}>
                          {room.name} (₹{room.price ? room.price.toLocaleString() : (bookingHotel.pricePerNight || 6500).toLocaleString()}/n)
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="std">
                        Luxury Sanctuary Suite (₹{(bookingHotel?.pricePerNight || 6500).toLocaleString()}/n)
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Price Breakdown Calculation */}
            {calculateNights() > 0 ? (
              <div className="p-5 rounded-2xl bg-amber-500/10 dark:bg-white/[0.03] border border-amber-500/20 dark:border-white/10 space-y-3">
                <div className="flex justify-between items-center text-xs text-slate-600 dark:text-white/60">
                  <span>Stay Duration</span>
                  <span className="font-bold text-slate-900 dark:text-white">{calculateNights()} Nights</span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-600 dark:text-white/60">
                  <span>Estimated Rate</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    ₹{((calculateTotal() / calculateNights()) || 0).toLocaleString()} / night
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200 dark:border-white/10 flex justify-between items-center">
                  <span className="text-sm font-black text-slate-900 dark:text-white">Total Curation Estimate</span>
                  <span className="text-lg font-black text-amber-600 dark:text-amber-400">
                    ₹{calculateTotal().toLocaleString()}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-white/40 leading-normal">
                  *Includes complimentary breakfast, all applicable luxury taxes, and direct Shikara lake transit.
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-100 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 text-center">
                <p className="text-xs text-slate-500 dark:text-white/40">
                  Please pick Check-in and Check-out dates above to calculate estimated cost.
                </p>
              </div>
            )}

            {/* Submission Button */}
            <Button
              className="w-full h-14 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase tracking-[0.25em] shadow-xl shadow-amber-500/20 transition-all duration-300"
              onClick={handleBooking}
              disabled={calculateNights() <= 0}
            >
              Submit Reservation Enquiry
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
      <FloatingActions />
    </div>
  );
}
