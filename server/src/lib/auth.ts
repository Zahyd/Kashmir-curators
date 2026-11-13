import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import prisma from './prisma';

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:5000',
  secret: process.env.JWT_SECRET || process.env.BETTER_AUTH_SECRET || 'kashmir_curators_secret_2026',
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
