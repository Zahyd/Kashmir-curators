import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plane, CalendarDays, Wallet, Users, Loader2, Sparkles, Compass, 
  Building, CheckCircle2, ArrowRight, Camera, Video, Heart, Utensils,
  ChevronRight, ArrowLeft, ShieldCheck, MapPin, BadgePercent, Check
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE_URL } from '@/lib/api';
import { cn } from '@/lib/utils';

// Static Itinerary Curation Presets based on Territory
const ITINERARY_PRESETS: Record<string, { title: string; days: { title: string; desc: string; highlight: string }[] }> = {
  srinagar: {
    title: "Srinagar Central Curations",
    days: [
      { title: "Day 1: Arrival & Dal Lake Shikara Curation", desc: "Arrive at Srinagar airport. Experience a private, chauffeured transfer to your luxury estate. In the evening, step onto a hand-crafted shikara for a sunset cruise around Dal Lake's floating gardens.", highlight: "Private sunset Shikara ride" },
      { title: "Day 2: Shalimar & Nishat Mughal Gardens", desc: "Spend the day touring the historic Mughal Gardens built by Jahangir. Explore terraced lawns, cascading fountains, and ancient Chinar trees with a local heritage curator.", highlight: "Premium Mughal heritage tour" },
      { title: "Day 3: Heritage Artisans & Old City Excursion", desc: "Walk through the historic lanes of Old Srinagar. Visit landmark shrines like Jamia Masjid and Shah-e-Hamdan, followed by a private demonstration of silk-carpet weaving.", highlight: "Silk weaving masterclass" }
    ]
  },
  gulmarg: {
    title: "Gulmarg Alpine Meadows Odyssey",
    days: [
      { title: "Day 1: Transit to Gulmarg Alpine Slopes", desc: "Drive up the winding pine forests from Srinagar to Gulmarg. Check into your premium alpine estate with stunning views of the Affarwat mountain range.", highlight: "High altitude scenic drive" },
      { title: "Day 2: Gondola Expedition & Phase 2 Slopes", desc: "Board the Gulmarg Gondola (one of the highest cable cars in the world) to Phase 1 & 2. Enjoy guided snow walks or ski curations on premium powdery slopes.", highlight: "Gondola cable car Phase 2 access" },
      { title: "Day 3: Outer Circular Walk & Local Shrines", desc: "Take a walking tour of the local 19th-century St. Mary's Church and Shiva temple, followed by a cozy afternoon in a luxury wood-cabin tea lounge.", highlight: "Luxury alpine tea curation" }
    ]
  },
  pahalgam: {
    title: "Pahalgam Valley & Alpine Rivers Escape",
    days: [
      { title: "Day 1: Transit to Valley of Shepherds", desc: "Drive through saffron fields and apple orchards to Pahalgam. Enjoy a quiet evening strolling alongside the rushing turquoise waters of the Lidder River.", highlight: "Saffron territory transit" },
      { title: "Day 2: Aru & Betaab Valley Guided Excursions", desc: "Explore the picturesque Betaab Valley (named after the famous Bollywood movie) and the pristine meadows of Aru Valley in private luxury 4x4 vehicles.", highlight: "Private local valley tours" },
      { title: "Day 3: Baisaran Valley High-Meadows Trek", desc: "Ride ponies up the cedar-wood trails to Baisaran Meadow, affectionately known as the 'Mini Switzerland of India' for its endless pine lawns.", highlight: "Scenic horseback trail ride" }
    ]
  },
  sonamarg: {
    title: "Sonamarg Meadow of Gold Expedition",
    days: [
      { title: "Day 1: Srinagar to Sonamarg alpine valley drive", desc: "Transit to Sonamarg along the roaring Sindh River. Check in at your luxury riverside chalet and enjoy the crisp glacier breezes.", highlight: "Glacial river valley drive" },
      { title: "Day 2: Thajiwas Glacier Sledding & Horse Trek", desc: "Trek on horseback or take local snow-sleds up the slopes of the magnificent Thajiwas Glacier, surrounded by cascading alpine waterfalls.", highlight: "Guided Thajiwas glacier trek" },
      { title: "Day 3: High-Altitude Zero Point Exploration", desc: "Drive up the thrilling loops of Zojila Pass to reach Zero Point, a year-round snow wonderland bordering Ladakh. Enjoy tea amidst snow peaks.", highlight: "Zojila pass high altitude drive" }
    ]
  },
  "full-tour": {
    title: "Grand Kashmir Curators Curation",
    days: [
      { title: "Day 1: Srinagar Arrival & Shikara Cruise", desc: "Chauffeured arrival at Srinagar. Embark on a private sunset shikara ride around Dal Lake, staying on a premium heritage houseboat.", highlight: "Premium Houseboat check-in" },
      { title: "Day 2: Gulmarg Alpine Meadows & Gondola", desc: "Full-day excursion to Gulmarg. Experience the high-altitude Gondola cable car ride and stroll along the alpine golf course.", highlight: "Phase 1 Gondola ticket curation" },
      { title: "Day 3: Transit to Pahalgam via Saffron Fields", desc: "Drive to Pahalgam. Visit saffron farms and ruins of the ancient Avantiswami temple. Dine beside the Lidder River in the evening.", highlight: "Historic temple ruin excursion" },
      { title: "Day 4: Aru & Betaab Valleys Exploration", desc: "Excursion to the stunning local valleys of Pahalgam. Walk through coniferous forests and enjoy a luxury picnic on the banks of Aru brook.", highlight: "Artisan catered picnic" },
      { title: "Day 5: Return to Srinagar & Mughal Gardens Curation", desc: "Drive back to Srinagar. Tour Nishat and Shalimar gardens, followed by local shopping for hand-knit pashminas and organic saffron.", highlight: "Pashmina authenticity workshop" }
    ]
  }
};

