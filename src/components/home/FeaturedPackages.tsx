import { Link } from 'react-router-dom';
import { Star, Clock, MapPin, ArrowRight, Sparkles, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useFeaturedPackages } from '@/hooks/useCMSData';
import { Badge } from '@/components/ui/badge';

export default function FeaturedPackages() {
  const { data: featuredPackages = [], isLoading } = useFeaturedPackages();

  return (
    <section className="py-32 bg-[#05080a] relative overflow-hidden">
      {/* Royal Gradients */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-kashmir-gold/5 blur-[120px] -ml-64 -mt-64" />
      
      <div className="container mx-auto px-6 relative z-10">
        {/* Header - Elite Style */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-12 mb-20 animate-fade-up">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-6">
              <TrendingUp className="w-3.5 h-3.5 text-kashmir-gold" />
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/60">Seasonal Selections</span>
            </div>
            <h2 className="font-display text-5xl md:text-7xl font-black text-white leading-tight tracking-tighter">
              PRIVATE <br />
              <span className="text-kashmir-gold">COLLECTIONS</span>
            </h2>
          </div>
          <p className="text-white/40 text-lg max-w-sm font-medium leading-relaxed">
            Exclusive itineraries engineered for those who demand nothing less than perfection in every mile.
          </p>
        </div>

        {/* Packages Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-6 space-y-4">
                <Skeleton className="h-64 w-full rounded-[2rem] bg-white/5" />
                <Skeleton className="h-8 w-3/4 bg-white/5" />
                <Skeleton className="h-4 w-1/2 bg-white/5" />
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
                <div className="h-full bg-white/[0.02] border border-white/5 rounded-[2.5rem] overflow-hidden transition-all duration-700 hover:border-kashmir-gold/30 hover:bg-white/[0.04] hover:shadow-2xl hover:shadow-kashmir-gold/5">
                  {/* Image Hub */}
                  <div className="relative h-72 overflow-hidden m-4 rounded-[2rem]">
                    <img
                      src={pkg.image}
                      alt={pkg.name}
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#05080a] via-transparent to-transparent opacity-60" />
                    
                    {/* Exclusive Badge */}
                    <div className="absolute top-5 left-5 px-4 py-2 bg-kashmir-gold rounded-xl shadow-2xl flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-black" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-black">
                        -{Math.round((1 - pkg.price / pkg.originalPrice) * 100)}% ELITE
                      </span>
                    </div>

                    {/* Meta Info */}
                    <div className="absolute bottom-5 left-5 right-5 flex justify-between items-end">
                      <div className="flex items-center gap-2 text-white/90">
                        <MapPin className="h-3.5 w-3.5 text-kashmir-gold" />
                        <span className="text-[10px] font-black uppercase tracking-widest">{pkg.destination}</span>
                      </div>
                      <Badge variant="outline" className="bg-white/5 border-white/10 text-[10px] text-white/70 backdrop-blur-md">
                        {pkg.duration}
                      </Badge>
                    </div>
                  </div>

                  {/* Content Hub */}
                  <div className="p-8 pt-4">
                    <div className="flex items-center gap-1 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-3 w-3 ${i < Math.floor(pkg.rating) ? 'fill-kashmir-gold text-kashmir-gold' : 'text-white/10'}`} />
                      ))}
                      <span className="text-[10px] font-bold text-white/30 ml-2">({pkg.reviewCount} Reviews)</span>
                    </div>

                    <h3 className="font-display text-2xl font-black text-white mb-6 group-hover:text-kashmir-gold transition-colors line-clamp-2 leading-snug">
                      {pkg.name}
                    </h3>

                    <div className="flex items-center justify-between border-t border-white/5 pt-6">
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20 mb-1">Estate Value</p>
                        <div className="flex items-baseline gap-3">
                          <span className="text-2xl font-black text-white italic">₹{pkg.price.toLocaleString()}</span>
                          <span className="text-[10px] font-bold text-white/20 line-through">₹{pkg.originalPrice.toLocaleString()}</span>
                        </div>
                      </div>
                      
                      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-kashmir-gold group-hover:text-black transition-all duration-500">
                        <ArrowRight className="w-5 h-5 transition-transform duration-500 group-hover:translate-x-1" />
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
            <Button size="lg" className="h-auto py-6 px-12 rounded-full bg-white/5 border border-white/10 text-white font-black text-xs uppercase tracking-[0.3em] hover:bg-kashmir-gold hover:text-black hover:border-kashmir-gold transition-all duration-500 hover:scale-105 active:scale-95 group">
              Explore Entire Portfolio
              <ArrowRight className="w-5 h-5 ml-4 transition-transform group-hover:translate-x-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
