import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Smartphone, 
  QrCode, 
  ShieldCheck, 
  MapPin, 
  Calendar, 
  User, 
  Info, 
  ArrowLeft,
  ChevronRight,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Loader2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { API_BASE_URL, SOCKET_URL } from '@/lib/api';
import { Logo } from '@/components/ui/Logo';
import SeoMeta from '@/components/SeoMeta';
import { io } from 'socket.io-client';

interface PaymentData {
  paymentId: string;
  amount: number;
  customerName: string;
  destination: string;
  duration: string;
  description: string;
  razorpayOrderId: string;
  razorpayKeyId: string;
  createdAt: string;
}

export default function PaymentRequest() {
  const { paymentId } = useParams<{ paymentId: string }>();
  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'failed'>('pending');
  const [isProcessing, setIsProcessing] = useState(false);

  // Load Razorpay Script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Fetch Payment Details
  useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    
    const fetchPaymentDetails = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/payments/request/${paymentId}`);
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Failed to fetch payment details');
        }
        const data = await response.json();
        setPaymentData(data);
      } catch (err: any) {
        console.error('[PaymentRequest] Fetch error:', err);
        setError(err.message || 'Payment request not found or expired.');
      } finally {
        setLoading(false);
      }
    };

    if (paymentId) {
      fetchPaymentDetails();
    }
  }, [paymentId]);

  // WebSocket Subscription for Real-time Updates
  useEffect(() => {
    if (!paymentId) return;

    const socket = io(SOCKET_URL);
    
    socket.emit('join-payment', paymentId);
    
    socket.on('payment-success', (data) => {
      console.log('[WebSocket] Payment confirmed:', data);
      setPaymentStatus('success');
      setIsProcessing(false);
    });

    socket.on('payment-failed', (data) => {
      console.error('[WebSocket] Payment failed:', data);
      setPaymentStatus('failed');
      setErrorMessage(data.reason || 'Transaction declined by issuer.');
      setIsProcessing(false);
    });

    return () => {
      socket.disconnect();
    };
  }, [paymentId]);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRazorpayPay = () => {
    if (!paymentData) return;
    setIsProcessing(true);
    
    const options = {
      key: paymentData.razorpayKeyId,
      amount: Math.round(paymentData.amount * 100),
      currency: 'INR',
      name: 'Kashmir Curators',
      description: paymentData.description || `Trip reservation payment - Kashmir Curators`,
      order_id: paymentData.razorpayOrderId,
      handler: function (response: any) {
        console.log('[Razorpay Success Callback]', response);
        setPaymentStatus('success');
        setIsProcessing(false);
      },
      prefill: {
        name: paymentData.customerName,
      },
      theme: {
        color: '#D4AF37' // premium gold
      },
      modal: {
        ondismiss: function() {
          console.log('[Razorpay Modal Closed]');
          setIsProcessing(false);
        }
      }
    };

    try {
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error('Failed to open Razorpay modal:', err);
      setError('Failed to load Razorpay library. Please reload the page.');
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#05080a] flex flex-col items-center justify-center p-6 text-white">
        <div className="relative w-24 h-24 mb-6">
          <div className="absolute inset-0 rounded-full border-2 border-white/5" />
          <div className="absolute inset-0 rounded-full border-t-2 border-kashmir-gold animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center text-xs font-black tracking-widest text-kashmir-gold">KC</div>
        </div>
        <p className="text-sm font-bold uppercase tracking-widest text-white/40 animate-pulse">Establishing Secure Connection...</p>
      </div>
    );
  }

  if (error || !paymentData) {
    return (
      <div className="min-h-screen bg-[#05080a] flex flex-col items-center justify-center p-6 text-white text-center">
        <Card className="bg-red-500/5 border-red-500/20 max-w-md p-8 rounded-[2rem] backdrop-blur-2xl">
          <CardContent className="space-y-6 pt-6">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-400">
              <Info className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-bold text-white uppercase tracking-tight">Payment Link Expired</h1>
              <p className="text-sm text-white/40 leading-relaxed">
                {error || 'This payment link is invalid, expired, or has already been completed.'}
              </p>
            </div>
            <Link to="/" className="block">
              <Button className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl h-12">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Homepage
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05080a] text-white flex flex-col relative overflow-hidden">
      <SeoMeta 
        title={`Secure Checkout - Kashmir Curators`}
        description={`Secure payment portal for client ${paymentData.customerName}`}
      />

      {/* Decorative Orbs */}
      <div className="absolute top-0 left-0 w-80 h-80 bg-kashmir-gold/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-[130px] pointer-events-none" />

      {/* Header */}
      <header className="p-6 md:p-8 flex justify-between items-center max-w-5xl mx-auto w-full border-b border-white/5 relative z-10">
        <Link to="/" className="flex items-center gap-2 scale-90 md:scale-100 origin-left">
          <Logo />
        </Link>
        <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex gap-2">
          <ShieldCheck className="w-3.5 h-3.5" /> 256-Bit SSL Secured
        </Badge>
      </header>

      {/* Main Grid */}
      <main className="flex-1 flex items-center justify-center py-12 px-6 relative z-10 w-full max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full items-stretch">
          
          {/* Left Panel: Invoice Details */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                <Sparkles className="w-3.5 h-3.5 text-kashmir-gold animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/50">Elite Expedition Reservation</span>
              </div>
              
              <h2 className="text-3xl md:text-5xl font-display font-black text-white tracking-tight uppercase leading-tight">
                Secure Booking <br />
                <span className="text-kashmir-gold italic">Checkout</span>
              </h2>

              <p className="text-white/40 text-sm md:text-base max-w-md leading-relaxed font-medium">
                Verify your expedition details below and complete your transaction. Your booking will be instantly locked in real-time.
              </p>
            </div>

            {/* Invoice Card */}
            <Card className="bg-white/[0.01] border-white/5 rounded-[2rem] p-6 md:p-8 backdrop-blur-2xl relative overflow-hidden shadow-2xl mt-4">
              <div className="absolute inset-0 bg-gradient-to-br from-kashmir-gold/[0.02] to-transparent pointer-events-none" />
              <div className="space-y-6">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/20 block mb-1">Payable Amount</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-kashmir-gold mr-0.5">₹</span>
                    <span className="text-4xl md:text-5xl font-display font-black text-white">{paymentData.amount.toLocaleString('en-IN')}</span>
                    <span className="text-xs text-white/30 ml-2 font-bold uppercase tracking-widest">INR</span>
                  </div>
                </div>

                <div className="border-t border-white/5 pt-6 grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/20 flex gap-1.5 items-center"><User className="w-3 h-3 text-kashmir-gold" /> Guest Name</span>
                    <p className="text-xs font-bold text-white uppercase truncate">{paymentData.customerName}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/20 flex gap-1.5 items-center"><MapPin className="w-3 h-3 text-kashmir-gold" /> Expedition</span>
                    <p className="text-xs font-bold text-white uppercase truncate">{paymentData.destination}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/20 flex gap-1.5 items-center"><Calendar className="w-3 h-3 text-kashmir-gold" /> Duration</span>
                    <p className="text-xs font-bold text-white uppercase truncate">{paymentData.duration}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/20 flex gap-1.5 items-center"><Info className="w-3 h-3 text-kashmir-gold" /> Transaction Reference</span>
                    <p className="text-[10px] font-mono font-bold text-white/60 truncate">{paymentData.paymentId}</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Panel: Razorpay Integration Card */}
          <div className="lg:col-span-5">
            {paymentStatus === 'pending' && (
              <Card className="bg-[#070b0d] border border-white/5 rounded-[2.5rem] p-6 md:p-8 flex flex-col justify-between items-center h-full shadow-2xl relative overflow-hidden group">
                <div className="absolute top-[-10%] right-[-10%] w-32 h-32 bg-kashmir-gold/10 blur-[60px] rounded-full pointer-events-none" />
                
                <div className="w-full text-center space-y-2 mb-6">
                  <h3 className="text-white font-bold text-lg">Instant Payment Checkout</h3>
                  <p className="text-white/40 text-[10px] tracking-wider uppercase font-black">Secured by Razorpay Gateway</p>
                </div>

                <div className="w-full flex-1 flex flex-col items-center justify-center py-6 text-center space-y-6">
                  <div className="w-24 h-24 rounded-3xl bg-kashmir-gold/10 border border-kashmir-gold/20 flex items-center justify-center mx-auto mb-2 relative">
                    <div className="absolute inset-0 bg-kashmir-gold/10 blur-xl rounded-full scale-75 animate-pulse" />
                    <ShieldCheck className="w-12 h-12 text-kashmir-gold relative z-10" />
                  </div>
                  
                  <div className="space-y-2 max-w-xs">
                    <h4 className="text-white font-bold text-sm">Official payment channel</h4>
                    <p className="text-xs text-white/40 leading-relaxed font-medium">
                      All major credit/debit cards, UPI apps (GPay, PhonePe, Paytm), netbanking, and secure wallets are supported.
                    </p>
                  </div>

                  <Button 
                    onClick={handleRazorpayPay}
                    disabled={isProcessing}
                    className="w-full bg-kashmir-gold text-black hover:bg-white hover:text-black font-black uppercase tracking-widest text-xs h-14 rounded-2xl shadow-xl shadow-kashmir-gold/10 gap-2 transition-all duration-300 disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Initializing Gateway...
                      </>
                    ) : (
                      <>
                        Pay Securely with Razorpay <ExternalLink className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </div>

                {/* Brands / Security Logos */}
                <div className="w-full border-t border-white/5 pt-6 mt-6">
                  <div className="flex items-center justify-center gap-5 grayscale opacity-30">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo.png" alt="UPI" className="h-3.5" />
                    <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/Google_Pay_Logo.svg" alt="GPay" className="h-3.5" />
                    <img src="https://upload.wikimedia.org/wikipedia/commons/2/24/Paytm_Logo_%28standalone%29.svg" alt="Paytm" className="h-3.5" />
                  </div>
                </div>
              </Card>
            )}

            {paymentStatus === 'success' && (
              <Card className="bg-[#070b0d] border border-emerald-500/20 rounded-[2.5rem] p-6 md:p-8 flex flex-col justify-between items-center h-full shadow-2xl relative overflow-hidden group animate-in fade-in zoom-in-95 duration-500">
                <div className="absolute inset-0 bg-emerald-500/[0.02] pointer-events-none" />
                <div className="absolute top-[-10%] right-[-10%] w-32 h-32 bg-emerald-500/10 blur-[60px] rounded-full pointer-events-none" />
                
                <div className="w-full text-center space-y-2 mb-6">
                  <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
                    Verification Complete
                  </Badge>
                </div>

                <div className="w-full flex-1 flex flex-col items-center justify-center py-6 text-center space-y-6">
                  <div className="w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-2 relative">
                    <div className="absolute inset-0 bg-emerald-500/15 blur-xl rounded-full scale-90 animate-pulse" />
                    <CheckCircle2 className="w-12 h-12 text-emerald-400 relative z-10" />
                  </div>
                  
                  <div className="space-y-2 max-w-xs">
                    <h3 className="text-white font-bold text-xl uppercase tracking-tight">Payment Captured</h3>
                    <p className="text-xs text-white/50 leading-relaxed font-medium">
                      Thank you! Your deposit of <span className="text-emerald-400 font-bold">₹{paymentData.amount.toLocaleString('en-IN')}</span> has been securely processed and reconciled.
                    </p>
                  </div>

                  <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 w-full text-left space-y-2">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-white/30 font-bold uppercase">Booking ID</span>
                      <span className="text-white/70 font-mono font-bold truncate max-w-[150px]">{paymentData.paymentId}</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-white/30 font-bold uppercase">Status</span>
                      <span className="text-emerald-400 font-black uppercase tracking-wider">SUCCESS / CONFIRMED</span>
                    </div>
                  </div>

                  <Link to="/" className="w-full">
                    <Button className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold h-12 rounded-xl">
                      Back to Homepage
                    </Button>
                  </Link>
                </div>

                <div className="w-full border-t border-white/5 pt-6 mt-6 text-center">
                  <p className="text-[9px] text-white/30 uppercase tracking-widest font-black">A receipt was sent to your phone</p>
                </div>
              </Card>
            )}

            {paymentStatus === 'failed' && (
              <Card className="bg-[#070b0d] border border-red-500/20 rounded-[2.5rem] p-6 md:p-8 flex flex-col justify-between items-center h-full shadow-2xl relative overflow-hidden group animate-in fade-in zoom-in-95 duration-500">
                <div className="absolute inset-0 bg-red-500/[0.01] pointer-events-none" />
                <div className="absolute top-[-10%] right-[-10%] w-32 h-32 bg-red-500/10 blur-[60px] rounded-full pointer-events-none" />
                
                <div className="w-full text-center space-y-2 mb-6">
                  <Badge className="bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
                    Transaction Declined
                  </Badge>
                </div>

                <div className="w-full flex-1 flex flex-col items-center justify-center py-6 text-center space-y-6">
                  <div className="w-24 h-24 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-2 relative">
                    <XCircle className="w-12 h-12 text-red-400 relative z-10" />
                  </div>
                  
                  <div className="space-y-2 max-w-xs">
                    <h3 className="text-white font-bold text-xl uppercase tracking-tight">Payment Declined</h3>
                    <p className="text-xs text-white/50 leading-relaxed font-medium">
                      {errorMessage || 'The payment gateway could not process this transaction. Please verify details and try again.'}
                    </p>
                  </div>

                  <Button 
                    onClick={() => {
                      setPaymentStatus('pending');
                      setErrorMessage(null);
                    }}
                    className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold h-12 rounded-xl"
                  >
                    Retry Transaction
                  </Button>
                </div>

                <div className="w-full border-t border-white/5 pt-6 mt-6 text-center">
                  <p className="text-[9px] text-white/30 uppercase tracking-widest font-black">Support Reference: {paymentData.paymentId}</p>
                </div>
              </Card>
            )}
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-[10px] text-white/30 font-bold uppercase tracking-widest border-t border-white/5 relative z-10">
        © {new Date().getFullYear()} The Kashmir Curators Private Limited • All Rights Reserved
      </footer>

    </div>
  );
}
