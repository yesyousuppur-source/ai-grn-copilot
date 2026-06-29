import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import DashboardClient from '@/components/dashboard/DashboardClient';

export const metadata: Metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Get active company
  const { data: companies } = await supabase
    .from('companies')
    .select('id')
    .eq('owner_id', user.id)
    .limit(1);

  const companyId = companies?.[0]?.id;

  let stats = {
    today_grns: 0, pending_grns: 0, completed_grns: 0,
    alerts_count: 0, accuracy_rate: 0, total_grns_month: 0,
    top_vendors: [] as { name: string; count: number }[],
    grns_by_day: [] as { date: string; count: number }[],
    validation_error_types: [] as { type: string; count: number }[],
  };

  let recentGRNs: unknown[] = [];
  let recentActivity: unknown[] = [];

  if (companyId) {
    const today = new Date().toISOString().split('T')[0];
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

    const [todayRes, pendingRes, completedRes, monthRes, recentRes, activityRes] =
      await Promise.all([
        supabase.from('grn_records').select('id', { count: 'exact' })
          .eq('company_id', companyId).gte('created_at', today),
        supabase.from('grn_records').select('id', { count: 'exact' })
          .eq('company_id', companyId).in('status', ['draft', 'pending_review']),
        supabase.from('grn_records').select('id', { count: 'exact' })
          .eq('company_id', companyId).eq('status', 'completed'),
        supabase.from('grn_records').select('id', { count: 'exact' })
          .eq('company_id', companyId).gte('created_at', monthStart),
        supabase.from('grn_records').select('*')
          .eq('company_id', companyId).order('created_at', { ascending: false }).limit(5),
        supabase.from('activity_logs').select('*')
          .eq('company_id', companyId).order('created_at', { ascending: false }).limit(10),
      ]);

    stats.today_grns = todayRes.count || 0;
    stats.pending_grns = pendingRes.count || 0;
    stats.completed_grns = completedRes.count || 0;
    stats.total_grns_month = monthRes.count || 0;
    recentGRNs = recentRes.data || [];
    recentActivity = activityRes.data || [];
  }

  return (
    <DashboardClient
      stats={stats}
      recentGRNs={recentGRNs}
      recentActivity={recentActivity}
    />
  );
}
