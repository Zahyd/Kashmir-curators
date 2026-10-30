import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Send, Loader2, Sparkles, Phone, ArrowRight, 
  CheckCircle2, Building2, Compass, ShieldCheck 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/lib/api';

export default function UnifiedClosingCta() {
  const [contactForm, setContactForm] = useState({
    name: '',
    phoneOrEmail: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleQuickLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name.trim() || !contactForm.phoneOrEmail.trim()) {
      toast.error('Please provide your name and contact number/email.');
      return;
    }

    setIsSubmitting(true);
    try {
      const isEmail = contactForm.phoneOrEmail.includes('@');
      const res = await fetch(`${API_BASE_URL}/inquiries/quick-capture`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: contactForm.name,
          email: isEmail ? contactForm.phoneOrEmail : 'notprovided@kashmirconnect.com',
          phone: !isEmail ? contactForm.phoneOrEmail : 'Not Provided',
          intentQuery: contactForm.message || 'Consultation Request from Landing Page',
          sourceCta: 'UNIFIED_CLOSING_CTA',
          notes: contactForm.message
        })
      });

      if (res.ok) {
        setIsSubmitted(true);
        toast.success('Your request has been received! A senior curator will connect with you within 30 minutes.');
        setContactForm({ name: '', phoneOrEmail: '', message: '' });
      } else {
        toast.error('Failed to submit consultation request. Please try again.');
      }
    } catch (err) {
      toast.error('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="py-24 bg-[#0a0f12] text-white relative overflow-hidden">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-1/2 left-10 w-[450px] h-[450px] bg-amber-500/10 blur-[150px] -translate-y-1/2 pointer-events-none rounded-full" />
      <div className="absolute top-1/2 right-10 w-[450px] h-[450px] bg-emerald-500/10 blur-[150px] -translate-y-1/2 pointer-events-none rounded-full" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch max-w-6xl mx-auto">
          
          {/* Card 1: For Direct Travelers / Tourists */}
          <div className="p-8 md:p-12 rounded-[2.5rem] bg-white/[0.04] border border-white/10 flex flex-col justify-between relative overflow-hidden shadow-2xl">
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-400 text-xs font-bold uppercase tracking-wider mb-6">
                <Compass className="w-3.5 h-3.5" />
                <span>For Discerning Travelers</span>
              </div>
              <h3 className="font-display text-3xl md:text-4xl font-black text-white leading-tight mb-4">
                Let Us Curate Your <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-200">
                  Private Kashmir Journey
                </span>
              </h3>
              <p className="text-white/60 text-sm md:text-base leading-relaxed mb-8">
                Speak directly with local Kashmir curators. We arrange heritage houseboats on Nigeen, private snow chauffeurs, and offbeat shepherd trails with 24/7 on-ground assistance.
              </p>

              {isSubmitted ? (
                <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center animate-fade-in">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                  <h4 className="font-bold text-white text-base">Consultation Reserved</h4>
                  <p className="text-xs text-white/60 mt-1">Our curator will reach out shortly with customized recommendations.</p>
                </div>
              ) : (
                <form onSubmit={handleQuickLead} className="space-y-3">
                  <Input
                    placeholder="Your Full Name"
                    value={contactForm.name}
                    onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-black/40 border-white/10 text-white placeholder:text-white/40 rounded-xl h-12 text-sm focus:border-amber-400"
                  />
                  <Input
                    placeholder="WhatsApp Phone or Email"
                    value={contactForm.phoneOrEmail}
                    onChange={(e) => setContactForm(prev => ({ ...prev, phoneOrEmail: e.target.value }))}
                    className="bg-black/40 border-white/10 text-white placeholder:text-white/40 rounded-xl h-12 text-sm focus:border-amber-400"
                  />
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full h-12 bg-amber-400 hover:bg-amber-300 text-black font-black uppercase text-xs rounded-xl transition-all shadow-lg shadow-amber-400/20"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                    <span>Request Private Consultation</span>
                  </Button>
                </form>
              )}
            </div>

            <div className="pt-8 mt-8 border-t border-white/5 flex items-center justify-between text-xs text-white/40">
              <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-400" /> 100% Local Kashmir DMC</span>
              <Link to="/planner" className="text-amber-400 hover:underline font-bold flex items-center gap-1">
                Custom Trip Planner <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Card 2: For Travel Agents & B2B Partners */}
          <div className="p-8 md:p-12 rounded-[2.5rem] bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-amber-400/25 flex flex-col justify-between relative overflow-hidden shadow-2xl">
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-400/15 border border-emerald-400/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-6">
                <Building2 className="w-3.5 h-3.5" />
                <span>For Travel Agents & DMCs</span>
              </div>
              <h3 className="font-display text-3xl md:text-4xl font-black text-white leading-tight mb-4">
                Grow Your Agency With <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-amber-300">
                  Kashmir Ground Operations
                </span>
              </h3>
              <p className="text-white/60 text-sm md:text-base leading-relaxed mb-8">
                Outstation travel agent? Access contracted B2B net rates for luxury houseboats, 4x4 snow cabs, and offbeat estates. Build white-label branded PDF quotes and protect your travelers with 24/7 ground SOS.
              </p>

              <div className="space-y-3.5 mb-8">
                <div className="flex items-start gap-3 text-xs text-white/80">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Wholesale B2B net tariffs — Zero retail markups.</span>
                </div>
                <div className="flex items-start gap-3 text-xs text-white/80">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>White-label quote generator branded with your agency logo.</span>
                </div>
                <div className="flex items-start gap-3 text-xs text-white/80">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Real-time weather radar & instant alternative corridor rerouting.</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild className="flex-1 h-12 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase text-xs rounded-xl shadow-lg shadow-emerald-500/20">
                  <Link to="/agent" className="flex items-center justify-center gap-2">
                    <span>Enter Agent Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="border-white/20 hover:bg-white/10 text-white font-bold h-12 text-xs rounded-xl">
                  <Link to="/agent?action=register">Register Agency</Link>
                </Button>
              </div>
            </div>

            <div className="pt-8 mt-8 border-t border-white/5 flex items-center justify-between text-xs text-white/40">
              <span>Instant Verification for Tour Operators</span>
              <span className="text-emerald-400 font-mono font-bold">400+ Active B2B Partners</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
