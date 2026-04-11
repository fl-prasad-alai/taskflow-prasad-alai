import { motion } from 'framer-motion';
import { Pencil, Trash2, CalendarDays, User } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import type { Task, TaskPriority, TaskStatus, ProjectWithTasks } from '../types';
import { tasksApi } from '../lib/api';

interface Props {
  task: Task;
  projectId: string;
  canEdit: boolean;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

// ── Design tokens ────────────────────────────────────────────────────────────

type StatusCfg = { label: string; dot: string; badge: string; shadow: string; progress: number };

const STATUS_CFG: Record<TaskStatus, StatusCfg> = {
  todo: {
    label:    'To Do',
    dot:      'bg-zinc-400',
    badge:    'bg-zinc-500/15 text-zinc-400 border-zinc-500/20',
    shadow:   '',
    progress: 0,
  },
  in_progress: {
    label:    'In Progress',
    dot:      'bg-violet-400 animate-pulse',
    badge:    'bg-violet-500/15 text-violet-400 border-violet-500/25',
    shadow:   'shadow-glow-violet',
    progress: 50,
  },
  done: {
    label:    'Done',
    dot:      'bg-emerald-400',
    badge:    'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    shadow:   'shadow-glow-emerald',
    progress: 100,
  },
};

const PRIORITY_CFG: Record<TaskPriority, { label: string; color: string }> = {
  low:    { label: 'Low',    color: 'text-zinc-500' },
  medium: { label: 'Med',    color: 'text-amber-400' },
  high:   { label: 'High',   color: 'text-red-400'  },
};

// M4 ProMotion spring
const SPRING = { type: 'spring', stiffness: 380, damping: 28, mass: 0.8 } as const;

export default function TaskCard({ task, projectId, canEdit, onEdit, onDelete }: Props) {
  const qc = useQueryClient();
  const cfg = STATUS_CFG[task.status];

  // ── Optimistic status change ─────────────────────────────────────────────
  const handleStatusChange = async (newStatus: TaskStatus) => {
    qc.setQueryData<ProjectWithTasks>(['project', projectId], (old) => {
      if (!old) return old;
      return { ...old, tasks: old.tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t) };
    });
    try {
      await tasksApi.update(task.id, { status: newStatus });
    } finally {
      qc.invalidateQueries({ queryKey: ['project', projectId] });
    }
  };

  // ── Due date formatting ───────────────────────────────────────────────────
  const dueLabel = task.due_date
    ? new Date(task.due_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null;
  const isOverdue = !!task.due_date && task.status !== 'done' &&
    new Date(task.due_date) < new Date(new Date().toDateString());

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      whileHover={{ y: -3, transition: SPRING }}
      transition={{ duration: 0.22 }}
      className="
        group relative overflow-hidden rounded-xl
        bg-white/[.03] dark:bg-white/[.03] bg-white
        dark:border dark:border-white/[.07] border border-black/[.06]
        dark:hover:border-white/[.14] hover:border-black/[.12]
        shadow-ambient dark:shadow-ambient shadow-card-light
        transition-[border-color] duration-200
      "
    >
      {/* Coloured left-edge accent bar */}
      <span
        className={`absolute left-0 inset-y-0 w-[3px] rounded-l-xl transition-colors duration-300 ${
          task.status === 'done'        ? 'bg-emerald-500/70' :
          task.status === 'in_progress' ? 'bg-violet-500/70'  :
                                          'bg-zinc-600/50'
        }`}
      />

      <div className="pl-4 pr-3 py-3.5 flex items-start gap-3">
        {/* ── Main content ────────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">

          {/* Title row */}
          <div className="flex items-start gap-2 mb-1.5">
            {/* Priority indicator */}
            <span
              title={`Priority: ${task.priority}`}
              className={`shrink-0 mt-0.5 text-[10px] font-bold uppercase tracking-widest font-mono ${PRIORITY_CFG[task.priority].color}`}
            >
              {PRIORITY_CFG[task.priority].label}
            </span>

            <h3 className={`text-sm font-medium leading-snug dark:text-zinc-100 text-zinc-900 ${task.status === 'done' ? 'line-through dark:text-zinc-500 text-zinc-400' : ''}`}>
              {task.title}
            </h3>
          </div>

          {/* Description */}
          {task.description && (
            <p className="text-xs dark:text-zinc-500 text-zinc-500 mb-2 line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}

          {/* ── Liquid progress bar ──────────────────────────────────────────── */}
          <div className="relative h-[3px] rounded-full dark:bg-white/[.06] bg-black/[.05] overflow-hidden mb-2.5">
            <motion.div
              className={`absolute inset-y-0 left-0 rounded-full ${
                task.status === 'done'        ? 'bg-emerald-500' :
                task.status === 'in_progress' ? 'bg-violet-500'  :
                                                'bg-zinc-600'
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${cfg.progress}%` }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            >
              {/* Shimmer on in_progress */}
              {task.status === 'in_progress' && (
                <motion.span
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }}
                />
              )}
            </motion.div>
          </div>

          {/* ── Meta row ─────────────────────────────────────────────────────── */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status badge (click cycles through statuses) */}
            <select
              value={task.status}
              onChange={e => handleStatusChange(e.target.value as TaskStatus)}
              className={`
                appearance-none cursor-pointer px-2 py-0.5 rounded-full border text-[11px] font-medium
                focus:outline-none focus:ring-1 focus:ring-violet-500
                ${cfg.badge} ${cfg.shadow}
              `}
            >
              {(Object.entries(STATUS_CFG) as [TaskStatus, StatusCfg][]).map(([v, c]) => (
                <option key={v} value={v}>{c.label}</option>
              ))}
            </select>

            {/* Assignee */}
            {task.assignee && (
              <span className="flex items-center gap-1 text-[11px] dark:text-zinc-500 text-zinc-500">
                <User className="w-3 h-3" />
                {task.assignee.name}
              </span>
            )}

            {/* Due date */}
            {dueLabel && (
              <span className={`flex items-center gap-1 text-[11px] font-mono ${isOverdue ? 'text-red-400 font-semibold' : 'dark:text-zinc-500 text-zinc-500'}`}>
                <CalendarDays className="w-3 h-3" />
                {isOverdue && '⚠ '}{dueLabel}
              </span>
            )}
          </div>
        </div>

        {/* ── Action buttons (visible on hover) ───────────────────────────── */}
        {canEdit && (
          <div className="flex flex-col gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            <motion.button
              onClick={() => onEdit(task)}
              whileTap={{ scale: 0.85 }}
              title="Edit task"
              className="p-1.5 rounded-lg dark:text-zinc-600 dark:hover:text-zinc-200 dark:hover:bg-white/8 text-zinc-400 hover:text-zinc-700 hover:bg-black/5 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
            </motion.button>
            <motion.button
              onClick={() => onDelete(task)}
              whileTap={{ scale: 0.85 }}
              title="Delete task"
              className="p-1.5 rounded-lg dark:text-zinc-600 dark:hover:text-red-400 dark:hover:bg-red-500/10 text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </motion.button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
