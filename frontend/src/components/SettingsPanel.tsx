import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X, User, MessageSquare, Shield, LogOut, Trash2,
  ChevronRight, Check, BrainCircuit, Github, Chrome,
  AlertTriangle, Zap, Palette, Bell, Lock, Info,
} from "lucide-react";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:8000") + "/";

interface UserProfile {
  name: string;
  vibe: string;
  emotionalBaseline: string;
}

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  oauthUser?: any;
  onUpdateProfile: (profile: UserProfile) => void;
  onClearSessions: () => void;
  onResetApp: () => void;
}

const VIBES = [
  { id: "casual",  label: "Chill & Casual",       icon: "☁️" },
  { id: "deep",    label: "Deep & Thoughtful",     icon: "🌊" },
  { id: "sharp",   label: "Sharp & Direct",         icon: "⚡" },
  { id: "poetic",  label: "Poetic & Expressive",   icon: "🌸" },
];

const EMOTIONAL_STATES = [
  { id: "thriving",   label: "Thriving",   color: "#ffb703" },
  { id: "steady",     label: "Steady",     color: "#e2e8f0" },
  { id: "reflective", label: "Reflective", color: "#00f5d4" },
  { id: "turbulent",  label: "Turbulent",  color: "#f15bb5" },
];

type Tab = "profile" | "conversations" | "account" | "about";

const NAV: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "profile",       label: "Profile",       icon: User },
  { id: "conversations", label: "Conversations", icon: MessageSquare },
  { id: "account",       label: "Account",       icon: Shield },
  { id: "about",         label: "About",         icon: Info },
];

