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
  ExternalLink
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { API_BASE_URL } from '@/lib/api';
import { Logo } from '@/components/ui/Logo';
import SeoMeta from '@/components/SeoMeta';

interface PaymentData {
  paymentId: string;
  amount: number;
  customerName: string;
  destination: string;
  duration: string;
  description: string;
  upiLink: string;
  qrCodeUrl: string;
  createdAt: string;
}

export default function PaymentRequest() {
  const { paymentId } = useParams<{ paymentId: string }>();
  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

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
    <div className="min-h-screen bg-[#05080a] text-white flex flex-col">
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

          {/* Right Panel: Payment Scanner / deep links */}
          <div className="lg:col-span-5">
            <Card className="bg-[#070b0d] border border-white/5 rounded-[2.5rem] p-6 md:p-8 flex flex-col justify-between items-center h-full shadow-2xl relative overflow-hidden group">
              <div className="absolute top-[-10%] right-[-10%] w-32 h-32 bg-kashmir-gold/10 blur-[60px] rounded-full pointer-events-none" />
              
              <div className="w-full text-center space-y-2 mb-6">
                <h3 className="text-white font-bold text-lg">Instant Payment Scanner</h3>
                <p className="text-white/40 text-[10px] tracking-wider uppercase font-black">Scan with any UPI App</p>
              </div>

              {/* QR / Direct Redirect Logic */}
              <div className="w-full flex-1 flex flex-col items-center justify-center py-6">
                {isMobile ? (
                  /* Mobile Deep Link Redirect UI */
                  <div className="w-full space-y-6 text-center">
                    <div className="w-20 h-20 rounded-3xl bg-kashmir-gold/10 border border-kashmir-gold/20 flex items-center justify-center mx-auto mb-2 animate-bounce-slow">
                      <Smartphone className="w-10 h-10 text-kashmir-gold" />
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-xs text-white/60 font-semibold max-w-xs mx-auto leading-relaxed">
                        Tap the button below to directly launch Google Pay or any other UPI app installed on your phone.
                      </p>
                    </div>

                    <a href={paymentData.upiLink} className="block w-full">
                      <Button className="w-full bg-kashmir-gold text-black hover:bg-white hover:text-black font-black uppercase tracking-widest text-xs h-14 rounded-2xl shadow-xl shadow-kashmir-gold/10 gap-2 transition-all">
                        Pay with Google Pay / UPI <ExternalLink className="w-4 h-4" />
                      </Button>
                    </a>

                    <div className="border-t border-white/5 pt-4">
                      <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mb-3">Or Show Payment QR</p>
                      <button 
                        onClick={() => setIsMobile(false)}
                        className="text-[10px] text-kashmir-gold hover:underline font-bold uppercase tracking-widest flex items-center gap-1.5 mx-auto"
                      >
                        <QrCode className="w-3.5 h-3.5" /> Show QR Code Instead
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Desktop QR Code UI */
                  <div className="space-y-6 w-full flex flex-col items-center">
                    <div className="p-4 bg-white rounded-[2rem] shadow-2xl relative max-w-[280px] aspect-square flex items-center justify-center group border border-white/10">
                      <img 
                        src={paymentData.qrCodeUrl} 
                        alt="Payment QR Code" 
                        className="w-full h-full object-contain rounded-2xl"
                      />
                    </div>
                    <p className="text-white/40 text-[10px] text-center font-semibold max-w-[200px] leading-relaxed">
                      Scan this QR code using Google Pay, PhonePe, Paytm, or any BHIM UPI application on your mobile phone to complete payment.
                    </p>
                    {/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) && (
                      <button 
                        onClick={() => setIsMobile(true)}
                        className="text-[10px] text-kashmir-gold hover:underline font-bold uppercase tracking-widest flex items-center gap-1.5"
                      >
                        <Smartphone className="w-3.5 h-3.5" /> Switch to Mobile App Pay
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* UPI Badges */}
              <div className="w-full border-t border-white/5 pt-6 mt-6">
                <div className="flex items-center justify-center gap-5 grayscale opacity-30">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo.png" alt="UPI" className="h-3.5" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/Google_Pay_Logo.svg" alt="GPay" className="h-3.5" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/2/24/Paytm_Logo_%28standalone%29.svg" alt="Paytm" className="h-3.5" />
                </div>
              </div>

            </Card>
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
