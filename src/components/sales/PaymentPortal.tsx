import React, { useState } from 'react';
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
  Info,
  XCircle,
  Loader2
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { API_BASE_URL } from '@/lib/api';
import { useTeamAuth } from '@/contexts/TeamAuthContext';

interface PaymentPortalProps {
  inquiry: any;
  onBack: () => void;
}

export default function PaymentPortal({ inquiry, onBack }: PaymentPortalProps) {
  if (!inquiry) return null;
  const [amount, setAmount] = useState<string>('0');
  const [paymentType, setPaymentType] = useState<'deposit' | 'full'>('deposit');
  const [transactionId, setTransactionId] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [razorpayLink, setRazorpayLink] = useState('');
  const [isGeneratingScanner, setIsGeneratingScanner] = useState(false);
  const { systemEvents } = useTeamAuth();
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'failed'>('pending');

  React.useEffect(() => {
    const latestEvent = systemEvents[0];
    if (latestEvent) {
      const isMatch = 
        (latestEvent.booking && String(latestEvent.booking.id) === String(inquiry.id)) ||
        latestEvent.message.includes(inquiry.id) ||
        (latestEvent.message.toLowerCase().includes('payment') && latestEvent.message.toLowerCase().includes(inquiry.customerName.toLowerCase()));
      
      if (isMatch) {
        if (latestEvent.message.toLowerCase().includes('failed')) {
          setPaymentStatus('failed');
          toast.error("Payment failed: " + latestEvent.message);
        } else {
          setPaymentStatus('success');
          toast.success("Payment confirmed! Booking locked.");
        }
      }
    }
  }, [systemEvents, inquiry]);

  const [businessVPA, setBusinessVPA] = useState<string>("thekashmircurators@okaxis");
  const [merchantName, setMerchantName] = useState<string>("The Kashmir Curators");

  // Load configuration from database
  React.useEffect(() => {
    const fetchPaymentSettings = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/site-content`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (data.paymentSettings && data.paymentSettings.content && data.paymentSettings.content.methods) {
          const methods = data.paymentSettings.content.methods;
          const primaryUPI = methods.find((m: any) => m.type === 'upi' && m.isActive && m.isPrimary);
          if (primaryUPI) {
            setBusinessVPA(primaryUPI.identifier);
            // Use method name or provider as payee name (e.g. "Kashmir Curators")
            setMerchantName(primaryUPI.name || primaryUPI.provider || "The Kashmir Curators");
          }
        }
      } catch (err) {
        console.warn("Failed to load dynamic payment settings, using defaults:", err);
      }
    };
    fetchPaymentSettings();
  }, []);

  const generateUPILink = () => {
    const encodedName = encodeURIComponent(merchantName);
    const shortId = inquiry.id.includes('-') ? `KC-${inquiry.id.split('-')[0].toUpperCase()}` : `KC-${inquiry.id.substring(0, 8).toUpperCase()}`;
    const encodedNote = encodeURIComponent(`Booking for ${shortId}`);
    return `upi://pay?pa=${businessVPA}&pn=${encodedName}&am=${amount}&cu=INR&tn=${encodedNote}`;
  };

  const qrCodeUrl = razorpayLink 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(razorpayLink)}&bgcolor=faf9f6&color=0a0f12&margin=20`
    : `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(generateUPILink())}&bgcolor=faf9f6&color=0a0f12&margin=20`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(razorpayLink || generateUPILink());
    toast.success(razorpayLink ? "Razorpay Link copied to clipboard" : "UPI Link copied to clipboard");
  };

  const handleGenerateScanner = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount first");
      return;
    }

    setIsGeneratingScanner(true);
    const toastId = toast.loading('Generating secure Razorpay payment scanner...');
    try {
      const token = localStorage.getItem('teamToken') || localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/payments/razorpay/create-payment-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          inquiryId: inquiry.id,
          amount: parseFloat(amount),
          customerEmail: inquiry.email
        })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate Razorpay link');
      }

      setRazorpayLink(data.sessionUrl);
      setShowScanner(true);
      toast.success('Razorpay payment scanner generated successfully!', { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to generate scanner: ' + err.message, { id: toastId });
    } finally {
      setIsGeneratingScanner(false);
    }
  };

  const handleVerifyPayment = () => {
    if (!transactionId) {
      toast.error("Please enter Transaction ID / UTR No.");
      return;
    }
    setIsVerifying(true);
    // Mock verification
    setTimeout(() => {
      setIsVerifying(false);
      toast.success("Payment request submitted for verification");
      onBack();
    }, 1500);
  };

  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);

  const handleSendWhatsApp = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount first");
      return;
    }
    setIsSendingWhatsApp(true);
    try {
      if (razorpayLink) {
        const text = `Hi ${inquiry.customerName},\n\nPlease make the payment of ₹${Number(amount).toLocaleString()} using this secure Razorpay link:\n\n${razorpayLink}\n\nThank you!\n- Kashmir Curators`;
        window.open(`https://api.whatsapp.com/send?phone=${inquiry.phone}&text=${encodeURIComponent(text)}`, '_blank');
        toast.success("WhatsApp message window opened");
        return;
      }

      const token = localStorage.getItem('teamToken') || localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/payments/send-whatsapp-scanner`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          inquiryId: inquiry.id,
          phone: inquiry.phone,
          amount: parseFloat(amount)
        })
      });

      if (!response.ok) {
        throw new Error("Failed to send WhatsApp payment request");
      }

      const resData = await response.json();
      toast.success(`Payment request sent on WhatsApp! ID: ${resData.paymentId}`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to send payment request via WhatsApp");
    } finally {
      setIsSendingWhatsApp(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-700 max-w-5xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 px-4 md:px-0">
        <div className="flex items-center gap-4 md:gap-6">
          <Button 
            onClick={onBack}
            variant="ghost" 
            className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-kashmir-gold text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] mb-1">
              <CreditCard className="w-3 h-3" /> Payment Portal
            </div>
            <h2 className="text-2xl md:text-3xl font-display font-bold text-white tracking-tight truncate">Collect Payment</h2>
          </div>
        </div>
        <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-4 py-2 rounded-xl text-xs font-bold flex gap-2 w-fit">
          <ShieldCheck className="w-4 h-4" /> Secure Gateway Active
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        {/* Left Column: Configuration */}
        <div className="lg:col-span-3 space-y-8">
          <Card className="bg-white/[0.03] border-white/5 p-6 md:p-10 rounded-[2.5rem] backdrop-blur-2xl">
            <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-kashmir-gold/10 text-kashmir-gold flex items-center justify-center text-sm">1</span>
              Configure Request
            </h3>

            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => setPaymentType('deposit')}
                  className={cn(
                    "p-5 md:p-6 rounded-3xl border transition-all text-left group",
                    paymentType === 'deposit' 
                      ? "bg-kashmir-gold/10 border-kashmir-gold/40 text-kashmir-gold" 
                      : "bg-white/5 border-white/5 text-white/40 hover:border-white/10"
                  )}
                >
                  <div className="flex justify-between items-start mb-4">
                    <CreditCard className={cn("w-6 h-6", paymentType === 'deposit' ? "text-kashmir-gold" : "text-white/20")} />
                    {paymentType === 'deposit' && <CheckCircle2 className="w-5 h-5" />}
                  </div>
                  <p className="font-bold text-base mb-1">Booking Deposit</p>
                  <p className="text-[10px] uppercase tracking-wider opacity-60">25% Security Amount</p>
                </button>

                <button
                  onClick={() => setPaymentType('full')}
                  className={cn(
                    "p-5 md:p-6 rounded-3xl border transition-all text-left group",
                    paymentType === 'full' 
                      ? "bg-purple-500/10 border-purple-500/40 text-purple-400" 
                      : "bg-white/5 border-white/5 text-white/40 hover:border-white/10"
                  )}
                >
                  <div className="flex justify-between items-start mb-4">
                    <IndianRupee className={cn("w-6 h-6", paymentType === 'full' ? "text-purple-400" : "text-white/20")} />
                    {paymentType === 'full' && <CheckCircle2 className="w-5 h-5" />}
                  </div>
                  <p className="font-bold text-base mb-1">Full Payment</p>
                  <p className="text-[10px] uppercase tracking-wider opacity-60">100% Package Total</p>
                </button>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-1">Payment Amount (INR)</label>
                <div className="relative group">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-kashmir-gold font-bold text-xl">₹</span>
                  <Input 
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-12 bg-white/5 border-white/5 h-16 rounded-2xl text-2xl font-display font-bold text-white focus:bg-white/10 focus:border-kashmir-gold/30 transition-all"
                    placeholder="Enter amount..."
                  />
                </div>
                <div className="flex items-center gap-2 text-[10px] text-white/20 px-2 mt-2">
                  <Info className="w-3 h-3" /> Recommended deposit for {inquiry.budget}: ₹25,000
                </div>
              </div>

              <div className="pt-6 border-t border-white/5">
                <Button 
                  onClick={handleGenerateScanner}
                  disabled={isGeneratingScanner || !amount || parseFloat(amount) <= 0}
                  className="w-full bg-kashmir-gold text-black hover:bg-amber-500 h-16 rounded-2xl font-black uppercase tracking-widest text-xs gap-3 shadow-xl shadow-kashmir-gold/10 border-none"
                >
                  {isGeneratingScanner ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <QrCode className="w-5 h-5" />}
                  Generate Payment Scanner
                </Button>
              </div>
            </div>
          </Card>

          <Card className="bg-white/[0.03] border-white/5 p-6 md:p-10 rounded-[2.5rem] backdrop-blur-2xl">
            <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center text-sm">2</span>
              Manual Verification
            </h3>
            
            <div className="space-y-6">
              <p className="text-sm text-white/40 leading-relaxed">
                If the client has already paid via bank transfer or direct VPA, enter the transaction details below to reconcile.
              </p>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-1">Transaction ID / UTR No.</label>
                <Input 
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  className="bg-white/5 border-white/5 h-12 rounded-xl text-white font-mono focus:border-blue-400/30"
                  placeholder="TXN-1234567890"
                />
              </div>
              <Button 
                onClick={handleVerifyPayment}
                disabled={isVerifying}
                variant="outline"
                className="w-full border-white/10 text-white hover:bg-white/10 h-12 rounded-xl font-bold gap-2"
              >
                {isVerifying ? <span className="animate-pulse">Processing...</span> : "Verify & Mark as Paid"}
              </Button>
            </div>
          </Card>
        </div>

        {/* Right Column: Preview / Scanner */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="bg-[#0a0f12] border-white/5 overflow-hidden rounded-[2.5rem] sticky top-32">
            <div className="bg-gradient-to-br from-kashmir-gold/20 via-transparent to-transparent p-10 text-center relative overflow-hidden">
              <div className="absolute top-[-10%] right-[-10%] w-32 h-32 bg-kashmir-gold/20 blur-[60px] rounded-full" />
              
              <div className="relative z-10 space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6">
                  <Smartphone className="w-8 h-8 text-kashmir-gold" />
                </div>
                <h4 className="text-white font-bold text-lg">Instant Payment Scanner</h4>
                <p className="text-white/40 text-xs tracking-wider uppercase font-medium">Scan with any UPI App</p>
              </div>
            </div>

            <div className="p-10 flex flex-col items-center">
              {paymentStatus === 'success' ? (
                <div className="py-16 text-center animate-in zoom-in-95 duration-500 flex flex-col items-center">
                  <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 text-emerald-400">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <p className="text-lg font-bold text-white uppercase tracking-widest">Payment Captured</p>
                  <p className="text-emerald-400 font-display font-bold text-2xl mt-2">₹{parseInt(amount || '0').toLocaleString()} Received</p>
                  <p className="text-xs text-white/40 mt-4 max-w-[220px]">
                    The system has auto-confirmed the reservations. You can return to the leads panel.
                  </p>
                  <Button 
                    onClick={onBack}
                    className="mt-8 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl px-6 h-10 text-xs font-bold border-none"
                  >
                    Return to Pipeline
                  </Button>
                </div>
              ) : paymentStatus === 'failed' ? (
                <div className="py-16 text-center animate-in zoom-in-95 duration-500 flex flex-col items-center">
                  <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6 text-red-500">
                    <XCircle className="w-10 h-10" />
                  </div>
                  <p className="text-lg font-bold text-white uppercase tracking-widest">Payment Failed</p>
                  <p className="text-red-400 text-xs mt-3 max-w-[200px]">
                    An issue occurred while processing the customer's transfer. Please try generating a new scanner request.
                  </p>
                  <Button 
                    onClick={() => setPaymentStatus('pending')}
                    className="mt-8 bg-red-500 text-black hover:bg-red-600 rounded-xl px-6 h-10 text-xs font-bold border-none"
                  >
                    Retry Scanner
                  </Button>
                </div>
              ) : showScanner && amount && parseInt(amount) > 0 ? (
                <div className="space-y-8 w-full">
                  <div className="p-6 bg-white rounded-3xl shadow-2xl relative group">
                    <img 
                      src={qrCodeUrl} 
                      alt="Payment QR Code" 
                      className="w-full aspect-square object-contain"
                    />
                    <div className="absolute inset-0 bg-white/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all backdrop-blur-[2px] rounded-3xl">
                      <Button variant="outline" className="bg-white border-black/10 text-black rounded-full gap-2 font-bold shadow-xl">
                        <Download className="w-4 h-4" /> Download QR
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="p-5 rounded-2xl bg-white/5 border border-white/5">
                      <p className="text-[10px] uppercase font-bold text-white/20 mb-1">Payable Amount</p>
                      <p className="text-2xl font-display font-bold text-white">₹{parseInt(amount).toLocaleString()}</p>
                    </div>
                    
                    <div className="flex gap-3">
                      <Button 
                        onClick={handleCopyLink}
                        variant="ghost" 
                        className="flex-1 bg-white/5 border border-white/5 text-white/60 hover:text-white rounded-xl h-12 gap-2 text-xs font-bold"
                      >
                        <Copy className="w-4 h-4" /> Copy UPI
                      </Button>
                      <Button 
                        onClick={handleSendWhatsApp}
                        disabled={isSendingWhatsApp}
                        variant="ghost"
                        className="flex-1 bg-white/5 border border-white/5 text-white/60 hover:text-white rounded-xl h-12 gap-2 text-xs font-bold"
                      >
                        {isSendingWhatsApp ? (
                          <span className="animate-pulse">Sending...</span>
                        ) : (
                          <>
                            <Send className="w-4 h-4 text-kashmir-gold" /> Send WhatsApp
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-20 text-center opacity-20 flex flex-col items-center">
                  <QrCode className="w-20 h-20 mb-6" />
                  <p className="text-sm font-bold uppercase tracking-widest">Scanner Locked</p>
                  <p className="text-[10px] mt-2 italic max-w-[150px]">Enter amount and click generate to unlock</p>
                </div>
              )}
            </div>

            <div className="px-10 pb-10">
              <div className="flex items-center justify-center gap-6 grayscale opacity-30 pt-6 border-t border-white/5">
                <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo.png" alt="UPI" className="h-4" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/Google_Pay_Logo.svg" alt="GPay" className="h-4" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/2/24/Paytm_Logo_%28standalone%29.svg" alt="Paytm" className="h-4" />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
