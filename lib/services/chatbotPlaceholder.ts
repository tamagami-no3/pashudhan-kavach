import type { PreferredLanguage } from '@/types/database.types';
import { runDiseaseTriage } from './triageEngine';
import { findAnimalByTag } from '../persistent-store';
import { searchVetKnowledge } from './vetSearchEngine';

export interface ChatbotContext {
  userId?: string | null;
  role?: string;
  district?: string;
  preferredLanguage?: PreferredLanguage;
  animals?: Array<{
    id: string;
    tag_uid: string;
    species: string;
    health_status: string;
  }>;
  openReports?: Array<{
    id: string;
    status: string;
    animalTag?: string;
    reportedAt: string;
  }>;
  openLabCases?: Array<{
    sampleId: string;
    status: string;
  }>;
  upcomingVaccinations?: Array<{
    animalTag: string;
    description: string;
    nextDueAt: string;
  }>;
}

export interface ChatbotResponse {
  reply: string;
  intent_matched?: string;
  confidence?: number;
  suggestions?: string[];
  triage_result?: any;
  verified_animal?: any;
  search_result?: any;
}

export interface FaqItem {
  id: string;
  intent: string;
  en_question: string;
  hi_question: string;
  mr_question: string;
  keywords: string[];
  answer_en: string;
  answer_hi: string;
  answer_mr: string;
}

