import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook, Instagram, Twitter, Youtube, ShieldCheck, Globe, Star } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '@/lib/api';

export default function Footer() {
  const [socialLinks, setSocialLinks] = useState({
    facebook: '',
    instagram: '',
    twitter: '',
    youtube: ''
  });

  useEffect(() => {
    // 1. Fetch initial social footprint from REST API
    const fetchContent = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/site-content`);
        if (res.ok) {
          const data = await res.json();
          if (data.socialMedia?.content) {
            setSocialLinks(data.socialMedia.content);
          }
        }
      } catch (err) {
        console.error('Failed to fetch social links', err);
      }
    };
    fetchContent();

    // 2. Subscribe to real-time updates via Socket.io
    const socket = io(API_BASE_URL.replace('/api', ''), {
      transports: ['websocket', 'polling']
    });

    socket.on('site-content-updated', (payload) => {
      if (payload.sectionKey === 'socialMedia' && payload.data?.content) {
        setSocialLinks(payload.data.content);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);
  return (
    <footer className="bg-[#05080a] text-white border-t border-white/5 relative overflow-hidden">
      {/* Background Subtle Gradient */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-kashmir-gold/5 blur-[120px] opacity-30 pointer-events-none" />

      <div className="container mx-auto px-6 py-24 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 md:gap-12">
          {/* Heritage Brand */}
          <div className="space-y-8">
            <Link to="/" className="flex items-center group">
              <Logo className="h-14 w-auto transition-transform duration-500 group-hover:scale-105" />
            </Link>
            <p className="text-white/40 font-medium leading-relaxed max-w-xs">
              The premier registry for high-fidelity travel experiences across the Kashmir valley. Curating excellence since 2012.
            </p>
            <div className="flex gap-4">
              {socialLinks.facebook && (
                <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-kashmir-gold hover:text-black hover:border-kashmir-gold transition-all duration-500">
                  <Facebook className="h-4 w-4" />
                </a>
              )}
              {socialLinks.instagram && (
                <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-kashmir-gold hover:text-black hover:border-kashmir-gold transition-all duration-500">
                  <Instagram className="h-4 w-4" />
                </a>
              )}
              {socialLinks.twitter && (
                <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-kashmir-gold hover:text-black hover:border-kashmir-gold transition-all duration-500">
                  <Twitter className="h-4 w-4" />
                </a>
              )}
              {socialLinks.youtube && (
                <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-kashmir-gold hover:text-black hover:border-kashmir-gold transition-all duration-500">
                  <Youtube className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>

          {/* Curated Portfolios */}
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 mb-8">Collections</h3>
            <ul className="space-y-4">
              {['Signature Packages', 'Luxury Estates', 'Elite Fleet', 'About the Curators', 'Contact Protocol'].map((item) => (
                <li key={item}>
                  <Link 
                    to={item === 'Signature Packages' ? '/packages' : `/${item.toLowerCase().split(' ')[0]}`}
                    className="text-sm font-bold text-white/40 hover:text-kashmir-gold transition-all duration-300 flex items-center gap-2 group"
                  >
                    <div className="w-0 h-[1px] bg-kashmir-gold group-hover:w-4 transition-all duration-300" />
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Prime Locations */}
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 mb-8">Geography</h3>
            <ul className="space-y-4">
              {['Srinagar Registry', 'Gulmarg Peaks', 'Pahalgam Valleys', 'Sonmarg Glaciers'].map((item) => (
                <li key={item}>
                  <Link 
                    to={`/packages?destination=${item.split(' ')[0]}`}
                    className="text-sm font-bold text-white/40 hover:text-kashmir-gold transition-all duration-300 flex items-center gap-2 group"
                  >
                    <div className="w-0 h-[1px] bg-kashmir-gold group-hover:w-4 transition-all duration-300" />
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* HQ Liaison */}
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 mb-8">HQ Liaison</h3>
            <ul className="space-y-6">
              <li className="flex items-start gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:border-kashmir-gold/30 transition-colors">
                  <MapPin className="h-4 w-4 text-kashmir-gold" />
                </div>
                <span className="text-sm font-medium text-white/50 leading-relaxed">
                  Watergam, Rafiabad,<br />Sopore, 193303
                </span>
              </li>
              <li className="flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:border-kashmir-gold/30 transition-colors">
                  <Phone className="h-4 w-4 text-kashmir-gold" />
                </div>
                <a href="tel:+919103798448" className="text-sm font-bold text-white/50 hover:text-white transition-colors">
                  +91 91037 98448
                </a>
              </li>
              <li className="flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:border-kashmir-gold/30 transition-colors">
                  <Mail className="h-4 w-4 text-kashmir-gold" />
                </div>
                <a href="mailto:liaison@thekashmircurators.com" className="text-sm font-bold text-white/50 hover:text-white transition-colors">
                  liaison@thekashmircurators.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Legal & Team Liaison */}
        <div className="border-t border-white/5 mt-20 pt-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-8 order-2 md:order-1">
            <p className="text-white/20 text-[10px] font-black uppercase tracking-widest">
              © {new Date().getFullYear()} The Kashmir Curators
            </p>
            <div className="flex gap-6">
              {['Privacy', 'Terms', 'Sales Portal'].map((item) => (
                <Link 
                  key={item}
                  to={item === 'Sales Portal' ? '/sales' : `/${item.toLowerCase()}`}
                  className="text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-kashmir-gold transition-colors"
                >
                  {item}
                </Link>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-6 order-1 md:order-2">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
              <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
              <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Secured Node</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
              <Globe className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Valley Active</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
