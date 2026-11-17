import React, { useState } from 'react';
import { 
  CreditCard, 
  FileText, 
  Download, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Receipt, 
  Lock, 
  ArrowUpRight,
  TrendingUp,
  Search,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { CustomerBooking } from '../types';

interface PaymentsInvoicesDeskProps {
  bookings: CustomerBooking[];
  paidInstallments: Record<string, boolean>;
  onPayInstallment: (installment: any) => void;
  onViewInvoice: (booking: any) => void;
}

export const PaymentsInvoicesDesk: React.FC<PaymentsInvoicesDeskProps> = ({
  bookings,
  paidInstallments,
  onPayInstallment,
  onViewInvoice
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'REFUNDED'>('ALL');

  // Compute financial totals
  const totalCommitment = bookings.reduce((sum, b) => sum + (b.status !== 'cancelled' ? b.totalAmount : 0), 0);
  const totalPaid = bookings
    .filter(b => b.status === 'confirmed' || b.status === 'completed')
    .reduce((sum, b) => sum + b.totalAmount, 0);
  const totalPending = Math.max(0, totalCommitment - totalPaid);

  // Installment milestone calculations
  const totalActiveBookingAmount = bookings
    .filter(b => b.status === 'confirmed' || b.status === 'pending')
    .reduce((sum, b) => sum + b.totalAmount, 0);

  const installmentPlans = [
    { 
      id: 'inst-1', 
      name: '25% Advance Booking Deposit', 
      amount: Math.round(totalActiveBookingAmount * 0.25), 
      due: 'Paid at Confirmation', 
      status: 'paid',
      desc: 'Secures primary hotel reservation block & dedicated vehicle allocation'
    },
    { 
      id: 'inst-2', 
      name: '50% Hotel CRS Block', 
      amount: Math.round(totalActiveBookingAmount * 0.50), 
      due: 'Due 10 Days Before Arrival', 
      status: 'pending',
      desc: 'Transmitted directly to hotel property management to guarantee luxury suites'
    },
    { 
      id: 'inst-3', 
      name: '25% Balance on Arrival', 
      amount: Math.round(totalActiveBookingAmount * 0.25), 
      due: 'Due Upon Srinagar Check-in', 
      status: 'pending',
      desc: 'Final clearance upon meeting your dedicated chauffeur & airport escort'
    }
  ];

  const filteredBookings = bookings.filter(b => {
    if (statusFilter === 'PAID' && b.status !== 'confirmed' && b.status !== 'completed') return false;
    if (statusFilter === 'REFUNDED' && b.status !== 'cancelled') return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return b.itemName.toLowerCase().includes(q) || b.id.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-amber-400 mb-2">
            <Receipt className="w-3 h-3 text-amber-400" />
            <span>Financial Desk</span>
          </div>
          <h2 className="font-display text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Payments & Tax Invoices
          </h2>
          <p className="text-white/50 text-xs md:text-sm mt-0.5">
            Audit-grade transaction records, installment payment schedules, and verified GST invoices.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-white/50 bg-slate-900/80 border border-white/5 px-3.5 py-2 rounded-2xl shrink-0">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>PCI-DSS 256-bit Encrypted</span>
        </div>
      </div>

      {/* Financial Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/70 border border-white/10 rounded-3xl p-5 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
          <p className="text-[10px] font-black uppercase text-white/40 tracking-wider mb-1">Total Travel Commitment</p>
          <h3 className="text-2xl md:text-3xl font-display font-extrabold text-white">
            ₹{totalCommitment.toLocaleString('en-IN')}
          </h3>
          <p className="text-[11px] text-white/40 mt-1 flex items-center gap-1.5">
            <span>{bookings.filter(b => b.status !== 'cancelled').length} Active or Cleared Journeys</span>
          </p>
        </div>

        <div className="bg-slate-900/70 border border-white/10 rounded-3xl p-5 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
          <p className="text-[10px] font-black uppercase text-emerald-400 tracking-wider mb-1">Cleared / Paid to Date</p>
          <h3 className="text-2xl md:text-3xl font-display font-extrabold text-emerald-400">
            ₹{totalPaid.toLocaleString('en-IN')}
          </h3>
          <p className="text-[11px] text-emerald-400/70 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Verified by Banking Gateway</span>
          </p>
        </div>

        <div className="bg-slate-900/70 border border-white/10 rounded-3xl p-5 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
          <p className="text-[10px] font-black uppercase text-amber-400 tracking-wider mb-1">Scheduled Balance Due</p>
          <h3 className="text-2xl md:text-3xl font-display font-extrabold text-amber-400">
            ₹{totalPending.toLocaleString('en-IN')}
          </h3>
          <p className="text-[11px] text-white/40 mt-1 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>Linked to milestone schedules</span>
          </p>
        </div>
      </div>

      {/* Installment Milestone Schedule */}
      {totalActiveBookingAmount > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm md:text-base font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-amber-400" />
              <span>Milestone Installment Schedule</span>
            </h3>
            <span className="text-xs text-white/40">Zero interest milestone breakdown</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {installmentPlans.map((installment) => {
              const isPaid = paidInstallments[installment.id] || installment.status === 'paid' || installment.amount === 0;

              return (
                <div 
                  key={installment.id} 
                  className={cn(
                    "border rounded-3xl p-5 flex flex-col justify-between min-h-[190px] transition-all relative overflow-hidden",
                    isPaid 
                      ? "bg-slate-900/50 border-emerald-500/20" 
                      : "bg-slate-900/80 border-white/10 hover:border-amber-500/40 shadow-xl"
                  )}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <Badge className={cn("text-[9px] font-black uppercase px-2 py-0.5 tracking-wider",
                        isPaid ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                      )}>
                        {isPaid ? 'Cleared & Verified' : 'Scheduled Due'}
                      </Badge>
                      <span className="text-[10px] text-white/40 font-mono">{installment.due}</span>
                    </div>

                    <h4 className="font-bold text-sm text-white mb-1">{installment.name}</h4>
                    <p className="text-[10px] text-white/45 leading-relaxed">{installment.desc}</p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-4">
                    <div>
                      <span className="text-[10px] text-white/40 block">Amount</span>
                      <span className="text-base font-black text-amber-400 font-mono">
                        ₹{installment.amount.toLocaleString('en-IN')}
                      </span>
                    </div>

                    {!isPaid ? (
                      <Button 
                        size="sm" 
                        variant="gold" 
                        onClick={() => onPayInstallment(installment)}
                        className="h-8 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 shadow-md shadow-amber-500/20"
                      >
                        Pay Now
                      </Button>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Paid</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Transaction History & Invoices */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-sm md:text-base font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
            <Receipt className="w-4 h-4 text-amber-400" />
            <span>Transaction Ledger & Invoices</span>
          </h3>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by package or ID..."
                className="bg-black/40 border-white/10 rounded-xl h-8 text-xs pl-8 w-44 md:w-56 focus-visible:ring-amber-500"
              />
            </div>

            <div className="flex p-0.5 bg-black/40 border border-white/10 rounded-xl text-[10px]">
              {(['ALL', 'PAID', 'REFUNDED'] as const).map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setStatusFilter(tab)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg font-bold transition-all",
                    statusFilter === tab ? "bg-amber-500 text-slate-950 font-black" : "text-white/50 hover:text-white"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.03] border-b border-white/10">
                  <th className="p-4 md:p-5 text-xs font-bold text-white/50 tracking-widest uppercase">Transaction Date</th>
                  <th className="p-4 md:p-5 text-xs font-bold text-white/50 tracking-widest uppercase">Travel Description</th>
                  <th className="p-4 md:p-5 text-xs font-bold text-white/50 tracking-widest uppercase">Amount</th>
                  <th className="p-4 md:p-5 text-xs font-bold text-white/50 tracking-widest uppercase">Payment Status</th>
                  <th className="p-4 md:p-5 text-xs font-bold text-white/50 tracking-widest uppercase text-right">Tax Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs md:text-sm">
                {filteredBookings.map(b => (
                  <tr key={b.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 md:p-5 text-white/70 font-mono">
                      {new Date(b.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="p-4 md:p-5 font-semibold text-white">
                      <div>
                        <span>{b.itemName}</span>
                        <span className="block text-[10px] text-white/40 font-mono mt-0.5">#{b.id.slice(-6).toUpperCase()}</span>
                      </div>
                    </td>
                    <td className="p-4 md:p-5 font-extrabold text-amber-400 font-mono">
                      ₹{b.totalAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="p-4 md:p-5">
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1", 
                        b.status === 'confirmed' || b.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : b.status === 'cancelled' 
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      )}>
                        {b.status === 'cancelled' ? 'Refunded' : b.status === 'confirmed' || b.status === 'completed' ? 'Cleared' : 'Pending'}
                      </span>
                    </td>
                    <td className="p-4 md:p-5 text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => onViewInvoice(b)}
                        className="text-white/60 hover:text-amber-400 hover:bg-white/5 rounded-xl h-8 px-3 gap-1.5 text-xs"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>View PDF</span>
                      </Button>
                    </td>
                  </tr>
                ))}
                {filteredBookings.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-white/40">
                      No matching transaction records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
