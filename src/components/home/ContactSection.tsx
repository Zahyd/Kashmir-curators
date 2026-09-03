import { useState } from 'react';
import { Send, Loader2, CheckCircle, Headphones, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function ContactSection() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.message) {
      toast.error('Identity and intent are required for consultation.');
      return;
    }

    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsSubmitting(false);
    setIsSubmitted(true);
    toast.success('Consultation request received. A senior curator will contact you.');
    
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({ name: '', email: '', phone: '', message: '' });
    }, 4000);
  };

  return (
    <section className="py-32 bg-[#05080a] relative overflow-hidden">
      {/* Royal Gradients */}
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-kashmir-gold/5 blur-[120px] -ml-64 -mb-64" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-24 items-start">
          {/* Info Hub */}
          <div className="lg:w-1/3 animate-fade-up">
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8">
              <Headphones className="w-3.5 h-3.5 text-kashmir-gold" />
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/60">Concierge Desk</span>
            </div>
            
            <h2 className="font-display text-5xl md:text-6xl font-black text-white tracking-tighter mb-10 leading-[0.9] uppercase">
              SECURE YOUR <br />
              <span className="text-kashmir-gold italic">CONSULTATION</span>
            </h2>
            
            <p className="text-white/40 text-lg font-medium leading-relaxed mb-12">
              Our curators are ready to engineer your private expedition. Whether you seek a hidden valley retreat or a high-altitude adventure, we provide the ultimate liaison.
            </p>

            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-6 group hover:border-kashmir-gold/30 transition-all duration-500">
                <div className="w-12 h-12 rounded-xl bg-kashmir-gold/10 flex items-center justify-center border border-kashmir-gold/20">
                  <Sparkles className="w-5 h-5 text-kashmir-gold" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-widest">Private Briefing</h4>
                  <p className="text-[10px] font-medium text-white/30">Customized itineraries within 24 hours.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Hub */}
          <div className="flex-1 w-full bg-white/[0.02] border border-white/5 rounded-[3rem] p-10 md:p-16 relative overflow-hidden animate-fade-up" style={{ animationDelay: '200ms' }}>
            <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-4">Full Identity</label>
                  <Input
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="h-16 bg-white/[0.03] border-white/5 rounded-2xl text-white placeholder:text-white/10 focus-visible:ring-kashmir-gold/50 focus-visible:border-kashmir-gold px-6 font-bold"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-4">Secure Email</label>
                  <Input
                    type="email"
                    placeholder="your@exclusive.com"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="h-16 bg-white/[0.03] border-white/5 rounded-2xl text-white placeholder:text-white/10 focus-visible:ring-kashmir-gold/50 focus-visible:border-kashmir-gold px-6 font-bold"
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-4">Direct Line</label>
                <Input
                  type="tel"
                  placeholder="+91 000 000 0000"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="h-16 bg-white/[0.03] border-white/5 rounded-2xl text-white placeholder:text-white/10 focus-visible:ring-kashmir-gold/50 focus-visible:border-kashmir-gold px-6 font-bold"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-4">The Brief</label>
                <Textarea
                  placeholder="Describe your vision for the expedition..."
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  className="min-h-[180px] bg-white/[0.03] border-white/5 rounded-[2rem] text-white placeholder:text-white/10 focus-visible:ring-kashmir-gold/50 focus-visible:border-kashmir-gold p-8 font-bold resize-none"
                />
              </div>

              <Button 
                type="submit" 
                disabled={isSubmitting || isSubmitted}
                className={cn(
                  "w-full h-18 py-6 rounded-2xl font-black text-xs uppercase tracking-[0.3em] transition-all duration-700 active:scale-95 shadow-2xl",
                  isSubmitted 
                    ? "bg-green-500 text-white" 
                    : "bg-kashmir-gold text-black hover:bg-amber-500 hover:scale-[1.02] shadow-kashmir-gold/10"
                )}
              >
                {isSubmitting ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : isSubmitted ? (
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-6 w-6" />
                    Protocol Initiated
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Send className="h-5 w-5" />
                    Dispatch Brief
                  </div>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
