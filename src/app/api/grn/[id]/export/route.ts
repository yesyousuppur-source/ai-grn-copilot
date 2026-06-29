import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'grn'; // grn | invoice | combined

    const { data: grn } = await supabase
      .from('grn_records')
      .select('*')
      .eq('id', id)
      .single();

    if (!grn) return NextResponse.json({ error: 'GRN not found' }, { status: 404 });

    const { data: template } = await supabase
      .from('grn_templates')
      .select('*')
      .eq('id', grn.template_id)
      .single();

    const { data: company } = await supabase
      .from('companies')
      .select('*')
      .eq('id', grn.company_id)
      .single();

    // Build HTML for PDF generation
    const html = generateGRNHTML(grn, template, company, type);

    // Return HTML with print-friendly content type
    // In production, use puppeteer or wkhtmltopdf for real PDF
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="${grn.grn_number}-${type}.html"`,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Export failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function generateGRNHTML(
  grn: Record<string, unknown>,
  template: Record<string, unknown> | null,
  company: Record<string, unknown> | null,
  type: string
): string {
  const fieldValues = (grn.field_values as Array<{ field_name: string; value: string }>) || [];
  const lineItems = (grn.line_items as Array<{
    description: string;
    hsn_code?: string;
    quantity: number;
    unit?: string;
    rate: number;
    gst_rate?: number;
    total_amount: number;
  }>) || [];

  const fieldsHTML = fieldValues
    .map(
      (fv) => `
      <tr>
        <td style="padding:6px 12px;border:1px solid #e2e8f0;font-weight:600;background:#f8fafc;width:40%">${fv.field_name}</td>
        <td style="padding:6px 12px;border:1px solid #e2e8f0">${fv.value || '—'}</td>
      </tr>`
    )
    .join('');

  const itemsHTML = lineItems
    .map(
      (item, i) => `
      <tr>
        <td style="padding:8px 12px;border:1px solid #e2e8f0;text-align:center">${i + 1}</td>
        <td style="padding:8px 12px;border:1px solid #e2e8f0">${item.description}</td>
        <td style="padding:8px 12px;border:1px solid #e2e8f0;text-align:center">${item.hsn_code || '—'}</td>
        <td style="padding:8px 12px;border:1px solid #e2e8f0;text-align:right">${item.quantity} ${item.unit || ''}</td>
        <td style="padding:8px 12px;border:1px solid #e2e8f0;text-align:right">₹${item.rate}</td>
        <td style="padding:8px 12px;border:1px solid #e2e8f0;text-align:center">${item.gst_rate || 0}%</td>
        <td style="padding:8px 12px;border:1px solid #e2e8f0;text-align:right;font-weight:600">₹${item.total_amount}</td>
      </tr>`
    )
    .join('');

  const total = lineItems.reduce((s, i) => s + i.total_amount, 0);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${grn.grn_number} - GRN</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 13px; color: #1a202c; padding: 20px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #3b6ef8; }
  .company-name { font-size: 22px; font-weight: 700; color: #3b6ef8; }
  .grn-number { font-size: 18px; font-weight: 700; text-align: right; }
  .grn-badge { display: inline-block; background: #3b6ef8; color: white; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; margin-bottom: 4px; }
  .section-title { font-size: 14px; font-weight: 700; color: #3b6ef8; margin: 20px 0 8px; text-transform: uppercase; letter-spacing: 0.5px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  th { background: #3b6ef8; color: white; padding: 8px 12px; text-align: left; font-size: 12px; }
  th:not(:first-child) { text-align: right; }
  .footer { margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }
  .sign-box { border-top: 1px solid #cbd5e0; padding-top: 8px; text-align: center; font-size: 11px; color: #718096; }
  .ai-badge { background: #f0f4ff; border: 1px solid #c7d7ff; border-radius: 8px; padding: 8px 12px; font-size: 11px; color: #3b6ef8; margin-top: 16px; }
  @media print { body { padding: 10px; } }
</style>
</head>
<body>
<div class="header">
  <div>
    <div class="company-name">${company?.name || 'Company'}</div>
    ${company?.gstin ? `<div style="color:#718096;font-size:12px">GSTIN: ${company.gstin}</div>` : ''}
    ${company?.address ? `<div style="color:#718096;font-size:12px">${company.address}</div>` : ''}
  </div>
  <div>
    <div class="grn-badge">GOODS RECEIPT NOTE</div>
    <div class="grn-number">${grn.grn_number}</div>
    <div style="color:#718096;font-size:12px;text-align:right">
      Template: ${template?.name || 'Standard'} v${template?.version || 1}
    </div>
  </div>
</div>

<div class="section-title">GRN Details</div>
<table>
  <tbody>${fieldsHTML}</tbody>
</table>

${lineItems.length > 0 ? `
<div class="section-title">Received Items</div>
<table>
  <thead>
    <tr>
      <th style="text-align:center;width:40px">#</th>
      <th>Description</th>
      <th style="text-align:center">HSN</th>
      <th style="text-align:right">Qty</th>
      <th style="text-align:right">Rate</th>
      <th style="text-align:center">GST%</th>
      <th style="text-align:right">Total</th>
    </tr>
  </thead>
  <tbody>${itemsHTML}</tbody>
  <tfoot>
    <tr>
      <td colspan="6" style="padding:8px 12px;border:1px solid #e2e8f0;text-align:right;font-weight:700;background:#f8fafc">Grand Total</td>
      <td style="padding:8px 12px;border:1px solid #e2e8f0;text-align:right;font-weight:700;color:#3b6ef8">₹${total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
    </tr>
  </tfoot>
</table>` : ''}

<div class="ai-badge">
  🤖 AI Confidence: ${Math.round((grn.ai_confidence as number) || 0)}% · 
  Validation Score: ${Math.round((grn.validation_score as number) || 0)}% · 
  Generated by AI GRN Copilot
</div>

<div class="footer">
  <div class="sign-box">Prepared By</div>
  <div class="sign-box">Checked By</div>
  <div class="sign-box">Authorized Signatory</div>
</div>

<div style="margin-top:20px;font-size:10px;color:#a0aec0;text-align:center">
  Generated by AI GRN Copilot · ${new Date().toLocaleString('en-IN')}
</div>
</body>
</html>`;
}
