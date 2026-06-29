'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, CheckCircle2, XCircle, Download, Printer, Brain,
  AlertTriangle, Clock, FileText, Eye, Share2, MoreVertical
} from 'lucide-react';
import Link from 'next/link';
import { GRNRecord, GRNTemplate, GRNFieldValue, ValidationError } from '@/types';
import { formatDate, formatCurrency, cn } from '@/lib/utils';
import { toast } from 'sonner';
import ValidationCard from './ValidationCard';
import ConfidenceBadge from '@/components/shared/ConfidenceBadge';

interface Props {
  grn: GRNRecord;
  template: GRNTemplate | null;
}

const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  draft: { label: 'Draft', class: 'bg-muted text-muted-foreground' },
  pending_review: { label: 'Pending Review', class: 'bg-amber-500/10 text-amber-600' },
  approved: { label: 'Approved', class: 'bg-blue-500/10 text-blue-600' },
  completed: { label: 'Completed', class: 'bg-green-500/10 text-green-600' },
  rejected: { label: 'Rejected', class: 'bg-red-500/10 text-red-600' },
};

export default function GRNDetailClient({ grn: initialGRN, template }: Props) {
  const [grn, setGRN] = useState<GRNRecord>(initialGRN);
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState<'fields' | 'items' | 'validation' | 'ai'>('fields');

  const cfg = STATUS_CONFIG[grn.status] || STATUS_CONFIG.draft;
  const fieldValues = (grn.field_values || []) as GRNFieldValue[];
  const validationErrors = (grn.validation_errors || []) as ValidationError[];
  const lineItems = (grn.line_items || []) as Array<{
    description: string; hsn_code?: string; quantity: number;
    unit?: string; rate: number; gst_rate?: number; total_amount: number;
  }>;
  const errors = validationErrors.filter((e) => e.severity === 'error');
  const warnings = validationErrors.filter((e) => e.severity === 'warning');

  const updateStatus = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/grn/${grn.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Update failed');
      const { data } = await res.json();
      setGRN(data);
      toast.success(`GRN ${newStatus === 'approved' ? 'approved' : 'rejected'}`);
    } catch {
      toast.error('Status update failed');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleExport = async (type: 'grn' | 'invoice' | 'combined') => {
    toast.info(`Generating ${type} PDF...`);
    try {
      const res = await fetch(`/api/grn/${grn.id}/export?type=${type}`);
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${grn.grn_number}-${type}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF downloaded');
    } catch {
      toast.error('Export failed');
    }
  };

  const handlePrint = () => window.print();

  const tabs = [
    { key: 'fields', label: `Fields (${fieldValues.length})` },
    { key: 'items', label: `Items (${lineItems.length})` },
    { key: 'validation', label: `Validation (${validationErrors.length})` },
    { key: 'ai', label: 'AI Notes' },
  ] as const;

  return (
    <div className="space-y-5 no-print">
      {/* Header */}
      <div className="flex items-center gap-4 flex-wrap">
        <Link href="/dashboard/grn" className="p-2 rounded-xl hover:bg-accent transition-colors text-muted-foreground">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-foreground">{grn.grn_number}</h1>
            <span className={cn('text-xs font-medium px-2.5 py-1 rounded-lg', cfg.class)}>
              {cfg.label}
            </span>
            {grn.is_validated && errors.length === 0 && (
              <span className="text-xs text-green-600 bg-green-500/10 px-2 py-1 rounded-lg flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Validated
              </span>
            )}
            {errors.length > 0 && (
              <span className="text-xs text-red-600 bg-red-500/10 px-2 py-1 rounded-lg flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {errors.length} Error{errors.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Created {formatDate(grn.created_at, 'dd MMM yyyy, hh:mm a')}
            {template && ` · ${template.name} v${template.version}`}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {grn.status === 'pending_review' && (
            <>
              <button
                onClick={() => updateStatus('rejected')}
                disabled={isUpdating}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-500/30 text-red-600 text-sm hover:bg-red-500/10 transition-colors"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
              <button
                onClick={() => updateStatus('approved')}
                disabled={isUpdating}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-500 text-white text-sm hover:bg-green-600 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                Approve
              </button>
            </>
          )}
          <div className="relative group">
            <button className="p-2 rounded-xl border border-border hover:bg-accent transition-colors">
              <MoreVertical className="w-4 h-4" />
            </button>
            <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-xl shadow-xl z-10 overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
              <button onClick={() => handleExport('grn')} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-accent transition-colors">
                <Download className="w-4 h-4" />
                Download GRN PDF
              </button>
              <button onClick={() => handleExport('invoice')} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-accent transition-colors">
                <FileText className="w-4 h-4" />
                Download Invoice PDF
              </button>
              <button onClick={() => handleExport('combined')} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-accent transition-colors">
                <Eye className="w-4 h-4" />
                Combined PDF
              </button>
              <button onClick={handlePrint} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-accent transition-colors">
                <Printer className="w-4 h-4" />
                Print
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'AI Confidence', value: `${Math.round(grn.ai_confidence)}%`, icon: Brain, color: 'text-primary' },
          { label: 'Validation Score', value: `${Math.round(grn.validation_score)}%`, icon: CheckCircle2, color: 'text-green-500' },
          { label: 'Errors', value: errors.length, icon: XCircle, color: 'text-red-500' },
          { label: 'Warnings', value: warnings.length, icon: AlertTriangle, color: 'text-amber-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon className={cn('w-4 h-4', color)} />
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
            <p className={cn('text-2xl font-bold', color)}>{value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="glass-card overflow-hidden">
        <div className="flex border-b border-border overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex-shrink-0 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {activeTab === 'fields' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {fieldValues.map((fv) => (
                <div key={fv.field_id} className={cn(
                  'rounded-xl border p-3',
                  fv.is_corrected ? 'border-green-500/30 bg-green-500/5' : 'border-border'
                )}>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-muted-foreground">{fv.field_name}</label>
                    <ConfidenceBadge confidence={fv.confidence} />
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    {fv.value || <span className="text-muted-foreground italic text-xs">Empty</span>}
                  </p>
                  {fv.is_corrected && (
                    <p className="text-[10px] text-green-600 mt-1">✓ Manually corrected</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'items' && (
            lineItems.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-6">No line items</p>
            ) : (
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
                    {lineItems.map((item, i) => (
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
                      <td colSpan={5} className="p-3 font-semibold text-right">Grand Total</td>
                      <td className="p-3 text-right font-bold text-primary">
                        {formatCurrency(lineItems.reduce((s, i) => s + i.total_amount, 0))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )
          )}

          {activeTab === 'validation' && (
            validationErrors.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-3" />
                <p className="font-semibold text-foreground">All validations passed!</p>
                <p className="text-sm text-muted-foreground mt-1">No issues found in this GRN</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {validationErrors.map((err, i) => (
                  <ValidationCard key={i} error={err} />
                ))}
              </div>
            )
          )}

          {activeTab === 'ai' && (
            <div className="space-y-4">
              <div className="glass p-4 rounded-xl border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="w-4 h-4 text-primary" />
                  <p className="font-medium text-foreground text-sm">AI Analysis Notes</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {grn.ai_notes || 'No AI notes for this GRN. The AI processed this invoice and filled the fields automatically.'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="glass-card p-4">
                  <p className="text-xs text-muted-foreground mb-1">Fields Auto-Filled</p>
                  <p className="text-2xl font-bold text-foreground">
                    {fieldValues.filter((f) => f.source === 'ai').length}
                  </p>
                </div>
                <div className="glass-card p-4">
                  <p className="text-xs text-muted-foreground mb-1">Fields Corrected</p>
                  <p className="text-2xl font-bold text-foreground">
                    {fieldValues.filter((f) => f.is_corrected).length}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
