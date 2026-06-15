import { Request, Response } from 'express';
import crypto from 'crypto';
import prisma from '../lib/prisma';

export const handleRazorpayWebhook = async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'kashmir_connect_webhook_secret_2026';
    const isSimulation = req.headers['x-simulation-mode'] === 'true' && process.env.NODE_ENV === 'development';

    // 1. Verify cryptographic signature if not in development simulation mode
    if (!isSimulation) {
      if (!signature) {
        return res.status(400).json({ error: 'Signature header is missing' });
      }
      
      const rawBody = JSON.stringify(req.body);
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

      if (signature !== expectedSignature) {
        console.warn('Razorpay signature verification failed');
        return res.status(400).json({ error: 'Invalid webhook signature' });
      }
    } else {
      console.log('Running webhook in simulation mode...');
    }

    const { event, payload } = req.body;
    
    // Support custom or fallback fields for testing flexibility
    const paymentId = payload?.payment?.entity?.id || req.body.paymentId;
    const orderId = payload?.payment?.entity?.order_id || req.body.orderId || 'MOCK_ORDER_123';
    const rawAmount = payload?.payment?.entity?.amount || req.body.amount || 0;
    const amount = rawAmount / 100 || rawAmount; // Razorpay sends amount in paise
    const bookingId = req.body.bookingId || payload?.payment?.entity?.notes?.bookingId;

    if (!paymentId) {
      return res.status(400).json({ error: 'Missing paymentId in payload' });
    }

    // 2. Perform idempotency check in TransactionLedger
    const existingTx = await (prisma as any).transactionLedger.findUnique({
      where: { paymentId }
    });

    if (existingTx) {
      console.log(`Payment ID ${paymentId} already processed. Skipping duplicate hook.`);
      return res.status(200).json({ status: 'ignored', reason: 'already_processed' });
    }

    // 3. Find booking either via direct bookingId or fallback to scanning details
    let targetBooking = null;
    if (bookingId) {
      targetBooking = await prisma.booking.findUnique({ where: { id: bookingId } });
    } else {
      // Fallback search for any booking whose details contains the orderId or matching parameters
      const allBookings = await prisma.booking.findMany();
      targetBooking = allBookings.find(b => {
        try {
          const parsed = JSON.parse(b.details);
          return parsed.razorpayOrderId === orderId || b.id === orderId;
        } catch {
          return false;
        }
      }) || null;
    }

    if (!targetBooking) {
      // If no booking found, create a placeholder booking so the ledger isn't orphaned
      console.log(`No active booking found for orderId ${orderId}. Resolving ledger records...`);
      // Find a user to bind to or use a mock user ID
      const firstUser = await prisma.user.findFirst();
      if (!firstUser) {
        return res.status(400).json({ error: 'No user registered to bind orphan ledger' });
      }
      
      targetBooking = await prisma.booking.create({
        data: {
          userId: firstUser.id,
          type: 'package',
          itemName: `Unlinked Order - ${orderId}`,
          bookingDate: new Date(),
          totalAmount: amount,
          details: JSON.stringify({ razorpayOrderId: orderId }),
          status: 'pending'
        }
      });
    }

    // 4. Secure transaction ledger write and status synchronization in single atomic block
    const statusToSet = event === 'payment.failed' ? 'cancelled' : 'confirmed';
    const description = event === 'payment.failed' ? 'Razorpay payment failed hook' : 'Razorpay payment captured captured hook';
    const txType = event === 'payment.failed' ? 'DEBIT' : 'CREDIT';

    const result = await prisma.$transaction(async (tx) => {
      // Log transaction ledger record
      const ledgerEntry = await (tx as any).transactionLedger.create({
        data: {
          bookingId: targetBooking.id,
          amount,
          type: txType,
          paymentId,
          orderId,
          description
        }
      });

      // Synchronize booking status
      const updatedBooking = await tx.booking.update({
        where: { id: targetBooking.id },
        data: { status: statusToSet }
      });

      return { ledgerEntry, updatedBooking };
    });

    console.log(`Successfully verified and logged payment ${paymentId} under ledger!`);

    // Emit live web sockets to keep admin and user screens dynamically synchronized!
    const reqWithIo = req as any;
    if (reqWithIo.io) {
      const socketPayload = { type: 'UPDATE', booking: result.updatedBooking };
      reqWithIo.io.to(`user-${result.updatedBooking.userId}`).emit('booking-updated', socketPayload);
      reqWithIo.io.to('admin-room').emit('new-system-event', {
        ...socketPayload,
        message: `Idempotent Payment ledger locked: ₹${amount.toLocaleString()} for ${result.updatedBooking.itemName}`
      });
    }

    return res.status(200).json({
      success: true,
      ledgerId: result.ledgerEntry.id,
      bookingStatus: result.updatedBooking.status
    });

  } catch (error) {
    console.error('Razorpay Webhook Error:', error);
    return res.status(500).json({ error: 'Failed to process payment webhook' });
  }
};

