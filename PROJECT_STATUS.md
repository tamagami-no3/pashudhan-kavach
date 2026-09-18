# Pashudhan Kavach (पशुधन कवच) — Project Status, Audit & Accountability Log

> **Document Purpose**: Complete, detailed, transparent log of all project progress, technologies used, working features, non-working/known limitations, completed work, and pending items for SIH 2026.  
> **Last Updated**: 2026-09-18 (Phase 8 Audit & Polish Completed)  
> **Project Directory**: `c:\sih2026\project`

---

## 1. Project Overview & Target Objectives

**Pashudhan Kavach** is an enterprise-grade digital veterinary health and epidemic surveillance platform built for the Department of Animal Husbandry, Government of Maharashtra.

### Core Objectives:
1. **Multimodal Early Disease Screening**: Real-time AI chatbot accepting text symptoms + visual image uploads for disease recognition.
2. **Omni-Channel Farmer Access**: Web command portal, installable mobile PWA, offline store-and-forward sync queue, and an IVR voice helpline demo.
3. **Epidemic Surveillance**: Real-time GIS risk heatmap correlated with weather vectors (temperature, humidity, rainfall).
4. **Digital Animal Passport**: 12-digit Bharat Pashudhan–compliant Tag UID with tamper-evident QR verification.
5. **Role-Based Access Control**: 4-tier RBAC for Farmers, Veterinarians, Lab Technicians, and State Admins.

---

## 2. Technology Stack & Frameworks Used

| Layer | Technologies / Packages Used | Purpose / Usage |
|---|---|---|
| **Frontend Framework** | Next.js 13.5 (React 18, App Router, TypeScript 5.2) | Core full-stack SSR/SSG & Route Handler framework |
| **Styling & UI** | Tailwind CSS 3.3, Lucide React (`lucide-react`), Radix UI (`@radix-ui/*`), Shadcn UI | Responsive UI components, dark mode, icons |
| **Data Visualization & GIS** | Recharts 2.12, Leaflet 1.9 (`leaflet`, `react-leaflet`) | Outbreak distribution charts & GIS spatial heatmaps |
| **Internationalization (i18n)**| Native client-side reactive trilingual engine | Support for **Marathi (`mr`)**, **Hindi (`hi`)**, **English (`en`)** |
| **AI / ML Integration** | Google Gemini REST API (`gemini-3.6-flash`, `gemini-3.5-flash`, `gemini-3.7-flash`, etc.) | Text & vision multimodal disease diagnosis |
| **Rule Triage Engine** | `lib/services/triageEngine.ts` | Deterministic expert system backup for 7 Maharashtra diseases |
| **Weather Telemetry** | Open-Meteo REST API (`lib/services/weatherService.ts`) | Vector-borne risk scoring based on ambient temperature/humidity |
| **Database & Storage** | Supabase (PostgreSQL 15) + `lib/persistent-store.ts` (`data/db.json`) | Dual cloud PostgreSQL + local offline JSON store fallback |
| **QR Code Generation** | `qrcode` package | Digital Health Passport QR verification links |
| **Notifications** | Resend API (`lib/services/notify.ts`) | Email & in-app alerts |
| **Voice / Telephony Demo** | Web Speech API (`SpeechSynthesisUtterance`) | Browser-based interactive IVR telephony voice demo |

---

## 3. What Is Completed & Fully Working (✅ PASS)

### A. Real-Time Multimodal AI Chatbot (`/chatbot`)
- [x] **Trilingual AI Chat**: Real-time conversational responses in Marathi, Hindi, and English (not hardcoded).
- [x] **Image Disease Scanner**: Accepts base64 image uploads (lesions, skin lumps) and returns visual disease analysis.
- [x] **Multi-Model Sequential Fallback**: Automatically tries candidate Gemini models (`gemini-3.6-flash` → `gemini-3.5-flash` → `gemini-3.7-flash` → `gemini-flash-latest`).
- [x] **Rule-Based Emergency Fallback**: If network or API key is absent, seamlessly falls back to keyword triage for FMD, LSD, PPR, Brucellosis, Anthrax, BQ, and HS.
- [x] **Structured Response Schema**: Outputs disease prediction, confidence level (`Low`, `Medium`, `High`, `Critical`), alert level (`none`, `caution`, `urgent`), and precaution list.

