require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function test() {
  try {
    const curators = await p.curator.findMany();
    console.log('CURATORS_START');
    console.log(JSON.stringify(curators, null, 2));
    console.log('CURATORS_END');
  } catch (e) {
    console.log('Prisma error:', e.message);
  } finally {
    await p.$disconnect();
  }
}

test();
