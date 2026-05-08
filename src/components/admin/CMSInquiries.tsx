import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useTeamAuth, SALES_AGENTS } from '@/contexts/TeamAuthContext';
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
  UserPlus
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

const initialInquiries = [
  { 
    id: 'REQ-9921', 
    customerName: 'Aarav Sharma', 
    email: 'aarav@example.com', 
    phone: '+91 9876543210', 
    destination: 'Srinagar, Gulmarg', 
    duration: '5 Days', 
    accommodation: '5-star Luxury', 
    budget: 'Luxury', 
    travelers: 'Couple', 
    status: 'Pending Curation', 
    date: '2026-05-08',
    assignedTo: 'SALES001'
  },
  { 
    id: 'REQ-8842', 
    customerName: 'Priya Patel', 
    email: 'priya.p@example.com', 
    phone: '+91 9988776655', 
    destination: 'Full Kashmir Tour', 
    duration: '7 Days', 
    accommodation: 'Houseboat', 
    budget: 'Standard', 
    travelers: 'Family', 
    status: 'New', 
    date: '2026-05-07',
    assignedTo: ''
  },
  { 
    id: 'REQ-7719', 
    customerName: 'Rohan Gupta', 
    email: 'rohan.g@example.com', 
    phone: '+91 9123456789', 
    destination: 'Pahalgam', 
    duration: '3 Days', 
    accommodation: '4-star Premium', 
    budget: 'Adventure', 
    travelers: 'Group', 
    status: 'Ready for Review', 
    date: '2026-05-06',
    assignedTo: 'SALES002'
  },
];

