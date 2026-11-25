import { useEffect, useState } from 'react';
import { Sparkles, Compass, ShieldCheck } from 'lucide-react';
import { SOCKET_URL, DEFAULT_SOCKET_OPTIONS } from '@/lib/api';
import { io } from 'socket.io-client';
import { useLandingPageContent } from '@/hooks/useLandingPageContent';

interface CuratedItem {
  message: string;
  time: string;
  type: 'booking' | 'curation' | 'fleet';
}

const fallbackTickerItems: CuratedItem[] = [
  { message: 'Gulmarg Alpine Heli-Skiing Portfolio secured for guest from London', time: '2m ago', type: 'curation' },
  { message: 'Nigeen Lake Heritage Cedar Houseboat reserved for couple from Bengaluru', time: '12m ago', type: 'booking' },
  { message: 'Toyota Fortuner 4x4 Snow Unit dispatched for SXR Airport VIP arrival', time: '25m ago', type: 'fleet' },
  { message: 'Doodhpathri & Pahalgam 6D Private Circuit quoted via B2B Agency Desk', time: '38m ago', type: 'curation' },
  { message: 'Sonamarg Thajiwas Glacier Expedition confirmed with Mountain Marshal', time: '1h ago', type: 'booking' },
  { message: '42-room Seasonal Tariff synchronized on Kashmir Hotelier CRS', time: '2h ago', type: 'fleet' },
];

export default function DynamicCurationTicker() {
  const { ticker } = useLandingPageContent();
  const [items, setItems] = useState<CuratedItem[]>(() => {
    if (ticker?.announcements && ticker.announcements.length > 0) {
      return ticker.announcements.map((msg: string, i: number) => ({
        message: msg,
        time: `${(i + 1) * 10}m ago`,
        type: i % 3 === 0 ? 'curation' : i % 3 === 1 ? 'booking' : 'fleet',
      }));
    }
    return fallbackTickerItems;
  });

  useEffect(() => {
    if (ticker?.announcements && ticker.announcements.length > 0) {
      setItems(
        ticker.announcements.map((msg: string, i: number) => ({
          message: msg,
          time: `${(i + 1) * 10}m ago`,
          type: i % 3 === 0 ? 'curation' : i % 3 === 1 ? 'booking' : 'fleet',
        }))
      );
    }
  }, [ticker?.announcements]);

  useEffect(() => {
    const socket = io(SOCKET_URL, DEFAULT_SOCKET_OPTIONS);

    socket.on('new-system-event', (event: { message: string; timestamp: string; type: string }) => {
      if (event && event.message) {
        const newItem: CuratedItem = {
          message: event.message,
          time: 'Just now',
          type: event.type === 'CREATE' ? 'booking' : 'curation',
        };
        setItems((prev) => [newItem, ...prev.slice(0, 10)]);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  if (ticker?.isEnabled === false) {
    return null;
  }

  const speed = ticker?.speed || 35;

  return (
    <div className="w-full bg-white dark:bg-[#070b0e] border-y border-slate-200 dark:border-white/10 py-3.5 overflow-hidden relative z-20 shadow-sm transition-colors">
      {/* Live Dispatch Pill */}
      <div className="hidden md:flex items-center gap-2 absolute left-4 top-1/2 -translate-y-1/2 z-20 px-3 py-1 rounded-full bg-[#111439] dark:bg-amber-400 text-white dark:text-black text-[9px] font-mono font-black uppercase tracking-widest shadow-md">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 dark:bg-black animate-pulse" />
        <span>{ticker?.badgeText || 'LIVE OS FEED'}</span>
      </div>

      {/* Decorative side fades */}
      <div className="absolute left-0 top-0 bottom-0 w-24 md:w-44 bg-gradient-to-r from-white dark:from-[#070b0e] via-white/80 dark:via-[#070b0e]/80 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white dark:from-[#070b0e] to-transparent z-10 pointer-events-none" />

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee ${speed}s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div className="flex w-max animate-marquee whitespace-nowrap gap-14 items-center">
        {[...items, ...items].map((item, idx) => (
          <div
            key={idx}
            className="inline-flex items-center gap-3 text-[11px] font-bold uppercase tracking-wider text-[#4A5568] dark:text-white/60 hover:text-[#111439] dark:hover:text-white transition-colors duration-300 cursor-default"
          >
            {item.type === 'booking' && <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />}
            {item.type === 'curation' && <Sparkles className="w-4 h-4 text-amber-500 animate-pulse shrink-0" />}
            {item.type === 'fleet' && <Compass className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />}

            <span className="text-[#111439] dark:text-white font-bold">{item.message}</span>
            <span className="text-[9px] font-mono font-semibold text-slate-500 dark:text-white/50 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 px-2.5 py-0.5 rounded-full tabular-nums">
              {item.time}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
