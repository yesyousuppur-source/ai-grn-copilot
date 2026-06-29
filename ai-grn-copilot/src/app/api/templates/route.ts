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
    if (!companyId) return NextResponse.json({ error: 'company_id required' }, { status: 400 });

    const { data, error } = await supabase
      .from('grn_templates')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch templates';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const companyId = formData.get('company_id') as string;
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const fieldsRaw = formData.get('fields') as string;

    if (!companyId || !name || !fieldsRaw) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const fields = JSON.parse(fieldsRaw);
    let fileUrl = '';
    const templateId = uuidv4();

    // Upload file if present
    if (file) {
      const fileExt = file.name.split('.').pop() || 'pdf';
      const filePath = `${companyId}/templates/${templateId}.${fileExt}`;
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { error: uploadError } = await supabase.storage
        .from('template-files')
        .upload(filePath, buffer, { contentType: file.type });

      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('template-files').getPublicUrl(filePath);
        fileUrl = urlData.publicUrl;
      }
    }

    // Check if first template (make it default)
    const { count } = await supabase
      .from('grn_templates')
      .select('id', { count: 'exact' })
      .eq('company_id', companyId);

    const isDefault = (count || 0) === 0;

    const { data, error } = await supabase
      .from('grn_templates')
      .insert({
        id: templateId,
        company_id: companyId,
        name: name.trim(),
        description: description?.trim() || null,
        version: 1,
        is_active: true,
        is_default: isDefault,
        file_url: fileUrl || null,
        fields,
        page_count: 1,
        created_by: user.id,
        ai_learning_data: { training_count: 0, accuracy_score: 70, corrections: [] },
      })
      .select()
      .single();

    if (error) throw error;

    await supabase.from('activity_logs').insert({
      company_id: companyId,
      user_id: user.id,
      action: `Created template: ${name}`,
      entity_type: 'template',
      entity_id: templateId,
    });

    return NextResponse.json({ data }, { status: 201 });
  } catch (err: unknown) {
    console.error('Template save error:', err);
    const message = err instanceof Error ? err.message : 'Failed to save template';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
