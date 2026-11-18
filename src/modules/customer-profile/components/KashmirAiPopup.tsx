import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  X,
  MessageSquare,
  RotateCcw,
  Loader2,
  ShieldCheck,
  Minimize2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { API_BASE_URL } from '@/lib/api';
import { cn } from '@/lib/utils';
import { CustomerBooking, CustomerInquiry, KashmirLocationAdvisory } from '../types';

export interface AiChatMsg {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  time: string;
  provider?: string;
}

interface KashmirAiPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: any;
  token: string | null;
  bookings: CustomerBooking[];
  inquiries: CustomerInquiry[];
  walletBalance: number;
  advisories: KashmirLocationAdvisory[];
  prefillPrompt?: string;
  onPrefillConsumed?: () => void;
  onEscalateToOps?: (msg: string) => void;
}

export const KashmirAiPopup: React.FC<KashmirAiPopupProps> = ({
  open,
  onOpenChange,
  user,
  token,
  bookings,
  inquiries,
  walletBalance,
  advisories,
  prefillPrompt,
  onPrefillConsumed,
  onEscalateToOps
}) => {
  const [messages, setMessages] = useState<AiChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [activeProvider, setActiveProvider] = useState<string>('Live AI');
  const endRef = useRef<HTMLDivElement>(null);

  const activeBooking = bookings.find(b => b.status === 'confirmed' || b.status === 'pending');

  useEffect(() => {
    if (open) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isSending, open]);

  useEffect(() => {
    if (open && prefillPrompt && prefillPrompt.trim()) {
      setInput(prefillPrompt);
      onPrefillConsumed?.();
    }
  }, [open, prefillPrompt, onPrefillConsumed]);

  const buildLiveLocalFallback = (query: string) => {
    const q = query.toLowerCase();
    const firstName = (user?.name || 'Traveler').split(' ')[0];

    if (q.includes('booking') || q.includes('trip') || q.includes('wallet') || q.includes('account')) {
      const active = bookings.filter(b => b.status === 'confirmed' || b.status === 'pending');
      const lines = active.length > 0
        ? active.map(b => `• ${b.itemName} (#${b.id.slice(-6).toUpperCase()}) — ${b.status.toUpperCase()} • ₹${b.totalAmount.toLocaleString('en-IN')}`).join('\n')
        : '• No active bookings on your account yet.';
      return `Live Account Snapshot (${firstName}):\n${lines}\n• Custom Proposals: ${inquiries.length}\n• Travel Wallet: ₹${walletBalance.toLocaleString('en-IN')}`;
    }

    if (q.includes('weather') || q.includes('road') || q.includes('clearance')) {
      const advLines = advisories
        .map(a => `• ${a.name}: ${a.temp.toFixed(1)}°C (${a.condition}) — ${a.status}`)
        .join('\n');
      return `Current Kashmir Hotspot Status:\n${advLines}`;
    }

    return `I'm syncing with the live Kashmir Curators AI service. Meanwhile, your live account shows ${bookings.length} booking(s), ${inquiries.length} proposal(s), and ₹${walletBalance.toLocaleString('en-IN')} in Travel Wallet credits. You can also tap "WhatsApp Ops" below for immediate ground coordinator assistance.`;
  };

  const sendMessage = async (textOverride?: string) => {
    const textToSend = (textOverride ?? input).trim();
    if (!textToSend || isSending) return;

    const nowStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const userMsg: AiChatMsg = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      time: nowStr,
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInput('');
    setIsSending(true);

    // Notify ops socket only if user explicitly asks for booking modification / human escalation
    if (/checkout|cancel|modify|change|urgent|emergency/i.test(textToSend)) {
      onEscalateToOps?.(textToSend);
    }

    try {
      const res = await fetch(`${API_BASE_URL}/ai/concierge-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: textToSend,
          history: nextHistory.slice(-6).map(m => ({ sender: m.sender, text: m.text })),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const providerLabel =
          data.provider === 'GEMINI_2_5_FLASH'
            ? 'Gemini 2.5'
            : data.provider === 'NEON_AI_GATEWAY'
              ? 'AI Gateway'
              : 'Live DB';
        setActiveProvider(providerLabel);

        setMessages(prev => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            sender: 'assistant',
            text: data.reply,
            time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            provider: providerLabel,
          },
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            sender: 'assistant',
            text: buildLiveLocalFallback(textToSend),
            time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            provider: 'Live Sync',
          },
        ]);
      }
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          sender: 'assistant',
          text: buildLiveLocalFallback(textToSend),
          time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          provider: 'Live Sync',
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const quickPrompts = [
    activeBooking ? `Status of ${activeBooking.itemName}` : '5-day luxury Kashmir itinerary',
    'My bookings & wallet',
    'Live road & weather status',
    'Gulmarg packing guide',
  ];

  const whatsappHref = `https://wa.me/919999900000?text=${encodeURIComponent(
    `Hello Kashmir Curators Operations, I am ${user?.name || 'a guest'}${
      activeBooking ? ` (Booking #${activeBooking.id.slice(-6).toUpperCase()})` : ''
    }. I need assistance.`
  )}`;

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end">
      {/* Compact Floating Pop-up Chat Box */}
      {open && (
        <div className="mb-3 w-[calc(100vw-2rem)] sm:w-[390px] h-[520px] max-h-[78vh] bg-[#070d13]/95 backdrop-blur-2xl border border-amber-500/30 rounded-3xl shadow-[0_24px_80px_rgba(0,0,0,0.75)] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200 text-left">
          {/* Compact Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-slate-900 via-[#0d1520] to-slate-900 border-b border-white/10 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative shrink-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-md">
                  <Sparkles className="w-4 h-4 stroke-[2.5]" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-slate-950 rounded-full" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-extrabold text-white truncate">Kashmir Curators AI</h4>
                  <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[8px] font-black uppercase px-1.5 py-0">
                    {activeProvider}
                  </Badge>
                </div>
                <p className="text-[10px] text-white/45 truncate">Real-time synced with your Neon account</p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={() => setMessages([])}
                  title="Clear chat"
                  className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                title="Minimize"
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-white/10">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col justify-center items-center text-center px-3 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h5 className="text-sm font-extrabold text-white">
                    Hi {user?.name?.split(' ')[0] || 'Traveler'}, how can I help?
                  </h5>
                  <p className="text-[11px] text-white/50 leading-relaxed">
                    Connected live to your bookings ({bookings.length}), proposals ({inquiries.length}), wallet (₹{walletBalance.toLocaleString('en-IN')}), and Kashmir road advisories.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-400/80 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Live Database Grounded • No Mock Replies</span>
                </div>
              </div>
            ) : (
              messages.map((msg) => {
                const isUser = msg.sender === 'user';
                return (
                  <div
                    key={msg.id}
                    className={cn(
                      'flex flex-col max-w-[88%]',
                      isUser ? 'ml-auto items-end' : 'mr-auto items-start'
                    )}
                  >
                    <div
                      className={cn(
                        'px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed whitespace-pre-line',
                        isUser
                          ? 'bg-amber-500 text-slate-950 font-semibold rounded-tr-none shadow-md'
                          : 'bg-slate-900/90 border border-white/10 text-slate-100 rounded-tl-none'
                      )}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[9px] text-white/35 font-mono mt-1 px-1">
                      {msg.time}{!isUser && msg.provider ? ` • ${msg.provider}` : ''}
                    </span>
                  </div>
                );
              })
            )}

            {isSending && (
              <div className="mr-auto flex items-center gap-2 bg-slate-900/90 border border-white/10 px-3.5 py-2.5 rounded-2xl rounded-tl-none text-[11px] text-amber-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Checking live data...</span>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Compact Quick Prompts */}
          <div className="px-3 py-2 border-t border-white/5 bg-slate-950/70 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                disabled={isSending}
                onClick={() => sendMessage(prompt)}
                className="px-2.5 py-1 rounded-full bg-slate-900 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 text-[10px] font-semibold border border-white/10 hover:border-amber-500/30 transition-all whitespace-nowrap shrink-0 disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Bar + Human Escalation Strip */}
          <div className="p-3 bg-slate-900/95 border-t border-white/10 space-y-2 shrink-0">
            <div className="flex items-center gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                disabled={isSending}
                placeholder="Ask about trips, weather, stays, itineraries..."
                className="bg-black/50 border-white/10 rounded-xl h-10 text-xs text-white placeholder:text-white/35 focus-visible:ring-amber-500"
              />
              <Button
                type="button"
                size="icon"
                disabled={isSending || !input.trim()}
                onClick={() => sendMessage()}
                className="h-10 w-10 rounded-xl shrink-0 bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md"
              >
                {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>

            <div className="flex items-center justify-between text-[10px] text-white/40 px-0.5">
              <span>Need a human coordinator?</span>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 hover:text-emerald-300 font-bold inline-flex items-center gap-1"
              >
                <MessageSquare className="w-3 h-3" />
                <span>WhatsApp Human Ops</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Floating Launcher Pill Button */}
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        className={cn(
          'group flex items-center gap-2.5 h-12 px-4 rounded-full font-extrabold text-xs shadow-2xl transition-all duration-300 border',
          open
            ? 'bg-slate-900 border-white/15 text-white hover:bg-slate-800'
            : 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 border-amber-300/50 text-slate-950 hover:scale-105 shadow-amber-500/30'
        )}
      >
        {open ? (
          <>
            <X className="w-4 h-4" />
            <span>Close AI</span>
          </>
        ) : (
          <>
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-950 opacity-60" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-slate-950" />
            </span>
            <Sparkles className="w-4 h-4 stroke-[2.5]" />
            <span>Kashmir AI</span>
          </>
        )}
      </button>
    </div>
  );
};
