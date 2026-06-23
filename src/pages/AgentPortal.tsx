import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building, User, CreditCard, Sparkles, FileText, Download, Briefcase, 
  CheckCircle2, AlertTriangle, ArrowUpRight, Plus, Loader2, RefreshCw 
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE_URL } from '@/lib/api';

export default function AgentPortal() {
  const navigate = useNavigate();
  const { user, token, isAuthenticated, isLoading } = useAuth();
  
  // Registration state
  const [companyName, setCompanyName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Dashboard state
  const [agentProfile, setAgentProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [isFetchingStats, setIsFetchingStats] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/auth?redirect=/agent');
    }
  }, [isAuthenticated, isLoading, navigate]);

  useEffect(() => {
    if (user && token) {
      fetchAgentDetails();
    }
  }, [user, token]);

  const fetchAgentDetails = async () => {
    setIsFetchingStats(true);
    try {
      // 1. Fetch Agent Profile
      const profileRes = await fetch(`${API_BASE_URL}/agents/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (profileRes.ok) {
        const statsData = await profileRes.json();
        setStats(statsData);
      }
      
      // Get all agents to check current user status
      const agentsRes = await fetch(`${API_BASE_URL}/agents`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (agentsRes.ok) {
        const allAgents = await agentsRes.json();
        const myProfile = allAgents.find((a: any) => a.userId === user?.id);
        if (myProfile) {
          setAgentProfile(myProfile);
        }
      }
    } catch (error) {
      console.error("fetchAgentDetails error:", error);
    } finally {
      setIsFetchingStats(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      toast.error('Company Name is required');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/agents/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ companyName, licenseNumber })
      });
      
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Agent Profile submitted for approval.');
        fetchAgentDetails();
      } else {
        toast.error(data.error || 'Failed to submit Agent Profile.');
      }
    } catch (error) {
      toast.error('Network error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-[#05080a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-kashmir-gold animate-spin" />
      </div>
    );
  }

  const isPending = agentProfile?.status === 'PENDING';
  const isApproved = agentProfile?.status === 'APPROVED';

  return (
    <div className="min-h-screen bg-[#05080a] text-white flex flex-col font-sans selection:bg-kashmir-gold/30 selection:text-white">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 pt-32 pb-20">
        
        {/* Header section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0a0f12] via-[#0f171e] to-[#0a0f12] border border-white/10 p-8 rounded-3xl mb-12 shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-kashmir-gold/5 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            <div>
              <div className="inline-flex items-center gap-2 bg-kashmir-gold/10 text-kashmir-gold px-3.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase mb-3 border border-kashmir-gold/30">
                <Briefcase className="w-3.5 h-3.5" /> B2B Agent Ecosystem
              </div>
              <h1 className="font-display text-3xl md:text-5xl font-extrabold text-white tracking-tight">Agent Distribution Hub</h1>
              <p className="text-white/50 mt-2 text-sm max-w-xl">Register as an approved travel coordinator to unlock net rates, customize agent margins, and curate customized itineraries.</p>
            </div>
            
            {isApproved && (
              <Button onClick={() => navigate('/planner')} variant="gold" className="rounded-xl font-bold h-11 text-black shadow-lg shadow-kashmir-gold/15 shrink-0 px-6">
                <Plus className="w-4 h-4 mr-2" /> Start Quote Curation
              </Button>
            )}
          </div>
        </div>

        {/* State A: Register Agent Profile */}
        {!agentProfile && (
          <div className="max-w-md mx-auto bg-[#0c1216]/65 border border-white/10 p-8 rounded-3xl shadow-2xl backdrop-blur-md">
            <h3 className="font-display text-2xl font-black text-center mb-2">Request Agent Account</h3>
            <p className="text-white/50 text-xs text-center mb-8">Access wholesale fares for hotels, cabs, and private shikaras across Kashmir.</p>
            
            <form onSubmit={handleRegister} className="space-y-6 text-left">
              <div>
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider block mb-2">Company / Travel Agency Name</label>
                <Input 
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Travel World Inc."
                  required
                  className="bg-black/40 border-white/10 h-11 rounded-xl text-white focus-visible:ring-kashmir-gold pl-4 text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider block mb-2">IATA / License Registration Number</label>
                <Input 
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  placeholder="e.g. IATA-8871625"
                  className="bg-black/40 border-white/10 h-11 rounded-xl text-white focus-visible:ring-kashmir-gold pl-4 text-xs"
                />
              </div>

              <Button 
                type="submit"
                disabled={isSubmitting}
                variant="gold"
                className="w-full h-11 rounded-xl font-bold text-black shadow-lg shadow-kashmir-gold/15 mt-4"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit for Review'}
              </Button>
            </form>
          </div>
        )}

        {/* State B: Registration Pending Review */}
        {isPending && (
          <div className="max-w-md mx-auto bg-[#0c1216]/65 border border-white/10 p-8 rounded-3xl shadow-2xl text-center backdrop-blur-md space-y-6">
            <AlertTriangle className="w-16 h-16 text-kashmir-gold mx-auto animate-pulse" />
            <h3 className="font-display text-2xl font-black">Verification Pending</h3>
            <p className="text-white/60 text-xs leading-relaxed">
              Your registration application for agency <span className="text-white font-bold">{agentProfile.companyName}</span> is currently under manual verification by the Kashmir Curators Operations director.
            </p>
            <div className="bg-black/40 border border-white/5 p-4 rounded-2xl text-xs flex justify-between items-center text-left">
              <div>
                <p className="text-white/40 uppercase font-black tracking-widest text-[9px]">Agent Code</p>
                <p className="font-mono text-kashmir-gold font-bold">{agentProfile.agentCode}</p>
              </div>
              <Badge className="bg-kashmir-gold/15 text-kashmir-gold border-kashmir-gold/20">Under Review</Badge>
            </div>
            <Button onClick={fetchAgentDetails} variant="outline" className="w-full rounded-xl border-white/10 h-10 text-xs">
              <RefreshCw className="w-4.5 h-4.5 mr-2" /> Refresh Status
            </Button>
          </div>
        )}

        {/* State C: Active B2B Dashboard */}
        {isApproved && (
          <div className="space-y-12">
            
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white/[0.02] border border-white/10 p-6 rounded-3xl text-left relative overflow-hidden">
                <p className="text-[10px] font-black text-white/45 uppercase tracking-widest mb-1">Total Bookings</p>
                <h3 className="text-3xl font-display font-black text-white">{stats?.bookingsCount || 0}</h3>
                <p className="text-[9px] text-white/30 mt-2 flex items-center gap-1"><ArrowUpRight className="w-3.5 h-3.5 text-green-400" /> +5% this month</p>
              </div>

              <div className="bg-white/[0.02] border border-white/10 p-6 rounded-3xl text-left relative overflow-hidden">
                <p className="text-[10px] font-black text-white/45 uppercase tracking-widest mb-1">Active Proposals</p>
                <h3 className="text-3xl font-display font-black text-white">{stats?.inquiriesCount || 0}</h3>
                <p className="text-[9px] text-white/30 mt-2 flex items-center gap-1"><ArrowUpRight className="w-3.5 h-3.5 text-kashmir-gold" /> Pending Curation</p>
              </div>

              <div className="bg-white/[0.02] border border-white/10 p-6 rounded-3xl text-left relative overflow-hidden">
                <p className="text-[10px] font-black text-white/45 uppercase tracking-widest mb-1">Total Sales Turn</p>
                <h3 className="text-3xl font-display font-black text-kashmir-gold">₹{(stats?.totalRevenue || 0).toLocaleString()}</h3>
                <p className="text-[9px] text-white/30 mt-2">B2B Net wholesale value</p>
              </div>

              <div className="bg-white/[0.02] border border-white/10 p-6 rounded-3xl text-left relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-10"><CheckCircle2 className="w-12 h-12 text-kashmir-gold" /></div>
                <p className="text-[10px] font-black text-white/45 uppercase tracking-widest mb-1">Commission Earned</p>
                <h3 className="text-3xl font-display font-black text-green-400">₹{(stats?.commissionEarned || 0).toLocaleString()}</h3>
                <p className="text-[9px] text-white/30 mt-2">Accrued @ {agentProfile.commissionPct}% override</p>
              </div>
            </div>

            {/* Inquiries & Proposals List */}
            <div className="space-y-6 text-left">
              <h3 className="font-display text-2xl font-bold">My Curation Proposals</h3>
              <div className="bg-[#0c1216]/65 border border-white/10 rounded-3xl p-6 shadow-2xl">
                <p className="text-white/40 text-xs py-8 text-center">To manage or edit inquiries, please use the main [Sales Portal](/sales) or [Itinerary Builder](/sales) workspace.</p>
              </div>
            </div>
            
          </div>
        )}

      </main>
      <Footer />
    </div>
  );
}
