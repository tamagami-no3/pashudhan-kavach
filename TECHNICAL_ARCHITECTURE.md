# Pashudhan Kavach (पशुधन कवच) — Full Technical Architecture & System Documentation

> **SIH 2026 Grand Finale — Technical Dossier for Jury & Evaluators**  
> *Maharashtra State Livestock Health, Epidemic Surveillance & Digital Animal Passport Platform*

---

## 1. Executive Summary

**Pashudhan Kavach** is an enterprise-grade, full-stack digital veterinary infrastructure designed for the Department of Animal Husbandry, Government of Maharashtra. The platform digitizes the entire livestock lifecycle across Maharashtra's 36 districts:
- **Early Disease Detection**: AI-assisted multimodal disease screening (symptoms + visual image recognition).
- **Epidemic Surveillance**: Real-time GIS risk heatmap correlated with Open-Meteo meteorological vectors.
- **Identity & Records**: 12-digit Bharat Pashudhan–compliant Tag UID with tamper-evident QR Digital Health Passports.
- **Diagnostics & Triage**: Automated lab sample tracking pipeline with forward-only status machines.
- **Rural Resilience**: Offline store-and-forward synchronization and browser-based IVR voice interface for non-smartphone farmers.

---

## 2. Complete Technology Stack

```mermaid
graph TD
    Client[Client Devices: Web / Mobile PWA / IVR] --> NextServer[Next.js 13.5 App Router Backend]
    NextServer --> AuthLayer[RBAC Middleware & Session Handler]
    AuthLayer --> BusinessLogic[Core Engines]
    BusinessLogic --> TriageEngine[Disease Triage Engine]
    BusinessLogic --> RiskEngine[GIS Outbreak & Weather Risk Engine]
    BusinessLogic --> GeminiAI[Google Gemini 2.0 Flash Multimodal API]
    BusinessLogic --> SupabaseDB[(PostgreSQL / Supabase + Local JSON Store)]
    BusinessLogic --> NotifyService[Resend Email / SMS / In-App Broadcast]
    BusinessLogic --> OpenMeteo[Open-Meteo Weather API]
```

### Frontend Architecture
- **Framework**: Next.js 13.5 (React 18, App Router, TypeScript 5.2).
- **Styling & UI**: Tailwind CSS 3.3, Lucide React icons, Radix UI primitives (`@radix-ui/*`), Shadcn-style components.
- **Charts & Mapping**: Recharts 2.12 (analytical distribution bar/pie charts), Leaflet 1.9 (GIS spatial rendering).
- **Internationalization (i18n)**: Native client-side reactive trilingual engine supporting **Marathi (`mr`)**, **Hindi (`hi`)**, and **English (`en`)**.
- **Voice / Telephony Demo**: Web Speech API (`SpeechSynthesisUtterance`) with dialect-matched synthesis (`mr-IN`, `hi-IN`, `en-IN`).

### Backend Architecture & API Layer
- **Runtime**: Next.js Node.js Serverless Route Handlers (`app/api/**/route.ts`).
- **Data Validation**: Zod 3.23 schema validation with strict GPS bounding boxes (India coordinates `lat: 6–38`, `lng: 68–98`) and 12-digit numeric Tag UID regex.
- **Rate Limiting**: Sliding-window in-memory IP/User-level rate limiters on authentication and reporting routes.
- **Logging**: Structured, sanitized request duration & audit logging middleware.

### AI / ML & External Integrations
- **Multimodal LLM**: Google Gemini 2.0 Flash (`gemini-2.0-flash`) with structured JSON schema enforcement (`response_mime_type: "application/json"`).
- **Rule-Based Triage Engine**: Deterministic fallback expert system recognizing 7 critical Maharashtra livestock diseases (FMD, LSD, PPR, Brucellosis, Anthrax, Black Quarter, HS).
- **Weather Telemetry**: Open-Meteo REST API (ambient temperature, humidity, rainfall) for vector-borne risk scoring.
- **QR Engine**: Server-side & client-side QR generation via `qrcode` package.
- **Notification Services**: Resend API integration for email alerts + in-app notification dispatch.

### Database & Storage
- **Primary Cloud DB**: Supabase (PostgreSQL 15) with Row-Level Security (RLS) policies.
- **Local Fallback DB**: `lib/persistent-store.ts` file-based JSON persistence engine (`data/db.json`) ensuring 100% functionality in offline or local demo mode without cloud dependency.

