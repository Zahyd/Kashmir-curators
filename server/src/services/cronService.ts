import cron from 'node-cron';
import prisma from '../lib/prisma';
import { notificationService } from './notificationService';
import { WhatsAppWorkflowEngine } from './whatsappService';
import { realtimeBus } from '../lib/realtimeBus';

class CronService {
  /**
   * Initializes all background worker tasks.
   */
  public initialize() {
    console.log('[Cron Service] Starting automated background workers...');
    
    // 1. Follow-up Alert Job (Runs daily at 10:00 AM)
    // Sends Email and WhatsApp alerts to inquiries stuck in "Pending" for 30 days.
    cron.schedule('0 10 * * *', async () => {
      console.log('[Cron Service] Executing 30-Day Follow-Up Alert Job...');
      try {
        await this.runFollowUpAlerts();
      } catch (error) {
        console.error('[Cron Service] Follow-Up Job Failed:', error);
      }
    });

    // 2. Hourly Overdue Reminder Scanner
    cron.schedule('0 * * * *', async () => {
      try {
        await this.runOverdueReminderScan();
      } catch (error) {
        console.error('[Cron Service] Overdue Reminder Scan Failed:', error);
      }
    });

    // 3. Quotation Expiry Alert Job (Runs daily at 09:00 AM)
    cron.schedule('0 9 * * *', async () => {
      try {
        await this.runQuotationExpiryAlerts();
      } catch (error) {
        console.error('[Cron Service] Quotation Expiry Job Failed:', error);
      }
    });

    // 4. Data Retention Purge Job (Runs daily at Midnight)
    cron.schedule('0 0 * * *', async () => {
      console.log('[Cron Service] Executing 35-Day Retention Purge Job...');
      try {
        await this.runRetentionPurge();
      } catch (error) {
        console.error('[Cron Service] Retention Purge Failed:', error);
      }
    });

    // 5. Hourly Hotel Reservation Response Reminder & Expiration Scanner
    cron.schedule('30 * * * *', async () => {
      try {
        await this.runHotelResponseReminders();
      } catch (error) {
        console.error('[Cron Service] Hotel Response Reminder Scan Failed:', error);
      }
    });

    // 6. Every 15 minutes: Reconcile Stale Employee Active Sessions
    cron.schedule('*/15 * * * *', async () => {
      try {
        await this.reconcileStaleSessions();
      } catch (error) {
        console.error('[Cron Service] Session Reconciliation Failed:', error);
      }
    });
  }

  private async runHotelResponseReminders() {
    const now = new Date();
    const p = prisma as any;

    // Find reservations pending hotel response where confirmation deadline passed or token expires soon
    const pendingReservations = await p.hotelReservation.findMany({
      where: {
        confirmationStage: 'PENDING_RESPONSE',
        status: { notIn: ['Cancelled', 'Rejected', 'Confirmed'] },
        receptionEmail: { not: null }
      },
      include: { 
        hotel: true,
        emailDispatches: {
          where: { emailType: 'REMINDER' }
        }
      }
    });

    const { aiAgentService } = await import('./aiAgentService');

    for (const res of pendingReservations) {
      const reminderCount = (res.emailDispatches?.length || 0) + 1;
      
      // Stop automated reminders after 4 attempts to avoid spamming
      if (reminderCount > 4) continue;

      try {
        const { subject, html, urgencyLevel } = await aiAgentService.generateSmartFollowUp({
          reservation: res,
          attemptCount: reminderCount
        });

        const recipient = res.receptionEmail || res.hotel?.contactEmail || 'operations@kashmircurators.com';

        await notificationService.sendTrackedEmail({
          reservationId: res.id,
          emailType: 'REMINDER',
          to: recipient,
          recipientName: res.hotel?.name || 'Hotel Reception',
          subject,
          html
        });

        await p.aiAgentActionLog.create({
          data: {
            reservationId: res.id,
            actionType: 'SMART_FOLLOWUP_DISPATCHED',
            title: `AI Smart Reminder #${reminderCount} (${urgencyLevel})`,
            description: `Autonomous cron follow-up sent to ${recipient} for ${res.guestName}.`,
            confidence: 0.99,
            triggeredBy: 'CRON_SCHEDULER'
          }
        });

        const activeIo = realtimeBus.getIo();
        if (activeIo) {
          activeIo.to('admin-room').emit('new-system-event', {
            type: 'RESPONSE_REMINDER',
            message: `AI Agent dispatched ${urgencyLevel.toLowerCase()} reminder #${reminderCount} to ${res.hotel?.name || 'Hotel'} for ${res.guestName}`,
            booking: { id: res.id, entityType: 'reservation' }
          });
        }
      } catch (err: any) {
        console.warn(`[CronService] Failed AI follow-up for reservation ${res.id}:`, err.message);
      }
    }
  }

