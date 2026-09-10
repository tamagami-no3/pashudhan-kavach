// Complete In-Memory Mock Database Store with pre-seeded synthetic data for Maharashtra
import QRCode from 'qrcode';

export interface MockUser {
  id: string;
  email: string;
  full_name: string;
  role: 'farmer' | 'vet' | 'paravet' | 'lab' | 'admin';
  district: string;
  preferred_language: 'en' | 'hi' | 'mr';
  phone?: string;
  is_active: boolean;
  is_verified: boolean;
  village?: string;
  block?: string;
  created_at: string;
}

export interface MockAnimal {
  id: string;
  owner_id: string;
  tag_uid: string;
  species: string;
  breed: string;
  sex: string;
  dob?: string;
  gps_lat: number;
  gps_lng: number;
  village: string;
  district: string;
  health_status: string;
  qr_code_url?: string;
  created_by: string;
  created_at: string;
}

export interface MockSymptomReport {
  id: string;
  animal_id: string;
  reported_by: string;
  symptoms: string[];
  media_urls: string[];
  gps_lat: number;
  gps_lng: number;
  status: 'pending' | 'triaged' | 'escalated' | 'resolved';
  reported_at: string;
  created_at: string;
}

export interface MockOutbreakFlag {
  id: string;
  symptom_report_id: string;
  predicted_disease: string;
  confidence_pct: number;
  severity_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  district: string;
  created_at: string;
}

export interface MockLabCase {
  id: string;
  symptom_report_id: string;
  sample_id: string;
  assigned_lab_id?: string;
  status: 'collected' | 'in_transit' | 'received' | 'testing' | 'completed';
  result?: string | null;
  status_history: any[];
  completed_at?: string;
  created_at: string;
}

export interface MockAdvisory {
  id: string;
  title: string;
  body_en: string;
  body_hi: string;
  body_mr: string;
  district: string;
  disease: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  created_by: string;
  created_at: string;
}

export interface MockCommunityPost {
  id: string;
  source_symptom_report_id?: string;
  district: string;
  summary: string;
  summary_en?: string;
  summary_hi?: string;
  summary_mr?: string;
  created_at: string;
}

export interface MockHealthRecord {
  id: string;
  animal_id: string;
  record_type: 'vaccination' | 'treatment' | 'checkup';
  description: string;
  performed_by: string;
  performed_at: string;
  next_due_at?: string | null;
  created_at: string;
}

// ----------------- PRE-SEEDED SYNTHETIC DATA ----------------- //

export const MOCK_USERS: MockUser[] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    email: 'farmer.pune@pashudhan.gov.in',
    full_name: 'रामेश बाळासाहेब पाटील (Ramesh Patil)',
    role: 'farmer',
    district: 'Pune',
    preferred_language: 'mr',
    phone: '9822099991',
    is_active: true,
    is_verified: true,
    village: 'Shirur',
    block: 'Haveli',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    email: 'vet.nashik@pashudhan.gov.in',
    full_name: 'डॉ. विजय शिंदे (Dr. Vijay Shinde)',
    role: 'vet',
    district: 'Nashik',
    preferred_language: 'mr',
    phone: '9822033333',
    is_active: true,
    is_verified: true,
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    email: 'lab.nagpur@pashudhan.gov.in',
    full_name: 'डॉ. मीरा जोशी (Dr. Meera Joshi)',
    role: 'lab',
    district: 'Nagpur',
    preferred_language: 'en',
    phone: '9822077777',
    is_active: true,
    is_verified: true,
    created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
  },
  {
    id: '44444444-4444-4444-8444-444444444444',
    email: 'admin@pashudhan.gov.in',
    full_name: 'डॉ. आनंद देशमुख (Dr. Anand Deshmukh)',
    role: 'admin',
    district: 'Pune',
    preferred_language: 'mr',
    phone: '9822011111',
    is_active: true,
    is_verified: true,
    created_at: new Date(Date.now() - 100 * 86400000).toISOString(),
  },
  {
    id: '55555555-5555-4555-8555-555555555555',
    email: 'farmer.nashik@pashudhan.gov.in',
    full_name: 'ज्ञानेश्वर जाधव (Dnyaneshwar Jadhav)',
    role: 'farmer',
    district: 'Nashik',
    preferred_language: 'mr',
    phone: '9822099992',
    is_active: true,
    is_verified: true,
    village: 'Dindori',
    block: 'Niphad',
    created_at: new Date(Date.now() - 40 * 86400000).toISOString(),
  },
];

