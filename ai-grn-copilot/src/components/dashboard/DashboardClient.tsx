'use client';

import { motion } from 'framer-motion';
import {
  FileText, Clock, CheckCircle2, AlertTriangle, TrendingUp,
  Upload, Plus, ArrowRight, Zap, BarChart3
} from 'lucide-react';
import Link from 'next/link';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { formatDate, formatCurrency, cn } from '@/lib/utils';
import { DashboardStats, GRNRecord, ActivityLog } from '@/types';

interface Props {
  stats: DashboardStats;
  recentGRNs: unknown[];
  recentActivity: unknown[];
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function DashboardClient({ stats, recentGRNs, recentActivity }: Props) {
  const statCards = [
    {
      label: "Today's GRNs",
      value: stats.today_grns,
      icon: FileText,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      trend: '+12%',
      trendUp: true,
    },
    {
      label: 'Pending Review',
      value: stats.pending_grns,
      icon: Clock,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
      trend: stats.pending_grns > 0 ? 'Action needed' : 'All clear',
      trendUp: false,
    },
    {
      label: 'Completed',
      value: stats.completed_grns,
      icon: CheckCircle2,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
      trend: '+8%',
      trendUp: true,
    },
    {
      label: 'Alerts',
      value: stats.alerts_count,
      icon: AlertTriangle,
      color: 'text-red-500',
      bg: 'bg-red-500/10',
      trend: stats.alerts_count === 0 ? 'No issues' : 'Check now',
      trendUp: false,
    },
  ];

  // Demo chart data if none
  const chartData = stats.grns_by_day.length > 0
    ? stats.grns_by_day
    : Array.from({ length: 7 }, (_, i) => ({
        date: formatDate(new Date(Date.now() - (6 - i) * 86400000), 'dd MMM'),
        count: Math.floor(Math.random() * 15) + 2,
      }));

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Welcome banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl gradient-brand p-6 text-white shadow-lg shadow-primary/20"
      >
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-5 h-5 text-yellow-300" />
            <p className="text-sm font-medium text-blue-100">AI GRN Copilot</p>
          </div>
          <h1 className="text-2xl font-bold mb-1">Good {getGreeting()}! 👋</h1>
          <p className="text-blue-100 text-sm">
            You have <span className="text-white font-bold">{stats.pending_grns} GRNs</span> pending review today.
          </p>
        </div>
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute -right-4 -bottom-12 w-52 h-52 rounded-full bg-white/5" />
        <div className="flex gap-3 mt-4 relative z-10">
          <Link
            href="/dashboard/invoices"
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors backdrop-blur-sm"
          >
            <Upload className="w-4 h-4" />
            Upload Invoice
          </Link>
          <Link
            href="/dashboard/grn"
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            New GRN
          </Link>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {statCards.map((card) => (
          <motion.div key={card.label} variants={item}>
            <div className="glass-card p-4 md:p-5 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', card.bg)}>
                  <card.icon className={cn('w-5 h-5', card.color)} />
                </div>
                <div className={cn(
                  'text-xs font-medium flex items-center gap-1',
                  card.trendUp ? 'text-green-500' : 'text-muted-foreground'
                )}>
                  {card.trendUp && <TrendingUp className="w-3 h-3" />}
                  {card.trend}
                </div>
              </div>
              <p className="text-3xl font-bold text-foreground">{card.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{card.label}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Chart + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* GRN Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-5 lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                GRN Activity
              </h2>
              <p className="text-xs text-muted-foreground">Last 7 days</p>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {stats.total_grns_month}
              <span className="text-sm font-normal text-muted-foreground ml-1">this month</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="colorGRN" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(221 83% 59%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(221 83% 59%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="hsl(221 83% 59%)"
                strokeWidth={2}
                fill="url(#colorGRN)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="glass-card p-5"
        >
          <h2 className="font-semibold text-foreground mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No activity yet</p>
            ) : (
              (recentActivity as ActivityLog[]).map((log, i) => (
                <div key={log.id || i} className="flex gap-3 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-foreground font-medium">{log.action}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDate(log.created_at, 'dd MMM, hh:mm a')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* Recent GRNs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card"
      >
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-semibold text-foreground">Recent GRNs</h2>
          <Link
            href="/dashboard/grn"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {recentGRNs.length === 0 ? (
          <div className="p-10 text-center">
            <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No GRNs yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Upload an invoice to generate your first GRN
            </p>
            <Link
              href="/dashboard/invoices"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl gradient-brand text-white text-sm font-medium shadow-lg shadow-primary/20"
            >
              <Upload className="w-4 h-4" />
              Upload Invoice
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {(recentGRNs as GRNRecord[]).map((grn) => (
              <Link
                key={grn.id}
                href={`/dashboard/grn/${grn.id}`}
                className="flex items-center gap-4 p-4 hover:bg-accent/50 transition-colors"
              >
                <div className={cn(
                  'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
                  grn.status === 'completed' ? 'bg-green-500/10' :
                  grn.status === 'pending_review' ? 'bg-amber-500/10' :
                  'bg-blue-500/10'
                )}>
                  <FileText className={cn(
                    'w-4 h-4',
                    grn.status === 'completed' ? 'text-green-500' :
                    grn.status === 'pending_review' ? 'text-amber-500' :
                    'text-blue-500'
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground">{grn.grn_number}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {formatDate(grn.created_at, 'dd MMM yyyy, hh:mm a')}
                  </p>
                </div>
                <StatusBadge status={grn.status} />
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; class: string }> = {
    draft: { label: 'Draft', class: 'bg-muted text-muted-foreground' },
    pending_review: { label: 'Pending', class: 'bg-amber-500/10 text-amber-600' },
    approved: { label: 'Approved', class: 'bg-blue-500/10 text-blue-600' },
    completed: { label: 'Completed', class: 'bg-green-500/10 text-green-600' },
    rejected: { label: 'Rejected', class: 'bg-red-500/10 text-red-600' },
  };
  const c = config[status] || config.draft;
  return (
    <span className={cn('text-xs font-medium px-2 py-1 rounded-lg', c.class)}>
      {c.label}
    </span>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
