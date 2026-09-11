"""
Master test runner for Pashudhan Kavach system test suites.
"""

import subprocess
import sys

scripts = [
    "tests/test_rag.py",
    "tests/test_med_risk.py",
    "tests/test_geo_alert.py",
    "tests/test_cv.py",
    "tests/test_api.py"
]

all_passed = True
for s in scripts:
    print(f"\n================ Running {s} ================")
    ret = subprocess.run([sys.executable, s])
    if ret.returncode != 0:
        all_passed = False
        print(f"FAILED: {s}")
        break

if all_passed:
    print("\n==============================================")
    print("ALL 5 TEST SUITES PASSED SUCCESSFULLY (100%)!")
    print("==============================================")
else:
    sys.exit(1)
