import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Eye, EyeOff, Star, Loader2, Quote, User, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useTeamAuth } from '@/contexts/TeamAuthContext';
import MediaPicker from './MediaPicker';
import { API_BASE_URL } from '@/lib/api';


interface Testimonial {
  id: string;
  name: string;
  location: string | null;
  avatar: string | null;
  content: string;
  rating: number;
  packageName: string | null;
  isActive: boolean;
}

const defaultTestimonial: Omit<Testimonial, 'id'> = {
  name: '',
  location: '',
  avatar: '',
  content: '',
  rating: 5,
  packageName: '',
  isActive: true,
};

export default function CMSTestimonials() {
  const { systemEvents } = useTeamAuth();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Testimonial | null>(null);
  const [formData, setFormData] = useState(defaultTestimonial);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const fetchTestimonials = async () => {
    console.log('[CMSTestimonials] Initiating fetch for traveler voices...');
    try {
      const response = await fetch(`${API_BASE_URL}/testimonials?all=true`);
      console.log(`[CMSTestimonials] Fetch response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[CMSTestimonials] Fetch failed:', errorText);
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      console.log('[CMSTestimonials] Voice nodes received:', data);
      
      if (Array.isArray(data)) {
        setTestimonials(data);
      } else {
        console.warn('[CMSTestimonials] Received data is not an array, defaulting to empty list');
        setTestimonials([]);
      }
    } catch (error: any) {
      console.error('[CMSTestimonials] Fatal error during fetch:', error);
      toast.error(`Failed to load testimonials: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  useEffect(() => {
    const latestEvent = systemEvents[0];
    if (latestEvent && latestEvent.booking && latestEvent.booking.entityType === 'testimonial') {
      console.log('[CMSTestimonials] System event detected for testimonial, refreshing...');
      fetchTestimonials();
    }
  }, [systemEvents]);

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
      toast.error('Identity and Content are mandatory');
      return;
    }

    setSaving(true);
    const token = localStorage.getItem('teamToken');
    const method = editingItem ? 'PATCH' : 'POST';
    const url = editingItem 
      ? `${API_BASE_URL}/testimonials/${editingItem.id}` 
      : `${API_BASE_URL}/testimonials`;

    console.log(`[CMSTestimonials] Saving voice via ${method} to ${url}`, formData);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      console.log(`[CMSTestimonials] Save response status: ${response.status}`);

      if (response.ok) {
        toast.success(editingItem ? 'Voice updated' : 'New voice registered');
        setDialogOpen(false);
        fetchTestimonials();
      } else {
        const errData = await response.json().catch(() => ({}));
        console.error('[CMSTestimonials] Registration failed:', errData);
        toast.error(errData.error || `Registration failed (Status: ${response.status})`);
      }
    } catch (error: any) {
      console.error('[CMSTestimonials] System connection error during save:', error);
      toast.error(`System connection error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const token = localStorage.getItem('teamToken');
    console.log(`[CMSTestimonials] Attempting to discard voice node: ${id}`);
    
    try {
      const response = await fetch(`${API_BASE_URL}/testimonials/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log(`[CMSTestimonials] Delete response status: ${response.status}`);

      if (response.ok) {
        toast.success('Voice discarded');
        fetchTestimonials();
      } else {
        const errData = await response.json().catch(() => ({}));
        console.error('[CMSTestimonials] Discard failed:', errData);
        toast.error(errData.error || 'Discarding failed');
      }
    } catch (error: any) {
      console.error('[CMSTestimonials] System connection error during delete:', error);
      toast.error(`System connection error: ${error.message}`);
    }
  };

  const toggleActive = async (item: Testimonial) => {
    const token = localStorage.getItem('teamToken');
    console.log(`[CMSTestimonials] Toggling visibility for node: ${item.id}, current: ${item.isActive}`);
    try {
      const response = await fetch(`${API_BASE_URL}/testimonials/${item.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !item.isActive })
      });

      if (response.ok) {
        fetchTestimonials();
      } else {
        const errData = await response.json().catch(() => ({}));
        console.error('[CMSTestimonials] Toggle failed:', errData);
        toast.error('Status toggle failed');
      }
    } catch (error: any) {
      console.error('[CMSTestimonials] Toggle connection error:', error);
      toast.error('Status toggle failed');
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
          <h2 className="text-3xl font-display font-bold text-white tracking-tight">Traveler Voices</h2>
          <p className="text-white/40 text-sm mt-1 uppercase tracking-widest font-black">Curating {testimonials.length} Experiences</p>
        </div>
        <Button onClick={openCreateDialog} className="w-full md:w-auto bg-kashmir-gold text-black hover:bg-amber-500 font-black px-8 h-14 rounded-2xl shadow-xl shadow-kashmir-gold/10 transition-all">
          <Plus className="h-5 w-5 mr-2" /> 
          <span className="text-[10px] uppercase tracking-[0.2em]">Register Voice</span>
        </Button>
      </div>

      {/* Desktop View */}
      <div className="hidden lg:block bg-white/[0.01] border border-white/5 rounded-[2.5rem] overflow-hidden backdrop-blur-3xl shadow-inner relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-kashmir-gold/[0.02] to-transparent pointer-events-none" />
        <Table>
          <TableHeader className="bg-white/[0.02] border-b border-white/5">
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="text-white/20 uppercase text-[9px] font-black tracking-[0.4em] py-8 pl-10">Traveler Identity</TableHead>
              <TableHead className="text-white/20 uppercase text-[9px] font-black tracking-[0.4em]">Experience Snippet</TableHead>
              <TableHead className="text-white/20 uppercase text-[9px] font-black tracking-[0.4em]">Sentiment</TableHead>
              <TableHead className="text-white/20 uppercase text-[9px] font-black tracking-[0.4em]">Status</TableHead>
              <TableHead className="text-white/20 uppercase text-[9px] font-black tracking-[0.4em] text-right pr-10">Controls</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-white/5">
            {testimonials.map((item) => (
              <TableRow key={item.id} className="hover:bg-white/[0.02] transition-all duration-500 border-none group/row">
                <TableCell className="py-8 pl-10">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 overflow-hidden border border-white/10 flex items-center justify-center shadow-2xl relative group/img">
                      {item.avatar ? (
                        <img src={item.avatar} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-6 h-6 text-kashmir-gold/40" />
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-white font-bold tracking-tight text-base group-hover/row:text-kashmir-gold transition-colors">{item.name}</span>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-white/20" />
                        <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">{item.location || 'Verified Traveler'}</span>
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <p className="text-white/60 text-sm max-w-xs truncate leading-relaxed">"{item.content}"</p>
                </TableCell>
                <TableCell>
                   <div className="flex items-center gap-1">
                    {[...Array(item.rating)].map((_, i) => (
                      <Star key={i} className="h-2.5 w-2.5 fill-kashmir-gold text-kashmir-gold" />
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <button onClick={() => toggleActive(item)} className="group/toggle">
                    <Badge className={cn(
                      "rounded-xl border-none px-4 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-300",
                      item.isActive ? "bg-emerald-500/10 text-emerald-400 group-hover/toggle:bg-emerald-500/20" : "bg-red-500/10 text-red-400 group-hover/toggle:bg-red-500/20"
                    )}>
                      {item.isActive ? 'Displayed' : 'Hidden'}
                    </Badge>
                  </button>
                </TableCell>
                <TableCell className="text-right pr-10">
                  <div className="flex justify-end gap-3 opacity-20 group-hover/row:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)} className="w-12 h-12 bg-white/5 border border-white/5 rounded-2xl text-white/40 hover:text-white hover:border-white/20 transition-all">
                      <Pencil className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="w-12 h-12 bg-white/5 border border-white/5 rounded-2xl text-white/20 hover:text-red-400 hover:border-red-400/20 transition-all">
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
        {testimonials.map((item) => (
          <Card key={item.id} className="bg-white/[0.02] border-white/5 p-8 rounded-[2.5rem] space-y-8 relative overflow-hidden group">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-white/5 overflow-hidden border border-white/10 shrink-0 shadow-2xl relative">
                {item.avatar ? (
                  <img src={item.avatar} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-kashmir-gold/40 m-4" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-white tracking-tight truncate leading-tight">{item.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <MapPin className="w-3 h-3 text-white/20" />
                  <span className="text-[10px] text-white/40 font-bold uppercase truncate">{item.location || 'Verified Traveler'}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
               <Quote className="w-8 h-8 text-kashmir-gold/20" />
               <p className="text-white/60 text-base italic leading-relaxed">"{item.content}"</p>
            </div>

            <div className="grid grid-cols-2 gap-6 py-6 border-t border-b border-white/5">
              <div className="space-y-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-white/20">Sentiment Score</p>
                <div className="flex items-center gap-1 mt-1">
                  {[...Array(item.rating)].map((_, i) => (
                    <Star key={i} className="h-3 w-3 fill-kashmir-gold text-kashmir-gold" />
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-white/20">Visibility</p>
                <Badge className={cn(
                  "border-none rounded-lg px-3 py-1 text-[9px] font-black uppercase tracking-widest w-fit",
                  item.isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                )}>
                  {item.isActive ? 'Displayed' : 'Hidden'}
                </Badge>
              </div>
            </div>

            <div className="flex gap-4">
              <Button onClick={() => openEditDialog(item)} className="flex-1 bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 h-14 rounded-2xl font-black transition-all">
                <Pencil className="w-4 h-4 mr-2" />
                <span className="text-[9px] uppercase tracking-widest">Re-edit Voice</span>
              </Button>
              <Button 
                onClick={() => {
                  setItemToDelete(item.id);
                  setDeleteConfirmOpen(true);
                }} 
                className="w-14 bg-red-500/5 border border-red-500/10 text-red-400/60 hover:text-red-400 hover:bg-red-500/10 h-14 rounded-2xl transition-all"
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl bg-[#0a0f12] border-white/10 text-white rounded-[2.5rem] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-kashmir-gold/5 via-transparent to-transparent pointer-events-none" />
          <DialogHeader className="p-10 pb-0">
            <DialogTitle className="text-3xl font-display font-black tracking-tight">{editingItem ? 'Re-edit Traveler Voice' : 'Register New Voice'}</DialogTitle>
          </DialogHeader>
          <div className="p-10 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Identity</label>
                <Input
                  className="bg-white/5 border-white/10 rounded-xl h-14 focus:border-kashmir-gold/50 transition-all text-base"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Aryan Sharma"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Origin</label>
                <Input
                  className="bg-white/5 border-white/10 rounded-xl h-14 focus:border-kashmir-gold/50 transition-all text-base"
                  value={formData.location || ''}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., New Delhi"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">The Experience</label>
              <Textarea
                className="bg-white/5 border-white/10 rounded-2xl min-h-[140px] py-4 text-base resize-none"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="What did they say about the journey?"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Sentiment Rating</label>
                <Select
                  value={formData.rating.toString()}
                  onValueChange={(v) => setFormData({ ...formData, rating: Number(v) })}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 h-14 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0f1416] border-white/10 text-white">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <SelectItem key={n} value={n.toString()}>{n} Star{n > 1 ? 's' : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Reference Node</label>
                <Input
                  className="bg-white/5 border-white/10 rounded-xl h-14"
                  value={formData.packageName || ''}
                  onChange={(e) => setFormData({ ...formData, packageName: e.target.value })}
                  placeholder="e.g., Gulmarg Luxury"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Traveler Portrait</label>
              <MediaPicker
                value={formData.avatar || ''}
                onChange={(url) => setFormData({ ...formData, avatar: url })}
              />
            </div>

            <div className="flex items-center justify-between p-6 bg-white/5 rounded-2xl border border-white/5">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-white">Public Visibility</span>
                <span className="text-[9px] text-white/30 uppercase tracking-widest font-black">Display on Marketing Site</span>
              </div>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>

            <Button onClick={handleSave} className="w-full h-16 bg-kashmir-gold text-black hover:bg-amber-500 font-black rounded-2xl transition-all shadow-xl shadow-kashmir-gold/20" disabled={saving}>
              {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : (editingItem ? 'Confirm Edits' : 'Authorize Publication')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="bg-[#0a0f12] border-white/10 text-white rounded-[2.5rem]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black">Discard Traveler Voice?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              Are you sure you want to discard this testimonial? This action will remove the traveler's feedback from the public site.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white/60 hover:bg-white/10 rounded-xl h-12">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => itemToDelete && handleDelete(itemToDelete)}
              className="bg-red-500 hover:bg-red-600 text-white rounded-xl h-12 font-bold"
            >
              Confirm Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
