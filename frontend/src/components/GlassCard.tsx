import { motion } from 'framer-motion';

interface Props {
  children: React.ReactNode;
  className?: string;
  /** If provided, the card becomes a clickable element */
  onClick?: () => void;
  /** Disable the hover lift animation */
  noHover?: boolean;
  /** Extra padding preset */
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

// Spring presets tuned for 120 Hz ProMotion
const HOVER_SPRING  = { type: 'spring', stiffness: 380, damping: 28, mass: 0.8 } as const;
const TAP_SPRING    = { type: 'spring', stiffness: 600, damping: 38, mass: 0.5 } as const;

const PADDING_MAP = {
  none: '',
  sm:   'p-4',
  md:   'p-5',
  lg:   'p-6',
};

export default function GlassCard({
  children,
  className = '',
  onClick,
  noHover = false,
  padding = 'md',
}: Props) {
  const isInteractive = !!onClick;

  return (
    <motion.div
      onClick={onClick}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onKeyDown={isInteractive ? (e) => e.key === 'Enter' && onClick() : undefined}

      // ── Dark mode glass surface ──────────────────────────────────────────
      // bg-white/[.03]  → barely-there glass tint
      // backdrop-blur-xl → frosted-glass depth
      // border-white/[.08] → hairline edge highlight
      // shadow-glass → deep ambient occlusion shadow
      className={`
        relative overflow-hidden rounded-2xl
        dark:bg-white/[.03] bg-white
        backdrop-blur-xl
        dark:border-white/[.08] border-black/[.06] border
        dark:shadow-glass shadow-card-light
        ${isInteractive ? 'cursor-pointer' : ''}
        ${PADDING_MAP[padding]}
        ${className}
      `}

      // ── Hover: 3-D lift + violet border glow ──────────────────────────────
      whileHover={!noHover ? {
        y: -6,
        scale: 1.015,
        boxShadow:
          '0 20px 60px rgba(0,0,0,0.65), ' +
          '0 0 0 1px var(--primary-accent), ' +
          '0 0 48px var(--glow-color)',
        transition: HOVER_SPRING,
      } : undefined}

      // ── Tap: slight press-down ─────────────────────────────────────────────
      whileTap={isInteractive ? {
        scale: 0.978,
        transition: TAP_SPRING,
      } : undefined}
    >
      {/* Inner top-edge gradient highlight (simulates light catching the rim) */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
      />

      {/* Subtle radial inner glow on top-left corner */}
      <span
        aria-hidden
        className="pointer-events-none absolute -top-16 -left-16 h-48 w-48 rounded-full bg-white/[.025] blur-3xl"
      />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}
