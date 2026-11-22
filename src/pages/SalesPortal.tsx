import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Zap, 
  MessageSquare, 
  ShieldCheck, 
  FilePlus, 
  Users, 
  CreditCard, 
  TrendingUp, 
  Clock, 
  LogOut, 
  User, 
  LayoutDashboard, 
  Shield, 
  ShieldAlert, 
  ExternalLink, 
  Sparkles, 
  Menu, 
  X, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  Phone,
  Layers,
  Car
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useTeamAuth } from '@/contexts/TeamAuthContext';
import { API_BASE_URL } from '@/lib/api';
import { 
  normalizeSalesRole, 
  canAccessSalesPortal, 
  isDriver, 
  canManageTeam, 
  canViewAllLeads,
  ROLE_DISPLAY_NAMES,
  ROLE_BADGE_STYLES 
} from '@/lib/rbac';

// Modular Sales Components
import { SalesMetricsRibbon } from '@/components/sales/SalesMetricsRibbon';
import { LiveLeadQueue } from '@/components/sales/LiveLeadQueue';
import { ActivePipelineKanban } from '@/components/sales/ActivePipelineKanban';
import { TeamManagement } from '@/components/sales/TeamManagement';
import { ClientDirectory } from '@/components/sales/ClientDirectory';
import ItineraryBuilder from '@/components/sales/ItineraryBuilder';
import InquiryVault from '@/components/sales/InquiryVault';
import PaymentPortal from '@/components/sales/PaymentPortal';
import WorkLog from '@/components/sales/WorkLog';
import SelectionRequired from '@/components/sales/SelectionRequired';
import MobileSalesBottomBar from '@/components/sales/MobileSalesBottomBar';

type PortalTab = 
  | 'dashboard' 
  | 'live-leads' 
  | 'active-pipeline' 
  | 'builder' 
  | 'vault' 
  | 'clients' 
  | 'payments' 
  | 'team-rbac' 
  | 'work-log';

