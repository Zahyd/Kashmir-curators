import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, MapPin } from 'lucide-react';
import srinagarImg from '@/assets/kashmir-hero-new.jpg';
import gulmargImg from '@/assets/gulmarg.jpg';
import pahalgamImg from '@/assets/pahalgam.jpg';

const destinations = [
  {
    name: 'Srinagar',
    image: srinagarImg,
    tagline: 'The City of Eternal Lakes',
    desc: 'Venice of the East, where luxury floats on silent waters.',
    colSpan: 'col-span-1 md:col-span-2',
    rowSpan: 'row-span-1 md:row-span-2'
  },
  {
    name: 'Gulmarg',
    image: gulmargImg,
    tagline: 'The Alpine Sanctuary',
    desc: 'World-class peaks and pristine winter elegance.',
    colSpan: 'col-span-1 md:col-span-2',
    rowSpan: 'row-span-1'
  },
  {
    name: 'Pahalgam',
    image: pahalgamImg,
    tagline: 'The Valley of Quietude',
    desc: 'Serene riverbanks and ancient pine-scented air.',
    colSpan: 'col-span-1 md:col-span-1',
    rowSpan: 'row-span-1'
  },
  {
    name: 'Sonmarg',
    image: 'https://images.unsplash.com/photo-1595932594611-6beec02f61aa?w=800',
    tagline: 'The Meadow of Gold',
    desc: 'Where glaciers meet the sky in a golden embrace.',
    colSpan: 'col-span-1 md:col-span-1',
    rowSpan: 'row-span-1'
  }
];

export default function DestinationsGrid() {
  return (
    <section className="py-32 bg-[#05080a] relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-kashmir-gold/5 blur-[120px] -mr-64 -mt-64" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] -ml-64 -mb-64" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-20 animate-fade-up">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-6">
              <Sparkles className="w-3.5 h-3.5 text-kashmir-gold" />
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/60">Curated Geography</span>
            </div>
            <h2 className="font-display text-5xl md:text-7xl font-black text-white leading-tight tracking-tighter">
              SIGNATURE <br />
              <span className="text-kashmir-gold">LOCATIONS</span>
            </h2>
          </div>
          <p className="text-white/40 text-lg max-w-sm font-medium leading-relaxed">
            Beyond the maps, discover the hidden soul of the valley through our handpicked premier destinations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-6 h-auto md:h-[800px]">
          {destinations.map((dest, index) => (
            <Link
              key={dest.name}
              to={`/packages?destination=${dest.name}`}
              className={`group relative overflow-hidden rounded-[2.5rem] border border-white/5 bg-[#0a0f12] ${dest.colSpan} ${dest.rowSpan} animate-fade-up transition-all duration-700 hover:border-kashmir-gold/30 hover:shadow-2xl hover:shadow-kashmir-gold/5`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Image with Parallax Effect */}
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-110"
                style={{ backgroundImage: `url(${dest.image})` }}
              />
              {/* Overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#05080a] via-black/20 to-transparent opacity-80 transition-opacity duration-700 group-hover:opacity-90" />
              
              {/* Content */}
              <div className="absolute inset-0 p-8 md:p-10 flex flex-col justify-end">
                <div className="translate-y-6 group-hover:translate-y-0 transition-transform duration-500">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-3.5 h-3.5 text-kashmir-gold" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-kashmir-gold">{dest.tagline}</span>
                  </div>
                  <h4 className="font-display text-3xl md:text-4xl font-black text-white mb-4">
                    {dest.name}
                  </h4>
                  <p className="text-white/40 text-sm font-medium mb-8 max-w-xs opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                    {dest.desc}
                  </p>
                  
                  <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-white/60 group-hover:text-white transition-colors duration-300">
                    <span>Explore Collection</span>
                    <div className="w-8 h-[1px] bg-white/20 group-hover:w-12 group-hover:bg-kashmir-gold transition-all duration-500" />
                    <ArrowRight className="w-4 h-4 text-kashmir-gold opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-500" />
                  </div>
                </div>
              </div>

              {/* Top Glass Badge */}
              <div className="absolute top-6 right-6 px-4 py-2 rounded-xl glass-card opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[8px] font-black uppercase tracking-widest text-white/80 italic">Verified Estate</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
