import { Request, Response } from 'express';
import crypto from 'crypto';
import prisma from '../lib/prisma';
import { bookingAutomationService } from '../services/bookingAutomationService';
import { notificationService } from '../services/notificationService';
const Stripe = require('stripe');

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' })
  : null;

const getActiveUPIConfig = async () => {
  let businessVPA = process.env.BUSINESS_UPI_VPA || "thekashmircurators@okaxis";
  let merchantName = process.env.BUSINESS_UPI_MERCHANT_NAME || "The Kashmir Curators";

  try {
    const paymentSettings = await (prisma as any).siteContent.findUnique({
      where: { sectionKey: 'paymentSettings' }
    });
    if (paymentSettings && paymentSettings.content && paymentSettings.content.methods) {
      const methods = paymentSettings.content.methods;
      const primaryUPI = methods.find((m: any) => m.type === 'upi' && m.isActive && m.isPrimary);
      if (primaryUPI) {
        businessVPA = primaryUPI.identifier;
        merchantName = primaryUPI.name || primaryUPI.provider || merchantName;
      }
    }
  } catch (dbErr) {
    console.warn('Failed to load payment settings from db, using defaults:', dbErr);
  }

  return { businessVPA, merchantName };
};

export const handleRazorpayWebhook = async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const isSimulation = req.headers['x-simulation-mode'] === 'true' && process.env.NODE_ENV === 'development';

    // 1. Verify cryptographic signature if not in development simulation mode
    if (!isSimulation) {
      if (!webhookSecret) {
        return res.status(503).json({ error: 'Razorpay webhook verification is not configured on server' });
      }
      if (!signature) {
        return res.status(400).json({ error: 'Signature header is missing' });
      }

      const rawBody = (req as any).rawBody ? (req as any).rawBody : JSON.stringify(req.body);
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

      const sigBuf = Buffer.from(signature, 'utf8');
      const expBuf = Buffer.from(expectedSignature, 'utf8');
      if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
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
    const inquiryId = payload?.payment?.entity?.notes?.inquiryId || req.body.inquiryId;
    const paymentIdNotes = payload?.payment?.entity?.notes?.paymentId || req.body.paymentIdNotes;

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

    // 3. Find booking either via direct bookingId, inquiryId, or fallback to scanning details
    let targetBooking = null;
    if (bookingId) {
      targetBooking = await prisma.booking.findUnique({ where: { id: bookingId } });
    } else if (inquiryId) {
      const allBookings = await prisma.booking.findMany();
      targetBooking = allBookings.find(b => {
        try {
          const parsed = JSON.parse(b.details);
          return parsed.inquiryId === inquiryId || parsed.inquiryId === String(inquiryId);
        } catch {
          return false;
        }
      }) || null;

      if (!targetBooking) {
        // Create booking if none exists
        const inquiry = await prisma.inquiry.findUnique({ where: { id: inquiryId } });
        if (inquiry) {
          targetBooking = await prisma.booking.create({
            data: {
              userId: inquiry.userId || 'SYSTEM_GUEST',
              type: 'package',
              itemName: `Kashmir Tour Package - ${inquiry.destination}`,
              bookingDate: new Date(),
              totalAmount: amount,
              details: JSON.stringify({
                inquiryId: inquiry.id,
                customerName: inquiry.customerName,
                travelers: inquiry.travelers,
                duration: inquiry.duration,
                paymentMethod: 'Razorpay'
              }),
              status: 'confirmed'
            }
          });
        }
      }
    } else {
      // Targeted query instead of full-table scan
      targetBooking = await prisma.booking.findFirst({
        where: {
          OR: [
            { id: orderId },
            { details: { contains: orderId } }
          ]
        }
      });
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

    const reqWithIo = req as any;

    // Hook into the booking automation pipeline
    if (event !== 'payment.failed') {
      try {
        if (inquiryId) {
          await bookingAutomationService.handleStageTransition(inquiryId, 'PAYMENT_RECEIVED', reqWithIo.io);
        } else {
          await bookingAutomationService.handlePaymentSuccess(
            targetBooking.id,
            amount,
            paymentId,
            reqWithIo.io
          );
        }
      } catch (autoErr: any) {
        console.error('[PaymentController] Booking automation execution failed:', autoErr.message);
      }
    }

    // Emit live web sockets to keep admin and user screens dynamically synchronized!
    if (reqWithIo.io) {
      const socketPayload = { type: 'UPDATE', booking: result.updatedBooking };
      reqWithIo.io.to(`user-${result.updatedBooking.userId}`).emit('booking-updated', socketPayload);
      
      const msg = event === 'payment.failed' 
        ? `Payment Failed: Razorpay payment for ${result.updatedBooking.itemName} failed.`
        : `Payment Received: ₹${amount.toLocaleString()} locked for ${result.updatedBooking.itemName}`;
      
      // Persist alert to database and broadcast to admin-room
      try {
        await notificationService.emitSystemEvent(
          reqWithIo.io,
          event === 'payment.failed' ? 'ERROR' : 'PAYMENT',
          msg,
          { ...result.updatedBooking, entityType: 'booking' }
        );
      } catch (notifErr: any) {
        console.error('Failed to emit system event from webhook:', notifErr.message);
      }

      // Notify the specific customer payment link room if payment was initiated from a payment request
      if (paymentIdNotes) {
        if (event === 'payment.failed') {
          reqWithIo.io.to(`payment-${paymentIdNotes}`).emit('payment-failed', {
            paymentId: paymentIdNotes,
            reason: payload?.payment?.entity?.error_description || 'Payment failed'
          });
        } else {
          reqWithIo.io.to(`payment-${paymentIdNotes}`).emit('payment-success', {
            paymentId: paymentIdNotes,
            amount,
            status: 'confirmed'
          });
        }
      }
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

    // 2. Generate unique payment reference
    const paymentId = `TXN-KC-${inquiryId.substring(0, 6).toUpperCase()}-${Date.now().toString().slice(-6)}`;
    
    // Create Razorpay Order
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    
    let razorpayOrderId = 'MOCK_ORDER_' + Date.now();
    if (keyId && keySecret) {
      try {
        const orderRes = await fetch('https://api.razorpay.com/v1/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64')
          },
          body: JSON.stringify({
            amount: Math.round(parseFloat(amount) * 100),
            currency: 'INR',
            receipt: paymentId,
            notes: {
              paymentId,
              inquiryId
            }
          })
        });
        
        if (!orderRes.ok) {
          const errBody = await orderRes.json().catch(() => ({}));
          throw new Error(errBody.error?.description || 'Razorpay Order API Error');
        }
        
        const orderData = await orderRes.json();
        razorpayOrderId = orderData.id;
      } catch (err: any) {
        console.error('[Razorpay] Order creation failed:', err.message);
      }
    }

    // 3. Log the payment request in TransactionLedger as PENDING (Unpaid/Credit)
    const ledgerEntry = await (prisma as any).transactionLedger.create({
      data: {
        bookingId: inquiryId, // Track under the inquiry reference
        amount: parseFloat(amount),
        type: 'CREDIT',
        paymentId,
        orderId: razorpayOrderId,
        description: `Pending WhatsApp Razorpay request sent to ${phone} for ${customerName}`
      }
    });

    // 4. Construct WhatsApp Message text
    const frontendUrl = process.env.FRONTEND_URL || 'https://kashmir-curators.vercel.app';
    const checkoutUrl = `${frontendUrl}/payment-request/${paymentId}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(checkoutUrl)}&bgcolor=faf9f6&color=0a0f12&margin=20`;

    const messageText = `🏔️ *Kashmir Curators - Payment Request* 🏔️\n\nHi *${customerName}*,\n\nHere is your secure checkout link for your Kashmir expedition:\n\n*Amount:* ₹${parseFloat(amount).toLocaleString()}\n*Reference ID:* ${paymentId}\n\n📲 *Direct Payment Link:*\n${checkoutUrl}\n\nClick this link to pay instantly using *UPI*, *Cards*, or *Netbanking*.\n\nWe look forward to welcoming you to Kashmir! ✨`;

    // 5. Send QR Code Image and Text Message via WhatsApp Service
    const { whatsappService } = require('../services/whatsappService');
    
    // Send Image first (QR Code that opens the checkout page)
    let imageSent = false;
    try {
      imageSent = await whatsappService.sendWhatsAppImage(cleanPhone, qrCodeUrl, `Scan to open secure checkout for ₹${parseFloat(amount).toLocaleString()}`);
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
        message: `Razorpay payment request of ₹${parseFloat(amount).toLocaleString()} sent to ${customerName} on WhatsApp. UTR: ${paymentId}`
      });
    }

    return res.status(200).json({
      success: true,
      paymentId,
      checkoutUrl,
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
    // 1. Fetch transaction record directly by paymentId
    let ledger = await (prisma as any).transactionLedger.findUnique({
      where: { paymentId }
    });

    // 2. Fallback: check if paymentId is bookingId in transactionLedger
    if (!ledger) {
      ledger = await (prisma as any).transactionLedger.findFirst({
        where: { bookingId: paymentId },
        orderBy: { createdAt: 'desc' }
      });
    }

    // 3. Resolve inquiry
    let inquiry: any = null;
    if (ledger) {
      inquiry = await (prisma as any).inquiry.findUnique({
        where: { id: ledger.bookingId }
      });
    } else {
      // 4. Fallback: check if paymentId directly matches an Inquiry ID from itinerary builder
      inquiry = await (prisma as any).inquiry.findUnique({
        where: { id: paymentId }
      });

      if (inquiry) {
        let amount = inquiry.customPrice || inquiry.estimatedBudget;
        if (!amount && inquiry.quoteData) {
          try {
            const parsed = typeof inquiry.quoteData === 'string' ? JSON.parse(inquiry.quoteData) : inquiry.quoteData;
            if (Array.isArray(parsed)) {
              amount = parsed.reduce((sum: number, day: any) => sum + (Number(day.cost) || 0), 0);
            }
          } catch (e) {}
        }
        if (!amount || amount <= 0) {
          amount = 6450;
        }

        try {
          ledger = await (prisma as any).transactionLedger.create({
            data: {
              bookingId: inquiry.id,
              amount: parseFloat(String(amount)),
              type: 'CREDIT',
              paymentId: `PAY_${inquiry.id}`,
              orderId: 'PENDING_ORDER',
              description: `Trip reservation deposit for ${inquiry.customerName || 'Valued Traveler'} - ${inquiry.destination || 'Kashmir Tour'}`
            }
          });
        } catch (createErr) {
          ledger = {
            paymentId: `PAY_${inquiry.id}`,
            bookingId: inquiry.id,
            amount: parseFloat(String(amount)),
            description: `Trip reservation deposit for ${inquiry.customerName || 'Valued Traveler'} - ${inquiry.destination || 'Kashmir Tour'}`,
            orderId: 'PENDING_ORDER',
            createdAt: new Date()
          };
        }
      }
    }

    if (!inquiry || !ledger) {
      return res.status(404).json({ error: 'Payment request not found or expired' });
    }

    let razorpayOrderId = ledger.orderId;
    const razorpayKeyId = process.env.RAZORPAY_KEY_ID || '';
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

    // Generate active Razorpay order on the fly if needed
    if ((!razorpayOrderId || razorpayOrderId === 'PENDING_ORDER' || razorpayOrderId === 'WHATSAPP_GPAY') && razorpayKeyId && razorpayKeySecret) {
      try {
        const orderRes = await fetch('https://api.razorpay.com/v1/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString('base64')
          },
          body: JSON.stringify({
            amount: Math.round(ledger.amount * 100),
            currency: 'INR',
            receipt: (ledger.paymentId || inquiry.id).slice(0, 30),
            notes: {
              paymentId: ledger.paymentId,
              inquiryId: inquiry.id
            }
          })
        });
        if (orderRes.ok) {
          const orderData = await orderRes.json();
          razorpayOrderId = orderData.id;
          if (ledger.id) {
            await (prisma as any).transactionLedger.update({
              where: { id: ledger.id },
              data: { orderId: razorpayOrderId }
            }).catch(() => {});
          }
        }
      } catch (err: any) {
        console.warn('Razorpay on-the-fly order generation notice:', err.message);
      }
    }

    if (!razorpayOrderId || razorpayOrderId === 'PENDING_ORDER' || razorpayOrderId === 'WHATSAPP_GPAY') {
      razorpayOrderId = `order_${inquiry.id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10)}_${Date.now()}`;
    }

    return res.status(200).json({
      success: true,
      paymentId: ledger.paymentId,
      amount: ledger.amount,
      customerName: inquiry.customerName || 'Valued Client',
      destination: inquiry.destination || 'Kashmir Tour',
      duration: inquiry.duration || '6 Days',
      description: ledger.description,
      razorpayOrderId,
      razorpayKeyId,
      createdAt: ledger.createdAt
    });

  } catch (error: any) {
    console.error('Fetch Payment Request Details Error:', error);
    return res.status(500).json({ error: 'Failed to retrieve payment request details' });
  }
};

