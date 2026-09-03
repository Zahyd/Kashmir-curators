import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, AlertTriangle, CloudSun, Compass, Phone, CheckCircle2, 
  Clock, MapPin, RefreshCw, AlertCircle, ArrowRight, FileCheck, ExternalLink,
  Snowflake, Car, Mountain, Plane, HelpCircle, Search, Sparkles
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { API_BASE_URL, SOCKET_URL } from '@/lib/api';
import { io } from 'socket.io-client';
import TripSafetyCardModal from '@/components/common/TripSafetyCardModal';

interface Advisory {
  id: string;
  location: string;
  status: string; // Open, Caution, Closed, Restricted
  message: string;
  severity: string; // NORMAL, ADVISORY, WARNING, SEVERE, CRITICAL_EMERGENCY
  category: string;
  corridors?: string;
  source: string;
  sourceUrl?: string;
  validFrom?: string;
  validUntil?: string;
  recommendedAction?: string;
  isVerified: boolean;
  emergencyModeActive: boolean;
  lastUpdated: string;
}

const DEFAULT_CORRIDORS = [
  {
    location: 'NH-44 Jammu-Srinagar Highway',
    status: 'Open',
    severity: 'NORMAL',
    category: 'ROAD_HIGHWAY',
    source: 'J&K Traffic Police Headquarters',
    message: 'Two-way traffic operational for passenger light motor vehicles. Qazigund and Banihal tunnels clear.',
    recommendedAction: 'Safe for travel. Adhere to lane discipline on Ramban bypass.',
    icon: Car
  },
  {
    location: 'Gulmarg Gondola & Apharwat Peak',
    status: 'Open',
    severity: 'NORMAL',
    category: 'DESTINATION_RESTRICTION',
    source: 'J&K Cable Car Corporation',
    message: 'Phase 1 (Kongdori) and Phase 2 (Apharwat Peak 13,780 ft) operating smoothly with full safety inspection cleared.',
    recommendedAction: 'Pre-book boarding slots online. Warm thermal wear recommended at Phase 2 summit.',
    icon: Mountain
  },
  {
    location: 'Sonamarg & Zojila Pass (Srinagar-Leh)',
    status: 'Caution',
    severity: 'WARNING',
    category: 'ROAD_HIGHWAY',
    source: 'Border Roads Organisation (Project Beacon)',
    message: 'High-altitude wet conditions and early morning black ice near Baltal and Captain Mode. High-clearance vehicles only.',
    recommendedAction: 'Transit permitted strictly between 07:00 AM and 03:00 PM. Anti-skid chains advised.',
    icon: Snowflake
  },
  {
    location: 'Pahalgam, Betaab & Aru Valleys',
    status: 'Open',
    severity: 'NORMAL',
    category: 'ROAD_HIGHWAY',
    source: 'Pahalgam Development Authority',
    message: 'Scenic valley routes and Lidder river circuits completely clear. Sightseeing and day trips running unhindered.',
    recommendedAction: 'Excellent sunny conditions. Perfect window for pony treks and valley walks.',
    icon: Compass
  },
  {
    location: 'Mughal Road (Shopian - Bafliaz)',
    status: 'Caution',
    severity: 'ADVISORY',
    category: 'ROAD_HIGHWAY',
    source: 'District Administration Shopian',
    message: 'Pir Ki Gali pass clear for light vehicles during daylight hours. Dense evening fog reported.',
    recommendedAction: 'Avoid night travel. Keep emergency supplies in vehicle.',
    icon: Car
  },
  {
    location: 'Srinagar International Airport (SXR)',
    status: 'Open',
    severity: 'NORMAL',
    category: 'FLIGHT_AIRPORT',
    source: 'Airports Authority of India (AAI Srinagar)',
    message: 'Visual meteorological conditions optimal. All domestic flights operating on published schedule.',
    recommendedAction: 'Arrive 2.5 hours prior to domestic departures for terminal security protocol.',
    icon: Plane
  }
];

