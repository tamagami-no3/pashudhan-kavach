'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { MessageSquare, X, Send, Bot, User, Sparkles, RefreshCw, Activity, QrCode, Search, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface Message {
  id?: string;
  sender: 'user' | 'bot' | 'system';
  message: string;
  intent_matched?: string | null;
  created_at?: string;
  triage_result?: any;
  verified_animal?: any;
  search_result?: any;
}

export function ChatbotWindow() {
  const { user, language } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeMode, setActiveMode] = useState<'chat' | 'triage' | 'scanner' | 'search'>('chat');

  const [suggestions, setSuggestions] = useState<string[]>([
    'What are the symptoms of FMD?',
    'Verify tag #100011112222',
    'What is the NADCP scheme?',
    'How do I report a sick animal?',
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize or restore session
  const initSession = async () => {
    try {
      const res = await fetch('/api/chatbot/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: 'inapp' }),
      });
      const data = await res.json();
      if (data.success && data.data?.id) {
        setSessionId(data.data.id);
        const greetings = {
          en: `Hello ${user?.full_name ? user.full_name : ''}! I am your AI Veterinary Assistant. Select a mode or ask me about disease symptoms, tag verification (#100011112222), or government schemes!`,
          hi: `नमस्ते ${user?.full_name ? user.full_name : ''}! मैं आपका AI पशु चिकित्सा सहायक हूँ। रोग लक्षण, टैग जांच (#100011112222), या सरकारी योजनाओं के बारे में पूछें!`,
          mr: `नमस्कार ${user?.full_name ? user.full_name : ''}! मी आपला AI पशुवैद्यकीय सहाय्यक आहे. रोगांची लक्षणे, टॅग तपासणी (#100011112222), किंवा शासकीय योजनांबद्दल विचारा!`,
        };
        setMessages([
          {
            sender: 'bot',
            message: greetings[language] || greetings.en,
            created_at: new Date().toISOString(),
          },
        ]);
      }
    } catch (err) {
      console.warn('Failed to start chat session:', err);
    }
  };

  useEffect(() => {
    if (isOpen && !sessionId) {
      initSession();
    }
  }, [isOpen, sessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || loading) return;

    if (!sessionId) {
      await initSession();
    }

    const currentSessionId = sessionId;
    if (!currentSessionId) return;

    const tempUserMsg: Message = {
      sender: 'user',
      message: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setInputValue('');
    setLoading(true);

    try {
      const res = await fetch(`/api/chatbot/sessions/${currentSessionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setMessages((prev) => {
          const filtered = prev.filter((m) => m !== tempUserMsg);
          return [...filtered, data.data.user_message, data.data.bot_message];
        });

        if (data.data.suggestions && data.data.suggestions.length > 0) {
          setSuggestions(data.data.suggestions);
        }
      } else {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'bot',
            message: 'Sorry, I encountered a temporary connection issue. Please try asking again.',
            created_at: new Date().toISOString(),
          },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          message: 'Network error. Please check your internet connection and try again.',
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleModeSwitch = (mode: 'chat' | 'triage' | 'scanner' | 'search') => {
    setActiveMode(mode);
    if (mode === 'triage') {
      const prompt = language === 'mr' ? 'गायीला ताप आणि तोंडात फोड आले आहेत' : language === 'hi' ? 'गाय को बुखार और मुँह में छाले हैं' : 'My cow has fever and mouth blisters';
      handleSend(prompt);
    } else if (mode === 'scanner') {
      handleSend('Verify tag #100011112222');
    } else if (mode === 'search') {
      handleSend('What is the NADCP scheme?');
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-full shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95"
          aria-label="Open Pashudhan Kavach AI Chatbot"
        >
          <Bot className="h-5 w-5" />
          <span className="font-semibold text-sm hidden sm:inline-block">Ask Vet Assistant</span>
          <Sparkles className="h-3.5 w-3.5 text-amber-300 animate-pulse" />
        </button>
      )}

      {/* Floating Chat Drawer Window */}
      {isOpen && (
        <div className="flex flex-col w-[92vw] sm:w-[400px] h-[540px] max-h-[85vh] bg-background border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-emerald-700 text-white">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-emerald-800 rounded-full">
                <Bot className="h-5 w-5 text-emerald-200" />
              </div>
              <div>
                <h3 className="font-semibold text-sm leading-none flex items-center gap-1.5">
                  Ask Vet Assistant
                  <Badge variant="outline" className="text-[10px] text-emerald-100 border-emerald-500 py-0 px-1">
                    AI Multilingual
                  </Badge>
                </h3>
                <p className="text-[11px] text-emerald-100/80 mt-0.5">Triage Predictor • Tag Scanner • Vet Search</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={initSession}
                className="h-7 w-7 text-white hover:bg-emerald-800"
                title="Restart conversation"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-7 w-7 text-white hover:bg-emerald-800"
                title="Close chat"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Mode Selector Tabs */}
          <div className="flex items-center justify-around bg-emerald-50 dark:bg-emerald-950/40 p-1 border-b text-[11px] font-semibold">
            <button
              onClick={() => handleModeSwitch('chat')}
              className={`flex items-center gap-1 px-2 py-1 rounded-md transition-all ${
                activeMode === 'chat' ? 'bg-white dark:bg-zinc-800 text-emerald-700 dark:text-emerald-300 shadow-sm font-bold' : 'text-muted-foreground'
              }`}
            >
              <MessageSquare className="h-3 w-3" />
              <span>AI Chat</span>
            </button>
            <button
              onClick={() => handleModeSwitch('triage')}
              className={`flex items-center gap-1 px-2 py-1 rounded-md transition-all ${
                activeMode === 'triage' ? 'bg-white dark:bg-zinc-800 text-red-600 shadow-sm font-bold' : 'text-muted-foreground'
              }`}
            >
              <Activity className="h-3 w-3 text-red-500" />
              <span>Predictor</span>
            </button>
            <button
              onClick={() => handleModeSwitch('scanner')}
              className={`flex items-center gap-1 px-2 py-1 rounded-md transition-all ${
                activeMode === 'scanner' ? 'bg-white dark:bg-zinc-800 text-emerald-700 shadow-sm font-bold' : 'text-muted-foreground'
              }`}
            >
              <QrCode className="h-3 w-3 text-emerald-600" />
              <span>Scanner</span>
            </button>
            <button
              onClick={() => handleModeSwitch('search')}
              className={`flex items-center gap-1 px-2 py-1 rounded-md transition-all ${
                activeMode === 'search' ? 'bg-white dark:bg-zinc-800 text-blue-600 shadow-sm font-bold' : 'text-muted-foreground'
              }`}
            >
              <Search className="h-3 w-3 text-blue-500" />
              <span>Vet Search</span>
            </button>
          </div>

          {/* Messages scroll area */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3 text-sm bg-slate-50/60 dark:bg-zinc-900/40">
            {messages.map((msg, index) => {
              const isBot = msg.sender === 'bot';
              return (
                <div key={index} className={`flex gap-2 ${isBot ? 'justify-start' : 'justify-end'}`}>
                  {isBot && (
                    <div className="h-7 w-7 rounded-full bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot className="h-4 w-4 text-emerald-700 dark:text-emerald-300" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed ${
                      isBot
                        ? 'bg-white dark:bg-zinc-800 text-foreground border shadow-sm rounded-tl-sm'
                        : 'bg-emerald-600 text-white rounded-tr-sm'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.message}</p>
                    {msg.intent_matched && (
                      <span className="block mt-1 text-[9px] opacity-60 font-mono">
                        intent: {msg.intent_matched}
                      </span>
                    )}
                  </div>
                  {!isBot && (
                    <div className="h-7 w-7 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5 text-white">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="flex gap-2 justify-start items-center text-xs text-muted-foreground">
                <div className="h-7 w-7 rounded-full bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-emerald-700 dark:text-emerald-300" />
                </div>
                <div className="bg-white dark:bg-zinc-800 border px-3 py-2 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-bounce"></span>
                  <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestion Chips */}
          {suggestions.length > 0 && !loading && (
            <div className="p-2 border-t bg-muted/30 flex gap-1.5 overflow-x-auto no-scrollbar text-xs">
              {suggestions.slice(0, 3).map((sug, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(sug)}
                  className="whitespace-nowrap px-2.5 py-1 bg-background border hover:bg-emerald-50 hover:border-emerald-300 dark:hover:bg-emerald-950/40 rounded-full text-[11px] text-muted-foreground hover:text-emerald-700 transition-colors"
                >
                  {sug}
                </button>
              ))}
            </div>
          )}

          {/* Input Box */}
          <div className="p-2.5 border-t bg-background flex items-center gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend();
              }}
              placeholder="Ask AI Predictor, Scanner, or Search..."
              className="text-xs h-9"
              disabled={loading}
            />
            <Button
              size="icon"
              onClick={() => handleSend()}
              disabled={!inputValue.trim() || loading}
              className="h-9 w-9 bg-emerald-600 hover:bg-emerald-700 text-white flex-shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

