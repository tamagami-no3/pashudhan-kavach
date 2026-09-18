export interface SymptomDescriptor {
  id: string;
  key: string;
  iconName: string;
  label_mr: string;
  label_hi: string;
  label_en: string;
  folk_desc_mr: string;
  folk_desc_hi: string;
  folk_desc_en: string;
  keywords: string[];
  diseases: string[];
  urgency: 'none' | 'caution' | 'urgent';
}

export const CLINICAL_SYMPTOMS_CATALOG: SymptomDescriptor[] = [
  {
    id: 'fever_high',
    key: 'fever',
    iconName: 'Thermometer',
    label_mr: 'तीव्र ताप (>१०४°F)',
    label_hi: 'तेज़ बुखार (>104°F)',
    label_en: 'High Fever (>104°F)',
    folk_desc_mr: 'जनावर तापलेले वाटते, कान गरम होतात, चारा खात नाही',
    folk_desc_hi: 'जानवर गर्म लगता है, कान गर्म हैं, खाना नहीं खा रहा',
    folk_desc_en: 'Hot ears, shivering body, completely off feed',
    keywords: ['ताप', 'fever', 'बुखार', 'गरम', 'temperature', 'कडक ताप'],
    diseases: ['FMD', 'LSD', 'HS', 'BQ', 'Anthrax'],
    urgency: 'caution',
  },
  {
    id: 'drooling',
    key: 'drooling',
    iconName: 'Droplets',
    label_mr: 'तोंडातून सतत लाळ गळणे',
    label_hi: 'मुँह से अत्यधिक लार गिरना',
    label_en: 'Excessive Drooling / Salivation',
    folk_desc_mr: 'तोंडातून तार तुटल्यासारखी पांढरी लाळ सतत जमिनीवर गळते',
    folk_desc_hi: 'मुंह से लगातार झागदार लार नीचे गिरती रहती है',
    folk_desc_en: 'Ropy strings of saliva dripping continuously from mouth',
    keywords: ['लाळ', 'drool', 'saliva', 'लार', 'फेसाळ लाळ', 'तार गळणे'],
    diseases: ['FMD', 'HS'],
    urgency: 'caution',
  },
  {
    id: 'mouth_blisters',
    key: 'mouth_blisters',
    iconName: 'AlertCircle',
    label_mr: 'तोंडात व जिभेवर फोड',
    label_hi: 'मुँह और जीभ पर छाले',
    label_en: 'Mouth & Tongue Blisters',
    folk_desc_mr: 'जिभेवर, ओठांवर लाल फोड किंवा चट्टे, चावताना दुखते',
    folk_desc_hi: 'जीभ और होंठों पर लाल छाले, चारा चबाने में दर्द',
    folk_desc_en: 'Ulcerated blisters on dental pad, lips, and tongue',
    keywords: ['तोंडात फोड', 'जीभ', 'mouth blister', 'छाले', 'फोड', 'ओठावर फोड'],
    diseases: ['FMD'],
    urgency: 'caution',
  },
  {
    id: 'hoof_blisters',
    key: 'hoof_blisters',
    iconName: 'Footprints',
    label_mr: 'खुरांमध्ये जखमा व फोड',
    label_hi: 'खुरों में घाव और छाले',
    label_en: 'Hoof Ulcers & Cleft Lesions',
    folk_desc_mr: 'दोन खुरांच्या फटीत किडे पडल्यासारख्या वेदनामय जखमा',
    folk_desc_hi: 'खुरों के बीच में घाव और दर्दनाक सूजन',
    folk_desc_en: 'Painful ulcers between hoof digits with foul discharge',
    keywords: ['खुर', 'hoof', 'foot', 'पायात फोड', 'खुरां', 'पायाच्या फटीत'],
    diseases: ['FMD', 'BQ'],
    urgency: 'caution',
  },
  {
    id: 'lameness',
    key: 'lameness',
    iconName: 'Activity',
    label_mr: 'लंगडणे किंवा बसून राहणे',
    label_hi: 'लंगड़ापन या चलने में कष्ट',
    label_en: 'Severe Lameness / Limping',
    folk_desc_mr: 'उभे राहण्यास त्रास, एका पायावर भार न देणे, बसून राहणे',
    folk_desc_hi: 'खड़ा होने में असमर्थ, एक पैर पर लंगड़ाना, बैठे रहना',
    folk_desc_en: 'Unable to bear weight on legs, persistent recumbency',
    keywords: ['लंगड', 'lame', 'limp', 'लंगड़ा', 'चालता येत नाही', 'बसून'],
    diseases: ['FMD', 'BQ'],
    urgency: 'caution',
  },
  {
    id: 'nodular_skin_lesions',
    key: 'nodules',
    iconName: 'CircleDot',
    label_mr: 'त्वचेवर कडक गाठी (२-५ सेंमी)',
    label_hi: 'त्वचा पर सख्त गांठें (लंपी)',
    label_en: 'Cutaneous Round Nodules (2-5cm)',
    folk_desc_mr: 'मान, पाठ व कासेवर सुपारीसारख्या कडक गोल गाठी',
    folk_desc_hi: 'गर्दन और पीठ पर सुपारी जैसी सख्त गोल गांठें',
    folk_desc_en: 'Firm, circumscribed round cutaneous nodules over entire body',
    keywords: ['गाठ', 'गाठी', 'lump', 'nodule', 'लंपी', 'गांठ', 'त्वचेवर गाठ'],
    diseases: ['LSD'],
    urgency: 'caution',
  },
  {
    id: 'throat_swelling',
    key: 'throat_swelling',
    iconName: 'ShieldAlert',
    label_mr: 'गळ्याखाली गरम सूज व घोरणे',
    label_hi: 'गले के नीचे गर्म सूजन व खर्राटे',
    label_en: 'Throat Swelling & Snoring Dyspnea',
    folk_desc_mr: 'घशाखाली गरम मोठी सूज, श्वास घेताना घोरल्यासारखा आवाज',
    folk_desc_hi: 'गले के नीचे गर्म दर्दनाक सूजन, सांस लेते समय खर्राटे की आवाज',
    folk_desc_en: 'Hot painful brisket/throat swelling with sterterous breathing',
    keywords: ['गळा', 'मान', 'throat', 'swelling', 'घोरणे', 'गळसुज', 'घटसर्प'],
    diseases: ['HS'],
    urgency: 'urgent',
  },
  {
    id: 'crackling_limb_swelling',
    key: 'crackling_swelling',
    iconName: 'Zap',
    label_mr: 'मांड्यांवर कुरकुरीत सूज (फऱ्या)',
    label_hi: 'जांघों पर कड़कड़ाहट वाली सूजन',
    label_en: 'Crepitating (Crackling) Thigh Swelling',
    folk_desc_mr: 'मागच्या मोठ्या मांडीवर सूज, दाबल्यास कुरकूर असा आवाज येतो',
    folk_desc_hi: 'जांघ की मांसपेशियों पर सूजन, दबाने पर चरचराहट की आवाज',
    folk_desc_en: 'Emphysematous swelling with crackling sound on pressure',
    keywords: ['फऱ्या', 'मांड्या', 'सूज', 'कुरकूर', 'crackling', 'thigh'],
    diseases: ['BQ'],
    urgency: 'urgent',
  },
  {
    id: 'unclotted_dark_blood_discharge',
    key: 'tarry_blood',
    iconName: 'Flame',
    label_mr: 'नाक/तोंडातून काळे न गोठणारे रक्त',
    label_hi: 'नाक/मुंह से काला न जमने वाला खून',
    label_en: 'Unclotted Tarry Blood Discharge',
    folk_desc_mr: 'नाक, गुदद्वार किंवा तोंडातून काळे डांबरासारखे रक्त येणे',
    folk_desc_hi: 'नाक या गुदा से काला न जमने वाला खून बहना',
    folk_desc_en: 'Dark, tarry unclotted blood oozing from natural body orifices',
    keywords: ['रक्त', 'blood', 'खून', 'काळे रक्त', 'डांबर', 'गुदद्वारातून'],
    diseases: ['Anthrax'],
    urgency: 'urgent',
  },
  {
    id: 'severe_diarrhea',
    key: 'diarrhea',
    iconName: 'Waves',
    label_mr: 'तीव्र दुर्गंधीयुक्त जुलाब (PPR)',
    label_hi: 'तीव्र बदबूदार दस्त / जुलाब',
    label_en: 'Severe Foul Watery Diarrhea',
    folk_desc_mr: 'शेळ्या-मेंढ्यांमध्ये पांढरट-हिरवे अत्यंत घाण वास येणारे जुलाब',
    folk_desc_hi: 'बकरियों में अत्यधिक बदबूदार पतले दस्त',
    folk_desc_en: 'Profuse watery, foul-smelling diarrhea with mucosal shreds',
    keywords: ['जुलाब', 'अतिसार', 'diarrhea', 'दस्त', 'दुर्गंधी'],
    diseases: ['PPR'],
    urgency: 'caution',
  },
  {
    id: 'late_term_abortion',
    key: 'abortion',
    iconName: 'HeartCrack',
    label_mr: 'गाभण जनावराचा गर्भपात (६-९ महिने)',
    label_hi: 'गर्भवती पशु का अंतिम माह में गर्भपात',
    label_en: 'Late-Term Abortion / Retained Placenta',
    folk_desc_mr: 'शेवटच्या महिन्यांत गर्भपात होणे, वार न पडणे किंवा अडकून राहणे',
    folk_desc_hi: 'आखिरी महीनों में गर्भपात, जेर का अंदर फंस जाना',
    folk_desc_en: 'Abortion in 6th-9th month of pregnancy with retained placenta',
    keywords: ['गर्भपात', 'abortion', 'वार', 'placenta', 'गाभण'],
    diseases: ['Brucellosis'],
    urgency: 'caution',
  },
  {
    id: 'sudden_death',
    key: 'sudden_death',
    iconName: 'Skull',
    label_mr: 'अचानक व संशयास्पद मृत्यू',
    label_hi: 'अचानक व संदेहास्पद मृत्यु',
    label_en: 'Sudden Unexplained Death',
    folk_desc_mr: 'कोणतेही लक्षण न दिसता जनावर अचानक मरण पावले',
    folk_desc_hi: 'बिना किसी पूर्व संकेत के पशु की आकस्मिक मृत्यु',
    folk_desc_en: 'Peracute sudden death within hours without prolonged illness',
    keywords: ['अचानक मृत्यू', 'मृत', 'death', 'मरण', 'sudden'],
    diseases: ['Anthrax', 'BQ', 'HS'],
    urgency: 'urgent',
  },
];

