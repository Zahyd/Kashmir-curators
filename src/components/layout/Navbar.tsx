import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Menu, X, User, LogOut, ChevronDown, Sparkles, LayoutDashboard, 
  Building, Building2, Car, Compass, Map, Phone, Headphones, Sun, Moon 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { useTeamAuth } from '@/contexts/TeamAuthContext';
import { useLeadCapture } from '@/contexts/LeadCaptureContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/packages', label: 'Itineraries' },
  { href: '/hotels', label: 'Houseboats & Stays' },
  { href: '/cabs', label: 'Cabs & 4x4' },
  { href: '/travel-status', label: 'Road Radar', isLive: true },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { teamUser } = useTeamAuth();
  const { openLeadModal, openCallbackModal } = useLeadCapture();
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-500 px-2.5 sm:px-4 md:px-8 pointer-events-none",
      scrolled ? "py-2 sm:py-3" : "py-3 sm:py-5 md:py-6"
    )}>
      <div className={cn(
        "container mx-auto px-3.5 sm:px-5 md:px-7 transition-all duration-500 border pointer-events-auto",
        isOpen ? "rounded-3xl shadow-2xl" : "rounded-full shadow-sm",
        scrolled 
          ? "bg-white/95 dark:bg-[#070b0e]/95 backdrop-blur-2xl border-slate-200/90 dark:border-white/10 shadow-xl shadow-slate-900/10 py-2 sm:py-2.5" 
          : "bg-white/85 dark:bg-[#070b0e]/80 backdrop-blur-xl py-2.5 sm:py-3.5 border-slate-200/60 dark:border-white/10"
      )}>
        <div className="flex items-center justify-between">
          
          {/* Logo */}
          <Link to="/" className="flex items-center group shrink-0">
            <Logo className="h-8 sm:h-9 md:h-11 w-auto transition-transform duration-300 group-hover:scale-105" />
          </Link>

          {/* Desktop Navigation Links (Clear, Uncrowded) */}
          <div className="hidden lg:flex items-center gap-6 xl:gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300 relative py-1.5 flex items-center gap-1.5 group/link",
                  isActive(link.href) 
                    ? "text-amber-600 dark:text-amber-400 font-extrabold" 
                    : "text-[#111439]/80 dark:text-white/75 hover:text-[#111439] dark:hover:text-white"
                )}
              >
                <span>{link.label}</span>
                {link.isLive && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                )}
                <span className={cn(
                  "absolute bottom-0 left-0 h-[2.5px] bg-amber-500 dark:bg-amber-400 transition-all duration-300 rounded-full",
                  isActive(link.href) ? "w-full" : "w-0 group-hover/link:w-1/2"
                )} />
              </Link>
            ))}

            {/* B2B Partner Desk Pill */}
            <Link
              to="/agent"
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all",
                isActive('/agent')
                  ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                  : "bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-700 dark:text-amber-400"
              )}
            >
              <Building2 className="w-3 h-3" />
              <span>B2B Desk</span>
            </Link>
          </div>

          {/* Right Action Hub */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 md:gap-3 shrink-0">
            
            {/* Daylight / Night View Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              title={isDark ? "Switch to Daylight Mode" : "Switch to Night Mode"}
              aria-label="Toggle theme"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border border-slate-300 dark:border-white/15 bg-slate-100 dark:bg-white/5 text-[#111439] dark:text-amber-400 hover:bg-slate-200 dark:hover:bg-white/15 transition-all hover:scale-105 active:scale-95 shadow-sm shrink-0"
            >
              {isDark ? (
                <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 animate-spin-slow" />
              ) : (
                <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#111439]" />
              )}
            </button>

            {/* Talk to Expert / Concierge Callback */}
            <button
              onClick={() => openCallbackModal({ sourceCta: 'NAVBAR_EXPERT' })}
              className="hidden xl:flex items-center gap-1.5 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-[#111439]/80 dark:text-white/80 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
            >
              <Headphones className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Concierge</span>
            </button>

            {/* Authenticated User Menu or Guest Actions */}
            {isAuthenticated || teamUser ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="h-9 sm:h-10 px-3 sm:px-4 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[#111439] dark:text-white hover:bg-slate-200 dark:hover:bg-white/10 gap-1.5 sm:gap-2.5 group"
                  >
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                      <User className="h-3 w-3 text-amber-700 dark:text-amber-400" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest max-w-[70px] sm:max-w-[90px] truncate">{user?.name || teamUser?.name}</span>
                    <ChevronDown className="h-3.5 w-3.5 text-[#111439]/40 dark:text-white/40 group-hover:text-[#111439] dark:group-hover:text-white transition-colors" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 bg-white/95 dark:bg-[#0c1216]/95 backdrop-blur-3xl border-slate-200 dark:border-white/10 text-[#111439] dark:text-white rounded-2xl p-2 mt-4 shadow-2xl">
                  {isAuthenticated && (
                    <DropdownMenuItem asChild className="rounded-xl py-2.5 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer">
                      <Link to="/agent" className="flex items-center gap-3">
                        <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-xs font-bold text-[#111439] dark:text-white">Agent Workspace</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {isAuthenticated && (
                    <DropdownMenuItem asChild className="rounded-xl py-2.5 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer">
                      <Link to="/profile" className="flex items-center gap-3">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span className="text-xs font-bold text-[#111439] dark:text-white">Guest Sanctuary</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {isAuthenticated && (user?.role === 'supplier' || user?.role === 'admin') && (
                    <DropdownMenuItem asChild className="rounded-xl py-2.5 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer">
                      <Link to="/vendor" className="flex items-center gap-3">
                        <Building className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <span className="text-xs font-bold text-[#111439] dark:text-white">Vendor Hub</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {teamUser && (
                    <>
                      {['admin', 'operations', 'marketing'].includes(teamUser.role) && (
                        <DropdownMenuItem asChild className="rounded-xl py-2.5 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer">
                          <Link to="/admin" className="flex items-center gap-3">
                            <LayoutDashboard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            <span className="text-xs font-bold text-[#111439] dark:text-white">Director Desk</span>
                          </Link>
                        </DropdownMenuItem>
                      )}
                      {(teamUser.role === 'sales' || teamUser.role === 'admin') && (
                        <DropdownMenuItem asChild className="rounded-xl py-2.5 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer">
                          <Link to="/sales/portal" className="flex items-center gap-3">
                            <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            <span className="text-xs font-bold text-[#111439] dark:text-white">Sales Desk</span>
                          </Link>
                        </DropdownMenuItem>
                      )}
                    </>
                  )}
                  <DropdownMenuSeparator className="bg-slate-200 dark:bg-white/10 mx-2 my-2" />
                  <DropdownMenuItem onClick={logout} className="rounded-xl py-2.5 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 cursor-pointer flex items-center gap-3">
                    <LogOut className="h-4 w-4" />
                    <span className="text-xs font-bold">Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/auth" className="hidden sm:inline-block">
                <span className="text-[11px] font-black uppercase tracking-widest text-[#111439]/80 dark:text-white/80 hover:text-amber-600 dark:hover:text-amber-400 transition-colors px-2 cursor-pointer">
                  Sign In
                </span>
              </Link>
            )}

            {/* Single Unified Primary CTA (Desktop & Tablet) */}
            <Button 
              onClick={() => openLeadModal({ sourceCta: 'PLAN_MY_TRIP_NAVBAR' })}
              className="hidden sm:inline-flex h-10 sm:h-11 px-4 sm:px-6 rounded-full bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-amber-500/25 transition-all duration-300 hover:scale-105 active:scale-95 items-center gap-1.5 shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Curate Trip</span>
            </Button>

            {/* Mobile Menu Toggle Button - Always visible on < lg */}
            <button
              className="lg:hidden w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[#111439] dark:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-colors shrink-0"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="h-4 w-4 sm:h-5 sm:w-5" /> : <Menu className="h-4 w-4 sm:h-5 sm:w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isOpen && (
          <div className="lg:hidden mt-3 pb-3 animate-fade-in border-t border-slate-200 dark:border-white/10 pt-3 max-h-[75vh] overflow-y-auto">
            <div className="flex flex-col gap-2 p-1">
              
              {/* Primary Mobile Action */}
              <Button 
                onClick={() => {
                  setIsOpen(false);
                  openLeadModal({ sourceCta: 'PLAN_MY_TRIP_NAVBAR_MOBILE' });
                }}
                className="w-full h-12 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black text-[11px] uppercase tracking-widest shadow-md flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Curate My Kashmir Trip</span>
              </Button>

              {/* Mobile Links */}
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "px-5 py-3 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-between",
                    isActive(link.href) 
                      ? "bg-[#111439] dark:bg-amber-400 text-white dark:text-black font-extrabold" 
                      : "text-[#111439]/80 dark:text-white/80 hover:bg-slate-100 dark:hover:bg-white/5"
                  )}
                >
                  <span>{link.label}</span>
                  {link.isLive && (
                    <span className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-500">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      LIVE RADAR
                    </span>
                  )}
                </Link>
              ))}

              {/* B2B Partner Desk Link in Mobile */}
              <Link
                to="/agent"
                onClick={() => setIsOpen(false)}
                className="px-5 py-3 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 flex items-center gap-2"
              >
                <Building2 className="w-4 h-4" />
                <span>B2B Agent Workspace</span>
              </Link>

              {/* Theme & Concierge Quick Actions */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="h-11 rounded-2xl border border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-[#111439] dark:text-white font-bold text-xs flex items-center justify-center gap-2"
                >
                  {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#111439]" />}
                  <span>{isDark ? 'Daylight' : 'Night'}</span>
                </button>

                <button
                  onClick={() => {
                    setIsOpen(false);
                    openCallbackModal({ sourceCta: 'MOBILE_CONCIERGE' });
                  }}
                  className="h-11 rounded-2xl border border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-[#111439] dark:text-white font-bold text-xs flex items-center justify-center gap-2"
                >
                  <Headphones className="w-4 h-4 text-amber-500" />
                  <span>Call Concierge</span>
                </button>
              </div>

              {!isAuthenticated && !teamUser && (
                <div className="pt-2">
                  <Link to="/auth" onClick={() => setIsOpen(false)}>
                    <Button variant="outline" className="w-full rounded-2xl h-11 border-slate-300 dark:border-white/20 text-[#111439] dark:text-white font-black text-[10px] uppercase tracking-widest">
                      Sign In
                    </Button>
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
