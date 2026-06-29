import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('company_id');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!companyId) return NextResponse.json({ error: 'company_id required' }, { status: 400 });

    const { data, error } = await supabase
      .from('activity_logs')
      .select(`
        *,
        users:user_id (full_name, avatar_url)
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
