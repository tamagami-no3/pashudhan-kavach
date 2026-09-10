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

  // 3. Seed Symptom Reports + Outbreak Flags + Lab Cases
  console.log('🔬 Seeding symptom reports & triage outbreak cases...');
  const fmdAnimalId = createdAnimalMap['100011112224']; // Pune goat
  const lsdAnimalId = createdAnimalMap['100011113332']; // Nashik cow
  const anthraxAnimalId = createdAnimalMap['100011114441']; // Sambhajinagar cow
  const pprAnimalId = createdAnimalMap['100011115553']; // Nagpur goat

  if (fmdAnimalId) {
    const { data: rep } = await supabase.from('symptom_reports').insert({
      animal_id: fmdAnimalId,
      reported_by: farmerPuneId,
      symptoms: ['fever_high', 'drooling', 'mouth_blisters', 'hoof_blisters', 'lameness'],
      gps_lat: 18.52,
      gps_lng: 73.85,
      status: 'escalated',
    }).select('id').single();

    if (rep) {
      await supabase.from('outbreak_flags').insert({
        symptom_report_id: rep.id,
        predicted_disease: 'Foot and Mouth Disease (FMD)',
        confidence_pct: 71.4,
        severity_score: 72.5,
        risk_level: 'high',
        district: 'Pune',
      });
      await supabase.from('lab_cases').insert({
        symptom_report_id: rep.id,
        sample_id: 'LAB-20260908-0101',
        status: 'testing',
        status_history: [{ status: 'collected', notes: 'Epithelial tissue scraping collected' }],
      });
    }
  }

  if (lsdAnimalId) {
    const { data: rep } = await supabase.from('symptom_reports').insert({
      animal_id: lsdAnimalId,
      reported_by: farmerNashikId,
      symptoms: ['fever_high', 'nodular_skin_lesions', 'swollen_lymph_nodes', 'leg_edema'],
      gps_lat: 19.99,
      gps_lng: 73.78,
      status: 'triaged',
    }).select('id').single();

    if (rep) {
      await supabase.from('outbreak_flags').insert({
        symptom_report_id: rep.id,
        predicted_disease: 'Lumpy Skin Disease (LSD)',
        confidence_pct: 100.0,
        severity_score: 85.0,
        risk_level: 'high',
        district: 'Nashik',
      });
      await supabase.from('lab_cases').insert({
        symptom_report_id: rep.id,
        sample_id: 'LAB-20260908-0202',
        status: 'completed',
        result: 'Positive for Capripoxvirus (LSDV) by PCR',
        status_history: [{ status: 'completed', notes: 'Sequencing confirmed' }],
      });
    }
  }

  if (anthraxAnimalId) {
    const { data: rep } = await supabase.from('symptom_reports').insert({
      animal_id: anthraxAnimalId,
      reported_by: farmerSambhId,
      symptoms: ['sudden_death', 'unclotted_dark_blood_discharge', 'extreme_fever'],
      gps_lat: 19.87,
      gps_lng: 75.34,
      status: 'escalated',
    }).select('id').single();

    if (rep) {
      await supabase.from('outbreak_flags').insert({
        symptom_report_id: rep.id,
        predicted_disease: 'Anthrax',
        confidence_pct: 100.0,
        severity_score: 98.0,
        risk_level: 'critical',
        district: 'Chhatrapati Sambhajinagar',
      });
      await supabase.from('community_posts').insert({
        source_symptom_report_id: rep.id,
        district: 'Chhatrapati Sambhajinagar',
        summary: 'EMERGENCY ADVISORY: Suspected Anthrax event reported in Paithan taluka. Do not open carcasses. Ring vaccination underway.',
      });
    }
  }

  // 4. Seed Health & Vaccination Records
  console.log('💉 Seeding vaccination records and booster dates...');
  const healthyPuneCow = createdAnimalMap['100011112222'];
  if (healthyPuneCow) {
    await supabase.from('health_records').insert([
      {
        animal_id: healthyPuneCow,
        record_type: 'vaccination',
        description: 'FMD Bi-Annual Booster (Raksha Ovac)',
        performed_by: createdUserMap['vet.pune@pashudhan.gov.in'] || farmerPuneId,
        performed_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
        next_due_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // Due in 5 days!
      },
      {
        animal_id: healthyPuneCow,
        record_type: 'vaccination',
        description: 'Black Quarter (BQ) Vaccine Dose',
        performed_by: createdUserMap['vet.pune@pashudhan.gov.in'] || farmerPuneId,
        performed_at: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
        next_due_at: null,
      },
    ]);
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

