import React, { useState } from 'react';
import { motion, AnimatePresence, useTransform, useSpring } from 'motion/react';
import { ThumbsUp, ThumbsDown, User, Sparkles, ChevronDown, BarChart2, Copy, Check, AlertCircle } from 'lucide-react';
import NeuralPulse from './NeuralPulse';
import { Message } from '../types';

interface MessageItemProps {
  message: Message;
  onFeedback: (reward: number) => void;
  velocity?: any;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, onFeedback, velocity }) => {
  const isAi = message.sender === 'ai';
  const [feedbackSent, setFeedbackSent] = useState<number | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFeedback = (reward: number) => {
    if (feedbackSent !== null) return;
    setFeedbackSent(reward);
    onFeedback(reward);
  };

  // Liquid physics implementation
  const fallbackVelocity = useSpring(0);
  const activeVelocity = velocity || fallbackVelocity;
  const skew = useTransform(activeVelocity, [-1000, 1000], [1.5, -1.5]);
  const scaleY = useTransform(activeVelocity, [-1000, 0, 1000], [1.02, 1, 1.02]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ skewY: skew, scaleY }}
      className={`flex w-full mb-8 ${isAi ? 'justify-start' : 'justify-end'} origin-bottom`}
    >
      <div className={`flex max-w-[85%] ${isAi ? 'flex-row' : 'flex-row-reverse'}`}>
        <div className={`flex-shrink-0 ${isAi ? 'mr-4' : 'ml-4'}`}>
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-transform hover:scale-110 ${isAi
              ? `bg-transparent`
              : 'bg-white/10 text-[var(--text-primary)] border border-white/10 shadow-lg backdrop-blur-md'
            }`}>
            {isAi ? <NeuralPulse size="sm" color={message.analysis?.detected_emotion === 'happy' ? 'amber' : 'indigo'} /> : <User size={20} />}
          </div>
        </div>
        <div className={`flex flex-col ${isAi ? 'items-start' : 'items-end'}`}>
          <div
            className={`group relative px-6 py-4 rounded-[2rem] text-[15px] leading-relaxed transition-all duration-300 ${isAi
                ? 'bg-glass-ai-msg rounded-tl-none'
                : 'bg-glass-user-msg rounded-tr-none'
              }`}
          >
            {message.text}

            {isAi && (
              <button
                onClick={copyToClipboard}
                className="absolute -right-12 top-2 p-2 rounded-xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/20 text-theme-secondary hover:text-theme-primary shadow-sm border border-white/5 backdrop-blur-md"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            )}

            {message.isStreaming && (
              <motion.span
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="inline-block w-1.5 h-4 bg-theme-primary ml-1 align-middle rounded-full shadow-theme"
              />
            )}
          </div>
          {isAi && (
            <div className="mt-3 flex flex-col items-start w-full gap-2">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowAnalysis(!showAnalysis)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/5 text-theme-secondary text-[11px] font-medium hover:bg-white/10 transition-colors"
                >
                  <BarChart2 size={12} />
                  {showAnalysis ? 'Hide Analysis' : 'Show Analysis'}
                  <motion.div animate={{ rotate: showAnalysis ? 180 : 0 }}>
                    <ChevronDown size={12} />
                  </motion.div>
                </button>

                <div className="flex items-center gap-1 border-l pl-3 border-white/10">
                  <button
                    onClick={() => handleFeedback(1)}
                    disabled={feedbackSent !== null}
                    className={`p-1 rounded-md transition-all hover:scale-110 ${feedbackSent === 1 ? 'text-emerald-400 bg-emerald-500/10' : 'text-theme-secondary hover:text-emerald-400'
                      }`}
                  >
                    <ThumbsUp size={14} />
                  </button>
                  <button
                    onClick={() => handleFeedback(-1)}
                    disabled={feedbackSent !== null}
                    className={`p-1 rounded-md transition-all hover:scale-110 ${feedbackSent === -1 ? 'text-rose-400 bg-rose-500/10' : 'text-theme-secondary hover:text-rose-400'
                      }`}
                  >
                    <ThumbsDown size={14} />
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {showAnalysis && message.analysis && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden w-full"
                  >
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 mt-3 shadow-inner">
                      {message.analysis.quota_hit && (
                        <div className="mb-4 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2 text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                          <AlertCircle size={14} />
                          Gemini Free Tier Exhausted - Using Local Engine
                        </div>
                      )}
                      <h4 className="text-[10px] font-bold text-theme-secondary uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Sparkles size={12} className="text-theme-primary" />
                        Neural Analysis Metrics ({message.analysis.engine || 'Neural Core'})
                      </h4>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-theme-secondary text-[10px] font-semibold uppercase">Detected Emotion</span>
                            <span className="text-theme-primary font-bold text-[11px] capitalize">{message.analysis.detected_emotion}</span>
                          </div>
                          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: '85%' }}
                              className={`h-full bg-gradient-to-r bg-theme-primary`}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-theme-secondary text-[10px] font-semibold uppercase">AI Strategy</span>
                            <span className="text-theme-primary font-bold text-[11px] capitalize">{message.analysis.strategy}</span>
                          </div>
                          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: '70%' }}
                              className="h-full bg-theme-secondary"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col gap-1 px-3 py-2 bg-white/5 rounded-2xl border border-white/10">
                          <span className="text-theme-secondary font-bold uppercase tracking-wider text-[9px]">Cluster Group</span>
                          <span className="text-[var(--text-primary)] font-bold text-xs tracking-tight">Node #{message.analysis.cluster_group}</span>
                        </div>

                        <div className="flex flex-col gap-1 px-3 py-2 bg-white/5 rounded-2xl border border-white/10">
                          <span className="text-theme-secondary font-bold uppercase tracking-wider text-[9px]">User Intent</span>
                          <span className="text-[var(--text-primary)] font-bold text-xs capitalize">{message.analysis.user_intent}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default MessageItem;