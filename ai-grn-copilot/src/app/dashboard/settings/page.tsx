import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import SettingsClient from '@/components/settings/SettingsClient';

export const metadata: Metadata = { title: 'Settings' };

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single();
  const { data: companies } = await supabase.from('companies').select('*').eq('owner_id', user.id);

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account, AI providers, and preferences</p>
      </div>
      <SettingsClient profile={profile as unknown as import('@/types').User} companies={companies as unknown as import('@/types').Company[]} />
    </div>
  );
}
