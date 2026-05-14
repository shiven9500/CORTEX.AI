import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useVelocity, useSpring } from "motion/react";
import { Menu, Sparkles, X, BrainCircuit, Smile, Frown, Flame, Activity, Minus } from "lucide-react";
import Sidebar from "./components/Sidebar";
import ChatInput from "./components/ChatInput";
import MessageItem from "./components/MessageItem";
import NeuralBackground from "./components/NeuralBackground";
import LoginPage from "./components/LoginPage";
import SettingsPanel from "./components/SettingsPanel";
import { Message, ChatResponse } from "./types";

interface UserProfile {
  name: string;
  vibe: string;
  emotionalBaseline: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

function MainApp({ userProfile: initialProfile, oauthUser, onResetApp }: { userProfile: UserProfile; oauthUser?: any; onResetApp: () => void }) {
  const [userProfile, setUserProfile] = useState<UserProfile>(initialProfile);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [currentMood, setCurrentMood] = useState("neutral");
  const [usage, setUsage] = useState({ remaining: 0, limit: 10 });
  const [selectedModel, setSelectedModel] = useState<"cortex-pro" | "neural-lite">("cortex-pro");
  const [knowledge, setKnowledge] = useState<{ topic: string, value: string }[]>([]);
  const [personality, setPersonality] = useState<any>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleUpdateProfile = (profile: UserProfile) => {
    localStorage.setItem("cortex_user_profile", JSON.stringify(profile));
    setUserProfile(profile);
  };

  const handleClearSessions = () => {
    setSessions([]);
    setCurrentSessionId(null);
    localStorage.removeItem("chat_sessions");
  };

  const scrollRef = useRef<HTMLDivElement>(null);

  // High-performance scroll tracking for physics
  const { scrollY } = useScroll({ container: scrollRef });
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, { damping: 50, stiffness: 400 });

  const currentSession = sessions.find(s => s.id === currentSessionId);

  useEffect(() => {
    const saved = localStorage.getItem("chat_sessions");
    if (saved) {
      const parsed = JSON.parse(saved);
      setSessions(parsed);
      if (parsed.length > 0) setCurrentSessionId(parsed[0].id);
    }
  }, []);

  useEffect(() => {
    fetch(`${API_BASE_URL}/usage`)
      .then(res => res.json())
      .then(data => {
        setUsage(data);
      })
      .catch(() => { });

    fetch(`${API_BASE_URL}/knowledge`)
      .then(res => res.json())
      .then(data => setKnowledge(data.insights))
      .catch(() => { });

    fetch(`${API_BASE_URL}/personality`)
      .then(res => res.json())
      .then(data => setPersonality(data))
      .catch(() => { });
  }, []);

  useEffect(() => {
    localStorage.setItem("chat_sessions", JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    if (currentSession && currentSession.messages.length > 0) {
      const lastAiMsg = [...currentSession.messages].reverse().find(m => m.sender === "ai");
      if (lastAiMsg?.analysis?.detected_emotion) {
        setCurrentMood(lastAiMsg.analysis.detected_emotion);
      }
    }
  }, [currentSession]);

  const handleNewChat = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: "New Conversation",
      messages: [],
      createdAt: Date.now(),
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setSidebarOpen(false);
    setCurrentMood("neutral");
  };

