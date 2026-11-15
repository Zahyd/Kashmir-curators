import React, { useState } from 'react';
import { 
  Building2, 
  KeyRound, 
  ShieldCheck, 
  ArrowRight, 
  Lock, 
  Sparkles, 
  AlertCircle,
  HelpCircle,
  CalendarCheck2
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/lib/api';

export interface HospitalitySession {
  id: string;
  accessKey: string;
  assignedName: string;
  assignedContact?: string;
  designation?: string;
  portalType: string;
  propertyScope: string;
  loginTime: string;
}

interface HospitalityAuthGateProps {
  onAuthenticated: (session: HospitalitySession) => void;
}

export const HospitalityAuthGate: React.FC<HospitalityAuthGateProps> = ({ onAuthenticated }) => {
  const [accessKey, setAccessKey] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessKey.trim()) {
      setErrorMessage('Please enter your unique Portal Access Key');
      return;
    }

    try {
      setIsVerifying(true);
      setErrorMessage('');

      const res = await fetch(`${API_BASE_URL}/hospitality/verify-access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessKey: accessKey.trim(),
          portalType: 'HOSPITALITY'
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Access verification failed');
      }

      toast.success(`Welcome, ${data.session.assignedName}!`, {
        description: `Authenticated for Kashmir Curators Hospitality Desk.`,
        icon: '🏨'
      });

      // Persist session and token locally
      localStorage.setItem('hospitality_session', JSON.stringify(data.session));
      if (data.token) {
        localStorage.setItem('hospitality_token', data.token);
        localStorage.setItem('teamToken', data.token);
      }
      onAuthenticated(data.session);
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid or revoked Access Key.');
      toast.error(err.message || 'Authentication failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const fillSampleKey = () => {
    setAccessKey('KC-HOSP-ALPHA1');
    setErrorMessage('');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full space-y-6">
        
        {/* Brand & Security Seal Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-amber-500" />
            <span>Authorized Operations Desk Gate</span>
          </div>

          <h2 className="text-3xl font-black text-foreground tracking-tight">
            Hospitality Portal Access
          </h2>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
            Enter your Superadmin-generated Reservation Desk Access Key to unlock live hotel availability, dispatch booking vouchers, and manage partner properties.
          </p>
        </div>

        {/* Security Gate Card */}
        <Card className="rounded-[2.5rem] border border-border/80 bg-card/95 backdrop-blur-xl p-8 sm:p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/10 blur-[50px] -mr-16 -mt-16 pointer-events-none" />

          <form onSubmit={handleVerify} className="space-y-6 relative z-10">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span>Unique Access Key</span>
                <span className="text-[10px] text-amber-500 font-mono">e.g. KC-HOSP-XXXX</span>
              </label>

              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  required
                  placeholder="KC-HOSP-XXXX"
                  value={accessKey}
                  onChange={(e) => {
                    setAccessKey(e.target.value.toUpperCase());
                    setErrorMessage('');
                  }}
                  className="pl-10 h-12 rounded-2xl font-mono text-sm uppercase font-bold tracking-wider bg-background border-border focus:ring-amber-500/20"
                />
              </div>

              {errorMessage && (
                <div className="flex items-center gap-2 text-rose-500 text-xs pt-1 animate-shake">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>

            <Button
              type="submit"
              disabled={isVerifying}
              className="w-full h-12 rounded-2xl text-xs font-black uppercase tracking-widest bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 gap-2"
            >
              {isVerifying ? (
                <>
                  <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Unlock Hospitality Desk</span>
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </>
              )}
            </Button>
          </form>

          {/* Quick Helper for Reservation Team */}
          <div className="mt-6 pt-6 border-t border-border/60 text-center space-y-3">
            <p className="text-[11px] text-muted-foreground">
              Don't have an Access ID yet? Contact the Superadmin Director to generate an active Reservation Key.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={fillSampleKey}
              className="rounded-xl text-[11px] font-mono font-bold h-8 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
            >
              Use Initial Key: KC-HOSP-ALPHA1
            </Button>
          </div>
        </Card>

        {/* Security Disclaimers */}
        <div className="flex items-center justify-center gap-4 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Lock className="w-3 h-3 text-emerald-500" />
            256-Bit Encrypted
          </span>
          <span>•</span>
          <span>Role-Scoped Permissions</span>
          <span>•</span>
          <span>Audit Logged</span>
        </div>

      </div>
    </div>
  );
};

export default HospitalityAuthGate;
