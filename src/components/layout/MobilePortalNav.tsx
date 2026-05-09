import { Menu, X, Bell, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MobilePortalNavProps {
  title: string;
  onMenuToggle: () => void;
  isOpen: boolean;
  roleLabel?: string;
}

export default function MobilePortalNav({ title, onMenuToggle, isOpen, roleLabel }: MobilePortalNavProps) {
  return (
    <nav className="lg:hidden fixed top-0 left-0 right-0 h-20 bg-[#0a0f12]/80 backdrop-blur-2xl border-b border-white/5 z-[60] flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onMenuToggle}
          className="text-white hover:bg-white/5 rounded-xl"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6 text-kashmir-gold" />}
        </Button>
        <div>
          <h2 className="text-sm font-display font-black text-white tracking-tight leading-none">{title}</h2>
          {roleLabel && (
            <p className="text-[8px] uppercase tracking-[0.3em] text-kashmir-gold font-black opacity-60 mt-1">{roleLabel}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="text-white/40 hover:text-white rounded-xl">
          <Bell className="w-5 h-5" />
        </Button>
        <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
          <User className="w-4 h-4 text-kashmir-gold" />
        </div>
      </div>
    </nav>
  );
}
