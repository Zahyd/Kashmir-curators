import { useState, useEffect } from 'react';
import { 
  Package, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  FileText,
  Download,
  IndianRupee,
  ChevronRight,
  MoreVertical,
  Mail,
  Phone,
  Building,
  Car
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { API_BASE_URL } from '@/lib/api';
import { toast } from 'sonner';

interface Booking {
  id: string;
  userId: string;
  user: {
    name: string;
    email: string;
    phone: string | null;
  };
  entityId?: string;
  type: 'package' | 'hotel' | 'cab';
  itemName: string;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  bookingDate: string;
  createdAt: string;
}

export default function CMSBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('teamToken');
      const response = await fetch(`${API_BASE_URL}/bookings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setBookings(data || []);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const token = localStorage.getItem('teamToken');
      const response = await fetch(`${API_BASE_URL}/bookings/${id}`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      
      if (response.ok) {
        toast.success(`Booking status updated to ${status}`);
        fetchBookings();
        setSelectedBooking(null);
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const filteredBookings = bookings.filter(b => {
    const matchesSearch = 
      b.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed': return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Confirmed</Badge>;
      case 'pending': return <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20">Pending</Badge>;
      case 'cancelled': return <Badge className="bg-red-500/10 text-red-400 border-red-500/20">Cancelled</Badge>;
      case 'completed': return <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">Completed</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 text-kashmir-gold text-[10px] font-black uppercase tracking-[0.3em] mb-2">
            <Package className="w-4 h-4" />
            <span>Master Booking Engine</span>
          </div>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight">Enterprise Bookings</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl bg-white/5 border-white/5 text-[10px] font-black uppercase tracking-widest px-6 h-12">
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
        </div>
      </div>

      <Card className="bg-white/[0.03] border-white/5 p-8 rounded-[2.5rem] backdrop-blur-xl">
        <div className="flex flex-col md:flex-row gap-6 mb-10">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            <Input 
              placeholder="Search by client name, ID or service..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 bg-white/5 border-white/5 rounded-2xl h-14 text-sm focus:ring-kashmir-gold/20"
            />
          </div>
          <div className="flex gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-14 px-6 rounded-2xl bg-white/5 border-white/5 gap-2 text-xs font-bold uppercase tracking-widest">
                  <Filter className="w-4 h-4" /> {statusFilter === 'all' ? 'All Status' : statusFilter}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-[#111820] border-white/10 text-white rounded-xl">
                <DropdownMenuItem onClick={() => setStatusFilter('all')}>All Status</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('pending')}>Pending</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('confirmed')}>Confirmed</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('completed')}>Completed</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('cancelled')}>Cancelled</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <div 
              key={booking.id}
              className="p-6 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all group cursor-pointer"
              onClick={() => setSelectedBooking(booking)}
            >
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 group-hover:bg-kashmir-gold/10 group-hover:text-kashmir-gold transition-all shrink-0">
                    {booking.type === 'package' ? <Package className="w-6 h-6" /> : 
                     booking.type === 'hotel' ? <Building className="w-6 h-6" /> : <Car className="w-6 h-6" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-bold text-white group-hover:text-kashmir-gold transition-colors">{booking.itemName}</h3>
                      <Badge variant="outline" className="text-[8px] font-mono border-white/10 text-white/40 uppercase">#{booking.id.slice(-6)}</Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                      <p className="text-xs text-white/40 flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {booking.user.name}</p>
                      <p className="text-xs text-white/40 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {new Date(booking.bookingDate).toLocaleDateString()}</p>
                      <p className="text-xs font-bold text-kashmir-gold flex items-center gap-1.5"><IndianRupee className="w-3.5 h-3.5" /> {booking.totalAmount.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6 w-full lg:w-auto justify-between lg:justify-end">
                  <div className="text-right hidden sm:block">
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-1.5">Payment State</p>
                    {getStatusBadge(booking.status)}
                  </div>
                  <Button variant="ghost" size="icon" className="w-12 h-12 rounded-xl text-white/20 group-hover:text-white group-hover:bg-white/5 transition-all">
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {filteredBookings.length === 0 && (
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <Package className="w-12 h-12 text-white/10 mb-4" />
              <p className="text-white/40 font-bold uppercase tracking-widest text-sm">No bookings found</p>
            </div>
          )}
        </div>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent className="max-w-2xl bg-[#0d1216] border-white/10 text-white rounded-[3rem] p-10">
          {selectedBooking && (
            <>
              <DialogHeader>
                <DialogTitle className="text-3xl font-display font-bold">Booking Intelligence</DialogTitle>
                <p className="text-white/40 text-xs uppercase tracking-widest font-black mt-2">REF: {selectedBooking.id}</p>
              </DialogHeader>
              
              <div className="py-8 space-y-10">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 block mb-2">Customer Details</label>
                      <h4 className="text-xl font-bold text-white">{selectedBooking.user.name}</h4>
                      <p className="text-sm text-white/40 flex items-center gap-2 mt-1"><Mail className="w-3.5 h-3.5" /> {selectedBooking.user.email}</p>
                      {selectedBooking.user.phone && (
                        <p className="text-sm text-white/40 flex items-center gap-2 mt-1"><Phone className="w-3.5 h-3.5" /> {selectedBooking.user.phone}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 block mb-2">Service Selection</label>
                      <h4 className="text-lg font-bold text-kashmir-gold">{selectedBooking.itemName}</h4>
                      <p className="text-xs text-white/40 uppercase tracking-widest mt-1">{selectedBooking.type}</p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="p-6 rounded-3xl bg-white/5 border border-white/5">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 block mb-2">Financial Summary</label>
                      <p className="text-3xl font-display font-black text-white">₹{selectedBooking.totalAmount.toLocaleString()}</p>
                      <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mt-2">Gross Transaction</p>
                    </div>
                    <div className="flex gap-4 items-center">
                      <div className="flex-1">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 block mb-2">Current State</label>
                        {getStatusBadge(selectedBooking.status)}
                      </div>
                      <div className="flex-1">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 block mb-2">Booking Date</label>
                        <p className="text-sm font-bold text-white">{new Date(selectedBooking.bookingDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t border-white/5 flex flex-wrap gap-4">
                  <Button 
                    onClick={() => updateStatus(selectedBooking.id, 'confirmed')}
                    className="flex-1 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-black rounded-xl h-14 font-black text-[10px] uppercase tracking-widest border border-emerald-500/20"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Confirm & Issue
                  </Button>
                  <Button 
                    onClick={() => updateStatus(selectedBooking.id, 'completed')}
                    className="flex-1 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white rounded-xl h-14 font-black text-[10px] uppercase tracking-widest border border-blue-500/20"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Mark Completed
                  </Button>
                  <Button 
                    onClick={() => updateStatus(selectedBooking.id, 'cancelled')}
                    className="flex-1 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-xl h-14 font-black text-[10px] uppercase tracking-widest border border-red-500/20"
                  >
                    <XCircle className="w-4 h-4 mr-2" /> Terminate/Refund
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
