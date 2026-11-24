import prisma from '../lib/prisma';

async function deepCleanMockHospitality() {
  console.log('================================================================');
  console.log('🧹 DEEP CLEANING MOCK & SAMPLE HOSPITALITY DATA');
  console.log('================================================================\n');

  const p = prisma as any;

  // 1. Identify mock/sample reservations
  const mockVouchers = ['KCH-9102', 'KCH-7731', 'KCH-6209', 'KCH-8419', 'KCH-8820'];
  const mockNames = [
    'Dr. Rahul & Priya Sharma',
    'Zubair Al-Mansoor & Group',
    'Ananya Roy',
    'Vikram Malhotra & Family',
    'Dr. Tariq & Aisha Hameed'
  ];

  console.log('▶️ 1. Scanning Hotel Reservations for mock/sample records...');
  const mockReservations = await p.hotelReservation.findMany({
    where: {
      OR: [
        { bookingReference: { in: mockVouchers } },
        { guestName: { in: mockNames } },
        { guestEmail: { contains: 'aims.org' } },
        { guestEmail: { contains: 'zenith-tech.in' } },
        { guestEmail: { contains: 'riyadh-invest.sa' } },
        { guestEmail: { contains: 'creative-minds.io' } },
        { guestEmail: { contains: 'kashmirhealth.org' } },
        { id: 'f3ab65fd-876c-47bd-b07b-47dbbae3b600' }
      ]
    }
  });

  console.log(`   Found ${mockReservations.length} mock reservations to clean.`);

  for (const res of mockReservations) {
    console.log(`   - Deleting reservation: ${res.bookingReference || res.id} (${res.guestName})`);
    // Delete cascade dependencies
    await p.emailDispatchRecord.deleteMany({ where: { reservationId: res.id } }).catch(() => null);
    await p.inboundEmailLog.deleteMany({ where: { reservationId: res.id } }).catch(() => null);
    await p.aiAgentActionLog.deleteMany({ where: { reservationId: res.id } }).catch(() => null);
    await p.hotelReservation.delete({ where: { id: res.id } }).catch(() => null);
  }

  // 2. Clean mock vendor settlements
  console.log('\n▶️ 2. Cleaning mock vendor settlements...');
  const mockSettlements = await p.vendorSettlement.deleteMany({
    where: {
      OR: [
        { notes: { contains: 'Weekly automated NEFT settlement', mode: 'insensitive' } },
        { amount: 150000 }
      ]
    }
  });
  console.log(`   Deleted ${mockSettlements.count} mock vendor settlement records.`);

  // 3. Clean mock housekeeping tasks and maintenance requests
  console.log('\n▶️ 3. Cleaning mock housekeeping & maintenance records...');
  const mockHk = await p.housekeepingTask.deleteMany({
    where: {
      OR: [
        { notes: { contains: 'VIP Arrival', mode: 'insensitive' } },
        { notes: { contains: 'Bukhari maintenance', mode: 'insensitive' } },
        { notes: { contains: 'Departure turnover', mode: 'insensitive' } }
      ]
    }
  });
  console.log(`   Deleted ${mockHk.count} mock housekeeping tasks.`);

  const mockMt = await p.maintenanceRequest.deleteMany({
    where: {
      OR: [
        { task: { contains: 'Bukhari copper chimney pipe soot cleaning', mode: 'insensitive' } }
      ]
    }
  });
  console.log(`   Deleted ${mockMt.count} mock maintenance requests.`);

  // 4. Reset physical rooms to Available Clean
  console.log('\n▶️ 4. Normalizing physical room operational statuses...');
  const resetRooms = await p.hotelRoom.updateMany({
    data: {
      status: 'AVAILABLE',
      operationalStatus: 'AVAILABLE_CLEAN',
      housekeeping: 'CLEAN',
      currentReservationId: null,
      bukhariActive: false,
      electricWarmerActive: false
    }
  });
  console.log(`   Normalized ${resetRooms.count} rooms to AVAILABLE_CLEAN.`);

  // 5. Clean mock test inquiries (Abc dummy numbers, test leads)
  console.log('\n▶️ 5. Cleaning mock inquiries with test phone numbers...');
  const mockInqs = await p.inquiry.deleteMany({
    where: {
      OR: [
        { customerName: { in: ['Abc', 'Test', 'Simulate'] } },
        { phone: { in: ['1234586790', '123458970', '12345678', 'Not provided'] } }
      ]
    }
  });
  console.log(`   Cleaned ${mockInqs.count} dummy inquiries.`);

  // 6. Summary check
  const remainingRes = await p.hotelReservation.count();
  const remainingInq = await p.inquiry.count();
  console.log('\n================================================================');
  console.log(`✨ DEEP CLEANING COMPLETE!`);
  console.log(`   Remaining Live Hotel Reservations: ${remainingRes}`);
  console.log(`   Remaining Legitimate Inquiries: ${remainingInq}`);
  console.log('================================================================');
}

deepCleanMockHospitality()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error during deep cleaning:', err);
    process.exit(1);
  });
