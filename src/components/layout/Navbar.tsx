import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Menu, X, User, LogOut, ChevronDown, Sparkles, LayoutDashboard, 
  Building2, Car, Compass, Headphones, Sun, Moon,
  Package, ArrowRight, Globe, BedDouble, Briefcase
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { useTeamAuth } from '@/contexts/TeamAuthContext';
import { useLeadCapture } from '@/contexts/LeadCaptureContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useCurrency, SUPPORTED_CURRENCIES, CurrencyCode } from '@/contexts/CurrencyContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import AiTripCuratorModal from '@/components/planner/AiTripCuratorModal';

const navLinks = [
  { href: '/packages', label: 'Itineraries' },
  { href: '/hotels', label: 'Stays & Houseboats' },
  { href: '/cabs', label: '4x4 Fleet' },
  { href: '/travel-status', label: 'Road Radar', isLive: true },
];

const b2bPortals = [
  {
    href: '/agent',
    label: 'Travel Agency OS',
    desc: 'Wholesale net rates & 90s white-label quotes',
    icon: Briefcase,
    accent: 'text-amber-500',
  },
  {
    href: '/hospitality',
    label: 'Hoteliers & CRS Desk',
    desc: 'Live inventory, seasonal tariffs & reception',
    icon: BedDouble,
    accent: 'text-emerald-500',
  },
  {
    href: '/driver',
    label: 'Cab Fleet & Chauffeurs',
    desc: 'Dispatch cockpit & snow-pass compliance',
    icon: Car,
    accent: 'text-sky-500',
  },
  {
    href: '/vendor',
    label: 'Partner Onboarding',
    desc: 'Register your agency, hotel, or fleet',
    icon: Building2,
    accent: 'text-purple-500',
  },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { teamUser } = useTeamAuth();
  const { openLeadModal, openCallbackModal } = useLeadCapture();
  const { isDark, toggleTheme } = useTheme();
  const { currency, config, setCurrency } = useCurrency();
  const [aiCuratorOpen, setAiCuratorOpen] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;

    const handleScroll = () => {
      const currentY = window.scrollY;
      setScrolled(currentY > 30);

      if (isOpen) {
        setIsVisible(true);
        lastY = currentY;
        return;
      }

      if (currentY <= 50) {
        setIsVisible(true);
      } else if (currentY > lastY + 10) {
        setIsVisible(false);
      } else if (currentY < lastY - 8) {
        setIsVisible(true);
      }

      lastY = currentY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isOpen]);

  useEffect(() => {
    setIsVisible(true);
  }, [location.pathname]);

  const isActive = (path: string) => location.pathname === path;
  const isB2BRoute = ['/agent', '/hospitality', '/driver', '/vendor'].some((p) =>
    location.pathname.startsWith(p)
  );

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out px-3 sm:px-6 md:px-8 pointer-events-none',
        scrolled ? 'py-2 sm:py-3' : 'py-3 sm:py-5',
        isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
      )}
    >
      <div
        className={cn(
          'container mx-auto px-4 sm:px-6 transition-all duration-500 pointer-events-auto border',
          isOpen ? 'rounded-3xl shadow-2xl' : 'rounded-full shadow-lg',
          scrolled
            ? 'bg-white/95 dark:bg-[#07090E]/92 backdrop-blur-2xl border-slate-200/80 dark:border-white/10 shadow-slate-900/10 dark:shadow-black/50 py-2 sm:py-2.5'
            : 'bg-white/90 dark:bg-[#07090E]/85 backdrop-blur-xl border-slate-200/70 dark:border-white/10 shadow-slate-900/5 dark:shadow-black/40 py-2.5 sm:py-3'
        )}
      >
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* 1. Left: Brand Logo */}
          <Link to="/" className="flex items-center group shrink-0">
            <Logo
              isDarkBg={isDark}
              className="h-8 sm:h-9 md:h-10 w-auto transition-transform duration-300 group-hover:scale-105"
            />
          </Link>

          {/* 2. Center: Navigation Links & B2B Travel OS Dropdown */}
          <div className="hidden lg:flex items-center gap-5 xl:gap-7">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  'text-[11px] font-bold uppercase tracking-[0.16em] transition-all duration-300 relative py-1.5 flex items-center gap-1.5 group/link whitespace-nowrap',
                  isActive(link.href)
                    ? 'text-amber-600 dark:text-amber-400 font-extrabold'
                    : 'text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-white'
                )}
              >
                <span>{link.label}</span>
                {link.isLive && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[8px] font-mono font-bold border border-emerald-500/25">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    LIVE
                  </span>
                )}
                <span
                  className={cn(
                    'absolute bottom-0 left-0 h-[2px] bg-amber-500 dark:bg-amber-400 transition-all duration-300 rounded-full',
                    isActive(link.href) ? 'w-full' : 'w-0 group-hover/link:w-full'
                  )}
                />
              </Link>
            ))}

            {/* B2B Partner OS Dropdown */}
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border whitespace-nowrap',
                    isB2BRoute
                      ? 'bg-amber-500 text-black border-amber-500 font-extrabold shadow-sm'
                      : 'border-slate-200 dark:border-white/15 bg-slate-50/80 dark:bg-white/[0.04] text-slate-700 dark:text-slate-200 hover:border-amber-400/50 hover:bg-amber-500/10'
                  )}
                >
                  <Building2 className={cn('w-3 h-3', isB2BRoute ? 'text-black' : 'text-amber-500')} />
                  <span>Partner OS</span>
                  <ChevronDown className="w-3 h-3 opacity-70" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="center"
                className="w-72 bg-white/95 dark:bg-[#0F141C]/95 backdrop-blur-2xl border-slate-200 dark:border-white/10 text-slate-800 dark:text-white rounded-2xl p-2 mt-3 shadow-2xl"
              >
                <div className="px-3 py-2 border-b border-slate-200/70 dark:border-white/10 mb-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">
                    B2B Operating Portals
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Built for agencies, hoteliers & cab fleets
                  </p>
                </div>
                {b2bPortals.map((portal) => {
                  const Icon = portal.icon;
                  return (
                    <DropdownMenuItem
                      key={portal.href}
                      asChild
                      className="rounded-xl p-2.5 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer"
                    >
                      <Link to={portal.href} className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                          <Icon className={cn('w-4 h-4', portal.accent)} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                            {portal.label}
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                            {portal.desc}
                          </p>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* 3. Right Action Hub */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Live Currency Selector (Desktop) */}
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Select display currency"
                  className="hidden md:inline-flex items-center gap-1.5 h-8 sm:h-9 px-2.5 rounded-full border border-slate-200 dark:border-white/10 bg-slate-100/80 dark:bg-white/5 text-slate-800 dark:text-white hover:border-amber-400/50 transition-all text-[10px] font-mono font-bold"
                  title="Switch live pricing currency"
                >
                  <Globe className="w-3 h-3 text-amber-500" />
                  <span>{config.code}</span>
                  <span className="text-slate-400 dark:text-white/40">{config.symbol.trim()}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48 bg-white/95 dark:bg-[#0F141C]/95 backdrop-blur-2xl border-slate-200 dark:border-white/10 text-slate-800 dark:text-white rounded-2xl p-1.5 mt-3 shadow-2xl"
              >
                <p className="px-2.5 py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400">
                  Live Tariff Currency
                </p>
                {(Object.keys(SUPPORTED_CURRENCIES) as CurrencyCode[]).map((code) => {
                  const item = SUPPORTED_CURRENCIES[code];
                  const selected = currency === code;
                  return (
                    <DropdownMenuItem
                      key={code}
                      onClick={() => setCurrency(code)}
                      className={cn(
                        'rounded-xl px-2.5 py-2 cursor-pointer flex items-center justify-between text-xs',
                        selected
                          ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 font-bold'
                          : 'hover:bg-slate-100 dark:hover:bg-white/5'
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <span>{item.flag}</span>
                        <span>{item.code}</span>
                      </span>
                      <span className="font-mono text-[11px] opacity-70">{item.symbol.trim()}</span>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* AI Trip Curator Pill */}
            <button
              onClick={() => setAiCuratorOpen(true)}
              className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 transition-all shadow-sm"
              title="Launch AI Trip Curator"
            >
              <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
              <span>AI Curator</span>
            </button>

            {/* Concierge Callback */}
            <button
              onClick={() => openCallbackModal({ sourceCta: 'NAVBAR_EXPERT' })}
              className="hidden 2xl:flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
              title="Request Concierge Callback"
            >
              <Headphones className="w-3.5 h-3.5 text-amber-500" />
              <span>Concierge</span>
            </button>

            <div className="hidden sm:block h-4 w-[1px] bg-slate-200 dark:bg-white/10 mx-0.5" />

            {/* Daylight / Night Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              title={isDark ? 'Switch to Daylight Mode' : 'Switch to Night Mode'}
              aria-label="Toggle theme"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-amber-400 hover:bg-slate-200 dark:hover:bg-white/10 transition-all hover:scale-105 active:scale-95 shadow-sm shrink-0"
            >
              {isDark ? (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-slate-700" />
              )}
            </button>

            {/* Authenticated User Menu or Sign In */}
            {isAuthenticated || teamUser ? (
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-8 sm:h-9 px-2 sm:px-3 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-white/10 gap-1.5 sm:gap-2 group shrink-0"
                  >
                    <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/30 shrink-0">
                      <User className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                    </div>
                    <span className="hidden min-[420px]:inline-block text-[10px] font-bold uppercase tracking-wider max-w-[70px] sm:max-w-[95px] truncate">
                      {(user?.name || teamUser?.name || 'Account').split(' ')[0]}
                    </span>
                    <ChevronDown className="h-3 w-3 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white transition-colors shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-64 bg-white/95 dark:bg-[#0F141C]/95 backdrop-blur-2xl border-slate-200 dark:border-white/10 text-slate-800 dark:text-white rounded-2xl p-2 mt-3 shadow-2xl"
                >
                  <div className="px-3 py-2.5 mb-1 border-b border-slate-200/80 dark:border-white/10">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                        {user?.name || teamUser?.name || 'Traveler'}
                      </p>
                      <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/25 shrink-0">
                        {teamUser ? teamUser.role : user?.role && user.role !== 'user' ? user.role : 'Explorer'}
                      </span>
                    </div>
                    {(user?.email || teamUser?.code) && (
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5 font-mono">
                        {user?.email || `ID: ${teamUser?.code}`}
                      </p>
                    )}
                  </div>

                  {isAuthenticated && (
                    <div className="space-y-0.5">
                      <DropdownMenuItem asChild className="rounded-xl py-2 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer">
                        <Link to="/profile" className="flex items-center gap-2.5">
                          <Sparkles className="w-4 h-4 text-amber-500" />
                          <span className="text-xs font-medium">My Travel Hub</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="rounded-xl py-2 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer">
                        <Link to="/profile?tab=trips" className="flex items-center gap-2.5">
                          <Package className="w-4 h-4 text-amber-500" />
                          <span className="text-xs font-medium">My Bookings & Vouchers</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="rounded-xl py-2 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer">
                        <Link to="/profile?tab=proposals" className="flex items-center gap-2.5">
                          <Compass className="w-4 h-4 text-sky-500" />
                          <span className="text-xs font-medium">Custom Proposals</span>
                        </Link>
                      </DropdownMenuItem>
                    </div>
                  )}

                  {((isAuthenticated && ['agent', 'supplier', 'hotel', 'driver', 'admin'].includes(user?.role || '')) || !!teamUser) && (
                    <>
                      <DropdownMenuSeparator className="bg-slate-200 dark:bg-white/10 mx-2 my-1.5" />
                      <p className="px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                        Operational Portals
                      </p>
                      {(user?.role === 'agent' || user?.role === 'admin' || !!teamUser) && (
                        <DropdownMenuItem asChild className="rounded-xl py-2 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer">
                          <Link to="/agent" className="flex items-center gap-2.5">
                            <Building2 className="w-4 h-4 text-emerald-500" />
                            <span className="text-xs font-medium">B2B Agent Portal</span>
                          </Link>
                        </DropdownMenuItem>
                      )}
                      {(user?.role === 'hotel' || user?.role === 'admin' || !!teamUser) && (
                        <DropdownMenuItem asChild className="rounded-xl py-2 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer">
                          <Link to="/hospitality" className="flex items-center gap-2.5">
                            <BedDouble className="w-4 h-4 text-amber-500" />
                            <span className="text-xs font-medium">Hospitality CRS Desk</span>
                          </Link>
                        </DropdownMenuItem>
                      )}
                      {(user?.role === 'driver' || user?.role === 'admin' || !!teamUser) && (
                        <DropdownMenuItem asChild className="rounded-xl py-2 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer">
                          <Link to="/driver" className="flex items-center gap-2.5">
                            <Car className="w-4 h-4 text-blue-500" />
                            <span className="text-xs font-medium">Chauffeur Cockpit</span>
                          </Link>
                        </DropdownMenuItem>
                      )}
                      {teamUser && (teamUser.role === 'sales' || teamUser.role === 'admin') && (
                        <DropdownMenuItem asChild className="rounded-xl py-2 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer">
                          <Link to="/sales/portal" className="flex items-center gap-2.5">
                            <Sparkles className="w-4 h-4 text-amber-500" />
                            <span className="text-xs font-medium">SalesPro Concierge</span>
                          </Link>
                        </DropdownMenuItem>
                      )}
                      {teamUser && ['admin', 'operations'].includes(teamUser.role) && (
                        <DropdownMenuItem asChild className="rounded-xl py-2 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer">
                          <Link to="/admin" className="flex items-center gap-2.5">
                            <LayoutDashboard className="w-4 h-4 text-purple-500" />
                            <span className="text-xs font-medium">Director Command Deck</span>
                          </Link>
                        </DropdownMenuItem>
                      )}
                    </>
                  )}

                  <DropdownMenuSeparator className="bg-slate-200 dark:bg-white/10 mx-2 my-1.5" />
                  <DropdownMenuItem
                    onClick={logout}
                    className="rounded-xl py-2 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-500 cursor-pointer flex items-center gap-2.5"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="text-xs font-bold">Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/auth" className="hidden sm:inline-block">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 hover:text-amber-500 dark:hover:text-amber-400 transition-colors px-2">
                  Sign In
                </span>
              </Link>
            )}

            {/* Primary CTA */}
            <Button
              onClick={() => openLeadModal({ sourceCta: 'PLAN_MY_TRIP_NAVBAR' })}
              className="hidden sm:inline-flex h-9 sm:h-10 px-5 sm:px-6 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-[11px] uppercase tracking-wider shadow-md shadow-amber-500/20 hover:shadow-amber-500/35 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] items-center gap-1.5 shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 fill-black" />
              <span>Curate Trip</span>
            </Button>

            {/* Mobile Menu Toggle */}
            <button
              className="lg:hidden w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-colors shrink-0"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {isOpen && (
          <div className="lg:hidden mt-3 pb-3 border-t border-slate-200 dark:border-white/10 pt-3 max-h-[78vh] overflow-y-auto space-y-3 animate-in fade-in duration-200">
            <Button
              onClick={() => {
                setIsOpen(false);
                openLeadModal({ sourceCta: 'PLAN_MY_TRIP_NAVBAR_MOBILE' });
              }}
              className="w-full h-11 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-extrabold text-xs uppercase tracking-wider shadow-md flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 fill-black" />
              <span>Curate My Kashmir Trip</span>
            </Button>

            <div className="space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    'px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-between',
                    isActive(link.href)
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                  )}
                >
                  <span>{link.label}</span>
                  {link.isLive && (
                    <span className="flex items-center gap-1.5 text-[9px] font-mono font-bold text-emerald-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      LIVE RADAR
                    </span>
                  )}
                </Link>
              ))}
            </div>

            {/* Mobile Currency Selector */}
            <div className="pt-2 border-t border-slate-200 dark:border-white/10">
              <p className="px-1 text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">
                Display Currency
              </p>
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                {(Object.keys(SUPPORTED_CURRENCIES) as CurrencyCode[]).map((code) => {
                  const item = SUPPORTED_CURRENCIES[code];
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => setCurrency(code)}
                      className={cn(
                        'px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold border transition-all whitespace-nowrap',
                        currency === code
                          ? 'bg-amber-500 text-black border-amber-500'
                          : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10'
                      )}
                    >
                      {item.flag} {item.code}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mobile Utility Grid */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-white/10">
              <button
                type="button"
                onClick={toggleTheme}
                className="h-10 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white font-bold text-xs flex items-center justify-center gap-2"
              >
                {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-700" />}
                <span>{isDark ? 'Daylight' : 'Night'}</span>
              </button>

              <button
                onClick={() => {
                  setIsOpen(false);
                  openCallbackModal({ sourceCta: 'MOBILE_CONCIERGE' });
                }}
                className="h-10 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white font-bold text-xs flex items-center justify-center gap-2"
              >
                <Headphones className="w-3.5 h-3.5 text-amber-500" />
                <span>Concierge</span>
              </button>
            </div>

            {/* B2B Stakeholder Portals */}
            <div className="pt-2 border-t border-slate-200 dark:border-white/10 space-y-1.5">
              <p className="px-1 text-[9px] font-black uppercase tracking-widest text-slate-400">
                B2B Travel Operating System
              </p>
              <div className="grid grid-cols-2 gap-2">
                {b2bPortals.map((portal) => {
                  const Icon = portal.icon;
                  return (
                    <Link
                      key={portal.href}
                      to={portal.href}
                      onClick={() => setIsOpen(false)}
                      className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-between gap-2 text-slate-700 dark:text-slate-200"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Icon className={cn('w-3.5 h-3.5 shrink-0', portal.accent)} />
                        <span className="text-[11px] font-bold truncate">{portal.label}</span>
                      </div>
                      <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                    </Link>
                  );
                })}
              </div>
            </div>

            {!isAuthenticated && !teamUser && (
              <div className="pt-1">
                <Link to="/auth" onClick={() => setIsOpen(false)}>
                  <Button
                    variant="outline"
                    className="w-full rounded-xl h-10 border-slate-200 dark:border-white/15 text-xs font-bold uppercase tracking-wider"
                  >
                    Sign In
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      <AiTripCuratorModal isOpen={aiCuratorOpen} onClose={() => setAiCuratorOpen(false)} />
    </nav>
  );
}