  const handleSendMessage = async (text: string) => {
    if (!currentSessionId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: "user",
      text,
      timestamp: Date.now(),
    };

    setSessions(prev => prev.map(s =>
      s.id === currentSessionId ? { ...s, messages: [...s.messages, userMessage] } : s
    ));

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          model: selectedModel,
          session_id: currentSessionId
        }),
      });

      if (!res.ok) throw new Error("Server error");
      const data: ChatResponse = await res.json();

      const aiMessage: Message = {
        id: Date.now().toString(),
        sender: "ai",
        text: data.response,
        timestamp: Date.now(),
        analysis: data.analysis,
        state: data.state,
        action: data.action
      };

      const generateTitle = (msg: string): string => {
        const clean = msg.trim();
        // Remove filler words for a cleaner title
        const fillers = /^(hey|hi|hello|um|uh|so|well|okay|ok|like|you know|basically|actually|just)\b[\s,]*/gi;
        let title = clean.replace(fillers, '').replace(fillers, ''); // double pass

        // Capitalize first letter
        title = title.charAt(0).toUpperCase() + title.slice(1);

        // Cut at a natural break point (period, comma, question mark) or at 40 chars
        const breakMatch = title.match(/^(.{15,45}?)[.!?,]/);
        if (breakMatch) {
          title = breakMatch[1].trim();
        } else if (title.length > 45) {
          // Cut at last space before 45 chars
          title = title.substring(0, 45).replace(/\s+\S*$/, '').trim();
        }

        // Remove trailing conjunctions
        title = title.replace(/\s+(and|but|or|so|because|that|which)\s*$/i, '');

        return title || clean.slice(0, 30);
      };

      setSessions(prev => prev.map(s => {
        if (s.id !== currentSessionId) return s;
        const updatedMessages = [...s.messages, aiMessage];
        // Set title on first message exchange, keep it stable after that
        const newTitle = s.messages.length <= 1 ? generateTitle(text) : s.title;
        return { ...s, messages: updatedMessages, title: newTitle };
      }));
      if (data.remaining !== undefined) {
        setUsage(prev => ({ ...prev, remaining: data.remaining! }));
      }
    } catch (err) {
      setError("Failed to connect to Mood AI Engine.");
    } finally {
      setIsLoading(false);
      // Refresh knowledge and personality after each message
      fetch(`${API_BASE_URL}/knowledge`)
        .then(res => res.json())
        .then(data => setKnowledge(data.insights))
        .catch(() => { });
      fetch(`${API_BASE_URL}/personality`)
        .then(res => res.json())
        .then(data => setPersonality(data))
        .catch(() => { });
    }
  };

  // Personalized suggestions based on vibe & emotional baseline
  const getPersonalizedSuggestions = () => {
    if (!userProfile) return ["I'm feeling a bit overwhelmed", "Just had a great day!", "Need someone to talk", "not sure how i feel"];
    const name = userProfile.name.split(" ")[0];
    const baseline = userProfile.emotionalBaseline;
    const vibe = userProfile.vibe;
    const map: Record<string, string[]> = {
      thriving: [`What's been making me happy lately`, `I want to reflect on something good`, `Tell me something inspiring`, `What should I focus on next?`],
      steady: [`I need help thinking through something`, `What can we explore together?`, `I want to understand myself better`, `Walk me through a complex idea`],
      reflective: [`I've been thinking a lot lately`, `Help me make sense of my feelings`, `I feel kind of lost`, `I need perspective on something`],
      turbulent: [`I'm feeling overwhelmed right now`, `Everything feels heavy`, `I just need to talk`, `Help me calm down`],
    };
    return map[baseline] || map.steady;
  };

  const firstName = userProfile?.name?.split(" ")[0] ?? "";

  return (
    <div className={`theme-${currentMood} h-screen w-full overflow-hidden flex relative transition-colors duration-1000`}>
      <NeuralBackground />

      <SettingsPanel
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        userProfile={userProfile}
        oauthUser={oauthUser}
        onUpdateProfile={handleUpdateProfile}
        onClearSessions={handleClearSessions}
        onResetApp={onResetApp}
      />

      <Sidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        onNewChat={handleNewChat}
        onSelectChat={(id) => { setCurrentSessionId(id); setSidebarOpen(false); }}
        onDeleteChat={(id) => setSessions(prev => prev.filter(s => s.id !== id))}
        onRenameChat={(id, title) => setSessions(prev => prev.map(s => s.id === id ? { ...s, title } : s))}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        knowledge={knowledge}
        personality={personality}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <main className="flex-1 flex flex-col relative overflow-hidden p-4 lg:pl-6">
        <header className="h-[72px] mx-auto w-full max-w-7xl flex items-center justify-between px-6 mb-6 mt-4 glass-card rounded-[2rem] z-20 shrink-0 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-white/5 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-theme-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          <div className="flex items-center gap-4 relative z-10">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-white/10 rounded-xl transition-colors text-[var(--text-primary)]"
            >
              <Menu size={22} />
            </button>
            <div className="flex flex-col">
              <h2 className="text-[10px] font-black tracking-[0.3em] uppercase flex items-center gap-2 text-[var(--text-primary)]">
                <BrainCircuit size={14} className="text-theme-primary animate-pulse drop-shadow-[0_0_10px_var(--color-primary)]" />
                CORTEX SYSTEM
              </h2>
              <div className="flex items-center gap-1.5 mt-1">
                <div className={`w-1.5 h-1.5 rounded-full shadow-theme ${isLoading ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
                <span className="text-[9px] font-bold text-theme-secondary uppercase tracking-[0.2em] opacity-80">
                  {isLoading ? 'Processing Matrices' : firstName ? `Hey, ${firstName} · Neural Core Ready` : 'Neural Core Ready'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 relative z-10">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-[10px] font-black tracking-[0.3em] uppercase text-theme-secondary opacity-50 mb-1">
                Neural Mood
              </span>
              <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md group-hover:border-theme-primary/30 transition-colors">
                <motion.div
                  key={currentMood}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="relative"
                >
                  <div className="absolute inset-0 bg-theme-primary blur-md opacity-20 animate-pulse" />
                  {currentMood === "happy" && <Smile size={18} className="text-theme-primary relative z-10" />}
                  {currentMood === "sad" && <Frown size={18} className="text-theme-primary relative z-10" />}
                  {currentMood === "angry" && <Flame size={18} className="text-theme-primary relative z-10" />}
                  {currentMood === "anxious" && <Activity size={18} className="text-theme-primary relative z-10" />}
                  {currentMood === "neutral" && <Minus size={18} className="text-theme-primary relative z-10" />}
                </motion.div>
                <motion.span
                  key={currentMood + "-text"}
                  initial={{ x: 10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--text-primary)]"
                >
                  {currentMood}
                </motion.span>
              </div>
            </div>
          </div>
        </header>

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 lg:px-8 custom-scrollbar flex flex-col"
        >
          <div className="max-w-3xl mx-auto flex flex-col flex-1 w-full pb-8">
            <AnimatePresence mode="popLayout">
              {!currentSession || currentSession.messages.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex-1 flex flex-col items-center justify-center text-center py-12"
                >
                  <div className="relative w-[100px] h-[100px] mb-8 group mx-auto">
                    <div className="absolute inset-0 bg-theme-primary blur-[40px] opacity-40 group-hover:opacity-60 transition-opacity duration-1000 mood-pulse" />
                    <motion.div
                      animate={{ y: [-10, 10, -10], rotateZ: [-2, 2, -2] }}
                      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                      className="relative w-full h-full rounded-[2.5rem] bg-white/5 border border-white/20 backdrop-blur-2xl flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-theme-primary mix-blend-overlay opacity-40 mood-pulse" />
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                        className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-50 blur-md"
                      />
                      <Sparkles size={48} className="text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.9)] relative z-10" />
                    </motion.div>
                  </div>
                  <h1 className="text-5xl font-extrabold mb-4 tracking-tight text-glow bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                    {firstName ? `Welcome back, ${firstName}.` : "Neural State Initialization"}
                  </h1>
                  <p className="text-theme-secondary max-w-md mx-auto leading-relaxed text-sm font-medium tracking-wide">
                    {userProfile
                      ? `Cortex is tuned to your ${userProfile.vibe} vibe. Share what's on your mind.`
                      : "Establish connection with the neural matrix. Speak your thoughts and let the pattern recognition analyze your sub-states."}
                  </p>

                  <div className="grid grid-cols-2 gap-4 mt-12 w-full max-w-2xl">
                    {getPersonalizedSuggestions().map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => handleSendMessage(suggestion)}
                        className="p-5 rounded-[1.5rem] bg-white/5 border border-white/10 text-sm font-medium text-[var(--text-primary)] hover:border-theme-primary hover:bg-white/10 transition-all duration-300 text-left backdrop-blur-md group hover:shadow-theme relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-theme-primary opacity-0 group-hover:opacity-10 transition-opacity" />
                        <span className="relative z-10">{suggestion}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              ) : (
                currentSession.messages.map((msg) => (
                  <MessageItem
                    key={msg.id}
                    message={msg}
                    velocity={smoothVelocity}
                    onFeedback={(reward) => {
                      fetch(`${API_BASE_URL}/feedback`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ state: msg.state, action: msg.action, reward })
                      });
                    }}
                  />
                ))
              )}
            </AnimatePresence>

            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 text-theme-secondary text-[12px] font-medium ml-14 mt-2"
              >
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-theme-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 bg-theme-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 bg-theme-primary rounded-full animate-bounce" />
                </div>
                Analyzing emotions...
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-auto mt-6 px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[12px] font-medium flex items-center gap-2 backdrop-blur-md"
              >
                <X size={14} />
                {error}
              </motion.div>
            )}
          </div>
        </div>

        <div className="shrink-0 pt-4 pb-2">
          <div className="max-w-3xl mx-auto relative">
            <ChatInput
              onSendMessage={handleSendMessage}
              disabled={isLoading}
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
              isQuotaExhausted={usage.remaining === 0}
            />
            <p className="text-center text-[10px] text-theme-secondary mt-4 font-medium uppercase tracking-[0.2em] opacity-50">
              AI Powered Emotional Intelligence Engine
            </p>
          </div>
        </div>

      </main>
    </div>
  );
}

