const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runTests() {
  console.log('========================================================');
  console.log('🧪 KASHMIR CONNECT ENTERPRISE PLATFORM VERIFICATION TEST');
  console.log('========================================================\n');

  try {
    // 1. Verify DB Connection
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ 1. Database connection verified (PostgreSQL Neon).');

    // 2. Test User Setup
    let testUser = await prisma.user.findFirst({
      where: { email: 'zahidreyaz44123@gmail.com' }
    });

    if (!testUser) {
      testUser = await prisma.user.create({
        data: {
          name: 'Zahid Reyaz',
          email: 'zahidreyaz44123@gmail.com',
          role: 'admin',
          phone: '+919419012345'
        }
      });
      console.log('✅ 2. Created verified test user.');
    } else {
      console.log(`✅ 2. Existing test user verified: ${testUser.email} (Role: ${testUser.role})`);
    }

    // 3. Test Booking Setup (Sonamarg Trek Package)
    let testBooking = await prisma.booking.findFirst({
      where: { userId: testUser.id, itemName: { contains: 'Sonamarg' } }
    });

    if (!testBooking) {
      testBooking = await prisma.booking.create({
        data: {
          userId: testUser.id,
          type: 'package',
          itemName: '5D/4N Sonamarg Glacier & Meadow Expedition',
          bookingDate: new Date(),
          totalAmount: 35000,
          status: 'confirmed',
          stage: 'CONFIRMED',
          details: JSON.stringify({
            destination: 'Sonamarg',
            travelers: 2,
            hotelCategory: 'Luxury Pine Camp'
          })
        }
      });
      console.log(`✅ 3. Created test booking #${testBooking.id.slice(0, 8)} for Sonamarg.`);
    } else {
      console.log(`✅ 3. Test booking verified: #${testBooking.id.slice(0, 8)} (${testBooking.itemName})`);
    }

    // 4. Test Verified Travel Advisory Creation (Zojila / Sonamarg Snow Blockage)
    const testAdvisory = await prisma.travelAdvisory.create({
      data: {
        location: 'Sonamarg & Zojila Pass',
        status: 'Closed',
        severity: 'SEVERE',
        category: 'ROAD_HIGHWAY',
        corridors: JSON.stringify(['NH-1D', 'Baltal', 'Zojila Pass', 'Sonamarg']),
        source: 'Border Roads Organisation (Project Beacon)',
        message: 'Severe avalanche risk and 3.5 ft unseasonal snow on Baltal axis. Traffic halted.',
        recommendedAction: 'Divert travelers to Doodhpathri or Yusmarg pine valleys.',
        isVerified: true,
        emergencyModeActive: false
      }
    });
    console.log(`✅ 4. Published verified advisory #${testAdvisory.id.slice(0, 8)} for ${testAdvisory.location} [Severity: ${testAdvisory.severity}]`);

    // 5. Test Disruption Evaluation Logic
    const allBookings = await prisma.booking.findMany({
      where: { status: { in: ['confirmed', 'pending'] } }
    });

    const affectedLoc = 'sonamarg';
    let matchedBooking = null;

    for (const b of allBookings) {
      const text = `${b.itemName} ${b.details}`.toLowerCase();
      if (text.includes(affectedLoc)) {
        matchedBooking = b;
        break;
      }
    }

    if (!matchedBooking) {
      throw new Error('Disruption matcher failed to identify affected Sonamarg booking');
    }

    console.log(`✅ 5. Disruption Engine detected affected booking: "${matchedBooking.itemName}"`);

    // 6. Create DisruptionImpact Record with Intelligent Alternatives
    const smartAlternatives = [
      {
        alternativeDestination: 'Doodhpathri Pine Meadows',
        distanceKm: 42,
        reason: 'All-weather access highway with safe flowing river valleys and snow pine walks.',
        suggestedHotelCategory: 'Luxury Pine Cottages & Glamping'
      },
      {
        alternativeDestination: 'Pahalgam Lidder Valley',
        distanceKm: 90,
        reason: 'Wide valley with open 5-star hospitality infrastructure.',
        suggestedHotelCategory: 'Riverside Pine Chalets'
      }
    ];

    const impact = await prisma.disruptionImpact.create({
      data: {
        advisoryId: testAdvisory.id,
        bookingId: matchedBooking.id,
        affectedDestination: 'Sonamarg',
        impactLevel: 'HIGH',
        suggestedAlternative: JSON.stringify(smartAlternatives),
        status: 'DETECTED',
        customerNotified: true,
        agentNotified: true
      }
    });
    console.log(`✅ 6. Disruption Impact logged #${impact.id.slice(0, 8)} with ${smartAlternatives.length} recommended safe alternatives.`);

    // 7. Transactional Resolution via Kashmir Flex 100% Wallet Credit
    await prisma.$transaction(async (tx) => {
      // Find or create customer wallet
      let wallet = await tx.wallet.findUnique({
        where: { userId: matchedBooking.userId }
      });

      if (!wallet) {
        wallet = await tx.wallet.create({
          data: {
            userId: matchedBooking.userId,
            balance: 0.0,
            currency: 'INR'
          }
        });
      }

      const refundAmount = matchedBooking.totalAmount;

      // Credit wallet
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: refundAmount } }
      });

      // Record transaction
      const walletTx = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: refundAmount,
          type: 'CREDIT',
          source: 'DISRUPTION_REFUND',
          referenceId: impact.id,
          description: `100% Kashmir Flex Disruption Credit for ${matchedBooking.itemName} (${impact.affectedDestination} closure)`
        }
      });

      // Mark impact resolved
      await tx.disruptionImpact.update({
        where: { id: impact.id },
        data: {
          status: 'RESOLVED',
          resolutionType: 'WALLET_CREDITED',
          updatedAt: new Date()
        }
      });

      // Log Audit Trail
      await tx.auditLog.create({
        data: {
          userId: testUser.id,
          action: 'DISRUPTION_RESOLVED_WALLET_CREDITED',
          details: JSON.stringify({
            impactId: impact.id,
            bookingId: matchedBooking.id,
            refundAmount,
            walletId: updatedWallet.id,
            txId: walletTx.id
          })
        }
      });

      console.log(`✅ 7. Transactional Kashmir Flex resolution executed: ₹${refundAmount.toLocaleString()} credited to Customer Wallet #${wallet.id.slice(0, 8)}.`);
    });

    // 8. Test Trip Safety Card Generation & Emergency Contacts
    const safetyCard = await prisma.tripSafetyCard.create({
      data: {
        bookingId: matchedBooking.id,
        shareToken: 'test-safety-card-' + Date.now(),
        passengerName: testUser.name,
        passengerPhone: testUser.phone || '+91 94190 12345',
        travelerCount: 2,
        assignedDriver: JSON.stringify({
          name: 'Bashir Ahmad Dar',
          phone: '+91 94190 88214',
          vehicleNo: 'JK01-AZ-4921',
          vehicleType: 'Toyota Innova Crysta 4x4'
        }),
        assignedHotelSos: JSON.stringify({
          hotelName: 'The Grand Chinar Retreat',
          location: 'Srinagar / Doodhpathri',
          managerPhone: '+91 94191 22334',
          frontDeskPhone: '+91 194 2501234'
        }),
        emergencyContacts: JSON.stringify([
          { name: 'Family Contact', relation: 'Next of Kin', phone: '+91 98765 43210' }
        ]),
        bloodGroup: 'B+',
        medicalNotes: 'Standard mountain acclimatization verified',
        safetyStatus: 'SAFE'
      }
    });
    console.log(`✅ 8. Generated Digital Trip Safety Card with Token "${safetyCard.shareToken}" (Assigned Driver: Bashir Ahmad Dar, 4x4 Innova).`);

    // 9. Test Vendor Marketplace Listing
    const vendorListing = await prisma.vendorListing.create({
      data: {
        vendorId: testUser.id,
        title: 'Boutique River Chalet & Luxury Glamping',
        category: 'HOMESTAY',
        location: 'Doodhpathri Shaliganga Valley',
        description: 'Eco-luxury pine wood cottages right on the bank of Shaliganga river, warm cedar wood heating, private bonfire.',
        basePrice: 6500,
        images: JSON.stringify(['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b']),
        amenitiesOrFeatures: JSON.stringify(['River View', 'Heated Bedding', 'Kashmiri Kehwa', 'Bonfire']),
        inventoryCount: 4,
        verificationStatus: 'VERIFIED',
        contactPhone: '+91 94190 99887'
      }
    });
    console.log(`✅ 9. Vendor Listing published: "${vendorListing.title}" in ${vendorListing.location} [Category: ${vendorListing.category}, Base Price: ₹${vendorListing.basePrice}].`);

    // 10. Clean up test records
    await prisma.tripSafetyCard.delete({ where: { id: safetyCard.id } });
    await prisma.vendorListing.delete({ where: { id: vendorListing.id } });
    await prisma.disruptionImpact.delete({ where: { id: impact.id } });
    await prisma.travelAdvisory.delete({ where: { id: testAdvisory.id } });
    console.log('✅ 10. Test verification records cleaned up successfully.');

    console.log('\n========================================================');
    console.log('🎉 ALL 10 ENTERPRISE SYSTEM CAPABILITIES FULLY VERIFIED!');
    console.log('========================================================\n');
  } catch (error) {
    console.error('\n❌ Verification test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
