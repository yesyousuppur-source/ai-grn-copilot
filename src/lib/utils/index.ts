import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO, isValid } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, fmt: string = 'dd/MM/yyyy'): string {
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return isValid(d) ? format(d, fmt) : String(date);
  } catch {
    return String(date);
  }
}

export function formatCurrency(amount: number | string, currency: string = 'INR'): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(num);
}

export function formatNumber(num: number | string): string {
  const n = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(n)) return '0';
  return new Intl.NumberFormat('en-IN').format(n);
}

export function getConfidenceColor(confidence: number): string {
  if (confidence >= 90) return 'text-green-500';
  if (confidence >= 80) return 'text-yellow-500';
  if (confidence >= 60) return 'text-orange-500';
  return 'text-red-500';
}

export function getConfidenceBg(confidence: number): string {
  if (confidence >= 90) return 'bg-green-500/10 text-green-600 border-green-500/20';
  if (confidence >= 80) return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
  if (confidence >= 60) return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
  return 'bg-red-500/10 text-red-600 border-red-500/20';
}

export function getConfidenceLabel(confidence: number): string {
  if (confidence >= 90) return 'High';
  if (confidence >= 80) return 'Medium';
  if (confidence >= 60) return 'Low';
  return 'Very Low';
}

export function generateId(): string {
  return uuidv4();
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function validateGSTIN(gstin: string): boolean {
  const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return regex.test(gstin);
}

export function validatePAN(pan: string): boolean {
  const regex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return regex.test(pan);
}

export function validateHSN(hsn: string): boolean {
  return /^[0-9]{4,8}$/.test(hsn);
}

export function calculateGST(amount: number, rate: number): {
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
} {
  const gstAmount = (amount * rate) / 100;
  return {
    cgst: gstAmount / 2,
    sgst: gstAmount / 2,
    igst: gstAmount,
    total: gstAmount,
  };
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce(
    (groups, item) => {
      const groupKey = String(item[key]);
      return {
        ...groups,
        [groupKey]: [...(groups[groupKey] || []), item],
      };
    },
    {} as Record<string, T[]>
  );
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard) {
    return navigator.clipboard.writeText(text);
  }
  const el = document.createElement('textarea');
  el.value = text;
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
  return Promise.resolve();
}

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Puducherry',
];

export const GRN_FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'currency', label: 'Currency (₹)' },
  { value: 'percentage', label: 'Percentage (%)' },
  { value: 'hsn', label: 'HSN Code' },
  { value: 'gstin', label: 'GSTIN' },
  { value: 'phone', label: 'Phone' },
  { value: 'email', label: 'Email' },
  { value: 'table', label: 'Table' },
  { value: 'signature', label: 'Signature' },
  { value: 'checkbox', label: 'Checkbox' },
];
