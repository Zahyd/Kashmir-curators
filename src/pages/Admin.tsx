import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import {
  Package,
  Building,
  Building2,
  Car,
  Users,
  TrendingUp,
  DollarSign,
  HelpCircle,
  Settings,
  Sparkles,
  Search,
  Calendar,
  ChevronRight,
  Star,
  MapPin,
  CalendarCheck,
  ExternalLink,
  ShieldAlert,
  ArrowUpRight,
  RefreshCw,
  Layers,
  Compass,
  LogOut,
  ChevronDown,
  Wallet,
  LayoutGrid,
  Loader2,
  UserCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTeamAuth, ROLE_LABELS } from '@/contexts/TeamAuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { API_BASE_URL } from '@/lib/api';
import NotificationBell from '@/components/admin/NotificationBell';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import AdminSidebar from '@/components/admin/AdminSidebar';
import MobilePortalNav from '@/components/layout/MobilePortalNav';
import MobilePortalBottomBar from '@/components/layout/MobilePortalBottomBar';
import AdminErrorBoundary from '@/components/admin/AdminErrorBoundary';
import { AdminCommandPalette } from '@/components/admin/AdminCommandPalette';
import { DirectorAiCopilot } from '@/components/admin/DirectorAiCopilot';

// Code-split lazy imports for all 27 Admin CMS & Ops modules (keeps initial bundle lean & fast)
const CMSInquiries = lazy(() => import('@/components/admin/CMSInquiries'));
const CMSPackages = lazy(() => import('@/components/admin/CMSPackages'));
const CMSHotels = lazy(() => import('@/components/admin/CMSHotels'));
const CMSCabs = lazy(() => import('@/components/admin/CMSCabs'));
const CMSTestimonials = lazy(() => import('@/components/admin/CMSTestimonials'));
const CMSFaqs = lazy(() => import('@/components/admin/CMSFaqs'));
const MediaLibrary = lazy(() => import('@/components/admin/MediaLibrary'));
const CMSSiteContent = lazy(() => import('@/components/admin/CMSSiteContent'));
const CMSBookings = lazy(() => import('@/components/admin/CMSBookings'));
const CMSRevenue = lazy(() => import('@/components/admin/CMSRevenue'));
const CMSUsers = lazy(() => import('@/components/admin/CMSUsers'));
const CMSPayments = lazy(() => import('@/components/admin/CMSPayments'));
const CMSJourney = lazy(() => import('@/components/admin/CMSJourney'));
const CMSProfile = lazy(() => import('@/components/admin/CMSProfile'));
const CMSReservations = lazy(() => import('@/components/admin/CMSReservations'));
const CMSDisruptions = lazy(() => import('@/components/admin/CMSDisruptions'));
const CMSPageBuilder = lazy(() => import('@/components/admin/CMSPageBuilder'));
const CMSDestinations = lazy(() => import('@/components/admin/CMSDestinations'));
const CMSItineraryBuilder = lazy(() => import('@/components/admin/CMSItineraryBuilder'));
const CMSActivities = lazy(() => import('@/components/admin/CMSActivities'));
const CMSCoupons = lazy(() => import('@/components/admin/CMSCoupons'));
const CMSSeo = lazy(() => import('@/components/admin/CMSSeo'));
const CMSReports = lazy(() => import('@/components/admin/CMSReports'));
const CMSAuditLogs = lazy(() => import('@/components/admin/CMSAuditLogs'));
const CMSSettings = lazy(() => import('@/components/admin/CMSSettings'));
const CMSPortalKeys = lazy(() => import('@/components/admin/CMSPortalKeys'));
const CMSAttendance = lazy(() => import('@/components/admin/CMSAttendance'));

const ModuleSkeleton = () => (
  <div className="min-h-[420px] rounded-3xl bg-[#0a0f14]/80 border border-white/10 p-8 flex flex-col items-center justify-center gap-3 text-white/50">
    <Loader2 className="w-7 h-7 text-amber-400 animate-spin" />
    <p className="text-xs font-mono uppercase tracking-widest">Loading Live OS Module...</p>
  </div>
);

