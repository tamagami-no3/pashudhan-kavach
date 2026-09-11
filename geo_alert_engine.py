"""
Pashudhan Kavach (पशुधन कवच) - Module 4: Agentic Geo-Fenced Alert & Rapid Dispatch System
Haversine spatial distance mapping, automated community containment ring,
and emergency veterinary routing in English, Hindi, and Marathi.
"""

import math
import uuid
import datetime
import urllib.parse
from typing import List, Dict, Any, Tuple

# Earth radius in kilometers
EARTH_RADIUS_KM = 6371.0

# Realistic regional livestock registry database (Maharashtra rural agrarian belt)
REGIONAL_FARMERS_REGISTRY: List[Dict[str, Any]] = [
    {
        "id": "FRM-MH-0101",
        "name": "Eknath Shinde (एकनाथ शिंदे)",
        "village": "Morgaon (मोरगाव)",
        "taluka": "Baramati",
        "lat": 18.2750,
        "lon": 74.3160,
        "phone": "+91 98231 44521",
        "herd": {"cattle": 6, "buffalo": 4, "goats": 12}
    },
    {
        "id": "FRM-MH-0102",
        "name": "Balu Jagtap (बाळू जगताप)",
        "village": "Koregaon (कोरेगाव)",
        "taluka": "Baramati",
        "lat": 18.2910,
        "lon": 74.3320,
        "phone": "+91 97652 11843",
        "herd": {"cattle": 12, "buffalo": 2, "goats": 0}
    },
    {
        "id": "FRM-MH-0103",
        "name": "Dnyaneshwar Pawar (ज्ञानेश्वर पवार)",
        "village": "Malegaon Bk (माळेगाव बु.)",
        "taluka": "Baramati",
        "lat": 18.2610,
        "lon": 74.3450,
        "phone": "+91 94220 78312",
        "herd": {"cattle": 8, "buffalo": 5, "goats": 4}
    },
    {
        "id": "FRM-MH-0104",
        "name": "Sunita Babar (सुनीता बाबर)",
        "village": "Supa (सुपा)",
        "taluka": "Baramati",
        "lat": 18.3180,
        "lon": 74.2980,
        "phone": "+91 91583 67201",
        "herd": {"cattle": 4, "buffalo": 6, "goats": 18}
    },
    {
        "id": "FRM-MH-0105",
        "name": "Ramesh Chavan (रमेश चव्हाण)",
        "village": "Undawadi (उंडवडी)",
        "taluka": "Baramati",
        "lat": 18.2430,
        "lon": 74.2810,
        "phone": "+91 98904 55319",
        "herd": {"cattle": 15, "buffalo": 0, "goats": 25}
    },
    {
        "id": "FRM-MH-0106",
        "name": "Sopan Gholap (सोपान घोलप)",
        "village": "Katphal (कटफळ)",
        "taluka": "Baramati",
        "lat": 18.3320,
        "lon": 74.3540,
        "phone": "+91 96041 89230",
        "herd": {"cattle": 5, "buffalo": 3, "goats": 8}
    },
    {
        "id": "FRM-MH-0107",
        "name": "Anil Gaikwad (अनिल गायकवाड)",
        "village": "Khangaon (खांडज)",
        "taluka": "Baramati",
        "lat": 18.2200,
        "lon": 74.3900,
        "phone": "+91 97302 44109",
        "herd": {"cattle": 9, "buffalo": 4, "goats": 0}
    },
    {
        "id": "FRM-MH-0108",
        "name": "Kashinath More (काशिनाथ मोरे)",
        "village": "Songaon (सोनगाव)",
        "taluka": "Baramati",
        "lat": 18.2550,
        "lon": 74.4120,
        "phone": "+91 94038 29012",
        "herd": {"cattle": 7, "buffalo": 2, "goats": 14}
    },
    {
        "id": "FRM-MH-0109",
        "name": "Shrikant Raut (श्रीकांत राऊत)",
        "village": "Deulgaon (देऊळगाव)",
        "taluka": "Daund",
        "lat": 18.3600,
        "lon": 74.4500,
        "phone": "+91 98226 77413",
        "herd": {"cattle": 11, "buffalo": 3, "goats": 6}
    },
    {
        "id": "FRM-MH-0110",
        "name": "Pandurang Jadhav (पांडुरंग जाधव)",
        "village": "Pargaon (पारगाव)",
        "taluka": "Daund",
        "lat": 18.3950,
        "lon": 74.3800,
        "phone": "+91 99754 12389",
        "herd": {"cattle": 8, "buffalo": 7, "goats": 10}
    },
    {
        "id": "FRM-MH-0111",
        "name": "Santosh Bhor (संतोष भोर)",
        "village": "Shirur Rural (शिरूर ग्रामीण)",
        "taluka": "Shirur",
        "lat": 18.8250,
        "lon": 74.3800,
        "phone": "+91 98601 23456",
        "herd": {"cattle": 14, "buffalo": 1, "goats": 5}
    },
    {
        "id": "FRM-MH-0112",
        "name": "Ganesh Lande (गणेश लांडे)",
        "village": "Karanjawane (करंजावणे)",
        "taluka": "Shirur",
        "lat": 18.8410,
        "lon": 74.3620,
        "phone": "+91 97632 89011",
        "herd": {"cattle": 10, "buffalo": 4, "goats": 2}
    }
]


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance between two points on Earth (in kilometers).
    """
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * (math.sin(delta_lambda / 2.0) ** 2))
    
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(EARTH_RADIUS_KM * c, 2)


class GeoAlertEngine:
    """Automated Community Geo-Fence Containment and Ticket Dispatch."""

    def __init__(self, registry: List[Dict[str, Any]] = None):
        self.registry = registry or REGIONAL_FARMERS_REGISTRY

    def evaluate_outbreak(
        self,
        center_lat: float,
        center_lon: float,
        disease_name: str,
        disease_code: str,
        confidence: float,
        radius_km: float = 5.0,
        medication_risk: int = 1,
        lang: str = "en"
    ) -> Dict[str, Any]:
        """
        Calculates distances to all regional livestock owners, identifies farms
        within the containment ring, formats trilingual broadcast payloads, and creates a Vet ticket.
        """
        nearby_farmers = []
        total_at_risk_animals = 0

        for farmer in self.registry:
            dist = haversine_distance(center_lat, center_lon, farmer["lat"], farmer["lon"])
            if dist <= radius_km:
                herd_sum = sum(farmer["herd"].values())
                total_at_risk_animals += herd_sum
                nearby_farmers.append({
                    "id": farmer["id"],
                    "name": farmer["name"],
                    "village": farmer["village"],
                    "taluka": farmer["taluka"],
                    "lat": farmer["lat"],
                    "lon": farmer["lon"],
                    "distance_km": dist,
                    "phone": farmer["phone"],
                    "herd": farmer["herd"],
                    "total_animals": herd_sum
                })

        # Sort by proximity
        nearby_farmers.sort(key=lambda x: x["distance_km"])

        # Determine priority SLA
        is_high_contagious = disease_code in ["fmd", "lsd", "hs", "ppr"]
        if disease_code == "hs" or medication_risk == 2:
            priority = "P1 - CRITICAL (SLA: < 2 Hours)"
            sla_hours = 2
        elif is_high_contagious:
            priority = "P2 - HIGH (SLA: < 4 Hours)"
            sla_hours = 4
        else:
            priority = "P3 - ROUTINE (SLA: < 24 Hours)"
            sla_hours = 24

        # Generate unique tracking ticket
        ticket_id = f"TICKET-VET-{uuid.uuid4().hex[:6].upper()}"
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        # Assigned Veterinary Officer mapping based on location
        assigned_officer = "Dr. S. Kulkarni (B.V.Sc & A.H., Block Veterinary Officer)"
        contact_helpline = "1800-233-0418 / 1962 (Kisan Call Center / Animal Husbandry Helpline)"

        # Generate Multilingual Broadcast Payloads
        sms_text = self._build_sms_text(
            disease_name, center_lat, center_lon, radius_km, lang, contact_helpline
        )
        whatsapp_text = self._build_whatsapp_text(
            disease_name, center_lat, center_lon, radius_km, len(nearby_farmers),
            total_at_risk_animals, ticket_id, lang, contact_helpline
        )
        encoded_wa_link = f"https://wa.me/?text={urllib.parse.quote(whatsapp_text)}"

        # Full Digital Ticket payload
        ticket_payload = {
            "ticket_id": ticket_id,
            "created_at": timestamp,
            "priority": priority,
            "sla_hours": sla_hours,
            "status": "DISPATCHED TO RAPID RESPONSE TEAM",
            "assigned_officer": assigned_officer,
            "reporting_gps": f"{center_lat:.4f} N, {center_lon:.4f} E",
            "detected_pathology": disease_name,
            "pathology_code": disease_code,
            "confidence": confidence,
            "containment_radius_km": radius_km,
            "farms_in_danger_zone": len(nearby_farmers),
            "livestock_at_risk_count": total_at_risk_animals,
            "action_checklist": [
                "Deploy ring vaccination within 5 km radius perimeter",
                "Inspect oral and podal lesions / skin nodules at index farm",
                "Quarantine milk transport cans and enforce disinfectant footbaths",
                "Issue public warning to neighboring village Gram Panchayats"
            ]
        }

        return {
            "center_coordinates": {"lat": center_lat, "lon": center_lon},
            "radius_km": radius_km,
            "outbreak_containment_active": is_high_contagious,
            "farmers_in_radius": nearby_farmers,
            "total_farms_affected": len(nearby_farmers),
            "total_animals_at_risk": total_at_risk_animals,
            "ticket": ticket_payload,
            "sms_payload": sms_text,
            "whatsapp_payload": whatsapp_text,
            "whatsapp_url": encoded_wa_link
        }

    def _build_sms_text(self, disease: str, lat: float, lon: float, radius: float, lang: str, helpline: str) -> str:
        if lang == "hi":
            return (
                f"[पशुधन कवच अलर्ट] चेतावनी: आपके क्षेत्र ({radius} किमी दायरे) में {disease} के प्रकोप की पुष्टि हुई है। "
                f"अपने पशुओं को तुरंत अलग बांधें व सामूहिक चराई रोकें। सहायता: {helpline}"
            )
        elif lang == "mr":
            return (
                f"[पशुधन कवच इशारा] सावधान: तुमच्या परिसरातील ({radius} किमी क्षेत्रात) {disease} आजाराचा संसर्ग आढळला आहे. "
                f"जनावरांना तत्काळ स्वतंत्र बांधा व एकत्र चराई थांबवा. संपर्क: {helpline}"
            )
        else:
            return (
                f"[PASHUDHAN KAVACH ALERT] Outbreak of {disease} confirmed within {radius} km of your farm ({lat:.3f}, {lon:.3f}). "
                f"Isolate susceptible livestock immediately and halt shared grazing. Emergency Help: {helpline}"
            )

    def _build_whatsapp_text(
        self, disease: str, lat: float, lon: float, radius: float,
        farms_count: int, animals_count: int, ticket_id: str, lang: str, helpline: str
    ) -> str:
        if lang == "hi":
            return (
                f"🚨 *पशुधन कवच - आपातकालीन संक्रामक रोग चेतावनी* 🚨\n\n"
                f"⚠️ *सत्यापित रोग:* {disease}\n"
                f"📍 *केंद्र स्थान:* {lat:.4f} N, {lon:.4f} E\n"
                f"⭕ *प्रतिबंध दायरा:* {radius} किलोमीटर\n"
                f"📊 *प्रभावित बाड़े:* {farms_count} फार्म्स ({animals_count} पशु जोखिम में)\n"
                f"🎫 *सरकारी ट्रैकिंग टिकट:* `{ticket_id}`\n\n"
                f"🛡️ *तत्काल सुरक्षा निर्देश:*\n"
                f"1. बीमार पशुओं को तुरंत 100 मीटर दूर अलग बांधें।\n"
                f"2. मुंह व खुरों को 0.1% लाल दवा (KMnO4) के पानी से धोएं।\n"
                f"3. बाड़े में 4% धावन सोडा का छिड़काव करें।\n"
                f"4. किसी भी अज्ञात रासायनिक दवा का प्रयोग न करें।\n\n"
                f"📞 *पशुपालन सहायता हेल्पलाइन:* {helpline}\n"
                f"🌐 _पशुधन कवच एआई प्रणाली द्वारा स्वतः प्रेषित_"
            )
        elif lang == "mr":
            return (
                f"🚨 *पशुधन कवच - तात्काळ साथरोग प्रतिबंधक चेतावणी* 🚨\n\n"
                f"⚠️ *रोग निदान:* {disease}\n"
                f"📍 *केंद्रीभूत स्थान:* {lat:.4f} N, {lon:.4f} E\n"
                f"⭕ *प्रतिबंधात्मक दायरा:* {radius} किलोमीटर\n"
                f"📊 *धोक्यातील शेतकरी:* {farms_count} गोठे ({animals_count} जनावरे धोक्यात)\n"
                f"🎫 *डिजिटल तिकीट क्र:* `{ticket_id}`\n\n"
                f"🛡️ *तातडीने करावयाची कृती:*\n"
                f"1. आजारी जनावरांना तत्काळ स्वतंत्र बांधा.\n"
                f"2. तोंड व खुरातील जखमा ०.१% लाल औषधाच्या (KMnO4) पाण्याने धुवा.\n"
                f"3. गोठ्यात ४% धुण्याचा सोड्याचे पाणी शिंपडून निर्जंतुकीकरण करा.\n"
                f"4. डॉक्टरांच्या सल्ल्याशिवाय परस्पर कोणतीही गोळी देऊ नका.\n\n"
                f"📞 *पशुसंवर्धन मदत कक्ष:* {helpline}\n"
                f"🌐 _पशुधन कवच एआय यंत्रणेद्वारे स्वयंचलित प्रसारित_"
            )
        else:
            return (
                f"🚨 *PASHUDHAN KAVACH - EMERGENCY LIVESTOCK OUTBREAK ALERT* 🚨\n\n"
                f"⚠️ *Detected Disease:* {disease}\n"
                f"📍 *Epicenter GPS:* {lat:.4f} N, {lon:.4f} E\n"
                f"⭕ *Containment Perimeter:* {radius} km radius\n"
                f"📊 *Herds in Danger Zone:* {farms_count} farms ({animals_count} livestock at risk)\n"
                f"🎫 *Vet Tracking Ticket:* `{ticket_id}`\n\n"
                f"🛡️ *Immediate Mandatory Actions:*\n"
                f"1. Isolate sick cattle/goats 100m downwind immediately.\n"
                f"2. Wash mouth/feet lesions with 0.01%–0.1% KMnO4 solution.\n"
                f"3. Disinfect barns using 4% Sodium Carbonate wash.\n"
                f"4. Do NOT administer unprescribed steroids or human painkillers.\n\n"
                f"📞 *Veterinary Rapid Response Helpline:* {helpline}\n"
                f"🌐 _Dispatched autonomously by Pashudhan Kavach Decision Engine_"
            )

# Singleton instance
geo_alert_engine = GeoAlertEngine()
