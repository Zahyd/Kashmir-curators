import { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Search, 
  User, 
  Mail, 
  Phone, 
  Calendar,
  Shield, 
  UserPlus, 
  Trash2, 
  CheckCircle2, 
  Briefcase, 
  Sparkles, 
  X, 
  Lock, 
  FileText,
  Crown,
  Star,
  Compass,
  Download,
  LayoutGrid,
  List,
  MessageSquare,
  ExternalLink,
  Edit3,
  Tag,
  RefreshCw,
  PhoneCall,
  SlidersHorizontal,
  ChevronRight,
  Receipt,
  MapPin,
  TrendingUp,
  Clock,
  Check,
  Building,
  Save
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { API_BASE_URL } from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface BookingRecord {
  id: string;
  type: string;
  itemName: string;
  bookingDate: string;
  status: string;
  stage?: string;
  totalAmount: number;
  details?: string | any;
  createdAt?: string;
}

interface InquiryRecord {
  id: string;
  destination: string;
  duration: string;
  travelers: string;
  budget: string;
  status: string;
  leadStage?: string;
  createdAt: string;
}

interface UserAccount {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  employeeCode: string | null;
  isOnline?: boolean;
  leadCapacity?: number;
  createdAt: string;
  updatedAt?: string;
  bookings?: BookingRecord[];
  inquiries?: InquiryRecord[];
  agentProfile?: any;
  driverProfile?: any;
  _count?: {
    bookings: number;
    inquiries: number;
  };
}

// B2B Agent Card
function AgentCard({ 
  agent, 
  onVerify 
}: { 
  agent: any; 
  onVerify: (id: string, status: 'APPROVED' | 'REJECTED', comm: number) => void;
}) {
  const [commInput, setCommInput] = useState(agent.commissionPct || 0);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async (status: 'APPROVED' | 'REJECTED') => {
    setIsUpdating(true);
    await onVerify(agent.id, status, commInput);
    setIsUpdating(false);
  };
  
  return (
    <div className="p-6 rounded-2xl bg-[#0b1015]/90 border border-white/5 hover:border-amber-500/30 transition-all duration-300 group relative overflow-hidden flex flex-col justify-between shadow-xl">
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <Briefcase className="w-16 h-16 text-amber-400" />
      </div>
      
      <div>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-transparent border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-lg uppercase shadow-inner">
            {agent.companyName ? agent.companyName.charAt(0) : 'A'}
          </div>
          <div className="text-left flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="font-bold text-white text-sm group-hover:text-amber-400 transition-colors truncate">
                {agent.companyName}
              </h3>
              <Badge className={cn(
                "text-[8px] font-black uppercase tracking-wider px-2 py-0.5",
                agent.status === 'APPROVED' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" :
                agent.status === 'REJECTED' ? "bg-rose-500/10 text-rose-400 border border-rose-500/30" :
                "bg-amber-500/10 text-amber-400 border border-amber-500/30"
              )}>
                {agent.status}
              </Badge>
            </div>
            <p className="text-[10px] font-mono text-white/40 tracking-wider">
              CODE: {agent.agentCode || 'N/A'}
            </p>
          </div>
        </div>

        <div className="space-y-2.5 mb-6 text-left text-xs text-white/60">
          <p className="flex items-center gap-2.5 truncate">
            <User className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">{agent.user?.name || 'Contact N/A'}</span>
          </p>
          <p className="flex items-center gap-2.5 truncate">
            <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <a href={`mailto:${agent.user?.email}`} className="truncate hover:text-white transition-colors">
              {agent.user?.email || 'N/A'}
            </a>
          </p>
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-2.5 text-xs truncate">
              <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{agent.user?.phone || 'No Contact'}</span>
            </p>
            {agent.user?.phone && (
              <div className="flex items-center gap-1.5 shrink-0">
                <a 
                  href={`https://wa.me/${agent.user.phone.replace(/[^0-9]/g, '')}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="px-2 py-1 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center gap-1 border border-emerald-500/20"
                >
                  <MessageSquare className="w-3 h-3" /> WhatsApp
                </a>
              </div>
            )}
          </div>
          <p className="flex items-center gap-2.5 truncate text-white/40">
            <FileText className="w-3.5 h-3.5 text-amber-400/60 shrink-0" />
            <span className="truncate">License: {agent.licenseNumber || 'Not filed'}</span>
          </p>
        </div>

        <div className="space-y-1.5 mb-6 text-left">
          <label className="text-[9px] font-black uppercase tracking-widest text-white/40">Commission Override</label>
          <div className="relative">
            <input
              type="number"
              value={commInput}
              onChange={(e) => setCommInput(parseFloat(e.target.value) || 0)}
              className="w-full bg-black/40 border border-white/10 rounded-xl h-9 px-3 text-xs text-white focus:outline-none focus:border-amber-400"
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 text-xs font-bold">%</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2 pt-2 border-t border-white/5">
        {agent.status === 'PENDING' ? (
          <>
            <Button
              onClick={() => handleUpdate('APPROVED')}
              disabled={isUpdating}
              className="flex-1 bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-black uppercase tracking-wider h-9 rounded-xl transition-all"
            >
              Approve
            </Button>
            <Button
              onClick={() => handleUpdate('REJECTED')}
              disabled={isUpdating}
              variant="destructive"
              className="flex-1 bg-rose-500/15 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/20 text-[10px] font-black uppercase tracking-wider h-9 rounded-xl transition-all"
            >
              Reject
            </Button>
          </>
        ) : (
          <>
            <Button
              onClick={() => handleUpdate(agent.status)}
              disabled={isUpdating}
              className="flex-1 bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 text-[10px] font-bold uppercase tracking-wider h-9 rounded-xl transition-all"
            >
              Update Comm.
            </Button>
            <Button
              onClick={() => handleUpdate(agent.status === 'APPROVED' ? 'REJECTED' : 'APPROVED')}
              disabled={isUpdating}
              className={cn(
                "flex-1 text-[10px] font-bold uppercase tracking-wider h-9 rounded-xl transition-all border",
                agent.status === 'APPROVED' 
                  ? "bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white"
                  : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white"
              )}
            >
              {agent.status === 'APPROVED' ? 'Suspend' : 'Activate'}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export default function CMSUsers() {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'clients' | 'team' | 'agents' | 'all'>('clients');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  
  // Filters & Sorting
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [activityFilter, setActivityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recent');

  // Selected User for Dossier Drawer/Modal
  const [selectedUserForDossier, setSelectedUserForDossier] = useState<UserAccount | null>(null);
  const [dossierTab, setDossierTab] = useState<'bookings' | 'inquiries' | 'notes' | 'settings'>('bookings');
  
  // Curator Client Notes state (stored in localStorage keyed by userId)
  const [clientNotes, setClientNotes] = useState<Record<string, { note: string; tags: string[] }>>({});
  const [editingNoteText, setEditingNoteText] = useState('');
  const [newTagInput, setNewTagInput] = useState('');

  // Quick Edit User Modal State
  const [userToEdit, setUserToEdit] = useState<UserAccount | null>(null);
  const [editFormData, setEditFormData] = useState({ name: '', phone: '', role: 'user', leadCapacity: '5' });
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);

  // Delete Modal State
  const [userToDelete, setUserToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Selected Booking Details View Modal
  const [selectedBookingForView, setSelectedBookingForView] = useState<any | null>(null);

  // Add Team Member Modal State
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [submittingTeam, setSubmittingTeam] = useState(false);
  const [teamFormData, setTeamFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'sales',
    employeeCode: '',
    leadCapacity: '5'
  });

  // Load client curator notes from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('kc_client_curator_notes');
      if (stored) {
        setClientNotes(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Failed to parse cached curator notes', e);
    }
  }, []);

  const saveCuratorNote = (userId: string, note: string, tags: string[]) => {
    const updated = { ...clientNotes, [userId]: { note, tags } };
    setClientNotes(updated);
    try {
      localStorage.setItem('kc_client_curator_notes', JSON.stringify(updated));
      toast.success('Curator notes & preferences updated');
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([fetchUsers(), fetchAgents(), fetchBookings()]);
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchUsers(), fetchAgents(), fetchBookings()]);
    setRefreshing(false);
    toast.success('Client directory synchronized');
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('teamToken');
      const response = await fetch(`${API_BASE_URL}/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (Array.isArray(data)) {
        setUsers(data);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load user directory');
    }
  };

  const fetchAgents = async () => {
    try {
      const token = localStorage.getItem('teamToken');
      const response = await fetch(`${API_BASE_URL}/agents`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (Array.isArray(data)) {
        setAgents(data);
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    }
  };

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('teamToken');
      const response = await fetch(`${API_BASE_URL}/bookings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (Array.isArray(data)) {
        setBookings(data);
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    }
  };

  const handleVerifyAgent = async (agentId: string, status: 'APPROVED' | 'REJECTED', commissionPct: number) => {
    try {
      const token = localStorage.getItem('teamToken');
      const response = await fetch(`${API_BASE_URL}/agents/${agentId}/verify`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status, commissionPct })
      });
      if (response.ok) {
        toast.success(`Agent registration ${status.toLowerCase()} successfully`);
        fetchAgents();
        fetchUsers();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to update agent verification status');
      }
    } catch (error) {
      console.error('verify agent error:', error);
      toast.error('Network error during verification');
    }
  };

  const handleCreateTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamFormData.name || !teamFormData.email || !teamFormData.employeeCode || !teamFormData.role) {
      toast.error('All marked fields are required');
      return;
    }

    setSubmittingTeam(true);
    try {
      const token = localStorage.getItem('teamToken');
      const response = await fetch(`${API_BASE_URL}/users/team`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...teamFormData,
          leadCapacity: parseInt(teamFormData.leadCapacity) || 5
        })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create team member');
      }

      toast.success(`Team member ${teamFormData.name} enrolled successfully!`);
      setShowAddTeamModal(false);
      setTeamFormData({
        name: '',
        email: '',
        phone: '',
        role: 'sales',
        employeeCode: '',
        leadCapacity: '5'
      });
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to register team member');
    } finally {
      setSubmittingTeam(false);
    }
  };

  const handleSaveUserUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToEdit) return;
    setIsUpdatingUser(true);

    try {
      const token = localStorage.getItem('teamToken');
      const response = await fetch(`${API_BASE_URL}/users/${userToEdit.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editFormData.name,
          phone: editFormData.phone,
          role: editFormData.role,
          leadCapacity: parseInt(editFormData.leadCapacity) || 5
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to update user profile');
      }

      toast.success(`Profile updated for ${editFormData.name}`);
      setUserToEdit(null);
      fetchUsers();
      if (selectedUserForDossier?.id === userToEdit.id) {
        setSelectedUserForDossier(prev => prev ? {
          ...prev,
          name: editFormData.name,
          phone: editFormData.phone,
          role: editFormData.role
        } : null);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update user');
    } finally {
      setIsUpdatingUser(false);
    }
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);

    try {
      const token = localStorage.getItem('teamToken');
      const response = await fetch(`${API_BASE_URL}/users/${userToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to delete user');
      }

      toast.success(`Access successfully revoked for ${userToDelete.name}.`);
      setUserToDelete(null);
      if (selectedUserForDossier?.id === userToDelete.id) {
        setSelectedUserForDossier(null);
      }
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete user profile');
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper to compute user financial spend & bookings
  const getUserFinancials = (u: UserAccount) => {
    const userBookings = (u.bookings && u.bookings.length > 0)
      ? u.bookings 
      : bookings.filter(b => b.userId === u.id);
    
    const totalSpent = userBookings
      .filter(b => b.status === 'confirmed' || b.status === 'completed')
      .reduce((acc, curr) => acc + (Number(curr.totalAmount) || 0), 0);

    const bookingCount = userBookings.length;
    const inquiryCount = u._count?.inquiries || u.inquiries?.length || 0;

    let tierName = 'Valley Explorer';
    let tierKey = 'explorer';
    let tierColor = 'bg-sky-500/10 text-sky-400 border-sky-500/25';
    let TierIcon = Compass;

    if (totalSpent >= 100000 || bookingCount >= 3) {
      tierName = 'Curator Elite';
      tierKey = 'elite';
      tierColor = 'bg-amber-500/15 text-amber-400 border-amber-500/35';
      TierIcon = Crown;
    } else if (totalSpent >= 40000 || bookingCount >= 1) {
      tierName = 'Gold Member';
      tierKey = 'gold';
      tierColor = 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30';
      TierIcon = Star;
    }

    return {
      userBookings,
      totalSpent,
      bookingCount,
      inquiryCount,
      tierName,
      tierKey,
      tierColor,
      TierIcon
    };
  };

  // Role Badge Helper
  const getRoleBadge = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
      case 'director':
        return <Badge className="bg-rose-500/15 text-rose-400 border border-rose-500/30 text-[9px] font-black uppercase tracking-wider">Director</Badge>;
      case 'sales':
        return <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[9px] font-black uppercase tracking-wider">Sales Specialist</Badge>;
      case 'operations':
        return <Badge className="bg-blue-500/15 text-blue-400 border border-blue-500/30 text-[9px] font-black uppercase tracking-wider">Operations Lead</Badge>;
      case 'marketing':
        return <Badge className="bg-purple-500/15 text-purple-400 border border-purple-500/30 text-[9px] font-black uppercase tracking-wider">Marketing</Badge>;
      case 'finance':
        return <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[9px] font-black uppercase tracking-wider">Finance</Badge>;
      case 'agent':
        return <Badge className="bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 text-[9px] font-black uppercase tracking-wider">B2B Partner</Badge>;
      default:
        return <Badge className="bg-white/5 text-white/60 border border-white/10 text-[9px] font-black uppercase tracking-wider">Traveler Client</Badge>;
    }
  };

  // Derived Account Lists
  const clientAccounts = useMemo(() => users.filter(u => u.role === 'user'), [users]);
  const teamAccounts = useMemo(() => users.filter(u => u.role !== 'user'), [users]);

  // Aggregate Portfolio Telemetry
  const portfolioStats = useMemo(() => {
    let totalRevenue = 0;
    let activeTravelerCount = 0;
    let eliteCuratorCount = 0;

    users.forEach(u => {
      const { totalSpent, bookingCount, inquiryCount, tierKey } = getUserFinancials(u);
      totalRevenue += totalSpent;
      if (bookingCount > 0 || inquiryCount > 0) activeTravelerCount++;
      if (tierKey === 'elite' || tierKey === 'gold') eliteCuratorCount++;
    });

    return {
      totalRevenue,
      activeTravelerCount,
      eliteCuratorCount,
      totalUsers: users.length,
      travelersCount: clientAccounts.length,
      teamCount: teamAccounts.length,
      agentsCount: agents.length
    };
  }, [users, clientAccounts, teamAccounts, agents]);

  // Filter & Sort Logic
  const filteredUsers = useMemo(() => {
    let list: UserAccount[] = [];
    if (activeTab === 'clients') list = clientAccounts;
    else if (activeTab === 'team') list = teamAccounts;
    else if (activeTab === 'all') list = users;
    else list = []; // agents handled separately

    return list.filter(u => {
      // Search term filter
      const matchesSearch = 
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.phone && u.phone.includes(searchTerm)) ||
        (u.employeeCode && u.employeeCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
        u.id.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      // Tier filter (for travelers/clients)
      if (tierFilter !== 'all' && activeTab !== 'team') {
        const { tierKey } = getUserFinancials(u);
        if (tierKey !== tierFilter) return false;
      }

      // Activity filter
      if (activityFilter !== 'all') {
        const { bookingCount, inquiryCount } = getUserFinancials(u);
        if (activityFilter === 'with_bookings' && bookingCount === 0) return false;
        if (activityFilter === 'with_inquiries' && inquiryCount === 0) return false;
        if (activityFilter === 'zero_activity' && (bookingCount > 0 || inquiryCount > 0)) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'recent') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === 'spend') {
        const spendA = getUserFinancials(a).totalSpent;
        const spendB = getUserFinancials(b).totalSpent;
        return spendB - spendA;
      }
      if (sortBy === 'bookings') {
        const bA = getUserFinancials(a).bookingCount;
        const bB = getUserFinancials(b).bookingCount;
        return bB - bA;
      }
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });
  }, [users, clientAccounts, teamAccounts, activeTab, searchTerm, tierFilter, activityFilter, sortBy]);

  const filteredAgents = useMemo(() => {
    return agents.filter(a => 
      (a.companyName && a.companyName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (a.agentCode && a.agentCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (a.user?.name && a.user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (a.user?.email && a.user.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [agents, searchTerm]);

  // Export CSV of Current Filtered Records
  const exportLedgerCSV = () => {
    if (activeTab === 'agents') {
      const headers = ['Company Name', 'Agent Code', 'Contact Name', 'Email', 'Phone', 'Commission %', 'Status', 'License'];
      const rows = filteredAgents.map(a => [
        `"${a.companyName || ''}"`,
        `"${a.agentCode || ''}"`,
        `"${a.user?.name || ''}"`,
        `"${a.user?.email || ''}"`,
        `"${a.user?.phone || ''}"`,
        a.commissionPct || 0,
        `"${a.status || ''}"`,
        `"${a.licenseNumber || ''}"`
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `kashmir_curators_b2b_agents_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('B2B Agents CSV exported');
      return;
    }

    const headers = ['Name', 'Email', 'Phone', 'Role', 'Employee Code', 'Enrolled Date', 'Total Spent (INR)', 'Bookings Count', 'Inquiries Count', 'VIP Tier'];
    const rows = filteredUsers.map(u => {
      const fin = getUserFinancials(u);
      return [
        `"${u.name}"`,
        `"${u.email}"`,
        `"${u.phone || 'No Contact'}"`,
        `"${u.role}"`,
        `"${u.employeeCode || ''}"`,
        `"${new Date(u.createdAt).toLocaleDateString()}"`,
        fin.totalSpent,
        fin.bookingCount,
        fin.inquiryCount,
        `"${fin.tierName}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `kashmir_curators_client_ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Client Ledger CSV exported successfully');
  };

  // Open Edit User Modal
  const openEditModal = (u: UserAccount) => {
    setUserToEdit(u);
    setEditFormData({
      name: u.name,
      phone: u.phone || '',
      role: u.role,
      leadCapacity: u.leadCapacity ? String(u.leadCapacity) : '5'
    });
  };

  // Open Dossier Drawer/Modal
  const openDossier = (u: UserAccount) => {
    setSelectedUserForDossier(u);
    setDossierTab('bookings');
    const existing = clientNotes[u.id];
    setEditingNoteText(existing?.note || '');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Top Header Command Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-gradient-to-r from-amber-500/[0.04] via-transparent to-transparent p-6 rounded-3xl border border-white/5 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-[10px] font-black uppercase tracking-[0.25em] mb-1">
            <Users className="w-3.5 h-3.5" />
            <span>Identity & Client CRM Intelligence</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-display font-bold text-white tracking-tight">
            Client Directory & Dossier
          </h1>
          <p className="text-xs text-white/50 mt-1">
            Real-time traveler profiles, VIP loyalty tiers, concierge preferences & operational management.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <Button
            onClick={handleRefresh}
            variant="outline"
            disabled={refreshing}
            className="h-10 px-3.5 rounded-xl bg-white/5 hover:bg-white/10 border-white/10 text-white/80 text-xs font-bold gap-2"
            title="Synchronize Identity Vault"
          >
            <RefreshCw className={cn("w-3.5 h-3.5 text-amber-400", refreshing && "animate-spin")} />
            <span className="hidden sm:inline">Sync Vault</span>
          </Button>

          <Button
            onClick={exportLedgerCSV}
            variant="outline"
            className="h-10 px-3.5 rounded-xl bg-white/5 hover:bg-white/10 border-white/10 text-white/80 text-xs font-bold gap-2"
            title="Download CSV Ledger"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>

          <div className="flex items-center bg-black/40 border border-white/10 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-2 rounded-lg text-xs transition-colors",
                viewMode === 'grid' ? "bg-amber-500/20 text-amber-400" : "text-white/40 hover:text-white"
              )}
              title="Grid Card View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                "p-2 rounded-lg text-xs transition-colors",
                viewMode === 'table' ? "bg-amber-500/20 text-amber-400" : "text-white/40 hover:text-white"
              )}
              title="Dense Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <Button 
            onClick={() => setShowAddTeamModal(true)}
            className="h-10 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-wider text-[11px] px-5 shadow-lg shadow-amber-500/15 gap-2"
          >
            <UserPlus className="w-3.5 h-3.5" /> 
            <span>Recruit Team Node</span>
          </Button>
        </div>
      </div>

      {/* Modern High-Density Telemetry Deck */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Portfolio */}
        <div className="p-5 rounded-2xl bg-[#090e13]/90 border border-white/5 hover:border-white/10 transition-all relative overflow-hidden group shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Total Accounts</span>
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/60">
              <Users className="w-4 h-4 text-amber-400" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl lg:text-3xl font-display font-bold text-white">
              {portfolioStats.totalUsers}
            </p>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
              Active CRM
            </span>
          </div>
          <p className="text-[11px] text-white/40 mt-1 flex items-center gap-1.5">
            <span>{portfolioStats.travelersCount} Travelers</span>
            <span>•</span>
            <span>{portfolioStats.teamCount} Team Nodes</span>
          </p>
        </div>

        {/* Card 2: Active Travelers */}
        <div className="p-5 rounded-2xl bg-[#090e13]/90 border border-emerald-500/20 hover:border-emerald-500/40 transition-all relative overflow-hidden group shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Active Travelers</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl lg:text-3xl font-display font-bold text-emerald-400">
              {portfolioStats.travelersCount}
            </p>
            <span className="text-[10px] font-bold text-emerald-400/80">
              Verified
            </span>
          </div>
          <p className="text-[11px] text-white/40 mt-1">
            {portfolioStats.activeTravelerCount} with active bookings/quotes
          </p>
        </div>

        {/* Card 3: Portfolio Lifetime Value */}
        <div className="p-5 rounded-2xl bg-[#090e13]/90 border border-amber-500/25 hover:border-amber-500/40 transition-all relative overflow-hidden group shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Portfolio Spend (LTV)</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl lg:text-3xl font-display font-bold text-amber-400">
              ₹{portfolioStats.totalRevenue.toLocaleString()}
            </p>
          </div>
          <p className="text-[11px] text-white/40 mt-1">
            Verified traveler booking volume
          </p>
        </div>

        {/* Card 4: VIP Curators & B2B Partners */}
        <div className="p-5 rounded-2xl bg-[#090e13]/90 border border-purple-500/20 hover:border-purple-500/40 transition-all relative overflow-hidden group shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">VIP & B2B Nodes</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
              <Crown className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl lg:text-3xl font-display font-bold text-purple-300">
              {portfolioStats.eliteCuratorCount}
            </p>
            <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">
              Curators
            </span>
          </div>
          <p className="text-[11px] text-white/40 mt-1">
            Plus {portfolioStats.agentsCount} B2B agency partners
          </p>
        </div>
      </div>

      {/* Main Navigation, Search, and Filtering Hub */}
      <div className="bg-[#090e13]/90 border border-white/5 rounded-3xl p-6 backdrop-blur-xl space-y-6 shadow-xl">
        
        {/* Row 1: Segmented Directory Tabs */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-white/5 pb-5">
          <div className="flex bg-black/40 p-1 rounded-2xl border border-white/5 overflow-x-auto custom-scrollbar">
            <button
              onClick={() => { setActiveTab('clients'); setSearchTerm(''); }}
              className={cn(
                "px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 shrink-0 flex items-center gap-2",
                activeTab === 'clients'
                  ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
                  : "text-white/50 hover:text-white"
              )}
            >
              <span>Traveler Clients</span>
              <span className={cn(
                "px-1.5 py-0.5 rounded text-[10px] font-bold",
                activeTab === 'clients' ? "bg-black/20 text-black" : "bg-white/10 text-white/70"
              )}>
                {clientAccounts.length}
              </span>
            </button>

            <button
              onClick={() => { setActiveTab('agents'); setSearchTerm(''); }}
              className={cn(
                "px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 shrink-0 flex items-center gap-2",
                activeTab === 'agents'
                  ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
                  : "text-white/50 hover:text-white"
              )}
            >
              <span>B2B Travel Agents</span>
              <span className={cn(
                "px-1.5 py-0.5 rounded text-[10px] font-bold",
                activeTab === 'agents' ? "bg-black/20 text-black" : "bg-white/10 text-white/70"
              )}>
                {agents.length}
              </span>
            </button>

            <button
              onClick={() => { setActiveTab('team'); setSearchTerm(''); }}
              className={cn(
                "px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 shrink-0 flex items-center gap-2",
                activeTab === 'team'
                  ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
                  : "text-white/50 hover:text-white"
              )}
            >
              <span>Operations Team</span>
              <span className={cn(
                "px-1.5 py-0.5 rounded text-[10px] font-bold",
                activeTab === 'team' ? "bg-black/20 text-black" : "bg-white/10 text-white/70"
              )}>
                {teamAccounts.length}
              </span>
            </button>

            <button
              onClick={() => { setActiveTab('all'); setSearchTerm(''); }}
              className={cn(
                "px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 shrink-0 flex items-center gap-2",
                activeTab === 'all'
                  ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
                  : "text-white/50 hover:text-white"
              )}
            >
              <span>All Records</span>
              <span className={cn(
                "px-1.5 py-0.5 rounded text-[10px] font-bold",
                activeTab === 'all' ? "bg-black/20 text-black" : "bg-white/10 text-white/70"
              )}>
                {users.length}
              </span>
            </button>
          </div>

          <div className="text-xs text-white/40 flex items-center gap-2 self-end sm:self-center">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Vault Synchronized</span>
          </div>
        </div>

        {/* Row 2: Search & Advanced Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          
          {/* Search Box */}
          <div className="md:col-span-5 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <Input
              placeholder={
                activeTab === 'clients'
                  ? "Search by traveler name, email, phone, ID..."
                  : activeTab === 'agents'
                  ? "Search agents by company, code, license..."
                  : "Search team by name, employee code, role..."
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-9 bg-white/5 border-white/10 rounded-xl h-11 text-xs text-white placeholder:text-white/30 focus:border-amber-400"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Tier Filter */}
          {activeTab !== 'agents' && (
            <div className="md:col-span-2">
              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl h-11 px-3 text-xs text-white/80 focus:border-amber-400 focus:outline-none"
              >
                <option value="all" className="bg-[#0d1217]">All VIP Tiers</option>
                <option value="elite" className="bg-[#0d1217]">👑 Curator Elite (₹1L+)</option>
                <option value="gold" className="bg-[#0d1217]">⭐ Gold Member (₹40K+)</option>
                <option value="explorer" className="bg-[#0d1217]">🧭 Valley Explorer</option>
              </select>
            </div>
          )}

          {/* Activity Filter */}
          {activeTab !== 'agents' && (
            <div className="md:col-span-2">
              <select
                value={activityFilter}
                onChange={(e) => setActivityFilter(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl h-11 px-3 text-xs text-white/80 focus:border-amber-400 focus:outline-none"
              >
                <option value="all" className="bg-[#0d1217]">All Activity</option>
                <option value="with_bookings" className="bg-[#0d1217]">Has Bookings</option>
                <option value="with_inquiries" className="bg-[#0d1217]">Has Inquiries</option>
                <option value="zero_activity" className="bg-[#0d1217]">Zero Activity</option>
              </select>
            </div>
          )}

          {/* Sort By */}
          <div className={activeTab === 'agents' ? "md:col-span-4" : "md:col-span-3"}>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl h-11 px-3 text-xs text-white/80 focus:border-amber-400 focus:outline-none"
            >
              <option value="recent" className="bg-[#0d1217]">Enrolled (Newest First)</option>
              <option value="oldest" className="bg-[#0d1217]">Enrolled (Oldest First)</option>
              <option value="spend" className="bg-[#0d1217]">LTV Spend (Highest First)</option>
              <option value="bookings" className="bg-[#0d1217]">Total Bookings (Most First)</option>
              <option value="name" className="bg-[#0d1217]">Name (A-Z)</option>
            </select>
          </div>

        </div>

        {/* Active Filter Chips Bar */}
        {(searchTerm || tierFilter !== 'all' || activityFilter !== 'all') && (
          <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-white/5 text-xs text-white/50">
            <span className="text-[10px] uppercase font-bold text-white/30">Active Filters:</span>
            {searchTerm && (
              <span className="bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded-md text-[10px] flex items-center gap-1">
                Search: "{searchTerm}"
                <X className="w-3 h-3 cursor-pointer" onClick={() => setSearchTerm('')} />
              </span>
            )}
            {tierFilter !== 'all' && (
              <span className="bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded-md text-[10px] flex items-center gap-1">
                Tier: {tierFilter}
                <X className="w-3 h-3 cursor-pointer" onClick={() => setTierFilter('all')} />
              </span>
            )}
            {activityFilter !== 'all' && (
              <span className="bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded-md text-[10px] flex items-center gap-1">
                Activity: {activityFilter}
                <X className="w-3 h-3 cursor-pointer" onClick={() => setActivityFilter('all')} />
              </span>
            )}
            <button
              onClick={() => { setSearchTerm(''); setTierFilter('all'); setActivityFilter('all'); }}
              className="text-[10px] text-white/40 hover:text-white underline ml-2"
            >
              Reset Filters
            </button>
          </div>
        )}

      </div>

      {/* Directory Content Display */}
      {loading ? (
        <div className="py-24 text-center opacity-60 flex flex-col items-center justify-center gap-4">
          <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs uppercase font-black tracking-widest text-white/60">
            Querying Kashmir Curators Identity Vault...
          </p>
        </div>
      ) : activeTab === 'agents' ? (
        filteredAgents.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-white/10 rounded-3xl bg-white/[0.01]">
            <Sparkles className="w-10 h-10 text-white/20 mx-auto mb-3" />
            <p className="text-white/40 text-xs font-bold uppercase tracking-wider">
              No B2B agent profiles found matching your search.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredAgents.map(a => (
              <AgentCard key={a.id} agent={a} onVerify={handleVerifyAgent} />
            ))}
          </div>
        )
      ) : filteredUsers.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-white/10 rounded-3xl bg-white/[0.01]">
          <Sparkles className="w-10 h-10 text-white/20 mx-auto mb-3" />
          <p className="text-white/40 text-xs font-bold uppercase tracking-wider">
            No identity records found matching your filters.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Modernized Luxury Card Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredUsers.map(u => {
            const financials = getUserFinancials(u);
            const notes = clientNotes[u.id];
            const TierIcon = financials.TierIcon;

            return (
              <div 
                key={u.id}
                className="p-6 rounded-2xl bg-[#090e13]/90 border border-white/5 hover:border-amber-500/30 transition-all duration-300 group relative flex flex-col justify-between shadow-xl"
              >
                {/* Background Watermark Icon */}
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                  {u.role === 'user' ? (
                    <Users className="w-20 h-20 text-amber-400" />
                  ) : (
                    <Shield className="w-20 h-20 text-amber-400" />
                  )}
                </div>

                <div>
                  {/* Card Header: Avatar & Identity */}
                  <div className="flex items-start justify-between gap-3 mb-5">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-transparent border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-lg uppercase shadow-inner shrink-0">
                        {u.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-bold text-white text-base group-hover:text-amber-400 transition-colors truncate">
                            {u.name}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {u.role !== 'user' ? (
                            getRoleBadge(u.role)
                          ) : (
                            <Badge className={cn("text-[8px] font-black uppercase tracking-wider px-2 py-0.5 border flex items-center gap-1", financials.tierColor)}>
                              <TierIcon className="w-2.5 h-2.5" />
                              <span>{financials.tierName}</span>
                            </Badge>
                          )}
                          <span className="text-[10px] font-mono text-white/30">
                            {u.employeeCode ? u.employeeCode : `#${u.id.slice(0, 6)}`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Edit Icon */}
                    <button
                      onClick={() => openEditModal(u)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-colors shrink-0"
                      title="Edit Profile"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Contact Info & One-Click Channels */}
                  <div className="space-y-2 mb-5 text-xs text-white/60">
                    <p className="flex items-center gap-2.5 truncate">
                      <Mail className="w-3.5 h-3.5 text-amber-400/80 shrink-0" />
                      <a href={`mailto:${u.email}`} className="truncate hover:text-white transition-colors">
                        {u.email}
                      </a>
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <p className="flex items-center gap-2.5 truncate">
                        <Phone className="w-3.5 h-3.5 text-amber-400/80 shrink-0" />
                        <span>{u.phone || 'No phone recorded'}</span>
                      </p>
                      {u.phone && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <a
                            href={`https://wa.me/${u.phone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(u.name)},%20greetings%20from%20Kashmir%20Curators.`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2 py-0.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center gap-1 border border-emerald-500/20"
                            title="Chat on WhatsApp"
                          >
                            <MessageSquare className="w-3 h-3" /> WhatsApp
                          </a>
                          <a
                            href={`tel:${u.phone}`}
                            className="p-1 rounded-md bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-[10px] border border-white/5"
                            title="Call Phone"
                          >
                            <PhoneCall className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>

                    <p className="flex items-center gap-2.5 text-white/40">
                      <Calendar className="w-3.5 h-3.5 text-amber-400/60 shrink-0" />
                      <span>Enrolled {new Date(u.createdAt).toLocaleDateString()}</span>
                    </p>
                  </div>

                  {/* Financial & Activity Metrics Bar */}
                  {u.role === 'user' ? (
                    <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-white/[0.02] border border-white/5 mb-4 text-center">
                      <div>
                        <span className="text-[8px] font-black uppercase tracking-wider text-white/30 block mb-0.5">LTV Spend</span>
                        <span className="font-mono font-bold text-amber-400 text-xs">
                          ₹{financials.totalSpent > 0 ? financials.totalSpent.toLocaleString() : '0'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[8px] font-black uppercase tracking-wider text-white/30 block mb-0.5">Bookings</span>
                        <span className="font-bold text-white text-xs">{financials.bookingCount}</span>
                      </div>
                      <div>
                        <span className="text-[8px] font-black uppercase tracking-wider text-white/30 block mb-0.5">Inquiries</span>
                        <span className="font-bold text-white text-xs">{financials.inquiryCount}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 mb-4 flex items-center justify-between text-xs">
                      <span className="text-[9px] font-black uppercase tracking-wider text-white/40">Capacity & Auth</span>
                      <span className="font-bold text-white/80">Max {u.leadCapacity || 5} Leads / Day</span>
                    </div>
                  )}

                  {/* Curator Tags / Notes Preview */}
                  {notes && (notes.tags?.length > 0 || notes.note) && (
                    <div className="mb-4 p-2.5 rounded-xl bg-amber-500/[0.03] border border-amber-500/10">
                      {notes.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-1">
                          {notes.tags.map(t => (
                            <span key={t} className="text-[8px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.2 rounded">
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                      {notes.note && (
                        <p className="text-[10px] text-white/60 line-clamp-1 italic">
                          "{notes.note}"
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Action Bar */}
                <div className="flex items-center gap-2 pt-3 border-t border-white/5 mt-2">
                  <Button
                    onClick={() => openDossier(u)}
                    className="flex-1 h-9 rounded-xl bg-white/5 hover:bg-amber-500 hover:text-black border border-white/10 text-white/80 text-[10px] font-black uppercase tracking-wider transition-all duration-200"
                  >
                    Inspect Dossier
                  </Button>

                  {/* Prevent deleting the master admin */}
                  {u.employeeCode !== 'ADMIN001' ? (
                    <button
                      onClick={() => setUserToDelete({ id: u.id, name: u.name })}
                      className="w-9 h-9 rounded-xl bg-rose-500/10 hover:bg-rose-500 hover:text-white border border-rose-500/20 flex items-center justify-center text-rose-400 transition-all shrink-0"
                      title="Revoke / Delete Profile"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <Badge className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[8px] font-bold uppercase tracking-wider py-1 shrink-0">
                      Protected
                    </Badge>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        /* Dense Enterprise Table View */
        <div className="bg-[#090e13]/90 border border-white/5 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/[0.02] border-b border-white/5 text-[9px] font-black uppercase tracking-widest text-white/40">
                <tr>
                  <th className="py-4 px-6">Client Identity</th>
                  <th className="py-4 px-4">Contact Channels</th>
                  <th className="py-4 px-4">Role / VIP Tier</th>
                  <th className="py-4 px-4 text-right">LTV Spend</th>
                  <th className="py-4 px-4 text-center">Bookings</th>
                  <th className="py-4 px-4 text-center">Inquiries</th>
                  <th className="py-4 px-4">Enrolled</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredUsers.map(u => {
                  const fin = getUserFinancials(u);
                  const TierIcon = fin.TierIcon;

                  return (
                    <tr 
                      key={u.id}
                      onClick={() => openDossier(u)}
                      className="hover:bg-white/[0.02] transition-colors cursor-pointer group"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-transparent border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-sm uppercase shrink-0">
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-white group-hover:text-amber-400 transition-colors">
                              {u.name}
                            </p>
                            <p className="text-[10px] text-white/40 font-mono">
                              {u.employeeCode || `#${u.id.slice(0, 6)}`}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="space-y-1">
                          <a href={`mailto:${u.email}`} className="text-white/60 hover:text-white block truncate max-w-[180px]">
                            {u.email}
                          </a>
                          <div className="flex items-center gap-2">
                            <span className="text-white/40">{u.phone || 'No Phone'}</span>
                            {u.phone && (
                              <a
                                href={`https://wa.me/${u.phone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(u.name)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-emerald-400 hover:text-emerald-300"
                                title="WhatsApp"
                              >
                                <MessageSquare className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        {u.role !== 'user' ? (
                          getRoleBadge(u.role)
                        ) : (
                          <Badge className={cn("text-[8px] font-black uppercase tracking-wider px-2 py-0.5 border flex items-center gap-1 w-max", fin.tierColor)}>
                            <TierIcon className="w-2.5 h-2.5" />
                            <span>{fin.tierName}</span>
                          </Badge>
                        )}
                      </td>

                      <td className="py-4 px-4 text-right font-mono font-bold text-amber-400">
                        ₹{fin.totalSpent.toLocaleString()}
                      </td>

                      <td className="py-4 px-4 text-center font-bold text-white/80">
                        {fin.bookingCount}
                      </td>

                      <td className="py-4 px-4 text-center font-bold text-white/80">
                        {fin.inquiryCount}
                      </td>

                      <td className="py-4 px-4 text-white/40 whitespace-nowrap">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>

                      <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            onClick={() => openDossier(u)}
                            variant="outline"
                            className="h-8 px-2.5 rounded-lg bg-white/5 border-white/10 hover:bg-amber-500 hover:text-black text-white/80 text-[10px] font-bold"
                          >
                            Dossier
                          </Button>
                          <button
                            onClick={() => openEditModal(u)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white"
                            title="Edit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {u.employeeCode !== 'ADMIN001' && (
                            <button
                              onClick={() => setUserToDelete({ id: u.id, name: u.name })}
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-400"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CLIENT DOSSIER MODAL / SLIDE-OVER CRM */}
      {selectedUserForDossier && (() => {
        const u = selectedUserForDossier;
        const fin = getUserFinancials(u);
        const TierIcon = fin.TierIcon;
        const currentNotes = clientNotes[u.id] || { note: '', tags: [] };

        return (
          <Dialog open={!!selectedUserForDossier} onOpenChange={() => setSelectedUserForDossier(null)}>
            <DialogContent className="max-w-3xl bg-[#090e13]/98 border border-white/10 text-white rounded-3xl p-8 max-h-[90vh] overflow-y-auto custom-scrollbar backdrop-blur-2xl">
              
              {/* Dossier Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/25 to-transparent border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-2xl uppercase shadow-inner">
                    {u.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-2xl font-display font-bold text-white">{u.name}</h2>
                      {u.role === 'user' ? (
                        <Badge className={cn("text-[9px] font-black uppercase tracking-wider px-2 py-0.5 border flex items-center gap-1", fin.tierColor)}>
                          <TierIcon className="w-3 h-3" />
                          <span>{fin.tierName}</span>
                        </Badge>
                      ) : (
                        getRoleBadge(u.role)
                      )}
                    </div>
                    <p className="text-xs text-white/50 font-mono mt-0.5">
                      CLIENT UUID: {u.id} • ENROLLED {new Date(u.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {u.phone && (
                    <a
                      href={`https://wa.me/${u.phone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(u.name)},%20greetings%20from%20Kashmir%20Curators.`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                    </a>
                  )}
                  {u.phone && (
                    <a
                      href={`tel:${u.phone}`}
                      className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 text-xs font-bold flex items-center gap-1.5"
                    >
                      <PhoneCall className="w-3.5 h-3.5" /> Call
                    </a>
                  )}
                  <a
                    href={`mailto:${u.email}`}
                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 text-xs font-bold flex items-center gap-1.5"
                  >
                    <Mail className="w-3.5 h-3.5" /> Email
                  </a>
                </div>
              </div>

              {/* Dossier Telemetry KPI Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-5 border-b border-white/5 text-center">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="text-[9px] font-black uppercase tracking-wider text-white/30 block mb-1">Lifetime Spend</span>
                  <span className="font-mono font-bold text-amber-400 text-base">₹{fin.totalSpent.toLocaleString()}</span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="text-[9px] font-black uppercase tracking-wider text-white/30 block mb-1">Total Bookings</span>
                  <span className="font-bold text-white text-base">{fin.bookingCount}</span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="text-[9px] font-black uppercase tracking-wider text-white/30 block mb-1">Inquiries Logged</span>
                  <span className="font-bold text-white text-base">{fin.inquiryCount}</span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="text-[9px] font-black uppercase tracking-wider text-white/30 block mb-1">Avg Order Value</span>
                  <span className="font-mono font-bold text-emerald-400 text-base">
                    ₹{fin.bookingCount > 0 ? Math.round(fin.totalSpent / fin.bookingCount).toLocaleString() : '0'}
                  </span>
                </div>
              </div>

              {/* Dossier Tab Buttons */}
              <div className="flex bg-black/40 p-1 rounded-xl border border-white/5 my-4">
                <button
                  onClick={() => setDossierTab('bookings')}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-xs font-bold transition-all",
                    dossierTab === 'bookings' ? "bg-amber-500 text-black shadow" : "text-white/50 hover:text-white"
                  )}
                >
                  Bookings Ledger ({fin.userBookings.length})
                </button>
                <button
                  onClick={() => setDossierTab('inquiries')}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-xs font-bold transition-all",
                    dossierTab === 'inquiries' ? "bg-amber-500 text-black shadow" : "text-white/50 hover:text-white"
                  )}
                >
                  Inquiries ({u.inquiries?.length || 0})
                </button>
                <button
                  onClick={() => setDossierTab('notes')}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-xs font-bold transition-all",
                    dossierTab === 'notes' ? "bg-amber-500 text-black shadow" : "text-white/50 hover:text-white"
                  )}
                >
                  Curator Notes & Tags
                </button>
              </div>

              {/* Tab 1: Bookings Ledger */}
              {dossierTab === 'bookings' && (
                <div className="space-y-3">
                  {fin.userBookings.length === 0 ? (
                    <div className="py-12 text-center text-white/40 text-xs border border-dashed border-white/10 rounded-2xl">
                      No bookings recorded for this client yet.
                    </div>
                  ) : (
                    fin.userBookings.map(b => (
                      <div
                        key={b.id}
                        onClick={() => setSelectedBookingForView(b)}
                        className="p-4 rounded-xl bg-white/[0.02] hover:bg-amber-500/[0.04] border border-white/5 hover:border-amber-500/20 transition-all cursor-pointer flex items-center justify-between gap-4 group"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-white group-hover:text-amber-400 transition-colors text-sm truncate">
                            {b.itemName}
                          </p>
                          <p className="text-[10px] text-white/40 uppercase tracking-wider font-mono mt-0.5">
                            {b.type} • REF: #{b.id.slice(0, 8)} • {new Date(b.bookingDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-mono font-bold text-white">₹{b.totalAmount.toLocaleString()}</p>
                          <Badge className={cn(
                            "text-[8px] font-black uppercase tracking-wider border-none px-2 py-0.5 mt-1",
                            b.status === 'confirmed' ? "bg-emerald-500/20 text-emerald-400" :
                            b.status === 'pending' ? "bg-amber-500/20 text-amber-400" : "bg-rose-500/20 text-rose-400"
                          )}>
                            {b.status}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab 2: Inquiries */}
              {dossierTab === 'inquiries' && (
                <div className="space-y-3">
                  {(!u.inquiries || u.inquiries.length === 0) ? (
                    <div className="py-12 text-center text-white/40 text-xs border border-dashed border-white/10 rounded-2xl">
                      No custom trip inquiries logged yet.
                    </div>
                  ) : (
                    u.inquiries.map(inq => (
                      <div
                        key={inq.id}
                        className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-amber-400 text-sm">{inq.destination}</p>
                          <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px]">
                            {inq.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs text-white/60">
                          <p><span className="text-white/30 text-[10px] block">Duration</span> {inq.duration}</p>
                          <p><span className="text-white/30 text-[10px] block">Travelers</span> {inq.travelers}</p>
                          <p><span className="text-white/30 text-[10px] block">Budget</span> {inq.budget}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab 3: Curator Notes & Tags */}
              {dossierTab === 'notes' && (
                <div className="space-y-5">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block">
                      Private Curator Notes & Guest Preferences
                    </label>
                    <textarea
                      value={editingNoteText}
                      onChange={(e) => setEditingNoteText(e.target.value)}
                      placeholder="e.g. VIP Honeymooners from Mumbai, prefers top floor luxury chalet in Gulmarg, strict vegetarian dietary requirements, celebrate anniversary on Day 3..."
                      rows={4}
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-xs text-white placeholder:text-white/30 focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block">
                      Client Tags
                    </label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {currentNotes.tags?.map(t => (
                        <span key={t} className="bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-lg text-xs flex items-center gap-1.5">
                          #{t}
                          <X 
                            className="w-3 h-3 cursor-pointer hover:text-rose-400" 
                            onClick={() => {
                              const updatedTags = currentNotes.tags.filter(x => x !== t);
                              saveCuratorNote(u.id, editingNoteText, updatedTags);
                            }}
                          />
                        </span>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <Input
                        placeholder="Add tag (e.g. Honeymoon, High-Spender, Ski-Lover)..."
                        value={newTagInput}
                        onChange={(e) => setNewTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (newTagInput.trim()) {
                              const updatedTags = Array.from(new Set([...(currentNotes.tags || []), newTagInput.trim()]));
                              saveCuratorNote(u.id, editingNoteText, updatedTags);
                              setNewTagInput('');
                            }
                          }
                        }}
                        className="bg-white/5 border-white/10 rounded-xl h-10 text-xs"
                      />
                      <Button
                        type="button"
                        onClick={() => {
                          if (newTagInput.trim()) {
                            const updatedTags = Array.from(new Set([...(currentNotes.tags || []), newTagInput.trim()]));
                            saveCuratorNote(u.id, editingNoteText, updatedTags);
                            setNewTagInput('');
                          }
                        }}
                        className="bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs h-10 rounded-xl"
                      >
                        Add Tag
                      </Button>
                    </div>
                  </div>

                  <Button
                    onClick={() => saveCuratorNote(u.id, editingNoteText, currentNotes.tags || [])}
                    className="w-full bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-wider text-xs h-11 rounded-xl shadow-lg shadow-amber-500/15 gap-2"
                  >
                    <Save className="w-4 h-4" /> Save Curator Notes & Tags
                  </Button>
                </div>
              )}

              <DialogFooter className="pt-6 border-t border-white/5">
                <Button 
                  onClick={() => setSelectedUserForDossier(null)} 
                  variant="outline"
                  className="w-full bg-white/5 hover:bg-white/10 border-white/10 text-white text-xs font-bold h-11 rounded-xl"
                >
                  Close Dossier
                </Button>
              </DialogFooter>

            </DialogContent>
          </Dialog>
        );
      })()}

      {/* QUICK EDIT USER MODAL */}
      {userToEdit && (
        <Dialog open={!!userToEdit} onOpenChange={() => setUserToEdit(null)}>
          <DialogContent className="max-w-md bg-[#090e13]/98 border border-white/10 text-white rounded-3xl p-8 backdrop-blur-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-display font-bold">Edit Profile & Credentials</DialogTitle>
              <p className="text-white/40 text-xs">Update account contact details and operational access roles.</p>
            </DialogHeader>

            <form onSubmit={handleSaveUserUpdate} className="space-y-4 py-4 text-left">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-1">Full Name</label>
                <Input
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-white/5 border-white/10 rounded-xl h-11 text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-1">Phone Number</label>
                <Input
                  placeholder="+91 9900000000"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="bg-white/5 border-white/10 rounded-xl h-11 text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-1">Operational Role</label>
                <select
                  value={editFormData.role}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full bg-black/40 border border-white/10 rounded-xl h-11 px-3 text-xs text-white focus:border-amber-400 focus:outline-none"
                >
                  <option value="user" className="bg-[#090e13]">Traveler Client</option>
                  <option value="sales" className="bg-[#090e13]">Sales Specialist</option>
                  <option value="operations" className="bg-[#090e13]">Operations Lead</option>
                  <option value="marketing" className="bg-[#090e13]">Marketing Manager</option>
                  <option value="admin" className="bg-[#090e13]">Enterprise Director</option>
                </select>
              </div>

              {editFormData.role !== 'user' && (
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-1">Daily Lead Capacity</label>
                  <Input
                    type="number"
                    min="1"
                    max="50"
                    value={editFormData.leadCapacity}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, leadCapacity: e.target.value }))}
                    className="bg-white/5 border-white/10 rounded-xl h-11 text-xs"
                  />
                </div>
              )}

              <DialogFooter className="pt-4 border-t border-white/5 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setUserToEdit(null)}
                  className="flex-1 bg-transparent border-white/10 text-white text-xs h-11 rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isUpdatingUser}
                  className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-wider text-xs h-11 rounded-xl shadow-lg"
                >
                  {isUpdatingUser ? 'Saving...' : 'Save Profile'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* RECRUIT TEAM MEMBER MODAL */}
      {showAddTeamModal && (
        <Dialog open={showAddTeamModal} onOpenChange={setShowAddTeamModal}>
          <DialogContent className="max-w-md bg-[#090e13]/98 border border-white/10 text-white rounded-3xl p-8 backdrop-blur-2xl">
            <DialogHeader>
              <div className="flex items-center gap-2 text-amber-400 text-[10px] font-black uppercase tracking-[0.25em] mb-1">
                <Briefcase className="w-3.5 h-3.5" />
                <span>Personnel Recruitment</span>
              </div>
              <DialogTitle className="text-2xl font-display font-bold">Register Team Node</DialogTitle>
              <p className="text-white/40 text-xs">Configure credentials and operational authorization.</p>
            </DialogHeader>

            <form onSubmit={handleCreateTeamMember} className="space-y-4 py-4 text-left">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-1">Full Name *</label>
                  <Input
                    placeholder="e.g. Aamir Shah"
                    required
                    value={teamFormData.name}
                    onChange={(e) => setTeamFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-white/5 border-white/10 rounded-xl h-11 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-1">Employee Code *</label>
                  <Input
                    placeholder="e.g. SALES002"
                    required
                    value={teamFormData.employeeCode}
                    onChange={(e) => setTeamFormData(prev => ({ ...prev, employeeCode: e.target.value.toUpperCase() }))}
                    className="bg-white/5 border-white/10 rounded-xl h-11 text-xs font-mono font-bold tracking-wider"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-1">Email Address *</label>
                <Input
                  type="email"
                  placeholder="name@kashmirconnect.com"
                  required
                  value={teamFormData.email}
                  onChange={(e) => setTeamFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="bg-white/5 border-white/10 rounded-xl h-11 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-1">Phone Number</label>
                  <Input
                    placeholder="+91 9900000000"
                    value={teamFormData.phone}
                    onChange={(e) => setTeamFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="bg-white/5 border-white/10 rounded-xl h-11 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-1">Role *</label>
                  <select
                    value={teamFormData.role}
                    onChange={(e) => setTeamFormData(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full bg-black/40 border border-white/10 rounded-xl h-11 px-3 text-xs text-white focus:border-amber-400 focus:outline-none"
                  >
                    <option value="sales" className="bg-[#090e13]">Sales Specialist</option>
                    <option value="operations" className="bg-[#090e13]">Operations & Assets</option>
                    <option value="marketing" className="bg-[#090e13]">Marketing Lead</option>
                    <option value="admin" className="bg-[#090e13]">Enterprise Director</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-1">Daily Lead Capacity</label>
                <Input
                  type="number"
                  min="1"
                  max="50"
                  value={teamFormData.leadCapacity}
                  onChange={(e) => setTeamFormData(prev => ({ ...prev, leadCapacity: e.target.value }))}
                  className="bg-white/5 border-white/10 rounded-xl h-11 text-xs"
                />
              </div>

              <DialogFooter className="pt-4 border-t border-white/5 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddTeamModal(false)}
                  className="flex-1 bg-transparent border-white/10 text-white text-xs h-11 rounded-xl"
                  disabled={submittingTeam}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submittingTeam}
                  className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-wider text-xs h-11 rounded-xl shadow-lg"
                >
                  {submittingTeam ? 'Registering...' : 'Enroll Member'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {userToDelete && (
        <Dialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
          <DialogContent className="max-w-md bg-[#090e13]/98 border border-rose-500/20 text-white rounded-3xl p-8 backdrop-blur-2xl">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-5 mx-auto text-rose-400">
              <Trash2 className="w-6 h-6" />
            </div>
            
            <DialogHeader className="text-center">
              <DialogTitle className="text-2xl font-display font-bold text-center">Revoke & Delete Profile?</DialogTitle>
              <p className="text-xs text-white/50 text-center mt-2">
                Are you absolutely sure you want to permanently revoke credentials and delete the profile for{' '}
                <span className="text-white font-bold">{userToDelete.name}</span>? This action is recorded in audit logs.
              </p>
            </DialogHeader>

            <DialogFooter className="pt-6 border-t border-white/5 flex gap-3">
              <Button
                variant="outline"
                onClick={() => setUserToDelete(null)}
                disabled={isDeleting}
                className="flex-1 bg-transparent border-white/10 text-white text-xs h-11 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs h-11 rounded-xl shadow-lg shadow-rose-500/20"
              >
                {isDeleting ? 'Revoking...' : 'Yes, Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* BOOKING DETAILS DIALOG */}
      {selectedBookingForView && (
        <Dialog open={!!selectedBookingForView} onOpenChange={() => setSelectedBookingForView(null)}>
          <DialogContent className="max-w-lg bg-[#090e13]/98 border border-white/10 text-white rounded-3xl p-8 backdrop-blur-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-display font-bold">Booking Intelligence</DialogTitle>
              <p className="text-white/40 text-xs font-mono mt-1">REF: {selectedBookingForView.id}</p>
            </DialogHeader>

            <div className="py-5 space-y-4 text-left">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-wider text-white/30 block mb-1">Service Item</span>
                  <h4 className="text-base font-bold text-amber-400">{selectedBookingForView.itemName}</h4>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">{selectedBookingForView.type}</p>
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase tracking-wider text-white/30 block mb-1">Amount</span>
                  <p className="text-2xl font-mono font-bold text-white">₹{selectedBookingForView.totalAmount.toLocaleString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-wider text-white/30 block mb-1">Status</span>
                  <Badge className={cn(
                    "text-[8px] font-black uppercase tracking-wider px-2 py-0.5",
                    selectedBookingForView.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-400' :
                    selectedBookingForView.status === 'pending' ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'
                  )}>
                    {selectedBookingForView.status}
                  </Badge>
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase tracking-wider text-white/30 block mb-1">Booking Date</span>
                  <p className="text-xs font-bold text-white">{new Date(selectedBookingForView.bookingDate).toLocaleDateString()}</p>
                </div>
              </div>

              {selectedBookingForView.type === 'cab' && selectedBookingForView.details && (() => {
                const cabDetails = typeof selectedBookingForView.details === 'string'
                  ? JSON.parse(selectedBookingForView.details)
                  : selectedBookingForView.details;
                return (
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/30 block">Cab Transfer Routing</span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-white/40 text-[9px] block">Pickup</span>
                        <span className="font-semibold text-white/90">{cabDetails.pickupLocation || 'Not specified'}</span>
                      </div>
                      <div>
                        <span className="text-white/40 text-[9px] block">Drop</span>
                        <span className="font-semibold text-white/90">{cabDetails.dropLocation || 'Not specified'}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            <DialogFooter className="pt-4 border-t border-white/5">
              <Button 
                onClick={() => setSelectedBookingForView(null)} 
                className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold h-11 rounded-xl"
              >
                Close View
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

    </div>
  );
}
