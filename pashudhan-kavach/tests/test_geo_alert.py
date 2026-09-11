"""
Automated unit tests for Geo-Fence Containment, Haversine Mapping, and Veterinary Ticket Dispatch.
"""

import sys
import os

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from geo_alert_engine import GeoAlertEngine, haversine_distance

def test_haversine_formula():
    # Distance between Morgaon (18.2750, 74.3160) and Koregaon (18.2910, 74.3320)
    d = haversine_distance(18.2750, 74.3160, 18.2910, 74.3320)
    assert 2.0 <= d <= 3.5
    print(f"[PASS] test_haversine_formula (Calculated distance: {d} km)")

def test_outbreak_evaluation_and_ticket():
    engine = GeoAlertEngine()
    res = engine.evaluate_outbreak(
        center_lat=18.2750,
        center_lon=74.3160,
        disease_name="Lumpy Skin Disease (LSD)",
        disease_code="lsd",
        confidence=91.0,
        radius_km=5.0,
        medication_risk=2,
        lang="mr"
    )
    
    assert res["outbreak_containment_active"] is True
    assert res["total_farms_affected"] >= 3
    assert res["total_animals_at_risk"] > 0
    assert "TICKET-VET-" in res["ticket"]["ticket_id"]
    assert "P1 - CRITICAL" in res["ticket"]["priority"]
    assert "https://wa.me/?text=" in res["whatsapp_url"]
    print("[PASS] test_outbreak_evaluation_and_ticket")

if __name__ == "__main__":
    test_haversine_formula()
    test_outbreak_evaluation_and_ticket()
    print("All Geo Alert tests passed successfully!")
