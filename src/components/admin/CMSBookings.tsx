import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Car,
  Trash2,
  Plus,
  Sparkles
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { API_BASE_URL } from '@/lib/api';
import { toast } from 'sonner';
import { useTeamAuth } from '@/contexts/TeamAuthContext';
import { cn } from '@/lib/utils';

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
  details?: any;
}

export default function CMSBookings() {
  const navigate = useNavigate();
  const { systemEvents } = useTeamAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [customQuotePrice, setCustomQuotePrice] = useState<string>('');
  
  // Selected Booking State
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Delete Booking States
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<Booking | null>(null);

  // Creation States
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    type: 'cab',
    itemName: '',
    bookingDate: new Date().toISOString().split('T')[0] + 'T09:00',
    totalAmount: '',
    pickupLocation: '',
    dropLocation: '',
    pickupDateTime: '',
    dropDateTime: '',
  });

  const handleDeleteBooking = async (id: string) => {
    try {
      const token = localStorage.getItem('teamToken');
      const response = await fetch(`${API_BASE_URL}/bookings/${id}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        toast.success('Booking deleted successfully');
        fetchBookings();
        setSelectedBooking(null);
      } else {
        toast.error('Failed to delete booking');
      }
    } catch (error) {
      toast.error('Delete request failed');
    }
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('teamToken');
      
      let details: any = {};
      if (createForm.type === 'cab') {
        details = {
          pickupLocation: createForm.pickupLocation,
          dropLocation: createForm.dropLocation,
          pickupDateTime: createForm.pickupDateTime || createForm.bookingDate,
          dropDateTime: createForm.dropDateTime || createForm.bookingDate,
          tripType: 'custom',
          estimatedDistance: 100,
          paymentMethod: 'admin-manual'
        };
      }
      
      const body = {
        type: createForm.type,
        itemName: createForm.itemName,
        bookingDate: createForm.bookingDate,
        totalAmount: Number(createForm.totalAmount) || 0,
        clientName: createForm.clientName,
        clientEmail: createForm.clientEmail,
        clientPhone: createForm.clientPhone,
        details
      };

      const response = await fetch(`${API_BASE_URL}/bookings`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      
      if (response.ok) {
        toast.success('Manual booking created successfully');
        setCreateDialogOpen(false);
        fetchBookings();
        setCreateForm({
          clientName: '',
          clientEmail: '',
          clientPhone: '',
          type: 'cab',
          itemName: '',
          bookingDate: new Date().toISOString().split('T')[0] + 'T09:00',
          totalAmount: '',
          pickupLocation: '',
          dropLocation: '',
          pickupDateTime: '',
          dropDateTime: '',
        });
      } else {
        const errData = await response.json();
        toast.error(errData.error || 'Failed to create booking');
      }
    } catch (error) {
      toast.error('Connection failure');
    }
  };

  useEffect(() => {
    if (selectedBooking) {
      setCustomQuotePrice(selectedBooking.totalAmount ? selectedBooking.totalAmount.toString() : '');
    } else {
      setCustomQuotePrice('');
    }
  }, [selectedBooking]);

  useEffect(() => {
    fetchBookings();
  }, []);

  // Real-time updates trigger
  useEffect(() => {
    const latestEvent = systemEvents[0];
    if (latestEvent && latestEvent.booking && ('type' in latestEvent.booking || latestEvent.booking.entityType === 'booking')) {
      fetchBookings();
    }
  }, [systemEvents]);

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

  const updateStatus = async (id: string, status: string, amount?: number) => {
    try {
      const token = localStorage.getItem('teamToken');
      const body: any = { status };
      if (amount !== undefined) body.totalAmount = amount;

      const response = await fetch(`${API_BASE_URL}/bookings/${id}`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
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
          <Button 
            onClick={() => setCreateDialogOpen(true)}
            className="rounded-xl bg-kashmir-gold text-black hover:bg-kashmir-gold/90 text-[10px] font-black uppercase tracking-widest px-6 h-12"
          >
            <Plus className="w-4 h-4 mr-2" /> New Booking
          </Button>
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
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="w-12 h-12 rounded-xl text-red-500/40 hover:text-red-400 hover:bg-red-500/10 transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        setBookingToDelete(booking);
                        setDeleteConfirmOpen(true);
                      }}
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="w-12 h-12 rounded-xl text-white/20 group-hover:text-white group-hover:bg-white/5 transition-all">
                      <ChevronRight className="w-5 h-5" />
                    </Button>
                  </div>
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
        <DialogContent className="max-w-2xl bg-[#0d1216] border-white/10 text-white rounded-[3rem] p-10 max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
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
                    <div className="p-6 rounded-3xl bg-white/5 border border-white/5 space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 block">Financial Summary</label>
                      {selectedBooking.totalAmount > 0 ? (
                        <>
                          <p className="text-3xl font-display font-black text-white">₹{selectedBooking.totalAmount.toLocaleString()}</p>
                          <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mt-1">Confirmed Pricing</p>
                        </>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-sm font-bold text-kashmir-gold uppercase tracking-wider">Awaiting Quote</p>
                          <div className="flex gap-2 items-center">
                            <span className="text-xs text-white/40">₹</span>
                            <Input 
                              type="number"
                              placeholder="Enter Quote Price"
                              value={customQuotePrice}
                              onChange={(e) => setCustomQuotePrice(e.target.value)}
                              className="h-10 bg-white/5 border-white/5 rounded-xl text-white px-3 font-bold text-sm focus:ring-kashmir-gold/20"
                            />
                          </div>
                        </div>
                      )}
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

                {/* Linked Services or Cab Allocation Details */}
                {selectedBooking.type === 'cab' && (
                  <div className="p-6 rounded-3xl bg-white/5 border border-white/5 space-y-4">
                    <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Cab Allocation & Route Intelligence</h5>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-white/40 text-[10px] uppercase font-black tracking-wider">Pickup Location</p>
                        <p className="font-semibold text-white/90">{selectedBooking.details?.pickupLocation || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="text-white/40 text-[10px] uppercase font-black tracking-wider">Drop Location</p>
                        <p className="font-semibold text-white/90">{selectedBooking.details?.dropLocation || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="text-white/40 text-[10px] uppercase font-black tracking-wider">Schedule</p>
                        <p className="font-semibold text-white/90">
                          {selectedBooking.details?.pickupDateTime ? new Date(selectedBooking.details.pickupDateTime).toLocaleString() : 'Pending'}
                        </p>
                      </div>
                      <div>
                        <p className="text-white/40 text-[10px] uppercase font-black tracking-wider">Trip Category / Distance</p>
                        <p className="font-semibold text-white/90 font-mono">
                          {selectedBooking.details?.tripType === 'package-automation' ? 'Package Auto-Generated' : 'Custom Cab Booking'} 
                          {selectedBooking.details?.estimatedDistance ? ` (${selectedBooking.details.estimatedDistance} KM)` : ''}
                        </p>
                      </div>
                    </div>
                    
                    {/* Chauffeur Allocation */}
                    <div className="pt-4 border-t border-white/5">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mb-3">Vehicle & Driver Details</p>
                      {selectedBooking.details?.cabAllocation ? (
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-kashmir-gold/10 flex items-center justify-center text-kashmir-gold shrink-0">
                              <Car className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-bold text-white text-sm">{selectedBooking.details.cabAllocation.cabName} ({selectedBooking.details.cabAllocation.cabType})</p>
                              <p className="text-xs text-white/40 mt-0.5">
                                Driver: {selectedBooking.details.cabAllocation.driverName || 'Pending'} • Reg: {selectedBooking.details.cabAllocation.registrationNo || 'Pending'}
                              </p>
                            </div>
                          </div>
                          {selectedBooking.details.cabAllocation.driverPhone && (
                            <a 
                              href={`tel:${selectedBooking.details.cabAllocation.driverPhone}`} 
                              className="text-xs text-kashmir-gold hover:underline font-bold flex items-center gap-1"
                            >
                              <Phone className="w-3.5 h-3.5" /> Call Driver
                            </a>
                          )}
                        </div>
                      ) : (
                        <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/10 text-center">
                          <p className="text-xs text-red-400 font-bold">No cab or driver allocated yet. Manage this from the Cabs Fleet dashboard.</p>
                        </div>
                      )}
                    </div>

                    {/* Pricing / Finance Details */}
                    {selectedBooking.details?.cabAllocation?.pricing && (() => {
                      const pricing = selectedBooking.details.cabAllocation.pricing;
                      const profit = pricing.margin ?? 0;
                      const profitPercent = pricing.marginPercent ?? 0;
                      const isProfitable = profit >= 0;
                      
                      return (
                        <div className="pt-4 border-t border-white/5 space-y-3">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Operational Financial Summary</p>
                          <div className={cn(
                            "p-5 rounded-2xl border backdrop-blur-md relative overflow-hidden space-y-3 text-xs",
                            isProfitable ? "bg-emerald-500/5 border-emerald-500/10" : "bg-red-500/5 border-red-500/10"
                          )}>
                            <div className={cn(
                              "absolute top-0 right-0 w-24 h-24 blur-[40px] -mr-12 -mt-12 opacity-50",
                              isProfitable ? "bg-emerald-500/10" : "bg-red-500/10"
                            )} />

                            <div className="flex justify-between items-center text-white/50 text-[10px]">
                              <span>System Base Rate:</span>
                              <span className="font-mono">
                                ₹{(pricing.baseCost || 0).toLocaleString()} + ({pricing.estimatedKm || 0} KM × ₹{pricing.pricePerKm || 0}/KM)
                              </span>
                            </div>
                            
                            <div className="flex justify-between items-center text-sm font-bold text-white border-b border-white/5 pb-2">
                              <span>Total Revenue (Fare):</span>
                              <span className="text-kashmir-gold">₹{(selectedBooking.totalAmount || 0).toLocaleString()}</span>
                            </div>
                            
                            <div className="space-y-1.5 text-[10px] text-white/60">
                              <span className="text-[9px] font-black uppercase tracking-widest text-white/30 block mb-0.5">Operational Cost Breakdown</span>
                              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                <div className="flex justify-between">
                                  <span>Chauffeur Allowance:</span>
                                  <span className="font-mono">₹{(pricing.driverAllowance || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Fuel / Diesel:</span>
                                  <span className="font-mono">₹{(pricing.fuelExpenses || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Tolls & Parking:</span>
                                  <span className="font-mono">₹{(pricing.tollsExpenses || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Vendor Payout:</span>
                                  <span className="font-mono">₹{(pricing.vendorPayout || 0).toLocaleString()}</span>
                                </div>
                                {pricing.otherExpenses > 0 && (
                                  <div className="flex justify-between col-span-2">
                                    <span>Other Misc:</span>
                                    <span className="font-mono">₹{(pricing.otherExpenses || 0).toLocaleString()}</span>
                                  </div>
                                )}
                                <div className="flex justify-between col-span-2 mt-1.5 pt-1.5 border-t border-white/5 text-[11px] text-white/80 font-bold">
                                  <span>Total Operational Cost:</span>
                                  <span className="font-mono">₹{(pricing.totalCost || 0).toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex justify-between items-center pt-2 border-t border-white/5">
                              <div className="flex flex-col">
                                <span className="text-[9px] font-black uppercase tracking-widest text-white/30">Net Profit Margin</span>
                                <span className={cn("text-base font-black mt-0.5", isProfitable ? "text-emerald-400" : "text-red-400")}>
                                  ₹{profit.toLocaleString()}
                                </span>
                              </div>
                              <span className={cn(
                                "text-[9px] font-black uppercase px-2 py-0.5 rounded-lg",
                                isProfitable ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                              )}>
                                {profitPercent.toFixed(1)}% Margin
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Linked Package Booking info if any */}
                    {selectedBooking.details?.parentPackageBookingId && (() => {
                      const parentBooking = bookings.find(b => b.id === selectedBooking.details.parentPackageBookingId);
                      return parentBooking ? (
                        <div className="pt-4 border-t border-white/5">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mb-2">Linked Package</p>
                          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                            <div>
                              <p className="font-bold text-white text-sm">{parentBooking.itemName}</p>
                              <p className="text-xs text-white/40 mt-0.5">Client: {parentBooking.user.name} • Status: {parentBooking.status}</p>
                            </div>
                            <span className="text-[10px] font-mono border border-white/10 rounded px-2 py-0.5 text-white/40 uppercase">#{parentBooking.id.slice(-6)}</span>
                          </div>
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}

                {selectedBooking.type === 'package' && (() => {
                  const linkedCabBooking = bookings.find(b => b.type === 'cab' && b.details?.parentPackageBookingId === selectedBooking.id);
                  return linkedCabBooking ? (
                    <div className="p-6 rounded-3xl bg-white/5 border border-white/5 space-y-4">
                      <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Linked Cab Transfer Operations</h5>
                      <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-kashmir-gold/10 flex items-center justify-center text-kashmir-gold shrink-0">
                            <Car className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-white text-sm">{linkedCabBooking.itemName}</p>
                            <p className="text-xs text-white/40 mt-0.5">
                              {linkedCabBooking.details?.cabAllocation?.driverName ? (
                                `Driver: ${linkedCabBooking.details.cabAllocation.driverName} • Reg: ${linkedCabBooking.details.cabAllocation.registrationNo}`
                              ) : (
                                'Driver & Vehicle allocation pending'
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-emerald-500/10 text-emerald-400 border-none rounded-md px-2 py-0.5 text-[8px] font-black uppercase tracking-wider">
                            Auto-Generated
                          </Badge>
                          <span className="text-[10px] font-mono border border-white/10 rounded px-2 py-0.5 text-white/40 uppercase">#{linkedCabBooking.id.slice(-6)}</span>
                        </div>
                      </div>
                    </div>
                  ) : null;
                })()}

                {(() => {
                  let inquiryId = "";
                  if (selectedBooking.details) {
                    try {
                      const parsed = typeof selectedBooking.details === 'string'
                        ? JSON.parse(selectedBooking.details)
                        : selectedBooking.details;
                      inquiryId = parsed.inquiryId || "";
                    } catch (e) {}
                  }
                  if (!inquiryId) return null;
                  return (
                    <Button
                      onClick={() => {
                        navigate(`/sales/portal?inquiryId=${inquiryId}`);
                      }}
                      className="w-full bg-kashmir-gold text-black hover:bg-amber-500 rounded-xl h-14 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-kashmir-gold/15 mb-4"
                    >
                      <Sparkles className="w-4 h-4 mr-2" /> Open in Itinerary Builder
                    </Button>
                  );
                })()}

                <div className="pt-8 border-t border-white/5 flex flex-wrap gap-4">
                  <Button 
                    onClick={() => {
                      const quoteVal = selectedBooking.totalAmount > 0 ? undefined : Number(customQuotePrice);
                      if (selectedBooking.totalAmount === 0 && !quoteVal) {
                        toast.error('Please enter a quote price before confirming');
                        return;
                      }
                      updateStatus(selectedBooking.id, 'confirmed', quoteVal);
                    }}
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
                  <Button 
                    onClick={() => {
                      setBookingToDelete(selectedBooking);
                      setDeleteConfirmOpen(true);
                    }}
                    className="flex-grow bg-rose-500/10 text-rose-500 hover:bg-rose-600 hover:text-white rounded-xl h-14 font-black text-[10px] uppercase tracking-widest border border-rose-500/25"
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Delete Record
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Booking Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl bg-[#0d1216] border-white/10 text-white rounded-[3rem] p-10 max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
          <DialogHeader>
            <DialogTitle className="text-3xl font-display font-bold text-white mb-2">New Manual Booking</DialogTitle>
            <p className="text-white/40 text-xs uppercase tracking-widest font-black">Register a new client booking manually</p>
          </DialogHeader>

          <form onSubmit={handleCreateBooking} className="py-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-white/40">Client Name</label>
                <Input
                  required
                  placeholder="e.g. John Doe"
                  value={createForm.clientName}
                  onChange={(e) => setCreateForm({ ...createForm, clientName: e.target.value })}
                  className="bg-white/5 border-white/5 rounded-xl h-12 text-sm focus:ring-kashmir-gold/20"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-white/40">Client Email</label>
                <Input
                  required
                  type="email"
                  placeholder="e.g. john@example.com"
                  value={createForm.clientEmail}
                  onChange={(e) => setCreateForm({ ...createForm, clientEmail: e.target.value })}
                  className="bg-white/5 border-white/5 rounded-xl h-12 text-sm focus:ring-kashmir-gold/20"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-white/40">Client Phone (Optional)</label>
                <Input
                  placeholder="e.g. +91 9906XXXXXX"
                  value={createForm.clientPhone}
                  onChange={(e) => setCreateForm({ ...createForm, clientPhone: e.target.value })}
                  className="bg-white/5 border-white/5 rounded-xl h-12 text-sm focus:ring-kashmir-gold/20"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-white/40">Booking Type</label>
                <select
                  value={createForm.type}
                  onChange={(e) => setCreateForm({ ...createForm, type: e.target.value as any })}
                  className="w-full bg-[#111820] border border-white/10 rounded-xl h-12 px-3 text-sm text-white focus:ring-kashmir-gold/20"
                >
                  <option value="cab">Cab Transfer</option>
                  <option value="hotel">Hotel Stay</option>
                  <option value="package">Holiday Package</option>
                </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-white/40">Service / Item Name</label>
                <Input
                  required
                  placeholder={
                    createForm.type === 'cab' ? "e.g. Toyota Innova: Srinagar Airport Transfer" :
                    createForm.type === 'hotel' ? "e.g. 4-Night Luxury Stay: Khyber Resort Gulmarg" :
                    "e.g. 6 Days Kashmir Paradise Package"
                  }
                  value={createForm.itemName}
                  onChange={(e) => setCreateForm({ ...createForm, itemName: e.target.value })}
                  className="bg-white/5 border-white/5 rounded-xl h-12 text-sm focus:ring-kashmir-gold/20"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-white/40">Scheduled Date</label>
                <Input
                  required
                  type="datetime-local"
                  value={createForm.bookingDate}
                  onChange={(e) => setCreateForm({ ...createForm, bookingDate: e.target.value })}
                  className="bg-white/5 border-white/5 rounded-xl h-12 text-sm focus:ring-kashmir-gold/20"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-white/40">Agreed Amount (INR)</label>
                <Input
                  required
                  type="number"
                  placeholder="e.g. 15000"
                  value={createForm.totalAmount}
                  onChange={(e) => setCreateForm({ ...createForm, totalAmount: e.target.value })}
                  className="bg-white/5 border-white/5 rounded-xl h-12 text-sm focus:ring-kashmir-gold/20"
                />
              </div>
            </div>

            {/* Cab Specific Details */}
            {createForm.type === 'cab' && (
              <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-kashmir-gold">Cab Route & Schedule Setup</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-wider text-white/40">Pickup Location</label>
                    <Input
                      placeholder="e.g. Srinagar Airport (SXR)"
                      value={createForm.pickupLocation}
                      onChange={(e) => setCreateForm({ ...createForm, pickupLocation: e.target.value })}
                      className="bg-white/5 border-white/5 rounded-xl h-10 text-xs focus:ring-kashmir-gold/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-wider text-white/40">Drop Location</label>
                    <Input
                      placeholder="e.g. Gulmarg Resort"
                      value={createForm.dropLocation}
                      onChange={(e) => setCreateForm({ ...createForm, dropLocation: e.target.value })}
                      className="bg-white/5 border-white/5 rounded-xl h-10 text-xs focus:ring-kashmir-gold/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-wider text-white/40">Pickup Date & Time</label>
                    <Input
                      type="datetime-local"
                      value={createForm.pickupDateTime}
                      onChange={(e) => setCreateForm({ ...createForm, pickupDateTime: e.target.value })}
                      className="bg-white/5 border-white/5 rounded-xl h-10 text-xs focus:ring-kashmir-gold/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-wider text-white/40">Drop Date & Time</label>
                    <Input
                      type="datetime-local"
                      value={createForm.dropDateTime}
                      onChange={(e) => setCreateForm({ ...createForm, dropDateTime: e.target.value })}
                      className="bg-white/5 border-white/5 rounded-xl h-10 text-xs focus:ring-kashmir-gold/20"
                    />
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="pt-6 border-t border-white/5 flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
                className="flex-1 rounded-xl h-12 text-[10px] font-black uppercase tracking-widest bg-white/5 border-white/5"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 rounded-xl h-12 text-[10px] font-black uppercase tracking-widest bg-kashmir-gold text-black hover:bg-kashmir-gold/90 border-none"
              >
                Confirm Booking
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation AlertDialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="bg-[#0d1216] border-white/10 text-white rounded-[3rem] p-10 max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-display font-bold text-white">Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60 text-sm mt-3">
              This action will physically delete the booking <strong className="text-white">"{bookingToDelete?.itemName}"</strong> (Ref: #{bookingToDelete?.id.slice(-6)}) from the system database. This action is irreversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 flex gap-4">
            <AlertDialogCancel className="flex-1 rounded-xl h-12 text-[10px] font-black uppercase tracking-widest bg-white/5 border-white/5 text-white hover:bg-white/10 hover:text-white border-none">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (bookingToDelete) {
                  handleDeleteBooking(bookingToDelete.id);
                  setDeleteConfirmOpen(false);
                }
              }}
              className="flex-1 rounded-xl h-12 text-[10px] font-black uppercase tracking-widest bg-red-600 text-white hover:bg-red-700 border-none"
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