### B. Omni-Channel Hub & IVR Telephony Voice Demo (`/channels`)
- [x] **4-Channel Delivery Grid**: Displays cards for Web Command Portal, Mobile PWA, Offline Queue, and IVR Telephony.
- [x] **Interactive IVR Voice Demo**: Live browser speech synthesis simulating dial-in IVR helpline (1962) with audio spectrum wave animations.
- [x] **Touch-Tone Menu**: Interactive Key 1 (FMD), Key 2 (LSD), Key 3 (Anthrax Quarantine), and Key 4 (Repeat Menu) in all 3 languages.

### C. Digital Animal Passport & Public QR Verification
- [x] **12-Digit Tag UID**: Compliant with NDLM / Bharat Pashudhan standards.
- [x] **QR Health Passport Generator**: Route `/api/animals/[id]/health-card` generates scannable digital passports.
- [x] **Public Verification Endpoint**: `/api/verify/[tag_uid]` allows buyers/checkposts to verify animal health history without exposing private owner contact details.

### D. GIS Epidemic Outbreak Heatmap & 5-Factor Weighted Risk Scoring (`/heatmap`)
- [x] **Transparent Mathematical Formulation**:
  $$\text{RiskScore} = 0.30 \times \text{CaseRate} + 0.20 \times \text{TrendSlope} + 0.15 \times \text{VaccGap} + 0.20 \times \text{WeatherVector} + 0.15 \times \text{NeighborSpillover}$$
- [x] **Subscores Breakdown Output**: API and UI preserve all 5 subscore values along with their weights.
- [x] **14-Day Linear Regression Trend Slope**: Computes daily slope over 14 days and normalizes $[0, 1]$ across all 36 districts.
- [x] **Spatial Neighbor Spillover**: Calculates Haversine-weighted transmission pressure within the $150\text{ km}$ alert radius constant.
- [x] **Dynamic Percentile Bucketing**: Dynamically buckets districts into Low (<25th pct), Medium (25–50th pct), High (50–75th pct), and Critical (top quartile $\ge 75\text{th}$ pct).
- [x] **Administrative Override**: Automatically detects active risk overrides and displays `"Admin override — computed score: X"`.
- [x] **Interactive Tooltips & Panels**: Hover tooltip on Leaflet circles and full breakdown progress bar card on click.

### E. 4-Tier Role-Based Access Control (RBAC) & Security
- [x] **Strict Role Guarding**: Enforced via `requireRole()` across Farmer, Veterinarian, Lab Technician, State Admin, and Public tiers.
- [x] **RBAC Fixes Applied**: Resolved access permissions for Lab Techs and Vets on `/api/lab-cases` and `/api/animals/[id]`.
- [x] **Validation & Security**: Zod schemas on inputs, IP sliding window rate limiting, data scrubbing on public routes.

### F. Build & Code Quality
- [x] **TypeScript Check**: `npx tsc --noEmit` yields **0 errors**.
- [x] **Production Build**: `npm run build` compiles **36 static & server routes with 0 errors**.

---

## 4. What Is Non-Working / Known Limitations (⚠️ NOT WORKING / FALLBACK DEPENDENT)

1. **Gemini 2.0 / 1.5 Legacy Model Endpoints (Deprecated / Removed)**:
   - *Status*: `gemini-2.0-flash` returns HTTP 404 from upstream Google API.
   - *Mitigation*: Updated route handler to use `gemini-3.6-flash` and `gemini-3.5-flash` with sequential fallback loops.
2. **Third-Party Live IVR Telephony Gateway (Twilio / Exotel)**:
   - *Status*: Real PSTN telephone trunking requires paid telecom gateways.
   - *Mitigation*: Implemented a 100% functional Web Speech API (`SpeechSynthesisUtterance`) interactive browser voice helpline demo.
3. **Supabase Cloud DB Connection in Offline Environments**:
   - *Status*: Cloud database is inaccessible when running without internet or credentials.
   - *Mitigation*: Fully supported by `lib/persistent-store.ts` file-based storage (`data/db.json`) ensuring complete local demo functionality.

---

