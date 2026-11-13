import React, { useState, useEffect } from 'react';
import { 
  Users, 
  TrendingUp, 
  ShieldCheck, 
  FileSpreadsheet, 
  ArrowUpRight, 
  RefreshCw,
  Sparkles,
  Award,
  PhoneCall,
  Clock,
  Plus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { io } from 'socket.io-client';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE_URL, SOCKET_URL, DEFAULT_SOCKET_OPTIONS } from '@/lib/api';

import AgentSidebar, { AgentTab } from '../components/AgentSidebar';
import LeadKanbanBoard, { LeadItem } from '../components/LeadKanbanBoard';
import LicenseVerificationCard from '../components/LicenseVerificationCard';
import QuoteBuilderModal from '../components/QuoteBuilderModal';
import B2BInventoryBrowser from '../components/B2BInventoryBrowser';
import SubscriptionPlanModal, { SaaSPlanId } from '../components/SubscriptionPlanModal';
import WhiteLabelBrandingCard from '../components/WhiteLabelBrandingCard';
import UsageQuotaMeter from '../components/UsageQuotaMeter';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export const AgentDashboard: React.FC = () => {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState<AgentTab>('overview');
  
  // Real-time Agent & Lead State
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [agentProfile, setAgentProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>({
    activeLeadsCount: 0,
    quotesSentCount: 0,
    confirmedRevenue: 0,
    commissionEarned: 0
  });
  const [isLoading, setIsLoading] = useState(false);

  // SaaS Subscription & White-Label State
  const [currentPlan, setCurrentPlan] = useState<SaaSPlanId>(
    (localStorage.getItem('agent_saas_plan') as SaaSPlanId) || 'PRO_DMC'
  );
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const [agencyBranding, setAgencyBranding] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('agent_branding');
      return saved ? JSON.parse(saved) : {
        agencyName: user?.name ? `${user.name} Luxury Travels` : 'Chinar Luxury Holidays',
        agencyTagline: 'Official Handcrafted Kashmir DMC & Tour Curator',
        logoUrl: '',
        primaryColor: '#d97706',
        phone: user?.phone || '+91 99060 12345',
        website: 'www.chinarholidays.com'
      };
    } catch {
      return {
        agencyName: 'Chinar Luxury Holidays',
        agencyTagline: 'Official Handcrafted Kashmir DMC',
        logoUrl: '',
        primaryColor: '#d97706',
        phone: '+91 99060 12345',
        website: 'www.chinarholidays.com'
      };
    }
  });

  // Quote builder modal state
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [selectedLeadForQuote, setSelectedLeadForQuote] = useState<any>(null);

  // Fetch leads and agent data
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const authToken = token || localStorage.getItem('auth_token') || '';
      
      // Fetch CRM leads
      const leadsRes = await fetch(`${API_BASE_URL}/crm/leads`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (leadsRes.ok) {
        const data = await leadsRes.json();
        setLeads(data);
        const active = data.filter((l: any) => l.leadStage !== 'COMPLETED' && l.leadStage !== 'CANCELLED');
        const quotes = data.filter((l: any) => l.leadStage === 'QUOTE_SENT' || l.leadStage === 'NEGOTIATION');
        setStats((prev: any) => ({
          ...prev,
          activeLeadsCount: active.length,
          quotesSentCount: quotes.length
        }));
      }

      // Fetch agent profile / stats
      const statsRes = await fetch(`${API_BASE_URL}/agents/stats`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setAgentProfile(statsData.profile || null);
      }
    } catch (err) {
      console.error('Failed to load agent data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Setup real-time websocket updates
    const socket = io(SOCKET_URL, DEFAULT_SOCKET_OPTIONS);
    socket.on('connect', () => {
      if (user?.id) socket.emit('join-user', user.id);
    });

    socket.on('lead-updated', (data: any) => {
      toast.info('Lead Stage Updated in Real-Time', {
        description: `${data.customerName} is now in ${data.newStage}`,
        icon: '⚡'
      });
      fetchData();
    });

    socket.on('new-system-event', (data: any) => {
      if (data.type === 'INQUIRY_CREATED') {
        toast.success('Fresh Kashmir Inquiry Received!', {
          description: data.message,
          icon: '✨'
        });
        fetchData();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user?.id, token]);

  const handleUpdateLeadStage = async (leadId: string, newStage: string) => {
    try {
      const authToken = token || localStorage.getItem('auth_token') || '';
      const res = await fetch(`${API_BASE_URL}/crm/leads/${leadId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ stage: newStage })
      });

      if (res.ok) {
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, leadStage: newStage } : l));
        toast.success(`Inquiry moved to ${newStage.replace(/_/g, ' ')}`);
      }
    } catch (err) {
      toast.error('Failed to update stage');
    }
  };

  const handleOpenQuoteModal = (lead?: any) => {
    setSelectedLeadForQuote(lead || null);
    setQuoteModalOpen(true);
  };

  const handleSubmitVerification = async (data: any) => {
    const authToken = token || localStorage.getItem('auth_token') || '';
    const res = await fetch(`${API_BASE_URL}/agents/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to submit');
    }

    const result = await res.json();
    setAgentProfile(result.profile);
    fetchData();
  };

  const handleUpgradePlan = async (planId: SaaSPlanId, billingCycle: 'MONTHLY' | 'ANNUAL') => {
    setCurrentPlan(planId);
    localStorage.setItem('agent_saas_plan', planId);
  };

  const handleSaveBranding = async (branding: any) => {
    setAgencyBranding(branding);
    localStorage.setItem('agent_branding', JSON.stringify(branding));
  };

  const verificationStatus = agentProfile?.status || (user?.role === 'agent' ? 'APPROVED' : 'NOT_APPLIED');

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Dedicated Agent Sidebar */}
        <AgentSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          verificationStatus={verificationStatus}
          plan={currentPlan}
          agentCode={agentProfile?.agentCode || 'AGT-KASHMIR-01'}
          companyName={agencyBranding?.agencyName || agentProfile?.companyName || user?.name}
        />

        {/* Main Content Workspace */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Top Bar with Quick Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  B2B DMC Workspace
                </span>
              </div>
              <h1 className="text-2xl font-black text-foreground tracking-tight mt-1">
                {activeTab === 'overview' && 'Agent Command Desk'}
                {activeTab === 'crm' && 'Travel CRM & Lead Pipeline'}
                {activeTab === 'branding' && 'White-Label Agency Identity & Itinerary Styling'}
                {activeTab === 'subscription' && 'SaaS Subscription & Plan Gating'}
                {activeTab === 'licensing' && 'J&K Tourism Accreditation Desk'}
                {activeTab === 'quotes' && 'Quote & Itinerary Generator'}
                {activeTab === 'b2b-supply' && 'Wholesale B2B Kashmir Inventory'}
                {activeTab === 'commission' && 'Agency Payouts & Commission Ledger'}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchData}
                disabled={isLoading}
                className="rounded-xl text-xs gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Sync</span>
              </Button>

              <Button
                size="sm"
                onClick={() => handleOpenQuoteModal()}
                className="rounded-xl text-xs font-bold gap-1.5 shadow-sm shadow-primary/20"
              >
                <Plus className="w-4 h-4" />
                <span>New Custom Quote</span>
              </Button>
            </div>
          </div>

          {/* Usage Quota & SaaS Plan Bar */}
          <UsageQuotaMeter
            plan={currentPlan}
            leadsUsed={leads.length}
            leadsLimit={15}
            onOpenUpgradeModal={() => setSubscriptionModalOpen(true)}
          />

          {/* TAB 1: OVERVIEW CONTROL DESK */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* 4 Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="rounded-3xl border border-border/70 p-5 bg-card">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">Active Travel Inquiries</span>
                    <Users className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-3xl font-black text-foreground mt-2">{stats.activeLeadsCount || leads.length}</p>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1 font-medium">
                    <TrendingUp className="w-3 h-3" /> Real-time pipeline
                  </p>
                </Card>

                <Card className="rounded-3xl border border-border/70 p-5 bg-card">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">Proposals Dispatched</span>
                    <FileSpreadsheet className="w-4 h-4 text-purple-500" />
                  </div>
                  <p className="text-3xl font-black text-foreground mt-2">{stats.quotesSentCount || 4}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">Average conversion: 42%</p>
                </Card>

                <Card className="rounded-3xl border border-border/70 p-5 bg-card">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">Contract Commission Rate</span>
                    <Award className="w-4 h-4 text-emerald-500" />
                  </div>
                  <p className="text-3xl font-black text-foreground mt-2">
                    {agentProfile?.commissionPct || 10}%
                  </p>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
                    Net wholesale discount unlocked
                  </p>
                </Card>

                <Card className="rounded-3xl border border-border/70 p-5 bg-card">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">Tourism Accreditation</span>
                    <ShieldCheck className="w-4 h-4 text-primary" />
                  </div>
                  <div className="mt-2">
                    {verificationStatus === 'APPROVED' ? (
                      <Badge className="bg-emerald-500 text-white font-bold text-xs">Verified Partner</Badge>
                    ) : (
                      <Badge variant="outline" className="text-amber-500 border-amber-500/40 text-xs">
                        Action Required
                      </Badge>
                    )}
                  </div>
                  <button 
                    onClick={() => setActiveTab('licensing')}
                    className="text-[11px] text-primary hover:underline font-medium mt-2 block"
                  >
                    View accreditation details &rarr;
                  </button>
                </Card>
              </div>

              {/* Quick Pipeline Teaser */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg text-foreground">Priority Inquiries</h3>
                  <Button 
                    variant="link" 
                    onClick={() => setActiveTab('crm')} 
                    className="text-xs text-primary font-semibold p-0 h-auto"
                  >
                    Open Full Kanban Board &rarr;
                  </Button>
                </div>
                <LeadKanbanBoard
                  leads={leads.slice(0, 10)}
                  onUpdateStage={handleUpdateLeadStage}
                  onCreateQuote={handleOpenQuoteModal}
                />
              </div>
            </div>
          )}

          {/* TAB 2: CRM & LEADS */}
          {activeTab === 'crm' && (
            <LeadKanbanBoard
              leads={leads}
              onUpdateStage={handleUpdateLeadStage}
              onCreateQuote={handleOpenQuoteModal}
              isLoading={isLoading}
            />
          )}

          {/* TAB: WHITE-LABEL BRANDING */}
          {activeTab === 'branding' && (
            <WhiteLabelBrandingCard
              isPro={currentPlan !== 'STARTER'}
              onOpenUpgradeModal={() => setSubscriptionModalOpen(true)}
              initialBranding={agencyBranding}
              onSaveBranding={handleSaveBranding}
            />
          )}

          {/* TAB: SAAS SUBSCRIPTION & PLANS */}
          {activeTab === 'subscription' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-primary/10 via-amber-500/10 to-transparent p-6 rounded-3xl border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-lg text-foreground">SaaS Agent Operating System</h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xl">
                    You are currently on the <strong className="text-foreground">{currentPlan.replace('_', ' ')} Plan</strong>. Unlock white-labeled custom branding, unlimited customer leads, and 0% wholesale margin surcharges.
                  </p>
                </div>
                <Button
                  onClick={() => setSubscriptionModalOpen(true)}
                  className="rounded-xl text-xs font-bold gap-2 shrink-0 bg-primary text-primary-foreground shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Change / Upgrade Plan</span>
                </Button>
              </div>

              <WhiteLabelBrandingCard
                isPro={currentPlan !== 'STARTER'}
                onOpenUpgradeModal={() => setSubscriptionModalOpen(true)}
                initialBranding={agencyBranding}
                onSaveBranding={handleSaveBranding}
              />
            </div>
          )}

          {/* TAB 3: LICENSING & ACCREDITATION */}
          {activeTab === 'licensing' && (
            <LicenseVerificationCard
              status={verificationStatus}
              agentCode={agentProfile?.agentCode}
              companyName={agentProfile?.companyName || user?.name}
              licenseNumber={agentProfile?.licenseNumber}
              commissionPct={agentProfile?.commissionPct}
              onSubmitVerification={handleSubmitVerification}
            />
          )}

          {/* TAB 4: QUOTATION GENERATOR */}
          {activeTab === 'quotes' && (
            <div className="space-y-6">
              <div className="bg-card p-6 rounded-3xl border border-border/70 flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-lg text-foreground">Interactive Proposal & WhatsApp Quote Generator</h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xl">
                    Create luxury Kashmir proposals with automatic hotel, cab, and houseboat cost calculations, apply your agency margin, and dispatch via WhatsApp in one tap.
                  </p>
                </div>
                <Button 
                  onClick={() => handleOpenQuoteModal()} 
                  className="rounded-xl text-xs font-bold gap-2 shrink-0 shadow-md shadow-primary/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>Launch Quote Generator</span>
                </Button>
              </div>

              <B2BInventoryBrowser />
            </div>
          )}

          {/* TAB 5: B2B WHOLESALE SUPPLY */}
          {activeTab === 'b2b-supply' && (
            <B2BInventoryBrowser />
          )}

          {/* TAB 6: COMMISSION & LEDGER */}
          {activeTab === 'commission' && (
            <div className="space-y-6">
              <Card className="rounded-3xl border border-border/70 p-6 bg-card">
                <CardTitle className="text-lg">Commission & Settlement Ledger</CardTitle>
                <div className="mt-4 p-8 border border-dashed rounded-2xl flex flex-col items-center justify-center text-center space-y-2">
                  <Award className="w-10 h-10 text-emerald-500/50" />
                  <p className="font-bold text-sm text-foreground">Zero Outstanding Dues</p>
                  <p className="text-xs text-muted-foreground max-w-sm">
                    Platform commissions are credited directly to your connected bank account upon successful client departure.
                  </p>
                </div>
              </Card>
            </div>
          )}
        </main>
      </div>

      {/* SaaS Subscription Upgrade Modal */}
      <SubscriptionPlanModal
        isOpen={subscriptionModalOpen}
        onClose={() => setSubscriptionModalOpen(false)}
        currentPlan={currentPlan}
        onUpgradePlan={handleUpgradePlan}
      />

      {/* Quote Builder Modal */}
      <QuoteBuilderModal
        isOpen={quoteModalOpen}
        onClose={() => setQuoteModalOpen(false)}
        leadData={selectedLeadForQuote}
      />

      <Footer />
    </div>
  );
};

export default AgentDashboard;
