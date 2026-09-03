import { useEffect, useState } from 'react';
import { Sparkles, Compass, ShieldCheck } from 'lucide-react';
import { API_BASE_URL, SOCKET_URL } from '@/lib/api';
import { io } from 'socket.io-client';

interface CuratedItem {
  message: string;
  time: string;
  type: 'booking' | 'curation' | 'fleet';
}

const fallbackTickerItems: CuratedItem[] = [
  { message: "Gulmarg Alpine Heli-Skiing Portfolio secured for Adventurer from London", time: "2 mins ago", type: 'curation' },
  { message: "Ultra-Premium Dal Lake Floating Sanctuary booked for Couple from Bangalore", time: "12 mins ago", type: 'booking' },
  { message: "Private Chauffeur Cruiser dispatched for Srinagar Airport Arrival", time: "25 mins ago", type: 'fleet' },
  { message: "Naranag Shepherds Expedition drafted for trekker from Munich", time: "45 mins ago", type: 'curation' },
  { message: "Signature Pahalgam Pine Chalet reservation finalized", time: "1 hour ago", type: 'booking' },
  { message: "Custom Honeymoon Sanctuary Package synchronized with operations team", time: "2 hours ago", type: 'curation' }
];

export default function DynamicCurationTicker() {
  const [items, setItems] = useState<CuratedItem[]>(fallbackTickerItems);

  useEffect(() => {
    // Connect to WebSocket to receive real-time system events (if any) and prepend to ticker
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling']
    });

    socket.on('new-system-event', (event: { message: string; timestamp: string; type: string }) => {
      if (event && event.message) {
        const newItem: CuratedItem = {
          message: event.message,
          time: "Just now",
          type: event.type === 'CREATE' ? 'booking' : 'curation'
        };
        setItems(prev => [newItem, ...prev.slice(0, 10)]);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="w-full bg-[#070b0e] border-y border-white/5 py-4 overflow-hidden relative z-20">
      {/* Decorative side fades */}
      <div className="absolute left-0 top-0 bottom-0 w-24 ticker-fade-left z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-24 ticker-fade-right z-10 pointer-events-none" />

      {/* CSS Infinite Marquee */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 35s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div className="flex w-[200%] animate-marquee whitespace-nowrap gap-16 items-center">
        {/* Double the list to create a seamless infinite loop */}
        {[...items, ...items].map((item, idx) => (
          <div key={idx} className="inline-flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors duration-300 cursor-default">
            {item.type === 'booking' && <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />}
            {item.type === 'curation' && <Sparkles className="w-3.5 h-3.5 text-kashmir-gold animate-pulse" />}
            {item.type === 'fleet' && <Compass className="w-3.5 h-3.5 text-blue-400" />}
            
            <span>{item.message}</span>
            <span className="text-[8px] text-white/20 bg-white/5 px-2 py-0.5 rounded-full">{item.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