export const createStripeCheckoutSession = async (req: Request, res: Response) => {
  const { inquiryId, amount, customerEmail } = req.body;
  const p = prisma as any;

  try {
    const inquiry = await p.inquiry.findUnique({
      where: { id: inquiryId }
    });

    if (!inquiry) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }

    const finalAmount = Number(amount);
    if (isNaN(finalAmount) || finalAmount <= 0) {
      return res.status(400).json({ error: 'Invalid advance payment amount' });
    }

    if (!stripe) {
      return res.status(503).json({ error: 'Stripe payment gateway is not configured on server' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'inr',
            product_data: {
              name: `Advance Deposit - Kashmir Tour Curation`,
              description: `Securing hotel & lodging reservations for ${inquiry.customerName} (${inquiry.destination})`
            },
            unit_amount: Math.round(finalAmount * 100)
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      customer_email: customerEmail || inquiry.email,
      metadata: {
        inquiryId: inquiry.id,
        customerName: inquiry.customerName,
        advanceAmount: String(finalAmount)
      },
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/itinerary/${inquiry.id}?payment=success`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/itinerary/${inquiry.id}?payment=cancelled`
    });

    res.json({ sessionUrl: session.url, sessionId: session.id });
  } catch (error: any) {
    console.error('[Stripe] Create session error:', error.message);
    res.status(500).json({ error: 'Failed to initialize Stripe payment: ' + error.message });
  }
};

