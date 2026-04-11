import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '../lib/api';
import type { Project } from '../types';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import ProjectModal from '../components/ProjectModal';

export default function ProjectsPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.list(),
  });

  const createMutation = useMutation({
    mutationFn: ({ name, description }: { name: string; description: string }) =>
      projectsApi.create(name, description || undefined),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });

  const handleCreate = async (name: string, description: string) => {
    await createMutation.mutateAsync({ name, description });
  };

  const projects = data?.projects ?? [];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Projects</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Projects you own or have tasks in
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Project
          </button>
        </div>

        {/* States */}
        {isLoading && <LoadingSpinner />}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
            Failed to load projects. Please refresh.
          </div>
        )}

        {!isLoading && !error && projects.length === 0 && (
          <EmptyState
            title="No projects yet"
            description="Create your first project to start tracking tasks."
            action={
              <button
                onClick={() => setModalOpen(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Create Project
              </button>
            }
          />
        )}

        {/* Grid */}
        {projects.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map(p => (
              <ProjectCard
                key={p.id}
                project={p}
                onClick={() => navigate(`/projects/${p.id}`)}
              />
            ))}
          </div>
        )}
      </main>

      <ProjectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleCreate}
      />
    </div>
  );
}

function ProjectCard({ project, onClick }: { project: Project; onClick: () => void }) {
  const date = new Date(project.created_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  return (
    <button
      onClick={onClick}
      className="text-left bg-white border border-slate-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-sm transition-all group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
          </svg>
        </div>
        <svg className="w-4 h-4 text-slate-300 group-hover:text-slate-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
      <h3 className="font-semibold text-slate-800 group-hover:text-blue-700 transition-colors">
        {project.name}
      </h3>
      {project.description && (
        <p className="text-sm text-slate-500 mt-1 line-clamp-2">{project.description}</p>
      )}
      <p className="text-xs text-slate-400 mt-3">{date}</p>
    </button>
  );
}
