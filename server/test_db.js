require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function test() {
  try {
    const count = await p.inquiry.count();
    console.log('Inquiry count:', count);
    
    const inquiries = await p.inquiry.findMany({ take: 2 });
    console.log('Sample inquiries:', JSON.stringify(inquiries, null, 2));
  } catch (e) {
    console.log('Prisma error:', e.message);
  } finally {
    await p.$disconnect();
  }
}

test();
