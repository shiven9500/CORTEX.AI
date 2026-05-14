import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BrainCircuit, ArrowRight, Sparkles, Zap, Heart, Shield, Github, Chrome } from "lucide-react";

interface UserProfile {
  name: string;
  vibe: string;
  emotionalBaseline: string;
}

interface LoginPageProps {
  onComplete: (profile: UserProfile) => void;
  initialStep?: number;
  initialName?: string;
}

const VIBES = [
  { id: "casual", label: "Chill & Casual", icon: "☁️", desc: "Keep it relaxed, no formalities" },
  { id: "deep", label: "Deep & Thoughtful", icon: "🌊", desc: "Let's explore ideas together" },
  { id: "sharp", label: "Sharp & Direct", icon: "⚡", desc: "Straight to the point, always" },
  { id: "poetic", label: "Poetic & Expressive", icon: "🌸", desc: "Words that paint feelings" },
];

const EMOTIONAL_STATES = [
  { id: "thriving", label: "Thriving", color: "#ffb703", glow: "rgba(255,183,3,0.4)" },
  { id: "steady", label: "Steady", color: "#e2e8f0", glow: "rgba(226,232,240,0.3)" },
  { id: "reflective", label: "Reflective", color: "#00f5d4", glow: "rgba(0,245,212,0.4)" },
  { id: "turbulent", label: "Turbulent", color: "#f15bb5", glow: "rgba(241,91,181,0.4)" },
];

