import { NextRequest, NextResponse } from 'next/server';

interface DiagnoseRequest {
  message?: string;
  imageBase64?: string;
  imageMediaType?: string;
  language?: 'en' | 'hi' | 'mr';
  history?: Array<{
    role: 'user' | 'model';
    text: string;
  }>;
}

interface DiagnoseResponse {
  reply: string;
  predicted_disease: string | null;
  confidence_level: 'Low' | 'Medium' | 'High' | 'Critical' | string;
  alert_level: 'none' | 'caution' | 'urgent';
  precautions: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body: DiagnoseRequest = await request.json();
    const {
      message = '',
      imageBase64,
      imageMediaType = 'image/jpeg',
      language = 'mr',
      history = [],
    } = body;

    const apiKey = process.env.GEMINI_API_KEY || '';

    const langInstructions: Record<string, string> = {
      mr: 'तुम्ही संपूर्ण उत्तर अस्खलित मराठीत द्यावे. सर्व सूचना आणि सल्ला मराठीत लिहा.',
      hi: 'आप पूरा उत्तर स्पष्ट हिंदी में दें। सभी सावधानियां और सलाह हिंदी में लिखें।',
      en: 'Reply fully and clearly in English. Provide all recommendations and precautions in English.',
    };

    const targetLangInst = langInstructions[language] || langInstructions.mr;

    const systemPrompt = `You are "Pashudhan Sahayak" (पशुधन सहायक), an expert AI livestock health assistant designed for Maharashtra farmers and rural veterinarians.
Your primary role is to assist farmers in identifying livestock diseases based on symptoms and visual images.

Recognized diseases and classic symptom patterns in Maharashtra livestock:
1. Foot and Mouth Disease (FMD / लाळ्या खुरकूत): High fever, blisters/ulcers on mouth, tongue, lips, and hooves, drooling/salivation, lameness.
2. Lumpy Skin Disease (LSD / लंपी त्वचा रोग): High fever, nodular cutaneous lesions/lumps (2-5cm) on skin/neck, swollen lymph nodes, edema in legs, reduced milk.
3. Peste des Petits Ruminants (PPR / शेळ्या-मेंढ्यांमधील देवी): High fever, discharge from eyes/nose, necrotic stomatitis, severe foul-smelling diarrhea, pneumonia in sheep/goats.
4. Brucellosis (ब्रुसेलोसिस): Late-term abortion in pregnant cattle/buffaloes, retained placenta, orchitis, decreased fertility. (Zoonotic - caution humans).
5. Anthrax (अँथ्रॅक्स / फऱ्या): Sudden death with dark uncoagulated blood oozing from natural orifices (nose, mouth, anus), high fever, severe bloat, rapid carcass decomposition. **CRITICAL EMERGENCY**.
6. Black Quarter (BQ / फऱ्या / घटसर्प): Crepitating hot painful swellings over heavy muscles (thigh, shoulder), severe lameness, high fever, sudden death.
7. Haemorrhagic Septicaemia (HS / घटसर्प): High fever, hot painful swelling in throat/neck/dewlap, dyspnoea/snoring respiration, tongue protrusion.

Crucial Guidelines:
1. Language Requirement: ${targetLangInst}
2. Medical Disclaimer: Always clearly state that this is a preliminary AI-assisted screening for emergency advisory purposes, NOT a certified laboratory diagnosis or substitute for a registered veterinary doctor.
3. Urgent & Emergency Cases: For Anthrax, Haemorrhagic Septicaemia (HS), sudden death, heavy bleeding, or high fever with severe distress, set "alert_level": "urgent" and prominently tell the farmer to isolate the animal, avoid touching body fluids/carcass without PPE, and call the Government 1962 Veterinary Helpline immediately.
4. Precautions: Always provide 3-5 concrete, practical precautions (e.g. isolation, biosecurity, wound care, disinfection, vaccination).

Response Format:
You MUST respond with valid JSON adhering to this exact schema:
{
  "reply": "Your friendly, empathetic, clear veterinary explanation in the requested language",
  "predicted_disease": "Name of the predicted disease (or 'Unknown / Non-specific Symptoms' if none)",
  "confidence_level": "Low" | "Medium" | "High" | "Critical",
  "alert_level": "none" | "caution" | "urgent",
  "precautions": [
    "Precaution 1",
    "Precaution 2",
    "Precaution 3"
  ]
}`;