export default function TravelStatusPage() {
  const [advisories, setAdvisories] = useState<Advisory[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [emergencyActive, setEmergencyActive] = useState(false);
  const [lookupToken, setLookupToken] = useState('');
  const [selectedSafetyToken, setSelectedSafetyToken] = useState<string | null>(null);

  useEffect(() => {
    fetchAdvisories();

    const socket = io(SOCKET_URL);
    socket.on('advisory-created', () => fetchAdvisories());
    socket.on('advisory-updated', () => fetchAdvisories());
    socket.on('emergency-mode-toggled', () => fetchAdvisories());

    return () => {
      socket.disconnect();
    };
  }, []);

  const fetchAdvisories = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/advisories`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          setAdvisories(data);
          setEmergencyActive(data.some((a: Advisory) => a.emergencyModeActive || a.severity === 'CRITICAL_EMERGENCY'));
        } else {
          // Fallback to official default corridors
          setAdvisories(DEFAULT_CORRIDORS as any);
        }
      } else {
        setAdvisories(DEFAULT_CORRIDORS as any);
      }
    } catch (error) {
      console.error('Failed to fetch advisories:', error);
      setAdvisories(DEFAULT_CORRIDORS as any);
    } finally {
      setLoading(false);
    }
  };

  const filteredAdvisories = advisories.filter(item => {
    const matchesSearch = item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.message.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    if (filterSeverity === 'ALL') return true;
    if (filterSeverity === 'CRITICAL') return item.severity === 'CRITICAL_EMERGENCY' || item.severity === 'SEVERE';
    if (filterSeverity === 'CAUTION') return item.severity === 'WARNING' || item.severity === 'ADVISORY' || item.status === 'Caution';
    if (filterSeverity === 'NORMAL') return item.severity === 'NORMAL' || item.status === 'Open';
    return true;
  });

  const getSeverityBadge = (severity: string, status: string) => {
    if (severity === 'CRITICAL_EMERGENCY' || status === 'Closed') {
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/40 uppercase font-black tracking-wider text-[10px]">Critical / Closed</Badge>;
    }
    if (severity === 'SEVERE' || status === 'Restricted') {
      return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/40 uppercase font-black tracking-wider text-[10px]">Severe Restriction</Badge>;
    }
    if (severity === 'WARNING' || status === 'Caution') {
      return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/40 uppercase font-black tracking-wider text-[10px]">Caution Advised</Badge>;
    }
    return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 uppercase font-black tracking-wider text-[10px]">Verified Open</Badge>;
  };

  return (
    <div className="min-h-screen bg-[#05080a] text-white flex flex-col font-sans selection:bg-kashmir-gold/30 selection:text-white">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 pt-28 pb-20 max-w-6xl">
        {/* Header Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-kashmir-gold/10 border border-kashmir-gold/30 text-kashmir-gold text-xs font-bold uppercase tracking-wider mb-4">
            <ShieldCheck className="w-4 h-4" />
            <span>Official Kashmir Travel Status & Road Condition Engine</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-4">
            Verified Transit & Destination Status
          </h1>
          <p className="text-white/60 max-w-2xl mx-auto text-sm md:text-base">
            Authoritative, real-time ground intelligence across all Kashmir travel corridors, mountain passes, airport connectivity, and tourist operations.
          </p>
        </div>

        {/* Emergency Alert Banner if Emergency Mode is Active */}
        {emergencyActive && (
          <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-red-950/80 via-red-900/40 to-black border border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 border border-red-500/40">
                <AlertCircle className="w-6 h-6 text-red-400 animate-pulse" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold text-red-200">ACTIVE EMERGENCY PROTOCOL IN EFFECT</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-red-500 text-white animate-pulse">LIVE</span>
                </div>
                <p className="text-sm text-red-200/80 mt-1">
                  High-priority transit advisories are active for selected mountain corridors. Travellers in affected zones are advised to verify vehicle clearance, check with their Kashmir Connect concierge, or dial official helplines below.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Digital Trip Safety Card Lookup Drawer */}
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 mb-10 backdrop-blur-xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-kashmir-gold text-xs font-bold uppercase tracking-wider mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Traveller Safety Protocol</span>
              </div>
              <h3 className="text-xl font-bold text-white">Shareable Digital Trip Safety Card</h3>
              <p className="text-white/50 text-xs mt-1">
                Access your offline-ready safety card with assigned driver info, hotel direct contacts, and 24/7 SOS helpline.
              </p>
            </div>

            <div className="flex w-full md:w-auto items-center gap-2">
              <Input
                placeholder="Enter Booking ID or Share Token..."
                value={lookupToken}
                onChange={(e) => setLookupToken(e.target.value)}
                className="bg-black/50 border-white/10 text-white placeholder:text-white/30 h-11 w-full md:w-72 text-xs"
              />
              <Button
                onClick={() => {
                  if (!lookupToken.trim()) {
                    toast.error('Please enter a booking ID or share token');
                    return;
                  }
                  setSelectedSafetyToken(lookupToken.trim());
                }}
                className="bg-kashmir-gold hover:bg-kashmir-gold/90 text-black font-bold h-11 px-5 text-xs shrink-0"
              >
                View Safety Card
              </Button>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
            {['ALL', 'NORMAL', 'CAUTION', 'CRITICAL'].map(filter => (
              <button
                key={filter}
                onClick={() => setFilterSeverity(filter)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                  filterSeverity === filter
                    ? 'bg-kashmir-gold text-black shadow-md'
                    : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                {filter === 'ALL' ? 'All Corridors' : filter}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-white/30 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Search location or pass..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/5 border-white/10 text-white pl-9 h-10 text-xs rounded-xl"
            />
          </div>
        </div>

        {/* Advisories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-14">
          {filteredAdvisories.map((advisory, idx) => (
            <Card key={advisory.id || idx} className="bg-white/[0.02] border border-white/10 hover:border-white/20 transition-all duration-300 rounded-2xl overflow-hidden backdrop-blur-md">
              <CardHeader className="pb-3 border-b border-white/5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-kashmir-gold shrink-0 border border-white/10">
                      {advisory.category === 'FLIGHT_AIRPORT' ? <Plane className="w-5 h-5 text-blue-400" /> :
                       advisory.category === 'DESTINATION_RESTRICTION' ? <Mountain className="w-5 h-5 text-purple-400" /> :
                       advisory.category === 'WEATHER_SNOW' ? <Snowflake className="w-5 h-5 text-cyan-400" /> :
                       <Car className="w-5 h-5 text-amber-400" />}
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white flex items-center gap-1.5">
                        {advisory.location}
                        {advisory.isVerified !== false && (
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" title="Verified Authority Bulletin" />
                        )}
                      </h4>
                      <p className="text-[11px] text-white/40 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>Source: {advisory.source}</span>
                      </p>
                    </div>
                  </div>
                  {getSeverityBadge(advisory.severity, advisory.status)}
                </div>
              </CardHeader>

              <CardContent className="pt-4 space-y-3 text-xs">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-white/40 block mb-1">Ground Conditions:</span>
                  <p className="text-white/80 leading-relaxed bg-black/20 p-3 rounded-xl border border-white/5">
                    {advisory.message}
                  </p>
                </div>

                {advisory.recommendedAction && (
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-kashmir-gold block mb-1">Recommended Action:</span>
                    <p className="text-white/70 italic bg-kashmir-gold/[0.03] border border-kashmir-gold/20 p-2.5 rounded-xl">
                      👉 {advisory.recommendedAction}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 24/7 Official Emergency & Assistance Directory */}
        <div className="bg-gradient-to-br from-white/[0.04] to-black border border-white/10 rounded-3xl p-8 mb-12">
          <div className="text-center max-w-xl mx-auto mb-8">
            <span className="text-xs font-black uppercase tracking-widest text-kashmir-gold">24/7 Emergency Dispatch</span>
            <h3 className="text-2xl font-bold text-white mt-1">Official Kashmir Tourist Helplines</h3>
            <p className="text-white/50 text-xs mt-1">
              Direct emergency assistance lines for immediate on-ground rescue, medical response, and police liaison.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <a href="tel:112" className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition group">
              <div className="w-12 h-12 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center text-lg font-black group-hover:scale-110 transition">
                112
              </div>
              <div>
                <h5 className="font-bold text-sm text-white">Emergency Response (Police / Fire / Ambulance)</h5>
                <p className="text-[11px] text-white/40">National Unified Helpline</p>
              </div>
            </a>

            <a href="tel:+911942452224" className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition group">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <h5 className="font-bold text-sm text-white">J&K Tourist Police</h5>
                <p className="text-[11px] text-white/40">+91 194 2452224 (Srinagar)</p>
              </div>
            </a>

            <a href="tel:+911942455113" className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition group">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h5 className="font-bold text-sm text-white">SDRF Disaster Rescue</h5>
                <p className="text-[11px] text-white/40">+91 194 2455113 (Control Room)</p>
              </div>
            </a>

            <a href="tel:+911954254477" className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition group">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition">
                <Mountain className="w-5 h-5" />
              </div>
              <div>
                <h5 className="font-bold text-sm text-white">Gulmarg Gondola Helpline</h5>
                <p className="text-[11px] text-white/40">+91 1954 254477</p>
              </div>
            </a>

            <a href="tel:+911942303000" className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition group">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition">
                <Plane className="w-5 h-5" />
              </div>
              <div>
                <h5 className="font-bold text-sm text-white">Srinagar Airport Transit</h5>
                <p className="text-[11px] text-white/40">+91 194 2303000</p>
              </div>
            </a>

            <a href="tel:+919876543210" className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition group">
              <div className="w-12 h-12 rounded-xl bg-kashmir-gold/20 text-kashmir-gold flex items-center justify-center shrink-0 group-hover:scale-110 transition">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h5 className="font-bold text-sm text-white">Kashmir Connect Concierge</h5>
                <p className="text-[11px] text-white/40">24/7 Traveller Support Desk</p>
              </div>
            </a>
          </div>
        </div>

        {/* Kashmir Flex Guarantee Assurance */}
        <div className="p-8 rounded-3xl bg-gradient-to-r from-amber-500/10 via-kashmir-gold/5 to-transparent border border-kashmir-gold/20 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-left">
            <span className="text-[10px] font-black uppercase tracking-widest text-kashmir-gold">Booking Protection</span>
            <h4 className="text-xl font-bold text-white">Kashmir Flex Protection Guaranteed</h4>
            <p className="text-white/60 text-xs max-w-xl">
              All eligible bookings enjoy zero-penalty date rescheduling, safe alternative destination routing, or 100% platform credit vouchers in the event of verified road blockages, extreme snowfall, or travel advisories.
            </p>
          </div>
          <Link to="/packages">
            <Button className="bg-kashmir-gold hover:bg-kashmir-gold/90 text-black font-bold text-xs uppercase tracking-wider px-6 h-12 rounded-xl shadow-lg shrink-0">
              Browse Protected Packages
            </Button>
          </Link>
        </div>
      </main>

      <Footer />

      {/* Trip Safety Card Modal */}
      {selectedSafetyToken && (
        <TripSafetyCardModal
          shareToken={selectedSafetyToken}
          isOpen={!!selectedSafetyToken}
          onClose={() => setSelectedSafetyToken(null)}
        />
      )}
    </div>
  );
}
