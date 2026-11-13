import React, { useState } from 'react';
import { 
  Building2, 
  CreditCard, 
  Check, 
  ShieldCheck, 
  Save, 
  ArrowRight,
  Receipt
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface HospitalityPayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialBank?: {
    beneficiaryName: string;
    bankName: string;
    accountNumber: string;
    ifsc: string;
    upiId: string;
  };
}

export const HospitalityPayoutModal: React.FC<HospitalityPayoutModalProps> = ({
  isOpen,
  onClose,
  initialBank
}) => {
  const [bank, setBank] = useState({
    beneficiaryName: initialBank?.beneficiaryName || 'Chinar Heritage Stays LLP',
    bankName: initialBank?.bankName || 'Jammu & Kashmir Bank Ltd',
    accountNumber: initialBank?.accountNumber || '0021040100008941',
    ifsc: initialBank?.ifsc || 'JAKA0RESIDENCY',
    upiId: initialBank?.upiId || 'chinarstays@jkb'
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success('Bank Details Verified & Saved for Direct Settlements!', {
        description: 'Weekly NEFT payouts will be credited directly to this account.',
        icon: '🏦'
      });
      onClose();
    }, 600);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-3xl p-6 bg-card">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg">Bank Account & Payout Settings</DialogTitle>
              <DialogDescription className="text-xs">
                Configure beneficiary details for automated weekly guest departure payouts.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 my-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Beneficiary / Company Name</Label>
            <Input
              value={bank.beneficiaryName}
              onChange={(e) => setBank({ ...bank, beneficiaryName: e.target.value })}
              className="rounded-xl text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Bank Name</Label>
            <Input
              value={bank.bankName}
              onChange={(e) => setBank({ ...bank, bankName: e.target.value })}
              className="rounded-xl text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Account Number</Label>
              <Input
                value={bank.accountNumber}
                onChange={(e) => setBank({ ...bank, accountNumber: e.target.value })}
                className="rounded-xl font-mono text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">IFSC Code</Label>
              <Input
                value={bank.ifsc}
                onChange={(e) => setBank({ ...bank, ifsc: e.target.value.toUpperCase() })}
                className="rounded-xl font-mono text-xs uppercase"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">UPI VPA (Instant Micro-Settlements)</Label>
            <Input
              value={bank.upiId}
              onChange={(e) => setBank({ ...bank, upiId: e.target.value })}
              placeholder="e.g. hotelname@upi"
              className="rounded-xl text-xs"
            />
          </div>

          <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Encrypted escrow account with automatic GST TDS deductor.</span>
          </div>
        </div>

        <DialogFooter className="flex gap-2 pt-2">
          <Button variant="outline" onClick={onClose} className="rounded-xl text-xs">
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="rounded-xl text-xs font-bold gap-2"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Verifying...' : 'Save & Verify Account'}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default HospitalityPayoutModal;