export const handleStripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
  const p = prisma as any;

  if (!stripe || !endpointSecret) {
    return res.status(503).json({ error: 'Stripe webhook verification is not configured on server' });
  }
  if (!sig) {
    return res.status(400).json({ error: 'Missing stripe-signature header' });
  }

  let event: any;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig as string, endpointSecret);
  } catch (err: any) {
    console.error(`[Stripe Webhook] Verification failed:`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any;
    const metadata = session.metadata;

    if (metadata && metadata.inquiryId) {
      const inquiryId = metadata.inquiryId;
      const amount = Number(metadata.advanceAmount || 0);
      const paymentId = (session.payment_intent as string) || session.id;

      console.log(`[Stripe Webhook] Payment completed! Inquiry ID: ${inquiryId}, Amount: ₹${amount}`);

      try {
        const inquiry = await p.inquiry.findUnique({
          where: { id: inquiryId }
        });

        if (inquiry) {
          // Resolve a valid User ID for Booking.userId foreign key constraint
          let resolvedUserId = inquiry.userId;
          if (!resolvedUserId) {
            const matchedUser = await p.user.findUnique({ where: { email: inquiry.email } }).catch(() => null);
            const fallbackUser = matchedUser || await p.user.findFirst({ orderBy: { createdAt: 'asc' } });
            resolvedUserId = fallbackUser?.id;
          }

          if (!resolvedUserId) {
            return res.status(400).json({ error: 'No user account found to bind Stripe booking' });
          }

          const updatedBooking = await p.$transaction(async (tx: any) => {
            let booking = await tx.booking.findFirst({
              where: {
                details: {
                  contains: inquiryId
                }
              }
            });

            if (!booking) {
              booking = await tx.booking.create({
                data: {
                  userId: resolvedUserId,
                  organizationId: inquiry.organizationId || null,
                  type: 'package',
                  itemName: `Kashmir Tour Package - ${inquiry.destination}`,
                  bookingDate: new Date(),
                  status: 'confirmed',
                  stage: 'CONFIRMED',
                  totalAmount: amount,
                  details: JSON.stringify({
                    inquiryId: inquiry.id,
                    customerName: inquiry.customerName,
                    travelers: inquiry.travelers,
                    duration: inquiry.duration,
                    paymentMethod: 'Stripe'
                  })
                }
              });
            } else {
              booking = await tx.booking.update({
                where: { id: booking.id },
                data: {
                  status: 'confirmed',
                  stage: 'CONFIRMED'
                }
              });
            }

            await tx.transactionLedger.upsert({
              where: { paymentId },
              update: {},
              create: {
                bookingId: booking.id,
                amount,
                type: 'CREDIT',
                paymentId,
                orderId: session.id,
                description: JSON.stringify({
                  gateway: 'STRIPE',
                  category: 'BOOKING_ADVANCE',
                  inquiryId,
                  customerEmail: session.customer_email || inquiry.email
                })
              }
            });

            return booking;
          });

          if (updatedBooking) {
            await bookingAutomationService.handleStageTransition(inquiryId, 'PAYMENT_RECEIVED', (req as any).io);
          }
        }
      } catch (dbErr: any) {
        console.error('[Stripe Webhook] DB Sync failed:', dbErr.message);
      }
    }
  }

  res.json({ received: true });
};

