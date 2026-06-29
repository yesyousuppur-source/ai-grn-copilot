'use client';

import { useState, useEffect } from 'react';
import { BookOpen, Plus, ChevronDown, CheckCircle2, Loader2 } from 'lucide-react';
import { GRNTemplate } from '@/types';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface Props {
  templates: GRNTemplate[];
  activeTemplate: GRNTemplate | null;
  onSelect: (template: GRNTemplate) => void;
  companyId?: string;
}

export default function TemplateSelector({ templates, activeTemplate, onSelect, companyId }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localTemplates, setLocalTemplates] = useState<GRNTemplate[]>(templates);

  useEffect(() => {
    if (companyId && templates.length === 0) {
      loadTemplates();
    } else {
      setLocalTemplates(templates);
    }
  }, [companyId, templates]); // eslint-disable-line

  const loadTemplates = async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/templates?company_id=${companyId}`);
      const { data } = await res.json();
      setLocalTemplates(data || []);
      if (data?.length > 0 && !activeTemplate) {
        const def = data.find((t: GRNTemplate) => t.is_default) || data[0];
        onSelect(def);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary" />
          <h3 className="font-medium text-foreground text-sm">GRN Template</h3>
        </div>
        <Link
          href="/dashboard/templates/new"
          className="flex items-center gap-1 text-xs text-primary hover:underline"
        >
          <Plus className="w-3 h-3" />
          New Template
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading templates...
        </div>
      ) : localTemplates.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground mb-3">No templates yet</p>
          <Link
            href="/dashboard/templates/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl gradient-brand text-white text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Create First Template
          </Link>
        </div>
      ) : (
        <div className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-border hover:border-primary/50 transition-colors bg-background/50"
          >
            {activeTemplate ? (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">{activeTemplate.name}</p>
                  <p className="text-xs text-muted-foreground">v{activeTemplate.version} · {activeTemplate.fields.length} fields</p>
                </div>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">Select a GRN template...</span>
            )}
            <ChevronDown className={cn('w-4 h-4 text-muted-foreground transition-transform', open && 'rotate-180')} />
          </button>

          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="absolute z-20 top-full mt-1 left-0 right-0 bg-card border border-border rounded-xl shadow-xl overflow-hidden"
              >
                {localTemplates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => { onSelect(t); setOpen(false); }}
                    className={cn(
                      'w-full flex items-center justify-between px-4 py-3 text-left hover:bg-accent transition-colors border-b border-border/50 last:border-0',
                      activeTemplate?.id === t.id && 'bg-primary/5'
                    )}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground">{t.name}</p>
                        {t.is_default && (
                          <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">Default</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        v{t.version} · {t.fields.length} fields
                        {(t.ai_learning_data as { training_count?: number })?.training_count ? ` · ${(t.ai_learning_data as { training_count?: number }).training_count} trainings` : ''}
                      </p>
                    </div>
                    {activeTemplate?.id === t.id && <CheckCircle2 className="w-4 h-4 text-primary" />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
