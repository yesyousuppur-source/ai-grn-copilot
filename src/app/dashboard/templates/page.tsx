import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import TemplatesClient from '@/components/templates/TemplatesClient';

export const metadata: Metadata = { title: 'GRN Templates' };

export default async function TemplatesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: companies } = await supabase
    .from('companies')
    .select('id')
    .eq('owner_id', user.id)
    .limit(1);

  const companyId = companies?.[0]?.id;
  let templates = [];

  if (companyId) {
    const { data } = await supabase
      .from('grn_templates')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });
    templates = data || [];
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <TemplatesClient templates={templates} companyId={companyId || ''} />
    </div>
  );
}
