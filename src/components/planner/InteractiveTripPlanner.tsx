import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Plane, Calendar as CalendarIcon, Users, ArrowRight, CheckCircle, MapPin, ArrowLeftRight, Clock, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { io } from 'socket.io-client';
import { API_BASE_URL, SOCKET_URL } from '@/lib/api';

// Comprehensive Indian airport database
const AIRPORTS = [
  { code: 'SXR', city: 'Srinagar', name: 'Sheikh Ul-Alam Intl', state: 'J&K' },
  { code: 'DEL', city: 'New Delhi', name: 'Indira Gandhi Intl', state: 'Delhi' },
  { code: 'BOM', city: 'Mumbai', name: 'Chhatrapati Shivaji Intl', state: 'Maharashtra' },
  { code: 'BLR', city: 'Bengaluru', name: 'Kempegowda Intl', state: 'Karnataka' },
  { code: 'MAA', city: 'Chennai', name: 'Chennai Intl', state: 'Tamil Nadu' },
  { code: 'CCU', city: 'Kolkata', name: 'Netaji Subhas Chandra Bose Intl', state: 'West Bengal' },
  { code: 'HYD', city: 'Hyderabad', name: 'Rajiv Gandhi Intl', state: 'Telangana' },
  { code: 'AMD', city: 'Ahmedabad', name: 'Sardar Vallabhbhai Patel Intl', state: 'Gujarat' },
  { code: 'PNQ', city: 'Pune', name: 'Pune Airport', state: 'Maharashtra' },
  { code: 'JAI', city: 'Jaipur', name: 'Jaipur Intl', state: 'Rajasthan' },
  { code: 'LKO', city: 'Lucknow', name: 'Chaudhary Charan Singh Intl', state: 'Uttar Pradesh' },
  { code: 'GOI', city: 'Goa', name: 'Manohar Intl', state: 'Goa' },
  { code: 'COK', city: 'Kochi', name: 'Cochin Intl', state: 'Kerala' },
  { code: 'GAU', city: 'Guwahati', name: 'Lokpriya Gopinath Intl', state: 'Assam' },
  { code: 'PAT', city: 'Patna', name: 'Jay Prakash Narayan Intl', state: 'Bihar' },
  { code: 'IXC', city: 'Chandigarh', name: 'Chandigarh Intl', state: 'Chandigarh' },
  { code: 'ATQ', city: 'Amritsar', name: 'Sri Guru Ram Dass Jee Intl', state: 'Punjab' },
  { code: 'VNS', city: 'Varanasi', name: 'Lal Bahadur Shastri Intl', state: 'Uttar Pradesh' },
  { code: 'IXJ', city: 'Jammu', name: 'Jammu Airport', state: 'J&K' },
  { code: 'IXL', city: 'Leh', name: 'Kushok Bakula Rimpochee', state: 'Ladakh' },
];

