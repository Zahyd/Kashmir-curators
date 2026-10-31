import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useTeamAuth, SALES_AGENTS } from '@/contexts/TeamAuthContext';
import { API_BASE_URL } from '@/lib/api';

import { 
  Eye, 
  FileUp, 
  Loader2, 
  Search, 
  CheckCircle2, 
  MoreVertical, 
  X, 
  Filter, 
  ArrowUpDown, 
  Download,
  Mail,
  Phone,
  Calendar,
  ChevronDown,
  Trash2,
  Users,
  PlusCircle,
  Sparkles,
  UserPlus,
  Plane
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem
} from '@/components/ui/dropdown-menu';



export default function CMSInquiries() {
  const navigate = useNavigate();
  const { teamUser, hasPermission, systemEvents } = useTeamAuth();
  const canAssign = hasPermission('assign_leads');
  const [searchTerm, setSearchTerm] = useState('');
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInquiry, setSelectedInquiry] = useState<any | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);

  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isCreatingManual, setIsCreatingManual] = useState(false);
  const [manualForm, setManualForm] = useState({
    customerName: '',
    email: '',
    phone: '',
    destination: 'Kashmir',
    duration: '6 Days',
    travelers: '2',
    budget: 'Premium',
    accommodation: 'Premium Hotel',
    assignedTo: ''
  });

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingManual(true);

    try {
      const token = localStorage.getItem('teamToken');
      
      const response = await fetch(`${API_BASE_URL}/inquiries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          customerName: manualForm.customerName,
          email: manualForm.email,
          phone: manualForm.phone,
          destination: manualForm.destination,
          duration: manualForm.duration,
          travelers: manualForm.travelers,
          budget: manualForm.budget,
          accommodation: manualForm.accommodation
        })
      });

      if (!response.ok) throw new Error('Failed to create inquiry');
      const newInquiry = await response.json();

      if (manualForm.assignedTo) {
        const assignResponse = await fetch(`${API_BASE_URL}/inquiries/${newInquiry.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ 
            assignedTo: manualForm.assignedTo,
            status: 'Pending Curation'
          })
        });

        if (!assignResponse.ok) {
          toast.warning('Inquiry created, but failed to assign agent.');
        }
      }

      toast.success('Manual inquiry created successfully!');
      fetchInquiries();
      setIsManualModalOpen(false);
      
      setManualForm({
        customerName: '',
        email: '',
        phone: '',
        destination: 'Kashmir',
        duration: '6 Days',
        travelers: '2',
        budget: 'Premium',
        accommodation: 'Premium Hotel',
        assignedTo: ''
      });
    } catch (error) {
      console.error(error);
      toast.error('Failed to create manual inquiry.');
    } finally {
      setIsCreatingManual(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  // Real-time synchronization
  useEffect(() => {
    const latestEvent = systemEvents[0];
    if (latestEvent && latestEvent.booking) {
      if (latestEvent.booking.entityType === 'inquiry') {
        fetchInquiries();
      } else if (latestEvent.booking.entityType === 'support') {
        toast.info('New Concierge Request', {
          description: latestEvent.message,
          icon: '🛎️'
        });
      }
    }
  }, [systemEvents]);

  const fetchInquiries = async () => {
    try {
      const token = localStorage.getItem('teamToken');
      const response = await fetch(`${API_BASE_URL}/inquiries`, {

        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      // Robustically handle cases where backend returns an error object instead of an array
      if (Array.isArray(data)) {
        setInquiries(data);
      } else {
        console.error('Expected array of inquiries, but received:', data);
        setInquiries([]);
      }
    } catch (error) {
      console.error('Failed to fetch inquiries:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatId = (id: string, leadId?: string) => {
    if (leadId) return leadId;
    if (!id) return '';
    return id.includes('-') ? `KC-${id.split('-')[0].toUpperCase()}` : `KC-${id.substring(0, 8).toUpperCase()}`;
  };

  
  const handleExportCSV = () => {
    if (filteredInquiries.length === 0) {
      toast.error('No inquiries available to export');
      return;
    }
    const headers = ['Inquiry ID', 'Customer Name', 'Email', 'Phone', 'Destination', 'Duration', 'Travelers', 'Budget', 'Status', 'Assigned Agent', 'Date'];
    const rows = filteredInquiries.map(inq => [
      formatId(inq.id, inq.leadId),
      `"${(inq.customerName || '').replace(/"/g, '""')}"`,
      inq.email || '',
      inq.phone || '',
      `"${(inq.destination || '').replace(/"/g, '""')}"`,
      inq.duration || '',
      inq.travelers || '2',
      inq.budget || '',
      inq.status || '',
      inq.assignedTo || 'Unassigned',
      inq.date || (inq.createdAt ? new Date(inq.createdAt).toLocaleDateString() : '')
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `kashmir_curators_inquiries_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${filteredInquiries.length} inquiries to CSV successfully!`);
  };

  const filteredInquiries = inquiries.filter(inq => {
    const displayId = formatId(inq.id, inq.leadId);
    const matchesSearch = displayId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         inq.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (inq.leadId && inq.leadId.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (inq.leadCategory && inq.leadCategory.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         inq.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         inq.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter.length === 0 || statusFilter.includes(inq.status);
    return matchesSearch && matchesStatus;
  });


  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('teamToken');
      const response = await fetch(`${API_BASE_URL}/inquiries/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        setInquiries(inquiries.map(inq => inq.id === id ? { ...inq, status: newStatus } : inq));
        toast.success(`Inquiry synchronized to ${newStatus}`);
      }
    } catch (error) {
      toast.error('Failed to update inquiry status');
    }
  };

  const handleAssign = async (inquiryId: string, agentCode: string) => {
    try {
      const token = localStorage.getItem('teamToken');
      const response = await fetch(`${API_BASE_URL}/inquiries/${inquiryId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          assignedTo: agentCode,
          status: 'Pending Curation'
        })
      });

      if (response.ok) {
        const agent = SALES_AGENTS.find(a => a.code === agentCode);
        setInquiries(inquiries.map(inq => 
          inq.id === inquiryId 
            ? { ...inq, assignedTo: agentCode, status: 'Pending Curation' } 
            : inq
        ));
        toast.success(`Assigned to ${agent?.name || agentCode}`);
      }
    } catch (error) {
      toast.error('Failed to assign inquiry');
    }
  };

  const handleUploadPDF = async (file: File) => {
    if (!selectedInquiry) return;
    setIsUploading(true);
    
    try {
      const token = localStorage.getItem('teamToken');
      
      // 1. Upload file to Media API
      const formData = new FormData();
      formData.append('file', file);
      
      const uploadRes = await fetch(`${API_BASE_URL}/media/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      
      if (!uploadRes.ok) throw new Error('Upload failed');
      const mediaData = await uploadRes.json();
      
      // 2. Update Inquiry with PDF URL and Status
      const updateRes = await fetch(`${API_BASE_URL}/inquiries/${selectedInquiry.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          proposalUrl: mediaData.url,
          status: 'Ready for Review'
        })
      });

      if (updateRes.ok) {
        setInquiries(inquiries.map(inq => inq.id === selectedInquiry.id ? { ...inq, status: 'Ready for Review', proposalUrl: mediaData.url } : inq));
        toast.success('Enterprise Proposal deployed successfully!');
        setIsUploadModalOpen(false);
        setSelectedInquiry(null);
      }
    } catch (error) {
      console.error('Proposal deployment error:', error);
      toast.error('Failed to deploy proposal');
    } finally {
      setIsUploading(false);
    }
  };

  const toggleStatusFilter = (status: string) => {
    setStatusFilter(prev => 
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      {/* Strategic Command & Search Bar */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 xl:gap-6">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3.5 w-full xl:w-auto flex-1 max-w-3xl">
          <div className="relative flex-1 group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-amber-400/60 group-focus-within:text-amber-400 transition-colors" />
            </div>
            <Input 
              placeholder="Search Inquiries (ID, Guest, Phone, Destination)..." 
              className="pl-12 bg-white/[0.04] border border-white/15 focus:border-amber-400/60 focus:ring-2 focus:ring-amber-400/10 text-white placeholder:text-white/40 h-13 rounded-2xl text-sm transition-all duration-300 shadow-inner"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-13 bg-white/[0.04] border border-white/15 hover:border-amber-400/40 text-white/90 hover:text-white hover:bg-white/[0.08] gap-2.5 px-5 rounded-2xl transition-all shadow-sm">
                <Filter className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-black uppercase tracking-wider">Filters</span>
                {statusFilter.length > 0 && (
                  <Badge className="bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full font-black text-[9px] shadow-sm">{statusFilter.length}</Badge>
                )}
                <ChevronDown className="w-3.5 h-3.5 opacity-40 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-72 bg-[#0a0f14]/98 backdrop-blur-2xl border-amber-500/20 text-white p-2 rounded-2xl shadow-2xl" align="end">
              <DropdownMenuItem onClick={() => fetchInquiries()} className="cursor-pointer p-3 rounded-xl gap-3 text-amber-300 font-bold hover:bg-amber-400/10">
                <ArrowUpDown className="w-4 h-4 text-amber-400" /> Refresh Intelligence Queue
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10 mx-2" />
              <DropdownMenuLabel className="px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Filter by Status</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10 mx-2" />
              {[
                { label: 'New Requests', id: 'New' },
                { label: 'Active Curation', id: 'Pending Curation' },
                { label: 'Fulfilled Nodes', id: 'Ready for Review' }
              ].map(status => (
                <DropdownMenuCheckboxItem 
                  key={status.id}
                  checked={statusFilter.includes(status.id)}
                  onCheckedChange={() => toggleStatusFilter(status.id)}
                  className="cursor-pointer p-3 rounded-xl focus:bg-amber-400/10 focus:text-amber-200"
                >
                  <span className="text-xs font-bold">{status.label}</span>
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator className="bg-white/10 mx-2" />
              <DropdownMenuItem 
                onClick={() => setStatusFilter([])}
                className="text-center justify-center text-amber-300 text-[10px] font-black uppercase tracking-widest p-2.5 cursor-pointer hover:bg-amber-400/10 rounded-xl"
              >
                Reset All Filters
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
          <Button variant="outline" onClick={handleExportCSV} className="flex-1 xl:flex-none h-13 bg-white/[0.04] border border-white/15 hover:border-amber-400/40 text-white/90 hover:text-white hover:bg-white/[0.08] px-6 rounded-2xl transition-all shadow-sm group cursor-pointer">
            <Download className="w-4 h-4 mr-2.5 text-amber-400 group-hover:-translate-y-0.5 transition-transform" />
            <span className="text-xs font-black uppercase tracking-wider">Export CSV</span>
          </Button>
          <Button 
            onClick={() => setIsManualModalOpen(true)}
            className="flex-1 xl:flex-none h-13 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-slate-950 font-black px-7 rounded-2xl shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2"
          >
            <PlusCircle className="w-4 h-4 text-slate-950" />
            <span className="text-xs font-black uppercase tracking-wider">Manual Entry</span>
          </Button>
        </div>
      </div>

      {/* High-Fidelity Intelligence Table */}
      {/* Desktop Table View */}
      <Card className="hidden lg:block bg-[#0a0f14]/90 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl shadow-black/50 overflow-hidden relative group">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />
        
        <div className="overflow-x-auto relative z-10 custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[980px]">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                <th className="px-6 py-5 font-black text-amber-200/80 text-[10px] uppercase tracking-[0.25em] w-40">Lead Reference</th>
                <th className="px-6 py-5 font-black text-amber-200/80 text-[10px] uppercase tracking-[0.25em] min-w-[240px]">Guest Profile</th>
                <th className="px-6 py-5 font-black text-amber-200/80 text-[10px] uppercase tracking-[0.25em] min-w-[260px]">Itinerary & Route</th>
                <th className="px-6 py-5 font-black text-amber-200/80 text-[10px] uppercase tracking-[0.25em] w-48">Pipeline Status</th>
                {canAssign && (
                  <th className="px-6 py-5 font-black text-amber-200/80 text-[10px] uppercase tracking-[0.25em] min-w-[190px]">Lead Liaison</th>
                )}
                <th className="px-6 py-5 font-black text-amber-200/80 text-[10px] uppercase tracking-[0.25em] text-right w-44">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredInquiries.map((inq) => (
                <tr key={inq.id} className="hover:bg-white/[0.04] transition-all duration-200 group/row">
                  <td className="px-6 py-5 align-top">
                    <div className="space-y-1.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-400/10 border border-amber-400/30 text-amber-300 font-mono font-bold text-xs shadow-sm group-hover/row:border-amber-400/60 transition-colors">
                        {formatId(inq.id, inq.leadId)}
                      </span>
                      <div className="flex items-center gap-1.5 text-[10px] text-white/50 font-semibold uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400/60" />
                        <span>{inq.date}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        {typeof inq.leadScore === 'number' && inq.leadScore > 0 && (
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-md shadow-sm ${
                            inq.leadScore >= 75 ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                            inq.leadScore >= 50 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                            'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          }`}>
                            {inq.leadScore >= 75 ? '🔥' : inq.leadScore >= 50 ? '⚡' : '🌱'} {inq.leadScore} Score
                          </span>
                        )}
                        {inq.leadCategory && (
                          <span className="text-[9px] text-amber-300/90 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-md font-mono truncate max-w-[130px]">
                            {inq.leadCategory.replace(/_/g, ' ')}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 align-top">
                    <div className="flex items-start gap-3.5">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500/20 via-amber-400/10 to-transparent border border-amber-400/30 flex items-center justify-center text-amber-300 font-black text-base relative shadow-md overflow-hidden shrink-0">
                        <span>{inq.customerName.charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="space-y-1 min-w-0">
                        <span className="text-white font-bold text-sm block tracking-tight truncate group-hover/row:text-amber-200 transition-colors">
                          {inq.customerName}
                        </span>
                        <div className="flex flex-col gap-0.5">
                          {inq.email && (
                            <a 
                              href={`mailto:${inq.email}`} 
                              className="text-white/50 hover:text-amber-300 text-xs flex items-center gap-1.5 transition-colors truncate"
                              title={inq.email}
                            >
                              <Mail className="w-3 h-3 text-amber-400/60 shrink-0" />
                              <span className="truncate">{inq.email}</span>
                            </a>
                          )}
                          {inq.phone && (
                            <a 
                              href={`tel:${inq.phone}`} 
                              className="text-emerald-400/80 hover:text-emerald-300 text-[11px] font-mono flex items-center gap-1.5 transition-colors"
                            >
                              <Phone className="w-3 h-3 text-emerald-400/60 shrink-0" />
                              <span>{inq.phone}</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 align-top max-w-[280px]">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white font-bold text-sm tracking-tight flex items-center gap-1.5">
                          <Plane className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>{inq.destination}</span>
                        </span>
                        <span className="text-[10px] text-amber-300/80 font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 border border-white/10 shrink-0">
                          {inq.duration}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 items-center">
                        {inq.accommodation && (
                          <Badge 
                            variant="outline" 
                            className="bg-white/5 border-white/15 text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 text-white/70 max-w-[190px] truncate block"
                            title={inq.accommodation}
                          >
                            {inq.accommodation}
                          </Badge>
                        )}
                        {inq.budget && (
                          <Badge 
                            variant="outline" 
                            className="bg-amber-400/10 border-amber-400/30 text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 text-amber-300 shrink-0"
                          >
                            {inq.budget}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 align-top">
                    <Badge className={cn(
                      "px-3.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.18em] border shadow-md inline-flex items-center gap-2",
                      inq.status === 'New' ? 'bg-blue-500/15 text-blue-300 border-blue-500/30 shadow-[0_0_12px_rgba(59,130,246,0.15)]' :
                      inq.status === 'Pending Curation' ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.15)]' :
                      'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                    )}>
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        inq.status === 'New' ? 'bg-blue-400 animate-pulse' :
                        inq.status === 'Pending Curation' ? 'bg-amber-400 animate-pulse' :
                        'bg-emerald-400 animate-pulse'
                      )} />
                      <span>{inq.status}</span>
                    </Badge>
                  </td>
                  {canAssign && (
                    <td className="px-6 py-5 align-top">
                      {inq.assignedTo ? (
                        <div className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl bg-white/[0.03] border border-white/10">
                          <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                            <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white">{SALES_AGENTS.find(a => a.code === inq.assignedTo)?.name || inq.assignedTo}</p>
                            <p className="text-[9px] text-white/40 font-mono">{inq.assignedTo}</p>
                          </div>
                        </div>
                      ) : (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-9 px-3.5 rounded-xl bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 border border-blue-500/25 gap-2 text-[10px] font-black uppercase tracking-wider">
                              <UserPlus className="w-3.5 h-3.5" />
                              <span>Assign</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-56 bg-[#0a0f14]/98 backdrop-blur-2xl border-amber-500/20 text-white p-2 rounded-2xl shadow-2xl">
                            <DropdownMenuLabel className="px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Select Agent</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-white/10 mx-2" />
                            {SALES_AGENTS.map(agent => (
                              <DropdownMenuItem 
                                key={agent.code}
                                onClick={() => handleAssign(inq.id, agent.code)}
                                className="cursor-pointer p-2.5 rounded-xl gap-3 hover:bg-white/10 focus:bg-white/10"
                              >
                                <div className="w-6 h-6 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                                  <UserPlus className="w-3 h-3 text-emerald-400" />
                                </div>
                                <div>
                                  <p className="text-xs font-bold">{agent.name}</p>
                                  <p className="text-[9px] text-white/40 font-mono">{agent.code}</p>
                                </div>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </td>
                  )}
                  <td className="px-6 py-5 align-top text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* WhatsApp Quick Connect */}
                      {inq.phone && (
                        <a
                          href={`https://wa.me/${inq.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${inq.customerName}, this is Kashmir Curators regarding your luxury travel inquiry (${inq.destination}, ${inq.duration}). How may our executive concierge assist with your curation?`)}`}
                          target="_blank"
                          rel="noreferrer"
                          title="WhatsApp Quick Dispatch"
                          className="h-10 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 text-xs font-bold transition-all shadow-sm"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span className="hidden xl:inline text-[11px]">Chat</span>
                        </a>
                      )}

                      <Button 
                        variant="ghost" 
                        size="icon" 
                        title="View Full Lead Intelligence"
                        onClick={() => setSelectedInquiry(inq)}
                        className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:border-amber-400/40 hover:bg-amber-400/10 text-white/70 hover:text-amber-300 transition-all duration-200"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 text-white/50 hover:text-white transition-all duration-200">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-64 bg-[#0a0f14]/98 backdrop-blur-2xl border-amber-500/20 text-white p-2 rounded-2xl shadow-2xl">
                          <DropdownMenuLabel className="px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Node Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator className="bg-white/10 mx-2" />
                          <DropdownMenuItem onClick={() => handleStatusChange(inq.id, 'New')} className="cursor-pointer p-2.5 rounded-xl gap-3 hover:bg-white/5">
                            <div className="w-2 h-2 rounded-full bg-blue-400" />
                            <span className="text-xs font-bold">Synchronize as New</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(inq.id, 'Pending Curation')} className="cursor-pointer p-2.5 rounded-xl gap-3 hover:bg-white/5">
                            <div className="w-2 h-2 rounded-full bg-amber-400" />
                            <span className="text-xs font-bold">Initialize Curation</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-white/10 mx-2" />
                          <DropdownMenuItem 
                            onClick={() => { setSelectedInquiry(inq); setIsUploadModalOpen(true); }}
                            className="text-amber-300 font-bold p-2.5 rounded-xl gap-3 hover:bg-amber-400/10 focus:bg-amber-400/10 cursor-pointer"
                          >
                            <FileUp className="w-4 h-4 text-amber-400" /> 
                            <span className="text-xs">Deploy Bespoke Proposal</span>
                          </DropdownMenuItem>
                          {canAssign && inq.assignedTo && (
                            <>
                              <DropdownMenuSeparator className="bg-white/10 mx-2" />
                              <DropdownMenuLabel className="px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Reassign Agent</DropdownMenuLabel>
                              {SALES_AGENTS.filter(a => a.code !== inq.assignedTo).map(agent => (
                                <DropdownMenuItem 
                                  key={agent.code}
                                  onClick={() => handleAssign(inq.id, agent.code)}
                                  className="cursor-pointer p-2.5 rounded-xl gap-3 hover:bg-white/5 focus:bg-white/5"
                                >
                                  <UserPlus className="w-4 h-4 text-blue-400" />
                                  <span className="text-xs font-bold">{agent.name}</span>
                                </DropdownMenuItem>
                              ))}
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredInquiries.length === 0 && (
            <div className="p-24 text-center flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500">
              <div className="w-20 h-20 rounded-3xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center mb-6">
                <Search className="w-8 h-8 text-amber-400" />
              </div>
              <h3 className="text-xl font-display font-bold text-white mb-2">No Matching Inquiries Found</h3>
              <p className="text-white/40 text-sm max-w-sm mb-6 font-medium">No intelligence nodes match your current filtering parameters. Adjust your search keywords or clear status filters.</p>
              <Button variant="outline" onClick={() => { setSearchTerm(''); setStatusFilter([]); }} className="h-11 bg-amber-400/15 border border-amber-400/30 text-amber-300 hover:bg-amber-400 hover:text-black rounded-xl font-black text-xs uppercase tracking-wider px-6 transition-all">
                Reset All Filters
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Mobile Card View */}
      <div className="grid grid-cols-1 gap-5 lg:hidden">
        {filteredInquiries.map((inq) => (
          <Card key={inq.id} className="bg-[#0a0f14]/95 border border-white/10 backdrop-blur-2xl rounded-3xl overflow-hidden shadow-2xl p-6 relative group">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent pointer-events-none" />
            
            <div className="flex justify-between items-start mb-5 relative z-10">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-amber-400/10 border border-amber-400/30 text-amber-300 font-mono font-bold text-xs">
                  {formatId(inq.id, inq.leadId)}
                </span>
                <p className="text-[10px] text-white/50 uppercase tracking-wider font-bold mt-1">{inq.date}</p>
              </div>
              <Badge className={cn(
                "px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider border shadow-sm",
                inq.status === 'New' ? 'bg-blue-500/15 text-blue-300 border-blue-500/30' :
                inq.status === 'Pending Curation' ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' :
                'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
              )}>
                {inq.status}
              </Badge>
            </div>
            
            <div className="flex items-center gap-4 mb-5 border-b border-white/10 pb-5 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-400/30 flex items-center justify-center text-amber-300 font-black text-lg shadow-inner">
                {inq.customerName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-white font-bold text-base truncate">{inq.customerName}</p>
                <div className="flex flex-col gap-0.5 mt-0.5">
                  {inq.email && (
                    <span className="text-[11px] text-white/50 flex items-center gap-1.5 truncate">
                      <Mail className="w-3 h-3 text-amber-400/60 shrink-0" />
                      <span className="truncate">{inq.email}</span>
                    </span>
                  )}
                  {inq.phone && (
                    <span className="text-[11px] text-emerald-400/80 font-mono flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-emerald-400/60 shrink-0" />
                      <span>{inq.phone}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-5 relative z-10 bg-white/[0.02] p-4 rounded-2xl border border-white/5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-white/40 uppercase tracking-wider font-bold text-[10px]">Destination</span>
                <span className="text-white font-bold">{inq.destination}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-white/40 uppercase tracking-wider font-bold text-[10px]">Duration</span>
                <span className="text-white font-bold">{inq.duration}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-white/40 uppercase tracking-wider font-bold text-[10px]">Budget</span>
                <span className="text-amber-300 font-bold bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-lg text-[10px]">{inq.budget}</span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 relative z-10">
              {inq.phone ? (
                <a
                  href={`https://wa.me/${inq.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${inq.customerName}, this is Kashmir Curators regarding your inquiry (${inq.destination}). How may we assist you?`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 h-11 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 flex items-center justify-center gap-2 text-xs font-bold transition-all"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>WhatsApp</span>
                </a>
              ) : null}
              
              <Button 
                variant="outline" 
                onClick={() => setSelectedInquiry(inq)} 
                className="flex-1 h-11 rounded-xl bg-white/5 border border-white/10 hover:border-amber-400/40 text-white hover:text-amber-300 transition-all text-xs font-bold gap-2"
              >
                <Eye className="w-4 h-4" />
                <span>Details</span>
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Details Intelligence Modal */}
      {selectedInquiry && !isUploadModalOpen && (
        <Dialog open={!!selectedInquiry} onOpenChange={() => setSelectedInquiry(null)}>
          <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] bg-[#0a0f12]/98 backdrop-blur-3xl border border-white/10 text-white p-0 overflow-hidden rounded-3xl sm:rounded-[2.5rem] shadow-2xl flex flex-col my-auto">
            <div className="absolute top-0 right-0 w-96 h-96 bg-kashmir-gold/5 blur-[120px] -mr-48 -mt-48 pointer-events-none" />
            
            <div className="p-6 sm:p-8 lg:p-10 relative z-10 overflow-y-auto max-h-[calc(90vh-1rem)] custom-scrollbar">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-white/5 pb-6">
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-kashmir-gold/60">Strategic Inquiry Detail</p>
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-display font-black text-white leading-tight break-all">
                    Node <span className="text-kashmir-gold">{formatId(selectedInquiry.id, selectedInquiry.leadId)}</span>
                  </h2>
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    {typeof selectedInquiry.leadScore === 'number' && (
                      <span className={`text-[10px] font-black px-3 py-1 rounded-full ${
                        selectedInquiry.leadScore >= 75 ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                        selectedInquiry.leadScore >= 50 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      }`}>
                        {selectedInquiry.leadScore >= 75 ? '🔥 High Intent' : selectedInquiry.leadScore >= 50 ? '⚡ Warm Lead' : '🌱 Discovery Lead'} • Score {selectedInquiry.leadScore}/100
                      </span>
                    )}
                    {selectedInquiry.leadCategory && (
                      <span className="text-[10px] font-mono text-kashmir-gold bg-kashmir-gold/10 px-3 py-1 rounded-full border border-kashmir-gold/20">
                        Category: {selectedInquiry.leadCategory.replace(/_/g, ' ')}
                      </span>
                    )}
                    {selectedInquiry.sourceCta && (
                      <span className="text-[10px] font-mono text-white/50 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                        Source: {selectedInquiry.sourceCta}
                      </span>
                    )}
                  </div>
                </div>
                <Badge className={cn(
                  "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border-none shadow-xl self-start sm:self-auto shrink-0",
                  selectedInquiry.status === 'New' ? 'bg-blue-500/20 text-blue-400' :
                  selectedInquiry.status === 'Pending Curation' ? 'bg-amber-500/20 text-amber-500' :
                  'bg-emerald-500/20 text-emerald-400'
                )}>
                  {selectedInquiry.status}
                </Badge>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                <div className="space-y-6">
                  <div className="space-y-6 p-6 sm:p-8 rounded-2xl sm:rounded-[2rem] bg-white/[0.02] border border-white/5">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-kashmir-gold" />
                      Client Intelligence Profile
                    </h4>
                    <div className="space-y-5">
                      <div className="flex items-center gap-4 sm:gap-5 group/info">
                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center shrink-0 group-hover/info:bg-white/10 transition-colors">
                          <Users className="w-5 h-5 text-white/40" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-0.5">Entity Name</p>
                          <p className="font-bold text-base sm:text-lg text-white truncate">{selectedInquiry.customerName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 sm:gap-5 group/info">
                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center shrink-0 group-hover/info:bg-white/10 transition-colors">
                          <Mail className="w-5 h-5 text-white/40" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-0.5">Verified Email</p>
                          <p className="font-bold text-sm sm:text-base text-white break-all">{selectedInquiry.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 sm:gap-5 group/info">
                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center shrink-0 group-hover/info:bg-white/10 transition-colors">
                          <Phone className="w-5 h-5 text-white/40" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-0.5">Contact Synchronized</p>
                          <p className="font-bold text-sm sm:text-base text-white">{selectedInquiry.phone}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CRM Pipeline Operations */}
                  <div className="space-y-4 p-6 sm:p-8 rounded-2xl sm:rounded-[2rem] bg-white/[0.02] border border-white/5">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      CRM Pipeline Operations
                    </h4>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <span className="text-[10px] font-black uppercase tracking-wider text-white/50">Lead Stage State</span>
                      <select
                        value={selectedInquiry.leadStage || 'NEW_LEAD'}
                        onChange={async (e) => {
                          const newStage = e.target.value;
                          try {
                            const token = localStorage.getItem('teamToken');
                            const response = await fetch(`${API_BASE_URL}/inquiries/${selectedInquiry.id}`, {
                              method: 'PATCH',
                              headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                              },
                              body: JSON.stringify({ leadStage: newStage })
                            });
                            if (response.ok) {
                              const updated = await response.json();
                              setSelectedInquiry(updated);
                              setInquiries(prev => prev.map(i => i.id === updated.id ? updated : i));
                              toast.success(`CRM state updated: ${newStage.replace('_', ' ')}`);
                            } else {
                              toast.error('Failed to trigger workflow change');
                            }
                          } catch (err) {
                            toast.error('Failed to communicate with CRM server');
                          }
                        }}
                        className="bg-[#0a0f14] border border-white/10 text-white rounded-xl px-4 py-2 text-xs font-bold focus:border-kashmir-gold outline-none cursor-pointer w-full sm:w-auto"
                      >
                        {[
                          { code: 'NEW_LEAD', label: 'New Lead' },
                          { code: 'FOLLOW_UP', label: 'Contacted' },
                          { code: 'QUOTE_SENT', label: 'Quotation Sent' },
                          { code: 'NEGOTIATION', label: 'Negotiation' },
                          { code: 'PAYMENT_PENDING', label: 'Payment Pending' },
                          { code: 'PAYMENT_RECEIVED', label: 'Payment Received' },
                          { code: 'CONFIRMED', label: 'Trip Confirmed' },
                          { code: 'COMPLETED', label: 'Trip Completed' },
                          { code: 'CANCELLED', label: 'Cancelled' }
                        ].map(stage => (
                          <option key={stage.code} value={stage.code} className="bg-[#0a0f14] text-white">
                            {stage.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-5 p-6 sm:p-8 rounded-2xl sm:rounded-[2rem] bg-kashmir-gold/[0.02] border border-kashmir-gold/10">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-kashmir-gold/60 flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                      Trip Configuration Parameters
                    </h4>
                    <div className="space-y-4">
                      <div className="flex justify-between items-start gap-4 border-b border-white/5 pb-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/30 shrink-0 mt-0.5">Operational Target</span>
                        <span className="font-bold text-sm text-white text-right break-words">{selectedInquiry.destination}</span>
                      </div>
                      <div className="flex justify-between items-start gap-4 border-b border-white/5 pb-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/30 shrink-0 mt-0.5">Temporal Frame</span>
                        <span className="font-bold text-sm text-white text-right">{selectedInquiry.duration}</span>
                      </div>
                      {selectedInquiry.arrivalCity && (
                        <div className="flex justify-between items-start gap-4 border-b border-white/5 pb-3">
                          <span className="text-[10px] font-black uppercase tracking-widest text-white/30 shrink-0 mt-0.5">Arrival City</span>
                          <span className="font-bold text-sm text-white text-right">{selectedInquiry.arrivalCity}</span>
                        </div>
                      )}
                      {(selectedInquiry.adultsCount || selectedInquiry.childrenCount) && (
                        <div className="flex justify-between items-start gap-4 border-b border-white/5 pb-3">
                          <span className="text-[10px] font-black uppercase tracking-widest text-white/30 shrink-0 mt-0.5">Party Dynamics</span>
                          <span className="font-bold text-sm text-white text-right">
                            {selectedInquiry.adultsCount || 0} Adults {selectedInquiry.childrenCount ? `, ${selectedInquiry.childrenCount} Children` : ''}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-start gap-4 border-b border-white/5 pb-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/30 shrink-0 mt-0.5">Asset Preference</span>
                        <span className="font-bold text-sm text-white text-right break-words max-w-[65%]">{selectedInquiry.accommodation || selectedInquiry.preferredAccommodation}</span>
                      </div>
                      {selectedInquiry.transportPreference && (
                        <div className="flex justify-between items-start gap-4 border-b border-white/5 pb-3">
                          <span className="text-[10px] font-black uppercase tracking-widest text-white/30 shrink-0 mt-0.5">Transport Preference</span>
                          <span className="font-bold text-sm text-white text-right">{selectedInquiry.transportPreference}</span>
                        </div>
                      )}
                      {selectedInquiry.wantOffbeat && (
                        <div className="flex justify-between items-start gap-4 border-b border-white/5 pb-3">
                          <span className="text-[10px] font-black uppercase tracking-widest text-white/30 shrink-0 mt-0.5">Offbeat Interest</span>
                          <Badge className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[9px] font-mono">
                            {selectedInquiry.wantOffbeat}
                          </Badge>
                        </div>
                      )}
                      {selectedInquiry.travelStyle && (
                        <div className="flex justify-between items-start gap-4 border-b border-white/5 pb-3">
                          <span className="text-[10px] font-black uppercase tracking-widest text-white/30 shrink-0 mt-0.5">Travel Style</span>
                          <span className="font-bold text-sm text-white text-right">{selectedInquiry.travelStyle}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center gap-4 border-b border-white/5 pb-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/30 shrink-0">Fiscal Constraint</span>
                        <Badge className="bg-kashmir-gold text-black px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">{selectedInquiry.budget || selectedInquiry.budgetRange}</Badge>
                      </div>
                      {selectedInquiry.notes && (
                        <div className="pt-2">
                          <span className="text-[10px] font-black uppercase tracking-widest text-white/30 block mb-1">Guest Notes & Special Requests</span>
                          <p className="text-xs text-white/70 italic bg-white/5 p-3 rounded-xl border border-white/5">{selectedInquiry.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedInquiry.flightDetails && (() => {
                    try {
                      const flight = JSON.parse(selectedInquiry.flightDetails);
                      if (!flight || !flight.includeFlights) return null;
                      return (
                        <div className="space-y-4 p-6 sm:p-8 rounded-2xl sm:rounded-[2rem] bg-blue-500/[0.02] border border-blue-500/10 animate-in fade-in duration-500 text-left">
                          <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-400 flex items-center gap-3">
                            <Plane className="w-4 h-4 text-blue-400 animate-pulse" />
                            Requested Flight Enquiry
                          </h4>
                          <div className="space-y-3 text-sm">
                            <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
                              <span className="text-[10px] font-black uppercase tracking-widest text-white/25">Route</span>
                              <span className="font-bold text-white uppercase text-xs sm:text-sm">{flight.originCity || flight.origin} &rarr; {flight.destinationCity || flight.destination}</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
                              <span className="text-[10px] font-black uppercase tracking-widest text-white/25">Trip Class</span>
                              <span className="font-bold text-white capitalize text-xs sm:text-sm">{flight.tripType === 'roundtrip' ? 'Round Trip' : 'One Way'} • {flight.cabinClass ? flight.cabinClass.replace('_', ' ') : 'Economy'}</span>
                            </div>
                            <div className="flex justify-between items-center pb-1">
                              <span className="text-[10px] font-black uppercase tracking-widest text-white/25">Timing / Direct</span>
                              <span className="font-bold text-white capitalize text-xs sm:text-sm">Departure: {flight.departureTimePref} • {flight.directOnly ? 'Direct Only' : 'Layovers OK'}</span>
                            </div>
                          </div>
                        </div>
                      );
                    } catch (e) {
                      return null;
                    }
                  })()}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-white/5">
                <Button variant="ghost" onClick={() => setSelectedInquiry(null)} className="w-full sm:w-auto h-12 px-6 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-white/40 hover:text-white hover:bg-white/5">
                  Terminate View
                </Button>
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
                  <Button 
                    onClick={() => {
                      navigate(`/sales/portal?inquiryId=${selectedInquiry.id}`);
                    }}
                    className="flex-1 sm:flex-initial h-12 px-5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 hover:bg-blue-500 hover:text-white"
                  >
                    <Sparkles className="w-4 h-4 mr-2" /> Itinerary Builder
                  </Button>
                  <Button onClick={() => setIsUploadModalOpen(true)} className="flex-1 sm:flex-initial h-12 px-6 rounded-xl bg-kashmir-gold text-black hover:bg-amber-500 font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-kashmir-gold/20">
                    <FileUp className="w-4 h-4 mr-2" /> Deploy Proposal
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Deployment Modal (Proposal Upload) */}
      {isUploadModalOpen && (
        <Dialog open={isUploadModalOpen} onOpenChange={(o) => !o && setIsUploadModalOpen(false)}>
          <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] bg-[#0a0f12]/98 backdrop-blur-3xl border border-white/10 text-white p-6 sm:p-10 overflow-y-auto rounded-3xl sm:rounded-[2.5rem] shadow-2xl custom-scrollbar my-auto">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] -mr-32 -mt-32 pointer-events-none" />
            
            <div className="text-center mb-8">
              <Badge className="bg-emerald-500/10 text-emerald-400 border-none px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.3em] mb-4">
                Node Deployment Ready
              </Badge>
              <h2 className="text-2xl sm:text-4xl font-display font-black text-white leading-tight">Publish <span className="text-kashmir-gold">Enterprise</span> Proposal</h2>
            </div>

            <div className="space-y-6 sm:space-y-8 relative z-10">
              <div 
                className="group relative p-8 sm:p-12 border-2 border-dashed border-white/10 rounded-2xl sm:rounded-[2rem] bg-white/[0.01] hover:bg-white/[0.03] hover:border-kashmir-gold/30 transition-all duration-700 cursor-pointer overflow-hidden"
                onClick={() => document.getElementById('proposal-upload')?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { 
                  e.preventDefault(); 
                  const file = e.dataTransfer.files[0];
                  if (file) handleUploadPDF(file);
                }}
              >
                <input 
                  type="file" 
                  id="proposal-upload" 
                  className="hidden" 
                  accept=".pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUploadPDF(file);
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-kashmir-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="relative z-10 text-center flex flex-col items-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-kashmir-gold/10 flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-700 shadow-2xl shadow-kashmir-gold/5">
                    <FileUp className="w-8 h-8 text-kashmir-gold" />
                  </div>
                  <h3 className="text-lg sm:text-2xl font-display font-bold text-white mb-2">Sync Bespoke Itinerary</h3>
                  <p className="text-white/30 text-xs font-black uppercase tracking-[0.15em] max-w-[240px]">Drag & Drop Encrypted PDF or Click to Select</p>
                </div>
              </div>

              <div className="p-5 sm:p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3 text-xs">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
                  <span>Notification Protocol</span>
                  <span className="text-emerald-500">Automated SMS/Email</span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
                  <span>Dashboard Access</span>
                  <span className="text-emerald-500">Instant Sync</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button variant="ghost" onClick={() => setIsUploadModalOpen(false)} className="w-full sm:flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-white/40 hover:text-white">
                  Abort Deployment
                </Button>
                <Button 
                  onClick={() => document.getElementById('proposal-upload')?.click()} 
                  className="w-full sm:flex-[2] h-12 rounded-xl bg-kashmir-gold text-black hover:bg-amber-500 font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-kashmir-gold/20"
                >
                  {isUploading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Synchronizing...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      <span>Select File to Publish</span>
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Manual Entry Modal */}
      {isManualModalOpen && (
        <Dialog open={isManualModalOpen} onOpenChange={setIsManualModalOpen}>
          <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] bg-[#0a0f12]/98 backdrop-blur-3xl border border-white/10 text-white p-6 sm:p-10 overflow-y-auto rounded-3xl sm:rounded-[2.5rem] shadow-2xl custom-scrollbar my-auto">
            <div className="absolute top-0 right-0 w-64 h-64 bg-kashmir-gold/5 blur-[100px] -mr-32 -mt-32 pointer-events-none" />
            
            <div className="text-center mb-8">
              <Badge className="bg-kashmir-gold/10 text-kashmir-gold border-none px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.3em] mb-4">
                Manual Lead Creation
              </Badge>
              <h2 className="text-3xl font-display font-black text-white leading-tight">Create <span className="text-kashmir-gold">Customized</span> Package</h2>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-6 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Customer Name</label>
                  <Input 
                    required 
                    value={manualForm.customerName}
                    onChange={(e) => setManualForm({...manualForm, customerName: e.target.value})}
                    placeholder="John Doe" 
                    className="bg-white/[0.02] border-white/5 text-white placeholder:text-white/40 rounded-xl focus:ring-kashmir-gold/20 text-sm focus:border-kashmir-gold/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Email Address</label>
                  <Input 
                    type="email"
                    required
                    value={manualForm.email}
                    onChange={(e) => setManualForm({...manualForm, email: e.target.value})}
                    placeholder="john@example.com" 
                    className="bg-white/[0.02] border-white/5 text-white placeholder:text-white/40 rounded-xl focus:ring-kashmir-gold/20 text-sm focus:border-kashmir-gold/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Phone Number</label>
                  <Input 
                    required 
                    value={manualForm.phone}
                    onChange={(e) => setManualForm({...manualForm, phone: e.target.value})}
                    placeholder="+91 98765 43210" 
                    className="bg-white/[0.02] border-white/5 text-white placeholder:text-white/40 rounded-xl focus:ring-kashmir-gold/20 text-sm focus:border-kashmir-gold/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Destination</label>
                  <select 
                    value={manualForm.destination}
                    onChange={(e) => setManualForm({...manualForm, destination: e.target.value})}
                    className="w-full h-10 px-3 rounded-xl bg-[#0c1216] border border-white/5 text-white text-sm focus:ring-kashmir-gold/20 focus:border-kashmir-gold/20"
                  >
                    <option value="Kashmir">Kashmir (General)</option>
                    <option value="Srinagar & Gulmarg">Srinagar & Gulmarg</option>
                    <option value="Pahalgam & Sonamarg">Pahalgam & Sonamarg</option>
                    <option value="Leh Ladakh">Leh Ladakh</option>
                    <option value="Complete Kashmir Valley">Complete Kashmir Valley</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Duration</label>
                  <select 
                    value={manualForm.duration}
                    onChange={(e) => setManualForm({...manualForm, duration: e.target.value})}
                    className="w-full h-10 px-3 rounded-xl bg-[#0c1216] border border-white/5 text-white text-sm focus:ring-kashmir-gold/20 focus:border-kashmir-gold/20"
                  >
                    <option value="4 Days">4 Days (3 Nights)</option>
                    <option value="5 Days">5 Days (4 Nights)</option>
                    <option value="6 Days">6 Days (5 Nights)</option>
                    <option value="7 Days">7 Days (6 Nights)</option>
                    <option value="8 Days">8 Days (7 Nights)</option>
                    <option value="9 Days">9 Days (8 Nights)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Travelers</label>
                  <Input 
                    type="number"
                    min="1"
                    required
                    value={manualForm.travelers}
                    onChange={(e) => setManualForm({...manualForm, travelers: e.target.value})}
                    className="bg-white/[0.02] border-white/5 text-white rounded-xl focus:ring-kashmir-gold/20 text-sm focus:border-kashmir-gold/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Budget Tier</label>
                  <select 
                    value={manualForm.budget}
                    onChange={(e) => setManualForm({...manualForm, budget: e.target.value})}
                    className="w-full h-10 px-3 rounded-xl bg-[#0c1216] border border-white/5 text-white text-sm focus:ring-kashmir-gold/20 focus:border-kashmir-gold/20"
                  >
                    <option value="Standard">Standard</option>
                    <option value="Premium">Premium</option>
                    <option value="Luxury">Luxury</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Accommodation</label>
                  <select 
                    value={manualForm.accommodation}
                    onChange={(e) => setManualForm({...manualForm, accommodation: e.target.value})}
                    className="w-full h-10 px-3 rounded-xl bg-[#0c1216] border border-white/5 text-white text-sm focus:ring-kashmir-gold/20 focus:border-kashmir-gold/20"
                  >
                    <option value="Standard Hotel">Standard Hotels</option>
                    <option value="Premium Hotel">Premium Hotels</option>
                    <option value="Luxury Resort">Luxury Resorts</option>
                    <option value="Houseboat & Hotel">Houseboat & Hotel Mix</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Assign Agent (Optional)</label>
                  <select 
                    value={manualForm.assignedTo}
                    onChange={(e) => setManualForm({...manualForm, assignedTo: e.target.value})}
                    className="w-full h-10 px-3 rounded-xl bg-[#0c1216] border border-white/5 text-white text-sm focus:ring-kashmir-gold/20 focus:border-kashmir-gold/20"
                  >
                    <option value="">Do Not Assign (Round-Robin)</option>
                    {SALES_AGENTS.map(agent => (
                      <option key={agent.code} value={agent.code}>{agent.name} ({agent.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setIsManualModalOpen(false)} 
                  className="flex-1 h-14 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] text-white/20 hover:text-white"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={isCreatingManual}
                  className="flex-[2] h-14 rounded-2xl bg-kashmir-gold text-black hover:bg-amber-500 font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl shadow-kashmir-gold/20"
                >
                  {isCreatingManual ? (
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Creating Inquiry...</span>
                    </div>
                  ) : (
                    <span>Create Inquiry</span>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
