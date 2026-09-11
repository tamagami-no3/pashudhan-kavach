/**
 * Pashudhan Kavach (पशुधन कवच) - Interactive Client-side Controller
 * Trilingual switching, Webcam WebRTC streaming, Leaflet GIS mapping, and ML inference.
 */

let currentLang = typeof INITIAL_LANG !== 'undefined' ? INITIAL_LANG : 'en';
let webcamStream = null;
let currentImageBase64 = null;
let leafletMap = null;
let epicenterMarker = null;
let containmentCircle = null;
let farmerMarkers = [];

let currentPathology = {
  code: "lsd",
  name: "Lumpy Skin Disease (LSD)",
  confidence: 91.0,
  symptoms: ["Firm cutaneous nodules (2-5cm)", "Circumscribed dermal eruptions"]
};

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  initMap();
  setLanguage(currentLang);
  // Initial run of default scenario
  updateGeoAlert();
});

/* =========================================================================
   1. TRILINGUAL LOCALIZATION CONTROLLER
   ========================================================================= */
function setLanguage(lang) {
  if (!TRANSLATIONS[lang]) return;
  currentLang = lang;

  // Update active pill button style
  ["en", "hi", "mr"].forEach(l => {
    const btn = document.getElementById(`lang-btn-${l}`);
    if (btn) {
      if (l === lang) {
        btn.className = "px-2.5 py-1 text-xs font-semibold rounded-md transition-colors text-white bg-brand-600 shadow";
      } else {
        btn.className = "px-2.5 py-1 text-xs font-semibold rounded-md transition-colors text-slate-400 hover:text-white";
      }
    }
  });

  const t = TRANSLATIONS[lang];

  // Update static UI text labels
  const uiMappings = {
    "ui-app-title": `${t.app_title} <span class="text-xs px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-400 border border-brand-500/30 font-semibold">AI Edge</span>`,
    "ui-badge-trilingual": t.badge_trilingual,
    "ui-app-tagline": t.app_tagline,
    "ui-btn-run-full": t.btn_run_full,
    "ui-preset-title": `<i class="fa-solid fa-flask text-brand-400"></i> ${t.preset_title}:`,
    "preset-lbl-lsd": t.preset_lsd,
    "preset-lbl-fmd": t.preset_fmd,
    "preset-lbl-healthy": t.preset_healthy,
    "ui-vision-title": t.vision_title,
    "ui-vision-subtitle": t.vision_subtitle,
    "ui-btn-start-cam": t.btn_start_cam,
    "ui-btn-capture": t.btn_capture,
    "ui-btn-upload": t.btn_upload,
    "ui-analyzing-image": t.analyzing_image,
    "ui-detected-pathology": t.detected_pathology,
    "ui-confidence-score": t.confidence_score,
    "ui-symptom-tags": t.symptom_tags,
    "ui-rag-title": t.rag_title,
    "ui-rag-subtitle": t.rag_subtitle,
    "ui-btn-retrieve-rag": t.btn_retrieve_rag,
    "ui-tab-quarantine": t.tab_quarantine,
    "ui-tab-chemical": t.tab_chemical,
    "ui-tab-diet": t.tab_diet,
    "ui-similarity-score": t.similarity_score,
    "ui-med-title": t.med_title,
    "ui-med-subtitle": t.med_subtitle,
    "ui-med-input-label": t.med_input_label,
    "ui-symptom-duration-label": t.symptom_duration_label,
    "ui-critical-signs-label": t.critical_signs_label,
    "ui-sign-hemorrhage": t.sign_hemorrhage,
    "ui-sign-recumbent": t.sign_recumbent,
    "ui-sign-asphyxia": t.sign_asphyxia,
    "ui-btn-evaluate-med": t.btn_evaluate_med,
    "ui-risk-level": t.risk_level,
    "ui-heuristic-alert-title": t.heuristic_alert_title,
    "ui-geo-title": t.geo_title,
    "ui-geo-subtitle": t.geo_subtitle,
    "ui-farm-location": t.farm_location,
    "ui-alert-radius": t.alert_radius,
    "ui-ticket-title": t.ticket_title,
    "ui-ticket-officer": t.ticket_officer,
    "ui-ticket-priority": t.ticket_priority,
    "ui-ticket-status": t.ticket_status,
    "ui-whatsapp-payload": `<i class="fa-brands fa-whatsapp text-emerald-400 text-xs"></i> ${t.whatsapp_payload}`,
    "ui-sms-payload": `<i class="fa-solid fa-comment-sms text-blue-400 text-xs"></i> ${t.sms_payload}`,
    "ui-btn-send-whatsapp": t.btn_send_whatsapp,
    "ui-btn-copy-sms": t.btn_copy_sms,
    "ui-nearby-farms-found": t.nearby_farms_found,
    "ui-footer-text": `${t.footer_text} &bull; Powered by PyTorch, MobileNetV3 & Scikit-Learn`
  };

  for (const [id, val] of Object.entries(uiMappings)) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = val;
  }

  // Update placeholders
  const ragInput = document.getElementById("rag-query-input");
  if (ragInput) ragInput.placeholder = t.query_placeholder;
  const medInput = document.getElementById("med-input");
  if (medInput) medInput.placeholder = t.med_input_placeholder;

  // Refresh dynamic clinical data in the new language
  executeRAG();
  evaluateMedicationSafety();
  updateGeoAlert();
}

