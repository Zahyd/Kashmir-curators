import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Plane, Calendar as CalendarIcon, Users, ArrowRight, CheckCircle, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { io } from 'socket.io-client';
import { API_BASE_URL, SOCKET_URL } from '@/lib/api';

export function InteractiveTripPlanner() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    origin: 'DEL',
    date: '2026-10-15',
    adults: 2,
    includeFlights: false,
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

  const searchFlights = async () => {
    setIsSearchingFlights(true);
    try {
      const res = await fetch(`${API_BASE_URL}/flights/search?origin=${formData.origin}&date=${formData.date}&adults=${formData.adults}`);
      const data = await res.json();
      if (data.success) {
        setFlightOffers(data.offers);
        toast.success(`Found ${data.offers.length} flight options from ${formData.origin}`);
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

  const handleSubmit = async () => {
    toast.loading('Curating your experience...');
    
    const basePrice = formData.adults * 15000;
    const flightPrice = selectedFlight ? parseInt(selectedFlight.totalAmount) * formData.adults : 0;
    const totalEstimate = basePrice + flightPrice;

    try {
      const res = await fetch(`${API_BASE_URL}/inquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: formData.name,
          email: formData.email,
          phone: formData.phone,
          destination: 'Bespoke Srinagar Experience',
          duration: '6 Days',
          travelers: String(formData.adults),
          budget: `₹${totalEstimate.toLocaleString()}`,
          accommodation: formData.includeFlights ? 'Luxury Hotel + Flights' : 'Luxury Hotel Only',
          message: `Custom Build. Guests: ${formData.adults}. Include Flights: ${formData.includeFlights}. Origin: ${formData.origin}. Estimated Budget: ₹${totalEstimate.toLocaleString()}`,
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
                <p className="text-white/40 mt-2">Let us handle your flights to Srinagar (SXR).</p>
              </div>

              <div className="p-6 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-between transition-all hover:border-kashmir-gold/50 hover:shadow-md">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/5 shadow-sm border border-white/10 flex items-center justify-center">
                    <Plane className="w-6 h-6 text-kashmir-gold" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white text-lg">Include Premium Flights</h4>
                    <p className="text-sm text-white/40">Live pricing from your home city</p>
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
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <MapPin className="h-5 w-5 text-kashmir-gold" />
                    </div>
                    <select 
                      className="pl-12 h-14 w-full rounded-xl border border-white/10 bg-[#0a0f12] text-lg text-white focus:ring-kashmir-gold focus:border-kashmir-gold transition-all appearance-none"
                      value={formData.origin}
                      onChange={e => {
                        setFormData({ ...formData, origin: e.target.value });
                        setFlightOffers([]);
                      }}
                    >
                      <option value="DEL">Departing from New Delhi (DEL)</option>
                      <option value="BOM">Departing from Mumbai (BOM)</option>
                      <option value="BLR">Departing from Bengaluru (BLR)</option>
                      <option value="MAA">Departing from Chennai (MAA)</option>
                    </select>
                    <Label className="absolute -top-3 left-4 bg-[#0a0f12] px-2 text-xs font-semibold text-white/40 uppercase tracking-wider">Origin City</Label>
                    
                    <Button 
                      onClick={searchFlights} 
                      disabled={isSearchingFlights} 
                      className="absolute right-2 top-2 h-10 px-6 bg-white hover:bg-kashmir-gold hover:text-black text-black font-bold rounded-lg transition-all"
                    >
                      {isSearchingFlights ? <Loader2 className="animate-spin w-4 h-4" /> : 'Search'}
                    </Button>
                  </div>

                  {flightOffers.length > 0 && (
                    <div className="space-y-4 mt-8">
                      <h4 className="text-sm font-semibold text-white/40 uppercase tracking-wider pl-1">Available Direct Flights</h4>
                      <div className="grid gap-4">
                        {flightOffers.map(offer => (
                          <div 
                            key={offer.offerId}
                            onClick={() => setSelectedFlight(offer)}
                            className={`p-5 rounded-xl border cursor-pointer transition-all duration-300 flex items-center justify-between ${
                              selectedFlight?.offerId === offer.offerId 
                                ? 'border-kashmir-gold bg-kashmir-gold/10 shadow-[0_0_15px_rgba(212,175,55,0.1)] ring-1 ring-kashmir-gold' 
                                : 'border-white/10 bg-white/5 hover:border-white/20 hover:shadow-md text-white'
                            }`}
                          >
                            <div className="flex items-center gap-5">
                              {offer.airlineLogo ? (
                                <div className="w-12 h-12 bg-white rounded-lg shadow-sm border border-slate-100 p-1 flex items-center justify-center">
                                  <img src={offer.airlineLogo} alt={offer.airlineName} className="max-w-full max-h-full object-contain" />
                                </div>
                              ) : (
                                <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center">
                                  <Plane className="w-6 h-6 text-kashmir-gold" />
                                </div>
                              )}
                              <div>
                                <p className="font-semibold text-white">{offer.airlineName}</p>
                                <div className="flex items-center text-sm text-white/40 mt-1 space-x-2">
                                  <span>{offer.departureTime.split('T')[1].substring(0,5)}</span>
                                  <ArrowRight className="w-3 h-3 text-kashmir-gold" />
                                  <span>{offer.arrivalTime.split('T')[1].substring(0,5)}</span>
                                  <span className="text-white/10">|</span>
                                  <span>Direct</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-light text-white">₹{parseInt(offer.totalAmount).toLocaleString()}</p>
                              <p className="text-xs font-medium text-white/40 uppercase tracking-wide">Per Person</p>
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
