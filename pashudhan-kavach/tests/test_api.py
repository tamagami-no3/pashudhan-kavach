"""
Automated integration tests for FastAPI backend and end-to-end endpoints.
"""

import sys
import os
from fastapi.testclient import TestClient

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from app import app

client = TestClient(app)

def test_homepage():
    res = client.get("/")
    assert res.status_code == 200
    assert "Pashudhan Kavach" in res.text
    print("[PASS] test_homepage")

def test_translations_api():
    res = client.get("/api/translations")
    assert res.status_code == 200
    data = res.json()
    assert "en" in data and "hi" in data and "mr" in data
    print("[PASS] test_translations_api")

def test_sample_cases_api():
    res = client.get("/api/sample-cases?lang=mr")
    assert res.status_code == 200
    data = res.json()
    assert len(data["cases"]) == 3
    print("[PASS] test_sample_cases_api")

def test_full_assessment_pipeline():
    payload = {
        "query": "cow has high fever, blisters inside mouth, drooling saliva",
        "medication": "Dexamethasone injection high dose",
        "duration_days": 5,
        "critical_signs": ["Hemorrhage"],
        "lat": 18.2750,
        "lon": 74.3160,
        "radius_km": 5.0,
        "lang": "en"
    }
    res = client.post("/api/full-assessment", json=payload)
    assert res.status_code == 200
    data = res.json()
    
    # Check Module 1: Vision
    assert "vision" in data
    assert data["vision"]["predicted_code"] in ["fmd", "lsd"]
    
    # Check Module 2: RAG
    assert "rag" in data
    assert len(data["rag"]) > 0
    assert "quarantine_protocol" in data["rag"][0]
    
    # Check Module 3: Medication ML & Dynamic Override
    assert "medication" in data
    assert data["medication"]["final_risk_level"] == 2
    assert data["medication"]["heuristic_override"] is True
    
    # Check Module 4: Geo-Alert & Vet Ticket
    assert "geo" in data
    assert "ticket" in data["geo"]
    assert "TICKET-VET-" in data["geo"]["ticket"]["ticket_id"]
    assert data["geo"]["total_farms_affected"] > 0
    assert "sms_payload" in data["geo"]
    assert "whatsapp_payload" in data["geo"]
    print("[PASS] test_full_assessment_pipeline")

if __name__ == "__main__":
    test_homepage()
    test_translations_api()
    test_sample_cases_api()
    test_full_assessment_pipeline()
    print("All FastAPI integration tests passed successfully!")
