import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  MapPin
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTeamAuth, ROLE_LABELS } from '@/contexts/TeamAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { API_BASE_URL } from '@/lib/api';


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

const ROLE_STATS: Record<string, any[]> = {
  admin: [
    { label: 'Total Bookings', value: '0', icon: Package, change: '0%', color: 'text-blue-400', section: 'bookings' },
    { label: 'Total Revenue', value: '₹0L', icon: DollarSign, change: '0%', color: 'text-green-400', section: 'revenue' },
    { label: 'Total Users', value: '0', icon: Users, change: '0%', color: 'text-purple-400', section: 'users' },
    { label: 'Packages Sold', value: '0', icon: TrendingUp, change: '0%', color: 'text-kashmir-gold', section: 'packages' },
  ],
  operations: [
    { label: 'Active Inquiries', value: '0', icon: MessageSquare, change: 'Live', color: 'text-blue-400' },
    { label: 'Pending Bookings', value: '0', icon: Package, change: '0', color: 'text-amber-400' },
    { label: 'Cab Availability', value: '100%', icon: Car, change: 'High', color: 'text-emerald-400' },
    { label: 'Hotel Nodes', value: '0', icon: Building, change: '0', color: 'text-purple-400' },
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
  const { teamUser, isTeamAuthenticated, isTeamLoading, canAccessAdmin, systemEvents } = useTeamAuth();
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
            <div className="relative overflow-hidden p-10 rounded-[3rem] bg-gradient-to-br from-kashmir-gold/10 via-transparent to-transparent border border-white/5 shadow-2xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-kashmir-gold/5 blur-[80px] -mr-32 -mt-32" />
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="space-y-2">
                  <Badge className="bg-kashmir-gold text-black hover:bg-kashmir-gold border-none font-black px-4 py-1 rounded-full text-[10px] uppercase tracking-[0.2em] mb-4">
                    Enterprise Intelligence
                  </Badge>
                  <h1 className="text-5xl font-display font-black text-white leading-tight">Welcome back, <span className="text-kashmir-gold">{ROLE_LABELS[teamRole]}</span></h1>
                  <p className="text-white/40 text-sm max-w-xl font-medium leading-relaxed">Your Kashmir Curators ecosystem is performing at <span className="text-green-400 font-bold">124% capacity</span>. All operational nodes are synchronized and secured.</p>
                </div>
                <div className="flex gap-4">
                  <div className="text-center p-6 rounded-[2rem] bg-white/5 border border-white/5 backdrop-blur-xl min-w-[140px]">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">System Load</p>
                    <p className="text-2xl font-display font-bold text-white">0.42<span className="text-kashmir-gold text-sm ml-1">ms</span></p>
                  </div>
                  <div className="text-center p-6 rounded-[2rem] bg-kashmir-gold/5 border border-kashmir-gold/10 backdrop-blur-xl min-w-[140px]">
                    <p className="text-[10px] font-black uppercase tracking-widest text-kashmir-gold/50 mb-2">Live Nodes</p>
                    <p className="text-2xl font-display font-bold text-kashmir-gold">18</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid - High Fidelity */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {getDisplayStats().map((stat, idx) => (
                <Card key={stat.label} className="bg-[#0a0f12]/40 bg-white/[0.02] border-white/5 p-8 rounded-[2.5rem] backdrop-blur-xl relative overflow-hidden transition-all duration-500 hover:border-kashmir-gold/30 hover:shadow-2xl hover:shadow-kashmir-gold/5 group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-kashmir-gold/5 blur-[40px] -mr-12 -mt-12 transition-all group-hover:bg-kashmir-gold/20" />
                  
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-kashmir-gold/10 group-hover:border-kashmir-gold/20 transition-all duration-500">
                      <stat.icon className="h-6 w-6 text-kashmir-gold" />
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-1">Growth Matrix</p>
                      <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20 text-[10px] font-black">
                        {stat.change}
                      </Badge>
                    </div>
                  </div>
                  
                   <div className="space-y-1">
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/30">{stat.label}</p>
                    <div className="text-4xl font-display font-black text-white">{stat.value}</div>
                  </div>

                  <Button 
                    variant="ghost" 
                    onClick={() => stat.section && setActiveSection(stat.section)}
                    className="mt-6 w-full pt-6 border-t border-white/5 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-white/20 hover:text-kashmir-gold transition-colors"
                  >
                    <span>View Analytics</span>
                    <TrendingUp className="w-3 h-3 text-emerald-500" />
                  </Button>
                </Card>
              ))}
            </div>

            {/* Analytics & Performance Hub */}
            {/* Role-Specific Operation Center */}
            {(teamRole === 'operations' || teamRole === 'admin') && (
              <Card className="bg-[#0a0f12]/40 bg-white/[0.02] border-white/5 p-10 rounded-[3rem] backdrop-blur-xl relative overflow-hidden group">
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
              <Card className="lg:col-span-8 bg-[#0a0f12]/40 bg-white/[0.02] border-white/5 p-10 rounded-[3rem] backdrop-blur-xl relative overflow-hidden group">
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
                      <div key={i} className="w-full h-px bg-white/[0.02]" />
                    ))}
                  </div>
                  
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-4 group/bar">
                      <div className="w-full relative">
                        <div 
                          className="w-full rounded-t-xl bg-gradient-to-t from-kashmir-gold/10 to-kashmir-gold/40 transition-all duration-700 group-hover/bar:to-kashmir-gold shadow-lg shadow-kashmir-gold/5" 
                          style={{ height: `${20 + Math.random() * 80}%` }}
                        >
                          <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-all bg-kashmir-gold text-black font-black text-[9px] px-2 py-1 rounded shadow-xl">
                            ₹{(Math.random() * 100).toFixed(1)}k
                          </div>
                        </div>
                      </div>
                      <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">M{i+1}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* System Event Feed */}
              <Card className="lg:col-span-4 bg-[#0a0f12]/40 bg-white/[0.02] border-white/5 p-10 rounded-[3rem] backdrop-blur-xl flex flex-col relative overflow-hidden">
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

                <Button variant="ghost" className="mt-10 w-full rounded-2xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-[0.3em] text-white/30 hover:text-white hover:bg-white/10">
                  Full Audit Log
                </Button>
              </Card>
            </div>
          </div>
        );
      case 'inquiries': return <div className="animate-in fade-in duration-500"><CMSInquiries /></div>;
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
      case 'content': return <div className="animate-in fade-in duration-500"><CMSSiteContent /></div>;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f12] text-white flex flex-col lg:flex-row font-sans">
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

        <main className="p-6 lg:p-12 pt-28 lg:pt-12 max-w-7xl mx-auto w-full">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
