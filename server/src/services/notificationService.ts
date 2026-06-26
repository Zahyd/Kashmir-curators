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

    // Broadcast to everyone for live social proof / curation updates
    if (type === 'CREATE' && data) {
      if (data.entityType === 'inquiry') {
        io.emit('new-live-curation', {
          id: data.id,
          message: `Expedition to ${data.destination || 'Kashmir'} curated`,
          details: `${data.travelers || '2'} Travelers • for ${data.customerName || 'Explorer'}`,
          createdAt: data.createdAt || new Date()
        });
      } else if (data.entityType === 'booking') {
        let travelers = '2';
        try {
          const detailsParsed = data.details ? (typeof data.details === 'string' ? JSON.parse(data.details) : data.details) : {};
          travelers = detailsParsed.travelers || '2';
        } catch (e) {}
        io.emit('new-live-curation', {
          id: data.id,
          message: `${data.type === 'package' ? 'Luxury package' : data.type === 'hotel' ? 'Premium hotel' : 'Chauffeur cab'} secured: ${data.itemName}`,
          details: `${travelers} Guests from ${data.user?.name || 'Explorer'}`,
          createdAt: data.createdAt || new Date()
        });
      }
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
  },

  /**
   * Send B2B Reservation Request Email to Hotel Partner
   */
  async sendHotelReservationRequest(reservation: any, publicUrl: string) {
    const to = reservation.hotel.contactEmail || 'operations@kashmircurators.com';
    const subject = `URGENT: Booking Confirmation Request - Guest: ${reservation.guestName}`;
    const checkInDate = new Date(reservation.checkIn).toLocaleDateString('en-US', { dateStyle: 'long' });
    const checkOutDate = new Date(reservation.checkOut).toLocaleDateString('en-US', { dateStyle: 'long' });
    
    const html = `
      <div style="font-family: sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 25px; border-radius: 16px;">
        <div style="text-align: center; border-bottom: 2px solid #b5852a; padding-bottom: 15px; margin-bottom: 25px;">
          <h2 style="color: #b5852a; margin: 0; font-size: 24px; letter-spacing: 1px;">KASHMIR CURATORS</h2>
          <span style="font-size: 9px; font-weight: 900; color: #64748b; letter-spacing: 3px; text-transform: uppercase;">Luxury Reservation Engine</span>
        </div>
        <p>Dear Reservations Desk at <strong>${reservation.hotel.name}</strong>,</p>
        <p>Please review and confirm the following guest reservation details:</p>
        
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; font-weight: bold; color: #64748b; font-size: 13px; width: 40%;">Guest Name:</td>
              <td style="padding: 6px 0; color: #0f172a; font-size: 14px; font-weight: bold;">${reservation.guestName}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold; color: #64748b; font-size: 13px;">Check-In Date:</td>
              <td style="padding: 6px 0; color: #0f172a; font-size: 14px;">${checkInDate}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold; color: #64748b; font-size: 13px;">Check-Out Date:</td>
              <td style="padding: 6px 0; color: #0f172a; font-size: 14px;">${checkOutDate}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold; color: #64748b; font-size: 13px;">Room Type:</td>
              <td style="padding: 6px 0; color: #0f172a; font-size: 14px;">${reservation.roomType}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold; color: #64748b; font-size: 13px;">Number of Rooms:</td>
              <td style="padding: 6px 0; color: #0f172a; font-size: 14px;">${reservation.roomsCount} Room(s)</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold; color: #64748b; font-size: 13px;">Meal Plan:</td>
              <td style="padding: 6px 0; color: #0f172a; font-size: 14px; font-weight: bold; color: #b5852a;">${reservation.mealPlan}</td>
            </tr>
            ${reservation.specialRequests ? `
            <tr>
              <td style="padding: 6px 0; font-weight: bold; color: #64748b; font-size: 13px; vertical-align: top;">Special Requests:</td>
              <td style="padding: 6px 0; color: #334155; font-size: 13px; font-style: italic;">"${reservation.specialRequests}"</td>
            </tr>
            ` : ''}
          </table>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${publicUrl}" style="background-color: #b5852a; color: white; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 8px; display: inline-block; box-shadow: 0 4px 10px rgba(181,133,42,0.25); font-size: 14px;">Review & Acknowledge Booking</a>
        </div>
        
        <p style="font-size: 11px; color: #94a3b8; margin-top: 25px;">Note: This email contains a secure, private confirmation link generated dynamically for your property. Clicking allows you to instantly confirm room availability or reject this request.</p>
        
        <div style="border-top: 1px solid #e2e8f0; margin-top: 35px; padding-top: 20px; font-size: 11px; text-align: center; color: #94a3b8;">
          Kashmir Curators Operations Desk &copy; 2026. All rights reserved.
        </div>
      </div>
    `;
    return await this.sendCustomerEmail(to, subject, html);
  }
};
