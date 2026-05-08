import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Loader2, CreditCard, Shield, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

type PaymentStatus = 'idle' | 'processing' | 'success' | 'failed' | 'pending';

interface PaymentSimulatorProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  itemName: string;
  onSuccess: () => void;
  onFailure?: () => void;
}

export default function PaymentSimulator({
  isOpen,
  onClose,
  amount,
  itemName,
  onSuccess,
  onFailure,
}: PaymentSimulatorProps) {
  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');

  useEffect(() => {
    if (isOpen) {
      setStatus('idle');
      setCardNumber('');
      setExpiry('');
      setCvv('');
      setCardName('');
    }
  }, [isOpen]);

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/.{1,4}/g);
    return match ? match.join(' ') : cleaned;
  };

  const formatExpiry = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
    }
    return cleaned;
  };

  const simulatePayment = async () => {
    if (!cardNumber || !expiry || !cvv || !cardName) return;

    setStatus('processing');
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate different outcomes based on card number ending
    const lastDigit = cardNumber.replace(/\D/g, '').slice(-1);
    
    if (lastDigit === '1') {
      // Card ending in 1 = failed
      setStatus('failed');
      await new Promise(resolve => setTimeout(resolve, 2000));
      onFailure?.();
    } else if (lastDigit === '2') {
      // Card ending in 2 = pending
      setStatus('pending');
    } else {
      // All other cards = success
      setStatus('success');
      await new Promise(resolve => setTimeout(resolve, 1500));
      onSuccess();
    }
  };

  const handleRetry = () => {
    setStatus('idle');
  };

  const renderContent = () => {
    switch (status) {
      case 'processing':
        return (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
            </div>
            <h3 className="font-display text-2xl font-semibold mb-2">Processing Payment</h3>
            <p className="text-muted-foreground">Please wait while we process your payment...</p>
            <div className="mt-6 flex justify-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        );

      case 'success':
        return (
          <div className="text-center py-12 animate-fade-up">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h3 className="font-display text-2xl font-semibold mb-2 text-green-600">Payment Successful!</h3>
            <p className="text-muted-foreground mb-4">Your booking has been confirmed.</p>
            <div className="bg-muted rounded-lg p-4 inline-block">
              <p className="text-sm text-muted-foreground">Amount Paid</p>
              <p className="text-2xl font-bold text-primary">₹{amount.toLocaleString()}</p>
            </div>
          </div>
        );

      case 'failed':
        return (
          <div className="text-center py-12 animate-fade-up">
            <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="h-10 w-10 text-destructive" />
            </div>
            <h3 className="font-display text-2xl font-semibold mb-2 text-destructive">Payment Failed</h3>
            <p className="text-muted-foreground mb-6">
              Your payment could not be processed. Please try again or use a different card.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button variant="gold" onClick={handleRetry}>
                Try Again
              </Button>
            </div>
          </div>
        );

      case 'pending':
        return (
          <div className="text-center py-12 animate-fade-up">
            <div className="w-20 h-20 bg-kashmir-gold/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="h-10 w-10 text-kashmir-earth" />
            </div>
            <h3 className="font-display text-2xl font-semibold mb-2 text-kashmir-earth">Payment Pending</h3>
            <p className="text-muted-foreground mb-4">
              Your payment is being verified. We'll update you within 24 hours.
            </p>
            <div className="bg-kashmir-gold/10 border border-kashmir-gold/30 rounded-lg p-4 text-sm">
              <p className="text-kashmir-earth">
                You'll receive a confirmation email once the payment is verified.
              </p>
            </div>
            <Button variant="gold" className="mt-6" onClick={onClose}>
              Got it
            </Button>
          </div>
        );

      default:
        return (
          <>
            <div className="space-y-6">
              {/* Amount Summary */}
              <div className="bg-muted rounded-xl p-4">
                <p className="text-sm text-muted-foreground mb-1">Paying for</p>
                <p className="font-semibold">{itemName}</p>
                <p className="text-2xl font-bold text-primary mt-2">₹{amount.toLocaleString()}</p>
              </div>

              {/* Card Form */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Card Number</label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      placeholder="1234 5678 9012 3456"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      maxLength={19}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Cardholder Name</label>
                  <Input
                    placeholder="John Doe"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Expiry</label>
                    <Input
                      placeholder="MM/YY"
                      value={expiry}
                      onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                      maxLength={5}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">CVV</label>
                    <Input
                      type="password"
                      placeholder="•••"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                      maxLength={3}
                    />
                  </div>
                </div>
              </div>

              {/* Test Cards Info */}
              <div className="bg-muted/50 border rounded-lg p-4 text-xs">
                <p className="font-medium mb-2">Test Card Numbers:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• End with <span className="font-mono text-foreground">0</span> or <span className="font-mono text-foreground">3-9</span> → Success</li>
                  <li>• End with <span className="font-mono text-foreground">1</span> → Failed</li>
                  <li>• End with <span className="font-mono text-foreground">2</span> → Pending</li>
                </ul>
              </div>

              <Button
                variant="gold"
                size="lg"
                className="w-full"
                onClick={simulatePayment}
                disabled={!cardNumber || !expiry || !cvv || !cardName}
              >
                Pay ₹{amount.toLocaleString()}
              </Button>

              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span>Secured by 256-bit encryption</span>
              </div>
            </div>
          </>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {status === 'idle' && 'Complete Payment'}
            {status === 'processing' && 'Processing...'}
            {status === 'success' && 'Success!'}
            {status === 'failed' && 'Payment Failed'}
            {status === 'pending' && 'Payment Pending'}
          </DialogTitle>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
