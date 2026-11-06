import { Compass, ShieldCheck, HeartHandshake, Sparkles, Crown, Zap, Globe, Shield } from 'lucide-react';
import { useLandingPageContent } from '@/hooks/useLandingPageContent';

const ICON_MAP: Record<string, any> = {
  Globe,
  Crown,
  Zap,
  Shield,
  Compass,
  ShieldCheck,
  HeartHandshake,
  Sparkles
};

export default function AuthenticityFeatures() {
  const { authenticity } = useLandingPageContent();

  const badgeText = authenticity?.badgeText || 'The Curators Standard';
  const title = authenticity?.title || 'IMPECCABLE CRAFTSMANSHIP';
  const subtitle = authenticity?.subtitle || "We don't just plan travel; we engineer memories. Every detail is a deliberate act of luxury, designed for the world's most discerning travelers.";
  const features = authenticity?.features || [];

  return (
    <section className="py-32 bg-[#F8F8F9] dark:bg-[#05080a] relative overflow-hidden transition-colors">
      {/* Dynamic Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-b from-amber-400/5 via-transparent to-transparent opacity-30 pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col items-center text-center mb-24 animate-fade-up">
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm mb-8">
            <Crown className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#111439] dark:text-white">{badgeText}</span>
          </div>
          <h3 className="font-display text-5xl md:text-7xl font-black text-[#111439] dark:text-white mb-6 tracking-tight">
            {title.includes(' ') ? (
              <>
                {title.split(' ').slice(0, -1).join(' ')}{' '}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-600 via-purple-600 to-cyan-600">
                  {title.split(' ').slice(-1)[0]}
                </span>
              </>
            ) : (
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-600 via-purple-600 to-cyan-600">
                {title}
              </span>
            )}
          </h3>
          <p className="text-[#4A5568] dark:text-white/60 max-w-2xl mx-auto text-lg font-medium leading-relaxed">
            {subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature: any, index: number) => {
            const Icon = ICON_MAP[feature.icon] || Globe;
            return (
              <div 
                key={feature.title}
                className="group relative p-10 rounded-[2.5rem] bg-white dark:bg-[#0a0f12] border border-slate-200/90 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 hover:shadow-2xl hover:shadow-slate-900/5 transition-all duration-700 animate-fade-up overflow-hidden shadow-md shadow-slate-900/5"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                {/* Hover Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-400/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-10">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center group-hover:bg-[#111439] dark:group-hover:bg-amber-400 transition-all duration-500">
                      <Icon className="w-8 h-8 text-[#111439] dark:text-white group-hover:text-amber-400 dark:group-hover:text-black transition-colors duration-500" />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40 group-hover:text-[#111439] dark:group-hover:text-white transition-colors duration-500">
                      {feature.badge}
                    </span>
                  </div>

                  <h4 className="font-display text-2xl font-black text-[#111439] dark:text-white mb-4 group-hover:translate-x-2 transition-transform duration-500">
                    {feature.title}
                  </h4>
                  <p className="text-[#4A5568] dark:text-white/60 text-sm font-medium leading-relaxed">
                    {feature.description}
                  </p>

                  <div className="mt-10 pt-10 border-t border-slate-100 dark:border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-amber-600">Protocol Active</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
