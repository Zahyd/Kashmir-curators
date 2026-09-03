import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ShieldAlert, Phone, ExternalLink, X, ChevronRight, Sparkles } from 'lucide-react';
import { io } from 'socket.io-client';
import { API_BASE_URL, SOCKET_URL } from '@/lib/api';

export default function EmergencyBanner() {
  const [activeAdvisory, setActiveAdvisory] = useState<any>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    fetchActiveAdvisories();

    const socket = io(SOCKET_URL);
    socket.on('emergency-mode-alert', (advisory) => {
      setActiveAdvisory(advisory);
      setIsDismissed(false);
    });

    socket.on('emergency-mode-toggled', (data) => {
      if (data.active) {
        setActiveAdvisory(data.advisory);
        setIsDismissed(false);
      } else {
        setActiveAdvisory(null);
      }
    });

    socket.on('advisory-updated', () => {
      fetchActiveAdvisories();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const fetchActiveAdvisories = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/advisories`);
      if (res.ok) {
        const data = await res.json();
        // Priority to emergencyModeActive, then CRITICAL_EMERGENCY, then SEVERE
        const critical = data.find((a: any) => a.emergencyModeActive || a.severity === 'CRITICAL_EMERGENCY');
        const severe = data.find((a: any) => a.severity === 'SEVERE' || a.status === 'Closed');
        setActiveAdvisory(critical || severe || null);
      }
    } catch (err) {
      console.error('Failed to fetch emergency advisories:', err);
    }
  };

  if (!activeAdvisory || isDismissed) return null;

  const isCritical = activeAdvisory.emergencyModeActive || activeAdvisory.severity === 'CRITICAL_EMERGENCY';

  return (
    <div
      className={`w-full py-2.5 px-4 text-xs font-medium transition-all duration-300 relative z-50 shadow-lg ${
        isCritical
          ? 'bg-gradient-to-r from-red-950 via-red-900 to-black text-red-100 border-b border-red-500/30'
          : 'bg-gradient-to-r from-amber-950 via-stone-900 to-black text-amber-100 border-b border-amber-500/30'
      }`}
    >
      <div className="container mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left: Icon & Badge */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isCritical ? 'bg-red-400' : 'bg-amber-400'
              }`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                isCritical ? 'bg-red-500' : 'bg-amber-500'
              }`}></span>
            </span>
            <span className={`font-black tracking-wider uppercase px-2 py-0.5 rounded text-[10px] ${
              isCritical ? 'bg-red-500/20 text-red-300 border border-red-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
            }`}>
              {isCritical ? 'EMERGENCY PROTOCOL' : 'TRAVEL ADVISORY'}
            </span>
          </div>

          {/* Center: Message & Affected Corridor */}
          <div className="truncate">
            <span className="font-bold text-white mr-2">[{activeAdvisory.location}]:</span>
            <span className="opacity-90">{activeAdvisory.message}</span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3 shrink-0 ml-auto">
          <a
            href="tel:112"
            className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold transition"
            title="Emergency Police Helpline"
          >
            <Phone className="w-3 h-3 text-red-400" />
            <span>SOS 112</span>
          </a>

          <Link
            to="/travel-status"
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-bold text-[11px] transition shadow-sm ${
              isCritical
                ? 'bg-red-600 hover:bg-red-500 text-white'
                : 'bg-amber-500 hover:bg-amber-400 text-black'
            }`}
          >
            <span>Corridor Status & Updates</span>
            <ChevronRight className="w-3 h-3" />
          </Link>

          {!isCritical && (
            <button
              onClick={() => setIsDismissed(true)}
              className="p-1 rounded text-white/50 hover:text-white transition"
              aria-label="Dismiss banner"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
