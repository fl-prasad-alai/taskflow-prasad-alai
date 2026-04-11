import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Leaf } from 'lucide-react';
import { useTheme, Theme } from '../contexts/ThemeContext';

const THEMES: { id: Theme; icon: any; color: string; label: string }[] = [
  { id: 'green', icon: Leaf, color: '#10b981', label: 'Greening India' },
  { id: 'dark',  icon: Moon, color: '#8b5cf6', label: 'Obsidian Night' },
  { id: 'light', icon: Sun,  color: '#e11d48', label: 'Zomato Day' },
];

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="relative group p-1.5 w-[160px] h-[48px] rounded-full bg-white/40 dark:bg-white/5 border border-white/10 backdrop-blur-2xl shadow-2xl flex items-center justify-between overflow-hidden touch-none active:scale-[0.98] transition-transform">
      {/* The Glow Orb (Sliding persistent element) */}
      <motion.div
        className="absolute h-9 w-10 btn-glow rounded-full z-0"
        initial={false}
        animate={{
          x: theme === 'green' ? 0 : theme === 'dark' ? 52 : 104,
          backgroundColor: THEMES.find(t => t.id === theme)?.color,
          boxShadow: `0 0 25px ${THEMES.find(t => t.id === theme)?.color}88`
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      />

      {THEMES.map((t) => {
        const isActive = theme === t.id;
        const Icon = t.icon;
        
        return (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            className={`
              relative z-10 flex items-center justify-center w-10 h-10 rounded-full
              transition-all duration-500
              ${isActive ? 'text-white scale-110' : 'text-zinc-500 hover:text-white hover:bg-white/5'}
            `}
            aria-label={t.label}
          >
            <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
          </button>
        );
      })}

      <style>{`
        .btn-glow {
          filter: blur(2px);
        }
      `}</style>
    </div>
  );
}