export function getSymptomById(id: string): SymptomDescriptor | undefined {
  return CLINICAL_SYMPTOMS_CATALOG.find((s) => s.id === id || s.key === id);
}

const NEGATION_PATTERNS = [
  'नाही', 'नाहीत', 'नव्हता', 'नव्हती', 'नव्हते', 'नसून', 'मुळीच नाही',
  'नहीं', 'नही', 'ना', 'बिना',
  'no', 'not', 'none', 'without', 'never', 'absent',
  'nahi', 'nahin', 'nhi',
];

function isKeywordNegated(text: string, kwIndex: number, kwLength: number): boolean {
  // Look 25 characters before and after the keyword
  const beforeSlice = text.substring(Math.max(0, kwIndex - 25), kwIndex).toLowerCase();
  const afterSlice = text.substring(kwIndex + kwLength, Math.min(text.length, kwIndex + kwLength + 25)).toLowerCase();

  // Check if any negation token appears in beforeSlice or afterSlice
  for (const neg of NEGATION_PATTERNS) {
    // Check after: e.g. "ताप नाही", "fever nahi", "blisters none"
    if (afterSlice.includes(neg)) {
      // Ensure there isn't a clause separator like comma, period, or 'पण'/'but' between them
      const gap = afterSlice.substring(0, afterSlice.indexOf(neg));
      if (!gap.includes('.') && !gap.includes(';') && !gap.includes('पण') && !gap.includes('परंतु') && !gap.includes('but') && !gap.includes('लेकिन')) {
        return true;
      }
    }
    // Check before: e.g. "no fever", "नाही ताप"
    if (beforeSlice.includes(neg)) {
      const negIdx = beforeSlice.lastIndexOf(neg);
      const gap = beforeSlice.substring(negIdx + neg.length);
      if (!gap.includes('.') && !gap.includes(';') && !gap.includes('पण') && !gap.includes('परंतु') && !gap.includes('but') && !gap.includes('लेकिन')) {
        return true;
      }
    }
  }
  return false;
}