export default function SettingsPanel({
  isOpen,
  onClose,
  userProfile,
  onUpdateProfile,
  onClearSessions,
  onResetApp,
  oauthUser,
}: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>("profile");

  // Profile edit state
  const [editName, setEditName] = useState(userProfile.name);
  const [editVibe, setEditVibe] = useState(userProfile.vibe);
  const [editBaseline, setEditBaseline] = useState(userProfile.emotionalBaseline);
  const [saved, setSaved] = useState(false);

  // Danger confirmations
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const handleSaveProfile = () => {
    if (editName.trim().length < 2) return;
    onUpdateProfile({ name: editName.trim(), vibe: editVibe, emotionalBaseline: editBaseline });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const profileDirty =
    editName.trim() !== userProfile.name ||
    editVibe !== userProfile.vibe ||
    editBaseline !== userProfile.emotionalBaseline;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            key="panel"
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed right-0 top-0 bottom-0 z-[70] w-full max-w-[480px] flex flex-col"
            style={{
              background: "rgba(8,8,10,0.97)",
              borderLeft: "1px solid rgba(255,255,255,0.06)",
              boxShadow: "-40px 0 120px rgba(0,0,0,0.8)",
              backdropFilter: "blur(40px)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-5 shrink-0"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.03))",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <BrainCircuit size={18} className="text-white/70" />
                </div>
                <div>
                  <p className="text-[10px] font-black tracking-[0.3em] uppercase text-white/30">Cortex</p>
                  <p className="text-sm font-bold text-white/90" style={{ fontFamily: "Outfit, sans-serif" }}>Settings</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 transition-all duration-200"
              >
                <X size={18} />
              </button>
            </div>

            {/* Nav tabs */}
            <div
              className="flex gap-1 px-4 py-3 shrink-0"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
            >
              {NAV.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className="relative flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200"
                  style={{
                    color: activeTab === id ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.3)",
                    background: activeTab === id ? "rgba(255,255,255,0.08)" : "transparent",
                  }}
                >
                  <Icon size={13} />
                  <span className="hidden sm:inline">{label}</span>
                  {activeTab === id && (
                    <motion.div
                      layoutId="settings-tab"
                      className="absolute inset-0 rounded-xl"
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 custom-scrollbar">
              <AnimatePresence mode="wait">

                {/* ─── PROFILE TAB ─── */}
                {activeTab === "profile" && (
                  <motion.div
                    key="profile"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-6"
                  >
                    {/* Name */}
                    <Section title="Your Name" icon={User}>
                      <div className="relative">
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="Your name..."
                          className="w-full px-4 py-3 rounded-xl text-white text-sm font-medium outline-none transition-all duration-300 placeholder:text-white/20"
                          style={{
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            caretColor: "#e2e8f0",
                          }}
                          onFocus={(e) => { e.target.style.borderColor = "rgba(226,232,240,0.3)"; }}
                          onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; }}
                        />
                      </div>
                    </Section>

                    {/* Vibe */}
                    <Section title="Communication Vibe" icon={Zap}>
                      <div className="grid grid-cols-2 gap-2">
                        {VIBES.map((v) => (
                          <button
                            key={v.id}
                            onClick={() => setEditVibe(v.id)}
                            className="flex items-center gap-2.5 p-3 rounded-xl text-left transition-all duration-200"
                            style={{
                              background: editVibe === v.id ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.03)",
                              border: editVibe === v.id ? "1px solid rgba(255,255,255,0.18)" : "1px solid rgba(255,255,255,0.05)",
                            }}
                          >
                            <span className="text-lg leading-none">{v.icon}</span>
                            <span className="text-xs font-semibold" style={{ color: editVibe === v.id ? "#fff" : "rgba(255,255,255,0.5)" }}>
                              {v.label}
                            </span>
                            {editVibe === v.id && <Check size={12} className="ml-auto text-white/60" />}
                          </button>
                        ))}
                      </div>
                    </Section>

                    {/* Emotional Baseline */}
                    <Section title="Emotional Baseline" icon={Palette}>
                      <div className="flex flex-col gap-2">
                        {EMOTIONAL_STATES.map((s) => (
                          <button
                            key={s.id}
                            onClick={() => setEditBaseline(s.id)}
                            className="flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-200"
                            style={{
                              background: editBaseline === s.id ? `rgba(${hexToRgb(s.color)},0.08)` : "rgba(255,255,255,0.03)",
                              border: editBaseline === s.id ? `1px solid rgba(${hexToRgb(s.color)},0.3)` : "1px solid rgba(255,255,255,0.05)",
                            }}
                          >
                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
                            <span className="text-sm font-semibold" style={{ color: editBaseline === s.id ? s.color : "rgba(255,255,255,0.6)" }}>
                              {s.label}
                            </span>
                            {editBaseline === s.id && (
                              <Check size={13} className="ml-auto" style={{ color: s.color }} />
                            )}
                          </button>
                        ))}
                      </div>
                    </Section>

                    {/* Save button */}
                    <motion.button
                      whileHover={profileDirty ? { scale: 1.01 } : {}}
                      whileTap={profileDirty ? { scale: 0.99 } : {}}
                      onClick={handleSaveProfile}
                      disabled={!profileDirty || editName.trim().length < 2}
                      className="w-full py-3.5 rounded-xl font-bold text-xs tracking-widest uppercase transition-all duration-300"
                      style={{
                        background: saved
                          ? "rgba(16,185,129,0.2)"
                          : profileDirty && editName.trim().length >= 2
                            ? "linear-gradient(135deg, rgba(226,232,240,0.9), rgba(255,255,255,0.8))"
                            : "rgba(255,255,255,0.04)",
                        color: saved ? "#34d399" : profileDirty && editName.trim().length >= 2 ? "#000" : "rgba(255,255,255,0.2)",
                        border: saved ? "1px solid rgba(52,211,153,0.3)" : "none",
                        cursor: profileDirty && editName.trim().length >= 2 ? "pointer" : "not-allowed",
                      }}
                    >
                      {saved ? "✓ Saved!" : "Save Changes"}
                    </motion.button>
                  </motion.div>
                )}

                {/* ─── CONVERSATIONS TAB ─── */}
                {activeTab === "conversations" && (
                  <motion.div
                    key="conversations"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-6"
                  >
                    <Section title="Neural Memory" icon={MessageSquare}>
                      <p className="text-xs text-white/40 leading-relaxed mb-4">
                        Your conversation history and Cortex's learned knowledge about you are stored locally on this device.
                      </p>
                      <InfoCard>
                        Your neural archive, personality weights, and chat history are all saved in your browser's local storage. They stay on your device and are never sent to our servers.
                      </InfoCard>
                    </Section>

                    {/* Danger zone */}
                    <Section title="Danger Zone" icon={AlertTriangle} danger>
                      <div className="space-y-3">
                        {/* Clear conversations */}
                        <div
                          className="p-4 rounded-xl"
                          style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.1)" }}
                        >
                          <p className="text-sm font-bold text-red-400 mb-1">Clear All Conversations</p>
                          <p className="text-xs text-white/40 mb-3">Deletes all chat sessions. Cortex's knowledge about you is kept.</p>
                          {!confirmClear ? (
                            <button
                              onClick={() => setConfirmClear(true)}
                              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-red-400 hover:bg-red-500/10 transition-colors border border-red-500/20"
                            >
                              <Trash2 size={13} /> Clear Conversations
                            </button>
                          ) : (
                            <div className="flex gap-2">
                              <button
                                onClick={() => { onClearSessions(); setConfirmClear(false); }}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30"
                              >
                                <Check size={13} /> Confirm
                              </button>
                              <button
                                onClick={() => setConfirmClear(false)}
                                className="px-3 py-2 rounded-lg text-xs font-bold text-white/40 hover:bg-white/5 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Full reset */}
                        <div
                          className="p-4 rounded-xl"
                          style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.1)" }}
                        >
                          <p className="text-sm font-bold text-red-400 mb-1">Reset Everything</p>
                          <p className="text-xs text-white/40 mb-3">Wipes your profile, all sessions, and neural knowledge. You'll go through onboarding again.</p>
                          {!confirmReset ? (
                            <button
                              onClick={() => setConfirmReset(true)}
                              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-red-400 hover:bg-red-500/10 transition-colors border border-red-500/20"
                            >
                              <AlertTriangle size={13} /> Reset Cortex
                            </button>
                          ) : (
                            <div className="flex gap-2">
                              <button
                                onClick={() => { onResetApp(); setConfirmReset(false); }}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30"
                              >
                                <Check size={13} /> Yes, Reset
                              </button>
                              <button
                                onClick={() => setConfirmReset(false)}
                                className="px-3 py-2 rounded-lg text-xs font-bold text-white/40 hover:bg-white/5 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </Section>
                  </motion.div>
                )}

                {/* ─── ACCOUNT TAB ─── */}
                {activeTab === "account" && (
                  <motion.div
                    key="account"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-6"
                  >
                    {/* Current identity */}
                    <Section title="Current Identity" icon={User}>
                      <div
                        className="flex items-center gap-4 p-4 rounded-xl"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                      >
                        <div
                          className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black shrink-0 overflow-hidden"
                          style={{ background: "linear-gradient(135deg, rgba(226,232,240,0.15), rgba(226,232,240,0.05))", border: "1px solid rgba(255,255,255,0.1)" }}
                        >
                          {oauthUser?.picture ? (
                            <img src={oauthUser.picture} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            userProfile.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{userProfile.name}</p>
                          <p className="text-xs text-white/40 mt-0.5">
                            {oauthUser ? `Synced · ${oauthUser.email}` : "Local profile · This device only"}
                          </p>
                        </div>
                        {oauthUser ? (
                          <Shield size={14} className="ml-auto text-emerald-400" />
                        ) : (
                          <Lock size={14} className="ml-auto text-white/20" />
                        )}
                      </div>
                    </Section>

                    {/* OAuth section */}
                    {!oauthUser && (
                      <Section title="Sync Across Devices" icon={Shield}>
                        <InfoCard>
                          Sign in with Google or GitHub to sync your profile, neural memory, and conversations to the cloud — so Cortex knows you on any device.
                        </InfoCard>

                        <div className="space-y-2 mt-4">
                          {/* Google */}
                          <OAuthButton
                            icon={<GoogleIcon />}
                            label="Continue with Google"
                            description="Recommended · Fast & secure"
                            onClick={() => { window.location.href = `${API_BASE}auth/login/google?redirect=${encodeURIComponent(window.location.origin)}`; }}
                          />
                          {/* GitHub */}
                          <OAuthButton
                            icon={<Github size={18} className="text-white/80" />}
                            label="Continue with GitHub"
                            description="Great for developers"
                            onClick={() => { window.location.href = `${API_BASE}auth/login/github?redirect=${encodeURIComponent(window.location.origin)}`; }}
                          />
                        </div>

                        <div
                          className="mt-4 p-3 rounded-xl flex gap-3"
                          style={{ background: "rgba(226,232,240,0.04)", border: "1px solid rgba(226,232,240,0.08)" }}
                        >
                          <Lock size={14} className="text-white/30 shrink-0 mt-0.5" />
                          <p className="text-[11px] text-white/40 leading-relaxed">
                            Signing in syncs your profile to the cloud. Your conversations stay private and encrypted in transit.
                          </p>
                        </div>
                      </Section>
                    )}

                    {/* Sign out / Notifications */}
                    <Section title="Session" icon={Bell}>
                      <button
                        onClick={onResetApp}
                        className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-colors border border-red-500/10 hover:border-red-500/20"
                      >
                        <LogOut size={16} />
                        Sign out & Reset
                        <ChevronRight size={14} className="ml-auto opacity-50" />
                      </button>
                    </Section>
                  </motion.div>
                )}

                {/* ─── ABOUT TAB ─── */}
                {activeTab === "about" && (
                  <motion.div
                    key="about"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-6"
                  >
                    <div className="text-center py-6">
                      <div
                        className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                        style={{
                          background: "linear-gradient(135deg, rgba(226,232,240,0.12), rgba(226,232,240,0.03))",
                          border: "1px solid rgba(255,255,255,0.1)",
                          boxShadow: "0 0 40px rgba(226,232,240,0.1)",
                        }}
                      >
                        <BrainCircuit size={28} className="text-white/70" />
                      </div>
                      <p className="text-xl font-black text-white tracking-widest" style={{ fontFamily: "Outfit, sans-serif" }}>CORTEX</p>
                      <p className="text-[10px] text-white/30 tracking-[0.3em] uppercase mt-1">Neural Emotion Engine</p>
                      <p className="text-xs text-white/20 mt-2">v3.1.0</p>
                    </div>

                    <Section title="What is Cortex?" icon={Info}>
                      <p className="text-xs text-white/50 leading-relaxed">
                        Cortex is an emotionally intelligent AI companion powered by Groq inference. It detects your mood, adapts its communication style to your vibe, and builds a neural memory of who you are over time.
                      </p>
                    </Section>

                    <Section title="Tech Stack" icon={Zap}>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          ["Frontend", "React + Vite"],
                          ["Motion", "Motion/React"],
                          ["Backend", "FastAPI + Python"],
                          ["Inference", "Groq / LLaMA 3"],
                          ["Memory", "Neural JSON Store"],
                          ["Styling", "Tailwind CSS v4"],
                        ].map(([k, v]) => (
                          <div key={k} className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 mb-1">{k}</p>
                            <p className="text-xs font-semibold text-white/70">{v}</p>
                          </div>
                        ))}
                      </div>
                    </Section>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ── Sub-components ── */

function Section({ title, icon: Icon, children, danger = false }: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Icon size={13} className={danger ? "text-red-400" : "text-white/40"} />
        <span className={`text-[10px] font-black uppercase tracking-[0.25em] ${danger ? "text-red-400/70" : "text-white/30"}`}>
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

function InfoCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="p-3 rounded-xl"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <p className="text-[11px] text-white/40 leading-relaxed">{children}</p>
    </div>
  );
}

function OAuthButton({
  icon, label, description, comingSoon, onClick,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  comingSoon?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      disabled={comingSoon}
      onClick={onClick}
      className="relative w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group hover:bg-white/8"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        cursor: comingSoon ? "not-allowed" : "pointer",
        opacity: comingSoon ? 0.6 : 1,
      }}
    >
      <span className="w-8 h-8 flex items-center justify-center">{icon}</span>
      <div className="text-left">
        <p className="text-sm font-bold text-white/80">{label}</p>
        <p className="text-[10px] text-white/30">{description}</p>
      </div>
      {comingSoon && (
        <span
          className="ml-auto text-[9px] font-black uppercase tracking-[0.15em] px-2 py-1 rounded-md"
          style={{ background: "rgba(255,183,3,0.1)", color: "#ffb703", border: "1px solid rgba(255,183,3,0.2)" }}
        >
          Soon
        </span>
      )}
      {!comingSoon && <ChevronRight size={14} className="ml-auto text-white/30 group-hover:text-white/60 transition-colors" />}
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function hexToRgb(hex: string): string {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? `${parseInt(r[1],16)},${parseInt(r[2],16)},${parseInt(r[3],16)}` : "255,255,255";
}