    if (!apiKey) {
      // Fallback rule-based triage if API key is not configured
      const fallback = getRuleBasedFallback(message, language);
      return NextResponse.json(fallback, { status: 200 });
    }

    // Build Gemini contents payload
    const contents: any[] = [];

    // Add prior conversation history
    for (const h of history.slice(-6)) {
      contents.push({
        role: h.role === 'model' ? 'model' : 'user',
        parts: [{ text: h.text }],
      });
    }

    // Current user message parts
    const currentParts: any[] = [];
    if (message.trim()) {
      currentParts.push({ text: message });
    } else if (imageBase64) {
      currentParts.push({ text: 'Please analyze this livestock image for visible symptoms or lesions.' });
    }

    if (imageBase64) {
      // Clean base64 prefix if present
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
      currentParts.push({
        inline_data: {
          mime_type: imageMediaType || 'image/jpeg',
          data: cleanBase64,
        },
      });
    }

    if (currentParts.length === 0) {
      return NextResponse.json(
        {
          reply: language === 'mr' ? 'कृपया आपला प्रश्न किंवा जनावराचा फोटो पाठवा.' : 'Please enter a message or upload a photo.',
          predicted_disease: null,
          confidence_level: 'Low',
          alert_level: 'none',
          precautions: [],
        },
        { status: 200 }
      );
    }

    contents.push({
      role: 'user',
      parts: currentParts,
    });

    const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const geminiPayload = {
      system_instruction: {
        parts: [{ text: systemPrompt }],
      },
      contents,
      generationConfig: {
        response_mime_type: 'application/json',
        temperature: 0.2,
      },
    };

    const response = await fetch(geminiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(geminiPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn('Gemini API call failed:', response.status, errorText);
      const fallback = getRuleBasedFallback(message, language);
      return NextResponse.json(fallback, { status: 200 });
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      const fallback = getRuleBasedFallback(message, language);
      return NextResponse.json(fallback, { status: 200 });
    }

    let parsedResult: DiagnoseResponse;
    try {
      parsedResult = JSON.parse(rawText);
    } catch {
      // Clean potential markdown wrapping
      const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      try {
        parsedResult = JSON.parse(cleaned);
      } catch {
        parsedResult = {
          reply: rawText,
          predicted_disease: null,
          confidence_level: 'Low',
          alert_level: 'none',
          precautions: [
            language === 'mr' ? 'नजीकच्या पशुवैद्यकीय दवाखान्याशी संपर्क साधा' : 'Contact nearest veterinary clinic',
          ],
        };
      }
    }

    // Ensure all required fields are present
    return NextResponse.json({
      reply: parsedResult.reply || 'Analysis completed.',
      predicted_disease: parsedResult.predicted_disease || null,
      confidence_level: parsedResult.confidence_level || 'Medium',
      alert_level: parsedResult.alert_level || 'none',
      precautions: Array.isArray(parsedResult.precautions) ? parsedResult.precautions : [],
    });
  } catch (error: any) {
    console.error('Chatbot diagnose route error:', error);
    return NextResponse.json(
      {
        reply: 'सेवा सध्या उपलब्ध नाही किंवा तांत्रिक अडचण आली आहे. कृपया पशुवैद्यकीय हेल्पलाइन १९६२ शी संपर्क साधा.',
        predicted_disease: null,
        confidence_level: 'Low',
        alert_level: 'caution',
        precautions: ['तात्काळ स्थानिक पशुवैद्यकीय डॉक्टरांचा सल्ला घ्या.'],
        error: error.message || 'Unknown error occurred',
      },
      { status: 200 }
    );
  }
}

