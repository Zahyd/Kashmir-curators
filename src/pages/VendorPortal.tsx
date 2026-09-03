import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Building, Car, Compass, Sparkles, Plus, CheckCircle2, 
  AlertTriangle, DollarSign, Calendar, Clock, ShieldCheck, 
  Settings, Loader2, ArrowUpRight, FileText, UtensilsCrossed,
  MapPin, Eye, RefreshCw, X, LogOut, Phone, Mail, User,
  Check, ChevronRight, Lock, Key, ArrowRight, ShieldAlert,
  Download, Send, AlertCircle, TrendingUp, CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE_URL } from '@/lib/api';

const VENDOR_CATEGORIES = [
  { id: 'HOTEL', label: 'Hotel & Luxury Resort', icon: Building, desc: 'Hotels, boutique lodges & luxury mountain chalets' },
  { id: 'HOMESTAY', label: 'Homestay & Houseboat', icon: Building, desc: 'Traditional cedar wood houseboats & village cottages' },
  { id: 'CAB', label: 'Chauffeur Fleet & Taxi', icon: Car, desc: 'Innova Crysta, 4x4 SUVs & private transit operators' },
  { id: 'GUIDE', label: 'Tour Guide & Curator', icon: Compass, desc: 'Department of Tourism certified local mountain guides' },
  { id: 'ACTIVITY', label: 'Ski, Trek & Shikara', icon: Sparkles, desc: 'Gondola activities, heli-skiing, rafting & Shikara rides' },
  { id: 'RESTAURANT', label: 'Wazwan & Fine Dining', icon: UtensilsCrossed, desc: 'Traditional Kashmiri Wazwan & artisanal mountain cafes' },
];

const KASHMIR_LOCATIONS = [
  'Srinagar',
  'Gulmarg',
  'Pahalgam',
  'Sonamarg',
  'Doodhpathri',
  'Yusmarg',
  'Gurez Valley',
  'Sinthan Top',
  'Aru Valley',
  'Lolab Valley'
];

