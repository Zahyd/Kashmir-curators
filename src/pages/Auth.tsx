import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, Loader2, AlertCircle, Phone, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/ui/Logo';

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, loginWithGoogle, signup, sendOtp, verifyOtp, isAuthenticated, isLoading, isAdmin } = useAuth();
  
  const [mode, setMode] = useState<'login' | 'signup'>(searchParams.get('mode') === 'signup' ? 'signup' : 'login');
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  
  const [showPassword, setShowPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Google Sign-In states
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [selectedGoogleEmail, setSelectedGoogleEmail] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    otp: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleGoogleLogin = () => {
    setShowGoogleModal(true);
  };

  const handleSelectGoogleAccount = async (account: { name: string; email: string }) => {
    setSelectedGoogleEmail(account.email);
    setGoogleLoading(true);
    
    // Luxury delay to simulate robust OAuth profile handshake
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
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

  useEffect(() => {
    if (isAuthenticated) {
      const defaultRedirect = isAdmin ? '/admin' : '/profile';
      const redirect = searchParams.get('redirect') || defaultRedirect;
      navigate(redirect);
    }
  }, [isAuthenticated, isAdmin, navigate, searchParams]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (authMethod === 'email') {
      if (mode === 'signup' && !formData.name.trim()) {
        newErrors.name = 'Name is required';
      }
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Invalid email format';
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
        newErrors.phone = 'Please enter a valid phone number';
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
    if (!password) return { score: 0, label: '' };
    
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    return { score, label: labels[Math.min(score - 1, 4)] || '' };
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
      }

      if (result.success) {
        toast.success(mode === 'login' ? 'Welcome back!' : 'Account created successfully!');
      } else {
        toast.error(result.error || 'Something went wrong');
      }
    } else if (authMethod === 'phone') {
      if (!otpSent) {
        const result = await sendOtp(formData.phone);
        if (result.success) {
          setOtpSent(true);
          toast.success('OTP sent to your phone! (Use 123456 for testing)');
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

  const passwordStrength = getPasswordStrength();
  const loading = isLoading || isProcessing;

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      {/* Dynamic Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/auth_bg.png')" }}
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      </div>

      <div className="relative z-10 w-full max-w-md bg-card/95 backdrop-blur-xl border border-white/10 p-8 md:p-10 rounded-[2rem] shadow-2xl animate-scale-in">
        <div className="flex justify-center mb-8">
          <Link to="/">
            <Logo className="h-12 w-auto hover:scale-105 transition-transform" isHero={false} />
          </Link>
        </div>

        <h1 className="font-display text-3xl font-bold mb-2 text-center text-primary">
          {mode === 'login' ? 'Welcome Back' : 'Create Account'}
        </h1>
        <p className="text-muted-foreground mb-6 text-center">
          {mode === 'login' 
            ? 'Sign in to continue your Kashmir journey' 
            : 'Join us and start exploring Paradise on Earth'}
        </p>

        {/* Auth Method Toggle */}
        <div className="flex bg-muted/50 p-1 rounded-xl mb-8">
          <button
            type="button"
            className={cn(
              "flex-1 py-2 text-sm font-semibold rounded-lg transition-all",
              authMethod === 'email' ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-primary"
            )}
            onClick={() => {
              setAuthMethod('email');
              setErrors({});
            }}
          >
            Email
          </button>
          <button
            type="button"
            className={cn(
              "flex-1 py-2 text-sm font-semibold rounded-lg transition-all",
              authMethod === 'phone' ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-primary"
            )}
            onClick={() => {
              setAuthMethod('phone');
              setErrors({});
              setMode('login'); // Phone is technically just login/verify
            }}
          >
            Phone (OTP)
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {authMethod === 'email' ? (
            <>
              {mode === 'signup' && (
                <div>
                  <label className="text-sm font-semibold mb-2 block text-primary">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, name: e.target.value }));
                        setErrors(prev => ({ ...prev, name: '' }));
                      }}
                      className={cn("pl-11 h-14 bg-muted/50 border-transparent focus:border-kashmir-gold", errors.name && "border-destructive focus:border-destructive")}
                    />
                  </div>
                  {errors.name && (
                    <p className="text-destructive text-sm mt-1.5 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" /> {errors.name}
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="text-sm font-semibold mb-2 block text-primary">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, email: e.target.value }));
                      setErrors(prev => ({ ...prev, email: '' }));
                    }}
                    className={cn("pl-11 h-14 bg-muted/50 border-transparent focus:border-kashmir-gold", errors.email && "border-destructive focus:border-destructive")}
                  />
                </div>
                {errors.email && (
                  <p className="text-destructive text-sm mt-1.5 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" /> {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block text-primary">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, password: e.target.value }));
                      setErrors(prev => ({ ...prev, password: '' }));
                    }}
                    className={cn("pl-11 pr-11 h-14 bg-muted/50 border-transparent focus:border-kashmir-gold", errors.password && "border-destructive focus:border-destructive")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-destructive text-sm mt-1.5 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" /> {errors.password}
                  </p>
                )}
                
                {mode === 'signup' && formData.password && (
                  <div className="mt-3 bg-muted/30 p-3 rounded-lg">
                    <div className="flex gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={cn(
                            "h-1.5 flex-1 rounded-full transition-colors duration-300",
                            level <= passwordStrength.score
                              ? passwordStrength.score <= 2
                                ? "bg-destructive"
                                : passwordStrength.score <= 3
                                ? "bg-kashmir-gold"
                                : "bg-green-500"
                              : "bg-muted-foreground/20"
                          )}
                        />
                      ))}
                    </div>
                    <p className={cn(
                      "text-xs font-medium text-right",
                      passwordStrength.score <= 2
                        ? "text-destructive"
                        : passwordStrength.score <= 3
                        ? "text-kashmir-gold"
                        : "text-green-500"
                    )}>
                      {passwordStrength.label} Password
                    </p>
                  </div>
                )}
              </div>

              {mode === 'login' && (
                <div className="flex justify-end">
                  <button type="button" className="text-sm font-medium text-kashmir-gold hover:underline">
                    Forgot password?
                  </button>
                </div>
              )}
            </>
          ) : (
            /* PHONE AUTHENTICATION UI */
            <>
              <div>
                <label className="text-sm font-semibold mb-2 block text-primary">Phone Number</label>
                <div className="relative flex">
                  <span className="inline-flex items-center px-4 rounded-l-xl border border-r-0 border-transparent bg-muted/80 text-muted-foreground text-sm font-semibold h-14">
                    +91
                  </span>
                  <Input
                    type="tel"
                    placeholder="9999999999"
                    value={formData.phone}
                    disabled={otpSent}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, '') }));
                      setErrors(prev => ({ ...prev, phone: '' }));
                    }}
                    className={cn("rounded-l-none pl-4 h-14 bg-muted/50 border-transparent focus:border-kashmir-gold", errors.phone && "border-destructive focus:border-destructive")}
                  />
                </div>
                {errors.phone && (
                  <p className="text-destructive text-sm mt-1.5 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" /> {errors.phone}
                  </p>
                )}
              </div>

              {otpSent && (
                <div className="animate-fade-in">
                  <label className="text-sm font-semibold mb-2 block text-primary">Enter OTP</label>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="123456"
                      maxLength={6}
                      value={formData.otp}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, otp: e.target.value.replace(/\D/g, '') }));
                        setErrors(prev => ({ ...prev, otp: '' }));
                      }}
                      className={cn("pl-11 tracking-widest font-semibold h-14 bg-muted/50 border-transparent focus:border-kashmir-gold", errors.otp && "border-destructive focus:border-destructive")}
                    />
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    {errors.otp ? (
                      <p className="text-destructive text-sm flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" /> {errors.otp}
                      </p>
                    ) : (
                      <p className="text-muted-foreground text-xs">Test OTP: 123456</p>
                    )}
                    <button 
                      type="button" 
                      onClick={() => setOtpSent(false)}
                      className="text-xs font-semibold text-kashmir-gold hover:underline"
                    >
                      Change Number
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          <Button
            type="submit"
            variant="gold"
            size="lg"
            className="w-full h-14 text-lg rounded-xl shadow-gold mt-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : authMethod === 'phone' ? (
              otpSent ? 'Verify & Login' : 'Send OTP'
            ) : mode === 'login' ? (
              'Sign In'
            ) : (
              'Create Account'
            )}
          </Button>
        </form>

        {/* Dynamic OR Divider */}
        <div className="relative flex py-4 items-center">
          <div className="flex-grow border-t border-white/5"></div>
          <span className="flex-shrink mx-4 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">OR</span>
          <div className="flex-grow border-t border-white/5"></div>
        </div>

        {/* Premium Google Button */}
        <Button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full h-14 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-semibold transition-all duration-300 flex items-center justify-center gap-3 relative overflow-hidden group shadow-md"
        >
          <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>Continue with Google</span>
        </Button>

        {authMethod === 'email' && (
          <p className="text-center text-muted-foreground mt-6 text-sm">
            {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login');
                setErrors({});
                setFormData({ name: '', email: '', password: '', phone: '', otp: '' });
              }}
              className="text-primary font-bold hover:text-kashmir-gold hover:underline transition-colors ml-1"
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        )}
      </div>

      {/* Google Account Selector Luxury Modal */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-fade-in" onClick={() => !googleLoading && setShowGoogleModal(false)} />
          
          <div className="relative z-10 w-full max-w-sm bg-[#0a0f12]/95 border border-white/10 p-6 rounded-[2rem] shadow-2xl animate-scale-in text-white">
            <div className="text-center mb-6">
              <svg className="w-10 h-10 mx-auto mb-3" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <h3 className="font-bold text-lg">Sign in with Google</h3>
              <p className="text-white/40 text-xs mt-1">to continue to Kashmir Curators</p>
            </div>

            {googleLoading ? (
              <div className="flex flex-col items-center py-8 gap-3">
                <Loader2 className="h-8 w-8 text-kashmir-gold animate-spin" />
                <p className="text-xs text-white/60 font-medium">Connecting securely to {selectedGoogleEmail}...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {[
                  { name: 'Zahid Riyaz', email: 'zahid@gmail.com', avatar: 'ZR' },
                  { name: 'Traveler Curators', email: 'traveler@kashmirconnect.com', avatar: 'TC' },
                ].map((account) => (
                  <button
                    key={account.email}
                    onClick={() => handleSelectGoogleAccount(account)}
                    className="w-full p-3 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 text-left flex items-center gap-3 transition-all duration-300"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-kashmir-gold to-amber-600 flex items-center justify-center text-black font-black text-sm">
                      {account.avatar}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{account.name}</p>
                      <p className="text-[11px] text-white/40">{account.email}</p>
                    </div>
                  </button>
                ))}
                
                <button
                  onClick={() => {
                    const newEmail = prompt('Enter your Google email:');
                    if (newEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
                      handleSelectGoogleAccount({ name: newEmail.split('@')[0], email: newEmail });
                    } else if (newEmail) {
                      toast.error('Invalid email format');
                    }
                  }}
                  className="w-full py-3 text-center border border-dashed border-white/10 hover:border-white/30 rounded-2xl text-xs font-semibold text-white/50 hover:text-white transition-all duration-300"
                >
                  + Use another Google account
                </button>
                
                <button
                  onClick={() => setShowGoogleModal(false)}
                  className="w-full py-3 mt-2 text-center text-xs font-bold text-white/30 hover:text-white/60 transition-colors"
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
