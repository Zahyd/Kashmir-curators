import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  FileText, 
  MessageSquare, 
  Hotel, 
  Car, 
  Compass, 
  ChevronDown,
  Loader2
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/lib/api';

interface ItineraryDay {
  day: number;
  title: string;
  activities: string;
  description?: string;
  hotelName?: string;
  roomType?: string;
  mealPlan?: string;
  transport?: string;
  hotelImage?: string;
}

interface PublicItineraryData {
  id: string;
  customerName: string;
  destination: string;
  duration: string;
  travelers: string;
  quoteData: string; // JSON string
  proposalUrl?: string | null;
  status: string;
  leadStage?: string;
  netPrice?: number;
  createdAt: string;
}

export default function PublicItinerary() {
  const { inquiryId } = useParams<{ inquiryId: string }>();
  const [itinerary, setItinerary] = useState<PublicItineraryData | null>(null);
  const [days, setDays] = useState<ItineraryDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDay, setExpandedDay] = useState<number | null>(1); // Default expand day 1
  const [isPaying, setIsPaying] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      toast.success('Advance payment successfully processed! Your reservations are locked in.', {
        duration: 10000
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (params.get('payment') === 'cancelled') {
      toast.warning('Payment cancelled. You can complete the deposit at any time to hold reservations.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handlePayAdvance = async () => {
    setIsPaying(true);
    const toastId = toast.loading('Redirecting to secure Razorpay gateway...');
    try {
      const response = await fetch(`${API_BASE_URL}/payments/razorpay/create-payment-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inquiryId: itinerary?.id,
          amount: itinerary?.netPrice || 5000,
          customerEmail: ''
        })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Failed to initialize Razorpay payment');
      }
      if (data.sessionUrl) {
        window.location.href = data.sessionUrl;
      } else {
        throw new Error('No session URL returned');
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Payment error: ' + err.message, { id: toastId });
    } finally {
      setIsPaying(false);
    }
  };

  useEffect(() => {
    const fetchItinerary = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/inquiries/public/${inquiryId}`);
        if (!response.ok) {
          throw new Error('Itinerary not found or expired');
        }
        const data = await response.json();
        setItinerary(data);
        
        if (data.quoteData) {
          const parsedDays = JSON.parse(data.quoteData);
          if (Array.isArray(parsedDays)) {
            setDays(parsedDays);
          }
        }
      } catch (err: any) {
        console.error(err);
        toast.error('Failed to load itinerary. Please verify link.');
      } finally {
        setLoading(false);
      }
    };

    if (inquiryId) {
      fetchItinerary();
    }
  }, [inquiryId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#05080a] flex flex-col items-center justify-center text-white">
        <Loader2 className="w-12 h-12 text-kashmir-gold animate-spin mb-4" />
        <p className="text-white/60 font-medium tracking-widest text-xs uppercase">Decoding Luxury Protocol...</p>
      </div>
    );
  }

  if (!itinerary) {
    return (
      <div className="min-h-screen bg-[#05080a] flex flex-col items-center justify-center text-white px-6 text-center">
        <Compass className="w-16 h-16 text-kashmir-gold/40 mb-6" />
        <h2 className="text-2xl font-bold tracking-tight text-white mb-2">Itinerary Vault Secured</h2>
        <p className="text-white/60 text-sm max-w-sm mb-6">
          This shareable link is invalid, expired, or has been restricted by operations.
        </p>
        <Button 
          onClick={() => window.location.href = '/'}
          className="bg-kashmir-gold hover:bg-kashmir-gold/90 text-black font-bold px-6 py-3 rounded-xl uppercase tracking-wider text-xs border-none"
        >
          Return to Portal
        </Button>
      </div>
    );
  }

  const destinationMain = itinerary.destination.split(',')[0].trim();

  return (
    <div className="min-h-screen bg-[#05080a] text-white font-sans selection:bg-kashmir-gold/30">
      {/* Hero Header Banner */}
      <div className="relative h-[40vh] w-full overflow-hidden flex items-end">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1566228015668-4c45dbc4e2f5?q=80&w=1600')] bg-cover bg-center opacity-40 scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#05080a] via-[#05080a]/60 to-transparent" />
        
        <div className="container max-w-4xl mx-auto px-6 pb-10 relative z-10 w-full">
          <Badge className="bg-kashmir-gold/20 hover:bg-kashmir-gold/20 text-kashmir-gold border border-kashmir-gold/30 mb-4 px-3 py-1 text-[10px] font-black uppercase tracking-widest animate-pulse">
            Bespoke Luxury Curation
          </Badge>
          
          <h1 className="text-3xl md:text-5xl font-display font-black tracking-tight text-white mb-3">
            Your Kashmir Experience
          </h1>
          
          <p className="text-white/60 text-sm md:text-md max-w-xl">
            Exclusively curated proposal designed for <span className="text-white font-bold">{itinerary.customerName}</span>.
          </p>
        </div>
      </div>

      {/* Meta Stats Panel */}
      <div className="container max-w-4xl mx-auto px-6 -mt-4 relative z-20">
        <Card className="bg-[#0b1317]/90 backdrop-blur-2xl border border-white/10 p-6 rounded-3xl shadow-[0_20px_50px_-10px_rgba(0,0,0,0.8)]">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-white/5">
            <div className="pt-4 md:pt-0">
              <div className="flex justify-center text-kashmir-gold mb-1">
                <MapPin className="w-5 h-5" />
              </div>
              <p className="text-[9px] font-black text-white/30 uppercase tracking-wider">Destination</p>
              <p className="text-sm font-bold text-white mt-0.5">{destinationMain}</p>
            </div>
            
            <div className="pt-4 md:pt-0">
              <div className="flex justify-center text-kashmir-gold mb-1">
                <Clock className="w-5 h-5" />
              </div>
              <p className="text-[9px] font-black text-white/30 uppercase tracking-wider">Duration</p>
              <p className="text-sm font-bold text-white mt-0.5">{itinerary.duration}</p>
            </div>
            
            <div className="pt-4 md:pt-0">
              <div className="flex justify-center text-kashmir-gold mb-1">
                <Users className="w-5 h-5" />
              </div>
              <p className="text-[9px] font-black text-white/30 uppercase tracking-wider">Travelers</p>
              <p className="text-sm font-bold text-white mt-0.5">{itinerary.travelers} Guests</p>
            </div>

            <div className="pt-4 md:pt-0">
              <div className="flex justify-center text-kashmir-gold mb-1">
                <Calendar className="w-5 h-5" />
              </div>
              <p className="text-[9px] font-black text-white/30 uppercase tracking-wider">Curation Date</p>
              <p className="text-sm font-bold text-white mt-0.5">
                {new Date(itinerary.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Advance Payment Action Banner */}
      {itinerary.leadStage === 'PAYMENT_PENDING' && (
        <div className="container max-w-4xl mx-auto px-6 mt-10">
          <Card className="relative overflow-hidden bg-gradient-to-br from-[#0c1f24] via-[#0d161a] to-[#080d0f] border border-kashmir-gold/20 p-8 rounded-3xl shadow-[0_20px_45px_-10px_rgba(212,175,55,0.15)] flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Compass className="w-48 h-48 text-kashmir-gold" />
            </div>
            
            <div className="space-y-3 text-center md:text-left relative z-10">
              <Badge className="bg-kashmir-gold/20 hover:bg-kashmir-gold/20 text-kashmir-gold border border-kashmir-gold/30 px-3 py-1 text-[9px] font-black uppercase tracking-widest">
                Action Required: Secure Booking
              </Badge>
              <h3 className="text-2xl font-display font-black text-white tracking-tight">Lock in Your Reservation</h3>
              <p className="text-sm text-white/60 max-w-md">
                To guarantee hotel pricing, room configurations, and cab availability for your tour dates, please submit the secure advance deposit.
              </p>
            </div>
            
            <div className="flex flex-col items-center md:items-end gap-3 w-full md:w-auto relative z-10">
              <div className="text-center md:text-right">
                <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Advance Deposit Amount</p>
                <p className="text-3xl font-black text-kashmir-gold mt-1">₹{itinerary.netPrice?.toLocaleString() || '5,000'}</p>
              </div>
              <Button 
                onClick={handlePayAdvance}
                disabled={isPaying}
                className="w-full md:w-auto bg-kashmir-gold text-black hover:bg-amber-500 font-black uppercase tracking-widest text-xs h-12 px-8 rounded-xl shadow-lg shadow-kashmir-gold/20 border-none"
              >
                {isPaying ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Pay Securely with Razorpay
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Main Timeline Section */}
      <div className="container max-w-4xl mx-auto px-6 py-12">
        <h2 className="text-xl font-display font-black tracking-widest text-white/40 uppercase mb-8 pl-1">
          Detailed Timeline & Stays
        </h2>

        <div className="space-y-6 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-0.5 before:bg-white/5">
          {days.map((day, idx) => {
            const isExpanded = expandedDay === day.day;
            
            return (
              <div key={day.day} className="relative pl-10 md:pl-12 group">
                {/* Timeline Node dot indicator */}
                <div className={`absolute left-0 top-1 w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all border ${
                  isExpanded 
                    ? 'bg-kashmir-gold border-kashmir-gold text-black shadow-[0_0_15px_rgba(212,175,55,0.4)]' 
                    : 'bg-[#0f171b] border-white/10 text-white/40 group-hover:border-kashmir-gold/40'
                }`}>
                  {day.day}
                </div>

                {/* Day card */}
                <Card 
                  onClick={() => setExpandedDay(isExpanded ? null : day.day)}
                  className={`bg-[#0b1317]/60 border transition-all duration-300 rounded-2xl cursor-pointer overflow-hidden ${
                    isExpanded ? 'border-kashmir-gold/30 shadow-[0_15px_30px_-5px_rgba(0,0,0,0.5)]' : 'border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="p-6 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[8px] font-black text-kashmir-gold uppercase tracking-[0.2em] mb-1">
                        Day {day.day} Schedule
                      </p>
                      <h3 className="text-md md:text-lg font-bold text-white tracking-tight leading-tight">
                        {day.title}
                      </h3>
                    </div>
                    
                    <ChevronDown className={`w-5 h-5 text-white/30 transition-transform duration-300 ${
                      isExpanded ? 'transform rotate-180 text-kashmir-gold' : ''
                    }`} />
                  </div>

                  {isExpanded && (
                    <div className="px-6 pb-6 pt-2 border-t border-white/5 bg-[#0f171b]/40 space-y-6">
                      {/* Description */}
                      {day.activities && (
                        <div>
                          <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-2">Experiences & Activities</p>
                          <p className="text-sm text-white/70 leading-relaxed whitespace-pre-line">{day.activities}</p>
                        </div>
                      )}

                      {/* Accommodations details */}
                      {day.hotelName && (
                        <div className="p-4 bg-[#0a0f12]/80 rounded-xl border border-white/5 space-y-4">
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-lg bg-kashmir-gold/10 border border-kashmir-gold/20 flex items-center justify-center text-kashmir-gold shrink-0">
                              <Hotel className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-[8px] font-black text-kashmir-gold uppercase tracking-widest mb-0.5">Stay Particulars</p>
                              <h4 className="text-sm font-bold text-white">{day.hotelName}</h4>
                              <p className="text-[11px] text-white/50 mt-1">
                                {day.roomType} • {day.mealPlan}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Transport details */}
                      {day.transport && (
                        <div className="p-4 bg-[#0a0f12]/80 rounded-xl border border-white/5 flex items-start gap-4">
                          <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                            <Car className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-0.5">Transit Protocol</p>
                            <p className="text-xs font-semibold text-white/80">{day.transport}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Action Bars */}
      <div className="sticky bottom-0 inset-x-0 bg-gradient-to-t from-[#05080a] via-[#05080a] to-transparent py-8 px-6 border-t border-white/5 backdrop-blur-md">
        <div className="container max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Curation Inquiries</p>
            <p className="text-xs text-white/60">Have modifications or questions about this proposal?</p>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {itinerary.proposalUrl && (
              <Button 
                onClick={() => window.open(itinerary.proposalUrl || '', '_blank')}
                className="flex-1 sm:flex-none bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 text-xs font-bold uppercase tracking-wider h-11 px-5 flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4 text-kashmir-gold" /> PDF Proposal
              </Button>
            )}
            
            <Button 
              onClick={() => {
                const message = `Hello Kashmir Curators, I am reviewing my custom itinerary proposal (ID: ${itinerary.id}). I would like to discuss some details.`;
                window.open(`https://api.whatsapp.com/send?phone=918899825591&text=${encodeURIComponent(message)}`, '_blank');
              }}
              className="flex-2 sm:flex-none bg-emerald-500 hover:bg-emerald-600 text-black rounded-xl border-none text-xs font-black uppercase tracking-wider h-11 px-6 flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-4.5 h-4.5" /> Chat on WhatsApp
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
