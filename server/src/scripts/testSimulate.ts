import { MetaLeadAutomationService } from '../services/metaLeadService';
import prisma from '../lib/prisma';

async function main() {
  console.log('Testing MetaLeadAutomationService.processInboundMetaLead...');
  const res = await MetaLeadAutomationService.processInboundMetaLead({
    fullName: 'Test Traveler (Mumbai HNW)',
    phone: '+919820123456',
    email: 'test@traveler.com',
    destination: 'Gulmarg & Pahalgam',
    duration: '5 Nights / 6 Days',
    travelers: '2 Adults',
    hotelPreference: '4-Star Mountain Boutique'
  });
  console.log('✅ Simulation Success! Ingested lead:', res.id, res.customerName, res.netPrice);

  // Clean up
  await prisma.inquiry.delete({ where: { id: res.id } });
  console.log('🧹 Cleaned up test lead.');
}

main().then(() => process.exit(0)).catch(err => {
  console.error('❌ Error during simulation:', err);
  process.exit(1);
});
