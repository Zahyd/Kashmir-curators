import prisma from '../lib/prisma';

async function main() {
  const lalit = await prisma.hotel.findFirst();
  if (!lalit) {
    console.error('No hotel found');
    return;
  }
  const now = new Date();
  const checkIn = new Date(now.getTime() + 24 * 3600 * 1000);
  const checkOut = new Date(now.getTime() + 4 * 24 * 3600 * 1000);

  const testId = 'f3ab65fd-876c-47bd-b07b-47dbbae3b600';
  const res = await (prisma as any).hotelReservation.upsert({
    where: { id: testId },
    update: {
      confirmationStage: 'PENDING_RESPONSE',
      status: 'Pending',
      lifecycleStatus: 'SENT_TO_HOTEL'
    },
    create: {
      id: testId,
      hotelId: lalit.id,
      bookingReference: 'KCH-8820',
      guestName: 'Dr. Tariq & Aisha Hameed',
      guestEmail: 'tariq.hameed@kashmirhealth.org',
      guestPhone: '+91 94190 88201',
      checkIn,
      checkOut,
      roomType: 'Deluxe Palace Suite',
      roomsCount: 1,
      mealPlan: 'MAP',
      specialRequests: 'Late flight arrival. Bukhari pre-heating requested. Ground floor lake facing room.',
      status: 'Pending',
      lifecycleStatus: 'SENT_TO_HOTEL',
      confirmationStage: 'PENDING_RESPONSE',
      paymentStatus: 'Paid',
      contractRate: 16500,
      requestedTariff: 16500,
      agreedWholesaleRate: 14500,
      taxGstRate: 12,
      totalAmount: 49500,
      hotelDues: 43500,
      profitMargin: 6000,
      adults: 2,
      children: 0,
      bookingSource: 'B2B_PARTNER',
      travelAgent: 'Kashmir Curators VIP Desk',
      destination: 'Srinagar',
      bedConfiguration: 'King Bed',
      assignedEmployeeName: 'Reservation Desk Officer',
      assignedEmployeeCode: 'KC-EMP-01',
      confirmationDeadline: new Date(now.getTime() + 48 * 3600 * 1000)
    }
  });

  console.log('Successfully upserted test reservation in Neon DB:', res.id, res.guestName, res.bookingReference);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
