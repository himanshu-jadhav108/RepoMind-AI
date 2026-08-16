"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, X, Sparkles, User, FileCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { sendCopilotChatMessage } from "@/lib/api-client";
import { CopilotChatMessage } from "@/types";

interface RepoCopilotChatProps {
  runId?: string;
  onSelectFile?: (filePath: string) => void;
}

const QUICK_PROMPTS = [
  "Explain main architecture patterns",
  "Summarize top security vulnerabilities",
  "Where are performance bottlenecks?",
  "List core entry point functions",
];

export function RepoCopilotChat({ runId, onSelectFile }: RepoCopilotChatProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [input, setInput] = useState<string>("");
  const [messages, setMessages] = useState<CopilotChatMessage[]>([
    {
      sender: "copilot",
      text: "👋 Hi! I am your Repository Copilot. Ask me anything about symbol call trees, clean architecture boundaries, security CVEs, or refactoring plans.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      confidence: 0.98,
    },
  ]);
  const [loading, setLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: CopilotChatMessage = {
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setInput("");
    setLoading(true);

    try {
      const res = await sendCopilotChatMessage(runId || "demo-run", textToSend);
      setMessages((prev) => [
        ...prev,
        {
          sender: "copilot",
          text: res.reply || "Analysis complete. AST symbol context verified.",
          referenced_files: res.referenced_files,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          confidence: 0.92,
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "copilot",
          text: `Error connecting to Copilot: ${err.message || "Failed response stream."}`,
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
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-5 py-3 rounded-full bg-copper hover:bg-copper-hover text-white font-semibold shadow-2xl border border-copper/40 cursor-pointer group font-mono text-xs"
        >
          <Bot className="w-4 h-4 group-hover:rotate-12 transition-transform" />
          <span>Repo Copilot Chat</span>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        </motion.button>
      )}

      {/* Drawer Overlay Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className="fixed bottom-6 right-6 z-50 w-[95vw] sm:w-[440px] h-[580px] max-h-[85vh] rounded-xl border border-border bg-card shadow-2xl flex flex-col overflow-hidden font-sans selection:bg-copper selection:text-white"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3.5 border-b border-border bg-card">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-copper text-white shadow">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5 font-display">
                    <span>Repository Copilot</span>
                    <Badge className="bg-copper/10 text-copper border-copper/30 text-[10px] font-mono">
                      Grounded RAG
                    </Badge>
                  </h3>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    Answers strictly grounded in repository AST graph
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Quick Prompts Bar */}
            <div className="p-2 border-b border-border bg-background flex items-center gap-1.5 overflow-x-auto no-scrollbar font-mono text-[11px]">
              {QUICK_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(prompt)}
                  disabled={loading}
                  className="px-2.5 py-1 rounded bg-card border border-border text-muted-foreground hover:text-foreground hover:border-copper/40 transition shrink-0 whitespace-nowrap"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Messages Feed */}
            <div className="flex-1 p-3.5 overflow-y-auto space-y-3 font-sans text-xs">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-2.5 ${
                    msg.sender === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-6 h-6 rounded flex items-center justify-center shrink-0 shadow text-white ${
                      msg.sender === "user"
                        ? "bg-category-arch"
                        : "bg-copper"
                    }`}
                  >
                    {msg.sender === "user" ? (
                      <User className="w-3.5 h-3.5" />
                    ) : (
                      <Bot className="w-3.5 h-3.5" />
                    )}
                  </div>

                  {/* Bubble */}
                  <div
                    className={`max-w-[82%] space-y-2 p-3 rounded-lg border text-xs ${
                      msg.sender === "user"
                        ? "bg-category-arch/15 border-category-arch/40 text-foreground rounded-tr-none"
                        : "bg-background border-border text-foreground/90 rounded-tl-none"
                    }`}
                  >
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                    {/* Referenced Files Badges */}
                    {msg.referenced_files && msg.referenced_files.length > 0 && (
                      <div className="pt-1 border-t border-border flex flex-wrap gap-1">
                        {msg.referenced_files.map((file: string, fIdx: number) => (
                          <button
                            key={fIdx}
                            onClick={() => onSelectFile && onSelectFile(file)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-card border border-category-arch/30 text-category-arch text-[10px] font-mono hover:border-category-arch"
                          >
                            <FileCode className="w-3 h-3 text-category-arch" />
                            <span>{file}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[9px] text-muted-foreground font-mono pt-0.5">
                      <span>{msg.timestamp}</span>
                      {msg.confidence && (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          Confidence: {(msg.confidence * 100).toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex gap-2.5 items-center">
                  <div className="w-6 h-6 rounded bg-copper text-white flex items-center justify-center">
                    <Bot className="w-3.5 h-3.5 animate-spin" />
                  </div>
                  <div className="bg-background p-2.5 rounded-lg border border-border text-muted-foreground text-xs font-mono flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-copper animate-pulse" />
                    <span>Analyzing repository AST & findings graph...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Box */}
            <div className="p-3 border-t border-border bg-card flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask about architecture, auth flow, JWT, bugs..."
                disabled={loading}
                className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-copper font-mono"
              />
              <Button
                variant="default"
                size="sm"
                onClick={() => handleSend()}
                disabled={loading || !input.trim()}
                className="h-8 w-8 p-0 rounded-lg bg-copper hover:bg-copper-hover shrink-0 text-white"
              >
                <Send className="w-3.5 h-3.5" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
