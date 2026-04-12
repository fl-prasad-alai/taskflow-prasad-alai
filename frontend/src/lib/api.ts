import type {
  Project,
  ProjectWithTasks,
  ProjectStats,
  Task,
  TaskPriority,
  User,
  UserSummary,
} from '../types';

const BASE_URL = '/api';  // Vite proxy strips /api in dev; Vercel routes /api/* to serverless fn

class ApiError extends Error {
  status: number;
  fields?: Record<string, string>;

  constructor(status: number, message: string, fields?: Record<string, string>) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const token = localStorage.getItem('tf_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return undefined as unknown as T;

  const data = await res.json();

  if (!res.ok) {
    throw new ApiError(res.status, data.error ?? 'Unknown error', data.fields);
  }

  return data as T;
}

const get  = <T>(path: string)                 => request<T>('GET',    path);
const post = <T>(path: string, body: unknown)  => request<T>('POST',   path, body);
const patch = <T>(path: string, body: unknown) => request<T>('PATCH',  path, body);
const del  = (path: string)                    => request<void>('DELETE', path);

// ── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthResponse {
  token: string;
  user: User;
}

export const authApi = {
  register: (name: string, email: string, password: string) =>
    post<AuthResponse>('/auth/register', { name, email, password }),
  login: (email: string, password: string) =>
    post<AuthResponse>('/auth/login', { email, password }),
};

// ── Users ─────────────────────────────────────────────────────────────────────

export const usersApi = {
  list: () => get<{ users: UserSummary[] }>('/users'),
};

// ── Projects ─────────────────────────────────────────────────────────────────

export const projectsApi = {
  list: () => get<{ projects: Project[] }>('/projects'),

  get: (id: string) => get<ProjectWithTasks>(`/projects/${id}`),

  create: (name: string, description?: string) =>
    post<Project>('/projects', { name, description }),

  update: (id: string, data: { name?: string; description?: string }) =>
    patch<Project>(`/projects/${id}`, data),

  delete: (id: string) => del(`/projects/${id}`),

  stats: (id: string) => get<ProjectStats>(`/projects/${id}/stats`),
};

// ── Tasks ─────────────────────────────────────────────────────────────────────

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: TaskPriority;
  assignee_id?: string | null;
  due_date?: string | null;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  status?: string;
  priority?: TaskPriority;
  assignee_id?: string | null;
  due_date?: string | null;
}

export const tasksApi = {
  list: (projectId: string, filters?: { status?: string; assignee?: string }) => {
    const params = new URLSearchParams();
    if (filters?.status)   params.set('status',   filters.status);
    if (filters?.assignee) params.set('assignee', filters.assignee);
    const qs = params.toString();
    return get<{ tasks: Task[] }>(`/projects/${projectId}/tasks${qs ? `?${qs}` : ''}`);
  },

  create: (projectId: string, data: CreateTaskInput) =>
    post<Task>(`/projects/${projectId}/tasks`, data),

  update: (id: string, data: UpdateTaskInput) =>
    patch<Task>(`/tasks/${id}`, data),

  delete: (id: string) => del(`/tasks/${id}`),
};

export { ApiError };
