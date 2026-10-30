import { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Star, Clock, MapPin, Filter, X, Search, ArrowUpDown, Compass, 
  ArrowRight, Sparkles, Headphones, Eye, CheckCircle2, ShieldCheck, 
  MessageCircle, Calendar, Users 
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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { usePackages, useDestinations, useCabs } from '@/hooks/useCMSData';
import { cn } from '@/lib/utils';
import { io } from 'socket.io-client';
import { API_BASE_URL, SOCKET_URL } from '@/lib/api';
import { useLeadCapture } from '@/contexts/LeadCaptureContext';

export default function Packages() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { openLeadModal, openCallbackModal, openWhatsAppLead } = useLeadCapture();
  const { data: packages = [], isLoading } = usePackages();
  const { data: cabOptions = [], isLoading: isLoadingCabs } = useCabs();
  const { data: destinations = [] } = useDestinations();
  
  const [filters, setFilters] = useState({
    destination: searchParams.get('destination') || '',
    search: '',
    budget: [0, 1000000],
    duration: '',
    rating: '',
    sortBy: 'popularity',
  });

  const [quickPeekPackage, setQuickPeekPackage] = useState<any>(null);

  // Dynamic Packages Hero states
  const [heroTitle, setHeroTitle] = useState('PRIVATE PORTFOLIO');
  const [heroSubtitle, setHeroSubtitle] = useState('A meticulously curated registry of the finest expeditions across the Kashmir valley.');
  const [heroImage, setHeroImage] = useState('https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=1600');

  useEffect(() => {
    const fetchHero = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/site-content`);
        if (res.ok) {
          const data = await res.json();
          if (data.packages_hero) {
            setHeroTitle(data.packages_hero.title || 'PRIVATE PORTFOLIO');
            setHeroSubtitle(data.packages_hero.subtitle || 'A meticulously curated registry of the finest expeditions across the Kashmir valley.');
            if (data.packages_hero.image_url) setHeroImage(data.packages_hero.image_url);
          }
        }
      } catch (err) {
        console.error("Packages hero fetch error:", err);
      }
    };
    fetchHero();

    const socket = io(SOCKET_URL);
    socket.on('site-content-updated', (data) => {
      if (data.key === 'packages_hero') {
        if (data.content.title) setHeroTitle(data.content.title);
        if (data.content.subtitle) setHeroSubtitle(data.content.subtitle);
        if (data.content.image_url) setHeroImage(data.content.image_url);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const filteredPackages = useMemo(() => {
    return packages.filter((pkg) => {
      if (filters.destination && pkg.destination.toLowerCase() !== filters.destination.toLowerCase()) return false;
      if (filters.search && !pkg.name.toLowerCase().includes(filters.search.toLowerCase()) && !pkg.destination.toLowerCase().includes(filters.search.toLowerCase())) return false;
      if (filters.duration) {
        const days = parseInt(pkg.duration);
        if (filters.duration === 'short' && days > 4) return false;
        if (filters.duration === 'medium' && (days < 5 || days > 7)) return false;
        if (filters.duration === 'long' && days < 8) return false;
      }
      if (filters.rating && pkg.rating < parseFloat(filters.rating)) return false;
      return true;
    }).sort((a, b) => {
      if (filters.sortBy === 'price-low') return (a.price || 0) - (b.price || 0);
      if (filters.sortBy === 'price-high') return (b.price || 0) - (a.price || 0);
      if (filters.sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      return (b.reviewCount || 0) - (a.reviewCount || 0);
    });
  }, [packages, filters]);

  const clearFilters = () => {
    setFilters({
      destination: '',
      search: '',
      budget: [0, 1000000],
      duration: '',
      rating: '',
      sortBy: 'popularity',
    });
    setSearchParams({});
  };

  return (
    <div className="min-h-screen bg-[#F8F8F9] dark:bg-[#05080a] text-slate-900 dark:text-white flex flex-col font-sans selection:bg-amber-400/30 transition-colors">
      <Navbar />
      
      {/* Dynamic Luxury Hero Banner */}
      <div className="relative pt-36 pb-24 overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 z-0">
          <img 
            src={heroImage} 
            alt="Kashmir Expeditions" 
            className="w-full h-full object-cover object-center opacity-25 filter grayscale contrast-125 scale-105 animate-pulse duration-[10000ms]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#05080a]/90 via-[#05080a]/70 to-[#05080a]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-kashmir-gold/5 blur-[120px] rounded-full pointer-events-none" />
        </div>

        <div className="container mx-auto px-6 relative z-10 text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-kashmir-gold animate-spin-slow" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/80">Archived Masterpieces</span>
          </div>
          
          <h1 className="font-display text-5xl md:text-8xl font-black tracking-tight mb-8 leading-[0.95]">
            {heroTitle.split(' ').map((word, i) => (
              <span key={i} className={i % 2 === 1 ? "bg-clip-text text-transparent bg-gradient-to-r from-kashmir-gold via-amber-200 to-white" : "text-white"}>
                {word}{' '}
              </span>
            ))}
          </h1>
          
          <p className="text-white/50 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
            {heroSubtitle}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-20 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-32 p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 backdrop-blur-xl space-y-8">
              <div className="flex items-center justify-between pb-6 border-b border-white/5">
                <span className="text-xs font-black uppercase tracking-[0.2em] text-kashmir-gold flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5" /> Filter Curation
                </span>
                <button onClick={clearFilters} className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors">
                  Reset
                </button>
              </div>

              {/* Search */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Keyword</label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <Input 
                    placeholder="Search by valley, activity..." 
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="h-12 pl-11 rounded-2xl bg-white/5 border-white/10 text-white placeholder:text-white/20 text-xs font-bold"
                  />
                </div>
              </div>

              {/* Destination Filter */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Territory</label>
                <Select value={filters.destination} onValueChange={(val) => setFilters(prev => ({ ...prev, destination: val === 'all' ? '' : val }))}>
                  <SelectTrigger className="h-12 rounded-2xl bg-white/5 border-white/10 text-white text-xs font-bold">
                    <SelectValue placeholder="All Territories" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0c1216] border-white/10 text-white rounded-2xl">
                    <SelectItem value="all">All Territories</SelectItem>
                    <SelectItem value="srinagar">Srinagar Central</SelectItem>
                    <SelectItem value="gulmarg">Gulmarg Slopes</SelectItem>
                    <SelectItem value="pahalgam">Pahalgam Valley</SelectItem>
                    <SelectItem value="sonamarg">Sonamarg Glacier</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort Order */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Arrangement</label>
                <Select value={filters.sortBy} onValueChange={(val) => setFilters(prev => ({ ...prev, sortBy: val }))}>
                  <SelectTrigger className="h-12 rounded-2xl bg-white/5 border-white/10 text-white text-xs font-bold">
                    <SelectValue placeholder="Popularity" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0c1216] border-white/10 text-white rounded-2xl">
                    <SelectItem value="popularity">Curator's Choice</SelectItem>
                    <SelectItem value="price-low">Value: Low to High</SelectItem>
                    <SelectItem value="price-high">Value: High to Low</SelectItem>
                    <SelectItem value="rating">Guest Rating</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-6 border-t border-white/5">
                <Button 
                  onClick={() => openCallbackModal({ sourceCta: 'PACKAGES_SIDEBAR_EXPERT' })}
                  variant="outline" 
                  className="w-full h-12 rounded-2xl border-white/10 text-white hover:bg-white/5 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  <Headphones className="w-3.5 h-3.5 text-kashmir-gold" />
                  <span>Request Curator Call</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Results Grid */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5 text-xs text-white/40">
              <span>{isLoading ? 'Scanning...' : `${filteredPackages.length} ENTRIES REGISTERED`}</span>
            </div>

            {/* Packages Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] overflow-hidden p-6 space-y-6">
                    <Skeleton className="h-64 w-full rounded-2xl bg-white/5" />
                    <div className="space-y-4 px-4 pb-4">
                      <Skeleton className="h-8 w-3/4 bg-white/5" />
                      <Skeleton className="h-4 w-1/2 bg-white/5" />
                      <Skeleton className="h-12 w-full bg-white/5" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredPackages.length === 0 ? (
              <div className="text-center py-32 bg-white/[0.02] border border-white/5 rounded-[3rem] animate-fade-up">
                <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 border border-white/10">
                  <Compass className="w-10 h-10 text-white/20" />
                </div>
                <h3 className="font-display text-4xl font-black text-white mb-4">NO ENTRIES FOUND</h3>
                <p className="text-white/40 text-lg mb-10 max-w-sm mx-auto">Try adjusting your curation criteria to discover hidden gems.</p>
                <Button onClick={clearFilters} className="bg-kashmir-gold text-black font-black uppercase text-xs h-14 px-10 rounded-2xl">Reset Curation</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {filteredPackages.map((pkg, index) => {
                  const displayPrice = pkg.price ? Number(pkg.price) : 24500;
                  return (
                    <div 
                      key={pkg.id} 
                      className="group animate-fade-up flex flex-col justify-between bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-[2.5rem] overflow-hidden p-4 hover:border-amber-400/50 transition-all duration-500 hover:-translate-y-1 shadow-md hover:shadow-xl"
                      style={{ animationDelay: `${index * 80}ms` }}
                    >
                      {/* Image Area - Click opens Quick Peek */}
                      <div 
                        onClick={() => setQuickPeekPackage(pkg)}
                        className="relative h-72 overflow-hidden rounded-[2rem] cursor-pointer"
                      >
                        <img
                          src={pkg.image}
                          alt={pkg.name}
                          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        
                        {/* Status Badges */}
                        <div className="absolute top-4 left-4 flex items-center gap-2">
                          <div className="px-3.5 py-1 bg-black/60 backdrop-blur-md border border-white/10 text-kashmir-gold text-[9px] font-black uppercase tracking-[0.2em] rounded-full">
                            Curated Selection
                          </div>
                        </div>

                        {/* Quick Peek Pill on Hover */}
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="px-3 py-1 bg-kashmir-gold text-black text-[10px] font-black uppercase tracking-wider rounded-xl shadow-lg flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5" />
                            <span>Quick Peek</span>
                          </div>
                        </div>

                        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                          <div className="flex items-center gap-2 text-white">
                            <MapPin className="h-4 w-4 text-kashmir-gold" />
                            <span className="text-xs font-black uppercase tracking-widest">{pkg.destination}</span>
                          </div>
                          <Badge variant="outline" className="bg-black/60 border-white/20 text-white text-[10px] font-bold">
                            {pkg.duration}
                          </Badge>
                        </div>
                      </div>

                      {/* Content Hub */}
                      <div className="p-6 pt-4 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-1 mb-2">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`h-3.5 w-3.5 ${i < Math.floor(pkg.rating || 5) ? 'fill-kashmir-gold text-kashmir-gold' : 'text-white/20'}`} />
                            ))}
                            <span className="text-[10px] font-bold text-white/40 ml-2">
                              {pkg.rating || 4.9} ({pkg.reviewCount || 6} Reviews)
                            </span>
                          </div>

                          <h3 
                            onClick={() => setQuickPeekPackage(pkg)}
                            className="font-display text-2xl font-black text-slate-900 dark:text-white mb-3 hover:text-amber-600 dark:hover:text-amber-400 cursor-pointer transition-colors leading-tight line-clamp-2"
                          >
                            {pkg.name}
                          </h3>

                          {/* Luxury Feature Tags */}
                          <div className="flex flex-wrap gap-1.5 mb-6">
                            <span className="text-[10px] font-semibold bg-white/5 text-white/70 px-2 py-0.5 rounded-md border border-white/5">
                              ✦ Heated Heritage Stay
                            </span>
                            <span className="text-[10px] font-semibold bg-white/5 text-white/70 px-2 py-0.5 rounded-md border border-white/5">
                              ✦ 4x4 Snow Chauffeur
                            </span>
                            <span className="text-[10px] font-semibold bg-white/5 text-white/70 px-2 py-0.5 rounded-md border border-white/5">
                              ✦ Sunset Shikara
                            </span>
                          </div>
                        </div>

                        {/* Bottom Pricing & Actions */}
                        <div className="border-t border-white/10 pt-4">
                          <div className="flex items-center justify-between gap-3 mb-2">
                            <div>
                              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40 block mb-0.5">Starting From</span>
                              <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black text-[#111439] dark:text-amber-400 font-mono">
                                  ₹{displayPrice.toLocaleString()}
                                </span>
                                <span className="text-[10px] text-white/40">/ couple</span>
                              </div>
                            </div>

                            <Button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                openLeadModal({
                                  packageTitle: pkg.name,
                                  destination: pkg.destination,
                                  sourceCta: 'PACKAGES_PAGE_CARD'
                                });
                              }}
                              className="h-10 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black text-[10px] uppercase tracking-widest shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Quick Quote</span>
                            </Button>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-white/40 pt-1">
                            <span>Includes Breakfast & Dinner</span>
                            <button
                              type="button"
                              onClick={() => setQuickPeekPackage(pkg)}
                              className="text-kashmir-gold hover:underline font-bold flex items-center gap-1"
                            >
                              <span>Quick Peek</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
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

      {/* QUICK PEEK SLIDE-OVER DRAWER (No page redirect!) */}
      <Sheet open={!!quickPeekPackage} onOpenChange={(open) => !open && setQuickPeekPackage(null)}>
        <SheetContent side="right" className="w-full sm:max-w-xl bg-[#0a0f12] text-white border-l border-white/10 p-0 overflow-y-auto">
          {quickPeekPackage && (
            <div className="flex flex-col min-h-full">
              {/* Drawer Hero Image */}
              <div className="relative h-72 w-full">
                <img 
                  src={quickPeekPackage.image} 
                  alt={quickPeekPackage.name} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f12] via-black/30 to-transparent" />
                
                <div className="absolute top-4 left-4 flex gap-2">
                  <Badge className="bg-kashmir-gold text-black font-black text-[10px] uppercase">
                    {quickPeekPackage.destination}
                  </Badge>
                  <Badge variant="outline" className="bg-black/60 border-white/20 text-white text-[10px] font-bold">
                    {quickPeekPackage.duration}
                  </Badge>
                </div>

                <div className="absolute bottom-4 left-6 right-6">
                  <div className="flex items-center gap-1 mb-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-kashmir-gold text-kashmir-gold" />
                    ))}
                    <span className="text-xs font-bold text-white/70 ml-2">
                      {quickPeekPackage.rating || 4.9} ({quickPeekPackage.reviewCount || 8} Verified Reviews)
                    </span>
                  </div>
                  <h3 className="font-display text-2xl md:text-3xl font-black text-white leading-tight">
                    {quickPeekPackage.name}
                  </h3>
                </div>
              </div>

              {/* Drawer Body */}
              <div className="p-6 md:p-8 space-y-6 flex-1">
                {/* Transparent Pricing Card */}
                <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono tracking-widest uppercase text-kashmir-gold block font-bold">All-Inclusive Transparent Tariff</span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-3xl font-black text-white font-mono">
                        ₹{(quickPeekPackage.price || 24500).toLocaleString()}
                      </span>
                      <span className="text-xs text-white/50">/ couple</span>
                    </div>
                    <span className="text-[11px] text-emerald-400 block mt-1">✓ Includes Heated Stay, Shikara & 4x4 Chauffeur</span>
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs py-1 px-3">
                    Instant Lock
                  </Badge>
                </div>

                {/* Seasonal Rates Guide */}
                <div>
                  <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-white/50 mb-3">Seasonal Price Guide</h4>
                  <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                      <span className="text-[10px] text-white/40 block">❄️ Winter Snow</span>
                      <span className="font-bold text-white font-mono mt-1 block">₹{(quickPeekPackage.price || 24500).toLocaleString()}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                      <span className="text-[10px] text-white/40 block">🌷 Tulip Spring</span>
                      <span className="font-bold text-kashmir-gold font-mono mt-1 block">₹{Math.round((quickPeekPackage.price || 24500) * 1.15).toLocaleString()}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                      <span className="text-[10px] text-white/40 block">☀️ Summer Valley</span>
                      <span className="font-bold text-emerald-400 font-mono mt-1 block">₹{Math.round((quickPeekPackage.price || 24500) * 0.95).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Key Curated Inclusions */}
                <div>
                  <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-white/50 mb-3">What Is Included</h4>
                  <div className="space-y-2.5">
                    <div className="flex items-start gap-3 text-xs text-white/80">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Dedicated Toyota Innova Crysta / 4x4 vehicle with snow chains and police-verified chauffeur.</span>
                    </div>
                    <div className="flex items-start gap-3 text-xs text-white/80">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Private heated Shikara sunset cruise on Nigeen or Dal Lake with hot Kashmiri Kahwa.</span>
                    </div>
                    <div className="flex items-start gap-3 text-xs text-white/80">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Daily morning breakfast and authentic multi-course Kashmiri Wazwan dinners (MAP plan).</span>
                    </div>
                    <div className="flex items-start gap-3 text-xs text-white/80">
                      <ShieldCheck className="w-4 h-4 text-kashmir-gold shrink-0 mt-0.5" />
                      <span>24/7 Kashmir Corridor Disruption Shield — instant alternative rerouting if roads get blocked.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Drawer Footer Actions */}
              <div className="p-6 bg-black/60 border-t border-white/10 space-y-3 sticky bottom-0 backdrop-blur-xl">
                <Button 
                  onClick={() => {
                    const selected = quickPeekPackage;
                    setQuickPeekPackage(null);
                    openLeadModal({
                      packageTitle: selected.name,
                      destination: selected.destination,
                      sourceCta: 'PACKAGES_DRAWER_CUSTOMIZE'
                    });
                  }}
                  className="w-full h-12 bg-kashmir-gold hover:bg-amber-400 text-black font-black uppercase text-xs rounded-xl shadow-lg shadow-kashmir-gold/20"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  <span>Personalize This Itinerary (Free Quote)</span>
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const selected = quickPeekPackage;
                      setQuickPeekPackage(null);
                      openWhatsAppLead(`Hi, I'm interested in the ${selected.name} (${selected.destination}) package. Can you share availability and details?`);
                    }}
                    className="flex-1 h-11 border-white/20 text-white hover:bg-white/10 text-xs rounded-xl"
                  >
                    <MessageCircle className="w-4 h-4 mr-1.5 text-emerald-400" />
                    <span>WhatsApp Curator</span>
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={() => {
                      const targetId = quickPeekPackage.id;
                      setQuickPeekPackage(null);
                      navigate(`/packages/${targetId}`);
                    }}
                    className="flex-1 h-11 text-white/70 hover:text-white text-xs rounded-xl"
                  >
                    <span>Full Page View</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Footer />
      <FloatingActions />
    </div>
  );
}
