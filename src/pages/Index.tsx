import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import FloatingActions from '@/components/layout/FloatingActions';
import HeroSection from '@/components/home/HeroSection';
import { InteractiveTripPlanner } from '@/components/planner/InteractiveTripPlanner';
import DestinationsGrid from '@/components/home/DestinationsGrid';
import AuthenticityFeatures from '@/components/home/AuthenticityFeatures';
import FeaturedPackages from '@/components/home/FeaturedPackages';
import VisualItinerary from '@/components/home/VisualItinerary';
import HowItWorks from '@/components/home/HowItWorks';
import Testimonials from '@/components/home/Testimonials';
import FAQSection from '@/components/home/FAQSection';
import NewsletterSignup from '@/components/home/NewsletterSignup';
import ContactSection from '@/components/home/ContactSection';
import DynamicCurationTicker from '@/components/home/DynamicCurationTicker';
import SeoMeta from '@/components/SeoMeta';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Sparkles, X, Mail, Lock, User, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const Index = () => {
  const { isAuthenticated, isLoading, signup, login } = useAuth();
  const [showPopup, setShowPopup] = useState(false);
  const [authMode, setAuthMode] = useState<'signup' | 'login'>('signup');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    // Show pop-up if not authenticated and hasn't seen it in this session/local storage
    if (isLoading) return;

    const hasSeen = localStorage.getItem('has_seen_landing_signup_popup');
    if (!isAuthenticated && hasSeen !== 'true') {
      const timer = setTimeout(() => {
        setShowPopup(true);
      }, 5000); // 5 seconds delay after land
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isLoading]);

  const handleClose = () => {
    localStorage.setItem('has_seen_landing_signup_popup', 'true');
    setShowPopup(false);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (authMode === 'signup' && !name)) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (authMode === 'signup') {
        const res = await signup(name, email, password);
        if (res.success) {
          toast.success('VIP Membership unlocked! Welcome to Kashmir Curators.');
          localStorage.setItem('has_seen_landing_signup_popup', 'true');
          setShowPopup(false);
        } else {
          toast.error(res.error || 'Registration failed.');
        }
      } else {
        const res = await login(email, password);
        if (res.success) {
          toast.success('Welcome back, VIP Member!');
          localStorage.setItem('has_seen_landing_signup_popup', 'true');
          setShowPopup(false);
        } else {
          toast.error(res.error || 'Invalid credentials.');
        }
      }
    } catch (err) {
      toast.error('An error occurred during verification.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <SeoMeta 
        title="Luxury Kashmir Tour Packages & Custom Itineraries"
        description="Book bespoke luxury travel experiences in Kashmir. Premium Dal Lake houseboats, private ski chalets in Gulmarg, and custom shepherds paths in Pahalgam."
        keywords="kashmir tour packages, gulmarg luxury resort, srinagar houseboats, pahalgam vacation planner, kashmir curators"
        schema={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebSite",
              "@id": "https://kashmircurators.com/#website",
              "url": "https://kashmircurators.com",
              "name": "Kashmir Curators",
              "description": "Bespoke Luxury Travel Curators for Kashmir Tours"
            },
            {
              "@type": "Organization",
              "@id": "https://kashmircurators.com/#organization",
              "name": "Kashmir Curators",
              "url": "https://kashmircurators.com",
              "logo": "https://kashmircurators.com/logo.png",
              "sameAs": [
                "https://facebook.com/kashmircurators",
                "https://instagram.com/kashmircurators"
              ]
            }
          ]
        }}
      />
      <Navbar />
      <main>
        <HeroSection />
        <DynamicCurationTicker />
        
        <section className="py-24 bg-transparent relative overflow-hidden" id="planner">
          {/* Subtle background decoration */}
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(#b5852a 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
          <div className="container mx-auto px-4 relative z-10">
            <InteractiveTripPlanner />
          </div>
        </section>

        <DestinationsGrid />
        <AuthenticityFeatures />
        <FeaturedPackages />
        <VisualItinerary />
        <HowItWorks />
        <Testimonials />
        <FAQSection />
        <NewsletterSignup />
        <ContactSection />
      </main>
      <Footer />
      <FloatingActions />

      {/* Premium Luxury Curation Signup Modal Popup */}
      {showPopup && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          
          {/* Frosted Glass Backdrop Overlay */}
          <div 
            className="absolute inset-0 bg-[#05080a]/80 backdrop-blur-md transition-opacity duration-500 animate-fade-in" 
            onClick={handleClose}
          />
          
          {/* Modal content block */}
          <div className="bg-[#0a0f12]/95 border border-white/10 rounded-[3rem] p-8 md:p-10 w-full max-w-lg text-left shadow-2xl relative z-10 overflow-hidden animate-in zoom-in duration-500">
            <div className="absolute top-0 right-0 w-48 h-48 bg-kashmir-gold/5 rounded-full blur-3xl pointer-events-none" />
            
            <button
              onClick={handleClose}
              className="absolute top-6 right-6 w-9 h-9 rounded-full border border-white/5 bg-white/5 flex items-center justify-center hover:bg-white/10 text-white/50 hover:text-white transition-all active:scale-95"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-3 mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-kashmir-gold/10 border border-kashmir-gold/20 text-kashmir-gold text-[9px] font-black uppercase tracking-widest mx-auto">
                <Sparkles className="w-3.5 h-3.5" /> Elite Access Protocol
              </div>
              <h3 className="font-display text-2xl md:text-3xl font-black text-white uppercase tracking-tight">
                Unlock <span className="text-kashmir-gold italic">Member Privileges</span>
              </h3>
              <p className="text-xs text-white/40 max-w-sm mx-auto leading-relaxed">
                Join Kashmir Curators to save up to 20% on custom packages, track dispatches, and get 24/7 VIP Concierge support.
              </p>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {authMode === 'signup' && (
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <Input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Full Name"
                    className="h-12 bg-white/5 border-white/5 rounded-xl pl-12 text-xs font-semibold"
                    required
                  />
                </div>
              )}

              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <Input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Email Address"
                  className="h-12 bg-white/5 border-white/5 rounded-xl pl-12 text-xs font-semibold"
                  required
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <Input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Secret Password"
                  className="h-12 bg-white/5 border-white/5 rounded-xl pl-12 text-xs font-semibold"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 bg-white text-black hover:bg-kashmir-gold hover:text-black font-black text-xs uppercase tracking-widest rounded-xl transition-all duration-300 shadow-lg mt-2 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Verifying...
                  </>
                ) : (
                  <>
                    {authMode === 'signup' ? 'Unlock VIP Access' : 'Sign In to Account'}
                  </>
                )}
              </Button>
            </form>

            <div className="text-center mt-6 text-xs text-white/40">
              {authMode === 'signup' ? (
                <span>
                  Already a VIP Member?{' '}
                  <button onClick={() => setAuthMode('login')} className="text-kashmir-gold font-bold hover:underline">
                    Sign In here
                  </button>
                </span>
              ) : (
                <span>
                  New to Kashmir Curators?{' '}
                  <button onClick={() => setAuthMode('signup')} className="text-kashmir-gold font-bold hover:underline">
                    Create Account
                  </button>
                </span>
              )}
            </div>

          </div>

        </div>
      )}
    </div>
  );
};

export default Index;
