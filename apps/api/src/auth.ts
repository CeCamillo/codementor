import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@codementor/db';
import * as schema from '@codementor/db/schema';

function getOptionalEnvVar(name: string): string | undefined {
  return process.env[name];
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  emailAndPassword: {
    enabled: false,
  },
  socialProviders: {
    github: {
      clientId: getOptionalEnvVar('GITHUB_CLIENT_ID') ?? '',
      clientSecret: getOptionalEnvVar('GITHUB_CLIENT_SECRET') ?? '',
      enabled: !!getOptionalEnvVar('GITHUB_CLIENT_ID'),
    },
    google: {
      clientId: getOptionalEnvVar('GOOGLE_CLIENT_ID') ?? '',
      clientSecret: getOptionalEnvVar('GOOGLE_CLIENT_SECRET') ?? '',
      enabled: !!getOptionalEnvVar('GOOGLE_CLIENT_ID'),
    },
  },
  trustedOrigins: ['http://localhost:3000', 'http://localhost:5173'],
  secret: getOptionalEnvVar('BETTER_AUTH_SECRET'),
});

export type Auth = typeof auth;