### G. Persona Split Navigation & Gated Farmer/Authority Paths (Block 2)
- [x] **Split Landing Hero**: Dedicated **Farmer Path** ("Report a Problem / तक्रार नोंदवा") routing directly to `/chatbot` without requiring login.
- [x] **Authority Path**: Direct access to `/dashboard` gated by role-based authentication.
- [x] **Navbar Path Isolation**: When on `/chatbot`, authority/admin navigation links are hidden to provide a clean, distraction-free farmer experience.
- [x] **Trilingual Localization**: Added persona split actions and descriptions in Marathi, Hindi, and English.

### H. In-Browser Webcam Capture + Client-Side MobileNet CV Signal (Block 3)
- [x] **Live Camera Viewfinder**: WebRTC `navigator.mediaDevices.getUserMedia` video stream with live camera preview and canvas snapshot capture.
- [x] **Unified Pipeline**: Camera snapshots feed the same base64 diagnosis pipeline as file uploads.
- [x] **Client-Side TensorFlow.js MobileNet v2**: Dynamically imports `@tensorflow/tfjs` and `@tensorflow-models/mobilenet` on the client with zero SSR interference.
- [x] **Secondary Visual Signal Passing**: Extracts top ImageNet classifications and probabilities, passing them as `visual_signal` to `/api/chatbot/diagnose`.
- [x] **Zero Overrides**: Supplemented to Gemini prompt as secondary edge feature cues without blocking or overriding LLM veterinary diagnosis.
- [x] **Ethical UI Disclaimer**: Displays badge `"Pretrained general computer vision model for secondary edge feature cues"` to avoid claiming an untrained model is a disease classifier.
- [x] **Verified via Test Suite**: Tested with `scratch/test_block3.ts` and `npx tsc --noEmit` clean.

### I. District Management, Staff Roster & Administrative Overrides (Block 4)
- [x] **District Telemetry API (`GET /api/districts/[id]/management`)**: Fetches district metadata, live 5-factor risk assessment, assigned staff roster, admin action timeline, and available assignable officers. Protected by RBAC (Admins and Veterinarians).
- [x] **Staff Assignment API (`POST /api/districts/[id]/staff`)**: Assigns registered veterinarians, lab technicians, and officers to specific districts with defined roles (e.g. Field Epidemiologist, Nodal Officer).
- [x] **Administrative Interventions & Risk Override API (`POST /api/districts/[id]/actions`)**: Logs operational field orders (ring vaccination, quarantine) and manual risk overrides with mandatory administrative audit justification.
- [x] **District Command UI (`app/districts/[id]/page.tsx`)**: Complete interactive dashboard with live 5-factor risk formula breakdown, active staff roster with assignment form, and intervention/override submission panel.
- [x] **Statewide Directory Overview (`app/districts/page.tsx`)**: Directory of all 36 Maharashtra districts categorized by division with search, risk indicators, and direct links to district management.
- [x] **Seamless Heatmap Integration (`app/heatmap/page.tsx`)**: Added direct "Manage District" deep-link from the GIS map inspection card to the district management command console.
- [x] **Verified via Integration Suite**: Tested with `scratch/test_block4.ts` and clean `npx tsc --noEmit` pass (0 errors).

### J. Voice Input & Symptom Speech Recognition (Block 5)
- [x] **Web Speech Recognition Hook (`hooks/useVoiceInput.ts`)**: Built unified client-side speech recognition hook utilizing `SpeechRecognition` / `webkitSpeechRecognition`.
- [x] **Trilingual Indian Locales**: Supports **Marathi (`mr-IN`)**, **Hindi (`hi-IN`)**, and **English (`en-IN`)** with automatic BCP 47 locale routing.
- [x] **Chatbot Voice Input (`app/chatbot/page.tsx`)**: Dedicated microphone button in the input bar with recording state rings, active speech transcript display, and seamless population into `inputText`.
- [x] **Symptom Report Voice Dictation (`app/report-symptom/page.tsx`)**: Added voice dictation bar for farmers to speak symptoms freely.
- [x] **Intelligent Keyword Matching Engine**: Automatically parses spoken Marathi, Hindi, or English text and checks the corresponding diagnostic symptom checkboxes (e.g. *fever, drooling, mouth blisters, skin lumps, diarrhea, lameness*).
- [x] **Tested & Verified**: Verified via `scratch/test_block5.ts` and clean `npx tsc --noEmit` pass (0 errors).

