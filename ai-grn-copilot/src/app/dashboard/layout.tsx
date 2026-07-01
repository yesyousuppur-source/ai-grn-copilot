import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AppShell from '@/components/layout/AppShell';
import { User, Company } from '@/types';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  const { data: memberRows } = await supabase
    .from('company_members')
    .select('company_id')
    .eq('user_id', user.id);

  const memberIds = memberRows?.map((r: any) => r.company_id) || [];

  let companiesQuery = supabase.from('companies').select('*');
  if (memberIds.length > 0) {
    companiesQuery = companiesQuery.or(
      `owner_id.eq.${user.id},id.in.(${memberIds.join(',')})`
    );
  } else {
    companiesQuery = companiesQuery.eq('owner_id', user.id);
  }

  const { data: companies } = await companiesQuery;

  const defaultUser: User = {
    id: user.id,
    email: user.email || '',
    full_name: user.user_metadata?.full_name || '',
    role: 'owner',
    created_at: '',
    updated_at: '',
    settings: {
      theme: 'system',
      notifications_email: true,
      notifications_push: true,
      ocr_provider: 'openai',
      ai_provider: 'openai',
    },
  };

  return (
    <AppShell
      user={(profile as unknown as User) || defaultUser}
      companies={(companies as unknown as Company[]) || []}
    >
      {children}
    </AppShell>
  );
}
