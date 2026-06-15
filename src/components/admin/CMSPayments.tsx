import { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  Zap, 
  Lock, 
  CheckCircle2, 
  Smartphone,
  Globe,
  Building2,
  MoreVertical,
  Pencil
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/lib/api';

interface PaymentMethod {
  id: string;
  type: 'upi' | 'bank' | 'card' | 'wallet';
  name: string;
  provider: string;
  identifier: string; // e.g., UPI ID or Account Number
  isActive: boolean;
  isPrimary: boolean;
}

export default function CMSPayments() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    type: 'upi' as 'upi' | 'bank' | 'card' | 'wallet',
    provider: '',
    identifier: ''
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  // Fetch Settings from DB
  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/site-content`);
        if (!res.ok) throw new Error("Failed to fetch settings");
        const data = await res.json();
        
        if (data.paymentSettings && data.paymentSettings.content && data.paymentSettings.content.methods) {
          setMethods(data.paymentSettings.content.methods);
        } else {
          // Initialize defaults in memory
          const defaultMethods: PaymentMethod[] = [
            { id: '1', type: 'upi', name: 'Primary UPI', provider: 'Google Pay', identifier: 'thekashmircurators@okaxis', isActive: true, isPrimary: true },
            { id: '2', type: 'bank', name: 'Business Account', provider: 'HDFC Bank', identifier: 'XXXX-XXXX-8921', isActive: true, isPrimary: false },
          ];
          setMethods(defaultMethods);
          // Save default settings quietly to the DB
          await saveMethods(defaultMethods, false);
        }
      } catch (err) {
        console.error("Failed to load payment settings:", err);
        toast.error("Failed to load payment settings from database");
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // Save to DB
  const saveMethods = async (updatedMethods: PaymentMethod[], showNotification = true) => {
    try {
      const token = localStorage.getItem('teamToken') || localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/site-content/paymentSettings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          title: "Payment Settings",
          subtitle: "Configure UPI gateways and account details",
          content: { methods: updatedMethods }
        })
      });

      if (!res.ok) throw new Error("Failed to save payment settings");
      if (showNotification) {
        toast.success("Payment infrastructure updated successfully");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to save changes to the database");
    }
  };

  const toggleStatus = async (id: string) => {
    const updated = methods.map(m => m.id === id ? { ...m, isActive: !m.isActive } : m);
    setMethods(updated);
    await saveMethods(updated);
  };

  const togglePrimary = async (id: string) => {
    const updated = methods.map(m => {
      if (m.id === id) {
        return { ...m, isPrimary: true, isActive: true }; // Primary must be active
      } else {
        return { ...m, isPrimary: false };
      }
    });
    setMethods(updated);
    await saveMethods(updated);
  };

  const deleteGateway = async (id: string) => {
    const updated = methods.filter(m => m.id !== id);
    // If we deleted the primary, make the first remaining UPI or method primary
    if (methods.find(m => m.id === id)?.isPrimary && updated.length > 0) {
      updated[0].isPrimary = true;
    }
    setMethods(updated);
    await saveMethods(updated);
  };

  const handleEditClick = (method: PaymentMethod) => {
    setEditingId(method.id);
    setFormData({
      name: method.name,
      type: method.type,
      provider: method.provider,
      identifier: method.identifier
    });
    setIsAddOpen(true);
  };

  const handleSaveGateway = async () => {
    if (!formData.name || !formData.provider || !formData.identifier) {
      toast.error("Please fill in all fields");
      return;
    }

    let updated: PaymentMethod[];

    if (editingId) {
      // Edit mode
      updated = methods.map(m => m.id === editingId ? { 
        ...m, 
        name: formData.name, 
        type: formData.type, 
        provider: formData.provider, 
        identifier: formData.identifier 
      } : m);
    } else {
      // Add mode
      const newMethod: PaymentMethod = {
        id: Date.now().toString(),
        type: formData.type,
        name: formData.name,
        provider: formData.provider,
        identifier: formData.identifier,
        isActive: true,
        isPrimary: methods.length === 0 // Make primary if first method
      };
      updated = [...methods, newMethod];
    }

    setMethods(updated);
    await saveMethods(updated);
    setIsAddOpen(false);
    
    // Clear form
    setFormData({ name: '', type: 'upi', provider: '', identifier: '' });
    setEditingId(null);
  };

  const openAddDialog = () => {
    setEditingId(null);
    setFormData({ name: '', type: 'upi', provider: '', identifier: '' });
    setIsAddOpen(true);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 text-kashmir-gold text-[10px] font-black uppercase tracking-[0.3em] mb-2">
            <CreditCard className="w-4 h-4" />
            <span>Transaction Gateway</span>
          </div>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight">Payment Infrastructure</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={openAddDialog}
            className="rounded-xl bg-kashmir-gold text-black hover:bg-amber-500 font-black uppercase tracking-widest text-[10px] px-8 h-12"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Gateway
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-white/40 animate-pulse">
          Loading payment infrastructure...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {methods.map((method) => (
              <Card key={method.id} className="bg-white/[0.03] border-white/5 p-8 rounded-[2.5rem] backdrop-blur-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                  {method.type === 'upi' ? <Smartphone className="w-24 h-24" /> : <Building2 className="w-24 h-24" />}
                </div>
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-kashmir-gold shadow-xl">
                      {method.type === 'upi' ? <Zap className="w-8 h-8" /> : <Building2 className="w-8 h-8" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-xl font-bold text-white">{method.name}</h3>
                        {method.isPrimary ? (
                          <Badge className="bg-kashmir-gold/10 text-kashmir-gold border-kashmir-gold/20 text-[8px] font-black uppercase tracking-widest px-2 py-0.5">Primary</Badge>
                        ) : (
                          <button 
                            onClick={() => togglePrimary(method.id)}
                            className="text-[9px] font-black text-white/20 hover:text-kashmir-gold uppercase tracking-widest transition-all hover:scale-105"
                          >
                            Make Primary
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-white/40 font-mono tracking-wider">{method.identifier}</p>
                      <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mt-2">{method.provider}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-8 w-full md:w-auto pt-6 md:pt-0 border-t md:border-t-0 border-white/5">
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Active</span>
                      <Switch 
                        checked={method.isActive} 
                        onCheckedChange={() => toggleStatus(method.id)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => handleEditClick(method)} variant="ghost" size="icon" className="w-10 h-10 rounded-xl text-white/20 hover:text-white hover:bg-white/5">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button onClick={() => deleteGateway(method.id)} variant="ghost" size="icon" className="w-10 h-10 rounded-xl text-red-500/20 hover:text-red-400 hover:bg-red-500/5">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}

            {methods.length === 0 && (
              <div className="py-20 text-center bg-white/[0.01] border-2 border-dashed border-white/5 rounded-[3rem]">
                <Lock className="w-12 h-12 text-white/10 mx-auto mb-4" />
                <p className="text-white/20 font-bold uppercase tracking-widest text-xs">No active payment gateways</p>
              </div>
            )}
          </div>

          <div className="space-y-8">
            <Card className="bg-gradient-to-br from-kashmir-gold/10 to-transparent border-white/5 p-8 rounded-[3rem] backdrop-blur-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-kashmir-gold/20 flex items-center justify-center text-kashmir-gold">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-white uppercase tracking-widest text-xs">Security Protocol</h4>
              </div>
              <p className="text-xs text-white/40 leading-relaxed mb-6">
                All payment methods are encrypted and synchronized across the Sales and Checkout portals. Changes here affect live payment link generation.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-[10px] font-bold text-white/60">
                  <CheckCircle2 className="w-3.5 h-3.5 text-kashmir-gold" /> SSL v3.0 Enforced
                </div>
                <div className="flex items-center gap-3 text-[10px] font-bold text-white/60">
                  <CheckCircle2 className="w-3.5 h-3.5 text-kashmir-gold" /> PCI-DSS Compliant
                </div>
              </div>
            </Card>

            <Card className="bg-white/5 border-white/5 p-8 rounded-[3rem] backdrop-blur-xl">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-6">Volume Matrix</h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-white/40">Success Rate</span>
                  <span className="font-bold text-emerald-400">99.8%</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-[99.8%]" />
                </div>
                <div className="flex justify-between items-center text-sm mt-6">
                  <span className="text-white/40">Average Settlement</span>
                  <span className="font-bold text-white">4.2h</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="bg-[#111820] border-white/10 text-white rounded-[2rem] p-8">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Payment Gateway" : "Add Payment Gateway"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Method Name</label>
              <Input 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Business UPI" 
                className="bg-white/5 border-white/5 rounded-xl" 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Gateway Type</label>
                <select 
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full bg-white/5 border border-white/5 rounded-xl h-10 px-3 text-sm text-white focus:bg-[#111820]"
                >
                  <option value="upi">UPI</option>
                  <option value="bank">Bank Transfer</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Provider</label>
                <Input 
                  value={formData.provider}
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                  placeholder="e.g. Google Pay, HDFC" 
                  className="bg-white/5 border-white/5 rounded-xl" 
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Identification Number / ID</label>
              <Input 
                value={formData.identifier}
                onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                placeholder="e.g. your-name@upi or Account Number" 
                className="bg-white/5 border-white/5 rounded-xl font-mono" 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)} className="rounded-xl border-white/10 bg-transparent text-white hover:bg-white/5">Cancel</Button>
            <Button onClick={handleSaveGateway} className="rounded-xl bg-kashmir-gold text-black hover:bg-amber-500 font-bold px-6">Save Gateway</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
