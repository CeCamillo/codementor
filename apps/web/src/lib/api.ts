import type {
  ProgressApiResponse,
  ProjectsListResponse,
  UserConceptsResponse,
  ConceptsDueResponse,
  ConceptGraphResponse,
} from '@codementor/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async fetch<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'unknown_error' }));
      throw new ApiError(response.status, error.error ?? 'unknown_error', error.error_description);
    }

    return response.json() as Promise<T>;
  }

  async getProgress(): Promise<ProgressApiResponse> {
    return this.fetch<ProgressApiResponse>('/api/progress');
  }

  async getProjects(): Promise<ProjectsListResponse> {
    return this.fetch<ProjectsListResponse>('/api/projects/list');
  }

  async getProject(id: string) {
    return this.fetch<{
      project: {
        id: string;
        title: string;
        description: string;
        difficulty: string;
        status: string;
        currentTaskId: string | null;
        createdAt: string;
        updatedAt: string;
      };
      tasks: Array<{
        id: string;
        title: string;
        description: string;
        objectives: string[];
        hints: string[];
        order: number;
        status: string;
        conceptIds: string[];
        createdAt: string;
        completedAt?: string;
      }>;
    }>(`/api/projects/${id}`);
  }

  async getConcepts(): Promise<UserConceptsResponse> {
    return this.fetch<UserConceptsResponse>('/api/users/me/concepts');
  }

  async getConceptsDue(): Promise<ConceptsDueResponse> {
    return this.fetch<ConceptsDueResponse>('/api/users/me/concepts/due');
  }

  async getConceptGraph(): Promise<ConceptGraphResponse> {
    return this.fetch<ConceptGraphResponse>('/api/users/me/concepts/graph');
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    public description?: string
  ) {
    super(description ?? code);
    this.name = 'ApiError';
  }
}

export { type ConceptGraphResponse } from '@codementor/shared';

export const api = new ApiClient(API_URL);