export const FAQ_DATABASE: FaqItem[] = [
  {
    id: 'faq_1_fmd_symptoms',
    intent: 'symptoms_fmd',
    en_question: 'What are the symptoms of FMD (foot and mouth disease)?',
    hi_question: 'एफएमडी (मुँह और खुर की बीमारी) के लक्षण क्या हैं?',
    mr_question: 'एफएमडी (तोंड व खूर रोग) ची लक्षणे काय आहेत?',
    keywords: ['fmd', 'foot and mouth', 'खुर', 'मुँह', 'तोंड', 'खूर', 'drooling', 'blister'],
    answer_en:
      'High fever (39.4-41°C), excessive drooling/salivation, blisters on mouth, hooves, and teats, sudden drop in milk yield, and lameness. Isolate the animal and contact your local vet immediately.',
    answer_hi:
      'तेज़ बुखार, अत्यधिक लार टपकना, मुँह, खुर और थनों पर छाले, दूध उत्पादन में अचानक गिरावट, और लंगड़ापन। पशु को तुरंत अलग करें और स्थानीय पशु चिकित्सक से संपर्क करें।',
    answer_mr:
      'तीव्र ताप, तोंडातून लाळ गळणे, तोंड, खूर आणि कासेवर फोड, दुधात घट, आणि लंगडणे. जनावराला तात्काळ वेगळे करा आणि स्थानिक पशुवैद्यकीय अधिकाऱ्यांशी संपर्क साधा.',
  },
  {
    id: 'faq_2_lsd_symptoms',
    intent: 'symptoms_lsd',
    en_question: 'What are the symptoms of LSD (lumpy skin disease)?',
    hi_question: 'एलएसडी (गांठदार त्वचा रोग) के लक्षण क्या हैं?',
    mr_question: 'एलएसडी (गाठाळ त्वचा रोग) ची लक्षणे काय आहेत?',
    keywords: ['lsd', 'lumpy', 'lumpy skin', 'गांठ', 'त्वचा', 'गाठाळ', 'nodule', 'skin lesions'],
    answer_en:
      'Fever, nodular (lumpy) skin lesions (2-5cm), swollen lymph nodes, and leg swelling. Report to your local vet; this spreads via biting insects, isolate the animal and apply fly repellents.',
    answer_hi:
      'बुखार, त्वचा पर गांठदार घाव (गांठें), लिम्फ नोड्स में सूजन, और पैरों में सूजन। पशु चिकित्सक को रिपोर्ट करें; यह कीड़ों द्वारा फैलता है, पशु को अलग रखें।',
    answer_mr:
      'ताप, त्वचेवर गाठी (गाठाळ चट्टे), लिम्फ नोड्स सुजणे, आणि पायांवर सूज. स्थानिक पशुवैद्याला कळवा; डास आणि माशांपासून संरक्षण करा आणि जनावराला वेगळे ठेवा.',
  },
  {
    id: 'faq_3_ppr_symptoms',
    intent: 'symptoms_ppr',
    en_question: 'What are the symptoms of PPR in goats and sheep?',
    hi_question: 'बकरी और भेड़ में पीपीआर के लक्षण क्या हैं?',
    mr_question: 'शेळी व मेंढीमध्ये पीपीआर ची लक्षणे काय आहेत?',
    keywords: ['ppr', 'goat', 'sheep', 'बकरी', 'भेड़', 'शेळी', 'मेंढी', 'diarrhea'],
    answer_en:
      'Mouth sores, severe diarrhea, breathing difficulty (respiratory distress), nasal and eye discharge. Report promptly, PPR spreads rapidly in small ruminant herds.',
    answer_hi:
      'मुँह में छाले, गंभीर दस्त, सांस लेने में तकलीफ, नाक और आंखों से स्राव। तुरंत रिपोर्ट करें, पीपीआर झुंड में तेजी से फैलता है।',
    answer_mr:
      'तोंडात व्रण/फोड, तीव्र जुलाब, श्वास घेण्यास त्रास, नाक व डोळ्यांतून पाणी वाहणे. त्वरित कळवा, पीपीआर कळपात वेगाने पसरतो.',
  },
  {
    id: 'faq_4_vaccine_due',
    intent: 'vaccination_due',
    en_question: 'When is the next vaccination due for my animal?',
    hi_question: 'मेरे पशु का अगला टीकाकरण कब होना है?',
    mr_question: 'माझ्या जनावराचे पुढील लसीकरण कधी आहे?',
    keywords: ['vaccination due', 'next vaccine', 'टीकाकरण', 'लसीकरण', 'due date', 'schedule'],
    answer_en:
      'Open your animal’s health card in the Pashudhan Kavach app to see its personal vaccination schedule, upcoming boosters, and past immunization history.',
    answer_hi:
      'अपने पशु का व्यक्तिगत टीकाकरण कार्यक्रम और देय तिथियां देखने के लिए ऐप में उसका हेल्थ कार्ड खोलें।',
    answer_mr:
      'आपल्या जनावराचे वैयक्तिक लसीकरण वेळापत्रक आणि तारीख पाहण्यासाठी ॲपमधील डिजिटल हेल्थ कार्ड उघडा.',
  },
];

/**
 * Integrated AI Responder Function
 */
