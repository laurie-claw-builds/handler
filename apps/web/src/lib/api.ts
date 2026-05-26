import type { Task, AgentJob, CreateTaskDto, CreateAgentJobDto } from './types';

// In production, Next.js rewrites /api/* to the NestJS API via next.config.ts.
// In dev, Next.js rewrites /api/* to http://localhost:3001.
// The browser always calls /api/... — no direct API URL needed here.

const BASE = '/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API ${init?.method ?? 'GET'} ${path} failed (${res.status}): ${text}`);
  }

  return res.json() as Promise<T>;
}

export const api = {
  tasks: {
    list: (params?: { state?: string; limit?: number; offset?: number }) => {
      const qs = new URLSearchParams();
      if (params?.state) qs.set('state', params.state);
      if (params?.limit != null) qs.set('limit', String(params.limit));
      if (params?.offset != null) qs.set('offset', String(params.offset));
      const query = qs.toString() ? `?${qs.toString()}` : '';
      return request<{ tasks: Task[]; total: number }>(`/tasks${query}`);
    },

    get: (id: string) => request<Task>(`/tasks/${id}`),

    create: (body: CreateTaskDto) =>
      request<Task>('/tasks', {
        method: 'POST',
        body: JSON.stringify(body),
      }),

    update: (id: string, body: Partial<Pick<Task, 'summary' | 'urgency' | 'domain' | 'state' | 'estimatedMinutes'>>) =>
      request<Task>(`/tasks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),

    dismiss: (id: string) =>
      request<{ ok: boolean }>(`/tasks/${id}`, { method: 'DELETE' }),
  },

  agentJobs: {
    list: (params?: { status?: string; limit?: number; offset?: number }) => {
      const qs = new URLSearchParams();
      if (params?.status) qs.set('status', params.status);
      if (params?.limit != null) qs.set('limit', String(params.limit));
      if (params?.offset != null) qs.set('offset', String(params.offset));
      const query = qs.toString() ? `?${qs.toString()}` : '';
      return request<{ jobs: AgentJob[]; total: number }>(`/agent-jobs${query}`);
    },

    get: (id: string) => request<AgentJob>(`/agent-jobs/${id}`),

    create: (body: CreateAgentJobDto) =>
      request<AgentJob>('/agent-jobs', {
        method: 'POST',
        body: JSON.stringify(body),
      }),

    update: (id: string, body: Partial<AgentJob>) =>
      request<AgentJob>(`/agent-jobs/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
  },
};