function AirportSearchInput({
  value,
  onChange,
  label,
  icon: Icon,
  placeholder,
  excludeCode,
}: {
  value: string;
  onChange: (code: string) => void;
  label: string;
  icon: React.ElementType;
  placeholder: string;
  excludeCode?: string;
}) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = AIRPORTS.find(a => a.code === value);

  const filteredAirports = AIRPORTS.filter(a => {
    if (a.code === excludeCode) return false;
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      a.code.toLowerCase().includes(q) ||
      a.city.toLowerCase().includes(q) ||
      a.name.toLowerCase().includes(q) ||
      a.state.toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative flex-1 min-w-0">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
        <Icon className={`h-5 w-5 transition-colors duration-300 ${isFocused ? 'text-kashmir-gold' : 'text-kashmir-gold/70'}`} />
      </div>
      <div
        className={`pl-12 pr-4 h-16 w-full rounded-xl border bg-[#0a0f12] text-lg text-white flex items-center cursor-pointer transition-all duration-300 ${
          isFocused ? 'border-kashmir-gold/60 ring-1 ring-kashmir-gold/30 shadow-[0_0_20px_rgba(212,175,55,0.08)]' : 'border-white/10 hover:border-white/20'
        }`}
        onClick={() => {
          setIsOpen(true);
          setIsFocused(true);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
      >
        {isOpen ? (
          <input
            ref={inputRef}
            className="bg-transparent w-full outline-none text-white placeholder:text-white/30"
            placeholder={placeholder}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => { setIsOpen(true); setIsFocused(true); }}
          />
        ) : (
          <div className="flex items-center gap-3 w-full overflow-hidden">
            {selected ? (
              <>
                <span className="font-bold text-kashmir-gold text-xl tracking-wider">{selected.code}</span>
                <span className="text-white/50 text-sm truncate">{selected.city}</span>
              </>
            ) : (
              <span className="text-white/30">{placeholder}</span>
            )}
            <ChevronDown className="w-4 h-4 text-white/30 ml-auto flex-shrink-0" />
          </div>
        )}
      </div>
      <Label className="absolute -top-3 left-4 bg-[#0a0f12] px-2 text-xs font-semibold text-white/40 uppercase tracking-wider z-10">{label}</Label>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#0d1317] border border-white/10 rounded-xl shadow-2xl shadow-black/40 z-50 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
          {filteredAirports.length === 0 ? (
            <div className="px-4 py-6 text-center text-white/30 text-sm">No airports found</div>
          ) : (
            filteredAirports.map(airport => (
              <div
                key={airport.code}
                className={`px-4 py-3 flex items-center gap-3 cursor-pointer transition-all duration-200 hover:bg-white/5 ${
                  value === airport.code ? 'bg-kashmir-gold/10 border-l-2 border-kashmir-gold' : 'border-l-2 border-transparent'
                }`}
                onClick={() => {
                  onChange(airport.code);
                  setQuery('');
                  setIsOpen(false);
                  setIsFocused(false);
                }}
              >
                <span className="font-bold text-kashmir-gold text-sm w-10">{airport.code}</span>
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium truncate">{airport.city}</p>
                  <p className="text-white/30 text-xs truncate">{airport.name}</p>
                </div>
                <span className="ml-auto text-white/20 text-xs flex-shrink-0">{airport.state}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export function InteractiveTripPlanner() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    origin: 'DEL',
    destination: 'SXR',
    date: '2026-10-15',
    returnDate: '',
    adults: 2,
    includeFlights: false,
    tripType: 'oneway' as 'oneway' | 'roundtrip',
    cabinClass: 'economy',
    name: '',
    email: '',
    phone: ''
  });

  const [isSearchingFlights, setIsSearchingFlights] = useState(false);
  const [flightOffers, setFlightOffers] = useState<any[]>([]);
  const [selectedFlight, setSelectedFlight] = useState<any>(null);

  const [heroTitle, setHeroTitle] = useState('Design Your Journey');
  const [heroSubtitle, setHeroSubtitle] = useState('BESPOKE TRAVEL CURATED FOR YOU');
  const [heroImage, setHeroImage] = useState('https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&q=80');

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/site-content`);
        if (response.ok) {
          const data = await response.json();
          if (data.journeyHero) {
            setHeroTitle(data.journeyHero.title || 'Design Your Journey');
            setHeroSubtitle(data.journeyHero.subtitle || 'BESPOKE TRAVEL CURATED FOR YOU');
            setHeroImage(data.journeyHero.image_url || 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&q=80');
          }
        }
      } catch (error) {
        console.error('[InteractiveTripPlanner] Error loading content:', error);
      }
    };
    fetchContent();

    const socket = io(SOCKET_URL);
    socket.on('site-content-updated', (data) => {
      if (data && data.section_key === 'journeyHero') {
        setHeroTitle(data.title || 'Design Your Journey');
        setHeroSubtitle(data.subtitle || 'BESPOKE TRAVEL CURATED FOR YOU');
        setHeroImage(data.image_url || 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&q=80');
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const renderSplitTitle = (title: string) => {
    const words = title.split(' ');
    if (words.length <= 1) return title;
    const lastWord = words.pop();
    return (
      <>
        {words.join(' ')}{' '}
        <span className="text-kashmir-gold italic">{lastWord}</span>
      </>
    );
  };

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const swapAirports = () => {
    setFormData(prev => ({
      ...prev,
      origin: prev.destination,
      destination: prev.origin
    }));
    setFlightOffers([]);
    setSelectedFlight(null);
  };

  const searchFlights = async () => {
    setIsSearchingFlights(true);
    setSelectedFlight(null);
    try {
      const params = new URLSearchParams({
        origin: formData.origin,
        destination: formData.destination,
        date: formData.date,
        adults: formData.adults.toString(),
        cabinClass: formData.cabinClass,
      });
      const res = await fetch(`${API_BASE_URL}/flights/search?${params}`);
      const data = await res.json();
      if (data.success) {
        setFlightOffers(data.offers);
        const originAirport = AIRPORTS.find(a => a.code === formData.origin);
        const destAirport = AIRPORTS.find(a => a.code === formData.destination);
        toast.success(`Found ${data.offers.length} flights from ${originAirport?.city || formData.origin} to ${destAirport?.city || formData.destination}`);
      } else {
        toast.error(data.message || 'Failed to fetch flights.');
      }
    } catch (e) {
      toast.error('Network error fetching flights.');
    } finally {
      setIsSearchingFlights(false);
    }
  };

  const handleFlightToggle = (checked: boolean) => {
    setFormData(prev => ({ ...prev, includeFlights: checked }));
    if (checked && flightOffers.length === 0) {
      searchFlights();
    }
  };

  const formatDuration = (iso: string) => {
    const match = iso.match(/PT(\d+)H(\d+)M/);
    if (!match) return iso;
    return `${match[1]}h ${match[2]}m`;
  };

  const handleSubmit = async () => {
    toast.loading('Curating your experience...');
    
    const basePrice = formData.adults * 15000;
    const flightPrice = selectedFlight ? parseInt(selectedFlight.totalAmount) * formData.adults : 0;
    const totalEstimate = basePrice + flightPrice;

    const originAirport = AIRPORTS.find(a => a.code === formData.origin);
    const destAirport = AIRPORTS.find(a => a.code === formData.destination);

    try {
      const res = await fetch(`${API_BASE_URL}/inquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: formData.name,
          email: formData.email,
          phone: formData.phone,
          destination: destAirport?.city || 'Bespoke Kashmir Experience',
          duration: '6 Days',
          travelers: String(formData.adults),
          budget: `₹${totalEstimate.toLocaleString()}`,
          accommodation: formData.includeFlights ? 'Luxury Hotel + Flights' : 'Luxury Hotel Only',
          message: `Custom Build. Route: ${originAirport?.city || formData.origin} → ${destAirport?.city || formData.destination}. Guests: ${formData.adults}. Flights: ${formData.includeFlights}. Cabin: ${formData.cabinClass}. Trip: ${formData.tripType}. Budget: ₹${totalEstimate.toLocaleString()}`,
        })
      });

      if (res.ok) {
        toast.dismiss();
        setStep(4);
      } else {
        toast.dismiss();
        toast.error('Failed to submit request.');
      }
    } catch (e) {
      toast.dismiss();
      toast.error('Failed to submit request.');
    }
  };

  const CABIN_CLASSES = [
    { value: 'economy', label: 'Economy' },
    { value: 'premium_economy', label: 'Premium Economy' },
    { value: 'business', label: 'Business' },
  ];

  const StepIndicator = () => (
    <div className="flex items-center justify-center space-x-4 mb-12">
      {[1, 2, 3].map((num) => (
        <div key={num} className="flex items-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
            step === num 
              ? 'border-kashmir-gold bg-kashmir-gold text-black shadow-[0_0_20px_rgba(212,175,55,0.3)]' 
              : step > num 
                ? 'border-kashmir-gold text-kashmir-gold bg-white/5' 
                : 'border-white/10 text-white/40 bg-white/[0.02]'
          }`}>
            {step > num ? <CheckCircle className="w-5 h-5" /> : <span className="font-medium text-lg">{num}</span>}
          </div>
          {num < 3 && (
            <div className={`w-16 h-[2px] mx-2 transition-colors duration-500 ${step > num ? 'bg-kashmir-gold' : 'bg-white/10'}`} />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="w-full max-w-4xl mx-auto py-12 relative">
      {/* Decorative blurred background elements for luxury feel */}
      <div className="absolute top-0 -left-10 w-40 h-40 bg-kashmir-gold/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 -right-10 w-60 h-60 bg-blue-900/5 rounded-full blur-3xl" />

      <div className="bg-[#0a0f12]/60 backdrop-blur-3xl border border-white/5 shadow-2xl rounded-[3rem] overflow-hidden relative z-10">
        <div className="bg-slate-950 px-8 py-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `url("${heroImage}")`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent"></div>
          <h2 className="text-4xl md:text-5xl font-light text-white relative z-10 mb-3 tracking-wide">{renderSplitTitle(heroTitle)}</h2>
          <p className="text-white/70 relative z-10 font-bold tracking-widest text-[10px] uppercase">{heroSubtitle}</p>
        </div>

        <div className="p-8 md:p-12">
          {step < 4 && <StepIndicator />}

          {/* Step 1: Basics */}
          {step === 1 && (
            <div className="space-y-10 animate-in slide-in-from-right fade-in duration-500 max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-light text-white">When do you wish to travel?</h3>
                <p className="text-white/40 mt-2">Select your intended dates and party size.</p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="group relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <CalendarIcon className="h-5 w-5 text-kashmir-gold group-focus-within:text-kashmir-gold transition-colors" />
                  </div>
                  <Input 
                    type="date" 
                    value={formData.date} 
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="pl-12 h-14 bg-white/5 border-white/10 rounded-xl text-white text-lg focus-visible:ring-kashmir-gold transition-all"
                  />
                  <Label className="absolute -top-3 left-4 bg-[#0a0f12] px-2 text-xs font-semibold text-white/40 uppercase tracking-wider">Arrival Date</Label>
                </div>

                <div className="group relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Users className="h-5 w-5 text-kashmir-gold" />
                  </div>
                  <Input 
                    type="number" 
                    min="1" 
                    value={formData.adults} 
                    onChange={e => setFormData({ ...formData, adults: parseInt(e.target.value) })}
                    className="pl-12 h-14 bg-white/5 border-white/10 rounded-xl text-white text-lg focus-visible:ring-kashmir-gold transition-all"
                  />
                  <Label className="absolute -top-3 left-4 bg-[#0a0f12] px-2 text-xs font-semibold text-white/40 uppercase tracking-wider">Guests</Label>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Flights */}
          {step === 2 && (
            <div className="space-y-8 animate-in slide-in-from-right fade-in duration-500 max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-light text-white">Arrival Logistics</h3>
                <p className="text-white/40 mt-2">We'll find the best flights for your journey.</p>
              </div>

              <div className="p-6 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-between transition-all hover:border-kashmir-gold/50 hover:shadow-md">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/5 shadow-sm border border-white/10 flex items-center justify-center">
                    <Plane className="w-6 h-6 text-kashmir-gold" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white text-lg">Include Premium Flights</h4>
                    <p className="text-sm text-white/40">Live pricing for your route</p>
                  </div>
                </div>
                <Switch 
                  checked={formData.includeFlights} 
                  onCheckedChange={handleFlightToggle}
                  className="data-[state=checked]:bg-kashmir-gold"
                />
              </div>

              {formData.includeFlights && (
                <div className="space-y-6 pt-4 animate-in fade-in duration-500">
                  {/* Trip Type & Cabin Class Row */}
                  <div className="flex flex-wrap gap-3">
                    <div className="flex bg-white/5 rounded-lg border border-white/10 p-1">
                      <button
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                          formData.tripType === 'oneway' ? 'bg-kashmir-gold text-black' : 'text-white/50 hover:text-white'
                        }`}
                        onClick={() => setFormData(prev => ({ ...prev, tripType: 'oneway' }))}
                      >
                        One Way
                      </button>
                      <button
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                          formData.tripType === 'roundtrip' ? 'bg-kashmir-gold text-black' : 'text-white/50 hover:text-white'
                        }`}
                        onClick={() => setFormData(prev => ({ ...prev, tripType: 'roundtrip' }))}
                      >
                        Round Trip
                      </button>
                    </div>

                    <div className="relative flex-shrink-0">
                      <select
                        className="h-10 px-4 rounded-lg border border-white/10 bg-[#0a0f12] text-sm text-white/70 focus:ring-kashmir-gold focus:border-kashmir-gold transition-all appearance-none pr-8 cursor-pointer"
                        value={formData.cabinClass}
                        onChange={e => {
                          setFormData(prev => ({ ...prev, cabinClass: e.target.value }));
                          setFlightOffers([]);
                        }}
                      >
                        {CABIN_CLASSES.map(c => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                    </div>
                  </div>

                  {/* Departure & Arrival Airport Selection */}
                  <div className="flex items-center gap-2">
                    <AirportSearchInput
                      value={formData.origin}
                      onChange={(code) => {
                        setFormData(prev => ({ ...prev, origin: code }));
                        setFlightOffers([]);
                      }}
                      label="From"
                      icon={Plane}
                      placeholder="Search departure city..."
                      excludeCode={formData.destination}
                    />

                    <button
                      onClick={swapAirports}
                      className="flex-shrink-0 w-12 h-12 rounded-full border border-white/10 bg-white/5 flex items-center justify-center hover:bg-kashmir-gold/10 hover:border-kashmir-gold/40 active:scale-90 transition-all duration-300 group"
                      title="Swap airports"
                    >
                      <ArrowLeftRight className="w-5 h-5 text-white/40 group-hover:text-kashmir-gold transition-colors" />
                    </button>

                    <AirportSearchInput
                      value={formData.destination}
                      onChange={(code) => {
                        setFormData(prev => ({ ...prev, destination: code }));
                        setFlightOffers([]);
                      }}
                      label="To"
                      icon={MapPin}
                      placeholder="Search arrival city..."
                      excludeCode={formData.origin}
                    />
                  </div>

                  {/* Return date for round trip */}
                  {formData.tripType === 'roundtrip' && (
                    <div className="group relative animate-in fade-in duration-300">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <CalendarIcon className="h-5 w-5 text-kashmir-gold" />
                      </div>
                      <Input
                        type="date"
                        value={formData.returnDate}
                        min={formData.date}
                        onChange={e => setFormData(prev => ({ ...prev, returnDate: e.target.value }))}
                        className="pl-12 h-14 bg-white/5 border-white/10 rounded-xl text-white text-lg focus-visible:ring-kashmir-gold transition-all"
                      />
                      <Label className="absolute -top-3 left-4 bg-[#0a0f12] px-2 text-xs font-semibold text-white/40 uppercase tracking-wider">Return Date</Label>
                    </div>
                  )}

                  {/* Search Button */}
                  <Button
                    onClick={searchFlights}
                    disabled={isSearchingFlights}
                    className="w-full h-14 bg-white hover:bg-kashmir-gold text-black font-bold rounded-xl transition-all text-lg shadow-lg"
                  >
                    {isSearchingFlights ? (
                      <><Loader2 className="animate-spin w-5 h-5 mr-2" /> Searching flights...</>
                    ) : (
                      <><Plane className="w-5 h-5 mr-2" /> Search Flights</>
                    )}
                  </Button>

                  {/* Flight Results */}
                  {flightOffers.length > 0 && (
                    <div className="space-y-4 mt-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-white/40 uppercase tracking-wider pl-1">
                          {AIRPORTS.find(a => a.code === formData.origin)?.city || formData.origin} → {AIRPORTS.find(a => a.code === formData.destination)?.city || formData.destination}
                        </h4>
                        <span className="text-xs text-white/20">{flightOffers.length} flights found</span>
                      </div>
                      <div className="grid gap-3">
                        {flightOffers.map(offer => (
                          <div 
                            key={offer.offerId}
                            onClick={() => setSelectedFlight(offer)}
                            className={`p-5 rounded-xl border cursor-pointer transition-all duration-300 ${
                              selectedFlight?.offerId === offer.offerId 
                                ? 'border-kashmir-gold bg-kashmir-gold/10 shadow-[0_0_15px_rgba(212,175,55,0.1)] ring-1 ring-kashmir-gold' 
                                : 'border-white/10 bg-white/5 hover:border-white/20 hover:shadow-md text-white'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                {offer.airlineLogo ? (
                                  <div className="w-11 h-11 bg-white rounded-lg shadow-sm border border-slate-100 p-1 flex items-center justify-center flex-shrink-0">
                                    <img src={offer.airlineLogo} alt={offer.airlineName} className="max-w-full max-h-full object-contain" />
                                  </div>
                                ) : (
                                  <div className="w-11 h-11 bg-white/5 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Plane className="w-5 h-5 text-kashmir-gold" />
                                  </div>
                                )}
                                <div>
                                  <p className="font-semibold text-white">{offer.airlineName}</p>
                                  <div className="flex items-center text-sm text-white/40 mt-1 space-x-2 flex-wrap">
                                    <span className="font-medium text-white/60">{offer.departureTime.split('T')[1]?.substring(0,5)}</span>
                                    <div className="flex items-center gap-1">
                                      <div className="w-1.5 h-1.5 rounded-full bg-kashmir-gold/50" />
                                      <div className="w-8 h-[1px] bg-white/10 relative">
                                        {(offer.stops > 0) && (
                                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-orange-400/60 border border-orange-400" />
                                        )}
                                      </div>
                                      <div className="w-1.5 h-1.5 rounded-full bg-kashmir-gold" />
                                    </div>
                                    <span className="font-medium text-white/60">{offer.arrivalTime.split('T')[1]?.substring(0,5)}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0 ml-4">
                                <p className="text-xl font-light text-white">₹{parseInt(offer.totalAmount).toLocaleString()}</p>
                                <div className="flex items-center gap-2 justify-end mt-1">
                                  <div className="flex items-center text-white/30 text-xs">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {offer.duration ? formatDuration(offer.duration) : '—'}
                                  </div>
                                  <span className="text-[10px] font-medium text-white/20 uppercase">
                                    {offer.stops === 0 ? 'Direct' : `${offer.stops} stop`}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Contact */}
          {step === 3 && (
            <div className="space-y-8 animate-in slide-in-from-right fade-in duration-500 max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-light text-white">Curator Contact</h3>
                <p className="text-white/40 mt-2">Where should we send your personalized itinerary?</p>
              </div>

              <div className="space-y-6">
                <div className="group relative">
                  <Input 
                    value={formData.name} 
                    onChange={e => setFormData({ ...formData, name: e.target.value })} 
                    className="h-14 bg-white/5 border-white/10 rounded-xl text-white text-lg focus-visible:ring-kashmir-gold transition-all px-4" 
                    placeholder="E.g. James Kensington"
                  />
                  <Label className="absolute -top-3 left-4 bg-[#0a0f12] px-2 text-xs font-semibold text-white/40 uppercase tracking-wider">Full Name</Label>
                </div>
                
                <div className="group relative">
                  <Input 
                    type="email" 
                    value={formData.email} 
                    onChange={e => setFormData({ ...formData, email: e.target.value })} 
                    className="h-14 bg-white/5 border-white/10 rounded-xl text-white text-lg focus-visible:ring-kashmir-gold transition-all px-4"
                    placeholder="james@example.com"
                  />
                  <Label className="absolute -top-3 left-4 bg-[#0a0f12] px-2 text-xs font-semibold text-white/40 uppercase tracking-wider">Email Address</Label>
                </div>

                <div className="group relative">
                  <Input 
                    type="tel" 
                    value={formData.phone} 
                    onChange={e => setFormData({ ...formData, phone: e.target.value })} 
                    className="h-14 bg-white/5 border-white/10 rounded-xl text-white text-lg focus-visible:ring-kashmir-gold transition-all px-4"
                    placeholder="+91 98765 43210"
                  />
                  <Label className="absolute -top-3 left-4 bg-[#0a0f12] px-2 text-xs font-semibold text-white/40 uppercase tracking-wider">WhatsApp Number</Label>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Success */}
          {step === 4 && (
            <div className="text-center py-16 animate-in zoom-in duration-700">
              <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-emerald-500/20">
                <CheckCircle className="w-12 h-12 text-emerald-400" />
              </div>
              <h2 className="text-4xl font-light text-white mb-4">Request Received</h2>
              <p className="text-lg text-white/60 max-w-md mx-auto leading-relaxed">
                Our luxury travel curators are meticulously analyzing your preferences and securing the best rates. You will receive a WhatsApp message shortly.
              </p>
              <Button onClick={() => window.location.reload()} variant="outline" className="mt-10 rounded-full px-8 h-12 border-white/10 text-white hover:bg-white/5">
                Plan Another Trip
              </Button>
            </div>
          )}
        </div>
        
        {step < 4 && (
          <div className="flex justify-between items-center px-8 md:px-12 py-6 bg-[#0a0f12]/40 backdrop-blur-3xl border-t border-white/5 mt-4">
            <Button 
              variant="ghost" 
              onClick={handleBack} 
              disabled={step === 1}
              className={`text-white/40 hover:text-white hover:bg-white/5 transition-colors ${step === 1 ? 'opacity-0' : 'opacity-100'}`}
            >
              Back
            </Button>
            
            {step < 3 ? (
              <Button 
                onClick={handleNext} 
                className="bg-white text-black hover:bg-kashmir-gold hover:text-black rounded-full px-8 h-12 transition-all shadow-lg font-bold"
              >
                Continue <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit} 
                disabled={!formData.name || !formData.phone} 
                className="bg-kashmir-gold hover:bg-amber-600 text-black rounded-full px-8 h-12 transition-all shadow-lg shadow-kashmir-gold/20 font-bold tracking-wide"
              >
                Submit Request <CheckCircle className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
