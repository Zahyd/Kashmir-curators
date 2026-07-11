import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  MessageSquare, 
  Users, 
  TrendingUp, 
  Clock, 
  Search, 
  Filter, 
  LayoutGrid, 
  List,
  Eye,
  FilePlus,
  LogOut,
  Bell,
  User,
  ChevronRight,
  ShieldCheck,
  Zap,
  Sparkles,
  CreditCard,
  Mail,
  Phone,
  MessageCircle,
  ExternalLink,
  Target,
  Trophy,
  AlertCircle,
  CalendarCheck,
  MapPin,
  DollarSign, 
  Timer,
  X,
  FileText
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useTeamAuth } from '@/contexts/TeamAuthContext';
import MobilePortalNav from '@/components/layout/MobilePortalNav';
import ItineraryBuilder from '@/components/sales/ItineraryBuilder';
import SalesPerformance from '@/components/sales/SalesPerformance';
import PaymentPortal from '@/components/sales/PaymentPortal';
import InquiryVault from '@/components/sales/InquiryVault';
import WorkLog from '@/components/sales/WorkLog';
import CMSUsers from '@/components/admin/CMSUsers';
import CMSRevenue from '@/components/admin/CMSRevenue';
import SelectionRequired from '@/components/sales/SelectionRequired';
import { API_BASE_URL } from '@/lib/api';
import { LeadBoard } from '@/components/sales/LeadBoard';


// Reminders will be dynamic in future iterations
const mockReminders: any[] = [];