export const createRazorpayPaymentLink = async (req: Request, res: Response) => {
  const { inquiryId, amount, customerEmail } = req.body;
  const p = prisma as any;

  try {
    const inquiry = await p.inquiry.findUnique({
      where: { id: inquiryId }
    });

    if (!inquiry) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }

    const finalAmount = Number(amount);
    if (isNaN(finalAmount) || finalAmount <= 0) {
      return res.status(400).json({ error: 'Invalid advance payment amount' });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // If Razorpay keys are not configured, fallback to simulation mode link
    if (!keyId || !keySecret) {
      console.warn('[Razorpay] Keys not configured. Generating mock simulation payment link...');
      const mockLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/itinerary/${inquiry.id}?payment=success`;
      return res.json({ sessionUrl: mockLink, isMock: true });
    }

    // Call Razorpay API to generate Payment Link
    const response = await fetch('https://api.razorpay.com/v1/payment_links', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64')
      },
      body: JSON.stringify({
        amount: Math.round(finalAmount * 100),
        currency: 'INR',
        accept_partial: false,
        reference_id: inquiry.id,
        description: `Advance deposit for Kashmir Tour Reservation - Curated for ${inquiry.customerName}`,
        customer: {
          name: inquiry.customerName,
          email: customerEmail || inquiry.email,
          contact: inquiry.phone || '9999999999'
        },
        notify: {
          sms: true,
          email: true
        },
        reminder_enable: true,
        notes: {
          inquiryId: inquiry.id
        },
        callback_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/itinerary/${inquiry.id}?payment=success`,
        callback_method: 'get'
      })
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      throw new Error(errBody.error?.description || 'Razorpay Link API Error');
    }

    const data = await response.json();
    res.json({ sessionUrl: data.short_url, paymentLinkId: data.id });
  } catch (error: any) {
    console.error('[Razorpay] Create payment link error:', error.message);
    res.status(500).json({ error: 'Failed to initialize Razorpay payment: ' + error.message });
  }
};

