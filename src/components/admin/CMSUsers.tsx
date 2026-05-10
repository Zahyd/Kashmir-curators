import { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Shield,
  MoreVertical,
  ChevronRight,
  UserPlus,
  Trash2,
  CheckCircle2,
  Activity,
  History
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
      toast.error('Failed to load user database');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 text-kashmir-gold text-[10px] font-black uppercase tracking-[0.3em] mb-2">
            <Users className="w-4 h-4" />
            <span>Identity Management</span>
          </div>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight">Client Directory</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button className="rounded-xl bg-kashmir-gold text-black hover:bg-amber-500 font-black uppercase tracking-widest text-[10px] px-8 h-12">
            <UserPlus className="w-4 h-4 mr-2" /> Register Client
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white/5 border-white/5 p-6 rounded-[2rem] text-center">
          <p className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-2">Total Directory</p>
          <p className="text-3xl font-display font-black text-white">{users.length}</p>
        </Card>
        <Card className="bg-white/5 border-white/5 p-6 rounded-[2rem] text-center border-l-emerald-500 border-l-4">
          <p className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-2">Active Travelers</p>
          <p className="text-3xl font-display font-black text-emerald-400">{users.filter(u => (u._count?.bookings || 0) > 0).length}</p>
        </Card>
        <Card className="bg-white/5 border-white/5 p-6 rounded-[2rem] text-center">
          <p className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-2">New This Month</p>
          <p className="text-3xl font-display font-black text-blue-400">12</p>
        </Card>
        <Card className="bg-white/5 border-white/5 p-6 rounded-[2rem] text-center">
          <p className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-2">Lead Conversion</p>
          <p className="text-3xl font-display font-black text-kashmir-gold">24%</p>
        </Card>
      </div>

      <Card className="bg-white/[0.03] border-white/5 p-8 rounded-[2.5rem] backdrop-blur-xl">
        <div className="relative mb-10">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
          <Input 
            placeholder="Search by name, email or phone number..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 bg-white/5 border-white/5 rounded-2xl h-14 text-sm focus:ring-kashmir-gold/20"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((u) => (
            <div key={u.id} className="p-8 rounded-[2.5rem] bg-white/5 border border-white/5 hover:bg-white/[0.08] transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Shield className="w-16 h-16 text-kashmir-gold" />
              </div>
              
              <div className="flex items-center gap-5 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-kashmir-gold/20 to-transparent border border-kashmir-gold/20 flex items-center justify-center text-kashmir-gold font-bold text-xl">
                  {u.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg group-hover:text-kashmir-gold transition-colors">{u.name}</h3>
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/20">Client ID: #{u.id.slice(-6)}</p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <p className="text-xs text-white/40 flex items-center gap-3"><Mail className="w-4 h-4 text-white/20" /> {u.email}</p>
                <p className="text-xs text-white/40 flex items-center gap-3"><Phone className="w-4 h-4 text-white/20" /> {u.phone || 'No Phone'}</p>
                <p className="text-xs text-white/40 flex items-center gap-3"><Calendar className="w-4 h-4 text-white/20" /> Joined {new Date(u.createdAt).toLocaleDateString()}</p>
              </div>

              <div className="flex gap-4 border-t border-white/5 pt-6">
                <div className="flex-1 text-center border-r border-white/5">
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-1">Bookings</p>
                  <p className="font-bold text-white">{u._count?.bookings || 0}</p>
                </div>
                <div className="flex-1 text-center">
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-1">Leads</p>
                  <p className="font-bold text-white">{u._count?.inquiries || 0}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
