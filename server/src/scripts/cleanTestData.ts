import prisma from '../lib/prisma';

async function cleanTestData() {
  console.log('🧹 Scanning database for test/mock inquiries...');
  
  const p = prisma as any;

  // Find inquiries created by simulation, tests, or dummy numbers
  const testLeads = await p.inquiry.findMany({
    where: {
      OR: [
        { customerName: { contains: 'Test', mode: 'insensitive' } },
        { customerName: { contains: 'Simulate', mode: 'insensitive' } },
        { customerName: { contains: 'Rohan Kapoor', mode: 'insensitive' } },
        { customerName: { contains: 'Tariq Al-Mansoor', mode: 'insensitive' } },
        { customerName: { contains: 'Zayd & Farah', mode: 'insensitive' } },
        { notes: { contains: 'Auto-quoted instantly via Meta Lead Automation', mode: 'insensitive' } },
        { notes: { contains: 'Lead captured via WhatsApp AI Agent', mode: 'insensitive' } },
        { email: { contains: 'test@traveler.com' } },
        { email: { contains: 'instagram-inquiry.com' } },
        { email: { contains: 'dubai-travelers.ae' } },
        { email: { contains: 'mumbai-hnw.in' } },
        { email: { contains: 'whatsapp.kashmircurators.com' } }
      ]
    },
    select: { id: true, customerName: true, phone: true }
  });

  console.log(`Found ${testLeads.length} test leads to clean.`);
  
  for (const lead of testLeads) {
    console.log(` - Purging: ${lead.id} | ${lead.customerName} (${lead.phone})`);
    await p.whatsAppMessage.deleteMany({ where: { inquiryId: lead.id } });
    await p.leadActivity.deleteMany({ where: { inquiryId: lead.id } });
    await p.cabReservation.deleteMany({ where: { inquiryId: lead.id } });
    await p.hotelReservation.deleteMany({ where: { inquiryId: lead.id } });
    await p.inquiry.delete({ where: { id: lead.id } });
  }

  // Also clean unlinked test whatsapp messages
  const deletedMessages = await p.whatsAppMessage.deleteMany({
    where: {
      OR: [
        { customerPhone: { in: ['+919820199887', '+919419011223', '+971501234567', '+919820123456'] } }
      ]
    }
  });

  console.log(`Cleaned ${deletedMessages.count} test WhatsApp messages.`);

  // Remaining active inquiries count
  const remaining = await p.inquiry.count();
  console.log(`\n✨ Database clean! Remaining legitimate inquiries: ${remaining}`);
}

cleanTestData()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error cleaning test data:', err);
    process.exit(1);
  });
