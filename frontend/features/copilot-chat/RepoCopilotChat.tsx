"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Send,
  Bot,
  User,
  Sparkles,
  FileCode,
  X,
  Maximize2,
  Minimize2,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CopilotChatMessage } from "@/types";
import { sendCopilotChatMessage } from "@/lib/api-client";

interface RepoCopilotChatProps {
  runId: string;
  onSelectFile?: (file: string) => void;
}

const QUICK_PROMPTS = [
  "Why is this architecture poor?",
  "Which file should I refactor first?",
  "Explain authentication flow.",
  "Where is JWT implemented?",
  "Which modules have highest complexity?",
  "How can I improve performance?",
];

export function RepoCopilotChat({ runId, onSelectFile }: RepoCopilotChatProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<CopilotChatMessage[]>([
    {
      sender: "copilot",
      text: `Hello! I am your Senior Repository Copilot. I have analyzed all multi-agent findings, AST symbol dependencies, and health metrics for run \`${runId}\`. Ask me anything about the codebase!`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      confidence: 1.0,
      referenced_files: ["backend/app/main.py", "backend/app/orchestration/graph.py"],
    },
  ]);
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input.trim();
    if (!query || loading) return;

    const userMsg: CopilotChatMessage = {
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setLoading(true);

    try {
      const res = await sendCopilotChatMessage(runId, query);
      const copilotMsg: CopilotChatMessage = {
        sender: "copilot",
        text: res.reply || "Analysis query complete.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        referenced_files: res.referenced_files || [],
        confidence: res.confidence || 0.94,
      };
      setMessages((prev) => [...prev, copilotMsg]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "copilot",
          text: "I encountered an error querying the analysis engine. Please try again.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-5 py-3.5 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 text-white font-semibold shadow-2xl shadow-purple-600/50 border border-purple-400/40 cursor-pointer group"
        >
          <Bot className="w-5 h-5 group-hover:rotate-12 transition-transform" />
          <span className="font-mono text-sm tracking-tight">Repo Copilot Chat</span>
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
        </motion.button>
      )}

      {/* Drawer Overlay Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-6 right-6 z-50 w-[95vw] sm:w-[450px] h-[600px] max-h-[85vh] rounded-2xl border border-slate-800 bg-slate-950/95 shadow-2xl backdrop-blur-2xl flex flex-col overflow-hidden selection:bg-purple-500 selection:text-white"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/80">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-600 text-white shadow-lg shadow-purple-600/30">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                    <span>Repository Copilot</span>
                    <Badge className="bg-purple-950/80 text-purple-300 border-purple-500/40 text-[10px] font-mono">
                      Grounded Mode
                    </Badge>
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Answers strictly from repo analysis & AST graph
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 p-0 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Quick Prompts Bar */}
            <div className="p-2.5 border-b border-slate-800/80 bg-slate-900/40 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {QUICK_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(prompt)}
                  disabled={loading}
                  className="px-2.5 py-1 rounded-full bg-slate-900 border border-purple-500/30 text-purple-300 text-[11px] font-mono whitespace-nowrap hover:bg-purple-950/60 hover:text-white transition shrink-0"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Messages Feed */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 font-sans text-xs">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-2.5 ${
                    msg.sender === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-md ${
                      msg.sender === "user"
                        ? "bg-indigo-600 text-white"
                        : "bg-purple-600 text-white"
                    }`}
                  >
                    {msg.sender === "user" ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Bot className="w-4 h-4" />
                    )}
                  </div>

                  {/* Bubble */}
                  <div
                    className={`max-w-[82%] space-y-2 p-3 rounded-xl border shadow-lg ${
                      msg.sender === "user"
                        ? "bg-indigo-950/80 border-indigo-500/40 text-indigo-100 rounded-tr-none"
                        : "bg-slate-900/90 border-slate-800 text-slate-200 rounded-tl-none"
                    }`}
                  >
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                    {/* Referenced Files Badges */}
                    {msg.referenced_files && msg.referenced_files.length > 0 && (
                      <div className="pt-1 border-t border-slate-800/80 flex flex-wrap gap-1">
                        {msg.referenced_files.map((file, fIdx) => (
                          <button
                            key={fIdx}
                            onClick={() => onSelectFile && onSelectFile(file)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-950/80 border border-purple-500/30 text-purple-300 text-[10px] font-mono hover:bg-purple-900/80"
                          >
                            <FileCode className="w-3 h-3 text-purple-400" />
                            <span>{file}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono pt-0.5">
                      <span>{msg.timestamp}</span>
                      {msg.confidence && (
                        <span className="text-emerald-400 font-semibold">
                          Confidence: {(msg.confidence * 100).toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex gap-2.5 items-center">
                  <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center">
                    <Bot className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-slate-400 text-xs font-mono flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                    <span>Analyzing repository AST & findings graph...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Box */}
            <div className="p-3 border-t border-slate-800 bg-slate-900/80 flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask about architecture, auth flow, JWT, bugs..."
                disabled={loading}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/60 font-sans"
              />
              <Button
                variant="gradient"
                size="sm"
                onClick={() => handleSend()}
                disabled={loading || !input.trim()}
                className="h-9 w-9 p-0 rounded-xl bg-purple-600 hover:bg-purple-500 shrink-0"
              >
                <Send className="w-4 h-4 text-white" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
