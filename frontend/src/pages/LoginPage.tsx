import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, LayoutGrid } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ApiError } from '../lib/api';
import ThemeToggle from '../components/ThemeToggle';

const FADE_UP = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0,  transition: { type: 'spring', stiffness: 300, damping: 28 } },
};
const STAGGER = { show: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } } };

export default function LoginPage() {
  const { login }   = useAuth();
  const navigate    = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) { setError('Email and password are required'); return; }
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate('/projects');
    } catch (err) {
      setError(err instanceof ApiError && err.status === 401
        ? 'Invalid email or password'
        : 'Something went wrong. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="
      relative min-h-screen flex flex-col
      dark:bg-black bg-zinc-50
      overflow-hidden
    ">
      {/* Violet ambient glow behind the card */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[480px] bg-glow-radial dark:bg-glow-radial bg-glow-radial-light" />

      {/* Top-right theme toggle */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      {/* Centered card */}
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <motion.div
          variants={STAGGER}
          initial="hidden"
          animate="show"
          className="w-full max-w-sm"
        >
          {/* Logo */}
          <motion.div variants={FADE_UP} className="flex items-center gap-2 justify-center mb-8">
            <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-violet-500/20 border border-violet-500/30">
              <LayoutGrid className="w-4.5 h-4.5 text-violet-400" />
            </span>
            <span className="text-xl font-bold dark:text-zinc-100 text-zinc-900">
              Task<span className="text-violet-400">Flow</span>
            </span>
          </motion.div>

          {/* Card */}
          <motion.div
            variants={FADE_UP}
            className="
              relative overflow-hidden rounded-2xl
              dark:bg-white/[.03] bg-white
              dark:border dark:border-white/[.08] border border-black/[.06]
              dark:shadow-glass shadow-card-light
              p-8
            "
          >
            {/* Inner top-edge highlight */}
            <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            <motion.h1
              variants={FADE_UP}
              className="text-lg font-semibold dark:text-zinc-100 text-zinc-900 mb-1"
            >
              Welcome back
            </motion.h1>
            <motion.p variants={FADE_UP} className="text-sm dark:text-zinc-500 text-zinc-500 mb-6">
              Sign in to your workspace
            </motion.p>

            <form onSubmit={handleSubmit} noValidate className="space-y-3">
              {/* Email */}
              <motion.div variants={FADE_UP}>
                <label className="block text-xs font-medium dark:text-zinc-400 text-zinc-600 mb-1.5 uppercase tracking-wider">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-zinc-600 text-zinc-400 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoComplete="email"
                    className="
                      w-full pl-9 pr-4 py-2.5 rounded-xl text-sm
                      dark:bg-white/[.04] bg-zinc-50
                      dark:border dark:border-white/[.08] border border-black/[.08]
                      dark:text-zinc-100 text-zinc-900
                      dark:placeholder-zinc-600 placeholder-zinc-400
                      focus:outline-none focus:ring-2 focus:ring-violet-500/50
                      transition-colors
                    "
                    placeholder="you@example.com"
                  />
                </div>
              </motion.div>

              {/* Password */}
              <motion.div variants={FADE_UP}>
                <label className="block text-xs font-medium dark:text-zinc-400 text-zinc-600 mb-1.5 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-zinc-600 text-zinc-400 pointer-events-none" />
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="
                      w-full pl-9 pr-4 py-2.5 rounded-xl text-sm
                      dark:bg-white/[.04] bg-zinc-50
                      dark:border dark:border-white/[.08] border border-black/[.08]
                      dark:text-zinc-100 text-zinc-900
                      dark:placeholder-zinc-600 placeholder-zinc-400
                      focus:outline-none focus:ring-2 focus:ring-violet-500/50
                      transition-colors
                    "
                    placeholder="••••••••"
                  />
                </div>
              </motion.div>

              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2"
                >
                  {error}
                </motion.div>
              )}

              {/* CTA */}
              <motion.div variants={FADE_UP} className="pt-1">
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileTap={{ scale: 0.97, transition: { type: 'spring', stiffness: 600, damping: 35 } }}
                  className="
                    w-full flex items-center justify-center gap-2
                    py-2.5 rounded-xl text-sm font-semibold
                    bg-violet-600 hover:bg-violet-500 text-white
                    disabled:opacity-50 disabled:cursor-not-allowed
                    shadow-glow-violet transition-colors duration-200
                  "
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                        className="block w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                      />
                      Signing in…
                    </span>
                  ) : (
                    <>Sign In <ArrowRight className="w-4 h-4" /></>
                  )}
                </motion.button>
              </motion.div>
            </form>
          </motion.div>

          {/* Footer link */}
          <motion.p variants={FADE_UP} className="text-center text-sm dark:text-zinc-600 text-zinc-500 mt-5">
            No account?{' '}
            <Link to="/register" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
              Create one
            </Link>
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
