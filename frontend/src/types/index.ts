export interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

export interface UserSummary {
  id: string;
  name: string;
  email: string;
}

export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  project_id: string;
  assignee_id: string | null;
  assignee: UserSummary | null;
  created_by: string;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  created_at: string;
}

export interface ProjectWithTasks extends Project {
  tasks: Task[];
}

export interface ProjectStats {
  project_id: string;
  total: number;
  by_status: Record<TaskStatus, number>;
  by_assignee: Array<{ assignee_id: string; assignee_name: string; count: number }>;
}

export interface ApiError {
  error: string;
  fields?: Record<string, string>;
}
