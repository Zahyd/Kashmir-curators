import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Users, Loader2, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import heroImage from '@/assets/kashmir-hero-new.jpg';
import { useDestinations } from '@/hooks/useCMSData';
import { API_BASE_URL, SOCKET_URL } from '@/lib/api';
import { io } from 'socket.io-client';

export default function HeroSection() {
  const navigate = useNavigate();
  const { data: destinations = [] } = useDestinations();
  const [isSearching, setIsSearching] = useState(false);
  const [searchData, setSearchData] = useState({
    destination: '',
    dates: '',
    travelers: '',
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
      title: h.title || 'BEYOND the ORDINARY',
      subtitle: h.subtitle || 'Experience Kashmir as it was meant to be seen: Private, Peerless, and Profoundly Beautiful.',
      imageUrl: h.image_url || heroImage,
      stats: [
        { value: h.content?.stat1_value || '1,200+', label: h.content?.stat1_label || 'Elite Curations' },
        { value: h.content?.stat2_value || '4.95', label: h.content?.stat2_label || 'Satisfaction Index' },
        { value: h.content?.stat3_value || '24/7', label: h.content?.stat3_label || 'Concierge Protocol' },
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
    if (!searchData.destination) {
      toast.error('Select your destination');
      return;
    }
    setIsSearching(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    const params = new URLSearchParams();
    if (searchData.destination) params.set('destination', searchData.destination);
    if (searchData.travelers) params.set('travelers', searchData.travelers);
    navigate(`/packages?${params.toString()}`);
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
            <form 
              onSubmit={handleSearch}
              className="bg-[#0a0f12]/40 backdrop-blur-3xl border border-white/5 rounded-[3rem] p-4 md:p-6 shadow-2xl luxury-shadow flex flex-col md:flex-row gap-4 relative group"
            >
              {/* Internal Glow */}
              <div className="absolute inset-0 rounded-[3rem] bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Destination */}
                <div className="relative group/field">
                  <div className="absolute inset-0 bg-white/[0.02] rounded-2xl border border-white/5 group-hover/field:border-kashmir-gold/20 transition-all duration-500" />
                  <div className="relative px-5 py-4 flex items-center gap-4">
                    <MapPin className="w-5 h-5 text-kashmir-gold" />
                    <div className="flex-1 text-left">
                      <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-1">Destination</p>
                      <Select
                        value={searchData.destination}
                        onValueChange={(value) => setSearchData(prev => ({ ...prev, destination: value }))}
                      >
                        <SelectTrigger className="h-auto p-0 border-none bg-transparent text-white font-bold focus:ring-0 after:absolute after:inset-0">
                          <SelectValue placeholder="Where to?" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0a0f12]/95 backdrop-blur-2xl border-white/10 text-white rounded-2xl">
                          {destinations.map((dest) => (
                            <SelectItem key={dest} value={dest} className="hover:bg-white/5 focus:bg-white/5 rounded-xl">{dest}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Dates */}
                <label className="relative group/field block cursor-pointer">
                  <div className="absolute inset-0 bg-white/[0.02] rounded-2xl border border-white/5 group-hover/field:border-kashmir-gold/20 transition-all duration-500" />
                  <div className="relative px-5 py-4 flex items-center gap-4">
                    <Calendar className="w-5 h-5 text-kashmir-gold" />
                    <div className="flex-1 text-left">
                      <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-1">Duration</p>
                      <Input
                        type="text"
                        placeholder="Select Dates"
                        className="h-auto p-0 border-none bg-transparent text-white font-bold placeholder:text-white/20 focus-visible:ring-0"
                        value={searchData.dates}
                        onChange={(e) => setSearchData(prev => ({ ...prev, dates: e.target.value }))}
                        onFocus={(e) => e.target.type = 'date'}
                        onBlur={(e) => { if (!e.target.value) e.target.type = 'text'; }}
                      />
                    </div>
                  </div>
                </label>

                {/* Travelers */}
                <div className="relative group/field">
                  <div className="absolute inset-0 bg-white/[0.02] rounded-2xl border border-white/5 group-hover/field:border-kashmir-gold/20 transition-all duration-500" />
                  <div className="relative px-5 py-4 flex items-center gap-4">
                    <Users className="w-5 h-5 text-kashmir-gold" />
                    <div className="flex-1 text-left">
                      <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-1">Travelers</p>
                      <Select
                        value={searchData.travelers}
                        onValueChange={(value) => setSearchData(prev => ({ ...prev, travelers: value }))}
                      >
                        <SelectTrigger className="h-auto p-0 border-none bg-transparent text-white font-bold focus:ring-0 after:absolute after:inset-0">
                          <SelectValue placeholder="Guests" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0a0f12]/95 backdrop-blur-2xl border-white/10 text-white rounded-2xl">
                          {[1, 2, 4, 6, 8, '10+'].map((num) => (
                            <SelectItem key={num} value={num.toString()} className="hover:bg-white/5 focus:bg-white/5 rounded-xl">
                              {num} {num === 1 ? 'Guest' : 'Guests'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <Button 
                type="submit" 
                disabled={isSearching}
                className="h-auto py-6 md:py-0 md:px-10 rounded-[1.8rem] bg-kashmir-gold text-black hover:bg-amber-500 font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-kashmir-gold/20 transition-all duration-500 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3"
              >
                {isSearching ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>Begin Journey</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </Button>
            </form>
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
