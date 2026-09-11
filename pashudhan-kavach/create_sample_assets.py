"""
Utility to generate synthetic demonstration livestock pathology test images.
Used for 1-click test cases and offline test verifications.
"""

import os
import math
from PIL import Image, ImageDraw, ImageFilter

OUTPUT_DIR = r"C:\Users\dell\.gemini\antigravity\scratch\pashudhan-kavach\static\samples"
os.makedirs(OUTPUT_DIR, exist_ok=True)

def generate_lsd_sample():
    """Generate image depicting firm circumscribed dermal nodules (LSD)."""
    img = Image.new("RGB", (320, 320), color=(168, 140, 115)) # Cattle skin base
    draw = ImageDraw.Draw(img)
    
    # Draw hair coat texture
    for i in range(0, 320, 4):
        draw.line([(i, 0), (i + 2, 320)], fill=(155, 128, 105), width=1)
        
    # Draw multiple prominent raised round nodules with dark centers and erythematous rings
    nodule_centers = [
        (80, 90, 32), (180, 70, 38), (140, 160, 42), 
        (240, 170, 35), (90, 230, 36), (200, 250, 40),
        (270, 90, 24), (50, 160, 28)
    ]
    
    for x, y, r in nodule_centers:
        # Erythematous inflammatory ring
        draw.ellipse([x - r, y - r, x + r, y + r], fill=(195, 85, 75))
        # Raised nodular core
        draw.ellipse([x - r + 5, y - r + 5, x + r - 5, y + r - 5], fill=(145, 65, 55))
        # Necrotic scab center
        draw.ellipse([x - r // 2, y - r // 2, x + r // 2, y + r // 2], fill=(85, 38, 30))
        # Highlight reflection
        draw.arc([x - r + 6, y - r + 6, x + r - 6, y + r - 6], 180, 270, fill=(220, 180, 170), width=2)
        
    img = img.filter(ImageFilter.GaussianBlur(1))
    path = os.path.join(OUTPUT_DIR, "lsd_sample.jpg")
    img.save(path, "JPEG", quality=90)
    print(f"Generated LSD test asset: {path}")

def generate_fmd_sample():
    """Generate image depicting ulcerative oral mucosal vesicles & frothing (FMD)."""
    img = Image.new("RGB", (320, 320), color=(215, 65, 70)) # Oral mucosal red
    draw = ImageDraw.Draw(img)
    
    # Draw mucosal texture
    for y in range(0, 320, 6):
        draw.line([(0, y), (320, y)], fill=(195, 45, 50), width=2)
        
    # Draw ruptured vesicles and raw ulcerative erosions
    ulcers = [
        (100, 110, 50, 35), (190, 140, 65, 40), (130, 210, 55, 38), (220, 80, 40, 25)
    ]
    for x, y, rx, ry in ulcers:
        # Red eroded ulcer bed
        draw.ellipse([x - rx, y - ry, x + rx, y + ry], fill=(235, 30, 40))
        # Whitish ragged fibrinous mucosal fringe
        draw.ellipse([x - rx + 6, y - ry + 4, x + rx - 6, y + ry - 4], fill=(245, 210, 210))
        # Deep bleeding core
        draw.ellipse([x - rx // 2, y - ry // 2, x + rx // 2, y + ry // 2], fill=(160, 15, 25))
        
    # Draw frothy hyper-salivation bubbles
    bubbles = [(70, 260, 18), (110, 280, 22), (160, 270, 26), (220, 285, 20), (270, 260, 16)]
    for bx, by, br in bubbles:
        draw.ellipse([bx - br, by - br, bx + br, by + br], fill=(250, 250, 255))
        draw.ellipse([bx - br + 3, by - br + 3, bx + br - 3, by + br - 3], fill=(230, 240, 255))
        
    img = img.filter(ImageFilter.GaussianBlur(1))
    path = os.path.join(OUTPUT_DIR, "fmd_sample.jpg")
    img.save(path, "JPEG", quality=90)
    print(f"Generated FMD test asset: {path}")

def generate_healthy_sample():
    """Generate image depicting clean, normal bovine dermis."""
    img = Image.new("RGB", (320, 320), color=(140, 115, 90))
    draw = ImageDraw.Draw(img)
    
    # Smooth consistent healthy hair coat
    for i in range(0, 320, 3):
        draw.line([(i, 0), (i + 1, 320)], fill=(148, 123, 98), width=1)
        
    # Healthy subtle hair shine highlight
    draw.ellipse([80, 40, 240, 200], fill=None, outline=(165, 140, 115), width=4)
    img = img.filter(ImageFilter.GaussianBlur(1.5))
    path = os.path.join(OUTPUT_DIR, "healthy_sample.jpg")
    img.save(path, "JPEG", quality=90)
    print(f"Generated Healthy test asset: {path}")

if __name__ == "__main__":
    generate_lsd_sample()
    generate_fmd_sample()
    generate_healthy_sample()
