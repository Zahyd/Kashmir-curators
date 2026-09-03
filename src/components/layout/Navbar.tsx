import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, User, LogOut, ChevronDown, Sparkles, LayoutDashboard, Building, Car, Compass, Map } from 'lucide-react';
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
  { href: '/travel-status', label: 'Travel Status' },
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
      "fixed top-0 left-0 right-0 z-50 transition-all duration-700 px-6 py-4 md:px-12 pointer-events-none",
      scrolled ? "md:py-4" : "md:py-8"
    )}>
      <div className={cn(
        "container mx-auto px-6 rounded-full transition-all duration-700 border pointer-events-auto",
        scrolled 
          ? "bg-white/90 dark:bg-[#05080a]/90 backdrop-blur-2xl border-slate-200/80 dark:border-white/10 shadow-xl shadow-slate-900/5 py-3" 
          : "bg-white/70 dark:bg-[#05080a]/70 backdrop-blur-md py-4 border-slate-200/50 dark:border-white/10 shadow-sm"
      )}>
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center group">
            <Logo className="h-12 w-auto transition-transform duration-500 group-hover:scale-105" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8 lg:gap-10">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "text-[11px] font-black uppercase tracking-[0.25em] transition-all duration-300 relative py-2 group/link",
                  isActive(link.href) ? "text-[#111439] dark:text-amber-400" : "text-[#111439]/65 dark:text-white/70 hover:text-[#111439] dark:hover:text-white"
                )}
              >
                {link.label}
                <span className={cn(
                  "absolute bottom-0 left-0 h-[2.5px] bg-[#111439] dark:bg-amber-400 transition-all duration-500 rounded-full",
                  isActive(link.href) ? "w-full" : "w-0 group-hover/link:w-1/2"
                )} />
              </Link>
            ))}
          </div>

          {/* Auth Section */}
          <div className="hidden md:flex items-center gap-5">
            {isAuthenticated || teamUser ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="h-11 px-5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[#111439] dark:text-white hover:bg-slate-200 dark:hover:bg-white/10 gap-3 group"
                  >
                    <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                      <User className="h-3 w-3 text-amber-700 dark:text-amber-400" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest">{user?.name || teamUser?.name}</span>
                    <ChevronDown className="h-4 w-4 text-[#111439]/40 dark:text-white/40 group-hover:text-[#111439] dark:group-hover:text-white transition-colors" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 bg-white/95 dark:bg-[#0c1216]/95 backdrop-blur-3xl border-slate-200 dark:border-white/10 text-[#111439] dark:text-white rounded-2xl p-2 mt-4 shadow-2xl">
                  {isAuthenticated && (
                    <DropdownMenuItem asChild className="rounded-xl py-3 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer">
                      <Link to="/profile" className="flex items-center gap-3">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span className="text-xs font-bold text-[#111439] dark:text-white">Guest Sanctuary</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {isAuthenticated && (user?.role === 'supplier' || user?.role === 'admin') && (
                    <DropdownMenuItem asChild className="rounded-xl py-3 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer">
                      <Link to="/vendor" className="flex items-center gap-3">
                        <Building className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <span className="text-xs font-bold text-[#111439] dark:text-white">Vendor Operations Hub</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {teamUser && (
                    <>
                      {['admin', 'operations', 'marketing'].includes(teamUser.role) && (
                        <DropdownMenuItem asChild className="rounded-xl py-3 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer">
                          <Link to="/admin" className="flex items-center gap-3">
                            <LayoutDashboard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            <span className="text-xs font-bold text-[#111439] dark:text-white">Director Access</span>
                          </Link>
                        </DropdownMenuItem>
                      )}
                      {(teamUser.role === 'sales' || teamUser.role === 'admin') && (
                        <DropdownMenuItem asChild className="rounded-xl py-3 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer">
                          <Link to="/sales/portal" className="flex items-center gap-3">
                            <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            <span className="text-xs font-bold text-[#111439] dark:text-white">Sales Intelligence</span>
                          </Link>
                        </DropdownMenuItem>
                      )}
                      {teamUser.role === 'field_agent' && (
                        <DropdownMenuItem asChild className="rounded-xl py-3 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer">
                          <Link to="/field/portal" className="flex items-center gap-3">
                            <Compass className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            <span className="text-xs font-bold text-[#111439] dark:text-white">Ground Escort Hub</span>
                          </Link>
                        </DropdownMenuItem>
                      )}
                      {teamUser.role === 'content_manager' && (
                        <DropdownMenuItem asChild className="rounded-xl py-3 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer">
                          <Link to="/curator/portal" className="flex items-center gap-3">
                            <Map className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                            <span className="text-xs font-bold text-[#111439] dark:text-white">Story Curator Desk</span>
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem asChild className="rounded-xl py-2.5 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer">
                        <Link to="/hotels" className="flex items-center gap-3">
                          <Building className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          <span className="text-xs font-bold text-[#111439] dark:text-white">Estates Index</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="rounded-xl py-2.5 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer">
                        <Link to="/cabs" className="flex items-center gap-3">
                          <Car className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          <span className="text-xs font-bold text-[#111439] dark:text-white">Fleet Dispatch</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator className="bg-slate-200 dark:bg-white/10 mx-2 my-2" />
                  <DropdownMenuItem onClick={logout} className="rounded-xl py-3 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 cursor-pointer flex items-center gap-3">
                    <LogOut className="h-4 w-4" />
                    <span className="text-xs font-bold">Terminate Session</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-4">
                <Link to="/auth">
                  <span className="text-[11px] font-black uppercase tracking-widest text-[#111439]/70 dark:text-white/70 hover:text-[#111439] dark:hover:text-white transition-colors cursor-pointer px-3">
                    Sign In
                  </span>
                </Link>
                <Link to="/auth?mode=signup">
                  <Button className="h-11 px-7 rounded-full bg-[#111439] hover:bg-[#1c225a] dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-black font-black text-[10px] uppercase tracking-widest shadow-lg shadow-[#111439]/15 transition-all duration-300 hover:scale-105 active:scale-95">
                    Become a Member
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden w-11 h-11 flex items-center justify-center rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[#111439] dark:text-white"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="h-5 w-5 text-[#111439] dark:text-white" /> : <Menu className="h-5 w-5 text-[#111439] dark:text-white" />}
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
                    "px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.25em] transition-all duration-300",
                    isActive(link.href) 
                      ? "bg-[#111439] dark:bg-amber-400 text-white dark:text-black" 
                      : "text-[#111439]/70 dark:text-white/70 hover:bg-slate-100 dark:hover:bg-white/5"
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <div className="h-[1px] bg-slate-200 dark:bg-white/10 my-4 mx-4" />
              {!isAuthenticated && !teamUser && (
                <div className="flex gap-4 p-4">
                  <Link to="/auth" className="flex-1" onClick={() => setIsOpen(false)}>
                    <Button variant="outline" className="w-full rounded-2xl h-12 border-slate-300 dark:border-white/20 text-[#111439] dark:text-white font-black text-[10px] uppercase tracking-widest">Sign In</Button>
                  </Link>
                  <Link to="/auth?mode=signup" className="flex-1" onClick={() => setIsOpen(false)}>
                    <Button className="w-full rounded-2xl h-12 bg-[#111439] hover:bg-[#1c225a] dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-black font-black text-[10px] uppercase tracking-widest">Join</Button>
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
