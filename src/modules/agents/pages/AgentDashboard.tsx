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
  Plus,
  Loader2
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
import AgentLandingPage from './AgentLandingPage';
import LeadDetailDrawer from '../components/LeadDetailDrawer';
import CRMBIDashboard from '../components/CRMBIDashboard';

export const AgentDashboard: React.FC = () => {
  const { user, token, isAuthenticated, isLoading: authLoading } = useAuth();
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

  // Lead Detail Drawer State
  const [selectedLeadForDetail, setSelectedLeadForDetail] = useState<string | null>(null);
  const [leadDrawerOpen, setLeadDrawerOpen] = useState(false);

  // SaaS Subscription & White-Label State (Clean Default: STARTER)
  const [currentPlan, setCurrentPlan] = useState<SaaSPlanId>(
    (localStorage.getItem('agent_saas_plan') as SaaSPlanId) || 'STARTER'
  );
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  
  // Real Agency Branding (Zero hardcoded fake agency names)
  const [agencyBranding, setAgencyBranding] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('agent_branding');
      return saved ? JSON.parse(saved) : {
        agencyName: user?.name ? `${user.name} Travels` : '',
        agencyTagline: 'Verified Kashmir Tour Operator & B2B Partner',
        logoUrl: '',
        primaryColor: '#d97706',
        phone: user?.phone || '',
        website: ''
      };
    } catch {
      return {
        agencyName: user?.name ? `${user.name} Travels` : '',
        agencyTagline: 'Verified Kashmir Tour Operator & B2B Partner',
        logoUrl: '',
        primaryColor: '#d97706',
        phone: user?.phone || '',
        website: ''
      };
    }
  });

  // Quote builder modal state
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [selectedLeadForQuote, setSelectedLeadForQuote] = useState<any>(null);

  // Fetch leads and agent data
  const fetchData = async () => {
    if (!token && !localStorage.getItem('auth_token')) return;

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
    if (isAuthenticated) {
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
    }
  }, [user?.id, token, isAuthenticated]);

  // Auth Guard: If still checking session, render luxury loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          <p className="text-sm font-semibold text-muted-foreground">Connecting to Kashmir B2B DMC Network...</p>
        </div>
      </div>
    );
  }

  // Auth Guard: If not authenticated, render the dedicated B2B Landing Page
  if (!isAuthenticated) {
    return <AgentLandingPage />;
  }

  const handleUpdateLeadStage = async (leadId: string, newStage: string) => {
    try {
      const authToken = token || localStorage.getItem('auth_token') || '';
      const res = await fetch(`${API_BASE_URL}/crm/leads/${leadId}/stage`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ leadStage: newStage })
      });

      if (!res.ok) throw new Error('Failed to update stage');
      toast.success(`Lead moved to ${newStage.replace(/_/g, ' ')}`);
      fetchData();
    } catch (err) {
      toast.error('Could not update lead stage');
    }
  };

  const handleSelectLeadForDetail = (lead: LeadItem) => {
    setSelectedLeadForDetail(lead.id);
    setLeadDrawerOpen(true);
  };

  const handleOpenQuoteModal = (lead?: LeadItem) => {
    setSelectedLeadForQuote(lead || null);
    setQuoteModalOpen(true);
  };

  const handleSubmitVerification = async (data: { licenseNumber: string; file: File | null }) => {
    const formData = new FormData();
    formData.append('licenseNumber', data.licenseNumber);
    if (data.file) formData.append('licenseFile', data.file);

    const authToken = token || localStorage.getItem('auth_token') || '';
    const res = await fetch(`${API_BASE_URL}/agents/verify-license`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: formData
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to submit accreditation');
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
  
  // Real dynamic agent code and company name (Zero mock values)
  const displayAgentCode = agentProfile?.agentCode || (user?.id ? `AGT-${user.id.slice(0, 6).toUpperCase()}` : 'AGT-PENDING');
  const displayCompanyName = agencyBranding?.agencyName || agentProfile?.companyName || user?.name || 'Registered Travel Partner';

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-amber-500 selection:text-black">
      <Navbar />

      {/* Top spacing to completely clear the fixed floating navbar */}
      <div className="flex-1 flex flex-col lg:flex-row pt-24 sm:pt-28">
        {/* Dedicated Agent Sidebar with real agent metadata */}
        <AgentSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          verificationStatus={verificationStatus}
          plan={currentPlan}
          agentCode={displayAgentCode}
          companyName={displayCompanyName}
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
                <span className="text-[10px] bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold px-2 py-0.5 rounded-full">
                  {currentPlan.replace('_', ' ')}
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
                className="rounded-xl text-xs font-bold gap-1.5 bg-primary text-primary-foreground shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>New Quotation</span>
              </Button>
            </div>
          </div>

          {/* TAB 1: OVERVIEW DASHBOARD */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Executive Business Intelligence & Sales Pipeline Analytics */}
              <CRMBIDashboard />

              {/* Priority Inquiries Section */}
              <div className="space-y-4 pt-4 border-t border-border/50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-foreground">Active Lead Pipeline (Drag & Drop)</h3>
                    <p className="text-xs text-muted-foreground">Click any card to open the Traveler Profile & AI Copilot</p>
                  </div>
                  <Button 
                    variant="link" 
                    onClick={() => setActiveTab('crm')} 
                    className="text-xs text-primary font-semibold p-0 h-auto"
                  >
                    Open Full Kanban Board &rarr;
                  </Button>
                </div>

                {leads.length === 0 ? (
                  <div className="p-8 sm:p-12 rounded-3xl border border-dashed border-border/80 bg-card/50 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
                      <Users className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-base text-foreground">No Inquiries in Pipeline Yet</h4>
                    <p className="text-xs text-muted-foreground max-w-md mx-auto">
                      Your travel leads will appear here automatically when guests submit requests, or you can build a customized proposal right away.
                    </p>
                    <Button
                      onClick={() => handleOpenQuoteModal()}
                      className="rounded-xl text-xs font-bold gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 mt-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Create First Client Quotation</span>
                    </Button>
                  </div>
                ) : (
                  <LeadKanbanBoard
                    leads={leads}
                    onUpdateStage={handleUpdateLeadStage}
                    onCreateQuote={handleOpenQuoteModal}
                    onSelectLead={handleSelectLeadForDetail}
                  />
                )}
              </div>
            </div>
          )}

          {/* TAB 2: CRM & LEADS */}
          {activeTab === 'crm' && (
            <LeadKanbanBoard
              leads={leads}
              onUpdateStage={handleUpdateLeadStage}
              onCreateQuote={handleOpenQuoteModal}
              onSelectLead={handleSelectLeadForDetail}
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
              agentCode={displayAgentCode}
              companyName={displayCompanyName}
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

      {/* Interactive Lead Detail Drawer (Traveler Profile, AI Copilot, Timeline, Notes, Reminders, WhatsApp) */}
      <LeadDetailDrawer
        leadId={selectedLeadForDetail}
        open={leadDrawerOpen}
        onClose={() => setLeadDrawerOpen(false)}
        onUpdateLead={fetchData}
        onOpenQuoteBuilder={handleOpenQuoteModal}
      />

      <Footer />
    </div>
  );
};

export default AgentDashboard;