export const MOCK_ANIMALS: MockAnimal[] = [
  {
    id: 'anim-101',
    owner_id: '11111111-1111-4111-8111-111111111111',
    tag_uid: '100011112222',
    species: 'Cattle',
    breed: 'Gir Cow (गीर गाय)',
    sex: 'Female',
    dob: '2022-04-15',
    gps_lat: 18.52,
    gps_lng: 73.85,
    village: 'Shirur',
    district: 'Pune',
    health_status: 'healthy',
    qr_code_url: '',
    created_by: '11111111-1111-4111-8111-111111111111',
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
  {
    id: 'anim-102',
    owner_id: '11111111-1111-4111-8111-111111111111',
    tag_uid: '100011112223',
    species: 'Buffalo',
    breed: 'Murrah (मु्र्ऱ्हा म्हैस)',
    sex: 'Female',
    dob: '2021-08-20',
    gps_lat: 18.15,
    gps_lng: 74.57,
    village: 'Baramati',
    district: 'Pune',
    health_status: 'healthy',
    qr_code_url: '',
    created_by: '11111111-1111-4111-8111-111111111111',
    created_at: new Date(Date.now() - 50 * 86400000).toISOString(),
  },
  {
    id: 'anim-103',
    owner_id: '11111111-1111-4111-8111-111111111111',
    tag_uid: '100011112224',
    species: 'Goat',
    breed: 'Osmanabadi (उस्मानाबादी शेळी)',
    sex: 'Female',
    dob: '2023-01-10',
    gps_lat: 18.84,
    gps_lng: 73.91,
    village: 'Khed',
    district: 'Pune',
    health_status: 'symptomatic',
    qr_code_url: '',
    created_by: '11111111-1111-4111-8111-111111111111',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'anim-104',
    owner_id: '55555555-5555-4555-8555-555555555555',
    tag_uid: '100011113332',
    species: 'Cattle',
    breed: 'HF Cross (एचएफ क्रॉस)',
    sex: 'Female',
    dob: '2020-05-12',
    gps_lat: 19.99,
    gps_lng: 73.78,
    village: 'Dindori',
    district: 'Nashik',
    health_status: 'symptomatic',
    qr_code_url: '',
    created_by: '55555555-5555-4555-8555-555555555555',
    created_at: new Date(Date.now() - 45 * 86400000).toISOString(),
  },
];

export const MOCK_SYMPTOM_REPORTS: MockSymptomReport[] = [
  {
    id: 'rep-201',
    animal_id: 'anim-103',
    reported_by: '11111111-1111-4111-8111-111111111111',
    symptoms: ['fever_high', 'drooling', 'mouth_blisters', 'hoof_blisters', 'lameness'],
    media_urls: [],
    gps_lat: 18.84,
    gps_lng: 73.91,
    status: 'escalated',
    reported_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'rep-202',
    animal_id: 'anim-104',
    reported_by: '55555555-5555-4555-8555-555555555555',
    symptoms: ['fever_high', 'nodular_skin_lesions', 'swollen_lymph_nodes', 'leg_edema'],
    media_urls: [],
    gps_lat: 19.99,
    gps_lng: 73.78,
    status: 'triaged',
    reported_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
];

export const MOCK_OUTBREAK_FLAGS: MockOutbreakFlag[] = [
  {
    id: 'flag-301',
    symptom_report_id: 'rep-201',
    predicted_disease: 'Foot and Mouth Disease (FMD)',
    confidence_pct: 71.4,
    severity_score: 72.5,
    risk_level: 'high',
    district: 'Pune',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'flag-302',
    symptom_report_id: 'rep-202',
    predicted_disease: 'Lumpy Skin Disease (LSD)',
    confidence_pct: 100.0,
    severity_score: 85.0,
    risk_level: 'high',
    district: 'Nashik',
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
];

export const MOCK_LAB_CASES: MockLabCase[] = [
  {
    id: 'lab-401',
    symptom_report_id: 'rep-201',
    sample_id: 'LAB-20260908-0101',
    assigned_lab_id: '33333333-3333-4333-8333-333333333333',
    status: 'testing',
    result: null,
    status_history: [{ status: 'collected', updated_at: new Date(Date.now() - 2 * 86400000).toISOString() }],
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'lab-402',
    symptom_report_id: 'rep-202',
    sample_id: 'LAB-20260908-0202',
    assigned_lab_id: '33333333-3333-4333-8333-333333333333',
    status: 'completed',
    result: 'Positive for Capripoxvirus (LSDV) by RT-PCR',
    status_history: [{ status: 'completed', updated_at: new Date(Date.now() - 1 * 86400000).toISOString() }],
    completed_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
];

export const MOCK_HEALTH_RECORDS: MockHealthRecord[] = [
  {
    id: 'hr-501',
    animal_id: 'anim-101',
    record_type: 'vaccination',
    description: 'FMD Bi-Annual Booster (Raksha Ovac)',
    performed_by: '22222222-2222-4222-8222-222222222222',
    performed_at: new Date(Date.now() - 120 * 86400000).toISOString(),
    next_due_at: new Date(Date.now() + 4 * 86400000).toISOString(), // Due in 4 days!
    created_at: new Date(Date.now() - 120 * 86400000).toISOString(),
  },
  {
    id: 'hr-502',
    animal_id: 'anim-102',
    record_type: 'vaccination',
    description: 'Black Quarter (BQ) Vaccine Dose',
    performed_by: '22222222-2222-4222-8222-222222222222',
    performed_at: new Date(Date.now() - 150 * 86400000).toISOString(),
    next_due_at: new Date(Date.now() + 6 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 150 * 86400000).toISOString(),
  },
];

export const MOCK_COMMUNITY_POSTS: MockCommunityPost[] = [
  {
    id: 'post-601',
    district: 'Pune',
    summary: 'इशारा: शिरूर व खेड तालुक्यात एफएमडी (लाळ्या खुरकूत) चा प्रादुर्भाव आढळला आहे. बाधित जनावरांना वेगळे ठेवा व जंतूनाशक फवारणी करा.',
    summary_en: 'Warning: FMD (Foot & Mouth Disease) outbreak detected in Shirur and Khed talukas. Isolate affected animals and apply disinfectant spray immediately.',
    summary_hi: 'चेतावनी: शिरूर और खेड तालुकों में एफएमडी (खुरपका-मुंहपका रोग) का प्रकोप पाया गया है। प्रभावित पशुओं को अलग रखें और कीटाणुनाशक छिड़काव करें।',
    summary_mr: 'इशारा: शिरूर व खेड तालुक्यात एफएमडी (लाळ्या खुरकूत) चा प्रादुर्भाव आढळला आहे. बाधित जनावरांना वेगळे ठेवा व जंतूनाशक फवारणी करा.',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'post-602',
    district: 'Nashik',
    summary: 'सावधान: दिंडोरी भागात लंपी स्कीन (LSD) चे रुग्ण आढळले आहेत. डास व माशांचे नियंत्रण करा व त्वरित लसीकरण पूर्ण करून घ्या.',
    summary_en: 'Caution: Lumpy Skin Disease (LSD) cases detected in Dindori area. Control mosquitoes and flies, and complete vaccination immediately.',
    summary_hi: 'सावधान: दिंडोरी क्षेत्र में लंपी स्किन डिजीज (LSD) के मामले पाए गए हैं। मच्छरों और मक्खियों को नियंत्रित करें और तुरंत टीकाकरण पूरा करवाएं।',
    summary_mr: 'सावधान: दिंडोरी भागात लंपी स्कीन (LSD) चे रुग्ण आढळले आहेत. डास व माशांचे नियंत्रण करा व त्वरित लसीकरण पूर्ण करून घ्या.',
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: 'post-603',
    district: 'Chhatrapati Sambhajinagar',
    summary: 'इर्मजन्सी अलर्ट: पैठण तालुक्यात अँथ्रॅक्स संशयित मृत्यूची नोंद. मृत जनावराची उघड्यावर विल्हेवाट लावू नका व संपर्क टाळा.',
    summary_en: 'Emergency Alert: Suspected Anthrax death reported in Paithan taluka. Do not dispose of the carcass in the open and avoid contact.',
    summary_hi: 'आपातकालीन अलर्ट: पैठण तालुके में एंथ्रेक्स से संदिग्ध मृत्यु की सूचना। मृत पशु को खुले में न फेंकें और संपर्क से बचें।',
    summary_mr: 'इर्मजन्सी अलर्ट: पैठण तालुक्यात अँथ्रॅक्स संशयित मृत्यूची नोंद. मृत जनावराची उघड्यावर विल्हेवाट लावू नका व संपर्क टाळा.',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
];

// ----------------- IN-MEMORY MUTATION HELPERS ----------------- //

export async function addMockUser(user: Omit<MockUser, 'id' | 'created_at'>): Promise<MockUser> {
  const newU: MockUser = {
    ...user,
    id: `user-${Date.now()}`,
    created_at: new Date().toISOString(),
  };
  MOCK_USERS.push(newU);
  return newU;
}

export async function addMockAnimal(animal: Omit<MockAnimal, 'id' | 'created_at' | 'qr_code_url'>): Promise<MockAnimal> {
  let qrUrl = '';
  try {
    qrUrl = await QRCode.toDataURL(`https://pashudhan.gov.in/verify/${animal.tag_uid}`, { margin: 2 });
  } catch {}

  const newA: MockAnimal = {
    ...animal,
    id: `anim-${Date.now()}`,
    qr_code_url: qrUrl,
    created_at: new Date().toISOString(),
  };
  MOCK_ANIMALS.unshift(newA);
  return newA;
}

export async function addMockSymptomReport(rep: Omit<MockSymptomReport, 'id' | 'created_at' | 'reported_at'>): Promise<MockSymptomReport> {
  const newR: MockSymptomReport = {
    ...rep,
    id: `rep-${Date.now()}`,
    reported_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };
  MOCK_SYMPTOM_REPORTS.unshift(newR);
  return newR;
}

