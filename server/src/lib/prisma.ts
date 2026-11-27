import { PrismaClient } from '@prisma/client';
import {
  buildResilientDatabaseUrl,
  checkDatabaseHealthWithClient,
  DatabaseHealthReport,
  isTransientDbError,
  withDbRetry,
} from './dbResilience';

const globalForPrisma = global as unknown as {
  prisma?: PrismaClient;
  basePrisma?: PrismaClient;
};

const tunedDatabaseUrl = buildResilientDatabaseUrl(process.env.DATABASE_URL);

function createBasePrismaClient(): PrismaClient {
  const client = new PrismaClient({
    ...(tunedDatabaseUrl ? { datasources: { db: { url: tunedDatabaseUrl } } } : {}),
    log:
      process.env.NODE_ENV === 'development'
        ? [
            { emit: 'event', level: 'warn' },
            { emit: 'event', level: 'error' },
          ]
        : [{ emit: 'event', level: 'error' }],
  });

  client.$on('error' as never, (event: { message?: string }) => {
    const msg = String(event?.message || '');
    if (isTransientDbError({ message: msg })) {
      console.warn(
        '[Prisma] Idle PostgreSQL socket closed by upstream pooler/Neon compute; next query will reconnect automatically.'
      );
      return;
    }
    console.error('[Prisma Error]', msg);
  });

  if (process.env.NODE_ENV === 'development') {
    client.$on('warn' as never, (event: { message?: string }) => {
      console.warn('[Prisma Warning]', event?.message || '');
    });
  }

  return client;
}

const basePrisma = globalForPrisma.basePrisma || createBasePrismaClient();

export const prisma: PrismaClient =
  globalForPrisma.prisma ||
  (basePrisma.$extends({
    query: {
      $allModels: {
        $allOperations({ args, query }) {
          return withDbRetry(() => query(args), 3, 500);
        },
      },
    },
  }) as unknown as PrismaClient);

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.basePrisma = basePrisma;
  globalForPrisma.prisma = prisma;
}

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
    await basePrisma.$disconnect();
  } catch {
    // Ignore disconnect errors during process exit
  }
};

process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);

export default prisma;
