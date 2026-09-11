/**
 * ==============================================================================
 * Pashudhan Kavach — Synthetic Database Seeder (Section 11)
 *
 * NOTICE: All outbreak, animal, and clinical case data in this seed script is
 * 100% SYNTHETIC and generated for hackathon demonstration and testing purposes.
 * No real government or private veterinary health records are included.
 * ==============================================================================
 */

import { createClient } from '@supabase/supabase-js';
import QRCode from 'qrcode';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Demo Users to Seed (~5 per role or primary representatives across 6 divisions)
const USERS_SEED = [
  // 1. Admin
  {
    email: 'admin@pashudhan.gov.in',
    password: 'DemoPassword123!',
    full_name: 'Dr. Anand Deshmukh (State Admin)',
    role: 'admin',
    district: 'Pune',
    preferred_language: 'en',
    phone: '9822011111',
  },
  // 2. Vets
  {
    email: 'vet.pune@pashudhan.gov.in',
    password: 'DemoPassword123!',
    full_name: 'Dr. Sunita Kadam (District Vet)',
    role: 'vet',
    district: 'Pune',
    preferred_language: 'mr',
    phone: '9822022222',
  },
  {
    email: 'vet.nashik@pashudhan.gov.in',
    password: 'DemoPassword123!',
    full_name: 'Dr. Vijay Shinde (Veterinary Officer)',
    role: 'vet',
    district: 'Nashik',
    preferred_language: 'en',
    phone: '9822033333',
  },
  {
    email: 'vet.sambhajinagar@pashudhan.gov.in',
    password: 'DemoPassword123!',
    full_name: 'Dr. Rajesh Gaikwad (Veterinary Officer)',
    role: 'vet',
    district: 'Chhatrapati Sambhajinagar',
    preferred_language: 'mr',
    phone: '9822044444',
  },
  // 3. Paravets
  {
    email: 'paravet.kolhapur@pashudhan.gov.in',
    password: 'DemoPassword123!',
    full_name: 'Suresh Patil (Field Paravet)',
    role: 'paravet',
    district: 'Kolhapur',
    preferred_language: 'mr',
    phone: '9822055555',
  },
  {
    email: 'paravet.amravati@pashudhan.gov.in',
    password: 'DemoPassword123!',
    full_name: 'Ganesh Raut (Field Paravet)',
    role: 'paravet',
    district: 'Amravati',
    preferred_language: 'hi',
    phone: '9822066666',
  },
  // 4. Lab Technicians
  {
    email: 'lab.nagpur@pashudhan.gov.in',
    password: 'DemoPassword123!',
    full_name: 'Dr. Meera Joshi (Senior Lab Tech)',
    role: 'lab',
    district: 'Nagpur',
    preferred_language: 'en',
    phone: '9822077777',
  },
  {
    email: 'lab.pune@pashudhan.gov.in',
    password: 'DemoPassword123!',
    full_name: 'Nitin Kulkarni (Diagnostic Tech)',
    role: 'lab',
    district: 'Pune',
    preferred_language: 'mr',
    phone: '9822088888',
  },
  // 5. Farmers across 6 divisions
  {
    email: 'farmer.pune@pashudhan.gov.in',
    password: 'DemoPassword123!',
    full_name: 'Ramesh Balasaheb Patil',
    role: 'farmer',
    district: 'Pune',
    preferred_language: 'mr',
    phone: '9822099991',
    village: 'Shirur',
    block: 'Haveli',
  },
  {
    email: 'farmer.nashik@pashudhan.gov.in',
    password: 'DemoPassword123!',
    full_name: 'Dnyaneshwar Jadhav',
    role: 'farmer',
    district: 'Nashik',
    preferred_language: 'mr',
    phone: '9822099992',
    village: 'Dindori',
    block: 'Niphad',
  },
  {
    email: 'farmer.sambhajinagar@pashudhan.gov.in',
    password: 'DemoPassword123!',
    full_name: 'Prakash Kale',
    role: 'farmer',
    district: 'Chhatrapati Sambhajinagar',
    preferred_language: 'mr',
    phone: '9822099993',
    village: 'Paithan',
    block: 'Paithan',
  },
  {
    email: 'farmer.nagpur@pashudhan.gov.in',
    password: 'DemoPassword123!',
    full_name: 'Sanjay Wanjari',
    role: 'farmer',
    district: 'Nagpur',
    preferred_language: 'hi',
    phone: '9822099994',
    village: 'Kamptee',
    block: 'Nagpur Rural',
  },
  {
    email: 'farmer.kolhapur@pashudhan.gov.in',
    password: 'DemoPassword123!',
    full_name: 'Ananda Chougule',
    role: 'farmer',
    district: 'Kolhapur',
    preferred_language: 'mr',
    phone: '9822099995',
    village: 'Shirol',
    block: 'Hatkanangale',
  },
  {
    email: 'farmer.amravati@pashudhan.gov.in',
    password: 'DemoPassword123!',
    full_name: 'Santosh Deshmukh',
    role: 'farmer',
    district: 'Amravati',
    preferred_language: 'hi',
    phone: '9822099996',
    village: 'Chandur',
    block: 'Morshi',
  },
];