/**
 * POST /api/payments/razorpay/create-subscription-order
 * Initiates Razorpay Order for B2B SaaS Plan Upgrade
 */
export const createSubscriptionOrder = async (req: any, res: Response) => {
  const { planId, billingCycle = 'MONTHLY' } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Validate billingCycle if present
  if (req.body.billingCycle !== undefined && req.body.billingCycle !== 'MONTHLY' && req.body.billingCycle !== 'ANNUAL') {
    return res.status(400).json({ error: 'Invalid billing cycle. Must be MONTHLY or ANNUAL' });
  }

  // Exact pricing per requirement R3
  let amount = 0;
  if (planId === 'PRO_DMC' || planId === 'PROFESSIONAL') {
    amount = billingCycle === 'ANNUAL' ? 15999 : 1999;
  } else if (planId === 'ENTERPRISE') {
    amount = billingCycle === 'ANNUAL' ? 39999 : 4999;
  } else {
    return res.status(400).json({ error: 'Invalid subscription plan selected' });
  }

  const keyId = process.env.RAZORPAY_KEY_ID || '';
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  let razorpayOrderId = `ORDER_SUB_${Date.now()}`;

  if (keyId && keySecret) {
    try {
      const orderRes = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64')
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // paise
          currency: 'INR',
          receipt: `SUB-${planId}-${Date.now().toString().slice(-6)}`,
          notes: {
            userId,
            planId,
            billingCycle
          }
        })
      });

      if (orderRes.ok) {
        const orderData = await orderRes.json();
        razorpayOrderId = orderData.id;
      }
    } catch (err: any) {
      console.warn('[Razorpay] Order API fallback:', err.message);
    }
  }

  return res.status(200).json({
    success: true,
    orderId: razorpayOrderId,
    amount,
    currency: 'INR',
    keyId,
    planId,
    billingCycle
  });
};

