# Pashudhan Kavach — Backend & API Service (SIH26128)

Pashudhan Kavach is an intelligent livestock disease surveillance, epidemic early-warning, and digital animal health management platform built for farmers, veterinarians, paravets, diagnostic labs, and animal husbandry officials.

---

## 🛠 Tech Stack

- **Framework**: Next.js 13+ (App Router with TypeScript)
- **Database & Auth**: PostgreSQL via Supabase (Row Level Security enabled)
- **File Storage**: Supabase Storage (`symptom-media`, `health-cards`)
- **Email Service**: Resend API
- **Weather & Environmental Risk**: Open-Meteo API
- **Validation**: Zod (Strict schema validation on every endpoint)

---

## 📁 Project Architecture & Directory Structure

```
├── app/
│   ├── api/
│   │   ├── healthz/          # Health check endpoint
│   │   ├── auth/             # User registration & authentication
│   │   ├── animals/          # Animal registration & digital health cards
│   │   ├── chatbot/          # Multimodal Gemini diagnosis & MobileNet CV signals
│   │   ├── cron/             # 36-district village outbreak broadcast cron
│   │   ├── districts/        # District command telemetry, staff & risk overrides
│   │   ├── geo/              # 5-factor weighted GIS heatmap & spatial clusters
│   │   ├── symptoms/         # Instant triage & SLA ticket dispatch (PK-XXXXXX)
│   │   ├── webhooks/         # WhatsApp Cloud API webhook handshake & auto-reply
│   │   └── public/           # Unauthenticated public verification (QR code)
│   ├── (farmer & public)
│   │   ├── report/           # Zero-login frictionless symptom reporting page
│   │   ├── reports/[id]/track# Visual delivery-app case tracker & offline queue
│   │   ├── chatbot/          # AI conversational & live camera viewfinder
│   │   ├── channels/         # 4-channel delivery hub & browser IVR demo
│   │   └── heatmap/          # Interactive GIS epidemic surveillance map
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx              # Persona-split hero & 1962 emergency banner
├── lib/
│   ├── auth.ts               # Session retrieval & RBAC gating
│   ├── offlineStore.ts       # Native browser IndexedDB store-and-forward queue
│   ├── constants/            # Districts & 12-symptom clinical catalog (mr/hi/en)
│   ├── services/             # Deterministic triage, risk engine, weather & MobileNet
│   └── persistent-store.ts   # Dual cloud PostgreSQL + local offline store
└── types/
    └── database.types.ts     # TypeScript database schemas & entity models
```

---

## 🚀 Setup & Initialization

### 1. Environment Variables
Create `.env.local` with your configuration:
```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
RESEND_API_KEY=<your-resend-api-key>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Apply Database Migration
Copy the contents of `supabase/migrations/20260908000000_initial_schema.sql` and run it in the **Supabase SQL Editor** to create:
- 11 Core Database Tables
- PostgreSQL ENUMs
- Automatic `updated_at` triggers
- Foreign Key and Lookup indexes
- Row Level Security (RLS) Policies
- Storage Buckets (`symptom-media`, `health-cards`)

### 3. Development Server
```bash
npm run dev
```

Test health check:
```
GET http://localhost:3000/api/healthz
```
Contributed by Priyanshu Kumar ... 
Forked done.