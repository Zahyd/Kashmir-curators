import { Search, SlidersHorizontal, Map, Sparkles, ShieldCheck, Compass } from 'lucide-react';

const steps = [
  {
    icon: Compass,
    title: 'THE DISCOVERY',
    description: 'Traverse our private registry of hidden estates, celestial valleys, and curated portfolios.',
    delay: 0
  },
  {
    icon: SlidersHorizontal,
    title: 'THE CURATION',
    description: 'Collaborate with our chief curators to engineer an itinerary that defies the ordinary.',
    delay: 200
  },
  {
    icon: Map,
    title: 'THE EXPEDITION',
    description: 'Arrive at the destination. Relinquish logistics to us while you inhabit the sublime.',
    delay: 400
  }
];

export default function HowItWorks() {
  return (
    <section className="py-32 bg-[#05080a] relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-kashmir-gold/10 to-transparent -translate-y-1/2" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-24 animate-fade-up">
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-6">
            <ShieldCheck className="w-3.5 h-3.5 text-kashmir-gold" />
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/60">Operational Protocol</span>
          </div>
          <h2 className="font-display text-5xl md:text-7xl font-black text-white tracking-tighter mb-6 uppercase">
            The <span className="text-kashmir-gold">Protocol</span>
          </h2>
          <p className="text-white/40 text-lg max-w-xl mx-auto font-medium leading-relaxed">
            A seamless bridge between ambition and reality, engineered for the discerning traveler.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-24 max-w-6xl mx-auto">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div 
                key={step.title}
                className="relative group animate-fade-up"
                style={{ animationDelay: `${step.delay}ms` }}
              >
                {/* Step Number Background */}
                <div className="absolute -top-12 -left-12 text-[120px] font-black text-white/[0.02] select-none group-hover:text-kashmir-gold/[0.04] transition-colors duration-700">
                  0{index + 1}
                </div>

                <div className="relative z-10">
                  <div className="w-20 h-20 bg-white/[0.02] border border-white/10 rounded-2xl flex items-center justify-center mb-10 group-hover:border-kashmir-gold/40 group-hover:bg-kashmir-gold/5 transition-all duration-700 rotate-3 group-hover:rotate-0 shadow-2xl">
                    <Icon className="w-8 h-8 text-kashmir-gold" />
                  </div>
                  
                  <h4 className="font-display text-2xl font-black text-white mb-4 tracking-tight group-hover:text-kashmir-gold transition-colors duration-500">
                    {step.title}
                  </h4>
                  
                  <p className="text-white/40 leading-relaxed font-medium group-hover:text-white/60 transition-colors duration-500">
                    {step.description}
                  </p>

                  {/* Connector - Desktop Only */}
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-10 -right-20 w-12 h-[1px] bg-white/10 group-hover:bg-kashmir-gold/30 transition-colors duration-500" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
