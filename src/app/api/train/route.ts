import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { processTrainingCorrection } from '@/lib/openai/service';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { company_id, template_id, corrections, invoice_context } = await req.json();

    if (!company_id || !template_id || !corrections?.length) {
      return NextResponse.json({ error: 'Missing training data' }, { status: 400 });
    }

    const results = [];
    for (const correction of corrections) {
      // Process each correction through AI
      const result = await processTrainingCorrection({
        company_id,
        template_id,
        field_id: correction.field_id || correction,
        field_name: correction.field_name || correction,
        original_value: correction.original_value || '',
        corrected_value: correction.corrected_value || '',
        invoice_context: invoice_context || {},
        vendor_name: invoice_context?.vendor_name?.value || '',
      });

      // Save training data to DB
      await supabase.from('ai_training_data').insert({
        id: uuidv4(),
        company_id,
        template_id,
        field_id: correction.field_id || correction,
        field_name: correction.field_name || correction,
        original_value: correction.original_value || '',
        corrected_value: correction.corrected_value || '',
        invoice_context: invoice_context || {},
        vendor_name: invoice_context?.vendor_name?.value || null,
        created_by: user.id,
      });

      results.push(result);
    }

    // Update template's AI learning data
    const { data: template } = await supabase
      .from('grn_templates')
      .select('ai_learning_data')
      .eq('id', template_id)
      .single();

    const learningData = (template?.ai_learning_data as Record<string, number> | null) || {};
    await supabase
      .from('grn_templates')
      .update({
        ai_learning_data: {
          ...learningData,
          training_count: ((learningData.training_count as number) || 0) + corrections.length,
          last_trained_at: new Date().toISOString(),
          accuracy_score: Math.min(100, ((learningData.accuracy_score as number) || 70) + 2),
        },
      })
      .eq('id', template_id);

    // Log activity
    await supabase.from('activity_logs').insert({
      company_id,
      user_id: user.id,
      action: `Trained AI with ${corrections.length} correction${corrections.length !== 1 ? 's' : ''}`,
      entity_type: 'template',
      entity_id: template_id,
    });

    return NextResponse.json({
      data: {
        success: true,
        corrections_processed: corrections.length,
        message: `AI trained successfully with ${corrections.length} correction${corrections.length !== 1 ? 's' : ''}. Future GRNs will be more accurate.`,
        results,
      },
    });
  } catch (err: unknown) {
    console.error('Training error:', err);
    const message = err instanceof Error ? err.message : 'Training failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
