import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Search, 
  Filter, 
  RefreshCw, 
  Sparkles, 
  Globe, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar, 
  Users, 
  TrendingUp, 
  IndianRupee, 
  Send, 
  FileEdit, 
  Copy, 
  CheckCircle2, 
  Clock, 
  Moon, 
  Sun,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  Database
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { API_BASE_URL } from '@/lib/api';
import { getSalesAuthHeaders } from '@/lib/salesApi';

interface MetaLead {
  id: string;
  customerName: string;
  phone: string;
  email?: string;
  destination?: string;
  duration?: string;
  budget?: string | number;
  netPrice?: number;
  leadStage?: string;
  status: string;
  assignedTo?: string;
  createdAt: string;
  sourceCta?: string;
  geo: {
    origin: 'DOMESTIC' | 'INTERNATIONAL';
    countryCode: string;
    countryName: string;
    flag: string;
    currency: string;
    currencySymbol: string;
    localTimeFormatted: string;
    isCallSafe: boolean;
  };
  valINR: number;
  convertedVal: number;
  convertedDisplay: string;
}

interface MetaLeadsHubProps {
  onOpenItineraryBuilder: (lead: any) => void;
  onInspectLead?: (lead: any) => void;
  currentEmployee: {
    code: string;
    name: string;
    role: string;
  };
}