### L. Farmer-Centric Architecture & High-Adoption Engine (Block 7)
- [x] **Clinical Symptoms Metadata Catalog (`lib/constants/symptoms.ts`)**:
  - Typed catalog of 12 clinical symptoms with Lucide icons, disease mappings (FMD, LSD, PPR, Brucellosis, Anthrax, BQ, HS), folk descriptions in Marathi/Hindi/English, and root speech keywords (`matchSymptomsFromText`).
- [x] **Client-Side IndexedDB Offline Queue (`lib/offlineStore.ts`)**:
  - Offline store (`pashudhan_offline_db` / `offline_reports`), `queueOfflineReport`, `getPendingReports`, `removePendingReport`, and automatic `window.addEventListener('online')` auto-sync listener.
- [x] **Instant Triage & SLA Ticket Dispatch API (`app/api/symptoms/triage-report/route.ts`)**:
  - Accepts structured symptom payload, runs deterministic triage, generates `PK-XXXXXX` ticket ID, computes 30/60m SLA deadline, assigns nearest Taluka dispensary & duty veterinary officer (`Dr. Vijay Shinde`, LDO), compiles localized first-aid, persists report in `persistentStore` and Supabase. Also supports `GET ?ticket_id=...`.
- [x] **WhatsApp Webhook Ingestion API (`app/api/webhooks/whatsapp/route.ts`)**:
  - Handles `GET` subscription verification handshake (`hub.challenge` & `hub.verify_token`) and `POST` inbound message parsing (text/voice symptoms) + localized WhatsApp auto-reply generation with ticket ID and emergency 1962 advice.
- [x] **Village Outbreak Early Warning Broadcast Cron (`app/api/cron/village-alerts/route.ts`)**:
  - Protected by `CRON_SECRET`, evaluates 5-factor risk across all 36 districts, filters `critical`/`high` tiers, generates structured Marathi biosecurity advisories, and saves to community posts and `advisories` table.
- [x] **Frictionless Report Form Component (`components/farmer/FrictionlessReportForm.tsx`)**:
  - Touch-optimized 48px visual cards, real-time voice speech keyword highlighting via `useVoiceInput`, camera capture with base64 preview, 12-digit Tag UID input with quick sample pills, and IndexedDB offline fallback.
- [x] **Public Frictionless Report Page (`app/report/page.tsx`)**:
  - Dedicated public page wrapping `<FrictionlessReportForm />` with Navbar, 1962 toll-free helpline banner, guidance pills, and language support.
- [x] **Visual Delivery-App Case Tracker Page (`app/reports/[id]/track/page.tsx`)**:
  - Deliveroo / Swiggy style 4-phase stepper (`नोंदणी पूर्ण` -> `पशुवैद्यक नियुक्त` -> `पशुवैद्यक रवाना` with live dynamic ETA countdown timer -> `उपचार व नमुना संकलन`), duty doctor profile card (`Dr. Vijay Shinde`, LDO, phone click-to-call, vehicle `MH-12-GV-1962`), emergency `tel:1962` dial button, and IndexedDB offline queue view for `id === 'offline'`.
- [x] **Landing Page Emergency 1962 Banner (`app/page.tsx`)**:
  - Added full-width emergency 1962 helpline banner linking directly to `/report` and `tel:1962`.
- [x] **Navbar & Bottom Nav Integration (`components/Navbar.tsx`)**:
  - Added direct 1-tap Report button to desktop navbar and mobile bottom bar for phone accessibility.
- [x] **Tested & Verified**: Verified via `scratch/test_farmer_engine.ts` (all 5 tests passed) and clean `npm run build` pass (**37/37 routes compiled, 0 errors**).

---

## 5. Summary of Key Files & Modifications Log

