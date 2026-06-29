import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { autoFillGRN } from '@/lib/openai/service';
import { GRNTemplate } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { template_id, invoice_data, company_id } = await req.json();
    if (!template_id || !invoice_data || !company_id) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Get template
    const { data: template, error: tmplErr } = await supabase
      .from('grn_templates')
      .select('*')
      .eq('id', template_id)
      .single();

    if (tmplErr || !template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Get company training data
    const { data: trainingData } = await supabase
      .from('ai_training_data')
      .select('*')
      .eq('company_id', company_id)
      .eq('template_id', template_id)
      .order('created_at', { ascending: false })
      .limit(100);

    const grnTemplate = template as unknown as GRNTemplate;
    const fieldValues = await autoFillGRN(grnTemplate, invoice_data, trainingData || []);

    // Calculate confidence
    const avgConfidence =
      fieldValues.reduce((sum, f) => sum + f.confidence, 0) / (fieldValues.length || 1);

    return NextResponse.json({
      data: {
        field_values: fieldValues,
        ai_confidence: avgConfidence,
        template_name: template.name,
        template_version: template.version,
      },
    });
  } catch (err: unknown) {
    console.error('Autofill error:', err);
    const message = err instanceof Error ? err.message : 'Auto-fill failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
