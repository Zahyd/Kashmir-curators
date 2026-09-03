import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Loader2, Users, ArrowRight, CheckCircle, MapPin, Clock, ChevronDown, 
  Minus, Plus, AlertCircle, Compass, Building, Sparkles, Camera, Video, 
  Heart, Utensils, Shield, Activity, Briefcase, Sun, CloudRain, Snowflake,
  CalendarDays, Wallet, Car, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/lib/api';
import { format, addDays, isBefore, startOfToday } from 'date-fns';
import { cn } from '@/lib/utils';

// Travel Types database
const TRAVEL_TYPES = [
  { value: 'Solo', label: 'Solo Adventurer', desc: 'Private exploration & self-discovery' },
  { value: 'Couple', label: 'Romantic Escape', desc: 'Bespoke curations for two' },
  { value: 'Honeymoon', label: 'Honeymoon Suite', desc: 'VIP couples experiences & photo curations' },
  { value: 'Family', label: 'Family Vacation', desc: 'Comfortable transits & family-friendly estates' },
  { value: 'Friends', label: 'Friends Expedition', desc: 'Adventure sports & mountain activities' },
  { value: 'Corporate', label: 'Corporate Retreat', desc: 'Team bonding & high-end conferences' }
];

// Destinations database
const DESTINATIONS = [
  { id: 'srinagar', name: 'Srinagar', desc: 'Dal Lake & Houseboats' },
  { id: 'gulmarg', name: 'Gulmarg', desc: 'Gondola & Alpine Snow' },
  { id: 'pahalgam', name: 'Pahalgam', desc: 'Lidder River & Valleys' },
  { id: 'sonamarg', name: 'Sonamarg', desc: 'Glaciers & River Rafting' },
  { id: 'doodhpathri', name: 'Doodhpathri', desc: 'Meadows of Milk' },
  { id: 'gurez', name: 'Gurez Valley', desc: 'Untouched Borderlands' },
  { id: 'yusmarg', name: 'Yusmarg', desc: 'Meadows of Jesus' }
];

// Interests database
const INTERESTS = [
  { id: 'snow', label: 'Snow Sports', icon: Snowflake },
  { id: 'adventure', label: 'Extreme Adventure', icon: Activity },
  { id: 'photography', label: 'Artisan Photography', icon: Camera },
  { id: 'houseboat', label: 'Houseboat Stay', icon: Building },
  { id: 'trekking', label: 'Alpine Trekking', icon: Compass },
  { id: 'food', label: 'Wazwan Culinary', icon: Utensils },
  { id: 'culture', label: 'Heritage Culture', icon: Sparkles },
  { id: 'shopping', label: 'Artisanal Crafts', icon: Briefcase }
];

