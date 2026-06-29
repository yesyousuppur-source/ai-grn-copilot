'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, Brain, Loader2, CheckCircle2, Plus, Trash2,
  GripVertical, Save, ArrowLeft, Edit2
} from 'lucide-react';
import { toast } from 'sonner';
import { cn, fileToBase64, GRN_FIELD_TYPES } from '@/lib/utils';
import { TemplateField } from '@/types';
import { useCompanyStore } from '@/store';
import { useRouter } from 'next/navigation';
import ProcessingOverlay from '@/components/shared/ProcessingOverlay';
import { ProcessingStatus } from '@/types';

export default function NewTemplateClient() {
  const { activeCompany } = useCompanyStore();
  const router = useRouter();

  const [step, setStep] = useState<'upload' | 'detect' | 'edit' | 'save'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fields, setFields] = useState<Partial<TemplateField>[]>([]);
  const [status, setStatus] = useState<ProcessingStatus | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDesc, setTemplateDesc] = useState('');
  const [editingField, setEditingField] = useState<number | null>(null);

  const onDrop = useCallback(async (accepted: File[]) => {
    const f = accepted[0];
    if (!f) return;
    setFile(f);
    if (f.type.startsWith('image/')) {
      setPreview(URL.createObjectURL(f));
    }
    await detectFields(f);
  }, [activeCompany]); // eslint-disable-line

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [], 'application/pdf': [] },
    maxFiles: 1,
    maxSize: 15 * 1024 * 1024,
  });

  const detectFields = async (f: File) => {
    if (!activeCompany) { toast.error('Select a company first'); return; }
    setStatus({ stage: 'uploading', progress: 20, message: 'Uploading template...' });
    setStep('detect');
    try {
      const base64 = await fileToBase64(f);
      setStatus({ stage: 'ai_processing', progress: 55, message: 'AI is detecting all GRN fields...' });

      const res = await fetch('/api/templates/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64, mime_type: f.type, company_id: activeCompany.id }),
      });

      if (!res.ok) throw new Error('Detection failed');
      const { data } = await res.json();

      setStatus({ stage: 'complete', progress: 100, message: 'Fields detected!' });
      setFields(data.fields || []);
      setTemplateName(`${activeCompany.name} GRN Template`);
      setStep('edit');
      toast.success(`${data.fields.length} fields detected by AI`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Detection failed';
      setStatus({ stage: 'error', progress: 0, message: msg });
      toast.error(msg);
      setStep('upload');
    }
  };

  const addField = () => {
    const newField: Partial<TemplateField> = {
      id: `field_${Date.now()}`,
      name: 'newField',
      label: 'New Field',
      type: 'text',
      required: false,
      mapping: [],
      ai_detected: false,
      confidence: 100,
      order: fields.length + 1,
      position: { x: 10, y: 10 + fields.length * 5, width: 30, height: 5, page: 1 },
    };
    setFields((prev) => [...prev, newField]);
    setEditingField(fields.length);
  };

  const updateField = (idx: number, updates: Partial<TemplateField>) => {
    setFields((prev) => prev.map((f, i) => (i === idx ? { ...f, ...updates } : f)));
  };

  const removeField = (idx: number) => {
    setFields((prev) => prev.filter((_, i) => i !== idx));
    if (editingField === idx) setEditingField(null);
  };

  const handleSave = async () => {
    if (!activeCompany) return;
    if (!templateName.trim()) { toast.error('Enter a template name'); return; }
    if (fields.length === 0) { toast.error('Add at least one field'); return; }

    setIsSaving(true);
    try {
      const formData = new FormData();
      if (file) formData.append('file', file);
      formData.append('company_id', activeCompany.id);
      formData.append('name', templateName);
      formData.append('description', templateDesc);
      formData.append('fields', JSON.stringify(fields));

      const res = await fetch('/api/templates', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Save failed');
      const { data } = await res.json();
      toast.success('Template saved!');
      router.push('/dashboard/templates');
    } catch (err) {
      toast.error('Failed to save template');
    } finally {
      setIsSaving(false);
    }
  };

  if (step === 'upload') {
    return (
      <div className="space-y-4">
        <div {...getRootProps()} className={cn('upload-zone', isDragActive && 'drag-active')}>
          <input {...getInputProps()} />
          <motion.div animate={isDragActive ? { scale: 1.05 } : { scale: 1 }} className="flex flex-col items-center gap-3">
            <div className={cn('w-16 h-16 rounded-2xl flex items-center justify-center transition-colors', isDragActive ? 'bg-primary text-white' : 'bg-primary/10 text-primary')}>
              <Upload className="w-8 h-8" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-foreground">Upload blank GRN template</p>
              <p className="text-sm text-muted-foreground mt-1">
                Upload your company's GRN form — AI will detect all fields
              </p>
            </div>
            <div className="flex gap-3">
              <button type="button" className="px-4 py-2 rounded-xl gradient-brand text-white text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                Browse File
              </button>
            </div>
          </motion.div>
        </div>

        <div className="glass-card p-5">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary" />
            How AI Template Learning Works
          </h3>
          <div className="space-y-2">
            {[
              'Upload your blank GRN form (PDF or image)',
              'AI scans and detects every fillable field',
              'Review and adjust field names and types',
              'AI remembers this template forever for your company',
              'When you upload a new format, AI compares and suggests updating',
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full gradient-brand text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <p className="text-sm text-foreground">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (step === 'detect' && status && status.stage !== 'complete' && status.stage !== 'error') {
    return <ProcessingOverlay status={status} />;
  }

  return (
    <div className="space-y-4">
      {/* Template info */}
      <div className="glass-card p-5 space-y-4">
        <h2 className="font-semibold text-foreground">Template Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Template Name *</label>
            <input
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="e.g. Standard GRN Form v2"
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Description</label>
            <input
              value={templateDesc}
              onChange={(e) => setTemplateDesc(e.target.value)}
              placeholder="Optional description"
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Fields editor */}
      <div className="glass-card">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-foreground">Detected Fields ({fields.length})</h2>
            <p className="text-xs text-muted-foreground mt-0.5">AI detected these fields — review and edit</p>
          </div>
          <button
            onClick={addField}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border text-sm hover:bg-accent transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Field
          </button>
        </div>

        <div className="divide-y divide-border">
          {fields.map((field, idx) => (
            <div key={field.id || idx} className="p-4">
              <div className="flex items-center gap-3">
                <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0 cursor-grab" />
                <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block">Label</label>
                    <input
                      value={field.label}
                      onChange={(e) => updateField(idx, { label: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background/50 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block">Field Name</label>
                    <input
                      value={field.name}
                      onChange={(e) => updateField(idx, { name: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background/50 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block">Type</label>
                    <select
                      value={field.type}
                      onChange={(e) => updateField(idx, { type: e.target.value as TemplateField['type'] })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background/50 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {GRN_FIELD_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end gap-2">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => updateField(idx, { required: e.target.checked })}
                        className="rounded"
                      />
                      Required
                    </label>
                    <button
                      onClick={() => removeField(idx)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-red-500/10 transition-colors ml-auto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
              {field.ai_detected && (
                <div className="mt-2 ml-7 flex items-center gap-1.5 text-xs text-primary">
                  <Brain className="w-3 h-3" />
                  AI detected · {Math.round(field.confidence || 0)}% confidence
                </div>
              )}
              {field.mapping && field.mapping.length > 0 && (
                <div className="mt-1.5 ml-7 flex flex-wrap gap-1">
                  {field.mapping.map((m, mi) => (
                    <span key={mi} className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                      {m}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}

          {fields.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              <p>No fields detected. Add fields manually or re-upload the template.</p>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-8">
        <button
          onClick={() => { setStep('upload'); setFields([]); setFile(null); setPreview(null); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm hover:bg-accent transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Upload Different File
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-brand text-white text-sm font-semibold shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isSaving ? 'Saving...' : 'Save Template'}
        </button>
      </div>
    </div>
  );
}
