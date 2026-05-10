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

  // Redirect if already logged in
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
    </div>
  );
}
