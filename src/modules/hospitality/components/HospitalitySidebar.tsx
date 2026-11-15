import React from 'react';
import { 
  Building2, 
  CalendarCheck2, 
  BedDouble, 
  SlidersHorizontal, 
  Receipt, 
  Menu,
  ShieldCheck,
  Send,
  Layers
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export type HospitalityTab = 
  | 'dispatch'
  | 'hotels'
  | 'accommodations'
  | 'tariffs'
  | 'settlement';

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
  propertyType = 'Kashmir DMC Hotel Network',
  isVerified = true
}) => {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const navItems = [
    { id: 'dispatch' as HospitalityTab, label: 'Send Booking & Vouchers', icon: Send, badge: 'Dispatch' },
    { id: 'hotels' as HospitalityTab, label: 'Hotels & Houseboats (CRUD)', icon: Building2, badge: 'Directory' },
    { id: 'accommodations' as HospitalityTab, label: 'Accommodations & Rooms', icon: BedDouble, badge: 'Inventory' },
    { id: 'tariffs' as HospitalityTab, label: 'Seasonal Tariffs & Rates', icon: SlidersHorizontal },
    { id: 'settlement' as HospitalityTab, label: 'Settlement & Bank Dues', icon: Receipt },
  ];

  const NavContent = () => (
    <div className="flex flex-col h-full">
      {/* Property Profile Header */}
      <div className="p-5 border-b border-border/50">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-[11px] font-semibold tracking-wider uppercase text-emerald-600 dark:text-emerald-400">
            Kashmir Curators Operations
          </span>
        </div>
        <h2 className="font-bold text-lg text-foreground tracking-tight line-clamp-1">
          {propertyName || 'Kashmir Hotel Directory'}
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
          {propertyType}
        </p>
        <div className="mt-3">
          {isVerified ? (
            <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Verified Kashmir DMC Network
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
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all text-left ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-slate-950' : 'text-amber-500'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[9px] uppercase font-mono px-2 py-0.5 rounded-full ${
                    isActive 
                      ? 'bg-slate-950/20 text-slate-950 font-black' 
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-border/50 text-[11px] text-muted-foreground space-y-2">
        <div className="flex items-center justify-between">
          <span>Hotel API Status:</span>
          <span className="text-emerald-500 font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Live Synchronized
          </span>
        </div>
        <p className="text-[10px] text-muted-foreground/80 leading-relaxed">
          Authorized J&K Tourism DMC Inventory with direct contracted wholesale tariffs.
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Drawer Trigger */}
      <div className="lg:hidden p-4 border-b border-border flex items-center justify-between bg-card">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-amber-500" />
          <span className="font-bold text-sm text-foreground">{propertyName || 'Hotel Management'}</span>
        </div>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="rounded-xl h-9 gap-1.5 text-xs">
              <Menu className="w-4 h-4" />
              <span>Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72">
            <NavContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 border-r border-border/60 bg-card/60 backdrop-blur-md flex-col shrink-0 min-h-[calc(100vh-5rem)]">
        <NavContent />
      </aside>
    </>
  );
};

export default HospitalitySidebar;
