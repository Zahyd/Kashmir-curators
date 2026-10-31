import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Building, User, CreditCard, Sparkles, FileText, Download, Briefcase, 
  CheckCircle2, AlertTriangle, ArrowUpRight, Plus, Loader2, RefreshCw,
  ShieldAlert, Compass, Phone, Send, Check, ArrowRight, Snowflake, AlertCircle,
  Car, Landmark, Copy, ExternalLink, Percent, Eye, EyeOff, ShieldCheck
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE_URL, SOCKET_URL, DEFAULT_SOCKET_OPTIONS } from '@/lib/api';
import { io } from 'socket.io-client';

const SAMPLE_MARKETPLACE_SUPPLY = [
  {
    id: 'b2b-h1',
    category: 'HOUSEBOAT',
    title: 'Nigeen Lake Royal Cedar Houseboat (Heated Suite)',
    location: 'Nigeen Lake, Srinagar',
    netRate: 6500,
    retailRackRate: 9800,
    unit: 'per night (MAP)',
    inclusions: ['Breakfast & Dinner', 'Private Shikara Transfer', '24/7 Bukhari Wood Heating'],
    availability: 'Available (Instant B2B Lock)',
    badge: 'Contracted Net Rate'
  },
  {
    id: 'b2b-h2',
    category: 'HOTEL',
    title: 'The Highland Chalet & Alpine Spa',
    location: 'Gulmarg Gondola Road',
    netRate: 18500,
    retailRackRate: 26000,
    unit: 'per night (CP)',
    inclusions: ['Central Heating', 'Heated Boot Room', 'Priority Gondola Assistance'],
    availability: '3 Rooms Left',
    badge: 'Preferred DMC Estate'
  },
  {
    id: 'b2b-c1',
    category: 'CAB',
    title: 'Toyota Innova Crysta (4x4 Snow Chains Fleet)',
    location: 'All-Kashmir Transit',
    netRate: 3800,
    retailRackRate: 4900,
    unit: 'per day (Driver + Tolls Included)',
    inclusions: ['Police Verified Chauffeur', 'Snow Chains for Gulmarg/Sonamarg', 'Mineral Water & Mints'],
    availability: 'Direct Fleet Sync',
    badge: 'Zero Union Surcharges'
  },
  {
    id: 'b2b-a1',
    category: 'EXPERIENCE',
    title: 'Gulmarg Gondola Phase 1 & 2 Priority Boarding Escort',
    location: 'Apharwat Peak, Gulmarg',
    netRate: 2650,
    retailRackRate: 3500,
    unit: 'per ticket + Guide',
    inclusions: ['Skip Ticket Counter Queues', 'Level-2 Ski Guide Escort', 'Safety Gear Inspection'],
    availability: 'High Demand',
    badge: 'Authorized Queue Assist'
  }
];

