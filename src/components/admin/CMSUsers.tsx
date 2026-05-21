import { useState, useEffect } from 'react';
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
  Layers,
  Sparkles,
  ChevronRight,
  Plus,
  X,
  Lock
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { API_BASE_URL } from '@/lib/api';
import { toast } from 'sonner';

interface UserAccount {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  employeeCode: string | null;
  createdAt: string;
  _count?: {
    bookings: number;
    inquiries: number;
  };
}

export default function CMSUsers() {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'clients' | 'team'>('clients');
  
  // Add Team Member Modal State
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'sales',
    employeeCode: '',
    leadCapacity: '5'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('teamToken');
      const response = await fetch(`${API_BASE_URL}/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setUsers(data || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load identity databases');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.employeeCode || !formData.role) {
      toast.error('All asterisked fields are required');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('teamToken');
      const response = await fetch(`${API_BASE_URL}/users/team`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          leadCapacity: parseInt(formData.leadCapacity)
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create team member');
      }

      toast.success(`Welcome aboard, ${formData.name}! Profile created successfully.`);
      setShowAddTeamModal(false);
      // Reset Form
      setFormData({
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
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`Are you absolutely sure you want to revoke access and remove the profile for ${name}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('teamToken');
      const response = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to delete user');
      }

      toast.success(`Access successfully revoked for ${name}.`);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete user profile');
    }
  };

  // Group Users into categories
  const clientAccounts = users.filter(u => u.role === 'user');
  const teamAccounts = users.filter(u => u.role !== 'user');

  const getFilteredAccounts = () => {
    const list = activeTab === 'clients' ? clientAccounts : teamAccounts;
    return list.filter(u => 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.employeeCode && u.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  const activeRoleBadge = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return <Badge className="bg-red-500/10 text-red-400 border border-red-500/20 text-[9px] font-black uppercase tracking-wider">Director</Badge>;
      case 'sales':
        return <Badge className="bg-kashmir-gold/10 text-kashmir-gold border border-kashmir-gold/20 text-[9px] font-black uppercase tracking-wider">Sales Representative</Badge>;
      case 'operations':
        return <Badge className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[9px] font-black uppercase tracking-wider">Operations</Badge>;
      case 'marketing':
        return <Badge className="bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[9px] font-black uppercase tracking-wider">Marketing</Badge>;
      default:
        return <Badge className="bg-white/5 text-white/50 text-[9px] font-black uppercase tracking-wider">{role}</Badge>;
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 text-kashmir-gold text-[10px] font-black uppercase tracking-[0.3em] mb-2">
            <Users className="w-4 h-4" />
            <span>Identity Intelligence</span>
          </div>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight">Identity Registry</h1>
        </div>
        <div className="flex items-center gap-3">
          {activeTab === 'team' ? (
            <Button 
              onClick={() => setShowAddTeamModal(true)}
              className="rounded-xl bg-kashmir-gold text-black hover:bg-amber-500 font-black uppercase tracking-widest text-[10px] px-8 h-12 shadow-lg shadow-kashmir-gold/10"
            >
              <UserPlus className="w-4 h-4 mr-2" /> Recruit Team Member
            </Button>
          ) : (
            <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest bg-white/5 px-4 py-2 rounded-lg">
              Traveler Enrollment Live
            </div>
          )}
        </div>
      </div>

      {/* Directory Metric Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white/5 border-white/5 p-6 rounded-[2rem] text-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-kashmir-gold/5 blur-[20px]" />
          <p className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-2">Total Accounts</p>
          <p className="text-3xl font-display font-black text-white">{users.length}</p>
        </Card>
        <Card className="bg-white/5 border-white/5 p-6 rounded-[2rem] text-center border-l-emerald-500 border-l-4">
          <p className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-2">Traveler Profiles</p>
          <p className="text-3xl font-display font-black text-emerald-400">{clientAccounts.length}</p>
        </Card>
        <Card className="bg-white/5 border-white/5 p-6 rounded-[2rem] text-center border-l-kashmir-gold border-l-4">
          <p className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-2">Active Team Nodes</p>
          <p className="text-3xl font-display font-black text-kashmir-gold">{teamAccounts.length}</p>
        </Card>
        <Card className="bg-white/5 border-white/5 p-6 rounded-[2rem] text-center">
          <p className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-2">System Authority</p>
          <p className="text-3xl font-display font-black text-blue-400">100%</p>
        </Card>
      </div>

      {/* Directory Tab Hub */}
      <Card className="bg-white/[0.03] border-white/5 p-8 rounded-[2.5rem] backdrop-blur-xl">
        
        {/* Toggle & Filter Row */}
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-6 mb-8 border-b border-white/5 pb-8">
          
          {/* Custom Luxury Tabs */}
          <div className="flex bg-white/5 p-1 rounded-xl w-full md:w-auto">
            <button
              onClick={() => { setActiveTab('clients'); setSearchTerm(''); }}
              className={`flex-1 md:flex-initial px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                activeTab === 'clients' 
                  ? 'bg-kashmir-gold text-black shadow-lg shadow-kashmir-gold/10' 
                  : 'text-white/40 hover:text-white'
              }`}
            >
              Traveler Directory ({clientAccounts.length})
            </button>
            <button
              onClick={() => { setActiveTab('team'); setSearchTerm(''); }}
              className={`flex-1 md:flex-initial px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                activeTab === 'team' 
                  ? 'bg-kashmir-gold text-black shadow-lg shadow-kashmir-gold/10' 
                  : 'text-white/40 hover:text-white'
              }`}
            >
              Team Directory ({teamAccounts.length})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            <Input 
              placeholder={
                activeTab === 'clients' 
                  ? "Search by traveler name, email..." 
                  : "Search team members by name, code..."
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 bg-white/5 border-white/5 rounded-2xl h-12 text-xs focus:ring-kashmir-gold/20"
            />
          </div>
        </div>

        {/* Directory Grid */}
        {loading ? (
          <div className="py-20 text-center opacity-45 flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 border-2 border-kashmir-gold border-t-transparent rounded-full animate-spin" />
            <p className="text-[10px] uppercase font-black tracking-widest">Querying identity vault...</p>
          </div>
        ) : getFilteredAccounts().length === 0 ? (
          <div className="py-20 text-center border border-dashed border-white/5 rounded-[2rem] bg-white/[0.01]">
            <Sparkles className="w-10 h-10 text-white/10 mx-auto mb-4" />
            <p className="text-white/30 text-xs font-black uppercase tracking-widest">No profiles found matching search criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getFilteredAccounts().map((u) => (
              <div 
                key={u.id} 
                className="p-8 rounded-[2.5rem] bg-white/5 border border-white/5 hover:bg-white/[0.08] hover:border-kashmir-gold/20 transition-all duration-500 group relative overflow-hidden flex flex-col justify-between"
              >
                {/* Background Watermark */}
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  {u.role === 'user' ? (
                    <Users className="w-16 h-16 text-kashmir-gold" />
                  ) : (
                    <Shield className="w-16 h-16 text-kashmir-gold" />
                  )}
                </div>
                
                <div>
                  {/* Identity Row */}
                  <div className="flex items-center gap-5 mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-kashmir-gold/20 to-transparent border border-kashmir-gold/20 flex items-center justify-center text-kashmir-gold font-bold text-xl uppercase shadow-inner">
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-bold text-white text-base group-hover:text-kashmir-gold transition-colors">{u.name}</h3>
                        {u.role !== 'user' && activeRoleBadge(u.role)}
                      </div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-white/20">
                        {u.role === 'user' ? `Traveler ID: #${u.id.slice(-6)}` : `Code: ${u.employeeCode}`}
                      </p>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-4 mb-8">
                    <p className="text-xs text-white/50 flex items-center gap-3"><Mail className="w-4.5 h-4.5 text-kashmir-gold" /> {u.email}</p>
                    <p className="text-xs text-white/50 flex items-center gap-3"><Phone className="w-4.5 h-4.5 text-kashmir-gold" /> {u.phone || 'No Contact'}</p>
                    <p className="text-xs text-white/50 flex items-center gap-3"><Calendar className="w-4.5 h-4.5 text-kashmir-gold" /> Enrolled {new Date(u.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="border-t border-white/5 pt-6 mt-4 flex items-center justify-between gap-4">
                  {u.role === 'user' ? (
                    <div className="flex gap-4 w-full">
                      <div className="flex-1 text-center border-r border-white/5">
                        <p className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-1">Bookings</p>
                        <p className="font-bold text-white">{u._count?.bookings || 0}</p>
                      </div>
                      <div className="flex-1 text-center">
                        <p className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-1">Inquiries</p>
                        <p className="font-bold text-white">{u._count?.inquiries || 0}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between w-full">
                      <div>
                        <p className="text-[8px] font-black uppercase tracking-widest text-white/20 mb-0.5">Assigned capacity</p>
                        <Badge variant="outline" className="border-white/10 text-white/50 text-[10px] font-bold">
                          Max Leads: 5
                        </Badge>
                      </div>

                      {/* Avoid deleting the master director */}
                      {u.employeeCode !== 'ADMIN001' ? (
                        <button
                          onClick={() => handleDeleteUser(u.id, u.name)}
                          className="w-10 h-10 rounded-xl bg-red-500/10 hover:bg-red-500 hover:text-black border border-red-500/20 hover:border-red-500 flex items-center justify-center text-red-400 transition-all duration-300 shadow-lg"
                          title="Revoke team permission"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <Badge className="bg-red-500/10 text-red-500 border border-red-500/20 text-[8px] font-bold uppercase tracking-widest">
                          Protected Node
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}

      </Card>

      {/* LUXURY ADD TEAM MEMBER MODAL */}
      {showAddTeamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          
          {/* Glassmorphic Overlay */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-md animate-fade-in" 
            onClick={() => !submitting && setShowAddTeamModal(false)} 
          />

          {/* Modal Card */}
          <Card className="relative z-10 w-full max-w-lg bg-[#0a0f12]/95 border border-white/10 p-8 md:p-10 rounded-[2.5rem] shadow-2xl animate-scale-in text-white overflow-hidden">
            
            {/* Header Design */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-kashmir-gold/5 blur-[50px] pointer-events-none" />
            <button 
              type="button" 
              onClick={() => !submitting && setShowAddTeamModal(false)}
              className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/5 text-white/50 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mb-8">
              <div className="flex items-center gap-2 text-kashmir-gold text-[10px] font-black uppercase tracking-[0.3em] mb-2">
                <Briefcase className="w-4 h-4" />
                <span>Personnel Recruitment</span>
              </div>
              <h2 className="text-3xl font-display font-black">Register Team Node</h2>
              <p className="text-xs text-white/40 mt-1">Configure credentials and operational capacity metrics.</p>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateTeamMember} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Name */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/45 mb-2 block">Full Name *</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <Input 
                      placeholder="e.g. Aamir Shah"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="pl-11 bg-white/5 border-white/5 rounded-xl h-12 text-xs focus:border-kashmir-gold"
                    />
                  </div>
                </div>

                {/* Employee Code */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/45 mb-2 block">Employee Code *</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <Input 
                      placeholder="e.g. SALES002, OPS002"
                      required
                      value={formData.employeeCode}
                      onChange={(e) => setFormData(prev => ({ ...prev, employeeCode: e.target.value.toUpperCase() }))}
                      className="pl-11 bg-white/5 border-white/5 rounded-xl h-12 text-xs focus:border-kashmir-gold tracking-widest font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-white/45 mb-2 block">Email Address *</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  <Input 
                    type="email"
                    placeholder="e.g. name@kashmirconnect.com"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="pl-11 bg-white/5 border-white/5 rounded-xl h-12 text-xs focus:border-kashmir-gold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Phone */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/45 mb-2 block">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <Input 
                      placeholder="e.g. +91 9900000000"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="pl-11 bg-white/5 border-white/5 rounded-xl h-12 text-xs focus:border-kashmir-gold"
                    />
                  </div>
                </div>

                {/* Role */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/45 mb-2 block">Operational Role *</label>
                  <select 
                    value={formData.role}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full bg-white/5 border border-white/5 rounded-xl h-12 px-4 text-xs focus:border-kashmir-gold focus:outline-none text-white appearance-none"
                  >
                    <option value="sales" className="bg-[#0a0f12]">Sales Representative</option>
                    <option value="operations" className="bg-[#0a0f12]">Operations & Assets</option>
                    <option value="marketing" className="bg-[#0a0f12]">Marketing Manager</option>
                    <option value="admin" className="bg-[#0a0f12]">Enterprise Director</option>
                  </select>
                </div>
              </div>

              {/* Lead Capacity */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-white/45 mb-2 block">Daily Lead Capacity Allocation</label>
                <Input 
                  type="number"
                  min="1"
                  max="50"
                  value={formData.leadCapacity}
                  onChange={(e) => setFormData(prev => ({ ...prev, leadCapacity: e.target.value }))}
                  className="bg-white/5 border-white/5 rounded-xl h-12 text-xs focus:border-kashmir-gold"
                />
              </div>

              {/* Action Button */}
              <Button
                type="submit"
                className="w-full h-14 bg-kashmir-gold text-black hover:bg-amber-500 font-black uppercase tracking-widest text-xs rounded-xl shadow-lg mt-4"
                disabled={submitting}
              >
                {submitting ? 'Registering Node...' : 'Enroll Team Member'}
              </Button>
            </form>
          </Card>
        </div>
      )}

    </div>
  );
}
