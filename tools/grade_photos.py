#!/usr/bin/env python3
"""Colour-grade the founder's photos into the site's warm, moody cocoa look and export slot files.

Usage:  python3 tools/grade_photos.py [ORIGINALS_DIR] [COMPARE_DIR]
Defaults: /workspace/shared/zafe-chokola/genelle-uploads/originals  ->  images/<slot>
          comparisons + contact sheet -> /workspace/shared/zafe-chokola/genelle-uploads/
Originals are never modified. Edit SLOTS below to change which photo goes where / the crop.
Grade: warm white balance, gentle S-curve (rich contrast), slightly lifted blacks, rolled-off
highlights, split-tone (cocoa shadows / ivory-gold highlights), deeper browns, soft vignette.
"""
import sys, pathlib
import numpy as np
from PIL import Image, ImageOps, ImageDraw, ImageFont, ImageFilter

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "/workspace/shared/zafe-chokola/genelle-uploads/originals")
CMP = pathlib.Path(sys.argv[2] if len(sys.argv) > 2 else "/workspace/shared/zafe-chokola/genelle-uploads")

# slot path -> (source file, target size, crop centre (x, y) as fractions, zoom >= 1 tightens the crop, vignette strength)
SLOTS = {
    "hero.jpg":              ("A1703578-14DA-4867-BC1D-7ACEB4EED703.jpg", (1800, 1100), (0.50, 0.62), 1.0, 0.70),
    "story.jpg":             ("18CB2514-C500-4CDA-A784-977235401374.jpg", (1000, 1250), (0.50, 0.42), 1.0, 0.65),
    "seasonal/valentines.jpg": ("A1703578-14DA-4867-BC1D-7ACEB4EED703.jpg", (800, 600), (0.40, 0.35), 1.25, 0.65),
    "seasonal/easter.jpg":   ("A7CC3162-F1D7-4C32-8C7F-83600BF118DB.jpg", (800, 600), (0.42, 0.38), 1.0, 0.65),
    "seasonal/halloween.jpg": ("IMG_6470.PNG", (800, 600), (0.42, 0.50), 1.15, 0.65),
}

def crop_to(im, size, centre, zoom):
    tw, th = size; W, H = im.size; ar = tw / th
    cw, ch = (W, W / ar) if W / H < ar else (H * ar, H)
    cw, ch = cw / zoom, ch / zoom
    cx = min(max(centre[0] * W, cw / 2), W - cw / 2); cy = min(max(centre[1] * H, ch / 2), H - ch / 2)
    box = tuple(int(round(v)) for v in (cx - cw / 2, cy - ch / 2, cx + cw / 2, cy + ch / 2))
    return im.crop(box).resize(size, Image.LANCZOS)

def grade(im, vignette=0.45):
    a = np.asarray(im.convert("RGB")).astype(np.float32) / 255.0
    # 1. warm white balance + slight exposure pull-down for a moodier base
    a = a * np.array([1.05, 0.96, 0.82], dtype=np.float32) * 0.86
    a = np.clip(a, 0, 1) ** 1.12   # gamma > 1 deepens mid-tones (moody)
    # 2. S-curve for richer contrast (smoothstep blend)
    s = a * a * (3 - 2 * a)
    a = 0.45 * a + 0.55 * s
    # 3. lift blacks / roll off highlights (matte, never pure white)
    a = 0.04 + a * (0.84 - 0.04)
    # 4. split tone: shadows -> cocoa, highlights -> ivory/gold
    lum = (0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2])[..., None]
    cocoa = np.array([0.20, 0.12, 0.08], dtype=np.float32)
    ivory = np.array([0.99, 0.93, 0.82], dtype=np.float32)
    a = a + (1 - lum) ** 2 * 0.30 * (cocoa - a)
    a = a + lum ** 2 * 0.16 * (ivory * 0.86 - a)
    # 5. deeper browns: boost saturation a little, mostly in warm mid/dark tones
    lum = (0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2])[..., None]
    warm = np.clip((a[..., 0:1] - a[..., 2:3]) * 4, 0, 1)
    sat = 1.06 + 0.12 * warm * (1 - lum)
    a = lum + (a - lum) * sat
    # 6. soft vignette (elliptical, feathered)
    h, w = a.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    r = np.sqrt(((xx - w / 2) / (w / 2)) ** 2 + ((yy - h / 2) / (h / 2)) ** 2) / np.sqrt(2)
    v = 1 - vignette * np.clip((r - 0.25) / 0.75, 0, 1) ** 1.6
    a = a * v[..., None]
    return Image.fromarray((np.clip(a, 0, 1) * 255 + 0.5).astype(np.uint8))

def label(img, text):
    d = ImageDraw.Draw(img)
    try: f = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 22)
    except Exception: f = ImageFont.load_default()
    d.rectangle((0, 0, img.width, 38), fill=(30, 20, 16)); d.text((12, 7), text, fill=(226, 197, 136), font=f)

def main():
    out_pairs = []
    for slot, (src, size, centre, zoom, vig) in SLOTS.items():
        im = ImageOps.exif_transpose(Image.open(SRC / src)).convert("RGB")
        c = crop_to(im, size, centre, zoom)
        g = grade(c, vig)
        dst = ROOT / "images" / slot; dst.parent.mkdir(parents=True, exist_ok=True)
        g.save(dst, "JPEG", quality=80, optimize=True, progressive=True)
        print(f"{slot:28s} <- {src}  {size}  {dst.stat().st_size // 1024} KB")
        # side-by-side before/after (same crop)
        H = 600; bw = int(c.width * H / c.height)
        b, a = c.resize((bw, H), Image.LANCZOS), g.resize((bw, H), Image.LANCZOS)
        cmp_img = Image.new("RGB", (bw * 2 + 12, H), (30, 20, 16))
        cmp_img.paste(b, (0, 0)); cmp_img.paste(a, (bw + 12, 0))
        label_b, label_a = b.copy(), a.copy()
        name = slot.replace("/", "-").rsplit(".", 1)[0]
        tmp = cmp_img.crop((0, 0, bw, H)); label(tmp, f"BEFORE  {src[:18]}"); cmp_img.paste(tmp, (0, 0))
        tmp = cmp_img.crop((bw + 12, 0, bw * 2 + 12, H)); label(tmp, f"AFTER  images/{slot}"); cmp_img.paste(tmp, (bw + 12, 0))
        p = CMP / f"compare-{name}.jpg"; cmp_img.save(p, quality=85); out_pairs.append(p)
    # contact sheet of all comparisons
    ims = [Image.open(p) for p in out_pairs]; W = 1600
    rows = [im.resize((W, int(im.height * W / im.width))) if im.width > W else im for im in ims]
    sheet = Image.new("RGB", (W, sum(r.height for r in rows) + 12 * (len(rows) + 1)), (248, 241, 230))
    y = 12
    for r in rows: sheet.paste(r, ((W - r.width) // 2, y)); y += r.height + 12
    sheet.save(CMP / "contact-sheet.jpg", quality=82); print("contact sheet:", CMP / "contact-sheet.jpg")

if __name__ == "__main__":
    main()
