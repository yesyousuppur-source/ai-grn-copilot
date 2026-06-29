import OpenAI from 'openai';
import {
  ExtractedInvoice,
  GRNTemplate,
  TemplateField,
  TrainingPayload,
  ValidationError,
  GRNFieldValue,
  InvoiceLineItem,
} from '@/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// =============================================
// INVOICE OCR + EXTRACTION
// =============================================

export async function extractInvoiceData(
  imageBase64: string,
  mimeType: string,
  companyContext?: { training_data?: unknown[]; vendor_mappings?: unknown }
): Promise<Partial<ExtractedInvoice>> {
  const startTime = Date.now();

  const systemPrompt = `You are an expert OCR and invoice parsing AI for Indian businesses. 
Extract ALL data from the invoice image with maximum accuracy. 
Return a structured JSON object with confidence scores for each field.
Use Indian business context: GST, GSTIN, HSN codes, state codes, etc.

${companyContext?.training_data ? `Company-specific training context: ${JSON.stringify(companyContext.training_data).slice(0, 2000)}` : ''}

IMPORTANT: 
- Confidence scores must be 0-100
- Detect ALL line items in the invoice table
- Handle various date formats (DD/MM/YYYY, DD-MM-YYYY, etc.)
- Identify synonyms: Invoice No = Bill No = Challan No, Vendor = Supplier = Party Name
- Return ONLY valid JSON, no markdown`;

  const userPrompt = `Extract all invoice data from this image. Return JSON in this exact structure:
{
  "vendor_name": { "value": "string", "confidence": 0-100 },
  "vendor_gstin": { "value": "string", "confidence": 0-100 },
  "invoice_number": { "value": "string", "confidence": 0-100 },
  "invoice_date": { "value": "DD/MM/YYYY", "confidence": 0-100 },
  "po_number": { "value": "string", "confidence": 0-100 },
  "vehicle_number": { "value": "string", "confidence": 0-100 },
  "batch_number": { "value": "string", "confidence": 0-100 },
  "subtotal": { "value": "number as string", "confidence": 0-100 },
  "cgst_amount": { "value": "number as string", "confidence": 0-100 },
  "sgst_amount": { "value": "number as string", "confidence": 0-100 },
  "igst_amount": { "value": "number as string", "confidence": 0-100 },
  "total_tax": { "value": "number as string", "confidence": 0-100 },
  "total_amount": { "value": "number as string", "confidence": 0-100 },
  "discount": { "value": "number as string", "confidence": 0-100 },
  "line_items": [
    {
      "description": "string",
      "hsn_code": "string",
      "quantity": 0,
      "unit": "string",
      "rate": 0,
      "amount": 0,
      "gst_rate": 0,
      "gst_amount": 0,
      "total_amount": 0,
      "confidence": 0-100
    }
  ],
  "raw_text": "full extracted text",
  "overall_confidence": 0-100
}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 4096,
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${imageBase64}`,
              detail: 'high',
            },
          },
          { type: 'text', text: userPrompt },
        ],
      },
    ],
    response_format: { type: 'json_object' },
  });

  const processingTime = Date.now() - startTime;
  const raw = JSON.parse(response.choices[0].message.content || '{}');

  const makeField = (key: string) => ({
    key,
    label: key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    value: raw[key]?.value || '',
    confidence: raw[key]?.confidence || 0,
  });

  const lineItems: InvoiceLineItem[] = (raw.line_items || []).map(
    (item: Record<string, unknown>, idx: number) => ({
      id: `item_${idx}`,
      description: String(item.description || ''),
      hsn_code: String(item.hsn_code || ''),
      quantity: Number(item.quantity || 0),
      unit: String(item.unit || 'PCS'),
      rate: Number(item.rate || 0),
      amount: Number(item.amount || 0),
      gst_rate: Number(item.gst_rate || 0),
      gst_amount: Number(item.gst_amount || 0),
      total_amount: Number(item.total_amount || 0),
      confidence: Number(item.confidence || 80),
    })
  );

  return {
    vendor_name: makeField('vendor_name'),
    vendor_gstin: makeField('vendor_gstin'),
    invoice_number: makeField('invoice_number'),
    invoice_date: makeField('invoice_date'),
    po_number: makeField('po_number'),
    vehicle_number: makeField('vehicle_number'),
    batch_number: makeField('batch_number'),
    subtotal: makeField('subtotal'),
    cgst_amount: makeField('cgst_amount'),
    sgst_amount: makeField('sgst_amount'),
    igst_amount: makeField('igst_amount'),
    total_tax: makeField('total_tax'),
    total_amount: makeField('total_amount'),
    discount: makeField('discount'),
    line_items: lineItems,
    overall_confidence: raw.overall_confidence || 75,
    raw_text: raw.raw_text || '',
    processing_time_ms: processingTime,
    ocr_provider: 'openai',
  };
}

// =============================================
// TEMPLATE FIELD DETECTION
// =============================================

