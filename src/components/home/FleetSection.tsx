import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Car, Users, Sliders, ArrowRight, ShieldCheck, Sparkles, Navigation, 
  CheckCircle2, Compass, PhoneCall 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useCabs } from '@/hooks/useCMSData';
import { useLandingPageContent } from '@/hooks/useLandingPageContent';
import { useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import { SOCKET_URL, DEFAULT_SOCKET_OPTIONS } from '@/lib/api';
import { cn } from '@/lib/utils';

export default function FleetSection() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: dbCabs = [], isLoading } = useCabs();
  const { content } = useLandingPageContent();

  const meta = (content as any)?.fleetSection || {};
  const badgeText = meta.badge || 'VIP Chauffeurs & 4x4 Fleet';
  const headingText = meta.heading || 'CHAUFFEUR CLASS FLEET';
  const descriptionText = meta.description || 'Mountain-certified 4WDs, executive sedans, and luxury cruisers engineered for all weather conditions and seamless valley transit.';

  // Real-time synchronization with Fleet & Cabs CMS
  useEffect(() => {
    const socket = io(SOCKET_URL, DEFAULT_SOCKET_OPTIONS);

    const refreshFleet = () => {
      queryClient.invalidateQueries({ queryKey: ['cms-cabs'] });
    };

    socket.on('cabs-updated', refreshFleet);
    socket.on('fleet-updated', refreshFleet);
    socket.on('site-content-updated', (data: any) => {
      if (!data || !data.sectionKey || data.sectionKey === 'cabs') {
        refreshFleet();
      }
    });
    socket.on('new-system-event', (data: any) => {
      if (
        data?.booking?.entityType === 'cab' ||
        data?.message?.toLowerCase().includes('cab') ||
        data?.message?.toLowerCase().includes('fleet') ||
        data?.message?.toLowerCase().includes('vehicle')
      ) {
        refreshFleet();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [queryClient]);

  // Fallback vehicles if database is empty
  const defaultVehicles = [
    {
      id: 'default-sedan',
      name: 'Luxury Sedan (Dzire / Etios)',
      type: 'Premium Sedan',
      capacity: 4,
      pricePerKm: 14,
      basePrice: 1500,
      image: '/images/tourist_sedan.png',
      features: ['Climate Control AC', 'Leather Seating', 'Luggage Boot', 'Local Chauffeur']
    },
    {
      id: 'default-innova',
      name: 'Toyota Innova Crysta Luxury',
      type: 'Luxury VIP SUV',
      capacity: 7,
      pricePerKm: 25,
      basePrice: 3500,
      image: '/images/tourist_innova.png',
      features: ['Plush Captain Chairs', 'Tri-Zone Climate AC', 'Ski Carrier', 'Bottled Water']
    },
    {
      id: 'default-fortuner',
      name: 'Toyota Fortuner 4x4 Elite',
      type: '4x4 Luxury SUV',
      capacity: 7,
      pricePerKm: 35,
      basePrice: 5000,
      image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1200',
      features: ['High-Ground 4WD Low-Range', 'Snow Chain Certified', 'Emergency Oxygen', 'Heated Seats']
    }
  ];

  const vehiclesToDisplay = dbCabs.length > 0 ? dbCabs.map(cab => {
    let fallbackImg = '/images/tourist_innova.png';
    if (cab.name?.toLowerCase().includes('sedan') || cab.name?.toLowerCase().includes('dzire') || cab.name?.toLowerCase().includes('etios')) {
      fallbackImg = '/images/tourist_sedan.png';
    } else if (cab.name?.toLowerCase().includes('ertiga')) {
      fallbackImg = '/images/tourist_ertiga.png';
    } else if (cab.name?.toLowerCase().includes('tempo') || cab.name?.toLowerCase().includes('traveller') || cab.name?.toLowerCase().includes('urbania')) {
      fallbackImg = '/images/tourist_tempo.png';
    }

    const finalImage = (cab.image && typeof cab.image === 'string' && cab.image.trim() !== '')
      ? cab.image.trim()
      : fallbackImg;

    let parsedFeatures: string[] = [];
    if (Array.isArray(cab.features)) {
      parsedFeatures = cab.features;
    } else if (typeof cab.features === 'string') {
      try {
        const parsed = JSON.parse(cab.features);
        if (Array.isArray(parsed)) parsedFeatures = parsed;
      } catch {
        parsedFeatures = [];
      }
    }

    return {
      id: cab.id,
      name: cab.name,
      type: cab.type || 'Chauffeur Class',
      capacity: cab.capacity || 4,
      pricePerKm: cab.pricePerKm || 0,
      basePrice: cab.basePrice || 0,
      image: finalImage,
      features: parsedFeatures.length > 0 ? parsedFeatures : ['Climate Control AC', 'Professional Chauffeur', 'Valley Certified']
    };
  }) : defaultVehicles;

  return (
    <section className="py-20 md:py-32 bg-[#F8F8F9] dark:bg-[#05080a] relative overflow-hidden transition-colors border-t border-slate-200/60 dark:border-white/5">
      {/* Background Ambience */}
      <div className="absolute top-1/2 left-1/4 w-[600px] h-[400px] bg-amber-500/5 blur-[160px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[350px] bg-sky-500/5 blur-[160px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 animate-fade-up">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm mb-6">
              <Car className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#111439] dark:text-white">
                {badgeText}
              </span>
            </div>
            <h2 className="font-display text-3xl sm:text-5xl md:text-6xl font-black text-[#111439] dark:text-white leading-tight tracking-tight">
              {headingText.includes(' ') ? (
                <>
                  {headingText.split(' ').slice(0, -1).join(' ')}{' '}
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-600 via-amber-500 to-amber-300">
                    {headingText.split(' ').slice(-1).join(' ')}
                  </span>
                </>
              ) : (
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-600 via-amber-500 to-amber-300">
                  {headingText}
                </span>
              )}
            </h2>
            <p className="mt-4 text-slate-600 dark:text-white/60 text-sm md:text-base font-medium max-w-xl leading-relaxed">
              {descriptionText}
            </p>
          </div>

          <Button
            onClick={() => navigate('/cabs')}
            variant="outline"
            className="h-13 px-8 rounded-2xl bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border-slate-200 dark:border-white/10 text-[#111439] dark:text-white font-bold text-xs uppercase tracking-widest gap-3 shadow-sm hover:border-amber-400/40 transition-all shrink-0 self-start md:self-end"
          >
            <span>Explore All Fleet</span>
            <ArrowRight className="w-4 h-4 text-amber-500" />
          </Button>
        </div>

        {/* Fleet Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-96 rounded-[2.5rem] bg-white dark:bg-white/5 animate-pulse border border-slate-200 dark:border-white/5" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {vehiclesToDisplay.map((cab) => (
              <div
                key={cab.id}
                onClick={() => navigate(`/cabs?cab=${cab.id}`)}
                className="group relative rounded-[2.5rem] bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-white/5 p-6 sm:p-7 flex flex-col justify-between transition-all duration-500 hover:shadow-2xl hover:shadow-amber-500/5 hover:-translate-y-1.5 hover:border-amber-400/40 cursor-pointer overflow-hidden"
              >
                {/* Backdrop glow */}
                <div className="absolute top-0 right-0 w-44 h-44 bg-amber-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-amber-500/10 transition-colors" />

                <div>
                  {/* Vehicle Image Container */}
                  <div className="relative h-48 sm:h-52 overflow-hidden rounded-2xl border border-slate-200/70 dark:border-white/5 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-center p-3 mb-6">
                    {/* Shadow ellipse */}
                    <div className="absolute bottom-3 w-4/5 h-6 bg-slate-950/20 dark:bg-black/60 blur-[14px] rounded-[100%]" />
                    <img
                      src={cab.image}
                      alt={cab.name}
                      className="relative max-w-full max-h-full object-contain transition-all duration-700 group-hover:scale-105 group-hover:-translate-y-1 drop-shadow-md"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 dark:from-black/70 via-transparent to-transparent pointer-events-none" />

                    <Badge className="absolute top-3.5 right-3.5 bg-slate-950/80 text-white border-none font-bold uppercase text-[9px] tracking-widest px-3 py-1 backdrop-blur-md">
                      {cab.type}
                    </Badge>
                  </div>

                  {/* Vehicle Title & Specs */}
                  <div className="space-y-3">
                    <h3 className="font-display text-2xl font-black text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate">
                      {cab.name}
                    </h3>

                    <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-white/40">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-amber-500" />
                        {cab.capacity} Guests
                      </span>
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                        Chauffeur Driven
                      </span>
                    </div>

                    {/* Features Badges */}
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {cab.features.slice(0, 3).map((feat, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg text-[9px] font-bold bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white/70 border border-slate-200/60 dark:border-white/5 truncate max-w-[200px]"
                        >
                          {feat}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer Pricing & Action */}
                <div className="mt-7 pt-5 border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-4">
                  <div>
                    <span className="block text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-white/40">
                      Transit Tariff
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xl font-black text-slate-900 dark:text-white">
                        ₹{cab.pricePerKm}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 dark:text-white/50">
                        / km
                      </span>
                      {cab.basePrice > 0 && (
                        <span className="text-[10px] font-medium text-slate-400 dark:text-white/30 ml-1">
                          (Base ₹{cab.basePrice})
                        </span>
                      )}
                    </div>
                  </div>

                  <Button
                    size="sm"
                    className="h-10 px-4 rounded-xl bg-slate-900 hover:bg-amber-500 dark:bg-white/10 dark:hover:bg-amber-500 text-white dark:hover:text-black font-bold text-xs gap-2 transition-all shadow-sm"
                  >
                    <span>Reserve</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
