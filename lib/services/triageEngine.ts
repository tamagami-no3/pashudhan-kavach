import { DiagnosticSymptom, GENERAL_SYMPTOMS } from '../validation';
import type { RiskLevel } from '@/types/database.types';

export interface DiseaseProfile {
  name: string;
  code: string;
  symptoms: DiagnosticSymptom[];
  baseSeverityWeight: number; // 0 to 1
  highLethality: boolean;
  isolationAdvice: string;
}

export const DISEASE_PROFILES: Record<string, DiseaseProfile> = {
  FMD: {
    name: 'Foot and Mouth Disease (FMD)',
    code: 'FMD',
    symptoms: [
      'fever_high',
      'drooling',
      'mouth_blisters',
      'hoof_blisters',
      'teat_blisters',
      'milk_yield_drop',
      'lameness',
    ],
    baseSeverityWeight: 0.75,
    highLethality: false,
    isolationAdvice: 'Isolate animal immediately, restrict herd movement, and apply antiseptic mouth/hoof wash.',
  },
  LSD: {
    name: 'Lumpy Skin Disease (LSD)',
    code: 'LSD',
    symptoms: ['fever_high', 'nodular_skin_lesions', 'swollen_lymph_nodes', 'leg_edema'],
    baseSeverityWeight: 0.8,
    highLethality: false,
    isolationAdvice: 'Isolate affected animal, use mosquito/fly repellents to prevent vector transmission.',
  },
  PPR: {
    name: 'Peste des Petits Ruminants (PPR)',
    code: 'PPR',
    symptoms: [
      'mouth_sores',
      'severe_diarrhea',
      'respiratory_distress',
      'nasal_discharge',
      'ocular_discharge',
    ],
    baseSeverityWeight: 0.85,
    highLethality: true,
    isolationAdvice: 'Strict isolation of sheep/goats, disinfect premises, provide electrolyte oral rehydration.',
  },
  Brucellosis: {
    name: 'Brucellosis',
    code: 'Brucellosis',
    symptoms: ['late_term_abortion', 'retained_placenta', 'infertility'],
    baseSeverityWeight: 0.7,
    highLethality: false,
    isolationAdvice: 'Wear PPE when handling aborted fetus or placenta (zoonotic risk). Isolate dam.',
  },
  Anthrax: {
    name: 'Anthrax',
    code: 'Anthrax',
    symptoms: ['sudden_death', 'unclotted_dark_blood_discharge', 'extreme_fever'],
    baseSeverityWeight: 0.98,
    highLethality: true,
    isolationAdvice: 'CRITICAL ZOONOSIS: DO NOT open or move carcass. Cordon off area and alert District Vet urgently.',
  },
  'Black Quarter': {
    name: 'Black Quarter (BQ)',
    code: 'Black Quarter',
    symptoms: ['crackling_limb_swelling', 'lameness', 'muscle_twitching'],
    baseSeverityWeight: 0.9,
    highLethality: true,
    isolationAdvice: 'Administer emergency high-dose penicillin if early. Isolate and disinfect housing.',
  },
  'Haemorrhagic Septicaemia': {
    name: 'Haemorrhagic Septicaemia (HS)',
    code: 'Haemorrhagic Septicaemia',
    symptoms: ['respiratory_distress', 'throat_swelling', 'cyanotic_mucous_membranes'],
    baseSeverityWeight: 0.95,
    highLethality: true,
    isolationAdvice: 'Isolate cattle/buffaloes, start immediate antibiotic therapy under veterinary supervision.',
  },
};

export interface TriageResult {
  predictedDisease: string;
  diseaseCode: string;
  confidencePct: number;
  severityScore: number;
  riskLevel: RiskLevel;
  matchedSymptoms: string[];
  totalDiseaseSymptoms: number;
  allDiseaseScores: Array<{
    disease: string;
    score: number;
    matched: string[];
  }>;
  requiresOutbreakFlag: boolean;
  requiresLabCase: boolean;
  requiresCommunityNotice: boolean;
  isolationAdvice: string;
}

