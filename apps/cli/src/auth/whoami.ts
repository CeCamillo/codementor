import { getAccessToken, isAuthenticated } from './config';
import { getApiUrl } from '../utils/api';
import { note } from '@clack/prompts';
import pc from 'picocolors';
import { requireAuth, handleCommandError } from '../ui';

interface UserInfo {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

interface ErrorResponse {
  error: string;
  error_description: string;
}

export async function whoami(): Promise<void> {
  requireAuth(isAuthenticated());

  const token = getAccessToken();

  try {
    const response = await fetch(`${getApiUrl()}/api/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = (await response.json()) as ErrorResponse;
      throw new Error(error.error_description || error.error);
    }

    const user = (await response.json()) as UserInfo;

    note(
      `Name:  ${pc.bold(user.name)}\nEmail: ${pc.cyan(user.email)}\nID:    ${pc.dim(user.id)}`,
      'Logged in as'
    );
  } catch (error) {
    handleCommandError(error, 'Failed to get user info.');
  }
}
