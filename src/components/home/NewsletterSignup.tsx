import { useState } from 'react';
import { Send, Loader2, Crown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Enter your email for the invitation');
      return;
    }
    
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast.success('Your invitation request has been received. Welcome to the Inner Circle.');
    setEmail('');
    setIsLoading(false);
  };

  return (
    <section className="py-32 bg-[#F8F8F9] dark:bg-[#05080a] relative overflow-hidden transition-colors">
      {/* Decorative Orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-amber-400/10 blur-[140px] pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-5xl mx-auto bg-white dark:bg-[#0a0f12] border border-slate-200/90 dark:border-white/10 rounded-[3.5rem] p-12 md:p-24 relative overflow-hidden animate-fade-up shadow-xl shadow-slate-900/5">
          {/* Decorative Corner Orbs */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-amber-400/10 blur-[100px] -ml-32 -mt-32" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-400/10 blur-[100px] -mr-32 -mb-32" />

          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 mb-10 shadow-sm">
              <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#111439] dark:text-white">The Inner Circle</span>
            </div>

            <h2 className="font-display text-5xl md:text-8xl font-black text-[#111439] dark:text-white mb-8 tracking-tight leading-[0.9]">
              JOIN THE <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-600 via-purple-600 to-cyan-600">CURATORS CLUB</span>
            </h2>
            
            <p className="text-[#4A5568] dark:text-white/60 text-lg md:text-xl font-medium mb-16 max-w-2xl mx-auto leading-relaxed">
              Secure your place in our exclusive registry for seasonal curations, hidden estate releases, and private travel protocol updates.
            </p>

            <form onSubmit={handleSubscribe} className="w-full max-w-xl flex flex-col md:flex-row gap-4 p-2 bg-slate-50 dark:bg-black/40 rounded-[2rem] border border-slate-200 dark:border-white/10 shadow-sm">
              <Input
                type="email"
                placeholder="Secure Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-14 bg-transparent border-none text-[#111439] dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus-visible:ring-0 px-8 font-bold text-sm"
              />
              <Button 
                type="submit" 
                disabled={isLoading}
                className="h-14 px-10 rounded-[1.5rem] bg-[#111439] hover:bg-[#1c225a] dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-black font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-[#111439]/20 transition-all duration-500"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Request Access
                    <Crown className="ml-3 h-4 w-4 text-amber-400 dark:text-black" />
                  </>
                )}
              </Button>
            </form>
            
            <p className="text-slate-500 dark:text-white/40 text-[10px] font-black uppercase tracking-widest mt-8">
              Strict Privacy Protocol • Unsubscribe at will
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
