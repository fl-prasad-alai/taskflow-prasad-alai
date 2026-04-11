import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutGrid, 
  Mail, 
  Lock, 
  ArrowRight, 
  Activity, 
  BarChart3,
  ShieldCheck,
  Leaf
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { ApiError } from '../lib/api';
import CinematicBackground from '../components/CinematicBackground';
import ThemeToggle from '../components/ThemeToggle';

// Custom Hook for Mouse Tracking Rim Light Effect
const useMousePosition = () => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
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

const FeatureCard = ({ icon: Icon, title, description, badge }: { icon: any, title: string, description: string, badge?: string }) => {
  const { theme } = useTheme();
  const isGreen = theme === 'green';
  
  return (
    <motion.div 
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
      }}
      className={`
        group relative p-8 rounded-3xl overflow-hidden shadow-xl transition-all duration-500
        ${isGreen 
          ? 'bg-emerald-950/20 backdrop-blur-[100px] border border-emerald-500/15' 
          : 'bg-white/40 dark:bg-white/5 border border-black/5 dark:border-white/10 backdrop-blur-3xl'}
      `}
    >
      <div className="relative z-10">
        <div className={`
          w-12 h-12 rounded-2xl flex items-center justify-center mb-6 border transition-colors
          ${isGreen 
            ? 'bg-emerald-500/10 border-emerald-500/20 group-hover:bg-emerald-500/20' 
            : 'bg-violet-500/10 border-violet-500/20 group-hover:bg-violet-500/20'}
        `}>
          <Icon className={`w-6 h-6 ${isGreen ? 'text-emerald-400' : 'text-violet-600 dark:text-violet-400'}`} />
        </div>
        {badge && (
          <span className={`
            absolute top-8 right-8 text-[10px] font-bold tracking-widest uppercase py-1 px-2 rounded-full border
            ${isGreen 
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
              : 'bg-violet-500/10 dark:bg-violet-500/20 text-violet-600 dark:text-violet-300 border-violet-500/20 dark:border-violet-500/30'}
          `}>
            {badge}
          </span>
        )}
        <h3 className="text-xl font-black tracking-tighter text-zinc-900 dark:text-white mb-2 font-heading">{title}</h3>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">{description}</p>
      </div>
      <div className={`
        absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity
        ${isGreen ? 'from-emerald-500/5' : 'from-violet-500/5'} to-transparent
      `} />
    </motion.div>
  );
};

