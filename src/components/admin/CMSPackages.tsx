import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Eye, EyeOff, Star, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import MediaPicker from './MediaPicker';

interface Package {
  id: string;
  name: string;
  destination: string;
  duration: string;
  price: number;
  original_price: number;
  description: string | null;
  image_url: string | null;
  highlights: string[];
  inclusions: string[];
  exclusions: string[];
  rating: number;
  review_count: number;
  is_featured: boolean;
  is_active: boolean;
}

const defaultPackage: Omit<Package, 'id'> = {
  name: '',
  destination: '',
  duration: '',
  price: 0,
  original_price: 0,
  description: '',
  image_url: '',
  highlights: [],
  inclusions: [],
  exclusions: [],
  rating: 4.5,
  review_count: 0,
  is_featured: false,
  is_active: true,
};

export default function CMSPackages() {
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

  const fetchPackages = async () => {
    const { data, error } = await supabase
      .from('cms_packages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load packages');
    } else {
      setPackages(data || []);
    }
    setLoading(false);
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
    const dataToSave = {
      ...formData,
      highlights: highlightsInput.split('\n').filter(Boolean),
      inclusions: inclusionsInput.split('\n').filter(Boolean),
      exclusions: exclusionsInput.split('\n').filter(Boolean),
    };

    if (editingPackage) {
      const { error } = await supabase
        .from('cms_packages')
        .update(dataToSave)
        .eq('id', editingPackage.id);

      if (error) {
        toast.error('Failed to update package');
      } else {
        toast.success('Package updated');
        setDialogOpen(false);
        fetchPackages();
      }
    } else {
      const { error } = await supabase.from('cms_packages').insert(dataToSave);

      if (error) {
        toast.error('Failed to create package');
      } else {
        toast.success('Package created');
        setDialogOpen(false);
        fetchPackages();
      }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this package?')) return;

    const { error } = await supabase.from('cms_packages').delete().eq('id', id);

    if (error) {
      toast.error('Failed to delete package');
    } else {
      toast.success('Package deleted');
      fetchPackages();
    }
  };

  const toggleActive = async (pkg: Package) => {
    const { error } = await supabase
      .from('cms_packages')
      .update({ is_active: !pkg.is_active })
      .eq('id', pkg.id);

    if (!error) fetchPackages();
  };

  const toggleFeatured = async (pkg: Package) => {
    const { error } = await supabase
      .from('cms_packages')
      .update({ is_featured: !pkg.is_featured })
      .eq('id', pkg.id);

    if (!error) fetchPackages();
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
        <h2 className="text-xl font-semibold">Packages ({packages.length})</h2>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" /> Add Package
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Destination</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {packages.map((pkg) => (
              <TableRow key={pkg.id}>
                <TableCell>
                  {pkg.image_url ? (
                    <img src={pkg.image_url} alt={pkg.name} className="w-16 h-12 object-cover rounded" />
                  ) : (
                    <div className="w-16 h-12 bg-muted rounded flex items-center justify-center text-xs">No image</div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{pkg.name}</TableCell>
                <TableCell>{pkg.destination}</TableCell>
                <TableCell>₹{pkg.price.toLocaleString()}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-kashmir-gold text-kashmir-gold" />
                    {pkg.rating}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <Badge variant={pkg.is_active ? 'default' : 'secondary'}>
                      {pkg.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    {pkg.is_featured && <Badge variant="outline">Featured</Badge>}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => toggleActive(pkg)}>
                      {pkg.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(pkg)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(pkg.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {packages.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No packages yet. Click "Add Package" to create one.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
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
                  value={formData.original_price}
                  onChange={(e) => setFormData({ ...formData, original_price: Number(e.target.value) })}
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
                value={formData.image_url || ''}
                onChange={(url) => setFormData({ ...formData, image_url: url })}
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
                  value={formData.review_count}
                  onChange={(e) => setFormData({ ...formData, review_count: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <label className="text-sm">Active</label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
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
