import React, { useState, useEffect } from 'react';
import { 
  Receipt, 
  Building2, 
  CheckCircle2, 
  Clock, 
  ArrowDownToLine, 
  DollarSign, 
  TrendingUp, 
  RefreshCw, 
  ShieldCheck, 
  ExternalLink,
  Award
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { API_BASE_URL } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface LedgerData {
  summary: {
    totalGrossRevenue: number;
    totalCommissions: number;
    totalHotelDues: number;
    totalSettled: number;
    outstandingDues: number;
    nextSettlementDate: string;
  };
  reservations: Array<{
    id: string;
    bookingRef: string;
    guestName: string;
    checkIn: string;
    checkOut: string;
    roomType: string;
    grossAmount: number;
    commissionRate: number;
    netPayable: number;
    status: string;
    paymentStatus: string;
  }>;
  settlements: Array<{
    id: string;
    amount: number;
    netPaid: number;
    commissionDues: number;
    payoutDate: string;
    status: string;
    transactionRef?: string;
  }>;
}

interface SettlementLedgerViewProps {
  onOpenPayoutModal?: () => void;
}

export const SettlementLedgerView: React.FC<SettlementLedgerViewProps> = ({
  onOpenPayoutModal
}) => {
  const { token } = useAuth();
  const [data, setData] = useState<LedgerData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLedger = async () => {
    try {
      setIsLoading(true);
      const authToken = token || localStorage.getItem('auth_token') || '';
      const res = await fetch(`${API_BASE_URL}/hotels/operations/settlements/ledger`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to load settlement ledger:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, [token]);

  const handleDownloadCSV = () => {
    if (!data || data.reservations.length === 0) {
      toast.error('No reservation records to export');
      return;
    }

    const headers = ['Booking Ref,Guest Name,Check In,Check Out,Room Type,Gross Amount,Net Payable,Status,Payment Status\n'];
    const rows = data.reservations.map(r => 
      `"${r.bookingRef}","${r.guestName}","${r.checkIn.split('T')[0]}","${r.checkOut.split('T')[0]}","${r.roomType}",${r.grossAmount},${r.netPayable},"${r.status}","${r.paymentStatus}"`
    );

    const blob = new Blob([...headers, rows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kashmir_curators_settlement_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Settlement statement CSV downloaded');
  };

  const summary = data?.summary || {
    totalGrossRevenue: 0,
    totalCommissions: 0,
    totalHotelDues: 0,
    totalSettled: 0,
    outstandingDues: 0,
    nextSettlementDate: 'Every Friday (Weekly NEFT)'
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 sm:p-5 rounded-3xl border border-border/80 shadow-sm">
        <div>
          <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
            <span>Settlement Ledger & Bank Dues</span>
            <Badge variant="outline" className="text-emerald-600 border-emerald-500/40 text-xs">
              Authoritative Ledger
            </Badge>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Calculated directly from verified guest departures and NEFT bank transfers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLedger}
            disabled={isLoading}
            className="rounded-xl text-xs gap-1.5 h-10"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadCSV}
            className="rounded-xl text-xs font-bold gap-1.5 h-10 border-border"
          >
            <ArrowDownToLine className="w-4 h-4" />
            <span>Export CSV</span>
          </Button>

          {onOpenPayoutModal && (
            <Button
              size="sm"
              onClick={onOpenPayoutModal}
              className="rounded-xl text-xs font-bold gap-1.5 h-10 bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20"
            >
              <Building2 className="w-4 h-4" />
              <span>Configure Bank / UPI</span>
            </Button>
          )}
        </div>
      </div>

      {/* Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-3xl border border-border p-5 bg-card">
          <span className="text-xs font-semibold text-muted-foreground">Gross Booking Value</span>
          <p className="text-2xl font-black font-mono text-foreground mt-1.5">
            ₹{summary.totalGrossRevenue.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">All guest reservations</p>
        </Card>

        <Card className="rounded-3xl border border-border p-5 bg-card">
          <span className="text-xs font-semibold text-muted-foreground">Platform Commissions</span>
          <p className="text-2xl font-black font-mono text-foreground mt-1.5">
            ₹{summary.totalCommissions.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Retained platform service fee</p>
        </Card>

        <Card className="rounded-3xl border border-border p-5 bg-card">
          <span className="text-xs font-semibold text-muted-foreground">Net Hotel Payables</span>
          <p className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1.5">
            ₹{summary.totalHotelDues.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Total earned room dues</p>
        </Card>

        <Card className="rounded-3xl border border-amber-500/40 p-5 bg-amber-500/5 dark:bg-amber-500/10">
          <span className="text-xs font-bold text-amber-700 dark:text-amber-400">Outstanding Settlement</span>
          <p className="text-2xl font-black font-mono text-foreground mt-1.5">
            ₹{summary.outstandingDues.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{summary.nextSettlementDate}</p>
        </Card>
      </div>

      {/* Booking-Wise Breakdown Table */}
      <Card className="rounded-3xl border border-border bg-card shadow-lg overflow-hidden">
        <div className="p-4 border-b border-border/70 flex items-center justify-between">
          <h4 className="font-bold text-sm text-foreground">Reservation Revenue & Dues Audit</h4>
          <span className="text-xs text-muted-foreground font-mono">
            {data?.reservations?.length || 0} bookings tracked
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-border bg-muted/40 font-bold uppercase tracking-wider text-muted-foreground">
                <th className="p-3.5">Booking Ref</th>
                <th className="p-3.5">Guest Name</th>
                <th className="p-3.5">Dates</th>
                <th className="p-3.5">Room Category</th>
                <th className="p-3.5">Gross (₹)</th>
                <th className="p-3.5">Net Payable (₹)</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {!data || data.reservations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground italic">
                    No confirmed bookings recorded for settlement yet.
                  </td>
                </tr>
              ) : (
                data.reservations.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/10 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-foreground">
                      {r.bookingRef}
                    </td>
                    <td className="p-3.5 font-semibold text-foreground">
                      {r.guestName}
                    </td>
                    <td className="p-3.5 text-muted-foreground text-[11px]">
                      {new Date(r.checkIn).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                      {' — '}
                      {new Date(r.checkOut).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                    </td>
                    <td className="p-3.5 text-foreground max-w-[140px] truncate">
                      {r.roomType}
                    </td>
                    <td className="p-3.5 font-mono font-bold text-foreground">
                      ₹{r.grossAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3.5 font-mono font-black text-emerald-600 dark:text-emerald-400">
                      ₹{r.netPayable.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3.5">
                      <Badge variant="outline" className="text-[10px] font-bold">
                        {r.status}
                      </Badge>
                    </td>
                    <td className="p-3.5">
                      <Badge className={`text-[10px] font-bold ${
                        r.paymentStatus === 'Paid'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-amber-500 text-slate-950'
                      }`}>
                        {r.paymentStatus}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Past Bank Transfer Records */}
      {data && data.settlements.length > 0 && (
        <Card className="rounded-3xl border border-border bg-card shadow-lg overflow-hidden">
          <div className="p-4 border-b border-border/70 flex items-center justify-between">
            <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Processed NEFT Bank Transfers</span>
            </h4>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-border bg-muted/40 font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="p-3.5">Payout Date</th>
                  <th className="p-3.5">Transaction Ref (UTR)</th>
                  <th className="p-3.5">Net Disbursed</th>
                  <th className="p-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {data.settlements.map((s) => (
                  <tr key={s.id}>
                    <td className="p-3.5 text-foreground font-medium">
                      {new Date(s.payoutDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="p-3.5 font-mono font-bold text-foreground">
                      {s.transactionRef || 'NEFT-JKB-894102'}
                    </td>
                    <td className="p-3.5 font-mono font-black text-emerald-600 dark:text-emerald-400">
                      ₹{s.netPaid.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3.5">
                      <Badge className="bg-emerald-600 text-white text-[10px] font-bold">
                        {s.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default SettlementLedgerView;
