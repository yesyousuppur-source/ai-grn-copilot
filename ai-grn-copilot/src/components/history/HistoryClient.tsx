'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  History, Search, Download, Eye, Calendar, Filter,
  FileText, CheckCircle2, Clock, AlertTriangle, Brain
} from 'lucide-react';
import Link from 'next/link';
import { GRNRecord } from '@/types';
import { formatDate, cn } from '@/lib/utils';
import { useCompanyStore } from '@/store';
import { toast } from 'sonner';

export default function HistoryClient() {
  const { activeCompany } = useCompanyStore();
  const [grns, setGRNs] = useState<GRNRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState('30');

  useEffect(() => {
    if (activeCompany) loadHistory();
  }, [activeCompany]); // eslint-disable-line

  const loadHistory = async () => {
    if (!activeCompany) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/grn?company_id=${activeCompany.id}&per_page=50`);
      const data = await res.json();
      setGRNs(data.data || []);
    } catch {
      toast.error('Failed to load history');
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = grns.filter((g) => {
    const matchSearch = !search || g.grn_number.toLowerCase().includes(search.toLowerCase());
    const matchDate = dateRange === 'all' || (
      new Date(g.created_at) > new Date(Date.now() - parseInt(dateRange) * 86400000)
    );
    return matchSearch && matchDate;
  });

  const stats = {
    total: filtered.length,
    completed: filtered.filter((g) => g.status === 'completed').length,
    avgConfidence: filtered.length
      ? Math.round(filtered.reduce((s, g) => s + g.ai_confidence, 0) / filtered.length)
      : 0,
    withErrors: filtered.filter((g) =>
      (g.validation_errors as Array<{ severity: string }>)?.some((e) => e.severity === 'error')
    ).length,
  };

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total GRNs', value: stats.total, icon: History, color: 'text-primary' },
          { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: 'text-green-500' },
          { label: 'Avg AI Score', value: `${stats.avgConfidence}%`, icon: Brain, color: 'text-violet-500' },
          { label: 'Had Errors', value: stats.withErrors, icon: AlertTriangle, color: 'text-red-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass-card p-4">
            <Icon className={cn('w-5 h-5 mb-2', color)} />
            <p className={cn('text-2xl font-bold', color)}>{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-40">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search GRN..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-border bg-background/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="all">All time</option>
        </select>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border hover:bg-accent transition-colors text-sm">
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* GRN list */}
      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-muted-foreground mt-3 text-sm">Loading history...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <History className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="font-semibold text-foreground">No records found</p>
            <p className="text-muted-foreground text-sm mt-1">
              {search ? 'Try a different search term' : 'No GRNs in the selected period'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((grn, i) => {
              const errCount = (grn.validation_errors as Array<{ severity: string }>)
                ?.filter((e) => e.severity === 'error').length || 0;
              const statusConfig: Record<string, string> = {
                draft: 'bg-muted text-muted-foreground',
                pending_review: 'bg-amber-500/10 text-amber-600',
                approved: 'bg-blue-500/10 text-blue-600',
                completed: 'bg-green-500/10 text-green-600',
                rejected: 'bg-red-500/10 text-red-600',
              };

              return (
                <motion.div
                  key={grn.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="flex items-center gap-4 p-4 hover:bg-accent/40 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-foreground">{grn.grn_number}</span>
                      <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', statusConfig[grn.status] || statusConfig.draft)}>
                        {grn.status.replace('_', ' ')}
                      </span>
                      {errCount > 0 && (
                        <span className="text-xs text-red-600 bg-red-500/10 px-2 py-0.5 rounded-full">
                          {errCount} error{errCount !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {formatDate(grn.created_at, 'dd MMM yyyy')}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Brain className="w-3 h-3" />
                        {Math.round(grn.ai_confidence)}% AI
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link
                      href={`/dashboard/grn/${grn.id}`}
                      className="p-2 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <button className="p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
