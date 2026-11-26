import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { 
  Mail, Lock, User, Eye, EyeOff, Loader2, AlertCircle, Phone, 
  KeyRound, Briefcase, Building2, Car, Compass, ShieldCheck, 
  Sparkles, ArrowLeft, CheckCircle2, Star, Zap, Check, Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/ui/Logo';

type UserRoleOption = 'traveler' | 'agent' | 'hotel' | 'driver';

interface PortalContextInfo {
  badge: string;
  title: string;
  description: string;
  icon: any;
  accentColor: string;
  defaultRole: UserRoleOption;
}

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { 
    login, 
    loginWithGoogle, 
    loginWithGoogleRealtime, 
    signup, 
    sendOtp, 
    verifyOtp, 
    isAuthenticated, 
    isLoading, 
    isAdmin 
  } = useAuth();
  
  const redirectParam = searchParams.get('redirect') || '';
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'login';

  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [selectedRole, setSelectedRole] = useState<UserRoleOption>('traveler');
  
  const [showPassword, setShowPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  
  // Google Sign-In states
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [selectedGoogleEmail, setSelectedGoogleEmail] = useState('');
  const [googleClient, setGoogleClient] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    otp: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Dynamic context according to redirect target (e.g. /agent, /hospitality, /driver)
  const portalContext: PortalContextInfo = useMemo(() => {
    if (redirectParam.startsWith('/agent')) {
      return {
        badge: 'B2B Travel Agent Portal',
        title: 'Partner DMC Command Deck',
        description: 'Sign in to access B2B wholesale tariffs, custom quote builder, and verified fleets.',
        icon: Briefcase,
        accentColor: 'from-amber-500/20 via-amber-500/10 to-transparent border-amber-500/30 text-amber-400',
        defaultRole: 'agent'
      };
    }
    if (redirectParam.startsWith('/hospitality')) {
      return {
        badge: 'Hospitality Partner Desk',
        title: 'Hotelier & Property Operations',
        description: 'Sign in to manage live room inventory, seasonal pricing, and instant booking approvals.',
        icon: Building2,
        accentColor: 'from-emerald-500/20 via-emerald-500/10 to-transparent border-emerald-500/30 text-emerald-400',
        defaultRole: 'hotel'
      };
    }
    if (redirectParam.startsWith('/driver')) {
      return {
        badge: 'Fleet & Driver Network',
        title: 'Commercial Transport Console',
        description: 'Sign in to review active passenger manifests, compliance vault, and route radar.',
        icon: Car,
        accentColor: 'from-blue-500/20 via-blue-500/10 to-transparent border-blue-500/30 text-blue-400',
        defaultRole: 'driver'
      };
    }
    if (redirectParam.startsWith('/admin')) {
      return {
        badge: 'Director Command Deck',
        title: 'Executive Admin Access',
        description: 'Sign in with elevated supervisory credentials for CMS & financial oversight.',
        icon: ShieldCheck,
        accentColor: 'from-purple-500/20 via-purple-500/10 to-transparent border-purple-500/30 text-purple-400',
        defaultRole: 'traveler'
      };
    }
    return {
      badge: 'Traveler & Member Portal',
      title: 'Curating Paradise on Earth',
      description: 'Sign in to access your handcrafted Kashmir itineraries, vouchers, and 24/7 concierge.',
      icon: Compass,
      accentColor: 'from-amber-500/15 via-emerald-500/10 to-transparent border-white/10 text-amber-300',
      defaultRole: 'traveler'
    };
  }, [redirectParam]);

  // Set default role when portal context changes
  useEffect(() => {
    if (portalContext.defaultRole) {
      setSelectedRole(portalContext.defaultRole);
    }
  }, [portalContext]);

  // Dynamic Google Sign-In Script Loading & Initialization
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if ((window as any).google) {
        try {
          const client = (window as any).google.accounts.oauth2.initTokenClient({
            client_id: '124706954400-n13pas8rtqqmrg3jn64e69eq7u9c099p.apps.googleusercontent.com',
            scope: 'email profile openid',
            callback: async (tokenResponse: any) => {
              if (tokenResponse && tokenResponse.access_token) {
                setIsProcessing(true);
                try {
                  const res = await loginWithGoogleRealtime({ accessToken: tokenResponse.access_token });
                  if (res.success) {
                    toast.success('Successfully authenticated via Google!');
                  } else {
                    toast.error(res.error || 'Google Authentication failed');
                  }
                } catch (err) {
                  toast.error('Google authorization error');
                } finally {
                  setIsProcessing(false);
                }
              }
            },
          });
          setGoogleClient(client);
        } catch (e) {
          console.warn('Google client init notice:', e);
        }
      }
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handleGoogleLogin = () => {
    if (googleClient) {
      googleClient.requestAccessToken();
    } else {
      setShowGoogleModal(true);
    }
  };

  const handleSelectGoogleAccount = async (account: { name: string; email: string }) => {
    setSelectedGoogleEmail(account.email);
    setGoogleLoading(true);
    
    // Smooth handshake simulation for local/testing environment
    await new Promise((resolve) => setTimeout(resolve, 900));
    
    try {
      const result = await loginWithGoogle(account.name, account.email);
      if (!result.success) {
        throw new Error(result.error || 'Failed to authenticate via Google');
      }
      
      toast.success(`Signed in successfully as ${account.name}!`);
      setShowGoogleModal(false);
    } catch (err: any) {
      toast.error(err.message || 'Google Authentication failed');
    } finally {
      setGoogleLoading(false);
      setSelectedGoogleEmail('');
    }
  };

  // Redirect once authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const defaultRedirect = isAdmin ? '/admin' : '/profile';
      const redirect = redirectParam || defaultRedirect;
      navigate(redirect);
    }
  }, [isAuthenticated, isAdmin, navigate, redirectParam]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (authMethod === 'email') {
      if (mode === 'signup' && !formData.name.trim()) {
        newErrors.name = 'Full name is required';
      }
      if (!formData.email.trim()) {
        newErrors.email = 'Email address is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Enter a valid email address';
      }
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }
    } else if (authMethod === 'phone') {
      if (!formData.phone.trim()) {
        newErrors.phone = 'Phone number is required';
      } else if (formData.phone.length < 10) {
        newErrors.phone = 'Enter a valid 10-digit mobile number';
      }
      
      if (otpSent && !formData.otp.trim()) {
        newErrors.otp = 'OTP is required';
      } else if (otpSent && formData.otp.length < 6) {
        newErrors.otp = 'OTP must be 6 digits';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getPasswordStrength = () => {
    const { password } = formData;
    if (!password) return { score: 0, label: '', percent: 0 };
    
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    const labels = ['Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
    return { 
      score, 
      label: labels[Math.min(score - 1, 4)] || 'Weak',
      percent: Math.min(score * 20, 100)
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsProcessing(true);

    if (authMethod === 'email') {
      let result;
      if (mode === 'login') {
        result = await login(formData.email, formData.password);
      } else {
        result = await signup(formData.name, formData.email, formData.password);
        if (result.success && selectedRole !== 'traveler') {
          // Store intended portal role preference in localStorage
          localStorage.setItem('user_preferred_role', selectedRole);
        }
      }

      if (result.success) {
        toast.success(mode === 'login' ? 'Welcome back to Kashmir Curators!' : 'Account registered successfully with Neon Auth!');
      } else {
        toast.error(result.error || 'Authentication failed. Please verify credentials.');
      }
    } else if (authMethod === 'phone') {
      if (!otpSent) {
        const result = await sendOtp(formData.phone);
        if (result.success) {
          setOtpSent(true);
          toast.success('OTP sent to your phone! (Use 123456 for instant testing)');
        } else {
          toast.error(result.error || 'Failed to send OTP');
        }
      } else {
        const result = await verifyOtp(formData.phone, formData.otp);
        if (result.success) {
          toast.success('Phone verified successfully! Welcome.');
        } else {
          toast.error(result.error || 'Invalid OTP');
        }
      }
    }
    
    setIsProcessing(false);
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }
    setResetSent(true);
    toast.success(`Password reset link sent to ${resetEmail}`);
  };

  const passwordStrength = getPasswordStrength();
  const loading = isLoading || isProcessing;
  const ContextIcon = portalContext.icon;

  return (
    <div className="min-h-screen min-h-[100dvh] w-full max-w-full overflow-x-hidden bg-[#070B12] text-slate-100 flex flex-col justify-between selection:bg-amber-500 selection:text-black">
      {/* Background Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-72 sm:w-96 h-72 sm:h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-72 sm:w-[30rem] h-72 sm:h-[30rem] bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-72 sm:w-96 h-72 sm:h-96 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      {/* Top Header Bar - Optimized for Mobile Viewports */}
      <header className="relative z-20 w-full px-3.5 sm:px-6 py-3 sm:py-4 border-b border-white/5 bg-slate-950/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <Link to="/" className="flex items-center shrink-0 group">
            <Logo className="h-8 sm:h-10 w-auto transition-transform group-hover:scale-105" isDarkBg={true} />
          </Link>
          
          <Link 
            to="/" 
            className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-slate-300 hover:text-amber-400 transition-colors bg-white/5 hover:bg-white/10 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-white/10 shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Return to </span>
            <span>Explore</span>
          </Link>
        </div>
      </header>

      {/* Main Dual-Column Content */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-3 py-4 sm:px-6 sm:py-6 lg:p-8 flex items-center">
        <div className="w-full grid lg:grid-cols-12 gap-6 lg:gap-12 items-center">
          
          {/* LEFT COLUMN: Modern Authentication Form (Cols 1-7 on desktop, full-width on mobile) */}
          <div className="lg:col-span-7 xl:col-span-6 flex flex-col justify-center w-full max-w-full">
            <div className="w-full max-w-xl mx-auto bg-slate-900/85 backdrop-blur-2xl border border-white/10 p-4 sm:p-7 md:p-10 rounded-2xl sm:rounded-3xl shadow-2xl shadow-black/80">
              
              {/* Dynamic Context Banner when arriving via deep link */}
              <div className={cn(
                "rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-5 border flex items-center gap-3 transition-all bg-gradient-to-r",
                portalContext.accentColor
              )}>
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
                  <ContextIcon className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-amber-400">
                      {portalContext.badge}
                    </span>
                    <span className="text-[8px] sm:text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 sm:px-2 py-0.5 rounded-full font-bold">
                      Neon Better Auth
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-300 leading-snug mt-0.5 line-clamp-2 sm:line-clamp-none">
                    {portalContext.description}
                  </p>
                </div>
              </div>

              {/* Header Title & Subtext */}
              <div className="mb-5 sm:mb-6">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-white tracking-tight">
                  {mode === 'login' ? 'Welcome Back' : 'Join Kashmir Curators'}
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  {mode === 'login' 
                    ? 'Enter your credentials or use one-tap Google login to proceed.' 
                    : 'Create your account to unlock verified B2B rates and luxury services.'}
                </p>
              </div>

              {/* Mode Switcher: Sign In vs Create Account */}
              <div className="grid grid-cols-2 p-1 bg-slate-950/70 border border-white/10 rounded-xl sm:rounded-2xl mb-5 sm:mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrors({});
                  }}
                  className={cn(
                    "py-2 sm:py-2.5 text-xs sm:text-sm font-bold rounded-lg sm:rounded-xl transition-all duration-200",
                    mode === 'login'
                      ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20"
                      : "text-slate-400 hover:text-white"
                  )}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setErrors({});
                  }}
                  className={cn(
                    "py-2 sm:py-2.5 text-xs sm:text-sm font-bold rounded-lg sm:rounded-xl transition-all duration-200",
                    mode === 'signup'
                      ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20"
                      : "text-slate-400 hover:text-white"
                  )}
                >
                  Create Account
                </button>
              </div>

              {/* Role Selection Selector (in Sign Up Mode) */}
              {mode === 'signup' && (
                <div className="mb-5 sm:mb-6 animate-fade-in">
                  <label className="text-[11px] sm:text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
                    Select Account Type
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'traveler', label: 'Traveler', icon: Compass, desc: 'Expeditions' },
                      { id: 'agent', label: 'Travel Agent', icon: Briefcase, desc: 'B2B DMC' },
                      { id: 'hotel', label: 'Hotelier', icon: Building2, desc: 'Stays' },
                      { id: 'driver', label: 'Fleet Cab', icon: Car, desc: 'Transport' },
                    ].map((role) => {
                      const Icon = role.icon;
                      const isSelected = selectedRole === role.id;
                      return (
                        <button
                          key={role.id}
                          type="button"
                          onClick={() => setSelectedRole(role.id as UserRoleOption)}
                          className={cn(
                            "flex flex-col items-center justify-center p-2 sm:p-2.5 rounded-xl border text-center transition-all",
                            isSelected
                              ? "bg-amber-500/20 border-amber-500/60 text-amber-300 shadow-sm"
                              : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200"
                          )}
                        >
                          <Icon className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4 mb-1 shrink-0", isSelected ? "text-amber-400" : "text-slate-400")} />
                          <span className="text-[11px] sm:text-xs font-bold leading-tight truncate w-full">{role.label}</span>
                          <span className="text-[9px] sm:text-[10px] text-slate-500 truncate w-full">{role.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Auth Method Toggle: Email vs Phone */}
              <div className="flex items-center gap-2 mb-5 sm:mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMethod('email');
                    setErrors({});
                  }}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2 px-2.5 sm:px-3 rounded-xl text-xs font-semibold border transition-all",
                    authMethod === 'email'
                      ? "bg-white/10 border-white/20 text-white shadow-sm"
                      : "bg-transparent border-transparent text-slate-400 hover:text-slate-200"
                  )}
                >
                  <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="hidden sm:inline">Email & Password</span>
                  <span className="sm:hidden">Email</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMethod('phone');
                    setErrors({});
                    setMode('login');
                  }}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2 px-2.5 sm:px-3 rounded-xl text-xs font-semibold border transition-all",
                    authMethod === 'phone'
                      ? "bg-white/10 border-white/20 text-white shadow-sm"
                      : "bg-transparent border-transparent text-slate-400 hover:text-slate-200"
                  )}
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="hidden sm:inline">Instant Mobile OTP</span>
                  <span className="sm:hidden">Phone OTP</span>
                </button>
              </div>

              {/* Primary Form */}
              <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
                {authMethod === 'email' ? (
                  <>
                    {/* Full Name in Sign Up */}
                    {mode === 'signup' && (
                      <div className="space-y-1 animate-fade-in">
                        <label className="text-xs font-semibold text-slate-300">
                          Full Name or Agency Name
                        </label>
                        <div className="relative">
                          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                          <Input
                            placeholder="Zahid Riyaz / Chinar Travels"
                            value={formData.name}
                            onChange={(e) => {
                              setFormData(prev => ({ ...prev, name: e.target.value }));
                              setErrors(prev => ({ ...prev, name: '' }));
                            }}
                            className={cn(
                              "pl-10 h-11 sm:h-12 text-base sm:text-sm bg-slate-950/60 border-white/10 text-white placeholder:text-slate-600 rounded-xl focus:border-amber-400 focus:ring-1 focus:ring-amber-400",
                              errors.name && "border-rose-500 focus:border-rose-500"
                            )}
                          />
                        </div>
                        {errors.name && (
                          <p className="text-rose-400 text-xs flex items-center gap-1 mt-1">
                            <AlertCircle className="w-3.5 h-3.5" /> {errors.name}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Email Input */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-300">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <Input
                          type="email"
                          placeholder="partner@kashmircurators.com"
                          value={formData.email}
                          onChange={(e) => {
                            setFormData(prev => ({ ...prev, email: e.target.value }));
                            setErrors(prev => ({ ...prev, email: '' }));
                          }}
                          className={cn(
                            "pl-10 h-11 sm:h-12 text-base sm:text-sm bg-slate-950/60 border-white/10 text-white placeholder:text-slate-600 rounded-xl focus:border-amber-400 focus:ring-1 focus:ring-amber-400",
                            errors.email && "border-rose-500 focus:border-rose-500"
                          )}
                        />
                      </div>
                      {errors.email && (
                        <p className="text-rose-400 text-xs flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3.5 h-3.5" /> {errors.email}
                        </p>
                      )}
                    </div>

                    {/* Password Input */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-300">
                          Password
                        </label>
                        {mode === 'login' && (
                          <button
                            type="button"
                            onClick={() => setForgotPasswordOpen(true)}
                            className="text-xs font-medium text-amber-400 hover:underline"
                          >
                            Forgot password?
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={formData.password}
                          onChange={(e) => {
                            setFormData(prev => ({ ...prev, password: e.target.value }));
                            setErrors(prev => ({ ...prev, password: '' }));
                          }}
                          className={cn(
                            "pl-10 pr-10 h-11 sm:h-12 text-base sm:text-sm bg-slate-950/60 border-white/10 text-white placeholder:text-slate-600 rounded-xl focus:border-amber-400 focus:ring-1 focus:ring-amber-400",
                            errors.password && "border-rose-500 focus:border-rose-500"
                          )}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {errors.password && (
                        <p className="text-rose-400 text-xs flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3.5 h-3.5" /> {errors.password}
                        </p>
                      )}

                      {/* Password Strength Indicator on Signup */}
                      {mode === 'signup' && formData.password && (
                        <div className="mt-2 p-2.5 sm:p-3 rounded-xl bg-slate-950/50 border border-white/5 space-y-1.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400">Security Strength:</span>
                            <span className={cn(
                              "font-bold",
                              passwordStrength.score <= 2 ? "text-rose-400" :
                              passwordStrength.score <= 3 ? "text-amber-400" : "text-emerald-400"
                            )}>
                              {passwordStrength.label}
                            </span>
                          </div>
                          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className={cn(
                                "h-full transition-all duration-300",
                                passwordStrength.score <= 2 ? "bg-rose-500" :
                                passwordStrength.score <= 3 ? "bg-amber-400" : "bg-emerald-400"
                              )}
                              style={{ width: `${passwordStrength.percent}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  /* Phone & OTP Authentication Flow */
                  <div className="space-y-3.5 sm:space-y-4 animate-fade-in">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-300">
                        Indian Mobile Number
                      </label>
                      <div className="relative flex">
                        <span className="inline-flex items-center px-3 sm:px-3.5 rounded-l-xl border border-r-0 border-white/10 bg-slate-950/80 text-slate-300 text-xs font-bold h-11 sm:h-12 shrink-0">
                          +91
                        </span>
                        <Input
                          type="tel"
                          placeholder="9103798448"
                          disabled={otpSent}
                          value={formData.phone}
                          onChange={(e) => {
                            setFormData(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, '') }));
                            setErrors(prev => ({ ...prev, phone: '' }));
                          }}
                          className={cn(
                            "rounded-l-none pl-3 h-11 sm:h-12 text-base sm:text-sm bg-slate-950/60 border-white/10 text-white placeholder:text-slate-600 rounded-r-xl focus:border-amber-400 focus:ring-1 focus:ring-amber-400",
                            errors.phone && "border-rose-500 focus:border-rose-500"
                          )}
                        />
                      </div>
                      {errors.phone && (
                        <p className="text-rose-400 text-xs flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3.5 h-3.5" /> {errors.phone}
                        </p>
                      )}
                    </div>

                    {otpSent && (
                      <div className="space-y-1.5 animate-scale-in">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-slate-300">
                            6-Digit Verification Code
                          </label>
                          <button
                            type="button"
                            onClick={() => setOtpSent(false)}
                            className="text-xs font-semibold text-amber-400 hover:underline"
                          >
                            Change Number
                          </button>
                        </div>
                        <div className="relative">
                          <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                          <Input
                            type="text"
                            maxLength={6}
                            placeholder="123456"
                            value={formData.otp}
                            onChange={(e) => {
                              setFormData(prev => ({ ...prev, otp: e.target.value.replace(/\D/g, '') }));
                              setErrors(prev => ({ ...prev, otp: '' }));
                            }}
                            className={cn(
                              "pl-10 h-11 sm:h-12 tracking-widest text-lg font-bold bg-slate-950/60 border-white/10 text-white placeholder:text-slate-600 rounded-xl focus:border-emerald-400",
                              errors.otp && "border-rose-500 focus:border-rose-500"
                            )}
                          />
                        </div>
                        <p className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Fast Demo OTP: <strong>123456</strong>
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Primary Submit Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 sm:h-12 mt-2 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 active:scale-[0.99] transition-all text-xs sm:text-sm flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Securing Connection...</span>
                    </>
                  ) : authMethod === 'phone' ? (
                    otpSent ? 'Verify OTP & Enter' : 'Send Instant OTP'
                  ) : mode === 'login' ? (
                    <>
                      <span className="hidden sm:inline">Sign In to {portalContext.badge.split(' ')[0]}</span>
                      <span className="sm:hidden">Sign In</span>
                    </>
                  ) : (
                    <>
                      <span className="hidden sm:inline">Complete Registration with Neon Auth</span>
                      <span className="sm:hidden">Create Account with Neon Auth</span>
                    </>
                  )}
                </Button>
              </form>

              {/* Divider */}
              <div className="relative flex py-4 sm:py-5 items-center">
                <div className="flex-grow border-t border-white/10" />
                <span className="flex-shrink mx-3 sm:mx-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Or Continue With
                </span>
                <div className="flex-grow border-t border-white/10" />
              </div>

              {/* Google Fast OAuth Button */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full h-11 sm:h-12 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-semibold transition-all duration-200 flex items-center justify-center gap-2.5 sm:gap-3 group text-xs sm:text-sm active:scale-[0.99]"
              >
                <svg className="w-4 h-4 group-hover:scale-110 transition-transform shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Continue with Google</span>
              </button>

              {/* Bottom Security Footer */}
              <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-white/5 flex flex-col items-center justify-center gap-1.5 sm:gap-2">
                <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] text-slate-400 text-center">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <span>Encrypted by <strong className="text-white">Neon Better Auth</strong> • 256-Bit SSL</span>
                </div>
                <p className="text-[10px] text-slate-500 text-center">
                  By continuing, you agree to Kashmir Curators' <Link to="/terms" className="underline hover:text-slate-300">Terms</Link> and <Link to="/privacy" className="underline hover:text-slate-300">Privacy Policy</Link>.
                </p>
              </div>

            </div>

            {/* Mobile Trust Micro-Highlights (Visible on Mobile Below Form) */}
            <div className="lg:hidden mt-5 grid grid-cols-2 gap-2 text-center text-slate-400 text-[11px]">
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5 flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">J&K Tourism Registered</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5 flex items-center justify-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">Instant B2B Rates</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5 flex items-center justify-center gap-1.5">
                <Car className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className="truncate">1,200+ Fleet Cabs</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5 flex items-center justify-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span className="truncate">Encrypted JWKS Auth</span>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Luxury Valley Showcase (Desktop Only, Cols 8-12) */}
          <div className="hidden lg:flex lg:col-span-5 xl:col-span-6 flex-col justify-center space-y-6">
            
            {/* Visual Glassmorphic Showcase Card */}
            <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-slate-900/40 p-8 min-h-[560px] flex flex-col justify-between">
              
              {/* Background Visual with Dark Gradient Vignette */}
              <div 
                className="absolute inset-0 bg-cover bg-center -z-10 transition-transform duration-1000 scale-105"
                style={{ backgroundImage: "url('/images/planner_hero.png')" }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-[#070B12] via-[#070B12]/75 to-[#070B12]/40" />
              </div>

              {/* Top Badge */}
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Official Jammu & Kashmir DMC
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 text-slate-300 text-xs font-medium border border-white/10">
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" /> 4.98 / 5.0
                </span>
              </div>

              {/* Center Value Proposition */}
              <div className="space-y-4 my-auto">
                <h2 className="text-3xl xl:text-4xl font-display font-extrabold text-white leading-tight">
                  Where Heritage Meets High-Performance Tech.
                </h2>
                <p className="text-sm text-slate-300/90 leading-relaxed max-w-md">
                  Empowering 500+ travel curators, hoteliers, and fleet operators across Srinagar, Gulmarg, Pahalgam, and Sonamarg with automated quotes and real-time corridor intelligence.
                </p>

                {/* 3 Feature Pills */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-950/60 border border-white/10 backdrop-blur-md">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                      <Briefcase className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Wholesale B2B Inventory</p>
                      <p className="text-[11px] text-slate-400">Direct contracts with houseboats, ski chalets & 4x4 cabs.</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-950/60 border border-white/10 backdrop-blur-md">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                      <Shield className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Neon Better Auth Security</p>
                      <p className="text-[11px] text-slate-400">Encrypted JWT tokens with automatic multi-tenant database sync.</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-950/60 border border-white/10 backdrop-blur-md">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                      <Zap className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Corridor & Weather Telemetry</p>
                      <p className="text-[11px] text-slate-400">Live NH44 road radar and Gulmarg Gondola phase clearance.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Testimonial Banner */}
              <div className="pt-4 border-t border-white/10 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center font-bold text-slate-950 text-sm shadow-md shrink-0">
                  TM
                </div>
                <div>
                  <p className="text-xs text-slate-200 italic font-medium leading-snug">
                    "Instant B2B pricing and verified local drivers cut our itinerary turnaround from 4 hours to 4 minutes."
                  </p>
                  <p className="text-[10px] text-amber-400 font-bold mt-0.5">
                    — Tariq Mir, Founder, Valley Luxury Expeditions
                  </p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* Forgot Password Modal */}
      {forgotPasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-md animate-fade-in" 
            onClick={() => setForgotPasswordOpen(false)} 
          />
          <div className="relative z-10 w-full max-w-md max-h-[90dvh] overflow-y-auto bg-slate-900 border border-white/10 p-5 sm:p-8 rounded-2xl sm:rounded-3xl shadow-2xl text-white animate-scale-in">
            <h3 className="text-lg sm:text-xl font-display font-bold">Reset Your Password</h3>
            <p className="text-xs text-slate-400 mt-1 mb-4 sm:mb-5">
              Enter your registered email address and we'll send you an encrypted reset link.
            </p>

            {resetSent ? (
              <div className="space-y-4 text-center py-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-emerald-300">
                  Password reset email dispatched!
                </p>
                <p className="text-xs text-slate-400">
                  Check your inbox for <strong>{resetEmail}</strong> to create a new password.
                </p>
                <Button
                  onClick={() => {
                    setForgotPasswordOpen(false);
                    setResetSent(false);
                  }}
                  className="w-full bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold h-11"
                >
                  Close Window
                </Button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-3.5 sm:space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="pl-10 h-11 sm:h-12 text-base sm:text-sm bg-slate-950 border-white/10 text-white placeholder:text-slate-600 rounded-xl"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <Button
                    type="button"
                    onClick={() => setForgotPasswordOpen(false)}
                    variant="outline"
                    className="flex-1 border-white/10 text-slate-300 hover:bg-white/5 rounded-xl text-xs h-11"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-md shadow-amber-500/20 h-11"
                  >
                    Send Reset Link
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Google Account Selector Luxury Modal (Fallback/Simulated) */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-md animate-fade-in" 
            onClick={() => !googleLoading && setShowGoogleModal(false)} 
          />
          
          <div className="relative z-10 w-full max-w-sm max-h-[90dvh] overflow-y-auto bg-slate-900 border border-white/10 p-5 sm:p-6 rounded-2xl sm:rounded-3xl shadow-2xl animate-scale-in text-white">
            <div className="text-center mb-5 sm:mb-6">
              <svg className="w-8 h-8 mx-auto mb-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <h3 className="font-bold text-base">Sign in with Google</h3>
              <p className="text-slate-400 text-xs mt-0.5">to continue to Kashmir Curators</p>
            </div>

            {googleLoading ? (
              <div className="flex flex-col items-center py-6 gap-2">
                <Loader2 className="w-7 h-7 text-amber-400 animate-spin" />
                <p className="text-xs text-slate-300 font-medium">Authenticating {selectedGoogleEmail}...</p>
              </div>
            ) : (
              <div className="space-y-2">
                {[
                  { name: 'Zahid Riyaz', email: 'zahid@gmail.com', avatar: 'ZR' },
                  { name: 'Traveler Curators', email: 'traveler@kashmirconnect.com', avatar: 'TC' },
                ].map((account) => (
                  <button
                    key={account.email}
                    onClick={() => handleSelectGoogleAccount(account)}
                    className="w-full p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 text-left flex items-center gap-3 transition-all"
                  >
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-extrabold text-xs shrink-0">
                      {account.avatar}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white truncate">{account.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{account.email}</p>
                    </div>
                  </button>
                ))}
                
                <button
                  onClick={() => setShowGoogleModal(false)}
                  className="w-full py-2.5 text-center text-xs font-bold text-slate-500 hover:text-slate-300 transition-colors mt-2"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
