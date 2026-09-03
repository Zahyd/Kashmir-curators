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
    <section className="py-32 bg-[#F8F8F9] dark:bg-[#05080a] relative overflow-hidden transition-colors">
      {/* Royal Gradients */}
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-amber-400/10 blur-[140px] -ml-64 -mb-64" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-24 items-start">
          {/* Info Hub */}
          <div className="lg:w-1/3 animate-fade-up">
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm mb-8">
              <Headphones className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#111439] dark:text-white">Concierge Desk</span>
            </div>
            
            <h2 className="font-display text-5xl md:text-6xl font-black text-[#111439] dark:text-white tracking-tight mb-10 leading-[0.9] uppercase">
              SECURE YOUR <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-600 via-purple-600 to-cyan-600">CONSULTATION</span>
            </h2>
            
            <p className="text-[#4A5568] dark:text-white/60 text-lg font-medium leading-relaxed mb-12">
              Our curators are ready to engineer your private expedition. Whether you seek a hidden valley retreat or a high-altitude adventure, we provide the ultimate liaison.
            </p>

            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-white dark:bg-[#0a0f12] border border-slate-200/90 dark:border-white/10 shadow-sm flex items-center gap-6 group hover:border-slate-300 dark:hover:border-white/20 transition-all duration-500">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                  <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-[#111439] dark:text-white uppercase tracking-widest">Private Briefing</h4>
                  <p className="text-[10px] font-medium text-slate-500 dark:text-white/40">Customized itineraries within 24 hours.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Hub */}
          <div className="flex-1 w-full bg-white dark:bg-[#0a0f12] border border-slate-200/90 dark:border-white/10 rounded-[3rem] p-10 md:p-16 relative overflow-hidden animate-fade-up shadow-xl shadow-slate-900/5" style={{ animationDelay: '200ms' }}>
            <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#111439] dark:text-white ml-4">Full Identity</label>
                  <Input
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="h-16 bg-slate-50 dark:bg-black/40 border-slate-200 dark:border-white/10 rounded-2xl text-[#111439] dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus-visible:bg-white dark:focus-visible:bg-black/60 focus-visible:border-[#111439] dark:focus-visible:border-amber-400 px-6 font-bold"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#111439] dark:text-white ml-4">Secure Email</label>
                  <Input
                    type="email"
                    placeholder="name@exclusive.com"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="h-16 bg-slate-50 dark:bg-black/40 border-slate-200 dark:border-white/10 rounded-2xl text-[#111439] dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus-visible:bg-white dark:focus-visible:bg-black/60 focus-visible:border-[#111439] dark:focus-visible:border-amber-400 px-6 font-bold"
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#111439] dark:text-white ml-4">Direct Line</label>
                <Input
                  type="tel"
                  placeholder="+91 000 000 0000"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#111439] ml-4">The Brief</label>
                <Textarea
                  placeholder="Describe your vision for the expedition..."
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  className="min-h-[180px] bg-slate-50 border-slate-200 rounded-[2rem] text-[#111439] placeholder:text-slate-400 focus-visible:bg-white focus-visible:border-[#111439] p-8 font-bold resize-none"
                />
              </div>

              <Button 
                type="submit" 
                disabled={isSubmitting || isSubmitted}
                className={cn(
                  "w-full h-18 py-6 rounded-2xl font-black text-xs uppercase tracking-[0.3em] transition-all duration-700 active:scale-95 shadow-xl",
                  isSubmitted 
                    ? "bg-emerald-600 text-white" 
                    : "bg-[#111439] hover:bg-[#1c225a] text-white shadow-[#111439]/20"
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
