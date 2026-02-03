import open from 'open';
import { saveConfig, isAuthenticated } from './config';
import { getApiUrl } from '../utils/api';

interface DeviceCodeResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  verification_uri_complete: string;
  expires_in: number;
  interval: number;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}

interface TokenErrorResponse {
  error: string;
  error_description: string;
}

function isTokenError(response: unknown): response is TokenErrorResponse {
  return (
    typeof response === 'object' &&
    response !== null &&
    'error' in response &&
    typeof (response as TokenErrorResponse).error === 'string'
  );
}

async function requestDeviceCode(): Promise<DeviceCodeResponse> {
  const response = await fetch(`${getApiUrl()}/auth/device`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: 'codementor-cli' }),
  });

  if (!response.ok) {
    throw new Error(`Failed to request device code: ${response.statusText}`);
  }

  return response.json() as Promise<DeviceCodeResponse>;
}

async function pollForToken(
  deviceCode: string,
  interval: number,
  expiresIn: number
): Promise<TokenResponse> {
  const startTime = Date.now();
  const expiresAt = startTime + expiresIn * 1000;

  while (Date.now() < expiresAt) {
    await new Promise((resolve) => setTimeout(resolve, interval * 1000));

    const response = await fetch(`${getApiUrl()}/auth/device/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        device_code: deviceCode,
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
      }),
    });

    const data = (await response.json()) as TokenResponse | TokenErrorResponse;

    if (isTokenError(data)) {
      switch (data.error) {
        case 'authorization_pending':
          process.stdout.write('.');
          continue;
        case 'slow_down':
          interval += 1;
          continue;
        case 'access_denied':
          throw new Error('Authorization was denied by the user');
        case 'expired_token':
          throw new Error('Device code has expired. Please try again.');
        default:
          throw new Error(data.error_description || data.error);
      }
    }

    return data;
  }

  throw new Error('Authorization timed out');
}

export async function login(): Promise<void> {
  if (isAuthenticated()) {
    console.log('You are already logged in. Use "codementor logout" to sign out first.');
    return;
  }

  console.log('Authenticating with CodeMentor...\n');

  try {
    const deviceCode = await requestDeviceCode();

    console.log('Please visit the following URL to authenticate:');
    console.log(`\n  ${deviceCode.verification_uri}\n`);
    console.log(`Enter this code: ${deviceCode.user_code}\n`);

    // Try to open browser automatically
    try {
      await open(deviceCode.verification_uri_complete);
      console.log('Browser opened automatically.');
    } catch {
      console.log('Could not open browser automatically. Please visit the URL above.');
    }

    console.log('\nWaiting for authorization');

    const token = await pollForToken(
      deviceCode.device_code,
      deviceCode.interval,
      deviceCode.expires_in
    );

    const expiresAt = new Date(Date.now() + token.expires_in * 1000).toISOString();

    saveConfig({
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      expiresAt,
    });

    console.log('\n\nSuccessfully logged in!');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`\nLogin failed: ${message}`);
    process.exit(1);
  }
}
