import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Zap,
  ShieldCheck,
  FilePlus,
  Users,
  CreditCard,
  Clock,
  LogOut,
  LayoutDashboard,
  Shield,
  ExternalLink,
  Menu,
  X,
  ArrowRight,
  Layers,
  Globe,
  Plus,
  RefreshCw,
  Bell,
  CheckCircle2,
  FolderOpen
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useTeamAuth } from '@/contexts/TeamAuthContext';
import {
  normalizeSalesRole,
  canAccessSalesPortal,
  isDriver,
  canManageTeam,
  canViewAllLeads,
  ROLE_DISPLAY_NAMES,
  ROLE_BADGE_STYLES
} from '@/lib/rbac';
import {
  salesApi,
  SalesInquiry,
  TeamMemberItem,
  LeadReminderItem,
  getInquiryValueINR,
  normalizeStageKey
} from '@/lib/salesApi';

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
import MetaLeadsHub from '@/components/sales/MetaLeadsHub';
import LeadFormModal from '@/components/sales/LeadFormModal';
import LeadCommandDrawer from '@/components/sales/LeadCommandDrawer';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import PageLoading from '@/components/layout/PageLoading';

type PortalTab =
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

const TAB_TITLES: Record<PortalTab, string> = {
  dashboard: 'Executive Command Center',
  'live-leads': 'Live Inbound Queue',
  'meta-hub': 'Meta Raw Leads Hub',
  'active-pipeline': 'Active Concierge Pipeline',
  builder: 'Itinerary Builder Studio',
  vault: 'Inquiry Document Vault',
  clients: 'Client Directory & CRM',
  payments: 'Payment Links & Ledger',
  'team-rbac': 'Team Roster & RBAC',
  'work-log': 'Attendance & Work Log'
};