export default function VendorPortal() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, token, isAuthenticated, isLoading, login } = useAuth();

  // Auth / Portal Mode
  const [authTab, setAuthTab] = useState<'register' | 'login'>(searchParams.get('mode') === 'login' ? 'login' : 'register');
  const [dashboardTab, setDashboardTab] = useState<'overview' | 'listings' | 'bookings' | 'calendar' | 'financials' | 'disruptions' | 'kyc'>('overview');

  // Vendor Data State
  const [listings, setListings] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(false);

  // Registration Form State
  const [isRegistering, setIsRegistering] = useState(false);
  const [regForm, setRegForm] = useState({
    companyName: '',
    type: 'HOTEL',
    contactPerson: '',
    phone: '',
    email: '',
    password: '',
    location: 'Srinagar',
    basePrice: '5500',
    description: '',
    gstin: '',
    payoutUpi: ''
  });

  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // New Listing Modal State
  const [isAddListingOpen, setIsAddListingOpen] = useState(false);
  const [isSubmittingListing, setIsSubmittingListing] = useState(false);
  const [newListing, setNewListing] = useState({
    title: '',
    category: 'HOTEL',
    location: 'Srinagar',
    description: '',
    basePrice: '',
    inventoryCount: '2',
    amenities: 'High-speed WiFi, Central Heating, Mountain View, Breakfast Included'
  });

  // Payout Request Modal State
  const [isPayoutOpen, setIsPayoutOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('25000');
  const [payoutUpi, setPayoutUpi] = useState('kashmir.resort@upi');
  const [isRequestingPayout, setIsRequestingPayout] = useState(false);

  // On-ground Disruption Report State
  const [disruptionLocation, setDisruptionLocation] = useState('Sonamarg');
  const [disruptionCondition, setDisruptionCondition] = useState('Caution');
  const [disruptionMessage, setDisruptionMessage] = useState('');
  const [isReportingDisruption, setIsReportingDisruption] = useState(false);

  // Blackout Date state
  const [blackoutAssetId, setBlackoutAssetId] = useState('');
  const [blackoutDateRange, setBlackoutDateRange] = useState('');

  // Determine if active user is a verified vendor
  const isVendor = isAuthenticated && (user?.role === 'supplier' || user?.role === 'admin' || user?.role === 'driver');

  useEffect(() => {
    if (isVendor && token) {
      fetchVendorData();
    }
  }, [isVendor, token]);

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

      // 3. Fetch assigned bookings
      const bookRes = await fetch(`${API_BASE_URL}/vendors/bookings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (bookRes.ok) {
        const bookData = await bookRes.json();
        setBookings(bookData);
      }
    } catch (err) {
      console.error('fetchVendorData error:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleRegisterVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regForm.companyName || !regForm.phone || !regForm.email) {
      toast.error('Please fill in company name, phone, and email.');
      return;
    }

    setIsRegistering(true);
    try {
      const res = await fetch(`${API_BASE_URL}/vendors/onboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regForm)
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success('Vendor Account Successfully Created! Welcome to Kashmir Connect.');
        if (data.token) {
          localStorage.setItem('auth_token', data.token);
          window.location.reload();
        }
      } else {
        toast.error(data.error || 'Failed to onboard vendor account.');
      }
    } catch (err: any) {
      toast.error('Network error during onboarding: ' + err.message);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleVendorLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      toast.error('Please provide your vendor email and password.');
      return;
    }

    setIsLoggingIn(true);
    try {
      const res = await login(loginEmail, loginPassword);
      if (res.success) {
        toast.success('Vendor Portal Authenticated. Access granted.');
        window.location.reload();
      } else {
        toast.error(res.error || 'Invalid vendor credentials.');
      }
    } catch (err: any) {
      toast.error('Login failed: ' + err.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListing.title || !newListing.basePrice) {
      toast.error('Please provide a listing title and base price.');
      return;
    }

    setIsSubmittingListing(true);
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
        toast.success('Listing Published Live on Kashmir Marketplace!');
        setIsAddListingOpen(false);
        setNewListing({
          title: '',
          category: 'HOTEL',
          location: 'Srinagar',
          description: '',
          basePrice: '',
          inventoryCount: '2',
          amenities: 'High-speed WiFi, Central Heating, Mountain View, Breakfast Included'
        });
        fetchVendorData();
      } else {
        const errData = await res.json();
        toast.error(errData.error || 'Failed to publish listing.');
      }
    } catch (err: any) {
      toast.error('Error creating listing: ' + err.message);
    } finally {
      setIsSubmittingListing(false);
    }
  };

  const handleToggleListingActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`${API_BASE_URL}/vendors/listings/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });

      if (res.ok) {
        toast.success(`Listing ${!currentStatus ? 'Activated' : 'Paused'}`);
        fetchVendorData();
      }
    } catch (err) {
      toast.error('Failed to update listing status');
    }
  };

  const handleDeleteListing = async (id: string) => {
    if (!confirm('Are you sure you want to remove this listing?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/vendors/listings/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('Listing removed.');
        fetchVendorData();
      }
    } catch (err) {
      toast.error('Failed to delete listing');
    }
  };

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRequestingPayout(true);
    try {
      const res = await fetch(`${API_BASE_URL}/vendors/payout-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: parseFloat(payoutAmount),
          upiOrBankNotes: payoutUpi
        })
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Payout request registered.');
        setIsPayoutOpen(false);
        fetchVendorData();
      } else {
        toast.error(data.error || 'Payout request failed.');
      }
    } catch (err: any) {
      toast.error('Error requesting payout: ' + err.message);
    } finally {
      setIsRequestingPayout(false);
    }
  };

  const handleReportDisruption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disruptionMessage) {
      toast.error('Please enter disruption details.');
      return;
    }

    setIsReportingDisruption(true);
    try {
      const res = await fetch(`${API_BASE_URL}/vendors/report-disruption`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          location: disruptionLocation,
          condition: disruptionCondition,
          message: disruptionMessage
        })
      });

      if (res.ok) {
        toast.success('On-ground alert broadcasted to Central Operations Desk!');
        setDisruptionMessage('');
      } else {
        toast.error('Failed to submit ground alert');
      }
    } catch (err: any) {
      toast.error('Error reporting alert: ' + err.message);
    } finally {
      setIsReportingDisruption(false);
    }
  };

  // ==========================================
  // VIEW 1: VENDOR ONBOARDING & AUTH PORTAL
  // ==========================================
  if (!isVendor) {
    return (
      <div className="min-h-screen bg-[#06090c] text-white flex flex-col justify-between selection:bg-amber-500 selection:text-black">
        <header className="px-6 py-6 border-b border-white/5 flex items-center justify-between container mx-auto">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black font-black shadow-lg shadow-amber-500/20">
              KC
            </div>
            <div>
              <h1 className="font-bold text-base tracking-wider">KASHMIR CONNECT</h1>
              <p className="text-[10px] text-amber-400 font-mono tracking-widest uppercase">Verified Vendor Network</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')} 
              className="text-white/60 hover:text-white text-xs font-bold"
            >
              Tourist Home
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setAuthTab(authTab === 'register' ? 'login' : 'register')}
              className="border-white/10 hover:border-amber-400/50 text-xs font-bold rounded-xl"
            >
              {authTab === 'register' ? 'Vendor Sign In' : 'Register New Vendor'}
            </Button>
          </div>
        </header>

        <main className="container mx-auto px-4 py-12 max-w-5xl">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 text-xs font-bold uppercase tracking-widest mb-4">
              <ShieldCheck className="w-4 h-4" />
              <span>Direct Tourism Partner Platform</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
              Grow Your Tourism Business in Kashmir
            </h2>
            <p className="text-white/50 text-sm md:text-base mt-4">
              Join Kashmir's premier decentralized operations marketplace. Connect your hotel, luxury houseboat, 4x4 chauffeur fleet, or mountain adventure agency directly with high-value travelers.
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex justify-center mb-10">
            <div className="p-1 bg-white/5 rounded-2xl border border-white/10 flex gap-1">
              <button
                type="button"
                onClick={() => setAuthTab('register')}
                className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                  authTab === 'register' 
                    ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20' 
                    : 'text-white/60 hover:text-white'
                }`}
              >
                1. Register New Vendor Account
              </button>
              <button
                type="button"
                onClick={() => setAuthTab('login')}
                className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                  authTab === 'login' 
                    ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20' 
                    : 'text-white/60 hover:text-white'
                }`}
              >
                2. Vendor Hub Login
              </button>
            </div>
          </div>

          {/* REGISTER FORM */}
          {authTab === 'register' ? (
            <div className="bg-[#0c1217] border border-white/10 rounded-3xl p-6 md:p-10 shadow-2xl backdrop-blur-xl">
              <form onSubmit={handleRegisterVendor} className="space-y-8">
                
                {/* Step 1: Category Selection */}
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-amber-400 block mb-3">
                    Select Your Business Category
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {VENDOR_CATEGORIES.map((cat) => {
                      const Icon = cat.icon;
                      const isSelected = regForm.type === cat.id;
                      return (
                        <div
                          key={cat.id}
                          onClick={() => setRegForm({ ...regForm, type: cat.id })}
                          className={`p-4 rounded-2xl border cursor-pointer transition flex items-start gap-3 ${
                            isSelected 
                              ? 'bg-amber-400/10 border-amber-400 shadow-md shadow-amber-400/10' 
                              : 'bg-white/[0.02] border-white/5 hover:border-white/20'
                          }`}
                        >
                          <div className={`p-2.5 rounded-xl shrink-0 ${isSelected ? 'bg-amber-400 text-black' : 'bg-white/5 text-white/60'}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className={`text-xs font-bold ${isSelected ? 'text-amber-400' : 'text-white'}`}>{cat.label}</h4>
                            <p className="text-[10px] text-white/40 mt-1 leading-relaxed">{cat.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Step 2: Business & Contact Details */}
                <div className="border-t border-white/5 pt-8">
                  <label className="text-xs font-black uppercase tracking-widest text-amber-400 block mb-4">
                    Company & Contact Coordinates
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <span className="text-[11px] font-bold text-white/50 block mb-1.5">Business / Legal Trade Name *</span>
                      <Input
                        required
                        placeholder="e.g. Pine Palace Resort & Spa"
                        value={regForm.companyName}
                        onChange={(e) => setRegForm({ ...regForm, companyName: e.target.value })}
                        className="bg-black/40 border-white/10 h-12 rounded-xl text-white focus-visible:ring-amber-400"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-white/50 block mb-1.5">Primary Valley / District *</span>
                      <Select
                        value={regForm.location}
                        onValueChange={(val) => setRegForm({ ...regForm, location: val })}
                      >
                        <SelectTrigger className="bg-black/40 border-white/10 h-12 rounded-xl text-white">
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#121921] border-white/10 text-white">
                          {KASHMIR_LOCATIONS.map((loc) => (
                            <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <span className="text-[11px] font-bold text-white/50 block mb-1.5">Contact Person / Operator Name *</span>
                      <Input
                        required
                        placeholder="e.g. Tariq Ahmad Mir"
                        value={regForm.contactPerson}
                        onChange={(e) => setRegForm({ ...regForm, contactPerson: e.target.value })}
                        className="bg-black/40 border-white/10 h-12 rounded-xl text-white focus-visible:ring-amber-400"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-white/50 block mb-1.5">Official Mobile / Dispatch Number (with WhatsApp) *</span>
                      <Input
                        required
                        placeholder="e.g. +91 94190 12345"
                        value={regForm.phone}
                        onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                        className="bg-black/40 border-white/10 h-12 rounded-xl text-white focus-visible:ring-amber-400"
                      />
                    </div>

                    <div>
                      <span className="text-[11px] font-bold text-white/50 block mb-1.5">Vendor Email Address *</span>
                      <Input
                        required
                        type="email"
                        placeholder="vendor@company.com"
                        value={regForm.email}
                        onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                        className="bg-black/40 border-white/10 h-12 rounded-xl text-white focus-visible:ring-amber-400"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-white/50 block mb-1.5">Dashboard Password *</span>
                      <Input
                        required
                        type="password"
                        placeholder="Create secure access key"
                        value={regForm.password}
                        onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                        className="bg-black/40 border-white/10 h-12 rounded-xl text-white focus-visible:ring-amber-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Step 3: Service Pricing & Settlements */}
                <div className="border-t border-white/5 pt-8">
                  <label className="text-xs font-black uppercase tracking-widest text-amber-400 block mb-4">
                    Initial Asset & Payout Setup
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div>
                      <span className="text-[11px] font-bold text-white/50 block mb-1.5">Starting Rate / Night / Day (₹)</span>
                      <Input
                        type="number"
                        placeholder="e.g. 5500"
                        value={regForm.basePrice}
                        onChange={(e) => setRegForm({ ...regForm, basePrice: e.target.value })}
                        className="bg-black/40 border-white/10 h-12 rounded-xl text-white focus-visible:ring-amber-400"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-white/50 block mb-1.5">GSTIN / Tourism Registration</span>
                      <Input
                        placeholder="e.g. 01AAAAA0000A1Z5 (Optional)"
                        value={regForm.gstin}
                        onChange={(e) => setRegForm({ ...regForm, gstin: e.target.value })}
                        className="bg-black/40 border-white/10 h-12 rounded-xl text-white focus-visible:ring-amber-400"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-white/50 block mb-1.5">UPI ID or Bank Details for Instant Payouts</span>
                      <Input
                        placeholder="e.g. merchant@icici"
                        value={regForm.payoutUpi}
                        onChange={(e) => setRegForm({ ...regForm, payoutUpi: e.target.value })}
                        className="bg-black/40 border-white/10 h-12 rounded-xl text-white focus-visible:ring-amber-400"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <span className="text-[11px] font-bold text-white/50 block mb-1.5">Brief Service Description</span>
                    <Textarea
                      placeholder="Highlight room amenities, 4x4 snow chains capability, languages spoken, or scenic valley views..."
                      value={regForm.description}
                      onChange={(e) => setRegForm({ ...regForm, description: e.target.value })}
                      className="bg-black/40 border-white/10 rounded-xl text-white focus-visible:ring-amber-400 min-h-[80px]"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/5 pt-6">
                  <div className="flex items-center gap-2 text-xs text-white/40">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Zero upfront onboarding cost. Direct automated payouts.</span>
                  </div>

                  <Button
                    type="submit"
                    disabled={isRegistering}
                    className="w-full sm:w-auto bg-amber-400 hover:bg-amber-300 text-black font-black uppercase text-xs tracking-wider h-12 px-8 rounded-xl shadow-lg shadow-amber-400/20"
                  >
                    {isRegistering ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating Vendor Node...
                      </>
                    ) : (
                      <>
                        Complete Registration & Launch Hub
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>

              </form>
            </div>
          ) : (
            /* LOGIN FORM */
            <div className="bg-[#0c1217] border border-white/10 rounded-3xl p-8 max-w-md mx-auto shadow-2xl backdrop-blur-xl">
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-2xl bg-amber-400/10 text-amber-400 flex items-center justify-center mx-auto mb-3 border border-amber-400/20">
                  <Key className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-xl text-white">Vendor Command Sign In</h3>
                <p className="text-xs text-white/40 mt-1">Access your bookings, inventory and settlements</p>
              </div>

              <form onSubmit={handleVendorLogin} className="space-y-4">
                <div>
                  <span className="text-xs font-bold text-white/60 block mb-1">Vendor Email</span>
                  <Input
                    required
                    type="email"
                    placeholder="operator@resort.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="bg-black/40 border-white/10 h-12 rounded-xl text-white focus-visible:ring-amber-400"
                  />
                </div>
                <div>
                  <span className="text-xs font-bold text-white/60 block mb-1">Password</span>
                  <Input
                    required
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="bg-black/40 border-white/10 h-12 rounded-xl text-white focus-visible:ring-amber-400"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full bg-amber-400 hover:bg-amber-300 text-black font-black uppercase text-xs tracking-wider h-12 rounded-xl mt-4 shadow-lg shadow-amber-400/20"
                >
                  {isLoggingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enter Vendor Dashboard'}
                </Button>

                <p className="text-center text-xs text-white/40 mt-4">
                  Need a new vendor account?{' '}
                  <span 
                    onClick={() => setAuthTab('register')} 
                    className="text-amber-400 font-bold cursor-pointer hover:underline"
                  >
                    Register here
                  </span>
                </p>
              </form>
            </div>
          )}
        </main>

        <footer className="py-6 border-t border-white/5 text-center text-xs text-white/30 container mx-auto">
          Kashmir Connect Operator Hub • Secured by Decentralized Operations Protocol • Sopore, Srinagar & Gulmarg
        </footer>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: COMPLETE VENDOR OPERATIONS DASHBOARD
  // ==========================================
  return (
    <div className="min-h-screen bg-[#070a0d] text-white flex flex-col font-sans selection:bg-amber-500 selection:text-black">
      
      {/* Top Operations Header */}
      <header className="px-6 md:px-12 py-5 bg-[#090e13]/90 border-b border-white/5 backdrop-blur-xl sticky top-0 z-50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black font-black shadow-lg shadow-amber-500/20">
            KC
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base text-white tracking-wide">{user?.name || 'Kashmir Vendor'} Hub</h2>
              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[9px] font-mono uppercase tracking-widest">
                VERIFIED OPERATOR
              </Badge>
            </div>
            <p className="text-[10px] text-white/40 font-mono tracking-widest uppercase">Direct Marketplace Node • Kashmir Connect</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setIsPayoutOpen(true)}
            className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 text-xs font-bold rounded-xl h-10 px-4 hidden sm:flex items-center gap-2"
          >
            <CreditCard className="w-4 h-4" />
            <span>Instant Payout (₹{(stats?.settlementBalance || 42000).toLocaleString()})</span>
          </Button>

          <Button
            onClick={() => setIsAddListingOpen(true)}
            className="bg-amber-400 hover:bg-amber-300 text-black text-xs font-black uppercase tracking-wider rounded-xl h-10 px-4 shadow-lg shadow-amber-400/15"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            <span>New Asset</span>
          </Button>

          <Button
            variant="ghost"
            onClick={() => {
              localStorage.removeItem('auth_token');
              window.location.reload();
            }}
            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 p-0 text-white/50 hover:text-white"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Main Container */}
      <div className="container mx-auto px-4 md:px-8 py-8 flex-1 max-w-7xl">
        
        {/* Metric Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="p-5 rounded-2xl bg-[#0d141b] border border-white/5 relative overflow-hidden">
            <span className="text-[10px] font-black uppercase text-white/40 tracking-widest block mb-1">Live Listings</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">{listings.length || 3}</span>
              <span className="text-xs text-emerald-400 font-bold">100% Active</span>
            </div>
            <p className="text-[11px] text-white/40 mt-2">Available across tourist search</p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0d141b] border border-white/5 relative overflow-hidden">
            <span className="text-[10px] font-black uppercase text-white/40 tracking-widest block mb-1">Assigned Reservations</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-amber-400">{bookings.length || 18}</span>
              <span className="text-xs text-white/40">This Month</span>
            </div>
            <p className="text-[11px] text-white/40 mt-2">Guaranteed platform bookings</p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0d141b] border border-white/5 relative overflow-hidden">
            <span className="text-[10px] font-black uppercase text-white/40 tracking-widest block mb-1">Gross Settled Earnings</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-emerald-400">₹{(stats?.totalPayoutsCompleted || 148500).toLocaleString()}</span>
            </div>
            <p className="text-[11px] text-white/40 mt-2">Net after 10% platform commission</p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0d141b] border border-white/5 relative overflow-hidden">
            <span className="text-[10px] font-black uppercase text-white/40 tracking-widest block mb-1">Available Payout</span>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-black text-white">₹{(stats?.settlementBalance || 42000).toLocaleString()}</span>
              <button
                onClick={() => setIsPayoutOpen(true)}
                className="text-xs text-amber-400 font-bold hover:underline"
              >
                Withdraw
              </button>
            </div>
            <p className="text-[11px] text-emerald-400 mt-2">Ready for UPI instant transfer</p>
          </div>
        </div>

        {/* Dashboard Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-8 border-b border-white/5 scrollbar-none">
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'listings', label: 'Listings & Assets', icon: Building, count: listings.length },
            { id: 'bookings', label: 'Guest Bookings', icon: Calendar, count: bookings.length },
            { id: 'calendar', label: 'Blackout Dates', icon: Clock },
            { id: 'financials', label: 'Payouts & GST', icon: DollarSign },
            { id: 'disruptions', label: 'Report Ground Disruption', icon: AlertTriangle, badge: 'Live' },
            { id: 'kyc', label: 'Business & KYC', icon: ShieldCheck }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = dashboardTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setDashboardTab(tab.id as any)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition ${
                  isActive 
                    ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/15' 
                    : 'bg-white/[0.02] border border-white/5 text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] ${isActive ? 'bg-black text-amber-400 font-bold' : 'bg-white/10 text-white'}`}>
                    {tab.count}
                  </span>
                )}
                {tab.badge && (
                  <span className="px-1.5 py-0.5 rounded-md text-[9px] bg-red-500/20 text-red-400 border border-red-500/30">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ======================================================== */}
        {/* TAB 1: OVERVIEW */}
        {/* ======================================================== */}
        {dashboardTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left 2 Cols: Quick Actions & Recent Bookings */}
              <div className="lg:col-span-2 space-y-6">
                <div className="p-6 rounded-3xl bg-[#0c1217] border border-white/5">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-base font-bold text-white">Upcoming Guest Check-Ins</h3>
                      <p className="text-xs text-white/40">Verified travelers assigned to your properties/cabs</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      onClick={() => setDashboardTab('bookings')}
                      className="text-xs text-amber-400 font-bold hover:text-amber-300"
                    >
                      View All Bookings &rarr;
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {[
                      { guest: 'Vikram Malhotra', item: 'Executive Pine Suite', date: 'Tomorrow, 12:00 PM', amount: 14500, status: 'Confirmed' },
                      { guest: 'Ananya Deshmukh', item: 'Toyota Innova Crysta (4x4)', date: '08 Sep, 09:30 AM', amount: 7500, status: 'Confirmed' },
                      { guest: 'Farhan Zaidi', item: 'Dal Lake Royal Houseboat', date: '11 Sep, 02:00 PM', amount: 12000, status: 'Completed' },
                    ].map((b, i) => (
                      <div key={i} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-400/10 text-amber-400 flex items-center justify-center font-bold text-sm border border-amber-400/20">
                            {b.guest.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-white">{b.guest}</h4>
                            <p className="text-xs text-white/40">{b.item} • {b.date}</p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-bold text-emerald-400 text-sm block">₹{b.amount.toLocaleString()}</span>
                          <span className="text-[10px] uppercase font-bold text-white/50">{b.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ground Alert Quick Banner */}
                <div className="p-6 rounded-3xl bg-gradient-to-r from-red-950/20 via-black to-red-950/20 border border-red-500/20 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center shrink-0 border border-red-500/20">
                      <ShieldAlert className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">Have Live Road or Pass Updates?</h4>
                      <p className="text-xs text-white/50">Report sudden snow, avalanche clearance or taxi strikes directly to central dispatch.</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setDashboardTab('disruptions')}
                    className="bg-red-500 hover:bg-red-600 text-white font-black text-xs uppercase tracking-wider rounded-xl h-10 px-4 shrink-0"
                  >
                    Report Ground Alert
                  </Button>
                </div>
              </div>

              {/* Right Column: Asset Health & Quick Stats */}
              <div className="space-y-6">
                <div className="p-6 rounded-3xl bg-[#0c1217] border border-white/5">
                  <h3 className="text-base font-bold text-white mb-4">Operations Health</h3>
                  
                  <div className="space-y-4 text-xs">
                    <div className="flex items-center justify-between pb-3 border-b border-white/5">
                      <span className="text-white/60">KYC Status</span>
                      <span className="font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                      </span>
                    </div>

                    <div className="flex items-center justify-between pb-3 border-b border-white/5">
                      <span className="text-white/60">Average Guest Rating</span>
                      <span className="font-bold text-amber-400">4.92 ★ (38 Reviews)</span>
                    </div>

                    <div className="flex items-center justify-between pb-3 border-b border-white/5">
                      <span className="text-white/60">Response Rate</span>
                      <span className="font-bold text-white">98.4% (Under 15 mins)</span>
                    </div>

                    <div className="flex items-center justify-between pb-3 border-b border-white/5">
                      <span className="text-white/60">Commission Tier</span>
                      <span className="font-bold text-amber-400">10% Platform Facilitation</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-white/60">Emergency SOS Dispatch</span>
                      <span className="font-bold text-emerald-400">Enabled</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-[#0c1217] border border-white/5">
                  <h3 className="text-base font-bold text-white mb-2">Need Chauffeur or Guide Support?</h3>
                  <p className="text-xs text-white/50 mb-4">Our 24/7 Srinagar Operations Command handles ground rerouting and transit assistance.</p>
                  <a href="tel:+919103798448">
                    <Button variant="outline" className="w-full border-white/10 hover:border-amber-400/40 text-xs font-bold h-11 rounded-xl">
                      Call Operations Desk (+91 91037 98448)
                    </Button>
                  </a>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: LISTINGS & ASSETS */}
        {/* ======================================================== */}
        {dashboardTab === 'listings' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Your Marketplace Assets</h3>
                <p className="text-xs text-white/40">Manage rates, active status and inventory counts</p>
              </div>
              <Button
                onClick={() => setIsAddListingOpen(true)}
                className="bg-amber-400 hover:bg-amber-300 text-black text-xs font-black uppercase tracking-wider rounded-xl h-11 px-5 shadow-lg shadow-amber-400/20"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                <span>Add Listing</span>
              </Button>
            </div>

            {listings.length === 0 ? (
              <div className="p-12 rounded-3xl bg-[#0c1217] border border-dashed border-white/10 text-center">
                <Building className="w-12 h-12 text-white/20 mx-auto mb-3" />
                <h4 className="font-bold text-lg text-white">No Listings Created Yet</h4>
                <p className="text-xs text-white/40 max-w-sm mx-auto mt-1 mb-6">
                  Add your hotel rooms, homestays, private cabs, or tour guide packages to start receiving bookings.
                </p>
                <Button onClick={() => setIsAddListingOpen(true)} className="bg-amber-400 text-black font-bold text-xs rounded-xl">
                  Create First Listing
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map((item) => (
                  <div key={item.id} className="rounded-3xl bg-[#0c1217] border border-white/5 overflow-hidden hover:border-white/20 transition flex flex-col justify-between">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <Badge className="bg-white/5 text-amber-400 border-white/10 text-[10px] font-mono uppercase tracking-widest">
                          {item.category}
                        </Badge>
                        <Badge className={`text-[10px] font-bold uppercase ${item.isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-white/5 text-white/40 border-white/5'}`}>
                          {item.isActive ? 'Active Live' : 'Paused'}
                        </Badge>
                      </div>

                      <h4 className="text-lg font-bold text-white mb-1 line-clamp-1">{item.title}</h4>
                      <p className="text-xs text-white/50 flex items-center gap-1 mb-4">
                        <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>{item.location}</span>
                      </p>

                      <p className="text-xs text-white/60 line-clamp-2 mb-6">
                        {item.description || 'Verified property/fleet with Kashmir Connect.'}
                      </p>

                      <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5 text-xs">
                        <div>
                          <span className="text-[10px] uppercase text-white/40 block">Base Rate</span>
                          <span className="font-bold text-amber-400 text-sm">₹{item.basePrice.toLocaleString()}/unit</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] uppercase text-white/40 block">Allotment</span>
                          <span className="font-bold text-white">{item.inventoryCount} units</span>
                        </div>
                      </div>
                    </div>

                    <div className="px-6 py-4 bg-white/[0.01] border-t border-white/5 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleToggleListingActive(item.id, item.isActive)}
                        className="text-xs font-bold text-white/50 hover:text-white transition"
                      >
                        {item.isActive ? 'Pause Asset' : 'Activate Live'}
                      </button>

                      <button
                        onClick={() => handleDeleteListing(item.id)}
                        className="text-xs font-bold text-red-400 hover:text-red-300 transition"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: BOOKINGS & RESERVATIONS */}
        {/* ======================================================== */}
        {dashboardTab === 'bookings' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h3 className="text-xl font-bold text-white">Assigned Guest Reservations</h3>
              <p className="text-xs text-white/40">Manage confirmed bookings, room allocations and chauffeur pickups</p>
            </div>

            <div className="rounded-3xl bg-[#0c1217] border border-white/5 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-white/70">
                  <thead className="bg-white/[0.02] text-white/40 uppercase text-[10px] font-black tracking-wider border-b border-white/5">
                    <tr>
                      <th className="px-6 py-4">Guest Name</th>
                      <th className="px-6 py-4">Service & Dates</th>
                      <th className="px-6 py-4">Contact</th>
                      <th className="px-6 py-4">Payout Amount</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {[
                      { id: 'RES-8921', guest: 'Vikram Malhotra', phone: '+91 98110 22345', service: 'Executive Suite (2 Nights)', dates: '04 Sep - 06 Sep', amount: 14500, status: 'CONFIRMED' },
                      { id: 'RES-8922', guest: 'Ananya Deshmukh', phone: '+91 99201 54321', service: 'Toyota Innova Crysta (Srinagar - Gulmarg)', dates: '08 Sep', amount: 7500, status: 'CONFIRMED' },
                      { id: 'RES-8919', guest: 'Farhan Zaidi', phone: '+91 94190 77123', service: 'Royal Lake Houseboat (1 Night)', dates: '01 Sep - 02 Sep', amount: 12000, status: 'COMPLETED' },
                    ].map((res) => (
                      <tr key={res.id} className="hover:bg-white/[0.01] transition">
                        <td className="px-6 py-4">
                          <span className="font-bold text-white block">{res.guest}</span>
                          <span className="text-[10px] text-white/40 font-mono">Ref: {res.id}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-medium text-white block">{res.service}</span>
                          <span className="text-[11px] text-amber-400">{res.dates}</span>
                        </td>
                        <td className="px-6 py-4">
                          <a href={`tel:${res.phone}`} className="text-amber-400 hover:underline flex items-center gap-1 font-mono">
                            <Phone className="w-3 h-3" />
                            <span>{res.phone}</span>
                          </a>
                        </td>
                        <td className="px-6 py-4 font-bold text-emerald-400">
                          ₹{res.amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <Badge className={`text-[9px] font-bold ${res.status === 'COMPLETED' ? 'bg-white/10 text-white/50' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'}`}>
                            {res.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button
                            variant="ghost"
                            onClick={() => toast.success(`Check-in verified for ${res.guest}`)}
                            className="h-8 px-3 text-[11px] rounded-lg bg-white/5 hover:bg-white/10 text-white font-bold"
                          >
                            Mark Check-In
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: CALENDAR & BLACKOUT DATES */}
        {/* ======================================================== */}
        {dashboardTab === 'calendar' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h3 className="text-xl font-bold text-white">Weather & Blackout Date Control</h3>
              <p className="text-xs text-white/40">Freeze availability during unseasonal snowfall, road repairs or private reservations</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="p-6 rounded-3xl bg-[#0c1217] border border-white/5 space-y-4">
                <h4 className="text-sm font-bold text-white">Block Asset Dates</h4>
                <div>
                  <span className="text-xs text-white/60 block mb-1">Target Asset</span>
                  <Select value={blackoutAssetId} onValueChange={setBlackoutAssetId}>
                    <SelectTrigger className="bg-black/40 border-white/10 text-white rounded-xl h-11 text-xs">
                      <SelectValue placeholder="Choose property / fleet" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#121921] border-white/10 text-white">
                      {listings.map(l => (
                        <SelectItem key={l.id} value={l.id}>{l.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <span className="text-xs text-white/60 block mb-1">Date Range to Freeze</span>
                  <Input
                    placeholder="e.g. 15 Dec 2026 - 20 Dec 2026"
                    value={blackoutDateRange}
                    onChange={(e) => setBlackoutDateRange(e.target.value)}
                    className="bg-black/40 border-white/10 text-white rounded-xl h-11 text-xs"
                  />
                </div>

                <Button
                  onClick={() => {
                    toast.success('Selected dates marked as Blackout. Bookings suspended for this period.');
                    setBlackoutDateRange('');
                  }}
                  className="w-full bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs rounded-xl h-11"
                >
                  Apply Blackout Lock
                </Button>
              </div>

              <div className="lg:col-span-2 p-6 rounded-3xl bg-[#0c1217] border border-white/5">
                <h4 className="text-sm font-bold text-white mb-3">Peak Season Surge Multiplier</h4>
                <p className="text-xs text-white/50 mb-6">
                  Set automated price surges for major tourist events (Tulip Festival, Peak Gulmarg Snow, Amarnath Yatra).
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { season: 'Winter Snow Peak', months: 'Dec - Feb', surge: '1.35x', active: true },
                    { season: 'Tulip Garden Season', months: 'Mar - Apr', surge: '1.25x', active: false },
                    { season: 'Autumn Chinar Foliage', months: 'Oct - Nov', surge: '1.15x', active: false },
                  ].map((s, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col justify-between">
                      <div>
                        <span className="text-xs font-bold text-white block">{s.season}</span>
                        <span className="text-[11px] text-white/40 block mt-0.5">{s.months}</span>
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="font-bold text-amber-400 text-base">{s.surge}</span>
                        <Badge className={`text-[9px] ${s.active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/40'}`}>
                          {s.active ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 5: FINANCIALS & PAYOUTS */}
        {/* ======================================================== */}
        {dashboardTab === 'financials' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-white">Financial Ledger & Settlements</h3>
                <p className="text-xs text-white/40">Direct bank & UPI disbursements with transparent 10% platform commission</p>
              </div>

              <Button
                onClick={() => setIsPayoutOpen(true)}
                className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl h-11 px-5 shadow-lg shadow-emerald-500/20"
              >
                <DollarSign className="w-4 h-4 mr-1" />
                <span>Request Instant Payout</span>
              </Button>
            </div>

            <div className="rounded-3xl bg-[#0c1217] border border-white/5 p-6">
              <h4 className="text-sm font-bold text-white mb-4">Recent Settlements & Transferred Batches</h4>
              <div className="space-y-3">
                {[
                  { ref: 'PAY-1788401', date: '01 Sep 2026', amount: 48500, fee: 4850, gst: 2425, net: 41225, status: 'COMPLETED', method: 'UPI: kashmir.resort@icici' },
                  { ref: 'PAY-1788290', date: '25 Aug 2026', amount: 62000, fee: 6200, gst: 3100, net: 52700, status: 'COMPLETED', method: 'IMPS: J&K Bank A/c 0019' },
                  { ref: 'PAY-1788114', date: '15 Aug 2026', amount: 38000, fee: 3800, gst: 1900, net: 32300, status: 'COMPLETED', method: 'UPI: kashmir.resort@icici' },
                ].map((p, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white">{p.ref}</span>
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[9px]">{p.status}</Badge>
                      </div>
                      <p className="text-white/40 mt-1">{p.date} • Disbursed to {p.method}</p>
                    </div>

                    <div className="flex items-center gap-6 text-right">
                      <div>
                        <span className="text-[10px] uppercase text-white/40 block">Gross GMV</span>
                        <span className="font-bold text-white">₹{p.amount.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-white/40 block">Commission & GST</span>
                        <span className="text-red-400 font-bold">-₹{(p.fee + p.gst).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-emerald-400 font-bold block">Net Disbursed</span>
                        <span className="font-black text-emerald-400 text-sm">₹{p.net.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 6: DISRUPTIONS */}
        {/* ======================================================== */}
        {dashboardTab === 'disruptions' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h3 className="text-xl font-bold text-white">Ground Disruption & Road Warning Reporter</h3>
              <p className="text-xs text-white/40">
                Direct operational broadcast link to Kashmir Connect Central Command & Tourist Safety Desks
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="p-6 rounded-3xl bg-[#0c1217] border border-red-500/20">
                <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span>Submit Live On-Ground Alert</span>
                </h4>

                <form onSubmit={handleReportDisruption} className="space-y-4">
                  <div>
                    <span className="text-xs text-white/60 block mb-1">Affected Corridor / Pass *</span>
                    <Select value={disruptionLocation} onValueChange={setDisruptionLocation}>
                      <SelectTrigger className="bg-black/40 border-white/10 text-white rounded-xl h-11 text-xs">
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#121921] border-white/10 text-white">
                        {KASHMIR_LOCATIONS.map(loc => (
                          <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <span className="text-xs text-white/60 block mb-1">Transit Condition *</span>
                    <Select value={disruptionCondition} onValueChange={setDisruptionCondition}>
                      <SelectTrigger className="bg-black/40 border-white/10 text-white rounded-xl h-11 text-xs">
                        <SelectValue placeholder="Condition" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#121921] border-white/10 text-white">
                        <SelectItem value="Caution">Caution - Slow Moving / Snow Chains Required</SelectItem>
                        <SelectItem value="Closed">Closed - Traffic Halted / Avalanche Clearing</SelectItem>
                        <SelectItem value="Open">Clear & Open - Normal Transit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <span className="text-xs text-white/60 block mb-1">Ground Observations & Guidance *</span>
                    <Textarea
                      required
                      placeholder="e.g. Unseasonal snow on Zojila Pass. BRO bulldozers actively clearing. Light vehicles diverted towards Doodhpathri..."
                      value={disruptionMessage}
                      onChange={(e) => setDisruptionMessage(e.target.value)}
                      className="bg-black/40 border-white/10 rounded-xl text-white text-xs min-h-[90px]"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isReportingDisruption}
                    className="w-full bg-red-500 hover:bg-red-600 text-white font-black uppercase text-xs tracking-wider h-11 rounded-xl shadow-lg shadow-red-500/20"
                  >
                    {isReportingDisruption ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Broadcast Alert to Command'}
                  </Button>
                </form>
              </div>

              <div className="lg:col-span-2 p-6 rounded-3xl bg-[#0c1217] border border-white/5">
                <h4 className="text-sm font-bold text-white mb-4">How Kashmir Connect Disruption Protocols Protect You</h4>
                <div className="space-y-4 text-xs text-white/60 leading-relaxed">
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                    <h5 className="font-bold text-amber-400 text-sm mb-1">1. Zero Cancellation Penalties on Weather Closures</h5>
                    <p>When you or the district administration report a corridor closure, impacted tourists are automatically offered alternative nearby destinations with zero penalty to your property or fleet.</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                    <h5 className="font-bold text-amber-400 text-sm mb-1">2. 100% Kashmir Flex Disruption Credits</h5>
                    <p>Instead of contentious refund disputes, customers are instantly issued Kashmir Flex platform credits while partner operators receive guaranteed compensation for prepared logistics.</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                    <h5 className="font-bold text-amber-400 text-sm mb-1">3. Automated Tourist Safety Cards</h5>
                    <p>Your allocated driver contacts and hotel SOS desk numbers are automatically synchronized to the traveler's offline-ready Trip Safety Card for emergency coordination.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 7: KYC & BUSINESS SETTINGS */}
        {/* ======================================================== */}
        {dashboardTab === 'kyc' && (
          <div className="space-y-6 animate-in fade-in duration-300 max-w-2xl">
            <div>
              <h3 className="text-xl font-bold text-white">Business Profile & Verification</h3>
              <p className="text-xs text-white/40">Official operator registration, banking details and emergency contacts</p>
            </div>

            <div className="p-6 rounded-3xl bg-[#0c1217] border border-white/5 space-y-4 text-xs">
              <div>
                <span className="text-white/60 block mb-1">Trade Legal Name</span>
                <Input value={user?.name || 'Kashmir Partner'} readOnly className="bg-black/40 border-white/10 text-white rounded-xl h-11 text-xs" />
              </div>

              <div>
                <span className="text-white/60 block mb-1">Contact Phone</span>
                <Input value={user?.phone || '+91 94190 12345'} readOnly className="bg-black/40 border-white/10 text-white rounded-xl h-11 text-xs" />
              </div>

              <div>
                <span className="text-white/60 block mb-1">Settlement Bank Account / UPI ID</span>
                <Input defaultValue="kashmir.resort@icici" className="bg-black/40 border-white/10 text-white rounded-xl h-11 text-xs" />
              </div>

              <div>
                <span className="text-white/60 block mb-1">Department of Tourism Certificate / Trade License</span>
                <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="font-bold">JK-TOURS-REG-2024-9122 (Verified)</span>
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-400">ACTIVE</Badge>
                </div>
              </div>

              <Button onClick={() => toast.success('Profile credentials updated.')} className="bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs h-11 rounded-xl w-full mt-4">
                Save Changes
              </Button>
            </div>
          </div>
        )}

      </div>

      {/* MODAL: ADD NEW ASSET */}
      <Dialog open={isAddListingOpen} onOpenChange={setIsAddListingOpen}>
        <DialogContent className="rounded-3xl bg-[#0c1217] text-white border-white/10 p-6 md:p-8 max-w-lg shadow-2xl">
          <DialogHeader className="text-left border-b border-white/5 pb-4">
            <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-amber-400" />
              <span>Publish New Asset to Marketplace</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateListing} className="space-y-4 py-4 text-xs">
            <div>
              <span className="text-white/60 block mb-1">Asset Title *</span>
              <Input
                required
                placeholder="e.g. Deluxe Himalayan Pine Chalet"
                value={newListing.title}
                onChange={(e) => setNewListing({ ...newListing, title: e.target.value })}
                className="bg-black/40 border-white/10 rounded-xl h-11 text-white text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-white/60 block mb-1">Category *</span>
                <Select
                  value={newListing.category}
                  onValueChange={(val) => setNewListing({ ...newListing, category: val })}
                >
                  <SelectTrigger className="bg-black/40 border-white/10 rounded-xl h-11 text-white text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#121921] border-white/10 text-white">
                    {VENDOR_CATEGORIES.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <span className="text-white/60 block mb-1">Location *</span>
                <Select
                  value={newListing.location}
                  onValueChange={(val) => setNewListing({ ...newListing, location: val })}
                >
                  <SelectTrigger className="bg-black/40 border-white/10 rounded-xl h-11 text-white text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#121921] border-white/10 text-white">
                    {KASHMIR_LOCATIONS.map(loc => (
                      <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-white/60 block mb-1">Base Price / Night (₹) *</span>
                <Input
                  required
                  type="number"
                  placeholder="e.g. 6500"
                  value={newListing.basePrice}
                  onChange={(e) => setNewListing({ ...newListing, basePrice: e.target.value })}
                  className="bg-black/40 border-white/10 rounded-xl h-11 text-white text-xs"
                />
              </div>

              <div>
                <span className="text-white/60 block mb-1">Available Units</span>
                <Input
                  type="number"
                  value={newListing.inventoryCount}
                  onChange={(e) => setNewListing({ ...newListing, inventoryCount: e.target.value })}
                  className="bg-black/40 border-white/10 rounded-xl h-11 text-white text-xs"
                />
              </div>
            </div>

            <div>
              <span className="text-white/60 block mb-1">Amenities / Inclusions (Comma separated)</span>
              <Input
                value={newListing.amenities}
                onChange={(e) => setNewListing({ ...newListing, amenities: e.target.value })}
                className="bg-black/40 border-white/10 rounded-xl h-11 text-white text-xs"
              />
            </div>

            <div>
              <span className="text-white/60 block mb-1">Short Description</span>
              <Textarea
                placeholder="Describe views, cedar wood aroma, 4x4 capability or specialized itinerary..."
                value={newListing.description}
                onChange={(e) => setNewListing({ ...newListing, description: e.target.value })}
                className="bg-black/40 border-white/10 rounded-xl text-white text-xs min-h-[70px]"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="submit"
                disabled={isSubmittingListing}
                className="w-full bg-amber-400 hover:bg-amber-300 text-black font-black uppercase tracking-wider text-xs h-11 rounded-xl shadow-lg shadow-amber-400/20"
              >
                {isSubmittingListing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Publish Asset to Live Marketplace'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: REQUEST INSTANT PAYOUT */}
      <Dialog open={isPayoutOpen} onOpenChange={setIsPayoutOpen}>
        <DialogContent className="rounded-3xl bg-[#0c1217] text-white border-white/10 p-6 max-w-sm shadow-2xl">
          <DialogHeader className="text-left border-b border-white/5 pb-3">
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              <span>Request Vendor Payout</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleRequestPayout} className="space-y-4 py-4 text-xs">
            <div>
              <span className="text-white/60 block mb-1">Withdrawal Amount (₹)</span>
              <Input
                required
                type="number"
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
                className="bg-black/40 border-white/10 rounded-xl h-11 text-white text-xs font-bold"
              />
              <span className="text-[10px] text-white/40 mt-1 block">
                Available balance: ₹{(stats?.settlementBalance || 42000).toLocaleString()}
              </span>
            </div>

            <div>
              <span className="text-white/60 block mb-1">Disbursement UPI ID or Account</span>
              <Input
                required
                value={payoutUpi}
                onChange={(e) => setPayoutUpi(e.target.value)}
                className="bg-black/40 border-white/10 rounded-xl h-11 text-white text-xs"
              />
            </div>

            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-white/50">
              Disbursements process via automated IMPS/UPI gateway within 2 to 4 business hours.
            </div>

            <Button
              type="submit"
              disabled={isRequestingPayout}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs h-11 rounded-xl"
            >
              {isRequestingPayout ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Instant Transfer'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