/**
 * Rule-based disease triage engine.
 * Computes fraction of signature symptoms matched for each known disease.
 */
export function runDiseaseTriage(reportedSymptoms: string[]): TriageResult {
  const presentSet = new Set(reportedSymptoms);

  // Check if only general symptoms are present
  const onlyGeneral = reportedSymptoms.length > 0 &&
    reportedSymptoms.every((s) => GENERAL_SYMPTOMS.includes(s as any));

  if (onlyGeneral || reportedSymptoms.length === 0) {
    return {
      predictedDisease: 'Inconclusive / General Malaise',
      diseaseCode: 'INCONCLUSIVE',
      confidencePct: 0,
      severityScore: 10,
      riskLevel: 'low',
      matchedSymptoms: [],
      totalDiseaseSymptoms: 0,
      allDiseaseScores: [],
      requiresOutbreakFlag: false,
      requiresLabCase: false,
      requiresCommunityNotice: false,
      isolationAdvice: 'Monitor animal temperature and appetite. Provide clean water and soft fodder.',
    };
  }

  const scores: Array<{
    profile: DiseaseProfile;
    matched: string[];
    fraction: number;
  }> = [];

  for (const profile of Object.values(DISEASE_PROFILES)) {
    const matched = profile.symptoms.filter((s) => presentSet.has(s));
    const fraction = matched.length / profile.symptoms.length;
    scores.push({
      profile,
      matched,
      fraction,
    });
  }

  // Sort by highest fraction matched, then base severity
  scores.sort((a, b) => {
    if (b.fraction !== a.fraction) {
      return b.fraction - a.fraction;
    }
    return b.profile.baseSeverityWeight - a.profile.baseSeverityWeight;
  });

  const best = scores[0];

  if (!best || best.fraction === 0) {
    return {
      predictedDisease: 'Unspecified Symptom Presentation',
      diseaseCode: 'UNSPECIFIED',
      confidencePct: 0,
      severityScore: 20,
      riskLevel: 'low',
      matchedSymptoms: [],
      totalDiseaseSymptoms: 0,
      allDiseaseScores: [],
      requiresOutbreakFlag: false,
      requiresLabCase: false,
      requiresCommunityNotice: false,
      isolationAdvice: 'Consult local veterinary officer for comprehensive physical examination.',
    };
  }

  const confidencePct = Math.round(best.fraction * 100 * 10) / 10;
  const severityScore = Math.round(
    (best.fraction * 60 + best.profile.baseSeverityWeight * 40) * 10
  ) / 10;

  let riskLevel: RiskLevel = 'low';
  if (best.profile.highLethality && (best.matched.length >= 2 || best.fraction >= 0.5)) {
    riskLevel = 'critical';
  } else if (severityScore >= 70 || best.fraction >= 0.6) {
    riskLevel = 'high';
  } else if (severityScore >= 40 || best.fraction >= 0.3) {
    riskLevel = 'medium';
  } else {
    riskLevel = 'low';
  }

  const requiresOutbreakFlag = best.fraction >= 0.4 || riskLevel === 'high' || riskLevel === 'critical';
  const requiresLabCase = riskLevel === 'high' || riskLevel === 'critical';
  const requiresCommunityNotice = riskLevel === 'high' || riskLevel === 'critical';

  return {
    predictedDisease: best.profile.name,
    diseaseCode: best.profile.code,
    confidencePct,
    severityScore,
    riskLevel,
    matchedSymptoms: best.matched,
    totalDiseaseSymptoms: best.profile.symptoms.length,
    allDiseaseScores: scores.map((s) => ({
      disease: s.profile.name,
      score: Math.round(s.fraction * 100),
      matched: s.matched,
    })),
    requiresOutbreakFlag,
    requiresLabCase,
    requiresCommunityNotice,
    isolationAdvice: best.profile.isolationAdvice,
  };
}

