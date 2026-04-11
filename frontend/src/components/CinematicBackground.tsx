import React from 'react';
import { motion } from 'framer-motion';

const CinematicBackground: React.FC = React.memo(() => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-slate-50 dark:bg-[#0a0a0c] transition-colors duration-500">
      {/* Liquid Mesh Blobs */}
      <div className="absolute inset-0 opacity-40 dark:opacity-100">
        <motion.div
          animate={{
            x: [0, 40, -40, 0],
            y: [0, -60, 60, 0],
            scale: [1, 1.2, 0.9, 1],
            rotate: [0, 90, 180, 270, 360],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute -top-[20%] -left-[10%] h-[80%] w-[80%] rounded-full bg-violet-400/20 dark:bg-[#8b5cf6]/20 blur-[120px] will-change-transform"
        />
        <motion.div
          animate={{
            x: [0, -50, 50, 0],
            y: [0, 70, -70, 0],
            scale: [1, 0.8, 1.1, 1],
            rotate: [360, 270, 180, 90, 0],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute -bottom-[20%] -right-[10%] h-[70%] w-[70%] rounded-full bg-slate-200/40 dark:bg-[#1e293b]/40 blur-[100px] will-change-transform"
        />
        <motion.div
          animate={{
            x: [0, 30, -30, 0],
            y: [0, 30, -30, 0],
            scale: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-1/4 left-1/4 h-[50%] w-[50%] rounded-full bg-slate-300/30 dark:bg-[#0f172a]/60 blur-[140px] will-change-transform"
        />
      </div>

      {/* Noise Texture Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
          <filter id="noiseFilter">
            <feTurbulence 
              type="fractalNoise" 
              baseFrequency="0.65" 
              numOctaves="3" 
              stitchTiles="stitch" 
            />
          </filter>
          <rect width="100%" height="100%" filter="url(#noiseFilter)" />
        </svg>
      </div>

      {/* Subtle vignettes */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-transparent to-[#0a0a0c]/80 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0c] via-transparent to-[#0a0a0c]/80 pointer-events-none" />
    </div>
  );
});

CinematicBackground.displayName = 'CinematicBackground';

export default CinematicBackground;
