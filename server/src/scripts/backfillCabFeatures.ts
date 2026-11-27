import prisma from '../lib/prisma';
import { backfillLegacyCabFeatures } from '../lib/cabBackfill';

async function main() {
  console.log('[CabBackfill] Starting idempotent legacy Cab.features backfill...');
  const report = await backfillLegacyCabFeatures(prisma);
  console.log('[CabBackfill] Completed:', JSON.stringify(report, null, 2));
}

main()
  .catch((err) => {
    console.error('[CabBackfill] Fatal error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