---

## 3. Core Architectural Deep-Dives

### A. 4-Tier Role-Based Access Control (RBAC) & IDOR Defense

The platform enforces strict role separation across 4 user personas + 1 public layer:

| Role | Permissions & Scope | Restricted Boundaries |
|---|---|---|
| **Farmer (पशुपालक)** | View owned animals, download Health Passports, report symptoms, receive advisories, use AI Chatbot & IVR. | Cannot access raw lab cases or state analytics summaries (HTTP 403). Cannot access other farmers' animals (IDOR blocked). |
| **Veterinarian (पशुवैद्यक)** | Review district triage cases, issue treatments & vaccinations, publish official district advisories, view district analytics. | Cannot modify administrative master settings or override lab diagnostic test results. |
| **Lab Technician (लॅब)** | Update lab sample status (`collected` → `in_transit` → `received` → `testing` → `completed`), upload diagnostic findings. | Cannot publish farmer advisories or alter livestock ownership records. |
| **State Admin (प्रशासक)** | Full state-level visibility: 36-district analytics, outbreak heatmaps, user audits, exportable Excel/CSV reports. | All actions logged with audit trails. |
| **Public / Citizen** | Instant animal passport verification via `/api/public/verify/[tag_uid]` and public community advisory board. | Owner personal data & phone numbers scrubbed from responses. |

