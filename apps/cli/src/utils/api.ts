import { getAccessToken } from '../auth/config';

const DEFAULT_API_URL = 'http://localhost:3000';

export function getApiUrl(): string {
  return process.env['CODEMENTOR_API_URL'] ?? DEFAULT_API_URL;
}

export interface ApiClientOptions {
  requireAuth?: boolean;
}

export interface ApiError {
  error: string;
  error_description?: string;
}

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl ?? getApiUrl();
  }

  private getHeaders(authenticated: boolean): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (authenticated) {
      const token = getAccessToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  async get<T>(path: string, options: ApiClientOptions = {}): Promise<T> {
    const { requireAuth = true } = options;

    if (requireAuth && !getAccessToken()) {
      throw new Error('Not authenticated. Please run "codementor login" first.');
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'GET',
      headers: this.getHeaders(requireAuth),
    });

    if (!response.ok) {
      const error = (await response.json().catch(() => ({}))) as ApiError;
      throw new Error(error.error_description ?? error.error ?? response.statusText);
    }

    return response.json() as Promise<T>;
  }

  async post<T>(path: string, body?: unknown, options: ApiClientOptions = {}): Promise<T> {
    const { requireAuth = true } = options;

    if (requireAuth && !getAccessToken()) {
      throw new Error('Not authenticated. Please run "codementor login" first.');
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: this.getHeaders(requireAuth),
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = (await response.json().catch(() => ({}))) as ApiError;
      throw new Error(error.error_description ?? error.error ?? response.statusText);
    }

    return response.json() as Promise<T>;
  }

  async put<T>(path: string, body?: unknown, options: ApiClientOptions = {}): Promise<T> {
    const { requireAuth = true } = options;

    if (requireAuth && !getAccessToken()) {
      throw new Error('Not authenticated. Please run "codementor login" first.');
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'PUT',
      headers: this.getHeaders(requireAuth),
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = (await response.json().catch(() => ({}))) as ApiError;
      throw new Error(error.error_description ?? error.error ?? response.statusText);
    }

    return response.json() as Promise<T>;
  }

  async delete<T>(path: string, options: ApiClientOptions = {}): Promise<T> {
    const { requireAuth = true } = options;

    if (requireAuth && !getAccessToken()) {
      throw new Error('Not authenticated. Please run "codementor login" first.');
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'DELETE',
      headers: this.getHeaders(requireAuth),
    });

    if (!response.ok) {
      const error = (await response.json().catch(() => ({}))) as ApiError;
      throw new Error(error.error_description ?? error.error ?? response.statusText);
    }

    return response.json() as Promise<T>;
  }
}

export const api = new ApiClient();
