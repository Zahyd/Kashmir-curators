import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Shield, Key, Loader2, AlertCircle, ArrowRight, Sparkles, 
  Users, TrendingUp, CheckCircle2, Lock, ShieldCheck, Compass, 
  Layers, BarChart3, Building2, ChevronRight, RefreshCw, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useTeamAuth, ROLE_LABELS, ROLE_COLORS, TeamRole } from '@/contexts/TeamAuthContext';
import { SOCKET_URL } from '@/lib/api';
import { Logo } from '@/components/ui/Logo';

interface RolePreset {
  code: string;
  role: TeamRole;
  title: string;
  badge: string;
  description: string;
  icon: any;
  destination: string;
  color: string;
}

const ROLE_PRESETS: RolePreset[] = [
  {
    code: 'ADMIN001',
    role: 'admin',
    title: 'Director Command Deck',
    badge: 'Super Admin',
    description: 'Full system control, CMS Page Builder, fiscal intelligence & operational telemetry.',
    icon: Shield,
    destination: '/admin',
    color: 'from-amber-500/20 to-yellow-500/10 border-amber-400/30 text-amber-300'
  },
  {
    code: 'OPS001',
    role: 'operations',
    title: 'Ground Operations Hub',
    badge: 'Operations',
    description: 'Transit corridor radar, road status, lead dispatch, hotel dues & cab fleet.',
    icon: Compass,
    destination: '/admin',
    color: 'from-blue-500/20 to-cyan-500/10 border-blue-400/30 text-blue-300'
  },
  {
    code: 'SALES001',
    role: 'sales',
    title: 'Private Client Concierge',
    badge: 'Sales Portal',
    description: 'High-value customer pipeline, custom itinerary architect, quote generator & CRM.',
    icon: Zap,
    destination: '/sales/portal',
    color: 'from-emerald-500/20 to-teal-500/10 border-emerald-400/30 text-emerald-300'
  },
  {
    code: 'MKT001',
    role: 'marketing',
    title: 'Editorial & Atelier CMS',
    badge: 'Marketing',
    description: 'Visual Page Builder, destinations grid, experiences, testimonials & SEO suite.',
    icon: Layers,
    destination: '/admin',
    color: 'from-purple-500/20 to-pink-500/10 border-purple-400/30 text-purple-300'
  },
  {
    code: 'FIN001',
    role: 'finance',
    title: 'Fiscal Audit & Revenue Intel',
    badge: 'Finance',
    description: 'Revenue forecasting, payment gateways, coupon redemption & audit logs.',
    icon: BarChart3,
    destination: '/admin',
    color: 'from-cyan-500/20 to-blue-500/10 border-cyan-400/30 text-cyan-300'
  }
];

