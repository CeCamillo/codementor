'use server';

import { db } from '@codementor/db';
import { waitlist } from '@codementor/db/schema';
import { eq } from 'drizzle-orm';

type WaitlistSource = 'homepage' | 'features' | 'how_it_works';

interface WaitlistResult {
  success: boolean;
  error?: string;
}

export async function joinWaitlist(email: string, source: WaitlistSource): Promise<WaitlistResult> {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { success: false, error: 'Por favor, insira um endereço de email válido.' };
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    const existing = await db
      .select({ id: waitlist.id })
      .from(waitlist)
      .where(eq(waitlist.email, normalizedEmail))
      .limit(1);

    if (existing.length > 0) {
      return { success: true };
    }

    await db.insert(waitlist).values({
      id: crypto.randomUUID(),
      email: normalizedEmail,
      source,
    });

    return { success: true };
  } catch {
    return { success: false, error: 'Algo deu errado. Por favor, tente novamente.' };
  }
}
