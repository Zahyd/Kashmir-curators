import { Link, useLocation } from 'react-router-dom';
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
  Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTeamAuth, ADMIN_SIDEBAR_ITEMS, ROLE_LABELS, ROLE_COLORS } from '@/contexts/TeamAuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
}

const allMenuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'inquiries', label: 'Trip Inquiries', icon: MessageSquare, badge: 'New' },
  { id: 'packages', label: 'Packages CMS', icon: Package },
  { id: 'hotels', label: 'Hotels CMS', icon: Building },
  { id: 'cabs', label: 'Cabs CMS', icon: Car },
  { id: 'reviews', label: 'Reviews', icon: Users },
  { id: 'faqs', label: 'FAQs', icon: HelpCircle },
  { id: 'media', label: 'Media Library', icon: ImageIcon },
  { id: 'content', label: 'Site Content', icon: Settings },
];

export default function AdminSidebar({ activeSection, onSectionChange }: AdminSidebarProps) {
  const { teamUser, teamLogout } = useTeamAuth();

  const role = teamUser?.role || 'admin';
  const allowedItems = ADMIN_SIDEBAR_ITEMS[role] || ADMIN_SIDEBAR_ITEMS.admin;
  const menuItems = allMenuItems.filter(item => allowedItems.includes(item.id));

  return (
    <aside className="w-72 h-screen fixed left-0 top-0 bg-[#0a0f12]/60 backdrop-blur-3xl border-r border-white/5 flex flex-col z-50 transition-all duration-500">
      {/* Sidebar Header */}
      <div className="p-8 border-b border-white/5">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-kashmir-gold to-amber-600 flex items-center justify-center shadow-2xl shadow-kashmir-gold/40 relative group cursor-pointer">
            <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            <LayoutDashboard className="w-7 h-7 text-black relative z-10" />
          </div>
          <div>
            <h2 className="text-lg font-display font-black text-white tracking-tighter leading-none">Kashmir<span className="text-kashmir-gold ml-0.5 text-xl">Director</span></h2>
            <p className="text-[9px] uppercase tracking-[0.4em] text-kashmir-gold font-black opacity-60 mt-1">Global Command</p>
          </div>
        </div>

        {/* Quick Action Dropdown — only for admin */}
        {role === 'admin' && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-start gap-3 bg-white/5 border-white/10 hover:bg-white/10 text-white/50 hover:text-white transition-all duration-500 rounded-2xl h-12 shadow-inner">
                <PlusCircle className="w-5 h-5 text-kashmir-gold" />
                <span className="text-xs font-black uppercase tracking-widest">Execute Task</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 bg-[#0a0f12]/95 backdrop-blur-2xl border-white/10 text-white p-2 rounded-2xl shadow-2xl">
              <DropdownMenuLabel className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Intelligence Operations</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/5 mx-2" />
              <DropdownMenuItem className="cursor-pointer hover:bg-white/5 focus:bg-white/5 p-3 rounded-xl gap-3">
                <Package className="w-4 h-4 text-kashmir-gold" /> 
                <div className="flex flex-col"><span className="text-xs font-bold">New Itinerary</span><span className="text-[9px] text-white/30">Create luxury package</span></div>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer hover:bg-white/5 focus:bg-white/5 p-3 rounded-xl gap-3">
                <Building className="w-4 h-4 text-kashmir-gold" /> 
                <div className="flex flex-col"><span className="text-xs font-bold">Hotel Node</span><span className="text-[9px] text-white/30">Add accommodation</span></div>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer hover:bg-white/5 focus:bg-white/5 p-3 rounded-xl gap-3">
                <Car className="w-4 h-4 text-kashmir-gold" /> 
                <div className="flex flex-col"><span className="text-xs font-bold">Transport Hub</span><span className="text-[9px] text-white/30">Configure vehicle</span></div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-8 px-6 space-y-2 custom-scrollbar">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onSectionChange(item.id)}
            className={cn(
              "w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all duration-500 group relative overflow-hidden",
              activeSection === item.id 
                ? "bg-white/5 text-white shadow-xl border border-white/10" 
                : "text-white/40 hover:text-white/80 hover:bg-white/[0.03]"
            )}
          >
            <div className="flex items-center gap-4 relative z-10">
              <item.icon className={cn(
                "w-5 h-5 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3",
                activeSection === item.id ? "text-kashmir-gold shadow-[0_0_15px_rgba(212,175,55,0.3)]" : "text-white/20"
              )} />
              <span className="font-black text-[10px] uppercase tracking-[0.2em]">{item.label}</span>
            </div>
            
            {item.badge && (
              <span className="px-2 py-1 rounded-lg bg-kashmir-gold text-[8px] font-black text-black uppercase tracking-tighter relative z-10 shadow-lg shadow-kashmir-gold/20">
                {item.badge}
              </span>
            )}

            {activeSection === item.id && (
              <>
                <div className="absolute inset-0 bg-gradient-to-r from-kashmir-gold/5 via-transparent to-transparent" />
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-kashmir-gold rounded-r-full shadow-[0_0_20px_rgba(212,175,55,0.6)]" />
              </>
            )}
          </button>
        ))}
      </nav>

      {/* User & Logout */}
      <div className="p-8 border-t border-white/5 mt-auto bg-white/[0.01]">
        <div className="flex items-center gap-4 mb-4 px-2 group cursor-pointer">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center group-hover:border-kashmir-gold/30 transition-all duration-500">
            <Users className="w-6 h-6 text-kashmir-gold" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black text-white uppercase tracking-widest truncate">{teamUser?.name || 'Admin'}</p>
            <p className="text-[9px] text-white/30 truncate font-bold uppercase tracking-tighter mt-0.5">{teamUser?.code || 'ADMIN'}</p>
          </div>
        </div>

        {/* Role Badge */}
        <div className="mb-6 px-2">
          <Badge className={cn(
            "w-full justify-center py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border-none",
            ROLE_COLORS[role]
          )}>
            {ROLE_LABELS[role]}
          </Badge>
        </div>
        
        <Button 
          variant="ghost" 
          onClick={teamLogout}
          className="w-full justify-start gap-4 text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-all duration-500 rounded-2xl h-12 px-5 group/logout"
        >
          <LogOut className="w-5 h-5 group-hover/logout:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em]">Secure Exit</span>
        </Button>
      </div>
    </aside>
  );
}