const STEP_COUNT = 4; // Step 0: Login, Step 1: Name, Step 2: Vibe, Step 3: Emotional

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function LoginPage({ onComplete, initialStep = 0, initialName = "" }: LoginPageProps) {
  const [step, setStep] = useState(initialStep);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(initialName);
  const [selectedVibe, setSelectedVibe] = useState("");
  const [selectedEmotional, setSelectedEmotional] = useState("");
  const [particles, setParticles] = useState<{ x: number; y: number; size: number; delay: number }[]>([]);

  useEffect(() => {
    const p = Array.from({ length: 30 }, (_, i) => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      delay: Math.random() * 5,
    }));
    setParticles(p);
  }, []);

  const canAdvance = () => {
    if (step === 0) return false; // Handled by OAuth buttons
    if (step === 1) return name.trim().length >= 2;
    if (step === 2) return !!selectedVibe;
    if (step === 3) return !!selectedEmotional;
    return false;
  };

  const handleOAuthLogin = (provider: string) => {
    const redirectTo = encodeURIComponent(window.location.origin);
    window.location.href = `${API_BASE_URL}/auth/login/${provider}?redirect=${redirectTo}`;
  };

  const handleNext = () => {
    if (step < STEP_COUNT - 1) {
      setStep((s) => s + 1);
    } else {
      onComplete({ name: name.trim(), vibe: selectedVibe, emotionalBaseline: selectedEmotional });
    }
  };

  const greeting = name.trim() ? name.trim().split(" ")[0] : "you";

  return (
    <div className="relative h-screen w-full overflow-hidden flex items-center justify-center" style={{ background: "#020203" }}>
      {/* Animated background orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute w-[600px] h-[600px] rounded-full"
          style={{
            top: "-10%", left: "-10%",
            background: "radial-gradient(circle, rgba(226,232,240,0.12) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
        <motion.div
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.1, 0.25, 0.1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute w-[500px] h-[500px] rounded-full"
          style={{
            bottom: "-10%", right: "-5%",
            background: "radial-gradient(circle, rgba(100,100,200,0.15) 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />
      </div>

      {/* Floating particles */}
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white/20 pointer-events-none"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
          animate={{ y: [-15, 15, -15], opacity: [0.1, 0.6, 0.1] }}
          transition={{ duration: 6 + p.delay, repeat: Infinity, ease: "easeInOut", delay: p.delay }}
        />
      ))}

      {/* Neural grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-lg mx-4"
      >
        {/* Progress bar */}
        <div className="flex gap-2 mb-8 px-2">
          {Array.from({ length: STEP_COUNT }).map((_, i) => (
            <motion.div
              key={i}
              className="h-1 flex-1 rounded-full overflow-hidden"
              style={{ background: "rgba(255,255,255,0.08)" }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{ background: "var(--primary, #e2e8f0)" }}
                initial={{ width: i < step ? "100%" : "0%" }}
                animate={{ width: i < step ? "100%" : i === step ? "100%" : "0%" }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </motion.div>
          ))}
        </div>

        {/* Card body */}
        <div
          className="rounded-[2.5rem] p-8 relative overflow-hidden"
          style={{
            background: "rgba(10,10,12,0.7)",
            border: "1px solid rgba(255,255,255,0.06)",
            boxShadow: "0 40px 100px -20px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.06)",
            backdropFilter: "blur(40px)",
          }}
        >
          {/* Cortex logo top */}
          <div className="flex items-center gap-3 mb-8">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.04))",
                border: "1px solid rgba(255,255,255,0.1)",
                boxShadow: "0 0 30px rgba(226,232,240,0.15)",
              }}
            >
              <BrainCircuit size={22} style={{ color: "#e2e8f0" }} />
            </div>
            <div>
              <p className="text-[10px] font-black tracking-[0.35em] uppercase text-white/40">Neural Interface</p>
              <p className="text-sm font-bold tracking-widest text-white/80" style={{ fontFamily: "Outfit, sans-serif" }}>CORTEX</p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {/* ── STEP 0: Login ── */}
            {step === 0 && (
              <motion.div
                key="step-login"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="mb-2">
                  <span className="text-xs font-bold tracking-[0.2em] uppercase text-white/30">Welcome to Cortex</span>
                </div>
                <h1 className="text-4xl font-extrabold text-white mb-2 leading-tight" style={{ fontFamily: "Outfit, sans-serif" }}>
                  Initialize Session
                </h1>
                <p className="text-sm text-white/40 mb-8 leading-relaxed">
                  Connect your identity to access the neural matrix and sync your memory across devices.
                </p>

                <div className="space-y-3">
                  <button
                    onClick={() => handleOAuthLogin('google')}
                    className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all group overflow-hidden relative"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    <Chrome size={20} className="text-[#4285F4]" />
                    <span>Continue with Google</span>
                  </button>

                  <button
                    onClick={() => handleOAuthLogin('github')}
                    className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all group overflow-hidden relative"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    <Github size={20} />
                    <span>Continue with GitHub</span>
                  </button>
                  
                  <div className="flex items-center gap-4 my-6">
                    <div className="h-px flex-1 bg-white/10" />
                    <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Or</span>
                    <div className="h-px flex-1 bg-white/10" />
                  </div>

                  <button
                    onClick={() => setStep(1)}
                    className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-transparent border border-white/5 text-white/40 font-bold hover:text-white/60 hover:bg-white/5 transition-all"
                  >
                    Guest Initialization
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── STEP 1: Name ── */}
            {step === 1 && (
              <motion.div
                key="step-name"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="mb-2">
                  <span className="text-xs font-bold tracking-[0.2em] uppercase text-white/30">Step 1 of 3</span>
                </div>
                <h1 className="text-4xl font-extrabold text-white mb-2 leading-tight" style={{ fontFamily: "Outfit, sans-serif" }}>
                  Who are you?
                </h1>
                <p className="text-sm text-white/40 mb-8 leading-relaxed">
                  Let Cortex know your name so it can build a truly personal bond with you.
                </p>

                <div className="relative group mb-6">
                  <input
                    type="text"
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && canAdvance() && handleNext()}
                    placeholder="Enter your name..."
                    className="w-full px-5 py-4 rounded-2xl text-white text-base font-medium outline-none transition-all duration-300 placeholder:text-white/20"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: name.length >= 2
                        ? "1px solid rgba(226,232,240,0.4)"
                        : "1px solid rgba(255,255,255,0.06)",
                      boxShadow: name.length >= 2
                        ? "0 0 30px rgba(226,232,240,0.08), inset 0 1px 0 rgba(255,255,255,0.05)"
                        : "inset 0 1px 0 rgba(255,255,255,0.03)",
                      caretColor: "#e2e8f0",
                    }}
                  />
                  {name.length >= 2 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 text-xs font-bold tracking-wider"
                    >
                      ✓
                    </motion.div>
                  )}
                </div>

                {name.length >= 2 && (
                  <motion.p
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-white/50 mb-2 font-medium"
                  >
                    Hey <span className="text-white font-bold">{name.trim().split(" ")[0]}</span> — nice to meet you. 👋
                  </motion.p>
                )}
              </motion.div>
            )}

            {/* ── STEP 2: Vibe ── */}
            {step === 2 && (
              <motion.div
                key="step-vibe"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="mb-2">
                  <span className="text-xs font-bold tracking-[0.2em] uppercase text-white/30">Step 2 of 3</span>
                </div>
                <h1 className="text-4xl font-extrabold text-white mb-2 leading-tight" style={{ fontFamily: "Outfit, sans-serif" }}>
                  Your vibe,{" "}
                  <span style={{ color: "#e2e8f0", textShadow: "0 0 30px rgba(226,232,240,0.5)" }}>
                    {greeting}
                  </span>
                  .
                </h1>
                <p className="text-sm text-white/40 mb-6 leading-relaxed">
                  How do you like Cortex to communicate with you?
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {VIBES.map((vibe) => (
                    <motion.button
                      key={vibe.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedVibe(vibe.id)}
                      className="relative p-4 rounded-2xl text-left transition-all duration-300 overflow-hidden"
                      style={{
                        background: selectedVibe === vibe.id
                          ? "rgba(255,255,255,0.1)"
                          : "rgba(255,255,255,0.03)",
                        border: selectedVibe === vibe.id
                          ? "1px solid rgba(255,255,255,0.2)"
                          : "1px solid rgba(255,255,255,0.05)",
                        boxShadow: selectedVibe === vibe.id
                          ? "0 0 30px rgba(226,232,240,0.08), inset 0 1px 0 rgba(255,255,255,0.08)"
                          : "none",
                      }}
                    >
                      {selectedVibe === vibe.id && (
                        <motion.div
                          layoutId="vibe-bg"
                          className="absolute inset-0 rounded-2xl"
                          style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.06), transparent)" }}
                        />
                      )}
                      <span className="text-2xl mb-2 block">{vibe.icon}</span>
                      <span className="text-sm font-bold text-white block mb-1">{vibe.label}</span>
                      <span className="text-[11px] text-white/40 leading-snug">{vibe.desc}</span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── STEP 3: Emotional Baseline ── */}
            {step === 3 && (
              <motion.div
                key="step-emotional"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="mb-2">
                  <span className="text-xs font-bold tracking-[0.2em] uppercase text-white/30">Step 3 of 3</span>
                </div>
                <h1 className="text-4xl font-extrabold text-white mb-2 leading-tight" style={{ fontFamily: "Outfit, sans-serif" }}>
                  How are you,{" "}
                  <span style={{ color: "#e2e8f0", textShadow: "0 0 30px rgba(226,232,240,0.5)" }}>
                    {greeting}
                  </span>
                  ?
                </h1>
                <p className="text-sm text-white/40 mb-6 leading-relaxed">
                  Cortex uses this to tune its emotional intelligence from the very first message.
                </p>
                <div className="flex flex-col gap-3">
                  {EMOTIONAL_STATES.map((state) => (
                    <motion.button
                      key={state.id}
                      whileHover={{ scale: 1.01, x: 4 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setSelectedEmotional(state.id)}
                      className="relative flex items-center gap-4 p-4 rounded-2xl text-left transition-all duration-300 overflow-hidden"
                      style={{
                        background: selectedEmotional === state.id
                          ? `rgba(${hexToRgb(state.color)},0.08)`
                          : "rgba(255,255,255,0.03)",
                        border: selectedEmotional === state.id
                          ? `1px solid rgba(${hexToRgb(state.color)},0.3)`
                          : "1px solid rgba(255,255,255,0.05)",
                        boxShadow: selectedEmotional === state.id
                          ? `0 0 30px rgba(${hexToRgb(state.color)},0.12)`
                          : "none",
                      }}
                    >
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{
                          background: state.color,
                          boxShadow: selectedEmotional === state.id ? `0 0 12px ${state.glow}` : "none",
                        }}
                      />
                      <span className="text-sm font-semibold" style={{ color: selectedEmotional === state.id ? state.color : "rgba(255,255,255,0.7)" }}>
                        {state.label}
                      </span>
                      {selectedEmotional === state.id && (
                        <motion.div
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="ml-auto text-xs font-bold tracking-wider"
                          style={{ color: state.color }}
                        >
                          ✓
                        </motion.div>
                      )}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {step > 0 && (
            <motion.button
              whileHover={canAdvance() ? { scale: 1.02 } : {}}
              whileTap={canAdvance() ? { scale: 0.98 } : {}}
              onClick={handleNext}
              disabled={!canAdvance()}
              className="relative mt-8 w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-sm tracking-widest uppercase transition-all duration-500 overflow-hidden"
              style={{
                background: canAdvance()
                  ? "linear-gradient(135deg, rgba(226,232,240,0.95), rgba(255,255,255,0.85))"
                  : "rgba(255,255,255,0.05)",
                color: canAdvance() ? "#000" : "rgba(255,255,255,0.2)",
                boxShadow: canAdvance() ? "0 20px 50px rgba(226,232,240,0.2)" : "none",
                cursor: canAdvance() ? "pointer" : "not-allowed",
              }}
            >
              {canAdvance() && (
                <motion.div
                  className="absolute inset-0"
                  animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  style={{
                    background: "linear-gradient(270deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0) 100%)",
                    backgroundSize: "200% 100%",
                  }}
                />
              )}
              <span className="relative z-10">
                {step < STEP_COUNT - 1 ? "Continue" : `Launch Cortex`}
              </span>
              <ArrowRight size={16} className="relative z-10" />
            </motion.button>
          )}
          {/* Trust indicators */}
          <div className="flex items-center justify-center gap-6 mt-6 pt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            {[
              { icon: Shield, label: "Private" },
              { icon: Zap, label: "Adaptive" },
              { icon: Heart, label: "Empathetic" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 text-white/25">
                <Icon size={12} />
                <span className="text-[10px] font-bold tracking-[0.15em] uppercase">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sparkle corners */}
        <motion.div
          animate={{ opacity: [0.3, 0.8, 0.3], rotate: [0, 20, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute -top-3 -right-3"
        >
          <Sparkles size={20} className="text-white/20" />
        </motion.div>
        <motion.div
          animate={{ opacity: [0.2, 0.6, 0.2], rotate: [0, -15, 0] }}
          transition={{ duration: 5, repeat: Infinity, delay: 1 }}
          className="absolute -bottom-2 -left-2"
        >
          <Sparkles size={14} className="text-white/15" />
        </motion.div>
      </motion.div>
    </div>
  );
}

// Helper: hex to rgb string for rgba()
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}`
    : "255,255,255";
}
