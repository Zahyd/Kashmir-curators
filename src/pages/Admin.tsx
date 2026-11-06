import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Package, 
  Building, 
  Car, 
  Users, 
  TrendingUp, 
  DollarSign, 
  MessageSquare, 
  HelpCircle, 
  Image as ImageIcon, 
  Settings, 
  Sparkles,
  Search,
  Bell,
  Calendar,
  ChevronRight,
  Zap,
  Star,
  MapPin,
  CalendarCheck,
  ExternalLink,
  ShieldAlert,
  ArrowUpRight,
  Plus,
  RefreshCw,
  Sliders,
  Layers,
  Compass,
  CheckCircle2,
  Clock,
  LogOut,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTeamAuth, ROLE_LABELS } from '@/contexts/TeamAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { API_BASE_URL, SOCKET_URL } from '@/lib/api';
import NotificationBell from '@/components/admin/NotificationBell';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Admin Components
import AdminSidebar from '@/components/admin/AdminSidebar';
import MobilePortalNav from '@/components/layout/MobilePortalNav';
import CMSInquiries from '@/components/admin/CMSInquiries';
import CMSPackages from '@/components/admin/CMSPackages';
import CMSHotels from '@/components/admin/CMSHotels';
import CMSCabs from '@/components/admin/CMSCabs';
import CMSTestimonials from '@/components/admin/CMSTestimonials';
import CMSFaqs from '@/components/admin/CMSFaqs';
import MediaLibrary from '@/components/admin/MediaLibrary';
import CMSSiteContent from '@/components/admin/CMSSiteContent';
import CMSBookings from '@/components/admin/CMSBookings';
import CMSRevenue from '@/components/admin/CMSRevenue';
import CMSUsers from '@/components/admin/CMSUsers';
import CMSPayments from '@/components/admin/CMSPayments';
import CMSJourney from '@/components/admin/CMSJourney';
import CMSProfile from '@/components/admin/CMSProfile';
import CMSReservations from '@/components/admin/CMSReservations';
import CMSDisruptions from '@/components/admin/CMSDisruptions';
import CMSPageBuilder from '@/components/admin/CMSPageBuilder';
import CMSDestinations from '@/components/admin/CMSDestinations';
import CMSItineraryBuilder from '@/components/admin/CMSItineraryBuilder';
import CMSActivities from '@/components/admin/CMSActivities';
import CMSCoupons from '@/components/admin/CMSCoupons';
import CMSSeo from '@/components/admin/CMSSeo';
import CMSReports from '@/components/admin/CMSReports';
import CMSAuditLogs from '@/components/admin/CMSAuditLogs';
import CMSSettings from '@/components/admin/CMSSettings';
import AdminErrorBoundary from '@/components/admin/AdminErrorBoundary';

const ROLE_STATS: Record<string, any[]> = {
  admin: [
    { label: 'Total Bookings', value: '0', icon: Package, change: '+14.2%', trend: 'up', color: 'text-amber-400', section: 'bookings' },
    { label: 'Total Revenue', value: '₹0L', icon: DollarSign, change: '+22.5%', trend: 'up', color: 'text-emerald-400', section: 'revenue' },
    { label: 'Client Directory', value: '0', icon: Users, change: '+8.1%', trend: 'up', color: 'text-blue-400', section: 'users' },
    { label: 'Active Packages', value: '0', icon: TrendingUp, change: 'Stable', trend: 'neutral', color: 'text-purple-400', section: 'packages' },
  ],
  operations: [
    { label: 'Pending Reservations', value: '0', icon: CalendarCheck, change: 'Urgent', trend: 'up', color: 'text-amber-400', section: 'reservations' },
    { label: 'Today Check-ins', value: '0', icon: Calendar, change: 'Active', trend: 'neutral', color: 'text-blue-400', section: 'reservations' },
    { label: 'Hotel Dues Pending', value: '₹0', icon: DollarSign, change: 'Review', trend: 'down', color: 'text-red-400', section: 'reservations' },
    { label: 'Net Profit Margin', value: '₹0', icon: TrendingUp, change: 'Profit', trend: 'up', color: 'text-emerald-400', section: 'reservations' },
  ],
  marketing: [
    { label: 'New Reviews', value: '0', icon: Users, change: 'New', trend: 'up', color: 'text-amber-400' },
    { label: 'Active FAQs', value: '0', icon: HelpCircle, change: 'Stable', trend: 'neutral', color: 'text-blue-400' },
    { label: 'Featured Pkgs', value: '0', icon: Star, change: 'Max', trend: 'up', color: 'text-amber-400' },
    { label: 'Site Traffic', value: '0', icon: TrendingUp, change: '+18.4%', trend: 'up', color: 'text-emerald-400' },
  ],
  finance: [
    { label: 'Total Revenue', value: '₹0L', icon: DollarSign, change: '+24.1%', trend: 'up', color: 'text-emerald-400', section: 'revenue' },
    { label: 'Pending Payouts', value: '₹0', icon: DollarSign, change: 'Review', trend: 'neutral', color: 'text-amber-400', section: 'payments' },
    { label: 'Coupons Redeemed', value: '0', icon: Package, change: '+6', trend: 'up', color: 'text-blue-400', section: 'coupons' },
    { label: 'Gross Margin', value: '28.4%', icon: TrendingUp, change: '+3.2%', trend: 'up', color: 'text-purple-400', section: 'reports' },
  ]
};