**Code Implementation Reference**:
- Enforced via [`lib/auth.ts:requireRole()`](file:///c:/sih2026/project/lib/auth.ts#L212-L234) and [`lib/role-features.ts`](file:///c:/sih2026/project/lib/role-features.ts).

---

### B. AI Multimodal Disease Screening Engine (`Pashudhan Sahayak`)

- **Route**: [`app/api/chatbot/diagnose/route.ts`](file:///c:/sih2026/project/app/api/chatbot/diagnose/route.ts)
- **UI**: [`app/chatbot/page.tsx`](file:///c:/sih2026/project/app/chatbot/page.tsx)

```mermaid
sequenceDiagram
    autonumber
    actor Farmer as Farmer / Paravet
    participant ChatUI as Chatbot UI (Web/Mobile)
    participant API as /api/chatbot/diagnose
    participant Gemini as Gemini 2.0 Flash API
    participant RuleEngine as Deterministic Triage Fallback

    Farmer->>ChatUI: Inputs Symptoms + Attaches Photo
    ChatUI->>ChatUI: Converts Image to base64
    ChatUI->>API: POST { message, imageBase64, language: 'mr' }
    
    alt Gemini API Key Available
        API->>Gemini: generateContent(system_instruction, multimodal_parts, response_mime_type="application/json")
        Gemini-->>API: JSON { reply, predicted_disease, confidence_level, alert_level, precautions }
    else Gemini Key Missing / Network Error
        API->>RuleEngine: Run Rule-Based Pattern Match
        RuleEngine-->>API: JSON Diagnostic Fallback
    end

    API-->>ChatUI: Strict Structured JSON
    ChatUI-->>Farmer: Renders Urgent Alert Banner + Disease Tag + Precautions Checklist
```

#### Diagnostic Rules Covered
1. **Foot & Mouth Disease (FMD / लाळ्या खुरकूत)**: Mouth vesicles, foot lesions, salivation, lameness.
2. **Lumpy Skin Disease (LSD / लंपी)**: Cutaneous nodular lumps (2–5 cm), edema, fever, reduced milk.
3. **Peste des Petits Ruminants (PPR)**: Goat/sheep necrotic stomatitis, foul diarrhea, discharge.
4. **Brucellosis**: Late abortions, retained placenta (zoonotic safety warnings issued).
5. **Anthrax (अँथ्रॅक्स - CRITICAL)**: Sudden death, unclotted dark blood from orifices → Immediate quarantine alert, post-mortem prohibition, 1962 SOS call.
6. **Black Quarter (BQ / फऱ्या)**: Crepitating hot swellings on shoulder/thigh, severe toxaemia.
7. **Haemorrhagic Septicaemia (HS / घटसर्प)**: Throat edema, snoring respiration, high mortality.

---

### C. GIS Outbreak Risk Engine & Meteorological Correlation

- **Route**: [`app/api/geo/heatmap/route.ts`](file:///c:/sih2026/project/app/api/geo/heatmap/route.ts)
- **Engine**: [`lib/services/riskEngine.ts`](file:///c:/sih2026/project/lib/services/riskEngine.ts)

The risk engine computes a real-time risk score ($0–100$) for all 36 Maharashtra districts using weighted epidemiological and environmental factors:

$$\text{Risk Score} = \min\Big(100,\, \sum (\text{Severity} \times \text{RiskWeight}) + \text{WeatherRiskBonus} - \text{VaccinationDeduction}\Big)$$

1. **Active Flags Weighting**: Critical alerts ($+30$), High ($+20$), Medium ($+10$).
2. **Meteorological Vector Bonus**:
   - High humidity ($>80\%$) + warm temperatures ($24–35^\circ\text{C}$) elevate vector breeding (LSD mosquitoes/ticks).
   - Heavy rainfall increases standing water risks for bacterial clostridial spores (Anthrax/BQ).
3. **Division Centroid Batching**: Queries 6 revenue division centroids (Konkan, Pune, Nashik, Chhatrapati Sambhajinagar, Amravati, Nagpur) to optimize third-party API rate limits.

---

### D. Digital Animal Health Passport & Public Verification

- **Endpoint**: [`/api/public/verify/[tag_uid]`](file:///c:/sih2026/project/app/api/public/verify/[tag_uid]/route.ts)
- **Card Endpoint**: [`/api/animals/[id]/health-card`](file:///c:/sih2026/project/app/api/animals/[id]/health-card/route.ts)

1. **Tag UID**: 12-digit numeric identifier compliant with the National Digital Livestock Mission (NDLM / Bharat Pashudhan).
2. **QR Code Verification**: Scannable QR code embedded on the animal profile linking to a public cryptographic verification route.
3. **Data Scrubbing**: Allows cattle buyers or checkposts to verify breed, age, vaccination history, and active health status without leaking private farmer contact numbers.

---

### E. Store-and-Forward Offline Synchronization

- **Push Endpoint**: [`/api/sync/push`](file:///c:/sih2026/project/app/api/sync/push/route.ts)
- **Pull Endpoint**: [`/api/sync/pull`](file:///c:/sih2026/project/app/api/sync/pull/route.ts)

In remote rural villages with zero 4G connectivity:
1. Client devices store field vaccination records and symptom reports in local IndexedDB / local storage.
2. When network connectivity resumes, the client pushes a batch array to `/api/sync/push`.
3. The server processes entries via a **Last-Write-Wins (LWW)** strategy, logs entries in `sync_queue_items`, and explicitly flags conflicting updates for veterinary review rather than silently dropping data.

---

### F. Omni-Channel Architecture (Web, Mobile PWA, Offline, IVR Voice)

- **UI**: [`app/channels/page.tsx`](file:///c:/sih2026/project/app/channels/page.tsx)

```mermaid
graph LR
    subgraph Channels[4 Delivery Channels]
        C1[1. Web Command Portal]
        C2[2. Installable Mobile PWA]
        C3[3. Offline Sync Queue]
        C4[4. IVR Voice Helpline]
    end

    subgraph Backend[Pashudhan Kavach Platform]
        API[Next.js App Router Backend]
        DB[(Supabase / Persistent Store)]
    end

    C1 --> API
    C2 --> API
    C3 --> API
    C4 -.->|Web Speech API Demo / Telephony Gateway| API
    API --> DB
```

- **Interactive IVR Voice Demo**: Integrated browser speech synthesis simulating dial-in IVR helpline (1962). Supports touch-tone menu navigation (1: FMD, 2: LSD, 3: Emergency Anthrax Quarantine, 4: Repeat Menu) in all 3 languages.

---

## 4. Database Schema & Data Models

The database consists of 8 interconnected entities:

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│      users      │1     *│     animals     │1     *│ health_records  │
│─────────────────│───────│─────────────────│───────│─────────────────│
│ id (UUID)       │       │ id (UUID)       │       │ id (UUID)       │
│ email           │       │ tag_uid (CHAR12)│       │ animal_id (FK)  │
│ full_name       │       │ owner_id (FK)   │       │ record_type     │
│ role (ENUM)     │       │ species, breed  │       │ description     │
│ district        │       │ health_status   │       │ performed_by(FK)│
│ preferred_lang  │       │ gps_lat, gps_lng│       │ next_due_at     │
└─────────────────┘       └─────────────────┘       └─────────────────┘
         │                         │
         │1                        │1
         │*                        │*
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   advisories    │       │ symptom_reports │1     *│    lab_cases    │
│─────────────────│       │─────────────────│───────│─────────────────│
│ id (UUID)       │       │ id (UUID)       │       │ id (UUID)       │
│ title, disease  │       │ animal_id (FK)  │       │ sample_id       │
│ body_mr/hi/en   │       │ reported_by (FK)│       │ symptom_rep (FK)│
│ district        │       │ symptoms (JSON) │       │ status (ENUM)   │
│ severity        │       │ gps_lat, gps_lng│       │ status_history  │
│ created_by (FK) │       │ status (ENUM)   │       │ assigned_lab(FK)│
└─────────────────┘       └─────────────────┘       └─────────────────┘
                                   │1
                                   │*
                          ┌─────────────────┐
                          │ outbreak_flags  │
                          │─────────────────│
                          │ id (UUID)       │
                          │ symptom_rep(FK) │
                          │ predicted_dis   │
                          │ confidence_pct  │
                          │ risk_level      │
                          │ district        │
                          └─────────────────┘
```

---

## 5. Security Hardening & 9-Point Verification Checklist

| # | Security Verification | Mechanism | Status |
|---|---|---|:---:|
| **1** | **Role-Based Access Control (RBAC)** | `requireRole()` checks on all protected API routes. | ✅ PASS |
| **2** | **IDOR & Data Scoping** | Verification of `owner_id === user.authId` on `/api/animals/[id]` and health cards. | ✅ PASS |
| **3** | **Input Validation** | Strict Zod schemas for all request payloads. | ✅ PASS |
| **4** | **Data Leak Prevention** | Password hashes and private farmer contacts scrubbed from public endpoints. | ✅ PASS |
| **5** | **Rate Limiting** | Sliding window rate limits on login, register, and symptom reporting. | ✅ PASS |
| **6** | **Pagination Bounds** | Enforced default 20, max 100 limit on list queries. | ✅ PASS |
| **7** | **Zero SQL Injection** | 100% parameterized queries via Supabase PostgREST ORM. | ✅ PASS |
| **8** | **Audit Logging** | Request logging without capturing credentials or secrets. | ✅ PASS |
| **9** | **Resilient Third-Party Fallbacks** | Open-Meteo, Resend, and Gemini calls wrapped with fallbacks. | ✅ PASS |

---

## 6. Live Demonstration & Evaluator Test Guide

### Evaluator Demo Accounts (Pre-Seeded)
| Role | Email | Password | Primary District | Key Features to Inspect |
|---|---|---|---|---|
| **Farmer** | `farmer.pune@pashudhan.gov.in` | `Farmer@123` | Pune | Livestock Registry, Digital Passport, Report Symptoms, AI Chatbot. |
| **Veterinarian** | `vet.nashik@pashudhan.gov.in` | `Vet@123` | Nashik | Triage Queue, Treatment Records, Issue Advisory, Risk Heatmap. |
| **Lab Technician** | `lab.nagpur@pashudhan.gov.in` | `Lab@123` | Nagpur | Diagnostic Sample Check-in, Forward Status Updates (`collected` → `completed`). |
| **State Admin** | `admin@pashudhan.gov.in` | `Admin@123` | Pune | 36-District Analytics, Severity Matrix, Outbreak Flags, Excel Exports. |

### Suggested 3-Minute Live Jury Walkthrough
1. **Home & Public Verification**: Visit `/` → Navigate to `/chatbot` for trilingual symptom screening with photo upload.
2. **Omni-Channel Demonstration**: Visit `/channels` → Click **"Call Now (Demo)"** on the IVR card to listen to the live browser voice helpline.
3. **Farmer Workflow**: Login as `farmer.pune@...` → View livestock list at `/animals` → Open an animal card → Download **Digital Health Passport**.
4. **Epidemic Heatmap**: Open `/heatmap` → Observe real-time risk scores correlated with 14-day outbreak flags and weather telemetry.
5. **State Analytics**: Login as `admin@...` → Navigate to `/analytics` → Review 36-district rankings and disease breakdown charts.

---

*Pashudhan Kavach — Built with precision, resilience, and rural empathy for Smart India Hackathon 2026.*