/* =========================================================================
   2. MODULE 1: WEBCAM & VISION AI CONTROLLER
   ========================================================================= */
async function toggleWebcam() {
  const video = document.getElementById("webcam-video");
  const imgPreview = document.getElementById("image-preview");
  const btnToggle = document.getElementById("btn-toggle-cam");
  const btnCapture = document.getElementById("btn-capture-frame");
  const activeBadge = document.getElementById("cam-active-badge");

  if (webcamStream) {
    // Stop camera
    webcamStream.getTracks().forEach(track => track.stop());
    webcamStream = null;
    video.classList.add("hidden");
    imgPreview.classList.remove("hidden");
    btnCapture.disabled = true;
    activeBadge.classList.add("hidden");
    btnToggle.innerHTML = `<i class="fa-solid fa-camera"></i> <span>${TRANSLATIONS[currentLang].btn_start_cam}</span>`;
  } else {
    // Start camera
    try {
      webcamStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "environment" }
      });
      video.srcObject = webcamStream;
      video.classList.remove("hidden");
      imgPreview.classList.add("hidden");
      btnCapture.disabled = false;
      activeBadge.classList.remove("hidden");
      btnToggle.innerHTML = `<i class="fa-solid fa-camera-slash"></i> <span>${TRANSLATIONS[currentLang].btn_stop_cam}</span>`;
    } catch (err) {
      alert(`Webcam access error: ${err.message}. Please permit camera permissions or upload an image file.`);
    }
  }
}

function captureWebcamFrame() {
  const video = document.getElementById("webcam-video");
  const canvas = document.getElementById("capture-canvas");
  const imgPreview = document.getElementById("image-preview");

  if (!video || !webcamStream) return;

  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const b64 = canvas.toDataURL("image/jpeg", 0.88);
  currentImageBase64 = b64;
  imgPreview.src = b64;

  // Close stream and show captured frame
  toggleWebcam();
  analyzeImageBase64(b64);
}

function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const b64 = e.target.result;
    currentImageBase64 = b64;
    document.getElementById("image-preview").src = b64;
    analyzeImageBase64(b64);
  };
  reader.readAsDataURL(file);
}

