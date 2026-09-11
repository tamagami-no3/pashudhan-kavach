"""
Automated unit tests for RAG Clinical Retrieval Engine.
"""

import sys
import os

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from rag_engine import VeterinaryRAGEngine

def test_fmd_retrieval_english():
    engine = VeterinaryRAGEngine()
    query = "blisters on tongue, excessive salivation, frothing and lameness"
    results = engine.retrieve(query, visual_symptoms=["mouth vesicles"], lang="en")
    assert len(results) > 0
    top = results[0]
    assert top["disease_code"] == "fmd"
    assert "Potassium Permanganate" in top["chemical_wash"]
    assert "100 meters" in top["quarantine_protocol"]
    print("[PASS] test_fmd_retrieval_english")

def test_lsd_retrieval_marathi():
    engine = VeterinaryRAGEngine()
    query = "अंगावर कडक गाठी आल्या आहेत, तीव्र ताप आहे आणि पाय सुजले आहेत"
    results = engine.retrieve(query, visual_symptoms=["त्वचेवरील गाठी"], lang="mr")
    assert len(results) > 0
    top = results[0]
    assert top["disease_code"] == "lsd"
    assert "लाल औषध" in top["chemical_wash"] or "पोटॅशियम" in top["chemical_wash"]
    print("[PASS] test_lsd_retrieval_marathi")

def test_hs_retrieval_hindi():
    engine = VeterinaryRAGEngine()
    query = "गले में भारी सूजन है, सांस घुरघुरा कर ले रहा है, 106 डिग्री तेज बुखार"
    results = engine.retrieve(query, visual_symptoms=["गले में सूजन"], lang="hi")
    assert len(results) > 0
    top = results[0]
    assert top["disease_code"] == "hs"
    assert "गलघोंटू" in top["disease_name"] or "घटसर्प" in top["disease_name"]
    print("[PASS] test_hs_retrieval_hindi")

if __name__ == "__main__":
    test_fmd_retrieval_english()
    test_lsd_retrieval_marathi()
    test_hs_retrieval_hindi()
    print("All RAG tests passed successfully!")
