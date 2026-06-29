'use client';

import { motion } from 'framer-motion';
import { Loader2, Upload, Brain, CheckCircle2, AlertTriangle } from 'lucide-react';
import { ProcessingStatus } from '@/types';
import { cn } from '@/lib/utils';

const stages = [
  { key: 'uploading', icon: Upload, label: 'Uploading file' },
  { key: 'ocr', icon: Brain, label: 'OCR extraction' },
  { key: 'ai_processing', icon: Brain, label: 'AI processing' },
  { key: 'validation', icon: CheckCircle2, label: 'Validating' },
  { key: 'complete', icon: CheckCircle2, label: 'Complete' },
];

export default function ProcessingOverlay({ status }: { status: ProcessingStatus }) {
  const currentIdx = stages.findIndex((s) => s.key === status.stage);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="glass-card p-8 text-center"
    >
      {/* Spinner */}
      <div className="relative w-20 h-20 mx-auto mb-6">
        <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <Brain className="w-8 h-8 text-primary" />
        </div>
      </div>

      <p className="text-lg font-semibold text-foreground mb-1">{status.message}</p>
      <p className="text-sm text-muted-foreground mb-6">Please wait, AI is working...</p>

      {/* Progress bar */}
      <div className="w-full max-w-xs mx-auto h-1.5 bg-muted rounded-full overflow-hidden mb-6">
        <motion.div
          className="h-full gradient-brand rounded-full"
          initial={{ width: '5%' }}
          animate={{ width: `${status.progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {/* Stage pills */}
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {stages.slice(0, -1).map((stage, i) => {
          const done = i < currentIdx;
          const active = i === currentIdx;
          return (
            <div
              key={stage.key}
              className={cn(
                'flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-all',
                done && 'bg-green-500/10 text-green-600 border-green-500/20',
                active && 'bg-primary/10 text-primary border-primary/20',
                !done && !active && 'text-muted-foreground border-border'
              )}
            >
              {done ? (
                <CheckCircle2 className="w-3 h-3" />
              ) : active ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <div className="w-3 h-3 rounded-full border border-current" />
              )}
              {stage.label}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
