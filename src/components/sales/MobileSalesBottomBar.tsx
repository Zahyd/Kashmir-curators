import React from 'react';
import { 
  LayoutDashboard, 
  Zap, 
  Layers, 
  Sparkles, 
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type SalesPortalTab = 
  | 'dashboard' 
  | 'live-leads' 
  | 'meta-hub'
  | 'active-pipeline' 
  | 'builder' 
  | 'vault' 
  | 'clients' 
  | 'payments' 
  | 'team-rbac' 
  | 'work-log';

interface MobileSalesBottomBarProps {
  activeTab: SalesPortalTab;
  onTabChange: (tab: SalesPortalTab) => void;
  isSidebarOpen: boolean;
  onMenuToggle: () => void;
  unclaimedCount?: number;
}

export default function MobileSalesBottomBar({
  activeTab,
  onTabChange,
  isSidebarOpen,
  onMenuToggle,
  unclaimedCount = 0
}: MobileSalesBottomBarProps) {
  const tabs = [
    { id: 'dashboard' as SalesPortalTab, label: 'Command', icon: LayoutDashboard },
    { 
      id: 'live-leads' as SalesPortalTab, 
      label: 'Leads', 
      icon: Zap, 
      badge: unclaimedCount > 0 ? unclaimedCount : undefined 
    },
    { id: 'active-pipeline' as SalesPortalTab, label: 'Pipeline', icon: Layers },
    { id: 'builder' as SalesPortalTab, label: 'Studio', icon: Sparkles },
  ];

  return (
    <nav 
      aria-label="Sales Mobile Navigation Dock"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#07090E]/95 backdrop-blur-2xl border-t border-white/10 px-2 pt-2 pb-[max(0.6rem,env(safe-area-inset-bottom))] shadow-[0_-8px_25px_rgba(0,0,0,0.7)]"
    >
      <div className="grid grid-cols-5 gap-1 items-center max-w-md mx-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id && !isSidebarOpen;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                onTabChange(tab.id);
              }}
              className={cn(
                "flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-200 relative group active:scale-95 touch-manipulation select-none min-h-[48px]",
                isActive
                  ? "text-amber-300 bg-amber-400/10 font-bold border border-amber-400/20 shadow-sm shadow-amber-500/10"
                  : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
              )}
            >
              <div className="relative">
                <Icon className={cn(
                  "w-4 h-4 transition-transform duration-200",
                  isActive ? "text-amber-400 scale-110" : "text-slate-400 group-hover:text-white"
                )} />
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[15px] h-3.5 px-1 rounded-full bg-amber-500 text-black text-[8px] font-black flex items-center justify-center shadow-md animate-pulse">
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </div>
              <span className={cn(
                "text-[9px] uppercase tracking-wider mt-1 truncate max-w-full font-mono",
                isActive ? "text-amber-300 font-extrabold" : "text-slate-400"
              )}>
                {tab.label}
              </span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-amber-400 mt-0.5 animate-pulse" />
              )}
            </button>
          );
        })}

        {/* 5th Button: Full Navigation Drawer Toggle */}
        <button
          type="button"
          onClick={onMenuToggle}
          className={cn(
            "flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-200 relative group active:scale-95 touch-manipulation select-none min-h-[48px]",
            isSidebarOpen
              ? "text-amber-300 bg-amber-400/15 font-bold border border-amber-400/30"
              : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
          )}
        >
          {isSidebarOpen ? (
            <X className="w-4 h-4 text-amber-400" />
          ) : (
            <Menu className="w-4 h-4 text-slate-400 group-hover:text-white" />
          )}
          <span className={cn(
            "text-[9px] uppercase tracking-wider mt-1 truncate font-mono",
            isSidebarOpen ? "text-amber-300 font-extrabold" : "text-slate-400"
          )}>
            Menu
          </span>
          {isSidebarOpen && (
            <span className="w-1 h-1 rounded-full bg-amber-400 mt-0.5 animate-pulse" />
          )}
        </button>
      </div>
    </nav>
  );
}
