import {
  BarChart, Bar, Cell, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie,
} from 'recharts';
import type { Task, TaskStatus, TaskPriority } from '../types';

interface Props {
  tasks: Task[];
}

// ── Design tokens ─────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<TaskStatus, string> = {
  todo:        '#52525b',   // zinc-600
  in_progress: '#8b5cf6',  // violet-500
  done:        '#10b981',  // emerald-500
};

const STATUS_LABEL: Record<TaskStatus, string> = {
  todo:        'To Do',
  in_progress: 'In Progress',
  done:        'Done',
};

const PRIORITY_COLOR: Record<TaskPriority, string> = {
  low:    '#52525b',
  medium: '#f59e0b',
  high:   '#ef4444',
};

// ── Custom tooltip ─────────────────────────────────────────────────────────────

function GlassTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { value: number; name: string; fill: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="
      px-3 py-2 rounded-xl text-xs
      dark:bg-zinc-900/95 bg-white
      dark:border dark:border-white/[.08] border border-black/[.08]
      dark:shadow-glass shadow-card-light
    ">
      {label && <p className="font-mono dark:text-zinc-500 text-zinc-400 mb-1 uppercase tracking-widest text-[10px]">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="font-semibold" style={{ color: p.fill }}>
          {p.value} task{p.value !== 1 ? 's' : ''}
        </p>
      ))}
    </div>
  );
}

// ── Status donut ───────────────────────────────────────────────────────────────

function StatusDonut({ tasks }: { tasks: Task[] }) {
  const data = (Object.keys(STATUS_LABEL) as TaskStatus[]).map(s => ({
    name:  STATUS_LABEL[s],
    value: tasks.filter(t => t.status === s).length,
    color: STATUS_COLOR[s],
  })).filter(d => d.value > 0);

  if (data.length === 0) return (
    <div className="flex items-center justify-center h-full dark:text-zinc-700 text-zinc-300 text-xs font-mono uppercase tracking-widest">
      No tasks
    </div>
  );

  const done  = tasks.filter(t => t.status === 'done').length;
  const total = tasks.length;
  const pct   = total ? Math.round((done / total) * 100) : 0;

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={52}
            outerRadius={72}
            paddingAngle={3}
            dataKey="value"
            animationDuration={900}
            animationEasing="ease-out"
          >
            {data.map((d, i) => (
              <Cell key={i} fill={d.color} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip content={<GlassTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Centre label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-2xl font-bold dark:text-zinc-100 text-zinc-900 leading-none">{pct}%</span>
        <span className="text-[10px] font-mono dark:text-zinc-600 text-zinc-400 uppercase tracking-widest mt-0.5">done</span>
      </div>
    </div>
  );
}

// ── Priority bar chart ────────────────────────────────────────────────────────

function PriorityBars({ tasks }: { tasks: Task[] }) {
  const priorities: TaskPriority[] = ['high', 'medium', 'low'];
  const data = priorities.map(p => ({
    name:  p.charAt(0).toUpperCase() + p.slice(1),
    value: tasks.filter(t => t.priority === p).length,
    color: PRIORITY_COLOR[p],
  }));

  return (
    <ResponsiveContainer width="100%" height={100}>
      <BarChart data={data} barSize={24} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
        <XAxis
          dataKey="name"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: '#71717a', fontFamily: 'JetBrains Mono, monospace' }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
          tick={{ fontSize: 10, fill: '#52525b' }}
          width={30}
        />
        <Tooltip content={<GlassTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
        <Bar dataKey="value" radius={[4, 4, 0, 0]} animationDuration={900}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.color} fillOpacity={0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Legend row ─────────────────────────────────────────────────────────────────

function LegendRow({ tasks }: { tasks: Task[] }) {
  return (
    <div className="flex items-center justify-center gap-4 mt-1">
      {(Object.entries(STATUS_LABEL) as [TaskStatus, string][]).map(([s, label]) => {
        const count = tasks.filter(t => t.status === s).length;
        return (
          <div key={s} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: STATUS_COLOR[s] }} />
            <span className="text-[11px] dark:text-zinc-500 text-zinc-500">{label}</span>
            <span className="text-[11px] font-bold dark:text-zinc-300 text-zinc-700">{count}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────

export default function TasksChart({ tasks }: Props) {
  if (tasks.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
      {/* Status donut */}
      <div className="
        rounded-2xl px-4 pt-4 pb-3
        dark:bg-white/[.02] bg-white
        dark:border dark:border-white/[.06] border border-black/[.06]
        dark:shadow-ambient shadow-card-light
      ">
        <p className="text-[10px] font-mono dark:text-zinc-600 text-zinc-400 uppercase tracking-widest mb-1">
          Status
        </p>
        <StatusDonut tasks={tasks} />
        <LegendRow tasks={tasks} />
      </div>

      {/* Priority bars */}
      <div className="
        rounded-2xl px-4 pt-4 pb-3
        dark:bg-white/[.02] bg-white
        dark:border dark:border-white/[.06] border border-black/[.06]
        dark:shadow-ambient shadow-card-light
      ">
        <p className="text-[10px] font-mono dark:text-zinc-600 text-zinc-400 uppercase tracking-widest mb-3">
          By Priority
        </p>
        <PriorityBars tasks={tasks} />
      </div>
    </div>
  );
}
