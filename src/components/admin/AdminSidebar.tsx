import { useState, useEffect, useMemo } from 'react';
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
  X,
  Layers,
  MapPin,
  Route,
  Compass,
  Tag,
  Globe,
  BarChart3,
  History,
  Sliders,
  Search,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTeamAuth, ADMIN_SIDEBAR_ITEMS, ROLE_LABELS } from '@/contexts/TeamAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  { id: 'reports', label: 'Reports & Telemetry', icon: BarChart3, category: 'COMMERCE & CLIENTS' },
  { id: 'users', label: 'Client Directory', icon: Users, category: 'COMMERCE & CLIENTS' },
  { id: 'payments', label: 'Payment Protocols', icon: CreditCard, category: 'COMMERCE & CLIENTS' },
  { id: 'coupons', label: 'Coupons & Offers', icon: Tag, category: 'COMMERCE & CLIENTS' },

  // Atelier CMS & Inventory
  { id: 'page_builder', label: 'Visual Page Builder', icon: Layers, badge: 'CMS', category: 'ATELIER INVENTORY' },
  { id: 'destinations', label: 'Destinations CMS', icon: MapPin, category: 'ATELIER INVENTORY' },
  { id: 'packages', label: 'Packages CMS', icon: Package, category: 'ATELIER INVENTORY' },
  { id: 'itinerary_builder', label: 'Itinerary Builder', icon: Route, category: 'ATELIER INVENTORY' },
  { id: 'hotels', label: 'Hotels CMS', icon: Building, category: 'ATELIER INVENTORY' },
  { id: 'cabs', label: 'Fleet & Cabs CMS', icon: Car, category: 'ATELIER INVENTORY' },
  { id: 'activities', label: 'Experiences CMS', icon: Compass, category: 'ATELIER INVENTORY' },
  { id: 'reviews', label: 'Guest Reviews', icon: Users, category: 'ATELIER INVENTORY' },
  { id: 'faqs', label: 'FAQs Knowledge', icon: HelpCircle, category: 'ATELIER INVENTORY' },
  { id: 'media', label: 'Media Library', icon: ImageIcon, category: 'ATELIER INVENTORY' },
  { id: 'planner', label: 'Planner CMS', icon: Sparkles, category: 'ATELIER INVENTORY' },
  { id: 'content', label: 'Site Content Engine', icon: Sliders, category: 'ATELIER INVENTORY' },

  // System & Governance
  { id: 'seo', label: 'SEO & Search Engine', icon: Globe, category: 'SYSTEM & SETTINGS' },
  { id: 'audit_logs', label: 'Security & Audit Logs', icon: History, category: 'SYSTEM & SETTINGS' },
  { id: 'settings', label: 'Platform Settings', icon: Settings, category: 'SYSTEM & SETTINGS' },
];

