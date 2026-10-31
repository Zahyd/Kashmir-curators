import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Package, 
  Building, 
  Car, 
  Users, 
  Image as ImageIcon, 
  Settings, 
  LogOut, 
  ChevronRight,
  HelpCircle,
  PlusCircle,
  TrendingUp,
  Sparkles,
  CreditCard,
  CalendarCheck,
  ShieldAlert,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTeamAuth, ADMIN_SIDEBAR_ITEMS, ROLE_LABELS } from '@/contexts/TeamAuthContext';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/Logo';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AdminSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: any;
  badge?: string;
  category: string;
}

const allMenuItems: MenuItem[] = [
  // Operations & Radar
  { id: 'dashboard', label: 'Executive Deck', icon: LayoutDashboard, category: 'OPERATIONS & RADAR' },
  { id: 'disruptions', label: 'Disruptions & Safety', icon: ShieldAlert, badge: 'Live', category: 'OPERATIONS & RADAR' },
  { id: 'inquiries', label: 'Trip Inquiries', icon: MessageSquare, badge: 'New', category: 'OPERATIONS & RADAR' },
  { id: 'reservations', label: 'Hotel Reservations', icon: CalendarCheck, category: 'OPERATIONS & RADAR' },
  { id: 'bookings', label: 'Bookings Engine', icon: Package, category: 'OPERATIONS & RADAR' },

  // Commerce & Intelligence
  { id: 'revenue', label: 'Revenue Intel', icon: TrendingUp, category: 'COMMERCE & CLIENTS' },
  { id: 'users', label: 'Client Directory', icon: Users, category: 'COMMERCE & CLIENTS' },
  { id: 'payments', label: 'Payment Protocols', icon: CreditCard, category: 'COMMERCE & CLIENTS' },

  // Atelier CMS & Inventory
  { id: 'packages', label: 'Packages CMS', icon: Package, category: 'ATELIER INVENTORY' },
  { id: 'hotels', label: 'Hotels CMS', icon: Building, category: 'ATELIER INVENTORY' },
  { id: 'cabs', label: 'Fleet & Cabs CMS', icon: Car, category: 'ATELIER INVENTORY' },
  { id: 'reviews', label: 'Guest Reviews', icon: Users, category: 'ATELIER INVENTORY' },
  { id: 'faqs', label: 'FAQs Knowledge', icon: HelpCircle, category: 'ATELIER INVENTORY' },
  { id: 'media', label: 'Media Library', icon: ImageIcon, category: 'ATELIER INVENTORY' },
  { id: 'planner', label: 'Planner CMS', icon: Sparkles, category: 'ATELIER INVENTORY' },
  { id: 'content', label: 'Site Content Engine', icon: Settings, category: 'ATELIER INVENTORY' },
];

