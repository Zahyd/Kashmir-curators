import { useState, useEffect } from 'react';
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
  CalendarCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTeamAuth, ROLE_LABELS } from '@/contexts/TeamAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { API_BASE_URL } from '@/lib/api';
import NotificationBell from '@/components/admin/NotificationBell';


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
    { label: 'Total Bookings', value: '0', icon: Package, change: '0%', color: 'text-blue-400', section: 'bookings' },
    { label: 'Total Revenue', value: '₹0L', icon: DollarSign, change: '0%', color: 'text-green-400', section: 'revenue' },
    { label: 'Total Users', value: '0', icon: Users, change: '0%', color: 'text-purple-400', section: 'users' },
    { label: 'Packages Sold', value: '0', icon: TrendingUp, change: '0%', color: 'text-kashmir-gold', section: 'packages' },
  ],
  operations: [
    { label: 'Pending Reservations', value: '0', icon: CalendarCheck, change: 'Urgent', color: 'text-amber-400', section: 'reservations' },
    { label: 'Today Check-ins', value: '0', icon: Calendar, change: 'Today', color: 'text-blue-400', section: 'reservations' },
    { label: 'Hotel Dues Pending', value: '₹0', icon: DollarSign, change: 'Finance', color: 'text-red-400', section: 'reservations' },
    { label: 'Net Profit Margin', value: '₹0', icon: TrendingUp, change: 'Profit', color: 'text-emerald-400', section: 'reservations' },
  ],
  marketing: [
    { label: 'New Reviews', value: '0', icon: Users, change: '0', color: 'text-kashmir-gold' },
    { label: 'Active FAQs', value: '0', icon: HelpCircle, change: 'Stable', color: 'text-blue-400' },
    { label: 'Featured Pkgs', value: '0', icon: Star, change: 'Max', color: 'text-amber-400' },
    { label: 'Site Traffic', value: '0', icon: TrendingUp, change: '0%', color: 'text-emerald-400' },
  ],
  sales: [
    { label: 'Leads Received', value: '0', icon: Zap, change: '0', color: 'text-kashmir-gold' },
    { label: 'Conversion Rate', value: '0%', icon: TrendingUp, change: '0%', color: 'text-emerald-400' },
    { label: 'Active Quotes', value: '0', icon: MessageSquare, change: '0', color: 'text-blue-400' },
    { label: 'Target Progress', value: '0%', icon: DollarSign, change: '0%', color: 'text-purple-400' },
  ]
};

