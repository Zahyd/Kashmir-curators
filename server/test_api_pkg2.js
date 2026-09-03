require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const safeParse = (str) => {
  if (!str || typeof str !== 'string') return str || [];
  try {
    return JSON.parse(str);
  } catch (e) {
    return [];
  }
};

const parsePkg = (pkg) => ({
  ...pkg,
  highlights: safeParse(pkg.highlights),
  inclusions: safeParse(pkg.inclusions),
  exclusions: safeParse(pkg.exclusions),
  itinerary: safeParse(pkg.itinerary)
});

async function run() {
  try {
    const pkg = await prisma.package.findUnique({ where: { id: 'pkg-2' } });
    if (!pkg) {
      console.log('Package not found in DB!');
      return;
    }
    const parsed = parsePkg(pkg);
    console.log('PARSED_PKG_START');
    console.log('highlights type:', typeof parsed.highlights, 'isArray:', Array.isArray(parsed.highlights));
    console.log('inclusions type:', typeof parsed.inclusions, 'isArray:', Array.isArray(parsed.inclusions));
    console.log('exclusions type:', typeof parsed.exclusions, 'isArray:', Array.isArray(parsed.exclusions));
    console.log('itinerary type:', typeof parsed.itinerary, 'isArray:', Array.isArray(parsed.itinerary));
    console.log('highlights:', parsed.highlights);
    console.log('inclusions:', parsed.inclusions);
    console.log('exclusions:', parsed.exclusions);
    console.log('itinerary:', parsed.itinerary);
    console.log('PARSED_PKG_END');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