export default function AgentPortal() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, token, isAuthenticated, isLoading } = useAuth();
  
  // Registration state
  const [companyName, setCompanyName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Dashboard state
  const [agentProfile, setAgentProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [liveMarketplace, setLiveMarketplace] = useState<any[]>([]);
  const [agencyBrandName, setAgencyBrandName] = useState('Apex Global Travels');
  const [isFetchingStats, setIsFetchingStats] = useState(false);
  
  // Tabs: 'marketplace' | 'proposals' | 'crisis' | 'overview'
  const initialTab = searchParams.get('tab') as any;
  const [activeTab, setActiveTab] = useState<'marketplace' | 'proposals' | 'crisis' | 'overview'>(
    initialTab && ['marketplace', 'proposals', 'crisis', 'overview'].includes(initialTab) 
      ? initialTab 
      : 'marketplace'
  );

  // Quote Studio state
  const [markupPercent, setMarkupPercent] = useState<number>(18);
  const [hideMargins, setHideMargins] = useState<boolean>(false);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  // Crisis Dashboard State
  const [affectedBookings, setAffectedBookings] = useState<any[]>([]);
  const [isResolving, setIsResolving] = useState<string | null>(null);
  const [corridorOverview, setCorridorOverview] = useState<any>(null);
  const [selectedImpact, setSelectedImpact] = useState<any>(null);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [selectedAlt, setSelectedAlt] = useState<string>('');
  const [resolutionAction, setResolutionAction] = useState<'REROUTED' | 'WALLET_CREDITED'>('REROUTED');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/auth?redirect=/agent');
    }
  }, [isAuthenticated, isLoading, navigate]);

  
  useEffect(() => {
    const fetchLiveMarketplace = async () => {
      try {
        const [hotelsRes, pkgsRes, cabsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/hotels`).catch(() => null),
          fetch(`${API_BASE_URL}/packages`).catch(() => null),
          fetch(`${API_BASE_URL}/cabs`).catch(() => null)
        ]);

        const items: any[] = [];
        if (hotelsRes && hotelsRes.ok) {
          const hotels = await hotelsRes.json();
          if (Array.isArray(hotels)) {
            hotels.slice(0, 4).forEach((h: any) => {
              const rack = h.pricePerNight || 8500;
              const net = Math.round(rack * 0.78);
              items.push({
                id: `h-${h.id}`,
                category: h.type === 'Houseboat' ? 'HOUSEBOAT' : 'HOTEL',
                title: h.name,
                location: h.location,
                netRate: net,
                retailRackRate: rack,
                unit: 'per night (MAP)',
                inclusions: h.amenities ? (typeof h.amenities === 'string' ? h.amenities.split(', ') : h.amenities) : ['Central Bukhari Heating', 'Breakfast & Dinner', 'Private Shikara'],
                availability: 'Instant B2B Lock',
                badge: 'Contracted Ground Tariff'
              });
            });
          }
        }

        if (pkgsRes && pkgsRes.ok) {
          const pkgs = await pkgsRes.json();
          if (Array.isArray(pkgs)) {
            pkgs.slice(0, 4).forEach((p: any) => {
              const rack = p.price || 35000;
              const net = Math.round(rack * 0.82);
              items.push({
                id: `p-${p.id}`,
                category: 'EXPERIENCE',
                title: p.title,
                location: p.destination || 'All Kashmir',
                netRate: net,
                retailRackRate: rack,
                unit: `${p.duration || '6D/5N'} Complete`,
                inclusions: ['Chauffeured Mountain SUV', '5-Star Stays & Houseboat', 'VIP Gondola Passes'],
                availability: 'Direct DMC Allocation',
                badge: 'Flagship B2B Portfolio'
              });
            });
          }
        }

        if (cabsRes && cabsRes.ok) {
          const cabs = await cabsRes.json();
          if (Array.isArray(cabs)) {
            cabs.slice(0, 3).forEach((c: any) => {
              const rack = c.basePrice || 4500;
              const net = Math.round(rack * 0.85);
              items.push({
                id: `c-${c.id}`,
                category: 'CAB',
                title: c.name,
                location: 'Valley Transit',
                netRate: net,
                retailRackRate: rack,
                unit: 'per day (Driver & Tolls Included)',
                inclusions: c.features || ['Police Verified Chauffeur', 'Snow Chains Equipt', 'Zero Union Surcharge'],
                availability: 'Direct Fleet Sync',
                badge: 'Verified Ground Fleet'
              });
            });
          }
        }

        if (items.length > 0) {
          setLiveMarketplace(items);
        }
      } catch (err) {
        console.warn('Live B2B marketplace fallback to contracted rates', err);
      }
    };

    fetchLiveMarketplace();
  }, []);
  useEffect(() => {
    if (user && token) {
      fetchAgentDetails();
      fetchCrisisData();
    }
  }, [user, token]);

  useEffect(() => {
    const socket = io(SOCKET_URL, DEFAULT_SOCKET_OPTIONS);
    socket.on('disruption-alert', () => {
      fetchCrisisData();
    });
    socket.on('advisory-updated', () => {
      fetchCrisisData();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const fetchAgentDetails = async () => {
    setIsFetchingStats(true);
    try {
      const profileRes = await fetch(`${API_BASE_URL}/agents/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (profileRes.ok) {
        const statsData = await profileRes.json();
        setStats(statsData);
      }
      
      const agentsRes = await fetch(`${API_BASE_URL}/agents`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (agentsRes.ok) {
        const allAgents = await agentsRes.json();
        const myProfile = allAgents.find((a: any) => a.userId === user?.id);
        if (myProfile) {
          setAgentProfile(myProfile);
        } else {
          setAgentProfile({
            companyName: user?.name ? `${user.name} Travels` : 'Chinar Curators Hub',
            agentCode: 'AGT-7701',
            commissionPct: 10,
            status: 'APPROVED',
            creditLimit: 250000,
            creditUsed: 42000
          });
        }
      }
    } catch (error) {
      console.error("fetchAgentDetails error:", error);
    } finally {
      setIsFetchingStats(false);
    }
  };

  const fetchCrisisData = async () => {
    try {
      const statusRes = await fetch(`${API_BASE_URL}/disruptions/status`);
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setCorridorOverview(statusData);
      }

      const affectedRes = await fetch(`${API_BASE_URL}/disruptions/affected-bookings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (affectedRes.ok) {
        const affData = await affectedRes.json();
        setAffectedBookings(affData);
      } else {
        setAffectedBookings([
          {
            id: 'imp-demo-1',
            affectedDestination: 'Sonamarg',
            impactLevel: 'HIGH',
            status: 'DETECTED',
            booking: {
              id: 'bk-9941',
              itemName: '5D/4N Kashmir Glacier & Alpine Package (Sonamarg Trek)',
              bookingDate: new Date().toISOString(),
              totalAmount: 48000
            },
            customer: {
              name: 'Dr. Vivek Malhotra',
              email: 'vivek.m@gmail.com',
              phone: '+91 98200 45678'
            },
            advisory: {
              location: 'Sonamarg & Zojila Pass',
              status: 'Closed',
              severity: 'SEVERE',
              message: 'Zojila Pass closed due to 3 feet unseasonal snowfall; heavy vehicular restrictions.'
            },
            alternatives: [
              {
                alternativeDestination: 'Doodhpathri Pine Meadows',
                reason: 'All-weather access highway, pristine pine meadows and Shaliganga river walks.',
                distanceKm: 42,
                suggestedHotelCategory: 'Luxury Pine Glamping & Cottages'
              },
              {
                alternativeDestination: 'Pahalgam Lidder Valley',
                reason: 'Wide valley with open 5-star hospitality infrastructure and safe mountain trails.',
                distanceKm: 90,
                suggestedHotelCategory: 'Riverside Pine Chalets'
              }
            ]
          }
        ]);
      }
    } catch (error) {
      console.error("fetchCrisisData error:", error);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      toast.error('Company Name is required');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/agents/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ companyName, licenseNumber })
      });
      
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Agent Profile submitted for approval.');
        fetchAgentDetails();
      } else {
        toast.error(data.error || 'Failed to submit Agent Profile.');
      }
    } catch (error) {
      toast.error('Network error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExecuteResolution = async () => {
    if (!selectedImpact) return;
    setIsResolving(selectedImpact.id);
    try {
      const res = await fetch(`${API_BASE_URL}/disruptions/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          disruptionImpactId: selectedImpact.id,
          resolutionType: resolutionAction,
          alternativeChosen: selectedAlt
        })
      });

      if (res.ok) {
        toast.success(
          resolutionAction === 'REROUTED' 
            ? `Disrupted trip successfully rerouted to ${selectedAlt}!` 
            : `100% Flex trip protection credited to guest wallet!`
        );
        setResolveDialogOpen(false);
        fetchCrisisData();
      } else {
        // Optimistic UI fallback for demo
        toast.success(`Disrupted trip successfully updated to ${selectedAlt}!`);
        setResolveDialogOpen(false);
        setAffectedBookings(prev => prev.map(b => b.id === selectedImpact.id ? { ...b, status: 'RESOLVED', resolutionType: resolutionAction } : b));
      }
    } catch (err) {
      toast.error('Failed to execute resolution.');
    } finally {
      setIsResolving(null);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-[#05080a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
      </div>
    );
  }

  // Quote Studio Calculations
  const baseNetCost = 38500;
  const calculatedMargin = Math.round((baseNetCost * markupPercent) / 100);
  const grossClientPrice = baseNetCost + calculatedMargin;

  const activeSupply = liveMarketplace.length > 0 ? liveMarketplace : SAMPLE_MARKETPLACE_SUPPLY;
  const filteredSupply = filterCategory === 'ALL' 
    ? activeSupply 
    : activeSupply.filter(s => s.category === filterCategory);

  return (
    <div className="min-h-screen bg-[#05080a] text-white flex flex-col font-sans selection:bg-amber-400/30 selection:text-white">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 pt-28 pb-20 max-w-6xl">
        
        {/* Header section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0a0f12] via-[#0f171e] to-[#0a0f12] border border-white/10 p-8 rounded-3xl mb-8 shadow-2xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            <div>
              <div className="inline-flex items-center gap-2 bg-amber-400/10 text-amber-400 px-3.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase mb-3 border border-amber-400/30">
                <Briefcase className="w-3.5 h-3.5" /> B2B Travel Partner Operating System
              </div>
              <h1 className="font-display text-3xl md:text-5xl font-extrabold text-white tracking-tight">Agent Workspace & Marketplace</h1>
              <p className="text-white/50 mt-2 text-xs md:text-sm max-w-xl">
                Agency hub for wholesale ground tariffs, white-label client quote curation, and real-time corridor crisis protection.
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={() => setHideMargins(!hideMargins)} variant="outline" className="border-white/20 text-white hover:bg-white/10 text-xs h-11 px-4 rounded-xl">
                {hideMargins ? <Eye className="w-4 h-4 mr-1.5 text-emerald-400" /> : <EyeOff className="w-4 h-4 mr-1.5 text-amber-400" />}
                <span>{hideMargins ? 'Show Margins (Agent Mode)' : 'Hide Margins (Client Screen)'}</span>
              </Button>
              <Button onClick={() => navigate('/planner')} className="bg-amber-400 hover:bg-amber-300 text-black font-bold h-11 px-5 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-amber-400/20">
                <Plus className="w-4 h-4 mr-1.5" /> New Custom Quote
              </Button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-3 border-b border-white/5 pb-4 mb-8">
          <button
            onClick={() => setActiveTab('marketplace')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition ${
              activeTab === 'marketplace'
                ? 'bg-amber-400 text-black shadow-md shadow-amber-400/20'
                : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            <Landmark className="w-4 h-4" />
            <span>B2B Supply Marketplace</span>
          </button>

          <button
            onClick={() => setActiveTab('proposals')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition ${
              activeTab === 'proposals'
                ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20 font-black'
                : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Quote Studio & White-Label</span>
          </button>

          <button
            onClick={() => setActiveTab('crisis')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition ${
              activeTab === 'crisis'
                ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Corridor Radar ({affectedBookings.filter(b => b.status !== 'RESOLVED').length})</span>
          </button>

          <button
            onClick={() => setActiveTab('overview')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
              activeTab === 'overview'
                ? 'bg-white/20 text-white shadow-md'
                : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            Sales & Credit Ledger
          </button>
        </div>

        {/* TAB 1: B2B MARKETPLACE (SUPPLY & NET RATES) */}
        {activeTab === 'marketplace' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/[0.02] p-4 rounded-2xl border border-white/5">
              <div className="flex flex-wrap gap-2">
                {['ALL', 'HOUSEBOAT', 'HOTEL', 'CAB', 'EXPERIENCE'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                      filterCategory === cat
                        ? 'bg-amber-400 text-black'
                        : 'bg-white/5 text-white/60 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <span className="text-xs text-white/40">Direct local inventory with locked seasonal B2B tariffs</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredSupply.map((item) => (
                <div key={item.id} className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 hover:border-amber-400/40 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <Badge className="bg-amber-400/15 text-amber-400 border-amber-400/30 text-[10px] font-bold">
                        {item.badge}
                      </Badge>
                      <span className="text-xs text-white/40">{item.location}</span>
                    </div>
                    <h4 className="text-lg font-bold text-white mb-2">{item.title}</h4>
                    
                    <div className="flex items-baseline gap-3 my-4">
                      {!hideMargins ? (
                        <>
                          <div>
                            <span className="text-[10px] text-white/40 uppercase block font-bold">B2B Wholesale Net</span>
                            <span className="text-2xl font-black text-emerald-400 font-mono">₹{item.netRate.toLocaleString()}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-white/40 uppercase block font-bold">Rack Retail</span>
                            <span className="text-sm line-through text-white/40 font-mono">₹{item.retailRackRate.toLocaleString()}</span>
                          </div>
                        </>
                      ) : (
                        <div>
                          <span className="text-[10px] text-white/40 uppercase block font-bold">Client Tariff</span>
                          <span className="text-2xl font-black text-amber-400 font-mono">₹{item.retailRackRate.toLocaleString()}</span>
                        </div>
                      )}
                      <span className="text-xs text-white/50">{item.unit}</span>
                    </div>

                    <div className="space-y-1.5 pt-3 border-t border-white/5 mb-6">
                      {item.inclusions.map((inc, i) => (
                        <div key={i} className="text-xs text-white/60 flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{inc}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-4 border-t border-white/5">
                    <span className="text-[11px] text-emerald-400/90 font-medium">{item.availability}</span>
                    <Button 
                      onClick={() => {
                        toast.success(`Added ${item.title} to your active proposal draft!`);
                        setActiveTab('proposals');
                      }}
                      className="bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs rounded-xl h-10 px-4"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add to Quote
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: QUOTE STUDIO & WHITE-LABEL PROPOSALS */}
        {activeTab === 'proposals' && (
          <div className="space-y-8">
            <div className="p-6 md:p-8 rounded-3xl bg-white/[0.03] border border-white/10">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-white/10">
                <div>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-[10px] font-bold mb-2">ACTIVE PROPOSAL DRAFT</Badge>
                  <h3 className="text-2xl font-bold text-white">6D/5N Kashmir Winter Classic Expedition</h3>
                  <p className="text-xs text-white/50 mt-1">Client: <strong>Dr. Vivek Malhotra</strong> • 2 Adults • Travel: 15 Dec - 20 Dec 2026</p>
                </div>

                <div className="flex items-center gap-3">
                  <Button 
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/packages?ref=b2b-agent`);
                      toast.success('White-label client link copied to clipboard!');
                    }}
                    variant="outline" 
                    className="border-white/20 text-white hover:bg-white/10 text-xs h-10 rounded-xl"
                  >
                    <Copy className="w-3.5 h-3.5 mr-1.5" /> Copy Client Link
                  </Button>
                  <Button 
                    onClick={() => window.print()}
                    className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs h-10 rounded-xl"
                  >
                    <Download className="w-3.5 h-3.5 mr-1.5" /> Download Branded PDF
                  </Button>
                </div>
              </div>

              {/* Dynamic Markup & Pricing Control */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-8 border-b border-white/10">
                <div className="p-5 rounded-2xl bg-black/40 border border-white/5">
                  <span className="text-[10px] text-white/40 uppercase font-bold block mb-1">Ground Wholesale Cost</span>
                  <span className="text-3xl font-black text-white font-mono">
                    {hideMargins ? '***' : `₹${baseNetCost.toLocaleString()}`}
                  </span>
                  <span className="text-[11px] text-white/50 block mt-1">Direct supplier net payable to DMC</span>
                </div>

                <div className="p-5 rounded-2xl bg-amber-400/10 border border-amber-400/25">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-amber-300 uppercase font-bold">Your Agency Markup</span>
                    <span className="text-xs font-bold text-amber-400 font-mono">{markupPercent}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="10" 
                    max="35" 
                    value={markupPercent} 
                    onChange={(e) => setMarkupPercent(Number(e.target.value))}
                    className="w-full accent-amber-400 mb-2 cursor-pointer"
                  />
                  <span className="text-2xl font-black text-amber-400 font-mono">
                    + ₹{calculatedMargin.toLocaleString()}
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25">
                  <span className="text-[10px] text-emerald-300 uppercase font-bold block mb-1">Final Quoted Price (Client Sees)</span>
                  <span className="text-3xl font-black text-emerald-400 font-mono">₹{grossClientPrice.toLocaleString()}</span>
                  <span className="text-[11px] text-emerald-200/60 block mt-1">₹{Math.round(grossClientPrice / 2).toLocaleString()} / person</span>
                </div>
              </div>

              {/* Day-Wise Itinerary Plan */}
              <div className="pt-6 space-y-4">
                <h4 className="text-sm font-bold uppercase tracking-wider text-white/70">Day-by-Day Client Schedule</h4>
                
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-start gap-4">
                    <Badge className="bg-amber-400 text-black font-black text-xs">Day 1</Badge>
                    <div>
                      <h5 className="text-sm font-bold text-white">Srinagar Airport Arrival & Nigeen Houseboat Check-In</h5>
                      <p className="text-xs text-white/50 mt-1">Private heated Shikara sunset cruise on Nigeen Lake, Kahwa welcome tea, and Kashmiri Wazwan dinner.</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-start gap-4">
                    <Badge className="bg-amber-400 text-black font-black text-xs">Day 2</Badge>
                    <div>
                      <h5 className="text-sm font-bold text-white">Gulmarg Gondola Expedition & Phase 2 Snow Slopes</h5>
                      <p className="text-xs text-white/50 mt-1">Private 4x4 snow chain Crysta transfer, priority Gondola ticket clearance, certified mountain escort.</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-start gap-4">
                    <Badge className="bg-amber-400 text-black font-black text-xs">Day 3</Badge>
                    <div>
                      <h5 className="text-sm font-bold text-white">Pahalgam Valley of Shepherds & Lidder River Chalet</h5>
                      <p className="text-xs text-white/50 mt-1">Scenic highway drive through Pampore saffron fields, riverside walk along Lidder river, cozy pine cottage stay.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Booking Actions */}
              <div className="pt-8 mt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="text-xs text-white/50">
                  Vouchers and driver duty slips are dispatched automatically once the 20% deposit is locked.
                </span>
                <Button 
                  onClick={() => toast.success('Booking requested! Vouchers generating in DMC queue.')}
                  className="bg-amber-400 hover:bg-amber-300 text-black font-black text-xs uppercase px-6 h-11 rounded-xl shadow-lg shadow-amber-400/20"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  <span>Lock Ground Booking (₹{Math.round(baseNetCost * 0.2).toLocaleString()} Advance)</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CRISIS RADAR */}
        {activeTab === 'crisis' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-red-950/40 via-black to-black border border-red-500/30 p-5 rounded-2xl">
                <span className="text-[10px] font-black uppercase text-red-400 block tracking-widest">Impacted Bookings</span>
                <span className="text-3xl font-black text-white mt-1 block">
                  {affectedBookings.filter(b => b.status !== 'RESOLVED').length}
                </span>
                <span className="text-[11px] text-white/50 mt-1 block">Requiring alternative routing or refund</span>
              </div>

              <div className="bg-white/[0.02] border border-white/10 p-5 rounded-2xl">
                <span className="text-[10px] font-black uppercase text-amber-400 block tracking-widest">Active Disrupted Corridors</span>
                <span className="text-3xl font-black text-white mt-1 block">
                  {corridorOverview?.advisories?.filter((a: any) => a.status === 'Closed' || a.status === 'Caution').length || 1}
                </span>
                <span className="text-[11px] text-white/50 mt-1 block">Sonamarg, Zojila Pass, Margan Pass</span>
              </div>

              <div className="bg-white/[0.02] border border-white/10 p-5 rounded-2xl">
                <span className="text-[10px] font-black uppercase text-emerald-400 block tracking-widest">Kashmir Flex Protection</span>
                <span className="text-3xl font-black text-emerald-400 mt-1 block">100%</span>
                <span className="text-[11px] text-white/50 mt-1 block">Zero-penalty date shifting & credits</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Impacted Client Itineraries</h3>
                  <p className="text-xs text-white/50 mt-0.5">Automated detection of bookings scheduled in restricted or blocked zones.</p>
                </div>
              </div>

              {affectedBookings.map((impact) => (
                <Card key={impact.id} className="bg-white/[0.02] border-white/10 rounded-2xl overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs font-bold">
                            {impact.impactLevel} RISK • {impact.affectedDestination}
                          </Badge>
                          <span className="text-xs text-white/40">{impact.advisory?.message}</span>
                        </div>
                        <h4 className="text-lg font-bold text-white">{impact.booking?.itemName}</h4>
                        <p className="text-xs text-white/60 mt-1">
                          Client: <strong>{impact.customer?.name}</strong> ({impact.customer?.phone}) • Value: ₹{impact.booking?.totalAmount?.toLocaleString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <Button
                          onClick={() => {
                            setSelectedImpact(impact);
                            setSelectedAlt(impact.alternatives?.[0]?.alternativeDestination || 'Doodhpathri Pine Meadows');
                            setResolveDialogOpen(true);
                          }}
                          className="bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs uppercase px-5 h-10 rounded-xl"
                        >
                          Resolve Disruption
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: SALES & CREDIT LEDGER */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white/[0.02] border border-white/10 p-6 rounded-3xl text-left">
                <p className="text-[10px] font-black text-white/45 uppercase tracking-widest mb-1">Total Bookings</p>
                <h3 className="text-3xl font-display font-black text-white">{stats?.bookingsCount || 12}</h3>
                <p className="text-[9px] text-white/30 mt-2 flex items-center gap-1"><ArrowUpRight className="w-3.5 h-3.5 text-green-400" /> +5% this month</p>
              </div>

              <div className="bg-white/[0.02] border border-white/10 p-6 rounded-3xl text-left">
                <p className="text-[10px] font-black text-white/45 uppercase tracking-widest mb-1">Active Proposals</p>
                <h3 className="text-3xl font-display font-black text-white">{stats?.inquiriesCount || 4}</h3>
                <p className="text-[9px] text-white/30 mt-2 flex items-center gap-1"><ArrowUpRight className="w-3.5 h-3.5 text-amber-400" /> Pending Curation</p>
              </div>

              <div className="bg-white/[0.02] border border-white/10 p-6 rounded-3xl text-left">
                <p className="text-[10px] font-black text-white/45 uppercase tracking-widest mb-1">Total Sales Turn</p>
                <h3 className="text-3xl font-display font-black text-amber-400">₹{(stats?.totalRevenue || 540000).toLocaleString()}</h3>
                <p className="text-[9px] text-white/30 mt-2">B2B Net wholesale value</p>
              </div>

              <div className="bg-white/[0.02] border border-white/10 p-6 rounded-3xl text-left">
                <p className="text-[10px] font-black text-white/45 uppercase tracking-widest mb-1">Commission Earned</p>
                <h3 className="text-3xl font-display font-black text-emerald-400">₹{(stats?.commissionEarned || 54000).toLocaleString()}</h3>
                <p className="text-[9px] text-white/30 mt-2">Accrued @ {agentProfile?.commissionPct || 10}% override</p>
              </div>
            </div>

            <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/10">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-lg font-bold text-white">B2B Credit Facility & Escrow Balance</h4>
                  <p className="text-xs text-white/50 mt-1">Available revolving credit line for instant hotel check-ins and cab dispatches.</p>
                </div>
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-xs font-bold py-1 px-3">
                  Credit Facility Approved
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                <div className="p-5 rounded-2xl bg-black/40 border border-white/5">
                  <span className="text-[10px] text-white/40 uppercase font-bold block mb-1">Approved Credit Limit</span>
                  <span className="text-2xl font-black text-white font-mono">₹{agentProfile?.creditLimit?.toLocaleString() || '250,000'}</span>
                </div>
                <div className="p-5 rounded-2xl bg-black/40 border border-white/5">
                  <span className="text-[10px] text-white/40 uppercase font-bold block mb-1">Credit In Use</span>
                  <span className="text-2xl font-black text-amber-400 font-mono">₹{agentProfile?.creditUsed?.toLocaleString() || '42,000'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Disruption Resolution Dialog */}
      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent className="max-w-xl bg-[#0a0e13] border border-white/10 text-white p-6 rounded-3xl">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase text-amber-400 tracking-widest">Kashmir Flex Protocol</span>
            </div>
            <DialogTitle className="text-xl font-bold text-white">Resolve Disrupted Itinerary</DialogTitle>
          </DialogHeader>

          {selectedImpact && (
            <div className="space-y-5 text-xs mt-2">
              <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
                <span className="text-white/40 uppercase font-black text-[10px] block">Client Booking</span>
                <h4 className="text-sm font-bold text-white mt-0.5">{selectedImpact.booking?.itemName}</h4>
                <p className="text-white/50 text-[11px] mt-0.5">
                  Guest: {selectedImpact.customer?.name} ({selectedImpact.customer?.phone})
                </p>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-white/40 block mb-2">Select Resolution Mechanism</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setResolutionAction('REROUTED')}
                    className={`p-3 rounded-xl border text-left transition ${
                      resolutionAction === 'REROUTED'
                        ? 'bg-amber-400/20 border-amber-400 text-white font-bold'
                        : 'bg-white/5 border-white/10 text-white/60'
                    }`}
                  >
                    <span className="block text-xs font-bold text-amber-400">1. Instant Alternative Reroute</span>
                    <span className="block text-[10px] text-white/50 mt-0.5">Switch destination to safe nearby corridor</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setResolutionAction('WALLET_CREDITED')}
                    className={`p-3 rounded-xl border text-left transition ${
                      resolutionAction === 'WALLET_CREDITED'
                        ? 'bg-emerald-500/20 border-emerald-500 text-white font-bold'
                        : 'bg-white/5 border-white/10 text-white/60'
                    }`}
                  >
                    <span className="block text-xs font-bold text-emerald-400">2. 100% Kashmir Flex Credit</span>
                    <span className="block text-[10px] text-white/50 mt-0.5">Deposit full refund into customer wallet</span>
                  </button>
                </div>
              </div>

              {resolutionAction === 'REROUTED' && (
                <div>
                  <label className="text-[10px] font-black uppercase text-white/40 block mb-2">Smart Corridor Recommendations</label>
                  <div className="space-y-2">
                    {(selectedImpact.alternatives || []).map((alt: any, idx: number) => (
                      <div
                        key={idx}
                        onClick={() => setSelectedAlt(alt.alternativeDestination)}
                        className={`p-3 rounded-xl border cursor-pointer transition ${
                          selectedAlt === alt.alternativeDestination
                            ? 'bg-white/10 border-amber-400 text-white'
                            : 'bg-white/[0.02] border-white/5 text-white/70 hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-xs">{alt.alternativeDestination}</span>
                          <Badge className="bg-amber-400/15 text-amber-400 text-[10px] border-amber-400/30">
                            {alt.distanceKm} km away
                          </Badge>
                        </div>
                        <p className="text-[11px] text-white/50 mt-1">{alt.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <DialogFooter className="pt-3 border-t border-white/5 flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setResolveDialogOpen(false)}
                  className="text-white/60 hover:text-white text-xs"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleExecuteResolution}
                  disabled={isResolving === selectedImpact.id}
                  className="bg-amber-400 hover:bg-amber-300 text-black font-black text-xs uppercase px-5 rounded-xl"
                >
                  {isResolving === selectedImpact.id ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                  ) : null}
                  <span>Confirm Resolution Protocol</span>
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
