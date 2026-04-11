import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, ChevronRight, Folder, AlertTriangle,
  Pencil, Trash2, SlidersHorizontal, Users,
  CheckCircle2, Clock, Circle,
} from 'lucide-react';
import { projectsApi, tasksApi, usersApi } from '../lib/api';
import type { Task, TaskStatus, UserSummary } from '../types';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import GlassCard from '../components/GlassCard';
import TaskCard from '../components/TaskCard';
import TaskModal, { type TaskFormData } from '../components/TaskModal';
import ProjectModal from '../components/ProjectModal';

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo:        'To Do',
  in_progress: 'In Progress',
  done:        'Done',
};

const FADE_UP = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0,  transition: { type: 'spring', stiffness: 300, damping: 26 } },
};
const STAGGER = { show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } } };

// ── Glass Confirm Dialog ─────────────────────────────────────────────────────

function ConfirmDialog({
  title, body, confirmLabel, onConfirm, onCancel, danger = true,
}: {
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Dialog */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1,    y: 0  }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="
          relative w-full max-w-sm rounded-2xl p-6 overflow-hidden
          dark:bg-zinc-900/90 bg-white
          dark:border dark:border-white/[.08] border border-black/[.08]
          dark:shadow-glass shadow-card-light
        "
      >
        <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        {/* Icon */}
        {danger && (
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
        )}

        <h2 className="text-base font-semibold dark:text-zinc-100 text-zinc-900 mb-1">{title}</h2>
        <p className="text-sm dark:text-zinc-400 text-zinc-600 mb-6">{body}</p>

        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm dark:text-zinc-400 dark:hover:text-zinc-200 text-zinc-600 hover:text-zinc-900 transition-colors rounded-lg dark:hover:bg-white/5 hover:bg-black/5"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-semibold rounded-xl transition-colors ${
              danger
                ? 'bg-red-600 hover:bg-red-500 text-white'
                : 'bg-violet-600 hover:bg-violet-500 text-white'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function ProjectDetailPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();

  const [statusFilter,   setStatusFilter]   = useState<string>('');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('');
  const [taskModal,      setTaskModal]      = useState<{ open: boolean; task?: Task }>({ open: false });
  const [editProjectOpen, setEditProjectOpen]   = useState(false);
  const [deleteConfirm,    setDeleteConfirm]    = useState<Task | null>(null);
  const [deleteProjectConfirm, setDeleteProjectConfirm] = useState(false);

  // ── Queries ───────────────────────────────────────────────────────────────

  const { data: project, isLoading, error } = useQuery({
    queryKey: ['project', projectId],
    queryFn:  () => projectsApi.get(projectId!),
    enabled:  !!projectId,
  });

  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn:  () => usersApi.list(),
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
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['project', projectId] }),
  });

  const updateProject = useMutation({
    mutationFn: ({ name, description }: { name: string; description: string }) =>
      projectsApi.update(projectId!, { name, description: description || undefined }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['project', projectId] }),
  });

  const deleteProject = useMutation({
    mutationFn: () => projectsApi.delete(projectId!),
    onSuccess:  () => navigate('/projects'),
  });

  // ── Derived state ─────────────────────────────────────────────────────────

  const isOwner = project?.owner_id === user?.id;

  const tasks = project?.tasks ?? [];
  const filteredTasks = tasks.filter(t => {
    if (statusFilter   && t.status      !== statusFilter)   return false;
    if (assigneeFilter && t.assignee_id !== assigneeFilter) return false;
    return true;
  });

  const donePct = tasks.length
    ? Math.round((tasks.filter(t => t.status === 'done').length / tasks.length) * 100)
    : 0;

  const handleSaveTask = async (data: TaskFormData) => {
    if (taskModal.task) {
      await updateTask.mutateAsync({ id: taskModal.task.id, data });
    } else {
      await createTask.mutateAsync(data);
    }
  };

  // ── Loading state ─────────────────────────────────────────────────────────

  if (isLoading) return (
    <div className="min-h-screen dark:bg-black bg-zinc-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-28 pb-16 space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 rounded-2xl dark:bg-white/[.02] bg-black/[.03] animate-pulse"
            style={{ animationDelay: `${i * 80}ms` }} />
        ))}
      </div>
    </div>
  );

  if (error || !project) return (
    <div className="min-h-screen dark:bg-black bg-zinc-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-28 pb-16">
        <GlassCard className="border-red-500/20 bg-red-500/5">
          <p className="text-sm text-red-400">
            {error ? 'Failed to load project.' : 'Project not found.'}{' '}
            <Link to="/projects" className="underline text-red-300 hover:text-red-200">
              Back to projects
            </Link>
          </p>
        </GlassCard>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen dark:bg-black bg-zinc-50">
      <Navbar />

      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-x-0 top-0 h-96 bg-glow-radial dark:opacity-100 opacity-40" />

      <main className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-16">

        {/* ── Breadcrumb ───────────────────────────────────────────────────── */}
        <motion.nav
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.05 }}
          className="flex items-center gap-1.5 text-xs font-mono dark:text-zinc-600 text-zinc-400 uppercase tracking-widest mb-6"
        >
          <Link to="/projects" className="dark:hover:text-zinc-300 hover:text-zinc-700 transition-colors">
            Projects
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="dark:text-zinc-400 text-zinc-600">{project.name}</span>
        </motion.nav>

        {/* ── Project header ───────────────────────────────────────────────── */}
        <motion.div
          variants={STAGGER}
          initial="hidden"
          animate="show"
          className="mb-8"
        >
          <div className="flex items-start justify-between gap-4 mb-4">
            <motion.div variants={FADE_UP} className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center shrink-0">
                <Folder className="w-5 h-5 text-violet-400" />
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl font-bold tracking-tight dark:text-zinc-100 text-zinc-900 leading-tight">
                  {project.name}
                </h1>
                {project.description && (
                  <p className="text-sm dark:text-zinc-500 text-zinc-500 mt-0.5 line-clamp-2">
                    {project.description}
                  </p>
                )}
              </div>
            </motion.div>

            {isOwner && (
              <motion.div variants={FADE_UP} className="flex items-center gap-2 shrink-0">
                <motion.button
                  onClick={() => setEditProjectOpen(true)}
                  whileTap={{ scale: 0.93 }}
                  className="
                    flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                    dark:text-zinc-400 dark:hover:text-zinc-200 dark:border dark:border-white/[.08] dark:hover:border-white/[.15] dark:hover:bg-white/5
                    text-zinc-600 hover:text-zinc-900 border border-black/[.08] hover:border-black/[.15] hover:bg-black/5
                    transition-colors
                  "
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit
                </motion.button>
                <motion.button
                  onClick={() => setDeleteProjectConfirm(true)}
                  whileTap={{ scale: 0.93 }}
                  className="
                    flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                    dark:text-red-400/70 dark:hover:text-red-400 dark:border dark:border-red-500/20 dark:hover:border-red-500/40 dark:hover:bg-red-500/10
                    text-red-600/60 hover:text-red-600 border border-red-500/20 hover:border-red-500/40 hover:bg-red-50
                    transition-colors
                  "
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </motion.button>
              </motion.div>
            )}
          </div>

          {/* Progress + stats row */}
          <motion.div variants={FADE_UP}>
            <GlassCard noHover padding="sm" className="bg-violet-500/[.04] border-violet-500/15">
              <div className="flex items-center gap-6 flex-wrap">
                {/* Progress bar */}
                <div className="flex-1 min-w-[120px]">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono dark:text-zinc-500 text-zinc-500 uppercase tracking-wider">Progress</span>
                    <span className="text-[10px] font-mono text-violet-400">{donePct}%</span>
                  </div>
                  <div className="h-[3px] rounded-full dark:bg-white/[.06] bg-black/[.05] overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-violet-600 to-violet-400 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${donePct}%` }}
                      transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                    />
                  </div>
                </div>

                {/* Mini stats */}
                <div className="flex items-center gap-4 shrink-0">
                  <MiniStat icon={<Circle className="w-3 h-3 text-zinc-400 fill-current" />}
                    label="To Do" value={tasks.filter(t => t.status === 'todo').length} />
                  <MiniStat icon={<Clock className="w-3 h-3 text-violet-400" />}
                    label="In Progress" value={tasks.filter(t => t.status === 'in_progress').length} />
                  <MiniStat icon={<CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                    label="Done" value={tasks.filter(t => t.status === 'done').length} />
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>

        {/* ── Filter bar ───────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex flex-wrap items-center gap-2 mb-5"
        >
          <div className="flex items-center gap-1 dark:text-zinc-600 text-zinc-400">
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="
              appearance-none cursor-pointer px-3 py-1.5 rounded-xl text-xs font-medium
              dark:bg-white/[.04] bg-zinc-50
              dark:border dark:border-white/[.08] border border-black/[.08]
              dark:text-zinc-400 text-zinc-600
              focus:outline-none focus:ring-1 focus:ring-violet-500/50
              transition-colors
            "
          >
            <option value="">All statuses</option>
            {(Object.entries(STATUS_LABELS) as [TaskStatus, string][]).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>

          <select
            value={assigneeFilter}
            onChange={e => setAssigneeFilter(e.target.value)}
            className="
              appearance-none cursor-pointer px-3 py-1.5 rounded-xl text-xs font-medium
              dark:bg-white/[.04] bg-zinc-50
              dark:border dark:border-white/[.08] border border-black/[.08]
              dark:text-zinc-400 text-zinc-600
              focus:outline-none focus:ring-1 focus:ring-violet-500/50
              transition-colors
            "
          >
            <option value="">All assignees</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>

          <div className="flex-1" />

          <motion.button
            onClick={() => setTaskModal({ open: true })}
            whileTap={{ scale: 0.95, transition: { type: 'spring', stiffness: 600, damping: 35 } }}
            className="
              flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold
              bg-violet-600 hover:bg-violet-500 text-white
              shadow-glow-violet transition-colors duration-200
            "
          >
            <Plus className="w-3.5 h-3.5" />
            Add Task
          </motion.button>
        </motion.div>

        {/* ── Task count ───────────────────────────────────────────────────── */}
        <p className="text-xs font-mono dark:text-zinc-600 text-zinc-400 mb-4 uppercase tracking-widest">
          {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
          {(statusFilter || assigneeFilter) ? ' (filtered)' : ''}
        </p>

        {/* ── Empty state ───────────────────────────────────────────────────── */}
        {filteredTasks.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            {statusFilter || assigneeFilter ? (
              <>
                <div className="w-12 h-12 rounded-xl bg-zinc-500/10 border border-zinc-500/20 flex items-center justify-center mb-3">
                  <SlidersHorizontal className="w-5 h-5 dark:text-zinc-500 text-zinc-400" />
                </div>
                <h3 className="text-sm font-semibold dark:text-zinc-300 text-zinc-700 mb-1">
                  No tasks match your filters
                </h3>
                <p className="text-xs dark:text-zinc-600 text-zinc-500">
                  Try adjusting the filters above.
                </p>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-3">
                  <Users className="w-5 h-5 text-violet-400" />
                </div>
                <h3 className="text-sm font-semibold dark:text-zinc-300 text-zinc-700 mb-1">
                  No tasks yet
                </h3>
                <p className="text-xs dark:text-zinc-600 text-zinc-500 mb-5">
                  Add the first task to get started.
                </p>
                <motion.button
                  onClick={() => setTaskModal({ open: true })}
                  whileTap={{ scale: 0.96 }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white shadow-glow-violet transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Task
                </motion.button>
              </>
            )}
          </motion.div>
        )}

        {/* ── Task list ─────────────────────────────────────────────────────── */}
        <AnimatePresence>
          {filteredTasks.length > 0 && (
            <motion.div
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.05 } } }}
              className="space-y-2"
            >
              {filteredTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  projectId={projectId!}
                  canEdit={isOwner || task.created_by === user?.id}
                  onEdit={t => setTaskModal({ open: true, task: t })}
                  onDelete={t => setDeleteConfirm(t)}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}

      <TaskModal
        open={taskModal.open}
        task={taskModal.task}
        users={users}
        onClose={() => setTaskModal({ open: false })}
        onSave={handleSaveTask}
      />

      <ProjectModal
        open={editProjectOpen}
        project={project}
        onClose={() => setEditProjectOpen(false)}
        onSave={async (name, description) => updateProject.mutateAsync({ name, description })}
      />

      <AnimatePresence>
        {deleteProjectConfirm && (
          <ConfirmDialog
            title="Delete project?"
            body={`"${project.name}" and all its tasks will be permanently deleted.`}
            confirmLabel="Delete Project"
            onConfirm={() => { setDeleteProjectConfirm(false); deleteProject.mutate(); }}
            onCancel={() => setDeleteProjectConfirm(false)}
          />
        )}
        {deleteConfirm && (
          <ConfirmDialog
            title="Delete task?"
            body={`"${deleteConfirm.title}" will be permanently deleted.`}
            confirmLabel="Delete Task"
            onConfirm={async () => {
              await deleteTask.mutateAsync(deleteConfirm.id);
              setDeleteConfirm(null);
            }}
            onCancel={() => setDeleteConfirm(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── MiniStat ─────────────────────────────────────────────────────────────────

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {icon}
      <span className="text-xs font-bold dark:text-zinc-200 text-zinc-800">{value}</span>
      <span className="text-[10px] dark:text-zinc-600 text-zinc-400 hidden sm:inline">{label}</span>
    </div>
  );
}
