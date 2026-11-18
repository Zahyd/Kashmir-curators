import React from 'react';
import {
  Sparkles,
  Phone,
  MessageSquare,
  ChevronRight,
  ShieldCheck,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CustomerBooking } from '../types';

interface AiTravelCompanionProps {
  user: any;
  bookings: CustomerBooking[];
  onOpenAiPopup: (prompt?: string) => void;
}

export const AiTravelCompanion: React.FC<AiTravelCompanionProps> = ({
  user,
  bookings,
  onOpenAiPopup
}) => {
  const activeBooking = bookings.find(b => b.status === 'confirmed' || b.status === 'pending');

  const whatsappHref = `https://wa.me/919999900000?text=${encodeURIComponent(
    `Hello Kashmir Curators Operations, I am ${user?.name || 'a guest'} (Ref: ${
      activeBooking ? '#' + activeBooking.id.slice(-6).toUpperCase() : 'General Inquiry'
    }). I need assistance.`
  )}`;

  const quickTopics = [
    activeBooking ? `Check details of ${activeBooking.itemName}` : 'Recommend a 5-day luxury Kashmir itinerary',
    'Live Kashmir weather & road clearance',
    'Compare verified stays & houseboats',
    'Gulmarg Gondola packing & tips',
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-amber-400 mb-2">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Kashmir Curators Concierge</span>
          </div>
          <h2 className="font-display text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            AI Assistant & Operations Support
          </h2>
          <p className="text-white/50 text-xs md:text-sm mt-0.5">
            Launch our compact floating Kashmir Curators AI anywhere on your dashboard or reach Srinagar ground operations directly.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => onOpenAiPopup()}
          className="h-10 px-5 rounded-2xl text-xs font-black bg-amber-500 hover:bg-amber-400 text-slate-950 gap-2 shadow-lg shadow-amber-500/20 shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          <span>Open Kashmir AI Box</span>
        </Button>
      </div>

      {/* Launch AI Card with Instant Topics */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-[#0c141d] border border-amber-500/30 rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-md">
              <Sparkles className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-sm md:text-base font-extrabold text-white">Kashmir Curators AI (Real-Time)</h3>
              <p className="text-xs text-white/50">Grounded in your live Neon bookings, wallet, stays catalog & weather advisories.</p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Live DB Grounded</span>
          </span>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          {quickTopics.map((topic, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onOpenAiPopup(topic)}
              className="px-3.5 py-2 rounded-xl bg-black/40 hover:bg-amber-500/15 border border-white/10 hover:border-amber-500/40 text-xs font-semibold text-white/80 hover:text-amber-300 transition-all"
            >
              {topic} &rarr;
            </button>
          ))}
        </div>
      </div>

      {/* Human Ground Operations Hotlines */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <a
          href="tel:+919999900000"
          className="bg-slate-900/70 hover:bg-slate-900 border border-white/10 hover:border-amber-500/40 p-5 rounded-2xl flex items-center justify-between transition-all group shadow-lg"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs md:text-sm text-white group-hover:text-amber-400 transition-colors">
                Direct Operations Hotline
              </h4>
              <p className="text-[11px] text-white/45 flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3" /> 24/7 Srinagar Emergency & Dispatch Desk
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white transition-colors" />
        </a>

        <a
          href={whatsappHref}
          target="_blank"
          rel="noreferrer"
          className="bg-slate-900/70 hover:bg-slate-900 border border-white/10 hover:border-emerald-500/40 p-5 rounded-2xl flex items-center justify-between transition-all group shadow-lg"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs md:text-sm text-white group-hover:text-emerald-400 transition-colors">
                WhatsApp Ground Desk
              </h4>
              <p className="text-[11px] text-white/45 mt-0.5">
                Direct human coordination for stays & chauffeurs
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white transition-colors" />
        </a>
      </div>
    </div>
  );
};
