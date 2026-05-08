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
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTeamAuth, ROLE_LABELS } from '@/contexts/TeamAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Admin Components
import AdminSidebar from '@/components/admin/AdminSidebar';
import CMSInquiries from '@/components/admin/CMSInquiries';
import CMSPackages from '@/components/admin/CMSPackages';
import CMSHotels from '@/components/admin/CMSHotels';
import CMSCabs from '@/components/admin/CMSCabs';
import CMSTestimonials from '@/components/admin/CMSTestimonials';
import CMSFaqs from '@/components/admin/CMSFaqs';
import MediaLibrary from '@/components/admin/MediaLibrary';
import CMSSiteContent from '@/components/admin/CMSSiteContent';

const stats = [
  { label: 'Total Bookings', value: '1,234', icon: Package, change: '+12%', color: 'text-blue-400' },
  { label: 'Total Revenue', value: '₹45.2L', icon: DollarSign, change: '+8%', color: 'text-green-400' },
  { label: 'Active Users', value: '892', icon: Users, change: '+23%', color: 'text-purple-400' },
  { label: 'Packages Sold', value: '456', icon: TrendingUp, change: '+15%', color: 'text-kashmir-gold' },
];

export default function Admin() {
  const navigate = useNavigate();
  const { teamUser, isTeamAuthenticated, isTeamLoading, canAccessAdmin } = useTeamAuth();
  const [activeSection, setActiveSection] = useState('dashboard');

  useEffect(() => {
    if (!isTeamLoading) {
      if (!isTeamAuthenticated) {
        navigate('/sales/auth');
      } else if (!canAccessAdmin) {
        // Sales users go to sales portal
        navigate('/sales/portal');
      }
    }
  }, [isTeamAuthenticated, canAccessAdmin, isTeamLoading, navigate]);

  if (isTeamLoading || !isTeamAuthenticated || !canAccessAdmin) {
    return null;
  }

  const teamRole = teamUser?.role || 'admin';

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
              {stats.filter(stat => {
                if (stat.label === 'Total Revenue' && teamRole !== 'admin') return false;
                return true;
              }).map((stat, idx) => (
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

                  <div className="mt-6 pt-6 border-t border-white/5">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-white/20">
                      <span>Live Index</span>
                      <TrendingUp className="w-3 h-3 text-emerald-500" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Analytics & Performance Hub */}
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
                
                <div className="space-y-8 flex-1">
                  {[
                    { label: 'New Inquiry', sub: 'High Priority Trip • 2m ago', icon: MessageSquare, color: 'text-kashmir-gold' },
                    { label: 'Booking Secured', sub: 'Luxury Stay Confirmed • 14m ago', icon: Package, color: 'text-emerald-400' },
                    { label: 'System Update', sub: 'V3.2 Deployment Ready • 42m ago', icon: Sparkles, color: 'text-blue-400' },
                    { label: 'Payment Received', sub: 'Invoice #8829-X • 1h ago', icon: DollarSign, color: 'text-green-400' },
                    { label: 'User Feedback', sub: '5-Star Review Added • 2h ago', icon: Users, color: 'text-purple-400' },
                  ].map((event, i) => (
                    <div key={i} className="flex gap-5 group/event">
                      <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover/event:bg-white/10 transition-all duration-300">
                        <event.icon className={cn("w-5 h-5", event.color)} />
                      </div>
                      <div className="flex-1 min-w-0 pt-1">
                        <p className="text-sm font-bold text-white group-hover/event:text-kashmir-gold transition-colors">{event.label}</p>
                        <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold mt-1">{event.sub}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-white/10 mt-2" />
                    </div>
                  ))}
                </div>

                <Button variant="ghost" className="mt-10 w-full rounded-2xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-[0.3em] text-white/30 hover:text-white hover:bg-white/10">
                  Audit Entire Feed
                </Button>
              </Card>
            </div>
          </div>
        );
      case 'inquiries': return <div className="animate-in fade-in duration-500"><CMSInquiries /></div>;
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
    <div className="dark min-h-screen bg-[#060a0d] text-white flex overflow-hidden">
      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-kashmir-gold/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[10%] w-[40%] h-[40%] rounded-full bg-kashmir-gold/5 blur-[120px]" />
      </div>

      <AdminSidebar activeSection={activeSection} onSectionChange={setActiveSection} />

      <main className="flex-1 ml-72 min-w-0 flex flex-col h-screen relative z-10">
        {/* Top Header Bar */}
        <header className="h-20 border-b border-white/5 bg-[#0a0f12]/50 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4 flex-1 max-w-3xl">
            <div className="relative w-full group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-kashmir-gold transition-colors" />
              <Input 
                placeholder="Search inquiries, packages, or settings..." 
                className="w-full pl-10 bg-white/5 border-white/5 focus-visible:ring-kashmir-gold/50 focus-visible:border-kashmir-gold/50 text-white placeholder:text-white/20 h-10 rounded-xl"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button className="relative w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
              <Bell className="w-5 h-5 text-white/50" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-kashmir-gold" />
            </button>
            <div className="h-8 w-px bg-white/10" />
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs font-bold text-white uppercase tracking-tighter">System Online</p>
                <p className="text-[10px] text-green-400 font-medium">May 08, 2026</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-kashmir-gold" />
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Content Area */}
        <div className="flex-1 overflow-auto p-8 custom-scrollbar">
          <div className="w-full">
            <div className="flex items-center justify-between mb-10">
              <div>
                <div className="flex items-center gap-2 text-kashmir-gold/60 text-xs font-bold uppercase tracking-widest mb-1">
                  <span>Sales Portal</span>
                  <ChevronRight className="w-3 h-3" />
                  <span className="text-white/60">{activeSection}</span>
                </div>
                <h2 className="text-4xl font-display font-bold text-white capitalize">{activeSection.replace('-', ' ')}</h2>
              </div>
              
              <div className="flex items-center gap-3">
                <Button variant="outline" className="bg-white/5 border-white/10 text-white hover:bg-white/10 gap-2 h-11 rounded-xl">
                  <Calendar className="w-4 h-4 text-kashmir-gold" />
                  <span>Schedule View</span>
                </Button>
                <Button className="bg-kashmir-gold text-black hover:bg-amber-500 font-bold gap-2 px-6 h-11 rounded-xl shadow-lg shadow-kashmir-gold/20">
                  <TrendingUp className="w-4 h-4" />
                  <span>Download Report</span>
                </Button>
              </div>
            </div>

            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
}
