'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen, Plus, Brain, Upload, Layers, CheckCircle2,
  Clock, MoreVertical, Edit, Trash2, Star, Copy
} from 'lucide-react';
import Link from 'next/link';
import { GRNTemplate } from '@/types';
import { formatDate, cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Props {
  templates: GRNTemplate[];
  companyId: string;
}

export default function TemplatesClient({ templates: initial, companyId }: Props) {
  const [templates, setTemplates] = useState<GRNTemplate[]>(initial);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this template? This cannot be undone.')) return;
    const res = await fetch(`/api/templates/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      toast.success('Template deleted');
    } else {
      toast.error('Failed to delete template');
    }
  };

  const handleSetDefault = async (id: string) => {
    const res = await fetch(`/api/templates/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_default: true }),
    });
    if (res.ok) {
      setTemplates((prev) =>
        prev.map((t) => ({ ...t, is_default: t.id === id }))
      );
      toast.success('Set as default template');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">GRN Templates</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your company's GRN formats — AI learns each one
          </p>
        </div>
        <Link
          href="/dashboard/templates/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-brand text-white text-sm font-semibold shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          New Template
        </Link>
      </div>

      {/* Empty state */}
      {templates.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">No templates yet</h2>
          <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
            Upload a blank GRN form — AI will detect all fields automatically
            and remember your company's format forever.
          </p>
          <Link
            href="/dashboard/templates/new"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl gradient-brand text-white font-semibold shadow-lg shadow-primary/20"
          >
            <Upload className="w-5 h-5" />
            Upload GRN Template
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {templates.map((template, i) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card overflow-hidden hover:shadow-lg transition-shadow group"
            >
              {/* Thumbnail or placeholder */}
              <div className="h-32 bg-gradient-to-br from-primary/10 to-violet-500/10 flex items-center justify-center relative">
                {template.thumbnail_url ? (
                  <img src={template.thumbnail_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <BookOpen className="w-10 h-10 text-primary/40" />
                )}
                {template.is_default && (
                  <div className="absolute top-2 left-2 flex items-center gap-1 bg-primary text-white text-[10px] font-bold px-2 py-1 rounded-full">
                    <Star className="w-2.5 h-2.5 fill-white" />
                    Default
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <span className="bg-black/30 text-white text-[10px] px-2 py-1 rounded-full backdrop-blur-sm">
                    v{template.version}
                  </span>
                </div>
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{template.name}</h3>
                    {template.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {template.description}
                      </p>
                    )}
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setMenuOpen(menuOpen === template.id ? null : template.id)}
                      className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {menuOpen === template.id && (
                      <div className="absolute right-0 top-full mt-1 w-44 bg-card border border-border rounded-xl shadow-xl z-10 overflow-hidden">
                        <Link
                          href={`/dashboard/templates/${template.id}`}
                          className="flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-accent transition-colors"
                          onClick={() => setMenuOpen(null)}
                        >
                          <Edit className="w-4 h-4" />
                          Edit Template
                        </Link>
                        <button
                          onClick={() => { handleSetDefault(template.id); setMenuOpen(null); }}
                          className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-accent transition-colors"
                        >
                          <Star className="w-4 h-4" />
                          Set as Default
                        </button>
                        <button
                          onClick={() => setMenuOpen(null)}
                          className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-accent transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                          Duplicate
                        </button>
                        <button
                          onClick={() => { handleDelete(template.id); setMenuOpen(null); }}
                          className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-red-500/10 text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats row */}
                <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Layers className="w-3 h-3" />
                    {template.fields.length} fields
                  </span>
                  <span className="flex items-center gap-1">
                    <Brain className="w-3 h-3" />
                    {(template.ai_learning_data as { training_count?: number })?.training_count || 0} trainings
                  </span>
                  <span className={cn(
                    'flex items-center gap-1 ml-auto',
                    template.is_active ? 'text-green-500' : 'text-muted-foreground'
                  )}>
                    {template.is_active ? (
                      <><CheckCircle2 className="w-3 h-3" />Active</>
                    ) : (
                      <><Clock className="w-3 h-3" />Inactive</>
                    )}
                  </span>
                </div>

                {/* AI score bar */}
                {((template.ai_learning_data as { training_count?: number })?.training_count || 0) > 0 && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">AI Accuracy</span>
                      <span className="text-primary font-medium">
                        {(template.ai_learning_data as { accuracy_score?: number })?.accuracy_score || 70}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full gradient-brand rounded-full transition-all"
                        style={{ width: `${(template.ai_learning_data as { accuracy_score?: number })?.accuracy_score || 70}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">
                    Updated {formatDate(template.updated_at)}
                  </span>
                  <Link
                    href={`/dashboard/templates/${template.id}`}
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    Edit →
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Add new card */}
          <Link
            href="/dashboard/templates/new"
            className="glass-card p-6 flex flex-col items-center justify-center gap-3 text-center hover:border-primary/50 hover:bg-primary/5 transition-all border-2 border-dashed border-border min-h-[220px] group"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Plus className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">Add Template</p>
              <p className="text-xs text-muted-foreground mt-1">Upload a GRN form</p>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