export default function AdminSidebar({ activeSection, onSectionChange, isOpen, onClose }: AdminSidebarProps) {
  const { teamUser, teamLogout, systemEvents } = useTeamAuth();
  const [newInquiries, setNewInquiries] = useState(0);
  const [newReviews, setNewReviews] = useState(0);

  useEffect(() => {
    const inquiryEvents = systemEvents.filter(e => 
      e.type === 'CREATE' && e.booking && e.booking.type === 'inquiry'
    ).length;
    
    const reviewEvents = systemEvents.filter(e => 
      e.type === 'CREATE' && e.booking && e.booking.type === 'testimonial'
    ).length;

    setNewInquiries(inquiryEvents);
    setNewReviews(reviewEvents);
  }, [systemEvents]);

  const role = teamUser?.role || 'admin';
  const allowedItems = ADMIN_SIDEBAR_ITEMS[role] || ADMIN_SIDEBAR_ITEMS.admin;

  const dynamicMenuItems = allMenuItems.map(item => {
    if (item.id === 'inquiries' && newInquiries > 0) {
      return { ...item, badge: `${newInquiries} New` };
    }
    if (item.id === 'reviews' && newReviews > 0) {
      return { ...item, badge: `${newReviews} New` };
    }
    return item;
  });

  const menuItems = dynamicMenuItems.filter(item => allowedItems.includes(item.id));

  // Group items by category
  const categories = Array.from(new Set(menuItems.map(i => i.category)));

  return (
    <aside className={cn(
      "w-72 h-screen fixed left-0 top-0 bg-[#070b0e]/95 lg:bg-[#070b0e]/90 backdrop-blur-3xl border-r border-amber-500/15 flex flex-col z-[70] lg:z-50 transition-all duration-500 shadow-2xl shadow-black/80 relative overflow-hidden",
      isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
    )}>
      {/* Top Ambient Glow */}
      <div className="absolute top-0 left-0 right-0 h-44 bg-gradient-to-b from-amber-500/15 via-amber-500/5 to-transparent pointer-events-none" />

      {/* Mobile Close Button */}
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={onClose}
        className="lg:hidden absolute top-4 right-4 text-white/50 hover:text-white z-20 w-9 h-9 rounded-xl bg-white/5 border border-white/10"
      >
        <X className="w-5 h-5" />
      </Button>

      {/* Sidebar Header with Kashmir Curators Branding */}
      <div className="p-5 border-b border-white/10 relative z-10">
        <Link to="/" className="flex flex-col gap-2 p-2 rounded-2xl hover:bg-white/[0.03] transition-all group/logo border border-transparent hover:border-amber-500/20">
          <div className="flex items-center justify-between">
            <Logo isDarkBg={true} className="h-8 w-auto transition-transform duration-300 group-hover/logo:scale-105" />
            <span className="px-2 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-[8px] font-black uppercase tracking-wider shadow-sm">
              HQ Command
            </span>
          </div>
          <div className="flex items-center gap-2 px-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <p className="text-[9px] uppercase tracking-[0.2em] text-white/50 font-black">
              Valley Ground Operating System
            </p>
          </div>
        </Link>

        {/* Quick Action Dropdown — for admin */}
        {role === 'admin' && (
          <div className="mt-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-amber-500/5 border border-amber-500/30 hover:border-amber-400/60 hover:bg-amber-500/20 text-amber-200 hover:text-white transition-all duration-300 rounded-2xl h-11 px-4 shadow-sm group">
                  <div className="flex items-center gap-2.5">
                    <PlusCircle className="w-4 h-4 text-amber-400 group-hover:rotate-90 transition-transform duration-300" />
                    <span className="text-[11px] font-black uppercase tracking-wider">Execute Task</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-amber-400/50 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 bg-[#0a0f14]/98 backdrop-blur-2xl border-amber-500/20 text-white p-2 rounded-2xl shadow-2xl">
                <DropdownMenuLabel className="px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-amber-300/70">
                  Command Dispatch
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10 mx-2" />
                <DropdownMenuItem onClick={() => onSectionChange('packages')} className="cursor-pointer hover:bg-amber-400/10 focus:bg-amber-400/10 p-3 rounded-xl gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-400/15 flex items-center justify-center text-amber-400">
                    <Package className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white">New Itinerary</span>
                    <span className="text-[9px] text-white/40">Create luxury package</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSectionChange('hotels')} className="cursor-pointer hover:bg-amber-400/10 focus:bg-amber-400/10 p-3 rounded-xl gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-400/15 flex items-center justify-center text-amber-400">
                    <Building className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white">Hotel Node</span>
                    <span className="text-[9px] text-white/40">Add accommodation</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSectionChange('cabs')} className="cursor-pointer hover:bg-amber-400/10 focus:bg-amber-400/10 p-3 rounded-xl gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-400/15 flex items-center justify-center text-amber-400">
                    <Car className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white">Transport Hub</span>
                    <span className="text-[9px] text-white/40">Configure vehicle</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Categorized Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-4 custom-scrollbar relative z-10">
        {categories.map((category) => {
          const itemsInCategory = menuItems.filter(i => i.category === category);
          return (
            <div key={category} className="space-y-1">
              <div className="px-3 pt-1 pb-1 text-[8px] font-black uppercase tracking-[0.25em] text-amber-400/60">
                {category}
              </div>
              {itemsInCategory.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSectionChange(item.id);
                      if (onClose) onClose();
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl transition-all duration-300 group relative overflow-hidden",
                      isActive 
                        ? "bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-amber-500/5 text-amber-200 border border-amber-500/40 shadow-lg shadow-amber-500/10" 
                        : "text-white/60 hover:text-white hover:bg-white/[0.04] border border-transparent hover:border-white/5"
                    )}
                  >
                    <div className="flex items-center gap-3 relative z-10">
                      <div className={cn(
                        "w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300",
                        isActive 
                          ? "bg-amber-400/20 text-amber-300 border border-amber-400/40 shadow-[0_0_10px_rgba(245,158,11,0.25)]" 
                          : "bg-white/[0.03] text-white/40 border border-white/5 group-hover:text-amber-300 group-hover:bg-amber-400/10 group-hover:border-amber-400/20"
                      )}>
                        <item.icon className="w-4 h-4" />
                      </div>
                      <span className={cn(
                        "text-[11px] uppercase tracking-[0.16em]",
                        isActive ? "font-black text-amber-200" : "font-bold text-white/70 group-hover:text-white"
                      )}>
                        {item.label}
                      </span>
                    </div>
                    
                    {item.badge && (
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider relative z-10 shadow-sm",
                        isActive 
                          ? "bg-amber-400 text-slate-950 font-black shadow-amber-400/30" 
                          : "bg-amber-400/15 border border-amber-400/30 text-amber-300"
                      )}>
                        {item.badge}
                      </span>
                    )}

                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-amber-300 to-amber-500 rounded-r-full shadow-[0_0_12px_rgba(245,158,11,0.8)]" />
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* User Profile & Footer Actions */}
      <div className="p-4 border-t border-white/10 mt-auto bg-black/40 relative z-10 space-y-2.5">
        <div 
          onClick={() => {
            onSectionChange('profile');
            if (onClose) onClose();
          }}
          className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-amber-400/30 hover:bg-white/[0.06] transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-400/30 flex items-center justify-center group-hover:border-amber-400 transition-all overflow-hidden shrink-0">
            {teamUser?.image ? (
              <img src={teamUser.image} alt={teamUser.name} className="w-full h-full object-cover" />
            ) : (
              <Users className="w-5 h-5 text-amber-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white uppercase tracking-wider truncate group-hover:text-amber-200 transition-colors">
              {teamUser?.name || 'Director Zahid'}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-300 text-[8px] font-black uppercase tracking-widest border border-amber-400/25">
                {ROLE_LABELS[role] || 'Director'}
              </span>
              <span className="text-[9px] text-white/40 font-mono truncate">{teamUser?.code || 'ADMIN001'}</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <Link 
            to="/"
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-amber-400/30 hover:bg-white/[0.06] text-white/70 hover:text-white transition-all text-[10px] font-bold uppercase tracking-wider"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Live Site</span>
          </Link>
          
          <Button 
            variant="ghost" 
            onClick={teamLogout}
            className="h-auto flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all text-[10px] font-bold uppercase tracking-wider"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </Button>
        </div>
      </div>
    </aside>
  );
}
