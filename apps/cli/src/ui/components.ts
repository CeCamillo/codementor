import { log } from '@clack/prompts';
import { theme } from './theme';

export function requireAuth(isAuthenticated: boolean): void {
  if (!isAuthenticated) {
    log.error(`Not authenticated. Run ${theme.command('codementor login')} first.`);
    process.exit(1);
  }
}

export function handleCommandError(error: unknown, fallbackMessage: string): never {
  if (error instanceof Error) {
    log.error(error.message);
  } else {
    log.error(fallbackMessage);
  }
  process.exit(1);
}
