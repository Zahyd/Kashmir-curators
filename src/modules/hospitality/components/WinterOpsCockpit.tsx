import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  Snowflake, 
  Zap, 
  Droplets, 
  Fuel, 
  ShieldCheck, 
  AlertTriangle, 
  RefreshCw, 
  Sliders, 
  PhoneCall, 
  Car, 
  ExternalLink,
  CheckCircle2,
  Edit
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { API_BASE_URL } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface WinterLog {
  id?: string;
  hotelId?: string;
  bukhariStatus: string;
  firewoodStockDays: number;
  generatorStatus: string;
  generatorFuelPct: number;
  generatorRuntimeHrs: number;
  gridPowerStatus: string;
  boilerHotWater: string;
  snowRoadClearance: string;
  shikaraGhatStatus?: string;
  notes?: string;
  updatedBy?: string;
  updatedAt?: string;
}

interface WinterOpsCockpitProps {
  selectedHotelId?: string;
}

export const WinterOpsCockpit: React.FC<WinterOpsCockpitProps> = ({ selectedHotelId }) => {
  const { token, user } = useAuth();
  const [winterData, setWinterData] = useState<WinterLog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form state for update
  const [formData, setFormData] = useState<WinterLog>({
    bukhariStatus: 'OPERATIONAL',
    firewoodStockDays: 14,
    generatorStatus: 'STANDBY',
    generatorFuelPct: 90,
    generatorRuntimeHrs: 0,
    gridPowerStatus: 'LIVE',
    boilerHotWater: 'ACTIVE',
    snowRoadClearance: 'CLEAR',
    shikaraGhatStatus: 'OPEN',
    notes: 'Operational telemetry logged for current winter shift.'
  });

  const fetchWinterStatus = async () => {
    try {
      setIsLoading(true);
      const authToken = token || localStorage.getItem('auth_token') || '';
      const hotelParam = selectedHotelId ? `?hotelId=${encodeURIComponent(selectedHotelId)}` : '';
      const res = await fetch(`${API_BASE_URL}/hotels/operations/winter-ops${hotelParam}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setWinterData(data);
        if (data) {
          setFormData(data);
        }
      } else {
        setWinterData(null);
      }
    } catch (err) {
      console.error('Failed to load winter ops status:', err);
      setWinterData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWinterStatus();
  }, [token, selectedHotelId]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const authToken = token || localStorage.getItem('auth_token') || '';
      const res = await fetch(`${API_BASE_URL}/hotels/operations/winter-ops`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          ...formData,
          hotelId: selectedHotelId
        })
      });

      if (!res.ok) throw new Error('Failed to update winter operations');

      toast.success('Winter Operations Telemetry updated and published!', {
        description: 'Sub-zero readiness status broadcast to DMC network.',
        icon: '❄️'
      });
      setModalOpen(false);
      fetchWinterStatus();

      if (!res.ok) throw new Error('Failed to update winter operations');

      toast.success('Winter Operations Telemetry updated and published!');
      setModalOpen(false);
      fetchWinterStatus();
    } catch (err: any) {
      toast.error(err.message || 'Error updating status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 sm:p-5 rounded-3xl border border-border/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Kashmir Sub-Zero Operational Standard
            </span>
          </div>
          <h3 className="font-bold text-lg text-foreground mt-0.5">
            Heating, Power & Winter Road Readiness
          </h3>
          <p className="text-xs text-muted-foreground">
            Official operational logs verified by on-site property duty manager.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchWinterStatus}
            disabled={isLoading}
            className="rounded-xl text-xs gap-1.5 h-10"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </Button>

          <Button
            size="sm"
            onClick={() => {
              if (winterData) setFormData(winterData);
              setModalOpen(true);
            }}
            className="rounded-xl text-xs font-bold gap-1.5 h-10 bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Update Readiness Status</span>
          </Button>
        </div>
      </div>

      {/* 4 Core Winter Telemetry Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="rounded-3xl border border-border/60 bg-card p-5 h-40 animate-pulse" />
          ))}
        </div>
      ) : !winterData ? (
        <Card className="rounded-3xl border border-dashed border-border/80 p-8 text-center bg-card/60">
          <Snowflake className="w-10 h-10 text-amber-500/50 mx-auto mb-2" />
          <h4 className="font-bold text-sm text-foreground">No Winter Telemetry Logged Yet</h4>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
            Initialize sub-zero readiness logs (Bukhari heating, firewood days, and generator fuel) for this property.
          </p>
          <Button
            size="sm"
            onClick={() => setModalOpen(true)}
            className="rounded-xl text-xs font-bold gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Log Winter Readiness</span>
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Bukhari & Wood Stock */}
          <Card className="rounded-3xl border border-amber-500/30 bg-card p-5 space-y-3 shadow-md">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Flame className="w-5 h-5" />
              </div>
              <Badge className="bg-amber-500 text-slate-950 text-[10px] font-black uppercase">
                {winterData.bukhariStatus}
              </Badge>
            </div>
            <div>
              <h4 className="font-bold text-sm text-foreground">Central Wood Bukhari</h4>
              <p className="text-2xl font-black font-mono text-foreground mt-1">
                {winterData.firewoodStockDays} Days
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Kiln-dried pine firewood in dry store
              </p>
            </div>
          </Card>

          {/* Card 2: Generator & Fuel */}
          <Card className="rounded-3xl border border-border bg-card p-5 space-y-3 shadow-md">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Fuel className="w-5 h-5" />
              </div>
              <Badge className="bg-blue-600 text-white text-[10px] font-black uppercase">
                {winterData.generatorStatus}
              </Badge>
            </div>
            <div>
              <h4 className="font-bold text-sm text-foreground">Silent Generator Backup</h4>
              <p className="text-2xl font-black font-mono text-foreground mt-1">
                {winterData.generatorFuelPct}% Fuel
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {winterData.generatorRuntimeHrs} hrs runtime recorded
              </p>
            </div>
          </Card>

          {/* Card 3: 24/7 Hot Water Boiler */}
          <Card className="rounded-3xl border border-border bg-card p-5 space-y-3 shadow-md">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Droplets className="w-5 h-5" />
              </div>
              <Badge className="bg-emerald-600 text-white text-[10px] font-black uppercase">
                {winterData.boilerHotWater}
              </Badge>
            </div>
            <div>
              <h4 className="font-bold text-sm text-foreground">Hot Water Boilers</h4>
              <p className="text-2xl font-black font-mono text-foreground mt-1">
                24/7 Active
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Central wood boiler + geyser hybrid
              </p>
            </div>
          </Card>

          {/* Card 4: Access Corridor */}
          <Card className="rounded-3xl border border-border bg-card p-5 space-y-3 shadow-md">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Car className="w-5 h-5" />
              </div>
              <Badge className="bg-purple-600 text-white text-[10px] font-black uppercase">
                {winterData.snowRoadClearance}
              </Badge>
            </div>
            <div>
              <h4 className="font-bold text-sm text-foreground">Corridor & Ghat Clearance</h4>
              <p className="text-2xl font-black font-mono text-foreground mt-1 truncate">
                {winterData.shikaraGhatStatus || 'OPEN'}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Snow chains ready on property shuttles
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Winter Readiness Checklist & Compliance */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6 rounded-3xl border border-border bg-card space-y-4">
          <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Kashmir Winter Quality Protocol</span>
          </h4>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-muted/30 border border-border/60 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-foreground">Dual Electric Bed Warmers:</strong> Fitted in every master suite with independent guest temperature control.
              </div>
            </div>
            <div className="p-3 rounded-xl bg-muted/30 border border-border/60 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-foreground">24/7 Bukhari Firewood Refill:</strong> On-call night attendant provided for midnight wood stove refueling upon guest request.
              </div>
            </div>
            <div className="p-3 rounded-xl bg-muted/30 border border-border/60 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-foreground">Anti-Freeze Pipe Insulation:</strong> Water lines and outdoor drain pipes lagged against overnight freezing down to -10°C.
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 rounded-3xl border border-border bg-card space-y-4">
          <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
            <PhoneCall className="w-4 h-4 text-amber-500" />
            <span>Srinagar Ground Operations Emergency Lines</span>
          </h4>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
              <div>
                <p className="font-bold text-foreground">Kashmir Curators Operations Command</p>
                <p className="text-muted-foreground text-[11px]">24/7 Snow disruption & cab dispatch</p>
              </div>
              <a
                href="https://wa.me/919419000000"
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono font-bold text-amber-700 dark:text-amber-400 hover:underline"
              >
                +91 94190 00000
              </a>
            </div>

            <div className="p-3 rounded-xl bg-muted/30 border border-border/60 flex items-center justify-between">
              <div>
                <p className="font-bold text-foreground">Kashmir Power Distribution Corp (KPDCL)</p>
                <p className="text-muted-foreground text-[11px]">Grid fault reporting</p>
              </div>
              <span className="font-mono font-bold text-foreground">1912</span>
            </div>

            <div className="p-3 rounded-xl bg-muted/30 border border-border/60 flex items-center justify-between">
              <div>
                <p className="font-bold text-foreground">Traffic Police J&K National Highway</p>
                <p className="text-muted-foreground text-[11px]">NH44 & Gulmarg snow clearance status</p>
              </div>
              <span className="font-mono font-bold text-foreground">0194-2450022</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Update Readiness Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="rounded-3xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-500" />
              <span>Update Winter Operations Telemetry</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleUpdate} className="space-y-4 py-2 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                  Wood Bukhari Status
                </label>
                <Select
                  value={formData.bukhariStatus}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, bukhariStatus: v }))}
                >
                  <SelectTrigger className="rounded-xl h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPERATIONAL">Operational (Active)</SelectItem>
                    <SelectItem value="FUEL_LOW">Firewood Low (Restock)</SelectItem>
                    <SelectItem value="MAINTENANCE">Flue Cleaning Needed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                  Firewood Stock (Days)
                </label>
                <Input
                  type="number"
                  value={formData.firewoodStockDays}
                  onChange={(e) => setFormData(prev => ({ ...prev, firewoodStockDays: Number(e.target.value) || 0 }))}
                  className="rounded-xl h-11 font-mono font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                  Silent Generator Status
                </label>
                <Select
                  value={formData.generatorStatus}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, generatorStatus: v }))}
                >
                  <SelectTrigger className="rounded-xl h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STANDBY">Standby (Auto-Switch)</SelectItem>
                    <SelectItem value="RUNNING">Running On Load</SelectItem>
                    <SelectItem value="MAINTENANCE">Servicing / Oil Change</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                  Diesel Fuel Tank %
                </label>
                <Input
                  type="number"
                  value={formData.generatorFuelPct}
                  onChange={(e) => setFormData(prev => ({ ...prev, generatorFuelPct: Number(e.target.value) || 0 }))}
                  className="rounded-xl h-11 font-mono font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                  24/7 Boiler Hot Water
                </label>
                <Select
                  value={formData.boilerHotWater}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, boilerHotWater: v }))}
                >
                  <SelectTrigger className="rounded-xl h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active (Continuous Hot Water)</SelectItem>
                    <SelectItem value="REHEATING">Reheating Cycle</SelectItem>
                    <SelectItem value="FAULT">Element Fault (Attention)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                  Snow & Road Corridor
                </label>
                <Select
                  value={formData.snowRoadClearance}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, snowRoadClearance: v }))}
                >
                  <SelectTrigger className="rounded-xl h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CLEAR">Road Clear (All Cabs)</SelectItem>
                    <SelectItem value="CHAINS_REQUIRED">Chains Required on Cabs</SelectItem>
                    <SelectItem value="4X4_ONLY">4x4 Vehicles Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Duty Manager Notes
              </label>
              <Input
                value={formData.notes || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="e.g. Morning snow shovelled from driveway, Shikara crossing clear"
                className="rounded-xl h-11"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md"
              >
                Save & Broadcast Telemetry
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WinterOpsCockpit;
