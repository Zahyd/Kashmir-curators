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
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#05080a]">
      {/* Cinematic Background */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-110 animate-slow-zoom transition-all duration-[2000ms]"
          style={{ backgroundImage: `url(${heroData.imageUrl})` }}
        />
        {/* Luxury Overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-[#05080a]" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 pt-32 pb-20">
        <div className="flex flex-col items-center text-center">
          {/* Elite Badge */}
          <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl mb-10 animate-fade-up group hover:border-kashmir-gold/30 transition-all duration-500 cursor-default">
            <Sparkles className="w-4 h-4 text-kashmir-gold animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/80">
              The Signature Kashmir Collection 2026
            </span>
          </div>

          {/* Headline - Editorial Style */}
          <div className="max-w-5xl mb-10 space-y-4">
            <h1 className="font-display text-5xl md:text-8xl lg:text-9xl font-black text-white leading-[0.9] tracking-tighter animate-fade-up transition-all duration-700 uppercase" style={{ animationDelay: '100ms' }}>
              {renderStyledTitle(heroData.title)}
            </h1>
            <p className="text-lg md:text-xl text-white/50 font-medium max-w-2xl mx-auto tracking-wide animate-fade-up transition-all duration-700" style={{ animationDelay: '200ms' }}>
              {heroData.subtitle}
            </p>
          </div>

          {/* Glassmorphic Command Module (Search) */}
          <div className="w-full max-w-5xl animate-fade-up" style={{ animationDelay: '300ms' }}>
            {/* Expedia-Style Flat Search Tabs */}
            <div className="flex items-center gap-6 md:gap-10 mb-6 justify-center md:justify-start pl-4 md:pl-8 overflow-x-auto no-scrollbar pb-1">
              <button 
                type="button"
                onClick={() => setSearchTab('packages')}
                className={cn(
                  "flex flex-col items-center gap-2 pb-2 text-[11px] font-black uppercase tracking-widest transition-all duration-300 border-b-2",
                  searchTab === 'packages' 
                    ? "border-kashmir-gold text-kashmir-gold scale-105" 
                    : "border-transparent text-white/40 hover:text-white/80 hover:border-white/10"
                )}
              >
                <Luggage className="w-5 h-5" />
                <span>Luxury Packages</span>
              </button>
              
              <button 
                type="button"
                onClick={() => setSearchTab('hotels')}
                className={cn(
                  "flex flex-col items-center gap-2 pb-2 text-[11px] font-black uppercase tracking-widest transition-all duration-300 border-b-2",
                  searchTab === 'hotels' 
                    ? "border-kashmir-gold text-kashmir-gold scale-105" 
                    : "border-transparent text-white/40 hover:text-white/80 hover:border-white/10"
                )}
              >
                <Bed className="w-5 h-5" />
                <span>Premium Estates</span>
              </button>
              
              <button 
                type="button"
                onClick={() => setSearchTab('cabs')}
                className={cn(
                  "flex flex-col items-center gap-2 pb-2 text-[11px] font-black uppercase tracking-widest transition-all duration-300 border-b-2",
                  searchTab === 'cabs' 
                    ? "border-kashmir-gold text-kashmir-gold scale-105" 
                    : "border-transparent text-white/40 hover:text-white/80 hover:border-white/10"
                )}
              >
                <Car className="w-5 h-5" />
                <span>Luxury Fleet</span>
              </button>
              
              <button 
                type="button"
                onClick={() => setSearchTab('flights')}
                className={cn(
                  "flex flex-col items-center gap-2 pb-2 text-[11px] font-black uppercase tracking-widest transition-all duration-300 border-b-2",
                  searchTab === 'flights' 
                    ? "border-kashmir-gold text-kashmir-gold scale-105" 
                    : "border-transparent text-white/40 hover:text-white/80 hover:border-white/10"
                )}
              >
                <Plane className="w-5 h-5" />
                <span>Flights</span>
              </button>
              
              <button 
                type="button"
                onClick={() => setSearchTab('bus')}
                className={cn(
                  "flex flex-col items-center gap-2 pb-2 text-[11px] font-black uppercase tracking-widest transition-all duration-300 border-b-2",
                  searchTab === 'bus' 
                    ? "border-kashmir-gold text-kashmir-gold scale-105" 
                    : "border-transparent text-white/40 hover:text-white/80 hover:border-white/10"
                )}
              >
                <Bus className="w-5 h-5" />
                <span>Luxury Coaches</span>
              </button>
            </div>

            <form 
              onSubmit={handleSearch}
              className="bg-[#070b0e]/75 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] md:rounded-full p-2.5 md:p-3.5 shadow-2xl flex flex-col md:flex-row gap-2 md:gap-0 relative group transition-all duration-500 hover:border-kashmir-gold/25 hover:shadow-[0_25px_60px_-15px_rgba(212,175,55,0.08)]"
            >
              {/* Internal Glow */}
              <div className="absolute inset-0 rounded-[2.5rem] md:rounded-full bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

              {searchTab === 'packages' && (
                <div className="flex-1 flex flex-col md:flex-row gap-2 md:gap-0">
                  {/* Destination */}
                  <div className="flex-1 md:flex-[1.2] relative group/segment rounded-[1.5rem] md:rounded-full hover:bg-white/[0.04] transition-all duration-300">
                    <div className="px-6 py-4 md:py-3 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-kashmir-gold/10 flex items-center justify-center text-kashmir-gold group-hover/segment:bg-kashmir-gold/20 transition-all duration-300">
                        <MapPin className="w-4.5 h-4.5" />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <span className="block text-[9px] font-black uppercase tracking-widest text-white/30 mb-0.5">Where to?</span>
                        <Select
                          value={searchData.destination}
                          onValueChange={(value) => setSearchData(prev => ({ ...prev, destination: value }))}
                        >
                          <SelectTrigger className="h-auto p-0 border-none bg-transparent text-white font-bold focus:ring-0 text-sm md:text-base focus-visible:ring-0 focus:outline-none focus:border-none focus-visible:ring-offset-0 [&>svg]:hidden w-full text-left truncate">
                            <SelectValue placeholder="Search destinations" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#0c1216] border-white/10 text-white rounded-2xl p-1.5 shadow-2xl backdrop-blur-3xl z-50">
                            {destinations.map((dest) => (
                              <SelectItem key={dest} value={dest} className="hover:bg-white/5 focus:bg-white/5 rounded-xl cursor-pointer py-2.5 px-4">{dest}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="hidden md:block w-[1px] h-8 bg-white/10 self-center mx-1" />

                  {/* Dates */}
                  <div className="flex-1 md:flex-1 relative rounded-[1.5rem] md:rounded-full hover:bg-white/[0.04] transition-all duration-300">
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="w-full text-left outline-none focus:outline-none"
                        >
                          <div className="px-6 py-4 md:py-3 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-kashmir-gold/10 flex items-center justify-center text-kashmir-gold transition-all duration-300">
                              <CalendarIcon className="w-4.5 h-4.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="block text-[9px] font-black uppercase tracking-widest text-white/30 mb-0.5">When</span>
                              <span className={cn(
                                "block text-sm md:text-base font-bold truncate leading-tight transition-colors",
                                selectedDate ? "text-white" : "text-white/40"
                              )}>
                                {selectedDate ? format(selectedDate, "dd MMM yyyy") : "Select date"}
                              </span>
                            </div>
                          </div>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-[#0c1216] border-white/10 text-white rounded-2xl shadow-2xl backdrop-blur-3xl z-50" align="start" sideOffset={8}>
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
                          className="bg-[#0c1216] text-white rounded-2xl"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Divider */}
                  <div className="hidden md:block w-[1px] h-8 bg-white/10 self-center mx-1" />

                  {/* Travelers */}
                  <div className="flex-1 md:flex-[0.9] relative group/segment rounded-[1.5rem] md:rounded-full hover:bg-white/[0.04] transition-all duration-300">
                    <div className="px-6 py-4 md:py-3 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-kashmir-gold/10 flex items-center justify-center text-kashmir-gold group-hover/segment:bg-kashmir-gold/20 transition-all duration-300">
                        <Users className="w-4.5 h-4.5" />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <span className="block text-[9px] font-black uppercase tracking-widest text-white/30 mb-0.5">Who</span>
                        <Select
                          value={searchData.travelers}
                          onValueChange={(value) => setSearchData(prev => ({ ...prev, travelers: value }))}
                        >
                          <SelectTrigger className="h-auto p-0 border-none bg-transparent text-white font-bold focus:ring-0 text-sm md:text-base focus-visible:ring-0 focus:outline-none focus:border-none focus-visible:ring-offset-0 [&>svg]:hidden w-full text-left truncate">
                            <SelectValue placeholder="Add guests" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#0c1216] border-white/10 text-white rounded-2xl p-1.5 shadow-2xl backdrop-blur-3xl z-50">
                            {[1, 2, 4, 6, 8, '10+'].map((num) => (
                              <SelectItem key={num} value={num.toString()} className="hover:bg-white/5 focus:bg-white/5 rounded-xl cursor-pointer py-2.5 px-4">
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
                  <div className="flex-1 md:flex-[1.2] relative group/segment rounded-[1.5rem] md:rounded-full hover:bg-white/[0.04] transition-all duration-300">
                    <div className="px-6 py-4 md:py-3 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-kashmir-gold/10 flex items-center justify-center text-kashmir-gold group-hover/segment:bg-kashmir-gold/20 transition-all duration-300">
                        <MapPin className="w-4.5 h-4.5" />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <span className="block text-[9px] font-black uppercase tracking-widest text-white/30 mb-0.5">Destination Area</span>
                        <Select
                          value={hotelData.destination}
                          onValueChange={(value) => setHotelData(prev => ({ ...prev, destination: value }))}
                        >
                          <SelectTrigger className="h-auto p-0 border-none bg-transparent text-white font-bold focus:ring-0 text-sm md:text-base focus-visible:ring-0 focus:outline-none focus:border-none focus-visible:ring-offset-0 [&>svg]:hidden w-full text-left truncate">
                            <SelectValue placeholder="Where to stay?" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#0c1216] border-white/10 text-white rounded-2xl p-1.5 shadow-2xl backdrop-blur-3xl z-50">
                            {destinations.map((dest) => (
                              <SelectItem key={dest} value={dest} className="hover:bg-white/5 focus:bg-white/5 rounded-xl cursor-pointer py-2.5 px-4">{dest}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="hidden md:block w-[1px] h-8 bg-white/10 self-center mx-1" />

                  {/* Check-In */}
                  <div className="flex-1 md:flex-1 relative rounded-[1.5rem] md:rounded-full hover:bg-white/[0.04] transition-all duration-300">
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="w-full text-left outline-none focus:outline-none"
                        >
                          <div className="px-6 py-4 md:py-3 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-kashmir-gold/10 flex items-center justify-center text-kashmir-gold transition-all duration-300">
                              <CalendarIcon className="w-4.5 h-4.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="block text-[9px] font-black uppercase tracking-widest text-white/30 mb-0.5">Check-In</span>
                              <span className={cn(
                                "block text-sm md:text-base font-bold truncate leading-tight transition-colors",
                                selectedHotelDate ? "text-white" : "text-white/40"
                              )}>
                                {selectedHotelDate ? format(selectedHotelDate, "dd MMM yyyy") : "Select date"}
                              </span>
                            </div>
                          </div>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-[#0c1216] border-white/10 text-white rounded-2xl shadow-2xl backdrop-blur-3xl z-50" align="start" sideOffset={8}>
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
                          className="bg-[#0c1216] text-white rounded-2xl"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Divider */}
                  <div className="hidden md:block w-[1px] h-8 bg-white/10 self-center mx-1" />

                  {/* Guests */}
                  <div className="flex-1 md:flex-[0.9] relative group/segment rounded-[1.5rem] md:rounded-full hover:bg-white/[0.04] transition-all duration-300">
                    <div className="px-6 py-4 md:py-3 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-kashmir-gold/10 flex items-center justify-center text-kashmir-gold group-hover/segment:bg-kashmir-gold/20 transition-all duration-300">
                        <Users className="w-4.5 h-4.5" />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <span className="block text-[9px] font-black uppercase tracking-widest text-white/30 mb-0.5">Guests</span>
                        <Select
                          value={hotelData.guests}
                          onValueChange={(value) => setHotelData(prev => ({ ...prev, guests: value }))}
                        >
                          <SelectTrigger className="h-auto p-0 border-none bg-transparent text-white font-bold focus:ring-0 text-sm md:text-base focus-visible:ring-0 focus:outline-none focus:border-none focus-visible:ring-offset-0 [&>svg]:hidden w-full text-left truncate">
                            <SelectValue placeholder="Add guests" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#0c1216] border-white/10 text-white rounded-2xl p-1.5 shadow-2xl backdrop-blur-3xl z-50">
                            {[1, 2, 3, 4, 5, '6+'].map((num) => (
                              <SelectItem key={num} value={num.toString()} className="hover:bg-white/5 focus:bg-white/5 rounded-xl cursor-pointer py-2.5 px-4">
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
                  <div className="flex-1 md:flex-[1.2] relative group/segment rounded-[1.5rem] md:rounded-full hover:bg-white/[0.04] transition-all duration-300">
                    <div className="px-6 py-4 md:py-3 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-kashmir-gold/10 flex items-center justify-center text-kashmir-gold group-hover/segment:bg-kashmir-gold/20 transition-all duration-300">
                        <Navigation className="w-4.5 h-4.5" />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <span className="block text-[9px] font-black uppercase tracking-widest text-white/30 mb-0.5">Pickup Point</span>
                        <Select
                          value={cabData.pickup}
                          onValueChange={(value) => setCabData(prev => ({ ...prev, pickup: value }))}
                        >
                          <SelectTrigger className="h-auto p-0 border-none bg-transparent text-white font-bold focus:ring-0 text-sm md:text-base focus-visible:ring-0 focus:outline-none focus:border-none focus-visible:ring-offset-0 [&>svg]:hidden w-full text-left truncate">
                            <SelectValue placeholder="Pickup location" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#0c1216] border-white/10 text-white rounded-2xl p-1.5 shadow-2xl backdrop-blur-3xl z-50">
                            {[
                              "Srinagar Airport (SXR)",
                              "Dal Lake Ghats, Srinagar",
                              "Lal Chowk, Srinagar",
                              "Gulmarg Gondola Resort, Gulmarg",
                              "Pahalgam Main Market, Pahalgam",
                              "Thajiwas Glacier, Sonamarg"
                            ].map((loc) => (
                              <SelectItem key={loc} value={loc} className="hover:bg-white/5 focus:bg-white/5 rounded-xl cursor-pointer py-2.5 px-4">{loc}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="hidden md:block w-[1px] h-8 bg-white/10 self-center mx-1" />

                  {/* Drop */}
                  <div className="flex-1 md:flex-[1.2] relative group/segment rounded-[1.5rem] md:rounded-full hover:bg-white/[0.04] transition-all duration-300">
                    <div className="px-6 py-4 md:py-3 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-kashmir-gold/10 flex items-center justify-center text-kashmir-gold group-hover/segment:bg-kashmir-gold/20 transition-all duration-300">
                        <MapPin className="w-4.5 h-4.5" />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <span className="block text-[9px] font-black uppercase tracking-widest text-white/30 mb-0.5">Drop Point</span>
                        <Select
                          value={cabData.drop}
                          onValueChange={(value) => setCabData(prev => ({ ...prev, drop: value }))}
                        >
                          <SelectTrigger className="h-auto p-0 border-none bg-transparent text-white font-bold focus:ring-0 text-sm md:text-base focus-visible:ring-0 focus:outline-none focus:border-none focus-visible:ring-offset-0 [&>svg]:hidden w-full text-left truncate">
                            <SelectValue placeholder="Where to drop?" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#0c1216] border-white/10 text-white rounded-2xl p-1.5 shadow-2xl backdrop-blur-3xl z-50">
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
                              <SelectItem key={loc} value={loc} className="hover:bg-white/5 focus:bg-white/5 rounded-xl cursor-pointer py-2.5 px-4">{loc}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="hidden md:block w-[1px] h-8 bg-white/10 self-center mx-1" />

                  {/* Date */}
                  <div className="flex-1 md:flex-1 relative rounded-[1.5rem] md:rounded-full hover:bg-white/[0.04] transition-all duration-300">
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="w-full text-left outline-none focus:outline-none"
                        >
                          <div className="px-6 py-4 md:py-3 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-kashmir-gold/10 flex items-center justify-center text-kashmir-gold transition-all duration-300">
                              <Clock className="w-4.5 h-4.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="block text-[9px] font-black uppercase tracking-widest text-white/30 mb-0.5">Date</span>
                              <span className={cn(
                                "block text-sm md:text-base font-bold truncate leading-tight transition-colors",
                                selectedCabDate ? "text-white" : "text-white/40"
                              )}>
                                {selectedCabDate ? format(selectedCabDate, "dd MMM yyyy") : "Select date"}
                              </span>
                            </div>
                          </div>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-[#0c1216] border-white/10 text-white rounded-2xl shadow-2xl backdrop-blur-3xl z-50" align="start" sideOffset={8}>
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
                          className="bg-[#0c1216] text-white rounded-2xl"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}
              
              {searchTab === 'flights' && (
                <div className="flex-1 flex flex-col md:flex-row gap-2 md:gap-0 animate-in fade-in slide-in-from-left-4 duration-300">
                  {/* Origin */}
                  <div className="flex-1 md:flex-[1.2] relative group/segment rounded-[1.5rem] md:rounded-full hover:bg-white/[0.04] transition-all duration-300">
                    <div className="px-6 py-4 md:py-3 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-kashmir-gold/10 flex items-center justify-center text-kashmir-gold group-hover/segment:bg-kashmir-gold/20 transition-all duration-300">
                        <MapPin className="w-4.5 h-4.5" />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <span className="block text-[9px] font-black uppercase tracking-widest text-white/30 mb-0.5">Flying From</span>
                        <Select
                          value={flightData.origin}
                          onValueChange={(value) => setFlightData(prev => ({ ...prev, origin: value }))}
                        >
                          <SelectTrigger className="h-auto p-0 border-none bg-transparent text-white font-bold focus:ring-0 text-sm md:text-base focus-visible:ring-0 focus:outline-none focus:border-none focus-visible:ring-offset-0 [&>svg]:hidden w-full text-left truncate">
                            <SelectValue placeholder="Origin airport" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#0c1216] border-white/10 text-white rounded-2xl p-1.5 shadow-2xl backdrop-blur-3xl z-50">
                            {[
                              { code: 'DEL', city: 'New Delhi (DEL)' },
                              { code: 'BOM', city: 'Mumbai (BOM)' },
                              { code: 'BLR', city: 'Bengaluru (BLR)' },
                              { code: 'HYD', city: 'Hyderabad (HYD)' },
                              { code: 'MAA', city: 'Chennai (MAA)' },
                              { code: 'CCU', city: 'Kolkata (CCU)' },
                              { code: 'ATQ', city: 'Amritsar (ATQ)' },
                            ].map((ap) => (
                              <SelectItem key={ap.code} value={ap.code} className="hover:bg-white/5 focus:bg-white/5 rounded-xl cursor-pointer py-2.5 px-4">{ap.city}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="hidden md:block w-[1px] h-8 bg-white/10 self-center mx-1" />

                  {/* Destination */}
                  <div className="flex-1 md:flex-1 relative group/segment rounded-[1.5rem] md:rounded-full hover:bg-white/[0.04] transition-all duration-300">
                    <div className="px-6 py-4 md:py-3 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-kashmir-gold/10 flex items-center justify-center text-kashmir-gold group-hover/segment:bg-kashmir-gold/20 transition-all duration-300">
                        <Plane className="w-4.5 h-4.5" />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <span className="block text-[9px] font-black uppercase tracking-widest text-white/30 mb-0.5">Flying To</span>
                        <span className="block text-sm md:text-base font-bold text-white leading-tight">Srinagar (SXR)</span>
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="hidden md:block w-[1px] h-8 bg-white/10 self-center mx-1" />

                  {/* Date */}
                  <div className="flex-1 md:flex-1 relative rounded-[1.5rem] md:rounded-full hover:bg-white/[0.04] transition-all duration-300">
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="w-full text-left outline-none focus:outline-none"
                        >
                          <div className="px-6 py-4 md:py-3 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-kashmir-gold/10 flex items-center justify-center text-kashmir-gold transition-all duration-300">
                              <CalendarIcon className="w-4.5 h-4.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="block text-[9px] font-black uppercase tracking-widest text-white/30 mb-0.5">Departure Date</span>
                              <span className={cn(
                                "block text-sm md:text-base font-bold truncate leading-tight transition-colors",
                                selectedFlightDate ? "text-white" : "text-white/40"
                              )}>
                                {selectedFlightDate ? format(selectedFlightDate, "dd MMM yyyy") : "Select date"}
                              </span>
                            </div>
                          </div>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-[#0c1216] border-white/10 text-white rounded-2xl shadow-2xl backdrop-blur-3xl z-50" align="start" sideOffset={8}>
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
                          className="bg-[#0c1216] text-white rounded-2xl"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}

              {searchTab === 'bus' && (
                <div className="flex-1 flex flex-col md:flex-row gap-2 md:gap-0 animate-in fade-in slide-in-from-left-4 duration-300">
                  {/* Pickup */}
                  <div className="flex-1 md:flex-[1.2] relative group/segment rounded-[1.5rem] md:rounded-full hover:bg-white/[0.04] transition-all duration-300">
                    <div className="px-6 py-4 md:py-3 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-kashmir-gold/10 flex items-center justify-center text-kashmir-gold group-hover/segment:bg-kashmir-gold/20 transition-all duration-300">
                        <Navigation className="w-4.5 h-4.5" />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <span className="block text-[9px] font-black uppercase tracking-widest text-white/30 mb-0.5">Pickup Location</span>
                        <Select
                          value={busData.pickup}
                          onValueChange={(value) => setBusData(prev => ({ ...prev, pickup: value }))}
                        >
                          <SelectTrigger className="h-auto p-0 border-none bg-transparent text-white font-bold focus:ring-0 text-sm md:text-base focus-visible:ring-0 focus:outline-none focus:border-none focus-visible:ring-offset-0 [&>svg]:hidden w-full text-left truncate">
                            <SelectValue placeholder="Pickup location" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#0c1216] border-white/10 text-white rounded-2xl p-1.5 shadow-2xl backdrop-blur-3xl z-50">
                            {[
                              "Srinagar Airport (SXR)",
                              "Dal Lake Ghats, Srinagar",
                              "Lal Chowk, Srinagar",
                              "Gulmarg Gondola Resort, Gulmarg",
                              "Pahalgam Main Market, Pahalgam"
                            ].map((loc) => (
                              <SelectItem key={loc} value={loc} className="hover:bg-white/5 focus:bg-white/5 rounded-xl cursor-pointer py-2.5 px-4">{loc}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="hidden md:block w-[1px] h-8 bg-white/10 self-center mx-1" />

                  {/* Date */}
                  <div className="flex-1 md:flex-1 relative rounded-[1.5rem] md:rounded-full hover:bg-white/[0.04] transition-all duration-300">
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="w-full text-left outline-none focus:outline-none"
                        >
                          <div className="px-6 py-4 md:py-3 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-kashmir-gold/10 flex items-center justify-center text-kashmir-gold transition-all duration-300">
                              <CalendarIcon className="w-4.5 h-4.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="block text-[9px] font-black uppercase tracking-widest text-white/30 mb-0.5">Travel Date</span>
                              <span className={cn(
                                "block text-sm md:text-base font-bold truncate leading-tight transition-colors",
                                selectedBusDate ? "text-white" : "text-white/40"
                              )}>
                                {selectedBusDate ? format(selectedBusDate, "dd MMM yyyy") : "Select date"}
                              </span>
                            </div>
                          </div>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-[#0c1216] border-white/10 text-white rounded-2xl shadow-2xl backdrop-blur-3xl z-50" align="start" sideOffset={8}>
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
                          className="bg-[#0c1216] text-white rounded-2xl"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Divider */}
                  <div className="hidden md:block w-[1px] h-8 bg-white/10 self-center mx-1" />

                  {/* Passengers */}
                  <div className="flex-1 md:flex-[0.9] relative group/segment rounded-[1.5rem] md:rounded-full hover:bg-white/[0.04] transition-all duration-300">
                    <div className="px-6 py-4 md:py-3 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-kashmir-gold/10 flex items-center justify-center text-kashmir-gold group-hover/segment:bg-kashmir-gold/20 transition-all duration-300">
                        <Users className="w-4.5 h-4.5" />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <span className="block text-[9px] font-black uppercase tracking-widest text-white/30 mb-0.5">Capacity</span>
                        <Select
                          value={busData.passengers}
                          onValueChange={(value) => setBusData(prev => ({ ...prev, passengers: value }))}
                        >
                          <SelectTrigger className="h-auto p-0 border-none bg-transparent text-white font-bold focus:ring-0 text-sm md:text-base focus-visible:ring-0 focus:outline-none focus:border-none focus-visible:ring-offset-0 [&>svg]:hidden w-full text-left truncate">
                            <SelectValue placeholder="Passengers" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#0c1216] border-white/10 text-white rounded-2xl p-1.5 shadow-2xl backdrop-blur-3xl z-50">
                            {[
                              { label: '9-Seater (Urbania)', value: '10' },
                              { label: '12-Seater (Tempo)', value: '12' },
                              { label: '17-Seater Coach', value: '17' },
                              { label: '26-Seater Mini-Bus', value: '26' }
                            ].map((coach) => (
                              <SelectItem key={coach.value} value={coach.value} className="hover:bg-white/5 focus:bg-white/5 rounded-xl cursor-pointer py-2.5 px-4">{coach.label}</SelectItem>
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
                  className="w-full md:w-auto h-14 md:h-14 md:px-8 rounded-[1.5rem] md:rounded-full bg-gradient-to-r from-kashmir-gold to-amber-500 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs uppercase tracking-[0.25em] shadow-lg shadow-kashmir-gold/25 hover:shadow-kashmir-gold/40 hover:scale-[1.03] active:scale-95 transition-all duration-500 flex items-center justify-center gap-2.5"
                >
                  {isSearching ? (
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                  ) : (
                    <>
                      <Search className="w-4 h-4 text-black group-hover:rotate-12 transition-transform duration-300" />
                      <span>Search</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>

          {/* Trust & Authority Banner */}
          <div 
            className="w-full max-w-4xl mt-12 px-6 py-4 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-md flex flex-wrap items-center justify-center gap-6 md:gap-16 text-white/50 text-xs font-semibold animate-fade-up"
            style={{ animationDelay: '350ms' }}
          >
            <div className="flex items-center gap-2.5 hover:text-kashmir-gold transition-all duration-300 cursor-default group">
              <div className="w-8 h-8 rounded-full bg-kashmir-gold/10 border border-kashmir-gold/20 flex items-center justify-center group-hover:bg-kashmir-gold/20 group-hover:border-kashmir-gold/40 transition-all">
                <CheckCircle className="w-4 h-4 text-kashmir-gold" />
              </div>
              <span className="uppercase tracking-[0.2em] text-[10px] font-black">J&K Tourism Approved</span>
            </div>
            <div className="flex items-center gap-2.5 hover:text-kashmir-gold transition-all duration-300 cursor-default group">
              <div className="w-8 h-8 rounded-full bg-kashmir-gold/10 border border-kashmir-gold/20 flex items-center justify-center group-hover:bg-kashmir-gold/20 group-hover:border-kashmir-gold/40 transition-all">
                <Award className="w-4 h-4 text-kashmir-gold" />
              </div>
              <span className="uppercase tracking-[0.2em] text-[10px] font-black">IATO Certified Member</span>
            </div>
            <div className="flex items-center gap-2.5 hover:text-kashmir-gold transition-all duration-300 cursor-default group">
              <div className="w-8 h-8 rounded-full bg-kashmir-gold/10 border border-kashmir-gold/20 flex items-center justify-center group-hover:bg-kashmir-gold/20 group-hover:border-kashmir-gold/40 transition-all">
                <ShieldCheck className="w-4 h-4 text-kashmir-gold" />
              </div>
              <span className="uppercase tracking-[0.2em] text-[10px] font-black">TAAI Member</span>
            </div>
          </div>

          {/* Floating High-Fidelity Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-20 w-full max-w-4xl animate-fade-up" style={{ animationDelay: '400ms' }}>
            {heroData.stats.map((stat) => (
              <div key={stat.label} className="text-center group cursor-default">
                <div className="font-display text-4xl font-black text-white mb-2 tracking-tight group-hover:text-kashmir-gold transition-colors duration-500">
                  {stat.value}
                </div>
                <div className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 group-hover:text-white/50 transition-colors duration-500">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Luxury Scroll Indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 opacity-50 hover:opacity-100 transition-opacity duration-500 cursor-pointer">
        <span className="text-[8px] font-black uppercase tracking-[0.5em] text-white/40">Descend</span>
        <div className="w-[1px] h-16 bg-gradient-to-b from-kashmir-gold to-transparent" />
      </div>
    </section>
  );
}
