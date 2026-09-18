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

interface MockDistrictStaffAssignment {
  id: string;
  district_id: string;
  user_id: string;
  role: string;
  assigned_at: string;
}

interface MockDistrictAdminAction {
  id: string;
  district_id: string;
  admin_id: string;
  action_type: 'intervention' | 'risk_override';
  notes: string;
  override_level?: 'low' | 'medium' | 'high' | 'critical' | null;
  created_at: string;
}

export interface MockTriageTicket {
  ticket_id: string;
  report_id: string;
  status: 'reported' | 'officer_assigned' | 'vet_dispatched' | 'treatment_completed';
  triage: any;
  sla_minutes: number;
  sla_deadline: string;
  assigned_vet: {
    name: string;
    role: string;
    phone: string;
    vehicle_no: string;
    eta_minutes: number;
  };
  dispensary: {
    name: string;
    address: string;
    helpline: string;
    distance_km: number;
  };
  first_aid: string[];
  tag_uid?: string;
  symptoms: string[];
  created_at: string;
}

interface DBStructure {
  users: MockUser[];
  animals: MockAnimal[];
  symptom_reports: MockSymptomReport[];
  outbreak_flags: MockOutbreakFlag[];
  lab_cases: MockLabCase[];
  health_records: MockHealthRecord[];
  community_posts: MockCommunityPost[];
  district_staff_assignments?: MockDistrictStaffAssignment[];
  district_admin_actions?: MockDistrictAdminAction[];
  triage_tickets?: MockTriageTicket[];
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

export function saveCommunityPost(post: Omit<MockCommunityPost, 'id' | 'created_at'>): MockCommunityPost {
  const db = loadDB();
  const newPost: MockCommunityPost = {
    ...post,
    id: `post-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    created_at: new Date().toISOString(),
  };
  if (!db.community_posts) {
    db.community_posts = [];
  }
  db.community_posts.unshift(newPost);
  saveDB(db);
  return newPost;
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

// ----------------- OUTBREAK FLAGS ----------------- //
export function getOutbreakFlags(): MockOutbreakFlag[] {
  const db = loadDB();
  return db.outbreak_flags || [];
}

// ----------------- DISTRICT MANAGEMENT (BLOCK 1 & 4) ----------------- //
export function getDistrictAdminActions(districtId?: string): MockDistrictAdminAction[] {
  const db = loadDB();
  const actions = db.district_admin_actions || [];
  if (districtId) {
    return actions.filter((a) => a.district_id.toLowerCase() === districtId.toLowerCase());
  }
  return actions;
}

export function saveDistrictAdminAction(
  action: Omit<MockDistrictAdminAction, 'id' | 'created_at'>
): MockDistrictAdminAction {
  const db = loadDB();
  if (!db.district_admin_actions) {
    db.district_admin_actions = [];
  }
  const newAction: MockDistrictAdminAction = {
    ...action,
    id: `act-${Date.now()}`,
    created_at: new Date().toISOString(),
  };
  db.district_admin_actions.push(newAction);
  saveDB(db);
  return newAction;
}

export function getDistrictStaffAssignments(districtId?: string): MockDistrictStaffAssignment[] {
  const db = loadDB();
  const assignments = db.district_staff_assignments || [];
  if (districtId) {
    return assignments.filter((a) => a.district_id.toLowerCase() === districtId.toLowerCase());
  }
  return assignments;
}

export function upsertDistrictStaffAssignment(
  districtId: string,
  userId: string,
  role: string
): MockDistrictStaffAssignment {
  const db = loadDB();
  if (!db.district_staff_assignments) {
    db.district_staff_assignments = [];
  }
  const existingIdx = db.district_staff_assignments.findIndex(
    (a) => a.district_id.toLowerCase() === districtId.toLowerCase() && a.user_id === userId
  );

  const now = new Date().toISOString();
  if (existingIdx >= 0) {
    db.district_staff_assignments[existingIdx].role = role;
    db.district_staff_assignments[existingIdx].assigned_at = now;
    saveDB(db);
    return db.district_staff_assignments[existingIdx];
  }

  const newAssignment: MockDistrictStaffAssignment = {
    id: `staff-${Date.now()}`,
    district_id: districtId,
    user_id: userId,
    role,
    assigned_at: now,
  };
  db.district_staff_assignments.push(newAssignment);
  saveDB(db);
  return newAssignment;
}

export function getDistrictLatestOverride(districtName: string): 'low' | 'medium' | 'high' | 'critical' | null {
  const actions = getDistrictAdminActions(districtName);
  const overrides = actions
    .filter((a) => a.action_type === 'risk_override' && a.override_level)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return overrides[0]?.override_level || null;
}

// ----------------- TRIAGE TICKETS & CASE TRACKING ----------------- //
export function saveTriageTicket(ticket: MockTriageTicket): MockTriageTicket {
  const db = loadDB();
  if (!db.triage_tickets) {
    db.triage_tickets = [];
  }
  const existingIdx = db.triage_tickets.findIndex((t) => t.ticket_id === ticket.ticket_id);
  if (existingIdx >= 0) {
    db.triage_tickets[existingIdx] = ticket;
  } else {
    db.triage_tickets.unshift(ticket);
  }
  saveDB(db);
  return ticket;
}

export function findTriageTicket(ticketId: string): MockTriageTicket | undefined {
  const db = loadDB();
  const tickets = db.triage_tickets || [];
  return tickets.find(
    (t) => t.ticket_id.toLowerCase() === ticketId.toLowerCase() || t.report_id === ticketId
  );
}

export function getAllTriageTickets(): MockTriageTicket[] {
  const db = loadDB();
  return db.triage_tickets || [];
}

