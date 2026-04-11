import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

// Spring config tuned for 120Hz ProMotion — high stiffness, well-damped
const SPRING = { type: 'spring', stiffness: 420, damping: 32, mass: 0.75 } as const;

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <motion.button
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      // Tactile press
      whileTap={{ scale: 0.92, transition: { type: 'spring', stiffness: 600, damping: 35 } }}
      className={`
        relative flex items-center w-[56px] h-[30px] rounded-full p-[3px]
        focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2
        focus-visible:ring-offset-black
        transition-colors duration-300
        ${isDark
          ? 'bg-white/10 border border-white/20'
          : 'bg-black/8 border border-black/12'}
      `}
    >
      {/* Track background glow when dark */}
      {isDark && (
        <span className="absolute inset-0 rounded-full bg-violet-500/10 pointer-events-none" />
      )}

      {/* Sliding knob */}
      <motion.span
        animate={{ x: isDark ? 26 : 0 }}
        transition={SPRING}
        className={`
          relative z-10 flex items-center justify-center
          w-6 h-6 rounded-full shadow-md
          ${isDark
            ? 'bg-obsidian-300 shadow-black/60'
            : 'bg-white shadow-black/15'}
        `}
      >
        <motion.span
          key={isDark ? 'moon' : 'sun'}
          initial={{ opacity: 0, rotate: -30, scale: 0.6 }}
          animate={{ opacity: 1, rotate: 0,   scale: 1 }}
          exit={   { opacity: 0, rotate:  30, scale: 0.6 }}
          transition={{ duration: 0.18 }}
        >
          {isDark
            ? <Moon  className="w-3 h-3 text-violet-400" strokeWidth={2.5} />
            : <Sun   className="w-3 h-3 text-amber-500"  strokeWidth={2.5} />
          }
        </motion.span>
      </motion.span>
    </motion.button>
  );
}
