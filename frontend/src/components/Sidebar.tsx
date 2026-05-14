import React, { useState, useMemo } from "react";
import {
  LayoutGrid,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Search,
  PieChart,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  Brain,
  Zap
} from "lucide-react";
import { motion } from "motion/react";

interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
}

interface SidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onRenameChat: (id: string, newTitle: string) => void;
  onDeleteChat: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  knowledge: { topic: string, value: string }[];
  personality: any;
  onOpenSettings: () => void;
}

export default function Sidebar({
  sessions,
  currentSessionId,
  onNewChat,
  onSelectChat,
  onRenameChat,
  onDeleteChat,
  isOpen,
  onClose,
  isCollapsed,
  onToggleCollapse,
  knowledge,
  personality,
  onOpenSettings,
}: SidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempTitle, setTempTitle] = useState("");
  const [search, setSearch] = useState("");

  const filteredSessions = useMemo(() => {
    return sessions.filter((chat) =>
      chat.title.toLowerCase().includes(search.toLowerCase())
    );
  }, [sessions, search]);

  const startEditing = (id: string, title: string) => {
    setEditingId(id);
    setTempTitle(title);
  };

  const saveEdit = () => {
    if (editingId && tempTitle.trim()) {
      onRenameChat(editingId, tempTitle.trim());
    }
    setEditingId(null);
  };

  const cancelEdit = () => setEditingId(null);

  const handleDelete = (id: string) => {
    if (window.confirm("Delete this chat?")) {
      onDeleteChat(id);
    }
  };

  return (
    <div className="flex h-screen py-4 pl-4 z-50">
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
        relative h-full glass-sidebar rounded-[2rem] flex flex-col group/sidebar
        transform transition-all duration-500 ease-in-out
        ${isOpen ? "fixed z-50 translate-x-0 shadow-2xl w-72" : "hidden lg:flex"}
        ${isCollapsed && !isOpen ? "w-20" : "w-72"}
      `}
      >
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onToggleCollapse}
          className="hidden lg:flex absolute -right-5 top-24 w-10 h-10 rounded-full glass-card items-center justify-center text-theme-secondary hover:text-theme-primary hover:border-theme-primary transition-colors shadow-[0_10px_30px_rgba(0,0,0,0.8)] z-50 group"
        >
          {isCollapsed ? <ChevronRight size={20} className="group-hover:drop-shadow-[0_0_8px_var(--primary-glow)]" /> : <ChevronLeft size={20} className="group-hover:drop-shadow-[0_0_8px_var(--primary-glow)]" />}
        </motion.button>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3 font-bold text-xl tracking-tight text-[var(--text-primary)]">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex-shrink-0 flex items-center justify-center shadow-theme text-theme-primary">
              <LayoutGrid size={20} />
            </div>
            {!isCollapsed && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-display tracking-wider">CORTEX</motion.span>}
          </div>
          <button className="lg:hidden text-theme-secondary hover:text-[var(--text-primary)]" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className={`px-5 mb-6 transition-all ${isCollapsed ? "px-2" : ""}`}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className={`relative w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-theme-primary text-[#000] font-extrabold transition-all shadow-theme overflow-hidden group ${isCollapsed ? "px-0" : "text-[13px]"}`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
            <Plus size={18} className="relative z-10" />
            {!isCollapsed && <span className="uppercase tracking-widest text-[11px] relative z-10">New Session</span>}
          </motion.button>
        </div>
        {!isCollapsed && (
          <div className="px-5 mb-4">
            <div className="relative group">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-theme-secondary group-focus-within:text-theme-primary transition-colors"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search matrices..."
                className="w-full pl-10 pr-4 py-3 text-xs tracking-wide rounded-xl bg-white/5 border border-transparent focus:bg-white/10 focus:border-theme-primary/50 outline-none transition-all placeholder:text-white/30 text-[var(--text-primary)]"
              />
            </div>
          </div>
        )}

        <div className={`px-6 mb-2 flex items-center gap-2 text-[10px] font-bold text-theme-secondary uppercase tracking-[0.2em] ${isCollapsed ? "justify-center px-0" : ""}`}>
          <History size={12} />
          {!isCollapsed && <span>Neural Logs</span>}
        </div>
        <div className="flex-grow overflow-y-auto px-3 space-y-1 custom-scrollbar">
          {filteredSessions.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-xs text-theme-secondary italic opacity-50">Memory banks empty</p>
            </div>
          ) : (
            filteredSessions.map((chat) => {
              const isActive = chat.id === currentSessionId;
              const isEditing = editingId === chat.id;

              return (
                <div
                  key={chat.id}
                  className={`group relative flex items-center gap-3 px-4 py-3.5 rounded-2xl cursor-pointer transition-all duration-300 ${isActive
                    ? "bg-white/10 shadow-lg border border-white/10 text-theme-primary scale-[1.02]"
                    : "text-theme-secondary hover:bg-white/5 hover:text-[var(--text-primary)]"
                    } ${isCollapsed ? "justify-center px-0 mx-2" : "justify-between"}`}
                  onClick={() => {
                    if (!isEditing) {
                      onSelectChat(chat.id);
                      onClose();
                    }
                  }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-pill"
                      className="absolute left-0 w-1 h-6 bg-theme-primary rounded-r-full shadow-theme"
                    />
                  )}

                  {isEditing ? (
                    <div className="flex items-center gap-2 w-full">
                      <input
                        value={tempTitle}
                        autoFocus
                        onChange={(e) => setTempTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit();
                          if (e.key === "Escape") cancelEdit();
                        }}
                        className="text-sm bg-transparent outline-none flex-1 font-medium text-[var(--text-primary)]"
                      />
                      <button onClick={saveEdit} className="text-emerald-400"><Check size={16} /></button>
                    </div>
                  ) : (
                    <>
                      <div className={`flex items-center gap-3 flex-1 overflow-hidden`}>
                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isActive ? 'bg-theme-primary shadow-theme' : 'bg-white/20'}`} />
                        {!isCollapsed && (
                          <span className="text-sm font-medium truncate">
                            {chat.title || "Untitled Sequence"}
                          </span>
                        )}
                      </div>

                      {!isCollapsed && (
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            className="p-1 hover:bg-white/10 rounded-md text-theme-secondary hover:text-[var(--text-primary)] transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditing(chat.id, chat.title);
                            }}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            className="p-1 hover:bg-rose-500/20 rounded-md text-theme-secondary hover:text-rose-400 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(chat.id);
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>
        
        {!isCollapsed && knowledge.length > 0 && (
          <div className="px-5 mb-6">
            <div className="flex items-center gap-2 mb-3 text-[10px] font-bold text-theme-secondary uppercase tracking-[0.2em] px-1">
              <Brain size={12} className="text-theme-primary" />
              <span>Neural Archive</span>
            </div>
            <div className="space-y-2">
              {knowledge.slice(0, 3).map((insight, idx) => (
                <div key={idx} className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-[11px] group/insight relative overflow-hidden">
                   <div className="absolute left-0 top-0 w-0.5 h-full bg-theme-primary opacity-40" />
                   <span className="text-theme-secondary font-bold uppercase text-[9px] block mb-0.5">{insight.topic}</span>
                   <span className="text-[var(--text-primary)] opacity-90 truncate block">{insight.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className={`p-5 mt-auto border-t border-white/5 transition-all ${isCollapsed ? "p-2" : ""}`}>
          {!isCollapsed ? (
            <>
              <div className="bg-white/5 backdrop-blur-xl rounded-[1.5rem] p-5 border border-white/10 shadow-lg relative overflow-hidden group">
                <div className="absolute inset-0 bg-theme-primary opacity-0 group-hover:opacity-5 transition-opacity" />
                <div className="flex items-center gap-2 mb-4 text-[9px] font-extrabold text-theme-secondary uppercase tracking-[0.2em]">
                  <Zap size={14} className="text-theme-primary" />
                  Personality Resonance
                </div>
                <div className="space-y-4 relative z-10">
                  {[
                    { label: "Empathy", val: personality?.empathy || 0.5 },
                    { label: "Conciseness", val: personality?.conciseness || 0.5 },
                    { label: "Complexity", val: personality?.complexity || 0.5 }
                  ].map((dial) => (
                    <div key={dial.label} className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-theme-secondary font-medium">{dial.label}</span>
                        <span className="font-bold text-theme-primary">{Math.round(dial.val * 100)}%</span>
                      </div>
                      <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-theme-primary transition-all duration-1000 ease-out" 
                          style={{ width: `${dial.val * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between px-2">
                <button
                  onClick={onOpenSettings}
                  className="text-theme-secondary hover:text-theme-primary hover:rotate-90 transition-all duration-300"
                >
                  <Settings size={18} />
                </button>
                <span className="text-[9px] text-theme-secondary font-bold tracking-[0.15em] opacity-40">CORTEX v3.1</span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-4 py-2">
              <button onClick={onOpenSettings} className="text-theme-secondary hover:text-theme-primary transition-colors">
                <Settings size={20} />
              </button>
              <div className="w-1.5 h-1.5 rounded-full bg-theme-primary animate-pulse shadow-theme" />
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}