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
    <section className="py-32 bg-[#05080a] relative overflow-hidden">
      {/* Cinematic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[#05080a]" />
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-kashmir-gold/20 via-transparent to-transparent" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-5xl mx-auto bg-white/[0.02] border border-white/5 rounded-[3.5rem] p-12 md:p-24 relative overflow-hidden animate-fade-up">
          {/* Decorative Corner Orbs */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-kashmir-gold/5 blur-[100px] -ml-32 -mt-32" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-500/5 blur-[100px] -mr-32 -mb-32" />

          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-white/5 border border-white/10 mb-10">
              <Sparkles className="w-4 h-4 text-kashmir-gold" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/60">The Inner Circle</span>
            </div>

            <h2 className="font-display text-5xl md:text-8xl font-black text-white mb-8 tracking-tighter leading-[0.9]">
              JOIN THE <br />
              <span className="text-kashmir-gold">CURATORS CLUB</span>
            </h2>
            
            <p className="text-white/40 text-lg md:text-xl font-medium mb-16 max-w-2xl mx-auto leading-relaxed">
              Secure your place in our exclusive registry for seasonal curations, hidden estate releases, and private travel protocol updates.
            </p>

            <form onSubmit={handleSubscribe} className="w-full max-w-xl flex flex-col md:flex-row gap-4 p-2 bg-white/5 rounded-[2rem] border border-white/10 backdrop-blur-xl">
              <Input
                type="email"
                placeholder="Secure Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-14 bg-transparent border-none text-white placeholder:text-white/20 focus-visible:ring-0 px-8 font-bold"
              />
              <Button 
                type="submit" 
                disabled={isLoading}
                className="h-14 px-10 rounded-[1.5rem] bg-kashmir-gold text-black hover:bg-amber-500 font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-kashmir-gold/10 transition-all duration-500"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Request Access
                    <Crown className="ml-3 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
            
            <p className="text-white/20 text-[10px] font-black uppercase tracking-widest mt-8">
              Strict Privacy Protocol • Unsubscribe at will
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
