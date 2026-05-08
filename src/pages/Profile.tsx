import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Package, Building, Car, Calendar, Clock, MapPin, AlertCircle, Loader2, Compass, LayoutDashboard, CreditCard, Settings, LogOut, Ticket, Sparkles, Map, CloudSun, Phone, MessageSquare, Download, FileText, Crown, Gift, ExternalLink, ShieldCheck } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

const statusColors = {
  confirmed: 'bg-green-500/10 text-green-600 border-green-500/20',
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

export default function Profile() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin, isLoading, bookings, cancelBooking, logout } = useAuth();
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [conciergeMsg, setConciergeMsg] = useState('');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/auth?redirect=/profile');
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading || !isAuthenticated) {
    return null;
  }

  const activeBookings = bookings.filter(b => b.status === 'confirmed' || b.status === 'pending');
  const pastBookings = bookings.filter(b => b.status === 'completed' || b.status === 'cancelled');

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

  const handleConciergeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!conciergeMsg.trim()) return;
    toast.success('Your request has been sent to our luxury concierge. We will contact you shortly.');
    setConciergeMsg('');
  };

  const mockProposals = [
    { id: 'REQ-9921', title: '5 Days Luxury Getaway', dest: 'Srinagar, Gulmarg', status: 'Pending Curation', date: 'Just now', hasPdf: false },
    { id: 'ITN-1029', title: '7 Days Paradise Explorer', dest: 'Srinagar, Gulmarg, Pahalgam', status: 'Ready for Review', date: 'Oct 15, 2026', hasPdf: true },
  ];

  return (
    <div className="min-h-screen bg-[#0a0f12] text-white flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 pb-20">
        
        {/* Cinematic Hero Header */}
        <div className="relative pt-32 pb-32 lg:pt-40 lg:pb-40 overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center" 
            style={{ backgroundImage: 'url("/images/dashboard_hero.png")' }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f12] via-[#0a0f12]/80 to-transparent" />
            <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
          </div>
          
          <div className="container mx-auto px-4 relative z-10 flex flex-col md:flex-row items-center gap-6 animate-fade-up">
            <div className="w-24 h-24 md:w-32 md:h-32 bg-card rounded-full flex items-center justify-center text-4xl md:text-5xl font-display font-bold text-kashmir-gold shadow-[0_0_40px_rgba(212,175,55,0.3)] border-2 border-kashmir-gold/50 backdrop-blur-md">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-kashmir-gold/20 text-kashmir-gold px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase mb-3 backdrop-blur-md border border-kashmir-gold/30">
                <Crown className="w-4 h-4" /> Elite Member
              </div>
              <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">
                Welcome back, {user?.name?.split(' ')[0]}
              </h1>
              <p className="text-white/60 text-lg flex items-center justify-center md:justify-start gap-2">
                {user?.email} {user?.phone && `• ${user.phone}`}
              </p>
            </div>
          </div>
        </div>

        {/* Dashboard Grid Container */}
        <div className="container mx-auto px-4 -mt-16 relative z-20">
          <div className="flex flex-col lg:flex-row gap-8">
            
            {/* Left Sidebar - Glassmorphism */}
            <div className="lg:w-72 shrink-0">
              <div className="bg-white/5 backdrop-blur-2xl rounded-[2rem] p-4 shadow-2xl border border-white/10 sticky top-28">
                <div className="flex flex-col gap-1.5">
                  <SidebarButton icon={LayoutDashboard} label="Dashboard Home" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
                  <SidebarButton icon={Package} label="My Bookings" active={activeTab === 'trips'} onClick={() => setActiveTab('trips')} badge={activeBookings.length} />
                  <SidebarButton icon={Compass} label="Custom Proposals" active={activeTab === 'itineraries'} onClick={() => setActiveTab('itineraries')} />
                  <SidebarButton icon={CreditCard} label="Payments & Invoices" active={activeTab === 'payments'} onClick={() => setActiveTab('payments')} />
                  <SidebarButton icon={MessageSquare} label="Luxury Concierge" active={activeTab === 'support'} onClick={() => setActiveTab('support')} />
                  <SidebarButton icon={Gift} label="Elite Rewards" active={activeTab === 'rewards'} onClick={() => setActiveTab('rewards')} className="text-kashmir-gold" />
                  
                  <div className="border-t border-white/10 my-4 mx-2" />
                  
                  <SidebarButton icon={Settings} label="Account Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
                  <SidebarButton icon={LogOut} label="Sign Out" active={false} onClick={handleLogout} className="text-destructive hover:bg-destructive/10 hover:text-destructive" />
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 animate-fade-in">
              
              {/* OVERVIEW TAB */}
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  
                  {/* Weather & Live Update Widget */}
                  <div className="bg-gradient-to-r from-blue-900/40 to-teal-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md shrink-0">
                        <CloudSun className="w-8 h-8 text-yellow-300" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white/60 tracking-wider uppercase mb-1">Live from Srinagar</p>
                        <h3 className="text-3xl font-display font-bold text-white">18°C <span className="text-xl font-normal text-white/60">Partly Cloudy</span></h3>
                      </div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-sm md:max-w-xs backdrop-blur-md">
                      <div className="flex items-center gap-2 text-kashmir-gold mb-1">
                        <ShieldCheck className="w-4 h-4" /> <span className="font-bold">Travel Advisory</span>
                      </div>
                      <p className="text-white/70">All roads to Gulmarg and Pahalgam are open and clear. Perfect weather for Shikara rides.</p>
                    </div>
                  </div>

                  <div>
                    <h2 className="font-display text-3xl font-bold mb-6 flex items-center gap-3">
                      <Sparkles className="w-6 h-6 text-kashmir-gold" /> Explore & Book
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                      {/* AI Planner Card */}
                      <div 
                        onClick={() => navigate('/planner')}
                        className="group relative overflow-hidden bg-gradient-to-br from-kashmir-gold/20 via-[#0a0f12] to-[#0a0f12] border border-kashmir-gold/30 p-8 rounded-3xl cursor-pointer hover:shadow-[0_0_30px_rgba(212,175,55,0.15)] hover:border-kashmir-gold/60 transition-all duration-500 flex flex-col justify-between min-h-[220px]"
                      >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-kashmir-gold/10 rounded-full blur-3xl group-hover:bg-kashmir-gold/20 transition-all" />
                        <div className="bg-kashmir-gold text-black w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-500 relative z-10">
                          <Sparkles className="w-7 h-7" />
                        </div>
                        <div className="relative z-10">
                          <h3 className="text-2xl font-display font-bold text-white mb-2">Plan a Trip</h3>
                          <p className="text-white/60">Request a personalized, bespoke itinerary designed by our expert curators.</p>
                        </div>
                      </div>

                      {/* Packages Card */}
                      <div 
                        onClick={() => navigate('/packages')}
                        className="group relative overflow-hidden bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl cursor-pointer hover:bg-white/10 transition-all duration-500 flex flex-col justify-between min-h-[220px]"
                      >
                        <div className="bg-white/10 text-white w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                          <Map className="w-7 h-7" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-display font-bold text-white mb-2">Luxury Packages</h3>
                          <p className="text-white/60">Browse our curated selection of premium Kashmir tours and retreats.</p>
                        </div>
                      </div>

                      {/* Hotels Card */}
                      <div 
                        onClick={() => navigate('/hotels')}
                        className="group relative overflow-hidden bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl cursor-pointer hover:bg-white/10 transition-all duration-500 flex flex-col justify-between min-h-[220px]"
                      >
                        <div className="bg-white/10 text-white w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                          <Building className="w-7 h-7" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-display font-bold text-white mb-2">Book a Hotel</h3>
                          <p className="text-white/60">Find the perfect luxury 5-star stay or premium cozy houseboat.</p>
                        </div>
                      </div>

                      {/* Cabs Card */}
                      <div 
                        onClick={() => navigate('/cabs')}
                        className="group relative overflow-hidden bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl cursor-pointer hover:bg-white/10 transition-all duration-500 flex flex-col justify-between min-h-[220px]"
                      >
                        <div className="bg-white/10 text-white w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                          <Car className="w-7 h-7" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-display font-bold text-white mb-2">Rent a Chauffeur</h3>
                          <p className="text-white/60">Travel comfortably with our trusted luxury SUVs and local drivers.</p>
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
                      <div className="grid gap-4">
                        {activeBookings.slice(0, 2).map((booking) => (
                          <BookingTicket key={booking.id} booking={booking} onCancel={handleCancel} cancellingId={cancellingId} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TRIPS TAB */}
              {activeTab === 'trips' && (
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-3xl font-bold">My Bookings</h2>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white/5 backdrop-blur-xl p-6 rounded-3xl border border-white/10 flex flex-col items-center justify-center text-center">
                      <h4 className="text-4xl font-display font-bold text-kashmir-gold mb-1">{activeBookings.length}</h4>
                      <p className="text-sm font-medium text-white/50 uppercase tracking-wider">Active</p>
                    </div>
                    <div className="bg-white/5 backdrop-blur-xl p-6 rounded-3xl border border-white/10 flex flex-col items-center justify-center text-center">
                      <h4 className="text-4xl font-display font-bold text-white mb-1">{pastBookings.length}</h4>
                      <p className="text-sm font-medium text-white/50 uppercase tracking-wider">Past Trips</p>
                    </div>
                  </div>

                  {activeBookings.length === 0 && pastBookings.length === 0 ? (
                    <div className="bg-white/5 border border-dashed border-white/20 p-12 rounded-3xl text-center backdrop-blur-sm">
                      <Ticket className="w-16 h-16 text-white/20 mx-auto mb-6" />
                      <h3 className="text-2xl font-bold mb-2">No bookings yet</h3>
                      <p className="text-white/60 mb-8 max-w-md mx-auto">
                        Your luxury Kashmir experience awaits. Browse our packages or use the AI planner to get started.
                      </p>
                      <Button variant="gold" size="lg" onClick={() => navigate('/packages')}>Explore Packages</Button>
                    </div>
                  ) : (
                    <div className="space-y-12">
                      {activeBookings.length > 0 && (
                        <div>
                          <h3 className="text-xl font-bold mb-4 text-white/80">Active & Upcoming</h3>
                          <div className="grid gap-6">
                            {activeBookings.map((booking) => (
                              <BookingTicket key={booking.id} booking={booking} onCancel={handleCancel} cancellingId={cancellingId} />
                            ))}
                          </div>
                        </div>
                      )}
                      {pastBookings.length > 0 && (
                        <div>
                          <h3 className="text-xl font-bold mb-4 text-white/50">Past History</h3>
                          <div className="grid gap-6 opacity-60 hover:opacity-100 transition-opacity duration-300">
                            {pastBookings.map((booking) => (
                              <BookingTicket key={booking.id} booking={booking} onCancel={handleCancel} cancellingId={cancellingId} />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* CUSTOM PROPOSALS TAB */}
              {activeTab === 'itineraries' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-3xl font-bold">Custom Proposals</h2>
                    <Button variant="gold" onClick={() => navigate('/planner')}>
                      <Sparkles className="w-4 h-4 mr-2" /> Request New
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                    {mockProposals.map((prop) => (
                      <div key={prop.id} className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl hover:bg-white/10 transition-all duration-300 relative overflow-hidden">
                        
                        <div className="flex justify-between items-start mb-4 relative z-10">
                          <Badge variant="outline" className="bg-white/5 text-white/80 border-white/20">{prop.id}</Badge>
                          <Badge className={cn("font-bold uppercase tracking-wider text-[10px]", prop.hasPdf ? "bg-green-500/20 text-green-400 border-green-500/20" : "bg-kashmir-gold/20 text-kashmir-gold border-kashmir-gold/20")}>
                            {prop.status}
                          </Badge>
                        </div>
                        
                        <h3 className="text-xl font-display font-bold mb-2 relative z-10">{prop.title}</h3>
                        <p className="text-white/60 text-sm mb-6 flex items-center gap-2 relative z-10"><MapPin className="w-4 h-4 text-kashmir-gold" /> {prop.dest}</p>
                        
                        <div className="flex items-center justify-between pt-4 border-t border-white/10 relative z-10">
                          <span className="text-xs text-white/40 font-medium uppercase tracking-wider">Date: {prop.date}</span>
                          
                          {prop.hasPdf ? (
                            <Button variant="gold" size="sm" className="rounded-lg shadow-[0_0_15px_rgba(212,175,55,0.2)] text-black font-bold">
                              <Download className="w-4 h-4 mr-2" /> Download PDF
                            </Button>
                          ) : (
                            <Button variant="outline" size="sm" disabled className="bg-white/5 border-white/5 text-white/30 rounded-lg">
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Curating...
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PAYMENTS & INVOICES TAB */}
              {activeTab === 'payments' && (
                <div className="space-y-6">
                  <h2 className="font-display text-3xl font-bold mb-6">Payments & Invoices</h2>
                  
                  <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-white/5 border-b border-white/10">
                            <th className="p-4 text-sm font-semibold text-white/60 tracking-wider">Date</th>
                            <th className="p-4 text-sm font-semibold text-white/60 tracking-wider">Description</th>
                            <th className="p-4 text-sm font-semibold text-white/60 tracking-wider">Amount</th>
                            <th className="p-4 text-sm font-semibold text-white/60 tracking-wider">Status</th>
                            <th className="p-4 text-sm font-semibold text-white/60 tracking-wider text-right">Invoice</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {bookings.map(b => (
                            <tr key={b.id} className="hover:bg-white/5 transition-colors">
                              <td className="p-4 text-sm">
                                {new Date(b.createdAt).toLocaleDateString()}
                              </td>
                              <td className="p-4 font-medium">{b.itemName}</td>
                              <td className="p-4 font-bold text-kashmir-gold">₹{b.totalAmount.toLocaleString()}</td>
                              <td className="p-4">
                                <span className={cn("px-2.5 py-1 rounded-md text-xs font-bold uppercase", 
                                  b.status === 'confirmed' ? 'bg-green-500/20 text-green-400' : 
                                  b.status === 'cancelled' ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white/70'
                                )}>
                                  {b.status === 'cancelled' ? 'Refunded' : 'Paid'}
                                </span>
                              </td>
                              <td className="p-4 text-right">
                                <Button variant="ghost" size="sm" className="text-white/60 hover:text-white">
                                  <FileText className="w-4 h-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                          {bookings.length === 0 && (
                            <tr>
                              <td colSpan={5} className="p-8 text-center text-white/40">No transactions found.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* LUXURY CONCIERGE TAB */}
              {activeTab === 'support' && (
                <div className="space-y-8">
                  <div>
                    <h2 className="font-display text-3xl font-bold mb-2">Luxury Concierge</h2>
                    <p className="text-white/60">Your dedicated 24/7 travel assistant. How can we elevate your stay today?</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl text-center">
                      <div className="w-12 h-12 bg-kashmir-gold/20 rounded-full flex items-center justify-center mx-auto mb-4 text-kashmir-gold">
                        <Phone className="w-6 h-6" />
                      </div>
                      <h4 className="font-bold mb-1">Direct Call</h4>
                      <p className="text-sm text-white/60 mb-4">Immediate emergency support</p>
                      <Button variant="outline" className="w-full bg-white/5 border-white/10 hover:bg-white/10">Call +91 99999 00000</Button>
                    </div>
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl text-center">
                      <div className="w-12 h-12 bg-[#25D366]/20 rounded-full flex items-center justify-center mx-auto mb-4 text-[#25D366]">
                        <MessageSquare className="w-6 h-6" />
                      </div>
                      <h4 className="font-bold mb-1">WhatsApp Chat</h4>
                      <p className="text-sm text-white/60 mb-4">Fastest response for queries</p>
                      <Button variant="outline" className="w-full bg-white/5 border-white/10 hover:bg-white/10 hover:text-[#25D366]">Message Us</Button>
                    </div>
                  </div>

                  <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
                    <h3 className="font-display text-xl font-bold mb-6">Send a Special Request</h3>
                    <form onSubmit={handleConciergeSubmit} className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-white/60 mb-2 block">What do you need help with?</label>
                        <textarea 
                          value={conciergeMsg}
                          onChange={(e) => setConciergeMsg(e.target.value)}
                          className="w-full min-h-[120px] bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-kashmir-gold focus:ring-1 focus:ring-kashmir-gold resize-none"
                          placeholder="E.g., I'd like to arrange a private shikara dinner tomorrow at 7 PM..."
                        />
                      </div>
                      <div className="flex justify-end">
                        <Button type="submit" variant="gold" className="rounded-xl px-8">Send Request</Button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* REWARDS TAB */}
              {activeTab === 'rewards' && (
                <div className="space-y-8">
                  <div>
                    <h2 className="font-display text-3xl font-bold mb-2 text-kashmir-gold flex items-center gap-3">
                      <Crown className="w-8 h-8" /> Elite Rewards
                    </h2>
                    <p className="text-white/60">Exclusive privileges unlocked for being a premium Kashmir Curators member.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-kashmir-gold/20 to-black/40 backdrop-blur-xl border border-kashmir-gold/30 p-8 rounded-3xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-6 opacity-20"><Gift className="w-24 h-24 text-kashmir-gold" /></div>
                      <Badge className="bg-kashmir-gold text-black font-bold mb-4">Active Offer</Badge>
                      <h3 className="text-2xl font-bold mb-2">Complimentary Shikara Ride</h3>
                      <p className="text-white/70 mb-6 max-w-[80%] relative z-10">Enjoy a 1-hour complimentary premium shikara ride during sunset on your next Srinagar stay.</p>
                      <Button variant="outline" className="bg-black/40 border-kashmir-gold/50 text-kashmir-gold hover:bg-kashmir-gold hover:text-black">Claim Voucher</Button>
                    </div>

                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl relative overflow-hidden">
                      <Badge className="bg-white/10 text-white/60 font-bold mb-4 border-white/10">Coming Soon</Badge>
                      <h3 className="text-2xl font-bold mb-2 text-white/50">Free Room Upgrade</h3>
                      <p className="text-white/40 mb-6 max-w-[80%] relative z-10">Automatically applied to your next 5-star hotel booking based on availability.</p>
                      <Button variant="outline" disabled className="bg-white/5 border-white/5 text-white/30">Locked</Button>
                    </div>
                  </div>
                </div>
              )}

              {/* ACCOUNT SETTINGS TAB */}
              {activeTab === 'settings' && (
                <div className="space-y-6">
                  <h2 className="font-display text-3xl font-bold mb-6">Account Settings</h2>
                  
                  <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 shadow-sm border border-white/10">
                    <h3 className="font-semibold text-lg mb-6 border-b border-white/10 pb-4 text-white/80">Personal Information</h3>
                    
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="text-sm font-medium text-white/50 block mb-2">Full Name</label>
                          <Input value={user?.name || ''} readOnly className="bg-black/40 border-white/10 h-12 rounded-xl text-white font-medium" />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-white/50 block mb-2">Email Address</label>
                          <Input value={user?.email || ''} readOnly className="bg-black/40 border-white/10 h-12 rounded-xl text-white font-medium" />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-white/50 block mb-2">Phone Number</label>
                          <Input value={user?.phone || 'Not provided'} readOnly className="bg-black/40 border-white/10 h-12 rounded-xl text-white font-medium" />
                        </div>
                      </div>

                      <div className="pt-4 flex items-center justify-between border-t border-white/10 mt-8 pt-8">
                        <div>
                          <p className="font-bold text-white">Password & Security</p>
                          <p className="text-sm text-white/50">Manage your password and 2FA</p>
                        </div>
                        <Button variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white">Update</Button>
                      </div>
                    </div>
                  </div>

                </div>
              )}

            </div>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}

// Sidebar Button Component
function SidebarButton({ icon: Icon, label, active, onClick, className, badge }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center justify-between px-4 py-3.5 rounded-2xl font-medium transition-all text-left w-full group",
        active 
          ? "bg-gradient-to-r from-kashmir-gold/20 to-transparent text-kashmir-gold shadow-[inset_2px_0_0_#D4AF37]" 
          : "text-white/60 hover:bg-white/5 hover:text-white",
        className
      )}
    >
      <span className="flex items-center gap-3">
        <Icon className={cn("w-5 h-5", active ? "text-kashmir-gold" : "text-white/40 group-hover:text-white/80", className)} /> 
        {label}
      </span>
      {badge !== undefined && badge > 0 && (
        <span className={cn("px-2 py-0.5 rounded-full text-xs font-bold", active ? "bg-kashmir-gold text-black" : "bg-white/10 text-white")}>
          {badge}
        </span>
      )}
    </button>
  );
}

// Sub-component for rendering a luxury Ticket
function BookingTicket({ booking, onCancel, cancellingId }: { booking: any, onCancel: (id: string) => void, cancellingId: string | null }) {
  const Icon = typeIcons[booking.type as keyof typeof typeIcons] || Package;
  
  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-3xl shadow-lg border border-white/10 overflow-hidden flex flex-col md:flex-row hover:shadow-2xl hover:border-kashmir-gold/40 transition-all duration-500 hover:-translate-y-1">
      
      {/* Left side - Icon & Status */}
      <div className="bg-black/20 md:w-48 p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-dashed border-white/20 relative">
        <div className="w-16 h-16 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl shadow-sm flex items-center justify-center mb-4 text-white">
          <Icon className="w-8 h-8" />
        </div>
        <Badge className={cn('px-3 py-1 font-bold uppercase tracking-wider text-xs', 
          booking.status === 'confirmed' ? 'bg-green-500/20 text-green-400 border-green-500/20' : 
          booking.status === 'cancelled' ? 'bg-red-500/20 text-red-400 border-red-500/20' : 
          booking.status === 'completed' ? 'bg-white/10 text-white/50 border-white/10' :
          'bg-kashmir-gold/20 text-kashmir-gold border-kashmir-gold/20'
        )}>
          {booking.status}
        </Badge>
        
        {/* Decorative Ticket Cutouts */}
        <div className="hidden md:block w-6 h-6 bg-[#0a0f12] rounded-full absolute -right-3 -top-3 shadow-inner" />
        <div className="hidden md:block w-6 h-6 bg-[#0a0f12] rounded-full absolute -right-3 -bottom-3 shadow-inner" />
      </div>

      {/* Middle - Details */}
      <div className="flex-1 p-6 md:p-8">
        <div className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2 flex items-center gap-2">
          <span>Booking REF:</span>
          <span className="font-mono bg-white/5 px-2 py-0.5 rounded text-white/80">{booking.id.toUpperCase().slice(0, 8)}</span>
        </div>
        <h3 className="font-display text-2xl font-bold text-white mb-6 leading-tight">{booking.itemName}</h3>
        
        <div className="flex flex-wrap items-center gap-6 text-sm text-white/60">
          <div className="flex items-center gap-3 bg-black/40 border border-white/5 px-4 py-2.5 rounded-xl">
            <Calendar className="h-5 w-5 text-kashmir-gold" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-white/40 font-bold">Date</span>
              <span className="font-semibold text-white">
                {new Date(booking.bookingDate).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-black/40 border border-white/5 px-4 py-2.5 rounded-xl">
            <CreditCard className="h-5 w-5 text-kashmir-gold" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-white/40 font-bold">Total Amount</span>
              <span className="font-semibold text-white">
                ₹{booking.totalAmount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Actions */}
      <div className="bg-white/5 p-6 md:w-56 flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-dashed border-white/20">
        
        {(booking.status === 'confirmed' || booking.status === 'pending') && (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500 hover:text-white rounded-xl font-bold">
                Cancel Trip
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl bg-[#111820] text-white border-white/10 shadow-2xl">
              <DialogHeader>
                <DialogTitle className="font-display text-2xl">Cancel Booking</DialogTitle>
              </DialogHeader>
              <div className="py-6">
                <div className="flex items-start gap-4 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 mb-6">
                  <AlertCircle className="h-6 w-6 shrink-0 mt-0.5" />
                  <p className="text-sm font-medium leading-relaxed">
                    Are you sure you want to cancel this booking? This action is permanent and cannot be undone. Standard cancellation policy applies.
                  </p>
                </div>
                <div className="bg-black/50 p-4 rounded-xl text-sm border border-white/5">
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
          <Button variant="gold" className="w-full rounded-xl shadow-[0_0_20px_rgba(212,175,55,0.2)] font-bold text-black">
            Book Again
          </Button>
        )}
      </div>

    </div>
  );
}
