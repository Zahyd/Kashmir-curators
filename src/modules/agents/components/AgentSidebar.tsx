import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  FileSpreadsheet, 
  ShieldCheck, 
  Building2, 
  Receipt, 
  Sparkles,
  PhoneCall,
  Menu,
  X,
  ExternalLink
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export type AgentTab = 'overview' | 'crm' | 'licensing' | 'quotes' | 'branding' | 'subscription' | 'b2b-supply' | 'commission';

interface AgentSidebarProps {
  activeTab: AgentTab;
  onTabChange: (tab: AgentTab) => void;
  verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'NOT_APPLIED';
  plan?: string;
  agentCode?: string;
  companyName?: string;
}

export const AgentSidebar: React.FC<AgentSidebarProps> = ({
  activeTab,
  onTabChange,
  verificationStatus,
  plan = 'STARTER',
  agentCode,
  companyName
}) => {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const navItems = [
    { id: 'overview' as AgentTab, label: 'Control Desk', icon: LayoutDashboard },
    { id: 'crm' as AgentTab, label: 'Travel CRM Leads', icon: Users, badge: 'Live' },
    { id: 'quotes' as AgentTab, label: 'Quote & Itinerary Gen', icon: FileSpreadsheet },
    { id: 'branding' as AgentTab, label: 'White-Label Branding', icon: Sparkles, badge: plan === 'STARTER' ? 'Pro' : undefined },
    { id: 'subscription' as AgentTab, label: 'SaaS Plan & Billing', icon: Receipt },
    { id: 'licensing' as AgentTab, label: 'J&K Tourism License', icon: ShieldCheck, alert: verificationStatus !== 'APPROVED' },
    { id: 'b2b-supply' as AgentTab, label: 'B2B Wholesale Supply', icon: Building2 },
    { id: 'commission' as AgentTab, label: 'Earnings & Ledger', icon: Receipt },
  ];

  const getStatusBadge = () => {
    switch (verificationStatus) {
      case 'APPROVED':
        return (
          <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            Verified Partner
          </Badge>
        );
      case 'PENDING':
        return (
          <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 animate-pulse">
            Verification Pending
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge className="bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30">
            Action Required
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground">
            Unlicensed / Guest
          </Badge>
        );
    }
  };

  const NavContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand & Partner Profile */}
      <div className="p-5 border-b border-border/50">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-[11px] font-semibold tracking-wider uppercase text-emerald-600 dark:text-emerald-400">
            Kashmir Connect B2B Network
          </span>
        </div>
        <h2 className="font-bold text-lg text-foreground tracking-tight line-clamp-1">
          {companyName || 'Travel Partner Portal'}
        </h2>
        {agentCode && (
          <p className="text-xs font-mono text-muted-foreground mt-0.5">
            Code: <span className="text-primary font-semibold">{agentCode}</span>
          </p>
        )}
        <div className="mt-3">
          {getStatusBadge()}
        </div>
      </div>

      {/* Navigation Links */}
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
              <div className="flex items-center gap-1.5">
                {item.badge && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-primary/10 text-primary'
                  }`}>
                    {item.badge}
                  </span>
                )}
                {item.alert && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                )}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Footer Support Desk */}
      <div className="p-4 border-t border-border/50 bg-muted/30 m-3 rounded-2xl">
        <div className="flex items-center gap-2 mb-1.5">
          <PhoneCall className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-semibold text-foreground">Kashmir Agent Desk</span>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Need B2B allotment support or urgent snow pass clearance?
        </p>
        <a
          href="https://wa.me/919906000000?text=Hi%20Kashmir%20Connect%20B2B%20Desk,%20I%20need%20agent%20assistance."
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-primary font-medium hover:underline mt-2"
        >
          <span>Chat with Operations</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Navbar with Hamburger */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-card border-b border-border sticky top-0 z-30">
        <div>
          <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Agent CRM</span>
          <h3 className="font-bold text-foreground text-sm line-clamp-1">{companyName || 'Travel Partner'}</h3>
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

      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-72 shrink-0 border-r border-border/70 bg-card h-[calc(100vh-4rem)] sticky top-16 shadow-sm overflow-hidden">
        <NavContent />
      </aside>
    </>
  );
};

export default AgentSidebar;
