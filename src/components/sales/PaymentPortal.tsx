import React, { useEffect, useState } from 'react';
import {
  CreditCard,
  QrCode,
  Send,
  CheckCircle2,
  ArrowLeft,
  Copy,
  Download,
  IndianRupee,
  ShieldCheck,
  Smartphone,
  ExternalLink,
  Loader2,
  RefreshCw,
  Receipt
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { API_BASE_URL } from '@/lib/api';
import { salesApi, getInquiryValueINR, PaymentLedgerItem } from '@/lib/salesApi';
import { useTeamAuth } from '@/contexts/TeamAuthContext';

interface PaymentPortalProps {
  inquiry: any;
  onBack: () => void;
  onPaymentRecorded?: () => void;
}

export default function PaymentPortal({ inquiry, onBack, onPaymentRecorded }: PaymentPortalProps) {
  const { systemEvents } = useTeamAuth();
  const baseValue = getInquiryValueINR(inquiry || {});

  const [paymentType, setPaymentType] = useState<'deposit' | 'full'>('deposit');
  const [amount, setAmount] = useState<string>(
    baseValue > 0 ? String(Math.round(baseValue * 0.3)) : '0'
  );
  const [transactionId, setTransactionId] = useState('');
  const [markConfirmed, setMarkConfirmed] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [razorpayLink, setRazorpayLink] = useState('');
  const [isGeneratingScanner, setIsGeneratingScanner] = useState(false);
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const [ledgerEntries, setLedgerEntries] = useState<PaymentLedgerItem[]>([]);
  const [loadingLedger, setLoadingLedger] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'failed'>('pending');

  const [businessVPA, setBusinessVPA] = useState<string>('thekashmircurators@okaxis');
  const [merchantName, setMerchantName] = useState<string>('The Kashmir Curators');

  const loadLedger = async () => {
    if (!inquiry?.id) return;
    setLoadingLedger(true);
    try {
      const rows = await salesApi.getInquiryPayments(inquiry.id);
      setLedgerEntries(rows);
      if (rows.some((r) => !r.description?.startsWith('Pending WhatsApp'))) {
        setPaymentStatus('success');
      }
    } catch (err: any) {
      console.warn('Could not load inquiry ledger:', err?.message);
    } finally {
      setLoadingLedger(false);
    }
  };

  useEffect(() => {
    const val = getInquiryValueINR(inquiry || {});
    setAmount(val > 0 ? String(paymentType === 'deposit' ? Math.round(val * 0.3) : val) : '0');
  }, [inquiry?.id, paymentType]);

  useEffect(() => {
    loadLedger();
  }, [inquiry?.id]);

  useEffect(() => {
    const latestEvent = systemEvents[0];
    if (latestEvent && inquiry?.id) {
      const isMatch =
        (latestEvent.booking && String(latestEvent.booking.id) === String(inquiry.id)) ||
        latestEvent.message.includes(inquiry.id);
      if (isMatch) {
        if (latestEvent.message.toLowerCase().includes('failed')) {
          setPaymentStatus('failed');
        } else {
          setPaymentStatus('success');
          loadLedger();
        }
      }
    }
  }, [systemEvents, inquiry?.id]);

  useEffect(() => {
    const fetchPaymentSettings = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/site-content`);
        if (!res.ok) return;
        const data = await res.json();
        const methods = data?.paymentSettings?.content?.methods;
        if (Array.isArray(methods)) {
          const primaryUPI = methods.find((m: any) => m.type === 'upi' && m.isActive && m.isPrimary);
          if (primaryUPI) {
            setBusinessVPA(primaryUPI.identifier);
            setMerchantName(primaryUPI.name || primaryUPI.provider || 'The Kashmir Curators');
          }
        }
      } catch {
        // Use defaults
      }
    };
    fetchPaymentSettings();
  }, []);

  if (!inquiry) return null;

  const generateUPILink = () => {
    const encodedName = encodeURIComponent(merchantName);
    const shortId = inquiry.leadId || `KC-${inquiry.id.substring(0, 8).toUpperCase()}`;
    const encodedNote = encodeURIComponent(`Booking for ${shortId}`);
    return `upi://pay?pa=${businessVPA}&pn=${encodedName}&am=${amount}&cu=INR&tn=${encodedNote}`;
  };

  const qrCodeUrl = razorpayLink
    ? `https://api.qrserver.com/v1/create-qr-code/?size=360x360&data=${encodeURIComponent(razorpayLink)}&bgcolor=faf9f6&color=0a0f12&margin=16`
    : `https://api.qrserver.com/v1/create-qr-code/?size=360x360&data=${encodeURIComponent(generateUPILink())}&bgcolor=faf9f6&color=0a0f12&margin=16`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(razorpayLink || generateUPILink());
    toast.success(razorpayLink ? 'Razorpay Link copied' : 'UPI Deep-Link copied');
  };

  const handleGenerateScanner = async () => {
    const numAmt = parseFloat(amount);
    if (!numAmt || numAmt <= 0) {
      toast.error('Please enter a valid positive amount');
      return;
    }
    setIsGeneratingScanner(true);
    const toastId = toast.loading('Generating secure Razorpay payment link...');
    try {
      const data = await salesApi.createRazorpayLink(inquiry.id, numAmt, inquiry.email);
      setRazorpayLink(data.sessionUrl);
      setShowScanner(true);
      toast.success('Payment link & QR scanner ready', { id: toastId });
      await loadLedger();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to generate Razorpay payment link', { id: toastId });
    } finally {
      setIsGeneratingScanner(false);
    }
  };

  const handleSendWhatsApp = async () => {
    const numAmt = parseFloat(amount);
    if (!numAmt || numAmt <= 0) {
      toast.error('Please enter a valid positive amount');
      return;
    }
    setIsSendingWhatsApp(true);
    try {
      if (razorpayLink) {
        const text = `Hi ${inquiry.customerName},\n\nPlease complete your Kashmir Curators booking payment of ₹${numAmt.toLocaleString('en-IN')} via this secure Razorpay link:\n\n${razorpayLink}\n\nThank you!`;
        window.open(`https://api.whatsapp.com/send?phone=${(inquiry.phone || '').replace(/[^0-9]/g, '')}&text=${encodeURIComponent(text)}`, '_blank');
        toast.success('Opened WhatsApp with checkout link');
        return;
      }

      const resData = await salesApi.sendWhatsAppScanner(inquiry.id, inquiry.phone, numAmt);
      toast.success(`Payment request dispatched (Ref: ${resData.paymentId})`);
      await loadLedger();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to dispatch WhatsApp payment request');
    } finally {
      setIsSendingWhatsApp(false);
    }
  };

  const handleVerifyPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmt = parseFloat(amount);
    if (!numAmt || numAmt <= 0) {
      toast.error('Enter the received INR amount');
      return;
    }
    if (!transactionId.trim()) {
      toast.error('Enter the UTR / Transaction Reference Number');
      return;
    }

    setIsVerifying(true);
    try {
      await salesApi.verifyManualPayment(inquiry.id, {
        amount: numAmt,
        utrNumber: transactionId.trim(),
        markConfirmed,
        notes: `${paymentType === 'deposit' ? 'Booking Deposit' : 'Full Settlement'}`
      });
      toast.success(
        markConfirmed
          ? 'Payment recorded in TransactionLedger & lead marked CONFIRMED!'
          : 'Payment UTR recorded & lead moved to PAYMENT_PENDING'
      );
      setTransactionId('');
      setPaymentStatus('success');
      await loadLedger();
      onPaymentRecorded?.();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to record payment UTR');
    } finally {
      setIsVerifying(false);
    }
  };

  const totalRecorded = ledgerEntries
    .filter((l) => !l.description?.startsWith('Pending WhatsApp'))
    .reduce((sum, l) => sum + (l.amount || 0), 0);

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0F141C]/90 border border-white/10 p-4 sm:p-5 rounded-xl shadow-lg">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            onClick={onBack}
            variant="outline"
            size="icon"
            className="w-9 h-9 rounded-lg bg-[#07090E] border-white/10 text-slate-300 hover:text-white shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-amber-400 text-[10px] font-mono font-bold uppercase tracking-wider">
              <CreditCard className="w-3.5 h-3.5" />
              <span>Razorpay &amp; UPI Settlement Desk</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white truncate">
              Collect Payment — {inquiry.customerName}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-3 py-1 text-xs font-mono">
            <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Paid: ₹{totalRecorded.toLocaleString('en-IN')}
          </Badge>
          {baseValue > 0 && (
            <Badge className="bg-white/5 text-slate-300 border border-white/10 px-3 py-1 text-xs font-mono">
              Quote: ₹{baseValue.toLocaleString('en-IN')}
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Left: Generator & Manual UTR Verification */}
        <div className="lg:col-span-3 space-y-5">
          <Card className="bg-[#0F141C]/90 border border-white/10 p-5 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-amber-400" />
                Payment Request Configuration
              </h3>
              <div className="flex bg-[#07090E] p-1 rounded-lg border border-white/10 text-xs">
                <button
                  type="button"
                  onClick={() => setPaymentType('deposit')}
                  className={cn(
                    'px-2.5 py-1 rounded font-semibold transition',
                    paymentType === 'deposit' ? 'bg-amber-500 text-black font-bold' : 'text-slate-400 hover:text-white'
                  )}
                >
                  30% Deposit
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentType('full')}
                  className={cn(
                    'px-2.5 py-1 rounded font-semibold transition',
                    paymentType === 'full' ? 'bg-amber-500 text-black font-bold' : 'text-slate-400 hover:text-white'
                  )}
                >
                  100% Full
                </button>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Collection Amount (INR)
              </label>
              <Input
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1 bg-[#07090E] border-white/10 text-white text-base font-mono font-bold h-11"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Merchant UPI VPA: <span className="font-mono text-amber-300">{businessVPA}</span>
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <Button
                type="button"
                onClick={handleGenerateScanner}
                disabled={isGeneratingScanner}
                className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs h-10 rounded-lg"
              >
                {isGeneratingScanner ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <QrCode className="w-4 h-4 mr-1.5" />}
                Generate Razorpay Link &amp; QR
              </Button>
              <Button
                type="button"
                onClick={handleSendWhatsApp}
                disabled={isSendingWhatsApp}
                variant="outline"
                className="border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/15 font-bold text-xs h-10 rounded-lg"
              >
                {isSendingWhatsApp ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Send className="w-4 h-4 mr-1.5" />}
                Send Request via WhatsApp
              </Button>
            </div>
          </Card>

          {/* Manual UTR / Bank Transfer Verification */}
          <Card className="bg-[#0F141C]/90 border border-white/10 p-5 rounded-xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Record Received UTR / Direct UPI Settlement
            </h3>
            <form onSubmit={handleVerifyPayment} className="space-y-3">
              <Input
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="Enter Bank UTR / UPI Ref No. (e.g. 432918274109)"
                className="bg-[#07090E] border-white/10 text-white text-xs h-10 font-mono"
              />
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={markConfirmed}
                  onChange={(e) => setMarkConfirmed(e.target.checked)}
                  className="rounded border-white/20 bg-[#07090E]"
                />
                Transition lead stage to <span className="text-emerald-400 font-bold">CONFIRMED</span> immediately
              </label>
              <Button
                type="submit"
                disabled={isVerifying}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs h-10 rounded-lg"
              >
                {isVerifying ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
                Record Payment in Transaction Ledger
              </Button>
            </form>
          </Card>
        </div>

        {/* Right: QR Preview & Live Transaction Ledger */}
        <div className="lg:col-span-2 space-y-5">
          <Card className="bg-[#0F141C]/90 border border-white/10 p-5 rounded-xl flex flex-col items-center text-center">
            <div className="w-full flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-amber-400" /> Instant Checkout QR
              </span>
              {paymentStatus === 'success' && (
                <Badge className="bg-emerald-500/20 text-emerald-300 text-[10px]">Verified</Badge>
              )}
            </div>

            <div className="bg-[#faf9f6] p-3 rounded-xl border border-white/15 mb-3">
              <img src={qrCodeUrl} alt="Payment QR Code" className="w-48 h-48 object-contain" />
            </div>

            <div className="flex items-center gap-2 w-full">
              <Button type="button" size="sm" variant="outline" onClick={handleCopyLink} className="flex-1 border-white/10 text-slate-200 hover:text-white text-xs h-9">
                <Copy className="w-3.5 h-3.5 mr-1.5" /> Copy Link
              </Button>
              {razorpayLink && (
                <a
                  href={razorpayLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-3 h-9 rounded-md border border-amber-500/30 text-amber-300 hover:bg-amber-500/15 text-xs font-semibold"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              <a
                href={qrCodeUrl}
                download={`payment-qr-${inquiry.leadId || inquiry.id.slice(0, 6)}.png`}
                className="inline-flex items-center justify-center px-3 h-9 rounded-md border border-white/10 text-slate-200 hover:bg-white/10 text-xs"
              >
                <Download className="w-3.5 h-3.5" />
              </a>
            </div>
            {showScanner && razorpayLink && (
              <p className="text-[11px] font-mono text-emerald-400 mt-2 break-all">{razorpayLink}</p>
            )}
          </Card>

          {/* Transaction Ledger History */}
          <Card className="bg-[#0F141C]/90 border border-white/10 p-5 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                <Receipt className="w-3.5 h-3.5 text-amber-400" />
                Ledger History ({ledgerEntries.length})
              </h4>
              <button onClick={loadLedger} className="text-slate-400 hover:text-white p-1">
                <RefreshCw className={cn('w-3.5 h-3.5', loadingLedger && 'animate-spin text-amber-400')} />
              </button>
            </div>

            {loadingLedger ? (
              <p className="text-xs text-slate-500 py-4 text-center">Loading ledger...</p>
            ) : ledgerEntries.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No payments or requests logged yet.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                {ledgerEntries.map((entry) => (
                  <div key={entry.id} className="p-3 rounded-lg bg-[#07090E] border border-white/10 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-emerald-400">
                        ₹{Number(entry.amount).toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">{entry.paymentId}</span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1">{entry.description || entry.orderId}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {new Date(entry.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
