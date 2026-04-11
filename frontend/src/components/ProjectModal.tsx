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
  focus:outline-none focus:ring-2 focus:ring-[#e11d48]/50
  transition-colors
`;

const LABEL = 'block text-xs font-bold dark:text-zinc-500 text-zinc-500 mb-1.5 uppercase tracking-widest';

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
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
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
              relative w-full max-w-md rounded-3xl overflow-hidden
              dark:bg-zinc-900/95 bg-white
              dark:border dark:border-white/[.08] border border-black/[.08]
              shadow-2xl
            "
          >
            {/* Top-edge highlight */}
            <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            {/* Header */}
            <div className="flex items-center justify-between px-8 pt-6 pb-4 border-b dark:border-white/[.06] border-black/[.06]">
              <h2 className="text-xl font-black tracking-tighter dark:text-zinc-100 text-zinc-900 font-heading">
                {project ? 'EDIT PROJECT' : 'NEW PROJECT'}
              </h2>
              <motion.button
                onClick={onClose}
                whileTap={{ scale: 0.88 }}
                className="p-1.5 rounded-lg dark:text-zinc-600 dark:hover:text-zinc-300 dark:hover:bg-white/8 text-zinc-400 hover:text-zinc-700 hover:bg-black/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Body */}
            <form id="project-form" onSubmit={handleSubmit} className="px-8 py-6 space-y-6">
              <div className="space-y-2">
                <label className={LABEL}>
                  Project Identity <span className="text-[#e11d48] normal-case tracking-normal">*</span>
                </label>
                <input
                  ref={nameRef}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className={`${FIELD_INPUT} ${error ? 'border-red-500/50 focus:ring-red-500/40' : ''}`}
                  placeholder="e.g. Project Obsidian"
                />
              </div>

              <div className="space-y-2">
                <label className={LABEL}>Mission Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={4}
                  className={`${FIELD_INPUT} resize-none`}
                  placeholder="Define the scope and strategic value..."
                />
              </div>

              {error && (
                <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 font-semibold">
                  {error}
                </p>
              )}
            </form>

            {/* Footer */}
            <div className="flex justify-end items-center gap-4 px-8 py-6 border-t dark:border-white/[.06] border-black/[.06]">
              <button
                type="button"
                onClick={onClose}
                className="text-sm font-bold dark:text-zinc-500 dark:hover:text-zinc-300 text-zinc-400 hover:text-zinc-600 transition-colors uppercase tracking-widest"
              >
                Cancel
              </button>
              <motion.button
                type="submit"
                form="project-form"
                disabled={saving}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="
                  flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest
                  bg-[#e11d48] text-white
                  disabled:opacity-50 disabled:cursor-not-allowed
                  shadow-xl shadow-[#e11d48]/20 transition-all duration-300
                "
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                      className="block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full"
                    />
                    STAGING…
                  </span>
                ) : (
                  project ? 'Save Identity' : 'Initiate Mission'
                )}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