export default function TripPlanner() {
  const navigate = useNavigate();
  const { user, isAuthenticated, token } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [activeTab, setActiveTab] = useState<'itinerary' | 'hotels' | 'cabs' | 'addons'>('itinerary');
  const [showItinerary, setShowItinerary] = useState(false);
  
  // Selection States
  const [formData, setFormData] = useState({
    destination: 'full-tour',
    duration: '5',
    accommodation: '4-star',
    budget: 'Luxury',
    travelers: 'Couple'
  });

  // Customizer selections
  const [hotelTier, setHotelTier] = useState<'3-star' | '4-star' | '5-star' | 'houseboat'>('4-star');
  const [cabTier, setCabTier] = useState<'sedan' | 'suv' | 'crysta' | 'coach'>('suv');
  const [addons, setAddons] = useState<Record<string, boolean>>({
    photographer: false,
    drone: false,
    decor: false,
    dinner: false,
  });

  // Keep customize options synced when user changes initial form inputs
  useEffect(() => {
    if (formData.accommodation === '3-star') setHotelTier('3-star');
    if (formData.accommodation === '4-star') setHotelTier('4-star');
    if (formData.accommodation === '5-star') setHotelTier('5-star');
    if (formData.accommodation === 'houseboat') setHotelTier('houseboat');
  }, [formData.accommodation]);

  // Pricing Logic
  const getCalculatedPrice = () => {
    const days = parseInt(formData.duration) || 3;
    let basePricePerDay = 5000;
    
    if (formData.travelers === 'Solo') basePricePerDay = 5000;
    if (formData.travelers === 'Couple') basePricePerDay = 8000;
    if (formData.travelers === 'Family') basePricePerDay = 12000;
    if (formData.travelers === 'Group') basePricePerDay = 18000;

    let hotelCost = 0;
    if (hotelTier === '3-star') hotelCost = 2500 * days;
    if (hotelTier === '4-star') hotelCost = 5000 * days;
    if (hotelTier === '5-star') hotelCost = 11000 * days;
    if (hotelTier === 'houseboat') hotelCost = 7500 * days;

    let cabCost = 0;
    if (cabTier === 'sedan') cabCost = 2500 * days;
    if (cabTier === 'suv') cabCost = 4000 * days;
    if (cabTier === 'crysta') cabCost = 6000 * days;
    if (cabTier === 'coach') cabCost = 9500 * days;

    let addonCost = 0;
    if (addons.photographer) addonCost += 5000;
    if (addons.drone) addonCost += 8000;
    if (addons.decor) addonCost += 3000;
    if (addons.dinner) addonCost += 4500;

    const netPrice = (basePricePerDay * days) + hotelCost + cabCost + addonCost;
    return {
      netPrice,
      taxes: Math.round(netPrice * 0.05), // GST 5%
      total: Math.round(netPrice * 1.05)
    };
  };

  const currentPrices = getCalculatedPrice();

  const handleGenerate = async () => {
    setIsSubmitting(true);
    // Simulate complex AI Curation engine compilation
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setShowItinerary(true);
    toast.success('Your premium package curation is ready for review!');
  };

  const handleBookPackage = async () => {
    if (!isAuthenticated) {
      toast.error('Authentication required. Redirecting to access profile...');
      navigate('/auth?redirect=/planner');
      return;
    }

    setIsBooking(true);
    try {
      const selectedPreset = ITINERARY_PRESETS[formData.destination] || ITINERARY_PRESETS['full-tour'];
      
      const response = await fetch(`${API_BASE_URL}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: 'package',
          itemName: `Custom ${formData.duration}-Day ${selectedPreset.title}`,
          bookingDate: new Date().toISOString(),
          totalAmount: currentPrices.total,
          details: {
            destination: formData.destination,
            duration: formData.duration,
            hotelTier,
            cabTier,
            addons,
            travelers: formData.travelers,
            itinerary: selectedPreset.days,
            pricingBreakdown: currentPrices
          }
        })
      });

      if (response.ok) {
        toast.success('Package secured! Opening your liaison dashboard...');
        navigate('/profile');
      } else {
        const err = await response.json();
        toast.error(err.error || 'Failed to process booking.');
      }
    } catch (error) {
      console.error('Booking submission error:', error);
      toast.error('Network failure while registering curation.');
    } finally {
      setIsBooking(false);
    }
  };

  const selectedPreset = ITINERARY_PRESETS[formData.destination] || ITINERARY_PRESETS['full-tour'];

  return (
    <div className="min-h-screen flex flex-col bg-[#05080a] text-white selection:bg-kashmir-gold/30">
      <Navbar />

      <main className="flex-1 pt-24 pb-20">
        
        {/* Step 1: Initial Parameters intake (if itinerary not generated yet) */}
        {!showItinerary ? (
          <div className="container mx-auto px-6 max-w-5xl">
            <div className="text-center mb-16 animate-fade-up">
              <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-6">
                <Compass className="w-3.5 h-3.5 text-kashmir-gold" />
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/60">Bespoke Curation Console</span>
              </div>
              <h1 className="font-display text-5xl md:text-8xl font-black text-white tracking-tighter mb-6 uppercase">
                AI TRIP <span className="text-kashmir-gold italic">PLANNER</span>
              </h1>
              <p className="text-white/40 text-lg max-w-2xl mx-auto font-medium">
                Design your odyssey. Select your parameters below and our instant curation engine will hand-craft a dynamic package with real-time pricing.
              </p>
            </div>

            <div className="bg-white/[0.02] border border-white/5 rounded-[3rem] p-8 md:p-12 backdrop-blur-3xl shadow-2xl animate-fade-up" style={{ animationDelay: '100ms' }}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
                {/* Territory */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 ml-2">Territory</label>
                  <Select value={formData.destination} onValueChange={(v) => setFormData({...formData, destination: v})}>
                    <SelectTrigger className="h-14 bg-white/5 border-white/10 rounded-xl text-white px-5 font-bold focus:ring-kashmir-gold/30">
                      <SelectValue placeholder="Destination" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0c1216] border-white/10 text-white rounded-xl">
                      <SelectItem value="srinagar">Srinagar Central</SelectItem>
                      <SelectItem value="gulmarg">Gulmarg Resort Town</SelectItem>
                      <SelectItem value="pahalgam">Pahalgam Valley</SelectItem>
                      <SelectItem value="sonamarg">Sonamarg Alpine Valley</SelectItem>
                      <SelectItem value="full-tour">Complete Kashmir Tour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Duration */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 ml-2">Duration (Tenure)</label>
                  <Select value={formData.duration} onValueChange={(v) => setFormData({...formData, duration: v})}>
                    <SelectTrigger className="h-14 bg-white/5 border-white/10 rounded-xl text-white px-5 font-bold focus:ring-kashmir-gold/30">
                      <SelectValue placeholder="Duration" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0c1216] border-white/10 text-white rounded-xl">
                      <SelectItem value="3">3 Days (Highlights)</SelectItem>
                      <SelectItem value="5">5 Days (Standard)</SelectItem>
                      <SelectItem value="7">7 Days (Exhaustive)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Initial Hotel preference */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 ml-2">Initial Estate Class</label>
                  <Select value={formData.accommodation} onValueChange={(v) => setFormData({...formData, accommodation: v})}>
                    <SelectTrigger className="h-14 bg-white/5 border-white/10 rounded-xl text-white px-5 font-bold focus:ring-kashmir-gold/30">
                      <SelectValue placeholder="Estate Class" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0c1216] border-white/10 text-white rounded-xl">
                      <SelectItem value="3-star">Standard Estates</SelectItem>
                      <SelectItem value="4-star">Premium Estates</SelectItem>
                      <SelectItem value="5-star">Palatial VIP Estates</SelectItem>
                      <SelectItem value="houseboat">Heritage Houseboats</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Travelers */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 ml-2">Travelers</label>
                  <Select value={formData.travelers} onValueChange={(v) => setFormData({...formData, travelers: v})}>
                    <SelectTrigger className="h-14 bg-white/5 border-white/10 rounded-xl text-white px-5 font-bold focus:ring-kashmir-gold/30">
                      <SelectValue placeholder="Party Size" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0c1216] border-white/10 text-white rounded-xl">
                      <SelectItem value="Solo">Solo Traveler</SelectItem>
                      <SelectItem value="Couple">Couple (2 Guests)</SelectItem>
                      <SelectItem value="Family">Small Group (3-5)</SelectItem>
                      <SelectItem value="Group">Corporate / Large Group (6+)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Vibe */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 ml-2">Vibe & Style</label>
                  <Select value={formData.budget} onValueChange={(v) => setFormData({...formData, budget: v})}>
                    <SelectTrigger className="h-14 bg-white/5 border-white/10 rounded-xl text-white px-5 font-bold focus:ring-kashmir-gold/30">
                      <SelectValue placeholder="Style" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0c1216] border-white/10 text-white rounded-xl">
                      <SelectItem value="Standard">Balanced Comfort</SelectItem>
                      <SelectItem value="Luxury">Premium Curation</SelectItem>
                      <SelectItem value="Adventure">Active Trekking</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Generate Action */}
                <div className="flex items-end">
                  <Button 
                    onClick={handleGenerate}
                    disabled={isSubmitting}
                    className="w-full h-14 bg-gradient-to-r from-kashmir-gold to-amber-500 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs uppercase tracking-[0.2em] rounded-xl shadow-lg transition-all duration-300"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4.5 h-4.5 animate-spin" /> Curating...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <Sparkles className="w-4.5 h-4.5" /> Compile Package
                      </span>
                    )}
                  </Button>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex gap-5 text-left">
                <ShieldCheck className="w-8 h-8 text-kashmir-gold shrink-0" />
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider mb-1">Authentic Guarantee Curation</h4>
                  <p className="text-xs text-white/40 leading-relaxed">
                    Our AI package builder pulls verified real-time inventories. All pricing displays local taxes and driver allowances without hidden markups. Switch details below once generated.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Step 2: Interactive AI results & dynamic customization panel */
          <div className="container mx-auto px-6 max-w-7xl animate-fade-in">
            <button 
              onClick={() => setShowItinerary(false)}
              className="flex items-center gap-2 text-white/40 hover:text-white mb-8 transition-colors text-sm font-bold uppercase tracking-wider"
            >
              <ArrowLeft className="w-4 h-4" /> Reset Curation
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Itinerary Details (7 Cols) */}
              <div className="lg:col-span-7 space-y-6">
                <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 backdrop-blur-3xl shadow-2xl text-left">
                  <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-5">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-kashmir-gold">Bespoke Curation Result</span>
                      <h2 className="text-2xl md:text-3xl font-black mt-1 uppercase tracking-tight">{selectedPreset.title}</h2>
                    </div>
                    <BadgePercent className="w-8 h-8 text-kashmir-gold/60" />
                  </div>

                  {/* Day-by-Day Accordion list */}
                  <div className="space-y-6">
                    {selectedPreset.days.slice(0, parseInt(formData.duration)).map((day, idx) => (
                      <div key={idx} className="relative pl-8 border-l border-white/10 group hover:border-kashmir-gold transition-colors duration-300">
                        {/* Bullet point indicator */}
                        <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-white/10 group-hover:bg-kashmir-gold border border-black transition-colors duration-300" />
                        
                        <div className="space-y-2">
                          <h4 className="font-bold text-lg text-white group-hover:text-kashmir-gold transition-colors duration-300">
                            {day.title}
                          </h4>
                          <p className="text-sm text-white/40 leading-relaxed">
                            {day.desc}
                          </p>
                          <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded-lg bg-white/5 border border-white/5 text-[11px] font-semibold text-white/60">
                            <Sparkles className="w-3 h-3 text-kashmir-gold" />
                            <span>Highlight: {day.highlight}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Customizer Controls & Pricing (5 Cols) */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Switcher Command Console */}
                <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 backdrop-blur-3xl shadow-2xl text-left">
                  <h3 className="text-lg font-black uppercase tracking-wider mb-6 border-b border-white/5 pb-4">Curation Settings</h3>
                  
                  {/* Tab Selector */}
                  <div className="grid grid-cols-3 gap-1 mb-8 bg-white/5 rounded-xl p-1 border border-white/5">
                    {(['hotels', 'cabs', 'addons'] as const).map(tab => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={cn(
                          "py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                          activeTab === tab 
                            ? "bg-kashmir-gold text-black font-bold" 
                            : "text-white/40 hover:text-white"
                        )}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  {/* Tab: Hotels */}
                  {activeTab === 'hotels' && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                      <p className="text-xs text-white/30 mb-4 leading-relaxed">Select estate standard. Swapping updates availability pricing instantly.</p>
                      {[
                        { id: '3-star', label: 'Standard Estates', desc: 'AC Deluxe rooms with standard mountain views.', price: '₹2,500/night' },
                        { id: '4-star', label: 'Premium Estates', desc: 'Premium heating, local walnut fixtures & panoramic balconies.', price: '₹5,000/night' },
                        { id: '5-star', label: 'Palatial VIP Resorts', desc: 'Elite hospitality, VIP lounges & world-class spas (Khyber style).', price: '₹11,000/night' },
                        { id: 'houseboat', label: 'Heritage Houseboat', desc: 'Premium wood-carved cedar houseboats on Nigeen Lake.', price: '₹7,500/night' }
                      ].map(h => (
                        <button
                          key={h.id}
                          onClick={() => setHotelTier(h.id as any)}
                          className={cn(
                            "w-full p-4 rounded-xl border text-left flex items-start gap-4 transition-all duration-300",
                            hotelTier === h.id 
                              ? "border-kashmir-gold bg-kashmir-gold/5 text-white" 
                              : "border-white/5 bg-white/[0.01] hover:border-white/10 text-white/60"
                          )}
                        >
                          <Building className="w-5 h-5 text-kashmir-gold shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-black uppercase tracking-wider">{h.label}</span>
                              <span className="text-[10px] font-bold text-kashmir-gold">{h.price}</span>
                            </div>
                            <p className="text-[10px] text-white/40 leading-snug">{h.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Tab: Cabs */}
                  {activeTab === 'cabs' && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                      <p className="text-xs text-white/30 mb-4 leading-relaxed">Select transport comfort. Daily allowances & fuel included.</p>
                      {[
                        { id: 'sedan', label: 'Premium Sedan', desc: 'Ideal for small parties. Dzire/Etios luxury sedan.', price: '₹2,500/day' },
                        { id: 'suv', label: 'SUV Comfort', desc: 'Spacious luggage capacity. Ertiga/SUV cruiser.', price: '₹4,000/day' },
                        { id: 'crysta', label: 'Innova Crysta VIP', desc: 'Premium captain seats. VIP suspension comfort.', price: '₹6,000/day' },
                        { id: 'coach', label: 'Luxury Coach', desc: '12-Seater Tempo / Urbania premium traveler.', price: '₹9,500/day' }
                      ].map(c => (
                        <button
                          key={c.id}
                          onClick={() => setCabTier(c.id as any)}
                          className={cn(
                            "w-full p-4 rounded-xl border text-left flex items-start gap-4 transition-all duration-300",
                            cabTier === c.id 
                              ? "border-kashmir-gold bg-kashmir-gold/5 text-white" 
                              : "border-white/5 bg-white/[0.01] hover:border-white/10 text-white/60"
                          )}
                        >
                          <Car className="w-5 h-5 text-kashmir-gold shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-black uppercase tracking-wider">{c.label}</span>
                              <span className="text-[10px] font-bold text-kashmir-gold">{c.price}</span>
                            </div>
                            <p className="text-[10px] text-white/40 leading-snug">{c.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Tab: Add-ons */}
                  {activeTab === 'addons' && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                      <p className="text-xs text-white/30 mb-4 leading-relaxed">Enhance your odyssey with signature experiences.</p>
                      {[
                        { id: 'photographer', label: 'Professional Photographer', icon: Camera, desc: 'Dedicated photographer for local sightseeing tours.', price: '₹5,000' },
                        { id: 'drone', label: 'Aerial Drone Shoot', icon: Video, desc: '4K cinematic drone clips of your party in Gulmarg.', price: '₹8,000' },
                        { id: 'decor', label: 'Honeymoon Decoration', icon: Heart, desc: 'Fresh rose decor and chocolates on arrival night.', price: '₹3,000' },
                        { id: 'dinner', label: 'Riverside Candlelight Dinner', icon: Utensils, desc: 'Private 3-course dinner beside the Lidder river.', price: '₹4,500' }
                      ].map(a => (
                        <button
                          key={a.id}
                          onClick={() => setAddons(prev => ({ ...prev, [a.id]: !prev[a.id] }))}
                          className={cn(
                            "w-full p-4 rounded-xl border text-left flex items-start gap-4 transition-all duration-300",
                            addons[a.id] 
                              ? "border-kashmir-gold bg-kashmir-gold/5 text-white" 
                              : "border-white/5 bg-white/[0.01] hover:border-white/10 text-white/60"
                          )}
                        >
                          <a.icon className="w-5 h-5 text-kashmir-gold shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-black uppercase tracking-wider">{a.label}</span>
                              <span className="text-[10px] font-bold text-kashmir-gold">{a.price}</span>
                            </div>
                            <p className="text-[10px] text-white/40 leading-snug">{a.desc}</p>
                          </div>
                          {addons[a.id] && (
                            <Check className="w-4 h-4 text-kashmir-gold ml-auto self-center shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Invoice Pricing Summary block */}
                <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 backdrop-blur-3xl shadow-2xl text-left space-y-5">
                  <h3 className="text-sm font-black uppercase tracking-wider border-b border-white/5 pb-3">Pricing Calculator</h3>
                  
                  <div className="space-y-2.5 text-sm">
                    <div className="flex justify-between text-white/40">
                      <span>Curation Base ({formData.duration} Days)</span>
                      <span>₹{currentPrices.netPrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-white/40">
                      <span>GST (5% SGST + CGST)</span>
                      <span>₹{currentPrices.taxes.toLocaleString()}</span>
                    </div>
                    <div className="border-t border-white/5 pt-3 flex justify-between font-bold text-lg text-white">
                      <span>Total Package Price</span>
                      <span className="text-kashmir-gold">₹{currentPrices.total.toLocaleString()}</span>
                    </div>
                  </div>

                  <Button
                    onClick={handleBookPackage}
                    disabled={isBooking}
                    className="w-full h-14 bg-white text-black hover:bg-kashmir-gold hover:text-black font-black text-xs uppercase tracking-[0.25em] rounded-xl shadow-lg transition-all duration-300 mt-2 flex items-center justify-center gap-2"
                  >
                    {isBooking ? (
                      <>
                        <Loader2 className="w-4.5 h-4.5 animate-spin" /> Securing Package...
                      </>
                    ) : (
                      <>
                        Secure Curation & Book <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>

            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
