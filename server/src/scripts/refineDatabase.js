const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function refine() {
  console.log('--- 1. UPDATE HOTEL CONTACT INFORMATION ---');
  
  await prisma.hotel.update({
    where: { id: 'hotel-khyber' },
    data: {
      contactName: 'Tariq Ahmad (Front Desk Manager)',
      contactEmail: 'reception@thekhyber.com',
      receptionEmail: 'reception@thekhyber.com',
      reservationsEmail: 'reservations@thekhyber.com',
      contactPhone: '+91 1954 258888',
      whatsappNumber: '+91 94190 12345',
      managerName: 'Tariq Ahmad',
      address: 'Gulmarg Alpine Valley, Baramulla, Jammu & Kashmir 193403',
      paymentTerms: 'Net 30 Days Direct Settlement',
      taxRatePct: 18.0
    }
  });

  await prisma.hotel.update({
    where: { id: 'hotel-taj' },
    data: {
      contactName: 'Suhail Lone (Reservations Lead)',
      contactEmail: 'reception@tajdalview.com',
      receptionEmail: 'reception@tajdalview.com',
      reservationsEmail: 'reservations@tajdalview.com',
      contactPhone: '+91 194 2461111',
      whatsappNumber: '+91 94191 22334',
      managerName: 'Suhail Lone',
      address: 'Kralsangri, Brein, Srinagar, Jammu & Kashmir 190018',
      paymentTerms: 'Credit Ledger Net 15',
      taxRatePct: 18.0
    }
  });

  await prisma.hotel.update({
    where: { id: 'hotel-1' },
    data: {
      contactName: 'Bashir Reshi (Chief Concierge & Front Office)',
      contactEmail: 'reception.srinagar@thelalit.com',
      receptionEmail: 'reception.srinagar@thelalit.com',
      reservationsEmail: 'reservations.srinagar@thelalit.com',
      contactPhone: '+91 194 2501001',
      whatsappNumber: '+91 94192 33445',
      managerName: 'Bashir Reshi',
      address: 'Gupkar Road, Srinagar, Jammu & Kashmir 190001',
      paymentTerms: 'Bi-weekly Settlement',
      taxRatePct: 18.0
    }
  });

  await prisma.hotel.update({
    where: { id: '9694f689-e21d-4818-9b26-7e7d1da6c552' },
    data: {
      contactName: 'Altaf Chapri (Owner & Operations Director)',
      contactEmail: 'concierge@sukoonhouseboat.com',
      receptionEmail: 'concierge@sukoonhouseboat.com',
      reservationsEmail: 'reservations@sukoonhouseboat.com',
      contactPhone: '+91 194 2420088',
      whatsappNumber: '+91 94193 44556',
      managerName: 'Altaf Chapri',
      address: 'Ghat 2, Nigeen Lake West, Srinagar, Jammu & Kashmir 190006',
      paymentTerms: 'Instant Voucher Reconciliation',
      taxRatePct: 12.0
    }
  });

  console.log('--- 2. REMOVE MOCK TEST RESERVATION (Abc / 0000000) ---');
  await prisma.hotelReservation.deleteMany({
    where: {
      OR: [
        { guestName: 'Abc' },
        { guestPhone: '00000000' },
        { bookingReference: 'KC-HTL-2026-221471' }
      ]
    }
  });

  console.log('--- 3. CLEAN UP & UPDATE EXISTING RESERVATION REFERENCES ---');
  const existingLalit = await prisma.hotelReservation.findMany({ where: { hotelId: 'hotel-1' } });
  const refCodes = ['KC-RES-2026-1041', 'KC-RES-2026-1042', 'KC-RES-2026-1043', 'KC-RES-2026-1044'];
  for (let i = 0; i < existingLalit.length; i++) {
    await prisma.hotelReservation.update({
      where: { id: existingLalit[i].id },
      data: {
        bookingReference: refCodes[i] || 'KC-RES-2026-' + (1040 + i),
        receptionEmail: 'reception.srinagar@thelalit.com',
        receptionPhone: '+91 194 2501001',
        receptionContact: 'Bashir Reshi (Front Desk)',
        confirmationDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    });
  }

  console.log('--- 4. SEED AUTHENTIC RESERVATIONS FOR KHYBER, TAJ, SUKOON ---');
  
  // Khyber 1 - Pending Response
  await prisma.hotelReservation.create({
    data: {
      hotelId: 'hotel-khyber',
      guestName: 'Vikram & Sunita Malhotra',
      guestEmail: 'vikram.malhotra@delhicapital.in',
      guestPhone: '+91 98112 45890',
      checkIn: new Date('2026-11-20T14:00:00Z'),
      checkOut: new Date('2026-11-23T11:00:00Z'),
      roomType: 'Premier Alpine Room (Valley View)',
      roomsCount: 1,
      adults: 2,
      children: 0,
      mealPlan: 'MAP',
      contractRate: 18500,
      totalAmount: 55500,
      profitMargin: 8325,
      hotelDues: 47175,
      status: 'Pending',
      confirmationStage: 'PENDING_RESPONSE',
      paymentStatus: 'Paid',
      bookingReference: 'KC-RES-2026-1045',
      secureToken: 'sec_khyber_alpine_1045',
      tokenExpiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      confirmationDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
      receptionEmail: 'reception@thekhyber.com',
      receptionPhone: '+91 1954 258888',
      receptionContact: 'Tariq Ahmad (Front Desk Manager)',
      specialRequests: 'Upper floor room facing snow peaks. Bukhari heating pre-lit prior to arrival.',
      agentName: 'Aaqib Mir (Kashmir Curators Desk)',
      auditLogs: JSON.stringify([{ timestamp: new Date().toISOString(), action: 'Voucher Dispatched', user: 'Aaqib Mir', details: 'Dispatched to The Khyber Himalayan Resort & Spa reception desk.' }])
    }
  });

  // Khyber 2 - Confirmed by Hotel
  await prisma.hotelReservation.create({
    data: {
      hotelId: 'hotel-khyber',
      guestName: 'Aman & Ritu Singhania (Honeymoon)',
      guestEmail: 'aman.singhania@mumbaicorps.com',
      guestPhone: '+91 99203 11847',
      checkIn: new Date('2026-11-25T14:00:00Z'),
      checkOut: new Date('2026-11-28T11:00:00Z'),
      roomType: 'Luxury Gulmarg Cottage Suite',
      roomsCount: 1,
      adults: 2,
      children: 0,
      mealPlan: 'MAP',
      contractRate: 24000,
      totalAmount: 72000,
      profitMargin: 10800,
      hotelDues: 61200,
      status: 'Confirmed',
      confirmationStage: 'HOTEL_CONFIRMED',
      paymentStatus: 'Paid',
      bookingReference: 'KC-RES-2026-1046',
      secureToken: 'sec_khyber_cottage_1046',
      hotelConfirmationNumber: 'KHY-2026-CONF-8819',
      confirmedRoomType: 'Luxury Gulmarg Cottage Suite',
      confirmedRoomsCount: 1,
      confirmedTariff: 24000,
      confirmedMealPlan: 'MAP',
      receptionEmail: 'reception@thekhyber.com',
      receptionPhone: '+91 1954 258888',
      receptionContact: 'Tariq Ahmad (Front Desk Manager)',
      respondedAt: new Date(),
      respondedBy: 'Tariq Ahmad (Front Desk Manager)',
      specialRequests: 'Honeymoon rose bed decoration, heated electric blanket, snow transfer assistance.',
      agentName: 'Zahid Mir (Senior Curator)',
      auditLogs: JSON.stringify([{ timestamp: new Date().toISOString(), action: 'Booking Confirmed by Hotel', user: 'Tariq Ahmad', details: 'Confirmed with hotel confirmation number KHY-2026-CONF-8819.' }])
    }
  });

  // Taj Dal View - Availability Confirmed
  await prisma.hotelReservation.create({
    data: {
      hotelId: 'hotel-taj',
      guestName: 'Dr. Sameer & Dr. Nandini Verma',
      guestEmail: 'sameer.verma@apollohospitals.org',
      guestPhone: '+91 98450 67123',
      checkIn: new Date('2026-11-22T14:00:00Z'),
      checkOut: new Date('2026-11-25T11:00:00Z'),
      roomType: 'Dal View Luxury Suite',
      roomsCount: 1,
      adults: 2,
      children: 1,
      mealPlan: 'CP',
      contractRate: 16000,
      totalAmount: 48000,
      profitMargin: 7200,
      hotelDues: 40800,
      status: 'Pending',
      confirmationStage: 'AVAILABILITY_CONFIRMED',
      paymentStatus: 'Paid',
      bookingReference: 'KC-RES-2026-1047',
      secureToken: 'sec_taj_dalview_1047',
      tokenExpiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      confirmationDeadline: new Date(Date.now() + 20 * 60 * 60 * 1000),
      receptionEmail: 'reception@tajdalview.com',
      receptionPhone: '+91 194 2461111',
      receptionContact: 'Suhail Lone (Reservations Lead)',
      respondedAt: new Date(),
      respondedBy: 'Suhail Lone',
      specialRequests: 'Extra rollaway bed for child, late check-in at 16:00.',
      agentName: 'Aaqib Mir (Kashmir Curators Desk)',
      auditLogs: JSON.stringify([{ timestamp: new Date().toISOString(), action: 'Availability Confirmed by Hotel', user: 'Suhail Lone', details: 'Hotel verified room inventory is held for DMC confirmation.' }])
    }
  });

  // Sukoon Houseboat - Alternative Offered
  await prisma.hotelReservation.create({
    data: {
      hotelId: '9694f689-e21d-4818-9b26-7e7d1da6c552',
      guestName: 'Julian & Clara Van Der Bilt',
      guestEmail: 'julian.vanderbilt@amsterdamtravel.nl',
      guestPhone: '+31 6 1234 5678',
      checkIn: new Date('2026-11-28T14:00:00Z'),
      checkOut: new Date('2026-12-01T11:00:00Z'),
      roomType: 'Lakefront Cedar Wood Suite',
      roomsCount: 1,
      adults: 2,
      children: 0,
      mealPlan: 'MAP',
      contractRate: 15500,
      totalAmount: 46500,
      profitMargin: 6975,
      hotelDues: 39525,
      status: 'Pending',
      confirmationStage: 'ALTERNATIVE_OFFERED',
      paymentStatus: 'Paid',
      bookingReference: 'KC-RES-2026-1048',
      secureToken: 'sec_sukoon_lakefront_1048',
      tokenExpiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      confirmationDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
      alternativeRoomType: 'Rooftop Starlight Suite',
      alternativeTariff: 17000,
      alternativeNotes: 'Cedar wood suite undergoing seasonal wood polish; offering Rooftop Starlight Suite upgrade at special DMC rate.',
      receptionEmail: 'concierge@sukoonhouseboat.com',
      receptionPhone: '+91 194 2420088',
      receptionContact: 'Altaf Chapri (Owner)',
      respondedAt: new Date(),
      respondedBy: 'Altaf Chapri',
      specialRequests: 'Quiet lakeside room, traditional Kashmiri vegetarian dinner.',
      agentName: 'Zahid Mir (Senior Curator)',
      auditLogs: JSON.stringify([{ timestamp: new Date().toISOString(), action: 'Alternative Offered by Hotel', user: 'Altaf Chapri', details: 'Offered Rooftop Starlight Suite upgrade at ₹17,000/nt.' }])
    }
  });

  console.log('✅ DATABASE REFINEMENT SUCCESSFULLY COMPLETED!');
}

refine()
  .catch(err => {
    console.error('Refinement failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
