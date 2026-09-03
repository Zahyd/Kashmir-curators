import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MapPin, Calendar as CalendarIcon, Users, Loader2, Sparkles, 
  ArrowRight, Search, CheckCircle, Award, ShieldCheck, 
  Compass, Building, Car, Navigation, Clock,
  Bed, Plane, Bus, Luggage
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
import { API_BASE_URL, SOCKET_URL } from '@/lib/api';
import { io } from 'socket.io-client';

export default function HeroSection() {
  const navigate = useNavigate();
  const { data: destinations = [] } = useDestinations();
  const [isSearching, setIsSearching] = useState(false);
  const [searchTab, setSearchTab] = useState<'packages' | 'hotels' | 'cabs' | 'flights' | 'bus'>('packages');
  
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
    title: 'BEYOND the ORDINARY',
    subtitle: 'Experience Kashmir as it was meant to be seen: Private, Peerless, and Profoundly Beautiful.',
    imageUrl: heroImage,
    stats: [
      { value: '1,200+', label: 'Elite Curations' },
      { value: '4.95', label: 'Satisfaction Index' },
      { value: '24/7', label: 'Concierge Protocol' },
    ]
  });

  const updateHeroState = (h: Record<string, any>) => {
    setHeroData({
      title: h?.title || 'BEYOND the ORDINARY',
      subtitle: h?.subtitle || 'Experience Kashmir as it was meant to be seen: Private, Peerless, and Profoundly Beautiful.',
      imageUrl: h?.image_url || heroImage,
      stats: [
        { value: h?.content?.stat1_value || '1,200+', label: h?.content?.stat1_label || 'Elite Curations' },
        { value: h?.content?.stat2_value || '4.95', label: h?.content?.stat2_label || 'Satisfaction Index' },
        { value: h?.content?.stat3_value || '24/7', label: h?.content?.stat3_label || 'Concierge Protocol' },
      ]
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

    const socket = io(SOCKET_URL);
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
      await new Promise(resolve => setTimeout(resolve, 600));
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
      await new Promise(resolve => setTimeout(resolve, 600));
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
      await new Promise(resolve => setTimeout(resolve, 600));
      const params = new URLSearchParams();
      if (cabData.pickup) params.set('pickup', cabData.pickup);
      if (cabData.drop) params.set('drop', cabData.drop);
      if (cabData.date) params.set('date', cabData.date);
      navigate(`/cabs?${params.toString()}`);
    } else if (searchTab === 'flights') {
      setIsSearching(true);
      await new Promise(resolve => setTimeout(resolve, 600));
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
      await new Promise(resolve => setTimeout(resolve, 600));
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
        <span className="text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/20">
          {lastWord}
        </span>
      </>
    );
  };

  return (
    <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden bg-[#F8F8F9] pt-28 pb-20">
      {/* Stripe-style Daylight Aurora Gradient Mesh */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-40 w-[680px] h-[680px] rounded-full bg-gradient-to-br from-[#FFB800]/28 to-amber-400/10 blur-[130px]" />
        <div className="absolute top-10 right-0 w-[720px] h-[620px] rounded-full bg-gradient-to-br from-[#00D4FF]/25 via-blue-500/15 to-transparent blur-[140px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[550px] rounded-full bg-gradient-to-tr from-[#7928CA]/15 via-[#FF6584]/15 to-transparent blur-[150px]" />
        
        {/* Subtle Kashmir Mountain Silhouette Watermark */}
        <div 
          className="absolute inset-0 bg-cover bg-bottom bg-no-repeat opacity-[0.05] mix-blend-multiply"
          style={{ backgroundImage: `url(${heroData.imageUrl})` }}
        />
        {/* Subtle grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]" 
          style={{ backgroundImage: 'radial-gradient(#111439 1px, transparent 1px)', backgroundSize: '36px 36px' }} 
        />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 pt-16 pb-12">
        <div className="flex flex-col items-center text-center">
          {/* Elite Badge */}
          <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-white/90 dark:bg-white/5 border border-slate-200/90 dark:border-white/10 shadow-sm mb-8 animate-fade-up group hover:border-slate-300 dark:hover:border-white/20 transition-all duration-500 cursor-default">
            <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#111439] dark:text-white">
              The Signature Kashmir Collection 2026
            </span>
          </div>

          {/* Headline - Editorial Style in Solid Dark Blue #111439 */}
          <div className="max-w-5xl mb-8 space-y-4">
            <h1 className="font-display text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-[#111439] dark:text-white leading-[1.0] tracking-tight animate-fade-up transition-all duration-700 uppercase" style={{ animationDelay: '100ms' }}>
              {renderStyledTitle(heroData.title)}
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-[#4A5568] dark:text-white/60 font-medium max-w-2xl mx-auto tracking-normal animate-fade-up transition-all duration-700" style={{ animationDelay: '200ms' }}>
              {heroData.subtitle}
            </p>
          </div>

          {/* Daylight Command Module (Search) */}
          <div className="w-full max-w-5xl animate-fade-up" style={{ animationDelay: '300ms' }}>
            {/* Flat Search Tabs */}
            <div className="flex items-center gap-6 md:gap-10 mb-6 justify-center md:justify-start pl-4 md:pl-8 overflow-x-auto no-scrollbar pb-1">
              <button 
                type="button"
                onClick={() => setSearchTab('packages')}
                className={cn(
                  "flex items-center gap-2 pb-2 text-[11px] font-black uppercase tracking-widest transition-all duration-300 border-b-2",
                  searchTab === 'packages' 
                    ? "border-[#111439] text-[#111439] dark:border-amber-400 dark:text-amber-400 scale-105" 
                    : "border-transparent text-[#4A5568] dark:text-white/60 hover:text-[#111439] dark:hover:text-white"
                )}
              >
                <Luggage className="w-4 h-4 text-amber-500" />
                <span>Luxury Packages</span>
              </button>
              
              <button 
                type="button"
                onClick={() => setSearchTab('hotels')}
                className={cn(
                  "flex items-center gap-2 pb-2 text-[11px] font-black uppercase tracking-widest transition-all duration-300 border-b-2",
                  searchTab === 'hotels' 
                    ? "border-[#111439] text-[#111439] dark:border-amber-400 dark:text-amber-400 scale-105" 
                    : "border-transparent text-[#4A5568] dark:text-white/60 hover:text-[#111439] dark:hover:text-white"
                )}
              >
                <Bed className="w-4 h-4 text-amber-500" />
                <span>Premium Estates</span>
              </button>
              
              <button 
                type="button"
                onClick={() => setSearchTab('cabs')}
                className={cn(
                  "flex items-center gap-2 pb-2 text-[11px] font-black uppercase tracking-widest transition-all duration-300 border-b-2",
                  searchTab === 'cabs' 
                    ? "border-[#111439] text-[#111439] dark:border-amber-400 dark:text-amber-400 scale-105" 
                    : "border-transparent text-[#4A5568] dark:text-white/60 hover:text-[#111439] dark:hover:text-white"
                )}
              >
                <Car className="w-4 h-4 text-amber-500" />
                <span>Luxury Fleet</span>
              </button>
              
              <button 
                type="button"
                onClick={() => setSearchTab('flights')}
                className={cn(
                  "flex items-center gap-2 pb-2 text-[11px] font-black uppercase tracking-widest transition-all duration-300 border-b-2",
                  searchTab === 'flights' 
                    ? "border-[#111439] text-[#111439] dark:border-amber-400 dark:text-amber-400 scale-105" 
                    : "border-transparent text-[#4A5568] dark:text-white/60 hover:text-[#111439] dark:hover:text-white"
                )}
              >
                <Plane className="w-4 h-4 text-amber-500" />
                <span>Flights</span>
              </button>
              
              <button 
                type="button"
                onClick={() => setSearchTab('bus')}
                className={cn(
                  "flex items-center gap-2 pb-2 text-[11px] font-black uppercase tracking-widest transition-all duration-300 border-b-2",
                  searchTab === 'bus' 
                    ? "border-[#111439] text-[#111439] dark:border-amber-400 dark:text-amber-400 scale-105" 
                    : "border-transparent text-[#4A5568] dark:text-white/60 hover:text-[#111439] dark:hover:text-white"
                )}
              >
                <Bus className="w-4 h-4 text-amber-500" />
                <span>Luxury Coaches</span>
              </button>
            </div>

            <form 
              onSubmit={handleSearch}
              className="bg-white/95 dark:bg-[#0a0f12]/95 backdrop-blur-2xl border border-slate-200/90 dark:border-white/10 rounded-[2.5rem] md:rounded-full p-2.5 md:p-3.5 shadow-2xl shadow-slate-900/8 flex flex-col md:flex-row gap-2 md:gap-0 relative group transition-all duration-500 hover:border-slate-300 dark:hover:border-white/20 hover:shadow-[0_25px_60px_-15px_rgba(17,20,57,0.12)]"
            >
              {searchTab === 'packages' && (
                <div className="flex-1 flex flex-col md:flex-row gap-2 md:gap-0">
                  {/* Destination */}
                  <div className="flex-1 md:flex-[1.2] relative group/segment rounded-[1.5rem] md:rounded-full hover:bg-slate-50 transition-all duration-300">
                    <div className="px-6 py-4 md:py-3 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 group-hover/segment:bg-amber-500/20 transition-all duration-300">
                        <MapPin className="w-4.5 h-4.5" />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <span className="block text-[9px] font-black uppercase tracking-widest text-[#4A5568] mb-0.5">Where to?</span>
                        <Select
                          value={searchData.destination}
                          onValueChange={(value) => setSearchData(prev => ({ ...prev, destination: value }))}
                        >
                          <SelectTrigger className="h-auto p-0 border-none bg-transparent text-[#111439] font-bold focus:ring-0 text-sm md:text-base focus-visible:ring-0 focus:outline-none focus:border-none focus-visible:ring-offset-0 [&>svg]:hidden w-full text-left truncate">
                            <SelectValue placeholder="Search destinations" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-slate-200 text-[#111439] rounded-2xl p-1.5 shadow-2xl z-50">
                            {destinations.map((dest) => (
                              <SelectItem key={dest} value={dest} className="hover:bg-slate-100 focus:bg-slate-100 rounded-xl cursor-pointer py-2.5 px-4 text-[#111439]">{dest}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="hidden md:block w-[1px] h-8 bg-slate-200 self-center mx-1" />

                  {/* Dates */}
                  <div className="flex-1 md:flex-1 relative rounded-[1.5rem] md:rounded-full hover:bg-slate-50 transition-all duration-300">
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="w-full text-left outline-none focus:outline-none"
                        >
                          <div className="px-6 py-4 md:py-3 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 transition-all duration-300">
                              <CalendarIcon className="w-4.5 h-4.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="block text-[9px] font-black uppercase tracking-widest text-[#4A5568] mb-0.5">When</span>
                              <span className={cn(
                                "block text-sm md:text-base font-bold truncate leading-tight transition-colors",
                                selectedDate ? "text-[#111439]" : "text-slate-400"
                              )}>
                                {selectedDate ? format(selectedDate, "dd MMM yyyy") : "Select date"}
                              </span>
                            </div>
                          </div>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-white border-slate-200 text-[#111439] rounded-2xl shadow-2xl z-50" align="start" sideOffset={8}>
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) => {
                            setSelectedDate(date);
                            setSearchData(prev => ({
                              ...prev,
                              dates: date ? format(date, 'yyyy-MM-dd') : ''
                            }));
                          }}
                          disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                          initialFocus
                          className="bg-white text-[#111439] rounded-2xl"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Divider */}
                  <div className="hidden md:block w-[1px] h-8 bg-slate-200 self-center mx-1" />

                  {/* Travelers */}
                  <div className="flex-1 md:flex-[0.9] relative group/segment rounded-[1.5rem] md:rounded-full hover:bg-slate-50 transition-all duration-300">
                    <div className="px-6 py-4 md:py-3 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 group-hover/segment:bg-amber-500/20 transition-all duration-300">
                        <Users className="w-4.5 h-4.5" />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <span className="block text-[9px] font-black uppercase tracking-widest text-[#4A5568] mb-0.5">Who</span>
                        <Select
                          value={searchData.travelers}
                          onValueChange={(value) => setSearchData(prev => ({ ...prev, travelers: value }))}
                        >
                          <SelectTrigger className="h-auto p-0 border-none bg-transparent text-[#111439] font-bold focus:ring-0 text-sm md:text-base focus-visible:ring-0 focus:outline-none focus:border-none focus-visible:ring-offset-0 [&>svg]:hidden w-full text-left truncate">
                            <SelectValue placeholder="Add guests" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-slate-200 text-[#111439] rounded-2xl p-1.5 shadow-2xl z-50">
                            {[1, 2, 4, 6, 8, '10+'].map((num) => (
                              <SelectItem key={num} value={num.toString()} className="hover:bg-slate-100 focus:bg-slate-100 rounded-xl cursor-pointer py-2.5 px-4 text-[#111439]">
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
                  {/* Destination */}
                  <div className="flex-1 md:flex-[1.2] relative group/segment rounded-[1.5rem] md:rounded-full hover:bg-slate-50 transition-all duration-300">
                    <div className="px-6 py-4 md:py-3 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 group-hover/segment:bg-amber-500/20 transition-all duration-300">
                        <MapPin className="w-4.5 h-4.5" />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <span className="block text-[9px] font-black uppercase tracking-widest text-[#4A5568] mb-0.5">Destination Area</span>
                        <Select
                          value={hotelData.destination}
                          onValueChange={(value) => setHotelData(prev => ({ ...prev, destination: value }))}
                        >
                          <SelectTrigger className="h-auto p-0 border-none bg-transparent text-[#111439] font-bold focus:ring-0 text-sm md:text-base focus-visible:ring-0 focus:outline-none focus:border-none focus-visible:ring-offset-0 [&>svg]:hidden w-full text-left truncate">
                            <SelectValue placeholder="Where to stay?" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-slate-200 text-[#111439] rounded-2xl p-1.5 shadow-2xl z-50">
                            {destinations.map((dest) => (
                              <SelectItem key={dest} value={dest} className="hover:bg-slate-100 focus:bg-slate-100 rounded-xl cursor-pointer py-2.5 px-4 text-[#111439]">{dest}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="hidden md:block w-[1px] h-8 bg-slate-200 self-center mx-1" />

                  {/* Check-In */}
                  <div className="flex-1 md:flex-1 relative rounded-[1.5rem] md:rounded-full hover:bg-slate-50 transition-all duration-300">
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="w-full text-left outline-none focus:outline-none"
                        >
                          <div className="px-6 py-4 md:py-3 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 transition-all duration-300">
                              <CalendarIcon className="w-4.5 h-4.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="block text-[9px] font-black uppercase tracking-widest text-[#4A5568] mb-0.5">Check-In</span>
                              <span className={cn(
                                "block text-sm md:text-base font-bold truncate leading-tight transition-colors",
                                selectedHotelDate ? "text-[#111439]" : "text-slate-400"
                              )}>
                                {selectedHotelDate ? format(selectedHotelDate, "dd MMM yyyy") : "Select date"}
                              </span>
                            </div>
                          </div>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-white border-slate-200 text-[#111439] rounded-2xl shadow-2xl z-50" align="start" sideOffset={8}>
                        <Calendar
                          mode="single"
                          selected={selectedHotelDate}
                          onSelect={(date) => {
                            setSelectedHotelDate(date);
                            setHotelData(prev => ({
                              ...prev,
                              checkIn: date ? format(date, 'yyyy-MM-dd') : ''
                            }));
                          }}
                          disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                          initialFocus
                          className="bg-white text-[#111439] rounded-2xl"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Divider */}
                  <div className="hidden md:block w-[1px] h-8 bg-slate-200 self-center mx-1" />

                  {/* Guests */}
                  <div className="flex-1 md:flex-[0.9] relative group/segment rounded-[1.5rem] md:rounded-full hover:bg-slate-50 transition-all duration-300">
                    <div className="px-6 py-4 md:py-3 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 group-hover/segment:bg-amber-500/20 transition-all duration-300">
                        <Users className="w-4.5 h-4.5" />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <span className="block text-[9px] font-black uppercase tracking-widest text-[#4A5568] mb-0.5">Guests</span>
                        <Select
                          value={hotelData.guests}
                          onValueChange={(value) => setHotelData(prev => ({ ...prev, guests: value }))}
                        >
                          <SelectTrigger className="h-auto p-0 border-none bg-transparent text-[#111439] font-bold focus:ring-0 text-sm md:text-base focus-visible:ring-0 focus:outline-none focus:border-none focus-visible:ring-offset-0 [&>svg]:hidden w-full text-left truncate">
                            <SelectValue placeholder="Add guests" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-slate-200 text-[#111439] rounded-2xl p-1.5 shadow-2xl z-50">
                            {[1, 2, 3, 4, 5, '6+'].map((num) => (
                              <SelectItem key={num} value={num.toString()} className="hover:bg-slate-100 focus:bg-slate-100 rounded-xl cursor-pointer py-2.5 px-4 text-[#111439]">
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
                  {/* Pickup */}
                  <div className="flex-1 md:flex-[1.2] relative group/segment rounded-[1.5rem] md:rounded-full hover:bg-slate-50 transition-all duration-300">
                    <div className="px-6 py-4 md:py-3 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 group-hover/segment:bg-amber-500/20 transition-all duration-300">
                        <Navigation className="w-4.5 h-4.5" />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <span className="block text-[9px] font-black uppercase tracking-widest text-[#4A5568] mb-0.5">Pickup Point</span>
                        <Select
                          value={cabData.pickup}
                          onValueChange={(value) => setCabData(prev => ({ ...prev, pickup: value }))}
                        >
                          <SelectTrigger className="h-auto p-0 border-none bg-transparent text-[#111439] font-bold focus:ring-0 text-sm md:text-base focus-visible:ring-0 focus:outline-none focus:border-none focus-visible:ring-offset-0 [&>svg]:hidden w-full text-left truncate">
                            <SelectValue placeholder="Pickup location" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-slate-200 text-[#111439] rounded-2xl p-1.5 shadow-2xl z-50">
                            {[
                              "Srinagar Airport (SXR)",
                              "Dal Lake Ghats, Srinagar",
                              "Lal Chowk, Srinagar",
                              "Gulmarg Gondola Resort, Gulmarg",
                              "Pahalgam Main Market, Pahalgam",
                              "Thajiwas Glacier, Sonamarg"
                            ].map((loc) => (
                              <SelectItem key={loc} value={loc} className="hover:bg-slate-100 focus:bg-slate-100 rounded-xl cursor-pointer py-2.5 px-4 text-[#111439]">{loc}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="hidden md:block w-[1px] h-8 bg-slate-200 self-center mx-1" />

                  {/* Drop */}
                  <div className="flex-1 md:flex-[1.2] relative group/segment rounded-[1.5rem] md:rounded-full hover:bg-slate-50 transition-all duration-300">
                    <div className="px-6 py-4 md:py-3 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 group-hover/segment:bg-amber-500/20 transition-all duration-300">
                        <MapPin className="w-4.5 h-4.5" />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <span className="block text-[9px] font-black uppercase tracking-widest text-[#4A5568] mb-0.5">Drop Point</span>
                        <Select
                          value={cabData.drop}
                          onValueChange={(value) => setCabData(prev => ({ ...prev, drop: value }))}
                        >
                          <SelectTrigger className="h-auto p-0 border-none bg-transparent text-[#111439] font-bold focus:ring-0 text-sm md:text-base focus-visible:ring-0 focus:outline-none focus:border-none focus-visible:ring-offset-0 [&>svg]:hidden w-full text-left truncate">
                            <SelectValue placeholder="Where to drop?" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-slate-200 text-[#111439] rounded-2xl p-1.5 shadow-2xl z-50">
                            {[
                              "Srinagar Airport (SXR)",
                              "Dal Lake Ghats, Srinagar",
                              "Lal Chowk, Srinagar",
                              "Gulmarg Gondola Resort, Gulmarg",
                              "Pahalgam Main Market, Pahalgam",
                              "Thajiwas Glacier, Sonamarg",
                              "Doodhpathri Meadows",
                              "Yousmarg Alpine Valley"
                            ].map((loc) => (
                              <SelectItem key={loc} value={loc} className="hover:bg-slate-100 focus:bg-slate-100 rounded-xl cursor-pointer py-2.5 px-4 text-[#111439]">{loc}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="hidden md:block w-[1px] h-8 bg-slate-200 self-center mx-1" />

                  {/* Date */}
                  <div className="flex-1 md:flex-1 relative rounded-[1.5rem] md:rounded-full hover:bg-slate-50 transition-all duration-300">
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="w-full text-left outline-none focus:outline-none"
                        >
                          <div className="px-6 py-4 md:py-3 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 transition-all duration-300">
                              <Clock className="w-4.5 h-4.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="block text-[9px] font-black uppercase tracking-widest text-[#4A5568] mb-0.5">Date</span>
                              <span className={cn(
                                "block text-sm md:text-base font-bold truncate leading-tight transition-colors",
                                selectedCabDate ? "text-[#111439]" : "text-slate-400"
                              )}>
                                {selectedCabDate ? format(selectedCabDate, "dd MMM yyyy") : "Select date"}
                              </span>
                            </div>
                          </div>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-white border-slate-200 text-[#111439] rounded-2xl shadow-2xl z-50" align="start" sideOffset={8}>
                        <Calendar
                          mode="single"
                          selected={selectedCabDate}
                          onSelect={(date) => {
                            setSelectedCabDate(date);
                            setCabData(prev => ({
                              ...prev,
                              date: date ? format(date, 'yyyy-MM-dd') : ''
                            }));
                          }}
                          disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                          initialFocus
                          className="bg-white text-[#111439] rounded-2xl"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}
              
              {searchTab === 'flights' && (
                <div className="flex-1 flex flex-col md:flex-row gap-2 md:gap-0 animate-in fade-in slide-in-from-left-4 duration-300">
                  {/* Origin */}
                  <div className="flex-1 md:flex-[1.2] relative group/segment rounded-[1.5rem] md:rounded-full hover:bg-slate-50 transition-all duration-300">
                    <div className="px-6 py-4 md:py-3 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 group-hover/segment:bg-amber-500/20 transition-all duration-300">
                        <MapPin className="w-4.5 h-4.5" />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <span className="block text-[9px] font-black uppercase tracking-widest text-[#4A5568] mb-0.5">Flying From</span>
                        <Select
                          value={flightData.origin}
                          onValueChange={(value) => setFlightData(prev => ({ ...prev, origin: value }))}
                        >
                          <SelectTrigger className="h-auto p-0 border-none bg-transparent text-[#111439] font-bold focus:ring-0 text-sm md:text-base focus-visible:ring-0 focus:outline-none focus:border-none focus-visible:ring-offset-0 [&>svg]:hidden w-full text-left truncate">
                            <SelectValue placeholder="Origin airport" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-slate-200 text-[#111439] rounded-2xl p-1.5 shadow-2xl z-50">
                            {[
                              { code: 'DEL', city: 'New Delhi (DEL)' },
                              { code: 'BOM', city: 'Mumbai (BOM)' },
                              { code: 'BLR', city: 'Bengaluru (BLR)' },
                              { code: 'HYD', city: 'Hyderabad (HYD)' },
                              { code: 'MAA', city: 'Chennai (MAA)' },
                              { code: 'CCU', city: 'Kolkata (CCU)' },
                              { code: 'ATQ', city: 'Amritsar (ATQ)' },
                            ].map((ap) => (
                              <SelectItem key={ap.code} value={ap.code} className="hover:bg-slate-100 focus:bg-slate-100 rounded-xl cursor-pointer py-2.5 px-4 text-[#111439]">{ap.city}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="hidden md:block w-[1px] h-8 bg-slate-200 self-center mx-1" />

                  {/* Destination */}
                  <div className="flex-1 md:flex-1 relative group/segment rounded-[1.5rem] md:rounded-full hover:bg-slate-50 transition-all duration-300">
                    <div className="px-6 py-4 md:py-3 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 group-hover/segment:bg-amber-500/20 transition-all duration-300">
                        <Plane className="w-4.5 h-4.5" />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <span className="block text-[9px] font-black uppercase tracking-widest text-[#4A5568] mb-0.5">Flying To</span>
                        <span className="block text-sm md:text-base font-bold text-[#111439] leading-tight">Srinagar (SXR)</span>
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="hidden md:block w-[1px] h-8 bg-slate-200 self-center mx-1" />

                  {/* Date */}
                  <div className="flex-1 md:flex-1 relative rounded-[1.5rem] md:rounded-full hover:bg-slate-50 transition-all duration-300">
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="w-full text-left outline-none focus:outline-none"
                        >
                          <div className="px-6 py-4 md:py-3 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 transition-all duration-300">
                              <CalendarIcon className="w-4.5 h-4.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="block text-[9px] font-black uppercase tracking-widest text-[#4A5568] mb-0.5">Departure Date</span>
                              <span className={cn(
                                "block text-sm md:text-base font-bold truncate leading-tight transition-colors",
                                selectedFlightDate ? "text-[#111439]" : "text-slate-400"
                              )}>
                                {selectedFlightDate ? format(selectedFlightDate, "dd MMM yyyy") : "Select date"}
                              </span>
                            </div>
                          </div>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-white border-slate-200 text-[#111439] rounded-2xl shadow-2xl z-50" align="start" sideOffset={8}>
                        <Calendar
                          mode="single"
                          selected={selectedFlightDate}
                          onSelect={(date) => {
                            setSelectedFlightDate(date);
                            setFlightData(prev => ({
                              ...prev,
                              dates: date ? format(date, 'yyyy-MM-dd') : ''
                            }));
                          }}
                          disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                          initialFocus
                          className="bg-white text-[#111439] rounded-2xl"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}

              {searchTab === 'bus' && (
                <div className="flex-1 flex flex-col md:flex-row gap-2 md:gap-0 animate-in fade-in slide-in-from-left-4 duration-300">
                  {/* Pickup */}
                  <div className="flex-1 md:flex-[1.2] relative group/segment rounded-[1.5rem] md:rounded-full hover:bg-slate-50 transition-all duration-300">
                    <div className="px-6 py-4 md:py-3 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 group-hover/segment:bg-amber-500/20 transition-all duration-300">
                        <Navigation className="w-4.5 h-4.5" />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <span className="block text-[9px] font-black uppercase tracking-widest text-[#4A5568] mb-0.5">Pickup Location</span>
                        <Select
                          value={busData.pickup}
                          onValueChange={(value) => setBusData(prev => ({ ...prev, pickup: value }))}
                        >
                          <SelectTrigger className="h-auto p-0 border-none bg-transparent text-[#111439] font-bold focus:ring-0 text-sm md:text-base focus-visible:ring-0 focus:outline-none focus:border-none focus-visible:ring-offset-0 [&>svg]:hidden w-full text-left truncate">
                            <SelectValue placeholder="Pickup location" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-slate-200 text-[#111439] rounded-2xl p-1.5 shadow-2xl z-50">
                            {[
                              "Srinagar Airport (SXR)",
                              "Dal Lake Ghats, Srinagar",
                              "Lal Chowk, Srinagar",
                              "Gulmarg Gondola Resort, Gulmarg",
                              "Pahalgam Main Market, Pahalgam"
                            ].map((loc) => (
                              <SelectItem key={loc} value={loc} className="hover:bg-slate-100 focus:bg-slate-100 rounded-xl cursor-pointer py-2.5 px-4 text-[#111439]">{loc}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="hidden md:block w-[1px] h-8 bg-slate-200 self-center mx-1" />

                  {/* Date */}
                  <div className="flex-1 md:flex-1 relative rounded-[1.5rem] md:rounded-full hover:bg-slate-50 transition-all duration-300">
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="w-full text-left outline-none focus:outline-none"
                        >
                          <div className="px-6 py-4 md:py-3 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 transition-all duration-300">
                              <CalendarIcon className="w-4.5 h-4.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="block text-[9px] font-black uppercase tracking-widest text-[#4A5568] mb-0.5">Travel Date</span>
                              <span className={cn(
                                "block text-sm md:text-base font-bold truncate leading-tight transition-colors",
                                selectedBusDate ? "text-[#111439]" : "text-slate-400"
                              )}>
                                {selectedBusDate ? format(selectedBusDate, "dd MMM yyyy") : "Select date"}
                              </span>
                            </div>
                          </div>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-white border-slate-200 text-[#111439] rounded-2xl shadow-2xl z-50" align="start" sideOffset={8}>
                        <Calendar
                          mode="single"
                          selected={selectedBusDate}
                          onSelect={(date) => {
                            setSelectedBusDate(date);
                            setBusData(prev => ({
                              ...prev,
                              date: date ? format(date, 'yyyy-MM-dd') : ''
                            }));
                          }}
                          disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                          initialFocus
                          className="bg-white text-[#111439] rounded-2xl"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Divider */}
                  <div className="hidden md:block w-[1px] h-8 bg-slate-200 self-center mx-1" />

                  {/* Passengers */}
                  <div className="flex-1 md:flex-[0.9] relative group/segment rounded-[1.5rem] md:rounded-full hover:bg-slate-50 transition-all duration-300">
                    <div className="px-6 py-4 md:py-3 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 group-hover/segment:bg-amber-500/20 transition-all duration-300">
                        <Users className="w-4.5 h-4.5" />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <span className="block text-[9px] font-black uppercase tracking-widest text-[#4A5568] mb-0.5">Capacity</span>
                        <Select
                          value={busData.passengers}
                          onValueChange={(value) => setBusData(prev => ({ ...prev, passengers: value }))}
                        >
                          <SelectTrigger className="h-auto p-0 border-none bg-transparent text-[#111439] font-bold focus:ring-0 text-sm md:text-base focus-visible:ring-0 focus:outline-none focus:border-none focus-visible:ring-offset-0 [&>svg]:hidden w-full text-left truncate">
                            <SelectValue placeholder="Passengers" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-slate-200 text-[#111439] rounded-2xl p-1.5 shadow-2xl z-50">
                            {[
                              { label: '9-Seater (Urbania)', value: '10' },
                              { label: '12-Seater (Tempo)', value: '12' },
                              { label: '17-Seater Coach', value: '17' },
                              { label: '26-Seater Mini-Bus', value: '26' }
                            ].map((coach) => (
                              <SelectItem key={coach.value} value={coach.value} className="hover:bg-slate-100 focus:bg-slate-100 rounded-xl cursor-pointer py-2.5 px-4 text-[#111439]">{coach.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <div className="p-1 md:p-0 flex items-center">
                <Button 
                  type="submit" 
                  disabled={isSearching}
                  className="w-full md:w-auto h-14 md:h-14 md:px-8 rounded-[1.5rem] md:rounded-full bg-[#111439] hover:bg-[#1c225a] text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-[#111439]/20 hover:scale-[1.03] active:scale-95 transition-all duration-300 flex items-center justify-center gap-2.5"
                >
                  {isSearching ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <>
                      <Search className="w-4 h-4 text-white group-hover:rotate-12 transition-transform duration-300" />
                      <span>Search</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>

          {/* Trust & Authority Banner */}
          <div 
            className="w-full max-w-4xl mt-12 px-6 py-4 rounded-2xl bg-white/80 dark:bg-white/5 border border-slate-200/90 dark:border-white/10 shadow-sm backdrop-blur-md flex flex-wrap items-center justify-center gap-6 md:gap-16 text-[#111439] dark:text-white text-xs font-semibold animate-fade-up"
            style={{ animationDelay: '350ms' }}
          >
            <div className="flex items-center gap-2.5 hover:text-amber-600 transition-all duration-300 cursor-default group">
              <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center group-hover:bg-amber-500/20 group-hover:border-amber-500/40 transition-all">
                <CheckCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <span className="uppercase tracking-[0.2em] text-[10px] font-black text-[#111439] dark:text-white">J&K Tourism Approved</span>
            </div>
            <div className="flex items-center gap-2.5 hover:text-amber-600 transition-all duration-300 cursor-default group">
              <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center group-hover:bg-amber-500/20 group-hover:border-amber-500/40 transition-all">
                <Award className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <span className="uppercase tracking-[0.2em] text-[10px] font-black text-[#111439] dark:text-white">IATO Certified Member</span>
            </div>
            <div className="flex items-center gap-2.5 hover:text-amber-600 transition-all duration-300 cursor-default group">
              <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center group-hover:bg-amber-500/20 group-hover:border-amber-500/40 transition-all">
                <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <span className="uppercase tracking-[0.2em] text-[10px] font-black text-[#111439] dark:text-white">TAAI Member</span>
            </div>
          </div>

          {/* Floating High-Fidelity Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-16 w-full max-w-4xl animate-fade-up" style={{ animationDelay: '400ms' }}>
            {heroData.stats.map((stat) => (
              <div key={stat.label} className="text-center group cursor-default">
                <div className="font-display text-4xl font-black text-[#111439] dark:text-white mb-2 tracking-tight group-hover:text-amber-500 transition-colors duration-500">
                  {stat.value}
                </div>
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#4A5568] dark:text-white/60 group-hover:text-[#111439] dark:group-hover:text-white transition-colors duration-500">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 opacity-60 hover:opacity-100 transition-opacity duration-500 cursor-pointer">
        <span className="text-[9px] font-black uppercase tracking-[0.35em] text-[#4A5568]">Explore</span>
        <div className="w-[1.5px] h-12 bg-gradient-to-b from-[#111439] to-transparent" />
      </div>
    </section>
  );
}