export default function LoginPage() {
  const { login } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  
  const isGreen = theme === 'green';
  const isLight = theme === 'light';
  
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
    <div className={`relative min-h-screen overflow-x-hidden font-sans transition-colors duration-500 ${isGreen ? 'bg-[#022c22] text-[#ecfdf5]' : 'bg-slate-50 dark:bg-black text-zinc-900 dark:text-zinc-100'}`}>
      <CinematicBackground />

      {/* Theme Toggle Capsule - Responsive Positioning */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 sm:top-8 sm:right-8 sm:bottom-auto sm:left-auto sm:translate-x-0 z-50 transition-all duration-500 scale-[0.85] sm:scale-100">
        <ThemeToggle />
      </div>

      <main className="relative z-10 w-full min-h-screen flex flex-col lg:flex-row">
        
        {/* LEFT SECTION: AUTH CORE */}
        <section className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-12 xl:p-24 order-1">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md"
          >
            {/* Logo Section */}
            <div className="flex items-center gap-3 mb-12">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${isGreen ? 'bg-emerald-600 shadow-emerald-600/20' : 'bg-[#e11d48] shadow-[#e11d48]/20'}`}>
                {isGreen ? <Leaf className="w-6 h-6 text-white" /> : <LayoutGrid className="w-6 h-6 text-white" />}
              </div>
              <h1 className="text-2xl font-black tracking-tighter font-heading">
                VANGUARD <span className={isGreen ? 'text-emerald-500' : 'text-[#e11d48]'}>TASKFLOW</span>
              </h1>
            </div>

            {/* Hyper-Glass Login Container */}
            <div className="relative group rounded-[32px] overflow-visible">
              {/* Botanical/Violet Glow (Disabled on touch) */}
              {!isTouch && (
                <div 
                  className="absolute inset-0 rounded-[32px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-0"
                  style={{
                    background: `radial-gradient(600px circle at var(--x) var(--y), ${isGreen ? 'rgba(16, 185, 129, 0.4)' : 'rgba(225, 29, 72, 0.2)'}, transparent 40%)`
                  } as any}
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = `${e.clientX - rect.left}px`;
                    const y = `${e.clientY - rect.top}px`;
                    e.currentTarget.style.setProperty('--x', x);
                    e.currentTarget.style.setProperty('--y', y);
                  }}
                >
                  <div className={`absolute inset-0 rounded-[32px] border ${isGreen ? 'border-emerald-500/20' : 'border-white/20'}`} />
                </div>
              )}

              <div className={`
                relative z-10 p-8 sm:p-10 rounded-[30px] overflow-hidden shadow-2xl transition-all duration-500
                ${isGreen 
                  ? 'bg-emerald-950/20 backdrop-blur-[100px] border border-emerald-500/15' 
                  : 'bg-white/40 dark:bg-white/5 border border-black/5 dark:border-white/10 backdrop-blur-[80px]'}
              `}>
                {/* Floating highlight */}
                <div className={`absolute -top-24 -right-24 w-48 h-48 blur-[60px] rounded-full pointer-events-none ${isGreen ? 'bg-emerald-500/10' : 'bg-[#e11d48]/5'}`} />

                <div className="mb-10">
                  <h2 className="text-3xl font-black tracking-tighter mb-2 font-heading">Welcome Back</h2>
                  <p className="text-zinc-500 dark:text-zinc-400 text-sm italic">Sign in to access your workspace.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div className="group space-y-2 text-left">
                      <label className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase ml-1">Email Address</label>
                      <div className="relative">
                        <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${isGreen ? 'group-focus-within:text-emerald-400' : 'group-focus-within:text-[#e11d48]'}`} />
                        <input 
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className={`w-full bg-white/60 dark:bg-black/40 border rounded-2xl py-4 pl-12 pr-4 transition-all font-medium ${isGreen ? 'border-emerald-500/10 focus:border-emerald-500/50' : 'border-black/5 focus:border-[#e11d48]/50'}`}
                          placeholder="arjun.mehta@example.com"
                        />
                      </div>
                    </div>

                    <div className="group space-y-2 text-left">
                      <label className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase ml-1">Password</label>
                      <div className="relative">
                        <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${isGreen ? 'group-focus-within:text-emerald-400' : 'group-focus-within:text-[#e11d48]'}`} />
                        <input 
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className={`w-full bg-white/60 dark:bg-black/40 border rounded-2xl py-4 pl-12 pr-4 transition-all font-medium ${isGreen ? 'border-emerald-500/10 focus:border-emerald-500/50' : 'border-black/5 focus:border-[#e11d48]/50'}`}
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold flex items-center gap-2"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`group relative w-full text-white font-bold py-4 rounded-2xl transition-all shadow-xl flex items-center justify-center gap-2 overflow-hidden bg-[#e11d48] shadow-[#e11d48]/20`}
                  >
                    {loading ? (
                      <Activity className="w-5 h-5 animate-pulse" />
                    ) : (
                      <>
                        <span className="relative z-10 uppercase tracking-widest text-xs">Sign In to Dashboard</span>
                        <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
                      </>
                    )}
                  </motion.button>
                </form>

                <div className="mt-8 text-center pt-8 border-t border-white/5">
                  <p className="text-zinc-500 text-xs">
                    Vanguard System Access <span className="mx-2 opacity-30">|</span> 128-bit Encryption
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </section>
        
        {/* RIGHT SECTION: PRODUCTS STORY */}
        <section className={`flex-1 relative order-2 border-t lg:border-t-0 lg:border-l border-black/5 dark:border-white/5 h-full max-h-screen overflow-y-auto ${isGreen ? 'bg-emerald-950/10' : 'bg-gradient-to-br from-violet-500/10 dark:from-violet-500/5 to-transparent'}`}>
          <div className="p-12 sm:p-16 lg:p-12 xl:p-24 pb-24">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="max-w-xl mx-auto space-y-12"
            >
              <div className="space-y-4">
                <span className={`inline-block py-1 px-3 rounded-full text-[10px] font-bold tracking-widest uppercase border ${isGreen ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-violet-500/20 text-violet-400 border-violet-500/30'}`}>
                  {isGreen ? 'Greening India Mode' : 'Universal Vanguard'}
                </span>
                <h2 className="text-5xl xl:text-7xl font-black tracking-tighter leading-tight font-heading">
                  The New <br />
                  Standard.
                </h2>
                <p className="text-zinc-500 dark:text-zinc-400 text-lg leading-relaxed max-w-md">
                  Experience the intersection of high-performance logic and biophilic design.
                </p>
              </div>

              <div className="grid gap-6">
                <FeatureCard 
                  icon={Leaf}
                  title="Biophilic Growth"
                  description="A workspace that breathes. Interface components that mirror the fluidity of nature."
                />
                <FeatureCard 
                  icon={Activity}
                  title="Vitality Core"
                  description="Adaptive project health visualization that evolves with your team's velocity."
                />
                <FeatureCard 
                  icon={BarChart3}
                  title="Eco-Data Engine"
                  description="Sustainable performance metrics designed for low-impact, high-yield efficiency."
                  badge="Genius"
                />
              </div>

              <div className="pt-12 text-zinc-500 text-[10px] font-bold tracking-[0.3em] uppercase opacity-40">
                Authorized Personnel Only | Project Obsidian v1.22
              </div>
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
      `}</style>
    </div>
  );
}
