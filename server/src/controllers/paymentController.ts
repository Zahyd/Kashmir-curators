import { Request, Response } from 'express';
import crypto from 'crypto';
import prisma from '../lib/prisma';
import { bookingAutomationService } from '../services/bookingAutomationService';
import { notificationService } from '../services/notificationService';
const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_51OwWnLSCR60f1Jt1k8D4S8aX5433N0QoU6JkS7m1W3N0tO...', {
  apiVersion: '2024-06-20'
});

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

    let razorpayOrderId = ledger.orderId;
    const razorpayKeyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_TC6hJeqiMJD6a5';
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

    // Backward compatibility: if orderId is old 'WHATSAPP_GPAY', generate a Razorpay order on the fly
    if (razorpayOrderId === 'WHATSAPP_GPAY' && razorpayKeyId && razorpayKeySecret) {
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
            receipt: ledger.paymentId,
            notes: {
              paymentId: ledger.paymentId,
              inquiryId: ledger.bookingId
            }
          })
        });
        if (orderRes.ok) {
          const orderData = await orderRes.json();
          razorpayOrderId = orderData.id;
          await (prisma as any).transactionLedger.update({
            where: { paymentId },
            data: { orderId: razorpayOrderId }
          });
        }
      } catch (err: any) {
        console.error('Failed to create Razorpay Order on the fly:', err.message);
      }
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

  let event: any;

  try {
    if (endpointSecret && sig) {
      event = stripe.webhooks.constructEvent(req.body, sig as string, endpointSecret);
    } else {
      event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    }
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
          let booking = await p.booking.findFirst({
            where: {
              details: {
                contains: inquiryId
              }
            }
          });

          if (!booking) {
            booking = await p.booking.create({
              data: {
                userId: inquiry.userId || 'SYSTEM_GUEST',
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
            booking = await p.booking.update({
              where: { id: booking.id },
              data: { 
                status: 'confirmed',
                stage: 'CONFIRMED'
              }
            });
          }

          await p.transactionLedger.create({
            data: {
              bookingId: booking.id,
              amount: amount,
              type: 'INFLOW',
              category: 'BOOKING_ADVANCE',
              paymentGateway: 'STRIPE',
              transactionId: paymentId,
              status: 'COMPLETED',
              reconciled: true,
              metadata: JSON.stringify({
                inquiryId,
                customerEmail: session.customer_email || inquiry.email,
                checkoutSessionId: session.id
              })
            }
          });

          await bookingAutomationService.handleStageTransition(inquiryId, 'PAYMENT_RECEIVED', (req as any).io);
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
