import { z } from 'zod';
import { NextRequest } from 'next/server';

export const UserRoleSchema = z.enum(['farmer', 'vet', 'paravet', 'lab', 'admin']);
export const PreferredLanguageSchema = z.enum(['en', 'hi', 'mr']);
export const RecordTypeSchema = z.enum(['vaccination', 'treatment', 'checkup']);
export const ReportStatusSchema = z.enum(['pending', 'triaged', 'escalated', 'resolved']);
export const RiskLevelSchema = z.enum(['low', 'medium', 'high', 'critical']);
export const LabStatusSchema = z.enum(['collected', 'in_transit', 'received', 'testing', 'completed']);

// India Bounding Box: Lat 6-38, Lng 68-98
export const GpsLatSchema = z
  .number()
  .min(6.0, { message: 'Latitude must be within India (>= 6.0)' })
  .max(38.0, { message: 'Latitude must be within India (<= 38.0)' });

export const GpsLngSchema = z
  .number()
  .min(68.0, { message: 'Longitude must be within India (>= 68.0)' })
  .max(98.0, { message: 'Longitude must be within India (<= 98.0)' });

// Tag UID must be exactly 12 digits
export const TagUidSchema = z
  .string()
  .regex(/^[0-9]{12}$/, { message: 'Tag UID must be exactly 12 digits (numbers only)' });

// Validation Schemas for Authentication
export const RegisterRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  full_name: z.string().min(2, 'Name is required'),
  role: UserRoleSchema.optional().default('farmer'),
  preferred_language: PreferredLanguageSchema.optional().default('mr'),
  phone: z.string().optional().nullable(),
  district: z.string().optional().default('Pune'),
  village: z.string().optional().nullable(),
  block: z.string().optional().nullable(),
  landline: z.string().optional().nullable(),
});

export const LoginRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Animal Registration Schema
export const CreateAnimalSchema = z.object({
  owner_id: z.string().optional(),
  tag_uid: TagUidSchema,
  species: z.string().min(1, 'Species is required'),
  breed: z.string().min(1, 'Breed is required'),
  sex: z.string().min(1, 'Sex is required'),
  date_of_birth: z.string().optional().nullable(),
  dob: z.string().optional().nullable(),
  gps_lat: z.number().optional().default(18.52),
  gps_lng: z.number().optional().default(73.85),
  village: z.string().optional().default('Pune'),
  district: z.string().optional().default('Pune'),
  owner_name: z.string().optional(),
  health_status: z.string().optional().default('healthy'),
});

// Symptom Report Schema
export const CreateSymptomReportSchema = z.object({
  animal_id: z.string().min(1, 'Animal selection is required'),
  symptoms: z.array(z.string()).min(1, 'At least one symptom must be selected'),
  gps_lat: z.number().optional().default(18.52),
  gps_lng: z.number().optional().default(73.85),
  media_urls: z.array(z.string()).optional().default([]),
});

// Health Record Schema
export const CreateHealthRecordSchema = z.object({
  animal_id: z.string().min(1),
  record_type: RecordTypeSchema,
  description: z.string().min(1),
  performed_by: z.string().optional(),
  performed_at: z.string().optional(),
  next_due_at: z.string().optional().nullable(),
});

// Lab Case Update Schema
export const UpdateLabCaseSchema = z.object({
  status: LabStatusSchema.optional(),
  result: z.string().optional().nullable(),
  assigned_lab_id: z.string().optional().nullable(),
});

// Advisory Schema
export const CreateAdvisorySchema = z.object({
  title: z.string().min(1),
  body_en: z.string().optional().default(''),
  body_hi: z.string().optional().default(''),
  body_mr: z.string().optional().default(''),
  district: z.string().min(1),
  disease: z.string().min(1),
  severity: RiskLevelSchema.optional().default('medium'),
});

// Chatbot Schemas
export const CreateChatbotSessionSchema = z.object({
  title: z.string().optional().default('New Consultation'),
  channel: z.string().optional().default('inapp'),
});

export const SendChatMessageSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
  mode: z.enum(['chat', 'predictor', 'scanner', 'search']).optional().default('chat'),
  context_animal_id: z.string().optional().nullable(),
});

