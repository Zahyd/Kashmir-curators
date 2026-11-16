import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import prisma from '../lib/prisma';

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
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 5000, // 5s connection timeout
      greetingTimeout: 5000,   // 5s greeting timeout
      socketTimeout: 10000     // 10s socket inactivity timeout
    })
  : null;

export const notificationService = {
  /**
   * Send an automated email with provider tracking, fallback and database audit logging
   */
  async sendTrackedEmail(params: {
    reservationId?: string;
    emailType: string;
    to: string;
    recipientName?: string;
    subject: string;
    html: string;
    idempotencyKey?: string;
  }): Promise<{ success: boolean; messageId?: string; provider: string; error?: string }> {
    const { reservationId, emailType, to, recipientName, subject, html, idempotencyKey } = params;
    const p = prisma as any;

    // 1. Idempotency Check: if already sent successfully with this idempotency key, return existing record
    if (idempotencyKey) {
      try {
        const existing = await p.emailDispatchRecord.findUnique({
          where: { idempotencyKey }
        });
        if (existing && existing.status === 'SENT') {
          console.log(`[NotificationService] Idempotency match for key ${idempotencyKey}, skipping duplicate.`);
          return { success: true, messageId: existing.messageId, provider: existing.provider };
        }
      } catch (err) {
        // Continue if DB check fails
      }
    }

    let status = 'PENDING';
    let provider = 'SYSTEM';
    let messageId: string | undefined;
    let errorMessage: string | undefined;
    let success = false;

    // 2. Try Gmail SMTP first if available
    if (transporter) {
      try {
        console.log(`[Nodemailer] Dispatching ${emailType} to ${to} via Gmail SMTP...`);
        const info = await transporter.sendMail({
          from: `"Kashmir Curators Operations" <${process.env.GMAIL_USER}>`,
          to,
          subject,
          html,
        });
        provider = 'GMAIL_SMTP';
        messageId = info?.messageId || `gmail-${Date.now()}`;
        status = 'SENT';
        success = true;
        console.log(`[Nodemailer] Successfully delivered message ${messageId}`);
      } catch (smtpErr: any) {
        console.error('[Nodemailer] Gmail SMTP failure:', smtpErr.message || smtpErr);
        errorMessage = `Gmail SMTP: ${smtpErr.message || smtpErr}`;
      }
    }

    // 3. Fallback to Resend if Gmail did not succeed
    if (!success && process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 're_mock_key_123') {
      try {
        const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
        console.log(`[Resend] Dispatching ${emailType} to ${to}...`);
        const { data, error } = await resend.emails.send({
          from: `Kashmir Curators <${fromEmail}>`,
          to,
          subject,
          html,
        });

        if (error) {
          console.error('[Resend] API Error:', error);
          errorMessage = (errorMessage ? errorMessage + ' | ' : '') + `Resend: ${error.message || JSON.stringify(error)}`;
        } else if (data?.id) {
          provider = 'RESEND';
          messageId = data.id;
          status = 'SENT';
          success = true;
          errorMessage = undefined;
          console.log(`[Resend] Message dispatched successfully with ID ${messageId}`);
        }
      } catch (resendErr: any) {
        console.error('[Resend] Exception:', resendErr.message || resendErr);
        errorMessage = (errorMessage ? errorMessage + ' | ' : '') + `Resend Exception: ${resendErr.message || resendErr}`;
      }
    }

    // 4. Fallback simulation mode if neither provider is active
    if (!success && !transporter && (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 're_mock_key_123')) {
      provider = 'SIMULATION';
      messageId = `sim-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      status = 'SENT';
      success = true;
      console.log(`[SIMULATED EMAIL] To: ${to} | Subject: ${subject} | ID: ${messageId}`);
    }

    if (!success) {
      status = 'FAILED';
    }

    // 5. Audit Log to Database (EmailDispatchRecord)
    if (reservationId) {
      try {
        await p.emailDispatchRecord.create({
          data: {
            reservationId,
            emailType,
            recipientEmail: to,
            recipientName: recipientName || null,
            subject,
            status,
            provider,
            messageId: messageId || null,
            errorMessage: errorMessage || null,
            idempotencyKey: idempotencyKey || null,
            deliveryMetadata: JSON.stringify({
              timestamp: new Date().toISOString(),
              to,
              subject
            })
          }
        });
      } catch (logErr: any) {
        console.error('[NotificationService] Failed to record EmailDispatchRecord:', logErr.message);
      }
    }

    return {
      success,
      messageId,
      provider,
      error: errorMessage
    };
  },

  /**
   * Send an automated email to a customer (legacy wrapper)
   */
  async sendCustomerEmail(to: string, subject: string, html: string) {
    const result = await this.sendTrackedEmail({
      emailType: 'CUSTOMER_NOTIFICATION',
      to,
      subject,
      html
    });
    return result.success;
  },

  /**
   * Blast an event via WebSocket and save it to the persistent Notification log
   */
  async emitSystemEvent(io: any, type: string, message: string, data: any) {
    // 1. Determine priority, type, and redirect link
    let priority = 'medium';
    let title = 'System Update';
    let notificationType = 'info';
    let redirectLink = '/admin';

    if (data && data.entityType === 'inquiry') {
      if (data.leadStage === 'PAYMENT_RECEIVED') {
        title = 'Payment Received';
        notificationType = 'payment';
        priority = 'high';
      } else if (data.leadStage === 'CONFIRMED') {
        title = 'Curation Confirmed';
        notificationType = 'booking';
        priority = 'high';
      } else {
        title = 'New Inquiry Request';
        notificationType = 'inquiry';
        priority = 'high';
      }
      redirectLink = '/admin';
    } else if (data && data.entityType === 'booking') {
      title = 'New Booking Alert';
      notificationType = 'booking';
      priority = 'high';
      redirectLink = '/admin';
    } else if (type === 'PAYMENT') {
      title = 'Payment Received';
      notificationType = 'payment';
      priority = 'high';
      redirectLink = '/admin';
    } else if (type === 'ATTENDANCE' || (data && data.entityType === 'attendance')) {
      title = data?.action === 'CLOCK_IN' ? 'Employee Clock-In' : data?.action === 'CLOCK_OUT' ? 'Employee Shift Ended' : 'Employee Break Status';
      notificationType = 'attendance';
      priority = 'medium';
      redirectLink = '/admin?section=attendance';
    }

    // 2. Save notification to the database
    let savedNotification = null;
    try {
      const p = prisma as any;
      savedNotification = await p.notification.create({
        data: {
          title,
          message,
          type: notificationType,
          priority,
          link: redirectLink,
          read: false
        }
      });
      console.log(`[NotificationService] Persistent alert recorded in db: ${savedNotification.id}`);
    } catch (dbErr: any) {
      console.error('[NotificationService] Failed to persist alert to db:', dbErr.message);
    }

    // 3. Emit real-time WebSockets
    if (io) {
      // Broadcast to the admin room for CRM updates
      io.to('admin-room').emit('new-system-event', {
        type,
        message,
        booking: data,
        notification: savedNotification,
        timestamp: new Date().toISOString()
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
    }
  },

  /**
   * Combined Automatic Action: Send Email + Emit Socket
   */
  async triggerInquiryReceived(io: any, inquiry: any) {
    // 1. Emit to system
    await this.emitSystemEvent(
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
    await this.emitSystemEvent(
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
   * 1. Hotel Availability Request
   */
  async sendHotelAvailabilityRequest(reservation: any, publicUrl: string, idempotencyKey?: string) {
    const to = reservation.receptionEmail || reservation.hotel?.contactEmail || 'operations@kashmircurators.com';
    const hotelName = reservation.hotel?.name || 'Hotel Partner';
    const subject = `INVENTORY CHECK: Room Availability Request - ${reservation.guestName} (${reservation.roomsCount} Rooms)`;
    const checkInDate = new Date(reservation.checkIn).toLocaleDateString('en-IN', { dateStyle: 'medium' });
    const checkOutDate = new Date(reservation.checkOut).toLocaleDateString('en-IN', { dateStyle: 'medium' });

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6; max-width: 620px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 28px; border-radius: 18px; background: #ffffff;">
        <div style="text-align: center; border-bottom: 2px solid #b5852a; padding-bottom: 16px; margin-bottom: 24px;">
          <h2 style="color: #b5852a; margin: 0; font-size: 22px; letter-spacing: 1.5px; font-weight: 900;">KASHMIR CURATORS</h2>
          <span style="font-size: 10px; font-weight: 800; color: #64748b; letter-spacing: 2px; text-transform: uppercase;">Hospitality Partner Network • Availability Desk</span>
        </div>
        <p style="font-size: 14px;">Dear Front Desk Team at <strong>${hotelName}</strong>,</p>
        <p style="font-size: 14px;">We have an urgent reservation request for our verified guest. Please confirm room availability below:</p>
        
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr><td style="padding: 6px 0; color: #64748b; font-weight: 600;">Reference:</td><td style="padding: 6px 0; font-weight: 700; color: #0f172a;">${reservation.bookingReference || 'N/A'}</td></tr>
            <tr><td style="padding: 6px 0; color: #64748b; font-weight: 600;">Guest Name:</td><td style="padding: 6px 0; font-weight: 700; color: #0f172a;">${reservation.guestName} (${reservation.adults || 2} Adults, ${reservation.children || 0} Children)</td></tr>
            <tr><td style="padding: 6px 0; color: #64748b; font-weight: 600;">Dates:</td><td style="padding: 6px 0; font-weight: 700; color: #0f172a;">${checkInDate} — ${checkOutDate}</td></tr>
            <tr><td style="padding: 6px 0; color: #64748b; font-weight: 600;">Room Category:</td><td style="padding: 6px 0; font-weight: 700; color: #0f172a;">${reservation.roomType} (${reservation.roomsCount} Room[s])</td></tr>
            <tr><td style="padding: 6px 0; color: #64748b; font-weight: 600;">Meal Plan:</td><td style="padding: 6px 0; font-weight: 700; color: #b5852a;">${reservation.mealPlan}</td></tr>
            ${reservation.specialRequests ? `<tr><td style="padding: 6px 0; color: #64748b; font-weight: 600;">Special Notes:</td><td style="padding: 6px 0; font-style: italic; color: #475569;">"${reservation.specialRequests}"</td></tr>` : ''}
          </table>
        </div>

        <div style="text-align: center; margin: 28px 0;">
          <a href="${publicUrl}" style="background-color: #0f172a; color: #ffffff; padding: 13px 28px; text-decoration: none; font-weight: 700; border-radius: 10px; display: inline-block; font-size: 13px; letter-spacing: 0.5px;">Verify Room Availability &rarr;</a>
        </div>
        <p style="font-size: 11px; color: #94a3b8; text-align: center;">Clicking allows you to hold or verify inventory directly without logging into an account.</p>
      </div>
    `;

    return await this.sendTrackedEmail({
      reservationId: reservation.id,
      emailType: 'AVAILABILITY_REQUEST',
      to,
      recipientName: reservation.hotel?.contactName,
      subject,
      html,
      idempotencyKey
    });
  },

  /**
   * 2. Hotel Reservation Confirmation Request
   */
  async sendHotelReservationRequest(reservation: any, publicUrl: string, idempotencyKey?: string) {
    const to = reservation.receptionEmail || reservation.hotel?.contactEmail || 'operations@kashmircurators.com';
    const hotelName = reservation.hotel?.name || 'Hotel Partner';
    const subject = `URGENT: Booking Confirmation Request - ${reservation.guestName} [${reservation.bookingReference || reservation.id.slice(0, 8)}]`;
    const checkInDate = new Date(reservation.checkIn).toLocaleDateString('en-IN', { dateStyle: 'medium' });
    const checkOutDate = new Date(reservation.checkOut).toLocaleDateString('en-IN', { dateStyle: 'medium' });

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6; max-width: 620px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 28px; border-radius: 18px; background: #ffffff;">
        <div style="text-align: center; border-bottom: 2px solid #b5852a; padding-bottom: 16px; margin-bottom: 24px;">
          <h2 style="color: #b5852a; margin: 0; font-size: 22px; letter-spacing: 1.5px; font-weight: 900;">KASHMIR CURATORS</h2>
          <span style="font-size: 10px; font-weight: 800; color: #64748b; letter-spacing: 2px; text-transform: uppercase;">Luxury Reservation Engine • Dispatch Desk</span>
        </div>
        <p style="font-size: 14px;">Dear Front Desk & Reservations Team at <strong>${hotelName}</strong>,</p>
        <p style="font-size: 14px;">Please review the confirmed reservation details below and generate your internal hotel CRS confirmation reference number:</p>
        
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr><td style="padding: 6px 0; color: #64748b; font-weight: 600; width: 35%;">Booking Reference:</td><td style="padding: 6px 0; font-weight: 800; color: #0f172a; font-family: monospace;">${reservation.bookingReference || reservation.id}</td></tr>
            <tr><td style="padding: 6px 0; color: #64748b; font-weight: 600;">Guest Name:</td><td style="padding: 6px 0; font-weight: 700; color: #0f172a;">${reservation.guestName}</td></tr>
            <tr><td style="padding: 6px 0; color: #64748b; font-weight: 600;">Occupancy:</td><td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${reservation.adults || 2} Adults, ${reservation.children || 0} Children</td></tr>
            <tr><td style="padding: 6px 0; color: #64748b; font-weight: 600;">Check-In:</td><td style="padding: 6px 0; font-weight: 700; color: #0f172a;">${checkInDate}</td></tr>
            <tr><td style="padding: 6px 0; color: #64748b; font-weight: 600;">Check-Out:</td><td style="padding: 6px 0; font-weight: 700; color: #0f172a;">${checkOutDate}</td></tr>
            <tr><td style="padding: 6px 0; color: #64748b; font-weight: 600;">Room Category:</td><td style="padding: 6px 0; font-weight: 700; color: #0f172a;">${reservation.roomType} (${reservation.roomsCount} Room[s])</td></tr>
            <tr><td style="padding: 6px 0; color: #64748b; font-weight: 600;">Meal Plan:</td><td style="padding: 6px 0; font-weight: 700; color: #b5852a;">${reservation.mealPlan}</td></tr>
            <tr><td style="padding: 6px 0; color: #64748b; font-weight: 600;">Agreed Net Tariff:</td><td style="padding: 6px 0; font-weight: 700; color: #059669;">INR ₹${reservation.contractRate?.toLocaleString('en-IN') || 'Contracted'} / night</td></tr>
            ${reservation.specialRequests ? `<tr><td style="padding: 6px 0; color: #64748b; font-weight: 600;">Special Requests:</td><td style="padding: 6px 0; font-style: italic; color: #475569;">"${reservation.specialRequests}"</td></tr>` : ''}
          </table>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${publicUrl}" style="background-color: #b5852a; color: #ffffff; padding: 14px 30px; text-decoration: none; font-weight: 800; border-radius: 12px; display: inline-block; font-size: 14px; box-shadow: 0 4px 12px rgba(181,133,42,0.3);">Open Hotel Reception Confirmation Desk &rarr;</a>
        </div>
        <p style="font-size: 11px; color: #94a3b8; text-align: center;">This single-click private portal link allows you to confirm with your hotel confirmation number, offer alternatives, or update availability instantly.</p>
        <div style="border-top: 1px solid #f1f5f9; margin-top: 24px; padding-top: 16px; font-size: 11px; text-align: center; color: #94a3b8;">
          Kashmir Curators Operations Desk • 24/7 Concierge Hotline: +91 88998 25591
        </div>
      </div>
    `;

    return await this.sendTrackedEmail({
      reservationId: reservation.id,
      emailType: 'CONFIRMATION_REQUEST',
      to,
      recipientName: reservation.hotel?.contactName,
      subject,
      html,
      idempotencyKey
    });
  },

  /**
   * 3. Hotel Booking Confirmation (Partner & Operations Record)
   */
  async sendHotelBookingConfirmedNotice(reservation: any, publicUrl: string) {
    const to = reservation.receptionEmail || reservation.hotel?.contactEmail || 'operations@kashmircurators.com';
    const hotelName = reservation.hotel?.name || 'Hotel Partner';
    const subject = `CONFIRMED: Hotel Reservation Guaranteed - ${reservation.guestName} [CRS: ${reservation.hotelConfirmationNumber || reservation.bookingReference}]`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6; max-width: 620px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 28px; border-radius: 18px; background: #ffffff;">
        <div style="text-align: center; border-bottom: 2px solid #059669; padding-bottom: 16px; margin-bottom: 24px;">
          <h2 style="color: #059669; margin: 0; font-size: 22px; font-weight: 900;">BOOKING GUARANTEED & CONFIRMED</h2>
          <span style="font-size: 10px; font-weight: 800; color: #64748b; letter-spacing: 2px; text-transform: uppercase;">Kashmir Curators • Hotel Operations</span>
        </div>
        <p style="font-size: 14px;">The reservation for <strong>${reservation.guestName}</strong> at <strong>${hotelName}</strong> has been fully confirmed and recorded.</p>
        
        <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 14px; padding: 20px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr><td style="padding: 6px 0; color: #065f46; font-weight: 600;">Hotel CRS Reference:</td><td style="padding: 6px 0; font-weight: 800; color: #065f46; font-size: 15px;">${reservation.hotelConfirmationNumber || 'CONFIRMED'}</td></tr>
            <tr><td style="padding: 6px 0; color: #065f46; font-weight: 600;">Curators Booking Ref:</td><td style="padding: 6px 0; font-weight: 700;">${reservation.bookingReference || reservation.id}</td></tr>
            <tr><td style="padding: 6px 0; color: #065f46; font-weight: 600;">Guest:</td><td style="padding: 6px 0; font-weight: 700;">${reservation.guestName}</td></tr>
            <tr><td style="padding: 6px 0; color: #065f46; font-weight: 600;">Room:</td><td style="padding: 6px 0; font-weight: 700;">${reservation.confirmedRoomType || reservation.roomType} (${reservation.roomsCount} Rooms)</td></tr>
            <tr><td style="padding: 6px 0; color: #065f46; font-weight: 600;">Meal Plan:</td><td style="padding: 6px 0; font-weight: 700;">${reservation.confirmedMealPlan || reservation.mealPlan}</td></tr>
            <tr><td style="padding: 6px 0; color: #065f46; font-weight: 600;">Confirmed Tariff:</td><td style="padding: 6px 0; font-weight: 700;">INR ₹${reservation.confirmedTariff || reservation.contractRate} / night</td></tr>
            ${reservation.receptionNotes ? `<tr><td style="padding: 6px 0; color: #065f46; font-weight: 600;">Reception Remarks:</td><td style="padding: 6px 0; font-style: italic;">"${reservation.receptionNotes}"</td></tr>` : ''}
          </table>
        </div>

        <div style="text-align: center; margin: 24px 0;">
          <a href="${publicUrl}" style="background-color: #059669; color: #ffffff; padding: 12px 26px; text-decoration: none; font-weight: 700; border-radius: 10px; display: inline-block; font-size: 13px;">View Live Reception Voucher &rarr;</a>
        </div>
      </div>
    `;

    return await this.sendTrackedEmail({
      reservationId: reservation.id,
      emailType: 'BOOKING_CONFIRMATION',
      to,
      subject,
      html
    });
  },

  /**
   * 4. Hotel Rejection or Alternative Accommodation Proposal
   */
  async sendHotelRejectionOrAlternativeNotice(reservation: any, altData?: any) {
    const to = reservation.createdById ? 'operations@kashmircurators.com' : 'operations@kashmircurators.com';
    const isAlternative = reservation.confirmationStage === 'ALTERNATIVE_OFFERED' || !!altData?.alternativeRoomType;
    const subject = isAlternative 
      ? `ALTERNATIVE OFFERED: Hotel Partner proposed alternative for ${reservation.guestName}`
      : `HOTEL DECLINED / SOLD OUT: ${reservation.hotel?.name || 'Hotel'} for ${reservation.guestName}`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6; max-width: 620px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 28px; border-radius: 18px; background: #ffffff;">
        <h2 style="color: ${isAlternative ? '#d97706' : '#dc2626'}; margin: 0; font-size: 20px;">
          ${isAlternative ? 'Alternative Accommodation Proposal' : 'Reservation Request Declined / Sold Out'}
        </h2>
        <p style="font-size: 14px; margin-top: 12px;">Partner hotel <strong>${reservation.hotel?.name || 'Property'}</strong> has updated reservation status for guest <strong>${reservation.guestName}</strong>.</p>
        
        <div style="background-color: ${isAlternative ? '#fffbeb' : '#fef2f2'}; border: 1px solid ${isAlternative ? '#fde68a' : '#fecaca'}; border-radius: 12px; padding: 18px; margin: 20px 0; font-size: 13px;">
          ${isAlternative ? `
            <p style="margin: 0 0 8px 0; font-weight: 700; color: #92400e;">Proposed Alternative:</p>
            <p style="margin: 4px 0;"><strong>Room Category:</strong> ${altData?.alternativeRoomType || reservation.alternativeRoomType || 'Upgraded Suite'}</p>
            <p style="margin: 4px 0;"><strong>Offered Tariff:</strong> INR ₹${altData?.alternativeTariff || reservation.alternativeTariff || 'As proposed'}</p>
            <p style="margin: 4px 0;"><strong>Dates:</strong> ${altData?.alternativeDates || reservation.alternativeDates || 'Same dates'}</p>
            <p style="margin: 4px 0;"><strong>Remarks:</strong> ${altData?.alternativeNotes || reservation.alternativeNotes || 'Subject to immediate acceptance'}</p>
          ` : `
            <p style="margin: 0 0 8px 0; font-weight: 700; color: #991b1b;">Decline Reason:</p>
            <p style="margin: 4px 0;">${reservation.rejectionReason || '100% Sold Out / No Available Inventory'}</p>
            ${reservation.receptionNotes ? `<p style="margin: 4px 0;"><strong>Notes:</strong> ${reservation.receptionNotes}</p>` : ''}
          `}
        </div>

        <p style="font-size: 13px; color: #475569;">Please review this in the Kashmir Curators Operations Dashboard to either accept the alternative or assign an alternative property.</p>
      </div>
    `;

    return await this.sendTrackedEmail({
      reservationId: reservation.id,
      emailType: isAlternative ? 'REJECTION_ALTERNATIVE' : 'HOTEL_DECLINED',
      to,
      subject,
      html
    });
  },

  /**
   * 5. Guest Booking Voucher (Sent to Primary Guest)
   */
  async sendGuestBookingVoucher(reservation: any, voucherUrl: string, idempotencyKey?: string) {
    const to = reservation.guestEmail;
    if (!to) {
      console.warn('[NotificationService] No guest email available for voucher dispatch');
      return { success: false, provider: 'SYSTEM', error: 'No guest email provided' };
    }

    const checkInDate = new Date(reservation.checkIn).toLocaleDateString('en-IN', { dateStyle: 'long' });
    const checkOutDate = new Date(reservation.checkOut).toLocaleDateString('en-IN', { dateStyle: 'long' });
    const hotelName = reservation.hotel?.name || 'Luxury Property';
    const subject = `Your Official Booking Voucher: ${hotelName} [Ref: ${reservation.bookingReference || reservation.id.slice(0, 8)}]`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6; max-width: 640px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 32px; border-radius: 20px; background: #ffffff;">
        <div style="text-align: center; border-bottom: 2px solid #b5852a; padding-bottom: 20px; margin-bottom: 28px;">
          <h1 style="color: #b5852a; margin: 0; font-size: 24px; font-weight: 900; letter-spacing: 2px;">KASHMIR CURATORS</h1>
          <span style="font-size: 11px; font-weight: 800; color: #64748b; letter-spacing: 3px; text-transform: uppercase;">Official Guest Accommodation Voucher</span>
        </div>

        <p style="font-size: 15px;">Dear <strong>${reservation.guestName}</strong>,</p>
        <p style="font-size: 14px;">We are pleased to confirm your upcoming stay in the Kashmir Valley. Your luxury reservation is confirmed and guaranteed:</p>

        <div style="background-color: #fafaf9; border: 1px solid #e7e5e4; border-radius: 16px; padding: 24px; margin: 24px 0;">
          <h3 style="margin: 0 0 16px 0; color: #0c0a09; font-size: 18px; border-bottom: 1px dashed #d6d3d1; padding-bottom: 10px;">${hotelName}</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr><td style="padding: 7px 0; color: #78716c; font-weight: 600;">Booking Reference:</td><td style="padding: 7px 0; font-weight: 800; color: #b5852a; font-family: monospace;">${reservation.bookingReference || reservation.id}</td></tr>
            ${reservation.hotelConfirmationNumber ? `<tr><td style="padding: 7px 0; color: #78716c; font-weight: 600;">Hotel Confirmation #:</td><td style="padding: 7px 0; font-weight: 800; color: #059669;">${reservation.hotelConfirmationNumber}</td></tr>` : ''}
            <tr><td style="padding: 7px 0; color: #78716c; font-weight: 600;">Check-In:</td><td style="padding: 7px 0; font-weight: 700; color: #1c1917;">${checkInDate} (14:00 onwards)</td></tr>
            <tr><td style="padding: 7px 0; color: #78716c; font-weight: 600;">Check-Out:</td><td style="padding: 7px 0; font-weight: 700; color: #1c1917;">${checkOutDate} (11:00 AM)</td></tr>
            <tr><td style="padding: 7px 0; color: #78716c; font-weight: 600;">Room Type:</td><td style="padding: 7px 0; font-weight: 700; color: #1c1917;">${reservation.confirmedRoomType || reservation.roomType} (${reservation.roomsCount} Room[s])</td></tr>
            <tr><td style="padding: 7px 0; color: #78716c; font-weight: 600;">Meal Plan:</td><td style="padding: 7px 0; font-weight: 700; color: #b5852a;">${reservation.confirmedMealPlan || reservation.mealPlan}</td></tr>
            <tr><td style="padding: 7px 0; color: #78716c; font-weight: 600;">Lead Guest:</td><td style="padding: 7px 0; font-weight: 700;">${reservation.guestName} (${reservation.adults || 2} Adults)</td></tr>
          </table>
        </div>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${voucherUrl}" style="background-color: #b5852a; color: #ffffff; padding: 15px 34px; text-decoration: none; font-weight: 800; border-radius: 12px; display: inline-block; font-size: 14px; box-shadow: 0 4px 14px rgba(181,133,42,0.35);">Download & Print Booking Voucher &rarr;</a>
        </div>

        <p style="font-size: 12px; color: #a8a29e; text-align: center;">Please present this digital voucher or government ID upon arrival at the hotel front desk.</p>
        <div style="border-top: 1px solid #f5f5f4; margin-top: 28px; padding-top: 18px; font-size: 11px; text-align: center; color: #a8a29e;">
          Kashmir Curators VIP Concierge • 24/7 Helpline: +91 88998 25591 • info@kashmircurators.com
        </div>
      </div>
    `;

    return await this.sendTrackedEmail({
      reservationId: reservation.id,
      emailType: 'GUEST_VOUCHER',
      to,
      recipientName: reservation.guestName,
      subject,
      html,
      idempotencyKey
    });
  },

  /**
   * 6. Booking Cancellation Notice
   */
  async sendBookingCancellationNotice(reservation: any, reason?: string) {
    const to = reservation.receptionEmail || reservation.hotel?.contactEmail || 'operations@kashmircurators.com';
    const subject = `CANCELLED: Booking Cancellation Notice - ${reservation.guestName} [${reservation.bookingReference || reservation.id}]`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6; max-width: 620px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 28px; border-radius: 18px; background: #ffffff;">
        <h2 style="color: #dc2626; margin: 0; font-size: 20px;">Reservation Cancelled</h2>
        <p style="font-size: 14px;">Please note that reservation <strong>${reservation.bookingReference || reservation.id}</strong> for guest <strong>${reservation.guestName}</strong> has been cancelled.</p>
        ${reason ? `<p style="font-size: 13px; color: #64748b;"><strong>Reason:</strong> ${reason}</p>` : ''}
        <p style="font-size: 13px; color: #64748b;">Any held rooms or inventory should be released back to available status immediately.</p>
      </div>
    `;

    return await this.sendTrackedEmail({
      reservationId: reservation.id,
      emailType: 'CANCELLATION',
      to,
      subject,
      html
    });
  },

  /**
   * 7. Hotel Response Reminder (Automated background trigger)
   */
  async sendHotelResponseReminder(reservation: any, publicUrl: string) {
    const to = reservation.receptionEmail || reservation.hotel?.contactEmail || 'operations@kashmircurators.com';
    const hotelName = reservation.hotel?.name || 'Hotel Partner';
    const subject = `REMINDER: Pending Reservation Response Required - ${reservation.guestName} [${reservation.bookingReference || reservation.id}]`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6; max-width: 620px; margin: 0 auto; border: 1px solid #fef08a; padding: 28px; border-radius: 18px; background: #ffffff;">
        <div style="background-color: #fefce8; border: 1px solid #fde047; padding: 12px 18px; border-radius: 10px; margin-bottom: 20px; font-weight: 700; color: #854d0e; font-size: 14px;">
          URGENT: Awaiting Response from Front Desk
        </div>
        <p style="font-size: 14px;">Dear Team at <strong>${hotelName}</strong>,</p>
        <p style="font-size: 14px;">We are awaiting your confirmation response for guest <strong>${reservation.guestName}</strong> checking in on <strong>${new Date(reservation.checkIn).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</strong>.</p>
        
        <div style="text-align: center; margin: 28px 0;">
          <a href="${publicUrl}" style="background-color: #ca8a04; color: #ffffff; padding: 13px 28px; text-decoration: none; font-weight: 700; border-radius: 10px; display: inline-block; font-size: 13px;">Review & Acknowledge Reservation &rarr;</a>
        </div>
      </div>
    `;

    return await this.sendTrackedEmail({
      reservationId: reservation.id,
      emailType: 'REMINDER',
      to,
      subject,
      html
    });
  },

  /**
   * 8. Employee Reservation Notification (Internal alert)
   */
  async sendEmployeeReservationAlert(employeeEmail: string, employeeName: string, reservation: any, eventType: string, message: string) {
    const subject = `[Ops Alert] ${eventType}: ${reservation.guestName} - ${reservation.hotel?.name || 'Hotel'}`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6; max-width: 580px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 24px; border-radius: 16px;">
        <h3 style="color: #0f172a; margin-top: 0;">Reservation Operational Notification</h3>
        <p>Hello ${employeeName},</p>
        <p><strong>${eventType}:</strong> ${message}</p>
        <p><strong>Booking Ref:</strong> ${reservation.bookingReference || reservation.id}</p>
        <p><strong>Guest:</strong> ${reservation.guestName}</p>
        <p><strong>Hotel:</strong> ${reservation.hotel?.name || 'Property'}</p>
      </div>
    `;

    return await this.sendTrackedEmail({
      reservationId: reservation.id,
      emailType: 'EMPLOYEE_NOTIFICATION',
      to: employeeEmail,
      recipientName: employeeName,
      subject,
      html
    });
  }
};
