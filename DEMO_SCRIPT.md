# Pashudhan Kavach — 5-8 Minute Evaluator Demo Script

Welcome to **Pashudhan Kavach**, the Livestock Disease Early Warning & Digital Health Passport Platform built for the Government of Maharashtra (SIH26128).

---

## 🔑 Demo Login Credentials (1-Click or Manual)

All demo accounts share the password: `DemoPassword123!`

| Role | Email | District / Division | Key Capabilities |
|---|---|---|---|
| **Farmer** | `farmer.pune@pashudhan.gov.in` | Pune (Pune Div) | View registered herd, QR Health Passports, due vaccination alerts, submit symptoms. |
| **Veterinary Officer** | `vet.nashik@pashudhan.gov.in` | Nashik (Nashik Div) | Review clinical triage queue, publish district advisories, add vaccination records. |
| **Lab Technician** | `lab.nagpur@pashudhan.gov.in` | Nagpur (Nagpur Div) | Receive diagnostic samples, record PCR/ELISA findings, auto-dispatch result alerts. |
| **State Admin** | `admin@pashudhan.gov.in` | Maharashtra State | View statewide metrics, 36-district risk rankings, export streamed CSV reports. |

---

## ⏱️ Step-by-Step Evaluator Walkthrough (5-8 Minutes)

### Step 1: Public Verification & Home Landing Page (1 min)
1. Open the home page at `/`.
2. Notice the **Public Verification** search box.
3. Paste sample Pashu Aadhaar Tag UID `100011112222` (or click the quick demo link).
4. Click **Verify Tag** → Inspect the instant verification badge, vaccination status, and district registry confirmation without personal data exposure.

---

### Step 2: Farmer Portal & Digital Health Passport (1.5 min)
1. Navigate to `/login` and click the **👨‍🌾 Farmer (Pune)** 1-click button (or login with `farmer.pune@pashudhan.gov.in`).
2. On the **Farmer Dashboard**, observe:
   - Registered livestock cards with health status indicators.
   - **Immunization Alerts** banner showing doses due within 7 days.
3. Click **Health Passport** on any animal (e.g. Gir Cow `100011112222`):
   - View the official tamper-evident QR code.
   - View the complete vaccination and treatment chronological ledger.
   - Test the "Print Health Passport" action.

---

### Step 3: Disease Reporting & Instant AI Triage (1.5 min)
1. Click **Report Sick Livestock** (or navigate to `/report-symptom`).
2. Select an animal (e.g., Osmanabadi Goat `100011112224`).
3. Check the diagnostic symptoms for **Foot and Mouth Disease (FMD)**:
   - `Fever High`
   - `Drooling`
   - `Mouth Blisters`
   - `Hoof Blisters`
   - `Lameness`
4. Click **Run Instant AI Triage**:
   - Observe the immediate deterministic clinical diagnosis card: **Foot and Mouth Disease (FMD)** with high confidence percentage.
   - Note the automatic generation of **Diagnostic Sample Order** (`LAB-YYYYMMDD-XXXX`) and **Isolation Guidance**.

---

### Step 4: Diagnostic Lab Custody Workflow (1 min)
1. Logout and log in as **🔬 Lab Tech** (`lab.nagpur@pashudhan.gov.in`).
2. Navigate to `/lab` (or use the Lab Cases dashboard widget).
3. Find an active sample in `testing` or `received` status.
4. Click **Record Findings & Complete**:
   - Enter diagnostic outcome: `"Positive for FMD Virus (Serotype O) via RT-PCR"`.
   - Click **Verify & Send Notification** → The sample status updates to `completed` and automatically triggers an in-app alert to the livestock owner.

---

### Step 5: GIS Heatmap & Weather Risk Radar (1 min)
1. Navigate to `/heatmap` from the top navigation.
2. Filter through the 6 Maharashtra administrative divisions (**Konkan, Pune, Nashik, Chhatrapati Sambhajinagar, Amravati, Nagpur**).
3. Click on any district (e.g. **Pune** or **Chhatrapati Sambhajinagar**):
   - Inspect the real-time **Epidemiological Risk Score (0-100)**.
   - Review the **Meteorological Assessment** powered by Open-Meteo with humidity/rainfall vector risk factors.

---

#### Removed Feature Note
> The floating **"Ask Vet Assistant"** chatbot widget was removed from this build (out-of-scope of the locked MASTER_BUILD_PROMPT sections 1–9; the spec'd disease-triage engine continues to power symptom reports and lab notifications instead).

---

### Step 6: State Administrator Analytics & CSV Export (1 min)
1. Sign in as **👑 State Admin** (`admin@pashudhan.gov.in`).
2. Navigate to `/analytics`:
   - Inspect state-level totals: Registered livestock, outbreak flags, lab cases, and pathogen distributions.
   - Review the **36-District Rankings Table** sorted by calculated risk scores.
   - Click **Export Animals CSV** or **Export Outbreaks CSV** to verify live streaming data exports.

---

## 🎯 Verification Complete!
All 11 sections of the Pashudhan Kavach platform are fully integrated, verified, and operational.

