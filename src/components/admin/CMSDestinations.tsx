import { useState, useEffect } from 'react';
import { 
  MapPin, Plus, Edit, Trash2, Eye, EyeOff, Save, 
  Sparkles, Image as ImageIcon, CheckCircle2, ArrowRight 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/lib/api';
import MediaPicker from './MediaPicker';
import { useLandingPageContent, DestinationItem, DEFAULT_DESTINATIONS } from '@/hooks/useLandingPageContent';

export default function CMSDestinations() {
  const { destinations: cmsDestinations, refetch } = useLandingPageContent();
  const [items, setItems] = useState<DestinationItem[]>(DEFAULT_DESTINATIONS);
  const [sectionTitle, setSectionTitle] = useState('SIGNATURE LOCATIONS');
  const [sectionSubtitle, setSectionSubtitle] = useState('Beyond the maps, discover the hidden soul of the valley through our handpicked premier destinations.');
  const [badgeText, setBadgeText] = useState('Curated Geography');

  const [editingItem, setEditingItem] = useState<DestinationItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (cmsDestinations?.items && cmsDestinations.items.length > 0) {
      setItems(cmsDestinations.items);
    }
    if (cmsDestinations?.title) setSectionTitle(cmsDestinations.title);
    if (cmsDestinations?.subtitle) setSectionSubtitle(cmsDestinations.subtitle);
    if (cmsDestinations?.badgeText) setBadgeText(cmsDestinations.badgeText);
  }, [cmsDestinations]);

  const handleSaveToBackend = async (updatedItems: DestinationItem[], updatedTitle?: string, updatedSubtitle?: string, updatedBadge?: string) => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('teamToken') || localStorage.getItem('token');
      const payload = {
        title: updatedTitle ?? sectionTitle,
        subtitle: updatedSubtitle ?? sectionSubtitle,
        content: {
          badge_text: updatedBadge ?? badgeText,
          items: updatedItems
        }
      };

      const res = await fetch(`${API_BASE_URL}/site-content/destinations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success('Destinations synchronized live with website!');
        refetch();
      } else {
        toast.error('Failed to save destinations to server');
      }
    } catch (err) {
      toast.error('Network error saving destinations');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingItem({
      id: `dest-${Date.now()}`,
      name: '',
      tagline: '',
      desc: '',
      image: 'https://images.unsplash.com/photo-1597074866923-dc0589150358?w=800',
      colSpan: 'col-span-1 md:col-span-1',
      rowSpan: 'row-span-1',
      isActive: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: DestinationItem) => {
    setEditingItem({ ...item });
    setIsModalOpen(true);
  };

  const handleSaveModal = () => {
    if (!editingItem || !editingItem.name.trim()) {
      toast.error('Destination name is required');
      return;
    }

    const exists = items.some(i => i.id === editingItem.id);
    let updated: DestinationItem[];
    if (exists) {
      updated = items.map(i => i.id === editingItem.id ? editingItem : i);
    } else {
      updated = [...items, editingItem];
    }

    setItems(updated);
    setIsModalOpen(false);
    setEditingItem(null);
    handleSaveToBackend(updated);
  };

  const handleDelete = (id: string) => {
    if (items.length <= 1) {
      toast.error('At least one destination must remain in the showcase');
      return;
    }
    const updated = items.filter(i => i.id !== id);
    setItems(updated);
    handleSaveToBackend(updated);
  };

  const handleToggleActive = (id: string) => {
    const updated = items.map(i => i.id === id ? { ...i, isActive: !i.isActive } : i);
    setItems(updated);
    handleSaveToBackend(updated);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Top Header Card */}
      <div className="p-8 rounded-3xl bg-gradient-to-br from-amber-500/10 via-white/[0.02] to-transparent border border-amber-400/20 shadow-2xl backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-[10px] font-black uppercase tracking-wider mb-2">
            <MapPin className="w-3.5 h-3.5" />
            <span>Signature Locations Module</span>
          </div>
          <h2 className="text-3xl font-display font-black text-white">Destinations Showcase CMS</h2>
          <p className="text-white/60 text-xs sm:text-sm mt-1 max-w-xl">
            Manage the iconic valley destinations displayed in the interactive masonry grid on the public landing page.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleOpenAdd}
            className="h-11 px-5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-400/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Destination</span>
          </Button>
          <Button
            onClick={() => handleSaveToBackend(items)}
            disabled={isSaving}
            className="h-11 px-5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider border border-white/15 flex items-center gap-2"
          >
            <Save className="w-4 h-4 text-emerald-400" />
            <span>{isSaving ? 'Saving...' : 'Sync Live'}</span>
          </Button>
        </div>
      </div>

      {/* Section Headings Form */}
      <Card className="bg-[#0a0f14]/85 border border-white/10 p-6 rounded-3xl backdrop-blur-xl">
        <CardHeader className="p-0 pb-4">
          <CardTitle className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Section Headings & Copy</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-white/50 mb-1.5 block">Badge Label</label>
            <Input 
              value={badgeText} 
              onChange={e => setBadgeText(e.target.value)} 
              className="bg-white/5 border-white/10 text-white text-xs rounded-xl"
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-white/50 mb-1.5 block">Main Heading</label>
            <Input 
              value={sectionTitle} 
              onChange={e => setSectionTitle(e.target.value)} 
              className="bg-white/5 border-white/10 text-white text-xs rounded-xl"
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-white/50 mb-1.5 block">Subheading / Description</label>
            <Input 
              value={sectionSubtitle} 
              onChange={e => setSectionSubtitle(e.target.value)} 
              className="bg-white/5 border-white/10 text-white text-xs rounded-xl"
            />
          </div>
        </CardContent>
      </Card>

      {/* Destinations Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {items.map((item, idx) => (
          <Card 
            key={item.id || idx} 
            className={`bg-[#0a0f14]/85 border transition-all duration-300 rounded-3xl overflow-hidden flex flex-col justify-between ${
              item.isActive !== false ? 'border-white/10 hover:border-amber-400/40' : 'border-white/5 opacity-60'
            }`}
          >
            <div className="relative h-44 w-full overflow-hidden bg-black/40">
              <img 
                src={item.image} 
                alt={item.name} 
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
              <div className="absolute top-3 right-3 flex items-center gap-1.5">
                <Badge className={item.isActive !== false ? 'bg-emerald-500/80 text-white text-[9px]' : 'bg-red-500/80 text-white text-[9px]'}>
                  {item.isActive !== false ? 'Active' : 'Hidden'}
                </Badge>
              </div>
              <div className="absolute bottom-3 left-4 right-4">
                <span className="text-[9px] font-mono uppercase tracking-widest text-amber-400 font-bold block">{item.tagline}</span>
                <h3 className="text-xl font-bold text-white font-display">{item.name}</h3>
              </div>
            </div>

            <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <p className="text-xs text-white/60 line-clamp-2 leading-relaxed">
                {item.desc}
              </p>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-[10px] text-white/40">
                  <span>Layout:</span>
                  <span className="font-mono text-amber-300">{item.colSpan?.includes('col-span-2') ? 'Wide' : 'Standard'}</span>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleToggleActive(item.id)}
                    className="w-8 h-8 rounded-lg text-white/60 hover:text-white hover:bg-white/10"
                    title={item.isActive !== false ? 'Hide from public site' : 'Show on public site'}
                  >
                    {item.isActive !== false ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-red-400" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenEdit(item)}
                    className="w-8 h-8 rounded-lg text-amber-400 hover:bg-amber-400/10"
                    title="Edit Destination"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(item.id)}
                    className="w-8 h-8 rounded-lg text-red-400 hover:bg-red-400/10"
                    title="Delete Destination"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add / Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-xl bg-[#0c1218] border border-amber-400/30 text-white rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-display font-bold text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-amber-400" />
              <span>{editingItem?.id && items.some(i => i.id === editingItem.id) ? 'Edit Destination' : 'Add New Destination'}</span>
            </DialogTitle>
          </DialogHeader>

          {editingItem && (
            <div className="space-y-4 py-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-white/50 mb-1.5 block">Destination Name</label>
                  <Input
                    value={editingItem.name}
                    onChange={e => setEditingItem({ ...editingItem, name: e.target.value })}
                    placeholder="e.g. Yusmarg"
                    className="bg-white/5 border-white/10 text-white text-xs rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-white/50 mb-1.5 block">Tagline</label>
                  <Input
                    value={editingItem.tagline}
                    onChange={e => setEditingItem({ ...editingItem, tagline: e.target.value })}
                    placeholder="e.g. The Meadow of Jesus"
                    className="bg-white/5 border-white/10 text-white text-xs rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-white/50 mb-1.5 block">Short Description</label>
                <Textarea
                  value={editingItem.desc}
                  onChange={e => setEditingItem({ ...editingItem, desc: e.target.value })}
                  placeholder="Describe the aesthetic and appeal..."
                  rows={3}
                  className="bg-white/5 border-white/10 text-white text-xs rounded-xl"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-white/50 mb-1.5 block">Cover Image URL</label>
                <div className="flex gap-2">
                  <Input
                    value={editingItem.image}
                    onChange={e => setEditingItem({ ...editingItem, image: e.target.value })}
                    className="bg-white/5 border-white/10 text-white text-xs rounded-xl flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsMediaPickerOpen(true)}
                    className="border-white/15 hover:bg-white/10 text-xs rounded-xl text-amber-300"
                  >
                    <ImageIcon className="w-4 h-4 mr-1.5" />
                    Browse
                  </Button>
                </div>
                {editingItem.image && (
                  <div className="mt-2 h-28 w-full rounded-xl overflow-hidden border border-white/10">
                    <img src={editingItem.image} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-white/50 mb-1.5 block">Grid Span Format</label>
                  <select
                    value={editingItem.colSpan?.includes('col-span-2') ? 'wide' : 'standard'}
                    onChange={e => {
                      if (e.target.value === 'wide') {
                        setEditingItem({
                          ...editingItem,
                          colSpan: 'col-span-1 md:col-span-2',
                          rowSpan: 'row-span-1 md:row-span-2'
                        });
                      } else {
                        setEditingItem({
                          ...editingItem,
                          colSpan: 'col-span-1 md:col-span-1',
                          rowSpan: 'row-span-1'
                        });
                      }
                    }}
                    className="w-full h-10 bg-white/5 border border-white/10 rounded-xl px-3 text-xs text-white"
                  >
                    <option value="standard">Standard (1x1 Card)</option>
                    <option value="wide">Hero Featured (2x2 Masonry)</option>
                  </select>
                </div>

                <div className="flex flex-col justify-end">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-xs text-white">Public Visibility</span>
                    <Switch
                      checked={editingItem.isActive !== false}
                      onCheckedChange={checked => setEditingItem({ ...editingItem, isActive: checked })}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="mt-4 gap-2">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="text-xs text-white/60">
              Cancel
            </Button>
            <Button onClick={handleSaveModal} className="bg-amber-400 hover:bg-amber-300 text-black font-black text-xs uppercase px-5 rounded-xl">
              Save Destination
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cloudinary MediaPicker Integration */}
      <MediaPicker
        open={isMediaPickerOpen}
        onOpenChange={setIsMediaPickerOpen}
        onSelect={(url) => {
          if (editingItem) {
            setEditingItem({ ...editingItem, image: url });
          }
          setIsMediaPickerOpen(false);
        }}
      />
    </div>
  );
}
