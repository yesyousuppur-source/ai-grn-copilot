import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { chatWithGRNAssistant } from '@/lib/openai/service';
import { ValidationError } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { messages, context } = await req.json();
    if (!messages?.length) {
      return NextResponse.json({ error: 'No messages provided' }, { status: 400 });
    }

    const reply = await chatWithGRNAssistant(messages, {
      grn_data: context?.grn_data,
      validation_errors: context?.validation_errors as ValidationError[],
      company_name: context?.company_name,
    });

    return NextResponse.json({ data: { reply } });
  } catch (err: unknown) {
    console.error('Chat error:', err);
    const message = err instanceof Error ? err.message : 'Chat failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
