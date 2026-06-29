'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, FileImage, X, Loader2, CheckCircle2, AlertTriangle,
  Camera, ZoomIn, Brain, ChevronRight, Edit3, Save
} from 'lucide-react';
import { toast } from 'sonner';
import { cn, fileToBase64, formatFileSize, getConfidenceBg, getConfidenceLabel } from '@/lib/utils';
import { ExtractedInvoice, InvoiceField, ProcessingStatus } from '@/types';
import { useCompanyStore, useGRNWorkflowStore } from '@/store';
import { useRouter } from 'next/navigation';
import ConfidenceBadge from '@/components/shared/ConfidenceBadge';
import ProcessingOverlay from '@/components/shared/ProcessingOverlay';

const ACCEPTED_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'application/pdf': ['.pdf'],
};

export default function InvoiceUploadClient() {
  const { activeCompany } = useCompanyStore();
  const { setCurrentInvoice } = useGRNWorkflowStore();
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<ProcessingStatus | null>(null);
  const [invoice, setInvoice] = useState<Partial<ExtractedInvoice> | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedInvoice, setEditedInvoice] = useState<Partial<ExtractedInvoice> | null>(null);

  const onDrop = useCallback(async (accepted: File[]) => {
    const f = accepted[0];
    if (!f) return;
    setFile(f);
    if (f.type.startsWith('image/')) {
      const url = URL.createObjectURL(f);
      setPreview(url);
    }
    await processFile(f);
  }, [activeCompany]); // eslint-disable-line

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024,
  });

  const processFile = async (f: File) => {
    if (!activeCompany) {
      toast.error('Please select a company first');
      return;
    }

    try {
      setStatus({ stage: 'uploading', progress: 10, message: 'Uploading invoice...' });

      const base64 = await fileToBase64(f);

      setStatus({ stage: 'ocr', progress: 35, message: 'Running AI OCR extraction...' });

      const formData = new FormData();
      formData.append('file', f);
      formData.append('company_id', activeCompany.id);
      formData.append('base64', base64);
      formData.append('mime_type', f.type);

      setStatus({ stage: 'ai_processing', progress: 65, message: 'AI is reading invoice fields...' });

      const res = await fetch('/api/invoices/extract', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Extraction failed');
      }

      const { data } = await res.json();

      setStatus({ stage: 'validation', progress: 85, message: 'Validating extracted data...' });
      await new Promise((r) => setTimeout(r, 600));

      setStatus({ stage: 'complete', progress: 100, message: 'Done!' });
      setInvoice(data);
      setEditedInvoice(data);
      setCurrentInvoice(data);

      toast.success(`Invoice extracted — ${Math.round(data.overall_confidence)}% confidence`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Processing failed';
      setStatus({ stage: 'error', progress: 0, message: msg, error: msg });
      toast.error(msg);
    }
  };

  const handleCameraCapture = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => {
      const f = (e.target as HTMLInputElement).files?.[0];
      if (f) {
        setFile(f);
        const url = URL.createObjectURL(f);
        setPreview(url);
        processFile(f);
      }
    };
    input.click();
  };

  const handleFieldEdit = (key: string, value: string) => {
    if (!editedInvoice) return;
    setEditedInvoice((prev) => ({
      ...prev,
      [key]: { ...(prev as Record<string, InvoiceField>)[key], value, is_corrected: true },
    }));
  };

  const handleSaveAndCreateGRN = async () => {
    if (!editedInvoice || !activeCompany) return;
    setCurrentInvoice(editedInvoice);
    router.push('/dashboard/grn/new');
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setStatus(null);
    setInvoice(null);
    setEditedInvoice(null);
    setEditMode(false);
  };

  const headerFields: Array<{ key: keyof ExtractedInvoice; label: string }> = [
    { key: 'vendor_name', label: 'Vendor Name' },
    { key: 'vendor_gstin', label: 'Vendor GSTIN' },
    { key: 'invoice_number', label: 'Invoice Number' },
    { key: 'invoice_date', label: 'Invoice Date' },
    { key: 'po_number', label: 'PO Number' },
    { key: 'vehicle_number', label: 'Vehicle Number' },
    { key: 'batch_number', label: 'Batch Number' },
    { key: 'subtotal', label: 'Subtotal (₹)' },
    { key: 'cgst_amount', label: 'CGST (₹)' },
    { key: 'sgst_amount', label: 'SGST (₹)' },
    { key: 'igst_amount', label: 'IGST (₹)' },
    { key: 'total_amount', label: 'Total Amount (₹)' },
  ];

  return (
    <div className="space-y-6">
      {/* Upload zone */}
      {!invoice && (
        <div className="space-y-4">
          <div
            {...getRootProps()}
            className={cn('upload-zone', isDragActive && 'drag-active')}
          >
            <input {...getInputProps()} />
            <motion.div
              animate={isDragActive ? { scale: 1.05 } : { scale: 1 }}
              className="flex flex-col items-center gap-3"
            >
              <div className={cn(
                'w-16 h-16 rounded-2xl flex items-center justify-center transition-colors',
                isDragActive ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
              )}>
                <Upload className="w-8 h-8" />
              </div>
              <div>
                <p className="font-semibold text-foreground">
                  {isDragActive ? 'Drop invoice here' : 'Drop invoice PDF or image'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Supports PDF, JPG, PNG, WebP — up to 20MB
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-px w-12 bg-border" />
                or
                <div className="h-px w-12 bg-border" />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl gradient-brand text-white text-sm font-medium shadow-md shadow-primary/20"
                  onClick={(e) => e.stopPropagation()}
                >
                  Browse File
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleCameraCapture(); }}
                  className="px-4 py-2 rounded-xl border border-border text-foreground text-sm font-medium hover:bg-accent flex items-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  Camera
                </button>
              </div>
            </motion.div>
          </div>

          {/* Tips */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { icon: ZoomIn, title: 'Clear photos', desc: 'Ensure text is sharp and legible' },
              { icon: Brain, title: 'AI powered', desc: 'Extracts all fields automatically' },
              { icon: Edit3, title: 'Editable', desc: 'Review and correct any field' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="glass-card p-4 flex gap-3">
                <Icon className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">{title}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Processing overlay */}
      <AnimatePresence>
        {status && status.stage !== 'complete' && status.stage !== 'error' && (
          <ProcessingOverlay status={status} />
        )}
      </AnimatePresence>

      {/* Extracted invoice */}
      <AnimatePresence>
        {invoice && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Result header */}
            <div className="glass-card p-4 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Invoice Extracted</p>
                  <p className="text-xs text-muted-foreground">
                    {file?.name} · {file && formatFileSize(file.size)} ·{' '}
                    <span className={cn(
                      'font-medium',
                      (invoice.overall_confidence || 0) >= 80 ? 'text-green-500' : 'text-amber-500'
                    )}>
                      {Math.round(invoice.overall_confidence || 0)}% confidence
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditMode(!editMode)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-colors',
                    editMode
                      ? 'bg-primary text-white border-primary'
                      : 'border-border hover:bg-accent text-foreground'
                  )}
                >
                  <Edit3 className="w-4 h-4" />
                  {editMode ? 'Editing' : 'Edit Fields'}
                </button>
                <button
                  onClick={handleReset}
                  className="p-2 rounded-xl border border-border hover:bg-accent text-muted-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Preview + Fields */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              {/* Image preview */}
              {preview && (
                <div className="lg:col-span-2 glass-card overflow-hidden">
                  <div className="p-3 border-b border-border">
                    <p className="text-sm font-medium">Invoice Preview</p>
                  </div>
                  <div className="p-2">
                    <img
                      src={preview}
                      alt="Invoice"
                      className="w-full rounded-lg object-contain max-h-96"
                    />
                  </div>
                </div>
              )}

              {/* Extracted fields */}
              <div className={cn('glass-card', preview ? 'lg:col-span-3' : 'lg:col-span-5')}>
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <p className="font-medium text-foreground">Extracted Fields</p>
                  {(invoice.overall_confidence || 0) < 80 && (
                    <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-500/10 px-2.5 py-1 rounded-full">
                      <AlertTriangle className="w-3 h-3" />
                      Some fields need review
                    </div>
                  )}
                </div>
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {headerFields.map(({ key, label }) => {
                    const field = (editedInvoice as Record<string, InvoiceField>)?.[key as string];
                    if (!field) return null;
                    return (
                      <div key={key} className={cn(
                        'rounded-xl border p-3 transition-all',
                        field.confidence < 80 ? 'border-amber-500/30 bg-amber-500/5' : 'border-border'
                      )}>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-medium text-muted-foreground">{label}</label>
                          <ConfidenceBadge confidence={field.confidence} />
                        </div>
                        {editMode ? (
                          <input
                            value={field.value}
                            onChange={(e) => handleFieldEdit(key as string, e.target.value)}
                            className="w-full bg-transparent text-sm font-medium text-foreground border-b border-primary/30 focus:outline-none focus:border-primary pb-0.5"
                          />
                        ) : (
                          <p className="text-sm font-medium text-foreground truncate">
                            {field.value || <span className="text-muted-foreground italic">Not found</span>}
                          </p>
                        )}
                        {field.is_corrected && (
                          <p className="text-[10px] text-primary mt-1">✓ Corrected</p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Line Items */}
                {invoice.line_items && invoice.line_items.length > 0 && (
                  <div className="border-t border-border">
                    <div className="p-4">
                      <p className="font-medium text-foreground mb-3">
                        Line Items ({invoice.line_items.length})
                      </p>
                      <div className="overflow-x-auto rounded-xl border border-border">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-muted/50">
                              <th className="text-left p-2.5 font-semibold text-muted-foreground">Item</th>
                              <th className="text-right p-2.5 font-semibold text-muted-foreground">HSN</th>
                              <th className="text-right p-2.5 font-semibold text-muted-foreground">Qty</th>
                              <th className="text-right p-2.5 font-semibold text-muted-foreground">Rate</th>
                              <th className="text-right p-2.5 font-semibold text-muted-foreground">Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {invoice.line_items.map((item, i) => (
                              <tr key={item.id || i} className="border-t border-border">
                                <td className="p-2.5 text-foreground max-w-32 truncate">
                                  {item.description}
                                </td>
                                <td className="p-2.5 text-right text-muted-foreground">{item.hsn_code}</td>
                                <td className="p-2.5 text-right">{item.quantity} {item.unit}</td>
                                <td className="p-2.5 text-right">₹{item.rate}</td>
                                <td className="p-2.5 text-right font-medium">₹{item.total_amount}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action */}
                <div className="p-4 border-t border-border flex justify-between items-center">
                  {editMode && (
                    <button
                      onClick={() => setEditMode(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl border border-green-500/30 text-green-600 text-sm hover:bg-green-500/10 transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      Save edits
                    </button>
                  )}
                  <button
                    onClick={handleSaveAndCreateGRN}
                    className="ml-auto flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-brand text-white text-sm font-semibold shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity"
                  >
                    Create GRN from Invoice
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
