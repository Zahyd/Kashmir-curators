import { useState, useEffect } from 'react';
import { 
  Sparkles, Plus, Edit, Trash2, Eye, EyeOff, Save, 
  Compass, Image as ImageIcon, MapPin, Clock, Tag 
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
import { useLandingPageContent, ActivityItem } from '@/hooks/useLandingPageContent';

const DEFAULT_ACTIVITIES: ActivityItem[] = [
  {
    id: 'act-1',
    title: 'Dal Lake Private Sunset Shikara',
    location: 'Srinagar',
    duration: '2 Hours',
    price: 1500,
    category: 'Heritage & Leisure',
    badge: 'Iconic',
    image: 'https://images.unsplash.com/photo-1566837493203-d2d46e01a5d6?w=800',
    description: 'Glide through floating lotus gardens, Char Chinar, and golden sunset reflections with fresh saffron kahwa.',
    isActive: true
  },
  {
    id: 'act-2',
    title: 'Apharwat Peak Gondola Snow Ride (Phase 2)',
    location: 'Gulmarg',
    duration: 'Half Day',
    price: 2400,
    category: 'Alpine Adventure',
    badge: 'High Altitude',
    image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800',
    description: 'Ascend to 14,000 ft on Asia highest cable car. Walk on eternal powder snow with panoramic views of Nanga Parbat.',
    isActive: true
  },
  {
    id: 'act-3',
    title: 'Lidder River White Water Rafting & Trout Fishing',
    location: 'Pahalgam',
    duration: '3 Hours',
    price: 2800,
    category: 'Thrill & Rivers',
    badge: 'Summer Thrill',
    image: 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?w=800',
    description: 'Navigate Grade II-III rapids along pine-flanked waters, followed by private riverside angling.',
    isActive: true
  },
  {
    id: 'act-4',
    title: 'Royal 36-Course Wazwan Gastronomy Tasting',
    location: 'Srinagar Old City',
    duration: 'Evening Feast',
    price: 3200,
    category: 'Culinary Masterclass',
    badge: 'Authentic',
    image: 'https://images.unsplash.com/photo-1617653202545-931490e875e6?w=800',
    description: 'Feast on Rista, Rogan Josh, Tabak Maaz, and Gushtaba prepared by 4th-generation master Wazas over copper traamis.',
    isActive: true
  }
];

export default function CMSActivities() {
  const { activities: cmsActivities, refetch } = useLandingPageContent();
  const [items, setItems] = useState<ActivityItem[]>(DEFAULT_ACTIVITIES);
  const [editingItem, setEditingItem] = useState<ActivityItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (cmsActivities && cmsActivities.length > 0) {
      setItems(cmsActivities);
    }
  }, [cmsActivities]);

  const handleSaveToBackend = async (updatedItems: ActivityItem[]) => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('teamToken') || localStorage.getItem('token');
      const payload = {
        title: 'Curated Experiences & Activities',
        subtitle: 'Manage authentic valley adventures and cultural immersions',
        content: {
          items: updatedItems
        }
      };

      const res = await fetch(`${API_BASE_URL}/site-content/activities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success('Activities updated and synced live!');
        refetch();
      } else {
        toast.error('Failed to save activities to server');
      }
    } catch (err) {
      toast.error('Network error saving activities');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingItem({
      id: `act-${Date.now()}`,
      title: '',
      location: 'Srinagar',
      duration: '2 Hours',
      price: 1500,
      category: 'Adventure',
      badge: 'Popular',
      image: 'https://images.unsplash.com/photo-1597074866923-dc0589150358?w=800',
      description: '',
      isActive: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: ActivityItem) => {
    setEditingItem({ ...item });
    setIsModalOpen(true);
  };

  const handleSaveModal = () => {
    if (!editingItem || !editingItem.title.trim()) {
      toast.error('Activity title is required');
      return;
    }

    const exists = items.some(i => i.id === editingItem.id);
    let updated: ActivityItem[];
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
            <Compass className="w-3.5 h-3.5" />
            <span>Curated Valley Experiences</span>
          </div>
          <h2 className="text-3xl font-display font-black text-white">Activities & Experiences CMS</h2>
          <p className="text-white/60 text-xs sm:text-sm mt-1 max-w-xl">
            Manage bespoke activities (Gondola snow rides, Shikara cruises, Wazwan gastronomy) available to clients in trip customization and custom itineraries.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleOpenAdd}
            className="h-11 px-5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-400/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Experience</span>
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

      {/* Activities Grid Cards */}
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
                alt={item.title} 
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
              <div className="absolute top-3 left-3">
                <Badge className="bg-amber-400 text-black font-black text-[9px]">
                  {item.badge || item.category}
                </Badge>
              </div>
              <div className="absolute top-3 right-3 flex items-center gap-1.5">
                <Badge className={item.isActive !== false ? 'bg-emerald-500/80 text-white text-[9px]' : 'bg-red-500/80 text-white text-[9px]'}>
                  {item.isActive !== false ? 'Active' : 'Hidden'}
                </Badge>
              </div>
              <div className="absolute bottom-3 left-4 right-4">
                <span className="text-[10px] text-amber-300 font-bold flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {item.location}
                </span>
                <h3 className="text-lg font-bold text-white font-display line-clamp-1">{item.title}</h3>
              </div>
            </div>

            <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <p className="text-xs text-white/60 line-clamp-2 leading-relaxed">
                {item.description}
              </p>

              <div className="flex items-center justify-between text-xs py-2 px-3 rounded-xl bg-white/[0.03] border border-white/5">
                <span className="text-white/40 flex items-center gap-1"><Clock className="w-3 h-3" /> {item.duration}</span>
                <span className="font-mono font-black text-amber-400 text-sm">₹{Number(item.price).toLocaleString()}</span>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                <span className="text-[10px] font-mono text-white/40">{item.category}</span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleToggleActive(item.id)}
                    className="w-8 h-8 rounded-lg text-white/60 hover:text-white"
                  >
                    {item.isActive !== false ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-red-400" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenEdit(item)}
                    className="w-8 h-8 rounded-lg text-amber-400 hover:bg-amber-400/10"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(item.id)}
                    className="w-8 h-8 rounded-lg text-red-400 hover:bg-red-400/10"
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
              <Compass className="w-5 h-5 text-amber-400" />
              <span>{editingItem?.id && items.some(i => i.id === editingItem.id) ? 'Edit Experience' : 'Add New Experience'}</span>
            </DialogTitle>
          </DialogHeader>

          {editingItem && (
            <div className="space-y-4 py-3">
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-white/50 mb-1.5 block">Title</label>
                <Input
                  value={editingItem.title}
                  onChange={e => setEditingItem({ ...editingItem, title: e.target.value })}
                  placeholder="e.g. Apharwat Peak Gondola Skiing"
                  className="bg-white/5 border-white/10 text-white text-xs rounded-xl"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-white/50 mb-1.5 block">Location</label>
                  <Input
                    value={editingItem.location}
                    onChange={e => setEditingItem({ ...editingItem, location: e.target.value })}
                    placeholder="e.g. Gulmarg"
                    className="bg-white/5 border-white/10 text-white text-xs rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-white/50 mb-1.5 block">Duration</label>
                  <Input
                    value={editingItem.duration}
                    onChange={e => setEditingItem({ ...editingItem, duration: e.target.value })}
                    placeholder="e.g. 3 Hours"
                    className="bg-white/5 border-white/10 text-white text-xs rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-white/50 mb-1.5 block">Price (₹)</label>
                  <Input
                    type="number"
                    value={editingItem.price}
                    onChange={e => setEditingItem({ ...editingItem, price: Number(e.target.value) })}
                    className="bg-white/5 border-white/10 text-white text-xs rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-white/50 mb-1.5 block">Category</label>
                  <Input
                    value={editingItem.category}
                    onChange={e => setEditingItem({ ...editingItem, category: e.target.value })}
                    placeholder="e.g. Alpine Adventure"
                    className="bg-white/5 border-white/10 text-white text-xs rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-white/50 mb-1.5 block">Badge Label</label>
                  <Input
                    value={editingItem.badge}
                    onChange={e => setEditingItem({ ...editingItem, badge: e.target.value })}
                    placeholder="e.g. Iconic"
                    className="bg-white/5 border-white/10 text-white text-xs rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-white/50 mb-1.5 block">Description</label>
                <Textarea
                  value={editingItem.description}
                  onChange={e => setEditingItem({ ...editingItem, description: e.target.value })}
                  rows={3}
                  className="bg-white/5 border-white/10 text-white text-xs rounded-xl"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-white/50 mb-1.5 block">Image URL</label>
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
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                <span className="text-xs text-white">Active in Custom Itinerary Planner</span>
                <Switch
                  checked={editingItem.isActive !== false}
                  onCheckedChange={checked => setEditingItem({ ...editingItem, isActive: checked })}
                />
              </div>
            </div>
          )}

          <DialogFooter className="mt-4 gap-2">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="text-xs text-white/60">
              Cancel
            </Button>
            <Button onClick={handleSaveModal} className="bg-amber-400 hover:bg-amber-300 text-black font-black text-xs uppercase px-5 rounded-xl">
              Save Experience
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
