import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Eye, EyeOff, Star, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import MediaPicker from './MediaPicker';

interface Testimonial {
  id: string;
  name: string;
  location: string | null;
  avatar_url: string | null;
  content: string;
  rating: number;
  package_name: string | null;
  is_featured: boolean;
  is_active: boolean;
}

const defaultTestimonial: Omit<Testimonial, 'id'> = {
  name: '',
  location: '',
  avatar_url: '',
  content: '',
  rating: 5,
  package_name: '',
  is_featured: false,
  is_active: true,
};

export default function CMSTestimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Testimonial | null>(null);
  const [formData, setFormData] = useState(defaultTestimonial);

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    const { data, error } = await supabase
      .from('cms_testimonials')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load testimonials');
    } else {
      setTestimonials(data || []);
    }
    setLoading(false);
  };

  const openCreateDialog = () => {
    setEditingItem(null);
    setFormData(defaultTestimonial);
    setDialogOpen(true);
  };

  const openEditDialog = (item: Testimonial) => {
    setEditingItem(item);
    setFormData(item);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.content) {
      toast.error('Please fill required fields');
      return;
    }

    setSaving(true);
    if (editingItem) {
      const { error } = await supabase.from('cms_testimonials').update(formData).eq('id', editingItem.id);
      if (error) {
        toast.error('Failed to update testimonial');
      } else {
        toast.success('Testimonial updated');
        setDialogOpen(false);
        fetchTestimonials();
      }
    } else {
      const { error } = await supabase.from('cms_testimonials').insert(formData);
      if (error) {
        toast.error('Failed to create testimonial');
      } else {
        toast.success('Testimonial created');
        setDialogOpen(false);
        fetchTestimonials();
      }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this testimonial?')) return;
    const { error } = await supabase.from('cms_testimonials').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete');
    } else {
      toast.success('Testimonial deleted');
      fetchTestimonials();
    }
  };

  const toggleActive = async (item: Testimonial) => {
    await supabase.from('cms_testimonials').update({ is_active: !item.is_active }).eq('id', item.id);
    fetchTestimonials();
  };

  const toggleFeatured = async (item: Testimonial) => {
    await supabase.from('cms_testimonials').update({ is_featured: !item.is_featured }).eq('id', item.id);
    fetchTestimonials();
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
        <h2 className="text-xl font-semibold">Testimonials ({testimonials.length})</h2>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" /> Add Testimonial
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Avatar</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {testimonials.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  {item.avatar_url ? (
                    <img src={item.avatar_url} alt={item.name} className="w-10 h-10 object-cover rounded-full" />
                  ) : (
                    <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center text-xs">
                      {item.name.charAt(0)}
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>{item.location || '-'}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-0.5">
                    {[...Array(item.rating)].map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-kashmir-gold text-kashmir-gold" />
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <Badge variant={item.is_active ? 'default' : 'secondary'}>
                      {item.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    {item.is_featured && <Badge variant="outline">Featured</Badge>}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => toggleActive(item)}>
                      {item.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {testimonials.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No testimonials yet. Click "Add Testimonial" to create one.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Testimonial' : 'Create Testimonial'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Location</label>
                <Input
                  value={formData.location || ''}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Mumbai, India"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Content *</label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={4}
                placeholder="Customer review..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Rating</label>
                <Select
                  value={formData.rating.toString()}
                  onValueChange={(v) => setFormData({ ...formData, rating: Number(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <SelectItem key={n} value={n.toString()}>
                        {n} Star{n > 1 ? 's' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Package Name</label>
                <Input
                  value={formData.package_name || ''}
                  onChange={(e) => setFormData({ ...formData, package_name: e.target.value })}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Avatar</label>
              <MediaPicker
                value={formData.avatar_url || ''}
                onChange={(url) => setFormData({ ...formData, avatar_url: url })}
              />
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
              {editingItem ? 'Update Testimonial' : 'Create Testimonial'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
