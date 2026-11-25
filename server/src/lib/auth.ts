import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import prisma from './prisma';

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || process.env.RENDER_EXTERNAL_URL || 'http://localhost:5000',
  trustedOrigins: [
    'https://kashmir-curators.vercel.app',
    'http://localhost:5173',
    'http://localhost:5000',
    ...(process.env.RENDER_EXTERNAL_URL ? [process.env.RENDER_EXTERNAL_URL] : ['https://kashmir-curators-api.onrender.com'])
  ],
  secret: process.env.BETTER_AUTH_SECRET || process.env.JWT_SECRET!,
  database: prismaAdapter(prisma, {
    provider: 'postgresql'
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }
  },
  // Map custom fields from our existing User schema to the Better Auth session
  user: {
    additionalFields: {
      role: { type: 'string' },
      phone: { type: 'string' },
      isOnline: { type: 'boolean' }
    }
  }
});