// Fallback rule engine when offline or Gemini API is not reachable
function getRuleBasedFallback(msg: string, lang: 'en' | 'hi' | 'mr'): DiagnoseResponse {
  const text = msg.toLowerCase();

  if (text.includes('anthrax') || text.includes('रक्त') || text.includes('अचानक मृत्यू') || text.includes('bleeding') || text.includes('sudden death')) {
    if (lang === 'mr') {
      return {
        reply: 'गंभीर इशारा: हा अँथ्रॅक्स (Anthrax) किंवा अतिगंभीर संसर्ग असू शकतो. कृपया मृत किंवा आजारी जनावराला हात लावू नका. ताबडतोब पशुवैद्यकीय डॉक्टरांशी संपर्क साधा.',
        predicted_disease: 'Anthrax (अँथ्रॅक्स - संशयित)',
        confidence_level: 'Critical',
        alert_level: 'urgent',
        precautions: [
          'आजारी जनावरास इतर जनावरांपासून त्वरित वेगळे ठेवा.',
          'मृत जनावराचे शवविच्छेदन (post-mortem) करू नका आणि शरीरास हात लावू नका.',
          'शासकीय पशु हेल्पलाइन १९६२ वर तात्काळ कळवा.',
          'गोठा चुना किंवा जंतुनाशकाने निर्जंतुक करा.',
        ],
      };
    } else if (lang === 'hi') {
      return {
        reply: 'गंभीर चेतावनी: यह एंथ्रेक्स (Anthrax) या अति-गंभीर संक्रमण हो सकता है। कृपया जानवर को न छुएं और तुरंत पशु चिकित्सक से संपर्क करें।',
        predicted_disease: 'Anthrax (एंथ्रेक्स - संदिग्ध)',
        confidence_level: 'Critical',
        alert_level: 'urgent',
        precautions: [
          'बीमार पशु को तुरंत अन्य पशुओं से अलग करें।',
          'मृत शरीर को न छुएं और तुरंत डॉक्टर को बुलाएं।',
          'पशु हेल्पलाइन 1962 पर कॉल करें।',
        ],
      };
    } else {
      return {
        reply: 'CRITICAL WARNING: Symptoms indicate potential Anthrax or acute septic condition. Do not touch blood/carcass. Seek immediate veterinary intervention.',
        predicted_disease: 'Anthrax (Suspected)',
        confidence_level: 'Critical',
        alert_level: 'urgent',
        precautions: [
          'Isolate the animal immediately in quarantine shed.',
          'Do not perform autopsy or open the carcass.',
          'Call government veterinary helpline 1962 immediately.',
          'Disinfect premises with lime powder or bleaching solution.',
        ],
      };
    }
  }

  if (text.includes('lumpy') || text.includes('गाठ') || text.includes('त्वचा') || text.includes('nodule') || text.includes('lsd') || text.includes('लंपी')) {
    if (lang === 'mr') {
      return {
        reply: 'प्राथमिक निष्कर्ष: जनावराच्या त्वचेवरील गाठी आणि ताप लंपी त्वचा रोग (Lumpy Skin Disease) दर्शवतात. हे एआय आधारित प्राथमिक विश्लेषण आहे.',
        predicted_disease: 'Lumpy Skin Disease (लंपी त्वचा रोग)',
        confidence_level: 'High',
        alert_level: 'caution',
        precautions: [
          'बाधित जनावराला वेगळे ठेवा व डास, माशांपासून संरक्षण करा.',
          'गोठ्यात कडुनिंबाच्या पानांची धुरी करा.',
          'जनावरास स्वच्छ पाणी आणि मऊ चारा द्या.',
          'पशुवैद्यकाच्या सल्ल्याने गोटपॉक्स लस टोचून घ्या.',
        ],
      };
    } else if (lang === 'hi') {
      return {
        reply: 'प्राथमिक विश्लेषण: त्वचा पर गांठें और बुखार लंपी त्वचा रोग (LSD) का संकेत देते हैं। यह एक प्राथमिक जांच है।',
        predicted_disease: 'Lumpy Skin Disease (लंपी त्वचा रोग)',
        confidence_level: 'High',
        alert_level: 'caution',
        precautions: [
          'संक्रमित पशु को अलग रखें।',
          'मक्खियों और मच्छरों से बचाव करें।',
          'पशु चिकित्सक से सलाह लेकर दवा दें।',
        ],
      };
    } else {
      return {
        reply: 'Preliminary Screening: Skin nodules, swelling, and fever strongly suggest Lumpy Skin Disease (LSD). This is a screening assistance, not a lab confirmation.',
        predicted_disease: 'Lumpy Skin Disease (LSD)',
        confidence_level: 'High',
        alert_level: 'caution',
        precautions: [
          'Isolate affected cattle from healthy herd.',
          'Apply vector control against flies, mosquitoes, and ticks.',
          'Provide soft green fodder and electrolyte-rich clean water.',
          'Consult local vet for Goat Pox vaccine and antipyretics.',
        ],
      };
    }
  }

  if (text.includes('खुर') || text.includes('तोंड') || text.includes('लाळ') || text.includes('fmd') || text.includes('blister') || text.includes('drool') || text.includes('लाळ्या')) {
    if (lang === 'mr') {
      return {
        reply: 'प्राथमिक निष्कर्ष: तोंडातून लाळ गळणे, फोड आणि खुरांमधील जखमा लाळ्या खुरकूत (FMD) रोगाची लक्षणे आहेत.',
        predicted_disease: 'Foot and Mouth Disease (FMD / लाळ्या खुरकूत)',
        confidence_level: 'High',
        alert_level: 'caution',
        precautions: [
          ' तोंडातील जखमा पोटॅशियम परमँगनेटच्या हलक्या पाण्याने धुवा.',
          'खुरांमधील जखमांवर जंतुनाशक मलम लावा.',
          'जनावरास मऊ दलिया, पेज किंवा मऊ चारा द्या.',
          'इतर निरोगी जनावरांचे FMD लसीकरण करून घ्या.',
        ],
      };
    } else {
      return {
        reply: 'Preliminary Screening: Excessive salivation, mouth vesicles, and hoof lesions indicate Foot and Mouth Disease (FMD).',
        predicted_disease: 'Foot and Mouth Disease (FMD)',
        confidence_level: 'High',
        alert_level: 'caution',
        precautions: [
          'Wash oral lesions with 1% potassium permanganate solution.',
          'Clean hoof lesions and apply antiseptic spray/ointment.',
          'Feed soft gruel or mash; avoid coarse dry fodder.',
          'Enforce strict movement restrictions on the farm.',
        ],
      };
    }
  }

  // General response
  if (lang === 'mr') {
    return {
      reply: 'आपल्या पशुधनाच्या लक्षणांचे प्राथमिक विश्लेषण केले आहे. कृपया संपूर्ण लक्षणे सांगा किंवा जनावराचा फोटो अपलोड करा.',
      predicted_disease: 'सर्वसाधारण पशु तपासणी आवश्यक',
      confidence_level: 'Medium',
      alert_level: 'none',
      precautions: [
        'जनावरास स्वच्छ आणि हवेशीर जागी ठेवा.',
        'तापमानाची नोंद ठेवा.',
        'पशुवैद्यकीय अधिकाऱ्यांशी संपर्क साधा.',
      ],
    };
  } else if (lang === 'hi') {
    return {
      reply: 'आपके पशु के लक्षणों का प्राथमिक विश्लेषण किया गया है। कृपया अधिक जानकारी दें या फोटो अपलोड करें।',
      predicted_disease: 'सामान्य पशु परीक्षण आवश्यक',
      confidence_level: 'Medium',
      alert_level: 'none',
      precautions: [
        'पशु को साफ और हवादार स्थान पर रखें।',
        'पशु चिकित्सक से जांच कराएं।',
      ],
    };
  } else {
    return {
      reply: 'Preliminary livestock assessment complete. Please describe symptoms in detail or attach a clear photo for specific disease pattern recognition.',
      predicted_disease: 'General Veterinary Examination Required',
      confidence_level: 'Medium',
      alert_level: 'none',
      precautions: [
        'Maintain hydration and clean shelter.',
        'Record body temperature and appetite changes.',
        'Schedule a routine check-up with your area veterinary officer.',
      ],
    };
  }
}