export default function SalesPortal() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const inquiryIdParam = searchParams.get('inquiryId');
  
  const { teamUser, isTeamAuthenticated, isTeamLoading, teamLogout, systemEvents } = useTeamAuth();
  const [activeTab, setActiveTab] = useState<'live-leads' | 'my-inquiries' | 'performance' | 'work-log' | 'builder' | 'payments' | 'vault' | 'clients'>('live-leads');
  const [selectedInquiry, setSelectedInquiry] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [leadSearch, setLeadSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'All' | 'High' | 'Medium' | 'Low'>('All');
  const [sortBy, setSortBy] = useState<'priority' | 'time'>('priority');
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [salesStats, setSalesStats] = useState<any>(null);

  useEffect(() => {
    if (!isTeamLoading && (!isTeamAuthenticated || (teamUser?.role !== 'sales' && teamUser?.role !== 'admin'))) {
      navigate('/sales/auth');
      return;
    }
  }, [isTeamLoading, isTeamAuthenticated, teamUser, navigate]);

  useEffect(() => {
    if (isTeamAuthenticated) {
      fetchInquiries();
      fetchSalesStats();
    }
  }, [isTeamAuthenticated]);

  // Handle auto-routing to itinerary builder if inquiryId is provided in URL
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

  // Real-time refresh
  useEffect(() => {
    const latestEvent = systemEvents[0];
    if (latestEvent && latestEvent.booking && (latestEvent.booking.entityType === 'inquiry' || latestEvent.booking.entityType === 'booking')) {
      fetchInquiries();
      fetchSalesStats();
    }
  }, [systemEvents]);

  const fetchInquiries = async () => {
    try {
      const token = localStorage.getItem('teamToken');
      const response = await fetch(`${API_BASE_URL}/inquiries`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Gracefully handle expired/invalid tokens
      if (response.status === 401 || response.status === 403) {
        teamLogout();
        navigate('/sales/auth');
        return;
      }

      if (!response.ok) throw new Error('Failed to fetch inquiries');

      const data = await response.json();
      // Only set if we actually got an array, preventing type errors
      if (Array.isArray(data)) {
        setInquiries(data);
      } else {
        setInquiries([]);
      }
    } catch (error) {
      console.error('Failed to fetch inquiries:', error);
      setInquiries([]);
    } finally {
      setLoadingLeads(false);
    }
  };

  const fetchSalesStats = async () => {
    try {
      const token = localStorage.getItem('teamToken');
      const response = await fetch(`${API_BASE_URL}/dashboard/sales`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Gracefully handle expired/invalid tokens
      if (response.status === 401 || response.status === 403) {
        teamLogout();
        navigate('/sales/auth');
        return;
      }

      if (!response.ok) throw new Error('Failed to fetch sales stats');

      const data = await response.json();
      if (data && !data.error) {
        setSalesStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch sales stats:', error);
    }
  };

  const handleStageChange = async (inquiryId: string, newStage: string) => {
    try {
      const token = localStorage.getItem('teamToken');
      const response = await fetch(`${API_BASE_URL}/crm/leads/${inquiryId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ leadStage: newStage })
      });
      if (response.ok) {
        toast.success(`Lead stage updated to ${newStage.replace('_', ' ')}`);
        fetchInquiries();
        fetchSalesStats();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to update lead stage');
      }
    } catch (error) {
      console.error('Error updating stage:', error);
      toast.error('Network error updating lead stage');
    }
  };

  if (isTeamLoading || !isTeamAuthenticated || !teamUser) return null;

  const formatId = (id: string) => {
    if (!id) return '';
    return id.includes('-') ? `KC-${id.split('-')[0].toUpperCase()}` : `KC-${id.substring(0, 8).toUpperCase()}`;
  };

  const myInquiries = inquiries.filter(inq => {
    const isAssigned = inq.assignedTo === teamUser.code || !inq.assignedTo;
    const displayId = formatId(inq.id);
    const matchesSearch = inq.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          displayId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          inq.id.toLowerCase().includes(searchTerm.toLowerCase());
    return isAssigned && matchesSearch;
  });

  const liveLeads = inquiries
    .filter(inq => {
      if (inq.status !== 'Pending Curation') return false;

      const isAssigned = inq.assignedTo === teamUser?.code || !inq.assignedTo;
      if (!isAssigned) return false;

      const displayId = formatId(inq.id);
      const matchesSearch = inq.customerName.toLowerCase().includes(leadSearch.toLowerCase()) || 
                            displayId.toLowerCase().includes(leadSearch.toLowerCase()) ||
                            inq.destination.toLowerCase().includes(leadSearch.toLowerCase());
      if (!matchesSearch) return false;

      if (priorityFilter !== 'All') {
        const p = inq.priority || 'Low';
        if (p.toLowerCase() !== priorityFilter.toLowerCase()) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'priority') {
        const priorityWeight: Record<string, number> = { High: 3, Medium: 2, Low: 1 };
        const weightA = priorityWeight[a.priority || 'Low'] || 1;
        const weightB = priorityWeight[b.priority || 'Low'] || 1;
        if (weightA !== weightB) {
          return weightB - weightA;
        }
      }
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    });

  const handleLogout = () => {
    teamLogout();
    toast.success('Logged out from Sales Portal');
    navigate('/sales/auth');
  };

  const openBuilder = (inquiry: any) => {
    setSelectedInquiry(inquiry);
    setActiveTab('builder');
  };

  const openPayment = (inquiry: any) => {
    setSelectedInquiry(inquiry);
    setActiveTab('payments');
  };

  const openVault = (inquiry: any) => {
    setSelectedInquiry(inquiry);
    setActiveTab('vault');
  };

  return (
    <div className="min-h-screen bg-[#0a0f12] text-white flex flex-col lg:flex-row font-sans">
      {/* Mobile Nav */}
      <MobilePortalNav 
        title="Sales Command"
        roleLabel="Lead Specialist"
        isOpen={isSidebarOpen}
        onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Sales Sidebar - Responsive */}
      <aside className={cn(
        "w-72 h-screen fixed left-0 top-0 bg-[#0a0f12]/95 lg:bg-[#0a0f12]/60 backdrop-blur-3xl border-r border-white/5 flex flex-col z-[70] lg:z-50 transition-all duration-500 shadow-2xl",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <Link to="/" className="p-8 border-b border-white/5 flex items-center justify-between hover:bg-white/[0.02] transition-colors group/logo">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-kashmir-gold to-amber-600 flex items-center justify-center shrink-0 shadow-xl shadow-kashmir-gold/20 group-hover/logo:scale-105 transition-transform">
              <ShieldCheck className="w-6 h-6 text-black" />
            </div>
            <div className="overflow-hidden">
              <h2 className="font-display text-xl font-bold text-white tracking-tight leading-none group-hover/logo:text-kashmir-gold transition-colors">Sales<span className="text-kashmir-gold group-hover/logo:text-white transition-colors">Pro</span></h2>
              <p className="text-[9px] uppercase tracking-[0.3em] text-white/30 font-bold mt-1.5">Kashmir Curators</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={(e) => { e.preventDefault(); setIsSidebarOpen(false); }} className="lg:hidden text-white/40">
            <X className="w-6 h-6" />
          </Button>
        </Link>

        <nav className="flex-1 p-6 space-y-3 mt-8 overflow-y-auto custom-scrollbar">
          {[
            { id: 'live-leads', label: 'Live Leads', icon: Zap, color: 'text-kashmir-gold' },
            { id: 'my-inquiries', label: 'Active Pipeline', icon: MessageSquare, color: 'text-blue-400' },
            { id: 'vault', label: 'Inquiry Vault', icon: ShieldCheck, color: 'text-emerald-400' },
            { id: 'builder', label: 'Itinerary Builder', icon: FilePlus, color: 'text-purple-400' },
            { id: 'clients', label: 'Client Directory', icon: Users, color: 'text-orange-400' },
            { id: 'payments', label: 'Payment Links', icon: CreditCard, color: 'text-amber-400' },
            { id: 'performance', label: 'Revenue Intel', icon: TrendingUp, color: 'text-pink-400' },
            { id: 'work-log', label: 'Work Log', icon: Clock, color: 'text-white' },
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setIsSidebarOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-500 group relative",
                activeTab === tab.id ? "bg-white/5 text-white shadow-inner border border-white/5" : "text-white/40 hover:text-white hover:bg-white/5"
              )}
            >
              <tab.icon className={cn("w-5 h-5", activeTab === tab.id ? tab.color : "group-hover:scale-110 transition-transform")} />
              <span className="font-bold text-xs tracking-wide uppercase">{tab.label}</span>
              {activeTab === tab.id && <div className={cn("absolute left-0 w-1 h-6 rounded-r-full", tab.color.replace('text-', 'bg-'))} />}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-white/5 bg-white/[0.01]">
          <div className="flex items-center gap-4 mb-6 bg-white/5 p-4 rounded-3xl border border-white/5">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
              <User className="w-5 h-5 text-kashmir-gold" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{teamUser?.name}</p>
              <p className="text-[9px] text-white/30 truncate uppercase tracking-widest font-bold mt-0.5">{teamUser?.code}</p>
            </div>
          </div>
          <Link 
            to="/"
            className="w-full flex items-center gap-4 px-5 py-3 mb-2 rounded-2xl text-white/40 hover:text-white hover:bg-white/5 transition-all duration-300 group"
          >
            <Sparkles className="w-5 h-5 text-kashmir-gold group-hover:scale-110 transition-transform" />
            <span className="font-bold text-xs uppercase tracking-widest">Visit Website</span>
          </Link>
          <button 
            onClick={teamLogout}
            className="w-full flex items-center gap-4 px-5 py-3 rounded-2xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-300"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-bold text-xs uppercase tracking-widest">Terminate Session</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-72 flex flex-col min-h-screen relative pt-20 lg:pt-0">
        {/* Dynamic Section Rendering */}
        <div className="p-10 max-w-[1600px] mx-auto w-full">
          {activeTab === 'live-leads' ? (
            <div className="space-y-10 animate-in fade-in duration-700 slide-in-from-bottom-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                  <div className="flex items-center gap-2 text-kashmir-gold text-[10px] font-black uppercase tracking-[0.4em] mb-3">
                    <div className="w-2 h-2 rounded-full bg-kashmir-gold animate-pulse shadow-[0_0_8px_rgba(212,175,55,0.8)]" />
                    <span>Real-time Inbound</span>
                  </div>
                  <h1 className="text-5xl font-display font-bold text-white mb-3 tracking-tight">Live Lead Queue</h1>
                  <p className="text-white/40 text-base max-w-xl">Fresh leads directly assigned from the app. High response speed = High conversion.</p>
                </div>
                <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Global Status</p>
                    <p className="text-sm font-bold text-emerald-400">Receiving Leads</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-emerald-400 fill-emerald-400/20" />
                  </div>
                </div>
              </div>

            <div className="flex flex-col xl:flex-row gap-6 items-stretch justify-between bg-white/[0.02] border border-white/5 p-6 rounded-[2.5rem] backdrop-blur-2xl">
              {/* Search input */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <Input 
                  value={leadSearch}
                  onChange={(e) => setLeadSearch(e.target.value)}
                  placeholder="Search guest name, ID, destination..." 
                  className="pl-11 bg-white/5 border-white/5 h-12 rounded-xl text-xs font-bold text-white focus:bg-white/10 focus:border-kashmir-gold/30 transition-all placeholder:text-white/20"
                />
              </div>

              {/* Priority Filters and Sorting */}
              <div className="flex flex-wrap items-center gap-4">
                {/* Priority tabs */}
                <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                  {(['All', 'High', 'Medium', 'Low'] as const).map((prio) => {
                    const count = inquiries.filter(inq => {
                      if (inq.status !== 'Pending Curation') return false;
                      const isAssigned = inq.assignedTo === teamUser?.code || !inq.assignedTo;
                      if (!isAssigned) return false;
                      if (prio !== 'All' && (inq.priority || 'Low').toLowerCase() !== prio.toLowerCase()) return false;
                      return true;
                    }).length;

                    return (
                      <button
                        key={prio}
                        onClick={() => setPriorityFilter(prio)}
                        className={cn(
                          "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2",
                          priorityFilter === prio 
                            ? "bg-kashmir-gold text-black shadow-lg" 
                            : "text-white/40 hover:text-white"
                        )}
                      >
                        {prio}
                        <span className={cn(
                          "px-1.5 py-0.5 rounded-md text-[8px] font-bold",
                          priorityFilter === prio ? "bg-black/10 text-black" : "bg-white/5 text-white/40"
                        )}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Sorting options */}
                <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                  <button
                    onClick={() => setSortBy('priority')}
                    className={cn(
                      "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5",
                      sortBy === 'priority' ? "bg-white/5 text-white border border-white/5" : "text-white/40 hover:text-white"
                    )}
                  >
                    <Target className="w-3.5 h-3.5 text-kashmir-gold" />
                    Priority First
                  </button>
                  <button
                    onClick={() => setSortBy('time')}
                    className={cn(
                      "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5",
                      sortBy === 'time' ? "bg-white/5 text-white border border-white/5" : "text-white/40 hover:text-white"
                    )}
                  >
                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                    Newest First
                  </button>
                </div>
              </div>
            </div>

            {liveLeads.length === 0 ? (
              <div className="py-20 text-center bg-white/[0.01] border-2 border-dashed border-white/5 rounded-[3rem] max-w-xl mx-auto w-full">
                <AlertCircle className="w-12 h-12 text-white/10 mx-auto mb-4" />
                <p className="text-white/30 font-bold uppercase tracking-widest text-xs">No active leads match the filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {liveLeads.map((inq, index) => {
                  const displayId = formatId(inq.id);
                  const prio = inq.priority || 'Low';
                  
                  return (
                    <Card 
                      key={inq.id} 
                      className="group bg-white/[0.02] border-white/5 overflow-hidden rounded-[2rem] hover:border-kashmir-gold/30 hover:bg-white/[0.04] transition-all duration-500 backdrop-blur-2xl relative flex flex-col justify-between shadow-xl"
                      style={{ transitionDelay: `${index * 30}ms` }}
                    >
                      {/* Decorative top priority line */}
                      <div className={cn(
                        "h-[3px] w-full absolute top-0 left-0",
                        prio === 'High' ? "bg-gradient-to-r from-red-500 via-rose-500 to-red-500 shadow-[0_1px_10px_rgba(239,68,68,0.5)]" :
                        prio === 'Medium' ? "bg-gradient-to-r from-amber-500 to-orange-500" :
                        "bg-white/5"
                      )} />

                      <div className="p-6 space-y-6">
                        {/* Avatar & Basic Info */}
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-lg font-bold text-white shadow-md group-hover:scale-105 group-hover:border-kashmir-gold/20 transition-all duration-300">
                              {inq.customerName.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-display text-lg font-bold text-white group-hover:text-kashmir-gold transition-colors truncate">{inq.customerName}</h3>
                              <p className="text-[9px] font-mono font-bold text-white/30 uppercase tracking-wider">{displayId}</p>
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            <Badge className={cn(
                              "text-[8px] font-black tracking-widest px-2 py-0.5 rounded-md border-none uppercase",
                              prio === 'High' ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                              prio === 'Medium' ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                              "bg-white/5 text-white/40"
                            )}>
                              {prio}
                            </Badge>
                            <span className="text-[8px] text-white/20 uppercase font-black tracking-wider flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" /> 12m ago
                            </span>
                          </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-4 p-4 bg-white/[0.01] rounded-2xl border border-white/5">
                          {[
                            { label: 'Destination', value: inq.destination, icon: MapPin },
                            { label: 'Duration', value: inq.duration, icon: Clock },
                            { label: 'Stay', value: inq.accommodation, icon: Sparkles },
                            { label: 'Budget', value: inq.budget || 'Premium', icon: DollarSign },
                          ].map((stat, i) => (
                            <div key={i} className="min-w-0">
                              <p className="text-[8px] font-bold text-white/25 uppercase tracking-wider mb-0.5">{stat.label}</p>
                              <p className="text-xs font-bold text-white/90 truncate">{stat.value}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* CTA Footer */}
                      <div className="p-6 pt-0 border-t border-white/[0.02] mt-auto">
                        <Button 
                          onClick={() => openBuilder(inq)}
                          className="w-full h-11 bg-kashmir-gold text-black hover:bg-amber-500 font-black uppercase tracking-[0.15em] text-[10px] rounded-xl gap-2 shadow-lg shadow-kashmir-gold/5 transition-all duration-300"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          Claim & Build
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
            </div>
          ) : activeTab === 'my-inquiries' ? (
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-12 animate-in fade-in duration-700 slide-in-from-bottom-4">
              {/* Left Column: Pipeline */}
              <div className="xl:col-span-3 space-y-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                  <div>
                    <div className="flex items-center gap-2 text-kashmir-gold text-[10px] font-black uppercase tracking-[0.4em] mb-3">
                      <Sparkles className="w-4 h-4" />
                      <span>Elite Sales Hub</span>
                    </div>
                    <h1 className="text-5xl font-display font-bold text-white mb-3 tracking-tight">Active Command</h1>
                    <p className="text-white/40 text-base max-w-xl">Review leads, curate itineraries, and accelerate conversions.</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                      <button
                        onClick={() => setViewMode('kanban')}
                        className={cn(
                          "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5",
                          viewMode === 'kanban' ? "bg-white/5 text-white border border-white/5" : "text-white/40 hover:text-white"
                        )}
                      >
                        <LayoutGrid className="w-3.5 h-3.5 text-kashmir-gold" />
                        Board
                      </button>
                      <button
                        onClick={() => setViewMode('list')}
                        className={cn(
                          "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5",
                          viewMode === 'list' ? "bg-white/5 text-white border border-white/5" : "text-white/40 hover:text-white"
                        )}
                      >
                        <List className="w-3.5 h-3.5 text-blue-400" />
                        List
                      </button>
                    </div>
                    <div className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Active Pipeline</p>
                        <p className="text-xs font-bold text-kashmir-gold">{myInquiries.length} Assigned Leads</p>
                      </div>
                      <div className="w-8 h-8 rounded-lg bg-kashmir-gold/10 flex items-center justify-center text-kashmir-gold">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-6 items-stretch justify-between bg-white/[0.02] border border-white/5 p-6 rounded-[2.5rem] backdrop-blur-2xl">
                  {/* Search input */}
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <Input 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search guest name, ID, destination..." 
                      className="pl-11 bg-white/5 border-white/5 h-12 rounded-xl text-xs font-bold text-white focus:bg-white/10 focus:border-kashmir-gold/30 transition-all placeholder:text-white/20"
                    />
                  </div>

                  {/* Quick Filters Info */}
                  <div className="flex items-center gap-4 text-[10px] font-black text-white/30 uppercase tracking-widest">
                    <span>Double-click card actions to open details</span>
                  </div>
                </div>

                {viewMode === 'kanban' ? (
                  <LeadBoard 
                    inquiries={myInquiries} 
                    onStatusChange={handleStageChange} 
                    onEditLead={(inq) => openBuilder(inq)} 
                  />
                ) : (
                  /* Inquiry Cards Grid - 2-Column Responsive Layout */
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {myInquiries.length > 0 ? (
                  myInquiries.map((inq, index) => {
                    const displayId = formatId(inq.id);
                    const prio = inq.priority || 'Low';
                    
                    return (
                      <Card 
                        key={inq.id} 
                        className="group bg-white/[0.02] border-white/5 overflow-hidden rounded-[2rem] hover:border-kashmir-gold/30 hover:bg-white/[0.04] transition-all duration-500 backdrop-blur-2xl relative flex flex-col justify-between shadow-xl"
                        style={{ transitionDelay: `${index * 30}ms` }}
                      >
                        {/* Decorative top priority line */}
                        <div className={cn(
                          "h-[3px] w-full absolute top-0 left-0",
                          prio === 'High' ? "bg-gradient-to-r from-red-500 via-rose-500 to-red-500 shadow-[0_1px_10px_rgba(239,68,68,0.5)]" :
                          prio === 'Medium' ? "bg-gradient-to-r from-amber-500 to-orange-500" :
                          "bg-white/5"
                        )} />

                        <div className="p-6 space-y-6">
                          {/* Header section */}
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex items-center gap-3">
                              <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-lg font-bold text-white shadow-md group-hover:scale-105 group-hover:border-kashmir-gold/20 transition-all duration-300">
                                {inq.customerName.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <h3 className="font-display text-base font-bold text-white group-hover:text-kashmir-gold transition-colors truncate">{inq.customerName}</h3>
                                <p className="text-[9px] font-mono font-bold text-white/30 uppercase tracking-wider">{displayId}</p>
                              </div>
                            </div>
                            
                            <div className="flex flex-col items-end gap-1.5 shrink-0">
                              <Badge className={cn(
                                "text-[8px] font-black tracking-widest px-2 py-0.5 rounded-md border-none uppercase shadow-md",
                                inq.status === 'New' ? 'bg-blue-500/20 text-blue-400 shadow-blue-500/10' :
                                inq.status === 'Pending Curation' ? 'bg-amber-500/20 text-amber-500 shadow-amber-500/10' :
                                inq.status === 'Ready for Review' ? 'bg-purple-500/20 text-purple-400 shadow-purple-500/10' :
                                'bg-emerald-500/20 text-emerald-400 shadow-emerald-500/10'
                              )}>
                                {inq.status}
                              </Badge>
                              {inq.priority && (
                                <span className={cn(
                                  "text-[7px] font-black uppercase tracking-widest px-1 py-0.5 rounded",
                                  prio === 'High' ? "bg-red-500/10 text-red-400" : "bg-white/5 text-white/40"
                                )}>
                                  {prio} PRIORITY
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Stats Grid */}
                          <div className="grid grid-cols-2 gap-4 p-4 bg-white/[0.01] rounded-2xl border border-white/5">
                            {[
                              { label: 'Destination', value: inq.destination, icon: MapPin },
                              { label: 'Duration', value: inq.duration, icon: Clock },
                              { label: 'Experience', value: `${inq.budget} • ${inq.accommodation}`, icon: Sparkles },
                              { label: 'Travelers', value: inq.travelers, icon: Users },
                            ].map((stat, i) => (
                              <div key={i} className="min-w-0">
                                <p className="text-[8px] font-bold text-white/25 uppercase tracking-wider mb-0.5">{stat.label}</p>
                                <p className="text-xs font-bold text-white/90 truncate">{stat.value}</p>
                              </div>
                            ))}
                          </div>

                          {/* Instant Engagements */}
                          <div className="flex items-center gap-2 p-2 bg-white/5 rounded-xl border border-white/5">
                            <span className="text-[8px] font-bold uppercase tracking-wider text-white/20 ml-2 mr-auto">Engage</span>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 px-3 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 gap-1.5 text-[9px] font-bold"
                              onClick={() => window.open(`https://wa.me/${inq.phone.replace(/\s+/g, '')}?text=Hello ${inq.customerName}, this is ${teamUser.name} from The Kashmir Curators...`, '_blank')}
                            >
                              <MessageCircle className="w-3 h-3" /> WhatsApp
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 px-3 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 gap-1.5 text-[9px] font-bold"
                              onClick={() => window.location.href = `mailto:${inq.email}?subject=Your Luxury Kashmir Proposal - ${inq.id}`}
                            >
                              <Mail className="w-3 h-3" /> Email
                            </Button>
                          </div>
                        </div>

                        {/* Action Footer */}
                        <div className="p-6 pt-0 border-t border-white/[0.02] space-y-3 mt-auto">
                          <div className="flex gap-2">
                            <Button 
                              onClick={() => openBuilder(inq)}
                              className="flex-1 h-11 bg-kashmir-gold text-black hover:bg-amber-500 font-black uppercase tracking-widest text-[10px] rounded-xl gap-2 shadow-lg shadow-kashmir-gold/5"
                            >
                              <FilePlus className="w-3.5 h-3.5" />
                              <span>{inq.quoteData ? 'Edit Itinerary' : 'Build Itinerary'}</span>
                            </Button>
                            {inq.proposalUrl ? (
                              <Button 
                                onClick={() => window.open(inq.proposalUrl, '_blank')}
                                className="flex-1 h-11 bg-emerald-500 text-white hover:bg-emerald-600 font-black uppercase tracking-widest text-[10px] rounded-xl gap-2 shadow-lg shadow-emerald-500/10"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>Proposal</span>
                              </Button>
                            ) : (
                              <Button 
                                onClick={() => openPayment(inq)}
                                variant="outline"
                                className="flex-1 border-white/10 text-white hover:bg-white/10 h-11 rounded-xl font-black uppercase tracking-widest text-[10px] gap-2"
                              >
                                <CreditCard className="w-3.5 h-3.5 text-kashmir-gold" />
                                <span>Payment</span>
                              </Button>
                            )}
                          </div>
                          <div className="flex gap-2 justify-end pt-1">
                            <Button 
                              onClick={() => openVault(inq)}
                              variant="outline" 
                              className="flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/30 h-10 rounded-xl gap-1.5 text-[9px] font-bold uppercase tracking-wider transition-all"
                            >
                              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Vault
                            </Button>
                            <Button 
                              variant="outline" 
                              className="flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/30 h-10 rounded-xl gap-1.5 text-[9px] font-bold uppercase tracking-wider transition-all"
                            >
                              <Eye className="w-4 h-4 text-white/50" /> Preview
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })
                  ) : (
                    <div className="col-span-full py-32 flex flex-col items-center justify-center bg-white/[0.02] border-2 border-dashed border-white/5 rounded-[4rem] animate-in fade-in zoom-in duration-1000">
                      <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-8 border border-white/5">
                        <Search className="w-10 h-10 text-white/10" />
                      </div>
                      <h3 className="text-2xl font-display font-bold text-white/40">No Assigned Inquiries</h3>
                      <p className="text-white/20 text-base mt-2 max-w-xs text-center">Your lead pipeline is currently clear. Take this time to optimize your existing proposals.</p>
                    </div>
                  )}
                  </div>
                )}
              </div>

            {/* Right Column: Action Center */}
            <div className="xl:col-span-1 space-y-10">
              <div className="sticky top-32 space-y-10">
                {/* Reminders Card */}
                <Card className="bg-[#0a0f12] border-white/5 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group border-t-kashmir-gold border-t-4">
                  <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                    <Bell className="w-24 h-24 text-kashmir-gold" />
                  </div>
                  
                  <div className="relative z-10">
                    <h4 className="text-lg font-bold text-white mb-8 flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-kashmir-gold shadow-[0_0_8px_rgba(212,175,55,0.6)]" />
                      Priority Tasks
                    </h4>
                    
                    <div className="space-y-6">
                      {mockReminders.map((reminder) => (
                        <div key={reminder.id} className="p-5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer group/rem">
                          <div className="flex justify-between items-start mb-2">
                            <Badge className={cn(
                              "px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border-none",
                              reminder.type === 'urgency' ? "bg-red-500/20 text-red-400" :
                              reminder.type === 'payment' ? "bg-emerald-500/20 text-emerald-400" :
                              "bg-blue-500/20 text-blue-400"
                            )}>
                              {reminder.type}
                            </Badge>
                            <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">{reminder.time}</span>
                          </div>
                          <h5 className="text-sm font-bold text-white group-hover/rem:text-kashmir-gold transition-colors">{reminder.title}</h5>
                          <p className="text-[10px] text-white/40 mt-1 leading-relaxed">{reminder.description}</p>
                        </div>
                      ))}
                    </div>

                    <Button variant="ghost" className="w-full mt-6 py-4 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white/20 hover:text-white transition-all group">
                      View All Reminders <ChevronRight className="w-3 h-3 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </Card>

                {/* Performance Mini-Card */}
                <Card className="bg-gradient-to-br from-white/[0.05] to-transparent border-white/5 p-8 rounded-[2.5rem] backdrop-blur-xl border-l-emerald-500 border-l-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-6">Pipeline Health</h4>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between items-end mb-2">
                        <p className="text-[10px] font-bold text-white/60">Monthly Target</p>
                        <p className="text-sm font-bold text-emerald-400">74%</p>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 w-[74%]" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                      <div>
                        <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Total Leads</p>
                        <p className="text-lg font-black text-white">{salesStats?.leadsReceived || 0}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Conversion</p>
                        <p className="text-lg font-black text-blue-400">{salesStats?.conversionRate || '0%'}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
          ) : activeTab === 'clients' ? (
            <CMSUsers />
          ) : activeTab === 'performance' ? (
            <CMSRevenue />
          ) : activeTab === 'builder' ? (
            selectedInquiry ? (
              <ItineraryBuilder 
                inquiry={selectedInquiry} 
                onBack={() => setActiveTab('my-inquiries')} 
              />
            ) : (
              <SelectionRequired 
                title="Itinerary Builder"
                description="Select an active inquiry from your pipeline to begin crafting a bespoke luxury itinerary."
                icon={FilePlus}
                inquiries={inquiries}
                onSelect={(inq) => {
                  setSelectedInquiry(inq);
                  setActiveTab('builder');
                }}
                teamUser={teamUser}
              />
            )
          ) : activeTab === 'payments' ? (
            selectedInquiry ? (
              <PaymentPortal 
                inquiry={selectedInquiry}
                onBack={() => setActiveTab('my-inquiries')}
              />
            ) : (
              <SelectionRequired 
                title="Payment Portal"
                description="Generate secure UPI payment links and verify transactions for your booked clients."
                icon={CreditCard}
                inquiries={inquiries}
                onSelect={(inq) => {
                  setSelectedInquiry(inq);
                  setActiveTab('payments');
                }}
                teamUser={teamUser}
              />
            )
          ) : activeTab === 'vault' ? (
            selectedInquiry ? (
              <InquiryVault 
                inquiry={selectedInquiry}
                onBack={() => setActiveTab('my-inquiries')}
              />
            ) : (
              <SelectionRequired 
                title="Inquiry Vault"
                description="Access and manage secure guest documentation, ID proofs, and travel vouchers."
                icon={ShieldCheck}
                inquiries={inquiries}
                onSelect={(inq) => {
                  setSelectedInquiry(inq);
                  setActiveTab('vault');
                }}
                teamUser={teamUser}
              />
            )
          ) : activeTab === 'work-log' ? (
            <WorkLog />
          ) : null}
        </div>
      </main>
    </div>
  );
}
