import React, { useState, useEffect, useCallback } from 'react';
import {
  Check,
  Lock,
  MapPin,
  Search,
  RefreshCw,
  AlertCircle,
  Package
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { agentApi, AgentSupplyItem, AgentSupplyHold, getErrMsg } from '../lib/agentApi';

interface B2BInventoryBrowserProps {
  refreshTrigger?: number;
}

export const B2BInventoryBrowser: React.FC<B2BInventoryBrowserProps> = ({ refreshTrigger = 0 }) => {
  const { token } = useAuth();
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<AgentSupplyItem[]>([]);
  const [activeHolds, setActiveHolds] = useState<AgentSupplyHold[]>([]);
  const [commissionPct, setCommissionPct] = useState(12);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [holdingId, setHoldingId] = useState<string | null>(null);

  const loadSupply = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await agentApi.getSupply({ category: filter, search }, token);
      setItems(data.items || []);
      setActiveHolds(data.activeHolds || []);
      setCommissionPct(data.commissionPct || 12);
    } catch (err: unknown) {
      setError(getErrMsg(err, 'Failed to load wholesale database inventory'));
    } finally {
      setLoading(false);
    }
  }, [filter, search, token]);

  useEffect(() => {
    const t = setTimeout(loadSupply, 180);
    return () => clearTimeout(t);
  }, [loadSupply, refreshTrigger]);

  const handleLockRate = async (item: AgentSupplyItem) => {
    try {
      setHoldingId(item.id);
      const res = await agentApi.holdSupplyRate(
        {
          itemId: item.id,
          category: item.category,
          title: item.title,
          netRate: item.netRate
        },
        token
      );
      setActiveHolds(res.activeHolds || []);
      toast.success(`B2B Contract Rate Locked (${res.hold.id})`, {
        description: `${item.title} held at ₹${item.netRate.toLocaleString('en-IN')} for 48 hours.`
      });
    } catch (err: unknown) {
      toast.error(getErrMsg(err, 'Failed to hold B2B rate'));
    } finally {
      setHoldingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-4 rounded-2xl border border-border/70">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search live PostgreSQL hotels, cabs, packages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-xl"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'HOTEL', 'HOUSEBOAT', 'CAB', 'PACKAGE'].map((cat) => (
            <Button
              key={cat}
              size="sm"
              variant={filter === cat ? 'default' : 'outline'}
              onClick={() => setFilter(cat)}
              className="rounded-xl text-xs font-semibold shrink-0"
            >
              {cat === 'ALL' ? 'All Inventory' : cat === 'CAB' ? 'Fleets & Cabs' : `${cat.charAt(0)}${cat.slice(1).toLowerCase()}s`}
            </Button>
          ))}
          <Button size="icon" variant="ghost" onClick={loadSupply} disabled={loading} className="rounded-xl h-8 w-8 shrink-0">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {error && (
        <Card className="p-4 border-rose-500/30 bg-rose-500/5 rounded-2xl flex items-center justify-between">
          <span className="text-xs text-rose-500 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </span>
          <Button size="sm" variant="outline" onClick={loadSupply} className="rounded-xl text-xs">
            Retry
          </Button>
        </Card>
      )}

      {loading && items.length === 0 ? (
        <Card className="p-8 text-center text-xs text-muted-foreground rounded-3xl">
          Loading live wholesale inventory from PostgreSQL...
        </Card>
      ) : items.length === 0 ? (
        <Card className="p-8 text-center border-dashed rounded-3xl space-y-2">
          <Package className="w-8 h-8 text-muted-foreground mx-auto" />
          <p className="text-sm font-bold text-foreground">No Matching Wholesale Inventory</p>
          <p className="text-xs text-muted-foreground">
            Active properties, cabs, and packages configured in Operations appear here automatically at {commissionPct}% contract discount.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => {
            const margin = Math.max(0, item.retailRate - item.netRate);
            const marginPct = item.netRate > 0 ? Math.round((margin / item.netRate) * 100) : 0;
            const held = activeHolds.find((h) => h.itemId === item.id);

            return (
              <Card key={item.id} className="rounded-3xl border border-border/70 overflow-hidden bg-card hover:shadow-md transition-all flex flex-col justify-between">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant="outline" className="text-[10px] font-semibold tracking-wider uppercase">
                      {item.category}
                    </Badge>
                    <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-none font-bold text-[10px]">
                      +{marginPct}% Agency Margin
                    </Badge>
                  </div>

                  <div>
                    <h4 className="font-bold text-base text-foreground line-clamp-1">{item.title}</h4>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                      {item.location}
                    </p>
                  </div>

                  <div className="p-3 bg-muted/40 rounded-2xl space-y-2">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                          Contract Net Rate
                        </span>
                        <p className="text-lg font-black text-primary">₹{item.netRate.toLocaleString('en-IN')}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                          Retail Rack Rate
                        </span>
                        <p className="text-sm font-semibold line-through text-muted-foreground">
                          ₹{item.retailRate.toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{item.unit}</p>
                  </div>

                  {item.features.length > 0 && (
                    <ul className="space-y-1 text-muted-foreground text-[11px]">
                      {item.features.map((f, idx) => (
                        <li key={idx} className="flex items-center gap-1.5">
                          <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <Button
                    onClick={() => handleLockRate(item)}
                    disabled={holdingId === item.id}
                    variant={held ? 'secondary' : 'default'}
                    className={`w-full rounded-xl text-xs font-bold gap-2 transition-all ${
                      held
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        : 'bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>
                      {holdingId === item.id
                        ? 'Locking Rate...'
                        : held
                          ? `Held (${held.id})`
                          : 'Lock B2B Rate for 48h'}
                    </span>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default B2BInventoryBrowser;
