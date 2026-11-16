import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  BedDouble, 
  SlidersHorizontal, 
  Receipt, 
  Menu,
  ShieldCheck,
  Send,
  Layers,
  UserCheck,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  Command,
  Sparkles,
  Wifi
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export type HospitalityTab = 
  | 'overview'
  | 'reception'
  | 'dispatch'
  | 'attendance'
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
  onOpenCommandPalette?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const HospitalitySidebar: React.FC<HospitalitySidebarProps> = ({
  activeTab,
  onTabChange,
  propertyName,
  propertyType = 'Kashmir DMC Hotel Network',
  isVerified = true,
  onOpenCommandPalette,
  isCollapsed: controlledCollapsed,
  onToggleCollapse
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  
  // Local collapsed state fallback if not controlled
  const [localCollapsed, setLocalCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hospitality_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : localCollapsed;

  const toggleCollapse = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      const next = !localCollapsed;
      setLocalCollapsed(next);
      try {
        localStorage.setItem('hospitality_sidebar_collapsed', String(next));
      } catch {}
    }
  };

  const navItems = [
    { id: 'overview' as HospitalityTab, label: 'Operations Dashboard', icon: LayoutDashboard, badge: 'Command', shortcut: '1' },
    { id: 'reception' as HospitalityTab, label: 'Hotel Reception Portal', icon: Building2, badge: 'Live Desk', shortcut: '2' },
    { id: 'dispatch' as HospitalityTab, label: 'Send Booking & Vouchers', icon: Send, badge: 'Dispatch', shortcut: '3' },
    { id: 'attendance' as HospitalityTab, label: 'Employee Attendance & Radar', icon: UserCheck, badge: 'Presence', shortcut: '4' },
    { id: 'hotels' as HospitalityTab, label: 'Hotels & Houseboats (CRUD)', icon: Layers, badge: 'Directory', shortcut: '5' },
    { id: 'accommodations' as HospitalityTab, label: 'Accommodations & Rooms', icon: BedDouble, badge: 'Inventory', shortcut: '6' },
    { id: 'tariffs' as HospitalityTab, label: 'Seasonal Tariffs & Rates', icon: SlidersHorizontal, shortcut: '7' },
    { id: 'settlement' as HospitalityTab, label: 'Settlement & Bank Dues', icon: Receipt, shortcut: '8' },
  ];

  const NavContent = ({ collapsed = false }: { collapsed?: boolean }) => (
    <div className="flex flex-col h-full bg-gradient-to-b from-card/90 via-card/60 to-background">
      {/* Property Profile Header */}
      <div className={`border-b border-border/60 transition-all ${collapsed ? 'p-3 flex flex-col items-center text-center' : 'p-5'}`}>
        {!collapsed ? (
          <>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-[11px] font-black tracking-wider uppercase text-emerald-600 dark:text-emerald-400">
                  Kashmir Curators Ops
                </span>
              </div>
              <Badge variant="outline" className="text-[9px] font-mono border-amber-500/30 text-amber-500 bg-amber-500/5 px-1.5 py-0">
                SaaS v2.4
              </Badge>
            </div>
            <h2 className="font-extrabold text-base text-foreground tracking-tight line-clamp-1">
              {propertyName || 'Kashmir Hotel Directory'}
            </h2>
            <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
              {propertyType}
            </p>
            <div className="mt-3 flex items-center justify-between">
              {isVerified ? (
                <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 flex items-center gap-1 text-[10px] font-bold py-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  Verified DMC
                </Badge>
              ) : (
                <Badge variant="outline" className="text-amber-500 border-amber-500/30 text-[10px]">
                  Audit Pending
                </Badge>
              )}
            </div>
          </>
        ) : (
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-sm cursor-pointer">
                  <Building2 className="w-5 h-5" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-bold text-xs bg-popover text-foreground border-border">
                {propertyName || 'Kashmir Curators Operations'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Command Palette Trigger Button */}
      {onOpenCommandPalette && (
        <div className={`p-3 border-b border-border/40 ${collapsed ? 'flex justify-center' : ''}`}>
          {collapsed ? (
            <TooltipProvider delayDuration={150}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={onOpenCommandPalette}
                    className="w-10 h-10 rounded-2xl border-border/70 hover:border-amber-500/50 hover:bg-amber-500/10 text-muted-foreground hover:text-amber-500"
                  >
                    <Command className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs font-bold">
                  Command Palette (⌘K)
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <button
              onClick={onOpenCommandPalette}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-muted/40 hover:bg-muted/80 border border-border/60 hover:border-amber-500/40 text-xs text-muted-foreground hover:text-foreground transition-all group"
            >
              <div className="flex items-center gap-2 font-medium">
                <Command className="w-3.5 h-3.5 text-amber-500 group-hover:scale-110 transition-transform" />
                <span>Command Menu</span>
              </div>
              <kbd className="px-1.5 py-0.5 rounded bg-background border border-border/70 text-[10px] font-mono text-muted-foreground shadow-xs">
                ⌘K
              </kbd>
            </button>
          )}
        </div>
      )}

      {/* Navigation Links */}
      <nav className={`flex-1 space-y-1.5 overflow-y-auto ${collapsed ? 'p-2' : 'p-3'}`}>
        <TooltipProvider delayDuration={100}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            if (collapsed) {
              return (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => {
                        onTabChange(item.id);
                        setMobileOpen(false);
                      }}
                      className={`w-full aspect-square rounded-2xl flex items-center justify-center transition-all ${
                        isActive
                          ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25 scale-105'
                          : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? 'text-slate-950 stroke-[2.5]' : 'text-amber-500/90'}`} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-popover text-foreground border-border text-xs flex items-center gap-2">
                    <span className="font-bold">{item.label}</span>
                    {item.shortcut && (
                      <kbd className="text-[10px] bg-muted px-1 py-0.5 rounded font-mono text-muted-foreground">
                        Alt+{item.shortcut}
                      </kbd>
                    )}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  setMobileOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all text-left ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 translate-x-1'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-slate-950 stroke-[2.5]' : 'text-amber-500'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {item.badge && (
                    <span
                      className={`text-[9px] uppercase font-mono px-2 py-0.5 rounded-full ${
                        isActive 
                          ? 'bg-slate-950/20 text-slate-950 font-black' 
                          : 'bg-muted/80 text-muted-foreground'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {item.shortcut && !item.badge && (
                    <kbd className={`text-[9px] font-mono px-1 py-0.5 rounded ${isActive ? 'bg-slate-950/20 text-slate-950' : 'text-muted-foreground/50'}`}>
                      {item.shortcut}
                    </kbd>
                  )}
                </div>
              </button>
            );
          })}
        </TooltipProvider>
      </nav>

      {/* Footer Info & Collapse Toggle */}
      <div className={`border-t border-border/50 ${collapsed ? 'p-3 flex flex-col items-center gap-3' : 'p-4 space-y-3'}`}>
        {!collapsed ? (
          <>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                Hotel API Mesh:
              </span>
              <span className="text-emerald-500 font-bold flex items-center gap-1">
                Live 24/7
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground/75 leading-relaxed">
              Wholesale Kashmir DMC CRS Engine • Real-time inventory sync.
            </p>
          </>
        ) : (
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs font-bold">
                Live Kashmir CRS Mesh Connected
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Desktop Collapse / Expand Button */}
        <button
          onClick={toggleCollapse}
          className={`hidden lg:flex items-center justify-center rounded-xl bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-all border border-border/50 ${
            collapsed ? 'w-10 h-10' : 'w-full py-2 text-xs font-bold gap-2'
          }`}
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4 text-amber-500" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4 text-amber-500" />
              <span>Collapse Sidebar</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Drawer Trigger */}
      <div className="lg:hidden p-3 border-b border-border/70 flex items-center justify-between bg-card/90 backdrop-blur-md sticky top-16 z-30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <span className="font-extrabold text-xs text-foreground block truncate max-w-[180px]">
              {propertyName || 'Hospitality Desk'}
            </span>
            <span className="text-[10px] text-muted-foreground block">Kashmir Curators Operations</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenCommandPalette && (
            <Button
              variant="outline"
              size="icon"
              onClick={onOpenCommandPalette}
              className="rounded-xl h-9 w-9 border-border/70"
            >
              <Command className="w-4 h-4 text-amber-500" />
            </Button>
          )}

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-xl h-9 gap-1.5 text-xs font-bold border-border/70">
                <Menu className="w-4 h-4" />
                <span>Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72 bg-card border-r border-border">
              <NavContent collapsed={false} />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Desktop Sidebar (Collapsible with smooth transition) */}
      <aside 
        className={`hidden lg:flex border-r border-border/60 bg-card/60 backdrop-blur-xl flex-col shrink-0 min-h-[calc(100vh-5rem)] transition-all duration-300 ease-in-out sticky top-20 self-start max-h-[calc(100vh-5rem)] ${
          isCollapsed ? 'w-20' : 'w-72'
        }`}
      >
        <NavContent collapsed={isCollapsed} />
      </aside>

      {/* Mobile Bottom Quick-Navigation Bar (Sticky at bottom on phones/tablets) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 dark:bg-slate-950/95 backdrop-blur-xl border-t border-border/80 dark:border-slate-800 px-3 py-1 flex items-center justify-around shadow-2xl">
        {[
          { id: 'overview' as HospitalityTab, label: 'Overview', icon: LayoutDashboard },
          { id: 'reception' as HospitalityTab, label: 'Reception', icon: Building2 },
          { id: 'dispatch' as HospitalityTab, label: 'Dispatch', icon: Send },
          { id: 'attendance' as HospitalityTab, label: 'Presence', icon: UserCheck },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center gap-0.5 py-1 px-2.5 rounded-xl transition-all ${
                isActive
                  ? 'text-amber-500 font-black'
                  : 'text-slate-500 dark:text-slate-400 hover:text-foreground font-semibold'
              }`}
            >
              <div className={`p-1 rounded-xl transition-all ${isActive ? 'bg-amber-500/20 text-amber-500' : ''}`}>
                <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.5]' : ''}`} />
              </div>
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </button>
          );
        })}

        {/* All Desks Drawer Trigger */}
        <button
          onClick={() => setMobileOpen(true)}
          className="flex flex-col items-center justify-center gap-0.5 py-1 px-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-foreground font-semibold transition-all"
        >
          <div className="p-1 rounded-xl">
            <Menu className="w-4 h-4" />
          </div>
          <span className="text-[10px] tracking-tight">More</span>
        </button>
      </div>
    </>
  );
};

export default HospitalitySidebar;
