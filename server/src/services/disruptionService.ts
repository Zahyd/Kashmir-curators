import prisma from '../lib/prisma';
import { io } from '../index';

export interface AlternativeRecommendation {
  alternativeDestination: string;
  reason: string;
  distanceKm: number;
  highlightActivities: string[];
  suggestedHotelCategory: string;
  estimatedPriceDiff: number;
}

// Proximity and alternative destination matrix for Kashmir Valley
export const DESTINATION_ALTERNATIVES: Record<string, AlternativeRecommendation[]> = {
  sonamarg: [
    {
      alternativeDestination: 'Doodhpathri',
      reason: 'Pristine pine meadows and flowing Shaliganga river with open highway access and less snowfall disruption.',
      distanceKm: 42,
      highlightActivities: ['Meadow Horse Rides', 'Riverbank Picnics', 'Pine Forest Trails'],
      suggestedHotelCategory: 'Luxury Pine Cottages & Glamping',
      estimatedPriceDiff: 0
    },
    {
      alternativeDestination: 'Yusmarg',
      reason: 'Tranquil alpine meadows near Doodhganga river with uninterrupted road connectivity.',
      distanceKm: 47,
      highlightActivities: ['Nilnag Lake Trek', 'Alpine Meadow Walks', 'Local Gujjar Culture'],
      suggestedHotelCategory: 'Boutique Forest Resorts',
      estimatedPriceDiff: -500
    },
    {
      alternativeDestination: 'Pahalgam',
      reason: 'Major all-weather tourist hub with five-star luxury infrastructure and year-round access.',
      distanceKm: 90,
      highlightActivities: ['Betaab Valley Tour', 'Aru Valley Stays', 'Lidder Riverwalk'],
      suggestedHotelCategory: 'Premium Riverside Resorts',
      estimatedPriceDiff: 1000
    }
  ],
  gulmarg: [
    {
      alternativeDestination: 'Pahalgam & Baisaran Valley',
      reason: 'Often termed "Mini Switzerland", offers lush coniferous meadows when high-altitude Gondola phases are closed.',
      distanceKm: 135,
      highlightActivities: ['Baisaran Valley Trek', 'Lidder River Valley', 'Mamleshwar Temple'],
      suggestedHotelCategory: 'Pine View Luxury Cottages',
      estimatedPriceDiff: 0
    },
    {
      alternativeDestination: 'Drung Waterfall & Tangmarg',
      reason: 'Lower elevation scenic frozen waterfalls and pine ravines without the high-altitude pass closures.',
      distanceKm: 14,
      highlightActivities: ['Drung Frozen Falls', 'Tangmarg Tea Gardens', 'Snow ATV Rides'],
      suggestedHotelCategory: 'Tangmarg Alpine Chalets',
      estimatedPriceDiff: -800
    }
  ],
  pahalgam: [
    {
      alternativeDestination: 'Gulmarg',
      reason: 'World-famous alpine resort with winter snow sports and Gondola cable car.',
      distanceKm: 135,
      highlightActivities: ['Gondola Ride', 'Skiing & Snowboarding', 'Apharwat Peak'],
      suggestedHotelCategory: 'Luxury Mountain Lodges',
      estimatedPriceDiff: 1500
    },
    {
      alternativeDestination: 'Doodhpathri',
      reason: 'Untouched lush meadows and riverside valleys, ideal quiet alternative to Pahalgam.',
      distanceKm: 85,
      highlightActivities: ['Shaliganga Stream Walk', 'Meadow Camping', 'Pony Treks'],
      suggestedHotelCategory: 'Eco Resort & Camps',
      estimatedPriceDiff: -500
    }
  ],
  gurez: [
    {
      alternativeDestination: 'Lolab Valley',
      reason: 'Known as the Land of Love and Beauty, lush green valley in Kupwara accessible when Razdan Pass is closed.',
      distanceKm: 80,
      highlightActivities: ['Kalaroos Caves', 'Lush Rice Terraces', 'Walnut Groves'],
      suggestedHotelCategory: 'Forest Rest Houses & Homestays',
      estimatedPriceDiff: -1000
    },
    {
      alternativeDestination: 'Sonamarg / Doodhpathri',
      reason: 'Majestic glacier viewpoints with standard highway access.',
      distanceKm: 100,
      highlightActivities: ['Thajiwas Glacier Trek', 'Pony Rides'],
      suggestedHotelCategory: 'Alpine Valley Resorts',
      estimatedPriceDiff: 500
    }
  ]
};

