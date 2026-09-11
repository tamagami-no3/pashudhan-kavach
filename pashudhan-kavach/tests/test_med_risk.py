"""
Automated unit tests for Machine Learning Medication Risk Classifier & Dynamic Overrides.
"""

import sys
import os

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from med_risk_engine import MedicationRiskModel

def test_safe_medication():
    engine = MedicationRiskModel()
    res = engine.evaluate_treatment("Multivitamin oral syrup and ORS electrolytes", symptom_duration_days=1, critical_signs=[], lang="en")
    assert res["final_risk_level"] == 0
    assert res["heuristic_override"] is False
    print("[PASS] test_safe_medication (Level 0)")

def test_prescription_medication():
    engine = MedicationRiskModel()
    res = engine.evaluate_treatment("Meloxicam injection 5mg/ml and Oxytetracycline 20%", symptom_duration_days=2, critical_signs=[], lang="en")
    assert res["final_risk_level"] == 1
    assert res["heuristic_override"] is False
    print("[PASS] test_prescription_medication (Level 1)")

def test_duration_override():
    engine = MedicationRiskModel()
    # Mild medicine, but duration is 6 days (> 4 days threshold)
    res = engine.evaluate_treatment("Paracetamol bolus 1000mg", symptom_duration_days=6, critical_signs=[], lang="en")
    assert res["final_risk_level"] == 2
    assert res["heuristic_override"] is True
    assert any("> 4-day threshold" in r for r in res["override_reasons"])
    print("[PASS] test_duration_override (>4 days escalates to Level 2)")

def test_critical_signs_override_marathi():
    engine = MedicationRiskModel()
    res = engine.evaluate_treatment("हळद व कडुलिंब मलम", symptom_duration_days=2, critical_signs=["रक्तस्राव"], lang="mr")
    assert res["final_risk_level"] == 2
    assert res["heuristic_override"] is True
    assert any("आणीबाणी चेतावणी" in r for r in res["override_reasons"])
    print("[PASS] test_critical_signs_override_marathi (Escalates to Level 2 in Marathi)")

if __name__ == "__main__":
    test_safe_medication()
    test_prescription_medication()
    test_duration_override()
    test_critical_signs_override_marathi()
    print("All Medication Risk tests passed successfully!")
