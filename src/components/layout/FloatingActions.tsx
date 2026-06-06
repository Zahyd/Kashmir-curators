import { useState, useEffect } from 'react';
import { MessageCircle, Phone, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const SIMULATED_BOOKINGS = [
  { message: "Luxury package secured in Gulmarg", details: "3 Guests from Mumbai", time: "2m ago" },
  { message: "Premium Dal Lake houseboat booked", details: "2 Guests from Delhi", time: "7m ago" },
  { message: "Private chauffeur & luxury SUV locked in", details: "Family of 4 from Bengaluru", time: "14m ago" },
  { message: "Gondola Phase 1 & 2 tickets secured", details: "Couples retreat", time: "22m ago" },
  { message: "Bespoke Pahalgam Shepherds path booked", details: "Solo traveler from Dubai", time: "31m ago" }
];

export default function FloatingActions() {
  const [isOpen, setIsOpen] = useState(false);
  const [socialIdx, setSocialIdx] = useState(0);
  const [showSocial, setShowSocial] = useState(false);

  useEffect(() => {
    // Show first booking after 3 seconds
    const startTimer = setTimeout(() => {
      setShowSocial(true);
    }, 3000);

    const interval = setInterval(() => {
      setShowSocial(false);
      // Wait for exit animation, then switch and show next
      setTimeout(() => {
        setSocialIdx((prev) => (prev + 1) % SIMULATED_BOOKINGS.length);
        setShowSocial(true);
      }, 500);
    }, 15000); // Cycle every 15s

    return () => {
      clearTimeout(startTimer);
      clearInterval(interval);
    };
  }, []);

  const actions = [
    {
      icon: <MessageCircle className="h-5 w-5" />,
      label: 'WhatsApp',
      href: 'https://wa.me/911234567890?text=Hi! I am interested in Kashmir packages.',
      color: 'bg-[#25D366] hover:bg-[#20ba5a] text-white shadow-[0_0_15px_rgba(37,211,102,0.3)] hover:shadow-[0_0_25px_rgba(37,211,102,0.5)]',
    },
    {
      icon: <Phone className="h-5 w-5" />,
      label: 'Call Now',
      href: 'tel:+911234567890',
      color: 'bg-kashmir-lake hover:bg-kashmir-lake/90',
    },
  ];

  return (
    <>
      {/* Live Social Proof Widget - Bottom Left */}
      <div 
        className={cn(
          "fixed bottom-6 left-6 z-50 max-w-xs md:max-w-sm transition-all duration-700 transform flex items-center gap-3.5 p-4 rounded-2xl bg-[#080d10]/90 border border-white/5 backdrop-blur-md shadow-2xl pointer-events-none select-none",
          showSocial ? "translate-y-0 opacity-100 scale-100" : "translate-y-8 opacity-0 scale-95"
        )}
      >
        <div className="w-10 h-10 rounded-full bg-kashmir-gold/15 border border-kashmir-gold/20 flex items-center justify-center flex-shrink-0 animate-pulse">
          <Sparkles className="w-4 h-4 text-kashmir-gold" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-widest text-kashmir-gold leading-none mb-1">Live Curation</p>
          <p className="text-white text-xs font-semibold truncate leading-snug">{SIMULATED_BOOKINGS[socialIdx].message}</p>
          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-white/40">
            <span className="truncate">{SIMULATED_BOOKINGS[socialIdx].details}</span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span className="flex-shrink-0 text-kashmir-gold/70">{SIMULATED_BOOKINGS[socialIdx].time}</span>
          </div>
        </div>
      </div>

      {/* Floating Buttons - Bottom Right */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col-reverse items-end gap-3">
        {/* Action Buttons */}
        {isOpen && (
          <div className="flex flex-col gap-3 animate-fade-up">
            {actions.map((action, index) => (
              <a
                key={action.label}
                href={action.href}
                target={action.href.startsWith('http') ? '_blank' : undefined}
                rel="noopener noreferrer"
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-full text-primary-foreground shadow-lg transition-all hover:scale-105",
                  action.color
                )}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {action.icon}
                <span className="font-medium">{action.label}</span>
              </a>
            ))}
          </div>
        )}

        {/* Main Toggle Button */}
        <Button
          variant="floating"
          size="iconLg"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "shadow-gold transition-transform duration-300 bg-kashmir-gold text-black hover:bg-amber-400 hover:scale-105 shadow-[0_0_15px_rgba(212,175,55,0.35)]",
            isOpen && "rotate-45"
          )}
        >
          {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6 animate-pulse" />}
        </Button>
      </div>
    </>
  );
}

