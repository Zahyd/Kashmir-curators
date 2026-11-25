import { Compass, ShieldCheck, HeartHandshake, Sparkles, Crown, Zap, Globe, Shield, Lock, Award } from 'lucide-react';
import { useLandingPageContent } from '@/hooks/useLandingPageContent';

const ICON_MAP: Record<string, any> = {
  Globe,
  Crown,
  Zap,
  Shield,
  Compass,
  ShieldCheck,
  HeartHandshake,
  Sparkles,
};

const TRUST_SIGNALS = [
  { label: 'Department of Tourism', value: 'J&K Govt. Registered', icon: Award },
  { label: 'Safety & Police Liaison', value: 'Verified 4x4 Chauffeurs', icon: ShieldCheck },
  { label: 'Payment Architecture', value: 'Razorpay & Stripe Escrow', icon: Lock },
  { label: 'Disruption Coverage', value: '100% Kashmir Flex Shield', icon: Sparkles },
];

export default function AuthenticityFeatures() {
  const { authenticity } = useLandingPageContent();

  const badgeText = authenticity?.badgeText || 'The Curators Standard';
  const title = authenticity?.title || 'IMPECCABLE CRAFTSMANSHIP';
  const subtitle =
    authenticity?.subtitle ||
    "We don't just plan travel; we engineer operating certainty across the Himalayas. Every stay, chauffeur, and mountain pass is audited for luxury, privacy, and resilience.";
  const features = authenticity?.features || [];

  return (
    <section className="py-16 md:py-28 bg-[#F8F8F9] dark:bg-[#05080a] relative overflow-hidden transition-colors border-t border-slate-200/60 dark:border-white/5">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-b from-amber-400/5 via-transparent to-transparent opacity-40 pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 relative z-10 max-w-7xl">
        <div className="flex flex-col items-center text-center mb-16 animate-fade-up">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm mb-6">
            <Crown className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#111439] dark:text-white">
              {badgeText}
            </span>
          </div>
          <h3 className="font-display text-3xl sm:text-5xl md:text-6xl font-black text-[#111439] dark:text-white mb-5 tracking-tight">
            {title.includes(' ') ? (
              <>
                {title.split(' ').slice(0, -1).join(' ')}{' '}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-600 via-amber-500 to-cyan-600 dark:from-amber-400 dark:via-yellow-200 dark:to-emerald-400">
                  {title.split(' ').slice(-1)[0]}
                </span>
              </>
            ) : (
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-600 via-amber-500 to-cyan-600">
                {title}
              </span>
            )}
          </h3>
          <p className="text-[#4A5568] dark:text-white/60 max-w-2xl mx-auto text-sm sm:text-lg font-medium leading-relaxed">
            {subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {features.map((feature: any, index: number) => {
            const Icon = ICON_MAP[feature.icon] || Globe;
            return (
              <div
                key={feature.title}
                className="group relative p-7 sm:p-8 rounded-[2rem] bg-white dark:bg-[#0a0f14] border border-slate-200/90 dark:border-white/10 hover:border-amber-400/50 hover:shadow-2xl hover:shadow-slate-900/5 transition-all duration-500 animate-fade-up overflow-hidden shadow-md shadow-slate-900/5"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-amber-400/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center group-hover:bg-[#111439] dark:group-hover:bg-amber-400 transition-all duration-500">
                      <Icon className="w-7 h-7 text-[#111439] dark:text-white group-hover:text-amber-400 dark:group-hover:text-black transition-colors duration-500" />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-white/45 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors duration-500">
                      {feature.badge}
                    </span>
                  </div>

                  <h4 className="font-display text-xl sm:text-2xl font-black text-[#111439] dark:text-white mb-3 group-hover:translate-x-1 transition-transform duration-300">
                    {feature.title}
                  </h4>
                  <p className="text-[#4A5568] dark:text-white/60 text-xs sm:text-sm font-medium leading-relaxed">
                    {feature.description}
                  </p>

                  <div className="mt-7 pt-5 border-t border-slate-100 dark:border-white/10">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[9px] font-mono font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                        Protocol Verified
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Institutional Trust Signals Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {TRUST_SIGNALS.map((signal) => {
            const Icon = signal.icon;
            return (
              <div
                key={signal.label}
                className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0a0f14] border border-slate-200/80 dark:border-white/10 flex items-center gap-3.5 shadow-sm"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="block text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-white/45 truncate">
                    {signal.label}
                  </span>
                  <span className="block text-xs sm:text-sm font-bold text-[#111439] dark:text-white truncate">
                    {signal.value}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
