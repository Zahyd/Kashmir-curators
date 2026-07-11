import prisma from '../lib/prisma';
import { notificationService } from './notificationService';

export const bookingAutomationService = {
  /**
   * Orchestrate inquiry stage changes and run automated triggers
   */
  async handleStageTransition(inquiryId: string, newStage: string, io: any) {
    const p = prisma as any;

    try {
      // 1. Fetch current inquiry
      const inquiry = await p.inquiry.findUnique({
        where: { id: inquiryId },
        include: { hotelReservations: true }
      });

      if (!inquiry) {
        console.error(`[BookingAutomation] Inquiry ${inquiryId} not found`);
        return null;
      }

      // 2. Perform the update
      const updatedInquiry = await p.inquiry.update({
        where: { id: inquiryId },
        data: { leadStage: newStage }
      });

      console.log(`[BookingAutomation] Transitioned Inquiry ${inquiryId} to ${newStage}`);

      // 3. Write Audit Log
      await p.auditLog.create({
        data: {
          userId: inquiry.assignedTo || 'SYSTEM_ENGINE',
          action: 'STAGE_TRANSITION',
          details: JSON.stringify({
            inquiryId,
            oldStage: inquiry.leadStage,
            newStage,
            timestamp: new Date().toISOString()
          })
        }
      });

      // 4. Save persistent notification & emit system event
      const stageName = newStage.replace('_', ' ');
      await notificationService.emitSystemEvent(
        io,
        'UPDATE',
        `Lead Stage Update: ${inquiry.customerName}'s trip transitioned to ${stageName}`,
        { ...updatedInquiry, entityType: 'inquiry' }
      );

      // 5. Automated trigger execution based on target stage
      if (newStage === 'PAYMENT_RECEIVED') {
        await this.triggerAutoSupplierDispatch(updatedInquiry, io);
      } else if (newStage === 'CONFIRMED') {
        await this.triggerAutoVoucherGeneration(updatedInquiry, io);
      }

      return updatedInquiry;
    } catch (error: any) {
      console.error('[BookingAutomation] Failed to transition stage:', error.message);
      throw error;
    }
  },

  /**
   * Handle Razorpay / Stripe payment capture automation
   */
  async handlePaymentSuccess(bookingId: string, amount: number, paymentId: string, io: any) {
    const p = prisma as any;

    try {
      // 1. Fetch target booking
      const booking = await p.booking.findUnique({
        where: { id: bookingId }
      });

      if (!booking) {
        console.error(`[BookingAutomation] Booking ${bookingId} not found for payment success`);
        return;
      }

      // 2. Confirm booking status
      const updatedBooking = await p.booking.update({
        where: { id: bookingId },
        data: { status: 'confirmed', stage: 'CONFIRMED' }
      });

      // 3. Scan for associated inquiries and transition them to PAYMENT_RECEIVED
      // Find inquiry by searching booking details for inquiryId or matching email
      let inquiryId = '';
      try {
        const details = JSON.parse(booking.details);
        inquiryId = details.inquiryId;
      } catch (e) {}

      if (inquiryId) {
        await this.handleStageTransition(inquiryId, 'PAYMENT_RECEIVED', io);
      } else {
        // Fallback: Notify admins of unlinked confirmed payment
        await notificationService.emitSystemEvent(
          io,
          'PAYMENT',
          `Unlinked Payment Recorded: ₹${amount.toLocaleString()} received for booking ${booking.itemName}`,
          { ...updatedBooking, entityType: 'booking' }
        );
      }
    } catch (error: any) {
      console.error('[BookingAutomation] Payment trigger execution failed:', error.message);
    }
  },

  /**
   * Auto-dispatch B2B requests to hotels and transport suppliers
   */
  async triggerAutoSupplierDispatch(inquiry: any, io: any) {
    const p = prisma as any;
    console.log(`[BookingAutomation] Running Auto-Supplier Dispatch for Inquiry: ${inquiry.id}...`);

    try {
      // 1. Find all pending hotel reservations for this inquiry
      const reservations = await p.hotelReservation.findMany({
        where: { inquiryId: inquiry.id },
        include: { hotel: true }
      });

      if (reservations.length === 0) {
        console.log(`[BookingAutomation] No hotel reservations found for Inquiry ${inquiry.id} to dispatch`);
        return;
      }

      // 2. Automatically dispatch emails to hotels
      for (const res of reservations) {
        if (res.status === 'Pending') {
          console.log(`[BookingAutomation] Auto-dispatching reservation request to hotel: ${res.hotel.name} (${res.hotel.contactEmail})`);
          
          // Generate simulated partner url for confirmation review
          const publicUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/partner/reservation/${res.id}`;
          
          await notificationService.sendHotelReservationRequest(res, publicUrl);

          // Update reservation state to Sent
          await p.hotelReservation.update({
            where: { id: res.id },
            data: { status: 'Sent' }
          });

          // Log in operations log
          await notificationService.emitSystemEvent(
            io,
            'UPDATE',
            `Supplier Dispatched: Lodging request sent to ${res.hotel.name} for ${inquiry.customerName}`,
            { ...inquiry, entityType: 'inquiry' }
          );
        }
      }
    } catch (error: any) {
      console.error('[BookingAutomation] Auto supplier dispatch failed:', error.message);
    }
  },

  /**
   * Auto-generate vouchers and notify operations once all confirmations are locked in
   */
  async triggerAutoVoucherGeneration(inquiry: any, io: any) {
    const p = prisma as any;
    console.log(`[BookingAutomation] Auto-generating voucher alerts for inquiry: ${inquiry.id}`);

    try {
      // Dispatch a notification alerting operations that vouchers are ready to be exported
      await notificationService.emitSystemEvent(
        io,
        'UPDATE',
        `Ready for Voucher: All supplier bookings confirmed for ${inquiry.customerName}. Vouchers ready for export.`,
        { ...inquiry, entityType: 'inquiry' }
      );
    } catch (error: any) {
      console.error('[BookingAutomation] Auto voucher notification failed:', error.message);
    }
  }
};
