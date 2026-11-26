import React, { useState, useEffect, useCallback } from 'react';
import {
  CreditCard,
  Search,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  IndianRupee,
  ArrowRight,
  Wallet,
  ChevronLeft,
  ChevronRight,
  QrCode
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { salesApi, SalesInquiry, PaymentLedgerItem, getInquiryValueINR } from '@/lib/salesApi';
import { useTeamAuth } from '@/contexts/TeamAuthContext';

interface PaymentLinksCenterProps {
  inquiries: SalesInquiry[];
  onSelectInquiry: (inquiry: SalesInquiry) => void;
}

type EnrichedLedgerItem = PaymentLedgerItem & {
  derivedStatus: 'VERIFIED' | 'PENDING' | 'FAILED';
  inquiry?: SalesInquiry | null;
  booking?: { id: string; itemName: string; totalAmount: number; status: string } | null;
};

export default function PaymentLinksCenter({ inquiries, onSelectInquiry }: PaymentLinksCenterProps) {
  const { subscribeSalesEvent } = useTeamAuth();
  const [items, setItems] = useState<EnrichedLedgerItem[]>([]);
  const [summary, setSummary] = useState({
    totalCollected: 0,
    totalPendingAmount: 0,
    verifiedCount: 0,
    pendingCount: 0,
    totalTransactions: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VERIFIED' | 'PENDING' | 'FAILED'>('ALL');
  const [search, setSearch] = useState('');
  const [leadPickerQuery, setLeadPickerQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadLedger = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await salesApi.getPaymentLedger({
        page,
        limit: 12,
        status: statusFilter,
        search: search.trim()
      });
      setItems(data.items || []);
      if (data.summary) setSummary(data.summary);
      setTotalPages(data.totalPages || 1);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load payment settlement ledger.');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      loadLedger();
    }, 180);
    return () => window.clearTimeout(t);
  }, [loadLedger]);

  useEffect(() => {
    const unsub = subscribeSalesEvent((eventName) => {
      if (
        eventName === 'PAYMENT_CONFIRMED' ||
        eventName === 'PAYMENT_LINK_CREATED' ||
        eventName === 'PAYMENT_FAILED' ||
        eventName === 'STAGE_UPDATED'
      ) {
        loadLedger();
      }
    });
    return unsub;
  }, [subscribeSalesEvent, loadLedger]);

  const selectableLeads = inquiries
    .filter((inq) => String(inq.status || '').toLowerCase() !== 'lost')
    .filter((inq) => {
      if (!leadPickerQuery.trim()) return true;
      const q = leadPickerQuery.toLowerCase();
      return (
        inq.customerName?.toLowerCase().includes(q) ||
        inq.phone?.toLowerCase().includes(q) ||
        inq.destination?.toLowerCase().includes(q) ||
        inq.leadId?.toLowerCase().includes(q)
      );
    })
    .slice(0, 8);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="p-5 sm:p-7 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-[#0F141C] to-[#0B0F17] border border-emerald-500/20 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-black uppercase tracking-wider mb-2">
            <CreditCard className="w-3.5 h-3.5" />
            <span>Payment Links & Settlement Ledger</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-black text-white tracking-tight">
            Collect Advances, Verify UTRs & Track Settlements
          </h2>
          <p className="text-xs sm:text-sm text-white/60 mt-1 max-w-2xl">
            Live database ledger synchronized with Razorpay links, WhatsApp UPI scanners, and manual UTR reconciliations.
          </p>
        </div>

        <Button
          onClick={loadLedger}
          variant="outline"
          className="h-10 px-4 rounded-xl bg-white/5 border-white/15 text-white hover:bg-white/10 text-xs font-bold shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Sync Ledger
        </Button>
      </div>

      {/* Real-time Settlement KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[#0B0F17] border-emerald-500/25 p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">Verified Collections</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white flex items-center gap-1">
            <IndianRupee className="w-5 h-5 text-emerald-400" />
            <span>{summary.totalCollected.toLocaleString('en-IN')}</span>
          </div>
          <p className="text-[11px] text-white/45 mt-1">{summary.verifiedCount} settled transactions</p>
        </Card>

        <Card className="bg-[#0B0F17] border-amber-500/25 p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">Open Payment Requests</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white flex items-center gap-1">
            <IndianRupee className="w-5 h-5 text-amber-400" />
            <span>{summary.totalPendingAmount.toLocaleString('en-IN')}</span>
          </div>
          <p className="text-[11px] text-white/45 mt-1">{summary.pendingCount} pending links / scanners</p>
        </Card>

        <Card className="bg-[#0B0F17] border-white/10 p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-white/50">Total Ledger Records</span>
            <Wallet className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-black text-white">{summary.totalTransactions}</div>
          <p className="text-[11px] text-white/45 mt-1">Across Razorpay & Manual UTR</p>
        </Card>

        <Card className="bg-[#0B0F17] border-white/10 p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-white/50">Eligible Active Leads</span>
            <QrCode className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {inquiries.filter((i) => String(i.status || '').toLowerCase() !== 'lost').length}
          </div>
          <p className="text-[11px] text-white/45 mt-1">Select any deal below to issue link</p>
        </Card>
      </div>

      {/* Main Grid: Ledger Table + Quick Lead Payment Desk Selector */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left: Global Transaction Ledger */}
        <Card className="xl:col-span-8 bg-[#0B0F17] border-white/10 rounded-3xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-amber-400" />
              <span>Real-Time Transaction Ledger</span>
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
                  placeholder="UTR, traveler, ref..."
                  className="h-9 pl-8 w-48 sm:w-56 bg-white/5 border-white/10 text-white text-xs rounded-xl"
                />
              </div>

              <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-0.5">
                {(['ALL', 'VERIFIED', 'PENDING', 'FAILED'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => {
                      setStatusFilter(st);
                      setPage(1);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-colors ${
                      statusFilter === st
                        ? 'bg-amber-500 text-black'
                        : 'text-white/50 hover:text-white'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-red-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
              <Button size="sm" variant="outline" onClick={loadLedger} className="border-red-500/40 text-red-300 text-xs">
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
          ) : items.length === 0 ? (
            <div className="p-10 text-center rounded-2xl bg-white/[0.02] border border-dashed border-white/10">
              <CreditCard className="w-8 h-8 text-white/20 mx-auto mb-2" />
              <p className="text-sm font-bold text-white/70">No payment ledger transactions found</p>
              <p className="text-xs text-white/40 mt-1">
                Select a client on the right to generate a Razorpay link, WhatsApp UPI scanner, or log a manual UTR.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {items.map((tx) => {
                const matchedInq = tx.inquiry || inquiries.find((i) => i.id === tx.bookingId);
                return (
                  <div
                    key={tx.id}
                    className="p-3.5 sm:p-4 rounded-2xl bg-[#0F141C] border border-white/10 hover:border-amber-500/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-amber-300">{tx.paymentId}</span>
                        <Badge
                          className={`text-[9px] font-bold uppercase ${
                            tx.derivedStatus === 'VERIFIED'
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : tx.derivedStatus === 'FAILED'
                                ? 'bg-red-500/15 text-red-300 border-red-500/30'
                                : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          }`}
                        >
                          {tx.derivedStatus}
                        </Badge>
                        {matchedInq && (
                          <span className="text-xs font-bold text-white truncate">
                            {matchedInq.customerName}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-white/55 truncate">
                        {tx.description || tx.booking?.itemName || 'Payment transaction'}
                      </p>
                      <p className="text-[10px] text-white/35 font-mono">
                        {new Date(tx.createdAt).toLocaleString('en-IN')}
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                      <div className="text-right">
                        <div className="text-base font-black text-white">
                          ₹{Number(tx.amount || 0).toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] text-white/40 uppercase">{tx.type}</div>
                      </div>
                      {matchedInq && (
                        <Button
                          size="sm"
                          onClick={() => onSelectInquiry(matchedInq)}
                          className="h-8 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500 text-amber-300 hover:text-black border border-amber-500/30 text-[11px] font-bold"
                        >
                          <span>Desk</span>
                          <ExternalLink className="w-3 h-3 ml-1.5" />
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

        {/* Right: Quick Lead Selector to Open Payment Desk */}
        <Card className="xl:col-span-4 bg-[#0B0F17] border-white/10 rounded-3xl p-5 space-y-4">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-white">Issue Link / Verify UTR</h3>
            <p className="text-[11px] text-white/50 mt-0.5">
              Select a traveler deal to launch QR checkout, Razorpay link dispatch, or manual UTR verification.
            </p>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={leadPickerQuery}
              onChange={(e) => setLeadPickerQuery(e.target.value)}
              placeholder="Search traveler by name or phone..."
              className="h-9 pl-8 bg-white/5 border-white/10 text-white text-xs rounded-xl"
            />
          </div>

          <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
            {selectableLeads.length === 0 ? (
              <p className="text-xs text-white/40 text-center py-6">No matching leads found.</p>
            ) : (
              selectableLeads.map((inq) => {
                const val = getInquiryValueINR(inq);
                return (
                  <button
                    key={inq.id}
                    onClick={() => onSelectInquiry(inq)}
                    className="w-full text-left p-3.5 rounded-2xl bg-[#0F141C] border border-white/10 hover:border-amber-400/50 transition-all group flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white group-hover:text-amber-300 truncate">
                          {inq.customerName}
                        </span>
                        <Badge variant="outline" className="border-white/15 text-[9px] text-white/60">
                          {inq.leadStage || inq.status}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-white/45 truncate mt-0.5">
                        {inq.destination || 'Kashmir'} • {inq.phone}
                      </p>
                      {val > 0 && (
                        <p className="text-[11px] font-bold text-emerald-400 mt-0.5">
                          Deal Value: ₹{val.toLocaleString('en-IN')}
                        </p>
                      )}
                    </div>
                    <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-amber-400 shrink-0" />
                  </button>
                );
              })
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
