import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Building2, 
  Search, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  ArrowRight, 
  Copy, 
  ExternalLink, 
  FileText, 
  PhoneCall, 
  RefreshCw,
  HelpCircle,
  Sparkles,
  ChevronRight,
  Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { API_BASE_URL } from '@/lib/api';

export const AgencyStatusPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('ref') || searchParams.get('query') || '';

  const [queryInput, setQueryInput] = useState(initialQuery);
  const [isLoading, setIsLoading] = useState(false);
  const [applicationData, setApplicationData] = useState<any>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);

  const fetchStatus = async (searchVal: string) => {
    if (!searchVal.trim()) {
      toast.error('Please enter your Application Reference or registered email');
      return;
    }

    try {
      setIsLoading(true);
      setHasSearched(true);
      const res = await fetch(`${API_BASE_URL}/agents/application-status/${encodeURIComponent(searchVal.trim())}`);
      
      if (!res.ok) {
        if (res.status === 404) {
          setApplicationData(null);
          toast.error('No agency application found matching that reference or email.');
          return;
        }
        throw new Error('Failed to retrieve application status');
      }

      const data = await res.json();
      setApplicationData(data);
      // Update URL query param quietly
      setSearchParams({ ref: data.applicationRef });
    } catch (err: any) {
      setApplicationData(null);
      toast.error(err.message || 'Error fetching status. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      fetchStatus(initialQuery);
    }
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStatus(queryInput);
  };

  const handleCopyRef = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRef(true);
    toast.success('Application reference copied to clipboard');
    setTimeout(() => setCopiedRef(false), 2000);
  };

  // Stepper calculations
  const getStepProgress = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return 1;
      case 'UNDER_REVIEW':
        return 2;
      case 'DOCUMENTS_VERIFIED':
        return 3;
      case 'APPROVED':
        return 4;
      case 'NEEDS_INFO':
        return 2;
      case 'REJECTED':
        return 2;
      default:
        return 1;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-amber-500 selection:text-black">
      <Navbar />

      <main className="flex-1 pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        {/* Header Breadcrumb & Title */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs font-bold uppercase tracking-wider mb-4">
            <Building2 className="w-3.5 h-3.5" />
            <span>Kashmir B2B Partner Network</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-extrabold tracking-tight text-foreground">
            Track Agency Application Status
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2.5">
            Real-time verification progress for your Kashmir Curators B2B wholesale access and travel CRM licensing.
          </p>
        </div>

        {/* Search Bar Box */}
        <Card className="rounded-3xl border-border/80 shadow-lg bg-card/60 backdrop-blur-md mb-10 overflow-hidden">
          <CardContent className="p-4 sm:p-6">
            <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-stretch gap-3">
              <div className="relative flex-1">
                <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Enter Application Ref (e.g. KCB2B-2026-4821) or registered email..."
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                  className="pl-12 h-13 rounded-2xl bg-background/80 border-border text-foreground font-medium text-sm focus-visible:ring-amber-500"
                />
              </div>
              <Button
                type="submit"
                disabled={isLoading}
                className="h-13 px-8 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shrink-0 shadow-md shadow-amber-500/20"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Checking...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <span>Check Status</span>
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Status Results Display */}
        {applicationData && (
          <div className="space-y-8 animate-fade-in">
            {/* Top Overview Card */}
            <Card className="rounded-3xl border-border bg-card shadow-xl overflow-hidden">
              <div className="p-6 sm:p-8 border-b border-border/60 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-amber-500/5 via-transparent to-transparent">
                <div>
                  <div className="flex flex-wrap items-center gap-2.5 mb-2">
                    <h2 className="text-2xl font-display font-extrabold text-foreground">
                      {applicationData.agencyName}
                    </h2>
                    <Badge variant="outline" className="border-amber-500/40 text-amber-700 dark:text-amber-400 font-bold text-xs uppercase px-2.5 py-0.5">
                      {applicationData.businessCategory?.replace(/_/g, ' ') || 'TOUR OPERATOR'}
                    </Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
                    <span>Authorized Rep: <strong className="text-foreground">{applicationData.authorizedPerson}</strong></span>
                    <span>•</span>
                    <span>Plan: <strong className="text-foreground">{applicationData.selectedPlan || 'STARTER'}</strong></span>
                  </p>
                </div>

                {/* Application Ref Badge with Copy */}
                <div className="flex items-center gap-2 bg-muted/60 px-4 py-2.5 rounded-2xl border border-border shrink-0">
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Application Ref</p>
                    <p className="text-sm font-mono font-black text-foreground">{applicationData.applicationRef}</p>
                  </div>
                  <button
                    onClick={() => handleCopyRef(applicationData.applicationRef)}
                    title="Copy reference code"
                    className="p-2 hover:bg-background rounded-xl transition-colors text-muted-foreground hover:text-foreground"
                  >
                    {copiedRef ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Status Alert Banner */}
              <div className="p-6 sm:p-8">
                {applicationData.status === 'APPROVED' && (
                  <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                        <span>Application Approved — B2B Wholesale Access Active</span>
                        <Badge className="bg-emerald-600 text-white text-[10px] uppercase font-black">Verified Partner</Badge>
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        Congratulations! Your agency credentials have been verified by the Srinagar Operations Desk. Your wholesale tariffs and CRM dashboard access are now unlocked.
                      </p>
                      {applicationData.adminRemarks && (
                        <p className="text-xs bg-emerald-500/15 text-emerald-950 dark:text-emerald-200 p-2.5 rounded-xl mt-2 font-mono">
                          Desk Remarks: {applicationData.adminRemarks}
                        </p>
                      )}
                      <div className="pt-3">
                        <Button
                          asChild
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md"
                        >
                          <Link to="/auth?mode=login&redirect=/agent">
                            <span>Sign In to Agent CRM Desk</span>
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {applicationData.status === 'SUBMITTED' && (
                  <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Clock className="w-6 h-6 animate-pulse" />
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                        <span>Application Submitted — Under Review</span>
                        <Badge className="bg-amber-500 text-slate-950 text-[10px] uppercase font-black">In Queue</Badge>
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        Your application has been received and queued for review with the Srinagar Operations Desk. Verification typically takes <strong>24 to 48 hours</strong>. No payment is required until verification is finalized.
                      </p>
                    </div>
                  </div>
                )}

                {applicationData.status === 'UNDER_REVIEW' && (
                  <div className="p-5 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                        <span>Document Verification in Progress</span>
                        <Badge className="bg-blue-600 text-white text-[10px] uppercase font-black">Compliance Audit</Badge>
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        Our compliance team is verifying your J&K Tourism registration and GST details. You will receive an official WhatsApp confirmation once authorized.
                      </p>
                    </div>
                  </div>
                )}

                {applicationData.status === 'DOCUMENTS_VERIFIED' && (
                  <div className="p-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                        <span>Documents Verified — Finalizing Tariffs Setup</span>
                        <Badge className="bg-indigo-600 text-white text-[10px] uppercase font-black">Step 3 of 4</Badge>
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        Your documents are approved. Our hotel contract desk is provisioning your wholesale rates.
                      </p>
                    </div>
                  </div>
                )}

                {applicationData.status === 'NEEDS_INFO' && (
                  <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                        <span>Additional Information Required</span>
                        <Badge className="bg-rose-600 text-white text-[10px] uppercase font-black">Action Needed</Badge>
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        The reviewer requested additional documents before your B2B account can be authorized.
                      </p>
                      {applicationData.adminRemarks && (
                        <p className="text-xs bg-rose-500/15 text-rose-950 dark:text-rose-200 p-2.5 rounded-xl mt-2 font-mono">
                          Reviewer Note: {applicationData.adminRemarks}
                        </p>
                      )}
                      <div className="pt-3">
                        <Button
                          asChild
                          variant="outline"
                          className="border-rose-300 dark:border-rose-500/40 text-rose-700 dark:text-rose-300 font-bold rounded-xl"
                        >
                          <a
                            href={`https://wa.me/919419000000?text=${encodeURIComponent(`Hi Kashmir Curators Desk, regarding application ${applicationData.applicationRef}: here are the updated documents.`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Send className="w-4 h-4 mr-2" />
                            Send Documents on WhatsApp
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {applicationData.status === 'REJECTED' && (
                  <div className="p-5 rounded-2xl bg-slate-500/10 border border-slate-500/30 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-500/20 text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0 mt-0.5">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <h3 className="font-bold text-base text-foreground">Application Not Approved</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        We are unable to approve this application at this time based on the documentation provided.
                      </p>
                      {applicationData.adminRemarks && (
                        <p className="text-xs bg-slate-500/15 p-2.5 rounded-xl mt-2 font-mono text-muted-foreground">
                          Reason: {applicationData.adminRemarks}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* 4-Step Visual Timeline */}
                <div className="mt-10 pt-8 border-t border-border/70">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-6">
                    Onboarding Progression
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[
                      { step: 1, title: 'Application Submitted', desc: 'Profile & contact registered' },
                      { step: 2, title: 'Compliance Audit', desc: 'J&K Tourism & GST verification' },
                      { step: 3, title: 'Tariff Provisioning', desc: 'Wholesale B2B net rates unlocked' },
                      { step: 4, title: 'Account Activated', desc: 'Full CRM & white-label access' }
                    ].map((s) => {
                      const currentProgress = getStepProgress(applicationData.status);
                      const isComplete = s.step < currentProgress || (s.step === 4 && applicationData.status === 'APPROVED');
                      const isCurrent = s.step === currentProgress && applicationData.status !== 'APPROVED';

                      return (
                        <div
                          key={s.step}
                          className={`p-4 rounded-2xl border transition-all ${
                            isComplete
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-300'
                              : isCurrent
                              ? 'bg-amber-500/10 border-amber-500/40 text-amber-900 dark:text-amber-300'
                              : 'bg-muted/30 border-border text-muted-foreground opacity-60'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-black">Step 0{s.step}</span>
                            {isComplete ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            ) : isCurrent ? (
                              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-pulse" />
                            ) : (
                              <div className="w-3.5 h-3.5 rounded-full border border-border" />
                            )}
                          </div>
                          <p className="font-bold text-sm text-foreground">{s.title}</p>
                          <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{s.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Submitted Application Metadata Breakdown */}
                <div className="mt-8 pt-8 border-t border-border/70 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div className="p-3 rounded-xl bg-muted/40">
                    <span className="text-muted-foreground block text-[10px] uppercase font-bold">Email</span>
                    <span className="font-medium text-foreground truncate block">{applicationData.email}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/40">
                    <span className="text-muted-foreground block text-[10px] uppercase font-bold">Phone / WhatsApp</span>
                    <span className="font-medium text-foreground block">{applicationData.phone}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/40">
                    <span className="text-muted-foreground block text-[10px] uppercase font-bold">Tourism License</span>
                    <span className="font-medium text-foreground block font-mono">
                      {applicationData.tourismLicenseNo || 'Submitted for audit'}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/40">
                    <span className="text-muted-foreground block text-[10px] uppercase font-bold">Location</span>
                    <span className="font-medium text-foreground block truncate">{applicationData.location}</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Need Help / Support Callout */}
            <div className="p-6 rounded-3xl border border-border bg-card/60 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground">Need expedited clearance for an active inquiry?</h4>
                  <p className="text-xs text-muted-foreground">Connect directly with our Srinagar Ground Operations Desk.</p>
                </div>
              </div>
              <Button
                asChild
                variant="outline"
                className="rounded-xl border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 font-bold text-xs"
              >
                <a
                  href={`https://wa.me/919419000000?text=${encodeURIComponent(`Hi Kashmir Curators Operations Desk, checking status of agency application ${applicationData.applicationRef}.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Chat with Operations Desk
                  <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                </a>
              </Button>
            </div>
          </div>
        )}

        {/* Empty State / Search Guide */}
        {!applicationData && hasSearched && !isLoading && (
          <div className="text-center py-12 px-4 rounded-3xl border border-dashed border-border bg-muted/20">
            <AlertCircle className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-bold text-lg text-foreground">No Application Found</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1">
              We couldn't locate an application matching "{queryInput}". Please double-check your reference code or registered email.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Button
                onClick={() => setQueryInput('')}
                variant="outline"
                className="rounded-xl text-xs font-bold"
              >
                Clear Search
              </Button>
              <Button
                asChild
                className="rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950"
              >
                <Link to="/agent/apply">Apply for B2B Access</Link>
              </Button>
            </div>
          </div>
        )}

        {/* FAQs */}
        <div className="mt-16 pt-12 border-t border-border/80">
          <div className="text-center max-w-xl mx-auto mb-8">
            <h3 className="text-xl font-display font-bold text-foreground">Frequently Asked Questions</h3>
            <p className="text-xs text-muted-foreground mt-1">Everything you need to know about agency verification.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-card border border-border space-y-2">
              <h4 className="font-bold text-sm text-foreground">How long does agency verification take?</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Standard verification takes 24 to 48 business hours. During peak season (Dec–Feb, May–Jul), priority is given to agencies with valid J&K Tourism registration certificates.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-card border border-border space-y-2">
              <h4 className="font-bold text-sm text-foreground">Is any payment required upfront?</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                No. Application submission and initial review are completely free. You only select or confirm your SaaS subscription tier once your wholesale credentials are authenticated.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-card border border-border space-y-2">
              <h4 className="font-bold text-sm text-foreground">Can out-of-state agencies apply?</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Yes. Travel agencies across India (Delhi, Mumbai, Gujarat, Bangalore, Kolkata) are welcomed. You can submit your state GSTIN and business registration to qualify for wholesale partner tier.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-card border border-border space-y-2">
              <h4 className="font-bold text-sm text-foreground">What happens after my account is approved?</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                You will receive sign-in credentials allowing you to log in to the Agent Desk. You can immediately access wholesale hotel/houseboat rates, 1,200+ cabs, and build white-label client quotations.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AgencyStatusPage;
