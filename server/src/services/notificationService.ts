import nodemailer from 'nodemailer';

// Configure the transporter with Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export const notificationService = {
  /**
   * Send an automated email to a customer
   */
  async sendCustomerEmail(to: string, subject: string, html: string) {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.warn('Email not sent: Gmail credentials missing in .env');
      return false;
    }

    try {
      const info = await transporter.sendMail({
        from: `"Kashmir Curators" <${process.env.GMAIL_USER}>`,
        to,
        subject,
        html,
      });
      console.log('Message sent: %s', info.messageId);
      return true;
    } catch (error) {
      console.error('Error sending email:', (error as any).message || error);
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
