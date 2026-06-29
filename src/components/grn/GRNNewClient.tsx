'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, AlertTriangle, CheckCircle2, Loader2, Save, Download,
  RotateCcw, Zap, Info, ChevronDown, ChevronUp, BookOpen
} from 'lucide-react';
import { toast } from 'sonner';
import { cn, formatCurrency } from '@/lib/utils';
import {
  GRNTemplate, GRNFieldValue, ValidationError, ExtractedInvoice
} from '@/types';
import { useGRNWorkflowStore, useCompanyStore, useTemplateStore } from '@/store';
import ConfidenceBadge from '@/components/shared/ConfidenceBadge';
import ValidationCard from '@/components/grn/ValidationCard';
import TrainAIButton from '@/components/grn/TrainAIButton';
import TemplateSelector from '@/components/grn/TemplateSelector';
import { useRouter } from 'next/navigation';

export default function GRNNewClient() {
  const { currentInvoice, setCurrentGRN, showTrainButton, markFieldCorrected } = useGRNWorkflowStore();
  const { activeCompany } = useCompanyStore();
  const { templates, activeTemplate, setActiveTemplate } = useTemplateStore();
  const router = useRouter();

  const [fieldValues, setFieldValues] = useState<GRNFieldValue[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isValidated, setIsValidated] = useState(false);
  const [showValidation, setShowValidation] = useState(true);
  const [aiConfidence, setAiConfidence] = useState(0);

  useEffect(() => {
    if (activeTemplate && currentInvoice) {
      handleAutoFill();
    }
  }, [activeTemplate]); // eslint-disable-line

  const handleAutoFill = async () => {
    if (!activeTemplate || !currentInvoice || !activeCompany) return;
    setIsAutoFilling(true);
    try {
      const res = await fetch('/api/grn/autofill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: activeTemplate.id,
          invoice_data: currentInvoice,
          company_id: activeCompany.id,
        }),
      });
      if (!res.ok) throw new Error('Auto-fill failed');
      const { data } = await res.json();
      setFieldValues(data.field_values || []);
      setAiConfidence(data.ai_confidence || 0);
      toast.success('GRN auto-filled by AI');
      // Run validation immediately
      await runValidation(data.field_values);
    } catch (err) {
      toast.error('Auto-fill failed. Please fill manually.');
    } finally {
      setIsAutoFilling(false);
    }
  };

  const runValidation = async (values?: GRNFieldValue[]) => {
    if (!currentInvoice || !activeCompany) return;
    setIsValidating(true);
    try {
      const res = await fetch('/api/grn/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          field_values: values || fieldValues,
          invoice_data: currentInvoice,
          company_id: activeCompany.id,
        }),
      });
      if (!res.ok) throw new Error('Validation failed');
      const { data } = await res.json();
      setValidationErrors(data.errors || []);
      setIsValidated(true);
      if (data.errors.length === 0) {
        toast.success('All validations passed!');
      } else {
        const errCount = data.errors.filter((e: ValidationError) => e.severity === 'error').length;
        toast.warning(`${errCount} error${errCount !== 1 ? 's' : ''} found`);
      }
    } catch {
      toast.error('Validation failed');
    } finally {
      setIsValidating(false);
    }
  };

  const handleFieldChange = (fieldId: string, value: string, originalValue: string) => {
    setFieldValues((prev) =>
      prev.map((f) =>
        f.field_id === fieldId
          ? { ...f, value, is_corrected: true, original_value: originalValue, source: 'manual' }
          : f
      )
    );
    markFieldCorrected(fieldId);
    setIsValidated(false);
  };

  const handleSave = async (status: 'draft' | 'pending_review' | 'completed' = 'pending_review') => {
    if (!activeTemplate || !activeCompany) {
      toast.error('Select a template first');
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch('/api/grn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: activeCompany.id,
          template_id: activeTemplate.id,
          invoice_id: (currentInvoice as ExtractedInvoice)?.id,
          field_values: fieldValues,
          line_items: currentInvoice?.line_items || [],
          validation_errors: validationErrors,
          is_validated: isValidated,
          validation_score: isValidated ? (100 - validationErrors.filter(e => e.severity === 'error').length * 10) : 0,
          ai_confidence: aiConfidence,
          status,
        }),
      });
      if (!res.ok) throw new Error('Save failed');
      const { data } = await res.json();
      setCurrentGRN(data);
      toast.success(`GRN ${data.grn_number} saved!`);
      router.push(`/dashboard/grn/${data.id}`);
    } catch (err) {
      toast.error('Failed to save GRN');
    } finally {
      setIsSaving(false);
    }
  };

  const errors = validationErrors.filter((e) => e.severity === 'error');
  const warnings = validationErrors.filter((e) => e.severity === 'warning');

  if (!currentInvoice) {
    return (
      <div className="glass-card p-12 text-center">
        <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-foreground mb-2">No invoice loaded</h2>
        <p className="text-muted-foreground mb-4">Upload an invoice first to auto-fill the GRN</p>
        <button
          onClick={() => router.push('/dashboard/invoices')}
          className="px-5 py-2.5 rounded-xl gradient-brand text-white font-medium shadow-lg shadow-primary/20"
        >
          Upload Invoice
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Template selector */}
      <TemplateSelector
        templates={templates}
        activeTemplate={activeTemplate}
        onSelect={(t) => setActiveTemplate(t)}
        companyId={activeCompany?.id}
      />

      {/* AI status bar */}
      {activeTemplate && (
        <div className="glass-card p-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground text-sm">AI Auto-Fill</p>
              <p className="text-xs text-muted-foreground">
                {isAutoFilling
                  ? 'Filling GRN fields from invoice...'
                  : aiConfidence > 0
                  ? `${Math.round(aiConfidence)}% overall confidence`
                  : 'Ready to fill'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAutoFilling ? (
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            ) : (
              <>
                <button
                  onClick={handleAutoFill}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border text-sm hover:bg-accent transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Re-fill
                </button>
                <button
                  onClick={() => runValidation()}
                  disabled={isValidating}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10 text-primary text-sm hover:bg-primary/20 transition-colors"
                >
                  {isValidating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  Validate
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Validation errors */}
      <AnimatePresence>
        {isValidated && validationErrors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-card overflow-hidden"
          >
            <button
              onClick={() => setShowValidation(!showValidation)}
              className="w-full flex items-center justify-between p-4 border-b border-border"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span className="font-medium text-foreground">
                  Validation Results
                </span>
                <span className={cn(
                  'text-xs px-2 py-0.5 rounded-full font-medium',
                  errors.length > 0 ? 'bg-red-500/10 text-red-600' : 'bg-amber-500/10 text-amber-600'
                )}>
                  {errors.length} error{errors.length !== 1 ? 's' : ''},
                  {' '}{warnings.length} warning{warnings.length !== 1 ? 's' : ''}
                </span>
              </div>
              {showValidation ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showValidation && (
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                {validationErrors.map((err, i) => (
                  <ValidationCard key={i} error={err} />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Field values */}
      {activeTemplate && fieldValues.length > 0 && (
        <div className="glass-card">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-foreground">
              {activeTemplate.name} — v{activeTemplate.version}
            </h2>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Info className="w-3.5 h-3.5" />
              {fieldValues.filter(f => f.is_corrected).length} fields edited
            </div>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {fieldValues.map((fv) => {
              const hasError = validationErrors.some(
                (e) => e.field === fv.field_name && e.severity === 'error'
              );
              const hasWarning = validationErrors.some(
                (e) => e.field === fv.field_name && e.severity === 'warning'
              );
              return (
                <div
                  key={fv.field_id}
                  className={cn(
                    'rounded-xl border p-3 transition-all',
                    hasError ? 'border-red-500/40 bg-red-500/5' :
                    hasWarning ? 'border-amber-500/40 bg-amber-500/5' :
                    fv.is_corrected ? 'border-green-500/30 bg-green-500/5' :
                    'border-border'
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-muted-foreground truncate">
                      {fv.field_name}
                    </label>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {hasError && <AlertTriangle className="w-3 h-3 text-red-500" />}
                      {hasWarning && <AlertTriangle className="w-3 h-3 text-amber-500" />}
                      {!hasError && !hasWarning && fv.is_corrected && (
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                      )}
                      <ConfidenceBadge confidence={fv.confidence} />
                    </div>
                  </div>
                  <input
                    value={fv.value}
                    onChange={(e) => handleFieldChange(fv.field_id, e.target.value, fv.value)}
                    className="w-full bg-transparent text-sm font-medium text-foreground border-b border-border/50 focus:border-primary focus:outline-none pb-0.5 transition-colors"
                    placeholder="Enter value..."
                  />
                  {fv.confidence < 80 && !fv.is_corrected && (
                    <p className="text-[10px] text-amber-600 mt-1">Low confidence — please verify</p>
                  )}
                  {fv.is_corrected && (
                    <p className="text-[10px] text-green-600 mt-1">✓ Manually corrected</p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Line items */}
          {currentInvoice?.line_items && currentInvoice.line_items.length > 0 && (
            <div className="border-t border-border p-4">
              <p className="font-medium text-foreground mb-3">
                Received Items ({currentInvoice.line_items.length})
              </p>
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left p-3 font-semibold text-muted-foreground">Description</th>
                      <th className="text-right p-3 font-semibold text-muted-foreground">HSN</th>
                      <th className="text-right p-3 font-semibold text-muted-foreground">Qty</th>
                      <th className="text-right p-3 font-semibold text-muted-foreground">Rate</th>
                      <th className="text-right p-3 font-semibold text-muted-foreground">GST%</th>
                      <th className="text-right p-3 font-semibold text-muted-foreground">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentInvoice.line_items.map((item, i) => (
                      <tr key={i} className="border-t border-border">
                        <td className="p-3">{item.description}</td>
                        <td className="p-3 text-right text-muted-foreground">{item.hsn_code}</td>
                        <td className="p-3 text-right">{item.quantity} {item.unit}</td>
                        <td className="p-3 text-right">₹{item.rate}</td>
                        <td className="p-3 text-right">{item.gst_rate}%</td>
                        <td className="p-3 text-right font-semibold">{formatCurrency(item.total_amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-border bg-muted/30">
                      <td colSpan={5} className="p-3 font-semibold text-right">Total</td>
                      <td className="p-3 text-right font-bold text-primary">
                        {formatCurrency(
                          currentInvoice.line_items.reduce((s, i) => s + i.total_amount, 0)
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Train AI + Save */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-8">
        <div className="flex items-center gap-2">
          {showTrainButton && <TrainAIButton />}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => handleSave('draft')}
            disabled={isSaving || !activeTemplate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            Save Draft
          </button>
          <button
            onClick={() => handleSave('pending_review')}
            disabled={isSaving || !activeTemplate}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-brand text-white text-sm font-semibold shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {isSaving ? 'Saving...' : 'Submit for Review'}
          </button>
        </div>
      </div>
    </div>
  );
}
