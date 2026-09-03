import { Link } from 'react-router-dom';
import { Star, Clock, MapPin, ArrowRight, Sparkles, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useFeaturedPackages } from '@/hooks/useCMSData';
import { Badge } from '@/components/ui/badge';

export default function FeaturedPackages() {
  const { data: featuredPackages = [], isLoading } = useFeaturedPackages();

  return (
    <section className="py-32 bg-[#F8F8F9] dark:bg-[#05080a] relative overflow-hidden transition-colors">
      {/* Background Orbs */}
      <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-amber-400/10 blur-[140px] -ml-64 -translate-y-1/2" />
      <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-purple-400/10 blur-[140px] -mr-64 -translate-y-1/2" />
      
      <div className="container mx-auto px-6 relative z-10">
        {/* Header - Elite Style */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-12 mb-20 animate-fade-up">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm mb-6">
              <TrendingUp className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#111439] dark:text-white">Seasonal Selections</span>
            </div>
            <h2 className="font-display text-5xl md:text-7xl font-black text-[#111439] dark:text-white leading-tight tracking-tight">
              PRIVATE <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-600 via-purple-600 to-cyan-600">COLLECTIONS</span>
            </h2>
          </div>
          <p className="text-[#4A5568] dark:text-white/60 text-lg max-w-sm font-medium leading-relaxed">
            Exclusive itineraries engineered for those who demand nothing less than perfection in every mile.
          </p>
        </div>

        {/* Packages Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-[2.5rem] p-6 space-y-4 shadow-sm">
                <Skeleton className="h-64 w-full rounded-[2rem] bg-slate-100" />
                <Skeleton className="h-8 w-3/4 bg-slate-100" />
                <Skeleton className="h-4 w-1/2 bg-slate-100" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredPackages?.map((pkg, index) => (
              <Link 
                key={pkg.id} 
                to={`/packages/${pkg.id}`}
                className="group animate-fade-up"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="h-full bg-white dark:bg-[#0a0f12] border border-slate-200/90 dark:border-white/10 rounded-[2.5rem] overflow-hidden transition-all duration-700 hover:border-slate-300 dark:hover:border-white/20 hover:shadow-2xl hover:shadow-slate-900/10 hover:-translate-y-1 shadow-md shadow-slate-900/5">
                  {/* Image Hub */}
                  <div className="relative h-72 overflow-hidden m-4 rounded-[2rem]">
                    <img
                      src={pkg.image}
                      alt={pkg.name}
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
                    
                    {/* Exclusive Badge */}
                    <div className="absolute top-5 left-5 px-3.5 py-1.5 bg-white/90 dark:bg-[#0c1216]/90 backdrop-blur-md rounded-xl shadow-lg border border-slate-200 dark:border-white/10 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#111439] dark:text-white">
                        ELITE EXCLUSIVE
                      </span>
                    </div>

                    {/* Meta Info */}
                    <div className="absolute bottom-5 left-5 right-5 flex justify-between items-end">
                      <div className="flex items-center gap-2 text-white drop-shadow-md">
                        <MapPin className="h-3.5 w-3.5 text-amber-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest">{pkg.destination}</span>
                      </div>
                      <Badge variant="outline" className="bg-white/90 dark:bg-[#0c1216]/90 border-slate-200 dark:border-white/10 text-[10px] text-[#111439] dark:text-white font-bold backdrop-blur-md shadow-sm">
                        {pkg.duration}
                      </Badge>
                    </div>
                  </div>

                  {/* Content Hub */}
                  <div className="p-8 pt-4">
                    <div className="flex items-center gap-1 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-3 w-3 ${i < Math.floor(pkg.rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-200 dark:text-white/20'}`} />
                      ))}
                      <span className="text-[10px] font-bold text-slate-500 dark:text-white/40 ml-2">({pkg.reviewCount} Reviews)</span>
                    </div>

                    <h3 className="font-display text-2xl font-black text-[#111439] dark:text-white mb-6 group-hover:text-amber-500 transition-colors line-clamp-2 leading-snug">
                      {pkg.name}
                    </h3>

                    <div className="flex items-center justify-between border-t border-slate-100 dark:border-white/10 pt-6">
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-white/40 mb-1">Estate Value</p>
                        <span className="text-xl font-black text-[#111439] dark:text-white uppercase tracking-wider">On Request</span>
                      </div>
                      
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/10 flex items-center justify-center text-[#111439] dark:text-white group-hover:bg-[#111439] dark:group-hover:bg-amber-400 dark:group-hover:text-black group-hover:text-white transition-all duration-500 shadow-sm">
                        <ArrowRight className="w-5 h-5 -rotate-45 group-hover:rotate-0 transition-transform duration-500" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Global CTA */}
        <div className="flex justify-center mt-24">
          <Link to="/packages">
            <Button size="lg" className="h-auto py-6 px-12 rounded-full bg-[#111439] text-white font-black text-xs uppercase tracking-[0.3em] hover:bg-amber-600 transition-all duration-500 hover:scale-105 active:scale-95 group">
              Explore Entire Portfolio
              <ArrowRight className="w-5 h-5 ml-4 transition-transform group-hover:translate-x-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
