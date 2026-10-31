import { Menu, X, User, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/Logo';
import NotificationBell from '../admin/NotificationBell';

interface MobilePortalNavProps {
  title?: string;
  onMenuToggle: () => void;
  isOpen: boolean;
  roleLabel?: string;
}

export default function MobilePortalNav({ title = "Kashmir Curators", onMenuToggle, isOpen, roleLabel }: MobilePortalNavProps) {
  return (
    <nav className="lg:hidden fixed top-0 left-0 right-0 h-20 bg-[#070b0e]/95 backdrop-blur-2xl border-b border-amber-500/20 z-[60] flex items-center justify-between px-5 shadow-2xl">
      <div className="flex items-center gap-3.5">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onMenuToggle}
          className="text-white hover:bg-white/10 rounded-2xl w-11 h-11 border border-white/10 bg-white/[0.03]"
        >
          {isOpen ? <X className="w-5 h-5 text-amber-400" /> : <Menu className="w-5 h-5 text-amber-400" />}
        </Button>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <Logo isDarkBg={true} className="h-6 w-auto" />
            <span className="px-2 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-[8px] font-black uppercase tracking-wider">
              HQ
            </span>
          </div>
          {roleLabel && (
            <p className="text-[8px] uppercase tracking-[0.25em] text-white/50 font-black mt-0.5">{roleLabel} • Ground OS</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <NotificationBell />
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-400/30 flex items-center justify-center">
          <User className="w-4 h-4 text-amber-400" />
        </div>
      </div>
    </nav>
  );
}
