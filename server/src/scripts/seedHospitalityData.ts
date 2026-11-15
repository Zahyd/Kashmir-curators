import prisma from '../lib/prisma';

async function main() {
  console.log('Seeding rich hospitality data into Neon DB...');

  const lalit = await prisma.hotel.findFirst({ where: { id: 'hotel-1' } });
  if (!lalit) {
    console.error('Hotel Lalit not found');
    return;
  }

  // 1. Fetch categories
  const categories = await prisma.roomCategory.findMany({ where: { hotelId: lalit.id } });
  const cat1 = categories[0] || null;
  const cat2 = categories[1] || categories[0] || null;

  // 2. Clear old test reservations for clean state
  await prisma.hotelReservation.deleteMany({ where: { hotelId: lalit.id } });
  await prisma.housekeepingTask.deleteMany({ where: { hotelId: lalit.id } });
  await prisma.maintenanceRequest.deleteMany({ where: { hotelId: lalit.id } });
  await prisma.seasonalRate.deleteMany({});

  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const inTwoDays = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
  const inFourDays = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

  // 3. Create Reservations
  // Res 1: Checked-In (In-house)
  await prisma.hotelReservation.create({
    data: {
      hotelId: lalit.id,
      bookingReference: 'KCH-9102',
      guestName: 'Dr. Rahul & Priya Sharma',
      guestEmail: 'rahul.sharma@aims.org',
      guestPhone: '+91 98201 54321',
      checkIn: yesterday,
      checkOut: inTwoDays,
      roomType: cat1 ? cat1.name : 'Deluxe Palace Suite',
      roomsCount: 1,
      mealPlan: 'MAP',
      specialRequests: 'Warm Kashmiri Kahwa upon arrival, central heating at 24C, extra feather quilt',
      status: 'Checked-In',
      paymentStatus: 'Paid',
      contractRate: 14500,
      totalAmount: 43500,
      hotelDues: 37500,
      profitMargin: 6000,
      assignedRoomNumber: '101',
      adults: 2,
      guestIdType: 'Aadhaar Card',
      guestIdNumber: 'XXXX-XXXX-4819',
      guestIdVerified: true,
      agentName: 'Chinar Luxury DMC'
    }
  });

  // Res 2: Confirmed Arrival Today
  await prisma.hotelReservation.create({
    data: {
      hotelId: lalit.id,
      bookingReference: 'KCH-8419',
      guestName: 'Vikram Malhotra & Family',
      guestEmail: 'v.malhotra@zenith-tech.in',
      guestPhone: '+91 98110 99887',
      checkIn: now,
      checkOut: inFourDays,
      roomType: cat2 ? cat2.name : 'Maharaja Heritage Suite',
      roomsCount: 1,
      mealPlan: 'CP',
      specialRequests: 'Bukhari pre-lit before arrival, airport pickup in 4x4 Fortuner requested',
      status: 'Confirmed',
      paymentStatus: 'Paid',
      contractRate: 28000,
      totalAmount: 112000,
      hotelDues: 96000,
      profitMargin: 16000,
      assignedRoomNumber: '201',
      adults: 3,
      guestIdType: 'Passport',
      guestIdNumber: 'Z8920194',
      guestIdVerified: true,
      agentName: 'Zahid Travels B2B'
    }
  });

  // Res 3: Pending Voucher for Approval
  await prisma.hotelReservation.create({
    data: {
      hotelId: lalit.id,
      bookingReference: 'KCH-7731',
      guestName: 'Zubair Al-Mansoor & Group',
      guestEmail: 'z.almansoor@riyadh-invest.sa',
      guestPhone: '+966 54 892 1045',
      checkIn: tomorrow,
      checkOut: inFourDays,
      roomType: cat1 ? cat1.name : 'Deluxe Palace Suite',
      roomsCount: 2,
      mealPlan: 'AP',
      specialRequests: 'Authentic Wazwan dinner, connecting suites, Dal Lake Shikara transfer',
      status: 'Pending',
      paymentStatus: 'Paid',
      contractRate: 14500,
      totalAmount: 87000,
      hotelDues: 75000,
      profitMargin: 12000,
      adults: 4,
      agentName: 'Gulf Express Travels'
    }
  });

  // Res 4: Checked-Out Today (Departure)
  await prisma.hotelReservation.create({
    data: {
      hotelId: lalit.id,
      bookingReference: 'KCH-6209',
      guestName: 'Ananya Roy',
      guestEmail: 'ananya.roy@creative-minds.io',
      guestPhone: '+91 97112 33445',
      checkIn: threeDaysAgo,
      checkOut: now,
      roomType: cat1 ? cat1.name : 'Deluxe Palace Suite',
      roomsCount: 1,
      mealPlan: 'EP',
      status: 'Checked-Out',
      paymentStatus: 'Paid',
      contractRate: 14500,
      totalAmount: 43500,
      hotelDues: 37500,
      profitMargin: 6000,
      assignedRoomNumber: '104',
      adults: 1,
      guestIdType: 'Aadhaar Card',
      guestIdNumber: 'XXXX-XXXX-9123',
      guestIdVerified: true,
      agentName: 'Direct Partner'
    }
  });

  // 4. Update physical rooms operational statuses to match real state
  // Room 101 -> OCCUPIED
  await prisma.hotelRoom.updateMany({
    where: { hotelId: lalit.id, roomNumber: '101' },
    data: { status: 'OCCUPIED', operationalStatus: 'OCCUPIED', housekeeping: 'CLEAN', bukhariActive: true }
  });

  // Room 201 -> OCCUPIED
  await prisma.hotelRoom.updateMany({
    where: { hotelId: lalit.id, roomNumber: '201' },
    data: { status: 'OCCUPIED', operationalStatus: 'OCCUPIED', housekeeping: 'CLEAN', bukhariActive: true }
  });

  // Room 104 -> AVAILABLE_DIRTY (just checked out)
  await prisma.hotelRoom.updateMany({
    where: { hotelId: lalit.id, roomNumber: '104' },
    data: { status: 'AVAILABLE', operationalStatus: 'AVAILABLE_DIRTY', housekeeping: 'DIRTY', bukhariActive: false }
  });

  // Room 203 -> MAINTENANCE
  await prisma.hotelRoom.updateMany({
    where: { hotelId: lalit.id, roomNumber: '203' },
    data: { status: 'MAINTENANCE', operationalStatus: 'UNDER_MAINTENANCE', housekeeping: 'DIRTY', bukhariActive: false }
  });

  // 5. Create Housekeeping Tasks
  await prisma.housekeepingTask.create({
    data: {
      hotelId: lalit.id,
      roomNumber: '104',
      taskType: 'TURNOVER',
      priority: 'HIGH',
      status: 'DIRTY',
      assignedTo: 'Ghulam Rasool',
      notes: 'Guest departed 10:30 AM. Complete linen turnover and Bukhari flue inspection.',
      linenChanged: true
    }
  });

  await prisma.housekeepingTask.create({
    data: {
      hotelId: lalit.id,
      roomNumber: '102',
      taskType: 'DAILY_CLEAN',
      priority: 'NORMAL',
      status: 'CLEAN',
      assignedTo: 'Bashir Ahmed',
      notes: 'Routine morning refresh completed. Fresh towels placed.',
      linenChanged: false
    }
  });

  await prisma.housekeepingTask.create({
    data: {
      hotelId: lalit.id,
      roomNumber: '103',
      taskType: 'INSPECTION',
      priority: 'NORMAL',
      status: 'INSPECTED',
      assignedTo: 'Tariq Mir',
      inspectedBy: 'Executive Housekeeper Farooq',
      notes: 'Quality inspection passed. Ready for next guest arrival.',
      linenChanged: true
    }
  });

  // 6. Create Maintenance Ticket
  await prisma.maintenanceRequest.create({
    data: {
      hotelId: lalit.id,
      roomNumber: '203',
      task: 'Radiator thermostatic valve replacement and pine wood sill waterproofing',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      cost: 2400,
      loggedBy: 'Chief Engineer Manzoor'
    }
  });

  // 7. Seed Seasonal Rates if categories exist
  if (cat1) {
    const curYear = now.getFullYear();
    await prisma.seasonalRate.createMany({
      data: [
        {
          categoryId: cat1.id,
          seasonName: 'Winter Snow & Ski Gold',
          startDate: new Date(curYear, 11, 15),
          endDate: new Date(curYear + 1, 1, 28),
          multiplier: 1.4,
          flatRate: 20300
        },
        {
          categoryId: cat1.id,
          seasonName: 'Spring Tulip & Almond Bloom',
          startDate: new Date(curYear, 2, 15),
          endDate: new Date(curYear, 3, 30),
          multiplier: 1.25,
          flatRate: 18125
        },
        {
          categoryId: cat1.id,
          seasonName: 'Summer Peak Leisure',
          startDate: new Date(curYear, 4, 1),
          endDate: new Date(curYear, 6, 15),
          multiplier: 1.35,
          flatRate: 19575
        },
        {
          categoryId: cat1.id,
          seasonName: 'Autumn Golden Chinar',
          startDate: new Date(curYear, 8, 15),
          endDate: new Date(curYear, 10, 10),
          multiplier: 1.15,
          flatRate: 16675
        }
      ]
    });
  }

  // 8. Ensure initial Vendor Settlement records exist for Ledger
  const existingSettlements = await prisma.vendorSettlement.count({ where: { hotelId: lalit.id } });
  if (existingSettlements === 0) {
    await prisma.vendorSettlement.create({
      data: {
        hotelId: lalit.id,
        amount: 150000,
        commissionDues: 22500,
        netPaid: 127500,
        status: 'COMPLETED',
        notes: 'Weekly automated NEFT settlement transfer for completed reservations.'
      }
    });
  }

  console.log('Real hospitality data seeded into Neon PostgreSQL successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