/**
 * POST /api/payments/razorpay/verify-subscription
 * Verifies Razorpay payment signature & persists updated plan in DB
 */
export const verifySubscriptionPayment = async (req: any, res: Response) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId, billingCycle } = req.body;
  const userId = req.user?.id;

  if (!userId || !planId) {
    return res.status(400).json({ error: 'Missing userId or planId' });
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const isSimulation = process.env.NODE_ENV === 'development' && (req.headers['x-simulation-mode'] === 'true' || !keySecret);

  if (!isSimulation) {
    if (!razorpay_signature || !razorpay_order_id || !razorpay_payment_id) {
      return res.status(400).json({ error: 'Missing required Razorpay payment verification parameters' });
    }
    if (!keySecret) {
      return res.status(500).json({ error: 'Razorpay payment verification configuration error: secret missing' });
    }
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Invalid Razorpay payment signature' });
    }
  }

  try {
    const normalizedPlan = (planId === 'PROFESSIONAL' || planId === 'PRO_DMC') ? 'PRO_DMC' : planId;

    // 1. Upsert AgentProfile with new plan and APPROVED status
    const profile = await prisma.agentProfile.upsert({
      where: { userId },
      update: {
        plan: normalizedPlan,
        billingCycle: billingCycle || 'MONTHLY',
        status: 'APPROVED'
      },
      create: {
        userId,
        companyName: req.user?.name ? `${req.user.name} Travels` : 'Registered Agency',
        agentCode: `AGT-${(req.user?.name || 'PARTNER').toUpperCase().replace(/\s+/g, '-').slice(0, 8)}-${Math.floor(1000 + Math.random() * 9000)}`,
        commissionPct: 10.0,
        plan: normalizedPlan,
        billingCycle: billingCycle || 'MONTHLY',
        status: 'APPROVED'
      }
    });

    // 2. Ensure User role is agent
    await prisma.user.update({
      where: { id: userId },
      data: { role: 'agent' }
    });

    // 3. Record transaction in TransactionLedger
    const amount = (normalizedPlan === 'PRO_DMC' ? (billingCycle === 'ANNUAL' ? 15999 : 1999) : (billingCycle === 'ANNUAL' ? 39999 : 4999));
    await (prisma as any).transactionLedger.create({
      data: {
        bookingId: profile.id,
        amount,
        type: 'CREDIT',
        paymentId: razorpay_payment_id || `PAY_MOCK_${Date.now()}`,
        orderId: razorpay_order_id || `ORD_MOCK_${Date.now()}`,
        description: `B2B SaaS Subscription Upgrade to ${normalizedPlan} (${billingCycle || 'MONTHLY'})`
      }
    }).catch((e: any) => console.warn('Ledger write notice:', e.message));

    // 4. Broadcast websocket event
    if ((req as any).io) {
      (req as any).io.to('admin-room').emit('new-system-event', {
        type: 'AGENT_SUBSCRIPTION_UPGRADED',
        message: `Agent ${profile.companyName} upgraded to ${normalizedPlan} (${billingCycle || 'MONTHLY'})`
      });
    }

    return res.status(200).json({
      success: true,
      message: `Successfully upgraded to ${normalizedPlan}`,
      profile,
      plan: normalizedPlan
    });
  } catch (error: any) {
    console.error('verifySubscriptionPayment error:', error);
    return res.status(500).json({ error: 'Failed to activate subscription' });
  }
};