async function analyzeImageBase64(b64) {
  const loader = document.getElementById("vision-loader");
  loader.classList.remove("hidden");

  try {
    const res = await fetch("/api/analyze-image", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ image_base64: b64, lang: currentLang })
    });
    const data = await res.json();
    if (res.ok) {
      renderVisionResults(data);
      // Automatically update RAG and Geo alerts with new pathology
      currentPathology = {
        code: data.predicted_code,
        name: data.disease_name,
        confidence: data.confidence,
        symptoms: data.symptom_indicators
      };
      executeRAG();
      updateGeoAlert();
    } else {
      console.error("Vision API error:", data);
    }
  } catch (err) {
    console.error("Vision request failed:", err);
  } finally {
    loader.classList.add("hidden");
  }
}

function renderVisionResults(data) {
  document.getElementById("res-disease-name").innerText = data.disease_name;
  document.getElementById("res-danger-level").innerText = data.danger_level;
  document.getElementById("res-confidence").innerText = `${data.confidence}%`;

  // Probabilities
  const probs = data.class_probabilities || {};
  document.getElementById("prob-lsd").innerText = `${probs.lsd || 0}%`;
  document.getElementById("prob-fmd").innerText = `${probs.fmd || 0}%`;
  document.getElementById("prob-ppr").innerText = `${probs.ppr || 0}%`;
  document.getElementById("prob-hs").innerText = `${probs.hs || 0}%`;
  document.getElementById("prob-healthy").innerText = `${probs.healthy || 0}%`;

  // Highlight predicted class in mini bars
  ["lsd", "fmd", "ppr", "hs", "healthy"].forEach(c => {
    const el = document.getElementById(`prob-${c}`);
    if (el) {
      if (c === data.predicted_code) {
        el.className = "font-bold text-amber-400";
      } else {
        el.className = "font-bold text-slate-400";
      }
    }
  });

  // Tensor metadata
  const tf = data.tensor_features || {};
  document.getElementById("res-tensor-shape").innerText = `${tf.tensor_shape || '[1,3,224,224]'} (Mean: ${tf.mean_activation || 0.42})`;
  if (tf.top_channels && tf.top_channels.length > 0) {
    document.getElementById("res-tensor-channels").innerText = tf.top_channels.slice(0, 2).join(", ");
  }

  // Symptoms
  const tagsContainer = document.getElementById("res-symptom-tags");
  tagsContainer.innerHTML = "";
  (data.symptom_indicators || []).forEach(sym => {
    const span = document.createElement("span");
    span.className = "px-2 py-0.5 rounded-full bg-slate-700 text-slate-200 text-[11px] border border-slate-600";
    span.innerText = sym;
    tagsContainer.appendChild(span);
  });
}

/* =========================================================================
   3. MODULE 2: CLINICAL RAG ADVISORY CONTROLLER
   ========================================================================= */
function addQueryChip(text) {
  const input = document.getElementById("rag-query-input");
  input.value = input.value ? `${input.value}, ${text}` : text;
  executeRAG();
}

async function executeRAG() {
  const query = document.getElementById("rag-query-input").value;
  try {
    const res = await fetch("/api/rag-query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: query,
        visual_symptoms: currentPathology.symptoms,
        lang: currentLang
      })
    });
    const data = await res.json();
    if (res.ok && data.guidelines && data.guidelines.length > 0) {
      const topGuide = data.guidelines[0];
      document.getElementById("rag-match-score").innerText = `${topGuide.similarity_score}%`;
      document.getElementById("rag-quarantine-text").innerText = topGuide.quarantine_protocol;
      document.getElementById("rag-chemical-text").innerText = topGuide.chemical_wash;
      document.getElementById("rag-diet-text").innerText = topGuide.dietary_care;
    }
  } catch (err) {
    console.error("RAG request error:", err);
  }
}

