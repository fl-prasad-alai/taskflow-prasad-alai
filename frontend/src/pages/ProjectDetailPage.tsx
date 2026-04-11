import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi, tasksApi, usersApi } from '../lib/api';
import type { Task, TaskStatus, UserSummary } from '../types';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import TaskCard from '../components/TaskCard';
import TaskModal, { type TaskFormData } from '../components/TaskModal';
import ProjectModal from '../components/ProjectModal';

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
};

export default function ProjectDetailPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<string>('');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('');
  const [taskModal, setTaskModal] = useState<{ open: boolean; task?: Task }>({ open: false });
  const [editProjectOpen, setEditProjectOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Task | null>(null);
  const [deleteProjectConfirm, setDeleteProjectConfirm] = useState(false);

  // ── Queries ───────────────────────────────────────────────────────────────

  const { data: project, isLoading, error } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectsApi.get(projectId!),
    enabled: !!projectId,
  });

  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.list(),
  });

  const users: UserSummary[] = usersData?.users ?? [];

  // ── Mutations ─────────────────────────────────────────────────────────────

  const createTask = useMutation({
    mutationFn: (data: TaskFormData) =>
      tasksApi.create(projectId!, {
        title:       data.title,
        description: data.description || undefined,
        priority:    data.priority,
        assignee_id: data.assignee_id,
        due_date:    data.due_date,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['project', projectId] }),
  });

  const updateTask = useMutation({
    mutationFn: ({ id, data }: { id: string; data: TaskFormData }) =>
      tasksApi.update(id, {
        title:       data.title,
        description: data.description || null,
        status:      data.status,
        priority:    data.priority,
        assignee_id: data.assignee_id,
        due_date:    data.due_date,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['project', projectId] }),
  });

  const deleteTask = useMutation({
    mutationFn: (id: string) => tasksApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['project', projectId] }),
  });

  const updateProject = useMutation({
    mutationFn: ({ name, description }: { name: string; description: string }) =>
      projectsApi.update(projectId!, { name, description: description || undefined }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['project', projectId] }),
  });

  const deleteProject = useMutation({
    mutationFn: () => projectsApi.delete(projectId!),
    onSuccess: () => navigate('/projects'),
  });

  // ── Derived state ─────────────────────────────────────────────────────────

  const isOwner = project?.owner_id === user?.id;

  const filteredTasks = (project?.tasks ?? []).filter(t => {
    if (statusFilter   && t.status      !== statusFilter)   return false;
    if (assigneeFilter && t.assignee_id !== assigneeFilter) return false;
    return true;
  });

  const handleSaveTask = async (data: TaskFormData) => {
    if (taskModal.task) {
      await updateTask.mutateAsync({ id: taskModal.task.id, data });
    } else {
      await createTask.mutateAsync(data);
    }
  };

  const handleDeleteTask = async (task: Task) => {
    setDeleteConfirm(task);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    await deleteTask.mutateAsync(deleteConfirm.id);
    setDeleteConfirm(null);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (isLoading) return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <LoadingSpinner className="mt-16" />
    </div>
  );

  if (error || !project) return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
          {error ? 'Failed to load project.' : 'Project not found.'}{' '}
          <Link to="/projects" className="underline">Back to projects</Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-slate-500 mb-4">
          <Link to="/projects" className="hover:text-slate-700">Projects</Link>
          <span className="mx-2">/</span>
          <span className="text-slate-800">{project.name}</span>
        </nav>

        {/* Project header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-slate-900">{project.name}</h1>
            {project.description && (
              <p className="text-slate-500 mt-1 text-sm">{project.description}</p>
            )}
          </div>
          {isOwner && (
            <div className="flex items-center gap-2 ml-4 shrink-0">
              <button
                onClick={() => setEditProjectOpen(true)}
                className="text-sm text-slate-600 hover:text-slate-800 border border-slate-200 rounded-lg px-3 py-1.5 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => setDeleteProjectConfirm(true)}
                className="text-sm text-red-600 hover:text-red-800 border border-red-200 rounded-lg px-3 py-1.5 transition-colors"
              >
                Delete
              </button>
            </div>
          )}
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All statuses</option>
            {(Object.entries(STATUS_LABELS) as [TaskStatus, string][]).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>

          <select
            value={assigneeFilter}
            onChange={e => setAssigneeFilter(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All assignees</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>

          <div className="flex-1" />

          <button
            onClick={() => setTaskModal({ open: true })}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Task
          </button>
        </div>

        {/* Task count */}
        <p className="text-sm text-slate-500 mb-4">
          {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
          {(statusFilter || assigneeFilter) ? ' (filtered)' : ''}
        </p>

        {/* Task list */}
        {filteredTasks.length === 0 ? (
          <EmptyState
            title={statusFilter || assigneeFilter ? 'No tasks match your filters' : 'No tasks yet'}
            description={
              statusFilter || assigneeFilter
                ? 'Try adjusting the filters above.'
                : 'Add the first task to get started.'
            }
            action={
              !statusFilter && !assigneeFilter ? (
                <button
                  onClick={() => setTaskModal({ open: true })}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Add Task
                </button>
              ) : undefined
            }
          />
        ) : (
          <div className="space-y-2">
            {filteredTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                projectId={projectId!}
                canEdit={isOwner || task.created_by === user?.id}
                onEdit={t => setTaskModal({ open: true, task: t })}
                onDelete={handleDeleteTask}
              />
            ))}
          </div>
        )}
      </main>

      {/* Task modal */}
      <TaskModal
        open={taskModal.open}
        task={taskModal.task}
        users={users}
        onClose={() => setTaskModal({ open: false })}
        onSave={handleSaveTask}
      />

      {/* Edit project modal */}
      <ProjectModal
        open={editProjectOpen}
        project={project}
        onClose={() => setEditProjectOpen(false)}
        onSave={async (name, description) => {
          await updateProject.mutateAsync({ name, description });
        }}
      />

      {/* Delete project confirmation */}
      {deleteProjectConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteProjectConfirm(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-2">Delete project?</h2>
            <p className="text-sm text-slate-600 mb-6">
              "{project.name}" and all its tasks will be permanently deleted.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteProjectConfirm(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={() => { setDeleteProjectConfirm(false); deleteProject.mutate(); }}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete task confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-2">Delete task?</h2>
            <p className="text-sm text-slate-600 mb-6">
              "{deleteConfirm.title}" will be permanently deleted.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
