import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  CheckCircle2, 
  Copy, 
  ArrowRight, 
  ShieldCheck, 
  Clock, 
  Building2, 
  Sparkles, 
  PhoneCall, 
  FileText, 
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export const AgencySuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const applicationRef = searchParams.get('ref') || 'KCB2B-PENDING';
  const email = searchParams.get('email') || '';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(applicationRef);
    setCopied(true);
    toast.success('Application reference copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-amber-500 selection:text-black">
      <Navbar />

      <main className="flex-1 pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full flex flex-col justify-center">
        {/* Success Header Animation */}
        <div className="text-center max-w-2xl mx-auto mb-8 animate-fade-in">
          <div className="w-20 h-20 rounded-3xl bg-emerald-500/15 border-2 border-emerald-500/30 flex items-center justify-center mx-auto mb-6 text-emerald-600 dark:text-emerald-400 shadow-xl shadow-emerald-500/20">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Application Successfully Submitted</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-display font-black tracking-tight text-foreground">
            Welcome to the Kashmir Curators B2B Partner Network
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground mt-4 leading-relaxed font-medium">
            Your application for wholesale Kashmir tariffs, AI quote builder, and travel CRM has been registered with our Srinagar Ground Operations Desk.
          </p>
        </div>

        {/* Reference Number Card */}
        <Card className="rounded-3xl border-border bg-card shadow-2xl overflow-hidden mb-8">
          <div className="p-6 sm:p-8 bg-gradient-to-r from-amber-500/10 via-transparent to-transparent border-b border-border/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Your Official Application Reference</p>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="text-2xl sm:text-3xl font-mono font-black text-foreground tracking-wider">
                  {applicationRef}
                </span>
                <button
                  onClick={handleCopy}
                  title="Copy reference"
                  className="p-2 hover:bg-muted rounded-xl transition-colors text-muted-foreground hover:text-foreground"
                >
                  {copied ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="text-center sm:text-right">
              <span className="text-xs text-muted-foreground block">Notification Email:</span>
              <span className="text-sm font-semibold text-foreground">{email || 'Registered Business Email'}</span>
            </div>
          </div>

          <CardContent className="p-6 sm:p-8 space-y-6">
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              <span>What Happens Next? (Verification SLA: 24–48 Hours)</span>
            </h3>

            <div className="grid sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-muted/40 border border-border/70 space-y-2">
                <span className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-400 font-black text-xs flex items-center justify-center">
                  1
                </span>
                <h4 className="font-bold text-sm text-foreground">Document Clearance</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Our compliance team verifies your J&K Tourism license or state GSTIN under the Tourist Trade Act.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-muted/40 border border-border/70 space-y-2">
                <span className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-400 font-black text-xs flex items-center justify-center">
                  2
                </span>
                <h4 className="font-bold text-sm text-foreground">Tariffs Authorization</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Direct B2B net rates for 5-star Gulmarg chalets, houseboats, and 1,200+ cabs are linked to your profile.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-muted/40 border border-border/70 space-y-2">
                <span className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-400 font-black text-xs flex items-center justify-center">
                  3
                </span>
                <h4 className="font-bold text-sm text-foreground">WhatsApp Dispatch</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  You will receive your direct sign-in link and onboarding pack via WhatsApp and official email.
                </p>
              </div>
            </div>

            {/* Zero Charge Reassurance */}
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <p className="text-xs text-emerald-950 dark:text-emerald-200">
                <strong>Zero Upfront Payment Required:</strong> Your application review is 100% free. Any selected software plan billing begins only after your credentials have been verified and you choose to activate your account.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-4">
              <Button
                asChild
                size="lg"
                className="w-full sm:w-auto h-13 px-8 text-sm font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-2xl shadow-lg shadow-amber-500/20"
              >
                <Link to={`/agent/status?ref=${encodeURIComponent(applicationRef)}`}>
                  <span>Track Application Status</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full sm:w-auto h-13 px-6 text-sm font-bold border-border rounded-2xl"
              >
                <Link to="/agent">
                  Return to B2B DMC Home
                </Link>
              </Button>

              <Button
                asChild
                variant="ghost"
                size="lg"
                className="w-full sm:w-auto h-13 px-6 text-sm font-bold text-muted-foreground hover:text-foreground rounded-2xl"
              >
                <a
                  href={`https://wa.me/919419000000?text=${encodeURIComponent(`Hi Kashmir Curators Operations Desk, I just submitted application ${applicationRef}. Looking forward to connecting!`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <PhoneCall className="w-4 h-4 text-emerald-500" />
                  <span>Chat with Desk</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Pro Tip while you wait */}
        <div className="p-6 rounded-3xl border border-border/80 bg-card/60 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-foreground">Pro-Tip for Fast-Track Activation</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Have your high-resolution PNG agency logo and primary brand color ready. You can plug them into the White-Label Branding settings the moment your account is activated.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AgencySuccessPage;
