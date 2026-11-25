import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Mail, Phone, MapPin, Facebook, Instagram, Twitter, Youtube,
  ShieldCheck, Globe, Headphones, Building2, Car, BedDouble
} from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { io } from 'socket.io-client';
import { API_BASE_URL, SOCKET_URL, DEFAULT_SOCKET_OPTIONS } from '@/lib/api';
import { useLeadCapture } from '@/contexts/LeadCaptureContext';
import { useCurrency, SUPPORTED_CURRENCIES, CurrencyCode } from '@/contexts/CurrencyContext';

const DEFAULT_COLLECTIONS = [
  { label: 'Signature Packages', href: '/packages' },
  { label: 'Houseboats & Stays', href: '/hotels' },
  { label: '4x4 Mountain Fleet', href: '/cabs' },
  { label: 'Road Radar & Passes', href: '/travel-status', isLive: true },
  { label: 'AI Trip Customizer', href: '/planner' },
  { label: 'About The Curators', href: '/about' },
];

const DEFAULT_GEOGRAPHY = [
  { label: 'Srinagar & Dal Lake', href: '/packages?destination=Srinagar' },
  { label: 'Gulmarg Alpine Slopes', href: '/packages?destination=Gulmarg' },
  { label: 'Pahalgam Lidder Valley', href: '/packages?destination=Pahalgam' },
  { label: 'Sonamarg Glacier Meadow', href: '/packages?destination=Sonamarg' },
  { label: 'Doodhpathri Pine Meadows', href: '/packages?destination=Doodhpathri' },
  { label: 'Gurez & Frontier Passes', href: '/packages?destination=Gurez' },
];

const B2B_ECOSYSTEM = [
  { label: 'Travel Agency Workspace', href: '/agent', icon: Building2 },
  { label: 'Agency Net Pricing', href: '/agent/pricing', icon: Globe },
  { label: 'Hotelier CRS Portal', href: '/hospitality', icon: BedDouble },
  { label: 'Cab Fleet & Driver OS', href: '/driver', icon: Car },
  { label: 'Partner Onboarding', href: '/vendor', icon: ShieldCheck },
];

