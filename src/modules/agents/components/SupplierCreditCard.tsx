import React from 'react';
import { 
  CreditCard, 
  ShieldCheck, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Receipt, 
  Sparkles, 
  Crown, 
  IndianRupee, 
  Download,
  Building2,
  FileCheck2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface SupplierCreditCardProps {
  isEnterprise: boolean;
  onOpenUpgradeModal: () => void;
  agencyName?: string;
  agencyCode?: string;
}

export const SupplierCreditCard: React.FC<SupplierCreditCardProps> = ({
  isEnterprise = false,
  onOpenUpgradeModal,
  agencyName = 'Chinar Luxury Holidays',
  agencyCode = 'KCB2B-1042'
}) => {
  const creditLimit = 250000;
  const utilizedCredit = 68400;
  const availableCredit = creditLimit - utilizedCredit;
  const utilizationPct = Math.round((utilizedCredit / creditLimit) * 100);

  const sampleLedger = [
    {
      id: 'TXN-9041',
      date: '18 Nov 2026',
      description: 'The Highland Chalet Gulmarg (2 Rooms, 3 Nights)',
      guestName: 'Dr. Sameer Kapoor (4 Pax)',
      amount: 37000,
      dueDate: '03 Dec 2026',
      status: 'ACTIVE_CREDIT'
    },
    {
      id: 'TXN-8994',
      date: '14 Nov 2026',
      description: 'Toyota Innova Crysta Airport & Gulmarg Circuit',
      guestName: 'Priya Sharma (2 Pax)',
      amount: 14500,
      dueDate: '29 Nov 2026',
      status: 'ACTIVE_CREDIT'
    },
    {
      id: 'TXN-8812',
      date: '02 Nov 2026',
      description: 'Nigeen Royal Cedar Houseboat MAP Stay',
      guestName: 'Vikram Sethi Family (6 Pax)',
      amount: 16900,
      dueDate: '17 Nov 2026',
      status: 'SETTLED'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Enterprise Gate Banner */}
      {!isEnterprise ? (
        <div className="bg-gradient-to-r from-purple-500/15 via-indigo-500/10 to-transparent p-6 rounded-3xl border border-purple-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-purple-500/20 text-purple-400 shrink-0">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-foreground">Net 15-Day Supplier Credit Facility</h3>
                <Badge className="bg-purple-500 text-white font-bold text-[10px]">Enterprise Only</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-xl">
                Lock 5-star hotels, luxury houseboats, and 4x4 cab allocations instantly for your clients without upfront payment. Settle on revolving 15-day credit terms.
              </p>
            </div>
          </div>
          <Button
            onClick={onOpenUpgradeModal}
            className="rounded-2xl text-xs font-bold gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shrink-0 shadow-lg shadow-purple-500/20"
          >
            <Crown className="w-4 h-4" />
            <span>Apply for Net-15 Terms</span>
          </Button>
        </div>
      ) : (
        <div className="bg-card border border-border/70 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
                <CreditCard className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Net 15-Day Supplier Credit & Escrow</h2>
              <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30 text-xs font-bold flex items-center gap-1">
                <FileCheck2 className="w-3.5 h-3.5 text-emerald-500" />
                J&K Audit Verified
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground max-w-xl">
              Revolving supplier credit approved for <strong>{agencyName}</strong> ({agencyCode}).
            </p>
          </div>
        </div>
      )}

      {/* Credit Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-3xl border border-border/70 p-5 bg-card">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Approved Credit Line
          </span>
          <div className="text-2xl font-bold text-foreground mt-1 flex items-baseline gap-1">
            <span>₹{creditLimit.toLocaleString('en-IN')}</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Revolving 15-day hotel & cab line
          </p>
        </Card>

        <Card className="rounded-3xl border border-border/70 p-5 bg-card">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Available Credit
          </span>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-baseline gap-1">
            <span>₹{availableCredit.toLocaleString('en-IN')}</span>
          </div>
          <div className="mt-2 space-y-1">
            <Progress value={utilizationPct} className="h-1.5 rounded-full" />
            <p className="text-[10px] text-muted-foreground">{utilizationPct}% credit utilized</p>
          </div>
        </Card>

        <Card className="rounded-3xl border border-border/70 p-5 bg-card">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Current Settlement Cycle
          </span>
          <div className="text-2xl font-bold text-amber-500 mt-1 flex items-baseline gap-1">
            <span>8 Days Left</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Next settlement due on 03 Dec 2026
          </p>
        </Card>
      </div>

      {/* Credit Ledger Table */}
      <Card className="rounded-3xl border border-border/70 p-6 bg-card space-y-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Receipt className="w-4 h-4 text-primary" />
            <span>Active Supplier Credit Bookings</span>
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            B2B Net wholesale bookings on credit
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border/60 text-muted-foreground text-[11px] font-semibold uppercase">
                <th className="py-3 px-3">Ref ID & Date</th>
                <th className="py-3 px-3">Booking Details</th>
                <th className="py-3 px-3">Guest</th>
                <th className="py-3 px-3">Net Amount</th>
                <th className="py-3 px-3">Due Date</th>
                <th className="py-3 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {sampleLedger.map((item) => (
                <tr key={item.id} className="hover:bg-muted/30 transition">
                  <td className="py-3 px-3">
                    <p className="font-mono font-bold text-foreground">{item.id}</p>
                    <p className="text-[10px] text-muted-foreground">{item.date}</p>
                  </td>
                  <td className="py-3 px-3 font-medium text-foreground max-w-xs truncate">
                    {item.description}
                  </td>
                  <td className="py-3 px-3 text-muted-foreground">
                    {item.guestName}
                  </td>
                  <td className="py-3 px-3 font-bold text-foreground">
                    ₹{item.amount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 text-muted-foreground font-mono">
                    {item.dueDate}
                  </td>
                  <td className="py-3 px-3">
                    {item.status === 'ACTIVE_CREDIT' ? (
                      <Badge className="bg-amber-500/15 text-amber-500 border-amber-500/30 text-[10px] font-bold">
                        Net-15 Active
                      </Badge>
                    ) : (
                      <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30 text-[10px] font-bold">
                        Settled
                      </Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
