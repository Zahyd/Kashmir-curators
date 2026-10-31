import { useState, useEffect } from 'react';
import { MessageCircle, Phone, X, Sparkles, Headphones, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { io } from 'socket.io-client';
import { API_BASE_URL, SOCKET_URL } from '@/lib/api';
import { useLeadCapture } from '@/contexts/LeadCaptureContext';

const formatRelativeTime = (dateString: string) => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  } catch (e) {
    return 'Recently';
  }
};

export default function FloatingActions() {
  const { openLeadModal, openCallbackModal, openWhatsAppLead } = useLeadCapture();
  const [isOpen, setIsOpen] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);
  const [socialIdx, setSocialIdx] = useState(0);
  const [showSocial, setShowSocial] = useState(false);

  useEffect(() => {
    // 1. Fetch initial recent real-time bookings/inquiries
    const fetchRecent = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/bookings/recent`);
        if (res.ok) {
          const data = await res.json();
          setBookings(data || []);
          if (data && data.length > 0) {
            // Show the first one after 3 seconds
            setTimeout(() => {
              setShowSocial(true);
            }, 3000);
          }
        }
      } catch (err) {
        console.error('Failed to load recent real-time activities:', err);
      }
    };
    fetchRecent();

    // 2. Setup socket for real-time booking/inquiry curation alerts
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling']
    });

    socket.on('new-live-curation', (newBooking) => {
      setBookings(prev => {
        // Remove duplicate if same ID
        const filtered = prev.filter(b => b.id !== newBooking.id);
        const updated = [newBooking, ...filtered];
        return updated.slice(0, 5);
      });
      // Show immediately
      setSocialIdx(0);
      setShowSocial(true);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (bookings.length <= 1) return;

    const interval = setInterval(() => {
      setShowSocial(false);
      setTimeout(() => {
        setSocialIdx((prev) => (prev + 1) % bookings.length);
        setShowSocial(true);
      }, 500);
    }, 15000); // Cycle every 15s

    return () => clearInterval(interval);
  }, [bookings]);

  const actions = [
    {
      icon: <MessageCircle className="h-5 w-5" />,
      label: 'WhatsApp',
      href: 'https://wa.me/919103798448?text=Hi! I am interested in Kashmir packages.',
      color: 'bg-[#25D366] hover:bg-[#20ba5a] text-white shadow-[0_0_15px_rgba(37,211,102,0.3)] hover:shadow-[0_0_25px_rgba(37,211,102,0.5)]',
    },
    {
      icon: <Phone className="h-5 w-5" />,
      label: 'Call Now',
      href: 'tel:+919103798448',
      color: 'bg-kashmir-lake hover:bg-kashmir-lake/90',
    },
  ];

  return (
    <>
      {/* Live Social Proof Widget - Bottom Left (Desktop and Tablets only to prevent mobile clutter/overlap) */}
      {bookings.length > 0 && bookings[socialIdx] && (
        <div 
          className={cn(
            "hidden sm:flex fixed bottom-6 left-6 z-40 max-w-xs md:max-w-sm transition-all duration-700 transform items-center gap-3.5 p-4 rounded-2xl bg-[#080d10]/95 border border-white/10 backdrop-blur-md shadow-2xl pointer-events-none select-none",
            showSocial ? "translate-y-0 opacity-100 scale-100" : "translate-y-8 opacity-0 scale-95"
          )}
        >
          <div className="w-10 h-10 rounded-full bg-kashmir-gold/15 border border-kashmir-gold/20 flex items-center justify-center flex-shrink-0 animate-pulse">
            <Sparkles className="w-4 h-4 text-kashmir-gold" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-kashmir-gold leading-none mb-1">Live Curation</p>
            <p className="text-white text-xs font-semibold truncate leading-snug">{bookings[socialIdx].message}</p>
            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-white/40">
              <span className="truncate">{bookings[socialIdx].details}</span>
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <span className="flex-shrink-0 text-kashmir-gold/70">{formatRelativeTime(bookings[socialIdx].createdAt)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Floating Buttons - Bottom Right */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col-reverse items-end gap-2.5 sm:gap-3">
        {/* Action Buttons */}
        {isOpen && (
          <div className="flex flex-col gap-2.5 animate-fade-up items-end">
            <button
              onClick={() => {
                setIsOpen(false);
                openLeadModal({ sourceCta: 'FLOATING_PLAN_TRIP' });
              }}
              className="flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-xl hover:scale-105 transition-all text-xs font-black uppercase tracking-wider"
            >
              <Sparkles className="w-4 h-4" />
              <span>Plan My Kashmir Trip</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                openCallbackModal({ sourceCta: 'FLOATING_CALLBACK' });
              }}
              className="flex items-center gap-2.5 px-4 py-3 rounded-full bg-[#111439] text-white border border-white/20 shadow-xl hover:scale-105 transition-all text-xs font-black uppercase tracking-wider"
            >
              <Phone className="w-4 h-4 text-amber-400" />
              <span>Request a Callback</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                openLeadModal({ sourceCta: 'FLOATING_EXPERT', intent: 'Talk to a Local Kashmir Specialist' });
              }}
              className="flex items-center gap-2.5 px-4 py-3 rounded-full bg-slate-900 text-white border border-slate-700 shadow-xl hover:scale-105 transition-all text-xs font-black uppercase tracking-wider"
            >
              <Headphones className="w-4 h-4 text-blue-400" />
              <span>Talk to a Local Expert</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                openWhatsAppLead({ intent: 'Direct Concierge Chat' });
              }}
              className="flex items-center gap-2.5 px-4 py-3 rounded-full bg-[#25D366] hover:bg-[#20ba5a] text-white shadow-xl hover:scale-105 transition-all text-xs font-black uppercase tracking-wider"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp Us</span>
            </button>
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

