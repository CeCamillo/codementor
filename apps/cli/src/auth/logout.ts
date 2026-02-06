import { clearConfig, getAccessToken } from './config';
import { getApiUrl } from '../utils/api';
import { log } from '@clack/prompts';

export async function logout(): Promise<void> {
  const token = getAccessToken();

  if (!token) {
    log.warn('You are not logged in.');
    return;
  }

  try {
    // Attempt to invalidate the session on the server
    await fetch(`${getApiUrl()}/api/logout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  } catch {
    // Ignore network errors during logout
  }

  clearConfig();
  log.success('Successfully logged out.');
}
