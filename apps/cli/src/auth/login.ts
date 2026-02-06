import open from 'open';
import { saveConfig, isAuthenticated } from './config';
import { getApiUrl } from '../utils/api';
import { spinner, note, log } from '@clack/prompts';
import pc from 'picocolors';

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
    log.warn(
      `You are already logged in. Use ${pc.bold(pc.yellow('codementor logout'))} to sign out first.`
    );
    return;
  }

  try {
    const s = spinner();
    s.start('Requesting authentication...');
    const deviceCode = await requestDeviceCode();
    s.stop('Ready to authenticate');

    note(
      `Visit: ${pc.cyan(deviceCode.verification_uri)}\nCode:  ${pc.bold(pc.white(deviceCode.user_code))}`,
      'Authenticate in your browser'
    );

    // Try to open browser automatically
    try {
      await open(deviceCode.verification_uri_complete);
      log.info('Browser opened automatically.');
    } catch {
      log.warn('Could not open browser automatically. Please visit the URL above.');
    }

    const s2 = spinner();
    s2.start('Waiting for authorization...');

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

    s2.stop('Authorized');
    log.success('Successfully logged in!');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    log.error(`Login failed: ${message}`);
    process.exit(1);
  }
}
