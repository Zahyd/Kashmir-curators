import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, UserPlus, Save } from 'lucide-react';
import { toast } from 'sonner';
import { salesApi, SalesInquiry, TeamMemberItem } from '@/lib/salesApi';

interface LeadFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialLead?: SalesInquiry | null;
  teamMembers?: TeamMemberItem[];
  canAssign?: boolean;
  currentEmployeeCode?: string;
  onSuccess: (saved: SalesInquiry) => void;
}

export default function LeadFormModal({
  open,
  onOpenChange,
  initialLead,
  teamMembers = [],
  canAssign = false,
  currentEmployeeCode = '',
  onSuccess
}: LeadFormModalProps) {
  const isEditing = Boolean(initialLead?.id);
  const [saving, setSaving] = useState(false);

  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [destination, setDestination] = useState('Srinagar, Gulmarg & Pahalgam');
  const [duration, setDuration] = useState('5 Nights / 6 Days');
  const [adultsCount, setAdultsCount] = useState('2');
  const [childrenCount, setChildrenCount] = useState('0');
  const [netPrice, setNetPrice] = useState('');
  const [budget, setBudget] = useState('Premium');
  const [accommodation, setAccommodation] = useState('4-Star Boutique');
  const [transportPreference, setTransportPreference] = useState('Toyota Innova Crysta');
  const [arrivalCity, setArrivalCity] = useState('Srinagar (SXR)');
  const [priority, setPriority] = useState('Medium');
  const [assignedTo, setAssignedTo] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!open) return;
    if (initialLead) {
      setCustomerName(initialLead.customerName || '');
      setPhone(initialLead.phone || '');
      setEmail(initialLead.email || '');
      setDestination(initialLead.destination || 'Srinagar, Gulmarg & Pahalgam');
      setDuration(initialLead.duration || '5 Nights / 6 Days');
      setAdultsCount(String(initialLead.adultsCount ?? 2));
      setChildrenCount(String(initialLead.childrenCount ?? 0));
      setNetPrice(initialLead.netPrice ? String(initialLead.netPrice) : '');
      setBudget(String(initialLead.budget || 'Premium'));
      setAccommodation(initialLead.preferredAccommodation || initialLead.accommodation || '4-Star Boutique');
      setTransportPreference(initialLead.transportPreference || 'Toyota Innova Crysta');
      setArrivalCity(initialLead.arrivalCity || 'Srinagar (SXR)');
      setPriority(initialLead.priority || 'Medium');
      setAssignedTo(initialLead.assignedTo || '');
      setNotes(initialLead.notes || '');
    } else {
      setCustomerName('');
      setPhone('');
      setEmail('');
      setDestination('Srinagar, Gulmarg & Pahalgam');
      setDuration('5 Nights / 6 Days');
      setAdultsCount('2');
      setChildrenCount('0');
      setNetPrice('');
      setBudget('Premium');
      setAccommodation('4-Star Boutique');
      setTransportPreference('Toyota Innova Crysta');
      setArrivalCity('Srinagar (SXR)');
      setPriority('Medium');
      setAssignedTo(canAssign ? '' : currentEmployeeCode);
      setNotes('');
    }
  }, [open, initialLead, canAssign, currentEmployeeCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      toast.error('Traveler name is required');
      return;
    }
    if (!phone.trim() && !email.trim()) {
      toast.error('Phone number or email is required');
      return;
    }

    setSaving(true);
    try {
      const adults = Math.max(1, parseInt(adultsCount, 10) || 2);
      const children = Math.max(0, parseInt(childrenCount, 10) || 0);
      const parsedNet = netPrice.trim() ? Number(netPrice) : undefined;

      const payload: Record<string, any> = {
        customerName: customerName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        destination: destination.trim(),
        duration: duration.trim(),
        adultsCount: adults,
        childrenCount: children,
        travelers: `${adults} Adults${children > 0 ? `, ${children} Kids` : ''}`,
        budget: parsedNet && parsedNet > 0 ? `₹${parsedNet.toLocaleString('en-IN')}` : budget.trim(),
        ...(parsedNet !== undefined ? { netPrice: parsedNet } : {}),
        accommodation: accommodation.trim(),
        transportPreference: transportPreference.trim(),
        arrivalCity: arrivalCity.trim(),
        priority,
        notes: notes.trim() || null
      };

      if (canAssign) {
        payload.assignedTo = assignedTo || null;
      } else if (!isEditing && currentEmployeeCode) {
        payload.assignedTo = currentEmployeeCode;
      }

      const saved = isEditing && initialLead
        ? await salesApi.updateLead(initialLead.id, payload)
        : await salesApi.createLead(payload);

      toast.success(isEditing ? 'Lead details updated' : 'New lead created in Sales OS');
      onSuccess(saved);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save lead');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0B0F17] border border-white/10 text-white max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
            {isEditing ? <Save className="w-4 h-4 text-amber-400" /> : <UserPlus className="w-4 h-4 text-amber-400" />}
            {isEditing ? `Edit Lead: ${initialLead?.customerName}` : 'Add New Lead / Private Client'}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-400">
            {isEditing
              ? 'Update client contact details, itinerary requirements, and deal valuation in Neon DB.'
              : 'Capture a phone, WhatsApp, or walk-in traveler inquiry directly into your live pipeline.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Traveler Name *</label>
              <Input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Tariq Lone"
                className="mt-1 bg-[#07090E] border-white/10 text-white h-9 text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">WhatsApp / Phone *</label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 99060 XXXXX"
                className="mt-1 bg-[#07090E] border-white/10 text-white h-9 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="traveler@example.com"
                className="mt-1 bg-[#07090E] border-white/10 text-white h-9 text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Destination Circuit</label>
              <Input
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="mt-1 bg-[#07090E] border-white/10 text-white h-9 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Duration</label>
              <Input
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="mt-1 bg-[#07090E] border-white/10 text-white h-9 text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Adults</label>
              <Input
                type="number"
                min={1}
                value={adultsCount}
                onChange={(e) => setAdultsCount(e.target.value)}
                className="mt-1 bg-[#07090E] border-white/10 text-white h-9 text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Kids</label>
              <Input
                type="number"
                min={0}
                value={childrenCount}
                onChange={(e) => setChildrenCount(e.target.value)}
                className="mt-1 bg-[#07090E] border-white/10 text-white h-9 text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Quote INR</label>
              <Input
                type="number"
                min={0}
                value={netPrice}
                onChange={(e) => setNetPrice(e.target.value)}
                placeholder="e.g. 68000"
                className="mt-1 bg-[#07090E] border-white/10 text-white h-9 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Stay Tier</label>
              <Input
                value={accommodation}
                onChange={(e) => setAccommodation(e.target.value)}
                className="mt-1 bg-[#07090E] border-white/10 text-white h-9 text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Arrival City</label>
              <Input
                value={arrivalCity}
                onChange={(e) => setArrivalCity(e.target.value)}
                className="mt-1 bg-[#07090E] border-white/10 text-white h-9 text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="mt-1 w-full bg-[#07090E] border border-white/10 text-white h-9 rounded-md px-2.5 text-xs focus:outline-none focus:border-amber-400"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Transport Preference</label>
              <Input
                value={transportPreference}
                onChange={(e) => setTransportPreference(e.target.value)}
                className="mt-1 bg-[#07090E] border-white/10 text-white h-9 text-xs"
              />
            </div>
            {canAssign && (
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Assign Concierge</label>
                <select
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="mt-1 w-full bg-[#07090E] border border-white/10 text-white h-9 rounded-md px-2.5 text-xs focus:outline-none focus:border-amber-400"
                >
                  <option value="">Leave Unclaimed (Live Queue)</option>
                  {teamMembers.map((m) => (
                    <option key={m.id} value={m.employeeCode || m.email}>
                      {m.name} ({m.employeeCode || m.email})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Initial Notes</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Special requests, flight arrival timings, honeymoon decor..."
              className="mt-1 bg-[#07090E] border-white/10 text-white text-xs resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-white/10 text-slate-300 hover:text-white hover:bg-white/5 h-9 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-amber-500 hover:bg-amber-400 text-black font-bold h-9 px-4 text-xs"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  Saving...
                </>
              ) : isEditing ? (
                'Save Changes'
              ) : (
                'Create Lead'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
