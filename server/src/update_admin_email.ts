import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  console.log('Updating ADMIN001 email to Zahidreyaz44123@gmail.com...');
  try {
    // Check if the user exists with employeeCode ADMIN001
    const user = await prisma.user.findUnique({
      where: { employeeCode: 'ADMIN001' }
    });

    if (user) {
      // Check if another user already has Zahidreyaz44123@gmail.com to avoid uniqueness constraint issues
      const duplicate = await prisma.user.findUnique({
        where: { email: 'Zahidreyaz44123@gmail.com' }
      });

      if (duplicate && duplicate.id !== user.id) {
        // If a duplicate exists, let's merge or delete the old one first, or update its email
        console.log('Found duplicate user with this email, removing/updating duplicate first...');
        await prisma.user.update({
          where: { id: duplicate.id },
          data: { email: `old_${Date.now()}@kashmirconnect.com`, employeeCode: null }
        });
      }

      const updated = await prisma.user.update({
        where: { employeeCode: 'ADMIN001' },
        data: { 
          email: 'Zahidreyaz44123@gmail.com',
          name: 'Zahid Riyaz (Director)'
        }
      });
      console.log('Success! Admin user successfully updated in database:', updated);
    } else {
      console.log('No user with code ADMIN001 found. Creating new admin user...');
      const created = await prisma.user.create({
        data: {
          email: 'Zahidreyaz44123@gmail.com',
          name: 'Zahid Riyaz (Director)',
          role: 'admin',
          phone: '+919103798448',
          employeeCode: 'ADMIN001'
        }
      });
      console.log('Success! Admin user successfully created:', created);
    }
  } catch (err: any) {
    console.error('Error updating admin email in DB:', err.message || err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
