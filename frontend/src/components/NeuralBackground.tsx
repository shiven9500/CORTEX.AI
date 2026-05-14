import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

const NeuralBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none bg-[var(--app-bg)] transition-colors duration-1000">
      <div
        className="absolute inset-0 transition-colors duration-1000 animate-mesh"
        style={{
          background: `radial-gradient(circle at 20% 30%, var(--bg-gradient-1) 0%, transparent 40%),
                       radial-gradient(circle at 80% 70%, var(--bg-gradient-2) 0%, transparent 40%),
                       radial-gradient(circle at 50% 50%, var(--bg-gradient-3) 0%, transparent 60%)`
        }}
      />

      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[120px] animate-float bg-[var(--bg-gradient-1)] transition-colors duration-1000" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[100px] animate-float bg-[var(--bg-gradient-2)] transition-colors duration-1000" style={{ animationDelay: '-2s' }} />

      <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      />
    </div>
  );
};

export default NeuralBackground;