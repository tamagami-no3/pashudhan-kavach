"""
Automated unit tests for MobileNetV3 Pathology Computer Vision Engine.
"""

import sys
import os
from PIL import Image

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from cv_engine import cv_engine

def test_lsd_image_analysis():
    sample_path = os.path.join(PROJECT_ROOT, "static", "samples", "lsd_sample.jpg")
    assert os.path.exists(sample_path)
    img = Image.open(sample_path)
    res = cv_engine.analyze_pathology(img, lang="en")
    
    assert res["predicted_code"] == "lsd"
    assert res["confidence"] >= 80.0
    assert "tensor_features" in res
    assert res["tensor_features"]["feature_dim"] == 576
    print(f"[PASS] test_lsd_image_analysis (Predicted: {res['predicted_code']}, Conf: {res['confidence']}%)")

def test_fmd_image_analysis_marathi():
    sample_path = os.path.join(PROJECT_ROOT, "static", "samples", "fmd_sample.jpg")
    assert os.path.exists(sample_path)
    img = Image.open(sample_path)
    res = cv_engine.analyze_pathology(img, lang="mr")
    
    assert res["predicted_code"] == "fmd"
    assert res["confidence"] >= 80.0
    print(f"[PASS] test_fmd_image_analysis_marathi (Predicted: {res['predicted_code']}, Conf: {res['confidence']}%)")

def test_healthy_image_analysis_hindi():
    sample_path = os.path.join(PROJECT_ROOT, "static", "samples", "healthy_sample.jpg")
    assert os.path.exists(sample_path)
    img = Image.open(sample_path)
    res = cv_engine.analyze_pathology(img, lang="hi")
    
    assert res["predicted_code"] == "healthy"
    assert res["confidence"] >= 80.0
    print(f"[PASS] test_healthy_image_analysis_hindi (Predicted: {res['predicted_code']}, Conf: {res['confidence']}%)")

if __name__ == "__main__":
    test_lsd_image_analysis()
    test_fmd_image_analysis_marathi()
    test_healthy_image_analysis_hindi()
    print("All Computer Vision tests passed successfully!")
