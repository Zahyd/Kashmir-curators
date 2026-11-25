import { useState, useEffect } from 'react';
import { Star, ChevronLeft, ChevronRight, Quote, MessageSquareQuote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTestimonials } from '@/hooks/useCMSData';
import { useLandingPageContent } from '@/hooks/useLandingPageContent';
import { cn } from '@/lib/utils';

const FALLBACK_TESTIMONIALS = [
  {
    id: 'fallback-1',
    name: 'Dr. Aarav & Meera Kapoor',
    location: 'Mumbai',
    tripType: '6D/5N Private Honeymoon Sanctuary',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
    text: 'From the heated Nigeen Lake cedar houseboat to our 4x4 Fortuner climbing Gulmarg during fresh snowfall, every single handoff felt effortlessly orchestrated.',
    rating: 5,
  },
  {
    id: 'fallback-2',
    name: 'Vikramaditya Mehta',
    location: 'Director, Royal Voyages (B2B Partner)',
    tripType: 'B2B Travel Agency OS',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
    text: 'We moved 100% of our Kashmir departures to Kashmir Curators. Generating white-label PDFs in 90 seconds with live Gondola & road telemetry doubled our close rate.',
    rating: 5,
  },
  {
    id: 'fallback-3',
    name: 'Sophia & Liam Thornton',
    location: 'London, UK',
    tripType: '8D/7N Grand Five-Valley Expedition',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300',
    text: 'Doodhpathri and Aru Valley were breathtaking. Having transparent GBP pricing and a 24/7 WhatsApp ground marshal gave our family complete peace of mind.',
    rating: 5,
  },
];

export default function Testimonials() {
  const { data: cmsTestimonials = [], isLoading } = useTestimonials();
  const { content, testimonialsSection } = useLandingPageContent();
  const meta = (content as any)?.testimonialsSection || {};
  const badgeText = meta.badge || testimonialsSection?.badgeText || 'Guest & Partner Voices';
  const headingText = meta.heading || testimonialsSection?.title || 'CURATED CHRONICLES';
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const testimonials =
    Array.isArray(cmsTestimonials) && cmsTestimonials.length > 0
      ? cmsTestimonials
      : FALLBACK_TESTIMONIALS;

  useEffect(() => {
    if (!isAutoPlaying || testimonials.length === 0) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, 6500);
    return () => clearInterval(interval);
  }, [isAutoPlaying, testimonials.length]);

  const handlePrev = () => {
    setIsAutoPlaying(false);
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const handleNext = () => {
    setIsAutoPlaying(false);
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  };

  return (
    <section className="py-16 md:py-28 bg-[#F8F8F9] dark:bg-[#05080a] relative overflow-hidden transition-colors border-t border-slate-200/60 dark:border-white/5">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-400/10 blur-[140px] -mr-64 -mt-64 pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 relative z-10 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-14 md:mb-20 animate-fade-up">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm mb-5">
            <MessageSquareQuote className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#111439] dark:text-white">
              {badgeText}
            </span>
          </div>
          <h2 className="font-display text-3xl sm:text-5xl md:text-6xl font-black text-[#111439] dark:text-white tracking-tight mb-5">
            {headingText.includes(' ') ? (
              <>
                {headingText.split(' ').slice(0, -1).join(' ')}{' '}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-600 via-amber-500 to-cyan-600 dark:from-amber-400 dark:via-yellow-200 dark:to-emerald-400">
                  {headingText.split(' ').slice(-1).join(' ')}
                </span>
              </>
            ) : (
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-600 via-amber-500 to-cyan-600">
                {headingText}
              </span>
            )}
          </h2>
          <div className="w-20 h-1 bg-amber-500/40 rounded-full" />
        </div>

        {/* Testimonial Slider Card */}
        <div className="relative p-6 sm:p-10 md:p-14 rounded-[2.5rem] bg-white dark:bg-[#0a0f14] border border-slate-200/90 dark:border-white/10 shadow-xl shadow-slate-900/5">
          <Quote className="hidden md:block absolute top-8 right-12 h-32 w-32 text-[#111439]/[0.04] dark:text-white/[0.04] pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-10 md:gap-14">
            <div className="flex-1 min-h-[260px] sm:min-h-[280px] relative w-full">
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <p className="text-[#4A5568] dark:text-white/60 font-black uppercase tracking-widest animate-pulse text-xs">
                    Loading Guest Chronicles...
                  </p>
                </div>
              ) : (
                testimonials.map((testimonial, index) => (
                  <div
                    key={testimonial.id}
                    className={cn(
                      'transition-all duration-700 ease-in-out',
                      index === activeIndex
                        ? 'opacity-100 translate-y-0 relative'
                        : 'opacity-0 absolute inset-0 -translate-y-4 pointer-events-none'
                    )}
                  >
                    <div className="flex gap-1.5 mb-6">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            'h-4 w-4',
                            i < testimonial.rating
                              ? 'fill-amber-500 text-amber-500'
                              : 'text-slate-200 dark:text-white/20'
                          )}
                        />
                      ))}
                    </div>

                    <p className="text-xl sm:text-2xl md:text-4xl font-display font-medium text-[#111439] dark:text-white leading-snug tracking-tight mb-8 italic">
                      "{testimonial.text}"
                    </p>

                    <div className="flex items-center gap-4 sm:gap-5">
                      <div className="relative shrink-0">
                        <img
                          src={testimonial.avatar}
                          alt={testimonial.name}
                          className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border border-slate-200 dark:border-white/10 shadow-md"
                        />
                        <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 bg-amber-500 rounded-lg flex items-center justify-center border-2 border-white dark:border-[#0a0f14] shadow-sm">
                          <Quote className="w-3 h-3 text-white fill-white" />
                        </div>
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-base sm:text-lg font-black text-[#111439] dark:text-white tracking-tight uppercase truncate">
                          {testimonial.name}
                        </h4>
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#4A5568] dark:text-white/55 truncate">
                          {testimonial.location} • {testimonial.tripType}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Navigation Controls */}
            <div className="flex md:flex-col items-center gap-4 sm:gap-5 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrev}
                aria-label="Previous testimonial"
                className="w-12 h-12 rounded-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[#111439] dark:text-white hover:bg-[#111439] dark:hover:bg-amber-400 hover:text-white dark:hover:text-black transition-all shadow-sm"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>

              <div className="flex md:flex-col items-center gap-2.5">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    aria-label={`View testimonial ${index + 1}`}
                    onClick={() => {
                      setIsAutoPlaying(false);
                      setActiveIndex(index);
                    }}
                    className={cn(
                      'transition-all duration-500 rounded-full',
                      index === activeIndex
                        ? 'bg-[#111439] dark:bg-amber-400 w-7 h-2.5 md:w-2.5 md:h-7'
                        : 'bg-slate-300 dark:bg-white/20 w-2 h-2 hover:bg-slate-400'
                    )}
                  />
                ))}
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleNext}
                aria-label="Next testimonial"
                className="w-12 h-12 rounded-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[#111439] dark:text-white hover:bg-[#111439] dark:hover:bg-amber-400 hover:text-white dark:hover:text-black transition-all shadow-sm"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
