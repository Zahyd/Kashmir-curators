require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function test() {
  try {
    console.log('Searching database for pkg-2...');
    
    // Search packages
    const pkg = await p.package.findFirst({ where: { OR: [{ id: 'pkg-2' }, { name: { contains: 'pkg-2' } }] } });
    console.log('Package search result:', pkg);

    // Search blogs
    const blogs = await p.blogPost.findMany();
    const blogMatch = blogs.filter(b => JSON.stringify(b).includes('pkg-2'));
    console.log('Matching blog posts count:', blogMatch.length);

    // Search SiteContent
    const contents = await p.siteContent.findMany();
    const contentMatch = contents.filter(c => JSON.stringify(c).includes('pkg-2'));
    console.log('Matching SiteContent count:', contentMatch.length);

    // Search inquiries
    const inquiries = await p.inquiry.findMany();
    const inquiryMatch = inquiries.filter(i => JSON.stringify(i).includes('pkg-2'));
    console.log('Matching Inquiries count:', inquiryMatch.length);

    // Search bookings
    const bookings = await p.booking.findMany();
    const bookingMatch = bookings.filter(b => JSON.stringify(b).includes('pkg-2'));
    console.log('Matching Bookings count:', bookingMatch.length);

  } catch (e) {
    console.log('Prisma error:', e.message);
  } finally {
    await p.$disconnect();
  }
}

test();
