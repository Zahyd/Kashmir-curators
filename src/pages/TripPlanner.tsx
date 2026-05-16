import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plane, CalendarDays, Wallet, Users, Loader2, Sparkles, Compass, Building, CheckCircle2, ArrowRight } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE_URL } from '@/lib/api';

export default function TripPlanner() {
  const navigate = useNavigate();
  const { user, isAuthenticated, token } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    destination: '',
    duration: '',
    accommodation: '',
    budget: '',
    travelers: ''
  });

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in or sign up to request a bespoke itinerary.');
      navigate('/auth?redirect=/planner');
      return;
    }

    if (!formData.destination || !formData.duration || !formData.accommodation || !formData.budget || !formData.travelers) {
      toast.error('Please fill in all details so our curators can design the perfect trip.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/inquiries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          customerName: user?.name,
          email: user?.email,
          phone: user?.phone || 'Not provided',
          destination: formData.destination,
          duration: formData.duration,
          travelers: formData.travelers,
          budget: formData.budget,
          accommodation: formData.accommodation,
          userId: user?.id
        })
      });

      if (response.ok) {
        setIsSuccess(true);
        toast.success('Your request has been successfully sent to our luxury curators!');
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to submit inquiry. Please try again.');
      }
    } catch (error) {
      console.error('Inquiry submission error:', error);
      toast.error('Network error. Please check your connection.');
    } finally {
      setIsSubmitting(true); // Keep it true for 2 seconds to show "Verifying Protocol"
      setTimeout(() => setIsSubmitting(false), 2000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#05080a] selection:bg-kashmir-gold/30">
      <Navbar />

      <main className="flex-1">
        
        {/* Dynamic Hero Header */}
        {!isSuccess && (
          <div className="relative pt-48 pb-48 overflow-hidden">
            <div className="absolute inset-0 z-0">
              <img 
                src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600" 
                className="w-full h-full object-cover opacity-30 grayscale"
                alt="Mountains"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-[#05080a] via-[#05080a]/80 to-[#05080a]" />
            </div>
            <div className="container mx-auto px-6 relative z-10 text-center animate-fade-up">
              <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8">
                <Compass className="w-3.5 h-3.5 text-kashmir-gold" />
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/60">Bespoke Curation</span>
              </div>
              <h1 className="font-display text-6xl md:text-8xl font-black text-white tracking-tighter mb-8 leading-[0.9] uppercase">
                PRIVATE <span className="text-kashmir-gold italic">CONSULTATION</span>
              </h1>
              <p className="text-white/40 text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed">
                Define your preferences, and our elite travel curators will hand-craft a bespoke itinerary for your ultimate Kashmir odyssey.
              </p>
            </div>
          </div>
        )}

        <div className="container mx-auto px-4 -mt-24 lg:-mt-32 relative z-20 pb-20">
          
          {isSuccess ? (
            /* SUCCESS STATE - Elite Styling */
            <div className="bg-white/[0.02] border border-white/5 rounded-[4rem] p-16 text-center max-w-3xl mx-auto backdrop-blur-2xl animate-fade-in mt-32 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-kashmir-gold to-transparent opacity-30" />
              <div className="w-24 h-24 bg-kashmir-gold/10 rounded-full flex items-center justify-center mx-auto mb-10 border border-kashmir-gold/20 shadow-2xl shadow-kashmir-gold/5">
                <CheckCircle2 className="w-12 h-12 text-kashmir-gold" />
              </div>
              <h2 className="font-display text-5xl font-black text-white uppercase tracking-tighter mb-6 leading-none">PROTOCOL <span className="text-kashmir-gold italic">INITIATED</span></h2>
              <p className="text-white/40 text-xl mb-12 max-w-lg mx-auto font-medium">
                Your request has been registered. Our expert travel designers are now crafting your bespoke proposal.
              </p>
              <div className="bg-white/[0.03] border border-white/5 p-10 rounded-[2.5rem] mb-12 text-left space-y-8">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-kashmir-gold ml-2">Next Steps in Curation:</h4>
                <ul className="space-y-6">
                  <li className="flex items-start gap-5">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 shrink-0">
                      <Building className="w-5 h-5 text-kashmir-gold/60" />
                    </div>
                    <p className="text-sm font-medium text-white/60 leading-relaxed">Verifying elite availability for <strong>{formData.accommodation.replace('-', ' ')}</strong> estates during your tenure.</p>
                  </li>
                  <li className="flex items-start gap-5">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 shrink-0">
                      <Compass className="w-5 h-5 text-kashmir-gold/60" />
                    </div>
                    <p className="text-sm font-medium text-white/60 leading-relaxed">Architecting a finalized proposal for your review within the next 24 cycles.</p>
                  </li>
                </ul>
              </div>
              <Button 
                className="h-18 px-12 rounded-[1.5rem] bg-white text-black hover:bg-kashmir-gold transition-all duration-500 font-black text-xs uppercase tracking-[0.3em] shadow-2xl"
                onClick={() => navigate('/profile')}
              >
                Access Liaison Dashboard <ArrowRight className="w-5 h-5 ml-3" />
              </Button>
            </div>
          ) : (
            /* INQUIRY FORM - Elite Styling */
            <div className="bg-white/[0.02] border border-white/5 rounded-[4rem] p-12 md:p-16 backdrop-blur-3xl max-w-5xl mx-auto shadow-2xl">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 mb-12">
                
                {/* Destination */}
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 ml-4 flex items-center gap-3">
                    <Plane className="w-3.5 h-3.5 text-kashmir-gold" /> Territory
                  </label>
                  <Select value={formData.destination} onValueChange={(v) => setFormData({...formData, destination: v})}>
                    <SelectTrigger className="h-16 bg-white/[0.03] border-white/5 rounded-2xl text-white px-6 font-bold focus:ring-kashmir-gold/50">
                      <SelectValue placeholder="Target Destination" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0a0f12] border-white/10 text-white rounded-2xl">
                      <SelectItem value="srinagar">Srinagar Central</SelectItem>
                      <SelectItem value="gulmarg">Gulmarg Resort Town</SelectItem>
                      <SelectItem value="pahalgam">Pahalgam Valley</SelectItem>
                      <SelectItem value="sonamarg">Sonamarg</SelectItem>
                      <SelectItem value="full-tour">Complete Kashmir Tour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Duration */}
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 ml-4 flex items-center gap-3">
                    <CalendarDays className="w-3.5 h-3.5 text-kashmir-gold" /> Tenure
                  </label>
                  <Select value={formData.duration} onValueChange={(v) => setFormData({...formData, duration: v})}>
                    <SelectTrigger className="h-16 bg-white/[0.03] border-white/5 rounded-2xl text-white px-6 font-bold focus:ring-kashmir-gold/50">
                      <SelectValue placeholder="Duration of stay" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0a0f12] border-white/10 text-white rounded-2xl">
                      <SelectItem value="3">3 Days (Expedited)</SelectItem>
                      <SelectItem value="5">5 Days (Classic)</SelectItem>
                      <SelectItem value="7">7 Days (Grand)</SelectItem>
                      <SelectItem value="10">10+ Days (Exhaustive)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Accommodation Preference */}
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 ml-4 flex items-center gap-3">
                    <Building className="w-3.5 h-3.5 text-kashmir-gold" /> Estate Class
                  </label>
                  <Select value={formData.accommodation} onValueChange={(v) => setFormData({...formData, accommodation: v})}>
                    <SelectTrigger className="h-16 bg-white/[0.03] border-white/5 rounded-2xl text-white px-6 font-bold focus:ring-kashmir-gold/50">
                      <SelectValue placeholder="Estate Type" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0a0f12] border-white/10 text-white rounded-2xl">
                      <SelectItem value="3-star">Standard (Comfort)</SelectItem>
                      <SelectItem value="4-star">Premium (Superior)</SelectItem>
                      <SelectItem value="5-star">Palatial (Luxury)</SelectItem>
                      <SelectItem value="houseboat">Heritage Houseboat</SelectItem>
                      <SelectItem value="mix">Curated Mix</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Vibe / Budget */}
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 ml-4 flex items-center gap-3">
                    <Wallet className="w-3.5 h-3.5 text-kashmir-gold" /> Style & Resource
                  </label>
                  <Select value={formData.budget} onValueChange={(v) => setFormData({...formData, budget: v})}>
                    <SelectTrigger className="h-16 bg-white/[0.03] border-white/5 rounded-2xl text-white px-6 font-bold focus:ring-kashmir-gold/50">
                      <SelectValue placeholder="Vibe" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0a0f12] border-white/10 text-white rounded-2xl">
                      <SelectItem value="Standard">Balanced Experience</SelectItem>
                      <SelectItem value="Luxury">Ultra-Premium</SelectItem>
                      <SelectItem value="Adventure">Expeditionist</SelectItem>
                      <SelectItem value="Romantic">Private Affair</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Travelers */}
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 ml-4 flex items-center gap-3">
                    <Users className="w-3.5 h-3.5 text-kashmir-gold" /> Principals
                  </label>
                  <Select value={formData.travelers} onValueChange={(v) => setFormData({...formData, travelers: v})}>
                    <SelectTrigger className="h-16 bg-white/[0.03] border-white/5 rounded-2xl text-white px-6 font-bold focus:ring-kashmir-gold/50">
                      <SelectValue placeholder="Party Size" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0a0f12] border-white/10 text-white rounded-2xl">
                      <SelectItem value="Solo">Solo Principal</SelectItem>
                      <SelectItem value="Couple">Couple</SelectItem>
                      <SelectItem value="Family">Small Party (3-5)</SelectItem>
                      <SelectItem value="Group">Grand Party (6+)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Submit Button */}
                <div className="space-y-4 flex items-end">
                  <Button 
                    onClick={handleSubmit} 
                    disabled={isSubmitting}
                    className="w-full h-16 text-xs font-black uppercase tracking-[0.2em] rounded-2xl bg-white text-black hover:bg-kashmir-gold shadow-2xl transition-all duration-500"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-3">
                        <Loader2 className="w-5 h-5 animate-spin" /> Verifying Protocol...
                      </span>
                    ) : (
                      <span className="flex items-center gap-3">
                        <Sparkles className="w-5 h-5 text-kashmir-gold" /> Initiate Curation
                      </span>
                    )}
                  </Button>
                </div>
              </div>

              <div className="bg-white/[0.03] rounded-[2rem] p-10 flex items-start gap-8 border border-white/5">
                <div className="w-16 h-16 rounded-2xl bg-kashmir-gold/10 flex items-center justify-center border border-kashmir-gold/20 shrink-0">
                  <Sparkles className="w-8 h-8 text-kashmir-gold" />
                </div>
                <div className="space-y-2">
                  <h5 className="font-display text-xl font-black text-white uppercase tracking-tight">The Artisan Protocol</h5>
                  <p className="text-sm font-medium text-white/30 leading-relaxed">
                    Our curators manually architect every detail. Instead of generic itineraries, we provide bespoke proposals verified for elite availability. Review your personalized proposal in the liaison dashboard once ready.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
