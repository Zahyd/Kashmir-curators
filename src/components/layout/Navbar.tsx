import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, User, LogOut, ChevronDown, Sparkles, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { useTeamAuth } from '@/contexts/TeamAuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/planner', label: 'Curate Trip' },
  { href: '/packages', label: 'Portfolio' },
  { href: '/hotels', label: 'Estates' },
  { href: '/cabs', label: 'Fleet' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { teamUser } = useTeamAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path: string) => location.pathname === path;
  const isLanding = location.pathname === '/';

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-700 px-6 py-4 md:px-12",
      scrolled ? "md:py-4" : "md:py-8"
    )}>
      <div className={cn(
        "container mx-auto px-6 rounded-full transition-all duration-700 border border-white/5",
        scrolled ? "bg-black/60 backdrop-blur-3xl shadow-2xl py-3" : "bg-transparent py-4 border-transparent"
      )}>
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center group">
            <Logo className="h-12 w-auto transition-transform duration-500 group-hover:scale-105" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-10">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "text-[11px] font-black uppercase tracking-[0.3em] transition-all duration-300 relative py-2 group/link",
                  isActive(link.href) ? "text-kashmir-gold" : "text-white/50 hover:text-white"
                )}
              >
                {link.label}
                <span className={cn(
                  "absolute bottom-0 left-0 h-[2px] bg-kashmir-gold transition-all duration-500 rounded-full",
                  isActive(link.href) ? "w-full" : "w-0 group-hover/link:w-1/2"
                )} />
              </Link>
            ))}
          </div>

          {/* Auth Section */}
          <div className="hidden md:flex items-center gap-6">
            {isAuthenticated || teamUser ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="h-12 px-6 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 gap-3 group"
                  >
                    <div className="w-6 h-6 rounded-full bg-kashmir-gold/20 flex items-center justify-center border border-kashmir-gold/20">
                      <User className="h-3 w-3 text-kashmir-gold" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest">{user?.name || teamUser?.name}</span>
                    <ChevronDown className="h-4 w-4 text-white/30 group-hover:text-white transition-colors" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 bg-[#0a0f12]/95 backdrop-blur-3xl border-white/10 rounded-2xl p-2 mt-4 shadow-2xl">
                  {isAuthenticated && (
                    <DropdownMenuItem asChild className="rounded-xl py-3 focus:bg-white/5 cursor-pointer">
                      <Link to="/profile" className="flex items-center gap-3">
                        <Sparkles className="w-4 h-4 text-kashmir-gold" />
                        <span className="text-xs font-bold text-white/80">Guest Sanctuary</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {teamUser && (
                    <>
                      {['admin', 'operations', 'marketing'].includes(teamUser.role) && (
                        <DropdownMenuItem asChild className="rounded-xl py-3 focus:bg-white/5 cursor-pointer">
                          <Link to="/admin" className="flex items-center gap-3">
                            <LayoutDashboard className="w-4 h-4 text-blue-400" />
                            <span className="text-xs font-bold text-white/80">Director Access</span>
                          </Link>
                        </DropdownMenuItem>
                      )}
                      {(teamUser.role === 'sales' || teamUser.role === 'admin') && (
                        <DropdownMenuItem asChild className="rounded-xl py-3 focus:bg-white/5 cursor-pointer">
                          <Link to="/sales/portal" className="flex items-center gap-3">
                            <Sparkles className="w-4 h-4 text-emerald-400" />
                            <span className="text-xs font-bold text-white/80">Sales Portal</span>
                          </Link>
                        </DropdownMenuItem>
                      )}
                    </>
                  )}
                  <DropdownMenuSeparator className="bg-white/5 mx-2 my-2" />
                  <DropdownMenuItem onClick={logout} className="rounded-xl py-3 focus:bg-destructive/10 text-destructive cursor-pointer flex items-center gap-3">
                    <LogOut className="h-4 w-4" />
                    <span className="text-xs font-bold">Terminate Session</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-4">
                <Link to="/auth">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/50 hover:text-white transition-colors cursor-pointer px-4">
                    Sign In
                  </span>
                </Link>
                <Link to="/auth?mode=signup">
                  <Button className="h-12 px-8 rounded-full bg-white text-black hover:bg-white/90 font-black text-[10px] uppercase tracking-widest shadow-xl shadow-white/5 transition-all duration-500 hover:scale-105 active:scale-95">
                    Become a Member
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden w-12 h-12 flex items-center justify-center rounded-full bg-white/5 border border-white/10"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="h-5 w-5 text-white" /> : <Menu className="h-5 w-5 text-white" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden mt-6 pb-6 animate-fade-in">
            <div className="flex flex-col gap-2 p-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-300",
                    isActive(link.href) 
                      ? "bg-kashmir-gold text-black" 
                      : "text-white/40 hover:bg-white/5"
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <div className="h-[1px] bg-white/5 my-4 mx-4" />
              {!isAuthenticated && !teamUser && (
                <div className="flex gap-4 p-4">
                  <Link to="/auth" className="flex-1" onClick={() => setIsOpen(false)}>
                    <Button variant="outline" className="w-full rounded-2xl h-14 border-white/10 text-white font-black text-[10px] uppercase tracking-widest">Sign In</Button>
                  </Link>
                  <Link to="/auth?mode=signup" className="flex-1" onClick={() => setIsOpen(false)}>
                    <Button className="w-full rounded-2xl h-14 bg-white text-black font-black text-[10px] uppercase tracking-widest">Join</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
