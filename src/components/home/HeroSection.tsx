import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  MapPin, Calendar as CalendarIcon, Users, Loader2, Sparkles,
  ArrowRight, Search, CheckCircle, ShieldCheck,
  Car, Navigation, Clock, Star,
  Bed, Plane, Bus, Luggage, MessageCircle, Headphones,
  Building2, BedDouble, Briefcase, Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import heroImage from '@/assets/kashmir-hero-new.jpg';
import { useDestinations } from '@/hooks/useCMSData';
import { API_BASE_URL, SOCKET_URL, DEFAULT_SOCKET_OPTIONS } from '@/lib/api';
import { io } from 'socket.io-client';
import { useLeadCapture } from '@/contexts/LeadCaptureContext';
import { useCurrency, SUPPORTED_CURRENCIES, CurrencyCode } from '@/contexts/CurrencyContext';

const CORE_KASHMIR_DESTINATIONS = [
  'Srinagar',
  'Gulmarg',
  'Pahalgam',
  'Sonamarg',
  'Doodhpathri',
  'Gurez Valley',
];

export default function HeroSection() {
  const navigate = useNavigate();
  const { openLeadModal, openCallbackModal, openWhatsAppLead } = useLeadCapture();
  const { data: cmsDestinations = [] } = useDestinations();
  const { currency, setCurrency, formatPrice } = useCurrency();

  const [personaMode, setPersonaMode] = useState<'traveler' | 'b2b'>('traveler');
  const [isSearching, setIsSearching] = useState(false);
  const [searchTab, setSearchTab] = useState<'packages' | 'hotels' | 'cabs' | 'flights' | 'bus'>('packages');

  const destinations = useMemo(() => {
    const merged = new Set<string>(CORE_KASHMIR_DESTINATIONS);
    if (Array.isArray(cmsDestinations)) {
      cmsDestinations.forEach((d) => {
        if (d && typeof d === 'string') merged.add(d);
      });
    }
    return Array.from(merged);
  }, [cmsDestinations]);

  // Packages Search
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [searchData, setSearchData] = useState({
    destination: '',
    dates: '',
    travelers: '2',
  });

  // Hotels Search
  const [selectedHotelDate, setSelectedHotelDate] = useState<Date | undefined>(undefined);
  const [hotelData, setHotelData] = useState({
    destination: '',
    checkIn: '',
    guests: '2',
  });

  // Cabs Search
  const [selectedCabDate, setSelectedCabDate] = useState<Date | undefined>(undefined);
  const [cabData, setCabData] = useState({
    pickup: '',
    drop: '',
    date: '',
    time: '09:00',
  });

  // Flights Search
  const [selectedFlightDate, setSelectedFlightDate] = useState<Date | undefined>(undefined);
  const [flightData, setFlightData] = useState({
    origin: 'DEL',
    dates: '',
    travelers: '2',
  });

  // Bus Search
  const [selectedBusDate, setSelectedBusDate] = useState<Date | undefined>(undefined);
  const [busData, setBusData] = useState({
    pickup: 'Srinagar Airport (SXR)',
    date: '',
    passengers: '12',
  });

  const [heroData, setHeroData] = useState({
    title: 'Beyond the Ordinary',
    subtitle: 'Kashmir’s luxury concierge & Travel Operating System. Bespoke private expeditions for travelers, direct net supply for agencies, hoteliers & 4x4 fleets.',
    imageUrl: heroImage,
    stats: [
      { value: '1,200+', label: 'Elite Curations' },
      { value: '400+', label: 'B2B Partner Agencies' },
      { value: '4.95★', label: 'Satisfaction Index' },
    ],
  });

  const updateHeroState = (h: Record<string, any>) => {
    setHeroData({
      title: h?.title || 'Beyond the Ordinary',
      subtitle:
        h?.subtitle ||
        'Kashmir’s luxury concierge & Travel Operating System. Bespoke private expeditions for travelers, direct net supply for agencies, hoteliers & 4x4 fleets.',
      imageUrl: h?.image_url || heroImage,
      stats: [
        { value: h?.content?.stat1_value || '1,200+', label: h?.content?.stat1_label || 'Elite Curations' },
        { value: h?.content?.stat2_value || '400+', label: h?.content?.stat2_label || 'B2B Partner Agencies' },
        { value: h?.content?.stat3_value || '4.95★', label: h?.content?.stat3_label || 'Satisfaction Index' },
      ],
    });
  };

  useEffect(() => {
    const fetchHeroContent = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/site-content`);
        if (res.ok) {
          const data = await res.json();
          if (data.hero) {
            updateHeroState(data.hero);
          }
        }
      } catch (err) {
        console.error('Failed to load real-time hero data:', err);
      }
    };
    fetchHeroContent();

    const socket = io(SOCKET_URL, DEFAULT_SOCKET_OPTIONS);
    socket.on('site-content-updated', (update) => {
      if (update.sectionKey === 'hero') {
        updateHeroState(update.data);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (searchTab === 'packages') {
      if (!searchData.destination) {
        toast.error('Select your destination');
        return;
      }
      setIsSearching(true);
      await new Promise((resolve) => setTimeout(resolve, 450));
      const params = new URLSearchParams();
      if (searchData.destination) params.set('destination', searchData.destination);
      if (searchData.travelers) params.set('travelers', searchData.travelers);
      if (searchData.dates) params.set('date', searchData.dates);
      navigate(`/packages?${params.toString()}`);
    } else if (searchTab === 'hotels') {
      if (!hotelData.destination) {
        toast.error('Select your destination');
        return;
      }
      setIsSearching(true);
      await new Promise((resolve) => setTimeout(resolve, 450));
      const params = new URLSearchParams();
      if (hotelData.destination) params.set('destination', hotelData.destination);
      if (hotelData.guests) params.set('guests', hotelData.guests);
      if (hotelData.checkIn) params.set('checkIn', hotelData.checkIn);
      navigate(`/hotels?${params.toString()}`);
    } else if (searchTab === 'cabs') {
      if (!cabData.pickup) {
        toast.error('Enter pickup location');
        return;
      }
      setIsSearching(true);
      await new Promise((resolve) => setTimeout(resolve, 450));
      const params = new URLSearchParams();
      if (cabData.pickup) params.set('pickup', cabData.pickup);
      if (cabData.drop) params.set('drop', cabData.drop);
      if (cabData.date) params.set('date', cabData.date);
      navigate(`/cabs?${params.toString()}`);
    } else if (searchTab === 'flights') {
      setIsSearching(true);
      await new Promise((resolve) => setTimeout(resolve, 450));
      const params = new URLSearchParams();
      params.set('flights', 'true');
      if (flightData.origin) params.set('origin', flightData.origin);
      if (flightData.dates) params.set('date', flightData.dates);
      if (flightData.travelers) params.set('travelers', flightData.travelers);
      navigate(`/planner?${params.toString()}`);
    } else if (searchTab === 'bus') {
      if (!busData.pickup) {
        toast.error('Select pickup point');
        return;
      }
      setIsSearching(true);
      await new Promise((resolve) => setTimeout(resolve, 450));
      const params = new URLSearchParams();
      params.set('tripType', 'local');
      if (busData.pickup) params.set('pickup', busData.pickup);
      if (busData.date) params.set('date', busData.date);
      params.set('capacity', busData.passengers);
      navigate(`/cabs?${params.toString()}`);
    }

    setIsSearching(false);
  };

  const renderStyledTitle = (title: string) => {
    const words = title.trim().split(' ');
    if (words.length <= 1) return title;
    const lastWord = words.pop();
    const rest = words.join(' ');
    return (
      <>
        {rest} <br className="hidden md:block" />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 dark:from-amber-400 dark:via-yellow-200 dark:to-amber-500">
          {lastWord}
        </span>
      </>
    );
  };

  return (
    <section className="relative min-h-[94vh] flex items-center justify-center overflow-hidden bg-[#F8F8F9] dark:bg-[#05080a] pt-28 pb-20 transition-colors">
      {/* Daylight Aurora / Obsidian Glow Mesh */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-40 w-[680px] h-[680px] rounded-full bg-gradient-to-br from-[#FFB800]/25 to-amber-400/10 dark:from-amber-500/15 dark:to-transparent blur-[130px]" />
        <div className="absolute top-10 right-0 w-[720px] h-[620px] rounded-full bg-gradient-to-br from-[#00D4FF]/20 via-blue-500/10 to-transparent dark:from-emerald-500/10 dark:via-sky-500/10 blur-[140px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[550px] rounded-full bg-gradient-to-tr from-[#7928CA]/12 via-[#FF6584]/12 to-transparent dark:from-amber-400/5 dark:via-transparent blur-[150px]" />

        {/* Subtle Kashmir Mountain Silhouette Watermark */}
        <div
          className="absolute inset-0 bg-cover bg-bottom bg-no-repeat opacity-[0.06] dark:opacity-[0.14] mix-blend-multiply dark:mix-blend-luminosity"
          style={{ backgroundImage: `url(${heroData.imageUrl})` }}
        />
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06]"
          style={{ backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)', backgroundSize: '36px 36px' }}
        />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-8 sm:pt-14 sm:pb-12">
        <div className="flex flex-col items-center text-center">
          {/* Elite SaaS OS Telemetry Badge */}
          <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-white/90 dark:bg-white/[0.06] border border-slate-200/90 dark:border-white/10 shadow-sm mb-7 animate-fade-up">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.24em] text-[#111439] dark:text-white">
              Kashmir Curators • Travel Operating System
            </span>
          </div>

          {/* Editorial Headline */}
          <div className="max-w-5xl mb-6 space-y-4">
            <h1
              className="font-display text-4xl sm:text-6xl md:text-7xl lg:text-[5.25rem] font-black text-[#111439] dark:text-white leading-[1.03] tracking-tight animate-fade-up"
              style={{ animationDelay: '80ms' }}
            >
              {renderStyledTitle(heroData.title)}
            </h1>
            <p
              className="text-sm sm:text-lg md:text-xl text-[#4A5568] dark:text-white/65 font-medium max-w-2xl mx-auto leading-relaxed animate-fade-up"
              style={{ animationDelay: '150ms' }}
            >
              {heroData.subtitle}
            </p>
          </div>

          {/* Dual-Experience Switcher: Discerning Travelers vs B2B Travel OS */}
          <div
            className="inline-flex p-1.5 rounded-full bg-white/90 dark:bg-white/[0.06] border border-slate-200/90 dark:border-white/10 shadow-md mb-7 animate-fade-up"
            style={{ animationDelay: '200ms' }}
          >
            <button
              type="button"
              onClick={() => setPersonaMode('traveler')}
              className={cn(
                'px-5 py-2 rounded-full text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-2',
                personaMode === 'traveler'
                  ? 'bg-[#111439] text-white dark:bg-amber-400 dark:text-black shadow-sm'
                  : 'text-slate-600 dark:text-white/70 hover:text-[#111439] dark:hover:text-white'
              )}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>For Luxury Travelers</span>
            </button>
            <button
              type="button"
              onClick={() => setPersonaMode('b2b')}
              className={cn(
                'px-5 py-2 rounded-full text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-2',
                personaMode === 'b2b'
                  ? 'bg-[#111439] text-white dark:bg-emerald-400 dark:text-black shadow-sm'
                  : 'text-slate-600 dark:text-white/70 hover:text-[#111439] dark:hover:text-white'
              )}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>For Agencies, Hotels & Fleet</span>
            </button>
          </div>

          {personaMode === 'traveler' ? (
            <>
              {/* Direct Lead Capture Action Strip */}
              <div
                className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-2.5 sm:gap-3.5 mb-8 w-full max-w-xl sm:max-w-none px-2 animate-fade-up"
                style={{ animationDelay: '230ms' }}
              >
                <Button
                  onClick={() => openLeadModal({ sourceCta: 'BUILD_ITINERARY', intent: 'Bespoke Itinerary' })}
                  className="w-full sm:w-auto h-12 px-7 rounded-full bg-[#111439] hover:bg-[#1a205a] dark:bg-amber-400 dark:hover:bg-amber-300 text-white dark:text-black font-black text-xs uppercase tracking-widest shadow-xl shadow-[#111439]/20 hover:scale-[1.03] active:scale-95 transition-all flex items-center justify-center gap-2.5"
                >
                  <Sparkles className="w-4 h-4 text-amber-400 dark:text-black" />
                  <span>Build My Itinerary</span>
                </Button>

                <Button
                  onClick={() => navigate('/planner')}
                  variant="outline"
                  className="w-full sm:w-auto h-12 px-6 rounded-full border-slate-300 dark:border-white/20 bg-white/85 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 text-[#111439] dark:text-white font-black text-xs uppercase tracking-widest shadow-sm hover:scale-[1.03] active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <span>AI Trip Planner</span>
                  <ArrowRight className="w-3.5 h-3.5 text-amber-500" />
                </Button>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
                  <Button
                    onClick={() => openCallbackModal({ sourceCta: 'HERO_EXPERT' })}
                    variant="ghost"
                    className="flex-1 sm:flex-initial h-11 px-4 sm:px-5 rounded-full text-[#111439] dark:text-white hover:bg-white/80 dark:hover:bg-white/10 font-bold text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                  >
                    <Headphones className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>Talk to Expert</span>
                  </Button>

                  <button
                    type="button"
                    onClick={() => openWhatsAppLead({ intent: 'General Curation' })}
                    className="flex-1 sm:flex-initial h-11 px-4 rounded-full bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-emerald-700 dark:text-emerald-400 font-bold text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                  >
                    <MessageCircle className="w-4 h-4 text-[#25D366]" />
                    <span>WhatsApp</span>
                  </button>
                </div>
              </div>

              {/* Command Search Module */}
              <div className="w-full max-w-5xl animate-fade-up" style={{ animationDelay: '280ms' }}>
                <div className="inline-flex p-1.5 rounded-full bg-slate-100/90 dark:bg-white/[0.07] backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-inner mb-5 overflow-x-auto max-w-full no-scrollbar">
                  <div className="flex items-center gap-1">
                    {[
                      { id: 'packages', label: 'Luxury Packages', icon: Luggage },
                      { id: 'hotels', label: 'Stays & Houseboats', icon: Bed },
                      { id: 'cabs', label: '4x4 Snow Fleet', icon: Car },
                      { id: 'flights', label: 'Flights', icon: Plane },
                      { id: 'bus', label: 'Luxury Coaches', icon: Bus },
                    ].map((tab) => {
                      const Icon = tab.icon;
                      const isActive = searchTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setSearchTab(tab.id as typeof searchTab)}
                          className={cn(
                            'flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full text-xs font-bold tracking-wide transition-all duration-300 whitespace-nowrap',
                            isActive
                              ? 'bg-white dark:bg-amber-400 text-[#111439] dark:text-black shadow-md shadow-slate-900/10 scale-[1.02]'
                              : 'text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5'
                          )}
                        >
                          <Icon className={cn('w-3.5 h-3.5', isActive ? 'text-amber-600 dark:text-black' : 'text-amber-500')} />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <form
                  onSubmit={handleSearch}
                  className="bg-white/95 dark:bg-[#0a0f14]/95 backdrop-blur-2xl border border-slate-200/90 dark:border-white/10 rounded-[2rem] md:rounded-full p-2.5 md:p-3.5 shadow-2xl shadow-slate-900/8 flex flex-col md:flex-row gap-2 md:gap-0 relative group transition-all duration-500 hover:border-slate-300 dark:hover:border-white/20"
                >
                  {searchTab === 'packages' && (
                    <div className="flex-1 flex flex-col md:flex-row gap-2 md:gap-0">
                      <div className="flex-1 md:flex-[1.2] rounded-[1.5rem] md:rounded-full hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-all">
                        <div className="px-6 py-3.5 md:py-3 flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                            <MapPin className="w-4 h-4" />
                          </div>
                          <div className="flex-1 text-left min-w-0">
                            <span className="block text-[9px] font-black uppercase tracking-widest text-[#4A5568] dark:text-white/50 mb-0.5">Where to?</span>
                            <Select
                              value={searchData.destination}
                              onValueChange={(value) => setSearchData((prev) => ({ ...prev, destination: value }))}
                            >
                              <SelectTrigger className="h-auto p-0 border-none bg-transparent text-[#111439] dark:text-white font-bold focus:ring-0 text-sm md:text-base [&>svg]:hidden w-full text-left truncate">
                                <SelectValue placeholder="Srinagar, Gulmarg, Doodhpathri..." />
                              </SelectTrigger>
                              <SelectContent className="bg-white dark:bg-[#0F141C] border-slate-200 dark:border-white/10 text-[#111439] dark:text-white rounded-2xl p-1.5 shadow-2xl z-50">
                                {destinations.map((dest) => (
                                  <SelectItem key={dest} value={dest} className="rounded-xl cursor-pointer py-2.5 px-4">
                                    {dest}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      <div className="hidden md:block w-[1px] h-8 bg-slate-200 dark:bg-white/10 self-center mx-1" />

                      <div className="flex-1 rounded-[1.5rem] md:rounded-full hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-all">
                        <Popover>
                          <PopoverTrigger asChild>
                            <button type="button" className="w-full text-left outline-none">
                              <div className="px-6 py-3.5 md:py-3 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                                  <CalendarIcon className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <span className="block text-[9px] font-black uppercase tracking-widest text-[#4A5568] dark:text-white/50 mb-0.5">When</span>
                                  <span
                                    className={cn(
                                      'block text-sm md:text-base font-bold truncate leading-tight',
                                      selectedDate ? 'text-[#111439] dark:text-white' : 'text-slate-400 dark:text-white/40'
                                    )}
                                  >
                                    {selectedDate ? format(selectedDate, 'dd MMM yyyy') : 'Select date'}
                                  </span>
                                </div>
                              </div>
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 bg-white dark:bg-[#0F141C] border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl z-50" align="start" sideOffset={8}>
                            <Calendar
                              mode="single"
                              selected={selectedDate}
                              onSelect={(date) => {
                                setSelectedDate(date);
                                setSearchData((prev) => ({
                                  ...prev,
                                  dates: date ? format(date, 'yyyy-MM-dd') : '',
                                }));
                              }}
                              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                              initialFocus
                              className="rounded-2xl"
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="hidden md:block w-[1px] h-8 bg-slate-200 dark:bg-white/10 self-center mx-1" />

                      <div className="flex-1 md:flex-[0.9] rounded-[1.5rem] md:rounded-full hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-all">
                        <div className="px-6 py-3.5 md:py-3 flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                            <Users className="w-4 h-4" />
                          </div>
                          <div className="flex-1 text-left min-w-0">
                            <span className="block text-[9px] font-black uppercase tracking-widest text-[#4A5568] dark:text-white/50 mb-0.5">Travelers</span>
                            <Select
                              value={searchData.travelers}
                              onValueChange={(value) => setSearchData((prev) => ({ ...prev, travelers: value }))}
                            >
                              <SelectTrigger className="h-auto p-0 border-none bg-transparent text-[#111439] dark:text-white font-bold focus:ring-0 text-sm md:text-base [&>svg]:hidden w-full text-left truncate">
                                <SelectValue placeholder="Add guests" />
                              </SelectTrigger>
                              <SelectContent className="bg-white dark:bg-[#0F141C] border-slate-200 dark:border-white/10 text-[#111439] dark:text-white rounded-2xl p-1.5 shadow-2xl z-50">
                                {[1, 2, 4, 6, 8, '10+'].map((num) => (
                                  <SelectItem key={num} value={num.toString()} className="rounded-xl cursor-pointer py-2.5 px-4">
                                    {num} {num === 1 ? 'Guest' : 'Guests'}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {searchTab === 'hotels' && (
                    <div className="flex-1 flex flex-col md:flex-row gap-2 md:gap-0 animate-in fade-in slide-in-from-left-4 duration-300">
                      <div className="flex-1 md:flex-[1.2] rounded-[1.5rem] md:rounded-full hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-all">
                        <div className="px-6 py-3.5 md:py-3 flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                            <MapPin className="w-4 h-4" />
                          </div>
                          <div className="flex-1 text-left min-w-0">
                            <span className="block text-[9px] font-black uppercase tracking-widest text-[#4A5568] dark:text-white/50 mb-0.5">Destination Area</span>
                            <Select
                              value={hotelData.destination}
                              onValueChange={(value) => setHotelData((prev) => ({ ...prev, destination: value }))}
                            >
                              <SelectTrigger className="h-auto p-0 border-none bg-transparent text-[#111439] dark:text-white font-bold focus:ring-0 text-sm md:text-base [&>svg]:hidden w-full text-left truncate">
                                <SelectValue placeholder="Where to stay?" />
                              </SelectTrigger>
                              <SelectContent className="bg-white dark:bg-[#0F141C] border-slate-200 dark:border-white/10 text-[#111439] dark:text-white rounded-2xl p-1.5 shadow-2xl z-50">
                                {destinations.map((dest) => (
                                  <SelectItem key={dest} value={dest} className="rounded-xl cursor-pointer py-2.5 px-4">
                                    {dest}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      <div className="hidden md:block w-[1px] h-8 bg-slate-200 dark:bg-white/10 self-center mx-1" />

                      <div className="flex-1 rounded-[1.5rem] md:rounded-full hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-all">
                        <Popover>
                          <PopoverTrigger asChild>
                            <button type="button" className="w-full text-left outline-none">
                              <div className="px-6 py-3.5 md:py-3 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                                  <CalendarIcon className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <span className="block text-[9px] font-black uppercase tracking-widest text-[#4A5568] dark:text-white/50 mb-0.5">Check-In</span>
                                  <span
                                    className={cn(
                                      'block text-sm md:text-base font-bold truncate leading-tight',
                                      selectedHotelDate ? 'text-[#111439] dark:text-white' : 'text-slate-400 dark:text-white/40'
                                    )}
                                  >
                                    {selectedHotelDate ? format(selectedHotelDate, 'dd MMM yyyy') : 'Select date'}
                                  </span>
                                </div>
                              </div>
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 bg-white dark:bg-[#0F141C] border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl z-50" align="start" sideOffset={8}>
                            <Calendar
                              mode="single"
                              selected={selectedHotelDate}
                              onSelect={(date) => {
                                setSelectedHotelDate(date);
                                setHotelData((prev) => ({
                                  ...prev,
                                  checkIn: date ? format(date, 'yyyy-MM-dd') : '',
                                }));
                              }}
                              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                              initialFocus
                              className="rounded-2xl"
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="hidden md:block w-[1px] h-8 bg-slate-200 dark:bg-white/10 self-center mx-1" />

                      <div className="flex-1 md:flex-[0.9] rounded-[1.5rem] md:rounded-full hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-all">
                        <div className="px-6 py-3.5 md:py-3 flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                            <Users className="w-4 h-4" />
                          </div>
                          <div className="flex-1 text-left min-w-0">
                            <span className="block text-[9px] font-black uppercase tracking-widest text-[#4A5568] dark:text-white/50 mb-0.5">Guests</span>
                            <Select
                              value={hotelData.guests}
                              onValueChange={(value) => setHotelData((prev) => ({ ...prev, guests: value }))}
                            >
                              <SelectTrigger className="h-auto p-0 border-none bg-transparent text-[#111439] dark:text-white font-bold focus:ring-0 text-sm md:text-base [&>svg]:hidden w-full text-left truncate">
                                <SelectValue placeholder="Add guests" />
                              </SelectTrigger>
                              <SelectContent className="bg-white dark:bg-[#0F141C] border-slate-200 dark:border-white/10 text-[#111439] dark:text-white rounded-2xl p-1.5 shadow-2xl z-50">
                                {[1, 2, 3, 4, 5, '6+'].map((num) => (
                                  <SelectItem key={num} value={num.toString()} className="rounded-xl cursor-pointer py-2.5 px-4">
                                    {num} {num === 1 ? 'Guest' : 'Guests'}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {searchTab === 'cabs' && (
                    <div className="flex-1 flex flex-col md:flex-row gap-2 md:gap-0 animate-in fade-in slide-in-from-left-4 duration-300">
                      <div className="flex-1 md:flex-[1.2] rounded-[1.5rem] md:rounded-full hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-all">
                        <div className="px-6 py-3.5 md:py-3 flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                            <Navigation className="w-4 h-4" />
                          </div>
                          <div className="flex-1 text-left min-w-0">
                            <span className="block text-[9px] font-black uppercase tracking-widest text-[#4A5568] dark:text-white/50 mb-0.5">Pickup Point</span>
                            <Select
                              value={cabData.pickup}
                              onValueChange={(value) => setCabData((prev) => ({ ...prev, pickup: value }))}
                            >
                              <SelectTrigger className="h-auto p-0 border-none bg-transparent text-[#111439] dark:text-white font-bold focus:ring-0 text-sm md:text-base [&>svg]:hidden w-full text-left truncate">
                                <SelectValue placeholder="Pickup location" />
                              </SelectTrigger>
                              <SelectContent className="bg-white dark:bg-[#0F141C] border-slate-200 dark:border-white/10 text-[#111439] dark:text-white rounded-2xl p-1.5 shadow-2xl z-50">
                                {[
                                  'Srinagar Airport (SXR)',
                                  'Dal Lake Ghats, Srinagar',
                                  'Lal Chowk, Srinagar',
                                  'Gulmarg Gondola Resort, Gulmarg',
                                  'Pahalgam Main Market, Pahalgam',
                                  'Thajiwas Glacier, Sonamarg',
                                  'Doodhpathri Meadows',
                                ].map((loc) => (
                                  <SelectItem key={loc} value={loc} className="rounded-xl cursor-pointer py-2.5 px-4">
                                    {loc}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      <div className="hidden md:block w-[1px] h-8 bg-slate-200 dark:bg-white/10 self-center mx-1" />

                      <div className="flex-1 md:flex-[1.2] rounded-[1.5rem] md:rounded-full hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-all">
                        <div className="px-6 py-3.5 md:py-3 flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                            <MapPin className="w-4 h-4" />
                          </div>
                          <div className="flex-1 text-left min-w-0">
                            <span className="block text-[9px] font-black uppercase tracking-widest text-[#4A5568] dark:text-white/50 mb-0.5">Drop Point</span>
                            <Select
                              value={cabData.drop}
                              onValueChange={(value) => setCabData((prev) => ({ ...prev, drop: value }))}
                            >
                              <SelectTrigger className="h-auto p-0 border-none bg-transparent text-[#111439] dark:text-white font-bold focus:ring-0 text-sm md:text-base [&>svg]:hidden w-full text-left truncate">
                                <SelectValue placeholder="Where to drop?" />
                              </SelectTrigger>
                              <SelectContent className="bg-white dark:bg-[#0F141C] border-slate-200 dark:border-white/10 text-[#111439] dark:text-white rounded-2xl p-1.5 shadow-2xl z-50">
                                {[
                                  'Srinagar Airport (SXR)',
                                  'Dal Lake Ghats, Srinagar',
                                  'Gulmarg Gondola Resort, Gulmarg',
                                  'Pahalgam Main Market, Pahalgam',
                                  'Thajiwas Glacier, Sonamarg',
                                  'Doodhpathri Meadows',
                                  'Yousmarg Alpine Valley',
                                ].map((loc) => (
                                  <SelectItem key={loc} value={loc} className="rounded-xl cursor-pointer py-2.5 px-4">
                                    {loc}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      <div className="hidden md:block w-[1px] h-8 bg-slate-200 dark:bg-white/10 self-center mx-1" />

                      <div className="flex-1 rounded-[1.5rem] md:rounded-full hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-all">
                        <Popover>
                          <PopoverTrigger asChild>
                            <button type="button" className="w-full text-left outline-none">
                              <div className="px-6 py-3.5 md:py-3 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                                  <Clock className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <span className="block text-[9px] font-black uppercase tracking-widest text-[#4A5568] dark:text-white/50 mb-0.5">Date</span>
                                  <span
                                    className={cn(
                                      'block text-sm md:text-base font-bold truncate leading-tight',
                                      selectedCabDate ? 'text-[#111439] dark:text-white' : 'text-slate-400 dark:text-white/40'
                                    )}
                                  >
                                    {selectedCabDate ? format(selectedCabDate, 'dd MMM yyyy') : 'Select date'}
                                  </span>
                                </div>
                              </div>
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 bg-white dark:bg-[#0F141C] border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl z-50" align="start" sideOffset={8}>
                            <Calendar
                              mode="single"
                              selected={selectedCabDate}
                              onSelect={(date) => {
                                setSelectedCabDate(date);
                                setCabData((prev) => ({
                                  ...prev,
                                  date: date ? format(date, 'yyyy-MM-dd') : '',
                                }));
                              }}
                              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                              initialFocus
                              className="rounded-2xl"
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  )}

                  {searchTab === 'flights' && (
                    <div className="flex-1 flex flex-col md:flex-row gap-2 md:gap-0 animate-in fade-in slide-in-from-left-4 duration-300">
                      <div className="flex-1 md:flex-[1.2] rounded-[1.5rem] md:rounded-full hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-all">
                        <div className="px-6 py-3.5 md:py-3 flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                            <MapPin className="w-4 h-4" />
                          </div>
                          <div className="flex-1 text-left min-w-0">
                            <span className="block text-[9px] font-black uppercase tracking-widest text-[#4A5568] dark:text-white/50 mb-0.5">Flying From</span>
                            <Select
                              value={flightData.origin}
                              onValueChange={(value) => setFlightData((prev) => ({ ...prev, origin: value }))}
                            >
                              <SelectTrigger className="h-auto p-0 border-none bg-transparent text-[#111439] dark:text-white font-bold focus:ring-0 text-sm md:text-base [&>svg]:hidden w-full text-left truncate">
                                <SelectValue placeholder="Origin airport" />
                              </SelectTrigger>
                              <SelectContent className="bg-white dark:bg-[#0F141C] border-slate-200 dark:border-white/10 text-[#111439] dark:text-white rounded-2xl p-1.5 shadow-2xl z-50">
                                {[
                                  { code: 'DEL', city: 'New Delhi (DEL)' },
                                  { code: 'BOM', city: 'Mumbai (BOM)' },
                                  { code: 'BLR', city: 'Bengaluru (BLR)' },
                                  { code: 'HYD', city: 'Hyderabad (HYD)' },
                                  { code: 'MAA', city: 'Chennai (MAA)' },
                                  { code: 'CCU', city: 'Kolkata (CCU)' },
                                  { code: 'ATQ', city: 'Amritsar (ATQ)' },
                                ].map((ap) => (
                                  <SelectItem key={ap.code} value={ap.code} className="rounded-xl cursor-pointer py-2.5 px-4">
                                    {ap.city}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      <div className="hidden md:block w-[1px] h-8 bg-slate-200 dark:bg-white/10 self-center mx-1" />

                      <div className="flex-1 rounded-[1.5rem] md:rounded-full hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-all">
                        <div className="px-6 py-3.5 md:py-3 flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                            <Plane className="w-4 h-4" />
                          </div>
                          <div className="flex-1 text-left min-w-0">
                            <span className="block text-[9px] font-black uppercase tracking-widest text-[#4A5568] dark:text-white/50 mb-0.5">Flying To</span>
                            <span className="block text-sm md:text-base font-bold text-[#111439] dark:text-white leading-tight">Srinagar (SXR)</span>
                          </div>
                        </div>
                      </div>

                      <div className="hidden md:block w-[1px] h-8 bg-slate-200 dark:bg-white/10 self-center mx-1" />

                      <div className="flex-1 rounded-[1.5rem] md:rounded-full hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-all">
                        <Popover>
                          <PopoverTrigger asChild>
                            <button type="button" className="w-full text-left outline-none">
                              <div className="px-6 py-3.5 md:py-3 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                                  <CalendarIcon className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <span className="block text-[9px] font-black uppercase tracking-widest text-[#4A5568] dark:text-white/50 mb-0.5">Departure Date</span>
                                  <span
                                    className={cn(
                                      'block text-sm md:text-base font-bold truncate leading-tight',
                                      selectedFlightDate ? 'text-[#111439] dark:text-white' : 'text-slate-400 dark:text-white/40'
                                    )}
                                  >
                                    {selectedFlightDate ? format(selectedFlightDate, 'dd MMM yyyy') : 'Select date'}
                                  </span>
                                </div>
                              </div>
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 bg-white dark:bg-[#0F141C] border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl z-50" align="start" sideOffset={8}>
                            <Calendar
                              mode="single"
                              selected={selectedFlightDate}
                              onSelect={(date) => {
                                setSelectedFlightDate(date);
                                setFlightData((prev) => ({
                                  ...prev,
                                  dates: date ? format(date, 'yyyy-MM-dd') : '',
                                }));
                              }}
                              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                              initialFocus
                              className="rounded-2xl"
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  )}

                  {searchTab === 'bus' && (
                    <div className="flex-1 flex flex-col md:flex-row gap-2 md:gap-0 animate-in fade-in slide-in-from-left-4 duration-300">
                      <div className="flex-1 md:flex-[1.2] rounded-[1.5rem] md:rounded-full hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-all">
                        <div className="px-6 py-3.5 md:py-3 flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                            <Navigation className="w-4 h-4" />
                          </div>
                          <div className="flex-1 text-left min-w-0">
                            <span className="block text-[9px] font-black uppercase tracking-widest text-[#4A5568] dark:text-white/50 mb-0.5">Pickup Location</span>
                            <Select
                              value={busData.pickup}
                              onValueChange={(value) => setBusData((prev) => ({ ...prev, pickup: value }))}
                            >
                              <SelectTrigger className="h-auto p-0 border-none bg-transparent text-[#111439] dark:text-white font-bold focus:ring-0 text-sm md:text-base [&>svg]:hidden w-full text-left truncate">
                                <SelectValue placeholder="Pickup location" />
                              </SelectTrigger>
                              <SelectContent className="bg-white dark:bg-[#0F141C] border-slate-200 dark:border-white/10 text-[#111439] dark:text-white rounded-2xl p-1.5 shadow-2xl z-50">
                                {[
                                  'Srinagar Airport (SXR)',
                                  'Dal Lake Ghats, Srinagar',
                                  'Lal Chowk, Srinagar',
                                  'Gulmarg Gondola Resort, Gulmarg',
                                  'Pahalgam Main Market, Pahalgam',
                                ].map((loc) => (
                                  <SelectItem key={loc} value={loc} className="rounded-xl cursor-pointer py-2.5 px-4">
                                    {loc}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      <div className="hidden md:block w-[1px] h-8 bg-slate-200 dark:bg-white/10 self-center mx-1" />

                      <div className="flex-1 rounded-[1.5rem] md:rounded-full hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-all">
                        <Popover>
                          <PopoverTrigger asChild>
                            <button type="button" className="w-full text-left outline-none">
                              <div className="px-6 py-3.5 md:py-3 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                                  <CalendarIcon className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <span className="block text-[9px] font-black uppercase tracking-widest text-[#4A5568] dark:text-white/50 mb-0.5">Travel Date</span>
                                  <span
                                    className={cn(
                                      'block text-sm md:text-base font-bold truncate leading-tight',
                                      selectedBusDate ? 'text-[#111439] dark:text-white' : 'text-slate-400 dark:text-white/40'
                                    )}
                                  >
                                    {selectedBusDate ? format(selectedBusDate, 'dd MMM yyyy') : 'Select date'}
                                  </span>
                                </div>
                              </div>
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 bg-white dark:bg-[#0F141C] border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl z-50" align="start" sideOffset={8}>
                            <Calendar
                              mode="single"
                              selected={selectedBusDate}
                              onSelect={(date) => {
                                setSelectedBusDate(date);
                                setBusData((prev) => ({
                                  ...prev,
                                  date: date ? format(date, 'yyyy-MM-dd') : '',
                                }));
                              }}
                              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                              initialFocus
                              className="rounded-2xl"
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="hidden md:block w-[1px] h-8 bg-slate-200 dark:bg-white/10 self-center mx-1" />

                      <div className="flex-1 md:flex-[0.9] rounded-[1.5rem] md:rounded-full hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-all">
                        <div className="px-6 py-3.5 md:py-3 flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                            <Users className="w-4 h-4" />
                          </div>
                          <div className="flex-1 text-left min-w-0">
                            <span className="block text-[9px] font-black uppercase tracking-widest text-[#4A5568] dark:text-white/50 mb-0.5">Capacity</span>
                            <Select
                              value={busData.passengers}
                              onValueChange={(value) => setBusData((prev) => ({ ...prev, passengers: value }))}
                            >
                              <SelectTrigger className="h-auto p-0 border-none bg-transparent text-[#111439] dark:text-white font-bold focus:ring-0 text-sm md:text-base [&>svg]:hidden w-full text-left truncate">
                                <SelectValue placeholder="Passengers" />
                              </SelectTrigger>
                              <SelectContent className="bg-white dark:bg-[#0F141C] border-slate-200 dark:border-white/10 text-[#111439] dark:text-white rounded-2xl p-1.5 shadow-2xl z-50">
                                {[
                                  { label: '9-Seater (Urbania)', value: '10' },
                                  { label: '12-Seater (Tempo)', value: '12' },
                                  { label: '17-Seater Coach', value: '17' },
                                  { label: '26-Seater Mini-Bus', value: '26' },
                                ].map((coach) => (
                                  <SelectItem key={coach.value} value={coach.value} className="rounded-xl cursor-pointer py-2.5 px-4">
                                    {coach.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="p-1 md:p-0 flex items-center">
                    <Button
                      type="submit"
                      disabled={isSearching}
                      className="w-full md:w-auto h-13 md:h-14 md:px-8 rounded-[1.5rem] md:rounded-full bg-[#111439] hover:bg-[#1c225a] dark:bg-amber-400 dark:hover:bg-amber-300 text-white dark:text-black font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-[#111439]/20 hover:scale-[1.03] active:scale-95 transition-all duration-300 flex items-center justify-center gap-2.5"
                    >
                      {isSearching ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Search className="w-4 h-4" />
                          <span>Search</span>
                        </>
                      )}
                    </Button>
                  </div>
                </form>

                {/* Live Currency & Transparent Starting Tariff Strip */}
                <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-xs">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 shadow-sm">
                    <Globe className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-white/70">
                      5N/6D Luxury Curations from{' '}
                      <strong className="font-mono font-black text-[#111439] dark:text-amber-400">
                        {formatPrice(24500)}
                      </strong>{' '}
                      / couple
                    </span>
                  </div>

                  <div className="inline-flex items-center gap-1 p-1 rounded-full bg-white/80 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 shadow-sm">
                    {(Object.keys(SUPPORTED_CURRENCIES) as CurrencyCode[]).map((code) => (
                      <button
                        key={code}
                        type="button"
                        onClick={() => setCurrency(code)}
                        className={cn(
                          'px-2.5 py-1 rounded-full text-[10px] font-mono font-bold transition-all',
                          currency === code
                            ? 'bg-[#111439] text-white dark:bg-amber-400 dark:text-black shadow-sm'
                            : 'text-slate-500 dark:text-white/50 hover:text-[#111439] dark:hover:text-white'
                        )}
                      >
                        {code}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* B2B Travel Operating System Launchpad */
            <div className="w-full max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-left">
                {/* Stakeholder 1: Travel Agencies */}
                <div className="p-6 sm:p-7 rounded-3xl bg-white/95 dark:bg-[#0a0f14]/95 border border-slate-200/90 dark:border-white/10 shadow-xl hover:border-amber-400/60 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                        <Briefcase className="w-5 h-5" />
                      </div>
                      <span className="text-[9px] font-mono font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400">
                        400+ Agencies
                      </span>
                    </div>
                    <h3 className="font-display text-xl font-black text-[#111439] dark:text-white mb-2">
                      Travel Agency OS
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-white/60 leading-relaxed mb-4">
                      Contracted Kashmir net rates from{' '}
                      <strong className="font-mono text-[#111439] dark:text-amber-400">{formatPrice(38500)}</strong>, instant 90s white-label PDF quotes, and GST ledger.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-white/10">
                    <Button asChild className="flex-1 h-10 rounded-xl bg-[#111439] hover:bg-[#1c225a] dark:bg-amber-400 dark:hover:bg-amber-300 text-white dark:text-black font-black text-[11px] uppercase tracking-wider">
                      <Link to="/agent">Agency Portal</Link>
                    </Button>
                    <Button asChild variant="outline" className="h-10 rounded-xl border-slate-200 dark:border-white/15 text-xs font-bold">
                      <Link to="/agent/apply">Apply</Link>
                    </Button>
                  </div>
                </div>

                {/* Stakeholder 2: Hoteliers & Houseboats */}
                <div className="p-6 sm:p-7 rounded-3xl bg-white/95 dark:bg-[#0a0f14]/95 border border-slate-200/90 dark:border-white/10 shadow-xl hover:border-emerald-400/60 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <BedDouble className="w-5 h-5" />
                      </div>
                      <span className="text-[9px] font-mono font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                        CRS Sync
                      </span>
                    </div>
                    <h3 className="font-display text-xl font-black text-[#111439] dark:text-white mb-2">
                      Hoteliers & Houseboats
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-white/60 leading-relaxed mb-4">
                      Centralized room & seasonal tariff manager, reception check-in desk, housekeeping board, and verified payouts.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-white/10">
                    <Button asChild className="flex-1 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] uppercase tracking-wider">
                      <Link to="/hospitality">Hotel CRS Desk</Link>
                    </Button>
                    <Button asChild variant="outline" className="h-10 rounded-xl border-slate-200 dark:border-white/15 text-xs font-bold">
                      <Link to="/vendor">List Property</Link>
                    </Button>
                  </div>
                </div>

                {/* Stakeholder 3: Cab Fleet Owners */}
                <div className="p-6 sm:p-7 rounded-3xl bg-white/95 dark:bg-[#0a0f14]/95 border border-slate-200/90 dark:border-white/10 shadow-xl hover:border-sky-400/60 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-11 h-11 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400">
                        <Car className="w-5 h-5" />
                      </div>
                      <span className="text-[9px] font-mono font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-700 dark:text-sky-400">
                        4x4 Telemetry
                      </span>
                    </div>
                    <h3 className="font-display text-xl font-black text-[#111439] dark:text-white mb-2">
                      Cab Fleet & Chauffeur OS
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-white/60 leading-relaxed mb-4">
                      Direct SXR airport & mountain pass dispatch, snow-chain compliance vault, and zero-middleman settlements.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-white/10">
                    <Button asChild className="flex-1 h-10 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-[11px] uppercase tracking-wider">
                      <Link to="/driver">Fleet Cockpit</Link>
                    </Button>
                    <Button asChild variant="outline" className="h-10 rounded-xl border-slate-200 dark:border-white/15 text-xs font-bold">
                      <Link to="/vendor">Onboard Fleet</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Unified Live Ground Radar & Trust Ribbon */}
          <div
            className="w-full max-w-4xl mt-10 px-5 sm:px-6 py-3.5 rounded-3xl sm:rounded-full bg-white/90 dark:bg-[#0a0f14]/90 border border-slate-200/90 dark:border-white/10 shadow-lg shadow-slate-900/5 backdrop-blur-xl flex flex-wrap items-center justify-around gap-3 sm:gap-4 text-xs font-semibold animate-fade-up"
            style={{ animationDelay: '350ms' }}
          >
            <Link to="/travel-status" className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] tracking-wide hover:underline">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>Live Ground Radar Active</span>
            </Link>

            <div className="h-4 w-[1px] bg-slate-200 dark:bg-white/10 hidden sm:block" />

            <div className="flex items-center gap-1.5 text-slate-700 dark:text-white/80 font-bold text-[11px]">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>4.95★ Verified Rating</span>
            </div>

            <div className="h-4 w-[1px] bg-slate-200 dark:bg-white/10 hidden sm:block" />

            <div className="flex items-center gap-1.5 text-slate-700 dark:text-white/80 font-bold text-[11px]">
              <CheckCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>J&K Tourism Approved</span>
            </div>

            <div className="h-4 w-[1px] bg-slate-200 dark:bg-white/10 hidden sm:block" />

            <div className="flex items-center gap-1.5 text-slate-700 dark:text-white/80 font-bold text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Kashmir Flex Protection</span>
            </div>
          </div>

          {/* Floating High-Fidelity Stats */}
          <div className="grid grid-cols-3 gap-3 sm:gap-6 md:gap-12 mt-10 md:mt-14 w-full max-w-4xl px-2 animate-fade-up" style={{ animationDelay: '400ms' }}>
            {heroData.stats.map((stat) => (
              <div key={stat.label} className="text-center group cursor-default">
                <div className="font-display text-2xl sm:text-3xl md:text-4xl font-black text-[#111439] dark:text-white mb-1 md:mb-1.5 tracking-tight group-hover:text-amber-500 transition-colors duration-500 tabular-nums">
                  {stat.value}
                </div>
                <div className="text-[8px] sm:text-[9px] md:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.28em] text-[#4A5568] dark:text-white/60 leading-tight">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="hidden md:flex absolute bottom-5 left-1/2 -translate-x-1/2 flex-col items-center gap-2 opacity-60 hover:opacity-100 transition-opacity duration-500">
        <span className="text-[9px] font-black uppercase tracking-[0.35em] text-[#4A5568] dark:text-white/50">Explore</span>
        <div className="w-[1.5px] h-10 bg-gradient-to-b from-[#111439] dark:from-amber-400 to-transparent" />
      </div>
    </section>
  );
}
