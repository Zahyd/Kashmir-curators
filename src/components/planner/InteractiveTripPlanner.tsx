import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Plane, Calendar as CalendarIcon, Hotel, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

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

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const searchFlights = async () => {
    setIsSearchingFlights(true);
    try {
      const res = await fetch(`/api/flights/search?origin=${formData.origin}&date=${formData.date}&adults=${formData.adults}`);
      const data = await res.json();
      if (data.success) {
        setFlightOffers(data.offers);
        toast.success(`Found ${data.offers.length} flight options!`);
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
    toast.loading('Submitting your trip request...');
    
    // Calculate total estimate logic here
    const basePrice = formData.adults * 15000; // Base land package mock
    const flightPrice = selectedFlight ? parseInt(selectedFlight.totalAmount) * formData.adults : 0;
    const totalEstimate = basePrice + flightPrice;

    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: formData.name,
          email: formData.email,
          phone: formData.phone,
          destination: 'Custom Srinagar Trip',
          message: `Custom Build. Guests: ${formData.adults}. Include Flights: ${formData.includeFlights}. Origin: ${formData.origin}. Estimated Budget: ₹${totalEstimate}`,
        })
      });

      if (res.ok) {
        toast.dismiss();
        toast.success('Trip request submitted successfully!');
        setStep(4); // Success step
      }
    } catch (e) {
      toast.dismiss();
      toast.error('Failed to submit request.');
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto py-12">
      <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm dark:bg-slate-950/90 ring-1 ring-slate-200 dark:ring-slate-800">
        <CardHeader className="text-center pb-8 border-b dark:border-slate-800 bg-white dark:bg-slate-950 rounded-t-xl">
          <CardTitle className="text-3xl font-light text-[#b5852a]">Build Your Custom Trip</CardTitle>
          <CardDescription className="text-lg text-slate-600 dark:text-slate-400 mt-2">Design your perfect Kashmir experience in 3 simple steps</CardDescription>
        </CardHeader>
        
        <CardContent className="p-8">
          {/* Step 1: Basics */}
          {step === 1 && (
            <div className="space-y-6 animate-in slide-in-from-right fade-in duration-500">
              <h3 className="text-xl font-medium flex items-center gap-2 text-slate-900 dark:text-white">
                <CalendarIcon className="text-[#b5852a]" /> When are you traveling?
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300">Travel Date</Label>
                  <Input 
                    type="date" 
                    value={formData.date} 
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300">Number of Guests</Label>
                  <Input 
                    type="number" 
                    min="1" 
                    value={formData.adults} 
                    onChange={e => setFormData({ ...formData, adults: parseInt(e.target.value) })}
                    className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-300"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Flights */}
          {step === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right fade-in duration-500">
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h3 className="text-xl font-medium flex items-center gap-2 text-slate-900 dark:text-white">
                    <Plane className="text-[#b5852a]" /> Include Flights to Srinagar?
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">Get live pricing from major airports</p>
                </div>
                <Switch 
                  checked={formData.includeFlights} 
                  onCheckedChange={handleFlightToggle} 
                />
              </div>

              {formData.includeFlights && (
                <div className="space-y-4 pt-4">
                  <div className="flex gap-4 items-end">
                    <div className="flex-1 space-y-2">
                      <Label className="text-slate-700 dark:text-slate-300">Flying From</Label>
                      <select 
                        className="flex h-10 w-full rounded-md border border-slate-300 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white ring-offset-background"
                        value={formData.origin}
                        onChange={e => {
                          setFormData({ ...formData, origin: e.target.value });
                          setFlightOffers([]);
                        }}
                      >
                        <option value="DEL">New Delhi (DEL)</option>
                        <option value="BOM">Mumbai (BOM)</option>
                        <option value="BLR">Bengaluru (BLR)</option>
                        <option value="MAA">Chennai (MAA)</option>
                      </select>
                    </div>
                    <Button onClick={searchFlights} disabled={isSearchingFlights} variant="outline">
                      {isSearchingFlights ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : 'Search Flights'}
                    </Button>
                  </div>

                  {flightOffers.length > 0 && (
                    <div className="space-y-3 mt-6">
                      <Label className="text-slate-700 dark:text-slate-300">Select a Flight Option</Label>
                      {flightOffers.map(offer => (
                        <div 
                          key={offer.offerId}
                          onClick={() => setSelectedFlight(offer)}
                          className={`p-4 border rounded-lg cursor-pointer transition-all ${
                            selectedFlight?.offerId === offer.offerId ? 'border-[#b5852a] bg-[#b5852a]/5' : 'hover:border-slate-300'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              {offer.airlineLogo ? (
                                <img src={offer.airlineLogo} alt={offer.airlineName} className="w-8 h-8 object-contain" />
                              ) : (
                                <Plane className="w-6 h-6 text-slate-400" />
                              )}
                              <div>
                                <p className="font-medium">{offer.airlineName}</p>
                                <p className="text-xs text-muted-foreground">{offer.departureTime.split('T')[1].substring(0,5)} - {offer.arrivalTime.split('T')[1].substring(0,5)}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-[#b5852a]">₹{parseInt(offer.totalAmount).toLocaleString()}</p>
                              <p className="text-xs text-muted-foreground">per adult</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Contact */}
          {step === 3 && (
            <div className="space-y-6 animate-in slide-in-from-right fade-in duration-500">
              <h3 className="text-xl font-medium text-slate-900 dark:text-white">Final Details</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300">Full Name</Label>
                  <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-300" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300">Email</Label>
                  <Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-300" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300">Phone (WhatsApp preferred)</Label>
                  <Input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-300" />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Success */}
          {step === 4 && (
            <div className="text-center space-y-6 py-12 animate-in zoom-in duration-500">
              <CheckCircle className="w-20 h-20 text-green-500 mx-auto" />
              <h2 className="text-3xl font-light">Request Received!</h2>
              <p className="text-muted-foreground">Our luxury travel curators are analyzing your preferences and securing the best rates. We will contact you via WhatsApp shortly.</p>
            </div>
          )}
        </CardContent>
        
        {step < 4 && (
          <CardFooter className="flex justify-between p-8 border-t bg-slate-50 dark:bg-slate-900 rounded-b-lg">
            <Button variant="outline" onClick={handleBack} disabled={step === 1}>Back</Button>
            {step < 3 ? (
              <Button onClick={handleNext} className="bg-[#b5852a] hover:bg-[#a07424] text-white">Next Step</Button>
            ) : (
              <Button onClick={handleSubmit} disabled={!formData.name || !formData.phone} className="bg-[#b5852a] hover:bg-[#a07424] text-white">
                Submit Request
              </Button>
            )}
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