export async function detectTemplateFields(
  imageBase64: string,
  mimeType: string
): Promise<Partial<TemplateField>[]> {
  const systemPrompt = `You are an expert at analyzing GRN (Goods Receipt Note) forms and document templates.
Detect all fillable fields in this template image.
Return precise field positions as percentages of the document dimensions.
Identify field types accurately.
Return ONLY valid JSON, no markdown.`;

  const userPrompt = `Analyze this GRN template and detect all fields. Return JSON:
{
  "fields": [
    {
      "name": "camelCase field name",
      "label": "Human readable label",
      "type": "text|number|date|currency|percentage|hsn|gstin|phone|email|table|signature|checkbox",
      "required": true|false,
      "position": {
        "x": 0-100,
        "y": 0-100,
        "width": 5-50,
        "height": 2-10,
        "page": 1
      },
      "mapping": ["synonym1", "synonym2"],
      "ai_detected": true,
      "confidence": 0-100,
      "order": 1
    }
  ],
  "table_config": {
    "id": "main_table",
    "columns": ["description", "quantity", "rate", "amount"],
    "start_row": 60,
    "has_header": true
  },
  "page_count": 1
}

For Indian GRN forms, look for: Vendor/Supplier, Invoice No, Date, PO No, Vehicle No, 
Batch No, Material/Item, Quantity, Rate, Amount, GST, CGST, SGST, IGST, Total, 
Receiver Signature, Storekeeper, HSN, Description`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 4096,
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${imageBase64}`,
              detail: 'high',
            },
          },
          { type: 'text', text: userPrompt },
        ],
      },
    ],
    response_format: { type: 'json_object' },
  });

  const raw = JSON.parse(response.choices[0].message.content || '{"fields": []}');
  return raw.fields || [];
}

// =============================================
// AI AUTO-FILL GRN
// =============================================

export async function autoFillGRN(
  template: GRNTemplate,
  invoice: Partial<ExtractedInvoice>,
  trainingData: unknown[]
): Promise<GRNFieldValue[]> {
  const systemPrompt = `You are an expert at mapping invoice data to GRN (Goods Receipt Note) fields.
Map invoice fields to GRN template fields using semantic understanding.
DO NOT use hardcoded mappings - use AI semantic understanding.
Consider field labels, synonyms, and context.
Company-specific training data: ${JSON.stringify(trainingData).slice(0, 3000)}
Return ONLY valid JSON.`;

  const userPrompt = `Map this invoice data to the GRN template fields.

GRN Template Fields:
${JSON.stringify(
  template.fields.map((f) => ({ id: f.id, name: f.name, label: f.label, mapping: f.mapping })),
  null,
  2
)}

Extracted Invoice Data:
${JSON.stringify(invoice, null, 2)}

Return JSON:
{
  "field_values": [
    {
      "field_id": "template field id",
      "field_name": "field name",
      "value": "mapped value",
      "confidence": 0-100,
      "is_corrected": false,
      "source": "ai",
      "validation_status": "valid|warning|error|unchecked",
      "mapping_reason": "why this invoice field was mapped to this GRN field"
    }
  ]
}

Rules:
1. Map by semantic meaning, not exact name matches
2. Invoice No = Bill No = Challan = GRN Invoice Field
3. Vendor = Supplier = Party = Consignor
4. Material = Item = Description = Goods
5. Received Qty = Received Quantity = Actual Qty
6. If no match found, leave value empty with confidence 0`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 4096,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
  });

  const raw = JSON.parse(response.choices[0].message.content || '{"field_values": []}');
  return raw.field_values || [];
}

// =============================================
// VALIDATION ENGINE
// =============================================

export async function validateGRN(
  grnFieldValues: GRNFieldValue[],
  invoice: Partial<ExtractedInvoice>,
  previousGRNs: unknown[],
  companySettings: unknown
): Promise<ValidationError[]> {
  const systemPrompt = `You are an expert GRN validator for Indian warehouses and factories.
Detect ALL mismatches, errors and anomalies in the GRN data.
Be thorough and specific about each error.
Return ONLY valid JSON.`;

  const userPrompt = `Validate this GRN data and detect ALL errors:

GRN Field Values:
${JSON.stringify(grnFieldValues, null, 2)}

Original Invoice Data:
${JSON.stringify(invoice, null, 2)}

Previous GRNs for duplicate check:
${JSON.stringify(previousGRNs?.slice(0, 5), null, 2)}

Company Settings:
${JSON.stringify(companySettings, null, 2)}

Return JSON with validation errors:
{
  "errors": [
    {
      "field": "field name",
      "type": "quantity_mismatch|vendor_mismatch|po_mismatch|gst_mismatch|duplicate_invoice|missing_item|date_mismatch|rate_mismatch|custom",
      "severity": "error|warning|info",
      "message": "Clear explanation of the issue",
      "expected_value": "what was expected",
      "actual_value": "what was found",
      "ai_explanation": "Detailed explanation for user"
    }
  ],
  "validation_score": 0-100,
  "summary": "Overall validation summary"
}

Check for:
1. Quantity mismatch between PO quantity and received quantity
2. Vendor name mismatch between invoice and GRN
3. PO number mismatch
4. GST calculation errors (verify CGST+SGST=Total GST or IGST)
5. Duplicate invoice number
6. Missing mandatory items
7. Date sequence issues
8. Rate mismatches
9. Total amount calculation errors
10. GSTIN format validation (15 characters)
11. HSN code validation`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 2048,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
  });

  const raw = JSON.parse(response.choices[0].message.content || '{"errors": []}');
  return raw.errors || [];
}

// =============================================
// AI CHAT ASSISTANT
// =============================================

export async function chatWithGRNAssistant(
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
  context: {
    grn_data?: unknown;
    validation_errors?: ValidationError[];
    company_name?: string;
  }
): Promise<string> {
  const systemMessage = {
    role: 'system' as const,
    content: `You are an expert GRN (Goods Receipt Note) assistant for ${context.company_name || 'this company'}.
You help users understand GRN data, validation errors, GST calculations, and Indian business processes.
Be concise, helpful and specific. Use simple language.

Current GRN Context:
${context.grn_data ? JSON.stringify(context.grn_data, null, 2).slice(0, 2000) : 'No GRN loaded'}

Current Validation Issues:
${context.validation_errors ? JSON.stringify(context.validation_errors, null, 2) : 'No validation errors'}`,
  };

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 1024,
    messages: [systemMessage, ...messages.slice(-10)],
  });

  return response.choices[0].message.content || 'I could not generate a response.';
}

// =============================================
// TEMPLATE COMPARISON
// =============================================

export async function compareTemplates(
  oldTemplate: GRNTemplate,
  newTemplateFields: Partial<TemplateField>[]
): Promise<{
  recommendation: 'update' | 'new_version';
  changes: { field: string; change_type: string; description: string }[];
  reason: string;
  similarity_score: number;
}> {
  const systemPrompt = `You are an expert at comparing GRN template versions.
Analyze the differences and recommend whether to update the existing template or create a new version.
Return ONLY valid JSON.`;

  const userPrompt = `Compare these two GRN templates and recommend an action:

Existing Template (v${oldTemplate.version}):
${JSON.stringify(oldTemplate.fields.map((f) => ({ name: f.name, label: f.label, type: f.type })), null, 2)}

New Template Fields:
${JSON.stringify(newTemplateFields.map((f) => ({ name: f.name, label: f.label, type: f.type })), null, 2)}

Return JSON:
{
  "recommendation": "update|new_version",
  "changes": [
    {
      "field": "field name",
      "change_type": "added|removed|modified|renamed",
      "description": "What changed"
    }
  ],
  "reason": "Explanation for recommendation",
  "similarity_score": 0-100
}

Rules:
- If >80% fields match: recommend "update"
- If <80% fields match or major structural changes: recommend "new_version"
- Always explain the reasoning`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 1024,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
  });

  return JSON.parse(response.choices[0].message.content || '{}');
}

// =============================================
// AI TRAINING - LEARN FROM CORRECTIONS
// =============================================

export async function processTrainingCorrection(
  payload: TrainingPayload
): Promise<{ success: boolean; updated_mappings?: string[]; message: string }> {
  const systemPrompt = `You are an AI training system for GRN automation.
When a user corrects an AI field, analyze the correction and extract learning patterns.
Return ONLY valid JSON.`;

  const userPrompt = `A user corrected a GRN field. Extract learning patterns:

Field: "${payload.field_name}"
Original AI value: "${payload.original_value}"
Corrected value: "${payload.corrected_value}"
Invoice context (vendor): "${payload.vendor_name}"
Invoice data snippet: ${JSON.stringify(payload.invoice_context).slice(0, 500)}

Return JSON:
{
  "pattern_type": "value_correction|field_mapping|format_correction|vendor_specific",
  "learning_rule": "Description of what to learn",
  "updated_mappings": ["synonym1", "synonym2"],
  "vendor_specific": true|false,
  "confidence_boost": 5-20,
  "message": "What was learned"
}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 512,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
  });

  const raw = JSON.parse(response.choices[0].message.content || '{}');
  return {
    success: true,
    updated_mappings: raw.updated_mappings,
    message: raw.message || 'Training data recorded successfully',
  };
}

// =============================================
// SEMANTIC FIELD MAPPING
// =============================================

export async function semanticFieldMapping(
  invoiceFields: Record<string, string>,
  templateFields: TemplateField[]
): Promise<Record<string, string>> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 1024,
    messages: [
      {
        role: 'system',
        content: 'Map invoice fields to template fields using semantic understanding. Return ONLY valid JSON.',
      },
      {
        role: 'user',
        content: `Map these invoice fields to template fields:
Invoice fields: ${JSON.stringify(Object.keys(invoiceFields))}
Template fields: ${JSON.stringify(templateFields.map((f) => ({ id: f.id, label: f.label, mapping: f.mapping })))}

Return: { "invoice_field_name": "template_field_id" }
Use semantic understanding, not exact matching.`,
      },
    ],
    response_format: { type: 'json_object' },
  });

  return JSON.parse(response.choices[0].message.content || '{}');
}

export { openai };
