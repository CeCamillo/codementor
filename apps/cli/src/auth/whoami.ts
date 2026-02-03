import { getAccessToken, isAuthenticated } from './config';
import { getApiUrl } from '../utils/api';

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
  if (!isAuthenticated()) {
    console.log('Not logged in. Use "codementor login" to authenticate.');
    process.exit(1);
  }

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

    console.log(`Logged in as: ${user.name}`);
    console.log(`Email: ${user.email}`);
    console.log(`User ID: ${user.id}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Failed to get user info: ${message}`);
    process.exit(1);
  }
}
