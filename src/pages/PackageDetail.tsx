import { useState, useEffect, useMemo } from 'react';
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
import { usePackage, usePackages } from '@/hooks/useCMSData';
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
  const { data: allPackages = [] } = usePackages();
  
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

  const recommendations = useMemo(() => {
    if (!pkg || !allPackages) return [];
    return allPackages
      .filter((p) => p && p.id !== pkg.id)
      .map((p) => {
        let score = 0;
        const pDest = (p.destination || '').toLowerCase();
        const pkgDest = (pkg.destination || '').toLowerCase();
        if (pDest && pkgDest) {
          if (pDest.includes(pkgDest) || pkgDest.includes(pDest)) {
            score += 2;
          }
        }
        if (p.rating >= 4.8) {
          score += 1;
        }
        return { pkg: p, score };
      })
      .sort((a, b) => b.score - a.score)
      .map((item) => item.pkg)
      .slice(0, 3);
  }, [pkg, allPackages]);

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

  const curator = useMemo(() => {
    if (!pkg || curators.length === 0) return null;
    const dest = (pkg.destination || '').toLowerCase();
    if (!dest) return curators[0] || null;
    
    // 1. Match destination keywords with curator's role/bio
    const matched = curators.find(c => {
      if (!c) return false;
      const role = (c.role || '').toLowerCase();
      const bio = (c.bio || '').toLowerCase();
      const keywords = dest.split(/[\s\-\,]+/g).filter(k => k.length > 2);
      return keywords.some(kw => role.includes(kw) || bio.includes(kw));
    });
    
    if (matched) return matched;
    
    // 2. Hash package ID to assign different curators stably
    const pkgId = pkg.id || '';
    const hash = pkgId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return curators[hash % curators.length] || null;
  }, [pkg, curators]);

  const highlights = useMemo(() => {
    return Array.isArray(pkg?.highlights) ? pkg.highlights.filter(Boolean) : [];
  }, [pkg]);

  const inclusions = useMemo(() => {
    return Array.isArray(pkg?.inclusions) ? pkg.inclusions.filter(Boolean) : [];
  }, [pkg]);

  const exclusions = useMemo(() => {
    return Array.isArray(pkg?.exclusions) ? pkg.exclusions.filter(Boolean) : [];
  }, [pkg]);

  const itinerary = useMemo(() => {
    return Array.isArray(pkg?.itinerary) ? pkg.itinerary.filter(Boolean) : [];
  }, [pkg]);

  const images = useMemo(() => {
    if (!pkg) return [];
    return [pkg.image];
  }, [pkg]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#05080a] text-white">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 pb-12">
          <Skeleton className="h-8 w-24 mb-4 bg-white/5" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <Skeleton className="aspect-video rounded-2xl bg-white/5" />
              <Skeleton className="h-96 rounded-2xl bg-white/5" />
            </div>
            <Skeleton className="h-[500px] rounded-2xl bg-white/5" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const handleBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate('/packages');
    }
  };

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

  const hotelPrices = { budget: 0, standard: 3000, luxury: 8000 };
  const cabPrices = { sedan: 0, suv: 1500, premium: 3000 };

  const calculateTotal = () => {
    const travelers = parseInt(bookingData.travelers);
    const base = pkg.price * travelers;
    const hotelExtra = hotelPrices[bookingData.hotelCategory as keyof typeof hotelPrices] * travelers;
    const cabExtra = cabPrices[bookingData.cabType as keyof typeof cabPrices];
    return base + hotelExtra + cabExtra;
  };

  const handlePaymentSuccess = () => {
    setShowPayment(false);
    toast.success("Payment completed successfully!");
    handleBooking();
  };

  const handlePaymentFailure = (error: string) => {
    setShowPayment(false);
    toast.error(`Payment failed: ${error}`);
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
    <div className="min-h-screen bg-[#05080a] text-white selection:bg-kashmir-gold/30">
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
      <div className="container mx-auto px-4 pt-28 relative z-10">
        <Button variant="ghost" onClick={handleBack} className="mb-4 text-white/60 hover:text-white hover:bg-white/5 rounded-xl px-4 py-2">
          <ArrowLeft className="h-4 w-4 mr-2 text-kashmir-gold" />
          Back
        </Button>
      </div>

      <div className="container mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Gallery */}
            <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] overflow-hidden backdrop-blur-xl p-3">
              <div 
                className={cn(
                  "relative aspect-video rounded-2xl overflow-hidden",
                  images.length > 1 && "cursor-pointer group"
                )}
                onClick={images.length > 1 ? () => setLightboxOpen(true) : undefined}
              >
                <img
                  src={images[activeImage]}
                  alt={pkg.name}
                  className={cn(
                    "w-full h-full object-cover",
                    images.length > 1 && "transition-transform duration-1000 group-hover:scale-105"
                  )}
                />
                {images.length > 1 && (
                  <>
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                      <ZoomIn className="h-10 w-10 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setActiveImage(prev => (prev - 1 + images.length) % images.length); }}
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/40 border border-white/10 text-white rounded-full hover:bg-black/60 transition-colors"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setActiveImage(prev => (prev + 1) % images.length); }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/40 border border-white/10 text-white rounded-full hover:bg-black/60 transition-colors"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 p-4 overflow-x-auto">
                  {images.slice(0, 5).map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImage(i)}
                      className={cn(
                        "w-20 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all duration-300",
                        i === activeImage ? "border-kashmir-gold scale-95" : "border-transparent opacity-60 hover:opacity-100"
                      )}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Package Info */}
            <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-8 backdrop-blur-xl text-white space-y-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="font-display text-3xl md:text-4xl font-black text-white mb-3 uppercase tracking-tight">{pkg.name}</h1>
                  <div className="flex flex-wrap items-center gap-6 text-white/40 text-xs font-semibold">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-kashmir-gold" /> {pkg.destination}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-kashmir-gold" /> {pkg.duration}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Star className="h-4 w-4 fill-kashmir-gold text-kashmir-gold" />
                      {pkg.rating} ({pkg.reviewCount} reviews)
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              {'description' in pkg && pkg.description && (
                <div className="border-t border-white/5 pt-6">
                  <h3 className="font-display text-lg font-bold text-white mb-3 uppercase tracking-wider">About This Package</h3>
                  <p className="text-white/60 text-sm leading-relaxed">{pkg.description}</p>
                </div>
              )}

              {/* Highlights */}
              {highlights.length > 0 && (
                <div className="border-t border-white/5 pt-6">
                  <h3 className="font-display text-lg font-bold text-white mb-3 uppercase tracking-wider">Highlights</h3>
                  <div className="flex flex-wrap gap-2">
                    {highlights.map((highlight, i) => (
                      <span key={i} className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-semibold text-white/80 hover:bg-white/10 transition-colors">
                        {highlight}
                      </span>
                    ))}
                  </div>
                </div>
              )}

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
              {itinerary.length > 0 && (
                <div className="border-t border-white/5 pt-8">
                  <h3 className="font-display text-xl font-bold text-white mb-6 uppercase tracking-wider">Day-wise Itinerary</h3>
                  <div className="relative border-l border-white/5 pl-8 ml-6 space-y-8 my-8">
                    {itinerary.map((day: any) => (
                      <div key={day.day} className="relative group">
                        {/* Timeline dot */}
                        <div className="absolute -left-[44px] top-0 w-8 h-8 rounded-xl bg-[#05080a] border border-kashmir-gold/30 flex items-center justify-center font-display font-black text-kashmir-gold text-xs shadow-[0_0_10px_rgba(212,175,55,0.15)] group-hover:border-kashmir-gold transition-all">
                          {day.day}
                        </div>
                        <div>
                          <h4 className="font-display text-lg font-bold text-white mb-2">{day.title}</h4>
                          <p className="text-white/50 text-sm leading-relaxed mb-3">{day.description}</p>
                          {day.activities && Array.isArray(day.activities) && day.activities.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {day.activities.map((activity: string, i: number) => (
                                <span key={i} className="text-[10px] px-3 py-1 bg-kashmir-gold/10 border border-kashmir-gold/20 text-kashmir-gold rounded-full font-bold uppercase tracking-wider">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-white/5 pt-8">
                {inclusions.length > 0 && (
                  <div>
                    <h3 className="font-display text-lg font-bold text-[#4ade80] mb-4 uppercase tracking-wider flex items-center gap-2">
                      <Check className="h-5 w-5 text-[#4ade80]" /> Inclusions
                    </h3>
                    <ul className="space-y-3">
                      {inclusions.map((item, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-white/70">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80] mt-2 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {exclusions.length > 0 && (
                  <div>
                    <h3 className="font-display text-lg font-bold text-[#f87171] mb-4 uppercase tracking-wider flex items-center gap-2">
                      <X className="h-5 w-5 text-[#f87171]" /> Exclusions
                    </h3>
                    <ul className="space-y-3">
                      {exclusions.map((item, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-white/70">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#f87171] mt-2 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
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
            <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-8 backdrop-blur-xl text-white sticky top-28 space-y-6">
              <div className="pb-4 border-b border-white/5">
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest block mb-1">Estate Value</span>
                <div className="text-3xl font-black text-kashmir-gold uppercase tracking-wider">
                  On Request
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-1 mb-2 block">
                    <span className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5 text-kashmir-gold" /> Travel Date</span>
                  </label>
                  <Input
                    type="date"
                    value={bookingData.date}
                    onChange={(e) => setBookingData(prev => ({ ...prev, date: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    className="bg-white/[0.02] border-white/5 text-white focus-visible:ring-kashmir-gold/50 rounded-xl h-12 font-bold px-4"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-1 mb-2 block">
                    <span className="flex items-center gap-2"><Users className="h-3.5 w-3.5 text-kashmir-gold" /> Travelers</span>
                  </label>
                  <Select value={bookingData.travelers} onValueChange={(value) => setBookingData(prev => ({ ...prev, travelers: value }))}>
                    <SelectTrigger className="h-12 bg-white/[0.02] border-white/5 rounded-xl text-white focus:ring-kashmir-gold/50 font-bold px-4">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0a0f12] border-white/10 text-white rounded-xl p-2">
                      {[1, 2, 3, 4, 5, 6].map(n => (
                        <SelectItem key={n} value={n.toString()} className="rounded-lg">{n} {n === 1 ? 'Traveler' : 'Travelers'}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-1 mb-2 block">
                    <span className="flex items-center gap-2"><Building className="h-3.5 w-3.5 text-kashmir-gold" /> Hotel Category</span>
                  </label>
                  <Select value={bookingData.hotelCategory} onValueChange={(value) => setBookingData(prev => ({ ...prev, hotelCategory: value }))}>
                    <SelectTrigger className="h-12 bg-white/[0.02] border-white/5 rounded-xl text-white focus:ring-kashmir-gold/50 font-bold px-4">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0a0f12] border-white/10 text-white rounded-xl p-2">
                      <SelectItem value="budget" className="rounded-lg">Budget Category</SelectItem>
                      <SelectItem value="standard" className="rounded-lg">Standard Upgrade</SelectItem>
                      <SelectItem value="luxury" className="rounded-lg">Luxury Upgrade</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-1 mb-2 block">
                    <span className="flex items-center gap-2"><Car className="h-3.5 w-3.5 text-kashmir-gold" /> Cab Type</span>
                  </label>
                  <Select value={bookingData.cabType} onValueChange={(value) => setBookingData(prev => ({ ...prev, cabType: value }))}>
                    <SelectTrigger className="h-12 bg-white/[0.02] border-white/5 rounded-xl text-white focus:ring-kashmir-gold/50 font-bold px-4">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0a0f12] border-white/10 text-white rounded-xl p-2">
                      <SelectItem value="sedan" className="rounded-lg">Sedan Chauffeur</SelectItem>
                      <SelectItem value="suv" className="rounded-lg">SUV Upgrade</SelectItem>
                      <SelectItem value="premium" className="rounded-lg">Premium Cruiser Upgrade</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="border-t border-white/5 pt-4 space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-white/40 font-semibold">Travelers Count</span>
                  <span className="font-bold text-white">{bookingData.travelers} Persons</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40 font-semibold">Hotel Plan</span>
                  <span className="font-bold text-white capitalize">{bookingData.hotelCategory}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40 font-semibold">Chauffeur Transport</span>
                  <span className="font-bold text-white capitalize">{bookingData.cabType}</span>
                </div>
                <div className="flex justify-between font-bold text-base pt-3 border-t border-white/5 items-center">
                  <span className="text-white/60">Total Cost</span>
                  <span className="text-kashmir-gold font-black text-xl tracking-wider">Quote Pending</span>
                </div>
              </div>

              <Button
                variant="gold"
                size="lg"
                className="w-full h-14 rounded-xl font-bold uppercase tracking-wider text-[11px] hover:scale-[1.02] active:scale-[0.98] transition-all"
                onClick={handleBooking}
                disabled={isBooking}
              >
                {isBooking ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Submitting...
                  </>
                ) : (
                  'Request Custom Quote'
                )}
              </Button>

              <p className="text-[10px] text-white/30 text-center font-medium">
                Free cancellation up to 7 days before
              </p>

              {/* Zero Hidden Costs Guarantee Badge */}
              <div className="p-4 rounded-2xl bg-kashmir-gold/5 border border-kashmir-gold/10 flex gap-3 items-start text-left">
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

        {/* Dynamic Recommendation Section */}
        {recommendations.length > 0 && (
          <div className="mt-20 border-t border-white/5 pt-16">
            <div className="flex items-center gap-4 mb-10">
              <div className="h-[1px] flex-1 bg-white/5" />
              <h3 className="font-display text-2xl font-black text-white uppercase tracking-widest text-center">
                Similar <span className="text-kashmir-gold italic">Curated Journeys</span>
              </h3>
              <div className="h-[1px] flex-1 bg-white/5" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {recommendations.map((recPkg) => (
                <Link 
                  key={recPkg.id} 
                  to={`/packages/${recPkg.id}`}
                  className="group block"
                >
                  <div className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden p-3 hover:border-kashmir-gold/30 transition-all duration-500 hover:-translate-y-1 backdrop-blur-md">
                    <div className="relative h-56 overflow-hidden rounded-2xl mb-4">
                      <img 
                        src={recPkg.image} 
                        alt={recPkg.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                      <div className="absolute bottom-4 left-4 flex items-center gap-2 text-xs font-semibold text-white">
                        <MapPin className="w-3.5 h-3.5 text-kashmir-gold" />
                        {recPkg.destination}
                      </div>
                    </div>
                    <div className="px-2 pb-2">
                      <h4 className="font-display text-lg font-bold text-white mb-2 group-hover:text-kashmir-gold transition-colors line-clamp-1">
                        {recPkg.name}
                      </h4>
                      <div className="flex items-center justify-between text-xs text-white/40">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-white/30" /> {recPkg.duration}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Star className="w-3.5 h-3.5 fill-kashmir-gold text-kashmir-gold" /> {recPkg.rating}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Image Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl p-0 bg-transparent border-0 shadow-none">
          <div className="relative">
            <img
              src={images[activeImage]}
              alt={pkg.name}
              className="w-full h-auto max-h-[80vh] object-contain rounded-2xl"
            />
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setActiveImage(prev => (prev - 1 + images.length) % images.length)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/40 border border-white/10 text-white rounded-full hover:bg-black/60 transition-colors"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={() => setActiveImage(prev => (prev + 1) % images.length)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/40 border border-white/10 text-white rounded-full hover:bg-black/60 transition-colors"
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
                        i === activeImage ? "bg-kashmir-gold" : "bg-white/20"
                      )}
                    />
                  ))}
                </div>
              </>
            )}
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
