'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, Loader2, CheckCircle2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useGRNWorkflowStore, useCompanyStore, useTemplateStore } from '@/store';

export default function TrainAIButton() {
  const [isTraining, setIsTraining] = useState(false);
  const [trained, setTrained] = useState(false);
  const { currentInvoice, correctedFields, currentGRN } = useGRNWorkflowStore();
  const { activeCompany } = useCompanyStore();
  const { activeTemplate } = useTemplateStore();

  const handleTrain = async () => {
    if (!activeCompany || !activeTemplate || correctedFields.length === 0) return;
    setIsTraining(true);
    try {
      const res = await fetch('/api/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: activeCompany.id,
          template_id: activeTemplate.id,
          corrections: correctedFields,
          invoice_context: currentInvoice,
          grn_id: (currentGRN as { id?: string })?.id,
        }),
      });
      if (!res.ok) throw new Error('Training failed');
      const { data } = await res.json();
      setTrained(true);
      toast.success(data.message || 'AI trained successfully!');
    } catch {
      toast.error('Training failed. Please try again.');
    } finally {
      setIsTraining(false);
    }
  };

  if (trained) {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-500/10 text-green-600 text-sm font-medium border border-green-500/20"
      >
        <CheckCircle2 className="w-4 h-4" />
        AI Trained! Next invoice will be more accurate.
      </motion.div>
    );
  }

  return (
    <motion.button
      onClick={handleTrain}
      disabled={isTraining}
      whileTap={{ scale: 0.96 }}
      animate={{ boxShadow: ['0 0 0 0 rgba(124,58,237,0)', '0 0 0 8px rgba(124,58,237,0.2)', '0 0 0 0 rgba(124,58,237,0)'] }}
      transition={{ duration: 2, repeat: Infinity }}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold shadow-lg shadow-violet-500/30 hover:bg-violet-700 transition-colors disabled:opacity-60"
    >
      {isTraining ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Brain className="w-4 h-4" />
      )}
      <Sparkles className="w-3.5 h-3.5" />
      {isTraining ? 'Training AI...' : `Train AI (${correctedFields.length} correction${correctedFields.length !== 1 ? 's' : ''})`}
    </motion.button>
  );
}
