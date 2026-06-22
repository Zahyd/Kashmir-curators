import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Loader2, Plane, Calendar as CalendarIcon, Users, ArrowRight, CheckCircle, MapPin, ArrowLeftRight, Clock, ChevronDown, IndianRupee, TrendingUp, Minus, Plus, AlertCircle, Compass, Building, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { io } from 'socket.io-client';
import { API_BASE_URL, SOCKET_URL } from '@/lib/api';
import { format, addDays, isBefore, startOfToday } from 'date-fns';
import { cn } from '@/lib/utils';
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
            className={`w-full h-16 pl-12 pr-4 rounded-xl border bg-[#0a0f12] text-left flex items-center transition-all duration-300 group ${
              open 
                ? 'border-kashmir-gold/60 ring-1 ring-kashmir-gold/30 shadow-[0_0_20px_rgba(212,175,55,0.08)]' 
                : 'border-white/10 hover:border-white/20'
            }`}
          >
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <CalendarIcon className={`h-5 w-5 transition-colors duration-300 ${open ? 'text-kashmir-gold' : 'text-kashmir-gold/70'}`} />
            </div>
            {date ? (
              <div className="flex flex-col">
                <span className="text-white font-semibold text-lg leading-tight">{format(date, 'dd MMM')}</span>
                <span className="text-white/30 text-xs">{format(date, 'EEEE, yyyy')}</span>
              </div>
            ) : (
              <span className="text-white/30 text-lg">{placeholder}</span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-auto p-0 bg-[#0d1317] border-white/10 shadow-2xl shadow-black/60 rounded-2xl overflow-hidden" 
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
            disabled={(d) => minDate ? isBefore(d, minDate) : isBefore(d, startOfToday())}
            initialFocus
            className="bg-[#0d1317] text-white"
            classNames={{
              months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
              month: "space-y-4",
              caption: "flex justify-center pt-1 relative items-center text-white",
              caption_label: "text-sm font-semibold text-white",
              nav: "space-x-1 flex items-center",
              nav_button: "h-8 w-8 bg-white/5 border border-white/10 rounded-lg p-0 hover:bg-kashmir-gold/20 hover:border-kashmir-gold/40 text-white/60 hover:text-white inline-flex items-center justify-center transition-all",
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              table: "w-full border-collapse space-y-1",
              head_row: "flex",
              head_cell: "text-white/30 rounded-md w-10 font-medium text-[0.75rem] uppercase",
              row: "flex w-full mt-1",
              cell: "h-10 w-10 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
              day: "h-10 w-10 p-0 font-normal text-white/70 hover:bg-kashmir-gold/20 hover:text-white rounded-lg transition-all inline-flex items-center justify-center",
              day_range_end: "day-range-end",
              day_selected: "bg-kashmir-gold text-black hover:bg-kashmir-gold hover:text-black focus:bg-kashmir-gold focus:text-black font-bold shadow-[0_0_12px_rgba(212,175,55,0.3)]",
              day_today: "bg-white/10 text-white font-bold ring-1 ring-white/20",
              day_outside: "text-white/15 opacity-50",
              day_disabled: "text-white/10 opacity-30 cursor-not-allowed",
              day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
              day_hidden: "invisible",
            }}
          />
        </PopoverContent>
      </Popover>
      <Label className="absolute -top-3 left-4 bg-[#0a0f12] px-2 text-xs font-semibold text-white/40 uppercase tracking-wider z-10">{label}</Label>
    </div>
  );
}

export function InteractiveTripPlanner() {
  const [step, setStep] = useState(1);
  const [currency, setCurrency] = useState<'INR' | 'USD' | 'AED'>('INR');
  
  const CURRENCY_RATES = {
    INR: { symbol: '₹', rate: 1, label: 'INR' },
    USD: { symbol: '$', rate: 0.012, label: 'USD' },
    AED: { symbol: 'AED ', rate: 0.044, label: 'AED' }
  };

  const formatPrice = (amount: number) => {
    const info = CURRENCY_RATES[currency];
    const converted = Math.round(amount * info.rate);
    return `${info.symbol}${converted.toLocaleString()}`;
  };

  const [formData, setFormData] = useState({
    origin: 'DEL',
    destination: 'SXR',
    departureDate: addDays(new Date(), 30) as Date | undefined,
    returnDate: undefined as Date | undefined,
    adults: 2,
    includeFlights: false,
    tripType: 'oneway' as 'oneway' | 'roundtrip',
    cabinClass: 'economy',
    departureTimePref: 'any',
    directOnly: false,
    name: '',
    email: '',
    phone: ''
  });

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
  };

  const handleSubmit = async () => {
    toast.loading('Curating your experience...');

    const originAirport = AIRPORTS.find(a => a.code === formData.origin);
    const destAirport = AIRPORTS.find(a => a.code === formData.destination);

    const flightDetailsObj = formData.includeFlights ? {
      includeFlights: true,
      origin: formData.origin,
      originCity: originAirport?.city || formData.origin,
      destination: formData.destination,
      destinationCity: destAirport?.city || formData.destination,
      departureDate: formData.departureDate ? format(formData.departureDate, 'yyyy-MM-dd') : undefined,
      returnDate: formData.returnDate ? format(formData.returnDate, 'yyyy-MM-dd') : undefined,
      tripType: formData.tripType,
      cabinClass: formData.cabinClass,
      departureTimePref: formData.departureTimePref,
      directOnly: formData.directOnly,
    } : { includeFlights: false };

    try {
      const res = await fetch(`${API_BASE_URL}/inquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: formData.name,
          email: formData.email,
          phone: formData.phone,
          destination: destAirport?.city || 'Bespoke Kashmir Experience',
          duration: `5 Nights`,
          travelers: String(formData.adults),
          budget: `TBD`,
          accommodation: formData.includeFlights ? 'Luxury Hotel + Flights' : 'Luxury Hotel Only',
          flightDetails: JSON.stringify(flightDetailsObj)
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
          {step < 4 && (
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-white/5 pb-6">
              <div className="flex-1">
                <StepIndicator />
              </div>
              <div className="flex items-center gap-2.5 self-center bg-white/5 border border-white/10 rounded-xl p-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-white/40 pl-2">Currency</span>
                {(['INR', 'USD', 'AED'] as const).map((curr) => (
                  <button
                    key={curr}
                    type="button"
                    onClick={() => setCurrency(curr)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                      currency === curr 
                        ? "bg-kashmir-gold text-black font-bold shadow-[0_2px_10px_rgba(212,175,55,0.2)]" 
                        : "text-white/40 hover:text-white"
                    )}
                  >
                    {curr}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Dates & Guests */}
          {step === 1 && (
            <div className="space-y-10 animate-in slide-in-from-right fade-in duration-500 max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-light text-white">When do you wish to travel?</h3>
                <p className="text-white/40 mt-2">Pick your dates and party size.</p>
              </div>

              {/* Calendar Date Pickers */}
              <div className="grid md:grid-cols-2 gap-6">
                <DatePickerField
                  date={formData.departureDate}
                  onSelect={(d) => setFormData(prev => ({ ...prev, departureDate: d }))}
                  label="Departure Date"
                  placeholder="Pick departure"
                />
                <DatePickerField
                  date={formData.returnDate}
                  onSelect={(d) => setFormData(prev => ({ ...prev, returnDate: d }))}
                  label="Return Date"
                  placeholder="Pick return (optional)"
                  minDate={formData.departureDate ? addDays(formData.departureDate, 1) : addDays(new Date(), 1)}
                />
              </div>

              {/* Guest Counter */}
              <div className="relative">
                <div className="flex items-center justify-between h-16 px-5 rounded-xl border border-white/10 bg-[#0a0f12]">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-kashmir-gold" />
                    <span className="text-white/60 text-sm">Travellers</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setFormData(prev => ({ ...prev, adults: Math.max(1, prev.adults - 1) }))}
                      className="w-9 h-9 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-white/50 hover:bg-kashmir-gold/10 hover:border-kashmir-gold/40 hover:text-white transition-all active:scale-90"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-white font-bold text-2xl w-8 text-center tabular-nums">{formData.adults}</span>
                    <button
                      onClick={() => setFormData(prev => ({ ...prev, adults: Math.min(12, prev.adults + 1) }))}
                      className="w-9 h-9 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-white/50 hover:bg-kashmir-gold/10 hover:border-kashmir-gold/40 hover:text-white transition-all active:scale-90"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <Label className="absolute -top-3 left-4 bg-[#0a0f12] px-2 text-xs font-semibold text-white/40 uppercase tracking-wider z-10">Guests</Label>
              </div>


            </div>
          )}

          {/* Step 2: Flights */}
          {step === 2 && (
            <div className="space-y-8 animate-in slide-in-from-right fade-in duration-500 max-w-3xl mx-auto">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-light text-white">Bespoke Flight Enquiry</h3>
                <p className="text-white/40 mt-2">Select your package structure and flight preferences.</p>
              </div>

              {/* Two Option Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, includeFlights: false }))}
                  className={cn(
                    "p-6 rounded-[2rem] border text-left transition-all duration-500 relative overflow-hidden group hover:scale-[1.02]",
                    !formData.includeFlights 
                      ? "border-kashmir-gold bg-kashmir-gold/[0.03] shadow-[0_0_30px_rgba(212,175,55,0.08)]" 
                      : "border-white/5 bg-white/[0.01] hover:border-white/20"
                  )}
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-kashmir-gold/5 blur-2xl group-hover:scale-150 transition-all duration-700" />
                  <div className="flex justify-between items-start mb-4">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-500",
                      !formData.includeFlights ? "border-kashmir-gold bg-kashmir-gold/10 text-kashmir-gold" : "border-white/10 text-white/40"
                    )}>
                      <Compass className="w-6 h-6" />
                    </div>
                    {!formData.includeFlights && (
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] bg-kashmir-gold text-black px-2.5 py-0.5 rounded-full">Selected</span>
                    )}
                  </div>
                  <h4 className="font-bold text-white text-lg mb-1.5 uppercase tracking-wide">Ground Package Only</h4>
                  <p className="text-xs text-white/40 leading-relaxed font-medium">
                    Excludes flights. Includes 5-star hotels, luxury houseboats, private chauffeurs, spa credits, and local VIP access passes.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, includeFlights: true }))}
                  className={cn(
                    "p-6 rounded-[2rem] border text-left transition-all duration-500 relative overflow-hidden group hover:scale-[1.02]",
                    formData.includeFlights 
                      ? "border-kashmir-gold bg-kashmir-gold/[0.03] shadow-[0_0_30px_rgba(212,175,55,0.08)]" 
                      : "border-white/5 bg-white/[0.01] hover:border-white/20"
                  )}
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-kashmir-gold/5 blur-2xl group-hover:scale-150 transition-all duration-700" />
                  <div className="flex justify-between items-start mb-4">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-500",
                      formData.includeFlights ? "border-kashmir-gold bg-kashmir-gold/10 text-kashmir-gold" : "border-white/10 text-white/40"
                    )}>
                      <Plane className="w-6 h-6" />
                    </div>
                    {formData.includeFlights && (
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] bg-kashmir-gold text-black px-2.5 py-0.5 rounded-full">Selected</span>
                    )}
                  </div>
                  <h4 className="font-bold text-white text-lg mb-1.5 uppercase tracking-wide">Land + Air Package</h4>
                  <p className="text-xs text-white/40 leading-relaxed font-medium">
                    Includes premium flight tickets coordinated directly with your tour itinerary, private transfers, and luxury accommodations.
                  </p>
                </button>
              </div>

              {formData.includeFlights && (
                <div className="space-y-6 pt-4 border-t border-white/5 animate-in fade-in duration-500">
                  {/* Trip Type Selector */}
                  <div className="flex bg-white/[0.03] rounded-xl border border-white/5 p-1 w-fit">
                    {(['oneway', 'roundtrip'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        className={cn(
                          "px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all",
                          formData.tripType === type 
                            ? "bg-kashmir-gold text-black font-bold shadow-md" 
                            : "text-white/40 hover:text-white"
                        )}
                        onClick={() => setFormData(prev => ({ ...prev, tripType: type }))}
                      >
                        {type === 'oneway' ? 'One Way' : 'Round Trip'}
                      </button>
                    ))}
                  </div>

                  {/* Airport Search Fields */}
                  <div className="flex flex-col md:flex-row items-center gap-4">
                    <AirportSearchInput
                      value={formData.origin}
                      onChange={(code) => setFormData(prev => ({ ...prev, origin: code }))}
                      label="Departure Airport"
                      icon={Plane}
                      placeholder="Departure City (e.g. DEL)"
                      excludeCode={formData.destination}
                    />

                    <button
                      type="button"
                      onClick={swapAirports}
                      className="w-12 h-12 rounded-full border border-white/10 bg-white/5 flex items-center justify-center hover:bg-kashmir-gold/10 hover:border-kashmir-gold/40 transition-all duration-300 active:scale-95 group"
                      title="Swap cities"
                    >
                      <ArrowLeftRight className="w-5 h-5 text-white/40 group-hover:text-kashmir-gold" />
                    </button>

                    <AirportSearchInput
                      value={formData.destination}
                      onChange={(code) => setFormData(prev => ({ ...prev, destination: code }))}
                      label="Arrival Airport"
                      icon={MapPin}
                      placeholder="Arrival City (e.g. SXR)"
                      excludeCode={formData.origin}
                    />
                  </div>

                  {/* Cabin Class Selection Grid */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Cabin Class Preference</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { value: 'economy', label: 'Economy Class', desc: 'Standard tourist class' },
                        { value: 'premium_economy', label: 'Premium Economy', desc: 'Added legroom & comfort' },
                        { value: 'business', label: 'Business Class', desc: 'Elite flat-bed / premium lounge' }
                      ].map(cls => (
                        <button
                          key={cls.value}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, cabinClass: cls.value }))}
                          className={cn(
                            "p-4 rounded-2xl border text-left transition-all duration-300 hover:scale-[1.02]",
                            formData.cabinClass === cls.value
                              ? "border-kashmir-gold bg-kashmir-gold/5 shadow-[0_0_15px_rgba(212,175,55,0.05)] text-white"
                              : "border-white/5 bg-[#0a0f12]/40 text-white/60 hover:border-white/10 hover:text-white"
                          )}
                        >
                          <p className="text-xs font-black uppercase tracking-wider mb-1">{cls.label}</p>
                          <p className="text-[10px] text-white/30 leading-none">{cls.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Timing Preference Options */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Preferred Departure Time</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { value: 'any', label: 'Anytime', desc: 'Best fare' },
                        { value: 'morning', label: 'Morning', desc: '6 AM - 12 PM' },
                        { value: 'afternoon', label: 'Afternoon', desc: '12 PM - 6 PM' },
                        { value: 'evening', label: 'Evening', desc: '6 PM - 12 AM' }
                      ].map(t => (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, departureTimePref: t.value }))}
                          className={cn(
                            "py-3 px-4 rounded-xl border text-center transition-all duration-300",
                            formData.departureTimePref === t.value
                              ? "border-kashmir-gold bg-kashmir-gold/5 text-white"
                              : "border-white/5 bg-[#0a0f12]/40 text-white/40 hover:border-white/10 hover:text-white"
                          )}
                        >
                          <p className="text-[10px] font-black uppercase tracking-wider leading-none mb-0.5">{t.label}</p>
                          <p className="text-[9px] text-white/30 leading-none">{t.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Direct Flights Switch */}
                  <div className="p-4 rounded-2xl bg-[#0a0f12]/40 border border-white/5 flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-bold text-white uppercase tracking-wider">Direct Flights Only</h5>
                      <p className="text-[10px] text-white/30">Exclude flights with layovers / stops</p>
                    </div>
                    <Switch
                      checked={formData.directOnly}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, directOnly: checked }))}
                      className="data-[state=checked]:bg-kashmir-gold"
                    />
                  </div>

                  {/* Concierge Guarantee Info Box */}
                  <div className="p-5 rounded-3xl bg-kashmir-gold/5 border border-kashmir-gold/10 flex gap-4 items-start text-left">
                    <Sparkles className="w-5 h-5 text-kashmir-gold shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-[10px] font-black text-white uppercase tracking-wider mb-1">Direct Flight Inventory Sync</h5>
                      <p className="text-[10px] text-white/50 leading-relaxed">
                        Instead of instant online tickets that have high markup margins and booking fees, our operations desk curates B2B air fares directly. We will match flights from premier airlines (such as Air India, Vistara, and IndiGo) tailored to your exact timings and budget.
                      </p>
                    </div>
                  </div>
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

              <div className="mt-8">
                <Button onClick={() => window.location.reload()} variant="outline" className="rounded-full px-8 h-12 border-white/10 text-white hover:bg-white/5">
                  Plan Another Trip
                </Button>
              </div>
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
