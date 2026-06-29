import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import GRNDetailClient from '@/components/grn/GRNDetailClient';

export const metadata: Metadata = { title: 'GRN Detail' };

export default async function GRNDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: grn } = await supabase
    .from('grn_records')
    .select('*')
    .eq('id', id)
    .single();

  if (!grn) notFound();

  const { data: template } = await supabase
    .from('grn_templates')
    .select('*')
    .eq('id', grn.template_id)
    .single();

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <GRNDetailClient grn={grn as unknown as import('@/types').GRNRecord} template={template as unknown as import('@/types').GRNTemplate} />
    </div>
  );
}
