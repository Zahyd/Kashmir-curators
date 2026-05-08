import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import MediaPicker from './MediaPicker';

interface Cab {
  id: string;
  name: string;
  vehicle_type: string;
  capacity: number;
  price_per_km: number;
  base_fare: number;
  description: string | null;
  image_url: string | null;
  features: string[];
  is_active: boolean;
}

const defaultCab: Omit<Cab, 'id'> = {
  name: '',
  vehicle_type: '',
  capacity: 4,
  price_per_km: 0,
  base_fare: 0,
  description: '',
  image_url: '',
  features: [],
  is_active: true,
};

export default function CMSCabs() {
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

  const fetchCabs = async () => {
    const { data, error } = await supabase
      .from('cms_cabs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load cabs');
    } else {
      setCabs(data || []);
    }
    setLoading(false);
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
    if (!formData.name || !formData.vehicle_type) {
      toast.error('Please fill required fields');
      return;
    }

    setSaving(true);
    const dataToSave = {
      ...formData,
      features: featuresInput.split('\n').filter(Boolean),
    };

    if (editingCab) {
      const { error } = await supabase.from('cms_cabs').update(dataToSave).eq('id', editingCab.id);
      if (error) {
        toast.error('Failed to update cab');
      } else {
        toast.success('Cab updated');
        setDialogOpen(false);
        fetchCabs();
      }
    } else {
      const { error } = await supabase.from('cms_cabs').insert(dataToSave);
      if (error) {
        toast.error('Failed to create cab');
      } else {
        toast.success('Cab created');
        setDialogOpen(false);
        fetchCabs();
      }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this cab?')) return;
    const { error } = await supabase.from('cms_cabs').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete cab');
    } else {
      toast.success('Cab deleted');
      fetchCabs();
    }
  };

  const toggleActive = async (cab: Cab) => {
    await supabase.from('cms_cabs').update({ is_active: !cab.is_active }).eq('id', cab.id);
    fetchCabs();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Cabs ({cabs.length})</h2>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" /> Add Cab
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Vehicle Type</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead>Price/KM</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cabs.map((cab) => (
              <TableRow key={cab.id}>
                <TableCell>
                  {cab.image_url ? (
                    <img src={cab.image_url} alt={cab.name} className="w-16 h-12 object-cover rounded" />
                  ) : (
                    <div className="w-16 h-12 bg-muted rounded flex items-center justify-center text-xs">No image</div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{cab.name}</TableCell>
                <TableCell>{cab.vehicle_type}</TableCell>
                <TableCell>{cab.capacity} seats</TableCell>
                <TableCell>₹{cab.price_per_km}/km</TableCell>
                <TableCell>
                  <Badge variant={cab.is_active ? 'default' : 'secondary'}>
                    {cab.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => toggleActive(cab)}>
                      {cab.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(cab)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(cab.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {cabs.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No cabs yet. Click "Add Cab" to create one.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCab ? 'Edit Cab' : 'Create Cab'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Swift Dzire"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Vehicle Type *</label>
                <Input
                  value={formData.vehicle_type}
                  onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                  placeholder="e.g., Sedan"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Capacity</label>
                <Input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Price/KM (₹)</label>
                <Input
                  type="number"
                  step="0.5"
                  value={formData.price_per_km}
                  onChange={(e) => setFormData({ ...formData, price_per_km: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Base Fare (₹)</label>
                <Input
                  type="number"
                  value={formData.base_fare}
                  onChange={(e) => setFormData({ ...formData, base_fare: Number(e.target.value) })}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Description</label>
              <Textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Image</label>
              <MediaPicker
                value={formData.image_url || ''}
                onChange={(url) => setFormData({ ...formData, image_url: url })}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Features (one per line)</label>
              <Textarea
                value={featuresInput}
                onChange={(e) => setFeaturesInput(e.target.value)}
                placeholder="AC&#10;Music System&#10;GPS Navigation"
                rows={3}
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <label className="text-sm">Active</label>
            </div>

            <Button onClick={handleSave} className="w-full" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingCab ? 'Update Cab' : 'Create Cab'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