function switchRagTab(tabName) {
  ["quarantine", "chemical", "diet"].forEach(t => {
    const btn = document.getElementById(`tab-btn-${t}`);
    const pane = document.getElementById(`pane-${t}`);
    if (t === tabName) {
      btn.className = "px-3 py-1.5 text-xs font-bold text-blue-400 border-b-2 border-blue-500 flex items-center gap-1.5";
      pane.classList.remove("hidden");
    } else {
      btn.className = "px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 border-b-2 border-transparent flex items-center gap-1.5";
      pane.classList.add("hidden");
    }
  });
}

/* =========================================================================
   4. MODULE 3: MEDICATION PILL SCANNER & RISK CONTROLLER
   ========================================================================= */
function updateDurationLabel(val) {
  document.getElementById("duration-val").innerText = `${val} Days`;
  const hint = document.getElementById("duration-warning-hint");
  if (parseInt(val) > 4) {
    hint.innerText = ">4 days: AUTO-ESCALATION ACTIVE";
    hint.className = "text-[10px] text-red-400 font-bold block mt-0.5 animate-pulse";
  } else {
    hint.innerText = ">4 days triggers auto-escalation";
    hint.className = "text-[10px] text-slate-400 block mt-0.5";
  }
}

async function evaluateMedicationSafety() {
  const medText = document.getElementById("med-input").value;
  const durationDays = parseInt(document.getElementById("duration-slider").value);
  
  const criticalSigns = [];
  if (document.getElementById("sign-hemorrhage").checked) criticalSigns.push("Hemorrhage");
  if (document.getElementById("sign-recumbent").checked) criticalSigns.push("Recumbent / Inability to stand");
  if (document.getElementById("sign-asphyxia").checked) criticalSigns.push("Severe respiratory distress");

  try {
    const res = await fetch("/api/evaluate-medication", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        medication: medText,
        duration_days: durationDays,
        critical_signs: criticalSigns,
        lang: currentLang
      })
    });
    const data = await res.json();
    if (res.ok) {
      renderMedRiskResults(data);
      // Feed medication risk level into geo alert
      updateGeoAlert(data.final_risk_level);
    }
  } catch (err) {
    console.error("Med risk request error:", err);
  }
}

function renderMedRiskResults(data) {
  const badge = document.getElementById("med-risk-badge");
  const alertBox = document.getElementById("heuristic-alert-box");
  const alertDesc = document.getElementById("heuristic-alert-desc");
  const guidance = document.getElementById("med-guidance-text");
  const conf = document.getElementById("med-confidence-val");

  badge.innerText = data.risk_label;
  conf.innerText = `${data.confidence}%`;
  guidance.innerText = data.clinical_guidance;

  if (data.final_risk_level === 2) {
    badge.className = "text-sm font-bold text-red-400";
  } else if (data.final_risk_level === 1) {
    badge.className = "text-sm font-bold text-amber-400";
  } else {
    badge.className = "text-sm font-bold text-emerald-400";
  }

  // Dynamic Heuristic Override display
  if (data.heuristic_override && data.override_reasons.length > 0) {
    alertBox.classList.remove("hidden");
    alertDesc.innerText = data.override_reasons.join(" ");
  } else {
    alertBox.classList.add("hidden");
  }
}

/* =========================================================================
   5. MODULE 4: GIS GEO-FENCE & VET DISPATCH CONTROLLER
   ========================================================================= */
function initMap() {
  const mapContainer = document.getElementById("leaflet-map");
  if (!mapContainer || leafletMap) return;

  // Initialize at Baramati rural coordinates
  const initialLat = 18.2750;
  const initialLon = 74.3160;

  leafletMap = L.map('leaflet-map', {
    zoomControl: false,
    attributionControl: false
  }).setView([initialLat, initialLon], 12);

  // Dark basemap tiles (CartoDB DarkMatter)
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    subdomains: 'abcd'
  }).addTo(leafletMap);

  // Epicenter custom pulse icon
  const pulseIcon = L.divIcon({
    className: 'epicenter-marker',
    html: '<div class="epicenter-pulse"></div><div class="epicenter-core"></div>',
    iconSize: [12, 12],
    iconAnchor: [6, 6]
  });

  epicenterMarker = L.marker([initialLat, initialLon], { icon: pulseIcon }).addTo(leafletMap);

  // 5 km containment circle
  containmentCircle = L.circle([initialLat, initialLon], {
    radius: 5000,
    color: '#f97316',
    weight: 2,
    dashArray: '5, 8',
    fillColor: '#ef4444',
    fillOpacity: 0.15
  }).addTo(leafletMap);
}

