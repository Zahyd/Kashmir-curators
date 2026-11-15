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
  CheckCircle2,
  Calendar,
  Wrench,
  Layers
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export type HospitalityTab = 
  | 'overview' 
  | 'calendar'
  | 'reservations' 
  | 'inventory' 
  | 'housekeeping'
  | 'maintenance'
  | 'tariffs' 
  | 'amenities' 
  | 'payouts';

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
    { id: 'calendar' as HospitalityTab, label: 'Rack & Calendar', icon: Calendar, badge: 'Grid' },
    { id: 'reservations' as HospitalityTab, label: 'Guest Reservations', icon: CalendarCheck2, badge: 'Live' },
    { id: 'inventory' as HospitalityTab, label: 'Room Categories & Grid', icon: BedDouble },
    { id: 'housekeeping' as HospitalityTab, label: 'Housekeeping CMS', icon: Sparkles },
    { id: 'maintenance' as HospitalityTab, label: 'Maintenance & Repairs', icon: Wrench },
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
                  isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Emergency Support Card */}
      <div className="p-4 border-t border-border/50">
        <div className="p-3 bg-muted/40 rounded-2xl border border-border/60 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <PhoneCall className="w-3.5 h-3.5 text-emerald-500" />
            <span>Srinagar Ground Support</span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            24/7 winter emergency & allocation desk: +91 94190 00000
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-72 border-r border-border/60 bg-card/40 shrink-0">
        <NavContent />
      </aside>

      {/* Mobile Drawer Trigger */}
      <div className="lg:hidden p-4 border-b border-border/50 bg-card flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-bold text-sm text-foreground">{propertyName || 'Hospitality Desk'}</span>
        </div>
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="rounded-xl gap-2">
              <Menu className="w-4 h-4" />
              <span>Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72">
            <NavContent />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
};

export default HospitalitySidebar;