export default function SalesPortal() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const inquiryIdParam = searchParams.get('inquiryId');

  const { teamUser, isTeamAuthenticated, isTeamLoading, teamLogout } = useTeamAuth();
  
  const [activeTab, setActiveTab] = useState<PortalTab>('dashboard');
  const [selectedInquiry, setSelectedInquiry] = useState<any>(null);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isTogglingAvailability, setIsTogglingAvailability] = useState(false);
  const [metricsRefreshKey, setMetricsRefreshKey] = useState(0);

  // 1. RBAC Route Guard: Block DRIVER and non-authenticated users
  useEffect(() => {
    if (isTeamLoading) return;

    if (!isTeamAuthenticated || !teamUser) {
      navigate('/sales/auth');
      return;
    }

    if (isDriver(teamUser.role)) {
      toast.error('Access Denied: Drivers are strictly blocked from Sales Concierge OS.');
      navigate('/driver');
      return;
    }

    if (!canAccessSalesPortal(teamUser.role)) {
      toast.error('Unauthorized access level for Sales Portal.');
      navigate('/');
      return;
    }
  }, [isTeamLoading, isTeamAuthenticated, teamUser, navigate]);

  // 2. Fetch Inquiries for sub-components that need initial list
  const fetchInquiries = async () => {
    try {
      const token = localStorage.getItem('team_auth_token') || localStorage.getItem('token') || '';
      const portalKey = localStorage.getItem('kashmir_portal_key') || '';

      const res = await fetch(`${API_BASE_URL}/api/inquiries`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          ...(portalKey ? { 'x-portal-key': portalKey } : {})
        }
      });

      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.inquiries || [];
        setInquiries(list);
      }
    } catch (err) {
      console.warn('Error fetching inquiries:', err);
    }
  };

  useEffect(() => {
    if (isTeamAuthenticated) {
      fetchInquiries();
    }
  }, [isTeamAuthenticated]);

  // 3. Handle Auto-Routing to Itinerary Builder if inquiryId provided in URL
  useEffect(() => {
    if (inquiryIdParam && inquiries.length > 0) {
      const found = inquiries.find(i => i.id === inquiryIdParam);
      if (found) {
        setSelectedInquiry(found);
        setActiveTab('builder');
        setSearchParams({});
      }
    }
  }, [inquiryIdParam, inquiries, setSearchParams]);

  // 4. Employee Availability Toggle (synced to User.isOnline in Prisma)
  const toggleAvailability = async () => {
    const nextStatus = !isOnline;
    setIsOnline(nextStatus);
    setIsTogglingAvailability(true);

    try {
      const token = localStorage.getItem('team_auth_token') || localStorage.getItem('token') || '';
      const portalKey = localStorage.getItem('kashmir_portal_key') || '';

      const res = await fetch(`${API_BASE_URL}/api/sales/availability`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          ...(portalKey ? { 'x-portal-key': portalKey } : {})
        },
        body: JSON.stringify({ isOnline: nextStatus })
      });

      if (res.ok) {
        toast.success(nextStatus ? 'Status: ONLINE — Ready to receive leads' : 'Status: AWAY — Availability paused');
      }
    } catch (err) {
      console.warn('Failed to sync availability to server:', err);
    } finally {
      setIsTogglingAvailability(false);
    }
  };

  const handleLogout = () => {
    teamLogout();
    toast.success('Logged out successfully.');
    navigate('/');
  };

  if (isTeamLoading || !isTeamAuthenticated || !teamUser) {
    return (
      <div className="min-h-screen bg-[#07090E] flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium">Authenticating Sales Concierge...</p>
        </div>
      </div>
    );
  }

  const normalizedRole = normalizeSalesRole(teamUser.role);
  const roleLabel = ROLE_DISPLAY_NAMES[normalizedRole] || teamUser.role;
  const roleBadgeStyle = ROLE_BADGE_STYLES[normalizedRole] || 'bg-slate-800 text-slate-300';
  const showTeamTab = canManageTeam(teamUser.role);

  const employeeProfile = {
    code: teamUser.code || 'SALES001',
    name: teamUser.name || 'Sales Concierge',
    role: teamUser.role
  };

  const unclaimedCount = inquiries.filter(i => !i.assignedTo && i.status !== 'Lost' && i.status !== 'Booked').length;

  return (
    <div className="min-h-screen bg-[#07090E] text-white flex flex-col lg:flex-row font-sans">
      {/* Mobile Top Header (Touch-optimized, notch-aware) */}
      <header className="lg:hidden sticky top-0 z-40 bg-[#0F141C]/95 backdrop-blur-2xl border-b border-white/10 px-3.5 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2.5">
          <Link to="/" className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center font-bold text-black text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-transform">
            KC
          </Link>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-white tracking-wide">SalesPro</span>
              <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1 py-0.2 rounded font-mono font-bold">OS</span>
            </div>
            <p className="text-[9px] text-slate-400 font-medium font-mono">The Kashmir Curators</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Availability Switch on Mobile */}
          <button
            onClick={toggleAvailability}
            disabled={isTogglingAvailability}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-bold border transition-all active:scale-95",
              isOnline
                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                : "bg-amber-500/15 border-amber-500/30 text-amber-300"
            )}
            title="Toggle Live Availability"
          >
            <span className={cn(
              "w-2 h-2 rounded-full shrink-0",
              isOnline ? "bg-emerald-400 animate-pulse shadow-[0_0_8px_#10B981]" : "bg-amber-400"
            )} />
            <span className="font-mono">{isOnline ? 'Online' : 'Away'}</span>
          </button>

          {/* User Initial Avatar */}
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center font-bold text-amber-400 text-xs shrink-0">
            {teamUser.name ? teamUser.name.charAt(0) : 'S'}
          </div>

          {/* Menu Drawer Toggle */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 text-slate-300 hover:text-white rounded-lg bg-white/5 active:scale-95 transition-all"
            aria-label="Toggle navigation drawer"
          >
            {isSidebarOpen ? <X className="w-4 h-4 text-amber-400" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Backdrop */}
      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-40 transition-opacity animate-in fade-in duration-200"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - FIXED OVERFLOW WITH PROPER SCROLLING AND STICKY FOOTER */}
      <aside className={cn(
        "w-72 sm:w-80 max-w-[85vw] h-screen fixed left-0 top-0 bg-[#07090E] border-r border-white/10 flex flex-col z-50 transition-all duration-300 shadow-2xl overflow-hidden",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* 1. Header (Compact, Non-Clipping) */}
        <div className="shrink-0 p-5 border-b border-white/10 flex items-center justify-between bg-[#0F141C]/50">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5 text-black" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base text-white tracking-tight">SalesPro</span>
                <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-mono font-bold">OS</span>
              </div>
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">The Kashmir Curators</p>
            </div>
          </Link>
          <button 
            onClick={() => setIsSidebarOpen(false)} 
            className="lg:hidden text-slate-400 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Middle Scrollable Nav Items */}
        <nav className="flex-1 min-h-0 overflow-y-auto px-3 py-4 space-y-1.5 custom-scrollbar">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'text-amber-400' },
            { id: 'live-leads', label: 'Live Leads', icon: Zap, color: 'text-emerald-400', badge: '15m SLA' },
            { id: 'active-pipeline', label: 'Active Pipeline', icon: Layers, color: 'text-blue-400' },
            { id: 'builder', label: 'Itinerary Builder', icon: FilePlus, color: 'text-purple-400' },
            { id: 'vault', label: 'Inquiry Vault', icon: ShieldCheck, color: 'text-teal-400' },
            { id: 'clients', label: 'Client Directory', icon: Users, color: 'text-orange-400' },
            { id: 'payments', label: 'Payment Links', icon: CreditCard, color: 'text-amber-400' },
            ...(showTeamTab ? [{ id: 'team-rbac', label: 'Team & RBAC', icon: Shield, color: 'text-rose-400', badge: 'Admin' }] : []),
            { id: 'work-log', label: 'Work Log', icon: Clock, color: 'text-slate-400' },
          ].map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as PortalTab);
                  setIsSidebarOpen(false);
                }}
                className={cn(
                  "w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-200 text-xs font-semibold group",
                  isActive
                    ? "bg-[#0F141C] text-white border border-amber-500/30 shadow-md shadow-black/40"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={cn("w-4 h-4 transition-transform group-hover:scale-110", isActive ? item.color : "text-slate-500")} />
                  <span className="tracking-wide uppercase text-[11px]">{item.label}</span>
                </div>
                {item.badge && (
                  <span className={cn(
                    "text-[9px] font-mono px-1.5 py-0.5 rounded font-bold",
                    isActive ? "bg-amber-500/20 text-amber-300" : "bg-white/5 text-slate-400"
                  )}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* 3. Sticky Bottom Authenticated Employee Profile Card */}
        <div className="shrink-0 p-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] border-t border-white/10 bg-[#0F141C]/95 backdrop-blur-md space-y-3">
          {/* User Details */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 truncate">
              <div className="w-9 h-9 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center font-bold text-amber-400 text-xs shrink-0">
                {teamUser.name ? teamUser.name.charAt(0) : 'S'}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-white truncate">{teamUser.name}</p>
                <p className="text-[10px] font-mono text-slate-400 truncate">{teamUser.code || 'ID: SALES001'}</p>
              </div>
            </div>
            <Badge className={`${roleBadgeStyle} text-[9px] font-mono font-bold px-1.5 py-0.5 shrink-0`}>
              {normalizedRole}
            </Badge>
          </div>

          {/* Live Availability Toggle Button */}
          <button
            onClick={toggleAvailability}
            disabled={isTogglingAvailability}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all border",
              isOnline 
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20" 
                : "bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20"
            )}
          >
            <div className="flex items-center gap-2">
              <span className={cn(
                "w-2.5 h-2.5 rounded-full shrink-0",
                isOnline ? "bg-emerald-400 animate-pulse shadow-[0_0_8px_#10B981]" : "bg-amber-400"
              )} />
              <span>{isOnline ? 'Online • Taking Leads' : 'Away • Queue Paused'}</span>
            </div>
            <span className="text-[10px] uppercase font-mono font-bold text-slate-400">
              Toggle
            </span>
          </button>

          {/* Action Links: Home & Logout */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5">
            <Link
              to="/"
              onClick={() => setIsSidebarOpen(false)}
              className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-[11px] font-medium transition"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Portal Home</span>
            </Link>

            <button
              onClick={() => {
                setIsSidebarOpen(false);
                handleLogout();
              }}
              className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[11px] font-medium transition"
            >
              <LogOut className="w-3 h-3" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <main className="flex-1 lg:ml-72 flex flex-col min-h-screen">
        <div className="p-3 sm:p-6 lg:p-8 pt-4 lg:pt-8 pb-28 lg:pb-8 max-w-[1600px] w-full mx-auto space-y-6">

          {/* TAB 1: EXECUTIVE COMMAND DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Top Banner */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#0F141C]/80 p-5 rounded-xl border border-white/10 backdrop-blur-md">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                      Executive Command Center
                    </span>
                  </div>
                  <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
                    Welcome back, {teamUser.name}
                  </h1>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Live operational telemetry, inbound lead escalation, and private client pipeline.
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <Button
                    size="sm"
                    onClick={() => setActiveTab('live-leads')}
                    className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs h-9 px-4 rounded-lg flex items-center gap-1.5"
                  >
                    <Zap className="w-3.5 h-3.5 fill-black" />
                    <span>View Live Leads</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveTab('active-pipeline')}
                    className="border-white/10 text-white hover:bg-white/5 text-xs h-9 px-3 rounded-lg flex items-center gap-1.5"
                  >
                    <Layers className="w-3.5 h-3.5 text-blue-400" />
                    <span>Active Pipeline</span>
                  </Button>
                </div>
              </div>

              {/* Live Prisma-Aggregated KPI Ribbon */}
              <SalesMetricsRibbon 
                key={metricsRefreshKey} 
                onRefreshNeeded={() => setMetricsRefreshKey(k => k + 1)} 
              />

              {/* Command Deck Split: Live Queue on Left, Quick Pipeline on Right */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-400" />
                      Live Inbound Queue (15-Minute SLA)
                    </h3>
                    <button
                      onClick={() => setActiveTab('live-leads')}
                      className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
                    >
                      <span>Full Queue</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                  <LiveLeadQueue 
                    currentEmployee={employeeProfile}
                    onClaimLead={(lead) => {
                      setSelectedInquiry(lead);
                      setActiveTab('builder');
                      setMetricsRefreshKey(k => k + 1);
                    }}
                    onRefreshMetrics={() => setMetricsRefreshKey(k => k + 1)}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Layers className="w-4 h-4 text-blue-400" />
                      Active Concierge Pipeline
                    </h3>
                    <button
                      onClick={() => setActiveTab('active-pipeline')}
                      className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
                    >
                      <span>Kanban</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Pipeline Quick Access Card */}
                  <Card className="bg-[#0F141C]/80 border border-white/10 p-5 rounded-xl space-y-4">
                    <div className="p-4 rounded-lg bg-[#07090E] border border-white/5 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Concierge Code:</span>
                        <span className="font-mono text-amber-400 font-bold">{teamUser.code || 'SALES001'}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Permissions Level:</span>
                        <span className="text-emerald-400 font-semibold">{roleLabel}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Driver Auto-Dispatch:</span>
                        <span className="text-emerald-400 font-semibold">Enabled (Stage CONFIRMED)</span>
                      </div>
                    </div>

                    <Button
                      onClick={() => setActiveTab('active-pipeline')}
                      className="w-full bg-[#07090E] border border-white/10 hover:border-amber-400 text-white text-xs h-9 rounded-lg"
                    >
                      Open Full Pipeline Kanban
                    </Button>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LIVE LEADS QUEUE */}
          {activeTab === 'live-leads' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <SalesMetricsRibbon 
                key={metricsRefreshKey} 
                onRefreshNeeded={() => setMetricsRefreshKey(k => k + 1)} 
              />
              <LiveLeadQueue 
                currentEmployee={employeeProfile}
                onClaimLead={(lead) => {
                  setSelectedInquiry(lead);
                  setActiveTab('builder');
                  setMetricsRefreshKey(k => k + 1);
                }}
                onRefreshMetrics={() => setMetricsRefreshKey(k => k + 1)}
              />
            </div>
          )}

          {/* TAB 3: ACTIVE PIPELINE KANBAN */}
          {activeTab === 'active-pipeline' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <ActivePipelineKanban 
                currentEmployee={employeeProfile}
                onOpenItineraryBuilder={(deal) => {
                  setSelectedInquiry(deal);
                  setActiveTab('builder');
                }}
                onRefreshMetrics={() => setMetricsRefreshKey(k => k + 1)}
                isManagerOrDirector={canViewAllLeads(teamUser.role)}
              />
            </div>
          )}

          {/* TAB 4: ITINERARY BUILDER */}
          {activeTab === 'builder' && (
            <div className="animate-in fade-in duration-300">
              {selectedInquiry ? (
                <ItineraryBuilder 
                  inquiry={selectedInquiry}
                  onBack={() => setActiveTab('active-pipeline')}
                />
              ) : (
                <SelectionRequired 
                  title="Itinerary Builder"
                  description="Select an active inquiry or deal from your pipeline to begin crafting a bespoke luxury Kashmir itinerary."
                  icon={FilePlus}
                  inquiries={inquiries}
                  onSelect={(inq) => {
                    setSelectedInquiry(inq);
                    setActiveTab('builder');
                  }}
                  teamUser={teamUser}
                />
              )}
            </div>
          )}

          {/* TAB 5: INQUIRY VAULT */}
          {activeTab === 'vault' && (
            <div className="animate-in fade-in duration-300">
              {selectedInquiry ? (
                <InquiryVault 
                  inquiry={selectedInquiry}
                  onBack={() => setActiveTab('active-pipeline')}
                />
              ) : (
                <SelectionRequired 
                  title="Inquiry Vault & Guest Documents"
                  description="Select an inquiry to view guest documentation, identity verification, flight manifests, and audit logs."
                  icon={ShieldCheck}
                  inquiries={inquiries}
                  onSelect={(inq) => {
                    setSelectedInquiry(inq);
                    setActiveTab('vault');
                  }}
                  teamUser={teamUser}
                />
              )}
            </div>
          )}

          {/* TAB 6: CLIENT DIRECTORY */}
          {activeTab === 'clients' && (
            <div className="animate-in fade-in duration-300">
              <ClientDirectory />
            </div>
          )}

          {/* TAB 7: PAYMENT PORTAL */}
          {activeTab === 'payments' && (
            <div className="animate-in fade-in duration-300">
              {selectedInquiry ? (
                <PaymentPortal 
                  inquiry={selectedInquiry}
                  onBack={() => setActiveTab('active-pipeline')}
                />
              ) : (
                <SelectionRequired 
                  title="Payment Portal & UPI Links"
                  description="Select a confirmed or quoting inquiry to generate and dispatch payment links."
                  icon={CreditCard}
                  inquiries={inquiries}
                  onSelect={(inq) => {
                    setSelectedInquiry(inq);
                    setActiveTab('payments');
                  }}
                  teamUser={teamUser}
                />
              )}
            </div>
          )}

          {/* TAB 8: TEAM & RBAC MANAGEMENT */}
          {activeTab === 'team-rbac' && showTeamTab && (
            <div className="animate-in fade-in duration-300">
              <TeamManagement currentEmployee={employeeProfile} />
            </div>
          )}

          {/* TAB 9: WORK LOG */}
          {activeTab === 'work-log' && (
            <div className="animate-in fade-in duration-300">
              <WorkLog />
            </div>
          )}

        </div>
      </main>

      {/* Unified Mobile Bottom Dock */}
      <MobileSalesBottomBar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setIsSidebarOpen(false);
        }}
        isSidebarOpen={isSidebarOpen}
        onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        unclaimedCount={unclaimedCount}
      />
    </div>
  );
}
