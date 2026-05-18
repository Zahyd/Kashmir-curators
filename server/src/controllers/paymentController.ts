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
