import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const counts = {
    users: await prisma.user.count(),
    packages: await prisma.package.count(),
    bookings: await prisma.booking.count(),
    inquiries: await prisma.inquiry.count()
  };
  console.log(JSON.stringify(counts));
}
main();
