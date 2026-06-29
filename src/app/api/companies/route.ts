import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { name, gstin, address, city, state, pincode, phone, email } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Company name required' }, { status: 400 });
    }

    const companyId = uuidv4();
    const { data, error } = await supabase
      .from('companies')
      .insert({
        id: companyId,
        name: name.trim(),
        gstin: gstin || null,
        address: address || null,
        city: city || null,
        state: state || null,
        pincode: pincode || null,
        phone: phone || null,
        email: email || null,
        owner_id: user.id,
        settings: {
          auto_train: true,
          confidence_threshold: 80,
          duplicate_check: true,
          auto_save: true,
          gst_validation: true,
          po_validation: true,
        },
      })
      .select()
      .single();

    if (error) throw error;

    // Add owner as member
    await supabase.from('company_members').insert({
      company_id: companyId,
      user_id: user.id,
      role: 'owner',
      invited_by: user.id,
    });

    return NextResponse.json({ data }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create company';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
