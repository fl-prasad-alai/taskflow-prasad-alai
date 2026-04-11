import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { 
  LayoutGrid, 
  Mail, 
  Lock, 
  ArrowRight, 
  Activity, 
  Cpu, 
  BarChart3,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ApiError } from '../lib/api';
import CinematicBackground from '../components/CinematicBackground';
import ThemeToggle from '../components/ThemeToggle';

// Custom Hook for Mouse Tracking Rim Light Effect
const useMousePosition = () => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    // Only track mouse for "fine" pointers (desktop)
    const canHover = window.matchMedia('(pointer: fine)').matches;
    if (!canHover) return;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  return { mouseX, mouseY };
};

// Premium Spring Config
const SPRING_CONFIG = { stiffness: 80, damping: 20 };

// Slide-Up Reveal Variants
const SLIDE_UP = {
  hidden: { opacity: 0, y: 40 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      type: 'spring', 
      ...SPRING_CONFIG,
      duration: 0.8 
    } 
  }
};

const STAGGER_CONTAINER = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2
    }
  }
};

const FeatureCard = ({ icon: Icon, title, description, badge }: { icon: any, title: string, description: string, badge?: string }) => (
  <motion.div 
    variants={SLIDE_UP}
    className="group relative p-8 rounded-3xl bg-white/40 dark:bg-white/5 border border-black/5 dark:border-white/10 backdrop-blur-3xl overflow-hidden shadow-xl dark:shadow-none"
  >
    <div className="relative z-10">
      <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center mb-6 border border-violet-500/20 group-hover:bg-violet-500/20 transition-colors">
        <Icon className="w-6 h-6 text-violet-600 dark:text-violet-400" />
      </div>
      {badge && (
        <span className="absolute top-8 right-8 text-[10px] font-bold tracking-widest uppercase py-1 px-2 bg-violet-500/10 dark:bg-violet-500/20 text-violet-600 dark:text-violet-300 rounded-full border border-violet-500/20 dark:border-violet-500/30">
          {badge}
        </span>
      )}
      <h3 className="text-xl font-black tracking-tighter text-zinc-900 dark:text-white mb-2 font-heading">{title}</h3>
      <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">{description}</p>
    </div>
    <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
  </motion.div>
);

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  
  const glassRef = useRef<HTMLDivElement>(null);
  const { mouseX, mouseY } = useMousePosition();

  useEffect(() => {
    setIsTouch(!window.matchMedia('(pointer: fine)').matches);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Please enter your credentials');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate('/projects');
    } catch (err) {
      setError(err instanceof ApiError && err.status === 401
        ? 'Invalid email or password'
        : 'System communication error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-black overflow-x-hidden font-sans selection:bg-violet-500/30 transition-colors duration-500">
      <CinematicBackground />

      {/* Theme Toggle Capsule */}
      <div className="fixed top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      <main className="relative z-10 w-full min-h-screen flex flex-col lg:flex-row">
        
        {/* LEFT SECTION: AUTH CORE */}
        <section className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-12 xl:p-24 order-1">
          <motion.div
            variants={STAGGER_CONTAINER}
            initial="hidden"
            animate="show"
            className="w-full max-w-md"
          >
            {/* Logo Section */}
            <motion.div variants={SLIDE_UP} className="flex items-center gap-3 mb-12">
              <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-600/20">
                <LayoutGrid className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-black tracking-tighter text-zinc-900 dark:text-white font-heading">
                VANGUARD <span className="text-violet-500">TASKFLOW</span>
              </h1>
            </motion.div>

            {/* Hyper-Glass Login Container */}
            <motion.div
              ref={glassRef}
              variants={SLIDE_UP}
              className="relative group rounded-[32px] overflow-visible"
            >
              {/* Dynamic Rim Light Border (Disabled on touch) */}
              {!isTouch && (
                <div 
                  className="absolute inset-0 rounded-[32px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-0"
                  style={{
                    background: `radial-gradient(600px circle at var(--x) var(--y), rgba(139, 92, 246, 0.4), transparent 40%)`
                  } as any}
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = `${e.clientX - rect.left}px`;
                    const y = `${e.clientY - rect.top}px`;
                    e.currentTarget.style.setProperty('--x', x);
                    e.currentTarget.style.setProperty('--y', y);
                  }}
                >
                  <div className="absolute inset-0 rounded-[32px] border border-white/20" />
                </div>
              )}

              <div className="relative z-10 backdrop-blur-[80px] bg-white/40 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-[30px] p-8 sm:p-10 overflow-hidden shadow-2xl dark:shadow-none">
                {/* Floating highlight */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-violet-500/10 blur-[60px] rounded-full pointer-events-none" />

                <div className="mb-10 lg:text-left">
                  <h2 className="text-3xl font-black tracking-tighter text-zinc-900 dark:text-white mb-2 font-heading">Welcome Back</h2>
                  <p className="text-zinc-500 dark:text-zinc-400 text-sm">Sign in to access your workspace.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div className="group space-y-2">
                      <label className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase ml-1">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-violet-400 transition-colors" />
                        <input 
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-white/60 dark:bg-black/40 border border-black/5 dark:border-white/5 rounded-2xl py-4 pl-12 pr-4 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/10 transition-all font-medium"
                          placeholder="arjun.mehta@vanguard.co"
                        />
                      </div>
                    </div>

                    <div className="group space-y-2">
                      <label className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase ml-1">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-violet-400 transition-colors" />
                        <input 
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full bg-white/60 dark:bg-black/40 border border-black/5 dark:border-white/5 rounded-2xl py-4 pl-12 pr-4 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/10 transition-all font-medium"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  </div>

                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold flex items-center gap-2"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      {error}
                    </motion.div>
                  )}

                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="group relative w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-violet-600/20 flex items-center justify-center gap-2 overflow-hidden"
                  >
                    {loading ? (
                      <Activity className="w-5 h-5 animate-pulse" />
                    ) : (
                      <>
                        <span className="relative z-10 uppercase tracking-widest text-xs">Sign In to Workspace</span>
                        <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
                      </>
                    )}
                  </motion.button>
                </form>

                <div className="mt-8 text-center pt-8 border-t border-white/5">
                  <p className="text-zinc-500 text-xs">
                    New here? <Link to="/register" className="text-violet-400 hover:text-violet-300 font-bold ml-1 transition-colors">Create an account</Link>
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* RIGHT SECTION: PRODUCT STORY */}
        <section className="flex-1 relative order-2 bg-gradient-to-br from-violet-500/10 dark:from-violet-500/5 to-transparent border-t lg:border-t-0 lg:border-l border-black/5 dark:border-white/5 h-full max-h-screen overflow-y-auto custom-scrollbar">
          <div className="p-12 sm:p-16 lg:p-12 xl:p-24 pb-24">
            <motion.div
              variants={STAGGER_CONTAINER}
              initial="hidden"
              animate="show"
              className="max-w-xl mx-auto space-y-12"
            >
              <div className="space-y-4">
                <motion.span 
                  variants={SLIDE_UP}
                  className="inline-block py-1 px-3 rounded-full bg-violet-500/20 text-violet-400 text-[10px] font-bold tracking-widest uppercase border border-violet-500/30"
                >
                  Universal Performance
                </motion.span>
                <motion.h2 variants={SLIDE_UP} className="text-5xl xl:text-7xl font-black tracking-tighter text-zinc-900 dark:text-white leading-tight font-heading">
                  The Vanguard <br />
                  Standard.
                </motion.h2>
                <motion.p variants={SLIDE_UP} className="text-zinc-500 dark:text-zinc-400 text-lg leading-relaxed max-w-md">
                  Experience the pinnacle of workflow orchestration. Built for elite cross-platform performance.
                </motion.p>
              </div>

              <div className="grid gap-6">
                <FeatureCard 
                  icon={BarChart3}
                  title="Predictive Intelligence"
                  description="Proprietary heuristics that predict bottlenecks before they manifest in your sprint cycle."
                />
                <FeatureCard 
                  icon={Activity}
                  title="Vitality Core"
                  description="Real-time health monitoring of your project's architectural integrity."
                />
                <FeatureCard 
                  icon={Cpu}
                  title="High-Performance Engine"
                  description="Optimized for silky smooth interactions and lightning-fast responsiveness across devices."
                  badge="Next-Gen"
                />
              </div>

              <motion.div variants={SLIDE_UP} className="pt-12 text-zinc-500 text-[10px] font-bold tracking-[0.3em] uppercase opacity-40">
                Authorized Personnel Only | Project Obsidian v1.22
              </motion.div>
            </motion.div>
          </div>
        </section>

      </main>

      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.4);
        }
      `}</style>
    </div>
  );
}
