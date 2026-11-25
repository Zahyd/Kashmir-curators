import React, { useEffect, useState } from 'react';
import {
  Users,
  Search,
  Phone,
  Mail,
  MapPin,
  Send,
  RefreshCw,
  UserPlus,
  Pencil,
  Trash2,
  FolderOpen,
  FileEdit,
  ShieldCheck,
  CreditCard
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { salesApi, SalesInquiry, normalizeStageKey, getInquiryValueINR } from '@/lib/salesApi';

interface ClientDirectoryProps {
  onInspectClient?: (client: SalesInquiry) => void;
  onEditClient?: (client: SalesInquiry) => void;
  onCreateClient?: () => void;
  onNavigateTab?: (tab: 'builder' | 'vault' | 'payments', client: SalesInquiry) => void;
  canManage?: boolean;
  onRefreshMetrics?: () => void;
  refreshTrigger?: number;
}

export const ClientDirectory: React.FC<ClientDirectoryProps> = ({
  onInspectClient,
  onEditClient,
  onCreateClient,
  onNavigateTab,
  canManage = false,
  onRefreshMetrics,
  refreshTrigger = 0
}) => {
  const [clients, setClients] = useState<SalesInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<'ALL' | 'CONFIRMED' | 'ACTIVE' | 'LOST'>('ALL');
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchClients = async () => {
    try {
      const list = await salesApi.listInquiries();
      setClients(list);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load client directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [refreshTrigger]);

  const handleWhatsApp = (client: SalesInquiry) => {
    const phone = (client.phone || '').replace(/[^0-9]/g, '');
    if (!phone) {
      toast.error('Client has no valid phone number');
      return;
    }
    const recipient = phone.startsWith('91') ? phone : `91${phone}`;
    const msg = encodeURIComponent(`Greetings ${client.customerName}, this is your private concierge from Kashmir Curators. How may we assist with your Kashmir journey?`);
    window.open(`https://wa.me/${recipient}?text=${msg}`, '_blank');
  };

  const handleDeleteOrArchive = async (client: SalesInquiry) => {
    const label = canManage ? 'permanently delete' : 'archive as Lost';
    if (!window.confirm(`Are you sure you want to ${label} "${client.customerName}"?`)) return;
    setBusyId(client.id);
    try {
      if (canManage) {
        await salesApi.deleteLead(client.id);
        setClients((prev) => prev.filter((c) => c.id !== client.id));
        toast.success('Client inquiry deleted');
      } else {
        await salesApi.transitionStage(client.id, { stage: 'LOST', notes: 'Archived from Client Directory' });
        await fetchClients();
        toast.success('Client marked Lost');
      }
      onRefreshMetrics?.();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update client');
    } finally {
      setBusyId(null);
    }
  };

  const filteredClients = clients.filter((c) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      (c.customerName || '').toLowerCase().includes(q) ||
      (c.phone || '').includes(q) ||
      (c.destination || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.leadId || '').toLowerCase().includes(q);

    if (!matchesSearch) return false;

    const stage = normalizeStageKey(c.leadStage, c.status);
    if (stageFilter === 'CONFIRMED') return stage === 'CONFIRMED' || stage === 'COMPLETED';
    if (stageFilter === 'ACTIVE') return ['NEW_LEAD', 'CLAIMED', 'FOLLOW_UP', 'QUOTE_SENT', 'NEGOTIATION', 'PAYMENT_PENDING'].includes(stage);
    if (stageFilter === 'LOST') return stage === 'LOST';
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 bg-[#0F141C]/90 p-4 rounded-xl border border-white/10 shadow-lg">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            Client Directory &amp; CRM Ledger
          </h2>
          <p className="text-xs text-slate-400">
            Create, edit, inspect notes/reminders, and launch itineraries or payment settlements.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search name, phone, ID..."
              className="pl-8 bg-[#07090E] border-white/10 text-xs text-white placeholder:text-slate-500 h-9 rounded-lg w-full"
            />
          </div>

          <div className="flex items-center gap-2 justify-between sm:justify-start flex-wrap">
            <div className="flex items-center bg-[#07090E] p-1 rounded-lg border border-white/10 text-xs overflow-x-auto">
              {(['ALL', 'ACTIVE', 'CONFIRMED', 'LOST'] as const).map((tab) => (
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

            {onCreateClient && (
              <Button
                size="sm"
                onClick={onCreateClient}
                className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs h-9 px-3 shrink-0"
              >
                <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                Add Client
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={() => { setLoading(true); fetchClients(); }}
              className="border-white/10 text-slate-300 hover:text-white h-9 px-2.5 shrink-0"
              title="Refresh directory"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* Directory Grid */}
      {filteredClients.length === 0 ? (
        <div className="p-12 text-center bg-[#0F141C]/60 border border-white/10 rounded-xl text-slate-400">
          <Users className="w-8 h-8 mx-auto text-slate-500 mb-2 opacity-60" />
          <p className="text-sm font-semibold text-white">No clients matching current filter</p>
          <p className="text-xs text-slate-400 mt-1">Adjust search/stage filter or add a new client lead.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredClients.map((client) => {
            const stage = normalizeStageKey(client.leadStage, client.status);
            const isConfirmed = stage === 'CONFIRMED' || stage === 'COMPLETED';
            const valINR = getInquiryValueINR(client);
            const isBusy = busyId === client.id;

            return (
              <Card
                key={client.id}
                className="bg-[#0F141C]/90 border border-white/10 hover:border-amber-500/40 p-4 rounded-xl shadow-lg transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[10px] font-mono text-amber-400/90">
                          {client.leadId || `#${client.id.slice(0, 8)}`}
                        </span>
                        {valINR > 0 && (
                          <span className="text-[10px] font-mono font-bold text-emerald-400">
                            • ₹{valINR.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-white truncate">
                        {client.customerName || 'Private Traveler'}
                      </h3>
                    </div>
                    <Badge
                      className={
                        isConfirmed
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] shrink-0'
                          : stage === 'LOST'
                          ? 'bg-slate-600/30 text-slate-300 border border-white/10 text-[10px] shrink-0'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] shrink-0'
                      }
                    >
                      {stage.replace(/_/g, ' ')}
                    </Badge>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-300 mb-3 bg-[#07090E]/70 p-3 rounded-lg border border-white/5">
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
                      <span className="truncate">
                        {client.destination || 'Kashmir Circuit'} ({client.duration || '5N/6D'})
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-white/5">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-mono truncate">Owner: {client.assignedTo || 'Unclaimed'}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <a
                        href={`tel:${client.phone}`}
                        className="p-1.5 bg-[#07090E] border border-white/10 hover:border-amber-400 rounded-lg text-slate-300 hover:text-white transition"
                        title="Call client"
                      >
                        <Phone className="w-3 h-3" />
                      </a>
                      <button
                        onClick={() => handleWhatsApp(client)}
                        className="p-1.5 bg-emerald-500/15 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 rounded-lg transition"
                        title="WhatsApp client"
                      >
                        <Send className="w-3 h-3" />
                      </button>
                      {onEditClient && (
                        <button
                          onClick={() => onEditClient(client)}
                          className="p-1.5 bg-[#07090E] border border-white/10 hover:border-amber-400 rounded-lg text-slate-300 hover:text-white transition"
                          title="Edit client"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        disabled={isBusy}
                        onClick={() => handleDeleteOrArchive(client)}
                        className="p-1.5 bg-[#07090E] border border-white/10 hover:border-rose-400 rounded-lg text-slate-400 hover:text-rose-400 transition"
                        title={canManage ? 'Delete inquiry' : 'Archive as Lost'}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5">
                    {onInspectClient && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onInspectClient(client)}
                        className="h-7 px-1.5 text-[10px] border-white/10 text-slate-200 hover:bg-white/10"
                      >
                        <FolderOpen className="w-3 h-3 mr-1" /> CRM
                      </Button>
                    )}
                    {onNavigateTab && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onNavigateTab('builder', client)}
                          className="h-7 px-1.5 text-[10px] border-amber-500/30 text-amber-300 hover:bg-amber-500/15"
                        >
                          <FileEdit className="w-3 h-3 mr-1" /> Studio
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onNavigateTab('vault', client)}
                          className="h-7 px-1.5 text-[10px] border-teal-500/30 text-teal-300 hover:bg-teal-500/15"
                        >
                          <ShieldCheck className="w-3 h-3 mr-1" /> Vault
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onNavigateTab('payments', client)}
                          className="h-7 px-1.5 text-[10px] border-blue-500/30 text-blue-300 hover:bg-blue-500/15"
                        >
                          <CreditCard className="w-3 h-3 mr-1" /> Pay
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
