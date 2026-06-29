// ============================================================
// CORE DOMAIN TYPES
// ============================================================

export type UserRole = 'owner' | 'admin' | 'manager' | 'operator' | 'viewer';

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  phone?: string;
  role: UserRole;
  company_id?: string;
  created_at: string;
  updated_at: string;
  settings: UserSettings;
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  notifications_email: boolean;
  notifications_push: boolean;
  default_company_id?: string;
  ocr_provider: 'google' | 'mistral' | 'openai';
  ai_provider: 'openai' | 'anthropic';
}

// ============================================================
// COMPANY
// ============================================================

export interface Company {
  id: string;
  name: string;
  gstin?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  email?: string;
  logo_url?: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  settings: CompanySettings;
  _member_count?: number;
  _template_count?: number;
}

export interface CompanySettings {
  auto_train: boolean;
  confidence_threshold: number;
  duplicate_check: boolean;
  auto_save: boolean;
  gst_validation: boolean;
  po_validation: boolean;
}

export interface CompanyMember {
  id: string;
  company_id: string;
  user_id: string;
  role: UserRole;
  invited_by: string;
  joined_at: string;
  user?: User;
}

// ============================================================
// GRN TEMPLATE
// ============================================================

export type FieldType =
  | 'text'
  | 'number'
  | 'date'
  | 'currency'
  | 'percentage'
  | 'hsn'
  | 'gstin'
  | 'phone'
  | 'email'
  | 'table'
  | 'signature'
  | 'checkbox';

export interface TemplateField {
  id: string;
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  position: { x: number; y: number; width: number; height: number; page: number };
  mapping: string[];        // synonyms / alternative names
  default_value?: string;
  validation?: FieldValidation;
  ai_detected: boolean;
  confidence?: number;
  is_table_column?: boolean;
  table_id?: string;
  order: number;
}

export interface FieldValidation {
  min?: number;
  max?: number;
  pattern?: string;
  custom_rule?: string;
}

export interface GRNTemplate {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  version: number;
  is_active: boolean;
  is_default: boolean;
  file_url?: string;
  thumbnail_url?: string;
  fields: TemplateField[];
  table_config?: TableConfig;
  page_count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  ai_learning_data?: AILearningData;
}

export interface TableConfig {
  id: string;
  columns: string[];
  start_row: number;
  has_header: boolean;
}

export interface AILearningData {
  training_count: number;
  accuracy_score: number;
  last_trained_at: string;
  corrections: CorrectionRecord[];
}

export interface CorrectionRecord {
  field_id: string;
  original_value: string;
  corrected_value: string;
  invoice_context: string;
  timestamp: string;
}

// ============================================================
// INVOICE OCR
// ============================================================

export interface InvoiceField {
  key: string;
  label: string;
  value: string;
  confidence: number;
  bounding_box?: BoundingBox;
  page?: number;
  is_corrected?: boolean;
  original_value?: string;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  hsn_code?: string;
  quantity: number;
  unit?: string;
  rate: number;
  amount: number;
  gst_rate?: number;
  gst_amount?: number;
  total_amount: number;
  confidence: number;
}

export interface ExtractedInvoice {
  id: string;
  file_url: string;
  file_name: string;
  ocr_provider: string;
  extracted_at: string;

  // Header fields
  vendor_name: InvoiceField;
  vendor_gstin: InvoiceField;
  invoice_number: InvoiceField;
  invoice_date: InvoiceField;
  po_number: InvoiceField;
  vehicle_number: InvoiceField;
  batch_number: InvoiceField;
  delivery_date?: InvoiceField;
  dispatch_date?: InvoiceField;

  // Financial
  subtotal: InvoiceField;
  cgst_amount: InvoiceField;
  sgst_amount: InvoiceField;
  igst_amount: InvoiceField;
  total_tax: InvoiceField;
  total_amount: InvoiceField;
  discount?: InvoiceField;

  // Line items
  line_items: InvoiceLineItem[];

  // Meta
  overall_confidence: number;
  raw_text?: string;
  processing_time_ms: number;
}

