import React from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Compass, 
  Sparkles, 
  CreditCard, 
  FileText, 
  Gift, 
  CloudSun, 
  Settings, 
  LogOut,
  Wallet,
  ShieldCheck,
  Search
} from 'lucide-react';
import { ProfileTabId } from '../types';
import { Badge } from '@/components/ui/badge';

interface ProfileSidebarProps {
  activeTab: ProfileTabId;
  onTabChange: (tab: ProfileTabId) => void;
  bookingsCount: number;
  proposalsCount: number;
  documentsCount: number;
  walletBalance?: number;
  onLogout: () => void;
  onOpenCommandPalette?: () => void;
}

export const ProfileSidebar: React.FC<ProfileSidebarProps> = ({
  activeTab,
  onTabChange,
  bookingsCount,
  proposalsCount,
  documentsCount,
  walletBalance = 0,
  onLogout,
  onOpenCommandPalette
}) => {
  const navItems = [
    { id: 'overview' as ProfileTabId, label: 'Overview Cockpit', icon: LayoutDashboard },
    { id: 'trips' as ProfileTabId, label: 'My Trips & Bookings', icon: Package, badge: bookingsCount },
    { id: 'proposals' as ProfileTabId, label: 'Custom Proposals', icon: Compass, badge: proposalsCount },
    { id: 'ai-companion' as ProfileTabId, label: 'AI Travel Concierge', icon: Sparkles, highlight: true },
    { id: 'payments' as ProfileTabId, label: 'Payments & Invoices', icon: CreditCard },
    { id: 'documents' as ProfileTabId, label: 'Document Vault', icon: FileText, badge: documentsCount },
    { id: 'loyalty' as ProfileTabId, label: 'Loyalty & Wallet', icon: Gift, pill: walletBalance > 0 ? `₹${walletBalance.toLocaleString('en-IN')}` : undefined },
    { id: 'clearance' as ProfileTabId, label: 'Kashmir Clearance Hub', icon: CloudSun },
    { id: 'settings' as ProfileTabId, label: 'Account Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Sticky Horizontal Touch Swipe Bar */}
      <div className="lg:hidden sticky top-16 z-30 -mx-4 px-4 py-2.5 bg-slate-950/95 backdrop-blur-xl border-b border-white/10 overflow-x-auto flex items-center gap-1.5 scrollbar-none snap-x">
        {onOpenCommandPalette && (
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold bg-slate-900 border border-white/10 text-amber-400 shrink-0 hover:bg-slate-800"
          >
            <Search className="w-3.5 h-3.5" />
            <span>⌘K</span>
          </button>
        )}
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 snap-start transition-all ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                  : 'bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800 border border-white/5'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : item.highlight ? 'text-amber-400' : 'text-slate-400'}`} />
              <span>{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black font-mono ${
                  isActive ? 'bg-slate-950 text-amber-400' : 'bg-amber-500/20 text-amber-300'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Desktop Sticky Workspace Sidebar */}
      <div className="hidden lg:block lg:w-72 shrink-0">
        <div className="bg-slate-900/80 backdrop-blur-2xl rounded-3xl p-4 shadow-2xl border border-white/10 sticky top-24 space-y-4">
          
          <div className="px-3 pt-2 pb-1 flex items-center justify-between">
            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">
              Travel Operations
            </span>
            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
              SaaS v2.4
            </span>
          </div>

          {onOpenCommandPalette && (
            <button
              type="button"
              onClick={onOpenCommandPalette}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-black/40 border border-white/5 hover:border-amber-500/30 text-white/40 hover:text-white transition-all text-xs group"
            >
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-amber-400 group-hover:scale-105 transition-transform" />
                <span>Search or action...</span>
              </div>
              <kbd className="font-mono text-[10px] bg-white/5 border border-white/10 px-1.5 py-0.5 rounded-lg text-white/40 group-hover:text-amber-400">
                ⌘K
              </kbd>
            </button>
          )}

          <nav className="space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all text-left ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 translate-x-1 font-black'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-slate-950 stroke-[2.5]' : item.highlight ? 'text-amber-400 animate-pulse' : 'text-amber-500/80'
                    }`} />
                    <span className="truncate">{item.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black font-mono ${
                        isActive ? 'bg-slate-950 text-amber-400' : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                    {item.pill && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${
                        isActive ? 'bg-slate-950 text-emerald-400' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {item.pill}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </nav>

          <div className="pt-2 border-t border-white/10 space-y-1">
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all text-left"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>

          <div className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl text-[11px] text-white/50 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white/70">Kashmir Concierge:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live 24/7
              </span>
            </div>
            <p className="text-[10px] text-white/40 leading-relaxed">
              Real-time ground assistance via Dal Lake operations desk.
            </p>
          </div>

        </div>
      </div>
    </>
  );
};

export default ProfileSidebar;