// Symptoms Catalog & Diagnostic Definitions
export type DiagnosticSymptom =
  | 'fever_high'
  | 'drooling'
  | 'mouth_blisters'
  | 'hoof_blisters'
  | 'teat_blisters'
  | 'milk_yield_drop'
  | 'lameness'
  | 'nodular_skin_lesions'
  | 'swollen_lymph_nodes'
  | 'leg_edema'
  | 'mouth_sores'
  | 'severe_diarrhea'
  | 'respiratory_distress'
  | 'nasal_discharge'
  | 'ocular_discharge'
  | 'late_term_abortion'
  | 'retained_placenta'
  | 'infertility'
  | 'sudden_death'
  | 'unclotted_dark_blood_discharge'
  | 'extreme_fever'
  | 'crackling_limb_swelling'
  | 'muscle_twitching'
  | 'throat_swelling'
  | 'cyanotic_mucous_membranes';

export const DIAGNOSTIC_SYMPTOMS: { id: DiagnosticSymptom; label_en: string; label_mr: string; label_hi: string }[] = [
  { id: 'fever_high', label_en: 'High Fever (>104°F)', label_mr: 'तीव्र ताप (>१०४°F)', label_hi: 'तेज़ बुखार (>104°F)' },
  { id: 'drooling', label_en: 'Excessive Salivation / Drooling', label_mr: 'तोंडातून सतत लाळ गळणे', label_hi: 'मुँह से अत्यधिक लार गिरना' },
  { id: 'mouth_blisters', label_en: 'Mouth / Tongue Blisters', label_mr: 'तोंडात किंवा जिभेवर फोड', label_hi: 'मुँह या जीभ पर छाले' },
  { id: 'hoof_blisters', label_en: 'Foot / Hoof Lesions', label_mr: 'खुरांमध्ये जखमा किंवा फोड', label_hi: 'खुरों में घाव या छाले' },
  { id: 'teat_blisters', label_en: 'Teat Blisters', label_mr: 'कासेवर किंवा स्तनाग्र फोड', label_hi: 'थनों पर छाले' },
  { id: 'milk_yield_drop', label_en: 'Sudden Drop in Milk Yield', label_mr: 'दूध उत्पादनात अचानक घट', label_hi: 'दूध उत्पादन में अचानक गिरावट' },
  { id: 'lameness', label_en: 'Lameness / Difficulty Walking', label_mr: 'लंगडणे किंवा चालण्यास त्रास', label_hi: 'लंगड़ापन या चलने में परेशानी' },
  { id: 'nodular_skin_lesions', label_en: 'Hard Skin Nodules (Lumps)', label_mr: 'त्वचेवर कडक गाठी (लंपी स्पॉट्स)', label_hi: 'त्वचा पर सख्त गांठें (लंपी)' },
  { id: 'swollen_lymph_nodes', label_en: 'Swollen Lymph Nodes', label_mr: 'लसिका ग्रंथींना सूज (गाठी)', label_hi: 'सूजी हुई लिम्फ नोड्स' },
  { id: 'leg_edema', label_en: 'Leg / Dewlap Swelling', label_mr: 'पायांना किंवा छातीखाली सूज', label_hi: 'पैरों या छाती के नीचे सूजन' },
  { id: 'mouth_sores', label_en: 'Erosive Mouth Sores', label_mr: ' तोंडातील खोल लाल जखमा', label_hi: 'मुँह में गहरे घाव' },
  { id: 'severe_diarrhea', label_en: 'Foul Watery / Bloody Diarrhea', label_mr: 'तीव्र दुर्गंधीयुक्त अतिसार / जुलाब', label_hi: 'गंभीर बदबूदार या खूनी दस्त' },
  { id: 'respiratory_distress', label_en: 'Labored Breathing / Gasping', label_mr: 'श्वास घेण्यास त्रास / धाप लागणे', label_hi: 'साँस लेने में तकलीफ / हांफना' },
  { id: 'nasal_discharge', label_en: 'Thick Mucopurulent Nasal Discharge', label_mr: 'नाकातून घट्ट शेम्बूड / द्रव वाहणे', label_hi: 'नाक से गाढ़ा मवाद/द्रव बहना' },
  { id: 'ocular_discharge', label_en: 'Eye Discharge / Crusting', label_mr: 'डोळ्यातून पाणी किंवा चिपड येणे', label_hi: 'आँखों से पानी या कीचड़ आना' },
  { id: 'late_term_abortion', label_en: 'Late-Term Abortion', label_mr: 'गाभण जनावराचा गर्भपात (६-९ महिने)', label_hi: 'गर्भवती पशु का गर्भपात' },
  { id: 'retained_placenta', label_en: 'Retained Placenta (Afterbirth)', label_mr: 'वार न पडणे / अडकणे', label_hi: 'जेर (प्लेसेंटा) न गिरना' },
  { id: 'infertility', label_en: 'Repeat Breeding / Infertility', label_mr: 'वारंवार उलटणे / वांझपण', label_hi: 'बार-बार फिरना / बांझपन' },
  { id: 'sudden_death', label_en: 'Sudden Unexplained Death', label_mr: 'अचानक मृत्यु (काही तासांत)', label_hi: 'अचानक अस्पष्ट मृत्यु' },
  { id: 'unclotted_dark_blood_discharge', label_en: 'Dark Unclotted Blood from Orifices', label_mr: 'नाक/तोंडातून काळे न गोठणारे रक्त', label_hi: 'नाक/मुँह से काला न जमने वाला खून' },
  { id: 'extreme_fever', label_en: 'Extreme High Body Temp (>106°F)', label_mr: 'अतिशय तीव्र ताप (>१०६°F)', label_hi: 'अत्यधिक तेज़ बुखार (>106°F)' },
  { id: 'crackling_limb_swelling', label_en: 'Crepitating (Crackling) Swelling', label_mr: 'मांड्यांवर कुरकुरीत आवाज येणारी सूज', label_hi: 'जांघों पर कड़कड़ाहट वाली सूजन' },
  { id: 'muscle_twitching', label_en: 'Muscle Tremors & Rigidity', label_mr: 'स्नायू थरथरणे / ताठ होणे', label_hi: 'मांसपेशियों में कंपन या अकड़न' },
  { id: 'throat_swelling', label_en: 'Hot Painful Brisket & Neck Swelling', label_mr: 'मान व गळ्याखाली गरम वेदनामय सूज', label_hi: 'गर्दन और गले के नीचे गर्म दर्दनाक सूजन' },
  { id: 'cyanotic_mucous_membranes', label_en: 'Blueish / Dark Mucous Membranes', label_mr: 'जीभ व हिरड्या निळसर पडणे', label_hi: 'जीभ और मसूड़ों का नीला पड़ना' },
];