export default function MetaLeadsHub({ onOpenItineraryBuilder, onInspectLead, currentEmployee }: MetaLeadsHubProps) {
  const [leads, setLeads] = useState<MetaLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [originFilter, setOriginFilter] = useState<'ALL' | 'DOMESTIC' | 'INTERNATIONAL'>('ALL');
  const [stageFilter, setStageFilter] = useState<'ALL' | 'QUOTE_SENT' | 'CLAIMED' | 'CONFIRMED'>('ALL');
  const [isExporting, setIsExporting] = useState(false);

  // 1. Fetch Raw Leads Feed
  const fetchMetaLeads = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/sales/meta-leads/leads`, {
        headers: getSalesAuthHeaders()
      });

      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads || []);
      }
    } catch (err) {
      console.warn('Failed to fetch Meta raw leads feed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetaLeads();
    const interval = setInterval(fetchMetaLeads, 25000);
    return () => clearInterval(interval);
  }, []);

  // 2. 1-Click CSV Export (Option B)
  const handleExportCSV = async () => {
    setIsExporting(true);
    const toastId = toast.loading('Exporting raw Meta lead records to CSV...');

    try {
      const token = localStorage.getItem('team_auth_token') || localStorage.getItem('teamToken') || localStorage.getItem('token') || '';
      const portalKey = localStorage.getItem('kashmir_portal_key') || '';

      const res = await fetch(`${API_BASE_URL}/sales/meta-leads/export.csv`, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          ...(portalKey ? { 'x-portal-key': portalKey } : {})
        }
      });

      if (!res.ok) throw new Error('Export request failed');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Kashmir_Curators_Meta_Leads_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Raw Meta Leads CSV downloaded successfully!', { id: toastId });
    } catch (err: any) {
      // Fallback: Client-side CSV generation from current state
      if (leads.length > 0) {
        const headers = ['Lead ID', 'Name', 'Phone', 'Email', 'Origin', 'Country', 'Destination', 'Duration', 'Budget INR', 'Stage', 'Date'];
        const rows = leads.map(l => [
          `"${l.id}"`,
          `"${l.customerName}"`,
          `"${l.phone}"`,
          `"${l.email || ''}"`,
          `"${l.geo.origin}"`,
          `"${l.geo.countryName}"`,
          `"${l.destination || 'Kashmir Tour'}"`,
          `"${l.duration || '5N/6D'}"`,
          `"${l.valINR}"`,
          `"${l.leadStage || 'CLAIMED'}"`,
          `"${l.createdAt}"`
        ]);
        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Kashmir_Meta_Leads_Local_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Generated CSV from current view!', { id: toastId });
      } else {
        toast.error('No lead records to export.', { id: toastId });
      }
    } finally {
      setIsExporting(false);
    }
  };

  // 3. Quick WhatsApp Proposal Dispatch
  const handleSendWhatsAppProposal = (lead: MetaLead) => {
    const cleanPhone = (lead.phone || '').replace(/[^0-9]/g, '');
    const clientName = lead.customerName || 'Valued Guest';
    const cleanDest = lead.destination || 'Srinagar, Gulmarg & Pahalgam';
    const cleanDuration = lead.duration || '6 Days / 5 Nights';
    const quoteUrl = `${window.location.origin}/itinerary/${lead.id}`;

    const text = 
      `🏔️ *SALAAM & GREETINGS FROM THE KASHMIR CURATORS* 🏔️\n\n` +
      `Dear *${clientName}*,\n` +
      `Thank you for your interest in our signature Kashmir collection!\n\n` +
      `📍 *Curated Circuit:* ${cleanDest}\n` +
      `⏳ *Duration:* ${cleanDuration}\n` +
      `💰 *Estimated Package Price:* ₹${lead.valINR.toLocaleString('en-IN')}${lead.geo.origin === 'INTERNATIONAL' ? ` (~${lead.convertedDisplay})` : ''}\n` +
      `🏨 *Lodging:* Handpicked Luxury Mountain Resor & Cedar Houseboat\n` +
      `🚗 *Chauffeur:* Private Dedicated Toyota Innova Crysta\n\n` +
      `👉 *Review your complete interactive itinerary with day-by-day routes and verified photos:*\n${quoteUrl}\n\n` +
      `Warm regards,\n*${currentEmployee.name}* | Executive Concierge\nThe Kashmir Curators`;

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
    toast.success(`Opening WhatsApp for ${lead.customerName}!`);
  };

  // Filtered Leads
  const filteredLeads = leads.filter(l => {
    if (originFilter !== 'ALL' && l.geo.origin !== originFilter) return false;
    if (stageFilter !== 'ALL' && l.leadStage !== stageFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match = 
        (l.customerName || '').toLowerCase().includes(q) ||
        (l.phone || '').includes(q) ||
        (l.destination || '').toLowerCase().includes(q) ||
        (l.geo.countryName || '').toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });

  const domesticCount = leads.filter(l => l.geo.origin === 'DOMESTIC').length;
  const internationalCount = leads.filter(l => l.geo.origin === 'INTERNATIONAL').length;
  const totalValueINR = leads.reduce((sum, l) => sum + (l.valINR || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* 1. Header & KPI Commercial Deck */}
      <div className="p-5 sm:p-7 rounded-2xl md:rounded-3xl bg-gradient-to-br from-[#0F141C] via-[#0B1015] to-[#07090E] border border-amber-500/20 shadow-2xl backdrop-blur-2xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 pb-6 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-300 text-[10px] font-black uppercase tracking-wider mb-2">
              <Globe className="w-3.5 h-3.5 text-amber-400" />
              <span>Meta Ads Raw Inbound Pipeline (India & International)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-black text-white tracking-tight">
              Meta Leads Vault & Data Hub
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Real-time ingestion of Instagram & Facebook ad inquiries. Automatically enriched with country flags, timezone calling indicators, and foreign currency equivalents.
            </p>
          </div>

          {/* 1-Click Export & Refresh Action Deck */}
          <div className="flex items-center gap-2.5 flex-wrap w-full lg:w-auto">
            {/* 1-Click Export CSV */}
            <Button
              onClick={handleExportCSV}
              disabled={isExporting}
              className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-black text-xs h-10 px-4 rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all active:scale-95"
            >
              <Download className={cn("w-4 h-4", isExporting && "animate-bounce")} />
              <span>Export Raw CSV (Excel)</span>
            </Button>

            {/* Refresh */}
            <Button
              onClick={() => { setLoading(true); fetchMetaLeads(); }}
              variant="outline"
              size="sm"
              className="h-10 px-3 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin text-amber-400")} />
            </Button>
          </div>
        </div>

        {/* Commercial Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6">
          {/* Total Leads */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-black uppercase tracking-wider mb-1">
              <span>Total Inbound Leads</span>
              <Database className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white">
              {leads.length}
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">Direct from Meta Graph API</p>
          </div>

          {/* Domestic Leads */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-black uppercase tracking-wider mb-1">
              <span>Domestic (India)</span>
              <span className="text-base">🇮🇳</span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">
              {domesticCount}
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">High-velocity WhatsApp flow</p>
          </div>

          {/* International Leads */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-black uppercase tracking-wider mb-1">
              <span>Abroad / NRI VIP</span>
              <span className="text-base">✈️</span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-purple-400">
              {internationalCount}
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">UAE, UK, US & Southeast Asia</p>
          </div>

          {/* Total Pipeline Valuation */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-black uppercase tracking-wider mb-1">
              <span>Meta Pipeline Value</span>
              <IndianRupee className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-amber-400 truncate">
              ₹{totalValueINR.toLocaleString('en-IN')}
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">~${Math.round(totalValueINR / 86).toLocaleString()} USD est.</p>
          </div>
        </div>
      </div>

      {/* 2. Interactive Search & Segmented Filter Bar */}
      <div className="bg-[#0F141C]/80 p-3.5 sm:p-4 rounded-2xl border border-white/10 backdrop-blur-md flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-lg">
        {/* Search */}
        <div className="relative flex-1 md:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <Input 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search traveler, country, phone, city..."
            className="pl-9 bg-[#07090E] border-white/10 text-xs text-white placeholder:text-slate-500 h-9 rounded-xl focus:border-amber-400 w-full"
          />
        </div>

        {/* Origin Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
          <div className="bg-[#07090E] p-1 rounded-xl border border-white/10 flex items-center text-xs shrink-0">
            <button
              onClick={() => setOriginFilter('ALL')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                originFilter === 'ALL' ? "bg-amber-400 text-black font-bold shadow" : "text-slate-400 hover:text-white"
              )}
            >
              All Regions ({leads.length})
            </button>
            <button
              onClick={() => setOriginFilter('DOMESTIC')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1",
                originFilter === 'DOMESTIC' ? "bg-amber-400 text-black font-bold shadow" : "text-slate-400 hover:text-white"
              )}
            >
              <span>🇮🇳 Domestic</span>
              <span className="font-mono text-[10px]">({domesticCount})</span>
            </button>
            <button
              onClick={() => setOriginFilter('INTERNATIONAL')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1",
                originFilter === 'INTERNATIONAL' ? "bg-purple-500 text-white font-bold shadow" : "text-slate-400 hover:text-white"
              )}
            >
              <span>✈️ Abroad</span>
              <span className="font-mono text-[10px]">({internationalCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Raw Leads Data Stream */}
      {loading && leads.length === 0 ? (
        <div className="p-16 text-center text-slate-400 bg-[#0F141C]/50 rounded-2xl border border-white/5">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-amber-400 mb-3" />
          <p className="text-sm font-semibold text-white">Connecting to Meta Lead Stream...</p>
          <p className="text-xs text-slate-400 mt-1">Ingesting real-time webhook payloads from Instagram & Facebook Ads.</p>
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="p-16 text-center text-slate-400 bg-[#0F141C]/50 rounded-2xl border border-white/5">
          <Globe className="w-10 h-10 text-slate-500 mx-auto mb-3 opacity-60" />
          <h3 className="text-base font-bold text-white mb-1">No Leads Matching Filters</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Try adjusting your search criteria, or wait for incoming Instagram &amp; Facebook ad leads via your live Meta webhook.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredLeads.map((lead) => {
            const isIntl = lead.geo.origin === 'INTERNATIONAL';

            return (
              <Card
                key={lead.id}
                className={cn(
                  "bg-[#0F141C]/95 border rounded-2xl p-4 sm:p-5 shadow-xl transition-all duration-200 flex flex-col justify-between group",
                  isIntl ? "border-purple-500/30 hover:border-purple-500/60" : "border-white/10 hover:border-amber-400/50"
                )}
              >
                <div>
                  {/* Top Badge Strip: Country, Flag, Origin Tag */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-base">{lead.geo.flag}</span>
                      <span className="text-xs font-bold text-white tracking-wide">
                        {lead.geo.countryName}
                      </span>
                      {isIntl ? (
                        <Badge className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[9px] font-bold font-mono">
                          ABROAD / NRI
                        </Badge>
                      ) : (
                        <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-bold font-mono">
                          DOMESTIC
                        </Badge>
                      )}
                    </div>

                    {/* Timezone Calling Safe Badge */}
                    <div className={cn(
                      "flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border shrink-0",
                      lead.geo.isCallSafe 
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                        : "bg-amber-500/10 text-amber-300 border-amber-500/20"
                    )}>
                      {lead.geo.isCallSafe ? <Sun className="w-2.5 h-2.5" /> : <Moon className="w-2.5 h-2.5" />}
                      <span>{lead.geo.localTimeFormatted}</span>
                    </div>
                  </div>

                  {/* Client Name & Valuations */}
                  <div className="mb-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base font-bold text-white tracking-wide truncate group-hover:text-amber-300 transition-colors">
                        {lead.customerName || 'Anonymous Traveler'}
                      </h3>
                      <div className="text-right shrink-0">
                        <div className="text-xs font-bold text-emerald-400 font-mono">
                          ₹{lead.valINR.toLocaleString('en-IN')}
                        </div>
                        {isIntl && (
                          <div className="text-[10px] text-purple-300 font-mono font-semibold">
                            ~{lead.convertedDisplay}
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5 truncate">
                      <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                      <span>{lead.phone}</span>
                      {lead.email && <span className="text-slate-600 truncate">• {lead.email}</span>}
                    </p>
                  </div>

                  {/* Trip Parameters */}
                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-[#07090E]/80 border border-white/5 mb-4 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-300 truncate">
                      <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate">{lead.destination || 'Kashmir Tour'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Calendar className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>{lead.duration || '6D / 5N'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400 text-[11px] col-span-2">
                      <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                      <span>Received {new Date(lead.createdAt).toLocaleDateString()} at {new Date(lead.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>

                {/* Quick Action Toolbar */}
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <div className="grid grid-cols-3 gap-1.5">
                    {/* 1-Click WhatsApp Proposal Dispatch */}
                    <Button
                      size="sm"
                      onClick={() => handleSendWhatsAppProposal(lead)}
                      className="bg-emerald-500/15 hover:bg-emerald-500 text-emerald-400 hover:text-black border border-emerald-500/30 text-[11px] h-8 rounded-lg font-bold flex items-center justify-center gap-1 transition-all"
                    >
                      <Send className="w-3 h-3" />
                      <span>WA</span>
                    </Button>

                    {/* Open in Itinerary Studio */}
                    <Button
                      size="sm"
                      onClick={() => onOpenItineraryBuilder(lead)}
                      className="bg-amber-400/15 hover:bg-amber-400 text-amber-300 hover:text-black border border-amber-400/30 text-[11px] h-8 rounded-lg font-bold flex items-center justify-center gap-1 transition-all"
                    >
                      <FileEdit className="w-3 h-3" />
                      <span>Studio</span>
                    </Button>

                    {/* Inspect CRM */}
                    {onInspectLead && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onInspectLead(lead)}
                        className="border-white/15 text-slate-200 hover:bg-white/10 text-[11px] h-8 rounded-lg font-bold flex items-center justify-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>CRM</span>
                      </Button>
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
}
