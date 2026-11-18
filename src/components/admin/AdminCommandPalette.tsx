import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  Search,
  LayoutDashboard,
  MessageSquare,
  Package,
  Building,
  Building2,
  Car,
  Users,
  TrendingUp,
  CreditCard,
  CalendarCheck,
  ShieldAlert,
  Layers,
  MapPin,
  Route,
  Compass,
  Tag,
  Globe,
  BarChart3,
  History,
  Settings,
  KeyRound,
  UserCheck,
  Sparkles,
  RefreshCw,
  ArrowRight,
  ExternalLink
} from 'lucide-react';

interface AdminCommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectSection: (section: string) => void;
  onNavigateRoute: (path: string) => void;
  onRefreshStats: () => void;
  onOpenAiCopilot: () => void;
}

export const AdminCommandPalette: React.FC<AdminCommandPaletteProps> = ({
  open,
  onOpenChange,
  onSelectSection,
  onNavigateRoute,
  onRefreshStats,
  onOpenAiCopilot
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  const items = [
    // Quick Actions
    { id: 'act-ai', title: 'Open Kashmir Ops AI Copilot', category: 'Quick Action', icon: Sparkles, run: onOpenAiCopilot },
    { id: 'act-sync', title: 'Force Sync Neon Live Telemetry', category: 'Quick Action', icon: RefreshCw, run: onRefreshStats },
    // Multi-OS Portal Switcher
    { id: 'os-hosp', title: 'Launch Hospitality OS (Hotels & Vouchers)', category: 'Multi-OS Portal', icon: Building, run: () => onNavigateRoute('/hospitality') },
    { id: 'os-sales', title: 'Launch Sales CRM Desk', category: 'Multi-OS Portal', icon: TrendingUp, run: () => onNavigateRoute('/sales/portal') },
    { id: 'os-agent', title: 'Launch B2B Agent CRM & Licensing', category: 'Multi-OS Portal', icon: Building2, run: () => onNavigateRoute('/agent') },
    { id: 'os-driver', title: 'Launch Driver Fleet Cockpit', category: 'Multi-OS Portal', icon: Car, run: () => onNavigateRoute('/driver') },
    { id: 'os-site', title: 'Preview Live Public Website', category: 'Multi-OS Portal', icon: ExternalLink, run: () => onNavigateRoute('/') },
    // Operations & Radar
    { id: 'dashboard', title: 'Executive Deck & Live Telemetry', category: 'Operations', icon: LayoutDashboard, run: () => onSelectSection('dashboard') },
    { id: 'attendance', title: 'Employee Attendance & Presence', category: 'Operations', icon: UserCheck, run: () => onSelectSection('attendance') },
    { id: 'disruptions', title: 'Disruptions & Road Safety Radar', category: 'Operations', icon: ShieldAlert, run: () => onSelectSection('disruptions') },
    { id: 'inquiries', title: 'Trip Inquiries & Lead Queue', category: 'Operations', icon: MessageSquare, run: () => onSelectSection('inquiries') },
    { id: 'reservations', title: 'Hotel Reservations CRS', category: 'Operations', icon: CalendarCheck, run: () => onSelectSection('reservations') },
    { id: 'bookings', title: 'Bookings Engine', category: 'Operations', icon: Package, run: () => onSelectSection('bookings') },
    // Commerce & Clients
    { id: 'revenue', title: 'Revenue Intelligence', category: 'Commerce', icon: TrendingUp, run: () => onSelectSection('revenue') },
    { id: 'reports', title: 'Reports & Fiscal Telemetry', category: 'Commerce', icon: BarChart3, run: () => onSelectSection('reports') },
    { id: 'users', title: 'Client Directory & Dossier', category: 'Commerce', icon: Users, run: () => onSelectSection('users') },
    { id: 'payments', title: 'Payment Protocols & Ledger', category: 'Commerce', icon: CreditCard, run: () => onSelectSection('payments') },
    { id: 'coupons', title: 'Coupons & Offers', category: 'Commerce', icon: Tag, run: () => onSelectSection('coupons') },
    // Inventory & CMS
    { id: 'page_builder', title: 'Visual Page Builder', category: 'Atelier CMS', icon: Layers, run: () => onSelectSection('page_builder') },
    { id: 'destinations', title: 'Destinations CMS', category: 'Atelier CMS', icon: MapPin, run: () => onSelectSection('destinations') },
    { id: 'packages', title: 'Packages CMS', category: 'Atelier CMS', icon: Package, run: () => onSelectSection('packages') },
    { id: 'itinerary_builder', title: 'Itinerary Builder', category: 'Atelier CMS', icon: Route, run: () => onSelectSection('itinerary_builder') },
    { id: 'hotels', title: 'Hotels & Houseboats CMS', category: 'Atelier CMS', icon: Building, run: () => onSelectSection('hotels') },
    { id: 'cabs', title: 'Fleet & Cabs CMS', category: 'Atelier CMS', icon: Car, run: () => onSelectSection('cabs') },
    { id: 'activities', title: 'Experiences CMS', category: 'Atelier CMS', icon: Compass, run: () => onSelectSection('activities') },
    // Governance
    { id: 'seo', title: 'SEO & Search Engine', category: 'Governance', icon: Globe, run: () => onSelectSection('seo') },
    { id: 'portal_keys', title: 'Portal Access Keys (RBAC)', category: 'Governance', icon: KeyRound, run: () => onSelectSection('portal_keys') },
    { id: 'audit_logs', title: 'Security & Audit Logs', category: 'Governance', icon: History, run: () => onSelectSection('audit_logs') },
    { id: 'settings', title: 'Platform Settings', category: 'Governance', icon: Settings, run: () => onSelectSection('settings') },
  ];

  const filtered = items.filter(item => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return item.title.toLowerCase().includes(q) || item.category.toLowerCase().includes(q);
  });

  const handleRun = (fn: () => void) => {
    fn();
    onOpenChange(false);
    setQuery('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl bg-[#070b0f] text-white border border-white/10 rounded-3xl p-0 overflow-hidden shadow-2xl">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10 bg-slate-900/90">
          <Search className="w-5 h-5 text-amber-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Jump to any CMS module, SaaS OS portal, or executive action..."
            className="w-full bg-transparent border-0 outline-none text-sm text-white placeholder:text-white/35 focus:ring-0"
            autoFocus
          />
          <kbd className="hidden sm:inline-flex items-center text-[10px] font-mono font-bold bg-white/5 border border-white/10 px-2 py-0.5 rounded-lg text-white/40">
            ESC
          </kbd>
        </div>

        <div className="max-h-[390px] overflow-y-auto p-3 space-y-1 scrollbar-thin scrollbar-thumb-white/10 text-left">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-white/40">
              No matching modules or OS portals found.
            </div>
          ) : (
            filtered.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleRun(item.run)}
                  className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-white/[0.06] transition-all group text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-amber-400 shrink-0 group-hover:scale-105 transition-transform">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors truncate block">
                        {item.title}
                      </span>
                      <span className="text-[10px] text-white/40 uppercase font-mono">
                        {item.category}
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                </button>
              );
            })
          )}
        </div>

        <div className="px-5 py-2.5 bg-black/40 border-t border-white/5 flex items-center justify-between text-[10px] text-white/40">
          <span>Press <kbd className="font-mono text-white/60">Ctrl+K</kbd> / <kbd className="font-mono text-white/60">⌘K</kbd> anytime in Command HQ</span>
          <span>Kashmir Curators Live OS</span>
        </div>
      </DialogContent>
    </Dialog>
  );
};