export class DisruptionService {
  /**
   * Evaluates an advisory against all active and upcoming bookings
   */
  async evaluateAdvisoryDisruption(advisoryId: string) {
    try {
      const advisory = await prisma.travelAdvisory.findUnique({
        where: { id: advisoryId }
      });

      if (!advisory) return { count: 0, impacts: [] };

      // If status is normal/open and severity is normal, no disruption to register
      const isSevere = ['WARNING', 'SEVERE', 'CRITICAL_EMERGENCY'].includes(advisory.severity) ||
        ['Closed', 'Caution', 'Restricted'].includes(advisory.status);

      if (!isSevere) {
        return { count: 0, message: 'Advisory is normal; no disruption impacts triggered.' };
      }

      const affectedLoc = advisory.location.toLowerCase();
      
      // Parse affected corridors if any
      let corridors: string[] = [];
      if (advisory.corridors) {
        try {
          corridors = JSON.parse(advisory.corridors);
        } catch {
          corridors = [advisory.corridors];
        }
      }

      // Fetch upcoming or confirmed bookings (today or future)
      const allBookings = await prisma.booking.findMany({
        where: {
          status: { in: ['confirmed', 'pending'] }
        },
        include: { user: true }
      });

      const matchedImpacts: any[] = [];

      for (const booking of allBookings) {
        let isAffected = false;
        const itemName = (booking.itemName || '').toLowerCase();
        let detailsStr = '';
        try {
          detailsStr = typeof booking.details === 'string' ? booking.details : JSON.stringify(booking.details || {});
        } catch {
          detailsStr = '';
        }

        const combinedText = `${itemName} ${detailsStr}`.toLowerCase();

        // Check if affected location or any corridor matches booking
        if (combinedText.includes(affectedLoc)) {
          isAffected = true;
        } else if (corridors.some(c => combinedText.includes(c.toLowerCase()))) {
          isAffected = true;
        }

        if (isAffected) {
          // Check if already impacted by this advisory
          const existing = await prisma.disruptionImpact.findFirst({
            where: {
              advisoryId: advisory.id,
              bookingId: booking.id
            }
          });

          if (!existing) {
            // Find suggested alternatives
            const suggestions = DESTINATION_ALTERNATIVES[affectedLoc] || [
              {
                alternativeDestination: 'Srinagar & Dal Lake Heritage',
                reason: 'Valley central hub with all-weather accessibility, luxury houseboats, and Mughal gardens.',
                distanceKm: 0,
                highlightActivities: ['Dal Lake Shikara', 'Old City Heritage Walk', 'Wazwan Dining'],
                suggestedHotelCategory: 'Luxury Houseboat / 5-Star City Hotel',
                estimatedPriceDiff: 0
              }
            ];

            const impact = await prisma.disruptionImpact.create({
              data: {
                advisoryId: advisory.id,
                bookingId: booking.id,
                affectedDestination: advisory.location,
                affectedDateFrom: advisory.validFrom || new Date(),
                affectedDateTo: advisory.validUntil,
                impactLevel: advisory.severity === 'CRITICAL_EMERGENCY' ? 'CRITICAL' : 'HIGH',
                suggestedAlternative: JSON.stringify(suggestions),
                status: 'DETECTED',
                customerNotified: false,
                agentNotified: false
              }
            });

            matchedImpacts.push(impact);

            // Emit real-time notification to user & admin room
            if (io) {
              io.to(`user-${booking.userId}`).emit('disruption-alert', {
                title: `Travel Advisory Notice: ${advisory.location}`,
                message: `Your booking "${booking.itemName}" is in an area experiencing: ${advisory.message}`,
                severity: advisory.severity,
                impactId: impact.id
              });

              io.to('admin-room').emit('new-system-event', {
                type: 'UPDATE',
                message: `Disruption Impact detected for Booking #${booking.id.slice(-6)} (${booking.itemName}) due to ${advisory.location} ${advisory.status}.`,
                booking: { entityType: 'disruption', impactId: impact.id }
              });
            }
          }
        }
      }

      return { count: matchedImpacts.length, impacts: matchedImpacts };
    } catch (error: any) {
      console.error('Error in evaluateAdvisoryDisruption:', error.message);
      throw error;
    }
  }

