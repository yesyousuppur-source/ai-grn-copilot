import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(6, 'Minimum 6 characters'),
});

export const signupSchema = z
  .object({
    full_name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Valid email required'),
    password: z.string().min(8, 'Minimum 8 characters'),
    confirm_password: z.string(),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });

export const companySchema = z.object({
  name: z.string().min(2, 'Company name required'),
  gstin: z
    .string()
    .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GSTIN format')
    .optional()
    .or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().regex(/^[1-9][0-9]{5}$/, 'Invalid pincode').optional().or(z.literal('')),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
});

export const templateSchema = z.object({
  name: z.string().min(2, 'Template name required'),
  description: z.string().optional(),
});

export const templateFieldSchema = z.object({
  name: z.string().min(1, 'Field name required'),
  label: z.string().min(1, 'Label required'),
  type: z.enum(['text', 'number', 'date', 'currency', 'percentage', 'hsn', 'gstin', 'phone', 'email', 'table', 'signature', 'checkbox']),
  required: z.boolean().default(false),
  mapping: z.array(z.string()).default([]),
});

export type LoginData = z.infer<typeof loginSchema>;
export type SignupData = z.infer<typeof signupSchema>;
export type CompanyData = z.infer<typeof companySchema>;
export type TemplateData = z.infer<typeof templateSchema>;
export type TemplateFieldData = z.infer<typeof templateFieldSchema>;
