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
│   │   ├── symptom-reports/  # Disease reporting & triage analysis
│   │   └── public/           # Unauthenticated public verification (QR code)
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   ├── auth.ts               # Session retrieval & RBAC gating
│   ├── api-response.ts       # Unified JSON responses
│   ├── validation.ts         # Zod schemas, coordinates, pagination
│   ├── email.ts              # Resend integration
│   ├── services/             # Deterministic triage & surveillance engines
│   └── supabase/
│       ├── client.ts         # Browser client
│       └── server.ts         # Authenticated & Admin server clients
├── supabase/
│   └── migrations/           # SQL database migrations & RLS policies
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

