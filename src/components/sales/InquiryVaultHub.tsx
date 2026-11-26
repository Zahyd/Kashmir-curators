import React, { useState, useEffect, useCallback } from 'react';
import {
  FileCheck2,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  FolderKanban,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  ShieldCheck
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { salesApi, SalesInquiry, InquiryDocumentItem } from '@/lib/salesApi';
import { useTeamAuth } from '@/contexts/TeamAuthContext';

interface InquiryVaultHubProps {
  inquiries: SalesInquiry[];
  onSelectInquiry: (inquiry: SalesInquiry) => void;
}

type GlobalVaultDoc = InquiryDocumentItem & {
  inquiry?: {
    id: string;
    leadId?: string;
    customerName: string;
    destination?: string;
    leadStage?: string;
  } | null;
};

export default function InquiryVaultHub({ inquiries, onSelectInquiry }: InquiryVaultHubProps) {
  const { subscribeSalesEvent } = useTeamAuth();
  const [documents, setDocuments] = useState<GlobalVaultDoc[]>([]);
  const [summary, setSummary] = useState({ total: 0, verified: 0, pending: 0, rejected: 0, totalBytes: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'VERIFIED' | 'REJECTED'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [leadQuery, setLeadQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [mutatingId, setMutatingId] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await salesApi.listAllDocuments({
        page,
        limit: 12,
        status: statusFilter,
        category: categoryFilter,
        search: search.trim()
      });
      setDocuments(data.documents || []);
      if (data.summary) setSummary(data.summary);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load Vault compliance registry.');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, categoryFilter, search]);

  useEffect(() => {
    const t = window.setTimeout(() => loadDocuments(), 180);
    return () => window.clearTimeout(t);
  }, [loadDocuments]);

  useEffect(() => {
    const unsub = subscribeSalesEvent((eventName) => {
      if (
        eventName === 'ACTIVITY_LOGGED' ||
        eventName === 'DOCUMENT_UPLOADED' ||
        eventName === 'DOCUMENT_STATUS_UPDATED'
      ) {
        loadDocuments();
      }
    });
    return unsub;
  }, [subscribeSalesEvent, loadDocuments]);

  const handleStatusUpdate = async (docId: string, nextStatus: 'VERIFIED' | 'REJECTED') => {
    setMutatingId(docId);
    try {
      await salesApi.updateDocument(docId, { status: nextStatus });
      toast.success(`Document marked ${nextStatus.toLowerCase()}`);
      loadDocuments();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update document status');
    } finally {
      setMutatingId(null);
    }
  };

  const selectableLeads = inquiries
    .filter((inq) => {
      if (!leadQuery.trim()) return true;
      const q = leadQuery.toLowerCase();
      return (
        inq.customerName?.toLowerCase().includes(q) ||
        inq.phone?.toLowerCase().includes(q) ||
        inq.destination?.toLowerCase().includes(q)
      );
    })
    .slice(0, 8);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="p-5 sm:p-7 rounded-3xl bg-gradient-to-br from-sky-500/10 via-[#0F141C] to-[#0B0F17] border border-sky-500/20 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-300 text-[10px] font-black uppercase tracking-wider mb-2">
            <FolderKanban className="w-3.5 h-3.5" />
            <span>Inquiry Vault & Compliance Registry</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-black text-white tracking-tight">
            Traveler KYC, Passports & Confirmed Vouchers
          </h2>
          <p className="text-xs sm:text-sm text-white/60 mt-1 max-w-2xl">
            Audit traveler identification, hotel vouchers, flight tickets, and payment receipts across your tenant pipeline.
          </p>
        </div>

        <Button
          onClick={loadDocuments}
          variant="outline"
          className="h-10 px-4 rounded-xl bg-white/5 border-white/15 text-white hover:bg-white/10 text-xs font-bold shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh Vault
        </Button>
      </div>

      {/* Vault KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[#0B0F17] border-white/10 p-5 rounded-2xl">
          <span className="text-[10px] font-black uppercase tracking-wider text-white/50">Total Archived Files</span>
          <div className="text-2xl font-black text-white mt-1">{summary.total}</div>
          <p className="text-[11px] text-white/40 mt-1">
            {(summary.totalBytes / (1024 * 1024)).toFixed(2)} MB vaulted
          </p>
        </Card>
        <Card className="bg-[#0B0F17] border-emerald-500/25 p-5 rounded-2xl">
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">Verified KYC & Vouchers</span>
          <div className="text-2xl font-black text-white mt-1">{summary.verified}</div>
          <p className="text-[11px] text-white/40 mt-1">Audit cleared</p>
        </Card>
        <Card className="bg-[#0B0F17] border-amber-500/25 p-5 rounded-2xl">
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">Pending Review</span>
          <div className="text-2xl font-black text-white mt-1">{summary.pending}</div>
          <p className="text-[11px] text-white/40 mt-1">Awaiting concierge sign-off</p>
        </Card>
        <Card className="bg-[#0B0F17] border-red-500/25 p-5 rounded-2xl">
          <span className="text-[10px] font-black uppercase tracking-wider text-red-400">Rejected / Resubmit</span>
          <div className="text-2xl font-black text-white mt-1">{summary.rejected}</div>
          <p className="text-[11px] text-white/40 mt-1">Requires client replacement</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Global Documents Feed */}
        <Card className="xl:col-span-8 bg-[#0B0F17] border-white/10 rounded-3xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-sky-400" />
              <span>Vault Document Queue</span>
            </h3>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search document name..."
                  className="h-9 pl-8 w-44 sm:w-52 bg-white/5 border-white/10 text-white text-xs rounded-xl"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setPage(1);
                }}
                className="h-9 px-3 rounded-xl bg-white/5 border border-white/10 text-white text-xs"
              >
                <option value="ALL" className="bg-[#0B0F17]">All Categories</option>
                <option value="ID_PROOF" className="bg-[#0B0F17]">ID Proof</option>
                <option value="PASSPORT" className="bg-[#0B0F17]">Passport</option>
                <option value="HOTEL_VOUCHER" className="bg-[#0B0F17]">Hotel Voucher</option>
                <option value="FLIGHT_TICKET" className="bg-[#0B0F17]">Flight Ticket</option>
                <option value="PAYMENT_RECEIPT" className="bg-[#0B0F17]">Payment Receipt</option>
              </select>

              <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-0.5">
                {(['ALL', 'PENDING', 'VERIFIED', 'REJECTED'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => {
                      setStatusFilter(st);
                      setPage(1);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${
                      statusFilter === st ? 'bg-amber-500 text-black' : 'text-white/50 hover:text-white'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-red-300">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
              <Button size="sm" variant="outline" onClick={loadDocuments} className="border-red-500/40 text-red-300 text-xs">
                Retry
              </Button>
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 rounded-2xl bg-white/[0.03] border border-white/5 animate-pulse" />
              ))}
            </div>
          ) : documents.length === 0 ? (
            <div className="p-10 text-center rounded-2xl bg-white/[0.02] border border-dashed border-white/10">
              <FileCheck2 className="w-8 h-8 text-white/20 mx-auto mb-2" />
              <p className="text-sm font-bold text-white/70">No vaulted documents match these filters</p>
              <p className="text-xs text-white/40 mt-1">
                Select any lead on the right to upload ID proofs, vouchers, or travel documents into their vault.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {documents.map((doc) => {
                const matchedInq = inquiries.find((i) => i.id === doc.inquiryId);
                return (
                  <div
                    key={doc.id}
                    className="p-3.5 sm:p-4 rounded-2xl bg-[#0F141C] border border-white/10 hover:border-sky-500/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-white truncate">{doc.name}</span>
                        <Badge className="bg-white/5 border-white/10 text-white/70 text-[9px] uppercase">
                          {doc.category}
                        </Badge>
                        <Badge
                          className={`text-[9px] font-bold uppercase ${
                            doc.status === 'VERIFIED'
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : doc.status === 'REJECTED'
                                ? 'bg-red-500/15 text-red-300 border-red-500/30'
                                : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          }`}
                        >
                          {doc.status}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-white/50 truncate">
                        {doc.inquiry?.customerName || matchedInq?.customerName || 'Traveler'} • Uploaded by {doc.uploadedBy || 'Staff'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      {doc.status !== 'VERIFIED' && (
                        <Button
                          size="sm"
                          disabled={mutatingId === doc.id}
                          onClick={() => handleStatusUpdate(doc.id, 'VERIFIED')}
                          className="h-8 px-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500 text-emerald-300 hover:text-black border border-emerald-500/30 text-[11px] font-bold"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          Verify
                        </Button>
                      )}
                      {doc.status !== 'REJECTED' && (
                        <Button
                          size="sm"
                          disabled={mutatingId === doc.id}
                          onClick={() => handleStatusUpdate(doc.id, 'REJECTED')}
                          className="h-8 px-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/25 text-red-300 border border-red-500/30 text-[11px] font-bold"
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1" />
                          Reject
                        </Button>
                      )}
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-8 px-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/75 text-[11px] font-bold inline-flex items-center"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        View
                      </a>
                      {matchedInq && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onSelectInquiry(matchedInq)}
                          className="h-8 px-2.5 rounded-xl border-amber-500/30 text-amber-300 text-[11px] font-bold"
                        >
                          Folder
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs text-white/60">
              <span>
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-8 px-2.5 bg-white/5 border-white/10 text-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="h-8 px-2.5 bg-white/5 border-white/10 text-white"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Right: Quick Lead Vault Folder Selector */}
        <Card className="xl:col-span-4 bg-[#0B0F17] border-white/10 rounded-3xl p-5 space-y-4">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-white">Open Client Folder</h3>
            <p className="text-[11px] text-white/50 mt-0.5">
              Select a deal to upload new ID proofs, vouchers, tickets, or compliance documents.
            </p>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={leadQuery}
              onChange={(e) => setLeadQuery(e.target.value)}
              placeholder="Find client folder..."
              className="h-9 pl-8 bg-white/5 border-white/10 text-white text-xs rounded-xl"
            />
          </div>

          <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
            {selectableLeads.length === 0 ? (
              <p className="text-xs text-white/40 text-center py-6">No matching client folders.</p>
            ) : (
              selectableLeads.map((inq) => (
                <button
                  key={inq.id}
                  onClick={() => onSelectInquiry(inq)}
                  className="w-full text-left p-3.5 rounded-2xl bg-[#0F141C] border border-white/10 hover:border-sky-400/50 transition-all group flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-white group-hover:text-sky-300 truncate">
                        {inq.customerName}
                      </span>
                      <Badge variant="outline" className="border-white/15 text-[9px] text-white/60">
                        {inq.leadStage || inq.status}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-white/45 truncate mt-0.5">
                      {inq.destination || 'Kashmir'} • {inq.phone}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-sky-400 shrink-0" />
                </button>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
