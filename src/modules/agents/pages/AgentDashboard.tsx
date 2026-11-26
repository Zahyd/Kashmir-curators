import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Users,
  RefreshCw,
  Sparkles,
  Award,
  Plus,
  Radio,
  Wifi,
  WifiOff,
  Receipt,
  IndianRupee
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
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
import { AgencyTeamManager } from '../components/AgencyTeamManager';
import { EnterpriseApiGateway } from '../components/EnterpriseApiGateway';
import { CustomDomainCard } from '../components/CustomDomainCard';
import { SupplierCreditCard } from '../components/SupplierCreditCard';
import ItineraryBuilder, { BuilderInquiry } from '@/components/sales/ItineraryBuilder';
import { useRazorpay } from '@/hooks/useRazorpay';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import PageLoading from '@/components/layout/PageLoading';
import {
  agentApi,
  AgentBranding,
  AgentCreditLedgerData,
  AgentProfileDTO,
  AgentStatsResponse,
  getErrMsg
} from '../lib/agentApi';

interface RazorpaySuccessResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RealtimeLeadSocketPayload {
  customerName?: string;
  newStage?: string;
  destination?: string;
  type?: string;
  message?: string;
}

export const AgentDashboard: React.FC = () => {
  const { user, token, isAuthenticated, isLoading: authLoading } = useAuth();
  useRazorpay();
  const [activeTab, setActiveTab] = useState<AgentTab>('overview');

  // Real-Time DB State
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [agentProfile, setAgentProfile] = useState<AgentProfileDTO | null>(null);
  const [agentStats, setAgentStats] = useState<AgentStatsResponse | null>(null);
  const [creditLedger, setCreditLedger] = useState<AgentCreditLedgerData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Real-time connection & sync state
  const [realtimeStatus, setRealtimeStatus] = useState<'connected' | 'reconnecting' | 'offline'>('offline');
  const [realtimeMode, setRealtimeMode] = useState<'websocket' | 'sse' | 'offline'>('offline');
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [realtimeVersion, setRealtimeVersion] = useState(0);

  // Lead Detail Drawer State
  const [selectedLeadForDetail, setSelectedLeadForDetail] = useState<string | null>(null);
  const [leadDrawerOpen, setLeadDrawerOpen] = useState(false);

  // SaaS Plan & DB-backed White-Label State
  const [currentPlan, setCurrentPlan] = useState<SaaSPlanId>('STARTER');
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const [agencyBranding, setAgencyBranding] = useState<AgentBranding>({
    agencyName: user?.name ? `${user.name} Travels` : '',
    agencyTagline: 'Verified Kashmir Tour Operator & B2B Partner',
    logoUrl: '',
    primaryColor: '#d97706',
    phone: user?.phone || '',
    website: ''
  });

  // Quote Builder & New Lead Creation Dialog
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [selectedLeadForQuote, setSelectedLeadForQuote] = useState<BuilderInquiry | LeadItem | null>(null);
  const [newLeadModalOpen, setNewLeadModalOpen] = useState(false);
  const [creatingLead, setCreatingLead] = useState(false);
  const [newLeadForm, setNewLeadForm] = useState({
    customerName: '',
    phone: '',
    email: '',
    destination: 'Srinagar, Gulmarg & Pahalgam',
    duration: '6 Days',
    adultsCount: '2',
    budget: '',
    accommodation: '4-Star Boutique'
  });

  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const orgIdRef = useRef<string | undefined>(user?.organizationId);
  useEffect(() => {
    orgIdRef.current = user?.organizationId || agentStats?.organization?.id || undefined;
  }, [user?.organizationId, agentStats?.organization?.id]);

  const fetchData = useCallback(async () => {
    const authToken = token || localStorage.getItem('auth_token') || '';
    if (!authToken) return;

    try {
      setIsLoading(true);
      const [leadsRes, statsRes, creditRes] = await Promise.allSettled([
        agentApi.getCRMLeads(authToken),
        agentApi.getStats(authToken),
        agentApi.getCreditLedger(authToken)
      ]);

      if (leadsRes.status === 'fulfilled' && Array.isArray(leadsRes.value)) {
        setLeads(leadsRes.value);
      }

      if (statsRes.status === 'fulfilled' && statsRes.value) {
        const st = statsRes.value;
        setAgentStats(st);
        setAgentProfile(st.profile || null);
        if (st.plan) {
          setCurrentPlan((st.plan === 'PROFESSIONAL' ? 'PRO_DMC' : st.plan) as SaaSPlanId);
        }
        if (st.branding) {
          setAgencyBranding(st.branding);
        }
      }

      if (creditRes.status === 'fulfilled' && creditRes.value) {
        setCreditLedger(creditRes.value);
      }

      setLastSyncedAt(new Date().toISOString());
      setRealtimeVersion((v) => v + 1);
    } catch (err) {
      console.error('Failed to load live agent workspace:', err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const scheduleRealtimeSync = useCallback(() => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = setTimeout(() => {
      fetchData();
    }, 150);
  }, [fetchData]);

  // Primary Real-Time Engine: Authenticated Socket.IO + Heartbeat + SSE Fallback
  useEffect(() => {
    if (!isAuthenticated) return;
    const authToken = token || localStorage.getItem('auth_token') || '';
    if (!authToken) return;

    fetchData();

    const socket = io(SOCKET_URL, {
      ...DEFAULT_SOCKET_OPTIONS,
      auth: (cb) => {
        cb({
          token: authToken,
          portalKey: localStorage.getItem('kashmir_portal_key') || ''
        });
      }
    });

    const userId = user?.id;

    const joinAgentChannels = () => {
      if (userId) socket.emit('join-user', userId);
      socket.emit('join-agent', () => {});
      const orgId = orgIdRef.current;
      if (orgId && orgId !== 'kc-primary-dmc') {
        socket.emit('join-tenant', orgId);
      }
    };

    const measureHeartbeat = () => {
      const sentAt = Date.now();
      socket.emit('heartbeat:ping', sentAt, () => {
        setLatencyMs(Math.max(1, Date.now() - sentAt));
      });
    };

    socket.on('connect', () => {
      setRealtimeStatus('connected');
      setRealtimeMode('websocket');
      joinAgentChannels();
      measureHeartbeat();
      scheduleRealtimeSync();
    });

    socket.io.on('reconnect_attempt', () => {
      setRealtimeStatus('reconnecting');
    });

    socket.on('disconnect', () => {
      setRealtimeStatus('reconnecting');
    });

    const heartbeatTimer = setInterval(() => {
      if (socket.connected) measureHeartbeat();
    }, 25000);

    // Subscribe to all live B2B agent, lead, payment & workspace events
    socket.on('NEW_INQUIRY', (lead: RealtimeLeadSocketPayload) => {
      toast.success('New Traveler Inquiry Received', {
        description: `${lead?.customerName || 'Traveler'} • ${lead?.destination || 'Kashmir'}`
      });
      scheduleRealtimeSync();
    });

    socket.on('lead-updated', (data: RealtimeLeadSocketPayload) => {
      toast.info('Pipeline Updated in Real-Time', {
        description: `${data?.customerName || 'Lead'} → ${String(data?.newStage || '').replace(/_/g, ' ')}`
      });
      scheduleRealtimeSync();
    });

    const silentSyncEvents = [
      'STAGE_UPDATED',
      'LEAD_STAGE_UPDATED',
      'LEAD_CLAIMED',
      'lead-assigned',
      'lead-note-added',
      'reminder-scheduled',
      'reminder-updated',
      'PAYMENT_CONFIRMED',
      'BOOKING_STATUS_UPDATED',
      'booking-updated',
      'whatsapp-message-received',
      'agent-workspace-updated'
    ];
    silentSyncEvents.forEach((evt) => {
      socket.on(evt, () => {
        if (evt === 'PAYMENT_CONFIRMED') {
          toast.success('Real-Time Payment Confirmed');
        }
        scheduleRealtimeSync();
      });
    });

    socket.on('new-system-event', (data: RealtimeLeadSocketPayload) => {
      if (
        data?.type === 'CREATE' ||
        data?.type === 'INQUIRY_CREATED' ||
        data?.type === 'LEAD_CAPTURED'
      ) {
        toast.success('Fresh Kashmir Inquiry Received', {
          description: data?.message
        });
      }
      scheduleRealtimeSync();
    });

    // Authenticated SSE fallback stream (keeps delivering if WebSocket/polling drops)
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(agentApi.buildStreamUrl(authToken));
      eventSource.addEventListener('connected', () => {
        setRealtimeStatus((prev) => (prev === 'offline' ? 'connected' : prev));
        setRealtimeMode((prev) => (prev === 'offline' ? 'sse' : prev));
      });
      [
        'NEW_INQUIRY',
        'lead-updated',
        'STAGE_UPDATED',
        'LEAD_STAGE_UPDATED',
        'PAYMENT_CONFIRMED',
        'agent-workspace-updated',
        'new-system-event'
      ].forEach((evtName) => {
        eventSource?.addEventListener(evtName, () => scheduleRealtimeSync());
      });
    } catch {
      // Ignore if EventSource unavailable
    }

    return () => {
      clearInterval(heartbeatTimer);
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      socket.disconnect();
      if (eventSource) eventSource.close();
      setRealtimeStatus('offline');
      setRealtimeMode('offline');
    };
  }, [user?.id, user?.organizationId, token, isAuthenticated, fetchData, scheduleRealtimeSync]);

  if (authLoading) {
    return (
      <PageLoading
        fullScreen
        message="Connecting to Kashmir B2B DMC Network..."
      />
    );
  }

  if (!isAuthenticated) {
    return <AgentLandingPage />;
  }

  const handleUpdateLeadStage = async (leadId: string, newStage: string) => {
    try {
      await agentApi.updateLeadStage(leadId, { leadStage: newStage }, token);
      toast.success(`Lead moved to ${newStage.replace(/_/g, ' ')}`);
      fetchData();
    } catch {
      toast.error('Could not update lead stage');
    }
  };

  const handleSelectLeadForDetail = (lead: LeadItem) => {
    setSelectedLeadForDetail(lead.id);
    setLeadDrawerOpen(true);
  };

  const handleOpenQuoteModal = (lead?: LeadItem) => {
    if (lead) {
      setSelectedLeadForQuote(lead);
      setActiveTab('quotes');
      return;
    }
    setNewLeadModalOpen(true);
  };

  const handleCreatePersistedQuoteLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadForm.customerName.trim()) {
      toast.error('Traveler name is required');
      return;
    }
    try {
      setCreatingLead(true);
      const parsedBudget = Number(String(newLeadForm.budget || '').replace(/[^0-9]/g, '')) || 0;
      const created = await agentApi.createCRMLead(
        {
          customerName: newLeadForm.customerName.trim(),
          phone: newLeadForm.phone.trim(),
          email: newLeadForm.email.trim(),
          destination: newLeadForm.destination.trim() || 'Kashmir',
          duration: newLeadForm.duration.trim() || '6 Days',
          adultsCount: parseInt(newLeadForm.adultsCount, 10) || 2,
          budget: newLeadForm.budget.trim() || undefined,
          netPrice: parsedBudget,
          accommodation: newLeadForm.accommodation,
          leadStage: 'NEW_LEAD'
        },
        token
      );
      toast.success(`Lead ${created.leadId || ''} saved to database! Launching Itinerary Builder...`);
      setNewLeadModalOpen(false);
      setNewLeadForm({
        customerName: '',
        phone: '',
        email: '',
        destination: 'Srinagar, Gulmarg & Pahalgam',
        duration: '6 Days',
        adultsCount: '2',
        budget: '',
        accommodation: '4-Star Boutique'
      });
      setSelectedLeadForQuote(created);
      setActiveTab('quotes');
      fetchData();
    } catch (err: unknown) {
      toast.error(getErrMsg(err, 'Failed to create traveler lead'));
    } finally {
      setCreatingLead(false);
    }
  };

  const handleSubmitVerification = async (data: {
    companyName?: string;
    licenseNumber: string;
    association?: string;
    gstin?: string;
    officeAddress?: string;
    file?: File | null;
  }) => {
    const result = await agentApi.verifyLicense(data, token);
    setAgentProfile(result.profile);
    fetchData();
  };

  const handleUpgradePlan = async (planId: SaaSPlanId, billingCycle: 'MONTHLY' | 'ANNUAL') => {
    if (planId === 'STARTER') {
      setCurrentPlan('STARTER');
      return;
    }

    const authToken = token || localStorage.getItem('auth_token') || '';

    const orderRes = await fetch(`${API_BASE_URL}/payments/razorpay/create-subscription-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({ planId, billingCycle })
    });

    if (!orderRes.ok) {
      const err = await orderRes.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to initialize Razorpay subscription order');
    }

    const orderData = await orderRes.json();

    return new Promise<void>((resolve, reject) => {
      const options = {
        key: orderData.keyId,
        amount: Math.round(orderData.amount * 100),
        currency: orderData.currency || 'INR',
        name: 'Kashmir Connect Travel OS',
        description: `B2B SaaS Subscription - ${planId.replace('_', ' ')} (${billingCycle})`,
        order_id: orderData.orderId,
        handler: async function (response: RazorpaySuccessResponse) {
          try {
            const verifyRes = await fetch(`${API_BASE_URL}/payments/razorpay/verify-subscription`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${authToken}`
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                planId,
                billingCycle
              })
            });

            if (!verifyRes.ok) {
              const verifyErr = await verifyRes.json().catch(() => ({}));
              throw new Error(verifyErr.error || 'Payment verification failed');
            }

            const verifyData = await verifyRes.json();
            setCurrentPlan(planId);
            setAgentProfile(verifyData.profile);
            toast.success(`Successfully Upgraded to ${planId.replace('_', ' ')}!`);
            fetchData();
            resolve();
          } catch (vErr: unknown) {
            toast.error(getErrMsg(vErr, 'Verification error'));
            reject(vErr);
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || ''
        },
        theme: { color: '#D4AF37' },
        modal: {
          ondismiss: function () {
            toast.info('Subscription checkout cancelled');
            reject(new Error('Payment cancelled'));
          }
        }
      };

      const razorpayCtor = (window as unknown as { Razorpay?: new (opts: typeof options) => { open: () => void } }).Razorpay;
      if (razorpayCtor) {
        const rzp = new razorpayCtor(options);
        rzp.open();
      } else {
        toast.error('Razorpay Checkout SDK could not load in browser. Check network/adblocker.');
        reject(new Error('Razorpay SDK unavailable'));
      }
    });
  };

  const handleSaveBranding = async (branding: AgentBranding) => {
    const res = await agentApi.updateBranding(branding, token);
    setAgencyBranding(res.branding);
    fetchData();
  };

  const verificationStatus = agentProfile?.status || (user?.role === 'agent' ? 'APPROVED' : 'NOT_APPLIED');
  const displayAgentCode = agentProfile?.agentCode || (user?.id ? `AGT-${user.id.slice(0, 6).toUpperCase()}` : 'AGT-PENDING');
  const displayCompanyName =
    agencyBranding?.agencyName || agentProfile?.companyName || agentStats?.organization?.name || user?.name || 'Registered Travel Partner';

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col overflow-x-hidden selection:bg-amber-500 selection:text-black">
      <Navbar />

      <div className="flex-1 flex flex-col lg:flex-row pt-20 sm:pt-24">
        <AgentSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          verificationStatus={verificationStatus}
          plan={currentPlan}
          agentCode={displayAgentCode}
          companyName={displayCompanyName}
        />

        <main className="flex-1 min-w-0 p-3.5 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          <ErrorBoundary variant="panel">
            {/* Top Command Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-5">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      realtimeStatus === 'connected'
                        ? 'bg-emerald-500 animate-pulse'
                        : realtimeStatus === 'reconnecting'
                          ? 'bg-amber-500 animate-ping'
                          : 'bg-slate-400'
                    }`}
                  />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    B2B DMC Workspace
                  </span>
                  <span className="text-[10px] bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold px-2 py-0.5 rounded-full">
                    {currentPlan.replace('_', ' ')}
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-mono gap-1 ${
                      realtimeStatus === 'connected'
                        ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5'
                        : 'border-amber-500/30 text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {realtimeStatus === 'connected' ? (
                      <>
                        <Wifi className="w-3 h-3" />
                        <span>
                          LIVE ({realtimeMode === 'websocket' ? 'WS' : 'SSE'}
                          {latencyMs !== null ? ` • ${latencyMs}ms` : ''})
                        </span>
                      </>
                    ) : (
                      <>
                        <WifiOff className="w-3 h-3" />
                        <span>{realtimeStatus === 'reconnecting' ? 'RECONNECTING' : 'SYNCED'}</span>
                      </>
                    )}
                  </Badge>
                </div>
                <h1 className="text-2xl font-black text-foreground tracking-tight mt-1">
                  {activeTab === 'overview' && 'Agent Command Desk'}
                  {activeTab === 'crm' && 'Travel CRM & Lead Pipeline'}
                  {activeTab === 'branding' && 'White-Label Agency Identity & Itinerary Styling'}
                  {activeTab === 'team' && 'Agency Team & Staff Seats'}
                  {activeTab === 'enterprise-api' && 'B2B XML/REST Live Inventory Feed'}
                  {activeTab === 'custom-domain' && 'Custom Domain Client Portal'}
                  {activeTab === 'credit' && 'Net-15 Supplier Credit & Escrow'}
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
                <UsageQuotaMeter
                  plan={currentPlan}
                  leadsUsed={agentStats?.monthlyLeadsUsed ?? leads.length}
                  leadsLimit={agentStats?.leadsLimit ?? 15}
                  onOpenUpgradeModal={() => setSubscriptionModalOpen(true)}
                />

                <CRMBIDashboard
                  refreshTrigger={realtimeVersion}
                  liveConnected={realtimeStatus === 'connected'}
                  lastSyncedAt={lastSyncedAt}
                  onRefreshRequested={fetchData}
                />

                <div className="space-y-4 pt-4 border-t border-border/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-lg text-foreground">Active Lead Pipeline (Drag & Drop)</h3>
                      <p className="text-xs text-muted-foreground">Click any card to open Traveler Profile & AI Copilot</p>
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
                        Your travel leads stream here in real time when guests submit requests or when you create a new quotation.
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

            {/* TAB: AGENCY TEAM SEATS */}
            {activeTab === 'team' && (
              <AgencyTeamManager
                plan={currentPlan}
                onOpenUpgradeModal={() => setSubscriptionModalOpen(true)}
                agencyName={displayCompanyName}
                refreshTrigger={realtimeVersion}
              />
            )}

            {/* TAB: ENTERPRISE XML/REST API FEED */}
            {activeTab === 'enterprise-api' && (
              <EnterpriseApiGateway
                isEnterprise={currentPlan === 'ENTERPRISE'}
                onOpenUpgradeModal={() => setSubscriptionModalOpen(true)}
                agencyCode={displayAgentCode}
                refreshTrigger={realtimeVersion}
              />
            )}

            {/* TAB: CUSTOM DOMAIN PORTAL */}
            {activeTab === 'custom-domain' && (
              <CustomDomainCard
                isEnterprise={currentPlan === 'ENTERPRISE'}
                onOpenUpgradeModal={() => setSubscriptionModalOpen(true)}
                agencyName={displayCompanyName}
                refreshTrigger={realtimeVersion}
              />
            )}

            {/* TAB: NET-15 SUPPLIER CREDIT & ESCROW */}
            {activeTab === 'credit' && (
              <SupplierCreditCard
                isEnterprise={currentPlan === 'ENTERPRISE'}
                onOpenUpgradeModal={() => setSubscriptionModalOpen(true)}
                agencyName={displayCompanyName}
                agencyCode={displayAgentCode}
                refreshTrigger={realtimeVersion}
              />
            )}

            {/* TAB: SAAS SUBSCRIPTION & PLANS */}
            {activeTab === 'subscription' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-primary/10 via-amber-500/10 to-transparent p-6 rounded-3xl border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-lg text-foreground">SaaS Agent Operating System</h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-xl">
                      Active tier: <strong className="text-foreground">{currentPlan.replace('_', ' ')}</strong>. Upgrade to unlock white-label database persistence, multi-seat team access, and wholesale net tariffs.
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
                {selectedLeadForQuote ? (
                  <ItineraryBuilder
                    inquiry={{ ...selectedLeadForQuote, status: (selectedLeadForQuote as { status?: string }).status || 'New' } as BuilderInquiry}
                    onBack={() => setSelectedLeadForQuote(null)}
                    agencyBranding={agencyBranding}
                    planTier={currentPlan}
                  />
                ) : (
                  <div className="space-y-6">
                    <div className="bg-card p-6 rounded-3xl border border-border/70 flex flex-col md:flex-row items-center justify-between gap-4">
                      <div>
                        <h3 className="font-bold text-lg text-foreground">Interactive Proposal & WhatsApp Quote Generator</h3>
                        <p className="text-xs text-muted-foreground mt-1 max-w-xl">
                          Select an existing database inquiry below or create a persisted lead to launch bespoke itinerary curation.
                        </p>
                      </div>
                      <Button
                        onClick={() => handleOpenQuoteModal()}
                        className="rounded-xl text-xs font-bold gap-2 shrink-0 shadow-md shadow-primary/20 bg-primary text-primary-foreground"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Create New Quotation</span>
                      </Button>
                    </div>

                    {leads.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-sm font-bold text-foreground">Select an Active Traveler Lead</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {leads.map((l) => (
                            <Card
                              key={l.id}
                              className="p-4 rounded-2xl hover:border-amber-500/50 cursor-pointer transition-all bg-card"
                              onClick={() => handleOpenQuoteModal(l)}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-bold text-sm text-foreground">{l.customerName}</span>
                                <Badge variant="outline" className="text-[10px]">{l.leadStage}</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mb-3">
                                {l.destination} • {l.duration} • {l.travelers}
                              </p>
                              <Button size="sm" variant="secondary" className="w-full text-xs font-bold">
                                Open Itinerary Builder &rarr;
                              </Button>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    <B2BInventoryBrowser refreshTrigger={realtimeVersion} />
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: B2B WHOLESALE SUPPLY */}
            {activeTab === 'b2b-supply' && <B2BInventoryBrowser refreshTrigger={realtimeVersion} />}

            {/* TAB 6: COMMISSION & EARNINGS LEDGER */}
            {activeTab === 'commission' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card className="rounded-3xl border border-border/70 p-5 bg-card">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Confirmed Booking Volume
                    </span>
                    <div className="text-2xl font-black text-foreground mt-1 font-mono flex items-center gap-1">
                      <IndianRupee className="w-5 h-5 text-amber-500" />
                      {(creditLedger?.confirmedRevenue ?? agentStats?.confirmedRevenue ?? 0).toLocaleString('en-IN')}
                    </div>
                  </Card>

                  <Card className="rounded-3xl border border-border/70 p-5 bg-card">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Contract Commission ({creditLedger?.commissionPct ?? agentStats?.commissionPct ?? 10}%)
                    </span>
                    <div className="text-2xl font-black text-emerald-500 mt-1 font-mono flex items-center gap-1">
                      <Award className="w-5 h-5" />
                      ₹{(creditLedger?.commissionEarned ?? agentStats?.commissionEarned ?? 0).toLocaleString('en-IN')}
                    </div>
                  </Card>

                  <Card className="rounded-3xl border border-border/70 p-5 bg-card">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Settled Ledger Credits
                    </span>
                    <div className="text-2xl font-black text-primary mt-1 font-mono flex items-center gap-1">
                      <Radio className="w-4 h-4 text-emerald-500" />
                      ₹{(creditLedger?.settledAmount ?? 0).toLocaleString('en-IN')}
                    </div>
                  </Card>
                </div>

                <Card className="rounded-3xl border border-border/70 p-6 bg-card space-y-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Receipt className="w-5 h-5 text-primary" />
                      <span>Commission & Settlement Ledger</span>
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoading} className="rounded-xl text-xs gap-1.5">
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                      <span>Refresh</span>
                    </Button>
                  </div>

                  {!creditLedger?.entries?.length ? (
                    <div className="p-8 border border-dashed rounded-2xl flex flex-col items-center justify-center text-center space-y-2">
                      <Award className="w-10 h-10 text-emerald-500/50" />
                      <p className="font-bold text-sm text-foreground">No Settlement Transactions Logged Yet</p>
                      <p className="text-xs text-muted-foreground max-w-sm">
                        Verified client payments and B2B settlements recorded in PostgreSQL stream here automatically.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-border/60 text-muted-foreground text-[11px] font-semibold uppercase">
                            <th className="py-2.5 px-3">Transaction ID</th>
                            <th className="py-2.5 px-3">Date</th>
                            <th className="py-2.5 px-3">Details</th>
                            <th className="py-2.5 px-3">Amount</th>
                            <th className="py-2.5 px-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                          {creditLedger.entries.map((tx) => (
                            <tr key={tx.id} className="hover:bg-muted/30">
                              <td className="py-2.5 px-3 font-mono font-bold text-foreground">{tx.id}</td>
                              <td className="py-2.5 px-3 text-muted-foreground">{new Date(tx.date).toLocaleDateString('en-IN')}</td>
                              <td className="py-2.5 px-3 text-foreground">{tx.description}</td>
                              <td className="py-2.5 px-3 font-mono font-bold text-foreground">₹{tx.amount.toLocaleString('en-IN')}</td>
                              <td className="py-2.5 px-3">
                                <Badge variant="outline" className="text-[10px] font-bold">{tx.status}</Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>
              </div>
            )}
          </ErrorBoundary>
        </main>
      </div>

      {/* Persisted New Quotation / Traveler Lead Modal */}
      <Dialog open={newLeadModalOpen} onOpenChange={setNewLeadModalOpen}>
        <DialogContent className="max-w-lg rounded-3xl p-6 bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Plus className="w-5 h-5 text-primary" />
              <span>Create Traveler Quotation Lead</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Saves a real inquiry record to PostgreSQL and launches Itinerary Builder immediately.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreatePersistedQuoteLead} className="space-y-3.5 py-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Traveler Name</Label>
              <Input
                required
                placeholder="e.g. Aarav Mehta"
                value={newLeadForm.customerName}
                onChange={(e) => setNewLeadForm({ ...newLeadForm, customerName: e.target.value })}
                className="rounded-xl text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">WhatsApp / Phone</Label>
                <Input
                  placeholder="+91 98765 43210"
                  value={newLeadForm.phone}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, phone: e.target.value })}
                  className="rounded-xl text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Email (Optional)</Label>
                <Input
                  type="email"
                  placeholder="guest@example.com"
                  value={newLeadForm.email}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, email: e.target.value })}
                  className="rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Destination Circuit</Label>
                <Input
                  value={newLeadForm.destination}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, destination: e.target.value })}
                  className="rounded-xl text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Duration</Label>
                <Input
                  value={newLeadForm.duration}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, duration: e.target.value })}
                  className="rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Adults</Label>
                <Input
                  type="number"
                  min={1}
                  value={newLeadForm.adultsCount}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, adultsCount: e.target.value })}
                  className="rounded-xl text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Target Budget (INR)</Label>
                <Input
                  placeholder="e.g. 65000"
                  value={newLeadForm.budget}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, budget: e.target.value })}
                  className="rounded-xl text-xs"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setNewLeadModalOpen(false)} className="rounded-xl text-xs">
                Cancel
              </Button>
              <Button type="submit" disabled={creatingLead} className="rounded-xl text-xs font-bold">
                {creatingLead ? 'Saving Lead...' : 'Create Lead & Open Builder'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <SubscriptionPlanModal
        isOpen={subscriptionModalOpen}
        onClose={() => setSubscriptionModalOpen(false)}
        currentPlan={currentPlan}
        onUpgradePlan={handleUpgradePlan}
      />

      <QuoteBuilderModal
        isOpen={quoteModalOpen}
        onClose={() => setQuoteModalOpen(false)}
        leadData={selectedLeadForQuote}
      />

      <LeadDetailDrawer
        leadId={selectedLeadForDetail}
        open={leadDrawerOpen}
        onClose={() => setLeadDrawerOpen(false)}
        onUpdateLead={fetchData}
        onOpenQuoteBuilder={handleOpenQuoteModal}
        realtimeVersion={realtimeVersion}
      />

      <Footer />
    </div>
  );
};

export default AgentDashboard;
