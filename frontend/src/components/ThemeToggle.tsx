import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const SPRING = { type: 'spring', stiffness: 500, damping: 30, mass: 1 } as const;

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <motion.button
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="
        relative flex items-center w-[64px] h-[34px] rounded-full p-[4px]
        backdrop-blur-xl bg-white/40 dark:bg-white/5 border border-black/5 dark:border-white/10
        focus:outline-none focus:ring-2 focus:ring-violet-500/50
        transition-all shadow-lg dark:shadow-xl shadow-black/5 dark:shadow-black/20
      "
    >
      <motion.div
        animate={{ x: isDark ? 30 : 0 }}
        transition={SPRING}
        className="
          flex items-center justify-center
          w-6 h-6 rounded-full
          bg-white shadow-[0_0_15px_rgba(255,255,255,0.2)]
          dark:bg-violet-600 dark:shadow-[0_0_15px_rgba(139,92,246,0.3)]
        "
      >
        <motion.div
          key={isDark ? 'moon' : 'sun'}
          initial={{ opacity: 0, rotate: -30, scale: 0.6 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          {isDark ? (
            <Moon className="w-3.5 h-3.5 text-white" />
          ) : (
            <Sun className="w-3.5 h-3.5 text-amber-500" />
          )}
        </motion.div>
      </motion.div>
      
      {/* Background icons for visual guidance */}
      <div className="absolute inset-0 flex items-center justify-between px-2.5 pointer-events-none opacity-20">
        <Sun className="w-3.5 h-3.5 text-white" />
        <Moon className="w-3.5 h-3.5 text-white" />
      </div>
    </motion.button>
  );
}
