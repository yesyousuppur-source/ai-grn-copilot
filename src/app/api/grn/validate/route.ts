import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateGRN } from '@/lib/openai/service';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { field_values, invoice_data, company_id } = await req.json();
    if (!field_values || !company_id) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Get company settings
    const { data: company } = await supabase
      .from('companies')
      .select('settings')
      .eq('id', company_id)
      .single();

    // Get recent GRNs for duplicate check
    const { data: recentGRNs } = await supabase
      .from('grn_records')
      .select('grn_number, field_values, created_at')
      .eq('company_id', company_id)
      .order('created_at', { ascending: false })
      .limit(20);

    const errors = await validateGRN(
      field_values,
      invoice_data || {},
      recentGRNs || [],
      company?.settings || {}
    );

    const errorCount = errors.filter((e) => e.severity === 'error').length;
    const validationScore = Math.max(0, 100 - errorCount * 15);

    return NextResponse.json({
      data: {
        errors,
        validation_score: validationScore,
        is_valid: errorCount === 0,
      },
    });
  } catch (err: unknown) {
    console.error('Validation error:', err);
    const message = err instanceof Error ? err.message : 'Validation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
