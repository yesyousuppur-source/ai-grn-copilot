'use client';

import { AlertTriangle, Info, XCircle } from 'lucide-react';
import { ValidationError } from '@/types';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface Props {
  error: ValidationError;
}

const typeLabels: Record<string, string> = {
  quantity_mismatch: 'Quantity Mismatch',
  vendor_mismatch: 'Vendor Mismatch',
  po_mismatch: 'PO Mismatch',
  gst_mismatch: 'GST Mismatch',
  duplicate_invoice: 'Duplicate Invoice',
  missing_item: 'Missing Item',
  date_mismatch: 'Date Mismatch',
  rate_mismatch: 'Rate Mismatch',
  custom: 'Validation Error',
};

export default function ValidationCard({ error }: Props) {
  const [expanded, setExpanded] = useState(false);

  const config = {
    error: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' },
    warning: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  }[error.severity] || { icon: Info, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' };

  const Icon = config.icon;

  return (
    <div className={cn('rounded-xl border p-3 transition-all', config.bg, config.border)}>
      <div className="flex items-start gap-2">
        <Icon className={cn('w-4 h-4 flex-shrink-0 mt-0.5', config.color)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn('text-xs font-semibold', config.color)}>
              {typeLabels[error.type] || error.type}
            </span>
            <span className="text-xs text-muted-foreground">{error.field}</span>
          </div>
          <p className="text-xs text-foreground mt-0.5">{error.message}</p>
          {(error.expected_value || error.actual_value) && (
            <div className="mt-1 space-y-0.5">
              {error.expected_value && (
                <p className="text-[10px] text-muted-foreground">
                  Expected: <span className="text-green-600 font-medium">{error.expected_value}</span>
                </p>
              )}
              {error.actual_value && (
                <p className="text-[10px] text-muted-foreground">
                  Found: <span className="text-red-600 font-medium">{error.actual_value}</span>
                </p>
              )}
            </div>
          )}
          {error.ai_explanation && (
            <button
              onClick={() => setExpanded(!expanded)}
              className={cn('text-[10px] mt-1', config.color, 'hover:underline')}
            >
              {expanded ? 'Hide' : 'Why?'} AI explanation
            </button>
          )}
          {expanded && error.ai_explanation && (
            <p className="text-[10px] text-muted-foreground mt-1 bg-background/50 rounded-lg p-2">
              {error.ai_explanation}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
