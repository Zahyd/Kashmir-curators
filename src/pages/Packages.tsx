import { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Star, Clock, MapPin, Filter, X, Search, ArrowUpDown, Compass, ArrowRight } from 'lucide-react';
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

export default function Packages() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: packages = [], isLoading } = usePackages();
  const { data: cabOptions = [], isLoading: isLoadingCabs } = useCabs();
  const { data: destinations = [] } = useDestinations();
  
  const [filters, setFilters] = useState({
    destination: searchParams.get('destination') || '',
    search: '',
    budget: [0, 60000],
    duration: '',
    rating: '',
    sortBy: 'popularity',
  });

  const filteredPackages = useMemo(() => {
    if (!packages) return [];
    
    return packages.filter(pkg => {
      if (filters.destination && pkg.destination !== filters.destination) return false;
      if (filters.search && !pkg.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
      if (pkg.price < filters.budget[0] || pkg.price > filters.budget[1]) return false;
      if (filters.rating && pkg.rating < parseFloat(filters.rating)) return false;
      if (filters.duration) {
        const days = parseInt(pkg.duration);
        if (filters.duration === 'short' && days > 3) return false;
        if (filters.duration === 'medium' && (days < 4 || days > 5)) return false;
        if (filters.duration === 'long' && days < 6) return false;
      }
      return true;
    }).sort((a, b) => {
      switch (filters.sortBy) {
        case 'price-low': return a.price - b.price;
        case 'price-high': return b.price - a.price;
        case 'rating': return b.rating - a.rating;
        default: return b.reviewCount - a.reviewCount;
      }
    });
  }, [packages, filters]);

  const clearFilters = () => {
    setFilters({
      destination: '',
      search: '',
      budget: [0, 60000],
      duration: '',
      rating: '',
      sortBy: 'popularity',
    });
    setSearchParams({});
  };

  const hasActiveFilters = filters.destination || filters.search || filters.duration || filters.rating || filters.budget[0] > 0 || filters.budget[1] < 60000;

  const FilterContent = () => (
    <div className="space-y-8">
      {/* Destination */}
      <div className="space-y-3">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-2">Destination</label>
        <Select value={filters.destination || "all"} onValueChange={(value) => setFilters(prev => ({ ...prev, destination: value === "all" ? "" : value }))}>
          <SelectTrigger className="h-14 bg-white/[0.03] border-white/5 rounded-2xl text-white focus:ring-kashmir-gold/50">
            <SelectValue placeholder="All destinations" />
          </SelectTrigger>
          <SelectContent className="bg-[#0a0f12] border-white/10 text-white">
            <SelectItem value="all">All destinations</SelectItem>
            {destinations?.map((dest) => (
              <SelectItem key={dest} value={dest}>{dest}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Budget */}
      <div className="space-y-6">
        <div className="flex justify-between items-end px-2">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Budget Range</label>
          <span className="text-xs font-black text-kashmir-gold">
            ₹{filters.budget[0].toLocaleString()} - ₹{filters.budget[1].toLocaleString()}
          </span>
        </div>
        <Slider
          value={filters.budget}
          onValueChange={(value) => setFilters(prev => ({ ...prev, budget: value as [number, number] }))}
          min={0}
          max={100000}
          step={5000}
          className="py-4"
        />
      </div>

      {/* Duration */}
      <div className="space-y-3">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-2">Timeframe</label>
        <Select value={filters.duration || "any"} onValueChange={(value) => setFilters(prev => ({ ...prev, duration: value === "any" ? "" : value }))}>
          <SelectTrigger className="h-14 bg-white/[0.03] border-white/5 rounded-2xl text-white focus:ring-kashmir-gold/50">
            <SelectValue placeholder="Any duration" />
          </SelectTrigger>
          <SelectContent className="bg-[#0a0f12] border-white/10 text-white">
            <SelectItem value="any">Any duration</SelectItem>
            <SelectItem value="short">1-3 Days (Expedited)</SelectItem>
            <SelectItem value="medium">4-5 Days (Classic)</SelectItem>
            <SelectItem value="long">6+ Days (Grand)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Rating */}
      <div className="space-y-3">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-2">Client Rating</label>
        <Select value={filters.rating || "any"} onValueChange={(value) => setFilters(prev => ({ ...prev, rating: value === "any" ? "" : value }))}>
          <SelectTrigger className="h-14 bg-white/[0.03] border-white/5 rounded-2xl text-white focus:ring-kashmir-gold/50">
            <SelectValue placeholder="Any rating" />
          </SelectTrigger>
          <SelectContent className="bg-[#0a0f12] border-white/10 text-white">
            <SelectItem value="any">Any rating</SelectItem>
            <SelectItem value="4.5">4.5+ Stars (Elite)</SelectItem>
            <SelectItem value="4.0">4.0+ Stars (Premium)</SelectItem>
            <SelectItem value="3.5">3.5+ Stars (Standard)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {hasActiveFilters && (
        <Button 
          variant="ghost" 
          className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all font-black text-[10px] uppercase tracking-widest mt-4" 
          onClick={clearFilters}
        >
          <X className="h-3.5 w-3.5 mr-2" />
          Reset Curation
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#05080a] selection:bg-kashmir-gold/30">
      <Navbar />
      
      {/* Header - Elite Style */}
      <div className="relative pt-48 pb-32 overflow-hidden">
        {/* Background Parallax Effect */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=1600" 
            className="w-full h-full object-cover opacity-30 grayscale"
            alt="Kashmir"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#05080a] via-[#05080a]/80 to-[#05080a]" />
        </div>

        <div className="container mx-auto px-6 relative z-10 text-center animate-fade-up">
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8">
            <Filter className="w-3.5 h-3.5 text-kashmir-gold" />
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/60">Curation Registry</span>
          </div>
          <h1 className="font-display text-6xl md:text-8xl font-black text-white tracking-tighter mb-8 leading-[0.9]">
            PRIVATE <span className="text-kashmir-gold italic">PORTFOLIO</span>
          </h1>
          <p className="text-white/40 text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed">
            A meticulously curated registry of the finest expeditions across the Kashmir valley.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 pb-32">
        <div className="flex flex-col lg:flex-row gap-16">
          {/* Desktop Filters - Glassmorphic Sidebar */}
          <aside className="hidden lg:block w-80 shrink-0">
            <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-6 md:p-10 sticky top-32 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-10">
                <h3 className="font-black text-white text-xs uppercase tracking-[0.2em]">Curation</h3>
                <div className="w-8 h-8 rounded-lg bg-kashmir-gold/10 flex items-center justify-center border border-kashmir-gold/20">
                  <ArrowUpDown className="w-4 h-4 text-kashmir-gold" />
                </div>
              </div>
              <FilterContent />
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Search and Sort Bar - Modern Hub */}
            <div className="flex flex-col sm:flex-row gap-6 mb-12 animate-fade-up" style={{ animationDelay: '200ms' }}>
              <div className="relative flex-1 group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-white/20 group-focus-within:text-kashmir-gold transition-colors" />
                <Input
                  placeholder="Identify your destination..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-16 h-16 bg-white/[0.02] border-white/5 rounded-[2rem] text-white placeholder:text-white/10 focus-visible:ring-kashmir-gold/50 font-bold"
                />
              </div>
              
              <Select value={filters.sortBy} onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}>
                <SelectTrigger className="w-full sm:w-64 h-16 bg-white/[0.02] border-white/5 rounded-[2rem] text-white font-bold">
                  <div className="flex items-center gap-3">
                    <ArrowUpDown className="h-4 w-4 text-kashmir-gold" />
                    <SelectValue placeholder="Priority" />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-[#0a0f12] border-white/10 text-white rounded-2xl p-2">
                  <SelectItem value="popularity" className="rounded-xl">Most Popular</SelectItem>
                  <SelectItem value="price-low" className="rounded-xl">Price: Low to High</SelectItem>
                  <SelectItem value="price-high" className="rounded-xl">Price: High to Low</SelectItem>
                  <SelectItem value="rating" className="rounded-xl">Highest Rated</SelectItem>
                </SelectContent>
              </Select>

              {/* Mobile Filter Button */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" className="lg:hidden h-16 bg-white/5 border border-white/10 rounded-[2rem] text-white">
                    <Filter className="h-4 w-4 mr-2 text-kashmir-gold" />
                    Refine
                  </Button>
                </SheetTrigger>
                <SheetContent className="bg-[#05080a] border-white/10 text-white overflow-y-auto">
                  <SheetHeader className="mb-10">
                    <SheetTitle className="font-display text-3xl font-black text-white">REFINEMENT</SheetTitle>
                  </SheetHeader>
                  <FilterContent />
                </SheetContent>
              </Sheet>
            </div>

            {/* Results Count */}
            <div className="flex items-center gap-4 mb-10 text-[10px] font-black uppercase tracking-[0.3em] text-white/20 animate-fade-in">
              <div className="w-8 h-[1px] bg-white/10" />
              <span>{isLoading ? 'Scanning...' : `${filteredPackages.length} ENTRIES REGISTERED`}</span>
            </div>

            {/* Packages Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-10">
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
                <Button variant="gold" onClick={clearFilters} className="h-14 px-10 rounded-2xl">Reset Curation</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-10">
                {filteredPackages.map((pkg, index) => (
                  <Link 
                    key={pkg.id} 
                    to={`/packages/${pkg.id}`}
                    className="group animate-fade-up block"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="relative bg-white/[0.02] border border-white/5 rounded-[3rem] overflow-hidden p-4 hover:border-kashmir-gold/30 transition-all duration-700 hover:-translate-y-2 group">
                      <div className="relative h-80 overflow-hidden rounded-[2.5rem]">
                        <img
                          src={pkg.image}
                          alt={pkg.name}
                          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        
                        {/* Status Badges */}
                        <div className="absolute top-6 left-6 flex flex-col gap-3">
                          <div className="px-4 py-2 bg-black/60 backdrop-blur-md border border-white/10 text-kashmir-gold text-[9px] font-black uppercase tracking-[0.2em] rounded-full">
                            {Math.round((1 - pkg.price / pkg.originalPrice) * 100)}% Private Credit
                          </div>
                        </div>

                        <div className="absolute bottom-8 left-8 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                            <MapPin className="h-4 w-4 text-kashmir-gold" />
                          </div>
                          <span className="text-sm font-black text-white uppercase tracking-widest">{pkg.destination}</span>
                        </div>
                      </div>

                      <div className="p-8">
                        <h3 className="font-display text-3xl font-black text-white mb-6 leading-tight group-hover:text-kashmir-gold transition-colors">
                          {pkg.name}
                        </h3>

                        <div className="flex items-center gap-8 mb-10 pb-8 border-b border-white/5">
                          <div className="flex items-center gap-3">
                            <Clock className="h-4 w-4 text-white/30" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">{pkg.duration}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Star className="h-4 w-4 fill-kashmir-gold text-kashmir-gold" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">{pkg.rating} ({pkg.reviewCount})</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 block mb-2">Portfolio Value</span>
                            <div className="flex items-baseline gap-3">
                              <span className="text-3xl font-black text-white">₹{pkg.price.toLocaleString()}</span>
                              <span className="text-xs font-medium text-white/20 line-through">₹{pkg.originalPrice.toLocaleString()}</span>
                            </div>
                          </div>
                          <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-kashmir-gold group-hover:text-black transition-all duration-500">
                            <ArrowRight className="w-6 h-6" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
      <FloatingActions />
    </div>
  );
}
