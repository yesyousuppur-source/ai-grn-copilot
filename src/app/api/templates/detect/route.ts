import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { detectTemplateFields } from '@/lib/openai/service';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { base64, mime_type, company_id } = await req.json();
    if (!base64 || !mime_type) {
      return NextResponse.json({ error: 'Missing image data' }, { status: 400 });
    }

    const fields = await detectTemplateFields(base64, mime_type);

    return NextResponse.json({
      data: {
        fields,
        field_count: fields.length,
        message: `Detected ${fields.length} fields`,
      },
    });
  } catch (err: unknown) {
    console.error('Template detection error:', err);
    const message = err instanceof Error ? err.message : 'Detection failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
