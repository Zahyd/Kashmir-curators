import { Resend } from 'resend';
import nodemailer from 'nodemailer';

// Configure the Resend client
const resend = new Resend(process.env.RESEND_API_KEY || 're_mock_key_123');

// Configure Nodemailer transporter (Gmail SMTP)
const transporter = process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD && process.env.GMAIL_APP_PASSWORD !== 'your_16_char_app_password'
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    })
  : null;

export const notificationService = {
  /**
   * Send an automated email to a customer
   */
  async sendCustomerEmail(to: string, subject: string, html: string) {
    // 1. Try Gmail SMTP if configured with a real App Password (recommended for direct testing)
    if (transporter) {
      try {
        console.log(`[Nodemailer] Dispatching email to ${to} via Gmail SMTP...`);
        await transporter.sendMail({
          from: `"Kashmir Curators" <${process.env.GMAIL_USER}>`,
          to,
          subject,
          html,
        });
        console.log('[Nodemailer] Email dispatched successfully.');
        return true;
      } catch (error: any) {
        console.error('[Nodemailer] Gmail SMTP failed, falling back to Resend:', error.message || error);
      }
    }

    if (!process.env.RESEND_API_KEY) {
      console.warn('Email not sent: RESEND_API_KEY and Gmail SMTP credentials missing in .env. Running in simulation mode.');
      console.log(`[SIMULATED EMAIL] To: ${to} | Subject: ${subject}`);
      return false;
    }

    try {
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
      const { data, error } = await resend.emails.send({
        from: `Kashmir Curators <${fromEmail}>`,
        to,
        subject,
        html,
      });
      
      if (error) {
        console.error('Error sending email via Resend API:', error);
        return false;
      }

      console.log('Message sent successfully via Resend. ID: %s', data?.id);
      return true;
    } catch (error) {
      console.error('Exception sending email via Resend:', (error as any).message || error);
      return false;
    }
  },

  /**
   * Blast an event via WebSocket
   */
  emitSystemEvent(io: any, type: string, message: string, data: any) {
    if (!io) return;
    
    // Broadcast to the admin room for CRM updates
    io.to('admin-room').emit('new-system-event', {
      type,
      message,
      booking: data
    });

    // If there's a specific user ID, broadcast to their personal room
    if (data && data.userId) {
      io.to(`user-${data.userId}`).emit(`${type.toLowerCase()}-updated`, { type, data });
    }
  },

  /**
   * Combined Automatic Action: Send Email + Emit Socket
   */
  async triggerInquiryReceived(io: any, inquiry: any) {
    // 1. Emit to system
    this.emitSystemEvent(
      io, 
      'CREATE', 
      `New Lead: ${inquiry.customerName} interested in ${inquiry.destination}`, 
      { ...inquiry, entityType: 'inquiry' }
    );

    // 2. Send Email
    const subject = "Your Kashmir Curators Request is Received!";
    const html = `
      <div style="font-family: sans-serif; color: #333; line-height: 1.6;">
        <h2 style="color: #b5852a;">Hello ${inquiry.customerName},</h2>
        <p>Thank you for submitting your trip request to <strong>Kashmir Curators</strong>!</p>
        <p>Our luxury travel experts have received your inquiry for <strong>${inquiry.destination}</strong> and are currently reviewing your preferences.</p>
        <p>We will be in touch shortly with a bespoke itinerary tailored just for you.</p>
        <br/>
        <p>Warm Regards,<br/><strong>The Kashmir Curators Team</strong></p>
      </div>
    `;
    await this.sendCustomerEmail(inquiry.email, subject, html);
  },

  /**
   * Manual Action: Send Proposal Quote
   */
  async triggerSendProposal(io: any, inquiry: any) {
    // 1. Emit to system
    this.emitSystemEvent(
      io, 
      'UPDATE', 
      `Proposal Sent to ${inquiry.customerName}`, 
      { ...inquiry, entityType: 'inquiry', status: 'Quote Sent' }
    );

    // 2. Send Email
    const subject = "Your Curated Kashmir Itinerary is Ready";
    const html = `
      <div style="font-family: sans-serif; color: #333; line-height: 1.6;">
        <h2 style="color: #b5852a;">Hello ${inquiry.customerName},</h2>
        <p>Great news! Our team has finished curating your bespoke itinerary.</p>
        <p>Please log in to your dashboard to review the proposal, or reply to this email if you have any immediate questions.</p>
        <br/>
        <p>Warm Regards,<br/><strong>The Kashmir Curators Sales Team</strong></p>
      </div>
    `;
    await this.sendCustomerEmail(inquiry.email, subject, html);
  }
};
