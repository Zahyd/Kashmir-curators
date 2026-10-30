import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Star, Clock, MapPin, Filter, X, Search, Compass, 
  ArrowRight, Sparkles, Headphones, Eye, CheckCircle2, ShieldCheck, 
  MessageCircle, Phone, SlidersHorizontal, RefreshCw, Check
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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { usePackages, useDestinations } from '@/hooks/useCMSData';
import { cn } from '@/lib/utils';
import { io } from 'socket.io-client';
import { API_BASE_URL, SOCKET_URL } from '@/lib/api';
import { useLeadCapture } from '@/contexts/LeadCaptureContext';

export default function Packages() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { openLeadModal, openCallbackModal, openWhatsAppLead } = useLeadCapture();
  const { data: packages = [], isLoading } = usePackages();
  const { data: destinations = [] } = useDestinations();
  
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filters, setFilters] = useState({
    destination: searchParams.get('destination') || '',
    search: '',
    budget: [0, 500000] as [number, number],
    duration: '',
    rating: '',
    sortBy: 'popularity',
  });

  const [quickPeekPackage, setQuickPeekPackage] = useState<any>(null);

  // Dynamic Packages Hero states
  const [heroTitle, setHeroTitle] = useState('PRIVATE EXPEDITION REGISTRY');
  const [heroSubtitle, setHeroSubtitle] = useState('A meticulously curated collection of luxury itineraries across Gulmarg alpine slopes, Dal Lake heritage houseboats, and Pahalgam pine valleys.');
  const [heroImage, setHeroImage] = useState('https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=1600');

  useEffect(() => {
    const fetchHero = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/site-content`);
        if (res.ok) {
          const data = await res.json();
          if (data.packages_hero) {
            if (data.packages_hero.title) setHeroTitle(data.packages_hero.title);
            if (data.packages_hero.subtitle) setHeroSubtitle(data.packages_hero.subtitle);
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
      if (filters.destination && filters.destination !== 'all' && pkg.destination.toLowerCase() !== filters.destination.toLowerCase()) return false;
      if (filters.search && !pkg.name.toLowerCase().includes(filters.search.toLowerCase()) && !pkg.destination.toLowerCase().includes(filters.search.toLowerCase())) return false;
      
      if (filters.budget[1] < 500000) {
        const price = Number(pkg.price) || 0;
        if (price > 0 && price > filters.budget[1]) return false;
      }

      if (filters.duration) {
        const days = parseInt(pkg.duration) || 5;
        if (filters.duration === 'short' && days > 4) return false;
        if (filters.duration === 'medium' && (days < 5 || days > 7)) return false;
        if (filters.duration === 'long' && days < 8) return false;
      }
      if (filters.rating && pkg.rating < parseFloat(filters.rating)) return false;

      // Category chip filter
      if (selectedCategory !== 'all') {
        const text = `${pkg.name} ${pkg.description || ''} ${pkg.destination || ''}`.toLowerCase();
        if (selectedCategory === 'winter' && !text.includes('snow') && !text.includes('winter') && !text.includes('ski') && !text.includes('gulmarg')) return false;
        if (selectedCategory === 'honeymoon' && !text.includes('honeymoon') && !text.includes('romantic') && !text.includes('couple') && !text.includes('luxury')) return false;
        if (selectedCategory === 'family' && !text.includes('family') && !text.includes('heritage') && !text.includes('houseboat') && !text.includes('dal')) return false;
        if (selectedCategory === 'adventure' && !text.includes('adventure') && !text.includes('trek') && !text.includes('glacier') && !text.includes('sonamarg')) return false;
        if (selectedCategory === 'houseboat' && !text.includes('houseboat') && !text.includes('lake') && !text.includes('shikara') && !text.includes('dal')) return false;
      }

      return true;
    }).sort((a, b) => {
      if (filters.sortBy === 'price-low') return (Number(a.price) || 0) - (Number(b.price) || 0);
      if (filters.sortBy === 'price-high') return (Number(b.price) || 0) - (Number(a.price) || 0);
      if (filters.sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      return (b.reviewCount || 0) - (a.reviewCount || 0);
    });
  }, [packages, filters, selectedCategory]);

  const clearFilters = () => {
    setFilters({
      destination: '',
      search: '',
      budget: [0, 500000],
      duration: '',
      rating: '',
      sortBy: 'popularity',
    });
    setSelectedCategory('all');
    setSearchParams({});
  };

  return (
    <div className="min-h-screen bg-[#F8F8F9] dark:bg-[#05080a] text-slate-900 dark:text-white flex flex-col font-sans selection:bg-amber-400/30 transition-colors duration-300">
      <Navbar />
      
      {/* Dynamic Luxury Hero Banner */}
      <div className="relative pt-36 pb-20 md:pt-44 md:pb-28 overflow-hidden border-b border-slate-200/80 dark:border-white/5">
        <div className="absolute inset-0 z-0">
          <img 
            src={heroImage} 
            alt="Kashmir Expeditions" 
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
              Curated Itinerary Registry • All-Inclusive
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
              <ShieldCheck className="w-4 h-4 text-amber-500" /> Dedicated 4x4 Chauffeur
            </span>
            <span className="text-slate-300 dark:text-white/20">•</span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Heated Stays & Wazwan Dining
            </span>
            <span className="text-slate-300 dark:text-white/20">•</span>
            <span className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" /> 100% Guaranteed Departures
            </span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
          
          {/* Left Column: Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 p-6 md:p-8 rounded-[2.5rem] bg-white dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 shadow-xl shadow-slate-200/40 dark:shadow-none backdrop-blur-xl space-y-7">
              <div className="flex items-center justify-between pb-5 border-b border-slate-200 dark:border-white/5">
                <span className="text-xs font-black uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400 flex items-center gap-2">
                  <SlidersHorizontal className="w-3.5 h-3.5" /> Filter Curation
                </span>
                <button 
                  onClick={clearFilters} 
                  className="text-[11px] font-bold text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Reset All
                </button>
              </div>

              {/* Keyword Search */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-white/40 flex items-center gap-1.5">
                  <Search className="w-3 h-3 text-amber-500" /> Search Expedition
                </label>
                <div className="relative">
                  <Input 
                    placeholder="Search valley, activity..." 
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

              {/* Destination Filter */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-white/40 flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-amber-500" /> Primary Territory
                </label>
                <Select 
                  value={filters.destination || "all"} 
                  onValueChange={(val) => setFilters(prev => ({ ...prev, destination: val === 'all' ? '' : val }))}
                >
                  <SelectTrigger className="h-12 bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white font-medium text-sm">
                    <SelectValue placeholder="All Territories" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-[#0a0f12] border-slate-200 dark:border-white/10 text-slate-900 dark:text-white">
                    <SelectItem value="all">All Territories</SelectItem>
                    <SelectItem value="srinagar">Srinagar Central & Dal Lake</SelectItem>
                    <SelectItem value="gulmarg">Gulmarg Slopes & Gondola</SelectItem>
                    <SelectItem value="pahalgam">Pahalgam Lidder Valley</SelectItem>
                    <SelectItem value="sonamarg">Sonamarg Glacier</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Duration Filter */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-white/40 flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-amber-500" /> Duration
                </label>
                <Select 
                  value={filters.duration || "all"} 
                  onValueChange={(val) => setFilters(prev => ({ ...prev, duration: val === 'all' ? '' : val }))}
                >
                  <SelectTrigger className="h-12 bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white font-medium text-sm">
                    <SelectValue placeholder="Any Duration" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-[#0a0f12] border-slate-200 dark:border-white/10 text-slate-900 dark:text-white">
                    <SelectItem value="all">Any Duration</SelectItem>
                    <SelectItem value="short">Quick Getaway (3–4 Days)</SelectItem>
                    <SelectItem value="medium">Classic Valley Tour (5–7 Days)</SelectItem>
                    <SelectItem value="long">Grand Expedition (8+ Days)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Budget Slider */}
              <div className="space-y-4 pt-2">
                <div className="flex justify-between items-end">
                  <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-white/40">Budget Ceiling</label>
                  <span className="text-xs font-black text-amber-600 dark:text-amber-400">
                    {filters.budget[1] >= 500000 ? 'Any Budget' : `Up to ₹${filters.budget[1].toLocaleString()}`}
                  </span>
                </div>
                <Slider
                  value={filters.budget}
                  onValueChange={(val) => setFilters(prev => ({ ...prev, budget: val as [number, number] }))}
                  min={20000}
                  max={500000}
                  step={10000}
                  className="py-1"
                />
                <div className="flex justify-between text-[10px] text-slate-400 dark:text-white/30 font-semibold">
                  <span>₹20K</span>
                  <span>₹250K</span>
                  <span>₹500K+</span>
                </div>
              </div>

              {/* Sort Order */}
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-white/5">
                <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-white/40">
                  Arrangement
                </label>
                <Select 
                  value={filters.sortBy} 
                  onValueChange={(val) => setFilters(prev => ({ ...prev, sortBy: val }))}
                >
                  <SelectTrigger className="h-12 bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white font-medium text-sm">
                    <SelectValue placeholder="Curator's Choice" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-[#0a0f12] border-slate-200 dark:border-white/10 text-slate-900 dark:text-white">
                    <SelectItem value="popularity">Curator's Choice</SelectItem>
                    <SelectItem value="price-low">Value: Low to High</SelectItem>
                    <SelectItem value="price-high">Value: High to Low</SelectItem>
                    <SelectItem value="rating">Highest Guest Rating</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Bespoke Curator Callback Card */}
              <div className="pt-4 border-t border-slate-200 dark:border-white/5">
                <div className="p-5 rounded-2xl bg-amber-500/10 dark:bg-amber-400/5 border border-amber-500/20 dark:border-amber-400/10 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950">
                      <Phone className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Custom Itinerary?</p>
                      <p className="text-[10px] text-slate-500 dark:text-white/50">Direct Srinagar Travel Desk</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-white/60 leading-relaxed">
                    Traveling with family or planning a luxury honeymoon? Our curators craft private bespoke routes tailored to your schedule.
                  </p>
                  <div className="pt-1 flex flex-col gap-2">
                    <Button 
                      onClick={() => openCallbackModal({ sourceCta: 'PACKAGES_SIDEBAR_EXPERT' })}
                      className="w-full h-10 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-100 font-black text-xs uppercase tracking-wider"
                    >
                      Request Curator Call
                    </Button>
                    <button 
                      onClick={() => openWhatsAppLead({ packageTitle: 'Custom Kashmir Expedition', destination: filters.destination || 'Kashmir' })}
                      className="text-[11px] font-bold text-amber-700 dark:text-amber-400 hover:underline flex items-center justify-center gap-1.5 py-1"
                    >
                      <MessageCircle className="w-3.5 h-3.5" /> Chat via WhatsApp
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Right Column: Packages Workspace */}
          <div className="lg:col-span-3 space-y-8">
            
            {/* Category Quick Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {[
                { id: 'all', label: 'All Itineraries', icon: '✦' },
                { id: 'winter', label: 'Winter & Snow', icon: '❄️' },
                { id: 'honeymoon', label: 'Honeymoon Deluxe', icon: '💍' },
                { id: 'family', label: 'Family & Heritage', icon: '👨‍👩‍👧‍👦' },
                { id: 'adventure', label: 'Alpine Glaciers', icon: '🏔️' },
                { id: 'houseboat', label: 'Dal & Houseboats', icon: '🌊' },
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
                {isLoading ? 'Scanning Archive...' : `${filteredPackages.length} Verified Itineraries Ready`}
              </span>
              {(filters.destination || filters.search || filters.duration || selectedCategory !== 'all') && (
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
            {!isLoading && filteredPackages.length === 0 && (
              <div className="text-center py-24 px-6 rounded-[3rem] bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 space-y-5">
                <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center">
                  <Compass className="w-8 h-8" />
                </div>
                <h3 className="font-display text-2xl font-black text-slate-900 dark:text-white">No Itineraries Found</h3>
                <p className="text-sm text-slate-500 dark:text-white/50 max-w-md mx-auto">
                  No packages matched your active filter criteria. Try adjusting your duration or clearing search keywords.
                </p>
                <Button 
                  onClick={clearFilters}
                  className="rounded-xl bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider px-6"
                >
                  Reset Curation
                </Button>
              </div>
            )}

            {/* Packages Grid */}
            {!isLoading && filteredPackages.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {filteredPackages.map((pkg, index) => {
                  const displayPrice = pkg.price ? Number(pkg.price) : 24500;
                  return (
                    <div 
                      key={pkg.id} 
                      className="group flex flex-col justify-between bg-white dark:bg-white/[0.02] border border-slate-200/90 dark:border-white/5 rounded-[2.5rem] overflow-hidden hover:border-amber-400/50 dark:hover:border-amber-400/30 hover:shadow-2xl hover:shadow-slate-200/50 dark:hover:shadow-black/50 transition-all duration-500 hover:-translate-y-1.5 p-4"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {/* Image Area */}
                      <div>
                        <div 
                          onClick={() => setQuickPeekPackage(pkg)}
                          className="relative h-64 sm:h-72 rounded-[2rem] overflow-hidden bg-slate-100 dark:bg-slate-900 cursor-pointer"
                        >
                          <img
                            src={pkg.image}
                            alt={pkg.name}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                          
                          {/* Status Badge */}
                          <div className="absolute top-4 left-4 flex items-center gap-2">
                            <div className="px-3.5 py-1.5 bg-slate-950/70 backdrop-blur-md border border-white/10 text-amber-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-full">
                              Curated Masterpiece
                            </div>
                          </div>

                          {/* Quick Peek Pill on Hover */}
                          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="px-3 py-1.5 bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider rounded-xl shadow-lg flex items-center gap-1.5">
                              <Eye className="w-3.5 h-3.5" />
                              <span>Quick Peek</span>
                            </div>
                          </div>

                          {/* Destination & Duration Bottom Tags */}
                          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-white">
                              <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20">
                                <MapPin className="h-4 w-4 text-amber-400" />
                              </div>
                              <span className="text-xs font-black uppercase tracking-wider drop-shadow-md">
                                {pkg.destination}
                              </span>
                            </div>
                            <Badge variant="outline" className="bg-slate-950/70 backdrop-blur-md border-white/20 text-white text-[10px] font-bold px-3 py-1">
                              {pkg.duration}
                            </Badge>
                          </div>
                        </div>

                        {/* Content Area */}
                        <div className="p-4 sm:p-5">
                          <div className="flex items-center gap-1 mb-2">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`h-3.5 w-3.5 ${i < Math.floor(pkg.rating || 5) ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-white/20'}`} 
                              />
                            ))}
                            <span className="text-xs font-bold text-slate-500 dark:text-white/40 ml-2">
                              {pkg.rating || 4.9} ({pkg.reviewCount || 12} reviews)
                            </span>
                          </div>

                          <h3 
                            onClick={() => setQuickPeekPackage(pkg)}
                            className="font-display text-2xl font-black text-slate-900 dark:text-white mb-3 hover:text-amber-600 dark:hover:text-amber-400 cursor-pointer transition-colors leading-snug line-clamp-2"
                          >
                            {pkg.name}
                          </h3>

                          {/* Luxury Feature Tags */}
                          <div className="flex flex-wrap gap-1.5 mb-4">
                            <span className="text-[10px] font-bold bg-slate-100 dark:bg-white/[0.04] text-slate-700 dark:text-white/70 px-2.5 py-1 rounded-xl border border-slate-200/80 dark:border-white/5">
                              ✦ Heated Heritage Stay
                            </span>
                            <span className="text-[10px] font-bold bg-slate-100 dark:bg-white/[0.04] text-slate-700 dark:text-white/70 px-2.5 py-1 rounded-xl border border-slate-200/80 dark:border-white/5">
                              ✦ 4x4 Snow Chauffeur
                            </span>
                            <span className="text-[10px] font-bold bg-slate-100 dark:bg-white/[0.04] text-slate-700 dark:text-white/70 px-2.5 py-1 rounded-xl border border-slate-200/80 dark:border-white/5">
                              ✦ Sunset Shikara
                            </span>
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
                              <span className="text-2xl font-black text-slate-900 dark:text-white">
                                ₹{displayPrice.toLocaleString()}
                              </span>
                              <span className="text-[11px] font-semibold text-slate-500 dark:text-white/50">/ couple</span>
                            </div>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">
                              ✓ Breakfast & Dinner (MAP)
                            </span>
                          </div>

                          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20">
                            Instant Quotation
                          </span>
                        </div>

                        {/* Dual Action Buttons */}
                        <div className="grid grid-cols-2 gap-3 pt-2">
                          <Button
                            variant="outline"
                            onClick={() => setQuickPeekPackage(pkg)}
                            className="h-12 rounded-xl border-slate-300 dark:border-white/10 text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5 text-amber-500" /> Quick Peek
                          </Button>

                          <Button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              openLeadModal({
                                packageTitle: pkg.name,
                                destination: pkg.destination,
                                sourceCta: 'PACKAGES_PAGE_CARD'
                              });
                            }}
                            className="h-12 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[11px] uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5"
                          >
                            Quick Quote <ArrowRight className="w-3.5 h-3.5" />
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

      {/* QUICK PEEK SLIDE-OVER DRAWER (Daylight & Night View Adaptive) */}
      <Sheet open={!!quickPeekPackage} onOpenChange={(open) => !open && setQuickPeekPackage(null)}>
        <SheetContent side="right" className="w-full sm:max-w-xl bg-white dark:bg-[#070b0e] text-slate-900 dark:text-white border-l border-slate-200 dark:border-white/10 p-0 overflow-y-auto">
          {quickPeekPackage && (
            <div className="flex flex-col min-h-full">
              {/* Drawer Hero Image */}
              <div className="relative h-72 w-full">
                <img 
                  src={quickPeekPackage.image} 
                  alt={quickPeekPackage.name} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-black/30 to-transparent" />
                
                <div className="absolute top-4 left-4 flex gap-2">
                  <Badge className="bg-amber-500 text-slate-950 font-black text-[10px] uppercase">
                    {quickPeekPackage.destination}
                  </Badge>
                  <Badge variant="outline" className="bg-slate-950/70 border-white/20 text-white text-[10px] font-bold">
                    {quickPeekPackage.duration}
                  </Badge>
                </div>

                <div className="absolute bottom-4 left-6 right-6 text-white">
                  <div className="flex items-center gap-1 mb-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    ))}
                    <span className="text-xs font-bold text-white/80 ml-2">
                      {quickPeekPackage.rating || 4.9} ({quickPeekPackage.reviewCount || 12} Verified Reviews)
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
                <div className="p-5 rounded-2xl bg-amber-500/10 dark:bg-white/[0.04] border border-amber-500/20 dark:border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono tracking-widest uppercase text-amber-600 dark:text-amber-400 block font-bold">
                      All-Inclusive Curated Tariff
                    </span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">
                        ₹{(quickPeekPackage.price || 24500).toLocaleString()}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-white/50">/ couple</span>
                    </div>
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold block mt-1">
                      ✓ Includes Heated Stay, Shikara & 4x4 Chauffeur
                    </span>
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs py-1 px-3 font-bold">
                    Instant Lock
                  </Badge>
                </div>

                {/* Seasonal Rates Guide */}
                <div>
                  <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400 dark:text-white/50 mb-3">
                    Seasonal Rate Estimate
                  </h4>
                  <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5">
                      <span className="text-[10px] text-slate-500 dark:text-white/40 block">❄️ Winter Snow</span>
                      <span className="font-bold text-slate-900 dark:text-white font-mono mt-1 block">
                        ₹{(quickPeekPackage.price || 24500).toLocaleString()}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5">
                      <span className="text-[10px] text-slate-500 dark:text-white/40 block">🌷 Tulip Spring</span>
                      <span className="font-bold text-amber-600 dark:text-amber-400 font-mono mt-1 block">
                        ₹{Math.round((quickPeekPackage.price || 24500) * 1.15).toLocaleString()}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5">
                      <span className="text-[10px] text-slate-500 dark:text-white/40 block">☀️ Summer Valley</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-1 block">
                        ₹{Math.round((quickPeekPackage.price || 24500) * 0.95).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Key Curated Inclusions */}
                <div>
                  <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400 dark:text-white/50 mb-3">
                    Curated Inclusions
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 text-xs text-slate-700 dark:text-white/80">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>Dedicated Toyota Innova Crysta / 4x4 vehicle with snow chains and verified driver.</span>
                    </div>
                    <div className="flex items-start gap-3 text-xs text-slate-700 dark:text-white/80">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>Private heated Shikara sunset cruise on Nigeen or Dal Lake with hot Kashmiri Kahwa.</span>
                    </div>
                    <div className="flex items-start gap-3 text-xs text-slate-700 dark:text-white/80">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>Daily morning breakfast and authentic multi-course Kashmiri Wazwan dinners (MAP plan).</span>
                    </div>
                    <div className="flex items-start gap-3 text-xs text-slate-700 dark:text-white/80">
                      <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <span>24/7 Kashmir Corridor Disruption Shield — instant rerouting if roads get weather-delayed.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Drawer Footer Actions */}
              <div className="p-6 bg-slate-50 dark:bg-black/60 border-t border-slate-200 dark:border-white/10 space-y-3 sticky bottom-0 backdrop-blur-xl">
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
                  className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black uppercase text-xs rounded-xl shadow-lg shadow-amber-500/20"
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
                      openWhatsAppLead({ 
                        packageTitle: selected.name, 
                        destination: selected.destination 
                      });
                    }}
                    className="flex-1 h-11 border-slate-300 dark:border-white/20 text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 text-xs rounded-xl font-bold"
                  >
                    <MessageCircle className="w-4 h-4 mr-1.5 text-emerald-500" />
                    <span>WhatsApp Curator</span>
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={() => {
                      const targetId = quickPeekPackage.id;
                      setQuickPeekPackage(null);
                      navigate(`/packages/${targetId}`);
                    }}
                    className="flex-1 h-11 text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white text-xs rounded-xl font-bold"
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
