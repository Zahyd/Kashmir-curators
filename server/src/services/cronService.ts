import cron from 'node-cron';
import prisma from '../lib/prisma';
import { notificationService } from './notificationService';
import { WhatsAppWorkflowEngine } from './whatsappService';

class CronService {
  /**
   * Initializes all background worker tasks.
   */
  public initialize() {
    console.log('[Cron Service] Starting automated background workers...');
    
    // 1. Follow-up Alert Job (Runs daily at 10:00 AM)
    // Sends Email and WhatsApp alerts to inquiries stuck in "Pending" for exactly 30 days.
    cron.schedule('0 10 * * *', async () => {
      console.log('[Cron Service] Executing 30-Day Follow-Up Alert Job...');
      try {
        await this.runFollowUpAlerts();
      } catch (error) {
        console.error('[Cron Service] Follow-Up Job Failed:', error);
      }
    });

    // 2. Data Retention Purge Job (Runs daily at Midnight)
    // Deletes inquiries stuck in "Pending" or "New" for exactly 35 days.
    cron.schedule('0 0 * * *', async () => {
      console.log('[Cron Service] Executing 35-Day Retention Purge Job...');
      try {
        await this.runRetentionPurge();
      } catch (error) {
        console.error('[Cron Service] Retention Purge Failed:', error);
      }
    });
  }

  private async runFollowUpAlerts() {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - 30);
    
    // Create a precise 24-hour window for exactly 30 days ago
    const startOfDay = new Date(thresholdDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(thresholdDate.setHours(23, 59, 59, 999));

    const pendingInquiries = await (prisma as any).inquiry.findMany({
      where: {
        status: { in: ['Pending', 'New'] },
        updatedAt: {
          gte: startOfDay,
          lte: endOfDay,
        }
      }
    });

    if (pendingInquiries.length === 0) {
      console.log('[Cron Service] No 30-day pending inquiries found today.');
      return;
    }

    for (const inquiry of pendingInquiries) {
      const { customerName, email, phone, destination } = inquiry;
      
      const emailSubject = `Important update regarding your trip to ${destination}`;
      const messageBody = `Hi ${customerName},\n\nWe noticed your inquiry for ${destination} is still pending. Our bespoke packages are in high demand and prices may change soon.\n\nAre you still planning your luxury trip with Kashmir Curators? Please reply to this message to confirm, or let us know if you need any adjustments to your itinerary.\n\nWarm regards,\nThe Kashmir Curators Team`;
      
      // Send Email
      if (email && email.includes('@')) {
        await notificationService.sendCustomerEmail(email, emailSubject, `<p>${messageBody.replace(/\n/g, '<br/>')}</p>`);
      }

      // Send WhatsApp
      if (phone) {
        await WhatsAppWorkflowEngine.executeWhatsAppSenderNode(phone, messageBody);
      }

      console.log(`[Cron Service] Dispatched 30-day alerts to ${customerName} (${email} / ${phone})`);
    }
  }

  private async runRetentionPurge() {
    const purgeDate = new Date();
    purgeDate.setDate(purgeDate.getDate() - 35);

    const result = await (prisma as any).inquiry.deleteMany({
      where: {
        status: { in: ['Pending', 'New', 'Lost'] },
        updatedAt: {
          lt: purgeDate
        }
      }
    });

    console.log(`[Cron Service] Security Retention Purge: Deleted ${result.count} stale inquiries older than 35 days.`);
  }
}

export const cronService = new CronService();
