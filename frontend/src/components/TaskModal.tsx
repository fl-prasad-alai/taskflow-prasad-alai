import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import type { Task, TaskPriority, TaskStatus, UserSummary } from '../types';

interface Props {
  open: boolean;
  task?: Task;
  users: UserSummary[];
  onClose: () => void;
  onSave: (data: TaskFormData) => Promise<void>;
}

export interface TaskFormData {
  title:       string;
  description: string;
  status:      TaskStatus;
  priority:    TaskPriority;
  assignee_id: string | null;
  due_date:    string | null;
}

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'todo',        label: 'To Do'       },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done',        label: 'Done'        },
];

const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: 'low',    label: 'Low'    },
  { value: 'medium', label: 'Medium' },
  { value: 'high',   label: 'High'   },
];

// Shared field style
const FIELD_INPUT = `
  w-full px-3 py-2.5 rounded-xl text-sm
  dark:bg-white/[.04] bg-zinc-50
  dark:border dark:border-white/[.08] border border-black/[.08]
  dark:text-zinc-100 text-zinc-900
  dark:placeholder-zinc-600 placeholder-zinc-400
  focus:outline-none focus:ring-2 focus:ring-violet-500/50
  transition-colors
`;

const LABEL = 'block text-xs font-medium dark:text-zinc-400 text-zinc-600 mb-1.5 uppercase tracking-wider';

export default function TaskModal({ open, task, users, onClose, onSave }: Props) {
  const [form, setForm] = useState<TaskFormData>({
    title:       '',
    description: '',
    status:      'todo',
    priority:    'medium',
    assignee_id: null,
    due_date:    null,
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setForm({
        title:       task?.title       ?? '',
        description: task?.description ?? '',
        status:      task?.status      ?? 'todo',
        priority:    task?.priority    ?? 'medium',
        assignee_id: task?.assignee_id ?? null,
        due_date:    task?.due_date    ?? null,
      });
      setFieldErrors({});
      setTimeout(() => titleRef.current?.focus(), 60);
    }
  }, [open, task]);

  const set = <K extends keyof TaskFormData>(k: K, v: TaskFormData[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!form.title.trim()) errors.title = 'Title is required';
    if (Object.keys(errors).length) { setFieldErrors(errors); return; }
    setSaving(true);
    try {
      await onSave({ ...form, title: form.title.trim() });
      onClose();
    } catch (err: unknown) {
      setFieldErrors({ _form: err instanceof Error ? err.message : 'An error occurred' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            key="sheet"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="
              relative w-full max-w-lg rounded-2xl overflow-hidden
              dark:bg-zinc-900/95 bg-white
              dark:border dark:border-white/[.08] border border-black/[.08]
              dark:shadow-glass shadow-card-light
              max-h-[90vh] flex flex-col
            "
          >
            {/* Top-edge highlight */}
            <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b dark:border-white/[.06] border-black/[.06]">
              <h2 className="text-base font-semibold dark:text-zinc-100 text-zinc-900">
                {task ? 'Edit Task' : 'New Task'}
              </h2>
              <motion.button
                onClick={onClose}
                whileTap={{ scale: 0.88 }}
                className="p-1.5 rounded-lg dark:text-zinc-600 dark:hover:text-zinc-300 dark:hover:bg-white/8 text-zinc-400 hover:text-zinc-700 hover:bg-black/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </motion.button>
            </div>

            {/* Body */}
            <form id="task-form" onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5 space-y-4">

              {/* Title */}
              <div>
                <label className={LABEL}>
                  Title <span className="text-red-400 normal-case tracking-normal">*</span>
                </label>
                <input
                  ref={titleRef}
                  value={form.title}
                  onChange={e => set('title', e.target.value)}
                  className={`${FIELD_INPUT} ${fieldErrors.title ? 'border-red-500/50 focus:ring-red-500/40' : ''}`}
                  placeholder="Task title"
                />
                {fieldErrors.title && (
                  <p className="text-xs text-red-400 mt-1">{fieldErrors.title}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className={LABEL}>Description</label>
                <textarea
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                  rows={3}
                  className={`${FIELD_INPUT} resize-none`}
                  placeholder="Optional details"
                />
              </div>

              {/* Status + Priority */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL}>Status</label>
                  <select
                    value={form.status}
                    onChange={e => set('status', e.target.value as TaskStatus)}
                    className={FIELD_INPUT}
                  >
                    {STATUS_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={LABEL}>Priority</label>
                  <select
                    value={form.priority}
                    onChange={e => set('priority', e.target.value as TaskPriority)}
                    className={FIELD_INPUT}
                  >
                    {PRIORITY_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Assignee */}
              <div>
                <label className={LABEL}>Assignee</label>
                <select
                  value={form.assignee_id ?? ''}
                  onChange={e => set('assignee_id', e.target.value || null)}
                  className={FIELD_INPUT}
                >
                  <option value="">Unassigned</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>

              {/* Due date */}
              <div>
                <label className={LABEL}>Due Date</label>
                <input
                  type="date"
                  value={form.due_date ?? ''}
                  onChange={e => set('due_date', e.target.value || null)}
                  className={FIELD_INPUT}
                />
              </div>

              {fieldErrors._form && (
                <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                  {fieldErrors._form}
                </p>
              )}
            </form>

            {/* Footer */}
            <div className="flex justify-end gap-2 px-6 py-4 border-t dark:border-white/[.06] border-black/[.06]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm dark:text-zinc-400 dark:hover:text-zinc-200 text-zinc-600 hover:text-zinc-900 transition-colors rounded-lg dark:hover:bg-white/5 hover:bg-black/5"
              >
                Cancel
              </button>
              <motion.button
                type="submit"
                form="task-form"
                disabled={saving}
                whileTap={{ scale: 0.97, transition: { type: 'spring', stiffness: 600, damping: 35 } }}
                className="
                  flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
                  bg-violet-600 hover:bg-violet-500 text-white
                  disabled:opacity-50 disabled:cursor-not-allowed
                  shadow-glow-violet transition-colors duration-200
                "
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                      className="block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full"
                    />
                    Saving…
                  </span>
                ) : (
                  task ? 'Save Changes' : 'Create Task'
                )}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