function updateRadius(val) {
  document.getElementById("radius-val").innerText = `${parseFloat(val).toFixed(1)} km`;
  if (containmentCircle) {
    containmentCircle.setRadius(parseFloat(val) * 1000);
  }
  updateGeoAlert();
}

function useCurrentLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      pos => {
        const lat = parseFloat(pos.coords.latitude.toFixed(4));
        const lon = parseFloat(pos.coords.longitude.toFixed(4));
        document.getElementById("gps-coords").value = `${lat}, ${lon}`;
        updateGeoAlert();
      },
      err => {
        alert("Geolocation permission denied. Using default agricultural district coordinates.");
      }
    );
  }
}

async function updateGeoAlert(medRiskLevel = 1) {
  const coordsStr = document.getElementById("gps-coords").value;
  const [latStr, lonStr] = coordsStr.split(",").map(s => s.trim());
  const lat = parseFloat(latStr) || 18.2750;
  const lon = parseFloat(lonStr) || 74.3160;
  const radius = parseFloat(document.getElementById("radius-slider").value) || 5.0;

  if (leafletMap && epicenterMarker && containmentCircle) {
    const latLng = [lat, lon];
    epicenterMarker.setLatLng(latLng);
    containmentCircle.setLatLng(latLng);
    containmentCircle.setRadius(radius * 1000);
    leafletMap.panTo(latLng);
  }

  try {
    const res = await fetch("/api/geo-alert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lat: lat,
        lon: lon,
        disease_name: currentPathology.name,
        disease_code: currentPathology.code,
        confidence: currentPathology.confidence,
        radius_km: radius,
        medication_risk: medRiskLevel,
        lang: currentLang
      })
    });
    const data = await res.json();
    if (res.ok) {
      renderGeoResults(data);
    }
  } catch (err) {
    console.error("Geo alert error:", err);
  }
}

function renderGeoResults(data) {
  // Update Ticket info
  const ticket = data.ticket;
  document.getElementById("ticket-id-val").innerText = ticket.ticket_id;
  document.getElementById("ticket-officer-val").innerText = ticket.assigned_officer;
  document.getElementById("ticket-priority-val").innerText = ticket.priority;
  document.getElementById("ticket-ring-val").innerText = `${data.radius_km} km (${data.total_farms_affected} Farms)`;

  // Update Broadcast payloads
  document.getElementById("whatsapp-preview-snippet").innerText = data.whatsapp_payload;
  document.getElementById("sms-preview-snippet").innerText = data.sms_payload;
  document.getElementById("btn-open-whatsapp").href = data.whatsapp_url;
  document.getElementById("nearby-count-val").innerText = `${data.total_farms_affected} Herds (${data.total_animals_at_risk} Livestock)`;

  // Render Map Markers for Registered Farmers
  if (leafletMap) {
    farmerMarkers.forEach(m => leafletMap.removeLayer(m));
    farmerMarkers = [];

    (data.farmers_in_radius || []).forEach(f => {
      const pin = L.circleMarker([f.lat, f.lon], {
        radius: 6,
        color: '#f97316',
        fillColor: '#f97316',
        fillOpacity: 0.9,
        weight: 1
      });

      const popupContent = `
        <div style="min-width: 150px;">
          <strong style="color: #f97316;">${f.name}</strong><br/>
          <span>${f.village} (${f.distance_km} km away)</span><br/>
          <span>Herd: 🐄 ${f.herd.cattle} | 🐃 ${f.herd.buffalo} | 🐐 ${f.herd.goats}</span><br/>
          <span style="color: #60a5fa;">📞 ${f.phone}</span>
        </div>
      `;
      pin.bindPopup(popupContent);
      pin.addTo(leafletMap);
      farmerMarkers.push(pin);
    });
  }
}