export default function AdminSidebar({ activeSection, onSectionChange, isOpen, onClose }: AdminSidebarProps) {
  const { teamUser, teamLogout, systemEvents } = useTeamAuth();
  const [newInquiries, setNewInquiries] = useState(0);
  const [newReviews, setNewReviews] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

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

  const dynamicMenuItems = useMemo(() => {
    return allMenuItems.map(item => {
      if (item.id === 'inquiries' && newInquiries > 0) {
        return { ...item, badge: `${newInquiries} New` };
      }
      if (item.id === 'reviews' && newReviews > 0) {
        return { ...item, badge: `${newReviews} New` };
      }
      return item;
    });
  }, [newInquiries, newReviews]);

  const menuItems = useMemo(() => {
    return dynamicMenuItems
      .filter(item => allowedItems.includes(item.id))
      .filter(item => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return item.label.toLowerCase().includes(q) || item.category.toLowerCase().includes(q);
      });
  }, [dynamicMenuItems, allowedItems, searchQuery]);

  // Group items by category
  const categories = Array.from(new Set(menuItems.map(i => i.category)));

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="lg:hidden fixed inset-0 bg-black/70 backdrop-blur-md z-[65] animate-in fade-in duration-300"
        />
      )}

      <aside className={cn(
        "w-72 h-screen fixed left-0 top-0 bg-[#070b0e]/98 lg:bg-[#070b0e]/95 backdrop-blur-3xl border-r border-white/10 flex flex-col z-[70] lg:z-50 transition-all duration-300 shadow-2xl shadow-black/90",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Top Horizon Glow */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent pointer-events-none" />

        {/* Mobile Close Button */}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onClose}
          className="lg:hidden absolute top-4 right-4 text-white/50 hover:text-white z-20 w-8 h-8 rounded-xl bg-white/5 border border-white/10"
        >
          <X className="w-4 h-4" />
        </Button>

        {/* Sidebar Header with Kashmir Curators Branding */}
        <div className="p-4 sm:p-5 border-b border-white/10 relative z-10 space-y-3">
          <Link 
            to="/" 
            className="flex items-center justify-between p-1.5 rounded-xl hover:bg-white/[0.03] transition-all group/logo border border-transparent hover:border-amber-500/20"
          >
            <div className="flex items-center gap-2.5">
              <Logo isDarkBg={true} className="h-7 w-auto transition-transform duration-300 group-hover/logo:scale-105" />
            </div>
            <span className="px-2 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/25 text-amber-300 text-[8px] font-black uppercase tracking-wider">
              COMMAND HQ
            </span>
          </Link>

          {/* Quick Module Filter Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Search modules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-9 pr-7 bg-white/[0.04] border-white/10 text-xs text-white placeholder:text-white/30 rounded-xl focus:border-amber-400/50 focus:ring-amber-400/20"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Fast Action Dropdown */}
          {role === 'admin' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full justify-between bg-white/[0.02] border-white/10 hover:border-amber-400/40 hover:bg-white/[0.06] text-white/80 hover:text-white transition-all rounded-xl h-9 px-3 text-xs group"
                >
                  <div className="flex items-center gap-2">
                    <PlusCircle className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-90 transition-transform duration-300" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">Quick Action</span>
                  </div>
                  <ChevronRight className="w-3 h-3 text-white/30 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-60 bg-[#0a0f14]/98 backdrop-blur-2xl border-white/10 text-white p-1.5 rounded-2xl shadow-2xl z-[80]">
                <DropdownMenuLabel className="px-3 py-2 text-[9px] font-black uppercase tracking-[0.2em] text-amber-300/70">
                  Command Dispatch
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10 mx-1" />
                <DropdownMenuItem onClick={() => { onSectionChange('packages'); if (onClose) onClose(); }} className="cursor-pointer hover:bg-white/10 p-2.5 rounded-xl gap-2.5">
                  <Package className="w-4 h-4 text-amber-400" />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white">New Tour Package</span>
                    <span className="text-[9px] text-white/40">Add luxury collection</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { onSectionChange('hotels'); if (onClose) onClose(); }} className="cursor-pointer hover:bg-white/10 p-2.5 rounded-xl gap-2.5">
                  <Building className="w-4 h-4 text-blue-400" />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white">Add Stay / Houseboat</span>
                    <span className="text-[9px] text-white/40">Configure hotel node</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { onSectionChange('cabs'); if (onClose) onClose(); }} className="cursor-pointer hover:bg-white/10 p-2.5 rounded-xl gap-2.5">
                  <Car className="w-4 h-4 text-emerald-400" />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white">Deploy Fleet Vehicle</span>
                    <span className="text-[9px] text-white/40">4x4 & luxury cabs</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { onSectionChange('page_builder'); if (onClose) onClose(); }} className="cursor-pointer hover:bg-white/10 p-2.5 rounded-xl gap-2.5">
                  <Layers className="w-4 h-4 text-purple-400" />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white">Visual Page Builder</span>
                    <span className="text-[9px] text-white/40">Reorder & edit landing</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Categorized Navigation Links */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-4 custom-scrollbar relative z-10">
          {categories.map((category) => {
            const itemsInCategory = menuItems.filter(i => i.category === category);
            return (
              <div key={category} className="space-y-1">
                <div className="px-3 pt-1 pb-1 text-[8px] font-black uppercase tracking-[0.2em] text-white/35">
                  {category}
                </div>
                {itemsInCategory.map((item) => {
                  const isActive = activeSection === item.id;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSectionChange(item.id);
                        if (onClose) onClose();
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-200 group text-left",
                        isActive 
                          ? "bg-amber-400/10 text-amber-200 font-semibold border-l-2 border-amber-400 shadow-sm" 
                          : "text-white/60 hover:text-white hover:bg-white/[0.04]"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon className={cn(
                          "w-4 h-4 shrink-0 transition-colors",
                          isActive ? "text-amber-400" : "text-white/40 group-hover:text-amber-300"
                        )} />
                        <span className="text-xs truncate tracking-wide">
                          {item.label}
                        </span>
                      </div>
                      
                      {item.badge && (
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider shrink-0",
                          isActive 
                            ? "bg-amber-400 text-black font-bold" 
                            : "bg-white/5 text-white/50 border border-white/10"
                        )}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}

          {menuItems.length === 0 && (
            <div className="py-8 text-center text-white/30 text-xs">
              No matching modules found
            </div>
          )}
        </nav>

        {/* User Profile & Footer Actions */}
        <div className="p-3.5 border-t border-white/10 mt-auto bg-black/40 relative z-10 space-y-2">
          <div 
            onClick={() => {
              onSectionChange('profile');
              if (onClose) onClose();
            }}
            className="flex items-center gap-2.5 p-2 rounded-xl bg-white/[0.02] border border-white/5 hover:border-amber-400/30 hover:bg-white/[0.05] transition-all cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 font-black text-xs shrink-0">
              {teamUser?.name ? teamUser.name.charAt(0) : 'Z'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate group-hover:text-amber-200 transition-colors">
                {teamUser?.name || 'Zahid Riyaz'}
              </p>
              <div className="flex items-center gap-1.5">
                <span className="text-[8px] font-black uppercase tracking-widest text-amber-400">
                  {ROLE_LABELS[role] || 'Director'}
                </span>
                <span className="text-[8px] text-white/40 font-mono">• {teamUser?.code || 'ADMIN001'}</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-1.5">
            <Link 
              to="/"
              className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.02] border border-white/5 hover:border-amber-400/30 hover:bg-white/[0.05] text-white/60 hover:text-white transition-all text-[10px] font-bold uppercase tracking-wider"
            >
              <ExternalLink className="w-3 h-3 text-amber-400" />
              <span>Live Site</span>
            </Link>
            
            <Button 
              variant="ghost" 
              onClick={teamLogout}
              className="h-auto flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-500/5 border border-red-500/15 hover:bg-red-500/15 text-red-400 hover:text-red-300 transition-all text-[10px] font-bold uppercase tracking-wider"
            >
              <LogOut className="w-3 h-3" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
