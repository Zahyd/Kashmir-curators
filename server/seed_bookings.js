require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = [
    "87c38c3f-3bcd-456e-a057-61a56a0c2b58",
    "b699f504-e743-4b92-b61f-1de72949a0b1",
    "7d62afa4-5cbd-4bbd-a2d7-4f9fc4d7101a"
  ];

  const bookings = [
    {
      userId: users[0],
      type: "package",
      itemName: "Majestic Gulmarg & Srinagar Experience",
      bookingDate: new Date("2024-06-15"),
      status: "confirmed",
      totalAmount: 75000,
      details: JSON.stringify({ travelers: 2, duration: "5 Days" })
    },
    {
      userId: users[1],
      type: "hotel",
      itemName: "The Khyber Himalayan Resort & Spa",
      bookingDate: new Date("2024-07-20"),
      status: "pending",
      totalAmount: 45000,
      details: JSON.stringify({ rooms: 1, nights: 3 })
    },
    {
      userId: users[2],
      type: "cab",
      itemName: "Luxury SUV Safari - Pahalgam Loop",
      bookingDate: new Date("2024-08-05"),
      status: "confirmed",
      totalAmount: 12000,
      details: JSON.stringify({ vehicle: "Toyota Fortuner", days: 1 })
    }
  ];

  console.log('Seeding bookings...');
  for (const b of bookings) {
    const created = await prisma.booking.create({ data: b });
    console.log(`Created booking: ${created.id}`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
