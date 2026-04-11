import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useMotionValueEvent, useScroll } from 'framer-motion';
import { LogOut, LayoutGrid } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);

  // Switch to "scrolled" state after 20 px to add blur + border
  useMotionValueEvent(scrollY, 'change', (y) => {
    setScrolled(y > 20);
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <motion.header
      animate={{
        // When scrolled: stronger backdrop, tighter border, slight shadow
        backdropFilter: scrolled ? 'blur(24px) saturate(180%)' : 'blur(0px)',
        WebkitBackdropFilter: scrolled ? 'blur(24px) saturate(180%)' : 'blur(0px)',
        backgroundColor: scrolled ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0)',
        borderBottomColor: scrolled ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0)',
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
          <motion.span
            whileHover={{ rotate: 8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="flex items-center justify-center w-7 h-7 rounded-lg bg-violet-500/20 border border-violet-500/30 group-hover:bg-violet-500/30 transition-colors"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-violet-400" />
          </motion.span>
          <span className="text-sm font-semibold tracking-tight dark:text-zinc-100 text-zinc-900">
            Task<span className="text-violet-400">Flow</span>
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

            <ThemeToggle />

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

        {/* Unauthenticated: only show theme toggle */}
        {!user && (
          <ThemeToggle />
        )}
      </nav>
    </motion.header>
  );
}
