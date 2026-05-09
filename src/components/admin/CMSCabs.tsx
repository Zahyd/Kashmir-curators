import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Eye, EyeOff, Loader2, Car, Users, Zap, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useTeamAuth } from '@/contexts/TeamAuthContext';
import MediaPicker from './MediaPicker';

interface Cab {
  id: string;
  name: string;
  type: string;
  capacity: number;
  pricePerKm: number;
  basePrice: number;
  image: string | null;
  features: string[];
  isActive: boolean;
}

const defaultCab: Omit<Cab, 'id'> = {
  name: '',
  type: '',
  capacity: 4,
  pricePerKm: 0,
  basePrice: 0,
  image: '',
  features: [],
  isActive: true,
};

export default function CMSCabs() {
  const { systemEvents } = useTeamAuth();
  const [cabs, setCabs] = useState<Cab[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCab, setEditingCab] = useState<Cab | null>(null);
  const [formData, setFormData] = useState(defaultCab);
  const [featuresInput, setFeaturesInput] = useState('');

  useEffect(() => {
    fetchCabs();
  }, []);

  useEffect(() => {
    const latestEvent = systemEvents[0];
    if (latestEvent && latestEvent.booking && latestEvent.booking.entityType === 'cab') {
      fetchCabs();
    }
  }, [systemEvents]);

  const fetchCabs = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/cabs?all=true');
      const data = await response.json();
      
      if (!Array.isArray(data)) {
        setCabs([]);
        return;
      }

      const sanitized = data.map((cab: any) => ({
        ...cab,
        features: typeof cab.features === 'string' ? JSON.parse(cab.features) : (Array.isArray(cab.features) ? cab.features : [])
      }));
      setCabs(sanitized);
    } catch (error) {
      toast.error('Failed to load transport nodes');
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingCab(null);
    setFormData(defaultCab);
    setFeaturesInput('');
    setDialogOpen(true);
  };

  const openEditDialog = (cab: Cab) => {
    setEditingCab(cab);
    setFormData(cab);
    setFeaturesInput(cab.features?.join('\n') || '');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.type) {
      toast.error('Identity and Type are mandatory');
      return;
    }

    setSaving(true);
    const token = localStorage.getItem('teamToken');
    const method = editingCab ? 'PATCH' : 'POST';
    const url = editingCab 
      ? `http://localhost:5000/api/cabs/${editingCab.id}` 
      : 'http://localhost:5000/api/cabs';

    const dataToSave = {
      ...formData,
      features: featuresInput.split('\n').filter(Boolean),
    };

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(dataToSave)
      });

      if (response.ok) {
        toast.success(editingCab ? 'Node updated' : 'New node deployed');
        setDialogOpen(false);
        fetchCabs();
      } else {
        const errData = await response.json().catch(() => ({}));
        toast.error(errData.error || 'Deployment failed');
      }
    } catch (error) {
      toast.error('System connection error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Decommission this transport node?')) return;
    const token = localStorage.getItem('teamToken');
    
    try {
      const response = await fetch(`http://localhost:5000/api/cabs/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('Node decommissioned');
        fetchCabs();
      } else {
        toast.error('Decommissioning failed');
      }
    } catch (error) {
      toast.error('System connection error');
    }
  };

  const toggleActive = async (cab: Cab) => {
    const token = localStorage.getItem('teamToken');
    try {
      await fetch(`http://localhost:5000/api/cabs/${cab.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !cab.isActive })
      });
      fetchCabs();
    } catch (error) {
      toast.error('Failed to toggle status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-12 w-12 animate-spin text-kashmir-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-display font-bold text-white tracking-tight">Transport Fleet</h2>
          <p className="text-white/40 text-sm mt-1 uppercase tracking-widest font-black">Managing {cabs.length} Active Logistics Nodes</p>
        </div>
        <Button onClick={openCreateDialog} className="w-full md:w-auto bg-kashmir-gold text-black hover:bg-amber-500 font-black px-8 h-14 rounded-2xl shadow-xl shadow-kashmir-gold/10">
          <Plus className="h-5 w-5 mr-2" /> 
          <span className="text-[10px] uppercase tracking-[0.2em]">Deploy Vehicle</span>
        </Button>
      </div>

      {/* Desktop View */}
      <div className="hidden lg:block bg-white/[0.01] border border-white/5 rounded-[2.5rem] overflow-hidden backdrop-blur-3xl shadow-inner relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-kashmir-gold/[0.02] to-transparent pointer-events-none" />
        <Table>
          <TableHeader className="bg-white/[0.02] border-b border-white/5">
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="text-white/20 uppercase text-[9px] font-black tracking-[0.4em] py-8 pl-10">Vehicle Node</TableHead>
              <TableHead className="text-white/20 uppercase text-[9px] font-black tracking-[0.4em]">Logistics Specs</TableHead>
              <TableHead className="text-white/20 uppercase text-[9px] font-black tracking-[0.4em]">Pricing Model</TableHead>
              <TableHead className="text-white/20 uppercase text-[9px] font-black tracking-[0.4em]">Status</TableHead>
              <TableHead className="text-white/20 uppercase text-[9px] font-black tracking-[0.4em] text-right pr-10">Controls</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-white/5">
            {cabs.map((cab) => (
              <TableRow key={cab.id} className="hover:bg-white/[0.02] transition-all duration-500 border-none group/row">
                <TableCell className="py-8 pl-10">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-[1.25rem] bg-white/5 overflow-hidden border border-white/10 flex items-center justify-center shadow-2xl relative group/img">
                      {cab.image ? (
                        <img src={cab.image} alt={cab.name} className="w-full h-full object-cover" />
                      ) : (
                        <Car className="w-6 h-6 text-kashmir-gold/40" />
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-white font-bold tracking-tight text-base group-hover/row:text-kashmir-gold transition-colors">{cab.name}</span>
                      <span className="text-[10px] text-white/30 font-black uppercase tracking-widest">{cab.type}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-white/20" />
                    <span className="text-white/80 text-sm font-bold">{cab.capacity} Seats</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-kashmir-gold font-black text-base">₹{cab.pricePerKm}/km</span>
                    <span className="text-[10px] text-white/20 font-bold uppercase tracking-tighter">Base: ₹{cab.basePrice}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <button onClick={() => toggleActive(cab)} className="group/toggle">
                    <Badge className={cn(
                      "rounded-xl border-none px-4 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-300",
                      cab.isActive ? "bg-emerald-500/10 text-emerald-400 group-hover/toggle:bg-emerald-500/20" : "bg-red-500/10 text-red-400 group-hover/toggle:bg-red-500/20"
                    )}>
                      {cab.isActive ? 'Online' : 'Offline'}
                    </Badge>
                  </button>
                </TableCell>
                <TableCell className="text-right pr-10">
                  <div className="flex justify-end gap-3 opacity-20 group-hover/row:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(cab)} className="w-12 h-12 bg-white/5 border border-white/5 rounded-2xl text-white/40 hover:text-white hover:border-white/20 transition-all">
                      <Pencil className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(cab.id)} className="w-12 h-12 bg-white/5 border border-white/5 rounded-2xl text-white/20 hover:text-red-400 hover:border-red-400/20 transition-all">
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile View */}
      <div className="lg:hidden space-y-6">
        {cabs.map((cab) => (
          <Card key={cab.id} className="bg-white/[0.02] border-white/5 p-8 rounded-[2.5rem] space-y-8 relative overflow-hidden group">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-[1.5rem] bg-white/5 overflow-hidden border border-white/10 shrink-0 shadow-2xl relative">
                {cab.image ? (
                  <img src={cab.image} alt={cab.name} className="w-full h-full object-cover" />
                ) : (
                  <Car className="w-8 h-8 text-kashmir-gold/40 m-6" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-white tracking-tight truncate leading-tight">{cab.name}</h3>
                <div className="flex items-center gap-2 mt-2">
                   <Badge variant="outline" className="border-white/10 text-white/30 text-[8px] font-black uppercase tracking-widest px-2 py-0.5">{cab.type}</Badge>
                   <div className="w-1 h-1 rounded-full bg-white/20" />
                   <span className="text-[10px] text-white/40 font-bold uppercase truncate">{cab.capacity} Seats</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 py-6 border-t border-b border-white/5">
              <div className="space-y-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-white/20">Pricing Model</p>
                <p className="text-2xl font-black text-kashmir-gold tracking-tighter">₹{cab.pricePerKm}/<span className="text-xs">km</span></p>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-white/20">System Status</p>
                <Badge className={cn(
                  "border-none rounded-lg px-3 py-1 text-[9px] font-black uppercase tracking-widest w-fit",
                  cab.isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                )}>
                  {cab.isActive ? 'Online' : 'Offline'}
                </Badge>
              </div>
            </div>

            <div className="flex gap-4">
              <Button onClick={() => openEditDialog(cab)} className="flex-1 bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 h-14 rounded-2xl font-black transition-all">
                <Pencil className="w-4 h-4 mr-2" />
                <span className="text-[9px] uppercase tracking-widest">Edit Node</span>
              </Button>
              <Button onClick={() => handleDelete(cab.id)} className="w-14 bg-red-500/5 border border-red-500/10 text-red-400/60 hover:text-red-400 hover:bg-red-500/10 h-14 rounded-2xl transition-all">
                <Trash2 className="w-5 h-5" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl bg-[#0a0f12] border-white/10 text-white rounded-[2rem] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-kashmir-gold/5 via-transparent to-transparent pointer-events-none" />
          <DialogHeader className="p-8 pb-0">
            <DialogTitle className="text-2xl font-display font-black tracking-tight">{editingCab ? 'Reconfigure Logistics Node' : 'Deploy New Transport Node'}</DialogTitle>
          </DialogHeader>
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Vehicle Name</label>
                <Input
                  className="bg-white/5 border-white/10 rounded-xl h-12 focus:border-kashmir-gold/50 transition-all"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Luxury SUV"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Vehicle Type</label>
                <Input
                  className="bg-white/5 border-white/10 rounded-xl h-12 focus:border-kashmir-gold/50 transition-all"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  placeholder="e.g., Premium 4x4"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Capacity</label>
                <Input
                  type="number"
                  className="bg-white/5 border-white/10 rounded-xl h-12"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Rate (₹/KM)</label>
                <Input
                  type="number"
                  step="0.5"
                  className="bg-white/5 border-white/10 rounded-xl h-12"
                  value={formData.pricePerKm}
                  onChange={(e) => setFormData({ ...formData, pricePerKm: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Base (₹)</label>
                <Input
                  type="number"
                  className="bg-white/5 border-white/10 rounded-xl h-12"
                  value={formData.basePrice}
                  onChange={(e) => setFormData({ ...formData, basePrice: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Primary Asset Image</label>
              <MediaPicker
                value={formData.image || ''}
                onChange={(url) => setFormData({ ...formData, image: url })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Fleet Intelligence (Features)</label>
              <Textarea
                className="bg-white/5 border-white/10 rounded-xl min-h-[100px] resize-none"
                value={featuresInput}
                onChange={(e) => setFeaturesInput(e.target.value)}
                placeholder="Heated Seats&#10;Panoramic Roof&#10;Complimentary Wi-Fi"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white">System Visibility</span>
                <span className="text-[9px] text-white/30 uppercase tracking-widest font-black">Active in Public Fleet</span>
              </div>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>

            <Button onClick={handleSave} className="w-full h-14 bg-kashmir-gold text-black hover:bg-amber-500 font-black rounded-2xl transition-all shadow-xl shadow-kashmir-gold/10" disabled={saving}>
              {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : (editingCab ? 'Update Deployment' : 'Confirm Deployment')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
