import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;

    const { data, error } = await supabase
      .from('grn_records')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ data });
  } catch (err: unknown) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;

    const body = await req.json();
    const updateData: Record<string, unknown> = { ...body };

    if (body.status === 'approved') {
      updateData.approved_by = user.id;
      updateData.approved_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('grn_records')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Log activity
    const { data: grnData } = await supabase
      .from('grn_records')
      .select('company_id, grn_number')
      .eq('id', id)
      .single();

    if (grnData) {
      await supabase.from('activity_logs').insert({
        company_id: grnData.company_id,
        user_id: user.id,
        action: `Updated GRN ${grnData.grn_number}: ${body.status || 'edited'}`,
        entity_type: 'grn',
        entity_id: id,
      });
    }

    return NextResponse.json({ data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Update failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;

    const { error } = await supabase.from('grn_records').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Delete failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