export default function SalesPortal() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const inquiryIdParam = searchParams.get('inquiryId');

  const { teamUser, isTeamAuthenticated, isTeamLoading, systemEvents, teamLogout } = useTeamAuth();

  const [activeTab, setActiveTab] = useState<PortalTab>('dashboard');
  const [selectedInquiry, setSelectedInquiry] = useState<SalesInquiry | null>(null);
  const [inquiries, setInquiries] = useState<SalesInquiry[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMemberItem[]>([]);
  const [pendingReminders, setPendingReminders] = useState<LeadReminderItem[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isTogglingAvailability, setIsTogglingAvailability] = useState(false);
  const [metricsRefreshKey, setMetricsRefreshKey] = useState(0);
  const [dataRefreshKey, setDataRefreshKey] = useState(0);

  // Modals & CRM Drawer
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<SalesInquiry | null>(null);
  const [drawerLead, setDrawerLead] = useState<SalesInquiry | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // RBAC Route Guard
  useEffect(() => {
    if (isTeamLoading) return;
    if (!isTeamAuthenticated || !teamUser) {
      navigate('/sales/auth');
      return;
    }
    if (isDriver(teamUser.role)) {
      toast.error('Access Denied: Drivers cannot access Sales Concierge OS.');
      navigate('/driver');
      return;
    }
    if (!canAccessSalesPortal(teamUser.role)) {
      toast.error('Unauthorized access level for Sales Portal.');
      navigate('/');
    }
  }, [isTeamLoading, isTeamAuthenticated, teamUser, navigate]);

  const refreshWorkspace = async () => {
    if (!isTeamAuthenticated) return;
    try {
      const [inqList, roster, reminders] = await Promise.all([
        salesApi.listInquiries().catch(() => []),
        salesApi.getTeamRoster().catch(() => []),
        salesApi.getPendingReminders().catch(() => [])
      ]);
      setInquiries(inqList);
      setTeamMembers(roster);
      setPendingReminders(reminders);

      if (teamUser?.code && roster.length > 0) {
        const me = roster.find((m) => (m.employeeCode || '').toUpperCase() === teamUser.code.toUpperCase());
        if (me && typeof me.isOnline === 'boolean') {
          setIsOnline(me.isOnline);
        }
      }
    } catch {
      // Handled per-call
    }
  };

  const triggerGlobalRefresh = () => {
    setMetricsRefreshKey((k) => k + 1);
    setDataRefreshKey((k) => k + 1);
    refreshWorkspace();
  };

  useEffect(() => {
    if (isTeamAuthenticated) {
      refreshWorkspace();
    }
  }, [isTeamAuthenticated, activeTab]);

  // Real-time refresh when WebSocket emits new system events
  useEffect(() => {
    if (systemEvents.length > 0 && isTeamAuthenticated) {
      triggerGlobalRefresh();
    }
  }, [systemEvents.length]);

  // Auto-routing via ?inquiryId=
  useEffect(() => {
    if (inquiryIdParam && inquiries.length > 0) {
      const found = inquiries.find((i) => i.id === inquiryIdParam);
      if (found) {
        setSelectedInquiry(found);
        setActiveTab('builder');
        setSearchParams({});
      }
    }
  }, [inquiryIdParam, inquiries, setSearchParams]);

  const toggleAvailability = async () => {
    const nextStatus = !isOnline;
    setIsOnline(nextStatus);
    setIsTogglingAvailability(true);
    try {
      await salesApi.toggleAvailability(nextStatus);
      toast.success(nextStatus ? 'Status: ONLINE — Taking leads' : 'Status: AWAY — Queue paused');
    } catch (err: any) {
      setIsOnline(!nextStatus);
      toast.error(err?.message || 'Failed to update availability');
    } finally {
      setIsTogglingAvailability(false);
    }
  };

  const handleCompleteReminder = async (rem: LeadReminderItem) => {
    try {
      await salesApi.updateReminder(rem.id, { status: 'COMPLETED' });
      toast.success('Follow-up completed');
      refreshWorkspace();
    } catch (err: any) {
      toast.error(err?.message || 'Could not update reminder');
    }
  };

  const handleLogout = () => {
    teamLogout();
    toast.success('Logged out successfully.');
    navigate('/');
  };

  if (isTeamLoading || !isTeamAuthenticated || !teamUser) {
    return (
      <PageLoading
        fullScreen
        message="Authenticating Sales Concierge..."
        className="bg-[#07090E] text-slate-300"
      />
    );
  }

  const normalizedRole = normalizeSalesRole(teamUser.role);
  const roleLabel = ROLE_DISPLAY_NAMES[normalizedRole] || teamUser.role;
  const roleBadgeStyle = ROLE_BADGE_STYLES[normalizedRole] || 'bg-slate-800 text-slate-300';
  const showTeamTab = canManageTeam(teamUser.role);
  const canManage = canViewAllLeads(teamUser.role);

  const employeeProfile = {
    code: teamUser.code || 'SALES001',
    name: teamUser.name || 'Sales Concierge',
    role: teamUser.role
  };

  const unclaimedCount = inquiries.filter(
    (i) =>
      (!i.assignedTo || i.assignedTo.trim() === '') &&
      !['Booked', 'Lost', 'Cancelled'].includes(i.status) &&
      !['CONFIRMED', 'COMPLETED', 'CANCELLED', 'LOST'].includes(i.leadStage || '')
  ).length;

  const recentActiveDeals = inquiries
    .filter((i) => {
      const st = normalizeStageKey(i.leadStage, i.status);
      return !['CONFIRMED', 'COMPLETED', 'LOST'].includes(st);
    })
    .slice(0, 5);

  const openCreateModal = () => {
    setEditingLead(null);
    setLeadModalOpen(true);
  };

  const openEditModal = (lead: SalesInquiry) => {
    setEditingLead(lead);
    setLeadModalOpen(true);
  };

  const openInspectDrawer = (lead: SalesInquiry) => {
    setDrawerLead(lead);
    setDrawerOpen(true);
  };

  return (
    <div className="min-h-[100dvh] bg-[#07090E] text-white flex flex-col lg:flex-row font-sans overflow-x-hidden">
      {/* Mobile Top Header */}
      <header className="lg:hidden sticky top-0 z-40 bg-[#0F141C]/95 backdrop-blur-2xl border-b border-white/10 px-3.5 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2.5">
          <Link to="/" className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center font-bold text-black text-xs shadow-md shadow-amber-500/20">
            KC
          </Link>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-white tracking-wide">SalesPro</span>
              <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1 rounded font-mono font-bold">OS</span>
            </div>
            <p className="text-[9px] text-slate-400 font-mono truncate max-w-[140px]">{TAB_TITLES[activeTab]}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Button size="sm" onClick={openCreateModal} className="h-7 px-2 bg-amber-500 text-black font-bold text-[10px] rounded-md">
            <Plus className="w-3 h-3 mr-0.5" /> Lead
          </Button>
          <button
            onClick={toggleAvailability}
            disabled={isTogglingAvailability}
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold border transition',
              isOnline ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
            )}
          >
            <span className={cn('w-1.5 h-1.5 rounded-full', isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400')} />
            <span className="font-mono">{isOnline ? 'On' : 'Away'}</span>
          </button>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1.5 text-slate-300 hover:text-white rounded-lg bg-white/5"
            aria-label="Toggle navigation drawer"
          >
            {isSidebarOpen ? <X className="w-4 h-4 text-amber-400" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Backdrop */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-[65]"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'w-72 max-w-[85vw] h-[100dvh] fixed left-0 top-0 bg-[#07090E] border-r border-white/10 flex flex-col z-[70] lg:z-40 transition-transform duration-300 shadow-2xl overflow-hidden',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="shrink-0 p-5 border-b border-white/10 flex items-center justify-between bg-[#0F141C]/50">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
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
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 min-h-0 overflow-y-auto px-3 py-4 space-y-1 custom-scrollbar">
          {[
            { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard, color: 'text-amber-400' },
            { id: 'live-leads', label: 'Live Leads', icon: Zap, color: 'text-emerald-400', badge: unclaimedCount > 0 ? String(unclaimedCount) : '15m SLA' },
            { id: 'meta-hub', label: 'Meta Raw Leads', icon: Globe, color: 'text-purple-400', badge: 'Live' },
            { id: 'active-pipeline', label: 'Active Pipeline', icon: Layers, color: 'text-blue-400' },
            { id: 'builder', label: 'Itinerary Studio', icon: FilePlus, color: 'text-purple-400' },
            { id: 'vault', label: 'Inquiry Vault', icon: ShieldCheck, color: 'text-teal-400' },
            { id: 'clients', label: 'Client Directory', icon: Users, color: 'text-orange-400' },
            { id: 'payments', label: 'Payment Links', icon: CreditCard, color: 'text-amber-400' },
            ...(showTeamTab ? [{ id: 'team-rbac', label: 'Team & RBAC', icon: Shield, color: 'text-rose-400', badge: 'Admin' }] : []),
            { id: 'work-log', label: 'Work Log', icon: Clock, color: 'text-slate-400' }
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
                  'w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all text-xs font-semibold group',
                  isActive
                    ? 'bg-[#0F141C] text-white border border-amber-500/30 shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={cn('w-4 h-4', isActive ? item.color : 'text-slate-500 group-hover:text-slate-300')} />
                  <span className="tracking-wide uppercase text-[11px]">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={cn(
                      'text-[9px] font-mono px-1.5 py-0.5 rounded font-bold',
                      isActive ? 'bg-amber-500/20 text-amber-300' : 'bg-white/5 text-slate-400'
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="shrink-0 p-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] border-t border-white/10 bg-[#0F141C]/95 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 truncate">
              <div className="w-9 h-9 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center font-bold text-amber-400 text-xs shrink-0">
                {teamUser.name ? teamUser.name.charAt(0) : 'S'}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-white truncate">{teamUser.name}</p>
                <p className="text-[10px] font-mono text-slate-400 truncate">{teamUser.code || 'SALES001'}</p>
              </div>
            </div>
            <Badge className={`${roleBadgeStyle} text-[9px] font-mono font-bold px-1.5 py-0.5 shrink-0`}>
              {normalizedRole}
            </Badge>
          </div>

          <button
            onClick={toggleAvailability}
            disabled={isTogglingAvailability}
            className={cn(
              'w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition border',
              isOnline
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
            )}
          >
            <div className="flex items-center gap-2">
              <span className={cn('w-2 h-2 rounded-full', isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400')} />
              <span>{isOnline ? 'Online • Taking Leads' : 'Away • Queue Paused'}</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 uppercase">Toggle</span>
          </button>

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5">
            <Link
              to="/"
              onClick={() => setIsSidebarOpen(false)}
              className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-[11px] font-medium transition"
            >
              <ExternalLink className="w-3 h-3" /> Portal Home
            </Link>
            <button
              onClick={() => {
                setIsSidebarOpen(false);
                handleLogout();
              }}
              className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[11px] font-medium transition"
            >
              <LogOut className="w-3 h-3" /> Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 min-w-0 lg:ml-72 flex flex-col min-h-[100dvh]">
        {/* Desktop Executive Top Command Bar */}
        <div className="hidden lg:flex sticky top-0 z-30 items-center justify-between px-8 py-3.5 bg-[#07090E]/90 backdrop-blur-xl border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">
                Kashmir Curators • Live Sync
              </span>
            </div>
            <h1 className="text-lg font-bold text-white tracking-tight">{TAB_TITLES[activeTab]}</h1>
          </div>

          <div className="flex items-center gap-2.5">
            <Badge className="bg-[#0F141C] border border-white/10 text-slate-300 text-xs font-mono py-1 px-2.5">
              {roleLabel}
            </Badge>
            <Button
              size="sm"
              onClick={openCreateModal}
              className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs h-9 px-3.5 rounded-lg"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" /> New Lead
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={triggerGlobalRefresh}
              className="border-white/10 text-slate-300 hover:text-white h-9 px-2.5"
              title="Refresh workspace data"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        <div className="p-3 sm:p-6 lg:p-8 pb-28 lg:pb-10 max-w-[1600px] w-full mx-auto space-y-6">
          <ErrorBoundary variant="panel">
            {/* TAB 1: COMMAND CENTER DASHBOARD */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <SalesMetricsRibbon key={metricsRefreshKey} onRefreshNeeded={triggerGlobalRefresh} />

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  <div className="xl:col-span-2 space-y-4">
                    <LiveLeadQueue
                      currentEmployee={employeeProfile}
                      canManage={canManage}
                      refreshTrigger={dataRefreshKey}
                      onCreateLead={openCreateModal}
                      onInspectLead={openInspectDrawer}
                      onClaimLead={(lead) => {
                        setSelectedInquiry(lead);
                        setActiveTab('builder');
                        triggerGlobalRefresh();
                      }}
                      onRefreshMetrics={triggerGlobalRefresh}
                    />
                  </div>

                  {/* Right Column: Follow-Up Reminders & Recent Pipeline Snapshot */}
                  <div className="space-y-5">
                    <Card className="bg-[#0F141C]/90 border border-white/10 p-4 rounded-xl space-y-3 shadow-lg">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          <Bell className="w-4 h-4 text-amber-400" />
                          Follow-Up Queue ({pendingReminders.length})
                        </h3>
                        <button
                          onClick={refreshWorkspace}
                          className="text-xs text-slate-400 hover:text-white"
                          title="Refresh reminders"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {pendingReminders.length === 0 ? (
                        <div className="p-4 rounded-lg bg-[#07090E] border border-white/5 text-center text-xs text-slate-400">
                          No pending follow-ups. Open any lead&apos;s CRM drawer to schedule calls.
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                          {pendingReminders.slice(0, 6).map((rem) => (
                            <div
                              key={rem.id}
                              className={cn(
                                'p-3 rounded-lg bg-[#07090E] border text-xs flex items-start justify-between gap-2',
                                rem.isOverdue ? 'border-rose-500/40' : 'border-white/10'
                              )}
                            >
                              <div className="min-w-0">
                                <p className="font-bold text-white truncate">{rem.title}</p>
                                <p className="text-[11px] text-slate-400 truncate">
                                  {rem.inquiry?.customerName || 'Lead'} • {new Date(rem.dueDate).toLocaleString()}
                                </p>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <Button
                                  size="sm"
                                  onClick={() => handleCompleteReminder(rem)}
                                  className="h-7 px-2 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-black text-[10px] font-bold"
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>

                    <Card className="bg-[#0F141C]/90 border border-white/10 p-4 rounded-xl space-y-3 shadow-lg">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          <Layers className="w-4 h-4 text-blue-400" />
                          Active Pipeline ({recentActiveDeals.length})
                        </h3>
                        <button
                          onClick={() => setActiveTab('active-pipeline')}
                          className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
                        >
                          Kanban <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>

                      {recentActiveDeals.length === 0 ? (
                        <div className="p-4 rounded-lg bg-[#07090E] border border-white/5 text-center text-xs text-slate-400">
                          Pipeline is currently empty. Claim a lead or click &ldquo;+ New Lead&rdquo;.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {recentActiveDeals.map((deal) => (
                            <div
                              key={deal.id}
                              onClick={() => openInspectDrawer(deal)}
                              className="p-3 rounded-lg bg-[#07090E] border border-white/10 hover:border-amber-400/40 cursor-pointer transition flex items-center justify-between gap-2 text-xs"
                            >
                              <div className="min-w-0">
                                <p className="font-bold text-white truncate">{deal.customerName}</p>
                                <p className="text-[11px] text-slate-400 truncate">
                                  {deal.destination} • {normalizeStageKey(deal.leadStage, deal.status).replace(/_/g, ' ')}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="font-mono font-bold text-emerald-400">
                                  ₹{getInquiryValueINR(deal).toLocaleString('en-IN')}
                                </span>
                                <FolderOpen className="w-3.5 h-3.5 text-slate-400" />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: LIVE LEADS QUEUE */}
            {activeTab === 'live-leads' && (
              <div className="space-y-5 animate-in fade-in duration-300">
                <SalesMetricsRibbon key={metricsRefreshKey} onRefreshNeeded={triggerGlobalRefresh} />
                <LiveLeadQueue
                  currentEmployee={employeeProfile}
                  canManage={canManage}
                  refreshTrigger={dataRefreshKey}
                  onCreateLead={openCreateModal}
                  onInspectLead={openInspectDrawer}
                  onClaimLead={(lead) => {
                    setSelectedInquiry(lead);
                    setActiveTab('builder');
                    triggerGlobalRefresh();
                  }}
                  onRefreshMetrics={triggerGlobalRefresh}
                />
              </div>
            )}

            {/* TAB 3: META LEADS HUB */}
            {activeTab === 'meta-hub' && (
              <MetaLeadsHub
                currentEmployee={employeeProfile}
                onInspectLead={openInspectDrawer}
                onOpenItineraryBuilder={(lead) => {
                  setSelectedInquiry(lead);
                  setActiveTab('builder');
                }}
              />
            )}

            {/* TAB 4: ACTIVE PIPELINE KANBAN */}
            {activeTab === 'active-pipeline' && (
              <ActivePipelineKanban
                currentEmployee={employeeProfile}
                isManagerOrDirector={canManage}
                refreshTrigger={dataRefreshKey}
                onCreateDeal={openCreateModal}
                onInspectDeal={openInspectDrawer}
                onOpenItineraryBuilder={(deal) => {
                  setSelectedInquiry(deal);
                  setActiveTab('builder');
                }}
                onRefreshMetrics={triggerGlobalRefresh}
              />
            )}

            {/* TAB 5: ITINERARY BUILDER */}
            {activeTab === 'builder' && (
              <div className="animate-in fade-in duration-300">
                {selectedInquiry ? (
                  <ItineraryBuilder inquiry={selectedInquiry} onBack={() => setActiveTab('active-pipeline')} />
                ) : (
                  <SelectionRequired
                    title="Itinerary Builder"
                    description="Select an inquiry from your pipeline or launch a new AI-curated blueprint."
                    icon={FilePlus}
                    inquiries={inquiries}
                    onCreated={triggerGlobalRefresh}
                    onSelect={(inq) => {
                      setSelectedInquiry(inq);
                      setActiveTab('builder');
                    }}
                    teamUser={teamUser}
                  />
                )}
              </div>
            )}

            {/* TAB 6: INQUIRY VAULT */}
            {activeTab === 'vault' && (
              <div className="animate-in fade-in duration-300">
                {selectedInquiry ? (
                  <InquiryVault
                    inquiry={selectedInquiry}
                    onBack={() => setActiveTab('active-pipeline')}
                    onChanged={triggerGlobalRefresh}
                  />
                ) : (
                  <SelectionRequired
                    title="Inquiry Vault & Guest Documents"
                    description="Select a client inquiry to upload, verify, and manage passports, IDs, tickets, and vouchers."
                    icon={ShieldCheck}
                    inquiries={inquiries}
                    onCreated={triggerGlobalRefresh}
                    onSelect={(inq) => {
                      setSelectedInquiry(inq);
                      setActiveTab('vault');
                    }}
                    teamUser={teamUser}
                  />
                )}
              </div>
            )}

            {/* TAB 7: CLIENT DIRECTORY */}
            {activeTab === 'clients' && (
              <ClientDirectory
                canManage={canManage}
                refreshTrigger={dataRefreshKey}
                onCreateClient={openCreateModal}
                onEditClient={openEditModal}
                onInspectClient={openInspectDrawer}
                onRefreshMetrics={triggerGlobalRefresh}
                onNavigateTab={(tab, lead) => {
                  setSelectedInquiry(lead);
                  setActiveTab(tab);
                }}
              />
            )}

            {/* TAB 8: PAYMENT PORTAL */}
            {activeTab === 'payments' && (
              <div className="animate-in fade-in duration-300">
                {selectedInquiry ? (
                  <PaymentPortal
                    inquiry={selectedInquiry}
                    onBack={() => setActiveTab('active-pipeline')}
                    onPaymentRecorded={triggerGlobalRefresh}
                  />
                ) : (
                  <SelectionRequired
                    title="Payment Links & Settlement Ledger"
                    description="Select a client inquiry to generate Razorpay links, WhatsApp QR requests, or verify UTR receipts."
                    icon={CreditCard}
                    inquiries={inquiries}
                    onCreated={triggerGlobalRefresh}
                    onSelect={(inq) => {
                      setSelectedInquiry(inq);
                      setActiveTab('payments');
                    }}
                    teamUser={teamUser}
                  />
                )}
              </div>
            )}

            {/* TAB 9: TEAM & RBAC */}
            {activeTab === 'team-rbac' && showTeamTab && (
              <TeamManagement currentEmployee={employeeProfile} onTeamChanged={refreshWorkspace} />
            )}

            {/* TAB 10: WORK LOG */}
            {activeTab === 'work-log' && <WorkLog />}
          </ErrorBoundary>
        </div>
      </main>

      {/* Mobile Bottom Dock */}
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

      {/* Unified Create / Edit Lead Modal */}
      <LeadFormModal
        open={leadModalOpen}
        onOpenChange={setLeadModalOpen}
        initialLead={editingLead}
        teamMembers={teamMembers}
        canAssign={canManage}
        currentEmployeeCode={employeeProfile.code}
        onSuccess={(saved) => {
          if (drawerLead?.id === saved.id) setDrawerLead(saved);
          if (selectedInquiry?.id === saved.id) setSelectedInquiry(saved);
          triggerGlobalRefresh();
        }}
      />

      {/* Unified CRM Command Drawer */}
      <LeadCommandDrawer
        inquiry={drawerLead}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        canManage={canManage}
        teamMembers={teamMembers}
        onUpdated={triggerGlobalRefresh}
        onOpenEdit={(lead) => {
          openEditModal(lead);
        }}
        onNavigateTab={(tab, lead) => {
          setSelectedInquiry(lead);
          setActiveTab(tab);
        }}
      />
    </div>
  );
}
