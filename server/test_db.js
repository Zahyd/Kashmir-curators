require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function test() {
  try {
    const inquiries = await p.inquiry.count();
    console.log('Inquiry count:', inquiries);
    
    const users = await p.user.count();
    console.log('User count:', users);
    
    const usersList = await p.user.findMany({ select: { id: true, name: true } });
    console.log('Users:', JSON.stringify(usersList, null, 2));
  } catch (e) {
    console.log('Prisma error:', e.message);
  } finally {
    await p.$disconnect();
  }
}

test();
