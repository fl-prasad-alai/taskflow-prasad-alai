import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Lock, ArrowRight, LayoutGrid, Leaf } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { ApiError } from '../lib/api';
import ThemeToggle from '../components/ThemeToggle';

const FADE_UP = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0,  transition: { type: 'spring', stiffness: 300, damping: 28 } },
};
const STAGGER = { show: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } } };

function Field({
  label, icon: Icon, type, value, onChange, autoComplete, placeholder, error, isGreen,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  type: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  placeholder: string;
  error?: string;
  isGreen: boolean;
}) {
  return (
    <motion.div variants={FADE_UP}>
      <label className="block text-xs font-medium dark:text-zinc-400 text-zinc-600 mb-1.5 uppercase tracking-wider">
        {label}
      </label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-zinc-600 text-zinc-400 pointer-events-none" />
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          autoComplete={autoComplete}
          className={`
            w-full pl-9 pr-4 py-2.5 rounded-xl text-sm
            dark:bg-white/[.04] bg-zinc-50
            dark:text-zinc-100 text-zinc-900
            dark:placeholder-zinc-600 placeholder-zinc-400
            focus:outline-none focus:ring-2 transition-colors
            ${error
              ? 'border border-red-500/50 focus:ring-red-500/40'
              : `dark:border dark:border-white/[.08] border border-black/[.08] ${isGreen ? 'focus:ring-emerald-500/50' : 'focus:ring-red-500/50'}`}
          `}
          placeholder={placeholder}
        />
      </div>
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </motion.div>
  );
}

export default function RegisterPage() {
  const { register } = useAuth();
  const { theme }    = useTheme();
  const navigate     = useNavigate();
  const isGreen      = theme === 'green';

  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError]     = useState('');
  const [loading, setLoading]         = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setFormError('');

    const errs: Record<string, string> = {};
    if (!name.trim())          errs.name     = 'Name is required';
    if (!email.trim())         errs.email    = 'Email is required';
    else if (!email.includes('@')) errs.email = 'Enter a valid email';
    if (password.length < 8)  errs.password = 'Minimum 8 characters';

    if (Object.keys(errs).length) { setFieldErrors(errs); return; }

    setLoading(true);
    try {
      await register(name.trim(), email.trim(), password);
      navigate('/projects');
    } catch (err) {
      if (err instanceof ApiError && err.fields) {
        setFieldErrors(err.fields);
      } else {
        setFormError('Something went wrong. Please try again.');
      }
    } finally { setLoading(false); }
  };

  return (
    <div className={`relative min-h-screen flex flex-col transition-colors duration-500 ${isGreen ? 'bg-[#022c22] text-[#ecfdf5]' : 'dark:bg-black bg-zinc-50'}`}>
      <div className={`pointer-events-none absolute inset-x-0 top-0 h-[480px] ${isGreen ? 'bg-glow-radial opacity-60' : 'bg-glow-radial dark:bg-glow-radial bg-glow-radial-light'}`} />

      {/* Theme Toggle Capsule - Responsive Positioning */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 sm:top-8 sm:right-8 sm:bottom-auto sm:left-auto sm:translate-x-0 z-50 transition-all duration-500 scale-[0.85] sm:scale-100">
        <ThemeToggle />
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <motion.div
          variants={STAGGER}
          initial="hidden"
          animate="show"
          className="w-full max-w-sm"
        >
          {/* Logo */}
          <motion.div variants={FADE_UP} className="flex items-center gap-2 justify-center mb-8">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-lg ${isGreen ? 'bg-emerald-600 shadow-emerald-600/20' : 'bg-[#e11d48] shadow-[#e11d48]/20'}`}>
              {isGreen ? <Leaf className="w-5 h-5 text-white" /> : <LayoutGrid className="w-5 h-5 text-white" />}
            </div>
            <h1 className="text-xl font-black tracking-tighter dark:text-zinc-100 text-zinc-900 font-heading">
              VANGUARD <span className={isGreen ? 'text-emerald-500' : 'text-[#e11d48]'}>TASKFLOW</span>
            </h1>
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
            <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            <motion.h1 variants={FADE_UP} className="text-lg font-semibold dark:text-zinc-100 text-zinc-900 mb-1">
              Create account
            </motion.h1>
            <motion.p variants={FADE_UP} className="text-sm dark:text-zinc-500 text-zinc-500 mb-6">
              Start managing your projects
            </motion.p>

            <form onSubmit={handleSubmit} noValidate className="space-y-3">
              <Field label="Name"     icon={User} type="text"     value={name}     onChange={setName}     autoComplete="name"         placeholder="Jane Doe"         error={fieldErrors.name}     isGreen={isGreen} />
              <Field label="Email"    icon={Mail} type="email"    value={email}    onChange={setEmail}    autoComplete="email"        placeholder="you@example.com"  error={fieldErrors.email}    isGreen={isGreen} />
              <Field label="Password" icon={Lock} type="password" value={password} onChange={setPassword} autoComplete="new-password" placeholder="8+ characters"    error={fieldErrors.password} isGreen={isGreen} />

              {formError && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2"
                >
                  {formError}
                </motion.div>
              )}

              <motion.div variants={FADE_UP} className="pt-1">
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileTap={{ scale: 0.97, transition: { type: 'spring', stiffness: 600, damping: 35 } }}
                  className={`
                    w-full flex items-center justify-center gap-2
                    py-2.5 rounded-xl text-sm font-semibold text-white
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-all shadow-xl font-bold uppercase tracking-widest text-xs
                    ${isGreen ? 'bg-emerald-600 shadow-emerald-600/20' : 'bg-[#e11d48] shadow-[#e11d48]/20'}
                  `}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                        className="block w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                      />
                      Creating…
                    </span>
                  ) : (
                    <>Create Account <ArrowRight className="w-4 h-4" /></>
                  )}
                </motion.button>
              </motion.div>
            </form>
          </motion.div>

          <motion.p variants={FADE_UP} className="text-center text-sm dark:text-zinc-600 text-zinc-500 mt-5">
            Already have an account?{' '}
            <Link to="/login" className={`font-bold hover:underline transition-colors ${isGreen ? 'text-emerald-500' : 'text-[#e11d48]'}`}>
              Sign in
            </Link>
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
