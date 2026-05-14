import React from 'react';
import { motion } from 'motion/react';

interface NeuralPulseProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string; // Kept for backwards compatibility but ignored in favor of global theme variables
}

const NeuralPulse: React.FC<NeuralPulseProps> = ({ size = 'md' }) => {
  const dimensions = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32'
  }[size];

  return (
    <div className={`relative flex items-center justify-center ${dimensions}`}>
      {/* Background Glowing Halo */}
      <motion.div
        animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.25, 0.1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-[-20%] rounded-full bg-theme-primary blur-xl"
      />

      {/* Orbit Track 1 (Outer Ring) */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 rounded-full border-2 border-transparent border-t-theme-primary border-b-theme-primary shadow-[0_0_15px_var(--primary-glow)] opacity-80"
      />

      {/* Orbit Track 2 (Inner Counter-Rotating Ring) */}
      <motion.div
        animate={{ rotate: -360, scale: [0.95, 1.05, 0.95] }}
        transition={{
          rotate: { duration: 8, repeat: Infinity, ease: "linear" },
          scale: { duration: 4, repeat: Infinity, ease: "easeInOut" }
        }}
        className="absolute inset-[15%] rounded-full border border-theme-light border-r-theme-primary border-l-theme-primary"
      />

      {/* Hexagonal Inner Matrix */}
      <motion.div
        animate={{
          scale: [0.85, 1.05, 0.85],
          rotate: [0, 90, 180, 270, 360],
        }}
        transition={{
          scale: { duration: 3, repeat: Infinity, ease: "easeInOut" },
          rotate: { duration: 30, repeat: Infinity, ease: "linear" }
        }}
        className="absolute inset-[25%]"
      >
        <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
          {/* Solid glowing polygon */}
          <polygon
            points="50 5, 90 25, 90 75, 50 95, 10 75, 10 25"
            fill="#FFFFFF"
            opacity="0.3"
            style={{ filter: "drop-shadow(0px 0px 8px var(--primary))" }}
          />
          {/* Inner sharp wireframe polygon */}
          <polygon
            points="50 15, 80 30, 80 70, 50 85, 20 70, 20 30"
            fill="none"
            stroke="#F1F1F1F"
            strokeWidth="3"
            opacity="0.9"
          />
        </svg>
      </motion.div>

      {/* Inner Pulsing Core Point */}
      <motion.div
        animate={{ scale: [0.6, 1.4, 0.6], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-[40%] rounded-full bg-white shadow-[0_0_20px_white]"
      />

      {/* High-speed Orbiting Particles */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          animate={{ rotate: 360 }}
          transition={{ duration: 2.5 + i * 0.5, repeat: Infinity, ease: "linear" }}
          className="absolute inset-[5%]"
          style={{ transformOrigin: "center" }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[3px] h-[3px] bg-white rounded-full shadow-[0_0_10px_white]" />
        </motion.div>
      ))}
    </div>
  );
};

export default NeuralPulse;