// ============================================================
// GRN RECORD
// ============================================================

export type GRNStatus = 'draft' | 'pending_review' | 'approved' | 'rejected' | 'completed';

export interface ValidationError {
  field: string;
  type: 'quantity_mismatch' | 'vendor_mismatch' | 'po_mismatch' | 'gst_mismatch' |
        'duplicate_invoice' | 'missing_item' | 'date_mismatch' | 'rate_mismatch' | 'custom';
  severity: 'error' | 'warning' | 'info';
  message: string;
  expected_value?: string;
  actual_value?: string;
  ai_explanation?: string;
}

export interface GRNFieldValue {
  field_id: string;
  field_name: string;
  value: string;
  confidence: number;
  is_corrected: boolean;
  original_value?: string;
  source: 'ai' | 'manual' | 'default';
  validation_status: 'valid' | 'warning' | 'error' | 'unchecked';
}

export interface GRNRecord {
  id: string;
  company_id: string;
  template_id: string;
  invoice_id?: string;
  grn_number: string;
  status: GRNStatus;

  // Filled data
  field_values: GRNFieldValue[];
  line_items: InvoiceLineItem[];

  // Validation
  validation_errors: ValidationError[];
  is_validated: boolean;
  validation_score: number;

  // Files
  invoice_file_url?: string;
  grn_file_url?: string;
  combined_pdf_url?: string;

  // AI
  ai_confidence: number;
  ai_notes?: string;

  // Metadata
  created_by: string;
  approved_by?: string;
  created_at: string;
  updated_at: string;
  approved_at?: string;
  received_at?: string;

  // Relations
  template?: GRNTemplate;
  invoice?: ExtractedInvoice;
  company?: Company;
}

// ============================================================
// AI TRAINING
// ============================================================

export interface TrainingPayload {
  company_id: string;
  template_id: string;
  field_id: string;
  field_name: string;
  original_value: string;
  corrected_value: string;
  invoice_context: Partial<ExtractedInvoice>;
  vendor_name?: string;
}

export interface TrainingResult {
  success: boolean;
  message: string;
  updated_mappings?: string[];
  accuracy_improvement?: number;
}

// ============================================================
// CHAT / AI ASSISTANT
// ============================================================

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  context?: {
    grn_id?: string;
    validation_errors?: ValidationError[];
    field_name?: string;
  };
}

export interface ChatSession {
  id: string;
  company_id: string;
  grn_id?: string;
  messages: ChatMessage[];
  created_at: string;
}

// ============================================================
// DASHBOARD / ANALYTICS
// ============================================================

export interface DashboardStats {
  today_grns: number;
  pending_grns: number;
  completed_grns: number;
  alerts_count: number;
  accuracy_rate: number;
  total_grns_month: number;
  top_vendors: { name: string; count: number }[];
  grns_by_day: { date: string; count: number }[];
  validation_error_types: { type: string; count: number }[];
}

export interface ActivityLog {
  id: string;
  company_id: string;
  user_id: string;
  action: string;
  entity_type: 'grn' | 'template' | 'invoice' | 'company' | 'user';
  entity_id: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  user?: Pick<User, 'full_name' | 'avatar_url'>;
}

// ============================================================
// API RESPONSES
// ============================================================

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// ============================================================
// FORM TYPES
// ============================================================

export interface LoginFormData {
  email: string;
  password: string;
}

export interface SignupFormData {
  full_name: string;
  email: string;
  password: string;
  confirm_password: string;
}

export interface CompanyFormData {
  name: string;
  gstin?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  email?: string;
}

// ============================================================
// UPLOAD
// ============================================================

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  path: string;
  uploaded_at: string;
}

export interface ProcessingStatus {
  stage: 'uploading' | 'ocr' | 'ai_processing' | 'validation' | 'complete' | 'error';
  progress: number;
  message: string;
  error?: string;
}

// ============================================================
// NOTIFICATIONS
// ============================================================

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  link?: string;
  created_at: string;
}
