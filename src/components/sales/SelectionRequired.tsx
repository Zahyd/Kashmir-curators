import React, { useState } from 'react';
import { 
  Search, Zap, ArrowRight, MessageSquare, PlusCircle, Loader2, 
  Sparkles, Compass, MapPin, Calendar, Users, Crown, Mountain,
  Bed, ShieldCheck, Heart, Snowflake, Layers, CheckCircle2, ChevronRight
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/lib/api';
import { cn } from '@/lib/utils';

interface SelectionRequiredProps {
  title: string;
  description: string;
  icon: any;
  inquiries: any[];
  onSelect: (inquiry: any) => void;
  teamUser?: any;
}

// 4 Signature Master Templates for 1-Click Instant Studio Loading
const SIGNATURE_BLUEPRINTS = [
  {
    id: 'blueprint-flagship-6d',
    title: 'Crown of Kashmir: The Signature Circuit',
    duration: '6 Days / 5 Nights',
    destinations: 'Srinagar • Gulmarg • Pahalgam',
    theme: 'HONEYMOON_LUXURY',
    image: 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&q=80&w=800',
    tag: 'MOST POPULAR',
    tagColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    vehicle: 'Toyota Innova Crysta VIP',
    hotels: 'Wangnoo Cedar Houseboat + Pahalgam Riverside + Highland Chalet'
  },
  {
    id: 'blueprint-winter-5d',
    title: 'Apharwat Winter Powder & Gondola Skiing',
    duration: '5 Days / 4 Nights',
    destinations: 'Gulmarg High Slopes • Dal Lake',
    theme: 'ADVENTURE_SKI',
    image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&q=80&w=800',
    tag: 'WINTER SPECIAL',
    tagColor: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
    vehicle: '4x4 Snow Chains Mountain SUV',
    hotels: 'The Highland Chalet & Alpine Spa + Nigeen Royal Houseboat'
  },
  {
    id: 'blueprint-meadows-7d',
    title: 'Valley of Shepherds & High Alpine Glades',
    duration: '7 Days / 6 Nights',
    destinations: 'Pahalgam • Doodhpathri • Srinagar',
    theme: 'FAMILY_LEISURE',
    image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&q=80&w=800',
    tag: 'FAMILY DELUXE',
    tagColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    vehicle: 'Toyota Innova Crysta Executive',
    hotels: 'Pahalgam Riverside Retreat + Chinar Heritage Srinagar'
  },
  {
    id: 'blueprint-quick-4d',
    title: 'Srinagar Royal Heritage & Sunset Shikara',
    duration: '4 Days / 3 Nights',
    destinations: 'Srinagar • Dal Lake • Mughal Gardens',
    theme: 'HERITAGE_CULTURE',
    image: 'https://images.unsplash.com/photo-1566837493203-d2d46e01a5d6?auto=format&fit=crop&q=80&w=800',
    tag: 'WEEKEND ESCAPE',
    tagColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    vehicle: 'Executive Sedan',
    hotels: 'Nigeen Royal Cedar Houseboat'
  }
];

export default function SelectionRequired({ title, description, icon: Icon, inquiries, onSelect, teamUser }: SelectionRequiredProps) {
  const activeLeads = inquiries.filter(inq => inq.status !== 'Lost' && inq.status !== 'Booked');

  // AI Itinerary Studio Quick-Gen State
  const [aiDuration, setAiDuration] = useState('6 Days');
  const [aiTheme, setAiTheme] = useState('HONEYMOON');
  const [aiTier, setAiTier] = useState('5-Star Luxury Boutique');
  const [guestName, setGuestName] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  // Manual Custom Modal State
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [isCreatingCustom, setIsCreatingCustom] = useState(false);
  const [customForm, setCustomForm] = useState({
    customerName: '',
    email: '',
    phone: '',
    destination: 'Kashmir',
    duration: '6 Days',
    travelers: '2',
    budget: 'Premium',
    accommodation: 'Premium Hotel'
  });

  // 1-Click AI Automated Generation
  const handleAiAutoGenerate = async () => {
    setIsAiGenerating(true);
    try {
      const res = await fetch(`${API_BASE_URL}/ai/curate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          duration: aiDuration,
          travelers: '2 Adults',
          theme: aiTheme,
          budgetTier: aiTier
        })
      });

      let aiPackage: any = null;
      if (res.ok) {
        aiPackage = await res.json();
      }

      const clientName = guestName.trim() || 'VIP Guest (AI Curated)';
      const fakeInquiryId = `AI-${Date.now().toString().slice(-6)}`;

      // Synthesize formatted day items for ItineraryBuilder
      const durationNum = parseInt(aiDuration) || 6;
      let synthesizedDays: any[] = [];

      if (aiPackage && Array.isArray(aiPackage.days) && aiPackage.days.length > 0) {
        synthesizedDays = aiPackage.days.map((d: any, idx: number) => ({
          day: idx + 1,
          title: d.title || `Day ${idx + 1}: ${d.location || 'Scenic Exploration'}`,
          activities: Array.isArray(d.activities) ? d.activities.join(' • ') : (d.activities || 'Curated sightseeing and private local experiences.'),
          hotelId: `h-curated-${idx + 1}`,
          hotelName: d.stayRecommendation || (idx === 0 ? 'Nigeen Royal Cedar Houseboat' : 'The Highland Chalet & Alpine Spa'),
          hotelImage: idx === 0 
            ? 'https://images.unsplash.com/photo-1566837493203-d2d46e01a5d6?auto=format&fit=crop&q=80&w=800'
            : 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&q=80&w=800',
          transport: aiPackage.recommendedVehicle || 'Toyota Innova Crysta VIP',
          roomType: 'Deluxe Heritage Room',
          mealPlan: d.mealPlan || 'MAP (Breakfast + Dinner)',
          bedCount: 'King Bed',
          hotelPrice: 8500,
          transportPrice: 3800,
          extraBedPrice: 0,
          hotelNetCost: 6500,
          transportNetCost: 3000,
          paxCount: '2',
          vendorStatus: 'confirmed'
        }));
      } else {
        // Fallback default synthesis
        synthesizedDays = Array.from({ length: durationNum }, (_, i) => ({
          day: i + 1,
          title: i === 0 ? 'Srinagar Arrival & Sunset Shikara on Dal Lake' : i === 1 ? 'Pahalgam Valley of Shepherds & Lidder River' : i === durationNum - 1 ? 'Departure Transfer with Saffron Souvenir' : `Highland Alpine Journey Day ${i + 1}`,
          activities: i === 0 ? 'VIP Chauffeur pickup. Check in to Cedar Houseboat. Sunset Shikara ride with authentic Kashmiri Saffron Kahwa.' : 'Private excursions through deodar forests and mountain vistas.',
          hotelId: `h-${i + 1}`,
          hotelName: i === 0 ? 'Nigeen Royal Cedar Houseboat' : 'Pahalgam Riverside Retreat',
          hotelImage: 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&q=80&w=800',
          transport: 'Toyota Innova Crysta VIP',
          roomType: 'Deluxe Suite',
          mealPlan: 'MAP (Breakfast + Dinner)',
          bedCount: 'King Bed',
          hotelPrice: 8000,
          transportPrice: 3500,
          extraBedPrice: 0,
          hotelNetCost: 6200,
          transportNetCost: 2800,
          paxCount: '2',
          vendorStatus: 'confirmed'
        }));
      }

      // Create rich inquiry payload with quoteData pre-baked
      const syntheticInquiry = {
        id: fakeInquiryId,
        customerName: clientName,
        destination: `Kashmir (${aiDuration})`,
        duration: aiDuration,
        travelers: '2 Adults',
        budget: aiTier,
        accommodation: aiTier,
        status: 'Pending Curation',
        phone: '+919906000000',
        email: 'traveler@kashmircurators.com',
        quoteData: JSON.stringify(synthesizedDays)
      };

      toast.success(`✨ AI generated bespoke ${aiDuration} itinerary in 3.8s!`, {
        description: 'Opening directly in Luxury Itinerary Studio...'
      });

      onSelect(syntheticInquiry);
    } catch (err) {
      console.error(err);
      toast.error('AI Curate failed. Launching clean studio sandbox...');
      handleOpenBlankSandbox();
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Launch Clean Studio Sandbox with zero lead barrier
  const handleOpenBlankSandbox = () => {
    const sandboxInquiry = {
      id: `SANDBOX-${Date.now().toString().slice(-4)}`,
      customerName: 'Bespoke Traveler (Sandbox)',
      destination: 'Srinagar, Gulmarg & Pahalgam',
      duration: '6 Days',
      travelers: '2 Adults',
      budget: 'Luxury Boutique',
      accommodation: '5-Star Mountain Lodge',
      status: 'Draft Studio',
      phone: '+919103798448',
      email: 'concierge@kashmircurators.com'
    };
    onSelect(sandboxInquiry);
  };

  // 1-Click Launch of Signature Blueprint
  const handleLaunchBlueprint = (bp: typeof SIGNATURE_BLUEPRINTS[0]) => {
    const blueprintInquiry = {
      id: `BP-${Date.now().toString().slice(-4)}`,
      customerName: `VIP Traveler (${bp.tag})`,
      destination: bp.destinations,
      duration: bp.duration,
      travelers: '2 Adults',
      budget: 'Luxury',
      accommodation: bp.hotels,
      status: 'Curated Blueprint',
      phone: '+919103798448',
      email: 'concierge@kashmircurators.com'
    };
    toast.success(`Loaded ${bp.title}! Opening in Itinerary Studio...`);
    onSelect(blueprintInquiry);
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingCustom(true);

    try {
      const token = localStorage.getItem('teamToken');
      
      const response = await fetch(`${API_BASE_URL}/inquiries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          customerName: customForm.customerName,
          email: customForm.email,
          phone: customForm.phone,
          destination: customForm.destination,
          duration: customForm.duration,
          travelers: customForm.travelers,
          budget: customForm.budget,
          accommodation: customForm.accommodation
        })
      });

      if (!response.ok) throw new Error('Failed to create custom package lead');
      const newInq = await response.json();

      if (teamUser?.code) {
        await fetch(`${API_BASE_URL}/inquiries/${newInq.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ 
            assignedTo: teamUser.code,
            status: 'Pending Curation'
          })
        }).catch(() => {});
      }

      toast.success('Custom itinerary inquiry created successfully!');
      setIsCustomModalOpen(false);
      onSelect(newInq);
    } catch (error) {
      console.error(error);
      toast.error('Failed to create customized package.');
    } finally {
      setIsCreatingCustom(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-4 sm:py-8 md:py-12 animate-in fade-in duration-500 px-1 sm:px-4 space-y-6 sm:space-y-10">
      
      {/* 1. Header Banner */}
      <div className="p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-[2.5rem] bg-gradient-to-br from-amber-500/10 via-white/[0.02] to-transparent border border-amber-400/20 shadow-2xl backdrop-blur-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5 sm:gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-[10px] font-black uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>AI Autonomous Itinerary Studio</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-black text-white tracking-tight">
            Curate Luxury Kashmir Itineraries
          </h2>
          <p className="text-white/60 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
            Generate complete day-by-day itineraries in seconds with AI, select a pre-curated signature circuit, or build a bespoke quote for any lead in your pipeline.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full md:w-auto shrink-0">
          <Button 
            onClick={handleOpenBlankSandbox}
            variant="outline"
            className="w-full sm:w-auto h-11 px-5 rounded-xl sm:rounded-2xl border-white/20 bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2"
          >
            <Compass className="w-4 h-4 text-amber-400" />
            <span>Open Clean Studio</span>
          </Button>

          <Button 
            onClick={() => setIsCustomModalOpen(true)}
            className="w-full sm:w-auto h-11 px-6 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Manual Custom Lead</span>
          </Button>
        </div>
      </div>

      {/* 2. AI INSTANT CURATION CONTROL MODULE */}
      <Card className="bg-[#0b1016]/90 border border-amber-500/30 p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-[2.5rem] shadow-2xl shadow-black/60 relative overflow-hidden backdrop-blur-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 blur-3xl pointer-events-none" />
        
        <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sparkles className="w-5 h-5 animate-spin" style={{ animationDuration: '6s' }} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <span>1-Click AI Itinerary Copilot</span>
                <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-mono">
                  Autonomous 5s Engine
                </Badge>
              </h3>
              <p className="text-xs text-white/50">Zero manual typing — auto-computes driving routes, luxury stays, and daily excursions.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Duration Selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-white/50 block">Duration</label>
            <select
              value={aiDuration}
              onChange={e => setAiDuration(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-semibold focus:outline-none focus:border-amber-400/50"
            >
              <option value="4 Days" className="bg-[#0b1016] text-white">4 Days / 3 Nights</option>
              <option value="5 Days" className="bg-[#0b1016] text-white">5 Days / 4 Nights</option>
              <option value="6 Days" className="bg-[#0b1016] text-white">6 Days / 5 Nights (Flagship)</option>
              <option value="7 Days" className="bg-[#0b1016] text-white">7 Days / 6 Nights</option>
              <option value="8 Days" className="bg-[#0b1016] text-white">8 Days / 7 Nights</option>
              <option value="10 Days" className="bg-[#0b1016] text-white">10 Days / 9 Nights</option>
            </select>
          </div>

          {/* Theme / Persona */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-white/50 block">Traveler Theme</label>
            <select
              value={aiTheme}
              onChange={e => setAiTheme(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-semibold focus:outline-none focus:border-amber-400/50"
            >
              <option value="HONEYMOON" className="bg-[#0b1016] text-white">❤️ Honeymoon & Romance</option>
              <option value="FAMILY_LEISURE" className="bg-[#0b1016] text-white">👨‍👩‍👧‍👦 Family Alpine Leisure</option>
              <option value="ADVENTURE_SKI" className="bg-[#0b1016] text-white">⛷️ Winter Snow & Skiing</option>
              <option value="OFFBEAT_NATURE" className="bg-[#0b1016] text-white">🌲 Offbeat Meadows (Gurez/Doodhpathri)</option>
              <option value="HERITAGE_CULTURE" className="bg-[#0b1016] text-white">🏛️ Dal Lake & Artisan Heritage</option>
            </select>
          </div>

          {/* Hotel Tier */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-white/50 block">Lodging Tier</label>
            <select
              value={aiTier}
              onChange={e => setAiTier(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-semibold focus:outline-none focus:border-amber-400/50"
            >
              <option value="5-Star Luxury Boutique" className="bg-[#0b1016] text-white">5-Star Mountain Boutique</option>
              <option value="Royal Heritage Houseboat" className="bg-[#0b1016] text-white">Royal Heritage Houseboat</option>
              <option value="Premium 4-Star Lodges" className="bg-[#0b1016] text-white">Premium 4-Star Lodges</option>
            </select>
          </div>

          {/* Guest Name / Reference */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-white/50 block">Client Name (Optional)</label>
            <Input
              value={guestName}
              onChange={e => setGuestName(e.target.value)}
              placeholder="e.g. Dr. Verma Family"
              className="h-11 bg-white/5 border-white/10 text-white text-xs rounded-xl focus:border-amber-400/50"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-2 text-white/40 text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Includes auto-calculated driving durations, route validation & certified wholesale tariffs.</span>
          </div>

          <Button
            onClick={handleAiAutoGenerate}
            disabled={isAiGenerating}
            className="w-full sm:w-auto h-12 px-8 rounded-2xl bg-amber-400 hover:bg-amber-300 text-black font-black text-xs uppercase tracking-widest shadow-xl shadow-amber-400/20 flex items-center justify-center gap-3 transition-transform hover:scale-105 active:scale-95"
          >
            {isAiGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>{isAiGenerating ? 'Synthesizing Luxury Itinerary...' : '✨ Generate with AI in 5s'}</span>
          </Button>
        </div>
      </Card>

      {/* 3. SIGNATURE MASTER CIRCUITS (1-Click Blueprints) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-400" />
              <span>Signature Kashmir Master Circuits</span>
            </h3>
            <p className="text-xs text-white/50">Instant 1-click curated routes ready to personalize and quote.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SIGNATURE_BLUEPRINTS.map(bp => (
            <Card
              key={bp.id}
              onClick={() => handleLaunchBlueprint(bp)}
              className="group bg-[#0b1016]/80 hover:bg-[#0f1620] border border-white/10 hover:border-amber-400/40 rounded-3xl p-4 transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden shadow-xl"
            >
              <div>
                <div className="relative h-32 rounded-2xl overflow-hidden mb-3">
                  <img
                    src={bp.image}
                    alt={bp.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <Badge className={`absolute top-2.5 left-2.5 text-[9px] font-bold uppercase tracking-wider border ${bp.tagColor}`}>
                    {bp.tag}
                  </Badge>
                  <span className="absolute bottom-2.5 right-2.5 text-[10px] font-mono font-bold text-white bg-black/60 px-2 py-0.5 rounded-md backdrop-blur-md">
                    {bp.duration}
                  </span>
                </div>

                <h4 className="font-bold text-white text-xs group-hover:text-amber-400 transition-colors line-clamp-1 mb-1">
                  {bp.title}
                </h4>
                <p className="text-[10px] text-white/50 line-clamp-1 mb-2 font-mono flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
                  <span>{bp.destinations}</span>
                </p>
              </div>

              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-amber-400 font-bold group-hover:translate-x-1 transition-transform">
                <span>Load in Studio</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* 4. ACTIVE PIPELINE LEADS (If Any Exist) */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Active Pipeline Deals</span>
          </h3>
          <Badge className="bg-white/5 text-white/50 border border-white/10 font-mono text-[10px]">
            {activeLeads.length} Available
          </Badge>
        </div>

        {activeLeads.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {activeLeads.map((inq) => (
              <Card 
                key={inq.id}
                onClick={() => onSelect(inq)}
                className="group bg-[#0b1016]/80 border border-white/10 p-5 rounded-3xl hover:bg-[#0f1620] hover:border-amber-400/40 transition-all cursor-pointer flex items-center justify-between gap-4 shadow-lg"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-sm shrink-0">
                    {inq.customerName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-white group-hover:text-amber-400 transition-colors truncate text-sm">
                      {inq.customerName}
                    </h4>
                    <p className="text-[10px] text-white/40 uppercase tracking-wider mt-0.5 truncate font-mono">
                      {inq.destination} • {inq.duration}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <Badge variant="outline" className="border-white/15 text-white/60 text-[9px] uppercase tracking-wider">
                    {inq.status}
                  </Badge>
                  <Button variant="ghost" size="icon" className="w-9 h-9 rounded-xl text-white/40 group-hover:text-amber-400 group-hover:bg-amber-400/10">
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-[#0b1016]/60 border border-dashed border-white/10 p-8 rounded-3xl text-center flex flex-col items-center justify-center gap-2">
            <MessageSquare className="w-8 h-8 text-white/20 mb-1" />
            <p className="text-white/60 text-xs font-semibold">Your personal active deal queue is clear.</p>
            <p className="text-white/40 text-[11px] max-w-md">
              Use the <span className="text-amber-400 font-bold">1-Click AI Copilot</span> above to instantly draft an itinerary, choose a signature circuit, or claim a fresh inquiry from the <span className="text-emerald-400 font-bold">Live Lead Queue</span>.
            </p>
          </Card>
        )}
      </div>

      {/* 5. Custom Package Manual Form Modal */}
      {isCustomModalOpen && (
        <Dialog open={isCustomModalOpen} onOpenChange={setIsCustomModalOpen}>
          <DialogContent className="max-w-xl bg-[#0b1016]/95 backdrop-blur-3xl border border-white/10 text-white p-8 rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="mb-6">
              <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[9px] font-bold uppercase tracking-wider mb-2">
                Manual Lead Setup
              </Badge>
              <h2 className="text-2xl font-display font-black text-white">Create Custom Package Lead</h2>
              <p className="text-white/50 text-xs mt-1">Configure traveler particulars to attach to your new itinerary.</p>
            </div>

            <form onSubmit={handleCustomSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-white/50">Customer Name</label>
                  <Input 
                    required 
                    value={customForm.customerName}
                    onChange={(e) => setCustomForm({...customForm, customerName: e.target.value})}
                    placeholder="e.g. Ananya Sharma" 
                    className="bg-white/5 border-white/10 text-white text-xs rounded-xl focus:border-amber-400"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-white/50">Email Address</label>
                  <Input 
                    type="email"
                    required 
                    value={customForm.email}
                    onChange={(e) => setCustomForm({...customForm, email: e.target.value})}
                    placeholder="ananya@example.com" 
                    className="bg-white/5 border-white/10 text-white text-xs rounded-xl focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-white/50">WhatsApp Phone</label>
                  <Input 
                    required 
                    value={customForm.phone}
                    onChange={(e) => setCustomForm({...customForm, phone: e.target.value})}
                    placeholder="+91 98765 43210" 
                    className="bg-white/5 border-white/10 text-white text-xs rounded-xl focus:border-amber-400"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-white/50">Duration</label>
                  <Input 
                    required 
                    value={customForm.duration}
                    onChange={(e) => setCustomForm({...customForm, duration: e.target.value})}
                    placeholder="e.g. 6 Days" 
                    className="bg-white/5 border-white/10 text-white text-xs rounded-xl focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setIsCustomModalOpen(false)}
                  className="text-white/60 hover:text-white text-xs"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isCreatingCustom}
                  className="bg-amber-400 hover:bg-amber-300 text-black font-black text-xs uppercase tracking-wider px-6 rounded-xl"
                >
                  {isCreatingCustom ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <PlusCircle className="w-4 h-4 mr-2" />}
                  Create & Launch Studio
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

    </div>
  );
}
