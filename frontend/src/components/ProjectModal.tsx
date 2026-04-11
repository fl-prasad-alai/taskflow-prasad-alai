import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import type { Project } from '../types';

interface Props {
  open: boolean;
  project?: Project;
  onClose: () => void;
  onSave: (name: string, description: string) => Promise<void>;
}

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

export default function ProjectModal({ open, project, onClose, onSave }: Props) {
  const [name,        setName]        = useState('');
  const [description, setDescription] = useState('');
  const [error,       setError]       = useState('');
  const [saving,      setSaving]      = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName(project?.name        ?? '');
      setDescription(project?.description ?? '');
      setError('');
      setTimeout(() => nameRef.current?.focus(), 60);
    }
  }, [open, project]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required'); return; }
    setSaving(true);
    try {
      await onSave(name.trim(), description.trim());
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
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
              relative w-full max-w-md rounded-2xl overflow-hidden
              dark:bg-zinc-900/95 bg-white
              dark:border dark:border-white/[.08] border border-black/[.08]
              dark:shadow-glass shadow-card-light
            "
          >
            {/* Top-edge highlight */}
            <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b dark:border-white/[.06] border-black/[.06]">
              <h2 className="text-base font-semibold dark:text-zinc-100 text-zinc-900">
                {project ? 'Edit Project' : 'New Project'}
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
            <form id="project-form" onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label className={LABEL}>
                  Name <span className="text-red-400 normal-case tracking-normal">*</span>
                </label>
                <input
                  ref={nameRef}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className={`${FIELD_INPUT} ${error ? 'border-red-500/50 focus:ring-red-500/40' : ''}`}
                  placeholder="e.g. Website Redesign"
                />
              </div>

              <div>
                <label className={LABEL}>Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={3}
                  className={`${FIELD_INPUT} resize-none`}
                  placeholder="Optional description"
                />
              </div>

              {error && (
                <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                  {error}
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
                form="project-form"
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
                  project ? 'Save Changes' : 'Create Project'
                )}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
