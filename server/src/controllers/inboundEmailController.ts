import { Request, Response } from 'express';
import { emailQueueService } from '../services/emailQueueService';
import { aiAgentService } from '../services/aiAgentService';
import { notificationService } from '../services/notificationService';
import prisma from '../lib/prisma';

/**
 * Handle incoming email webhooks (Resend Inbound, Cloudflare Email Routing, SendGrid Parse, etc.)
 */
export const receiveInboundWebhook = async (req: Request, res: Response) => {
  try {
    const io = req.app.get('io');
    const body = req.body;

    // Resend / Cloudflare / SendGrid webhook payload normalization
    const fromEmail = body.from || body.sender || body.envelope?.from || body['from'] || 'hotel-reception@partner.com';
    const subject = body.subject || 'Hotel Reservation Response';
    const rawText = body.text || body.html || body.content || (typeof body === 'string' ? body : JSON.stringify(body));

    console.log(`[InboundWebhook] Inbound email received from: ${fromEmail} | Subject: ${subject}`);

    const result = await emailQueueService.processInboundEmailDirect({
      rawText,
      fromEmail,
      subject,
      io
    });

    return res.status(200).json({
      success: true,
      message: 'Inbound hotel email successfully processed by AI Agent',
      result
    });
  } catch (err: any) {
    console.error('[InboundWebhook] Error processing incoming email:', err.message);
    return res.status(500).json({ error: 'Failed to process inbound email', details: err.message });
  }
};

/**
 * Manually analyze an email or WhatsApp message using AI (Employee Dashboard Tool)
 */
export const parseRawHotelReply = async (req: Request, res: Response) => {
  try {
    const io = req.app.get('io');
    const { rawText, reservationId, fromEmail = 'hotel-reception@partner.com' } = req.body;

    if (!rawText || !rawText.trim()) {
      return res.status(400).json({ error: 'Please provide the raw email or message text to analyze.' });
    }

    const result = await emailQueueService.processInboundEmailDirect({
      rawText: rawText.trim(),
      fromEmail,
      subject: 'Front Desk Direct Response',
      reservationId,
      io
    });

    return res.status(200).json({
      success: true,
      message: 'Text analyzed and applied to reservation by AI Agent',
      ...result
    });
  } catch (err: any) {
    console.error('[ParseRawHotelReply] Error:', err.message);
    return res.status(500).json({ error: 'AI analysis failed', details: err.message });
  }
};

/**
 * Get live AI Agent Action logs and inbound parsing history
 */
export const getAiAgentLogs = async (req: Request, res: Response) => {
  try {
    const p = prisma as any;
    const { reservationId, limit = '20' } = req.query;

    const whereClause: any = {};
    if (reservationId && typeof reservationId === 'string') {
      whereClause.reservationId = reservationId;
    }

    const [actions, inbounds] = await Promise.all([
      p.aiAgentActionLog.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit as string, 10),
        include: {
          reservation: {
            select: { id: true, bookingReference: true, guestName: true }
          }
        }
      }),
      p.inboundEmailLog.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit as string, 10),
        include: {
          reservation: {
            select: { id: true, bookingReference: true, guestName: true }
          }
        }
      })
    ]);

    return res.status(200).json({
      success: true,
      actions,
      inbounds
    });
  } catch (err: any) {
    console.error('[GetAiAgentLogs] Error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch AI logs', details: err.message });
  }
};

/**
 * Trigger an automated AI Smart Follow-Up Reminder for an overdue reservation
 */
export const triggerSmartFollowUp = async (req: Request, res: Response) => {
  try {
    const p = prisma as any;
    const reservationId = String(req.params.reservationId);
    const { attemptCount = 1 } = req.body;

    const reservation = await p.hotelReservation.findUnique({
      where: { id: reservationId },
      include: { hotel: true }
    });

    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    // Generate intelligent escalating follow-up email
    const { subject, html, urgencyLevel } = await aiAgentService.generateSmartFollowUp({
      reservation,
      attemptCount: Number(attemptCount) || 1
    });

    const recipient = reservation.receptionEmail || reservation.hotel?.contactEmail || 'operations@kashmircurators.com';

    // Dispatch tracked email
    const dispatchResult = await notificationService.sendTrackedEmail({
      reservationId,
      emailType: 'REMINDER',
      to: recipient,
      recipientName: reservation.hotel?.name || 'Hotel Reception',
      subject,
      html
    });

    // Log AI Agent Action
    await p.aiAgentActionLog.create({
      data: {
        reservationId,
        actionType: 'SMART_FOLLOWUP_DISPATCHED',
        title: `AI Smart Follow-Up #${attemptCount} Dispatched`,
        description: `Sent ${urgencyLevel} priority reminder to ${recipient} regarding ${reservation.guestName}.`,
        confidence: 0.98,
        metadata: JSON.stringify({
          recipient,
          urgencyLevel,
          subject,
          dispatchResult
        }),
        triggeredBy: 'AI_AGENT'
      }
    });

    return res.status(200).json({
      success: true,
      message: `AI Smart Follow-up #${attemptCount} dispatched successfully`,
      urgencyLevel,
      dispatchResult
    });
  } catch (err: any) {
    console.error('[TriggerSmartFollowUp] Error:', err.message);
    return res.status(500).json({ error: 'Failed to dispatch AI follow-up', details: err.message });
  }
};
