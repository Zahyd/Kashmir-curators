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
  features: string[]; // This will be parsed from JSON string if needed, but let's assume API returns array
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

  // Real-time refresh
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
        console.error('Expected array of cabs, but received:', data);
        setCabs([]);
        return;
      }

      // Handle the case where features might be a string from backend
      const sanitized = data.map((cab: any) => ({
        ...cab,
        features: typeof cab.features === 'string' ? JSON.parse(cab.features) : cab.features
      }));
      setCabs(sanitized);
    } catch (error) {
      toast.error('Failed to load cabs');
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
      toast.error('Please fill required fields');
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
        toast.success(editingCab ? 'Cab updated' : 'Cab created');
        setDialogOpen(false);
        fetchCabs();
      } else {
        toast.error('Failed to save cab');
      }
    } catch (error) {
      toast.error('Error saving cab');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this cab?')) return;
    const token = localStorage.getItem('teamToken');
    
    try {
      const response = await fetch(`http://localhost:5000/api/cabs/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('Cab deleted');
        fetchCabs();
      } else {
        toast.error('Failed to delete');
      }
    } catch (error) {
      toast.error('Error deleting cab');
    }
  };

  const toggleActive = async (cab: Cab) => {
    const token = localStorage.getItem('teamToken');
    await fetch(`http://localhost:5000/api/cabs/${cab.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ isActive: !cab.isActive })
    });
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
              <TableHead>Type</TableHead>
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
                  {cab.image ? (
                    <img src={cab.image} alt={cab.name} className="w-16 h-12 object-cover rounded" />
                  ) : (
                    <div className="w-16 h-12 bg-muted rounded flex items-center justify-center text-xs">No image</div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{cab.name}</TableCell>
                <TableCell>{cab.type}</TableCell>
                <TableCell>{cab.capacity} seats</TableCell>
                <TableCell>₹{cab.pricePerKm}/km</TableCell>
                <TableCell>
                  <Badge variant={cab.isActive ? 'default' : 'secondary'}>
                    {cab.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => toggleActive(cab)}>
                      {cab.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                <label className="text-sm font-medium mb-1 block">Type *</label>
                <Input
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
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
                  value={formData.pricePerKm}
                  onChange={(e) => setFormData({ ...formData, pricePerKm: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Base Price (₹)</label>
                <Input
                  type="number"
                  value={formData.basePrice}
                  onChange={(e) => setFormData({ ...formData, basePrice: Number(e.target.value) })}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Image</label>
              <MediaPicker
                value={formData.image || ''}
                onChange={(url) => setFormData({ ...formData, image: url })}
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
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
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
