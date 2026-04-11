import type { Task, TaskPriority, TaskStatus } from '../types';
import { tasksApi } from '../lib/api';
import { useQueryClient } from '@tanstack/react-query';

interface Props {
  task: Task;
  projectId: string;
  canEdit: boolean;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

const STATUS_LABELS: Record<TaskStatus, string>  = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };
const STATUS_COLORS: Record<TaskStatus, string>  = {
  todo:        'bg-slate-100 text-slate-700',
  in_progress: 'bg-blue-100  text-blue-700',
  done:        'bg-green-100 text-green-700',
};
const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low:    'bg-slate-100 text-slate-600',
  medium: 'bg-amber-100 text-amber-700',
  high:   'bg-red-100   text-red-700',
};

export default function TaskCard({ task, projectId, canEdit, onEdit, onDelete }: Props) {
  const qc = useQueryClient();

  const handleStatusChange = async (newStatus: TaskStatus) => {
    // Optimistic update
    qc.setQueryData<import('../types').ProjectWithTasks>(['project', projectId], old => {
      if (!old) return old;
      return {
        ...old,
        tasks: old.tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t),
      };
    });

    try {
      await tasksApi.update(task.id, { status: newStatus });
      qc.invalidateQueries({ queryKey: ['project', projectId] });
    } catch {
      // Revert optimistic update on failure
      qc.invalidateQueries({ queryKey: ['project', projectId] });
    }
  };

  const dueLabel = task.due_date
    ? new Date(task.due_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null;

  const isOverdue = task.due_date &&
    task.status !== 'done' &&
    new Date(task.due_date) < new Date(new Date().toDateString());

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Title + priority badge */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[task.priority]}`}>
              {task.priority}
            </span>
            <h3 className="text-sm font-medium text-slate-800 truncate">{task.title}</h3>
          </div>

          {/* Description */}
          {task.description && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{task.description}</p>
          )}

          {/* Meta row */}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {/* Status selector (optimistic) */}
            <select
              value={task.status}
              onChange={e => handleStatusChange(e.target.value as TaskStatus)}
              className={`text-xs font-medium rounded-full px-2 py-0.5 border-0 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 ${STATUS_COLORS[task.status]}`}
            >
              {(Object.entries(STATUS_LABELS) as [TaskStatus, string][]).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>

            {/* Assignee */}
            {task.assignee && (
              <span className="text-xs text-slate-500">
                {task.assignee.name}
              </span>
            )}

            {/* Due date */}
            {dueLabel && (
              <span className={`text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-slate-500'}`}>
                {isOverdue && '⚠ '}{dueLabel}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        {canEdit && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onEdit(task)}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded transition-colors"
              title="Edit task"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={() => onDelete(task)}
              className="p-1.5 text-slate-400 hover:text-red-600 rounded transition-colors"
              title="Delete task"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