export default function App() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    // Immediately check localStorage so we never get stuck
    const saved = localStorage.getItem("cortex_user_profile");
    return saved ? JSON.parse(saved) : null;
  });
  const [oauthUser, setOauthUser] = useState<any>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(() => {
    // If we already have a local profile, skip the loading screen entirely
    return !localStorage.getItem("cortex_user_profile");
  });

  useEffect(() => {
    // Try backend auth with a timeout so we never hang
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    fetch(`${API_BASE_URL}/auth/me`, { signal: controller.signal, credentials: "include" })
      .then(res => {
        if (res.ok) return res.json();
        return null;
      })
      .then(data => {
        if (data && data.name) {
          setOauthUser(data);
          if (data.vibe && data.emotional_baseline) {
            const profile = {
              name: data.name,
              vibe: data.vibe,
              emotionalBaseline: data.emotional_baseline
            };
            localStorage.setItem("cortex_user_profile", JSON.stringify(profile));
            setUserProfile(profile);
          }
        }
      })
      .catch(() => {
        // Backend unreachable — that's fine, continue with guest flow
      })
      .finally(() => {
        clearTimeout(timeout);
        setIsCheckingAuth(false);
      });
  }, []);

  const handleProfileComplete = async (profile: UserProfile) => {
    localStorage.setItem("cortex_user_profile", JSON.stringify(profile));
    setUserProfile(profile);

    try {
      await fetch(`${API_BASE_URL}/auth/update_profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: profile.name,
          vibe: profile.vibe,
          emotional_baseline: profile.emotionalBaseline
        }),
      });
    } catch (err) {
      console.error("Failed to sync profile to backend", err);
    }
  };

  const handleResetApp = async () => {
    localStorage.removeItem("cortex_user_profile");
    localStorage.removeItem("chat_sessions");
    setUserProfile(null);
    setOauthUser(null);
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, { credentials: "include" });
    } catch (err) { }
    window.location.reload();
  };

  if (isCheckingAuth) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#020203]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl border-2 border-white/10 border-t-white/80 animate-spin" />
          <p className="text-[10px] font-black tracking-[0.3em] uppercase text-white/40">Syncing Neural Core</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    // If logged in via OAuth but profile incomplete, skip to step 2 (Vibe)
    const initialStep = oauthUser ? 2 : 0;
    const initialName = oauthUser?.name || "";

    return (
      <LoginPage
        onComplete={handleProfileComplete}
        initialStep={initialStep}
        initialName={initialName}
      />
    );
  }

  return <MainApp userProfile={userProfile} oauthUser={oauthUser} onResetApp={handleResetApp} />;
}