export default function Admin() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { teamUser, isTeamAuthenticated, isTeamLoading, canAccessAdmin, systemEvents, teamLogout } = useTeamAuth();
  const [activeSection, setActiveSectionState] = useState(() => searchParams.get('section') || searchParams.get('tab') || 'dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [aiCopilotOpen, setAiCopilotOpen] = useState(false);

  const [dynamicStats, setDynamicStats] = useState<any>(null);
  const [isSyncingStats, setIsSyncingStats] = useState(false);
  const [apiLatencyMs, setApiLatencyMs] = useState<number | null>(null);
  const [gatewayOnline, setGatewayOnline] = useState<boolean>(true);
  const [selectedChartPeriod, setSelectedChartPeriod] = useState<'Daily' | 'Weekly' | 'Monthly'>('Monthly');

  const setActiveSection = useCallback((section: string) => {
    setActiveSectionState(section);
    if (section === 'dashboard') {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ section }, { replace: true });
    }
  }, [setSearchParams]);

  useEffect(() => {
    const sec = searchParams.get('section') || searchParams.get('tab');
    if (sec && sec !== activeSection) {
      setActiveSectionState(sec);
    }
  }, [searchParams]);

  const fetchStats = useCallback(async () => {
    setIsSyncingStats(true);
    const startMs = performance.now();
    try {
      const token = localStorage.getItem('teamToken');
      const response = await fetch(`${API_BASE_URL}/dashboard/admin`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const elapsed = Math.max(1, Math.round(performance.now() - startMs));
      setApiLatencyMs(elapsed);

      if (response.status === 401 || response.status === 403) {
        teamLogout();
        navigate('/sales/auth');
        return;
      }

      if (!response.ok) throw new Error('Failed to fetch stats');

      const data = await response.json();
      if (data && !data.error) {
        setDynamicStats(data);
        setGatewayOnline(true);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      setGatewayOnline(false);
    } finally {
      setIsSyncingStats(false);
    }
  }, [navigate, teamLogout]);

  useEffect(() => {
    if (!isTeamLoading) {
      if (!isTeamAuthenticated) {
        navigate('/sales/auth');
      } else if (!canAccessAdmin) {
        navigate('/sales/portal');
      } else {
        fetchStats();
      }
    }
  }, [isTeamAuthenticated, canAccessAdmin, isTeamLoading, navigate, fetchStats]);

  useEffect(() => {
    if (isTeamAuthenticated && canAccessAdmin && systemEvents.length > 0) {
      fetchStats();
    }
  }, [systemEvents.length]);

  if (isTeamLoading || !isTeamAuthenticated || !canAccessAdmin) {
    return null;
  }

  const teamRole = teamUser?.role || 'admin';

  const getDisplayStats = () => {
    const s = dynamicStats || {};
    const revLakhs = `₹${((Number(s.totalRevenue) || 0) / 100000).toFixed(2)}L`;

    if (teamRole === 'operations') {
      return [
        { label: 'Pending Reservations', value: (s.pendingReservations ?? 0).toLocaleString(), icon: CalendarCheck, badge: (s.pendingReservations ?? 0) > 0 ? 'Action Needed' : 'Clear', trend: 'neutral', section: 'reservations' },
        { label: 'Today Check-ins / Outs', value: `${s.dailyCheckIns ?? 0} In / ${s.dailyCheckOuts ?? 0} Out`, icon: Calendar, badge: 'Live Today', trend: 'up', section: 'reservations' },
        { label: 'Hotel Dues Pending', value: `₹${Number(s.hotelDues || 0).toLocaleString('en-IN')}`, icon: DollarSign, badge: 'Payables', trend: 'neutral', section: 'reservations' },
        { label: 'Net Profit Margin', value: `₹${Number(s.profitMargins || 0).toLocaleString('en-IN')}`, icon: TrendingUp, badge: s.grossMarginPercent || '0%', trend: 'up', section: 'revenue' },
      ];
    }

    if (teamRole === 'marketing') {
      return [
        { label: 'Guest Reviews', value: (s.newReviews ?? 0).toLocaleString(), icon: Star, badge: 'Verified', trend: 'up', section: 'reviews' },
        { label: 'Active FAQs', value: (s.activeFaqs ?? 0).toLocaleString(), icon: HelpCircle, badge: 'Published', trend: 'neutral', section: 'faqs' },
        { label: 'Active Packages', value: (s.totalPackages ?? 0).toLocaleString(), icon: Package, badge: 'Catalog', trend: 'up', section: 'packages' },
        { label: 'Hotel Nodes', value: (s.hotelNodes ?? 0).toLocaleString(), icon: Building, badge: 'Partner stays', trend: 'up', section: 'hotels' },
      ];
    }

    if (teamRole === 'finance') {
      return [
        { label: 'Confirmed Revenue', value: revLakhs, icon: DollarSign, badge: s.revenueGrowthPct || 'Live', trend: 'up', section: 'revenue' },
        { label: 'Hotel Dues Pending', value: `₹${Number(s.hotelDues || 0).toLocaleString('en-IN')}`, icon: CalendarCheck, badge: 'Settlements', trend: 'neutral', section: 'payments' },
        { label: 'Customer Wallets', value: `₹${Number(s.totalWalletLiability || 0).toLocaleString('en-IN')}`, icon: Wallet, badge: 'Credits Liability', trend: 'neutral', section: 'users' },
        { label: 'Gross Margin', value: s.grossMarginPercent || '0%', icon: TrendingUp, badge: `₹${Number(s.profitMargins || 0).toLocaleString('en-IN')}`, trend: 'up', section: 'reports' },
      ];
    }

    return [
      { label: 'Total Bookings', value: (s.totalBookings ?? 0).toLocaleString(), icon: Package, badge: `${s.pendingBookings ?? 0} pending`, trend: 'up', section: 'bookings' },
      { label: 'Confirmed Revenue', value: revLakhs, icon: DollarSign, badge: s.revenueGrowthPct || 'Live DB', trend: 'up', section: 'revenue' },
      { label: 'Traveler Accounts', value: (s.totalUsers ?? 0).toLocaleString(), icon: Users, badge: `${s.pendingAgents ?? 0} B2B pending`, trend: 'up', section: 'users' },
      { label: 'Active Packages', value: (s.totalPackages ?? 0).toLocaleString(), icon: Compass, badge: `${s.hotelNodes ?? 0} hotels`, trend: 'neutral', section: 'packages' },
    ];
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const activeSeries: Array<{ label: string; value: number; isCurrent?: boolean }> =
    dynamicStats?.revenueSeries?.[selectedChartPeriod] || [];
  const maxSeriesVal = Math.max(1, ...activeSeries.map(item => Number(item.value || 0)));
  const periodSum = activeSeries.reduce((acc, item) => acc + Number(item.value || 0), 0);

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
            {/* EXECUTIVE HERO RADAR */}
            <div className="relative overflow-hidden p-4 sm:p-6 lg:p-8 rounded-2xl bg-gradient-to-br from-white/[0.04] via-white/[0.02] to-transparent border border-white/10 shadow-xl backdrop-blur-2xl">
              <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 blur-[100px] pointer-events-none" />
              <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 sm:gap-6">
                {/* Greeting & Live Advisories */}
                <div className="space-y-2.5 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <span className="px-2 sm:px-2.5 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-[9px] font-black uppercase tracking-wider">
                      COMMAND RADAR
                    </span>
                    <span className="text-white/40 text-[10px] font-mono">
                      {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span className="text-white/20">•</span>
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Neon Synced
                    </span>
                  </div>

                  <h1 className="text-xl sm:text-3xl lg:text-4xl font-display font-bold text-white tracking-tight">
                    {getGreeting()},{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-200">
                      {teamUser?.name?.split(' ')[0] || ROLE_LABELS[teamRole]}
                    </span>
                  </h1>

                  <p className="text-white/60 text-xs sm:text-sm font-normal leading-relaxed">
                    Unified live control tower across Bookings, Hospitality CRS, Fleet Dispatch, B2B Agent Licensing, and Customer Travel Wallets.
                  </p>

                  {/* Live Neon Ground Corridor Status Chips */}
                  <div className="pt-1 flex flex-wrap items-center gap-1.5 sm:gap-2 text-[10px]">
                    {(dynamicStats?.liveAdvisories || []).length > 0 ? (
                      (dynamicStats.liveAdvisories as any[]).slice(0, 3).map((adv: any) => (
                        <button
                          key={adv.id}
                          type="button"
                          onClick={() => setActiveSection('disruptions')}
                          className={cn(
                            'px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition-colors text-[10px]',
                            adv.emergencyModeActive || adv.severity === 'CRITICAL_EMERGENCY'
                              ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                              : 'bg-white/[0.03] border-white/10 text-white/75 hover:border-amber-400/40'
                          )}
                        >
                          <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                          <span>
                            {adv.location}: <b>{adv.status}</b>
                          </span>
                        </button>
                      ))
                    ) : (
                      <button
                        type="button"
                        onClick={() => setActiveSection('disruptions')}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 flex items-center gap-1.5 text-[10px]"
                      >
                        <Compass className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span>All Corridors Clear • 0 Active Disruption Alerts</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Live Operations Snapshot Pills */}
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-2.5 w-full lg:w-auto">
                  <div
                    onClick={() => setActiveSection('inquiries')}
                    className="flex-1 sm:w-36 p-2.5 sm:p-3.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-amber-400/40 transition-all cursor-pointer group text-center"
                  >
                    <p className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-white/40 mb-0.5">Active Queue</p>
                    <p className="text-lg sm:text-xl font-bold text-white group-hover:text-amber-300 transition-colors">
                      {dynamicStats?.activeInquiries ?? 0} <span className="text-[10px] sm:text-xs text-amber-400 font-mono">leads</span>
                    </p>
                  </div>

                  <div
                    onClick={() => setActiveSection('cabs')}
                    className="flex-1 sm:w-36 p-2.5 sm:p-3.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-amber-400/40 transition-all cursor-pointer group text-center"
                  >
                    <p className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-white/40 mb-0.5">Active Fleet</p>
                    <p className="text-lg sm:text-xl font-bold text-emerald-400 group-hover:text-emerald-300 transition-colors">
                      {dynamicStats?.cabAvailability ?? '0%'}{' '}
                      <span className="text-[9px] sm:text-[10px] text-white/40 font-mono">
                        ({dynamicStats?.activeCabs ?? 0}/{dynamicStats?.totalCabs ?? 0})
                      </span>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setAiCopilotOpen(true)}
                    className="col-span-2 sm:w-auto px-4 py-2.5 sm:py-3.5 rounded-xl bg-amber-400 text-black hover:bg-amber-300 transition-all cursor-pointer font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Ask Ops AI</span>
                  </button>
                </div>
              </div>
            </div>

            {/* REAL-TIME KPI STATS GRID */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
              {getDisplayStats().map((stat) => (
                <Card
                  key={stat.label}
                  onClick={() => stat.section && setActiveSection(stat.section)}
                  className="bg-[#0a0f14]/80 border-white/10 p-3.5 sm:p-5 rounded-xl sm:rounded-2xl backdrop-blur-xl transition-all duration-300 hover:border-amber-400/30 hover:bg-white/[0.03] hover:-translate-y-0.5 cursor-pointer group relative overflow-hidden"
                >
                  <div className="flex items-start justify-between mb-2 sm:mb-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center group-hover:bg-amber-400/10 group-hover:border-amber-400/30 transition-colors shrink-0">
                      <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[8px] sm:text-[9px] font-black uppercase tracking-wider px-1.5 sm:px-2 py-0.5',
                        stat.trend === 'up'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-white/5 text-white/60 border-white/10'
                      )}
                    >
                      {stat.badge}
                    </Badge>
                  </div>

                  <div className="space-y-0.5">
                    <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-white/45 truncate">{stat.label}</p>
                    <div className="text-lg sm:text-2xl lg:text-3xl font-display font-bold text-white tracking-tight truncate">
                      {stat.value}
                    </div>
                  </div>

                  <div className="mt-2.5 sm:mt-4 pt-2 sm:pt-3 border-t border-white/5 flex items-center justify-between text-[9px] sm:text-[10px] text-white/40 group-hover:text-amber-300 transition-colors">
                    <span>Manage</span>
                    <ArrowUpRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                </Card>
              ))}
            </div>

            {/* MULTI-OS ECOSYSTEM CONTROL STRIP */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Link
                to="/hospitality"
                className="p-4 rounded-2xl bg-[#0a0f14]/80 border border-white/10 hover:border-amber-400/40 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 shrink-0">
                    <Building className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white group-hover:text-amber-300 truncate">Hospitality OS</p>
                    <p className="text-[10px] text-white/40 truncate">
                      {dynamicStats?.pendingReservations ?? 0} pending CRS • ₹{Number(dynamicStats?.hotelDues || 0).toLocaleString('en-IN')} dues
                    </p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-white/30 group-hover:text-amber-400 shrink-0" />
              </Link>

              <Link
                to="/sales/portal"
                className="p-4 rounded-2xl bg-[#0a0f14]/80 border border-white/10 hover:border-purple-400/40 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-400 shrink-0">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white group-hover:text-purple-300 truncate">Sales CRM Desk</p>
                    <p className="text-[10px] text-white/40 truncate">
                      {dynamicStats?.unassignedLeads ?? 0} unassigned leads
                    </p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-white/30 group-hover:text-purple-400 shrink-0" />
              </Link>

              <Link
                to="/agent"
                className="p-4 rounded-2xl bg-[#0a0f14]/80 border border-white/10 hover:border-emerald-400/40 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white group-hover:text-emerald-300 truncate">B2B Agent CRM</p>
                    <p className="text-[10px] text-white/40 truncate">
                      {dynamicStats?.pendingAgents ?? 0} license approvals
                    </p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-white/30 group-hover:text-emerald-400 shrink-0" />
              </Link>

              <Link
                to="/driver"
                className="p-4 rounded-2xl bg-[#0a0f14]/80 border border-white/10 hover:border-sky-400/40 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/25 flex items-center justify-center text-sky-400 shrink-0">
                    <Car className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white group-hover:text-sky-300 truncate">Driver Cockpit</p>
                    <p className="text-[10px] text-white/40 truncate">
                      {dynamicStats?.activeCabs ?? 0} active vehicles
                    </p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-white/30 group-hover:text-sky-400 shrink-0" />
              </Link>
            </div>

            {/* OPERATIONS DISPATCH & LEAD QUEUE */}
            {(teamRole === 'operations' || teamRole === 'admin') && (
              <Card className="bg-[#0a0f14]/80 border-white/10 p-6 rounded-2xl backdrop-blur-xl shadow-xl">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-white">Operational Dispatch</h3>
                    <p className="text-xs text-blue-400 uppercase tracking-widest font-black">
                      Unassigned Lead Queue ({dynamicStats?.unassignedLeads ?? 0})
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveSection('inquiries')}
                    className="rounded-xl bg-white/[0.04] border-white/10 text-white hover:text-white text-xs font-bold hover:bg-white/[0.08]"
                  >
                    View All Leads ({dynamicStats?.activeInquiries ?? 0}) <ChevronRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(dynamicStats?.recentInquiries || [])
                    .filter((inq: any) => !inq.assignedTo)
                    .slice(0, 3)
                    .map((inq: any) => (
                      <div
                        key={inq.id}
                        className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-amber-400/30 hover:bg-white/[0.04] transition-all group flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <Badge className="bg-blue-500/10 text-blue-400 border-none px-2 py-0.5 rounded text-[8px] font-black uppercase">
                              Unassigned
                            </Badge>
                            <span className="text-[10px] text-white/30 font-mono">
                              {new Date(inq.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                            {inq.customerName}
                          </h4>
                          <p className="text-xs text-white/50 flex items-center gap-1.5">
                            <MapPin className="w-3 h-3 text-amber-400" />
                            <span>
                              {inq.destination} • {inq.duration} Days
                            </span>
                          </p>
                        </div>

                        <Button
                          size="sm"
                          onClick={() => setActiveSection('inquiries')}
                          className="mt-4 w-full rounded-lg bg-white/[0.05] border border-white/10 text-white hover:bg-amber-400 hover:text-black transition-all text-xs font-bold h-9"
                        >
                          Assign Agent
                        </Button>
                      </div>
                    ))}

                  {(dynamicStats?.recentInquiries || []).filter((inq: any) => !inq.assignedTo).length === 0 && (
                    <div className="col-span-full py-10 text-center bg-white/[0.01] border border-dashed border-white/5 rounded-xl">
                      <Sparkles className="w-6 h-6 text-emerald-400/40 mx-auto mb-2" />
                      <p className="text-white/45 text-xs font-bold uppercase tracking-wider">All leads currently assigned</p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* REAL NEON REVENUE TELEMETRY & LIVE EVENT STREAM */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Real Database Revenue Chart */}
              <Card className="lg:col-span-8 bg-[#0a0f14]/80 border-white/10 p-6 rounded-2xl backdrop-blur-xl shadow-xl">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-white">Live Revenue Telemetry</h3>
                    <p className="text-xs text-white/40 uppercase tracking-widest font-black">
                      Neon DB Booking Volume • {selectedChartPeriod}: ₹{periodSum.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="flex gap-1.5 p-1 rounded-xl bg-white/[0.03] border border-white/10 text-[10px] font-bold">
                    {(['Daily', 'Weekly', 'Monthly'] as const).map((period) => (
                      <button
                        key={period}
                        type="button"
                        onClick={() => setSelectedChartPeriod(period)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg transition-all',
                          selectedChartPeriod === period ? 'bg-amber-400 text-black font-black' : 'text-white/50 hover:text-white'
                        )}
                      >
                        {period}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto pb-2 custom-scrollbar">
                  <div className="min-w-[320px] sm:min-w-0 h-[200px] sm:h-[240px] w-full flex items-end gap-1.5 sm:gap-2 relative px-1 sm:px-2 pt-6">
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="w-full h-px bg-white/20" />
                      ))}
                    </div>

                    {activeSeries.length > 0 ? (
                      activeSeries.map((bucket) => {
                        const pct = bucket.value > 0
                          ? Math.max(12, Math.min(100, Math.round((bucket.value / maxSeriesVal) * 95)))
                          : 6;
                        return (
                          <div key={bucket.label} className="flex-1 flex flex-col items-center gap-2 group/bar">
                            <div className="w-full relative h-[150px] sm:h-[180px] flex items-end">
                              <div
                                className={cn(
                                  'w-full rounded-t-md transition-all duration-500',
                                  bucket.isCurrent
                                    ? 'bg-gradient-to-t from-amber-500/40 via-amber-400 to-yellow-300 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                                    : bucket.value > 0
                                      ? 'bg-amber-400/35 group-hover/bar:bg-amber-400/70'
                                      : 'bg-white/[0.06] group-hover/bar:bg-white/15'
                                )}
                                style={{ height: `${pct}%` }}
                              >
                                <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-all bg-amber-400 text-black font-black text-[9px] px-2 py-0.5 rounded shadow whitespace-nowrap z-20 pointer-events-none">
                                  ₹{bucket.value.toLocaleString('en-IN')}
                                </div>
                              </div>
                            </div>
                            <span
                              className={cn(
                                'text-[9px] font-bold uppercase truncate max-w-full text-center',
                                bucket.isCurrent ? 'text-amber-400 font-black' : 'text-white/35'
                              )}
                            >
                              {bucket.label}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-white/35 font-mono">
                        Loading Neon revenue series...
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap items-center justify-between text-[10px] text-white/40 gap-2">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400" /> Current Period
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400/35" /> Recorded Bookings
                    </span>
                  </div>
                  <span className="font-mono text-emerald-400/80">
                    Synced: {dynamicStats?.syncedAt ? new Date(dynamicStats.syncedAt).toLocaleTimeString('en-IN') : 'Live'}
                  </span>
                </div>
              </Card>

              {/* Live System Activity Feed */}
              <Card className="lg:col-span-4 bg-[#0a0f14]/80 border-white/10 p-6 rounded-2xl backdrop-blur-xl shadow-xl flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">Live Event Stream</h3>
                    <p className="text-xs text-amber-400 uppercase tracking-widest font-black">Real-time Socket Feed</p>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px] pr-1 custom-scrollbar">
                  {systemEvents.length > 0 ? (
                    systemEvents.slice(0, 8).map((event, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all flex items-start gap-3"
                      >
                        <div className="w-7 h-7 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center shrink-0 text-amber-400 mt-0.5">
                          {event.type === 'CREATE' ? <Package className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-white/90 font-medium truncate">{event.message}</p>
                          <p className="text-[9px] text-white/35 font-mono mt-0.5">
                            {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-white/30 space-y-2">
                      <Sparkles className="w-6 h-6 text-amber-400/40" />
                      <p className="text-xs font-mono">Listening for live dispatch events...</p>
                    </div>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveSection('audit_logs')}
                  className="mt-4 w-full rounded-xl bg-white/[0.02] border border-white/5 text-[10px] font-black uppercase tracking-wider text-white/50 hover:text-white"
                >
                  Inspect Full Audit Log
                </Button>
              </Card>
            </div>
          </div>
        );

      case 'disruptions': return <div className="animate-in fade-in duration-300"><CMSDisruptions /></div>;
      case 'attendance': return <div className="animate-in fade-in duration-300"><CMSAttendance /></div>;
      case 'inquiries': return <div className="animate-in fade-in duration-300"><CMSInquiries /></div>;
      case 'reservations': return <div className="animate-in fade-in duration-300"><CMSReservations /></div>;
      case 'bookings': return <div className="animate-in fade-in duration-300"><CMSBookings /></div>;
      case 'revenue': return <div className="animate-in fade-in duration-300"><CMSRevenue /></div>;
      case 'users': return <div className="animate-in fade-in duration-300"><CMSUsers /></div>;
      case 'payments': return <div className="animate-in fade-in duration-300"><CMSPayments /></div>;
      case 'packages': return <div className="animate-in fade-in duration-300"><CMSPackages /></div>;
      case 'hotels': return <div className="animate-in fade-in duration-300"><CMSHotels /></div>;
      case 'cabs': return <div className="animate-in fade-in duration-300"><CMSCabs /></div>;
      case 'reviews': return <div className="animate-in fade-in duration-300"><CMSTestimonials /></div>;
      case 'faqs': return <div className="animate-in fade-in duration-300"><CMSFaqs /></div>;
      case 'media': return <div className="animate-in fade-in duration-300"><MediaLibrary /></div>;
      case 'planner': return <div className="animate-in fade-in duration-300"><CMSJourney /></div>;
      case 'profile': return <div className="animate-in fade-in duration-300"><CMSProfile /></div>;
      case 'content': return <div className="animate-in fade-in duration-300"><CMSSiteContent /></div>;
      case 'page_builder': return <div className="animate-in fade-in duration-300"><CMSPageBuilder /></div>;
      case 'destinations': return <div className="animate-in fade-in duration-300"><CMSDestinations /></div>;
      case 'itinerary_builder': return <div className="animate-in fade-in duration-300"><CMSItineraryBuilder /></div>;
      case 'activities': return <div className="animate-in fade-in duration-300"><CMSActivities /></div>;
      case 'coupons': return <div className="animate-in fade-in duration-300"><CMSCoupons /></div>;
      case 'seo': return <div className="animate-in fade-in duration-300"><CMSSeo /></div>;
      case 'reports': return <div className="animate-in fade-in duration-300"><CMSReports /></div>;
      case 'portal_keys': return <div className="animate-in fade-in duration-300"><CMSPortalKeys /></div>;
      case 'audit_logs': return <div className="animate-in fade-in duration-300"><CMSAuditLogs /></div>;
      case 'settings': return <div className="animate-in fade-in duration-300"><CMSSettings /></div>;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#070b0e] text-slate-100 flex flex-col lg:flex-row font-sans relative overflow-x-hidden selection:bg-amber-500/30 selection:text-amber-200">
      {/* Subtle Ambient Lighting */}
      <div className="fixed top-0 right-1/4 w-[500px] h-[350px] bg-gradient-to-b from-amber-500/10 via-amber-600/5 to-transparent blur-[140px] pointer-events-none z-0" />
      <div className="fixed bottom-0 left-1/3 w-[400px] h-[300px] bg-gradient-to-t from-sky-500/5 via-blue-500/5 to-transparent blur-[140px] pointer-events-none z-0" />

      {/* Upgraded Command HQ Sidebar */}
      <AdminSidebar
        activeSection={activeSection}
        onSectionChange={(section) => {
          setActiveSection(section);
          setIsSidebarOpen(false);
        }}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
      />

      <div className="flex-1 lg:ml-72 flex flex-col min-w-0">
        {/* Mobile Navigation Header */}
        <MobilePortalNav
          title="Curators HQ"
          roleLabel={ROLE_LABELS[teamRole]}
          isOpen={isSidebarOpen}
          onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        />

        {/* Desktop Top Control Header Bar (Clean vertical centering, zero clipping) */}
        <header className="hidden lg:flex items-center justify-between px-6 lg:px-8 h-16 shrink-0 border-b border-white/10 bg-[#070b0e]/95 backdrop-blur-xl sticky top-0 z-40">
          {/* Breadcrumb / Section Indicator */}
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-white/40 text-xs font-medium">Command</span>
            <span className="text-white/20 text-xs">/</span>
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
              <h2 className="text-xs font-bold text-white uppercase tracking-wider truncate">
                {activeSection.replace(/_/g, ' ')}
              </h2>
            </div>

            <button
              type="button"
              onClick={fetchStats}
              disabled={isSyncingStats}
              title="Sync live Neon stats"
              className="ml-2 p-1.5 rounded-lg bg-white/[0.03] border border-white/10 hover:border-amber-400/40 text-white/50 hover:text-amber-300 transition-colors"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', isSyncingStats && 'animate-spin text-amber-400')} />
            </button>
          </div>

          {/* Right Utilities */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Global Command Palette Button */}
            <button
              type="button"
              onClick={() => setCommandPaletteOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-amber-400/40 text-white/60 hover:text-white transition-all text-xs"
            >
              <Search className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden xl:inline font-medium">Command</span>
              <kbd className="font-mono text-[9px] bg-white/10 px-1.5 py-0.5 rounded text-white/50">⌘K</kbd>
            </button>

            {/* Real Measured Gateway Latency Pill */}
            <div
              className={cn(
                'hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-mono uppercase tracking-widest',
                gatewayOnline
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              )}
            >
              <span className={cn('w-1.5 h-1.5 rounded-full animate-pulse', gatewayOnline ? 'bg-emerald-400' : 'bg-rose-400')} />
              <span>{gatewayOnline ? `Live • ${apiLatencyMs ? `${apiLatencyMs}ms` : 'Syncing'}` : 'Offline'}</span>
            </div>

            {/* Multi-OS Portal Switcher */}
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-amber-400/40 hover:bg-white/[0.06] text-white/80 hover:text-white transition-all text-xs font-semibold"
                >
                  <LayoutGrid className="w-3.5 h-3.5 text-amber-400" />
                  <span>OS Portals</span>
                  <ChevronDown className="w-3 h-3 text-white/40" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-[#0a0f14]/98 backdrop-blur-2xl border-white/10 text-white p-1.5 rounded-2xl shadow-2xl z-[80]">
                <DropdownMenuLabel className="px-3 py-2 text-[9px] font-black uppercase tracking-[0.2em] text-amber-300/70">
                  Switch Live OS Portal
                </DropdownMenuLabel>
                <DropdownMenuItem asChild className="cursor-pointer hover:bg-white/10 p-2.5 rounded-xl gap-2.5 text-xs">
                  <Link to="/hospitality" className="flex items-center gap-2.5">
                    <Building className="w-4 h-4 text-amber-400" />
                    <span>Hospitality OS</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer hover:bg-white/10 p-2.5 rounded-xl gap-2.5 text-xs">
                  <Link to="/sales/portal" className="flex items-center gap-2.5">
                    <TrendingUp className="w-4 h-4 text-purple-400" />
                    <span>Sales CRM Desk</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer hover:bg-white/10 p-2.5 rounded-xl gap-2.5 text-xs">
                  <Link to="/agent" className="flex items-center gap-2.5">
                    <Building2 className="w-4 h-4 text-emerald-400" />
                    <span>B2B Agent Hub</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer hover:bg-white/10 p-2.5 rounded-xl gap-2.5 text-xs">
                  <Link to="/driver" className="flex items-center gap-2.5">
                    <Car className="w-4 h-4 text-sky-400" />
                    <span>Driver Cockpit</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10 mx-1" />
                <DropdownMenuItem asChild className="cursor-pointer hover:bg-white/10 p-2.5 rounded-xl gap-2.5 text-xs">
                  <Link to="/" className="flex items-center gap-2.5">
                    <ExternalLink className="w-4 h-4 text-white/60" />
                    <span>Live Public Website</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="w-px h-5 bg-white/10" />

            <NotificationBell />

            <div className="w-px h-5 bg-white/10" />

            {/* Director Profile Dropdown (modal={false} fixes Radix aria-hidden focus warnings) */}
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2.5 py-1 pl-1 pr-2 rounded-xl hover:bg-white/[0.04] transition-all text-left">
                  <div className="w-8 h-8 rounded-lg bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 font-bold text-xs shrink-0">
                    {teamUser?.name ? teamUser.name.charAt(0) : 'Z'}
                  </div>
                  <div className="hidden sm:block leading-tight">
                    <p className="text-xs font-bold text-white leading-none">{teamUser?.name || 'Zahid Riyaz'}</p>
                    <p className="text-[9px] text-amber-400 uppercase tracking-wider font-semibold mt-0.5 leading-none">
                      {ROLE_LABELS[teamRole]}
                    </p>
                  </div>
                  <ChevronDown className="w-3 h-3 text-white/40" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-[#0a0f14]/98 backdrop-blur-2xl border-white/10 text-white p-1.5 rounded-2xl shadow-2xl z-[80]">
                <DropdownMenuLabel className="px-3 py-2 text-[9px] font-black uppercase tracking-[0.2em] text-amber-300/70">
                  Personnel Account
                </DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setActiveSection('profile')} className="cursor-pointer hover:bg-white/10 p-2.5 rounded-xl gap-2.5 text-xs">
                  <UserCheck className="w-4 h-4 text-amber-400" />
                  <span>Executive Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveSection('settings')} className="cursor-pointer hover:bg-white/10 p-2.5 rounded-xl gap-2.5 text-xs">
                  <Settings className="w-4 h-4 text-white/70" />
                  <span>Platform Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10 mx-1" />
                <DropdownMenuItem onClick={teamLogout} className="cursor-pointer hover:bg-red-500/20 text-red-400 p-2.5 rounded-xl gap-2.5 text-xs">
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Content Container with Suspense Code-Splitting */}
        <main className="p-3 sm:p-6 lg:p-8 pt-20 lg:pt-8 pb-28 lg:pb-8 max-w-7xl mx-auto w-full min-w-0">
          <AdminErrorBoundary>
            <Suspense fallback={<ModuleSkeleton />}>
              {renderContent()}
            </Suspense>
          </AdminErrorBoundary>
        </main>

        {/* Unified Mobile Bottom Navigation Dock */}
        <MobilePortalBottomBar
          activeSection={activeSection}
          onSectionChange={(section) => {
            setActiveSection(section);
            setIsSidebarOpen(false);
          }}
          isSidebarOpen={isSidebarOpen}
          onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          unassignedCount={dynamicStats?.unassignedLeads ?? dynamicStats?.activeInquiries ?? 0}
        />
      </div>

      {/* Global Executive Command Palette (Ctrl+K / Cmd+K) */}
      <AdminCommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        onSelectSection={(sec) => setActiveSection(sec)}
        onNavigateRoute={(path) => navigate(path)}
        onRefreshStats={fetchStats}
        onOpenAiCopilot={() => setAiCopilotOpen(true)}
      />

      {/* Compact Floating Real-Time Director AI Ops Copilot */}
      <DirectorAiCopilot
        open={aiCopilotOpen}
        onOpenChange={setAiCopilotOpen}
        dynamicStats={dynamicStats}
        directorName={teamUser?.name || 'Director'}
      />
    </div>
  );
}
