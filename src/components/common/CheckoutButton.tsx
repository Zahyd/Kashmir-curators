import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useRazorpay } from '@/hooks/useRazorpay';
import { toast } from 'sonner';
import { CreditCard, Loader2 } from 'lucide-react';

interface CheckoutButtonProps {
  amount: number;
  orderId: string;
  bookingId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  onSuccess?: (response: any) => void;
  onFailure?: (error: any) => void;
  className?: string;
  children?: React.ReactNode;
}

export function CheckoutButton({
  amount,
  orderId,
  bookingId,
  customerName = 'Valued Guest',
  customerEmail = '',
  customerPhone = '',
  onSuccess,
  onFailure,
  className = '',
  children
}: CheckoutButtonProps) {
  const isRazorpayLoaded = useRazorpay();
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = () => {
    if (!isRazorpayLoaded) {
      toast.error('Payment system is still loading. Please try again in a moment.');
      return;
    }

    if (!orderId || !amount) {
      toast.error('Invalid order details. Cannot proceed to payment.');
      return;
    }

    setIsProcessing(true);

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_kashmir_mock', // Use test key fallback
      amount: amount * 100, // Razorpay expects paise
      currency: 'INR',
      name: 'The Kashmir Curators',
      description: 'Luxury Travel Package Booking',
      image: '/favicon.png',
      order_id: orderId,
      notes: {
        bookingId: bookingId || '',
      },
      prefill: {
        name: customerName,
        email: customerEmail,
        contact: customerPhone,
      },
      theme: {
        color: '#b5852a', // The Kashmir Curators gold accent color
      },
      handler: function (response: any) {
        setIsProcessing(false);
        toast.success('Payment verified successfully!');
        if (onSuccess) onSuccess(response);
      },
    };

    const rzp = new window.Razorpay(options);

    rzp.on('payment.failed', function (response: any) {
      setIsProcessing(false);
      console.error('Payment failed:', response.error);
      toast.error(`Payment Failed: ${response.error.description}`);
      if (onFailure) onFailure(response.error);
    });

    rzp.open();
  };

  return (
    <Button
      onClick={handlePayment}
      disabled={!isRazorpayLoaded || isProcessing}
      className={`bg-[#b5852a] hover:bg-[#a07424] text-white font-medium ${className}`}
    >
      {isProcessing ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Processing Securely...
        </>
      ) : (
        <>
          <CreditCard className="w-4 h-4 mr-2" />
          {children || `Pay Securely (₹${amount.toLocaleString()})`}
        </>
      )}
    </Button>
  );
}
