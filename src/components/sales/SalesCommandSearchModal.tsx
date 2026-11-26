import React, { useState, useEffect } from 'react';
import {
  Search,
  Sparkles,
  FileText,
  CreditCard,
  Users,
  ArrowRight,
  Command,
  Loader2,
  X
} from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { salesApi, SalesInquiry, InquiryDocumentItem, PaymentLedgerItem } from '@/lib/salesApi';

interface QuickJumpItem {
  id: string;
  label: string;
  subtitle: string;
}

interface SalesCommandSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quickTabs: QuickJumpItem[];
  onNavigateTab: (tabId: string) => void;
  onSelectLead: (lead: SalesInquiry) => void;
  onOpenLeadPayments: (leadId: string) => void;
  onOpenLeadVault: (leadId: string) => void;
}

export default function SalesCommandSearchModal({
  open,
  onOpenChange,
  quickTabs,
  onNavigateTab,
  onSelectLead,
  onOpenLeadPayments,
  onOpenLeadVault
}: SalesCommandSearchModalProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    leads: SalesInquiry[];
    documents: Array<InquiryDocumentItem & { inquiry?: { id: string; customerName: string; leadId?: string } | null }>;
    payments: Array<PaymentLedgerItem & { inquiry?: { id: string; customerName: string; leadId?: string } | null }>;
  }>({ leads: [], documents: [], payments: [] });

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) return;
    const trimmed = query.trim();
    if (!trimmed) {
      setResults({ leads: [], documents: [], payments: [] });
      return;
    }
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const res = await salesApi.globalSearch(trimmed);
        setResults({
          leads: res.leads || [],
          documents: res.documents || [],
          payments: res.payments || []
        });
      } catch {
        // Ignore transient errors during typing
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => window.clearTimeout(timer);
  }, [query, open]);

  const matchingTabs = quickTabs.filter((t) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return t.label.toLowerCase().includes(q) || t.subtitle.toLowerCase().includes(q);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-[#0B0F17]/98 border border-white/15 text-white p-0 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-3.5 border-b border-white/10 flex items-center gap-3 bg-[#0F141C]">
          <Search className="w-4 h-4 text-amber-400 shrink-0" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search travelers, phone, lead ID, UTRs, documents, or modules..."
            className="border-0 bg-transparent focus-visible:ring-0 text-sm text-white placeholder:text-white/40 h-9 px-0"
          />
          {loading ? (
            <Loader2 className="w-4 h-4 text-amber-400 animate-spin shrink-0" />
          ) : (
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="p-1 rounded-lg hover:bg-white/10 text-white/40 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="max-h-[440px] overflow-y-auto p-3 space-y-4">
          {/* Lead Results */}
          {results.leads.length > 0 && (
            <div className="space-y-1.5">
              <div className="px-2 text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Users className="w-3 h-3" />
                <span>Travelers & Inquiries ({results.leads.length})</span>
              </div>
              {results.leads.map((lead) => (
                <button
                  key={lead.id}
                  onClick={() => {
                    onSelectLead(lead);
                    onOpenChange(false);
                  }}
                  className="w-full text-left p-2.5 rounded-xl bg-white/[0.03] hover:bg-amber-500/15 border border-white/5 hover:border-amber-500/30 flex items-center justify-between gap-3 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white truncate">{lead.customerName}</span>
                      {lead.leadId && (
                        <span className="text-[10px] font-mono text-amber-300">{lead.leadId}</span>
                      )}
                      <Badge variant="outline" className="text-[9px] border-white/15 text-white/60">
                        {lead.leadStage || lead.status}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-white/45 truncate">
                      {lead.destination || 'Kashmir'} • {lead.phone} • {lead.email || 'No email'}
                    </p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-white/40 shrink-0" />
                </button>
              ))}
            </div>
          )}

          {/* Payment Results */}
          {results.payments.length > 0 && (
            <div className="space-y-1.5">
              <div className="px-2 text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <CreditCard className="w-3 h-3" />
                <span>Payment Ledger Matches ({results.payments.length})</span>
              </div>
              {results.payments.map((tx) => (
                <button
                  key={tx.id}
                  onClick={() => {
                    onOpenLeadPayments(tx.inquiry?.id || tx.bookingId);
                    onOpenChange(false);
                  }}
                  className="w-full text-left p-2.5 rounded-xl bg-white/[0.03] hover:bg-emerald-500/10 border border-white/5 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-emerald-300">{tx.paymentId}</span>
                      <span className="text-xs text-white font-bold">
                        ₹{Number(tx.amount || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <p className="text-[11px] text-white/45 truncate">
                      {tx.inquiry?.customerName || 'Ledger entry'} • {tx.description}
                    </p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-white/40 shrink-0" />
                </button>
              ))}
            </div>
          )}

          {/* Document Results */}
          {results.documents.length > 0 && (
            <div className="space-y-1.5">
              <div className="px-2 text-[10px] font-black uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                <FileText className="w-3 h-3" />
                <span>Vault Documents ({results.documents.length})</span>
              </div>
              {results.documents.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => {
                    onOpenLeadVault(doc.inquiryId);
                    onOpenChange(false);
                  }}
                  className="w-full text-left p-2.5 rounded-xl bg-white/[0.03] hover:bg-sky-500/10 border border-white/5 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-white truncate block">{doc.name}</span>
                    <p className="text-[11px] text-white/45 truncate">
                      {doc.category} • {doc.inquiry?.customerName || 'Traveler'}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[9px] border-white/15 text-white/60">
                    {doc.status}
                  </Badge>
                </button>
              ))}
            </div>
          )}

          {/* Quick Module Navigation */}
          <div className="space-y-1.5">
            <div className="px-2 text-[10px] font-black uppercase tracking-wider text-white/45 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Workspace Modules</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {matchingTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    onNavigateTab(tab.id);
                    onOpenChange(false);
                  }}
                  className="p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.07] border border-white/5 text-left flex items-center justify-between gap-2 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">{tab.label}</div>
                    <div className="text-[10px] text-white/45 truncate">{tab.subtitle}</div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-white/30 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-4 py-2 border-t border-white/10 bg-[#0F141C] flex items-center justify-between text-[10px] text-white/45">
          <span className="flex items-center gap-1.5">
            <Command className="w-3 h-3" /> Press Ctrl+K / ⌘K anytime to open Command Search
          </span>
          <span>Live DB Search</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
