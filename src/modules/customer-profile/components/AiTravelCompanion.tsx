import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  Phone, 
  MessageSquare, 
  Crown, 
  ChevronRight, 
  Bot, 
  UserCheck, 
  Clock, 
  ShieldCheck, 
  MapPin, 
  Compass, 
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CustomerBooking } from '../types';

interface ChatMessage {
  sender: 'user' | 'concierge';
  text: string;
  time: string;
}

interface AiTravelCompanionProps {
  user: any;
  bookings: CustomerBooking[];
  chatMessages: ChatMessage[];
  isTyping: boolean;
  onSendMessage: (msg: string) => void;
}

export const AiTravelCompanion: React.FC<AiTravelCompanionProps> = ({
  user,
  bookings,
  chatMessages,
  isTyping,
  onSendMessage
}) => {
  const [inputValue, setInputValue] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const activeBooking = bookings.find(b => b.status === 'confirmed' || b.status === 'pending');

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isTyping]);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    onSendMessage(inputValue);
    setInputValue('');
  };

  const dynamicSuggestions = [
    activeBooking ? `What is the schedule for ${activeBooking.itemName}?` : "Recommend a 5-day luxury itinerary in Kashmir",
    "What should I pack for Gulmarg Gondola Phase 2?",
    "Request late checkout for my stay",
    "Arrange private sunset Shikara at Dal Lake",
    "Check live road conditions on Srinagar-Gulmarg highway"
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-amber-400 mb-2">
            <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
            <span>AI Personal Travel Companion</span>
          </div>
          <h2 className="font-display text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Curator Concierge & AI Companion
          </h2>
          <p className="text-white/50 text-xs md:text-sm mt-0.5">
            24/7 intelligent Kashmir travel assistant grounded in your confirmed bookings and live ground advisories.
          </p>
        </div>

        {activeBooking && (
          <div className="bg-slate-900/80 border border-white/10 px-4 py-2.5 rounded-2xl flex items-center gap-3 shrink-0">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <div>
              <p className="text-[9px] font-black uppercase text-white/40 tracking-wider">Active Journey Linked</p>
              <p className="text-xs font-bold text-amber-400 truncate max-w-[200px]">{activeBooking.itemName}</p>
            </div>
          </div>
        )}
      </div>

      {/* Hotline Action Banners */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <a 
          href="tel:+919999900000"
          className="bg-slate-900/70 hover:bg-slate-900 border border-white/10 hover:border-amber-500/40 p-4 rounded-2xl flex items-center justify-between transition-all group shadow-lg"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs md:text-sm text-white group-hover:text-amber-400 transition-colors">Direct Operations Hotline</h4>
              <p className="text-[10px] text-white/45">Emergency ground dispatch & coordinator</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white transition-colors" />
        </a>

        <a 
          href={`https://wa.me/919999900000?text=${encodeURIComponent(`Hello Kashmir Curators Concierge, I am ${user?.name || 'a guest'} (Ref: ${activeBooking ? '#' + activeBooking.id.slice(-6).toUpperCase() : 'General Inquiry'}). I need assistance.`)}`}
          target="_blank"
          rel="noreferrer"
          className="bg-slate-900/70 hover:bg-slate-900 border border-white/10 hover:border-emerald-500/40 p-4 rounded-2xl flex items-center justify-between transition-all group shadow-lg"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs md:text-sm text-white group-hover:text-emerald-400 transition-colors">WhatsApp Concierge Desk</h4>
              <p className="text-[10px] text-white/45">Direct live chat with assigned chauffeur & stay</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white transition-colors" />
        </a>
      </div>

      {/* Main Interactive Chat Terminal */}
      <div className="bg-slate-950/80 border border-white/10 rounded-3xl shadow-2xl flex flex-col h-[540px] overflow-hidden">
        {/* Terminal Header */}
        <div className="bg-slate-900/90 border-b border-white/5 px-6 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow-md">
                <Bot className="w-5 h-5" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-slate-950 rounded-full" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs md:text-sm font-extrabold text-white">Antigravity Concierge AI</h4>
                <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/20 text-[9px] font-black uppercase px-1.5 py-0">Online</Badge>
              </div>
              <p className="text-[10px] text-white/40 font-mono mt-0.5">Assigned Curator: Faheem • Operations Desk Srinagar</p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-[10px] text-white/40">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Encrypted Session</span>
          </div>
        </div>

        {/* Chat Thread */}
        <div className="flex-1 p-5 md:p-6 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-white/10">
          {chatMessages.map((msg, idx) => {
            const isUser = msg.sender === 'user';
            return (
              <div 
                key={idx} 
                className={cn(
                  "flex flex-col max-w-[85%] md:max-w-[75%]",
                  isUser ? "ml-auto items-end" : "mr-auto items-start"
                )}
              >
                <div 
                  className={cn(
                    "p-4 rounded-2xl text-xs md:text-sm leading-relaxed",
                    isUser 
                      ? "bg-amber-500 text-slate-950 font-semibold rounded-tr-none shadow-lg shadow-amber-500/10" 
                      : "bg-slate-900/90 border border-white/10 text-slate-100 rounded-tl-none shadow-md"
                  )}
                >
                  {msg.text}
                </div>
                <span className="text-[9px] text-white/30 font-mono mt-1 px-1">{msg.time}</span>
              </div>
            );
          })}

          {isTyping && (
            <div className="mr-auto flex flex-col items-start max-w-[70%]">
              <div className="bg-slate-900/90 border border-white/10 px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-1.5">
                <span className="text-[10px] text-amber-400 font-bold mr-1">Curator typing</span>
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Suggestion Chips */}
        <div className="px-5 py-2.5 flex items-center gap-2 overflow-x-auto scrollbar-none border-t border-white/5 bg-slate-950/60 shrink-0">
          <span className="text-[10px] font-black uppercase text-amber-400/80 tracking-widest shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Quick Prompts:
          </span>
          {dynamicSuggestions.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSendMessage(prompt)}
              className="px-3 py-1 bg-slate-900/80 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 text-[10px] font-medium rounded-full border border-white/5 hover:border-amber-500/30 transition-all whitespace-nowrap shrink-0"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3.5 bg-slate-900/90 border-t border-white/10 flex items-center gap-2 shrink-0">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask anything about Kashmir weather, stays, routes, or custom requests..."
            className="bg-black/50 border-white/10 rounded-xl h-11 focus-visible:ring-amber-500 text-white text-xs md:text-sm pl-4 placeholder:text-white/30"
          />
          <Button 
            onClick={handleSend}
            variant="gold" 
            size="icon" 
            className="h-11 w-11 rounded-xl shrink-0 bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