function copySMSText() {
  const text = document.getElementById("sms-preview-snippet").innerText;
  navigator.clipboard.writeText(text);
  alert("SMS warning payload copied to clipboard!");
}

/* =========================================================================
   6. QUICK FIELD SCENARIOS & FULL PIPELINE CONTROLLER
   ========================================================================= */
async function loadScenario(type) {
  try {
    const res = await fetch(`/api/sample-cases?lang=${currentLang}`);
    const data = await res.json();
    const cases = data.cases || [];
    const target = cases.find(c => c.id === `case_${type}`) || cases[0];

    // Load Image
    document.getElementById("image-preview").src = target.image_url;
    // Load Query
    document.getElementById("rag-query-input").value = target.query;
    // Load Medication
    document.getElementById("med-input").value = target.medication;
    // Load Duration
    document.getElementById("duration-slider").value = target.duration_days;
    updateDurationLabel(target.duration_days);
    // Load Coordinates
    document.getElementById("gps-coords").value = `${target.lat}, ${target.lon}`;
    document.getElementById("radius-slider").value = target.radius_km;
    updateRadius(target.radius_km);

    // Set checkboxes
    document.getElementById("sign-hemorrhage").checked = target.critical_signs.length > 0;

    // Trigger full assessment
    runFullPipeline();
  } catch (err) {
    console.error("Failed loading scenario:", err);
  }
}

async function runFullPipeline() {
  // Read current states
  const query = document.getElementById("rag-query-input").value;
  const med = document.getElementById("med-input").value;
  const duration = parseInt(document.getElementById("duration-slider").value);
  const coordsStr = document.getElementById("gps-coords").value;
  const [latStr, lonStr] = coordsStr.split(",").map(s => s.trim());
  const lat = parseFloat(latStr) || 18.2750;
  const lon = parseFloat(lonStr) || 74.3160;
  const radius = parseFloat(document.getElementById("radius-slider").value) || 5.0;

  const criticalSigns = [];
  if (document.getElementById("sign-hemorrhage").checked) criticalSigns.push("Hemorrhage");
  if (document.getElementById("sign-recumbent").checked) criticalSigns.push("Recumbent");
  if (document.getElementById("sign-asphyxia").checked) criticalSigns.push("Asphyxia");

  const loader = document.getElementById("vision-loader");
  loader.classList.remove("hidden");

  try {
    const res = await fetch("/api/full-assessment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_base64: currentImageBase64,
        query: query,
        medication: med,
        duration_days: duration,
        critical_signs: criticalSigns,
        lat: lat,
        lon: lon,
        radius_km: radius,
        lang: currentLang
      })
    });
    const data = await res.json();
    if (res.ok) {
      renderVisionResults(data.vision);
      currentPathology = {
        code: data.vision.predicted_code,
        name: data.vision.disease_name,
        confidence: data.vision.confidence,
        symptoms: data.vision.symptom_indicators
      };

      if (data.rag && data.rag.length > 0) {
        const topGuide = data.rag[0];
        document.getElementById("rag-match-score").innerText = `${topGuide.similarity_score}%`;
        document.getElementById("rag-quarantine-text").innerText = topGuide.quarantine_protocol;
        document.getElementById("rag-chemical-text").innerText = topGuide.chemical_wash;
        document.getElementById("rag-diet-text").innerText = topGuide.dietary_care;
      }

      renderMedRiskResults(data.medication);
      renderGeoResults(data.geo);
    }
  } catch (err) {
    console.error("Full pipeline execution failed:", err);
  } finally {
    loader.classList.add("hidden");
  }
}