export const GENERAL_SYMPTOMS = DIAGNOSTIC_SYMPTOMS.map((s) => s.id);

// Pagination Parser: default limit 20, max 100
export interface PaginationParams {
  limit: number;
  offset: number;
}

export function parsePagination(request: NextRequest): {
  isValid: boolean;
  params: PaginationParams;
  error?: string;
} {
  const searchParams = request.nextUrl.searchParams;
  const limitParam = searchParams.get('limit');
  const offsetParam = searchParams.get('offset');

  let limit = 20;
  let offset = 0;

  if (limitParam !== null) {
    const parsedLimit = parseInt(limitParam, 10);
    if (isNaN(parsedLimit) || parsedLimit < 1) {
      return { isValid: false, params: { limit, offset }, error: 'Limit must be a positive integer' };
    }
    if (parsedLimit > 100) {
      return { isValid: false, params: { limit, offset }, error: 'Limit cannot exceed 100' };
    }
    limit = parsedLimit;
  }

  if (offsetParam !== null) {
    const parsedOffset = parseInt(offsetParam, 10);
    if (isNaN(parsedOffset) || parsedOffset < 0) {
      return { isValid: false, params: { limit, offset }, error: 'Offset must be a non-negative integer' };
    }
    offset = parsedOffset;
  }

  return {
    isValid: true,
    params: { limit, offset },
  };
}