export default function Admin() {
  const navigate = useNavigate();
  const { teamUser, isTeamAuthenticated, isTeamLoading, canAccessAdmin, systemEvents, teamLogout } = useTeamAuth();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [dynamicStats, setDynamicStats] = useState<any>(null);

  useEffect(() => {
    if (!isTeamLoading) {
      if (!isTeamAuthenticated) {
        navigate('/sales/auth');
      } else if (!canAccessAdmin) {
        // Sales users go to sales portal
        navigate('/sales/portal');
      } else {
        fetchStats();
      }
    }
  }, [isTeamAuthenticated, canAccessAdmin, isTeamLoading, navigate]);

  // Refresh stats when system events occur
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
      
      // Super solid dynamic handling for expired/invalid tokens
      if (response.status === 401 || response.status === 403) {
        teamLogout();
        navigate('/sales/auth');
        return;
      }

      if (!response.ok) throw new Error('Failed to fetch');
      
      const data = await response.json();
      // Only set if we actually got stats, not an error object
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
      // Admin/Ops
      if (stat.label === 'Total Bookings') value = (dynamicStats.totalBookings ?? 0).toLocaleString();
      if (stat.label === 'Total Revenue') value = `₹${((dynamicStats.totalRevenue || 0) / 100000).toFixed(1)}L`;
      if (stat.label === 'Total Users') value = (dynamicStats.totalUsers ?? 0).toLocaleString();
      if (stat.label === 'Packages Sold') value = (dynamicStats.totalPackages ?? 0).toLocaleString();
      
      if (stat.label === 'Active Inquiries') value = dynamicStats.activeInquiries ?? 0;
      if (stat.label === 'Pending Bookings') value = dynamicStats.pendingBookings ?? 0;
      if (stat.label === 'Hotel Nodes') value = dynamicStats.hotelNodes ?? 0;
      
      // B2B Operations
      if (stat.label === 'Pending Reservations') value = (dynamicStats.pendingReservations ?? 0).toLocaleString();
      if (stat.label === 'Today Check-ins') value = `${dynamicStats.dailyCheckIns ?? 0} In / ${dynamicStats.dailyCheckOuts ?? 0} Out`;
      if (stat.label === 'Hotel Dues Pending') value = `₹${(dynamicStats.hotelDues ?? 0).toLocaleString()}`;
      if (stat.label === 'Net Profit Margin') value = `₹${(dynamicStats.profitMargins ?? 0).toLocaleString()}`;
      
      // Marketing
      if (stat.label === 'New Reviews') value = dynamicStats.newReviews ?? 0;
      if (stat.label === 'Active FAQs') value = dynamicStats.activeFaqs ?? 0;
      if (stat.label === 'Featured Pkgs') value = dynamicStats.totalPackages ?? 0;

      // Sales
      if (stat.label === 'Leads Received') value = dynamicStats.leadsReceived ?? dynamicStats.activeInquiries ?? 0;
      if (stat.label === 'Conversion Rate') value = dynamicStats.conversionRate ?? '0%';
      if (stat.label === 'Active Quotes') value = dynamicStats.activeQuotes ?? 0;
      if (stat.label === 'Target Progress') value = dynamicStats.targetProgress ?? '0%';

      return { ...stat, value };
    });
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            {/* Header Intelligence */}
            <div className="relative overflow-hidden p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-amber-500/10 via-white/[0.02] to-transparent border border-amber-400/20 shadow-2xl backdrop-blur-2xl">
              <div className="absolute top-0 right-0 w-72 h-72 bg-amber-400/10 blur-[90px] -mr-32 -mt-32 pointer-events-none" />
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Valley Operations Telemetry 2026</span>
                  </div>
                  <h1 className="text-3xl sm:text-5xl font-display font-black text-white leading-tight uppercase tracking-tight">
                    Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500">{ROLE_LABELS[teamRole]}</span>
                  </h1>
                  <p className="text-white/60 text-xs sm:text-sm max-w-xl font-medium leading-relaxed">
                    Kashmir Curators ground telemetry active. All luxury houseboats, alpine ski chalets, and 4x4 mountain transit corridors are operating under certified protocols.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3 self-stretch sm:self-auto">
                  <div className="flex-1 sm:flex-initial text-center p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl min-w-[130px]">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-white/40 mb-1">Active Pipeline</p>
                    <p className="text-2xl font-display font-black text-white">{dynamicStats?.activeInquiries ?? 0}<span className="text-amber-400 text-xs ml-1">leads</span></p>
                  </div>
                  <div className="flex-1 sm:flex-initial text-center p-5 rounded-2xl bg-amber-400/10 border border-amber-400/25 backdrop-blur-xl min-w-[130px]">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-amber-300 mb-1">Fleet Status</p>
                    <p className="text-2xl font-display font-black text-amber-400">{dynamicStats?.cabAvailability ?? 'Active'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid - High Fidelity */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {getDisplayStats().map((stat, idx) => (
                <Card key={stat.label} className="bg-[#0a0f14]/85 bg-white/[0.02] border border-white/10 p-8 rounded-[2.5rem] backdrop-blur-xl relative overflow-hidden transition-all duration-500 hover:border-amber-400/40 hover:shadow-2xl hover:shadow-amber-500/10 hover:-translate-y-1 group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-kashmir-gold/5 blur-[40px] -mr-12 -mt-12 transition-all group-hover:bg-kashmir-gold/20" />
                  
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-kashmir-gold/10 group-hover:border-kashmir-gold/20 transition-all duration-500">
                      <stat.icon className="h-6 w-6 text-kashmir-gold" />
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-1">Growth Matrix</p>
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] font-black">
                        {stat.change}
                      </Badge>
                    </div>
                  </div>
                  
                   <div className="space-y-1">
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-200/70">{stat.label}</p>
                    <div className="text-4xl font-display font-black text-white">{stat.value}</div>
                  </div>

                  <Button 
                    variant="ghost" 
                    onClick={() => stat.section && setActiveSection(stat.section)}
                    className="mt-6 w-full pt-6 border-t border-white/10 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-white/50 hover:text-amber-300 transition-colors"
                  >
                    <span>View Analytics</span>
                    <TrendingUp className="w-3 h-3 text-emerald-400" />
                  </Button>
                </Card>
              ))}
            </div>

            {/* Analytics & Performance Hub */}
            {/* Role-Specific Operation Center */}
            {(teamRole === 'operations' || teamRole === 'admin') && (
              <Card className="bg-[#0a0f14]/85 bg-white/[0.02] border border-white/10 p-10 rounded-[3rem] backdrop-blur-xl relative overflow-hidden shadow-2xl group">
                <div className="flex justify-between items-center mb-10">
                  <div>
                    <h3 className="text-2xl font-display font-bold text-white mb-1">Operational Dispatch</h3>
                    <p className="text-xs text-blue-400 uppercase tracking-[0.2em] font-black">Lead Assignment Queue</p>
                  </div>
                  <Button variant="outline" onClick={() => setActiveSection('inquiries')} className="rounded-xl bg-white/5 border-white/5 text-[10px] font-black uppercase tracking-widest px-6 h-12">
                    View Full Queue <ChevronRight className="w-3 h-3 ml-2" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(dynamicStats?.recentInquiries || []).filter((inq: any) => !inq.assignedTo).slice(0, 3).map((inq: any) => (
                    <div key={inq.id} className="p-6 rounded-[2rem] bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-all group/inq">
                      <div className="flex justify-between items-start mb-4">
                        <Badge className="bg-blue-500/10 text-blue-400 border-none px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">Unassigned</Badge>
                        <span className="text-[9px] font-bold text-white/20">{new Date(inq.createdAt).toLocaleDateString()}</span>
                      </div>
                      <h4 className="text-lg font-bold text-white mb-1 group-hover/inq:text-kashmir-gold transition-colors">{inq.customerName}</h4>
                      <p className="text-xs text-white/40 mb-6 flex items-center gap-2"><MapPin className="w-3 h-3 text-kashmir-gold" /> {inq.destination} • {inq.duration} Days</p>
                      <Button 
                        onClick={() => setActiveSection('inquiries')}
                        className="w-full rounded-xl bg-white/5 border border-white/10 text-white hover:bg-kashmir-gold hover:text-black transition-all font-black text-[10px] uppercase tracking-widest h-12"
                      >
                        Assign Agent
                      </Button>
                    </div>
                  ))}
                  {(dynamicStats?.recentInquiries || []).filter((inq: any) => !inq.assignedTo).length === 0 && (
                    <div className="col-span-full py-12 text-center bg-white/[0.01] border border-dashed border-white/5 rounded-[2rem]">
                      <Sparkles className="w-8 h-8 text-white/10 mx-auto mb-4" />
                      <p className="text-white/20 text-xs font-black uppercase tracking-widest">No unassigned leads in queue</p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Revenue Intelligence Chart Placeholder */}
              <Card className="lg:col-span-8 bg-[#0a0f14]/85 bg-white/[0.02] border border-white/10 p-10 rounded-[3rem] backdrop-blur-xl relative overflow-hidden shadow-2xl group">
                <div className="flex justify-between items-center mb-10">
                  <div>
                    <h3 className="text-2xl font-display font-bold text-white mb-1">Revenue Intelligence</h3>
                    <p className="text-xs text-white/30 uppercase tracking-[0.2em] font-black">Fiscal Performance Overview</p>
                  </div>
                  <div className="flex gap-2">
                    {['Daily', 'Weekly', 'Monthly'].map(period => (
                      <button key={period} className="px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white/5 border border-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all">
                        {period}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="h-[320px] w-full flex items-end gap-3 relative px-4">
                  {/* Decorative Chart Elements */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="w-full h-px bg-white/[0.04]" />
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
                        ? Math.max(15, Math.min(100, Math.round((seasonWeights[i] / maxWeight) * 90)))
                        : 8;
                      const isCurrentMonth = new Date().getMonth() === i;

                      return (
                        <div key={name} className="flex-1 flex flex-col items-center gap-4 group/bar">
                          <div className="w-full relative h-[250px] flex items-end">
                            <div 
                              className={cn(
                                "w-full rounded-t-xl transition-all duration-700 shadow-lg",
                                isCurrentMonth
                                  ? "bg-gradient-to-t from-amber-500/30 to-amber-400 shadow-amber-400/20"
                                  : "bg-gradient-to-t from-kashmir-gold/10 to-kashmir-gold/30 group-hover/bar:to-kashmir-gold"
                              )}
                              style={{ height: `${barPercent}%` }}
                            >
                              <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-all bg-kashmir-gold text-black font-black text-[9px] px-2.5 py-1 rounded shadow-xl whitespace-nowrap z-20">
                                {totalRev > 0 ? `₹${(monthVal / 1000).toFixed(1)}k` : '₹0'}
                              </div>
                            </div>
                          </div>
                          <span className={cn(
                            "text-[9px] font-black uppercase tracking-wider",
                            isCurrentMonth ? "text-kashmir-gold" : "text-white/30"
                          )}>
                            {name}
                          </span>
                        </div>
                      );
                    });
                  })()}
                </div>
              </Card>

              {/* System Event Feed */}
              <Card className="lg:col-span-4 bg-[#0a0f14]/85 bg-white/[0.02] border border-white/10 p-10 rounded-[3rem] backdrop-blur-xl flex flex-col relative overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between mb-10">
                  <div>
                    <h3 className="text-2xl font-display font-bold text-white mb-1">System Feed</h3>
                    <p className="text-xs text-kashmir-gold uppercase tracking-[0.2em] font-black">Live Operations</p>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                </div>
                
                <div className="space-y-8 flex-1 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
                  {systemEvents.length > 0 ? (
                    systemEvents.map((event, i) => (
                      <div key={i} className="flex gap-5 group/event animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover/event:bg-white/10 transition-all duration-300">
                          {event.type === 'CREATE' ? (
                            <Package className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <TrendingUp className="w-5 h-5 text-blue-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 pt-1">
                          <p className="text-sm font-bold text-white group-hover/event:text-kashmir-gold transition-colors">{event.message}</p>
                          <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold mt-1">
                            {new Date(event.timestamp).toLocaleTimeString()} • {event.type}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-white/10 mt-2" />
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-30">
                      <Sparkles className="w-12 h-12 text-kashmir-gold/50" />
                      <p className="text-xs uppercase tracking-[0.2em] font-black">Awaiting System Events...</p>
                    </div>
                  )}
                </div>

                <Button 
                  variant="ghost" 
                  onClick={() => setActiveSection('audit_logs')}
                  className="mt-10 w-full rounded-2xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-[0.3em] text-white/30 hover:text-white hover:bg-white/10"
                >
                  Full Audit Log
                </Button>
              </Card>
            </div>
          </div>
        );
      case 'disruptions': return <div className="animate-in fade-in duration-500"><CMSDisruptions /></div>;
      case 'inquiries': return <div className="animate-in fade-in duration-500"><CMSInquiries /></div>;
      case 'reservations': return <div className="animate-in fade-in duration-500"><CMSReservations /></div>;
      case 'bookings': return <div className="animate-in fade-in duration-500"><CMSBookings /></div>;
      case 'revenue': return <div className="animate-in fade-in duration-500"><CMSRevenue /></div>;
      case 'users': return <div className="animate-in fade-in duration-500"><CMSUsers /></div>;
      case 'payments': return <div className="animate-in fade-in duration-500"><CMSPayments /></div>;
      case 'packages': return <div className="animate-in fade-in duration-500"><CMSPackages /></div>;
      case 'hotels': return <div className="animate-in fade-in duration-500"><CMSHotels /></div>;
      case 'cabs': return <div className="animate-in fade-in duration-500"><CMSCabs /></div>;
      case 'reviews': return <div className="animate-in fade-in duration-500"><CMSTestimonials /></div>;
      case 'faqs': return <div className="animate-in fade-in duration-500"><CMSFaqs /></div>;
      case 'media': return <div className="animate-in fade-in duration-500"><MediaLibrary /></div>;
      case 'planner': return <div className="animate-in fade-in duration-500"><CMSJourney /></div>;
      case 'profile': return <div className="animate-in fade-in duration-500"><CMSProfile /></div>;
      case 'content': return <div className="animate-in fade-in duration-500"><CMSSiteContent /></div>;
      case 'page_builder': return <div className="animate-in fade-in duration-500"><CMSPageBuilder /></div>;
      case 'destinations': return <div className="animate-in fade-in duration-500"><CMSDestinations /></div>;
      case 'itinerary_builder': return <div className="animate-in fade-in duration-500"><CMSItineraryBuilder /></div>;
      case 'activities': return <div className="animate-in fade-in duration-500"><CMSActivities /></div>;
      case 'coupons': return <div className="animate-in fade-in duration-500"><CMSCoupons /></div>;
      case 'seo': return <div className="animate-in fade-in duration-500"><CMSSeo /></div>;
      case 'reports': return <div className="animate-in fade-in duration-500"><CMSReports /></div>;
      case 'audit_logs': return <div className="animate-in fade-in duration-500"><CMSAuditLogs /></div>;
      case 'settings': return <div className="animate-in fade-in duration-500"><CMSSettings /></div>;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#070b0e] text-slate-100 flex flex-col lg:flex-row font-sans relative overflow-x-hidden selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Ambient Glows */}
      <div className="fixed top-0 right-1/4 w-[650px] h-[400px] bg-gradient-to-b from-amber-500/10 via-amber-600/5 to-transparent blur-[140px] pointer-events-none z-0" />
      <div className="fixed bottom-0 left-1/3 w-[500px] h-[350px] bg-gradient-to-t from-sky-500/5 via-blue-500/5 to-transparent blur-[140px] pointer-events-none z-0" />
      <AdminSidebar 
        activeSection={activeSection} 
        onSectionChange={(section) => {
          setActiveSection(section);
          setIsSidebarOpen(false);
        }} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="flex-1 lg:ml-72 flex flex-col">
        <MobilePortalNav 
          title="Kashmir Director"
          roleLabel={ROLE_LABELS[teamRole]}
          isOpen={isSidebarOpen}
          onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        {/* Top Header Bar for Desktop */}
        <header className="hidden lg:flex items-center justify-between px-8 lg:px-12 h-20 border-b border-white/10 bg-[#070b0e]/85 backdrop-blur-2xl sticky top-0 z-40 shadow-xl shadow-black/40">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/[0.04] border border-amber-500/25 shadow-inner backdrop-blur-xl">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shadow-[0_0_10px_rgba(251,191,36,0.9)]" />
              <h2 className="text-xs font-black uppercase tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-300">
                {activeSection === 'dashboard' ? 'Executive Command Deck' : `${activeSection.replace('_', ' ')} Command`}
              </h2>
            </div>
            <div className="hidden xl:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black text-emerald-400 uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>REAL-TIME DISPATCH ACTIVE</span>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <Link 
              to="/"
              className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 hover:border-amber-400/40 hover:bg-white/[0.08] text-white/70 hover:text-white transition-all text-xs font-bold"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Live Website</span>
            </Link>
            <div className="w-px h-6 bg-white/10 hidden md:block" />
            <NotificationBell />
            <div className="w-px h-6 bg-white/10" />
            <div 
              onClick={() => setActiveSection('profile')}
              className="flex items-center gap-3.5 p-1.5 pr-3 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-amber-400/30 transition-all cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-400/30 flex items-center justify-center overflow-hidden shrink-0">
                {teamUser?.image ? (
                  <img src={teamUser.image} alt={teamUser.name} className="w-full h-full object-cover" />
                ) : (
                  <Users className="w-4 h-4 text-amber-400" />
                )}
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-white uppercase tracking-wider group-hover:text-amber-300 transition-colors">{teamUser?.name}</p>
                <p className="text-[8px] text-amber-400 font-black uppercase tracking-widest mt-0.5">{ROLE_LABELS[teamRole]}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="p-6 lg:p-12 pt-28 lg:pt-12 max-w-7xl mx-auto w-full">
          <AdminErrorBoundary>
            {renderContent()}
          </AdminErrorBoundary>
        </main>
      </div>
    </div>
  );
}
