import { ExtractedInvoice } from '@/types';
import { extractInvoiceData } from '@/lib/openai/service';

export type OCRProvider = 'openai' | 'google' | 'mistral';

interface OCRConfig {
  provider: OCRProvider;
  apiKey?: string;
}

// =============================================
// GOOGLE DOCUMENT AI OCR
// =============================================
async function extractWithGoogleDocumentAI(
  imageBase64: string,
  mimeType: string,
  projectId: string,
  processorId: string,
  apiKey: string
): Promise<Record<string, unknown>> {
  const endpoint = `https://documentai.googleapis.com/v1/projects/${projectId}/locations/us/processors/${processorId}:process`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      rawDocument: {
        content: imageBase64,
        mimeType: mimeType,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Google Document AI error: ${response.statusText}`);
  }

  const result = await response.json();
  return result;
}

// =============================================
// MISTRAL OCR
// =============================================
async function extractWithMistralOCR(
  imageBase64: string,
  mimeType: string,
  apiKey: string
): Promise<Record<string, unknown>> {
  const response = await fetch('https://api.mistral.ai/v1/ocr', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'mistral-ocr-latest',
      document: {
        type: 'image_url',
        image_url: `data:${mimeType};base64,${imageBase64}`,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Mistral OCR error: ${response.statusText}`);
  }

  return response.json();
}

// =============================================
// MAIN OCR ORCHESTRATOR
// =============================================
export async function performOCR(
  imageBase64: string,
  mimeType: string,
  config: OCRConfig,
  companyContext?: { training_data?: unknown[]; vendor_mappings?: unknown }
): Promise<Partial<ExtractedInvoice>> {
  switch (config.provider) {
    case 'google': {
      const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID!;
      const processorId = process.env.GOOGLE_DOCUMENT_AI_PROCESSOR_ID!;
      const apiKey = config.apiKey || process.env.GOOGLE_CLOUD_API_KEY!;

      const rawResult = await extractWithGoogleDocumentAI(
        imageBase64,
        mimeType,
        projectId,
        processorId,
        apiKey
      );

      // Parse Google Document AI response into our format
      // Then use OpenAI to structure it properly
      const rawText = extractTextFromGoogleResponse(rawResult);
      return extractInvoiceData(imageBase64, mimeType, {
        ...companyContext,
        training_data: [
          ...(companyContext?.training_data || []),
          { source: 'google_ocr', raw_text: rawText },
        ],
      });
    }

    case 'mistral': {
      const apiKey = config.apiKey || process.env.MISTRAL_API_KEY!;
      const rawResult = await extractWithMistralOCR(imageBase64, mimeType, apiKey);
      const rawText = extractTextFromMistralResponse(rawResult);
      return extractInvoiceData(imageBase64, mimeType, {
        ...companyContext,
        training_data: [
          ...(companyContext?.training_data || []),
          { source: 'mistral_ocr', raw_text: rawText },
        ],
      });
    }

    case 'openai':
    default:
      return extractInvoiceData(imageBase64, mimeType, companyContext);
  }
}

function extractTextFromGoogleResponse(response: Record<string, unknown>): string {
  try {
    const document = response.document as Record<string, unknown>;
    return (document?.text as string) || '';
  } catch {
    return '';
  }
}

function extractTextFromMistralResponse(response: Record<string, unknown>): string {
  try {
    const pages = response.pages as Array<{ markdown?: string }>;
    return pages?.map((p) => p.markdown || '').join('\n') || '';
  } catch {
    return '';
  }
}

// =============================================
// IMAGE PREPROCESSING
// =============================================
export async function preprocessImage(
  buffer: Buffer,
  mimeType: string,
  maxSizeKB: number = 4096
): Promise<{ base64: string; mimeType: string }> {
  // If already small enough, return as-is
  const sizeKB = buffer.length / 1024;
  if (sizeKB <= maxSizeKB) {
    return {
      base64: buffer.toString('base64'),
      mimeType,
    };
  }

  // For server-side compression, return as-is (client handles compression)
  return {
    base64: buffer.toString('base64'),
    mimeType,
  };
}

// =============================================
// PDF TO IMAGE CONVERSION
// =============================================
export async function pdfPageToBase64(
  pdfBuffer: Buffer,
  pageNumber: number = 1
): Promise<{ base64: string; mimeType: string }> {
  // In production, use pdf2pic or similar
  // For now, return the PDF buffer directly for OpenAI Vision
  return {
    base64: pdfBuffer.toString('base64'),
    mimeType: 'application/pdf',
  };
}
