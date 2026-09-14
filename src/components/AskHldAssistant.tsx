'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  MessageSquare,
  Sparkles,
  X,
  Send,
  ExternalLink,
  Bot,
  User,
  AlertCircle,
  ChevronRight,
  BookOpen,
  Shield,
  Table,
  Workflow,
  RotateCcw,
  FileCode,
  Layers,
  CheckCircle2,
  GitBranch,
} from 'lucide-react';
import { TOKENS } from '@/styles/tokens';

interface Citation {
  sectionNumber: string;
  title: string;
  heading?: string;
  link: string;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  citations?: Citation[];
  suggestedNextQuestions?: string[];
  timestamp: string;
}

interface StarterQuestion {
  question: string;
  category: 'business' | 'variables' | 'process';
  icon: React.ComponentType<{ className?: string }>;
}

export default function AskHldAssistant() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [showStarterGrid, setShowStarterGrid] = useState(true);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Record<string, boolean>>({});
  const [visibleSuggestions, setVisibleSuggestions] = useState<Record<string, boolean>>({});

  const [messages, setMessages] = useState<Message[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, visibleSuggestions, showStarterGrid, loading]);

  // Tab Guard: Render on all main app pages except login
  if (pathname === '/login') {
    return null;
  }

  // Exact 10 Starter Questions with Category Icons
  const starterQuestions: StarterQuestion[] = [
    {
      question: 'What is CAIS and why does HSBC report to it?',
      category: 'business',
      icon: BookOpen,
    },
    {
      question: 'Who are the three UK credit reference agencies?',
      category: 'business',
      icon: Shield,
    },
    {
      question: 'What does the CU (Central Utility) Team own in this process?',
      category: 'process',
      icon: Workflow,
    },
    {
      question: 'Why is HSBC Harvey Nichols not currently reporting to the bureaus?',
      category: 'business',
      icon: BookOpen,
    },
    {
      question: 'What is the Standing Exclusion Rule that applies to all brands?',
      category: 'variables',
      icon: Table,
    },
    {
      question: 'Which six CAIS variables are calculated by the CU Team?',
      category: 'variables',
      icon: FileCode,
    },
    {
      question: 'How does the 71-month default reporting rule work?',
      category: 'variables',
      icon: Layers,
    },
    {
      question: "What's different between HSBC Retail and First Direct Retail eligibility criteria?",
      category: 'variables',
      icon: Table,
    },
    {
      question: 'Who gives final sign-off before a file is transmitted to the bureaus?',
      category: 'process',
      icon: CheckCircle2,
    },
    {
      question: 'What happens if Business Rules Validation finds an unusual data variation?',
      category: 'process',
      icon: GitBranch,
    },
  ];

  const handleDismissSuggestions = (msgId: string) => {
    setDismissedSuggestions((prev) => ({ ...prev, [msgId]: true }));
  };

  const handleResetToStarters = () => {
    setShowStarterGrid(true);
    setMessages([]);
  };

  const handleSend = async (qText?: string) => {
    const textToSend = qText || query;
    if (!textToSend.trim() || loading) return;

    setShowStarterGrid(false);

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!qText) setQuery('');
    setLoading(true);

    try {
      const res = await fetch('/api/ask-hld', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: textToSend }),
      });

      const data = await res.json();
      const botMsgId = `bot-${Date.now()}`;

      // Simulate a brief thinking transition before answer appears (~450ms)
      await new Promise((resolve) => setTimeout(resolve, 450));

      const botMsg: Message = {
        id: botMsgId,
        sender: 'assistant',
        text: data.answer || "I couldn't find anything in the document that answers this — you may want to check with the CU Team directly.",
        citations: data.citations || [],
        suggestedNextQuestions: data.suggestedNextQuestions || [
          'What is CAIS and why does HSBC report to it?',
          'Which six CAIS variables are calculated by the CU Team?',
          'What is the Standing Exclusion Rule that applies to all brands?',
          'How does the 71-month default reporting rule work?',
        ],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
      setLoading(false);

      // Sequenced timing: Answer & citations render FIRST; 350ms later, follow-up chips slide in below
      setTimeout(() => {
        setVisibleSuggestions((prev) => ({ ...prev, [botMsgId]: true }));
        scrollToBottom();
      }, 350);
    } catch (err) {
      const botMsgId = `bot-${Date.now()}`;
      await new Promise((resolve) => setTimeout(resolve, 300));

      const errorMsg: Message = {
        id: botMsgId,
        sender: 'assistant',
        text: "I couldn't find anything in the document that answers this — you may want to check with the CU Team directly.",
        citations: [],
        suggestedNextQuestions: [
          'What is CAIS and why does HSBC report to it?',
          'Which six CAIS variables are calculated by the CU Team?',
          'What is the Standing Exclusion Rule that applies to all brands?',
        ],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
      setLoading(false);

      setTimeout(() => {
        setVisibleSuggestions((prev) => ({ ...prev, [botMsgId]: true }));
        scrollToBottom();
      }, 350);
    }
  };

  const handleCitationClick = (link: string) => {
    setIsOpen(false);
    if (window.location.pathname === '/document') {
      const targetId = link.replace('/document#', '');
      const elem = document.getElementById(targetId);
      if (elem) {
        elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }
    router.push(link);
  };

  return (
    <>
      {/* Floating Action Button (FAB): Positioned in bottom corner with high z-index */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-50 px-4 py-3 rounded-full bg-gradient-to-r from-[#C0272D] to-rose-700 hover:from-[#a01f24] hover:to-rose-800 text-white font-bold text-xs shadow-2xl border border-red-500/40 flex items-center gap-2.5 transition-all transform hover:scale-105 group cursor-pointer"
          title="Open Ask the HLD Q&A Assistant"
        >
          <div className="p-1 rounded-full bg-white/20 group-hover:rotate-12 transition-transform">
            <Sparkles className="w-4 h-4 text-amber-300" />
          </div>
          <span className="tracking-wide">Ask the HLD</span>
        </button>
      )}

      {/* Slide-In Chat Panel */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[500px] bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 font-sans text-white">
          {/* Header */}
          <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#C0272D] flex items-center justify-center text-white shadow-md border border-red-400/30">
                <Sparkles className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                  Ask the HLD <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                </h2>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Ask anything about the CAIS reporting process — I'll answer from the document and show you exactly where to read more.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              title="Close panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Content Area: Starter Cards Grid OR Active Chat Thread */}
          <div className="flex-1 overflow-y-auto p-4 bg-slate-900/90 space-y-4">
            {showStarterGrid || messages.length === 0 ? (
              /* OPENING STATE: 10 STARTER CARDS GRID */
              <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Curated Starter Topics (10)
                  </span>
                  <span className="text-[10px] text-slate-500">Click any topic to start</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {starterQuestions.map((sq, idx) => {
                    const IconComp = sq.icon;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSend(sq.question)}
                        disabled={loading}
                        className={`group p-3 rounded-xl border text-left transition-all transform hover:-translate-y-0.5 shadow-xs flex flex-col justify-between gap-2.5 cursor-pointer text-xs ${
                          sq.category === 'business'
                            ? 'bg-slate-800/80 hover:bg-[#C0272D]/20 border-slate-700/80 hover:border-red-500/40 text-slate-200 hover:text-white'
                            : sq.category === 'variables'
                            ? 'bg-slate-800/80 hover:bg-indigo-950/40 border-slate-700/80 hover:border-indigo-500/40 text-slate-200 hover:text-white'
                            : 'bg-slate-800/80 hover:bg-emerald-950/40 border-slate-700/80 hover:border-emerald-500/40 text-slate-200 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div
                            className={`p-1.5 rounded-lg shrink-0 ${
                              sq.category === 'business'
                                ? 'bg-red-500/10 text-red-400 group-hover:bg-[#C0272D] group-hover:text-white'
                                : sq.category === 'variables'
                                ? 'bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white'
                                : 'bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white'
                            } transition-colors`}
                          >
                            <IconComp className="w-3.5 h-3.5" />
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-slate-400" />
                        </div>
                        <span className="font-semibold leading-snug line-clamp-3 text-[11px]">
                          {sq.question}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* CHAT THREAD VIEW */
              <div className="space-y-4">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                  >
                    {m.sender === 'assistant' && (
                      <div className="w-7 h-7 rounded-lg bg-[#C0272D] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}

                    <div
                      className={`max-w-[88%] rounded-2xl p-3.5 text-xs space-y-3 ${
                        m.sender === 'user'
                          ? 'bg-[#C0272D] text-white rounded-br-none shadow-md font-semibold'
                          : 'bg-slate-800/90 text-slate-200 border border-slate-700/80 rounded-bl-none shadow-sm'
                      }`}
                    >
                      <p className="leading-relaxed font-sans">{m.text}</p>

                      {/* CITATION CHIPS (Blue/Amber Pill with Document Icon) */}
                      {m.citations && m.citations.length > 0 && (
                        <div className="pt-2 border-t border-slate-700/60 space-y-1.5">
                          <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1">
                            <BookOpen className="w-3 h-3 text-amber-400" /> Grounded Citations:
                          </span>
                          <div className="flex flex-col gap-1">
                            {m.citations.map((c, cIdx) => (
                              <button
                                key={cIdx}
                                onClick={() => handleCitationClick(c.link)}
                                className="text-[11px] text-blue-300 hover:text-blue-100 bg-blue-950/60 hover:bg-blue-900/80 border border-blue-500/30 px-2.5 py-1.5 rounded-lg flex items-center justify-between text-left transition-all group cursor-pointer shadow-xs"
                              >
                                <span className="truncate flex-1 flex items-center gap-1.5">
                                  <BookOpen className="w-3 h-3 text-blue-400 shrink-0" />
                                  <span>{c.sectionNumber} — {c.title} {c.heading ? `→ ${c.heading}` : ''}</span>
                                </span>
                                <ExternalLink className="w-3 h-3 shrink-0 ml-1.5 opacity-70 group-hover:opacity-100" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* FOLLOW-UP SUGGESTION CHIPS ("You might also ask" with Sparkles Icon) */}
                      {m.sender === 'assistant' &&
                        m.suggestedNextQuestions &&
                        m.suggestedNextQuestions.length > 0 &&
                        visibleSuggestions[m.id] &&
                        !dismissedSuggestions[m.id] && (
                          <div className="pt-2 border-t border-slate-700/60 space-y-1.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] uppercase font-bold text-rose-300 tracking-wider flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-amber-400" /> You might also ask:
                              </span>
                              <button
                                type="button"
                                onClick={() => handleDismissSuggestions(m.id)}
                                className="text-[10px] text-slate-400 hover:text-slate-200 hover:underline flex items-center gap-1 transition-colors px-1 py-0.5 rounded cursor-pointer"
                                title="Dismiss suggested questions"
                              >
                                <X className="w-3 h-3 text-slate-400 hover:text-rose-400" />
                                <span>Skip</span>
                              </button>
                            </div>

                            <div className="flex flex-wrap gap-1.5">
                              {m.suggestedNextQuestions.map((sQ, sIdx) => (
                                <button
                                  key={sIdx}
                                  onClick={() => handleSend(sQ)}
                                  disabled={loading}
                                  className="text-[11px] text-rose-200 bg-rose-950/40 hover:bg-[#C0272D]/30 hover:text-white border border-rose-500/30 hover:border-red-400/60 px-2.5 py-1.5 rounded-full flex items-center gap-1.5 text-left transition-all transform hover:-translate-y-0.5 shadow-xs group cursor-pointer disabled:opacity-50"
                                >
                                  <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                                  <span className="leading-tight">{sQ}</span>
                                  <ChevronRight className="w-3 h-3 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-transform" />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                      <div
                        className={`text-[9px] text-right font-mono ${
                          m.sender === 'user' ? 'text-red-200' : 'text-slate-500'
                        }`}
                      >
                        {m.timestamp}
                      </div>
                    </div>

                    {m.sender === 'user' && (
                      <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0 mt-0.5">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                ))}

                {/* ANIMATED THINKING STATE (3-Dot Pulse) */}
                {loading && (
                  <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-800/80 p-3.5 rounded-2xl w-max border border-slate-700/80 animate-in fade-in duration-200">
                    <div className="w-7 h-7 rounded-lg bg-[#C0272D] text-white flex items-center justify-center shrink-0 shadow-sm">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400 font-medium">Searching document & synthesizing answer</span>
                      <div className="flex gap-1 ml-1">
                        <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce duration-300" />
                        <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce duration-300 [animation-delay:0.15s]" />
                        <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce duration-300 [animation-delay:0.3s]" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input Form & Reset Control */}
          <div className="p-3 border-t border-slate-800 bg-slate-950 space-y-2 shrink-0">
            {/* Show Starter Topics Escape Hatch */}
            {!showStarterGrid && messages.length > 0 && (
              <div className="flex items-center justify-between px-1 text-[11px]">
                <button
                  type="button"
                  onClick={handleResetToStarters}
                  className="text-slate-400 hover:text-amber-300 text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Show starter topics</span>
                </button>
                <span className="text-[9px] text-slate-500 font-mono">10 Curated Topics Available</span>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask any custom question or click starter topic..."
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-red-500 placeholder-slate-500"
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="px-3.5 py-2 rounded-xl bg-[#C0272D] hover:bg-[#a01f24] disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1 transition-all shadow-md cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
