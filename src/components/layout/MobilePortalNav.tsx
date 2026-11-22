import { Menu, X, User, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/Logo';
import NotificationBell from '../admin/NotificationBell';

interface MobilePortalNavProps {
  title?: string;
  onMenuToggle: () => void;
  isOpen: boolean;
  roleLabel?: string;
  onOpenCommandPalette?: () => void;
}

export default function MobilePortalNav({ 
  title = "Kashmir Curators", 
  onMenuToggle, 
  isOpen, 
  roleLabel,
  onOpenCommandPalette 
}: MobilePortalNavProps) {
  return (
    <nav className="lg:hidden fixed top-0 left-0 right-0 h-16 pt-[max(0rem,env(safe-area-inset-top))] bg-[#070b0e]/95 backdrop-blur-2xl border-b border-white/10 z-[60] flex items-center justify-between px-3 sm:px-5 shadow-xl">
      {/* Left side: Menu Drawer trigger & Logo */}
      <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onMenuToggle}
          className="text-white hover:bg-white/10 rounded-xl w-9 h-9 sm:w-10 sm:h-10 border border-white/10 bg-white/[0.03] shrink-0"
          title="Toggle Navigation Menu"
        >
          {isOpen ? <X className="w-4 h-4 text-amber-400" /> : <Menu className="w-4 h-4 text-amber-400" />}
        </Button>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <Logo isDarkBg={true} className="h-5 sm:h-6 w-auto" />
            <span className="px-1.5 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-[8px] font-black uppercase tracking-wider shrink-0">
              HQ
            </span>
          </div>
          {roleLabel && (
            <p className="text-[8px] uppercase tracking-[0.2em] text-white/40 font-mono font-bold truncate mt-0.5">
              {roleLabel} • Ground OS
            </p>
          )}
        </div>
      </div>

      {/* Right side: Search / ⌘K, Notifications, User Profile */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {onOpenCommandPalette && (
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-amber-400 hover:text-amber-300 hover:bg-white/[0.08] transition-colors"
            title="Open Command Search (⌘K)"
          >
            <Search className="w-4 h-4" />
          </button>
        )}
        <NotificationBell />
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-400/30 flex items-center justify-center shrink-0">
          <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
        </div>
      </div>
    </nav>
  );
}
