import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();

    const { data: profile } = await supabase
      .from('users')
      .select('settings')
      .eq('id', user.id)
      .single();

    const current = (profile?.settings as Record<string, unknown>) || {};

    const { data, error } = await supabase
      .from('users')
      .update({ settings: { ...current, ...body } })
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
