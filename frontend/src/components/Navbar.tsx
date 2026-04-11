import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useMotionValueEvent, useScroll } from 'framer-motion';
import { LogOut, LayoutGrid, Leaf } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);

  const isGreen = theme === 'green';
  const isLight = theme === 'light';

  // Switch to "scrolled" state after 20 px to add blur + border
  useMotionValueEvent(scrollY, 'change', (y) => {
    setScrolled(y > 20);
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <motion.header
      animate={{
        // When scrolled: stronger backdrop, tighter border, slight shadow
        backdropFilter: scrolled ? 'blur(24px) saturate(180%)' : 'blur(0px)',
        WebkitBackdropFilter: scrolled ? 'blur(24px) saturate(180%)' : 'blur(0px)',
        backgroundColor: scrolled 
          ? (isGreen ? 'rgba(2, 44, 34, 0.85)' : isLight ? 'rgba(255, 255, 255, 0.85)' : 'rgba(10, 10, 12, 0.85)')
          : 'rgba(0,0,0,0)',
        borderBottomColor: scrolled 
          ? (isGreen ? 'rgba(16, 185, 129, 0.1)' : isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.07)')
          : 'rgba(255,255,255,0)',
        boxShadow: scrolled ? '0 1px 40px rgba(0,0,0,0.4)' : 'none',
      }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="
        fixed top-0 inset-x-0 z-50
        border-b
        dark:text-zinc-100 text-zinc-900
        "
      style={{
        // Light-mode variant handled via className only — keep minimal inline
        backgroundColor: undefined,
      }}
    >
      {/* Light-mode overlay (class-based, separate from motion animation) */}
      <div
        className={`
          absolute inset-0 transition-colors duration-300 pointer-events-none
          ${scrolled
            ? 'bg-white/80 dark:bg-transparent'
            : 'bg-transparent'}
        `}
        style={{ backdropFilter: 'inherit', WebkitBackdropFilter: 'inherit' }}
      />

      <nav className="relative max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* ── Logo ─────────────────────────────────────────────────────────── */}
        <Link
          to="/projects"
          className="flex items-center gap-2 group"
        >
          <motion.div
            whileHover={{ rotate: 8, scale: 1.1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-lg transition-colors ${
              isGreen ? 'bg-emerald-600 shadow-emerald-500/20' : 'bg-[#e11d48] shadow-[#e11d48]/20'
            }`}
          >
            {isGreen ? <Leaf className="w-5 h-5 text-white" /> : <LayoutGrid className="w-5 h-5 text-white" />}
          </motion.div>
          <span className="text-base font-black tracking-tighter sm:block">
            VANGUARD <span className={isGreen ? 'text-emerald-500' : 'text-[#e11d48]'}>TASKFLOW</span>
          </span>
        </Link>

        {/* ── Right controls ────────────────────────────────────────────────── */}
        {user && (
          <div className="flex items-center gap-3">
            {/* User name — hidden on mobile */}
            <span className="hidden sm:block text-xs font-mono dark:text-zinc-500 text-zinc-500 tracking-wider uppercase">
              {user.name}
            </span>

            <span className="hidden sm:block w-px h-4 dark:bg-white/10 bg-black/10" />

            <div className="hidden sm:block">
              <ThemeToggle />
            </div>

            <motion.button
              onClick={handleLogout}
              whileTap={{ scale: 0.9, transition: { type: 'spring', stiffness: 600, damping: 35 } }}
              className="
                flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
                dark:text-zinc-500 dark:hover:text-zinc-200 dark:hover:bg-white/5
                text-zinc-500 hover:text-zinc-900 hover:bg-black/5
                transition-colors
              "
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </motion.button>
          </div>
        )}

        {/* Unauthenticated: desktop toggle */}
        {!user && (
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
        )}
      </nav>
    </motion.header>

      {/* Floating Toggle for Mobile ONLY (Authenticated & Unauthenticated) */}
      <div className="sm:hidden fixed bottom-8 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 scale-[0.85]">
        <ThemeToggle />
      </div>
    </>
  );
}
