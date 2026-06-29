'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle, X, Send, Loader2, Bot, User, Sparkles, Minimize2
} from 'lucide-react';
import { toast } from 'sonner';
import { useChatStore, useGRNWorkflowStore, useCompanyStore } from '@/store';
import { ChatMessage } from '@/types';
import { generateId, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

const QUICK_PROMPTS = [
  'Why is this field highlighted?',
  'Explain GST mismatch',
  'What is a GRN?',
  'How do I fix quantity mismatch?',
];

export default function ChatWidget() {
  const { messages, isOpen, isTyping, addMessage, setOpen, setTyping } = useChatStore();
  const { currentGRN, currentInvoice } = useGRNWorkflowStore();
  const { activeCompany } = useCompanyStore();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [isOpen, messages]);

  const sendMessage = async (text?: string) => {
    const content = text || input.trim();
    if (!content) return;
    setInput('');

    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };
    addMessage(userMsg);
    setTyping(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
          context: {
            grn_data: currentGRN,
            validation_errors: (currentGRN as { validation_errors?: unknown })?.validation_errors,
            company_name: activeCompany?.name,
            invoice_data: currentInvoice,
          },
        }),
      });

      if (!res.ok) throw new Error('Chat failed');
      const { data } = await res.json();

      addMessage({
        id: generateId(),
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toISOString(),
      });
    } catch {
      toast.error('Chat failed. Check your API key in Settings.');
    } finally {
      setTyping(false);
    }
  };

  return (
    <>
      {/* Toggle button */}
      <motion.button
        onClick={() => setOpen(!isOpen)}
        whileTap={{ scale: 0.9 }}
        className={cn(
          'fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl shadow-2xl',
          'flex items-center justify-center transition-all',
          isOpen ? 'gradient-brand' : 'gradient-brand animate-pulse-glow'
        )}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X className="w-6 h-6 text-white" />
            </motion.div>
          ) : (
            <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} className="relative">
              <MessageCircle className="w-6 h-6 text-white" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border-2 border-white" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-24 right-6 z-50 w-[min(380px,calc(100vw-48px))] h-[500px] glass-card flex flex-col shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-border gradient-brand">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-white text-sm">GRN AI Assistant</p>
                <p className="text-[10px] text-blue-100 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  Powered by GPT-4o
                </p>
              </div>
              <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white transition-colors">
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="text-center py-4">
                  <div className="w-12 h-12 rounded-2xl gradient-brand/20 flex items-center justify-center mx-auto mb-3">
                    <Bot className="w-6 h-6 text-primary" />
                  </div>
                  <p className="font-medium text-foreground text-sm">Hi! I'm your GRN Assistant</p>
                  <p className="text-xs text-muted-foreground mt-1 mb-4">
                    Ask me anything about your GRNs, invoices, or validations
                  </p>
                  <div className="space-y-2">
                    {QUICK_PROMPTS.map((p) => (
                      <button
                        key={p}
                        onClick={() => sendMessage(p)}
                        className="w-full text-left text-xs px-3 py-2 rounded-xl bg-muted hover:bg-accent transition-colors text-foreground"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className={cn('flex gap-2', msg.role === 'user' && 'flex-row-reverse')}>
                    <div className={cn(
                      'w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5',
                      msg.role === 'user' ? 'gradient-brand' : 'bg-muted'
                    )}>
                      {msg.role === 'user'
                        ? <User className="w-3.5 h-3.5 text-white" />
                        : <Bot className="w-3.5 h-3.5 text-primary" />}
                    </div>
                    <div className={cn(
                      'max-w-[80%] rounded-2xl px-3 py-2 text-sm',
                      msg.role === 'user'
                        ? 'gradient-brand text-white rounded-tr-sm'
                        : 'bg-muted text-foreground rounded-tl-sm'
                    )}>
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      <p className={cn(
                        'text-[10px] mt-1',
                        msg.role === 'user' ? 'text-blue-100' : 'text-muted-foreground'
                      )}>
                        {formatDate(msg.timestamp, 'hh:mm a')}
                      </p>
                    </div>
                  </div>
                ))
              )}

              {isTyping && (
                <div className="flex gap-2">
                  <div className="w-7 h-7 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                    <Bot className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-primary"
                          animate={{ y: [-2, 2, -2] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder="Ask about GRN, invoice, GST..."
                  className="flex-1 px-3 py-2 rounded-xl border border-border bg-background/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isTyping}
                  className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center text-white disabled:opacity-50 hover:opacity-90 transition-opacity flex-shrink-0"
                >
                  {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
