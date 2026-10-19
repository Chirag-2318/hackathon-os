import os
from PIL import Image

signin_dir = os.path.abspath("frontend/public/signin")

frames = [
    ("signin-01-first-light", "signin-01-first-light.png"),
    ("signin-02-long-middle", "signin-02-long-middle.png"),
    ("signin-03-last-hour", "signin-03-last-hour.png"),
]

widths = [960, 1440, 2000]

dominant_colors = {}

for prefix, filename in frames:
    src_path = os.path.join(signin_dir, filename)
    print(f"Processing {src_path}...")
    with Image.open(src_path) as img:
        img_rgb = img.convert("RGB")
        
        # Calculate dominant color (sample corners and average darkest tones)
        small = img_rgb.resize((32, 32))
        colors = small.getcolors(1024)
        if colors:
            sorted_colors = sorted(colors, key=lambda c: c[0], reverse=True)
            # Find the most frequent dark tone
            dom_rgb = sorted_colors[0][1]
            dom_hex = f"#{dom_rgb[0]:02X}{dom_rgb[1]:02X}{dom_rgb[2]:02X}"
        else:
            dom_hex = "#0C0B0A"
        dominant_colors[prefix] = dom_hex
        print(f"  Dominant color: {dom_hex}")
        
        orig_w, orig_h = img_rgb.size
        
        for w in widths:
            h = int(orig_h * (w / orig_w))
            resized = img_rgb.resize((w, h), Image.Resampling.LANCZOS)
            
            # 1. AVIF
            avif_path = os.path.join(signin_dir, f"{prefix}-{w}.avif")
            resized.save(avif_path, "AVIF", quality=85)
            print(f"    Saved {avif_path} ({os.path.getsize(avif_path)} bytes)")
            
            # 2. WEBP
            webp_path = os.path.join(signin_dir, f"{prefix}-{w}.webp")
            resized.save(webp_path, "WEBP", quality=88)
            print(f"    Saved {webp_path} ({os.path.getsize(webp_path)} bytes)")
            
            # 3. JPG
            jpg_path = os.path.join(signin_dir, f"{prefix}-{w}.jpg")
            resized.save(jpg_path, "JPEG", quality=90)
            print(f"    Saved {jpg_path} ({os.path.getsize(jpg_path)} bytes)")

print("\nDone! Dominant colors:")
print(dominant_colors)
