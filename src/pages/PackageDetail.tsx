import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Star, Clock, MapPin, Check, X, ChevronLeft, ChevronRight, Calendar, Users, Building, Car, Loader2, ArrowLeft, ZoomIn, Crown, ShieldCheck } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import FloatingActions from '@/components/layout/FloatingActions';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { usePackage } from '@/hooks/useCMSData';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import PaymentSimulator from '@/components/payment/PaymentSimulator';
import ReviewSection from '@/components/reviews/ReviewSection';
import SeoMeta from '@/components/SeoMeta';

export default function PackageDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, addBooking } = useAuth();
  const { data: pkg, isLoading } = usePackage(id || '');
  
  const [activeImage, setActiveImage] = useState(0);
  const [isBooking, setIsBooking] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [bookingData, setBookingData] = useState({
    date: '',
    travelers: '2',
    hotelCategory: 'standard',
    cabType: 'sedan',
  });
  const [curators, setCurators] = useState<any[]>([]);

  useEffect(() => {
    const fetchCurators = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/curators`);
        if (res.ok) {
          const data = await res.json();
          setCurators(data);
        }
      } catch (err) {
        console.error('Failed to load curators:', err);
      }
    };
    fetchCurators();
  }, []);

  const curator = curators.find(c => {
    if (id === 'pkg-royal-kashmir' && c.id === 'curator-priya') return true;
    if (id === 'pkg-winter-wonder' && c.id === 'curator-faheem') return true;
    return false;
  }) || curators[0];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 pb-12">
          <Skeleton className="h-8 w-24 mb-4" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <Skeleton className="aspect-video rounded-2xl" />
              <Skeleton className="h-96 rounded-2xl" />
            </div>
            <Skeleton className="h-[500px] rounded-2xl" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Package Not Found</h1>
          <Link to="/packages">
            <Button variant="gold">Back to Packages</Button>
          </Link>
        </div>
      </div>
    );
  }

  const images = [pkg.image, ...pkg.highlights.map(() => pkg.image)];

  const hotelPrices = { budget: 0, standard: 3000, luxury: 8000 };
  const cabPrices = { sedan: 0, suv: 1500, premium: 3000 };

  const calculateTotal = () => {
    const travelers = parseInt(bookingData.travelers);
    const base = pkg.price * travelers;
    const hotelExtra = hotelPrices[bookingData.hotelCategory as keyof typeof hotelPrices] * travelers;
    const cabExtra = cabPrices[bookingData.cabType as keyof typeof cabPrices];
    return base + hotelExtra + cabExtra;
  };

  const handleBooking = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to request a quote');
      navigate('/auth?redirect=/packages/' + id);
      return;
    }

    if (!bookingData.date) {
      toast.error('Please select a travel date');
      return;
    }

    setIsBooking(true);
    try {
      await addBooking({
        booking_type: 'package',
        item_name: pkg.name,
        booking_date: bookingData.date,
        status: 'pending',
        total_amount: 0, // Quote-based
        details: bookingData,
      });

      toast.success('Bespoke quote request submitted successfully!');
      navigate('/profile');
    } catch (err) {
      toast.error('Failed to submit quote request. Please try again.');
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <SeoMeta 
        title={`${pkg.name} - ${pkg.duration}`}
        description={`Explore ${pkg.name} in Kashmir. Tour destination ${pkg.destination} for ${pkg.duration}. Highly rated: ${pkg.rating} stars. Book custom luxury travels with Kashmir Curators.`}
        keywords={`${pkg.name}, ${pkg.destination} trip, kashmir luxury tours, kashmir travel package`}
        schema={{
          "@context": "https://schema.org",
          "@type": "Product",
          "name": pkg.name,
          "description": pkg.description || `Bespoke travel package to ${pkg.destination} lasting ${pkg.duration}.`,
          "image": pkg.image,
          "offers": {
            "@type": "Offer",
            "priceCurrency": "INR",
            "price": pkg.price,
            "priceValidUntil": "2027-12-31",
            "itemCondition": "https://schema.org/NewCondition",
            "availability": "https://schema.org/InStock",
            "url": window.location.href
          },
          "aggregateRating": pkg.rating ? {
            "@type": "AggregateRating",
            "ratingValue": pkg.rating,
            "reviewCount": pkg.reviewCount || 12
          } : undefined
        }}
      />
      <Navbar />

      {/* Back Button */}
      <div className="container mx-auto px-4 pt-24">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      <div className="container mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Gallery */}
            <div className="bg-card rounded-2xl overflow-hidden shadow-sm">
              <div className="relative aspect-video cursor-pointer group" onClick={() => setLightboxOpen(true)}>
                <img
                  src={images[activeImage]}
                  alt={pkg.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/20 transition-colors flex items-center justify-center">
                  <ZoomIn className="h-10 w-10 text-primary-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setActiveImage(prev => (prev - 1 + images.length) % images.length); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-card/80 rounded-full hover:bg-card transition-colors"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setActiveImage(prev => (prev + 1) % images.length); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-card/80 rounded-full hover:bg-card transition-colors"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </div>
              <div className="flex gap-2 p-4 overflow-x-auto">
                {images.slice(0, 5).map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={cn(
                      "w-20 h-16 rounded-lg overflow-hidden shrink-0 border-2 transition-colors",
                      i === activeImage ? "border-primary" : "border-transparent"
                    )}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Package Info */}
            <div className="bg-card rounded-2xl p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <h1 className="font-display text-3xl font-bold mb-2">{pkg.name}</h1>
                  <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" /> {pkg.destination}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" /> {pkg.duration}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-kashmir-gold text-kashmir-gold" />
                      {pkg.rating} ({pkg.reviewCount} reviews)
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              {'description' in pkg && pkg.description && (
                <div className="mb-6">
                  <h3 className="font-semibold text-lg mb-3">About This Package</h3>
                  <p className="text-muted-foreground">{pkg.description}</p>
                </div>
              )}

              {/* Highlights */}
              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-3">Highlights</h3>
                <div className="flex flex-wrap gap-2">
                  {pkg.highlights.map((highlight, i) => (
                    <span key={i} className="px-3 py-1 bg-muted rounded-full text-sm">
                      {highlight}
                    </span>
                  ))}
                </div>
              </div>

              {/* Certified Local Curator Section */}
              {curator && (
                <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row gap-6 items-center shadow-xl relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-kashmir-gold/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden shrink-0 border-2 border-kashmir-gold/20 shadow-lg relative z-10">
                    <img src={curator.avatar} alt={curator.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="text-center md:text-left flex-1 relative z-10">
                    <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-kashmir-gold/10 border border-kashmir-gold/20 text-[8px] font-black uppercase tracking-wider text-kashmir-gold mb-2">
                      <Crown className="w-2.5 h-2.5" /> Native Tour Curator
                    </div>
                    <h4 className="text-lg font-display font-bold text-white mb-1">{curator.name}</h4>
                    <p className="text-xs text-kashmir-gold font-medium mb-3">{curator.role} • License: {curator.licenseNo}</p>
                    <p className="text-xs text-white/50 leading-relaxed max-w-xl">{curator.bio}</p>
                    <div className="mt-3 flex flex-wrap items-center justify-center md:justify-start gap-4 text-[10px] text-white/40">
                      <span>Languages: {curator.languages}</span>
                      <span className="text-kashmir-gold font-bold">★ {curator.rating} Verified Curator</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Itinerary */}
              {pkg.itinerary && pkg.itinerary.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-lg mb-4">Day-wise Itinerary</h3>
                  <div className="space-y-4">
                    {pkg.itinerary.map((day: any) => (
                      <div key={day.day} className="flex gap-4">
                        <div className="shrink-0 w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                          {day.day}
                        </div>
                        <div className="flex-1 pb-4 border-b last:border-0">
                          <h4 className="font-semibold">{day.title}</h4>
                          <p className="text-muted-foreground text-sm mb-2">{day.description}</p>
                          {day.activities && (
                            <div className="flex flex-wrap gap-2">
                              {day.activities.map((activity: string, i: number) => (
                                <span key={i} className="text-xs px-2 py-1 bg-kashmir-gold/10 text-kashmir-earth rounded">
                                  {activity}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Inclusions/Exclusions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3 text-green-600">Inclusions</h3>
                  <ul className="space-y-2">
                    {pkg.inclusions.map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-600" /> {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-3 text-destructive">Exclusions</h3>
                  <ul className="space-y-2">
                    {pkg.exclusions.map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <X className="h-4 w-4 text-destructive" /> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Reviews Section */}
            <ReviewSection
              packageId={pkg.id}
              packageName={pkg.name}
              averageRating={pkg.rating}
              totalReviews={pkg.reviewCount}
            />
          </div>

          {/* Booking Card */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-2xl p-6 shadow-sm sticky top-24">
              <div className="mb-6">
                <span className="text-xs font-black text-white/40 uppercase tracking-widest block mb-1">Estate Value</span>
                <div className="text-3xl font-black text-kashmir-gold uppercase tracking-wider">
                  On Request
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Calendar className="h-4 w-4" /> Travel Date
                  </label>
                  <Input
                    type="date"
                    value={bookingData.date}
                    onChange={(e) => setBookingData(prev => ({ ...prev, date: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Users className="h-4 w-4" /> Travelers
                  </label>
                  <Select value={bookingData.travelers} onValueChange={(value) => setBookingData(prev => ({ ...prev, travelers: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6].map(n => (
                        <SelectItem key={n} value={n.toString()}>{n} {n === 1 ? 'Traveler' : 'Travelers'}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Building className="h-4 w-4" /> Hotel Category
                  </label>
                  <Select value={bookingData.hotelCategory} onValueChange={(value) => setBookingData(prev => ({ ...prev, hotelCategory: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="budget">Budget Category</SelectItem>
                      <SelectItem value="standard">Standard Upgrade</SelectItem>
                      <SelectItem value="luxury">Luxury Upgrade</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Car className="h-4 w-4" /> Cab Type
                  </label>
                  <Select value={bookingData.cabType} onValueChange={(value) => setBookingData(prev => ({ ...prev, cabType: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sedan">Sedan Chauffeur</SelectItem>
                      <SelectItem value="suv">SUV Upgrade</SelectItem>
                      <SelectItem value="premium">Premium Cruiser Upgrade</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="border-t pt-4 mb-6 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Travelers Count</span>
                  <span className="font-bold text-white">{bookingData.travelers} Persons</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Hotel Plan</span>
                  <span className="font-bold text-white capitalize">{bookingData.hotelCategory}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Chauffeur Transport</span>
                  <span className="font-bold text-white capitalize">{bookingData.cabType}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total Cost</span>
                  <span className="text-kashmir-gold">Quote Pending</span>
                </div>
              </div>

              <Button
                variant="gold"
                size="lg"
                className="w-full"
                onClick={handleBooking}
                disabled={isBooking}
              >
                {isBooking ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Request Custom Quote'
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center mt-4">
                Free cancellation up to 7 days before
              </p>

              {/* Zero Hidden Costs Guarantee Badge */}
              <div className="mt-6 p-4 rounded-xl bg-kashmir-gold/10 border border-kashmir-gold/20 flex gap-3 items-start text-left">
                <ShieldCheck className="w-5 h-5 text-kashmir-gold shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-[10px] font-black text-white uppercase tracking-wider mb-1">Zero Hidden Costs Guarantee</h5>
                  <p className="text-[10px] text-white/50 leading-relaxed">
                    Includes all permit fees, driver allowances, toll taxes, fuel charges, and local houseboat levies. No surprise surcharges, guaranteed.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl p-0 bg-transparent border-0">
          <div className="relative">
            <img
              src={images[activeImage]}
              alt={pkg.name}
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
            />
            <button
              onClick={() => setActiveImage(prev => (prev - 1 + images.length) % images.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-card/90 rounded-full hover:bg-card transition-colors"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={() => setActiveImage(prev => (prev + 1) % images.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-card/90 rounded-full hover:bg-card transition-colors"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {images.slice(0, 5).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-colors",
                    i === activeImage ? "bg-primary" : "bg-card/60"
                  )}
                />
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Simulator */}
      <PaymentSimulator
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        amount={calculateTotal()}
        itemName={pkg.name}
        onSuccess={handlePaymentSuccess}
        onFailure={handlePaymentFailure}
      />

      <Footer />
      <FloatingActions />
    </div>
  );
}