export default function Footer() {
  const { openCallbackModal } = useLeadCapture();
  const { currency, setCurrency } = useCurrency();
  const [socialLinks, setSocialLinks] = useState({
    facebook: '',
    instagram: '',
    twitter: '',
    youtube: '',
  });

  const [footerInfo, setFooterInfo] = useState({
    description:
      'Kashmir’s luxury concierge & B2B Travel Operating System. Connecting discerning travelers, verified heritage estates, 4x4 snow fleets, and 400+ partner agencies since 2012.',
    address: 'Watergam, Rafiabad, Sopore, 193303',
    phone: '+91 91037 98448',
    email: 'Zahidreyaz44123@gmail.com',
    copyright: `© ${new Date().getFullYear()} The Kashmir Curators`,
  });

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/site-content`);
        if (res.ok) {
          const data = await res.json();
          if (data.socialMedia?.content) {
            setSocialLinks(data.socialMedia.content);
          }
          if (data.footer?.content) {
            setFooterInfo((prev) => ({
              ...prev,
              ...(data.footer.content as Record<string, string>),
            }));
          }
        }
      } catch (err) {
        console.error('Failed to fetch footer content', err);
      }
    };
    fetchContent();

    const socket = io(SOCKET_URL, DEFAULT_SOCKET_OPTIONS);

    socket.on('site-content-updated', (payload) => {
      if (payload.sectionKey === 'socialMedia' && payload.data?.content) {
        setSocialLinks(payload.data.content);
      }
      if (payload.sectionKey === 'footer' && payload.data?.content) {
        setFooterInfo((prev) => ({
          ...prev,
          ...(payload.data.content as Record<string, string>),
        }));
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <footer className="bg-[#05080a] text-white border-t border-white/10 relative overflow-hidden transition-colors">
      {/* Background Subtle Gradient Glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-amber-500/5 blur-[140px] opacity-40 pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 py-14 md:py-20 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 md:gap-8">
          {/* Col 1: Heritage Brand (4 cols on lg) */}
          <div className="sm:col-span-2 lg:col-span-4 space-y-6">
            <Link to="/" className="flex items-center group inline-block">
              <Logo className="h-12 sm:h-14 w-auto transition-transform duration-500 group-hover:scale-105" isDarkBg={true} />
            </Link>
            <p className="text-white/60 font-medium leading-relaxed max-w-sm text-xs sm:text-sm">
              {footerInfo.description}
            </p>

            <div className="flex items-center gap-3">
              {socialLinks.facebook && (
                <a
                  href={socialLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-amber-400 hover:text-black hover:border-amber-400 transition-all duration-300"
                >
                  <Facebook className="h-4 w-4" />
                </a>
              )}
              {socialLinks.instagram && (
                <a
                  href={socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-amber-400 hover:text-black hover:border-amber-400 transition-all duration-300"
                >
                  <Instagram className="h-4 w-4" />
                </a>
              )}
              {socialLinks.twitter && (
                <a
                  href={socialLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Twitter / X"
                  className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-amber-400 hover:text-black hover:border-amber-400 transition-all duration-300"
                >
                  <Twitter className="h-4 w-4" />
                </a>
              )}
              {socialLinks.youtube && (
                <a
                  href={socialLinks.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                  className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-amber-400 hover:text-black hover:border-amber-400 transition-all duration-300"
                >
                  <Youtube className="h-4 w-4" />
                </a>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => openCallbackModal({ sourceCta: 'FOOTER_CONCIERGE' })}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-400/10 border border-amber-400/25 text-amber-400 hover:bg-amber-400 hover:text-black transition-all text-xs font-black uppercase tracking-wider"
              >
                <Headphones className="w-3.5 h-3.5" />
                <span>Call Ground Concierge</span>
              </button>
            </div>
          </div>

          {/* Col 2: Traveler Collections (2 cols on lg) */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-400/90 mb-4">
              Traveler Suite
            </h3>
            <ul className="space-y-3">
              {DEFAULT_COLLECTIONS.map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.href}
                    className="text-xs font-bold text-white/70 hover:text-amber-400 transition-all duration-200 flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white/20 group-hover:bg-amber-400 group-hover:scale-125 transition-all" />
                    <span>{item.label}</span>
                    {item.isLive && (
                      <span className="ml-1 px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse">
                        LIVE
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Prime Geography (2 cols on lg) */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-400/90 mb-4">
              Signature Valleys
            </h3>
            <ul className="space-y-3">
              {DEFAULT_GEOGRAPHY.map((geo) => (
                <li key={geo.label}>
                  <Link
                    to={geo.href}
                    className="text-xs font-bold text-white/70 hover:text-amber-400 transition-all duration-200 flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white/20 group-hover:bg-amber-400 group-hover:scale-125 transition-all" />
                    <span>{geo.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: B2B Stakeholder Portals (2 cols on lg) */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-400/90 mb-4">
              B2B Partner OS
            </h3>
            <ul className="space-y-3">
              {B2B_ECOSYSTEM.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.label}>
                    <Link
                      to={item.href}
                      className="text-xs font-bold text-white/70 hover:text-emerald-400 transition-all duration-200 flex items-center gap-2 group"
                    >
                      <Icon className="w-3.5 h-3.5 text-white/30 group-hover:text-emerald-400 transition-colors shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Col 5: Valley HQ Liaison (2 cols on lg) */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-400/90 mb-4">
              Valley HQ
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-2.5 group">
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:border-amber-400/30 transition-colors">
                  <MapPin className="h-3.5 w-3.5 text-amber-400" />
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase tracking-wider text-white/40 block">Headquarters</span>
                  <span className="text-[11px] font-medium text-white/80 leading-relaxed block mt-0.5">
                    {footerInfo.address}
                  </span>
                </div>
              </li>

              <li className="flex items-center gap-2.5 group">
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:border-amber-400/30 transition-colors">
                  <Phone className="h-3.5 w-3.5 text-emerald-400" />
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase tracking-wider text-white/40 block">24/7 Helpline</span>
                  <a
                    href={`tel:${footerInfo.phone.replace(/\s+/g, '')}`}
                    className="text-[11px] font-bold text-white/90 hover:text-amber-400 transition-colors block mt-0.5"
                  >
                    {footerInfo.phone}
                  </a>
                </div>
              </li>

              <li className="flex items-center gap-2.5 group">
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:border-amber-400/30 transition-colors">
                  <Mail className="h-3.5 w-3.5 text-blue-400" />
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] font-black uppercase tracking-wider text-white/40 block">Official Desk</span>
                  <a
                    href={`mailto:${footerInfo.email}`}
                    className="text-[11px] font-bold text-white/90 hover:text-amber-400 transition-colors block mt-0.5 break-all"
                  >
                    {footerInfo.email}
                  </a>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Legal, Currency & Trust Verification Bar */}
        <div className="border-t border-white/10 mt-14 pt-8 flex flex-col lg:flex-row justify-between items-center gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 order-2 lg:order-1 text-center sm:text-left">
            <p className="text-white/40 text-[11px] font-semibold">
              {footerInfo.copyright} • All Rights Reserved.
            </p>
            <div className="flex items-center gap-5 text-[11px] font-bold text-white/60">
              <Link to="/about" className="hover:text-amber-400 transition-colors">About Us</Link>
              <span className="text-white/20">•</span>
              <Link to="/privacy" className="hover:text-amber-400 transition-colors">Privacy Policy</Link>
              <span className="text-white/20">•</span>
              <Link to="/terms" className="hover:text-amber-400 transition-colors">Terms of Service</Link>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5 order-1 lg:order-2">
            {/* Compact Currency Switcher */}
            <div className="flex items-center gap-1 p-1 rounded-full bg-white/5 border border-white/10">
              {(Object.keys(SUPPORTED_CURRENCIES) as CurrencyCode[]).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setCurrency(code)}
                  className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold transition-all ${
                    currency === code
                      ? 'bg-amber-400 text-black'
                      : 'text-white/50 hover:text-white'
                  }`}
                >
                  {code}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-emerald-400 text-[10px] font-black uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>J&K Tourism Approved</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-amber-400 text-[10px] font-black uppercase tracking-wider">
              <Globe className="w-3.5 h-3.5" />
              <span>Valley Ground Active</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
