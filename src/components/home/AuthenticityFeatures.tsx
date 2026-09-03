import { Compass, ShieldCheck, HeartHandshake, Sparkles, Crown, Zap, Globe, Shield } from 'lucide-react';

const features = [
  {
    icon: Globe,
    title: 'Native Guardians',
    description: 'Our curators are local descendants, offering access to hidden estates and untold ancestral stories.',
    badge: 'Elite Access'
  },
  {
    icon: Crown,
    title: 'Bespoke Luxury',
    description: 'From private heritage houseboats to hidden alpine villas, we define the peak of Kashmiri elegance.',
    badge: 'Signature'
  },
  {
    icon: Zap,
    title: 'Instant Protocol',
    description: 'A 24/7 dedicated concierge at your command, ensuring every whim is met with absolute precision.',
    badge: 'Priority'
  },
  {
    icon: Shield,
    title: 'Verified Legacy',
    description: 'Every interaction and estate is rigorously audited for security, privacy, and impeccable quality.',
    badge: 'Audited'
  }
];

export default function AuthenticityFeatures() {
  return (
    <section className="py-32 bg-[#F8F8F9] relative overflow-hidden border-t border-slate-200">
      {/* Dynamic Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-b from-amber-400/5 via-transparent to-transparent opacity-30 pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col items-center text-center mb-24 animate-fade-up">
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm mb-8">
            <Crown className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#111439]">The Curators Standard</span>
          </div>
          <h3 className="font-display text-5xl md:text-7xl font-black text-[#111439] mb-6 tracking-tight">
            IMPECCABLE <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-600 via-purple-600 to-cyan-600">CRAFTSMANSHIP</span>
          </h3>
          <p className="text-[#4A5568] max-w-2xl mx-auto text-lg font-medium leading-relaxed">
            We don't just plan travel; we engineer memories. Every detail is a deliberate act of luxury, designed for the world's most discerning travelers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div 
                key={feature.title}
                className="group relative p-10 rounded-[2.5rem] bg-white border border-slate-200/90 hover:border-slate-300 hover:shadow-2xl hover:shadow-slate-900/5 transition-all duration-700 animate-fade-up overflow-hidden shadow-md shadow-slate-900/5"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                {/* Hover Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-400/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-10">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-slate-50 border border-slate-200 flex items-center justify-center group-hover:bg-[#111439] transition-all duration-500">
                      <Icon className="w-8 h-8 text-[#111439] group-hover:text-amber-400 transition-colors duration-500" />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 group-hover:text-[#111439] transition-colors duration-500">
                      {feature.badge}
                    </span>
                  </div>

                  <h4 className="font-display text-2xl font-black text-[#111439] mb-4 group-hover:translate-x-2 transition-transform duration-500">
                    {feature.title}
                  </h4>
                  <p className="text-[#4A5568] text-sm font-medium leading-relaxed">
                    {feature.description}
                  </p>

                  <div className="mt-10 pt-10 border-t border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
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
