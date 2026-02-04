import { db } from '@codementor/db';
import { sessions, users } from '@codementor/db/schema';
import { eq, and, gt } from 'drizzle-orm';

interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
}

type ValidationSuccess = { user: User };
type ValidationError = { error: string; message: string };
export type ValidationResult = ValidationSuccess | ValidationError;

export async function validateSession(authHeader: string | undefined): Promise<ValidationResult> {
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: 'unauthorized', message: 'Missing or invalid authorization header' };
  }

  const sessionId = authHeader.slice(7);
  const [session] = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.id, sessionId), gt(sessions.expiresAt, new Date())));

  if (!session) {
    return { error: 'unauthorized', message: 'Invalid or expired session' };
  }

  const [user] = await db.select().from(users).where(eq(users.id, session.userId));
  if (!user) {
    return { error: 'unauthorized', message: 'User not found' };
  }

  return { user };
}

export function isValidationError(result: ValidationResult): result is ValidationError {
  return 'error' in result;
}