export const sendWhatsAppPaymentRequest = async (req: Request, res: Response) => {
  const { inquiryId, phone, amount } = req.body;

  if (!inquiryId || !phone || !amount || parseFloat(amount) <= 0) {
    return res.status(400).json({ error: 'Missing required fields: inquiryId, phone, amount' });
  }

  try {
    // 1. Fetch inquiry details
    const inquiry = await (prisma as any).inquiry.findUnique({
      where: { id: inquiryId }
    });

    if (!inquiry) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }

    const customerName = inquiry.customerName || 'Valued Client';
    const cleanPhone = phone.replace(/[^0-9]/g, ''); // Ensure only digits for WhatsApp (e.g. 919999999999)

    // 2. Generate unique payment reference and save to ledger
    const paymentId = `TXN-KC-${inquiryId.substring(0, 6).toUpperCase()}-${Date.now().toString().slice(-6)}`;
    const businessVPA = "thekashmircurators@okaxis";
    const merchantName = "The Kashmir Curators";
    const encodedName = encodeURIComponent(merchantName);
    const shortId = inquiryId.includes('-') ? `KC-${inquiryId.split('-')[0].toUpperCase()}` : `KC-${inquiryId.substring(0, 8).toUpperCase()}`;
    const encodedNote = encodeURIComponent(`Booking for ${shortId}`);
    
    // Standard UPI Link
    const upiLink = `upi://pay?pa=${businessVPA}&pn=${encodedName}&am=${amount}&cu=INR&tn=${encodedNote}`;
    
    // Generate QR Code URL via external qrserver API
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(upiLink)}&bgcolor=faf9f6&color=0a0f12&margin=20`;

    // 3. Log the payment request in TransactionLedger as PENDING (Unpaid/Credit)
    const ledgerEntry = await (prisma as any).transactionLedger.create({
      data: {
        bookingId: inquiryId, // Track under the inquiry reference
        amount: parseFloat(amount),
        type: 'CREDIT',
        paymentId,
        orderId: 'WHATSAPP_GPAY',
        description: `Pending WhatsApp Google Pay request sent to ${phone} for ${customerName}`
      }
    });

    // 4. Construct WhatsApp Message text
    const checkoutUrl = `https://kashmir-curators.vercel.app/payment-request/${paymentId}`;
    const messageText = `🏔️ *Kashmir Curators - Payment Request* 🏔️\n\nHi *${customerName}*,\n\nHere is your secure checkout link for your Kashmir expedition:\n\n*Amount:* ₹${parseFloat(amount).toLocaleString()}\n*Reference ID:* ${paymentId}\n\n📲 *Direct Payment Link:*\n${checkoutUrl}\n\nClick this link to pay instantly using *Google Pay*, *Paytm*, or *PhonePe*.\n\nWe look forward to welcoming you to Kashmir! ✨`;

    // 5. Send QR Code Image and Text Message via WhatsApp Service
    const { whatsappService } = require('../services/whatsappService');
    
    // Send Image first (QR Code)
    let imageSent = false;
    try {
      imageSent = await whatsappService.sendWhatsAppImage(cleanPhone, qrCodeUrl, `Scan QR Code to pay ₹${parseFloat(amount).toLocaleString()}`);
    } catch (wsErr: any) {
      console.error('Failed to send QR image via WhatsApp:', wsErr.message);
    }

    // Send Text Message details with checkout URL
    let textSent = false;
    try {
      textSent = await whatsappService.sendWhatsAppText(cleanPhone, messageText);
    } catch (wsErr: any) {
      console.error('Failed to send text request via WhatsApp:', wsErr.message);
    }

    // 6. Broadcast event via WebSockets to open Admin Command Panels in real-time
    const reqWithIo = req as any;
    if (reqWithIo.io) {
      reqWithIo.io.emit('new-system-event', {
        type: 'CREATE',
        message: `GPay payment request of ₹${parseFloat(amount).toLocaleString()} sent to ${customerName} on WhatsApp. UTR: ${paymentId}`
      });
    }

    return res.status(200).json({
      success: true,
      paymentId,
      upiLink,
      qrCodeUrl,
      whatsappStatus: {
        imageSent,
        textSent
      }
    });

  } catch (error: any) {
    console.error('Send WhatsApp Payment Request Error:', error);
    return res.status(500).json({ error: 'Failed to process and send payment request' });
  }
};

export const getPaymentRequestDetails = async (req: Request, res: Response) => {
  const { paymentId } = req.params;

  if (!paymentId) {
    return res.status(400).json({ error: 'paymentId is required' });
  }

  try {
    // 1. Fetch transaction record
    const ledger = await (prisma as any).transactionLedger.findUnique({
      where: { paymentId }
    });

    if (!ledger) {
      return res.status(404).json({ error: 'Payment request not found' });
    }

    // 2. Fetch corresponding inquiry details
    const inquiry = await (prisma as any).inquiry.findUnique({
      where: { id: ledger.bookingId }
    });

    if (!inquiry) {
      return res.status(404).json({ error: 'Associated inquiry not found' });
    }

    // 3. Re-generate upiLink and qrCodeUrl
    const businessVPA = "thekashmircurators@okaxis";
    const merchantName = "The Kashmir Curators";
    const encodedName = encodeURIComponent(merchantName);
    const shortId = ledger.bookingId.includes('-') ? `KC-${ledger.bookingId.split('-')[0].toUpperCase()}` : `KC-${ledger.bookingId.substring(0, 8).toUpperCase()}`;
    const encodedNote = encodeURIComponent(`Booking for ${shortId}`);
    
    const upiLink = `upi://pay?pa=${businessVPA}&pn=${encodedName}&am=${ledger.amount}&cu=INR&tn=${encodedNote}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(upiLink)}&bgcolor=faf9f6&color=0a0f12&margin=20`;

    return res.status(200).json({
      success: true,
      paymentId: ledger.paymentId,
      amount: ledger.amount,
      customerName: inquiry.customerName || 'Valued Client',
      destination: inquiry.destination || 'Kashmir Tour',
      duration: inquiry.duration || '6 Days',
      description: ledger.description,
      upiLink,
      qrCodeUrl,
      createdAt: ledger.createdAt
    });

  } catch (error: any) {
    console.error('Fetch Payment Request Details Error:', error);
    return res.status(500).json({ error: 'Failed to retrieve payment request details' });
  }
};