| File Path | Description of Work Done | Status |
|---|---|:---:|
| `lib/constants/symptoms.ts` | 12-symptom clinical catalog with folk names & keyword matching in mr/hi/en | ✅ Done |
| `lib/offlineStore.ts` | IndexedDB client store & forward queue with auto-sync on online event | ✅ Done |
| `app/api/symptoms/triage-report/route.ts` | Triage & SLA ticket dispatch POST & GET handler with persistent storage | ✅ Done |
| `app/api/webhooks/whatsapp/route.ts` | WhatsApp Cloud API webhook handshake & inbound triage auto-reply | ✅ Done |
| `app/api/cron/village-alerts/route.ts` | 36-district automated outbreak warning broadcast cron | ✅ Done |
| `components/farmer/FrictionlessReportForm.tsx` | Touch-optimized zero-login report form with voice & camera & offline queue | ✅ Done |
| `app/report/page.tsx` | Public frictionless symptom reporting landing page | ✅ Done |
| `app/reports/[id]/track/page.tsx` | 4-phase visual delivery-app case tracker with live ETA countdown & vet card | ✅ Done |
| `components/Navbar.tsx` | Added 375px mobile bottom nav + desktop emergency report button | ✅ Done |
| `app/layout.tsx` | Added `pb-16 md:pb-0` responsive clearance for mobile viewports | ✅ Done |
| `hooks/useVoiceInput.ts` | Reusable Web Speech API recognition hook (mr-IN, hi-IN, en-IN) | ✅ Done |
| `app/chatbot/page.tsx` | Added microphone button, live speech banner, webcam & MobileNet cues | ✅ Done |
| `app/report-symptom/page.tsx` | Added voice dictation bar with auto-matching symptom checkbox selector | ✅ Done |
| `app/api/districts/[id]/management/route.ts` | GET route for district risk telemetry, staff roster & actions | ✅ Done |
| `app/api/districts/[id]/staff/route.ts` | POST route for assigning staff personnel to districts | ✅ Done |
| `app/api/districts/[id]/actions/route.ts` | POST route for recording field interventions and risk score overrides | ✅ Done |
| `app/districts/[id]/page.tsx` | District command console with 5-factor breakdown, staff roster & action forms | ✅ Done |
| `app/districts/page.tsx` | 36-district directory overview grouped by administrative division | ✅ Done |
| `app/heatmap/page.tsx` | Added "Manage District" action link to GIS inspection panel | ✅ Done |
| `lib/services/mobileNetClient.ts` | Lazy-loaded client-side MobileNet v2 singleton inference module | ✅ Done |
| `app/api/chatbot/diagnose/route.ts` | Built diagnose POST API with visual_signal support, model fallback loop & rule fallback | ✅ Done |
| `app/page.tsx` | Emergency 1962 banner + Persona split hero: Farmer Path vs Authority Path | ✅ Done |
| `lib/services/riskEngine.ts` | 5-factor risk scoring engine + zero-case epidemiological gate | ✅ Done |
| `app/channels/page.tsx` | Built Omni-Channel Hub with interactive smartphone IVR call simulator & DTMF dial tones | ✅ Done |
| `lib/translations.ts` | Added dictionary keys for persona split, chatbot, channels, feature grid, and academic disclaimer | ✅ Done |
| `app/api/lab-cases/route.ts` | Fixed RBAC role validation for Lab Techs, Vets, and Admins | ✅ Done |
| `app/api/animals/[id]/route.ts` | Added persistent store fallback for animal lookup | ✅ Done |
| `lib/persistent-store.ts` | Added helper functions and district management & triage ticket schema records | ✅ Done |
| `app/report-symptom/page.tsx` | Replaced legacy duplicate report form with automated client redirect to `/report` | ✅ Done |
| `app/api/auth/register/route.ts` | Locked public self-registration to `role: 'farmer'` preventing unauthorized escalation | ✅ Done |
| `app/api/search/route.ts` | Sanitized PostgREST `.or(...)` filter query against delimiter injection | ✅ Done |
| `app/reports/[id]/track/page.tsx` | Added simulated demo watermark to assigned officer card and linked helpline to 1962 | ✅ Done |
| `TECHNICAL_ARCHITECTURE.md` | Comprehensive judge-facing technical dossier including 5-factor risk formula | ✅ Done |
| `PROJECT_STATUS.md` | Comprehensive project status, audit, and accountability tracking log | ✅ Done |

---

## 6. What Is Left / Recommended Future Scope (Post-SIH)

1. **Native Mobile App Build**: Wrap Next.js PWA into Capacitor / React Native container for native App Store / Play Store distribution.
2. **Real Telecom IVR Gateway**: Connect the `/channels` IVR flow to an Exotel / Twilio PSTN webhook for live phone call handling on `1800-XXX-XXXX`.
3. **Automated ML Retraining Pipeline**: Train custom PyTorch/TensorFlow CNN image classification model on specific Indian cattle breed lesions to run alongside LLM screening.

---

*This file serves as the official status and accountability tracking log for the Pashudhan Kavach project.*

