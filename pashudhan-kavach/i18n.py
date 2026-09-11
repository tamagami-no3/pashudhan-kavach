"""
Pashudhan Kavach (पशुधन कवच) - Trilingual Localization Module (English, Hindi, Marathi)
Comprehensive veterinary terminology and user interface strings.
"""

TRANSLATIONS = {
    "en": {
        "app_title": "Pashudhan Kavach",
        "app_tagline": "AI-Driven Edge Decision Support & Livestock Outbreak Containment System",
        "badge_trilingual": "Trilingual: English | हिंदी | मराठी",
        "nav_dashboard": "Decision Dashboard",
        "nav_vision": "Webcam & Vision AI",
        "nav_rag": "Clinical RAG Advisory",
        "nav_medication": "Pill Scanner & ML Risk",
        "nav_geo": "Geo-Fence & Vet Dispatch",
        "nav_cases": "Preset Field Cases",
        
        # Section 1: Vision
        "vision_title": "Multi-Modal Input & Image Processing Engine",
        "vision_subtitle": "Real-time webcam feed or photo upload with MobileNetV3 deep pathology feature extraction",
        "btn_start_cam": "Start Webcam",
        "btn_stop_cam": "Stop Webcam",
        "btn_capture": "Capture Frame",
        "btn_upload": "Upload Image",
        "drag_drop_text": "Drag & drop livestock lesion photo, or click to browse",
        "analyzing_image": "Extracting MobileNetV3 visual pathology tensors...",
        "detected_pathology": "Detected Pathology",
        "confidence_score": "Confidence Score",
        "visual_features": "Extracted Deep Pathology Tensors (576-dim)",
        "symptom_tags": "Visual Anomaly Indicators",
        
        # Disease labels
        "disease_lsd": "Lumpy Skin Disease (LSD)",
        "disease_fmd": "Foot and Mouth Disease (FMD)",
        "disease_ppr": "Peste des Petits Ruminants (PPR)",
        "disease_hs": "Hemorrhagic Septicemia (HS)",
        "disease_healthy": "Healthy Livestock (Normal)",
        
        # Section 2: Clinical RAG
        "rag_title": "RAG Precaution & Care Protocol Advisory",
        "rag_subtitle": "Multi-modal contextual embedding with Cosine Similarity vector search against clinical repository",
        "query_placeholder": "Describe observed symptoms (e.g. high fever, mouth blisters, excessive salivation, refusal to graze, skin nodules)...",
        "btn_retrieve_rag": "Retrieve Clinical Guidelines",
        "tab_quarantine": "Targeted Quarantine",
        "tab_chemical": "Chemical Disinfection & Washes",
        "tab_diet": "Dietary & Supportive Care",
        "tab_vectors": "Vector Similarity Match",
        "similarity_score": "Retrieval Match Confidence",
        
        # Section 3: Medication & Pill Scanner
        "med_title": "Machine Learning Medication Risk Classifier",
        "med_subtitle": "Random Forest model analyzing farmer treatment inputs with dynamic clinical heuristic overrides",
        "med_input_label": "Enter Proposed Medication / Pill / Chemical Treatment:",
        "med_input_placeholder": "e.g. Paracetamol bolus, Meloxicam injection, Oxytetracycline 20%, Dexamethasone, Neem paste...",
        "symptom_duration_label": "Symptom Duration (Days):",
        "critical_signs_label": "Critical Severity Indicators Observed:",
        "sign_hemorrhage": "Mucosal or wound hemorrhaging",
        "sign_recumbent": "Animal recumbent / unable to stand",
        "sign_asphyxia": "Severe respiratory distress / throat edema",
        "btn_evaluate_med": "Evaluate Treatment Safety",
        "risk_level": "Clinical Risk Level",
        "risk_low": "Safe Supportive Care",
        "risk_moderate": "Requires Veterinary Oversight",
        "risk_high": "Critical Warning - Restricted & Dangerous Treatment",
        "heuristic_alert_title": "Dynamic Risk Escalation Alert",
        "heuristic_alert_duration": "Critical Alert: Symptoms have persisted over several days. Prompt veterinary examination is necessary to prevent secondary complications.",
        "heuristic_alert_signs": "Emergency Alert: Severe distress or hemorrhage indicators detected. Immediate veterinary intervention required.",
        
        # Chatbot Assistant
        "chatbot_title": "Pashudhan AI Assistant",
        "chatbot_subtitle": "Continuous natural veterinary dialogue & clinical advice",
        "chatbot_placeholder": "Ask any question about cow, buffalo, or goat symptoms, medicines, and home care...",
        "chatbot_send": "Ask Assistant",
        "chatbot_welcome": "Greetings! I am your 24/7 Pashudhan AI Assistant. Share what you observe with your livestock or ask any treatment questions, and I will guide you immediately without delay.",
        
        # Section 4: Geo-Fence & Alert
        "geo_title": "Agentic Geo-Fenced Alert & Rapid Dispatch",
        "geo_subtitle": "Haversine spatial distance mapping, automated community containment ring, and emergency veterinary routing",
        "farm_location": "Reporting Farm GPS Location",
        "alert_radius": "Containment Radius (km)",
        "btn_run_containment": "Activate Geo-Fence Containment",
        "nearby_farms_found": "Nearby Registered Livestock Owners in Danger Zone",
        "ticket_title": "Automated Veterinary Response Ticket",
        "ticket_id": "Ticket Tracking ID",
        "ticket_officer": "Assigned Veterinary Officer",
        "ticket_priority": "Priority SLA",
        "ticket_status": "Status",
        "ticket_status_dispatched": "DISPATCHED TO RAPID RESPONSE TEAM",
        "btn_copy_ticket": "Copy Official Ticket",
        "broadcast_payloads": "Automated Communication Broadcast Payloads",
        "sms_payload": "SMS Warning Payload",
        "whatsapp_payload": "WhatsApp Community Alert",
        "btn_send_whatsapp": "Open WhatsApp Web Alert",
        "btn_copy_sms": "Copy SMS Text",
        
        # Presets
        "preset_title": "Quick Demonstration Scenarios",
        "preset_lsd": "Scenario A: Lumpy Skin Disease Outbreak (Baramati)",
        "preset_fmd": "Scenario B: Foot & Mouth Vesicle Incursion (Shirur)",
        "preset_healthy": "Scenario C: Baseline Health Inspection (Junnar)",
        
        # General
        "btn_run_full": "Run Complete Integrated Assessment",
        "status_processing": "Processing full AI pipeline...",
        "footer_text": "Pashudhan Kavach | Built for Smallholder Livestock Resiliency & Biosecurity"
    },
    
    "hi": {
        "app_title": "पशुधन कवच",
        "app_tagline": "छोटे पशुपालकों के लिए AI-संचालित एज निर्णय सहायता एवं संक्रामक रोग रोकथाम प्रणाली",
        "badge_trilingual": "त्रिभाषी: English | हिंदी | मराठी",
        "nav_dashboard": "निर्णय डैशबोर्ड",
        "nav_vision": "वेबकैम व विज़न AI",
        "nav_rag": "चिकित्सीय RAG परामर्श",
        "nav_medication": "दवा स्कैनर व ML जोखिम",
        "nav_geo": "जियो-फेंसिंग व डॉक्टर प्रेषण",
        "nav_cases": "फील्ड टेस्ट केस",
        
        # Section 1: Vision
        "vision_title": "मल्टी-मॉडल इनपुट व इमेज प्रोसेसिंग इंजन",
        "vision_subtitle": "लैपटॉप वेबकैम या फोटो अपलोड के साथ MobileNetV3 द्वारा त्वरित रोग लक्षण पहचान",
        "btn_start_cam": "वेबकैम चालू करें",
        "btn_stop_cam": "वेबकैम बंद करें",
        "btn_capture": "फोटो खींचें",
        "btn_upload": "फोटो अपलोड करें",
        "drag_drop_text": "पशु के घाव/त्वचा की फोटो यहाँ खींचें या चुनें",
        "analyzing_image": "MobileNetV3 द्वारा पैथोलॉजी टेंसर विश्लेषण जारी है...",
        "detected_pathology": "पहचाना गया रोग / स्थिति",
        "confidence_score": "सटीकता विश्वास स्कोर",
        "visual_features": "निकाले गए डीप पैथोलॉजी टेंसर (576-dim)",
        "symptom_tags": "पहचाने गए दृश्य लक्षण",
        
        # Disease labels
        "disease_lsd": "लंपी चर्मरोग (LSD - Lumpy Skin)",
        "disease_fmd": "खुरपका-मुंहपका रोग (FMD - खुरहा)",
        "disease_ppr": "बकरी प्लेग / पीपीआर (PPR)",
        "disease_hs": "गलघोंटू / घटसर्प (HS - Haemorrhagic Septicaemia)",
        "disease_healthy": "स्वस्थ पशु (सामान्य)",
        
        # Section 2: Clinical RAG
        "rag_title": "RAG चिकित्सीय रोकथाम व देखभाल परामर्श",
        "rag_subtitle": "लक्षणों व दृश्य पहचान का कोसाइन समानता वेक्टर सर्च आधारित चिकित्सीय ज्ञानकोष से मिलान",
        "query_placeholder": "देखे गए लक्षण लिखें (जैसे: तेज बुखार, मुंह में छाले, अत्यधिक लार गिरना, चारा न खाना, त्वचा पर गाठें)...",
        "btn_retrieve_rag": "चिकित्सीय निर्देश प्राप्त करें",
        "tab_quarantine": "सख्त क्वारंटाइन (विलगीकरण)",
        "tab_chemical": "रासायनिक धुलाई व कीटाणुनाशन",
        "tab_diet": "आहार व सहायक पोषण",
        "tab_vectors": "वेक्टर समानता मिलान",
        "similarity_score": "परामर्श मिलान सटीकता",
        
        # Section 3: Medication & Pill Scanner
        "med_title": "मशीन लर्निंग दवा जोखिम व सुरक्षा क्लासिफायर",
        "med_subtitle": "रैंडम फॉरेस्ट मॉडल द्वारा पशुपालक की दवाओं का परीक्षण व स्वतः ओवरराइड चेतावनी",
        "med_input_label": "दी जाने वाली दवा / गोली / उपचार का नाम दर्ज करें:",
        "med_input_placeholder": "उदा. पैरासिटामोल बोलस, मेलोक्सिकैम इंजेक्शन, ऑक्सीटेट्रासाइक्लिन, डेक्सामेथासोन, नीम लेप...",
        "symptom_duration_label": "रोग के दिनों की संख्या (Days):",
        "critical_signs_label": "देखे गए गंभीर खतरे के संकेत:",
        "sign_hemorrhage": "मुंह या घाव से रक्तस्राव",
        "sign_recumbent": "पशु लेटा हुआ है / उठने में असमर्थ",
        "sign_asphyxia": "सांस लेने में भारी कठिनाई / गले में सूजन",
        "btn_evaluate_med": "दवा सुरक्षा की जांच करें",
        "risk_level": "चिकित्सीय जोखिम स्तर",
        "risk_low": "सुरक्षित सहायक देखभाल",
        "risk_moderate": "पशु चिकित्सक की देखरेख अनिवार्य",
        "risk_high": "अति गंभीर खतरा - प्रतिबंधित व हानिकारक उपचार",
        "heuristic_alert_title": "डायनामिक जोखिम वृद्धि चेतावनी",
        "heuristic_alert_duration": "गंभीर चेतावनी: रोग कई दिनों से जारी है। जटिलताओं से बचाव के लिए तत्काल पशु चिकित्सक से परामर्श लें।",
        "heuristic_alert_signs": "आपातकालीन चेतावनी: गंभीर संकट या रक्तस्राव के लक्षण पाए गए। तत्काल पशु चिकित्सक आवश्यक।",
        
        # Chatbot Assistant
        "chatbot_title": "पशुधन एआई सहायक",
        "chatbot_subtitle": "पशुपालक मित्र - निरंतर चिकित्सकीय संवाद व सहायता",
        "chatbot_placeholder": "गाय, भैंस या बकरी के लक्षण, बीमारी या दवा के बारे में पूछें...",
        "chatbot_send": "सहायक से पूछें",
        "chatbot_welcome": "नमस्कार किसान साथी! मैं आपका पशुधन एआई सहायक हूँ। अपने पशु के लक्षण या कोई भी सवाल बताएं, मैं तुरंत आपकी मदद करूँगा।",
        
        # Section 4: Geo-Fence & Alert
        "geo_title": "एजेंटिक जियो-फेंसिंग चेतावनी व त्वरित प्रेषण",
        "geo_subtitle": "हैवरसाइन दूरी गणना, 5 किमी दायरे में स्वतः चेतावनी व पशु चिकित्सा अधिकारी टिकट प्रेषण",
        "farm_location": "रिपोर्ट करने वाले फार्म की GPS स्थिति",
        "alert_radius": "कंटेनमेंट घेरा दायरा (किमी)",
        "btn_run_containment": "जियो-फेंस घेराबंदी सक्रिय करें",
        "nearby_farms_found": "खतरे के दायरे में पाए गए पंजीकृत पशुपालक",
        "ticket_title": "स्वतः सृजित पशु चिकित्सा आपातकालीन टिकट",
        "ticket_id": "डिजिटल ट्रैकिंग टिकट नंबर",
        "ticket_officer": "नामित पशु चिकित्सा अधिकारी",
        "ticket_priority": "प्राथमिकता SLA",
        "ticket_status": "स्थिति",
        "ticket_status_dispatched": "त्वरित प्रतिक्रिया दल को प्रेषित (DISPATCHED)",
        "btn_copy_ticket": "टिकट कॉपी करें",
        "broadcast_payloads": "स्वतः जनरेटेड संचार संदेश",
        "sms_payload": "SMS चेतावनी पेलोड",
        "whatsapp_payload": "WhatsApp सामुदायिक चेतावनी",
        "btn_send_whatsapp": "WhatsApp अलर्ट भेजें",
        "btn_copy_sms": "SMS कॉपी करें",
        
        # Presets
        "preset_title": "त्वरित प्रदर्शन परिदृश्य",
        "preset_lsd": "परिदृश्य A: लंपी चर्मरोग प्रकोप (बारामती)",
        "preset_fmd": "परिदृश्य B: खुरपका-मुंहपका छाले (शिरूर)",
        "preset_healthy": "परिदृश्य C: स्वस्थ पशु सामान्य निरीक्षण (जुन्नर)",
        
        # General
        "btn_run_full": "संपूर्ण एकीकृत AI मूल्यांकन चलाएं",
        "status_processing": "एआई पाइपलाइन प्रोसेस हो रही है...",
        "footer_text": "पशुधन कवच | ग्रामीण पशुपालक सुरक्षा व जैव-सुरक्षा पहल"
    },
    
    "mr": {
        "app_title": "पशुधन कवच",
        "app_tagline": "ग्रामीण पशुपालकांसाठी AI-संचलित एज निर्णय सहाय्य व साथरोग प्रतिबंधक यंत्रणा",
        "badge_trilingual": "त्रिभाषिक: English | हिंदी | मराठी",
        "nav_dashboard": "निर्णय डॅशबोर्ड",
        "nav_vision": "कॅमेरा व व्हिजन AI",
        "nav_rag": "वैद्यकीय RAG सल्लागार",
        "nav_medication": "औषध स्कॅनर व ML जोखीम",
        "nav_geo": "जिओ-फेन्सिंग व डॉक्टर तिकीट",
        "nav_cases": "शेतकरी चाचणी प्रकरणे",
        
        # Section 1: Vision
        "vision_title": "मल्टी-मॉडल इनपुट व इमेज प्रोसेसिंग इंजिन",
        "vision_subtitle": "लॅपटॉप वेबकॅम किंवा फोटो अपलोडद्वारे MobileNetV3 चा वापर करून रोगांच्या लक्षणांचे अचूक निदान",
        "btn_start_cam": "वेबकॅम सुरू करा",
        "btn_stop_cam": "कॅमेरा बंद करा",
        "btn_capture": "फोटो काढा",
        "btn_upload": "फोटो अपलोड करा",
        "drag_drop_text": "जनावरांच्या जखमेचा किंवा त्वचेचा फोटो येथे टाका किंवा निवडा",
        "analyzing_image": "MobileNetV3 द्वारे पॅथॉलॉजी टेन्सर विश्लेषण चालू आहे...",
        "detected_pathology": "ओळखलेला रोग / स्थिती",
        "confidence_score": "निदान अचूकता विश्वास",
        "visual_features": "काढलेले डीप पॅथॉलॉजी टेन्सर्स (576-dim)",
        "symptom_tags": "ओळखलेली दृश्य लक्षणे",
        
        # Disease labels
        "disease_lsd": "लंपी त्वचा रोग (LSD - Lumpy Skin Disease)",
        "disease_fmd": "लाळ्या-खुरकूत रोग (FMD - लाळ खुरखूत)",
        "disease_ppr": "शेळ्या-मेंढ्यांचा पीपीआर रोग (PPR - बाकडी प्लेग)",
        "disease_hs": "घटसर्प रोग (HS - Haemorrhagic Septicaemia)",
        "disease_healthy": "निरोगी जनावर (सामान्य)",
        
        # Section 2: Clinical RAG
        "rag_title": "RAG वैद्यकीय प्रतिबंध व काळजी सल्लागार",
        "rag_subtitle": "लक्षणे व व्हिजन निष्कर्षांचे कोसाइन साम्य व्हेक्टर शोध आधारित पशुवैद्यकीय ज्ञानकोशाशी जुळवणी",
        "query_placeholder": "दिसणारी लक्षणे लिहा (उदा. तीव्र ताप, तोंडात फोड, सतत लाळ गळणे, चरण्यास नकार, अंगावर गाठी)...",
        "btn_retrieve_rag": "वैद्यकीय मार्गदर्शन मिळवा",
        "tab_quarantine": "सक्त विलगीकरण (Quarantine)",
        "tab_chemical": "जंतुनाशक धुलाई (पोटॅशियम परमँगनेट)",
        "tab_diet": "आहार व पोषण व्यवस्थापन",
        "tab_vectors": "व्हेक्टर साम्य गुण",
        "similarity_score": "मार्गदर्शन जुळवणी टक्केवारी",
        
        # Section 3: Medication & Pill Scanner
        "med_title": "मशीन लर्निंग औषध जोखीम व सुरक्षा वर्गीकरण",
        "med_subtitle": "रँडम फॉरेस्ट मॉडेलद्वारे औषध तपासणी व धोक्याची स्वयंचलित ओव्हरराइड चेतावणी",
        "med_input_label": "वापरण्यात येणाऱ्या गोळी / औषध / उपायाचे नाव टाका:",
        "med_input_placeholder": "उदा. पॅरासिटामॉल गोळी, मेलोक्सिकॅम इंजेक्शन, ऑक्सीटेट्रासायक्लिन, डेक्सामेथासोन, हळद-कडुलिंब लेप...",
        "symptom_duration_label": "आजाराचे दिवस (कालावधी):",
        "critical_signs_label": "दिसलेली गंभीर धोक्याची लक्षणे:",
        "sign_hemorrhage": "तोंडातून किंवा जखमेतून रक्तस्राव",
        "sign_recumbent": "जनावर जमिनीवर पडले आहे / उठू शकत नाही",
        "sign_asphyxia": "श्वास घेण्यास तीव्र अडथळा / घशावर मोठी सूज",
        "btn_evaluate_med": "औषध सुरक्षितता तपासा",
        "risk_level": "वैद्यकीय जोखीम स्तर",
        "risk_low": "सुरक्षित पूरक उपचार",
        "risk_moderate": "पशुवैद्यकीय डॉक्टरांची देखरेख आवश्यक",
        "risk_high": "अति धोकादायक - अनधिकृत व धोकादायक उपचार",
        "heuristic_alert_title": "डायनॅमिक जोखीम वाढ चेतावणी",
        "heuristic_alert_duration": "गंभीर चेतावणी: आजार अनेक दिवसांपासून सुरू आहे. अंतर्गत गुंतागुंत टाळण्यासाठी तातडीने पशुवैद्यकीय डॉक्टरांचा सल्ला घ्या.",
        "heuristic_alert_signs": "तात्काळ इशारा: गंभीर अशक्तपणा किंवा रक्तस्रावाची लक्षणे आढळली आहेत. त्वरित पशुवैद्यकास पाचारण करा.",
        
        # Chatbot Assistant
        "chatbot_title": "पशुधन एआई सहाय्यक",
        "chatbot_subtitle": "शेतकरी मित्र - सतत वैद्यकीय संवाद व सल्लागार",
        "chatbot_placeholder": "गाय, म्हैस, शेळीच्या आजाराबद्दल किंवा औषधाबद्दल काहीही विचारा...",
        "chatbot_send": "सहाय्यकास विचारा",
        "chatbot_welcome": "नमस्कार शेतकरी बंधू! मी तुमचा पशुधन एआई सहाय्यक आहे. जनावरांची लक्षणे सांगा किंवा उपचारांविषयी विचारा, मी लगेच मार्गदर्शन करेन.",
        
        # Section 4: Geo-Fence & Alert
        "geo_title": "एजंटिक जिओ-फेन्स इशारा व तात्काळ प्रेषण यंत्रणा",
        "geo_subtitle": "हॅव्हरसाईन अंतराद्वारे 5 किमी परिसरातील शेतकऱ्यांना सावधगिरी व पशुवैद्यकीय अधिकाऱ्यांना तिकीट प्रेषण",
        "farm_location": "रिपोर्ट केलेल्या फार्मचे GPS स्थान",
        "alert_radius": "प्रतिबंधात्मक वर्तुळ दायरा (किमी)",
        "btn_run_containment": "जिओ-फेन्सिंग प्रतिबंध लागू करा",
        "nearby_farms_found": "धोक्याच्या क्षेत्रात सापडलेले नोंदणीकृत शेतकरी",
        "ticket_title": "स्वयंचलित पशुवैद्यकीय आपत्कालीन तिकीट",
        "ticket_id": "डिजिटल ट्रॅकिंग तिकीट क्रमांक",
        "ticket_officer": "नियुक्त तालुका पशुवैद्यकीय अधिकारी",
        "ticket_priority": "प्राधान्यता SLA",
        "ticket_status": "स्थिती",
        "ticket_status_dispatched": "तातडीच्या कृती दलाकडे रवाना (DISPATCHED)",
        "btn_copy_ticket": "तिकीट कॉपी करा",
        "broadcast_payloads": "स्वयंचलित संवादाचे संदेश",
        "sms_payload": "SMS चेतावणी संदेश",
        "whatsapp_payload": "WhatsApp शेतकरी चेतावणी",
        "btn_send_whatsapp": "WhatsApp अलर्ट पाठवा",
        "btn_copy_sms": "SMS कॉपी करा",
        
        # Presets
        "preset_title": "प्रात्यक्षिक परिस्थिती",
        "preset_lsd": "केस A: लंपी त्वचा रोगाचा प्रादुर्भाव (बारामती)",
        "preset_fmd": "केस B: लाळ्या-खुरकूत रोगाचे फोड (शिरूर)",
        "preset_healthy": "केस C: निरोगी जनावर तपासणी (जुन्नर)",
        
        # General
        "btn_run_full": "संपूर्ण AI एकात्मिक तपासणी करा",
        "status_processing": "एआय अल्गोरिदम कार्यरत आहेत...",
        "footer_text": "पशुधन कवच | ग्रामीण पशुपालक स्वावलंबन व जैवसुरक्षा"
    }
}

def get_text(key: str, lang: str = "en") -> str:
    """Retrieve localized string with fallback to English."""
    lang_dict = TRANSLATIONS.get(lang, TRANSLATIONS["en"])
    return lang_dict.get(key, TRANSLATIONS["en"].get(key, key))
