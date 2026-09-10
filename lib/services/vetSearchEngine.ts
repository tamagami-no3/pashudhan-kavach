// External Veterinary Search Routing Engine & Knowledge Lookup Adapter

export interface SearchResult {
  title: string;
  source: string;
  summary_en: string;
  summary_hi: string;
  summary_mr: string;
  url?: string;
}

export const VET_KNOWLEDGE_BASE: SearchResult[] = [
  {
    title: 'National Animal Disease Control Programme (NADCP)',
    source: 'Department of Animal Husbandry & Dairying, Govt of India',
    summary_en:
      'NADCP is a flagship scheme launched to control Foot and Mouth Disease (FMD) and Brucellosis by 2025 and eradicate them by 2030 through 100% free bi-annual vaccination of cattle, buffalo, sheep, goats, and pigs.',
    summary_hi:
      'राष्ट्रीय पशु रोग नियंत्रण कार्यक्रम (NADCP) के तहत 2025 तक एफएमडी और ब्रुसेलोसिस को नियंत्रित करने तथा 2030 तक समाप्त करने के लिए 100% मुफ्त टीकाकरण किया जाता है।',
    summary_mr:
      'राष्ट्रीय पशु रोग नियंत्रण कार्यक्रम (NADCP) अंतर्गत २०२५ पर्यंत लाळ्या खुरकूत (FMD) व ब्रुसेलोसिस नियंत्रित करणे आणि २०३० पर्यंत संपूर्ण निर्मूलन करण्यासाठी १००% मोफत लसीकरण केले जाते.',
    url: 'https://dahd.nic.in/schemes/programmes/nadcp',
  },
  {
    title: 'Pashu Kisan Credit Card (PKCC) Scheme',
    source: 'Government of Maharashtra & NABARD',
    summary_en:
      'Provides collateral-free working capital loans up to ₹1.60 lakh (and up to ₹3 lakh with interest subvention at 4%) to farmers for cattle rearing, feed, and veterinary maintenance.',
    summary_hi:
      'पशुपालकों को पशु आहार, चारा और रख-रखाव के लिए ₹1.60 लाख तक बिना गारंटी तथा 4% रियायती ब्याज दर पर ऋण प्रदान किया जाता है।',
    summary_mr:
      'पशुपालक शेतकऱ्यांना पशुखाद्य, चारा आणि आरोग्य देखभालीसाठी ₹१.६० लाखांपर्यंत विनातारण कर्ज आणि ४% सवलतीच्या व्याजदराने आर्थिक मदत दिली जाते.',
    url: 'https://dahd.nic.in/pashu-kisan-credit-card',
  },
  {
    title: 'Lumpy Skin Disease (LSD) Treatment Protocol',
    source: 'Indian Council of Agricultural Research (ICAR - NIVEDI)',
    summary_en:
      'Symptomatic treatment includes anti-inflammatory (Melozycam/Tolfenamic acid), antihistamines, neem paste for skin lesions, and Lumpi-ProVacInd vaccine for prevention.',
    summary_hi:
      'सूजन रोधी दवाएं, एंटीहिस्टामाइन, त्वचा के घावों पर नीम का लेप तथा रोकथाम के लिए गोट पॉक्स / लुम्पी-प्रोवैक-इंड टीका का उपयोग किया जाता है।',
    summary_mr:
      'दाहकविरोधी औषधे, अँटीहिस्टॅमाइन, त्वचेच्या गाठींवर कडुनिंबाचा लेप आणि प्रतिबंधासाठी गोट पॉक्स / लुम्पी-प्रोवॅक-इंड लस वापरली जाते.',
    url: 'https://nivedi.res.in/lsd-advisory',
  },
  {
    title: 'Anthrax Emergency Protocol & Spore Safety',
    source: 'National Centre for Disease Control (NCDC India)',
    summary_en:
      'Anthrax spores survive in soil for decades. Dead carcasses must NOT be opened or skinned. Deep burial with quicklime (6 feet deep) is mandatory.',
    summary_hi:
      'एंथ्रेक्स के बीजाणु मिट्टी में दशकों तक जीवित रहते हैं। मृत शव का चीर-फाड़ न करें। 6 फीट गहरे गड्ढे में चूने के साथ दफनाना अनिवार्य है।',
    summary_mr:
      'अँथ्रॅक्स बीजाणू जमिनीत अनेक वर्षे जिवंत राहतात. मृत जनावराचे शवविच्छेदन करू नये. ६ फूट खोल खड्ड्यात चुन्यासह सुरक्षित पुरावे.',
    url: 'https://ncdc.gov.in/anthrax-guidelines',
  },
];

export async function searchVetKnowledge(
  query: string,
  lang: 'en' | 'hi' | 'mr' = 'en'
): Promise<SearchResult | null> {
  const clean = query.toLowerCase().trim();

  for (const item of VET_KNOWLEDGE_BASE) {
    if (
      clean.includes('nadcp') ||
      clean.includes('scheme') ||
      clean.includes('योजना') ||
      clean.includes('नियोजना')
    ) {
      if (item.title.includes('NADCP')) return item;
    }
    if (
      clean.includes('kisan') ||
      clean.includes('credit') ||
      clean.includes('loan') ||
      clean.includes('कर्ज') ||
      clean.includes('ऋण')
    ) {
      if (item.title.includes('Credit Card')) return item;
    }
    if (clean.includes('lsd') || clean.includes('lumpy') || clean.includes('गाठ')) {
      if (item.title.includes('Lumpy')) return item;
    }
    if (clean.includes('anthrax') || clean.includes('अँथ्रॅक्स') || clean.includes('एंथ्रेक्स')) {
      if (item.title.includes('Anthrax')) return item;
    }
  }

  return null;
}

