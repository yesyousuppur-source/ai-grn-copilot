import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AuthBackground from '@/components/shared/AuthBackground';

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <AuthBackground />
      <div className="relative z-10 w-full max-w-md px-4 py-12">
        {children}
      </div>
    </div>
  );
}
