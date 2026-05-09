import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Eye, EyeOff, Star, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { useTeamAuth } from '@/contexts/TeamAuthContext';
import MediaPicker from './MediaPicker';

interface Package {
  id: string;
  name: string;
  destination: string;
  duration: string;
  price: number;
  originalPrice: number;
  description: string | null;
  imageUrl: string | null;
  highlights: string[];
  inclusions: string[];
  exclusions: string[];
  rating: number;
  reviewCount: number;
  isFeatured: boolean;
  isActive: boolean;
}

const defaultPackage: Omit<Package, 'id'> = {
  name: '',
  destination: '',
  duration: '',
  price: 0,
  originalPrice: 0,
  description: '',
  imageUrl: '',
  highlights: [],
  inclusions: [],
  exclusions: [],
  rating: 4.5,
  reviewCount: 0,
  isFeatured: false,
  isActive: true,
};

export default function CMSPackages() {
  const { systemEvents } = useTeamAuth();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [formData, setFormData] = useState(defaultPackage);
  const [highlightsInput, setHighlightsInput] = useState('');
  const [inclusionsInput, setInclusionsInput] = useState('');
  const [exclusionsInput, setExclusionsInput] = useState('');

  useEffect(() => {
    fetchPackages();
  }, []);

  // Real-time refresh
  useEffect(() => {
    const latestEvent = systemEvents[0];
    if (latestEvent && latestEvent.booking && latestEvent.booking.entityType === 'package') {
      fetchPackages();
    }
  }, [systemEvents]);

  const fetchPackages = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/packages?all=true');
      const data = await response.json();
      if (Array.isArray(data)) {
        setPackages(data);
      } else {
        console.error('Expected array of packages, but received:', data);
        setPackages([]);
      }
    } catch (error) {
      toast.error('Failed to load packages');
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingPackage(null);
    setFormData(defaultPackage);
    setHighlightsInput('');
    setInclusionsInput('');
    setExclusionsInput('');
    setDialogOpen(true);
  };

  const openEditDialog = (pkg: Package) => {
    setEditingPackage(pkg);
    setFormData(pkg);
    setHighlightsInput(pkg.highlights?.join('\n') || '');
    setInclusionsInput(pkg.inclusions?.join('\n') || '');
    setExclusionsInput(pkg.exclusions?.join('\n') || '');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.destination || !formData.duration) {
      toast.error('Please fill required fields');
      return;
    }

    setSaving(true);
    const token = localStorage.getItem('teamToken');
    const method = editingPackage ? 'PATCH' : 'POST';
    const url = editingPackage 
      ? `http://localhost:5000/api/packages/${editingPackage.id}` 
      : 'http://localhost:5000/api/packages';

    const dataToSave = {
      ...formData,
      highlights: highlightsInput.split('\n').filter(Boolean),
      inclusions: inclusionsInput.split('\n').filter(Boolean),
      exclusions: exclusionsInput.split('\n').filter(Boolean),
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
        toast.success(editingPackage ? 'Package updated' : 'Package created');
        setDialogOpen(false);
        fetchPackages();
      } else {
        toast.error('Failed to save package');
      }
    } catch (error) {
      toast.error('Error saving package');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this package?')) return;
    const token = localStorage.getItem('teamToken');
    
    try {
      const response = await fetch(`http://localhost:5000/api/packages/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('Package deleted');
        fetchPackages();
      } else {
        toast.error('Failed to delete package');
      }
    } catch (error) {
      toast.error('Error deleting package');
    }
  };

  const toggleActive = async (pkg: Package) => {
    const token = localStorage.getItem('teamToken');
    await fetch(`http://localhost:5000/api/packages/${pkg.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ isActive: !pkg.isActive })
    });
    fetchPackages();
  };

  const toggleFeatured = async (pkg: Package) => {
    const token = localStorage.getItem('teamToken');
    await fetch(`http://localhost:5000/api/packages/${pkg.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ isFeatured: !pkg.isFeatured })
    });
    fetchPackages();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-display font-bold text-white tracking-tight">Experience Catalog</h2>
          <p className="text-white/40 text-sm mt-1 uppercase tracking-widest font-black">Managing {packages.length} Active Nodes</p>
        </div>
        <Button onClick={openCreateDialog} className="w-full md:w-auto bg-kashmir-gold text-black hover:bg-amber-500 font-black px-8 h-14 rounded-2xl shadow-xl shadow-kashmir-gold/10">
          <Plus className="h-5 w-5 mr-2" /> 
          <span className="text-[10px] uppercase tracking-[0.2em]">Deploy Package</span>
        </Button>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white/[0.01] border border-white/5 rounded-[2.5rem] overflow-hidden backdrop-blur-3xl shadow-inner relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-kashmir-gold/[0.02] to-transparent pointer-events-none" />
        <Table>
          <TableHeader className="bg-white/[0.02] border-b border-white/5">
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="text-white/20 uppercase text-[9px] font-black tracking-[0.4em] py-8 pl-10">Intelligence Node</TableHead>
              <TableHead className="text-white/20 uppercase text-[9px] font-black tracking-[0.4em]">Operational Parameters</TableHead>
              <TableHead className="text-white/20 uppercase text-[9px] font-black tracking-[0.4em]">Asset Value</TableHead>
              <TableHead className="text-white/20 uppercase text-[9px] font-black tracking-[0.4em]">Status</TableHead>
              <TableHead className="text-white/20 uppercase text-[9px] font-black tracking-[0.4em] text-right pr-10">Controls</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-white/5">
            {packages.map((pkg) => (
              <TableRow key={pkg.id} className="hover:bg-white/[0.02] transition-all duration-500 border-none group/row">
                <TableCell className="py-8 pl-10">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-[1.25rem] bg-white/5 overflow-hidden border border-white/10 flex items-center justify-center shadow-2xl relative group/img">
                      <div className="absolute inset-0 bg-kashmir-gold/20 opacity-0 group-hover/img:opacity-100 transition-opacity" />
                      {pkg.imageUrl ? (
                        <img src={pkg.imageUrl} alt={pkg.name} className="w-full h-full object-cover" />
                      ) : (
                        <Star className="w-6 h-6 text-kashmir-gold/40" />
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-white font-bold tracking-tight text-base group-hover/row:text-kashmir-gold transition-colors">{pkg.name}</span>
                      {pkg.isFeatured && (
                        <Badge className="w-fit bg-kashmir-gold text-black border-none text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md">High Priority</Badge>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span className="text-white/80 text-sm font-bold">{pkg.destination}</span>
                    <span className="text-[10px] text-white/30 font-black uppercase tracking-widest">{pkg.duration}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-kashmir-gold font-black text-base">₹{pkg.price.toLocaleString()}</span>
                    <span className="text-[10px] text-white/20 line-through font-bold">₹{pkg.originalPrice.toLocaleString()}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <button onClick={() => toggleActive(pkg)} className="group/toggle">
                    <Badge className={cn(
                      "rounded-xl border-none px-4 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-300",
                      pkg.isActive ? "bg-emerald-500/10 text-emerald-400 group-hover/toggle:bg-emerald-500/20" : "bg-red-500/10 text-red-400 group-hover/toggle:bg-red-500/20"
                    )}>
                      {pkg.isActive ? 'Active' : 'Offline'}
                    </Badge>
                  </button>
                </TableCell>
                <TableCell className="text-right pr-10">
                  <div className="flex justify-end gap-3 opacity-20 group-hover/row:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(pkg)} className="w-12 h-12 bg-white/5 border border-white/5 rounded-2xl text-white/40 hover:text-white hover:border-white/20 transition-all">
                      <Pencil className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(pkg.id)} className="w-12 h-12 bg-white/5 border border-white/5 rounded-2xl text-white/20 hover:text-red-400 hover:border-red-400/20 transition-all">
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-6">
        {packages.map((pkg) => (
          <Card key={pkg.id} className="bg-white/[0.02] border-white/5 p-8 rounded-[2.5rem] space-y-8 relative overflow-hidden group">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-[1.5rem] bg-white/5 overflow-hidden border border-white/10 shrink-0 shadow-2xl relative">
                {pkg.imageUrl ? (
                  <img src={pkg.imageUrl} alt={pkg.name} className="w-full h-full object-cover" />
                ) : (
                  <Star className="w-8 h-8 text-kashmir-gold/40 m-6" />
                )}
                {pkg.isFeatured && (
                  <div className="absolute top-0 right-0 p-1 bg-kashmir-gold rounded-bl-xl">
                    <Star className="w-3 h-3 text-black fill-black" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-white tracking-tight truncate leading-tight">{pkg.name}</h3>
                <div className="flex items-center gap-2 mt-2">
                   <Badge variant="outline" className="border-white/10 text-white/30 text-[8px] font-black uppercase tracking-widest px-2 py-0.5">{pkg.duration}</Badge>
                   <div className="w-1 h-1 rounded-full bg-white/20" />
                   <span className="text-[10px] text-white/40 font-bold uppercase truncate">{pkg.destination}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 py-6 border-t border-b border-white/5">
              <div className="space-y-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-white/20">Operational Value</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-black text-kashmir-gold tracking-tighter">₹{pkg.price.toLocaleString()}</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-white/20">System Status</p>
                <Badge className={cn(
                  "border-none rounded-lg px-3 py-1 text-[9px] font-black uppercase tracking-widest w-fit",
                  pkg.isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                )}>
                  {pkg.isActive ? 'Online' : 'Offline'}
                </Badge>
              </div>
            </div>

            <div className="flex gap-4">
              <Button onClick={() => openEditDialog(pkg)} className="flex-1 bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 h-14 rounded-2xl font-black transition-all">
                <Pencil className="w-4 h-4 mr-2" />
                <span className="text-[9px] uppercase tracking-widest">Edit Node</span>
              </Button>
              <Button onClick={() => handleDelete(pkg.id)} className="w-14 bg-red-500/5 border border-red-500/10 text-red-400/60 hover:text-red-400 hover:bg-red-500/10 h-14 rounded-2xl transition-all">
                <Trash2 className="w-5 h-5" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPackage ? 'Edit Package' : 'Create Package'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Package name"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Destination *</label>
                <Input
                  value={formData.destination}
                  onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                  placeholder="e.g., Srinagar"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Duration *</label>
                <Input
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  placeholder="e.g., 4 Days / 3 Nights"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Price (₹)</label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Original Price (₹)</label>
                <Input
                  type="number"
                  value={formData.originalPrice}
                  onChange={(e) => setFormData({ ...formData, originalPrice: Number(e.target.value) })}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Description</label>
              <Textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Package description"
                rows={3}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Image</label>
              <MediaPicker
                value={formData.imageUrl || ''}
                onChange={(url) => setFormData({ ...formData, imageUrl: url })}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Highlights (one per line)</label>
              <Textarea
                value={highlightsInput}
                onChange={(e) => setHighlightsInput(e.target.value)}
                placeholder="Dal Lake Shikara Ride&#10;Gulmarg Cable Car&#10;Pahalgam Valley Tour"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Inclusions (one per line)</label>
                <Textarea
                  value={inclusionsInput}
                  onChange={(e) => setInclusionsInput(e.target.value)}
                  placeholder="Accommodation&#10;Meals&#10;Transport"
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Exclusions (one per line)</label>
                <Textarea
                  value={exclusionsInput}
                  onChange={(e) => setExclusionsInput(e.target.value)}
                  placeholder="Flights&#10;Personal expenses&#10;Travel insurance"
                  rows={3}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Rating</label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={formData.rating}
                  onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Review Count</label>
                <Input
                  type="number"
                  value={formData.reviewCount}
                  onChange={(e) => setFormData({ ...formData, reviewCount: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <label className="text-sm">Active</label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.isFeatured}
                  onCheckedChange={(checked) => setFormData({ ...formData, isFeatured: checked })}
                />
                <label className="text-sm">Featured</label>
              </div>
            </div>

            <Button onClick={handleSave} className="w-full" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingPackage ? 'Update Package' : 'Create Package'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
