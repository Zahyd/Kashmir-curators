import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
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
  FolderOpen,
  Search,
  PanelLeftClose,
  PanelLeftOpen,
  Wifi,
  WifiOff,
  BarChart3
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
import InquiryVaultHub from '@/components/sales/InquiryVaultHub';
import PaymentPortal from '@/components/sales/PaymentPortal';
import PaymentLinksCenter from '@/components/sales/PaymentLinksCenter';
import WorkLog from '@/components/sales/WorkLog';
import SelectionRequired from '@/components/sales/SelectionRequired';
import MobileSalesBottomBar from '@/components/sales/MobileSalesBottomBar';
import MetaLeadsHub from '@/components/sales/MetaLeadsHub';
import LeadFormModal from '@/components/sales/LeadFormModal';
import LeadCommandDrawer from '@/components/sales/LeadCommandDrawer';
import SalesNotificationCenter from '@/components/sales/SalesNotificationCenter';
import SalesCommandSearchModal from '@/components/sales/SalesCommandSearchModal';
import SalesAnalyticsPanel from '@/components/sales/SalesAnalyticsPanel';
import RecentActivityTimeline from '@/components/sales/RecentActivityTimeline';
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

const VALID_TABS = new Set<PortalTab>([
  'dashboard',
  'live-leads',
  'meta-hub',
  'active-pipeline',
  'builder',
  'vault',
  'clients',
  'payments',
  'team-rbac',
  'work-log'
]);

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

  const tabParam = searchParams.get('tab');
  const inquiryIdParam = searchParams.get('inquiryId');

  const resolvedTab: PortalTab = useMemo(() => {
    if (tabParam && VALID_TABS.has(tabParam as PortalTab)) return tabParam as PortalTab;
    return 'dashboard';
  }, [tabParam]);

  const {
    teamUser,
    isTeamAuthenticated,
    isTeamLoading,
    subscribeSalesEvent,
    connectionStatus,
    latencyMs,
    onlineStaffCodes,
    emitPresence,
    teamLogout
  } = useTeamAuth();

  const [activeTab, setActiveTab] = useState<PortalTab>(resolvedTab);
  const [selectedInquiry, setSelectedInquiry] = useState<SalesInquiry | null>(null);
  const [inquiries, setInquiries] = useState<SalesInquiry[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMemberItem[]>([]);
  const [pendingReminders, setPendingReminders] = useState<LeadReminderItem[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('sales_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isTogglingAvailability, setIsTogglingAvailability] = useState(false);
  const [metricsRefreshSignal, setMetricsRefreshSignal] = useState(0);
  const [dataRefreshKey, setDataRefreshKey] = useState(0);
  const [showAnalyticsOnDashboard, setShowAnalyticsOnDashboard] = useState(true);

  // Modals & CRM Drawer & Search
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<SalesInquiry | null>(null);
  const [drawerLead, setDrawerLead] = useState<SalesInquiry | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Keep activeTab synchronized with URL ?tab=
  useEffect(() => {
    setActiveTab(resolvedTab);
  }, [resolvedTab]);

  const lastDeepLinkedKeyRef = useRef<string | null>(null);

  // Helper: Navigate to tab and sync URL query params cleanly
  const navigateToTab = useCallback(
    (tab: PortalTab, inquiry?: SalesInquiry | null) => {
      setActiveTab(tab);
      setIsSidebarOpen(false);
      const nextParams = new URLSearchParams();
      if (tab !== 'dashboard') nextParams.set('tab', tab);
      if (inquiry !== undefined) {
        setSelectedInquiry(inquiry);
        if (inquiry?.id) nextParams.set('inquiryId', inquiry.id);
      } else if (tab === 'builder' || tab === 'vault' || tab === 'payments') {
        if (selectedInquiry?.id) nextParams.set('inquiryId', selectedInquiry.id);
      } else {
        setSelectedInquiry(null);
      }
      setSearchParams(nextParams, { replace: false });
    },
    [selectedInquiry?.id, setSearchParams]
  );

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

  const refreshWorkspace = useCallback(async () => {
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
  }, [isTeamAuthenticated, teamUser?.code]);

  const triggerGlobalRefresh = useCallback(() => {
    setMetricsRefreshSignal((k) => k + 1);
    setDataRefreshKey((k) => k + 1);
    refreshWorkspace();
  }, [refreshWorkspace]);

  useEffect(() => {
    if (isTeamAuthenticated) {
      refreshWorkspace();
    }
  }, [isTeamAuthenticated, activeTab, refreshWorkspace]);

  // Debounced refresh strictly on mutating business events (avoids redundant re-fetches on heartbeats/acks)
  useEffect(() => {
    if (!isTeamAuthenticated) return;
    let debounceTimer: number | null = null;
    const unsub = subscribeSalesEvent((eventName) => {
      if (
        eventName === 'NEW_INQUIRY' ||
        eventName === 'LEAD_CREATED' ||
        eventName === 'LEAD_CLAIMED' ||
        eventName === 'LEAD_UPDATED' ||
        eventName === 'LEAD_DELETED' ||
        eventName === 'STAGE_UPDATED' ||
        eventName === 'LEAD_STAGE_UPDATED' ||
        eventName === 'BOOKING_STATUS_UPDATED' ||
        eventName === 'PAYMENT_CONFIRMED' ||
        eventName === 'EMPLOYEE_STATUS_CHANGED' ||
        eventName === 'lead-updated' ||
        eventName === 'lead-assigned'
      ) {
        if (debounceTimer) window.clearTimeout(debounceTimer);
        debounceTimer = window.setTimeout(() => {
          triggerGlobalRefresh();
        }, 250);
      }
    });
    return () => {
      unsub();
      if (debounceTimer) window.clearTimeout(debounceTimer);
    };
  }, [isTeamAuthenticated, subscribeSalesEvent, triggerGlobalRefresh]);

  // Deep-link synchronization via ?inquiryId=
  useEffect(() => {
    if (!inquiryIdParam || !isTeamAuthenticated) return;
    const key = `${resolvedTab}:${inquiryIdParam}`;
    if (lastDeepLinkedKeyRef.current === key) return;

    const applyTargetLead = (found: SalesInquiry | null) => {
      if (!found) return;
      lastDeepLinkedKeyRef.current = key;
      if (!tabParam || !VALID_TABS.has(tabParam as PortalTab)) {
        setSelectedInquiry(found);
        setActiveTab('builder');
      } else if (resolvedTab === 'builder' || resolvedTab === 'vault' || resolvedTab === 'payments') {
        setSelectedInquiry(found);
      } else {
        setDrawerLead(found);
        setDrawerOpen(true);
      }
    };

    const existing = inquiries.find((i) => i.id === inquiryIdParam);
    if (existing) {
      applyTargetLead(existing);
      return;
    }

    let cancelled = false;
    salesApi
      .getLeadDetail(inquiryIdParam)
      .then((detail) => {
        if (!cancelled && detail?.id) {
          applyTargetLead(detail);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [inquiryIdParam, tabParam, resolvedTab, inquiries, isTeamAuthenticated]);

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('sales_sidebar_collapsed', String(next));
      } catch {
        // Ignore storage error
      }
      return next;
    });
  };

  const toggleAvailability = async () => {
    const nextStatus = !isOnline;
    setIsOnline(nextStatus);
    setIsTogglingAvailability(true);
    try {
      await salesApi.toggleAvailability(nextStatus);
      emitPresence(nextStatus ? 'ONLINE' : 'OFFLINE');
      toast.success(nextStatus ? 'Status: ONLINE — Taking leads' : 'Status: AWAY — Queue paused');
    } catch (err: unknown) {
      setIsOnline(!nextStatus);
      toast.error(err instanceof Error ? err.message : 'Failed to update availability');
    } finally {
      setIsTogglingAvailability(false);
    }
  };

  const handleCompleteReminder = async (rem: LeadReminderItem) => {
    try {
      await salesApi.updateReminder(rem.id, { status: 'COMPLETED' });
      toast.success('Follow-up completed');
      refreshWorkspace();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Could not update reminder');
    }
  };

  const handleNotificationLink = (rawLink: string) => {
    try {
      const parsed = new URL(rawLink, window.location.origin);
      const t = parsed.searchParams.get('tab') as PortalTab | null;
      const inqId = parsed.searchParams.get('inquiryId');
      const targetTab: PortalTab = t && VALID_TABS.has(t) ? t : 'dashboard';
      lastDeepLinkedKeyRef.current = null;

      if (targetTab === 'builder' || targetTab === 'vault' || targetTab === 'payments') {
        const targetInq = inqId ? inquiries.find((i) => i.id === inqId) || null : null;
        navigateToTab(targetTab, targetInq);
      } else {
        setActiveTab(targetTab);
        setIsSidebarOpen(false);
        setSelectedInquiry(null);
        const nextParams = new URLSearchParams();
        if (targetTab !== 'dashboard') nextParams.set('tab', targetTab);
        if (inqId) {
          nextParams.set('inquiryId', inqId);
          const targetInq = inquiries.find((i) => i.id === inqId);
          if (targetInq) {
            setDrawerLead(targetInq);
            setDrawerOpen(true);
            lastDeepLinkedKeyRef.current = `${targetTab}:${inqId}`;
          }
        }
        setSearchParams(nextParams, { replace: false });
      }
    } catch {
      // Fallback safely
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
      (!i.assignedTo || i.assignedTo.trim() === '' || i.assignedTo === 'Unassigned') &&
      !['Booked', 'Lost', 'Cancelled'].includes(i.status) &&
      !['CONFIRMED', 'COMPLETED', 'CANCELLED', 'LOST'].includes(i.leadStage || '')
  ).length;

  const recentActiveDeals = inquiries
    .filter((i) => {
      const st = normalizeStageKey(i.leadStage, i.status);
      return !['CONFIRMED', 'COMPLETED', 'LOST'].includes(st);
    })
    .slice(0, 5);

  const navItems = [
    { id: 'dashboard', label: 'Command Center', subtitle: 'KPIs, queue, analytics & live timeline', icon: LayoutDashboard, color: 'text-amber-400' },
    { id: 'live-leads', label: 'Live Leads', subtitle: 'Unclaimed inbound queue & SLA countdown', icon: Zap, color: 'text-emerald-400', badge: unclaimedCount > 0 ? String(unclaimedCount) : '15m SLA' },
    { id: 'meta-hub', label: 'Meta Raw Leads', subtitle: 'Instagram & Facebook ad webhook stream', icon: Globe, color: 'text-purple-400', badge: 'Live' },
    { id: 'active-pipeline', label: 'Active Pipeline', subtitle: 'Drag-and-drop Kanban sales board', icon: Layers, color: 'text-blue-400' },
    { id: 'builder', label: 'Itinerary Studio', subtitle: 'AI & custom Kashmir itinerary builder', icon: FilePlus, color: 'text-purple-400' },
    { id: 'vault', label: 'Inquiry Vault', subtitle: 'Client KYC, passports & voucher compliance', icon: ShieldCheck, color: 'text-teal-400' },
    { id: 'clients', label: 'Client Directory', subtitle: 'Paginated traveler CRM ledger', icon: Users, color: 'text-orange-400' },
    { id: 'payments', label: 'Payment Links', subtitle: 'Razorpay links, UPI QR & UTR settlement ledger', icon: CreditCard, color: 'text-amber-400' },
    ...(showTeamTab ? [{ id: 'team-rbac', label: 'Team & RBAC', subtitle: 'Concierge roster, capacity & roles', icon: Shield, color: 'text-rose-400', badge: 'Admin' }] : []),
    { id: 'work-log', label: 'Work Log', subtitle: 'Shift clock-in, break tracker & presence', icon: Clock, color: 'text-slate-400' }
  ];

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
      {/* Mobile Drawer Backdrop */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-[65]"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Collapsible Sidebar */}
      <aside
        className={cn(
          'max-w-[85vw] h-[100dvh] fixed left-0 top-0 bg-[#07090E] border-r border-white/10 flex flex-col z-[70] lg:z-40 transition-all duration-300 shadow-2xl overflow-hidden',
          isSidebarCollapsed ? 'w-72 lg:w-20' : 'w-72',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="shrink-0 p-4 border-b border-white/10 flex items-center justify-between bg-[#0F141C]/50">
          <Link to="/" className={cn('flex items-center gap-3 min-w-0', isSidebarCollapsed && 'lg:justify-center lg:w-full')}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
              <ShieldCheck className="w-5 h-5 text-black" />
            </div>
            {!isSidebarCollapsed && (
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-base text-white tracking-tight">SalesPro</span>
                  <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-mono font-bold">OS 2.0</span>
                </div>
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium truncate">The Kashmir Curators</p>
              </div>
            )}
          </Link>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white p-1"
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={toggleSidebarCollapse}
            className="hidden lg:flex items-center justify-center p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 shrink-0"
            title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isSidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>

        <nav className="flex-1 min-h-0 overflow-y-auto px-2.5 py-4 space-y-1 custom-scrollbar" aria-label="Sales Portal Modules">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => navigateToTab(item.id as PortalTab, null)}
                title={item.label}
                className={cn(
                  'w-full flex items-center px-3 py-2.5 rounded-xl transition-all text-xs font-semibold group',
                  isSidebarCollapsed ? 'lg:justify-center' : 'justify-between',
                  isActive
                    ? 'bg-[#0F141C] text-white border border-amber-500/30 shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <item.icon className={cn('w-4 h-4 shrink-0', isActive ? item.color : 'text-slate-500 group-hover:text-slate-300')} />
                  <span className={cn('tracking-wide uppercase text-[11px] truncate', isSidebarCollapsed && 'lg:hidden')}>
                    {item.label}
                  </span>
                </div>
                {item.badge && (
                  <span
                    className={cn(
                      'text-[9px] font-mono px-1.5 py-0.5 rounded font-bold shrink-0',
                      isSidebarCollapsed && 'lg:hidden',
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

        <div className="shrink-0 p-3.5 pb-[max(1.25rem,env(safe-area-inset-bottom))] border-t border-white/10 bg-[#0F141C]/95 space-y-3">
          {!isSidebarCollapsed && (
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
          )}

          <button
            onClick={toggleAvailability}
            disabled={isTogglingAvailability}
            title={isOnline ? 'Online • Taking Leads' : 'Away • Queue Paused'}
            className={cn(
              'w-full flex items-center px-3 py-2 rounded-lg text-xs font-semibold transition border',
              isSidebarCollapsed ? 'lg:justify-center' : 'justify-between',
              isOnline
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
            )}
          >
            <div className="flex items-center gap-2">
              <span className={cn('w-2 h-2 rounded-full shrink-0', isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400')} />
              <span className={cn(isSidebarCollapsed && 'lg:hidden')}>
                {isOnline ? 'Online • Taking Leads' : 'Away • Queue Paused'}
              </span>
            </div>
            <span className={cn('text-[10px] font-mono text-slate-400 uppercase', isSidebarCollapsed && 'lg:hidden')}>
              Toggle
            </span>
          </button>

          {!isSidebarCollapsed && (
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
          )}
        </div>
      </aside>

      {/* Main Workspace */}
      <main
        className={cn(
          'flex-1 min-w-0 flex flex-col min-h-[100dvh] transition-all duration-300',
          isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72'
        )}
      >
        {/* Unified Responsive Top Command Bar */}
        <header className="sticky top-0 z-40 flex items-center justify-between px-3.5 lg:px-6 xl:px-8 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 lg:py-3 bg-[#07090E]/95 backdrop-blur-2xl border-b border-white/10 gap-3 shadow-lg lg:shadow-none">
          <div className="flex items-center gap-2.5 min-w-0">
            <Link to="/" className="lg:hidden w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center font-bold text-black text-xs shrink-0 shadow-md shadow-amber-500/20">
              KC
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex lg:hidden items-center gap-1">
                  <span className="text-sm font-bold text-white tracking-wide">SalesPro</span>
                  <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1 rounded font-mono font-bold">2.0</span>
                </div>
                <span
                  className={cn(
                    'hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono border',
                    connectionStatus === 'connected'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : connectionStatus === 'reconnecting'
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  )}
                >
                  {connectionStatus === 'connected' ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                  <span>
                    {connectionStatus === 'connected'
                      ? `Live WS${latencyMs !== null ? ` • ${latencyMs}ms` : ''}`
                      : connectionStatus === 'reconnecting'
                        ? 'Reconnecting...'
                        : 'Offline'}
                  </span>
                </span>
                <span className="hidden lg:inline text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">
                  {onlineStaffCodes.length || teamMembers.filter((m) => m.isOnline).length} Staff Online
                </span>
              </div>
              <h1 className="text-[11px] lg:text-lg font-mono lg:font-sans font-bold text-slate-300 lg:text-white tracking-tight truncate">
                {TAB_TITLES[activeTab]}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Search commands and leads"
              className="h-8 w-8 lg:w-auto lg:h-9 lg:px-3 rounded-lg lg:rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 flex items-center justify-center gap-2 transition-colors"
            >
              <Search className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden xl:inline">Search leads, UTRs, docs...</span>
              <kbd className="hidden lg:inline px-1.5 py-0.5 rounded bg-black/40 border border-white/10 text-[10px] font-mono text-slate-400">
                ⌘K
              </kbd>
            </button>

            <SalesNotificationCenter onNavigateLink={handleNotificationLink} />

            <Badge className="hidden lg:inline-flex bg-[#0F141C] border border-white/10 text-slate-300 text-xs font-mono py-1 px-2.5">
              {roleLabel}
            </Badge>
            <Button
              size="sm"
              onClick={openCreateModal}
              className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-[10px] lg:text-xs h-8 lg:h-9 px-2 lg:px-3.5 rounded-md lg:rounded-lg"
            >
              <Plus className="w-3 h-3 lg:w-3.5 lg:h-3.5 mr-0.5 lg:mr-1.5" />
              <span className="lg:hidden">Lead</span>
              <span className="hidden lg:inline">New Lead</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={triggerGlobalRefresh}
              className="hidden lg:inline-flex border-white/10 text-slate-300 hover:text-white h-9 px-2.5"
              title="Refresh workspace data"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-1.5 text-slate-300 hover:text-white rounded-lg bg-white/5"
              aria-label="Toggle navigation drawer"
            >
              {isSidebarOpen ? <X className="w-4 h-4 text-amber-400" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </header>

        <div className="p-3 sm:p-6 lg:p-8 pb-28 lg:pb-10 max-w-[1600px] w-full mx-auto space-y-6">
          <ErrorBoundary variant="panel">
            {/* TAB 1: COMMAND CENTER DASHBOARD */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <SalesMetricsRibbon refreshSignal={metricsRefreshSignal} onRefreshNeeded={triggerGlobalRefresh} />

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  <div className="xl:col-span-2 space-y-6">
                    <LiveLeadQueue
                      currentEmployee={employeeProfile}
                      canManage={canManage}
                      refreshTrigger={dataRefreshKey}
                      onCreateLead={openCreateModal}
                      onInspectLead={openInspectDrawer}
                      onClaimLead={(lead) => {
                        navigateToTab('builder', lead);
                        triggerGlobalRefresh();
                      }}
                      onRefreshMetrics={triggerGlobalRefresh}
                    />

                    {/* Toggleable Revenue & Conversion Analytics */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setShowAnalyticsOnDashboard((v) => !v)}
                          className="text-xs font-bold text-amber-300 hover:text-amber-200 flex items-center gap-1.5"
                        >
                          <BarChart3 className="w-4 h-4" />
                          <span>{showAnalyticsOnDashboard ? 'Hide Revenue Analytics' : 'Show Revenue Analytics'}</span>
                        </button>
                      </div>
                      {showAnalyticsOnDashboard && <SalesAnalyticsPanel />}
                    </div>
                  </div>

                  {/* Right Column: Follow-Up Reminders, Pipeline Snapshot & Real-Time Activity Timeline */}
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
                              <Button
                                size="sm"
                                onClick={() => handleCompleteReminder(rem)}
                                className="h-7 px-2 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-black text-[10px] font-bold shrink-0"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                              </Button>
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
                          onClick={() => navigateToTab('active-pipeline')}
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

                    <RecentActivityTimeline
                      limit={8}
                      onInspectLeadId={(id) => {
                        const found = inquiries.find((i) => i.id === id);
                        if (found) openInspectDrawer(found);
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: LIVE LEADS QUEUE */}
            {activeTab === 'live-leads' && (
              <div className="space-y-5 animate-in fade-in duration-300">
                <SalesMetricsRibbon refreshSignal={metricsRefreshSignal} onRefreshNeeded={triggerGlobalRefresh} />
                <LiveLeadQueue
                  currentEmployee={employeeProfile}
                  canManage={canManage}
                  refreshTrigger={dataRefreshKey}
                  onCreateLead={openCreateModal}
                  onInspectLead={openInspectDrawer}
                  onClaimLead={(lead) => {
                    navigateToTab('builder', lead);
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
                onOpenItineraryBuilder={(lead) => navigateToTab('builder', lead)}
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
                onOpenItineraryBuilder={(deal) => navigateToTab('builder', deal)}
                onRefreshMetrics={triggerGlobalRefresh}
              />
            )}

            {/* TAB 5: ITINERARY BUILDER */}
            {activeTab === 'builder' && (
              <div className="animate-in fade-in duration-300">
                {selectedInquiry ? (
                  <ItineraryBuilder inquiry={selectedInquiry} onBack={() => navigateToTab('active-pipeline', null)} />
                ) : (
                  <SelectionRequired
                    mode="builder"
                    title="Itinerary Builder"
                    description="Select an inquiry from your pipeline or launch a new AI-curated blueprint."
                    icon={FilePlus}
                    inquiries={inquiries}
                    onCreated={triggerGlobalRefresh}
                    onSelect={(inq) => navigateToTab('builder', inq)}
                    teamUser={teamUser}
                  />
                )}
              </div>
            )}

            {/* TAB 6: INQUIRY VAULT (Global Registry Hub when no single lead selected) */}
            {activeTab === 'vault' && (
              <div className="animate-in fade-in duration-300">
                {selectedInquiry ? (
                  <InquiryVault
                    inquiry={selectedInquiry}
                    onBack={() => navigateToTab('vault', null)}
                    onChanged={triggerGlobalRefresh}
                  />
                ) : (
                  <InquiryVaultHub
                    inquiries={inquiries}
                    onSelectInquiry={(inq) => navigateToTab('vault', inq)}
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
                onNavigateTab={(tab, lead) => navigateToTab(tab, lead)}
              />
            )}

            {/* TAB 8: PAYMENT LINKS & LEDGER (Real Settlement Ledger Hub when no single lead selected) */}
            {activeTab === 'payments' && (
              <div className="animate-in fade-in duration-300">
                {selectedInquiry ? (
                  <PaymentPortal
                    inquiry={selectedInquiry}
                    onBack={() => navigateToTab('payments', null)}
                    onPaymentRecorded={triggerGlobalRefresh}
                  />
                ) : (
                  <PaymentLinksCenter
                    inquiries={inquiries}
                    onSelectInquiry={(inq) => navigateToTab('payments', inq)}
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
        onTabChange={(tab) => navigateToTab(tab as PortalTab, null)}
        isSidebarOpen={isSidebarOpen}
        onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        unclaimedCount={unclaimedCount}
      />

      {/* Global Command Search (Ctrl+K / Cmd+K) */}
      <SalesCommandSearchModal
        open={searchOpen}
        onOpenChange={setSearchOpen}
        quickTabs={navItems.map((n) => ({ id: n.id, label: n.label, subtitle: n.subtitle }))}
        onNavigateTab={(tabId) => navigateToTab(tabId as PortalTab, null)}
        onSelectLead={(lead) => openInspectDrawer(lead)}
        onOpenLeadPayments={(leadId) => {
          const found = inquiries.find((i) => i.id === leadId) || null;
          navigateToTab('payments', found);
        }}
        onOpenLeadVault={(leadId) => {
          const found = inquiries.find((i) => i.id === leadId) || null;
          navigateToTab('vault', found);
        }}
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
        onNavigateTab={(tab, lead) => navigateToTab(tab, lead)}
      />
    </div>
  );
}
