import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent 
} from '@/components/ui/dialog';
import { 
  Search, 
  LayoutDashboard, 
  Package, 
  Compass, 
  Sparkles, 
  CreditCard, 
  FileText, 
  Gift, 
  CloudSun, 
  Settings, 
  ShieldCheck, 
  Car, 
  Phone, 
  MessageSquare,
  ArrowRight,
  Command
} from 'lucide-react';
import { ProfileTabId } from '../types';

interface ProfileCommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTab: (tab: ProfileTabId) => void;
  onOpenSafetyCard: () => void;
  onOpenDriverTracking: () => void;
  onCallCurator: () => void;
  onOpenWhatsApp: () => void;
}

export const ProfileCommandPalette: React.FC<ProfileCommandPaletteProps> = ({
  open,
  onOpenChange,
  onSelectTab,
  onOpenSafetyCard,
  onOpenDriverTracking,
  onCallCurator,
  onOpenWhatsApp
}) => {
  const [query, setQuery] = useState('');

  // Hotkey listener for Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  const actions = [
    { id: 'overview', title: 'Dashboard Overview Cockpit', category: 'Navigation', icon: LayoutDashboard, action: () => onSelectTab('overview') },
    { id: 'trips', title: 'My Trips & Bookings Workspace', category: 'Navigation', icon: Package, action: () => onSelectTab('trips') },
    { id: 'proposals', title: 'Custom Proposals & Itineraries', category: 'Navigation', icon: Compass, action: () => onSelectTab('proposals') },
    { id: 'ai-companion', title: 'AI Travel Companion & Concierge', category: 'Navigation', icon: Sparkles, action: () => onSelectTab('ai-companion') },
    { id: 'payments', title: 'Payments & Tax Invoices', category: 'Navigation', icon: CreditCard, action: () => onSelectTab('payments') },
    { id: 'documents', title: 'Encrypted Document Vault', category: 'Navigation', icon: FileText, action: () => onSelectTab('documents') },
    { id: 'loyalty', title: 'Loyalty Privileges & Travel Wallet', category: 'Navigation', icon: Gift, action: () => onSelectTab('loyalty') },
    { id: 'clearance', title: 'Kashmir Clearance Hub & Advisories', category: 'Navigation', icon: CloudSun, action: () => onSelectTab('clearance') },
    { id: 'settings', title: 'Account Settings & Preferences', category: 'Navigation', icon: Settings, action: () => onSelectTab('settings') },
    // Quick Actions
    { id: 'safety', title: 'Open Digital Offline Safety Pass', category: 'Quick Action', icon: ShieldCheck, action: onOpenSafetyCard },
    { id: 'driver', title: 'Live Track Dedicated Chauffeur', category: 'Quick Action', icon: Car, action: onOpenDriverTracking },
    { id: 'call', title: 'Call Direct Curator Hotline (+91 99999 00000)', category: 'Quick Action', icon: Phone, action: onCallCurator },
    { id: 'whatsapp', title: 'Chat with WhatsApp Ground Desk', category: 'Quick Action', icon: MessageSquare, action: onOpenWhatsApp }
  ];

  const filteredActions = actions.filter(act => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return act.title.toLowerCase().includes(q) || act.category.toLowerCase().includes(q);
  });

  const handleExecute = (actionFn: () => void) => {
    actionFn();
    onOpenChange(false);
    setQuery('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl bg-slate-950 text-white border border-white/10 rounded-3xl p-0 overflow-hidden shadow-2xl">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10 bg-slate-900/90">
          <Search className="w-5 h-5 text-amber-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, trip destination, voucher, or action..."
            className="w-full bg-transparent border-0 outline-none text-sm text-white placeholder:text-white/35 focus:ring-0"
            autoFocus
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono font-bold bg-white/5 border border-white/10 px-2 py-0.5 rounded-lg text-white/40">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-[380px] overflow-y-auto p-3 space-y-1 scrollbar-thin scrollbar-thumb-white/10 text-left">
          {filteredActions.length === 0 ? (
            <div className="p-8 text-center text-xs text-white/40">
              No matching actions or navigation tabs found.
            </div>
          ) : (
            filteredActions.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleExecute(item.action)}
                  className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-white/5 transition-all group text-left"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors truncate block">
                        {item.title}
                      </span>
                      <span className="text-[10px] text-white/40 uppercase font-mono">
                        {item.category}
                      </span>
                    </div>
                  </div>

                  <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                </button>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-5 py-2.5 bg-black/40 border-t border-white/5 flex items-center justify-between text-[10px] text-white/40">
          <span>Tip: Press <kbd className="font-mono text-white/60">Ctrl+K</kbd> anywhere on your profile</span>
          <span>Kashmir Curators Enterprise SaaS</span>
        </div>
      </DialogContent>
    </Dialog>
  );
};
