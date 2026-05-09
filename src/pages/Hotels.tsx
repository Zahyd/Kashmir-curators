import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, MapPin, Search, Wifi, UtensilsCrossed, Dumbbell, Sparkles, Calendar, Users } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import FloatingActions from '@/components/layout/FloatingActions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useHotels, useLocations, CMSHotel } from '@/hooks/useCMSData';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import PaymentSimulator from '@/components/payment/PaymentSimulator';

const amenityIcons: Record<string, any> = {
  WiFi: Wifi,
  Restaurant: UtensilsCrossed,
  Gym: Dumbbell,
  Spa: Sparkles,
};

export default function Hotels() {
  const navigate = useNavigate();
  const { isAuthenticated, addBooking } = useAuth();
  const { data: hotels = [], isLoading } = useHotels();
  const { data: locations = [] } = useLocations();
  
  const [selectedHotel, setSelectedHotel] = useState<CMSHotel | null>(null);
  const [dialogHotel, setDialogHotel] = useState<CMSHotel | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [filters, setFilters] = useState({
    location: '',
    search: '',
    priceRange: [0, 100000],
    starRating: '',
  });
  const [bookingData, setBookingData] = useState({
    checkIn: '',
    checkOut: '',
    guests: '2',
    roomType: '',
  });

  const filteredHotels = useMemo(() => {
    if (!hotels) return [];
    
    return hotels.filter(hotel => {
      if (filters.location && hotel.location !== filters.location) return false;
      if (filters.search && !hotel.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
      if (hotel.pricePerNight < filters.priceRange[0] || hotel.pricePerNight > filters.priceRange[1]) return false;
      if (filters.starRating && hotel.starRating < parseInt(filters.starRating)) return false;
      return true;
    });
  }, [hotels, filters]);

  const calculateNights = () => {
    if (!bookingData.checkIn || !bookingData.checkOut) return 0;
    const start = new Date(bookingData.checkIn);
    const end = new Date(bookingData.checkOut);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  const calculateTotal = () => {
    if (!selectedHotel || !bookingData.roomType) return 0;
    const room = selectedHotel.roomTypes.find(r => r.id === bookingData.roomType);
    if (!room) return 0;
    return room.price * calculateNights();
  };

  const handleBooking = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to book');
      navigate('/auth?redirect=/hotels');
      return;
    }

    if (!bookingData.checkIn || !bookingData.checkOut || !bookingData.roomType) {
      toast.error('Please fill all booking details');
      return;
    }

    setShowPayment(true);
  };

  const handlePaymentSuccess = () => {
    addBooking({
      booking_type: 'hotel',
      item_name: selectedHotel!.name,
      booking_date: bookingData.checkIn,
      status: 'confirmed',
      total_amount: calculateTotal(),
      details: { ...bookingData, nights: calculateNights() },
    });

    setShowPayment(false);
    setSelectedHotel(null);
    toast.success('Hotel booked successfully!');
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
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1600")' }}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
        </div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h1 className="font-display text-4xl md:text-6xl font-bold text-white mb-4 animate-fade-up">
            Luxury Stays in Kashmir
          </h1>
          <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto animate-fade-up" style={{ animationDelay: '100ms' }}>
            From lakeside houseboats to cozy mountain retreats, find your perfect stay.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Search Bar - Elite Hub */}
        <div className="bg-white/[0.02] border border-white/5 rounded-[3rem] p-6 md:p-10 backdrop-blur-xl mb-16 animate-fade-up">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-4 flex items-center gap-2">
                <MapPin className="w-3 h-3 text-kashmir-gold" /> Location
              </label>
              <Select value={filters.location || "all"} onValueChange={(value) => setFilters(prev => ({ ...prev, location: value === "all" ? "" : value }))}>
                <SelectTrigger className="h-16 bg-white/[0.03] border-white/5 rounded-2xl text-white focus:ring-kashmir-gold/50 font-bold px-6">
                  <SelectValue placeholder="All Regions" />
                </SelectTrigger>
                <SelectContent className="bg-[#0a0f12] border-white/10 text-white">
                  <SelectItem value="all">All Regions</SelectItem>
                  {locations?.map((loc) => (
                    <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-4 flex items-center gap-2">
                <Search className="w-3 h-3 text-kashmir-gold" /> Search
              </label>
              <div className="relative group">
                <Input
                  placeholder="Identify estate..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="h-16 bg-white/[0.03] border-white/5 rounded-2xl text-white placeholder:text-white/10 focus-visible:ring-kashmir-gold/50 px-6 font-bold"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-4 flex items-center gap-2">
                <Star className="w-3 h-3 text-kashmir-gold" /> Classification
              </label>
              <Select value={filters.starRating || "any"} onValueChange={(value) => setFilters(prev => ({ ...prev, starRating: value === "any" ? "" : value }))}>
                <SelectTrigger className="h-16 bg-white/[0.03] border-white/5 rounded-2xl text-white focus:ring-kashmir-gold/50 font-bold px-6">
                  <SelectValue placeholder="Any Rating" />
                </SelectTrigger>
                <SelectContent className="bg-[#0a0f12] border-white/10 text-white">
                  <SelectItem value="any">Any Rating</SelectItem>
                  <SelectItem value="5">5 Star (Palatial)</SelectItem>
                  <SelectItem value="4">4+ Star (Grand)</SelectItem>
                  <SelectItem value="3">3+ Star (Boutique)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-6 flex flex-col justify-center">
              <div className="flex justify-between items-end px-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Nightly Rate</label>
                <span className="text-xs font-black text-kashmir-gold">₹{filters.priceRange[1].toLocaleString()}</span>
              </div>
              <Slider
                value={filters.priceRange}
                onValueChange={(value) => setFilters(prev => ({ ...prev, priceRange: value as [number, number] }))}
                min={0}
                max={100000}
                step={1000}
                className="py-2"
              />
            </div>
          </div>
        </div>

        {/* Results Metadata */}
        <div className="flex items-center gap-4 mb-10 text-[10px] font-black uppercase tracking-[0.3em] text-white/20 animate-fade-in">
          <div className="w-8 h-[1px] bg-white/10" />
          <span>{isLoading ? 'Scanning Assets...' : `${filteredHotels.length} PRIVATE SANCTUARIES`}</span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] overflow-hidden p-6 space-y-6">
                <Skeleton className="h-64 w-full rounded-3xl bg-white/5" />
                <div className="space-y-4 px-4 pb-4">
                  <Skeleton className="h-8 w-3/4 bg-white/5" />
                  <Skeleton className="h-4 w-1/2 bg-white/5" />
                  <Skeleton className="h-12 w-full bg-white/5" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {filteredHotels.map((hotel, index) => (
              <div
                key={hotel.id}
                className="bg-white/[0.02] border border-white/5 rounded-[3rem] overflow-hidden hover:border-kashmir-gold/30 transition-all duration-700 hover:-translate-y-2 animate-fade-up group p-4"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="relative h-72 rounded-[2.5rem] overflow-hidden">
                  <img
                    src={hotel.image}
                    alt={hotel.name}
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 grayscale group-hover:grayscale-0"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#05080a] via-transparent to-transparent opacity-60" />
                  <div className="absolute top-6 right-6 px-4 py-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-full flex items-center gap-1.5">
                    {[...Array(hotel.starRating)].map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-kashmir-gold text-kashmir-gold" />
                    ))}
                  </div>
                  <div className="absolute bottom-6 left-6 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                      <MapPin className="h-4 w-4 text-kashmir-gold" />
                    </div>
                    <span className="text-sm font-black text-white uppercase tracking-widest">{hotel.location}</span>
                  </div>
                </div>

                <div className="p-8">
                  <h3 className="font-display text-3xl font-black text-white mb-6 leading-tight group-hover:text-kashmir-gold transition-colors line-clamp-1">{hotel.name}</h3>

                  <div className="flex flex-wrap gap-3 mb-8">
                    {hotel.amenities.slice(0, 3).map((amenity) => {
                      const Icon = amenityIcons[amenity] || Sparkles;
                      return (
                        <div key={amenity} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/5">
                          <Icon className="h-3.5 w-3.5 text-kashmir-gold/60" />
                          <span className="text-[9px] font-black uppercase tracking-[0.15em] text-white/40">{amenity}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between mb-10 pb-8 border-b border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-kashmir-gold/10 flex items-center justify-center border border-kashmir-gold/20">
                        <Star className="h-4 w-4 fill-kashmir-gold text-kashmir-gold" />
                      </div>
                      <div>
                        <span className="block text-sm font-black text-white">{hotel.rating}</span>
                        <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">{hotel.reviewCount} Reviews</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 block mb-1">Asset Value</span>
                      <div className="text-3xl font-black text-white">₹{hotel.pricePerNight.toLocaleString()}</div>
                      <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">per cycle</span>
                    </div>
                  </div>

                  <Dialog onOpenChange={(open) => {
                    if (open) {
                      setDialogHotel(hotel as CMSHotel);
                      setSelectedHotel(hotel as CMSHotel);
                      setBookingData(prev => ({ ...prev, roomType: hotel.roomTypes[0]?.id || '' }));
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button className="w-full h-16 rounded-2xl bg-white text-black hover:bg-kashmir-gold transition-all duration-500 font-black text-xs uppercase tracking-[0.2em] shadow-2xl">
                        Initiate Reservation
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-xl bg-[#05080a] border-white/10 text-white rounded-[3rem] p-6 md:p-10">
                      <DialogHeader className="mb-10">
                        <DialogTitle className="font-display text-4xl font-black text-white uppercase leading-tight">
                          RESERVE <span className="text-kashmir-gold italic">{dialogHotel?.name || hotel.name}</span>
                        </DialogTitle>
                      </DialogHeader>

                      <div className="space-y-8">
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-4">Check-in</label>
                            <Input
                              type="date"
                              value={bookingData.checkIn}
                              onChange={(e) => setBookingData(prev => ({ ...prev, checkIn: e.target.value }))}
                              min={new Date().toISOString().split('T')[0]}
                              className="h-14 bg-white/[0.03] border-white/5 rounded-2xl text-white px-6 font-bold"
                            />
                          </div>
                          <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-4">Check-out</label>
                            <Input
                              type="date"
                              value={bookingData.checkOut}
                              onChange={(e) => setBookingData(prev => ({ ...prev, checkOut: e.target.value }))}
                              min={bookingData.checkIn || new Date().toISOString().split('T')[0]}
                              className="h-14 bg-white/[0.03] border-white/5 rounded-2xl text-white px-6 font-bold"
                            />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-4">Guest Count</label>
                          <Select value={bookingData.guests} onValueChange={(value) => setBookingData(prev => ({ ...prev, guests: value }))}>
                            <SelectTrigger className="h-14 bg-white/[0.03] border-white/5 rounded-2xl text-white px-6 font-bold">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#0a0f12] border-white/10 text-white">
                              {[1, 2, 3, 4].map(n => (
                                <SelectItem key={n} value={n.toString()}>{n} Principal{n > 1 ? 's' : ''}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-4">Chamber Selection</label>
                          <Select value={bookingData.roomType} onValueChange={(value) => setBookingData(prev => ({ ...prev, roomType: value }))}>
                            <SelectTrigger className="h-14 bg-white/[0.03] border-white/5 rounded-2xl text-white px-6 font-bold">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#0a0f12] border-white/10 text-white">
                              {(dialogHotel?.roomTypes || hotel.roomTypes).map(room => (
                                <SelectItem key={room.id} value={room.id}>
                                  {room.name} - ₹{room.price.toLocaleString()}/cycle
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {calculateNights() > 0 && (
                          <div className="p-8 rounded-[2rem] bg-white/[0.03] border border-white/5 space-y-4">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-white/20">
                              <span>Expedition Length</span>
                              <span>{calculateNights()} Cycles</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xl font-black text-white">Total Value</span>
                              <span className="text-3xl font-black text-kashmir-gold">₹{calculateTotal().toLocaleString()}</span>
                            </div>
                          </div>
                        )}

                        <Button
                          size="lg"
                          className="w-full h-18 py-6 rounded-2xl bg-kashmir-gold text-black hover:bg-amber-500 font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-kashmir-gold/10 transition-all duration-500 active:scale-95"
                          onClick={handleBooking}
                          disabled={!calculateNights()}
                        >
                          Confirm Protocol
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment Simulator */}
      {selectedHotel && (
        <PaymentSimulator
          isOpen={showPayment}
          onClose={() => setShowPayment(false)}
          amount={calculateTotal()}
          itemName={selectedHotel.name}
          onSuccess={handlePaymentSuccess}
          onFailure={handlePaymentFailure}
        />
      )}

      <Footer />
      <FloatingActions />
    </div>
  );
}
