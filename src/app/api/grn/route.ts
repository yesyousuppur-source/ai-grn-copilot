import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('company_id');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '20');
    const search = searchParams.get('search');

    if (!companyId) return NextResponse.json({ error: 'company_id required' }, { status: 400 });

    let query = supabase
      .from('grn_records')
      .select('*', { count: 'exact' })
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .range((page - 1) * perPage, page * perPage - 1);

    if (status) query = query.eq('status', status);
    if (search) query = query.ilike('grn_number', `%${search}%`);

    const { data, count, error } = await query;
    if (error) throw error;

    return NextResponse.json({
      data,
      total: count || 0,
      page,
      per_page: perPage,
      total_pages: Math.ceil((count || 0) / perPage),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch GRNs';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const {
      company_id, template_id, invoice_id, field_values, line_items,
      validation_errors, is_validated, validation_score, ai_confidence, status
    } = body;

    if (!company_id || !template_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Generate GRN number
    const { data: grnNumData } = await supabase
      .rpc('generate_grn_number', { p_company_id: company_id });

    const grnNumber = grnNumData || `GRN-${Date.now()}`;

    const grnId = uuidv4();
    const { data, error } = await supabase
      .from('grn_records')
      .insert({
        id: grnId,
        company_id,
        template_id,
        invoice_id: invoice_id || null,
        grn_number: grnNumber,
        status: status || 'draft',
        field_values: field_values || [],
        line_items: line_items || [],
        validation_errors: validation_errors || [],
        is_validated: is_validated || false,
        validation_score: validation_score || 0,
        ai_confidence: ai_confidence || 0,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await supabase.from('activity_logs').insert({
      company_id,
      user_id: user.id,
      action: `Created GRN: ${grnNumber}`,
      entity_type: 'grn',
      entity_id: grnId,
    });

    // Add notification
    await supabase.from('notifications').insert({
      user_id: user.id,
      title: 'GRN Created',
      message: `GRN ${grnNumber} has been created and is ${status === 'pending_review' ? 'pending review' : 'saved as draft'}`,
      type: 'success',
    });

    return NextResponse.json({ data }, { status: 201 });
  } catch (err: unknown) {
    console.error('GRN save error:', err);
    const message = err instanceof Error ? err.message : 'Failed to save GRN';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
