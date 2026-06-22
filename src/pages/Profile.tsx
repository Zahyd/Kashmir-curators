import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, Package, Building, Car, Calendar, Clock, MapPin, AlertCircle, 
  Loader2, Compass, LayoutDashboard, CreditCard, Settings, LogOut, 
  Ticket, Sparkles, Map, CloudSun, Phone, MessageSquare, Download, 
  FileText, Crown, Gift, ExternalLink, ShieldCheck, Star, Send, 
  Paperclip, UserCheck, Check, Copy, ChevronRight, Share2, Plane
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { API_BASE_URL } from '@/lib/api';

const statusColors = {
  confirmed: 'bg-green-500/10 text-green-400 border-green-500/20',
  pending: 'bg-kashmir-gold/10 text-kashmir-gold border-kashmir-gold/20',
  cancelled: 'bg-destructive/10 text-destructive border-destructive/20',
  completed: 'bg-muted text-muted-foreground border-muted-foreground/20',
};

const typeIcons = {
  package: Package,
  hotel: Building,
  cab: Car,
};

type TabId = 'overview' | 'trips' | 'itineraries' | 'payments' | 'support' | 'rewards' | 'settings';

interface ChatMessage {
  sender: 'user' | 'concierge';
  text: string;
  time: string;
}

const KASHMIR_LOCATIONS = [
  {
    id: 'srinagar',
    name: 'Srinagar',
    temp: 18.2,
    condition: 'Sunny',
    status: 'Open',
    message: 'Mughal Gardens and Nigeen/Dal Lake shikara tours operating fully without restrictions.',
    subText: 'Water level normal. Shikara rides running till 9 PM.'
  },
  {
    id: 'gulmarg',
    name: 'Gulmarg',
    temp: 11.5,
    condition: 'Mist / Clear Skies',
    status: 'Open',
    message: 'Gulmarg Gondola Phase 1 & 2 fully operational. Road conditions are clear, standard access active.',
    subText: 'No snowfall expected today. Light winds.'
  },
  {
    id: 'pahalgam',
    name: 'Pahalgam',
    temp: 14.0,
    condition: 'Partly Cloudy',
    status: 'Open',
    message: 'Lidder river rafting and Betaab/Aru Valley routes are fully open. Perfect clear skies for private mountain picnics.',
    subText: 'Pony rentals available. Roads fully clear.'
  },
  {
    id: 'sonamarg',
    name: 'Sonamarg',
    temp: 9.8,
    condition: 'Light Rain',
    status: 'Caution',
    message: 'Zojila pass routes clear. High-altitude trails open but expect damp paths. Secure with guided group excursions.',
    subText: 'Carry raincoats. Evening temperature drops to 4°C.'
  }
];