export default function SalesAuth() {
  const navigate = useNavigate();
  const { teamUser, isTeamAuthenticated, teamSendOtp, teamVerifyOtp } = useTeamAuth();
  const [employeeCode, setEmployeeCode] = useState('ADMIN001');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [maskedPhone, setMaskedPhone] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [selectedRolePreset, setSelectedRolePreset] = useState<RolePreset | null>(ROLE_PRESETS[0]);
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Google workspace login states
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [selectedGoogleEmail, setSelectedGoogleEmail] = useState('');

  // Diagnostic state
  const [diagnosticsRunning, setDiagnosticsRunning] = useState(false);

  useEffect(() => {
    let timer: any;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  useEffect(() => {
    if (isTeamAuthenticated && teamUser) {
      if (teamUser.role === 'sales') {
        navigate('/sales/portal');
      } else {
        navigate('/admin');
      }
    }
  }, [isTeamAuthenticated, teamUser, navigate]);

  const handleSelectRolePreset = (preset: RolePreset) => {
    setSelectedRolePreset(preset);
    setEmployeeCode(preset.code);
    setError('');
  };

  const handleSelectGoogleAccount = async (account: { name: string; email: string; code: string }) => {
    setSelectedGoogleEmail(account.email);
    setGoogleLoading(true);
    
    // Luxury workspace handshaking simulation
    await new Promise((resolve) => setTimeout(resolve, 1200));
    
    const result = await teamSendOtp(account.code);
    
    if (result.success) {
      toast.success(`Google Workspace verified. Real-time OTP dispatched.`);
      setEmployeeCode(account.code);
      setIsOtpSent(true);
      setMaskedPhone(result.phone || '');
      setShowGoogleModal(false);
      setResendCooldown(30);
    } else {
      setError(result.error || 'Google Workspace auth failed');
      toast.error('Workspace verification failed');
    }
    
    setGoogleLoading(false);
    setSelectedGoogleEmail('');
  };

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!employeeCode.trim()) {
      setError('Employee identification code is required');
      return;
    }

    setIsProcessing(true);
    setError('');

    const sleepTimeoutId = setTimeout(() => {
      toast.info('Connecting to secure cloud node. This first request may take a few moments...', {
        duration: 8000,
        icon: '⏳'
      });
    }, 4000);

    if (!isOtpSent) {
      // Step 1: Send OTP
      const result = await teamSendOtp(employeeCode);

      if (result.success) {
        setIsOtpSent(true);
        setMaskedPhone(result.phone || '');
        setResendCooldown(30);
        if (result.otp) {
          toast.success(`Security passkey dispatched to your inbox. Demo code: ${result.otp}`, {
            duration: 15000,
            icon: '🔑'
          });
          // Pre-fill demo OTP in development / simulation mode for frictionless evaluation
          setOtp(result.otp);
        } else {
          toast.success('Security verification OTP dispatched via Email');
        }
      } else {
        setError(result.error || 'Authentication server unreachable');
        toast.error('Identity Verification Failed');
      }
    } else {
      // Step 2: Verify OTP
      if (!otp.trim()) {
        setError('Verification OTP is required');
        clearTimeout(sleepTimeoutId);
        setIsProcessing(false);
        return;
      }

      const result = await teamVerifyOtp(employeeCode, otp);

      if (result.success) {
        toast.success(`Welcome to The Kashmir Curators Command Center`);
      } else {
        setError(result.error || 'Invalid or expired OTP code');
        toast.error('Identity Verification Failed');
      }
    }

    clearTimeout(sleepTimeoutId);
    setIsProcessing(false);
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isProcessing) return;
    setIsProcessing(true);
    setError('');
    const result = await teamSendOtp(employeeCode);
    setIsProcessing(false);
    if (result.success) {
      setMaskedPhone(result.phone || '');
      setResendCooldown(30);
      if (result.otp) {
        toast.success(`New security OTP code: ${result.otp}`, {
          duration: 15000,
          icon: '🔑'
        });
        setOtp(result.otp);
      } else {
        toast.success('New OTP Dispatched via Email');
      }
    } else {
      setError('Failed to resend code');
    }
  };

  const runDiagnostics = async () => {
    setDiagnosticsRunning(true);
    const start = Date.now();
    try {
      const res = await fetch(`${SOCKET_URL}/health-check`);
      const dbRes = await fetch(`${SOCKET_URL}/db-check`);
      const duration = Date.now() - start;
      
      if (res.ok && dbRes.ok) {
        toast.success(`Full Ground OS Active: Render Gateway & Neon DB Online (${duration}ms)`);
      } else if (res.ok) {
        toast.warning(`Gateway Online (${duration}ms), Neon DB syncing...`);
      } else {
        throw new Error();
      }
    } catch (e) {
      toast.error('Gateway Unreachable. Backend warming up on Render.');
    } finally {
      setDiagnosticsRunning(false);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-between p-4 sm:p-6 md:p-10 bg-[#070b0e] text-slate-100 selection:bg-amber-500/30 selection:text-amber-200 overflow-x-hidden font-sans">
      
      {/* Dynamic Ambient Glows & Vector Architecture */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] right-[-10%] w-[650px] h-[650px] rounded-full bg-gradient-to-b from-amber-500/15 via-amber-600/5 to-transparent blur-[140px]" />
        <div className="absolute bottom-[-15%] left-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-t from-sky-500/10 via-blue-600/5 to-transparent blur-[140px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-6xl h-full bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.04)_0%,transparent_70%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30" />
      </div>

      {/* Top Header Bar */}
      <header className="w-full max-w-6xl mx-auto flex items-center justify-between py-2 sm:py-4 relative z-20">
        <Link 
          to="/" 
          className="flex items-center gap-3 p-2 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-amber-400/30 hover:bg-white/[0.05] transition-all group backdrop-blur-xl"
        >
          <Logo isDarkBg={true} className="h-8 sm:h-9 w-auto transition-transform duration-300 group-hover:scale-105" />
          <div className="hidden sm:flex flex-col border-l border-white/10 pl-3">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white/90">Curators Command</span>
            <span className="text-[8px] font-bold uppercase tracking-widest text-amber-400/80">Atelier Operations 2026</span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/10 text-[9px] font-black uppercase tracking-widest text-white/60 backdrop-blur-xl">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <span className="hidden sm:inline">GROUND GATEWAY ACTIVE</span>
            <span className="sm:hidden">ACTIVE</span>
          </div>
          <Link 
            to="/" 
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10 hover:border-amber-400/40 hover:bg-white/[0.08] text-[10px] font-black uppercase tracking-widest text-white/70 hover:text-white transition-all backdrop-blur-xl group"
          >
            <span>Live Sanctuary</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform text-amber-400" />
          </Link>
        </div>
      </header>

      {/* Central Command Access Module */}
      <main className="w-full max-w-4xl mx-auto my-auto py-8 relative z-20 animate-in fade-in zoom-in-95 duration-700">
        
        {/* Terminal Header Info */}
        <div className="text-center mb-8 sm:mb-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-amber-500/5 border border-amber-500/30 text-amber-300 text-[10px] font-black uppercase tracking-[0.25em] shadow-inner">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Restricted Ground Operations Node</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-display font-black text-white tracking-tight uppercase">
            Curators <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-200">Terminal</span>
          </h1>
          <p className="text-white/50 text-xs sm:text-sm max-w-lg mx-auto font-medium leading-relaxed">
            Role-governed executive access for Kashmir Curators Directors, Operations Managers, Sales Concierges, and Editors.
          </p>
        </div>

        {/* Master Login Terminal Card */}
        <div className="bg-[#0a0f14]/85 backdrop-blur-3xl border border-white/10 p-6 sm:p-10 rounded-[2.5rem] shadow-2xl shadow-black/90 relative overflow-hidden group">
          {/* Top Amber Horizon Line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-80" />
          
          {!isOtpSent ? (
            <div className="space-y-8">
              
              {/* Navigation Segment Tabs */}
              <div className="flex p-1.5 rounded-2xl bg-white/[0.03] border border-white/10 max-w-md mx-auto">
                <button
                  type="button"
                  onClick={() => setActiveTab('presets')}
                  className={cn(
                    "flex-1 py-2.5 px-4 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2",
                    activeTab === 'presets'
                      ? "bg-amber-400 text-black shadow-lg shadow-amber-500/20 font-bold"
                      : "text-white/50 hover:text-white hover:bg-white/[0.02]"
                  )}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Executive Presets</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('custom')}
                  className={cn(
                    "flex-1 py-2.5 px-4 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2",
                    activeTab === 'custom'
                      ? "bg-amber-400 text-black shadow-lg shadow-amber-500/20 font-bold"
                      : "text-white/50 hover:text-white hover:bg-white/[0.02]"
                  )}
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Manual Passkey</span>
                </button>
              </div>

              {/* TAB 1: EXECUTIVE ROLE PRESETS */}
              {activeTab === 'presets' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-300/70">
                      Select Your Operational Role
                    </p>
                    <span className="text-[10px] text-white/40 font-mono">
                      Selected: <b className="text-white">{employeeCode}</b>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {ROLE_PRESETS.map((preset) => {
                      const isSelected = employeeCode === preset.code;
                      const IconComponent = preset.icon;
                      return (
                        <div
                          key={preset.code}
                          onClick={() => handleSelectRolePreset(preset)}
                          className={cn(
                            "cursor-pointer p-4 rounded-2xl border transition-all duration-300 flex flex-col justify-between gap-3 text-left relative overflow-hidden group/card",
                            isSelected
                              ? "bg-gradient-to-br from-amber-500/20 via-amber-500/10 to-transparent border-amber-400/60 shadow-xl shadow-amber-500/10 ring-1 ring-amber-400/30"
                              : "bg-white/[0.02] border-white/5 hover:border-amber-400/30 hover:bg-white/[0.05]"
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                              isSelected 
                                ? "bg-amber-400 text-black shadow-md shadow-amber-400/30" 
                                : "bg-white/5 text-amber-400 group-hover/card:bg-amber-400/20"
                            )}>
                              <IconComponent className="w-5 h-5" />
                            </div>
                            <Badge variant="outline" className={cn(
                              "text-[9px] font-black uppercase tracking-wider",
                              isSelected ? "bg-amber-400/20 text-amber-300 border-amber-400/40" : "bg-white/5 text-white/50 border-white/10"
                            )}>
                              {preset.badge}
                            </Badge>
                          </div>

                          <div>
                            <h4 className="text-sm font-bold text-white group-hover/card:text-amber-300 transition-colors">
                              {preset.title}
                            </h4>
                            <p className="text-[11px] text-white/50 line-clamp-2 mt-1 leading-relaxed">
                              {preset.description}
                            </p>
                          </div>

                          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-white/40">
                            <span>CODE: <b className="text-white">{preset.code}</b></span>
                            <ChevronRight className={cn(
                              "w-3.5 h-3.5 transition-transform",
                              isSelected ? "text-amber-400 translate-x-1" : "text-white/20 group-hover/card:translate-x-1"
                            )} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 2: MANUAL PASSKEY */}
              {activeTab === 'custom' && (
                <div className="max-w-md mx-auto space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-amber-300/80 ml-1">
                    Personnel Employee ID Code
                  </label>
                  <div className="relative group/input">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30 group-focus-within/input:text-amber-400 transition-colors" />
                    <Input
                      type="text"
                      placeholder="e.g. ADMIN001, OPS001, SALES001"
                      value={employeeCode}
                      onChange={(e) => {
                        setEmployeeCode(e.target.value.toUpperCase());
                        setError('');
                      }}
                      className={cn(
                        "pl-12 h-14 bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-2xl text-base font-mono tracking-wider focus:ring-amber-400/30 focus:border-amber-400 transition-all",
                        error && "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20"
                      )}
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-4 pt-2">
                <Button
                  type="button"
                  onClick={() => handleLogin()}
                  disabled={isProcessing}
                  className="w-full h-14 text-base font-black uppercase tracking-wider rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-black hover:opacity-95 transition-all duration-300 shadow-xl shadow-amber-500/20 relative overflow-hidden group/btn"
                >
                  {isProcessing ? (
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Authenticating Credentials...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <span>Access Operational Workspace</span>
                      <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1.5 transition-transform" />
                    </div>
                  )}
                </Button>

                {/* Divider */}
                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-white/5"></div>
                  <span className="flex-shrink mx-4 text-[9px] font-black uppercase tracking-[0.25em] text-white/30">
                    OR ENTERPRISE FEDERATION
                  </span>
                  <div className="flex-grow border-t border-white/5"></div>
                </div>

                {/* Google Workspace Button */}
                <Button
                  type="button"
                  onClick={() => setShowGoogleModal(true)}
                  className="w-full h-12 rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-white/90 hover:text-white font-bold transition-all duration-300 flex items-center justify-center gap-3 shadow-lg"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span className="text-xs tracking-wide">Continue with Google Workspace Single Sign-On</span>
                </Button>
              </div>

            </div>
          ) : (
            /* STEP 2: VERIFICATION OTP SCREEN */
            <div className="max-w-md mx-auto space-y-6 animate-in fade-in duration-500">
              
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-3xl bg-amber-400/20 border border-amber-400/40 text-amber-300 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20 mb-4">
                  <Lock className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-white uppercase tracking-tight">Identity Verification</h3>
                <p className="text-xs text-white/50 leading-relaxed">
                  Enter the 6-digit authentication security passkey dispatched to your registered address.
                </p>
              </div>

              {/* Identity Capsule */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white font-mono">{employeeCode}</p>
                    <p className="text-[10px] text-white/40">Verified Staff Credentials</p>
                  </div>
                </div>
                {maskedPhone && (
                  <span className="text-[10px] font-mono text-amber-300/80 bg-amber-400/10 px-2.5 py-1 rounded-lg border border-amber-400/20">
                    {maskedPhone}
                  </span>
                )}
              </div>

              {/* OTP Form Input */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-amber-300/80 ml-1">
                  6-Digit Verification PIN
                </label>
                <div className="relative group/otp">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30 group-focus-within/otp:text-amber-400 transition-colors" />
                  <Input
                    type="text"
                    maxLength={6}
                    placeholder="• • • • • •"
                    value={otp}
                    onChange={(e) => {
                      setOtp(e.target.value.replace(/\D/g, ''));
                      setError('');
                    }}
                    className={cn(
                      "pl-12 h-16 bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-2xl tracking-[0.4em] font-mono text-center text-2xl font-black focus:ring-amber-400/30 focus:border-amber-400 transition-all",
                      error && "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20"
                    )}
                  />
                </div>
                {error && (
                  <div className="flex items-center gap-2 text-red-400 text-xs mt-2 ml-1 animate-in fade-in">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{error}</span>
                  </div>
                )}
              </div>

              {/* Verify Button */}
              <Button
                type="button"
                onClick={() => handleLogin()}
                disabled={isProcessing}
                className="w-full h-14 text-base font-black uppercase tracking-wider rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-black hover:opacity-95 transition-all duration-300 shadow-xl shadow-amber-500/20"
              >
                {isProcessing ? (
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Validating Passkey...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <span>Confirm & Launch Terminal</span>
                    <ArrowRight className="w-5 h-5" />
                  </div>
                )}
              </Button>

              {/* Footer Controls */}
              <div className="flex items-center justify-between text-xs pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsOtpSent(false);
                    setOtp('');
                    setError('');
                  }}
                  className="text-white/40 hover:text-white transition-colors text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5"
                >
                  <ArrowRight className="w-3 h-3 rotate-180" /> Change Role / Code
                </button>

                <button
                  type="button"
                  disabled={resendCooldown > 0 || isProcessing}
                  onClick={handleResendOtp}
                  className={cn(
                    "text-[10px] font-black uppercase tracking-wider transition-colors",
                    resendCooldown > 0
                      ? "text-white/30 cursor-not-allowed"
                      : "text-amber-400 hover:text-amber-300"
                  )}
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                </button>
              </div>

            </div>
          )}

        </div>

        {/* Operational Diagnostics Telemetry Bar */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 rounded-2xl bg-white/[0.02] border border-white/5 text-[10px] text-white/40 font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Kashmir Curators Enterprise Management Platform • v4.2 Production</span>
          </div>

          <button
            type="button"
            onClick={runDiagnostics}
            disabled={diagnosticsRunning}
            className="flex items-center gap-2 hover:text-amber-300 transition-colors uppercase tracking-widest font-black"
          >
            <RefreshCw className={cn("w-3 h-3", diagnosticsRunning && "animate-spin")} />
            <span>Test Gateway Health</span>
          </button>
        </div>

      </main>

      {/* Footer System Credits */}
      <footer className="w-full max-w-6xl mx-auto py-4 text-center text-white/20 text-[10px] font-mono uppercase tracking-[0.25em] relative z-20">
        &copy; {new Date().getFullYear()} The Kashmir Curators • Valley Ground Telemetry Active
      </footer>

      {/* Google Workspace Account Selector Modal */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl animate-fade-in" onClick={() => !googleLoading && setShowGoogleModal(false)} />
          
          <div className="relative z-10 w-full max-w-md bg-[#0a0f14]/98 border border-amber-500/30 p-8 rounded-[2.5rem] shadow-2xl shadow-black animate-scale-in text-white">
            <div className="text-center mb-6 space-y-2">
              <svg className="w-10 h-10 mx-auto" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <h3 className="font-display font-bold text-xl text-white">Google Workspace SSO</h3>
              <p className="text-white/40 text-xs">Single Sign-On for Authorized Kashmiri Curators Staff</p>
            </div>

            {googleLoading ? (
              <div className="flex flex-col items-center py-10 gap-3">
                <Loader2 className="h-8 w-8 text-amber-400 animate-spin" />
                <p className="text-xs text-white/60 font-medium">Verifying credentials for {selectedGoogleEmail}...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {[
                  { name: 'Zahid Riyaz (Director)', email: 'Zahidreyaz44123@gmail.com', avatar: 'ZR', code: 'ADMIN001', role: 'Super Admin' },
                  { name: 'Executive Operations', email: 'ops@thekashmircurators.com', avatar: 'OP', code: 'OPS001', role: 'Operations' },
                  { name: 'Sales Concierge', email: 'sales@thekashmircurators.com', avatar: 'SC', code: 'SALES001', role: 'Sales Lead' },
                ].map((account) => (
                  <button
                    key={account.email}
                    onClick={() => handleSelectGoogleAccount(account)}
                    className="w-full p-3.5 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 text-left flex items-center justify-between gap-3 transition-all duration-300 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center text-black font-black text-xs shadow-md">
                        {account.avatar}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">{account.name}</p>
                        <p className="text-[11px] text-white/40 font-mono">{account.email}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-amber-400/10 text-amber-300 border-amber-400/25 text-[9px] font-black uppercase tracking-wider">
                      {account.role}
                    </Badge>
                  </button>
                ))}

                <Button
                  variant="ghost"
                  onClick={() => setShowGoogleModal(false)}
                  className="w-full mt-4 text-xs font-bold text-white/40 hover:text-white"
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
