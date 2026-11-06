import { useState, useEffect } from 'react';
import { 
  Tag, Plus, Edit, Trash2, Save, Percent, 
  Calendar, CheckCircle2, Copy, Users 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/lib/api';
import { useLandingPageContent, CouponItem } from '@/hooks/useLandingPageContent';

const DEFAULT_COUPONS: CouponItem[] = [
  {
    id: 'coup-1',
    code: 'PARADISE2026',
    title: 'Early Season Privilege',
    discountType: 'PERCENTAGE',
    discountValue: 10,
    maxDiscount: 5000,
    minOrderValue: 25000,
    validUntil: '2026-12-31',
    usageLimit: 100,
    usedCount: 28,
    isActive: true
  },
  {
    id: 'coup-2',
    code: 'HONEYMOONVIBES',
    title: 'Romantic Valley Escapes',
    discountType: 'FLAT',
    discountValue: 3500,
    maxDiscount: 3500,
    minOrderValue: 40000,
    validUntil: '2026-12-31',
    usageLimit: 50,
    usedCount: 14,
    isActive: true
  },
  {
    id: 'coup-3',
    code: 'B2BPARTNER5',
    title: 'Agent Wholesale Rebate',
    discountType: 'PERCENTAGE',
    discountValue: 5,
    maxDiscount: 10000,
    minOrderValue: 50000,
    validUntil: '2027-03-31',
    usageLimit: 500,
    usedCount: 89,
    isActive: true
  }
];

export default function CMSCoupons() {
  const { coupons: cmsCoupons, refetch } = useLandingPageContent();
  const [items, setItems] = useState<CouponItem[]>(DEFAULT_COUPONS);
  const [editingItem, setEditingItem] = useState<CouponItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (cmsCoupons && cmsCoupons.length > 0) {
      setItems(cmsCoupons);
    }
  }, [cmsCoupons]);

  const handleSaveToBackend = async (updatedItems: CouponItem[]) => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('teamToken') || localStorage.getItem('token');
      const payload = {
        title: 'Promotions & Vouchers',
        subtitle: 'Discount coupons and seasonal promotional offers',
        content: {
          items: updatedItems
        }
      };

      const res = await fetch(`${API_BASE_URL}/site-content/coupons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success('Coupons synchronized live with booking system!');
        refetch();
      } else {
        toast.error('Failed to save coupons');
      }
    } catch (err) {
      toast.error('Network error saving coupons');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingItem({
      id: `coup-${Date.now()}`,
      code: '',
      title: '',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      maxDiscount: 5000,
      minOrderValue: 20000,
      validUntil: '2026-12-31',
      usageLimit: 100,
      usedCount: 0,
      isActive: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: CouponItem) => {
    setEditingItem({ ...item });
    setIsModalOpen(true);
  };

  const handleSaveModal = () => {
    if (!editingItem || !editingItem.code.trim()) {
      toast.error('Coupon code is required');
      return;
    }

    const cleanCode = editingItem.code.trim().toUpperCase().replace(/\s+/g, '');
    const cleanItem = { ...editingItem, code: cleanCode };

    const exists = items.some(i => i.id === cleanItem.id);
    let updated: CouponItem[];
    if (exists) {
      updated = items.map(i => i.id === cleanItem.id ? cleanItem : i);
    } else {
      updated = [...items, cleanItem];
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

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Copied "${code}" to clipboard`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Top Header Card */}
      <div className="p-8 rounded-3xl bg-gradient-to-br from-amber-500/10 via-white/[0.02] to-transparent border border-amber-400/20 shadow-2xl backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-[10px] font-black uppercase tracking-wider mb-2">
            <Tag className="w-3.5 h-3.5" />
            <span>Growth & Conversion Engine</span>
          </div>
          <h2 className="text-3xl font-display font-black text-white">Coupons & Offers CMS</h2>
          <p className="text-white/60 text-xs sm:text-sm mt-1 max-w-xl">
            Create promotional voucher codes for website travelers and B2B partner agencies. Real-time redemption verification during checkout.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleOpenAdd}
            className="h-11 px-5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-400/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Promo Code</span>
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

      {/* Coupons Table */}
      <Card className="bg-[#0a0f14]/85 border border-white/10 p-6 rounded-3xl backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-white/40 uppercase tracking-widest text-[9px] font-black">
                <th className="pb-4">Coupon Code</th>
                <th className="pb-4">Campaign Title</th>
                <th className="pb-4">Discount</th>
                <th className="pb-4">Min Spend</th>
                <th className="pb-4">Redemptions</th>
                <th className="pb-4">Expiry</th>
                <th className="pb-4">Status</th>
                <th className="pb-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-white/80">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-4">
                    <button
                      onClick={() => copyCode(item.code)}
                      className="flex items-center gap-2 font-mono font-black text-amber-300 bg-amber-400/10 border border-amber-400/20 px-3 py-1.5 rounded-xl text-xs hover:bg-amber-400/20 transition-all"
                      title="Click to copy code"
                    >
                      <span>{item.code}</span>
                      <Copy className="w-3 h-3 text-amber-400 opacity-60" />
                    </button>
                  </td>
                  <td className="py-4 font-bold text-white">{item.title}</td>
                  <td className="py-4">
                    <span className="font-mono font-bold text-emerald-400">
                      {item.discountType === 'PERCENTAGE' ? `${item.discountValue}% OFF` : `₹${item.discountValue} FLAT`}
                    </span>
                    {item.maxDiscount && (
                      <span className="block text-[9px] text-white/40">Up to ₹{item.maxDiscount.toLocaleString()}</span>
                    )}
                  </td>
                  <td className="py-4 font-mono text-white/60">
                    ₹{(item.minOrderValue || 0).toLocaleString()}
                  </td>
                  <td className="py-4 font-mono">
                    <span className="text-white font-bold">{item.usedCount || 0}</span>
                    <span className="text-white/40"> / {item.usageLimit || '∞'}</span>
                  </td>
                  <td className="py-4 text-white/60 font-mono">
                    {item.validUntil}
                  </td>
                  <td className="py-4">
                    <Badge className={item.isActive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px]' : 'bg-red-500/20 text-red-400 border border-red-500/30 text-[9px]'}>
                      {item.isActive ? 'Active' : 'Disabled'}
                    </Badge>
                  </td>
                  <td className="py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleActive(item.id)}
                        className="w-8 h-8 rounded-lg text-white/60 hover:text-white"
                      >
                        <Switch checked={item.isActive} onCheckedChange={() => handleToggleActive(item.id)} />
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Form */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md bg-[#0c1218] border border-amber-400/30 text-white rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-display font-bold text-white flex items-center gap-2">
              <Tag className="w-5 h-5 text-amber-400" />
              <span>{editingItem?.id && items.some(i => i.id === editingItem.id) ? 'Edit Promo Voucher' : 'Create New Promo Code'}</span>
            </DialogTitle>
          </DialogHeader>

          {editingItem && (
            <div className="space-y-4 py-3">
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-white/50 mb-1.5 block">Promo Code</label>
                <Input
                  value={editingItem.code}
                  onChange={e => setEditingItem({ ...editingItem, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. SNOWKASHMIR"
                  className="bg-white/5 border-white/10 text-white text-xs rounded-xl font-mono uppercase"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-white/50 mb-1.5 block">Campaign Name</label>
                <Input
                  value={editingItem.title}
                  onChange={e => setEditingItem({ ...editingItem, title: e.target.value })}
                  placeholder="e.g. Winter Ski Special"
                  className="bg-white/5 border-white/10 text-white text-xs rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-white/50 mb-1.5 block">Discount Type</label>
                  <select
                    value={editingItem.discountType}
                    onChange={e => setEditingItem({ ...editingItem, discountType: e.target.value as any })}
                    className="w-full h-10 bg-white/5 border border-white/10 rounded-xl px-3 text-xs text-white"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FLAT">Flat Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-white/50 mb-1.5 block">
                    {editingItem.discountType === 'PERCENTAGE' ? 'Discount %' : 'Amount (₹)'}
                  </label>
                  <Input
                    type="number"
                    value={editingItem.discountValue}
                    onChange={e => setEditingItem({ ...editingItem, discountValue: Number(e.target.value) })}
                    className="bg-white/5 border-white/10 text-white text-xs rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-white/50 mb-1.5 block">Min Order Value (₹)</label>
                  <Input
                    type="number"
                    value={editingItem.minOrderValue || 0}
                    onChange={e => setEditingItem({ ...editingItem, minOrderValue: Number(e.target.value) })}
                    className="bg-white/5 border-white/10 text-white text-xs rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-white/50 mb-1.5 block">Max Discount Cap (₹)</label>
                  <Input
                    type="number"
                    value={editingItem.maxDiscount || 0}
                    onChange={e => setEditingItem({ ...editingItem, maxDiscount: Number(e.target.value) })}
                    className="bg-white/5 border-white/10 text-white text-xs rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-white/50 mb-1.5 block">Expiry Date</label>
                  <Input
                    type="date"
                    value={editingItem.validUntil}
                    onChange={e => setEditingItem({ ...editingItem, validUntil: e.target.value })}
                    className="bg-white/5 border-white/10 text-white text-xs rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-white/50 mb-1.5 block">Usage Limit</label>
                  <Input
                    type="number"
                    value={editingItem.usageLimit || 100}
                    onChange={e => setEditingItem({ ...editingItem, usageLimit: Number(e.target.value) })}
                    className="bg-white/5 border-white/10 text-white text-xs rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                <span className="text-xs text-white">Active for Redemptions</span>
                <Switch
                  checked={editingItem.isActive}
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
              Save Voucher
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
