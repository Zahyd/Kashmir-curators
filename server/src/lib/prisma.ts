import { PrismaClient } from '@prisma/client';
import {
  buildResilientDatabaseUrl,
  checkDatabaseHealthWithClient,
  DatabaseHealthReport,
  isTransientDbError,
  withDbRetry,
} from './dbResilience';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const tunedDatabaseUrl = buildResilientDatabaseUrl(process.env.DATABASE_URL);

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    ...(tunedDatabaseUrl ? { datasources: { db: { url: tunedDatabaseUrl } } } : {}),
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export { buildResilientDatabaseUrl, isTransientDbError, withDbRetry, DatabaseHealthReport };

export async function warmUpDatabase(): Promise<boolean> {
  if (process.env.NODE_ENV === 'test') return true;
  try {
    await withDbRetry(() => prisma.$queryRaw`SELECT 1`, 3, 800);
    return true;
  } catch (err) {
    console.warn('[Prisma] Database warm-up warning:', err instanceof Error ? err.message : err);
    return false;
  }
}

export async function checkDatabaseHealth(): Promise<DatabaseHealthReport> {
  return checkDatabaseHealthWithClient(prisma);
}

// Graceful connection disconnect on shutdown
const handleShutdown = async () => {
  try {
    await prisma.$disconnect();
  } catch {
    // Ignore disconnect errors during process exit
  }
};

process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);

export default prisma;
