import { existsSync, mkdirSync, readFileSync, writeFileSync, chmodSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

export interface AuthConfig {
  accessToken?: string | undefined;
  refreshToken?: string | undefined;
  expiresAt?: string | undefined;
}

const CONFIG_DIR = join(homedir(), '.codementor');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

function ensureConfigDir(): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { mode: 0o700 });
  }
}

export function getConfig(): AuthConfig {
  try {
    if (!existsSync(CONFIG_FILE)) {
      return {};
    }
    const content = readFileSync(CONFIG_FILE, 'utf-8');
    return JSON.parse(content) as AuthConfig;
  } catch {
    return {};
  }
}

export function saveConfig(config: AuthConfig): void {
  ensureConfigDir();
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), { mode: 0o600 });
  chmodSync(CONFIG_FILE, 0o600);
}

export function clearConfig(): void {
  if (existsSync(CONFIG_FILE)) {
    writeFileSync(CONFIG_FILE, '{}', { mode: 0o600 });
  }
}

export function getAccessToken(): string | undefined {
  const config = getConfig();
  if (!config.accessToken) {
    return undefined;
  }
  if (config.expiresAt && new Date(config.expiresAt) < new Date()) {
    return undefined;
  }
  return config.accessToken;
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}
