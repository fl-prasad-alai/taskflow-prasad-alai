import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Folder, ChevronRight, BarChart3, CheckCircle2, Clock, Circle } from 'lucide-react';
import { projectsApi } from '../lib/api';
import type { Project } from '../types';
import Navbar from '../components/Navbar';
import GlassCard from '../components/GlassCard';
import ProjectModal from '../components/ProjectModal';

// ── Animation helpers ────────────────────────────────────────────────────────
const FADE_UP = {
  hidden: { opacity: 0, y: 14 },
  show:   { opacity: 1, y: 0,  transition: { type: 'spring', stiffness: 300, damping: 26 } },
};
const STAGGER_GRID = {
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};

export default function ProjectsPage() {
  const qc       = useQueryClient();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['projects'],
    queryFn:  () => projectsApi.list(),
  });

  const createMutation = useMutation({
    mutationFn: ({ name, description }: { name: string; description: string }) =>
      projectsApi.create(name, description || undefined),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });

  const projects = data?.projects ?? [];
  const totalProjects = projects.length;

  return (
    <div className="min-h-screen dark:bg-black bg-zinc-50">
      <Navbar />

      {/* Ambient violet glow behind header area */}
      <div className="pointer-events-none fixed inset-x-0 top-0 h-96 bg-glow-radial dark:opacity-100 opacity-40" />

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-16">

        {/* ── Page header ─────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="flex items-end justify-between mb-10"
        >
          <div>
            <p className="text-xs font-mono dark:text-zinc-600 text-zinc-400 uppercase tracking-widest mb-1">
              Workspace
            </p>
            <h1 className="text-3xl font-bold tracking-tight dark:text-zinc-100 text-zinc-900">
              Projects
            </h1>
          </div>

          <motion.button
            onClick={() => setModalOpen(true)}
            whileTap={{ scale: 0.95, transition: { type: 'spring', stiffness: 600, damping: 35 } }}
            className="
              flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold
              bg-violet-600 hover:bg-violet-500 text-white
              shadow-glow-violet transition-colors duration-200
            "
          >
            <Plus className="w-4 h-4" />
            New Project
          </motion.button>
        </motion.div>

        {/* ── Loading skeleton ─────────────────────────────────────────────── */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-44 rounded-2xl dark:bg-white/[.02] bg-black/[.03] animate-pulse"
                style={{ animationDelay: `${i * 120}ms` }}
              />
            ))}
          </div>
        )}

        {/* ── Error state ───────────────────────────────────────────────────── */}
        {error && (
          <GlassCard className="border-red-500/20 bg-red-500/5">
            <p className="text-sm text-red-400 px-1">
              Failed to load projects. Please refresh.
            </p>
          </GlassCard>
        )}

        {/* ── Empty state ───────────────────────────────────────────────────── */}
        {!isLoading && !error && projects.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-4">
              <Folder className="w-7 h-7 text-violet-400" />
            </div>
            <h3 className="text-base font-semibold dark:text-zinc-300 text-zinc-700 mb-1">No projects yet</h3>
            <p className="text-sm dark:text-zinc-600 text-zinc-500 mb-6">Create your first project to start tracking work.</p>
            <motion.button
              onClick={() => setModalOpen(true)}
              whileTap={{ scale: 0.96 }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-500 text-white shadow-glow-violet transition-colors"
            >
              <Plus className="w-4 h-4" /> New Project
            </motion.button>
          </motion.div>
        )}

        {/* ── Bento grid ───────────────────────────────────────────────────── */}
        {projects.length > 0 && (
          <>
            {/* Summary row — 3 stat bento cells */}
            <motion.div
              variants={STAGGER_GRID}
              initial="hidden"
              animate="show"
              className="grid grid-cols-3 gap-3 mb-4"
            >
              <StatCell
                icon={<BarChart3 className="w-4 h-4 text-violet-400" />}
                label="Projects"
                value={totalProjects}
                color="violet"
              />
              <StatCell
                icon={<Clock className="w-4 h-4 text-amber-400" />}
                label="In Progress"
                value={projects.length}
                color="amber"
                subtitle="last 7 days"
              />
              <StatCell
                icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                label="Active"
                value={projects.length}
                color="emerald"
              />
            </motion.div>

            {/* Project cards */}
            <AnimatePresence>
              <motion.div
                variants={STAGGER_GRID}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                {projects.map((p, i) => (
                  <motion.div key={p.id} variants={FADE_UP} custom={i}>
                    <ProjectCard
                      project={p}
                      onClick={() => navigate(`/projects/${p.id}`)}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          </>
        )}
      </main>

      <ProjectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={async (name, description) => { await createMutation.mutateAsync({ name, description }); }}
      />
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function StatCell({
  icon, label, value, color, subtitle,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: 'violet' | 'amber' | 'emerald';
  subtitle?: string;
}) {
  const bg = { violet: 'bg-violet-500/8', amber: 'bg-amber-500/8', emerald: 'bg-emerald-500/8' }[color];
  const border = { violet: 'border-violet-500/15', amber: 'border-amber-500/15', emerald: 'border-emerald-500/15' }[color];

  return (
    <GlassCard noHover padding="sm" className={`${bg} ${border}`}>
      <div className="flex items-center gap-2 mb-1.5">
        {icon}
        <span className="text-xs dark:text-zinc-500 text-zinc-500 font-mono uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl font-bold dark:text-zinc-100 text-zinc-900">{value}</p>
      {subtitle && <p className="text-[10px] dark:text-zinc-600 text-zinc-400 mt-0.5">{subtitle}</p>}
    </GlassCard>
  );
}

function ProjectCard({ project, onClick }: { project: Project; onClick: () => void }) {
  const date = new Date(project.created_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  return (
    <GlassCard onClick={onClick} padding="none">
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center shrink-0">
            <Folder className="w-4.5 h-4.5 text-violet-400" />
          </div>
          <ChevronRight className="w-4 h-4 dark:text-zinc-700 text-zinc-300 group-hover:text-violet-400 transition-colors mt-1" />
        </div>

        <h3 className="font-semibold dark:text-zinc-100 text-zinc-900 mb-1 leading-snug">
          {project.name}
        </h3>

        {project.description ? (
          <p className="text-xs dark:text-zinc-500 text-zinc-500 line-clamp-2 leading-relaxed mb-3">
            {project.description}
          </p>
        ) : (
          <p className="text-xs dark:text-zinc-700 text-zinc-400 italic mb-3">No description</p>
        )}

        {/* Progress bar placeholder (full width, empty = no tasks loaded here) */}
        <div className="h-[2px] rounded-full dark:bg-white/[.05] bg-black/[.04] mb-3 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-violet-600 to-violet-400 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: '0%' }}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-[10px] font-mono dark:text-zinc-600 text-zinc-400">
            <Circle className="w-2.5 h-2.5 fill-current" />
            {date}
          </span>
        </div>
      </div>
    </GlassCard>
  );
}
