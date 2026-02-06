import { spinner } from '@clack/prompts';

export async function withSpinner<T>(
  message: string,
  operation: () => Promise<T>,
  successMessage?: string
): Promise<T> {
  const s = spinner();
  s.start(message);
  try {
    const result = await operation();
    s.stop(successMessage);
    return result;
  } catch (error) {
    s.stop('Failed');
    throw error;
  }
}