export function detectNegatedSymptoms(text: string): SymptomDescriptor[] {
  const normalized = text.toLowerCase();
  const negated: SymptomDescriptor[] = [];

  for (const s of CLINICAL_SYMPTOMS_CATALOG) {
    for (const kw of s.keywords) {
      const idx = normalized.indexOf(kw.toLowerCase());
      if (idx !== -1 && isKeywordNegated(normalized, idx, kw.length)) {
        if (!negated.some((item) => item.id === s.id)) {
          negated.push(s);
        }
        break;
      }
    }
  }
  return negated;
}

export function matchSymptomsFromText(text: string): SymptomDescriptor[] {
  const normalized = text.toLowerCase();
  const matched: SymptomDescriptor[] = [];

  for (const s of CLINICAL_SYMPTOMS_CATALOG) {
    let hasPositiveMatch = false;
    let hasNegation = false;

    for (const kw of s.keywords) {
      const kwLower = kw.toLowerCase();
      let startPos = 0;
      let idx: number;

      while ((idx = normalized.indexOf(kwLower, startPos)) !== -1) {
        if (isKeywordNegated(normalized, idx, kwLower.length)) {
          hasNegation = true;
        } else {
          hasPositiveMatch = true;
        }
        startPos = idx + kwLower.length;
      }
    }

    // Only include if there is a genuine positive mention and no negation overrides it
    if (hasPositiveMatch && !hasNegation) {
      matched.push(s);
    }
  }

  return matched;
}


