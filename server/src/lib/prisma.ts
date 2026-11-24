import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Graceful connection disconnect on shutdown
const handleShutdown = async () => {
  try {
    await prisma.$disconnect();
  } catch (err) {
    // Ignore disconnect errors during process exit
  }
};

process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);

export default prisma;