  /**
   * Resolves a disruption impact: Reroute, Reschedule, or Wallet Credit
   */
  async resolveDisruptionImpact(params: {
    impactId: string;
    resolutionType: 'REROUTED' | 'RESCHEDULED' | 'WALLET_CREDITED' | 'REFUNDED';
    selectedAlternative?: string;
    actionNotes?: string;
    performedByUserId?: string;
  }) {
    return await prisma.$transaction(async (tx) => {
      const impact = await tx.disruptionImpact.findUnique({
        where: { id: params.impactId },
        include: { advisory: true }
      });

      if (!impact) {
        throw new Error('Disruption impact record not found');
      }

      let booking = null;
      if (impact.bookingId) {
        booking = await tx.booking.findUnique({
          where: { id: impact.bookingId }
        });
      }

      // If Wallet Credit is chosen, deposit into customer wallet
      if (params.resolutionType === 'WALLET_CREDITED' && booking) {
        // Find or create customer wallet
        let wallet = await tx.wallet.findUnique({
          where: { userId: booking.userId }
        });

        if (!wallet) {
          wallet = await tx.wallet.create({
            data: {
              userId: booking.userId,
              balance: 0.0,
              currency: 'INR'
            }
          });
        }

        const refundAmount = booking.totalAmount;

        // Credit wallet
        await tx.wallet.update({
          where: { id: wallet.id },
          data: { balance: { increment: refundAmount } }
        });

        // Record transaction
        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            amount: refundAmount,
            type: 'CREDIT',
            source: 'DISRUPTION_REFUND',
            referenceId: impact.id,
            description: `100% Kashmir Flex Disruption Credit for ${booking.itemName} (${impact.affectedDestination} closure)`
          }
        });

        // Mark booking as cancelled due to disruption
        await tx.booking.update({
          where: { id: booking.id },
          data: { status: 'cancelled' }
        });
      } else if (params.resolutionType === 'REROUTED' && booking) {
        // Update booking details with new destination
        let detailsObj: any = {};
        try {
          detailsObj = typeof booking.details === 'string' ? JSON.parse(booking.details) : booking.details || {};
        } catch {
          detailsObj = {};
        }

        detailsObj.reroutedFrom = impact.affectedDestination;
        detailsObj.reroutedTo = params.selectedAlternative || 'Alternative Destination';
        detailsObj.reroutedAt = new Date().toISOString();

        await tx.booking.update({
          where: { id: booking.id },
          data: {
            itemName: `${booking.itemName} (Rerouted: ${params.selectedAlternative || 'Safe Corridor'})`,
            details: JSON.stringify(detailsObj)
          }
        });
      }

      // Update the impact record
      const updatedImpact = await tx.disruptionImpact.update({
        where: { id: impact.id },
        data: {
          status: 'RESOLVED',
          resolutionType: params.resolutionType,
          customerNotified: true,
          agentNotified: true,
          updatedAt: new Date()
        }
      });

      // Create Audit Log
      await tx.auditLog.create({
        data: {
          userId: params.performedByUserId || 'system',
          action: `DISRUPTION_RESOLVED_${params.resolutionType}`,
          details: JSON.stringify({
            impactId: impact.id,
            bookingId: impact.bookingId,
            resolutionType: params.resolutionType,
            alternative: params.selectedAlternative,
            notes: params.actionNotes
          })
        }
      });

      return updatedImpact;
    });
  }

  /**
   * Get all active disruptions and corridor status summary
   */
  async getCorridorStatusOverview() {
    const advisories = await prisma.travelAdvisory.findMany({
      orderBy: { lastUpdated: 'desc' }
    });

    const activeEmergency = advisories.some(
      a => a.emergencyModeActive || a.severity === 'CRITICAL_EMERGENCY'
    );

    const impactedCount = await prisma.disruptionImpact.count({
      where: { status: { in: ['DETECTED', 'NOTIFIED', 'ALTERNATIVE_PROPOSED'] } }
    });

    return {
      emergencyModeActive: activeEmergency,
      totalAdvisories: advisories.length,
      pendingDisruptionsCount: impactedCount,
      advisories
    };
  }
}

export const disruptionService = new DisruptionService();
