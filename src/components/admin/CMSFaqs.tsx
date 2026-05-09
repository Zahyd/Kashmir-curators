import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Eye, EyeOff, GripVertical, Loader2, HelpCircle, LayoutGrid, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useTeamAuth } from '@/contexts/TeamAuthContext';
import { API_BASE_URL } from '@/lib/api';


interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  sortOrder: number;
  isActive: boolean;
}

const defaultFaq: Omit<FAQ, 'id'> = {
  question: '',
  answer: '',
  category: 'General',
  sortOrder: 0,
  isActive: true,
};

export default function CMSFaqs() {
  const { systemEvents } = useTeamAuth();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FAQ | null>(null);
  const [formData, setFormData] = useState(defaultFaq);

  const fetchFaqs = async () => {
    console.log('[CMSFaqs] Initiating fetch for knowledge base...');
    try {
      const response = await fetch(`${API_BASE_URL}/faqs?all=true`);
      console.log(`[CMSFaqs] Fetch response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[CMSFaqs] Fetch failed:', errorText);
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      console.log('[CMSFaqs] Intelligence nodes received:', data);
      
      if (Array.isArray(data)) {
        setFaqs(data);
      } else {
        console.warn('[CMSFaqs] Received data is not an array, defaulting to empty list');
        setFaqs([]);
      }
    } catch (error: any) {
      console.error('[CMSFaqs] Fatal error during fetch:', error);
      toast.error(`Failed to load knowledge base: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  useEffect(() => {
    const latestEvent = systemEvents[0];
    if (latestEvent && latestEvent.booking && latestEvent.booking.entityType === 'faq') {
      console.log('[CMSFaqs] System event detected for faq, refreshing...');
      fetchFaqs();
    }
  }, [systemEvents]);

  const openCreateDialog = () => {
    setEditingItem(null);
    setFormData({ ...defaultFaq, sortOrder: faqs.length });
    setDialogOpen(true);
  };

  const openEditDialog = (item: FAQ) => {
    setEditingItem(item);
    setFormData(item);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.question || !formData.answer) {
      toast.error('Question and Answer are mandatory');
      return;
    }

    setSaving(true);
    const token = localStorage.getItem('teamToken');
    const method = editingItem ? 'PATCH' : 'POST';
    const url = editingItem 
      ? `${API_BASE_URL}/faqs/${editingItem.id}` 
      : `${API_BASE_URL}/faqs`;

    console.log(`[CMSFaqs] Saving item via ${method} to ${url}`, formData);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      console.log(`[CMSFaqs] Save response status: ${response.status}`);

      if (response.ok) {
        toast.success(editingItem ? 'Intelligence updated' : 'New intelligence indexed');
        setDialogOpen(false);
        fetchFaqs();
      } else {
        const errData = await response.json().catch(() => ({}));
        console.error('[CMSFaqs] Indexing failed:', errData);
        toast.error(errData.error || `Indexing failed (Status: ${response.status})`);
      }
    } catch (error: any) {
      console.error('[CMSFaqs] System connection error during save:', error);
      toast.error(`System connection error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Erase this intelligence?')) return;
    const token = localStorage.getItem('teamToken');
    console.log(`[CMSFaqs] Attempting to erase node: ${id}`);
    
    try {
      const response = await fetch(`${API_BASE_URL}/faqs/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log(`[CMSFaqs] Delete response status: ${response.status}`);

      if (response.ok) {
        toast.success('Intelligence erased');
        fetchFaqs();
      } else {
        const errData = await response.json().catch(() => ({}));
        console.error('[CMSFaqs] Erasure failed:', errData);
        toast.error(errData.error || 'Erasure failed');
      }
    } catch (error: any) {
      console.error('[CMSFaqs] System connection error during delete:', error);
      toast.error(`System connection error: ${error.message}`);
    }
  };

  const toggleActive = async (item: FAQ) => {
    const token = localStorage.getItem('teamToken');
    console.log(`[CMSFaqs] Toggling active status for node: ${item.id}, current: ${item.isActive}`);
    try {
      const response = await fetch(`${API_BASE_URL}/faqs/${item.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !item.isActive })
      });

      if (response.ok) {
        fetchFaqs();
      } else {
        const errData = await response.json().catch(() => ({}));
        console.error('[CMSFaqs] Toggle failed:', errData);
        toast.error('Status toggle failed');
      }
    } catch (error: any) {
      console.error('[CMSFaqs] Toggle connection error:', error);
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
          <h2 className="text-3xl font-display font-bold text-white tracking-tight">Intelligence Base</h2>
          <p className="text-white/40 text-sm mt-1 uppercase tracking-widest font-black">Managing {faqs.length} FAQ Nodes</p>
        </div>
        <Button onClick={openCreateDialog} className="w-full md:w-auto bg-kashmir-gold text-black hover:bg-amber-500 font-black px-8 h-14 rounded-2xl shadow-xl shadow-kashmir-gold/10 transition-all">
          <Plus className="h-5 w-5 mr-2" /> 
          <span className="text-[10px] uppercase tracking-[0.2em]">Index Intelligence</span>
        </Button>
      </div>

      {/* Desktop View */}
      <div className="hidden lg:block bg-white/[0.01] border border-white/5 rounded-[2.5rem] overflow-hidden backdrop-blur-3xl shadow-inner relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-kashmir-gold/[0.02] to-transparent pointer-events-none" />
        <Table>
          <TableHeader className="bg-white/[0.02] border-b border-white/5">
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="text-white/20 uppercase text-[9px] font-black tracking-[0.4em] py-8 pl-10">Sequence</TableHead>
              <TableHead className="text-white/20 uppercase text-[9px] font-black tracking-[0.4em]">Inquiry Node</TableHead>
              <TableHead className="text-white/20 uppercase text-[9px] font-black tracking-[0.4em]">Classification</TableHead>
              <TableHead className="text-white/20 uppercase text-[9px] font-black tracking-[0.4em]">Status</TableHead>
              <TableHead className="text-white/20 uppercase text-[9px] font-black tracking-[0.4em] text-right pr-10">Controls</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-white/5">
            {faqs.map((item) => (
              <TableRow key={item.id} className="hover:bg-white/[0.02] transition-all duration-500 border-none group/row">
                <TableCell className="py-8 pl-10">
                  <div className="flex items-center gap-4">
                    <GripVertical className="h-4 w-4 text-white/10 group-hover/row:text-kashmir-gold/40 transition-colors" />
                    <span className="text-white/40 font-black text-sm">{item.sortOrder.toString().padStart(2, '0')}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1 max-w-md">
                    <span className="text-white font-bold tracking-tight text-base group-hover/row:text-kashmir-gold transition-colors truncate">{item.question}</span>
                    <span className="text-white/30 text-[10px] uppercase tracking-widest font-bold">Inquiry Node #{item.id.slice(-4)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="border-white/10 text-white/40 uppercase text-[9px] font-black tracking-widest px-3 py-1 rounded-lg">
                    {item.category}
                  </Badge>
                </TableCell>
                <TableCell>
                  <button onClick={() => toggleActive(item)} className="group/toggle">
                    <Badge className={cn(
                      "rounded-xl border-none px-4 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-300",
                      item.isActive ? "bg-emerald-500/10 text-emerald-400 group-hover/toggle:bg-emerald-500/20" : "bg-red-500/10 text-red-400 group-hover/toggle:bg-red-500/20"
                    )}>
                      {item.isActive ? 'Active' : 'Archived'}
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
        {faqs.map((item) => (
          <Card key={item.id} className="bg-white/[0.02] border-white/5 p-8 rounded-[2.5rem] space-y-8 relative overflow-hidden group">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <HelpCircle className="w-5 h-5 text-kashmir-gold/60" />
                  </div>
                  <Badge variant="outline" className="border-white/10 text-white/40 uppercase text-[8px] font-black tracking-widest px-2 py-0.5 rounded-lg">
                    {item.category}
                  </Badge>
               </div>
               <span className="text-white/20 font-black text-sm">#{item.sortOrder.toString().padStart(2, '0')}</span>
            </div>

            <div className="space-y-4">
               <h3 className="text-xl font-bold text-white tracking-tight leading-tight">{item.question}</h3>
               <p className="text-white/40 text-sm italic line-clamp-3 leading-relaxed">{item.answer}</p>
            </div>

            <div className="flex items-center justify-between py-6 border-t border-b border-white/5">
              <div className="space-y-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-white/20">System Status</p>
                <Badge className={cn(
                  "border-none rounded-lg px-3 py-1 text-[9px] font-black uppercase tracking-widest w-fit",
                  item.isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                )}>
                  {item.isActive ? 'Active' : 'Archived'}
                </Badge>
              </div>
            </div>

            <div className="flex gap-4">
              <Button onClick={() => openEditDialog(item)} className="flex-1 bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 h-14 rounded-2xl font-black transition-all">
                <Pencil className="w-4 h-4 mr-2" />
                <span className="text-[9px] uppercase tracking-widest">Update Node</span>
              </Button>
              <Button onClick={() => handleDelete(item.id)} className="w-14 bg-red-500/5 border border-red-500/10 text-red-400/60 hover:text-red-400 hover:bg-red-500/10 h-14 rounded-2xl transition-all">
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
            <DialogTitle className="text-3xl font-display font-black tracking-tight">{editingItem ? 'Update Intelligence Node' : 'Index New Inquiry'}</DialogTitle>
          </DialogHeader>
          <div className="p-10 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">The Inquiry</label>
              <Input
                className="bg-white/5 border-white/10 rounded-xl h-14 focus:border-kashmir-gold/50 transition-all text-base"
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                placeholder="What is the common traveler question?"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">System Response</label>
              <Textarea
                className="bg-white/5 border-white/10 rounded-2xl min-h-[160px] py-4 text-base resize-none"
                value={formData.answer}
                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                placeholder="Provide a detailed, helpful response..."
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Classification</label>
                <div className="relative group">
                  <LayoutGrid className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-kashmir-gold/50 transition-colors" />
                  <Input
                    className="bg-white/5 border-white/10 rounded-xl h-14 pl-12 focus:border-kashmir-gold/50 transition-all text-sm"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g., Booking"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Sort Sequence</label>
                <div className="relative group">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-kashmir-gold/50 transition-colors" />
                  <Input
                    type="number"
                    className="bg-white/5 border-white/10 rounded-xl h-14 pl-12 focus:border-kashmir-gold/50 transition-all text-sm"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-6 bg-white/5 rounded-2xl border border-white/5">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-white">Production Visibility</span>
                <span className="text-[9px] text-white/30 uppercase tracking-widest font-black">Visible in Help Center</span>
              </div>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>

            <Button onClick={handleSave} className="w-full h-16 bg-kashmir-gold text-black hover:bg-amber-500 font-black rounded-2xl transition-all shadow-xl shadow-kashmir-gold/20" disabled={saving}>
              {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : (editingItem ? 'Confirm Update' : 'Authorize Indexing')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
