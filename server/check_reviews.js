require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function test() {
  try {
    const reviews = await p.packageReview.findMany();
    console.log('REVIEWS_START');
    console.log(JSON.stringify(reviews, null, 2));
    console.log('REVIEWS_END');
  } catch (e) {
    console.log('Prisma error:', e.message);
  } finally {
    await p.$disconnect();
  }
}

test();
