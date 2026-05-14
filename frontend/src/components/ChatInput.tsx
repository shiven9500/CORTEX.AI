import React, { useState, useRef, useEffect } from "react";
import { Send, Search, Sparkles, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  disabled?: boolean;
  selectedModel: "cortex-pro" | "neural-lite";
  onModelChange: (model: "cortex-pro" | "neural-lite") => void;
  isQuotaExhausted: boolean;
}

export default function ChatInput({ onSendMessage, disabled, selectedModel, onModelChange, isQuotaExhausted }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [showLimitWarning, setShowLimitWarning] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();

    const trimmed = input.trim();
    if (!trimmed || disabled) return;

    onSendMessage(trimmed);
    setInput("");

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  return (
    <div className="w-full max-w-3xl mx-auto mb-4 group">
      <form
        onSubmit={handleSubmit}
        className="bg-glass-input !backdrop-blur-2xl rounded-[2.5rem] shadow-2xl focus-within:shadow-theme focus-within:border-theme-primary transition-all duration-500 overflow-hidden"
      >
        <div className="flex items-end gap-3 p-4">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe how you're feeling..."
            disabled={disabled}
            className="flex-grow resize-none bg-transparent border-none focus:ring-0 text-[15px] max-h-40 overflow-y-auto placeholder-white/30 py-3 px-2 text-[var(--text-primary)] outline-none"
          />

          <button
            type="submit"
            disabled={!input.trim() || disabled}
            className={`p-3.5 rounded-full transition-all duration-300 shadow-lg ${input.trim() && !disabled
              ? "bg-theme-primary text-white bg-theme-hover hover:scale-110 active:scale-95 shadow-theme"
              : "bg-white/5 text-white/30 cursor-not-allowed"
              }`}
          >
            <Send size={20} />
          </button>
        </div>

        <div className="flex items-center justify-between px-6 pb-4">
          <div className="flex gap-4">
            <button
               type="button"
               className="flex items-center gap-1.5 text-theme-secondary hover:text-theme-primary transition-colors text-[10px] font-bold uppercase tracking-wider"
            >
              <Search size={14} />
              Patterns
            </button>
            <button
               type="button"
               className="flex items-center gap-1.5 text-theme-secondary hover:text-theme-primary transition-colors text-[10px] font-bold uppercase tracking-wider"
            >
              <Sparkles size={14} />
              Insights
            </button>
          </div>
          <div className="flex items-center gap-2 relative">


            <button
              type="button"
              onClick={() => {
                onModelChange(selectedModel === "cortex-pro" ? "neural-lite" : "cortex-pro");
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300 ${selectedModel === "cortex-pro"
                  ? "bg-theme-light border-theme-primary text-theme-primary shadow-sm"
                  : "bg-white/5 border-white/10 text-[var(--text-secondary)]"
                }`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${selectedModel === "cortex-pro" ? 'bg-theme-primary shadow-theme' : 'bg-white/30'}`} />
              <span className="text-[9px] font-bold uppercase tracking-[0.15em]">
                {selectedModel === "cortex-pro" ? "Cortex Pro (Groq)" : "Neural Lite v1.5"}
              </span>
            </button>
          </div>
        </div>
      </form>

      <p className="text-center text-[11px] text-theme-secondary mt-3 opacity-50">
        Press Enter to send • Shift + Enter for new line
      </p>
    </div>
  );
}