// Date Picker Popover Component — styled like premium flight apps
function DatePickerField({
  date,
  onSelect,
  label,
  minDate,
  placeholder = 'Select date',
}: {
  date: Date | undefined;
  onSelect: (date: Date | undefined) => void;
  label: string;
  minDate?: Date;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative flex-1 min-w-0">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={`w-full h-16 pl-12 pr-4 rounded-xl border bg-slate-50 text-left flex items-center transition-all duration-300 group ${
              open 
                ? 'border-[#111439] ring-1 ring-[#111439]/20 shadow-md' 
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <CalendarDays className={`h-5 w-5 transition-colors duration-300 ${open ? 'text-[#111439]' : 'text-amber-500'}`} />
            </div>
            {date ? (
              <div className="flex flex-col">
                <span className="text-[#111439] font-bold text-lg leading-tight">{format(date, 'dd MMM')}</span>
                <span className="text-[#4A5568] text-xs font-medium">{format(date, 'EEEE, yyyy')}</span>
              </div>
            ) : (
              <span className="text-slate-400 text-sm font-medium">{placeholder}</span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-auto p-0 bg-white border-slate-200 shadow-2xl rounded-2xl overflow-hidden" 
          align="start"
          sideOffset={8}
        >
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => {
              onSelect(d);
              setOpen(false);
            }}
            disabled={(d) => isBefore(d, minDate || startOfToday())}
            initialFocus
            className="p-3 pointer-events-auto bg-white text-[#111439]"
          />
        </PopoverContent>
      </Popover>
      <Label className="absolute -top-3 left-4 bg-white border border-slate-200 px-2 py-0.5 rounded text-[9px] font-black text-[#111439] uppercase tracking-widest z-10">{label}</Label>
    </div>
  );
}

export function InteractiveTripPlanner() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [currency, setCurrency] = useState<'INR' | 'USD' | 'AED'>('INR');
  const [isGenerating, setIsGenerating] = useState(false);

  // Currency info
  const CURRENCY_RATES = {
    INR: { symbol: '₹', rate: 1 },
    USD: { symbol: '$', rate: 0.012 },
    AED: { symbol: 'AED ', rate: 0.044 }
  };

  const formatPrice = (amount: number) => {
    const info = CURRENCY_RATES[currency];
    const converted = Math.round(amount * info.rate);
    return `${info.symbol}${converted.toLocaleString()}`;
  };

  // State Profile
  const [profile, setProfile] = useState({
    travelType: 'Couple',
    departureDate: addDays(new Date(), 14),
    duration: 5,
    budget: 'Premium',
    destinations: ['srinagar', 'gulmarg', 'pahalgam'],
    interests: ['houseboat', 'culture'],
    addons: {
      transfers: true,
      gondola: false,
      photographer: false,
      dinner: false,
      insurance: false,
      guide: false
    },
    name: '',
    email: '',
    phone: ''
  });

  // Calculate pricing dynamically
  const pricingBreakdown = useMemo(() => {
    const days = profile.duration;
    let baseRate = 3500; // Budget
    if (profile.budget === 'Premium') baseRate = 6500;
    if (profile.budget === 'Luxury') baseRate = 12000;

    // Travel Type multipliers
    let multiplier = 1.0;
    if (profile.travelType === 'Solo') multiplier = 1.0;
    if (profile.travelType === 'Couple') multiplier = 1.8;
    if (profile.travelType === 'Honeymoon') multiplier = 2.2;
    if (profile.travelType === 'Family') multiplier = 3.5;
    if (profile.travelType === 'Friends') multiplier = 4.0;
    if (profile.travelType === 'Corporate') multiplier = 6.0;

    let subtotal = baseRate * days * multiplier;

    // Addons Cost
    if (profile.addons.transfers) subtotal += 3000;
    if (profile.addons.gondola) subtotal += 2000 * (profile.travelType === 'Solo' ? 1 : 2);
    if (profile.addons.photographer) subtotal += 5000;
    if (profile.addons.dinner) subtotal += 4500;
    if (profile.addons.insurance) subtotal += 600 * (profile.travelType === 'Solo' ? 1 : 2);
    if (profile.addons.guide) subtotal += 3500 * days;

    const taxes = Math.round(subtotal * 0.05);
    const total = subtotal + taxes;

    return { subtotal, taxes, total };
  }, [profile.duration, profile.budget, profile.travelType, profile.addons]);

  // AI curator advice generator
  const curatorInsight = useMemo(() => {
    const type = profile.travelType;
    const destCount = profile.destinations.length;
    const budget = profile.budget;

    if (type === 'Honeymoon') {
      return `For your romantic honeymoon in Kashmir, we have curated luxury houseboats on Nigeen Lake and private candlelight dining options. Recommended best season: Autumn (Sep-Oct) for beautiful red foliage, or Winter (Jan) for magical snow views.`;
    }
    if (type === 'Friends' || profile.interests.includes('adventure')) {
      return `Adventure focus detected! We recommended exploring high altitude treks in Sonamarg and skiing in Gulmarg. A chauffeured SUV transfer has been auto-allocated to navigate winding mountain passes comfortably.`;
    }
    if (type === 'Family') {
      return `Family vacation curation: Priority set to comfortable transits with minimal changes. Selected premium family estates in Srinagar and Pahalgam, including optional airport pickups and child-friendly activities.`;
    }
    return `Based on your comfort class (${budget}) and travel type (${type}), we selected high-comfort accommodations and optimized transits across ${destCount} regions. Peak travel season is active, securing early inventory allocations.`;
  }, [profile.travelType, profile.destinations, profile.budget, profile.interests]);

  // Hotel recommendation
  const recommendedHotel = useMemo(() => {
    if (profile.budget === 'Luxury') {
      return { name: "The Khyber Resort & Spa", location: "Gulmarg Highlands", rating: "5★ VIP Palace" };
    }
    if (profile.budget === 'Premium') {
      return { name: "Senator Pine Creek", location: "Pahalgam Valley", rating: "4★ Boutique Comfort" };
    }
    return { name: "Pine Spring Cozy Chalet", location: "Srinagar Central", rating: "3★ Deluxe Room" };
  }, [profile.budget]);

  // Cab recommendation
  const recommendedCab = useMemo(() => {
    const type = profile.travelType;
    if (type === 'Friends' || type === 'Corporate') {
      return { model: "Force Urbania Coach", type: "12-Seater Premium Transit" };
    }
    if (type === 'Family' || type === 'Honeymoon') {
      return { model: "Toyota Innova Crysta", type: "Chauffeured VIP SUV" };
    }
    return { model: "Toyota Etios / Dzire", type: "Luxury Compact Sedan" };
  }, [profile.travelType]);

  // Weather insight
  const weatherInsight = useMemo(() => {
    const date = profile.departureDate;
    if (!date) return { temp: '15°C', icon: Sun, desc: 'Spring bloom season. Clear views.' };
    const month = date.getMonth(); // 0 = Jan, 11 = Dec

    if (month >= 10 || month <= 1) {
      return { temp: '-2°C to 6°C', icon: Snowflake, desc: 'Glacial winter. Heaviest snowfall active. Perfect for ski sports.' };
    }
    if (month >= 5 && month <= 7) {
      return { temp: '18°C to 28°C', icon: Sun, desc: 'Summery meadows. Pleasant alpine lake breezes. Great for trekking.' };
    }
    return { temp: '10°C to 18°C', icon: CloudRain, desc: 'Crisp autumn. Cool night breezes. Red maple leaves blooming.' };
  }, [profile.departureDate]);

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const toggleDestination = (id: string) => {
    setProfile(prev => {
      const active = prev.destinations.includes(id)
        ? prev.destinations.filter(d => d !== id)
        : [...prev.destinations, id];
      return { ...prev, destinations: active };
    });
  };

  const toggleInterest = (id: string) => {
    setProfile(prev => {
      const active = prev.interests.includes(id)
        ? prev.interests.filter(i => i !== id)
        : [...prev.interests, id];
      return { ...prev, interests: active };
    });
  };

  const toggleAddon = (key: keyof typeof profile.addons) => {
    setProfile(prev => ({
      ...prev,
      addons: { ...prev.addons, [key]: !prev.addons[key] }
    }));
  };

  const handleSubmit = async () => {
    setIsGenerating(true);
    toast.loading('Curating your customized premium journey...');
    
    try {
      const res = await fetch(`${API_BASE_URL}/inquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: profile.name,
          email: profile.email,
          phone: profile.phone,
          destination: profile.destinations.map(d => d.toUpperCase()).join(', '),
          duration: `${profile.duration} Nights`,
          travelers: profile.travelType,
          budget: profile.budget,
          accommodation: `${profile.budget} Hotel`,
          flightDetails: JSON.stringify({
            interests: profile.interests,
            addons: profile.addons,
            pricing: pricingBreakdown,
            recommendedHotel,
            recommendedCab
          })
        })
      });

      toast.dismiss();
      if (res.ok) {
        toast.success('Bespoke journey generated successfully! Opening dashboard...');
        navigate('/profile');
      } else {
        toast.error('Failed to register inquiry.');
      }
    } catch (e) {
      toast.dismiss();
      toast.error('Network error registering journey.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto py-8 relative">
      <div className="absolute top-0 -left-10 w-40 h-40 bg-amber-400/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 -right-10 w-60 h-60 bg-blue-400/10 rounded-full blur-3xl" />

      {/* Main Grid: Left is Form Wizard, Right is Real-time summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">
        
        {/* Left Column: Multi-step Wizard */}
        <div className="lg:col-span-7 bg-white dark:bg-[#0a0f12] border border-slate-200/90 dark:border-white/10 shadow-xl shadow-slate-900/5 rounded-[3rem] p-8 md:p-10 text-left space-y-8">
          
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-white/10 pb-5">
            <div>
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-amber-700 dark:text-amber-400">Bespoke Curation Desk</span>
              <h2 className="text-2xl font-black uppercase tracking-tight mt-1 text-[#111439] dark:text-white">
                AI Journey <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-600 via-purple-600 to-cyan-600">Studio</span>
              </h2>
            </div>
            <div className="h-2 w-32 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden border border-slate-200 dark:border-white/10">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 to-[#111439] dark:to-amber-400 rounded-full transition-all duration-500"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </div>

          {/* STEP 1: Profile & Duration */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-[#111439] dark:text-white uppercase tracking-wider">1. Select Travel Profile</h3>
                <p className="text-xs text-[#4A5568] dark:text-white/60 leading-snug">Choose your traveler class to fine-tune activity and hotel recommendations.</p>
              </div>

              {/* Grid of travel profiles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {TRAVEL_TYPES.map(t => (
                  <button
                    key={t.value}
                    onClick={() => setProfile(prev => ({ ...prev, travelType: t.value }))}
                    className={cn(
                      "p-4 rounded-2xl border text-left transition-all duration-300 hover:scale-[1.02]",
                      profile.travelType === t.value
                        ? "border-[#111439] bg-[#111439]/5 text-[#111439] dark:border-amber-400 dark:bg-amber-400/10 dark:text-amber-400 shadow-sm"
                        : "border-slate-200 bg-slate-50 text-[#4A5568] dark:border-white/10 dark:bg-white/5 dark:text-white/60 hover:border-slate-300 dark:hover:border-white/20 hover:text-[#111439] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10"
                    )}
                  >
                    <span className="block text-xs font-black uppercase tracking-wider mb-1 text-[#111439] dark:text-white">{t.label}</span>
                    <span className="block text-[10px] text-slate-500 dark:text-white/40 leading-none">{t.desc}</span>
                  </button>
                ))}
              </div>

              {/* Duration and Calendar Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                <div className="relative">
                  <div className="flex items-center justify-between h-16 px-5 rounded-xl border border-slate-200 bg-slate-50">
                    <span className="text-[#111439] text-xs font-bold uppercase tracking-wider">Nights Stay</span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setProfile(prev => ({ ...prev, duration: Math.max(3, prev.duration - 1) }))}
                        className="w-8 h-8 rounded-full border border-slate-200 bg-white flex items-center justify-center text-[#111439] hover:bg-[#111439] hover:text-white transition-all shadow-sm"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[#111439] font-black text-xl w-6 text-center">{profile.duration}</span>
                      <button
                        onClick={() => setProfile(prev => ({ ...prev, duration: Math.min(14, prev.duration + 1) }))}
                        className="w-8 h-8 rounded-full border border-slate-200 bg-white flex items-center justify-center text-[#111439] hover:bg-[#111439] hover:text-white transition-all shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <Label className="absolute -top-3 left-4 bg-white border border-slate-200 px-2 py-0.5 rounded text-[9px] font-black text-[#111439] uppercase tracking-widest">Duration</Label>
                </div>

                <DatePickerField
                  date={profile.departureDate}
                  onSelect={(d) => setProfile(prev => ({ ...prev, departureDate: d || new Date() }))}
                  label="Departure Date"
                  placeholder="Select Date"
                />
              </div>
            </div>
          )}

          {/* STEP 2: Destinations & Comfort */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-[#111439] uppercase tracking-wider">2. Territory & Comfort Tier</h3>
                <p className="text-xs text-[#4A5568] leading-snug">Select territories to traverse and your expected accommodation comfort class.</p>
              </div>

              {/* Destination tags grid */}
              <div className="space-y-3">
                <span className="block text-[9px] font-black uppercase tracking-widest text-[#111439] ml-1">Preferred Destinations</span>
                <div className="flex flex-wrap gap-2">
                  {DESTINATIONS.map(d => {
                    const active = profile.destinations.includes(d.id);
                    return (
                      <button
                        key={d.id}
                        onClick={() => toggleDestination(d.id)}
                        className={cn(
                          "px-4 py-2.5 rounded-full border text-xs font-extrabold uppercase tracking-wider transition-all duration-300",
                          active 
                            ? "bg-[#111439] text-white border-[#111439] shadow-md" 
                            : "bg-slate-50 border-slate-200 text-[#4A5568] hover:border-slate-300 hover:text-[#111439]"
                        )}
                      >
                        {d.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Accommodation Class selection */}
              <div className="space-y-3 pt-4">
                <span className="block text-[9px] font-black uppercase tracking-widest text-[#111439] ml-1">Comfort & Budget Class</span>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { value: 'Budget', label: 'Comfort stay', price: 'Standard boutique' },
                    { value: 'Premium', label: 'Premium Class', price: 'High-end comfort' },
                    { value: 'Luxury', label: 'VIP Palatial', price: 'Taj / Khyber Luxury' }
                  ].map(b => (
                    <button
                      key={b.value}
                      onClick={() => setProfile(prev => ({ ...prev, budget: b.value }))}
                      className={cn(
                        "p-4 rounded-xl border text-center transition-all duration-300",
                        profile.budget === b.value
                          ? "border-[#111439] bg-[#111439]/5 text-[#111439] shadow-sm"
                          : "border-slate-200 bg-slate-50 text-[#4A5568] hover:border-slate-300 hover:text-[#111439]"
                      )}
                    >
                      <p className="text-[10px] font-black uppercase tracking-wider mb-1 text-[#111439]">{b.label}</p>
                      <p className="text-[9px] text-slate-500 leading-none">{b.price}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Interests & Addons */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-[#111439] uppercase tracking-wider">3. Interests & Signature Experiences</h3>
                <p className="text-xs text-[#4A5568] leading-snug">Personalize your daily itineraries with interest-based activities and optional VIP services.</p>
              </div>

              {/* Interests Grid */}
              <div className="space-y-3">
                <span className="block text-[9px] font-black uppercase tracking-widest text-[#111439] ml-1">Interests</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {INTERESTS.map(item => {
                    const active = profile.interests.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        onClick={() => toggleInterest(item.id)}
                        className={cn(
                          "py-3 px-4 rounded-xl border text-center flex flex-col items-center justify-center gap-2 transition-all duration-300",
                          active 
                            ? "border-[#111439] bg-[#111439]/5 text-[#111439] shadow-sm" 
                            : "border-slate-200 bg-slate-50 text-[#4A5568] hover:border-slate-300 hover:text-[#111439]"
                        )}
                      >
                        <item.icon className="w-5 h-5 text-amber-600" />
                        <span className="text-[9px] font-black uppercase tracking-wider leading-none">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Addons Section */}
              <div className="space-y-3 pt-2">
                <span className="block text-[9px] font-black uppercase tracking-widest text-[#111439] ml-1">Add-on Amenities</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { id: 'transfers', label: 'Airport Pick & Drop', desc: 'Private luxury cab transfers.' },
                    { id: 'gondola', label: 'Gulmarg Gondola Passes', desc: 'Skip the line VIP tickets.' },
                    { id: 'photographer', label: 'Artisan Photographer', desc: 'Bespoke holiday photography.' },
                    { id: 'dinner', label: 'Candlelight Dinner Night', desc: 'Romantic Lidder riverside setup.' }
                  ].map(a => (
                    <div 
                      key={a.id}
                      onClick={() => toggleAddon(a.id as any)}
                      className={cn(
                        "p-4 rounded-xl border text-left flex items-center justify-between cursor-pointer transition-all duration-300",
                        profile.addons[a.id as keyof typeof profile.addons]
                          ? "border-[#111439] bg-[#111439]/5 text-[#111439]"
                          : "border-slate-200 bg-slate-50 text-[#4A5568]"
                      )}
                    >
                      <div>
                        <p className="text-xs font-black uppercase tracking-wider mb-0.5 text-[#111439]">{a.label}</p>
                        <p className="text-[9px] text-slate-500 leading-none">{a.desc}</p>
                      </div>
                      <Switch 
                        checked={profile.addons[a.id as keyof typeof profile.addons]} 
                        className="data-[state=checked]:bg-[#111439] pointer-events-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact Information block */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <span className="block text-[9px] font-black uppercase tracking-widest text-[#111439] ml-1">Curator Liaison Contact</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input 
                    value={profile.name} 
                    onChange={e => setProfile({...profile, name: e.target.value})} 
                    placeholder="Full Name" 
                    className="h-12 bg-slate-50 border-slate-200 rounded-xl text-xs font-semibold text-[#111439] focus:bg-white"
                  />
                  <Input 
                    type="email"
                    value={profile.email} 
                    onChange={e => setProfile({...profile, email: e.target.value})} 
                    placeholder="Email" 
                    className="h-12 bg-slate-50 border-slate-200 rounded-xl text-xs font-semibold text-[#111439] focus:bg-white"
                  />
                  <Input 
                    type="tel"
                    value={profile.phone} 
                    onChange={e => setProfile({...profile, phone: e.target.value})} 
                    placeholder="WhatsApp Number" 
                    className="h-12 bg-slate-50 border-slate-200 rounded-xl text-xs font-semibold text-[#111439] focus:bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Controls Bar */}
          <div className="flex justify-between items-center pt-6 border-t border-slate-100 mt-4">
            <Button
              onClick={handleBack}
              disabled={step === 1}
              variant="ghost"
              className={cn("text-slate-500 hover:text-[#111439] hover:bg-slate-100 rounded-xl", step === 1 && "opacity-0")}
            >
              Back
            </Button>

            {step < 3 ? (
              <Button
                onClick={handleNext}
                className="bg-[#111439] text-white hover:bg-[#1c225a] rounded-xl font-bold px-6 h-12 flex items-center gap-2 shadow-sm"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isGenerating || !profile.name || !profile.phone}
                className="bg-[#111439] text-white hover:bg-[#1c225a] rounded-xl font-black text-xs uppercase tracking-widest px-8 h-12 flex items-center gap-2 shadow-lg shadow-[#111439]/20"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Securing...
                  </>
                ) : (
                  <>
                    Generate Journey <Sparkles className="w-4 h-4 text-amber-400" />
                  </>
                )}
              </Button>
            )}
          </div>

        </div>

        {/* Right Column: Real-time Journey Summary & AI Curator (5 Cols) */}
        <div className="lg:col-span-5 space-y-6 text-left">
          
          {/* Summary Panel */}
          <div className="bg-white dark:bg-[#0a0f12] border border-slate-200/90 dark:border-white/10 shadow-xl shadow-slate-900/5 rounded-[3rem] p-6 md:p-8 space-y-6 text-[#111439] dark:text-white">
            <h3 className="text-sm font-black uppercase tracking-wider border-b border-slate-100 dark:border-white/10 pb-3 text-[#111439] dark:text-white">Journey Blueprint</h3>
            
            {/* Live Pricing Estimation */}
            <div className="space-y-1.5 border-b border-slate-100 dark:border-white/10 pb-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40">Estimated Cost</span>
              <div className="flex justify-between items-baseline">
                <span className="text-3xl font-display font-black text-[#111439] dark:text-amber-400">{formatPrice(pricingBreakdown.total)}</span>
                <span className="text-[10px] text-slate-500 dark:text-white/40 tracking-wider">All Taxes & Allowances Inc.</span>
              </div>
            </div>

            {/* Travel Specs */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-3.5 rounded-xl flex items-center gap-3">
                <CalendarDays className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <div>
                  <span className="block text-[8px] font-black text-slate-500 dark:text-white/40 uppercase tracking-widest">Dates</span>
                  <span className="font-bold text-[#111439] dark:text-white">{profile.departureDate ? format(profile.departureDate, 'dd MMM') : 'TBD'} ({profile.duration}N)</span>
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-3.5 rounded-xl flex items-center gap-3">
                <Users className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <div>
                  <span className="block text-[8px] font-black text-slate-500 dark:text-white/40 uppercase tracking-widest">Profile</span>
                  <span className="font-bold text-[#111439] dark:text-white">{profile.travelType}</span>
                </div>
              </div>
            </div>

            {/* AI Curator Recommendations */}
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shrink-0">
                  <Building className="w-4.5 h-4.5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <span className="block text-[8px] font-black uppercase text-slate-500 dark:text-white/40 tracking-widest mb-0.5">Recommended Estate</span>
                  <h5 className="text-xs font-bold text-[#111439] dark:text-white">{recommendedHotel.name}</h5>
                  <p className="text-[9px] text-[#4A5568] dark:text-white/60 mt-0.5">{recommendedHotel.location} • {recommendedHotel.rating}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shrink-0">
                  <Car className="w-4.5 h-4.5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <span className="block text-[8px] font-black uppercase text-slate-500 dark:text-white/40 tracking-widest mb-0.5">Allocated Transport</span>
                  <h5 className="text-xs font-bold text-[#111439] dark:text-white">{recommendedCab.model}</h5>
                  <p className="text-[9px] text-[#4A5568] dark:text-white/60 mt-0.5">{recommendedCab.type}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shrink-0">
                  <weatherInsight.icon className="w-4.5 h-4.5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <span className="block text-[8px] font-black uppercase text-slate-500 dark:text-white/40 tracking-widest mb-0.5">Seasonal Weather advisory</span>
                  <h5 className="text-xs font-bold text-[#111439] dark:text-white">{weatherInsight.temp} ({weatherInsight.desc})</h5>
                  <p className="text-[9px] text-[#4A5568] dark:text-white/60 mt-0.5">Departure tenure forecast based on date</p>
                </div>
              </div>
            </div>

          </div>

          {/* AI Curator Panel */}
          <div className="bg-gradient-to-br from-amber-50 via-white to-slate-50 dark:from-[#0c1216] dark:via-[#0c1216] dark:to-[#0a0f12] border border-amber-400/30 dark:border-amber-400/20 rounded-[2.5rem] p-6 shadow-md shadow-slate-900/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex gap-4 items-start">
              <Sparkles className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0 mt-1" />
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-widest text-[#111439] dark:text-white">AI Curator Analysis</h4>
                <p className="text-xs text-[#4A5568] dark:text-white/70 leading-relaxed font-medium">
                  {curatorInsight}
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