async function runSeed() {
  console.log('🚀 Starting Pashudhan Kavach Synthetic Seed Script...');

  const createdUserMap: Record<string, string> = {};

  // 1. Seed Users
  for (const u of USERS_SEED) {
    console.log(`Creating user: ${u.email} (${u.role})`);
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { full_name: u.full_name, role: u.role, district: u.district },
    });

    let userId = authData?.user?.id;
    if (authErr) {
      // Fetch existing user ID
      const { data: existUser } = await supabase.from('users').select('id').eq('email', u.email).single();
      userId = existUser?.id;
    }

    if (!userId) {
      console.warn(`Could not create/find user ${u.email}`);
      continue;
    }

    createdUserMap[u.email] = userId;

    await supabase.from('users').upsert({
      id: userId,
      email: u.email,
      full_name: u.full_name,
      role: u.role as any,
      district: u.district,
      preferred_language: u.preferred_language as any,
      phone: u.phone,
      is_active: true,
      is_verified: true,
    });

    if (u.role === 'farmer' && u.village) {
      await supabase.from('farmers').upsert({
        user_id: userId,
        village: u.village,
        block: u.block || `${u.district} Block`,
      }, { onConflict: 'user_id' });
    }
  }

  // 2. Seed ~30 Animals across all 6 divisions
  console.log('📦 Seeding synthetic livestock registry (~30 animals)...');
  const farmerPuneId = createdUserMap['farmer.pune@pashudhan.gov.in'] || Object.values(createdUserMap)[0];
  const farmerNashikId = createdUserMap['farmer.nashik@pashudhan.gov.in'] || farmerPuneId;
  const farmerSambhId = createdUserMap['farmer.sambhajinagar@pashudhan.gov.in'] || farmerPuneId;
  const farmerNagpurId = createdUserMap['farmer.nagpur@pashudhan.gov.in'] || farmerPuneId;
  const farmerKolhapurId = createdUserMap['farmer.kolhapur@pashudhan.gov.in'] || farmerPuneId;
  const farmerAmravatiId = createdUserMap['farmer.amravati@pashudhan.gov.in'] || farmerPuneId;

  const ANIMALS_SEED = [
    // Pune Division (Pune & Kolhapur)
    { tag_uid: '100011112222', species: 'Cattle', breed: 'Gir Cow', sex: 'Female', district: 'Pune', village: 'Shirur', owner_id: farmerPuneId, lat: 18.52, lng: 73.85, status: 'healthy' },
    { tag_uid: '100011112223', species: 'Buffalo', breed: 'Murrah', sex: 'Female', district: 'Pune', village: 'Baramati', owner_id: farmerPuneId, lat: 18.15, lng: 74.57, status: 'healthy' },
    { tag_uid: '100011112224', species: 'Goat', breed: 'Osmanabadi', sex: 'Female', district: 'Pune', village: 'Khed', owner_id: farmerPuneId, lat: 18.84, lng: 73.91, status: 'symptomatic' },
    { tag_uid: '100011112225', species: 'Cattle', breed: 'Khillari Bull', sex: 'Male', district: 'Kolhapur', village: 'Shirol', owner_id: farmerKolhapurId, lat: 16.70, lng: 74.24, status: 'healthy' },
    { tag_uid: '100011112226', species: 'Buffalo', breed: 'Pandharpuri', sex: 'Female', district: 'Kolhapur', village: 'Hatkanangale', owner_id: farmerKolhapurId, lat: 16.75, lng: 74.45, status: 'healthy' },

    // Nashik Division
    { tag_uid: '100011113331', species: 'Cattle', breed: 'Dangi Cow', sex: 'Female', district: 'Nashik', village: 'Dindori', owner_id: farmerNashikId, lat: 19.99, lng: 73.78, status: 'healthy' },
    { tag_uid: '100011113332', species: 'Cattle', breed: 'Holstein Friesian Cross', sex: 'Female', district: 'Nashik', village: 'Niphad', owner_id: farmerNashikId, lat: 20.08, lng: 74.11, status: 'symptomatic' },
    { tag_uid: '100011113333', species: 'Sheep', breed: 'Deccani', sex: 'Male', district: 'Nashik', village: 'Sinnar', owner_id: farmerNashikId, lat: 19.85, lng: 73.99, status: 'healthy' },
    { tag_uid: '100011113334', species: 'Goat', breed: 'Sangamneri', sex: 'Female', district: 'Ahmednagar', village: 'Sangamner', owner_id: farmerNashikId, lat: 19.57, lng: 74.21, status: 'healthy' },

    // Chhatrapati Sambhajinagar Division
    { tag_uid: '100011114441', species: 'Cattle', breed: 'Red Sindhi', sex: 'Female', district: 'Chhatrapati Sambhajinagar', village: 'Paithan', owner_id: farmerSambhId, lat: 19.87, lng: 75.34, status: 'critical' },
    { tag_uid: '100011114442', species: 'Buffalo', breed: 'Jafarabadi', sex: 'Female', district: 'Chhatrapati Sambhajinagar', village: 'Gangapur', owner_id: farmerSambhId, lat: 19.70, lng: 75.01, status: 'healthy' },
    { tag_uid: '100011114443', species: 'Goat', breed: 'Osmanabadi', sex: 'Male', district: 'Dharashiv', village: 'Tuljapur', owner_id: farmerSambhId, lat: 18.18, lng: 76.04, status: 'symptomatic' },
    { tag_uid: '100011114444', species: 'Cattle', breed: 'Deoni', sex: 'Female', district: 'Latur', village: 'Udgir', owner_id: farmerSambhId, lat: 18.40, lng: 76.56, status: 'healthy' },

    // Nagpur Division
    { tag_uid: '100011115551', species: 'Cattle', breed: 'Gaolao Cow', sex: 'Female', district: 'Nagpur', village: 'Kamptee', owner_id: farmerNagpurId, lat: 21.14, lng: 79.08, status: 'healthy' },
    { tag_uid: '100011115552', species: 'Buffalo', breed: 'Nagpuri', sex: 'Female', district: 'Nagpur', village: 'Umred', owner_id: farmerNagpurId, lat: 20.85, lng: 79.32, status: 'healthy' },
    { tag_uid: '100011115553', species: 'Goat', breed: 'Berari', sex: 'Female', district: 'Nagpur', village: 'Katol', owner_id: farmerNagpurId, lat: 21.27, lng: 78.58, status: 'symptomatic' },
    { tag_uid: '100011115554', species: 'Cattle', breed: 'Sahiwal', sex: 'Female', district: 'Wardha', village: 'Hinganghat', owner_id: farmerNagpurId, lat: 20.74, lng: 78.60, status: 'healthy' },

    // Amravati Division
    { tag_uid: '100011116661', species: 'Cattle', breed: 'Gaolao', sex: 'Male', district: 'Amravati', village: 'Chandur', owner_id: farmerAmravatiId, lat: 20.93, lng: 77.75, status: 'healthy' },
    { tag_uid: '100011116662', species: 'Buffalo', breed: 'Nagpuri', sex: 'Female', district: 'Akola', village: 'Balapur', owner_id: farmerAmravatiId, lat: 20.70, lng: 77.00, status: 'healthy' },
    { tag_uid: '100011116663', species: 'Goat', breed: 'Berari', sex: 'Male', district: 'Buldhana', village: 'Malkapur', owner_id: farmerAmravatiId, lat: 20.52, lng: 76.18, status: 'healthy' },

    // Section 9 expansion — core demo districts (Pune / Nashik / Ch. Sambhajinagar / Nagpur)
    { tag_uid: '100011112227', species: 'Cattle', breed: 'Sahiwal', sex: 'Female', district: 'Pune', village: 'Baramati', owner_id: farmerPuneId, lat: 18.15, lng: 74.21, status: 'healthy' },
    { tag_uid: '100011112228', species: 'Goat', breed: 'Osmanabadi', sex: 'Male', district: 'Pune', village: 'Indapur', owner_id: farmerPuneId, lat: 18.10, lng: 75.02, status: 'healthy' },
    { tag_uid: '100011112229', species: 'Buffalo', breed: 'Murrah', sex: 'Female', district: 'Pune', village: 'Daund', owner_id: farmerPuneId, lat: 18.45, lng: 74.58, status: 'healthy' },
    { tag_uid: '100011113335', species: 'Cattle', breed: 'Gir', sex: 'Male', district: 'Nashik', village: 'Igatpuri', owner_id: farmerNashikId, lat: 19.69, lng: 73.56, status: 'healthy' },
    { tag_uid: '100011113336', species: 'Sheep', breed: 'Deccani', sex: 'Female', district: 'Nashik', village: 'Trimbak', owner_id: farmerNashikId, lat: 19.93, lng: 73.52, status: 'healthy' },
    { tag_uid: '100011113337', species: 'Buffalo', breed: 'Pandharpuri', sex: 'Female', district: 'Nashik', village: 'Chandwad', owner_id: farmerNashikId, lat: 20.33, lng: 74.24, status: 'healthy' },
    { tag_uid: '100011114445', species: 'Cattle', breed: 'Tharparkar', sex: 'Female', district: 'Chhatrapati Sambhajinagar', village: 'Sillod', owner_id: farmerSambhId, lat: 19.88, lng: 75.33, status: 'healthy' },
    { tag_uid: '100011114446', species: 'Goat', breed: 'Sangamneri', sex: 'Female', district: 'Chhatrapati Sambhajinagar', village: 'Vaijapur', owner_id: farmerSambhId, lat: 19.91, lng: 74.77, status: 'healthy' },
    { tag_uid: '100011115555', species: 'Sheep', breed: 'Nagpuri', sex: 'Male', district: 'Nagpur', village: 'Parseoni', owner_id: farmerNagpurId, lat: 21.27, lng: 79.13, status: 'healthy' },
    { tag_uid: '100011115556', species: 'Cattle', breed: 'Deoni', sex: 'Female', district: 'Nagpur', village: 'Kalmeshwar', owner_id: farmerNagpurId, lat: 21.02, lng: 79.05, status: 'healthy' },
  ];

  const createdAnimalMap: Record<string, string> = {};

  for (const a of ANIMALS_SEED) {
    let qrUrl = '';
    try {
      qrUrl = await QRCode.toDataURL(`https://pashudhan.gov.in/verify/${a.tag_uid}`, { margin: 2 });
    } catch {}

    const { data: anim, error: animErr } = await supabase.from('animals').upsert({
      tag_uid: a.tag_uid,
      owner_id: a.owner_id,
      species: a.species,
      breed: a.breed,
      sex: a.sex,
      gps_lat: a.lat,
      gps_lng: a.lng,
      village: a.village,
      district: a.district,
      health_status: a.status,
      qr_code_url: qrUrl,
      created_by: a.owner_id,
    }, { onConflict: 'tag_uid' }).select('id').single();

    if (anim) {
      createdAnimalMap[a.tag_uid] = anim.id;
    }
  }

  // 3. Seed Symptom Reports + Outbreak Flags + Lab Cases (data-driven, idempotent)
  console.log('🔬 Seeding symptom reports & triage outbreak cases...');

  // Mirror of lib/services/triageEngine.ts DISEASE_PROFILES (kept in sync manually).
  const TRIAGE_PROFILES: Record<string, { name: string; weight: number; lethal: boolean; symptoms: string[] }> = {
    FMD: { name: 'Foot and Mouth Disease (FMD)', weight: 0.75, lethal: false, symptoms: ['fever_high', 'drooling', 'mouth_blisters', 'hoof_blisters', 'teat_blisters', 'milk_yield_drop', 'lameness'] },
    LSD: { name: 'Lumpy Skin Disease (LSD)', weight: 0.8, lethal: false, symptoms: ['fever_high', 'nodular_skin_lesions', 'swollen_lymph_nodes', 'leg_edema'] },
    PPR: { name: 'Peste des Petits Ruminants (PPR)', weight: 0.85, lethal: true, symptoms: ['mouth_sores', 'severe_diarrhea', 'respiratory_distress', 'nasal_discharge', 'ocular_discharge'] },
    Brucellosis: { name: 'Brucellosis', weight: 0.7, lethal: false, symptoms: ['late_term_abortion', 'retained_placenta', 'infertility'] },
    Anthrax: { name: 'Anthrax', weight: 0.98, lethal: true, symptoms: ['sudden_death', 'unclotted_dark_blood_discharge', 'extreme_fever'] },
    'Black Quarter': { name: 'Black Quarter (BQ)', weight: 0.9, lethal: true, symptoms: ['crackling_limb_swelling', 'lameness', 'muscle_twitching'] },
    'Haemorrhagic Septicaemia': { name: 'Haemorrhagic Septicaemia (HS)', weight: 0.95, lethal: true, symptoms: ['respiratory_distress', 'throat_swelling', 'cyanotic_mucous_membranes'] },
  };

  function computeTriage(reported: string[]) {
    let best: { name: string; matched: number; weight: number; lethal: boolean } | null = null;
    let bestFraction = 0;
    for (const p of Object.values(TRIAGE_PROFILES)) {
      const matched = p.symptoms.filter((s) => reported.includes(s)).length;
      const fraction = matched / p.symptoms.length;
      if (fraction > bestFraction) {
        bestFraction = fraction;
        best = { name: p.name, matched, weight: p.weight, lethal: p.lethal };
      }
    }
    if (!best || bestFraction === 0) {
      return { name: 'Inconclusive / General Malaise', confidence: 0, severity: 20, risk: 'low' as const, flag: false, lab: false, community: false };
    }
    const confidence = Math.round(bestFraction * 100 * 10) / 10;
    const severity = Math.round((bestFraction * 60 + best.weight * 40) * 10) / 10;
    let risk: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (best.lethal && (best.matched >= 2 || bestFraction >= 0.5)) risk = 'critical';
    else if (severity >= 70 || bestFraction >= 0.6) risk = 'high';
    else if (severity >= 40 || bestFraction >= 0.3) risk = 'medium';
    return {
      name: best.name,
      confidence,
      severity,
      risk,
      flag: bestFraction >= 0.4 || risk === 'high' || risk === 'critical',
      lab: risk === 'high' || risk === 'critical',
      community: risk === 'high' || risk === 'critical',
    };
  }

  // Mixed disease patterns drawn from the triage table symptom IDs.
  const SYMPTOM_REPORTS_SEED: Array<{
    animalTag: string;
    reporterEmail: string;
    symptoms: string[];
    status: 'pending' | 'triaged' | 'escalated' | 'resolved';
    gps: [number, number];
  }> = [
    { animalTag: '100011112224', reporterEmail: 'farmer.pune@pashudhan.gov.in', symptoms: ['fever_high', 'drooling', 'mouth_blisters', 'hoof_blisters', 'lameness'], status: 'escalated', gps: [18.84, 73.91] },
    { animalTag: '100011113332', reporterEmail: 'farmer.nashik@pashudhan.gov.in', symptoms: ['fever_high', 'nodular_skin_lesions', 'swollen_lymph_nodes', 'leg_edema'], status: 'triaged', gps: [19.99, 73.78] },
    { animalTag: '100011114441', reporterEmail: 'farmer.sambhajinagar@pashudhan.gov.in', symptoms: ['sudden_death', 'unclotted_dark_blood_discharge', 'extreme_fever'], status: 'escalated', gps: [19.87, 75.34] },
    { animalTag: '100011115553', reporterEmail: 'farmer.nagpur@pashudhan.gov.in', symptoms: ['mouth_sores', 'severe_diarrhea', 'respiratory_distress', 'nasal_discharge', 'ocular_discharge'], status: 'escalated', gps: [21.27, 78.58] },
    { animalTag: '100011112223', reporterEmail: 'farmer.pune@pashudhan.gov.in', symptoms: ['fever_high', 'drooling', 'mouth_blisters'], status: 'triaged', gps: [18.60, 73.87] },
    { animalTag: '100011112226', reporterEmail: 'farmer.kolhapur@pashudhan.gov.in', symptoms: ['fever_high', 'drooling', 'mouth_blisters', 'hoof_blisters', 'milk_yield_drop'], status: 'escalated', gps: [16.75, 74.45] },
    { animalTag: '100011113334', reporterEmail: 'farmer.nashik@pashudhan.gov.in', symptoms: ['fever_high', 'nodular_skin_lesions', 'leg_edema'], status: 'triaged', gps: [19.57, 74.21] },
    { animalTag: '100011116663', reporterEmail: 'farmer.amravati@pashudhan.gov.in', symptoms: ['fever_high', 'nodular_skin_lesions'], status: 'pending', gps: [20.52, 76.18] },
    { animalTag: '100011113331', reporterEmail: 'farmer.nashik@pashudhan.gov.in', symptoms: ['late_term_abortion', 'retained_placenta', 'infertility'], status: 'escalated', gps: [19.99, 73.78] },
    { animalTag: '100011116662', reporterEmail: 'farmer.amravati@pashudhan.gov.in', symptoms: ['retained_placenta'], status: 'resolved', gps: [20.70, 77.00] },
    { animalTag: '100011115554', reporterEmail: 'farmer.nagpur@pashudhan.gov.in', symptoms: ['crackling_limb_swelling', 'lameness', 'muscle_twitching'], status: 'escalated', gps: [20.74, 78.60] },
    { animalTag: '100011116661', reporterEmail: 'farmer.amravati@pashudhan.gov.in', symptoms: ['lameness', 'muscle_twitching'], status: 'pending', gps: [20.93, 77.75] },
    { animalTag: '100011114444', reporterEmail: 'farmer.sambhajinagar@pashudhan.gov.in', symptoms: ['respiratory_distress', 'throat_swelling'], status: 'triaged', gps: [18.40, 76.56] },
    { animalTag: '100011114443', reporterEmail: 'farmer.sambhajinagar@pashudhan.gov.in', symptoms: ['throat_swelling'], status: 'pending', gps: [18.18, 76.04] },
    { animalTag: '100011115552', reporterEmail: 'farmer.nagpur@pashudhan.gov.in', symptoms: ['fever_high', 'milk_yield_drop'], status: 'pending', gps: [20.85, 79.32] },
  ];

  let sampleCounter = 0;
  for (const r of SYMPTOM_REPORTS_SEED) {
    const animalId = createdAnimalMap[r.animalTag];
    const reporterId = createdUserMap[r.reporterEmail] || farmerPuneId;
    if (!animalId) {
      console.warn(`Skipping report for missing animal ${r.animalTag}`);
      continue;
    }

    // Idempotency: skip if this animal already has a seeded report
    const { data: existing } = await supabase
      .from('symptom_reports')
      .select('id')
      .eq('animal_id', animalId)
      .limit(1);
    if (existing && existing.length > 0) {
      console.log(`Report already exists for animal ${r.animalTag} — skipping`);
      continue;
    }

    const t = computeTriage(r.symptoms);
    const { data: rep, error: repErr } = await supabase.from('symptom_reports').insert({
      animal_id: animalId,
      reported_by: reporterId,
      symptoms: r.symptoms,
      gps_lat: r.gps[0],
      gps_lng: r.gps[1],
      status: r.status,
    }).select('id').single();

    if (!rep || repErr) {
      console.warn(`Failed to insert report for ${r.animalTag}:`, repErr?.message);
      continue;
    }

    // District derived from the animal registry row
    const { data: animalRow } = await supabase.from('animals').select('district').eq('id', animalId).single();

    if (t.flag) {
      await supabase.from('outbreak_flags').insert({
        symptom_report_id: rep.id,
        predicted_disease: t.name,
        confidence_pct: t.confidence,
        severity_score: t.severity,
        risk_level: t.risk,
        district: animalRow?.district || 'Pune',
      });
    }
    if (t.lab) {
      sampleCounter += 1;
      await supabase.from('lab_cases').insert({
        symptom_report_id: rep.id,
        sample_id: `LAB-20260909-${String(sampleCounter).padStart(4, '0')}`,
        status: t.risk === 'critical' ? 'received' : 'collected',
        status_history: [{ status: 'collected', notes: 'Sample collected by field paravet' }],
      });
    }
    if (t.community) {
      await supabase.from('community_posts').insert({
        source_symptom_report_id: rep.id,
        district: animalRow?.district || 'Pune',
        summary: `${t.risk === 'critical' ? 'EMERGENCY ADVISORY' : 'ADVISORY'}: Suspected ${t.name} event reported in ${animalRow?.district || 'Pune'} district. Isolate animals and contact the district veterinary officer.`,
      });
    }
    console.log(`Seeded report for ${r.animalTag} → ${t.name} (${t.risk})`);
  }

  // 4. Seed Health & Vaccination Records
  console.log('💉 Seeding vaccination records and booster dates...');
  const HEALTH_RECORDS_SEED: Array<{
    tag: string;
    byEmail: string;
    type: 'vaccination' | 'treatment' | 'checkup';
    description: string;
    agoDays: number;
    dueDays: number | null;
  }> = [
    { tag: '100011112222', byEmail: 'vet.pune@pashudhan.gov.in', type: 'vaccination', description: 'FMD Bi-Annual Booster (Raksha Ovac)', agoDays: 120, dueDays: 5 },
    { tag: '100011112222', byEmail: 'vet.pune@pashudhan.gov.in', type: 'vaccination', description: 'Black Quarter (BQ) Vaccine Dose', agoDays: 180, dueDays: null },
    { tag: '100011112223', byEmail: 'vet.pune@pashudhan.gov.in', type: 'vaccination', description: 'FMD Bi-Annual Booster (Raksha Ovac)', agoDays: 150, dueDays: 30 },
    { tag: '100011112227', byEmail: 'vet.pune@pashudhan.gov.in', type: 'vaccination', description: 'Haemorrhagic Septicaemia (HS) Vaccine', agoDays: 90, dueDays: null },
    { tag: '100011113331', byEmail: 'vet.nashik@pashudhan.gov.in', type: 'vaccination', description: 'Lumpy Skin Disease (LSD) Vaccination', agoDays: 60, dueDays: null },
    { tag: '100011113335', byEmail: 'vet.nashik@pashudhan.gov.in', type: 'vaccination', description: 'FMD Bi-Annual Booster (Raksha Ovac)', agoDays: 175, dueDays: 15 },
    { tag: '100011114445', byEmail: 'vet.sambhajinagar@pashudhan.gov.in', type: 'vaccination', description: 'Anthrax Spore Vaccine (Annual)', agoDays: 200, dueDays: null },
    { tag: '100011115551', byEmail: 'paravet.amravati@pashudhan.gov.in', type: 'vaccination', description: 'FMD Bi-Annual Booster (Raksha Ovac)', agoDays: 100, dueDays: 90 },
    { tag: '100011115555', byEmail: 'paravet.amravati@pashudhan.gov.in', type: 'vaccination', description: 'PPR Vaccination', agoDays: 45, dueDays: null },
    { tag: '100011115556', byEmail: 'paravet.amravati@pashudhan.gov.in', type: 'checkup', description: 'Routine health check-up — vitals normal', agoDays: 20, dueDays: null },
  ];

  for (const h of HEALTH_RECORDS_SEED) {
    const animalId = createdAnimalMap[h.tag];
    if (!animalId) continue;
    // Idempotency: skip if this animal already has any health record
    const { data: existingRec } = await supabase
      .from('health_records')
      .select('id')
      .eq('animal_id', animalId)
      .limit(1);
    if (existingRec && existingRec.length > 0) continue;
    await supabase.from('health_records').insert({
      animal_id: animalId,
      record_type: h.type,
      description: h.description,
      performed_by: createdUserMap[h.byEmail] || farmerPuneId,
      performed_at: new Date(Date.now() - h.agoDays * 24 * 60 * 60 * 1000).toISOString(),
      next_due_at: h.dueDays ? new Date(Date.now() + h.dueDays * 24 * 60 * 60 * 1000).toISOString() : null,
    });
  }

  // 5. Seed Sample Chatbot Session & Messages
  console.log('💬 Seeding sample chatbot session...');
  const { data: session } = await supabase
    .from('chatbot_sessions')
    .insert({
      user_id: farmerPuneId,
      channel: 'inapp',
    })
    .select('id')
    .single();

  if (session) {
    await supabase.from('chatbot_messages').insert([
      {
        session_id: session.id,
        sender: 'user',
        message: 'What are the symptoms of FMD in cattle?',
      },
      {
        session_id: session.id,
        sender: 'bot',
        message:
          'High fever (39.4-41°C), excessive drooling/salivation, blisters on mouth, hooves, and teats, sudden drop in milk yield, and lameness. Isolate the animal and contact your local vet immediately.',
        intent_matched: 'symptoms_fmd',
      },
    ]);
  }

  console.log('✅ Seed completed successfully! Synthetic datasets populated across Maharashtra districts.');
}

runSeed().catch(console.error);

