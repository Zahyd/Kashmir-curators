import { notificationService } from './notificationService';
import { aiAgentService, InboundParsedResult } from './aiAgentService';
import { WhatsAppWorkflowEngine } from './whatsappService';
import prisma from '../lib/prisma';

let bossInstance: any = null;
let isStarted = false;

export const emailQueueService = {
  /**
   * Initialize and start the PostgreSQL Queue Worker
   */
  async initQueue(connectionString?: string) {
    if (isStarted && bossInstance) return bossInstance;

    const dbUrl = connectionString || process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
    if (!dbUrl) {
      console.warn('[EmailQueueService] No database URL found, running in immediate mode.');
      return null;
    }

    try {
      const { PgBoss } = await import('pg-boss');
      bossInstance = new PgBoss({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false },
        schema: 'pgboss',
        max: 5
      });

      bossInstance.on('error', (err: any) => {
        console.warn('[PgBoss] Worker event warning:', err.message);
      });

      await bossInstance.start();
      isStarted = true;
      console.log('[EmailQueueService] pg-boss background worker started successfully on Neon PostgreSQL.');

      // Register Workers
      await this.registerWorkers();
      return bossInstance;
    } catch (err: any) {
      console.warn('[EmailQueueService] Failed to start pg-boss, fallback to direct dispatch:', err.message);
      return null;
    }
  },

  /**
   * Register background worker handlers
   */
  async registerWorkers() {
    if (!bossInstance) return;

    // Worker 1: Outbound Transactional Email
    await bossInstance.work('email:send', async (jobs: any) => {
      const jobList = Array.isArray(jobs) ? jobs : [jobs];
      for (const job of jobList) {
        const payload = job.data;
        try {
          console.log(`[QueueWorker] Dispatching email job ${job.id} to ${payload.to}...`);
          const result = await notificationService.sendTrackedEmail(payload);
          if (!result.success && result.error) {
            throw new Error(result.error);
          }
        } catch (err: any) {
          console.error(`[QueueWorker] Job ${job.id} attempt failed:`, err.message);
          throw err; // Trigger pg-boss retry with exponential backoff
        }
      }
    });

    // Worker 2: Inbound AI Hotel Reply Processing
    await bossInstance.work('email:process-inbound', async (jobs: any) => {
      const jobList = Array.isArray(jobs) ? jobs : [jobs];
      for (const job of jobList) {
        const { rawText, fromEmail, subject, reservationId, io } = job.data;
        try {
          console.log(`[QueueWorker] Processing inbound reply with AI Agent for reservation ${reservationId || 'General'}...`);
          await emailQueueService.processInboundEmailDirect({ rawText, fromEmail, subject, reservationId, io });
        } catch (err: any) {
          console.error(`[QueueWorker] Inbound processing failed:`, err.message);
        }
      }
    });

    // Worker 3: Customer Search & Abandoned-Browse Nudge
    await bossInstance.work('customer:search-nudge', async (jobs: any) => {
      const jobList = Array.isArray(jobs) ? jobs : [jobs];
      for (const job of jobList) {
        try {
          await emailQueueService.processCustomerSearchNudge(job.data);
        } catch (err: any) {
          console.error(`[QueueWorker] Customer search nudge failed:`, err.message);
        }
      }
    });
  },

  /**
   * Enqueue an email to be sent asynchronously with automatic retries
   */
  async enqueueEmail(params: {
    reservationId?: string;
    emailType: string;
    to: string;
    recipientName?: string;
    subject: string;
    html: string;
    idempotencyKey?: string;
    delaySeconds?: number;
  }) {
    if (bossInstance && isStarted) {
      try {
        const jobId = await bossInstance.send('email:send', params, {
          retryLimit: 3,
          retryDelay: 60, // 1 min initial delay
          retryBackoff: true,
          startAfter: params.delaySeconds || 0
        });
        console.log(`[EmailQueueService] Enqueued email job: ${jobId}`);
        return { enqueued: true, jobId };
      } catch (err: any) {
        console.warn('[EmailQueueService] Enqueue failed, executing immediate dispatch fallback:', err.message);
      }
    }

    // Direct synchronous fallback if queue is not active
    const result = await notificationService.sendTrackedEmail(params);
    return { enqueued: false, ...result };
  },

  /**
   * Process an inbound email with AI and update database records
   */
  async processInboundEmailDirect(params: {
    rawText: string;
    fromEmail: string;
    subject: string;
    reservationId?: string;
    io?: any;
  }) {
    const { rawText, fromEmail, subject, io } = params;
    const p = prisma as any;

    let matchedReservation: any = null;
    let reservationId = params.reservationId;

    // Auto-match reservation by subject or body reference if not provided
    if (!reservationId) {
      const refMatch = `${subject} ${rawText}`.match(/(?:KCH|KC-RES|HTL|RES)-?([0-9]{3,8})/i);
      if (refMatch) {
        const candidateRef = refMatch[0].toUpperCase();
        matchedReservation = await p.hotelReservation.findFirst({
          where: {
            OR: [
              { bookingReference: { contains: candidateRef, mode: 'insensitive' } },
              { id: candidateRef }
            ]
          },
          include: { hotel: true }
        });
        if (matchedReservation) {
          reservationId = matchedReservation.id;
        }
      }
    } else {
      matchedReservation = await p.hotelReservation.findUnique({
        where: { id: reservationId },
        include: { hotel: true }
      });
    }

    // Run AI Agent Analysis
    const aiResult: InboundParsedResult = await aiAgentService.parseInboundHotelReply({
      rawText,
      fromEmail,
      subject,
      reservationContext: matchedReservation ? {
        guestName: matchedReservation.guestName,
        hotelName: matchedReservation.hotel?.name,
        roomType: matchedReservation.roomType,
        roomsCount: matchedReservation.roomsCount,
        contractRate: matchedReservation.contractRate,
        checkIn: matchedReservation.checkIn?.toISOString(),
        checkOut: matchedReservation.checkOut?.toISOString(),
        mealPlan: matchedReservation.mealPlan
      } : undefined
    });

    // Save Inbound Email Log
    const inboundLog = await p.inboundEmailLog.create({
      data: {
        reservationId: reservationId || null,
        fromEmail,
        subject,
        rawBody: rawText,
        parsedIntent: aiResult.intent,
        parsedData: JSON.stringify(aiResult),
        aiConfidence: aiResult.confidence,
        aiModel: 'gemini-2.5-flash',
        status: 'PROCESSED'
      }
    });

    // If a reservation matched, apply extraction automatically
    let appliedUpdates: any = null;
    if (reservationId && matchedReservation) {
      appliedUpdates = await aiAgentService.applyAiExtractionToReservation(reservationId, aiResult, rawText);
    }

    // Emit live real-time Socket.io notification to employee dashboard
    if (io) {
      io.emit('hotel-reply-processed', {
        reservationId,
        inboundLogId: inboundLog.id,
        guestName: matchedReservation?.guestName || 'Guest',
        hotelName: matchedReservation?.hotel?.name || fromEmail,
        intent: aiResult.intent,
        summary: aiResult.summary,
        crsNumber: aiResult.hotelConfirmationNumber,
        sentiment: aiResult.sentiment,
        timestamp: new Date().toISOString()
      });
    }

    return {
      inboundLogId: inboundLog.id,
      matchedReservationId: reservationId,
      aiResult,
      appliedUpdates
    };
  },

  /**
   * Enqueue an automated customer abandoned-search nudge with customizable delay
   */
  async enqueueSearchNudge(params: {
    searchIntentId?: string;
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    searchType?: string;
    searchedEntity?: string;
    destination?: string;
    checkIn?: string | Date;
    checkOut?: string | Date;
    budgetTier?: string;
    guestsCount?: number;
    delaySeconds?: number;
    io?: any;
  }) {
    if (bossInstance && isStarted) {
      try {
        const jobId = await bossInstance.send('customer:search-nudge', params, {
          retryLimit: 2,
          retryDelay: 120,
          startAfter: params.delaySeconds ?? 1800 // default 30 mins
        });
        console.log(`[EmailQueueService] Enqueued customer search nudge job: ${jobId} (Delay: ${params.delaySeconds ?? 1800}s)`);
        return { enqueued: true, jobId };
      } catch (err: any) {
        console.warn('[EmailQueueService] Failed to enqueue search nudge, running direct check:', err.message);
      }
    }

    // If queue is not running or delay is 0, process direct
    if ((params.delaySeconds ?? 0) === 0) {
      return await this.processCustomerSearchNudge(params);
    }
    return { enqueued: false, message: 'Deferred until queue triggers.' };
  },

  /**
   * Process and send an automated customer search nudge via WhatsApp & Email
   */
  async processCustomerSearchNudge(data: {
    searchIntentId?: string;
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    searchType?: string;
    searchedEntity?: string;
    destination?: string;
    checkIn?: string | Date;
    checkOut?: string | Date;
    budgetTier?: string;
    guestsCount?: number;
    io?: any;
  }) {
    const p = prisma as any;
    console.log(`[CustomerNudge] Processing remarketing nudge for ${data.customerName || 'Traveler'} (${data.customerPhone || data.customerEmail})...`);

    // 1. If searchIntentId provided, verify that the customer hasn't converted already
    if (data.searchIntentId) {
      const intent = await p.customerSearchIntent.findUnique({
        where: { id: data.searchIntentId }
      });
      if (!intent || intent.status === 'CONVERTED') {
        console.log(`[CustomerNudge] Intent ${data.searchIntentId} is already converted or removed. Aborting nudge.`);
        return { aborted: true, reason: 'ALREADY_CONVERTED' };
      }
    }

    // 2. Generate customized AI messages (WhatsApp text + HTML Email)
    const { whatsappText, emailSubject, emailHtml, curatorName } = await aiAgentService.generateCustomerSearchNudge(data);

    let whatsappSent = false;
    let emailSent = false;

    // 3. Dispatch WhatsApp if customer phone provided
    if (data.customerPhone) {
      try {
        whatsappSent = await WhatsAppWorkflowEngine.executeWhatsAppSenderNode(data.customerPhone, whatsappText);
        
        // Log in WhatsAppMessage DB table
        await p.whatsAppMessage.create({
          data: {
            customerPhone: data.customerPhone,
            direction: 'OUTBOUND',
            content: whatsappText,
            senderId: 'SYSTEM',
            senderName: curatorName,
            status: whatsappSent ? 'SENT' : 'SIMULATED'
          }
        });
      } catch (waErr: any) {
        console.warn('[CustomerNudge] WhatsApp delivery error:', waErr.message);
      }
    }

    // 4. Dispatch Tracked Email if customer email provided
    if (data.customerEmail && data.customerEmail.includes('@') && !data.customerEmail.includes('@guest.kashmirconnect.com')) {
      try {
        const emailResult = await notificationService.sendTrackedEmail({
          emailType: 'CUSTOMER_SEARCH_NUDGE',
          to: data.customerEmail,
          recipientName: data.customerName || 'Valued Traveler',
          subject: emailSubject,
          html: emailHtml,
          idempotencyKey: data.searchIntentId ? `nudge-${data.searchIntentId}` : undefined
        });
        emailSent = emailResult.success;
      } catch (emailErr: any) {
        console.warn('[CustomerNudge] Email delivery error:', emailErr.message);
      }
    }

    // 5. Update CustomerSearchIntent status
    if (data.searchIntentId) {
      const channel = (whatsappSent && emailSent) ? 'BOTH' : whatsappSent ? 'WHATSAPP' : 'EMAIL';
      await p.customerSearchIntent.update({
        where: { id: data.searchIntentId },
        data: {
          status: 'NUDGE_SENT',
          nudgeSentAt: new Date(),
          nudgeChannel: channel
        }
      });
    }

    // 6. Record in AiAgentActionLog
    await p.aiAgentActionLog.create({
      data: {
        actionType: 'CUSTOMER_SEARCH_NUDGE',
        title: `AI Customer Remarketing Nudge Sent`,
        description: `Sent personalized WhatsApp (${whatsappSent ? 'Delivered' : 'Simulated'}) & Email (${emailSent ? 'Delivered' : 'Off'}) to ${data.customerName || 'Traveler'} for ${data.searchedEntity || data.destination}.`,
        metadata: JSON.stringify({
          phone: data.customerPhone,
          email: data.customerEmail,
          destination: data.destination,
          searchedEntity: data.searchedEntity,
          whatsappSent,
          emailSent
        }),
        confidence: 0.98,
        triggeredBy: 'SYSTEM_AUTOMATION'
      }
    });

    // 7. Emit live real-time notification
    if (data.io) {
      data.io.emit('customer-nudge-dispatched', {
        searchIntentId: data.searchIntentId,
        customerName: data.customerName,
        phone: data.customerPhone,
        entity: data.searchedEntity || data.destination,
        whatsappSent,
        emailSent,
        timestamp: new Date().toISOString()
      });
    }

    return { success: true, whatsappSent, emailSent };
  }
};
