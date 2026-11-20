import React, { useState, useEffect, useMemo } from 'react';
import { 
  KeyRound, 
  ShieldCheck, 
  ShieldAlert, 
  Copy, 
  Check, 
  Plus, 
  RefreshCw, 
  Search, 
  Trash2, 
  ExternalLink, 
  Lock, 
  Unlock, 
  Building2, 
  Users, 
  Share2, 
  Calendar, 
  Clock, 
  Sparkles, 
  Smartphone, 
  Filter,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Hotel
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription 
} from '@/components/ui/dialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/lib/api';
import { cn } from '@/lib/utils';

export interface PortalKey {
  id: string;
  portalType: string;
  accessKey: string;
  assignedName: string;
  assignedContact?: string | null;
  designation?: string | null;
  propertyScope?: string | null;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  expiresAt?: string | null;
  lastUsedAt?: string | null;
  usageCount: number;
  createdByName?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface HotelOption {
  id: string;
  name: string;
  location?: string;
}

const PORTAL_CONFIG: Record<string, { label: string; prefix: string; color: string; badgeBg: string; route: string; description: string }> = {
  HOSPITALITY: {
    label: 'Hospitality Desk',
    prefix: 'KC-HOSP-',
    color: 'text-amber-400',
    badgeBg: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    route: '/hospitality',
    description: 'Hotel reservations, property rate negotiation & reception confirmations'
  },
  SALES: {
    label: 'Sales & Quoting',
    prefix: 'KC-SALE-',
    color: 'text-emerald-400',
    badgeBg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    route: '/sales',
    description: 'Lead management, dynamic itinerary generation & client quotes'
  },
  DRIVER: {
    label: 'Driver Cockpit',
    prefix: 'KC-DRV-',
    color: 'text-sky-400',
    badgeBg: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
    route: '/driver',
    description: 'Fleet assignments, ground dispatch & guest pickup tracking'
  },
  VENDOR: {
    label: 'Vendor Hub',
    prefix: 'KC-VND-',
    color: 'text-purple-400',
    badgeBg: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
    route: '/vendor',
    description: 'Supplier payouts, activity booking & equipment inventories'
  },
  OPERATIONS: {
    label: 'Operations Radar',
    prefix: 'KC-OPS-',
    color: 'text-cyan-400',
    badgeBg: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
    route: '/operations',
    description: 'Real-time telemetry, disruption tracking & safety monitoring'
  }
};

export default function CMSPortalKeys() {
  const [keys, setKeys] = useState<PortalKey[]>([]);
  const [hotels, setHotels] = useState<HotelOption[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  
  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPortal, setSelectedPortal] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  
  // Generator Dialog State
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [portalType, setPortalType] = useState('HOSPITALITY');
  const [assignedName, setAssignedName] = useState('');
  const [assignedContact, setAssignedContact] = useState('');
  const [designation, setDesignation] = useState('');
  const [propertyScope, setPropertyScope] = useState('ALL');
  const [expiryDays, setExpiryDays] = useState('0'); // 0 = never
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  
  // Handoff / Success Dialog State
  const [newlyCreatedKeys, setNewlyCreatedKeys] = useState<PortalKey[]>([]);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  // Helper for auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('teamToken') || localStorage.getItem('token') || localStorage.getItem('adminToken') || '';
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  // Fetch keys from server
  const fetchKeys = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/portal-keys`, {
        headers: getAuthHeaders()
      });
      if (!res.ok) {
        throw new Error('Failed to fetch portal access keys');
      }
      const data = await res.json();
      setKeys(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Error fetching portal keys:', err);
      toast.error('Failed to load portal access keys');
    } finally {
      setLoading(false);
    }
  };

  // Fetch hotels for property scope dropdown
  const fetchHotels = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/hotels?all=true`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setHotels(data.map((h: any) => ({ id: h.id, name: h.name, location: h.location })));
        }
      }
    } catch (err) {
      console.error('Failed to load hotels list:', err);
    }
  };

  useEffect(() => {
    fetchKeys();
    fetchHotels();
  }, []);

  // Handle generation submission
  const handleGenerateKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignedName.trim() && quantity <= 1) {
      toast.error('Please specify the teammate name or batch label');
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/portal-keys`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          portalType,
          assignedName: assignedName.trim() || undefined,
          assignedContact: assignedContact.trim() || undefined,
          designation: designation.trim() || undefined,
          propertyScope: propertyScope || 'ALL',
          expiryDays: parseInt(expiryDays, 10),
          count: quantity,
          notes: notes.trim() || undefined
        })
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Failed to generate access keys');
      }

      toast.success(result.message || `Successfully generated ${result.keys?.length || 1} key(s)`);
      setIsGenerateOpen(false);
      setNewlyCreatedKeys(result.keys || []);
      setIsSuccessOpen(true);
      
      // Reset form
      setAssignedName('');
      setAssignedContact('');
      setDesignation('');
      setNotes('');
      setQuantity(1);
      setExpiryDays('0');

      fetchKeys();
    } catch (err: any) {
      console.error('Error generating keys:', err);
      toast.error(err.message || 'Failed to generate keys');
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle status (Active <-> Revoked)
  const handleToggleStatus = async (id: string, currentStatus: string, keyName: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/portal-keys/${id}/toggle`, {
        method: 'PATCH',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update key status');

      toast.success(data.message || `Key status updated`);
      fetchKeys();
    } catch (err: any) {
      toast.error(err.message || 'Error toggling key');
    }
  };

  // Delete key
  const handleDeleteKey = async (id: string, keyName: string) => {
    if (!confirm(`Are you sure you want to permanently delete access key ${keyName}? This cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/portal-keys/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete key');

      toast.success('Key deleted permanently');
      fetchKeys();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete key');
    }
  };

  // Copy key to clipboard
  const handleCopyKey = (keyString: string, id: string) => {
    navigator.clipboard.writeText(keyString);
    setCopiedKeyId(id);
    toast.success(`Copied key: ${keyString}`);
    setTimeout(() => {
      setCopiedKeyId(null);
    }, 2000);
  };

  // Copy dispatch message for WhatsApp / Email
  const handleCopyDispatchMessage = (keyItem: PortalKey) => {
    const config = PORTAL_CONFIG[keyItem.portalType.toUpperCase()] || PORTAL_CONFIG.HOSPITALITY;
    const origin = window.location.origin;
    const portalUrl = `${origin}${config.route}`;

    const text = `🏔️ *KASHMIR CURATORS DMC — PORTAL ACCESS CREDENTIALS*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• *Portal*: ${config.label}
• *Assigned Teammate*: ${keyItem.assignedName} ${keyItem.designation ? `(${keyItem.designation})` : ''}
• *Unique Access Key*: \`${keyItem.accessKey}\`
• *Portal Direct URL*: ${portalUrl}
• *Scope of Access*: ${keyItem.propertyScope === 'ALL' ? 'All Portfolio Properties' : keyItem.propertyScope}
• *Status*: ${keyItem.status}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 *Instructions*: 
Open the link above and enter your Unique Access Key to access your operational workspace. Do not share your key with unauthorized personnel.`;

    navigator.clipboard.writeText(text);
    toast.success('Formatted Teammate Access Dispatch copied to clipboard! Ready to send via WhatsApp or Email.');
  };

  // Filter keys
  const filteredKeys = useMemo(() => {
    return keys.filter(k => {
      const matchesSearch = 
        !searchQuery.trim() ||
        k.accessKey.toLowerCase().includes(searchQuery.toLowerCase()) ||
        k.assignedName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (k.designation && k.designation.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (k.assignedContact && k.assignedContact.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (k.notes && k.notes.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesPortal = selectedPortal === 'ALL' || k.portalType.toUpperCase() === selectedPortal.toUpperCase();
      const matchesStatus = selectedStatus === 'ALL' || k.status.toUpperCase() === selectedStatus.toUpperCase();

      return matchesSearch && matchesPortal && matchesStatus;
    });
  }, [keys, searchQuery, selectedPortal, selectedStatus]);

  // Telemetry KPIs
  const stats = useMemo(() => {
    const total = keys.length;
    const active = keys.filter(k => k.status === 'ACTIVE').length;
    const hospitality = keys.filter(k => k.portalType.toUpperCase() === 'HOSPITALITY').length;
    const otherPortals = keys.filter(k => k.portalType.toUpperCase() !== 'HOSPITALITY').length;
    const revoked = keys.filter(k => k.status === 'REVOKED' || k.status === 'EXPIRED').length;

    return { total, active, hospitality, otherPortals, revoked };
  }, [keys]);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-amber-500/10 text-amber-300 border-amber-500/30 text-[10px] font-mono uppercase tracking-widest px-2 py-0.5">
              SuperAdmin Security Protocol
            </Badge>
            <Badge className="bg-emerald-500/10 text-emerald-300 border-emerald-500/30 text-[10px] font-mono uppercase tracking-widest px-2 py-0.5">
              PostgreSQL Sync Active
            </Badge>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
            <KeyRound className="w-7 h-7 text-amber-400" />
            Portal Access Keys & Teammate Permissions
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-3xl">
            Issue, audit, and revoke unique cryptographic access keys for internal teammates. Reservation officers can only access the live 
            Hospitality Desk via authorized keys generated here.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchKeys}
            disabled={loading}
            className="border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-slate-300 gap-2 h-10 px-4"
          >
            <RefreshCw className={cn("w-4 h-4 text-amber-400", loading && "animate-spin")} />
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open('/hospitality', '_blank')}
            className="border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 text-amber-300 gap-2 h-10 px-4"
          >
            <ExternalLink className="w-4 h-4" />
            Test Hospitality Gate
          </Button>

          <Button
            size="sm"
            onClick={() => setIsGenerateOpen(true)}
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold gap-2 h-10 px-5 shadow-lg shadow-amber-500/20"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Generate Access Key(s)
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
        <Card className="bg-[#0b1015]/80 border-white/10 backdrop-blur-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Keys Issued</span>
              <KeyRound className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-black text-white mt-2 font-mono">{stats.total}</div>
            <p className="text-[10px] text-slate-500 mt-1">Cryptographically unique</p>
          </CardContent>
        </Card>

        <Card className="bg-[#0b1015]/80 border-emerald-500/20 backdrop-blur-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Active Keys</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-300 mt-2 font-mono">{stats.active}</div>
            <p className="text-[10px] text-emerald-500/80 mt-1">Unlocked & valid</p>
          </CardContent>
        </Card>

        <Card className="bg-[#0b1015]/80 border-amber-500/20 backdrop-blur-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">Hospitality Desk</span>
              <Hotel className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-300 mt-2 font-mono">{stats.hospitality}</div>
            <p className="text-[10px] text-amber-500/80 mt-1">Reservation team passes</p>
          </CardContent>
        </Card>

        <Card className="bg-[#0b1015]/80 border-sky-500/20 backdrop-blur-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400">Sales / Fleet / Ops</span>
              <Users className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl font-black text-sky-300 mt-2 font-mono">{stats.otherPortals}</div>
            <p className="text-[10px] text-sky-500/80 mt-1">Multi-portal passes</p>
          </CardContent>
        </Card>

        <Card className="bg-[#0b1015]/80 border-rose-500/20 backdrop-blur-md col-span-2 md:col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400">Revoked / Expired</span>
              <ShieldAlert className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-black text-rose-400 mt-2 font-mono">{stats.revoked}</div>
            <p className="text-[10px] text-rose-500/80 mt-1">Access immediately denied</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter & Portal Tabs Bar */}
      <Card className="bg-[#0b1015]/90 border-white/10 p-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          
          {/* Portal Switcher Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-thin">
            <button
              onClick={() => setSelectedPortal('ALL')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all",
                selectedPortal === 'ALL'
                  ? "bg-white text-black shadow-md"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              )}
            >
              All Portals ({keys.length})
            </button>
            {Object.entries(PORTAL_CONFIG).map(([key, config]) => {
              const count = keys.filter(k => k.portalType.toUpperCase() === key).length;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedPortal(key)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5",
                    selectedPortal === key
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <span className={cn("w-1.5 h-1.5 rounded-full", key === 'HOSPITALITY' ? 'bg-amber-400' : 'bg-slate-400')} />
                  {config.label}
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/10 text-slate-300 font-mono">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search & Status Filter */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <Input
                placeholder="Search key, name, role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 bg-white/[0.03] border-white/10 text-xs text-white placeholder:text-slate-500 rounded-lg focus-visible:ring-amber-400/50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
                >
                  ×
                </button>
              )}
            </div>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-32 h-9 bg-white/[0.03] border-white/10 text-xs text-slate-300 rounded-lg">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-[#0f141a] border-white/10 text-slate-200">
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active Only</SelectItem>
                <SelectItem value="REVOKED">Revoked Only</SelectItem>
                <SelectItem value="EXPIRED">Expired Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

        </div>
      </Card>

      {/* Keys Data Table */}
      <Card className="bg-[#0b1015]/95 border-white/10 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-white/[0.02] border-b border-white/10">
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-slate-400 text-xs uppercase tracking-wider font-bold">Access Key Code</TableHead>
                <TableHead className="text-slate-400 text-xs uppercase tracking-wider font-bold">Portal</TableHead>
                <TableHead className="text-slate-400 text-xs uppercase tracking-wider font-bold">Assignee & Designation</TableHead>
                <TableHead className="text-slate-400 text-xs uppercase tracking-wider font-bold">Scope / Properties</TableHead>
                <TableHead className="text-slate-400 text-xs uppercase tracking-wider font-bold">Usage & Telemetry</TableHead>
                <TableHead className="text-slate-400 text-xs uppercase tracking-wider font-bold">Validity</TableHead>
                <TableHead className="text-slate-400 text-xs uppercase tracking-wider font-bold">Status</TableHead>
                <TableHead className="text-slate-400 text-xs uppercase tracking-wider font-bold text-right">Superadmin Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-16 text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <RefreshCw className="w-6 h-6 text-amber-400 animate-spin" />
                      <p className="text-sm font-medium">Loading portal access keys from Neon DB...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredKeys.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-16 text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <KeyRound className="w-10 h-10 text-slate-600 stroke-[1.5]" />
                      <p className="text-sm font-semibold text-slate-300">No Portal Access Keys match your query</p>
                      <p className="text-xs text-slate-500 max-w-sm">
                        Generate a new access key above to authorize reservation officers or other portal operators.
                      </p>
                      <Button
                        size="sm"
                        onClick={() => setIsGenerateOpen(true)}
                        className="bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs mt-2"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Generate Key Now
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredKeys.map((item) => {
                  const portalCfg = PORTAL_CONFIG[item.portalType.toUpperCase()] || PORTAL_CONFIG.HOSPITALITY;
                  const isCopied = copiedKeyId === item.id;
                  const isExpired = item.expiresAt && new Date() > new Date(item.expiresAt);
                  const effectiveStatus = isExpired ? 'EXPIRED' : item.status;

                  return (
                    <TableRow key={item.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      {/* Access Key Code */}
                      <TableCell className="font-mono font-bold text-sm">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "px-2.5 py-1 rounded-md text-xs tracking-wider border",
                            item.status === 'ACTIVE' && !isExpired
                              ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                              : "bg-slate-800 text-slate-400 border-slate-700"
                          )}>
                            {item.accessKey}
                          </span>
                          <button
                            onClick={() => handleCopyKey(item.accessKey, item.id)}
                            title="Copy Access Key"
                            className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </TableCell>

                      {/* Portal */}
                      <TableCell>
                        <Badge className={cn("text-[11px] font-semibold border", portalCfg.badgeBg)}>
                          {portalCfg.label}
                        </Badge>
                      </TableCell>

                      {/* Assignee & Designation */}
                      <TableCell>
                        <div>
                          <div className="font-medium text-white text-xs flex items-center gap-1.5">
                            {item.assignedName}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {item.designation || 'Portal Teammate'}
                          </div>
                          {item.assignedContact && (
                            <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <Smartphone className="w-3 h-3" />
                              {item.assignedContact}
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* Scope / Properties */}
                      <TableCell>
                        <div className="text-xs text-slate-300 flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="truncate max-w-[150px]">
                            {item.propertyScope === 'ALL' || !item.propertyScope 
                              ? 'All Portfolio Properties' 
                              : item.propertyScope}
                          </span>
                        </div>
                      </TableCell>

                      {/* Usage & Telemetry */}
                      <TableCell>
                        <div className="text-xs">
                          <div className="text-slate-300 font-mono flex items-center gap-1.5">
                            <span className="font-bold text-amber-400">{item.usageCount || 0}</span> logins
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {item.lastUsedAt ? new Date(item.lastUsedAt).toLocaleDateString() : 'Never used'}
                          </div>
                        </div>
                      </TableCell>

                      {/* Validity */}
                      <TableCell>
                        <div className="text-xs">
                          {item.expiresAt ? (
                            <span className={cn(isExpired ? "text-rose-400 font-medium" : "text-slate-300")}>
                              {new Date(item.expiresAt).toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[11px]">Permanent (No Expiry)</span>
                          )}
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        {effectiveStatus === 'ACTIVE' && (
                          <Badge className="bg-emerald-500/10 text-emerald-300 border-emerald-500/30 text-[10px] font-bold">
                            Active
                          </Badge>
                        )}
                        {effectiveStatus === 'REVOKED' && (
                          <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/30 text-[10px] font-bold">
                            Revoked
                          </Badge>
                        )}
                        {effectiveStatus === 'EXPIRED' && (
                          <Badge className="bg-slate-700/50 text-slate-400 border-slate-600 text-[10px] font-bold">
                            Expired
                          </Badge>
                        )}
                      </TableCell>

                      {/* Superadmin Actions */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Toggle Status (Active/Revoke) */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(item.id, item.status, item.accessKey)}
                            title={item.status === 'ACTIVE' ? 'Revoke Access Immediately' : 'Re-activate Key'}
                            className={cn(
                              "h-8 px-2 text-xs gap-1 border",
                              item.status === 'ACTIVE'
                                ? "border-rose-500/20 hover:bg-rose-500/10 text-rose-400"
                                : "border-emerald-500/20 hover:bg-emerald-500/10 text-emerald-400"
                            )}
                          >
                            {item.status === 'ACTIVE' ? (
                              <>
                                <Lock className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Revoke</span>
                              </>
                            ) : (
                              <>
                                <Unlock className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Activate</span>
                              </>
                            )}
                          </Button>

                          {/* Dispatch / Share Handoff Info */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyDispatchMessage(item)}
                            title="Copy Teammate Dispatch Info (WhatsApp/Email)"
                            className="h-8 px-2 text-xs border border-white/10 hover:bg-white/10 text-slate-300 gap-1"
                          >
                            <Share2 className="w-3.5 h-3.5 text-amber-400" />
                            <span className="hidden sm:inline">Share</span>
                          </Button>

                          {/* Delete Key */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteKey(item.id, item.accessKey)}
                            title="Delete Key Permanently"
                            className="h-8 w-8 p-0 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Generator Modal Dialog (Single or Bulk) */}
      <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
        <DialogContent className="sm:max-w-xl bg-[#0b1015] border border-white/15 text-white shadow-2xl p-6">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <Badge className="bg-amber-500/10 text-amber-300 border-amber-500/30 text-[10px] font-mono uppercase">
                Access Engine
              </Badge>
              <Badge className="bg-blue-500/10 text-blue-300 border-blue-500/30 text-[10px] font-mono uppercase">
                Bulk Generator Ready
              </Badge>
            </div>
            <DialogTitle className="text-xl font-black tracking-tight flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-amber-400" />
              Generate Unique Portal Access Keys
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Create cryptographically secure, scoped access keys for your team members. Keys are immediately valid for login.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleGenerateKeys} className="space-y-4 mt-2">
            
            {/* Target Portal & Batch Quantity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">Target Portal *</label>
                <Select value={portalType} onValueChange={setPortalType}>
                  <SelectTrigger className="bg-white/[0.04] border-white/10 text-xs text-white">
                    <SelectValue placeholder="Select portal" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0f141a] border-white/10 text-slate-200">
                    <SelectItem value="HOSPITALITY">Hospitality Desk (KC-HOSP-)</SelectItem>
                    <SelectItem value="SALES">Sales & Quoting (KC-SALE-)</SelectItem>
                    <SelectItem value="DRIVER">Driver Cockpit (KC-DRV-)</SelectItem>
                    <SelectItem value="VENDOR">Vendor Hub (KC-VND-)</SelectItem>
                    <SelectItem value="OPERATIONS">Operations Radar (KC-OPS-)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-slate-500 mt-1">
                  Prefix: <span className="font-mono text-amber-400">{PORTAL_CONFIG[portalType]?.prefix}</span>
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">Number of Keys to Generate</label>
                <Select value={quantity.toString()} onValueChange={(val) => setQuantity(parseInt(val, 10))}>
                  <SelectTrigger className="bg-white/[0.04] border-white/10 text-xs text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0f141a] border-white/10 text-slate-200">
                    <SelectItem value="1">1 Key (Single Teammate)</SelectItem>
                    <SelectItem value="3">3 Keys (Shift Batch)</SelectItem>
                    <SelectItem value="5">5 Keys (Team Batch)</SelectItem>
                    <SelectItem value="10">10 Keys (Department Batch)</SelectItem>
                    <SelectItem value="20">20 Keys (Seasonal Inflow)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-slate-500 mt-1">
                  {quantity > 1 ? `Will issue ${quantity} distinct unique keys` : 'Single key for one person'}
                </p>
              </div>
            </div>

            {/* Teammate Name & Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  {quantity > 1 ? 'Batch / Team Label *' : 'Teammate Full Name *'}
                </label>
                <Input
                  required
                  placeholder={quantity > 1 ? 'e.g. Reservation Desk Shift A' : 'e.g. Aaqib Mir'}
                  value={assignedName}
                  onChange={(e) => setAssignedName(e.target.value)}
                  className="bg-white/[0.04] border-white/10 text-xs text-white placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">Designation / Role Title</label>
                <Input
                  placeholder={portalType === 'HOSPITALITY' ? 'Senior Reservation Officer' : 'Portal Operator'}
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className="bg-white/[0.04] border-white/10 text-xs text-white placeholder:text-slate-500"
                />
              </div>
            </div>

            {/* Contact & Property Scope */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">Teammate Contact (WhatsApp/Email)</label>
                <Input
                  placeholder="+91 94190 XXXXX / email@example.com"
                  value={assignedContact}
                  onChange={(e) => setAssignedContact(e.target.value)}
                  className="bg-white/[0.04] border-white/10 text-xs text-white placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">Property Scope Restriction</label>
                <Select value={propertyScope} onValueChange={setPropertyScope}>
                  <SelectTrigger className="bg-white/[0.04] border-white/10 text-xs text-white">
                    <SelectValue placeholder="Scope" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0f141a] border-white/10 text-slate-200 max-h-48">
                    <SelectItem value="ALL">ALL PROPERTIES (Full DMC Portfolio)</SelectItem>
                    {hotels.map(h => (
                      <SelectItem key={h.id} value={h.name}>
                        {h.name} {h.location ? `(${h.location})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-slate-500 mt-1">
                  Restrict desk user to view only specific property bookings if needed
                </p>
              </div>
            </div>

            {/* Validity / Expiration & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">Key Validity Period</label>
                <Select value={expiryDays} onValueChange={setExpiryDays}>
                  <SelectTrigger className="bg-white/[0.04] border-white/10 text-xs text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0f141a] border-white/10 text-slate-200">
                    <SelectItem value="0">Never Expire (Permanent Access)</SelectItem>
                    <SelectItem value="7">7 Days (Temporary / Trial Pass)</SelectItem>
                    <SelectItem value="30">30 Days (Monthly Cycle)</SelectItem>
                    <SelectItem value="90">90 Days (Quarterly Season)</SelectItem>
                    <SelectItem value="365">365 Days (1 Year Validity)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">Audit Notes / Reason (Optional)</label>
                <Input
                  placeholder="e.g. Issued for Gulmarg winter reservation shift"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="bg-white/[0.04] border-white/10 text-xs text-white placeholder:text-slate-500"
                />
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-white/10 gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsGenerateOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={actionLoading}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold gap-2"
              >
                {actionLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
                Mint {quantity > 1 ? `${quantity} Keys` : 'Key Now'}
              </Button>
            </DialogFooter>

          </form>
        </DialogContent>
      </Dialog>

      {/* Success / Batch Handoff Dialog */}
      <Dialog open={isSuccessOpen} onOpenChange={setIsSuccessOpen}>
        <DialogContent className="sm:max-w-lg bg-[#0b1015] border border-amber-500/30 text-white shadow-2xl p-6">
          <DialogHeader>
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mb-2">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <DialogTitle className="text-xl font-black text-white">
              Successfully Minted {newlyCreatedKeys.length} Portal Key(s)!
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              The keys below have been registered in Neon PostgreSQL. Share them with your teammates to allow instant sign-in.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 my-3 max-h-60 overflow-y-auto pr-1">
            {newlyCreatedKeys.map((k) => (
              <div 
                key={k.id}
                className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] border border-white/10"
              >
                <div>
                  <div className="font-mono font-bold text-amber-300 text-sm tracking-wide">
                    {k.accessKey}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {k.assignedName} • {k.portalType}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopyKey(k.accessKey, k.id)}
                    className="h-8 border-white/10 bg-white/5 hover:bg-white/10 text-xs gap-1"
                  >
                    {copiedKeyId === k.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    Copy
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter className="pt-3 border-t border-white/10 flex flex-col sm:flex-row gap-2">
            {newlyCreatedKeys.length === 1 && (
              <Button
                variant="outline"
                onClick={() => handleCopyDispatchMessage(newlyCreatedKeys[0])}
                className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10 gap-1.5 text-xs w-full sm:w-auto"
              >
                <Share2 className="w-3.5 h-3.5" />
                Copy WhatsApp Handoff Message
              </Button>
            )}
            <Button
              onClick={() => setIsSuccessOpen(false)}
              className="bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs w-full sm:w-auto ml-auto"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
