import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, MapPin, Calendar, Clock, Users, Plane, MapIcon, Navigation, Loader2, CheckCircle } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import FloatingActions from '@/components/layout/FloatingActions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useCabs, useDestinations } from '@/hooks/useCMSData';
import { cabRoutes } from '@/data/routes';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import PaymentSimulator from '@/components/payment/PaymentSimulator';

export default function Cabs() {
  const navigate = useNavigate();
  const { isAuthenticated, addBooking } = useAuth();
  const { data: cabOptions, isLoading: isLoadingCabs } = useCabs();
  const { data: destinations } = useDestinations();
  const [selectedCab, setSelectedCab] = useState<any | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [tripType, setTripType] = useState('airport');
  const [bookingData, setBookingData] = useState({
    pickup: '',
    drop: '',
    date: '',
    time: '',
    returnDate: '',
  });

  const isLoading = isLoadingCabs;

  const getEstimatedDistance = () => {
    const route = cabRoutes.find(
      r => (r.from.toLowerCase().includes(bookingData.pickup.toLowerCase()) && 
           r.to.toLowerCase().includes(bookingData.drop.toLowerCase())) ||
          (r.to.toLowerCase().includes(bookingData.pickup.toLowerCase()) && 
           r.from.toLowerCase().includes(bookingData.drop.toLowerCase()))
    );
    return route?.distance || 50;
  };

  const calculateFare = (cab: any) => {
    const distance = getEstimatedDistance();
    let fare = cab.basePrice + (distance * cab.pricePerKm);
    
    if (tripType === 'outstation' && bookingData.returnDate) {
      fare *= 2;
    }
    
    return Math.round(fare);
  };

  const handleBooking = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to book');
      navigate('/auth?redirect=/cabs');
      return;
    }

    if (!bookingData.pickup || !bookingData.drop || !bookingData.date || !selectedCab) {
      toast.error('Please fill all booking details');
      return;
    }

    setShowPayment(true);
  };

  const handlePaymentSuccess = () => {
    addBooking({
      booking_type: 'cab',
      item_name: `${selectedCab!.name} - ${tripType === 'airport' ? 'Airport Transfer' : tripType === 'local' ? 'Local Sightseeing' : 'Outstation'}`,
      booking_date: bookingData.date,
      status: 'confirmed',
      total_amount: calculateFare(selectedCab!),
      details: { ...bookingData, cabType: selectedCab!.type, tripType },
    });

    setShowPayment(false);
    toast.success('Cab booked successfully!');
    navigate('/profile');
  };

  const handlePaymentFailure = () => {
    setShowPayment(false);
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />

      {/* Header */}
      <div className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=1600")' }}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
        </div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h1 className="font-display text-4xl md:text-6xl font-bold text-white mb-4 animate-fade-up">
            Premium Transport
          </h1>
          <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto animate-fade-up" style={{ animationDelay: '100ms' }}>
            Reliable cab services for airport transfers, local sightseeing, and outstation trips.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Booking Form */}
          <div className="lg:col-span-2">
            <div className="bg-white/[0.02] border border-white/5 rounded-[3rem] p-10 backdrop-blur-xl mb-12">
              <Tabs value={tripType} onValueChange={setTripType}>
                <TabsList className="grid grid-cols-3 mb-10 bg-white/5 p-1.5 rounded-2xl h-auto">
                  <TabsTrigger value="airport" className="gap-3 py-4 rounded-xl data-[state=active]:bg-kashmir-gold data-[state=active]:text-black transition-all">
                    <Plane className="h-4 w-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Airport</span>
                  </TabsTrigger>
                  <TabsTrigger value="local" className="gap-3 py-4 rounded-xl data-[state=active]:bg-kashmir-gold data-[state=active]:text-black transition-all">
                    <MapIcon className="h-4 w-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Local</span>
                  </TabsTrigger>
                  <TabsTrigger value="outstation" className="gap-3 py-4 rounded-xl data-[state=active]:bg-kashmir-gold data-[state=active]:text-black transition-all">
                    <Navigation className="h-4 w-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Outstation</span>
                  </TabsTrigger>
                </TabsList>

                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-4 flex items-center gap-2">
                        <MapPin className="h-3 w-3 text-green-500" /> Origin
                      </label>
                      <Select value={bookingData.pickup} onValueChange={(value) => setBookingData(prev => ({ ...prev, pickup: value }))}>
                        <SelectTrigger className="h-14 bg-white/[0.03] border-white/5 rounded-2xl text-white px-6 font-bold">
                          <SelectValue placeholder="Select pickup" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0a0f12] border-white/10 text-white">
                          <SelectItem value="srinagar-airport">Srinagar Airport</SelectItem>
                          {destinations.map((dest) => (
                            <SelectItem key={dest} value={dest.toLowerCase()}>{dest}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-4 flex items-center gap-2">
                        <MapPin className="h-3 w-3 text-destructive" /> Destination
                      </label>
                      <Select value={bookingData.drop} onValueChange={(value) => setBookingData(prev => ({ ...prev, drop: value }))}>
                        <SelectTrigger className="h-14 bg-white/[0.03] border-white/5 rounded-2xl text-white px-6 font-bold">
                          <SelectValue placeholder="Select drop" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0a0f12] border-white/10 text-white">
                          <SelectItem value="srinagar-airport">Srinagar Airport</SelectItem>
                          {destinations.map((dest) => (
                            <SelectItem key={dest} value={dest.toLowerCase()}>{dest}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-4 flex items-center gap-2">
                        <Calendar className="h-3 w-3" /> Date
                      </label>
                      <Input
                        type="date"
                        value={bookingData.date}
                        onChange={(e) => setBookingData(prev => ({ ...prev, date: e.target.value }))}
                        min={new Date().toISOString().split('T')[0]}
                        className="h-14 bg-white/[0.03] border-white/5 rounded-2xl text-white px-6 font-bold"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-4 flex items-center gap-2">
                        <Clock className="h-3 w-3" /> Time
                      </label>
                      <Input
                        type="time"
                        value={bookingData.time}
                        onChange={(e) => setBookingData(prev => ({ ...prev, time: e.target.value }))}
                        className="h-14 bg-white/[0.03] border-white/5 rounded-2xl text-white px-6 font-bold"
                      />
                    </div>
                    {tripType === 'outstation' && (
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-4 block">Return Date</label>
                        <Input
                          type="date"
                          value={bookingData.returnDate}
                          onChange={(e) => setBookingData(prev => ({ ...prev, returnDate: e.target.value }))}
                          min={bookingData.date || new Date().toISOString().split('T')[0]}
                          className="h-14 bg-white/[0.03] border-white/5 rounded-2xl text-white px-6 font-bold"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </Tabs>
            </div>

            {/* Cab Options */}
            <div className="flex items-center gap-4 mb-10 text-[10px] font-black uppercase tracking-[0.3em] text-white/20 animate-fade-in">
              <div className="w-8 h-[1px] bg-white/10" />
              <span>SELECT VEHICLE ASSET</span>
            </div>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 space-y-6">
                    <Skeleton className="h-48 w-full rounded-2xl bg-white/5" />
                    <Skeleton className="h-8 w-3/4 bg-white/5" />
                    <Skeleton className="h-4 w-1/2 bg-white/5" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {cabOptions.map((cab) => (
                  <div
                    key={cab.id}
                    onClick={() => setSelectedCab(cab)}
                    className={cn(
                      "bg-white/[0.02] border border-white/5 rounded-[3rem] p-8 cursor-pointer transition-all duration-700 group relative",
                      selectedCab?.id === cab.id 
                        ? "border-kashmir-gold/50 bg-kashmir-gold/[0.02] shadow-[0_0_50px_-12px_rgba(212,175,55,0.1)]" 
                        : "hover:border-white/10"
                    )}
                  >
                    <div className="flex flex-col gap-8">
                      <div className="relative h-48 overflow-hidden rounded-[2rem]">
                        <img
                          src={cab.image}
                          alt={cab.name}
                          className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#05080a] to-transparent opacity-40" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-6">
                          <div>
                            <h4 className="font-display text-3xl font-black text-white group-hover:text-kashmir-gold transition-colors">{cab.name}</h4>
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/30 flex items-center gap-2 mt-2">
                              <Users className="h-3 w-3 text-kashmir-gold" /> {cab.capacity} Principal Capacity
                            </p>
                          </div>
                          {selectedCab?.id === cab.id && (
                            <div className="w-10 h-10 rounded-full bg-kashmir-gold flex items-center justify-center shadow-lg shadow-kashmir-gold/20">
                              <CheckCircle className="h-5 w-5 text-black" />
                            </div>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 mt-4">
                          {cab.features.slice(0, 3).map((feature) => (
                            <span key={feature} className="text-[8px] font-black uppercase tracking-widest px-3 py-1.5 bg-white/5 rounded-lg text-white/40 border border-white/5">
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="mt-8 pt-8 border-t border-white/5 flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/20">Protocol Rate</span>
                        <span className="text-sm font-black text-white/40">₹{cab.pricePerKm}/km</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/20">Estimated Value</span>
                        <div className="text-3xl font-black text-white">₹{calculateFare(cab).toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Booking Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white/[0.02] border border-white/5 rounded-[3rem] p-10 backdrop-blur-xl sticky top-32">
              <h3 className="font-display text-2xl font-black text-white uppercase tracking-tighter mb-8">MANIFEST</h3>

              {selectedCab ? (
                <>
                  <div className="space-y-6 mb-10">
                    <div className="flex items-center gap-6 p-6 bg-white/[0.03] border border-white/5 rounded-[2rem]">
                      <div className="w-14 h-14 rounded-2xl bg-kashmir-gold/10 flex items-center justify-center border border-kashmir-gold/20">
                        <Car className="h-7 w-7 text-kashmir-gold" />
                      </div>
                      <div>
                        <p className="font-black text-white text-lg leading-none mb-2">{selectedCab.name}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/30">{selectedCab.capacity} PRINCIPALS</p>
                      </div>
                    </div>

                    <div className="space-y-6 px-4">
                      {bookingData.pickup && (
                        <div className="flex items-start gap-4">
                          <MapPin className="h-5 w-5 text-green-500 mt-1" />
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-1">Origin</p>
                            <p className="font-bold text-white capitalize text-sm">{bookingData.pickup.replace('-', ' ')}</p>
                          </div>
                        </div>
                      )}

                      {bookingData.drop && (
                        <div className="flex items-start gap-4">
                          <MapPin className="h-5 w-5 text-destructive mt-1" />
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-1">Destination</p>
                            <p className="font-bold text-white capitalize text-sm">{bookingData.drop.replace('-', ' ')}</p>
                          </div>
                        </div>
                      )}

                      {bookingData.date && (
                        <div className="flex items-start gap-4">
                          <Calendar className="h-5 w-5 text-kashmir-gold mt-1" />
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-1">Deployment</p>
                            <p className="font-bold text-white text-sm">
                              {new Date(bookingData.date).toLocaleDateString('en-IN', { 
                                day: 'numeric', 
                                month: 'short', 
                                year: 'numeric' 
                              })}
                              {bookingData.time && ` at ${bookingData.time}`}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-white/5 pt-8 mb-10 space-y-4">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                      <span className="text-white/20">Technical Distance</span>
                      <span className="text-white/60">{getEstimatedDistance()} KM</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                      <span className="text-white/20">Base Protocol</span>
                      <span className="text-white/60">₹{selectedCab.basePrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                      <span className="text-white/20">Distance Charge</span>
                      <span className="text-white/60">₹{(getEstimatedDistance() * selectedCab.pricePerKm).toLocaleString()}</span>
                    </div>
                    {tripType === 'outstation' && bookingData.returnDate && (
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-kashmir-gold">
                        <span>Round Trip Surcharge</span>
                        <span>x2.0</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-6 border-t border-white/5">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Total Value</span>
                      <span className="text-4xl font-black text-kashmir-gold">₹{calculateFare(selectedCab).toLocaleString()}</span>
                    </div>
                  </div>

                  <Button
                    size="lg"
                    className="w-full h-18 rounded-[1.5rem] bg-white text-black hover:bg-kashmir-gold font-black text-xs uppercase tracking-[0.3em] shadow-2xl transition-all duration-500 active:scale-95"
                    onClick={handleBooking}
                    disabled={!bookingData.pickup || !bookingData.drop || !bookingData.date}
                  >
                    Initiate Deployment
                  </Button>

                  <p className="text-[9px] font-black uppercase tracking-widest text-white/10 text-center mt-6">
                    Pilot details shared 24hrs prior to arrival
                  </p>
                </>
              ) : (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10">
                    <Car className="h-10 w-10 text-white/10" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/20 max-w-[150px] mx-auto">Select asset to view manifest</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Simulator */}
      {selectedCab && (
        <PaymentSimulator
          isOpen={showPayment}
          onClose={() => setShowPayment(false)}
          amount={calculateFare(selectedCab)}
          itemName={`${selectedCab.name} - ${tripType === 'airport' ? 'Airport Transfer' : tripType === 'local' ? 'Local Sightseeing' : 'Outstation'}`}
          onSuccess={handlePaymentSuccess}
          onFailure={handlePaymentFailure}
        />
      )}

      <Footer />
      <FloatingActions />
    </div>
  );
}
