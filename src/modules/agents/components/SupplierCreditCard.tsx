import React, { useState, useEffect, useCallback } from 'react';
import {
  CreditCard,
  Receipt,
  Crown,
  FileCheck2,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { agentApi, AgentCreditLedgerData, getErrMsg } from '../lib/agentApi';

interface SupplierCreditCardProps {
  isEnterprise: boolean;
  onOpenUpgradeModal: () => void;
  agencyName?: string;
  agencyCode?: string;
  refreshTrigger?: number;
}

export const SupplierCreditCard: React.FC<SupplierCreditCardProps> = ({
  isEnterprise = false,
  onOpenUpgradeModal,
  agencyName = 'Registered Travel Partner',
  agencyCode = 'AGT-PENDING',
  refreshTrigger = 0
}) => {
  const { token } = useAuth();
  const [ledger, setLedger] = useState<AgentCreditLedgerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLedger = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await agentApi.getCreditLedger(token);
      setLedger(data);
    } catch (err: unknown) {
      setError(getErrMsg(err, 'Failed to load financial credit ledger'));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadLedger();
  }, [loadLedger, refreshTrigger]);

  const creditLimit = ledger?.creditLimit || 0;
  const utilizedCredit = ledger?.utilizedCredit || 0;
  const availableCredit = ledger?.availableCredit || 0;
  const utilizationPct = creditLimit > 0 ? Math.min(100, Math.round((utilizedCredit / creditLimit) * 100)) : 0;
  const entries = ledger?.entries || [];

  return (
    <div className="space-y-6">
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
                Lock hotel, houseboat, and cab allocations on revolving 15-day credit terms backed by real PostgreSQL transaction settlements.
              </p>
            </div>
          </div>
          <Button
            onClick={onOpenUpgradeModal}
            className="rounded-2xl text-xs font-bold gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white shrink-0 shadow-lg shadow-purple-500/20"
          >
            <Crown className="w-4 h-4" />
            <span>Upgrade for Net-15 Terms</span>
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
                Live Ledger
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground max-w-xl">
              Credit & settlement ledger for <strong>{agencyName}</strong> ({agencyCode}).
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={loadLedger} disabled={loading} className="rounded-xl text-xs gap-1.5">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      )}

      {error && (
        <Card className="p-4 border-rose-500/30 bg-rose-500/5 rounded-2xl flex items-center justify-between">
          <span className="text-xs text-rose-500 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </span>
          <Button size="sm" variant="outline" onClick={loadLedger} className="rounded-xl text-xs">
            Retry
          </Button>
        </Card>
      )}

      {/* Credit Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-3xl border border-border/70 p-5 bg-card">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Approved Credit Line
          </span>
          <div className="text-2xl font-bold text-foreground mt-1 font-mono">
            ₹{creditLimit.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            {isEnterprise ? 'Revolving Enterprise B2B credit limit' : '₹0 on non-Enterprise plan'}
          </p>
        </Card>

        <Card className="rounded-3xl border border-border/70 p-5 bg-card">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Available Credit
          </span>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
            ₹{availableCredit.toLocaleString('en-IN')}
          </div>
          <div className="mt-2 space-y-1">
            <Progress value={utilizationPct} className="h-1.5 rounded-full" />
            <p className="text-[10px] text-muted-foreground">{utilizationPct}% credit utilized</p>
          </div>
        </Card>

        <Card className="rounded-3xl border border-border/70 p-5 bg-card">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Settled Ledger Volume
          </span>
          <div className="text-2xl font-bold text-amber-500 mt-1 font-mono">
            ₹{(ledger?.settledAmount || 0).toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            From {entries.length} verified PostgreSQL transactions
          </p>
        </Card>
      </div>

      {/* Real Database Credit Ledger Table */}
      <Card className="rounded-3xl border border-border/70 p-6 bg-card space-y-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Receipt className="w-4 h-4 text-primary" />
            <span>Database Transaction & Credit Ledger</span>
          </CardTitle>
          <span className="text-xs text-muted-foreground">Live PostgreSQL records only</span>
        </div>

        {loading && !ledger ? (
          <div className="p-8 text-center text-xs text-muted-foreground">Loading ledger entries...</div>
        ) : entries.length === 0 ? (
          <div className="p-8 border border-dashed rounded-2xl text-center text-xs text-muted-foreground">
            No transactions or credit bookings recorded yet. Payments and confirmed B2B settlements will stream here automatically.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border/60 text-muted-foreground text-[11px] font-semibold uppercase">
                  <th className="py-3 px-3">Ref ID & Date</th>
                  <th className="py-3 px-3">Description</th>
                  <th className="py-3 px-3">Guest / Party</th>
                  <th className="py-3 px-3">Amount</th>
                  <th className="py-3 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {entries.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30 transition">
                    <td className="py-3 px-3">
                      <p className="font-mono font-bold text-foreground">{item.id}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(item.date).toLocaleDateString('en-IN')}
                      </p>
                    </td>
                    <td className="py-3 px-3 font-medium text-foreground max-w-xs truncate">
                      {item.description}
                    </td>
                    <td className="py-3 px-3 text-muted-foreground">{item.guestName}</td>
                    <td className="py-3 px-3 font-bold text-foreground font-mono">
                      ₹{Number(item.amount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3">
                      {item.status === 'ACTIVE_CREDIT' ? (
                        <Badge className="bg-amber-500/15 text-amber-500 border-amber-500/30 text-[10px] font-bold">
                          Credit Exposure
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
        )}
      </Card>
    </div>
  );
};