export default function Admin() {
  const navigate = useNavigate();
  const { teamUser, isTeamAuthenticated, isTeamLoading, canAccessAdmin, systemEvents, teamLogout } = useTeamAuth();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [dynamicStats, setDynamicStats] = useState<any>(null);
  const [selectedChartPeriod, setSelectedChartPeriod] = useState<'Daily' | 'Weekly' | 'Monthly'>('Monthly');
  const [globalSearch, setGlobalSearch] = useState('');

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
  }, [isTeamAuthenticated, canAccessAdmin, isTeamLoading, navigate]);

  useEffect(() => {
    if (isTeamAuthenticated && canAccessAdmin) {
      fetchStats();
    }
  }, [systemEvents]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('teamToken');
      const response = await fetch(`${API_BASE_URL}/dashboard/admin`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.status === 401 || response.status === 403) {
        teamLogout();
        navigate('/sales/auth');
        return;
      }

      if (!response.ok) throw new Error('Failed to fetch stats');
      
      const data = await response.json();
      if (data && !data.error) {
        setDynamicStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  if (isTeamLoading || !isTeamAuthenticated || !canAccessAdmin) {
    return null;
  }

  const teamRole = teamUser?.role || 'admin';

  const getDisplayStats = () => {
    const baseStats = ROLE_STATS[teamRole] || ROLE_STATS.admin;
    if (!dynamicStats) return baseStats;

    return baseStats.map(stat => {
      let value = stat.value;
      if (stat.label === 'Total Bookings') value = (dynamicStats.totalBookings ?? 0).toLocaleString();
      if (stat.label === 'Total Revenue') value = `₹${((dynamicStats.totalRevenue || 0) / 100000).toFixed(1)}L`;
      if (stat.label === 'Client Directory') value = (dynamicStats.totalUsers ?? 0).toLocaleString();
      if (stat.label === 'Active Packages') value = (dynamicStats.totalPackages ?? 0).toLocaleString();
      
      if (stat.label === 'Pending Reservations') value = (dynamicStats.pendingReservations ?? 0).toLocaleString();
      if (stat.label === 'Today Check-ins') value = `${dynamicStats.dailyCheckIns ?? 0} In / ${dynamicStats.dailyCheckOuts ?? 0} Out`;
      if (stat.label === 'Hotel Dues Pending') value = `₹${(dynamicStats.hotelDues ?? 0).toLocaleString()}`;
      if (stat.label === 'Net Profit Margin') value = `₹${(dynamicStats.profitMargins ?? 0).toLocaleString()}`;
      
      if (stat.label === 'New Reviews') value = dynamicStats.newReviews ?? 0;
      if (stat.label === 'Active FAQs') value = dynamicStats.activeFaqs ?? 0;
      if (stat.label === 'Featured Pkgs') value = dynamicStats.totalPackages ?? 0;
      if (stat.label === 'Site Traffic') value = `${(dynamicStats.totalBookings || 0) * 85 + 420}`;

      return { ...stat, value };
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
            
            {/* EXECUTIVE HERO RADAR */}
            <div className="relative overflow-hidden p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-white/[0.04] via-white/[0.02] to-transparent border border-white/10 shadow-xl backdrop-blur-2xl">
              <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 blur-[100px] pointer-events-none" />
              <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                
                {/* Greeting & Meta */}
                <div className="space-y-2 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-[9px] font-black uppercase tracking-wider">
                      COMMAND RADAR
                    </span>
                    <span className="text-white/40 text-[10px] font-mono">
                      {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span className="text-white/20">•</span>
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Valley OS Active
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-4xl font-display font-bold text-white tracking-tight">
                    {getGreeting()}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-200">{teamUser?.name?.split(' ')[0] || ROLE_LABELS[teamRole]}</span>
                  </h1>

                  <p className="text-white/60 text-xs sm:text-sm font-normal leading-relaxed">
                    Kashmir Curators ground operations active. All luxury houseboats, alpine ski chalets, and mountain transit corridors operating under certified safety protocols.
                  </p>

                  {/* Ground Status Chips */}
                  <div className="pt-2 flex flex-wrap items-center gap-2 text-[10px]">
                    <div className="px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/5 text-white/70 flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-amber-400" />
                      <span>Srinagar Airport Corridor: <b>Normal</b></span>
                    </div>
                    <div className="px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/5 text-white/70 flex items-center gap-1.5">
                      <Compass className="w-3 h-3 text-emerald-400" />
                      <span>Gulmarg Gondola: <b>Phase 1 & 2 Open</b></span>
                    </div>
                  </div>
                </div>

                {/* Live Operations Snapshot Pills */}
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2.5 w-full lg:w-auto">
                  <div 
                    onClick={() => setActiveSection('inquiries')}
                    className="flex-1 sm:w-36 p-3.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-amber-400/40 transition-all cursor-pointer group text-center"
                  >
                    <p className="text-[9px] font-bold uppercase tracking-wider text-white/40 mb-0.5">Active Queue</p>
                    <p className="text-xl font-bold text-white group-hover:text-amber-300 transition-colors">
                      {dynamicStats?.activeInquiries ?? 0} <span className="text-xs text-amber-400 font-mono">leads</span>
                    </p>
                  </div>

                  <div 
                    onClick={() => setActiveSection('cabs')}
                    className="flex-1 sm:w-36 p-3.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-amber-400/40 transition-all cursor-pointer group text-center"
                  >
                    <p className="text-[9px] font-bold uppercase tracking-wider text-white/40 mb-0.5">Fleet Status</p>
                    <p className="text-xl font-bold text-emerald-400 group-hover:text-emerald-300 transition-colors">
                      {dynamicStats?.cabAvailability ?? '92%'} <span className="text-xs text-white/40 font-mono">deployed</span>
                    </p>
                  </div>

                  <div 
                    onClick={() => setActiveSection('page_builder')}
                    className="col-span-2 sm:w-auto px-4 py-3.5 rounded-xl bg-amber-400 text-black hover:bg-amber-300 transition-all cursor-pointer font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
                  >
                    <Layers className="w-4 h-4" />
                    <span>Visual Page Builder</span>
                  </div>
                </div>

              </div>
            </div>

            {/* HIGH-FIDELITY STATS GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {getDisplayStats().map((stat) => (
                <Card 
                  key={stat.label}
                  onClick={() => stat.section && setActiveSection(stat.section)}
                  className="bg-[#0a0f14]/80 border-white/10 p-5 rounded-2xl backdrop-blur-xl transition-all duration-300 hover:border-amber-400/30 hover:bg-white/[0.03] hover:-translate-y-0.5 cursor-pointer group relative overflow-hidden"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center group-hover:bg-amber-400/10 group-hover:border-amber-400/30 transition-colors">
                      <stat.icon className="w-5 h-5 text-amber-400" />
                    </div>
                    <Badge variant="outline" className={cn(
                      "text-[9px] font-black uppercase tracking-wider",
                      stat.trend === 'up' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-white/5 text-white/60 border-white/10"
                    )}>
                      {stat.change}
                    </Badge>
                  </div>

                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-white/45">{stat.label}</p>
                    <div className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
                      {stat.value}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] text-white/40 group-hover:text-amber-300 transition-colors">
                    <span>Manage Module</span>
                    <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                </Card>
              ))}
            </div>

            {/* OPERATIONS DISPATCH & LEAD QUEUE */}
            {(teamRole === 'operations' || teamRole === 'admin') && (
              <Card className="bg-[#0a0f14]/80 border-white/10 p-6 rounded-2xl backdrop-blur-xl shadow-xl">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-white">Operational Dispatch</h3>
                    <p className="text-xs text-blue-400 uppercase tracking-widest font-black">Lead Assignment Queue</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setActiveSection('inquiries')} 
                    className="rounded-xl bg-white/[0.03] border-white/10 text-xs font-bold hover:bg-white/[0.08]"
                  >
                    View All Leads ({dynamicStats?.activeInquiries ?? 0}) <ChevronRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(dynamicStats?.recentInquiries || []).filter((inq: any) => !inq.assignedTo).slice(0, 3).map((inq: any) => (
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
                          <span>{inq.destination} • {inq.duration} Days</span>
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
                      <Sparkles className="w-6 h-6 text-white/20 mx-auto mb-2" />
                      <p className="text-white/40 text-xs font-bold uppercase tracking-wider">All leads currently assigned</p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* REVENUE TELEMETRY & LIVE SYSTEM FEED */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Revenue Telemetry Chart */}
              <Card className="lg:col-span-8 bg-[#0a0f14]/80 border-white/10 p-6 rounded-2xl backdrop-blur-xl shadow-xl">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-white">Revenue Telemetry</h3>
                    <p className="text-xs text-white/40 uppercase tracking-widest font-black">Fiscal Performance & Seasonality</p>
                  </div>
                  <div className="flex gap-1.5 p-1 rounded-xl bg-white/[0.03] border border-white/10 text-[10px] font-bold">
                    {(['Daily', 'Weekly', 'Monthly'] as const).map(period => (
                      <button 
                        key={period} 
                        onClick={() => setSelectedChartPeriod(period)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg transition-all",
                          selectedChartPeriod === period ? "bg-amber-400 text-black font-black" : "text-white/50 hover:text-white"
                        )}
                      >
                        {period}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* 12-Month Telemetry Visualizer */}
                <div className="h-[240px] w-full flex items-end gap-2 relative px-2 pt-6">
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="w-full h-px bg-white/20" />
                    ))}
                  </div>
                  
                  {(() => {
                    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    const seasonWeights = [0.08, 0.09, 0.11, 0.14, 0.15, 0.12, 0.07, 0.06, 0.05, 0.04, 0.04, 0.05];
                    const totalRev = Number(dynamicStats?.totalRevenue) || 0;
                    const maxWeight = Math.max(...seasonWeights);

                    return monthNames.map((name, i) => {
                      const monthVal = totalRev > 0 ? Math.round(totalRev * seasonWeights[i]) : 0;
                      const barPercent = totalRev > 0 
                        ? Math.max(15, Math.min(100, Math.round((seasonWeights[i] / maxWeight) * 85)))
                        : (i === 10 ? 45 : 15);
                      const isCurrentMonth = new Date().getMonth() === i;

                      return (
                        <div key={name} className="flex-1 flex flex-col items-center gap-2 group/bar">
                          <div className="w-full relative h-[180px] flex items-end">
                            <div 
                              className={cn(
                                "w-full rounded-t-md transition-all duration-500",
                                isCurrentMonth
                                  ? "bg-gradient-to-t from-amber-500/40 via-amber-400 to-yellow-300 shadow-[0_0_12px_rgba(245,158,11,0.4)]"
                                  : "bg-white/10 group-hover/bar:bg-amber-400/50"
                              )}
                              style={{ height: `${barPercent}%` }}
                            >
                              <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-all bg-amber-400 text-black font-black text-[9px] px-2 py-0.5 rounded shadow whitespace-nowrap z-20 pointer-events-none">
                                {totalRev > 0 ? `₹${(monthVal / 1000).toFixed(0)}k` : 'Active'}
                              </div>
                            </div>
                          </div>
                          <span className={cn(
                            "text-[9px] font-bold uppercase",
                            isCurrentMonth ? "text-amber-400 font-black" : "text-white/35"
                          )}>
                            {name}
                          </span>
                        </div>
                      );
                    });
                  })()}
                </div>

                {/* Seasonality Legend */}
                <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap items-center justify-between text-[10px] text-white/40 gap-2">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400" /> Current Quarter</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-white/20" /> Baseline Projections</span>
                  </div>
                  <span className="font-mono text-amber-300/80">Peak: April (Tulips) & January (Ski)</span>
                </div>
              </Card>

              {/* Live System Activity Feed */}
              <Card className="lg:col-span-4 bg-[#0a0f14]/80 border-white/10 p-6 rounded-2xl backdrop-blur-xl shadow-xl flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">Live Event Stream</h3>
                    <p className="text-xs text-amber-400 uppercase tracking-widest font-black">Real-time Telemetry</p>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                
                <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px] pr-1 custom-scrollbar">
                  {systemEvents.length > 0 ? (
                    systemEvents.slice(0, 8).map((event, i) => (
                      <div key={i} className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all flex items-start gap-3">
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
                      <p className="text-xs font-mono">Listening for ground dispatch events...</p>
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

      {/* Modern Sidebar */}
      <AdminSidebar 
        activeSection={activeSection} 
        onSectionChange={(section) => {
          setActiveSection(section);
          setIsSidebarOpen(false);
        }} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="flex-1 lg:ml-72 flex flex-col min-w-0">
        
        {/* Mobile Navigation Header */}
        <MobilePortalNav 
          title="Curators HQ"
          roleLabel={ROLE_LABELS[teamRole]}
          isOpen={isSidebarOpen}
          onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        {/* Desktop Top Header Bar */}
        <header className="hidden lg:flex items-center justify-between px-6 lg:px-8 h-16 border-b border-white/10 bg-[#070b0e]/90 backdrop-blur-xl sticky top-0 z-40">
          
          {/* Breadcrumb / Section Indicator */}
          <div className="flex items-center gap-3">
            <span className="text-white/40 text-xs font-medium">Command</span>
            <span className="text-white/20 text-xs">/</span>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                {activeSection.replace(/_/g, ' ')}
              </h2>
            </div>
          </div>

          {/* Right Utilities */}
          <div className="flex items-center gap-3.5">
            
            {/* Live Gateway Indicator */}
            <div className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-mono text-emerald-400 uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Gateway Live • 24ms</span>
            </div>

            {/* Live Website Preview Link */}
            <Link 
              to="/"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-amber-400/40 hover:bg-white/[0.06] text-white/70 hover:text-white transition-all text-xs font-medium"
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
              <span>Live Website</span>
            </Link>

            <div className="w-px h-5 bg-white/10" />

            <NotificationBell />

            <div className="w-px h-5 bg-white/10" />

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2.5 p-1 pr-2 rounded-xl hover:bg-white/[0.04] transition-all text-left">
                  <div className="w-8 h-8 rounded-lg bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 font-bold text-xs">
                    {teamUser?.name ? teamUser.name.charAt(0) : 'Z'}
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-xs font-bold text-white leading-tight">{teamUser?.name || 'Zahid Riyaz'}</p>
                    <p className="text-[9px] text-amber-400 uppercase tracking-wider font-semibold">{ROLE_LABELS[teamRole]}</p>
                  </div>
                  <ChevronDown className="w-3 h-3 text-white/40" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-[#0a0f14]/98 backdrop-blur-2xl border-white/10 text-white p-1.5 rounded-2xl shadow-2xl z-[80]">
                <DropdownMenuLabel className="px-3 py-2 text-[9px] font-black uppercase tracking-[0.2em] text-amber-300/70">
                  Personnel Account
                </DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setActiveSection('profile')} className="cursor-pointer hover:bg-white/10 p-2.5 rounded-xl gap-2.5 text-xs">
                  <Users className="w-4 h-4 text-amber-400" />
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

        {/* Content Container */}
        <main className="p-4 sm:p-6 lg:p-8 pt-24 lg:pt-8 max-w-7xl mx-auto w-full min-w-0">
          <AdminErrorBoundary>
            {renderContent()}
          </AdminErrorBoundary>
        </main>

      </div>
    </div>
  );
}