  private async reconcileStaleSessions() {
    const p = prisma as any;
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    // If an employee session had no heartbeat pulse in 30 minutes, mark as inactive
    await p.employeeSession.updateMany({
      where: {
        isActive: true,
        lastActivityAt: { lt: thirtyMinutesAgo }
      },
      data: {
        isActive: false,
        logoutAt: new Date()
      }
    });
  }

  private async runOverdueReminderScan() {
    const now = new Date();
    const overdueReminders = await prisma.followUpReminder.findMany({
      where: {
        status: 'PENDING',
        dueDate: { lt: now }
      },
      include: { inquiry: true }
    });

    if (overdueReminders.length === 0) return;

    for (const rem of overdueReminders) {
      await prisma.followUpReminder.update({
        where: { id: rem.id },
        data: { status: 'OVERDUE' }
      });

      realtimeBus.publish(
        'reminder-overdue',
        {
          reminderId: rem.id,
          title: rem.title,
          customerName: rem.inquiry?.customerName,
          assignedTo: rem.assignedTo
        },
        { io: realtimeBus.getIo(), tenantId: (rem.inquiry as any)?.organizationId || null }
      );
    }
  }

  private async runQuotationExpiryAlerts() {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const expiredQuotes = await prisma.inquiry.findMany({
      where: {
        leadStage: 'QUOTE_SENT',
        updatedAt: { lt: sevenDaysAgo }
      }
    });

    for (const inq of expiredQuotes) {
      // Transition to FOLLOW_UP
      await prisma.inquiry.update({
        where: { id: inq.id },
        data: { leadStage: 'FOLLOW_UP' }
      });

      await prisma.leadActivity.create({
        data: {
          inquiryId: inq.id,
          type: 'QUOTE_EXPIRY_ALERT',
          title: 'Quotation Expiry Warning',
          description: 'Quotation sent over 7 days ago without customer payment. Moved back to Follow-Up queue.',
          performedBy: 'AUTOMATION_ENGINE'
        }
      });

      if (inq.phone) {
        const text = `Hi ${inq.customerName}, warm greetings from Kashmir Curators! ❄️\n\nYour customized quotation for ${inq.destination} was prepared a week ago. Due to peak demand, our discounted wholesale rates expire in 48 hours.\n\nWould you like us to re-confirm availability or adjust the itinerary for you?`;
        await WhatsAppWorkflowEngine.executeWhatsAppSenderNode(inq.phone, text);
      }
    }
  }

  private async runFollowUpAlerts() {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - 30);
    
    const startOfDay = new Date(thresholdDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(thresholdDate.setHours(23, 59, 59, 999));

    const pendingInquiries = await prisma.inquiry.findMany({
      where: {
        status: { in: ['Pending', 'New'] },
        updatedAt: {
          gte: startOfDay,
          lte: endOfDay,
        }
      }
    });

    if (pendingInquiries.length === 0) return;

    for (const inquiry of pendingInquiries) {
      const { customerName, email, phone, destination } = inquiry;
      
      const emailSubject = `Important update regarding your trip to ${destination}`;
      const messageBody = `Hi ${customerName},\n\nWe noticed your inquiry for ${destination} is still pending. Our bespoke packages are in high demand and prices may change soon.\n\nAre you still planning your luxury trip with Kashmir Curators? Please reply to this message to confirm, or let us know if you need any adjustments to your itinerary.\n\nWarm regards,\nThe Kashmir Curators Team`;
      
      if (email && email.includes('@')) {
        await notificationService.sendCustomerEmail(email, emailSubject, `<p>${messageBody.replace(/\n/g, '<br/>')}</p>`);
      }

      if (phone) {
        await WhatsAppWorkflowEngine.executeWhatsAppSenderNode(phone, messageBody);
      }
    }
  }

  private async runRetentionPurge() {
    const purgeDate = new Date();
    purgeDate.setDate(purgeDate.getDate() - 35);

    const result = await prisma.inquiry.deleteMany({
      where: {
        status: { in: ['Pending', 'New', 'Lost'] },
        updatedAt: {
          lt: purgeDate
        }
      }
    });

    console.log(`[Cron Service] Retention Purge: Deleted ${result.count} stale inquiries older than 35 days.`);
  }
}

export const cronService = new CronService();
