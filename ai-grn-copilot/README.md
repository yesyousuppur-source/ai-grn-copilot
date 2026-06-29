# AI GRN Copilot 🤖📦

> Production-ready AI-powered GRN (Goods Receipt Note) automation platform for Indian factories, warehouses and stores.

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-Database-green)](https://supabase.com)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o-purple)](https://openai.com)
[![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38bdf8)](https://tailwindcss.com)

---

## ✨ Features

### 🔍 Invoice OCR
- Upload invoice PDF or image (camera or file)
- AI extracts: Vendor, Invoice No, Date, PO No, Material, Qty, GST, Rate, Total, Vehicle, Batch, HSN
- Multi-provider OCR: OpenAI GPT-4o Vision, Google Document AI, Mistral OCR
- Every field shows confidence score (0-100%)
- All fields are editable after extraction

### 📋 AI Template Learning Engine
- Upload blank GRN form — AI detects all fields automatically
- Add/remove/rename fields with visual editor
- AI remembers every company's format forever
- Template versioning — switch between old and new formats
- When you upload a new GRN format, AI compares and suggests: Update or New Version
- Unlimited template versions

### 🤖 AI Auto-Fill
- Automatically maps invoice data to GRN template fields
- Uses semantic understanding — Invoice No = Bill No, Vendor = Supplier
- No hardcoded mappings — AI understands synonyms contextually
- Shows confidence % for every auto-filled field
- Fields below 80% confidence are flagged for review

### ✅ Validation Engine
- Detects: Quantity mismatch, Vendor mismatch, PO mismatch, GST mismatch
- Duplicate invoice detection
- Missing items, Date mismatch, Rate mismatch
- Error/Warning/Info severity levels
- AI explains each validation error in plain language

### 🧠 Train AI
- Every time user corrects a field → "Train AI" button appears
- One click → AI permanently learns that correction for that company
- Next invoice from same vendor auto-fills correctly
- Accuracy score improves with every training

### 💬 AI Chat Assistant
- Floating chat widget on all pages
- Ask: "Why is this field highlighted?", "Explain GST mismatch"
- Context-aware — knows the current GRN and validation errors
- Powered by GPT-4o

### 📊 Dashboard
- Today's GRNs, Pending, Completed, Alerts
- 7-day activity chart
- Recent GRN list with status badges
- Recent activity feed

### 📁 History & Export
- Search and filter all GRNs
- Export GRN PDF, Invoice PDF, or Combined PDF
- Print support
- Duplicate any GRN

### 🏢 Company Management
- Multiple companies per account
- Each company has its own templates and training data
- Indian business fields: GSTIN, State, Address

### ⚙️ Settings
- Profile management
- OCR provider selection (OpenAI / Google / Mistral)
- AI provider selection (OpenAI / Anthropic)
- API key management
- Theme (Light / Dark / System)
- Notification preferences

### 📱 Mobile-First PWA
- Installable as Android/iOS app
- Camera capture for invoices
- Offline detection
- Auto-save drafts
- Glassmorphism UI

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone <repo-url>
cd ai-grn-copilot
npm install
```

### 2. Environment Variables

```bash
cp .env.example .env.local
```

Fill in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor**
3. Run `supabase/migrations/001_initial_schema.sql`
4. Run `supabase/migrations/002_storage_buckets.sql`
5. Enable **Email Auth** in Authentication settings

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/                # API routes
│   │   ├── invoices/       # OCR extraction
│   │   ├── grn/            # GRN CRUD + autofill + validate
│   │   ├── templates/      # Template management + AI detection
│   │   ├── train/          # AI training endpoint
│   │   ├── chat/           # AI assistant
│   │   ├── companies/      # Company management
│   │   ├── activity/       # Activity logs
│   │   ├── notifications/  # Notifications
│   │   └── settings/       # User settings
│   ├── auth/               # Login, Signup, Forgot Password
│   └── dashboard/          # All protected pages
│       ├── page.tsx         # Dashboard home
│       ├── invoices/        # Upload invoice
│       ├── grn/             # GRN list + new + detail
│       ├── templates/       # Template management
│       ├── history/         # History page
│       ├── companies/       # Company management
│       └── settings/        # Settings
├── components/
│   ├── layout/             # AppShell, Sidebar, Header
│   ├── dashboard/          # Dashboard widgets
│   ├── invoices/           # Invoice upload + extraction
│   ├── grn/                # GRN forms, validation, detail
│   ├── templates/          # Template editor
│   ├── companies/          # Company management
│   ├── chat/               # AI chat widget
│   ├── history/            # History page
│   ├── settings/           # Settings panels
│   └── shared/             # Reusable: Skeleton, Badges, etc.
├── lib/
│   ├── supabase/           # Client + server Supabase clients
│   ├── openai/             # GPT-4o service (OCR, fill, validate, train, chat)
│   ├── ocr/                # Multi-provider OCR orchestrator
│   ├── hooks/              # Custom React hooks
│   ├── utils/              # Helpers, formatters, offline storage
│   └── validations/        # Zod schemas
├── store/                  # Zustand state management
├── types/                  # TypeScript types + DB schema
└── styles/                 # Global CSS with design tokens
```

---

## 🗄️ Database Schema

| Table | Description |
|-------|-------------|
| `users` | User profiles (extends Supabase auth) |
| `companies` | Business entities with GSTIN |
| `company_members` | Multi-user company access |
| `grn_templates` | GRN form definitions with AI learning data |
| `extracted_invoices` | OCR results stored as JSONB |
| `grn_records` | Filled GRNs with validation results |
| `ai_training_data` | User corrections for AI learning |
| `activity_logs` | Audit trail |
| `notifications` | User notifications |

---

## 🔌 API Reference

### Invoice OCR
```
POST /api/invoices/extract
FormData: file, company_id, base64, mime_type
```

### GRN Auto-Fill
```
POST /api/grn/autofill
Body: { template_id, invoice_data, company_id }
```

### GRN Validation
```
POST /api/grn/validate
Body: { field_values, invoice_data, company_id }
```

### Train AI
```
POST /api/train
Body: { company_id, template_id, corrections, invoice_context }
```

### AI Chat
```
POST /api/chat
Body: { messages, context }
```

### Template Field Detection
```
POST /api/templates/detect
Body: { base64, mime_type, company_id }
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 App Router |
| Language | TypeScript 5 |
| Styling | Tailwind CSS + Glassmorphism |
| UI Components | Radix UI + Shadcn patterns |
| Animations | Framer Motion |
| Forms | React Hook Form + Zod |
| State | Zustand |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| AI | OpenAI GPT-4o |
| OCR | OpenAI Vision / Google Document AI / Mistral |
| Charts | Recharts |
| Deployment | Vercel |

---

## 🚢 Deploy to Vercel

```bash
vercel --prod
```

Add all environment variables in Vercel dashboard.

---

## 📝 License

MIT License — Built for Indian businesses 🇮🇳
