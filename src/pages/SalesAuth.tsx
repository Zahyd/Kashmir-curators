import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Key, Loader2, AlertCircle, ArrowRight, Sparkles, Users, TrendingUp, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useTeamAuth, ROLE_LABELS, ROLE_COLORS } from '@/contexts/TeamAuthContext';
import { SOCKET_URL } from '@/lib/api';

export default function SalesAuth() {
  const navigate = useNavigate();
  const { teamUser, isTeamAuthenticated, teamLogin } = useTeamAuth();
  const [employeeCode, setEmployeeCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  // Google workspace login states
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [selectedGoogleEmail, setSelectedGoogleEmail] = useState('');

  const handleSelectGoogleAccount = async (account: { name: string; email: string; code: string }) => {
    setSelectedGoogleEmail(account.email);
    setGoogleLoading(true);
    
    // Luxury workspace handshaking simulation
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    const result = await teamLogin(account.code);
    
    if (result.success) {
      toast.success(`Access granted! Google Workspace verified.`);
      setShowGoogleModal(false);
    } else {
      setError(result.error || 'Google Workspace auth failed');
      toast.error('Workspace verification failed');
    }
    
    setGoogleLoading(false);
    setSelectedGoogleEmail('');
  };
  useEffect(() => {
    if (isTeamAuthenticated && teamUser) {
      if (teamUser.role === 'sales') {
        navigate('/sales/portal');
      } else {
        navigate('/admin');
      }
    }
  }, [isTeamAuthenticated, teamUser, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeCode.trim()) {
      setError('Employee code is required');
      return;
    }

    setIsProcessing(true);
    setError('');

    const result = await teamLogin(employeeCode);

    if (result.success) {
      toast.success(`Welcome to Kashmir Curators Command Center`);
      // Navigation handled by useEffect above
    } else {
      setError(result.error || 'Authentication failed');
      toast.error('Authentication Failed');
    }

    setIsProcessing(false);
  };

  const roleCards = [
    { code: 'ADMIN001', role: 'Director', desc: 'Full system access', color: 'text-kashmir-gold', bg: 'bg-kashmir-gold/10' },
    { code: 'OPS001', role: 'Operations', desc: 'Lead review & assignment', color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { code: 'SALES001', role: 'Sales', desc: 'Pipeline & itinerary builder', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { code: 'MKT001', role: 'Marketing', desc: 'Content & media management', color: 'text-purple-400', bg: 'bg-purple-500/10' },
  ];

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-[#05080a] overflow-hidden">
      {/* Premium Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-kashmir-gold/5 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-amber-600/5 blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute inset-0 bg-[url('/images/grid.png')] opacity-[0.03] bg-repeat pointer-events-none" />
      </div>

      <div className="relative z-10 w-full max-w-md animate-fade-up">
        {/* Logo/Brand Area */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-kashmir-gold to-amber-600 p-0.5 mb-6 shadow-2xl shadow-kashmir-gold/20">
            <div className="w-full h-full bg-[#0a0f12] rounded-[1.4rem] flex items-center justify-center">
              <Shield className="w-10 h-10 text-kashmir-gold" />
            </div>
          </div>
          <h1 className="font-display text-4xl font-bold text-white mb-2 tracking-tight">
            Team<span className="text-kashmir-gold">Portal</span>
          </h1>
          <p className="text-white/40 font-medium tracking-wide uppercase text-[10px]">
            Authorized Personnel Only • Kashmir Curators
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <a 
              href="/" 
              className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 hover:text-kashmir-gold transition-colors flex items-center gap-2"
            >
              <ArrowRight className="w-3 h-3 rotate-180" /> Return to Main Site
            </a>
            <span className="text-[10px] text-white/10">|</span>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">System Live</span>
            </div>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-[#0a0f12]/80 backdrop-blur-2xl border border-white/10 p-8 md:p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-kashmir-gold/50 to-transparent opacity-50" />
          
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-2">Secure Team Access</h2>
            <p className="text-white/40 text-sm">Enter your employee code to access your role-based workspace.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-white/50 ml-1">Employee ID Code</label>
              <div className="relative group/input">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/20 group-focus-within/input:text-kashmir-gold transition-colors" />
                <Input
                  type="text"
                  placeholder="e.g. SALES001, OPS001, ADMIN001"
                  value={employeeCode}
                  onChange={(e) => {
                    setEmployeeCode(e.target.value.toUpperCase());
                    setError('');
                  }}
                  className={cn(
                    "pl-12 h-14 bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-2xl focus:ring-kashmir-gold/30 focus:border-kashmir-gold transition-all",
                    error && "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20"
                  )}
                />
              </div>
              {error && (
                <div className="flex items-center gap-2 text-red-400 text-xs mt-2 ml-1 animate-in fade-in slide-in-from-top-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            <Button
              type="submit"
              disabled={isProcessing}
              className="w-full h-14 text-lg font-bold rounded-2xl bg-kashmir-gold text-black hover:bg-amber-500 transition-all duration-500 shadow-lg shadow-kashmir-gold/20 relative overflow-hidden group/btn"
            >
              {isProcessing ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Authenticating...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <span>Access Portal</span>
                  <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                </div>
              )}
            </Button>
            
            {/* Premium Divider */}
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-white/5"></div>
              <span className="flex-shrink mx-4 text-[9px] font-black uppercase tracking-[0.2em] text-white/20">OR</span>
              <div className="flex-grow border-t border-white/5"></div>
            </div>

            {/* Google Workspace Verification Button */}
            <Button
              type="button"
              onClick={() => setShowGoogleModal(true)}
              className="w-full h-14 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold transition-all duration-300 flex items-center justify-center gap-3 relative overflow-hidden group shadow-lg"
            >
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continue with Google Workspace</span>
            </Button>
            
            <div className="pt-4 flex flex-col items-center gap-2">
              <button 
                type="button"
                onClick={async () => {
                  const start = Date.now();
                  try {
                    const res = await fetch(`${SOCKET_URL}/health-check`);
                    const dbRes = await fetch(`${SOCKET_URL}/db-check`);
                    
                    if (res.ok && dbRes.ok) {
                      toast.success(`Full System Operational (${Date.now() - start}ms)`);
                    } else if (res.ok) {
                      toast.warning('Server up, but Database unreachable.');
                    } else {
                      throw new Error();
                    }
                  } catch (e) {
                    toast.error('System Unreachable. Check Render deployment status.');
                  }
                }}
                className="text-[9px] font-black uppercase tracking-[0.2em] text-white/10 hover:text-white/40 transition-colors flex items-center gap-2"
              >
                <TrendingUp className="w-3 h-3" /> Run System Diagnostics
              </button>
            </div>
          </form>

          {/* Role Quick-Access Cards */}
          <div className="mt-10 pt-8 border-t border-white/5">
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20 mb-4 text-center">Available Roles for Testing</p>
            <div className="grid grid-cols-2 gap-3">
              {roleCards.map((rc) => (
                <button
                  key={rc.code}
                  type="button"
                  onClick={() => {
                    setEmployeeCode(rc.code);
                    setError('');
                  }}
                  className={cn(
                    "p-4 rounded-2xl border border-white/5 text-left hover:border-white/20 transition-all duration-300 group/role",
                    rc.bg
                  )}
                >
                  <p className={cn("text-xs font-black", rc.color)}>{rc.role}</p>
                  <p className="text-[9px] text-white/30 mt-0.5">{rc.desc}</p>
                  <p className="text-[8px] text-white/15 mt-2 font-mono">{rc.code}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <p className="text-center text-white/20 text-[10px] mt-8 uppercase tracking-[0.3em] font-bold">
          &copy; 2026 Kashmir Curators Management Suite
        </p>
      </div>

      {/* Google Workspace Account Selector Modal */}
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
              <h3 className="font-bold text-lg">Continue with Google</h3>
              <p className="text-white/40 text-xs mt-1">Single Sign-On • kashmirconnect.com</p>
            </div>

            {googleLoading ? (
              <div className="flex flex-col items-center py-8 gap-3">
                <Loader2 className="h-8 w-8 text-kashmir-gold animate-spin" />
                <p className="text-xs text-white/60 font-medium">Verifying Workspace credentials for {selectedGoogleEmail}...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {[
                  { name: 'Zahid Khan (Director)', email: 'admin001@kashmirconnect.com', avatar: 'ZK', code: 'ADMIN001' },
                  { name: 'Sales Executive (001)', email: 'sales001@kashmirconnect.com', avatar: 'SE', code: 'SALES001' },
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
                    const newEmail = prompt('Enter your Google Workspace email:');
                    if (newEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
                      // Check prefix or assign random code
                      const upper = newEmail.toUpperCase();
                      let code = 'SALES001';
                      if (upper.includes('ADMIN')) code = 'ADMIN001';
                      else if (upper.includes('OPS')) code = 'OPS001';
                      else if (upper.includes('MKT')) code = 'MKT001';
                      
                      handleSelectGoogleAccount({ name: newEmail.split('@')[0], email: newEmail, code });
                    } else if (newEmail) {
                      toast.error('Invalid email format');
                    }
                  }}
                  className="w-full py-3 text-center border border-dashed border-white/10 hover:border-white/30 rounded-2xl text-xs font-semibold text-white/50 hover:text-white transition-all duration-300"
                >
                  + Add another Workspace account
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
