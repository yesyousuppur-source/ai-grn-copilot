'use client';

import { cn, getConfidenceBg, getConfidenceLabel } from '@/lib/utils';

interface ConfidenceBadgeProps {
  confidence: number;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

export default function ConfidenceBadge({
  confidence,
  showLabel = false,
  size = 'sm',
}: ConfidenceBadgeProps) {
  const rounded = Math.round(confidence);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-medium rounded-full border',
        getConfidenceBg(confidence),
        size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1'
      )}
    >
      {rounded}%
      {showLabel && <span className="hidden sm:inline">· {getConfidenceLabel(confidence)}</span>}
    </span>
  );
}
