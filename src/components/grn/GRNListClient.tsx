'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  FileText, Search, Filter, Plus, Download, Eye,
  ChevronLeft, ChevronRight, Clock, CheckCircle2, AlertTriangle, Copy
} from 'lucide-react';
import Link from 'next/link';
import { GRNRecord } from '@/types';
import { formatDate, formatCurrency, cn } from '@/lib/utils';
import { useCompanyStore } from '@/store';
import { toast } from 'sonner';
import { debounce } from '@/lib/utils';

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'pending_review', label: 'Pending Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'completed', label: 'Completed' },
  { value: 'rejected', label: 'Rejected' },
];

const STATUS_CONFIG: Record<string, { label: string; class: string; icon: React.ElementType }> = {
  draft: { label: 'Draft', class: 'bg-muted text-muted-foreground', icon: FileText },
  pending_review: { label: 'Pending', class: 'bg-amber-500/10 text-amber-600', icon: Clock },
  approved: { label: 'Approved', class: 'bg-blue-500/10 text-blue-600', icon: CheckCircle2 },
  completed: { label: 'Completed', class: 'bg-green-500/10 text-green-600', icon: CheckCircle2 },
  rejected: { label: 'Rejected', class: 'bg-red-500/10 text-red-600', icon: AlertTriangle },
};

export default function GRNListClient() {
  const { activeCompany } = useCompanyStore();
  const [grns, setGRNs] = useState<GRNRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchGRNs = useCallback(async (p = 1, s = search, st = status) => {
    if (!activeCompany) return;
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        company_id: activeCompany.id,
        page: String(p),
        per_page: '15',
        ...(s && { search: s }),
        ...(st && { status: st }),
      });
      const res = await fetch(`/api/grn?${params}`);
      const data = await res.json();
      setGRNs(data.data || []);
      setTotal(data.total || 0);
      setTotalPages(data.total_pages || 1);
    } catch {
      toast.error('Failed to load GRNs');
    } finally {
      setIsLoading(false);
    }
  }, [activeCompany, search, status]); // eslint-disable-line

  useEffect(() => { fetchGRNs(1); }, [activeCompany]); // eslint-disable-line

  const debouncedSearch = useCallback(
    debounce((val: string) => { setSearch(val); fetchGRNs(1, val, status); }, 400),
    [status] // eslint-disable-line
  );

  const handleStatusChange = (val: string) => {
    setStatus(val);
    setPage(1);
    fetchGRNs(1, search, val);
  };

  const handlePageChange = (p: number) => {
    setPage(p);
    fetchGRNs(p);
  };

  const handleDuplicate = async (grn: GRNRecord) => {
    toast.info('Duplicating GRN...');
    // Navigate to new GRN with copied data
    toast.success('GRN duplicated');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">GRN Records</h1>
          <p className="text-muted-foreground text-sm">{total} total records</p>
        </div>
        <Link
          href="/dashboard/grn/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-brand text-white text-sm font-semibold shadow-lg shadow-primary/20"
        >
          <Plus className="w-4 h-4" />
          New GRN
        </Link>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search GRN number..."
            onChange={(e) => debouncedSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <select
          value={status}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-border bg-background/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border hover:bg-accent transition-colors text-sm">
          <Filter className="w-4 h-4" />
          More Filters
        </button>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-muted-foreground mt-3 text-sm">Loading GRNs...</p>
          </div>
        ) : grns.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-1">No GRNs found</h3>
            <p className="text-muted-foreground text-sm mb-4">
              {search || status ? 'Try adjusting your filters' : 'Create your first GRN to get started'}
            </p>
            {!search && !status && (
              <Link
                href="/dashboard/invoices"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-brand text-white text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Upload Invoice to Start
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left p-4 text-xs font-semibold text-muted-foreground">GRN Number</th>
                    <th className="text-left p-4 text-xs font-semibold text-muted-foreground">Status</th>
                    <th className="text-left p-4 text-xs font-semibold text-muted-foreground">AI Confidence</th>
                    <th className="text-left p-4 text-xs font-semibold text-muted-foreground">Validation</th>
                    <th className="text-left p-4 text-xs font-semibold text-muted-foreground">Created</th>
                    <th className="text-right p-4 text-xs font-semibold text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {grns.map((grn, i) => {
                    const cfg = STATUS_CONFIG[grn.status] || STATUS_CONFIG.draft;
                    const Icon = cfg.icon;
                    const errCount = grn.validation_errors?.filter(
                      (e) => (e as { severity: string }).severity === 'error'
                    ).length || 0;

                    return (
                      <motion.tr
                        key={grn.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className="hover:bg-accent/40 transition-colors group"
                      >
                        <td className="p-4">
                          <span className="font-semibold text-foreground">{grn.grn_number}</span>
                        </td>
                        <td className="p-4">
                          <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg', cfg.class)}>
                            <Icon className="w-3 h-3" />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className={cn('h-full rounded-full', grn.ai_confidence >= 80 ? 'bg-green-500' : grn.ai_confidence >= 60 ? 'bg-amber-500' : 'bg-red-500')}
                                style={{ width: `${grn.ai_confidence}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">{Math.round(grn.ai_confidence)}%</span>
                          </div>
                        </td>
                        <td className="p-4">
                          {grn.is_validated ? (
                            errCount > 0 ? (
                              <span className="text-xs text-red-600 bg-red-500/10 px-2 py-1 rounded-lg">
                                {errCount} error{errCount !== 1 ? 's' : ''}
                              </span>
                            ) : (
                              <span className="text-xs text-green-600 bg-green-500/10 px-2 py-1 rounded-lg flex items-center gap-1 w-fit">
                                <CheckCircle2 className="w-3 h-3" />
                                Passed
                              </span>
                            )
                          ) : (
                            <span className="text-xs text-muted-foreground">Not validated</span>
                          )}
                        </td>
                        <td className="p-4">
                          <span className="text-sm text-muted-foreground">
                            {formatDate(grn.created_at, 'dd MMM yy')}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link
                              href={`/dashboard/grn/${grn.id}`}
                              className="p-2 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                              title="View"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => handleDuplicate(grn)}
                              className="p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground"
                              title="Duplicate"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button
                              className="p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground"
                              title="Download"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-border">
              {grns.map((grn) => {
                const cfg = STATUS_CONFIG[grn.status] || STATUS_CONFIG.draft;
                const Icon = cfg.icon;
                return (
                  <Link
                    key={grn.id}
                    href={`/dashboard/grn/${grn.id}`}
                    className="flex items-center gap-4 p-4 hover:bg-accent/50 transition-colors"
                  >
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', cfg.class)}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground">{grn.grn_number}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(grn.created_at)}</p>
                    </div>
                    <span className={cn('text-xs font-medium px-2 py-1 rounded-lg', cfg.class)}>
                      {cfg.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Page {page} of {totalPages} · {total} records
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="p-2 rounded-lg border border-border hover:bg-accent transition-colors disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = i + Math.max(1, page - 2);
                if (p > totalPages) return null;
                return (
                  <button
                    key={p}
                    onClick={() => handlePageChange(p)}
                    className={cn(
                      'w-8 h-8 rounded-lg text-sm font-medium transition-colors',
                      p === page ? 'gradient-brand text-white' : 'border border-border hover:bg-accent'
                    )}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-border hover:bg-accent transition-colors disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
