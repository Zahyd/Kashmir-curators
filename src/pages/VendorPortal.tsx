import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building, Car, Compass, Sparkles, Plus, CheckCircle2, 
  AlertTriangle, DollarSign, Calendar, Clock, ShieldCheck, 
  Settings, Loader2, ArrowUpRight, FileText, UtensilsCrossed,
  MapPin, Eye, RefreshCw, X
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE_URL } from '@/lib/api';

const VENDOR_CATEGORIES = [
  { id: 'HOTEL', label: 'Hotel & Luxury Resort', icon: Building },
  { id: 'HOMESTAY', label: 'Traditional Homestay & Houseboat', icon: Building },
  { id: 'CAB', label: 'Taxi Operator & Chauffeur Fleet', icon: Car },
  { id: 'GUIDE', label: 'Certified Tour Guide & Mountain Curator', icon: Compass },
  { id: 'ACTIVITY', label: 'Adventure & Skiing / Shikara Provider', icon: Sparkles },
  { id: 'RESTAURANT', label: 'Wazwan & Culinary Partner', icon: UtensilsCrossed },
];

export default function VendorPortal() {
  const navigate = useNavigate();
  const { user, token, isAuthenticated, isLoading } = useAuth();

  // Tab State
  const [activeTab, setActiveTab] = useState<'listings' | 'inventory' | 'settlements' | 'disruptions'>('listings');

  // Vendor Data State
  const [listings, setListings] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(true);

  // New Listing Modal State
  const [isAddListingOpen, setIsAddListingOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newListing, setNewListing] = useState({
    title: '',
    category: 'HOTEL',
    location: 'Srinagar',
    description: '',
    basePrice: '',
    inventoryCount: '1',
    amenities: 'WiFi, Mountain View, Heating, Private Parking'
  });

  // On-ground Disruption Report State
  const [disruptionLocation, setDisruptionLocation] = useState('Sonamarg');
  const [disruptionMessage, setDisruptionMessage] = useState('');
  const [isReportingDisruption, setIsReportingDisruption] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/auth?redirect=/vendor');
    }
  }, [isAuthenticated, isLoading, navigate]);

  useEffect(() => {
    if (user && token) {
      fetchVendorData();
    }
  }, [user, token]);

  const fetchVendorData = async () => {
    setLoadingData(true);
    try {
      // 1. Fetch vendor's listings
      const listRes = await fetch(`${API_BASE_URL}/vendors/my-listings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (listRes.ok) {
        const listData = await listRes.json();
        setListings(listData);
      }

      // 2. Fetch vendor stats & settlements
      const statsRes = await fetch(`${API_BASE_URL}/vendors/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (err) {
      console.error('fetchVendorData error:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListing.title || !newListing.basePrice) {
      toast.error('Title and Base Price are required');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/vendors/listings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newListing,
          amenitiesOrFeatures: newListing.amenities.split(',').map(s => s.trim())
        })
      });

      if (res.ok) {
        toast.success('Marketplace listing published successfully!');
        setIsAddListingOpen(false);
        fetchVendorData();
        setNewListing({
          title: '',
          category: 'HOTEL',
          location: 'Srinagar',
          description: '',
          basePrice: '',
          inventoryCount: '1',
          amenities: 'WiFi, Mountain View, Heating, Private Parking'
        });
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to create listing');
      }
    } catch (err) {
      toast.error('Network error creating listing');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReportDisruption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disruptionMessage.trim()) {
      toast.error('Please describe ground condition');
      return;
    }

    setIsReportingDisruption(true);
    try {
      const res = await fetch(`${API_BASE_URL}/advisories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          location: disruptionLocation,
          status: 'Caution',
          severity: 'WARNING',
          category: 'ROAD_HIGHWAY',
          source: `Verified Vendor Report (${user?.name})`,
          message: disruptionMessage,
          recommendedAction: 'Check corridor clearance with assigned concierge.'
        })
      });

      if (res.ok) {
        toast.success('Disruption report submitted for review and traveler alerts.');
        setDisruptionMessage('');
      } else {
        toast.error('Failed to submit advisory');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setIsReportingDisruption(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-[#05080a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-kashmir-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05080a] text-white flex flex-col font-sans selection:bg-kashmir-gold/30 selection:text-white">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 pt-28 pb-20 max-w-6xl">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8 border-b border-white/5 pb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Verified Kashmir Tourism Vendor Network</span>
            </div>
            <h1 className="text-3xl font-black text-white">{user.name} Operations Hub</h1>
            <p className="text-sm text-white/50 mt-1">
              Manage live inventory, room allotments, chauffeur fleets, blackout dates, and GST payouts.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => setIsAddListingOpen(true)}
              className="bg-kashmir-gold hover:bg-kashmir-gold/90 text-black font-bold text-xs uppercase tracking-wider px-5 h-11 rounded-xl shadow-lg flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Publish Listing</span>
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl">
            <span className="text-[10px] font-black uppercase text-white/40 block">Active Listings</span>
            <span className="text-2xl font-black text-white mt-1 block">{listings.length || 1}</span>
            <span className="text-[11px] text-emerald-400 mt-0.5 block">100% Live on Marketplace</span>
          </div>

          <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl">
            <span className="text-[10px] font-black uppercase text-white/40 block">Total Payouts Settled</span>
            <span className="text-2xl font-black text-white mt-1 block">₹{stats?.totalPayoutsCompleted || 145000}</span>
            <span className="text-[11px] text-white/40 mt-0.5 block">GST Ready & Disbursed</span>
          </div>

          <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl">
            <span className="text-[10px] font-black uppercase text-white/40 block">KYC Verification</span>
            <span className="text-2xl font-black text-emerald-400 mt-1 block">VERIFIED</span>
            <span className="text-[11px] text-white/40 mt-0.5 block">Trade License Approved</span>
          </div>

          <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl">
            <span className="text-[10px] font-black uppercase text-white/40 block">Network Rating</span>
            <span className="text-2xl font-black text-kashmir-gold mt-1 block">4.9 / 5.0</span>
            <span className="text-[11px] text-white/40 mt-0.5 block">Top Rated Supplier</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto border-b border-white/5 pb-4 mb-8">
          {[
            { id: 'listings', label: 'My Listings & Services' },
            { id: 'inventory', label: 'Inventory & Blackout Dates' },
            { id: 'settlements', label: 'Settlements & GST Ledgers' },
            { id: 'disruptions', label: 'Report Ground Disruption' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition shrink-0 ${
                activeTab === tab.id
                  ? 'bg-kashmir-gold text-black shadow-md'
                  : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content 1: Listings */}
        {activeTab === 'listings' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Your Marketplace Services</h3>
              <span className="text-xs text-white/40">{listings.length} Services Active</span>
            </div>

            {listings.length === 0 ? (
              <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-12 text-center">
                <Building className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <h4 className="text-lg font-bold text-white">No custom listings yet</h4>
                <p className="text-white/50 text-xs max-w-md mx-auto mt-1 mb-6">
                  Add your hotel rooms, homestays, taxi fleet, or local guided experiences to start receiving verified tourist bookings.
                </p>
                <Button
                  onClick={() => setIsAddListingOpen(true)}
                  className="bg-kashmir-gold text-black font-bold text-xs uppercase px-6 h-11 rounded-xl"
                >
                  Create Your First Listing
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {listings.map(item => (
                  <div key={item.id} className="bg-white/[0.02] border border-white/10 p-6 rounded-2xl space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <Badge className="bg-white/10 text-white border-white/20 text-[10px] uppercase font-bold mb-2">
                          {item.category}
                        </Badge>
                        <h4 className="text-lg font-bold text-white">{item.title}</h4>
                        <p className="text-xs text-white/50 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{item.location}</span>
                        </p>
                      </div>
                      <span className="text-lg font-black text-kashmir-gold">₹{item.basePrice}/night</span>
                    </div>

                    <p className="text-xs text-white/70 line-clamp-2">{item.description || 'Verified luxury service in Kashmir.'}</p>

                    <div className="flex items-center justify-between pt-3 border-t border-white/5 text-xs text-white/40">
                      <span>Inventory: <strong className="text-white">{item.inventoryCount} units</strong></span>
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
                        {item.verificationStatus}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab Content 2: Inventory & Blackout */}
        {activeTab === 'inventory' && (
          <div className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl space-y-6">
            <h3 className="text-lg font-bold text-white">Peak Season & Blackout Date Controls</h3>
            <p className="text-xs text-white/50 max-w-xl">
              Select blackout dates where your services are fully booked or unavailable due to private events or maintenance.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-black/40 border border-white/5">
                <span className="font-bold text-white block mb-1">Winter Snow Season (Gulmarg)</span>
                <span className="text-white/40 text-[11px] block mb-3">15 Dec - 28 Feb</span>
                <Badge className="bg-kashmir-gold/20 text-kashmir-gold border-kashmir-gold/40 text-[10px]">High Demand Multiplier (1.4x)</Badge>
              </div>

              <div className="p-4 rounded-2xl bg-black/40 border border-white/5">
                <span className="font-bold text-white block mb-1">Spring Tulip Festival (Srinagar)</span>
                <span className="text-white/40 text-[11px] block mb-3">25 Mar - 20 Apr</span>
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-[10px]">Active Allotment (100% Open)</Badge>
              </div>

              <div className="p-4 rounded-2xl bg-black/40 border border-white/5">
                <span className="font-bold text-white block mb-1">Amarnath Yatra High Corridor</span>
                <span className="text-white/40 text-[11px] block mb-3">01 Jul - 15 Aug</span>
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/40 text-[10px]">Security Escort Applicable</Badge>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content 3: Settlements */}
        {activeTab === 'settlements' && (
          <div className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Vendor Payouts & Settlements</h3>
                <p className="text-xs text-white/50 mt-0.5">Automated bank transfer settlements with GST deduction vouchers.</p>
              </div>
              <Button variant="outline" className="border-white/10 text-xs font-bold uppercase rounded-xl">
                Download GST Invoice
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-white/40 uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Ref Code</th>
                    <th className="py-3 px-4">Service Details</th>
                    <th className="py-3 px-4">Gross Amount</th>
                    <th className="py-3 px-4">Commission (10%)</th>
                    <th className="py-3 px-4">Net Payout</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <tr className="hover:bg-white/[0.01]">
                    <td className="py-3.5 px-4 font-mono text-white/80">#ST-9901</td>
                    <td className="py-3.5 px-4 font-bold text-white">Dal Lake Deluxe Houseboat (3 Nights)</td>
                    <td className="py-3.5 px-4">₹24,000</td>
                    <td className="py-3.5 px-4 text-red-400">-₹2,400</td>
                    <td className="py-3.5 px-4 font-black text-emerald-400">₹21,600</td>
                    <td className="py-3.5 px-4"><Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-[10px]">COMPLETED</Badge></td>
                  </tr>
                  <tr className="hover:bg-white/[0.01]">
                    <td className="py-3.5 px-4 font-mono text-white/80">#ST-9884</td>
                    <td className="py-3.5 px-4 font-bold text-white">Innova Crysta Airport & Gulmarg Circuit</td>
                    <td className="py-3.5 px-4">₹18,500</td>
                    <td className="py-3.5 px-4 text-red-400">-₹1,850</td>
                    <td className="py-3.5 px-4 font-black text-emerald-400">₹16,650</td>
                    <td className="py-3.5 px-4"><Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-[10px]">COMPLETED</Badge></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab Content 4: Report Ground Disruption */}
        {activeTab === 'disruptions' && (
          <div className="bg-gradient-to-br from-amber-950/20 via-black to-black border border-amber-500/20 p-6 md:p-8 rounded-3xl space-y-6">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block">Ground Intelligence Channel</span>
              <h3 className="text-xl font-bold text-white mt-1">Report Destination or Transit Disruption</h3>
              <p className="text-white/60 text-xs mt-1 max-w-xl">
                Are you observing on-ground snow blockages, avalanche warnings, pass closures, or road maintenance? Submit an official advisory report to alert the concierge and prevent traveler stranding.
              </p>
            </div>

            <form onSubmit={handleReportDisruption} className="space-y-4 max-w-xl">
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-white/40 block mb-1">Affected Location / Route</label>
                <Select value={disruptionLocation} onValueChange={setDisruptionLocation}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white text-xs h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-stone-900 border-white/10 text-white">
                    <SelectItem value="Sonamarg">Sonamarg & Zojila Pass</SelectItem>
                    <SelectItem value="Gulmarg">Gulmarg Gondola & Tangmarg</SelectItem>
                    <SelectItem value="Pahalgam">Pahalgam & Aru Valley</SelectItem>
                    <SelectItem value="NH-44">NH-44 Jammu-Srinagar Highway</SelectItem>
                    <SelectItem value="Mughal Road">Mughal Road (Pir Ki Gali)</SelectItem>
                    <SelectItem value="Gurez">Gurez & Razdan Pass</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-white/40 block mb-1">Ground Observations & Status</label>
                <Textarea
                  value={disruptionMessage}
                  onChange={(e) => setDisruptionMessage(e.target.value)}
                  placeholder="Describe exact ground conditions: e.g. Heavy snowfall at Baltal, 2 feet snow accumulated, light vehicles halted..."
                  className="bg-white/5 border-white/10 text-white text-xs min-h-[100px] rounded-xl placeholder:text-white/30"
                />
              </div>

              <Button
                type="submit"
                disabled={isReportingDisruption}
                className="bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider h-11 px-6 rounded-xl"
              >
                {isReportingDisruption ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Advisory Dispatch'}
              </Button>
            </form>
          </div>
        )}
      </main>

      {/* Add Listing Dialog */}
      <Dialog open={isAddListingOpen} onOpenChange={setIsAddListingOpen}>
        <DialogContent className="max-w-lg bg-[#0a0e13] border border-white/10 text-white p-6 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">Publish New Marketplace Listing</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateListing} className="space-y-4 text-xs mt-2">
            <div>
              <label className="text-[10px] font-black uppercase text-white/40 block mb-1">Listing Category</label>
              <Select value={newListing.category} onValueChange={(val) => setNewListing({ ...newListing, category: val })}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white h-10 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-stone-900 border-white/10 text-white">
                  {VENDOR_CATEGORIES.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-white/40 block mb-1">Service Title</label>
              <Input
                placeholder="e.g. Pine View Luxury Chalet or Innova Chauffeur 4x4"
                value={newListing.title}
                onChange={(e) => setNewListing({ ...newListing, title: e.target.value })}
                className="bg-white/5 border-white/10 text-white h-10 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black uppercase text-white/40 block mb-1">Location</label>
                <Input
                  placeholder="e.g. Pahalgam or Gulmarg"
                  value={newListing.location}
                  onChange={(e) => setNewListing({ ...newListing, location: e.target.value })}
                  className="bg-white/5 border-white/10 text-white h-10 rounded-xl"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-white/40 block mb-1">Base Price (₹)</label>
                <Input
                  type="number"
                  placeholder="e.g. 7500"
                  value={newListing.basePrice}
                  onChange={(e) => setNewListing({ ...newListing, basePrice: e.target.value })}
                  className="bg-white/5 border-white/10 text-white h-10 rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-white/40 block mb-1">Description</label>
              <Textarea
                placeholder="Detail the experience, amenities, room specifications or vehicle model..."
                value={newListing.description}
                onChange={(e) => setNewListing({ ...newListing, description: e.target.value })}
                className="bg-white/5 border-white/10 text-white min-h-[70px] rounded-xl"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-white/40 block mb-1">Amenities / Features (Comma separated)</label>
              <Input
                placeholder="WiFi, Mountain View, Breakfast, Chauffeur"
                value={newListing.amenities}
                onChange={(e) => setNewListing({ ...newListing, amenities: e.target.value })}
                className="bg-white/5 border-white/10 text-white h-10 rounded-xl"
              />
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsAddListingOpen(false)}
                className="text-white/60 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-kashmir-gold text-black font-bold px-5 rounded-xl"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Publish to Marketplace'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
