import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  MessageSquare, 
  Send, 
  RefreshCw, 
  CheckCircle2, 
  Clock,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { API_BASE_URL } from '@/lib/api';

interface Client {
  id: string;
  customerName: string;
  phone: string;
  email?: string;
  destination?: string;
  duration?: string;
  leadStage?: string;
  status: string;
  budget?: string | number;
  netPrice?: number;
  assignedTo?: string;
  createdAt: string;
}

export const ClientDirectory: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<'ALL' | 'CONFIRMED' | 'ACTIVE' | 'LOST'>('ALL');

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem('team_auth_token') || localStorage.getItem('teamToken') || localStorage.getItem('token') || '';
      const portalKey = localStorage.getItem('kashmir_portal_key') || '';

      const res = await fetch(`${API_BASE_URL}/inquiries`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          ...(portalKey ? { 'x-portal-key': portalKey } : {})
        }
      });

      if (res.ok) {
        const data = await res.json();
        setClients(Array.isArray(data) ? data : data.inquiries || []);
      }
    } catch (err) {
      console.warn('Failed to fetch clients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleWhatsApp = (client: Client) => {
    const phone = (client.phone || '').replace(/[^0-9]/g, '');
    const recipient = phone.startsWith('91') ? phone : `91${phone}`;
    const msg = encodeURIComponent(`Greetings ${client.customerName}, this is your private concierge from Kashmir Curators. How may we assist with your Kashmir journey?`);
    window.open(`https://wa.me/${recipient}?text=${msg}`, '_blank');
  };

  const filteredClients = clients.filter(c => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = 
      (c.customerName || '').toLowerCase().includes(q) ||
      (c.phone || '').includes(q) ||
      (c.destination || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (stageFilter === 'CONFIRMED') {
      return c.leadStage === 'CONFIRMED' || c.status === 'Booked';
    }
    if (stageFilter === 'ACTIVE') {
      return ['CLAIMED', 'QUOTED', 'NEGOTIATION', 'QUOTE_SENT', 'NEW_LEAD'].includes(c.leadStage || '') && c.status !== 'Lost';
    }
    if (stageFilter === 'LOST') {
      return c.leadStage === 'LOST' || c.status === 'Lost';
    }

    return true;
  });

  return (
    <div className="space-y-4">
      {/* Search and Filter Strip */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-[#0F141C]/80 p-4 rounded-xl border border-white/10 backdrop-blur-md">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            Client Directory & Relationship History
          </h2>
          <p className="text-xs text-slate-400">
            Searchable repository of all Kashmir Curators private clients, itineraries and contact ledgers.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search clients by name, phone..."
              className="pl-8 bg-[#07090E] border-white/10 text-xs text-white placeholder:text-slate-500 h-9 rounded-lg w-full"
            />
          </div>

          <div className="flex items-center gap-2 justify-between sm:justify-start">
            <div className="flex items-center bg-[#07090E] p-1 rounded-lg border border-white/10 text-xs overflow-x-auto scrollbar-none">
              {(['ALL', 'CONFIRMED', 'ACTIVE', 'LOST'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setStageFilter(tab)}
                  className={`px-2.5 py-1 rounded font-medium transition text-[11px] ${
                    stageFilter === tab ? 'bg-amber-500 text-black font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => { setLoading(true); fetchClients(); }}
              className="border-white/10 text-slate-300 hover:text-white h-9 px-2.5 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* Directory Table / Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.map((client) => {
          const isConfirmed = client.leadStage === 'CONFIRMED' || client.status === 'Booked';

          return (
            <Card
              key={client.id}
              className="bg-[#0F141C]/90 border border-white/10 hover:border-amber-500/40 p-4 rounded-xl shadow-lg transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-base font-bold text-white truncate">
                    {client.customerName || 'Private Traveler'}
                  </h3>
                  <Badge className={isConfirmed ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px]" : "bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px]"}>
                    {client.leadStage || client.status}
                  </Badge>
                </div>

                <div className="space-y-1.5 text-xs text-slate-300 mb-3">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{client.phone}</span>
                  </div>
                  {client.email && (
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{client.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 truncate">
                    <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate">{client.destination || 'Kashmir Circuit'} ({client.duration || '5N/6D'})</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                <span className="text-xs font-mono text-slate-400">
                  Assigned: {client.assignedTo || 'Unclaimed'}
                </span>

                <div className="flex items-center gap-1.5">
                  <a
                    href={`tel:${client.phone}`}
                    className="p-1.5 bg-[#07090E] border border-white/10 hover:border-amber-400 rounded-lg text-slate-300 hover:text-white transition"
                    title="Call Client"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={() => handleWhatsApp(client)}
                    className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 rounded-lg text-xs font-medium flex items-center gap-1 transition"
                  >
                    <Send className="w-3 h-3" />
                    <span>WhatsApp</span>
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
