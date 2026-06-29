import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import CompaniesClient from '@/components/companies/CompaniesClient';

export const metadata: Metadata = { title: 'Companies' };

export default async function CompaniesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: companies } = await supabase
    .from('companies')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <CompaniesClient companies={companies || []} userId={user.id} />
    </div>
  );
}
