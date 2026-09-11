import fs from 'fs';
import path from 'path';
import QRCode from 'qrcode';
import {
  MOCK_USERS,
  MOCK_ANIMALS,
  MOCK_SYMPTOM_REPORTS,
  MOCK_OUTBREAK_FLAGS,
  MOCK_LAB_CASES,
  MOCK_HEALTH_RECORDS,
  MOCK_COMMUNITY_POSTS,
  MockUser,
  MockAnimal,
  MockSymptomReport,
  MockOutbreakFlag,
  MockLabCase,
  MockHealthRecord,
  MockCommunityPost,
} from './mock-db';

interface DBStructure {
  users: MockUser[];
  animals: MockAnimal[];
  symptom_reports: MockSymptomReport[];
  outbreak_flags: MockOutbreakFlag[];
  lab_cases: MockLabCase[];
  health_records: MockHealthRecord[];
  community_posts: MockCommunityPost[];
}

const DB_FILE_PATH = path.join(process.cwd(), 'data', 'db.json');

function ensureDataDirectory() {
  const dir = path.dirname(DB_FILE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadDB(): DBStructure {
  ensureDataDirectory();
  if (!fs.existsSync(DB_FILE_PATH)) {
    const initialDB: DBStructure = {
      users: MOCK_USERS,
      animals: MOCK_ANIMALS,
      symptom_reports: MOCK_SYMPTOM_REPORTS,
      outbreak_flags: MOCK_OUTBREAK_FLAGS,
      lab_cases: MOCK_LAB_CASES,
      health_records: MOCK_HEALTH_RECORDS,
      community_posts: MOCK_COMMUNITY_POSTS,
    };
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(initialDB, null, 2), 'utf-8');
    return initialDB;
  }

  try {
    const content = fs.readFileSync(DB_FILE_PATH, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error('Error reading db.json, falling back to mock seed data:', err);
    return {
      users: MOCK_USERS,
      animals: MOCK_ANIMALS,
      symptom_reports: MOCK_SYMPTOM_REPORTS,
      outbreak_flags: MOCK_OUTBREAK_FLAGS,
      lab_cases: MOCK_LAB_CASES,
      health_records: MOCK_HEALTH_RECORDS,
      community_posts: MOCK_COMMUNITY_POSTS,
    };
  }
}

function saveDB(db: DBStructure) {
  ensureDataDirectory();
  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving db.json:', err);
  }
}

// ----------------- USERS ----------------- //
export function getUsers(): MockUser[] {
  const db = loadDB();
  return db.users;
}

export function findUserByEmail(email: string): MockUser | undefined {
  const db = loadDB();
  return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function findUserById(id: string): MockUser | undefined {
  const db = loadDB();
  return db.users.find((u) => u.id === id);
}

export function saveUser(user: Omit<MockUser, 'id' | 'created_at'>): MockUser {
  const db = loadDB();
  const existing = db.users.find((u) => u.email.toLowerCase() === user.email.toLowerCase());
  if (existing) {
    Object.assign(existing, user);
    saveDB(db);
    return existing;
  }
  const newUser: MockUser = {
    ...user,
    id: `user-${Date.now()}`,
    created_at: new Date().toISOString(),
  };
  db.users.push(newUser);
  saveDB(db);
  return newUser;
}

// ----------------- ANIMALS ----------------- //
export function getAnimals(species?: string, district?: string): MockAnimal[] {
  const db = loadDB();
  return db.animals.filter((a) => {
    if (species && a.species.toLowerCase() !== species.toLowerCase()) return false;
    if (district && a.district.toLowerCase() !== district.toLowerCase()) return false;
    return true;
  });
}

export function findAnimalByTag(tagUid: string): MockAnimal | undefined {
  const db = loadDB();
  return db.animals.find((a) => a.tag_uid === tagUid);
}

export function findAnimalById(id: string): MockAnimal | undefined {
  const db = loadDB();
  return db.animals.find((a) => a.id === id);
}

export async function saveAnimal(animal: Omit<MockAnimal, 'id' | 'created_at' | 'qr_code_url'>): Promise<MockAnimal> {
  const db = loadDB();
  let qrUrl = '';
  try {
    qrUrl = await QRCode.toDataURL(`https://pashudhan.gov.in/verify/${animal.tag_uid}`, { margin: 2 });
  } catch {}

  const newAnimal: MockAnimal = {
    ...animal,
    id: `anim-${Date.now()}`,
    qr_code_url: qrUrl,
    created_at: new Date().toISOString(),
  };
  db.animals.push(newAnimal);
  saveDB(db);
  return newAnimal;
}

// ----------------- SYMPTOM REPORTS ----------------- //
export function getSymptomReports(): MockSymptomReport[] {
  const db = loadDB();
  return db.symptom_reports;
}

export function saveSymptomReport(report: Omit<MockSymptomReport, 'id' | 'created_at' | 'reported_at'>): {
  report: MockSymptomReport;
  outbreak_flag?: MockOutbreakFlag;
  lab_case?: MockLabCase;
  community_post?: MockCommunityPost;
} {
  const db = loadDB();
  const now = new Date().toISOString();
  const newReport: MockSymptomReport = {
    ...report,
    id: `rep-${Date.now()}`,
    reported_at: now,
    created_at: now,
  };
  db.symptom_reports.push(newReport);

  const animal = db.animals.find((a) => a.id === report.animal_id);
  const district = animal?.district || 'Pune';

  let outbreak_flag: MockOutbreakFlag | undefined;
  let lab_case: MockLabCase | undefined;
  let community_post: MockCommunityPost | undefined;

  // Auto-triage rule trigger
  if (report.symptoms.length >= 2) {
    if (animal) {
      animal.health_status = 'symptomatic';
    }

    outbreak_flag = {
      id: `flag-${Date.now()}`,
      symptom_report_id: newReport.id,
      predicted_disease: report.symptoms.includes('mouth_blisters') ? 'Foot and Mouth Disease (FMD)' : 'Lumpy Skin Disease (LSD)',
      confidence_pct: 85,
      severity_score: 80,
      risk_level: 'high',
      district,
      created_at: now,
    };
    db.outbreak_flags.push(outbreak_flag);

    lab_case = {
      id: `lab-${Date.now()}`,
      symptom_report_id: newReport.id,
      sample_id: `LAB-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'collected',
      status_history: [{ status: 'collected', updated_at: now }],
      created_at: now,
    };
    db.lab_cases.push(lab_case);

    community_post = {
      id: `post-${Date.now()}`,
      source_symptom_report_id: newReport.id,
      district,
      summary: `इशारा: ${district} भागात ${outbreak_flag.predicted_disease} चे लक्षण आढळले आहेत. पशुपालकांनी दक्षता घ्यावी.`,
      created_at: now,
    };
    db.community_posts.push(community_post);
  }

  saveDB(db);
  return { report: newReport, outbreak_flag, lab_case, community_post };
}

// ----------------- LAB CASES ----------------- //
export function getLabCases(status?: string): MockLabCase[] {
  const db = loadDB();
  if (status) {
    return db.lab_cases.filter((c) => c.status === status);
  }
  return db.lab_cases;
}

export function updateLabCase(id: string, updates: Partial<MockLabCase>): MockLabCase | undefined {
  const db = loadDB();
  const c = db.lab_cases.find((item) => item.id === id);
  if (c) {
    Object.assign(c, updates);
    if (updates.status) {
      c.status_history.push({ status: updates.status, updated_at: new Date().toISOString() });
    }
    saveDB(db);
  }
  return c;
}

// ----------------- COMMUNITY POSTS ----------------- //
export function getCommunityPosts(district?: string): MockCommunityPost[] {
  const db = loadDB();
  if (district) {
    return db.community_posts.filter((p) => p.district.toLowerCase() === district.toLowerCase());
  }
  return db.community_posts;
}

// ----------------- HEALTH RECORDS ----------------- //
export function getHealthRecordsDue7Days(): MockHealthRecord[] {
  const db = loadDB();
  return db.health_records;
}

export function getHealthRecordsByAnimalId(animalId: string): MockHealthRecord[] {
  const db = loadDB();
  return db.health_records.filter((h) => h.animal_id === animalId);
}

export function findSymptomReportById(id: string): MockSymptomReport | undefined {
  const db = loadDB();
  return db.symptom_reports.find((r) => r.id === id);
}