export default function Profile() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, bookings, inquiries, cancelBooking, logout, sendSupportRequest } = useAuth();
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [conciergeMsg, setConciergeMsg] = useState('');
  const [selectedLoc, setSelectedLoc] = useState('srinagar');
  
  // Profile editing
  const [editName, setEditName] = useState(user?.name || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Chat simulator state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      sender: 'concierge',
      text: 'Greetings from Kashmir Curators Concierge. I am Faheem, your dedicated Travel Curator. How can I assist you with your upcoming journey today?',
      time: '10:00 AM'
    }
  ]);
  const [isConciergeTyping, setIsConciergeTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Slips/Vouchers display
  const [activeSlip, setActiveSlip] = useState<{ type: 'hotel' | 'flight' | 'cab', booking: any } | null>(null);
  const [claimedVouchers, setClaimedVouchers] = useState<Record<string, string>>({});
  const [viewingVoucher, setViewingVoucher] = useState<{ id: string, name: string, code: string } | null>(null);

  // Notification Preferences
  const [notifyWhatsApp, setNotifyWhatsApp] = useState(true);
  const [notifySMS, setNotifySMS] = useState(true);
  const [notifyBiometrics, setNotifyBiometrics] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/auth?redirect=/profile');
    }
  }, [isAuthenticated, isLoading, navigate]);

  useEffect(() => {
    if (user) {
      setEditName(user.name);
      setEditPhone(user.phone || '');
    }
  }, [user]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isConciergeTyping]);

  const activeBookings = bookings.filter(b => b.status === 'confirmed' || b.status === 'pending');
  const pastBookings = bookings.filter(b => b.status === 'completed' || b.status === 'cancelled');
  
  const totalSpend = bookings.reduce((sum, b) => b.status !== 'cancelled' ? sum + b.totalAmount : sum, 0);
  const totalTrips = bookings.filter(b => b.status !== 'cancelled').length;
  const loyaltyPoints = totalTrips * 150 + Math.floor(totalSpend / 1000);
  const membershipLevel = totalSpend > 500000 ? 'Platinum' : totalSpend > 100000 ? 'Elite' : 'Explorer';

  // Gamified progression
  let nextTier = 'Elite';
  let tierProgress = 0;
  let spendNeeded = 100000;
  if (membershipLevel === 'Explorer') {
    tierProgress = Math.min((totalSpend / 100000) * 100, 100);
    spendNeeded = 100000 - totalSpend;
    nextTier = 'Elite';
  } else if (membershipLevel === 'Elite') {
    tierProgress = Math.min(((totalSpend - 100000) / 400000) * 100, 100);
    spendNeeded = 500000 - totalSpend;
    nextTier = 'Platinum';
  } else {
    tierProgress = 100;
    spendNeeded = 0;
    nextTier = 'Maxed';
  }

  if (isLoading || !isAuthenticated) {
    return null;
  }

  const handleCancel = async (bookingId: string) => {
    setCancellingId(bookingId);
    await cancelBooking(bookingId);
    setCancellingId(null);
    toast.success('Booking cancelled successfully');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Profile Save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    // Simulate API update
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSavingProfile(false);
    toast.success('Profile details updated successfully!');
  };

  // Concierge Chat Submit
  const handleSendChatMessage = (textToSend: string) => {
    if (!textToSend.trim()) return;
    
    const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      sender: 'user',
      text: textToSend,
      time: now
    };

    setChatMessages(prev => [...prev, userMsg]);
    setConciergeMsg('');
    sendSupportRequest(textToSend); // Pass to actual backend context if connected

    // Trigger simulated curator reply
    setIsConciergeTyping(true);
    setTimeout(() => {
      setIsConciergeTyping(false);
      
      let replyText = "Thank you for sharing this request. I am looking into this right away with our local ground operations team and will update you shortly via SMS and WhatsApp. Rest assured, we've got you covered!";
      const q = textToSend.toLowerCase();
      if (q.includes('shikara') || q.includes('dinner')) {
        replyText = "Excellent choice! I am coordinating a private sunset shikara dinner for you on Dal Lake. We will arrange a candle-lit layout with premium Kashmiri wazwan. I will confirm the time and boat details shortly.";
      } else if (q.includes('checkout') || q.includes('late')) {
        replyText = "Certainly! I have contacted the hotel manager regarding your request for a late checkout. I will try to extend it to 2 PM free of charge and update you in a few minutes.";
      } else if (q.includes('guide') || q.includes('private')) {
        replyText = "Understood. I will assign a certified private local guide fluent in English and Hindi who specializes in Kashmir's history, local folklore, and photography hotspots. Let me fetch their profile for you.";
      } else if (q.includes('cab') || q.includes('driver')) {
        replyText = "Your chauffeur vehicle is already mapped. I've sent a ping to Toyota Innova Crysta driver Hilal Ahmad (+91 91037 98448) to confirm his exact arrival time at your pickup location.";
      }

      setChatMessages(prev => [...prev, {
        sender: 'concierge',
        text: replyText,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 2000);
  };

  // Claim loyalty voucher
  const handleClaimVoucher = (voucherId: string, voucherName: string) => {
    if (claimedVouchers[voucherId]) {
      // Already claimed, view code
      setViewingVoucher({
        id: voucherId,
        name: voucherName,
        code: claimedVouchers[voucherId]
      });
      return;
    }

    const uniqueCode = `${voucherId.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    setClaimedVouchers(prev => ({
      ...prev,
      [voucherId]: uniqueCode
    }));

    setViewingVoucher({
      id: voucherId,
      name: voucherName,
      code: uniqueCode
    });
    toast.success(`${voucherName} claimed successfully!`);
  };

  const activeAdvisory = KASHMIR_LOCATIONS.find(loc => loc.id === selectedLoc) || KASHMIR_LOCATIONS[0];

  return (
    <div className="min-h-screen bg-[#05080a] text-white flex flex-col font-sans selection:bg-kashmir-gold/30 selection:text-white">
      {/* Inline styles for custom premium elements */}
      <style>{`
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes rotate-slow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-rotate-slow {
          animation: rotate-slow 20s linear infinite;
        }
      `}</style>

      <Navbar />

      <main className="flex-1 pb-20">
        
        {/* Cinematic Premium Hero Header */}
        <div className="relative pt-32 pb-24 lg:pt-40 lg:pb-36 overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center transition-all duration-1000" 
            style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&q=80")' }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-[#05080a] via-[#05080a]/85 to-transparent" />
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
          </div>
          
          <div className="container mx-auto px-4 relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8 animate-fade-up">
            <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
              
              {/* Pulsing Glowing Avatar */}
              <div className="relative group shrink-0">
                <div className="absolute -inset-1.5 bg-gradient-to-r from-kashmir-gold via-amber-400 to-kashmir-gold rounded-full opacity-60 blur-md group-hover:opacity-100 transition-all duration-700 animate-pulse" />
                <div className="absolute inset-0 rounded-full border border-kashmir-gold/50 animate-rotate-slow hidden md:block" />
                <div className="w-24 h-24 md:w-28 md:h-28 bg-[#0a0f12]/90 rounded-full flex items-center justify-center text-4xl md:text-5xl font-display font-black text-kashmir-gold border border-kashmir-gold/30 backdrop-blur-md shadow-2xl relative z-10">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              </div>

              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 bg-kashmir-gold/10 text-kashmir-gold px-3.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase backdrop-blur-md border border-kashmir-gold/30 shadow-[0_0_15px_rgba(212,175,55,0.1)]">
                  <Crown className="w-3.5 h-3.5 animate-pulse" /> {membershipLevel} Tier
                </div>
                <h1 className="font-display text-3xl md:text-5xl font-extrabold text-white tracking-tight">
                  Welcome back, {user?.name?.split(' ')[0]}
                </h1>
                <p className="text-white/50 text-sm md:text-base flex flex-wrap items-center justify-center md:justify-start gap-2">
                  <span>{user?.email}</span>
                  {user?.phone && (
                    <>
                      <span className="text-white/20">•</span>
                      <span>{user.phone}</span>
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Loyalty Progression Tracker Card */}
            <div className="w-full lg:w-[26rem] bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-6 relative overflow-hidden shrink-0 shadow-2xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-kashmir-gold/5 rounded-full blur-2xl pointer-events-none" />
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-black uppercase text-white/40 tracking-wider">Loyalty Tracker</span>
                {nextTier !== 'Maxed' ? (
                  <span className="text-[10px] font-extrabold text-kashmir-gold uppercase tracking-widest">
                    {tierProgress.toFixed(0)}% to {nextTier}
                  </span>
                ) : (
                  <span className="text-[10px] font-extrabold text-kashmir-gold uppercase tracking-widest flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5" /> Max Tier Achieved
                  </span>
                )}
              </div>
              
              {/* Progress Bar */}
              <div className="w-full h-2.5 bg-black/40 rounded-full overflow-hidden mb-3.5 border border-white/5 shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-kashmir-gold via-amber-400 to-amber-600 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(212,175,55,0.4)]"
                  style={{ width: `${tierProgress}%` }}
                />
              </div>

              <div className="flex justify-between text-xs text-white/50">
                <span>{loyaltyPoints.toLocaleString()} Points</span>
                {nextTier !== 'Maxed' && (
                  <span>Spend ₹{spendNeeded.toLocaleString()} to upgrade</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Grid Container */}
        <div className="container mx-auto px-4 -mt-8 relative z-20">
          <div className="flex flex-col lg:flex-row gap-8">
            
            {/* Desktop Navigation Sidebar (visible on lg screens) */}
            <div className="hidden lg:block lg:w-72 shrink-0">
              <div className="bg-[#0c1216]/80 backdrop-blur-2xl rounded-3xl p-5 shadow-2xl border border-white/10 sticky top-28 space-y-4">
                <p className="text-[10px] font-black text-white/30 uppercase tracking-widest pl-3">Workspace</p>
                <div className="flex flex-col gap-1">
                  <SidebarButton icon={LayoutDashboard} label="Dashboard Home" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
                  <SidebarButton icon={Package} label="My Bookings" active={activeTab === 'trips'} onClick={() => setActiveTab('trips')} badge={activeBookings.length} />
                  <SidebarButton icon={Compass} label="Custom Proposals" active={activeTab === 'itineraries'} onClick={() => setActiveTab('itineraries')} />
                  <SidebarButton icon={CreditCard} label="Payments & Invoices" active={activeTab === 'payments'} onClick={() => setActiveTab('payments')} />
                  <SidebarButton icon={MessageSquare} label="Luxury Concierge" active={activeTab === 'support'} onClick={() => setActiveTab('support')} />
                  <SidebarButton icon={Gift} label="Elite Rewards" active={activeTab === 'rewards'} onClick={() => setActiveTab('rewards')} className="text-kashmir-gold" />
                  
                  <div className="border-t border-white/5 my-4 mx-2" />
                  
                  <SidebarButton icon={Settings} label="Account Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
                  <SidebarButton icon={LogOut} label="Sign Out" active={false} onClick={handleLogout} className="text-red-400 hover:bg-red-500/10 hover:text-red-300" />
                </div>
              </div>
            </div>

            {/* Mobile Navigation Strip (Visible on mobile/tablet) */}
            <div className="lg:hidden sticky top-20 z-40 -mx-4 px-4 py-3 bg-[#05080a]/90 backdrop-blur-xl border-b border-white/10 overflow-x-auto flex gap-2 scrollbar-none snap-x">
              <MobileTabButton icon={LayoutDashboard} label="Home" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
              <MobileTabButton icon={Package} label="Bookings" active={activeTab === 'trips'} onClick={() => setActiveTab('trips')} badge={activeBookings.length} />
              <MobileTabButton icon={Compass} label="Proposals" active={activeTab === 'itineraries'} onClick={() => setActiveTab('itineraries')} />
              <MobileTabButton icon={CreditCard} label="Payments" active={activeTab === 'payments'} onClick={() => setActiveTab('payments')} />
              <MobileTabButton icon={MessageSquare} label="Concierge" active={activeTab === 'support'} onClick={() => setActiveTab('support')} />
              <MobileTabButton icon={Gift} label="Rewards" active={activeTab === 'rewards'} onClick={() => setActiveTab('rewards')} className="text-kashmir-gold" />
              <MobileTabButton icon={Settings} label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 min-w-0">
              
              {/* 1. OVERVIEW TAB */}
              {activeTab === 'overview' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  
                  {/* Weather & Live Advisory Desk */}
                  <div className="bg-gradient-to-br from-[#0a0f12] via-[#0f171e] to-[#0a0f12] border border-white/10 rounded-3xl p-6 md:p-8 flex flex-col lg:flex-row items-stretch justify-between gap-8 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-kashmir-gold/5 rounded-full blur-3xl pointer-events-none group-hover:bg-kashmir-gold/10 transition-all duration-700" />
                    
                    {/* Left: Weather Display & Location Selector */}
                    <div className="flex flex-col gap-6 lg:border-r border-white/5 lg:pr-8 lg:w-80 shrink-0">
                      <div>
                        <p className="text-[10px] font-black uppercase text-kashmir-gold tracking-widest mb-3">Clearance Hub</p>
                        {/* Selector Tabs */}
                        <div className="grid grid-cols-4 gap-1.5 p-1 bg-black/40 rounded-xl border border-white/5 mb-4">
                          {KASHMIR_LOCATIONS.map(loc => (
                            <button
                              key={loc.id}
                              type="button"
                              onClick={() => setSelectedLoc(loc.id)}
                              className={cn(
                                "py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all duration-300",
                                selectedLoc === loc.id
                                  ? "bg-kashmir-gold text-black shadow-lg"
                                  : "text-white/55 hover:text-white hover:bg-white/5"
                              )}
                            >
                              {loc.name.substring(0, 4)}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-5 mt-1">
                        <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-full flex items-center justify-center backdrop-blur-md shrink-0 shadow-inner">
                          <CloudSun className="w-8 h-8 text-yellow-300 animate-pulse" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase text-white/40 tracking-wider mb-0.5">Live from {activeAdvisory.name}</p>
                          <h3 className="text-3xl font-display font-bold text-white tracking-tight">{activeAdvisory.temp.toFixed(1)}°C</h3>
                          <p className="text-xs text-white/50 mt-0.5">{activeAdvisory.condition}</p>
                        </div>
                      </div>
                    </div>

                    {/* Right: Dynamic Advisories Desk */}
                    <div className="flex-1 flex flex-col justify-between space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 text-kashmir-gold">
                          <ShieldCheck className="w-5 h-5 animate-pulse" />
                          <span className="text-[10px] font-black uppercase tracking-wider">Live Hotspot Clearance Desk</span>
                        </div>
                        <Badge className={cn("font-bold text-[9px] uppercase px-2 py-0.5 tracking-wider shadow-sm",
                          activeAdvisory.status === 'Open' ? 'bg-green-500/20 text-green-400 border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.1)]' :
                          activeAdvisory.status === 'Caution' ? 'bg-kashmir-gold/20 text-kashmir-gold border-kashmir-gold/20' :
                          'bg-red-500/20 text-red-400 border-red-500/20'
                        )}>
                          {activeAdvisory.status}
                        </Badge>
                      </div>
                      
                      <div className="bg-black/35 border border-white/5 rounded-2xl p-5 text-left flex-1 flex flex-col justify-center">
                        <h4 className="text-sm font-bold text-white mb-2">{activeAdvisory.name} Operations Advisory</h4>
                        <p className="text-xs text-white/70 leading-relaxed">{activeAdvisory.message}</p>
                        <p className="text-[10px] text-white/40 font-medium italic mt-2.5 border-t border-white/5 pt-2">{activeAdvisory.subText}</p>
                      </div>
                    </div>
                  </div>

                  {/* Explore & Book Grid */}
                  <div>
                    <h2 className="font-display text-2xl font-bold mb-6 flex items-center gap-3">
                      <Sparkles className="w-5 h-5 text-kashmir-gold" /> Explore & Book
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* AI Planner Card */}
                      <div 
                        onClick={() => navigate('/planner')}
                        className="group relative overflow-hidden bg-gradient-to-br from-[#0c1216] via-[#0c1216] to-[#0a0f12] border border-kashmir-gold/30 p-8 rounded-3xl cursor-pointer hover:shadow-[0_0_30px_rgba(212,175,55,0.15)] hover:border-kashmir-gold/60 transition-all duration-500 flex flex-col justify-between min-h-[220px]"
                      >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-kashmir-gold/5 rounded-full blur-3xl group-hover:bg-kashmir-gold/15 transition-all" />
                        <div className="bg-gradient-to-br from-amber-400 to-kashmir-gold text-black w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-105 transition-transform duration-500 relative z-10">
                          <Sparkles className="w-6 h-6 animate-pulse" />
                        </div>
                        <div className="relative z-10 text-left">
                          <h3 className="text-xl font-display font-bold text-white mb-2 group-hover:text-kashmir-gold transition-colors">Bespoke Planner</h3>
                          <p className="text-white/50 text-sm">Submit your preferences to architect a fully personalized luxury trip.</p>
                        </div>
                      </div>

                      {/* Packages Card */}
                      <div 
                        onClick={() => navigate('/packages')}
                        className="group relative overflow-hidden bg-[#0c1216]/65 backdrop-blur-xl border border-white/10 p-8 rounded-3xl cursor-pointer hover:bg-white/5 hover:border-white/20 transition-all duration-500 flex flex-col justify-between min-h-[220px]"
                      >
                        <div className="bg-white/5 border border-white/5 text-white/70 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-500 shadow-inner">
                          <Map className="w-6 h-6 text-kashmir-gold" />
                        </div>
                        <div className="text-left">
                          <h3 className="text-xl font-display font-bold text-white mb-2 group-hover:text-kashmir-gold transition-colors">Curated Retreats</h3>
                          <p className="text-white/50 text-sm">Browse elite pre-arranged packages tailored for profound exploration.</p>
                        </div>
                      </div>

                      {/* Hotels Card */}
                      <div 
                        onClick={() => navigate('/hotels')}
                        className="group relative overflow-hidden bg-[#0c1216]/65 backdrop-blur-xl border border-white/10 p-8 rounded-3xl cursor-pointer hover:bg-white/5 hover:border-white/20 transition-all duration-500 flex flex-col justify-between min-h-[220px]"
                      >
                        <div className="bg-white/5 border border-white/5 text-white/70 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-500 shadow-inner">
                          <Building className="w-6 h-6 text-kashmir-gold" />
                        </div>
                        <div className="text-left">
                          <h3 className="text-xl font-display font-bold text-white mb-2 group-hover:text-kashmir-gold transition-colors">Luxury Estates</h3>
                          <p className="text-white/50 text-sm">Secure reservations at premium 5-star mountain lodges and houseboats.</p>
                        </div>
                      </div>

                      {/* Cabs Card */}
                      <div 
                        onClick={() => navigate('/cabs')}
                        className="group relative overflow-hidden bg-[#0c1216]/65 backdrop-blur-xl border border-white/10 p-8 rounded-3xl cursor-pointer hover:bg-white/5 hover:border-white/20 transition-all duration-500 flex flex-col justify-between min-h-[220px]"
                      >
                        <div className="bg-white/5 border border-white/5 text-white/70 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-500 shadow-inner">
                          <Car className="w-6 h-6 text-kashmir-gold" />
                        </div>
                        <div className="text-left">
                          <h3 className="text-xl font-display font-bold text-white mb-2 group-hover:text-kashmir-gold transition-colors">Elite Fleet</h3>
                          <p className="text-white/50 text-sm">Rent luxury SUVs with professional local drivers for comfortable transits.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {activeBookings.length > 0 && (
                    <div className="pt-4">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="font-display text-2xl font-bold">Upcoming Trips</h3>
                        <Button variant="ghost" onClick={() => setActiveTab('trips')} className="text-kashmir-gold hover:text-kashmir-gold hover:bg-kashmir-gold/10">View All</Button>
                      </div>
                      <div className="grid gap-6">
                        {activeBookings.slice(0, 2).map((booking) => (
                          <BookingTicket key={booking.id} booking={booking} onCancel={handleCancel} cancellingId={cancellingId} onShowSlip={setActiveSlip} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 2. TRIPS TAB */}
              {activeTab === 'trips' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-3xl font-bold">My Bookings</h2>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white/[0.02] backdrop-blur-xl p-6 rounded-3xl border border-white/10 flex flex-col items-center justify-center text-center">
                      <h4 className="text-4xl font-display font-bold text-kashmir-gold mb-1">{activeBookings.length}</h4>
                      <p className="text-xs font-semibold text-white/45 uppercase tracking-wider">Active</p>
                    </div>
                    <div className="bg-white/[0.02] backdrop-blur-xl p-6 rounded-3xl border border-white/10 flex flex-col items-center justify-center text-center">
                      <h4 className="text-4xl font-display font-bold text-white mb-1">{pastBookings.length}</h4>
                      <p className="text-xs font-semibold text-white/45 uppercase tracking-wider">Past Trips</p>
                    </div>
                  </div>

                  {activeBookings.length === 0 && pastBookings.length === 0 ? (
                    <div className="bg-[#0c1216]/50 border border-dashed border-white/15 p-12 rounded-3xl text-center backdrop-blur-sm">
                      <Ticket className="w-16 h-16 text-white/20 mx-auto mb-6" />
                      <h3 className="text-2xl font-bold mb-2">No bookings yet</h3>
                      <p className="text-white/50 mb-8 max-w-sm mx-auto">
                        Your luxury Kashmir experience awaits. Browse our packages or use the AI planner to get started.
                      </p>
                      <Button variant="gold" size="lg" onClick={() => navigate('/packages')}>Explore Packages</Button>
                    </div>
                  ) : (
                    <div className="space-y-12">
                      {activeBookings.length > 0 && (
                        <div className="space-y-4">
                          <h3 className="text-lg font-bold text-white/80 text-left pl-1">Active & Upcoming</h3>
                          <div className="grid gap-6">
                            {activeBookings.map((booking) => (
                              <BookingTicket key={booking.id} booking={booking} onCancel={handleCancel} cancellingId={cancellingId} onShowSlip={setActiveSlip} />
                            ))}
                          </div>
                        </div>
                      )}
                      {pastBookings.length > 0 && (
                        <div className="space-y-4">
                          <h3 className="text-lg font-bold text-white/55 text-left pl-1">Past History</h3>
                          <div className="grid gap-6 opacity-60 hover:opacity-100 transition-opacity duration-300">
                            {pastBookings.map((booking) => (
                              <BookingTicket key={booking.id} booking={booking} onCancel={handleCancel} cancellingId={cancellingId} onShowSlip={setActiveSlip} />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 3. CUSTOM PROPOSALS TAB */}
              {activeTab === 'itineraries' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-3xl font-bold">Custom Proposals</h2>
                    <Button variant="gold" onClick={() => navigate('/planner')} className="font-bold text-black shadow-lg shadow-kashmir-gold/15">
                      <Sparkles className="w-4 h-4 mr-2" /> Request New
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                    {inquiries.length === 0 ? (
                      <div className="col-span-full bg-[#0c1216]/50 border border-dashed border-white/15 p-12 rounded-3xl text-center">
                        <Compass className="w-12 h-12 text-white/20 mx-auto mb-4" />
                        <p className="text-white/40">No custom proposals requested yet.</p>
                        <Button variant="link" onClick={() => navigate('/planner')} className="text-kashmir-gold mt-2 font-bold">Start Planning Now</Button>
                      </div>
                    ) : (
                      inquiries.map((prop) => (
                        <div key={prop.id} className="bg-[#0c1216]/70 backdrop-blur-xl border border-white/10 p-6 rounded-3xl hover:border-kashmir-gold/30 hover:shadow-2xl transition-all duration-300 relative overflow-hidden group">
                          
                          <div className="flex justify-between items-start mb-4 relative z-10">
                            <Badge variant="outline" className="bg-white/5 text-white/80 border-white/10 font-mono">#{prop.id.slice(-4).toUpperCase()}</Badge>
                            <Badge className={cn("font-bold uppercase tracking-wider text-[9px] px-2 py-0.5", 
                              prop.status === 'Ready for Review' ? "bg-green-500/20 text-green-400 border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]" : 
                              prop.status === 'New' ? "bg-blue-500/20 text-blue-400 border-blue-500/20" :
                              "bg-kashmir-gold/20 text-kashmir-gold border-kashmir-gold/20"
                            )}>
                              {prop.status}
                            </Badge>
                          </div>
                          
                          <h3 className="text-xl font-display font-bold mb-2 text-left group-hover:text-kashmir-gold transition-colors">{prop.duration} Days in {prop.destination}</h3>
                          <p className="text-white/60 text-sm mb-6 flex items-center gap-2 text-left">
                            <MapPin className="w-4 h-4 text-kashmir-gold" /> 
                            {prop.destination.charAt(0).toUpperCase() + prop.destination.slice(1)}
                          </p>
                          
                          <div className="flex items-center justify-between pt-4 border-t border-white/5 relative z-10">
                            <span className="text-[10px] text-white/40 font-semibold uppercase tracking-wider">Requested {new Date(prop.createdAt).toLocaleDateString()}</span>
                            
                            {prop.proposalUrl ? (
                              <Button 
                                variant="gold" 
                                size="sm" 
                                onClick={() => window.open(prop.proposalUrl, '_blank')}
                                className="rounded-lg shadow-[0_0_15px_rgba(212,175,55,0.2)] text-black font-bold h-9"
                              >
                                <Download className="w-4 h-4 mr-2" /> View Proposal
                              </Button>
                            ) : (
                              <Button variant="outline" size="sm" disabled className="bg-white/5 border-white/5 text-white/30 rounded-lg h-9">
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> {prop.status === 'New' ? 'Waitlist' : 'Architecting...'}
                              </Button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* 4. PAYMENTS & INVOICES TAB */}
              {activeTab === 'payments' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h2 className="font-display text-3xl font-bold mb-6 text-left">Payments & Invoices</h2>
                  
                  <div className="bg-[#0c1216]/65 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-white/5 border-b border-white/10">
                            <th className="p-5 text-xs font-bold text-white/50 tracking-widest uppercase">Date</th>
                            <th className="p-5 text-xs font-bold text-white/50 tracking-widest uppercase">Description</th>
                            <th className="p-5 text-xs font-bold text-white/50 tracking-widest uppercase">Amount</th>
                            <th className="p-5 text-xs font-bold text-white/50 tracking-widest uppercase">Status</th>
                            <th className="p-5 text-xs font-bold text-white/50 tracking-widest uppercase text-right">Invoice</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {bookings.map(b => (
                            <tr key={b.id} className="hover:bg-white/5 transition-colors">
                              <td className="p-5 text-sm text-white/70">
                                {new Date(b.createdAt).toLocaleDateString()}
                              </td>
                              <td className="p-5 font-semibold text-white text-left">{b.itemName}</td>
                              <td className="p-5 font-black text-kashmir-gold">₹{b.totalAmount.toLocaleString()}</td>
                              <td className="p-5">
                                <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider", 
                                  b.status === 'confirmed' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 
                                  b.status === 'cancelled' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-white/10 text-white/60 border border-white/5'
                                )}>
                                  {b.status === 'cancelled' ? 'Refunded' : 'Paid'}
                                </span>
                              </td>
                              <td className="p-5 text-right">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => {
                                    toast.success(`Opening Invoice for ${b.itemName}`, {
                                      description: `Ref ID: ${b.id.substring(0, 8).toUpperCase()}`
                                    });
                                  }}
                                  className="text-white/60 hover:text-kashmir-gold hover:bg-white/5 rounded-lg"
                                >
                                  <FileText className="w-4 h-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                          {bookings.length === 0 && (
                            <tr>
                              <td colSpan={5} className="p-12 text-center text-white/40 font-medium">No transactions found.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* 5. LUXURY CONCIERGE TAB */}
              {activeTab === 'support' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="text-left">
                    <h2 className="font-display text-3xl font-bold mb-2">Luxury Concierge</h2>
                    <p className="text-white/50 text-sm">Your dedicated 24/7 travel assistant. Reach out to arrange custom details instantly.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <a 
                      href="tel:+919999900000"
                      className="bg-[#0c1216]/65 backdrop-blur-xl border border-white/10 p-5 rounded-2xl flex items-center justify-between hover:border-kashmir-gold/40 hover:bg-[#0c1216] transition-all group"
                    >
                      <div className="flex items-center gap-4 text-left">
                        <div className="w-12 h-12 bg-kashmir-gold/10 rounded-xl flex items-center justify-center text-kashmir-gold group-hover:scale-105 transition-transform shadow-inner">
                          <Phone className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm">Direct Curator Hotline</h4>
                          <p className="text-xs text-white/40">Instant emergency support</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white" />
                    </a>

                    <a 
                      href="https://wa.me/919999900000"
                      target="_blank"
                      className="bg-[#0c1216]/65 backdrop-blur-xl border border-white/10 p-5 rounded-2xl flex items-center justify-between hover:border-[#25D366]/40 hover:bg-[#0c1216] transition-all group"
                    >
                      <div className="flex items-center gap-4 text-left">
                        <div className="w-12 h-12 bg-[#25D366]/10 rounded-xl flex items-center justify-center text-[#25D366] group-hover:scale-105 transition-transform shadow-inner">
                          <MessageSquare className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm">WhatsApp Concierge</h4>
                          <p className="text-xs text-white/40">Chat with ground operations</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white" />
                    </a>
                  </div>

                  {/* Chat Box Panel */}
                  <div className="bg-[#0c1216] border border-white/10 rounded-3xl shadow-2xl flex flex-col h-[500px] overflow-hidden">
                    {/* Header */}
                    <div className="bg-white/5 border-b border-white/5 px-6 py-4 flex items-center gap-4 text-left">
                      <div className="w-10 h-10 rounded-full bg-kashmir-gold/20 flex items-center justify-center text-kashmir-gold font-bold relative shrink-0">
                        <Crown className="w-4 h-4" />
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-[#0a0f12] rounded-full" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">Faheem</h4>
                        <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">Personal Curator • Online</p>
                      </div>
                    </div>

                    {/* Messages Body */}
                    <div className="flex-1 p-6 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-white/5">
                      {chatMessages.map((msg, idx) => (
                        <div 
                          key={idx} 
                          className={cn(
                            "flex flex-col max-w-[75%]",
                            msg.sender === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                          )}
                        >
                          <div 
                            className={cn(
                              "p-4 rounded-2xl text-xs leading-relaxed text-left",
                              msg.sender === 'user' 
                                ? "bg-kashmir-gold text-black font-semibold rounded-tr-none" 
                                : "bg-white/5 border border-white/5 text-white/90 rounded-tl-none"
                            )}
                          >
                            {msg.text}
                          </div>
                          <span className="text-[9px] text-white/30 font-medium mt-1">{msg.time}</span>
                        </div>
                      ))}

                      {isConciergeTyping && (
                        <div className="mr-auto flex flex-col items-start max-w-[70%]">
                          <div className="bg-white/5 border border-white/5 p-3 rounded-2xl rounded-tl-none flex gap-1 items-center">
                            <span className="w-1.5 h-1.5 bg-kashmir-gold rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1.5 h-1.5 bg-kashmir-gold rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1.5 h-1.5 bg-kashmir-gold rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>

                    {/* Quick Preset Buttons */}
                    <div className="px-6 py-2 flex gap-2 overflow-x-auto scrollbar-none border-t border-white/5 bg-black/15">
                      {[
                        "Request Late Checkout",
                        "Arrange Sunset Shikara",
                        "Assign Private Guide",
                        "Chauffeur Pickup Status"
                      ].map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSendChatMessage(preset)}
                          className="px-3.5 py-1.5 bg-white/5 hover:bg-kashmir-gold/15 hover:text-kashmir-gold text-[10px] font-bold uppercase tracking-wider rounded-full border border-white/5 transition-all whitespace-nowrap"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>

                    {/* Chat Form */}
                    <div className="p-4 bg-[#0a0f12] border-t border-white/5 flex gap-2">
                      <Input
                        value={conciergeMsg}
                        onChange={(e) => setConciergeMsg(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage(conciergeMsg)}
                        placeholder="Write a custom concierge request..."
                        className="bg-black/40 border-white/10 rounded-xl h-11 focus-visible:ring-kashmir-gold text-white text-xs pl-4"
                      />
                      <Button 
                        onClick={() => handleSendChatMessage(conciergeMsg)}
                        variant="gold" 
                        size="icon" 
                        className="h-11 w-11 rounded-xl shrink-0 text-black shadow-lg"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* 6. REWARDS TAB */}
              {activeTab === 'rewards' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 text-left">
                    <div>
                      <h2 className="font-display text-3xl font-bold mb-2 text-kashmir-gold flex items-center gap-3">
                        <Crown className="w-8 h-8 animate-pulse" /> {membershipLevel} Privileges
                      </h2>
                      <p className="text-white/50 text-sm">Your standing: <span className="text-white font-bold">{loyaltyPoints.toLocaleString()} Points</span> accumulated.</p>
                    </div>
                    <div className="bg-[#0c1216] border border-white/10 px-6 py-3 rounded-2xl shrink-0">
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-0.5">Lifetime Spend</p>
                      <p className="text-lg font-black text-white">₹{totalSpend.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Redesigned Premium Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Voucher A */}
                    <div className={cn(
                      "backdrop-blur-xl border p-8 rounded-3xl relative overflow-hidden transition-all duration-500 text-left",
                      totalTrips >= 1 
                        ? "bg-gradient-to-br from-[#0c1216] via-[#0c1216] to-[#0a0f12] border-kashmir-gold/30 hover:border-kashmir-gold/50 shadow-2xl" 
                        : "bg-white/[0.01] border-white/5 grayscale opacity-50"
                    )}>
                      <div className="absolute top-0 right-0 p-6 opacity-5"><Gift className="w-24 h-24 text-kashmir-gold" /></div>
                      <Badge className={cn("font-bold mb-4 px-2.5 py-0.5 text-[9px] uppercase",
                        totalTrips >= 1 ? "bg-kashmir-gold text-black shadow-lg" : "bg-white/10 text-white/40"
                      )}>
                        {totalTrips >= 1 ? 'Unlocked' : '1 Trip Required'}
                      </Badge>
                      <h3 className="text-xl font-display font-extrabold mb-2 text-white">Complimentary Sunset Shikara</h3>
                      <p className="text-white/50 text-sm mb-6 leading-relaxed">Enjoy a 1-hour complimentary private sunset shikara ride during Dal Lake stay.</p>
                      
                      <Button 
                        disabled={totalTrips < 1}
                        onClick={() => handleClaimVoucher('shikara', 'Complimentary Sunset Shikara')}
                        variant={claimedVouchers['shikara'] ? 'outline' : 'gold'} 
                        className={cn(
                          "rounded-xl font-bold h-10 w-full text-xs shadow-lg",
                          claimedVouchers['shikara'] ? "border-kashmir-gold/40 text-kashmir-gold bg-transparent" : "text-black"
                        )}
                      >
                        {claimedVouchers['shikara'] ? 'Show Code' : 'Claim Voucher'}
                      </Button>
                    </div>

                    {/* Voucher B */}
                    <div className={cn(
                      "backdrop-blur-xl border p-8 rounded-3xl relative overflow-hidden transition-all duration-500 text-left",
                      totalSpend >= 200000 
                        ? "bg-gradient-to-br from-[#0c1216] via-[#0c1216] to-[#0a0f12] border-amber-400/30 hover:border-amber-400/50 shadow-2xl" 
                        : "bg-white/[0.01] border-white/5 grayscale opacity-50"
                    )}>
                      <div className="absolute top-0 right-0 p-6 opacity-5"><Star className="w-24 h-24 text-amber-400" /></div>
                      <Badge className={cn("font-bold mb-4 px-2.5 py-0.5 text-[9px] uppercase", 
                        totalSpend >= 200000 ? "bg-amber-400 text-black shadow-lg" : "bg-white/10 text-white/40"
                      )}>
                        {totalSpend >= 200000 ? 'Unlocked' : '₹2L Spend Required'}
                      </Badge>
                      <h3 className="text-xl font-display font-extrabold mb-2 text-white">Luxury Suite Upgrade</h3>
                      <p className="text-white/50 text-sm mb-6 leading-relaxed">Automatic room tier upgrade on your next hotel reservation slot.</p>
                      
                      <Button 
                        disabled={totalSpend < 200000}
                        onClick={() => handleClaimVoucher('upgrade', 'Luxury Suite Upgrade')}
                        variant={claimedVouchers['upgrade'] ? 'outline' : 'gold'} 
                        className={cn(
                          "rounded-xl font-bold h-10 w-full text-xs shadow-lg",
                          claimedVouchers['upgrade'] ? "border-kashmir-gold/40 text-kashmir-gold bg-transparent" : "text-black"
                        )}
                      >
                        {claimedVouchers['upgrade'] ? 'Show Code' : 'Claim Voucher'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* 7. ACCOUNT SETTINGS TAB */}
              {activeTab === 'settings' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h2 className="font-display text-3xl font-bold mb-6 text-left">Account Settings</h2>
                  
                  <div className="bg-[#0c1216]/65 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-2xl border border-white/10">
                    <h3 className="font-semibold text-lg mb-6 border-b border-white/5 pb-4 text-white/80 text-left">Profile Information</h3>
                    
                    <form onSubmit={handleSaveProfile} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                        <div>
                          <label className="text-xs font-semibold text-white/45 block mb-2 uppercase tracking-wider">Full Name</label>
                          <Input 
                            value={editName} 
                            onChange={(e) => setEditName(e.target.value)} 
                            className="bg-black/40 border-white/10 h-12 rounded-xl text-white font-medium focus-visible:ring-kashmir-gold" 
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-white/45 block mb-2 uppercase tracking-wider">Email Address (Read Only)</label>
                          <Input value={user?.email || ''} readOnly className="bg-black/45 border-white/5 h-12 rounded-xl text-white/40 font-medium" />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-white/45 block mb-2 uppercase tracking-wider">Phone Number</label>
                          <Input 
                            value={editPhone} 
                            onChange={(e) => setEditPhone(e.target.value)} 
                            placeholder="Add phone number"
                            className="bg-black/40 border-white/10 h-12 rounded-xl text-white font-medium focus-visible:ring-kashmir-gold" 
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-4">
                        <Button 
                          type="submit" 
                          variant="gold" 
                          disabled={isSavingProfile}
                          className="rounded-xl px-8 h-11 font-bold text-black shadow-lg"
                        >
                          {isSavingProfile ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving...
                            </>
                          ) : (
                            'Save Changes'
                          )}
                        </Button>
                      </div>
                    </form>

                    <h3 className="font-semibold text-lg mt-10 mb-6 border-b border-white/5 pb-4 text-white/80 text-left">Alert Settings</h3>
                    <div className="space-y-4 text-left">
                      <div className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/5">
                        <div>
                          <h4 className="text-sm font-bold text-white">WhatsApp Notifications</h4>
                          <p className="text-[10px] text-white/40">Real-time status updates on vouchers and driver dispatch</p>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={notifyWhatsApp} 
                          onChange={(e) => setNotifyWhatsApp(e.target.checked)} 
                          className="w-5 h-5 rounded border-white/10 text-kashmir-gold bg-black/40 accent-kashmir-gold focus:ring-0" 
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/5">
                        <div>
                          <h4 className="text-sm font-bold text-white">SMS Backups</h4>
                          <p className="text-[10px] text-white/40">Emergency contact notification backups</p>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={notifySMS} 
                          onChange={(e) => setNotifySMS(e.target.checked)} 
                          className="w-5 h-5 rounded border-white/10 text-kashmir-gold bg-black/40 accent-kashmir-gold focus:ring-0" 
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/5">
                        <div>
                          <h4 className="text-sm font-bold text-white">Biometric Login Preferences</h4>
                          <p className="text-[10px] text-white/40">Save face credentials or fingerprint for quick dashboard entries</p>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={notifyBiometrics} 
                          onChange={(e) => setNotifyBiometrics(e.target.checked)} 
                          className="w-5 h-5 rounded border-white/10 text-kashmir-gold bg-black/40 accent-kashmir-gold focus:ring-0" 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

      </main>

      {/* Slips Details Dialog */}
      <Dialog open={!!activeSlip} onOpenChange={(open) => !open && setActiveSlip(null)}>
        {activeSlip && (
          <DialogContent className="rounded-3xl bg-[#0d1317] text-white border-white/10 shadow-2xl p-6 md:p-8 max-w-lg">
            <DialogHeader className="text-left border-b border-white/5 pb-4">
              <DialogTitle className="font-display text-2xl flex items-center gap-3 text-kashmir-gold">
                {activeSlip.type === 'hotel' && <Building className="w-6 h-6" />}
                {activeSlip.type === 'flight' && <Plane className="w-6 h-6 animate-pulse" />}
                {activeSlip.type === 'cab' && <Car className="w-6 h-6" />}
                {activeSlip.type === 'hotel' && 'Hotel Stay Voucher'}
                {activeSlip.type === 'flight' && 'Flight Boarding Pass'}
                {activeSlip.type === 'cab' && 'Driver Dispatch Slip'}
              </DialogTitle>
            </DialogHeader>

            {/* Voucher/Slip Card Style Content */}
            <div className="py-6 text-left space-y-5">
              
              {/* Slip A: Hotel Stay */}
              {activeSlip.type === 'hotel' && (
                <div className="space-y-4">
                  <div className="p-4 bg-black/35 rounded-2xl border border-white/5 text-center">
                    <p className="text-[10px] font-black uppercase text-kashmir-gold tracking-widest mb-1">Estate Reference</p>
                    <p className="font-mono text-base font-bold text-white">{activeSlip.booking.id.toUpperCase().substring(0, 12)}</p>
                  </div>
                  
                  <div className="space-y-3.5 text-sm">
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-white/40">Hotel / Houseboat</span>
                      <span className="font-bold text-white text-right">{activeSlip.booking.itemName}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-white/40">Room Category</span>
                      <span className="font-semibold text-white">Super Deluxe Peak View</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-white/40">Check-In Date</span>
                      <span className="font-semibold text-white">
                        {new Date(activeSlip.booking.bookingDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-white/40">Guests</span>
                      <span className="font-semibold text-white">2 Adults</span>
                    </div>
                    <div className="flex justify-between pb-2">
                      <span className="text-white/40">Curation Status</span>
                      <span className="text-green-400 font-extrabold uppercase text-xs">Vouchers Issued</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Slip B: Flight Tickets */}
              {activeSlip.type === 'flight' && (
                <div className="space-y-4">
                  <div className="p-4 bg-black/35 rounded-2xl border border-white/5 flex items-center justify-between">
                    <div className="text-left">
                      <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Airline Carrier</p>
                      <h4 className="text-lg font-bold text-white">Vistara Airways</h4>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Flight No</p>
                      <h4 className="text-lg font-mono font-bold text-kashmir-gold">UK-721</h4>
                    </div>
                  </div>

                  <div className="flex items-center justify-between px-2 text-center py-2">
                    <div className="text-left">
                      <h3 className="text-3xl font-display font-black text-white">DEL</h3>
                      <p className="text-xs text-white/40">New Delhi</p>
                    </div>
                    <div className="flex-1 flex flex-col items-center px-4 relative">
                      <p className="text-[9px] font-mono text-kashmir-gold mb-1">Direct</p>
                      <div className="w-full h-[1px] bg-white/20 relative">
                        <div className="w-1.5 h-1.5 bg-kashmir-gold rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                      </div>
                      <p className="text-[9px] text-white/20 mt-1">1h 35m</p>
                    </div>
                    <div className="text-right">
                      <h3 className="text-3xl font-display font-black text-white">SXR</h3>
                      <p className="text-xs text-white/40">Srinagar</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5 p-4 bg-white/[0.02] border border-white/5 rounded-2xl text-xs">
                    <div>
                      <p className="text-white/30 text-[9px] uppercase tracking-wider mb-0.5">Date</p>
                      <p className="font-bold text-white">{new Date(activeSlip.booking.bookingDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-white/30 text-[9px] uppercase tracking-wider mb-0.5">Boarding</p>
                      <p className="font-bold text-white">09:10 AM</p>
                    </div>
                    <div>
                      <p className="text-white/30 text-[9px] uppercase tracking-wider mb-0.5">Seat / Gate</p>
                      <p className="font-bold text-kashmir-gold">12A / T3</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Slip C: Driver Chauffeur */}
              {activeSlip.type === 'cab' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <div className="w-14 h-14 bg-kashmir-gold/10 border border-kashmir-gold/20 rounded-xl flex items-center justify-center text-kashmir-gold text-lg font-black shrink-0">
                      HA
                    </div>
                    <div className="text-left">
                      <h4 className="font-bold text-white">Hilal Ahmad</h4>
                      <p className="text-xs text-white/40">+91 91037 98448 • Languages: English, Hindi, Kashmiri</p>
                    </div>
                  </div>

                  <div className="space-y-3.5 text-sm">
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-white/40">Assigned Vehicle</span>
                      <span className="font-bold text-white">Toyota Innova Crysta</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-white/40">License Plate</span>
                      <span className="font-mono font-bold text-kashmir-gold">JK-01-X-7721</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-white/40">Pickup Location</span>
                      <span className="font-semibold text-white">Srinagar Airport (SXR)</span>
                    </div>
                    <div className="flex justify-between pb-2">
                      <span className="text-white/40">Driver Status</span>
                      <span className="text-green-400 font-extrabold uppercase text-xs">Driver Mapped</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Mock Barcode for Luxury Ticket Theme */}
              <div className="pt-4 border-t border-white/5 flex flex-col items-center">
                <div className="w-full h-12 bg-white flex items-center justify-center p-2 rounded-lg opacity-85">
                  {/* CSS-based Barcode */}
                  <div className="w-full h-full flex justify-between">
                    {[1,2,4,1,2,3,1,2,4,2,1,3,2,1,4,1,2,3,1,4,2,1,3,1,2,4].map((width, idx) => (
                      <div key={idx} className="bg-black h-full" style={{ width: `${width * 2}px` }} />
                    ))}
                  </div>
                </div>
                <p className="text-[9px] font-mono text-white/30 tracking-widest mt-2 uppercase">Verified Kashmir Curators Protocol</p>
              </div>

            </div>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setActiveSlip(null)} 
                className="w-full rounded-xl border-white/10 hover:bg-white/5 font-bold"
              >
                Close Slip
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Claimed Voucher Dialog */}
      <Dialog open={!!viewingVoucher} onOpenChange={(open) => !open && setViewingVoucher(null)}>
        {viewingVoucher && (
          <DialogContent className="rounded-3xl bg-[#111820] text-white border-white/10 shadow-2xl p-6 text-center max-w-sm">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl text-center text-kashmir-gold flex items-center justify-center gap-2">
                <Crown className="w-5 h-5" /> Voucher Code
              </DialogTitle>
            </DialogHeader>

            <div className="py-8 space-y-4">
              <p className="text-xs text-white/55 text-center">Present this code to your Personal Curator or hotel desk during check-in to apply voucher benefits.</p>
              
              <div className="bg-black/40 border border-white/5 rounded-2xl p-5 flex flex-col items-center justify-center">
                <p className="text-[10px] font-black uppercase text-white/40 tracking-wider mb-2">{viewingVoucher.name}</p>
                <h3 className="text-xl font-mono font-black text-kashmir-gold tracking-widest select-all">{viewingVoucher.code}</h3>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={() => {
                    navigator.clipboard.writeText(viewingVoucher.code);
                    toast.success("Voucher code copied to clipboard!");
                  }}
                  variant="outline" 
                  className="rounded-xl border-white/10 hover:bg-white/5 flex-1 font-bold text-xs"
                >
                  <Copy className="w-3.5 h-3.5 mr-2" /> Copy Code
                </Button>
                <Button 
                  onClick={() => {
                    toast.success("Sharing voucher...", { description: `Shared: ${viewingVoucher.name} [Code: ${viewingVoucher.code}]` });
                  }}
                  variant="outline" 
                  className="rounded-xl border-white/10 hover:bg-white/5 flex-1 font-bold text-xs"
                >
                  <Share2 className="w-3.5 h-3.5 mr-2" /> Share
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button 
                variant="gold" 
                onClick={() => setViewingVoucher(null)} 
                className="w-full rounded-xl text-black font-bold h-11 shadow-lg shadow-kashmir-gold/10"
              >
                Done
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      <Footer />
    </div>
  );
}

// Sidebar Button Component (Desktop)
function SidebarButton({ icon: Icon, label, active, onClick, className, badge }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center justify-between px-4 py-3.5 rounded-2xl font-medium transition-all text-left w-full group text-sm",
        active 
          ? "bg-gradient-to-r from-kashmir-gold/15 to-transparent text-kashmir-gold border-l-2 border-kashmir-gold" 
          : "text-white/60 hover:bg-white/5 hover:text-white",
        className
      )}
    >
      <span className="flex items-center gap-3">
        <Icon className={cn("w-5 h-5", active ? "text-kashmir-gold" : "text-white/40 group-hover:text-white/70", className)} /> 
        {label}
      </span>
      {badge !== undefined && badge > 0 && (
        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold", active ? "bg-kashmir-gold text-black" : "bg-white/10 text-white")}>
          {badge}
        </span>
      )}
    </button>
  );
}

// Mobile Tab Button
function MobileTabButton({ icon: Icon, label, active, onClick, className, badge }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-300 snap-center border shrink-0",
        active 
          ? "bg-kashmir-gold/15 text-kashmir-gold border-kashmir-gold/30 shadow-[0_0_15px_rgba(212,175,55,0.1)]" 
          : "bg-white/5 text-white/55 border-white/5 hover:bg-white/10 hover:text-white",
        className
      )}
    >
      <Icon className="w-4 h-4" />
      {label}
      {badge !== undefined && badge > 0 && (
        <span className={cn("px-1.5 py-0.5 rounded-full text-[9px] font-bold", active ? "bg-kashmir-gold text-black animate-pulse" : "bg-white/10 text-white")}>
          {badge}
        </span>
      )}
    </button>
  );
}

// Sub-component for rendering a luxury Ticket
function BookingTicket({ booking, onCancel, cancellingId, onShowSlip }: { booking: any, onCancel: (id: string) => void, cancellingId: string | null, onShowSlip: (slip: any) => void }) {
  const Icon = typeIcons[booking.type as keyof typeof typeIcons] || Package;
  
  return (
    <div className="bg-[#0c1216]/65 backdrop-blur-xl rounded-3xl shadow-lg border border-white/10 overflow-hidden flex flex-col md:flex-row hover:shadow-2xl hover:border-kashmir-gold/40 transition-all duration-500 relative">
      
      {/* Left side - Icon & Status */}
      <div className="bg-black/20 md:w-48 p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-dashed border-white/15 relative">
        <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mb-4 text-white shadow-inner">
          <Icon className="w-8 h-8 text-kashmir-gold" />
        </div>
        <Badge className={cn('px-3 py-1 font-bold uppercase tracking-wider text-[10px]', 
          booking.status === 'confirmed' ? 'bg-green-500/20 text-green-400 border-green-500/20' : 
          booking.status === 'cancelled' ? 'bg-red-500/20 text-red-400 border-red-500/20' : 
          booking.status === 'completed' ? 'bg-white/15 text-white/50 border-white/10' :
          'bg-kashmir-gold/20 text-kashmir-gold border-kashmir-gold/20'
        )}>
          {booking.status}
        </Badge>
        
        {/* Decorative Ticket Cutouts */}
        <div className="hidden md:block w-6 h-6 bg-[#05080a] rounded-full absolute -right-3 -top-3 shadow-inner" />
        <div className="hidden md:block w-6 h-6 bg-[#05080a] rounded-full absolute -right-3 -bottom-3 shadow-inner" />
      </div>

      {/* Middle - Details */}
      <div className="flex-1 p-6 md:p-8">
        <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 flex items-center justify-center md:justify-start gap-2">
          <span>REF CODE:</span>
          <span className="font-mono bg-white/5 px-2 py-0.5 rounded text-white/80">{booking.id.toUpperCase().slice(0, 8)}</span>
        </div>
        <h3 className="font-display text-2xl font-bold text-white mb-6 leading-tight text-center md:text-left">{booking.itemName}</h3>
        
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-white/60">
          <div className="flex items-center gap-3 bg-black/40 border border-white/5 px-4 py-2.5 rounded-xl text-left">
            <Calendar className="h-5 w-5 text-kashmir-gold" />
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-wider text-white/40 font-bold">Departure</span>
              <span className="font-semibold text-white">
                {new Date(booking.bookingDate).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-black/40 border border-white/5 px-4 py-2.5 rounded-xl text-left">
            <CreditCard className="h-5 w-5 text-kashmir-gold" />
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-wider text-white/40 font-bold">Total Price</span>
              <span className="font-semibold text-white">
                ₹{booking.totalAmount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Curation Milestone Progress bar */}
        {booking.status === 'confirmed' && booking.type === 'package' && (
          <div className="mt-8 border-t border-white/5 pt-6 relative z-10 text-left">
            <div className="flex flex-col mb-4">
              <h4 className="font-display text-xs font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-kashmir-gold animate-pulse" /> Live Trip Stepper
              </h4>
              <p className="text-[10px] text-white/40">Follow updates as your private curation deck registers milestones.</p>
            </div>

            {/* Stepper Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="flex items-center gap-3 bg-white/[0.02] border border-white/5 p-2.5 rounded-xl">
                <div className="w-6 h-6 rounded-full bg-kashmir-gold text-black flex items-center justify-center font-bold text-[10px] shrink-0 shadow-lg shadow-kashmir-gold/20">✓</div>
                <div className="text-left">
                  <p className="text-[9px] font-black uppercase text-kashmir-gold tracking-widest leading-none">Curator</p>
                  <p className="text-[11px] text-white font-medium">Assigned</p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white/[0.02] border border-white/5 p-2.5 rounded-xl">
                <div className="w-6 h-6 rounded-full bg-kashmir-gold text-black flex items-center justify-center font-bold text-[10px] shrink-0 shadow-lg shadow-kashmir-gold/20">✓</div>
                <div className="text-left">
                  <p className="text-[9px] font-black uppercase text-kashmir-gold tracking-widest leading-none">Air Tickets</p>
                  <p className="text-[11px] text-white font-medium">Secured</p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white/[0.02] border border-white/5 p-2.5 rounded-xl">
                <div className="w-6 h-6 rounded-full bg-kashmir-gold text-black flex items-center justify-center font-bold text-[10px] shrink-0 shadow-lg shadow-kashmir-gold/20">✓</div>
                <div className="text-left">
                  <p className="text-[9px] font-black uppercase text-kashmir-gold tracking-widest leading-none">Lodging</p>
                  <p className="text-[11px] text-white font-medium">Bookings Locked</p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-gradient-to-r from-kashmir-gold/10 to-transparent border border-kashmir-gold/20 p-2.5 rounded-xl animate-pulse">
                <div className="w-6 h-6 rounded-full bg-kashmir-gold/15 text-kashmir-gold border border-kashmir-gold/30 flex items-center justify-center font-bold text-[10px] shrink-0">4</div>
                <div className="text-left">
                  <p className="text-[9px] font-black uppercase text-kashmir-gold tracking-widest leading-none">Driver</p>
                  <p className="text-[11px] text-white font-medium">Driver Mapped</p>
                </div>
              </div>
            </div>

            {/* Launch detailed ticket modals */}
            <div className="mt-5 flex flex-wrap gap-2.5 justify-center md:justify-start">
              <Button 
                variant="ghost" 
                onClick={() => onShowSlip({ type: 'hotel', booking })}
                className="bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-xl text-[10px] h-8 border border-white/5 flex items-center gap-2 font-bold uppercase tracking-wider"
              >
                <Building className="w-3.5 h-3.5 text-kashmir-gold" /> Stay Voucher
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => onShowSlip({ type: 'flight', booking })}
                className="bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-xl text-[10px] h-8 border border-white/5 flex items-center gap-2 font-bold uppercase tracking-wider"
              >
                <Ticket className="w-3.5 h-3.5 text-kashmir-gold" /> Flight pass
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => onShowSlip({ type: 'cab', booking })}
                className="bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-xl text-[10px] h-8 border border-white/5 flex items-center gap-2 font-bold uppercase tracking-wider"
              >
                <Car className="w-3.5 h-3.5 text-kashmir-gold" /> Chauffeur Details
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Right side - Actions */}
      <div className="bg-white/[0.02] p-6 md:w-56 flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-dashed border-white/15">
        
        {(booking.status === 'confirmed' || booking.status === 'pending') && (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500 hover:text-white rounded-xl font-bold text-xs h-10 transition-all">
                Cancel Trip
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl bg-[#111820] text-white border-white/10 shadow-2xl p-6">
              <DialogHeader className="text-left">
                <DialogTitle className="font-display text-2xl">Cancel Booking</DialogTitle>
              </DialogHeader>
              <div className="py-6 text-left">
                <div className="flex items-start gap-4 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 mb-6">
                  <AlertCircle className="h-6 w-6 shrink-0 mt-0.5" />
                  <p className="text-sm font-medium leading-relaxed">
                    Are you sure you want to cancel this booking? This action is permanent and cannot be undone. Standard cancellation policy applies.
                  </p>
                </div>
                <div className="bg-black/50 p-4 rounded-xl text-sm border border-white/5 text-left">
                  <p className="font-semibold text-white mb-1">{booking.itemName}</p>
                  <p className="text-white/60">Amount: ₹{booking.totalAmount.toLocaleString()}</p>
                </div>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" className="rounded-xl border-white/20 bg-transparent text-white hover:bg-white/10">Keep Booking</Button>
                <Button
                  variant="destructive"
                  className="rounded-xl shadow-lg font-bold"
                  onClick={() => onCancel(booking.id)}
                  disabled={cancellingId === booking.id}
                >
                  {cancellingId === booking.id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" /> Cancelling...
                    </>
                  ) : (
                    'Confirm Cancellation'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {booking.status === 'completed' && (
          <Button variant="gold" className="w-full rounded-xl shadow-[0_0_20px_rgba(212,175,55,0.2)] font-bold text-black text-xs h-10">
            Book Again
          </Button>
        )}
      </div>

    </div>
  );
}
