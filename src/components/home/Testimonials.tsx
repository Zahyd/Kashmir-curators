import { useState, useEffect } from 'react';
import { Star, ChevronLeft, ChevronRight, Quote, MessageSquareQuote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTestimonials } from '@/hooks/useCMSData';
import { cn } from '@/lib/utils';

export default function Testimonials() {
  const { data: testimonials, isLoading } = useTestimonials();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying || !testimonials || testimonials.length === 0) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, testimonials]);

  const handlePrev = () => {
    if (!testimonials) return;
    setIsAutoPlaying(false);
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const handleNext = () => {
    if (!testimonials) return;
    setIsAutoPlaying(false);
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  };

  return (
    <section className="py-32 bg-[#05080a] relative overflow-hidden">
      {/* Decorative Gradient */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-kashmir-gold/5 blur-[120px] -mr-64 -mt-64" />

      <div className="container mx-auto px-6 relative z-10">
        {/* Header - Elite Style */}
        <div className="flex flex-col items-center text-center mb-24 animate-fade-up">
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-6">
            <MessageSquareQuote className="w-3.5 h-3.5 text-kashmir-gold" />
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/60">Legacy Accounts</span>
          </div>
          <h2 className="font-display text-5xl md:text-7xl font-black text-white tracking-tighter mb-8">
            GUEST <span className="text-kashmir-gold text-italic">CHRONICLES</span>
          </h2>
          <div className="w-24 h-1 bg-kashmir-gold/30 rounded-full" />
        </div>

        {/* Testimonial Slider */}
        <div className="max-w-6xl mx-auto">
          <div className="relative">
            {/* Massive Quote Decoration */}
            <Quote className="absolute -top-16 -left-16 h-48 w-48 text-white/[0.02] -rotate-12 pointer-events-none" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-16">
              {/* Slider Content */}
              <div className="flex-1 min-h-[400px] relative">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-white/40 font-black uppercase tracking-widest animate-pulse">Scanning Chronicles...</p>
                  </div>
                ) : testimonials?.map((testimonial, index) => (
                  <div
                    key={testimonial.id}
                    className={cn(
                      "transition-all duration-1000 ease-in-out transform",
                      index === activeIndex 
                        ? "opacity-100 translate-y-0 scale-100" 
                        : "opacity-0 absolute inset-0 -translate-y-8 scale-95 pointer-events-none"
                    )}
                  >
                    {/* Stars Elite */}
                    <div className="flex gap-2 mb-10">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "h-4 w-4",
                            i < testimonial.rating
                              ? "fill-kashmir-gold text-kashmir-gold"
                              : "text-white/10"
                          )}
                        />
                      ))}
                    </div>

                    <p className="text-3xl md:text-5xl font-display font-medium text-white leading-tight tracking-tight mb-12 italic">
                      "{testimonial.text}"
                    </p>

                    <div className="flex items-center gap-6">
                      <div className="relative">
                        <img
                          src={testimonial.avatar}
                          alt={testimonial.name}
                          className="w-20 h-20 rounded-2xl object-cover grayscale group-hover:grayscale-0 transition-all duration-700 border border-white/10"
                        />
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-kashmir-gold rounded-lg flex items-center justify-center border-4 border-[#05080a]">
                          <Quote className="w-3 h-3 text-black fill-black" />
                        </div>
                      </div>
                      <div>
                        <h4 className="text-xl font-black text-white tracking-tight uppercase">
                          {testimonial.name}
                        </h4>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
                          {testimonial.location} • {testimonial.tripType}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Navigation Hub */}
              <div className="flex flex-col gap-6 md:w-32 items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePrev}
                  className="w-16 h-16 rounded-full bg-white/5 border border-white/10 hover:bg-kashmir-gold hover:text-black transition-all duration-500"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                
                {/* Vertical Dots */}
                <div className="flex md:flex-col items-center gap-3">
                  {testimonials.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setIsAutoPlaying(false);
                        setActiveIndex(index);
                      }}
                      className={cn(
                        "transition-all duration-500 rounded-full",
                        index === activeIndex
                          ? "bg-kashmir-gold w-3 h-8"
                          : "bg-white/10 w-2 h-2 hover:bg-white/30"
                      )}
                    />
                  ))}
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNext}
                  className="w-16 h-16 rounded-full bg-white/5 border border-white/10 hover:bg-kashmir-gold hover:text-black transition-all duration-500"
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