export default function CMSInquiries() {
  const { teamUser, hasPermission } = useTeamAuth();
  const canAssign = hasPermission('assign_leads');
  const [searchTerm, setSearchTerm] = useState('');
  const [inquiries, setInquiries] = useState(initialInquiries);
  const [selectedInquiry, setSelectedInquiry] = useState<any | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);

  const filteredInquiries = inquiries.filter(inq => {
    const matchesSearch = inq.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         inq.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         inq.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter.length === 0 || statusFilter.includes(inq.status);
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = (id: string, newStatus: string) => {
    setInquiries(inquiries.map(inq => inq.id === id ? { ...inq, status: newStatus } : inq));
    toast.success(`Inquiry ${id} synchronized to ${newStatus}`);
  };

  const handleAssign = (inquiryId: string, agentCode: string) => {
    const agent = SALES_AGENTS.find(a => a.code === agentCode);
    setInquiries(inquiries.map(inq => 
      inq.id === inquiryId 
        ? { ...inq, assignedTo: agentCode, status: inq.status === 'New' ? 'Pending Curation' : inq.status } 
        : inq
    ));
    toast.success(`${inquiryId} assigned to ${agent?.name || agentCode}`);
  };

  const handleUploadPDF = () => {
    setIsUploading(true);
    setTimeout(() => {
      setInquiries(inquiries.map(inq => inq.id === selectedInquiry.id ? { ...inq, status: 'Ready for Review' } : inq));
      setIsUploading(false);
      setIsUploadModalOpen(false);
      setSelectedInquiry(null);
      toast.success('Enterprise Proposal deployed successfully!');
    }, 1500);
  };

  const toggleStatusFilter = (status: string) => {
    setStatusFilter(prev => 
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      {/* Strategic Controls */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8">
        <div className="flex items-center gap-6 w-full xl:w-auto">
          <div className="relative flex-1 group">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-white/20 group-focus-within:text-kashmir-gold transition-colors duration-500" />
            </div>
            <Input 
              placeholder="Search Intelligence Queue (ID, Name, Node)..." 
              className="pl-14 bg-white/[0.02] border-white/5 text-white placeholder:text-white/10 h-16 rounded-[1.5rem] focus:ring-kashmir-gold/20 focus:border-kashmir-gold/20 text-lg transition-all duration-500 focus:bg-white/[0.05]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-16 bg-white/[0.02] border-white/5 text-white/60 hover:text-white hover:bg-white/10 gap-3 px-8 rounded-[1.5rem] transition-all duration-500 group">
                <Filter className="w-5 h-5 text-kashmir-gold/40 group-hover:text-kashmir-gold" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Operational Filters</span>
                {statusFilter.length > 0 && (
                  <Badge className="bg-kashmir-gold text-black px-2 py-0.5 rounded-md font-black text-[9px]">{statusFilter.length}</Badge>
                )}
                <ChevronDown className="w-4 h-4 opacity-30" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-72 bg-[#0a0f12]/95 backdrop-blur-2xl border-white/10 text-white p-2 rounded-2xl shadow-2xl" align="end">
              <DropdownMenuLabel className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">System Status Filter</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/5 mx-2" />
              {[
                { label: 'New Requests', id: 'New' },
                { label: 'Active Curation', id: 'Pending Curation' },
                { label: 'Fulfilled Nodes', id: 'Ready for Review' }
              ].map(status => (
                <DropdownMenuCheckboxItem 
                  key={status.id}
                  checked={statusFilter.includes(status.id)}
                  onCheckedChange={() => toggleStatusFilter(status.id)}
                  className="cursor-pointer p-3 rounded-xl focus:bg-white/5"
                >
                  <span className="text-xs font-bold">{status.label}</span>
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator className="bg-white/5 mx-2" />
              <DropdownMenuItem 
                onClick={() => setStatusFilter([])}
                className="text-center justify-center text-kashmir-gold text-[10px] font-black uppercase tracking-widest p-3 cursor-pointer"
              >
                Reset All Filters
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex gap-4 w-full xl:w-auto">
          <Button variant="outline" className="flex-1 xl:flex-none h-16 bg-white/[0.02] border-white/5 text-white/40 hover:text-white hover:bg-white/10 px-8 rounded-[1.5rem] transition-all duration-500 group">
            <Download className="w-5 h-5 mr-3 group-hover:-translate-y-0.5 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Export Data</span>
          </Button>
          <Button className="flex-1 xl:flex-none h-16 bg-kashmir-gold text-black hover:bg-amber-500 font-black px-10 rounded-[1.5rem] shadow-2xl shadow-kashmir-gold/10 transition-all duration-500 hover:scale-[1.02]">
            <PlusCircle className="w-5 h-5 mr-3" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Manual Entry</span>
          </Button>
        </div>
      </div>

      {/* Intelligence Grid */}
      <Card className="bg-[#0a0f12]/40 bg-white/[0.01] border-white/5 backdrop-blur-3xl overflow-hidden rounded-[2.5rem] shadow-inner relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-kashmir-gold/[0.02] to-transparent pointer-events-none" />
        
        <div className="overflow-x-auto relative z-10 custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-6 py-6 font-black text-white/20 text-[9px] uppercase tracking-[0.4em]">Inquiry ID</th>
                <th className="px-6 py-6 font-black text-white/20 text-[9px] uppercase tracking-[0.4em]">Intelligence Profile</th>
                <th className="px-6 py-6 font-black text-white/20 text-[9px] uppercase tracking-[0.4em]">Trip Parameters</th>
                <th className="px-6 py-6 font-black text-white/20 text-[9px] uppercase tracking-[0.4em]">Status</th>
                {canAssign && (
                  <th className="px-6 py-6 font-black text-white/20 text-[9px] uppercase tracking-[0.4em]">Assigned Agent</th>
                )}
                <th className="px-6 py-6 font-black text-white/20 text-[9px] uppercase tracking-[0.4em] text-right">Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredInquiries.map((inq) => (
                <tr key={inq.id} className="hover:bg-white/[0.03] transition-all duration-500 group/row">
                  <td className="px-6 py-6">
                    <div className="space-y-1.5">
                      <span className="text-white font-black text-sm tracking-widest group-hover/row:text-kashmir-gold transition-colors">{inq.id}</span>
                      <div className="flex items-center gap-2 text-[9px] text-white/30 uppercase tracking-[0.2em] font-black">
                        <div className="w-1.5 h-1.5 rounded-full bg-kashmir-gold/40" />
                        {inq.date}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center text-kashmir-gold font-black text-lg relative shadow-xl overflow-hidden group/avatar">
                        <div className="absolute inset-0 bg-kashmir-gold/10 opacity-0 group-hover/avatar:opacity-100 transition-opacity" />
                        <span className="relative z-10">{inq.customerName.charAt(0)}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-white font-bold text-sm block tracking-tight">{inq.customerName}</span>
                        <div className="flex items-center gap-2 text-[10px] text-white/30 font-bold uppercase tracking-tighter">
                          <Mail className="w-3 h-3 text-kashmir-gold/40" />
                          {inq.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-white/80 text-sm font-bold tracking-tight">{inq.destination}</span>
                        <div className="w-1 h-1 rounded-full bg-white/20" />
                        <span className="text-[10px] text-white/40 font-black uppercase tracking-widest">{inq.duration}</span>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="bg-white/5 border-white/10 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 text-white/30">
                          {inq.accommodation}
                        </Badge>
                        <Badge variant="outline" className="bg-kashmir-gold/5 border-kashmir-gold/20 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 text-kashmir-gold/60">
                          {inq.budget}
                        </Badge>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <Badge className={cn(
                      "px-4 py-1.5 rounded-[10px] text-[9px] font-black uppercase tracking-[0.2em] border-none shadow-lg",
                      inq.status === 'New' ? 'bg-blue-500/10 text-blue-400 shadow-blue-500/5' :
                      inq.status === 'Pending Curation' ? 'bg-amber-500/10 text-amber-500 shadow-amber-500/5' :
                      'bg-emerald-500/10 text-emerald-400 shadow-emerald-500/5'
                    )}>
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full mr-2 inline-block animate-pulse",
                        inq.status === 'New' ? 'bg-blue-400' :
                        inq.status === 'Pending Curation' ? 'bg-amber-400' :
                        'bg-emerald-400'
                      )} />
                      {inq.status}
                    </Badge>
                  </td>
                  {canAssign && (
                    <td className="px-6 py-6">
                      {inq.assignedTo ? (
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                            <UserPlus className="w-4 h-4 text-emerald-400" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white">{SALES_AGENTS.find(a => a.code === inq.assignedTo)?.name || inq.assignedTo}</p>
                            <p className="text-[9px] text-white/30 font-mono">{inq.assignedTo}</p>
                          </div>
                        </div>
                      ) : (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-9 px-4 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 gap-2 text-[10px] font-bold">
                              <UserPlus className="w-3.5 h-3.5" />
                              Assign
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-56 bg-[#0a0f12]/95 backdrop-blur-2xl border-white/10 text-white p-2 rounded-2xl shadow-2xl">
                            <DropdownMenuLabel className="px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Select Agent</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-white/5 mx-2" />
                            {SALES_AGENTS.map(agent => (
                              <DropdownMenuItem 
                                key={agent.code}
                                onClick={() => handleAssign(inq.id, agent.code)}
                                className="cursor-pointer p-3 rounded-xl gap-3 hover:bg-white/5 focus:bg-white/5"
                              >
                                <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                  <UserPlus className="w-3 h-3 text-emerald-400" />
                                </div>
                                <div>
                                  <p className="text-xs font-bold">{agent.name}</p>
                                  <p className="text-[9px] text-white/30 font-mono">{agent.code}</p>
                                </div>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </td>
                  )}
                  <td className="px-6 py-6 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setSelectedInquiry(inq)}
                        className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 text-white/30 hover:text-white transition-all duration-300"
                      >
                        <Eye className="w-5 h-5" />
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 text-white/30 hover:text-white transition-all duration-300">
                            <MoreVertical className="w-5 h-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-64 bg-[#0a0f12]/95 backdrop-blur-2xl border-white/10 text-white p-2 rounded-2xl shadow-2xl">
                          <DropdownMenuLabel className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Intelligence Node Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator className="bg-white/5 mx-2" />
                          <DropdownMenuItem onClick={() => handleStatusChange(inq.id, 'New')} className="cursor-pointer p-3 rounded-xl gap-3">
                            <div className="w-2 h-2 rounded-full bg-blue-400" />
                            <span className="text-xs font-bold">Synchronize as New</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(inq.id, 'Pending Curation')} className="cursor-pointer p-3 rounded-xl gap-3">
                            <div className="w-2 h-2 rounded-full bg-amber-400" />
                            <span className="text-xs font-bold">Initialize Curation</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-white/5 mx-2" />
                          <DropdownMenuItem 
                            onClick={() => { setSelectedInquiry(inq); setIsUploadModalOpen(true); }}
                            className="text-kashmir-gold font-black p-3 rounded-xl gap-3 hover:bg-kashmir-gold/10 focus:bg-kashmir-gold/10"
                          >
                            <FileUp className="w-4 h-4" /> 
                            <span className="text-xs">Deploy Bespoke Proposal</span>
                          </DropdownMenuItem>
                          {canAssign && inq.assignedTo && (
                            <>
                              <DropdownMenuSeparator className="bg-white/5 mx-2" />
                              <DropdownMenuLabel className="px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Reassign Agent</DropdownMenuLabel>
                              {SALES_AGENTS.filter(a => a.code !== inq.assignedTo).map(agent => (
                                <DropdownMenuItem 
                                  key={agent.code}
                                  onClick={() => handleAssign(inq.id, agent.code)}
                                  className="cursor-pointer p-3 rounded-xl gap-3 hover:bg-white/5 focus:bg-white/5"
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
            <div className="p-32 text-center flex flex-col items-center justify-center animate-in fade-in zoom-in duration-700">
              <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-8 border border-white/5">
                <Search className="w-10 h-10 text-white/10" />
              </div>
              <h3 className="text-xl font-display font-bold text-white mb-2">No Results Found</h3>
              <p className="text-white/20 text-sm max-w-sm mb-8 font-medium">No intelligence nodes match your current filtering parameters. Adjust your search or clear filters.</p>
              <Button variant="outline" onClick={() => { setSearchTerm(''); setStatusFilter([]); }} className="h-12 bg-kashmir-gold/10 border-kashmir-gold/20 text-kashmir-gold hover:bg-kashmir-gold hover:text-black rounded-xl font-black text-[10px] uppercase tracking-widest px-8">Reset Enterprise View</Button>
            </div>
          )}
        </div>
      </Card>

      {/* Details Intelligence Modal */}
      {selectedInquiry && !isUploadModalOpen && (
        <Dialog open={!!selectedInquiry} onOpenChange={() => setSelectedInquiry(null)}>
          <DialogContent className="max-w-4xl bg-[#0a0f12]/95 backdrop-blur-3xl border-white/5 text-white p-0 overflow-hidden rounded-[3rem] shadow-2xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-kashmir-gold/5 blur-[120px] -mr-48 -mt-48 pointer-events-none" />
            
            <div className="p-12 relative z-10">
              <div className="flex items-center justify-between mb-12 border-b border-white/5 pb-8">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-kashmir-gold/60">Strategic Inquiry Detail</p>
                  <h2 className="text-4xl font-display font-black text-white leading-tight">Node <span className="text-kashmir-gold">{selectedInquiry.id}</span></h2>
                </div>
                <Badge className={cn(
                  "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border-none shadow-xl",
                  selectedInquiry.status === 'New' ? 'bg-blue-500/20 text-blue-400' :
                  selectedInquiry.status === 'Pending Curation' ? 'bg-amber-500/20 text-amber-500' :
                  'bg-emerald-500/20 text-emerald-400'
                )}>
                  {selectedInquiry.status}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                <div className="space-y-10">
                  <div className="space-y-6 p-8 rounded-[2rem] bg-white/[0.02] border border-white/5">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-kashmir-gold" />
                      Client Intelligence Profile
                    </h4>
                    <div className="space-y-6">
                      <div className="flex items-center gap-5 group/info">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center group-hover/info:bg-white/10 transition-colors"><Users className="w-5 h-5 text-white/40" /></div>
                        <div><p className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-0.5">Entity Name</p><p className="font-bold text-lg text-white">{selectedInquiry.customerName}</p></div>
                      </div>
                      <div className="flex items-center gap-5 group/info">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center group-hover/info:bg-white/10 transition-colors"><Mail className="w-5 h-5 text-white/40" /></div>
                        <div><p className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-0.5">Verified Email</p><p className="font-bold text-lg text-white">{selectedInquiry.email}</p></div>
                      </div>
                      <div className="flex items-center gap-5 group/info">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center group-hover/info:bg-white/10 transition-colors"><Phone className="w-5 h-5 text-white/40" /></div>
                        <div><p className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-0.5">Contact Synchronized</p><p className="font-bold text-lg text-white">{selectedInquiry.phone}</p></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-10">
                  <div className="space-y-6 p-8 rounded-[2rem] bg-kashmir-gold/[0.02] border border-kashmir-gold/5">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-kashmir-gold/40 flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                      Trip Configuration Parameters
                    </h4>
                    <div className="space-y-6">
                      <div className="flex justify-between items-center border-b border-white/5 pb-4">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Operational Target</span>
                        <span className="font-bold text-sm text-white">{selectedInquiry.destination}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-white/5 pb-4">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Temporal Frame</span>
                        <span className="font-bold text-sm text-white">{selectedInquiry.duration}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-white/5 pb-4">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Asset Preference</span>
                        <span className="font-bold text-sm text-white">{selectedInquiry.accommodation}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-white/5 pb-4">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Fiscal Constraint</span>
                        <Badge className="bg-kashmir-gold text-black px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">{selectedInquiry.budget}</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-16 pt-10 border-t border-white/5">
                <Button variant="ghost" onClick={() => setSelectedInquiry(null)} className="h-14 px-8 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] text-white/30 hover:text-white hover:bg-white/5">
                  Terminate View
                </Button>
                <div className="flex gap-4">
                  <Button variant="outline" className="h-14 px-8 rounded-2xl bg-white/5 border-white/5 text-[10px] font-black uppercase tracking-[0.3em] text-white/60 hover:text-white hover:bg-white/10">
                    <CheckCircle2 className="w-4 h-4 mr-3" /> Mark Verified
                  </Button>
                  <Button onClick={() => setIsUploadModalOpen(true)} className="h-14 px-10 rounded-2xl bg-kashmir-gold text-black hover:bg-amber-500 font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl shadow-kashmir-gold/20">
                    <FileUp className="w-4 h-4 mr-3" /> Deploy Proposal
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
          <DialogContent className="max-w-2xl bg-[#0a0f12]/95 backdrop-blur-3xl border-white/5 text-white p-12 overflow-hidden rounded-[3rem] shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] -mr-32 -mt-32 pointer-events-none" />
            
            <div className="text-center mb-12">
              <Badge className="bg-emerald-500/10 text-emerald-400 border-none px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.3em] mb-4">
                Node Deployment Ready
              </Badge>
              <h2 className="text-4xl font-display font-black text-white leading-tight">Publish <span className="text-kashmir-gold">Enterprise</span> Proposal</h2>
            </div>

            <div className="space-y-10 relative z-10">
              <div 
                className="group relative p-16 border-2 border-dashed border-white/5 rounded-[2.5rem] bg-white/[0.01] hover:bg-white/[0.03] hover:border-kashmir-gold/30 transition-all duration-700 cursor-pointer overflow-hidden"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); handleUploadPDF(); }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-kashmir-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="relative z-10 text-center flex flex-col items-center">
                  <div className="w-24 h-24 rounded-[2rem] bg-kashmir-gold/10 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-6 transition-all duration-700 shadow-2xl shadow-kashmir-gold/5">
                    <FileUp className="w-10 h-10 text-kashmir-gold" />
                  </div>
                  <h3 className="text-2xl font-display font-bold text-white mb-3">Sync Bespoke Itinerary</h3>
                  <p className="text-white/20 text-xs font-black uppercase tracking-[0.2em] max-w-[240px]">Drag & Drop Encrypted PDF or Select from Cloud</p>
                </div>
              </div>

              <div className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 space-y-4">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.3em] text-white/20">
                  <span>Notification Protocol</span>
                  <span className="text-emerald-500">Automated SMS/Email</span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.3em] text-white/20">
                  <span>Dashboard Access</span>
                  <span className="text-emerald-500">Instant Sync</span>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button variant="ghost" onClick={() => setIsUploadModalOpen(false)} className="flex-1 h-16 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] text-white/20 hover:text-white">
                  Abort Deployment
                </Button>
                <Button onClick={handleUploadPDF} className="flex-[2] h-16 rounded-2xl bg-kashmir-gold text-black hover:bg-amber-500 font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl shadow-kashmir-gold/20">
                  {isUploading ? (
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Synchronizing...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-5 h-5" />
                      <span>Authorize & Publish</span>
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
