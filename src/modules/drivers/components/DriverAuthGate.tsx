import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  ShieldCheck,
  KeyRound,
  Car,
  UserCheck,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Snowflake,
  Mountain,
  ArrowRight,
  RefreshCw,
  LogOut,
  FileBadge2,
  CreditCard,
  Loader2,
} from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DriverProfileData } from '../types/driver';

export type DriverAuthTab = 'portalKey' | 'login' | 'onboard';

interface DriverAuthGateProps {
  mode: 'LOGIN' | 'PENDING_KYC' | 'REJECTED_KYC' | 'APPLY_CURRENT_USER';
  driverProfile?: DriverProfileData | null;
  currentUserEmail?: string | null;
  currentUserName?: string | null;
  onAuthenticated: (payload: {
    token: string;
    portalKey?: string;
    user?: Record<string, unknown>;
  }) => Promise<void> | void;
  onRefreshStatus?: () => Promise<void>;
  onLogout?: () => void;
}

export const DriverAuthGate: React.FC<DriverAuthGateProps> = ({
  mode,
  driverProfile,
  currentUserEmail,
  currentUserName,
  onAuthenticated,
  onRefreshStatus,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<DriverAuthTab>(() =>
    mode === 'APPLY_CURRENT_USER' ? 'onboard' : 'portalKey'
  );
  useEffect(() => {
    if (mode === 'APPLY_CURRENT_USER') {
      setActiveTab('onboard');
    }
  }, [mode]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Portal Key State
  const [portalKeyInput, setPortalKeyInput] = useState('');

  // Email Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Self-Onboarding / Resubmit KYC State
  const [onboardStep, setOnboardStep] = useState<1 | 2>(1);
  const [name, setName] = useState(currentUserName || driverProfile?.name || '');
  const [email, setEmail] = useState(currentUserEmail || driverProfile?.email || '');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState(driverProfile?.phone || '');
  const [licenseNumber, setLicenseNumber] = useState(driverProfile?.licenseNumber || '');
  const [aadhaar, setAadhaar] = useState('');
  const [psvBadgeNumber, setPsvBadgeNumber] = useState(driverProfile?.psvBadgeNumber || '');
  const [unionName, setUnionName] = useState(
    driverProfile?.unionName || 'All Kashmir Taxi Federation (AKTF)'
  );
  const [unionBadgeNumber, setUnionBadgeNumber] = useState(driverProfile?.unionBadgeNumber || '');
  const [vehicleModel, setVehicleModel] = useState('Toyota Innova Crysta');
  const [vehicleRegNo, setVehicleRegNo] = useState(driverProfile?.vehicleRegNo || '');
  const [snowChains, setSnowChains] = useState(true);
  const [fourWheelDrive, setFourWheelDrive] = useState(true);
  const [skiRack, setSkiRack] = useState(false);
  const [upiId, setUpiId] = useState(driverProfile?.upiId || 'driver@okaxis');

  const handlePortalKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const cleaned = portalKeyInput.trim().toUpperCase();
    if (!cleaned.startsWith('KC-DRV-')) {
      setErrorMsg('Enter a valid Driver Portal Key starting with KC-DRV- (issued by Kashmir Curators).');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/portal-keys/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessKey: cleaned, portalType: 'DRIVER' }),
      });
      const data = await res.json();
      if (!res.ok || !data.token) {
        setErrorMsg(data.error || 'Invalid or revoked Driver Portal Key.');
        return;
      }

      toast.success('Portal Key Authenticated', {
        description: `Welcome aboard, ${data.session?.assignedName || 'Pilot'}`,
      });
      await onAuthenticated({ token: data.token, portalKey: cleaned, user: data.session });
    } catch {
      setErrorMsg('Network error verifying portal key.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!loginEmail.trim() || !loginPassword) {
      setErrorMsg('Email and password are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail.trim().toLowerCase(), password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok || !data.token) {
        setErrorMsg(data.error || 'Invalid chauffeur credentials.');
        return;
      }
      const role = String(data.user?.role || '').toLowerCase();
      if (!['driver', 'admin', 'operations'].includes(role)) {
        setErrorMsg('This account is not authorized as a chauffeur or fleet operator.');
        return;
      }
      toast.success('Chauffeur Signed In', { description: `Cockpit synced for ${data.user?.name}` });
      await onAuthenticated({ token: data.token, user: data.user });
    } catch {
      setErrorMsg('Unable to reach Kashmir Curators dispatch server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelfOnboard = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const activeToken =
      mode === 'APPLY_CURRENT_USER'
        ? localStorage.getItem('auth_token') || localStorage.getItem('driver_portal_token') || ''
        : '';

    if (activeToken && currentUserEmail && email.trim().toLowerCase() === currentUserEmail.toLowerCase()) {
      if (!licenseNumber.trim()) {
        setErrorMsg('Commercial driving license number is required.');
        setOnboardStep(1);
        return;
      }
      setIsSubmitting(true);
      try {
        const res = await fetch(`${API_BASE_URL}/driver/apply`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${activeToken}`,
          },
          body: JSON.stringify({
            licenseNumber: licenseNumber.trim().toUpperCase(),
            vehicleRegNo: vehicleRegNo.trim().toUpperCase() || 'PENDING-PLATE',
            psvBadgeNumber: psvBadgeNumber.trim() || undefined,
            unionName,
            unionBadgeNumber: unionBadgeNumber.trim() || undefined,
            upiId: upiId.trim() || 'driver@okaxis',
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setErrorMsg(data.error || 'Failed to submit KYC application.');
          return;
        }
        toast.success('KYC Application Submitted!', {
          description: 'Awaiting Kashmir Curators Admin verification.',
        });
        await onAuthenticated({ token: activeToken, user: { name: currentUserName, email: currentUserEmail } });
        return;
      } catch {
        setErrorMsg('Network error submitting KYC application.');
        return;
      } finally {
        setIsSubmitting(false);
      }
    }

    if (!name.trim() || !email.trim() || password.length < 6 || !licenseNumber.trim()) {
      setErrorMsg('Full name, email, 6+ character password, and driving license number are required.');
      setOnboardStep(1);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/driver/onboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          phone: phone.trim(),
          licenseNumber: licenseNumber.trim().toUpperCase(),
          aadhaar: aadhaar.trim() || 'PENDING-KYC',
          psvBadgeNumber: psvBadgeNumber.trim() || undefined,
          unionName,
          unionBadgeNumber: unionBadgeNumber.trim() || undefined,
          vehicleModel: vehicleModel.trim(),
          vehicleRegNo: vehicleRegNo.trim().toUpperCase() || 'PENDING-PLATE',
          snowChains,
          fourWheelDrive,
          skiRack,
          upiId: upiId.trim() || 'driver@okaxis',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.token) {
        setErrorMsg(data.error || 'Failed to submit KYC application.');
        return;
      }
      toast.success('KYC Application Submitted!', {
        description: 'Awaiting Kashmir Curators Admin verification.',
      });
      await onAuthenticated({ token: data.token, user: data.user });
    } catch {
      setErrorMsg('Network error submitting KYC application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResubmitKyc = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const activeToken =
      localStorage.getItem('driver_portal_token') || localStorage.getItem('auth_token') || '';
    if (!activeToken) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/driver/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${activeToken}`,
        },
        body: JSON.stringify({
          phone: phone.trim() || undefined,
          licenseNumber: licenseNumber.trim().toUpperCase(),
          unionName,
          unionBadgeNumber: unionBadgeNumber.trim() || undefined,
          psvBadgeNumber: psvBadgeNumber.trim() || undefined,
          upiId: upiId.trim() || undefined,
          resubmit: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to resubmit KYC documents.');
        return;
      }
      toast.success('KYC Resubmitted', {
        description: 'Your updated credentials are back in the Admin Review Queue.',
      });
      await onRefreshStatus?.();
    } catch {
      setErrorMsg('Network error updating KYC.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (mode === 'PENDING_KYC' || mode === 'REJECTED_KYC') {
    const isRejected = mode === 'REJECTED_KYC';
    return (
      <div className="fixed inset-0 z-50 bg-[#07090E] text-white flex items-center justify-center p-4 overflow-y-auto">
        <div className="w-full max-w-lg rounded-3xl bg-[#0F141C] border border-white/10 p-6 sm:p-8 shadow-2xl space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
                  isRejected
                    ? 'bg-rose-500/15 border-rose-500/40 text-rose-400'
                    : 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                }`}
              >
                {isRejected ? <AlertTriangle className="w-6 h-6" /> : <Clock className="w-6 h-6 animate-pulse" />}
              </div>
              <div>
                <Badge
                  className={`mb-1 border-none text-[10px] font-black uppercase tracking-wider ${
                    isRejected ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                  }`}
                >
                  {isRejected ? 'KYC Verification Declined' : 'KYC Verification Pending'}
                </Badge>
                <h2 className="text-xl font-black text-white">
                  {isRejected ? 'Action Required on Your Profile' : 'Awaiting Command Desk Approval'}
                </h2>
              </div>
            </div>
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-black/50 border border-white/10 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-white/50">Chauffeur Name</span>
              <span className="font-bold text-white">{driverProfile?.name || currentUserName || 'Applicant'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Commercial License</span>
              <span className="font-mono font-bold text-amber-400">{driverProfile?.licenseNumber || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Registered Plate</span>
              <span className="font-mono font-bold text-white">{driverProfile?.vehicleRegNo || '—'}</span>
            </div>
            {driverProfile?.unionName && (
              <div className="flex justify-between">
                <span className="text-white/50">Affiliated Union</span>
                <span className="font-semibold text-white">{driverProfile.unionName}</span>
              </div>
            )}
            {driverProfile?.rejectionReason && (
              <div className="mt-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200">
                <strong>Admin Note:</strong> {driverProfile.rejectionReason}
              </div>
            )}
          </div>

          {!isRejected ? (
            <div className="space-y-3">
              <p className="text-xs text-white/60 leading-relaxed">
                Your documents are queued for verification by Kashmir Curators Fleet Operations. As soon as an
                administrator approves your KYC, this cockpit will automatically unlock in real time.
              </p>
              <Button
                type="button"
                onClick={() => onRefreshStatus?.()}
                className="w-full h-11 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Check Approval Status Now
              </Button>
            </div>
          ) : (
            <form onSubmit={handleResubmitKyc} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-white/50 block mb-1">
                    Driving License No.
                  </label>
                  <Input
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="JK01-2023-XXXX"
                    className="bg-black/60 border-white/15 text-white h-10 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-white/50 block mb-1">
                    Union Badge Number
                  </label>
                  <Input
                    value={unionBadgeNumber}
                    onChange={(e) => setUnionBadgeNumber(e.target.value)}
                    placeholder="AKTF-904"
                    className="bg-black/60 border-white/15 text-white h-10 text-xs"
                  />
                </div>
              </div>
              {errorMsg && <p className="text-xs text-rose-400">{errorMsg}</p>}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider gap-2"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Resubmit KYC for Admin Review
              </Button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#07090E] text-white flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-3xl bg-[#0F141C] border border-white/10 p-6 sm:p-8 shadow-2xl space-y-5 my-auto">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20">
              <Mountain className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block">
                Kashmir Curators Fleet
              </span>
              <h1 className="text-lg font-black text-white">Chauffeur Command Cockpit</h1>
            </div>
          </div>
          {onLogout && mode === 'APPLY_CURRENT_USER' && (
            <button
              type="button"
              onClick={onLogout}
              className="text-xs text-white/50 hover:text-white flex items-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" /> Switch Account
            </button>
          )}
        </div>

        {/* Auth Method Selector Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-black/50 border border-white/10">
          <button
            type="button"
            onClick={() => {
              setActiveTab('portalKey');
              setErrorMsg(null);
            }}
            className={`py-2 px-2 rounded-xl text-[11px] font-extrabold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'portalKey'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" /> Portal Key
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setErrorMsg(null);
            }}
            className={`py-2 px-2 rounded-xl text-[11px] font-extrabold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'login'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" /> Pilot Login
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('onboard');
              setErrorMsg(null);
            }}
            className={`py-2 px-2 rounded-xl text-[11px] font-extrabold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'onboard'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <FileBadge2 className="w-3.5 h-3.5" /> KYC Sign Up
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-xs text-rose-200 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* TAB 1: KC-DRV Portal Access Key */}
        {activeTab === 'portalKey' && (
          <form onSubmit={handlePortalKeySubmit} className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-100/90 leading-relaxed">
              Enter the official <strong className="font-mono text-amber-300">KC-DRV-*</strong> key issued by Kashmir
              Curators Operations Desk to enter the live cockpit immediately.
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-white/50 block mb-1.5">
                Driver Portal Access Key
              </label>
              <Input
                value={portalKeyInput}
                onChange={(e) => setPortalKeyInput(e.target.value.toUpperCase())}
                placeholder="KC-DRV-XXXXXX"
                data-testid="driver-portal-key-input"
                className="h-12 rounded-xl bg-black/60 border-white/15 text-white font-mono text-sm tracking-widest uppercase"
              />
            </div>
            <Button
              type="submit"
              disabled={isSubmitting}
              data-testid="driver-portal-key-submit"
              className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-slate-950 font-black text-xs uppercase tracking-wider gap-2"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              Unlock Chauffeur Cockpit
            </Button>
          </form>
        )}

        {/* TAB 2: Email + Password Sign In */}
        {activeTab === 'login' && (
          <form onSubmit={handleEmailLogin} className="space-y-3.5">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-white/50 block mb-1">
                Registered Email
              </label>
              <Input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="pilot@kashmircabs.in"
                data-testid="driver-login-email"
                className="h-11 rounded-xl bg-black/60 border-white/15 text-white text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-white/50 block mb-1">
                Password
              </label>
              <Input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                data-testid="driver-login-password"
                className="h-11 rounded-xl bg-black/60 border-white/15 text-white text-sm"
              />
            </div>
            <Button
              type="submit"
              disabled={isSubmitting}
              data-testid="driver-login-submit"
              className="w-full h-12 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider gap-2"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              Sign In to Cockpit
            </Button>
          </form>
        )}

        {/* TAB 3: Chauffeur KYC Self-Onboarding */}
        {activeTab === 'onboard' && (
          <form onSubmit={handleSelfOnboard} className="space-y-3.5">
            {onboardStep === 1 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-white/50 block mb-1">Full Name *</label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Farooq Ahmad Dar"
                      className="bg-black/60 border-white/15 text-white h-10 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-white/50 block mb-1">Mobile Phone</label>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 99065 XXXXX"
                      className="bg-black/60 border-white/15 text-white h-10 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-white/50 block mb-1">Email Address *</label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="farooq@kashmir.in"
                      className="bg-black/60 border-white/15 text-white h-10 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-white/50 block mb-1">Password *</label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="bg-black/60 border-white/15 text-white h-10 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-white/50 block mb-1">
                      Commercial DL No. *
                    </label>
                    <Input
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      placeholder="JK01-2022-884411"
                      className="bg-black/60 border-white/15 text-white h-10 text-xs font-mono uppercase"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-white/50 block mb-1">
                      Aadhaar / PSV Badge
                    </label>
                    <Input
                      value={psvBadgeNumber || aadhaar}
                      onChange={(e) => {
                        setPsvBadgeNumber(e.target.value);
                        setAadhaar(e.target.value);
                      }}
                      placeholder="PSV-SXR-9921"
                      className="bg-black/60 border-white/15 text-white h-10 text-xs font-mono"
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={() => setOnboardStep(2)}
                  className="w-full h-11 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider gap-1.5"
                >
                  Next: Vehicle & Taxi Union Details <ArrowRight className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-white/50 block mb-1">Vehicle Model</label>
                    <Input
                      value={vehicleModel}
                      onChange={(e) => setVehicleModel(e.target.value)}
                      placeholder="Toyota Innova Crysta"
                      className="bg-black/60 border-white/15 text-white h-10 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-white/50 block mb-1">
                      Yellow Plate No.
                    </label>
                    <Input
                      value={vehicleRegNo}
                      onChange={(e) => setVehicleRegNo(e.target.value)}
                      placeholder="JK01C-9942"
                      className="bg-black/60 border-white/15 text-white h-10 text-xs font-mono uppercase"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-white/50 block mb-1">Taxi Union</label>
                    <Input
                      value={unionName}
                      onChange={(e) => setUnionName(e.target.value)}
                      className="bg-black/60 border-white/15 text-white h-10 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-white/50 block mb-1">
                      Union Badge No.
                    </label>
                    <Input
                      value={unionBadgeNumber}
                      onChange={(e) => setUnionBadgeNumber(e.target.value)}
                      placeholder="AKTF-2026-441"
                      className="bg-black/60 border-white/15 text-white h-10 text-xs font-mono uppercase"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold uppercase text-white/50 block mb-1">
                      UPI ID for Instant Payouts
                    </label>
                    <div className="relative">
                      <CreditCard className="w-4 h-4 text-amber-400 absolute left-3 top-3" />
                      <Input
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="yourname@okaxis"
                        className="bg-black/60 border-white/15 text-white h-10 text-xs pl-9"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSnowChains((v) => !v)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border flex items-center gap-1.5 ${
                      snowChains
                        ? 'bg-sky-500/20 border-sky-400/50 text-sky-200'
                        : 'bg-black/40 border-white/10 text-white/50'
                    }`}
                  >
                    <Snowflake className="w-3.5 h-3.5" /> Snow Chains
                  </button>
                  <button
                    type="button"
                    onClick={() => setFourWheelDrive((v) => !v)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border flex items-center gap-1.5 ${
                      fourWheelDrive
                        ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-200'
                        : 'bg-black/40 border-white/10 text-white/50'
                    }`}
                  >
                    <Car className="w-3.5 h-3.5" /> 4x4 AWD
                  </button>
                  <button
                    type="button"
                    onClick={() => setSkiRack((v) => !v)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border flex items-center gap-1.5 ${
                      skiRack
                        ? 'bg-amber-500/20 border-amber-400/50 text-amber-200'
                        : 'bg-black/40 border-white/10 text-white/50'
                    }`}
                  >
                    Ski Rack
                  </button>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOnboardStep(1)}
                    className="h-11 rounded-xl bg-white/5 border-white/10 text-white text-xs"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 h-11 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider gap-1.5"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    Submit KYC Application
                  </Button>
                </div>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );
};
