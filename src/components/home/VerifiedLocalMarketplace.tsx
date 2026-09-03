import { useState, useEffect } from 'react';
import { 
  Compass, Car, Building, Sparkles, ShieldCheck, Star, 
  Phone, Calendar, Users, ArrowRight, CheckCircle2, 
  MapPin, Clock, MessageSquare, Loader2, X, Send, Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/lib/api';

interface Specialist {
  id: string;
  title: string;
  category: 'GUIDE' | 'CAB' | 'HOMESTAY' | 'ACTIVITY' | string;
  location: string;
  description: string;
  basePrice: number;
  priceUnit: string;
  rating: number;
  reviewCount: number;
  image: string;
  features: string[];
  contactPhone: string;
  badge: string;
}

const DEFAULT_SPECIALISTS: Specialist[] = [
  {
    id: 'spec-guide-1',
    title: 'Bashir Ahmad Reshi - Alpine Ski & Backcountry Guide',
    category: 'GUIDE',
    location: 'Gulmarg & Apharwat Peak',
    description: 'J&K Tourism & Mountaineering Institute certified guide with 14 years of backcountry experience. Avalanche Level 2 certified.',
    basePrice: 2800,
    priceUnit: 'day',
    rating: 4.98,
    reviewCount: 64,
    image: 'https://images.unsplash.com/photo-1551524559-8af4e6624178?w=800',
    features: ['Avalanche Safety Beacon', 'English, Hindi & Kashmiri', 'First Aid Certified', 'Backcountry Route Expert'],
    contactPhone: '+91 94190 77812',
    badge: 'J&K Tourism Certified'
  },
  {
    id: 'spec-cab-1',
    title: 'Hilal Ahmad Dar - Toyota Innova Crysta (4x4 Snow Fleet)',
    category: 'CAB',
    location: 'Srinagar, Gulmarg & Pahalgam',
    description: 'Executive Innova Crysta with heavy-duty snow chains, high-altitude heating, dual AC, and all-weather mountain route clearance.',
    basePrice: 4200,
    priceUnit: 'day',
    rating: 4.97,
    reviewCount: 92,
    image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800',
    features: ['Snow Chains Equipped', '7-Seater Luxury Cabin', 'Police Verified Driver', 'Complimentary Water & Mints'],
    contactPhone: '+91 94190 88214',
    badge: 'Snow-Pass Certified'
  },
  {
    id: 'spec-home-1',
    title: 'The Royal Heritage Palace Houseboat',
    category: 'HOMESTAY',
    location: 'Nigeen Lake, Srinagar',
    description: 'Handcrafted fragrant cedar-wood palace houseboat with carved walnut wood interiors, central heating, and private lakefront sundeck.',
    basePrice: 6800,
    priceUnit: 'night',
    rating: 4.96,
    reviewCount: 114,
    image: 'https://images.unsplash.com/photo-1597074866923-dc0589150358?w=800',
    features: ['Private Shikara Crossing', 'Traditional Wazwan Meals', '24/7 Hot Water & Bukhari', 'Sunrise Mountain View'],
    contactPhone: '+91 194 2459812',
    badge: 'Heritage Verified'
  },
  {
    id: 'spec-act-1',
    title: 'Apharwat Peak Heli-Ski & Powder Experience',
    category: 'ACTIVITY',
    location: 'Gulmarg Gondola Phase 2',
    description: 'VIP Phase 2 alpine ski access with private certified instructor, professional powder skis, and high-altitude safety telemetry.',
    basePrice: 4500,
    priceUnit: 'session',
    rating: 4.99,
    reviewCount: 88,
    image: 'https://images.unsplash.com/photo-1565992441121-4367c2967103?w=800',
    features: ['Phase 2 Gondola Fast-Track', 'Salomon Ski Gear Included', 'GoPro 4K Recording', 'Avalanche Rescue Cover'],
    contactPhone: '+91 94190 33412',
    badge: 'High-Altitude Certified'
  },
  {
    id: 'spec-guide-2',
    title: 'Tariq Lone - Great Lakes & High-Altitude Trek Leader',
    category: 'GUIDE',
    location: 'Sonamarg & Tarsar Marsar',
    description: 'Veteran Himalayan mountaineer leading multi-day alpine lake expeditions with high-altitude acclimatization and satellite SOS cover.',
    basePrice: 3200,
    priceUnit: 'day',
    rating: 4.95,
    reviewCount: 48,
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800',
    features: ['Mountaineering Certified', 'Satellite Emergency Link', 'High Pass Route Leader', 'Camp Coordination'],
    contactPhone: '+91 94191 88341',
    badge: 'Expedition Specialist'
  },
  {
    id: 'spec-cab-2',
    title: 'Adil Mir - Toyota Fortuner 4x4 Alpine Chauffeur',
    category: 'CAB',
    location: 'Gulmarg, Sonamarg & Gurez',
    description: 'High-clearance 4WD Fortuner for deep winter snow, unpaved off-road passes, and luxury long-distance transits. High-altitude heating.',
    basePrice: 6500,
    priceUnit: 'day',
    rating: 4.99,
    reviewCount: 71,
    image: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800',
    features: ['4x4 Low-Range Snow Capable', 'Executive Leather Cabin', 'Mountain Pass Clearance', 'Kashmiri Kehwa Onboard'],
    contactPhone: '+91 94192 11982',
    badge: 'Deep Snow Certified'
  }
];

export default function VerifiedLocalMarketplace() {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [specialists, setSpecialists] = useState<Specialist[]>(DEFAULT_SPECIALISTS);
  const [isLoading, setIsLoading] = useState(false);

  // Hire Modal State
  const [hireSpecialist, setHireSpecialist] = useState<Specialist | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingRef, setBookingRef] = useState<string | null>(null);
  const [hireForm, setHireForm] = useState({
    name: '',
    phone: '',
    email: '',
    date: '',
    travelers: '2',
    notes: ''
  });

  // Direct Quote Modal State
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [quoteForm, setQuoteForm] = useState({
    name: '',
    phone: '',
    email: '',
    destination: 'Gulmarg & Srinagar',
    duration: '5 Days',
    travelers: '2',
    budget: 'Luxury',
    services: ['4x4 Chauffeur', 'Tour Guide', 'Houseboat Stay']
  });

  useEffect(() => {
    fetchMarketplaceListings();
  }, []);

  const fetchMarketplaceListings = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE_URL}/vendors/listings`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const mapped: Specialist[] = data.map((item: any) => {
            let parsedImages = [];
            try {
              parsedImages = typeof item.images === 'string' ? JSON.parse(item.images) : item.images;
            } catch (e) {
              parsedImages = [];
            }

            let parsedFeatures = [];
            try {
              parsedFeatures = typeof item.amenitiesOrFeatures === 'string' ? JSON.parse(item.amenitiesOrFeatures) : item.amenitiesOrFeatures;
            } catch (e) {
              parsedFeatures = [];
            }

            return {
              id: item.id,
              title: item.title,
              category: item.category,
              location: item.location,
              description: item.description,
              basePrice: item.basePrice,
              priceUnit: item.category === 'HOMESTAY' || item.category === 'HOTEL' ? 'night' : 'day',
              rating: item.rating || 4.95,
              reviewCount: item.reviewCount || 32,
              image: parsedImages?.[0] || 'https://images.unsplash.com/photo-1597074866923-dc0589150358?w=800',
              features: Array.isArray(parsedFeatures) ? parsedFeatures.slice(0, 4) : ['Verified Kashmir Curator'],
              contactPhone: item.contactPhone || '+91 94190 12345',
              badge: item.category === 'GUIDE' ? 'J&K Certified Guide' : item.category === 'CAB' ? '4x4 Snow Fleet' : 'Verified Heritage'
            };
          });

          // Combine fetched listings with default high-resolution specialists
          const combined = [...mapped, ...DEFAULT_SPECIALISTS.filter(d => !mapped.some(m => m.id === d.id))];
          setSpecialists(combined);
        }
      }
    } catch (err) {
      console.log('Using default verified local curators:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSpecialists = selectedCategory === 'ALL'
    ? specialists
    : specialists.filter(s => s.category === selectedCategory);

  const handleHireSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hireForm.name || !hireForm.phone || !hireSpecialist) {
      toast.error('Please enter your name and phone number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/inquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: hireForm.name,
          phone: hireForm.phone,
          email: hireForm.email || 'guest@kashmircurators.com',
          destination: hireSpecialist.location,
          duration: `${hireForm.travelers} Guests`,
          travelers: hireForm.travelers,
          budget: `₹${hireSpecialist.basePrice} (${hireSpecialist.priceUnit})`,
          accommodation: `${hireSpecialist.category}: ${hireSpecialist.title}`,
          flightDetails: hireForm.date ? `Requested Date: ${hireForm.date}. Notes: ${hireForm.notes}` : hireForm.notes
        })
      });

      const data = await res.json();
      const generatedCode = 'KC-' + Math.random().toString(36).substring(2, 7).toUpperCase();
      setBookingRef(generatedCode);
      toast.success(`Request Dispatched to ${hireSpecialist.title}!`);
    } catch (err: any) {
      toast.error('Failed to submit booking: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteForm.name || !quoteForm.phone) {
      toast.error('Please provide your name and contact phone.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/inquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: quoteForm.name,
          phone: quoteForm.phone,
          email: quoteForm.email || 'quote@kashmircurators.com',
          destination: quoteForm.destination,
          duration: quoteForm.duration,
          travelers: quoteForm.travelers,
          budget: quoteForm.budget,
          accommodation: quoteForm.services.join(', ')
        })
      });

      if (res.ok) {
        toast.success('Bespoke Quote Request Dispatched to Verified Local Operators!');
        setIsQuoteModalOpen(false);
        setQuoteForm({
          name: '',
          phone: '',
          email: '',
          destination: 'Gulmarg & Srinagar',
          duration: '5 Days',
          travelers: '2',
          budget: 'Luxury',
          services: ['4x4 Chauffeur', 'Tour Guide', 'Houseboat Stay']
        });
      }
    } catch (err: any) {
      toast.error('Failed to request quote: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="py-28 bg-[#06090c] relative overflow-hidden border-t border-white/5" id="marketplace">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 text-[10px] font-black uppercase tracking-[0.25em] mb-4">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Direct Tourism Operator Network</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
              HIRE VERIFIED <span className="text-kashmir-gold italic font-medium">LOCAL SPECIALISTS</span>
            </h2>
            <p className="text-white/50 text-sm md:text-base max-w-2xl mt-3 leading-relaxed">
              Skip intermediaries. Connect directly with Department of Tourism certified alpine guides, 4x4 snow chauffeurs, and private heritage houseboats at verified direct rates.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => setIsQuoteModalOpen(true)}
              className="bg-amber-400 hover:bg-amber-300 text-black font-black text-xs uppercase tracking-wider h-12 px-6 rounded-2xl shadow-xl shadow-amber-400/15 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Get Best Local Quote</span>
            </Button>
          </div>
        </div>

        {/* Interactive Category Filter Pills */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-4 mb-12 scrollbar-none">
          {[
            { id: 'ALL', label: 'All Curators', icon: Shield },
            { id: 'GUIDE', label: 'Certified Guides', icon: Compass },
            { id: 'CAB', label: '4x4 Snow Chauffeurs', icon: Car },
            { id: 'HOMESTAY', label: 'Heritage Houseboats & Lodges', icon: Building },
            { id: 'ACTIVITY', label: 'Ski & Alpine Activities', icon: Sparkles },
          ].map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all duration-300 border ${
                  isSelected
                    ? 'bg-amber-400 text-black border-amber-400 shadow-lg shadow-amber-400/20 scale-105'
                    : 'bg-white/[0.02] border-white/5 text-white/60 hover:text-white hover:bg-white/5 hover:border-white/15'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Specialist Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {filteredSpecialists.map((item) => (
            <div 
              key={item.id}
              className="group rounded-[2rem] bg-[#0c1217] border border-white/5 hover:border-amber-400/30 transition-all duration-500 overflow-hidden flex flex-col justify-between shadow-2xl hover:shadow-amber-500/5 hover:-translate-y-1"
            >
              <div>
                {/* Image Container with Badges */}
                <div className="relative h-60 overflow-hidden">
                  <img 
                    src={item.image} 
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0c1217] via-transparent to-black/40" />

                  {/* Top Badges */}
                  <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                    <Badge className="bg-black/60 backdrop-blur-md text-amber-400 border border-amber-400/30 text-[10px] font-mono uppercase tracking-widest px-3 py-1">
                      {item.badge}
                    </Badge>

                    <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-white border border-white/10">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span>{item.rating}</span>
                      <span className="text-white/40 text-[10px]">({item.reviewCount})</span>
                    </div>
                  </div>

                  {/* Location Tag */}
                  <div className="absolute bottom-4 left-4 flex items-center gap-1.5 text-xs text-white/80 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{item.location}</span>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-6">
                  <h3 className="text-lg font-bold text-white mb-2 leading-snug group-hover:text-amber-400 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-white/50 leading-relaxed line-clamp-2 mb-6">
                    {item.description}
                  </p>

                  {/* Verified Features Pills */}
                  <div className="space-y-2 mb-6">
                    {item.features.slice(0, 3).map((feat, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-white/70">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card Footer: Price & Hire CTA */}
              <div className="p-6 bg-white/[0.01] border-t border-white/5 flex items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-black uppercase text-white/40 tracking-widest block">Direct Verified Rate</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-black text-amber-400">₹{item.basePrice.toLocaleString()}</span>
                    <span className="text-xs text-white/40 font-mono">/{item.priceUnit}</span>
                  </div>
                </div>

                <Button
                  onClick={() => {
                    setHireSpecialist(item);
                    setBookingRef(null);
                  }}
                  className="bg-white/10 hover:bg-amber-400 hover:text-black text-white text-xs font-black uppercase tracking-wider rounded-xl h-11 px-5 transition-all duration-300"
                >
                  <span>{item.category === 'GUIDE' ? 'Hire Guide' : item.category === 'CAB' ? 'Book Cab' : 'Reserve Stay'}</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </div>
            </div>
          ))}

          {/* Special Feature Card: Custom Quote Tile */}
          <div className="rounded-[2rem] bg-gradient-to-br from-[#121922] via-[#0c1217] to-black border border-amber-400/20 p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-400/10 rounded-full blur-[80px] pointer-events-none" />

            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-400/10 text-amber-400 flex items-center justify-center mb-6 border border-amber-400/30 shadow-lg shadow-amber-400/10">
                <Sparkles className="w-6 h-6" />
              </div>

              <Badge className="bg-amber-400/10 text-amber-400 border border-amber-400/20 text-[10px] font-mono uppercase tracking-widest mb-3">
                FAST DIRECT BIDDING
              </Badge>

              <h3 className="text-2xl font-black text-white mb-3">
                Need a Full Custom Kashmir Itinerary?
              </h3>

              <p className="text-xs text-white/50 leading-relaxed mb-6">
                Tell us your dates and requirements. Verified local drivers, certified guides, and heritage chalets submit their best direct quotes within 30 minutes.
              </p>

              <div className="space-y-2 text-xs text-white/70 mb-8">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>100% Kashmir Flex Disruption Protection</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Direct WhatsApp dispatch to verified drivers</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Free cancellation up to 48 hours</span>
                </div>
              </div>
            </div>

            <Button
              onClick={() => setIsQuoteModalOpen(true)}
              className="w-full bg-amber-400 hover:bg-amber-300 text-black font-black uppercase tracking-wider text-xs h-12 rounded-xl shadow-lg shadow-amber-400/20"
            >
              Get Instant Multi-Vendor Quote &rarr;
            </Button>
          </div>
        </div>

        {/* Trust Protocol Strip */}
        <div className="p-8 rounded-3xl bg-[#090e13] border border-white/5 grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/10 text-amber-400 flex items-center justify-center shrink-0 border border-amber-400/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Police & Tourism Department Audited</h4>
              <p className="text-xs text-white/40 mt-1">Every chauffeur, guide, and houseboat undergoes mandatory verification.</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Zero Middleman Surcharges</h4>
              <p className="text-xs text-white/40 mt-1">Direct transparent rates negotiated with indigenous operators.</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
              <Phone className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">24/7 On-Ground Emergency SOS</h4>
              <p className="text-xs text-white/40 mt-1">Connected with J&K Police 112, Tourist Police, and SDRF rescue squads.</p>
            </div>
          </div>
        </div>

      </div>

      {/* =================================================== */}
      {/* MODAL 1: HIRE SPECIALIST DIRECTLY */}
      {/* =================================================== */}
      <Dialog open={!!hireSpecialist} onOpenChange={(open) => !open && setHireSpecialist(null)}>
        {hireSpecialist && (
          <DialogContent className="rounded-3xl bg-[#0c1217] text-white border-white/10 p-6 md:p-8 max-w-lg shadow-2xl">
            <DialogHeader className="text-left border-b border-white/5 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-amber-400/10 text-amber-400 border border-amber-400/20 text-[9px] font-mono uppercase tracking-widest">
                  {hireSpecialist.badge}
                </Badge>
              </div>
              <DialogTitle className="text-xl font-bold text-white leading-snug">
                {hireSpecialist.title}
              </DialogTitle>
              <p className="text-xs text-white/40">{hireSpecialist.location} • ₹{hireSpecialist.basePrice.toLocaleString()}/{hireSpecialist.priceUnit}</p>
            </DialogHeader>

            {!bookingRef ? (
              <form onSubmit={handleHireSubmit} className="space-y-4 py-4 text-xs">
                <div>
                  <span className="text-white/60 block mb-1">Full Name *</span>
                  <Input
                    required
                    placeholder="e.g. Rohini Sharma"
                    value={hireForm.name}
                    onChange={(e) => setHireForm({ ...hireForm, name: e.target.value })}
                    className="bg-black/40 border-white/10 rounded-xl h-11 text-white text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-white/60 block mb-1">WhatsApp Mobile *</span>
                    <Input
                      required
                      placeholder="+91 98765 43210"
                      value={hireForm.phone}
                      onChange={(e) => setHireForm({ ...hireForm, phone: e.target.value })}
                      className="bg-black/40 border-white/10 rounded-xl h-11 text-white text-xs"
                    />
                  </div>

                  <div>
                    <span className="text-white/60 block mb-1">Email Address</span>
                    <Input
                      type="email"
                      placeholder="guest@example.com"
                      value={hireForm.email}
                      onChange={(e) => setHireForm({ ...hireForm, email: e.target.value })}
                      className="bg-black/40 border-white/10 rounded-xl h-11 text-white text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-white/60 block mb-1">Service / Start Date *</span>
                    <Input
                      required
                      type="date"
                      value={hireForm.date}
                      onChange={(e) => setHireForm({ ...hireForm, date: e.target.value })}
                      className="bg-black/40 border-white/10 rounded-xl h-11 text-white text-xs"
                    />
                  </div>

                  <div>
                    <span className="text-white/60 block mb-1">Travelers Count</span>
                    <Input
                      type="number"
                      value={hireForm.travelers}
                      onChange={(e) => setHireForm({ ...hireForm, travelers: e.target.value })}
                      className="bg-black/40 border-white/10 rounded-xl h-11 text-white text-xs"
                    />
                  </div>
                </div>

                <div>
                  <span className="text-white/60 block mb-1">Special Requests / Notes</span>
                  <Textarea
                    placeholder="e.g. Need ski equipment fitting in Gulmarg / Srinagar Airport pickup at 11 AM..."
                    value={hireForm.notes}
                    onChange={(e) => setHireForm({ ...hireForm, notes: e.target.value })}
                    className="bg-black/40 border-white/10 rounded-xl text-white text-xs min-h-[70px]"
                  />
                </div>

                <div className="p-3 rounded-2xl bg-amber-400/5 border border-amber-400/20 text-[11px] text-white/60 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Direct booking dispatch. Zero upfront credit card charges required.</span>
                </div>

                <DialogFooter className="pt-2">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-amber-400 hover:bg-amber-300 text-black font-black uppercase tracking-wider text-xs h-11 rounded-xl shadow-lg shadow-amber-400/20"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Connecting to {hireSpecialist.category}...
                      </>
                    ) : (
                      `Confirm Request for ₹${hireSpecialist.basePrice.toLocaleString()}`
                    )}
                  </Button>
                </DialogFooter>
              </form>
            ) : (
              /* Success Screen */
              <div className="py-6 text-center space-y-5">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div>
                  <h4 className="text-xl font-bold text-white">Booking Request Dispatched!</h4>
                  <p className="text-xs text-white/50 mt-1">
                    Your request has been routed directly to <span className="text-amber-400 font-bold">{hireSpecialist.title}</span>.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-black/40 border border-white/10 font-mono text-xs">
                  <span className="text-[10px] text-white/40 uppercase block mb-1">Booking Reference Code</span>
                  <span className="text-lg font-black text-amber-400 tracking-widest">{bookingRef}</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <a
                    href={`https://wa.me/${hireSpecialist.contactPhone.replace(/\D/g, '')}?text=Hello%20${encodeURIComponent(hireSpecialist.title)},%20I%20have%20booked%20via%20Kashmir%20Curators%20[Ref:%20${bookingRef}].%20Please%20confirm%20availability.`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1"
                  >
                    <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs h-11 rounded-xl flex items-center justify-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      <span>Chat on WhatsApp</span>
                    </Button>
                  </a>

                  <a href={`tel:${hireSpecialist.contactPhone}`} className="flex-1">
                    <Button variant="outline" className="w-full border-white/10 hover:border-amber-400 text-white font-bold text-xs h-11 rounded-xl flex items-center justify-center gap-2">
                      <Phone className="w-4 h-4" />
                      <span>Direct Call</span>
                    </Button>
                  </a>
                </div>

                <Button 
                  variant="ghost" 
                  onClick={() => setHireSpecialist(null)}
                  className="text-xs text-white/40 hover:text-white"
                >
                  Close
                </Button>
              </div>
            )}
          </DialogContent>
        )}
      </Dialog>

      {/* =================================================== */}
      {/* MODAL 2: GET BEST LOCAL QUOTE */}
      {/* =================================================== */}
      <Dialog open={isQuoteModalOpen} onOpenChange={setIsQuoteModalOpen}>
        <DialogContent className="rounded-3xl bg-[#0c1217] text-white border-white/10 p-6 md:p-8 max-w-lg shadow-2xl">
          <DialogHeader className="text-left border-b border-white/5 pb-4">
            <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span>Request Instant Bespoke Kashmir Quote</span>
            </DialogTitle>
            <p className="text-xs text-white/40">Verified local operators submit competitive bids directly to your phone.</p>
          </DialogHeader>

          <form onSubmit={handleQuoteSubmit} className="space-y-4 py-4 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-white/60 block mb-1">Your Name *</span>
                <Input
                  required
                  placeholder="e.g. Aarav Kapoor"
                  value={quoteForm.name}
                  onChange={(e) => setQuoteForm({ ...quoteForm, name: e.target.value })}
                  className="bg-black/40 border-white/10 rounded-xl h-11 text-white text-xs"
                />
              </div>

              <div>
                <span className="text-white/60 block mb-1">WhatsApp Phone *</span>
                <Input
                  required
                  placeholder="+91 98765 43210"
                  value={quoteForm.phone}
                  onChange={(e) => setQuoteForm({ ...quoteForm, phone: e.target.value })}
                  className="bg-black/40 border-white/10 rounded-xl h-11 text-white text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-white/60 block mb-1">Target Destinations</span>
                <Input
                  value={quoteForm.destination}
                  onChange={(e) => setQuoteForm({ ...quoteForm, destination: e.target.value })}
                  className="bg-black/40 border-white/10 rounded-xl h-11 text-white text-xs"
                />
              </div>

              <div>
                <span className="text-white/60 block mb-1">Trip Duration</span>
                <Input
                  value={quoteForm.duration}
                  onChange={(e) => setQuoteForm({ ...quoteForm, duration: e.target.value })}
                  className="bg-black/40 border-white/10 rounded-xl h-11 text-white text-xs"
                />
              </div>
            </div>

            <div>
              <span className="text-white/60 block mb-2">Services You Need (Select all that apply)</span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  '4x4 Chauffeur & Snow SUV',
                  'Certified Ski & Trek Guide',
                  'Heritage Dal Lake Houseboat',
                  'Gondola Phase 2 Passes',
                  'Traditional Wazwan Dining',
                  'Private Shikara Rides'
                ].map((srv) => {
                  const isChecked = quoteForm.services.includes(srv);
                  return (
                    <button
                      type="button"
                      key={srv}
                      onClick={() => {
                        if (isChecked) {
                          setQuoteForm({ ...quoteForm, services: quoteForm.services.filter(s => s !== srv) });
                        } else {
                          setQuoteForm({ ...quoteForm, services: [...quoteForm.services, srv] });
                        }
                      }}
                      className={`p-2.5 rounded-xl border text-left text-[11px] font-bold transition flex items-center justify-between ${
                        isChecked 
                          ? 'bg-amber-400/10 border-amber-400 text-amber-400' 
                          : 'bg-white/[0.02] border-white/5 text-white/60 hover:text-white'
                      }`}
                    >
                      <span className="truncate">{srv}</span>
                      {isChecked && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 text-[11px] text-white/50">
              Quotes delivered via WhatsApp / SMS within 30 minutes with transparent pricing breakdown.
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-amber-400 hover:bg-amber-300 text-black font-black uppercase tracking-wider text-xs h-11 rounded-xl shadow-lg shadow-amber-400/20"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Dispatch Quote Request to Operators'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </section>
  );
}
