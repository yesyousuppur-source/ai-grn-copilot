import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { performOCR } from '@/lib/ocr/service';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const companyId = formData.get('company_id') as string;
    const base64 = formData.get('base64') as string;
    const mimeType = formData.get('mime_type') as string;

    if (!file || !companyId || !base64) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify company access
    const { data: company } = await supabase
      .from('companies')
      .select('id, settings')
      .eq('id', companyId)
      .single();

    if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    // Get company's user settings for OCR provider
    const { data: userProfile } = await supabase
      .from('users')
      .select('settings')
      .eq('id', user.id)
      .single();

    const ocrProvider = (userProfile?.settings as Record<string, string>)?.ocr_provider || 'openai';

    // Get training data for this company
    const { data: trainingData } = await supabase
      .from('ai_training_data')
      .select('field_name, original_value, corrected_value, invoice_context')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(50);

    // Upload file to Supabase Storage
    const fileExt = file.name.split('.').pop() || 'pdf';
    const filePath = `${companyId}/invoices/${uuidv4()}.${fileExt}`;

    const fileBuffer = Buffer.from(base64, 'base64');

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('invoice-files')
      .upload(filePath, fileBuffer, {
        contentType: mimeType,
        upsert: false,
      });

    let fileUrl = '';
    if (!uploadError && uploadData) {
      const { data: urlData } = supabase.storage
        .from('invoice-files')
        .getPublicUrl(filePath);
      fileUrl = urlData.publicUrl;
    }

    // Run OCR extraction
    const extracted = await performOCR(base64, mimeType, { provider: ocrProvider as 'openai' | 'google' | 'mistral' }, {
      training_data: trainingData || [],
    });

    // Save to database
    const invoiceId = uuidv4();
    const { error: dbError } = await supabase
      .from('extracted_invoices')
      .insert({
        id: invoiceId,
        company_id: companyId,
        file_url: fileUrl || '',
        file_name: file.name,
        ocr_provider: ocrProvider,
        extracted_data: extracted as unknown as Record<string, unknown>,
        overall_confidence: extracted.overall_confidence || 0,
        processing_time_ms: extracted.processing_time_ms || 0,
        created_by: user.id,
      });

    if (dbError) console.error('DB error saving invoice:', dbError);

    // Log activity
    await supabase.from('activity_logs').insert({
      company_id: companyId,
      user_id: user.id,
      action: `Extracted invoice: ${file.name}`,
      entity_type: 'invoice',
      entity_id: invoiceId,
    });

    return NextResponse.json({
      data: { ...extracted, id: invoiceId, file_url: fileUrl, file_name: file.name },
    });
  } catch (err: unknown) {
    console.error('Invoice extraction error:', err);
    const message = err instanceof Error ? err.message : 'Extraction failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