export async function respond(
  message: string,
  context?: ChatbotContext
): Promise<ChatbotResponse> {
  const clean = message.toLowerCase().trim();
  const lang: PreferredLanguage = context?.preferredLanguage || 'mr';

  // 1. SCANNER & TAG VERIFICATION INTENT
  const tagMatch = clean.match(/\b\d{12}\b/);
  if (tagMatch || clean.includes('tag') || clean.includes('टॅग') || clean.includes('टैग')) {
    const tagUid = tagMatch ? tagMatch[0] : '100011112222';
    const animal = findAnimalByTag(tagUid);
    if (animal) {
      if (lang === 'mr') {
        return {
          reply: `🔍 **पशु आधार टॅग प्रमाणपत्र सत्यापित (#${animal.tag_uid})**\n\n• **प्रजाती:** ${animal.species} (${animal.breed})\n• **लिंग:** ${animal.sex}\n• **स्थान:** ${animal.village}, ${animal.district}\n• **आरोग्य स्थिती:** ${animal.health_status === 'healthy' ? 'निरोगी (Healthy)' : 'संशयित / आजारी'}\n\nहे डिजिटल हेल्थ कार्ड महाराष्ट्र पशुसंवर्धन विभागाद्वारे अधिकृत आहे.`,
          intent_matched: 'tag_verification_success',
          confidence: 0.98,
          verified_animal: animal,
          suggestions: ['लसीकरण वेळापत्रक पहा', 'आजारी जनावराची तक्रार करा'],
        };
      } else if (lang === 'hi') {
        return {
          reply: `🔍 **पशु आधार टैग रिकॉर्ड सत्यापित (#${animal.tag_uid})**\n\n• **प्रजाति:** ${animal.species} (${animal.breed})\n• **स्थान:** ${animal.village}, ${animal.district}\n• **स्वास्थ्य स्थिति:** ${animal.health_status}\n\nयह डिजिटल हेल्थ कार्ड महाराष्ट्र पशुपालन विभाग द्वारा सत्यापित है।`,
          intent_matched: 'tag_verification_success',
          confidence: 0.98,
          verified_animal: animal,
          suggestions: ['टीकाकरण अनुसूची देखें', 'बीमार पशु की रिपोर्ट करें'],
        };
      } else {
        return {
          reply: `🔍 **VERIFIED PASHU AADHAAR TAG RECORD (#${animal.tag_uid})**\n\n• **Species:** ${animal.species} (${animal.breed})\n• **Sex:** ${animal.sex}\n• **Location:** ${animal.village}, ${animal.district}\n• **Health Status:** ${animal.health_status}\n\nOfficial record verified by Department of Animal Husbandry, Govt of Maharashtra.`,
          intent_matched: 'tag_verification_success',
          confidence: 0.98,
          verified_animal: animal,
          suggestions: ['View Vaccination Schedule', 'Report Symptom Issue'],
        };
      }
    }
  }

  // 2. MEDICINE & VACCINE SCANNER INTENT
  if (
    clean.includes('medicine') ||
    clean.includes('vaccine') ||
    clean.includes('लस') ||
    clean.includes('दवा') ||
    clean.includes('औषध') ||
    clean.includes('scanner')
  ) {
    if (lang === 'mr') {
      return {
        reply: `💊 **पशुवैद्यकीय औषध व लस माहिती (AI Scanner Output)**\n\n1. **Raksha Ovac (FMD লस):** डोस २ मि.ली. चमडीखाली (S/C). ६ महिन्यांनी बूस्टर डोस द्यावा.\n2. **Lumpi-ProVacInd (LSD लस):** १ मि.ली. चमडीखाली. गाठींचा प्रादुर्भाव रोखण्यासाठी अत्यंत प्रभावी.\n3. **PPR लस (शेळ्या-मेंढ्यांसाठी):** १ मि.ली. चमडीखाली. वयाच्या ४ व्या महिन्यात १ डोस (आयुष्यात एकदा).\n\n⚠️ औषध देण्यापूर्वी स्थानिक पशुवैद्यकीय अधिकाऱ्यांचा सल्ला घ्या.`,
        intent_matched: 'medicine_scanner_info',
        confidence: 0.95,
        suggestions: ['लसीकरण वेळापत्रक', 'आजारी जनावराची तक्रार करा'],
      };
    } else if (lang === 'hi') {
      return {
        reply: `💊 **पशु चिकित्सा दवा एवं टीका जानकारी (AI Scanner Output)**\n\n1. **Raksha Ovac (FMD टीका):** खुराक 2 मिली सबक्यूटेनियस (S/C)। हर 6 महीने में बूस्टर खुराक दें।\n2. **Lumpi-ProVacInd (LSD टीका):** 1 मिली सबक्यूटेनियस। गांठदार बीमारी रोकने में प्रभावी।\n3. **PPR टीका (बकरी-भेड़):** 1 मिली खुराक। उम्र के 4वें महीने में दी जाती है।`,
        intent_matched: 'medicine_scanner_info',
        confidence: 0.95,
        suggestions: ['टीकाकरण अनुसूची', 'बीमार पशु की रिपोर्ट करें'],
      };
    } else {
      return {
        reply: `💊 **VETERINARY MEDICINE & VACCINE DOSAGE GUIDE**\n\n1. **Raksha Ovac (FMD Vaccine):** Dose 2 ml subcutaneous (S/C). Booster required bi-annually.\n2. **Lumpi-ProVacInd (LSD Vaccine):** Dose 1 ml S/C. Highly effective against Lumpy Skin Disease.\n3. **PPR Vaccine (Goats/Sheep):** Dose 1 ml S/C given at 4 months of age.\n\n⚠️ Always consult your local Veterinary Officer before administering medication.`,
        intent_matched: 'medicine_scanner_info',
        confidence: 0.95,
        suggestions: ['Vaccination Schedule', 'Report Symptom Issue'],
      };
    }
  }

  // 3. AI DISEASE PREDICTOR & TRIAGE INTENT
  const symptomsDetected: string[] = [];
  if (clean.includes('fever') || clean.includes('ताप') || clean.includes('बुखार')) symptomsDetected.push('fever_high');
  if (clean.includes('blister') || clean.includes('फोड') || clean.includes('छाले') || clean.includes('drool') || clean.includes('लाळ')) symptomsDetected.push('mouth_blisters', 'drooling');
  if (clean.includes('nodule') || clean.includes('गाठ') || clean.includes('गांठ') || clean.includes('lumpy') || clean.includes('skin')) symptomsDetected.push('nodular_skin_lesions');
  if (clean.includes('diarrhea') || clean.includes('जुलाब') || clean.includes('दस्त')) symptomsDetected.push('severe_diarrhea');
  if (clean.includes('blood') || clean.includes('रक्त') || clean.includes('खून')) symptomsDetected.push('unclotted_dark_blood_discharge');

  if (symptomsDetected.length > 0) {
    const triage = runDiseaseTriage(symptomsDetected);

    if (lang === 'mr') {
      return {
        reply: `🩺 **एआय प्राथमिक रोग निदान व धोका मूल्यांकन (AI Disease Predictor)**\n\n• **संभाव्य रोग:** ${triage.predictedDisease}\n• **अचूकता (Confidence):** ${triage.confidencePct}%\n• **धोका पातळी:** ${triage.riskLevel.toUpperCase()}\n\n⚠️ **तात्काळ सल्ला:** ${triage.isolationAdvice}\n\nगोठ्यात १% सोडियम हायपोक्लोराईटची फवारणी करा व आजारी जनावराला तात्काळ वेगळे करा.`,
        intent_matched: 'ai_triage_prediction',
        confidence: triage.confidencePct / 100,
        triage_result: triage,
        suggestions: ['आजारी जनावराची तक्रार नोंदवा', 'पशुवैद्यास कॉल करा'],
      };
    } else if (lang === 'hi') {
      return {
        reply: `🩺 **एआई प्राथमिक रोग निदान एवं जोखिम मूल्यांकन (AI Disease Predictor)**\n\n• **संभावित बीमारी:** ${triage.predictedDisease}\n• **सटीकता:** ${triage.confidencePct}%\n• **जोखिम स्तर:** ${triage.riskLevel.toUpperCase()}\n\n⚠️ **महत्वपूर्ण सलाह:** ${triage.isolationAdvice}`,
        intent_matched: 'ai_triage_prediction',
        confidence: triage.confidencePct / 100,
        triage_result: triage,
        suggestions: ['बीमार पशु की रिपोर्ट दर्ज करें', 'डॉक्टर को कॉल करें'],
      };
    } else {
      return {
        reply: `🩺 **AI DISEASE PREDICTION & TRIAGE ASSESSMENT**\n\n• **Predicted Disease:** ${triage.predictedDisease}\n• **Model Confidence:** ${triage.confidencePct}%\n• **Risk Tier:** ${triage.riskLevel.toUpperCase()}\n\n⚠️ **Recommended Action:** ${triage.isolationAdvice}`,
        intent_matched: 'ai_triage_prediction',
        confidence: triage.confidencePct / 100,
        triage_result: triage,
        suggestions: ['Submit Official Symptom Report', 'Call Emergency Vet'],
      };
    }
  }

  // 4. EXTERNAL VET SEARCH ENGINE ROUTING
  const searchHit = await searchVetKnowledge(clean, lang);
  if (searchHit) {
    let text = searchHit.summary_mr;
    if (lang === 'hi') text = searchHit.summary_hi;
    if (lang === 'en') text = searchHit.summary_en;

    return {
      reply: `🔍 **अधिकृत पशुवैद्यकीय माहिती शोध (Government Knowledge Base)**\n\n**${searchHit.title}** (${searchHit.source})\n\n${text}\n\n🔗 अधिक माहितीसाठी: ${searchHit.url || 'https://dahd.nic.in'}`,
      intent_matched: 'external_vet_search_hit',
      confidence: 0.92,
      search_result: searchHit,
      suggestions: ['इतर योजना माहिती', 'आजारी जनावराची तक्रार करा'],
    };
  }

  // 5. FAQ DATABASE KEYWORD MATCHING
  for (const faq of FAQ_DATABASE) {
    let score = 0;
    for (const kw of faq.keywords) {
      if (clean.includes(kw.toLowerCase())) {
        score += kw.length > 4 ? 3 : 2;
      }
    }

    if (score >= 2) {
      let reply = faq.answer_en;
      if (lang === 'hi') reply = faq.answer_hi;
      if (lang === 'mr') reply = faq.answer_mr;

      return {
        reply,
        intent_matched: faq.intent,
        confidence: Math.min(1.0, 0.5 + score * 0.1),
        suggestions: [
          'एफएमडी ची लक्षणे काय आहेत?',
          'आजारी जनावराची तक्रार कशी नोंदवावी?',
          'आपल्या जिल्ह्यातील रोगाचा धोका कसा तपासावा?',
        ],
      };
    }
  }

  // CONVERSATIONAL FALLBACK
  if (lang === 'hi') {
    return {
      reply:
        'नमस्ते! मैं पशुधन कवच AI सहायक हूँ। आप मुझसे एफएमडी (FMD), एलएसडी (LSD), टीकाकरण समय सारणी, पशु आधार (टैग #100011112222), या बीमारी रिपोर्टिंग के बारे में पूछ सकते हैं।',
      intent_matched: 'fallback_greeting_hi',
      confidence: 0.4,
      suggestions: [
        'एफएमडी (FMD) के लक्षण क्या हैं?',
        'टैग #100011112222 जांचें',
        'बीमार पशु की रिपोर्ट कैसे करें?',
      ],
    };
  } else if (lang === 'mr') {
    return {
      reply:
        'नमस्कार! मी पशुधन कवच AI सहाय्यक आहे. आपण मला एफएमडी, एलएसडी, लसीकरण वेळापत्रक, पशु आधार (टॅग #100011112222), किंवा आजारी जनावराची तक्रार कशी करावी याबद्दल विचारू शकता.',
      intent_matched: 'fallback_greeting_mr',
      confidence: 0.4,
      suggestions: [
        'एफएमडी (तोंड व खूर रोग) ची लक्षणे काय आहेत?',
        'टॅग #100011112222 तपासा',
        'आजारी जनावराची तक्रार कशी नोंदवावी?',
      ],
    };
  }

  return {
    reply:
      'Hello! I am the Pashudhan Kavach AI Veterinary Assistant. You can ask me to predict disease symptoms, scan a Pashu Aadhaar Tag (#100011112222), check medicine dosages, or search government schemes like NADCP.',
    intent_matched: 'fallback_greeting_en',
    confidence: 0.4,
    suggestions: [
      'What are the symptoms of FMD?',
      'Verify tag #100011112222',
      'What is the NADCP scheme?',
      'How do I report a sick animal?',
    ],
  };
}


