import React from 'react';
import { 
  Building2, 
  CalendarCheck2, 
  BedDouble, 
  SlidersHorizontal, 
  Flame, 
  Receipt, 
  PhoneCall,
  Menu,
  Sparkles,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export type HospitalityTab = 'overview' | 'reservations' | 'inventory' | 'tariffs' | 'amenities' | 'payouts';

interface HospitalitySidebarProps {
  activeTab: HospitalityTab;
  onTabChange: (tab: HospitalityTab) => void;
  propertyName?: string;
  propertyType?: string;
  isVerified?: boolean;
}

export const HospitalitySidebar: React.FC<HospitalitySidebarProps> = ({
  activeTab,
  onTabChange,
  propertyName,
  propertyType = 'Luxury Houseboat / Mountain Chalet',
  isVerified = true
}) => {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const navItems = [
    { id: 'overview' as HospitalityTab, label: 'Front Desk Overview', icon: Building2 },
    { id: 'reservations' as HospitalityTab, label: 'Guest Reservations', icon: CalendarCheck2, badge: 'Live' },
    { id: 'inventory' as HospitalityTab, label: 'Room Categories & Grid', icon: BedDouble },
    { id: 'tariffs' as HospitalityTab, label: 'Seasonal Tariffs & Meals', icon: SlidersHorizontal },
    { id: 'amenities' as HospitalityTab, label: 'Heating & Winter Ops', icon: Flame },
    { id: 'payouts' as HospitalityTab, label: 'Settlement & Bank Dues', icon: Receipt },
  ];

  const NavContent = () => (
    <div className="flex flex-col h-full">
      {/* Property Profile Header */}
      <div className="p-5 border-b border-border/50">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-[11px] font-semibold tracking-wider uppercase text-emerald-600 dark:text-emerald-400">
            Kashmir Hospitality Network
          </span>
        </div>
        <h2 className="font-bold text-lg text-foreground tracking-tight line-clamp-1">
          {propertyName || 'Chinar Heritage Estate'}
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
          {propertyType}
        </p>
        <div className="mt-3">
          {isVerified ? (
            <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Verified Kashmir Host
            </Badge>
          ) : (
            <Badge variant="outline" className="text-amber-500 border-amber-500/30">
              Audit Pending
            </Badge>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onTabChange(item.id);
                setMobileOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.01]'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-primary/10 text-primary'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Hospitality Hotline */}
      <div className="p-4 border-t border-border/50 bg-muted/30 m-3 rounded-2xl">
        <div className="flex items-center gap-2 mb-1.5">
          <PhoneCall className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-semibold text-foreground">Hotelier Help Desk</span>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Need immediate voucher resolution or guest displacement assistance?
        </p>
        <span className="text-xs font-bold text-primary block mt-2">
          +91 (194) 250-KASHMIR
        </span>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Bar */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-card border-b border-border sticky top-0 z-30">
        <div>
          <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Hospitality OS</span>
          <h3 className="font-bold text-foreground text-sm line-clamp-1">{propertyName || 'Hotel Dashboard'}</h3>
        </div>
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="rounded-xl">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-80">
            <NavContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-72 shrink-0 border-r border-border/70 bg-card h-[calc(100vh-4rem)] sticky top-16 shadow-sm overflow-hidden">
        <NavContent />
      </aside>
    </>
  );
};

export default HospitalitySidebar;
