require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function test() {
  try {
    const packages = await p.package.findMany();
    console.log('PACKAGES_START');
    console.log(JSON.stringify(packages, null, 2));
    console.log('PACKAGES_END');
  } catch (e) {
    console.log('Prisma error:', e.message);
  } finally {
    await p.$disconnect();
  }
}

test();
