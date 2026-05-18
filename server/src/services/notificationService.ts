import { Resend } from 'resend';

// Configure the Resend client
const resend = new Resend(process.env.RESEND_API_KEY || 're_mock_key_123');

export const notificationService = {
  /**
   * Send an automated email to a customer
   */
  async sendCustomerEmail(to: string, subject: string, html: string) {
    if (!process.env.RESEND_API_KEY) {
      console.warn('Email not sent: RESEND_API_KEY missing in .env. Running in simulation mode.');
      console.log(`[SIMULATED EMAIL] To: ${to} | Subject: ${subject}`);
      return false;
    }

    try {
      const { data, error } = await resend.emails.send({
        from: 'Kashmir Curators <booking@thekashmircurators.com>',
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
